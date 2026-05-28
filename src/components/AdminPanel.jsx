import { useState, useEffect, useCallback } from 'react'

export default function AdminPanel({ token }) {
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [settings, setSettings] = useState({})
  const [saved, setSaved] = useState(false)

  const apiBase = window.location.origin
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/api/admin/users`, { headers })
      if (res.ok) setUsers(await res.json())
    } catch {}
  }, [token])

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/api/settings`)
      if (res.ok) setSettings(await res.json())
    } catch {}
  }, [])

  useEffect(() => {
    loadUsers()
    loadSettings()
  }, [loadUsers, loadSettings])

  const toggleActive = async (id, active) => {
    await fetch(`${apiBase}/api/admin/users/${id}`, { method: 'PUT', headers, body: JSON.stringify({ active: !active }) })
    loadUsers()
  }

  const changeRole = async (id, role) => {
    const newRole = role === 'admin' ? 'guest' : 'admin'
    await fetch(`${apiBase}/api/admin/users/${id}`, { method: 'PUT', headers, body: JSON.stringify({ role: newRole }) })
    loadUsers()
  }

  const deleteUser = async (id) => {
    if (!confirm('Benutzer wirklich löschen?')) return
    await fetch(`${apiBase}/api/admin/users/${id}`, { method: 'DELETE', headers })
    loadUsers()
  }

  const resetPassword = async (id) => {
    const pw = prompt('Neues Passwort:')
    if (!pw) return
    await fetch(`${apiBase}/api/admin/users/${id}/password`, { method: 'PUT', headers, body: JSON.stringify({ password: pw }) })
    alert('Passwort geändert')
  }

  const saveSettings = async () => {
    await fetch(`${apiBase}/api/settings`, { method: 'PUT', headers, body: JSON.stringify(settings) })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className={`typ-btn ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>Benutzer</button>
        <button className={`typ-btn ${tab === 'design' ? 'active' : ''}`} onClick={() => setTab('design')}>Design</button>
        <button className={`typ-btn ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>Einstellungen</button>
      </div>

      {tab === 'users' && (
        <div className="card">
          <h2>Benutzerverwaltung</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Benutzer</th>
                <th>Rolle</th>
                <th>Status</th>
                <th>Erstellt</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.username}</strong></td>
                  <td><span className={`role-badge ${u.role}`}>{u.role === 'admin' ? 'Admin' : 'Gast'}</span></td>
                  <td><span className={`status-badge ${u.active ? 'active' : 'inactive'}`}>{u.active ? 'Aktiv' : 'Gesperrt'}</span></td>
                  <td style={{ fontSize: '0.8rem', color: '#888' }}>{new Date(u.created_at).toLocaleDateString('de-CH')}</td>
                  <td>
                    <div className="admin-actions">
                      <button className={`btn btn-small ${u.active ? 'btn-warning' : 'btn-success'}`} onClick={() => toggleActive(u.id, u.active)}>
                        {u.active ? 'Sperren' : 'Freigeben'}
                      </button>
                      <button className="btn btn-small btn-secondary" onClick={() => changeRole(u.id, u.role)}>
                        {u.role === 'admin' ? 'Gast machen' : 'Admin machen'}
                      </button>
                      <button className="btn btn-small btn-secondary" onClick={() => resetPassword(u.id)}>Passwort</button>
                      <button className="btn btn-small btn-danger" onClick={() => deleteUser(u.id)}>Löschen</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'design' && (
        <div className="card">
          <h2>Design anpassen</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label>App-Name</label>
              <input type="text" value={settings.appName || ''} onChange={(e) => updateSetting('appName', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Hauptfarbe</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="color" value={settings.primaryColor || '#2563eb'} onChange={(e) => updateSetting('primaryColor', e.target.value)} style={{ width: 48, height: 36, border: 'none', cursor: 'pointer' }} />
                <input type="text" value={settings.primaryColor || '#2563eb'} onChange={(e) => updateSetting('primaryColor', e.target.value)} style={{ width: 120 }} />
              </div>
            </div>
            <div className="form-group">
              <label>Header-Hintergrund</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="color" value={settings.headerBg || '#1a1a2e'} onChange={(e) => updateSetting('headerBg', e.target.value)} style={{ width: 48, height: 36, border: 'none', cursor: 'pointer' }} />
                <input type="text" value={settings.headerBg || '#1a1a2e'} onChange={(e) => updateSetting('headerBg', e.target.value)} style={{ width: 120 }} />
              </div>
            </div>
            <div className="form-group">
              <label>Untertitel</label>
              <input type="text" value={settings.subtitle || ''} onChange={(e) => updateSetting('subtitle', e.target.value)} placeholder="z.B. Fahrzeuge, Frachtstücke & 3D-Beladepläne" />
            </div>

            <div style={{ padding: 16, borderRadius: 12, background: settings.headerBg || '#1a1a2e', textAlign: 'center' }}>
              <h2 style={{ color: '#fff', margin: 0, fontSize: '1.5rem' }}>{settings.appName || 'Ladelogistik'}</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', margin: '4px 0 0', fontSize: '0.85rem' }}>{settings.subtitle || 'Fahrzeuge, Frachtstücke & 3D-Beladepläne'}</p>
            </div>

            <button className="btn btn-primary" onClick={saveSettings}>
              {saved ? 'Gespeichert!' : 'Design speichern'}
            </button>
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className="card">
          <h2>Einstellungen</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label>Standard-Abladezeit pro Stopp (Minuten)</label>
              <input type="number" value={settings.defaultUnloadTime || '30'} onChange={(e) => updateSetting('defaultUnloadTime', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Standard-Fahrzeug Länge (m)</label>
              <input type="number" step="0.1" value={settings.defaultVehicleLength || '13.6'} onChange={(e) => updateSetting('defaultVehicleLength', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Standard-Fahrzeug Breite (m)</label>
              <input type="number" step="0.1" value={settings.defaultVehicleWidth || '2.45'} onChange={(e) => updateSetting('defaultVehicleWidth', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Standard-Fahrzeug Höhe (m)</label>
              <input type="number" step="0.1" value={settings.defaultVehicleHeight || '2.7'} onChange={(e) => updateSetting('defaultVehicleHeight', e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={saveSettings}>
              {saved ? 'Gespeichert!' : 'Einstellungen speichern'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
