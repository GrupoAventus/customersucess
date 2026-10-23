// AventusCS_ - Apps Script Backend
// Planilha ID: 1ttsXryaCcd2DSLEAZOfWjubg2DeCf4SO-CWDuhm_zOM

var SHEET_ID = '1ttsXryaCcd2DSLEAZOfWjubg2DeCf4SO-CWDuhm_zOM';
var EVOLUTION_API = 'https://evolution-api-production-73dff.up.railway.app';
var EVOLUTION_INSTANCE = 'aventuscs';
var EVOLUTION_KEY = 'aventus2024';
var WHATSAPP_MANAGER = '5541999999999'; // Número do gestor para relatórios

// ===================== doGet =====================
function doGet(e) {
  var p = e.parameter || {};
  var action = p.action || '';
  var out;

  try {
    if (action === 'getClients')         out = getClients();
    else if (action === 'getDemands')    out = getDemands();
    else if (action === 'getPending')    out = getPending();
    else if (action === 'getTimeline')   out = getTimeline();
    else if (action === 'getReports')    out = getReports();
    else if (action === 'getAgenda')     out = getAgenda();
    else if (action === 'getAlerts')     out = getAlerts();
    else if (action === 'getPipeline')   out = getPipeline();
    else if (action === 'getMetrics')    out = getMetrics(p.accountId, p.startDate, p.endDate);
    else if (action === 'getMetricsHistory') out = getMetricsHistory(p.clientId);
    else if (action === 'getAiInsights') out = getAiInsights();
    else if (action === 'getCriativoAccounts') out = getCriativoAccounts();
    else out = { error: 'Unknown action: ' + action };
  } catch(err) {
    out = { error: err.message };
  }

  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===================== doPost =====================
function doPost(e) {
  var body = JSON.parse(e.postData.contents);
  var action = body.action || '';
  var out;

  try {
    if (action === 'addClient')           out = addClient(body);
    else if (action === 'updateClient')   out = updateClientData(body);
    else if (action === 'updateClientStatus') out = updateClientStatus(body);
    else if (action === 'updateClientNotes')  out = updateClientNotes(body);
    else if (action === 'setClientPriority')  out = setClientPriority(body);
    else if (action === 'setClientFinance')   out = setClientFinance(body);
    else if (action === 'setClientCard')      out = setClientCard(body);
    else if (action === 'cancelClient')       out = cancelClient(body);
    else if (action === 'deleteClient')       out = deleteClient(body);
    else if (action === 'incrementSocialPost') out = incrementSocialPost(body);
    else if (action === 'addDemand')          out = addDemand(body);
    else if (action === 'toggleDemand')       out = toggleDemand(body);
    else if (action === 'deleteDemand')       out = deleteDemand(body);
    else if (action === 'markPendingDone')    out = markPendingDone(body);
    else if (action === 'setTimelineEntry')   out = setTimelineEntry(body);
    else if (action === 'addReport')          out = addReport(body);
    else if (action === 'deleteReport')       out = deleteReport(body);
    else if (action === 'addAgenda')          out = addAgenda(body);
    else if (action === 'toggleAgenda')       out = toggleAgenda(body);
    else if (action === 'deleteAgenda')       out = deleteAgenda(body);
    else if (action === 'addAlert')           out = addAlert(body);
    else if (action === 'dismissAlert')       out = dismissAlert(body);
    else if (action === 'setPipelineStep')    out = setPipelineStep(body);
    else if (action === 'saveAiInsight')      out = saveAiInsight(body);
    else out = { error: 'Unknown action: ' + action };
  } catch(err) {
    out = { error: err.message };
  }

  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===================== HELPERS =====================
function getSheet(name) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  return sh;
}

function sheetToObjects(sh) {
  var data = sh.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  return data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
}

function findRowById(sh, id) {
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) return i + 1; // 1-indexed
  }
  return -1;
}

function genId() {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

// ===================== CLIENTS =====================
// Colunas: id, name, drive, instagram, site, entrou, destino, createdAt,
// destinos, ccLP, ccEcom, ccSocial, socialPosts, socialWeek,
// status, observacoes, cancelado, rechargeAmount, dailySpend, lastRecharge,
// priorityStatus, statusChangedAt, hasCard, whatsappGroup, whatsappGroupName,
// criativoAccountId(AB=col26), clientType(AC=col27)

function getClients() {
  return sheetToObjects(getSheet('clients'));
}

function addClient(body) {
  var sh = getSheet('clients');
  var id = genId();
  var now = new Date().toISOString();
  sh.appendRow([
    id, body.name||'', body.drive||'', body.instagram||'', body.site||'',
    body.entrou||'', body.destino||'', now,
    JSON.stringify(body.destinos||[]),
    body.ccLP||'', body.ccEcom||'', body.ccSocial||'',
    0, '', // socialPosts, socialWeek
    body.status||'Pegar acessos', body.observacoes||'', false,
    body.rechargeAmount||0, body.dailySpend||0,
    body.lastRecharge||now.slice(0,10),
    body.priorityStatus||'estavel',
    body.statusChangedAt||now.slice(0,10),
    body.hasCard||false,
    body.whatsappGroup||'', body.whatsappGroupName||'',
    body.criativoAccountId||'', body.clientType||''
  ]);
  return { id: id };
}

function updateClientData(body) {
  var sh = getSheet('clients');
  var row = findRowById(sh, body.id);
  if (row < 0) return { error: 'Not found' };
  sh.getRange(row, 2).setValue(body.name||'');
  sh.getRange(row, 3).setValue(body.drive||'');
  sh.getRange(row, 4).setValue(body.instagram||'');
  sh.getRange(row, 5).setValue(body.site||'');
  sh.getRange(row, 6).setValue(body.entrou||'');
  sh.getRange(row, 7).setValue(body.destino||'');
  sh.getRange(row, 9).setValue(JSON.stringify(body.destinos||[]));
  sh.getRange(row, 10).setValue(body.ccLP||'');
  sh.getRange(row, 11).setValue(body.ccEcom||'');
  sh.getRange(row, 12).setValue(body.ccSocial||'');
  sh.getRange(row, 25).setValue(body.whatsappGroup||'');
  sh.getRange(row, 26).setValue(body.whatsappGroupName||'');
  // AB=28, AC=29 (1-indexed no getRange)
  sh.getRange(row, 28).setValue(body.criativoAccountId||'');
  sh.getRange(row, 29).setValue(body.clientType||'');
  return { ok: true };
}

function updateClientStatus(body) {
  var sh = getSheet('clients');
  var row = findRowById(sh, body.id);
  if (row < 0) return { error: 'Not found' };
  sh.getRange(row, 15).setValue(body.status);
  sh.getRange(row, 22).setValue(body.statusChangedAt||new Date().toISOString().slice(0,10));
  return { ok: true };
}

function updateClientNotes(body) {
  var sh = getSheet('clients');
  var row = findRowById(sh, body.id);
  if (row < 0) return { error: 'Not found' };
  sh.getRange(row, 16).setValue(body.observacoes||'');
  return { ok: true };
}

function setClientPriority(body) {
  var sh = getSheet('clients');
  var row = findRowById(sh, body.id);
  if (row < 0) return { error: 'Not found' };
  sh.getRange(row, 21).setValue(body.priorityStatus);
  return { ok: true };
}

function setClientFinance(body) {
  var sh = getSheet('clients');
  var row = findRowById(sh, body.id);
  if (row < 0) return { error: 'Not found' };
  sh.getRange(row, 18).setValue(body.rechargeAmount||0);
  sh.getRange(row, 19).setValue(body.dailySpend||0);
  sh.getRange(row, 20).setValue(body.lastRecharge||'');
  return { ok: true };
}

function setClientCard(body) {
  var sh = getSheet('clients');
  var row = findRowById(sh, body.id);
  if (row < 0) return { error: 'Not found' };
  sh.getRange(row, 23).setValue(body.hasCard);
  return { ok: true };
}

function cancelClient(body) {
  var sh = getSheet('clients');
  var row = findRowById(sh, body.id);
  if (row < 0) return { error: 'Not found' };
  sh.getRange(row, 17).setValue(body.cancelado);
  return { ok: true };
}

function deleteClient(body) {
  var sh = getSheet('clients');
  var row = findRowById(sh, body.id);
  if (row < 0) return { error: 'Not found' };
  sh.deleteRow(row);
  return { ok: true };
}

function incrementSocialPost(body) {
  var sh = getSheet('clients');
  var row = findRowById(sh, body.id);
  if (row < 0) return { error: 'Not found' };
  var currentPosts = sh.getRange(row, 13).getValue() || 0;
  var currentWeek = getCurrentWeek();
  var sheetWeek = sh.getRange(row, 14).getValue() || '';
  if (sheetWeek !== currentWeek) {
    currentPosts = 0;
    sh.getRange(row, 14).setValue(currentWeek);
  }
  sh.getRange(row, 13).setValue(currentPosts + 1);
  return { ok: true };
}

function getCurrentWeek() {
  var now = new Date();
  var onejan = new Date(now.getFullYear(), 0, 1);
  var week = Math.ceil((((now - onejan) / 86400000) + onejan.getDay() + 1) / 7);
  return now.getFullYear() + '-W' + week;
}

// ===================== DEMANDS =====================
function getDemands() {
  return sheetToObjects(getSheet('demands'));
}

function addDemand(body) {
  var sh = getSheet('demands');
  var id = genId();
  var now = new Date().toISOString();
  sh.appendRow([id, body.clientId||'', body.text||'', body.prazo||'', body.dest||'', false, now]);
  return { id: id };
}

function toggleDemand(body) {
  var sh = getSheet('demands');
  var row = findRowById(sh, body.id);
  if (row < 0) return { error: 'Not found' };
  sh.getRange(row, 6).setValue(body.done);
  return { ok: true };
}

function deleteDemand(body) {
  var sh = getSheet('demands');
  var row = findRowById(sh, body.id);
  if (row < 0) return { error: 'Not found' };
  sh.deleteRow(row);
  return { ok: true };
}

// ===================== PENDING SALES =====================
function getPending() {
  return sheetToObjects(getSheet('pending_sales'));
}

function markPendingDone(body) {
  var sh = getSheet('pending_sales');
  var row = findRowById(sh, body.id);
  if (row < 0) return { error: 'Not found' };
  sh.getRange(row, 3).setValue('feito');
  return { ok: true };
}

// ===================== TIMELINE =====================
function getTimeline() {
  return sheetToObjects(getSheet('timeline'));
}

function setTimelineEntry(body) {
  var sh = getSheet('timeline');
  var data = sh.getDataRange().getValues();
  var targetDate = String(body.date).slice(0, 10);
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(body.clientId) && String(data[i][1]).slice(0, 10) === targetDate) {
      sh.getRange(i + 1, 3).setValue(body.done||'');
      sh.getRange(i + 1, 4).setValue(body.feedback||'');
      return { ok: true };
    }
  }
  sh.appendRow([body.clientId, targetDate, body.done||'', body.feedback||'']);
  return { ok: true };
}

// ===================== REPORTS =====================
function getReports() {
  return sheetToObjects(getSheet('reports'));
}

function addReport(body) {
  var sh = getSheet('reports');
  var id = genId();
  var now = new Date().toISOString();
  sh.appendRow([id, body.clientId||'', body.date||'', body.time||'', body.notes||'', now]);
  return { id: id };
}

function deleteReport(body) {
  var sh = getSheet('reports');
  var row = findRowById(sh, body.id);
  if (row < 0) return { error: 'Not found' };
  sh.deleteRow(row);
  return { ok: true };
}

// ===================== AGENDA =====================
function getAgenda() {
  return sheetToObjects(getSheet('agenda'));
}

function addAgenda(body) {
  var sh = getSheet('agenda');
  var id = genId();
  var now = new Date().toISOString();
  sh.appendRow([id, body.text||'', body.prazo||'', body.responsavel||'', false, now]);
  return { id: id };
}

function toggleAgenda(body) {
  var sh = getSheet('agenda');
  var row = findRowById(sh, body.id);
  if (row < 0) return { error: 'Not found' };
  sh.getRange(row, 5).setValue(body.done);
  return { ok: true };
}

function deleteAgenda(body) {
  var sh = getSheet('agenda');
  var row = findRowById(sh, body.id);
  if (row < 0) return { error: 'Not found' };
  sh.deleteRow(row);
  return { ok: true };
}

// ===================== ALERTS =====================
function getAlerts() {
  return sheetToObjects(getSheet('alerts'));
}

function addAlert(body) {
  var sh = getSheet('alerts');
  var id = genId();
  var now = new Date().toISOString();
  sh.appendRow([id, body.message||'', JSON.stringify(body.sections||[]), body.type||'manual', true, now]);
  return { id: id };
}

function dismissAlert(body) {
  var sh = getSheet('alerts');
  var row = findRowById(sh, body.id);
  if (row < 0) return { error: 'Not found' };
  sh.getRange(row, 5).setValue(false);
  return { ok: true };
}

// ===================== PIPELINE =====================
function getPipeline() {
  return sheetToObjects(getSheet('pipeline'));
}

function setPipelineStep(body) {
  var sh = getSheet('pipeline');
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(body.clientId) && String(data[i][1]) === String(body.step)) {
      sh.getRange(i + 1, 3).setValue(body.done);
      sh.getRange(i + 1, 4).setValue(body.doneAt||'');
      sh.getRange(i + 1, 5).setValue(body.note||'');
      return { ok: true };
    }
  }
  sh.appendRow([body.clientId, body.step, body.done, body.doneAt||'', body.note||'']);
  return { ok: true };
}

// ===================== METRICS (Fase B) =====================
// Aba metrics_history: id, clientId, accountId, date, campaigns_json, insights_json, createdAt

function getMetrics(accountId, startDate, endDate) {
  // Busca métricas do histórico salvo na planilha (metrics_history)
  // O collectDailyMetrics roda todo dia e salva os dados lá
  if (!accountId) return { error: 'accountId required' };

  try {
    var sh = getSheet('metrics_history');
    var data = sh.getDataRange().getValues();
    if (data.length < 2) return { campaigns: [], insights: [], daily: [], info: 'Sem dados históricos ainda. Os dados são coletados diariamente.' };

    var headers = data[0];
    var rows = data.slice(1).filter(function(row) {
      var rowAccountId = String(row[headers.indexOf('accountId')] || '');
      var rowDate = String(row[headers.indexOf('date')] || '').slice(0, 10);
      return rowAccountId === String(accountId) &&
             (!startDate || rowDate >= startDate) &&
             (!endDate || rowDate <= endDate);
    });

    if (rows.length === 0) return { campaigns: [], insights: [], daily: [], info: 'Nenhum dado no período. Os dados são coletados diariamente pelo trigger automático.' };

    // Agregar campanhas e insights de todos os dias do período
    var campaignMap = {};
    var dailyTotals = [];

    rows.forEach(function(row) {
      var obj = {};
      headers.forEach(function(h, i) { obj[h] = row[i]; });

      var date = String(obj.date || '').slice(0, 10);
      var campaignsJson = obj.campaigns_json || '[]';
      var insightsJson = obj.insights_json || '[]';

      var campaigns = [];
      var insights = [];
      try { campaigns = JSON.parse(campaignsJson); } catch(e) {}
      try { insights = JSON.parse(insightsJson); } catch(e) {}

      // Agregar por campanha
      campaigns.forEach(function(c) {
        if (!campaignMap[c.id]) {
          campaignMap[c.id] = { id: c.id, name: c.name, status: c.status, spend: 0, impressions: 0, clicks: 0, leads: 0, purchases: 0 };
        }
        var ins = insights.find(function(i) { return i.campaign_id === c.id; }) || {};
        campaignMap[c.id].spend       += parseFloat(ins.spend || 0);
        campaignMap[c.id].impressions += parseInt(ins.impressions || 0);
        campaignMap[c.id].clicks      += parseInt(ins.clicks || 0);
        campaignMap[c.id].leads       += parseInt(ins.leads || 0);
        campaignMap[c.id].purchases   += parseInt(ins.purchases || 0);
      });

      // Totais diários para gráfico
      var dayTotal = { date: date, spend: 0, impressions: 0, clicks: 0 };
      insights.forEach(function(ins) {
        dayTotal.spend       += parseFloat(ins.spend || 0);
        dayTotal.impressions += parseInt(ins.impressions || 0);
        dayTotal.clicks      += parseInt(ins.clicks || 0);
      });
      dailyTotals.push(dayTotal);
    });

    var campaignsList = Object.values(campaignMap);

    // Montar insights agregados
    var aggregatedInsights = campaignsList.map(function(c) {
      var totalSpend = c.spend || 0;
      var totalClicks = c.clicks || 0;
      var totalImpressions = c.impressions || 0;
      return {
        campaign_id: c.id,
        spend: totalSpend.toFixed(2),
        impressions: String(totalImpressions),
        clicks: String(totalClicks),
        ctr: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0',
        cpm: totalImpressions > 0 ? ((totalSpend / totalImpressions) * 1000).toFixed(2) : '0',
        cpc: totalClicks > 0 ? (totalSpend / totalClicks).toFixed(2) : '0',
        leads: String(c.leads || 0),
        purchases: String(c.purchases || 0),
        roas: '0',
        cpa: (c.leads + c.purchases) > 0 ? (totalSpend / (c.leads + c.purchases)).toFixed(2) : '0'
      };
    });

    return {
      campaigns: campaignsList,
      insights: aggregatedInsights,
      daily: dailyTotals.sort(function(a, b) { return a.date.localeCompare(b.date); }),
      period: { start: startDate, end: endDate, days: rows.length }
    };

  } catch(err) {
    return { error: err.message };
  }
}

function getMetricsHistory(clientId) {
  var sh = getSheet('metrics_history');
  var data = sh.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  return data.slice(1)
    .filter(function(row) { return String(row[1]) === String(clientId); })
    .map(function(row) {
      var obj = {};
      headers.forEach(function(h, i) { obj[h] = row[i]; });
      return obj;
    });
}

function collectDailyMetrics() {
  // Busca métricas de todos os clientes com criativoAccountId e salva em metrics_history
  var clients = sheetToObjects(getSheet('clients'));
  var today = new Date();
  var yesterday = new Date(today.getTime() - 86400000);
  var dateStr = yesterday.toISOString().slice(0, 10);

  var criativoToken = PropertiesService.getScriptProperties().getProperty('CRIATIVIVO_TOKEN');
  if (!criativoToken) {
    Logger.log('CRIATIVIVO_TOKEN não configurado');
    return;
  }

  var sh = getSheet('metrics_history');
  // Criar cabeçalho se não existir
  if (sh.getLastRow() === 0) {
    sh.appendRow(['id', 'clientId', 'accountId', 'date', 'campaigns_json', 'insights_json', 'createdAt']);
  }

  clients.forEach(function(client) {
    if (!client.criativoAccountId || client.cancelado === true || client.cancelado === 'TRUE') return;

    try {
      var url = 'https://criativivo.com.br/api/meta/campaigns?account_id=' + client.criativoAccountId +
                '&since=' + dateStr + '&until=' + dateStr;
      var resp = UrlFetchApp.fetch(url, {
        headers: { 'Authorization': 'Bearer ' + criativoToken },
        muteHttpExceptions: true
      });
      var json = JSON.parse(resp.getContentText());

      var id = genId();
      var now = new Date().toISOString();
      sh.appendRow([
        id, client.id, client.criativoAccountId, dateStr,
        JSON.stringify(json.campaigns || []),
        JSON.stringify(json.insights || []),
        now
      ]);

      Logger.log('Métricas coletadas para: ' + client.name);
    } catch(err) {
      Logger.log('Erro ao coletar métricas para ' + client.name + ': ' + err.message);
    }
  });
}

// ===================== WHATSAPP (Fase B) =====================
function sendWhatsApp(number, message) {
  var url = EVOLUTION_API + '/message/sendText/' + EVOLUTION_INSTANCE;
  var payload = {
    number: number,
    text: message
  };

  try {
    UrlFetchApp.fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_KEY
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  } catch(err) {
    Logger.log('Erro WhatsApp para ' + number + ': ' + err.message);
  }
}

function sendDailyReport() {
  var clients = sheetToObjects(getSheet('clients'));
  var today = new Date();
  var dateDisplay = today.toLocaleDateString('pt-BR');
  var yesterday = new Date(today.getTime() - 86400000);
  var yesterdayStr = yesterday.toISOString().slice(0, 10);

  var criativoToken = PropertiesService.getScriptProperties().getProperty('CRIATIVIVO_TOKEN');
  if (!criativoToken) {
    Logger.log('CRIATIVIVO_TOKEN não configurado');
    return;
  }

  // Para cada cliente ativo com criativoAccountId E whatsappGroup, envia relatório individual no grupo dele
  var activeClients = clients.filter(function(c) {
    return c.status === 'Campanha ativa' &&
           c.criativoAccountId &&
           c.whatsappGroup &&
           c.cancelado !== true && c.cancelado !== 'TRUE';
  });

  if (activeClients.length === 0) {
    Logger.log('Nenhum cliente ativo com conta Criativivo e grupo WhatsApp configurados');
    return;
  }

  var sent = 0;
  activeClients.forEach(function(client) {
    try {
      var url = 'https://criativivo.com.br/api/meta/campaigns?account_id=' + client.criativoAccountId +
                '&since=' + yesterdayStr + '&until=' + yesterdayStr;
      var resp = UrlFetchApp.fetch(url, {
        headers: { 'Authorization': 'Bearer ' + criativoToken },
        muteHttpExceptions: true
      });
      var data = JSON.parse(resp.getContentText());
      var insights = data.insights || [];

      var spend = insights.reduce(function(s, i) { return s + (parseFloat(i.spend) || 0); }, 0);
      var impressions = insights.reduce(function(s, i) { return s + (parseInt(i.impressions) || 0); }, 0);
      var clicks = insights.reduce(function(s, i) { return s + (parseInt(i.clicks) || 0); }, 0);

      var clientType = client.clientType || 'lead';
      var extraLine = '';

      if (clientType === 'ecommerce') {
        var purchases = insights.reduce(function(s, i) {
          var acts = i.actions || [];
          var p = acts.find(function(a) { return a.action_type === 'offsite_conversion.fb_pixel_purchase'; });
          return s + (p ? parseFloat(p.value) : 0);
        }, 0);
        var revenue = insights.reduce(function(s, i) {
          var vals = i.action_values || [];
          var r = vals.find(function(a) { return a.action_type === 'offsite_conversion.fb_pixel_purchase'; });
          return s + (r ? parseFloat(r.value) : 0);
        }, 0);
        var roas = spend > 0 ? (revenue / spend).toFixed(2) : '0';
        extraLine = '🛒 Compras: ' + purchases + ' | ROAS: ' + roas + 'x';
      } else {
        var leads = insights.reduce(function(s, i) {
          var acts = i.actions || [];
          var l = acts.find(function(a) { return a.action_type === 'lead' || a.action_type === 'onsite_conversion.messaging_conversation_started_7d'; });
          return s + (l ? parseInt(l.value) : 0);
        }, 0);
        var cpl = leads > 0 ? 'R$' + (spend / leads).toFixed(2) : '—';
        extraLine = '📲 Leads: ' + leads + ' | CPL: ' + cpl;
      }

      var lines = [
        '📊 *Relatório Diário — ' + dateDisplay + '*',
        '',
        '💰 Gasto ontem: *R$' + spend.toFixed(2) + '*',
        '👁 Impressões: ' + impressions.toLocaleString('pt-BR'),
        '🖱 Cliques: ' + clicks
      ];
      if (extraLine) lines.push(extraLine);
      lines.push('');
      lines.push('_AventusCS_ · relatório automático_');

      sendWhatsApp(client.whatsappGroup, lines.join('\n'));
      sent++;
    } catch(err) {
      Logger.log('Erro relatório diário ' + client.name + ': ' + err.message);
    }
  });

  Logger.log('Relatório diário enviado para ' + sent + ' grupos de clientes');
}

function sendWeeklyReport() {
  var today = new Date();
  var dayOfWeek = today.getDay(); // 0=Dom, 1=Seg, ..., 6=Sab
  if (dayOfWeek !== 1) {
    Logger.log('Relatório semanal só roda às segundas-feiras');
    return;
  }

  var clients = sheetToObjects(getSheet('clients'));
  var criativoToken = PropertiesService.getScriptProperties().getProperty('CRIATIVIVO_TOKEN');
  if (!criativoToken) return;

  // Última semana: segunda passada a domingo passado
  var lastMonday = new Date(today.getTime() - 7 * 86400000);
  var lastSunday = new Date(today.getTime() - 1 * 86400000);
  var sinceStr = lastMonday.toISOString().slice(0, 10);
  var untilStr = lastSunday.toISOString().slice(0, 10);
  var periodLabel = lastMonday.toLocaleDateString('pt-BR') + ' a ' + lastSunday.toLocaleDateString('pt-BR');

  // Para cada cliente com criativoAccountId E whatsappGroup, envia relatório semanal individual no grupo dele
  var activeClients = clients.filter(function(c) {
    return c.criativoAccountId &&
           c.whatsappGroup &&
           c.cancelado !== true && c.cancelado !== 'TRUE';
  });

  if (activeClients.length === 0) {
    Logger.log('Nenhum cliente com conta Criativivo e grupo WhatsApp configurados');
    return;
  }

  var sent = 0;
  activeClients.forEach(function(client) {
    try {
      var url = 'https://criativivo.com.br/api/meta/campaigns?account_id=' + client.criativoAccountId +
                '&since=' + sinceStr + '&until=' + untilStr;
      var resp = UrlFetchApp.fetch(url, {
        headers: { 'Authorization': 'Bearer ' + criativoToken },
        muteHttpExceptions: true
      });
      var data = JSON.parse(resp.getContentText());
      var insights = data.insights || [];

      var spend = insights.reduce(function(s, i) { return s + (parseFloat(i.spend) || 0); }, 0);
      var impressions = insights.reduce(function(s, i) { return s + (parseInt(i.impressions) || 0); }, 0);
      var clicks = insights.reduce(function(s, i) { return s + (parseInt(i.clicks) || 0); }, 0);
      var reach = insights.reduce(function(s, i) { return s + (parseInt(i.reach) || 0); }, 0);
      var ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) + '%' : '—';

      var clientType = client.clientType || 'lead';
      var extraLine = '';

      if (clientType === 'ecommerce') {
        var purchases = insights.reduce(function(s, i) {
          var acts = i.actions || [];
          var p = acts.find(function(a) { return a.action_type === 'offsite_conversion.fb_pixel_purchase'; });
          return s + (p ? parseFloat(p.value) : 0);
        }, 0);
        var revenue = insights.reduce(function(s, i) {
          var vals = i.action_values || [];
          var r = vals.find(function(a) { return a.action_type === 'offsite_conversion.fb_pixel_purchase'; });
          return s + (r ? parseFloat(r.value) : 0);
        }, 0);
        var roas = spend > 0 ? (revenue / spend).toFixed(2) : '0';
        extraLine = '🛒 Compras: ' + purchases + ' | ROAS: ' + roas + 'x';
      } else {
        var leads = insights.reduce(function(s, i) {
          var acts = i.actions || [];
          var l = acts.find(function(a) { return a.action_type === 'lead' || a.action_type === 'onsite_conversion.messaging_conversation_started_7d'; });
          return s + (l ? parseInt(l.value) : 0);
        }, 0);
        var cpl = leads > 0 ? 'R$' + (spend / leads).toFixed(2) : '—';
        extraLine = '📲 Leads: ' + leads + ' | CPL: ' + cpl;
      }

      var lines = [
        '📈 *Relatório Semanal*',
        '_' + periodLabel + '_',
        '',
        '💰 Investimento: *R$' + spend.toFixed(2) + '*',
        '👥 Alcance: ' + reach.toLocaleString('pt-BR'),
        '👁 Impressões: ' + impressions.toLocaleString('pt-BR'),
        '🖱 Cliques: ' + clicks + ' | CTR: ' + ctr
      ];
      if (extraLine) lines.push(extraLine);
      lines.push('');
      lines.push('Status: ' + (client.status || '—'));
      lines.push('_AventusCS_ · relatório automático_');

      sendWhatsApp(client.whatsappGroup, lines.join('\n'));
      sent++;
    } catch(err) {
      Logger.log('Erro relatório semanal ' + client.name + ': ' + err.message);
    }
  });

  Logger.log('Relatório semanal enviado para ' + sent + ' grupos de clientes');
}

function sendSnapshotNoon() {
  sendSnapshot('meio-dia');
}

function sendSnapshotEvening() {
  sendSnapshot('fim de tarde');
}

function sendSnapshot(period) {
  var clients = sheetToObjects(getSheet('clients'));
  var criativoToken = PropertiesService.getScriptProperties().getProperty('CRIATIVIVO_TOKEN');

  if (!criativoToken) return;

  var today = new Date().toISOString().slice(0, 10);

  // Para cada cliente ativo com criativoAccountId E whatsappGroup, envia snapshot individual no grupo dele
  var activeClients = clients.filter(function(c) {
    return c.status === 'Campanha ativa' &&
           c.criativoAccountId &&
           c.whatsappGroup &&
           c.cancelado !== true && c.cancelado !== 'TRUE';
  });

  if (activeClients.length === 0) return;

  var sent = 0;
  activeClients.forEach(function(client) {
    try {
      var url = 'https://criativivo.com.br/api/meta/campaigns?account_id=' + client.criativoAccountId +
                '&since=' + today + '&until=' + today;
      var resp = UrlFetchApp.fetch(url, {
        headers: { 'Authorization': 'Bearer ' + criativoToken },
        muteHttpExceptions: true
      });
      var data = JSON.parse(resp.getContentText());
      var insights = data.insights || [];

      var spend = insights.reduce(function(s, i) { return s + (parseFloat(i.spend) || 0); }, 0);
      var impressions = insights.reduce(function(s, i) { return s + (parseInt(i.impressions) || 0); }, 0);
      var clicks = insights.reduce(function(s, i) { return s + (parseInt(i.clicks) || 0); }, 0);

      var clientType = client.clientType || 'lead';
      var extraLine = '';

      if (clientType === 'ecommerce') {
        var purchases = insights.reduce(function(s, i) {
          var acts = i.actions || [];
          var p = acts.find(function(a) { return a.action_type === 'offsite_conversion.fb_pixel_purchase'; });
          return s + (p ? parseFloat(p.value) : 0);
        }, 0);
        var revenue = insights.reduce(function(s, i) {
          var vals = i.action_values || [];
          var r = vals.find(function(a) { return a.action_type === 'offsite_conversion.fb_pixel_purchase'; });
          return s + (r ? parseFloat(r.value) : 0);
        }, 0);
        var roas = spend > 0 ? (revenue / spend).toFixed(2) : '0';
        extraLine = '🛒 Compras: ' + purchases + ' | ROAS: ' + roas + 'x';
      } else {
        var leads = insights.reduce(function(s, i) {
          var acts = i.actions || [];
          var l = acts.find(function(a) { return a.action_type === 'lead' || a.action_type === 'onsite_conversion.messaging_conversation_started_7d'; });
          return s + (l ? parseInt(l.value) : 0);
        }, 0);
        var cpl = leads > 0 ? 'R$' + (spend / leads).toFixed(2) : '—';
        extraLine = '📲 Leads: ' + leads + ' | CPL: ' + cpl;
      }

      var message = '⚡ *Snapshot ' + period + '*\n\n' +
        '💰 Gasto hoje: *R$' + spend.toFixed(2) + '*\n' +
        '👁 Impressões: ' + impressions.toLocaleString('pt-BR') + '\n' +
        '🖱 Cliques: ' + clicks +
        (extraLine ? '\n' + extraLine : '') + '\n\n' +
        '_AventusCS_ · atualização automática_';

      sendWhatsApp(client.whatsappGroup, message);
      sent++;
    } catch(err) {
      Logger.log('Erro snapshot ' + period + ' ' + client.name + ': ' + err.message);
    }
  });

  Logger.log('Snapshot ' + period + ' enviado para ' + sent + ' grupos de clientes');
}

function checkBalanceAndStatus() {
  var clients = sheetToObjects(getSheet('clients'));
  var today = new Date();
  var sent = 0;

  // Para cada cliente ativo com whatsappGroup, verifica saldo e envia alerta diretamente no grupo dele
  clients.forEach(function(client) {
    if (client.cancelado === true || client.cancelado === 'TRUE') return;
    if (client.status !== 'Campanha ativa') return;
    if (!client.whatsappGroup) return;

    var recharge = parseFloat(client.rechargeAmount) || 0;
    var daily = parseFloat(client.dailySpend) || 0;
    var lastRechargeStr = client.lastRecharge || today.toISOString().slice(0,10);
    var lastRecharge = new Date(lastRechargeStr);
    var days = Math.floor((today - lastRecharge) / 86400000);
    var saldo = Math.max(0, recharge - daily * days);

    // Alerta: saldo vai acabar em menos de 3 dias
    if (daily > 0 && saldo < daily * 3) {
      var diasRestantes = Math.floor(saldo / daily);
      var message = '🚨 *Alerta de Saldo — AventusCS_*\n\n' +
        '⚠️ Saldo estimado: *R$' + saldo.toFixed(2) + '*\n' +
        '📅 Dias restantes: *' + diasRestantes + ' dia' + (diasRestantes !== 1 ? 's' : '') + '*\n\n' +
        '_Verifique e solicite recarga se necessário._';
      sendWhatsApp(client.whatsappGroup, message);
      sent++;
      Logger.log('Alerta de saldo enviado para grupo de ' + client.name);
    }
  });

  Logger.log('Alertas de saldo enviados: ' + sent);
}

// ===================== AI INSIGHTS (Fase C) =====================
// Aba ai_insights: id, clientId, period, insight, createdAt

function getAiInsights() {
  var sh = getSheet('ai_insights');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['id', 'clientId', 'period', 'insight', 'createdAt']);
    return [];
  }
  return sheetToObjects(sh);
}

function saveAiInsight(body) {
  var sh = getSheet('ai_insights');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['id', 'clientId', 'period', 'insight', 'createdAt']);
  }
  var id = genId();
  sh.appendRow([id, body.clientId||'', body.period||'', body.insight||'', body.createdAt||new Date().toISOString()]);
  return { id: id };
}

// ===================== CRIATIVIVO ACCOUNTS =====================
function getCriativoAccounts() {
  // Retorna lista de contas vinculadas ao Criativivo
  // Pode ser expandido para buscar dinamicamente via API
  var criativoToken = PropertiesService.getScriptProperties().getProperty('CRIATIVIVO_TOKEN');
  if (!criativoToken) {
    // Fallback: retorna lista estática configurada nas propriedades
    var staticAccounts = PropertiesService.getScriptProperties().getProperty('CRIATIVIVO_ACCOUNTS');
    if (staticAccounts) {
      try { return JSON.parse(staticAccounts); } catch(e) { return []; }
    }
    return [];
  }

  try {
    var resp = UrlFetchApp.fetch('https://criativivo.com.br/api/ad-accounts', {
      headers: { 'Authorization': 'Bearer ' + criativoToken },
      muteHttpExceptions: true
    });
    var data = JSON.parse(resp.getContentText());
    return data || [];
  } catch(err) {
    Logger.log('Erro getCriativoAccounts: ' + err.message);
    return [];
  }
}

// ===================== AI INSIGHTS SEMANAL (Fase C) =====================
// Roda toda segunda-feira e gera análise automática para todos os clientes

function weeklyAiAnalysis() {
  var today = new Date();
  if (today.getDay() !== 1) {
    Logger.log('Análise semanal só roda às segundas-feiras');
    return;
  }

  var clients = sheetToObjects(getSheet('clients'));
  var criativoToken = PropertiesService.getScriptProperties().getProperty('CRIATIVIVO_TOKEN');
  var claudeApiKey = PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');

  if (!criativoToken || !claudeApiKey) {
    Logger.log('CRIATIVIVO_TOKEN ou CLAUDE_API_KEY não configurados');
    return;
  }

  // Semana passada
  var lastMonday = new Date(today.getTime() - 7 * 86400000);
  var lastSunday = new Date(today.getTime() - 1 * 86400000);
  var sinceStr = lastMonday.toISOString().slice(0, 10);
  var untilStr = lastSunday.toISOString().slice(0, 10);
  var period = sinceStr + ' a ' + untilStr;

  var activeClients = clients.filter(function(c) {
    return c.criativoAccountId && c.cancelado !== true && c.cancelado !== 'TRUE';
  });

  activeClients.forEach(function(client) {
    try {
      // 1. Busca métricas
      var url = 'https://criativivo.com.br/api/meta/campaigns?account_id=' + client.criativoAccountId +
                '&since=' + sinceStr + '&until=' + untilStr;
      var resp = UrlFetchApp.fetch(url, {
        headers: { 'Authorization': 'Bearer ' + criativoToken },
        muteHttpExceptions: true
      });
      var data = JSON.parse(resp.getContentText());
      var insights = data.insights || [];
      var campaigns = data.campaigns || [];

      var spend = insights.reduce(function(s, i) { return s + (parseFloat(i.spend) || 0); }, 0);
      if (spend === 0) return; // Sem dados, pula

      var impressions = insights.reduce(function(s, i) { return s + (parseInt(i.impressions) || 0); }, 0);
      var clicks = insights.reduce(function(s, i) { return s + (parseInt(i.clicks) || 0); }, 0);
      var reach = insights.reduce(function(s, i) { return s + (parseInt(i.reach) || 0); }, 0);
      var ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0';
      var cpm = impressions > 0 ? ((spend / impressions) * 1000).toFixed(2) : '0';
      var cpc = clicks > 0 ? (spend / clicks).toFixed(2) : '0';

      var extraMetrics = '';
      var clientType = client.clientType || 'lead';

      if (clientType === 'ecommerce') {
        var purchases = insights.reduce(function(s, i) {
          var acts = i.actions || [];
          var p = acts.find(function(a) { return a.action_type === 'offsite_conversion.fb_pixel_purchase'; });
          return s + (p ? parseFloat(p.value) : 0);
        }, 0);
        var revenue = insights.reduce(function(s, i) {
          var vals = i.action_values || [];
          var r = vals.find(function(a) { return a.action_type === 'offsite_conversion.fb_pixel_purchase'; });
          return s + (r ? parseFloat(r.value) : 0);
        }, 0);
        var roas = spend > 0 ? (revenue / spend).toFixed(2) : '0';
        extraMetrics = '\n- Compras: ' + purchases + '\n- Receita: R$' + revenue.toFixed(2) + '\n- ROAS: ' + roas + 'x';
      } else {
        var leads = insights.reduce(function(s, i) {
          var acts = i.actions || [];
          var l = acts.find(function(a) { return a.action_type === 'lead' || a.action_type === 'onsite_conversion.messaging_conversation_started_7d'; });
          return s + (l ? parseInt(l.value) : 0);
        }, 0);
        var cpl = leads > 0 ? (spend / leads).toFixed(2) : '0';
        extraMetrics = '\n- Leads/Mensagens: ' + leads + '\n- CPL: R$' + cpl;
      }

      var activeCampaigns = campaigns.filter(function(c) { return c.status === 'ACTIVE'; }).length;

      // 2. Monta prompt
      var prompt = 'Você é um especialista em marketing digital. Analise os dados de Meta Ads do cliente "' + client.name + '" no período de ' + period + '.\n\n' +
        'DADOS:\n' +
        '- Investimento: R$' + spend.toFixed(2) + '\n' +
        '- Alcance: ' + reach + '\n' +
        '- Impressões: ' + impressions + '\n' +
        '- Cliques: ' + clicks + '\n' +
        '- CTR: ' + ctr + '%\n' +
        '- CPM: R$' + cpm + '\n' +
        '- CPC: R$' + cpc + extraMetrics + '\n' +
        '- Campanhas ativas: ' + activeCampaigns + ' de ' + campaigns.length + '\n' +
        '- Tipo: ' + (clientType === 'ecommerce' ? 'E-commerce' : 'Geração de leads') + '\n\n' +
        'Forneça análise OBJETIVA em português com: 1) Diagnóstico, 2) Pontos positivos, 3) Atenção, 4) 3 recomendações práticas. Máx 250 palavras.';

      // 3. Chama Claude API
      var claudeResp = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeApiKey,
          'anthropic-version': '2023-06-01'
        },
        payload: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 600,
          messages: [{ role: 'user', content: prompt }]
        }),
        muteHttpExceptions: true
      });

      var claudeData = JSON.parse(claudeResp.getContentText());
      var insightText = (claudeData.content && claudeData.content[0]) ? claudeData.content[0].text : '';

      if (!insightText) {
        Logger.log('Claude não retornou insight para ' + client.name);
        return;
      }

      // 4. Salva na aba ai_insights
      saveAiInsight({ clientId: client.id, period: period, insight: insightText });
      Logger.log('Insight IA gerado para: ' + client.name);

      // Pausa para não estourar rate limit
      Utilities.sleep(2000);

    } catch(err) {
      Logger.log('Erro weeklyAiAnalysis ' + client.name + ': ' + err.message);
    }
  });
}

// ===================== BACKFILL DE MÉTRICAS (180 DIAS) =====================
// Roda em lotes para não exceder o limite de 6 min do Apps Script.
// Chame backfillMetrics() repetidamente até aparecer "Backfill concluído!" no log.
// O progresso é salvo em Script Properties — cada chamada continua de onde parou.
// Para REINICIAR do zero: chame resetBackfill() antes de backfillMetrics().

function resetBackfill() {
  var props = PropertiesService.getScriptProperties();
  props.deleteProperty('BACKFILL_DAY_INDEX');
  props.deleteProperty('BACKFILL_CLIENT_INDEX');
  Logger.log('Backfill resetado. Chame backfillMetrics() para começar.');
}

function backfillMetrics() {
  var DAYS_BACK  = 180;   // quantos dias de histórico buscar
  var MAX_ROWS   = 80;    // linhas máximas por execução (segurança de tempo)

  var criativoToken = PropertiesService.getScriptProperties().getProperty('CRIATIVIVO_TOKEN');
  if (!criativoToken) { Logger.log('CRIATIVIVO_TOKEN não configurado'); return; }

  var clients = sheetToObjects(getSheet('clients')).filter(function(c) {
    return c.criativoAccountId && c.cancelado !== true && c.cancelado !== 'TRUE' && c.cancelado !== 'true';
  });

  if (clients.length === 0) { Logger.log('Nenhum cliente com criativoAccountId'); return; }

  // Gera lista de datas: hoje - DAYS_BACK até ontem
  var dates = [];
  var today = new Date();
  for (var d = DAYS_BACK; d >= 1; d--) {
    var dt = new Date(today.getTime() - d * 86400000);
    dates.push(dt.toISOString().slice(0, 10));
  }

  // Lê progresso salvo
  var props = PropertiesService.getScriptProperties();
  var dayIdx    = parseInt(props.getProperty('BACKFILL_DAY_INDEX')    || '0', 10);
  var clientIdx = parseInt(props.getProperty('BACKFILL_CLIENT_INDEX') || '0', 10);

  // Descobre quais combinações (date × client) já existem na planilha
  var sh = getSheet('metrics_history');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['id','clientId','accountId','date','campaigns_json','insights_json','createdAt']);
  }
  var existing = {};
  var lastRow = sh.getLastRow();
  if (lastRow > 1) {
    var data = sh.getRange(2, 1, lastRow - 1, 4).getValues(); // id,clientId,accountId,date
    data.forEach(function(r) { existing[r[1] + '|' + r[3]] = true; }); // clientId|date
  }

  var rows = 0;
  var done = false;

  outer:
  for (var di = dayIdx; di < dates.length; di++) {
    var dateStr = dates[di];
    for (var ci = (di === dayIdx ? clientIdx : 0); ci < clients.length; ci++) {
      var client = clients[ci];
      var key = client.id + '|' + dateStr;

      if (!existing[key]) {
        try {
          var url = 'https://criativivo.com.br/api/meta/campaigns?account_id=' + client.criativoAccountId +
                    '&since=' + dateStr + '&until=' + dateStr;
          var resp = UrlFetchApp.fetch(url, {
            headers: { 'Authorization': 'Bearer ' + criativoToken },
            muteHttpExceptions: true
          });
          var json = JSON.parse(resp.getContentText());
          sh.appendRow([
            genId(), client.id, client.criativoAccountId, dateStr,
            JSON.stringify(json.campaigns || []),
            JSON.stringify(json.insights  || []),
            new Date().toISOString()
          ]);
          rows++;
          Logger.log('[' + dateStr + '] ' + client.name + ' ✓');
        } catch(err) {
          Logger.log('[' + dateStr + '] ' + client.name + ' ERRO: ' + err.message);
        }
      } else {
        Logger.log('[' + dateStr + '] ' + client.name + ' (já existe, pulando)');
      }

      // Salva progresso e para se atingiu o limite de linhas
      if (rows >= MAX_ROWS) {
        // próxima chamada começa no próximo cliente deste dia
        var nextCi = ci + 1;
        var nextDi = di;
        if (nextCi >= clients.length) { nextCi = 0; nextDi = di + 1; }
        props.setProperty('BACKFILL_DAY_INDEX',    String(nextDi));
        props.setProperty('BACKFILL_CLIENT_INDEX', String(nextCi));
        Logger.log('Lote de ' + rows + ' linhas salvo. Chame backfillMetrics() novamente para continuar. Progresso: dia ' + nextDi + '/' + dates.length);
        return;
      }
    }
  }

  // Se chegou até aqui, terminou tudo
  props.deleteProperty('BACKFILL_DAY_INDEX');
  props.deleteProperty('BACKFILL_CLIENT_INDEX');
  Logger.log('Backfill concluído! ' + rows + ' novas linhas adicionadas em metrics_history.');
}

// ===================== TRIGGERS - GUIA DE CONFIGURAÇÃO =====================
// Configure os triggers em: Apps Script > Gatilhos (ícone do relógio)
//
// 1. collectDailyMetrics    → Gatilho de tempo → Diário → 2h-3h
// 2. sendDailyReport        → Gatilho de tempo → Diário → 8h-9h
// 3. sendWeeklyReport       → Gatilho de tempo → Semanal → Segunda → 9h-10h
// 4. sendSnapshotNoon       → Gatilho de tempo → Diário → 12h-13h
// 5. sendSnapshotEvening    → Gatilho de tempo → Diário → 17h-18h
// 6. checkBalanceAndStatus  → Gatilho de tempo → Diário → 10h-11h
// 7. runClientFeedback      → Gatilho de tempo → Diário → 10h-11h
// 8. weeklyAiAnalysis       → Gatilho de tempo → Semanal → Segunda → 6h-7h
//
// Propriedades do Script (configurar em Configurações do projeto > Propriedades):
// - CRIATIVIVO_TOKEN: seu token da API Criativivo (regenere se foi exposto)
// - WHATSAPP_MANAGER: número do gestor para receber relatórios (ex: 5541999999999)
// - CLAUDE_API_KEY: sua chave da API Claude/Anthropic (regenere se foi exposta)
