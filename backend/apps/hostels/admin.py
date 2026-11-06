"""
Admin configuration for Hostels app.
"""
from django.contrib import admin
from .models import (
    Hostel,
    Block,
    Floor,
    Facility,
    Room,
    RoomFacility,
    Bed,
    WardenAssignment,
)


class BedInline(admin.TabularInline):
    model = Bed
    extra = 1


class RoomFacilityInline(admin.TabularInline):
    model = RoomFacility
    extra = 1


@admin.register(Hostel)
class HostelAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'university', 'gender_policy', 'status', 'total_capacity', 'created_at')
    list_filter = ('gender_policy', 'status', 'university')
    search_fields = ('name', 'code')


@admin.register(WardenAssignment)
class WardenAssignmentAdmin(admin.ModelAdmin):
    list_display = ('user', 'hostel', 'can_approve_allocation', 'is_active', 'assigned_at')
    list_filter = ('can_approve_allocation', 'is_active', 'hostel')
    search_fields = ('user__email', 'hostel__name', 'hostel__code')


@admin.register(Block)
class BlockAdmin(admin.ModelAdmin):
    list_display = ('name', 'hostel', 'created_at')
    list_filter = ('hostel',)
    search_fields = ('name', 'hostel__code')


@admin.register(Floor)
class FloorAdmin(admin.ModelAdmin):
    list_display = ('floor_number', 'block', 'created_at')
    list_filter = ('block__hostel', 'block')


@admin.register(Facility)
class FacilityAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('room_number', 'floor', 'capacity', 'washroom_type', 'is_air_conditioned', 'status', 'vacant_beds_count')
    list_filter = ('status', 'capacity', 'is_air_conditioned', 'washroom_type', 'floor__block__hostel')
    search_fields = ('room_number', 'floor__block__hostel__code')
    inlines = [BedInline, RoomFacilityInline]


@admin.register(Bed)
class BedAdmin(admin.ModelAdmin):
    list_display = ('bed_identifier', 'room', 'status', 'created_at')
    list_filter = ('status', 'room__floor__block__hostel')
    search_fields = ('bed_identifier', 'room__room_number', 'room__floor__block__hostel__code')
