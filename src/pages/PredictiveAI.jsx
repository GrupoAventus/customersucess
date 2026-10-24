import { useState, useEffect } from 'react'
import { useApp } from '../lib/AppContext'

const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL || ''

// Remove markdown que o Claude às vezes adiciona mesmo com instrução para não usar
function cleanText(str) {
  if (!str) return ''
  return str
    .replace(/\*\*(.+?)\*\*/g, '$1')  // **bold** → bold
    .replace(/\*(.+?)\*/g, '$1')       // *italic* → italic
    .replace(/#{1,6}\s*/g, '')         // ## títulos
    .replace(/^---+$/gm, '')           // --- separadores
    .replace(/^>\s*/gm, '')            // > blockquotes
    .trim()
}

// Renderiza texto com bullets (• ou - no início de linha) como lista visual
function TextWithBullets({ text, style }) {
  if (!text) return <span style={style}>—</span>
  const clean = cleanText(text)
  const lines = clean.split('\n').map(l => l.trim()).filter(Boolean)
  const hasBullets = lines.some(l => l.startsWith('•') || l.startsWith('-'))
  if (!hasBullets || lines.length <= 1) {
    return <span style={style}>{clean}</span>
  }
  return (
    <ul style={{ margin: 0, paddingLeft: 16, ...style }}>
      {lines.map((line, i) => {
        const content = line.replace(/^[•\-]\s*/, '')
        return <li key={i} style={{ marginBottom: 2 }}>{content}</li>
      })}
    </ul>
  )
}

// Parseia o texto do Claude no formato estruturado
function parseInsight(text) {
  const get = (label) => {
    const regex = new RegExp(label + ':?\\s*(.+?)(?=\\n[A-ZÇÃÕ⚠️]|$)', 'si')
    const m = text.match(regex)
    return m ? cleanText(m[1].trim()) : ''
  }
  return {
    padrao:       get('PADRÃO IDENTIFICADO'),
    similaridade: get('SIMILARIDADE HISTÓRICA'),
    prev3:        get('PREVISÃO 3 DIAS'),
    prev7:        get('PREVISÃO 7 DIAS'),
    confianca:    get('CONFIANÇA'),
    alerta:       get('⚠️ ALERTA'),
    acao:         get('AÇÃO AGORA'),
    raw:          text,
  }
}

// Verifica se tem alerta real (ignora "Nenhum" com ou sem markdown)
function checkHasAlert(alertaRaw) {
  if (!alertaRaw || !alertaRaw.trim()) return false
  const clean = cleanText(alertaRaw).toLowerCase().trim()
  return clean !== 'nenhum' && clean !== ''
}

function ConfidenceBadge({ text }) {
  const lower = (text || '').toLowerCase()
  const color = lower.startsWith('alto') ? 'var(--green)'
    : lower.startsWith('médio') || lower.startsWith('medio') ? 'var(--amber)'
    : 'var(--red)'
  const label = lower.startsWith('alto') ? 'Alta' : lower.startsWith('médio') || lower.startsWith('medio') ? 'Média' : 'Baixa'
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color, background: color + '22', padding: '2px 8px', borderRadius: 20 }}>
      {label} confiança
    </span>
  )
}

function InsightCard({ client, insight, createdAt }) {
  const [expanded, setExpanded] = useState(false)
  const parsed = parseInsight(insight)
  const hasAlert = checkHasAlert(parsed.alerta)
  const date = createdAt ? new Date(createdAt).toLocaleDateString('pt-BR') : ''

  return (
    <div style={{
      background: hasAlert ? 'rgba(226,75,74,0.07)' : 'var(--bg-card)',
      border: `1px solid ${hasAlert ? 'var(--red)' : 'var(--border)'}`,
      borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: 16,
      transition: 'border 0.2s'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>{client?.name || '—'}</span>
            {hasAlert && (
              <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--red)', color: '#fff', padding: '2px 8px', borderRadius: 20 }}>
                ⚠️ ALERTA
              </span>
            )}
            <ConfidenceBadge text={parsed.confianca} />
          </div>
          <div style={{ fontSize: 11, color: '#555', marginTop: 3 }}>Previsão gerada em {date}</div>
        </div>
        <button onClick={() => setExpanded(e => !e)} style={{
          background: 'none', border: '1px solid var(--border)', borderRadius: 8,
          color: 'var(--fg)', fontSize: 11, padding: '4px 10px', cursor: 'pointer'
        }}>
          {expanded ? 'Fechar ↑' : 'Ver tudo ↓'}
        </button>
      </div>

      {/* Padrão */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>Padrão identificado</div>
        <div style={{ fontSize: 13, color: 'var(--fg)', fontWeight: 500 }}>{parsed.padrao || '—'}</div>
      </div>

      {/* Previsões lado a lado */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div style={{ background: 'var(--bg-hover)', borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: '#666', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>📅 Próximos 3 dias</div>
          <TextWithBullets text={parsed.prev3} style={{ fontSize: 12, color: 'var(--fg)', lineHeight: 1.6 }} />
        </div>
        <div style={{ background: 'var(--bg-hover)', borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: '#666', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>📅 Próximos 7 dias</div>
          <TextWithBullets text={parsed.prev7} style={{ fontSize: 12, color: 'var(--fg)', lineHeight: 1.6 }} />
        </div>
      </div>

      {/* Alerta vermelho se houver */}
      {hasAlert && (
        <div style={{ background: 'rgba(226,75,74,0.13)', border: '1px solid var(--red)', borderRadius: 10, padding: '10px 14px', marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>⚠️ Alerta crítico</div>
          <div style={{ fontSize: 12, color: 'var(--fg)', lineHeight: 1.5 }}>{parsed.alerta}</div>
        </div>
      )}

      {/* Ação agora */}
      <div style={{ background: 'rgba(99,153,34,0.08)', border: '1px solid var(--green)', borderRadius: 10, padding: '10px 14px' }}>
        <div style={{ fontSize: 10, color: 'var(--green)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>⚡ Ação agora</div>
        <TextWithBullets text={parsed.acao} style={{ fontSize: 12, color: 'var(--fg)', lineHeight: 1.6 }} />
      </div>

      {/* Expandido: similaridade histórica + raw */}
      {expanded && (
        <div style={{ marginTop: 12 }}>
          <div style={{ background: 'var(--bg-hover)', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: '#666', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>🔍 Similaridade histórica</div>
            <div style={{ fontSize: 12, color: 'var(--fg)', lineHeight: 1.6 }}>{parsed.similaridade || '—'}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PredictiveAI() {
  const { clients } = useApp()
  const [insights, setInsights] = useState([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState(null)
  const [filter, setFilter] = useState('all') // all | alert | noalert

  async function loadInsights() {
    try {
      const res = await fetch(`${SCRIPT_URL}?action=getPredictiveInsights`)
      const json = await res.json()
      setInsights(json.insights || [])
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    async function init() {
      await loadInsights()
      setLoading(false)
    }
    init()
  }, [])

  async function handleRunNow() {
    setRunning(true)
    setRunResult(null)
    try {
      const res = await fetch(`${SCRIPT_URL}?action=runPredictiveAINow`)
      const json = await res.json()
      setRunResult(json)
      // Recarrega os insights após rodar
      await loadInsights()
    } catch (e) {
      setRunResult({ error: 'Erro ao conectar com o servidor.' })
    }
    setRunning(false)
  }

  const clientMap = Object.fromEntries(clients.map(c => [c.id, c]))

  const filtered = insights.filter(i => {
    const parsed = parseInsight(i.insight || '')
    const hasAlert = checkHasAlert(parsed.alerta)
    if (filter === 'alert') return hasAlert
    if (filter === 'noalert') return !hasAlert
    return true
  })

  // Alertas primeiro
  const sorted = [...filtered].sort((a, b) => {
    const aHas = checkHasAlert(parseInsight(a.insight || '').alerta)
    const bHas = checkHasAlert(parseInsight(b.insight || '').alerta)
    if (aHas && !bHas) return -1
    if (!aHas && bHas) return 1
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

  const alertCount = insights.filter(i => {
    const p = parseInsight(i.insight || '')
    return checkHasAlert(p.alerta)
  }).length

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>🧠</span>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>IA Preditiva</h1>
            {alertCount > 0 && (
              <span style={{ background: 'var(--red)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                {alertCount} alerta{alertCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button
            onClick={handleRunNow}
            disabled={running}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: running ? '#444' : 'var(--orange)',
              color: '#fff', border: 'none', borderRadius: 10,
              fontSize: 13, fontWeight: 700, padding: '8px 16px',
              cursor: running ? 'not-allowed' : 'pointer',
              opacity: running ? 0.7 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {running ? (
              <>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                Gerando previsões...
              </>
            ) : (
              <>🧠 Gerar agora</>
            )}
          </button>
        </div>
        <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
          Previsões geradas toda segunda-feira com base em padrões históricos de todos os clientes.
        </p>

        {/* Resultado do run manual */}
        {runResult && (
          <div style={{
            marginTop: 12,
            padding: '10px 14px',
            borderRadius: 10,
            fontSize: 13,
            background: runResult.error ? 'rgba(226,75,74,0.1)' : 'rgba(99,153,34,0.1)',
            border: `1px solid ${runResult.error ? 'var(--red)' : 'var(--green)'}`,
            color: runResult.error ? 'var(--red)' : 'var(--green)',
          }}>
            {runResult.error
              ? `❌ ${runResult.error}`
              : `✅ Previsões geradas! ${runResult.processed}/${runResult.total} clientes processados.${runResult.errors?.length ? ` (${runResult.errors.length} com erro)` : ''}`
            }
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { id: 'all', label: 'Todos' },
          { id: 'alert', label: '⚠️ Com alerta' },
          { id: 'noalert', label: 'Estáveis' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            fontSize: 12, padding: '5px 14px', borderRadius: 20, cursor: 'pointer',
            background: filter === f.id ? 'var(--orange)' : 'var(--bg-card)',
            border: `1px solid ${filter === f.id ? 'var(--orange)' : 'var(--border)'}`,
            color: filter === f.id ? '#fff' : 'var(--fg)',
            fontWeight: filter === f.id ? 700 : 400,
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div style={{ color: '#666', fontSize: 14, textAlign: 'center', marginTop: 60 }}>Carregando previsões...</div>
      ) : sorted.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: 60, color: '#555' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🧠</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Nenhuma previsão ainda</div>
          <div style={{ fontSize: 13, color: '#666', maxWidth: 380, margin: '0 auto', lineHeight: 1.6 }}>
            A IA roda toda segunda-feira e gera previsões baseadas nas métricas dos últimos 7, 14 e 30 dias de cada cliente.
            Configure o trigger <code>runPredictiveAI</code> no Apps Script para ativar.
          </div>
        </div>
      ) : (
        sorted.map(i => (
          <InsightCard
            key={i.id}
            client={clientMap[i.clientId]}
            insight={i.insight}
            createdAt={i.createdAt}
          />
        ))
      )}
    </div>
  )
}
