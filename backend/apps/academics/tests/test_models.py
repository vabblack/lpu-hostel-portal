"""
Unit tests for academic structure and StudentRegistry in apps.academics.
"""
import datetime
import pytest
from django.db import IntegrityError
from apps.academics.models import (
    University,
    Department,
    DegreeProgram,
    Branch,
    AdmissionBatch,
    StudentRegistry,
    StudentEnrollment,
    Gender,
    EnrollmentStatus,
)


@pytest.mark.django_db
class TestAcademicsModels:
    """Test suite for academic hierarchy and student registry models."""

    @pytest.fixture
    def academic_setup(self):
        """Fixture providing complete academic hierarchy setup."""
        univ = University.objects.create(name='Lovely Professional University', code='LPU')
        dept = Department.objects.create(university=univ, name='School of Computer Science', code='SCA')
        prog = DegreeProgram.objects.create(department=dept, name='B.Tech CSE', duration_years=4)
        branch = Branch.objects.create(program=prog, name='Computer Science and Engineering', code='CSE')
        batch = AdmissionBatch.objects.create(program=prog, year=2024)
        return {
            'university': univ,
            'department': dept,
            'program': prog,
            'branch': branch,
            'batch': batch,
        }

    def test_academic_hierarchy_creation(self, academic_setup):
        """Verify the academic hierarchy links correctly."""
        univ = academic_setup['university']
        branch = academic_setup['branch']
        assert branch.program.department.university == univ
        assert str(univ) == 'Lovely Professional University (LPU)'

    def test_student_registry_creation(self, academic_setup):
        """Verify creating a student registry record."""
        student = StudentRegistry.objects.create(
            student_id='12400001',
            full_name='Basit Ahmad',
            institutional_email='basit.12400001@lpu.in',
            gender=Gender.MALE,
            date_of_birth=datetime.date(2004, 5, 15),
            branch=academic_setup['branch'],
            batch=academic_setup['batch'],
            enrollment_status=EnrollmentStatus.ACTIVE,
        )
        assert student.student_id == '12400001'
        assert student.gender == Gender.MALE
        assert student.is_registered is False
        assert str(student) == '12400001 - Basit Ahmad'

    def test_student_registry_uniqueness(self, academic_setup):
        """Verify student_id and institutional_email uniqueness constraints."""
        StudentRegistry.objects.create(
            student_id='REG1001',
            full_name='First Student',
            institutional_email='reg1001@lpu.in',
            gender=Gender.MALE,
            date_of_birth=datetime.date(2004, 1, 1),
            branch=academic_setup['branch'],
            batch=academic_setup['batch'],
        )

        from django.db import transaction

        # Duplicate Student ID should fail
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                StudentRegistry.objects.create(
                    student_id='REG1001',
                    full_name='Second Student',
                    institutional_email='reg1002@lpu.in',
                    gender=Gender.FEMALE,
                    date_of_birth=datetime.date(2004, 2, 2),
                    branch=academic_setup['branch'],
                    batch=academic_setup['batch'],
                )

        # Duplicate Institutional Email should fail
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                StudentRegistry.objects.create(
                    student_id='REG1003',
                    full_name='Third Student',
                    institutional_email='reg1001@lpu.in',
                    gender=Gender.FEMALE,
                    date_of_birth=datetime.date(2004, 3, 3),
                    branch=academic_setup['branch'],
                    batch=academic_setup['batch'],
                )

    def test_student_enrollment_term(self, academic_setup):
        """Verify creating term enrollment for a registry student."""
        student = StudentRegistry.objects.create(
            student_id='REG2001',
            full_name='Enrolled Student',
            institutional_email='reg2001@lpu.in',
            gender=Gender.FEMALE,
            date_of_birth=datetime.date(2005, 3, 20),
            branch=academic_setup['branch'],
            batch=academic_setup['batch'],
        )
        enrollment = StudentEnrollment.objects.create(
            registry=student,
            academic_year='2026-2027',
            semester=5,
            status='CURRENT'
        )
        assert enrollment.semester == 5
        assert enrollment.status == 'CURRENT'
