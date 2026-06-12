import { useApp } from '../lib/AppContext'

const SECTIONS = [
  { id: 'ops', label: 'Centro de operações' },
  { id: 'dash', label: 'Dashboard' },
  { id: 'squad1', label: 'Squad 1' },
  { id: 'squad2', label: 'Squad 2' },
  { id: 'cc1', label: 'Centro criativo 1' },
  { id: 'cc2', label: 'Centro criativo 2' },
]

export default function Nav({ current, onChange }) {
  const { logout, isAdmin, unlockAdmin, lockAdmin } = useApp()

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
    <nav style={{
      background: '#0f0f0f', borderBottom: '0.5px solid #1f1f1f',
      display: 'flex', alignItems: 'center', height: 52,
      padding: '0 1.5rem', position: 'sticky', top: 0, zIndex: 100,
      gap: 0, overflowX: 'auto'
    }}>
      <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--orange)', marginRight: '2rem', flexShrink: 0 }}>
        ⬡ AgencyOS
      </span>
      {SECTIONS.map(s => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          style={{
            padding: '0 1rem', height: 52, background: 'none', border: 'none',
            borderBottom: current === s.id ? '2px solid var(--orange)' : '2px solid transparent',
            color: current === s.id ? 'var(--orange)' : '#666',
            fontSize: 13, cursor: 'pointer', transition: 'color 0.15s',
            whiteSpace: 'nowrap', flexShrink: 0
          }}
        >
          {s.label}
        </button>
      ))}

      <button
        onClick={toggleAdmin}
        title={isAdmin ? 'Modo admin ativo — clique para sair' : 'Ativar modo admin'}
        style={{
          marginLeft: 'auto', fontSize: 12,
          color: isAdmin ? 'var(--orange)' : '#444',
          cursor: 'pointer', padding: '6px 10px', background: 'none',
          border: `0.5px solid ${isAdmin ? 'var(--orange)' : '#2a2a2a'}`,
          borderRadius: 6, flexShrink: 0, marginRight: 8,
          display: 'flex', alignItems: 'center', gap: 4
        }}
      >
        <i className={`ti ti-${isAdmin ? 'lock-open' : 'lock'}`} />
        {isAdmin ? 'Admin' : ''}
      </button>

      <button
        onClick={() => logout()}
        style={{
          fontSize: 12, color: '#444', cursor: 'pointer',
          padding: '6px 12px', background: 'none',
          border: '0.5px solid #2a2a2a', borderRadius: 6, flexShrink: 0
        }}
      >
        Sair
      </button>
    </nav>
  )
}
