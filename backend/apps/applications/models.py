"""
Applications Models: Accommodation cycles, multi-choice applications, and status history.
"""
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _


class ApplicationStatus(models.TextChoices):
    """Lifecycle states of a hostel accommodation application."""
    DRAFT = 'DRAFT', _('Draft')
    SUBMITTED = 'SUBMITTED', _('Submitted')
    UNDER_REVIEW = 'UNDER_REVIEW', _('Under Review')
    APPROVED = 'APPROVED', _('Approved')
    ALLOCATED = 'ALLOCATED', _('Allocated')
    WAITLISTED = 'WAITLISTED', _('Waitlisted')
    REJECTED = 'REJECTED', _('Rejected')
    CANCELLED = 'CANCELLED', _('Cancelled')


class AccommodationCycle(models.Model):
    """Time-bounded accommodation intake cycle (e.g., 2026-2027 Academic Year)."""
    academic_year = models.CharField(_('Academic Year'), max_length=20) # e.g. '2026-2027'
    semester = models.PositiveSmallIntegerField(_('Semester'), default=1)
    name = models.CharField(_('Cycle Name'), max_length=100) # e.g., 'Fall 2026 Hostel Intake'
    application_start = models.DateTimeField(_('Application Start Date/Time'))
    application_end = models.DateTimeField(_('Application End Date/Time'))
    is_active = models.BooleanField(
        _('Active Cycle'),
        default=False,
        help_text=_('Only one cycle should be active for student application submissions.')
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Accommodation Cycle')
        verbose_name_plural = _('Accommodation Cycles')
        ordering = ['-application_start']

    def __str__(self):
        status_flag = " (ACTIVE)" if self.is_active else ""
        return f"{self.name} [{self.academic_year} Sem {self.semester}]{status_flag}"


class HostelApplication(models.Model):
    """
    Student application for hostel accommodation in an active cycle.
    Enforces exactly one application per student per accommodation cycle.
    """
    student = models.ForeignKey(
        'students.StudentProfile',
        on_delete=models.CASCADE,
        related_name='applications',
        verbose_name=_('Student')
    )
    cycle = models.ForeignKey(
        AccommodationCycle,
        on_delete=models.CASCADE,
        related_name='applications',
        verbose_name=_('Accommodation Cycle')
    )
    status = models.CharField(
        _('Application Status'),
        max_length=20,
        choices=ApplicationStatus.choices,
        default=ApplicationStatus.SUBMITTED,
        db_index=True
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_applications',
        verbose_name=_('Reviewed By')
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(_('Review Notes'), blank=True, default='')

    class Meta:
        verbose_name = _('Hostel Application')
        verbose_name_plural = _('Hostel Applications')
        unique_together = ('student', 'cycle') # Rule 6: Exactly one application per cycle
        ordering = ['-submitted_at']
        indexes = [
            models.Index(fields=['cycle', 'status'], name='idx_app_cycle_status'),
            models.Index(fields=['student', 'cycle'], name='idx_app_student_cycle'),
        ]

    def __str__(self):
        return f"App #{self.id}: {self.student.student_id} - {self.cycle.name} ({self.get_status_display()})"


class ApplicationChoice(models.Model):
    """
    Prioritized hostel/room selection (up to 3 prioritized choices per application).
    """
    application = models.ForeignKey(
        HostelApplication,
        on_delete=models.CASCADE,
        related_name='choices',
        verbose_name=_('Application')
    )
    hostel = models.ForeignKey(
        'hostels.Hostel',
        on_delete=models.CASCADE,
        related_name='application_choices',
        verbose_name=_('Preferred Hostel')
    )
    room = models.ForeignKey(
        'hostels.Room',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='application_choices',
        verbose_name=_('Preferred Room')
    )
    priority = models.PositiveSmallIntegerField(
        _('Priority Rank'),
        choices=[(1, _('1st Preference')), (2, _('2nd Preference')), (3, _('3rd Preference'))],
        help_text=_('1 = Highest priority preference.')
    )

    class Meta:
        verbose_name = _('Application Choice')
        verbose_name_plural = _('Application Choices')
        unique_together = ('application', 'priority') # Cannot have duplicate ranks
        ordering = ['application', 'priority']

    def __str__(self):
        room_info = f", Room {self.room.room_number}" if self.room else ""
        return f"Rank {self.priority}: {self.hostel.code}{room_info}"


class ApplicationStatusHistory(models.Model):
    """Audit record tracking every state change for an application."""
    application = models.ForeignKey(
        HostelApplication,
        on_delete=models.CASCADE,
        related_name='status_history',
        verbose_name=_('Application')
    )
    from_status = models.CharField(max_length=20)
    to_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_('Changed By')
    )
    changed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, default='')

    class Meta:
        verbose_name = _('Application Status History')
        verbose_name_plural = _('Application Status History Records')
        ordering = ['-changed_at']

    def __str__(self):
        return f"App #{self.application_id}: {self.from_status} -> {self.to_status} at {self.changed_at}"
