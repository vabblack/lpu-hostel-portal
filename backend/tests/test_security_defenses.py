"""
Comprehensive Security Defenses Test Suite.
Verifies critical security controls:
1. CSRF Protection (enforced token validation on state-changing requests).
2. Cross-Site Scripting (XSS) auto-escaping across all views and templates.
3. SQL Injection immunity (parameterized queries and ORM isolation).
4. Session fixation prevention and session invalidation.
"""
import datetime
import pytest
from django.test import Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.accounts.models import Role
from apps.academics.models import University, Department, DegreeProgram, Branch, AdmissionBatch, StudentRegistry, Gender
from apps.students.models import StudentProfile
from apps.hostels.models import Hostel, Block, Floor, Room, Bed, BedStatus, GenderPolicy
from apps.applications.models import AccommodationCycle, HostelApplication, ApplicationStatus, ApplicationChoice
from apps.notifications.models import Notification, NotificationType

User = get_user_model()


@pytest.mark.django_db
class TestSecurityDefenses:
    """Rigorous penetration-style tests for CSRF, XSS, SQLi, and Session security."""

    @pytest.fixture
    def sec_fixture(self):
        univ = University.objects.create(name='LPU Main Campus', code='LPU-SEC')
        dept = Department.objects.create(university=univ, name='School of Computing', code='COMP')
        prog = DegreeProgram.objects.create(department=dept, name='B.Tech CSE', duration_years=4)
        branch = Branch.objects.create(program=prog, name='Computer Science', code='CSE')
        batch = AdmissionBatch.objects.create(program=prog, year=2024)

        user_student = User.objects.create_user(
            email='sec_student@lpu.in', password='Password123!', role=Role.STUDENT, student_id_login='SEC001'
        )
        reg = StudentRegistry.objects.create(
            student_id='SEC001', full_name='Security Student', institutional_email='sec_student@lpu.in',
            gender=Gender.MALE, date_of_birth=datetime.date(2004, 1, 1), branch=branch, batch=batch
        )
        profile = StudentProfile.objects.create(user=user_student, registry=reg)

        cycle = AccommodationCycle.objects.create(
            academic_year='2026-2027', semester=1, name='Fall 2026',
            application_start=timezone.now() - datetime.timedelta(days=1),
            application_end=timezone.now() + datetime.timedelta(days=15),
            is_active=True
        )

        hostel = Hostel.objects.create(university=univ, name='Hostel Shield', code='HSH', gender_policy=GenderPolicy.MALE)
        block = Block.objects.create(hostel=hostel, name='Block S')
        floor = Floor.objects.create(block=block, floor_number=1)
        room = Room.objects.create(floor=floor, room_number='101', capacity=2)
        bed = Bed.objects.create(room=room, bed_identifier='A', status=BedStatus.VACANT)

        return {
            'student_user': user_student,
            'profile': profile,
            'cycle': cycle,
            'hostel': hostel,
            'room': room,
        }

    # =========================================================================
    # 1. CSRF Protection Tests
    # =========================================================================

    def test_csrf_protection_rejects_post_without_token(self, sec_fixture):
        """Client with enforce_csrf_checks=True rejects unauthenticated state-altering POST with 403."""
        csrf_client = Client(enforce_csrf_checks=True)

        # POST without CSRF token to login endpoint -> 403 Forbidden
        resp_login = csrf_client.post(reverse('accounts:login'), {
            'username': 'sec_student@lpu.in',
            'password': 'Password123!',
        })
        assert resp_login.status_code == 403

    def test_csrf_protection_accepts_post_with_token(self, sec_fixture):
        """Requests with a valid CSRF cookie and token are processed successfully."""
        csrf_client = Client(enforce_csrf_checks=True)
        # GET page first to obtain CSRF cookie
        resp_get = csrf_client.get(reverse('accounts:login'))
        assert resp_get.status_code == 200
        csrf_token = resp_get.cookies['csrftoken'].value

        # Post with valid CSRF token header/data
        resp_post = csrf_client.post(reverse('accounts:login'), {
            'username': 'sec_student@lpu.in',
            'password': 'Password123!',
            'csrfmiddlewaretoken': csrf_token,
        })
        assert resp_post.status_code == 302 # Successfully authenticated and redirected

    # =========================================================================
    # 2. XSS (Cross-Site Scripting) Escaping Tests
    # =========================================================================

    def test_xss_payload_in_notification_message_escaped(self, sec_fixture):
        """Notification messages containing raw HTML and script tags are automatically HTML-escaped."""
        client = Client()
        client.force_login(sec_fixture['student_user'])

        xss_payload = "<script>alert('XSS_ATTACK');</script><img src=x onerror=alert('PWNED')>"
        Notification.objects.create(
            recipient=sec_fixture['student_user'],
            title="Important Alert <script>alert(1)</script>",
            message=xss_payload,
            notification_type=NotificationType.SYSTEM,
            is_read=False
        )

        resp = client.get(reverse('notifications:list'))
        assert resp.status_code == 200
        # Must NOT contain raw unescaped script tag
        assert b"<script>alert('XSS_ATTACK');</script>" not in resp.content
        assert b"<img src=x onerror=alert('PWNED')>" not in resp.content
        # Must contain escaped safe entities
        assert b"&lt;script&gt;alert(&#x27;XSS_ATTACK&#x27;);&lt;/script&gt;" in resp.content or \
               b"&lt;script&gt;alert('XSS_ATTACK');&lt;/script&gt;" in resp.content or \
               b"&lt;img" in resp.content

    def test_xss_payload_in_hostel_catalog_search(self, sec_fixture):
        """Malicious script injected into query parameters is never echoed unescaped."""
        client = Client()
        xss_query = '"><script>alert("HOSTEL_XSS")</script>'
        resp = client.get(f"{reverse('hostels:list')}?gender={xss_query}")
        assert resp.status_code == 200
        assert b"<script>alert(\"HOSTEL_XSS\")</script>" not in resp.content

    # =========================================================================
    # 3. SQL Injection (SQLi) Immunity Tests
    # =========================================================================

    def test_sql_injection_in_gender_query_param(self, sec_fixture):
        """SQL injection attempt in hostel list query parameter is treated as literal text."""
        client = Client()
        sqli_payload = "' OR '1'='1' --"
        resp = client.get(f"{reverse('hostels:list')}?gender={sqli_payload}")
        assert resp.status_code == 200
        # Query parameter is not valid GenderPolicy choice, fallback returns all or filtered without DB crash

    def test_sql_injection_union_attack_in_application_queue(self, sec_fixture):
        """SQL injection UNION attack on review queue status filter is safely handled."""
        admin = User.objects.create_user(email='admin_sqli@lpu.in', password='Password123!', role=Role.ADMIN)
        client = Client()
        client.force_login(admin)

        sqli_union = "APPROVED' UNION SELECT NULL, NULL, NULL --"
        resp = client.get(f"{reverse('applications:queue')}?status={sqli_union}")
        assert resp.status_code == 200
        # Database operates cleanly without syntax error

    def test_sql_injection_in_student_login(self, sec_fixture):
        """SQL injection in login identifier cannot bypass authentication."""
        client = Client()
        sqli_login = "' OR 1=1; --"
        resp = client.post(reverse('accounts:login'), {
            'username': sqli_login,
            'password': 'random_password',
        })
        # Login fails cleanly with error (not 500 or unauthorized login)
        assert resp.status_code == 200
        assert b"Invalid credentials" in resp.content

    # =========================================================================
    # 4. Session Fixation & Session Invalidation Tests
    # =========================================================================

    def test_session_key_regenerated_on_login(self, sec_fixture):
        """Django auth cycles session key on login to prevent session fixation attacks."""
        client = Client()
        # Initial anonymous session
        client.get(reverse('accounts:login'))
        anonymous_session_key = client.session.session_key

        # Login
        resp = client.post(reverse('accounts:login'), {
            'username': 'sec_student@lpu.in',
            'password': 'Password123!',
        })
        assert resp.status_code == 302
        authenticated_session_key = client.session.session_key

        # Session key must change upon login
        assert authenticated_session_key != anonymous_session_key

    def test_session_flushed_on_logout(self, sec_fixture):
        """Logging out completely destroys the authenticated session."""
        client = Client()
        client.force_login(sec_fixture['student_user'])

        resp_logout = client.post(reverse('accounts:logout'))
        assert resp_logout.status_code == 302
        assert reverse('home') in resp_logout.url

        # Subsequent request to protected view must redirect to login
        resp_protected = client.get(reverse('notifications:list'))
        assert resp_protected.status_code == 302
        assert '/accounts/login/' in resp_protected.url
