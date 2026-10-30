"""
Root URL configuration for Hostel Allocation & Roommate Matching System.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('apps.accounts.urls')),
    path('hostels/', include('apps.hostels.urls')),
    path('applications/', include('apps.applications.urls')),
    path('roommates/', include('apps.roommates.urls')),
    path('notifications/', include('apps.notifications.urls')),
    path('', TemplateView.as_view(template_name='landing.html'), name='home'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
