import { useState } from 'react'
import { useApp } from '../lib/AppContext'
import { Btn, Field } from './UI'

export default function AgendaTab() {
  const { agenda, createAgendaItem, toggleAgendaItem, deleteAgendaItem, isAdmin } = useApp()
  const [form, setForm] = useState({ text: '', prazo: '', responsavel: '' })
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('pending') // 'all' | 'pending' | 'done'

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!form.text.trim()) return
    setSaving(true)
    await createAgendaItem(form)
    setForm({ text: '', prazo: '', responsavel: '' })
    setShowForm(false)
    setSaving(false)
  }

  const today = new Date().toISOString().slice(0, 10)
  const isOverdue = (item) => !item.done && item.prazo && item.prazo < today

  const sorted = [...(agenda || [])]
    .filter(item => filter === 'all' ? true : filter === 'done' ? item.done : !item.done)
    .sort((a, b) => {
      if (a.done && !b.done) return 1
      if (!a.done && b.done) return -1
      if (a.prazo && b.prazo) return a.prazo.localeCompare(b.prazo)
      if (a.prazo) return -1
      if (b.prazo) return 1
      return 0
    })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { id: 'pending', label: 'Pendentes' },
            { id: 'done', label: 'Concluídas' },
            { id: 'all', label: 'Todas' },
          ].map(t => (
            <button key={t.id} onClick={() => setFilter(t.id)} style={{
              padding: '6px 14px', background: 'none', border: 'none',
              borderBottom: filter === t.id ? '2px solid var(--orange)' : '2px solid transparent',
              color: filter === t.id ? 'var(--orange)' : '#666',
              fontSize: 13, cursor: 'pointer'
            }}>{t.label}</button>
          ))}
        </div>
        <Btn primary onClick={() => setShowForm(v => !v)}>
          <i className="ti ti-plus" /> Nova tarefa
        </Btn>
      </div>

      {showForm && (
        <div style={{ background: '#1a1a1a', border: '0.5px solid #2a2a2a', borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <Field label="Descrição da tarefa">
            <input placeholder="Ex: Ligar para o cliente X, revisar relatório..." value={form.text} onChange={e => set('text', e.target.value)} autoFocus />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Prazo">
              <input type="date" value={form.prazo} onChange={e => set('prazo', e.target.value)} />
            </Field>
            <Field label="Responsável (opcional)">
              <input placeholder="Ex: Bruno, Paulo..." value={form.responsavel} onChange={e => set('responsavel', e.target.value)} />
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={() => setShowForm(false)} style={{ flex: 1 }}>Cancelar</Btn>
            <Btn primary onClick={save} disabled={saving || !form.text.trim()} style={{ flex: 1 }}>
              {saving ? 'Salvando...' : 'Criar tarefa'}
            </Btn>
          </div>
        </div>
      )}

      {sorted.length === 0 && (
        <div style={{ fontSize: 13, color: '#333', padding: '2rem 0', textAlign: 'center' }}>
          {filter === 'pending' ? 'Nenhuma tarefa pendente' : filter === 'done' ? 'Nenhuma tarefa concluída' : 'Nenhuma tarefa criada'}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sorted.map(item => (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px',
            background: isOverdue(item) ? 'rgba(226,75,74,0.08)' : '#1a1a1a',
            borderRadius: 10,
            border: `0.5px solid ${isOverdue(item) ? 'var(--red)' : item.done ? '#1f2e1a' : 'var(--border)'}`,
          }}>
            {/* Checkbox */}
            <div
              onClick={() => toggleAgendaItem(item.id)}
              style={{
                width: 18, height: 18, borderRadius: 5, flexShrink: 0, cursor: 'pointer',
                marginTop: 2,
                border: `0.5px solid ${item.done ? '#639922' : '#444'}`,
                background: item.done ? '#1a2e12' : '#141414',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              {item.done && <i className="ti ti-check" style={{ fontSize: 11, color: 'var(--green)' }} />}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 14, color: item.done ? '#444' : '#ccc',
                textDecoration: item.done ? 'line-through' : 'none',
                marginBottom: 4
              }}>{item.text}</div>
              <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#555' }}>
                {item.prazo && (
                  <span style={{ color: isOverdue(item) ? 'var(--red)' : '#555' }}>
                    {isOverdue(item) && <i className="ti ti-alert-triangle" style={{ marginRight: 3 }} />}
                    Prazo: {new Date(item.prazo + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </span>
                )}
                {item.responsavel && <span>👤 {item.responsavel}</span>}
              </div>
            </div>

            {isAdmin && (
              <button onClick={() => deleteAgendaItem(item.id)} style={{
                background: 'none', border: 'none', color: '#333',
                cursor: 'pointer', padding: 4, flexShrink: 0
              }}>
                <i className="ti ti-trash" style={{ fontSize: 14 }} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
