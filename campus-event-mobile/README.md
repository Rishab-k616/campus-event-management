# Campus Event Manager Mobile

Expo SDK 54 mobile app for Student, Admin, and Registrar workflows.

## Compatibility Plan

- Expo SDK 54 uses React Native 0.81 and React 19.1.0.
- Expo Router is pinned to the SDK 54 bundled line: `~6.0.23`.
- Expo native packages use SDK 54 bundled versions:
  - `@expo/vector-icons@15.0.3`
  - `@react-native-async-storage/async-storage@2.2.0`
  - `react-native-safe-area-context@~5.6.0`
  - `react-native-screens@~4.16.0`
  - `expo-linear-gradient@~15.0.8`
  - `react-dom@19.1.0`
  - `react-native-web@~0.21.0`
- `react-dom` is pinned to React 19.1.0 so Expo Router's optional web dependencies do not resolve to a newer React line.
- No notification config plugin, build-properties plugin, or deprecated `expo-av`.

## Setup

```bash
cd campus-event-mobile
copy .env.example .env
```

Set:

```bash
EXPO_PUBLIC_BACKEND_URL=http://YOUR_LOCAL_IP:8000
```

Run:

```bash
npm install
npx expo start -c
```

## APK Build

This project includes `eas.json` with a `preview` profile that builds an Android
APK. Use the deployed Render backend URL for `EXPO_PUBLIC_BACKEND_URL` before
building the APK.

```bash
npx eas-cli build -p android --profile preview
```

See `../DEPLOYMENT.md` for the full Render + APK setup.
