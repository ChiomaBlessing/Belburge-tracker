# Belburge Tracker — Mobile (Capacitor)

Production-ready wrapper for the Belburge CRM Mobile Application.

## What you have

- `www/index.html` — the full PWA (same as web at `https://8000-....e2b.app`). Works offline for shell, syncs via real backend.
- `backend/` — Node + Express + JWT + WebSocket real backend (see `/home/user/backend/server.js`). Stores data in `backend/data/` JSON. Run anywhere (Render, Railway, Fly, VPS).
- `capacitor.config.json` — appId `com.belburge.tracker`, status-bar, splash, keyboard.

## Backend (real, already live in this sandbox)

Port `8000` serves both API and static frontend:

```bash
cd /home/user/backend
npm install
PORT=8000 JWT_SECRET=change-me node server.js
```

Endpoints:
- `POST /api/bootstrap-demo-data` – seed once
- `GET/PUT /api/storage/:key` – containers, users, activity-log, referrals, messages, org-settings (auth required)
- `POST /api/auth/register` / `login` / `reset-seed-credentials` / `set-password`
- `GET /ws?token=...` – live push

Frontend auto-detects backend: `getApiBase()` returns `localStorage.belburge_api_base` if set, else `window.location.origin`. For local dev leave it empty when frontend+backend share origin. For native apps set it explicitly:

```js
localStorage.setItem('belburge_api_base', 'https://your-backend.onrender.com')
```

## Capacitor — APK / IPA

### Prerequisites

- **Android APK**: Android Studio + SDK + Gradle (Java 17). macOS/Linux/Windows.
- **iOS IPA**: macOS + Xcode + CocoaPods.

### One-time setup (this repo already has `www/`)

```bash
cd belburge-mobile
npm install

# Add native shells (creates android/ and ios/ folders)
npx cap add android
npx cap add ios

# Optional: configure remote live update
# Edit capacitor.config.json -> server.url = "https://your-backend.onrender.com"
# leave server.url empty to use bundled www/index.html offline-first
```

### Build

```bash
# Sync web -> native
npx cap sync

# Open in IDE
npx cap open android   # builds debug APK via Gradle
npx cap open ios       # open Xcode, Archive -> IPA

# CLI build (Android needs SDK)
cd android && ./gradlew assembleDebug
# APK at android/app/build/outputs/apk/debug/app-debug.apk

# iOS (macOS only)
cd ios/App && pod install
xcodebuild -workspace App.xcworkspace -scheme App -configuration Release archive -archivePath build/App.xcarchive
```

### GitHub Actions (CI builds without local SDK)

This repo includes `.github/workflows/build.yml` to build unsigned APK + IPA on push. Connect repo to GitHub and enable Actions.

### App Store details

- **App ID**: `com.belburge.tracker`
- **Name**: Belburge Tracker
- **Icons**: data-URI in `index.html` (BILBT amber on forest). Replace `www/icon.png` (1024×1024) and splash then `npx capacitor-assets generate`.
- **Permissions**: no extra permissions; WebView + network only.

## Deploy backend to Render (free)

1. Push `backend/` to GitHub.
2. Render → New Web Service → Node 20 → Build `npm install` → Start `node server.js` → env `PORT=10000` `JWT_SECRET=...`
3. In app, first launch set `belburge_api_base` to that Render URL (or embed in native build via `server.url`).

## Current sandbox preview

- **Web + API**: `https://8000-<sandbox>.e2b.app` (single origin, zero-config)
- Demo login: `adaeze@belburge.com / demo123` (Admin), `ngozi@adeyemiglobal.com / demo123` (Importer)
