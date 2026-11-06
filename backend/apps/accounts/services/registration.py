"""
Student Registration Service: Authoritative registry verification and atomic account creation.
"""
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q
from django.utils.translation import gettext_lazy as _

from apps.academics.models import StudentRegistry, EnrollmentStatus
from apps.accounts.models import Role
from apps.students.models import StudentProfile
from apps.notifications.models import Notification, NotificationType

User = get_user_model()


def verify_and_register_student(
    student_id: str,
    institutional_email: str,
    password: str,
    emergency_name: str = '',
    emergency_phone: str = '',
) -> User:
    """
    Verifies student identity against the authoritative StudentRegistry.
    Guarantees atomic creation of User and StudentProfile, updates registry claim state,
    and dispatches initial notification.

    Raises:
        ValidationError: If student record is missing, email mismatches, student is inactive,
                         or account has already been claimed.
    """
    clean_id = (student_id or '').strip()
    clean_email = (institutional_email or '').strip().lower()

    if not clean_id or not clean_email or not password:
        raise ValidationError(_('Student ID, institutional email, and password are all required.'))

    # 1. Authoritative registry verification
    try:
        registry_record = StudentRegistry.objects.get(student_id__iexact=clean_id)
    except StudentRegistry.DoesNotExist:
        raise ValidationError(_('Student ID is not recognized in the university registry.'))

    # 2. Strict institutional email match
    if registry_record.institutional_email.strip().lower() != clean_email:
        raise ValidationError(_('Institutional email does not match official university records for this Student ID.'))

    # 3. Active academic enrollment check
    if registry_record.enrollment_status != EnrollmentStatus.ACTIVE:
        raise ValidationError(_('Student enrollment is currently inactive or suspended.'))

    # 4. Prevent duplicate registrations (Rule 2 & Task 4.2)
    if registry_record.is_registered:
        raise ValidationError(_('An account has already been registered for this Student ID.'))

    if User.objects.filter(Q(email__iexact=clean_email) | Q(student_id_login__iexact=clean_id)).exists():
        raise ValidationError(_('An account with these credentials already exists.'))

    # 5. Atomic user and profile provisioning
    with transaction.atomic():
        user = User.objects.create_user(
            email=registry_record.institutional_email, # Canonical email from registry
            password=password,
            student_id_login=registry_record.student_id,
            role=Role.STUDENT,
            is_active=True
        )

        StudentProfile.objects.create(
            user=user,
            registry=registry_record,
            emergency_contact_name=emergency_name.strip() if emergency_name else None,
            emergency_contact_phone=emergency_phone.strip() if emergency_phone else None,
            profile_completed=bool(emergency_name and emergency_phone)
        )

        # Flag registry record as claimed
        registry_record.is_registered = True
        registry_record.save(update_fields=['is_registered'])

        # Welcome notification
        Notification.objects.create(
            recipient=user,
            title='Welcome to University Hostel Portal',
            message=f'Hello {registry_record.full_name}, your student account has been successfully verified and registered.',
            notification_type=NotificationType.SYSTEM
        )

    return user

