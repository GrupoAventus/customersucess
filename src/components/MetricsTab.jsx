import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../lib/AppContext'

const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL

// Métricas disponíveis por tipo de conta
const METRICS_META = [
  { key: 'spend', label: 'Investimento (R$)', format: 'currency' },
  { key: 'impressions', label: 'Impressões', format: 'number' },
  { key: 'reach', label: 'Alcance', format: 'number' },
  { key: 'clicks', label: 'Cliques', format: 'number' },
  { key: 'ctr', label: 'CTR (%)', format: 'percent' },
  { key: 'cpm', label: 'CPM (R$)', format: 'currency' },
  { key: 'cpc', label: 'CPC (R$)', format: 'currency' },
  { key: 'leads', label: 'Leads', format: 'number' },
  { key: 'messages', label: 'Conversas iniciadas', format: 'number' },
  { key: 'purchases', label: 'Compras', format: 'number' },
  { key: 'roas', label: 'ROAS', format: 'decimal' },
  { key: 'cpa', label: 'CPA (R$)', format: 'currency' },
]

const PERIOD_OPTIONS = [
  { value: '7', label: 'Últimos 7 dias' },
  { value: '14', label: 'Últimos 14 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: 'month', label: 'Este mês' },
  { value: 'custom', label: 'Personalizado' },
]

function fmt(value, format) {
  const n = parseFloat(value) || 0
  if (format === 'currency') return `R$ ${n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
  if (format === 'percent') return `${n.toFixed(2)}%`
  if (format === 'decimal') return n.toFixed(2)
  return n.toLocaleString('pt-BR')
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

export default function MetricsTab() {
  const { clients } = useApp()
  const [selectedClientId, setSelectedClientId] = useState('')
  const [period, setPeriod] = useState('7')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [selectedMetrics, setSelectedMetrics] = useState(['spend', 'impressions', 'clicks', 'ctr'])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [historyData, setHistoryData] = useState([])

  // Clientes com conta Criativivo
  const clientsWithCriativivo = clients.filter(c => c.criativoAccountId && !c.cancelado)

  const getDateRange = useCallback(() => {
    const today = new Date()
    const fmt = d => d.toISOString().slice(0, 10)
    if (period === 'custom') return { start: customStart, end: customEnd }
    if (period === 'month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
      return { start: fmt(start), end: fmt(today) }
    }
    const days = parseInt(period)
    const start = new Date(today)
    start.setDate(start.getDate() - days)
    return { start: fmt(start), end: fmt(today) }
  }, [period, customStart, customEnd])

  const loadMetrics = useCallback(async () => {
    if (!selectedClientId) return
    const client = clients.find(c => c.id === selectedClientId)
    if (!client?.criativoAccountId) return
    setLoading(true)
    setError('')
    const { start, end } = getDateRange()
    try {
      const res = await fetch(`${SCRIPT_URL}?action=getMetrics&accountId=${client.criativoAccountId}&startDate=${start}&endDate=${end}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json)
      // Carregar histórico
      const hRes = await fetch(`${SCRIPT_URL}?action=getMetricsHistory&clientId=${selectedClientId}`)
      const hJson = await hRes.json()
      if (Array.isArray(hJson)) setHistoryData(hJson)
    } catch (e) {
      setError('Erro ao carregar métricas: ' + e.message)
    }
    setLoading(false)
  }, [selectedClientId, clients, getDateRange])

  useEffect(() => {
    if (selectedClientId) loadMetrics()
  }, [selectedClientId, period])

  const toggleMetric = (key) => {
    setSelectedMetrics(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const selectedClient = clients.find(c => c.id === selectedClientId)
  const allMetrics = METRICS_META

  // Totais vêm prontos do backend (tempo real via Criativivo)
  const totals = data?.totals || {}

  return (
    <div style={{ padding: '20px 0' }}>
      {/* Seletor de conta */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>Cliente</div>
          <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)}
            style={{ width: '100%', background: 'var(--bg2)', border: '0.5px solid #2a2a2a', borderRadius: 8, padding: '8px 10px', color: 'var(--text)', fontSize: 13 }}>
            <option value="">Selecionar cliente...</option>
            {clientsWithCriativivo.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} {c.clientType === 'ecommerce' ? '🛒' : c.clientType === 'lead' ? '📲' : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>Período</div>
          <select value={period} onChange={e => setPeriod(e.target.value)}
            style={{ width: '100%', background: 'var(--bg2)', border: '0.5px solid #2a2a2a', borderRadius: 8, padding: '8px 10px', color: 'var(--text)', fontSize: 13 }}>
            {PERIOD_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
      </div>

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

      {!selectedClientId && (
        <div style={{ textAlign: 'center', padding: 40, color: '#555', fontSize: 14 }}>
          <i className="ti ti-chart-bar" style={{ fontSize: 32, display: 'block', marginBottom: 8 }} />
          Selecione um cliente para ver as métricas
          {clientsWithCriativivo.length === 0 && (
            <div style={{ fontSize: 12, marginTop: 8, color: '#444' }}>
              Nenhum cliente tem conta Criativivo vinculada ainda.<br/>Edite um cliente e selecione a conta.
            </div>
          )}
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
              {allMetrics.map(m => (
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
            {allMetrics.filter(m => selectedMetrics.includes(m.key)).map(m => (
              <div key={m.key} style={{
                background: 'var(--bg2)', border: '0.5px solid #2a2a2a', borderRadius: 10, padding: '12px 14px'
              }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>
                  {totals[m.key] !== undefined ? fmt(totals[m.key], m.format) : '—'}
                </div>
              </div>
            ))}
          </div>

          {/* Campanhas detalhadas */}
          {data.campaigns && data.campaigns.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                Campanhas ativas ({data.campaigns.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.campaigns.map(camp => {
                  const ins = data.insights?.find(i => i.campaign_id === camp.id) || {}
                  const leads = ins.actions?.find(a => a.action_type === 'lead')?.value || 0
                  const msgs = ins.actions?.find(a => a.action_type === 'onsite_conversion.messaging_conversation_started_7d')?.value || 0
                  return (
                    <div key={camp.id} style={{
                      background: 'var(--bg2)', border: '0.5px solid #2a2a2a', borderRadius: 10, padding: '12px 16px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{camp.name}</div>
                          <div style={{ fontSize: 11, color: camp.status === 'ACTIVE' ? 'var(--green)' : '#666', marginTop: 2 }}>
                            {camp.status === 'ACTIVE' ? '● Ativa' : '○ Pausada'}
                            {camp.daily_budget_reais && <span style={{ color: '#666', marginLeft: 8 }}>R$ {camp.daily_budget_reais}/dia</span>}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--orange)' }}>
                            {fmt(ins.spend || 0, 'currency')}
                          </div>
                          <div style={{ fontSize: 11, color: '#666' }}>investido</div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                        {[
                          { label: 'Impressões', value: parseInt(ins.impressions || 0).toLocaleString('pt-BR') },
                          { label: 'Cliques', value: parseInt(ins.clicks || 0).toLocaleString('pt-BR') },
                          { label: 'CTR', value: `${parseFloat(ins.ctr || 0).toFixed(2)}%` },
                          { label: leads > 0 ? 'Leads' : 'Conversas', value: leads > 0 ? leads : msgs },
                        ].map(stat => (
                          <div key={stat.label} style={{ background: '#111', borderRadius: 6, padding: '6px 8px' }}>
                            <div style={{ fontSize: 10, color: '#555' }}>{stat.label}</div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{stat.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
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
