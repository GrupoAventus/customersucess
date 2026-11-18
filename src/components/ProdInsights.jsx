/**
 * ProdInsights — Painel de Insights de Produção
 *
 * Lógica de prioridade:
 *  - 🔴 Prioridade → prazo ajustado = prazo real − 3 dias (sobe 3 dias na fila)
 *  - 🟡 Atenção    → prazo ajustado = prazo real − 1 dia
 *  - 🟢 Estável    → prazo ajustado = prazo real
 *
 *  Ordena pelo prazo ajustado. Demandas sem prazo ficam por último.
 *  Exibe: "Faça agora" (1ª) + 3 próximas.
 */

import { useMemo, useState } from 'react'

const PRIORITY_ICON = {
  prioridade: { icon: '🔴', color: '#e24b4a', label: 'Prioridade' },
  atencao:    { icon: '🟡', color: '#f59e0b', label: 'Atenção' },
  estavel:    { icon: '🟢', color: '#22c55e', label: 'Estável' },
}

// Dias que subtraímos do prazo para simular urgência adicional
const PRIORITY_ADVANCE_DAYS = {
  prioridade: 3,
  atencao:    1,
  estavel:    0,
}

/**
 * Retorna um número comparável para ordenação.
 * Menor = mais urgente.
 * Sem prazo → 99999 (vai pro fim).
 * Com prazo → dias até o prazo ajustado × 10000 (mantém precisão inteira).
 */
function calcScore(prazo, priorityStatus) {
  if (!prazo) return 99999

  const advance = PRIORITY_ADVANCE_DAYS[priorityStatus] ?? 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const deadline = new Date(prazo + 'T00:00:00')
  const diasRestantes = Math.round((deadline - today) / 86400000)

  // Subtrai os dias de avanço — cliente vermelho aparece 3 dias antes
  return diasRestantes - advance
}

function diasRestantesLabel(prazo) {
  if (!prazo) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const deadline = new Date(prazo + 'T00:00:00')
  const diff = Math.round((deadline - today) / 86400000)
  if (diff < 0) return { text: `${Math.abs(diff)}d atrasada`, color: '#e24b4a' }
  if (diff === 0) return { text: 'vence hoje', color: '#f59e0b' }
  if (diff === 1) return { text: 'amanhã', color: '#f59e0b' }
  return { text: `${diff}d restantes`, color: '#555' }
}

// ── Card de uma demanda priorizada ───────────────────────────────────────────
function PriorityCard({ demand, rank, clientName, priorityStatus }) {
  const diasLabel = diasRestantesLabel(demand.prazo)
  const isFazerAgora = rank === 0
  const priInfo = PRIORITY_ICON[priorityStatus] || PRIORITY_ICON.estavel

  return (
    <div style={{
      background: isFazerAgora ? '#0f1a0f' : '#111',
      border: `1px solid ${isFazerAgora ? '#22c55e44' : '#1c1c1c'}`,
      borderRadius: 8,
      padding: '10px 12px',
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start',
      flex: isFazerAgora ? '0 0 auto' : '1 1 0',
      minWidth: 0,
    }}>
      {/* Rank badge */}
      <div style={{
        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isFazerAgora ? '#22c55e' : '#1a1a1a',
        fontSize: 10, fontWeight: 700,
        color: isFazerAgora ? '#000' : '#333',
      }}>
        {isFazerAgora ? '▶' : rank + 1}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Texto da demanda */}
        <div style={{
          fontSize: 11, color: isFazerAgora ? '#ddd' : '#999',
          lineHeight: 1.4, fontWeight: isFazerAgora ? 500 : 400,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
          wordBreak: 'break-word',
          marginBottom: 5,
        }}>
          {demand.text}
        </div>

        {/* Cliente + prioridade + prazo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 9, color: '#333',
            background: '#161616', borderRadius: 4, padding: '1px 5px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 90,
          }}>
            {clientName}
          </span>
          {priorityStatus !== 'estavel' && (
            <span style={{ fontSize: 9, color: priInfo.color, fontWeight: 600 }}>
              {priInfo.icon} {priInfo.label}
            </span>
          )}
          {diasLabel && (
            <span style={{ fontSize: 9, color: diasLabel.color, fontWeight: 500 }}>
              {diasLabel.text}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function ProdInsights({ demands, clients }) {
  const [collapsed, setCollapsed] = useState(false)

  const prioritized = useMemo(() => {
    const active = demands.filter(d => !d.done && d.stage !== 'aprovado')

    return active
      .map(d => {
        const client = clients.find(c => c.id === d.clientId)
        const priorityStatus = client?.priorityStatus || 'estavel'
        const score = calcScore(d.prazo, priorityStatus)
        return { demand: d, score, clientName: client?.name || '—', priorityStatus }
      })
      .sort((a, b) => a.score - b.score)
  }, [demands, clients])

  if (prioritized.length === 0) return null

  const top4 = prioritized.slice(0, 4)
  const totalAtrasadas = prioritized.filter(x => x.demand.prazo && calcScore(x.demand.prazo, 'estavel') < 0).length
  const totalUrgentes  = prioritized.filter(x => {
    const dias = x.demand.prazo ? Math.round((new Date(x.demand.prazo + 'T00:00:00') - new Date().setHours(0,0,0,0)) / 86400000) : null
    return dias !== null && dias >= 0 && dias <= 2
  }).length

  return (
    <div style={{
      background: '#0d0d0d',
      border: '1px solid #1a1a1a',
      borderRadius: 10,
      marginBottom: 18,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div
        onClick={() => setCollapsed(c => !c)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', cursor: 'pointer',
          borderBottom: collapsed ? 'none' : '1px solid #161616',
        }}
      >
        <i className="ti ti-brain" style={{ fontSize: 14, color: '#a855f7' }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#ccc', flex: 1 }}>
          Insights de Produção
        </span>

        {totalAtrasadas > 0 && (
          <span style={{
            fontSize: 9, fontWeight: 700, color: '#e24b4a',
            background: '#1a0808', borderRadius: 10, padding: '2px 7px',
          }}>
            {totalAtrasadas} atrasada{totalAtrasadas !== 1 ? 's' : ''}
          </span>
        )}
        {totalUrgentes > 0 && (
          <span style={{
            fontSize: 9, fontWeight: 700, color: '#f59e0b',
            background: '#1a1500', borderRadius: 10, padding: '2px 7px',
          }}>
            {totalUrgentes} urgente{totalUrgentes !== 1 ? 's' : ''}
          </span>
        )}
        <span style={{ fontSize: 9, color: '#333' }}>
          {prioritized.length} demandas ativas
        </span>
        <i
          className={`ti ti-chevron-${collapsed ? 'down' : 'up'}`}
          style={{ fontSize: 10, color: '#333' }}
        />
      </div>

      {!collapsed && (
        <div style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{
              fontSize: 9, fontWeight: 700, color: '#22c55e',
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              ▶ Faça agora
            </span>
            <div style={{ flex: 1, height: 1, background: '#1a1a1a' }} />
            {top4.length > 1 && (
              <span style={{
                fontSize: 9, color: '#333',
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                Próximas
              </span>
            )}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: top4.length === 1
              ? '1fr'
              : top4.length === 2
                ? '1fr 1fr'
                : '1.5fr 1fr 1fr 1fr',
            gap: 8,
            alignItems: 'stretch',
          }}>
            {top4.map((item, i) => (
              <PriorityCard
                key={item.demand.id}
                demand={item.demand}
                rank={i}
                clientName={item.clientName}
                priorityStatus={item.priorityStatus}
              />
            ))}
          </div>

          <div style={{ marginTop: 10, fontSize: 9, color: '#252525', lineHeight: 1.5 }}>
            Ordem por prazo — 🔴 Prioridade avança 3 dias na fila, 🟡 Atenção avança 1 dia.
            {prioritized.length > 4 && ` Mais ${prioritized.length - 4} demanda${prioritized.length - 4 !== 1 ? 's' : ''} na fila.`}
          </div>
        </div>
      )}
    </div>
  )
}
