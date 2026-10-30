"""
Hostels Views: Hostel exploration catalog and room inventory discovery.
"""
from django.views.generic import ListView, DetailView
from django.db.models import Count, Q
from .models import Hostel, Room, BedStatus, GenderPolicy


class HostelListView(ListView):
    """Public and student catalog of university hostels."""
    model = Hostel
    template_name = 'hostels/hostel_list.html'
    context_object_name = 'hostels'

    def get_queryset(self):
        queryset = Hostel.objects.filter(status='ACTIVE').select_related('university')
        
        # Optional filter by gender policy
        gender = self.request.GET.get('gender')
        if gender in GenderPolicy.values:
            queryset = queryset.filter(gender_policy=gender)
            
        return queryset.order_by('name')


class HostelDetailView(DetailView):
    """Detailed view of a hostel, its blocks, floors, and room options."""
    model = Hostel
    template_name = 'hostels/hostel_detail.html'
    context_object_name = 'hostel'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Prefetch blocks with their floors and rooms
        context['blocks'] = self.object.blocks.prefetch_related(
            'floors__rooms__beds',
            'floors__rooms__facilities'
        ).all()
        return context
