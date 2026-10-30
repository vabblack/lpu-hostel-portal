"""
Pre-Allocation Eligibility and Cycle Validation Service.
Validates student academic status, application states, active allocation constraints,
and roommate group collective placement requirements.
"""
from typing import Tuple, Optional, List
from django.db.models import QuerySet

from apps.students.models import StudentProfile
from apps.academics.models import EnrollmentStatus
from apps.applications.models import (
    AccommodationCycle,
    HostelApplication,
    ApplicationStatus,
)
from apps.hostels.models import BedStatus
from apps.allocations.models import Allocation
from apps.roommates.models import RoommateGroup


def validate_student_for_allocation(
    student: StudentProfile,
    cycle: AccommodationCycle,
    require_approved_status: bool = False
) -> Tuple[bool, str, Optional[HostelApplication]]:
    """
    Validate whether an individual student is eligible for a bed allocation in the given cycle.

    Criteria:
    1. Student registry enrollment status must be ACTIVE (not suspended, graduated, or withdrawn).
    2. Student user account must be active.
    3. Accommodation cycle must be active.
    4. Student must not already possess an active allocation in the system.
    5. Student must have an application in SUBMITTED, UNDER_REVIEW, or APPROVED status.
       (If require_approved_status=True, strictly requires APPROVED).
    """
    # 1. Active enrollment and user check
    if hasattr(student, 'registry') and student.registry:
        if student.registry.enrollment_status != EnrollmentStatus.ACTIVE:
            return False, "Student enrollment is inactive or suspended.", None

    if student.user and not student.user.is_active:
        return False, "Student user account is inactive or disabled.", None

    # 2. Cycle active check
    if not cycle.is_active:
        return False, f"Accommodation cycle '{cycle.name}' is closed or inactive.", None

    # 3. Existing active allocation check
    existing_alloc = Allocation.objects.filter(student=student, is_active=True).first()
    if existing_alloc:
        return (
            False,
            f"Student already holds an active bed allocation ({existing_alloc.bed}) in {existing_alloc.cycle.name}.",
            None
        )

    # 4. Valid application check
    app = HostelApplication.objects.filter(student=student, cycle=cycle).first()
    if not app:
        return False, f"No accommodation application found for cycle '{cycle.name}'.", None

    if app.status in [ApplicationStatus.REJECTED, ApplicationStatus.CANCELLED]:
        return False, f"Application #{app.id} is {app.get_status_display().lower()} and cannot be allocated.", app

    if app.status == ApplicationStatus.DRAFT:
        return False, f"Application #{app.id} is still in draft state and has not been submitted.", app

    if app.status == ApplicationStatus.ALLOCATED:
        return False, f"Application #{app.id} has already been fulfilled and allocated.", app

    if require_approved_status and app.status != ApplicationStatus.APPROVED:
        return False, f"Application #{app.id} status is '{app.get_status_display()}'. Must be 'Approved' to allocate.", app

    return True, "Eligible", app


def validate_roommate_group_for_allocation(
    group: RoommateGroup,
    require_approved_status: bool = False
) -> Tuple[bool, str, List[HostelApplication]]:
    """
    Validate whether a roommate group is eligible for collective bed allocation.

    Criteria:
    1. Group must contain at least 2 members.
    2. Group member count must not exceed the target room capacity.
    3. Every member must pass individual pre-allocation validation.
    4. Target room must contain sufficient vacant, non-maintenance beds for all members.
    """
    members = list(group.members.select_related('student', 'student__registry').all())
    member_count = len(members)

    if member_count < 2:
        return False, "Roommate group must have at least 2 members to allocate as a group.", []

    target_room = group.target_room
    if member_count > target_room.capacity:
        return (
            False,
            f"Roommate group size ({member_count}) exceeds target Room {target_room.room_number} capacity ({target_room.capacity}).",
            []
        )

    member_apps = []
    for member in members:
        is_eligible, reason, app = validate_student_for_allocation(
            student=member.student,
            cycle=group.cycle,
            require_approved_status=require_approved_status
        )
        if not is_eligible:
            return (
                False,
                f"Group allocation failed: Member {member.student.student_id} is ineligible ({reason}).",
                []
            )
        member_apps.append(app)

    # Check vacant bed capacity in the agreed target room
    vacant_beds_count = target_room.beds.filter(
        status=BedStatus.VACANT
    ).count()

    if vacant_beds_count < member_count:
        return (
            False,
            f"Room {target_room.room_number} has only {vacant_beds_count} vacant beds available, but the group requires {member_count}.",
            []
        )

    return True, "Roommate group is fully eligible for collective allocation.", member_apps


def get_allocatable_applications_for_cycle(
    cycle: AccommodationCycle,
    status: str = ApplicationStatus.APPROVED
) -> QuerySet[HostelApplication]:
    """
    Return a QuerySet of applications eligible to be processed by the allocation engine,
    excluding students who already hold active allocations.
    """
    active_allocated_student_ids = Allocation.objects.filter(
        is_active=True
    ).values_list('student_id', flat=True)

    return HostelApplication.objects.filter(
        cycle=cycle,
        status=status
    ).exclude(
        student_id__in=active_allocated_student_ids
    ).select_related('student', 'student__registry')

