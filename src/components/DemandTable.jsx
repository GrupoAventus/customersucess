import { useState } from 'react'
import { useApp } from '../lib/AppContext'
import DemandDetailModal from './DemandDetailModal'

export default function DemandTable({ demands }) {
  const { toggleDemand, isAdmin, deleteDemand } = useApp()
  const [selected, setSelected] = useState(null)

  if (demands.length === 0) {
    return <div style={{ fontSize: 13, color: '#333', padding: '8px 0' }}>Nenhuma demanda</div>
  }

  const handleDelete = (e, d) => {
    e.stopPropagation()
    if (window.confirm(`Excluir a demanda "${d.text}"?`)) {
      deleteDemand(d.id)
    }
  }

  const isOverdue = (d) => !d.done && d.prazo && d.prazo < new Date().toISOString().slice(0,10)

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
          {demands.map(d => (
            <tr key={d.id} style={{ borderBottom: '0.5px solid #141414', cursor: 'pointer', background: isOverdue(d) ? 'rgba(226,75,74,0.08)' : 'transparent' }}
              onClick={() => setSelected(d)}
              onMouseEnter={e => e.currentTarget.style.background = isOverdue(d) ? 'rgba(226,75,74,0.15)' : '#161616'}
              onMouseLeave={e => e.currentTarget.style.background = isOverdue(d) ? 'rgba(226,75,74,0.08)' : 'transparent'}
            >
              <td style={{ fontSize: 13, color: 'var(--orange)', padding: '8px 10px' }}>{d.clientName}</td>
              <td style={{ fontSize: 13, color: '#ccc', padding: '8px 10px', maxWidth: 220 }}>{d.text}</td>
              <td style={{ fontSize: 13, padding: '8px 10px', whiteSpace: 'nowrap', color: isOverdue(d) ? 'var(--red)' : '#444', fontWeight: isOverdue(d) ? 500 : 400 }}>
                {isOverdue(d) && <i className="ti ti-alert-triangle" style={{ marginRight: 4 }} />}
                {d.prazo || '—'}
              </td>
              <td style={{ padding: '8px 10px' }}>
                <span
                  onClick={(e) => { e.stopPropagation(); toggleDemand(d.id) }}
                  style={{
                    fontSize: 11, cursor: 'pointer',
                    color: d.done ? 'var(--green)' : 'var(--amber)',
                    background: d.done ? 'var(--green-bg)' : 'var(--amber-bg)',
                    padding: '2px 8px', borderRadius: 20
                  }}
                >
                  {d.done ? 'Feita' : 'Pendente'}
                </span>
              </td>
              <td style={{ padding: '8px 10px', width: 32 }}>
                {isAdmin && (
                  <button
                    onClick={(e) => handleDelete(e, d)}
                    title="Excluir demanda"
                    style={{
                      background: 'none', border: 'none', color: 'var(--red)',
                      cursor: 'pointer', padding: 4, display: 'flex'
                    }}
                  >
                    <i className="ti ti-trash" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selected && <DemandDetailModal demand={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
