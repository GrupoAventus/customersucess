import { useState } from 'react'
import { useApp } from '../lib/AppContext'
import CalendarModal from './CalendarModal'

const SECTIONS = [
  { id: 'ops', label: 'Centro de operações' },
  { id: 'dash', label: 'Dashboard' },
  { id: 'squad1', label: 'Squad 1' },
  { id: 'squad2', label: 'Squad 2' },
  { id: 'cc1', label: 'Centro criativo 1' },
  { id: 'cc2', label: 'Centro criativo 2' },
  { id: 'predictive', label: '🧠 IA Preditiva' },
]

export default function Nav({ current, onChange }) {
  const { logout, isAdmin, unlockAdmin, lockAdmin } = useApp()
  const [showCalendar, setShowCalendar] = useState(false)

  const toggleAdmin = () => {
    if (isAdmin) {
      lockAdmin()
    } else {
      const pw = window.prompt('Senha de administrador:')
      if (pw === null) return
      if (!unlockAdmin(pw)) alert('Senha incorreta')
    }
  }

  return (
    <>
      <nav style={{
        background: 'linear-gradient(180deg, #0c0a07 0%, #080601 100%)',
        borderBottom: '0.5px solid #1e1b14',
        display: 'flex', alignItems: 'center', height: 52,
        padding: '0 1.5rem', position: 'sticky', top: 0, zIndex: 100,
        gap: 0, overflowX: 'auto',
        boxShadow: '0 1px 24px rgba(0,0,0,0.5), 0 1px 0 rgba(255,107,26,0.04)',
      }}>
        {/* Logo */}
        <span style={{
          fontSize: 15, fontWeight: 900,
          marginRight: '2rem', flexShrink: 0,
          letterSpacing: '0.15em',
        }}>
          <span style={{ color: '#ff8c00', textShadow: '0 0 20px rgba(255,140,0,0.8), 0 0 40px rgba(255,100,0,0.4)' }}>A</span>
          <span style={{ color: '#fff', textShadow: '0 0 12px rgba(255,255,255,0.1)' }}>VENTUS</span>
        </span>

        {/* Abas */}
        {SECTIONS.map(s => {
          const active = current === s.id
          return (
            <button
              key={s.id}
              onClick={() => onChange(s.id)}
              style={{
                padding: '0 1rem', height: 52,
                background: active ? 'rgba(255,107,26,0.05)' : 'none',
                border: 'none',
                borderBottom: active
                  ? '1.5px solid var(--orange)'
                  : '1.5px solid transparent',
                borderTop: active
                  ? '1.5px solid transparent'
                  : '1.5px solid transparent',
                color: active ? 'var(--orange)' : '#4a4035',
                fontSize: 13, cursor: 'pointer',
                transition: 'color 0.15s, background 0.15s',
                whiteSpace: 'nowrap', flexShrink: 0,
                boxShadow: active ? 'inset 0 -1px 12px rgba(255,107,26,0.08)' : 'none',
              }}
            >
              {s.label}
            </button>
          )
        })}

        {/* Ações à direita */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexShrink: 0 }}>
          {/* Calendário */}
          <button
            onClick={() => setShowCalendar(true)}
            title="Calendário comemorativo"
            style={{
              fontSize: 12, color: '#4a4035', cursor: 'pointer',
              padding: '6px 10px', background: 'none',
              border: '0.5px solid #1e1b14', borderRadius: 6,
              display: 'flex', alignItems: 'center', gap: 4,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#2e2818'; e.currentTarget.style.color = '#7a6f5e' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1b14'; e.currentTarget.style.color = '#4a4035' }}
          >
            <i className="ti ti-calendar-event" />
            Calendário
          </button>

          {/* Admin */}
          <button
            onClick={toggleAdmin}
            title={isAdmin ? 'Modo admin ativo — clique para sair' : 'Ativar modo admin'}
            style={{
              fontSize: 12,
              color: isAdmin ? 'var(--orange)' : '#4a4035',
              cursor: 'pointer', padding: '6px 10px', background: 'none',
              border: `0.5px solid ${isAdmin ? 'rgba(255,107,26,0.4)' : '#1e1b14'}`,
              borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4,
              transition: 'all 0.15s',
              boxShadow: isAdmin ? '0 0 10px rgba(255,107,26,0.15)' : 'none',
            }}
          >
            <i className={`ti ti-${isAdmin ? 'lock-open' : 'lock'}`} />
            {isAdmin ? 'Admin' : ''}
          </button>

          {/* Sair */}
          <button
            onClick={() => logout()}
            style={{
              fontSize: 12, color: '#4a4035', cursor: 'pointer',
              padding: '6px 12px', background: 'none',
              border: '0.5px solid #1e1b14', borderRadius: 6,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#5a1f1f'; e.currentTarget.style.color = '#E24B4A' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1b14'; e.currentTarget.style.color = '#4a4035' }}
          >
            Sair
          </button>
        </div>
      </nav>

      {showCalendar && <CalendarModal onClose={() => setShowCalendar(false)} />}
    </>
  )
}
