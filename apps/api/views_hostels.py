"""
API Hostels and Rooms Views: Complex inventory, floor plans, room catalog, and fee calculation.
"""
from django.db.models import Count, Q, Min, Max
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_GET

from apps.hostels.models import Hostel, Room, Bed, BedStatus, RoomStatus, GenderPolicy


@require_GET
def hostel_list_view(request):
    """
    Returns full list of campus hostels with live occupancy, capacity,
    and facility breakdowns.
    """
    gender_filter = request.GET.get('gender')
    status_filter = request.GET.get('status')

    qs = Hostel.objects.all().order_by('name')

    if gender_filter:
        qs = qs.filter(gender_policy=gender_filter)
    if status_filter:
        qs = qs.filter(status=status_filter)

    hostels_data = []
    for h in qs:
        # Aggregated room & bed metrics
        rooms_qs = Room.objects.filter(floor__block__hostel=h)
        total_rooms = rooms_qs.count()
        ac_rooms = rooms_qs.filter(is_air_conditioned=True).count()
        cooler_rooms = total_rooms - ac_rooms

        beds_qs = Bed.objects.filter(room__floor__block__hostel=h)
        total_beds = beds_qs.count()
        vacant_beds = beds_qs.filter(status=BedStatus.VACANT).count()
        occupied_beds = beds_qs.filter(status=BedStatus.OCCUPIED).count()
        occupancy_pct = round((occupied_beds / total_beds * 100), 1) if total_beds > 0 else 0

        # Calculate fee ranges
        fees = [r.standard_fee for r in rooms_qs if r.standard_fee is not None]
        min_fee = min(fees) if fees else None
        max_fee = max(fees) if fees else None

        hostels_data.append({
            'id': h.id,
            'name': h.name,
            'code': h.code,
            'gender_policy': h.gender_policy,
            'gender_policy_display': h.get_gender_policy_display(),
            'status': h.status,
            'status_display': h.get_status_display(),
            'description': h.description,
            'total_capacity': h.total_capacity,
            'total_rooms': total_rooms,
            'total_beds': total_beds,
            'vacant_beds': vacant_beds,
            'occupied_beds': occupied_beds,
            'occupancy_pct': occupancy_pct,
            'ac_rooms_count': ac_rooms,
            'cooler_rooms_count': cooler_rooms,
            'min_standard_fee': min_fee,
            'max_standard_fee': max_fee,
        })

    return JsonResponse({'hostels': hostels_data, 'count': len(hostels_data)})


@require_GET
def hostel_detail_view(request, pk):
    """
    Returns full details for a single hostel including blocks, floors,
    and associated rooms.
    """
    hostel = get_object_or_404(Hostel, pk=pk)

    # Fetch blocks with floors
    blocks_data = []
    blocks = hostel.blocks.prefetch_related('floors', 'floors__rooms', 'floors__rooms__beds').all()

    for block in blocks:
        floors_data = []
        for floor in block.floors.all():
            rooms_data = []
            for room in floor.rooms.all():
                rooms_data.append({
                    'id': room.id,
                    'room_number': room.room_number,
                    'capacity': room.capacity,
                    'category': room.category,
                    'category_display': room.get_category_display(),
                    'washroom_type': room.washroom_type,
                    'is_air_conditioned': room.is_air_conditioned,
                    'cooling_type': room.cooling_type,
                    'status': room.status,
                    'standard_fee': room.standard_fee,
                    'edb_fee': room.edb_fee,
                    'quota_kwh': room.quota_kwh,
                    'vacant_beds_count': room.vacant_beds_count,
                    'occupied_beds_count': room.occupied_beds_count,
                    'is_full': room.is_full,
                    'beds': [
                        {
                            'id': b.id,
                            'identifier': b.bed_identifier,
                            'status': b.status,
                            'status_display': b.get_status_display(),
                        } for b in room.beds.all()
                    ]
                })

            floors_data.append({
                'id': floor.id,
                'floor_number': floor.floor_number,
                'label': 'Ground Floor' if floor.floor_number == 0 else f'Floor {floor.floor_number}',
                'rooms': rooms_data,
            })

        blocks_data.append({
            'id': block.id,
            'name': block.name,
            'floors': floors_data,
        })

    # Metric summaries
    beds_qs = Bed.objects.filter(room__floor__block__hostel=hostel)
    total_beds = beds_qs.count()
    vacant_beds = beds_qs.filter(status=BedStatus.VACANT).count()
    occupied_beds = beds_qs.filter(status=BedStatus.OCCUPIED).count()

    return JsonResponse({
        'hostel': {
            'id': hostel.id,
            'name': hostel.name,
            'code': hostel.code,
            'gender_policy': hostel.gender_policy,
            'gender_policy_display': hostel.get_gender_policy_display(),
            'status': hostel.status,
            'status_display': hostel.get_status_display(),
            'description': hostel.description,
            'total_capacity': hostel.total_capacity,
            'total_beds': total_beds,
            'vacant_beds': vacant_beds,
            'occupied_beds': occupied_beds,
            'blocks': blocks_data,
        }
    })


@require_GET
def room_catalog_view(request):
    """
    Searchable, filterable room inventory across all hostels.
    """
    qs = Room.objects.select_related(
        'floor', 'floor__block', 'floor__block__hostel'
    ).prefetch_related('beds', 'facilities').all()

    # Filters
    hostel_id = request.GET.get('hostel_id')
    if hostel_id:
        qs = qs.filter(floor__block__hostel_id=hostel_id)

    gender = request.GET.get('gender')
    if gender:
        qs = qs.filter(floor__block__hostel__gender_policy=gender)

    capacity = request.GET.get('capacity') or request.GET.get('seater')
    if capacity:
        try:
            qs = qs.filter(capacity=int(capacity))
        except ValueError:
            pass

    cooling = request.GET.get('cooling') or request.GET.get('cooling_type')
    if cooling:
        cooling_upper = cooling.upper()
        if cooling_upper in ('AC', 'AIR_CONDITIONED', 'TRUE'):
            qs = qs.filter(is_air_conditioned=True)
        elif cooling_upper in ('COOLER', 'AIR_COOLED', 'NON_AC', 'FALSE'):
            qs = qs.filter(is_air_conditioned=False)

    category = request.GET.get('category')
    if category:
        qs = qs.filter(category=category.upper())

    washroom = request.GET.get('washroom_type')
    if washroom:
        qs = qs.filter(washroom_type=washroom.upper())

    search = request.GET.get('q', '').strip()
    if search:
        qs = qs.filter(
            Q(room_number__icontains=search) |
            Q(floor__block__hostel__name__icontains=search) |
            Q(floor__block__hostel__code__icontains=search)
        )

    vacant_only = request.GET.get('vacant_only')
    if vacant_only and vacant_only.lower() in ('1', 'true', 'yes'):
        qs = qs.filter(beds__status=BedStatus.VACANT).distinct()

    rooms_data = []
    for r in qs:
        hostel = r.floor.block.hostel
        rooms_data.append({
            'id': r.id,
            'room_number': r.room_number,
            'hostel_id': hostel.id,
            'hostel_name': hostel.name,
            'hostel_code': hostel.code,
            'gender_policy': hostel.gender_policy,
            'gender_policy_display': hostel.get_gender_policy_display(),
            'block_name': r.floor.block.name,
            'floor_number': r.floor.floor_number,
            'capacity': r.capacity,
            'category': r.category,
            'category_display': r.get_category_display(),
            'washroom_type': r.washroom_type,
            'washroom_type_display': r.get_washroom_type_display(),
            'is_air_conditioned': r.is_air_conditioned,
            'cooling_type': r.cooling_type,
            'status': r.status,
            'status_display': r.get_status_display(),
            'standard_fee': r.standard_fee,
            'edb_fee': r.edb_fee,
            'quota_kwh': r.quota_kwh,
            'vacant_beds_count': r.vacant_beds_count,
            'occupied_beds_count': r.occupied_beds_count,
            'is_full': r.is_full,
            'facilities': [f.name for f in r.facilities.all()],
            'beds': [
                {
                    'id': b.id,
                    'identifier': b.bed_identifier,
                    'status': b.status,
                    'status_display': b.get_status_display(),
                } for b in r.beds.all()
            ]
        })

    return JsonResponse({'rooms': rooms_data, 'count': len(rooms_data)})


@require_GET
def room_detail_view(request, pk):
    """Returns detailed information for a single room."""
    room = get_object_or_404(
        Room.objects.select_related('floor', 'floor__block', 'floor__block__hostel').prefetch_related('beds', 'facilities'),
        pk=pk
    )
    hostel = room.floor.block.hostel

    return JsonResponse({
        'room': {
            'id': room.id,
            'room_number': room.room_number,
            'hostel_id': hostel.id,
            'hostel_name': hostel.name,
            'hostel_code': hostel.code,
            'gender_policy': hostel.gender_policy,
            'gender_policy_display': hostel.get_gender_policy_display(),
            'block_name': room.floor.block.name,
            'floor_number': room.floor.floor_number,
            'capacity': room.capacity,
            'category': room.category,
            'category_display': room.get_category_display(),
            'washroom_type': room.washroom_type,
            'washroom_type_display': room.get_washroom_type_display(),
            'is_air_conditioned': room.is_air_conditioned,
            'cooling_type': room.cooling_type,
            'status': room.status,
            'status_display': room.get_status_display(),
            'standard_fee': room.standard_fee,
            'edb_fee': room.edb_fee,
            'quota_kwh': room.quota_kwh,
            'vacant_beds_count': room.vacant_beds_count,
            'occupied_beds_count': room.occupied_beds_count,
            'is_full': room.is_full,
            'facilities': [f.name for f in room.facilities.all()],
            'beds': [
                {
                    'id': b.id,
                    'identifier': b.bed_identifier,
                    'status': b.status,
                    'status_display': b.get_status_display(),
                } for b in room.beds.all()
            ]
        }
    })
