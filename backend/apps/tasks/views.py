from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import Task
from .serializers import (
    TaskListSerializer, TaskDetailSerializer,
    TaskCreateSerializer, TaskUpdateSerializer,
    TaskStatusUpdateSerializer
)
from apps.projects.models import Project
from apps.projects.permissions import is_project_owner, is_project_member


class ProjectTaskListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status', 'priority', 'assigned_to']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'deadline', 'priority', 'status']

    def get_project(self):
        project = get_object_or_404(Project, pk=self.kwargs['project_pk'])
        if not is_project_member(self.request.user, project):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You are not a member of this project.')
        return project

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TaskCreateSerializer
        return TaskListSerializer

    def get_queryset(self):
        project = self.get_project()
        return Task.objects.filter(project=project).select_related(
            'assigned_to', 'created_by'
        )

    def create(self, request, *args, **kwargs):
        project = self.get_project()

        if not is_project_owner(request.user, project):
            return Response(
                {'detail': 'Only the project owner can create tasks.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = TaskCreateSerializer(
            data=request.data,
            context={'request': request, 'project': project}
        )
        serializer.is_valid(raise_exception=True)

        task = Task.objects.create(
            project=project,
            created_by=request.user,
            **{k: v for k, v in serializer.validated_data.items() if k != 'assigned_to_id'},
            assigned_to_id=serializer.validated_data.get('assigned_to_id')
        )

        return Response(
            TaskDetailSerializer(task).data,
            status=status.HTTP_201_CREATED
        )


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(
            project__memberships__user=self.request.user
        ).select_related('assigned_to', 'created_by', 'project')

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return TaskUpdateSerializer
        return TaskDetailSerializer

    def update(self, request, *args, **kwargs):
        task = self.get_object()
        user = request.user
        is_owner = is_project_owner(user, task.project)
        is_assignee = task.assigned_to == user

        # Owner can update anything; assignee can only update status
        if not is_owner and not is_assignee:
            return Response(
                {'detail': 'You do not have permission to update this task.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if not is_owner and is_assignee:
            # Members can only update status
            allowed_fields = {'status'}
            provided_fields = set(request.data.keys())
            disallowed = provided_fields - allowed_fields
            if disallowed:
                return Response(
                    {'detail': f'Members can only update status. Disallowed fields: {disallowed}'},
                    status=status.HTTP_403_FORBIDDEN
                )

        partial = kwargs.pop('partial', False)
        serializer = TaskUpdateSerializer(task, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        for attr, value in serializer.validated_data.items():
            if attr == 'assigned_to_id':
                task.assigned_to_id = value
            else:
                setattr(task, attr, value)
        task.save()

        return Response(TaskDetailSerializer(task).data)

    def destroy(self, request, *args, **kwargs):
        task = self.get_object()
        if not is_project_owner(request.user, task.project):
            return Response(
                {'detail': 'Only the project owner can delete tasks.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


class MyTasksView(generics.ListAPIView):
    """List all tasks assigned to the current user across all projects."""
    serializer_class = TaskDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status', 'priority']
    ordering_fields = ['deadline', 'created_at', 'status']

    def get_queryset(self):
        return Task.objects.filter(
            assigned_to=self.request.user
        ).select_related('assigned_to', 'created_by', 'project')
