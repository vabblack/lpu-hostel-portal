"""
Unit and integration tests for roommate request lifecycle, mutual room alignment enforcement,
gender segregation, and capacity bounds.
"""
import datetime
import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils import timezone

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
    RoommateRequest,
    RoommateGroup,
    RoommateGroupMember,
    RequestStatus,
)
from apps.roommates.services.requests import (
    send_roommate_request,
    respond_to_roommate_request,
    cancel_roommate_request,
    leave_roommate_group,
)

User = get_user_model()


@pytest.mark.django_db
class TestRoommateRequests:
    """Test suite for roommate request services and mutual room alignment."""

    @pytest.fixture
    def setup_data(self):
        """Set up university, students, hostels, cycle, and applications."""
        univ = University.objects.create(name='LPU Main Campus', code='LPU-MAIN')
        dept = Department.objects.create(university=univ, name='School of CSE', code='CSE')
        prog = DegreeProgram.objects.create(department=dept, name='B.Tech CSE', duration_years=4)
        branch = Branch.objects.create(program=prog, name='Computer Science', code='CS')
        batch = AdmissionBatch.objects.create(program=prog, year=2024)

        # Student A (Male)
        reg_a = StudentRegistry.objects.create(
            student_id='2024CS001', full_name='Alice Male A', institutional_email='a@lpu.in',
            gender=Gender.MALE, date_of_birth=datetime.date(2004, 1, 1), branch=branch, batch=batch
        )
        user_a = User.objects.create_user(email='a@lpu.in', password='Password123!', student_id_login='2024CS001')
        student_a = StudentProfile.objects.create(user=user_a, registry=reg_a)

        # Student B (Male)
        reg_b = StudentRegistry.objects.create(
            student_id='2024CS002', full_name='Bob Male B', institutional_email='b@lpu.in',
            gender=Gender.MALE, date_of_birth=datetime.date(2004, 2, 2), branch=branch, batch=batch
        )
        user_b = User.objects.create_user(email='b@lpu.in', password='Password123!', student_id_login='2024CS002')
        student_b = StudentProfile.objects.create(user=user_b, registry=reg_b)

        # Student C (Female)
        reg_c = StudentRegistry.objects.create(
            student_id='2024CS003', full_name='Chloe Female C', institutional_email='c@lpu.in',
            gender=Gender.FEMALE, date_of_birth=datetime.date(2004, 3, 3), branch=branch, batch=batch
        )
        user_c = User.objects.create_user(email='c@lpu.in', password='Password123!', student_id_login='2024CS003')
        student_c = StudentProfile.objects.create(user=user_c, registry=reg_c)

        # Accommodation Cycle
        cycle = AccommodationCycle.objects.create(
            academic_year='2026-2027', semester=1, name='Fall 2026',
            application_start=timezone.now() - datetime.timedelta(days=1),
            application_end=timezone.now() + datetime.timedelta(days=15),
            is_active=True
        )

        # Hostels & Rooms
        hostel_m = Hostel.objects.create(university=univ, name='Boys Tower 1', code='BT1', gender_policy=GenderPolicy.MALE)
        block_m = Block.objects.create(hostel=hostel_m, name='Block A')
        floor_m = Floor.objects.create(block=block_m, floor_number=1)
        room_101 = Room.objects.create(floor=floor_m, room_number='101', capacity=2)
        room_102 = Room.objects.create(floor=floor_m, room_number='102', capacity=2)

        # Student A Application for Room 101
        app_a = HostelApplication.objects.create(student=student_a, cycle=cycle, status=ApplicationStatus.SUBMITTED)
        ApplicationChoice.objects.create(application=app_a, hostel=hostel_m, priority=1, room=room_101)

        # Student B Application for Room 101
        app_b = HostelApplication.objects.create(student=student_b, cycle=cycle, status=ApplicationStatus.SUBMITTED)
        ApplicationChoice.objects.create(application=app_b, hostel=hostel_m, priority=1, room=room_101)

        return {
            'student_a': student_a,
            'student_b': student_b,
            'student_c': student_c,
            'cycle': cycle,
            'room_101': room_101,
            'room_102': room_102,
            'hostel_m': hostel_m,
            'app_b': app_b,
        }

    def test_send_roommate_request_success(self, setup_data):
        """Rule 12: Student A can successfully send a roommate request to Student B."""
        student_a = setup_data['student_a']
        student_b = setup_data['student_b']
        cycle = setup_data['cycle']

        req = send_roommate_request(student_a, '2024CS002', cycle)
        assert req.pk is not None
        assert req.sender == student_a
        assert req.receiver == student_b
        assert req.status == RequestStatus.PENDING

    def test_self_request_rejected(self, setup_data):
        """A student cannot send a request to themselves."""
        student_a = setup_data['student_a']
        cycle = setup_data['cycle']

        with pytest.raises(ValidationError, match="cannot send a roommate request to yourself"):
            send_roommate_request(student_a, '2024CS001', cycle)

    def test_cross_gender_request_rejected(self, setup_data):
        """Gender policy: Requests between male and female students are strictly blocked."""
        student_a = setup_data['student_a']
        cycle = setup_data['cycle']

        with pytest.raises(ValidationError, match="same gender"):
            send_roommate_request(student_a, '2024CS003', cycle)

    def test_duplicate_pending_request_blocked(self, setup_data):
        """Cannot send a second pending request to the same student."""
        student_a = setup_data['student_a']
        cycle = setup_data['cycle']

        send_roommate_request(student_a, '2024CS002', cycle)
        with pytest.raises(ValidationError, match="already have a pending roommate request"):
            send_roommate_request(student_a, '2024CS002', cycle)

    def test_accept_request_creates_confirmed_group(self, setup_data):
        """
        Decision 4: When both students have selected Room 101, accepting the request
        forms a RoommateGroup and marks it confirmed (since Room 101 has capacity=2).
        """
        student_a = setup_data['student_a']
        student_b = setup_data['student_b']
        cycle = setup_data['cycle']
        room_101 = setup_data['room_101']

        req = send_roommate_request(student_a, '2024CS002', cycle)
        accepted_req = respond_to_roommate_request(req.pk, student_b, 'ACCEPT')

        assert accepted_req.status == RequestStatus.ACCEPTED
        group = RoommateGroup.objects.get(cycle=cycle, target_room=room_101)
        assert group.member_count == 2
        assert group.is_confirmed is True

    def test_mutual_room_alignment_failure(self, setup_data):
        """
        Decision 4: Accepting a request fails if the receiver's application
        targets a different room than the sender's.
        """
        student_a = setup_data['student_a']
        student_b = setup_data['student_b']
        cycle = setup_data['cycle']
        room_102 = setup_data['room_102']
        app_b = setup_data['app_b']

        # Change Student B's preferred room to Room 102
        choice_b = app_b.choices.first()
        choice_b.room = room_102
        choice_b.save()

        req = send_roommate_request(student_a, '2024CS002', cycle)

        with pytest.raises(ValidationError, match="Mutual room alignment failed"):
            respond_to_roommate_request(req.pk, student_b, 'ACCEPT')

    def test_reject_request(self, setup_data):
        """Receiver can reject a pending request."""
        student_a = setup_data['student_a']
        student_b = setup_data['student_b']
        cycle = setup_data['cycle']

        req = send_roommate_request(student_a, '2024CS002', cycle)
        rejected_req = respond_to_roommate_request(req.pk, student_b, 'REJECT')

        assert rejected_req.status == RequestStatus.REJECTED
        assert RoommateGroup.objects.filter(cycle=cycle).count() == 0

    def test_cancel_request(self, setup_data):
        """Sender can cancel their own pending request."""
        student_a = setup_data['student_a']
        cycle = setup_data['cycle']

        req = send_roommate_request(student_a, '2024CS002', cycle)
        cancelled = cancel_roommate_request(req.pk, student_a)

        assert cancelled.status == RequestStatus.CANCELLED

    def test_leave_group_and_disband(self, setup_data):
        """Leaving a 2-person group disbands the group."""
        student_a = setup_data['student_a']
        student_b = setup_data['student_b']
        cycle = setup_data['cycle']

        req = send_roommate_request(student_a, '2024CS002', cycle)
        respond_to_roommate_request(req.pk, student_b, 'ACCEPT')

        group = RoommateGroup.objects.get(cycle=cycle)
        leave_roommate_group(group.pk, student_a)

        assert RoommateGroup.objects.filter(pk=group.pk).count() == 0
