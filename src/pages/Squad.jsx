import { useState } from 'react'
import { useApp, KANBAN_COLUMNS } from '../lib/AppContext'
import ClientCard from '../components/ClientCard'
import ClientDetail from '../components/ClientDetail'
import NewDemandModal from '../components/NewDemandModal'
import DemandTable from '../components/DemandTable'
import { Btn, SectionHeader } from '../components/UI'

export default function Squad({ label, title }) {
  const { clients, demands, setClientStatus } = useApp()
  const [selected, setSelected] = useState(null)
  const [showDemand, setShowDemand] = useState(false)
  const [dragId, setDragId] = useState(null)

  const squadClients = clients.filter(c => (c.destinos || [c.destino]).includes(label))
  const squadDemands = demands
    .filter(d => d.dest === label)
    .map(d => ({ ...d, clientName: clients.find(c => c.id === d.clientId)?.name || '—' }))

  const colorMap = {
    'Pegar acessos': '#888',
    'Aguardando campanha': 'var(--amber)',
    'Campanha ativa': 'var(--green)',
    'Anúncios pausados': 'var(--red)',
  }

  const handleDrop = (column) => {
    if (dragId) {
      setClientStatus(dragId, column)
      setDragId(null)
    }
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <SectionHeader
        title={title}
        subtitle={`${squadClients.length} cliente${squadClients.length !== 1 ? 's' : ''} · ${squadDemands.filter(d => !d.done).length} demandas pendentes`}
        action={
          <Btn primary onClick={() => setShowDemand(true)}>
            <i className="ti ti-plus" /> Criar demanda
          </Btn>
        }
      />

      {/* Kanban */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: '2rem' }}>
        {KANBAN_COLUMNS.map(col => {
          const colClients = squadClients.filter(c => (c.status || 'Pegar acessos') === col)
          return (
            <div
              key={col}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(col)}
              style={{ background: '#0f0f0f', borderRadius: 12, padding: 10, minHeight: 200, border: '0.5px solid #1a1a1a' }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, fontWeight: 500, marginBottom: 10, padding: '4px 6px'
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: colorMap[col] }} />
                <span style={{ color: '#ccc' }}>{col}</span>
                <span style={{ color: '#444', marginLeft: 'auto' }}>{colClients.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {colClients.map(c => (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={() => setDragId(c.id)}
                  >
                    <ClientCard client={c} onClick={() => setSelected(c)} />
                  </div>
                ))}
                {colClients.length === 0 && (
                  <div style={{ fontSize: 11, color: '#333', textAlign: 'center', padding: '1rem 0' }}>
                    Arraste clientes aqui
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ fontSize: 13, fontWeight: 500, color: '#ccc', marginBottom: 8 }}>Todas as demandas</div>
      <DemandTable demands={squadDemands} />

      {selected && <ClientDetail client={selected} onClose={() => setSelected(null)} />}
      {showDemand && <NewDemandModal defaultDest={label} onClose={() => setShowDemand(false)} />}
    </div>
  )
}
