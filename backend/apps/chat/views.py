from rest_framework import generics, status, permissions
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Message
from .serializers import MessageSerializer, MessageCreateSerializer
from apps.tasks.models import Task
from apps.projects.permissions import is_project_member


class TaskMessageListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_task(self):
        task = get_object_or_404(Task, pk=self.kwargs['task_pk'])
        if not is_project_member(self.request.user, task.project):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You are not a member of this project.')
        return task

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MessageCreateSerializer
        return MessageSerializer

    def get_queryset(self):
        task = self.get_task()
        return Message.objects.filter(task=task).select_related('sender')

    def create(self, request, *args, **kwargs):
        task = self.get_task()
        serializer = MessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = Message.objects.create(
            task=task,
            sender=request.user,
            **serializer.validated_data
        )
        return Response(
            MessageSerializer(message).data,
            status=status.HTTP_201_CREATED
        )


class MessageDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MessageSerializer

    def get_queryset(self):
        return Message.objects.filter(
            task__project__memberships__user=self.request.user
        ).select_related('sender')

    def update(self, request, *args, **kwargs):
        message = self.get_object()
        if message.sender != request.user:
            return Response(
                {'detail': 'You can only edit your own messages.'},
                status=status.HTTP_403_FORBIDDEN
            )
        message.text = request.data.get('text', message.text)
        message.is_edited = True
        message.save()
        return Response(MessageSerializer(message).data)

    def destroy(self, request, *args, **kwargs):
        message = self.get_object()
        if message.sender != request.user:
            from apps.projects.permissions import is_project_owner
            if not is_project_owner(request.user, message.task.project):
                return Response(
                    {'detail': 'You can only delete your own messages.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        return super().destroy(request, *args, **kwargs)
