import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { fetchClients, fetchDemands, addClient, addDemand, updateClient, toggleDemandSheet, incrementSocialPost, updateClientStatus, updateClientNotes, cancelClientSheet, deleteClientSheet, deleteDemandSheet } from './sheets'

const AppContext = createContext(null)

export const KANBAN_COLUMNS = ['Pegar acessos', 'Aguardando campanha', 'Campanha ativa', 'Anúncios pausados']

// Fallback demo data when Sheets not configured
const DEMO_CLIENTS = [
  { id: 'c_1', name: 'Bella Store', drive: 'https://drive.google.com', instagram: 'https://instagram.com/bellastore', site: 'https://bellastore.com', entrou: '2024-09-10', destino: 'Squad 1', saldoMax: 500, saldo: 120, createdAt: '', destinos: ['Squad 1','Social Media'], ccLP:'', ccEcom:'', ccSocial:'Centro criativo 1', socialPosts: 1, socialWeek: '', status: 'Campanha ativa', observacoes: '', cancelado: false },
  { id: 'c_2', name: 'TechFlow', drive: 'https://drive.google.com', instagram: 'https://instagram.com/techflow', site: 'https://techflow.com', entrou: '2024-10-01', destino: 'Squad 2', saldoMax: 1000, saldo: 890, createdAt: '', destinos: ['Squad 2'], ccLP:'', ccEcom:'', ccSocial:'', socialPosts: 0, socialWeek: '', status: 'Aguardando campanha', observacoes: '', cancelado: false },
  { id: 'c_3', name: 'Casa & Cia', drive: 'https://drive.google.com', instagram: 'https://instagram.com/casaecia', site: 'https://casaecia.com', entrou: '2024-11-05', destino: 'Ecom', saldoMax: 400, saldo: 22, createdAt: '', destinos: ['Ecom','Social Media'], ccLP:'', ccEcom:'Centro criativo 2', ccSocial:'Centro criativo 2', socialPosts: 0, socialWeek: '', status: 'Pegar acessos', observacoes: '', cancelado: false },
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

export function AppProvider({ children }) {
  const [clients, setClients] = useState(useSheets ? [] : DEMO_CLIENTS)
  const [demands, setDemands] = useState(useSheets ? [] : DEMO_DEMANDS)
  const [loading, setLoading] = useState(useSheets)
  const [loggedIn, setLoggedIn] = useState({})
  const [isAdmin, setIsAdmin] = useState(false)

  const load = useCallback(async () => {
    if (!useSheets) return
    setLoading(true)
    try {
      const [c, d] = await Promise.all([fetchClients(), fetchDemands()])
      setClients(c)
      setDemands(d)
    } catch (e) {
      console.error('Load error:', e)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const createClient = async (data) => {
    const payload = { status: 'Pegar acessos', observacoes: '', cancelado: false, ...data }
    if (useSheets) {
      const saved = await addClient(payload)
      setClients(prev => [...prev, saved])
      return saved
    } else {
      const newC = { ...payload, id: `c_${Date.now()}`, socialPosts: 0, socialWeek: '' }
      setClients(prev => [...prev, newC])
      return newC
    }
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
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, status } : c))
    if (useSheets) {
      try { await updateClientStatus(clientId, status) } catch (e) { console.error(e) }
    }
  }

  const setClientNotes = async (clientId, observacoes) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, observacoes } : c))
    if (useSheets) {
      try { await updateClientNotes(clientId, observacoes) } catch (e) { console.error(e) }
    }
  }

  const cancelClient = async (clientId, cancelado = true) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, cancelado } : c))
    if (useSheets) {
      try { await cancelClientSheet(clientId, cancelado) } catch (e) { console.error(e) }
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
    // Check if password matches another section's password -> unlock & redirect there
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

  const getSaldoStatus = (client) => {
    if (!client.saldoMax) return 'ok'
    const pct = client.saldo / client.saldoMax
    if (pct > 0.3) return 'ok'
    if (pct > 0.1) return 'low'
    return 'critical'
  }

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
      demands, loading, loggedIn, isAdmin,
      createClient, createDemand, toggleDemand, registerSocialPost,
      setClientStatus, setClientNotes, cancelClient,
      unlockAdmin, lockAdmin, deleteClient, deleteDemand,
      login, logout,
      getClientDemands, getSectionDemands, getSaldoStatus, getSocialClients,
      reload: load,
      useSheets
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
