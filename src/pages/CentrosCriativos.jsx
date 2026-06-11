import { useState } from 'react'
import { useApp } from '../lib/AppContext'
import NewDemandModal from '../components/NewDemandModal'
import DemandTable from '../components/DemandTable'
import { Btn, SectionHeader, EmptyState } from '../components/UI'

export default function CentrosCriativos({ label, title }) {
  const { clients, demands } = useApp()
  const [showDemand, setShowDemand] = useState(false)

  const ccDemands = demands
    .filter(d => d.dest === label)
    .map(d => ({ ...d, clientName: clients.find(c => c.id === d.clientId)?.name || '—' }))

  return (
    <div style={{ padding: '1.5rem' }}>
      <SectionHeader
        title={title}
        subtitle={`${ccDemands.filter(d => !d.done).length} demanda${ccDemands.filter(d => !d.done).length !== 1 ? 's' : ''} pendente${ccDemands.filter(d => !d.done).length !== 1 ? 's' : ''}`}
        action={
          <Btn primary onClick={() => setShowDemand(true)}>
            <i className="ti ti-plus" /> Criar demanda
          </Btn>
        }
      />

      {ccDemands.length === 0
        ? <EmptyState icon="palette" text="Nenhuma demanda para este centro criativo" />
        : <DemandTable demands={ccDemands} />
      }

      {showDemand && <NewDemandModal defaultDest={label} onClose={() => setShowDemand(false)} />}
    </div>
  )
}
