// ===================== JARVIS — ENVIOS NO WHATSAPP (Evolution API) =====================
// Usado pelo agente de voz do ElevenLabs (ferramentas webhook GET).
// Só automação de mensagens, demandas e arquivos (HTML/PDF). NADA de campanhas de tráfego.
//
// Segurança:
//  - Toda ação exige ?token= igual à Script Property JARVIS_TOKEN (fica fora do Git).
//  - Envio em DUAS ETAPAS: sem confirmar=sim só devolve a prévia (destino + texto).
//    O agente lê a prévia para o Bruno e só chama de novo com confirmar=sim depois do "pode mandar".
//  - Grupos bloqueados (disputa jurídica etc.): Script Property JARVIS_BLOQUEADOS (lista separada por vírgula),
//    padrão "construart".
//  - Todo envio fica registrado na aba "jarvis_envios".
//
// Ações (GET ?action=...):
//  jarvisDestinos                                  → lista clientes com grupo + outros grupos do WhatsApp
//  jarvisEnviar&destino=&mensagem=[&confirmar=sim] → texto livre para um cliente/grupo
//  jarvisEnviarDemandas&destino=[&confirmar=sim]   → lista as demandas abertas do cliente no grupo dele
//  jarvisEnviarArquivo&destino=&arquivo=[&legenda=][&confirmar=sim]
//                                                  → envia um arquivo do Google Drive (HTML, PDF…) como documento

var JARVIS_PADRAO_BLOQUEADOS = 'construart';

function jarvisRoute_(action, p) {
  var tok = PropertiesService.getScriptProperties().getProperty('JARVIS_TOKEN');
  if (!tok) return { ok: false, erro: 'JARVIS_TOKEN não configurado nas propriedades do script.' };
  if (String(p.token || '') !== tok) return { ok: false, erro: 'Token inválido.' };
  if (action === 'jarvisDestinos')       return jarvisDestinos_();
  if (action === 'jarvisEnviar')         return jarvisEnviar_(p);
  if (action === 'jarvisEnviarDemandas') return jarvisEnviarDemandas_(p);
  if (action === 'jarvisEnviarArquivo')  return jarvisEnviarArquivo_(p);
  return { ok: false, erro: 'Ação desconhecida: ' + action };
}

// ---------- helpers ----------
function jvNorm_(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9@.]+/g, ' ').trim();
}

function jvConfirmado_(p) { return /^(sim|true|1|yes)$/i.test(String(p.confirmar || '')); }

function jvBloqueado_(nome) {
  var lista = PropertiesService.getScriptProperties().getProperty('JARVIS_BLOQUEADOS') || JARVIS_PADRAO_BLOQUEADOS;
  var n = jvNorm_(nome);
  return lista.split(',').map(jvNorm_).filter(String).some(function(b) { return n.indexOf(b) >= 0; });
}

function jvEvo_(path, payload) {
  var res = UrlFetchApp.fetch(EVOLUTION_API + path + '/' + EVOLUTION_INSTANCE, {
    method: payload ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_KEY },
    payload: payload ? JSON.stringify(payload) : undefined,
    muteHttpExceptions: true
  });
  var code = res.getResponseCode();
  var body;
  try { body = JSON.parse(res.getContentText()); } catch (e) { body = res.getContentText().slice(0, 300); }
  return { code: code, ok: code >= 200 && code < 300, body: body };
}

function jvGrupos_() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get('jv_grupos');
  if (hit) return JSON.parse(hit);
  var res = UrlFetchApp.fetch(EVOLUTION_API + '/group/fetchAllGroups/' + EVOLUTION_INSTANCE + '?getParticipants=false', {
    headers: { 'apikey': EVOLUTION_KEY }, muteHttpExceptions: true
  });
  var r;
  try { r = { ok: res.getResponseCode() < 300, body: JSON.parse(res.getContentText()) }; } catch (e) { r = { ok: false, body: [] }; }
  var lista = (Array.isArray(r.body) ? r.body : []).map(function(g) { return { id: g.id, nome: g.subject || '' }; })
    .filter(function(g) { return g.id && g.nome; });
  try { cache.put('jv_grupos', JSON.stringify(lista), 600); } catch (e) {}
  return lista;
}

// Resolve "destino" (nome do cliente, nome do grupo, JID ou telefone) → { id, nome, clienteId? }
function jvResolver_(destino) {
  var raw = String(destino || '').trim();
  if (!raw) return { erro: 'Diga para quem enviar.' };
  if (/@g\.us$|@s\.whatsapp\.net$/.test(raw)) return { id: raw, nome: raw };
  var digits = raw.replace(/\D/g, '');
  if (digits.length >= 10 && digits.length === raw.replace(/[\s()+-]/g, '').length) {
    return { id: (digits.length <= 11 ? '55' : '') + digits, nome: '+' + digits };
  }
  var q = jvNorm_(raw);
  var cands = [];
  getClients().forEach(function(c) {
    if (!c.whatsappGroup || String(c.cancelado).toUpperCase() === 'TRUE') return;
    var n = jvNorm_(c.name), g = jvNorm_(c.whatsappGroupName);
    if (n === q || g === q) cands.unshift({ id: c.whatsappGroup, nome: c.whatsappGroupName || c.name, cliente: c.name, clienteId: c.id, exato: true });
    else if (n.indexOf(q) >= 0 || g.indexOf(q) >= 0 || (n && q.indexOf(n) >= 0)) cands.push({ id: c.whatsappGroup, nome: c.whatsappGroupName || c.name, cliente: c.name, clienteId: c.id });
  });
  if (!cands.length) {
    jvGrupos_().forEach(function(g) {
      var n = jvNorm_(g.nome);
      if (n === q) cands.unshift({ id: g.id, nome: g.nome, exato: true });
      else if (n.indexOf(q) >= 0) cands.push({ id: g.id, nome: g.nome });
    });
  }
  // remove duplicados por id
  var vistos = {};
  cands = cands.filter(function(c) { if (vistos[c.id]) return false; vistos[c.id] = 1; return true; });
  if (cands.length && cands[0].exato) return cands[0];
  if (cands.length === 1) return cands[0];
  if (!cands.length) return { erro: 'Não achei cliente nem grupo com "' + raw + '".' };
  return { erro: 'Mais de um destino possível. Pergunte qual.', opcoes: cands.slice(0, 6).map(function(c) { return c.nome; }) };
}

function jvLog_(destino, tipo, conteudo, resultado) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sh = ss.getSheetByName('jarvis_envios') || ss.insertSheet('jarvis_envios');
    if (sh.getLastRow() === 0) sh.appendRow(['quando', 'destino', 'id', 'tipo', 'conteudo', 'status']);
    sh.appendRow([new Date(), destino.nome, destino.id, tipo, String(conteudo).slice(0, 2000), resultado]);
  } catch (e) {}
}

function jvPreparar_(p) {
  var d = jvResolver_(p.destino);
  if (d.erro) return { pronto: false, res: { ok: false, erro: d.erro, opcoes: d.opcoes || [] } };
  if (jvBloqueado_(d.nome + ' ' + (d.cliente || ''))) {
    return { pronto: false, res: { ok: false, erro: 'Destino bloqueado para envios automáticos (' + d.nome + '). Isso vai pelo jurídico.' } };
  }
  return { pronto: true, destino: d };
}

// ---------- ações ----------
function jarvisDestinos_() {
  var clientes = getClients().filter(function(c) { return c.whatsappGroup && String(c.cancelado).toUpperCase() !== 'TRUE'; })
    .map(function(c) { return c.name; });
  var outros = [];
  try { outros = jvGrupos_().map(function(g) { return g.nome; }); } catch (e) {}
  return { ok: true, clientesComGrupo: clientes, gruposWhatsApp: outros.slice(0, 200) };
}

function jarvisEnviar_(p) {
  var msg = String(p.mensagem || '').trim();
  if (!msg) return { ok: false, erro: 'Mensagem vazia.' };
  var prep = jvPreparar_(p);
  if (!prep.pronto) return prep.res;
  var d = prep.destino;
  if (!jvConfirmado_(p)) {
    return { ok: true, enviado: false, previa: true, destino: d.nome, mensagem: msg,
      instrucao: 'Leia destino e mensagem para o Bruno e só envie (confirmar=sim) depois que ele confirmar.' };
  }
  var r = jvEvo_('/message/sendText', { number: d.id, text: msg });
  jvLog_(d, 'texto', msg, r.ok ? 'enviado' : 'erro ' + r.code);
  return r.ok ? { ok: true, enviado: true, destino: d.nome }
              : { ok: false, enviado: false, destino: d.nome, erro: 'Evolution respondeu ' + r.code };
}

function jarvisEnviarDemandas_(p) {
  var prep = jvPreparar_(p);
  if (!prep.pronto) return prep.res;
  var d = prep.destino;
  if (!d.clienteId) return { ok: false, erro: '"' + d.nome + '" não é um cliente do CRM; não sei quais demandas mandar.' };
  var hoje = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd');
  var abertas = getDemands().filter(function(x) { return x.clientId === d.clienteId && !isDone_(x.done); });
  if (!abertas.length) return { ok: false, erro: 'Não há demandas abertas para ' + (d.cliente || d.nome) + '.' };
  abertas.sort(function(a, b) { return (ymd_(a.prazo) || '9999').localeCompare(ymd_(b.prazo) || '9999'); });
  var linhas = abertas.map(function(x) {
    var pz = ymd_(x.prazo);
    var pzBR = pz ? pz.slice(8, 10) + '/' + pz.slice(5, 7) : 'sem prazo';
    return '• ' + String(x.text || '').trim() + ' — ' + pzBR;
  });
  var msg = (p.mensagem ? String(p.mensagem).trim() + '\n\n' : 'Pessoal, segue o status das demandas em andamento:\n\n')
    + linhas.join('\n');
  if (!jvConfirmado_(p)) {
    return { ok: true, enviado: false, previa: true, destino: d.nome, totalDemandas: abertas.length, mensagem: msg,
      instrucao: 'Resuma para o Bruno quantas demandas vão e para qual grupo; só envie (confirmar=sim) depois que ele confirmar.' };
  }
  var r = jvEvo_('/message/sendText', { number: d.id, text: msg });
  jvLog_(d, 'demandas', msg, r.ok ? 'enviado' : 'erro ' + r.code);
  return r.ok ? { ok: true, enviado: true, destino: d.nome, totalDemandas: abertas.length }
              : { ok: false, enviado: false, erro: 'Evolution respondeu ' + r.code };
}

function jvAcharArquivo_(arquivo) {
  var a = String(arquivo || '').trim();
  var m = a.match(/[-\w]{25,}/);
  if (m) { try { return { arquivos: [DriveApp.getFileById(m[0])] }; } catch (e) {} }
  var safe = a.replace(/'/g, "\\'");
  var it = DriveApp.searchFiles("title contains '" + safe + "' and trashed = false");
  var lista = [];
  while (it.hasNext() && lista.length < 10) lista.push(it.next());
  lista.sort(function(x, y) { return y.getLastUpdated() - x.getLastUpdated(); });
  return { arquivos: lista };
}

function jarvisEnviarArquivo_(p) {
  if (!p.arquivo) return { ok: false, erro: 'Diga qual arquivo (nome no Drive ou link).' };
  var prep = jvPreparar_(p);
  if (!prep.pronto) return prep.res;
  var d = prep.destino;
  var achou = jvAcharArquivo_(p.arquivo);
  if (!achou.arquivos.length) return { ok: false, erro: 'Não achei no Drive arquivo com "' + p.arquivo + '".' };
  var exatos = achou.arquivos.filter(function(f) { return jvNorm_(f.getName()) === jvNorm_(p.arquivo); });
  if (!exatos.length && achou.arquivos.length > 1) {
    return { ok: false, erro: 'Achei mais de um arquivo. Pergunte qual.', opcoes: achou.arquivos.slice(0, 6).map(function(f) { return f.getName(); }) };
  }
  var f = exatos[0] || achou.arquivos[0];
  var nome = f.getName(), mime = f.getMimeType();
  if (/^application\/vnd\.google-apps/.test(mime)) {
    return { ok: false, erro: '"' + nome + '" é um arquivo Google (Docs/Sheets). Envie um HTML ou PDF.' };
  }
  if (f.getSize() > 15 * 1024 * 1024) return { ok: false, erro: 'Arquivo grande demais (máx. 15 MB).' };
  var legenda = String(p.legenda || '').trim();
  if (!jvConfirmado_(p)) {
    return { ok: true, enviado: false, previa: true, destino: d.nome, arquivo: nome, legenda: legenda,
      instrucao: 'Confirme com o Bruno o arquivo, o destino e a legenda; só envie (confirmar=sim) depois do ok.' };
  }
  var blob = f.getBlob();
  if (/\.html?$/i.test(nome)) mime = 'text/html';
  var r = jvEvo_('/message/sendMedia', {
    number: d.id, mediatype: 'document', mimetype: mime, fileName: nome, caption: legenda,
    media: Utilities.base64Encode(blob.getBytes())
  });
  jvLog_(d, 'arquivo', nome + (legenda ? ' | ' + legenda : ''), r.ok ? 'enviado' : 'erro ' + r.code);
  return r.ok ? { ok: true, enviado: true, destino: d.nome, arquivo: nome }
              : { ok: false, enviado: false, erro: 'Evolution respondeu ' + r.code };
}
