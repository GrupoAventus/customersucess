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

function safeParseArray(val) {
  if (Array.isArray(val)) return val
  if (!val) return []
  try {
    const parsed = JSON.parse(val)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
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
      destinos: safeParseArray(r.destinos),
      ccLP: r.ccLP || '',
      ccEcom: r.ccEcom || '',
      ccSocial: r.ccSocial || '',
      socialPosts: parseFloat(r.socialPosts) || 0,
      socialWeek: r.socialWeek || '',
      status: r.status || 'Pegar acessos',
      observacoes: r.observacoes || '',
      cancelado: r.cancelado === 'TRUE' || r.cancelado === true,
    }))
  } catch (e) {
    console.error('fetchClients error:', e)
    return []
  }
}

export async function addClient(client) {
  const result = await callPost({ action: 'addClient', ...client })
  return { ...client, id: result.id, socialPosts: 0, status: client.status || 'Pegar acessos', observacoes: client.observacoes || '', cancelado: false }
}

export async function updateClient(client) {
  await callPost({ action: 'updateClient', ...client })
}

export async function updateClientStatus(id, status) {
  await callPost({ action: 'updateClientStatus', id, status })
}

export async function updateClientNotes(id, observacoes) {
  await callPost({ action: 'updateClientNotes', id, observacoes })
}

export async function cancelClientSheet(id, cancelado) {
  await callPost({ action: 'cancelClient', id, cancelado })
}

export async function incrementSocialPost(clientId) {
  return callPost({ action: 'incrementSocialPost', id: clientId })
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
