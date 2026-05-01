"""
Management command to seed the database with sample data for testing.
Usage: python manage.py seed_data
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.projects.models import Project, Membership
from apps.tasks.models import Task
from apps.chat.models import Message
from datetime import date, timedelta

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed database with sample data for testing'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')

        # Users
        alice = self._create_user('alice', 'alice@example.com', 'password123', 'Alice', 'Johnson')
        bob = self._create_user('bob', 'bob@example.com', 'password123', 'Bob', 'Smith')
        carol = self._create_user('carol', 'carol@example.com', 'password123', 'Carol', 'Davis')

        # Project 1: Website Redesign (Alice owns)
        p1 = Project.objects.get_or_create(name='Website Redesign', owner=alice, defaults={
            'description': 'Complete overhaul of the company website with new branding.'
        })[0]
        Membership.objects.get_or_create(user=alice, project=p1, defaults={'role': 'owner'})
        Membership.objects.get_or_create(user=bob, project=p1, defaults={'role': 'member'})
        Membership.objects.get_or_create(user=carol, project=p1, defaults={'role': 'member'})

        t1 = self._create_task(p1, alice, 'Design new homepage mockups', 'Create wireframes and high-fidelity designs for the new homepage.', bob, 'in_progress', 'high', date.today() + timedelta(days=5))
        t2 = self._create_task(p1, alice, 'Set up CI/CD pipeline', 'Configure GitHub Actions for automated testing and deployment.', carol, 'todo', 'medium', date.today() + timedelta(days=10))
        t3 = self._create_task(p1, alice, 'Write API documentation', 'Document all REST endpoints using OpenAPI spec.', bob, 'done', 'low', date.today() - timedelta(days=2))

        # Messages on task 1
        Message.objects.get_or_create(task=t1, sender=alice, text='Hey Bob, can you share the brand guidelines first?')
        Message.objects.get_or_create(task=t1, sender=bob, text='Sure! I\'ll send them over by EOD.')
        Message.objects.get_or_create(task=t1, sender=carol, text='Also need the competitor analysis from last quarter.')

        # Project 2: Mobile App (Bob owns)
        p2 = Project.objects.get_or_create(name='Mobile App v2', owner=bob, defaults={
            'description': 'React Native mobile app with offline support.'
        })[0]
        Membership.objects.get_or_create(user=bob, project=p2, defaults={'role': 'owner'})
        Membership.objects.get_or_create(user=alice, project=p2, defaults={'role': 'member'})

        t4 = self._create_task(p2, bob, 'Implement offline sync', 'Use Redux Persist and background sync for offline data.', alice, 'in_progress', 'high', date.today() + timedelta(days=3))
        t5 = self._create_task(p2, bob, 'Push notification setup', 'Integrate Firebase Cloud Messaging for iOS and Android.', bob, 'todo', 'medium', date.today() + timedelta(days=14))

        Message.objects.get_or_create(task=t4, sender=bob, text='Alice, check out the Redux Toolkit docs for RTK Query - might simplify this.')
        Message.objects.get_or_create(task=t4, sender=alice, text='Good call. I\'ll explore that approach.')

        self.stdout.write(self.style.SUCCESS('''
✅ Sample data created!

Test accounts:
  alice@example.com / password123  (owns: Website Redesign)
  bob@example.com / password123    (owns: Mobile App v2, member: Website Redesign)
  carol@example.com / password123  (member: Website Redesign)
        '''))

    def _create_user(self, username, email, password, first='', last=''):
        user, created = User.objects.get_or_create(
            email=email,
            defaults={'username': username, 'first_name': first, 'last_name': last}
        )
        if created:
            user.set_password(password)
            user.save()
        return user

    def _create_task(self, project, created_by, title, desc, assigned_to, status, priority, deadline):
        task, _ = Task.objects.get_or_create(
            title=title,
            project=project,
            defaults={
                'description': desc,
                'created_by': created_by,
                'assigned_to': assigned_to,
                'status': status,
                'priority': priority,
                'deadline': deadline,
            }
        )
        return task
