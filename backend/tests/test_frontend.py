"""
Frontend SPA Integration Tests.
Verifies the modern React 19 SPA routing, fallback, and API integrations.
"""
import pytest
from django.urls import reverse


@pytest.mark.django_db
class TestFrontendSPA:
    """Test suite for React 19 SPA entrypoint and routing."""

    def test_root_routes_to_spa_or_dev_server(self, client):
        """Verify root URL routes to the React SPA entrypoint."""
        response = client.get(reverse('home'))
        assert response.status_code in (200, 302)
        if response.status_code == 302:
            assert '5173' in response.url

    def test_spa_root_entrypoint(self, client):
        """Verify /spa/ endpoint redirects to dev server or serves index.html."""
        response = client.get(reverse('spa_root'))
        assert response.status_code in (200, 302)
        if response.status_code == 302:
            assert '5173' in response.url

    def test_api_auth_csrf_available(self, client):
        """Verify REST API CSRF endpoint is accessible for React frontend."""
        response = client.get(reverse('api:auth_csrf'))
        assert response.status_code == 200
        data = response.json()
        assert 'csrfToken' in data
