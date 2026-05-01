from django.contrib import admin
from .models import Project, Membership


class MembershipInline(admin.TabularInline):
    model = Membership
    extra = 0
    readonly_fields = ['joined_at']


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'get_member_count', 'get_task_count', 'created_at']
    search_fields = ['name', 'owner__email']
    list_filter = ['created_at']
    inlines = [MembershipInline]

    def get_member_count(self, obj):
        return obj.memberships.count()
    get_member_count.short_description = 'Members'

    def get_task_count(self, obj):
        return obj.tasks.count()
    get_task_count.short_description = 'Tasks'


@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ['user', 'project', 'role', 'joined_at']
    list_filter = ['role']
    search_fields = ['user__email', 'project__name']
