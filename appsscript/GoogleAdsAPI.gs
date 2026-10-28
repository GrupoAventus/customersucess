// ===================== GOOGLE ADS API — OAuth2 + GAQL =====================
//
// SETUP (fazer uma vez):
// 1. Nas Script Properties, adicione:
//    - GADS_CLIENT_ID     → Client ID do Google Cloud Console
//    - GADS_CLIENT_SECRET → Client Secret do Google Cloud Console
//    - GADS_LOGIN_CUSTOMER_ID → ID da conta MCC (ex: 544-912-6137 → sem traços: 5449126137)
// 2. Execute a função authorizeGoogleAds() → copie o link do log → abra no navegador → autorize
// 3. Pronto — o refresh_token fica salvo nas Script Properties para sempre

// ---- Configurações ----
var GADS_SCOPE_        = 'https://www.googleapis.com/auth/adwords';
var GADS_AUTH_URL_     = 'https://accounts.google.com/o/oauth2/auth';
var GADS_TOKEN_URL_    = 'https://oauth2.googleapis.com/token';
var GADS_API_BASE_     = 'https://googleads.googleapis.com/v19';
var GADS_API_VERSION_  = 'v19';

// ---- Passo 1: gerar URL de autorização (roda uma vez) ----
function authorizeGoogleAds() {
  var props      = PropertiesService.getScriptProperties();
  var clientId   = props.getProperty('GADS_CLIENT_ID');
  var scriptId   = ScriptApp.getScriptId();
  var redirectUri = 'https://script.google.com/macros/d/' + scriptId + '/usercallback';

  if (!clientId) {
    Logger.log('ERRO: GADS_CLIENT_ID não configurado nas Script Properties.');
    return;
  }

  var authUrl =
    GADS_AUTH_URL_ +
    '?client_id='     + encodeURIComponent(clientId) +
    '&redirect_uri='  + encodeURIComponent(redirectUri) +
    '&response_type=code' +
    '&scope='         + encodeURIComponent(GADS_SCOPE_) +
    '&access_type=offline' +
    '&prompt=consent';

  Logger.log('=== ABRA ESTE LINK NO NAVEGADOR PARA AUTORIZAR ===');
  Logger.log(authUrl);
  Logger.log('Após autorizar, copie o "code" da URL de redirecionamento e execute:');
  Logger.log('exchangeGadsCode("COLE_O_CODE_AQUI")');
}

// ---- Passo 2: trocar o code pelo refresh_token ----
function exchangeGadsCode(code) {
  var props         = PropertiesService.getScriptProperties();
  var clientId      = props.getProperty('GADS_CLIENT_ID');
  var clientSecret  = props.getProperty('GADS_CLIENT_SECRET');
  var scriptId      = ScriptApp.getScriptId();
  var redirectUri   = 'https://script.google.com/macros/d/' + scriptId + '/usercallback';

  var resp = UrlFetchApp.fetch(GADS_TOKEN_URL_, {
    method: 'POST',
    contentType: 'application/x-www-form-urlencoded',
    payload: {
      code:          code,
      client_id:     clientId,
      client_secret: clientSecret,
      redirect_uri:  redirectUri,
      grant_type:    'authorization_code'
    },
    muteHttpExceptions: true
  });

  var json = JSON.parse(resp.getContentText());

  if (json.refresh_token) {
    props.setProperty('GADS_REFRESH_TOKEN', json.refresh_token);
    props.setProperty('GADS_ACCESS_TOKEN',  json.access_token);
    props.setProperty('GADS_TOKEN_EXPIRY',  String(Date.now() + (json.expires_in - 60) * 1000));
    Logger.log('✅ Autorização concluída! Refresh token salvo nas Script Properties.');
    Logger.log('Execute testeGoogleAds() para verificar se está funcionando.');
  } else {
    Logger.log('ERRO ao trocar código: ' + resp.getContentText());
  }
}

// ---- Helper: obtém access_token válido (renova automaticamente) ----
function getGadsAccessToken_() {
  var props        = PropertiesService.getScriptProperties();
  var expiry       = parseInt(props.getProperty('GADS_TOKEN_EXPIRY') || '0');
  var accessToken  = props.getProperty('GADS_ACCESS_TOKEN');

  // Se token ainda válido, retorna direto
  if (accessToken && Date.now() < expiry) return accessToken;

  // Renova com refresh_token
  var clientId      = props.getProperty('GADS_CLIENT_ID');
  var clientSecret  = props.getProperty('GADS_CLIENT_SECRET');
  var refreshToken  = props.getProperty('GADS_REFRESH_TOKEN');

  if (!refreshToken) throw new Error('GADS_REFRESH_TOKEN não configurado. Execute authorizeGoogleAds() primeiro.');

  var resp = UrlFetchApp.fetch(GADS_TOKEN_URL_, {
    method: 'POST',
    contentType: 'application/x-www-form-urlencoded',
    payload: {
      client_id:     clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type:    'refresh_token'
    },
    muteHttpExceptions: true
  });

  var json = JSON.parse(resp.getContentText());
  if (!json.access_token) throw new Error('Falha ao renovar token Google Ads: ' + resp.getContentText());

  props.setProperty('GADS_ACCESS_TOKEN', json.access_token);
  props.setProperty('GADS_TOKEN_EXPIRY', String(Date.now() + (json.expires_in - 60) * 1000));

  return json.access_token;
}

// ---- Helper: executa uma query GAQL em uma customer account ----
function runGadsQuery_(customerId, gaql) {
  var props          = PropertiesService.getScriptProperties();
  var loginCustId    = props.getProperty('GADS_LOGIN_CUSTOMER_ID') || '';
  var accessToken    = getGadsAccessToken_();
  // Remove traços e espaços do customerId
  var custId         = String(customerId).replace(/[^0-9]/g, '');

  var url = GADS_API_BASE_ + '/customers/' + custId + '/googleAds:search';

  var headers = {
    'Authorization':           'Bearer ' + accessToken,
    'Content-Type':            'application/json',
    'developer-token':         props.getProperty('GADS_DEVELOPER_TOKEN') || 'BASIC_ACCESS'
  };

  // Login-customer-id obrigatório para acessar contas de cliente via MCC
  if (loginCustId) {
    headers['login-customer-id'] = loginCustId.replace(/[^0-9]/g, '');
  }

  var resp = UrlFetchApp.fetch(url, {
    method: 'POST',
    headers: headers,
    payload: JSON.stringify({ query: gaql }),
    muteHttpExceptions: true
  });

  var json = JSON.parse(resp.getContentText());
  if (json.error) throw new Error('Google Ads API error: ' + JSON.stringify(json.error));
  return json.results || [];
}

// ---- Busca lista de contas acessíveis via MCC ----
function getGadsAccounts() {
  try {
    var props       = PropertiesService.getScriptProperties();
    var loginCustId = props.getProperty('GADS_LOGIN_CUSTOMER_ID') || '';
    if (!loginCustId) return { error: 'GADS_LOGIN_CUSTOMER_ID não configurado.' };

    var accessToken = getGadsAccessToken_();
    var custId      = loginCustId.replace(/[^0-9]/g, '');
    var url         = GADS_API_BASE_ + '/customers/' + custId + '/googleAds:search';

    var gaql = 'SELECT customer_client.id, customer_client.descriptive_name, customer_client.currency_code ' +
               'FROM customer_client WHERE customer_client.manager = false';

    var headers = {
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type':  'application/json',
      'developer-token': props.getProperty('GADS_DEVELOPER_TOKEN') || 'BASIC_ACCESS',
      'login-customer-id': custId
    };

    var resp = UrlFetchApp.fetch(url, {
      method: 'POST',
      headers: headers,
      payload: JSON.stringify({ query: gaql }),
      muteHttpExceptions: true
    });

    var json = JSON.parse(resp.getContentText());
    if (json.error) return { error: JSON.stringify(json.error) };

    var accounts = (json.results || []).map(function(r) {
      return {
        id:       String(r.customerClient.id),
        name:     r.customerClient.descriptiveName || '',
        currency: r.customerClient.currencyCode || 'BRL'
      };
    });

    return { accounts: accounts };
  } catch(e) {
    return { error: e.message };
  }
}

// ---- Busca métricas de performance de uma conta Google Ads ----
// Retorna totais + campanhas para o período informado (yyyy-MM-dd)
function getMetricsGoogleAds(customerId, sinceStr, untilStr) {
  try {
    if (!customerId) return { error: 'customerId não informado' };

    var since = sinceStr.replace(/-/g, '');
    var until = untilStr.replace(/-/g, '');

    var gaql =
      'SELECT ' +
        'campaign.id, ' +
        'campaign.name, ' +
        'campaign.status, ' +
        'campaign.advertising_channel_type, ' +
        'metrics.cost_micros, ' +
        'metrics.impressions, ' +
        'metrics.clicks, ' +
        'metrics.ctr, ' +
        'metrics.average_cpm, ' +
        'metrics.average_cpc, ' +
        'metrics.conversions, ' +
        'metrics.conversions_value, ' +
        'metrics.all_conversions, ' +
        'metrics.all_conversions_value, ' +
        'metrics.video_views, ' +
        'metrics.reach_metrics_reach ' +
      'FROM campaign ' +
      'WHERE segments.date BETWEEN \'' + since + '\' AND \'' + until + '\' ' +
      'AND campaign.status != \'REMOVED\'';

    var rows = runGadsQuery_(customerId, gaql);

    // Agrega totais
    var totals = {
      spend:       0,
      impressions: 0,
      clicks:      0,
      conversions: 0,
      convValue:   0,
      reach:       0
    };

    var campaigns = rows.map(function(r) {
      var m    = r.metrics || {};
      var c    = r.campaign || {};
      var spend = (parseFloat(m.costMicros) || 0) / 1e6;
      var convs = parseFloat(m.conversions) || 0;
      var convVal = parseFloat(m.conversionsValue) || 0;
      var impr  = parseFloat(m.impressions) || 0;
      var clks  = parseFloat(m.clicks) || 0;

      totals.spend       += spend;
      totals.impressions += impr;
      totals.clicks      += clks;
      totals.conversions += convs;
      totals.convValue   += convVal;

      return {
        id:           String(c.id || ''),
        name:         c.name || '',
        status:       c.status || '',
        channelType:  c.advertisingChannelType || '',
        spend:        spend.toFixed(2),
        impressions:  impr,
        clicks:       clks,
        ctr:          (parseFloat(m.ctr) * 100 || 0).toFixed(2),
        cpm:          (parseFloat(m.averageCpm) / 1e6 || 0).toFixed(2),
        cpc:          (parseFloat(m.averageCpc) / 1e6 || 0).toFixed(2),
        conversions:  convs,
        convValue:    convVal.toFixed(2),
        roas:         spend > 0 && convVal > 0 ? (convVal / spend).toFixed(2) : '0'
      };
    });

    // Calcula métricas de totais
    totals.ctr   = totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : '0';
    totals.cpm   = totals.impressions > 0 ? ((totals.spend / totals.impressions) * 1000).toFixed(2) : '0';
    totals.cpc   = totals.clicks > 0 ? (totals.spend / totals.clicks).toFixed(2) : '0';
    totals.roas  = totals.spend > 0 && totals.convValue > 0 ? (totals.convValue / totals.spend).toFixed(2) : '0';
    totals.spend = totals.spend.toFixed(2);

    return { totals: totals, campaigns: campaigns };

  } catch(e) {
    return { error: e.message };
  }
}

// ---- Teste: verifica se a autenticação está funcionando ----
function testeGoogleAds() {
  Logger.log('Testando Google Ads API...');
  var result = getGadsAccounts();
  if (result.error) {
    Logger.log('ERRO: ' + result.error);
  } else {
    Logger.log('✅ Contas encontradas: ' + result.accounts.length);
    result.accounts.forEach(function(a) {
      Logger.log('  • ' + a.name + ' (ID: ' + a.id + ')');
    });
  }
}

// ---- Teste de métricas de uma conta específica ----
function testeGadsMetrics() {
  // Substitua pelo ID de uma conta cliente (sem traços)
  var customerId = PropertiesService.getScriptProperties().getProperty('GADS_TEST_CUSTOMER_ID') || '';
  if (!customerId) {
    Logger.log('Configure GADS_TEST_CUSTOMER_ID nas Script Properties para testar.');
    return;
  }
  var today = new Date().toISOString().slice(0, 10);
  var week  = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  var result = getMetricsGoogleAds(customerId, week, today);
  Logger.log(JSON.stringify(result, null, 2));
}
