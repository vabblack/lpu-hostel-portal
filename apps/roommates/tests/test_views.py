"""
Integration and view tests for Roommate Management views:
Preferences, Discover feed, Request actions, and Group lifecycle.
"""
import datetime
import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone

from apps.accounts.models import Role
from apps.academics.models import (
    University,
    Department,
    DegreeProgram,
    Branch,
    AdmissionBatch,
    StudentRegistry,
    Gender,
)
from apps.students.models import StudentProfile
from apps.hostels.models import (
    Hostel,
    Block,
    Floor,
    Room,
    GenderPolicy,
)
from apps.applications.models import (
    AccommodationCycle,
    HostelApplication,
    ApplicationChoice,
    ApplicationStatus,
)
from apps.roommates.models import (
    RoommatePreference,
    RoommateRequest,
    RoommateGroup,
    FoodPreference,
    RequestStatus,
)

User = get_user_model()


@pytest.mark.django_db
class TestRoommateViews:
    """Test suite for roommate management views and HTTP actions."""

    @pytest.fixture
    def view_setup(self, client):
        """Fixture for setting up students, cycle, and applications."""
        univ = University.objects.create(name='LPU Main Campus', code='LPU-VIEW')
        dept = Department.objects.create(university=univ, name='School of CSE', code='CSE')
        prog = DegreeProgram.objects.create(department=dept, name='B.Tech CSE', duration_years=4)
        branch = Branch.objects.create(program=prog, name='Computer Science', code='CS')
        batch = AdmissionBatch.objects.create(program=prog, year=2024)

        # Student 1
        reg1 = StudentRegistry.objects.create(
            student_id='V2024CS001', full_name='Alice View 1', institutional_email='v1@lpu.in',
            gender=Gender.MALE, date_of_birth=datetime.date(2004, 1, 1), branch=branch, batch=batch
        )
        user1 = User.objects.create_user(email='v1@lpu.in', password='Password123!', student_id_login='V2024CS001', role=Role.STUDENT)
        s1 = StudentProfile.objects.create(user=user1, registry=reg1)

        # Student 2
        reg2 = StudentRegistry.objects.create(
            student_id='V2024CS002', full_name='Bob View 2', institutional_email='v2@lpu.in',
            gender=Gender.MALE, date_of_birth=datetime.date(2004, 2, 2), branch=branch, batch=batch
        )
        user2 = User.objects.create_user(email='v2@lpu.in', password='Password123!', student_id_login='V2024CS002', role=Role.STUDENT)
        s2 = StudentProfile.objects.create(user=user2, registry=reg2)

        cycle = AccommodationCycle.objects.create(
            academic_year='2026-2027', semester=1, name='Fall 2026',
            application_start=timezone.now() - datetime.timedelta(days=1),
            application_end=timezone.now() + datetime.timedelta(days=15),
            is_active=True
        )

        hostel = Hostel.objects.create(university=univ, name='Men Dorm', code='MD1', gender_policy=GenderPolicy.MALE)
        block = Block.objects.create(hostel=hostel, name='Block A')
        floor = Floor.objects.create(block=block, floor_number=1)
        room = Room.objects.create(floor=floor, room_number='101', capacity=2)

        # Applications
        app1 = HostelApplication.objects.create(student=s1, cycle=cycle, status=ApplicationStatus.SUBMITTED)
        ApplicationChoice.objects.create(application=app1, hostel=hostel, priority=1, room=room)

        app2 = HostelApplication.objects.create(student=s2, cycle=cycle, status=ApplicationStatus.SUBMITTED)
        ApplicationChoice.objects.create(application=app2, hostel=hostel, priority=1, room=room)

        return {
            'client': client,
            's1': s1,
            's2': s2,
            'user1': user1,
            'user2': user2,
            'cycle': cycle,
            'room': room,
        }

    def test_unauthenticated_redirect(self, view_setup):
        """Unauthenticated requests redirect to login."""
        client = view_setup['client']
        resp = client.get(reverse('roommates:discover'))
        assert resp.status_code == 302
        assert reverse('accounts:login') in resp.url

    def test_preferences_view_get_and_post(self, view_setup):
        """Student can view and submit 7-factor questionnaire."""
        client = view_setup['client']
        s1 = view_setup['s1']
        client.force_login(s1.user)

        # GET
        resp = client.get(reverse('roommates:preferences'))
        assert resp.status_code == 200
        assert b"Roommate Lifestyle Compatibility Profile" in resp.content

        # POST valid
        post_data = {
            'sleeping_schedule': 2,
            'cleanliness': 4,
            'study_habits': 3,
            'noise_tolerance': 3,
            'food_preference': FoodPreference.VEGETARIAN,
            'social_preference': 3,
            'temperature_pref': 4,
        }
        post_resp = client.post(reverse('roommates:preferences'), post_data)
        assert post_resp.status_code == 302
        assert post_resp.url == reverse('roommates:discover')

        pref = RoommatePreference.objects.get(student=s1)
        assert pref.cleanliness == 4
        assert pref.food_preference == FoodPreference.VEGETARIAN

    def test_discover_view_renders_candidates(self, view_setup):
        """Discover view lists compatible candidates ranked by score."""
        client = view_setup['client']
        s1 = view_setup['s1']
        s2 = view_setup['s2']

        # Both have preferences
        RoommatePreference.objects.create(
            student=s1, sleeping_schedule=3, cleanliness=4, study_habits=3,
            noise_tolerance=3, food_preference=FoodPreference.VEGETARIAN,
            social_preference=3, temperature_pref=4
        )
        RoommatePreference.objects.create(
            student=s2, sleeping_schedule=3, cleanliness=4, study_habits=3,
            noise_tolerance=3, food_preference=FoodPreference.VEGETARIAN,
            social_preference=3, temperature_pref=4
        )

        client.force_login(s1.user)
        resp = client.get(reverse('roommates:discover'))
        assert resp.status_code == 200
        assert b"Bob View 2" in resp.content
        assert b"100.00%" in resp.content

    def test_direct_student_id_search(self, view_setup):
        """Student can search directly by Student ID."""
        client = view_setup['client']
        s1 = view_setup['s1']
        client.force_login(s1.user)

        resp = client.get(reverse('roommates:discover') + '?q=V2024CS002')
        assert resp.status_code == 200
        assert b"Bob View 2" in resp.content
        assert b"V2024CS002" in resp.content

    def test_send_and_respond_request_actions(self, view_setup):
        """End-to-end send and accept request action flows."""
        client = view_setup['client']
        s1 = view_setup['s1']
        s2 = view_setup['s2']

        # 1. Student 1 sends request to Student 2
        client.force_login(s1.user)
        send_resp = client.post(reverse('roommates:send_request'), {'target_student_id': 'V2024CS002'})
        assert send_resp.status_code == 302

        req = RoommateRequest.objects.get(sender=s1, receiver=s2)
        assert req.status == RequestStatus.PENDING

        # 2. Student 2 accepts request
        client.force_login(s2.user)
        accept_resp = client.post(reverse('roommates:respond_request', kwargs={'request_id': req.pk}), {'action': 'ACCEPT'})
        assert accept_resp.status_code == 302

        req.refresh_from_db()
        assert req.status == RequestStatus.ACCEPTED

        # Roommate group formed and confirmed
        group = RoommateGroup.objects.get(cycle=view_setup['cycle'])
        assert group.is_confirmed is True
        assert group.member_count == 2

