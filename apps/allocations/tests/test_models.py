"""
Unit tests for Allocation concurrency constraints and history tracking in apps.allocations.
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
    BedStatus,
    GenderPolicy,
)
from apps.applications.models import AccommodationCycle, HostelApplication
from apps.allocations.models import Allocation, AllocationHistory

User = get_user_model()


@pytest.mark.django_db
class TestAllocationsModels:
    """Test suite for Allocation model and concurrency constraints."""

    @pytest.fixture
    def alloc_setup(self):
        """Fixture for setting up students, beds, cycles, and applications."""
        univ = University.objects.create(name='LPU Allocations Univ', code='LPU-AL')
        dept = Department.objects.create(university=univ, name='CSE', code='CS')
        prog = DegreeProgram.objects.create(department=dept, name='B.Tech', duration_years=4)
        branch = Branch.objects.create(program=prog, name='CSE', code='CSE')
        batch = AdmissionBatch.objects.create(program=prog, year=2024)

        reg1 = StudentRegistry.objects.create(
            student_id='AL101', full_name='Student 1', institutional_email='al1@lpu.in',
            gender=Gender.MALE, date_of_birth=datetime.date(2004, 1, 1), branch=branch, batch=batch
        )
        reg2 = StudentRegistry.objects.create(
            student_id='AL102', full_name='Student 2', institutional_email='al2@lpu.in',
            gender=Gender.MALE, date_of_birth=datetime.date(2004, 2, 2), branch=branch, batch=batch
        )

        user1 = User.objects.create_user(email='al1@lpu.in', password='Password123!', student_id_login='AL101')
        user2 = User.objects.create_user(email='al2@lpu.in', password='Password123!', student_id_login='AL102')
        admin_user = User.objects.create_superuser(email='chief.admin@lpu.in', password='AdminPass123!')

        student1 = StudentProfile.objects.create(user=user1, registry=reg1)
        student2 = StudentProfile.objects.create(user=user2, registry=reg2)

        hostel = Hostel.objects.create(university=univ, name='Boys Hostel A', code='BHA', gender_policy=GenderPolicy.MALE)
        block = Block.objects.create(hostel=hostel, name='Block 1')
        floor = Floor.objects.create(block=block, floor_number=1)
        room = Room.objects.create(floor=floor, room_number='201', capacity=2)
        bed1 = Bed.objects.create(room=room, bed_identifier='A', status=BedStatus.VACANT)
        bed2 = Bed.objects.create(room=room, bed_identifier='B', status=BedStatus.VACANT)

        cycle = AccommodationCycle.objects.create(
            academic_year='2026-2027', semester=1, name='Fall 2026',
            application_start=timezone.now(), application_end=timezone.now() + datetime.timedelta(days=15),
            is_active=True
        )

        app1 = HostelApplication.objects.create(student=student1, cycle=cycle)
        app2 = HostelApplication.objects.create(student=student2, cycle=cycle)

        return {
            'student1': student1,
            'student2': student2,
            'bed1': bed1,
            'bed2': bed2,
            'admin': admin_user,
            'cycle': cycle,
            'app1': app1,
            'app2': app2,
        }

    def test_allocation_creation(self, alloc_setup):
        """Verify Allocation creation linking application, student, and bed."""
        today = datetime.date.today()
        end_date = today + datetime.timedelta(days=120)

        allocation = Allocation.objects.create(
            student=alloc_setup['student1'],
            bed=alloc_setup['bed1'],
            application=alloc_setup['app1'],
            cycle=alloc_setup['cycle'],
            allocated_by=alloc_setup['admin'],
            start_date=today,
            end_date=end_date,
            is_active=True
        )

        assert allocation.is_active is True
        assert allocation.bed == alloc_setup['bed1']
        assert allocation.student == alloc_setup['student1']

    def test_prevent_duplicate_active_bed_allocation(self, alloc_setup):
        """Rule 13: A bed must not have overlapping active occupants."""
        today = datetime.date.today()
        end_date = today + datetime.timedelta(days=120)

        # Allocate bed1 to student1
        Allocation.objects.create(
            student=alloc_setup['student1'],
            bed=alloc_setup['bed1'],
            application=alloc_setup['app1'],
            cycle=alloc_setup['cycle'],
            allocated_by=alloc_setup['admin'],
            start_date=today,
            end_date=end_date,
            is_active=True
        )

        # Attempting to allocate the same bed1 to student2 must raise IntegrityError
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                Allocation.objects.create(
                    student=alloc_setup['student2'],
                    bed=alloc_setup['bed1'], # Same bed!
                    application=alloc_setup['app2'],
                    cycle=alloc_setup['cycle'],
                    allocated_by=alloc_setup['admin'],
                    start_date=today,
                    end_date=end_date,
                    is_active=True
                )

    def test_prevent_duplicate_active_student_allocation(self, alloc_setup):
        """Rule 13: A student must not have overlapping active bed allocations."""
        today = datetime.date.today()
        end_date = today + datetime.timedelta(days=120)

        # Allocate bed1 to student1
        Allocation.objects.create(
            student=alloc_setup['student1'],
            bed=alloc_setup['bed1'],
            application=alloc_setup['app1'],
            cycle=alloc_setup['cycle'],
            allocated_by=alloc_setup['admin'],
            start_date=today,
            end_date=end_date,
            is_active=True
        )

        # Attempting to allocate bed2 to the SAME student1 must raise IntegrityError
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                Allocation.objects.create(
                    student=alloc_setup['student1'], # Same student!
                    bed=alloc_setup['bed2'],
                    application=alloc_setup['app2'],
                    cycle=alloc_setup['cycle'],
                    allocated_by=alloc_setup['admin'],
                    start_date=today,
                    end_date=end_date,
                    is_active=True
                )

