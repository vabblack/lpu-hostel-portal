"""
Notification Dispatcher and Mailer Service.
Delivers in-app transactional alerts and email notifications across application,
roommate matching, and bed allocation lifecycles.
"""
from typing import Optional
from django.conf import settings
from django.core.mail import send_mail
from django.utils.translation import gettext_lazy as _

from apps.notifications.models import Notification, NotificationType
from apps.applications.models import HostelApplication
from apps.roommates.models import RoommateRequest
from apps.allocations.models import Allocation


def send_notification(
    recipient,
    notification_type: str,
    title: str,
    message: str,
    send_email: bool = True
) -> Notification:
    """
    Create an in-app database notification and dispatch a notification email.
    """
    notif = Notification.objects.create(
        recipient=recipient,
        notification_type=notification_type,
        title=title,
        message=message,
        is_read=False,
    )

    if send_email and recipient.email:
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@hostelportal.lpu.in')
        subject = f"[Hostel Portal] {title}"
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=from_email,
                recipient_list=[recipient.email]
            )
        except Exception:
            pass

    return notif


def notify_application_status_changed(
    application: HostelApplication,
    old_status: str,
    new_status: str,
    remarks: str = ''
) -> Notification:
    """
    Dispatch notification when an application status updates (Approved, Waitlisted, Rejected).
    """
    title = f"Application #{application.id} Update: {application.get_status_display()}"
    remarks_text = f"\nAdministrative Remarks: {remarks}" if remarks else ""
    message = (
        f"Dear {application.student.registry.full_name},\n\n"
        f"Your accommodation application (#{application.id}) for '{application.cycle.name}' "
        f"has been updated from {old_status} to {new_status}.{remarks_text}\n\n"
        f"Please check your portal dashboard for further details.\n"
        f"Hostel Administration"
    )

    return send_notification(
        recipient=application.student.user,
        notification_type=NotificationType.APPLICATION,
        title=title,
        message=message,
    )


def notify_roommate_request_received(request: RoommateRequest) -> Notification:
    """
    Dispatch notification to recipient when a new roommate request arrives.
    """
    sender = request.sender
    title = f"New Roommate Request from {sender.student_id}"
    message = (
        f"Dear {request.receiver.registry.full_name},\n\n"
        f"Student {sender.registry.full_name} ({sender.student_id}) has sent you a direct roommate request "
        f"for accommodation cycle '{request.cycle.name}'.\n\n"
        f"Visit the Roommate Request Center in your portal to view their profile, match compatibility, "
        f"and accept or decline the request.\n\n"
        f"Hostel Portal"
    )

    return send_notification(
        recipient=request.receiver.user,
        notification_type=NotificationType.ROOMMATE,
        title=title,
        message=message,
    )


def notify_roommate_request_responded(
    request: RoommateRequest,
    action: str
) -> Notification:
    """
    Dispatch notification to requester when their request is accepted or declined.
    """
    receiver = request.receiver
    action_verb = "accepted" if action.upper() == 'ACCEPT' else "declined"
    title = f"Roommate Request {action_verb.capitalize()}"
    message = (
        f"Dear {request.sender.registry.full_name},\n\n"
        f"Student {receiver.registry.full_name} ({receiver.student_id}) has {action_verb} your roommate request "
        f"for accommodation cycle '{request.cycle.name}'.\n\n"
        f"Visit the Roommate Center in your portal to view your group status.\n\n"
        f"Hostel Portal"
    )

    return send_notification(
        recipient=request.sender.user,
        notification_type=NotificationType.ROOMMATE,
        title=title,
        message=message,
    )


def notify_bed_allocated(allocation: Allocation) -> Notification:
    """
    Dispatch confirmation notification when a bed is allocated to a student.
    """
    bed = allocation.bed
    room = bed.room
    hostel = room.floor.block.hostel
    student = allocation.student

    title = f"Bed Confirmed: Room {room.room_number} (Bed {bed.bed_identifier})"
    message = (
        f"Congratulations {student.registry.full_name}!\n\n"
        f"Your hostel accommodation has been successfully allocated for '{allocation.cycle.name}':\n\n"
        f"  Hostel: {hostel.name} ({hostel.code})\n"
        f"  Block: {room.floor.block.name}\n"
        f"  Floor: Floor {room.floor.floor_number}\n"
        f"  Room Number: {room.room_number}\n"
        f"  Bed Identifier: {bed.bed_identifier}\n"
        f"  Occupancy Term: {allocation.start_date.strftime('%B %d, %Y')} to {allocation.end_date.strftime('%B %d, %Y')}\n\n"
        f"Please report to your hostel warden desk upon campus arrival.\n\n"
        f"Hostel Administration"
    )

    return send_notification(
        recipient=student.user,
        notification_type=NotificationType.ALLOCATION,
        title=title,
        message=message,
    )


def mark_notification_as_read(notification_id: int, user) -> bool:
    """Mark a single notification as read."""
    updated = Notification.objects.filter(pk=notification_id, recipient=user).update(is_read=True)
    return updated > 0


def mark_all_notifications_as_read(user) -> int:
    """Mark all unread notifications for a user as read."""
    return Notification.objects.filter(recipient=user, is_read=False).update(is_read=True)
