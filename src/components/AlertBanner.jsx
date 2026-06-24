import { useState, useEffect } from 'react'
import { useApp } from '../lib/AppContext'
import { fetchAlerts, dismissAlertSheet } from '../lib/sheets'

export default function AlertBanner({ section }) {
  const { dismissAlert, useSheets } = useApp()
  const [localAlerts, setLocalAlerts] = useState([])

  useEffect(() => {
    if (!useSheets) return
    const load = () => fetchAlerts().then(setLocalAlerts).catch(console.error)
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [])

  const sectionAlerts = localAlerts.filter(a => a.sections.includes(section))

  const handleDismiss = async (id) => {
    setLocalAlerts(prev => prev.filter(a => a.id !== id))
    if (useSheets) {
      try { await dismissAlertSheet(id) } catch (e) { console.error(e) }
    }
  }

  if (sectionAlerts.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
      {sectionAlerts.map(a => {
        const isNewClient = a.type === 'new_client'
        const isNewDemand = a.type === 'new_demand'
        const color = isNewClient ? 'var(--green)' : isNewDemand ? 'var(--amber)' : 'var(--orange)'
        const bg = isNewClient ? 'rgba(99,153,34,0.1)' : isNewDemand ? 'rgba(239,159,39,0.1)' : 'rgba(239,159,39,0.1)'
        const icon = isNewClient ? 'user-plus' : isNewDemand ? 'clipboard-plus' : 'speakerphone'
        return (
          <div key={a.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 16px', background: bg,
            border: `0.5px solid ${color}`, borderRadius: 10,
          }}>
            <i className={`ti ti-${icon}`} style={{ color, fontSize: 18, flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 13, color: '#ccc' }}>{a.message}</div>
            <button onClick={() => handleDismiss(a.id)} style={{
              background: 'none', border: `0.5px solid ${color}`,
              borderRadius: 6, padding: '4px 14px', fontSize: 12,
              color, cursor: 'pointer', flexShrink: 0
            }}>OK</button>
          </div>
        )
      })}
    </div>
  )
}
