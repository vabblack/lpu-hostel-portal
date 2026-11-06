"""
Unit tests for StudentProfile model in apps.students.
"""
import datetime
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

User = get_user_model()


@pytest.mark.django_db
class TestStudentProfileModel:
    """Test suite for StudentProfile linking User to StudentRegistry."""

    @pytest.fixture
    def student_fixtures(self):
        """Fixture for setting up user, registry, and academic hierarchy."""
        univ = University.objects.create(name='LPU Punjab', code='LPU-PB')
        dept = Department.objects.create(university=univ, name='Computer Applications', code='CA')
        prog = DegreeProgram.objects.create(department=dept, name='BCA', duration_years=3)
        branch = Branch.objects.create(program=prog, name='Data Science', code='BCA-DS')
        batch = AdmissionBatch.objects.create(program=prog, year=2024)

        registry = StudentRegistry.objects.create(
            student_id='12411002',
            full_name='Basit Test Student',
            institutional_email='basit.student@lpu.in',
            gender=Gender.MALE,
            date_of_birth=datetime.date(2004, 8, 12),
            branch=branch,
            batch=batch,
        )

        user = User.objects.create_user(
            email='basit.student@lpu.in',
            password='StrongPassword123!',
            student_id_login='12411002',
            role=Role.STUDENT
        )

        return {'user': user, 'registry': registry}

    def test_create_student_profile(self, student_fixtures):
        """Verify StudentProfile links User and StudentRegistry correctly."""
        user = student_fixtures['user']
        registry = student_fixtures['registry']

        profile = StudentProfile.objects.create(
            user=user,
            registry=registry,
            emergency_contact_name='Guardian Name',
            emergency_contact_phone='+91 9876543210',
            profile_completed=True
        )

        assert profile.student_id == '12411002'
        assert profile.full_name == 'Basit Test Student'
        assert profile.gender == Gender.MALE
        assert profile.institutional_email == 'basit.student@lpu.in'
        assert profile.profile_completed is True
        assert str(profile) == 'Profile of 12411002 - Basit Test Student'

    def test_one_to_one_user_constraint(self, student_fixtures):
        """Verify a User cannot have more than one StudentProfile."""
        user = student_fixtures['user']
        registry = student_fixtures['registry']

        StudentProfile.objects.create(user=user, registry=registry)

        with pytest.raises(IntegrityError):
            with transaction.atomic():
                StudentProfile.objects.create(user=user, registry=registry)

