"""
Occupancy Reporting and Executive Analytics Service.
Provides high-performance aggregation, census reporting, CSV exports,
and warden-scoped accommodation analytics.
"""
import csv
from datetime import datetime
from typing import Dict, Any, Optional
from django.http import HttpResponse
from django.db.models import Count, Q, Prefetch

from apps.hostels.models import (
    Hostel,
    Block,
    Floor,
    Room,
    Bed,
    BedStatus,
    WardenAssignment,
)
from apps.allocations.models import Allocation
from apps.applications.models import (
    HostelApplication,
    ApplicationStatus,
    AccommodationCycle,
)


def get_warden_scoped_hostels(user):
    """Return hostels accessible by user based on administrative role or warden assignments."""
    if user.is_admin:
        return Hostel.objects.filter(status='ACTIVE')
    if user.is_warden:
        assigned_ids = WardenAssignment.objects.filter(
            user=user, is_active=True
        ).values_list('hostel_id', flat=True)
        return Hostel.objects.filter(id__in=assigned_ids, status='ACTIVE')
    return Hostel.objects.none()


def get_detailed_occupancy_report(
    user,
    hostel_id: Optional[int] = None,
    block_id: Optional[int] = None,
    bed_status: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generate complete occupancy census summary and detailed bed roster.
    Properly scoped to the user's role (Admin vs Warden).
    """
    hostels = get_warden_scoped_hostels(user)
    if hostel_id:
        hostels = hostels.filter(pk=hostel_id)

    # Base bed queryset
    beds_qs = Bed.objects.filter(
        room__floor__block__hostel__in=hostels
    )

    if block_id:
        beds_qs = beds_qs.filter(room__floor__block_id=block_id)

    if bed_status and bed_status in BedStatus.values:
        beds_qs = beds_qs.filter(status=bed_status)

    # 1. Summary Metrics via single-pass conditional aggregation
    counts = beds_qs.aggregate(
        total_beds=Count('id'),
        occupied_beds=Count('id', filter=Q(status=BedStatus.OCCUPIED)),
        vacant_beds=Count('id', filter=Q(status=BedStatus.VACANT)),
        maintenance_beds=Count('id', filter=Q(status=BedStatus.MAINTENANCE)),
        reserved_beds=Count('id', filter=Q(status=BedStatus.RESERVED)),
    )

    total = counts['total_beds'] or 0
    occupied = counts['occupied_beds'] or 0
    vacant = counts['vacant_beds'] or 0
    maintenance = counts['maintenance_beds'] or 0
    rate = round((occupied / total * 100), 1) if total > 0 else 0.0

    # 2. Detailed Roster with active resident allocations
    active_alloc_prefetch = Prefetch(
        'allocations',
        queryset=Allocation.objects.filter(is_active=True).select_related(
            'student',
            'student__registry',
            'student__registry__branch',
            'cycle'
        ),
        to_attr='active_allocation_list'
    )

    roster = beds_qs.select_related(
        'room',
        'room__floor',
        'room__floor__block',
        'room__floor__block__hostel'
    ).prefetch_related(active_alloc_prefetch).order_by(
        'room__floor__block__hostel__name',
        'room__floor__block__name',
        'room__room_number',
        'bed_identifier'
    )

    return {
        'hostels': hostels,
        'selected_hostel_id': hostel_id,
        'summary': {
            'total_beds': total,
            'occupied_beds': occupied,
            'vacant_beds': vacant,
            'maintenance_beds': maintenance,
            'occupancy_rate': rate,
        },
        'roster': roster,
    }


def generate_occupancy_csv(user, hostel_id: Optional[int] = None) -> HttpResponse:
    """
    Generate downloadable CSV spreadsheet report of hostel occupancy census.
    """
    report_data = get_detailed_occupancy_report(user, hostel_id=hostel_id)
    roster = report_data['roster']

    response = HttpResponse(content_type='text/csv')
    timestamp = datetime.now().strftime('%Y%m%d_%H%M')
    response['Content-Disposition'] = f'attachment; filename="occupancy_report_{timestamp}.csv"'

    writer = csv.writer(response)
    writer.writerow([
        'Hostel Name',
        'Hostel Code',
        'Block',
        'Floor',
        'Room Number',
        'Bed Identifier',
        'Bed Status',
        'Resident Name',
        'Student ID',
        'Branch',
        'Institutional Email',
        'Cycle',
        'Occupancy Start',
        'Occupancy End'
    ])

    for bed in roster:
        resident_name = "—"
        student_id = "—"
        branch = "—"
        email = "—"
        cycle_name = "—"
        start_date = "—"
        end_date = "—"

        if hasattr(bed, 'active_allocation_list') and bed.active_allocation_list:
            alloc = bed.active_allocation_list[0]
            student = alloc.student
            resident_name = student.registry.full_name
            student_id = student.student_id
            branch = student.registry.branch.name
            email = student.registry.institutional_email
            cycle_name = alloc.cycle.name
            start_date = alloc.start_date.strftime('%Y-%m-%d')
            end_date = alloc.end_date.strftime('%Y-%m-%d')

        writer.writerow([
            bed.room.floor.block.hostel.name,
            bed.room.floor.block.hostel.code,
            bed.room.floor.block.name,
            bed.room.floor.floor_number,
            bed.room.room_number,
            bed.bed_identifier,
            bed.get_status_display(),
            resident_name,
            student_id,
            branch,
            email,
            cycle_name,
            start_date,
            end_date,
        ])

    return response


def get_intake_and_branch_analytics(cycle: Optional[AccommodationCycle] = None) -> Dict[str, Any]:
    """
    Aggregate intake funnel, branch distribution, and hostel utilization rates.
    """
    if not cycle:
        cycle = AccommodationCycle.objects.filter(is_active=True).first()

    # 1. Intake Funnel Metrics
    app_qs = HostelApplication.objects.filter(cycle=cycle) if cycle else HostelApplication.objects.all()

    funnel = app_qs.aggregate(
        total=Count('id'),
        approved=Count('id', filter=Q(status=ApplicationStatus.APPROVED)),
        allocated=Count('id', filter=Q(status=ApplicationStatus.ALLOCATED)),
        waitlisted=Count('id', filter=Q(status=ApplicationStatus.WAITLISTED)),
        rejected=Count('id', filter=Q(status=ApplicationStatus.REJECTED)),
        submitted=Count('id', filter=Q(status=ApplicationStatus.SUBMITTED)),
    )

    total_apps = funnel['total'] or 0
    allocated_count = funnel['allocated'] or 0
    conversion_rate = round((allocated_count / total_apps * 100), 1) if total_apps > 0 else 0.0

    # 2. Branch Distribution among allocated students
    alloc_qs = Allocation.objects.filter(is_active=True)
    if cycle:
        alloc_qs = alloc_qs.filter(cycle=cycle)

    branch_distribution = alloc_qs.values(
        'student__registry__branch__name'
    ).annotate(
        count=Count('id')
    ).order_by('-count')

    # 3. Hostel Capacity & Fill Rates
    hostels_data = []
    active_hostels = Hostel.objects.filter(status='ACTIVE')
    for h in active_hostels:
        h_beds = Bed.objects.filter(room__floor__block__hostel=h)
        total_beds = h_beds.count()
        occupied_beds = h_beds.filter(status=BedStatus.OCCUPIED).count()
        rate = round((occupied_beds / total_beds * 100), 1) if total_beds > 0 else 0.0
        hostels_data.append({
            'hostel': h,
            'total_beds': total_beds,
            'occupied_beds': occupied_beds,
            'fill_rate': rate,
        })

    return {
        'cycle': cycle,
        'funnel': funnel,
        'conversion_rate': conversion_rate,
        'branch_distribution': branch_distribution,
        'hostels_data': hostels_data,
    }
