"""
Tests for REST API endpoints.
"""
from django.test import TestCase, Client
from django.urls import reverse
from apps.hostels.models import Hostel, GenderPolicy, HostelStatus


class ApiEndpointsTestCase(TestCase):
    def setUp(self):
        self.client = Client()

    def test_api_auth_me_unauthenticated(self):
        resp = self.client.get(reverse('api:auth_me'))
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertFalse(data['authenticated'])
        self.assertIsNone(data['user'])
        self.assertIn('csrf_token', data)

    def test_api_hostels_list(self):
        resp = self.client.get(reverse('api:hostels_list'))
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn('hostels', data)
        self.assertIsInstance(data['hostels'], list)

    def test_api_rooms_catalog(self):
        resp = self.client.get(reverse('api:rooms_catalog'))
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn('rooms', data)
        self.assertIsInstance(data['rooms'], list)

    def test_api_dashboard_summary(self):
        resp = self.client.get(reverse('api:dashboard_summary'))
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn('campus', data)
        self.assertIn('total_hostels', data['campus'])

    def test_api_csrf_token(self):
        resp = self.client.get(reverse('api:auth_csrf'))
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn('csrfToken', data)
        self.assertTrue(bool(data['csrfToken']))
