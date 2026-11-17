import { useEffect, useState } from 'react'
import { useApp } from '../lib/AppContext'

// Tarefas geradas pela varredura automática do WhatsApp (arquivadas).
// Ficam na aba "agenda" da planilha com responsavel = "WhatsApp".
// Prioridade vem no início do texto: 🔴 urgente, 🟠 hoje, 🟡 pode esperar.

export const WA_RESPONSAVEL = 'WhatsApp'

const PRIORITY = [
  { emoji: '🔴', color: 'var(--red)', label: 'Urgente' },
  { emoji: '🟠', color: 'var(--orange)', label: 'Hoje' },
  { emoji: '🟡', color: 'var(--amber)', label: 'Pode esperar' },
]

function parse(item) {
  const text = String(item.text || '').trim()
  const p = PRIORITY.findIndex(x => text.startsWith(x.emoji))
  return {
    ...item,
    rank: p === -1 ? 3 : p,
    color: p === -1 ? '#888' : PRIORITY[p].color,
    clean: p === -1 ? text : text.slice(PRIORITY[p].emoji.length).trim(),
  }
}

export default function WhatsAppTasks() {
  const { agenda, toggleAgendaItem, refreshAgenda } = useApp()
  const [updatedAt, setUpdatedAt] = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)

  const refresh = async () => {
    if (!refreshAgenda) return
    setRefreshing(true)
    try { await refreshAgenda() } finally {
      setUpdatedAt(new Date())
      setRefreshing(false)
    }
  }

  // Atualiza sozinho a cada 5 minutos
  useEffect(() => {
    const t = setInterval(refresh, 5 * 60 * 1000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const tasks = (agenda || [])
    .filter(a => a.responsavel === WA_RESPONSAVEL && !a.done)
    .map(parse)
    .sort((a, b) => a.rank - b.rank || String(a.createdAt).localeCompare(String(b.createdAt)))

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#1a0d04', borderRadius: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--orange)' }}>
          <i className="ti ti-brand-whatsapp" style={{ marginRight: 6 }} />
          WhatsApp — faça agora
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: '#666' }}>
          {tasks.length} pendente{tasks.length !== 1 ? 's' : ''} · atualizado {updatedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          <button onClick={refresh} disabled={refreshing} title="Atualizar"
            style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 0, fontSize: 14 }}>
            <i className={`ti ti-refresh${refreshing ? ' ti-spin' : ''}`} />
          </button>
        </span>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '0.5px solid #1f1f1f', borderRadius: 10, padding: '10px 16px' }}>
        {tasks.length === 0 ? (
          <div style={{ fontSize: 13, color: '#444', padding: '6px 0' }}>Nada pendente no WhatsApp.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {tasks.map((t, i) => (
              <label key={t.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', cursor: 'pointer',
                borderTop: i === 0 ? 'none' : '0.5px solid #1f1f1f',
              }}>
                <input type="checkbox" checked={false} onChange={() => toggleAgendaItem(t.id)}
                  style={{ marginTop: 3, accentColor: 'var(--orange)' }} />
                <span style={{ width: 8, height: 8, borderRadius: 4, background: t.color, marginTop: 6, flexShrink: 0 }} />
                <span style={{ fontSize: 13, lineHeight: 1.4 }}>{t.clean}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
