"""
URLs for Applications app.
"""
from django.urls import path
from .views import (
    ApplyView,
    ApplicationDetailView,
    ApplicationReviewQueueView,
    ApplicationReviewActionView,
)

app_name = 'applications'

urlpatterns = [
    path('apply/', ApplyView.as_view(), name='apply'),
    path('<int:pk>/', ApplicationDetailView.as_view(), name='detail'),
    path('queue/', ApplicationReviewQueueView.as_view(), name='queue'),
    path('<int:pk>/review/', ApplicationReviewActionView.as_view(), name='review_action'),
]
