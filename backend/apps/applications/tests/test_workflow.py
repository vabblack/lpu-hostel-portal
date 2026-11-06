"""
Integration tests for student application submission, multi-priority choices, and administrative review in Phase 7.
"""
import datetime
from django.utils import timezone
import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError, PermissionDenied
from django.test import RequestFactory
from django.urls import reverse

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
    ApplicationStatus,
)
from apps.applications.services.eligibility import (
    get_active_cycle,
    check_student_eligibility,
    is_hostel_eligible_for_student,
)
from apps.applications.services.submission import (
    submit_hostel_application,
    update_application_status,
)

User = get_user_model()


@pytest.mark.django_db
class TestApplicationWorkflow:
    """Test suite for Phase 7 application services and views."""

    @pytest.fixture
    def setup_workflow(self):
        """Fixture for setting up university, students, hostels, and active intake cycle."""
        univ = University.objects.create(name='LPU Applications Test', code='LPU-AT')
        dept = Department.objects.create(university=univ, name='CSE', code='CS')
        prog = DegreeProgram.objects.create(department=dept, name='B.Tech CSE', duration_years=4)
        branch = Branch.objects.create(program=prog, name='CSE', code='CSE')
        batch = AdmissionBatch.objects.create(program=prog, year=2024)

        # 1. Male student
        reg_male = StudentRegistry.objects.create(
            student_id='STU_M1', full_name='Male Student', institutional_email='male.stu@lpu.in',
            gender=Gender.MALE, date_of_birth=datetime.date(2004, 1, 1), branch=branch, batch=batch
        )
        user_male = User.objects.create_user(email='male.stu@lpu.in', password='Password123!', student_id_login='STU_M1', role=Role.STUDENT)
        student_male = StudentProfile.objects.create(user=user_male, registry=reg_male)

        # 2. Female student
        reg_female = StudentRegistry.objects.create(
            student_id='STU_F1', full_name='Female Student', institutional_email='female.stu@lpu.in',
            gender=Gender.FEMALE, date_of_birth=datetime.date(2004, 2, 2), branch=branch, batch=batch
        )
        user_female = User.objects.create_user(email='female.stu@lpu.in', password='Password123!', student_id_login='STU_F1', role=Role.STUDENT)
        student_female = StudentProfile.objects.create(user=user_female, registry=reg_female)

        # Hostels
        hostel_boys = Hostel.objects.create(university=univ, name='Boys Hostel 1', code='BH1', gender_policy=GenderPolicy.MALE, total_capacity=50)
        hostel_girls = Hostel.objects.create(university=univ, name='Girls Hostel 1', code='GH1', gender_policy=GenderPolicy.FEMALE, total_capacity=50)
        hostel_coed = Hostel.objects.create(university=univ, name='International Hostel', code='IH1', gender_policy=GenderPolicy.CO_ED, total_capacity=50)

        block = Block.objects.create(hostel=hostel_boys, name='Block A')
        floor = Floor.objects.create(block=block, floor_number=1)
        room_b101 = Room.objects.create(floor=floor, room_number='101', capacity=2)

        # Active cycle
        now = timezone.now()
        cycle = AccommodationCycle.objects.create(
            academic_year='2026-2027',
            semester=1,
            name='Fall 2026 Regular Intake',
            application_start=now - datetime.timedelta(days=2),
            application_end=now + datetime.timedelta(days=20),
            is_active=True
        )

        admin_user = User.objects.create_superuser(email='chief.admin@lpu.in', password='Password123!')

        return {
            'student_male': student_male,
            'student_female': student_female,
            'hostel_boys': hostel_boys,
            'hostel_girls': hostel_girls,
            'hostel_coed': hostel_coed,
            'room_b101': room_b101,
            'cycle': cycle,
            'admin_user': admin_user,
        }

    def test_active_cycle_retrieval(self, setup_workflow):
        """Verify active cycle query respects start and end bounds."""
        active = get_active_cycle()
        assert active == setup_workflow['cycle']

    def test_gender_eligibility_enforcement(self, setup_workflow):
        """Rule 8: Verify gender policy rules against student profiles."""
        student_male = setup_workflow['student_male']
        student_female = setup_workflow['student_female']

        # Male student: eligible for Boys & Co-Ed, ineligible for Girls
        assert is_hostel_eligible_for_student(student_male, setup_workflow['hostel_boys']) is True
        assert is_hostel_eligible_for_student(student_male, setup_workflow['hostel_coed']) is True
        assert is_hostel_eligible_for_student(student_male, setup_workflow['hostel_girls']) is False

        # Female student: eligible for Girls & Co-Ed, ineligible for Boys
        assert is_hostel_eligible_for_student(student_female, setup_workflow['hostel_girls']) is True
        assert is_hostel_eligible_for_student(student_female, setup_workflow['hostel_coed']) is True
        assert is_hostel_eligible_for_student(student_female, setup_workflow['hostel_boys']) is False

    def test_submit_multi_priority_application_success(self, setup_workflow):
        """Rule 1 & 2: Students can select up to 3 hostels in priority order."""
        student = setup_workflow['student_male']
        cycle = setup_workflow['cycle']
        h_boys = setup_workflow['hostel_boys']
        h_coed = setup_workflow['hostel_coed']
        room = setup_workflow['room_b101']

        choices = [
            {'priority': 1, 'hostel': h_boys, 'room': room},
            {'priority': 2, 'hostel': h_coed, 'room': None},
        ]

        app = submit_hostel_application(student=student, cycle=cycle, choices_data=choices)

        assert app.status == ApplicationStatus.SUBMITTED
        assert app.choices.count() == 2

        c1 = app.choices.get(priority=1)
        assert c1.hostel == h_boys
        assert c1.room == room

        c2 = app.choices.get(priority=2)
        assert c2.hostel == h_coed
        assert c2.room is None

        # Verify status history logged
        history = app.status_history.first()
        assert history.to_status == ApplicationStatus.SUBMITTED

        # Verify notification created for student
        assert student.user.notifications.filter(title='Application Received').exists()

    def test_reject_ineligible_gender_hostel_choice(self, setup_workflow):
        """Verify male student attempting to apply to girls hostel raises ValidationError."""
        student = setup_workflow['student_male']
        cycle = setup_workflow['cycle']
        h_girls = setup_workflow['hostel_girls']

        with pytest.raises(ValidationError) as exc:
            submit_hostel_application(
                student=student,
                cycle=cycle,
                choices_data=[{'priority': 1, 'hostel': h_girls, 'room': None}]
            )
        assert 'not eligible for your profile' in str(exc.value)

    def test_prevent_multiple_applications_same_cycle(self, setup_workflow):
        """Rule 6: A student can have only one active application per accommodation cycle."""
        student = setup_workflow['student_male']
        cycle = setup_workflow['cycle']
        h_boys = setup_workflow['hostel_boys']

        # First application succeeds
        submit_hostel_application(
            student=student,
            cycle=cycle,
            choices_data=[{'priority': 1, 'hostel': h_boys, 'room': None}]
        )

        # Second application must fail
        with pytest.raises(ValidationError) as exc:
            submit_hostel_application(
                student=student,
                cycle=cycle,
                choices_data=[{'priority': 1, 'hostel': h_boys, 'room': None}]
            )
        assert 'already have an active application' in str(exc.value)

    def test_admin_update_application_status(self, setup_workflow):
        """Verify administrative status change, history logging, and student notification."""
        student = setup_workflow['student_male']
        cycle = setup_workflow['cycle']
        admin = setup_workflow['admin_user']
        h_boys = setup_workflow['hostel_boys']

        app = submit_hostel_application(
            student=student,
            cycle=cycle,
            choices_data=[{'priority': 1, 'hostel': h_boys, 'room': None}]
        )

        # Transition status to APPROVED
        updated_app = update_application_status(
            application=app,
            new_status=ApplicationStatus.APPROVED,
            changed_by=admin,
            notes='Eligible and verified by administrator.'
        )

        assert updated_app.status == ApplicationStatus.APPROVED
        assert updated_app.reviewed_by == admin
        assert updated_app.review_notes == 'Eligible and verified by administrator.'

        # Verify history
        latest_history = updated_app.status_history.order_by('-changed_at').first()
        assert latest_history.from_status == ApplicationStatus.SUBMITTED
        assert latest_history.to_status == ApplicationStatus.APPROVED
        assert latest_history.changed_by == admin
