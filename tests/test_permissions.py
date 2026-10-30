"""
Security & Role-Based Access Control (RBAC) Test Suite.
Verifies role isolation, backend permission checks, object-level privacy boundaries,
and unauthorized access rejection across all system endpoints.
"""
import datetime
import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.accounts.models import Role
from apps.academics.models import University, Department, DegreeProgram, Branch, AdmissionBatch, StudentRegistry, Gender
from apps.students.models import StudentProfile
from apps.hostels.models import Hostel, Block, Floor, Room, Bed, BedStatus, GenderPolicy, WardenAssignment
from apps.applications.models import AccommodationCycle, HostelApplication, ApplicationStatus, ApplicationChoice

User = get_user_model()


@pytest.mark.django_db
class TestPermissionsAndRoleIsolation:
    """Rigorous RBAC and isolation testing across Student, Warden, and Admin roles."""

    @pytest.fixture
    def rbac_fixture(self, client):
        univ = University.objects.create(name='LPU Main Campus', code='LPU-RBAC')
        dept = Department.objects.create(university=univ, name='School of Technology', code='TECH')
        prog = DegreeProgram.objects.create(department=dept, name='B.Tech CSE', duration_years=4)
        branch = Branch.objects.create(program=prog, name='Computer Science', code='CSE')
        batch = AdmissionBatch.objects.create(program=prog, year=2024)

        # 1. Student A
        user_student_a = User.objects.create_user(
            email='student_a@lpu.in', password='Password123!', role=Role.STUDENT, student_id_login='RBAC001'
        )
        reg_a = StudentRegistry.objects.create(
            student_id='RBAC001', full_name='Student Alpha', institutional_email='student_a@lpu.in',
            gender=Gender.MALE, date_of_birth=datetime.date(2004, 1, 1), branch=branch, batch=batch
        )
        profile_a = StudentProfile.objects.create(user=user_student_a, registry=reg_a)

        # 2. Student B
        user_student_b = User.objects.create_user(
            email='student_b@lpu.in', password='Password123!', role=Role.STUDENT, student_id_login='RBAC002'
        )
        reg_b = StudentRegistry.objects.create(
            student_id='RBAC002', full_name='Student Beta', institutional_email='student_b@lpu.in',
            gender=Gender.MALE, date_of_birth=datetime.date(2004, 2, 2), branch=branch, batch=batch
        )
        profile_b = StudentProfile.objects.create(user=user_student_b, registry=reg_b)

        # 3. Student C (Eligible, has not submitted application yet)
        user_student_c = User.objects.create_user(
            email='student_c@lpu.in', password='Password123!', role=Role.STUDENT, student_id_login='RBAC003'
        )
        reg_c = StudentRegistry.objects.create(
            student_id='RBAC003', full_name='Student Gamma', institutional_email='student_c@lpu.in',
            gender=Gender.MALE, date_of_birth=datetime.date(2004, 3, 3), branch=branch, batch=batch
        )
        profile_c = StudentProfile.objects.create(user=user_student_c, registry=reg_c)

        # 4. Warden
        user_warden = User.objects.create_user(
            email='warden_rbac@lpu.in', password='Password123!', role=Role.WARDEN
        )

        # 4. Admin
        user_admin = User.objects.create_user(
            email='admin_rbac@lpu.in', password='Password123!', role=Role.ADMIN, is_staff=True
        )

        # Cycle
        cycle = AccommodationCycle.objects.create(
            academic_year='2026-2027', semester=1, name='Fall 2026',
            application_start=timezone.now() - datetime.timedelta(days=1),
            application_end=timezone.now() + datetime.timedelta(days=15),
            is_active=True
        )

        # Hostel & Warden assignment
        hostel = Hostel.objects.create(university=univ, name='Hostel RBAC', code='HRBAC', gender_policy=GenderPolicy.MALE)
        block = Block.objects.create(hostel=hostel, name='Block 1')
        floor = Floor.objects.create(block=block, floor_number=1)
        room = Room.objects.create(floor=floor, room_number='101', capacity=2)
        bed = Bed.objects.create(room=room, bed_identifier='A', status=BedStatus.VACANT)
        WardenAssignment.objects.create(user=user_warden, hostel=hostel, is_active=True)

        # Applications for Student A and Student B
        app_a = HostelApplication.objects.create(student=profile_a, cycle=cycle, status=ApplicationStatus.SUBMITTED)
        ApplicationChoice.objects.create(application=app_a, hostel=hostel, priority=1, room=room)

        app_b = HostelApplication.objects.create(student=profile_b, cycle=cycle, status=ApplicationStatus.SUBMITTED)
        ApplicationChoice.objects.create(application=app_b, hostel=hostel, priority=1, room=room)

        return {
            'client': client,
            'student_a': user_student_a,
            'student_b': user_student_b,
            'student_c': user_student_c,
            'warden': user_warden,
            'admin': user_admin,
            'app_a': app_a,
            'app_b': app_b,
            'hostel': hostel,
        }

    # =========================================================================
    # 1. Unauthenticated Anonymous Access Tests
    # =========================================================================

    def test_anonymous_public_views_allowed(self, rbac_fixture):
        client = rbac_fixture['client']
        # Home
        resp = client.get(reverse('home'))
        assert resp.status_code == 200

        # Login and Register
        resp_login = client.get(reverse('accounts:login'))
        assert resp_login.status_code == 200
        resp_reg = client.get(reverse('accounts:register'))
        assert resp_reg.status_code == 200

        # Public hostel catalog
        resp_hostels = client.get(reverse('hostels:list'))
        assert resp_hostels.status_code == 200

    def test_anonymous_protected_views_redirect_to_login(self, rbac_fixture):
        client = rbac_fixture['client']
        protected_urls = [
            reverse('applications:apply'),
            reverse('applications:queue'),
            reverse('roommates:preferences'),
            reverse('roommates:discover'),
            reverse('roommates:requests'),
            reverse('hostels:occupancy_report'),
            reverse('hostels:analytics_dashboard'),
            reverse('hostels:export_occupancy_csv'),
            reverse('notifications:list'),
        ]
        for url in protected_urls:
            resp = client.get(url)
            assert resp.status_code == 302, f"Expected 302 redirect for unauthenticated access to {url}"
            assert '/accounts/login/' in resp.url

    # =========================================================================
    # 2. Student Role Isolation Tests
    # =========================================================================

    def test_student_can_access_student_endpoints(self, rbac_fixture):
        client = rbac_fixture['client']

        # Student C (eligible without prior application) can load application form (200)
        client.force_login(rbac_fixture['student_c'])
        resp_apply = client.get(reverse('applications:apply'))
        assert resp_apply.status_code == 200

        # Student A (already applied) accessing apply redirects (302) to their existing application
        client.force_login(rbac_fixture['student_a'])
        resp_reapply = client.get(reverse('applications:apply'))
        assert resp_reapply.status_code == 302
        assert reverse('applications:detail', kwargs={'pk': rbac_fixture['app_a'].pk}) in resp_reapply.url

        # Other student endpoints return 200
        student_urls = [
            reverse('roommates:preferences'),
            reverse('roommates:discover'),
            reverse('roommates:requests'),
            reverse('notifications:list'),
        ]
        for url in student_urls:
            resp = client.get(url)
            assert resp.status_code == 200, f"Student should access {url} with 200"

    def test_student_forbidden_from_administrative_endpoints(self, rbac_fixture):
        client = rbac_fixture['client']
        client.force_login(rbac_fixture['student_a'])

        admin_urls = [
            reverse('applications:queue'),
            reverse('hostels:occupancy_report'),
            reverse('hostels:analytics_dashboard'),
            reverse('hostels:export_occupancy_csv'),
        ]
        for url in admin_urls:
            resp = client.get(url)
            assert resp.status_code == 403, f"Student must receive 403 Forbidden on {url}"

    def test_student_forbidden_from_review_actions(self, rbac_fixture):
        client = rbac_fixture['client']
        client.force_login(rbac_fixture['student_a'])

        app_b = rbac_fixture['app_b']
        resp = client.post(reverse('applications:review_action', kwargs={'pk': app_b.pk}), {
            'status': ApplicationStatus.APPROVED,
            'notes': 'Malicious student approval attempt'
        })
        assert resp.status_code == 403

    def test_student_object_level_application_privacy(self, rbac_fixture):
        """Student A can view own application, but is forbidden (403) from Student B's application."""
        client = rbac_fixture['client']
        client.force_login(rbac_fixture['student_a'])

        # Own application -> 200
        app_a = rbac_fixture['app_a']
        resp_own = client.get(reverse('applications:detail', kwargs={'pk': app_a.pk}))
        assert resp_own.status_code == 200

        # Other student's application -> 403
        app_b = rbac_fixture['app_b']
        resp_other = client.get(reverse('applications:detail', kwargs={'pk': app_b.pk}))
        assert resp_other.status_code == 403

    # =========================================================================
    # 3. Warden Role Isolation Tests
    # =========================================================================

    def test_warden_can_access_warden_endpoints(self, rbac_fixture):
        client = rbac_fixture['client']
        client.force_login(rbac_fixture['warden'])

        warden_urls = [
            reverse('applications:queue'),
            reverse('hostels:occupancy_report'),
            reverse('hostels:analytics_dashboard'),
            reverse('hostels:export_occupancy_csv'),
            reverse('notifications:list'),
        ]
        for url in warden_urls:
            resp = client.get(url)
            assert resp.status_code == 200, f"Warden should access {url} with 200"

    def test_warden_forbidden_from_student_specific_flows(self, rbac_fixture):
        """Wardens cannot apply for accommodation or submit roommate preferences."""
        client = rbac_fixture['client']
        client.force_login(rbac_fixture['warden'])

        student_exclusive_urls = [
            reverse('applications:apply'),
            reverse('roommates:preferences'),
            reverse('roommates:discover'),
            reverse('roommates:requests'),
        ]
        for url in student_exclusive_urls:
            resp = client.get(url)
            assert resp.status_code == 403, f"Warden must receive 403 Forbidden on student endpoint {url}"

    def test_warden_can_view_applicant_details(self, rbac_fixture):
        """Warden can inspect applicant details for reviewing."""
        client = rbac_fixture['client']
        client.force_login(rbac_fixture['warden'])

        app_a = rbac_fixture['app_a']
        resp = client.get(reverse('applications:detail', kwargs={'pk': app_a.pk}))
        assert resp.status_code == 200

    # =========================================================================
    # 4. Admin Role Authority Tests
    # =========================================================================

    def test_admin_full_administrative_access(self, rbac_fixture):
        client = rbac_fixture['client']
        client.force_login(rbac_fixture['admin'])

        admin_urls = [
            reverse('applications:queue'),
            reverse('hostels:occupancy_report'),
            reverse('hostels:analytics_dashboard'),
            reverse('hostels:export_occupancy_csv'),
            reverse('notifications:list'),
        ]
        for url in admin_urls:
            resp = client.get(url)
            assert resp.status_code == 200, f"Admin must have 200 access on {url}"

    def test_admin_can_view_any_application(self, rbac_fixture):
        client = rbac_fixture['client']
        client.force_login(rbac_fixture['admin'])

        for app in [rbac_fixture['app_a'], rbac_fixture['app_b']]:
            resp = client.get(reverse('applications:detail', kwargs={'pk': app.pk}))
            assert resp.status_code == 200
