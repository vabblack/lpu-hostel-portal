"""
Unit tests for accommodation hierarchy models in apps.hostels.
"""
import pytest
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from apps.accounts.models import Role
from apps.academics.models import University
from apps.hostels.models import (
    Hostel,
    Block,
    Floor,
    Facility,
    Room,
    Bed,
    WardenAssignment,
    GenderPolicy,
    HostelStatus,
    RoomStatus,
    WashroomType,
    BedStatus,
)

User = get_user_model()


@pytest.mark.django_db
class TestHostelsModels:
    """Test suite for physical accommodation models."""

    @pytest.fixture
    def hostel_setup(self):
        """Fixture providing complete hostel hierarchy structure."""
        univ = University.objects.create(name='Hostel LPU Test Univ', code='LPU-HT')
        hostel = Hostel.objects.create(
            university=univ,
            name='Boys Hostel 1',
            code='BH-1',
            gender_policy=GenderPolicy.MALE,
            status=HostelStatus.ACTIVE,
            total_capacity=100
        )
        block = Block.objects.create(hostel=hostel, name='Block A')
        floor = Floor.objects.create(block=block, floor_number=1)
        facility_ac = Facility.objects.create(name='Air Conditioner')
        facility_washroom = Facility.objects.create(name='Attached Washroom')

        room = Room.objects.create(
            floor=floor,
            room_number='101',
            capacity=2,
            washroom_type=WashroomType.ATTACHED,
            is_air_conditioned=True,
            status=RoomStatus.AVAILABLE
        )
        room.facilities.add(facility_ac, facility_washroom)

        bed_a = Bed.objects.create(room=room, bed_identifier='A', status=BedStatus.VACANT)
        bed_b = Bed.objects.create(room=room, bed_identifier='B', status=BedStatus.VACANT)

        return {
            'university': univ,
            'hostel': hostel,
            'block': block,
            'floor': floor,
            'room': room,
            'bed_a': bed_a,
            'bed_b': bed_b,
            'facilities': [facility_ac, facility_washroom],
        }

    def test_hostel_creation(self, hostel_setup):
        """Verify Hostel attributes and string representation."""
        hostel = hostel_setup['hostel']
        assert hostel.code == 'BH-1'
        assert hostel.gender_policy == GenderPolicy.MALE
        assert str(hostel) == 'Boys Hostel 1 (BH-1) - Boys Hostel'

    def test_room_and_bed_hierarchy(self, hostel_setup):
        """Verify Room and Bed links and vacancy counts."""
        room = hostel_setup['room']
        assert room.capacity == 2
        assert room.is_air_conditioned is True
        assert room.vacant_beds_count == 2
        assert room.occupied_beds_count == 0
        assert room.is_full is False

        # Mark one bed as occupied
        bed_a = hostel_setup['bed_a']
        bed_a.status = BedStatus.OCCUPIED
        bed_a.save()

        assert room.vacant_beds_count == 1
        assert room.occupied_beds_count == 1
        assert room.is_full is False

        # Mark second bed as occupied
        bed_b = hostel_setup['bed_b']
        bed_b.status = BedStatus.OCCUPIED
        bed_b.save()

        assert room.vacant_beds_count == 0
        assert room.occupied_beds_count == 2
        assert room.is_full is True

    def test_room_facilities_association(self, hostel_setup):
        """Verify dynamic facility mapping on rooms."""
        room = hostel_setup['room']
        facility_names = list(room.facilities.values_list('name', flat=True))
        assert 'Air Conditioner' in facility_names
        assert 'Attached Washroom' in facility_names

    def test_bed_identifier_uniqueness_within_room(self, hostel_setup):
        """Verify duplicate bed identifiers within the same room raise IntegrityError."""
        room = hostel_setup['room']
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                Bed.objects.create(room=room, bed_identifier='A')

    def test_warden_assignment_creation(self, hostel_setup):
        """Verify warden assignment to hostel with delegated authority flag."""
        warden_user = User.objects.create_user(
            email='warden.bh1@lpu.in',
            password='WardenPassword123!',
            role=Role.WARDEN
        )
        assignment = WardenAssignment.objects.create(
            user=warden_user,
            hostel=hostel_setup['hostel'],
            can_approve_allocation=True,
            is_active=True
        )
        assert assignment.can_approve_allocation is True
        assert assignment.is_active is True
        assert str(assignment) == 'warden.bh1@lpu.in -> BH-1 [Can Approve]'

