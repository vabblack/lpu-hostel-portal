"""
Unit tests for custom User model and role management in apps.accounts.
"""
import pytest
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from apps.accounts.models import Role

User = get_user_model()


@pytest.mark.django_db
class TestUserModel:
    """Test suite for custom User model creation and RBAC properties."""

    def test_create_standard_student_user(self):
        """Verify creating a standard student user."""
        user = User.objects.create_user(
            email='student1@university.edu',
            password='SecurePassword123!',
            student_id_login='STU1001',
            role=Role.STUDENT
        )
        assert user.email == 'student1@university.edu'
        assert user.student_id_login == 'STU1001'
        assert user.role == Role.STUDENT
        assert user.is_student is True
        assert user.is_admin is False
        assert user.is_warden is False
        assert user.is_active is True
        assert user.is_staff is False
        assert user.check_password('SecurePassword123!') is True

    def test_create_warden_user(self):
        """Verify creating a warden user."""
        user = User.objects.create_user(
            email='warden1@university.edu',
            password='WardenPassword123!',
            role=Role.WARDEN
        )
        assert user.is_warden is True
        assert user.is_student is False
        assert user.is_admin is False

    def test_create_superuser(self):
        """Verify creating a superuser / admin user."""
        admin_user = User.objects.create_superuser(
            email='admin@university.edu',
            password='AdminPassword123!'
        )
        assert admin_user.is_admin is True
        assert admin_user.is_staff is True
        assert admin_user.is_superuser is True
        assert admin_user.role == Role.ADMIN

    def test_email_must_be_unique(self):
        """Verify duplicate emails raise IntegrityError."""
        from django.db import transaction
        User.objects.create_user(
            email='duplicate@university.edu',
            password='Password123!'
        )
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                User.objects.create_user(
                    email='duplicate@university.edu',
                    password='AnotherPassword123!'
                )

    def test_student_id_must_be_unique(self):
        """Verify duplicate student_id_login raises IntegrityError."""
        from django.db import transaction
        User.objects.create_user(
            email='user1@university.edu',
            password='Password123!',
            student_id_login='UNIQUE_ID_1'
        )
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                User.objects.create_user(
                    email='user2@university.edu',
                    password='Password123!',
                    student_id_login='UNIQUE_ID_1'
                )
