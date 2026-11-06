"""
Hostels Occupancy Service: Database-level aggregation queries for real-time inventory and capacity metrics.
Eliminates N+1 queries by leveraging conditional SQL aggregation in a single query pass.
"""
from typing import List, Dict, Any, Optional
from django.db.models import Count, Q, QuerySet
from apps.hostels.models import Hostel, Room, Bed, BedStatus, RoomStatus, GenderPolicy


def get_hostel_occupancy_summary(hostel_id: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    Computes occupancy analytics across one or all active hostels.
    Uses conditional Count aggregations to retrieve bed counts in a single query.
    """
    query = Hostel.objects.filter(status='ACTIVE')
    if hostel_id is not None:
        query = query.filter(id=hostel_id)

    # Single-pass aggregation across related beds
    hostels_with_stats = query.annotate(
        total_rooms_count=Count('blocks__floors__rooms', distinct=True),
        total_beds_count=Count('blocks__floors__rooms__beds', distinct=True),
        vacant_beds_count=Count(
            'blocks__floors__rooms__beds',
            filter=Q(blocks__floors__rooms__beds__status=BedStatus.VACANT),
            distinct=True
        ),
        occupied_beds_count=Count(
            'blocks__floors__rooms__beds',
            filter=Q(blocks__floors__rooms__beds__status=BedStatus.OCCUPIED),
            distinct=True
        ),
        reserved_beds_count=Count(
            'blocks__floors__rooms__beds',
            filter=Q(blocks__floors__rooms__beds__status=BedStatus.RESERVED),
            distinct=True
        ),
        maintenance_beds_count=Count(
            'blocks__floors__rooms__beds',
            filter=Q(blocks__floors__rooms__beds__status=BedStatus.MAINTENANCE),
            distinct=True
        ),
    ).order_by('name')

    results = []
    for h in hostels_with_stats:
        total_beds = h.total_beds_count
        occupied = h.occupied_beds_count
        occupancy_rate = round((occupied / total_beds) * 100, 1) if total_beds > 0 else 0.0

        results.append({
            'hostel_id': h.id,
            'hostel_name': h.name,
            'hostel_code': h.code,
            'gender_policy': h.gender_policy,
            'gender_display': h.get_gender_policy_display(),
            'total_rooms': h.total_rooms_count,
            'total_beds': total_beds,
            'occupied_beds': occupied,
            'vacant_beds': h.vacant_beds_count,
            'reserved_beds': h.reserved_beds_count,
            'maintenance_beds': h.maintenance_beds_count,
            'occupancy_rate_percent': occupancy_rate,
        })

    return results


def get_available_rooms_query(
    hostel_id: Optional[int] = None,
    gender: Optional[str] = None,
    is_ac: Optional[bool] = None,
    capacity: Optional[int] = None,
    washroom_type: Optional[str] = None,
) -> QuerySet:
    """
    Returns an optimized QuerySet of rooms that currently have at least one vacant bed.
    Applies optional filtering by hostel, student gender eligibility, AC status, capacity, and washroom type.
    """
    queryset = Room.objects.filter(
        status=RoomStatus.AVAILABLE,
        floor__block__hostel__status='ACTIVE'
    ).select_related(
        'floor__block__hostel'
    ).prefetch_related(
        'facilities'
    )

    if hostel_id:
        queryset = queryset.filter(floor__block__hostel_id=hostel_id)

    if gender:
        queryset = queryset.filter(
            Q(floor__block__hostel__gender_policy=gender) |
            Q(floor__block__hostel__gender_policy=GenderPolicy.CO_ED)
        )

    if is_ac is not None:
        queryset = queryset.filter(is_air_conditioned=is_ac)

    if capacity:
        queryset = queryset.filter(capacity=capacity)

    if washroom_type:
        queryset = queryset.filter(washroom_type=washroom_type)

    # Annotate with vacant bed count and filter for rooms with at least one vacant bed
    queryset = queryset.annotate(
        vacant_count=Count('beds', filter=Q(beds__status=BedStatus.VACANT))
    ).filter(vacant_count__gt=0).order_by('floor__block__hostel__name', 'room_number')

    return queryset

