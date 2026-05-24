# Render Backend + Android APK Setup

This project is ready for a Render backend deployment and an EAS Android APK build.

## 1. Deploy the Backend on Render

Push this project to GitHub first. Then use either the Blueprint path or the manual path.

### Option A: Render Blueprint

1. Open Render.
2. Choose **New > Blueprint**.
3. Select the GitHub repository.
4. Render will read `render.yaml`.
5. Add the secret environment variables when Render asks for them.

### Option B: Manual Render Web Service

Create a new **Web Service** with these settings:

```text
Root Directory: campus-event-backend
Runtime: Python
Build Command: pip install -r requirements.txt
Start Command: python -m uvicorn server:app --host 0.0.0.0 --port $PORT
```

Do not use a Node runtime for the backend. The repository also contains the
Expo mobile app, so Render may autodetect Node if the root directory is not set
to `campus-event-backend`.

Set these environment variables:

```text
MONGO_URL=mongodb+srv://YOUR_USER:YOUR_ENCODED_PASSWORD@cluster0.wtro3b9.mongodb.net/
DB_NAME=event
SECRET_KEY=generate-a-long-random-secret
ADMIN_EMAIL=admin@test.com
ADMIN_PASSWORD=your-admin-password
REGISTRAR_EMAIL=registrar@test.com
REGISTRAR_PASSWORD=your-registrar-password
EMAIL_ENABLED=true
BREVO_API_KEY=your-brevo-api-key
EMAIL_FROM_EMAIL=your-verified-brevo-sender@example.com
EMAIL_FROM_NAME=Gauhati University Event Manager
EMAIL_NOTIFY_STUDENTS_ON_APPROVAL=true
EMAIL_MAX_RECIPIENTS_PER_EVENT=250
```

Important: if your MongoDB password contains `#`, write it as `%23` inside the URL.

After deployment, open:

```text
https://YOUR-RENDER-SERVICE.onrender.com/departments
```

If the departments appear, the backend is live.

### Render Shows Node or "Application exited early"

If the Render service header shows **Node**, the backend service was created with
the wrong runtime. The FastAPI backend must be deployed as Python.

Fastest fix:

1. Delete the failed Node web service, or create a new web service.
2. Choose the same GitHub repository.
3. Set **Root Directory** to `campus-event-backend`.
4. Set **Runtime** to `Python`.
5. Set **Build Command** to `pip install -r requirements.txt`.
6. Set **Start Command** to `python -m uvicorn server:app --host 0.0.0.0 --port $PORT`.
7. Add the environment variables again.
8. Deploy.

The service badge should say **Python**, not Node.

### Render Cannot Find `requirements.txt`

If logs show:

```text
ERROR: Could not open requirements file: [Errno 2] No such file or directory: 'requirements.txt'
```

Render is building from the repository root instead of `campus-event-backend`.
Fix it in Render service settings:

```text
Root Directory: campus-event-backend
Build Command: pip install -r requirements.txt
Start Command: python -m uvicorn server:app --host 0.0.0.0 --port $PORT
```

This repository also includes root-level fallback files, so a root deploy can
work with:

```text
Build Command: pip install -r requirements.txt
Start Command: cd campus-event-backend && python -m uvicorn server:app --host 0.0.0.0 --port $PORT
```

## Email Notifications

Use Brevo for the free email layer. The backend uses Brevo's HTTPS transactional
email API, so no SMTP server or extra Python package is needed.

Brevo setup:

1. Create a Brevo account.
2. Go to **Transactional > Senders & IP** and verify a sender email address.
3. Go to **SMTP & API > API Keys** and create an API key.
4. Put that key into `BREVO_API_KEY`.
5. Put the verified sender email into `EMAIL_FROM_EMAIL`.

Notification behavior:

```text
Admin creates event       -> Registrar gets in-app + email notification
Registrar approves event  -> Admin gets in-app + email notification
Registrar rejects event   -> Admin gets in-app + email notification with remarks
Event approved publicly   -> Students get in-app + email notification
```

`EMAIL_MAX_RECIPIENTS_PER_EVENT=250` keeps one event approval comfortably under
Brevo's free daily email limit.

## 2. Allow Render in MongoDB Atlas

In MongoDB Atlas:

1. Go to **Security > Network Access**.
2. Add an IP access entry.
3. For development/testing, use `0.0.0.0/0`.

This allows Render to connect to Atlas. For production, use a tighter network rule when your hosting plan supports stable outbound IPs.

## 3. Build Android APK with EAS

Install or run EAS CLI:

```bash
cd campus-event-mobile
npx eas-cli login
```

Create the Expo project if EAS asks:

```bash
npx eas-cli build:configure
```

Set the backend URL for the APK build in the Expo dashboard or with EAS environment variables:

```bash
npx eas-cli env:create --name EXPO_PUBLIC_BACKEND_URL --value https://YOUR-RENDER-SERVICE.onrender.com --environment preview --visibility plaintext
```

```text
EXPO_PUBLIC_BACKEND_URL=https://YOUR-RENDER-SERVICE.onrender.com
```

Then build the APK:

```bash
npx eas-cli build -p android --profile preview
```

When the build finishes, EAS gives a download link for the `.apk`. Install that APK on your Android phone.

## 4. Production Store Build Later

For Google Play Store, use:

```bash
npx eas-cli build -p android --profile production
```

That creates an `.aab`, which is the Play Store format.
