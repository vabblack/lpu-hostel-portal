"""
Frontend UI and template rendering integration tests for Phase 5.
"""
import pytest
from django.urls import reverse
from apps.academics.models import University
from apps.hostels.models import Hostel, GenderPolicy


@pytest.mark.django_db
class TestFrontendUI:
    """Test suite for public and authenticated template rendering."""

    def test_landing_page_renders_successfully(self, client):
        """Verify the public landing page loads with HTTP 200."""
        response = client.get(reverse('home'))
        assert response.status_code == 200
        assert 'Smart University Hostel Allocation' in response.content.decode()
        assert 'main.css' in response.content.decode()

    def test_login_page_renders_successfully(self, client):
        """Verify the sign-in form page loads with HTTP 200."""
        response = client.get(reverse('accounts:login'))
        assert response.status_code == 200
        assert 'Sign In to Hostel Portal' in response.content.decode()
        assert 'Student ID or Institutional Email' in response.content.decode()

    def test_registration_page_renders_successfully(self, client):
        """Verify the student account claim page loads with HTTP 200."""
        response = client.get(reverse('accounts:register'))
        assert response.status_code == 200
        assert 'Claim Student Account' in response.content.decode()
        assert 'Student ID / Reg No.' in response.content.decode()

    def test_hostel_catalog_renders_successfully(self, client):
        """Verify hostel exploration catalog displays hostels and status badges."""
        univ = University.objects.create(name='UI Test University', code='UI-TEST')
        Hostel.objects.create(
            university=univ,
            name='Alpha Boys Hostel',
            code='ABH',
            gender_policy=GenderPolicy.MALE,
            total_capacity=120
        )

        response = client.get(reverse('hostels:list'))
        assert response.status_code == 200
        content = response.content.decode()
        assert 'Campus Hostels' in content
        assert 'Alpha Boys Hostel' in content
        assert 'ABH' in content
        assert 'Boys Hostel' in content

