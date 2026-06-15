import { useState } from 'react'
import { useApp } from '../lib/AppContext'
import { Modal, Btn, Field } from './UI'

export default function ReportModal({ onClose, filterClientId }) {
  const { clients, createReport, reports, deleteReport, isAdmin } = useApp()
  const [form, setForm] = useState({
    clientId: filterClientId || clients[0]?.id || '',
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    notes: ''
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!form.clientId || !form.notes.trim()) return
    setSaving(true)
    await createReport(form)
    setForm(p => ({ ...p, notes: '' }))
    setSaving(false)
  }

  const allReports = [...reports].sort((a, b) =>
    `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)
  )
  const sortedReports = filterClientId
    ? allReports.filter(r => r.clientId === filterClientId)
    : allReports

  const clientName = (id) => clients.find(c => c.id === id)?.name || '—'

  const filteredClientName = filterClientId ? clients.find(c => c.id === filterClientId)?.name : null

  return (
    <Modal title={filteredClientName ? `Relatórios — ${filteredClientName}` : 'Relatórios de acompanhamento'} onClose={onClose} width={620}>
      <div style={{ display: 'grid', gridTemplateColumns: filterClientId ? '1fr' : '1fr 1fr', gap: 10 }}>
        {!filterClientId && (
          <Field label="Cliente">
            <select value={form.clientId} onChange={e => set('clientId', e.target.value)}>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        )}
        <Field label="Data">
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </Field>
      </div>
      <Field label="Horário">
        <input type="time" value={form.time} onChange={e => set('time', e.target.value)} />
      </Field>
      <Field label="Anotações sobre o que foi discutido">
        <textarea rows={4} placeholder="Ex: discutimos os resultados da campanha, cliente pediu para focar em..." value={form.notes} onChange={e => set('notes', e.target.value)} />
      </Field>
      <Btn primary onClick={save} disabled={saving || !form.notes.trim()} style={{ width: '100%', marginBottom: 16 }}>
        {saving ? 'Salvando...' : 'Salvar relatório'}
      </Btn>

      <div style={{ fontSize: 11, color: 'var(--orange)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, paddingBottom: 6, borderBottom: '0.5px solid #1f1f1f' }}>
        Histórico
      </div>
      {sortedReports.length === 0 && (
        <div style={{ fontSize: 13, color: '#333', padding: '8px 0' }}>Nenhum relatório registrado</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
        {sortedReports.map(r => (
          <div key={r.id} style={{ background: '#1a1a1a', borderRadius: 8, padding: '10px 12px', border: '0.5px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--orange)' }}>{clientName(r.clientId)}</span>
                <span style={{ fontSize: 11, color: '#555', marginLeft: 8 }}>
                  {new Date(r.date + 'T00:00:00').toLocaleDateString('pt-BR')} às {r.time}
                </span>
              </div>
              {isAdmin && (
                <button onClick={() => deleteReport(r.id)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: 4 }}>
                  <i className="ti ti-trash" />
                </button>
              )}
            </div>
            <div style={{ fontSize: 13, color: '#ccc' }}>{r.notes}</div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
