import { useState } from 'react'
import { useApp, PRIORITY_COLORS, PRIORITY_LEVELS, computeCurrentSaldo } from '../lib/AppContext'
import { Modal, Btn, Field } from './UI'
import NewClientModal from './NewClientModal'
import TimelineTab from './TimelineTab'
import ReportModal from './ReportModal'

const DEST_OPTIONS = ['Squad 1', 'Squad 2', 'Centro criativo 1', 'Centro criativo 2']

export default function ClientDetail({ client, onClose, hideFinance }) {
  const { getClientDemands, toggleDemand, createDemand, setClientNotes, setClientPriority, setClientFinance, setClientCard, cancelClient, isAdmin, deleteClient, reports } = useApp()
  const demands = getClientDemands(client.id)
  const clientReports = [...(reports || [])].filter(r => r.clientId === client.id)
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
  const [showNewDemand, setShowNewDemand] = useState(false)
  const [demandForm, setDemandForm] = useState({ text: '', prazo: '', dest: 'Squad 1' })
  const [saving, setSaving] = useState(false)
  const [notes, setNotes] = useState(client.observacoes || '')
  const [notesSaved, setNotesSaved] = useState(true)
  const [dailySpend, setDailySpend] = useState(client.dailySpend || 0)
  const [rechargeInput, setRechargeInput] = useState('')
  const [showEdit, setShowEdit] = useState(false)
  const [activeTab, setActiveTab] = useState('info')
  const [showReportModal, setShowReportModal] = useState(false)

  const priority = client.priorityStatus || 'estavel'
  const colors = PRIORITY_COLORS[priority]
  const currentSaldo = computeCurrentSaldo(client)

  const saveDemand = async () => {
    if (!demandForm.text.trim()) return
    setSaving(true)
    await createDemand({ ...demandForm, clientId: client.id })
    setDemandForm({ text: '', prazo: '', dest: 'Squad 1' })
    setShowNewDemand(false)
    setSaving(false)
  }

  const saveNotes = async () => {
    await setClientNotes(client.id, notes)
    setNotesSaved(true)
  }

  const saveDailySpend = async () => {
    await setClientFinance(client.id, { dailySpend: parseFloat(dailySpend) || 0 })
  }

  const doRecharge = async () => {
    const val = parseFloat(rechargeInput)
    if (!val || val <= 0) return
    await setClientFinance(client.id, { rechargeAmount: val, recharged: true })
    setRechargeInput('')
  }

  const handleCancel = async () => {
    if (window.confirm(`Cancelar o cliente "${client.name}"? Ele será movido para o histórico de Cancelados.`)) {
      await cancelClient(client.id, true)
      onClose()
    }
  }

  const handleDelete = async () => {
    if (window.confirm(`EXCLUIR PERMANENTEMENTE o cliente "${client.name}"? Esta ação não pode ser desfeita.`)) {
      await deleteClient(client.id)
      onClose()
    }
  }

  return (
    <Modal title={client.name} onClose={onClose}>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: -10, marginBottom: 16, alignItems: 'center' }}>
        {(client.destinos && client.destinos.length > 0 ? client.destinos : [client.destino]).filter(Boolean).map(d => (
          <span key={d} style={{ fontSize: 11, color: 'var(--orange)', background: 'var(--orange-dim)', padding: '2px 10px', borderRadius: 20 }}>{d}</span>
        ))}
        <Btn onClick={() => setShowEdit(true)} style={{ marginLeft: 'auto', fontSize: 11, padding: '3px 10px' }}>
          <i className="ti ti-edit" /> Editar
        </Btn>
      </div>

      {showEdit && <NewClientModal editingClient={client} onClose={() => setShowEdit(false)} />}

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '0.5px solid #1f1f1f' }}>
        {[
          { id: 'info', label: 'Informações' },
          { id: 'timeline', label: 'Linha do tempo' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '8px 16px', background: 'none', border: 'none',
              borderBottom: activeTab === t.id ? '2px solid var(--orange)' : '2px solid transparent',
              color: activeTab === t.id ? 'var(--orange)' : '#666',
              fontSize: 13, cursor: 'pointer'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'timeline' && <TimelineTab client={client} />}

      {activeTab === 'info' && (
      <>

      {/* Priority buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {PRIORITY_LEVELS.map(level => {
          const c = PRIORITY_COLORS[level]
          const active = priority === level
          return (
            <button
              key={level}
              onClick={() => setClientPriority(client.id, level)}
              style={{
                flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                border: `0.5px solid ${c.border}`,
                background: active ? c.border : 'transparent',
                color: active ? '#fff' : c.border,
                cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              {c.label}
            </button>
          )
        })}
      </div>

      {/* Saldo / Reabastecimento */}
      {!hideFinance && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--orange)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, paddingBottom: 6, borderBottom: '0.5px solid #1f1f1f' }}>
            Saldo da campanha
          </div>

          {/* Toggle cartão */}
          <div
            onClick={() => setClientCard(client.id, !client.hasCard)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
              padding: '8px 12px', background: '#1a1a1a', borderRadius: 8,
              border: `0.5px solid ${client.hasCard ? 'var(--green)' : 'var(--border)'}`,
              cursor: 'pointer'
            }}
          >
            <div style={{
              width: 36, height: 20, borderRadius: 10, position: 'relative',
              background: client.hasCard ? 'var(--green)' : '#333',
              transition: 'background 0.2s', flexShrink: 0
            }}>
              <div style={{
                position: 'absolute', top: 2, left: client.hasCard ? 18 : 2,
                width: 16, height: 16, borderRadius: '50%', background: '#fff',
                transition: 'left 0.2s'
              }} />
            </div>
            <div>
              <div style={{ fontSize: 13, color: client.hasCard ? 'var(--green)' : '#888' }}>
                {client.hasCard ? 'Cartão cadastrado na conta' : 'Sem cartão cadastrado'}
              </div>
              <div style={{ fontSize: 11, color: '#444' }}>
                {client.hasCard ? 'Reabastecimento automático' : 'Controle manual de saldo'}
              </div>
            </div>
          </div>

          {!client.hasCard && (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div style={{ background: '#1a1a1a', borderRadius: 8, padding: '10px 14px', flex: 1, border: '0.5px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Saldo atual (estimado)</div>
                  <div style={{ fontSize: 20, fontWeight: 500, color: colors.border }}>
                    R${currentSaldo.toLocaleString('pt-BR')}
                  </div>
                  <div style={{ fontSize: 10, color: '#444', marginTop: 2 }}>
                    Reabastecido: R${(parseFloat(client.rechargeAmount)||0).toLocaleString('pt-BR')} em {client.lastRecharge || '—'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="Gasto diário da campanha (R$)">
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input type="number" value={dailySpend} onChange={e => setDailySpend(e.target.value)} onBlur={saveDailySpend} />
                  </div>
                </Field>
                <Field label="Reabastecer (novo saldo R$)">
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input type="number" placeholder="Ex: 500" value={rechargeInput} onChange={e => setRechargeInput(e.target.value)} />
                    <Btn primary onClick={doRecharge} style={{ flexShrink: 0 }}>Reabastecer</Btn>
                  </div>
                </Field>
              </div>
            </>
          )}
        </div>
      )}

      {/* Links */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--orange)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, paddingBottom: 6, borderBottom: '0.5px solid #1f1f1f' }}>
          Links
        </div>
        {[
          { icon: 'brand-google-drive', label: 'Google Drive', url: client.drive },
          { icon: 'brand-instagram', label: 'Instagram', url: client.instagram },
          { icon: 'world', label: 'Site', url: client.site },
        ].map(l => (
          <a key={l.icon} href={l.url} target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#1a1a1a', borderRadius: 8, marginBottom: 6, border: '0.5px solid var(--border)', color: 'var(--text-muted)', fontSize: 13 }}>
            <i className={`ti ti-${l.icon}`} style={{ color: 'var(--orange)' }} />
            {l.label}
            <i className="ti ti-external-link" style={{ marginLeft: 'auto', fontSize: 11 }} />
          </a>
        ))}
      </div>

      {/* Demandas */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--orange)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, paddingBottom: 6, borderBottom: '0.5px solid #1f1f1f' }}>
          Demandas
          <Btn onClick={() => setShowNewDemand(v => !v)} style={{ fontSize: 11, padding: '3px 10px' }}>
            <i className="ti ti-plus" /> Nova
          </Btn>
        </div>

        {showNewDemand && (
          <div style={{ background: '#1a1a1a', border: '0.5px solid #2a2a2a', borderRadius: 10, padding: '12px', marginBottom: 12 }}>
            <Field label="Descrição">
              <textarea rows={2} placeholder="Descreva a demanda..." value={demandForm.text} onChange={e => setDemandForm(p => ({ ...p, text: e.target.value }))} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Prazo">
                <input type="date" value={demandForm.prazo} onChange={e => setDemandForm(p => ({ ...p, prazo: e.target.value }))} />
              </Field>
              <Field label="Para">
                <select value={demandForm.dest} onChange={e => setDemandForm(p => ({ ...p, dest: e.target.value }))}>
                  {DEST_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </Field>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn onClick={() => setShowNewDemand(false)} style={{ flex: 1 }}>Cancelar</Btn>
              <Btn primary onClick={saveDemand} disabled={saving} style={{ flex: 1 }}>
                {saving ? 'Salvando...' : 'Criar'}
              </Btn>
            </div>
          </div>
        )}

        {demands.length === 0 && !showNewDemand && (
          <div style={{ fontSize: 13, color: '#333', padding: '8px 0' }}>Nenhuma demanda</div>
        )}
        {demands.map(d => (
          <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#1a1a1a', borderRadius: 8, marginBottom: 6, border: '0.5px solid var(--border)' }}>
            <div
              onClick={() => toggleDemand(d.id)}
              style={{
                width: 16, height: 16, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
                border: `0.5px solid ${d.done ? '#639922' : '#333'}`,
                background: d.done ? '#1a2e12' : '#141414',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              {d.done && <i className="ti ti-check" style={{ fontSize: 10, color: 'var(--green)' }} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: d.done ? '#444' : '#ccc', textDecoration: d.done ? 'line-through' : 'none' }}>{d.text}</div>
              <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>{d.dest} · prazo {d.prazo || '—'}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Relatórios de acompanhamento */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--orange)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, paddingBottom: 6, borderBottom: '0.5px solid #1f1f1f' }}>
          Relatórios de acompanhamento
          <Btn onClick={() => setShowReportModal(true)} style={{ fontSize: 11, padding: '3px 10px' }}>
            <i className="ti ti-external-link" /> Ver todos
          </Btn>
        </div>
        {clientReports.length === 0 ? (
          <div style={{ fontSize: 13, color: '#333' }}>Nenhum relatório registrado</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {clientReports.slice(0, 2).map(r => (
              <div key={r.id} style={{ background: '#1a1a1a', borderRadius: 8, padding: '8px 12px', border: '0.5px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: '#555', marginBottom: 3 }}>
                  {new Date(r.date + 'T00:00:00').toLocaleDateString('pt-BR')} às {r.time}
                </div>
                <div style={{ fontSize: 13, color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.notes}</div>
              </div>
            ))}
            {clientReports.length > 2 && (
              <button onClick={() => setShowReportModal(true)} style={{ background: 'none', border: 'none', color: 'var(--orange)', fontSize: 12, cursor: 'pointer', textAlign: 'left', padding: '2px 0' }}>
                +{clientReports.length - 2} relatório{clientReports.length - 2 !== 1 ? 's' : ''} anterior{clientReports.length - 2 !== 1 ? 'es' : ''}
              </button>
            )}
          </div>
        )}
      </div>
      {showReportModal && <ReportModal onClose={() => setShowReportModal(false)} filterClientId={client.id} />}

      {/* Observações */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--orange)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, paddingBottom: 6, borderBottom: '0.5px solid #1f1f1f' }}>
          Observações
        </div>
        <textarea
          rows={3}
          placeholder="Escreva anotações sobre este cliente..."
          value={notes}
          onChange={e => { setNotes(e.target.value); setNotesSaved(false) }}
          onBlur={saveNotes}
        />
        {!notesSaved && <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>Salvando ao sair do campo...</div>}
      </div>

      {/* Análise buttons */}
      {!hideFinance && (
        <div style={{ borderTop: '0.5px solid #1f1f1f', paddingTop: 16, display: 'flex', gap: 8, marginBottom: 12 }}>
          <Btn primary style={{ flex: 1 }}
            onClick={() => {
              const done = demands.filter(d => d.done).length
              const pending = demands.filter(d => !d.done).length
              window.sendPrompt && window.sendPrompt(`Gere uma análise preditiva completa para o cliente ${client.name}: saldo atual estimado R$${currentSaldo}, gasto diário R$${client.dailySpend}, ${pending} demandas pendentes, ${done} concluídas, status atual: ${colors.label}. Preveja se haverá resultado, quando o saldo acaba, pontos de atenção e sugestões de melhoria.`)
            }}>
            <i className="ti ti-sparkles" /> Análise preditiva ↗
          </Btn>
          <Btn style={{ flex: 1 }}
            onClick={() => {
              window.sendPrompt && window.sendPrompt(`Para o cliente ${client.name}, quero uma análise customizada. Quais métricas e período devo informar?`)
            }}>
            <i className="ti ti-adjustments" /> Customizada ↗
          </Btn>
        </div>
      )}

      {/* Cancelar cliente */}
      {!client.cancelado && (
        <div style={{ borderTop: '0.5px solid #1f1f1f', paddingTop: 12 }}>
          <Btn danger onClick={handleCancel} style={{ width: '100%' }}>
            <i className="ti ti-x" /> Cancelar cliente
          </Btn>
        </div>
      )}
      {client.cancelado && (
        <div style={{ borderTop: '0.5px solid #1f1f1f', paddingTop: 12, display: 'flex', gap: 8 }}>
          <Btn onClick={() => cancelClient(client.id, false)} style={{ flex: 1 }}>
            <i className="ti ti-rotate" /> Reativar cliente
          </Btn>
          {isAdmin && (
            <Btn danger onClick={handleDelete} style={{ flex: 1 }}>
              <i className="ti ti-trash" /> Excluir permanentemente
            </Btn>
          )}
        </div>
      )}
      </>
      )}
    </Modal>
  )
}
