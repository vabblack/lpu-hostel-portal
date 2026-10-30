"""
Roommate Management Forms: 7-factor lifestyle compatibility questionnaire.
Strictly excludes any smoking preferences as per university policy and project scope.
"""
from django import forms
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from apps.roommates.models import RoommatePreference, FoodPreference


SLEEPING_SCHEDULE_CHOICES = (
    (1, _('1 - Early Riser (Before 10:00 PM)')),
    (2, _('2 - Early-to-Moderate (~10:00 PM - 11:00 PM)')),
    (3, _('3 - Moderate Sleeper (~11:00 PM - 12:30 AM)')),
    (4, _('4 - Late Sleeper (~12:30 AM - 2:00 AM)')),
    (5, _('5 - Night Owl (After 2:00 AM)')),
)

CLEANLINESS_CHOICES = (
    (1, _('1 - Casual / Relaxed (Tidy up weekly)')),
    (2, _('2 - Moderately Relaxed')),
    (3, _('3 - Average (Organized, tidy bed & desk)')),
    (4, _('4 - Very Neat (Daily cleaning, everything organized)')),
    (5, _('5 - Spotless / Meticulous (Zero clutter at all times)')),
)

STUDY_HABITS_CHOICES = (
    (1, _('1 - Pin-Drop Silence (No audio or conversations)')),
    (2, _('2 - Quiet with Headphones')),
    (3, _('3 - Moderate Ambient Sound')),
    (4, _('4 - Collaborative / Occasional discussions')),
    (5, _('5 - Group Study / Background audio')),
)

NOISE_TOLERANCE_CHOICES = (
    (1, _('1 - Extremely Sensitive (Woken up easily)')),
    (2, _('2 - Sensitive to Loud Sounds')),
    (3, _('3 - Average Tolerance')),
    (4, _('4 - High Tolerance')),
    (5, _('5 - Very Deep Sleeper (Unbothered by ambient sounds)')),
)

SOCIAL_PREFERENCE_CHOICES = (
    (1, _('1 - Private / Introvert (Room strictly for residents)')),
    (2, _('2 - Low Visitors')),
    (3, _('3 - Balanced (Occasional friends with prior notice)')),
    (4, _('4 - Social (Friends frequently visiting)')),
    (5, _('5 - Open Door (Hub for study groups & socializing)')),
)

TEMPERATURE_PREF_CHOICES = (
    (1, _('1 - Warm / Fan Only (No AC preferred)')),
    (2, _('2 - Mild (~26°C - 27°C)')),
    (3, _('3 - Moderate (~23°C - 25°C)')),
    (4, _('4 - Cool (~20°C - 22°C)')),
    (5, _('5 - Very Cold (<19°C / Continuous AC)')),
)


class RoommatePreferenceForm(forms.ModelForm):
    """
    Seven-factor lifestyle preference questionnaire form.
    Guarantees deterministic, normalized matching input with zero smoking preferences.
    """
    sleeping_schedule = forms.TypedChoiceField(
        label=_('Sleeping Schedule (22% Weight)'),
        choices=SLEEPING_SCHEDULE_CHOICES,
        coerce=int,
        widget=forms.RadioSelect(attrs={'class': 'preference-radio'}),
        required=True,
        help_text=_('Select your typical sleeping time on regular weekdays and weekends.')
    )
    cleanliness = forms.TypedChoiceField(
        label=_('Cleanliness & Tidiness (17% Weight)'),
        choices=CLEANLINESS_CHOICES,
        coerce=int,
        widget=forms.RadioSelect(attrs={'class': 'preference-radio'}),
        required=True,
        help_text=_('How organized and tidy do you keep the shared room and study desk?')
    )
    study_habits = forms.TypedChoiceField(
        label=_('Study Habits & Environment (17% Weight)'),
        choices=STUDY_HABITS_CHOICES,
        coerce=int,
        widget=forms.RadioSelect(attrs={'class': 'preference-radio'}),
        required=True,
        help_text=_('Your preferred sound level and environment while studying inside the room.')
    )
    noise_tolerance = forms.TypedChoiceField(
        label=_('Noise Tolerance (11% Weight)'),
        choices=NOISE_TOLERANCE_CHOICES,
        coerce=int,
        widget=forms.RadioSelect(attrs={'class': 'preference-radio'}),
        required=True,
        help_text=_('How sensitive are you to sounds while relaxing, reading, or resting?')
    )
    food_preference = forms.ChoiceField(
        label=_('Food & Dietary Preference (11% Weight)'),
        choices=FoodPreference.choices,
        widget=forms.RadioSelect(attrs={'class': 'preference-radio'}),
        required=True,
        help_text=_('Your dietary preference for meals consumed inside the room.')
    )
    social_preference = forms.TypedChoiceField(
        label=_('Social Preferences & Guests (11% Weight)'),
        choices=SOCIAL_PREFERENCE_CHOICES,
        coerce=int,
        widget=forms.RadioSelect(attrs={'class': 'preference-radio'}),
        required=True,
        help_text=_('How comfortable are you having guests or batchmates inside the room?')
    )
    temperature_pref = forms.TypedChoiceField(
        label=_('Room Temperature / AC Preference (11% Weight)'),
        choices=TEMPERATURE_PREF_CHOICES,
        coerce=int,
        widget=forms.RadioSelect(attrs={'class': 'preference-radio'}),
        required=True,
        help_text=_('Your preferred room temperature and air conditioning usage.')
    )

    class Meta:
        model = RoommatePreference
        fields = [
            'sleeping_schedule',
            'cleanliness',
            'study_habits',
            'noise_tolerance',
            'food_preference',
            'social_preference',
            'temperature_pref',
        ]

    def clean(self):
        cleaned_data = super().clean()

        # Enforce that all 1-5 scale dimensions are within strict [1, 5] bounds
        scale_fields = [
            'sleeping_schedule',
            'cleanliness',
            'study_habits',
            'noise_tolerance',
            'social_preference',
            'temperature_pref',
        ]
        for field in scale_fields:
            val = cleaned_data.get(field)
            if val is not None and not (1 <= val <= 5):
                self.add_error(field, _('Choice must be an integer between 1 and 5.'))

        # Enforce valid food preference choice
        food_val = cleaned_data.get('food_preference')
        if food_val and food_val not in FoodPreference.values:
            self.add_error('food_preference', _('Invalid food preference selection.'))

        # Absolute zero smoking guard: Reject any attempt to pass smoking keys
        for key in self.data.keys():
            if 'smoke' in key.lower() or 'smoking' in key.lower():
                raise ValidationError(_('Smoking preferences are strictly prohibited and excluded from matching.'))

        return cleaned_data

    def save(self, commit=True, student=None):
        """Save preference and associate with the student profile if provided."""
        instance = super().save(commit=False)
        if student is not None:
            instance.student = student
        if commit:
            instance.save()
        return instance

