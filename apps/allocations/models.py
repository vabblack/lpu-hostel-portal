"""
Allocations Models: Bed assignments, concurrency constraints, and allocation history.
"""
from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class Allocation(models.Model):
    """
    Active or historical bed allocation record for an approved application.
    Protected by database-level unique constraints preventing double bookings.
    """
    student = models.ForeignKey(
        'students.StudentProfile',
        on_delete=models.PROTECT,
        related_name='allocations',
        verbose_name=_('Student')
    )
    bed = models.ForeignKey(
        'hostels.Bed',
        on_delete=models.PROTECT,
        related_name='allocations',
        verbose_name=_('Allocated Bed')
    )
    application = models.OneToOneField(
        'applications.HostelApplication',
        on_delete=models.PROTECT,
        related_name='allocation',
        verbose_name=_('Approved Application')
    )
    cycle = models.ForeignKey(
        'applications.AccommodationCycle',
        on_delete=models.PROTECT,
        related_name='allocations',
        verbose_name=_('Accommodation Cycle')
    )
    allocated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='granted_allocations',
        verbose_name=_('Approved / Allocated By')
    )
    start_date = models.DateField(_('Occupancy Start Date'))
    end_date = models.DateField(_('Occupancy End Date'))
    is_active = models.BooleanField(
        _('Active Allocation'),
        default=True,
        db_index=True,
        help_text=_('True if student currently occupies this bed.')
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Bed Allocation')
        verbose_name_plural = _('Bed Allocations')
        ordering = ['-created_at']
        constraints = [
            # Critical Concurrency Safeguard 1: No bed can have more than one active occupant
            models.UniqueConstraint(
                fields=['bed'],
                condition=models.Q(is_active=True),
                name='unique_active_bed_allocation'
            ),
            # Critical Concurrency Safeguard 2: No student can have more than one active bed
            models.UniqueConstraint(
                fields=['student'],
                condition=models.Q(is_active=True),
                name='unique_active_student_allocation'
            ),
        ]
        indexes = [
            models.Index(fields=['student', 'is_active'], name='idx_alloc_student_act'),
            models.Index(fields=['bed', 'is_active'], name='idx_alloc_bed_act'),
            models.Index(fields=['cycle', 'is_active'], name='idx_alloc_cycle_act'),
        ]

    def __str__(self):
        status_text = "ACTIVE" if self.is_active else "EXPIRED/CANCELLED"
        return f"{self.student.student_id} -> Bed {self.bed} [{status_text}]"


class AllocationHistory(models.Model):
    """Immutable audit tracking of room transfers, checkouts, and cancellations."""
    allocation = models.ForeignKey(
        Allocation,
        on_delete=models.CASCADE,
        related_name='history',
        verbose_name=_('Allocation')
    )
    action = models.CharField(
        _('Action'),
        max_length=30,
        choices=[
            ('INITIAL_ASSIGNMENT', _('Initial Assignment')),
            ('REALLOCATION', _('Reallocation / Room Transfer')),
            ('CANCELLATION', _('Cancellation')),
            ('CHECKOUT', _('End of Term Checkout')),
        ]
    )
    previous_bed = models.ForeignKey(
        'hostels.Bed',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='+'
    )
    new_bed = models.ForeignKey(
        'hostels.Bed',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='+'
    )
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, default='')

    class Meta:
        verbose_name = _('Allocation History')
        verbose_name_plural = _('Allocation History Records')
        ordering = ['-timestamp']

    def __str__(self):
        return f"Allocation #{self.allocation_id}: {self.action} at {self.timestamp}"
