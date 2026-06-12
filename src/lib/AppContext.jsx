import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { fetchClients, fetchDemands, addClient, addDemand, updateClient, toggleDemandSheet } from '../lib/sheets'

const AppContext = createContext(null)

// Fallback demo data when Sheets not configured
const DEMO_CLIENTS = [
  { id: 'c_1', name: 'Bella Store', drive: 'https://drive.google.com', instagram: 'https://instagram.com/bellastore', site: 'https://bellastore.com', entrou: '2024-09-10', destino: 'Squad 1', saldoMax: 500, saldo: 120, createdAt: '' },
  { id: 'c_2', name: 'TechFlow', drive: 'https://drive.google.com', instagram: 'https://instagram.com/techflow', site: 'https://techflow.com', entrou: '2024-10-01', destino: 'Squad 2', saldoMax: 1000, saldo: 890, createdAt: '' },
  { id: 'c_3', name: 'Casa & Cia', drive: 'https://drive.google.com', instagram: 'https://instagram.com/casaecia', site: 'https://casaecia.com', entrou: '2024-11-05', destino: 'Ecom', saldoMax: 400, saldo: 22, createdAt: '' },
]
const DEMO_DEMANDS = [
  { id: 'd_1', clientId: 'c_1', text: 'Criar campanha de remarketing', prazo: '2024-12-01', dest: 'Squad 1', done: true, createdAt: '' },
  { id: 'd_2', clientId: 'c_1', text: 'Ajustar copy dos anúncios', prazo: '2024-12-15', dest: 'Centro criativo 1', done: false, createdAt: '' },
  { id: 'd_3', clientId: 'c_2', text: 'Landing page nova', prazo: '2024-12-20', dest: 'Squad 2', done: false, createdAt: '' },
]

const useSheets = Boolean(import.meta.env.VITE_SCRIPT_URL)

export function AppProvider({ children }) {
  const [clients, setClients] = useState(useSheets ? [] : DEMO_CLIENTS)
  const [demands, setDemands] = useState(useSheets ? [] : DEMO_DEMANDS)
  const [loading, setLoading] = useState(useSheets)
  const [loggedIn, setLoggedIn] = useState({})

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
    if (useSheets) {
      const saved = await addClient(data)
      setClients(prev => [...prev, saved])
      return saved
    } else {
      const newC = { ...data, id: `c_${Date.now()}` }
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
      if (useSheets) {
        toggleDemandSheet(updated).catch(console.error)
      }
      return updated
    }))
  }

  const login = (section, password) => {
    if (password === '12') {
      setLoggedIn(prev => ({ ...prev, [section]: true }))
      return true
    }
    return false
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

  return (
    <AppContext.Provider value={{
      clients, demands, loading, loggedIn,
      createClient, createDemand, toggleDemand,
      login, logout,
      getClientDemands, getSectionDemands, getSaldoStatus,
      reload: load,
      useSheets
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
