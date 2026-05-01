from django.contrib import admin
from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'project', 'assigned_to', 'status', 'priority', 'deadline', 'created_at']
    list_filter = ['status', 'priority', 'created_at']
    search_fields = ['title', 'description', 'project__name', 'assigned_to__email']
    date_hierarchy = 'created_at'
    raw_id_fields = ['project', 'assigned_to', 'created_by']
