import { useState } from 'react'
import { useApp } from '../lib/AppContext'
import ClientCard from '../components/ClientCard'
import ClientDetail from '../components/ClientDetail'
import NewDemandModal from '../components/NewDemandModal'
import DemandTable from '../components/DemandTable'
import { Btn, SectionHeader, EmptyState } from '../components/UI'

export default function Squad({ label, title }) {
  const { clients, demands } = useApp()
  const [selected, setSelected] = useState(null)
  const [showDemand, setShowDemand] = useState(false)

  const squadClients = clients.filter(c => c.destino === label)
  const squadDemands = demands
    .filter(d => d.dest === label)
    .map(d => ({ ...d, clientName: clients.find(c => c.id === d.clientId)?.name || '—' }))

  return (
    <div style={{ padding: '1.5rem' }}>
      <SectionHeader
        title={title}
        subtitle={`${squadClients.length} cliente${squadClients.length !== 1 ? 's' : ''} · ${squadDemands.filter(d => !d.done).length} pendente${squadDemands.filter(d => !d.done).length !== 1 ? 's' : ''}`}
        action={
          <Btn primary onClick={() => setShowDemand(true)}>
            <i className="ti ti-plus" /> Criar demanda
          </Btn>
        }
      />

      {squadClients.length === 0
        ? <EmptyState icon="users" text="Nenhum cliente neste squad" />
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: '1.5rem' }}>
            {squadClients.map(c => (
              <ClientCard key={c.id} client={c} onClick={() => setSelected(c)} />
            ))}
          </div>
        )
      }

      <div style={{ fontSize: 13, fontWeight: 500, color: '#ccc', marginBottom: 8 }}>Todas as demandas</div>
      <DemandTable demands={squadDemands} />

      {selected && <ClientDetail client={selected} onClose={() => setSelected(null)} />}
      {showDemand && <NewDemandModal defaultDest={label} onClose={() => setShowDemand(false)} />}
    </div>
  )
}
