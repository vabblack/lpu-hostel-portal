"""
Hostels Forms: Forms for administrative accommodation inventory and warden assignments.
"""
from django import forms
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from apps.accounts.models import Role
from .models import Hostel, Block, Floor, Room, Bed, Facility, WardenAssignment

User = get_user_model()


class HostelForm(forms.ModelForm):
    """Administrative form for creating and updating Hostels."""
    class Meta:
        model = Hostel
        fields = ['university', 'name', 'code', 'gender_policy', 'status', 'total_capacity', 'description']
        widgets = {
            'university': forms.Select(attrs={'class': 'form-control'}),
            'name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'e.g., Boys Hostel 1'}),
            'code': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'e.g., BH-1'}),
            'gender_policy': forms.Select(attrs={'class': 'form-control'}),
            'status': forms.Select(attrs={'class': 'form-control'}),
            'total_capacity': forms.NumberInput(attrs={'class': 'form-control'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }


class BlockForm(forms.ModelForm):
    """Administrative form for creating wings or blocks within a hostel."""
    class Meta:
        model = Block
        fields = ['hostel', 'name']
        widgets = {
            'hostel': forms.Select(attrs={'class': 'form-control'}),
            'name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'e.g., Block A'}),
        }


class FloorForm(forms.ModelForm):
    """Administrative form for creating floors within a block."""
    class Meta:
        model = Floor
        fields = ['block', 'floor_number']
        widgets = {
            'block': forms.Select(attrs={'class': 'form-control'}),
            'floor_number': forms.NumberInput(attrs={'class': 'form-control', 'placeholder': '0 for Ground Floor'}),
        }


class RoomForm(forms.ModelForm):
    """Administrative form for managing room configurations and capacities."""
    class Meta:
        model = Room
        fields = ['floor', 'room_number', 'capacity', 'washroom_type', 'is_air_conditioned', 'status', 'facilities']
        widgets = {
            'floor': forms.Select(attrs={'class': 'form-control'}),
            'room_number': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'e.g., 101'}),
            'capacity': forms.Select(attrs={'class': 'form-control'}),
            'washroom_type': forms.Select(attrs={'class': 'form-control'}),
            'is_air_conditioned': forms.CheckboxInput(),
            'status': forms.Select(attrs={'class': 'form-control'}),
            'facilities': forms.SelectMultiple(attrs={'class': 'form-control'}),
        }


class BedForm(forms.ModelForm):
    """Administrative form for creating individual beds within a room."""
    class Meta:
        model = Bed
        fields = ['room', 'bed_identifier', 'status']
        widgets = {
            'room': forms.Select(attrs={'class': 'form-control'}),
            'bed_identifier': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'A, B, C, or D'}),
            'status': forms.Select(attrs={'class': 'form-control'}),
        }


class WardenAssignmentForm(forms.ModelForm):
    """Administrative form for delegating warden authority over specific hostels."""
    class Meta:
        model = WardenAssignment
        fields = ['user', 'hostel', 'can_approve_allocation', 'is_active']
        widgets = {
            'user': forms.Select(attrs={'class': 'form-control'}),
            'hostel': forms.Select(attrs={'class': 'form-control'}),
            'can_approve_allocation': forms.CheckboxInput(),
            'is_active': forms.CheckboxInput(),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Limit user choices strictly to users holding the WARDEN role
        self.fields['user'].queryset = User.objects.filter(role=Role.WARDEN)

    def clean_user(self):
        user = self.cleaned_data.get('user')
        if user and user.role != Role.WARDEN and not user.is_superuser:
            raise ValidationError(_('Only users holding the WARDEN role can be assigned to oversee hostels.'))
        return user

