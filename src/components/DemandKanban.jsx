import { useState } from 'react'
import { useApp } from '../lib/AppContext'
import DemandDetailModal from './DemandDetailModal'
import NewDemandModal from './NewDemandModal'

const STAGES = [
  { id: 'demandas',             label: 'Demandas',                   color: '#888',    bg: '#161616' },
  { id: 'em_producao',          label: 'Em produção',                color: '#f59e0b', bg: '#1a1500' },
  { id: 'aguardando_aprovacao', label: 'Ag. aprovação',              color: '#3b82f6', bg: '#001020' },
  { id: 'alteracao',            label: 'Alteração',                  color: '#e24b4a', bg: '#1a0808' },
  { id: 'aprovado',             label: 'Aprovado',                   color: '#22c55e', bg: '#001a08' },
]

const TODAY = new Date().toISOString().slice(0, 10)

function ProgressBar({ pct }) {
  const color = pct === 100 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#e24b4a'
  return (
    <div style={{ height: 3, background: '#222', borderRadius: 4, overflow: 'hidden', marginTop: 4 }}>
      <div style={{ height: '100%', borderRadius: 4, width: `${pct}%`, background: color, transition: 'width 0.3s' }} />
    </div>
  )
}

function DemandItem({ demand, onOpen, onToggle, onStageChange, onDelete }) {
  const isOverdue = !demand.done && demand.prazo && demand.prazo < TODAY
  const idx = STAGES.findIndex(s => s.id === (demand.stage || 'demandas'))

  return (
    <div style={{
      background: '#0d0d0d',
      border: `1px solid ${isOverdue ? '#3a1010' : '#1c1c1c'}`,
      borderRadius: 6,
      padding: '6px 7px',
      marginBottom: 5,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
        {/* Checkbox */}
        <button onClick={onToggle} style={{
          width: 13, height: 13, borderRadius: 3, flexShrink: 0, marginTop: 1,
          border: `1.5px solid ${demand.done ? '#22c55e' : '#2e2e2e'}`,
          background: demand.done ? '#22c55e' : 'transparent',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
        }}>
          {demand.done && <i className="ti ti-check" style={{ fontSize: 8, color: '#000' }} />}
        </button>

        {/* Texto — trunca em 2 linhas */}
        <span onClick={onOpen} style={{
          flex: 1,
          fontSize: 11,
          lineHeight: 1.4,
          color: demand.done ? '#3a3a3a' : '#bbb',
          textDecoration: demand.done ? 'line-through' : 'none',
          cursor: 'pointer',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          wordBreak: 'break-word',
        }}>
          {demand.text}
        </span>
      </div>

      {/* Rodapé: prazo + setas + delete */}
      <div style={{ display: 'flex', alignItems: 'center', marginTop: 4, gap: 4 }}>
        {demand.prazo && (
          <span style={{ fontSize: 9, color: isOverdue ? '#e24b4a' : '#333', flex: 1 }}>
            {isOverdue && '⚠ '}
            {demand.prazo.slice(5)}
          </span>
        )}
        {!demand.prazo && <span style={{ flex: 1 }} />}

        {/* Seta esquerda */}
        {idx > 0 && (
          <button onClick={() => onStageChange(STAGES[idx - 1].id)}
            title={`← ${STAGES[idx - 1].label}`}
            style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', padding: '0 2px', fontSize: 12, lineHeight: 1 }}>
            ‹
          </button>
        )}
        {/* Seta direita */}
        {idx < STAGES.length - 1 && (
          <button onClick={() => onStageChange(STAGES[idx + 1].id)}
            title={`→ ${STAGES[idx + 1].label}`}
            style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: '0 2px', fontSize: 12, lineHeight: 1 }}>
            ›
          </button>
        )}

        {onDelete && (
          <button onClick={onDelete}
            style={{ background: 'none', border: 'none', color: '#252525', cursor: 'pointer', padding: '0 1px', fontSize: 10 }}>
            <i className="ti ti-x" />
          </button>
        )}
      </div>
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

  const sorted = [...active].sort((a, b) => {
    if (!a.prazo && !b.prazo) return 0
    if (!a.prazo) return 1
    if (!b.prazo) return -1
    return a.prazo.localeCompare(b.prazo)
  })

  return (
    <div style={{
      background: '#111',
      border: '1px solid #1f1f1f',
      borderRadius: 8,
      marginBottom: 8,
      padding: '8px 8px 6px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 1 }}>
        <span style={{
          fontSize: 11, fontWeight: 600, color: '#ccc',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
        }}>
          {client.name}
        </span>
        <span style={{ fontSize: 9, color: '#333', flexShrink: 0, marginLeft: 6 }}>
          {done.length}/{total}
        </span>
      </div>
      <ProgressBar pct={pct} />

      {/* Lista de demandas */}
      <div style={{ marginTop: 8 }}>
        {sorted.map(d => (
          <DemandItem
            key={d.id}
            demand={d}
            onOpen={() => setSelected(d)}
            onToggle={() => toggleDemand(d.id)}
            onStageChange={s => setDemandStage(d.id, s)}
            onDelete={isAdmin ? () => { if (window.confirm(`Excluir?`)) deleteDemand(d.id) } : null}
          />
        ))}
      </div>

      {/* Botão + */}
      <button onClick={() => setAdding(true)} style={{
        display: 'flex', alignItems: 'center', gap: 4,
        background: 'none', border: 'none', color: '#2a2a2a',
        cursor: 'pointer', fontSize: 10, padding: '2px 0',
      }}>
        <i className="ti ti-plus" style={{ fontSize: 10 }} /> demanda
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
        const aMin = a.demands.filter(d => !d.done && d.prazo).map(d => d.prazo).sort()[0] || '9999'
        const bMin = b.demands.filter(d => !d.done && d.prazo).map(d => d.prazo).sort()[0] || '9999'
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
            background: stage.bg,
            borderRadius: 10,
            padding: '8px 7px 4px',
            minHeight: 60,
          }}>
            {/* Header coluna */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 10, paddingBottom: 7,
              borderBottom: `1px solid ${stage.color}22`,
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: stage.color, letterSpacing: '0.03em' }}>
                {stage.label}
              </span>
              {totalActive > 0 && (
                <span style={{
                  fontSize: 9, color: stage.color,
                  background: `${stage.color}22`,
                  borderRadius: 20, padding: '1px 5px', flexShrink: 0,
                }}>
                  {totalActive}
                </span>
              )}
            </div>

            {colClients.length === 0
              ? <div style={{ color: '#1f1f1f', fontSize: 10, textAlign: 'center', padding: '8px 0' }}>—</div>
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
