import { useState } from 'react'
import { useApp } from '../lib/AppContext'
import { Modal, Btn, Field } from './UI'

const DEST_OPTIONS = ['Ecom', 'LP', 'Social Media', 'Squad 1', 'Squad 2']

export default function NewClientModal({ onClose }) {
  const { createClient } = useApp()
  const [form, setForm] = useState({
    name: '', drive: '', instagram: '', site: '',
    entrou: new Date().toISOString().slice(0, 10),
    destino: '', saldoMax: '', saldo: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!form.name.trim()) { setError('Nome obrigatório'); return }
    if (!form.destino) { setError('Selecione o destino'); return }
    setSaving(true)
    await createClient({
      ...form,
      saldo: parseFloat(form.saldo) || 0,
      saldoMax: parseFloat(form.saldoMax) || 0,
    })
    setSaving(false)
    onClose()
  }

  return (
    <Modal title="Novo cliente" onClose={onClose}>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Orçamento total (R$)">
          <input type="number" placeholder="1000" value={form.saldoMax} onChange={e => set('saldoMax', e.target.value)} />
        </Field>
        <Field label="Saldo atual (R$)">
          <input type="number" placeholder="1000" value={form.saldo} onChange={e => set('saldo', e.target.value)} />
        </Field>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 }}>Destino</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {DEST_OPTIONS.map(d => (
            <div
              key={d}
              onClick={() => set('destino', d)}
              style={{
                padding: 8, border: `0.5px solid ${form.destino === d ? 'var(--orange)' : '#2a2a2a'}`,
                borderRadius: 8, textAlign: 'center', fontSize: 12,
                color: form.destino === d ? 'var(--orange)' : '#666',
                background: form.destino === d ? 'var(--orange-dim)' : 'transparent',
                cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              {d}
            </div>
          ))}
        </div>
      </div>

      {error && <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 8 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <Btn onClick={onClose} style={{ flex: 1 }}>Cancelar</Btn>
        <Btn primary onClick={save} disabled={saving} style={{ flex: 1 }}>
          {saving ? 'Salvando...' : 'Cadastrar cliente'}
        </Btn>
      </div>
    </Modal>
  )
}
