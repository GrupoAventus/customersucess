import { useState } from 'react'
import { useApp } from '../lib/AppContext'
import { Modal, Btn, Field } from './UI'

const DEST_OPTIONS = ['Squad 1', 'Squad 2', 'Centro criativo 1', 'Centro criativo 2']

export default function NewDemandModal({ defaultClientId, defaultDest, onClose }) {
  const { clients, createDemand } = useApp()
  const [form, setForm] = useState({
    clientId: defaultClientId || clients[0]?.id || '',
    text: '', prazo: '',
    dest: defaultDest || 'Squad 1'
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!form.text.trim() || !form.clientId) return
    setSaving(true)
    await createDemand(form)
    setSaving(false)
    onClose()
  }

  return (
    <Modal title="Nova demanda" onClose={onClose}>
      <Field label="Cliente">
        <select value={form.clientId} onChange={e => set('clientId', e.target.value)}>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <Field label="Descrição da demanda">
        <textarea rows={3} placeholder="Descreva a demanda..." value={form.text} onChange={e => set('text', e.target.value)} autoFocus />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Prazo">
          <input type="date" value={form.prazo} onChange={e => set('prazo', e.target.value)} />
        </Field>
        <Field label="Para quem">
          <select value={form.dest} onChange={e => set('dest', e.target.value)}>
            {DEST_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <Btn onClick={onClose} style={{ flex: 1 }}>Cancelar</Btn>
        <Btn primary onClick={save} disabled={saving || !form.text.trim()} style={{ flex: 1 }}>
          {saving ? 'Salvando...' : 'Criar demanda'}
        </Btn>
      </div>
    </Modal>
  )
}
