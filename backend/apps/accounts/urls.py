"""
URLs for Accounts app.
"""
from django.urls import path
from .views import (
    StudentRegistrationView,
    UserLoginView,
    user_logout_view,
    role_redirect_view,
    student_placeholder_view,
    warden_placeholder_view,
)

app_name = 'accounts'

urlpatterns = [
    path('register/', StudentRegistrationView.as_view(), name='register'),
    path('login/', UserLoginView.as_view(), name='login'),
    path('logout/', user_logout_view, name='logout'),
    path('redirect/', role_redirect_view, name='role_redirect'),
    path('student/dashboard/', student_placeholder_view, name='student_placeholder'),
    path('warden/dashboard/', warden_placeholder_view, name='warden_placeholder'),
]
