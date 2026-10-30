"""
URLs for Hostels app: discovery, occupancy reporting, and analytics.
"""
from django.urls import path
from .views import (
    HostelListView,
    HostelDetailView,
    occupancy_report_view,
    export_occupancy_csv_view,
    analytics_dashboard_view,
)

app_name = 'hostels'

urlpatterns = [
    path('', HostelListView.as_view(), name='list'),
    path('<int:pk>/', HostelDetailView.as_view(), name='detail'),
    path('reports/occupancy/', occupancy_report_view, name='occupancy_report'),
    path('reports/occupancy/csv/', export_occupancy_csv_view, name='export_occupancy_csv'),
    path('reports/analytics/', analytics_dashboard_view, name='analytics_dashboard'),
]
