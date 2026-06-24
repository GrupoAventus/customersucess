import { useState } from 'react'
import { useApp } from '../lib/AppContext'
import { Modal, Btn, Field } from './UI'

const SECTION_OPTIONS = [
  { id: 'ops', label: 'Centro de operações' },
  { id: 'dash', label: 'Dashboard' },
  { id: 'squad1', label: 'Squad 1' },
  { id: 'squad2', label: 'Squad 2' },
  { id: 'cc1', label: 'Centro criativo 1' },
  { id: 'cc2', label: 'Centro criativo 2' },
]

export default function AlertModal({ onClose }) {
  const { broadcastAlert } = useApp()
  const [message, setMessage] = useState('')
  const [sections, setSections] = useState([])

  const toggleSection = (id) => {
    setSections(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  const send = () => {
    if (!message.trim() || sections.length === 0) return
    broadcastAlert(message, sections)
    onClose()
  }

  return (
    <Modal title="Emitir alerta" onClose={onClose} width={480}>
      <Field label="Mensagem do alerta">
        <textarea
          rows={3}
          placeholder="Ex: Reunião às 15h, sistema em manutenção..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          autoFocus
        />
      </Field>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>Exibir em</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {SECTION_OPTIONS.map(s => (
            <div
              key={s.id}
              onClick={() => toggleSection(s.id)}
              style={{
                padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                border: `0.5px solid ${sections.includes(s.id) ? 'var(--orange)' : '#2a2a2a'}`,
                background: sections.includes(s.id) ? 'var(--orange-dim)' : 'transparent',
                color: sections.includes(s.id) ? 'var(--orange)' : '#666',
                fontSize: 13, display: 'flex', alignItems: 'center', gap: 8
              }}
            >
              {sections.includes(s.id) && <i className="ti ti-check" style={{ fontSize: 12 }} />}
              {s.label}
            </div>
          ))}
        </div>
        <button
          onClick={() => setSections(SECTION_OPTIONS.map(s => s.id))}
          style={{ background: 'none', border: 'none', color: 'var(--orange)', fontSize: 12, cursor: 'pointer', marginTop: 8, padding: 0 }}
        >
          Selecionar todas
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <Btn onClick={onClose} style={{ flex: 1 }}>Cancelar</Btn>
        <Btn primary onClick={send} disabled={!message.trim() || sections.length === 0} style={{ flex: 1 }}>
          <i className="ti ti-send" /> Emitir alerta
        </Btn>
      </div>
    </Modal>
  )
}
