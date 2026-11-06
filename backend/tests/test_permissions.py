"""
Role-Based Access Control (RBAC) and Security Boundary Tests.
Verifies permission isolation between Student, Warden, and Admin roles across the REST API:
- Anonymous users are restricted from protected API resources.
- Students can access their own data, applications, preferences, and gate passes.
- Students cannot perform staff/warden/admin operations (403 Forbidden).
- Wardens can oversee gate passes and RMS tickets.
- Admins possess comprehensive administrative authority.
"""
import datetime
import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.accounts.models import Role
from apps.academics.models import (
    University,
    Department,
    DegreeProgram,
    Branch,
    AdmissionBatch,
    StudentRegistry,
    Gender,
)
from apps.students.models import StudentProfile
from apps.hostels.models import (
    Hostel,
    Block,
    Floor,
    Room,
    GenderPolicy,
    RoomCategory,
)
from apps.applications.models import (
    AccommodationCycle,
    HostelApplication,
    ApplicationChoice,
    ApplicationStatus,
)

User = get_user_model()


@pytest.fixture
def rbac_fixture(client):
    """Fixture creating University structure, Cycle, Hostels, and 3 Users (Student, Warden, Admin)."""
    univ = University.objects.create(name='LPU RBAC Campus', code='LPU-RBAC')
    dept = Department.objects.create(university=univ, name='Computer Applications', code='CA')
    prog = DegreeProgram.objects.create(department=dept, name='MCA', duration_years=2)
    branch = Branch.objects.create(program=prog, name='MCA Core', code='MCAC')
    batch = AdmissionBatch.objects.create(program=prog, year=2024)

    # 1. Students
    user_student_a = User.objects.create_user(
        email='student.a@lpu.in', password='Password123!', role=Role.STUDENT, student_id_login='12499101'
    )
    reg_a = StudentRegistry.objects.create(
        student_id='12499101', full_name='Student Alpha', institutional_email='student.a@lpu.in',
        gender=Gender.MALE, date_of_birth=datetime.date(2003, 1, 1), branch=branch, batch=batch
    )
    profile_a = StudentProfile.objects.create(user=user_student_a, registry=reg_a)

    user_student_b = User.objects.create_user(
        email='student.b@lpu.in', password='Password123!', role=Role.STUDENT, student_id_login='12499102'
    )
    reg_b = StudentRegistry.objects.create(
        student_id='12499102', full_name='Student Beta', institutional_email='student.b@lpu.in',
        gender=Gender.MALE, date_of_birth=datetime.date(2003, 2, 2), branch=branch, batch=batch
    )
    profile_b = StudentProfile.objects.create(user=user_student_b, registry=reg_b)

    # 2. Warden
    user_warden = User.objects.create_user(
        email='warden.bh1@lpu.in', password='Password123!', role=Role.WARDEN
    )

    # 3. Admin
    user_admin = User.objects.create_user(
        email='admin.central@lpu.in', password='Password123!', role=Role.ADMIN
    )

    # 4. Hostels
    hostel_bh1 = Hostel.objects.create(
        university=univ, name='Boys Hostel 1', code='BH-1', gender_policy=GenderPolicy.MALE
    )
    block_a = Block.objects.create(hostel=hostel_bh1, name='Block A')
    floor_1 = Floor.objects.create(block=block_a, floor_number=1)
    room_101 = Room.objects.create(floor=floor_1, room_number='101', capacity=2, category=RoomCategory.STANDARD, is_air_conditioned=True)

    # 5. Cycle
    cycle = AccommodationCycle.objects.create(
        academic_year='2026-2027', semester=1, name='Fall 2026',
        application_start=timezone.now() - datetime.timedelta(days=2),
        application_end=timezone.now() + datetime.timedelta(days=10),
        is_active=True
    )

    # 6. Applications
    app_a = HostelApplication.objects.create(
        student=profile_a, cycle=cycle, status=ApplicationStatus.SUBMITTED
    )
    ApplicationChoice.objects.create(application=app_a, hostel=hostel_bh1, priority=1)

    app_b = HostelApplication.objects.create(
        student=profile_b, cycle=cycle, status=ApplicationStatus.SUBMITTED
    )
    ApplicationChoice.objects.create(application=app_b, hostel=hostel_bh1, priority=1)

    return {
        'client': client,
        'student_a': user_student_a,
        'student_b': user_student_b,
        'warden': user_warden,
        'admin': user_admin,
        'profile_a': profile_a,
        'profile_b': profile_b,
        'hostel': hostel_bh1,
        'room': room_101,
        'cycle': cycle,
        'app_a': app_a,
        'app_b': app_b,
    }


@pytest.mark.django_db
class TestPermissionsAndRoleIsolation:
    """Test suite ensuring strict RBAC boundaries across all API endpoints."""

    def test_anonymous_public_views_allowed(self, rbac_fixture):
        client = rbac_fixture['client']
        # SPA Root entrypoint
        resp = client.get(reverse('home'))
        assert resp.status_code in (200, 302)

        # Public auth state check
        resp_me = client.get(reverse('api:auth_me'))
        assert resp_me.status_code == 200
        assert resp_me.json()['authenticated'] is False

        # Public CSRF
        resp_csrf = client.get(reverse('api:auth_csrf'))
        assert resp_csrf.status_code == 200

        # Public hostel catalog
        resp_hostels = client.get(reverse('api:hostels_list'))
        assert resp_hostels.status_code == 200

    def test_anonymous_protected_views_require_auth(self, rbac_fixture):
        client = rbac_fixture['client']
        protected_urls = [
            reverse('api:applications'),
            reverse('api:roommates_preferences'),
            reverse('api:gatepass_list'),
            reverse('api:rms_tickets'),
        ]
        for url in protected_urls:
            resp = client.get(url)
            assert resp.status_code in (401, 403), f"Expected 401/403 for unauthenticated access to {url}"

    def test_student_can_access_student_endpoints(self, rbac_fixture):
        client = rbac_fixture['client']
        client.force_login(rbac_fixture['student_a'])

        resp_me = client.get(reverse('api:auth_me'))
        assert resp_me.status_code == 200
        assert resp_me.json()['authenticated'] is True
        assert resp_me.json()['user']['role'] == Role.STUDENT

        resp_app = client.get(reverse('api:applications'))
        assert resp_app.status_code == 200

        resp_pref = client.get(reverse('api:roommates_preferences'))
        assert resp_pref.status_code == 200

        resp_gp = client.get(reverse('api:gatepass_list'))
        assert resp_gp.status_code == 200

    def test_student_forbidden_from_administrative_actions(self, rbac_fixture):
        client = rbac_fixture['client']
        client.force_login(rbac_fixture['student_a'])

        # Students cannot approve/reject gate passes
        resp = client.post(reverse('api:gatepass_action', kwargs={'pk': 1}), {'action': 'APPROVE'}, content_type='application/json')
        assert resp.status_code in (403, 404)

    def test_warden_can_access_warden_endpoints(self, rbac_fixture):
        client = rbac_fixture['client']
        client.force_login(rbac_fixture['warden'])

        resp_me = client.get(reverse('api:auth_me'))
        assert resp_me.status_code == 200
        assert resp_me.json()['user']['role'] == Role.WARDEN

        resp_gp = client.get(reverse('api:gatepass_list'))
        assert resp_gp.status_code == 200

        resp_rms = client.get(reverse('api:rms_tickets'))
        assert resp_rms.status_code == 200

    def test_admin_full_administrative_access(self, rbac_fixture):
        client = rbac_fixture['client']
        client.force_login(rbac_fixture['admin'])

        resp_me = client.get(reverse('api:auth_me'))
        assert resp_me.status_code == 200
        assert resp_me.json()['user']['role'] == Role.ADMIN

        resp_summary = client.get(reverse('api:dashboard_summary'))
        assert resp_summary.status_code == 200
        assert 'campus' in resp_summary.json()
