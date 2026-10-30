"""
URLs for Hostels app.
"""
from django.urls import path
from .views import HostelListView, HostelDetailView

app_name = 'hostels'

urlpatterns = [
    path('', HostelListView.as_view(), name='list'),
    path('<int:pk>/', HostelDetailView.as_view(), name='detail'),
]
