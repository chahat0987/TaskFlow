from rest_framework import serializers
from .models import Message
from apps.accounts.serializers import UserPublicSerializer


class MessageSerializer(serializers.ModelSerializer):
    sender = UserPublicSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'task', 'sender', 'text', 'is_edited', 'created_at', 'updated_at']
        read_only_fields = ['id', 'task', 'sender', 'is_edited', 'created_at', 'updated_at']


class MessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['text']
