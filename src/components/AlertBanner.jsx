import { useState, useEffect } from 'react'
import { useApp } from '../lib/AppContext'
import { fetchAlerts, dismissAlertSheet } from '../lib/sheets'

export default function AlertBanner({ section }) {
  const { useSheets } = useApp()
  const [localAlerts, setLocalAlerts] = useState([])
  const { alerts, dismissAlert } = useApp()

  // Load fresh from sheets every time this component mounts
  useEffect(() => {
    if (!useSheets) return
    fetchAlerts().then(raw => {
      const parsed = raw.map(a => ({
        id: a.id,
        message: a.message,
        sections: typeof a.sections === 'string' ? JSON.parse(a.sections) : (a.sections || [])
      }))
      setLocalAlerts(parsed)
    }).catch(console.error)
  }, [])

  // Merge: local (from sheet) + in-memory (just broadcast)
  const allAlerts = [
    ...localAlerts,
    ...alerts.filter(a => !localAlerts.find(l => l.id === a.id))
  ]

  const sectionAlerts = allAlerts.filter(a => {
    const secs = Array.isArray(a.sections) ? a.sections : []
    return secs.includes(section)
  })

  const handleDismiss = async (id) => {
    setLocalAlerts(prev => prev.filter(a => a.id !== id))
    dismissAlert(id)
  }

  if (sectionAlerts.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
      {sectionAlerts.map(a => (
        <div key={a.id} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 16px',
          background: 'rgba(239,159,39,0.1)',
          border: '0.5px solid var(--orange)',
          borderRadius: 10,
        }}>
          <i className="ti ti-speakerphone" style={{ color: 'var(--orange)', fontSize: 18, flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: 13, color: '#ccc' }}>{a.message}</div>
          <button
            onClick={() => handleDismiss(a.id)}
            style={{
              background: 'none', border: '0.5px solid var(--orange)',
              borderRadius: 6, padding: '4px 14px', fontSize: 12,
              color: 'var(--orange)', cursor: 'pointer', flexShrink: 0
            }}
          >
            OK
          </button>
        </div>
      ))}
    </div>
  )
}
