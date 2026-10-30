"""
Transactional Bed Allocation Engine.
Implements automatic bed assignment (Decision 2), pessimistic concurrency locking (select_for_update),
priority fallback logic, and atomic collective placement for confirmed roommate groups.
"""
from datetime import date
from typing import Optional, List
from django.core.exceptions import ValidationError
from django.db import transaction
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _

from apps.hostels.models import Bed, BedStatus, RoomStatus
from apps.applications.models import HostelApplication, ApplicationStatus
from apps.allocations.models import Allocation, AllocationHistory
from apps.roommates.models import RoommateGroup
from apps.allocations.services.eligibility import (
    validate_student_for_allocation,
    validate_roommate_group_for_allocation,
)

User = get_user_model()


def allocate_individual_student(
    application: HostelApplication,
    allocated_by: User,
    start_date: date,
    end_date: date
) -> Optional[Allocation]:
    """
    Atomically allocate a bed to an eligible student based on their prioritized choices (Rank 1, 2, 3).
    
    Decision 2: Student selects a preferred room; system automatically assigns an available bed.
    Uses pessimistic database row-locking (select_for_update) to prevent race conditions.
    If no preferred beds are available, falls back to subsequent priority choices, or marks WAITLISTED.
    """
    student = application.student
    cycle = application.cycle

    with transaction.atomic():
        # 1. Eligibility validation
        is_eligible, reason, _ = validate_student_for_allocation(student, cycle)
        if not is_eligible:
            raise ValidationError(_(f"Cannot allocate student {student.student_id}: {reason}"))

        # 2. Query choices ordered by priority (1, 2, 3)
        choices = application.choices.select_related('hostel', 'room').order_by('priority')

        assigned_bed = None

        for choice in choices:
            # Case A: Student selected a preferred room (Decision 2)
            if choice.room:
                # Lock and fetch first available vacant bed in this specific room
                vacant_bed = Bed.objects.select_for_update().filter(
                    room=choice.room,
                    status=BedStatus.VACANT
                ).order_by('bed_identifier').first()

                if vacant_bed:
                    assigned_bed = vacant_bed
                    break

            # Case B: Room was full or no specific room selected -> check hostel for vacant beds
            hostel_bed = Bed.objects.select_for_update().filter(
                room__floor__block__hostel=choice.hostel,
                status=BedStatus.VACANT
            ).order_by('room__floor__floor_number', 'room__room_number', 'bed_identifier').first()

            if hostel_bed:
                assigned_bed = hostel_bed
                break

        # 3. If no beds available in any prioritized choices, place application on waitlist
        if not assigned_bed:
            application.status = ApplicationStatus.WAITLISTED
            application.save(update_fields=['status'])
            return None

        # 4. Atomically occupy bed and update room status if full
        assigned_bed.status = BedStatus.OCCUPIED
        assigned_bed.save(update_fields=['status'])

        target_room = assigned_bed.room
        if target_room.is_full:
            target_room.status = RoomStatus.FULL
            target_room.save(update_fields=['status'])

        # 5. Create Allocation record
        allocation = Allocation.objects.create(
            student=student,
            bed=assigned_bed,
            application=application,
            cycle=cycle,
            allocated_by=allocated_by,
            start_date=start_date,
            end_date=end_date,
            is_active=True
        )

        # 6. Update application status to ALLOCATED
        application.status = ApplicationStatus.ALLOCATED
        application.save(update_fields=['status'])

        # 7. Create immutable AllocationHistory audit log
        AllocationHistory.objects.create(
            allocation=allocation,
            action='INITIAL_ASSIGNMENT',
            new_bed=assigned_bed,
            recorded_by=allocated_by,
            notes=f"Auto-assigned bed {assigned_bed.bed_identifier} in Room {target_room.room_number} ({target_room.floor.block.hostel.name})."
        )

        return allocation


def allocate_roommate_group(
    group: RoommateGroup,
    allocated_by: User,
    start_date: date,
    end_date: date
) -> List[Allocation]:
    """
    Atomically allocate beds for an entire confirmed roommate group in their agreed common target room.
    Uses pessimistic locking (select_for_update) to claim all required beds simultaneously.
    """
    with transaction.atomic():
        # 1. Group eligibility validation
        is_eligible, reason, member_apps = validate_roommate_group_for_allocation(group)
        if not is_eligible:
            raise ValidationError(_(f"Cannot allocate roommate group #{group.id}: {reason}"))

        target_room = group.target_room
        members = list(group.members.select_related('student').order_by('joined_at'))
        required_count = len(members)

        # 2. Pessimistically lock vacant beds in the agreed target room
        vacant_beds = list(
            Bed.objects.select_for_update().filter(
                room=target_room,
                status=BedStatus.VACANT
            ).order_by('bed_identifier')[:required_count]
        )

        if len(vacant_beds) < required_count:
            raise ValidationError(_(
                f"Target Room {target_room.room_number} only has {len(vacant_beds)} locked vacant beds, "
                f"but {required_count} are required for the group."
            ))

        allocations = []

        # 3. Pair each group member with a bed in the agreed room
        for idx, member in enumerate(members):
            bed = vacant_beds[idx]
            app = member_apps[idx]

            # Mark bed as occupied
            bed.status = BedStatus.OCCUPIED
            bed.save(update_fields=['status'])

            # Create allocation
            alloc = Allocation.objects.create(
                student=member.student,
                bed=bed,
                application=app,
                cycle=group.cycle,
                allocated_by=allocated_by,
                start_date=start_date,
                end_date=end_date,
                is_active=True
            )

            # Update application status
            app.status = ApplicationStatus.ALLOCATED
            app.save(update_fields=['status'])

            # Log history
            AllocationHistory.objects.create(
                allocation=alloc,
                action='INITIAL_ASSIGNMENT',
                new_bed=bed,
                recorded_by=allocated_by,
                notes=f"Group #{group.id} allocation: Bed {bed.bed_identifier} in Room {target_room.room_number}."
            )
            allocations.append(alloc)

        # 4. Update room status if full
        if target_room.is_full:
            target_room.status = RoomStatus.FULL
            target_room.save(update_fields=['status'])

        # 5. Mark group as confirmed
        group.is_confirmed = True
        group.save(update_fields=['is_confirmed'])

        return allocations


def cancel_or_release_allocation(
    allocation: Allocation,
    recorded_by: User,
    reason: str = ''
) -> None:
    """
    Safely deactivate an allocation, free the occupied bed, and log cancellation audit history.
    """
    with transaction.atomic():
        allocation.is_active = False
        allocation.save(update_fields=['is_active'])

        bed = allocation.bed
        bed.status = BedStatus.VACANT
        bed.save(update_fields=['status'])

        room = bed.room
        if room.status == RoomStatus.FULL:
            room.status = RoomStatus.AVAILABLE
            room.save(update_fields=['status'])

        # Update application status to CANCELLED
        app = allocation.application
        app.status = ApplicationStatus.CANCELLED
        app.save(update_fields=['status'])

        # Audit history log
        AllocationHistory.objects.create(
            allocation=allocation,
            action='CANCELLATION',
            previous_bed=bed,
            recorded_by=recorded_by,
            notes=reason or "Allocation cancelled and bed released."
        )
