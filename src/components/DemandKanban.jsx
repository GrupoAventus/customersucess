import { useState } from 'react'
import { useApp } from '../lib/AppContext'
import DemandDetailModal from './DemandDetailModal'
import NewDemandModal from './NewDemandModal'

const STAGES = [
  { id: 'demandas',             label: 'Demandas',                   color: '#888',    bg: '#161616' },
  { id: 'em_producao',          label: 'Em produção',                color: '#f59e0b', bg: '#1a1500' },
  { id: 'aguardando_aprovacao', label: 'Finalizado / Ag. aprovação', color: '#3b82f6', bg: '#001020' },
  { id: 'alteracao',            label: 'Alteração',                  color: '#e24b4a', bg: '#1a0808' },
]

function DemandCard({ demand, onOpen, onToggle, onStageChange, onDelete }) {
  const isOverdue = !demand.done && demand.prazo && demand.prazo < new Date().toISOString().slice(0, 10)

  return (
    <div style={{
      background: '#111',
      border: `1px solid ${isOverdue ? '#3a1010' : '#1f1f1f'}`,
      borderRadius: 8,
      padding: '9px 10px',
      marginBottom: 6,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 8,
    }}>
      {/* Checkbox */}
      <button
        onClick={onToggle}
        style={{
          width: 15, height: 15, borderRadius: 3, flexShrink: 0, marginTop: 1,
          border: `1.5px solid ${demand.done ? 'var(--green)' : '#333'}`,
          background: demand.done ? 'var(--green)' : 'transparent',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
        }}
      >
        {demand.done && <i className="ti ti-check" style={{ fontSize: 9, color: '#000' }} />}
      </button>

      {/* Texto + prazo */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          onClick={onOpen}
          style={{
            fontSize: 12, color: demand.done ? '#444' : '#ccc',
            textDecoration: demand.done ? 'line-through' : 'none',
            cursor: 'pointer', lineHeight: 1.4,
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}
        >
          {demand.text}
        </div>
        {demand.prazo && (
          <div style={{ fontSize: 10, marginTop: 3, color: isOverdue ? '#e24b4a' : '#444' }}>
            {isOverdue && <i className="ti ti-alert-triangle" style={{ marginRight: 2 }} />}
            {demand.prazo}
          </div>
        )}
      </div>

      {/* Mover para coluna — setas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
        <StageArrows demand={demand} onStageChange={onStageChange} />
      </div>

      {/* Deletar */}
      {onDelete && (
        <button onClick={onDelete} style={{ background: 'none', border: 'none', color: '#252525', cursor: 'pointer', padding: 0, flexShrink: 0, marginTop: 1 }}>
          <i className="ti ti-x" style={{ fontSize: 11 }} />
        </button>
      )}
    </div>
  )
}

function StageArrows({ demand, onStageChange }) {
  const idx = STAGES.findIndex(s => s.id === (demand.stage || 'demandas'))
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {idx > 0 && (
        <button
          title={`← ${STAGES[idx - 1].label}`}
          onClick={() => onStageChange(STAGES[idx - 1].id)}
          style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', padding: '1px 3px', fontSize: 11 }}
        >
          ‹
        </button>
      )}
      {idx < STAGES.length - 1 && (
        <button
          title={`→ ${STAGES[idx + 1].label}`}
          onClick={() => onStageChange(STAGES[idx + 1].id)}
          style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: '1px 3px', fontSize: 11 }}
        >
          ›
        </button>
      )}
    </div>
  )
}

function ClientColumnCard({ client, demands, stageId, destLabel }) {
  const { toggleDemand, setDemandStage, isAdmin, deleteDemand } = useApp()
  const [selected, setSelected] = useState(null)
  const [adding, setAdding] = useState(false)
  const [showDone, setShowDone] = useState(false)

  const active = demands.filter(d => !d.done)
  const done   = demands.filter(d => d.done)

  return (
    <div style={{ marginBottom: 8 }}>
      {/* Header do cliente nesta coluna */}
      <div style={{
        fontSize: 11, fontWeight: 600, color: '#888',
        padding: '4px 2px 6px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {client.name}
        </span>
        <span style={{ color: '#333', fontWeight: 400, flexShrink: 0, marginLeft: 6 }}>
          {active.length}
        </span>
      </div>

      {/* Demandas ativas */}
      {active.map(d => (
        <DemandCard
          key={d.id}
          demand={d}
          onOpen={() => setSelected(d)}
          onToggle={() => toggleDemand(d.id)}
          onStageChange={s => setDemandStage(d.id, s)}
          onDelete={isAdmin ? () => { if (window.confirm(`Excluir "${d.text}"?`)) deleteDemand(d.id) } : null}
        />
      ))}

      {/* Finalizadas */}
      {done.length > 0 && (
        <>
          <button
            onClick={() => setShowDone(v => !v)}
            style={{ background: 'none', border: 'none', color: '#2a2a2a', cursor: 'pointer', fontSize: 10, padding: '2px 0', marginBottom: 4 }}
          >
            <i className={`ti ti-chevron-${showDone ? 'up' : 'down'}`} style={{ fontSize: 9, marginRight: 3 }} />
            Feitas ({done.length})
          </button>
          {showDone && done.map(d => (
            <DemandCard
              key={d.id}
              demand={d}
              onOpen={() => setSelected(d)}
              onToggle={() => toggleDemand(d.id)}
              onStageChange={s => setDemandStage(d.id, s)}
              onDelete={isAdmin ? () => { if (window.confirm(`Excluir "${d.text}"?`)) deleteDemand(d.id) } : null}
            />
          ))}
        </>
      )}

      {/* Botão adicionar */}
      <button
        onClick={() => setAdding(true)}
        style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#2a2a2a', cursor: 'pointer', fontSize: 11, padding: '2px 0', marginTop: 2 }}
      >
        <i className="ti ti-plus" style={{ fontSize: 11 }} /> demanda
      </button>

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

  // Para cada coluna, quais clientes têm demandas lá
  const getClientsForStage = (stageId) => {
    const clientIds = [...new Set(
      demands
        .filter(d => (d.stage || 'demandas') === stageId)
        .map(d => d.clientId)
    )]
    return clientIds
      .map(id => ({
        client: clients.find(c => c.id === id),
        demands: demands.filter(d => d.clientId === id && (d.stage || 'demandas') === stageId),
      }))
      .filter(x => x.client)
      .sort((a, b) => {
        const aActive = a.demands.filter(d => !d.done)
        const bActive = b.demands.filter(d => !d.done)
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
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 12,
      alignItems: 'start',
    }}>
      {STAGES.map(stage => {
        const colClients = getClientsForStage(stage.id)
        const totalActive = colClients.reduce((s, x) => s + x.demands.filter(d => !d.done).length, 0)

        return (
          <div key={stage.id} style={{ background: stage.bg, borderRadius: 10, padding: '10px 10px 6px', minHeight: 80 }}>
            {/* Header da coluna */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 10, paddingBottom: 8,
              borderBottom: `1px solid ${stage.color}22`,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: stage.color, letterSpacing: '0.03em' }}>
                {stage.label}
              </span>
              {totalActive > 0 && (
                <span style={{ fontSize: 10, color: stage.color, background: `${stage.color}22`, borderRadius: 20, padding: '1px 7px' }}>
                  {totalActive}
                </span>
              )}
            </div>

            {/* Cards por cliente */}
            {colClients.length === 0 ? (
              <div style={{ color: '#2a2a2a', fontSize: 11, textAlign: 'center', padding: '12px 0' }}>—</div>
            ) : (
              colClients.map(({ client, demands: cDemands }) => (
                <ClientColumnCard
                  key={client.id}
                  client={client}
                  demands={cDemands}
                  stageId={stage.id}
                  destLabel={destLabel}
                />
              ))
            )}
          </div>
        )
      })}
    </div>
  )
}
