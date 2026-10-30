"""
Unit tests for application lifecycle and priority choices in apps.applications.
"""
import datetime
from django.utils import timezone
import pytest
from django.contrib.auth import get_user_model
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
    Bed,
    GenderPolicy,
)
from apps.applications.models import (
    AccommodationCycle,
    HostelApplication,
    ApplicationChoice,
    ApplicationStatus,
)

User = get_user_model()


@pytest.mark.django_db
class TestApplicationsModels:
    """Test suite for application models and multi-priority choices."""

    @pytest.fixture
    def app_setup(self):
        """Fixture for setting up academic, student, and hostel structure."""
        univ = University.objects.create(name='LPU Applications Univ', code='LPU-APP')
        dept = Department.objects.create(university=univ, name='Computer Science', code='CS')
        prog = DegreeProgram.objects.create(department=dept, name='B.Tech CSE', duration_years=4)
        branch = Branch.objects.create(program=prog, name='Software Engineering', code='SE')
        batch = AdmissionBatch.objects.create(program=prog, year=2024)

        registry = StudentRegistry.objects.create(
            student_id='12422001',
            full_name='Applicant One',
            institutional_email='app1@lpu.in',
            gender=Gender.MALE,
            date_of_birth=datetime.date(2004, 6, 10),
            branch=branch,
            batch=batch,
        )

        user = User.objects.create_user(
            email='app1@lpu.in',
            password='Password123!',
            student_id_login='12422001',
            role=Role.STUDENT
        )
        student = StudentProfile.objects.create(user=user, registry=registry)

        # Hostels
        hostel1 = Hostel.objects.create(university=univ, name='Boys Hostel 1', code='BH1', gender_policy=GenderPolicy.MALE)
        hostel2 = Hostel.objects.create(university=univ, name='Boys Hostel 2', code='BH2', gender_policy=GenderPolicy.MALE)

        cycle = AccommodationCycle.objects.create(
            academic_year='2026-2027',
            semester=1,
            name='Academic Year 2026-2027 Intake',
            application_start=timezone.now() - datetime.timedelta(days=1),
            application_end=timezone.now() + datetime.timedelta(days=30),
            is_active=True
        )

        return {
            'student': student,
            'cycle': cycle,
            'hostel1': hostel1,
            'hostel2': hostel2,
        }

    def test_single_application_per_student_per_cycle(self, app_setup):
        """Rule 6: A student can have only one active application per accommodation cycle."""
        student = app_setup['student']
        cycle = app_setup['cycle']

        app = HostelApplication.objects.create(student=student, cycle=cycle)
        assert app.status == ApplicationStatus.SUBMITTED

        with pytest.raises(IntegrityError):
            with transaction.atomic():
                HostelApplication.objects.create(student=student, cycle=cycle)

    def test_application_priority_choices(self, app_setup):
        """Rule 1: Students can select up to 3 hostels in priority order."""
        student = app_setup['student']
        cycle = app_setup['cycle']
        hostel1 = app_setup['hostel1']
        hostel2 = app_setup['hostel2']

        application = HostelApplication.objects.create(student=student, cycle=cycle)

        choice1 = ApplicationChoice.objects.create(application=application, hostel=hostel1, priority=1)
        choice2 = ApplicationChoice.objects.create(application=application, hostel=hostel2, priority=2)

        assert choice1.priority == 1
        assert choice2.priority == 2

        # Duplicate priority rank must fail
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                ApplicationChoice.objects.create(application=application, hostel=hostel1, priority=1)

