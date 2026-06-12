import { useState } from 'react'
import { useApp } from '../lib/AppContext'
import { Modal, Btn, Field } from './UI'

const DEST_OPTIONS = ['Ecom', 'LP', 'Social Media', 'Squad 1', 'Squad 2']
const CC_OPTIONS = ['Centro criativo 1', 'Centro criativo 2']

export default function NewClientModal({ onClose, prefillName, editingClient }) {
  const { createClient, editClient } = useApp()
  const isEdit = Boolean(editingClient)
  const [form, setForm] = useState(isEdit ? {
    name: editingClient.name || '', drive: editingClient.drive || '', instagram: editingClient.instagram || '', site: editingClient.site || '',
    entrou: editingClient.entrou || new Date().toISOString().slice(0, 10),
    destino: editingClient.destino || '', rechargeAmount: '', dailySpend: '',
    destinos: editingClient.destinos || [],
    ccLP: editingClient.ccLP || '', ccEcom: editingClient.ccEcom || '', ccSocial: editingClient.ccSocial || ''
  } : {
    name: prefillName || '', drive: '', instagram: '', site: '',
    entrou: new Date().toISOString().slice(0, 10),
    destino: '', rechargeAmount: '', dailySpend: '',
    destinos: [],
    ccLP: '', ccEcom: '', ccSocial: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const toggleDestino = (d) => {
    setForm(p => {
      const has = p.destinos.includes(d)
      const destinos = has ? p.destinos.filter(x => x !== d) : [...p.destinos, d]
      const updates = { destinos }
      // Clear cc selection if deselecting
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
    // Validate CC selections
    if (form.destinos.includes('LP') && !form.ccLP) { setError('Selecione o Centro Criativo para LP'); return }
    if (form.destinos.includes('Ecom') && !form.ccEcom) { setError('Selecione o Centro Criativo para Ecom'); return }
    if (form.destinos.includes('Social Media') && !form.ccSocial) { setError('Selecione o Centro Criativo para Social Media'); return }

    setSaving(true)
    // destino (legacy single field) = first destino selected, for backward compat with squads
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
      {!isEdit && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Reabastecimento inicial (R$)">
            <input type="number" placeholder="500" value={form.rechargeAmount} onChange={e => set('rechargeAmount', e.target.value)} />
          </Field>
          <Field label="Gasto diário da campanha (R$)">
            <input type="number" placeholder="25" value={form.dailySpend} onChange={e => set('dailySpend', e.target.value)} />
          </Field>
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 }}>Destino (selecione um ou mais)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {DEST_OPTIONS.map(d => (
            <div
              key={d}
              onClick={() => toggleDestino(d)}
              style={{
                padding: 8, border: `0.5px solid ${form.destinos.includes(d) ? 'var(--orange)' : '#2a2a2a'}`,
                borderRadius: 8, textAlign: 'center', fontSize: 12,
                color: form.destinos.includes(d) ? 'var(--orange)' : '#666',
                background: form.destinos.includes(d) ? 'var(--orange-dim)' : 'transparent',
                cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              {form.destinos.includes(d) && <i className="ti ti-check" style={{ marginRight: 4 }} />}
              {d}
            </div>
          ))}
        </div>
      </div>

      {/* CC selectors for LP / Ecom / Social Media */}
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
