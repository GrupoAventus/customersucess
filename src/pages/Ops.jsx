import { useState } from 'react'
import { useApp } from '../lib/AppContext'
import ClientCard from '../components/ClientCard'
import ClientDetail from '../components/ClientDetail'
import NewClientModal from '../components/NewClientModal'
import AgendaTab from '../components/AgendaTab'
import AlertBanner from '../components/AlertBanner'
import { Btn, SectionHeader, EmptyState } from '../components/UI'

export default function Ops() {
  const { clients, cancelledClients, loading, pendingSales, dismissPendingSale, isAdmin, backfillLpEcomDemands } = useApp()
  const [selected, setSelected] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [prefillName, setPrefillName] = useState('')
  const [tab, setTab] = useState('clients')
  const [backfilling, setBackfilling] = useState(false)
  const [showCancelled, setShowCancelled] = useState(false)

  if (loading) return <div style={{ padding: '3rem', color: 'var(--text-dim)', textAlign: 'center' }}>Carregando...</div>

  const runBackfill = async () => {
    setBackfilling(true)
    const created = await backfillLpEcomDemands()
    setBackfilling(false)
    alert(created > 0 ? `${created} demanda(s) criada(s)!` : 'Nenhuma demanda nova necessária.')
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <SectionHeader
        title="Centro de operações"
        subtitle={`${clients.length} cliente${clients.length !== 1 ? 's' : ''} ativo${clients.length !== 1 ? 's' : ''}`}
        action={
          tab === 'clients' ? (
            <div style={{ display: 'flex', gap: 8 }}>
              {isAdmin && (
                <Btn onClick={runBackfill} disabled={backfilling}>
                  <i className="ti ti-refresh" /> {backfilling ? 'Gerando...' : 'Gerar demandas LP/Ecom'}
                </Btn>
              )}
              <Btn primary onClick={() => { setPrefillName(''); setShowNew(true) }}>
                <i className="ti ti-plus" /> Novo cliente
              </Btn>
            </div>
          ) : null
        }
      />

      <AlertBanner section="ops" />

      {/* Pending sales */}
      {pendingSales.length > 0 && tab === 'clients' && (
        <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pendingSales.map(p => (
            <div key={p.id} style={{ background: 'var(--orange-dim)', border: '0.5px solid var(--orange)', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className="ti ti-alert-circle" style={{ color: 'var(--orange)' }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 500 }}>{p.name}</span>
                <span style={{ color: 'var(--text-dim)' }}> — aguardando cadastro</span>
              </div>
              <Btn primary onClick={() => { setPrefillName(p.name); setShowNew(true); dismissPendingSale(p.id) }}>Cadastrar</Btn>
              <Btn onClick={() => dismissPendingSale(p.id)}>Ignorar</Btn>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '0.5px solid #1f1f1f' }}>
        {[
          { id: 'clients', label: 'Clientes ativos' },
          { id: 'agenda', label: 'Agenda' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 16px', background: 'none', border: 'none',
            borderBottom: tab === t.id ? '2px solid var(--orange)' : '2px solid transparent',
            color: tab === t.id ? 'var(--orange)' : '#666',
            fontSize: 13, cursor: 'pointer'
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'clients' && (
        clients.length === 0
          ? <EmptyState icon="users" text="Nenhum cliente cadastrado ainda" />
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {clients.map(c => <ClientCard key={c.id} client={c} onClick={() => setSelected(c)} />)}
            </div>
      )}

      {tab === 'agenda' && (
        <>
          <AgendaTab />

          {/* Cancelados - menu suspenso */}
          <div style={{ marginTop: 24 }}>
            <button
              onClick={() => setShowCancelled(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 13, padding: '8px 0' }}
            >
              <i className={`ti ti-chevron-${showCancelled ? 'up' : 'down'}`} />
              Clientes cancelados ({cancelledClients.length})
            </button>
            {showCancelled && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginTop: 12 }}>
                {cancelledClients.map(c => (
                  <div key={c.id} onClick={() => setSelected(c)} style={{
                    background: '#141414', border: '0.5px solid #2a2a2a', borderRadius: 12,
                    padding: '1rem 1.25rem', cursor: 'pointer', opacity: 0.6, filter: 'grayscale(1)'
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#666', marginBottom: 4 }}>{c.name}</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {(c.destinos || [c.destino]).filter(Boolean).map(d => (
                        <span key={d} style={{ fontSize: 10, color: '#555', background: '#1a1a1a', padding: '2px 8px', borderRadius: 20 }}>{d}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {selected && <ClientDetail client={selected} onClose={() => setSelected(null)} />}
      {showNew && <NewClientModal onClose={() => setShowNew(false)} prefillName={prefillName} />}
    </div>
  )
}
