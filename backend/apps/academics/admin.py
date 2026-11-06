"""
Admin configuration for Academics app.
"""
from django.contrib import admin
from .models import (
    University,
    Department,
    DegreeProgram,
    Branch,
    AdmissionBatch,
    StudentRegistry,
    StudentEnrollment,
)


@admin.register(University)
class UniversityAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'created_at')
    search_fields = ('name', 'code')


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'university', 'created_at')
    list_filter = ('university',)
    search_fields = ('name', 'code')


@admin.register(DegreeProgram)
class DegreeProgramAdmin(admin.ModelAdmin):
    list_display = ('name', 'department', 'duration_years', 'created_at')
    list_filter = ('department__university', 'department')
    search_fields = ('name',)


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'program', 'created_at')
    list_filter = ('program__department__university', 'program')
    search_fields = ('name', 'code')


@admin.register(AdmissionBatch)
class AdmissionBatchAdmin(admin.ModelAdmin):
    list_display = ('year', 'program', 'created_at')
    list_filter = ('year', 'program')
    search_fields = ('year',)


@admin.register(StudentRegistry)
class StudentRegistryAdmin(admin.ModelAdmin):
    list_display = ('student_id', 'full_name', 'institutional_email', 'gender', 'branch', 'batch', 'is_registered', 'enrollment_status')
    list_filter = ('gender', 'is_registered', 'enrollment_status', 'branch', 'batch')
    search_fields = ('student_id', 'full_name', 'institutional_email')
    ordering = ('student_id',)


@admin.register(StudentEnrollment)
class StudentEnrollmentAdmin(admin.ModelAdmin):
    list_display = ('registry', 'academic_year', 'semester', 'status', 'created_at')
    list_filter = ('academic_year', 'semester', 'status')
    search_fields = ('registry__student_id', 'registry__full_name')
