"""
Unit tests for notification dispatcher service, email delivery, and lifecycle events.
"""
import datetime
import pytest
from django.core import mail
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
    Bed,
    BedStatus,
    GenderPolicy,
)
from apps.applications.models import (
    AccommodationCycle,
    HostelApplication,
    ApplicationChoice,
    ApplicationStatus,
)
from apps.roommates.models import RoommateRequest, RequestStatus
from apps.allocations.models import Allocation
from apps.notifications.models import Notification, NotificationType
from apps.notifications.services.dispatcher import (
    send_notification,
    notify_application_status_changed,
    notify_roommate_request_received,
    notify_roommate_request_responded,
    notify_bed_allocated,
    mark_notification_as_read,
    mark_all_notifications_as_read,
)

User = get_user_model()


@pytest.mark.django_db
class TestNotificationDispatcher:
    """Test suite for transactional notifications and email dispatch."""

    @pytest.fixture
    def setup_data(self):
        """Set up students, cycle, room, and allocations."""
        univ = University.objects.create(name='LPU University', code='LPU-NOTIF')
        dept = Department.objects.create(university=univ, name='School of CSE', code='CSE')
        prog = DegreeProgram.objects.create(department=dept, name='B.Tech CSE', duration_years=4)
        branch = Branch.objects.create(program=prog, name='Computer Science', code='CS')
        batch = AdmissionBatch.objects.create(program=prog, year=2024)

        admin = User.objects.create_user(email='admin_notif@lpu.in', password='Password123!', role=Role.ADMIN)

        reg1 = StudentRegistry.objects.create(
            student_id='N2024CS001', full_name='Student Notif 1', institutional_email='n1@lpu.in',
            gender=Gender.MALE, date_of_birth=datetime.date(2004, 1, 1), branch=branch, batch=batch
        )
        user1 = User.objects.create_user(email='n1@lpu.in', password='Password123!', student_id_login='N2024CS001', role=Role.STUDENT)
        s1 = StudentProfile.objects.create(user=user1, registry=reg1)

        reg2 = StudentRegistry.objects.create(
            student_id='N2024CS002', full_name='Student Notif 2', institutional_email='n2@lpu.in',
            gender=Gender.MALE, date_of_birth=datetime.date(2004, 2, 2), branch=branch, batch=batch
        )
        user2 = User.objects.create_user(email='n2@lpu.in', password='Password123!', student_id_login='N2024CS002', role=Role.STUDENT)
        s2 = StudentProfile.objects.create(user=user2, registry=reg2)

        cycle = AccommodationCycle.objects.create(
            academic_year='2026-2027', semester=1, name='Fall 2026',
            application_start=timezone.now() - datetime.timedelta(days=1),
            application_end=timezone.now() + datetime.timedelta(days=15),
            is_active=True
        )

        hostel = Hostel.objects.create(university=univ, name='Men Hostel 1', code='MH1', gender_policy=GenderPolicy.MALE)
        block = Block.objects.create(hostel=hostel, name='Block A')
        floor = Floor.objects.create(block=block, floor_number=2)
        room = Room.objects.create(floor=floor, room_number='205', capacity=2)
        bed = Bed.objects.create(room=room, bed_identifier='A', status=BedStatus.OCCUPIED)

        app = HostelApplication.objects.create(student=s1, cycle=cycle, status=ApplicationStatus.APPROVED)

        alloc = Allocation.objects.create(
            student=s1,
            bed=bed,
            application=app,
            cycle=cycle,
            allocated_by=admin,
            start_date=datetime.date(2026, 8, 1),
            end_date=datetime.date(2027, 5, 31),
            is_active=True
        )

        return {
            'admin': admin,
            's1': s1,
            's2': s2,
            'user1': user1,
            'user2': user2,
            'cycle': cycle,
            'app': app,
            'alloc': alloc,
        }

    def test_send_notification_creates_record_and_mail(self, setup_data):
        """Notification record created and email delivered to outbox."""
        mail.outbox.clear()
        user1 = setup_data['user1']

        notif = send_notification(
            recipient=user1,
            notification_type=NotificationType.SYSTEM,
            title='Campus System Maintenance',
            message='System will undergo maintenance at 2 AM.',
            send_email=True
        )

        assert notif.pk is not None
        assert notif.recipient == user1
        assert notif.is_read is False

        # Email verification
        assert len(mail.outbox) == 1
        sent_email = mail.outbox[0]
        assert user1.email in sent_email.to
        assert "Campus System Maintenance" in sent_email.subject
        assert "maintenance at 2 AM" in sent_email.body

    def test_notify_application_status_changed(self, setup_data):
        """Application status event triggers notification with remarks."""
        mail.outbox.clear()
        app = setup_data['app']
        user1 = setup_data['user1']

        notif = notify_application_status_changed(
            application=app,
            old_status='Under Review',
            new_status='Approved',
            remarks='Eligible for campus housing.'
        )

        assert notif.recipient == user1
        assert notif.notification_type == NotificationType.APPLICATION
        assert "Approved" in notif.title
        assert "Eligible for campus housing" in notif.message

    def test_notify_roommate_request_lifecycle(self, setup_data):
        """Roommate request received and response events."""
        mail.outbox.clear()
        s1 = setup_data['s1']
        s2 = setup_data['s2']
        cycle = setup_data['cycle']

        req = RoommateRequest.objects.create(
            sender=s1,
            receiver=s2,
            cycle=cycle,
            status=RequestStatus.PENDING
        )

        # 1. Receiver gets notification of incoming request
        notif_recv = notify_roommate_request_received(req)
        assert notif_recv.recipient == s2.user
        assert s1.student_id in notif_recv.title

        # 2. Sender gets notification of accepted request
        req.status = RequestStatus.ACCEPTED
        req.save()
        notif_resp = notify_roommate_request_responded(req, 'ACCEPT')
        assert notif_resp.recipient == s1.user
        assert "Accepted" in notif_resp.title

    def test_notify_bed_allocated(self, setup_data):
        """Allocation confirmation delivers rich hostel and room details."""
        mail.outbox.clear()
        alloc = setup_data['alloc']
        user1 = setup_data['user1']

        notif = notify_bed_allocated(alloc)
        assert notif.recipient == user1
        assert notif.notification_type == NotificationType.ALLOCATION
        assert "Room 205 (Bed A)" in notif.title
        assert "Men Hostel 1" in notif.message
        assert "Block A" in notif.message

    def test_mark_notifications_as_read(self, setup_data):
        """Mark single and bulk notifications as read."""
        user1 = setup_data['user1']
        n1 = send_notification(user1, NotificationType.SYSTEM, 'Alert 1', 'Message 1', send_email=False)
        n2 = send_notification(user1, NotificationType.SYSTEM, 'Alert 2', 'Message 2', send_email=False)

        assert Notification.objects.filter(recipient=user1, is_read=False).count() >= 2

        # Mark single
        success = mark_notification_as_read(n1.pk, user1)
        assert success is True
        n1.refresh_from_db()
        assert n1.is_read is True

        # Mark all
        mark_all_notifications_as_read(user1)
        assert Notification.objects.filter(recipient=user1, is_read=False).count() == 0

