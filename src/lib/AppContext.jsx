import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { fetchClients, fetchDemands, addClient, addDemand, updateClient, toggleDemandSheet, incrementSocialPost, updateClientStatus, updateClientNotes, cancelClientSheet, deleteClientSheet, deleteDemandSheet, setClientPrioritySheet, setClientFinanceSheet, setClientCardSheet, fetchPendingSales, markPendingDoneSheet, fetchTimeline, setTimelineEntrySheet, fetchReports, addReportSheet, deleteReportSheet , fetchAgenda, addAgendaSheet, toggleAgendaSheet, deleteAgendaSheet } from './sheets'

const AppContext = createContext(null)

export const KANBAN_COLUMNS = ['Pegar acessos', 'Aguardando campanha', 'Campanha ativa', 'Anúncios pausados']
export const PRIORITY_LEVELS = ['estavel', 'atencao', 'prioridade']
export const PRIORITY_RANK = { prioridade: 0, atencao: 1, estavel: 2 }
export const PRIORITY_COLORS = {
  estavel: { border: 'var(--green)', bg: 'rgba(99,153,34,0.08)', label: 'Estável' },
  atencao: { border: 'var(--amber)', bg: 'rgba(239,159,39,0.08)', label: 'Atenção' },
  prioridade: { border: 'var(--red)', bg: 'rgba(226,75,74,0.08)', label: 'Prioridade' },
}

// Fallback demo data when Sheets not configured
const DEMO_CLIENTS = [
  { id: 'c_1', name: 'Bella Store', drive: 'https://drive.google.com', instagram: 'https://instagram.com/bellastore', site: 'https://bellastore.com', entrou: '2024-09-10', destino: 'Squad 1', createdAt: '', destinos: ['Squad 1','Social Media'], ccLP:'', ccEcom:'', ccSocial:'Centro criativo 1', socialPosts: 1, socialWeek: '', status: 'Campanha ativa', observacoes: '', cancelado: false, rechargeAmount: 500, dailySpend: 25, lastRecharge: new Date().toISOString().slice(0,10), priorityStatus: 'estavel' },
  { id: 'c_2', name: 'TechFlow', drive: 'https://drive.google.com', instagram: 'https://instagram.com/techflow', site: 'https://techflow.com', entrou: '2024-10-01', destino: 'Squad 2', createdAt: '', destinos: ['Squad 2'], ccLP:'', ccEcom:'', ccSocial:'', socialPosts: 0, socialWeek: '', status: 'Aguardando campanha', observacoes: '', cancelado: false, rechargeAmount: 100, dailySpend: 20, lastRecharge: new Date().toISOString().slice(0,10), priorityStatus: 'atencao' },
  { id: 'c_3', name: 'Casa & Cia', drive: 'https://drive.google.com', instagram: 'https://instagram.com/casaecia', site: 'https://casaecia.com', entrou: '2024-11-05', destino: 'Ecom', createdAt: '', destinos: ['Ecom','Social Media'], ccLP:'', ccEcom:'Centro criativo 2', ccSocial:'Centro criativo 2', socialPosts: 0, socialWeek: '', status: 'Pegar acessos', observacoes: '', cancelado: false, rechargeAmount: 50, dailySpend: 30, lastRecharge: new Date().toISOString().slice(0,10), priorityStatus: 'prioridade' },
]
const DEMO_DEMANDS = [
  { id: 'd_1', clientId: 'c_1', text: 'Criar campanha de remarketing', prazo: '2024-12-01', dest: 'Squad 1', done: true, createdAt: '' },
  { id: 'd_2', clientId: 'c_1', text: 'Ajustar copy dos anúncios', prazo: '2024-12-15', dest: 'Centro criativo 1', done: false, createdAt: '' },
  { id: 'd_3', clientId: 'c_2', text: 'Landing page nova', prazo: '2024-12-20', dest: 'Squad 2', done: false, createdAt: '' },
]

const useSheets = Boolean(import.meta.env.VITE_SCRIPT_URL)
const ADMIN_PASSWORD = '9912'

const SECTION_PASSWORDS = {
  ops: ['admbruno_'],
  dash: ['headpaulo', 'admbruno_'],
  squad1: ['squad1', 'headpaulo'],
  squad2: ['squad2_', 'headpaulo'],
  cc1: ['centro1', 'headpaulo'],
  cc2: ['centro2_', 'headpaulo'],
}

function getCurrentWeek() {
  const now = new Date()
  const onejan = new Date(now.getFullYear(), 0, 1)
  const week = Math.ceil((((now - onejan) / 86400000) + onejan.getDay() + 1) / 7)
  return `${now.getFullYear()}-W${week}`
}

export function daysSince(dateStr) {
  if (!dateStr) return 0
  const start = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.setHours(0,0,0,0) - start.setHours(0,0,0,0)) / 86400000)
  return Math.max(0, diff)
}

export function getDaysInStatus(client) {
  return daysSince(client.statusChangedAt || client.createdAt)
}

// Auto-escalates priority for clients stuck in "Pegar acessos":
// >=3 days: estavel -> atencao | >=5 days: atencao (auto) -> prioridade
function applyAutoPriority(clients) {
  const changes = []
  const updated = clients.map(c => {
    if (c.status !== 'Pegar acessos' || c.cancelado) return c
    const days = getDaysInStatus(c)
    let newPriority = c.priorityStatus
    if (days >= 5 && (c.priorityStatus === 'estavel' || c.priorityStatus === 'atencao')) {
      newPriority = 'prioridade'
    } else if (days >= 3 && c.priorityStatus === 'estavel') {
      newPriority = 'atencao'
    }
    if (newPriority !== c.priorityStatus) {
      changes.push({ id: c.id, priorityStatus: newPriority })
      return { ...c, priorityStatus: newPriority }
    }
    return c
  })
  return { clients: updated, changes }
}

export function computeCurrentSaldo(client) {
  const recharge = parseFloat(client.rechargeAmount) || 0
  const daily = parseFloat(client.dailySpend) || 0
  const days = daysSince(client.lastRecharge)
  return Math.max(0, recharge - daily * days)
}

export function AppProvider({ children }) {
  const [clients, setClients] = useState(useSheets ? [] : DEMO_CLIENTS)
  const [demands, setDemands] = useState(useSheets ? [] : DEMO_DEMANDS)
  const [loading, setLoading] = useState(useSheets)
  const [loggedIn, setLoggedIn] = useState({})
  const [isAdmin, setIsAdmin] = useState(false)
  const [pendingSales, setPendingSales] = useState([])
  const [timeline, setTimeline] = useState([])
  const [reports, setReports] = useState([])
  const [agenda, setAgenda] = useState([])

  const load = useCallback(async () => {
    if (!useSheets) return
    setLoading(true)
    try {
      const [c, d] = await Promise.all([fetchClients(), fetchDemands()])
      const escalated = applyAutoPriority(c)
      setClients(escalated.clients)
      setDemands(d)
      if (useSheets) {
        for (const upd of escalated.changes) {
          setClientPrioritySheet(upd.id, upd.priorityStatus).catch(console.error)
        }
      }
      try { setPendingSales(await fetchPendingSales()) } catch (e) { console.error(e) }
      try { setTimeline(await fetchTimeline()) } catch (e) { console.error(e) }
      try { setReports(await fetchReports()) } catch (e) { console.error(e) }
      try { setAgenda(await fetchAgenda()) } catch (e) { console.error(e) }
    } catch (e) {
      console.error('Load error:', e)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const createClient = async (data) => {
    const payload = { status: 'Pegar acessos', observacoes: '', cancelado: false, priorityStatus: 'estavel', rechargeAmount: 0, dailySpend: 0, lastRecharge: new Date().toISOString().slice(0,10), statusChangedAt: new Date().toISOString().slice(0,10), ...data }
    let saved
    if (useSheets) {
      saved = await addClient(payload)
      setClients(prev => [...prev, saved])
    } else {
      saved = { ...payload, id: `c_${Date.now()}`, socialPosts: 0, socialWeek: '' }
      setClients(prev => [...prev, saved])
    }
    // Auto-create LP/Ecom demands for the respective creative center
    const destinos = saved.destinos || []
    if (destinos.includes('LP') && saved.ccLP) {
      await createDemand({ clientId: saved.id, text: `Criar LP para ${saved.name}`, prazo: '', dest: saved.ccLP })
    }
    if (destinos.includes('Ecom') && saved.ccEcom) {
      await createDemand({ clientId: saved.id, text: `Criar Ecom para ${saved.name}`, prazo: '', dest: saved.ccEcom })
    }
    return saved
  }

  const dismissPendingSale = async (id) => {
    setPendingSales(prev => prev.filter(p => p.id !== id))
    if (useSheets) {
      try { await markPendingDoneSheet(id) } catch (e) { console.error(e) }
    }
  }

  // One-time backfill: create LP/Ecom demands for existing clients that don't have them yet
  const backfillLpEcomDemands = async () => {
    let created = 0
    for (const c of clients) {
      const destinos = c.destinos || []
      if (destinos.includes('LP') && c.ccLP) {
        const exists = demands.some(d => d.clientId === c.id && d.text === `Criar LP para ${c.name}`)
        if (!exists) { await createDemand({ clientId: c.id, text: `Criar LP para ${c.name}`, prazo: '', dest: c.ccLP }); created++ }
      }
      if (destinos.includes('Ecom') && c.ccEcom) {
        const exists = demands.some(d => d.clientId === c.id && d.text === `Criar Ecom para ${c.name}`)
        if (!exists) { await createDemand({ clientId: c.id, text: `Criar Ecom para ${c.name}`, prazo: '', dest: c.ccEcom }); created++ }
      }
    }
    return created
  }

  const createDemand = async (data) => {
    if (useSheets) {
      const saved = await addDemand(data)
      setDemands(prev => [...prev, saved])
      return saved
    } else {
      const newD = { ...data, id: `d_${Date.now()}`, done: false }
      setDemands(prev => [...prev, newD])
      return newD
    }
  }

  const toggleDemand = async (demandId) => {
    setDemands(prev => prev.map(d => {
      if (d.id !== demandId) return d
      const updated = { ...d, done: !d.done }
      if (useSheets) toggleDemandSheet(updated).catch(console.error)
      return updated
    }))
  }

  const registerSocialPost = async (clientId) => {
    const currentWeek = getCurrentWeek()
    setClients(prev => prev.map(c => {
      if (c.id !== clientId) return c
      let posts = c.socialPosts || 0
      let week = c.socialWeek || ''
      if (week !== currentWeek) { posts = 0; week = currentWeek }
      posts = posts + 1
      return { ...c, socialPosts: posts, socialWeek: week }
    }))
    if (useSheets) {
      try { await incrementSocialPost(clientId) } catch (e) { console.error(e) }
    }
  }

  const setClientStatus = async (clientId, status) => {
    const today = new Date().toISOString().slice(0,10)
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, status, statusChangedAt: today } : c))
    if (useSheets) {
      try { await updateClientStatus(clientId, status, today) } catch (e) { console.error(e) }
    }
  }

  const setClientNotes = async (clientId, observacoes) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, observacoes } : c))
    if (useSheets) {
      try { await updateClientNotes(clientId, observacoes) } catch (e) { console.error(e) }
    }
  }

  const setClientPriority = async (clientId, priorityStatus) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, priorityStatus } : c))
    if (useSheets) {
      try { await setClientPrioritySheet(clientId, priorityStatus) } catch (e) { console.error(e) }
    }
  }

  // recharge: sets new rechargeAmount and resets lastRecharge to today; also allows updating dailySpend
  const setClientFinance = async (clientId, { rechargeAmount, dailySpend, recharged }) => {
    setClients(prev => prev.map(c => {
      if (c.id !== clientId) return c
      const updated = { ...c }
      if (dailySpend != null) updated.dailySpend = dailySpend
      if (rechargeAmount != null) updated.rechargeAmount = rechargeAmount
      if (recharged) updated.lastRecharge = new Date().toISOString().slice(0,10)
      return updated
    }))
    if (useSheets) {
      const client = clients.find(c => c.id === clientId) || {}
      const payload = {
        rechargeAmount: rechargeAmount != null ? rechargeAmount : client.rechargeAmount,
        dailySpend: dailySpend != null ? dailySpend : client.dailySpend,
        lastRecharge: recharged ? new Date().toISOString().slice(0,10) : client.lastRecharge
      }
      try { await setClientFinanceSheet(clientId, payload) } catch (e) { console.error(e) }
    }
  }

  const editClient = async (clientId, data) => {
    const updated = { id: clientId, ...data }
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, ...data } : c))
    if (useSheets) {
      const client = clients.find(c => c.id === clientId) || {}
      try {
        await updateClient({
          id: clientId,
          name: data.name ?? client.name,
          drive: data.drive ?? client.drive,
          instagram: data.instagram ?? client.instagram,
          site: data.site ?? client.site,
          entrou: data.entrou ?? client.entrou,
          destino: data.destino ?? client.destino,
          destinos: data.destinos ?? client.destinos,
          ccLP: data.ccLP ?? client.ccLP,
          ccEcom: data.ccEcom ?? client.ccEcom,
          ccSocial: data.ccSocial ?? client.ccSocial,
          status: client.status,
          observacoes: client.observacoes,
          cancelado: client.cancelado,
          socialPosts: client.socialPosts,
          socialWeek: client.socialWeek,
        })
      } catch (e) { console.error(e) }
    }
    return updated
  }

  const setTimelineEntry = async (clientId, date, done, feedback) => {
    const normalDate = String(date).slice(0, 10)
    setTimeline(prev => {
      const exists = prev.find(t => t.clientId === clientId && String(t.date).slice(0,10) === normalDate)
      if (exists) {
        return prev.map(t => (t.clientId === clientId && String(t.date).slice(0,10) === normalDate) ? { ...t, done, feedback, date: normalDate } : t)
      }
      return [...prev, { clientId, date: normalDate, done, feedback }]
    })
    if (useSheets) {
      try { await setTimelineEntrySheet(clientId, normalDate, done, feedback) } catch (e) { console.error(e) }
    }
  }

  const getClientTimeline = (clientId) => timeline.filter(t => t.clientId === clientId)
  // Alerta apenas se ONTEM não foi preenchido,
  // E ontem deve ser >= a data de hoje (no momento em que o sistema foi implantado).
  // Dias anteriores a hoje são ignorados permanentemente.
  const TIMELINE_START_DATE = '2026-06-22' // data de início do monitoramento

  const getMissingTimelineClients = () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const targetDate = yesterday.toISOString().slice(0, 10)

    // Só alerta se ontem for >= data de início
    if (targetDate < TIMELINE_START_DATE) return []

    return clients.filter(c => {
      const entry = timeline.find(t => t.clientId === c.id && t.date === targetDate)
      return !entry || (!entry.done?.trim() && !entry.feedback?.trim())
    })
  }

  const setClientCard = async (clientId, hasCard) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, hasCard } : c))
    if (useSheets) {
      try { await setClientCardSheet(clientId, hasCard) } catch (e) { console.error(e) }
    }
  }

  const cancelClient = async (clientId, cancelado = true) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, cancelado } : c))
    if (useSheets) {
      try { await cancelClientSheet(clientId, cancelado) } catch (e) { console.error(e) }
    }
  }

  const createReport = async (data) => {
    if (useSheets) {
      const saved = await addReportSheet(data)
      setReports(prev => [...prev, saved])
      return saved
    } else {
      const newR = { ...data, id: `r_${Date.now()}`, createdAt: new Date().toISOString() }
      setReports(prev => [...prev, newR])
      return newR
    }
  }

  const deleteReport = async (reportId) => {
    setReports(prev => prev.filter(r => r.id !== reportId))
    if (useSheets) {
      try { await deleteReportSheet(reportId) } catch (e) { console.error(e) }
    }
  }

  const createAgendaItem = async (data) => {
    if (useSheets) {
      const saved = await addAgendaSheet(data)
      setAgenda(prev => [...prev, saved])
      return saved
    } else {
      const newA = { ...data, id: `a_${Date.now()}`, done: false, createdAt: new Date().toISOString() }
      setAgenda(prev => [...prev, newA])
      return newA
    }
  }

  const toggleAgendaItem = async (itemId) => {
    setAgenda(prev => prev.map(a => {
      if (a.id !== itemId) return a
      const updated = { ...a, done: !a.done }
      if (useSheets) toggleAgendaSheet(itemId, updated.done).catch(console.error)
      return updated
    }))
  }

  const deleteAgendaItem = async (itemId) => {
    setAgenda(prev => prev.filter(a => a.id !== itemId))
    if (useSheets) {
      try { await deleteAgendaSheet(itemId) } catch (e) { console.error(e) }
    }
  }

  const unlockAdmin = (password) => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true)
      return true
    }
    return false
  }

  const lockAdmin = () => setIsAdmin(false)

  const deleteClient = async (clientId) => {
    setClients(prev => prev.filter(c => c.id !== clientId))
    if (useSheets) {
      try { await deleteClientSheet(clientId) } catch (e) { console.error(e) }
    }
  }

  const deleteDemand = async (demandId) => {
    setDemands(prev => prev.filter(d => d.id !== demandId))
    if (useSheets) {
      try { await deleteDemandSheet(demandId) } catch (e) { console.error(e) }
    }
  }

  const login = (section, password) => {
    const valid = SECTION_PASSWORDS[section] || []
    if (password === 'admbruno_' || valid.includes(password)) {
      setLoggedIn(prev => ({ ...prev, [section]: true }))
      return section
    }
    for (const [sec, pwds] of Object.entries(SECTION_PASSWORDS)) {
      if (pwds.includes(password)) {
        setLoggedIn(prev => ({ ...prev, [sec]: true }))
        return sec
      }
    }
    return null
  }

  const logout = (section) => {
    if (section) setLoggedIn(prev => ({ ...prev, [section]: false }))
    else setLoggedIn({})
  }

  const getClientDemands = (clientId) => demands.filter(d => d.clientId === clientId)
  const getSectionDemands = (dest) => demands.filter(d => d.dest === dest)

  // Returns clients assigned to a given Social Media center (cc1 or cc2), excluding cancelled
  const getSocialClients = (centroCriativo) => {
    const currentWeek = getCurrentWeek()
    return clients
      .filter(c => !c.cancelado && (c.destinos || []).includes('Social Media') && c.ccSocial === centroCriativo)
      .map(c => {
        const posts = (c.socialWeek === currentWeek) ? (c.socialPosts || 0) : 0
        return { ...c, currentWeekPosts: posts, postsRemaining: Math.max(0, 3 - posts) }
      })
  }

  const activeClients = clients.filter(c => !c.cancelado)
  const cancelledClients = clients.filter(c => c.cancelado)

  return (
    <AppContext.Provider value={{
      clients: activeClients, allClients: clients, cancelledClients,
      demands, loading, loggedIn, isAdmin, pendingSales, reports,
      createClient, createDemand, toggleDemand, registerSocialPost, editClient, createReport, deleteReport,
      agenda, createAgendaItem, toggleAgendaItem, deleteAgendaItem,
      setClientStatus, setClientNotes, setClientPriority, setClientFinance, setClientCard, cancelClient,
      unlockAdmin, lockAdmin, deleteClient, deleteDemand, dismissPendingSale, backfillLpEcomDemands,
      login, logout,
      getClientDemands, getSectionDemands, getSocialClients,
      getClientTimeline, setTimelineEntry, getMissingTimelineClients,
      reload: load,
      useSheets
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
