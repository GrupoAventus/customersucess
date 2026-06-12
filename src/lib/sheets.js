// AgencyOS - Apps Script integration
// Usa um Google Apps Script publicado como Web App para ler/escrever na planilha

const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL || ''

async function callGet(action) {
  const url = `${SCRIPT_URL}?action=${action}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Script error: ${res.status}`)
  return res.json()
}

async function callPost(body) {
  const res = await fetch(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(`Script error: ${res.status}`)
  return res.json()
}

// ---- CLIENTS ----

export async function fetchClients() {
  try {
    const data = await callGet('getClients')
    if (data.error) throw new Error(data.error)
    return data.map(r => ({
      id: r.id,
      name: r.name || '',
      drive: r.drive || '',
      instagram: r.instagram || '',
      site: r.site || '',
      entrou: r.entrou || '',
      destino: r.destino || '',
      saldoMax: parseFloat(r.saldoMax) || 0,
      saldo: parseFloat(r.saldo) || 0,
      createdAt: r.createdAt || '',
    }))
  } catch (e) {
    console.error('fetchClients error:', e)
    return []
  }
}

export async function addClient(client) {
  const result = await callPost({ action: 'addClient', ...client })
  return { ...client, id: result.id }
}

export async function updateClient(client) {
  await callPost({ action: 'updateClient', ...client })
}

// ---- DEMANDS ----

export async function fetchDemands() {
  try {
    const data = await callGet('getDemands')
    if (data.error) throw new Error(data.error)
    return data.map(r => ({
      id: r.id,
      clientId: r.clientId,
      text: r.text || '',
      prazo: r.prazo || '',
      dest: r.dest || '',
      done: r.done === 'TRUE' || r.done === true,
      createdAt: r.createdAt || '',
    }))
  } catch (e) {
    console.error('fetchDemands error:', e)
    return []
  }
}

export async function addDemand(demand) {
  const result = await callPost({ action: 'addDemand', ...demand })
  return { ...demand, id: result.id, done: false }
}

export async function toggleDemandSheet(demand) {
  await callPost({ action: 'toggleDemand', id: demand.id, done: demand.done })
}
