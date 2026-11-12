"""
Tests for LPU Google Workspace SSO and UMS Allotment Import integrations.
"""
import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from apps.accounts.models import Role
from apps.academics.models import StudentRegistry
from apps.hostels.models import Hostel, Block, Floor, Room, Bed, BedStatus
from apps.allocations.models import Allocation

User = get_user_model()


@pytest.mark.django_db
def test_google_auth_rejects_non_lpu_domain():
    client = Client()
    resp = client.post(
        '/api/auth/google/',
        data='{"email": "student@gmail.com", "name": "Random User"}',
        content_type='application/json',
    )
    assert resp.status_code == 403
    data = resp.json()
    assert 'not an authorized Lovely Professional University Google Workspace domain' in data['error']


@pytest.mark.django_db
def test_google_auth_success_with_lpu_domain():
    client = Client()
    resp = client.post(
        '/api/auth/google/',
        data='{"email": "raghav.12400999@lpu.in", "name": "Raghav Sharma", "student_id": "12400999"}',
        content_type='application/json',
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data['success'] is True
    assert 'Raghav Sharma' in data['message']
    assert data['user']['email'] == 'raghav.12400999@lpu.in'
    assert data['user']['student']['student_id'] == '12400999'

    # Check database persistence
    user = User.objects.get(email='raghav.12400999@lpu.in')
    assert user.role == Role.STUDENT
    assert user.student_profile.registry.student_id == '12400999'


@pytest.mark.django_db
def test_import_ums_allotment_workflow():
    client = Client()
    # 1. Sign in with LPU Google Workspace
    resp = client.post(
        '/api/auth/google/',
        data='{"email": "12400888@lpu.in", "name": "Arjun Verma", "student_id": "12400888"}',
        content_type='application/json',
    )
    assert resp.status_code == 200

    # Ensure a hostel exists
    from apps.academics.models import University
    uni, _ = University.objects.get_or_create(code='LPU', defaults={'name': 'Lovely Professional University'})
    hostel, _ = Hostel.objects.get_or_create(
        code='BH-4',
        defaults={'name': 'Boys Hostel 4', 'university': uni, 'gender_policy': 'MALE', 'total_capacity': 500}
    )

    # 2. Post UMS Allotment slip text
    ums_slip_text = """
    LOVELY PROFESSIONAL UNIVERSITY
    RESIDENTIAL SERVICES PORTAL - ALLOTMENT SLIP
    Registration No: 12400888
    Hostel: Boys Hostel 4 (BH-4)
    Room: 304
    Bed: Bed B
    Room Type: 2-Seater AC
    Reference ID: LPU-UMS-2026-BH4-304B
    """
    import json
    resp_import = client.post(
        '/api/students/import-allotment/',
        data=json.dumps({"allotment_text": ums_slip_text}),
        content_type='application/json',
    )
    assert resp_import.status_code == 200
    data = resp_import.json()
    assert data['success'] is True
    assert data['allocation']['room_number'] == '304'
    assert data['allocation']['bed_identifier'] == 'Bed B'
    assert data['allocation']['hostel_code'] == 'BH-4'

    # Verify allocation in DB
    user = User.objects.get(email='12400888@lpu.in')
    active_alloc = Allocation.objects.get(student=user.student_profile, is_active=True)
    assert active_alloc.bed.room.room_number == '304'
    assert active_alloc.bed.status == BedStatus.OCCUPIED
