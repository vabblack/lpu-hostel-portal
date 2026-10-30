"""
Roommate Request and Group Management Service.
Enforces mutual room alignment, same-gender validation, capacity limits (2-4 beds),
and atomic group formation.
"""
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from apps.students.models import StudentProfile
from apps.applications.models import AccommodationCycle, HostelApplication, ApplicationStatus
from apps.hostels.models import Room
from apps.roommates.models import (
    RoommateRequest,
    RoommateGroup,
    RoommateGroupMember,
    RequestStatus,
)


def get_student_selected_room(student: StudentProfile, cycle: AccommodationCycle) -> Room | None:
    """
    Retrieve the preferred room selected in the student's active application for the given cycle.
    Prioritizes priority 1 room choice.
    """
    active_app = HostelApplication.objects.filter(
        student=student,
        cycle=cycle,
    ).exclude(status__in=[ApplicationStatus.CANCELLED, ApplicationStatus.REJECTED]).first()

    if not active_app:
        return None

    # Check choices in order of priority (1, 2, 3) with a room specified
    choice = active_app.choices.filter(room__isnull=False).order_by('priority').first()
    return choice.room if choice else None


def get_student_active_group(student: StudentProfile, cycle: AccommodationCycle) -> RoommateGroup | None:
    """Return the active RoommateGroup for a student in a specific accommodation cycle, if any."""
    membership = RoommateGroupMember.objects.filter(
        student=student,
        group__cycle=cycle,
    ).select_related('group', 'group__target_room').first()
    return membership.group if membership else None


def send_roommate_request(
    sender: StudentProfile,
    receiver_student_id: str,
    cycle: AccommodationCycle
) -> RoommateRequest:
    """
    Send a direct roommate request to another student identified by their official Student ID.
    Validates self-request, gender policy, cycle activity, group capacity, and duplicate requests.
    """
    clean_id = receiver_student_id.strip().upper()
    try:
        receiver = StudentProfile.objects.select_related('registry', 'user').get(
            registry__student_id__iexact=clean_id
        )
    except StudentProfile.DoesNotExist:
        raise ValidationError(_(f"No student found with Student ID '{clean_id}'."))

    if sender.pk == receiver.pk:
        raise ValidationError(_("You cannot send a roommate request to yourself."))

    if not cycle.is_active:
        raise ValidationError(_("Roommate requests can only be sent during an active accommodation cycle."))

    # Gender isolation: Roommates must strictly share the same verified gender
    if sender.registry.gender != receiver.registry.gender:
        raise ValidationError(_("Roommate requests can only be formed between students of the same gender."))

    # Check if either student is already in a confirmed or full roommate group
    sender_group = get_student_active_group(sender, cycle)
    if sender_group and (sender_group.is_confirmed or sender_group.member_count >= sender_group.target_room.capacity):
        raise ValidationError(_("You are already part of a confirmed or full roommate group."))

    receiver_group = get_student_active_group(receiver, cycle)
    if receiver_group and (receiver_group.is_confirmed or receiver_group.member_count >= receiver_group.target_room.capacity):
        raise ValidationError(_(f"Student {receiver.student_id} is already part of a confirmed or full roommate group."))

    # Check for existing pending request in either direction
    if RoommateRequest.objects.filter(
        sender=sender, receiver=receiver, cycle=cycle, status=RequestStatus.PENDING
    ).exists():
        raise ValidationError(_(f"You already have a pending roommate request sent to {receiver.student_id}."))

    if RoommateRequest.objects.filter(
        sender=receiver, receiver=sender, cycle=cycle, status=RequestStatus.PENDING
    ).exists():
        raise ValidationError(_(f"{receiver.student_id} has already sent you a request. Please respond to their request instead."))

    # Create request
    return RoommateRequest.objects.create(
        sender=sender,
        receiver=receiver,
        cycle=cycle,
        status=RequestStatus.PENDING,
    )


def respond_to_roommate_request(
    request_id: int,
    responder: StudentProfile,
    action: str
) -> RoommateRequest:
    """
    Respond to an incoming roommate request (ACCEPT or REJECT).
    When accepting, enforces mutual room alignment and room capacity bounds.
    """
    try:
        roommate_req = RoommateRequest.objects.select_related(
            'sender', 'receiver', 'cycle', 'sender__registry', 'receiver__registry'
        ).get(pk=request_id)
    except RoommateRequest.DoesNotExist:
        raise ValidationError(_("Roommate request not found."))

    if roommate_req.receiver != responder:
        raise ValidationError(_("You are not authorized to respond to this roommate request."))

    if roommate_req.status != RequestStatus.PENDING:
        raise ValidationError(_(f"This request has already been {roommate_req.get_status_display().lower()}."))

    action = action.upper()
    if action not in ['ACCEPT', 'REJECT']:
        raise ValidationError(_("Invalid action. Must be 'ACCEPT' or 'REJECT'."))

    if action == 'REJECT':
        roommate_req.status = RequestStatus.REJECTED
        roommate_req.responded_at = timezone.now()
        roommate_req.save(update_fields=['status', 'responded_at'])
        return roommate_req

    # Action is ACCEPT: enforce mutual room alignment & group capacity
    with transaction.atomic():
        sender = roommate_req.sender
        cycle = roommate_req.cycle

        sender_group = get_student_active_group(sender, cycle)
        responder_group = get_student_active_group(responder, cycle)

        # Both cannot already belong to two separate groups
        if sender_group and responder_group and sender_group != responder_group:
            raise ValidationError(_("Both students belong to different active roommate groups and cannot merge."))

        target_room = None
        target_group = None

        if sender_group:
            target_group = sender_group
            target_room = sender_group.target_room
            # Responder must have target_room selected in application choices
            responder_room = get_student_selected_room(responder, cycle)
            if not responder_room or responder_room != target_room:
                raise ValidationError(_(
                    f"Mutual room alignment failed: You must have chosen Room {target_room.room_number} "
                    f"in Hostel '{target_room.floor.block.hostel.name}' in your application to join this group."
                ))
        elif responder_group:
            target_group = responder_group
            target_room = responder_group.target_room
            # Sender must have target_room selected in application choices
            sender_room = get_student_selected_room(sender, cycle)
            if not sender_room or sender_room != target_room:
                raise ValidationError(_(
                    f"Mutual room alignment failed: Sender must have chosen Room {target_room.room_number} "
                    f"in Hostel '{target_room.floor.block.hostel.name}' in their application."
                ))
        else:
            # Neither is in a group yet: verify both chose the identical room
            sender_room = get_student_selected_room(sender, cycle)
            responder_room = get_student_selected_room(responder, cycle)

            if not sender_room or not responder_room:
                raise ValidationError(_(
                    "Mutual room alignment failed: Both students must select a preferred room in their application "
                    "before forming a roommate group."
                ))

            if sender_room != responder_room:
                raise ValidationError(_(
                    f"Mutual room alignment failed: Room preferences do not match. "
                    f"Sender selected Room {sender_room.room_number} ({sender_room.floor.block.hostel.name}), "
                    f"while you selected Room {responder_room.room_number} ({responder_room.floor.block.hostel.name})."
                ))
            target_room = sender_room

        # Capacity check
        capacity = target_room.capacity
        if target_group:
            current_members = target_group.members.count()
            if current_members >= capacity:
                raise ValidationError(_(
                    f"Target Room {target_room.room_number} capacity ({capacity} students) has already been reached."
                ))
            # Add responder (or sender) to existing group
            RoommateGroupMember.objects.create(group=target_group, student=responder)
            if current_members + 1 >= capacity:
                target_group.is_confirmed = True
                target_group.save(update_fields=['is_confirmed'])
        else:
            # Create new RoommateGroup
            target_group = RoommateGroup.objects.create(
                cycle=cycle,
                target_room=target_room,
                is_confirmed=(capacity == 2),  # Instantly confirmed if room is 2-seater
            )
            RoommateGroupMember.objects.create(group=target_group, student=sender)
            RoommateGroupMember.objects.create(group=target_group, student=responder)

        # Mark request as ACCEPTED
        roommate_req.status = RequestStatus.ACCEPTED
        roommate_req.responded_at = timezone.now()
        roommate_req.save(update_fields=['status', 'responded_at'])

        # If group is now confirmed (full capacity), cancel other pending requests for these members
        if target_group.is_confirmed:
            group_student_ids = target_group.members.values_list('student_id', flat=True)
            RoommateRequest.objects.filter(
                cycle=cycle,
                status=RequestStatus.PENDING,
            ).filter(
                models_q_filter(group_student_ids)
            ).update(
                status=RequestStatus.CANCELLED,
                responded_at=timezone.now()
            )

    return roommate_req


def models_q_filter(student_ids):
    from django.db.models import Q
    return Q(sender_id__in=student_ids) | Q(receiver_id__in=student_ids)


def cancel_roommate_request(request_id: int, sender: StudentProfile) -> RoommateRequest:
    """Allow the sender to cancel their own pending roommate request."""
    try:
        roommate_req = RoommateRequest.objects.get(pk=request_id)
    except RoommateRequest.DoesNotExist:
        raise ValidationError(_("Roommate request not found."))

    if roommate_req.sender != sender:
        raise ValidationError(_("You are only permitted to cancel requests you sent."))

    if roommate_req.status != RequestStatus.PENDING:
        raise ValidationError(_(f"Cannot cancel a request that is already {roommate_req.get_status_display().lower()}."))

    roommate_req.status = RequestStatus.CANCELLED
    roommate_req.responded_at = timezone.now()
    roommate_req.save(update_fields=['status', 'responded_at'])
    return roommate_req


def leave_roommate_group(group_id: int, student: StudentProfile) -> None:
    """Remove a student from a roommate group. If fewer than 2 remain, disband group."""
    try:
        membership = RoommateGroupMember.objects.select_related('group').get(
            group_id=group_id,
            student=student
        )
    except RoommateGroupMember.DoesNotExist:
        raise ValidationError(_("You are not a member of this roommate group."))

    with transaction.atomic():
        group = membership.group
        membership.delete()

        remaining_count = group.members.count()
        if remaining_count < 2:
            group.delete()
        else:
            group.is_confirmed = False
            group.save(update_fields=['is_confirmed'])
