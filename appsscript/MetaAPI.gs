// ============================================================
// MetaAPI.gs — Integração direta com a Meta Marketing API
// Substitui leitura do Detrics (Google Sheets) por chamadas
// diretas à API do Meta, retornando dados em <2 segundos.
// ============================================================

var META_TOKEN = PropertiesService.getScriptProperties().getProperty('META_TOKEN');
var META_API_VERSION = 'v21.0';
var META_API_BASE    = 'https://graph.facebook.com/' + META_API_VERSION;

// Campos de insights que queremos buscar
var META_INSIGHT_FIELDS = [
  'spend',
  'impressions',
  'reach',
  'clicks',
  'inline_link_clicks',
  'ctr',
  'cpm',
  'cpc',
  'frequency',
  'actions',        // leads, purchases, mensagens etc.
  'action_values',  // valor de compras (ROAS)
  'website_purchase_roas',
  'purchase_roas',
  'campaign_name',
  'campaign_id'
].join(',');

// ─── Helpers ─────────────────────────────────────────────────

function metaGet_(url) {
  var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  var json = JSON.parse(res.getContentText());
  if (json.error) throw new Error('Meta API: ' + json.error.message + ' (código ' + json.error.code + ')');
  return json;
}

// Soma de uma action pelo tipo (ex: 'lead', 'purchase', 'onsite_conversion.messaging_conversation_started_7d')
function sumAction_(actions, type) {
  if (!actions) return 0;
  var total = 0;
  actions.forEach(function(a) {
    if (a.action_type === type) total += parseFloat(a.value) || 0;
  });
  return total;
}

// Converte array de insights da Meta em objeto com nossas métricas
function parseInsight_(ins) {
  var actions      = ins.actions || [];
  var actionValues = ins.action_values || [];

  var leads     = sumAction_(actions, 'lead') +
                  sumAction_(actions, 'offsite_conversion.fb_pixel_lead') +
                  sumAction_(actions, 'onsite_conversion.lead_grouped');
  var purchases = sumAction_(actions, 'purchase') +
                  sumAction_(actions, 'offsite_conversion.fb_pixel_purchase');
  var messages  = sumAction_(actions, 'onsite_conversion.messaging_conversation_started_7d') +
                  sumAction_(actions, 'onsite_conversion.total_messaging_connection');
  var lpv       = sumAction_(actions, 'landing_page_view');

  var purchaseValue = sumAction_(actionValues, 'purchase') +
                      sumAction_(actionValues, 'offsite_conversion.fb_pixel_purchase');

  var spend = parseFloat(ins.spend) || 0;
  var roas  = 0;
  if (ins.website_purchase_roas && ins.website_purchase_roas.length > 0) {
    roas = parseFloat(ins.website_purchase_roas[0].value) || 0;
  } else if (ins.purchase_roas && ins.purchase_roas.length > 0) {
    roas = parseFloat(ins.purchase_roas[0].value) || 0;
  } else if (spend > 0 && purchaseValue > 0) {
    roas = purchaseValue / spend;
  }

  var impressions = parseFloat(ins.impressions) || 0;
  var clicks      = parseFloat(ins.clicks)      || 0;
  var linkClicks  = parseFloat(ins.inline_link_clicks) || 0;
  var reach       = parseFloat(ins.reach)       || 0;
  var frequency   = parseFloat(ins.frequency)   || 0;

  var ctr = impressions > 0 ? (clicks / impressions * 100) : parseFloat(ins.ctr) || 0;
  var cpm = impressions > 0 ? (spend / impressions * 1000) : parseFloat(ins.cpm) || 0;
  var cpc = clicks > 0      ? (spend / clicks)             : parseFloat(ins.cpc) || 0;
  var cpa = (leads + purchases) > 0 ? spend / (leads + purchases) : 0;

  return {
    spend:         spend.toFixed(2),
    impressions:   Math.round(impressions),
    clicks:        Math.round(clicks),
    linkClicks:    Math.round(linkClicks),
    reach:         Math.round(reach),
    frequency:     frequency.toFixed(2),
    lpv:           Math.round(lpv),
    leads:         Math.round(leads),
    purchases:     Math.round(purchases),
    messages:      Math.round(messages),
    purchaseValue: purchaseValue.toFixed(2),
    roas:          roas.toFixed(2),
    ctr:           ctr.toFixed(2),
    cpm:           cpm.toFixed(2),
    cpc:           cpc.toFixed(2),
    cpa:           cpa.toFixed(2)
  };
}

// Busca todas as páginas de um endpoint paginado da Meta API
function fetchAllPages_(url) {
  var results = [];
  var nextUrl = url;
  var maxPages = 20; // segurança
  var page = 0;
  while (nextUrl && page < maxPages) {
    var json = metaGet_(nextUrl);
    if (json.data) results = results.concat(json.data);
    nextUrl = (json.paging && json.paging.next) ? json.paging.next : null;
    page++;
  }
  return results;
}

// ─── getMetricsMeta ──────────────────────────────────────────
// Equivalente ao getMetrics() do Detrics, mas via Meta API.
// accountId = ID numérico da conta (ex: "act_123456789")
function getMetricsMeta(accountId, startDate, endDate) {
  if (!accountId) return { error: 'accountId required' };
  if (!META_TOKEN) return { error: 'META_TOKEN não configurado. Vá em Apps Script > Configurações > Propriedades do script e adicione META_TOKEN.' };

  try {
    var actId = accountId.replace(/^act_/i, '');
    var acctParam = 'act_' + actId;

    // 1. Insights totais da conta no período (nível campanha)
    var insightsUrl = META_API_BASE + '/' + acctParam + '/insights'
      + '?level=campaign'
      + '&fields=' + encodeURIComponent(META_INSIGHT_FIELDS)
      + '&time_range=' + encodeURIComponent(JSON.stringify({ since: startDate, until: endDate }))
      + '&limit=100'
      + '&access_token=' + META_TOKEN;

    var insightsData = fetchAllPages_(insightsUrl);

    // 2. Agrega por campanha
    var campaigns = {};
    var grandTotals = {
      spend: 0, impressions: 0, clicks: 0, linkClicks: 0,
      reach: 0, frequency: 0, lpv: 0, leads: 0, purchases: 0,
      messages: 0, purchaseValue: 0,
      roasSum: 0, roasCount: 0, freqSum: 0, freqCount: 0
    };

    insightsData.forEach(function(ins) {
      var m = parseInsight_(ins);
      var campId   = ins.campaign_id   || '';
      var campName = ins.campaign_name || '(sem nome)';

      if (!campaigns[campId]) {
        campaigns[campId] = {
          id: campId, name: campName,
          spend: 0, impressions: 0, clicks: 0, linkClicks: 0,
          reach: 0, lpv: 0, leads: 0, purchases: 0, messages: 0,
          purchaseValue: 0, roasSum: 0, roasCount: 0
        };
      }
      var c = campaigns[campId];
      var spend = parseFloat(m.spend) || 0;
      var roas  = parseFloat(m.roas)  || 0;

      c.spend        += spend;
      c.impressions  += parseFloat(m.impressions)  || 0;
      c.clicks       += parseFloat(m.clicks)       || 0;
      c.linkClicks   += parseFloat(m.linkClicks)   || 0;
      c.reach        += parseFloat(m.reach)        || 0;
      c.lpv          += parseFloat(m.lpv)          || 0;
      c.leads        += parseFloat(m.leads)        || 0;
      c.purchases    += parseFloat(m.purchases)    || 0;
      c.messages     += parseFloat(m.messages)     || 0;
      c.purchaseValue += parseFloat(m.purchaseValue) || 0;
      if (roas > 0 && spend > 0) { c.roasSum += roas * spend; c.roasCount += spend; }

      grandTotals.spend        += spend;
      grandTotals.impressions  += parseFloat(m.impressions)  || 0;
      grandTotals.clicks       += parseFloat(m.clicks)       || 0;
      grandTotals.linkClicks   += parseFloat(m.linkClicks)   || 0;
      grandTotals.reach        += parseFloat(m.reach)        || 0;
      grandTotals.lpv          += parseFloat(m.lpv)          || 0;
      grandTotals.leads        += parseFloat(m.leads)        || 0;
      grandTotals.purchases    += parseFloat(m.purchases)    || 0;
      grandTotals.messages     += parseFloat(m.messages)     || 0;
      grandTotals.purchaseValue += parseFloat(m.purchaseValue) || 0;
      if (roas > 0 && spend > 0) { grandTotals.roasSum += roas * spend; grandTotals.roasCount += spend; }
      var freq = parseFloat(m.frequency) || 0;
      if (freq > 0) { grandTotals.freqSum += freq; grandTotals.freqCount++; }
    });

    // 3. Monta insights por campanha para retorno
    var campList = Object.keys(campaigns).map(function(id) { return campaigns[id]; });
    campList.sort(function(a, b) { return b.spend - a.spend; });

    var aggregatedInsights = campList.map(function(c) {
      var impr = c.impressions;
      var ctr  = impr > 0 ? (c.clicks / impr * 100).toFixed(2) : '0';
      var cpm  = impr > 0 ? (c.spend / impr * 1000).toFixed(2) : '0';
      var cpc  = c.clicks > 0 ? (c.spend / c.clicks).toFixed(2) : '0';
      var roas = c.roasCount > 0 ? (c.roasSum / c.roasCount).toFixed(2) : '0';
      var cpa  = (c.leads + c.purchases) > 0 ? (c.spend / (c.leads + c.purchases)).toFixed(2) : '0';
      return {
        campaign_id:   c.id,
        campaign_name: c.name,
        spend:         c.spend.toFixed(2),
        impressions:   Math.round(c.impressions),
        clicks:        Math.round(c.clicks),
        linkClicks:    Math.round(c.linkClicks),
        reach:         Math.round(c.reach),
        lpv:           Math.round(c.lpv),
        leads:         Math.round(c.leads),
        purchases:     Math.round(c.purchases),
        messages:      Math.round(c.messages),
        purchaseValue: c.purchaseValue.toFixed(2),
        ctr: ctr, cpm: cpm, cpc: cpc, roas: roas, cpa: cpa
      };
    });

    // 4. Totais globais
    var gt = grandTotals;
    var gtImpr = gt.impressions;
    var gtCtr  = gtImpr > 0 ? (gt.clicks / gtImpr * 100).toFixed(2) : '0';
    var gtCpm  = gtImpr > 0 ? (gt.spend / gtImpr * 1000).toFixed(2) : '0';
    var gtCpc  = gt.clicks > 0 ? (gt.spend / gt.clicks).toFixed(2) : '0';
    var gtRoas = gt.roasCount > 0 ? (gt.roasSum / gt.roasCount).toFixed(2) : '0';
    var gtCpa  = (gt.leads + gt.purchases) > 0 ? (gt.spend / (gt.leads + gt.purchases)).toFixed(2) : '0';
    var gtFreq = gt.freqCount > 0 ? (gt.freqSum / gt.freqCount).toFixed(2) : '0';

    // 5. Breakdown diário (time_increment=1) — para gráficos
    var dailyUrl = META_API_BASE + '/' + acctParam + '/insights'
      + '?level=account'
      + '&fields=spend,impressions,clicks,inline_link_clicks,reach,actions,action_values,website_purchase_roas,purchase_roas'
      + '&time_increment=1'
      + '&time_range=' + encodeURIComponent(JSON.stringify({ since: startDate, until: endDate }))
      + '&limit=100'
      + '&access_token=' + META_TOKEN;

    var dailyRaw = [];
    try { dailyRaw = fetchAllPages_(dailyUrl); } catch(e) { /* falha silenciosa, gráfico fica vazio */ }

    var daily = dailyRaw.map(function(ins) {
      var m = parseInsight_(ins);
      return {
        date:         ins.date_start || '',
        spend:        parseFloat(m.spend)        || 0,
        impressions:  parseFloat(m.impressions)  || 0,
        clicks:       parseFloat(m.clicks)       || 0,
        linkClicks:   parseFloat(m.linkClicks)   || 0,
        reach:        parseFloat(m.reach)        || 0,
        leads:        parseFloat(m.leads)        || 0,
        purchases:    parseFloat(m.purchases)    || 0,
        messages:     parseFloat(m.messages)     || 0,
        ctr:          parseFloat(m.ctr)          || 0,
        cpm:          parseFloat(m.cpm)          || 0,
        cpc:          parseFloat(m.cpc)          || 0,
        roas:         parseFloat(m.roas)         || 0,
        cpa:          parseFloat(m.cpa)          || 0
      };
    });
    daily.sort(function(a, b) { return a.date < b.date ? -1 : 1; });

    return {
      campaigns:  campList.map(function(c) { return { id: c.id, name: c.name }; }),
      insights:   aggregatedInsights,
      daily:      daily,
      totals: {
        spend:         gt.spend.toFixed(2),
        impressions:   Math.round(gt.impressions),
        clicks:        Math.round(gt.clicks),
        linkClicks:    Math.round(gt.linkClicks),
        reach:         Math.round(gt.reach),
        frequency:     gtFreq,
        lpv:           Math.round(gt.lpv),
        leads:         Math.round(gt.leads),
        purchases:     Math.round(gt.purchases),
        messages:      Math.round(gt.messages),
        purchaseValue: gt.purchaseValue.toFixed(2),
        roas: gtRoas, ctr: gtCtr, cpm: gtCpm, cpc: gtCpc, cpa: gtCpa
      },
      period: { start: startDate, end: endDate },
      source: 'meta_api'
    };

  } catch(err) {
    return { error: 'Erro Meta API: ' + err.message };
  }
}

// ─── getAllAccountsMetricsMeta ────────────────────────────────
// Equivalente ao getAllAccountsMetrics() mas via Meta API.
// Recebe lista de ad_account_ids dos clientes cadastrados.
function getAllAccountsMetricsMeta(startDate, endDate) {
  if (!META_TOKEN) return { error: 'META_TOKEN não configurado.' };

  try {
    // Busca clientes cadastrados com criativoAccountId
    var clientsData = getClients();
    var clients = (clientsData.clients || clientsData || []).filter(function(c) {
      return c.criativoAccountId && !c.cancelado;
    });

    if (clients.length === 0) return { accounts: [], period: { start: startDate, end: endDate }, source: 'meta_api' };

    var accounts = [];

    clients.forEach(function(client) {
      try {
        var actId    = String(client.criativoAccountId).replace(/^act_/i, '');
        var acctParam = 'act_' + actId;

        var url = META_API_BASE + '/' + acctParam + '/insights'
          + '?level=account'
          + '&fields=' + encodeURIComponent(META_INSIGHT_FIELDS)
          + '&time_range=' + encodeURIComponent(JSON.stringify({ since: startDate, until: endDate }))
          + '&access_token=' + META_TOKEN;

        var data = fetchAllPages_(url);
        if (data.length === 0) {
          accounts.push({
            accountName: client.name || client.criativoAccountId,
            clientId:    client.id || '',
            spend: '0', impressions: 0, clicks: 0, linkClicks: 0,
            reach: 0, leads: 0, purchases: 0, conversions: 0,
            messages: 0, roas: '0', ctr: '0', cpm: '0', cpc: '0', cpa: '0'
          });
          return;
        }

        // Agrega todas as linhas (pode vir mais de uma se houver paginação por campanha)
        var totals = {
          spend: 0, impressions: 0, clicks: 0, linkClicks: 0,
          reach: 0, lpv: 0, leads: 0, purchases: 0, messages: 0,
          purchaseValue: 0, roasSum: 0, roasCount: 0
        };
        data.forEach(function(ins) {
          var m = parseInsight_(ins);
          var spend = parseFloat(m.spend) || 0;
          var roas  = parseFloat(m.roas)  || 0;
          totals.spend        += spend;
          totals.impressions  += parseFloat(m.impressions)  || 0;
          totals.clicks       += parseFloat(m.clicks)       || 0;
          totals.linkClicks   += parseFloat(m.linkClicks)   || 0;
          totals.reach        += parseFloat(m.reach)        || 0;
          totals.leads        += parseFloat(m.leads)        || 0;
          totals.purchases    += parseFloat(m.purchases)    || 0;
          totals.messages     += parseFloat(m.messages)     || 0;
          totals.purchaseValue += parseFloat(m.purchaseValue) || 0;
          if (roas > 0 && spend > 0) { totals.roasSum += roas * spend; totals.roasCount += spend; }
        });

        var impr  = totals.impressions;
        var spend = totals.spend;
        var roas  = totals.roasCount > 0 ? totals.roasSum / totals.roasCount : 0;
        var conv  = totals.leads + totals.purchases + totals.messages;

        accounts.push({
          accountName: client.name || client.criativoAccountId,
          clientId:    client.id || '',
          spend:       spend.toFixed(2),
          impressions: Math.round(impr),
          clicks:      Math.round(totals.clicks),
          linkClicks:  Math.round(totals.linkClicks),
          reach:       Math.round(totals.reach),
          leads:       Math.round(totals.leads),
          purchases:   Math.round(totals.purchases),
          conversions: Math.round(conv),
          messages:    Math.round(totals.messages),
          roas:        roas.toFixed(2),
          ctr:         impr > 0 ? (totals.clicks / impr * 100).toFixed(2) : '0',
          cpm:         impr > 0 ? (spend / impr * 1000).toFixed(2) : '0',
          cpc:         totals.clicks > 0 ? (spend / totals.clicks).toFixed(2) : '0',
          cpa:         conv > 0 ? (spend / conv).toFixed(2) : '0'
        });

      } catch(e) {
        // Conta sem acesso ou sem dados — adiciona com zeros para não quebrar a tabela
        accounts.push({
          accountName: client.name || client.criativoAccountId,
          clientId:    client.id || '',
          spend: '0', impressions: 0, clicks: 0, linkClicks: 0,
          reach: 0, leads: 0, purchases: 0, conversions: 0,
          messages: 0, roas: '0', ctr: '0', cpm: '0', cpc: '0', cpa: '0',
          error: e.message
        });
      }
    });

    // Ordena por gasto desc
    accounts.sort(function(a, b) { return parseFloat(b.spend) - parseFloat(a.spend); });

    return {
      accounts: accounts,
      period:   { start: startDate, end: endDate },
      source:   'meta_api'
    };

  } catch(err) {
    return { error: 'Erro getAllAccountsMetricsMeta: ' + err.message };
  }
}

// ─── checkMetaAccountsHourly ─────────────────────────────────
// Roda a cada 1 hora via trigger.
// Para cada cliente com criativoAccountId:
//   1. Verifica se há campanhas ativas (status=ACTIVE) na conta Meta
//   2. Busca saldo real da conta via Meta API
//   3. Se sem campanha ativa → move Kanban para "Anúncios pausados"
//   4. Se saldo < R$50 → envia alerta WhatsApp no grupo do cliente
//   5. Salva resultado em meta_status (aba do Sheets) para o frontend exibir badges
function checkMetaAccountsHourly() {
  var token = PropertiesService.getScriptProperties().getProperty('META_TOKEN');
  if (!token) { Logger.log('META_TOKEN não configurado'); return; }

  var clients = sheetToObjects(getSheet('clients')).filter(function(c) {
    return c.criativoAccountId && c.cancelado !== true && c.cancelado !== 'TRUE';
  });

  if (clients.length === 0) { Logger.log('Nenhum cliente com conta Meta vinculada'); return; }

  // Garante aba meta_status com cabeçalho
  var sh = getSheet('meta_status');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['clientId', 'accountId', 'balance', 'activeCampaigns', 'lowBalance', 'updatedAt']);
  }

  // Monta mapa clientId → linha existente para upsert
  var statusMap = {};
  var lastRow = sh.getLastRow();
  if (lastRow > 1) {
    var rows = sh.getRange(2, 1, lastRow - 1, 6).getValues();
    rows.forEach(function(r, i) { statusMap[String(r[0])] = i + 2; }); // row number (1-indexed)
  }

  var movedToPA = 0;
  var lowBalanceAlerts = 0;

  clients.forEach(function(client) {
    try {
      var actId = String(client.criativoAccountId).replace(/^act_/i, '');
      var acctParam = 'act_' + actId;

      // 1. Campanhas ativas
      var campUrl = META_API_BASE + '/' + acctParam + '/campaigns'
        + '?fields=id,name,status,effective_status'
        + '&effective_status=[%22ACTIVE%22]'
        + '&limit=50'
        + '&access_token=' + token;

      var campJson = metaGet_(campUrl);
      var activeCampaigns = (campJson.data || []).length;

      // 2. Saldo da conta (em centavos → converter para reais)
      var acctUrl = META_API_BASE + '/' + acctParam
        + '?fields=balance,amount_spent,currency,account_status'
        + '&access_token=' + token;
      var acctJson = metaGet_(acctUrl);
      // balance da Meta API já vem em reais para contas BRL (não em centavos)
      var balance = parseFloat(acctJson.balance) || 0;

      var lowBalance = balance < 50;

      // 3. Atualiza Kanban se sem campanha ativa e cliente estava em "Campanha ativa"
      var currentStatus = String(client.status || '');
      if (activeCampaigns === 0 && currentStatus === 'Campanha ativa') {
        updateClientStatus({ id: client.id, status: 'Anúncios pausados' });
        Logger.log('[MONITOR] ' + client.name + ' → sem campanhas ativas → movido para "Anúncios pausados"');
        movedToPA++;
      }

      // 4. Alerta WhatsApp se saldo baixo
      if (lowBalance && client.whatsappGroup) {
        var msg = '⚠️ *Alerta de Saldo Baixo — AventusCS_*\n\n' +
          '📉 Saldo da conta Meta: *R$' + balance.toFixed(2) + '*\n' +
          '💡 Saldo abaixo de R$50 — verifique a recarga!\n\n' +
          '_Monitoramento automático AventusCS_';
        sendWhatsApp(client.whatsappGroup, msg);
        lowBalanceAlerts++;
        Logger.log('[MONITOR] ' + client.name + ' → saldo R$' + balance.toFixed(2) + ' → alerta enviado');
      }

      // 5. Upsert na aba meta_status
      var now = new Date().toISOString();
      var rowData = [client.id, client.criativoAccountId, balance.toFixed(2), activeCampaigns, lowBalance, now];

      if (statusMap[client.id]) {
        sh.getRange(statusMap[client.id], 1, 1, 6).setValues([rowData]);
      } else {
        sh.appendRow(rowData);
        statusMap[client.id] = sh.getLastRow();
      }

    } catch(err) {
      Logger.log('[MONITOR] Erro em ' + client.name + ': ' + err.message);
    }
  });

  Logger.log('[MONITOR] Concluído: ' + movedToPA + ' movidos para PA, ' + lowBalanceAlerts + ' alertas de saldo');
}

// ─── getMetaStatus ───────────────────────────────────────────
// Retorna o último status de saldo/campanhas salvo pela verificação horária.
// Usado pelo frontend para exibir badges nos cards.
function getMetaStatus() {
  var sh = getSheet('meta_status');
  if (sh.getLastRow() <= 1) return { status: [] };

  var rows = sheetToObjects(sh);
  return {
    status: rows.map(function(r) {
      return {
        clientId:        String(r.clientId || ''),
        accountId:       String(r.accountId || ''),
        balance:         parseFloat(r.balance) || 0,
        activeCampaigns: parseInt(r.activeCampaigns) || 0,
        lowBalance:      r.lowBalance === true || r.lowBalance === 'TRUE' || r.lowBalance === 'true',
        updatedAt:       String(r.updatedAt || '')
      };
    })
  };
}

// ─── runPredictiveAI ─────────────────────────────────────────
// Roda toda segunda-feira via trigger.
// Para cada cliente com conta Meta vinculada:
//   1. Busca métricas dos últimos 7, 14 e 30 dias via Meta API
//   2. Busca histórico de previsões de todos os clientes (padrões anteriores)
//   3. Chama Claude com prompt preditivo avançado
//   4. Salva previsão na aba ai_insights com period='predictive'
function runPredictiveAI() {
  var today = new Date();
  if (today.getDay() !== 1) {
    Logger.log('[PredictiveAI] Só roda às segundas-feiras');
    return;
  }

  var claudeApiKey = PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');
  if (!claudeApiKey) { Logger.log('[PredictiveAI] CLAUDE_API_KEY não configurada'); return; }

  var token = PropertiesService.getScriptProperties().getProperty('META_TOKEN');
  if (!token) { Logger.log('[PredictiveAI] META_TOKEN não configurado'); return; }

  var clients = sheetToObjects(getSheet('clients')).filter(function(c) {
    return c.criativoAccountId && !c.cancelado && c.cancelado !== 'TRUE';
  });

  if (clients.length === 0) { Logger.log('[PredictiveAI] Nenhum cliente com conta Meta'); return; }

  // Datas dos períodos
  function dateStr(daysAgo) {
    var d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0, 10);
  }
  var today7  = dateStr(7);
  var today14 = dateStr(14);
  var today30 = dateStr(30);
  var todayStr = dateStr(0);

  // Busca histórico de TODOS os clientes (para comparação de padrões)
  var allInsights = sheetToObjects(getSheet('ai_insights'))
    .filter(function(r) { return r.period === 'predictive'; })
    .map(function(r) {
      return '[' + (r.createdAt || '').slice(0,10) + '] ' + (r.clientId || '') + ': ' + (r.insight || '').slice(0, 300);
    });
  var historicalPatterns = allInsights.length > 0
    ? allInsights.slice(-30).join('\n') // últimas 30 previsões de todos os clientes
    : 'Nenhum histórico disponível ainda (primeira execução).';

  var sh = getSheet('ai_insights');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['id', 'clientId', 'period', 'insight', 'createdAt']);
  }

  clients.forEach(function(client) {
    try {
      Logger.log('[PredictiveAI] Processando: ' + client.name);

      // Busca métricas dos 3 períodos
      var m7  = getMetricsMeta(client.criativoAccountId, today7,  todayStr);
      var m14 = getMetricsMeta(client.criativoAccountId, today14, todayStr);
      var m30 = getMetricsMeta(client.criativoAccountId, today30, todayStr);

      // Detecta objetivo real pelas métricas (não depende de campo manual)
      var t7 = m7.totals || {};
      var objetivo;
      if ((parseFloat(t7.purchases) || 0) > 0) {
        objetivo = 'ecommerce'; // tem compras → e-commerce
      } else if ((parseFloat(t7.messages) || 0) > 0) {
        objetivo = 'messages';  // tem mensagens → conversas
      } else if ((parseFloat(t7.leads) || 0) > 0) {
        objetivo = 'leads';     // tem leads → geração de leads
      } else {
        // Sem conversões ainda — usa clientType como fallback
        var ct = String(client.clientType || '').toLowerCase();
        objetivo = ct === 'ecommerce' ? 'ecommerce' : 'messages';
      }

      var objetivoLabel = objetivo === 'ecommerce' ? 'E-commerce (KPI: Compras, ROAS, Receita)'
        : objetivo === 'messages' ? 'Conversas por mensagem (KPI: Mensagens iniciadas, Custo por mensagem)'
        : 'Geração de leads (KPI: Leads, Custo por lead)';

      function fmtMetrics(m) {
        if (m.error) return 'Erro: ' + m.error;
        var t = m.totals || {};
        if (objetivo === 'ecommerce') {
          return 'Gasto: R$' + t.spend +
            ' | Impressões: ' + t.impressions +
            ' | Cliques: ' + t.clicks +
            ' | CTR: ' + t.ctr + '%' +
            ' | CPM: R$' + t.cpm +
            ' | Compras: ' + t.purchases +
            ' | Receita: R$' + t.purchaseValue +
            ' | ROAS: ' + t.roas +
            ' | Custo/compra: R$' + t.cpa +
            ' | Alcance: ' + t.reach +
            ' | Frequência: ' + t.frequency;
        } else if (objetivo === 'messages') {
          var cpMsg = (parseFloat(t.messages) || 0) > 0
            ? 'R$' + (parseFloat(t.spend) / parseFloat(t.messages)).toFixed(2)
            : 'N/A';
          return 'Gasto: R$' + t.spend +
            ' | Impressões: ' + t.impressions +
            ' | Cliques: ' + t.clicks +
            ' | CTR: ' + t.ctr + '%' +
            ' | CPM: R$' + t.cpm +
            ' | Conversas iniciadas: ' + t.messages +
            ' | Custo por conversa: ' + cpMsg +
            ' | Alcance: ' + t.reach +
            ' | Frequência: ' + t.frequency;
        } else {
          return 'Gasto: R$' + t.spend +
            ' | Impressões: ' + t.impressions +
            ' | Cliques: ' + t.clicks +
            ' | CTR: ' + t.ctr + '%' +
            ' | CPM: R$' + t.cpm +
            ' | Leads: ' + t.leads +
            ' | Custo por lead: R$' + t.cpa +
            ' | Alcance: ' + t.reach +
            ' | Frequência: ' + t.frequency;
        }
      }

      var metrics7  = fmtMetrics(m7);
      var metrics14 = fmtMetrics(m14);
      var metrics30 = fmtMetrics(m30);

      // Campanhas ativas
      var campaigns = (m7.campaigns || []).map(function(c) { return c.name; }).join(', ') || 'Nenhuma';
      var activeCampaigns = (m7.campaigns || []).filter(function(c) { return c.status === 'ACTIVE'; }).length;

      var prompt =
        'Você é um sistema de inteligência preditiva especializado em performance de mídia paga (Meta Ads).\n' +
        'Seu objetivo é identificar padrões históricos e prever com precisão o que vai acontecer nos próximos 3 a 7 dias.\n\n' +

        '## DADOS DO CLIENTE ATUAL\n' +
        'Nome: ' + client.name + '\n' +
        'Objetivo da campanha: ' + objetivoLabel + '\n' +
        'IMPORTANTE: Avalie APENAS o KPI do objetivo acima. Não mencione métricas de outros objetivos como problema.\n' +
        'Conta Meta: ' + client.criativoAccountId + '\n' +
        'Campanhas ativas: ' + activeCampaigns + ' | Nomes: ' + campaigns + '\n\n' +

        '## MÉTRICAS ATUAIS (últimos 7 dias)\n' + metrics7 + '\n\n' +
        '## MÉTRICAS DOS ÚLTIMOS 14 DIAS\n' + metrics14 + '\n\n' +
        '## MÉTRICAS DOS ÚLTIMOS 30 DIAS\n' + metrics30 + '\n\n' +

        '## HISTÓRICO DE PADRÕES (previsões anteriores deste e de outros clientes)\n' +
        historicalPatterns + '\n\n' +

        '---\n\n' +
        '## SUA MISSÃO\n\n' +

        '1. IDENTIFICAÇÃO DE PADRÃO\n' +
        'Analise a trajetória das métricas dos últimos 7 dias em relação aos 14 e 30 dias.\n' +
        'Identifique se há um padrão reconhecível: queda de ROAS, aumento de CPM, fadiga criativa, saturação de público, sazonalidade, etc.\n' +
        'Compare esse padrão com os históricos fornecidos. Existe algum período anterior — deste ou de outro cliente — onde o comportamento era parecido?\n\n' +

        '2. PREVISÃO\n' +
        'Com base no padrão identificado e no que aconteceu historicamente depois dele:\n' +
        '- O que provavelmente vai acontecer nos próximos 3 dias?\n' +
        '- E nos próximos 7 dias?\n' +
        '- Qual métrica vai se mover primeiro e em qual direção?\n' +
        '- Qual é o nível de confiança dessa previsão (baixo / médio / alto) e por quê?\n\n' +

        '3. ALERTAS CRÍTICOS\n' +
        'Se houver sinais de deterioração iminente (ROAS em queda, CPM subindo, CTR caindo, frequência alta), declare como ALERTA VERMELHO com urgência e impacto estimado em reais.\n\n' +

        '4. AÇÃO RECOMENDADA\n' +
        'Uma ação concreta e específica que deve ser tomada AGORA para aproveitar o padrão positivo ou evitar o negativo. Não seja genérico — cite métricas, valores e prazo.\n\n' +

        '## FORMATO DE RESPOSTA (sempre nesse formato exato):\n\n' +
        'PADRÃO IDENTIFICADO: [nome do padrão em 1 linha]\n' +
        'SIMILARIDADE HISTÓRICA: [quando e onde esse padrão apareceu antes, e o que aconteceu depois]\n' +
        'PREVISÃO 3 DIAS: [o que vai acontecer]\n' +
        'PREVISÃO 7 DIAS: [o que vai acontecer]\n' +
        'CONFIANÇA: [baixo/médio/alto] — [justificativa em 1 linha]\n' +
        '⚠️ ALERTA: [se houver, descreva — caso contrário escreva "Nenhum"]\n' +
        'AÇÃO AGORA: [ação específica com prazo]';

      // Chama Claude
      var claudeResp = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeApiKey,
          'anthropic-version': '2023-06-01'
        },
        payload: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 800,
          messages: [{ role: 'user', content: prompt }]
        }),
        muteHttpExceptions: true
      });

      var claudeData = JSON.parse(claudeResp.getContentText());
      var insightText = (claudeData.content && claudeData.content[0]) ? claudeData.content[0].text : '';

      if (!insightText) {
        Logger.log('[PredictiveAI] Claude não retornou previsão para ' + client.name);
        return;
      }

      // Salva na aba ai_insights com period='predictive'
      var id = genId();
      var now = new Date().toISOString();
      sh.appendRow([id, client.id, 'predictive', insightText, now]);
      Logger.log('[PredictiveAI] Previsão salva para ' + client.name);

    } catch(err) {
      Logger.log('[PredictiveAI] Erro em ' + client.name + ': ' + err.message);
    }
  });

  Logger.log('[PredictiveAI] Concluído para ' + clients.length + ' clientes');
}

// ─── runPredictiveAINow ──────────────────────────────────────
// Versão manual do runPredictiveAI, sem verificação de dia da semana.
// Acionada pelo botão "Gerar agora" no CRM.
function runPredictiveAINow() {
  var claudeApiKey = PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');
  if (!claudeApiKey) return { error: 'CLAUDE_API_KEY não configurada nas propriedades do script.' };

  var token = PropertiesService.getScriptProperties().getProperty('META_TOKEN');
  if (!token) return { error: 'META_TOKEN não configurado nas propriedades do script.' };

  var clients = sheetToObjects(getSheet('clients')).filter(function(c) {
    return c.criativoAccountId && !c.cancelado && c.cancelado !== 'TRUE';
  });

  if (clients.length === 0) return { error: 'Nenhum cliente com conta Meta vinculada.' };

  function dateStr(daysAgo) {
    var d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0, 10);
  }
  var today7  = dateStr(7);
  var today14 = dateStr(14);
  var today30 = dateStr(30);
  var todayStr = dateStr(0);

  var allInsights = sheetToObjects(getSheet('ai_insights'))
    .filter(function(r) { return r.period === 'predictive'; })
    .map(function(r) {
      return '[' + (r.createdAt || '').slice(0,10) + '] ' + (r.clientId || '') + ': ' + (r.insight || '').slice(0, 300);
    });
  var historicalPatterns = allInsights.length > 0
    ? allInsights.slice(-30).join('\n')
    : 'Nenhum histórico disponível ainda (primeira execução).';

  var sh = getSheet('ai_insights');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['id', 'clientId', 'period', 'insight', 'createdAt']);
  }

  var processed = 0;
  var errors = [];

  clients.forEach(function(client) {
    try {
      var m7  = getMetricsMeta(client.criativoAccountId, today7,  todayStr);
      var m14 = getMetricsMeta(client.criativoAccountId, today14, todayStr);
      var m30 = getMetricsMeta(client.criativoAccountId, today30, todayStr);

      // Detecta objetivo real pelas métricas
      var t7now = m7.totals || {};
      var objetivoNow;
      if ((parseFloat(t7now.purchases) || 0) > 0) {
        objetivoNow = 'ecommerce';
      } else if ((parseFloat(t7now.messages) || 0) > 0) {
        objetivoNow = 'messages';
      } else if ((parseFloat(t7now.leads) || 0) > 0) {
        objetivoNow = 'leads';
      } else {
        var ct2 = String(client.clientType || '').toLowerCase();
        objetivoNow = ct2 === 'ecommerce' ? 'ecommerce' : 'messages';
      }

      var objetivoLabelNow = objetivoNow === 'ecommerce' ? 'E-commerce (KPI: Compras, ROAS, Receita)'
        : objetivoNow === 'messages' ? 'Conversas por mensagem (KPI: Mensagens iniciadas, Custo por mensagem)'
        : 'Geração de leads (KPI: Leads, Custo por lead)';

      function fmtMetrics(m) {
        if (m.error) return 'Erro: ' + m.error;
        var t = m.totals || {};
        if (objetivoNow === 'ecommerce') {
          return 'Gasto: R$' + t.spend + ' | Impressões: ' + t.impressions + ' | Cliques: ' + t.clicks +
            ' | CTR: ' + t.ctr + '% | CPM: R$' + t.cpm + ' | Compras: ' + t.purchases +
            ' | Receita: R$' + t.purchaseValue + ' | ROAS: ' + t.roas + ' | Custo/compra: R$' + t.cpa +
            ' | Alcance: ' + t.reach + ' | Frequência: ' + t.frequency;
        } else if (objetivoNow === 'messages') {
          var cpMsg2 = (parseFloat(t.messages) || 0) > 0
            ? 'R$' + (parseFloat(t.spend) / parseFloat(t.messages)).toFixed(2) : 'N/A';
          return 'Gasto: R$' + t.spend + ' | Impressões: ' + t.impressions + ' | Cliques: ' + t.clicks +
            ' | CTR: ' + t.ctr + '% | CPM: R$' + t.cpm + ' | Conversas iniciadas: ' + t.messages +
            ' | Custo por conversa: ' + cpMsg2 + ' | Alcance: ' + t.reach + ' | Frequência: ' + t.frequency;
        } else {
          return 'Gasto: R$' + t.spend + ' | Impressões: ' + t.impressions + ' | Cliques: ' + t.clicks +
            ' | CTR: ' + t.ctr + '% | CPM: R$' + t.cpm + ' | Leads: ' + t.leads +
            ' | Custo por lead: R$' + t.cpa + ' | Alcance: ' + t.reach + ' | Frequência: ' + t.frequency;
        }
      }

      var campaigns = (m7.campaigns || []).map(function(c) { return c.name; }).join(', ') || 'Nenhuma';
      var activeCampaigns = (m7.campaigns || []).filter(function(c) { return c.status === 'ACTIVE'; }).length;

      var prompt =
        'Você é um sistema de inteligência preditiva especializado em performance de mídia paga (Meta Ads).\n' +
        'Seu objetivo é identificar padrões históricos e prever com precisão o que vai acontecer nos próximos 3 a 7 dias.\n\n' +
        '## DADOS DO CLIENTE ATUAL\n' +
        'Nome: ' + client.name + '\n' +
        'Objetivo da campanha: ' + objetivoLabelNow + '\n' +
        'IMPORTANTE: Avalie APENAS o KPI do objetivo acima. Não mencione métricas de outros objetivos como problema.\n' +
        'Conta Meta: ' + client.criativoAccountId + '\n' +
        'Campanhas ativas: ' + activeCampaigns + ' | Nomes: ' + campaigns + '\n\n' +
        '## MÉTRICAS ATUAIS (últimos 7 dias)\n' + fmtMetrics(m7) + '\n\n' +
        '## MÉTRICAS DOS ÚLTIMOS 14 DIAS\n' + fmtMetrics(m14) + '\n\n' +
        '## MÉTRICAS DOS ÚLTIMOS 30 DIAS\n' + fmtMetrics(m30) + '\n\n' +
        '## HISTÓRICO DE PADRÕES\n' + historicalPatterns + '\n\n---\n\n' +
        '## FORMATO DE RESPOSTA (sempre nesse formato exato):\n\n' +
        'PADRÃO IDENTIFICADO: [nome do padrão em 1 linha]\n' +
        'SIMILARIDADE HISTÓRICA: [quando e onde esse padrão apareceu antes, e o que aconteceu depois]\n' +
        'PREVISÃO 3 DIAS: [o que vai acontecer]\n' +
        'PREVISÃO 7 DIAS: [o que vai acontecer]\n' +
        'CONFIANÇA: [baixo/médio/alto] — [justificativa em 1 linha]\n' +
        '⚠️ ALERTA: [se houver, descreva — caso contrário escreva "Nenhum"]\n' +
        'AÇÃO AGORA: [ação específica com prazo]';

      var claudeResp = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeApiKey,
          'anthropic-version': '2023-06-01'
        },
        payload: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 800,
          messages: [{ role: 'user', content: prompt }]
        }),
        muteHttpExceptions: true
      });

      var claudeData = JSON.parse(claudeResp.getContentText());
      var insightText = (claudeData.content && claudeData.content[0]) ? claudeData.content[0].text : '';

      if (insightText) {
        sh.appendRow([genId(), client.id, 'predictive', insightText, new Date().toISOString()]);
        processed++;
        Logger.log('[PredictiveAI Manual] Previsão salva para ' + client.name);
      }

      Utilities.sleep(1000); // evita rate limit

    } catch(err) {
      errors.push(client.name + ': ' + err.message);
      Logger.log('[PredictiveAI Manual] Erro em ' + client.name + ': ' + err.message);
    }
  });

  return {
    ok: true,
    processed: processed,
    total: clients.length,
    errors: errors
  };
}

// ─── getPredictiveInsights ────────────────────────────────────
// Retorna as últimas previsões preditivas de todos os clientes
function getPredictiveInsights() {
  var sh = getSheet('ai_insights');
  if (sh.getLastRow() <= 1) return { insights: [] };

  var rows = sheetToObjects(sh).filter(function(r) {
    return r.period === 'predictive';
  });

  // Pega só a mais recente por cliente
  var latest = {};
  rows.forEach(function(r) {
    var cid = String(r.clientId || '');
    if (!latest[cid] || r.createdAt > latest[cid].createdAt) {
      latest[cid] = r;
    }
  });

  return {
    insights: Object.values(latest).map(function(r) {
      return {
        id:        String(r.id || ''),
        clientId:  String(r.clientId || ''),
        insight:   String(r.insight || ''),
        createdAt: String(r.createdAt || '')
      };
    })
  };
}
