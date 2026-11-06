"""
Unit and integration tests for inventory management, occupancy analytics, and bulk registry import in Phase 6.
"""
import datetime
import pytest
from django.contrib.auth import get_user_model
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
from apps.academics.services.import_registry import import_student_registry_from_csv
from apps.hostels.models import (
    Hostel,
    Block,
    Floor,
    Room,
    Bed,
    BedStatus,
    RoomStatus,
    GenderPolicy,
    WashroomType,
    WardenAssignment,
)
from apps.hostels.forms import HostelForm, WardenAssignmentForm
from apps.hostels.services.occupancy import (
    get_hostel_occupancy_summary,
    get_available_rooms_query,
)

User = get_user_model()


@pytest.mark.django_db
class TestHostelManagementAndOccupancy:
    """Test suite for Phase 6 inventory operations and occupancy services."""

    @pytest.fixture
    def setup_data(self):
        """Fixture for university, hostel, and academic structure."""
        univ = University.objects.create(name='LPU Management Univ', code='LPU-MGT')
        dept = Department.objects.create(university=univ, name='CSE', code='CS')
        prog = DegreeProgram.objects.create(department=dept, name='B.Tech CSE', duration_years=4)
        branch = Branch.objects.create(program=prog, name='Computer Science', code='CSE')
        batch = AdmissionBatch.objects.create(program=prog, year=2024)

        hostel = Hostel.objects.create(
            university=univ,
            name='Boys Hostel 1',
            code='BH1',
            gender_policy=GenderPolicy.MALE,
            total_capacity=100
        )
        block = Block.objects.create(hostel=hostel, name='Block A')
        floor = Floor.objects.create(block=block, floor_number=1)

        # Room 1: 2 beds (1 occupied, 1 vacant)
        room1 = Room.objects.create(
            floor=floor,
            room_number='101',
            capacity=2,
            is_air_conditioned=True,
            washroom_type=WashroomType.ATTACHED,
            status=RoomStatus.AVAILABLE
        )
        bed1 = Bed.objects.create(room=room1, bed_identifier='A', status=BedStatus.OCCUPIED)
        bed2 = Bed.objects.create(room=room1, bed_identifier='B', status=BedStatus.VACANT)

        # Room 2: 2 beds (2 vacant)
        room2 = Room.objects.create(
            floor=floor,
            room_number='102',
            capacity=2,
            is_air_conditioned=False,
            washroom_type=WashroomType.SHARED,
            status=RoomStatus.AVAILABLE
        )
        bed3 = Bed.objects.create(room=room2, bed_identifier='A', status=BedStatus.VACANT)
        bed4 = Bed.objects.create(room=room2, bed_identifier='B', status=BedStatus.VACANT)

        return {
            'univ': univ,
            'branch': branch,
            'batch': batch,
            'hostel': hostel,
            'room1': room1,
            'room2': room2,
            'beds': [bed1, bed2, bed3, bed4],
        }

    def test_hostel_form_valid(self, setup_data):
        """Verify HostelForm validation."""
        form_data = {
            'university': setup_data['univ'].id,
            'name': 'New Girls Hostel 3',
            'code': 'GH3',
            'gender_policy': GenderPolicy.FEMALE,
            'status': 'ACTIVE',
            'total_capacity': 150,
            'description': 'Modern girls residence.',
        }
        form = HostelForm(data=form_data)
        assert form.is_valid()
        new_hostel = form.save()
        assert new_hostel.code == 'GH3'

    def test_warden_assignment_form_validation(self, setup_data):
        """Verify WardenAssignmentForm strictly enforces WARDEN role."""
        warden_user = User.objects.create_user(email='valid.warden@lpu.in', password='Password123!', role=Role.WARDEN)
        student_user = User.objects.create_user(email='invalid.student@lpu.in', password='Password123!', role=Role.STUDENT)

        # 1. Valid warden user
        valid_form = WardenAssignmentForm(data={
            'user': warden_user.id,
            'hostel': setup_data['hostel'].id,
            'can_approve_allocation': True,
            'is_active': True,
        })
        assert valid_form.is_valid()

        # 2. Student user cannot be assigned as warden
        invalid_form = WardenAssignmentForm(data={
            'user': student_user.id,
            'hostel': setup_data['hostel'].id,
            'can_approve_allocation': True,
            'is_active': True,
        })
        assert not invalid_form.is_valid()

    def test_high_efficiency_occupancy_aggregation(self, setup_data):
        """Task 6.5: Verify single-pass conditional Count aggregation metrics."""
        summary = get_hostel_occupancy_summary(setup_data['hostel'].id)
        assert len(summary) == 1
        stats = summary[0]

        assert stats['hostel_code'] == 'BH1'
        assert stats['total_rooms'] == 2
        assert stats['total_beds'] == 4
        assert stats['occupied_beds'] == 1
        assert stats['vacant_beds'] == 3
        # 1 occupied out of 4 total beds = 25.0%
        assert stats['occupancy_rate_percent'] == 25.0

    def test_available_rooms_query_filtering(self, setup_data):
        """Verify get_available_rooms_query filters by AC, capacity, and gender."""
        # Query AC rooms for MALE students
        ac_rooms = get_available_rooms_query(
            hostel_id=setup_data['hostel'].id,
            gender=GenderPolicy.MALE,
            is_ac=True
        )
        assert ac_rooms.count() == 1
        assert ac_rooms.first().room_number == '101'

        # Query Non-AC rooms
        non_ac_rooms = get_available_rooms_query(
            hostel_id=setup_data['hostel'].id,
            is_ac=False
        )
        assert non_ac_rooms.count() == 1
        assert non_ac_rooms.first().room_number == '102'

    def test_safe_bulk_student_registry_csv_import(self, setup_data):
        """Task 6.6: Verify safe atomic student registry CSV import."""
        csv_data = """student_id,full_name,institutional_email,gender,date_of_birth,branch_code,batch_year,phone_number
12400010,Alice Wonderland,alice@lpu.in,FEMALE,2004-03-12,CSE,2024,9876543210
12400011,Bob Builder,bob@lpu.in,MALE,2004-07-22,CSE,2024,9876543211
"""
        result = import_student_registry_from_csv(csv_data)
        assert result['created_count'] == 2
        assert result['errors'] == []

        # Verify records created in database
        alice = StudentRegistry.objects.get(student_id='12400010')
        assert alice.full_name == 'Alice Wonderland'
        assert alice.gender == Gender.FEMALE
        assert alice.branch == setup_data['branch']
        assert alice.batch == setup_data['batch']

        # Re-importing same CSV should safely skip without crashing
        reimport_result = import_student_registry_from_csv(csv_data)
        assert reimport_result['created_count'] == 0
        assert reimport_result['skipped_count'] == 2

