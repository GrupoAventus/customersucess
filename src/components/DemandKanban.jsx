import { useState } from 'react'
import { useApp } from '../lib/AppContext'
import DemandDetailModal from './DemandDetailModal'
import NewDemandModal from './NewDemandModal'

const STAGES = [
  { id: 'demandas',             label: 'Demandas',                   color: '#888',    bg: '#161616' },
  { id: 'em_producao',          label: 'Em produção',                color: '#f59e0b', bg: '#1a1500' },
  { id: 'aguardando_aprovacao', label: 'Finalizado / Ag. aprovação', color: '#3b82f6', bg: '#001020' },
  { id: 'alteracao',            label: 'Alteração',                  color: '#e24b4a', bg: '#1a0808' },
  { id: 'aprovado',             label: 'Aprovado',                   color: '#22c55e', bg: '#001a08' },
]

const TODAY = new Date().toISOString().slice(0, 10)

function ProgressBar({ pct }) {
  const color = pct === 100 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#e24b4a'
  return (
    <div style={{ height: 3, background: '#1f1f1f', borderRadius: 4, overflow: 'hidden', marginTop: 5 }}>
      <div style={{ height: '100%', borderRadius: 4, width: `${pct}%`, background: color, transition: 'width 0.3s' }} />
    </div>
  )
}

function StageArrows({ demand, onStageChange }) {
  const idx = STAGES.findIndex(s => s.id === (demand.stage || 'demandas'))
  return (
    <div style={{ display: 'flex', gap: 1, flexShrink: 0 }}>
      {idx > 0 && (
        <button title={STAGES[idx - 1].label} onClick={() => onStageChange(STAGES[idx - 1].id)}
          style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', padding: '0 3px', fontSize: 13, lineHeight: 1 }}>‹</button>
      )}
      {idx < STAGES.length - 1 && (
        <button title={STAGES[idx + 1].label} onClick={() => onStageChange(STAGES[idx + 1].id)}
          style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: '0 3px', fontSize: 13, lineHeight: 1 }}>›</button>
      )}
    </div>
  )
}

function DemandRow({ demand, onOpen, onToggle, onStageChange, onDelete }) {
  const isOverdue = !demand.done && demand.prazo && demand.prazo < TODAY
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 7,
      padding: '5px 0',
      borderBottom: '1px solid #1a1a1a',
      background: isOverdue ? 'rgba(226,75,74,0.04)' : 'transparent',
    }}>
      {/* Checkbox */}
      <button onClick={onToggle} style={{
        width: 14, height: 14, borderRadius: 3, flexShrink: 0,
        border: `1.5px solid ${demand.done ? '#22c55e' : '#333'}`,
        background: demand.done ? '#22c55e' : 'transparent',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
      }}>
        {demand.done && <i className="ti ti-check" style={{ fontSize: 9, color: '#000' }} />}
      </button>

      {/* Texto */}
      <span onClick={onOpen} style={{
        flex: 1, fontSize: 11, color: demand.done ? '#3a3a3a' : '#ccc',
        textDecoration: demand.done ? 'line-through' : 'none',
        cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{demand.text}</span>

      {/* Prazo */}
      {demand.prazo && (
        <span style={{ fontSize: 10, color: isOverdue ? '#e24b4a' : '#333', flexShrink: 0, whiteSpace: 'nowrap' }}>
          {isOverdue && <i className="ti ti-alert-triangle" style={{ marginRight: 2 }} />}
          {demand.prazo.slice(5)} {/* mostra MM-DD */}
        </span>
      )}

      {/* Setas de stage */}
      <StageArrows demand={demand} onStageChange={onStageChange} />

      {/* Delete */}
      {onDelete && (
        <button onClick={onDelete} style={{ background: 'none', border: 'none', color: '#252525', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
          <i className="ti ti-x" style={{ fontSize: 10 }} />
        </button>
      )}
    </div>
  )
}

function ClientCard({ client, demands, stageId, destLabel }) {
  const { toggleDemand, setDemandStage, isAdmin, deleteDemand } = useApp()
  const [selected, setSelected] = useState(null)
  const [adding, setAdding]     = useState(false)

  const active = demands.filter(d => !d.done)
  const done   = demands.filter(d => d.done)
  const total  = demands.length
  const pct    = total === 0 ? 0 : Math.round((done.length / total) * 100)

  // Ordena ativas: prazo mais próximo primeiro, sem prazo por último
  const sorted = [...active].sort((a, b) => {
    if (!a.prazo && !b.prazo) return 0
    if (!a.prazo) return 1
    if (!b.prazo) return -1
    return a.prazo.localeCompare(b.prazo)
  })

  return (
    <div style={{
      background: '#111', border: '1px solid #1f1f1f', borderRadius: 8,
      marginBottom: 8, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '8px 10px 6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {client.name}
          </span>
          <span style={{ fontSize: 10, color: '#444', flexShrink: 0 }}>{done.length}/{total}</span>
        </div>
        <ProgressBar pct={pct} />
      </div>

      {/* Demandas */}
      <div style={{ padding: '0 10px' }}>
        {sorted.map(d => (
          <DemandRow
            key={d.id}
            demand={d}
            onOpen={() => setSelected(d)}
            onToggle={() => toggleDemand(d.id)}
            onStageChange={s => setDemandStage(d.id, s)}
            onDelete={isAdmin ? () => { if (window.confirm(`Excluir "${d.text}"?`)) deleteDemand(d.id) } : null}
          />
        ))}

        {/* Botão adicionar */}
        <button onClick={() => setAdding(true)} style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'none', border: 'none', color: '#2a2a2a',
          cursor: 'pointer', fontSize: 11, padding: '6px 0', width: '100%',
        }}>
          <i className="ti ti-plus" style={{ fontSize: 11 }} /> demanda
        </button>
      </div>

      {selected && <DemandDetailModal demand={selected} onClose={() => setSelected(null)} />}
      {adding && (
        <NewDemandModal
          defaultClientId={client.id}
          defaultDest={destLabel}
          defaultStage={stageId}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  )
}

export default function DemandKanban({ demands, destLabel }) {
  const { clients } = useApp()

  // Para cada coluna: clientes com pelo menos 1 demanda ativa (não done) naquela coluna
  const getClientsForStage = (stageId) => {
    const clientIds = [...new Set(
      demands
        .filter(d => (d.stage || 'demandas') === stageId && !d.done)
        .map(d => d.clientId)
    )]

    return clientIds
      .map(id => ({
        client:  clients.find(c => c.id === id),
        demands: demands.filter(d => d.clientId === id && (d.stage || 'demandas') === stageId),
      }))
      .filter(x => x.client)
      .sort((a, b) => {
        const aActive = a.demands.filter(d => !d.done)
        const bActive = b.demands.filter(d => !d.done)
        // Prazo mais próximo primeiro
        const aMin = aActive.filter(d => d.prazo).map(d => d.prazo).sort()[0] || '9999'
        const bMin = bActive.filter(d => d.prazo).map(d => d.prazo).sort()[0] || '9999'
        return aMin.localeCompare(bMin)
      })
  }

  if (demands.length === 0) {
    return <div style={{ color: '#333', fontSize: 13, padding: '16px 0' }}>Nenhuma demanda para este centro criativo</div>
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: 10,
      alignItems: 'start',
    }}>
      {STAGES.map(stage => {
        const colClients = getClientsForStage(stage.id)
        const totalActive = colClients.reduce((s, x) => s + x.demands.filter(d => !d.done).length, 0)

        return (
          <div key={stage.id} style={{
            background: stage.bg, borderRadius: 10,
            padding: '10px 8px 6px',
            minHeight: 60,
          }}>
            {/* Header coluna */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 10, paddingBottom: 8,
              borderBottom: `1px solid ${stage.color}22`,
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: stage.color, letterSpacing: '0.03em', lineHeight: 1.3 }}>
                {stage.label}
              </span>
              {totalActive > 0 && (
                <span style={{ fontSize: 10, color: stage.color, background: `${stage.color}22`, borderRadius: 20, padding: '1px 6px', flexShrink: 0 }}>
                  {totalActive}
                </span>
              )}
            </div>

            {colClients.length === 0
              ? <div style={{ color: '#1f1f1f', fontSize: 11, textAlign: 'center', padding: '8px 0' }}>—</div>
              : colClients.map(({ client, demands: cDemands }) => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    demands={cDemands}
                    stageId={stage.id}
                    destLabel={destLabel}
                  />
                ))
            }
          </div>
        )
      })}
    </div>
  )
}
