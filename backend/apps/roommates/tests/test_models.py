"""
Unit tests for roommate preferences, mutual requests, and groups in apps.roommates.
"""
import datetime
from django.utils import timezone
import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
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
from apps.applications.models import AccommodationCycle
from apps.roommates.models import (
    RoommatePreference,
    RoommateRequest,
    RoommateGroup,
    RoommateGroupMember,
    MatchScore,
    FoodPreference,
    RequestStatus,
)

User = get_user_model()


@pytest.mark.django_db
class TestRoommatesModels:
    """Test suite for roommate models."""

    @pytest.fixture
    def roommate_setup(self):
        """Fixture for setting up 2 students, accommodation cycle, and room."""
        univ = University.objects.create(name='LPU Roommate Univ', code='LPU-RM')
        dept = Department.objects.create(university=univ, name='CSE', code='CS')
        prog = DegreeProgram.objects.create(department=dept, name='B.Tech', duration_years=4)
        branch = Branch.objects.create(program=prog, name='CSE', code='CSE')
        batch = AdmissionBatch.objects.create(program=prog, year=2024)

        reg1 = StudentRegistry.objects.create(
            student_id='RM101', full_name='Student Alpha', institutional_email='alpha@lpu.in',
            gender=Gender.MALE, date_of_birth=datetime.date(2004, 1, 1), branch=branch, batch=batch
        )
        reg2 = StudentRegistry.objects.create(
            student_id='RM102', full_name='Student Beta', institutional_email='beta@lpu.in',
            gender=Gender.MALE, date_of_birth=datetime.date(2004, 2, 2), branch=branch, batch=batch
        )

        user1 = User.objects.create_user(email='alpha@lpu.in', password='Password123!', student_id_login='RM101')
        user2 = User.objects.create_user(email='beta@lpu.in', password='Password123!', student_id_login='RM102')

        student1 = StudentProfile.objects.create(user=user1, registry=reg1)
        student2 = StudentProfile.objects.create(user=user2, registry=reg2)

        hostel = Hostel.objects.create(university=univ, name='Hostel RM', code='HRM', gender_policy=GenderPolicy.MALE)
        block = Block.objects.create(hostel=hostel, name='Block 1')
        floor = Floor.objects.create(block=block, floor_number=1)
        room = Room.objects.create(floor=floor, room_number='101', capacity=2)

        cycle = AccommodationCycle.objects.create(
            academic_year='2026-2027', semester=1, name='Fall Intake',
            application_start=timezone.now(), application_end=timezone.now() + datetime.timedelta(days=15),
            is_active=True
        )

        return {
            'student1': student1,
            'student2': student2,
            'cycle': cycle,
            'room': room,
        }

    def test_seven_factor_roommate_preferences(self, roommate_setup):
        """Rule 12: Verify 7 lifestyle preference factors with zero smoking."""
        student1 = roommate_setup['student1']

        pref = RoommatePreference.objects.create(
            student=student1,
            sleeping_schedule=2,
            cleanliness=4,
            study_habits=3,
            noise_tolerance=2,
            food_preference=FoodPreference.VEGETARIAN,
            social_preference=3,
            temperature_pref=4
        )

        assert pref.sleeping_schedule == 2
        assert pref.food_preference == FoodPreference.VEGETARIAN
        # Verify no smoking attribute exists on model
        assert not hasattr(pref, 'smoking')
        assert not hasattr(pref, 'is_smoker')

    def test_roommate_request_creation(self, roommate_setup):
        """Verify direct roommate request from Student 1 to Student 2."""
        student1 = roommate_setup['student1']
        student2 = roommate_setup['student2']
        cycle = roommate_setup['cycle']

        req = RoommateRequest.objects.create(
            sender=student1,
            receiver=student2,
            cycle=cycle,
            status=RequestStatus.PENDING
        )
        assert req.status == RequestStatus.PENDING
        assert str(req) == 'RM101 -> RM102 (Pending Response)'

    def test_self_roommate_request_validation(self, roommate_setup):
        """Verify student cannot request themselves as a roommate."""
        student1 = roommate_setup['student1']
        cycle = roommate_setup['cycle']

        req = RoommateRequest(sender=student1, receiver=student1, cycle=cycle)
        with pytest.raises(ValidationError):
            req.clean()

    def test_roommate_group_and_membership(self, roommate_setup):
        """Verify roommate group formation up to room capacity."""
        student1 = roommate_setup['student1']
        student2 = roommate_setup['student2']
        cycle = roommate_setup['cycle']
        room = roommate_setup['room']

        group = RoommateGroup.objects.create(cycle=cycle, target_room=room, is_confirmed=True)
        RoommateGroupMember.objects.create(group=group, student=student1)
        RoommateGroupMember.objects.create(group=group, student=student2)

        assert group.member_count == 2
        assert group.target_room.capacity == 2

    def test_match_score_creation(self, roommate_setup):
        """Verify match score recording."""
        student1 = roommate_setup['student1']
        student2 = roommate_setup['student2']

        score = MatchScore.objects.create(
            student_a=student1,
            student_b=student2,
            score=87.50,
            algorithm_version='v1.0'
        )
        assert score.score == 87.50
        assert str(score) == 'RM101 <-> RM102: 87.50%'

