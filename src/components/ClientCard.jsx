import { useApp, PRIORITY_COLORS } from '../lib/AppContext'
import { PIPELINE_STEPS } from './PipelineTab'
import { DemandPill } from './UI'

export default function ClientCard({ client, onClick }) {
  const { getClientDemands, getClientPipeline } = useApp()
  const demands = getClientDemands(client.id)
  const done = demands.filter(d => d.done).length
  const pending = demands.filter(d => !d.done).length

  const priority = client.priorityStatus || 'estavel'
  const colors = PRIORITY_COLORS[priority]

  const pipelineSteps = getClientPipeline(client.id)
  const pipelineDone = PIPELINE_STEPS.filter(s => pipelineSteps.find(p => p.step === s.id && p.done)).length
  const pipelinePct = Math.round((pipelineDone / PIPELINE_STEPS.length) * 100)

  return (
    <div onClick={onClick} style={{
      background: colors.bg, border: `0.5px solid ${colors.border}`,
      borderRadius: 12, padding: '1rem 1.25rem', cursor: 'pointer',
      transition: 'background 0.15s', position: 'relative'
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)' }}
      onMouseLeave={e => { e.currentTarget.style.background = colors.bg }}
    >
      <div style={{ position: 'absolute', top: 12, right: 12, width: 10, height: 10, borderRadius: '50%', background: colors.border }} title={colors.label} />
      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{client.name}</div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
        {(client.destinos && client.destinos.length > 0 ? client.destinos : [client.destino]).filter(Boolean).map(d => (
          <span key={d} style={{ fontSize: 10, color: 'var(--orange)', background: 'var(--orange-dim)', padding: '2px 8px', borderRadius: 20 }}>{d}</span>
        ))}
      </div>

      {/* Pipeline progress */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#555', marginBottom: 3 }}>
          <span>Esteira</span>
          <span>{pipelineDone}/{PIPELINE_STEPS.length}</span>
        </div>
        <div style={{ height: 3, borderRadius: 2, background: '#1f1f1f', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pipelinePct}%`, background: pipelinePct === 100 ? 'var(--green)' : 'var(--orange)' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {done > 0 && <DemandPill done text={`${done} feita${done > 1 ? 's' : ''}`} />}
        {pending > 0 && <DemandPill done={false} text={`${pending} pendente${pending > 1 ? 's' : ''}`} />}
        {done === 0 && pending === 0 && <span style={{ fontSize: 11, color: '#333' }}>Sem demandas</span>}
      </div>
      <div style={{ fontSize: 11, color: '#444' }}>Desde {client.entrou}</div>
    </div>
  )
}
