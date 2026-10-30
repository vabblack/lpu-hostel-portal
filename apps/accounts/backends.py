"""
Custom Authentication Backend supporting login via either Email or Student ID.
"""
from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.db.models import Q

User = get_user_model()


class EmailOrStudentIDBackend(ModelBackend):
    """
    Authenticate users with either their institutional email or their Student ID.
    Enforces active user checks and password verification.
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get(User.USERNAME_FIELD) or kwargs.get('student_id')

        if not username or not password:
            return None

        username = username.strip()

        try:
            # Query by email (case-insensitive) OR student_id_login (case-insensitive)
            user = User.objects.get(
                Q(email__iexact=username) | Q(student_id_login__iexact=username)
            )
        except User.DoesNotExist:
            # Run default password hasher to mitigate timing attacks
            User().set_password(password)
            return None
        except User.MultipleObjectsReturned:
            # Fallback to exact match on email
            user = User.objects.filter(email__iexact=username).first()
            if not user:
                return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None

