"""
Academics Models: University academic hierarchy and authoritative student registry.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _


class Gender(models.TextChoices):
    """Gender choices for student registration and hostel eligibility."""
    MALE = 'MALE', _('Male')
    FEMALE = 'FEMALE', _('Female')
    OTHER = 'OTHER', _('Other')


class EnrollmentStatus(models.TextChoices):
    """Academic enrollment status."""
    ACTIVE = 'ACTIVE', _('Active')
    SUSPENDED = 'SUSPENDED', _('Suspended')
    ALUMNI = 'ALUMNI', _('Alumni')
    WITHDRAWN = 'WITHDRAWN', _('Withdrawn')


class University(models.Model):
    """Top-level academic and institutional entity."""
    name = models.CharField(_('University Name'), max_length=200, unique=True)
    code = models.CharField(_('University Code'), max_length=30, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('University')
        verbose_name_plural = _('Universities')
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class Department(models.Model):
    """School or academic department within a university."""
    university = models.ForeignKey(
        University,
        on_delete=models.CASCADE,
        related_name='departments',
        verbose_name=_('University')
    )
    name = models.CharField(_('Department Name'), max_length=150)
    code = models.CharField(_('Department Code'), max_length=30)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Department')
        verbose_name_plural = _('Departments')
        unique_together = ('university', 'code')
        ordering = ['university', 'name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class DegreeProgram(models.Model):
    """Academic degree program (e.g., B.Tech, M.Tech, MBA)."""
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name='programs',
        verbose_name=_('Department')
    )
    name = models.CharField(_('Program Name'), max_length=150)
    duration_years = models.PositiveSmallIntegerField(
        _('Duration (Years)'),
        default=4,
        help_text=_('Standard duration in years.')
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Degree Program')
        verbose_name_plural = _('Degree Programs')
        unique_together = ('department', 'name')
        ordering = ['department', 'name']

    def __str__(self):
        return f"{self.name} - {self.department.code}"


class Branch(models.Model):
    """Academic specialization or branch under a degree program."""
    program = models.ForeignKey(
        DegreeProgram,
        on_delete=models.CASCADE,
        related_name='branches',
        verbose_name=_('Degree Program')
    )
    name = models.CharField(_('Branch Name'), max_length=150)
    code = models.CharField(_('Branch Code'), max_length=30)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Branch')
        verbose_name_plural = _('Branches')
        unique_together = ('program', 'code')
        ordering = ['program', 'name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class AdmissionBatch(models.Model):
    """Cohort of students admitted in a specific academic year."""
    program = models.ForeignKey(
        DegreeProgram,
        on_delete=models.CASCADE,
        related_name='batches',
        verbose_name=_('Degree Program')
    )
    year = models.PositiveIntegerField(
        _('Admission Year'),
        help_text=_('Year of intake (e.g., 2024).')
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Admission Batch')
        verbose_name_plural = _('Admission Batches')
        unique_together = ('program', 'year')
        ordering = ['-year', 'program']

    def __str__(self):
        return f"Batch {self.year} - {self.program.name}"


class StudentRegistry(models.Model):
    """
    Authoritative student registry pre-populated by university administration.
    Used to verify student identity prior to account registration.
    """
    student_id = models.CharField(
        _('Student ID / Registration Number'),
        max_length=32,
        unique=True,
        db_index=True,
        help_text=_('Official university-issued student identification number.')
    )
    full_name = models.CharField(_('Full Legal Name'), max_length=150)
    institutional_email = models.EmailField(
        _('Institutional Email'),
        unique=True,
        db_index=True,
        help_text=_('Official university-provided email address.')
    )
    gender = models.CharField(
        _('Gender'),
        max_length=10,
        choices=Gender.choices,
        help_text=_('Official recorded gender, used for hostel policy enforcement.')
    )
    date_of_birth = models.DateField(_('Date of Birth'))
    phone_number = models.CharField(
        _('Contact Phone Number'),
        max_length=20,
        blank=True,
        null=True
    )
    branch = models.ForeignKey(
        Branch,
        on_delete=models.PROTECT,
        related_name='registry_students',
        verbose_name=_('Academic Branch')
    )
    batch = models.ForeignKey(
        AdmissionBatch,
        on_delete=models.PROTECT,
        related_name='registry_students',
        verbose_name=_('Admission Batch')
    )
    is_registered = models.BooleanField(
        _('Account Claimed'),
        default=False,
        db_index=True,
        help_text=_('True if a User account has successfully registered against this student record.')
    )
    enrollment_status = models.CharField(
        _('Enrollment Status'),
        max_length=20,
        choices=EnrollmentStatus.choices,
        default=EnrollmentStatus.ACTIVE,
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Student Registry Record')
        verbose_name_plural = _('Student Registry Records')
        ordering = ['student_id']
        indexes = [
            models.Index(fields=['student_id', 'institutional_email'], name='idx_reg_id_email'),
            models.Index(fields=['enrollment_status', 'is_registered'], name='idx_reg_status_reg'),
        ]

    def __str__(self):
        return f"{self.student_id} - {self.full_name}"


class StudentEnrollment(models.Model):
    """
    Tracks the current active academic year and semester for a student.
    Ensures eligibility checks match the active term.
    """
    registry = models.ForeignKey(
        StudentRegistry,
        on_delete=models.CASCADE,
        related_name='enrollments',
        verbose_name=_('Student Registry Record')
    )
    academic_year = models.CharField(
        _('Academic Year'),
        max_length=20,
        help_text=_('E.g., 2026-2027.')
    )
    semester = models.PositiveSmallIntegerField(
        _('Semester'),
        help_text=_('Current enrolled semester number (1-12).')
    )
    status = models.CharField(
        _('Term Status'),
        max_length=20,
        default='CURRENT',
        choices=[
            ('CURRENT', _('Current')),
            ('COMPLETED', _('Completed')),
            ('BACKLOG', _('Backlog / Pending')),
        ]
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Student Enrollment Term')
        verbose_name_plural = _('Student Enrollment Terms')
        unique_together = ('registry', 'academic_year', 'semester')
        ordering = ['-academic_year', '-semester']

    def __str__(self):
        return f"{self.registry.student_id} - Year {self.academic_year} (Sem {self.semester})"
