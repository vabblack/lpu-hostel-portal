"""
Applications Forms: Application submission with up to 3 prioritized choices and administrative review form.
"""
from django import forms
from django.core.exceptions import ValidationError
from django.db.models import Q
from django.utils.translation import gettext_lazy as _

from apps.hostels.models import Hostel, Room, GenderPolicy
from apps.applications.models import ApplicationStatus
from .services.submission import submit_hostel_application


class ApplicationSubmissionForm(forms.Form):
    """
    Form allowing eligible students to submit up to 3 prioritized choices.
    Filters hostel choices according to the student's verified gender policy.
    """
    # Choice 1 (Mandatory)
    choice_1_hostel = forms.ModelChoiceField(
        label=_('1st Preference: Hostel (Required)'),
        queryset=Hostel.objects.none(),
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    choice_1_room = forms.ModelChoiceField(
        label=_('1st Preference: Preferred Room (Optional)'),
        queryset=Room.objects.none(),
        required=False,
        widget=forms.Select(attrs={'class': 'form-control'})
    )

    # Choice 2 (Optional)
    choice_2_hostel = forms.ModelChoiceField(
        label=_('2nd Preference: Hostel (Optional)'),
        queryset=Hostel.objects.none(),
        required=False,
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    choice_2_room = forms.ModelChoiceField(
        label=_('2nd Preference: Preferred Room (Optional)'),
        queryset=Room.objects.none(),
        required=False,
        widget=forms.Select(attrs={'class': 'form-control'})
    )

    # Choice 3 (Optional)
    choice_3_hostel = forms.ModelChoiceField(
        label=_('3rd Preference: Hostel (Optional)'),
        queryset=Hostel.objects.none(),
        required=False,
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    choice_3_room = forms.ModelChoiceField(
        label=_('3rd Preference: Preferred Room (Optional)'),
        queryset=Room.objects.none(),
        required=False,
        widget=forms.Select(attrs={'class': 'form-control'})
    )

    def __init__(self, student=None, cycle=None, *args, **kwargs):
        self.student = student
        self.cycle = cycle
        super().__init__(*args, **kwargs)

        if student:
            # Filter hostels by student's verified gender policy
            eligible_hostels = Hostel.objects.filter(
                status='ACTIVE'
            ).filter(
                Q(gender_policy=student.gender) | Q(gender_policy=GenderPolicy.CO_ED)
            ).order_by('name')

            self.fields['choice_1_hostel'].queryset = eligible_hostels
            self.fields['choice_2_hostel'].queryset = eligible_hostels
            self.fields['choice_3_hostel'].queryset = eligible_hostels

            # Eligible rooms
            available_rooms = Room.objects.filter(
                floor__block__hostel__in=eligible_hostels,
                status='AVAILABLE'
            ).select_related('floor__block__hostel').order_by('floor__block__hostel__code', 'room_number')

            self.fields['choice_1_room'].queryset = available_rooms
            self.fields['choice_2_room'].queryset = available_rooms
            self.fields['choice_3_room'].queryset = available_rooms

    def clean(self):
        cleaned_data = super().clean()
        c1_hostel = cleaned_data.get('choice_1_hostel')
        c2_hostel = cleaned_data.get('choice_2_hostel')
        c3_hostel = cleaned_data.get('choice_3_hostel')

        selected_hostels = [h for h in [c1_hostel, c2_hostel, c3_hostel] if h is not None]

        # Prevent duplicate hostel choices
        if len(selected_hostels) != len(set(selected_hostels)):
            raise ValidationError(_('You cannot select the same hostel more than once across your 3 choices.'))

        return cleaned_data

    def save(self):
        """Constructs choices_data list and invokes submit_hostel_application service."""
        choices_data = []

        # Choice 1
        c1_hostel = self.cleaned_data['choice_1_hostel']
        c1_room = self.cleaned_data.get('choice_1_room')
        choices_data.append({'priority': 1, 'hostel': c1_hostel, 'room': c1_room})

        # Choice 2
        c2_hostel = self.cleaned_data.get('choice_2_hostel')
        if c2_hostel:
            c2_room = self.cleaned_data.get('choice_2_room')
            choices_data.append({'priority': 2, 'hostel': c2_hostel, 'room': c2_room})

        # Choice 3
        c3_hostel = self.cleaned_data.get('choice_3_hostel')
        if c3_hostel:
            c3_room = self.cleaned_data.get('choice_3_room')
            choices_data.append({'priority': 3, 'hostel': c3_hostel, 'room': c3_room})

        return submit_hostel_application(
            student=self.student,
            cycle=self.cycle,
            choices_data=choices_data
        )


class ApplicationReviewForm(forms.Form):
    """Administrative and Warden review form to update application status."""
    status = forms.ChoiceField(
        label=_('Application Decision Status'),
        choices=[
            (ApplicationStatus.UNDER_REVIEW, _('Under Review')),
            (ApplicationStatus.APPROVED, _('Approved (Eligible for Bed Assignment)')),
            (ApplicationStatus.WAITLISTED, _('Waitlisted')),
            (ApplicationStatus.REJECTED, _('Rejected')),
        ],
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    notes = forms.CharField(
        label=_('Reviewer Decision Notes'),
        widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        required=False
    )
