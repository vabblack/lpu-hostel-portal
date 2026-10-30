"""
Applications Eligibility Service: Validates intake cycles, student eligibility, and gender rules.
"""
from typing import Tuple, Optional
from django.utils import timezone
from apps.academics.models import EnrollmentStatus
from apps.students.models import StudentProfile
from apps.hostels.models import Hostel, GenderPolicy
from apps.applications.models import AccommodationCycle, HostelApplication, ApplicationStatus


def get_active_cycle() -> Optional[AccommodationCycle]:
    """
    Returns the currently active accommodation cycle where the current time
    falls within the application_start and application_end window.
    """
    now = timezone.now()
    return AccommodationCycle.objects.filter(
        is_active=True,
        application_start__lte=now,
        application_end__gte=now
    ).first()


def is_hostel_eligible_for_student(student: StudentProfile, hostel: Hostel) -> bool:
    """
    Enforces university gender segregation policy.
    MALE students -> Boys Hostel or Co-Ed
    FEMALE students -> Girls Hostel or Co-Ed
    """
    if hostel.gender_policy == GenderPolicy.CO_ED:
        return True

    return student.gender == hostel.gender_policy


def check_student_eligibility(
    student: StudentProfile,
    cycle: AccommodationCycle
) -> Tuple[bool, str]:
    """
    Validates whether a student is eligible to apply in the specified accommodation cycle.

    Enforces:
    1. Active academic enrollment.
    2. Exactly one application per cycle rule (Rule 6).
    """
    # 1. Enrollment status verification
    if student.registry.enrollment_status != EnrollmentStatus.ACTIVE:
        return False, "Your academic enrollment status is not currently active."

    # 2. Rule 6: Exactly one active application per cycle
    existing_app = HostelApplication.objects.filter(
        student=student,
        cycle=cycle
    ).exclude(
        status__in=[ApplicationStatus.CANCELLED, ApplicationStatus.REJECTED]
    ).first()

    if existing_app:
        return False, f"You already have an active application (#{existing_app.id}) submitted for {cycle.name}."

    return True, "Eligible"
