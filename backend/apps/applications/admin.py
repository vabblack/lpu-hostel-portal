"""
Admin configuration for Applications app.
"""
from django.contrib import admin
from .models import (
    AccommodationCycle,
    HostelApplication,
    ApplicationChoice,
    ApplicationStatusHistory,
)


class ApplicationChoiceInline(admin.TabularInline):
    model = ApplicationChoice
    extra = 1
    max_num = 3


class ApplicationStatusHistoryInline(admin.TabularInline):
    model = ApplicationStatusHistory
    extra = 0
    readonly_fields = ('from_status', 'to_status', 'changed_by', 'changed_at', 'notes')


@admin.register(AccommodationCycle)
class AccommodationCycleAdmin(admin.ModelAdmin):
    list_display = ('name', 'academic_year', 'semester', 'application_start', 'application_end', 'is_active')
    list_filter = ('is_active', 'academic_year', 'semester')
    search_fields = ('name', 'academic_year')


@admin.register(HostelApplication)
class HostelApplicationAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'cycle', 'status', 'submitted_at', 'reviewed_by')
    list_filter = ('status', 'cycle')
    search_fields = ('student__registry__student_id', 'student__registry__full_name')
    inlines = [ApplicationChoiceInline, ApplicationStatusHistoryInline]


@admin.register(ApplicationChoice)
class ApplicationChoiceAdmin(admin.ModelAdmin):
    list_display = ('application', 'priority', 'hostel', 'room')
    list_filter = ('priority', 'hostel')
