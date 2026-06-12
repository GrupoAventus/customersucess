import { useState } from 'react'
import { useApp } from '../lib/AppContext'
import NewDemandModal from '../components/NewDemandModal'
import DemandTable from '../components/DemandTable'
import SocialMediaTab from '../components/SocialMediaTab'
import { Btn, SectionHeader, EmptyState } from '../components/UI'

export default function CentrosCriativos({ label, title }) {
  const { clients, demands } = useApp()
  const [showDemand, setShowDemand] = useState(false)
  const [tab, setTab] = useState('demands')

  const ccDemands = demands
    .filter(d => d.dest === label)
    .map(d => ({ ...d, clientName: clients.find(c => c.id === d.clientId)?.name || '—' }))

  return (
    <div style={{ padding: '1.5rem' }}>
      <SectionHeader
        title={title}
        subtitle={`${ccDemands.filter(d => !d.done).length} demanda${ccDemands.filter(d => !d.done).length !== 1 ? 's' : ''} pendente${ccDemands.filter(d => !d.done).length !== 1 ? 's' : ''}`}
        action={
          tab === 'demands' ? (
            <Btn primary onClick={() => setShowDemand(true)}>
              <i className="ti ti-plus" /> Criar demanda
            </Btn>
          ) : null
        }
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '0.5px solid #1f1f1f' }}>
        {[
          { id: 'demands', label: 'Demandas' },
          { id: 'social', label: 'Social Media' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 16px', background: 'none', border: 'none',
              borderBottom: tab === t.id ? '2px solid var(--orange)' : '2px solid transparent',
              color: tab === t.id ? 'var(--orange)' : '#666',
              fontSize: 13, cursor: 'pointer'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'demands' && (
        ccDemands.length === 0
          ? <EmptyState icon="palette" text="Nenhuma demanda para este centro criativo" />
          : <DemandTable demands={ccDemands} />
      )}

      {tab === 'social' && <SocialMediaTab centroCriativo={label} />}

      {showDemand && <NewDemandModal defaultDest={label} onClose={() => setShowDemand(false)} />}
    </div>
  )
}
