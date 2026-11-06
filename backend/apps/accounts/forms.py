"""
Accounts Forms: Registration, Login, and Password Management forms.
"""
from django import forms
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from .services.registration import verify_and_register_student

User = get_user_model()


class StudentRegistrationForm(forms.Form):
    """
    Form for new students to claim their portal account by verifying Student ID
    and institutional email against the authoritative StudentRegistry.
    """
    student_id = forms.CharField(
        label=_('Student ID / Registration Number'),
        max_length=32,
        widget=forms.TextInput(attrs={'placeholder': 'e.g. 12400001', 'autocomplete': 'username'})
    )
    institutional_email = forms.EmailField(
        label=_('Institutional Email Address'),
        max_length=254,
        widget=forms.EmailInput(attrs={'placeholder': 'e.g. student@lpu.in', 'autocomplete': 'email'})
    )
    password = forms.CharField(
        label=_('Create Password'),
        widget=forms.PasswordInput(attrs={'autocomplete': 'new-password'}),
        help_text=_('Minimum 8 characters with letters, numbers, and symbols.')
    )
    confirm_password = forms.CharField(
        label=_('Confirm Password'),
        widget=forms.PasswordInput(attrs={'autocomplete': 'new-password'})
    )
    emergency_contact_name = forms.CharField(
        label=_('Emergency Contact / Guardian Name (Optional)'),
        max_length=150,
        required=False
    )
    emergency_contact_phone = forms.CharField(
        label=_('Emergency Contact Phone (Optional)'),
        max_length=20,
        required=False
    )

    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get('password')
        confirm_password = cleaned_data.get('confirm_password')

        if password and confirm_password:
            if password != confirm_password:
                self.add_error('confirm_password', _('Passwords do not match.'))
            else:
                # Apply Django configured password validators
                try:
                    validate_password(password)
                except ValidationError as error:
                    self.add_error('password', error)

        return cleaned_data

    def save(self) -> User:
        """Call registration service to atomically verify and create student user."""
        return verify_and_register_student(
            student_id=self.cleaned_data['student_id'],
            institutional_email=self.cleaned_data['institutional_email'],
            password=self.cleaned_data['password'],
            emergency_name=self.cleaned_data.get('emergency_contact_name', ''),
            emergency_phone=self.cleaned_data.get('emergency_contact_phone', ''),
        )


class LoginForm(forms.Form):
    """
    Dual-identity login form accepting either Email Address or Student ID.
    """
    username = forms.CharField(
        label=_('Email Address or Student ID'),
        max_length=254,
        widget=forms.TextInput(attrs={'placeholder': 'Institutional Email or Student ID', 'autocomplete': 'username'})
    )
    password = forms.CharField(
        label=_('Password'),
        widget=forms.PasswordInput(attrs={'placeholder': 'Password', 'autocomplete': 'current-password'})
    )

    def __init__(self, request=None, *args, **kwargs):
        self.request = request
        self.user_cache = None
        super().__init__(*args, **kwargs)

    def clean(self):
        cleaned_data = super().clean()
        username = cleaned_data.get('username')
        password = cleaned_data.get('password')

        if username and password:
            self.user_cache = authenticate(
                self.request,
                username=username.strip(),
                password=password
            )
            if self.user_cache is None:
                raise ValidationError(_('Invalid credentials. Please verify your email/Student ID and password.'))
            elif not self.user_cache.is_active:
                raise ValidationError(_('This account is disabled or suspended.'))

        return cleaned_data

    def get_user(self):
        return self.user_cache

