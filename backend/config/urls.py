"""
Root URL configuration for Hostel Allocation & Roommate Matching System.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from django.http import HttpResponse, HttpResponseRedirect


def spa_view(request, *args, **kwargs):
    """Serves the compiled React 19 SPA or redirects to the Vite dev server."""
    dist_index = settings.BASE_DIR.parent / 'frontend' / 'dist' / 'index.html'
    if dist_index.exists():
        with open(dist_index, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read(), content_type='text/html')
    return HttpResponseRedirect('http://localhost:5173/')


urlpatterns = [
    # Administration & Native Headless JSON REST API
    path('admin/', admin.site.urls),
    path('api/', include('apps.api.urls')),

    # Modern React 19 SPA Entrypoint & Asset Pipeline
    path('spa/', spa_view, name='spa_root'),
    re_path(r'^spa/.*$', spa_view, name='spa_catchall'),
    path('assets/<path:path>', serve, {'document_root': settings.BASE_DIR.parent / 'frontend' / 'dist' / 'assets'}),

    # Root redirects to React Frontend (or serves React SPA)
    path('', spa_view, name='home'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
