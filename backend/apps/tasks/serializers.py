from rest_framework import serializers
from .models import Task
from apps.accounts.serializers import UserPublicSerializer


class TaskListSerializer(serializers.ModelSerializer):
    assigned_to = UserPublicSerializer(read_only=True)
    created_by = UserPublicSerializer(read_only=True)
    is_overdue = serializers.ReadOnlyField()
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'status', 'priority',
            'assigned_to', 'created_by', 'deadline', 'is_overdue',
            'message_count', 'created_at', 'updated_at'
        ]

    def get_message_count(self, obj):
        return obj.messages.count()


class TaskDetailSerializer(TaskListSerializer):
    class Meta(TaskListSerializer.Meta):
        fields = TaskListSerializer.Meta.fields + ['project']


class TaskCreateSerializer(serializers.ModelSerializer):
    assigned_to_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = Task
        fields = ['title', 'description', 'assigned_to_id', 'status', 'priority', 'deadline']

    def validate_assigned_to_id(self, user_id):
        if user_id is None:
            return None
        from django.contrib.auth import get_user_model
        from apps.projects.models import Membership
        User = get_user_model()

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise serializers.ValidationError('Assigned user does not exist.')

        project = self.context.get('project')
        if project and not Membership.objects.filter(user=user, project=project).exists():
            raise serializers.ValidationError('Assigned user is not a project member.')

        return user_id


class TaskUpdateSerializer(serializers.ModelSerializer):
    assigned_to_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = Task
        fields = ['title', 'description', 'assigned_to_id', 'status', 'priority', 'deadline']
        extra_kwargs = {field: {'required': False} for field in fields}

    def validate_assigned_to_id(self, user_id):
        if user_id is None:
            return None
        from django.contrib.auth import get_user_model
        from apps.projects.models import Membership
        User = get_user_model()

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise serializers.ValidationError('Assigned user does not exist.')

        task = self.instance
        if task and not Membership.objects.filter(user=user, project=task.project).exists():
            raise serializers.ValidationError('Assigned user is not a project member.')

        return user_id


class TaskStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Task.STATUS_CHOICES)
