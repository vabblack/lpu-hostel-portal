"""
Accounts Models: Custom User and RBAC Role Definitions.
"""
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from .managers import UserManager


class Role(models.TextChoices):
    """System-wide operational roles for authorization."""
    ADMIN = 'ADMIN', _('University Administrator')
    WARDEN = 'WARDEN', _('Hostel Warden')
    STUDENT = 'STUDENT', _('Student')


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model for authentication across all university actors.
    Primary identifier is email. Students may also log in via student_id_login.
    """
    email = models.EmailField(
        _('Email Address'),
        unique=True,
        db_index=True,
        max_length=254,
        error_messages={'unique': _('A user with that email already exists.')}
    )
    student_id_login = models.CharField(
        _('Student ID (Login)'),
        max_length=32,
        unique=True,
        null=True,
        blank=True,
        db_index=True,
        help_text=_('Linked Student ID used for direct student login.')
    )
    role = models.CharField(
        _('Role'),
        max_length=20,
        choices=Role.choices,
        default=Role.STUDENT,
        db_index=True
    )
    is_active = models.BooleanField(
        _('Active'),
        default=True,
        help_text=_('Designates whether this account should be treated as active.')
    )
    is_staff = models.BooleanField(
        _('Staff Status'),
        default=False,
        help_text=_('Designates whether the user can log into the Django admin site.')
    )
    date_joined = models.DateTimeField(
        _('Date Joined'),
        default=timezone.now
    )

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = _('User')
        verbose_name_plural = _('Users')
        ordering = ['-date_joined']

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"

    @property
    def is_admin(self) -> bool:
        """Check if user is a University Administrator."""
        return self.role == Role.ADMIN or self.is_superuser

    @property
    def is_warden(self) -> bool:
        """Check if user is a Hostel Warden."""
        return self.role == Role.WARDEN

    @property
    def is_student(self) -> bool:
        """Check if user is a Student."""
        return self.role == Role.STUDENT
