"""
Roommate Management Views: Preference configuration, candidate discovery feed,
request center, and group status.
"""
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.http import require_POST
from django.utils.translation import gettext_lazy as _

from apps.accounts.decorators import student_required
from apps.applications.models import AccommodationCycle
from apps.students.models import StudentProfile
from apps.roommates.models import (
    RoommatePreference,
    RoommateRequest,
    RequestStatus,
    RoommateGroup,
)
from apps.roommates.forms import RoommatePreferenceForm
from apps.roommates.services.algorithm import get_or_compute_match_score
from apps.roommates.services.recommendations import get_roommate_recommendations
from apps.roommates.services.requests import (
    send_roommate_request,
    respond_to_roommate_request,
    cancel_roommate_request,
    leave_roommate_group,
    get_student_active_group,
    get_student_selected_room,
)


@login_required
@student_required
def preferences_view(request):
    """View and update 7-factor roommate lifestyle preferences."""
    student = request.user.student_profile
    existing_pref = RoommatePreference.objects.filter(student=student).first()

    if request.method == 'POST':
        form = RoommatePreferenceForm(request.POST, instance=existing_pref)
        if form.is_valid():
            form.save(student=student)
            messages.success(
                request,
                _("Your lifestyle preferences have been saved! Roommate compatibility matching is active.")
            )
            return redirect('roommates:discover')
        else:
            messages.error(request, _("Please correct the errors in your preference responses below."))
    else:
        form = RoommatePreferenceForm(instance=existing_pref)

    context = {
        'form': form,
        'has_preferences': existing_pref is not None,
    }
    return render(request, 'roommates/preferences.html', context)


@login_required
@student_required
def discover_view(request):
    """
    Roommate Discovery: Direct Student ID search bar + ranked compatibility candidate feed.
    """
    student = request.user.student_profile
    cycle = AccommodationCycle.objects.filter(is_active=True).first()
    has_preferences = RoommatePreference.objects.filter(student=student).exists()

    direct_result = None
    search_query = request.GET.get('q', '').strip()

    if search_query:
        try:
            target = StudentProfile.objects.select_related('registry', 'registry__branch').get(
                registry__student_id__iexact=search_query
            )
            if target.pk == student.pk:
                messages.warning(request, _("You cannot search for or request yourself."))
            elif target.registry.gender != student.registry.gender:
                messages.error(request, _("Roommate requests can only be formed between students of the same gender."))
            else:
                score = get_or_compute_match_score(student, target) if has_preferences else None
                student_room = get_student_selected_room(student, cycle) if cycle else None
                target_room = get_student_selected_room(target, cycle) if cycle else None
                is_aligned = (student_room is not None and target_room is not None and student_room.pk == target_room.pk)

                # Check if request already pending
                has_pending = False
                if cycle:
                    has_pending = RoommateRequest.objects.filter(
                        sender=student, receiver=target, cycle=cycle, status=RequestStatus.PENDING
                    ).exists()

                direct_result = {
                    'student': target,
                    'score': score,
                    'is_room_aligned': is_aligned,
                    'target_room': target_room,
                    'has_pending': has_pending,
                }
        except StudentProfile.DoesNotExist:
            messages.error(request, _(f"No student found with Student ID '{search_query}'."))

    recommendations = []
    if cycle and has_preferences:
        recommendations = get_roommate_recommendations(student, cycle)

    context = {
        'cycle': cycle,
        'has_preferences': has_preferences,
        'search_query': search_query,
        'direct_result': direct_result,
        'recommendations': recommendations,
    }
    return render(request, 'roommates/discover.html', context)


@login_required
@student_required
def requests_view(request):
    """
    Roommate Requests Center: Incoming requests, outgoing requests, and active group status.
    """
    student = request.user.student_profile
    cycle = AccommodationCycle.objects.filter(is_active=True).first()

    group = get_student_active_group(student, cycle) if cycle else None
    incoming_raw = (
        RoommateRequest.objects.filter(
            receiver=student, cycle=cycle, status=RequestStatus.PENDING
        ).select_related('sender', 'sender__registry', 'sender__registry__branch')
        if cycle else []
    )
    outgoing = (
        RoommateRequest.objects.filter(
            sender=student, cycle=cycle
        ).select_related('receiver', 'receiver__registry', 'receiver__registry__branch').order_by('-created_at')
        if cycle else []
    )

    # Attach computed match scores and room alignment info to incoming requests
    incoming = []
    student_room = get_student_selected_room(student, cycle) if cycle else None

    for req in incoming_raw:
        sender_room = get_student_selected_room(req.sender, cycle) if cycle else None
        target_group_room = group.target_room if group else student_room
        is_aligned = (target_group_room is not None and sender_room is not None and target_group_room.pk == sender_room.pk)
        score = get_or_compute_match_score(student, req.sender)

        incoming.append({
            'request': req,
            'sender': req.sender,
            'score': score,
            'sender_room': sender_room,
            'is_room_aligned': is_aligned,
        })

    group_members = group.members.select_related('student', 'student__registry') if group else []
    bed_slots = []
    if group:
        capacity = group.target_room.capacity
        for idx in range(capacity):
            if idx < len(group_members):
                bed_slots.append({'filled': True, 'member': group_members[idx].student})
            else:
                bed_slots.append({'filled': False, 'slot_num': idx + 1})

    context = {
        'cycle': cycle,
        'group': group,
        'group_members': group_members,
        'bed_slots': bed_slots,
        'incoming': incoming,
        'outgoing': outgoing,
    }
    return render(request, 'roommates/requests.html', context)


@login_required
@student_required
@require_POST
def send_request_action(request):
    """Send a roommate request via POST."""
    student = request.user.student_profile
    cycle = AccommodationCycle.objects.filter(is_active=True).first()
    if not cycle:
        messages.error(request, _("No active accommodation cycle found."))
        return redirect('roommates:discover')

    target_id = request.POST.get('target_student_id', '').strip()
    try:
        req = send_roommate_request(student, target_id, cycle)
        messages.success(request, _(f"Roommate request sent to {req.receiver.student_id} successfully!"))
    except ValidationError as e:
        messages.error(request, e.message if hasattr(e, 'message') else str(e))

    return redirect('roommates:requests')


@login_required
@student_required
@require_POST
def respond_request_action(request, request_id):
    """Respond (ACCEPT or REJECT) to an incoming roommate request."""
    student = request.user.student_profile
    action = request.POST.get('action', '').upper()
    try:
        req = respond_to_roommate_request(request_id, student, action)
        if action == 'ACCEPT':
            messages.success(request, _(f"Accepted request from {req.sender.student_id}. Roommate group updated!"))
        else:
            messages.info(request, _(f"Declined request from {req.sender.student_id}."))
    except ValidationError as e:
        messages.error(request, e.message if hasattr(e, 'message') else str(e))

    return redirect('roommates:requests')


@login_required
@student_required
@require_POST
def cancel_request_action(request, request_id):
    """Cancel a pending outgoing roommate request."""
    student = request.user.student_profile
    try:
        cancel_roommate_request(request_id, student)
        messages.success(request, _("Roommate request cancelled."))
    except ValidationError as e:
        messages.error(request, e.message if hasattr(e, 'message') else str(e))

    return redirect('roommates:requests')


@login_required
@student_required
@require_POST
def leave_group_action(request, group_id):
    """Leave the current roommate group."""
    student = request.user.student_profile
    try:
        leave_roommate_group(group_id, student)
        messages.success(request, _("You have left the roommate group."))
    except ValidationError as e:
        messages.error(request, e.message if hasattr(e, 'message') else str(e))

    return redirect('roommates:requests')
