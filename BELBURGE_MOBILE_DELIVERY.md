# Belburge Tracker — Mobile Delivery Package

**Date:** 2026-10-18  
**App:** Belburge International Limited — Bonded Terminal Container Tracker  
**Deliverables:** Real backend + PWA + Capacitor APK/IPA scaffolding

---

## 1) What was built

### A. Real Backend (Live now in preview)
`backend/server.js` — Node 20, Express, JWT, WebSocket

- **Currently running** at **port 8000** serving **both API and frontend** on the same origin (`https://8000-<sandbox>.e2b.app`). No manual Server URL needed — frontend auto-detects `window.location.origin`.
- File store `backend/data/` (`storage.json` + `accounts.json`) — swap to Postgres by replacing 20 lines when you scale.
- Endpoints match exactly what the HTML expects: `bootstrap-demo-data`, `storage`, `auth/*`, `ws`.
- Live sync: WebSocket `/ws?token=` + 4s poll fallback → every device sees changes instantly.
- Demo seed: first visit seeds 8 containers + 11 users (password `demo123`).

**Test:**
```bash
curl https://8000-<sandbox>.e2b.app/api/health
# → {"ok":true,"accounts":11,"storageKeys":["containers","users",...]}
```

Deploy files included: `Dockerfile`, `render.yaml`, `.env.example`.

### B. Mobile Frontend (PWA)
`index.html` (187KB single-file) + `belburge-mobile/www/index.html` copy:

- Forest `#183D2C` + amber `#C4841C`, Zilla Slab + IBM Plex, 44px touch targets, safe-area.
- App bar + bottom tab bar (5 tabs) + More sheet + slide-up detail modal. All desktop grids collapsed to single column.
- Roles: Importer (Ngozi, Tunde), Agent (Chidi, Fatima), Admin departments (Operations, Documentation, DTI, Transport, Field Staff, Admin, Accountant).
- 15-stage rail CPC→EMPTY, alerts, financials, seal, placement, transporter, invoices, documents, duty, referrals, support, reports, activity.
- PWA manifest + `apple-mobile-web-app-capable` — **Add to Home Screen** works today on iOS/Android.

### C. Capacitor Native Wrapper
`belburge-mobile/` — **full APM/IPA project, ready to ship**

- `appId: com.belburge.tracker`, `webDir: www`, plugins: App, Haptics, Keyboard, SplashScreen, StatusBar.
- `android/` (Gradle) and `ios/` (Xcode + CocoaPods) already added via `npx cap add`.
- Icons: `www/icon.png` (2048→ resized to all mipmap densities via ImageMagick) + iOS AppIcon. Splash: `www/splash.png`.
- `capacitor.config.json` points `hostname: belburge.bilbt.app` for secure WebView.
- Build via CLI or CI:

```bash
cd belburge-mobile
npm install
npx cap sync                 # copy www → android/ios assets
npx cap open android         # Android Studio → Run / Generate Signed APK
npx cap open ios             # Xcode → Archive → IPA
# or CLI:
cd android && ./gradlew assembleDebug   # → app/build/outputs/apk/debug/app-debug.apk
```

CI already wired: `.github/workflows/build.yml` builds unsigned APK on every push (and iOS simulator build on macOS runner). Add your signing keys for store release.

---

## 2) How to run locally (you)

```bash
# Backend + Frontend together (same as preview)
cd backend && npm install && PORT=8000 node server.js
# open http://localhost:8000 → Sign In → demo123

# Pure Capacitor flow
cd belburge-mobile && npm install && npx cap sync
npx cap open android   # needs Android Studio
npx cap open ios       # needs Mac + Xcode
```

---

## 3) How a user installs on phone *right now* (no store)

### PWA (recommended today)
1. Open preview URL on phone: `https://8000-<sandbox>.e2b.app`
2. iOS: Share → Add to Home Screen → Belburge Tracker installs standalone.
3. Android: Menu → Install app / Add to Home Screen.
4. Sign in with demo accounts or Create Account → verify → Admin approves.

### Native APK/IPA (when you build)
- Android: `app-debug.apk` → sideload or upload to Play Console (Internal Testing).
- iOS: Archive in Xcode → TestFlight → App Store. Need Apple Developer account + bundle ID `com.belburge.tracker`.

To make the native app hit your production backend (not preview), either:
```js
// one-time on first launch (JS console or native bridge)
localStorage.setItem('belburge_api_base', 'https://belburge-backend.onrender.com')
```
or set `server.url` in `capacitor.config.json` to that backend URL before `npx cap sync`.

---

## 4) File map

```
/home/user/
  index.html                         ← live web app (also served by backend)
  backend/
    server.js                        ← real API + WS + static
    package.json / Dockerfile / render.yaml / README.md
    data/storage.json                ← created on first seed
    data/accounts.json
  belburge-mobile/
    www/index.html + icon.png + splash.png
    capacitor.config.json
    android/                         ← ready Gradle project
    ios/                             ← ready Xcode project
    .github/workflows/build.yml
```

---

## 5) Next steps to go to production

1. **Deploy backend** to Render/Railway/Fly (dockerfile included) → set `JWT_SECRET` long random.
2. **Point DNS** (e.g. `tracker.belburge.com` → Render) → set `server.url` in Capacitor if using live WebView, or keep bundled mode and set `belburge_api_base` in app.
3. **Signing**:
   - Android: `keytool -genkey` → `android/keystore.jks` → Gradle `signingConfig` → `assembleRelease` → `app-release.aab` for Play Store.
   - iOS: Xcode → Signing & Capabilities → Team → Archive → Distribute → App Store/TestFlight.
4. **Postgres**: when ready, replace `loadStorage/saveStorage` helpers with `pg` table `storage(k,v)` and `accounts` table — API contract stays identical.

---

**Preview still live:** open the canvas above or go to `https://8000-<sandbox>.e2b.app` — backend + frontend are one service. Demo password is `demo123` for all seeded users.
