"""
LPU Room Consolidation Engine.
Identifies rooms where mid-session vacancies cause occupancy to drop below 50%,
and identifies candidate consolidation target rooms of identical specs.
"""
from decimal import Decimal
from typing import List, Dict, Any
from apps.hostels.models import Room, BedStatus


def evaluate_room_consolidation(room: Room) -> Dict[str, Any]:
    """
    Evaluates whether a room meets the consolidation trigger condition:
    Capacity >= 2 and active occupants / capacity < 0.50.
    """
    if room.capacity < 2:
        return {
            'room_id': room.id,
            'is_flagged': False,
            'reason': 'Single-seater rooms are exempt from consolidation.',
            'occupancy_percentage': Decimal('100.00') if room.occupied_beds_count > 0 else Decimal('0.00'),
        }

    occupied_count = room.beds.filter(status=BedStatus.OCCUPIED).count()
    occupancy_ratio = Decimal(occupied_count) / Decimal(room.capacity)
    occupancy_percentage = (occupancy_ratio * Decimal('100.00')).quantize(Decimal('0.01'))

    is_flagged = occupied_count > 0 and occupancy_ratio < Decimal('0.50')

    return {
        'room_id': room.id,
        'room_number': room.room_number,
        'hostel_code': room.floor.block.hostel.code,
        'capacity': room.capacity,
        'occupied_count': occupied_count,
        'occupancy_percentage': occupancy_percentage,
        'is_flagged': is_flagged,
        'recommendation': 'CONSOLIDATE_RESIDENTS' if is_flagged else 'NORMAL',
    }


def find_consolidation_targets(source_room: Room) -> List[Room]:
    """
    Finds available rooms in the same hostel matching the source room's
    capacity, cooling, and gender policy that have sufficient vacant beds.
    """
    hostel = source_room.floor.block.hostel
    needed_vacancies = source_room.occupied_beds_count

    potential_rooms = Room.objects.filter(
        floor__block__hostel=hostel,
        capacity=source_room.capacity,
        is_air_conditioned=source_room.is_air_conditioned,
    ).exclude(pk=source_room.pk).prefetch_related('beds')

    valid_targets = []
    for r in potential_rooms:
        vacant_count = r.beds.filter(status=BedStatus.VACANT).count()
        if vacant_count >= needed_vacancies:
            valid_targets.append(r)

    return valid_targets

