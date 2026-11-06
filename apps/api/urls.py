"""
API Routing Configuration for React Frontend.
"""
from django.urls import path
from .views_auth import me_view, csrf_view, login_view, logout_view, register_view
from .views_hostels import hostel_list_view, hostel_detail_view, room_catalog_view, room_detail_view
from .views_roommates import (
    preferences_api_view,
    discover_candidates_view,
    roommate_requests_list_view,
    send_request_api_view,
    respond_request_api_view,
    cancel_request_api_view,
    roommate_group_api_view,
)
from .views_applications import applications_api_view, dashboard_summary_view

app_name = 'api'

urlpatterns = [
    # Auth endpoints
    path('auth/me/', me_view, name='auth_me'),
    path('auth/csrf/', csrf_view, name='auth_csrf'),
    path('auth/login/', login_view, name='auth_login'),
    path('auth/logout/', logout_view, name='auth_logout'),
    path('auth/register/', register_view, name='auth_register'),

    # Hostels & Rooms
    path('hostels/', hostel_list_view, name='hostels_list'),
    path('hostels/<int:pk>/', hostel_detail_view, name='hostel_detail'),
    path('rooms/', room_catalog_view, name='rooms_catalog'),
    path('rooms/<int:pk>/', room_detail_view, name='room_detail'),

    # Roommate matching & groups
    path('roommates/preferences/', preferences_api_view, name='roommates_preferences'),
    path('roommates/discover/', discover_candidates_view, name='roommates_discover'),
    path('roommates/requests/', roommate_requests_list_view, name='roommates_requests'),
    path('roommates/requests/send/', send_request_api_view, name='roommates_send_request'),
    path('roommates/requests/<int:pk>/respond/', respond_request_api_view, name='roommates_respond_request'),
    path('roommates/requests/<int:pk>/cancel/', cancel_request_api_view, name='roommates_cancel_request'),
    path('roommates/group/', roommate_group_api_view, name='roommates_group'),

    # Applications & Summary
    path('applications/', applications_api_view, name='applications'),
    path('dashboard/summary/', dashboard_summary_view, name='dashboard_summary'),
]
