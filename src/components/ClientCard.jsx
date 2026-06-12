import { useApp } from '../lib/AppContext'
import { SaldoBadge, DemandPill } from './UI'

export default function ClientCard({ client, onClick, hideFinance }) {
  const { getSaldoStatus, getClientDemands } = useApp()
  const status = getSaldoStatus(client)
  const demands = getClientDemands(client.id)
  const done = demands.filter(d => d.done).length
  const pending = demands.filter(d => !d.done).length

  const saldoColor = { ok: 'var(--green)', low: 'var(--amber)', critical: 'var(--red)' }[status]

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-card)', border: '0.5px solid var(--border)',
        borderRadius: 12, padding: '1rem 1.25rem', cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s', position: 'relative'
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--orange)'; e.currentTarget.style.background = 'var(--bg-hover)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)' }}
    >
      {!hideFinance && (
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          <SaldoBadge status={status} />
        </div>
      )}
      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{client.name}</div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
        {(client.destinos && client.destinos.length > 0 ? client.destinos : [client.destino]).filter(Boolean).map(d => (
          <span key={d} style={{ fontSize: 10, color: 'var(--orange)', background: 'var(--orange-dim)', padding: '2px 8px', borderRadius: 20 }}>{d}</span>
        ))}
      </div>
      {!hideFinance && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Saldo</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: saldoColor }}>
            R${client.saldo?.toLocaleString('pt-BR')}
          </span>
          <span style={{ fontSize: 10, color: '#333' }}>/ R${client.saldoMax?.toLocaleString('pt-BR')}</span>
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
