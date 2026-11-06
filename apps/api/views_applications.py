"""
API Applications & Campus Summary Views.
"""
import json
from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_GET, require_POST

from apps.accounts.models import Role
from apps.applications.models import AccommodationCycle, HostelApplication, ApplicationStatus
from apps.applications.services.submission import submit_hostel_application
from apps.hostels.models import Hostel, Room, Bed, BedStatus
from apps.students.models import StudentProfile


def _require_student(request):
    if not request.user.is_authenticated:
        return None, JsonResponse({'error': 'Authentication required.'}, status=401)
    if request.user.role != Role.STUDENT or not hasattr(request.user, 'student_profile'):
        return None, JsonResponse({'error': 'Student account required.'}, status=403)
    return request.user.student_profile, None


def applications_api_view(request):
    """GET user applications and POST submit new application."""
    student, error_resp = _require_student(request)
    if error_resp:
        return error_resp

    active_cycle = AccommodationCycle.objects.filter(is_active=True).first()

    if request.method == 'GET':
        apps = HostelApplication.objects.filter(student=student).select_related(
            'cycle', 'reviewed_by'
        ).prefetch_related('choices', 'choices__hostel', 'choices__room').order_by('-submitted_at')

        apps_data = []
        for a in apps:
            choices_data = []
            for c in a.choices.all().order_by('priority'):
                room_info = None
                if c.room:
                    room_info = {
                        'id': c.room.id,
                        'room_number': c.room.room_number,
                        'capacity': c.room.capacity,
                        'is_ac': c.room.is_air_conditioned,
                        'category': c.room.category,
                        'standard_fee': c.room.standard_fee,
                    }
                choices_data.append({
                    'id': c.id,
                    'priority': c.priority,
                    'hostel_id': c.hostel.id,
                    'hostel_name': c.hostel.name,
                    'hostel_code': c.hostel.code,
                    'room': room_info,
                })

            apps_data.append({
                'id': a.id,
                'cycle_name': a.cycle.name,
                'academic_year': a.cycle.academic_year,
                'status': a.status,
                'status_display': a.get_status_display(),
                'submitted_at': a.submitted_at.strftime('%Y-%m-%d %H:%M'),
                'reviewed_at': a.reviewed_at.strftime('%Y-%m-%d %H:%M') if a.reviewed_at else None,
                'review_notes': a.review_notes,
                'choices': choices_data,
            })

        active_cycle_data = None
        if active_cycle:
            active_cycle_data = {
                'id': active_cycle.id,
                'name': active_cycle.name,
                'academic_year': active_cycle.academic_year,
                'semester': active_cycle.semester,
                'start_date': active_cycle.application_start.strftime('%Y-%m-%d %H:%M'),
                'end_date': active_cycle.application_end.strftime('%Y-%m-%d %H:%M'),
                'is_active': active_cycle.is_active,
            }

        return JsonResponse({
            'active_cycle': active_cycle_data,
            'applications': apps_data,
        })

    elif request.method == 'POST':
        if not active_cycle:
            return JsonResponse({'error': 'There is no active accommodation cycle for submissions.'}, status=400)

        try:
            body = json.loads(request.body.decode('utf-8'))
        except Exception:
            body = request.POST

        choices_input = body.get('choices', [])
        if not choices_input:
            return JsonResponse({'error': 'You must provide at least one prioritized hostel choice.'}, status=400)

        choices_data = []
        for item in choices_input:
            hostel_id = item.get('hostel_id')
            room_id = item.get('room_id')
            priority = item.get('priority')

            try:
                hostel = Hostel.objects.get(pk=hostel_id)
            except Hostel.DoesNotExist:
                return JsonResponse({'error': f'Invalid hostel selected: {hostel_id}'}, status=400)

            room = None
            if room_id:
                try:
                    room = Room.objects.get(pk=room_id)
                except Room.DoesNotExist:
                    pass

            choices_data.append({
                'priority': priority,
                'hostel': hostel,
                'room': room,
            })

        try:
            app = submit_hostel_application(student, active_cycle, choices_data)
            return JsonResponse({
                'success': True,
                'message': 'Hostel application submitted successfully!',
                'application_id': app.id,
                'status': app.status,
            }, status=201)
        except ValidationError as e:
            msg = e.message if hasattr(e, 'message') else str(e)
            return JsonResponse({'error': msg}, status=400)

    return JsonResponse({'error': 'Method not allowed.'}, status=405)


@require_GET
def dashboard_summary_view(request):
    """
    High-level platform figures and personal dashboard metrics.
    """
    total_hostels = Hostel.objects.count()
    total_rooms = Room.objects.count()
    total_beds = Bed.objects.count()
    vacant_beds = Bed.objects.filter(status=BedStatus.VACANT).count()
    occupied_beds = Bed.objects.filter(status=BedStatus.OCCUPIED).count()
    active_cycle = AccommodationCycle.objects.filter(is_active=True).first()

    occupancy_rate = round((occupied_beds / total_beds * 100), 1) if total_beds > 0 else 0

    data = {
        'campus': {
            'total_hostels': total_hostels,
            'total_rooms': total_rooms,
            'total_beds': total_beds,
            'vacant_beds': vacant_beds,
            'occupied_beds': occupied_beds,
            'occupancy_rate': occupancy_rate,
            'active_cycle_name': active_cycle.name if active_cycle else 'No Active Cycle',
        }
    }

    if request.user.is_authenticated:
        if request.user.role == Role.STUDENT and hasattr(request.user, 'student_profile'):
            student = request.user.student_profile
            latest_app = HostelApplication.objects.filter(student=student).select_related('cycle').order_by('-submitted_at').first()
            allocation = student.allocations.filter(is_active=True).select_related('bed', 'bed__room', 'bed__room__floor__block__hostel').first()

            data['student_status'] = {
                'has_active_application': latest_app is not None,
                'latest_app_status': latest_app.status if latest_app else None,
                'latest_app_status_display': latest_app.get_status_display() if latest_app else None,
                'has_allocation': allocation is not None,
                'allocated_hostel': allocation.bed.room.floor.block.hostel.name if allocation else None,
                'allocated_room': allocation.bed.room.room_number if allocation else None,
                'allocated_bed': allocation.bed.bed_identifier if allocation else None,
            }

    return JsonResponse(data)
