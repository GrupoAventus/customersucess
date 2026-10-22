import { useState, useEffect } from 'react'
import { useApp } from '../lib/AppContext'
import { Modal, Btn, Field } from './UI'

const DEST_OPTIONS = ['Ecom', 'LP', 'Social Media', 'Squad 1', 'Squad 2']
const CC_OPTIONS = ['Centro criativo 1', 'Centro criativo 2']

// Contas Criativivo disponíveis (Meta e Google)
const CRIATIVIVO_ACCOUNTS = [
  { id: '1518136021992411', name: 'TJ COLECIONÁVEIS', provider: 'meta' },
  { id: '1012345678901234', name: 'ANDERSON', provider: 'meta' },
  { id: '2034567890123456', name: 'GREEN FLIP FLOPS', provider: 'meta' },
  { id: '3045678901234567', name: 'TAHITI', provider: 'meta' },
  { id: '4056789012345678', name: 'DIOGO SEGUROS SUHAI', provider: 'meta' },
  { id: '5067890123456789', name: 'ELLEN', provider: 'meta' },
  { id: '6078901234567890', name: 'PANCONNECT', provider: 'meta' },
  { id: '1518136021992411', name: 'DELPHIS', provider: 'meta' },
  { id: '7089012345678901', name: 'INNOVE 3D', provider: 'meta' },
  { id: '8090123456789012', name: 'PROFFLEX', provider: 'meta' },
  { id: '9001234567890123', name: 'PARANHOS TUR', provider: 'meta' },
  { id: '1234567890123456', name: 'PC AQUECEDORES', provider: 'google' },
  { id: '2345678901234567', name: 'PANCONNECT GOOGLE', provider: 'google' },
]

export default function NewClientModal({ onClose, prefillName, editingClient }) {
  const { createClient, editClient } = useApp()
  const isEdit = Boolean(editingClient)
  const [form, setForm] = useState(isEdit ? {
    name: editingClient.name || '',
    drive: editingClient.drive || '',
    instagram: editingClient.instagram || '',
    site: editingClient.site || '',
    entrou: editingClient.entrou || new Date().toISOString().slice(0, 10),
    destino: editingClient.destino || '',
    rechargeAmount: '', dailySpend: '',
    destinos: editingClient.destinos || [],
    ccLP: editingClient.ccLP || '',
    ccEcom: editingClient.ccEcom || '',
    ccSocial: editingClient.ccSocial || '',
    criativoAccountId: editingClient.criativoAccountId || '',
    clientType: editingClient.clientType || '',
  } : {
    name: prefillName || '', drive: '', instagram: '', site: '',
    entrou: new Date().toISOString().slice(0, 10),
    destino: '', rechargeAmount: '', dailySpend: '',
    destinos: [],
    ccLP: '', ccEcom: '', ccSocial: '',
    criativoAccountId: '',
    clientType: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [criativoAccounts, setCriativoAccounts] = useState(CRIATIVIVO_ACCOUNTS)

  // Tentar carregar contas dinâmicas do Criativivo via Apps Script
  useEffect(() => {
    const scriptUrl = import.meta.env.VITE_SCRIPT_URL
    if (!scriptUrl) return
    fetch(`${scriptUrl}?action=getCriativoAccounts`)
      .then(r => r.json())
      .then(data => { if (data && data.length) setCriativoAccounts(data) })
      .catch(() => {}) // fallback para lista estática
  }, [])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

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
      await editClient(editingClient.id, {
        ...form,
        destino: primaryDestino,
      })
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

  const selectedAccount = criativoAccounts.find(a => a.id === form.criativoAccountId)

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

      {/* Conta Criativivo */}
      <Field label="Conta Criativivo (opcional)">
        <select value={form.criativoAccountId} onChange={e => set('criativoAccountId', e.target.value)}
          style={{ width: '100%', background: 'var(--bg2)', border: '0.5px solid #2a2a2a', borderRadius: 8, padding: '8px 10px', color: form.criativoAccountId ? 'var(--text)' : '#666', fontSize: 13 }}>
          <option value="">Sem conta vinculada</option>
          <optgroup label="Meta Ads">
            {criativoAccounts.filter(a => a.provider === 'meta').map(a => (
              <option key={a.id + a.name} value={a.id}>{a.name}</option>
            ))}
          </optgroup>
          <optgroup label="Google Ads">
            {criativoAccounts.filter(a => a.provider === 'google').map(a => (
              <option key={a.id + a.name} value={a.id}>{a.name}</option>
            ))}
          </optgroup>
        </select>
      </Field>

      {/* Tipo de cliente — aparece só se tiver conta Criativivo */}
      {form.criativoAccountId && (
        <Field label="Tipo de relatório">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { value: 'ecommerce', label: '🛒 E-commerce', desc: 'ROAS, compras, funil completo' },
              { value: 'lead', label: '📲 Lead / WhatsApp', desc: 'Conversas, custo por lead, CTR' },
            ].map(opt => (
              <div key={opt.value} onClick={() => set('clientType', opt.value)}
                style={{
                  padding: '10px 12px', border: `0.5px solid ${form.clientType === opt.value ? 'var(--orange)' : '#2a2a2a'}`,
                  borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                  background: form.clientType === opt.value ? 'var(--orange-dim)' : 'transparent',
                }}>
                <div style={{ fontSize: 13, color: form.clientType === opt.value ? 'var(--orange)' : 'var(--text)', fontWeight: 500 }}>
                  {form.clientType === opt.value && <i className="ti ti-check" style={{ marginRight: 4, fontSize: 11 }} />}
                  {opt.label}
                </div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{opt.desc}</div>
              </div>
            ))}
          </div>
        </Field>
      )}

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 }}>Destino (selecione um ou mais)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {DEST_OPTIONS.map(d => (
            <div key={d} onClick={() => toggleDestino(d)}
              style={{
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
