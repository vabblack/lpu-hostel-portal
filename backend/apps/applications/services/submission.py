"""
Applications Submission Service: Handles atomic multi-priority application creation and status transitions.
"""
from typing import List, Dict, Any
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from apps.students.models import StudentProfile
from apps.hostels.models import Hostel, Room
from apps.notifications.models import Notification, NotificationType
from apps.applications.models import (
    AccommodationCycle,
    HostelApplication,
    ApplicationChoice,
    ApplicationStatus,
    ApplicationStatusHistory,
)
from .eligibility import check_student_eligibility, is_hostel_eligible_for_student


def submit_hostel_application(
    student: StudentProfile,
    cycle: AccommodationCycle,
    choices_data: List[Dict[str, Any]]
) -> HostelApplication:
    """
    Submits a new hostel application with up to 3 prioritized choices in an atomic transaction.

    Args:
        student: StudentProfile submitting application
        cycle: Active AccommodationCycle
        choices_data: List of dicts with keys: 'priority' (1-3), 'hostel' (Hostel instance), 'room' (optional Room instance)

    Raises:
        ValidationError: If student is ineligible, has existing application, or invalid choices.
    """
    # 1. Eligibility validation
    eligible, reason = check_student_eligibility(student, cycle)
    if not eligible:
        raise ValidationError(reason)

    # 2. Choices count validation (Rule 1: Up to 3 prioritized choices)
    if not choices_data or len(choices_data) > 3:
        raise ValidationError(_('You must specify between 1 and 3 prioritized hostel choices.'))

    # 3. Validate unique priority ranks
    priorities = [c.get('priority') for c in choices_data]
    if len(priorities) != len(set(priorities)):
        raise ValidationError(_('Each choice must have a unique priority rank (1, 2, or 3).'))

    # 4. Validate each choice
    validated_choices = []
    for item in choices_data:
        priority = item.get('priority')
        hostel = item.get('hostel')
        room = item.get('room')

        if not hostel or not isinstance(hostel, Hostel):
            raise ValidationError(_(f'A valid hostel is required for choice #{priority}.'))

        if hostel.status != 'ACTIVE':
            raise ValidationError(_(f'Hostel {hostel.name} is not currently accepting applications.'))

        # Enforce gender policy
        if not is_hostel_eligible_for_student(student, hostel):
            raise ValidationError(
                _(f'Hostel {hostel.name} ({hostel.get_gender_policy_display()}) is not eligible for your profile.')
            )

        if room:
            if not isinstance(room, Room):
                raise ValidationError(_('Invalid room selection.'))
            if room.floor.block.hostel_id != hostel.id:
                raise ValidationError(_(f'Room {room.room_number} does not belong to hostel {hostel.name}.'))

        validated_choices.append({
            'priority': priority,
            'hostel': hostel,
            'room': room,
        })

    # 5. Atomic transaction execution
    with transaction.atomic():
        application = HostelApplication.objects.create(
            student=student,
            cycle=cycle,
            status=ApplicationStatus.SUBMITTED
        )

        for choice in validated_choices:
            ApplicationChoice.objects.create(
                application=application,
                hostel=choice['hostel'],
                room=choice['room'],
                priority=choice['priority']
            )

        ApplicationStatusHistory.objects.create(
            application=application,
            from_status='DRAFT',
            to_status=ApplicationStatus.SUBMITTED,
            notes='Initial student application submitted.'
        )

        Notification.objects.create(
            recipient=student.user,
            title='Application Received',
            message=f'Your hostel application #{application.id} for {cycle.name} was successfully submitted.',
            notification_type=NotificationType.APPLICATION
        )

    return application


def update_application_status(
    application: HostelApplication,
    new_status: str,
    changed_by,
    notes: str = ''
) -> HostelApplication:
    """
    Transitions application status, records immutable history, and alerts the applicant.
    """
    if new_status not in ApplicationStatus.values:
        raise ValidationError(_(f'Invalid application status: {new_status}'))

    old_status = application.status

    with transaction.atomic():
        application.status = new_status
        application.reviewed_by = changed_by
        application.reviewed_at = timezone.now()
        application.review_notes = notes
        application.save(update_fields=['status', 'reviewed_by', 'reviewed_at', 'review_notes'])

        ApplicationStatusHistory.objects.create(
            application=application,
            from_status=old_status,
            to_status=new_status,
            changed_by=changed_by,
            notes=notes
        )

        # Notify student
        Notification.objects.create(
            recipient=application.student.user,
            title=f'Application Status: {application.get_status_display()}',
            message=f'Your application #{application.id} status was updated to {application.get_status_display()}. Notes: {notes or "None"}',
            notification_type=NotificationType.APPLICATION
        )

    return application
