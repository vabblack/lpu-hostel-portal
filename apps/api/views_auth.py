"""
API Authentication Views: Session-based auth, user identity, login, logout, and student registration.
"""
import json
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST

from apps.accounts.forms import StudentRegistrationForm
from apps.accounts.models import Role
from apps.roommates.models import RoommatePreference
from apps.allocations.models import Allocation


def _serialize_user(user, request=None):
    """Serialize user object with role-specific details."""
    data = {
        'id': user.id,
        'email': user.email,
        'student_id_login': user.student_id_login,
        'role': user.role,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
    }

    if user.role == Role.STUDENT and hasattr(user, 'student_profile'):
        profile = user.student_profile
        registry = getattr(profile, 'registry', None)
        has_pref = RoommatePreference.objects.filter(student=profile).exists()
        
        # Check active allocation
        allocation = Allocation.objects.filter(student=profile, is_active=True).select_related(
            'bed', 'bed__room', 'bed__room__floor__block__hostel'
        ).first()

        allocation_data = None
        if allocation:
            room = allocation.bed.room
            hostel = room.floor.block.hostel
            allocation_data = {
                'id': allocation.id,
                'hostel_name': hostel.name,
                'hostel_code': hostel.code,
                'room_number': room.room_number,
                'bed_identifier': allocation.bed.bed_identifier,
                'seater': room.capacity,
                'is_ac': room.is_air_conditioned,
                'cooling_type': room.cooling_type,
                'start_date': str(allocation.start_date),
                'end_date': str(allocation.end_date),
            }

        data['student'] = {
            'id': profile.id,
            'student_id': registry.student_id if registry else user.student_id_login,
            'full_name': registry.full_name if registry else '',
            'gender': registry.gender if registry else '',
            'gender_display': registry.get_gender_display() if registry else '',
            'enrollment_status': registry.enrollment_status if registry else '',
            'cgpa': float(getattr(registry, 'cgpa', 0)) if registry and getattr(registry, 'cgpa', None) is not None else None,
            'phone_number': registry.phone_number if registry else '',
            'branch': registry.branch.name if registry and registry.branch else '',
            'department': (
                registry.branch.program.department.name
                if registry and registry.branch and hasattr(registry.branch, 'program') and registry.branch.program and hasattr(registry.branch.program, 'department') and registry.branch.program.department
                else ''
            ),
            'emergency_contact_name': profile.emergency_contact_name or '',
            'emergency_contact_phone': profile.emergency_contact_phone or '',
            'profile_completed': profile.profile_completed,
            'has_roommate_preferences': has_pref,
            'active_allocation': allocation_data,
        }
    elif user.role == Role.WARDEN:
        assignments = user.warden_assignments.filter(is_active=True).select_related('hostel')
        data['warden'] = {
            'hostels': [
                {
                    'id': a.hostel.id,
                    'name': a.hostel.name,
                    'code': a.hostel.code,
                    'can_approve': a.can_approve_allocation
                } for a in assignments
            ]
        }

    return data


@ensure_csrf_cookie
def me_view(request):
    """Returns currently authenticated user profile or unauthenticated state."""
    csrf_token = get_token(request)
    if not request.user.is_authenticated:
        return JsonResponse({
            'authenticated': False,
            'user': None,
            'csrf_token': csrf_token
        })

    return JsonResponse({
        'authenticated': True,
        'user': _serialize_user(request.user, request),
        'csrf_token': csrf_token
    })


@ensure_csrf_cookie
def csrf_view(request):
    """Returns active CSRF token."""
    return JsonResponse({'csrfToken': get_token(request)})


@require_POST
def login_view(request):
    """Authenticate user with email or Student ID."""
    try:
        body = json.loads(request.body.decode('utf-8'))
    except Exception:
        body = request.POST

    identifier = (body.get('email_or_id') or body.get('username') or body.get('email', '')).strip()
    password = body.get('password', '')

    if not identifier or not password:
        return JsonResponse({'error': 'Email / Student ID and Password are required.'}, status=400)

    user = authenticate(request, username=identifier, password=password)
    if user is not None:
        if not user.is_active:
            return JsonResponse({'error': 'Your account has been deactivated. Please contact administration.'}, status=403)
        auth_login(request, user)
        return JsonResponse({
            'success': True,
            'message': 'Login successful.',
            'user': _serialize_user(user, request),
            'csrf_token': get_token(request)
        })

    return JsonResponse({'error': 'Invalid credentials. Please verify your email/Student ID and password.'}, status=401)


@require_POST
def logout_view(request):
    """Terminates session."""
    auth_logout(request)
    return JsonResponse({'success': True, 'message': 'Logged out successfully.'})


@require_POST
def register_view(request):
    """Verifies student against registry and creates claimed account."""
    try:
        body = json.loads(request.body.decode('utf-8'))
    except Exception:
        body = request.POST

    form = StudentRegistrationForm(body)
    if not form.is_valid():
        errors = {k: [str(e) for e in v] for k, v in form.errors.items()}
        return JsonResponse({'error': 'Validation failed', 'errors': errors}, status=400)

    try:
        user = form.save()
        auth_login(request, user)
        return JsonResponse({
            'success': True,
            'message': 'Registration successful! Account claimed and signed in.',
            'user': _serialize_user(user, request),
            'csrf_token': get_token(request)
        }, status=201)
    except ValidationError as e:
        msg = e.message if hasattr(e, 'message') else str(e)
        return JsonResponse({'error': msg}, status=400)
    except Exception as e:
        return JsonResponse({'error': f'Registration failed: {str(e)}'}, status=500)
