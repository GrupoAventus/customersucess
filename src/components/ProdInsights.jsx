/**
 * ProdInsights — Painel de Insights de Produção
 *
 * Lógica de prioridade:
 *  - 🔴 Prioridade → prazo ajustado = prazo real − 3 dias (sobe 3 dias na fila)
 *  - 🟡 Atenção    → prazo ajustado = prazo real − 1 dia
 *  - 🟢 Estável    → prazo ajustado = prazo real
 *
 *  Clique no card → abre modal com insight + botão "Feito"
 *  Botão "Feito" → move demanda para aguardando_aprovacao
 */

import { useMemo, useState } from 'react'
import { useApp } from '../lib/AppContext'

const PRIORITY_ICON = {
  prioridade: { icon: '🔴', color: '#e24b4a', label: 'Prioridade' },
  atencao:    { icon: '🟡', color: '#f59e0b', label: 'Atenção' },
  estavel:    { icon: '🟢', color: '#22c55e', label: 'Estável' },
}

const PRIORITY_ADVANCE_DAYS = {
  prioridade: 3,
  atencao:    1,
  estavel:    0,
}

// Palavras-chave que indicam demanda de longa duração
const LONGA_DURACAO_KEYWORDS = [
  'site', 'lp', 'landing', 'página', 'pagina', 'ecom', 'e-com', 'loja',
  'branding', 'identidade', 'logo', 'vídeo', 'video', 'animação', 'animacao',
  'sistema', 'plataforma', 'aplicativo', 'app', 'integração', 'integracao',
  'funil', 'automação', 'automacao', 'chatbot',
]

function isLongaDuracao(text) {
  if (!text) return false
  const t = text.toLowerCase()
  return LONGA_DURACAO_KEYWORDS.some(kw => t.includes(kw))
}

// Gera um insight contextual baseado no texto da demanda
function gerarInsight(text, clientName, diasRestantes) {
  if (!text) return 'Foque na entrega com qualidade. Revise o briefing antes de começar.'

  const t = text.toLowerCase()
  const urgencia = diasRestantes !== null && diasRestantes <= 0
    ? '⚠️ Prazo vencido — priorize a entrega agora mesmo.'
    : diasRestantes === 0
    ? '⏰ Vence hoje — termine e encaminhe para aprovação ainda hoje.'
    : diasRestantes === 1
    ? '⏰ Vence amanhã — finalize até o fim do dia.'
    : ''

  let dica = ''

  if (t.includes('lp') || t.includes('landing') || t.includes('página')) {
    dica = `💡 Landing Page: foque na proposta de valor acima da dobra. Use um headline forte, CTA visível e prova social. Revise mobile antes de entregar.`
  } else if (t.includes('ecom') || t.includes('e-com') || t.includes('loja')) {
    dica = `💡 E-commerce: destaque os produtos com melhor margem. Fotos de qualidade, preços claros e frete em evidência convertem mais.`
  } else if (t.includes('criativo') || t.includes('arte') || t.includes('banner') || t.includes('post') || t.includes('feed')) {
    dica = `💡 Criativo: explore contraste e hierarquia visual. Headline impactante, copy curto e CTA destacado. Pense em 2–3 variações de cor/texto para teste A/B.`
  } else if (t.includes('video') || t.includes('vídeo') || t.includes('reels') || t.includes('reel')) {
    dica = `💡 Vídeo/Reels: gancho nos primeiros 3 segundos é essencial. Legendas aumentam retenção em 40%. Termine com CTA claro.`
  } else if (t.includes('tráfego') || t.includes('trafego') || t.includes('ads') || t.includes('campanha')) {
    dica = `💡 Campanha: valide a segmentação e o criativo antes de escalar. Cheque pixel, conversões e orçamento configurados corretamente.`
  } else if (t.includes('branding') || t.includes('identidade') || t.includes('logo')) {
    dica = `💡 Branding: mantenha consistência com o tom e paleta do cliente. Apresente variações (claro/escuro, horizontal/vertical) para facilitar a aprovação.`
  } else if (t.includes('copy') || t.includes('texto') || t.includes('roteiro')) {
    dica = `💡 Copy: use a fórmula problema → agitação → solução. Seja específico, evite jargões e finalize com CTA direto.`
  } else if (t.includes('site') || t.includes('web')) {
    dica = `💡 Site: velocidade e mobile first. Revise CTAs, formulários e links antes de entregar. Teste em ao menos 2 navegadores.`
  } else if (t.includes('social') || t.includes('instagram') || t.includes('facebook')) {
    dica = `💡 Social Media: adapte o formato para cada plataforma. Carrossel engaja mais no feed; Stories e Reels para alcance orgânico.`
  } else {
    dica = `💡 Revise o briefing com atenção aos detalhes do cliente. Entregue com qualidade e solicite aprovação assim que pronto.`
  }

  return [urgencia, dica].filter(Boolean).join('\n\n')
}

function normalizePrazo(prazo) {
  if (!prazo) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(prazo)) return prazo
  return prazo.slice(0, 10)
}

function calcScore(prazo, priorityStatus) {
  const dateStr = normalizePrazo(prazo)
  if (!dateStr) return 99999
  const advance = PRIORITY_ADVANCE_DAYS[priorityStatus] ?? 0
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const deadline = new Date(dateStr + 'T00:00:00')
  const diasRestantes = Math.round((deadline - today) / 86400000)
  return diasRestantes - advance
}

function calcDiasRestantes(prazo) {
  const dateStr = normalizePrazo(prazo)
  if (!dateStr) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const deadline = new Date(dateStr + 'T00:00:00')
  return Math.round((deadline - today) / 86400000)
}

function diasRestantesLabel(prazo) {
  const diff = calcDiasRestantes(prazo)
  if (diff === null) return null
  if (diff < 0) return { text: `${Math.abs(diff)}d atrasada`, color: '#e24b4a' }
  if (diff === 0) return { text: 'vence hoje', color: '#f59e0b' }
  if (diff === 1) return { text: 'amanhã', color: '#f59e0b' }
  return { text: `${diff}d restantes`, color: '#555' }
}

// ── Modal de detalhe da demanda ───────────────────────────────────────────────
function DemandModal({ item, onClose, onFeito }) {
  const { demand, clientName, priorityStatus } = item
  const diasLabel = diasRestantesLabel(demand.prazo)
  const diasRestantes = calcDiasRestantes(demand.prazo)
  const priInfo = PRIORITY_ICON[priorityStatus] || PRIORITY_ICON.estavel
  const insight = gerarInsight(demand.text, clientName, diasRestantes)
  const [loading, setLoading] = useState(false)

  const handleFeito = async () => {
    setLoading(true)
    await onFeito(demand.id)
    onClose()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, #0e0c09 0%, #090701 100%)',
          border: '0.5px solid #2e2818',
          borderRadius: 14,
          width: '100%', maxWidth: 480,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(168,85,247,0.05)',
        }}
      >
        {/* Header do modal */}
        <div style={{
          padding: '14px 16px',
          borderBottom: '0.5px solid #1a1710',
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Nome do cliente — destaque */}
            <div style={{
              fontSize: 11, fontWeight: 700, color: priInfo.color,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              marginBottom: 4,
            }}>
              {priInfo.icon} {clientName}
            </div>
            {/* Texto da demanda */}
            <div style={{
              fontSize: 14, fontWeight: 600, color: '#c8bfb0',
              lineHeight: 1.4, wordBreak: 'break-word',
            }}>
              {demand.text}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: '#3a3225',
              cursor: 'pointer', fontSize: 16, padding: 2, flexShrink: 0,
            }}
          >✕</button>
        </div>

        {/* Prazo + status */}
        <div style={{
          padding: '10px 16px',
          borderBottom: '0.5px solid #1a1710',
          display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
        }}>
          {diasLabel && (
            <span style={{
              fontSize: 11, fontWeight: 600, color: diasLabel.color,
              background: '#14110d', border: '0.5px solid #2e2818',
              borderRadius: 6, padding: '3px 8px',
            }}>
              📅 {diasLabel.text}
            </span>
          )}
          {demand.stage && (
            <span style={{
              fontSize: 10, color: '#3a3225',
              background: '#14110d', border: '0.5px solid #2e2818',
              borderRadius: 6, padding: '3px 8px',
            }}>
              {demand.stage.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        {/* Insight */}
        <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #1a1710' }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: '#a855f7',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <i className="ti ti-brain" style={{ fontSize: 11 }} />
            Insight da IA
          </div>
          <div style={{
            fontSize: 12, color: '#7a6f5e', lineHeight: 1.6,
            whiteSpace: 'pre-line',
          }}>
            {insight}
          </div>
        </div>

        {/* Ações */}
        <div style={{
          padding: '12px 16px',
          display: 'flex', gap: 8, justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: '0.5px solid #2e2818',
              color: '#5a5040', borderRadius: 7, padding: '7px 14px',
              fontSize: 11, cursor: 'pointer',
            }}
          >
            Fechar
          </button>
          <button
            onClick={handleFeito}
            disabled={loading}
            style={{
              background: loading ? '#1a4a1a' : '#22c55e',
              border: 'none', color: loading ? '#555' : '#000',
              borderRadius: 7, padding: '7px 16px',
              fontSize: 11, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              transition: 'background 0.15s',
            }}
          >
            <i className="ti ti-check" style={{ fontSize: 11 }} />
            {loading ? 'Movendo...' : 'Feito — Ag. Aprovação'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Card de uma demanda priorizada ───────────────────────────────────────────
function PriorityCard({ item, rank, onClick }) {
  const { demand, clientName, priorityStatus } = item
  const diasLabel = diasRestantesLabel(demand.prazo)
  const isFazerAgora = rank === 0
  const priInfo = PRIORITY_ICON[priorityStatus] || PRIORITY_ICON.estavel

  return (
    <div
      onClick={onClick}
      style={{
        background: isFazerAgora
          ? 'linear-gradient(135deg, #0d150a 0%, #0a1007 100%)'
          : 'linear-gradient(135deg, #0e0c09 0%, #090701 100%)',
        border: `0.5px solid ${isFazerAgora ? 'rgba(34,197,94,0.3)' : '#1e1b14'}`,
        borderRadius: 8,
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        flex: isFazerAgora ? '0 0 auto' : '1 1 0',
        minWidth: 0,
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = isFazerAgora ? 'rgba(34,197,94,0.5)' : '#2e2818'
        e.currentTarget.style.boxShadow = isFazerAgora ? '0 4px 20px rgba(34,197,94,0.08)' : '0 4px 16px rgba(0,0,0,0.3)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = isFazerAgora ? 'rgba(34,197,94,0.3)' : '#1e1b14'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Nome do cliente — visível e destacado */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isFazerAgora ? '#22c55e' : '#14110d',
          fontSize: 9, fontWeight: 700,
          color: isFazerAgora ? '#000' : '#2e2818',
        }}>
          {isFazerAgora ? '▶' : rank + 1}
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700,
          color: isFazerAgora ? priInfo.color : '#888',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          flex: 1,
        }}>
          {clientName}
        </span>
        {priorityStatus !== 'estavel' && (
          <span style={{ fontSize: 9, flexShrink: 0 }}>{priInfo.icon}</span>
        )}
      </div>

      {/* Texto da demanda */}
      <div style={{
        fontSize: 11, color: isFazerAgora ? '#c8bfb0' : '#5a5040',
        lineHeight: 1.4, fontWeight: isFazerAgora ? 500 : 400,
        display: '-webkit-box', WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical', overflow: 'hidden',
        wordBreak: 'break-word',
      }}>
        {demand.text}
      </div>

      {/* Prazo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {diasLabel && (
          <span style={{ fontSize: 9, color: diasLabel.color, fontWeight: 500 }}>
            {diasLabel.text}
          </span>
        )}
        <span style={{
          fontSize: 9, color: '#2a2418',
          marginLeft: 'auto',
          display: 'flex', alignItems: 'center', gap: 3,
        }}>
          <i className="ti ti-info-circle" style={{ fontSize: 9 }} />
          ver detalhes
        </span>
      </div>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function ProdInsights({ demands, clients }) {
  const { setDemandStage } = useApp()
  const [collapsed, setCollapsed] = useState(false)
  const [longaCollapsed, setLongaCollapsed] = useState(true)
  const [selectedItem, setSelectedItem] = useState(null)

  const prioritized = useMemo(() => {
    const active = demands.filter(d => !d.done && d.stage !== 'aprovado' && d.stage !== 'aguardando_aprovacao')

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
  const totalAtrasadas = prioritized.filter(x => calcDiasRestantes(x.demand.prazo) !== null && calcDiasRestantes(x.demand.prazo) < 0).length
  const totalUrgentes  = prioritized.filter(x => {
    const d = calcDiasRestantes(x.demand.prazo)
    return d !== null && d >= 0 && d <= 2
  }).length

  const handleFeito = async (demandId) => {
    await setDemandStage(demandId, 'aguardando_aprovacao')
  }

  // Demandas de longa duração — subset do prioritized, mantém mesma ordem de score
  const longaDuracao = prioritized.filter(x => isLongaDuracao(x.demand.text))

  return (
    <>
      <div style={{
        background: 'linear-gradient(135deg, #0e0c09 0%, #0a0802 100%)',
        border: '0.5px solid #1e1b14',
        borderRadius: 12,
        marginBottom: 18,
        overflow: 'hidden',
        boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div
          onClick={() => setCollapsed(c => !c)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 14px', cursor: 'pointer',
            borderBottom: collapsed ? 'none' : '0.5px solid #1a1710',
          }}
        >
          <i className="ti ti-brain" style={{ fontSize: 14, color: '#a855f7' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#ccc', flex: 1 }}>
            Insights de Produção
          </span>

          {totalAtrasadas > 0 && (
            <span style={{
              fontSize: 9, fontWeight: 700, color: '#e24b4a',
              background: 'rgba(226,75,74,0.1)',
              border: '0.5px solid rgba(226,75,74,0.25)',
              borderRadius: 10, padding: '2px 7px',
            }}>
              {totalAtrasadas} atrasada{totalAtrasadas !== 1 ? 's' : ''}
            </span>
          )}
          {totalUrgentes > 0 && (
            <span style={{
              fontSize: 9, fontWeight: 700, color: '#f59e0b',
              background: 'rgba(245,158,11,0.1)',
              border: '0.5px solid rgba(245,158,11,0.25)',
              borderRadius: 10, padding: '2px 7px',
            }}>
              {totalUrgentes} urgente{totalUrgentes !== 1 ? 's' : ''}
            </span>
          )}
          <span style={{ fontSize: 9, color: '#2a2418' }}>
            {prioritized.length} demandas ativas
          </span>
          <i
            className={`ti ti-chevron-${collapsed ? 'down' : 'up'}`}
            style={{ fontSize: 10, color: '#2a2418' }}
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
              <div style={{ flex: 1, height: 1, background: '#1a1710' }} />
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
                  item={item}
                  rank={i}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </div>

            <div style={{ marginTop: 10, fontSize: 9, color: '#2a2418', lineHeight: 1.5 }}>
              Clique em um card para ver o insight e marcar como feito.
              {prioritized.length > 4 && ` Mais ${prioritized.length - 4} demanda${prioritized.length - 4 !== 1 ? 's' : ''} na fila.`}
            </div>

            {/* Seção de longa duração */}
            {longaDuracao.length > 0 && (
              <div style={{ marginTop: 12, borderTop: '0.5px solid #1a1710', paddingTop: 10 }}>
                <div
                  onClick={e => { e.stopPropagation(); setLongaCollapsed(c => !c) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    cursor: 'pointer', userSelect: 'none',
                  }}
                >
                  <i className="ti ti-clock-hour-4" style={{ fontSize: 11, color: '#3a3225' }} />
                  <span style={{ fontSize: 10, color: '#3a3225', fontWeight: 600, flex: 1 }}>
                    Longa duração ({longaDuracao.length})
                  </span>
                  <i
                    className={`ti ti-chevron-${longaCollapsed ? 'down' : 'up'}`}
                    style={{ fontSize: 9, color: '#2a2418' }}
                  />
                </div>

                {!longaCollapsed && (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {longaDuracao.map((item, i) => {
                      const diasLabel = diasRestantesLabel(item.demand.prazo)
                      const priInfo = PRIORITY_ICON[item.priorityStatus] || PRIORITY_ICON.estavel
                      return (
                        <div
                          key={item.demand.id}
                          onClick={() => setSelectedItem(item)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '7px 10px',
                            background: '#0c0a07',
                            border: '0.5px solid #1e1b14',
                            borderRadius: 7,
                            cursor: 'pointer',
                            transition: 'border-color 0.15s, background 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#2e2818'; e.currentTarget.style.background = '#0e0c09' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1b14'; e.currentTarget.style.background = '#0c0a07' }}
                        >
                          {/* Posição */}
                          <span style={{ fontSize: 9, color: '#2a2418', width: 14, textAlign: 'right', flexShrink: 0 }}>
                            {i + 1}
                          </span>
                          {/* Cliente */}
                          <span style={{
                            fontSize: 10, fontWeight: 700, color: priInfo.color,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            maxWidth: 90, flexShrink: 0,
                          }}>
                            {item.clientName}
                          </span>
                          {/* Texto */}
                          <span style={{
                            fontSize: 10, color: '#5a5040', flex: 1,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {item.demand.text}
                          </span>
                          {/* Prazo */}
                          {diasLabel && (
                            <span style={{ fontSize: 9, color: diasLabel.color, flexShrink: 0 }}>
                              {diasLabel.text}
                            </span>
                          )}
                          {item.priorityStatus !== 'estavel' && (
                            <span style={{ fontSize: 9, flexShrink: 0 }}>{priInfo.icon}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de detalhe */}
      {selectedItem && (
        <DemandModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onFeito={handleFeito}
        />
      )}
    </>
  )
}
