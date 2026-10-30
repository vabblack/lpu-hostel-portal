"""
Initial environment setup verification tests.
"""
from django.conf import settings
from django.apps import apps


def test_django_settings_loaded():
    """Ensure Django settings are properly loaded."""
    assert settings.configured is True
    assert 'config.settings' in settings.SETTINGS_MODULE


def test_modular_apps_registered():
    """Ensure all 10 modular apps are properly registered in Django app registry."""
    expected_apps = [
        'apps.accounts',
        'apps.academics',
        'apps.students',
        'apps.hostels',
        'apps.applications',
        'apps.roommates',
        'apps.allocations',
        'apps.notifications',
        'apps.reports',
        'apps.audit',
    ]
    installed_app_names = [app.name for app in apps.get_app_configs()]
    for app_name in expected_apps:
        assert app_name in installed_app_names, f"App {app_name} is missing from INSTALLED_APPS"

