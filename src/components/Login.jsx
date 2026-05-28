import { useState } from 'react'

export default function Login({ onLogin }) {
  const [tab, setTab] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const apiBase = window.location.origin

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      localStorage.setItem('token', data.token)
      onLogin(data.user, data.token)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess(data.message)
      setUsername('')
      setPassword('')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>Ladelogistik</h1>
          <p>Anmelden oder Registrieren</p>
        </div>

        <div className="login-tabs">
          <button className={`login-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setError(''); setSuccess('') }}>
            Anmelden
          </button>
          <button className={`login-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setError(''); setSuccess('') }}>
            Registrieren
          </button>
        </div>

        <form className="login-form" onSubmit={tab === 'login' ? handleLogin : handleRegister}>
          <div className="form-group">
            <label>Benutzername</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
          </div>
          <div className="form-group">
            <label>Passwort</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          {error && <div className="login-error">{error}</div>}
          {success && <div className="login-success">{success}</div>}

          <button className="btn btn-primary login-btn" type="submit" disabled={loading}>
            {loading ? '...' : tab === 'login' ? 'Anmelden' : 'Registrieren'}
          </button>
        </form>

        {tab === 'register' && (
          <div className="login-hint">
            Nach der Registrierung muss der Admin Ihr Konto freigeben.
          </div>
        )}
      </div>
    </div>
  )
}
