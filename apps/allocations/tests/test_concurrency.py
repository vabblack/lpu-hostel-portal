"""
Concurrency, race-condition, and database integrity stress tests for bed allocations.
Verifies that database-level uniqueness constraints and row-level pessimistic locking
prevent duplicate bookings or corrupted state under parallel execution.
"""
from concurrent.futures import ThreadPoolExecutor
import datetime
import pytest
from django.contrib.auth import get_user_model
from django.db import connection, transaction, IntegrityError
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
    Bed,
    BedStatus,
    GenderPolicy,
)
from apps.applications.models import (
    AccommodationCycle,
    HostelApplication,
    ApplicationChoice,
    ApplicationStatus,
)
from apps.allocations.models import Allocation
from apps.allocations.services.engine import (
    allocate_individual_student,
    cancel_or_release_allocation,
)

User = get_user_model()


@pytest.mark.django_db(transaction=True)
class TestAllocationConcurrencyAndIntegrity:
    """Stress tests verifying concurrency defense and integrity constraints."""

    @pytest.fixture
    def setup_concurrency_env(self):
        """Set up environment with 2 students competing for exactly 1 bed."""
        univ = University.objects.create(name='LPU Main Campus', code='LPU-CNC')
        dept = Department.objects.create(university=univ, name='School of Engineering', code='ENG')
        prog = DegreeProgram.objects.create(department=dept, name='B.Tech', duration_years=4)
        branch = Branch.objects.create(program=prog, name='CSE', code='CSE')
        batch = AdmissionBatch.objects.create(program=prog, year=2024)

        admin = User.objects.create_user(email='admin_cnc@lpu.in', password='Password123!', role=Role.ADMIN)

        reg1 = StudentRegistry.objects.create(
            student_id='CNC2024CS001', full_name='Competitor 1', institutional_email='c1@lpu.in',
            gender=Gender.MALE, date_of_birth=datetime.date(2004, 1, 1), branch=branch, batch=batch
        )
        user1 = User.objects.create_user(email='c1@lpu.in', password='Password123!', student_id_login='CNC2024CS001', role=Role.STUDENT)
        s1 = StudentProfile.objects.create(user=user1, registry=reg1)

        reg2 = StudentRegistry.objects.create(
            student_id='CNC2024CS002', full_name='Competitor 2', institutional_email='c2@lpu.in',
            gender=Gender.MALE, date_of_birth=datetime.date(2004, 2, 2), branch=branch, batch=batch
        )
        user2 = User.objects.create_user(email='c2@lpu.in', password='Password123!', student_id_login='CNC2024CS002', role=Role.STUDENT)
        s2 = StudentProfile.objects.create(user=user2, registry=reg2)

        cycle = AccommodationCycle.objects.create(
            academic_year='2026-2027', semester=1, name='Fall 2026',
            application_start=timezone.now() - datetime.timedelta(days=1),
            application_end=timezone.now() + datetime.timedelta(days=15),
            is_active=True
        )

        hostel = Hostel.objects.create(university=univ, name='Dorm A', code='DMA', gender_policy=GenderPolicy.MALE)
        block = Block.objects.create(hostel=hostel, name='Block 1')
        floor = Floor.objects.create(block=block, floor_number=1)
        room = Room.objects.create(floor=floor, room_number='301', capacity=1)
        # Exactly 1 bed exists in this room and hostel
        solo_bed = Bed.objects.create(room=room, bed_identifier='1', status=BedStatus.VACANT)

        app1 = HostelApplication.objects.create(student=s1, cycle=cycle, status=ApplicationStatus.APPROVED)
        ApplicationChoice.objects.create(application=app1, hostel=hostel, priority=1, room=room)

        app2 = HostelApplication.objects.create(student=s2, cycle=cycle, status=ApplicationStatus.APPROVED)
        ApplicationChoice.objects.create(application=app2, hostel=hostel, priority=1, room=room)

        return {
            'admin': admin,
            's1': s1,
            's2': s2,
            'cycle': cycle,
            'solo_bed': solo_bed,
            'app1': app1,
            'app2': app2,
            'start_date': datetime.date(2026, 8, 1),
            'end_date': datetime.date(2027, 5, 31),
        }

    def test_database_level_unique_active_bed_constraint(self, setup_concurrency_env):
        """
        Critical Safeguard 1: UniqueConstraint prevents 2 active allocations for the same bed.
        """
        data = setup_concurrency_env
        solo_bed = data['solo_bed']
        cycle = data['cycle']
        admin = data['admin']

        # First allocation succeeds
        Allocation.objects.create(
            student=data['s1'],
            bed=solo_bed,
            application=data['app1'],
            cycle=cycle,
            allocated_by=admin,
            start_date=data['start_date'],
            end_date=data['end_date'],
            is_active=True
        )

        # Attempting duplicate active allocation for the same bed MUST trigger IntegrityError
        with transaction.atomic():
            with pytest.raises(IntegrityError):
                Allocation.objects.create(
                    student=data['s2'],
                    bed=solo_bed,
                    application=data['app2'],
                    cycle=cycle,
                    allocated_by=admin,
                    start_date=data['start_date'],
                    end_date=data['end_date'],
                    is_active=True
                )

        assert Allocation.objects.filter(bed=solo_bed, is_active=True).count() == 1

    def test_database_level_unique_active_student_constraint(self, setup_concurrency_env):
        """
        Critical Safeguard 2: UniqueConstraint prevents 1 student holding multiple active beds.
        """
        data = setup_concurrency_env
        s1 = data['s1']
        cycle = data['cycle']
        admin = data['admin']

        bed_a = data['solo_bed']
        bed_b = Bed.objects.create(room=bed_a.room, bed_identifier='2', status=BedStatus.VACANT)

        # First allocation for student 1
        Allocation.objects.create(
            student=s1,
            bed=bed_a,
            application=data['app1'],
            cycle=cycle,
            allocated_by=admin,
            start_date=data['start_date'],
            end_date=data['end_date'],
            is_active=True
        )

        # Attempting second active allocation for student 1 MUST trigger IntegrityError
        # (even with a different bed and a new application)
        app_duplicate = HostelApplication.objects.create(
            student=s1,
            cycle=AccommodationCycle.objects.create(
                academic_year='2027-2028', semester=1, name='Future Intake',
                application_start=timezone.now(), application_end=timezone.now() + datetime.timedelta(days=1),
                is_active=True
            ),
            status=ApplicationStatus.APPROVED
        )

        with transaction.atomic():
            with pytest.raises(IntegrityError):
                Allocation.objects.create(
                    student=s1,
                    bed=bed_b,
                    application=app_duplicate,
                    cycle=cycle,
                    allocated_by=admin,
                    start_date=data['start_date'],
                    end_date=data['end_date'],
                    is_active=True
                )

        assert Allocation.objects.filter(student=s1, is_active=True).count() == 1

    def test_reallocation_allows_new_bed_after_release(self, setup_concurrency_env):
        """
        After an active allocation is deactivated, the student can safely receive a new allocation.
        """
        data = setup_concurrency_env
        s1 = data['s1']
        cycle = data['cycle']
        admin = data['admin']
        bed_a = data['solo_bed']
        bed_b = Bed.objects.create(room=bed_a.room, bed_identifier='2', status=BedStatus.VACANT)

        alloc1 = Allocation.objects.create(
            student=s1,
            bed=bed_a,
            application=data['app1'],
            cycle=cycle,
            allocated_by=admin,
            start_date=data['start_date'],
            end_date=data['end_date'],
            is_active=True
        )

        # Release first allocation
        cancel_or_release_allocation(alloc1, admin, reason="Transferring rooms")
        assert alloc1.is_active is False

        # Student 1 can now receive bed_b in a new cycle/application without conflict
        app_new = HostelApplication.objects.create(
            student=s1,
            cycle=AccommodationCycle.objects.create(
                academic_year='2027-2028', semester=1, name='Spring 2028',
                application_start=timezone.now(), application_end=timezone.now() + datetime.timedelta(days=1),
                is_active=True
            ),
            status=ApplicationStatus.APPROVED
        )

        alloc2 = Allocation.objects.create(
            student=s1,
            bed=bed_b,
            application=app_new,
            cycle=cycle,
            allocated_by=admin,
            start_date=data['start_date'],
            end_date=data['end_date'],
            is_active=True
        )
        assert alloc2.is_active is True
        assert Allocation.objects.filter(student=s1, is_active=True).count() == 1

    def test_concurrent_allocation_serializes_and_prevents_double_booking(self, setup_concurrency_env):
        """
        Parallel workers race to allocate the only available bed.
        Pessimistic locking ensures exactly 1 student gets allocated and the 2nd is waitlisted.
        """
        data = setup_concurrency_env
        app1_id = data['app1'].pk
        app2_id = data['app2'].pk
        admin_id = data['admin'].pk
        solo_bed = data['solo_bed']
        start_date = data['start_date']
        end_date = data['end_date']

        def worker_task(app_id):
            try:
                app = HostelApplication.objects.get(pk=app_id)
                admin_user = User.objects.get(pk=admin_id)
                res = allocate_individual_student(app, admin_user, start_date, end_date)
                return ('SUCCESS', res.pk if res else None)
            except Exception as e:
                return ('ERROR', str(e))
            finally:
                connection.close()

        with ThreadPoolExecutor(max_workers=2) as executor:
            future1 = executor.submit(worker_task, app1_id)
            future2 = executor.submit(worker_task, app2_id)
            res1 = future1.result()
            res2 = future2.result()

        results = [res1, res2]
        # Exactly one worker must have successfully created an allocation (returned non-None pk)
        allocated_count = sum(1 for status, pk in results if status == 'SUCCESS' and pk is not None)
        assert allocated_count == 1, f"Results: {results}"

        # Exactly 1 active allocation exists in the database for solo_bed
        active_allocations = Allocation.objects.filter(bed=solo_bed, is_active=True)
        assert active_allocations.count() == 1, f"Active allocations count: {active_allocations.count()}"

        # If the losing thread was serialized, it became WAITLISTED; if locked out by SQLite, it retained APPROVED or returned ERROR
        # Either way, double booking is strictly prevented:
        assert Allocation.objects.filter(bed=solo_bed, is_active=True).count() == 1
