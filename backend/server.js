import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const STORAGE_FILE = path.join(DATA_DIR, 'storage.json');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
const PORT = process.env.PORT || 8000;
const JWT_SECRET = process.env.JWT_SECRET || 'belburge-demo-secret-key-change-in-prod';
const JWT_EXPIRES = '30d';

// ensure data dir
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadStorage() {
  if (!fs.existsSync(STORAGE_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8')); } catch { return {}; }
}
function saveStorage(obj) {
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(obj, null, 2));
}
function loadAccounts() {
  if (!fs.existsSync(ACCOUNTS_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8')); } catch { return []; }
}
function saveAccounts(list) {
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(list, null, 2));
}

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// health
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString(), accounts: loadAccounts().length, storageKeys: Object.keys(loadStorage()) });
});

// helpers
function authMiddleware(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// bootstrap
app.post('/api/bootstrap-demo-data', (req, res) => {
  const storage = loadStorage();
  const accounts = loadAccounts();
  // if already seeded -> 409
  const hasData = Object.keys(storage).length > 0 || accounts.length > 0;
  if (hasData) return res.status(409).json({ error: 'Already seeded' });
  const { collections, accounts: accs } = req.body || {};
  if (collections) {
    for (const [k, v] of Object.entries(collections)) {
      // collections values are already arrays/objects, we store as stringified JSON string per frontend storage.set which does JSON.stringify(list)
      // but frontend does window.storage.set('containers', JSON.stringify(list))
      // so value is JSON string. We'll replicate: store as provided value stringified if not string
      // The bootstrap collections from frontend: containers: seedContainers() which is array -> they send collections.containers = seedContainers() (array)
      // and server should store JSON.stringify(array) as value
      // Let's store as JSON string if not string
      const val = typeof v === 'string' ? v : JSON.stringify(v);
      storage[k] = val;
    }
    saveStorage(storage);
  }
  if (accs && Array.isArray(accs)) {
    // accs are {id, email, password}
    const toSave = accs.map(a => ({
      id: a.id,
      email: (a.email||'').toLowerCase(),
      password: a.password || 'demo123'
    }));
    saveAccounts(toSave);
  }
  res.json({ ok: true });
});

// storage GET
app.get('/api/storage/:key', authMiddleware, (req, res) => {
  const storage = loadStorage();
  const key = req.params.key;
  if (!(key in storage)) {
    // frontend expects {value: null} or null body with wrapper? It checks body.value!=null
    return res.json({ value: null });
  }
  res.json({ value: storage[key] });
});

// storage PUT
app.put('/api/storage/:key', authMiddleware, (req, res) => {
  const storage = loadStorage();
  const key = req.params.key;
  const value = req.body?.value;
  // value is expected to be JSON string already, but we store as-is
  // if undefined, treat as null
  storage[key] = value !== undefined ? value : null;
  saveStorage(storage);
  // broadcast to WS clients
  broadcast({ type: 'changed', key });
  res.json({ ok: true });
});

// auth register
app.post('/api/auth/register', (req, res) => {
  const { id, email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const accounts = loadAccounts();
  const lower = String(email).toLowerCase();
  if (accounts.some(a => a.email === lower)) {
    return res.status(409).json({ error: 'email already registered' });
  }
  accounts.push({ id: id || ('u'+Date.now()), email: lower, password });
  saveAccounts(accounts);
  res.json({ ok: true });
});

// auth login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'missing' });
  const accounts = loadAccounts();
  const lower = String(email).toLowerCase();
  const acc = accounts.find(a => a.email === lower && a.password === password);
  if (!acc) return res.status(401).json({ error: 'invalid credentials' });
  const token = jwt.sign({ userId: acc.id, email: acc.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  res.json({ token, userId: acc.id });
});

// reset-seed-credentials
app.post('/api/auth/reset-seed-credentials', authMiddleware, (req, res) => {
  const { accounts } = req.body || {};
  if (!Array.isArray(accounts)) return res.status(400).json({ error: 'accounts array required' });
  const toSave = accounts.map(a => ({
    id: a.id,
    email: String(a.email||'').toLowerCase(),
    password: a.password || 'demo123'
  }));
  saveAccounts(toSave);
  res.json({ ok: true });
});

// set-password
app.post('/api/auth/set-password', authMiddleware, (req, res) => {
  const { email, newPassword } = req.body || {};
  if (!email || !newPassword) return res.status(400).json({ error: 'email and newPassword required' });
  const lower = String(email).toLowerCase();
  const accounts = loadAccounts();
  const acc = accounts.find(a => a.email === lower);
  if (!acc) return res.status(404).json({ error: 'account not found' });
  acc.password = newPassword;
  saveAccounts(accounts);
  res.json({ ok: true });
});

// serve static frontend
const staticRoot = path.join(__dirname, '..');
app.use(express.static(staticRoot, { index: 'index.html' }));
// fallback to index.html for SPA (but we have single html)
app.get('*', (req, res) => {
  // if api not matched, serve index
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'not found' });
  res.sendFile(path.join(staticRoot, 'index.html'));
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Belburge backend running on http://0.0.0.0:${PORT}`);
  console.log(`Static root: ${staticRoot}`);
});

// WebSocket
const wss = new WebSocketServer({ server, path: '/ws' });
const clients = new Set();

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');
  if (!token) {
    ws.close(1008, 'missing token');
    return;
  }
  try {
    jwt.verify(token, JWT_SECRET);
  } catch {
    ws.close(1008, 'invalid token');
    return;
  }
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));
  ws.on('error', () => clients.delete(ws));
});

function broadcast(msg) {
  const data = JSON.stringify(msg);
  for (const ws of clients) {
    if (ws.readyState === ws.OPEN) ws.send(data);
  }
}
