"""
Hostels Models: Physical accommodation hierarchy, rooms, beds, facilities, and warden assignments.
"""
from django.conf import settings
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from django.db import models
from django.utils.translation import gettext_lazy as _


class GenderPolicy(models.TextChoices):
    """Hostel gender segregation policy."""
    MALE = 'MALE', _('Boys Hostel')
    FEMALE = 'FEMALE', _('Girls Hostel')
    CO_ED = 'CO_ED', _('Co-Educational')


class HostelStatus(models.TextChoices):
    """Operational status of a hostel."""
    ACTIVE = 'ACTIVE', _('Active')
    MAINTENANCE = 'MAINTENANCE', _('Under Maintenance')
    INACTIVE = 'INACTIVE', _('Inactive / Closed')


class RoomStatus(models.TextChoices):
    """Availability status of a room."""
    AVAILABLE = 'AVAILABLE', _('Available')
    FULL = 'FULL', _('Full (Capacity Reached)')
    MAINTENANCE = 'MAINTENANCE', _('Under Maintenance')


class WashroomType(models.TextChoices):
    """Washroom facility type in room."""
    ATTACHED = 'ATTACHED', _('Attached Washroom')
    SHARED = 'SHARED', _('Shared / Common Washroom')


class BedStatus(models.TextChoices):
    """Individual bed occupancy status."""
    VACANT = 'VACANT', _('Vacant / Available')
    OCCUPIED = 'OCCUPIED', _('Occupied')
    RESERVED = 'RESERVED', _('Reserved / Pending Allocation')
    MAINTENANCE = 'MAINTENANCE', _('Under Maintenance')


class Hostel(models.Model):
    """Hostel building entity."""
    university = models.ForeignKey(
        'academics.University',
        on_delete=models.CASCADE,
        related_name='hostels',
        verbose_name=_('University')
    )
    name = models.CharField(_('Hostel Name'), max_length=100, unique=True)
    code = models.CharField(_('Hostel Code'), max_length=20, unique=True)
    gender_policy = models.CharField(
        _('Gender Policy'),
        max_length=10,
        choices=GenderPolicy.choices,
        default=GenderPolicy.MALE,
        help_text=_('Enforces gender eligibility rules for room allocation.')
    )
    status = models.CharField(
        _('Status'),
        max_length=20,
        choices=HostelStatus.choices,
        default=HostelStatus.ACTIVE
    )
    total_capacity = models.PositiveIntegerField(
        _('Total Capacity (Beds)'),
        default=0,
        help_text=_('Total theoretical bed count.')
    )
    description = models.TextField(_('Description'), blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Hostel')
        verbose_name_plural = _('Hostels')
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code}) - {self.get_gender_policy_display()}"


class WardenAssignment(models.Model):
    """
    Assigns a Warden (User) to oversee a specific Hostel.
    Includes delegated allocation approval authority flag.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='warden_assignments',
        verbose_name=_('Warden')
    )
    hostel = models.ForeignKey(
        Hostel,
        on_delete=models.CASCADE,
        related_name='warden_assignments',
        verbose_name=_('Hostel')
    )
    can_approve_allocation = models.BooleanField(
        _('Delegated Approval Authority'),
        default=False,
        help_text=_('Allows warden to give final approval for bed allocations without admin sign-off.')
    )
    is_active = models.BooleanField(_('Active Assignment'), default=True)
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Warden Assignment')
        verbose_name_plural = _('Warden Assignments')
        unique_together = ('user', 'hostel')
        ordering = ['hostel', 'user']

    def __str__(self):
        delegated = " [Can Approve]" if self.can_approve_allocation else " [Review Only]"
        return f"{self.user.email} -> {self.hostel.code}{delegated}"

    def clean(self):
        try:
            if self.user and self.user.role != 'WARDEN' and not self.user.is_superuser:
                raise ValidationError(_('Assigned user must hold the WARDEN role.'))
        except (AttributeError, ObjectDoesNotExist):
            pass


class Block(models.Model):
    """Wing or block within a hostel building."""
    hostel = models.ForeignKey(
        Hostel,
        on_delete=models.CASCADE,
        related_name='blocks',
        verbose_name=_('Hostel')
    )
    name = models.CharField(_('Block Name'), max_length=50) # e.g., 'Block A'
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Hostel Block')
        verbose_name_plural = _('Hostel Blocks')
        unique_together = ('hostel', 'name')
        ordering = ['hostel', 'name']

    def __str__(self):
        return f"{self.hostel.code} - {self.name}"


class Floor(models.Model):
    """Floor level within a block."""
    block = models.ForeignKey(
        Block,
        on_delete=models.CASCADE,
        related_name='floors',
        verbose_name=_('Block')
    )
    floor_number = models.SmallIntegerField(
        _('Floor Number'),
        help_text=_('0 for Ground Floor, 1 for First Floor, etc.')
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Floor')
        verbose_name_plural = _('Floors')
        unique_together = ('block', 'floor_number')
        ordering = ['block', 'floor_number']

    def __str__(self):
        label = "Ground Floor" if self.floor_number == 0 else f"Floor {self.floor_number}"
        return f"{self.block} - {label}"


class Facility(models.Model):
    """Configurable room amenities (AC, Attached Washroom, Geyser, Balcony, etc.)."""
    name = models.CharField(_('Facility Name'), max_length=100, unique=True)
    description = models.TextField(_('Description'), blank=True, default='')

    class Meta:
        verbose_name = _('Facility')
        verbose_name_plural = _('Facilities')
        ordering = ['name']

    def __str__(self):
        return self.name


class Room(models.Model):
    """Hostel room unit."""
    floor = models.ForeignKey(
        Floor,
        on_delete=models.CASCADE,
        related_name='rooms',
        verbose_name=_('Floor')
    )
    room_number = models.CharField(_('Room Number'), max_length=20) # e.g., '101'
    capacity = models.PositiveSmallIntegerField(
        _('Bed Capacity'),
        choices=[
            (1, _('1-Seater / Single')),
            (2, _('2-Seater / Double')),
            (3, _('3-Seater / Triple')),
            (4, _('4-Seater / Four-Bed')),
        ],
        default=2,
        help_text=_('Maximum number of occupants allowed.')
    )
    washroom_type = models.CharField(
        _('Washroom Type'),
        max_length=20,
        choices=WashroomType.choices,
        default=WashroomType.ATTACHED
    )
    is_air_conditioned = models.BooleanField(
        _('Air Conditioned'),
        default=False
    )
    status = models.CharField(
        _('Room Status'),
        max_length=20,
        choices=RoomStatus.choices,
        default=RoomStatus.AVAILABLE,
        db_index=True
    )
    facilities = models.ManyToManyField(
        Facility,
        through='RoomFacility',
        related_name='rooms',
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Room')
        verbose_name_plural = _('Rooms')
        unique_together = ('floor', 'room_number')
        ordering = ['floor', 'room_number']
        indexes = [
            models.Index(fields=['status', 'capacity'], name='idx_room_status_cap'),
        ]

    def __str__(self):
        ac_label = "AC" if self.is_air_conditioned else "Non-AC"
        return f"Room {self.room_number} ({self.floor.block.hostel.code}) - {self.capacity}B ({ac_label})"

    @property
    def vacant_beds_count(self) -> int:
        """Count of currently vacant beds in this room."""
        return self.beds.filter(status=BedStatus.VACANT).count()

    @property
    def occupied_beds_count(self) -> int:
        """Count of currently occupied beds in this room."""
        return self.beds.filter(status=BedStatus.OCCUPIED).count()

    @property
    def is_full(self) -> bool:
        """True if no vacant beds exist in this room."""
        return self.vacant_beds_count == 0


class RoomFacility(models.Model):
    """Through table associating rooms with specific facilities."""
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    facility = models.ForeignKey(Facility, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('room', 'facility')
        verbose_name = _('Room Facility')
        verbose_name_plural = _('Room Facilities')

    def __str__(self):
        return f"{self.room} has {self.facility}"


class Bed(models.Model):
    """Individual bed unit within a room."""
    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name='beds',
        verbose_name=_('Room')
    )
    bed_identifier = models.CharField(
        _('Bed Identifier'),
        max_length=10,
        help_text=_('E.g., A, B, C, D.')
    )
    status = models.CharField(
        _('Bed Status'),
        max_length=20,
        choices=BedStatus.choices,
        default=BedStatus.VACANT,
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Bed')
        verbose_name_plural = _('Beds')
        unique_together = ('room', 'bed_identifier')
        ordering = ['room', 'bed_identifier']
        indexes = [
            models.Index(fields=['room', 'status'], name='idx_bed_room_status'),
        ]

    def __str__(self):
        return f"{self.room.room_number}-{self.bed_identifier} ({self.get_status_display()})"
