import { useState } from 'react'
import { useApp } from '../lib/AppContext'
import DemandDetailModal from './DemandDetailModal'
import NewDemandModal from './NewDemandModal'

const STAGES = [
  { id: 'demandas',            label: 'Demandas',                    color: '#555',         bg: 'rgba(255,255,255,0.03)' },
  { id: 'em_producao',         label: 'Em produção',                 color: '#f59e0b',      bg: 'rgba(245,158,11,0.06)'  },
  { id: 'aguardando_aprovacao',label: 'Finalizado / Ag. aprovação',  color: '#3b82f6',      bg: 'rgba(59,130,246,0.06)'  },
  { id: 'alteracao',           label: 'Alteração',                   color: '#e24b4a',      bg: 'rgba(226,75,74,0.06)'   },
]

function ProgressBar({ pct }) {
  return (
    <div style={{ height: 4, background: '#1f1f1f', borderRadius: 4, overflow: 'hidden', marginTop: 6 }}>
      <div style={{
        height: '100%', borderRadius: 4,
        width: `${pct}%`,
        background: pct === 100 ? 'var(--green)' : pct > 50 ? '#f59e0b' : 'var(--orange)',
        transition: 'width 0.3s ease'
      }} />
    </div>
  )
}

function ClientCard({ client, demands, destLabel }) {
  const { toggleDemand, setDemandStage, isAdmin, deleteDemand } = useApp()
  const [expanded, setExpanded] = useState(false)
  const [selected, setSelected]  = useState(null)
  const [showDone, setShowDone]   = useState(false)
  const [addingDemand, setAddingDemand] = useState(false)

  const active = demands.filter(d => !d.done)
  const done   = demands.filter(d => d.done)
  const total  = demands.length
  const pct    = total === 0 ? 0 : Math.round((done.length / total) * 100)

  const isOverdue = (d) => !d.done && d.prazo && d.prazo < new Date().toISOString().slice(0, 10)

  // Ordena ativas por prazo mais próximo
  const sortedActive = [...active].sort((a, b) => {
    if (!a.prazo && !b.prazo) return 0
    if (!a.prazo) return 1
    if (!b.prazo) return -1
    return a.prazo.localeCompare(b.prazo)
  })

  const stageOf = (d) => d.stage || 'demandas'
  const stageInfo = (id) => STAGES.find(s => s.id === id) || STAGES[0]

  return (
    <div style={{
      background: '#111', border: '0.5px solid #1f1f1f', borderRadius: 10,
      marginBottom: 10, overflow: 'hidden'
    }}>
      {/* Header do card — sempre visível */}
      <div
        onClick={() => setExpanded(v => !v)}
        style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#e0e0e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {client.name}
            </span>
            <span style={{ fontSize: 11, color: '#444', flexShrink: 0 }}>
              {done.length}/{total}
            </span>
          </div>
          <ProgressBar pct={pct} />
        </div>
        <i className={`ti ti-chevron-${expanded ? 'up' : 'down'}`} style={{ color: '#444', fontSize: 14, flexShrink: 0 }} />
      </div>

      {/* Corpo expandido — kanban por stage */}
      {expanded && (
        <div style={{ borderTop: '0.5px solid #1a1a1a' }}>
          {STAGES.map(stage => {
            const stageDemands = sortedActive.filter(d => stageOf(d) === stage.id)
            if (stageDemands.length === 0) return null
            return (
              <div key={stage.id} style={{ borderBottom: '0.5px solid #1a1a1a' }}>
                <div style={{ padding: '7px 14px', fontSize: 11, color: stage.color, background: stage.bg, fontWeight: 600, letterSpacing: '0.03em' }}>
                  {stage.label} · {stageDemands.length}
                </div>
                {stageDemands.map(d => (
                  <DemandRow
                    key={d.id}
                    d={d}
                    isOverdue={isOverdue(d)}
                    stageInfo={stageInfo}
                    onOpen={() => setSelected(d)}
                    onToggle={() => toggleDemand(d.id)}
                    onStageChange={(s) => setDemandStage(d.id, s)}
                    onDelete={isAdmin ? () => { if (window.confirm(`Excluir "${d.text}"?`)) deleteDemand(d.id) } : null}
                  />
                ))}
              </div>
            )
          })}

          {/* Botão adicionar demanda */}
          <div style={{ padding: '8px 14px' }}>
            <button onClick={(e) => { e.stopPropagation(); setAddingDemand(true) }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 12, padding: 0 }}>
              <i className="ti ti-plus" /> Nova demanda
            </button>
          </div>

          {/* Finalizadas — menu suspenso */}
          {done.length > 0 && (
            <div style={{ borderTop: '0.5px solid #1a1a1a' }}>
              <button
                onClick={() => setShowDone(v => !v)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#3a3a3a', cursor: 'pointer', fontSize: 11, padding: '8px 14px', textAlign: 'left' }}
              >
                <i className={`ti ti-chevron-${showDone ? 'up' : 'down'}`} style={{ fontSize: 11 }} />
                Finalizadas ({done.length})
              </button>
              {showDone && done.map(d => (
                <DemandRow
                  key={d.id}
                  d={d}
                  isOverdue={false}
                  stageInfo={stageInfo}
                  onOpen={() => setSelected(d)}
                  onToggle={() => toggleDemand(d.id)}
                  onStageChange={(s) => setDemandStage(d.id, s)}
                  onDelete={isAdmin ? () => { if (window.confirm(`Excluir "${d.text}"?`)) deleteDemand(d.id) } : null}
                  faded
                />
              ))}
            </div>
          )}
        </div>
      )}

      {selected && <DemandDetailModal demand={selected} onClose={() => setSelected(null)} />}
      {addingDemand && (
        <NewDemandModal
          defaultClientId={client.id}
          defaultDest={destLabel}
          onClose={() => setAddingDemand(false)}
        />
      )}
    </div>
  )
}

function DemandRow({ d, isOverdue, stageInfo, onOpen, onToggle, onStageChange, onDelete, faded }) {
  const [showStageMenu, setShowStageMenu] = useState(false)
  const si = stageInfo(d.stage || 'demandas')

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 14px', borderBottom: '0.5px solid #161616',
        opacity: faded ? 0.4 : 1,
        background: isOverdue ? 'rgba(226,75,74,0.05)' : 'transparent',
      }}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        style={{
          width: 16, height: 16, borderRadius: 4, flexShrink: 0,
          border: `1.5px solid ${d.done ? 'var(--green)' : '#333'}`,
          background: d.done ? 'var(--green)' : 'transparent',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0,
        }}
      >
        {d.done && <i className="ti ti-check" style={{ fontSize: 10, color: '#000' }} />}
      </button>

      {/* Texto — clica para abrir detalhe */}
      <span
        onClick={onOpen}
        style={{
          flex: 1, fontSize: 12, color: d.done ? '#444' : '#ccc',
          textDecoration: d.done ? 'line-through' : 'none',
          cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}
      >
        {d.text}
      </span>

      {/* Prazo */}
      {d.prazo && (
        <span style={{ fontSize: 11, color: isOverdue ? 'var(--red)' : '#444', flexShrink: 0, whiteSpace: 'nowrap' }}>
          {isOverdue && <i className="ti ti-alert-triangle" style={{ marginRight: 2 }} />}
          {d.prazo}
        </span>
      )}

      {/* Stage pill — clicável */}
      {!d.done && (
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setShowStageMenu(v => !v)}
            style={{
              fontSize: 10, padding: '2px 7px', borderRadius: 20,
              border: 'none', cursor: 'pointer',
              color: si.color, background: `${si.color}22`,
              whiteSpace: 'nowrap',
            }}
          >
            {si.label.split('/')[0].trim()}
          </button>
          {showStageMenu && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 4px)',
              background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8,
              zIndex: 100, minWidth: 180, boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            }}>
              {STAGES.map(s => (
                <div
                  key={s.id}
                  onClick={() => { onStageChange(s.id); setShowStageMenu(false) }}
                  style={{
                    padding: '8px 12px', fontSize: 12, cursor: 'pointer',
                    color: s.id === (d.stage || 'demandas') ? s.color : '#aaa',
                    background: s.id === (d.stage || 'demandas') ? s.bg : 'transparent',
                    borderBottom: '1px solid #222',
                  }}
                >
                  {s.label}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Deletar */}
      {onDelete && (
        <button onClick={onDelete} style={{ background: 'none', border: 'none', color: '#2a2a2a', cursor: 'pointer', padding: 2, flexShrink: 0 }}>
          <i className="ti ti-trash" style={{ fontSize: 13 }} />
        </button>
      )}
    </div>
  )
}

export default function DemandKanban({ demands, destLabel }) {
  const { clients } = useApp()

  // Agrupa demandas por cliente
  const clientIds = [...new Set(demands.map(d => d.clientId))]
  const clientCards = clientIds
    .map(id => ({ client: clients.find(c => c.id === id), demands: demands.filter(d => d.clientId === id) }))
    .filter(x => x.client)
    .sort((a, b) => {
      // Ordena: tem ativa primeiro, depois por prazo mais próximo
      const aActive = a.demands.filter(d => !d.done)
      const bActive = b.demands.filter(d => !d.done)
      if (aActive.length === 0 && bActive.length > 0) return 1
      if (bActive.length === 0 && aActive.length > 0) return -1
      const aMin = aActive.filter(d => d.prazo).map(d => d.prazo).sort()[0] || '9999'
      const bMin = bActive.filter(d => d.prazo).map(d => d.prazo).sort()[0] || '9999'
      return aMin.localeCompare(bMin)
    })

  if (clientCards.length === 0) return (
    <div style={{ color: '#333', fontSize: 13, padding: '16px 0' }}>Nenhuma demanda para este centro criativo</div>
  )

  return (
    <div>
      {clientCards.map(({ client, demands: cDemands }) => (
        <ClientCard key={client.id} client={client} demands={cDemands} destLabel={destLabel} />
      ))}
    </div>
  )
}
