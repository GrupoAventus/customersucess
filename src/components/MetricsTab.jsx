import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../lib/AppContext'

const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL

// Todas as métricas disponíveis
const METRICS_META = [
  { key: 'spend',       label: 'Investimento',  unit: 'R$',  format: 'currency' },
  { key: 'impressions', label: 'Impressões',     unit: '',    format: 'number'   },
  { key: 'reach',       label: 'Alcance',        unit: '',    format: 'number'   },
  { key: 'clicks',      label: 'Cliques (total)',unit: '',    format: 'number'   },
  { key: 'linkClicks',  label: 'Link Clicks',    unit: '',    format: 'number'   },
  { key: 'lpv',         label: 'Landing Page Views', unit: '',format: 'number'  },
  { key: 'ctr',         label: 'CTR',            unit: '%',   format: 'percent'  },
  { key: 'cpm',         label: 'CPM',            unit: 'R$',  format: 'currency' },
  { key: 'cpc',         label: 'CPC',            unit: 'R$',  format: 'currency' },
  { key: 'frequency',   label: 'Frequência',     unit: '',    format: 'decimal'  },
  { key: 'leads',       label: 'Leads',          unit: '',    format: 'number'   },
  { key: 'messages',    label: 'Conversas',      unit: '',    format: 'number'   },
  { key: 'purchases',   label: 'Compras',        unit: '',    format: 'number'   },
  { key: 'roas',        label: 'ROAS',           unit: 'x',   format: 'decimal'  },
  { key: 'cpa',         label: 'CPA',            unit: 'R$',  format: 'currency' },
]

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Hoje'            },
  { value: '7',     label: 'Últimos 7 dias'  },
  { value: '14',    label: 'Últimos 14 dias' },
  { value: '30',    label: 'Últimos 30 dias' },
  { value: 'month', label: 'Este mês'        },
  { value: 'custom',label: 'Personalizado'   },
]

// Colunas mostradas na tabela de visão geral
const OVERVIEW_COLS = [
  { key: 'spend',       label: 'Gasto',       format: 'currency' },
  { key: 'conversions', label: 'Conversões',  format: 'number'   },
  { key: 'roas',        label: 'ROAS',        format: 'decimal'  },
  { key: 'ctr',         label: 'CTR',         format: 'percent'  },
  { key: 'leads',       label: 'Leads',       format: 'number'   },
  { key: 'messages',    label: 'Conversas',   format: 'number'   },
  { key: 'purchases',   label: 'Compras',     format: 'number'   },
  { key: 'impressions', label: 'Impressões',  format: 'number'   },
  { key: 'cpm',         label: 'CPM',         format: 'currency' },
]

function fmt(value, format) {
  const n = parseFloat(value) || 0
  if (format === 'currency') {
    return 'R$ ' + n.toFixed(2)
      .replace('.', ',')
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }
  if (format === 'percent') return `${n.toFixed(2)}%`
  if (format === 'decimal')  return n.toFixed(2)
  return n.toLocaleString('pt-BR')
}

// Preenche dias faltantes no array daily com zeros (Meta só retorna dias com gasto)
function fillDailyGaps(daily, startDate, endDate) {
  if (!daily || !startDate || !endDate) return daily || []
  const result = []
  const cursor = new Date(startDate + 'T12:00:00Z')
  const end    = new Date(endDate   + 'T12:00:00Z')
  const byDate = {}
  daily.forEach(d => { if (d.date) byDate[d.date] = d })
  const ZERO = { spend: 0, impressions: 0, clicks: 0, linkClicks: 0, reach: 0, leads: 0, purchases: 0, messages: 0, ctr: 0, cpm: 0, cpc: 0, roas: 0, cpa: 0 }
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10)
    result.push(byDate[key] ? byDate[key] : { ...ZERO, date: key })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return result
}

function MiniChart({ data, metric, color = 'var(--orange)' }) {
  if (!data || data.length < 2) return null
  const values = data.map(d => parseFloat(d[metric]) || 0)
  const max = Math.max(...values, 0.01)
  const min = Math.min(...values)
  const range = max - min || 1
  const w = 300, h = 80, pad = 10
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - 2 * pad)
    const y = pad + ((max - v) / range) * (h - 2 * pad)
    return `${x},${y}`
  })
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 80 }}>
      <polyline fill="none" stroke={color} strokeWidth="2" points={pts.join(' ')} />
      {pts.map((pt, i) => {
        const [x, y] = pt.split(',')
        return <circle key={i} cx={x} cy={y} r="3" fill={color} opacity={0.7} />
      })}
    </svg>
  )
}

// ─── Gráfico de linha interativo com tooltip ─────────────────────────────────
function LineChart({ daily, metrics, fmtFn }) {
  // Hooks SEMPRE no topo — nunca depois de return condicional
  const [hoverIdx, setHoverIdx] = useState(null)

  const COLORS = ['#FF6B35', '#4ECDC4', '#A8E6CF', '#FFD93D', '#C3B1E1', '#FF8B94']
  const W = 700, H = 200, PAD = { top: 16, right: 16, bottom: 32, left: 52 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  // Sem dados suficientes → mostra estado vazio
  if (!daily || daily.length < 2) {
    return (
      <div style={{ textAlign: 'center', padding: 24, color: '#555', fontSize: 13 }}>
        {!daily || daily.length === 0
          ? '⚠️ Sem dados diários — verifique se o MetaAPI.gs foi reimplantado no Apps Script'
          : 'Dados diários insuficientes para exibir gráfico (mínimo 2 dias)'}
      </div>
    )
  }

  const series = metrics.map((m, mi) => {
    const vals = daily.map(d => parseFloat(d[m.key]) || 0)
    const max = Math.max(...vals, 0.01)
    const min = Math.min(...vals, 0)
    const range = max - min || 1
    return { ...m, vals, max, min, range, color: COLORS[mi % COLORS.length] }
  })

  const primarySeries = series[0]
  const yTicks = 4
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
    const v = primarySeries.min + (primarySeries.range * i / yTicks)
    return { v, y: PAD.top + innerH - (i / yTicks) * innerH }
  })

  const getX = (i) => PAD.left + (i / (daily.length - 1)) * innerW
  const getY = (s, v) => PAD.top + innerH - ((v - s.min) / s.range) * innerH

  const fmtDate = (d) => {
    if (!d) return ''
    const parts = d.split('-')
    return `${parts[2]}/${parts[1]}`
  }

  // Mostra labels no eixo X dia a dia; se muitos dias, distribui ~10 labels uniformemente
  const MAX_X_LABELS = 10
  const xLabelStep = daily.length <= MAX_X_LABELS ? 1 : Math.ceil((daily.length - 1) / (MAX_X_LABELS - 1))
  const xLabels = daily.map((d, i) => ({ i, label: fmtDate(d.date) }))
    .filter((_, i) => i % xLabelStep === 0 || i === daily.length - 1)

  const handleMouseMove = (e) => {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const xRel = e.clientX - rect.left - (rect.width * PAD.left / W)
    const innerPxW = rect.width * innerW / W
    const idx = Math.round((xRel / innerPxW) * (daily.length - 1))
    setHoverIdx(Math.max(0, Math.min(daily.length - 1, idx)))
  }

  return (
    <div style={{ position: 'relative', userSelect: 'none' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', cursor: 'crosshair', display: 'block' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        {/* Grid horizontal */}
        {yLabels.map((yl, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={yl.y} x2={W - PAD.right} y2={yl.y}
              stroke="#1e1e1e" strokeWidth="1" />
            <text x={PAD.left - 6} y={yl.y + 4} textAnchor="end" fontSize="10" fill="#555">
              {fmtFn ? fmtFn(yl.v, primarySeries.format) : Math.round(yl.v)}
            </text>
          </g>
        ))}

        {/* Labels eixo X */}
        {xLabels.map(({ i, label }) => (
          <text key={i} x={getX(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="#555">
            {label}
          </text>
        ))}

        {/* Área preenchida + linha da primeira série */}
        {(() => {
          const s = series[0]
          const pts = daily.map((_, i) => `${getX(i)},${getY(s, s.vals[i])}`).join(' ')
          const areaPath = `M${getX(0)},${PAD.top + innerH} ` +
            daily.map((_, i) => `L${getX(i)},${getY(s, s.vals[i])}`).join(' ') +
            ` L${getX(daily.length - 1)},${PAD.top + innerH} Z`
          return (
            <>
              <path d={areaPath} fill={s.color} opacity="0.08" />
              <polyline fill="none" stroke={s.color} strokeWidth="2.5" points={pts} />
            </>
          )
        })()}

        {/* Linhas das demais séries (tracejado) */}
        {series.slice(1).map((s) => {
          const pts = daily.map((_, i) => `${getX(i)},${getY(s, s.vals[i])}`).join(' ')
          return (
            <polyline key={s.key} fill="none" stroke={s.color}
              strokeWidth="1.5" strokeDasharray="4,2" points={pts} />
          )
        })}

        {/* Linha vertical de hover */}
        {hoverIdx !== null && (
          <line
            x1={getX(hoverIdx)} y1={PAD.top}
            x2={getX(hoverIdx)} y2={PAD.top + innerH}
            stroke="#444" strokeWidth="1" strokeDasharray="3,3"
          />
        )}

        {/* Pontos no hover */}
        {hoverIdx !== null && series.map(s => (
          <circle key={s.key}
            cx={getX(hoverIdx)} cy={getY(s, s.vals[hoverIdx])}
            r="4" fill={s.color} stroke="#0a0a0a" strokeWidth="2"
          />
        ))}
      </svg>

      {/* Tooltip inline (acima do gráfico, posição fixa no topo) */}
      {hoverIdx !== null && (
        <div style={{
          position: 'absolute', top: 4, right: 8,
          background: '#141414', border: '0.5px solid #2a2a2a',
          borderRadius: 8, padding: '8px 12px', fontSize: 12,
          pointerEvents: 'none', zIndex: 10, minWidth: 150,
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
        }}>
          <div style={{ color: '#666', marginBottom: 6, fontSize: 11, fontWeight: 600 }}>
            {fmtDate(daily[hoverIdx]?.date)}
          </div>
          {series.map(s => (
            <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 3 }}>
              <span style={{ color: s.color }}>{s.label}</span>
              <span style={{ fontWeight: 600, color: '#fff' }}>
                {fmtFn ? fmtFn(s.vals[hoverIdx], s.format) : s.vals[hoverIdx]}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Legenda */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
        {series.map(s => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
            <div style={{ width: 16, height: 2.5, background: s.color, borderRadius: 2 }} />
            <span style={{ color: '#888' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Tab: Visão Geral (todas as contas) ─────────────────────────────────────
function OverviewTab({ period, customStart, customEnd, refreshKey }) {
  const { clients } = useApp()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [visibleCols, setVisibleCols] = useState(['spend', 'conversions', 'roas', 'ctr', 'leads'])

  const getDateRange = useCallback(() => {
    const today = new Date()
    const fmtD = d => d.toISOString().slice(0, 10)
    if (period === 'custom') return { start: customStart, end: customEnd }
    if (period === 'today') return { start: fmtD(today), end: fmtD(today) }
    if (period === 'month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
      return { start: fmtD(start), end: fmtD(today) }
    }
    const days = parseInt(period)
    const end = new Date(today)
    const start = new Date(today)
    start.setDate(start.getDate() - (days - 1))
    return { start: fmtD(start), end: fmtD(end) }
  }, [period, customStart, customEnd])

  const load = useCallback(async () => {
    const { start, end } = getDateRange()
    if (!start || !end) return
    setLoading(true)
    setError('')
    try {
      const res  = await fetch(`${SCRIPT_URL}?action=getAllAccountsMetrics&startDate=${start}&endDate=${end}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json)
    } catch (e) {
      setError('Erro: ' + e.message)
    }
    setLoading(false)
  }, [getDateRange])

  useEffect(() => { load() }, [load, refreshKey])

  // Mapeia accountName → cliente
  const findClient = (accountName) => {
    const norm = (s) => String(s || '').toLowerCase().trim()
    const needle = norm(accountName)
    return clients.find(c => {
      if (!c.criativoAccountId) return false
      const hay = norm(c.criativoAccountId)
      return hay === needle || hay.includes(needle) || needle.includes(hay)
    })
  }

  const toggleCol = (key) => {
    setVisibleCols(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 40, color: '#555' }}>
      <i className="ti ti-loader-2 ti-spin" style={{ fontSize: 24 }} />
      <div style={{ marginTop: 8, fontSize: 13 }}>Carregando visão geral...</div>
    </div>
  )

  if (error) return (
    <div style={{ background: 'rgba(226,75,74,0.1)', border: '0.5px solid var(--red)', borderRadius: 8, padding: 12, fontSize: 13, color: 'var(--red)', marginBottom: 16 }}>
      <i className="ti ti-alert-circle" style={{ marginRight: 6 }} />{error}
    </div>
  )

  if (!data) return null

  const accounts = data.accounts || []

  // Totalizadores
  const grand = accounts.reduce((acc, a) => {
    acc.spend       += parseFloat(a.spend)       || 0
    acc.impressions += parseFloat(a.impressions) || 0
    acc.clicks      += parseFloat(a.clicks)      || 0
    acc.leads       += parseFloat(a.leads)       || 0
    acc.purchases   += parseFloat(a.purchases)   || 0
    acc.conversions += parseFloat(a.conversions) || 0
    acc.messages    += parseFloat(a.messages)    || 0
    return acc
  }, { spend: 0, impressions: 0, clicks: 0, leads: 0, purchases: 0, conversions: 0, messages: 0 })
  grand.ctr = grand.impressions > 0 ? ((grand.clicks / grand.impressions) * 100).toFixed(2) : '0'
  grand.cpm = grand.impressions > 0 ? ((grand.spend  / grand.impressions) * 1000).toFixed(2) : '0'
  grand.roas = '—'

  const shownCols = OVERVIEW_COLS.filter(c => visibleCols.includes(c.key))

  return (
    <div>
      {/* Seletor de colunas */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>Colunas visíveis</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {OVERVIEW_COLS.map(col => (
            <button key={col.key} onClick={() => toggleCol(col.key)}
              style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer', border: 'none',
                background: visibleCols.includes(col.key) ? 'var(--orange)' : '#1a1a1a',
                color: visibleCols.includes(col.key) ? '#fff' : '#666',
              }}>
              {col.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div style={{ overflowX: 'auto', borderRadius: 10, border: '0.5px solid #2a2a2a' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#111', borderBottom: '0.5px solid #2a2a2a' }}>
              <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-dim)', fontWeight: 500, fontSize: 11 }}>Conta</th>
              {shownCols.map(col => (
                <th key={col.key} style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-dim)', fontWeight: 500, fontSize: 11, whiteSpace: 'nowrap' }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {accounts.map((account, idx) => {
              const client = findClient(account.accountName)
              return (
                <tr key={idx} style={{ borderBottom: '0.5px solid #1a1a1a', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#111'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontWeight: 500, color: 'var(--text)' }}>{client?.name || account.accountName}</div>
                    {client?.name && <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{account.accountName}</div>}
                  </td>
                  {shownCols.map(col => (
                    <td key={col.key} style={{ padding: '10px 14px', textAlign: 'right', color: col.key === 'spend' ? 'var(--orange)' : 'var(--text)', fontWeight: col.key === 'spend' ? 600 : 400 }}>
                      {fmt(account[col.key], col.format)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: '#111', borderTop: '0.5px solid #333' }}>
              <td style={{ padding: '10px 14px', fontWeight: 600, fontSize: 12, color: 'var(--text-dim)' }}>
                Total ({accounts.length} contas)
              </td>
              {shownCols.map(col => (
                <td key={col.key} style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: col.key === 'spend' ? 'var(--orange)' : 'var(--text)' }}>
                  {grand[col.key] !== undefined ? fmt(grand[col.key], col.format) : '—'}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {accounts.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#555', fontSize: 13 }}>
          Nenhum dado encontrado para o período selecionado.
        </div>
      )}
    </div>
  )
}

// ─── Tab: Por Cliente ────────────────────────────────────────────────────────
function ClientTab({ period, customStart, customEnd, refreshKey }) {
  const { clients } = useApp()
  const [selectedClientId, setSelectedClientId] = useState('')
  const [selectedMetrics, setSelectedMetrics]   = useState(['spend', 'impressions', 'clicks', 'ctr', 'roas'])
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [historyData, setHistoryData] = useState([])

  const clientsWithMeta = clients.filter(c => c.criativoAccountId && !c.cancelado)

  const getDateRange = useCallback(() => {
    const today = new Date()
    const fmtD = d => d.toISOString().slice(0, 10)
    if (period === 'custom') return { start: customStart, end: customEnd }
    if (period === 'today') return { start: fmtD(today), end: fmtD(today) }
    if (period === 'month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
      return { start: fmtD(start), end: fmtD(today) }
    }
    const days = parseInt(period)
    const end = new Date(today)
    const start = new Date(today)
    start.setDate(start.getDate() - (days - 1))
    return { start: fmtD(start), end: fmtD(end) }
  }, [period, customStart, customEnd])

  const loadMetrics = useCallback(async () => {
    if (!selectedClientId) return
    const client = clients.find(c => c.id === selectedClientId)
    if (!client?.criativoAccountId) return
    setLoading(true)
    setError('')
    const { start, end } = getDateRange()
    try {
      const res  = await fetch(`${SCRIPT_URL}?action=getMetrics&accountId=${encodeURIComponent(client.criativoAccountId)}&startDate=${start}&endDate=${end}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      // Preenche dias sem gasto com zero para o eixo X ser contínuo
      if (json.daily) json.daily = fillDailyGaps(json.daily, start, end)
      setData(json)
      const hRes  = await fetch(`${SCRIPT_URL}?action=getMetricsHistory&clientId=${selectedClientId}`)
      const hJson = await hRes.json()
      if (Array.isArray(hJson)) setHistoryData(hJson)
    } catch (e) {
      setError('Erro ao carregar métricas: ' + e.message)
    }
    setLoading(false)
  }, [selectedClientId, clients, getDateRange])

  useEffect(() => {
    if (selectedClientId) loadMetrics()
  }, [selectedClientId, period, customStart, customEnd, refreshKey])

  const toggleMetric = (key) => {
    setSelectedMetrics(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const totals = data?.totals || {}

  return (
    <div>
      {/* Seletor de cliente */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>Cliente</div>
        <select value={selectedClientId} onChange={e => { setSelectedClientId(e.target.value); setData(null) }}
          style={{ width: '100%', background: '#141414', border: '0.5px solid #2a2a2a', borderRadius: 8, padding: '8px 10px', color: '#fff', fontSize: 13, colorScheme: 'dark', cursor: 'pointer' }}>
          <option value="" style={{ background: '#141414', color: '#888' }}>Selecionar cliente...</option>
          {clientsWithMeta.map(c => (
            <option key={c.id} value={c.id} style={{ background: '#141414', color: '#fff' }}>
              {c.name} {c.clientType === 'ecommerce' ? '🛒' : c.clientType === 'lead' ? '📲' : ''}
            </option>
          ))}
        </select>
      </div>

      {!selectedClientId && (
        <div style={{ textAlign: 'center', padding: 40, color: '#555', fontSize: 14 }}>
          <i className="ti ti-chart-bar" style={{ fontSize: 32, display: 'block', marginBottom: 8 }} />
          Selecione um cliente para ver as métricas detalhadas
        </div>
      )}

      {selectedClientId && loading && (
        <div style={{ textAlign: 'center', padding: 40, color: '#555' }}>
          <i className="ti ti-loader-2 ti-spin" style={{ fontSize: 24 }} />
          <div style={{ marginTop: 8, fontSize: 13 }}>Carregando métricas...</div>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(226,75,74,0.1)', border: '0.5px solid var(--red)', borderRadius: 8, padding: 12, fontSize: 13, color: 'var(--red)', marginBottom: 16 }}>
          <i className="ti ti-alert-circle" style={{ marginRight: 6 }} />{error}
        </div>
      )}

      {selectedClientId && data && !loading && (
        <>
          {/* Seletor de métricas */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>Métricas exibidas</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {METRICS_META.map(m => (
                <button key={m.key} onClick={() => toggleMetric(m.key)}
                  style={{
                    padding: '4px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer', border: 'none',
                    background: selectedMetrics.includes(m.key) ? 'var(--orange)' : '#1a1a1a',
                    color: selectedMetrics.includes(m.key) ? '#fff' : '#666',
                    transition: 'all 0.15s'
                  }}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards de totais */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginBottom: 20 }}>
            {METRICS_META.filter(m => selectedMetrics.includes(m.key)).map(m => (
              <div key={m.key} style={{
                background: 'var(--bg2)', border: '0.5px solid #2a2a2a', borderRadius: 10, padding: '12px 14px'
              }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: m.key === 'spend' ? 'var(--orange)' : 'var(--text)' }}>
                  {totals[m.key] !== undefined ? fmt(totals[m.key], m.format) : '—'}
                </div>
                {m.unit && <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>{m.unit}</div>}
              </div>
            ))}
          </div>

          {/* ── Gráficos de linha (dados diários) ────────────────────────────── */}
          {data.daily && data.daily.length >= 2 && (() => {
            const chartMetrics = METRICS_META.filter(m => selectedMetrics.includes(m.key))
            if (chartMetrics.length === 0) return null
            // Agrupa em pares: até 2 métricas por gráfico
            const groups = []
            for (let i = 0; i < chartMetrics.length; i += 2) {
              groups.push(chartMetrics.slice(i, i + 2))
            }
            return (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Evolução diária
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {groups.map((group, gi) => (
                    <div key={gi} style={{ background: 'var(--bg2)', border: '0.5px solid #2a2a2a', borderRadius: 12, padding: '16px 18px' }}>
                      <LineChart daily={data.daily} metrics={group} fmtFn={fmt} />
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Info de linhas processadas */}
          {data.matchedRows > 0 && (
            <div style={{ fontSize: 11, color: '#555', marginBottom: 12 }}>
              {data.matchedRows.toLocaleString('pt-BR')} linhas processadas · {data.campaigns?.length || 0} campanhas
            </div>
          )}

          {/* Campanhas */}
          {data.insights && data.insights.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                Campanhas ({data.insights.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.insights.sort((a, b) => parseFloat(b.spend) - parseFloat(a.spend)).map(ins => (
                  <div key={ins.campaign_id} style={{
                    background: 'var(--bg2)', border: '0.5px solid #2a2a2a', borderRadius: 10, padding: '12px 16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, flex: 1, paddingRight: 16 }}>{ins.campaign_name}</div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--orange)' }}>{fmt(ins.spend, 'currency')}</div>
                        {parseFloat(ins.roas) > 0 && (
                          <div style={{ fontSize: 11, color: '#888' }}>ROAS {ins.roas}x</div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 6 }}>
                      {[
                        { label: 'Impressões', value: parseInt(ins.impressions || 0).toLocaleString('pt-BR') },
                        { label: 'Cliques',    value: parseInt(ins.clicks || 0).toLocaleString('pt-BR') },
                        { label: 'CTR',        value: `${parseFloat(ins.ctr || 0).toFixed(2)}%` },
                        { label: 'CPM',        value: `R$ ${parseFloat(ins.cpm || 0).toFixed(2)}` },
                        parseInt(ins.leads)     > 0 && { label: 'Leads',    value: ins.leads },
                        parseInt(ins.purchases) > 0 && { label: 'Compras',  value: ins.purchases },
                        parseInt(ins.messages)  > 0 && { label: 'Conversas',value: ins.messages },
                      ].filter(Boolean).map(stat => (
                        <div key={stat.label} style={{ background: '#111', borderRadius: 6, padding: '6px 8px' }}>
                          <div style={{ fontSize: 10, color: '#555' }}>{stat.label}</div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{stat.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Histórico */}
          {historyData.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                Histórico de investimento
              </div>
              <div style={{ background: 'var(--bg2)', border: '0.5px solid #2a2a2a', borderRadius: 10, padding: 16 }}>
                <MiniChart data={historyData} metric="spend" />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function MetricsTab() {
  const [activeTab, setActiveTab] = useState('overview')
  const [period, setPeriod]       = useState('7')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd]     = useState('')
  const [refreshKey, setRefreshKey]   = useState(0)

  const tabStyle = (active) => ({
    padding: '6px 18px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: active ? 600 : 400,
    border: 'none',
    cursor: 'pointer',
    background: active ? 'var(--orange)' : '#1a1a1a',
    color:      active ? '#fff'           : '#666',
    transition: 'all 0.15s',
  })

  return (
    <div style={{ padding: '20px 0' }}>
      {/* Header: abas + período */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={tabStyle(activeTab === 'overview')} onClick={() => setActiveTab('overview')}>
            <i className="ti ti-layout-grid" style={{ marginRight: 6 }} />Visão Geral
          </button>
          <button style={tabStyle(activeTab === 'client')} onClick={() => setActiveTab('client')}>
            <i className="ti ti-user" style={{ marginRight: 6 }} />Por Cliente
          </button>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <select value={period} onChange={e => setPeriod(e.target.value)}
            style={{ background: 'var(--bg2)', border: '0.5px solid #2a2a2a', borderRadius: 8, padding: '6px 10px', color: 'var(--text)', fontSize: 12 }}>
            {PERIOD_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            title="Atualizar dados"
            style={{
              background: '#1a1a1a', border: '0.5px solid #2a2a2a', borderRadius: 8,
              padding: '6px 10px', color: '#888', cursor: 'pointer', fontSize: 14,
              display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#2a2a2a'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.color = '#888' }}
          >
            <i className="ti ti-refresh" />
          </button>
        </div>
      </div>

      {/* Datas personalizadas */}
      {period === 'custom' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>Data início</div>
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
              style={{ width: '100%', background: 'var(--bg2)', border: '0.5px solid #2a2a2a', borderRadius: 8, padding: '8px 10px', color: 'var(--text)', fontSize: 13 }} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>Data fim</div>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
              style={{ width: '100%', background: 'var(--bg2)', border: '0.5px solid #2a2a2a', borderRadius: 8, padding: '8px 10px', color: 'var(--text)', fontSize: 13 }} />
          </div>
        </div>
      )}

      {/* Conteúdo da aba */}
      {activeTab === 'overview'
        ? <OverviewTab period={period} customStart={customStart} customEnd={customEnd} refreshKey={refreshKey} />
        : <ClientTab  period={period} customStart={customStart} customEnd={customEnd} refreshKey={refreshKey} />
      }
    </div>
  )
}
