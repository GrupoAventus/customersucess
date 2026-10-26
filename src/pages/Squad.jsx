import { useState, useEffect } from 'react'
import { useApp, KANBAN_COLUMNS, PRIORITY_RANK, PRIORITY_COLORS } from '../lib/AppContext'
import ClientCard from '../components/ClientCard'
import ClientDetail from '../components/ClientDetail'
import NewDemandModal from '../components/NewDemandModal'
import DemandTable from '../components/DemandTable'
import AlertBanner from '../components/AlertBanner'
import NotificationBanner from '../components/NotificationBanner'
import { Btn, SectionHeader } from '../components/UI'
import { fetchSquadConfig, setSquadConfigSheet } from '../lib/sheets'

// Modal de configuração de grupo de avisos de saldo
function SquadAlertConfigModal({ squadId, squadLabel, currentGroupId, currentGroupName, onSave, onClose }) {
  const [groupId, setGroupId] = useState(currentGroupId || '')
  const [groupName, setGroupName] = useState(currentGroupName || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      await setSquadConfigSheet(squadId, groupId.trim(), groupName.trim())
      onSave({ alertGroupId: groupId.trim(), alertGroupName: groupName.trim() })
      onClose()
    } catch (e) {
      setError('Erro ao salvar: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }} onClick={onClose}>
      <div style={{
        background: '#111', border: '0.5px solid #2a2a2a', borderRadius: 14,
        padding: '24px 28px', width: 420, maxWidth: '90vw'
      }} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#eee' }}>
              <i className="ti ti-bell-ringing" style={{ marginRight: 8, color: 'var(--orange)' }} />
              Avisos de Saldo — {squadLabel}
            </div>
            <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>
              Alertas de saldo baixo serão enviados para este grupo
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 18 }}>
            <i className="ti ti-x" />
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 6 }}>
            ID do Grupo WhatsApp
          </label>
          <input
            value={groupId}
            onChange={e => setGroupId(e.target.value)}
            placeholder="120363...@g.us"
            style={{
              width: '100%', background: '#1a1a1a', border: '0.5px solid #2a2a2a',
              borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#eee',
              outline: 'none', boxSizing: 'border-box'
            }}
          />
          <div style={{ fontSize: 10, color: '#444', marginTop: 4 }}>
            Para descobrir o ID: envie uma mensagem no grupo pelo WhatsApp Web e copie o número que aparece na URL (formato: 120363...@g.us)
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 6 }}>
            Nome do grupo (para referência)
          </label>
          <input
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            placeholder="Ex: Squad 2 — Interno"
            style={{
              width: '100%', background: '#1a1a1a', border: '0.5px solid #2a2a2a',
              borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#eee',
              outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>

        {currentGroupId && (
          <div style={{
            background: '#0d1a0d', border: '0.5px solid #1a3a1a', borderRadius: 8,
            padding: '8px 12px', marginBottom: 16, fontSize: 12
          }}>
            <span style={{ color: '#4a8a4a' }}>✓ Configurado atualmente: </span>
            <span style={{ color: '#ccc' }}>{currentGroupName || currentGroupId}</span>
          </div>
        )}

        {!currentGroupId && (
          <div style={{
            background: '#1a1205', border: '0.5px solid #3a2a05', borderRadius: 8,
            padding: '8px 12px', marginBottom: 16, fontSize: 12, color: '#aa8830'
          }}>
            ⚠️ Sem grupo configurado — alertas vão para o grupo de cada cliente individualmente
          </div>
        )}

        {error && (
          <div style={{ color: '#ff6b6b', fontSize: 12, marginBottom: 12 }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            background: 'none', border: '0.5px solid #2a2a2a', borderRadius: 8,
            padding: '8px 16px', fontSize: 13, color: '#888', cursor: 'pointer'
          }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving || !groupId.trim()} style={{
            background: saving ? '#1a1a1a' : 'var(--orange)', border: 'none',
            borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600,
            color: saving ? '#555' : '#000', cursor: saving || !groupId.trim() ? 'not-allowed' : 'pointer'
          }}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Squad({ label, title, sectionId }) {
  const { clients, demands, setClientStatus } = useApp()
  const [selected, setSelected] = useState(null)
  const [showDemand, setShowDemand] = useState(false)
  const [showAlertConfig, setShowAlertConfig] = useState(false)
  const [dragId, setDragId] = useState(null)
  const [squadConfig, setSquadConfig] = useState({})

  const squadClients = clients.filter(c => (c.destinos || [c.destino]).includes(label))
  const squadDemands = demands
    .filter(d => d.dest === label)
    .map(d => ({ ...d, clientName: clients.find(c => c.id === d.clientId)?.name || '—' }))

  // Mapeia label → squadId
  const LABEL_TO_SQUAD = { 'Squad 1': 'squad1', 'Squad 2': 'squad2' }
  const squadId = LABEL_TO_SQUAD[label] || sectionId

  const colorMap = {
    'Pegar acessos': '#888',
    'Aguardando campanha': 'var(--amber)',
    'Campanha ativa': 'var(--green)',
    'Anúncios pausados': 'var(--red)',
  }

  const sortByPriority = (list) => [...list].sort((a, b) =>
    (PRIORITY_RANK[a.priorityStatus] ?? 2) - (PRIORITY_RANK[b.priorityStatus] ?? 2)
  )

  const handleDrop = (column) => {
    if (dragId) { setClientStatus(dragId, column); setDragId(null) }
  }

  // Carrega config do squad ao montar
  useEffect(() => {
    fetchSquadConfig().then(cfg => {
      setSquadConfig(cfg[squadId] || {})
    }).catch(() => {})
  }, [squadId])

  const currentGroupId = squadConfig.alertGroupId || ''
  const currentGroupName = squadConfig.alertGroupName || ''

  return (
    <div style={{ padding: '1.5rem' }}>
      <SectionHeader
        title={title}
        subtitle={`${squadClients.length} cliente${squadClients.length !== 1 ? 's' : ''} · ${squadDemands.filter(d => !d.done).length} demandas pendentes`}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setShowAlertConfig(true)}
              title={currentGroupId ? `Avisos de saldo: ${currentGroupName || currentGroupId}` : 'Configurar grupo de avisos de saldo'}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 8, fontSize: 12,
                border: currentGroupId ? '0.5px solid #1a3a1a' : '0.5px solid #2a2000',
                background: currentGroupId ? '#0d1a0d' : '#1a1205',
                color: currentGroupId ? '#4a8a4a' : '#aa8830',
                cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              <i className="ti ti-bell" />
              <span>Avisos de Saldo</span>
              {currentGroupId && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4a8a4a', display: 'inline-block' }} />}
            </button>
            <Btn primary onClick={() => setShowDemand(true)}><i className="ti ti-plus" /> Criar demanda</Btn>
          </div>
        }
      />

      <AlertBanner section={sectionId} />
      <NotificationBanner section={sectionId} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: '2rem' }}>
        {KANBAN_COLUMNS.map(col => {
          const colClients = sortByPriority(squadClients.filter(c => (c.status || 'Pegar acessos') === col))
          return (
            <div key={col} onDragOver={e => e.preventDefault()} onDrop={() => handleDrop(col)}
              style={{ background: '#0f0f0f', borderRadius: 12, padding: 10, minHeight: 200, border: '0.5px solid #1a1a1a' }}>
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
                {colClients.length === 0 && <div style={{ fontSize: 11, color: '#333', textAlign: 'center', padding: '1rem 0' }}>Arraste clientes aqui</div>}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ fontSize: 13, fontWeight: 500, color: '#ccc', marginBottom: 8 }}>Todas as demandas</div>
      <DemandTable demands={squadDemands} />

      {selected && <ClientDetail client={selected} onClose={() => setSelected(null)} />}
      {showDemand && <NewDemandModal defaultDest={label} onClose={() => setShowDemand(false)} />}

      {showAlertConfig && (
        <SquadAlertConfigModal
          squadId={squadId}
          squadLabel={title}
          currentGroupId={currentGroupId}
          currentGroupName={currentGroupName}
          onSave={(cfg) => setSquadConfig(prev => ({ ...prev, ...cfg }))}
          onClose={() => setShowAlertConfig(false)}
        />
      )}
    </div>
  )
}
