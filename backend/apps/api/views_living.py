"""
Living Experience API Views: Outing Gate Passes, RMS Maintenance Tickets, and Residential Economics.
"""
import json
import uuid
from decimal import Decimal
from datetime import datetime
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods, require_POST, require_GET
from django.shortcuts import get_object_or_404

from apps.accounts.models import Role
from apps.applications.models import GatePass, PassType, GatePassStatusChoices
from apps.applications.services.gatepass import (
    GatePassStatus,
    transition_gate_pass,
)
from apps.hostels.models import (
    Room,
    RMSTicket,
    RMSTradeCategoryChoices,
    RMSTicketPriorityChoices,
    RMSTicketStatusChoices,
)
from apps.hostels.services.rms import (
    RMSTradeCategory,
    RMSTicketPriority,
    RMSTicketStatus,
    calculate_sla_deadline,
    check_ticket_escalation,
)
from apps.hostels.services.fee_structure import (
    LPU_FEE_CATALOG,
    get_fee_tier,
    calculate_room_fee,
    calculate_electricity_overage,
)
from apps.allocations.models import Allocation


def _get_student_or_error(request):
    """Enforces authenticated student access."""
    if not request.user.is_authenticated:
        return None, JsonResponse({'error': 'Authentication required.'}, status=401)
    if request.user.role != Role.STUDENT or not hasattr(request.user, 'student_profile'):
        return None, JsonResponse({'error': 'Student profile required.'}, status=403)
    return request.user.student_profile, None


# =============================================================================
# 1. OUTING & GATE PASS ENDPOINTS
# =============================================================================

@require_http_methods(["GET", "POST"])
def gate_pass_api_view(request):
    """
    GET: List student's gate passes.
    POST: Submit a new gate pass request.
    """
    student, error_resp = _get_student_or_error(request)
    if error_resp:
        return error_resp

    if request.method == 'GET':
        passes = GatePass.objects.filter(student=student).order_by('-created_at')
        data = []
        for p in passes:
            data.append({
                'id': p.id,
                'pass_type': p.pass_type,
                'pass_type_display': p.get_pass_type_display(),
                'destination': p.destination,
                'reason': p.reason,
                'departure_date': p.departure_date.isoformat() if p.departure_date else None,
                'expected_return_date': p.expected_return_date.isoformat() if p.expected_return_date else None,
                'actual_exit_time': p.actual_exit_time.isoformat() if p.actual_exit_time else None,
                'actual_return_time': p.actual_return_time.isoformat() if p.actual_return_time else None,
                'status': p.status,
                'status_display': p.get_status_display(),
                'qr_token': p.qr_token,
                'parent_consent_at': p.parent_consent_at.isoformat() if p.parent_consent_at else None,
                'warden_approved_at': p.warden_approved_at.isoformat() if p.warden_approved_at else None,
                'warden_remarks': p.warden_remarks,
                'created_at': p.created_at.isoformat(),
            })
        return JsonResponse({'gate_passes': data})

    # POST: Apply for Gate Pass
    try:
        body = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'error': 'Invalid JSON body.'}, status=400)

    pass_type = body.get('pass_type', PassType.DAY_PASS)
    destination = (body.get('destination') or '').strip()
    reason = (body.get('reason') or '').strip()
    departure_str = body.get('departure_date')
    return_str = body.get('expected_return_date')

    if not destination or not reason or not departure_str or not return_str:
        return JsonResponse({'error': 'Destination, reason, departure, and expected return are required.'}, status=400)

    departure_dt = parse_datetime(departure_str)
    return_dt = parse_datetime(return_str)

    if not departure_dt or not return_dt:
        return JsonResponse({'error': 'Invalid datetime format (ISO 8601 required).'}, status=400)

    if return_dt <= departure_dt:
        return JsonResponse({'error': 'Expected return must be after departure time.'}, status=400)

    # Valid pass types
    if pass_type not in PassType.values:
        pass_type = PassType.DAY_PASS

    gate_pass = GatePass.objects.create(
        student=student,
        pass_type=pass_type,
        destination=destination,
        reason=reason,
        departure_date=departure_dt,
        expected_return_date=return_dt,
        status=GatePassStatusChoices.SUBMITTED,
    )

    return JsonResponse({
        'message': 'Gate Pass submitted successfully.',
        'gate_pass': {
            'id': gate_pass.id,
            'pass_type': gate_pass.pass_type,
            'pass_type_display': gate_pass.get_pass_type_display(),
            'destination': gate_pass.destination,
            'status': gate_pass.status,
            'status_display': gate_pass.get_status_display(),
            'qr_token': gate_pass.qr_token,
            'created_at': gate_pass.created_at.isoformat(),
        }
    }, status=201)


@require_POST
def gate_pass_action_view(request, pk):
    """
    Transition Gate Pass state:
    - parent_consent -> PENDING_WARDEN
    - warden_approve -> APPROVED
    - warden_reject -> REJECTED
    - security_exit -> ACTIVE_OUTSIDE
    - security_return -> CLOSED_RETURNED
    - cancel -> REJECTED
    """
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required.'}, status=401)
    student, error_resp = _get_student_or_error(request)
    if error_resp and getattr(request.user, 'role', None) not in (Role.WARDEN, Role.ADMIN):
        return error_resp

    gate_pass = get_object_or_404(GatePass, pk=pk)

    try:
        body = json.loads(request.body.decode('utf-8')) if request.body else {}
    except Exception:
        body = {}

    action = body.get('action', '').lower()
    now = timezone.now()

    if action == 'parent_consent':
        gate_pass.status = GatePassStatusChoices.PENDING_WARDEN
        gate_pass.parent_consent_at = now
        gate_pass.save()
        return JsonResponse({'message': 'Parent consent verified.', 'status': gate_pass.status})

    elif action == 'warden_approve':
        gate_pass.status = GatePassStatusChoices.APPROVED
        gate_pass.warden = request.user
        gate_pass.warden_approved_at = now
        gate_pass.warden_remarks = body.get('remarks', 'Approved by warden.')
        gate_pass.save()
        return JsonResponse({'message': 'Gate Pass approved.', 'status': gate_pass.status, 'qr_token': gate_pass.qr_token})

    elif action == 'warden_reject':
        gate_pass.status = GatePassStatusChoices.REJECTED
        gate_pass.warden = request.user
        gate_pass.warden_remarks = body.get('remarks', 'Rejected by warden.')
        gate_pass.save()
        return JsonResponse({'message': 'Gate Pass rejected.', 'status': gate_pass.status})

    elif action == 'security_exit':
        gate_pass.status = GatePassStatusChoices.ACTIVE_OUTSIDE
        gate_pass.actual_exit_time = now
        gate_pass.save()
        return JsonResponse({'message': 'Turnstile exit verified.', 'status': gate_pass.status})

    elif action == 'security_return':
        gate_pass.status = GatePassStatusChoices.CLOSED_RETURNED
        gate_pass.actual_return_time = now
        gate_pass.save()
        return JsonResponse({'message': 'Turnstile entry return verified.', 'status': gate_pass.status})

    elif action == 'cancel':
        if gate_pass.status in (GatePassStatusChoices.SUBMITTED, GatePassStatusChoices.PENDING_PARENT, GatePassStatusChoices.PENDING_WARDEN):
            gate_pass.status = GatePassStatusChoices.REJECTED
            gate_pass.warden_remarks = 'Cancelled by student.'
            gate_pass.save()
            return JsonResponse({'message': 'Gate pass cancelled.', 'status': gate_pass.status})
        return JsonResponse({'error': 'Cannot cancel an active or approved gate pass.'}, status=400)

    return JsonResponse({'error': f'Unrecognized action: {action}'}, status=400)


# =============================================================================
# 2. RELATIONSHIP MANAGEMENT SYSTEM (RMS) MAINTENANCE TICKETS
# =============================================================================

@require_http_methods(["GET", "POST"])
def rms_tickets_api_view(request):
    """
    GET: List room complaints for student or assigned building.
    POST: Submit new maintenance request with automated SLA calculation.
    """
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required.'}, status=401)
    student, error_resp = _get_student_or_error(request)
    if error_resp and getattr(request.user, 'role', None) not in (Role.WARDEN, Role.ADMIN):
        return error_resp

    if request.method == 'GET':
        if student:
            tickets = RMSTicket.objects.filter(student=student).select_related('room', 'room__floor__block__hostel').order_by('-created_at')
        else:
            tickets = RMSTicket.objects.all().select_related('room', 'room__floor__block__hostel', 'student').order_by('-created_at')[:50]

        now = timezone.now()
        data = []
        for t in tickets:
            is_escalated = (
                t.status not in (RMSTicketStatusChoices.RESOLVED, RMSTicketStatusChoices.CLOSED)
                and now > t.sla_deadline
            )
            data.append({
                'id': t.id,
                'ticket_number': t.ticket_number,
                'room_number': t.room.room_number,
                'hostel_name': t.room.floor.block.hostel.name,
                'hostel_code': t.room.floor.block.hostel.code,
                'category': t.category,
                'category_display': t.get_category_display(),
                'priority': t.priority,
                'priority_display': t.get_priority_display(),
                'status': t.status,
                'status_display': t.get_status_display(),
                'title': t.title,
                'description': t.description,
                'sla_deadline': t.sla_deadline.isoformat(),
                'is_escalated': is_escalated or t.status == RMSTicketStatusChoices.ESCALATED,
                'resolved_at': t.resolved_at.isoformat() if t.resolved_at else None,
                'resolution_notes': t.resolution_notes,
                'created_at': t.created_at.isoformat(),
            })
        return JsonResponse({'tickets': data})

    # POST: Report Room Issue
    try:
        body = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'error': 'Invalid JSON body.'}, status=400)

    category = body.get('category', RMSTradeCategoryChoices.ELECTRICAL)
    priority = body.get('priority', RMSTicketPriorityChoices.MEDIUM)
    title = (body.get('title') or '').strip()
    description = (body.get('description') or '').strip()
    room_id = body.get('room_id')

    if not title or not description:
        return JsonResponse({'error': 'Title and description are required.'}, status=400)

    # Determine room: explicitly passed, or active allocation's room, or first available room
    room = None
    if room_id:
        room = Room.objects.filter(pk=room_id).first()
    if not room and student:
        alloc = Allocation.objects.filter(student=student, is_active=True).select_related('bed__room').first()
        if alloc and alloc.bed:
            room = alloc.bed.room
    if not room:
        room = Room.objects.first()

    if not room:
        return JsonResponse({'error': 'No active room found to attach maintenance ticket.'}, status=400)

    # Calculate SLA deadline
    sla_priority = getattr(RMSTicketPriority, priority, RMSTicketPriority.MEDIUM)
    sla_deadline = calculate_sla_deadline(sla_priority)

    # Generate sequential unique ticket number
    ticket_count = RMSTicket.objects.count() + 1
    ticket_number = f"RMS-{timezone.now().year}-{ticket_count:05d}"

    ticket = RMSTicket.objects.create(
        ticket_number=ticket_number,
        student=student,
        room=room,
        category=category,
        priority=priority,
        status=RMSTicketStatusChoices.OPEN,
        title=title,
        description=description,
        sla_deadline=sla_deadline,
    )

    return JsonResponse({
        'message': 'Maintenance ticket logged successfully.',
        'ticket': {
            'id': ticket.id,
            'ticket_number': ticket.ticket_number,
            'title': ticket.title,
            'category_display': ticket.get_category_display(),
            'priority_display': ticket.get_priority_display(),
            'sla_deadline': ticket.sla_deadline.isoformat(),
            'status': ticket.status,
            'created_at': ticket.created_at.isoformat(),
        }
    }, status=201)


@require_POST
def rms_ticket_update_view(request, pk):
    """Update maintenance ticket status (in progress, resolve, close)."""
    ticket = get_object_or_404(RMSTicket, pk=pk)

    try:
        body = json.loads(request.body.decode('utf-8')) if request.body else {}
    except Exception:
        body = {}

    new_status = body.get('status')
    notes = body.get('notes', '')

    if new_status in RMSTicketStatusChoices.values:
        ticket.status = new_status
        if new_status == RMSTicketStatusChoices.RESOLVED:
            ticket.resolved_at = timezone.now()
            ticket.resolution_notes = notes or 'Resolved by maintenance team.'
        elif new_status == RMSTicketStatusChoices.ESCALATED:
            ticket.escalated_at = timezone.now()
        ticket.save()
        return JsonResponse({'message': 'Ticket updated.', 'status': ticket.status})

    return JsonResponse({'error': 'Invalid status provided.'}, status=400)


# =============================================================================
# 3. RESIDENTIAL ECONOMICS & OVERAGE CALCULATOR
# =============================================================================

# Pro Bricks 6 Regional Indian Dining Options
MESS_CUISINE_OPTIONS = [
    {
        'id': 'NORTH_INDIAN',
        'name': 'North Indian Royal Feast',
        'description': 'Rotis, paneer, dals, curd, rice, seasonal vegetable subzi, and dessert.',
        'monthly_fee': 4500,
        'tags': ['Vegetarian', 'High Protein', 'Popular'],
    },
    {
        'id': 'SOUTH_INDIAN',
        'name': 'South Indian Traditional',
        'description': 'Idli, dosa, medu vada, sambar, rasam, curd rice, coconut chutneys, and poriyal.',
        'monthly_fee': 4400,
        'tags': ['Vegetarian', 'Nutritious', 'Fermented'],
    },
    {
        'id': 'RAJASTHANI',
        'name': 'Rajasthani Marwari Thali',
        'description': 'Dal baati churma, gatte ki subzi, ker sangri, bajra roti, and chaas.',
        'monthly_fee': 4600,
        'tags': ['Rich', 'Desi Ghee', 'Specialty'],
    },
    {
        'id': 'GUJARATI',
        'name': 'Kathiyawadi & Gujarati Sattvik',
        'description': 'Sweet & savory dals, thepla, khichdi kadhi, farsan, and shrikhand.',
        'monthly_fee': 4400,
        'tags': ['Mild Spice', 'Wholesome', 'Sattvik'],
    },
    {
        'id': 'HARYANVI',
        'name': 'Haryanvi Desi Diet',
        'description': 'Fresh malai curd, kadhi pakora, missed roti, paneer bhurji, and lassi.',
        'monthly_fee': 4600,
        'tags': ['Dairy Rich', 'High Calorie', 'Hearty'],
    },
    {
        'id': 'EASTERN',
        'name': 'Eastern & Bengali Coastal',
        'description': 'Shukto, chholar dal, luchi, fish curry / paneer curry, and mishti doi.',
        'monthly_fee': 4800,
        'tags': ['Non-Veg Option', 'Aromatic', 'Delicacy'],
    },
]

MEAL_PLAN_MULTIPLIERS = {
    'FOUR_MEAL': {'label': '4 Meals (Breakfast + Lunch + Evening Snacks + Dinner)', 'ratio': Decimal('1.00')},
    'THREE_MEAL': {'label': '3 Meals (Breakfast + Lunch + Dinner)', 'ratio': Decimal('0.85')},
    'TWO_MEAL': {'label': '2 Meals (Brunch + Dinner)', 'ratio': Decimal('0.65')},
}


@require_http_methods(["GET", "POST"])
def economics_calculator_api_view(request):
    """
    Computes exact 10-month session fee, EDB savings of ₹10,000,
    mess meal plan additions, and electricity allowance vs potential overage.
    """
    if request.method == 'POST':
        try:
            params = json.loads(request.body.decode('utf-8'))
        except Exception:
            params = {}
    else:
        params = request.GET

    category = (params.get('category') or 'STANDARD').upper()
    seater_count = int(params.get('seater_count') or 2)
    cooling_type = (params.get('cooling_type') or 'AIR_CONDITIONED').upper()
    is_edb = str(params.get('is_edb_eligible', 'true')).lower() in ('true', '1', 'yes')
    cuisine_id = params.get('mess_cuisine', 'NORTH_INDIAN')
    meal_plan_id = params.get('meal_plan', 'FOUR_MEAL')
    estimated_kwh = Decimal(str(params.get('estimated_kwh', '0.00')))

    tier = get_fee_tier(category, seater_count, cooling_type)
    if not tier:
        # Fallback to standard 2-seater AC
        tier = get_fee_tier('STANDARD', 2, 'AIR_CONDITIONED')
        category, seater_count, cooling_type = 'STANDARD', 2, 'AIR_CONDITIONED'

    std_fee = tier.standard_fee
    edb_fee = tier.edb_fee
    edb_savings = std_fee - edb_fee # Exactly ₹10,000
    hostel_fee = edb_fee if is_edb else std_fee

    # Mess calculation (10 months)
    selected_cuisine = next((c for c in MESS_CUISINE_OPTIONS if c['id'] == cuisine_id), MESS_CUISINE_OPTIONS[0])
    plan_info = MEAL_PLAN_MULTIPLIERS.get(meal_plan_id, MEAL_PLAN_MULTIPLIERS['FOUR_MEAL'])
    monthly_mess = (Decimal(str(selected_cuisine['monthly_fee'])) * plan_info['ratio']).quantize(Decimal('1.00'))
    session_mess_fee = monthly_mess * Decimal('10')

    # Electricity overage
    if estimated_kwh <= Decimal('0'):
        estimated_kwh = tier.quota_kwh

    electricity_calc = calculate_electricity_overage(
        consumed_units=estimated_kwh,
        allocated_quota=tier.quota_kwh,
        resident_count=seater_count,
        commercial_rate=Decimal('8.50')
    )

    total_annual_cost = hostel_fee + session_mess_fee + electricity_calc['per_resident_share']

    return JsonResponse({
        'specification': {
            'category': category,
            'seater_count': seater_count,
            'cooling_type': cooling_type,
            'is_edb_eligible': is_edb,
        },
        'pricing': {
            'standard_fee': float(std_fee),
            'edb_fee': float(edb_fee),
            'edb_savings': float(edb_savings),
            'applicable_hostel_fee': float(hostel_fee),
        },
        'electricity': {
            'quota_kwh': float(tier.quota_kwh),
            'consumed_kwh': float(electricity_calc['consumed_units']),
            'overage_kwh': float(electricity_calc['overage_units']),
            'rate_per_unit': float(electricity_calc['rate_per_unit']),
            'total_room_overage_charge': float(electricity_calc['total_overage_charge']),
            'per_resident_share': float(electricity_calc['per_resident_share']),
        },
        'mess': {
            'cuisine_id': selected_cuisine['id'],
            'cuisine_name': selected_cuisine['name'],
            'meal_plan': meal_plan_id,
            'meal_plan_label': plan_info['label'],
            'monthly_fee': float(monthly_mess),
            'session_10_month_fee': float(session_mess_fee),
            'available_cuisines': MESS_CUISINE_OPTIONS,
        },
        'summary': {
            'total_annual_cost': float(total_annual_cost),
        }
    })
