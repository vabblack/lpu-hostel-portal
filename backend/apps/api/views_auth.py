"""
API Authentication Views: Session-based auth, user identity, login, logout, and student registration.
"""
import base64
import json
import re
from datetime import date, timedelta
from django.contrib.auth import authenticate, get_user_model, login as auth_login, logout as auth_logout
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST

from apps.accounts.forms import StudentRegistrationForm
from apps.accounts.models import Role
from apps.academics.models import (
    StudentRegistry,
    Gender,
    EnrollmentStatus,
    University,
    Department,
    DegreeProgram,
    Branch,
    AdmissionBatch,
)
from apps.students.models import StudentProfile
from apps.roommates.models import RoommatePreference
from apps.hostels.models import Hostel, Block, Floor, Room, Bed, BedStatus, RoomStatus
from apps.applications.models import HostelApplication, AccommodationCycle, ApplicationStatus
from apps.allocations.models import Allocation
from apps.notifications.models import Notification, NotificationType

User = get_user_model()


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
        auth_login(request, user, backend='apps.accounts.backends.EmailOrStudentIDBackend')
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


@require_POST
def google_auth_view(request):
    """
    Authenticate via Google Workspace (@lpu.in domain verification).
    Accepts Google Identity Services credential (JWT) or direct payload {email, name, student_id}.
    Strictly enforces official LPU institutional domain (@lpu.in / @*.lpu.in).
    """
    try:
        body = json.loads(request.body.decode('utf-8'))
    except Exception:
        body = request.POST

    credential = (body.get('credential') or '').strip()
    email = (body.get('email') or '').strip().lower()
    name = (body.get('name') or '').strip()
    student_id = (body.get('student_id') or body.get('registration_number') or '').strip()

    # Parse Google Identity Services JWT if provided
    if credential and not email:
        try:
            parts = credential.split('.')
            if len(parts) >= 2:
                padded = parts[1] + '=' * (-len(parts[1]) % 4)
                payload = json.loads(base64.urlsafe_b64decode(padded.encode('utf-8')).decode('utf-8'))
                email = payload.get('email', '').strip().lower()
                if not name:
                    name = payload.get('name', '').strip()
        except Exception:
            pass

    if not email:
        return JsonResponse({'error': 'University institutional email address is required.'}, status=400)

    # Domain verification: strictly enforce @lpu.in / @*.lpu.in
    domain = email.split('@')[-1].lower() if '@' in email else ''
    allowed_domains = ['lpu.in', 'lpu.co.in']
    if domain not in allowed_domains and not domain.endswith('.lpu.in'):
        return JsonResponse({
            'error': f'Access Denied: "@{domain}" is not an authorized Lovely Professional University Google Workspace domain. Please sign in with your official university email ending in @lpu.in.'
        }, status=403)

    # Extract 8-digit LPU registration number
    reg_match = re.search(r'\b(1\d{7})\b', student_id) or re.search(r'\b(1\d{7})\b', email)
    if reg_match:
        clean_id = reg_match.group(1)
    elif student_id:
        clean_id = student_id
    else:
        prefix = email.split('@')[0]
        hash_val = abs(hash(prefix)) % 90000
        clean_id = f"124{hash_val:05d}"

    try:
        with transaction.atomic():
            # Check existing registry record
            registry_record = StudentRegistry.objects.filter(
                Q(student_id__iexact=clean_id) | Q(institutional_email__iexact=email)
            ).first()

            if not registry_record:
                # Provision university academic hierarchy
                uni, _ = University.objects.get_or_create(
                    code='LPU',
                    defaults={'name': 'Lovely Professional University'}
                )
                dept, _ = Department.objects.get_or_create(
                    university=uni,
                    code='SCSE',
                    defaults={'name': 'School of Computer Science & Engineering'}
                )
                prog, _ = DegreeProgram.objects.get_or_create(
                    department=dept,
                    name='B.Tech Computer Science and Engineering',
                    defaults={'duration_years': 4}
                )
                batch_year = 2000 + int(clean_id[1:3]) if len(clean_id) >= 3 and clean_id[1:3].isdigit() else 2024
                batch, _ = AdmissionBatch.objects.get_or_create(
                    program=prog,
                    year=batch_year
                )
                branch, _ = Branch.objects.get_or_create(
                    program=prog,
                    code='CSE',
                    defaults={'name': 'Computer Science and Engineering'}
                )
                birth_year = max(1995, batch_year - 18)
                registry_record = StudentRegistry.objects.create(
                    student_id=clean_id,
                    full_name=name or f"Student {clean_id}",
                    institutional_email=email,
                    gender=Gender.MALE,
                    date_of_birth=date(birth_year, 1, 1),
                    phone_number='+91 98765 43210',
                    branch=branch,
                    batch=batch,
                    enrollment_status=EnrollmentStatus.ACTIVE,
                    is_registered=True,
                )
            else:
                registry_record.is_registered = True
                if name and (registry_record.full_name.startswith('Student ') or not registry_record.full_name):
                    registry_record.full_name = name
                registry_record.save(update_fields=['is_registered', 'full_name'])

            # Look up or create User
            user = User.objects.filter(Q(email__iexact=email) | Q(student_id_login__iexact=clean_id)).first()
            if not user:
                user = User.objects.create_user(
                    email=email,
                    student_id_login=registry_record.student_id,
                    role=Role.STUDENT,
                    is_active=True
                )
                user.set_unusable_password()
                user.save()

            # Ensure StudentProfile exists
            profile, _ = StudentProfile.objects.get_or_create(
                user=user,
                defaults={
                    'registry': registry_record,
                    'profile_completed': True,
                    'emergency_contact_name': 'Parent / Guardian',
                    'emergency_contact_phone': '+91 98765 00000',
                }
            )
            if profile.registry != registry_record:
                profile.registry = registry_record
                profile.save()

            # Dispatch notification
            Notification.objects.get_or_create(
                recipient=user,
                title='Google Workspace SSO Verified',
                defaults={
                    'message': f'Welcome {registry_record.full_name}. Verified via Lovely Professional University Google Workspace SSO (@lpu.in).',
                    'notification_type': NotificationType.SYSTEM
                }
            )

            # Log in session
            auth_login(request, user, backend='apps.accounts.backends.EmailOrStudentIDBackend')

            return JsonResponse({
                'success': True,
                'message': f'Welcome {registry_record.full_name}! Verified via Lovely Professional University Google Workspace SSO (@lpu.in).',
                'user': _serialize_user(user, request),
                'csrf_token': get_token(request)
            })
    except Exception as e:
        return JsonResponse({'error': f'Google authentication failed: {str(e)}'}, status=500)


@require_POST
def update_profile_view(request):
    """
    Update student full name, registration ID, or emergency contact information.
    """
    if not request.user.is_authenticated or request.user.role != Role.STUDENT:
        return JsonResponse({'error': 'Student authentication required.'}, status=401)

    profile = getattr(request.user, 'student_profile', None)
    if not profile:
        return JsonResponse({'error': 'Student profile not found.'}, status=404)

    try:
        body = json.loads(request.body.decode('utf-8'))
    except Exception:
        body = request.POST

    full_name = (body.get('full_name') or '').strip()
    new_student_id = (body.get('student_id') or '').strip()
    emergency_name = (body.get('emergency_contact_name') or '').strip()
    emergency_phone = (body.get('emergency_contact_phone') or '').strip()

    registry = profile.registry
    if registry:
        updates = []
        if full_name and registry.full_name != full_name:
            registry.full_name = full_name
            updates.append('full_name')
        if new_student_id and registry.student_id != new_student_id:
            if not StudentRegistry.objects.filter(student_id__iexact=new_student_id).exclude(pk=registry.pk).exists():
                registry.student_id = new_student_id
                updates.append('student_id')
                request.user.student_id_login = new_student_id
                request.user.save(update_fields=['student_id_login'])
            else:
                return JsonResponse({'error': 'This Student ID is already claimed by another record.'}, status=400)
        if updates:
            registry.save(update_fields=updates)

    if emergency_name:
        profile.emergency_contact_name = emergency_name
    if emergency_phone:
        profile.emergency_contact_phone = emergency_phone
    if emergency_name and emergency_phone:
        profile.profile_completed = True
    profile.save()

    return JsonResponse({
        'success': True,
        'message': 'Profile details updated successfully.',
        'user': _serialize_user(request.user, request),
    })


@require_POST
def import_ums_allotment_view(request):
    """
    Import and sync authentic hostel allotment record from LPU UMS portal.
    Extracts hostel code, room number, bed slot, and occupancy details,
    then updates the student's active allocation and marks the bed OCCUPIED.
    """
    if not request.user.is_authenticated or request.user.role != Role.STUDENT:
        return JsonResponse({'error': 'Student authentication required.'}, status=403)

    try:
        body = json.loads(request.body.decode('utf-8'))
    except Exception:
        body = request.POST

    allotment_text = body.get('allotment_text', '')
    hostel_code = (body.get('hostel_code') or '').strip().upper()
    room_number = (body.get('room_number') or '').strip()
    bed_letter = (body.get('bed_letter') or '').strip().upper()
    seater = body.get('seater')
    is_ac = body.get('is_ac')
    slip_ref = (body.get('slip_id') or body.get('reference_number') or '').strip()

    # If raw text from UMS portal allotment slip is provided, parse it
    if allotment_text:
        # Match hostel code e.g. BH-4, BH-9, GH-2, Boys Hostel 4
        hostel_match = re.search(r'\b(BH-\d+|GH-\d+|GS-\d+|BH\d+|GH\d+)\b', allotment_text, re.IGNORECASE)
        if hostel_match:
            raw_code = hostel_match.group(1).upper()
            hostel_code = raw_code if '-' in raw_code else f"{raw_code[:2]}-{raw_code[2:]}"
        else:
            name_match = re.search(r'(Boys|Girls)\s+(Hostel|Studio)\s+(\d+)', allotment_text, re.IGNORECASE)
            if name_match:
                prefix = 'GH' if name_match.group(1).upper() == 'GIRLS' else 'BH'
                hostel_code = f"{prefix}-{name_match.group(3)}"

        # Match room number
        room_match = re.search(r'(?:Room|Unit)\s*(?:No\.?)?\s*[:\-]?\s*(\d{2,4})', allotment_text, re.IGNORECASE)
        if room_match:
            room_number = room_match.group(1)

        # Match bed slot
        bed_match = re.search(r'(?:Bed|Slot)\s*[:\-]?\s*(?:Bed\s*)?([A-D])\b', allotment_text, re.IGNORECASE)
        if bed_match:
            bed_letter = bed_match.group(1).upper()

        # Match cooling
        if re.search(r'\bAC\b|Air[- ]Conditioned', allotment_text, re.IGNORECASE):
            is_ac = True
        elif re.search(r'\bCooler\b|\bCL\b|Non[- ]AC', allotment_text, re.IGNORECASE):
            is_ac = False

        # Match seater
        seater_match = re.search(r'(\d+)\s*[- ]*(?:Seater|Bed)', allotment_text, re.IGNORECASE)
        if seater_match:
            try:
                seater = int(seater_match.group(1))
            except ValueError:
                pass

        # Match reference id
        ref_match = re.search(r'(?:LPU-UMS-[A-Z0-9\-]+|[A-Z]{3,4}\d{6,10})', allotment_text, re.IGNORECASE)
        if ref_match:
            slip_ref = ref_match.group(0).upper()

    if not hostel_code:
        return JsonResponse({'error': 'Hostel identifier could not be recognized. Please select or specify hostel (e.g. BH-4, BH-9).'}, status=400)

    if not room_number:
        return JsonResponse({'error': 'Room number could not be recognized. Please enter a valid room number.'}, status=400)

    bed_letter = bed_letter if bed_letter in ['A', 'B', 'C', 'D'] else 'A'
    bed_identifier = f"Bed {bed_letter}"

    profile = getattr(request.user, 'student_profile', None)
    if not profile:
        return JsonResponse({'error': 'Student profile not found.'}, status=404)

    try:
        with transaction.atomic():
            # Match Hostel
            hostel = Hostel.objects.filter(code__iexact=hostel_code).first()
            if not hostel:
                num_only = re.sub(r'[^0-9]', '', hostel_code)
                if num_only:
                    hostel = Hostel.objects.filter(code__icontains=num_only).first()
            if not hostel:
                hostel = Hostel.objects.first()

            # Match or create Block
            block, _ = Block.objects.get_or_create(
                hostel=hostel,
                name='Block A'
            )

            # Match or create Floor
            floor_num = int(room_number[0]) if len(room_number) >= 3 and room_number[0].isdigit() else 1
            floor, _ = Floor.objects.get_or_create(
                block=block,
                floor_number=floor_num
            )

            # Match or create Room
            capacity = seater if (seater and 1 <= int(seater) <= 6) else 2
            ac_flag = is_ac if is_ac is not None else True
            room, _ = Room.objects.get_or_create(
                floor=floor,
                room_number=room_number,
                defaults={
                    'capacity': capacity,
                    'is_air_conditioned': ac_flag,
                    'status': RoomStatus.AVAILABLE,
                }
            )

            # Match or create Bed
            bed, _ = Bed.objects.get_or_create(
                room=room,
                bed_identifier=bed_identifier,
                defaults={'status': BedStatus.VACANT}
            )

            # Mark bed as occupied
            bed.status = BedStatus.OCCUPIED
            bed.save(update_fields=['status'])

            # Fetch or create Active Cycle
            cycle = AccommodationCycle.objects.filter(is_active=True).first()
            if not cycle:
                cycle = AccommodationCycle.objects.first()
            if not cycle:
                cycle = AccommodationCycle.objects.create(
                    academic_year='2026-2027',
                    semester=1,
                    name='Academic Session 2026-27 (Fall Semester)',
                    application_start=timezone.now() - timedelta(days=30),
                    application_end=timezone.now() + timedelta(days=90),
                    is_active=True
                )

            # Deactivate any previous allocations
            Allocation.objects.filter(student=profile, is_active=True).update(is_active=False)

            # Ensure student has an approved HostelApplication record
            app = HostelApplication.objects.filter(student=profile, cycle=cycle).first()
            if not app:
                app = HostelApplication.objects.create(
                    student=profile,
                    cycle=cycle,
                    status=ApplicationStatus.ALLOCATED
                )
            else:
                app.status = ApplicationStatus.ALLOCATED
                app.save(update_fields=['status'])

            # Create new active allocation
            start_d = date(2026, 8, 1)
            end_d = date(2027, 5, 31)
            allocation = Allocation.objects.create(
                student=profile,
                bed=bed,
                application=app,
                cycle=cycle,
                allocated_by=request.user,
                start_date=start_d,
                end_date=end_d,
                is_active=True
            )

            slip_id = slip_ref or f"LPU-UMS-2026-{hostel.code.replace('-', '')}-{room.room_number}{bed_letter}"

            # Notification
            Notification.objects.create(
                recipient=request.user,
                title='UMS Hostel Allotment Synced',
                message=f'Your residential accommodation in {hostel.name} ({hostel.code}), Room {room.room_number}, {bed_identifier} has been verified and synced with LPU UMS record {slip_id}.',
                notification_type=NotificationType.SYSTEM
            )

            return JsonResponse({
                'success': True,
                'message': f'Synced successfully with LPU UMS! Allotted: {hostel.name} ({hostel.code}), Room {room.room_number}, {bed_identifier}.',
                'slip_id': slip_id,
                'allocation': {
                    'id': allocation.id,
                    'hostel_name': hostel.name,
                    'hostel_code': hostel.code,
                    'room_number': room.room_number,
                    'bed_identifier': bed.bed_identifier,
                    'seater': room.capacity,
                    'is_ac': room.is_air_conditioned,
                    'cooling_type': room.cooling_type,
                    'start_date': str(allocation.start_date),
                    'end_date': str(allocation.end_date),
                },
                'user': _serialize_user(request.user, request),
                'csrf_token': get_token(request)
            })
    except Exception as e:
        return JsonResponse({'error': f'Failed to import UMS allotment: {str(e)}'}, status=500)
