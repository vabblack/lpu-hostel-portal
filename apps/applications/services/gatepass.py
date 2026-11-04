"""
LPU Gate Pass Multi-Step Verification State Machine.
Enforces parental OTP consent, warden review, QR token generation,
and turnstile guard exit/entry logging.
"""
import uuid
import datetime
from enum import Enum
from typing import Dict, Any, Optional
from django.utils import timezone


class GatePassStatus(str, Enum):
    SUBMITTED = 'SUBMITTED'
    PENDING_PARENT = 'PENDING_PARENT'
    PENDING_WARDEN = 'PENDING_WARDEN'
    APPROVED = 'APPROVED'
    REJECTED = 'REJECTED'
    ACTIVE_OUTSIDE = 'ACTIVE_OUTSIDE'
    CLOSED_RETURNED = 'CLOSED_RETURNED'
    OVERDUE = 'OVERDUE'


class GatePassType(str, Enum):
    DAY_PASS = 'DAY_PASS'
    OUTSTATION_PASS = 'OUTSTATION_PASS'
    EMERGENCY_LEAVE = 'EMERGENCY_LEAVE'


VALID_TRANSITIONS = {
    GatePassStatus.SUBMITTED: [GatePassStatus.PENDING_PARENT, GatePassStatus.REJECTED],
    GatePassStatus.PENDING_PARENT: [GatePassStatus.PENDING_WARDEN, GatePassStatus.REJECTED],
    GatePassStatus.PENDING_WARDEN: [GatePassStatus.APPROVED, GatePassStatus.REJECTED],
    GatePassStatus.APPROVED: [GatePassStatus.ACTIVE_OUTSIDE, GatePassStatus.REJECTED],
    GatePassStatus.ACTIVE_OUTSIDE: [GatePassStatus.CLOSED_RETURNED, GatePassStatus.OVERDUE],
    GatePassStatus.OVERDUE: [GatePassStatus.CLOSED_RETURNED],
    GatePassStatus.CLOSED_RETURNED: [],
    GatePassStatus.REJECTED: [],
}


def transition_gate_pass(
    current_status: GatePassStatus,
    target_status: GatePassStatus,
    context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Validates state transition and applies domain event invariants.
    """
    allowed_targets = VALID_TRANSITIONS.get(current_status, [])
    if target_status not in allowed_targets:
        raise ValueError(
            f"Invalid Gate Pass transition from '{current_status.value}' to '{target_status.value}'. "
            f"Allowed next states: {[s.value for s in allowed_targets]}"
        )

    now = timezone.now()
    result = {
        'from_status': current_status.value,
        'to_status': target_status.value,
        'timestamp': now,
    }

    # Transition-specific actions
    if target_status == GatePassStatus.APPROVED:
        # Generate secure turnstile verification QR payload
        result['qr_token'] = str(uuid.uuid4())
        result['approved_at'] = now

    elif target_status == GatePassStatus.ACTIVE_OUTSIDE:
        result['actual_exit_time'] = now

    elif target_status == GatePassStatus.CLOSED_RETURNED:
        result['actual_return_time'] = now

    return result


def evaluate_overdue_passes(
    active_passes: list,
    current_time: Optional[datetime.datetime] = None
) -> list:
    """
    Scans passes in ACTIVE_OUTSIDE status where expected_return_time has passed.
    """
    if current_time is None:
        current_time = timezone.now()

    overdue_list = []
    for p in active_passes:
        if p.get('status') == GatePassStatus.ACTIVE_OUTSIDE and p.get('expected_return') < current_time:
            overdue_list.append(p['id'])
    return overdue_list
