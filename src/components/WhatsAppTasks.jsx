import { useEffect, useState } from 'react'
import { useApp } from '../lib/AppContext'

// Tarefas geradas pela varredura automática do WhatsApp (arquivadas).
// Ficam na aba "agenda" da planilha com responsavel = "WhatsApp".
// Prioridade vem no início do texto: 🔴 urgente, 🟠 hoje, 🟡 pode esperar.

export const WA_RESPONSAVEL = 'WhatsApp'

const GROUPS = [
  { key: 'urgente', emoji: '🔴', label: 'Urgente', color: 'var(--red)', bg: 'var(--red-bg)', icon: 'ti-flame' },
  { key: 'hoje', emoji: '🟠', label: 'Responder hoje', color: 'var(--orange)', bg: 'var(--orange-dim)', icon: 'ti-clock' },
  { key: 'depois', emoji: '🟡', label: 'Pode esperar', color: 'var(--amber)', bg: 'var(--amber-bg)', icon: 'ti-hourglass' },
]

function parse(item) {
  const text = String(item.text || '').trim()
  const g = GROUPS.find(x => text.startsWith(x.emoji))
  return {
    ...item,
    group: g ? g.key : 'depois',
    clean: g ? text.slice(g.emoji.length).trim() : text,
  }
}

function Chevron({ open, size = 14 }) {
  return (
    <i className="ti ti-chevron-down" style={{
      fontSize: size, color: '#666', transition: 'transform 0.2s',
      transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
    }} />
  )
}

function TaskRow({ task, color, onDone }) {
  const [hover, setHover] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const done = () => {
    setLeaving(true)
    setTimeout(onDone, 250)
  }

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px', borderRadius: 8,
        background: hover ? 'var(--bg-hover)' : 'transparent',
        opacity: leaving ? 0 : 1, transition: 'all 0.2s',
      }}>
      <button
        onClick={done}
        title="Marcar como feito"
        style={{
          width: 20, height: 20, minWidth: 20, borderRadius: 6, padding: 0,
          border: `1.5px solid ${hover || leaving ? color : '#3a3a3a'}`,
          background: leaving ? color : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.15s',
        }}>
        {(hover || leaving) && <i className="ti ti-check" style={{ fontSize: 13, color: leaving ? '#000' : color }} />}
      </button>
      <span style={{
        flex: 1, fontSize: 13.5, lineHeight: 1.45, color: '#e6e6e6',
        textDecoration: leaving ? 'line-through' : 'none',
      }}>
        {task.clean}
      </span>
    </div>
  )
}

function Group({ group, tasks, onDone }) {
  const [open, setOpen] = useState(group.key !== 'depois')
  if (tasks.length === 0) return null

  return (
    <div style={{ border: '0.5px solid #1f1f1f', borderRadius: 10, overflow: 'hidden', background: 'var(--bg-card)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '11px 14px', background: 'transparent', border: 'none',
          borderLeft: `3px solid ${group.color}`, cursor: 'pointer', textAlign: 'left',
        }}>
        <i className={`ti ${group.icon}`} style={{ fontSize: 16, color: group.color }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#ddd', flex: 1 }}>{group.label}</span>
        <span style={{
          fontSize: 11, fontWeight: 600, color: group.color, background: group.bg,
          padding: '2px 9px', borderRadius: 20,
        }}>{tasks.length}</span>
        <Chevron open={open} />
      </button>

      {open && (
        <div style={{ padding: '4px 6px 8px', borderTop: '0.5px solid #1f1f1f' }}>
          {tasks.map(t => (
            <TaskRow key={t.id} task={t} color={group.color} onDone={() => onDone(t.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function WhatsAppTasks() {
  const { agenda, toggleAgendaItem, refreshAgenda } = useApp()
  const [open, setOpen] = useState(true)
  const [updatedAt, setUpdatedAt] = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)

  const refresh = async (e) => {
    if (e) e.stopPropagation()
    if (!refreshAgenda) return
    setRefreshing(true)
    try { await refreshAgenda() } finally {
      setUpdatedAt(new Date())
      setRefreshing(false)
    }
  }

  // Atualiza sozinho a cada 5 minutos
  useEffect(() => {
    const t = setInterval(() => refresh(), 5 * 60 * 1000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const tasks = (agenda || [])
    .filter(a => a.responsavel === WA_RESPONSAVEL && !a.done)
    .map(parse)
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))

  const urgentes = tasks.filter(t => t.group === 'urgente').length

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {/* Cabeçalho — abre/fecha o painel inteiro */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
          padding: '10px 14px', background: '#1a0d04', borderRadius: open ? '10px 10px 0 0' : 10,
          border: '0.5px solid #2a1608', userSelect: 'none',
        }}>
        <i className="ti ti-brand-whatsapp" style={{ fontSize: 18, color: 'var(--orange)' }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--orange)' }}>WhatsApp — faça agora</span>

        {urgentes > 0 && (
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--red)', background: 'var(--red-bg)', padding: '2px 9px', borderRadius: 20 }}>
            {urgentes} urgente{urgentes !== 1 ? 's' : ''}
          </span>
        )}

        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: '#666' }}>
          {tasks.length} pendente{tasks.length !== 1 ? 's' : ''} · {updatedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <button onClick={refresh} disabled={refreshing} title="Atualizar"
          style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 2, display: 'flex' }}>
          <i className="ti ti-refresh" style={{
            fontSize: 15, transition: 'transform 0.6s',
            transform: refreshing ? 'rotate(360deg)' : 'none',
          }} />
        </button>
        <Chevron open={open} size={16} />
      </div>

      {open && (
        <div style={{
          padding: 12, background: '#0f0f0f', border: '0.5px solid #1f1f1f', borderTop: 'none',
          borderRadius: '0 0 10px 10px', display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {tasks.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#555', padding: '8px 4px' }}>
              <i className="ti ti-circle-check" style={{ color: 'var(--green)', fontSize: 16 }} />
              Nada pendente no WhatsApp.
            </div>
          ) : (
            GROUPS.map(g => (
              <Group
                key={g.key}
                group={g}
                tasks={tasks.filter(t => t.group === g.key)}
                onDone={toggleAgendaItem}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
