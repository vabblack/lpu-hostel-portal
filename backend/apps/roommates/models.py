"""
Roommates Models: 7-factor preference model (zero smoking), mutual requests, groups, and match scores.
"""
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _


class FoodPreference(models.TextChoices):
    """Dietary habit choices."""
    VEGETARIAN = 'VEGETARIAN', _('Vegetarian')
    NON_VEGETARIAN = 'NON_VEGETARIAN', _('Non-Vegetarian')
    FLEXIBLE = 'FLEXIBLE', _('Flexible / No Preference')


class RequestStatus(models.TextChoices):
    """Status lifecycle of a direct roommate request."""
    PENDING = 'PENDING', _('Pending Response')
    ACCEPTED = 'ACCEPTED', _('Accepted')
    REJECTED = 'REJECTED', _('Rejected')
    EXPIRED = 'EXPIRED', _('Expired')
    CANCELLED = 'CANCELLED', _('Cancelled')


class RoommatePreference(models.Model):
    """
    Seven lifestyle compatibility dimensions (strictly excluding smoking habits).
    Used by the deterministic Python weighted compatibility algorithm.
    """
    student = models.OneToOneField(
        'students.StudentProfile',
        on_delete=models.CASCADE,
        related_name='roommate_preference',
        verbose_name=_('Student')
    )
    # Factor 1: 22% weight
    sleeping_schedule = models.PositiveSmallIntegerField(
        _('Sleeping Schedule (1-5)'),
        help_text=_('1 = Early Riser (<10 PM), 3 = Moderate (11 PM - 12 AM), 5 = Night Owl (>1 AM).')
    )
    # Factor 2: 17% weight
    cleanliness = models.PositiveSmallIntegerField(
        _('Cleanliness / Tidiness (1-5)'),
        help_text=_('1 = Relaxed / Casual, 3 = Average, 5 = Extremely Organized / Neat.')
    )
    # Factor 3: 17% weight
    study_habits = models.PositiveSmallIntegerField(
        _('Study Habits (1-5)'),
        help_text=_('1 = Pin-drop silence in room, 3 = Moderate ambient sound, 5 = Group study / background audio.')
    )
    # Factor 4: 11% weight
    noise_tolerance = models.PositiveSmallIntegerField(
        _('Noise Tolerance (1-5)'),
        help_text=_('1 = Highly sensitive to noise, 3 = Moderate tolerance, 5 = Very high tolerance.')
    )
    # Factor 5: 11% weight
    food_preference = models.CharField(
        _('Food / Dietary Preference'),
        max_length=20,
        choices=FoodPreference.choices,
        default=FoodPreference.FLEXIBLE
    )
    # Factor 6: 11% weight
    social_preference = models.PositiveSmallIntegerField(
        _('Social Preferences (1-5)'),
        help_text=_('1 = Private / Introverted, 3 = Balanced, 5 = Highly Social / Enjoys Room Guests.')
    )
    # Factor 7: 11% weight
    temperature_pref = models.PositiveSmallIntegerField(
        _('Room Temperature Preference (1-5)'),
        help_text=_('1 = Prefers Warm (No AC), 3 = Moderate (~24C), 5 = Prefers Very Cold / Continuous AC.')
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Roommate Preference')
        verbose_name_plural = _('Roommate Preferences')

    def __str__(self):
        return f"Preferences of {self.student.student_id}"

    def clean(self):
        # Validate that all 1-5 scale fields are in bounds
        scale_fields = [
            ('sleeping_schedule', self.sleeping_schedule),
            ('cleanliness', self.cleanliness),
            ('study_habits', self.study_habits),
            ('noise_tolerance', self.noise_tolerance),
            ('social_preference', self.social_preference),
            ('temperature_pref', self.temperature_pref),
        ]
        for name, val in scale_fields:
            if val is not None and not (1 <= val <= 5):
                raise ValidationError({name: _('Value must be an integer between 1 and 5.')})


class RoommateRequest(models.Model):
    """
    Direct roommate request sent from one student to another.
    Both must agree on a common room and hostel choice before confirmation.
    """
    sender = models.ForeignKey(
        'students.StudentProfile',
        on_delete=models.CASCADE,
        related_name='sent_roommate_requests',
        verbose_name=_('Sender')
    )
    receiver = models.ForeignKey(
        'students.StudentProfile',
        on_delete=models.CASCADE,
        related_name='received_roommate_requests',
        verbose_name=_('Receiver')
    )
    cycle = models.ForeignKey(
        'applications.AccommodationCycle',
        on_delete=models.CASCADE,
        related_name='roommate_requests',
        verbose_name=_('Accommodation Cycle')
    )
    status = models.CharField(
        _('Request Status'),
        max_length=20,
        choices=RequestStatus.choices,
        default=RequestStatus.PENDING,
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = _('Roommate Request')
        verbose_name_plural = _('Roommate Requests')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['receiver', 'status'], name='idx_req_receiver_status'),
            models.Index(fields=['sender', 'cycle'], name='idx_req_sender_cycle'),
        ]

    def __str__(self):
        return f"{self.sender.student_id} -> {self.receiver.student_id} ({self.get_status_display()})"

    def clean(self):
        if self.sender_id and self.receiver_id and self.sender_id == self.receiver_id:
            raise ValidationError(_('A student cannot send a roommate request to themselves.'))


class RoommateGroup(models.Model):
    """
    Mutual roommate group of 2, 3, or 4 students aligned on a common room.
    """
    cycle = models.ForeignKey(
        'applications.AccommodationCycle',
        on_delete=models.CASCADE,
        related_name='roommate_groups',
        verbose_name=_('Accommodation Cycle')
    )
    target_room = models.ForeignKey(
        'hostels.Room',
        on_delete=models.CASCADE,
        related_name='roommate_groups',
        verbose_name=_('Agreed Common Room')
    )
    is_confirmed = models.BooleanField(
        _('Confirmed Group'),
        default=False,
        help_text=_('True when all members have accepted and preferences are strictly aligned.')
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Roommate Group')
        verbose_name_plural = _('Roommate Groups')
        ordering = ['-created_at']

    def __str__(self):
        return f"Group #{self.id} for Room {self.target_room.room_number} ({self.members.count()} members)"

    @property
    def member_count(self) -> int:
        return self.members.count()


class RoommateGroupMember(models.Model):
    """Through-model representing membership in a mutual roommate group."""
    group = models.ForeignKey(
        RoommateGroup,
        on_delete=models.CASCADE,
        related_name='members',
        verbose_name=_('Roommate Group')
    )
    student = models.ForeignKey(
        'students.StudentProfile',
        on_delete=models.CASCADE,
        related_name='group_memberships',
        verbose_name=_('Student Member')
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Roommate Group Member')
        verbose_name_plural = _('Roommate Group Members')
        unique_together = ('group', 'student')

    def __str__(self):
        return f"{self.student.student_id} in {self.group}"


class MatchScore(models.Model):
    """
    Cached pairwise compatibility score calculated by the deterministic algorithm.
    Symmetric pairing enforced: student_a_id < student_b_id.
    """
    student_a = models.ForeignKey(
        'students.StudentProfile',
        on_delete=models.CASCADE,
        related_name='match_scores_as_a'
    )
    student_b = models.ForeignKey(
        'students.StudentProfile',
        on_delete=models.CASCADE,
        related_name='match_scores_as_b'
    )
    score = models.DecimalField(
        _('Compatibility Score (%)'),
        max_digits=5,
        decimal_places=2,
        help_text=_('Compatibility percentage between 0.00 and 100.00.')
    )
    algorithm_version = models.CharField(_('Algorithm Version'), max_length=20, default='v1.0')
    calculated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Roommate Match Score')
        verbose_name_plural = _('Roommate Match Scores')
        unique_together = ('student_a', 'student_b')
        indexes = [
            models.Index(fields=['student_a', 'student_b'], name='idx_match_pair'),
        ]

    def __str__(self):
        return f"{self.student_a.student_id} <-> {self.student_b.student_id}: {self.score:.2f}%"
