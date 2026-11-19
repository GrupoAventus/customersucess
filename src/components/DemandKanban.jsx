import { useState, useRef } from 'react'
import { useApp } from '../lib/AppContext'
import DemandDetailModal from './DemandDetailModal'
import AiDeliverableModal from './AiDeliverableModal'
import NewDemandModal from './NewDemandModal'

const STAGES = [
  { id: 'demandas',             label: 'Demandas',        color: '#6b7280', glow: 'rgba(107,114,128,0.15)', bg: 'rgba(107,114,128,0.04)' },
  { id: 'em_producao',          label: 'Em produção',     color: '#f59e0b', glow: 'rgba(245,158,11,0.15)',  bg: 'rgba(245,158,11,0.04)' },
  { id: 'aguardando_aprovacao', label: 'Ag. aprovação',   color: '#3b82f6', glow: 'rgba(59,130,246,0.15)',  bg: 'rgba(59,130,246,0.04)' },
  { id: 'alteracao',            label: 'Alteração',       color: '#e24b4a', glow: 'rgba(226,75,74,0.15)',   bg: 'rgba(226,75,74,0.04)' },
]

const TODAY = new Date().toISOString().slice(0, 10)

function ProgressBar({ pct, color }) {
  const c = pct === 100 ? '#22c55e' : color || '#f59e0b'
  return (
    <div style={{ height: 2, background: '#1a1710', borderRadius: 2, overflow: 'hidden', marginTop: 5 }}>
      <div style={{
        height: '100%', borderRadius: 2, width: `${pct}%`,
        background: `linear-gradient(90deg, ${c}88, ${c})`,
        boxShadow: `0 0 6px ${c}60`,
        transition: 'width 0.4s ease',
      }} />
    </div>
  )
}

/* ── Demand pill (draggable) ── */
function DemandPill({ demand, onOpen, onToggle, onDelete, dragging, dragHandlers }) {
  const { getDemandAi } = useApp()
  const [showAi, setShowAi] = useState(false)
  const hasAi = !!getDemandAi(demand.id)
  const isOverdue = !demand.done && demand.prazo && demand.prazo < TODAY

  return (
    <div
      {...dragHandlers}
      style={{
        background: dragging
          ? 'rgba(59,130,246,0.08)'
          : isOverdue
            ? 'rgba(226,75,74,0.05)'
            : '#0c0a07',
        border: `0.5px solid ${
          isOverdue ? 'rgba(226,75,74,0.3)'
          : dragging  ? 'rgba(59,130,246,0.4)'
          : '#1e1b14'
        }`,
        borderRadius: 7,
        padding: '6px 8px',
        marginBottom: 4,
        cursor: 'grab',
        opacity: dragging ? 0.5 : 1,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 6,
        userSelect: 'none',
        transition: 'opacity 0.15s, border-color 0.15s, background 0.15s',
      }}
    >
      <span style={{ color: '#2a2418', fontSize: 10, flexShrink: 0, marginTop: 1 }}>⠿</span>

      <button
        onMouseDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); onToggle() }}
        style={{
          width: 12, height: 12, borderRadius: 3, flexShrink: 0, marginTop: 2,
          border: `1.5px solid ${demand.done ? '#22c55e' : '#2e2818'}`,
          background: demand.done ? '#22c55e' : 'transparent',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
        }}
      >
        {demand.done && <i className="ti ti-check" style={{ fontSize: 7, color: '#000' }} />}
      </button>

      <span
        onMouseDown={e => e.stopPropagation()}
        onClick={onOpen}
        style={{
          flex: 1, fontSize: 11, lineHeight: 1.4,
          color: demand.done ? '#2a2418' : '#9a8f7e',
          textDecoration: demand.done ? 'line-through' : 'none',
          cursor: 'pointer',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          wordBreak: 'break-word',
        }}
      >
        {demand.text}
      </span>

      {hasAi && (
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); setShowAi(true) }}
          style={{
            flexShrink: 0,
            background: 'rgba(255,107,26,0.08)',
            border: '0.5px solid rgba(255,107,26,0.3)',
            color: 'var(--orange)', borderRadius: 20,
            padding: '1px 7px', fontSize: 9, cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          <i className="ti ti-file-text" /> ver demanda
        </button>
      )}
      {showAi && <AiDeliverableModal demand={demand} onClose={() => setShowAi(false)} />}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
        {demand.prazo && (
          <span style={{
            fontSize: 9,
            color: isOverdue ? '#e24b4a' : '#2e2820',
            fontWeight: isOverdue ? 600 : 400,
            whiteSpace: 'nowrap',
          }}>
            {isOverdue && '⚠ '}{demand.prazo.slice(5)}
          </span>
        )}
        {onDelete && (
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onDelete() }}
            style={{ background: 'none', border: 'none', color: '#1e1b14', cursor: 'pointer', padding: 0, fontSize: 9, transition: 'color 0.1s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#e24b4a'}
            onMouseLeave={e => e.currentTarget.style.color = '#1e1b14'}
          >
            <i className="ti ti-x" />
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Client mini-card dentro da coluna ── */
function ClientCard({ client, demands, stageId, destLabel, onDragStart, onDragEnd, dragOverClientId, onDragEnterClient }) {
  const { toggleDemand, setDemandStage, isAdmin, deleteDemand } = useApp()
  const [open, setOpen]       = useState(false)
  const [selected, setSelected] = useState(null)
  const [adding, setAdding]   = useState(false)
  const [draggingId, setDraggingId] = useState(null)

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

  const isDropTarget = dragOverClientId === client.id

  return (
    <>
      <div
        onDragOver={e => { e.preventDefault(); onDragEnterClient(client.id) }}
        onDrop={e => { e.preventDefault() }}
        style={{
          background: isDropTarget ? 'rgba(59,130,246,0.06)' : '#0e0c09',
          border: `0.5px solid ${isDropTarget ? 'rgba(59,130,246,0.35)' : '#1e1b14'}`,
          borderRadius: 9,
          marginBottom: 6,
          transition: 'border-color 0.15s, background 0.15s',
          overflow: 'hidden',
        }}
      >
        <div
          onClick={() => setOpen(o => !o)}
          style={{ padding: '7px 9px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <i
            className={`ti ti-chevron-${open ? 'down' : 'right'}`}
            style={{ fontSize: 9, color: '#2e2820', flexShrink: 0 }}
          />
          <span style={{
            fontSize: 11, fontWeight: 600, color: '#c8bfb0',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
          }}>
            {client.name}
          </span>
          <span style={{ fontSize: 9, color: '#2e2820', flexShrink: 0 }}>{done.length}/{total}</span>
        </div>
        <div style={{ padding: '0 9px 7px' }}>
          <ProgressBar pct={pct} />
        </div>

        {open && (
          <div style={{ padding: '0 8px 7px', borderTop: '0.5px solid #1a1710' }}>
            <div style={{ marginTop: 7 }}>
              {sorted.map(d => (
                <DemandPill
                  key={d.id}
                  demand={d}
                  dragging={draggingId === d.id}
                  onOpen={() => setSelected(d)}
                  onToggle={() => toggleDemand(d.id)}
                  onDelete={isAdmin ? () => { if (window.confirm('Excluir demanda?')) deleteDemand(d.id) } : null}
                  dragHandlers={{
                    draggable: true,
                    onDragStart: (e) => { setDraggingId(d.id); onDragStart(d); e.dataTransfer.effectAllowed = 'move' },
                    onDragEnd: () => { setDraggingId(null); onDragEnd() },
                  }}
                />
              ))}
              {sorted.length === 0 && (
                <div style={{ color: '#1e1b14', fontSize: 10, padding: '4px 0' }}>Nenhuma ativa</div>
              )}
            </div>
            <button
              onClick={() => setAdding(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'none', border: 'none', color: '#2e2820',
                cursor: 'pointer', fontSize: 10, padding: '3px 0 0',
                transition: 'color 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--orange)'}
              onMouseLeave={e => e.currentTarget.style.color = '#2e2820'}
            >
              <i className="ti ti-plus" style={{ fontSize: 10 }} /> demanda
            </button>
          </div>
        )}
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
    </>
  )
}

/* ── Main kanban ── */
export default function DemandKanban({ demands, destLabel }) {
  const { clients, setDemandStage, toggleDemand, getDemandAi } = useApp()
  const [showApproved, setShowApproved] = useState(false)
  const [viewDemand, setViewDemand] = useState(null)
  const [draggingDemand, setDraggingDemand] = useState(null)
  const [dragOverStage, setDragOverStage]   = useState(null)
  const [dragOverClient, setDragOverClient] = useState(null)

  const getClientsForStage = (stageId) => {
    const clientIds = [...new Set(
      demands.filter(d => (d.stage || 'demandas') === stageId && !d.done).map(d => d.clientId)
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

  const handleDrop = (stageId) => {
    if (draggingDemand && draggingDemand.stage !== stageId) setDemandStage(draggingDemand.id, stageId)
    setDraggingDemand(null); setDragOverStage(null); setDragOverClient(null)
  }

  if (demands.length === 0) {
    return <div style={{ color: '#2e2820', fontSize: 13, padding: '16px 0' }}>Nenhuma demanda para este centro criativo</div>
  }

  const approved = demands.filter(d => d.done).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))

  return (
    <>
      {/* Botão aprovadas */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10, position: 'relative' }}>
        <button
          onClick={() => setShowApproved(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(34,197,94,0.06)',
            border: '0.5px solid rgba(34,197,94,0.25)',
            color: '#22c55e', borderRadius: 8,
            padding: '5px 12px', fontSize: 11, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.1)'; e.currentTarget.style.borderColor = 'rgba(34,197,94,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.06)'; e.currentTarget.style.borderColor = 'rgba(34,197,94,0.25)' }}
        >
          <i className="ti ti-circle-check" /> Aprovadas ({approved.length})
          <i className={`ti ti-chevron-${showApproved ? 'up' : 'down'}`} />
        </button>

        {showApproved && (
          <div style={{
            position: 'absolute', top: 34, right: 0, zIndex: 20,
            width: 440, maxHeight: 420, overflowY: 'auto',
            background: '#0c0a07',
            border: '0.5px solid rgba(34,197,94,0.2)',
            borderRadius: 12, padding: 8,
            boxShadow: '0 16px 40px rgba(0,0,0,0.6), 0 0 20px rgba(34,197,94,0.05)',
          }}>
            {approved.length === 0 && <div style={{ color: '#2e2820', fontSize: 11, padding: 8 }}>Nenhuma demanda aprovada</div>}
            {approved.map(d => (
              <div key={d.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                padding: '7px 8px', borderBottom: '0.5px solid #1a1710',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: 'var(--orange)', marginBottom: 2 }}>{d.clientName}</div>
                  <div style={{ fontSize: 11, color: '#5a5040', lineHeight: 1.4 }}>{d.text}</div>
                </div>
                {getDemandAi(d.id) && (
                  <button onClick={() => setViewDemand(d)} style={{
                    background: 'none', border: '0.5px solid rgba(255,107,26,0.3)',
                    color: 'var(--orange)', borderRadius: 20, padding: '2px 8px',
                    fontSize: 9, cursor: 'pointer', whiteSpace: 'nowrap',
                  }}>ver demanda</button>
                )}
                <button onClick={() => toggleDemand(d.id)} title="Reabrir" style={{
                  background: 'none', border: '0.5px solid #2e2820',
                  color: '#5a5040', borderRadius: 20, padding: '2px 8px',
                  fontSize: 9, cursor: 'pointer', whiteSpace: 'nowrap',
                }}>reabrir</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {viewDemand && <AiDeliverableModal demand={viewDemand} onClose={() => setViewDemand(null)} />}

      {/* Colunas do kanban */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, alignItems: 'start' }}>
        {STAGES.map(stage => {
          const colClients  = getClientsForStage(stage.id)
          const totalActive = colClients.reduce((s, x) => s + x.demands.filter(d => !d.done).length, 0)
          const isDropTarget = dragOverStage === stage.id

          return (
            <div
              key={stage.id}
              onDragOver={e => { e.preventDefault(); setDragOverStage(stage.id) }}
              onDragLeave={() => setDragOverStage(s => s === stage.id ? null : s)}
              onDrop={() => handleDrop(stage.id)}
              style={{
                background: isDropTarget
                  ? stage.glow
                  : `linear-gradient(180deg, ${stage.bg} 0%, transparent 100%)`,
                border: `0.5px solid ${isDropTarget ? stage.color + '44' : stage.color + '18'}`,
                borderRadius: 12,
                padding: '10px 8px 8px',
                minHeight: 80,
                transition: 'background 0.15s, border-color 0.15s',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Linha de acento no topo da coluna */}
              <div style={{
                position: 'absolute', top: 0, left: 12, right: 12, height: 1,
                background: `linear-gradient(90deg, transparent, ${stage.color}66, transparent)`,
              }} />

              {/* Header da coluna */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 10, paddingBottom: 8,
                borderBottom: `0.5px solid ${stage.color}18`,
              }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: stage.color,
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                }}>
                  {stage.label}
                </span>
                {totalActive > 0 && (
                  <span style={{
                    fontSize: 9, color: stage.color,
                    background: `${stage.color}18`,
                    border: `0.5px solid ${stage.color}30`,
                    borderRadius: 20, padding: '1px 6px', flexShrink: 0,
                    fontWeight: 600,
                  }}>
                    {totalActive}
                  </span>
                )}
              </div>

              {colClients.length === 0
                ? <div style={{ color: '#1e1b14', fontSize: 10, textAlign: 'center', padding: '12px 0' }}>
                    {draggingDemand ? '↓ soltar aqui' : '—'}
                  </div>
                : colClients.map(({ client, demands: cDemands }) => (
                    <ClientCard
                      key={client.id}
                      client={client}
                      demands={cDemands}
                      stageId={stage.id}
                      destLabel={destLabel}
                      dragOverClientId={dragOverClient}
                      onDragStart={d => setDraggingDemand(d)}
                      onDragEnd={() => { setDraggingDemand(null); setDragOverStage(null); setDragOverClient(null) }}
                      onDragEnterClient={id => setDragOverClient(id)}
                    />
                  ))
              }
            </div>
          )
        })}
      </div>
    </>
  )
}
