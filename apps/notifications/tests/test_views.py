import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from apps.accounts.models import Role
from apps.notifications.models import Notification, NotificationType

User = get_user_model()


@pytest.mark.django_db
class TestNotificationViews:
    """Test notification list and mark-as-read views."""

    @pytest.fixture
    def setup_data(self, client):
        user1 = User.objects.create_user(email='user1@lpu.in', password='Password123!', role=Role.STUDENT)
        user2 = User.objects.create_user(email='user2@lpu.in', password='Password123!', role=Role.STUDENT)

        n1 = Notification.objects.create(
            recipient=user1,
            title='Alert 1',
            message='First notification',
            notification_type=NotificationType.APPLICATION,
            is_read=False
        )
        n2 = Notification.objects.create(
            recipient=user1,
            title='Alert 2',
            message='Second notification',
            notification_type=NotificationType.ROOMMATE,
            is_read=False
        )
        n3 = Notification.objects.create(
            recipient=user2,
            title='User 2 Alert',
            message='Other user message',
            notification_type=NotificationType.SYSTEM,
            is_read=False
        )

        return {
            'client': client,
            'user1': user1,
            'user2': user2,
            'n1': n1,
            'n2': n2,
            'n3': n3,
        }

    def test_unauthenticated_redirects(self, setup_data):
        client = setup_data['client']
        resp = client.get(reverse('notifications:list'))
        assert resp.status_code == 302
        assert '/accounts/login/' in resp.url

    def test_notifications_list_view(self, setup_data):
        client = setup_data['client']
        client.force_login(setup_data['user1'])

        resp = client.get(reverse('notifications:list'))
        assert resp.status_code == 200
        assert b"Alert 1" in resp.content
        assert b"Alert 2" in resp.content
        assert b"User 2 Alert" not in resp.content
        assert resp.context['unread_count'] == 2

    def test_mark_as_read_view(self, setup_data):
        client = setup_data['client']
        client.force_login(setup_data['user1'])
        n1 = setup_data['n1']

        resp = client.post(reverse('notifications:mark_read', kwargs={'notif_id': n1.id}))
        assert resp.status_code == 302
        assert resp.url == reverse('notifications:list')

        n1.refresh_from_db()
        assert n1.is_read is True

    def test_mark_all_read_view(self, setup_data):
        client = setup_data['client']
        client.force_login(setup_data['user1'])

        resp = client.post(reverse('notifications:mark_all_read'))
        assert resp.status_code == 302
        assert resp.url == reverse('notifications:list')

        unread_count = Notification.objects.filter(recipient=setup_data['user1'], is_read=False).count()
        assert unread_count == 0

        # user2's notifications should remain untouched
        n3 = setup_data['n3']
        n3.refresh_from_db()
        assert n3.is_read is False
