"""
Audit Models: Non-repudiation audit logging for administrative and allocation operations.
"""
from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class AuditLog(models.Model):
    """
    Immutable security audit trail recording who performed what action,
    on which record, from which IP address, and what changed.
    """
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        verbose_name=_('Actor / User')
    )
    action = models.CharField(
        _('Action Performed'),
        max_length=50,
        db_index=True,
        help_text=_('E.g., ALLOCATION_APPROVED, REALLOCATED, STATUS_CHANGED.')
    )
    target_model = models.CharField(
        _('Target Entity Model'),
        max_length=50,
        db_index=True,
        help_text=_('E.g., Allocation, HostelApplication, StudentRegistry.')
    )
    target_id = models.CharField(
        _('Target Primary Key'),
        max_length=50,
        help_text=_('Identifier of modified record.')
    )
    ip_address = models.GenericIPAddressField(
        _('IP Address'),
        null=True,
        blank=True
    )
    changes_json = models.JSONField(
        _('Changes Snapshot (JSON)'),
        null=True,
        blank=True,
        help_text=_('Diff of altered values before and after the operation.')
    )
    timestamp = models.DateTimeField(
        _('Timestamp'),
        auto_now_add=True,
        db_index=True
    )

    class Meta:
        verbose_name = _('Audit Log')
        verbose_name_plural = _('Audit Logs')
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['actor', 'timestamp'], name='idx_audit_actor_time'),
            models.Index(fields=['target_model', 'target_id'], name='idx_audit_target'),
        ]

    def __str__(self):
        actor_str = self.actor.email if self.actor else "SYSTEM"
        return f"[{self.timestamp:%Y-%m-%d %H:%M:%S}] {actor_str} -> {self.action} on {self.target_model}:{self.target_id}"
