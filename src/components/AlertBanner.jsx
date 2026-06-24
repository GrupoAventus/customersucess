import { useApp } from '../lib/AppContext'

export default function AlertBanner({ section }) {
  const { alerts, dismissAlert } = useApp()
  const sectionAlerts = alerts.filter(a => a.sections.includes(section))
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
            onClick={() => dismissAlert(a.id)}
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
