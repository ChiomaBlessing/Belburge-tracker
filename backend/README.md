# Belburge Backend — Real API + WebSocket

Node-only backend for Belburge Tracker (no PostgreSQL needed for demo — JSON file store; swap to Postgres in prod by replacing `loadStorage/saveStorage` with `pg`).

### Run locally

```bash
cd backend
npm install
PORT=8000 node server.js
# health: http://localhost:8000/api/health
# frontend: http://localhost:8000/ (same origin)
```

Uses `data/storage.json` and `data/accounts.json` (gitignored in prod). JWT `Bearer` auth. WebSocket live sync at `/ws?token=...`.

### Deploy

- **Render**: New Web Service → Node 20 → `npm install` → `node server.js` → env `JWT_SECRET`.
- **Docker**: `docker build -t belburge-backend . && docker run -p 8000:10000 -e JWT_SECRET=xxx belburge-backend`
- **VPS**: PM2 `pm2 start server.js --name belburge`.

Swap to Postgres when ready: create table `kv(key text primary key, value text)` and replace file helpers.

### API contract (what the frontend expects)

All `/api/storage/*` and `reset-seed-credentials`/`set-password` require `Authorization: Bearer <token>`.

| Method | Path | Body | Resp |
|---|---|---|---|
| POST | /api/bootstrap-demo-data | {collections, accounts} | 200 or 409 |
| GET | /api/storage/:key | — | {value} |
| PUT | /api/storage/:key | {value} | {ok} |
| POST | /api/auth/register | {id,email,password} | {ok} |
| POST | /api/auth/login | {email,password} | {token,userId} |
| POST | /api/auth/reset-seed-credentials | {accounts} | {ok} |
| POST | /api/auth/set-password | {email,newPassword} | {ok} |
| WS | /ws?token=… | — | push {type:'changed'} |

