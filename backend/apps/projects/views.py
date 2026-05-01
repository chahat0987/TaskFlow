from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import Project, Membership
from .permissions import is_project_owner, is_project_member
from .serializers import (
    ProjectListSerializer, ProjectDetailSerializer,
    ProjectCreateSerializer, InviteMemberSerializer,
    RemoveMemberSerializer, MembershipSerializer
)


class ProjectListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProjectCreateSerializer
        return ProjectListSerializer

    def get_queryset(self):
        return Project.objects.filter(
            memberships__user=self.request.user
        ).prefetch_related('memberships', 'memberships__user').select_related('owner')

    def perform_create(self, serializer):
        serializer.save()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = serializer.save()
        return Response(
            ProjectDetailSerializer(project, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ProjectCreateSerializer
        return ProjectDetailSerializer

    def get_queryset(self):
        return Project.objects.filter(
            memberships__user=self.request.user
        ).prefetch_related('memberships', 'memberships__user').select_related('owner')

    def update(self, request, *args, **kwargs):
        project = self.get_object()
        if not is_project_owner(request.user, project):
            return Response(
                {'detail': 'Only the project owner can update this project.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        project = self.get_object()
        if not is_project_owner(request.user, project):
            return Response(
                {'detail': 'Only the project owner can delete this project.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


class InviteMemberView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        project = get_object_or_404(Project, pk=pk)

        if not is_project_owner(request.user, project):
            return Response(
                {'detail': 'Only the project owner can invite members.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = InviteMemberSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        invite_user = serializer.context['invite_user']

        if Membership.objects.filter(user=invite_user, project=project).exists():
            return Response(
                {'detail': 'User is already a member of this project.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        membership = Membership.objects.create(
            user=invite_user,
            project=project,
            role=Membership.ROLE_MEMBER
        )
        return Response(
            MembershipSerializer(membership).data,
            status=status.HTTP_201_CREATED
        )


class RemoveMemberView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        project = get_object_or_404(Project, pk=pk)

        if not is_project_owner(request.user, project):
            return Response(
                {'detail': 'Only the project owner can remove members.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = RemoveMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        remove_user = serializer.context.get('remove_user')

        if not remove_user:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                remove_user = User.objects.get(id=serializer.validated_data['user_id'])
            except User.DoesNotExist:
                return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        if remove_user == request.user:
            return Response(
                {'detail': 'Owner cannot remove themselves.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        deleted, _ = Membership.objects.filter(
            user=remove_user,
            project=project
        ).delete()

        if not deleted:
            return Response(
                {'detail': 'User is not a member of this project.'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(status=status.HTTP_204_NO_CONTENT)


class LeaveProjectView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        project = get_object_or_404(Project, pk=pk)

        if project.owner == request.user:
            return Response(
                {'detail': 'Owner cannot leave the project. Transfer ownership or delete the project.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        deleted, _ = Membership.objects.filter(
            user=request.user,
            project=project
        ).delete()

        if not deleted:
            return Response(
                {'detail': 'You are not a member of this project.'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(status=status.HTTP_204_NO_CONTENT)
