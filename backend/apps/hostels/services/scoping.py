"""
Hostels Scoping Service: Restricts Warden access and delegated approval authority to assigned hostels.
"""
from typing import List
from apps.hostels.models import Hostel, WardenAssignment


def get_warden_assigned_hostel_ids(user) -> List[int]:
    """
    Returns list of hostel IDs that this user is authorized to manage.
    Administrators and Superusers receive access to all hostels.
    Wardens receive access strictly to their active assigned hostels.
    """
    if not user.is_authenticated:
        return []

    if user.is_admin or user.is_superuser:
        return list(Hostel.objects.values_list('id', flat=True))

    if user.is_warden:
        return list(
            WardenAssignment.objects.filter(
                user=user,
                is_active=True
            ).values_list('hostel_id', flat=True)
        )

    return []


def can_warden_manage_hostel(user, hostel: Hostel) -> bool:
    """Checks whether the user has management scope over a specific hostel."""
    if not user.is_authenticated:
        return False

    if user.is_admin or user.is_superuser:
        return True

    if user.is_warden:
        return WardenAssignment.objects.filter(
            user=user,
            hostel=hostel,
            is_active=True
        ).exists()

    return False


def can_warden_approve_allocation(user, hostel: Hostel) -> bool:
    """
    Checks whether a warden holds delegated allocation approval authority for a hostel.
    By default (Rule 3), administrators have final approval. Wardens require explicit delegation.
    """
    if not user.is_authenticated:
        return False

    if user.is_admin or user.is_superuser:
        return True

    if user.is_warden:
        return WardenAssignment.objects.filter(
            user=user,
            hostel=hostel,
            is_active=True,
            can_approve_allocation=True
        ).exists()

    return False

