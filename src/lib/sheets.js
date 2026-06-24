
// ---- ALERTS ----

export async function fetchAlerts() {
  try {
    const data = await callGet('getAlerts')
    if (data.error) return []
    return data.filter(r => r.active === 'TRUE' || r.active === true)
  } catch (e) { console.error('fetchAlerts error:', e); return [] }
}

export async function addAlertSheet(id, message, sections) {
  await callPost({ action: 'addAlert', id, message, sections: JSON.stringify(sections) })
}

export async function dismissAlertSheet(id) {
  await callPost({ action: 'dismissAlert', id })
}

// ---- ALERTS ----

export async function fetchAlerts() {
  try {
    const data = await callGet('getAlerts')
    if (data.error) return []
    return data
  } catch (e) { console.error('fetchAlerts error:', e); return [] }
}

export async function addAlertSheet(message, sections) {
  const result = await callPost({ action: 'addAlert', message, sections })
  return { id: result.id, message, sections, active: 'TRUE' }
}

export async function dismissAlertSheet(id) {
  await callPost({ action: 'dismissAlert', id })
}
