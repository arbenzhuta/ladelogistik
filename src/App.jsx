import { useState, useEffect, useCallback } from 'react'
import './App.css'
import Login from './components/Login.jsx'
import AdminPanel from './components/AdminPanel.jsx'
import Fahrzeugverwaltung from './components/Fahrzeugverwaltung.jsx'
import Frachtstuecke from './components/Frachtstuecke.jsx'
import Beladeplan from './components/Beladeplan.jsx'
import Routenplanung from './components/Routenplanung.jsx'

let nextId = 10

export default function App() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [authChecked, setAuthChecked] = useState(false)
  const [settings, setSettings] = useState({})

  const [activeTab, setActiveTab] = useState('fahrzeuge')
  const [fahrzeuge, setFahrzeuge] = useState(() => {
    const stored = localStorage.getItem('fahrzeuge')
    if (stored) {
      try { return JSON.parse(stored) } catch {}
    }
    return [{ id: 1, name: 'LKW 1', laenge: 13.6, breite: 2.45, hoehe: 2.7 }]
  })
  const [selectedFahrzeug, setSelectedFahrzeug] = useState(0)
  const [frachtstuecke, setFrachtstuecke] = useState([])

  const apiBase = window.location.origin

  // Load settings
  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/api/settings`)
      if (res.ok) setSettings(await res.json())
    } catch {}
  }, [apiBase])

  // Check existing token on mount
  useEffect(() => {
    loadSettings()
    if (!token) {
      setAuthChecked(true)
      return
    }
    fetch(`${apiBase}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.ok) return res.json()
        throw new Error('invalid')
      })
      .then((data) => {
        setUser(data.user)
        setAuthChecked(true)
      })
      .catch(() => {
        localStorage.removeItem('token')
        setToken(null)
        setAuthChecked(true)
      })
  }, [token, apiBase, loadSettings])

  // Save vehicles to localStorage
  useEffect(() => {
    localStorage.setItem('fahrzeuge', JSON.stringify(fahrzeuge))
  }, [fahrzeuge])

  const handleLogin = (userData, newToken) => {
    setUser(userData)
    setToken(newToken)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setToken(null)
  }

  const addFrachtstueck = (stueck) => {
    setFrachtstuecke((prev) => [...prev, { ...stueck, id: nextId++ }])
  }

  const removeFrachtstueck = (id) => {
    setFrachtstuecke((prev) => prev.filter((f) => f.id !== id))
  }

  const updateFrachtstueck = (id, changes) => {
    setFrachtstuecke((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...changes } : f))
    )
  }

  const clearFrachtstuecke = () => {
    setFrachtstuecke([])
  }

  const importFrachtstuecke = (articles, fileName) => {
    const tagged = articles.map((a) => ({ ...a, id: nextId++, majFile: fileName }))
    setFrachtstuecke((prev) => {
      const other = prev.filter((f) => f.majFile !== fileName)
      return [...other, ...tagged]
    })
  }

  if (!authChecked) {
    return (
      <div className="login-page">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <p>Laden...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  const isAdmin = user.role === 'admin'

  const TABS = [
    { id: 'fahrzeuge', label: 'Fahrzeuge' },
    { id: 'fracht', label: 'Frachtstücke' },
    { id: 'beladeplan', label: '3D-Beladeplan' },
    { id: 'route', label: 'Navigation' },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin' }] : []),
  ]

  const primaryColor = settings.primaryColor || '#2563eb'
  const headerBg = settings.headerBg || '#1a1a2e'
  const appName = settings.appName || 'Ladelogistik'
  const subtitle = settings.subtitle || 'Fahrzeuge, Frachtstücke & 3D-Beladepläne'

  return (
    <div className="app">
      <header className="app-header" style={{ background: headerBg, borderRadius: 12, padding: '16px 24px', marginBottom: 24 }}>
        <div className="header-row">
          <h1 style={{ color: '#fff', margin: 0, fontSize: '1.5rem' }}>{appName}</h1>
          <div className="user-info">
            <span className={`role-badge ${user.role}`}>{isAdmin ? 'Admin' : 'Gast'}</span>
            <span className="user-name" style={{ color: '#fff' }}>{user.username}</span>
            <button className="btn btn-small btn-secondary" onClick={handleLogout}>Abmelden</button>
          </div>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.7)', margin: '4px 0 0', fontSize: '0.85rem' }}>{subtitle}</p>
      </header>

      <nav className="tab-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={activeTab === tab.id ? { color: primaryColor, borderBottomColor: primaryColor } : {}}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="tab-content">
        {activeTab === 'fahrzeuge' && (
          <Fahrzeugverwaltung
            fahrzeuge={fahrzeuge}
            setFahrzeuge={setFahrzeuge}
            selectedFahrzeug={selectedFahrzeug}
            setSelectedFahrzeug={setSelectedFahrzeug}
          />
        )}
        {activeTab === 'fracht' && (
          <Frachtstuecke
            frachtstuecke={frachtstuecke}
            addFrachtstueck={addFrachtstueck}
            removeFrachtstueck={removeFrachtstueck}
            updateFrachtstueck={updateFrachtstueck}
            clearFrachtstuecke={clearFrachtstuecke}
            importFrachtstuecke={importFrachtstuecke}
          />
        )}
        {activeTab === 'beladeplan' && (
          <Beladeplan
            fahrzeuge={fahrzeuge}
            selectedFahrzeug={selectedFahrzeug}
            frachtstuecke={frachtstuecke}
          />
        )}
        {activeTab === 'route' && (
          <Routenplanung fahrzeuge={fahrzeuge} />
        )}
        {activeTab === 'admin' && isAdmin && (
          <AdminPanel token={token} />
        )}
      </main>
    </div>
  )
}
