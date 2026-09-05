import { useState } from 'react'
import { useApp } from '../lib/AppContext'
import DemandDetailModal from './DemandDetailModal'

export default function DemandTable({ demands }) {
  const { toggleDemand, isAdmin, deleteDemand } = useApp()
  const [selected, setSelected] = useState(null)
  const [showHistory, setShowHistory] = useState(false)

  const pending = demands.filter(d => !d.done)
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
      <td style={{ fontSize: 13, color: d.done ? '#444' : '#ccc', padding: '8px 10px', maxWidth: 220, textDecoration: d.done ? 'line-through' : 'none' }}>{d.text}</td>
      <td style={{ fontSize: 13, padding: '8px 10px', whiteSpace: 'nowrap', color: isOverdue(d) ? 'var(--red)' : '#444', fontWeight: isOverdue(d) ? 500 : 400 }}>
        {isOverdue(d) && <i className="ti ti-alert-triangle" style={{ marginRight: 4 }} />}
        {d.prazo || '—'}
      </td>
      <td style={{ padding: '8px 10px' }}>
        <span onClick={(e) => { e.stopPropagation(); toggleDemand(d.id) }} style={{
          fontSize: 11, cursor: 'pointer',
          color: d.done ? 'var(--green)' : 'var(--amber)',
          background: d.done ? 'var(--green-bg)' : 'var(--amber-bg)',
          padding: '2px 8px', borderRadius: 20
        }}>{d.done ? 'Feita' : 'Pendente'}</span>
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

      {selected && <DemandDetailModal demand={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
