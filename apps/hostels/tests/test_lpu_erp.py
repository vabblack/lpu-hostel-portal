"""
Unit tests for LPU ERP core architectural modules:
Fees, Electricity Overage, Gate Pass State Machine, Room Consolidation, and RMS SLA.
"""
from decimal import Decimal
import pytest
from apps.hostels.services.fee_structure import (
    calculate_room_fee,
    calculate_electricity_overage,
    get_fee_tier,
)
from apps.applications.services.gatepass import (
    GatePassStatus,
    transition_gate_pass,
)
from apps.hostels.services.rms import (
    RMSTicketPriority,
    RMSTicketStatus,
    calculate_sla_deadline,
    check_ticket_escalation,
)


def test_lpu_fee_tier_lookup_and_edb_discount():
    """Verify exact 10-month session fees and EDB discounts."""
    # 1-Seater Standard AC: ₹1,63,000 (EDB: ₹1,53,000)
    std_fee = calculate_room_fee('STANDARD', 1, 'AIR_CONDITIONED', is_edb_eligible=False)
    edb_fee = calculate_room_fee('STANDARD', 1, 'AIR_CONDITIONED', is_edb_eligible=True)
    assert std_fee == Decimal('163000.00')
    assert edb_fee == Decimal('153000.00')

    # 4-Seater Standard Cooler: ₹93,000 (EDB: ₹83,000)
    std_cooler = calculate_room_fee('STANDARD', 4, 'AIR_COOLED', is_edb_eligible=False)
    edb_cooler = calculate_room_fee('STANDARD', 4, 'AIR_COOLED', is_edb_eligible=True)
    assert std_cooler == Decimal('93000.00')
    assert edb_cooler == Decimal('83000.00')


def test_electricity_overage_equal_division():
    """Verify equal division of overage charges among room occupants."""
    # 2-Seater with 400 kWh quota, consuming 500 kWh (100 kWh overage) at ₹8.50/unit = ₹850.00
    # Divided among 2 residents = ₹425.00 each
    result = calculate_electricity_overage(
        consumed_units=Decimal('500.00'),
        allocated_quota=Decimal('400.00'),
        resident_count=2,
        commercial_rate=Decimal('8.50')
    )
    assert result['overage_units'] == Decimal('100.00')
    assert result['total_overage_charge'] == Decimal('850.00')
    assert result['per_resident_share'] == Decimal('425.00')


def test_electricity_within_quota_no_overage():
    """Verify zero charge when consumption remains within assigned quota."""
    result = calculate_electricity_overage(
        consumed_units=Decimal('350.00'),
        allocated_quota=Decimal('400.00'),
        resident_count=2
    )
    assert result['overage_units'] == Decimal('0.00')
    assert result['total_overage_charge'] == Decimal('0.00')
    assert result['per_resident_share'] == Decimal('0.00')


def test_gate_pass_valid_transitions():
    """Verify Gate Pass state machine progression and QR code generation."""
    # Step 1: SUBMITTED -> PENDING_PARENT
    t1 = transition_gate_pass(GatePassStatus.SUBMITTED, GatePassStatus.PENDING_PARENT)
    assert t1['to_status'] == GatePassStatus.PENDING_PARENT.value

    # Step 2: PENDING_PARENT -> PENDING_WARDEN
    t2 = transition_gate_pass(GatePassStatus.PENDING_PARENT, GatePassStatus.PENDING_WARDEN)
    assert t2['to_status'] == GatePassStatus.PENDING_WARDEN.value

    # Step 3: PENDING_WARDEN -> APPROVED (generates QR token)
    t3 = transition_gate_pass(GatePassStatus.PENDING_WARDEN, GatePassStatus.APPROVED)
    assert t3['to_status'] == GatePassStatus.APPROVED.value
    assert 'qr_token' in t3

    # Step 4: APPROVED -> ACTIVE_OUTSIDE
    t4 = transition_gate_pass(GatePassStatus.APPROVED, GatePassStatus.ACTIVE_OUTSIDE)
    assert t4['to_status'] == GatePassStatus.ACTIVE_OUTSIDE.value

    # Step 5: ACTIVE_OUTSIDE -> CLOSED_RETURNED
    t5 = transition_gate_pass(GatePassStatus.ACTIVE_OUTSIDE, GatePassStatus.CLOSED_RETURNED)
    assert t5['to_status'] == GatePassStatus.CLOSED_RETURNED.value


def test_gate_pass_invalid_transition_rejected():
    """Verify illegal transitions throw ValueError."""
    with pytest.raises(ValueError):
        transition_gate_pass(GatePassStatus.SUBMITTED, GatePassStatus.ACTIVE_OUTSIDE)


def test_rms_ticket_sla_deadlines():
    """Verify SLA calculation and escalation flags."""
    import datetime
    from django.utils import timezone

    now = timezone.now()
    emergency_deadline = calculate_sla_deadline(RMSTicketPriority.EMERGENCY, created_at=now)
    assert emergency_deadline == now + datetime.timedelta(hours=4)

    # Check ticket escalation
    past_deadline = now - datetime.timedelta(hours=1)
    is_escalated = check_ticket_escalation(RMSTicketStatus.OPEN, sla_deadline=past_deadline, current_time=now)
    assert is_escalated is True

