const API_BASE = import.meta.env.VITE_API_URL || ''

async function request(path, options = {}) {
  const token = localStorage.getItem('token')
  const headers = { ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData) && !(options.body instanceof URLSearchParams)) {
    headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(options.body)
  }
  const resp = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (resp.status === 401 && !path.includes('/auth/login') && !path.includes('/auth/register')) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.reload()
    return
  }
  const data = await resp.json()
  if (!resp.ok) {
    const msg = typeof data.detail === 'string' ? data.detail : (Array.isArray(data.detail) ? data.detail.map(d => d.msg).join(', ') : 'Fehler')
    throw new Error(msg)
  }
  return data
}

export const api = {
  // Auth
  login: (username, password) => {
    const body = new URLSearchParams()
    body.append('username', username)
    body.append('password', password)
    return request('/api/auth/login', { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
  },
  register: (username, password) => request('/api/auth/register', { method: 'POST', body: { username, password } }),
  getMe: () => request('/api/auth/me'),
  changePassword: (old_password, new_password) => request('/api/auth/password', { method: 'PUT', body: { old_password, new_password } }),

  // Admin
  listUsers: () => request('/api/admin/users'),
  updateUser: (id, data) => request(`/api/admin/users/${id}`, { method: 'PUT', body: data }),
  deleteUser: (id) => request(`/api/admin/users/${id}`, { method: 'DELETE' }),

  // Vehicles
  listVehicles: () => request('/api/vehicles'),
  createVehicle: (data) => request('/api/vehicles', { method: 'POST', body: data }),
  updateVehicle: (id, data) => request(`/api/vehicles/${id}`, { method: 'PUT', body: data }),
  deleteVehicle: (id) => request(`/api/vehicles/${id}`, { method: 'DELETE' }),

  // Routes
  calculateRoute: (data) => request('/api/routes/calculate', { method: 'POST', body: data }),
  listRoutes: () => request('/api/routes'),
  saveRoute: (data) => request('/api/routes/save', { method: 'POST', body: data }),
  deleteRoute: (id) => request(`/api/routes/${id}`, { method: 'DELETE' }),
}
