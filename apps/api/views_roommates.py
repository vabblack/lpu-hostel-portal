"""
API Roommates Views: 7-factor preference management, deterministic match recommendations,
search, and request workflows.
"""
import json
from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_GET, require_POST

from apps.accounts.models import Role
from apps.applications.models import AccommodationCycle
from apps.roommates.models import (
    RoommatePreference,
    RoommateRequest,
    RequestStatus,
    FoodPreference,
)
from apps.roommates.services.algorithm import get_or_compute_match_score
from apps.roommates.services.recommendations import get_roommate_recommendations
from apps.roommates.services.requests import (
    send_roommate_request,
    respond_to_roommate_request,
    cancel_roommate_request,
    get_student_active_group,
    get_student_selected_room,
)
from apps.students.models import StudentProfile


def _require_student(request):
    """Helper to check if request is from an authenticated student."""
    if not request.user.is_authenticated:
        return None, JsonResponse({'error': 'Authentication required.'}, status=401)
    if request.user.role != Role.STUDENT or not hasattr(request.user, 'student_profile'):
        return None, JsonResponse({'error': 'Student account required.'}, status=403)
    return request.user.student_profile, None


def preferences_api_view(request):
    """GET and POST for 7-factor roommate preferences."""
    student, error_resp = _require_student(request)
    if error_resp:
        return error_resp

    pref = RoommatePreference.objects.filter(student=student).first()

    if request.method == 'GET':
        if not pref:
            return JsonResponse({'has_preferences': False, 'preferences': None})

        return JsonResponse({
            'has_preferences': True,
            'preferences': {
                'sleeping_schedule': pref.sleeping_schedule,
                'cleanliness': pref.cleanliness,
                'study_habits': pref.study_habits,
                'noise_tolerance': pref.noise_tolerance,
                'food_preference': pref.food_preference,
                'social_preference': pref.social_preference,
                'temperature_pref': pref.temperature_pref,
            }
        })

    elif request.method == 'POST':
        try:
            body = json.loads(request.body.decode('utf-8'))
        except Exception:
            body = request.POST

        try:
            sleeping_schedule = int(body.get('sleeping_schedule', 3))
            cleanliness = int(body.get('cleanliness', 3))
            study_habits = int(body.get('study_habits', 3))
            noise_tolerance = int(body.get('noise_tolerance', 3))
            food_preference = body.get('food_preference', FoodPreference.FLEXIBLE)
            social_preference = int(body.get('social_preference', 3))
            temperature_pref = int(body.get('temperature_pref', 3))
        except (ValueError, TypeError) as e:
            return JsonResponse({'error': 'Invalid numerical values provided.'}, status=400)

        if not pref:
            pref = RoommatePreference(student=student)

        pref.sleeping_schedule = sleeping_schedule
        pref.cleanliness = cleanliness
        pref.study_habits = study_habits
        pref.noise_tolerance = noise_tolerance
        pref.food_preference = food_preference
        pref.social_preference = social_preference
        pref.temperature_pref = temperature_pref

        try:
            pref.full_clean()
            pref.save()
            return JsonResponse({
                'success': True,
                'message': 'Roommate lifestyle preferences saved successfully.',
                'preferences': {
                    'sleeping_schedule': pref.sleeping_schedule,
                    'cleanliness': pref.cleanliness,
                    'study_habits': pref.study_habits,
                    'noise_tolerance': pref.noise_tolerance,
                    'food_preference': pref.food_preference,
                    'social_preference': pref.social_preference,
                    'temperature_pref': pref.temperature_pref,
                }
            })
        except ValidationError as e:
            return JsonResponse({'error': e.message_dict if hasattr(e, 'message_dict') else str(e)}, status=400)

    return JsonResponse({'error': 'Method not allowed.'}, status=405)


@require_GET
def discover_candidates_view(request):
    """
    Candidate discovery: ranked recommendations based on 7-factor algorithm,
    plus search by student ID.
    """
    student, error_resp = _require_student(request)
    if error_resp:
        return error_resp

    cycle = AccommodationCycle.objects.filter(is_active=True).first()
    has_pref = RoommatePreference.objects.filter(student=student).exists()

    search_query = request.GET.get('q', '').strip()
    search_result = None

    if search_query:
        try:
            target = StudentProfile.objects.select_related('registry', 'registry__branch').get(
                registry__student_id__iexact=search_query
            )
            if target.pk != student.pk and target.registry.gender == student.registry.gender:
                score = get_or_compute_match_score(student, target) if has_pref else None
                student_room = get_student_selected_room(student, cycle) if cycle else None
                target_room = get_student_selected_room(target, cycle) if cycle else None
                is_aligned = (student_room is not None and target_room is not None and student_room.pk == target_room.pk)
                
                has_pending = False
                if cycle:
                    has_pending = RoommateRequest.objects.filter(
                        sender=student, receiver=target, cycle=cycle, status=RequestStatus.PENDING
                    ).exists()

                search_result = {
                    'student_id': target.student_id,
                    'full_name': target.registry.full_name,
                    'branch': target.registry.branch.name if target.registry.branch else '',
                    'cgpa': float(getattr(target.registry, 'cgpa', 0)) if getattr(target.registry, 'cgpa', None) is not None else None,
                    'score': score.score_percentage if score else None,
                    'is_room_aligned': is_aligned,
                    'selected_room': str(target_room) if target_room else None,
                    'has_pending_request': has_pending,
                }
        except StudentProfile.DoesNotExist:
            pass

    recommendations = []
    if cycle and has_pref:
        recs = get_roommate_recommendations(student, cycle, limit=15)
        for r in recs:
            cand = r['candidate']
            has_pending = RoommateRequest.objects.filter(
                sender=student, receiver=cand, cycle=cycle, status=RequestStatus.PENDING
            ).exists()

            recommendations.append({
                'student_id': cand.student_id,
                'full_name': cand.registry.full_name,
                'branch': cand.registry.branch.name if cand.registry.branch else '',
                'cgpa': float(getattr(cand.registry, 'cgpa', 0)) if getattr(cand.registry, 'cgpa', None) is not None else None,
                'score': r['score'],
                'is_room_aligned': r['is_room_aligned'],
                'target_room': str(r['target_room']) if r['target_room'] else None,
                'has_pending_request': has_pending,
            })

    return JsonResponse({
        'has_preferences': has_pref,
        'active_cycle': cycle.name if cycle else None,
        'search_result': search_result,
        'recommendations': recommendations,
    })


@require_GET
def roommate_requests_list_view(request):
    """Returns incoming and outgoing roommate requests for current student."""
    student, error_resp = _require_student(request)
    if error_resp:
        return error_resp

    cycle = AccommodationCycle.objects.filter(is_active=True).first()

    received_qs = RoommateRequest.objects.filter(
        receiver=student
    ).select_related('sender', 'sender__registry', 'cycle').order_by('-created_at')

    sent_qs = RoommateRequest.objects.filter(
        sender=student
    ).select_related('receiver', 'receiver__registry', 'cycle').order_by('-created_at')

    def serialize_req(r, is_sender):
        other = r.receiver if is_sender else r.sender
        return {
            'id': r.id,
            'other_student_id': other.student_id,
            'other_full_name': other.registry.full_name,
            'other_branch': other.registry.branch.name if other.registry.branch else '',
            'cycle_name': r.cycle.name,
            'status': r.status,
            'status_display': r.get_status_display(),
            'created_at': r.created_at.strftime('%Y-%m-%d %H:%M'),
            'responded_at': r.responded_at.strftime('%Y-%m-%d %H:%M') if r.responded_at else None,
        }

    return JsonResponse({
        'received_requests': [serialize_req(r, False) for r in received_qs],
        'sent_requests': [serialize_req(r, True) for r in sent_qs],
    })


@require_POST
def send_request_api_view(request):
    """Sends roommate request to target student ID."""
    student, error_resp = _require_student(request)
    if error_resp:
        return error_resp

    try:
        body = json.loads(request.body.decode('utf-8'))
    except Exception:
        body = request.POST

    target_id = body.get('target_student_id') or body.get('student_id')
    if not target_id:
        return JsonResponse({'error': 'Target student ID is required.'}, status=400)

    cycle = AccommodationCycle.objects.filter(is_active=True).first()
    if not cycle:
        return JsonResponse({'error': 'No active accommodation cycle found.'}, status=400)

    try:
        req = send_roommate_request(student, target_id, cycle)
        return JsonResponse({
            'success': True,
            'message': f'Roommate request sent to {target_id}.',
            'request_id': req.id,
        })
    except ValidationError as e:
        msg = e.message if hasattr(e, 'message') else str(e)
        return JsonResponse({'error': msg}, status=400)


@require_POST
def respond_request_api_view(request, pk):
    """Responds (ACCEPT or REJECT) to a received request."""
    student, error_resp = _require_student(request)
    if error_resp:
        return error_resp

    try:
        body = json.loads(request.body.decode('utf-8'))
    except Exception:
        body = request.POST

    action = body.get('action', '').upper()
    if action not in ('ACCEPT', 'REJECT'):
        return JsonResponse({'error': 'Action must be ACCEPT or REJECT.'}, status=400)

    try:
        req = respond_to_roommate_request(pk, student, action)
        return JsonResponse({
            'success': True,
            'message': f'Request has been {req.get_status_display().lower()}.',
            'status': req.status,
        })
    except ValidationError as e:
        msg = e.message if hasattr(e, 'message') else str(e)
        return JsonResponse({'error': msg}, status=400)


@require_POST
def cancel_request_api_view(request, pk):
    """Cancels a pending sent request."""
    student, error_resp = _require_student(request)
    if error_resp:
        return error_resp

    try:
        req = cancel_roommate_request(pk, student)
        return JsonResponse({
            'success': True,
            'message': 'Request cancelled.',
            'status': req.status,
        })
    except ValidationError as e:
        msg = e.message if hasattr(e, 'message') else str(e)
        return JsonResponse({'error': msg}, status=400)


@require_GET
def roommate_group_api_view(request):
    """Returns details on student's current active roommate group."""
    student, error_resp = _require_student(request)
    if error_resp:
        return error_resp

    cycle = AccommodationCycle.objects.filter(is_active=True).first()
    if not cycle:
        return JsonResponse({'group': None})

    group = get_student_active_group(student, cycle)
    if not group:
        return JsonResponse({'group': None})

    members = group.members.select_related('student', 'student__registry', 'student__registry__branch').all()
    room = group.target_room

    return JsonResponse({
        'group': {
            'id': group.id,
            'is_confirmed': group.is_confirmed,
            'target_room': {
                'id': room.id,
                'room_number': room.room_number,
                'hostel_name': room.floor.block.hostel.name,
                'capacity': room.capacity,
            },
            'members': [
                {
                    'student_id': m.student.student_id,
                    'full_name': m.student.registry.full_name,
                    'branch': m.student.registry.branch.name if m.student.registry.branch else '',
                    'joined_at': m.joined_at.strftime('%Y-%m-%d %H:%M'),
                } for m in members
            ],
            'member_count': len(members),
            'capacity': room.capacity,
        }
    })
