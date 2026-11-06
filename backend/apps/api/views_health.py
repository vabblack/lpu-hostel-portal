"""
API Health Check View for Render and Uptime Monitors.
"""
from django.db import connection
from django.http import JsonResponse
from django.views.decorators.http import require_GET


@require_GET
def health_check_view(request):
    """
    Returns 200 OK if API is active and database connection executes cleanly.
    Returns 503 Service Unavailable if database is unreachable.
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            row = cursor.fetchone()
            if not row or row[0] != 1:
                raise RuntimeError("Database probe returned unexpected result.")
    except Exception as e:
        return JsonResponse({
            'status': 'unhealthy',
            'database': 'unreachable',
            'error': str(e)
        }, status=503)

    return JsonResponse({
        'status': 'healthy',
        'database': 'connected',
        'service': 'Hostel Allocation & Roommate Matching API'
    }, status=200)
