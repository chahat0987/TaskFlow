from django.urls import path
from .views import ProjectTaskListCreateView, TaskDetailView, MyTasksView

urlpatterns = [
    path('projects/<int:project_pk>/tasks/', ProjectTaskListCreateView.as_view(), name='task_list_create'),
    path('tasks/<int:pk>/', TaskDetailView.as_view(), name='task_detail'),
    path('tasks/mine/', MyTasksView.as_view(), name='my_tasks'),
]
