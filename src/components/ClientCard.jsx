import { useApp, PRIORITY_COLORS } from '../lib/AppContext'
import { PIPELINE_STEPS } from './PipelineTab'

// Cores e glows por prioridade
const CARD_THEME = {
  estavel: {
    border:     'rgba(99,153,34,0.35)',
    glow:       'rgba(99,153,34,0.12)',
    dot:        '#639922',
    dotGlow:    '#639922',
    accent:     '#639922',
    barColor:   '#639922',
    tag:        'rgba(99,153,34,0.15)',
    tagText:    '#8bc34a',
  },
  atencao: {
    border:     'rgba(239,159,39,0.35)',
    glow:       'rgba(239,159,39,0.10)',
    dot:        '#EF9F27',
    dotGlow:    '#EF9F27',
    accent:     '#EF9F27',
    barColor:   '#EF9F27',
    tag:        'rgba(239,159,39,0.12)',
    tagText:    '#f0b830',
  },
  prioridade: {
    border:     'rgba(226,75,74,0.4)',
    glow:       'rgba(226,75,74,0.12)',
    dot:        '#E24B4A',
    dotGlow:    '#E24B4A',
    accent:     '#E24B4A',
    barColor:   '#E24B4A',
    tag:        'rgba(226,75,74,0.12)',
    tagText:    '#ff7070',
  },
}

export default function ClientCard({ client, onClick }) {
  const { getClientDemands, getClientPipeline, metaStatusMap } = useApp()
  const ms = metaStatusMap?.[client.id]
  const demands = getClientDemands(client.id)
  const done    = demands.filter(d => d.done).length
  const pending = demands.filter(d => !d.done).length

  const priority = client.priorityStatus || 'estavel'
  const th = CARD_THEME[priority]

  const pipelineSteps = getClientPipeline(client.id)
  const pipelineDone  = PIPELINE_STEPS.filter(s => pipelineSteps.find(p => p.step === s.id && p.done)).length
  const pipelinePct   = Math.round((pipelineDone / PIPELINE_STEPS.length) * 100)

  const destinos = (client.destinos && client.destinos.length > 0 ? client.destinos : [client.destino]).filter(Boolean)

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        background: `linear-gradient(135deg, #0e0c09 0%, #090701 100%)`,
        border: `0.5px solid ${th.border}`,
        borderRadius: 14,
        padding: '1.1rem 1.25rem',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'transform 0.15s, box-shadow 0.15s',
        boxShadow: `0 2px 16px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.03)`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${th.glow}, 0 0 0 0.5px rgba(255,255,255,0.04)`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = `0 2px 16px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.03)`
      }}
    >
      {/* Glow de fundo no canto superior direito (cor da prioridade) */}
      <div style={{
        position: 'absolute', top: -30, right: -30,
        width: 100, height: 100, borderRadius: '50%',
        background: `radial-gradient(circle, ${th.dot} 0%, transparent 70%)`,
        opacity: 0.08, pointerEvents: 'none',
      }} />

      {/* Linha de acento no topo */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent 0%, ${th.border} 40%, ${th.border} 60%, transparent 100%)`,
        opacity: 0.8,
      }} />

      {/* Alerta saldo baixo */}
      {ms?.lowBalance && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: 'rgba(226,75,74,0.15)', border: '0.5px solid rgba(226,75,74,0.4)',
          borderRadius: 20, padding: '2px 8px', marginBottom: 8,
          fontSize: 10, fontWeight: 600, color: '#ff7070',
        }}>
          ⚠️ Saldo R${Number(ms.balance).toFixed(2)}
        </div>
      )}

      {/* Nome + dot de status */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{
          fontSize: 14, fontWeight: 600, color: '#ede8e0',
          letterSpacing: '-0.01em', lineHeight: 1.3, paddingRight: 20,
        }}>
          {client.name}
        </div>
        <div style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 4,
          background: th.dot,
          boxShadow: `0 0 8px ${th.dotGlow}, 0 0 16px ${th.dotGlow}40`,
        }} title={priority === 'estavel' ? 'Estável' : priority === 'atencao' ? 'Atenção' : 'Prioridade'} />
      </div>

      {/* Tags de destino */}
      {destinos.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
          {destinos.map(d => (
            <span key={d} style={{
              fontSize: 10, fontWeight: 500,
              color: 'var(--orange)',
              background: 'rgba(255,107,26,0.1)',
              border: '0.5px solid rgba(255,107,26,0.2)',
              padding: '2px 8px', borderRadius: 20,
              letterSpacing: '0.01em',
            }}>{d}</span>
          ))}
        </div>
      )}

      {/* Barra de pipeline */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#3a3225', marginBottom: 4 }}>
          <span style={{ letterSpacing: '0.04em', textTransform: 'uppercase' }}>Esteira</span>
          <span style={{ color: pipelinePct === 100 ? th.accent : '#4a4035', fontWeight: 500 }}>
            {pipelineDone}/{PIPELINE_STEPS.length}
          </span>
        </div>
        <div style={{ height: 2, borderRadius: 2, background: '#1a1710', overflow: 'hidden', position: 'relative' }}>
          <div style={{
            height: '100%',
            width: `${pipelinePct}%`,
            background: pipelinePct === 100
              ? `linear-gradient(90deg, #3B6D11, ${th.barColor})`
              : `linear-gradient(90deg, ${th.barColor}88, ${th.barColor})`,
            borderRadius: 2,
            transition: 'width 0.4s ease',
            boxShadow: `0 0 6px ${th.barColor}80`,
          }} />
        </div>
      </div>

      {/* Demandas + data */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {done > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 500,
              background: 'rgba(99,153,34,0.12)',
              color: '#8bc34a',
              border: '0.5px solid rgba(99,153,34,0.2)',
              padding: '2px 7px', borderRadius: 20,
            }}>{done} feita{done > 1 ? 's' : ''}</span>
          )}
          {pending > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 500,
              background: 'rgba(239,159,39,0.1)',
              color: '#f0b830',
              border: '0.5px solid rgba(239,159,39,0.2)',
              padding: '2px 7px', borderRadius: 20,
            }}>{pending} pendente{pending > 1 ? 's' : ''}</span>
          )}
          {done === 0 && pending === 0 && (
            <span style={{ fontSize: 10, color: '#2a2418' }}>Sem demandas</span>
          )}
        </div>
        <span style={{ fontSize: 10, color: '#2e2820', flexShrink: 0 }}>
          {client.entrou}
        </span>
      </div>
    </div>
  )
}
