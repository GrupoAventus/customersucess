import { useState } from 'react'
import { useApp } from '../lib/AppContext'
import DemandDetailModal from './DemandDetailModal'

export default function DemandTable({ demands }) {
  const { toggleDemand } = useApp()
  const [selected, setSelected] = useState(null)

  if (demands.length === 0) {
    return <div style={{ fontSize: 13, color: '#333', padding: '8px 0' }}>Nenhuma demanda</div>
  }

  return (
    <>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Cliente', 'Demanda', 'Prazo', 'Status'].map(h => (
              <th key={h} style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'left', padding: '6px 10px', borderBottom: '0.5px solid #1f1f1f' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {demands.map(d => (
            <tr key={d.id} style={{ borderBottom: '0.5px solid #141414', cursor: 'pointer' }}
              onClick={() => setSelected(d)}
              onMouseEnter={e => e.currentTarget.style.background = '#161616'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <td style={{ fontSize: 13, color: 'var(--orange)', padding: '8px 10px' }}>{d.clientName}</td>
              <td style={{ fontSize: 13, color: '#ccc', padding: '8px 10px', maxWidth: 220 }}>{d.text}</td>
              <td style={{ fontSize: 13, color: '#444', padding: '8px 10px', whiteSpace: 'nowrap' }}>{d.prazo || '—'}</td>
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
            </tr>
          ))}
        </tbody>
      </table>

      {selected && <DemandDetailModal demand={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
