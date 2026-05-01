# TaskFlow

A production-ready project management system with decentralized ownership, task tracking, and task-level chat — built with **Django REST Framework** + **React**.

---

## Architecture

```
taskflow/
├── backend/          # Django + DRF API
│   ├── apps/
│   │   ├── accounts/ # Auth, custom User model
│   │   ├── projects/ # Projects & memberships
│   │   ├── tasks/    # Task management
│   │   └── chat/     # Per-task messaging
│   └── taskflow_project/  # Django settings & URLs
└── frontend/         # React + Vite + TailwindCSS
    └── src/
        ├── api/      # Axios client + API functions
        ├── components/
        ├── context/  # Auth context
        └── pages/    # Route-level views
```

---

## Features

| Feature | Detail |
|---|---|
| Auth | JWT (access + refresh), auto-refresh on 401 |
| Projects | Create, invite members, remove members, leave |
| Roles | Owner (full control) / Member (view + own tasks) |
| Tasks | Title, description, assignee, status, priority, deadline |
| Task Chat | Per-task threaded messages, edit & delete own messages |
| My Tasks | Aggregated cross-project task view |
| Overdue detection | Server + client-side deadline tracking |

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

---

### Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your SECRET_KEY

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Seed sample data (optional)
python manage.py seed_data

# Start development server
python manage.py runserver
```

API will be live at: **http://localhost:8000**
Admin panel: **http://localhost:8000/admin**

---

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

App will be live at: **http://localhost:3000**

> The Vite dev server proxies `/api/*` to `http://localhost:8000` automatically.

---

## API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup/` | Register new user |
| POST | `/api/auth/login/` | Login → access + refresh tokens |
| POST | `/api/auth/refresh/` | Refresh access token |
| GET/PATCH | `/api/auth/me/` | Get/update own profile |
| POST | `/api/auth/change-password/` | Change password |
| GET | `/api/users/search/?q=email` | Search users by email |

### Projects
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects/` | List my projects |
| POST | `/api/projects/` | Create project (auto-become owner) |
| GET | `/api/projects/{id}/` | Project details + members |
| PATCH | `/api/projects/{id}/` | Update project (owner only) |
| DELETE | `/api/projects/{id}/` | Delete project (owner only) |
| POST | `/api/projects/{id}/invite/` | Invite member by email (owner only) |
| DELETE | `/api/projects/{id}/remove-member/` | Remove member (owner only) |
| POST | `/api/projects/{id}/leave/` | Leave project (non-owner) |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects/{id}/tasks/` | List project tasks |
| POST | `/api/projects/{id}/tasks/` | Create task (owner only) |
| GET | `/api/tasks/{id}/` | Task detail |
| PATCH | `/api/tasks/{id}/` | Update task (owner: any field; assignee: status only) |
| DELETE | `/api/tasks/{id}/` | Delete task (owner only) |
| GET | `/api/tasks/mine/` | My tasks across all projects |

### Chat
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks/{id}/messages/` | List task messages |
| POST | `/api/tasks/{id}/messages/` | Send message |
| PATCH | `/api/messages/{id}/` | Edit own message |
| DELETE | `/api/messages/{id}/` | Delete own message |

---

## Permission Model

```
Project Owner → full CRUD on project, members, tasks, any message
Project Member → view tasks, update own task's status, send/edit/delete own messages
Non-member → no access to any project resource
```

---

## Environment Variables

### Backend (`backend/.env`)
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Production PostgreSQL (optional in dev)
# DATABASE_URL=postgres://user:pass@host:5432/dbname
```

---

## Production Deployment

### Backend (Render / Railway)

1. Set environment variables in your host dashboard
2. Set `DEBUG=False`
3. Set `DATABASE_URL` to your PostgreSQL URL
4. Set `ALLOWED_HOSTS` to your domain
5. Run build command: `pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput`
6. Start command: `gunicorn taskflow_project.wsgi`

### Frontend (Vercel / Netlify)

1. Set build command: `npm run build`
2. Set output directory: `dist`
3. Set env variable: `VITE_API_BASE_URL=https://your-backend.com`
4. Update the `proxy` in `vite.config.js` or use absolute URLs in production

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django 5, Django REST Framework, SimpleJWT |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Frontend | React 18, Vite, TailwindCSS |
| State | TanStack Query (server state), React Context (auth) |
| HTTP | Axios with JWT interceptors |
| UI Fonts | Fraunces (display), DM Sans (body), JetBrains Mono |

---

## Sample Test Accounts

After running `python manage.py seed_data`:

| Email | Password | Role |
|---|---|---|
| alice@example.com | password123 | Owner of "Website Redesign" |
| bob@example.com | password123 | Owner of "Mobile App v2", member of Website Redesign |
| carol@example.com | password123 | Member of "Website Redesign" |
