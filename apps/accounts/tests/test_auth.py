"""
Unit and Integration Tests for Authentication, Registration Verification, and RBAC in apps.accounts.
"""
import datetime
import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError, PermissionDenied
from django.test import RequestFactory
from django.urls import reverse

from apps.accounts.models import Role
from apps.accounts.services.registration import verify_and_register_student
from apps.accounts.decorators import admin_required, student_required, warden_required
from apps.academics.models import (
    University,
    Department,
    DegreeProgram,
    Branch,
    AdmissionBatch,
    StudentRegistry,
    Gender,
    EnrollmentStatus,
)
from apps.students.models import StudentProfile
from apps.hostels.models import Hostel, WardenAssignment, GenderPolicy
from apps.hostels.services.scoping import get_warden_assigned_hostel_ids, can_warden_manage_hostel

User = get_user_model()


@pytest.mark.django_db
class TestAuthenticationAndVerification:
    """Test suite for student registration verification, dual login, and RBAC."""

    @pytest.fixture
    def registry_setup(self):
        """Fixture providing academic structure and registry records."""
        univ = University.objects.create(name='LPU Auth Univ', code='LPU-AU')
        dept = Department.objects.create(university=univ, name='CSE', code='CS')
        prog = DegreeProgram.objects.create(department=dept, name='B.Tech', duration_years=4)
        branch = Branch.objects.create(program=prog, name='CSE', code='CSE')
        batch = AdmissionBatch.objects.create(program=prog, year=2024)

        active_student = StudentRegistry.objects.create(
            student_id='12499001',
            full_name='Active Enrolled Student',
            institutional_email='active.student@lpu.in',
            gender=Gender.MALE,
            date_of_birth=datetime.date(2004, 5, 10),
            branch=branch,
            batch=batch,
            enrollment_status=EnrollmentStatus.ACTIVE,
            is_registered=False
        )

        suspended_student = StudentRegistry.objects.create(
            student_id='12499002',
            full_name='Suspended Student',
            institutional_email='suspended.student@lpu.in',
            gender=Gender.FEMALE,
            date_of_birth=datetime.date(2004, 8, 15),
            branch=branch,
            batch=batch,
            enrollment_status=EnrollmentStatus.SUSPENDED,
            is_registered=False
        )

        return {
            'univ': univ,
            'active_student': active_student,
            'suspended_student': suspended_student,
        }

    def test_student_registration_success(self, registry_setup):
        """Verify successful student verification, User creation, and StudentProfile link."""
        student_reg = registry_setup['active_student']

        user = verify_and_register_student(
            student_id='12499001',
            institutional_email='active.student@lpu.in',
            password='ValidPassword123!',
            emergency_name='Guardian Name',
            emergency_phone='9876543210'
        )

        assert user.email == 'active.student@lpu.in'
        assert user.student_id_login == '12499001'
        assert user.role == Role.STUDENT
        assert user.is_active is True

        # Check linked StudentProfile
        profile = user.student_profile
        assert profile.registry == student_reg
        assert profile.emergency_contact_name == 'Guardian Name'
        assert profile.profile_completed is True

        # Check registry record flagged as claimed
        student_reg.refresh_from_db()
        assert student_reg.is_registered is True

    def test_student_registration_duplicate_rejected(self, registry_setup):
        """Rule 2: Prevent duplicate accounts for the same Student ID."""
        verify_and_register_student(
            student_id='12499001',
            institutional_email='active.student@lpu.in',
            password='PasswordOne123!'
        )

        # Attempting second registration must fail
        with pytest.raises(ValidationError) as exc_info:
            verify_and_register_student(
                student_id='12499001',
                institutional_email='active.student@lpu.in',
                password='PasswordTwo123!'
            )
        assert 'already been registered' in str(exc_info.value)

    def test_student_registration_email_mismatch_rejected(self, registry_setup):
        """Verify registration fails if email does not match official registry."""
        with pytest.raises(ValidationError) as exc_info:
            verify_and_register_student(
                student_id='12499001',
                institutional_email='fraudulent.email@other.com',
                password='Password123!'
            )
        assert 'does not match official university records' in str(exc_info.value)

    def test_student_registration_suspended_rejected(self, registry_setup):
        """Verify registration fails if student status is inactive or suspended."""
        with pytest.raises(ValidationError) as exc_info:
            verify_and_register_student(
                student_id='12499002',
                institutional_email='suspended.student@lpu.in',
                password='Password123!'
            )
        assert 'inactive or suspended' in str(exc_info.value)

    def test_dual_login_email_and_student_id(self, registry_setup, client):
        """Verify student can log in via either institutional email or Student ID."""
        verify_and_register_student(
            student_id='12499001',
            institutional_email='active.student@lpu.in',
            password='ValidPassword123!'
        )

        # 1. Login with Institutional Email
        response_email = client.post(reverse('accounts:login'), {
            'username': 'active.student@lpu.in',
            'password': 'ValidPassword123!'
        })
        assert response_email.status_code == 302
        client.logout()

        # 2. Login with Student ID
        response_id = client.post(reverse('accounts:login'), {
            'username': '12499001',
            'password': 'ValidPassword123!'
        })
        assert response_id.status_code == 302

    def test_login_invalid_credentials(self, client):
        """Verify invalid credentials return error."""
        response = client.post(reverse('accounts:login'), {
            'username': 'nonexistent@lpu.in',
            'password': 'WrongPassword123!'
        })
        assert response.status_code == 200
        assert 'Invalid credentials' in response.content.decode()

    def test_logout(self, registry_setup, client):
        """Verify user logout clears session."""
        verify_and_register_student(
            student_id='12499001',
            institutional_email='active.student@lpu.in',
            password='ValidPassword123!'
        )
        client.login(username='12499001', password='ValidPassword123!')
        response = client.get(reverse('accounts:logout'))
        assert response.status_code == 302
        assert response.url == reverse('accounts:login')

    def test_rbac_admin_required_decorator(self):
        """Verify @admin_required rejects non-admin users."""
        factory = RequestFactory()

        @admin_required
        def dummy_admin_view(request):
            return "SUCCESS"

        # Student user trying to access admin view
        student_user = User(email='s@lpu.in', role=Role.STUDENT, is_active=True)
        request = factory.get('/admin-only/')
        request.user = student_user

        with pytest.raises(PermissionDenied):
            dummy_admin_view(request)

        # Admin user succeeds
        admin_user = User(email='a@lpu.in', role=Role.ADMIN, is_active=True)
        request.user = admin_user
        assert dummy_admin_view(request) == "SUCCESS"

    def test_warden_hostel_scoping(self, registry_setup):
        """Verify Warden scoping only returns assigned hostels."""
        univ = registry_setup['univ']
        h1 = Hostel.objects.create(university=univ, name='Hostel 1', code='H1', gender_policy=GenderPolicy.MALE)
        h2 = Hostel.objects.create(university=univ, name='Hostel 2', code='H2', gender_policy=GenderPolicy.MALE)

        warden = User.objects.create_user(email='warden@lpu.in', password='Password123!', role=Role.WARDEN)
        admin = User.objects.create_superuser(email='chief@lpu.in', password='Password123!')

        # Assign warden to H1 only
        WardenAssignment.objects.create(user=warden, hostel=h1, is_active=True)

        warden_hostels = get_warden_assigned_hostel_ids(warden)
        assert warden_hostels == [h1.id]
        assert can_warden_manage_hostel(warden, h1) is True
        assert can_warden_manage_hostel(warden, h2) is False

        # Admin receives all hostels
        admin_hostels = get_warden_assigned_hostel_ids(admin)
        assert h1.id in admin_hostels
        assert h2.id in admin_hostels
        assert can_warden_manage_hostel(admin, h2) is True

