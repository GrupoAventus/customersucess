import { useState } from 'react'
import { useApp } from '../lib/AppContext'
import { Modal, Btn, Field } from './UI'

const DEST_OPTIONS = ['Ecom', 'LP', 'Social Media', 'Squad 1', 'Squad 2']
const CC_OPTIONS = ['Centro criativo 1', 'Centro criativo 2']

const EVOLUTION_URL = 'https://evolution-api-production-73dff.up.railway.app'
const EVOLUTION_KEY = 'aventus2024'
const INSTANCE = 'aventuscs'

export default function NewClientModal({ onClose, prefillName, editingClient }) {
  const { createClient, editClient } = useApp()
  const isEdit = Boolean(editingClient)
  const [form, setForm] = useState(isEdit ? {
    name: editingClient.name || '', drive: editingClient.drive || '',
    instagram: editingClient.instagram || '', site: editingClient.site || '',
    entrou: editingClient.entrou || new Date().toISOString().slice(0, 10),
    destino: editingClient.destino || '', rechargeAmount: '', dailySpend: '',
    destinos: editingClient.destinos || [],
    ccLP: editingClient.ccLP || '', ccEcom: editingClient.ccEcom || '',
    ccSocial: editingClient.ccSocial || '',
    whatsappGroup: editingClient.whatsappGroup || '',
    whatsappGroupName: editingClient.whatsappGroupName || '',
  } : {
    name: prefillName || '', drive: '', instagram: '', site: '',
    entrou: new Date().toISOString().slice(0, 10),
    destino: '', rechargeAmount: '', dailySpend: '',
    destinos: [], ccLP: '', ccEcom: '', ccSocial: '',
    whatsappGroup: '', whatsappGroupName: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [groups, setGroups] = useState([])
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [groupSearch, setGroupSearch] = useState('')
  const [showGroupList, setShowGroupList] = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const loadGroups = async () => {
    setLoadingGroups(true)
    try {
      const res = await fetch(
        `${EVOLUTION_URL}/group/fetchAllGroups/${INSTANCE}?getParticipants=false`,
        { headers: { 'apikey': EVOLUTION_KEY } }
      )
      const data = await res.json()
      const sorted = data.filter(g => g.subject).sort((a, b) => a.subject.localeCompare(b.subject))
      setGroups(sorted)
      setShowGroupList(true)
    } catch (e) {
      console.error(e)
      alert('Erro ao carregar grupos')
    }
    setLoadingGroups(false)
  }

  const selectGroup = (group) => {
    set('whatsappGroup', group.id)
    set('whatsappGroupName', group.subject)
    setShowGroupList(false)
    setGroupSearch('')
  }

  const filteredGroups = groups.filter(g =>
    g.subject?.toLowerCase().includes(groupSearch.toLowerCase())
  )

  const toggleDestino = (d) => {
    setForm(p => {
      const has = p.destinos.includes(d)
      const destinos = has ? p.destinos.filter(x => x !== d) : [...p.destinos, d]
      const updates = { destinos }
      if (has) {
        if (d === 'LP') updates.ccLP = ''
        if (d === 'Ecom') updates.ccEcom = ''
        if (d === 'Social Media') updates.ccSocial = ''
      }
      return { ...p, ...updates }
    })
  }

  const save = async () => {
    if (!form.name.trim()) { setError('Nome obrigatório'); return }
    if (form.destinos.length === 0) { setError('Selecione ao menos um destino'); return }
    if (form.destinos.includes('LP') && !form.ccLP) { setError('Selecione o Centro Criativo para LP'); return }
    if (form.destinos.includes('Ecom') && !form.ccEcom) { setError('Selecione o Centro Criativo para Ecom'); return }
    if (form.destinos.includes('Social Media') && !form.ccSocial) { setError('Selecione o Centro Criativo para Social Media'); return }

    setSaving(true)
    const primaryDestino = form.destinos.find(d => d === 'Squad 1' || d === 'Squad 2') || form.destinos[0]

    if (isEdit) {
      await editClient(editingClient.id, { ...form, destino: primaryDestino })
    } else {
      await createClient({
        ...form,
        destino: primaryDestino,
        rechargeAmount: parseFloat(form.rechargeAmount) || 0,
        dailySpend: parseFloat(form.dailySpend) || 0,
        lastRecharge: new Date().toISOString().slice(0,10),
        priorityStatus: 'estavel',
      })
    }
    setSaving(false)
    onClose()
  }

  return (
    <Modal title={isEdit ? `Editar cliente — ${editingClient.name}` : "Novo cliente"} onClose={onClose} width={620}>
      <Field label="Nome do cliente">
        <input placeholder="Ex: Bella Store" value={form.name} onChange={e => set('name', e.target.value)} autoFocus />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Link do Drive">
          <input placeholder="https://..." value={form.drive} onChange={e => set('drive', e.target.value)} />
        </Field>
        <Field label="Link do Instagram">
          <input placeholder="https://..." value={form.instagram} onChange={e => set('instagram', e.target.value)} />
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Site">
          <input placeholder="https://..." value={form.site} onChange={e => set('site', e.target.value)} />
        </Field>
        <Field label="Data de entrada">
          <input type="date" value={form.entrou} onChange={e => set('entrou', e.target.value)} />
        </Field>
      </div>

      {/* WhatsApp Group selector */}
      <Field label="Grupo do WhatsApp do cliente">
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, padding: '8px 12px', background: '#141414', border: `0.5px solid ${form.whatsappGroup ? 'var(--green)' : '#2a2a2a'}`, borderRadius: 8, fontSize: 13, color: form.whatsappGroup ? 'var(--green)' : '#555' }}>
            {form.whatsappGroupName || 'Nenhum grupo selecionado'}
          </div>
          {form.whatsappGroup && (
            <button onClick={() => { set('whatsappGroup', ''); set('whatsappGroupName', '') }}
              style={{ background: 'none', border: '0.5px solid #333', borderRadius: 6, color: '#666', cursor: 'pointer', padding: '0 10px' }}>
              <i className="ti ti-x" />
            </button>
          )}
          <Btn onClick={loadGroups} disabled={loadingGroups} style={{ flexShrink: 0 }}>
            <i className="ti ti-brand-whatsapp" /> {loadingGroups ? 'Carregando...' : 'Selecionar'}
          </Btn>
        </div>

        {showGroupList && (
          <div style={{ marginTop: 8, background: '#141414', border: '0.5px solid #2a2a2a', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: 8, borderBottom: '0.5px solid #2a2a2a' }}>
              <input placeholder="Buscar grupo..." value={groupSearch} onChange={e => setGroupSearch(e.target.value)} autoFocus style={{ width: '100%' }} />
            </div>
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {filteredGroups.length === 0 ? (
                <div style={{ padding: 12, fontSize: 13, color: '#444' }}>Nenhum grupo encontrado</div>
              ) : filteredGroups.map(g => (
                <div key={g.id} onClick={() => selectGroup(g)}
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
              <button onClick={() => setShowGroupList(false)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 12 }}>Fechar</button>
            </div>
          </div>
        )}
      </Field>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 }}>Destino (selecione um ou mais)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {DEST_OPTIONS.map(d => (
            <div key={d} onClick={() => toggleDestino(d)} style={{
              padding: 8, border: `0.5px solid ${form.destinos.includes(d) ? 'var(--orange)' : '#2a2a2a'}`,
              borderRadius: 8, textAlign: 'center', fontSize: 12,
              color: form.destinos.includes(d) ? 'var(--orange)' : '#666',
              background: form.destinos.includes(d) ? 'var(--orange-dim)' : 'transparent',
              cursor: 'pointer', transition: 'all 0.15s'
            }}>
              {form.destinos.includes(d) && <i className="ti ti-check" style={{ marginRight: 4 }} />}
              {d}
            </div>
          ))}
        </div>
      </div>

      {form.destinos.includes('LP') && (
        <Field label="LP → Qual Centro Criativo?">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {CC_OPTIONS.map(cc => (
              <div key={cc} onClick={() => set('ccLP', cc)}
                style={{ padding: 8, border: `0.5px solid ${form.ccLP === cc ? 'var(--orange)' : '#2a2a2a'}`, borderRadius: 8, textAlign: 'center', fontSize: 12, color: form.ccLP === cc ? 'var(--orange)' : '#666', background: form.ccLP === cc ? 'var(--orange-dim)' : 'transparent', cursor: 'pointer' }}>
                {cc}
              </div>
            ))}
          </div>
        </Field>
      )}
      {form.destinos.includes('Ecom') && (
        <Field label="Ecom → Qual Centro Criativo?">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {CC_OPTIONS.map(cc => (
              <div key={cc} onClick={() => set('ccEcom', cc)}
                style={{ padding: 8, border: `0.5px solid ${form.ccEcom === cc ? 'var(--orange)' : '#2a2a2a'}`, borderRadius: 8, textAlign: 'center', fontSize: 12, color: form.ccEcom === cc ? 'var(--orange)' : '#666', background: form.ccEcom === cc ? 'var(--orange-dim)' : 'transparent', cursor: 'pointer' }}>
                {cc}
              </div>
            ))}
          </div>
        </Field>
      )}
      {form.destinos.includes('Social Media') && (
        <Field label="Social Media → Qual Centro Criativo?">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {CC_OPTIONS.map(cc => (
              <div key={cc} onClick={() => set('ccSocial', cc)}
                style={{ padding: 8, border: `0.5px solid ${form.ccSocial === cc ? 'var(--orange)' : '#2a2a2a'}`, borderRadius: 8, textAlign: 'center', fontSize: 12, color: form.ccSocial === cc ? 'var(--orange)' : '#666', background: form.ccSocial === cc ? 'var(--orange-dim)' : 'transparent', cursor: 'pointer' }}>
                {cc}
              </div>
            ))}
          </div>
        </Field>
      )}

      {error && <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 8 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <Btn onClick={onClose} style={{ flex: 1 }}>Cancelar</Btn>
        <Btn primary onClick={save} disabled={saving} style={{ flex: 1 }}>
          {saving ? 'Salvando...' : (isEdit ? 'Salvar alterações' : 'Cadastrar cliente')}
        </Btn>
      </div>
    </Modal>
  )
}
