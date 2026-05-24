# Campus Event Manager Backend

FastAPI + MongoDB Atlas backend for the Campus Event Management mobile app.

This requirements file supports Python 3.14 by using Pydantic 2.12.x, which has
prebuilt `pydantic-core` wheels for CPython 3.14 on Windows. Older Pydantic
2.10.x may try to compile `pydantic-core` locally and require Visual Studio C++
Build Tools.

## Collections

- `users`
- `events`
- `notifications`
- `departments`

## Setup

```bash
cd campus-event-backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Set `MONGO_URL`, `DB_NAME=event`, and `SECRET_KEY`.

Run:

```bash
python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

Student registration is public. Admin and registrar accounts are created on startup from:

- `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- `REGISTRAR_EMAIL`, `REGISTRAR_PASSWORD`

## Notifications

In-app notifications are always saved in MongoDB. Email notifications are sent
through Brevo's transactional email API when these environment variables are set:

```bash
EMAIL_ENABLED=true
BREVO_API_KEY=your-brevo-api-key
EMAIL_FROM_EMAIL=verified-sender@example.com
EMAIL_FROM_NAME=Gauhati University Event Manager
EMAIL_NOTIFY_STUDENTS_ON_APPROVAL=true
EMAIL_MAX_RECIPIENTS_PER_EVENT=250
```

If email is not configured or an email send fails, the in-app notification still
works.

## Render

The repository root includes `render.yaml`, and this backend includes
`runtime.txt` pinned to Python 3.11.9 for stable hosted builds.

Render start command:

```bash
python -m uvicorn server:app --host 0.0.0.0 --port $PORT
```

See `../DEPLOYMENT.md` for the full backend deployment and APK workflow.
