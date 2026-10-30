"""
Admin configuration for Audit app.
"""
from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'actor', 'action', 'target_model', 'target_id', 'ip_address')
    list_filter = ('action', 'target_model', 'timestamp')
    search_fields = ('actor__email', 'target_model', 'target_id', 'action')
    readonly_fields = ('actor', 'action', 'target_model', 'target_id', 'ip_address', 'changes_json', 'timestamp')

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
