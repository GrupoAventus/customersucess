import { useState } from 'react'
import { useApp } from '../lib/AppContext'
import ClientCard from '../components/ClientCard'
import ClientDetail from '../components/ClientDetail'
import NewClientModal from '../components/NewClientModal'
import { Btn, SectionHeader, EmptyState } from '../components/UI'

export default function Ops() {
  const { clients, loading } = useApp()
  const [selected, setSelected] = useState(null)
  const [showNew, setShowNew] = useState(false)

  if (loading) return <div style={{ padding: '3rem', color: 'var(--text-dim)', textAlign: 'center' }}>Carregando...</div>

  return (
    <div style={{ padding: '1.5rem' }}>
      <SectionHeader
        title="Centro de operações"
        subtitle={`${clients.length} cliente${clients.length !== 1 ? 's' : ''} cadastrado${clients.length !== 1 ? 's' : ''}`}
        action={
          <Btn primary onClick={() => setShowNew(true)}>
            <i className="ti ti-plus" /> Novo cliente
          </Btn>
        }
      />

      {clients.length === 0
        ? <EmptyState icon="users" text="Nenhum cliente cadastrado ainda" />
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {clients.map(c => (
              <ClientCard key={c.id} client={c} onClick={() => setSelected(c)} />
            ))}
          </div>
        )
      }

      {selected && <ClientDetail client={selected} onClose={() => setSelected(null)} />}
      {showNew && <NewClientModal onClose={() => setShowNew(false)} />}
    </div>
  )
}
