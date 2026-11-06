"""
Tests for REST API endpoints.
"""
from django.test import TestCase, Client
from django.urls import reverse
from apps.hostels.models import Hostel, GenderPolicy, HostelStatus


class ApiEndpointsTestCase(TestCase):
    def setUp(self):
        self.client = Client()

    def test_api_health_check(self):
        resp = self.client.get(reverse('api:health_check'))
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data['status'], 'healthy')
        self.assertEqual(data['database'], 'connected')

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

    def test_api_economics_calculator_get(self):
        resp = self.client.get(reverse('api:economics_calculator'), {
            'category': 'STANDARD',
            'seater_count': 2,
            'cooling_type': 'AIR_CONDITIONED',
            'is_edb_eligible': 'true',
            'mess_cuisine': 'NORTH_INDIAN',
            'meal_plan': 'FOUR_MEAL',
            'estimated_kwh': '800.00',
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn('pricing', data)
        self.assertIn('electricity', data)
        self.assertIn('mess', data)
        # Check EDB savings is 10,000
        self.assertEqual(data['pricing']['edb_savings'], 10000.0)
        self.assertEqual(data['pricing']['applicable_hostel_fee'], 133000.0)
        # 800 kWh exceeds 750 kWh quota by 50 units
        self.assertEqual(data['electricity']['overage_kwh'], 50.0)
        self.assertEqual(data['electricity']['per_resident_share'], 212.5) # 50 * 8.5 / 2

    def test_api_gatepass_unauthenticated(self):
        resp = self.client.get(reverse('api:gatepass_list'))
        self.assertEqual(resp.status_code, 401)

    def test_api_rms_tickets_unauthenticated(self):
        resp = self.client.get(reverse('api:rms_tickets'))
        self.assertEqual(resp.status_code, 401)

    def test_spa_view_serves_html(self):
        resp = self.client.get(reverse('spa_root'))
        self.assertIn(resp.status_code, (200, 302))
        if resp.status_code == 200:
            self.assertIn('root', resp.content.decode())

