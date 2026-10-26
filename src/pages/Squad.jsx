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

const EVOLUTION_URL = 'https://evolution-api-production-73dff.up.railway.app'
const EVOLUTION_KEY = 'aventus2024'
const EVOLUTION_INSTANCE = 'aventuscs'

// Modal de configuração de grupo de avisos de saldo
function SquadAlertConfigModal({ squadId, squadLabel, currentGroupId, currentGroupName, onSave, onClose }) {
  const [selectedGroupId, setSelectedGroupId] = useState(currentGroupId || '')
  const [selectedGroupName, setSelectedGroupName] = useState(currentGroupName || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Seletor de grupos WhatsApp
  const [groups, setGroups] = useState([])
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [groupSearch, setGroupSearch] = useState('')
  const [showGroupList, setShowGroupList] = useState(false)

  const loadGroups = async () => {
    setLoadingGroups(true)
    try {
      const res = await fetch(
        `${EVOLUTION_URL}/group/fetchAllGroups/${EVOLUTION_INSTANCE}?getParticipants=false`,
        { headers: { 'apikey': EVOLUTION_KEY } }
      )
      const data = await res.json()
      const sorted = data.filter(g => g.subject).sort((a, b) => a.subject.localeCompare(b.subject))
      setGroups(sorted)
      setShowGroupList(true)
    } catch (e) {
      console.error(e)
      setError('Erro ao carregar grupos do WhatsApp')
    }
    setLoadingGroups(false)
  }

  const selectGroup = (group) => {
    setSelectedGroupId(group.id)
    setSelectedGroupName(group.subject)
    setShowGroupList(false)
    setGroupSearch('')
    setError('')
  }

  const filteredGroups = groups.filter(g =>
    g.subject?.toLowerCase().includes(groupSearch.toLowerCase())
  )

  const handleSave = async () => {
    if (!selectedGroupId) { setError('Selecione um grupo primeiro'); return }
    setSaving(true)
    setError('')
    try {
      await setSquadConfigSheet(squadId, selectedGroupId, selectedGroupName)
      onSave({ alertGroupId: selectedGroupId, alertGroupName: selectedGroupName })
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
        padding: '24px 28px', width: 460, maxWidth: '90vw'
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
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

        {/* Seletor de grupo */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>Grupo do WhatsApp</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{
              flex: 1, padding: '9px 12px', background: '#141414',
              border: `0.5px solid ${selectedGroupId ? 'var(--green)' : '#2a2a2a'}`,
              borderRadius: 8, fontSize: 13,
              color: selectedGroupId ? 'var(--green)' : '#555'
            }}>
              {selectedGroupName || 'Nenhum grupo selecionado'}
            </div>
            {selectedGroupId && (
              <button
                onClick={() => { setSelectedGroupId(''); setSelectedGroupName('') }}
                style={{ background: 'none', border: '0.5px solid #333', borderRadius: 6, color: '#666', cursor: 'pointer', padding: '0 10px' }}
              >
                <i className="ti ti-x" />
              </button>
            )}
            <button
              onClick={loadGroups}
              disabled={loadingGroups}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '0 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                border: '0.5px solid #2a2a2a', background: '#1a1a1a',
                color: loadingGroups ? '#555' : '#ccc', cursor: loadingGroups ? 'not-allowed' : 'pointer',
                flexShrink: 0, whiteSpace: 'nowrap'
              }}
            >
              <i className="ti ti-brand-whatsapp" />
              {loadingGroups ? 'Carregando...' : 'Selecionar'}
            </button>
          </div>

          {/* Lista de grupos */}
          {showGroupList && (
            <div style={{ marginTop: 8, background: '#141414', border: '0.5px solid #2a2a2a', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: 8, borderBottom: '0.5px solid #2a2a2a' }}>
                <input
                  placeholder="Buscar grupo..."
                  value={groupSearch}
                  onChange={e => setGroupSearch(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%', background: '#1a1a1a', border: '0.5px solid #2a2a2a',
                    borderRadius: 6, padding: '7px 10px', fontSize: 13, color: '#eee',
                    outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                {filteredGroups.length === 0 ? (
                  <div style={{ padding: 12, fontSize: 13, color: '#444' }}>Nenhum grupo encontrado</div>
                ) : filteredGroups.map(g => (
                  <div
                    key={g.id}
                    onClick={() => selectGroup(g)}
                    style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 13, color: '#ccc', borderBottom: '0.5px solid #1a1a1a' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1f1f1f'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <i className="ti ti-users" style={{ marginRight: 8, color: '#555' }} />
                    {g.subject}
                  </div>
                ))}
              </div>
              <div style={{ padding: 8, borderTop: '0.5px solid #2a2a2a' }}>
                <button
                  onClick={() => setShowGroupList(false)}
                  style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 12 }}
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Status atual */}
        {currentGroupId && !showGroupList && (
          <div style={{
            background: '#0d1a0d', border: '0.5px solid #1a3a1a', borderRadius: 8,
            padding: '8px 12px', marginBottom: 16, fontSize: 12
          }}>
            <span style={{ color: '#4a8a4a' }}>✓ Configurado atualmente: </span>
            <span style={{ color: '#ccc' }}>{currentGroupName || currentGroupId}</span>
          </div>
        )}

        {!currentGroupId && !showGroupList && (
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
          <button onClick={handleSave} disabled={saving || !selectedGroupId} style={{
            background: saving || !selectedGroupId ? '#1a1a1a' : 'var(--orange)', border: 'none',
            borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600,
            color: saving || !selectedGroupId ? '#555' : '#000',
            cursor: saving || !selectedGroupId ? 'not-allowed' : 'pointer'
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
