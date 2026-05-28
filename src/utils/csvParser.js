const FARBEN = [
  '#4a90d9', '#e67e22', '#2ecc71', '#e74c3c', '#9b59b6',
  '#1abc9c', '#f39c12', '#3498db', '#e91e63', '#795548',
  '#607d8b', '#ff5722', '#8bc34a', '#00bcd4', '#ffc107',
]

export function parseCSVFile(text) {
  const rows = text
    .trim()
    .split('\n')
    .filter((r) => r.trim().length > 0)
    .map((r) => r.split(',').map(Number))

  if (rows.length === 0) throw new Error('CSV-Datei ist leer.')
  if (rows[0].length < 15)
    throw new Error('CSV-Datei hat zu wenige Spalten. Erwartet: mindestens 15.')

  const grouped = new Map()

  for (const row of rows) {
    const L = row[2]
    const type = row[4]
    const qty = row[5] || 1
    const a = row[13]
    const b = row[14]

    if (L <= 0 || a <= 0 || b <= 0) continue

    let typ, name
    if (type === 0) {
      typ = 'kanal'
      name = 'Kanal'
    } else if (type === 7 && a === b) {
      typ = 'spiro'
      name = `Spirorohr ø${a}`
    } else {
      continue
    }

    const key = `${typ}_${a}_${b}_${L}`
    if (grouped.has(key)) {
      grouped.get(key).anzahl += qty
    } else {
      grouped.set(key, { typ, name, a, b, L, anzahl: qty })
    }
  }

  const articles = []
  for (const item of grouped.values()) {
    item.farbe = FARBEN[articles.length % FARBEN.length]
    articles.push(item)
  }

  if (articles.length === 0) {
    throw new Error('Keine Kanal- oder Spiro-Artikel in der CSV-Datei gefunden.')
  }

  return articles
}
