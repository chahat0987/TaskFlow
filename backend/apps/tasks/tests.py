from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.tasks.models import Task
from apps.projects.models import Project

User = get_user_model()


class TaskTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="test123"
        )

        # ✅ correct field: owner
        self.project = Project.objects.create(
            name="Test Project",
            owner=self.user
        )

    def test_create_task(self):
        task = Task.objects.create(
            title="Test Task",
            project=self.project,
            created_by=self.user
        )

        self.assertEqual(task.title, "Test Task")