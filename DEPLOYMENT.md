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

Set these environment variables:

```text
MONGO_URL=mongodb+srv://YOUR_USER:YOUR_ENCODED_PASSWORD@cluster0.wtro3b9.mongodb.net/
DB_NAME=event
SECRET_KEY=generate-a-long-random-secret
ADMIN_EMAIL=admin@test.com
ADMIN_PASSWORD=your-admin-password
REGISTRAR_EMAIL=registrar@test.com
REGISTRAR_PASSWORD=your-registrar-password
```

Important: if your MongoDB password contains `#`, write it as `%23` inside the URL.

After deployment, open:

```text
https://YOUR-RENDER-SERVICE.onrender.com/departments
```

If the departments appear, the backend is live.

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
