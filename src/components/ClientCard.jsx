import { useApp, PRIORITY_COLORS, computeCurrentSaldo } from '../lib/AppContext'
import { DemandPill } from './UI'

export default function ClientCard({ client, onClick, hideFinance }) {
  const { getClientDemands } = useApp()
  const demands = getClientDemands(client.id)
  const done = demands.filter(d => d.done).length
  const pending = demands.filter(d => !d.done).length

  const priority = client.priorityStatus || 'estavel'
  const colors = PRIORITY_COLORS[priority]
  const saldo = computeCurrentSaldo(client)

  return (
    <div
      onClick={onClick}
      style={{
        background: colors.bg, border: `0.5px solid ${colors.border}`,
        borderRadius: 12, padding: '1rem 1.25rem', cursor: 'pointer',
        transition: 'background 0.15s', position: 'relative'
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)' }}
      onMouseLeave={e => { e.currentTarget.style.background = colors.bg }}
    >
      <div style={{ position: 'absolute', top: 12, right: 12, width: 10, height: 10, borderRadius: '50%', background: colors.border }} title={colors.label} />
      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{client.name}</div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
        {(client.destinos && client.destinos.length > 0 ? client.destinos : [client.destino]).filter(Boolean).map(d => (
          <span key={d} style={{ fontSize: 10, color: 'var(--orange)', background: 'var(--orange-dim)', padding: '2px 8px', borderRadius: 20 }}>{d}</span>
        ))}
      </div>
      {!hideFinance && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Saldo</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: colors.border }}>
            R${saldo.toLocaleString('pt-BR')}
          </span>
          <span style={{ fontSize: 10, color: '#333' }}>· R${(parseFloat(client.dailySpend)||0).toLocaleString('pt-BR')}/dia</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {done > 0 && <DemandPill done text={`${done} feita${done > 1 ? 's' : ''}`} />}
        {pending > 0 && <DemandPill done={false} text={`${pending} pendente${pending > 1 ? 's' : ''}`} />}
        {done === 0 && pending === 0 && <span style={{ fontSize: 11, color: '#333' }}>Sem demandas</span>}
      </div>
      <div style={{ fontSize: 11, color: '#444' }}>Desde {client.entrou}</div>
    </div>
  )
}
