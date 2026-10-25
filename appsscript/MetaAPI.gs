// ============================================================
// MetaAPI.gs — Integração direta com a Meta Marketing API
// Substitui leitura do Detrics (Google Sheets) por chamadas
// diretas à API do Meta, retornando dados em <2 segundos.
// ============================================================

var META_TOKEN = PropertiesService.getScriptProperties().getProperty('META_TOKEN');
var META_API_VERSION = 'v21.0';
var META_API_BASE    = 'https://graph.facebook.com/' + META_API_VERSION;

// ──────────────────────────────────────────────────────────────
// DEBUG: Execute esta função manualmente no Apps Script para ver
// exatamente o que a Meta retorna para uma conta no dia atual.
// Coloca o criativoAccountId do cliente que está com problema.
// ──────────────────────────────────────────────────────────────
function debugMetaRawToday() {
  var token = PropertiesService.getScriptProperties().getProperty('META_TOKEN');
  // Busca o Proflex na sheet clients
  var clients = sheetToObjects(getSheet('clients'));
  var proflex = clients.find(function(c) {
    return (c.name || '').toLowerCase().indexOf('proflex') >= 0 ||
           (c.name || '').toLowerCase().indexOf('profflex') >= 0;
  });

  if (!proflex) {
    Logger.log('[DEBUG] Cliente Proflex não encontrado na sheet. Clientes disponíveis: ' +
      clients.map(function(c){ return c.name; }).join(', '));
    return;
  }

  Logger.log('[DEBUG] Cliente encontrado: ' + proflex.name + ' | accountId: ' + proflex.criativoAccountId + ' | tipo: ' + proflex.clientType);

  var todayStr = new Date().toISOString().slice(0, 10);
  Logger.log('[DEBUG] Buscando data: ' + todayStr);

  var actId = (proflex.criativoAccountId || '').replace(/^act_/i, '');
  var acctParam = 'act_' + actId;

  // Testa com date_preset=today (diferente do time_range)
  var urlPreset = META_API_BASE + '/' + acctParam + '/insights'
    + '?level=campaign'
    + '&date_preset=today'
    + '&fields=spend,impressions,clicks,reach,actions,campaign_name'
    + '&access_token=' + token;

  Logger.log('[DEBUG] URL preset=today: ' + urlPreset.replace(token, 'TOKEN_OCULTO'));

  try {
    var res = UrlFetchApp.fetch(urlPreset, { muteHttpExceptions: true });
    var txt = res.getContentText();
    Logger.log('[DEBUG] Resposta date_preset=today: ' + txt.substring(0, 2000));
  } catch(e) {
    Logger.log('[DEBUG] Erro: ' + e.message);
  }

  // Testa com time_range normal
  var urlRange = META_API_BASE + '/' + acctParam + '/insights'
    + '?level=campaign'
    + '&fields=spend,impressions,clicks,reach,actions,campaign_name'
    + '&time_range=' + encodeURIComponent(JSON.stringify({ since: todayStr, until: todayStr }))
    + '&access_token=' + token;

  Logger.log('[DEBUG] URL time_range=hoje: ' + urlRange.replace(token, 'TOKEN_OCULTO'));

  try {
    var res2 = UrlFetchApp.fetch(urlRange, { muteHttpExceptions: true });
    var txt2 = res2.getContentText();
    Logger.log('[DEBUG] Resposta time_range=hoje: ' + txt2.substring(0, 2000));
  } catch(e2) {
    Logger.log('[DEBUG] Erro: ' + e2.message);
  }
}

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

// Retorna o valor do PRIMEIRO tipo de action que existir na lista (em ordem de prioridade).
// A Meta devolve a mesma conversão em vários tipos ao mesmo tempo
// (ex: 'purchase' JÁ INCLUI 'offsite_conversion.fb_pixel_purchase').
// Somar os tipos contava a mesma compra 2x — por isso o valor de venda aparecia dobrado.
function firstAction_(actions, types) {
  if (!actions) return 0;
  for (var i = 0; i < types.length; i++) {
    var found = actions.some(function(a) { return a.action_type === types[i]; });
    if (found) return sumAction_(actions, types[i]);
  }
  return 0;
}

var PURCHASE_TYPES_ = ['purchase', 'omni_purchase', 'offsite_conversion.fb_pixel_purchase'];
var LEAD_TYPES_     = ['lead', 'onsite_conversion.lead_grouped', 'offsite_conversion.fb_pixel_lead'];

// Converte array de insights da Meta em objeto com nossas métricas
function parseInsight_(ins) {
  var actions      = ins.actions || [];
  var actionValues = ins.action_values || [];

  var leads     = firstAction_(actions, LEAD_TYPES_);
  var purchases = firstAction_(actions, PURCHASE_TYPES_);
  // Mensagens: SOMENTE conversas iniciadas (Click-to-WhatsApp / Messenger).
  // NÃO incluir omni_messaging_engagement (engajamento geral) nem contact (qualquer contato)
  // pois inflam o número com interações que não são conversas novas.
  var messages  = sumAction_(actions, 'onsite_conversion.messaging_conversation_started_7d') +
                  sumAction_(actions, 'onsite_conversion.messaging_conversation_started_30d') +
                  sumAction_(actions, 'onsite_conversion.total_messaging_connection') +
                  sumAction_(actions, 'omni_initiated_conversation');
  // Garante sem duplas entre variantes de janela de atribuição — pega o maior valor se ambos existirem
  var msg7d  = sumAction_(actions, 'onsite_conversion.messaging_conversation_started_7d');
  var msg30d = sumAction_(actions, 'onsite_conversion.messaging_conversation_started_30d');
  var msgConn = sumAction_(actions, 'onsite_conversion.total_messaging_connection');
  var msgOmni = sumAction_(actions, 'omni_initiated_conversation');
  // Usa o maior entre as variantes de janela (7d/30d) + conexão + omni, sem somar ambas as janelas
  messages = Math.max(msg7d, msg30d) + msgConn + msgOmni;
  // Remove dupla com msgConn se for o mesmo evento
  // Na prática: prefere messaging_conversation_started_Xd; total_messaging_connection é fallback
  if (msg7d > 0 || msg30d > 0) messages = Math.max(msg7d, msg30d) + msgOmni;
  else messages = msgConn + msgOmni;
  var lpv       = sumAction_(actions, 'landing_page_view');

  var purchaseValue = firstAction_(actionValues, PURCHASE_TYPES_);

  var spend = parseFloat(ins.spend) || 0;
  var roas  = 0;
  if (ins.website_purchase_roas && ins.website_purchase_roas.length > 0) {
    roas = parseFloat(ins.website_purchase_roas[0].value) || 0;
  } else if (ins.purchase_roas && ins.purchase_roas.length > 0) {
    roas = parseFloat(ins.purchase_roas[0].value) || 0;
  } else if (spend > 0 && purchaseValue > 0) {
    roas = purchaseValue / spend;
  }

  // Algumas contas (ex: i9, Green) trazem o ROAS mas não trazem o valor em action_values.
  // Nesse caso o valor vendido é reconstruído a partir do ROAS: valor = ROAS × investimento.
  if (purchaseValue <= 0 && roas > 0 && spend > 0) {
    purchaseValue = roas * spend;
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
  // CPL = Custo por conversa iniciada (mensagens WhatsApp/Messenger)
  var cpl = messages > 0 ? spend / messages : 0;

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
    cpa:           cpa.toFixed(2),
    cpl:           cpl.toFixed(2)
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
// datePreset: se 'today', usa date_preset=today em vez de time_range (mais confiável para o dia atual)
function getMetricsMeta(accountId, startDate, endDate, datePreset) {
  if (!accountId) return { error: 'accountId required' };
  if (!META_TOKEN) return { error: 'META_TOKEN não configurado. Vá em Apps Script > Configurações > Propriedades do script e adicione META_TOKEN.' };

  try {
    var actId = accountId.replace(/^act_/i, '');
    var acctParam = 'act_' + actId;

    // Parâmetro de período: usa date_preset=today quando disponível (dados em tempo real)
    // ou time_range para períodos históricos
    var periodParam = datePreset
      ? ('&date_preset=' + datePreset)
      : ('&time_range=' + encodeURIComponent(JSON.stringify({ since: startDate, until: endDate })));

    // 1. Insights totais da conta no período (nível campanha)
    var insightsUrl = META_API_BASE + '/' + acctParam + '/insights'
      + '?level=campaign'
      + '&fields=' + encodeURIComponent(META_INSIGHT_FIELDS)
      + periodParam
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
    var gtCpl  = gt.messages > 0 ? (gt.spend / gt.messages).toFixed(2) : '0';
    var gtFreq = gt.freqCount > 0 ? (gt.freqSum / gt.freqCount).toFixed(2) : '0';

    // 5. Breakdown diário (time_increment=1) — para gráficos
    var dailyUrl = META_API_BASE + '/' + acctParam + '/insights'
      + '?level=account'
      + '&fields=spend,impressions,clicks,inline_link_clicks,reach,actions,action_values,website_purchase_roas,purchase_roas'
      + '&time_increment=1'
      + periodParam
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
        purchaseValue: parseFloat(m.purchaseValue) || 0,
        messages:     parseFloat(m.messages)     || 0,
        ctr:          parseFloat(m.ctr)          || 0,
        cpm:          parseFloat(m.cpm)          || 0,
        cpc:          parseFloat(m.cpc)          || 0,
        roas:         parseFloat(m.roas)         || 0,
        cpa:          parseFloat(m.cpa)          || 0,
        cpl:          parseFloat(m.cpl)          || 0
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
        roas: gtRoas, ctr: gtCtr, cpm: gtCpm, cpc: gtCpc, cpa: gtCpa, cpl: gtCpl
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
function getAllAccountsMetricsMeta(startDate, endDate, datePreset) {
  if (!META_TOKEN) return { error: 'META_TOKEN não configurado.' };

  try {
    // Busca clientes cadastrados com criativoAccountId
    var clientsData = getClients();
    var clients = (clientsData.clients || clientsData || []).filter(function(c) {
      return c.criativoAccountId && !c.cancelado;
    });

    if (clients.length === 0) return { accounts: [], period: { start: startDate, end: endDate }, source: 'meta_api' };

    // Parâmetro de período
    var periodParam = datePreset
      ? ('&date_preset=' + datePreset)
      : ('&time_range=' + encodeURIComponent(JSON.stringify({ since: startDate, until: endDate })));

    var accounts = [];

    clients.forEach(function(client) {
      try {
        var actId    = String(client.criativoAccountId).replace(/^act_/i, '');
        var acctParam = 'act_' + actId;

        var url = META_API_BASE + '/' + acctParam + '/insights'
          + '?level=account'
          + '&fields=' + encodeURIComponent(META_INSIGHT_FIELDS)
          + periodParam
          + '&access_token=' + META_TOKEN;

        var data = fetchAllPages_(url);
        if (data.length === 0) {
          accounts.push({
            accountName: client.name || client.criativoAccountId,
            clientId:    client.id || '',
            spend: '0', impressions: 0, clicks: 0, linkClicks: 0,
            reach: 0, leads: 0, purchases: 0, purchaseValue: '0', conversions: 0,
            messages: 0, roas: '0', ctr: '0', cpm: '0', cpc: '0', cpa: '0', cpl: '0'
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
          purchaseValue: totals.purchaseValue.toFixed(2),
          conversions: Math.round(conv),
          messages:    Math.round(totals.messages),
          roas:        roas.toFixed(2),
          ctr:         impr > 0 ? (totals.clicks / impr * 100).toFixed(2) : '0',
          cpm:         impr > 0 ? (spend / impr * 1000).toFixed(2) : '0',
          cpc:         totals.clicks > 0 ? (spend / totals.clicks).toFixed(2) : '0',
          cpa:         conv > 0 ? (spend / conv).toFixed(2) : '0',
          cpl:         totals.messages > 0 ? (spend / totals.messages).toFixed(2) : '0'
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

  var allClients = sheetToObjects(getSheet('clients'));
  Logger.log('[MONITOR] Total de clientes no sheet: ' + allClients.length);
  var clients = allClients.filter(function(c) {
    var hasConta = !!c.criativoAccountId;
    var cancelado = c.cancelado;
    var ativo = cancelado !== true && cancelado !== 'TRUE' && cancelado !== 'true';
    Logger.log('[MONITOR] ' + c.name + ' | criativoAccountId=' + c.criativoAccountId + ' | cancelado=' + cancelado + ' | passa=' + (hasConta && ativo));
    return hasConta && ativo;
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

      // 2. Saldo da conta — usa funding_source_details.display_string que tem o valor real em BRL
      var acctUrl = META_API_BASE + '/' + acctParam
        + '?fields=funding_source_details,currency'
        + '&access_token=' + token;
      var acctJson = metaGet_(acctUrl);
      var fsd = acctJson.funding_source_details || {};
      var displayString = fsd.display_string || '';
      // Extrai valor do "Saldo disponível (R$119,48 BRL)" — tipo 20 = pré-pago
      var balanceMatch = displayString.match(/R\$([0-9.,]+)\s*BRL/);
      var balance = 0;
      if (balanceMatch) {
        // Converte "119,48" → 119.48
        balance = parseFloat(balanceMatch[1].replace('.', '').replace(',', '.')) || 0;
      }
      // Tipo 1 = cartão de crédito — não tem saldo pré-pago para alertar
      // Compara como string também pois a API pode retornar "1" ou 1
      var isCartao = fsd.type === 1 || fsd.type === '1' || String(fsd.type) === '1';
      Logger.log('[MONITOR] ' + client.name + ' | saldo=R$' + balance.toFixed(2) + ' | tipo=' + fsd.type + ' | cartao=' + isCartao);

      // Contas cartão (tipo 1) não têm saldo pré-pago — não alertar
      // Tipo 20 = pré-pago (prepaid). Se não for explicitamente pré-pago, não alertar.
      var isPrepago = String(fsd.type) === '20';
      var lowBalance = isPrepago && balance < 50;

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

// ─── buildPortfolioContext_ ───────────────────────────────────
// Puxar histórico semanal real de todos os clientes via Meta API
// (até 36 meses). Retorna string formatada para o prompt do Claude.
// Divide em lotes para não estourar o tempo de execução do Apps Script.
function buildPortfolioContext_(clients, token, maxMonths) {
  maxMonths = maxMonths || 36;

  // Data inicial: maxMonths atrás
  var startDate = new Date();
  startDate.setMonth(startDate.getMonth() - maxMonths);
  var startStr = startDate.toISOString().slice(0, 10);
  var endStr   = new Date().toISOString().slice(0, 10);

  var lines = ['=== HISTÓRICO REAL DE PERFORMANCE (últimos ' + maxMonths + ' meses, semana a semana) ==='];

  clients.forEach(function(client) {
    if (!client.criativoAccountId) return;
    try {
      var actId     = String(client.criativoAccountId).replace(/^act_/i, '');
      var acctParam = 'act_' + actId;

      // Puxar dados semanais (time_increment=7)
      var url = META_API_BASE + '/' + acctParam + '/insights'
        + '?level=account'
        + '&fields=spend,impressions,clicks,reach,actions,action_values,website_purchase_roas,purchase_roas,ctr,cpm,cpc,frequency'
        + '&time_increment=7'
        + '&time_range=' + encodeURIComponent(JSON.stringify({ since: startStr, until: endStr }))
        + '&limit=200'
        + '&access_token=' + token;

      var data = fetchAllPages_(url);
      if (!data || data.length === 0) {
        lines.push('\nCLIENTE: ' + client.name + ' — sem dados históricos disponíveis.');
        return;
      }

      lines.push('\nCLIENTE: ' + client.name + ' (conta ' + client.criativoAccountId + ')');

      data.forEach(function(ins) {
        var m = parseInsight_(ins);
        var spend = parseFloat(m.spend) || 0;
        if (spend <= 0) return; // pula semanas sem gasto

        var semana = (ins.date_start || '').slice(0, 10) + ' a ' + (ins.date_stop || '').slice(0, 10);
        var conv = (parseFloat(m.purchases) || 0) + (parseFloat(m.messages) || 0) + (parseFloat(m.leads) || 0);

        lines.push(
          semana +
          ' | Gasto: R$' + m.spend +
          ' | CPM: R$' + m.cpm +
          ' | CTR: ' + m.ctr + '%' +
          ' | CPC: R$' + m.cpc +
          ' | Freq: ' + m.frequency +
          ' | Conversões: ' + Math.round(conv) +
          (parseFloat(m.roas) > 0 ? ' | ROAS: ' + m.roas : '') +
          (parseFloat(m.leads) > 0 ? ' | Leads: ' + m.leads : '') +
          (parseFloat(m.messages) > 0 ? ' | Msgs: ' + m.messages : '') +
          (parseFloat(m.purchases) > 0 ? ' | Compras: ' + m.purchases : '')
        );
      });

    } catch(e) {
      lines.push('\nCLIENTE: ' + client.name + ' — erro ao buscar histórico: ' + e.message);
    }
  });

  return lines.join('\n');
}

// ─── buildCurrentMetrics_ ────────────────────────────────────
// Monta bloco de métricas recentes do cliente sendo analisado.
// objetivo é detectado PRIMEIRO a partir dos dados reais de m7.
function buildCurrentMetrics_(client) {
  function dateStr(daysAgo) {
    var d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0, 10);
  }
  var todayStr = dateStr(0);
  var m7  = getMetricsMeta(client.criativoAccountId, dateStr(7),  todayStr);
  var m14 = getMetricsMeta(client.criativoAccountId, dateStr(14), todayStr);
  var m30 = getMetricsMeta(client.criativoAccountId, dateStr(30), todayStr);

  // Detecta objetivo a partir dos dados reais ANTES de formatar
  var totals7  = m7.totals || {};
  var objetivo = detectObjetivo_(totals7, client.clientType);

  function fmtM(m) {
    if (m.error) return 'Erro: ' + m.error;
    var t = m.totals || {};
    // Mostra TODAS as conversões independente do objetivo detectado,
    // para não esconder dados reais do Claude
    var base = 'Gasto: R$' + t.spend + ' | CPM: R$' + t.cpm + ' | CTR: ' + t.ctr + '% | CPC: R$' + t.cpc + ' | Freq: ' + t.frequency;
    if (parseFloat(t.purchases) > 0) base += ' | Compras: ' + t.purchases + ' | Receita: R$' + t.purchaseValue + ' | ROAS: ' + t.roas;
    if (parseFloat(t.messages)  > 0) {
      var cpMsg = parseFloat(t.spend) > 0 && parseFloat(t.messages) > 0 ? 'R$' + (parseFloat(t.spend) / parseFloat(t.messages)).toFixed(2) : 'N/A';
      base += ' | Conversas: ' + t.messages + ' | Custo/conversa: ' + cpMsg;
    }
    if (parseFloat(t.leads) > 0) base += ' | Leads: ' + t.leads + ' | Custo/lead: R$' + t.cpa;
    if (parseFloat(t.purchases) === 0 && parseFloat(t.messages) === 0 && parseFloat(t.leads) === 0) {
      base += ' | Conversoes: 0 (campanha de trafego/alcance)';
    }
    return base;
  }

  var campaigns = (m7.campaigns || []).map(function(c) { return c.name; }).join(', ') || 'Nenhuma';
  return {
    metrics7:  fmtM(m7),
    metrics14: fmtM(m14),
    metrics30: fmtM(m30),
    campaigns: campaigns,
    totals7:   totals7,
    objetivo:  objetivo
  };
}

// ─── detectObjetivo_ ─────────────────────────────────────────
function detectObjetivo_(totals7, clientType) {
  if ((parseFloat(totals7.purchases) || 0) > 0) return 'ecommerce';
  if ((parseFloat(totals7.messages)  || 0) > 0) return 'messages';
  if ((parseFloat(totals7.leads)     || 0) > 0) return 'leads';
  var ct = String(clientType || '').toLowerCase();
  return ct === 'ecommerce' ? 'ecommerce' : 'messages';
}

// ─── buildClaudePrompts_ ─────────────────────────────────────
function buildClaudePrompts_(client, objetivo, current, portfolioContext) {
  var objetivoLabel = objetivo === 'ecommerce' ? 'E-commerce (KPI principal: Compras, ROAS, Receita)'
    : objetivo === 'messages' ? 'Mensagens/WhatsApp (KPI principal: Conversas iniciadas, Custo por conversa)'
    : 'Leads (KPI principal: Leads gerados, Custo por lead)';

  var systemPrompt =
    'Você é um especialista em mídia paga com acesso ao histórico REAL de performance de uma carteira de clientes.\n\n' +
    'Seu trabalho é analisar o cliente indicado, cruzar seus dados atuais com o histórico real de TODOS os clientes da carteira, ' +
    'identificar padrões que realmente aconteceram e fazer previsões baseadas nesses padrões concretos.\n\n' +
    'REGRAS DE OURO:\n' +
    '1. SIMILARIDADE HISTÓRICA: cite APENAS períodos e clientes que aparecem nos dados fornecidos. ' +
    'Se encontrar um padrão semelhante real, cite: "Semana de DD/MM/AAAA, cliente X tinha CPM R$X e CTR X% — resultado: [o que aconteceu na semana seguinte nos dados]". ' +
    'Se não houver similaridade real, escreva: Sem similaridade direta identificada nos dados disponíveis.\n' +
    '2. ALERTA: CRITÉRIO RIGOROSO — só escreva alerta se houver piora SUSTENTADA nas últimas 3 semanas consecutivas: ' +
    'CPM subindo semana a semana, OU CTR caindo semana a semana, OU ROAS caindo, OU frequência acima de 2.5. ' +
    'Variação pontual de 1 semana NAO é alerta. Campanha de trafego/alcance sem conversoes NAO é alerta (é o objetivo dela). ' +
    'Se a campanha estiver estavel, dentro da media historica, ou melhorando, escreva apenas a palavra: Nenhum\n' +
    '3. OBJETIVO DO CLIENTE: respeite o objetivo declarado — nao classifique como alerta a ausencia de um KPI que nao e o objetivo da campanha. ' +
    'Ex: campanha de mensagens sem leads NAO e problema. Campanha de ecommerce sem compras SIM e problema.\n' +
    '4. PROIBIDO: asteriscos (**), cerquilha (##), travessão decorativo (---), itálico, negrito, qualquer markdown. Apenas texto simples e o caractere • para listas.\n\n' +
    'Responda SEMPRE neste formato exato:\n\n' +
    'PADRÃO IDENTIFICADO: [1 linha descrevendo o que os dados mostram]\n' +
    'SIMILARIDADE HISTÓRICA: [cite período e cliente real dos dados, ou "Sem similaridade direta identificada"]\n' +
    'PREVISÃO 3 DIAS:\n• [previsão 1 baseada nos dados]\n• [previsão 2]\n• [previsão 3]\n' +
    'PREVISÃO 7 DIAS:\n• [previsão 1]\n• [previsão 2]\n' +
    'CONFIANÇA: [Alto/Médio/Baixo] — [1 frase justificando com base nos dados]\n' +
    '⚠️ ALERTA: [frase de alerta ou a palavra Nenhum]\n' +
    'AÇÃO AGORA:\n• [ação 1 com prazo]\n• [ação 2 com prazo]';

  var userPrompt =
    '=== CLIENTE A ANALISAR ===\n' +
    'Nome: ' + client.name + '\n' +
    'Objetivo: ' + objetivoLabel + '\n' +
    'Campanhas ativas: ' + current.campaigns + '\n\n' +
    'MÉTRICAS RECENTES:\n' +
    'Últimos 7 dias:  ' + current.metrics7  + '\n' +
    'Últimos 14 dias: ' + current.metrics14 + '\n' +
    'Últimos 30 dias: ' + current.metrics30 + '\n\n' +
    portfolioContext + '\n\n' +
    'Com base nos dados históricos reais acima, analise o cliente ' + client.name + ' e gere a previsão conforme o formato solicitado.';

  return { system: systemPrompt, user: userPrompt };
}

// ─── runPredictiveAI ─────────────────────────────────────────
// Roda toda segunda-feira via trigger.
// 1. Puxar histórico real de 36 meses de TODOS os clientes via Meta API
// 2. Para cada cliente: buscar métricas recentes + chamar Claude com contexto real
// 3. Salvar previsão na aba ai_insights
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

  Logger.log('[PredictiveAI] Puxando histórico real de ' + clients.length + ' clientes (36 meses)...');
  var portfolioContext = buildPortfolioContext_(clients, token, 36);
  Logger.log('[PredictiveAI] Contexto montado: ' + portfolioContext.length + ' caracteres');

  var sh = getSheet('ai_insights');
  if (sh.getLastRow() === 0) sh.appendRow(['id', 'clientId', 'period', 'insight', 'createdAt']);

  clients.forEach(function(client) {
    try {
      Logger.log('[PredictiveAI] Analisando: ' + client.name);

      var current  = buildCurrentMetrics_(client);
      var objetivo = current.objetivo;
      var prompts  = buildClaudePrompts_(client, objetivo, current, portfolioContext);

      var claudeResp = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': claudeApiKey, 'anthropic-version': '2023-06-01' },
        payload: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 1200,
          system: prompts.system,
          messages: [{ role: 'user', content: prompts.user }]
        }),
        muteHttpExceptions: true
      });

      var claudeData  = JSON.parse(claudeResp.getContentText());
      var insightText = (claudeData.content && claudeData.content[0]) ? claudeData.content[0].text : '';

      if (!insightText) { Logger.log('[PredictiveAI] Claude sem resposta para ' + client.name); return; }

      sh.appendRow([genId(), client.id, 'predictive', insightText, new Date().toISOString()]);
      Logger.log('[PredictiveAI] Previsão salva para ' + client.name);
      Utilities.sleep(1000);

    } catch(err) {
      Logger.log('[PredictiveAI] Erro em ' + client.name + ': ' + err.message);
    }
  });

  Logger.log('[PredictiveAI] Concluído para ' + clients.length + ' clientes');
}

// ─── runPredictiveAINow ──────────────────────────────────────
// Versão manual, acionada pelo botão "Gerar agora" no CRM.
function runPredictiveAINow() {
  var claudeApiKey = PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');
  if (!claudeApiKey) return { error: 'CLAUDE_API_KEY não configurada nas propriedades do script.' };

  var token = PropertiesService.getScriptProperties().getProperty('META_TOKEN');
  if (!token) return { error: 'META_TOKEN não configurado nas propriedades do script.' };

  var clients = sheetToObjects(getSheet('clients')).filter(function(c) {
    return c.criativoAccountId && !c.cancelado && c.cancelado !== 'TRUE';
  });
  if (clients.length === 0) return { error: 'Nenhum cliente com conta Meta vinculada.' };

  Logger.log('[PredictiveAI Manual] Puxando histórico real de ' + clients.length + ' clientes (36 meses)...');
  var portfolioContext = buildPortfolioContext_(clients, token, 36);
  Logger.log('[PredictiveAI Manual] Contexto: ' + portfolioContext.length + ' caracteres');

  var sh = getSheet('ai_insights');
  if (sh.getLastRow() === 0) sh.appendRow(['id', 'clientId', 'period', 'insight', 'createdAt']);

  var processed = 0;
  var errors    = [];

  clients.forEach(function(client) {
    try {
      var current  = buildCurrentMetrics_(client);
      var objetivo = current.objetivo;
      var prompts  = buildClaudePrompts_(client, objetivo, current, portfolioContext);

      var claudeResp = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': claudeApiKey, 'anthropic-version': '2023-06-01' },
        payload: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 1200,
          system: prompts.system,
          messages: [{ role: 'user', content: prompts.user }]
        }),
        muteHttpExceptions: true
      });

      var claudeData  = JSON.parse(claudeResp.getContentText());
      var insightText = (claudeData.content && claudeData.content[0]) ? claudeData.content[0].text : '';

      if (insightText) {
        sh.appendRow([genId(), client.id, 'predictive', insightText, new Date().toISOString()]);
        processed++;
        Logger.log('[PredictiveAI Manual] Previsão salva para ' + client.name);
      }

      Utilities.sleep(1000);

    } catch(err) {
      errors.push(client.name + ': ' + err.message);
      Logger.log('[PredictiveAI Manual] Erro em ' + client.name + ': ' + err.message);
    }
  });

  return { ok: true, processed: processed, total: clients.length, errors: errors };
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
