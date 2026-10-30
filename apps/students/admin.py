"""
Admin configuration for Students app.
"""
from django.contrib import admin
from .models import StudentProfile


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ('get_student_id', 'get_full_name', 'get_email', 'profile_completed', 'created_at')
    list_filter = ('profile_completed', 'registry__gender', 'registry__branch')
    search_fields = ('registry__student_id', 'registry__full_name', 'user__email')
    ordering = ('registry__student_id',)

    @admin.display(description='Student ID')
    def get_student_id(self, obj):
        return obj.registry.student_id

    @admin.display(description='Full Name')
    def get_full_name(self, obj):
        return obj.registry.full_name

    @admin.display(description='Email')
    def get_email(self, obj):
        return obj.user.email
