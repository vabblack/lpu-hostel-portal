"""
Hostels Views: Hostel exploration catalog, room inventory discovery,
occupancy reports, CSV census exports, and capacity analytics.
"""
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.shortcuts import render
from django.views.generic import ListView, DetailView
from django.db.models import Count, Q

from apps.accounts.decorators import admin_required, warden_required
from apps.hostels.models import Hostel, Room, BedStatus, GenderPolicy, RoomCategory
from apps.hostels.services.reports import (
    get_detailed_occupancy_report,
    generate_occupancy_csv,
    get_intake_and_branch_analytics,
)


class HostelListView(ListView):
    """Public and student catalog of university hostels and room inventory."""
    model = Hostel
    template_name = 'hostels/hostel_list.html'
    context_object_name = 'hostels'

    def get_queryset(self):
        queryset = (
            Hostel.objects.filter(status='ACTIVE')
            .select_related('university')
            .annotate(
                total_rooms_count=Count('blocks__floors__rooms', distinct=True),
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
                ac_rooms_count=Count(
                    'blocks__floors__rooms',
                    filter=Q(blocks__floors__rooms__is_air_conditioned=True),
                    distinct=True
                ),
                cooler_rooms_count=Count(
                    'blocks__floors__rooms',
                    filter=Q(blocks__floors__rooms__is_air_conditioned=False),
                    distinct=True
                ),
            )
        )
        gender = self.request.GET.get('gender')
        if gender in GenderPolicy.values:
            queryset = queryset.filter(gender_policy=gender)
        return queryset.order_by('name')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        view_mode = self.request.GET.get('view', 'hostels').lower()
        context['view_mode'] = view_mode
        context['selected_gender'] = self.request.GET.get('gender', '')
        context['selected_seater'] = self.request.GET.get('seater', '')
        context['selected_cooling'] = self.request.GET.get('cooling', '')
        context['selected_category'] = self.request.GET.get('category', '')
        context['selected_hostel'] = self.request.GET.get('hostel', '')
        context['all_hostels'] = Hostel.objects.filter(status='ACTIVE').order_by('name')
        context['category_choices'] = RoomCategory.choices

        if view_mode == 'rooms':
            rooms_qs = (
                Room.objects.select_related('floor__block__hostel__university')
                .prefetch_related('beds', 'facilities')
                .order_by('floor__block__hostel__code', 'room_number')
            )
            hostel_param = self.request.GET.get('hostel')
            if hostel_param:
                if hostel_param.isdigit():
                    rooms_qs = rooms_qs.filter(floor__block__hostel__id=int(hostel_param))
                else:
                    rooms_qs = rooms_qs.filter(floor__block__hostel__code=hostel_param)

            gender_param = self.request.GET.get('gender')
            if gender_param in GenderPolicy.values:
                rooms_qs = rooms_qs.filter(floor__block__hostel__gender_policy=gender_param)

            seater_param = self.request.GET.get('seater')
            if seater_param and seater_param.isdigit():
                rooms_qs = rooms_qs.filter(capacity=int(seater_param))

            cooling_param = self.request.GET.get('cooling')
            if cooling_param == 'AC':
                rooms_qs = rooms_qs.filter(is_air_conditioned=True)
            elif cooling_param == 'COOLER':
                rooms_qs = rooms_qs.filter(is_air_conditioned=False)

            cat_param = self.request.GET.get('category')
            if cat_param in RoomCategory.values:
                rooms_qs = rooms_qs.filter(category=cat_param)

            paginator = Paginator(rooms_qs, 18)
            page_num = self.request.GET.get('page', 1)
            context['rooms_page'] = paginator.get_page(page_num)
            context['total_filtered_rooms'] = rooms_qs.count()

        return context


class RoomCatalogView(HostelListView):
    """Direct URL endpoint for Room & Accommodation Catalog."""
    def get_context_data(self, **kwargs):
        self.request.GET = self.request.GET.copy()
        if 'view' not in self.request.GET:
            self.request.GET['view'] = 'rooms'
        return super().get_context_data(**kwargs)


class HostelDetailView(DetailView):
    """Detailed view of a hostel, its blocks, floors, and room options."""
    model = Hostel
    template_name = 'hostels/hostel_detail.html'
    context_object_name = 'hostel'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['blocks'] = self.object.blocks.prefetch_related(
            'floors__rooms__beds',
            'floors__rooms__facilities'
        ).all()
        return context


@login_required
def occupancy_report_view(request):
    """Administrative and Warden occupancy census report with pagination."""
    if not (request.user.is_admin or request.user.is_warden):
        return render(request, '403.html', status=403)

    hostel_id = request.GET.get('hostel')
    hostel_id = int(hostel_id) if hostel_id and hostel_id.isdigit() else None
    bed_status = request.GET.get('status', '').upper()

    report = get_detailed_occupancy_report(
        user=request.user,
        hostel_id=hostel_id,
        bed_status=bed_status if bed_status in BedStatus.values else None
    )

    # Paginate roster table (25 beds per page)
    paginator = Paginator(report['roster'], 25)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    context = {
        'hostels': report['hostels'],
        'selected_hostel_id': hostel_id,
        'selected_status': bed_status,
        'summary': report['summary'],
        'page_obj': page_obj,
        'bed_status_choices': BedStatus.choices,
    }
    return render(request, 'hostels/occupancy_report.html', context)


@login_required
def export_occupancy_csv_view(request):
    """Export current census roster as a CSV spreadsheet."""
    if not (request.user.is_admin or request.user.is_warden):
        return render(request, '403.html', status=403)

    hostel_id = request.GET.get('hostel')
    hostel_id = int(hostel_id) if hostel_id and hostel_id.isdigit() else None
    return generate_occupancy_csv(request.user, hostel_id=hostel_id)


@login_required
def analytics_dashboard_view(request):
    """Executive accommodation intake, branch distribution, and capacity analytics."""
    if not (request.user.is_admin or request.user.is_warden):
        return render(request, '403.html', status=403)

    analytics = get_intake_and_branch_analytics()
    return render(request, 'hostels/analytics.html', analytics)
