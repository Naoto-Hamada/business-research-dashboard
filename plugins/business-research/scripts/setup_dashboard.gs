// Business Research Dashboard - Google Apps Script
// スキーマ v2: 調査プロジェクト / 事業(BMC+ポジション) / 運営企業 / ソース / 引用 / 分析 / ニュース

// ========== 設定 ==========

const DEFAULT_SPREADSHEET_ID = '1GzbOoVAd2fKE336jGnbQzPNrDV5iRxtNiUJHoUtaW2g';

function _getSpreadsheet() {
  const props = PropertiesService.getScriptProperties();
  const sid = String(props.getProperty('SPREADSHEET_ID') || DEFAULT_SPREADSHEET_ID || '').trim();
  if (sid) return SpreadsheetApp.openById(sid);
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  throw new Error('SPREADSHEET_ID が未設定です。configureSpreadsheetId を実行してください。');
}

function configureSpreadsheetId(spreadsheetId) {
  var sid = String(spreadsheetId || '').trim();
  if (!sid) throw new Error('spreadsheetId is required');
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', sid);
  return { status: 'ok', spreadsheetId: sid };
}

// ========== メニュー ==========

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('ビジネスリサーチ')
    .addItem('📥 初期セットアップ（シート作成・スキーマ更新）', 'setupSheets')
    .addItem('🔄 ダッシュボードシートを更新', 'refreshDashboardSheet')
    .addItem('🧩 BMC詳細列を再計算', 'rebuildBmcDetailColumns')
    .addItem('✅ データ品質チェック', 'validateSheets')
    .addToUi();
}

// ========== シート初期化 ==========

function setupSheets() {
  const ss = _getSpreadsheet();

  ['シート1', 'Sheet1'].forEach(function(name) {
    const s = ss.getSheetByName(name);
    if (s && ss.getSheets().length > 1) ss.deleteSheet(s);
  });

  _setupSheet調査プロジェクト(ss);
  _setupSheet事業(ss);
  _setupSheet運営企業(ss);
  _setupSheetソース(ss);
  _setupSheet引用(ss);
  _setupSheet分析(ss);
  _setupSheetニュース(ss);
  _setupSheetダッシュボード(ss);
  _applyDataValidations(ss);

  SpreadsheetApp.getUi().alert(
    'セットアップ完了。\n\n' +
    '次のステップ：\n' +
    '「デプロイ > 新しいデプロイ > ウェブアプリ」でURLを発行し、\n' +
    'Claude の環境変数 BUSINESS_RESEARCH_WEBHOOK にそのURLを設定してください。'
  );
}

function _setupSheet調査プロジェクト(ss) {
  const sheet = ss.getSheetByName('調査プロジェクト') || ss.insertSheet('調査プロジェクト');
  _writeHeaders(sheet, [
    'プロジェクトID', 'プロジェクト名', '調査目的', 'カテゴリ', '調査対象事業ID',
    'ポジション軸X名', 'ポジション軸Y名', '作成日時'
  ], '#dbeafe');
}

function _setupSheet事業(ss) {
  const sheet = ss.getSheetByName('事業') || ss.insertSheet('事業');
  _writeHeaders(sheet, [
    '事業ID', 'プロジェクトID', '事業名', 'サービス名', '公式URL', '事業種別', '運営企業ID',
    '価格帯', 'ポジションX値', 'ポジションY値',
    'BMC_価値提案', 'BMC_顧客セグメント', 'BMC_チャネル', 'BMC_顧客との関係',
    'BMC_収益の流れ', 'BMC_主要リソース', 'BMC_主要活動', 'BMC_主要パートナー', 'BMC_コスト構造', '主要KPI',
    'BMC詳細_価値提案', 'BMC詳細_顧客セグメント', 'BMC詳細_チャネル', 'BMC詳細_顧客との関係',
    'BMC詳細_収益の流れ', 'BMC詳細_主要リソース', 'BMC詳細_主要活動', 'BMC詳細_主要パートナー', 'BMC詳細_コスト構造',
    '財務シミュレーション_JSON', '実績_JSON', 'BMC詳細_JSON'
  ], '#dcfce7');
}

function _setupSheet運営企業(ss) {
  const sheet = ss.getSheetByName('運営企業') || ss.insertSheet('運営企業');
  _writeHeaders(sheet, ['企業ID', '企業名', '企業URL', '規模感'], '#e0f2fe');
}

function _setupSheetソース(ss) {
  const sheet = ss.getSheetByName('ソース') || ss.insertSheet('ソース');
  _writeHeaders(sheet, [
    'ソースID', '事業ID', 'URL', 'ページタイトル', '種別', '観点', '取得日時', 'メモ'
  ], '#fef9c3');
}

function _setupSheet引用(ss) {
  const sheet = ss.getSheetByName('引用') || ss.insertSheet('引用');
  _writeHeaders(sheet, [
    '引用ID', 'ソースID', '事業ID', '引用テキスト', '感情', '観点', '顧客属性', '根拠区分'
  ], '#fce7f3');
}

function _setupSheet分析(ss) {
  const sheet = ss.getSheetByName('分析') || ss.insertSheet('分析');
  _writeHeaders(sheet, [
    '分析ID', 'プロジェクトID', '事業ID', '観点', '結論', '証跡JSON', '確信度', '根拠区分'
  ], '#f3e8ff');
}

function _setupSheetニュース(ss) {
  const sheet = ss.getSheetByName('ニュース') || ss.insertSheet('ニュース');
  _writeHeaders(sheet, [
    'ニュースID', '事業ID', 'タイトル', 'URL', '日付', '種別', '要点'
  ], '#fff7ed');
}

function _setupSheetダッシュボード(ss) {
  const sheet = ss.getSheetByName('ダッシュボード表示用') || ss.insertSheet('ダッシュボード表示用');
  _writeHeaders(sheet, [
    'プロジェクトID', 'プロジェクト名', 'カテゴリ', '調査目的',
    '調査対象事業名', '競合事業数', '参照事業一覧', '最終更新日時'
  ], '#e8f5e9');
}

function _writeHeaders(sheet, headers, bgColor) {
  const clearTo = Math.max(sheet.getLastColumn(), headers.length);
  sheet.getRange(1, 1, 1, clearTo).clearContent().clearDataValidations();
  const range = sheet.getRange(1, 1, 1, headers.length);
  range.setValues([headers]);
  range.setFontWeight('bold').setBackground(bgColor);
  sheet.setFrozenRows(1);
}

function _applyDataValidations(ss) {
  const rules = [
    { sheet: '事業', col: '事業種別', list: ['調査対象', '直接競合', '間接競合', '代替サービス', '比較対象'] },
    { sheet: 'ソース', col: '種別', list: ['公式サイト', 'レビューサイト', 'ニュース', 'ブログ', 'SNS', 'その他'] },
    { sheet: '引用', col: '感情', list: ['ポジティブ', 'ネガティブ', 'ニュートラル'] },
    { sheet: '引用', col: '観点', list: ['顧客', '価値', '不満', 'アナリスト'] },
    { sheet: '分析', col: '観点', list: ['価値', '仕組み', '顧客', '不満', '直近の動き', '示唆'] },
    { sheet: 'ニュース', col: '種別', list: ['プレスリリース', 'ニュース', 'レビュー', 'ブログ', 'SNS', 'その他'] }
  ];

  rules.forEach(function(r) {
    const sheet = ss.getSheetByName(r.sheet);
    if (!sheet) return;
    const col = _headerColIndex(sheet, r.col);
    if (col < 1) return;
    const startRow = 2;
    const rowCount = Math.max(sheet.getMaxRows() - 1, 1);
    const range = sheet.getRange(startRow, col, rowCount, 1);
    const validation = SpreadsheetApp.newDataValidation()
      .requireValueInList(r.list, true)
      .setAllowInvalid(true)
      .build();
    range.setDataValidation(validation);
  });
}

function _headerColIndex(sheet, headerName) {
  const width = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, width).getValues()[0];
  const idx = headers.indexOf(headerName);
  return idx >= 0 ? idx + 1 : -1;
}

// ========== ダッシュボード表示用シートの更新 ==========

function refreshDashboardSheet() {
  const ss = _getSpreadsheet();
  if (!ss.getSheetByName('調査プロジェクト')) {
    SpreadsheetApp.getUi().alert('先に初期セットアップを実行してください。');
    return;
  }
  _applyDataValidations(ss);
  refreshDashboardSheet_();
  SpreadsheetApp.getUi().alert('ダッシュボード表示用シートを更新しました。');
}

function validateSheets() {
  const ss = _getSpreadsheet();
  const issues = _collectSheetIssues(ss);
  const reportSheet = ss.getSheetByName('データ品質') || ss.insertSheet('データ品質');
  reportSheet.clearContents();
  const headers = ['レベル', 'シート', '行番号', '列名', 'エラー種別', '詳細'];
  reportSheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#fee2e2');

  if (!issues.length) {
    reportSheet.getRange(2, 1, 1, headers.length).setValues([['OK', '-', '-', '-', 'データ品質', '問題は見つかりませんでした']]);
    SpreadsheetApp.getUi().alert('データ品質チェック: 問題は見つかりませんでした。');
    return;
  }

  const rows = issues.map(function(i) {
    return [i.level || 'WARN', i.sheet || '-', i.row || '-', i.column || '-', i.type || '-', i.detail || ''];
  });
  reportSheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  reportSheet.autoResizeColumns(1, headers.length);
  SpreadsheetApp.getUi().alert('データ品質チェック完了: ' + rows.length + '件の指摘を「データ品質」シートに出力しました。');
}

function _collectSheetIssues(ss) {
  const issues = [];
  const projects = _getSheetAsObjects(ss.getSheetByName('調査プロジェクト'));
  const businesses = _getSheetAsObjects(ss.getSheetByName('事業'));
  const companies = _getSheetAsObjects(ss.getSheetByName('運営企業'));
  const sources = _getSheetAsObjects(ss.getSheetByName('ソース'));
  const quotes = _getSheetAsObjects(ss.getSheetByName('引用'));
  const analyses = _getSheetAsObjects(ss.getSheetByName('分析'));
  const news = _getSheetAsObjects(ss.getSheetByName('ニュース'));

  const allowed = {
    businessRole: ['調査対象', '直接競合', '間接競合', '代替サービス', '比較対象'],
    quoteSentiment: ['ポジティブ', 'ネガティブ', 'ニュートラル'],
    quotePerspective: ['顧客', '価値', '不満', 'アナリスト'],
    analysisPerspective: ['価値', '仕組み', '顧客', '不満', '直近の動き', '示唆'],
    sourceType: ['公式サイト', 'レビューサイト', 'ニュース', 'ブログ', 'SNS', 'その他'],
    newsType: ['プレスリリース', 'ニュース', 'レビュー', 'ブログ', 'SNS', 'その他']
  };

  function push(level, sheet, row, column, type, detail) {
    issues.push({ level: level, sheet: sheet, row: row, column: column, type: type, detail: detail });
  }
  function notEmpty(v) { return String(v || '').trim() !== ''; }
  function addDuplicateChecks(rows, sheetName, idColumn) {
    const seen = {};
    rows.forEach(function(r, idx) {
      const id = String(r[idColumn] || '').trim();
      if (!id) {
        push('ERROR', sheetName, idx + 2, idColumn, '必須未入力', 'IDが空です');
        return;
      }
      if (seen[id]) push('ERROR', sheetName, idx + 2, idColumn, '重複ID', '同じIDが複数存在します: ' + id);
      seen[id] = true;
    });
    return seen;
  }
  function checkEnum(rows, sheetName, column, allowedValues) {
    rows.forEach(function(r, idx) {
      const v = String(r[column] || '').trim();
      if (!v) return;
      if (allowedValues.indexOf(v) < 0) {
        push('WARN', sheetName, idx + 2, column, '値の揺れ', '許容外の値です: ' + v);
      }
    });
  }

  const projectIds = addDuplicateChecks(projects, '調査プロジェクト', 'プロジェクトID') || {};
  const businessIds = addDuplicateChecks(businesses, '事業', '事業ID') || {};
  const companyIds = addDuplicateChecks(companies, '運営企業', '企業ID') || {};
  const sourceIds = addDuplicateChecks(sources, 'ソース', 'ソースID') || {};
  addDuplicateChecks(quotes, '引用', '引用ID');
  addDuplicateChecks(analyses, '分析', '分析ID');
  addDuplicateChecks(news, 'ニュース', 'ニュースID');

  businesses.forEach(function(r, idx) {
    const row = idx + 2;
    if (notEmpty(r['プロジェクトID']) && !projectIds[String(r['プロジェクトID']).trim()]) push('ERROR', '事業', row, 'プロジェクトID', '参照不整合', '調査プロジェクトに存在しないIDです');
    if (notEmpty(r['運営企業ID']) && !companyIds[String(r['運営企業ID']).trim()]) push('WARN', '事業', row, '運営企業ID', '参照不整合', '運営企業に存在しないIDです');
    if (notEmpty(r['ポジションX値']) && isNaN(Number(r['ポジションX値']))) push('WARN', '事業', row, 'ポジションX値', '型不整合', '数値で入力してください');
    if (notEmpty(r['ポジションY値']) && isNaN(Number(r['ポジションY値']))) push('WARN', '事業', row, 'ポジションY値', '型不整合', '数値で入力してください');
  });

  sources.forEach(function(r, idx) {
    const row = idx + 2;
    if (notEmpty(r['事業ID']) && !businessIds[String(r['事業ID']).trim()]) push('ERROR', 'ソース', row, '事業ID', '参照不整合', '事業に存在しないIDです');
  });
  quotes.forEach(function(r, idx) {
    const row = idx + 2;
    if (notEmpty(r['事業ID']) && !businessIds[String(r['事業ID']).trim()]) push('ERROR', '引用', row, '事業ID', '参照不整合', '事業に存在しないIDです');
    if (notEmpty(r['ソースID']) && !sourceIds[String(r['ソースID']).trim()]) push('WARN', '引用', row, 'ソースID', '参照不整合', 'ソースに存在しないIDです');
  });
  analyses.forEach(function(r, idx) {
    const row = idx + 2;
    if (notEmpty(r['プロジェクトID']) && !projectIds[String(r['プロジェクトID']).trim()]) push('ERROR', '分析', row, 'プロジェクトID', '参照不整合', '調査プロジェクトに存在しないIDです');
    if (notEmpty(r['事業ID']) && !businessIds[String(r['事業ID']).trim()]) push('ERROR', '分析', row, '事業ID', '参照不整合', '事業に存在しないIDです');
    const ev = String(r['証跡JSON'] || '').trim();
    if (ev) {
      try { JSON.parse(ev); } catch (e) { push('WARN', '分析', row, '証跡JSON', 'JSON不正', '証跡JSONのパースに失敗しました'); }
    }
  });
  news.forEach(function(r, idx) {
    const row = idx + 2;
    if (notEmpty(r['事業ID']) && !businessIds[String(r['事業ID']).trim()]) push('ERROR', 'ニュース', row, '事業ID', '参照不整合', '事業に存在しないIDです');
  });

  checkEnum(businesses, '事業', '事業種別', allowed.businessRole);
  checkEnum(sources, 'ソース', '種別', allowed.sourceType);
  checkEnum(quotes, '引用', '感情', allowed.quoteSentiment);
  checkEnum(quotes, '引用', '観点', allowed.quotePerspective);
  checkEnum(analyses, '分析', '観点', allowed.analysisPerspective);
  checkEnum(news, 'ニュース', '種別', allowed.newsType);

  return issues;
}

function refreshDashboardSheet_() {
  const ss = _getSpreadsheet();
  const projectsSheet = ss.getSheetByName('調査プロジェクト');
  const dashSheet = ss.getSheetByName('ダッシュボード表示用');
  if (!projectsSheet || !dashSheet) return;

  const projects = _getSheetAsObjects(projectsSheet);
  const businesses = _getSheetAsObjects(ss.getSheetByName('事業'));

  const lastRow = dashSheet.getLastRow();
  if (lastRow > 1) {
    dashSheet.getRange(2, 1, lastRow - 1, dashSheet.getLastColumn()).clearContent();
  }

  const now = new Date();
  projects.forEach(function(proj) {
    const pid = proj['プロジェクトID'];
    const bizList = businesses.filter(function(b) { return b['プロジェクトID'] === pid; });
    const target = bizList.find(function(b) { return b['事業種別'] === '調査対象'; }) || {};
    const competitors = bizList.filter(function(b) { return b['事業種別'] !== '調査対象'; });
    const bizNames = bizList.map(function(b) { return b['事業名'] + '(' + b['事業種別'] + ')'; }).join(', ');

    dashSheet.appendRow([
      pid,
      proj['プロジェクト名'] || '',
      proj['カテゴリ'] || '',
      proj['調査目的'] || '',
      target['事業名'] || '',
      competitors.length,
      bizNames,
      now
    ]);
  });
}

function _getSheetAsObjects(sheet) {
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).map(function(row) {
    const obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
}

// ========== Web アプリ（ダッシュボード表示） ==========

function doGet(e) {
  var requestedProjectId = '';
  try { requestedProjectId = String((e && e.parameter && e.parameter.projectId) || '').trim(); } catch(err) {}
  var initialData = null;
  try { initialData = getDashboardData(requestedProjectId); } catch(e) {}

  var htmlOut = HtmlService.createHtmlOutputFromFile('dashboard');
  var content = htmlOut.getContent();
  var jsonStr = initialData ? JSON.stringify(initialData) : 'null';
  content = content.replace('"__INITIAL_DATA_PLACEHOLDER__"', jsonStr);

  return HtmlService.createHtmlOutput(content)
    .setTitle('Business Research Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getDashboardData(projectId) {
  const ss = _getSpreadsheet();
  const projectsData = _getSheetAsObjects(ss.getSheetByName('調査プロジェクト'));
  if (projectsData.length === 0) return null;

  const sorted = projectsData.slice().reverse();
  const projects = sorted.map(function(p) {
    return {
      id: p['プロジェクトID'],
      name: p['プロジェクト名'],
      date: p['作成日時'] ? String(p['作成日時']).slice(0, 10) : ''
    };
  });

  const requested = String(projectId || '').trim();
  const activeId = requested && projects.some(function(p) { return p.id === requested; }) ? requested : sorted[0]['プロジェクトID'];
  const detail = _buildProjectDetail(ss, activeId);
  return { projects: projects, detail: detail };
}

function getResearchData(projectId) {
  const ss = _getSpreadsheet();
  return _buildProjectDetail(ss, projectId);
}

function _buildProjectDetail(ss, projectId) {
  const projectsData = _getSheetAsObjects(ss.getSheetByName('調査プロジェクト'));
  const project = projectsData.find(function(p) { return p['プロジェクトID'] === projectId; });
  if (!project) return null;

  const businessesData = _getSheetAsObjects(ss.getSheetByName('事業'));
  const companiesData = _getSheetAsObjects(ss.getSheetByName('運営企業'));
  const sourcesData = _getSheetAsObjects(ss.getSheetByName('ソース'));
  const quotesData = _getSheetAsObjects(ss.getSheetByName('引用'));
  const analysesData = _getSheetAsObjects(ss.getSheetByName('分析'));
  const newsData = _getSheetAsObjects(ss.getSheetByName('ニュース'));

  const businesses = businessesData.filter(function(b) { return b['プロジェクトID'] === projectId; });

  const enrichedBusinesses = businesses.map(function(b) {
    const company = companiesData.find(function(c) { return c['企業ID'] === b['運営企業ID']; }) || {};
    const sources = sourcesData.filter(function(s) { return s['事業ID'] === b['事業ID']; });
    const sourceMap = {};
    sources.forEach(function(s) { sourceMap[String(s['ソースID'] || '')] = s['URL'] || ''; });
    const quotes = quotesData.filter(function(q) { return q['事業ID'] === b['事業ID']; }).map(function(q) {
      return Object.assign({}, q, { sourceUrl: sourceMap[String(q['ソースID'] || '')] || '' });
    });
    const news = newsData
      .filter(function(n) { return n['事業ID'] === b['事業ID']; })
      .sort(function(a, x) {
        var da = a['日付'] ? String(a['日付']) : '';
        var dx = x['日付'] ? String(x['日付']) : '';
        return dx > da ? 1 : dx < da ? -1 : 0;
      });
    const analyses = analysesData.filter(function(a) { return a['事業ID'] === b['事業ID']; }).map(function(a) {
      var evidence = [];
      try { evidence = JSON.parse(a['証跡JSON'] || '[]'); } catch(e) {}
      return {
        perspective: a['観点'],
        conclusion: a['結論'],
        evidence: evidence,
        confidence: a['確信度'],
        evidenceLevel: a['根拠区分']
      };
    });

    var posX = b['ポジションX値'];
    var posY = b['ポジションY値'];

    return {
      businessId: b['事業ID'],
      role: b['事業種別'],
      businessName: b['事業名'],
      serviceName: b['サービス名'],
      url: b['公式URL'],
      pricing: b['価格帯'] || '',
      kpi: b['主要KPI'] || '',
      positionX: (posX !== '' && posX !== null && posX !== undefined) ? Number(posX) : null,
      positionY: (posY !== '' && posY !== null && posY !== undefined) ? Number(posY) : null,
      bmc: {
        valueProposition:      b['BMC_価値提案'] || '',
        customerSegments:      b['BMC_顧客セグメント'] || '',
        channels:              b['BMC_チャネル'] || '',
        customerRelationships: b['BMC_顧客との関係'] || '',
        revenueStreams:        b['BMC_収益の流れ'] || '',
        keyResources:          b['BMC_主要リソース'] || '',
        keyActivities:         b['BMC_主要活動'] || '',
        keyPartners:           b['BMC_主要パートナー'] || '',
        costStructure:         b['BMC_コスト構造'] || ''
      },
      company: {
        name: company['企業名'] || '',
        url: company['企業URL'] || '',
        scale: company['規模感'] || ''
      },
      financials: (function() {
        var v = b['財務シミュレーション_JSON'];
        if (!v) return null;
        try { return JSON.parse(String(v)); } catch(e) { return null; }
      })(),
      achievements: (function() {
        var v = b['実績_JSON'];
        if (!v) return null;
        try { return JSON.parse(String(v)); } catch(e) { return null; }
      })(),
      bmcDetails: (function() {
        var v = b['BMC詳細_JSON'];
        if (!v) return null;
        try { return JSON.parse(String(v)); } catch(e) { return null; }
      })(),
      bmcDetailNotes: {
        valueProposition:      b['BMC詳細_価値提案'] || '',
        customerSegments:      b['BMC詳細_顧客セグメント'] || '',
        channels:              b['BMC詳細_チャネル'] || '',
        customerRelationships: b['BMC詳細_顧客との関係'] || '',
        revenueStreams:        b['BMC詳細_収益の流れ'] || '',
        keyResources:          b['BMC詳細_主要リソース'] || '',
        keyActivities:         b['BMC詳細_主要活動'] || '',
        keyPartners:           b['BMC詳細_主要パートナー'] || '',
        costStructure:         b['BMC詳細_コスト構造'] || ''
      },
      news: news,
      sources: sources,
      quotes: quotes,
      analyses: analyses
    };
  });

  const crossAnalyses = analysesData
    .filter(function(a) {
      return a['プロジェクトID'] === projectId && (a['事業ID'] === '' || a['事業ID'] === null || a['事業ID'] === undefined);
    })
    .map(function(a) {
      var evidence = [];
      try { evidence = JSON.parse(a['証跡JSON'] || '[]'); } catch(e) {}
      return {
        perspective: a['観点'],
        conclusion: a['結論'],
        evidence: evidence,
        confidence: a['確信度'],
        evidenceLevel: a['根拠区分']
      };
    });

  return {
    project: project,
    businesses: enrichedBusinesses,
    crossAnalyses: crossAnalyses
  };
}

function _toText(v) {
  return String(v || '').trim();
}

function _asArray(v) {
  return Array.isArray(v) ? v : [];
}

function _dedupeLines(lines) {
  const out = [];
  const seen = {};
  (lines || []).forEach(function(v) {
    const s = _toText(v);
    if (!s || seen[s]) return;
    seen[s] = true;
    out.push(s);
  });
  return out;
}

function _collectAnalysisEvidence(payload, businessId, perspectives) {
  const p = payload || {};
  const wants = perspectives || [];
  const lines = [];
  _asArray(p.analyses).forEach(function(a) {
    if ((a.businessId || '') !== businessId) return;
    if (wants.length && wants.indexOf(a.perspective || '') < 0) return;
    _asArray(a.evidence).forEach(function(ev) {
      const quote = _toText(ev.quote || ev.text);
      const sourceTitle = _toText(ev.sourceTitle);
      const sourceUrl = _toText(ev.sourceUrl);
      const sourceMemo = _dedupeLines([sourceTitle, sourceUrl]).join(' | ');
      if (quote) {
        lines.push('"' + quote + '"' + (sourceMemo ? '（' + sourceMemo + '）' : ''));
      } else if (sourceMemo) {
        lines.push(sourceMemo);
      }
    });
  });
  return _dedupeLines(lines);
}

function _collectSourceLines(payload, businessId) {
  const p = payload || {};
  const lines = [];
  _asArray(p.sources).forEach(function(src) {
    if ((src.businessId || '') !== businessId) return;
    const parts = _dedupeLines([
      _toText(src.title),
      _toText(src.type),
      _toText(src.url)
    ]);
    if (parts.length) lines.push(parts.join(' | '));
  });
  return _dedupeLines(lines);
}

function _collectNewsLines(payload, businessId) {
  const p = payload || {};
  const lines = [];
  _asArray(p.news).forEach(function(n) {
    if ((n.businessId || '') !== businessId) return;
    const parts = _dedupeLines([
      _toText(n.date),
      _toText(n.title),
      _toText(n.type),
      _toText(n.url)
    ]);
    if (parts.length) lines.push(parts.join(' | '));
  });
  return _dedupeLines(lines);
}

function _pushLabeledList(lines, label, items) {
  const vals = _dedupeLines(items);
  if (!vals.length) return;
  lines.push(label);
  vals.forEach(function(v) { lines.push('- ' + v); });
}

function _buildBmcDetailCell(rawDetail, fallbackSummary, evidenceLines, sourceLines, newsLines, detailKeys) {
  const detail = rawDetail || {};
  const lines = [];
  const summary = _toText(detail.summary || fallbackSummary);
  if (summary) lines.push('評価: ' + summary);

  const detailItems = [];
  function pushDetailItem(item) {
    if (item === null || item === undefined) return;
    if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
      const t = _toText(item);
      if (t) detailItems.push(t);
      return;
    }
    if (typeof item === 'object') {
      const packed = _dedupeLines([item.topic, item.detail, item.name, item.pricing, item.model, item.summary]).join(' | ');
      if (packed) {
        detailItems.push(packed);
      } else {
        const asJson = _toText(JSON.stringify(item));
        if (asJson && asJson !== '{}') detailItems.push(asJson);
      }
    }
  }
  (detailKeys || []).forEach(function(k) {
    const v = detail[k];
    if (Array.isArray(v)) {
      v.forEach(pushDetailItem);
    } else {
      pushDetailItem(v);
    }
  });
  _pushLabeledList(lines, '評価に使った記述:', detailItems);
  _pushLabeledList(lines, '分析の根拠記述:', evidenceLines);
  _pushLabeledList(lines, '関連ソース:', sourceLines);
  _pushLabeledList(lines, '関連ニュース:', newsLines);

  return lines.join('\n');
}

function _buildBmcDetailColumns(payload, biz) {
  const businessId = _toText(biz.businessId);
  const bmc = biz.bmc || {};
  const d = biz.bmcDetails || {};
  const sourceLines = _collectSourceLines(payload, businessId);
  const newsLines = _collectNewsLines(payload, businessId);
  const evidenceBy = {
    vp: _collectAnalysisEvidence(payload, businessId, ['価値']),
    cs: _collectAnalysisEvidence(payload, businessId, ['顧客', '不満']),
    ch: _collectAnalysisEvidence(payload, businessId, ['顧客']),
    cr: _collectAnalysisEvidence(payload, businessId, ['顧客']),
    rev: _collectAnalysisEvidence(payload, businessId, ['価値', '仕組み']),
    kr: _collectAnalysisEvidence(payload, businessId, ['仕組み']),
    ka: _collectAnalysisEvidence(payload, businessId, ['仕組み']),
    kp: _collectAnalysisEvidence(payload, businessId, ['仕組み']),
    cost: _collectAnalysisEvidence(payload, businessId, ['不満', '仕組み'])
  };

  return {
    valueProposition: _buildBmcDetailCell(d.valueProposition, bmc.valueProposition, evidenceBy.vp, sourceLines, newsLines, ['topics', 'points', 'painPoints', 'differentiators']),
    customerSegments: _buildBmcDetailCell(d.customerSegments, bmc.customerSegments, evidenceBy.cs, sourceLines, newsLines, ['topics', 'primary', 'secondary', 'excluded']),
    channels: _buildBmcDetailCell(d.channels, bmc.channels, evidenceBy.ch, sourceLines, newsLines, ['topics', 'acquisition', 'retention', 'items']),
    customerRelationships: _buildBmcDetailCell(d.customerRelationships, bmc.customerRelationships, evidenceBy.cr, sourceLines, newsLines, ['topics', 'mechanisms', 'items']),
    revenueStreams: _buildBmcDetailCell(d.revenueStreams, bmc.revenueStreams || biz.pricing || '', evidenceBy.rev, sourceLines, newsLines, ['topics', 'streams', 'items']),
    keyResources: _buildBmcDetailCell(d.keyResources, bmc.keyResources, evidenceBy.kr, sourceLines, newsLines, ['topics', 'items']),
    keyActivities: _buildBmcDetailCell(d.keyActivities, bmc.keyActivities, evidenceBy.ka, sourceLines, newsLines, ['topics', 'items']),
    keyPartners: _buildBmcDetailCell(d.keyPartners, bmc.keyPartners, evidenceBy.kp, sourceLines, newsLines, ['topics', 'items']),
    costStructure: _buildBmcDetailCell(d.costStructure, bmc.costStructure, evidenceBy.cost, sourceLines, newsLines, ['topics', 'fixed', 'variable', 'items'])
  };
}

function rebuildBmcDetailColumns() {
  const ss = _getSpreadsheet();
  const bizSheet = ss.getSheetByName('事業');
  if (!bizSheet) {
    SpreadsheetApp.getUi().alert('事業シートが見つかりません。先に初期セットアップを実行してください。');
    return;
  }

  const businesses = _getSheetAsObjects(bizSheet);
  if (!businesses.length) {
    SpreadsheetApp.getUi().alert('事業シートにデータがありません。');
    return;
  }

  const sources = _getSheetAsObjects(ss.getSheetByName('ソース'));
  const analyses = _getSheetAsObjects(ss.getSheetByName('分析'));
  const news = _getSheetAsObjects(ss.getSheetByName('ニュース'));

  const headers = bizSheet.getRange(1, 1, 1, Math.max(bizSheet.getLastColumn(), 1)).getValues()[0];
  const detailCols = [
    'BMC詳細_価値提案', 'BMC詳細_顧客セグメント', 'BMC詳細_チャネル', 'BMC詳細_顧客との関係',
    'BMC詳細_収益の流れ', 'BMC詳細_主要リソース', 'BMC詳細_主要活動', 'BMC詳細_主要パートナー', 'BMC詳細_コスト構造'
  ].map(function(name) {
    const idx = headers.indexOf(name);
    return idx >= 0 ? idx + 1 : -1;
  });
  if (detailCols.some(function(v) { return v < 1; })) {
    SpreadsheetApp.getUi().alert('BMC詳細列が不足しています。先に初期セットアップを実行してください。');
    return;
  }

  const updates = businesses.map(function(b) {
    var bmcDetails = {};
    try { bmcDetails = JSON.parse(String(b['BMC詳細_JSON'] || '{}')); } catch(e) {}

    const payload = {
      sources: sources.filter(function(s) { return (s['事業ID'] || '') === (b['事業ID'] || ''); }).map(function(s) {
        return { businessId: s['事業ID'], title: s['ページタイトル'], type: s['種別'], url: s['URL'] };
      }),
      analyses: analyses.filter(function(a) { return (a['事業ID'] || '') === (b['事業ID'] || ''); }).map(function(a) {
        var evidence = [];
        try { evidence = JSON.parse(String(a['証跡JSON'] || '[]')); } catch(e) {}
        return { businessId: a['事業ID'], perspective: a['観点'], evidence: evidence };
      }),
      news: news.filter(function(n) { return (n['事業ID'] || '') === (b['事業ID'] || ''); }).map(function(n) {
        return { businessId: n['事業ID'], date: n['日付'], title: n['タイトル'], type: n['種別'], url: n['URL'] };
      })
    };

    const cols = _buildBmcDetailColumns(payload, {
      businessId: b['事業ID'] || '',
      pricing: b['価格帯'] || '',
      bmc: {
        valueProposition: b['BMC_価値提案'] || '',
        customerSegments: b['BMC_顧客セグメント'] || '',
        channels: b['BMC_チャネル'] || '',
        customerRelationships: b['BMC_顧客との関係'] || '',
        revenueStreams: b['BMC_収益の流れ'] || '',
        keyResources: b['BMC_主要リソース'] || '',
        keyActivities: b['BMC_主要活動'] || '',
        keyPartners: b['BMC_主要パートナー'] || '',
        costStructure: b['BMC_コスト構造'] || ''
      },
      bmcDetails: bmcDetails
    });

    return [
      cols.valueProposition || '',
      cols.customerSegments || '',
      cols.channels || '',
      cols.customerRelationships || '',
      cols.revenueStreams || '',
      cols.keyResources || '',
      cols.keyActivities || '',
      cols.keyPartners || '',
      cols.costStructure || ''
    ];
  });

  const startRow = 2;
  detailCols.forEach(function(col, i) {
    const colValues = updates.map(function(row) { return [row[i]]; });
    bizSheet.getRange(startRow, col, colValues.length, 1).setValues(colValues);
  });

  SpreadsheetApp.getUi().alert('BMC詳細列を再計算しました（' + updates.length + '件）。');
}

// ========== Webhook（JSON 受信 → シート書き込み） ==========

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const props = PropertiesService.getScriptProperties();
    const secret = props.getProperty('WEBHOOK_SECRET');

    // ── ブートストラップ：シークレット未設定時のみ初回登録を受け付ける ──
    if (payload._setupSecret) {
      if (secret) {
        return ContentService
          .createTextOutput(JSON.stringify({ error: 'Already configured. Use _secret to authenticate.' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      props.setProperty('WEBHOOK_SECRET', payload._setupSecret);
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'secret_registered' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── 通常リクエスト：シークレット検証 ──
    if (secret && payload._secret !== secret) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: 'Unauthorized' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const ss = _getSpreadsheet();
    const now = new Date();
    const proj = payload.project || {};
    const projectId = proj.projectId || '';
    const payloadBusinesses = _asArray(payload.businesses);
    const payloadSources = _asArray(payload.sources);
    const payloadQuotes = _asArray(payload.quotes);
    const payloadAnalyses = _asArray(payload.analyses);
    const payloadNews = _asArray(payload.news);

    // 1. 調査プロジェクト
    const sheetProj = ss.getSheetByName('調査プロジェクト');
    if (sheetProj) {
      const existingProjects = _getSheetAsObjects(sheetProj);
      const alreadyExists = existingProjects.some(function(r) { return r['プロジェクトID'] === projectId; });
      if (alreadyExists) {
        return ContentService
          .createTextOutput(JSON.stringify({ error: 'project_id_already_exists', id: projectId }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      const targetBiz = payloadBusinesses.find(function(b) { return b.role === '調査対象'; });
      sheetProj.appendRow([
        projectId,
        proj.projectName || '',
        proj.purpose || '',
        proj.category || '',
        targetBiz ? (targetBiz.businessId || '') : '',
        proj.positionAxisX || '',
        proj.positionAxisY || '',
        now
      ]);
    }

    // 2. 運営企業
    const sheetComp = ss.getSheetByName('運営企業');
    const companyIdMap = {};
    if (sheetComp) {
      payloadBusinesses.forEach(function(biz, idx) {
        if (biz.company) {
          const companyId = projectId + '-company-' + idx;
          companyIdMap[biz.businessId] = companyId;
          sheetComp.appendRow([
            companyId,
            biz.company.companyName || '',
            biz.company.companyUrl || '',
            biz.company.scale || ''
          ]);
        }
      });
    }

    // 3. 事業（BMC + ポジション）
    const sheetBiz = ss.getSheetByName('事業');
    if (sheetBiz) {
      payloadBusinesses.forEach(function(biz) {
        var bmc = biz.bmc || {};
        var bmcDetailCols = _buildBmcDetailColumns(payload, biz);
        sheetBiz.appendRow([
          biz.businessId || '',
          projectId,
          biz.businessName || '',
          biz.serviceName || biz.businessName || '',
          biz.url || '',
          biz.role || '',
          companyIdMap[biz.businessId] || '',
          biz.pricing || '',
          (biz.positionX !== undefined && biz.positionX !== null) ? biz.positionX : '',
          (biz.positionY !== undefined && biz.positionY !== null) ? biz.positionY : '',
          bmc.valueProposition      || '',
          bmc.customerSegments      || '',
          bmc.channels              || '',
          bmc.customerRelationships || '',
          bmc.revenueStreams         || '',
          bmc.keyResources          || '',
          bmc.keyActivities         || '',
          bmc.keyPartners           || '',
          bmc.costStructure         || '',
          biz.kpi || biz.majorKpi || '',
          bmcDetailCols.valueProposition || '',
          bmcDetailCols.customerSegments || '',
          bmcDetailCols.channels || '',
          bmcDetailCols.customerRelationships || '',
          bmcDetailCols.revenueStreams || '',
          bmcDetailCols.keyResources || '',
          bmcDetailCols.keyActivities || '',
          bmcDetailCols.keyPartners || '',
          bmcDetailCols.costStructure || '',
          biz.financials   ? JSON.stringify(biz.financials)   : '',
          biz.achievements ? JSON.stringify(biz.achievements) : '',
          biz.bmcDetails   ? JSON.stringify(biz.bmcDetails)   : ''
        ]);
      });
    }

    // 4. ソース
    const sheetSrc = ss.getSheetByName('ソース');
    if (sheetSrc) {
      payloadSources.forEach(function(src) {
        sheetSrc.appendRow([
          src.sourceId || '',
          src.businessId || '',
          src.url || '',
          src.title || '',
          src.type || '',
          src.perspective || '',
          now,
          src.memo || ''
        ]);
      });
    }

    // 5. 引用
    const sheetQuote = ss.getSheetByName('引用');
    if (sheetQuote) {
      payloadQuotes.forEach(function(q) {
        sheetQuote.appendRow([
          q.quoteId || '',
          q.sourceId || '',
          q.businessId || '',
          q.text || '',
          q.sentiment || '',
          q.perspective || '',
          q.customerProfile || '',
          q.evidenceLevel || ''
        ]);
      });
    }

    // 6. 分析
    const sheetAna = ss.getSheetByName('分析');
    if (sheetAna) {
      payloadAnalyses.forEach(function(a) {
        sheetAna.appendRow([
          a.analysisId || '',
          projectId,
          a.businessId || '',
          a.perspective || '',
          a.conclusion || '',
          JSON.stringify(Array.isArray(a.evidence) ? a.evidence : []),
          a.confidence || '',
          a.evidenceLevel || ''
        ]);
      });
    }

    // 7. ニュース
    const sheetNews = ss.getSheetByName('ニュース');
    if (sheetNews) {
      payloadNews.forEach(function(n) {
        sheetNews.appendRow([
          n.newsId || '',
          n.businessId || '',
          n.title || '',
          n.url || '',
          n.date || '',
          n.type || '',
          n.summary || ''
        ]);
      });
    }

    // 8. ダッシュボード表示用シートを自動更新
    refreshDashboardSheet_();

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', id: projectId }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    var stack = '';
    try { stack = String(err && err.stack ? err.stack : ''); } catch(e) {}
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.toString(), stack: stack }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
