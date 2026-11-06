"""
Notifications Models: Transactional student and administrative notification center.
"""
from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class NotificationType(models.TextChoices):
    """Categorization of notification events."""
    SYSTEM = 'SYSTEM', _('System Announcement')
    APPLICATION = 'APPLICATION', _('Application Lifecycle')
    ROOMMATE = 'ROOMMATE', _('Roommate Request / Group')
    ALLOCATION = 'ALLOCATION', _('Bed Allocation')


class Notification(models.Model):
    """In-app alert notification delivered to a user."""
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name=_('Recipient')
    )
    title = models.CharField(_('Title'), max_length=150)
    message = models.TextField(_('Message'))
    notification_type = models.CharField(
        _('Notification Type'),
        max_length=30,
        choices=NotificationType.choices,
        default=NotificationType.SYSTEM,
        db_index=True
    )
    is_read = models.BooleanField(
        _('Read Status'),
        default=False,
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = _('Notification')
        verbose_name_plural = _('Notifications')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read'], name='idx_notif_recipient_read'),
        ]

    def __str__(self):
        read_badge = "[READ]" if self.is_read else "[UNREAD]"
        return f"{read_badge} {self.recipient.email}: {self.title}"
