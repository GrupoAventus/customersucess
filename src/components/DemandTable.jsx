import { useState } from 'react'
import { useApp } from '../lib/AppContext'
import DemandDetailModal from './DemandDetailModal'
import AiDeliverableModal from './AiDeliverableModal'

export default function DemandTable({ demands }) {
  const { toggleDemand, isAdmin, deleteDemand, getDemandAi } = useApp()
  const [selected, setSelected] = useState(null)
  const [aiView, setAiView] = useState(null)
  const [showHistory, setShowHistory] = useState(false)

  const pending = demands.filter(d => !d.done && !getDemandAi(d.id))
  const awaiting = demands.filter(d => !d.done && getDemandAi(d.id))
  const done = demands.filter(d => d.done)

  const isOverdue = (d) => !d.done && d.prazo && d.prazo < new Date().toISOString().slice(0,10)

  const handleDelete = (e, d) => {
    e.stopPropagation()
    if (window.confirm(`Excluir a demanda "${d.text}"?`)) deleteDemand(d.id)
  }

  const renderRow = (d) => (
    <tr key={d.id}
      style={{ borderBottom: '0.5px solid #141414', cursor: 'pointer', background: isOverdue(d) ? 'rgba(226,75,74,0.08)' : 'transparent' }}
      onClick={() => setSelected(d)}
      onMouseEnter={e => e.currentTarget.style.background = isOverdue(d) ? 'rgba(226,75,74,0.15)' : '#161616'}
      onMouseLeave={e => e.currentTarget.style.background = isOverdue(d) ? 'rgba(226,75,74,0.08)' : 'transparent'}
    >
      <td style={{ fontSize: 13, color: 'var(--orange)', padding: '8px 10px' }}>{d.clientName}</td>
      <td style={{ fontSize: 13, color: d.done ? '#444' : '#ccc', padding: '8px 10px', maxWidth: 220, textDecoration: d.done ? 'line-through' : 'none' }}>
        {d.text}
        {getDemandAi(d.id) && (
          <div>
            <button
              onClick={(e) => { e.stopPropagation(); setAiView(d) }}
              style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(226,160,74,0.12)', border: '0.5px solid var(--orange)', color: 'var(--orange)', borderRadius: 20, padding: '3px 10px', fontSize: 11, cursor: 'pointer' }}
            >
              <i className="ti ti-file-text" /> ver demanda
            </button>
          </div>
        )}
      </td>
      <td style={{ fontSize: 13, padding: '8px 10px', whiteSpace: 'nowrap', color: isOverdue(d) ? 'var(--red)' : '#444', fontWeight: isOverdue(d) ? 500 : 400 }}>
        {isOverdue(d) && <i className="ti ti-alert-triangle" style={{ marginRight: 4 }} />}
        {d.prazo || '—'}
      </td>
      <td style={{ padding: '8px 10px' }}>
        <span onClick={(e) => { e.stopPropagation(); toggleDemand(d.id) }} style={{
          fontSize: 11, cursor: 'pointer',
          color: d.done ? 'var(--green)' : (getDemandAi(d.id) ? '#7ab8ff' : 'var(--amber)'),
          background: d.done ? 'var(--green-bg)' : (getDemandAi(d.id) ? 'rgba(122,184,255,0.12)' : 'var(--amber-bg)'),
          padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap'
        }}>{d.done ? 'Feita' : (getDemandAi(d.id) ? 'Aguardando aprovação' : 'Pendente')}</span>
      </td>
      <td style={{ padding: '8px 10px', width: 32 }}>
        {isAdmin && (
          <button onClick={(e) => handleDelete(e, d)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <i className="ti ti-trash" />
          </button>
        )}
      </td>
    </tr>
  )

  if (demands.length === 0) return <div style={{ fontSize: 13, color: '#333', padding: '8px 0' }}>Nenhuma demanda</div>

  return (
    <>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Cliente', 'Demanda', 'Prazo', 'Status', ''].map(h => (
              <th key={h} style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'left', padding: '6px 10px', borderBottom: '0.5px solid #1f1f1f' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pending.length === 0 && (
            <tr><td colSpan={5} style={{ padding: '8px 10px', color: '#333', fontSize: 13 }}>Nenhuma demanda pendente</td></tr>
          )}
          {pending.map(renderRow)}
        </tbody>
      </table>

      {awaiting.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, color: '#7ab8ff', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="ti ti-file-text" /> Aguardando aprovação ({awaiting.length})
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>{awaiting.map(renderRow)}</tbody>
          </table>
        </div>
      )}

      {done.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <button
            onClick={() => setShowHistory(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 12, padding: '6px 0' }}
          >
            <i className={`ti ti-chevron-${showHistory ? 'up' : 'down'}`} />
            Histórico ({done.length} demanda{done.length !== 1 ? 's' : ''} concluída{done.length !== 1 ? 's' : ''})
          </button>
          {showHistory && (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8, opacity: 0.7 }}>
              <tbody>{done.map(renderRow)}</tbody>
            </table>
          )}
        </div>
      )}

      {aiView && <AiDeliverableModal demand={aiView} onClose={() => setAiView(null)} />}
      {selected && <DemandDetailModal demand={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
