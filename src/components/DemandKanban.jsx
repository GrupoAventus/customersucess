import { useState, useRef } from 'react'
import { useApp } from '../lib/AppContext'
import DemandDetailModal from './DemandDetailModal'
import NewDemandModal from './NewDemandModal'

const STAGES = [
  { id: 'demandas',             label: 'Demandas',        color: '#888',    bg: '#161616' },
  { id: 'em_producao',          label: 'Em produção',     color: '#f59e0b', bg: '#1a1500' },
  { id: 'aguardando_aprovacao', label: 'Ag. aprovação',   color: '#3b82f6', bg: '#001020' },
  { id: 'alteracao',            label: 'Alteração',       color: '#e24b4a', bg: '#1a0808' },
  { id: 'aprovado',             label: 'Aprovado',        color: '#22c55e', bg: '#001a08' },
]

const TODAY = new Date().toISOString().slice(0, 10)

function ProgressBar({ pct }) {
  const color = pct === 100 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#e24b4a'
  return (
    <div style={{ height: 3, background: '#1e1e1e', borderRadius: 4, overflow: 'hidden', marginTop: 5 }}>
      <div style={{ height: '100%', borderRadius: 4, width: `${pct}%`, background: color, transition: 'width 0.3s' }} />
    </div>
  )
}

/* ── Demand pill (draggable) ── */
function DemandPill({ demand, onOpen, onToggle, onDelete, dragging, dragHandlers }) {
  const isOverdue = !demand.done && demand.prazo && demand.prazo < TODAY

  return (
    <div
      {...dragHandlers}
      style={{
        background: dragging ? '#1a1a2e' : '#0e0e0e',
        border: `1px solid ${isOverdue ? '#3a1010' : dragging ? '#3b82f6' : '#1c1c1c'}`,
        borderRadius: 6,
        padding: '5px 7px',
        marginBottom: 4,
        cursor: 'grab',
        opacity: dragging ? 0.5 : 1,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 6,
        userSelect: 'none',
        transition: 'opacity 0.15s, border-color 0.15s',
      }}
    >
      {/* grip icon */}
      <span style={{ color: '#2a2a2a', fontSize: 10, flexShrink: 0, marginTop: 1, cursor: 'grab' }}>⠿</span>

      {/* checkbox */}
      <button
        onMouseDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); onToggle() }}
        style={{
          width: 12, height: 12, borderRadius: 3, flexShrink: 0, marginTop: 1,
          border: `1.5px solid ${demand.done ? '#22c55e' : '#2e2e2e'}`,
          background: demand.done ? '#22c55e' : 'transparent',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
        }}
      >
        {demand.done && <i className="ti ti-check" style={{ fontSize: 7, color: '#000' }} />}
      </button>

      {/* text */}
      <span
        onMouseDown={e => e.stopPropagation()}
        onClick={onOpen}
        style={{
          flex: 1, fontSize: 11, lineHeight: 1.4,
          color: demand.done ? '#3a3a3a' : '#bbb',
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

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
        {demand.prazo && (
          <span style={{ fontSize: 9, color: isOverdue ? '#e24b4a' : '#333', whiteSpace: 'nowrap' }}>
            {isOverdue && '⚠ '}{demand.prazo.slice(5)}
          </span>
        )}
        {onDelete && (
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onDelete() }}
            style={{ background: 'none', border: 'none', color: '#252525', cursor: 'pointer', padding: 0, fontSize: 9 }}
          >
            <i className="ti ti-x" />
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Client card: compact by default, expands on click ── */
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
          background: isDropTarget ? '#1a1a2e' : '#111',
          border: `1px solid ${isDropTarget ? '#3b82f6' : '#1f1f1f'}`,
          borderRadius: 8,
          marginBottom: 6,
          transition: 'border-color 0.15s, background 0.15s',
          overflow: 'hidden',
        }}
      >
        {/* Compact header — always visible */}
        <div
          onClick={() => setOpen(o => !o)}
          style={{
            padding: '7px 8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <i
            className={`ti ti-chevron-${open ? 'down' : 'right'}`}
            style={{ fontSize: 10, color: '#333', flexShrink: 0 }}
          />
          <span style={{
            fontSize: 11, fontWeight: 600, color: '#ccc',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
          }}>
            {client.name}
          </span>
          <span style={{ fontSize: 9, color: '#333', flexShrink: 0 }}>
            {done.length}/{total}
          </span>
        </div>
        <div style={{ padding: '0 8px 7px' }}>
          <ProgressBar pct={pct} />
        </div>

        {/* Expanded demands list */}
        {open && (
          <div style={{ padding: '0 8px 6px', borderTop: '1px solid #1a1a1a' }}>
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
                    onDragStart: (e) => {
                      setDraggingId(d.id)
                      onDragStart(d)
                      e.dataTransfer.effectAllowed = 'move'
                    },
                    onDragEnd: () => {
                      setDraggingId(null)
                      onDragEnd()
                    },
                  }}
                />
              ))}
              {sorted.length === 0 && (
                <div style={{ color: '#2a2a2a', fontSize: 10, padding: '4px 0' }}>Nenhuma ativa</div>
              )}
            </div>
            <button
              onClick={() => setAdding(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'none', border: 'none', color: '#2a2a2a',
                cursor: 'pointer', fontSize: 10, padding: '3px 0 0',
              }}
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
  const { clients, setDemandStage } = useApp()
  const [draggingDemand, setDraggingDemand] = useState(null)
  const [dragOverStage, setDragOverStage]   = useState(null)
  const [dragOverClient, setDragOverClient] = useState(null)

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

  const handleDrop = (stageId) => {
    if (draggingDemand && draggingDemand.stage !== stageId) {
      setDemandStage(draggingDemand.id, stageId)
    }
    setDraggingDemand(null)
    setDragOverStage(null)
    setDragOverClient(null)
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
        const colClients   = getClientsForStage(stage.id)
        const totalActive  = colClients.reduce((s, x) => s + x.demands.filter(d => !d.done).length, 0)
        const isDropTarget = dragOverStage === stage.id

        return (
          <div
            key={stage.id}
            onDragOver={e => { e.preventDefault(); setDragOverStage(stage.id) }}
            onDragLeave={() => setDragOverStage(s => s === stage.id ? null : s)}
            onDrop={() => handleDrop(stage.id)}
            style={{
              background: isDropTarget ? `${stage.color}10` : stage.bg,
              border: `1px solid ${isDropTarget ? stage.color + '44' : 'transparent'}`,
              borderRadius: 10,
              padding: '8px 7px 6px',
              minHeight: 80,
              transition: 'background 0.15s, border-color 0.15s',
            }}
          >
            {/* Column header */}
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
              ? <div style={{ color: '#1f1f1f', fontSize: 10, textAlign: 'center', padding: '8px 0' }}>
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
  )
}
