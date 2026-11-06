"""
Admin configuration for Allocations app.
"""
from django.contrib import admin
from .models import Allocation, AllocationHistory


class AllocationHistoryInline(admin.TabularInline):
    model = AllocationHistory
    extra = 0
    readonly_fields = ('action', 'previous_bed', 'new_bed', 'recorded_by', 'timestamp', 'notes')


@admin.register(Allocation)
class AllocationAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'bed', 'cycle', 'allocated_by', 'start_date', 'end_date', 'is_active')
    list_filter = ('is_active', 'cycle', 'bed__room__floor__block__hostel')
    search_fields = ('student__registry__student_id', 'student__registry__full_name', 'bed__bed_identifier', 'bed__room__room_number')
    inlines = [AllocationHistoryInline]


@admin.register(AllocationHistory)
class AllocationHistoryAdmin(admin.ModelAdmin):
    list_display = ('allocation', 'action', 'previous_bed', 'new_bed', 'recorded_by', 'timestamp')
    list_filter = ('action',)
    search_fields = ('allocation__student__registry__student_id',)
