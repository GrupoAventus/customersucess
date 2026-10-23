// AventusCS_ - Apps Script integration

const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL || ''

async function callGet(action) {
  const url = `${SCRIPT_URL}?action=${action}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Script error: ${res.status}`)
  return res.json()
}

async function callPost(body) {
  // Apps Script redireciona POST (302) e perde o body — enviamos via GET com payload na URL
  const url = `${SCRIPT_URL}?payload=${encodeURIComponent(JSON.stringify(body))}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Script error: ${res.status}`)
  return res.json()
}

function safeParseArray(val) {
  if (Array.isArray(val)) return val
  if (!val) return []
  try {
    const parsed = JSON.parse(val)
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
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
      rechargeAmount: parseFloat(r.rechargeAmount) || 0,
      dailySpend: parseFloat(r.dailySpend) || 0,
      lastRecharge: r.lastRecharge || '',
      priorityStatus: r.priorityStatus || 'estavel',
      statusChangedAt: r.statusChangedAt || r.createdAt || '',
      hasCard: r.hasCard === 'TRUE' || r.hasCard === true,
      whatsappGroup: r.whatsappGroup || '',
      whatsappGroupName: r.whatsappGroupName || '',
      criativoAccountId: r.criativoAccountId || '',
      clientType: r.clientType || '',
    }))
  } catch (e) {
    console.error('fetchClients error:', e)
    return []
  }
}

export async function addClient(client) {
  const result = await callPost({ action: 'addClient', ...client })
  return { ...client, id: result.id, socialPosts: 0, status: client.status || 'Pegar acessos', observacoes: '', cancelado: false, priorityStatus: client.priorityStatus || 'estavel', hasCard: false }
}

export async function updateClient(client) {
  await callPost({ action: 'updateClient', ...client })
}

export async function updateClientStatus(id, status, statusChangedAt) {
  await callPost({ action: 'updateClientStatus', id, status, statusChangedAt })
}

export async function updateClientNotes(id, observacoes) {
  await callPost({ action: 'updateClientNotes', id, observacoes })
}

export async function setClientPrioritySheet(id, priorityStatus) {
  await callPost({ action: 'setClientPriority', id, priorityStatus })
}

export async function setClientFinanceSheet(id, { rechargeAmount, dailySpend, lastRecharge }) {
  await callPost({ action: 'setClientFinance', id, rechargeAmount, dailySpend, lastRecharge })
}

export async function setClientCardSheet(id, hasCard) {
  await callPost({ action: 'setClientCard', id, hasCard })
}

export async function cancelClientSheet(id, cancelado) {
  await callPost({ action: 'cancelClient', id, cancelado })
}

export async function deleteClientSheet(id) {
  await callPost({ action: 'deleteClient', id })
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

export async function deleteDemandSheet(id) {
  await callPost({ action: 'deleteDemand', id })
}

// ---- PENDING SALES ----

export async function fetchPendingSales() {
  try {
    const data = await callGet('getPending')
    if (data.error) return []
    return data.filter(r => (r.status || '').toLowerCase() === 'aguardando cadastro')
  } catch (e) {
    console.error('fetchPendingSales error:', e)
    return []
  }
}

export async function markPendingDoneSheet(id) {
  await callPost({ action: 'markPendingDone', id })
}

// ---- TIMELINE ----

export async function fetchTimeline() {
  try {
    const data = await callGet('getTimeline')
    if (data.error) return []
    return data.map(r => ({
      clientId: r.clientId,
      date: String(r.date).slice(0, 10),
      done: r.done || '',
      feedback: r.feedback || '',
    }))
  } catch (e) {
    console.error('fetchTimeline error:', e)
    return []
  }
}

export async function setTimelineEntrySheet(clientId, date, done, feedback) {
  await callPost({ action: 'setTimelineEntry', clientId, date, done, feedback })
}

// ---- REPORTS ----

export async function fetchReports() {
  try {
    const data = await callGet('getReports')
    if (data.error) return []
    return data.map(r => ({
      id: r.id,
      clientId: r.clientId,
      date: r.date || '',
      time: r.time || '',
      notes: r.notes || '',
      createdAt: r.createdAt || '',
    }))
  } catch (e) {
    console.error('fetchReports error:', e)
    return []
  }
}

export async function addReportSheet(report) {
  const result = await callPost({ action: 'addReport', ...report })
  return { ...report, id: result.id }
}

export async function deleteReportSheet(id) {
  await callPost({ action: 'deleteReport', id })
}

// ---- AGENDA ----

export async function fetchAgenda() {
  try {
    const data = await callGet('getAgenda')
    if (data.error) return []
    return data.map(r => ({
      id: r.id,
      text: r.text || '',
      prazo: r.prazo || '',
      responsavel: r.responsavel || '',
      done: r.done === 'TRUE' || r.done === true,
      createdAt: r.createdAt || '',
    }))
  } catch (e) {
    console.error('fetchAgenda error:', e)
    return []
  }
}

export async function addAgendaSheet(item) {
  const result = await callPost({ action: 'addAgenda', ...item })
  return { ...item, id: result.id, done: false }
}

export async function toggleAgendaSheet(id, done) {
  await callPost({ action: 'toggleAgenda', id, done })
}

export async function deleteAgendaSheet(id) {
  await callPost({ action: 'deleteAgenda', id })
}

// ---- ALERTS ----

export async function fetchAlerts() {
  try {
    const data = await callGet('getAlerts')
    if (data.error) return []
    return data
      .filter(r => r.active === true || r.active === 'TRUE')
      .map(r => ({
        id: r.id,
        message: r.message || '',
        type: r.type || 'manual',
        sections: (() => {
          try {
            const s = typeof r.sections === 'string' ? JSON.parse(r.sections) : r.sections
            return Array.isArray(s) ? s : []
          } catch { return [] }
        })()
      }))
  } catch (e) {
    console.error('fetchAlerts error:', e)
    return []
  }
}

export async function addAlertSheet(message, sections, type = 'manual') {
  const result = await callPost({ action: 'addAlert', message, sections, type })
  return { id: result.id, message, sections, type }
}

export async function dismissAlertSheet(id) {
  await callPost({ action: 'dismissAlert', id })
}

// ---- PIPELINE ----

export async function fetchPipeline() {
  try {
    const data = await callGet('getPipeline')
    if (data.error) return []
    return data.map(r => ({
      clientId: r.clientId,
      step: r.step,
      done: r.done === 'TRUE' || r.done === true,
      doneAt: r.doneAt || '',
      note: r.note || '',
    }))
  } catch (e) {
    console.error('fetchPipeline error:', e)
    return []
  }
}

export async function setPipelineStepSheet(clientId, step, done, doneAt, note) {
  await callPost({ action: 'setPipelineStep', clientId, step, done, doneAt, note })
}

// ---- METRICS ----

export async function fetchMetrics(accountId, startDate, endDate) {
  try {
    const url = `${SCRIPT_URL}?action=getMetrics&accountId=${encodeURIComponent(accountId)}&startDate=${startDate}&endDate=${endDate}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Script error: ${res.status}`)
    return res.json()
  } catch (e) {
    console.error('fetchMetrics error:', e)
    return { campaigns: [], insights: [] }
  }
}

export async function fetchMetricsHistory(clientId) {
  try {
    const url = `${SCRIPT_URL}?action=getMetricsHistory&clientId=${encodeURIComponent(clientId)}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Script error: ${res.status}`)
    return res.json()
  } catch (e) {
    console.error('fetchMetricsHistory error:', e)
    return []
  }
}

// ---- META STATUS (monitoramento horário de saldo/campanhas) ----

export async function fetchMetaStatus() {
  try {
    const url = `${SCRIPT_URL}?action=getMetaStatus`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Script error: ${res.status}`)
    const json = await res.json()
    return json.status || []
  } catch (e) {
    console.error('fetchMetaStatus error:', e)
    return []
  }
}

// ---- AI INSIGHTS ----

export async function saveAiInsight(clientId, insight, period) {
  return callPost({ action: 'saveAiInsight', clientId, insight, period, createdAt: new Date().toISOString() })
}
