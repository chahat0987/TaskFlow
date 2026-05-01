from django.contrib import admin
from .models import Message


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['sender', 'task', 'text_preview', 'is_edited', 'created_at']
    list_filter = ['is_edited', 'created_at']
    search_fields = ['text', 'sender__email', 'task__title']

    def text_preview(self, obj):
        return obj.text[:80]
    text_preview.short_description = 'Message'
