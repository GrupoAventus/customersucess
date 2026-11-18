/**
 * ProdInsights — Painel de Insights de Produção
 * Aparece no topo da página de cada Centro Criativo.
 *
 * Lógica:
 *  1. Para cada demanda ativa (não done, stage ≠ aprovado) estima o tempo em horas
 *     com base em palavras-chave do texto.
 *  2. Calcula um score de urgência base: (horas disponíveis até prazo) ÷ (horas estimadas)
 *     Quanto menor o score, mais urgente.
 *  3. Aplica multiplicador de prioridade do cliente:
 *       prioridade (🔴) → divide score por 3  (sobe muito na fila)
 *       atencao    (🟡) → divide score por 1.5
 *       estavel    (🟢) → sem alteração
 *  4. Exibe: "Faça agora" (score mais baixo) + 3 próximas em ordem.
 */

import { useMemo, useState } from 'react'

// ── Tabela de estimativas de tempo ──────────────────────────────────────────
// Cada entrada tem keywords (array) e horas (número).
// A primeira keyword que casar no texto da demanda define o tempo.
// Itens mais específicos devem vir antes dos genéricos.
const ESTIMATE_TABLE = [
  // Sites e landing pages
  { keywords: ['landing page', 'lp ', ' lp,', 'página de vendas', 'pagina de vendas'], horas: 16, label: 'Landing page', icon: '🌐' },
  { keywords: ['ecom', 'e-com', 'loja virtual', 'loja online', 'shopify', 'woocommerce', 'ecommerce', 'e-commerce'], horas: 32, label: 'E-commerce', icon: '🛒' },
  { keywords: ['site', 'website', 'hotsite'], horas: 24, label: 'Site', icon: '🌐' },

  // Vídeos
  { keywords: ['vídeo', 'video', 'reels', 'reel', 'shorts', 'tiktok', 'animação', 'animacao', 'motion', 'vsl'], horas: 6, label: 'Vídeo/Reels', icon: '🎬' },

  // Criativos estáticos / social
  { keywords: ['carrossel', 'carousel', 'carrocel'], horas: 4, label: 'Carrossel', icon: '🎠' },
  { keywords: ['story', 'stories', 'storie'], horas: 2, label: 'Stories', icon: '📱' },
  { keywords: ['post', 'feed', 'arte', 'criativo', 'banner', 'peça', 'peca', 'imagem'], horas: 2, label: 'Arte/Post', icon: '🎨' },

  // Textos / copy
  { keywords: ['copy', 'texto', 'script', 'roteiro', 'legenda', 'caption', 'email', 'e-mail', 'newsletter'], horas: 2, label: 'Copy/Texto', icon: '✍️' },

  // Gestão de tráfego
  { keywords: ['campanha', 'trafego', 'tráfego', 'anuncio', 'anúncio', 'ads', 'meta ads', 'google ads', 'subir campanha', 'criar campanha', 'configurar campanha'], horas: 3, label: 'Campanha/Tráfego', icon: '📊' },

  // Relatório / análise
  { keywords: ['relatório', 'relatorio', 'análise', 'analise', 'dashboard', 'planilha', 'report'], horas: 3, label: 'Relatório/Análise', icon: '📈' },

  // Reunião / call
  { keywords: ['reunião', 'reuniao', 'call', 'apresentação', 'apresentacao', 'pitch'], horas: 1.5, label: 'Reunião/Call', icon: '📞' },

  // Ajuste / revisão
  { keywords: ['ajuste', 'ajustar', 'revisar', 'revisão', 'revisao', 'alterar', 'alteration', 'correção', 'correcao', 'corrigir', 'editar', 'edição', 'edicao'], horas: 1, label: 'Ajuste/Revisão', icon: '🔧' },

  // Genérico (fallback)
  { keywords: [], horas: 3, label: 'Tarefa geral', icon: '📋' },
]

/**
 * Estima horas para uma demanda com base no texto.
 * Retorna { horas, label, icon }
 */
function estimarTempo(text) {
  if (!text) return { horas: 3, label: 'Tarefa geral', icon: '📋' }
  const lower = text.toLowerCase()
  for (const entry of ESTIMATE_TABLE) {
    if (entry.keywords.length === 0) return entry // fallback
    if (entry.keywords.some(kw => lower.includes(kw))) return entry
  }
  return { horas: 3, label: 'Tarefa geral', icon: '📋' }
}

const PRIORITY_ICON = {
  prioridade: { icon: '🔴', color: '#e24b4a', label: 'Prioridade' },
  atencao:    { icon: '🟡', color: '#f59e0b', label: 'Atenção' },
  estavel:    { icon: '🟢', color: '#22c55e', label: 'Estável' },
}

// Bônus de urgência adicionado ao score pelo status do cliente
// (subtrai do score base — quanto mais negativo, mais sobe na fila)
const PRIORITY_BONUS = {
  prioridade: -200, // puxa muito para cima
  atencao:    -80,  // puxa moderado
  estavel:    0,
}

/**
 * Calcula score de urgência.
 * Score base:
 *   sem prazo           → 900  (vai pro fim)
 *   prazo vencido       → (diasRestantes - horas) × 10  (valor bem negativo)
 *   prazo futuro        → (horasDisponiveis / horas)     (quanto menor, mais aperto)
 *
 * Score final = score base + PRIORITY_BONUS[clientePriority]
 * Quanto menor o score final, mais urgente → aparece primeiro.
 */
function calcScore(prazo, horas, priorityStatus) {
  const bonus = PRIORITY_BONUS[priorityStatus] ?? 0

  if (!prazo) return 900 + bonus

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const deadline = new Date(prazo + 'T00:00:00')
  const diasRestantes = Math.round((deadline - today) / 86400000)

  let base
  if (diasRestantes < 0) {
    // Vencida: mais dias atrasado + mais horas de trabalho = mais urgente
    base = (diasRestantes - horas) * 10
  } else {
    // Horas disponíveis (8h por dia útil) ÷ horas necessárias
    const horasDisponiveis = diasRestantes * 8
    base = horasDisponiveis / horas
  }

  return base + bonus
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

// ── Card de uma demanda priorizada ──────────────────────────────────────────
function PriorityCard({ demand, rank, clientName, priorityStatus }) {
  const est = estimarTempo(demand.text)
  const diasLabel = diasRestantesLabel(demand.prazo)
  const isFazerAgora = rank === 0
  const priInfo = PRIORITY_ICON[priorityStatus] || PRIORITY_ICON.estavel

  const horasStr = est.horas < 1
    ? `${Math.round(est.horas * 60)}min`
    : est.horas === Math.floor(est.horas)
      ? `${est.horas}h`
      : `${est.horas}h`

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
        {/* Tipo + estimativa */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
          <span style={{ fontSize: 10 }}>{est.icon}</span>
          <span style={{ fontSize: 9, color: '#444', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {est.label}
          </span>
          <span style={{
            fontSize: 9, color: '#333',
            background: '#1a1a1a', borderRadius: 10, padding: '1px 5px',
          }}>
            ~{horasStr}
          </span>
        </div>

        {/* Texto da demanda */}
        <div style={{
          fontSize: 11, color: isFazerAgora ? '#ddd' : '#999',
          lineHeight: 1.4, fontWeight: isFazerAgora ? 500 : 400,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
          wordBreak: 'break-word',
        }}>
          {demand.text}
        </div>

        {/* Cliente + prazo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
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

  // Monta lista priorizada com todas as demandas ativas (não done, não aprovado)
  const prioritized = useMemo(() => {
    const active = demands.filter(d =>
      !d.done && d.stage !== 'aprovado'
    )

    return active
      .map(d => {
        const est = estimarTempo(d.text)
        const client = clients.find(c => c.id === d.clientId)
        const priorityStatus = client?.priorityStatus || 'estavel'
        const score = calcScore(d.prazo, est.horas, priorityStatus)
        return { demand: d, est, score, clientName: client?.name || '—', priorityStatus }
      })
      .sort((a, b) => a.score - b.score)
  }, [demands, clients])

  if (prioritized.length === 0) return null

  const top4 = prioritized.slice(0, 4)
  const totalAtrasadas = prioritized.filter(x => x.score < 0).length
  const totalUrgentes = prioritized.filter(x => x.score >= 0 && x.score < 1).length

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

        {/* Badges de alerta */}
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
          {/* Label "Faça agora" */}
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

          {/* Cards */}
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

          {/* Rodapé: lógica explicada */}
          <div style={{ marginTop: 10, fontSize: 9, color: '#252525', lineHeight: 1.5 }}>
            Prioridade calculada por prazo × tempo estimado — demandas sem prazo ficam por último.
            {prioritized.length > 4 && ` Mais ${prioritized.length - 4} demanda${prioritized.length - 4 !== 1 ? 's' : ''} na fila.`}
          </div>
        </div>
      )}
    </div>
  )
}
