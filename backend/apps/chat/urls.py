from django.urls import path
from .views import TaskMessageListCreateView, MessageDetailView

urlpatterns = [
    path('tasks/<int:task_pk>/messages/', TaskMessageListCreateView.as_view(), name='message_list_create'),
    path('messages/<int:pk>/', MessageDetailView.as_view(), name='message_detail'),
]
