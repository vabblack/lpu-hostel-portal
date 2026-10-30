"""
Notifications Views: In-app notification center, read tracking, and bulk actions.
"""
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.http import require_POST
from django.contrib import messages
from django.utils.translation import gettext_lazy as _

from apps.notifications.models import Notification
from apps.notifications.services.dispatcher import (
    mark_notification_as_read,
    mark_all_notifications_as_read,
)


@login_required
def notifications_list_view(request):
    """Render user's personal in-app notifications center with pagination."""
    notifications_qs = Notification.objects.filter(recipient=request.user).order_by('-created_at')
    unread_count = notifications_qs.filter(is_read=False).count()

    paginator = Paginator(notifications_qs, 15)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    context = {
        'page_obj': page_obj,
        'unread_count': unread_count,
    }
    return render(request, 'notifications/notification_list.html', context)


@login_required
@require_POST
def mark_as_read_view(request, notif_id):
    """Mark a single notification as read."""
    mark_notification_as_read(notif_id, request.user)
    return redirect('notifications:list')


@login_required
@require_POST
def mark_all_read_view(request):
    """Mark all unread notifications for current user as read."""
    count = mark_all_notifications_as_read(request.user)
    if count > 0:
        messages.success(request, _(f"Marked {count} notification(s) as read."))
    return redirect('notifications:list')
