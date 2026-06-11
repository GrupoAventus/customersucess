// Google Sheets API integration
// Uses the Sheets API v4 via fetch (no auth needed for public sheets, uses API key for private)
// All data is stored in a Google Spreadsheet with separate tabs per data type

const SHEET_ID = import.meta.env.VITE_SHEET_ID || ''
const API_KEY = import.meta.env.VITE_SHEETS_API_KEY || ''
const BASE = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`

// Sheets structure:
// Tab "clients": id | name | drive | instagram | site | entrou | destino | saldoMax | saldo | createdAt
// Tab "demands": id | clientId | text | prazo | dest | done | createdAt

async function readSheet(range) {
  const url = `${BASE}/values/${range}?key=${API_KEY}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Sheets error: ${res.status}`)
  const data = await res.json()
  return data.values || []
}

async function appendRow(sheet, values) {
  const url = `${BASE}/values/${sheet}!A1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS&key=${API_KEY}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [values] })
  })
  if (!res.ok) throw new Error(`Sheets append error: ${res.status}`)
  return res.json()
}

async function updateRow(sheet, rowIndex, values) {
  // rowIndex is 1-based (row 1 = headers, row 2 = first data row)
  const range = `${sheet}!A${rowIndex}:Z${rowIndex}`
  const url = `${BASE}/values/${range}?valueInputOption=RAW&key=${API_KEY}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [values] })
  })
  if (!res.ok) throw new Error(`Sheets update error: ${res.status}`)
  return res.json()
}

// ---- CLIENTS ----

export async function fetchClients() {
  try {
    const rows = await readSheet('clients!A2:J1000')
    return rows.map(r => ({
      id: r[0],
      name: r[1] || '',
      drive: r[2] || '',
      instagram: r[3] || '',
      site: r[4] || '',
      entrou: r[5] || '',
      destino: r[6] || '',
      saldoMax: parseFloat(r[7]) || 0,
      saldo: parseFloat(r[8]) || 0,
      createdAt: r[9] || '',
    }))
  } catch (e) {
    console.error('fetchClients error:', e)
    return []
  }
}

export async function addClient(client) {
  const id = `c_${Date.now()}`
  const row = [
    id,
    client.name,
    client.drive,
    client.instagram,
    client.site,
    client.entrou,
    client.destino,
    client.saldoMax,
    client.saldo,
    new Date().toISOString()
  ]
  await appendRow('clients', row)
  return { ...client, id }
}

export async function updateClient(client, rowIndex) {
  const row = [
    client.id,
    client.name,
    client.drive,
    client.instagram,
    client.site,
    client.entrou,
    client.destino,
    client.saldoMax,
    client.saldo,
    client.createdAt
  ]
  await updateRow('clients', rowIndex, row)
}

// ---- DEMANDS ----

export async function fetchDemands() {
  try {
    const rows = await readSheet('demands!A2:G1000')
    return rows.map(r => ({
      id: r[0],
      clientId: r[1],
      text: r[2] || '',
      prazo: r[3] || '',
      dest: r[4] || '',
      done: r[5] === 'TRUE' || r[5] === true,
      createdAt: r[6] || '',
    }))
  } catch (e) {
    console.error('fetchDemands error:', e)
    return []
  }
}

export async function addDemand(demand) {
  const id = `d_${Date.now()}`
  const row = [
    id,
    demand.clientId,
    demand.text,
    demand.prazo,
    demand.dest,
    'FALSE',
    new Date().toISOString()
  ]
  await appendRow('demands', row)
  return { ...demand, id, done: false }
}

export async function toggleDemandSheet(demand, rowIndex) {
  const row = [
    demand.id,
    demand.clientId,
    demand.text,
    demand.prazo,
    demand.dest,
    demand.done ? 'TRUE' : 'FALSE',
    demand.createdAt
  ]
  await updateRow('demands', rowIndex, row)
}
