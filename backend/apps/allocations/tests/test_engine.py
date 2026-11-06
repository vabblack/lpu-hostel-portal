"""
Unit and integration tests for the transactional allocation engine, automatic bed assignment,
priority fallbacks, group placements, and cancellations.
"""
import datetime
import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
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
    RoomStatus,
    GenderPolicy,
)
from apps.applications.models import (
    AccommodationCycle,
    HostelApplication,
    ApplicationChoice,
    ApplicationStatus,
)
from apps.allocations.models import Allocation, AllocationHistory
from apps.roommates.models import RoommateGroup, RoommateGroupMember
from apps.allocations.services.engine import (
    allocate_individual_student,
    allocate_roommate_group,
    cancel_or_release_allocation,
)

User = get_user_model()


@pytest.mark.django_db
class TestAllocationEngine:
    """Test suite for allocation engine logic and database transactions."""

    @pytest.fixture
    def setup_data(self):
        """Set up test environment with hostels, rooms, beds, and students."""
        univ = University.objects.create(name='LPU Main Campus', code='LPU-ENG')
        dept = Department.objects.create(university=univ, name='School of Engineering', code='ENG')
        prog = DegreeProgram.objects.create(department=dept, name='B.Tech', duration_years=4)
        branch = Branch.objects.create(program=prog, name='CSE', code='CSE')
        batch = AdmissionBatch.objects.create(program=prog, year=2024)

        admin = User.objects.create_user(email='admin_eng@lpu.in', password='Password123!', role=Role.ADMIN)

        # Student 1
        reg1 = StudentRegistry.objects.create(
            student_id='ENG2024CS001', full_name='Alice Engine 1', institutional_email='eng1@lpu.in',
            gender=Gender.MALE, date_of_birth=datetime.date(2004, 1, 1), branch=branch, batch=batch
        )
        user1 = User.objects.create_user(email='eng1@lpu.in', password='Password123!', student_id_login='ENG2024CS001', role=Role.STUDENT)
        s1 = StudentProfile.objects.create(user=user1, registry=reg1)

        # Student 2
        reg2 = StudentRegistry.objects.create(
            student_id='ENG2024CS002', full_name='Bob Engine 2', institutional_email='eng2@lpu.in',
            gender=Gender.MALE, date_of_birth=datetime.date(2004, 2, 2), branch=branch, batch=batch
        )
        user2 = User.objects.create_user(email='eng2@lpu.in', password='Password123!', student_id_login='ENG2024CS002', role=Role.STUDENT)
        s2 = StudentProfile.objects.create(user=user2, registry=reg2)

        # Cycle
        cycle = AccommodationCycle.objects.create(
            academic_year='2026-2027', semester=1, name='Fall 2026',
            application_start=timezone.now() - datetime.timedelta(days=1),
            application_end=timezone.now() + datetime.timedelta(days=15),
            is_active=True
        )

        # Hostels
        hostel_a = Hostel.objects.create(university=univ, name='Boys Hostel A', code='BHA', gender_policy=GenderPolicy.MALE)
        block_a = Block.objects.create(hostel=hostel_a, name='Block 1')
        floor_a = Floor.objects.create(block=block_a, floor_number=1)
        room_a1 = Room.objects.create(floor=floor_a, room_number='101', capacity=2)
        bed_a1_1 = Bed.objects.create(room=room_a1, bed_identifier='A', status=BedStatus.VACANT)
        bed_a1_2 = Bed.objects.create(room=room_a1, bed_identifier='B', status=BedStatus.VACANT)

        hostel_b = Hostel.objects.create(university=univ, name='Boys Hostel B', code='BHB', gender_policy=GenderPolicy.MALE)
        block_b = Block.objects.create(hostel=hostel_b, name='Block 1')
        floor_b = Floor.objects.create(block=block_b, floor_number=1)
        room_b1 = Room.objects.create(floor=floor_b, room_number='201', capacity=2)
        bed_b1_1 = Bed.objects.create(room=room_b1, bed_identifier='A', status=BedStatus.VACANT)

        # Applications
        app1 = HostelApplication.objects.create(student=s1, cycle=cycle, status=ApplicationStatus.APPROVED)
        ApplicationChoice.objects.create(application=app1, hostel=hostel_a, priority=1, room=room_a1)

        app2 = HostelApplication.objects.create(student=s2, cycle=cycle, status=ApplicationStatus.APPROVED)
        ApplicationChoice.objects.create(application=app2, hostel=hostel_a, priority=1, room=room_a1)

        return {
            'admin': admin,
            's1': s1,
            's2': s2,
            'cycle': cycle,
            'hostel_a': hostel_a,
            'hostel_b': hostel_b,
            'room_a1': room_a1,
            'room_b1': room_b1,
            'bed_a1_1': bed_a1_1,
            'bed_a1_2': bed_a1_2,
            'bed_b1_1': bed_b1_1,
            'app1': app1,
            'app2': app2,
            'start_date': datetime.date(2026, 8, 1),
            'end_date': datetime.date(2027, 5, 31),
        }

    def test_allocate_individual_student_auto_bed_assignment(self, setup_data):
        """
        Decision 2: Student selects preferred room; system automatically assigns available bed.
        """
        app1 = setup_data['app1']
        admin = setup_data['admin']
        start_date = setup_data['start_date']
        end_date = setup_data['end_date']

        alloc = allocate_individual_student(app1, admin, start_date, end_date)

        assert alloc is not None
        assert alloc.student == app1.student
        assert alloc.bed.room == setup_data['room_a1']
        assert alloc.bed.status == BedStatus.OCCUPIED
        assert alloc.is_active is True

        app1.refresh_from_db()
        assert app1.status == ApplicationStatus.ALLOCATED

        # History audit
        history = AllocationHistory.objects.filter(allocation=alloc).first()
        assert history is not None
        assert history.action == 'INITIAL_ASSIGNMENT'
        assert history.new_bed == alloc.bed

    def test_priority_fallback_to_second_choice(self, setup_data):
        """
        If Priority 1 preferred room is completely occupied, engine falls back to Priority 2.
        """
        app1 = setup_data['app1']
        admin = setup_data['admin']
        room_b1 = setup_data['room_b1']
        hostel_b = setup_data['hostel_b']

        # Occupy both beds in room_a1
        setup_data['bed_a1_1'].status = BedStatus.OCCUPIED
        setup_data['bed_a1_1'].save()
        setup_data['bed_a1_2'].status = BedStatus.OCCUPIED
        setup_data['bed_a1_2'].save()

        # Add Priority 2 choice targeting Room B1
        ApplicationChoice.objects.create(application=app1, hostel=hostel_b, priority=2, room=room_b1)

        alloc = allocate_individual_student(app1, admin, setup_data['start_date'], setup_data['end_date'])

        assert alloc is not None
        assert alloc.bed.room == room_b1
        assert alloc.bed == setup_data['bed_b1_1']

    def test_exhausted_choices_moves_to_waitlist(self, setup_data):
        """
        If all prioritized choices have zero available beds, application transitions to WAITLISTED.
        """
        app1 = setup_data['app1']
        admin = setup_data['admin']

        # Occupy both beds in room_a1
        setup_data['bed_a1_1'].status = BedStatus.OCCUPIED
        setup_data['bed_a1_1'].save()
        setup_data['bed_a1_2'].status = BedStatus.OCCUPIED
        setup_data['bed_a1_2'].save()

        alloc = allocate_individual_student(app1, admin, setup_data['start_date'], setup_data['end_date'])

        assert alloc is None
        app1.refresh_from_db()
        assert app1.status == ApplicationStatus.WAITLISTED

    def test_allocate_roommate_group_success(self, setup_data):
        """
        Confirmed roommate group allocated collectively in common target room.
        """
        cycle = setup_data['cycle']
        room_a1 = setup_data['room_a1']
        s1 = setup_data['s1']
        s2 = setup_data['s2']
        admin = setup_data['admin']

        group = RoommateGroup.objects.create(cycle=cycle, target_room=room_a1, is_confirmed=True)
        RoommateGroupMember.objects.create(group=group, student=s1)
        RoommateGroupMember.objects.create(group=group, student=s2)

        allocations = allocate_roommate_group(group, admin, setup_data['start_date'], setup_data['end_date'])

        assert len(allocations) == 2
        assigned_students = [a.student for a in allocations]
        assert s1 in assigned_students
        assert s2 in assigned_students

        for alloc in allocations:
            assert alloc.bed.room == room_a1
            assert alloc.bed.status == BedStatus.OCCUPIED
            assert alloc.is_active is True

        room_a1.refresh_from_db()
        assert room_a1.status == RoomStatus.FULL

    def test_cancel_or_release_allocation(self, setup_data):
        """
        Cancelling an allocation deactivates the record, releases the bed, and logs history.
        """
        app1 = setup_data['app1']
        admin = setup_data['admin']

        alloc = allocate_individual_student(app1, admin, setup_data['start_date'], setup_data['end_date'])
        bed = alloc.bed

        # Now cancel
        cancel_or_release_allocation(alloc, admin, reason="Student requested off-campus living.")

        alloc.refresh_from_db()
        assert alloc.is_active is False

        bed.refresh_from_db()
        assert bed.status == BedStatus.VACANT

        app1.refresh_from_db()
        assert app1.status == ApplicationStatus.CANCELLED

        latest_history = AllocationHistory.objects.filter(allocation=alloc).order_by('-timestamp').first()
        assert latest_history.action == 'CANCELLATION'
        assert "off-campus" in latest_history.notes
