from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Project, Membership
from apps.accounts.serializers import UserPublicSerializer

User = get_user_model()


class MembershipSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)

    class Meta:
        model = Membership
        fields = ['id', 'user', 'role', 'joined_at']


class ProjectListSerializer(serializers.ModelSerializer):
    owner = UserPublicSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()
    task_count = serializers.SerializerMethodField()
    my_role = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'owner', 'member_count',
                  'task_count', 'my_role', 'created_at']

    def get_member_count(self, obj):
        return obj.memberships.count()

    def get_task_count(self, obj):
        return obj.tasks.count()

    def get_my_role(self, obj):
        request = self.context.get('request')
        if request:
            membership = obj.memberships.filter(user=request.user).first()
            return membership.role if membership else None
        return None


class ProjectDetailSerializer(ProjectListSerializer):
    members = MembershipSerializer(source='memberships', many=True, read_only=True)

    class Meta(ProjectListSerializer.Meta):
        fields = ProjectListSerializer.Meta.fields + ['members', 'updated_at']


class ProjectCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['name', 'description']

    def create(self, validated_data):
        user = self.context['request'].user
        project = Project.objects.create(owner=user, **validated_data)
        # Auto-add owner as member with 'owner' role
        Membership.objects.create(
            user=user,
            project=project,
            role=Membership.ROLE_OWNER
        )
        return project


class InviteMemberSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, email):
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError('User with this email does not exist.')
        self.context['invite_user'] = user
        return email


class RemoveMemberSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()

    def validate_user_id(self, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise serializers.ValidationError('User not found.')
        self.context['remove_user'] = user
        return user_id
