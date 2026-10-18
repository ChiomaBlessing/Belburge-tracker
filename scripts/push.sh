#!/bin/bash
set -e
cd /home/user
echo "=== Belburge Tracker — Git push helper ==="
echo "1) Create GitHub repo first (e.g. belburge-tracker) and copy its HTTPS URL"
read -p "Paste GitHub repo HTTPS URL (https://github.com/YOU/REPO.git): " REPO
if [ -z "$REPO" ]; then echo "No URL given, abort"; exit 1; fi

git init 2>/dev/null || true
git branch -M main
git add index.html backend/ belburge-mobile/ BELBURGE_MOBILE_DELIVERY.md .gitignore 2>/dev/null || true
git add belburge-mobile/android/keystore.properties.example belburge-mobile/android/app/build.gradle belburge-mobile/PLAY_STORE_GUIDE.md belburge-mobile/RENDER_DEPLOY.md belburge-mobile/GITHUB_PUSH_GUIDE.md 2>/dev/null || true
git add -A
git commit -m "feat: Belburge Tracker — backend + PWA + Capacitor + Play Signing + Render" || echo "nothing new to commit"

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REPO"
else
  git remote add origin "$REPO"
fi

echo "Pushing to $REPO (you'll be prompted for username + PAT)..."
git push -u origin main
echo "Done! Check GitHub Actions for APK build."
