import { useState } from 'react'
import { useApp } from '../lib/AppContext'
import { saveAiInsight, fetchMetrics } from '../lib/sheets'

const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL || ''
const CLAUDE_API_PROXY = import.meta.env.VITE_CLAUDE_PROXY_URL || ''

// Período padrão: últimos 30 dias
function getLast30Days() {
  const end = new Date()
  const start = new Date(end.getTime() - 30 * 86400000)
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

function formatDate(isoStr) {
  if (!isoStr) return '—'
  try {
    return new Date(isoStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return isoStr }
}

export default function AiInsightPanel({ client }) {
  const { getClientAiInsight, aiInsights, setAiInsights } = useApp()
  const latest = getClientAiInsight ? getClientAiInsight(client.id) : null

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(false)

  // Se o cliente não tem conta Criativivo, não exibe o painel
  if (!client.criativoAccountId) return null

  const analyze = async () => {
    setLoading(true)
    setError('')
    try {
      const { startDate, endDate } = getLast30Days()

      // 1. Busca métricas via Apps Script → Criativivo
      const metricsData = await fetchMetrics(client.criativoAccountId, startDate, endDate)

      if (metricsData.error) {
        throw new Error('Erro ao buscar métricas: ' + metricsData.error)
      }

      const insights = metricsData.insights || []
      const campaigns = metricsData.campaigns || []

      // 2. Resumo numérico para enviar ao Claude
      const spend = insights.reduce((s, i) => s + (parseFloat(i.spend) || 0), 0)
      const impressions = insights.reduce((s, i) => s + (parseInt(i.impressions) || 0), 0)
      const clicks = insights.reduce((s, i) => s + (parseInt(i.clicks) || 0), 0)
      const reach = insights.reduce((s, i) => s + (parseInt(i.reach) || 0), 0)
      const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0'
      const cpm = impressions > 0 ? ((spend / impressions) * 1000).toFixed(2) : '0'
      const cpc = clicks > 0 ? (spend / clicks).toFixed(2) : '0'

      const clientType = client.clientType || 'lead'
      let extraMetrics = ''

      if (clientType === 'ecommerce') {
        const purchases = insights.reduce((s, i) => {
          const acts = i.actions || []
          const p = acts.find(a => a.action_type === 'offsite_conversion.fb_pixel_purchase')
          return s + (p ? parseFloat(p.value) : 0)
        }, 0)
        const revenue = insights.reduce((s, i) => {
          const vals = i.action_values || []
          const r = vals.find(a => a.action_type === 'offsite_conversion.fb_pixel_purchase')
          return s + (r ? parseFloat(r.value) : 0)
        }, 0)
        const roas = spend > 0 ? (revenue / spend).toFixed(2) : '0'
        extraMetrics = `\n- Compras: ${purchases}\n- Receita: R$${revenue.toFixed(2)}\n- ROAS: ${roas}x`
      } else {
        const leads = insights.reduce((s, i) => {
          const acts = i.actions || []
          const l = acts.find(a => a.action_type === 'lead' || a.action_type === 'onsite_conversion.messaging_conversation_started_7d')
          return s + (l ? parseInt(l.value) : 0)
        }, 0)
        const cpl = leads > 0 ? (spend / leads).toFixed(2) : '0'
        extraMetrics = `\n- Leads/Mensagens: ${leads}\n- CPL: R$${cpl}`
      }

      const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length
      const totalCampaigns = campaigns.length

      const prompt = `Você é um especialista em marketing digital e tráfego pago. Analise os dados de desempenho de campanha Meta Ads do cliente "${client.name}" no período de ${startDate} a ${endDate}.

DADOS DO PERÍODO:
- Investimento total: R$${spend.toFixed(2)}
- Alcance: ${reach.toLocaleString('pt-BR')} pessoas
- Impressões: ${impressions.toLocaleString('pt-BR')}
- Cliques: ${clicks.toLocaleString('pt-BR')}
- CTR: ${ctr}%
- CPM: R$${cpm}
- CPC: R$${cpc}${extraMetrics}
- Campanhas ativas: ${activeCampaigns} de ${totalCampaigns}
- Tipo de negócio: ${clientType === 'ecommerce' ? 'E-commerce (foco em vendas/ROAS)' : 'Geração de leads/conversas'}

Com base nesses dados, forneça uma análise OBJETIVA e ACIONÁVEL em português brasileiro com:

1. **Diagnóstico geral** (1-2 frases sobre o desempenho)
2. **Pontos positivos** (o que está funcionando bem)
3. **Pontos de atenção** (o que precisa melhorar)
4. **Recomendações práticas** (3 ações concretas para os próximos 7-14 dias)

Seja direto, use linguagem simples e foque em insights práticos para a equipe de tráfego. Máximo de 300 palavras.`

      // 3. Chama Claude API via proxy (o proxy deve estar configurado no backend para não expor a chave)
      let insightText = ''

      if (CLAUDE_API_PROXY) {
        const claudeResp = await fetch(CLAUDE_API_PROXY, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, clientId: client.id, clientName: client.name })
        })
        const claudeData = await claudeResp.json()
        insightText = claudeData.content || claudeData.text || claudeData.insight || ''
      } else {
        // Fallback: análise local baseada nos dados
        insightText = generateLocalInsight(client, { spend, impressions, clicks, reach, ctr, cpm, cpc, clientType, campaigns, insights })
      }

      if (!insightText) throw new Error('Não foi possível gerar o insight')

      // 4. Salva no Apps Script → aba ai_insights
      const period = `${startDate} a ${endDate}`
      await saveAiInsight(client.id, insightText, period)

      // 5. Atualiza contexto local
      if (setAiInsights) {
        const newInsight = {
          id: 'local_' + Date.now(),
          clientId: client.id,
          period,
          insight: insightText,
          createdAt: new Date().toISOString()
        }
        setAiInsights(prev => [...(prev || []), newInsight])
      }

      setExpanded(true)
    } catch (err) {
      setError(err.message || 'Erro ao analisar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 11, color: 'var(--orange)', letterSpacing: 0.5, textTransform: 'uppercase',
        marginBottom: 8, paddingBottom: 6, borderBottom: '0.5px solid #1f1f1f'
      }}>
        <span><i className="ti ti-brain" style={{ marginRight: 4 }} />IA — Análise preditiva</span>
        <button onClick={analyze} disabled={loading} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 500,
          border: '0.5px solid var(--orange)', background: loading ? '#1a1a1a' : 'var(--orange-dim)',
          color: loading ? '#555' : 'var(--orange)', cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s'
        }}>
          {loading
            ? <><i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite' }} /> Analisando...</>
            : <><span>🔮</span> Analisar</>
          }
        </button>
      </div>

      {error && (
        <div style={{ background: '#1a0505', border: '0.5px solid #3a1212', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#ff6b6b', marginBottom: 8 }}>
          <i className="ti ti-alert-circle" style={{ marginRight: 6 }} />{error}
        </div>
      )}

      {latest ? (
        <div style={{ background: '#0d1117', border: '0.5px solid #1e3a5f', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: '#4a7fa5' }}>
              <i className="ti ti-sparkles" style={{ marginRight: 4 }} />Último insight · {formatDate(latest.createdAt)}
            </div>
            <button onClick={() => setExpanded(v => !v)} style={{ background: 'none', border: 'none', color: '#4a7fa5', fontSize: 11, cursor: 'pointer' }}>
              {expanded ? 'Recolher' : 'Expandir'}
            </button>
          </div>

          {latest.period && (
            <div style={{ fontSize: 10, color: '#2a5a7a', marginBottom: 8 }}>Período: {latest.period}</div>
          )}

          {expanded ? (
            <div style={{ fontSize: 13, color: '#c9d8e8', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {latest.insight}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: '#c9d8e8', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
              {latest.insight}
            </div>
          )}
        </div>
      ) : (
        <div style={{ fontSize: 13, color: '#333', padding: '8px 0' }}>
          Nenhuma análise ainda. Clique em <strong style={{ color: 'var(--orange)' }}>🔮 Analisar</strong> para gerar um insight com IA.
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}

// Análise local de fallback quando VITE_CLAUDE_PROXY_URL não está configurado
function generateLocalInsight(client, { spend, impressions, clicks, reach, ctr, cpm, cpc, clientType, campaigns, insights }) {
  const lines = []
  const ctrNum = parseFloat(ctr)
  const cpmNum = parseFloat(cpm)
  const cpcNum = parseFloat(cpc)
  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length

  // Diagnóstico
  if (spend === 0) {
    return `Sem dados de investimento no período. Verifique se as campanhas estão ativas e se a conta Criativivo (${client.criativoAccountId}) está corretamente vinculada.`
  }

  lines.push('**Diagnóstico geral**')
  if (ctrNum >= 1.5) lines.push(`CTR de ${ctr}% está acima da média — anúncios com boa relevância.`)
  else if (ctrNum >= 0.8) lines.push(`CTR de ${ctr}% está na média do mercado — há espaço para otimização dos criativos.`)
  else lines.push(`CTR de ${ctr}% está abaixo da média — criativos precisam de revisão urgente.`)

  lines.push('\n**Pontos positivos**')
  if (reach > 10000) lines.push(`- Alcance expressivo: ${reach.toLocaleString('pt-BR')} pessoas impactadas`)
  if (activeCampaigns > 0) lines.push(`- ${activeCampaigns} campanha${activeCampaigns > 1 ? 's' : ''} ativa${activeCampaigns > 1 ? 's' : ''} em execução`)
  if (ctrNum >= 1.0) lines.push(`- CTR acima de 1% — audiência bem segmentada`)

  lines.push('\n**Pontos de atenção**')
  if (cpmNum > 30) lines.push(`- CPM de R$${cpm} está elevado — considere expandir o público ou testar novos posicionamentos`)
  if (ctrNum < 0.8) lines.push(`- CTR baixo — teste novos criativos (vídeo vs imagem) e revise o público-alvo`)
  if (spend < 500 && activeCampaigns > 0) lines.push(`- Investimento mensal baixo — pode limitar o aprendizado do algoritmo`)

  lines.push('\n**Recomendações práticas**')
  lines.push(`1. Revise os ${Math.min(3, campaigns.length)} criativos com menor CTR e pause os que estão abaixo de 0,5%`)

  if (clientType === 'ecommerce') {
    lines.push('2. Configure campanhas de remarketing para quem visitou o site nos últimos 30 dias')
    lines.push('3. Teste lookalike audiences baseadas nos compradores existentes para escalar o ROAS')
  } else {
    lines.push('2. Crie um público personalizado com os leads dos últimos 60 dias para otimizar CPL')
    lines.push('3. Teste anúncios de formulário instantâneo (Lead Ads) para reduzir atrito na conversão')
  }

  return lines.join('\n')
}
