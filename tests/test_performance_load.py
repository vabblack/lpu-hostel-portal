"""
Synthetic Data Load and Database Performance Benchmark Suite.
Verifies query efficiency, lack of N+1 query regressions, and algorithm
performance under realistic university cohort sizes.
"""
import time
import datetime
import pytest
from django.test.utils import CaptureQueriesContext
from django.db import connection
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.accounts.models import Role
from apps.academics.models import University, Department, DegreeProgram, Branch, AdmissionBatch, StudentRegistry, Gender
from apps.students.models import StudentProfile
from apps.hostels.models import Hostel, Block, Floor, Room, Bed, BedStatus, GenderPolicy, WardenAssignment
from apps.applications.models import AccommodationCycle, HostelApplication, ApplicationStatus, ApplicationChoice
from apps.roommates.models import RoommatePreference, FoodPreference
from apps.roommates.services.recommendations import get_roommate_recommendations
from apps.hostels.services.reports import get_detailed_occupancy_report, get_intake_and_branch_analytics

User = get_user_model()


@pytest.mark.django_db
class TestSyntheticDataPerformanceAndLoad:
    """Benchmark tests validating query scaling and execution speed under volume."""

    @pytest.fixture
    def cohort_fixture(self):
        univ = University.objects.create(name='LPU Main Campus', code='LPU-PERF')
        dept = Department.objects.create(university=univ, name='School of Engineering', code='SOE')
        prog = DegreeProgram.objects.create(department=dept, name='B.Tech CSE', duration_years=4)
        branch = Branch.objects.create(program=prog, name='Computer Science', code='CSE')
        batch = AdmissionBatch.objects.create(program=prog, year=2024)

        admin = User.objects.create_user(email='perf_admin@lpu.in', password='Password123!', role=Role.ADMIN)

        cycle = AccommodationCycle.objects.create(
            academic_year='2026-2027', semester=1, name='Fall 2026',
            application_start=timezone.now() - datetime.timedelta(days=1),
            application_end=timezone.now() + datetime.timedelta(days=15),
            is_active=True
        )

        hostel = Hostel.objects.create(university=univ, name='Mega Tower A', code='MTA', gender_policy=GenderPolicy.MALE)
        block = Block.objects.create(hostel=hostel, name='Block 1')
        floor = Floor.objects.create(block=block, floor_number=1)

        # Create 25 rooms with 3 beds each = 75 beds
        rooms = []
        beds = []
        for r_idx in range(1, 26):
            r = Room(floor=floor, room_number=f"R-{100+r_idx}", capacity=3)
            rooms.append(r)
        Room.objects.bulk_create(rooms)
        created_rooms = list(Room.objects.filter(floor=floor))

        for room in created_rooms:
            for b_idx, b_ident in enumerate(['A', 'B', 'C']):
                status = BedStatus.OCCUPIED if b_idx == 0 else BedStatus.VACANT
                beds.append(Bed(room=room, bed_identifier=b_ident, status=status))
        Bed.objects.bulk_create(beds)

        # Create 50 synthetic students with bulk operations (fast setup without repeated password hashing)
        users = []
        regs = []
        for s_idx in range(1, 51):
            s_email = f"student_perf_{s_idx}@lpu.in"
            s_id = f"PERF{s_idx:04d}"
            users.append(User(email=s_email, role=Role.STUDENT, student_id_login=s_id, password='dummy_hashed_password'))
            regs.append(StudentRegistry(
                student_id=s_id, full_name=f"Perf Student {s_idx}", institutional_email=s_email,
                gender=Gender.MALE, date_of_birth=datetime.date(2004, 1, 1), branch=branch, batch=batch
            ))

        User.objects.bulk_create(users)
        StudentRegistry.objects.bulk_create(regs)

        db_users = list(User.objects.filter(email__startswith='student_perf_').order_by('id'))
        db_regs = list(StudentRegistry.objects.filter(student_id__startswith='PERF').order_by('id'))

        profiles = []
        for u, r in zip(db_users, db_regs):
            profiles.append(StudentProfile(user=u, registry=r))
        StudentProfile.objects.bulk_create(profiles)
        created_profiles = list(StudentProfile.objects.filter(user__in=db_users).order_by('id'))

        prefs = []
        apps = []
        for s_idx, student in enumerate(created_profiles, start=1):
            pref = RoommatePreference(
                student=student,
                sleeping_schedule=1 + (s_idx % 5),
                cleanliness=1 + ((s_idx * 2) % 5),
                study_habits=1 + ((s_idx * 3) % 5),
                noise_tolerance=1 + ((s_idx * 4) % 5),
                food_preference=FoodPreference.VEGETARIAN if s_idx % 2 == 0 else FoodPreference.NON_VEGETARIAN,
                social_preference=1 + (s_idx % 5),
                temperature_pref=1 + ((s_idx * 2) % 5),
            )
            prefs.append(pref)

            app = HostelApplication(
                student=student, cycle=cycle,
                status=ApplicationStatus.APPROVED if s_idx <= 25 else ApplicationStatus.SUBMITTED
            )
            apps.append(app)

        RoommatePreference.objects.bulk_create(prefs)
        HostelApplication.objects.bulk_create(apps)

        return {
            'admin': admin,
            'hostel': hostel,
            'students': created_profiles,
            'cycle': cycle,
        }

    def test_roommate_recommendations_performance_bounded_time(self, cohort_fixture):
        """Roommate recommendation ranking across 50 students completes in under 250 milliseconds."""
        student_target = cohort_fixture['students'][0]
        cycle = cohort_fixture['cycle']

        start_time = time.perf_counter()
        recommendations = get_roommate_recommendations(student_target, cycle=cycle, limit=20)
        elapsed_time = time.perf_counter() - start_time

        assert len(recommendations) <= 20
        assert elapsed_time < 0.250, f"Recommendation took too long: {elapsed_time:.4f}s"
        # Validate that results are descending by match score
        scores = [rec['score'] for rec in recommendations]
        assert scores == sorted(scores, reverse=True)

    def test_occupancy_census_queries_no_n_plus_one(self, cohort_fixture):
        """Census report on 75 beds executes in bounded query count (no N+1 loop queries)."""
        admin = cohort_fixture['admin']
        hostel = cohort_fixture['hostel']

        with CaptureQueriesContext(connection) as queries:
            report = get_detailed_occupancy_report(user=admin, hostel_id=hostel.id)

        # Should execute in small bounded number of queries (<= 8 queries for summary + prefetches)
        query_count = len(queries)
        assert query_count <= 8, f"Detected excessive queries in census report: {query_count}"
        assert report['summary']['total_beds'] == 75
        assert report['summary']['occupied_beds'] == 25
        assert report['summary']['vacant_beds'] == 50

    def test_branch_and_intake_analytics_efficiency(self, cohort_fixture):
        """Executive analytics aggregates 50 applications in bounded queries (no per-student loops)."""
        cycle = cohort_fixture['cycle']

        with CaptureQueriesContext(connection) as queries:
            analytics = get_intake_and_branch_analytics(cycle=cycle)

        # Uses database-level GROUP BY / aggregation queries
        query_count = len(queries)
        assert query_count <= 5, f"Detected excessive queries in analytics: {query_count}"
        assert analytics['funnel']['total'] == 50
        assert analytics['funnel']['approved'] == 25
        assert analytics['funnel']['submitted'] == 25
