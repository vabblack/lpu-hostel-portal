"""
Unit and integration tests for Occupancy Reports, CSV exports, Warden scoping, and Analytics.
"""
import datetime
import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
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
    Bed,
    BedStatus,
    GenderPolicy,
    WardenAssignment,
)
from apps.applications.models import (
    AccommodationCycle,
    HostelApplication,
    ApplicationChoice,
    ApplicationStatus,
)
from apps.allocations.models import Allocation
from apps.hostels.services.reports import (
    get_detailed_occupancy_report,
    generate_occupancy_csv,
    get_intake_and_branch_analytics,
)

User = get_user_model()


@pytest.mark.django_db
class TestOccupancyReportsAndAnalytics:
    """Test suite for reporting service and views."""

    @pytest.fixture
    def report_setup(self, client):
        """Set up hostels, beds, wardens, allocations, and applications."""
        univ = University.objects.create(name='LPU Main Campus', code='LPU-REP')
        dept = Department.objects.create(university=univ, name='School of Engineering', code='ENG')
        prog = DegreeProgram.objects.create(department=dept, name='B.Tech', duration_years=4)
        branch = Branch.objects.create(program=prog, name='CSE', code='CSE')
        batch = AdmissionBatch.objects.create(program=prog, year=2024)

        admin = User.objects.create_user(email='admin_rep@lpu.in', password='Password123!', role=Role.ADMIN)
        warden = User.objects.create_user(email='warden_rep@lpu.in', password='Password123!', role=Role.WARDEN)
        student_user = User.objects.create_user(email='student_rep@lpu.in', password='Password123!', role=Role.STUDENT)

        reg = StudentRegistry.objects.create(
            student_id='REP2024CS001', full_name='Alice Resident', institutional_email='student_rep@lpu.in',
            gender=Gender.MALE, date_of_birth=datetime.date(2004, 1, 1), branch=branch, batch=batch
        )
        student = StudentProfile.objects.create(user=student_user, registry=reg)

        cycle = AccommodationCycle.objects.create(
            academic_year='2026-2027', semester=1, name='Fall 2026',
            application_start=timezone.now() - datetime.timedelta(days=1),
            application_end=timezone.now() + datetime.timedelta(days=15),
            is_active=True
        )

        # Hostel 1 (Assigned to Warden)
        hostel1 = Hostel.objects.create(university=univ, name='Boys Tower 1', code='BT1', gender_policy=GenderPolicy.MALE)
        block1 = Block.objects.create(hostel=hostel1, name='Block A')
        floor1 = Floor.objects.create(block=block1, floor_number=1)
        room1 = Room.objects.create(floor=floor1, room_number='101', capacity=2)
        bed1_1 = Bed.objects.create(room=room1, bed_identifier='A', status=BedStatus.OCCUPIED)
        bed1_2 = Bed.objects.create(room=room1, bed_identifier='B', status=BedStatus.VACANT)

        WardenAssignment.objects.create(user=warden, hostel=hostel1, is_active=True)

        # Hostel 2 (NOT assigned to Warden)
        hostel2 = Hostel.objects.create(university=univ, name='Boys Tower 2', code='BT2', gender_policy=GenderPolicy.MALE)
        block2 = Block.objects.create(hostel=hostel2, name='Block B')
        floor2 = Floor.objects.create(block=block2, floor_number=1)
        room2 = Room.objects.create(floor=floor2, room_number='201', capacity=1)
        bed2_1 = Bed.objects.create(room=room2, bed_identifier='A', status=BedStatus.VACANT)

        # Application & Allocation
        app = HostelApplication.objects.create(student=student, cycle=cycle, status=ApplicationStatus.ALLOCATED)
        ApplicationChoice.objects.create(application=app, hostel=hostel1, priority=1, room=room1)

        alloc = Allocation.objects.create(
            student=student,
            bed=bed1_1,
            application=app,
            cycle=cycle,
            allocated_by=admin,
            start_date=datetime.date(2026, 8, 1),
            end_date=datetime.date(2027, 5, 31),
            is_active=True
        )

        return {
            'client': client,
            'admin': admin,
            'warden': warden,
            'student_user': student_user,
            'hostel1': hostel1,
            'hostel2': hostel2,
            'alloc': alloc,
            'cycle': cycle,
        }

    def test_admin_occupancy_report_includes_all_hostels(self, report_setup):
        """Admin can see beds across all university hostels."""
        admin = report_setup['admin']
        report = get_detailed_occupancy_report(admin)

        assert report['summary']['total_beds'] == 3  # 2 in BT1 + 1 in BT2
        assert report['summary']['occupied_beds'] == 1
        assert report['summary']['vacant_beds'] == 2
        assert report['summary']['occupancy_rate'] == 33.3

    def test_warden_occupancy_report_is_scoped(self, report_setup):
        """Warden is strictly scoped to their assigned hostel."""
        warden = report_setup['warden']
        report = get_detailed_occupancy_report(warden)

        assert report['summary']['total_beds'] == 2  # Only BT1
        assert report['summary']['occupied_beds'] == 1
        assert report['summary']['vacant_beds'] == 1
        assert report['summary']['occupancy_rate'] == 50.0

    def test_occupancy_csv_export(self, report_setup):
        """CSV export returns status 200 with headers and data."""
        admin = report_setup['admin']
        resp = generate_occupancy_csv(admin)

        assert resp.status_code == 200
        assert resp['Content-Type'] == 'text/csv'
        assert 'attachment; filename="occupancy_report_' in resp['Content-Disposition']

        content = resp.content.decode('utf-8')
        assert 'Hostel Name,Hostel Code,Block,Floor,Room Number' in content
        assert 'Alice Resident' in content
        assert 'REP2024CS001' in content

    def test_intake_and_branch_analytics(self, report_setup):
        """Analytics aggregates intake conversion and branch distribution."""
        cycle = report_setup['cycle']
        analytics = get_intake_and_branch_analytics(cycle)

        assert analytics['funnel']['total'] == 1
        assert analytics['funnel']['allocated'] == 1
        assert analytics['conversion_rate'] == 100.0

        # Branch distribution
        branches = list(analytics['branch_distribution'])
        assert len(branches) == 1
        assert branches[0]['student__registry__branch__name'] == 'CSE'
        assert branches[0]['count'] == 1

    def test_views_access_permissions(self, report_setup):
        """Student cannot access report (403), Admin can access (200)."""
        client = report_setup['client']

        # Student user -> 403
        client.force_login(report_setup['student_user'])
        resp = client.get(reverse('hostels:occupancy_report'))
        assert resp.status_code == 403

        # Admin user -> 200
        client.force_login(report_setup['admin'])
        resp = client.get(reverse('hostels:occupancy_report'))
        assert resp.status_code == 200
        assert b"Hostel Occupancy & Resident Census" in resp.content

        # Analytics view -> 200
        resp_analytics = client.get(reverse('hostels:analytics_dashboard'))
        assert resp_analytics.status_code == 200
        assert b"Accommodation Intake & Capacity Analytics" in resp_analytics.content
