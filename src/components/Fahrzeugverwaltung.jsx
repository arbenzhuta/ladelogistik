import { useState } from 'react'

export default function Fahrzeugverwaltung({
  fahrzeuge,
  setFahrzeuge,
  selectedFahrzeug,
  setSelectedFahrzeug,
}) {
  const [form, setForm] = useState({ name: '', laenge: '', breite: '', hoehe: '' })

  const handleAdd = () => {
    if (!form.name || !form.laenge || !form.breite || !form.hoehe) return
    const newFahrzeug = {
      id: Date.now(),
      name: form.name,
      laenge: parseFloat(form.laenge),
      breite: parseFloat(form.breite),
      hoehe: parseFloat(form.hoehe),
    }
    setFahrzeuge([...fahrzeuge, newFahrzeug])
    setForm({ name: '', laenge: '', breite: '', hoehe: '' })
  }

  const handleRemove = (index) => {
    const updated = fahrzeuge.filter((_, i) => i !== index)
    setFahrzeuge(updated)
    if (selectedFahrzeug >= updated.length) {
      setSelectedFahrzeug(Math.max(0, updated.length - 1))
    }
  }

  return (
    <div>
      <div className="card">
        <h2>Flotte</h2>
        <div className="fahrzeug-grid">
          {fahrzeuge.map((f, i) => (
            <div
              key={f.id}
              className={`fahrzeug-card ${selectedFahrzeug === i ? 'selected' : ''}`}
              onClick={() => setSelectedFahrzeug(i)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <h3>{f.name}</h3>
                {fahrzeuge.length > 1 && (
                  <button
                    className="btn btn-danger"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemove(i)
                    }}
                  >
                    Entfernen
                  </button>
                )}
              </div>
              <div className="fahrzeug-dims">
                <span>L: {f.laenge} m</span>
                <span>B: {f.breite} m</span>
                <span>H: {f.hoehe} m</span>
              </div>
              {selectedFahrzeug === i && (
                <div style={{ marginTop: 8, fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>
                  Ausgewählt für Beladeplan
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Neues Fahrzeug hinzufügen</h2>
        <div className="fahrzeug-form">
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              placeholder="z.B. LKW 2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Länge (m)</label>
            <input
              type="number"
              step="0.1"
              placeholder="13.6"
              value={form.laenge}
              onChange={(e) => setForm({ ...form, laenge: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Breite (m)</label>
            <input
              type="number"
              step="0.01"
              placeholder="2.45"
              value={form.breite}
              onChange={(e) => setForm({ ...form, breite: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Höhe (m)</label>
            <input
              type="number"
              step="0.01"
              placeholder="2.7"
              value={form.hoehe}
              onChange={(e) => setForm({ ...form, hoehe: e.target.value })}
            />
          </div>
          <button className="btn btn-primary" onClick={handleAdd}>
            Hinzufügen
          </button>
        </div>
      </div>
    </div>
  )
}
