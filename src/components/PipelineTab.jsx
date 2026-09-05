import { useState } from 'react'
import { useApp } from '../lib/AppContext'

export const PIPELINE_STEPS = [
  { id: 'reuniao_alinhamento', label: 'Reunião de alinhamento' },
  { id: 'plano_acao', label: 'Plano de ação' },
  { id: 'acessos', label: 'Acessos' },
  { id: 'demandas_gerais', label: 'Demandas gerais' },
  { id: 'criativos', label: 'Criativos' },
  { id: 'social_media_lote1', label: '1º lote de Social Media' },
  { id: 'campanhas_ativas', label: 'Campanhas ativas' },
  { id: 'reuniao_acompanhamento', label: '1ª reunião de acompanhamento' },
  { id: 'outro', label: 'Outro' },
]

export default function PipelineTab({ client }) {
  const { setPipelineStep, getClientPipeline } = useApp()
  const steps = getClientPipeline(client.id)
  const [editingNote, setEditingNote] = useState(null)
  const [noteText, setNoteText] = useState('')

  const getStep = (id) => steps.find(s => s.step === id) || { done: false, doneAt: '', note: '' }

  const toggle = async (stepId) => {
    const current = getStep(stepId)
    const done = !current.done
    const doneAt = done ? new Date().toISOString().slice(0, 10) : ''
    await setPipelineStep(client.id, stepId, done, doneAt, current.note)
  }

  const saveNote = async (stepId) => {
    const current = getStep(stepId)
    await setPipelineStep(client.id, stepId, current.done, current.doneAt, noteText)
    setEditingNote(null)
  }

  const totalDone = PIPELINE_STEPS.filter(s => getStep(s.id).done).length
  const pct = Math.round((totalDone / PIPELINE_STEPS.length) * 100)

  return (
    <div>
      {/* Progress bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 }}>
          <span>Progresso da esteira</span>
          <span style={{ color: pct === 100 ? 'var(--green)' : 'var(--orange)' }}>{totalDone}/{PIPELINE_STEPS.length} etapas</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: '#1f1f1f', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? 'var(--green)' : 'var(--orange)', transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {PIPELINE_STEPS.map((s, idx) => {
          const step = getStep(s.id)
          return (
            <div key={s.id} style={{
              background: step.done ? 'rgba(99,153,34,0.08)' : '#1a1a1a',
              border: `0.5px solid ${step.done ? 'var(--green)' : '#2a2a2a'}`,
              borderRadius: 10, padding: '10px 14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Step number */}
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: step.done ? 'var(--green)' : '#2a2a2a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, color: step.done ? '#fff' : '#555'
                }}>
                  {step.done ? <i className="ti ti-check" /> : idx + 1}
                </div>

                {/* Checkbox + label */}
                <div
                  onClick={() => toggle(s.id)}
                  style={{ flex: 1, cursor: 'pointer' }}
                >
                  <div style={{ fontSize: 13, color: step.done ? 'var(--green)' : '#ccc', textDecoration: step.done ? 'line-through' : 'none' }}>
                    {s.label}
                  </div>
                  {step.doneAt && <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>Concluído em {new Date(step.doneAt + 'T00:00:00').toLocaleDateString('pt-BR')}</div>}
                </div>

                {/* Note button */}
                <button
                  onClick={() => { setEditingNote(editingNote === s.id ? null : s.id); setNoteText(step.note) }}
                  style={{ background: 'none', border: 'none', color: step.note ? 'var(--orange)' : '#444', cursor: 'pointer', padding: 4, fontSize: 14 }}
                  title={step.note || 'Adicionar observação'}
                >
                  <i className={`ti ti-${step.note ? 'note' : 'note-off'}`} />
                </button>
              </div>

              {/* Note editor */}
              {editingNote === s.id && (
                <div style={{ marginTop: 8 }}>
                  <textarea
                    rows={2}
                    placeholder={s.id === 'outro' ? 'Descreva a etapa personalizada...' : 'Observação sobre esta etapa...'}
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    style={{ width: '100%', marginBottom: 6 }}
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setEditingNote(null)} style={{ flex: 1, padding: '6px', background: 'none', border: '0.5px solid #333', borderRadius: 6, color: '#666', cursor: 'pointer', fontSize: 12 }}>Cancelar</button>
                    <button onClick={() => saveNote(s.id)} style={{ flex: 1, padding: '6px', background: 'var(--orange)', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 12 }}>Salvar</button>
                  </div>
                </div>
              )}

              {/* Show existing note */}
              {step.note && editingNote !== s.id && (
                <div style={{ marginTop: 6, fontSize: 12, color: '#888', padding: '6px 8px', background: '#141414', borderRadius: 6 }}>{step.note}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
