# Push to GitHub (new repo)

You asked for a **new repo** — here’s the ready-to-push local git.

## What’s already done locally

```bash
cd /home/user
git init
git branch -M main
# .gitignore already excludes node_modules, keystores, data, .zip
# belburge-mobile/android already has upload keystore + signing config
# CI workflow at belburge-mobile/.github/workflows/build.yml
```

## Create GitHub repo + push (2 minutes)

### 1. On GitHub.com
- New repo → **Name:** `belburge-tracker` (or your pick) → Private or Public → Create. **Do NOT** init with README (we have one).
- Copy HTTPS URL: `https://github.com/<you>/belburge-tracker.git`

### 2. In this sandbox (run these)

```bash
cd /home/user

git add index.html backend/ belburge-mobile/ BELBURGE_MOBILE_DELIVERY.md README.md .gitignore 2>/dev/null; git add .gitignore
git add belburge-mobile/android/keystore.properties.example belburge-mobile/android/app/build.gradle belburge-mobile/PLAY_STORE_GUIDE.md belburge-mobile/RENDER_DEPLOY.md belburge-mobile/GITHUB_PUSH_GUIDE.md
git commit -m "feat: Belburge Tracker — backend + PWA + Capacitor Android/iOS + Play Signing + Render"

git remote add origin https://github.com/<you>/belburge-tracker.git
git branch -M main
git push -u origin main
```

If GitHub asks for auth, use a Personal Access Token (classic) with `repo` scope as password.

### 3. Enable Actions

Repo → Actions → Enable → Run **Build APK / IPA** workflow — it will produce `app-debug.apk` as artifact (signed build needs secrets, see PLAY_STORE_GUIDE.md step 3).

### 4. (Optional) Add collaborators / protect main

Repo → Settings → Collaborators → Add. Branch protection → Require PR.

## Secrets to add now (for CI signing + Render)

- GitHub → Settings → Secrets and variables → Actions:
  - `ANDROID_KEYSTORE_BASE64` (from `base64 -w 0 belburge-mobile/android/belburge-upload.keystore`)
  - `ANDROID_KEYSTORE_PASSWORD=Belburge2025!`
  - `ANDROID_KEY_ALIAS=belburge`
  - `ANDROID_KEY_PASSWORD=Belburge2025!`

- Render Blueprint will auto-set `JWT_SECRET`. If manual, add `JWT_SECRET` strong random.

## Local push helper script

We’ve added `scripts/push.sh` — edit remote URL inside and run `bash scripts/push.sh`.
