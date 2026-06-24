import { useApp } from '../lib/AppContext'

export default function NotificationBanner({ section }) {
  const { notifications, dismissNotification } = useApp()
  const sectionNotifs = notifications.filter(n => n.section === section)
  if (sectionNotifs.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
      {sectionNotifs.map(n => (
        <div key={n.id} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 16px',
          background: n.type === 'new_client' ? 'rgba(99,153,34,0.12)' : 'rgba(239,159,39,0.12)',
          border: `0.5px solid ${n.type === 'new_client' ? 'var(--green)' : 'var(--amber)'}`,
          borderRadius: 10,
        }}>
          <i className={`ti ti-${n.type === 'new_client' ? 'user-plus' : 'clipboard-plus'}`}
            style={{ color: n.type === 'new_client' ? 'var(--green)' : 'var(--amber)', fontSize: 18, flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: 13 }}>
            {n.type === 'new_client'
              ? <><strong style={{ color: n.type === 'new_client' ? 'var(--green)' : 'var(--amber)' }}>{n.clientName}</strong> é um novo cliente nesta seção</>
              : <>Nova demanda: <strong style={{ color: 'var(--amber)' }}>{n.text}</strong> — {n.clientName}</>
            }
          </div>
          <button
            onClick={() => dismissNotification(n.id)}
            style={{
              background: 'none', border: `0.5px solid ${n.type === 'new_client' ? 'var(--green)' : 'var(--amber)'}`,
              borderRadius: 6, padding: '4px 12px', fontSize: 12,
              color: n.type === 'new_client' ? 'var(--green)' : 'var(--amber)',
              cursor: 'pointer', flexShrink: 0
            }}
          >
            OK
          </button>
        </div>
      ))}
    </div>
  )
}
