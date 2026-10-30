"""
Audit Logging Verification and Privacy Compliance Test Suite.
Verifies:
1. Student PII isolation and privacy protection in public/peer feeds.
2. Complete exclusion of smoking habits across forms, models, and recommendations.
3. Transactional audit trail logging across application status transitions.
4. Allocation cancellation and bed release audit history.
"""
import datetime
import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.accounts.models import Role
from apps.academics.models import University, Department, DegreeProgram, Branch, AdmissionBatch, StudentRegistry, Gender
from apps.students.models import StudentProfile
from apps.hostels.models import Hostel, Block, Floor, Room, Bed, BedStatus, GenderPolicy
from apps.applications.models import AccommodationCycle, HostelApplication, ApplicationStatus, ApplicationChoice, ApplicationStatusHistory
from apps.applications.services.submission import update_application_status
from apps.allocations.models import Allocation, AllocationHistory
from apps.allocations.services.engine import cancel_or_release_allocation
from apps.roommates.models import RoommatePreference, FoodPreference

User = get_user_model()


@pytest.mark.django_db
class TestAuditLoggingAndPrivacyCompliance:
    """Rigorous audit logging and PII privacy compliance tests."""

    @pytest.fixture
    def audit_setup(self):
        univ = University.objects.create(name='LPU Main Campus', code='LPU-AUD')
        dept = Department.objects.create(university=univ, name='School of Bio-Sciences', code='BIO')
        prog = DegreeProgram.objects.create(department=dept, name='B.Sc', duration_years=3)
        branch = Branch.objects.create(program=prog, name='Biotech', code='BIO')
        batch = AdmissionBatch.objects.create(program=prog, year=2024)

        admin = User.objects.create_user(email='admin_aud@lpu.in', password='Password123!', role=Role.ADMIN)

        reg_student = StudentRegistry.objects.create(
            student_id='AUD2024BT001',
            full_name='Private Student',
            institutional_email='priv_stud@lpu.in',
            gender=Gender.FEMALE,
            date_of_birth=datetime.date(2003, 5, 15),
            branch=branch,
            batch=batch
        )
        user_student = User.objects.create_user(
            email='priv_stud@lpu.in',
            password='Password123!',
            role=Role.STUDENT,
            student_id_login='AUD2024BT001'
        )
        profile = StudentProfile.objects.create(
            user=user_student,
            registry=reg_student,
            emergency_contact_name='Guardian Doe',
            emergency_contact_phone='+919876543210'
        )

        cycle = AccommodationCycle.objects.create(
            academic_year='2026-2027', semester=1, name='Fall 2026',
            application_start=timezone.now() - datetime.timedelta(days=1),
            application_end=timezone.now() + datetime.timedelta(days=15),
            is_active=True
        )

        hostel = Hostel.objects.create(university=univ, name='Girls Tower 1', code='GT1', gender_policy=GenderPolicy.FEMALE)
        block = Block.objects.create(hostel=hostel, name='Block G')
        floor = Floor.objects.create(block=block, floor_number=1)
        room = Room.objects.create(floor=floor, room_number='G101', capacity=2)
        bed = Bed.objects.create(room=room, bed_identifier='1', status=BedStatus.OCCUPIED)

        app = HostelApplication.objects.create(student=profile, cycle=cycle, status=ApplicationStatus.SUBMITTED)
        ApplicationChoice.objects.create(application=app, hostel=hostel, priority=1, room=room)

        return {
            'admin': admin,
            'student_user': user_student,
            'profile': profile,
            'cycle': cycle,
            'hostel': hostel,
            'room': room,
            'bed': bed,
            'app': app,
        }

    # =========================================================================
    # 1. Student PII Privacy & Exclusion of Sensitive Attributes
    # =========================================================================

    def test_roommate_model_excludes_smoking_field(self):
        """RoommatePreference model has no smoking-related fields."""
        pref_field_names = [f.name for f in RoommatePreference._meta.get_fields()]
        assert 'smoking' not in pref_field_names
        assert 'is_smoker' not in pref_field_names
        assert 'smoker' not in pref_field_names

    def test_candidate_discovery_does_not_leak_sensitive_pii(self, audit_setup, client):
        """Roommate candidate feed does not expose sensitive PII (DOB, emergency phone, etc.)."""
        client.force_login(audit_setup['student_user'])

        # Save lifestyle preference so discovery feed is active
        RoommatePreference.objects.create(
            student=audit_setup['profile'],
            sleeping_schedule=3,
            cleanliness=4,
            study_habits=3,
            noise_tolerance=2,
            food_preference=FoodPreference.FLEXIBLE,
            social_preference=3,
            temperature_pref=3
        )

        resp = client.get(reverse('roommates:discover'))
        assert resp.status_code == 200

        # Sensitive guardian or DOB information must never be exposed
        assert b"Guardian Doe" not in resp.content
        assert b"+919876543210" not in resp.content
        assert b"2003-05-15" not in resp.content

    # =========================================================================
    # 2. Transactional Application Status Audit Logging
    # =========================================================================

    def test_application_lifecycle_audit_trail(self, audit_setup):
        """Application transitions create immutable status history records."""
        app = audit_setup['app']
        admin = audit_setup['admin']

        # Transition 1: SUBMITTED -> APPROVED
        update_application_status(
            application=app,
            new_status=ApplicationStatus.APPROVED,
            changed_by=admin,
            notes='Documents verified, eligible for room allocation.'
        )

        history_1 = ApplicationStatusHistory.objects.filter(application=app).order_by('-changed_at').first()
        assert history_1 is not None
        assert history_1.from_status == ApplicationStatus.SUBMITTED
        assert history_1.to_status == ApplicationStatus.APPROVED
        assert history_1.changed_by == admin
        assert 'Documents verified' in history_1.notes

        # Transition 2: APPROVED -> ALLOCATED
        update_application_status(
            application=app,
            new_status=ApplicationStatus.ALLOCATED,
            changed_by=admin,
            notes='Bed assigned automatically by engine.'
        )

        assert ApplicationStatusHistory.objects.filter(application=app).count() == 2
        history_2 = ApplicationStatusHistory.objects.filter(application=app).order_by('-changed_at').first()
        assert history_2.from_status == ApplicationStatus.APPROVED
        assert history_2.to_status == ApplicationStatus.ALLOCATED

    # =========================================================================
    # 3. Allocation Release & Audit Integrity
    # =========================================================================

    def test_allocation_cancellation_audit_and_bed_release(self, audit_setup):
        """Cancelling allocation updates allocation state, frees bed, and updates application history."""
        app = audit_setup['app']
        admin = audit_setup['admin']
        bed = audit_setup['bed']

        alloc = Allocation.objects.create(
            student=audit_setup['profile'],
            bed=bed,
            application=app,
            cycle=audit_setup['cycle'],
            allocated_by=admin,
            start_date=datetime.date(2026, 8, 1),
            end_date=datetime.date(2027, 5, 31),
            is_active=True
        )

        # Cancel allocation
        cancel_or_release_allocation(allocation=alloc, recorded_by=admin, reason='Student withdrawal')

        alloc.refresh_from_db()
        bed.refresh_from_db()
        app.refresh_from_db()

        assert alloc.is_active is False
        assert bed.status == BedStatus.VACANT
        assert app.status == ApplicationStatus.CANCELLED

        # Check AllocationHistory audit record
        audit_rec = AllocationHistory.objects.filter(allocation=alloc, action='CANCELLATION').first()
        assert audit_rec is not None
        assert audit_rec.recorded_by == admin
        assert 'Student withdrawal' in audit_rec.notes
