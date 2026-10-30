"""
Unit tests for pre-allocation eligibility and cycle validation service.
"""
import datetime
import pytest
from django.contrib.auth import get_user_model
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
    EnrollmentStatus,
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
from apps.roommates.models import RoommateGroup, RoommateGroupMember
from apps.allocations.services.eligibility import (
    validate_student_for_allocation,
    validate_roommate_group_for_allocation,
    get_allocatable_applications_for_cycle,
)

User = get_user_model()


@pytest.mark.django_db
class TestAllocationEligibility:
    """Test suite for pre-allocation validation logic."""

    @pytest.fixture
    def setup_data(self):
        """Set up university, students, hostels, cycle, and applications."""
        univ = University.objects.create(name='LPU Main Campus', code='LPU-ELG')
        dept = Department.objects.create(university=univ, name='School of CSE', code='CSE')
        prog = DegreeProgram.objects.create(department=dept, name='B.Tech CSE', duration_years=4)
        branch = Branch.objects.create(program=prog, name='Computer Science', code='CS')
        batch = AdmissionBatch.objects.create(program=prog, year=2024)

        # Admin user
        admin = User.objects.create_user(email='admin_alloc@lpu.in', password='Password123!', role=Role.ADMIN)

        # Student A
        reg_a = StudentRegistry.objects.create(
            student_id='ELG2024CS001', full_name='Student Alloc A', institutional_email='a_alloc@lpu.in',
            gender=Gender.MALE, date_of_birth=datetime.date(2004, 1, 1), branch=branch, batch=batch
        )
        user_a = User.objects.create_user(email='a_alloc@lpu.in', password='Password123!', student_id_login='ELG2024CS001', role=Role.STUDENT)
        student_a = StudentProfile.objects.create(user=user_a, registry=reg_a)

        # Student B
        reg_b = StudentRegistry.objects.create(
            student_id='ELG2024CS002', full_name='Student Alloc B', institutional_email='b_alloc@lpu.in',
            gender=Gender.MALE, date_of_birth=datetime.date(2004, 2, 2), branch=branch, batch=batch
        )
        user_b = User.objects.create_user(email='b_alloc@lpu.in', password='Password123!', student_id_login='ELG2024CS002', role=Role.STUDENT)
        student_b = StudentProfile.objects.create(user=user_b, registry=reg_b)

        # Cycle
        cycle = AccommodationCycle.objects.create(
            academic_year='2026-2027', semester=1, name='Fall 2026',
            application_start=timezone.now() - datetime.timedelta(days=1),
            application_end=timezone.now() + datetime.timedelta(days=15),
            is_active=True
        )

        # Hostel hierarchy
        hostel = Hostel.objects.create(university=univ, name='Boys Block 1', code='BB1', gender_policy=GenderPolicy.MALE)
        block = Block.objects.create(hostel=hostel, name='Block A')
        floor = Floor.objects.create(block=block, floor_number=1)
        room = Room.objects.create(floor=floor, room_number='101', capacity=2)
        bed1 = Bed.objects.create(room=room, bed_identifier='A', status=BedStatus.VACANT)
        bed2 = Bed.objects.create(room=room, bed_identifier='B', status=BedStatus.VACANT)

        # Applications
        app_a = HostelApplication.objects.create(student=student_a, cycle=cycle, status=ApplicationStatus.APPROVED)
        ApplicationChoice.objects.create(application=app_a, hostel=hostel, priority=1, room=room)

        app_b = HostelApplication.objects.create(student=student_b, cycle=cycle, status=ApplicationStatus.APPROVED)
        ApplicationChoice.objects.create(application=app_b, hostel=hostel, priority=1, room=room)

        return {
            'admin': admin,
            'student_a': student_a,
            'student_b': student_b,
            'cycle': cycle,
            'hostel': hostel,
            'room': room,
            'bed1': bed1,
            'bed2': bed2,
            'app_a': app_a,
            'app_b': app_b,
        }

    def test_validate_student_eligible_success(self, setup_data):
        """Student with active registry and approved application is eligible."""
        student_a = setup_data['student_a']
        cycle = setup_data['cycle']
        app_a = setup_data['app_a']

        is_eligible, reason, app = validate_student_for_allocation(student_a, cycle)
        assert is_eligible is True
        assert reason == "Eligible"
        assert app == app_a

    def test_inactive_student_registry_ineligible(self, setup_data):
        """Student with inactive academic registry is ineligible."""
        student_a = setup_data['student_a']
        cycle = setup_data['cycle']
        student_a.registry.enrollment_status = EnrollmentStatus.SUSPENDED
        student_a.registry.save()

        is_eligible, reason, app = validate_student_for_allocation(student_a, cycle)
        assert is_eligible is False
        assert "inactive or suspended" in reason

    def test_inactive_cycle_ineligible(self, setup_data):
        """Closed/inactive cycle renders allocation ineligible."""
        student_a = setup_data['student_a']
        cycle = setup_data['cycle']
        cycle.is_active = False
        cycle.save()

        is_eligible, reason, app = validate_student_for_allocation(student_a, cycle)
        assert is_eligible is False
        assert "closed or inactive" in reason

    def test_already_allocated_student_ineligible(self, setup_data):
        """Student holding an active bed allocation cannot be reallocated concurrently."""
        student_a = setup_data['student_a']
        cycle = setup_data['cycle']
        bed1 = setup_data['bed1']
        app_a = setup_data['app_a']
        admin = setup_data['admin']

        Allocation.objects.create(
            student=student_a,
            bed=bed1,
            application=app_a,
            cycle=cycle,
            allocated_by=admin,
            start_date=datetime.date(2026, 8, 1),
            end_date=datetime.date(2027, 5, 31),
            is_active=True
        )

        is_eligible, reason, app = validate_student_for_allocation(student_a, cycle)
        assert is_eligible is False
        assert "already holds an active bed allocation" in reason

    def test_rejected_application_ineligible(self, setup_data):
        """Student with rejected application cannot be allocated."""
        student_a = setup_data['student_a']
        cycle = setup_data['cycle']
        app_a = setup_data['app_a']
        app_a.status = ApplicationStatus.REJECTED
        app_a.save()

        is_eligible, reason, app = validate_student_for_allocation(student_a, cycle)
        assert is_eligible is False
        assert "rejected" in reason

    def test_roommate_group_eligible_success(self, setup_data):
        """Roommate group with 2 approved students and 2 vacant beds is eligible."""
        student_a = setup_data['student_a']
        student_b = setup_data['student_b']
        cycle = setup_data['cycle']
        room = setup_data['room']

        group = RoommateGroup.objects.create(cycle=cycle, target_room=room, is_confirmed=True)
        RoommateGroupMember.objects.create(group=group, student=student_a)
        RoommateGroupMember.objects.create(group=group, student=student_b)

        is_eligible, reason, apps = validate_roommate_group_for_allocation(group)
        assert is_eligible is True
        assert len(apps) == 2

    def test_roommate_group_insufficient_beds(self, setup_data):
        """Roommate group fails eligibility if target room has fewer vacant beds than members."""
        student_a = setup_data['student_a']
        student_b = setup_data['student_b']
        cycle = setup_data['cycle']
        room = setup_data['room']
        bed1 = setup_data['bed1']

        # Occupy bed1
        bed1.status = BedStatus.OCCUPIED
        bed1.save()

        group = RoommateGroup.objects.create(cycle=cycle, target_room=room, is_confirmed=True)
        RoommateGroupMember.objects.create(group=group, student=student_a)
        RoommateGroupMember.objects.create(group=group, student=student_b)

        is_eligible, reason, apps = validate_roommate_group_for_allocation(group)
        assert is_eligible is False
        assert "has only 1 vacant beds available" in reason

    def test_get_allocatable_applications_for_cycle(self, setup_data):
        """Returns applications eligible for batch allocation."""
        cycle = setup_data['cycle']
        student_a = setup_data['student_a']
        bed1 = setup_data['bed1']
        app_a = setup_data['app_a']
        admin = setup_data['admin']

        # Initially 2 applications
        apps = get_allocatable_applications_for_cycle(cycle)
        assert apps.count() == 2

        # Allocate Student A
        Allocation.objects.create(
            student=student_a,
            bed=bed1,
            application=app_a,
            cycle=cycle,
            allocated_by=admin,
            start_date=datetime.date(2026, 8, 1),
            end_date=datetime.date(2027, 5, 31),
            is_active=True
        )

        # Now only Student B's application is allocatable
        updated_apps = get_allocatable_applications_for_cycle(cycle)
        assert updated_apps.count() == 1
        assert updated_apps.first().student == setup_data['student_b']

