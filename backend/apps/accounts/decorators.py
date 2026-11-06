"""
Role-Based Access Control (RBAC) Decorators.
Enforces backend authorization checks across views.
"""
from functools import wraps
from django.core.exceptions import PermissionDenied
from django.shortcuts import redirect
from django.urls import reverse
from .models import Role


def role_required(*allowed_roles):
    """
    Decorator for views that checks whether a user has one of the allowed roles.
    Unauthenticated users are redirected to login.
    Authenticated users lacking permissions receive an HTTP 403 Forbidden.
    """
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return redirect(f"{reverse('accounts:login')}?next={request.path}")

            # Superusers always bypass role checks
            if request.user.is_superuser:
                return view_func(request, *args, **kwargs)

            if request.user.role in allowed_roles:
                return view_func(request, *args, **kwargs)

            raise PermissionDenied("You do not have administrative permission to view this resource.")
        return _wrapped_view
    return decorator


def admin_required(view_func):
    """Restricts access exclusively to University Administrators."""
    return role_required(Role.ADMIN)(view_func)


def warden_required(view_func):
    """Restricts access to Hostel Wardens and Administrators."""
    return role_required(Role.WARDEN, Role.ADMIN)(view_func)


def student_required(view_func):
    """Restricts access exclusively to enrolled Students."""
    return role_required(Role.STUDENT)(view_func)

