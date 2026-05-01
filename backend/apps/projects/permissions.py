from rest_framework import permissions
from .models import Membership


class IsProjectMember(permissions.BasePermission):
    """Allow access only to project members."""

    def has_object_permission(self, request, view, obj):
        return Membership.objects.filter(
            user=request.user,
            project=obj
        ).exists()


class IsProjectOwner(permissions.BasePermission):
    """Allow access only to the project owner."""

    def has_object_permission(self, request, view, obj):
        return Membership.objects.filter(
            user=request.user,
            project=obj,
            role=Membership.ROLE_OWNER
        ).exists()


def is_project_owner(user, project):
    return Membership.objects.filter(
        user=user,
        project=project,
        role=Membership.ROLE_OWNER
    ).exists()


def is_project_member(user, project):
    return Membership.objects.filter(
        user=user,
        project=project
    ).exists()
