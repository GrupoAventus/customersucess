import { useEffect, useState } from 'react'
import { useApp } from '../lib/AppContext'

// Tarefas geradas pela varredura automática do WhatsApp (arquivadas).
// Ficam na aba "agenda" da planilha com responsavel = "WhatsApp".
// Formato do texto:  "<emoji prioridade> <tarefa> ||| <rascunho de resposta opcional>"
//   🔴 urgente · 🟠 responder hoje · 🟡 pode esperar

export const WA_RESPONSAVEL = 'WhatsApp'
export const WA_BRIEFING = 'WhatsAppBriefing'
const DRAFT_SEP = '|||'

const GROUPS = [
  { key: 'urgente', emoji: '🔴', label: 'Urgente', color: 'var(--red)', bg: 'var(--red-bg)', icon: 'ti-flame' },
  { key: 'hoje', emoji: '🟠', label: 'Responder hoje', color: 'var(--orange)', bg: 'var(--orange-dim)', icon: 'ti-clock' },
  { key: 'depois', emoji: '🟡', label: 'Pode esperar', color: 'var(--amber)', bg: 'var(--amber-bg)', icon: 'ti-hourglass' },
]

function parse(item) {
  const raw = String(item.text || '').trim()
  const [head, ...rest] = raw.split(DRAFT_SEP)
  const title = head.trim()
  const draft = rest.join(DRAFT_SEP).trim()
  const g = GROUPS.find(x => title.startsWith(x.emoji))
  return {
    ...item,
    group: g ? g.key : 'depois',
    clean: g ? title.slice(g.emoji.length).trim() : title,
    draft,
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

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    let ok = false
    try { ok = document.execCommand('copy') } catch { ok = false }
    document.body.removeChild(ta)
    return ok
  }
}

function DraftBox({ draft, color }) {
  const [copied, setCopied] = useState(false)

  const copy = async (e) => {
    e.stopPropagation()
    const ok = await copyText(draft)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }
  }

  return (
    <div style={{ margin: '2px 14px 10px 46px', background: '#0c0c0c', border: '0.5px solid #262626', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderBottom: '0.5px solid #1f1f1f' }}>
        <span style={{ fontSize: 11, color: '#777', display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="ti ti-message-2" /> Rascunho de resposta
        </span>
        <button onClick={copy}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600,
            padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
            border: `0.5px solid ${copied ? 'var(--green)' : color}`,
            background: copied ? 'var(--green-bg)' : 'transparent',
            color: copied ? 'var(--green)' : color, transition: 'all 0.15s',
          }}>
          <i className={`ti ${copied ? 'ti-check' : 'ti-copy'}`} />
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <div style={{ padding: '10px 12px', fontSize: 13, lineHeight: 1.55, color: '#cfcfcf', whiteSpace: 'pre-wrap' }}>
        {draft}
      </div>
    </div>
  )
}

function TaskRow({ task, color, onDone }) {
  const [hover, setHover] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [showDraft, setShowDraft] = useState(false)
  const hasDraft = !!task.draft

  const done = (e) => {
    e.stopPropagation()
    setLeaving(true)
    setTimeout(onDone, 250)
  }

  return (
    <div style={{
      borderRadius: 8, background: hover || showDraft ? 'var(--bg-hover)' : 'transparent',
      opacity: leaving ? 0 : 1, transition: 'all 0.2s',
    }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}>
      <div
        onClick={() => hasDraft && setShowDraft(s => !s)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: hasDraft ? 'pointer' : 'default' }}>
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
        {hasDraft && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: showDraft ? color : '#666' }}>
            <i className="ti ti-message-2" style={{ fontSize: 14 }} />
            {showDraft ? 'Fechar' : 'Ver resposta'}
            <Chevron open={showDraft} size={12} />
          </span>
        )}
      </div>
      {hasDraft && showDraft && <DraftBox draft={task.draft} color={color} />}
    </div>
  )
}

function Group({ group, tasks, onDone }) {
  const [open, setOpen] = useState(group.key !== 'depois')
  if (tasks.length === 0) return null
  const drafts = tasks.filter(t => t.draft).length

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
        {drafts > 0 && (
          <span style={{ fontSize: 11, color: '#777', display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className="ti ti-message-2" /> {drafts}
          </span>
        )}
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

function Briefing({ item }) {
  const [open, setOpen] = useState(true)
  if (!item) return null
  const when = item.createdAt ? new Date(item.createdAt) : null
  const allLines = String(item.text || '').split('\n').map(l => l.trimEnd())
  // Linha "🔊 audio:<id do arquivo no Drive>" vira o player; não aparece no texto
  const audioLine = allLines.find(l => /^🔊\s*audio:/i.test(l.trim()))
  const audioId = audioLine ? audioLine.trim().replace(/^🔊\s*audio:\s*/i, '').trim() : ''
  const audioSrc = /^https:\/\//.test(audioId) ? audioId
    : /^[\w-]{10,}$/.test(audioId) ? `https://drive.google.com/uc?export=download&id=${audioId}` : ''
  const lines = allLines.filter(l => l !== audioLine)

  return (
    <div style={{ border: '0.5px solid #2a2a2a', borderRadius: 10, overflow: 'hidden', background: 'var(--bg-card)' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
          background: 'transparent', border: 'none', borderLeft: '3px solid #6b8afd', cursor: 'pointer', textAlign: 'left',
        }}>
        <i className="ti ti-sun" style={{ fontSize: 16, color: '#8fa6ff' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#ddd', flex: 1 }}>Briefing</span>
        {when && (
          <span style={{ fontSize: 11, color: '#666' }}>
            {when.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} · {when.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        <Chevron open={open} />
      </button>
      {open && (
        <div style={{ padding: '10px 16px 14px', borderTop: '0.5px solid #1f1f1f', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {audioSrc && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <i className="ti ti-volume" style={{ fontSize: 16, color: '#8fa6ff' }} />
              <audio controls preload="none" src={audioSrc} style={{ height: 32, flex: 1, maxWidth: 420 }} />
            </div>
          )}
          {lines.map((l, i) => {
            const isHeader = /^(📅|🔴|📉|🗓|☀️|⏸️|Total)/.test(l.trim())
            return l.trim() === '' ? <div key={i} style={{ height: 6 }} /> : (
              <div key={i} style={{
                fontSize: 13, lineHeight: 1.5,
                color: isHeader ? '#eee' : '#bbb', fontWeight: isHeader ? 600 : 400,
                paddingLeft: isHeader ? 0 : 14, marginTop: isHeader && i > 0 ? 6 : 0,
              }}>{l.trim()}</div>
            )
          })}
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

  const briefing = (agenda || [])
    .filter(a => a.responsavel === WA_BRIEFING)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0]

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
          <Briefing item={briefing} />
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
