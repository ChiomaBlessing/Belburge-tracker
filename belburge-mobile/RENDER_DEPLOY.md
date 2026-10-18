# Deploy Backend to Render (1-click)

## Option A — Deploy Button (fastest)

1. Push this repo to GitHub (see `GITHUB_PUSH_GUIDE.md`).
2. In Render dashboard: **New → Blueprint** → Connect repo → Render reads `backend/render.yaml` → Create.
   - It will set `JWT_SECRET` auto-generated, `PORT=10000`, `NODE_ENV=production`.
   - Health check: `/api/health`.

3. After deploy, copy the Render URL, e.g. `https://belburge-backend-xyz.onrender.com`.
4. Point your mobile apps to it:

   **PWA / Web:** first load set
   ```js
   localStorage.setItem('belburge_api_base','https://belburge-backend-xyz.onrender.com')
   location.reload()
   ```
   **Native (Capacitor):** edit `capacitor.config.json`:
   ```json
   { "server": { "url": "https://belburge-backend-xyz.onrender.com" } }
   ```
   then `npx cap sync`.

## Option B — Manual Web Service

Render → New → Web Service → Connect GitHub repo:
- **Root directory:** `backend`
- **Build:** `npm install`
- **Start:** `node server.js`
- **Env:** `NODE_ENV=production`, `PORT=10000`, `JWT_SECRET` (generate 32+ chars).

Docker also supported via `backend/Dockerfile`.

## Verify

```bash
curl https://your-render-url.onrender.com/api/health
# {"ok":true,"accounts":0,"storageKeys":[]}  → first seed happens on first browser visit
```

First browser visit seeds demo containers via `bootstrap-demo-data`. After that, data is shared across devices.

## Swap to Postgres later (optional)

Current file store is fine for hundreds of users. When you need Postgres:
1. Render → New → PostgreSQL.
2. In `backend/server.js`, replace `loadStorage/saveStorage` with `pg` queries:
   ```sql
   CREATE TABLE kv (key TEXT PRIMARY KEY, value TEXT);
   CREATE TABLE accounts (id TEXT PRIMARY KEY, email TEXT UNIQUE, password TEXT);
   ```
3. Keep same API routes — frontend unchanged.
