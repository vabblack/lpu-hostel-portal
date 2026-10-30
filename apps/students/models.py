"""
Students Models: StudentProfile linking authenticated User to authoritative StudentRegistry.
"""
from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class StudentProfile(models.Model):
    """
    Student profile linked to the User account and the authoritative StudentRegistry record.
    Created automatically when a verified student claims their account.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='student_profile',
        verbose_name=_('User Account')
    )
    registry = models.OneToOneField(
        'academics.StudentRegistry',
        on_delete=models.PROTECT,
        related_name='profile',
        verbose_name=_('Official Registry Record')
    )
    emergency_contact_name = models.CharField(
        _('Emergency Contact Name'),
        max_length=150,
        blank=True,
        null=True
    )
    emergency_contact_phone = models.CharField(
        _('Emergency Contact Phone'),
        max_length=20,
        blank=True,
        null=True
    )
    bio = models.TextField(
        _('Personal Bio'),
        blank=True,
        default=''
    )
    profile_completed = models.BooleanField(
        _('Profile Completed'),
        default=False,
        db_index=True,
        help_text=_('True if mandatory profile fields and preferences have been supplied.')
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Student Profile')
        verbose_name_plural = _('Student Profiles')
        ordering = ['registry__student_id']

    def __str__(self):
        return f"Profile of {self.registry.student_id} - {self.registry.full_name}"

    @property
    def student_id(self) -> str:
        """Convenience property for accessing student registration number."""
        return self.registry.student_id

    @property
    def full_name(self) -> str:
        """Convenience property for accessing full legal name."""
        return self.registry.full_name

    @property
    def gender(self) -> str:
        """Convenience property for accessing verified gender for hostel eligibility."""
        return self.registry.gender

    @property
    def institutional_email(self) -> str:
        """Convenience property for institutional email."""
        return self.registry.institutional_email
