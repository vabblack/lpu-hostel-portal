"""
LPU RMS (Relationship Management System) Maintenance Workflow.
Manages student room complaints, trade categorization, caretaker assignments,
SLA tracking, and auto-escalation.
"""
import datetime
from enum import Enum
from typing import Dict, Any, Optional
from django.utils import timezone


class RMSTradeCategory(str, Enum):
    PLUMBING = 'PLUMBING'
    ELECTRICAL = 'ELECTRICAL'
    WIFI_LAN = 'WIFI_LAN'
    CARPENTRY = 'CARPENTRY'
    APPLIANCE = 'APPLIANCE'
    PEST_CONTROL = 'PEST_CONTROL'


class RMSTicketPriority(str, Enum):
    LOW = 'LOW'
    MEDIUM = 'MEDIUM'
    HIGH = 'HIGH'
    EMERGENCY = 'EMERGENCY'


class RMSTicketStatus(str, Enum):
    OPEN = 'OPEN'
    ASSIGNED = 'ASSIGNED'
    IN_PROGRESS = 'IN_PROGRESS'
    RESOLVED = 'RESOLVED'
    CLOSED = 'CLOSED'
    ESCALATED = 'ESCALATED'


SLA_HOURS_MAPPING: Dict[RMSTicketPriority, int] = {
    RMSTicketPriority.EMERGENCY: 4,
    RMSTicketPriority.HIGH: 12,
    RMSTicketPriority.MEDIUM: 24,
    RMSTicketPriority.LOW: 48,
}


def calculate_sla_deadline(
    priority: RMSTicketPriority,
    created_at: Optional[datetime.datetime] = None
) -> datetime.datetime:
    """Calculates SLA deadline based on ticket severity."""
    base_time = created_at or timezone.now()
    hours = SLA_HOURS_MAPPING.get(priority, 24)
    return base_time + datetime.timedelta(hours=hours)


def check_ticket_escalation(
    status: RMSTicketStatus,
    sla_deadline: datetime.datetime,
    current_time: Optional[datetime.datetime] = None
) -> bool:
    """
    Returns True if an open or in-progress ticket has breached its SLA deadline.
    """
    now = current_time or timezone.now()
    if status in [RMSTicketStatus.OPEN, RMSTicketStatus.ASSIGNED, RMSTicketStatus.IN_PROGRESS]:
        return now > sla_deadline
    return False

