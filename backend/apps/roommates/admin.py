"""
Admin configuration for Roommates app.
"""
from django.contrib import admin
from .models import (
    RoommatePreference,
    RoommateRequest,
    RoommateGroup,
    RoommateGroupMember,
    MatchScore,
)


class RoommateGroupMemberInline(admin.TabularInline):
    model = RoommateGroupMember
    extra = 1


@admin.register(RoommatePreference)
class RoommatePreferenceAdmin(admin.ModelAdmin):
    list_display = ('student', 'sleeping_schedule', 'cleanliness', 'study_habits', 'noise_tolerance', 'food_preference', 'temperature_pref', 'updated_at')
    list_filter = ('food_preference', 'sleeping_schedule', 'cleanliness')
    search_fields = ('student__registry__student_id', 'student__registry__full_name')


@admin.register(RoommateRequest)
class RoommateRequestAdmin(admin.ModelAdmin):
    list_display = ('sender', 'receiver', 'cycle', 'status', 'created_at', 'responded_at')
    list_filter = ('status', 'cycle')
    search_fields = ('sender__registry__student_id', 'receiver__registry__student_id')


@admin.register(RoommateGroup)
class RoommateGroupAdmin(admin.ModelAdmin):
    list_display = ('id', 'target_room', 'cycle', 'is_confirmed', 'created_at')
    list_filter = ('is_confirmed', 'cycle')
    inlines = [RoommateGroupMemberInline]


@admin.register(MatchScore)
class MatchScoreAdmin(admin.ModelAdmin):
    list_display = ('student_a', 'student_b', 'score', 'algorithm_version', 'calculated_at')
    search_fields = ('student_a__registry__student_id', 'student_b__registry__student_id')
