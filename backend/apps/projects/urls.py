from django.urls import path
from .views import (
    ProjectListCreateView, ProjectDetailView,
    InviteMemberView, RemoveMemberView, LeaveProjectView
)

urlpatterns = [
    path('projects/', ProjectListCreateView.as_view(), name='project_list_create'),
    path('projects/<int:pk>/', ProjectDetailView.as_view(), name='project_detail'),
    path('projects/<int:pk>/invite/', InviteMemberView.as_view(), name='project_invite'),
    path('projects/<int:pk>/remove-member/', RemoveMemberView.as_view(), name='project_remove_member'),
    path('projects/<int:pk>/leave/', LeaveProjectView.as_view(), name='project_leave'),
]
