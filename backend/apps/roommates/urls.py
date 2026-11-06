"""
URL configuration for the Roommates app.
"""
from django.urls import path
from apps.roommates import views

app_name = 'roommates'

urlpatterns = [
    path('preferences/', views.preferences_view, name='preferences'),
    path('discover/', views.discover_view, name='discover'),
    path('requests/', views.requests_view, name='requests'),
    path('requests/send/', views.send_request_action, name='send_request'),
    path('requests/<int:request_id>/respond/', views.respond_request_action, name='respond_request'),
    path('requests/<int:request_id>/cancel/', views.cancel_request_action, name='cancel_request'),
    path('group/<int:group_id>/leave/', views.leave_group_action, name='leave_group'),
]
