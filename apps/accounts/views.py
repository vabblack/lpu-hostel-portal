"""
Accounts Views: Authentication, registration verification, and role routing handlers.
"""
from django.contrib import messages
from django.contrib.auth import login as auth_login, logout as auth_logout
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
from django.http import HttpResponseRedirect
from django.shortcuts import render, redirect
from django.urls import reverse
from django.views import View
from django.views.generic import FormView

from .forms import StudentRegistrationForm, LoginForm
from .models import Role


class StudentRegistrationView(View):
    """Handles verified student registration against StudentRegistry."""
    template_name = 'accounts/register.html'

    def get(self, request):
        if request.user.is_authenticated:
            return redirect('accounts:role_redirect')
        form = StudentRegistrationForm()
        return render(request, self.template_name, {'form': form})

    def post(self, request):
        if request.user.is_authenticated:
            return redirect('accounts:role_redirect')
        form = StudentRegistrationForm(request.POST)
        if form.is_valid():
            try:
                user = form.save()
                messages.success(
                    request,
                    'Registration successful! Your identity was verified. Please sign in with your credentials.'
                )
                return redirect('accounts:login')
            except ValidationError as e:
                form.add_error(None, e.message if hasattr(e, 'message') else str(e))
        return render(request, self.template_name, {'form': form})


class UserLoginView(View):
    """Handles dual-identity login via institutional email or Student ID."""
    template_name = 'accounts/login.html'

    def get(self, request):
        if request.user.is_authenticated:
            return redirect('accounts:role_redirect')
        form = LoginForm(request=request)
        return render(request, self.template_name, {'form': form})

    def post(self, request):
        if request.user.is_authenticated:
            return redirect('accounts:role_redirect')
        form = LoginForm(request=request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            auth_login(request, user)
            next_url = request.GET.get('next') or request.POST.get('next')
            if next_url:
                return HttpResponseRedirect(next_url)
            return redirect('accounts:role_redirect')
        return render(request, self.template_name, {'form': form})


def user_logout_view(request):
    """Terminates session and redirects to login."""
    auth_logout(request)
    messages.info(request, 'You have been logged out successfully.')
    return redirect('accounts:login')


@login_required
def role_redirect_view(request):
    """Routes authenticated user to their role-appropriate entrypoint."""
    user = request.user
    if user.is_admin:
        return redirect('/admin/') # Admin dashboard
    elif user.is_warden:
        return redirect('accounts:warden_placeholder')
    return redirect('accounts:student_placeholder')


@login_required
def student_placeholder_view(request):
    """Temporary backend placeholder for Student Dashboard pending Phase 5 UI approval."""
    return render(request, 'accounts/placeholder.html', {'role': 'Student', 'user': request.user})


@login_required
def warden_placeholder_view(request):
    """Temporary backend placeholder for Warden Dashboard pending Phase 5 UI approval."""
    return render(request, 'accounts/placeholder.html', {'role': 'Warden', 'user': request.user})
