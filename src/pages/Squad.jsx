import { useState } from 'react'
import { useApp, KANBAN_COLUMNS, PRIORITY_RANK, PRIORITY_COLORS, computeCurrentSaldo } from '../lib/AppContext'
import ClientCard from '../components/ClientCard'
import ClientDetail from '../components/ClientDetail'
import NewDemandModal from '../components/NewDemandModal'
import DemandTable from '../components/DemandTable'
import NotificationBanner from '../components/NotificationBanner'
import { Btn, SectionHeader } from '../components/UI'
import NotificationBanner from '../components/NotificationBanner'

const RECHARGE_THRESHOLD = 50

export default function Squad({ label, title, sectionId }) {
  const { clients, demands, setClientStatus, getMissingTimelineClients } = useApp()
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

  const needsRecharge = squadClients
    .map(c => ({ ...c, currentSaldo: computeCurrentSaldo(c) }))
    .filter(c => c.status === 'Campanha ativa' && !c.hasCard && c.currentSaldo <= RECHARGE_THRESHOLD)
    .sort((a, b) => {
      const rankDiff = (PRIORITY_RANK[a.priorityStatus] ?? 2) - (PRIORITY_RANK[b.priorityStatus] ?? 2)
      if (rankDiff !== 0) return rankDiff
      return a.currentSaldo - b.currentSaldo
    })

  const nextRecharge = needsRecharge[0]

  const missingTimeline = getMissingTimelineClients()
    .filter(c => (c.destinos || [c.destino]).includes(label))

  const sortByPriority = (list) => [...list].sort((a, b) =>
    (PRIORITY_RANK[a.priorityStatus] ?? 2) - (PRIORITY_RANK[b.priorityStatus] ?? 2)
  )

  const handleDrop = (column) => {
    if (dragId) { setClientStatus(dragId, column); setDragId(null) }
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

      {/* Notification banners */}
      <NotificationBanner section={sectionId} />

      {/* Missing timeline warning */}
      {missingTimeline.length > 0 && (
        <div style={{
          background: 'rgba(226,75,74,0.08)', border: '0.5px solid var(--red)',
          borderRadius: 10, padding: '12px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'flex-start', gap: 10
        }}>
          <i className="ti ti-alert-triangle" style={{ color: 'var(--red)', fontSize: 18, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--red)', marginBottom: 4 }}>
              Linha do tempo de ontem não preenchida
            </div>
            <div style={{ fontSize: 12, color: '#aaa' }}>
              {missingTimeline.map(c => c.name).join(', ')}
            </div>
          </div>
        </div>
      )}

      {/* Recharge queue */}
      {nextRecharge && (
        <div style={{
          background: PRIORITY_COLORS[nextRecharge.priorityStatus]?.bg || 'var(--orange-dim)',
          border: `0.5px solid ${PRIORITY_COLORS[nextRecharge.priorityStatus]?.border || 'var(--orange)'}`,
          borderRadius: 10, padding: '12px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer'
        }} onClick={() => setSelected(nextRecharge)}>
          <i className="ti ti-alert-triangle" style={{ color: PRIORITY_COLORS[nextRecharge.priorityStatus]?.border, fontSize: 20 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Próximo a reabastecer</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{nextRecharge.name}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Saldo atual</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: PRIORITY_COLORS[nextRecharge.priorityStatus]?.border }}>
              R${nextRecharge.currentSaldo.toLocaleString('pt-BR')}
            </div>
          </div>
          {needsRecharge.length > 1 && (
            <div style={{ fontSize: 11, color: 'var(--text-dim)', borderLeft: '0.5px solid #333', paddingLeft: 10 }}>
              +{needsRecharge.length - 1} na fila
            </div>
          )}
        </div>
      )}

      {/* Kanban */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: '2rem' }}>
        {KANBAN_COLUMNS.map(col => {
          const colClients = sortByPriority(squadClients.filter(c => (c.status || 'Pegar acessos') === col))
          return (
            <div key={col}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(col)}
              style={{ background: '#0f0f0f', borderRadius: 12, padding: 10, minHeight: 200, border: '0.5px solid #1a1a1a' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, marginBottom: 10, padding: '4px 6px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: colorMap[col] }} />
                <span style={{ color: '#ccc' }}>{col}</span>
                <span style={{ color: '#444', marginLeft: 'auto' }}>{colClients.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {colClients.map(c => (
                  <div key={c.id} draggable onDragStart={() => setDragId(c.id)}>
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
