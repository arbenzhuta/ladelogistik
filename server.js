import express from 'express'
import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000
const JWT_SECRET = process.env.JWT_SECRET || 'ladelogistik-secret-key-change-in-production'

// Database setup
const dataDir = process.env.DATA_DIR || __dirname
const db = new Database(join(dataDir, 'data.db'))
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'guest',
    active INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    laenge REAL NOT NULL,
    breite REAL NOT NULL,
    hoehe REAL NOT NULL,
    created_by INTEGER REFERENCES users(id)
  );
`)

// Create default admin if not exists
const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin')
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10)
  db.prepare('INSERT INTO users (username, password, role, active) VALUES (?, ?, ?, ?)').run('admin', hash, 'admin', 1)
}

// Default settings
const defaultSettings = {
  appName: 'Ladelogistik',
  primaryColor: '#2563eb',
  headerBg: '#1a1a2e',
  logo: '',
}
for (const [key, value] of Object.entries(defaultSettings)) {
  const exists = db.prepare('SELECT key FROM settings WHERE key = ?').get(key)
  if (!exists) {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(key, value)
  }
}

// Middleware
app.use(cors())
app.use(express.json())

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Nicht angemeldet' })
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = db.prepare('SELECT id, username, role, active FROM users WHERE id = ?').get(decoded.id)
    if (!user) return res.status(401).json({ error: 'Benutzer nicht gefunden' })
    if (!user.active) return res.status(403).json({ error: 'Konto gesperrt — warten Sie auf Admin-Freigabe' })
    req.user = user
    next()
  } catch {
    return res.status(401).json({ error: 'Ungültiger Token' })
  }
}

function adminMiddleware(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Nur für Admins' })
  next()
}

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'Benutzername und Passwort erforderlich' })

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Falscher Benutzername oder Passwort' })
  }
  if (!user.active) return res.status(403).json({ error: 'Konto gesperrt — warten Sie auf Admin-Freigabe' })

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d' })
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } })
})

app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'Benutzername und Passwort erforderlich' })
  if (password.length < 4) return res.status(400).json({ error: 'Passwort muss mindestens 4 Zeichen lang sein' })

  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (exists) return res.status(400).json({ error: 'Benutzername bereits vergeben' })

  const hash = bcrypt.hashSync(password, 10)
  db.prepare('INSERT INTO users (username, password, role, active) VALUES (?, ?, ?, ?)').run(username, hash, 'guest', 0)
  res.json({ message: 'Registrierung erfolgreich — warten Sie auf Admin-Freigabe' })
})

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user })
})

// Admin: User management
app.get('/api/admin/users', authMiddleware, adminMiddleware, (req, res) => {
  const users = db.prepare('SELECT id, username, role, active, created_at FROM users ORDER BY created_at DESC').all()
  res.json(users)
})

app.put('/api/admin/users/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { role, active } = req.body
  const userId = parseInt(req.params.id)
  if (userId === req.user.id) return res.status(400).json({ error: 'Eigenes Konto kann nicht geändert werden' })

  if (role !== undefined) db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId)
  if (active !== undefined) db.prepare('UPDATE users SET active = ? WHERE id = ?').run(active ? 1 : 0, userId)
  res.json({ ok: true })
})

app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, (req, res) => {
  const userId = parseInt(req.params.id)
  if (userId === req.user.id) return res.status(400).json({ error: 'Eigenes Konto kann nicht gelöscht werden' })
  db.prepare('DELETE FROM users WHERE id = ?').run(userId)
  res.json({ ok: true })
})

app.put('/api/admin/users/:id/password', authMiddleware, adminMiddleware, (req, res) => {
  const { password } = req.body
  if (!password || password.length < 4) return res.status(400).json({ error: 'Passwort muss mindestens 4 Zeichen lang sein' })
  const hash = bcrypt.hashSync(password, 10)
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, parseInt(req.params.id))
  res.json({ ok: true })
})

// Admin: Settings
app.get('/api/settings', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all()
  const settings = {}
  for (const row of rows) settings[row.key] = row.value
  res.json(settings)
})

app.put('/api/settings', authMiddleware, adminMiddleware, (req, res) => {
  const updates = req.body
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
  for (const [key, value] of Object.entries(updates)) {
    stmt.run(key, String(value))
  }
  res.json({ ok: true })
})

// Vehicles (shared)
app.get('/api/vehicles', authMiddleware, (req, res) => {
  const vehicles = db.prepare('SELECT * FROM vehicles ORDER BY id').all()
  res.json(vehicles)
})

app.post('/api/vehicles', authMiddleware, (req, res) => {
  const { name, laenge, breite, hoehe } = req.body
  const result = db.prepare('INSERT INTO vehicles (name, laenge, breite, hoehe, created_by) VALUES (?, ?, ?, ?, ?)').run(name, laenge, breite, hoehe, req.user.id)
  res.json({ id: result.lastInsertRowid, name, laenge, breite, hoehe })
})

app.delete('/api/vehicles/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM vehicles WHERE id = ?').run(parseInt(req.params.id))
  res.json({ ok: true })
})

// Serve static frontend
app.use(express.static(join(__dirname, 'dist')))
app.get('/{*path}', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`)
  console.log(`Admin-Login: admin / admin123`)
})
