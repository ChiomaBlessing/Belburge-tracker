# Play Store Signing — Google Play App Signing

> You chose **Google-managed signing**. Google holds the *app signing key* (the one users trust), you hold the *upload key* (what signs your AAB before upload). This is the modern, recoverable setup.

## What was generated for you

In `android/`:

- `belburge-upload.keystore` — **UPLOAD KEYSTORE** (RSA 2048, CN=Belburge Intl Ltd). Store passwords `Belburge2025!` / alias `belburge`. **Back this up privately — you need it for every update.**
- `upload_certificate.pem` — the public cert Google needs if you ever need to reset the upload key.
- `keystore.properties` — local Gradle signing config (gitignored, with `.example` template).
- `app/build.gradle` already wired with `signingConfigs.release` + `buildTypes.release.signingConfig = signingConfigs.release` for AAB building.

Fingerprints (SHA-256 upload):
```
SHA1: 46:02:E8:D3:5E:B5:6F:84:89:D4:D4:FF:93:93:74:AA:C2:49:33:98
SHA256: 86:E2:F5:48:0F:4E:43:DB:BA:3F:1E:CE:49:EC:48:7F:EA:2F:02:63:C7:EE:C6:B0:55:7C:F5:0C:89:32:4E:37
```

## Step 1 — Build your first AAB (local)

```bash
cd belburge-mobile
npm install
npx cap sync android

# Release bundle (Google Play wants .aab, not .apk)
cd android
./gradlew bundleRelease
# → android/app/build/outputs/bundle/release/app-release.aab

# Also an APK for sideload testing:
./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

You’ll be prompted only if `keystore.properties` is missing — it’s already there locally.

## Step 2 — Create app in Play Console

1. https://play.google.com/console → Create app → Name: **Belburge Tracker**, Package: `com.belburge.tracker`, Category: Business.
2. **Setup → App signing** → Enable **Google Play App Signing** (recommended). Google generates your *app signing key*.
3. Under **Upload key**, if you already have this keystore, choose *Use existing key from Java keystore* and upload `upload_certificate.pem`. Otherwise let Play generate a new upload key — but then you MUST replace local `belburge-upload.keystore` with the one Play gives you.
4. First upload: **Production → Create new release** → upload `app-release.aab`.

## Step 3 — Store secrets for CI (GitHub Actions)

Never commit the `.keystore`. Do this instead:

```bash
# In repo root:
base64 -w 0 android/belburge-upload.keystore > /tmp/keystore.b64
# copy that string
```

In GitHub → Repo Settings → Secrets → Actions, add:
- `ANDROID_KEYSTORE_BASE64` = contents of `/tmp/keystore.b64`
- `ANDROID_KEYSTORE_PASSWORD` = `Belburge2025!`
- `ANDROID_KEY_ALIAS` = `belburge`
- `ANDROID_KEY_PASSWORD` = `Belburge2025!`

The `android/app/build.gradle` already supports both:
- Local build via `keystore.properties`
- CI build via `ANDROID_KEYSTORE_BASE64` env → it writes a temp keystore at build time. The workflow at `.github/workflows/build.yml` now builds both `assembleDebug` and `bundleRelease`.

## Step 4 — Versioning

- `android/app/build.gradle`: `versionCode` (integer, bump every release) + `versionName` (what users see, e.g. `1.0.1`).
- Capacitor sync copies `capacitor.config.json` → keep `appId` stable (`com.belburge.tracker`) or Play will treat it as a new app.

## Step 5 — Lost keystore? (with Google-managed you’re safe)

Because Google holds the *app signing key*, losing the upload keystore is recoverable:
Play Console → Setup → App signing → Request upload key reset → upload new `upload_certificate.pem` (generate via `keytool -genkey ...` → `keytool -export -rfc`).

## Security checklist

- [ ] Store `belburge-upload.keystore` in 1Password + Google Drive backup (private).
- [ ] Rotate passwords from `Belburge2025!` to long random before production (`keytool -storepasswd`).
- [ ] Enable Play Integrity + App Signing in Play Console.
- [ ] Never commit `keystore.properties`, `*.keystore`, `*.pem`, `*.aab` — `.gitignore` already covers it.

## Need Google to manage *everything*? (upload key auto-generated)

If you prefer Play to generate the upload key for you, skip our keystore and choose **“Let Google manage and protect your app signing key”** at creation — Play will show you a new `upload_certificate.pem` to download. Our keystore is then retired; replace it if you want CI parity.
