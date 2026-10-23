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
  var out;

  // Se vier ?payload=..., é uma escrita via GET (workaround para o redirect 302 do doPost)
  if (p.payload) {
    var body;
    try {
      body = JSON.parse(decodeURIComponent(p.payload));
    } catch(err) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid payload JSON: ' + err.message }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    var writeAction = body.action || '';
    try {
      if (writeAction === 'addClient')           out = addClient(body);
      else if (writeAction === 'updateClient')   out = updateClientData(body);
      else if (writeAction === 'updateClientStatus') out = updateClientStatus(body);
      else if (writeAction === 'updateClientNotes')  out = updateClientNotes(body);
      else if (writeAction === 'setClientPriority')  out = setClientPriority(body);
      else if (writeAction === 'setClientFinance')   out = setClientFinance(body);
      else if (writeAction === 'setClientCard')      out = setClientCard(body);
      else if (writeAction === 'cancelClient')       out = cancelClient(body);
      else if (writeAction === 'deleteClient')       out = deleteClient(body);
      else if (writeAction === 'incrementSocialPost') out = incrementSocialPost(body);
      else if (writeAction === 'addDemand')          out = addDemand(body);
      else if (writeAction === 'toggleDemand')       out = toggleDemand(body);
      else if (writeAction === 'deleteDemand')       out = deleteDemand(body);
      else if (writeAction === 'markPendingDone')    out = markPendingDone(body);
      else if (writeAction === 'setTimelineEntry')   out = setTimelineEntry(body);
      else if (writeAction === 'addReport')          out = addReport(body);
      else if (writeAction === 'deleteReport')       out = deleteReport(body);
      else if (writeAction === 'addAgenda')          out = addAgenda(body);
      else if (writeAction === 'toggleAgenda')       out = toggleAgenda(body);
      else if (writeAction === 'deleteAgenda')       out = deleteAgenda(body);
      else if (writeAction === 'addAlert')           out = addAlert(body);
      else if (writeAction === 'dismissAlert')       out = dismissAlert(body);
      else if (writeAction === 'setPipelineStep')    out = setPipelineStep(body);
      else if (writeAction === 'saveAiInsight')      out = saveAiInsight(body);
      else out = { error: 'Unknown write action: ' + writeAction };
    } catch(err) {
      out = { error: err.message };
    }
    return ContentService.createTextOutput(JSON.stringify(out))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Leituras normais via ?action=...
  var action = p.action || '';
  try {
    if (action === 'getClients')         out = getClients();
    else if (action === 'getDemands')    out = getDemands();
    else if (action === 'getPending')    out = getPending();
    else if (action === 'getTimeline')   out = getTimeline();
    else if (action === 'getReports')    out = getReports();
    else if (action === 'getAgenda')     out = getAgenda();
    else if (action === 'getAlerts')     out = getAlerts();
    else if (action === 'getPipeline')   out = getPipeline();
    else if (action === 'getMetrics') {
      out = getMetricsMeta(p.accountId, p.startDate, p.endDate);
    }
    else if (action === 'getMetricsHistory')  out = getMetricsHistory(p.clientId);
    else if (action === 'getAllAccountsMetrics') {
      out = getAllAccountsMetricsMeta(p.startDate, p.endDate);
    }
    else if (action === 'getMetaAccounts') out = getMetaAccounts();
    else if (action === 'getMetaStatus')   out = getMetaStatus();
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
// Colunas (confirmadas pelo gviz 2024-10):
// col1=id, col2=name, col3=drive, col4=instagram, col5=site,
// col6=entrou, col7=destino, col8=saldoMax, col9=saldo,
// col10=createdAt, col11=destinos, col12=ccLP, col13=ccEcom,
// col14=ccSocial, col15=socialPosts, col16=socialWeek, col17=status,
// col18=observacoes, col19=cancelado, col20=rechargeAmount,
// col21=dailySpend, col22=lastRecharge, col23=priorityStatus,
// col24=statusChangedAt, col25=hasCard, col26=whatsappGroup,
// col27=whatsappGroupName, col28=criativoAccountId, col29=clientType

function getClients() {
  return sheetToObjects(getSheet('clients'));
}

function addClient(body) {
  var sh = getSheet('clients');
  var id = genId();
  var now = new Date().toISOString();
  // appendRow coloca na ordem exata das colunas:
  // col1=id, col2=name, col3=drive, col4=instagram, col5=site,
  // col6=entrou, col7=destino, col8=saldoMax(vazio), col9=saldo(vazio),
  // col10=createdAt, col11=destinos, col12=ccLP, col13=ccEcom,
  // col14=ccSocial, col15=socialPosts, col16=socialWeek, col17=status,
  // col18=observacoes, col19=cancelado, col20=rechargeAmount,
  // col21=dailySpend, col22=lastRecharge, col23=priorityStatus,
  // col24=statusChangedAt, col25=hasCard, col26=whatsappGroup,
  // col27=whatsappGroupName, col28=criativoAccountId, col29=clientType
  sh.appendRow([
    id,                               // col1: id
    body.name||'',                    // col2: name
    body.drive||'',                   // col3: drive
    body.instagram||'',               // col4: instagram
    body.site||'',                    // col5: site
    body.entrou||'',                  // col6: entrou
    body.destino||'',                 // col7: destino
    '',                               // col8: saldoMax (não usado no addClient)
    '',                               // col9: saldo (não usado no addClient)
    now,                              // col10: createdAt
    JSON.stringify(body.destinos||[]),// col11: destinos
    body.ccLP||'',                    // col12: ccLP
    body.ccEcom||'',                  // col13: ccEcom
    body.ccSocial||'',                // col14: ccSocial
    0,                                // col15: socialPosts
    '',                               // col16: socialWeek
    body.status||'Pegar acessos',     // col17: status
    body.observacoes||'',             // col18: observacoes
    false,                            // col19: cancelado
    body.rechargeAmount||0,           // col20: rechargeAmount
    body.dailySpend||0,               // col21: dailySpend
    body.lastRecharge||now.slice(0,10),// col22: lastRecharge
    body.priorityStatus||'estavel',   // col23: priorityStatus
    body.statusChangedAt||now.slice(0,10), // col24: statusChangedAt
    body.hasCard||false,              // col25: hasCard
    body.whatsappGroup||'',           // col26: whatsappGroup
    body.whatsappGroupName||'',       // col27: whatsappGroupName
    body.criativoAccountId||'',       // col28: criativoAccountId
    body.clientType||''               // col29: clientType
  ]);
  return { id: id };
}

function updateClientData(body) {
  var sh = getSheet('clients');
  var row = findRowById(sh, body.id);
  if (row < 0) return { error: 'Not found' };
  // Colunas confirmadas pelo header real da planilha (gviz):
  // col1=id, col2=name, col3=drive, col4=instagram, col5=site,
  // col6=entrou, col7=destino, col8=saldoMax, col9=saldo,
  // col10=createdAt, col11=destinos, col12=ccLP, col13=ccEcom,
  // col14=ccSocial, col15=socialPosts, col16=socialWeek, col17=status,
  // col18=observacoes, col19=cancelado, col20=rechargeAmount,
  // col21=dailySpend, col22=lastRecharge, col23=priorityStatus,
  // col24=statusChangedAt, col25=hasCard, col26=whatsappGroup,
  // col27=whatsappGroupName, col28=criativoAccountId, col29=clientType
  sh.getRange(row, 2).setValue(body.name||'');
  sh.getRange(row, 3).setValue(body.drive||'');
  sh.getRange(row, 4).setValue(body.instagram||'');
  sh.getRange(row, 5).setValue(body.site||'');
  sh.getRange(row, 6).setValue(body.entrou||'');
  sh.getRange(row, 7).setValue(body.destino||'');
  sh.getRange(row, 11).setValue(JSON.stringify(body.destinos||[])); // destinos = col11
  sh.getRange(row, 12).setValue(body.ccLP||'');                     // ccLP = col12
  sh.getRange(row, 13).setValue(body.ccEcom||'');                   // ccEcom = col13
  sh.getRange(row, 14).setValue(body.ccSocial||'');                 // ccSocial = col14
  sh.getRange(row, 26).setValue(body.whatsappGroup||'');            // whatsappGroup = col26
  sh.getRange(row, 27).setValue(body.whatsappGroupName||'');        // whatsappGroupName = col27
  sh.getRange(row, 28).setValue(body.criativoAccountId||'');        // criativoAccountId = col28
  sh.getRange(row, 29).setValue(body.clientType||'');               // clientType = col29
  return { ok: true };
}

function updateClientStatus(body) {
  var sh = getSheet('clients');
  var row = findRowById(sh, body.id);
  if (row < 0) return { error: 'Not found' };
  sh.getRange(row, 17).setValue(body.status);           // col17=status
  sh.getRange(row, 24).setValue(body.statusChangedAt||new Date().toISOString().slice(0,10)); // col24=statusChangedAt
  return { ok: true };
}

function updateClientNotes(body) {
  var sh = getSheet('clients');
  var row = findRowById(sh, body.id);
  if (row < 0) return { error: 'Not found' };
  sh.getRange(row, 18).setValue(body.observacoes||'');  // col18=observacoes
  return { ok: true };
}

function setClientPriority(body) {
  var sh = getSheet('clients');
  var row = findRowById(sh, body.id);
  if (row < 0) return { error: 'Not found' };
  sh.getRange(row, 23).setValue(body.priorityStatus);   // col23=priorityStatus
  return { ok: true };
}

function setClientFinance(body) {
  var sh = getSheet('clients');
  var row = findRowById(sh, body.id);
  if (row < 0) return { error: 'Not found' };
  sh.getRange(row, 20).setValue(body.rechargeAmount||0);// col20=rechargeAmount
  sh.getRange(row, 21).setValue(body.dailySpend||0);    // col21=dailySpend
  sh.getRange(row, 22).setValue(body.lastRecharge||''); // col22=lastRecharge
  return { ok: true };
}

function setClientCard(body) {
  var sh = getSheet('clients');
  var row = findRowById(sh, body.id);
  if (row < 0) return { error: 'Not found' };
  sh.getRange(row, 25).setValue(body.hasCard);          // col25=hasCard
  return { ok: true };
}

function cancelClient(body) {
  var sh = getSheet('clients');
  var row = findRowById(sh, body.id);
  if (row < 0) return { error: 'Not found' };
  sh.getRange(row, 19).setValue(body.cancelado);        // col19=cancelado
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
  var currentPosts = sh.getRange(row, 15).getValue() || 0; // col15=socialPosts
  var currentWeek = getCurrentWeek();
  var sheetWeek = sh.getRange(row, 16).getValue() || '';   // col16=socialWeek
  if (sheetWeek !== currentWeek) {
    currentPosts = 0;
    sh.getRange(row, 16).setValue(currentWeek);            // col16=socialWeek
  }
  sh.getRange(row, 15).setValue(currentPosts + 1);         // col15=socialPosts
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

// ===================== DETRICS CONFIG =====================
var DETRICS_SHEET_ID   = '1BfgMq89t7_4INsNzkSZZk2UZvK2ndjRQyC90aw_ipqo';
var DETRICS_SHEET_NAME = 'Meta Ads - Last 12 Months';
// Estrutura da planilha Detrics (Paid plan, Daily breakdown, ~251 colunas):
// Cada linha = 1 anúncio × 1 dia. Deve agregar por campanha no código.
// Os índices das colunas principais estão nas constantes DC_* abaixo.

function parseMoney(val) {
  // Remove "$", "R$", vírgulas, espaços; converte para float
  if (val === null || val === undefined || val === '') return 0;
  var s = String(val).replace(/[^0-9.\-]/g, '');
  return parseFloat(s) || 0;
}

function parsePercent(val) {
  // Valores como "352.00%" ou "3.52" → retorna número puro (ex: 3.52 = 3.52%)
  if (val === null || val === undefined || val === '') return 0;
  var s = String(val).replace('%', '').trim();
  return parseFloat(s) || 0;
}

// ─── Índices de colunas do Detrics (0-based) ─────────────────────────────────
// Estrutura: per-ad per-day (Paid plan, Daily breakdown, 251 colunas)
var DC_DATE         = 0;   // A  - Date (YYYY-MM-DD ou Date object)
var DC_ACCOUNT      = 1;   // B  - Account Name
var DC_CAMPAIGN     = 2;   // C  - Campaign Name
var DC_ADSET        = 3;   // D  - Ad Set Name
var DC_AD           = 4;   // E  - Ad Name
var DC_SPEND        = 5;   // F  - Amount Spent
var DC_CLICKS       = 6;   // G  - Clicks (All)
var DC_LINK_CLICKS  = 7;   // H  - Inline Link Clicks
var DC_IMPRESSIONS  = 8;   // I  - Impressions
var DC_REACH        = 9;   // J  - Reach
var DC_FREQUENCY    = 10;  // K  - Frequency
var DC_LPV          = 11;  // L  - Landing Page Views
var DC_RESULTS      = 12;  // M  - Results
var DC_CPR          = 13;  // N  - Cost per Result
var DC_LEADS        = 30;  // AE - Website Leads
var DC_PURCHASES    = 36;  // AK - Website Purchases
var DC_MSG_NEW      = 53;  // BB - New Messaging Conversations
var DC_MSG_START    = 54;  // BC - Messaging Conversations Started
var DC_CPC          = 118; // DO - CPC (Cost per Click)
var DC_CTR_ALL      = 119; // DP - CTR (All)
var DC_CTR_LINK     = 120; // DQ - CTR (Link Click-Through Rate)
var DC_CPM          = 121; // DR - CPM (Cost per 1,000 Impressions)
var DC_ROAS_ALL     = 128; // DY - Overall Purchase ROAS
var DC_ROAS_WEB     = 129; // DZ - Website Purchase ROAS

function getMetrics(accountId, startDate, endDate) {
  // Lê métricas da planilha Detrics (Meta Ads - Last 12 Months)
  // Nova estrutura: per-ad per-day, 251 colunas, Daily breakdown (Paid plan)
  if (!accountId) return { error: 'accountId required' };

  try {
    var ss = SpreadsheetApp.openById(DETRICS_SHEET_ID);
    var sh = ss.getSheetByName(DETRICS_SHEET_NAME);
    if (!sh) return { error: 'Aba "' + DETRICS_SHEET_NAME + '" não encontrada na planilha Detrics.' };

    var data = sh.getDataRange().getValues();
    if (data.length < 2) return { error: 'Planilha Detrics vazia.' };

    // Normaliza para comparação (sem "act_", lowercase, trim)
    var normalizeId = function(s) {
      return String(s || '').replace(/^act_/i, '').toLowerCase().trim();
    };
    var needle = normalizeId(accountId);

    // Converte Date object ou string para "YYYY-MM-DD"
    var toDateStr = function(val) {
      if (!val) return '';
      if (val instanceof Date) {
        var y = val.getFullYear();
        var m = String(val.getMonth() + 1).padStart(2, '0');
        var d = String(val.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + d;
      }
      return String(val).trim().slice(0, 10);
    };

    // Leitura segura de número de uma célula
    var num = function(v) { return parseFloat(String(v || '0').replace(/[^0-9.\-]/g, '')) || 0; };

    // Totais globais
    var totals = {
      spend: 0, impressions: 0, clicks: 0, linkClicks: 0,
      reach: 0, frequency: 0, lpv: 0,
      leads: 0, purchases: 0, messages: 0,
      roasSum: 0, roasCount: 0,   // para média ponderada de ROAS
      freqSum: 0, freqCount: 0    // para média de frequência
    };

    // Agrega por campanha
    var campaigns = {};
    var matchedRows = 0;

    for (var i = 1; i < data.length; i++) {
      var row = data[i];

      // Match de conta (coluna B)
      var accountName = String(row[DC_ACCOUNT] || '').trim();
      var nameNorm    = normalizeId(accountName);
      var isMatch = (nameNorm === needle) ||
                    (nameNorm.indexOf(needle) !== -1 && needle.length > 3) ||
                    (needle.indexOf(nameNorm) !== -1 && nameNorm.length > 3);
      if (!isMatch) continue;

      // Filtro de data (coluna A - data única no formato Daily)
      var rowDate = toDateStr(row[DC_DATE]);
      if (startDate && rowDate < startDate) continue;
      if (endDate   && rowDate > endDate)   continue;

      matchedRows++;

      // Extrai métricas desta linha
      var rowSpend   = num(row[DC_SPEND]);
      var rowImpr    = num(row[DC_IMPRESSIONS]);
      var rowClicks  = num(row[DC_CLICKS]);
      var rowLClicks = num(row[DC_LINK_CLICKS]);
      var rowReach   = num(row[DC_REACH]);
      var rowFreq    = num(row[DC_FREQUENCY]);
      var rowLpv     = num(row[DC_LPV]);
      var rowLeads   = num(row[DC_LEADS]);
      var rowPurch   = num(row[DC_PURCHASES]);
      var rowMsg     = num(row[DC_MSG_NEW]) + num(row[DC_MSG_START]);
      var rowRoas    = num(row[DC_ROAS_WEB]) || num(row[DC_ROAS_ALL]);

      // Acumula totais
      totals.spend      += rowSpend;
      totals.impressions += rowImpr;
      totals.clicks     += rowClicks;
      totals.linkClicks += rowLClicks;
      totals.reach      += rowReach;
      totals.lpv        += rowLpv;
      totals.leads      += rowLeads;
      totals.purchases  += rowPurch;
      totals.messages   += rowMsg;
      if (rowFreq > 0)  { totals.freqSum += rowFreq; totals.freqCount++; }
      if (rowRoas > 0)  { totals.roasSum += rowRoas * rowSpend; totals.roasCount += rowSpend; } // ponderado por gasto

      // Agrega por campanha
      var campName = String(row[DC_CAMPAIGN] || '').trim() || '(sem campanha)';
      if (!campaigns[campName]) {
        campaigns[campName] = {
          spend: 0, impressions: 0, clicks: 0, linkClicks: 0,
          reach: 0, lpv: 0, leads: 0, purchases: 0, messages: 0,
          roasSum: 0, roasCount: 0
        };
      }
      var c = campaigns[campName];
      c.spend      += rowSpend;
      c.impressions += rowImpr;
      c.clicks     += rowClicks;
      c.linkClicks += rowLClicks;
      c.reach      += rowReach;
      c.lpv        += rowLpv;
      c.leads      += rowLeads;
      c.purchases  += rowPurch;
      c.messages   += rowMsg;
      if (rowRoas > 0) { c.roasSum += rowRoas * rowSpend; c.roasCount += rowSpend; }
    }

    if (matchedRows === 0) {
      return { error: 'Nenhum dado encontrado para "' + accountId + '" no período ' + startDate + ' a ' + endDate + '. Verifique se o nome da conta corresponde ao Account Name no Detrics.' };
    }

    // Calcula métricas derivadas para um objeto de campanha ou totais
    var calcDerived = function(obj) {
      var ctr  = obj.impressions > 0 ? (obj.clicks / obj.impressions) * 100 : 0;
      var ctrL = obj.impressions > 0 ? (obj.linkClicks / obj.impressions) * 100 : 0;
      var cpm  = obj.impressions > 0 ? (obj.spend / obj.impressions) * 1000 : 0;
      var cpc  = obj.clicks > 0      ? obj.spend / obj.clicks : 0;
      var roas = obj.roasCount > 0   ? obj.roasSum / obj.roasCount : 0;
      var cpa  = obj.leads + obj.purchases > 0 ? obj.spend / (obj.leads + obj.purchases) : 0;
      return {
        ctr:  ctr.toFixed(2),
        ctrL: ctrL.toFixed(2),
        cpm:  cpm.toFixed(2),
        cpc:  cpc.toFixed(2),
        roas: roas.toFixed(2),
        cpa:  cpa.toFixed(2)
      };
    };

    // Monta insights por campanha
    var aggregatedInsights = Object.keys(campaigns).map(function(campName) {
      var c = campaigns[campName];
      var d = calcDerived(c);
      return {
        campaign_id:   campName,
        campaign_name: campName,
        spend:         c.spend.toFixed(2),
        impressions:   String(Math.round(c.impressions)),
        clicks:        String(Math.round(c.clicks)),
        linkClicks:    String(Math.round(c.linkClicks)),
        reach:         String(Math.round(c.reach)),
        lpv:           String(Math.round(c.lpv)),
        leads:         String(Math.round(c.leads)),
        purchases:     String(Math.round(c.purchases)),
        messages:      String(Math.round(c.messages)),
        ctr:           d.ctr,
        cpm:           d.cpm,
        cpc:           d.cpc,
        roas:          d.roas,
        cpa:           d.cpa,
        purchaseValue: '0'
      };
    });

    // Totais globais com métricas derivadas
    var td   = calcDerived(totals);
    var freq = totals.freqCount > 0 ? (totals.freqSum / totals.freqCount).toFixed(2) : '0';

    return {
      campaigns: aggregatedInsights.map(function(ins) {
        return { id: ins.campaign_id, name: ins.campaign_name };
      }),
      insights: aggregatedInsights,
      daily:    [],
      totals: {
        spend:         totals.spend.toFixed(2),
        impressions:   Math.round(totals.impressions),
        clicks:        Math.round(totals.clicks),
        linkClicks:    Math.round(totals.linkClicks),
        reach:         Math.round(totals.reach),
        frequency:     freq,
        lpv:           Math.round(totals.lpv),
        leads:         Math.round(totals.leads),
        purchases:     Math.round(totals.purchases),
        messages:      Math.round(totals.messages),
        purchaseValue: '0',
        roas:          td.roas,
        cpa:           td.cpa,
        ctr:           td.ctr,
        cpm:           td.cpm,
        cpc:           td.cpc
      },
      period:      { start: startDate, end: endDate },
      source:      'detrics',
      matchedRows: matchedRows
    };

  } catch(err) {
    return { error: 'Erro ao ler planilha Detrics: ' + err.message + ' | stack: ' + err.stack };
  }
}

// ─── Visão geral compilada: todas as contas ───────────────────────────────────
// Retorna array com totais por conta para o período informado.
// Usado pela aba "Visão Geral" no dashboard.
function getAllAccountsMetrics(startDate, endDate) {
  try {
    var ss = SpreadsheetApp.openById(DETRICS_SHEET_ID);
    var sh = ss.getSheetByName(DETRICS_SHEET_NAME);
    if (!sh) return { error: 'Aba "' + DETRICS_SHEET_NAME + '" não encontrada.' };

    var data = sh.getDataRange().getValues();
    if (data.length < 2) return { error: 'Planilha Detrics vazia.' };

    var toDateStr = function(val) {
      if (!val) return '';
      if (val instanceof Date) {
        var y = val.getFullYear();
        var m = String(val.getMonth() + 1).padStart(2, '0');
        var d = String(val.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + d;
      }
      return String(val).trim().slice(0, 10);
    };
    var num = function(v) { return parseFloat(String(v || '0').replace(/[^0-9.\-]/g, '')) || 0; };

    // Acumula por nome de conta
    var accounts = {};

    for (var i = 1; i < data.length; i++) {
      var row = data[i];

      // Filtro de data
      var rowDate = toDateStr(row[DC_DATE]);
      if (startDate && rowDate < startDate) continue;
      if (endDate   && rowDate > endDate)   continue;

      var accountName = String(row[DC_ACCOUNT] || '').trim();
      if (!accountName) continue;

      if (!accounts[accountName]) {
        accounts[accountName] = {
          spend: 0, impressions: 0, clicks: 0, linkClicks: 0,
          reach: 0, leads: 0, purchases: 0, messages: 0,
          roasSum: 0, roasCount: 0
        };
      }
      var a = accounts[accountName];
      var rowSpend = num(row[DC_SPEND]);
      a.spend      += rowSpend;
      a.impressions += num(row[DC_IMPRESSIONS]);
      a.clicks     += num(row[DC_CLICKS]);
      a.linkClicks += num(row[DC_LINK_CLICKS]);
      a.reach      += num(row[DC_REACH]);
      a.leads      += num(row[DC_LEADS]);
      a.purchases  += num(row[DC_PURCHASES]);
      a.messages   += num(row[DC_MSG_NEW]) + num(row[DC_MSG_START]);
      var rowRoas   = num(row[DC_ROAS_WEB]) || num(row[DC_ROAS_ALL]);
      if (rowRoas > 0 && rowSpend > 0) {
        a.roasSum   += rowRoas * rowSpend;
        a.roasCount += rowSpend;
      }
    }

    // Monta resultado
    var result = Object.keys(accounts).map(function(name) {
      var a    = accounts[name];
      var roas = a.roasCount > 0 ? (a.roasSum / a.roasCount).toFixed(2) : '0';
      var ctr  = a.impressions > 0 ? ((a.clicks / a.impressions) * 100).toFixed(2) : '0';
      var cpm  = a.impressions > 0 ? ((a.spend / a.impressions) * 1000).toFixed(2) : '0';
      var cpc  = a.clicks > 0      ? (a.spend / a.clicks).toFixed(2) : '0';
      var conversions = a.leads + a.purchases;
      var cpa  = conversions > 0 ? (a.spend / conversions).toFixed(2) : '0';
      return {
        accountName:  name,
        spend:        a.spend.toFixed(2),
        impressions:  Math.round(a.impressions),
        clicks:       Math.round(a.clicks),
        linkClicks:   Math.round(a.linkClicks),
        reach:        Math.round(a.reach),
        leads:        Math.round(a.leads),
        purchases:    Math.round(a.purchases),
        conversions:  Math.round(conversions),
        messages:     Math.round(a.messages),
        roas:         roas,
        ctr:          ctr,
        cpm:          cpm,
        cpc:          cpc,
        cpa:          cpa
      };
    });

    // Ordena por gasto (maior primeiro)
    result.sort(function(a, b) { return parseFloat(b.spend) - parseFloat(a.spend); });

    return { accounts: result, period: { start: startDate, end: endDate }, source: 'detrics' };

  } catch(err) {
    return { error: 'Erro em getAllAccountsMetrics: ' + err.message };
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
  // Migrado para Meta API direta (sem Criativivo)
  var clients = sheetToObjects(getSheet('clients'));
  var today = new Date();
  var yesterday = new Date(today.getTime() - 86400000);
  var dateStr = yesterday.toISOString().slice(0, 10);

  var sh = getSheet('metrics_history');
  // Criar cabeçalho se não existir
  if (sh.getLastRow() === 0) {
    sh.appendRow(['id', 'clientId', 'accountId', 'date', 'campaigns_json', 'insights_json', 'createdAt']);
  }

  clients.forEach(function(client) {
    if (!client.criativoAccountId || client.cancelado === true || client.cancelado === 'TRUE') return;

    try {
      var result = getMetricsMeta(client.criativoAccountId, dateStr, dateStr);

      var id = genId();
      var now = new Date().toISOString();
      sh.appendRow([
        id, client.id, client.criativoAccountId, dateStr,
        JSON.stringify(result.campaigns || []),
        JSON.stringify(result.insights  || []),
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
  // Migrado para Meta API direta (sem Criativivo)
  var clients = sheetToObjects(getSheet('clients'));
  var today = new Date();
  var dateDisplay = today.toLocaleDateString('pt-BR');
  var yesterday = new Date(today.getTime() - 86400000);
  var yesterdayStr = yesterday.toISOString().slice(0, 10);

  // Para cada cliente ativo com criativoAccountId E whatsappGroup, envia relatório individual no grupo dele
  var activeClients = clients.filter(function(c) {
    return c.status === 'Campanha ativa' &&
           c.criativoAccountId &&
           c.whatsappGroup &&
           c.cancelado !== true && c.cancelado !== 'TRUE';
  });

  if (activeClients.length === 0) {
    Logger.log('Nenhum cliente ativo com conta Meta e grupo WhatsApp configurados');
    return;
  }

  var sent = 0;
  activeClients.forEach(function(client) {
    try {
      var result = getMetricsMeta(client.criativoAccountId, yesterdayStr, yesterdayStr);
      var t = result.totals || {};

      var spend      = parseFloat(t.spend)       || 0;
      var impressions = parseFloat(t.impressions) || 0;
      var clicks     = parseFloat(t.clicks)      || 0;

      var clientType = client.clientType || 'lead';
      var extraLine  = '';

      if (clientType === 'ecommerce') {
        var purchases = parseFloat(t.purchases)    || 0;
        var roas      = parseFloat(t.roas)         || 0;
        extraLine = '🛒 Compras: ' + purchases + ' | ROAS: ' + roas.toFixed(2) + 'x';
      } else {
        var leads = parseFloat(t.leads || t.messages) || 0;
        var cpl   = leads > 0 ? 'R$' + (spend / leads).toFixed(2) : '—';
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
  // Migrado para Meta API direta (sem Criativivo)
  var today = new Date();
  var dayOfWeek = today.getDay(); // 0=Dom, 1=Seg, ..., 6=Sab
  if (dayOfWeek !== 1) {
    Logger.log('Relatório semanal só roda às segundas-feiras');
    return;
  }

  var clients = sheetToObjects(getSheet('clients'));

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
    Logger.log('Nenhum cliente com conta Meta e grupo WhatsApp configurados');
    return;
  }

  var sent = 0;
  activeClients.forEach(function(client) {
    try {
      var result = getMetricsMeta(client.criativoAccountId, sinceStr, untilStr);
      var t = result.totals || {};

      var spend       = parseFloat(t.spend)       || 0;
      var impressions = parseFloat(t.impressions)  || 0;
      var clicks      = parseFloat(t.clicks)       || 0;
      var reach       = parseFloat(t.reach)        || 0;
      var ctrRaw      = parseFloat(t.ctr)          || 0;
      var ctr         = ctrRaw > 0 ? ctrRaw.toFixed(2) + '%' : '—';

      var clientType = client.clientType || 'lead';
      var extraLine  = '';

      if (clientType === 'ecommerce') {
        var purchases = parseFloat(t.purchases) || 0;
        var roas      = parseFloat(t.roas)      || 0;
        extraLine = '🛒 Compras: ' + purchases + ' | ROAS: ' + roas.toFixed(2) + 'x';
      } else {
        var leads = parseFloat(t.leads || t.messages) || 0;
        var cpl   = leads > 0 ? 'R$' + (spend / leads).toFixed(2) : '—';
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
  // Migrado para Meta API direta (sem Criativivo)
  var clients = sheetToObjects(getSheet('clients'));
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
      var result = getMetricsMeta(client.criativoAccountId, today, today);
      var t = result.totals || {};

      var spend       = parseFloat(t.spend)       || 0;
      var impressions = parseFloat(t.impressions)  || 0;
      var clicks      = parseFloat(t.clicks)       || 0;

      var clientType = client.clientType || 'lead';
      var extraLine  = '';

      if (clientType === 'ecommerce') {
        var purchases = parseFloat(t.purchases) || 0;
        var roas      = parseFloat(t.roas)      || 0;
        extraLine = '🛒 Compras: ' + purchases + ' | ROAS: ' + roas.toFixed(2) + 'x';
      } else {
        var leads = parseFloat(t.leads || t.messages) || 0;
        var cpl   = leads > 0 ? 'R$' + (spend / leads).toFixed(2) : '—';
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

// ===================== CRIATIVIVO ACCOUNTS (compatibilidade) =====================
// Delegado para getMetaAccounts() — sem dependência do Criativivo
function getCriativoAccounts() {
  return getMetaAccounts();
}

// ===================== AI INSIGHTS SEMANAL (Fase C) =====================
// Roda toda segunda-feira e gera análise automática para todos os clientes

function weeklyAiAnalysis() {
  // Migrado para Meta API direta (sem Criativivo)
  var today = new Date();
  if (today.getDay() !== 1) {
    Logger.log('Análise semanal só roda às segundas-feiras');
    return;
  }

  var clients = sheetToObjects(getSheet('clients'));
  var claudeApiKey = PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');

  if (!claudeApiKey) {
    Logger.log('CLAUDE_API_KEY não configurada');
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
      // 1. Busca métricas via Meta API direta
      var result = getMetricsMeta(client.criativoAccountId, sinceStr, untilStr);
      var t        = result.totals    || {};
      var campaigns = result.campaigns || [];

      var spend = parseFloat(t.spend) || 0;
      if (spend === 0) return; // Sem dados, pula

      var impressions = parseFloat(t.impressions) || 0;
      var clicks      = parseFloat(t.clicks)      || 0;
      var reach       = parseFloat(t.reach)       || 0;
      var ctrRaw2     = parseFloat(t.ctr)         || 0;
      var cpmRaw      = parseFloat(t.cpm)         || 0;
      var cpcRaw      = parseFloat(t.cpc)         || 0;
      var ctr         = ctrRaw2 > 0 ? ctrRaw2.toFixed(2) : '0';
      var cpm         = cpmRaw  > 0 ? cpmRaw.toFixed(2)  : '0';
      var cpc         = cpcRaw  > 0 ? cpcRaw.toFixed(2)  : '0';

      var extraMetrics = '';
      var clientType = client.clientType || 'lead';

      if (clientType === 'ecommerce') {
        var purchases = parseFloat(t.purchases)    || 0;
        var revenue   = parseFloat(t.purchaseValue) || 0;
        var roasRaw   = parseFloat(t.roas)          || 0;
        var roas      = roasRaw > 0 ? roasRaw.toFixed(2) : '0';
        extraMetrics = '\n- Compras: ' + purchases + '\n- Receita: R$' + revenue.toFixed(2) + '\n- ROAS: ' + roas + 'x';
      } else {
        var leads = parseFloat(t.leads || t.messages) || 0;
        var cpl   = leads > 0 ? (spend / leads).toFixed(2) : '0';
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
  // Migrado para Meta API direta (sem Criativivo)
  var DAYS_BACK  = 180;   // quantos dias de histórico buscar
  var MAX_ROWS   = 80;    // linhas máximas por execução (segurança de tempo)

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

  outer:
  for (var di = dayIdx; di < dates.length; di++) {
    var dateStr = dates[di];
    for (var ci = (di === dayIdx ? clientIdx : 0); ci < clients.length; ci++) {
      var client = clients[ci];
      var key = client.id + '|' + dateStr;

      if (!existing[key]) {
        try {
          var result = getMetricsMeta(client.criativoAccountId, dateStr, dateStr);
          sh.appendRow([
            genId(), client.id, client.criativoAccountId, dateStr,
            JSON.stringify(result.campaigns || []),
            JSON.stringify(result.insights  || []),
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
// 1. collectDailyMetrics      → Gatilho de tempo → Diário → 2h-3h
// 2. sendDailyReport          → Gatilho de tempo → Diário → 8h-9h
// 3. sendWeeklyReport         → Gatilho de tempo → Semanal → Segunda → 9h-10h
// 4. sendSnapshotNoon         → Gatilho de tempo → Diário → 12h-13h
// 5. sendSnapshotEvening      → Gatilho de tempo → Diário → 17h-18h
// 6. checkBalanceAndStatus    → Gatilho de tempo → Diário → 10h-11h
// 7. runClientFeedback        → Gatilho de tempo → Diário → 10h-11h
// 8. weeklyAiAnalysis         → Gatilho de tempo → Semanal → Segunda → 6h-7h
// 9. checkMetaAccountsHourly → Gatilho de tempo → A cada hora (toda hora)
//
// Propriedades do Script (configurar em Configurações do projeto > Propriedades):
// - META_TOKEN: token de acesso Meta (Business Manager) — NUNCA comitar no GitHub
// - WHATSAPP_MANAGER: número do gestor para receber relatórios (ex: 5541999999999)
// - CLAUDE_API_KEY: sua chave da API Claude/Anthropic (regenere se foi exposta)

// ===================== META ACCOUNTS LIST =====================
// Retorna todas as contas de anúncio acessíveis pelo META_TOKEN
function getMetaAccounts() {
  var token = PropertiesService.getScriptProperties().getProperty('META_TOKEN');
  if (!token) return { error: 'META_TOKEN não configurado nas propriedades do script.' };

  try {
    var url = 'https://graph.facebook.com/v21.0/me/adaccounts' +
              '?fields=id,name,account_status,currency' +
              '&limit=200' +
              '&access_token=' + token;

    var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    var json = JSON.parse(resp.getContentText());

    if (json.error) return { error: json.error.message };

    var accounts = (json.data || []).map(function(a) {
      return {
        id: a.id,                        // ex: "act_465759813488960"
        numericId: a.id.replace(/^act_/i, ''), // ex: "465759813488960"
        name: a.name || a.id,
        status: a.account_status,        // 1=ACTIVE, 2=DISABLED, 3=UNSETTLED, 7=PENDING_RISK_REVIEW
        currency: a.currency || 'BRL'
      };
    });

    // Ordena por nome
    accounts.sort(function(a, b) { return a.name.localeCompare(b.name); });

    return { accounts: accounts };
  } catch(err) {
    return { error: 'Erro ao buscar contas Meta: ' + err.message };
  }
}

// ===================== TESTE DETRICS =====================
function testePROFFLEX() {
  var r = getMetrics('PROFFLEX', '2026-10-01', '2026-10-23');
  Logger.log(JSON.stringify(r));
}

function testeRawDatas() {
  // Mostra as primeiras 5 linhas brutas para debug de formato de data
  var ss = SpreadsheetApp.openById(DETRICS_SHEET_ID);
  var sh = ss.getSheetByName(DETRICS_SHEET_NAME);
  var data = sh.getRange(1, 1, 6, 4).getValues();
  data.forEach(function(row, i) {
    Logger.log('Linha ' + i + ': [' + typeof row[0] + '] "' + row[0] + '" | [' + typeof row[1] + '] "' + row[1] + '" | "' + row[2] + '"');
  });
}

function testeListaContas() {
  // Lista todos os Account Names únicos na planilha Detrics
  var ss = SpreadsheetApp.openById(DETRICS_SHEET_ID);
  var sh = ss.getSheetByName(DETRICS_SHEET_NAME);
  var data = sh.getDataRange().getValues();
  var contas = {};
  for (var i = 1; i < data.length; i++) {
    var nome = String(data[i][2] || '').trim();
    if (nome) contas[nome] = true;
  }
  Logger.log('Contas encontradas no Detrics: ' + JSON.stringify(Object.keys(contas)));
}
