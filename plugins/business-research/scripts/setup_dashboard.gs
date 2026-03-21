// Business Research Dashboard - Google Apps Script
// スキーマ v2: 調査プロジェクト / 事業(BMC+ポジション) / 運営企業 / ソース / 引用 / 分析 / ニュース

// ========== 設定 ==========

const SPREADSHEET_ID = '1GzbOoVAd2fKE336jGnbQzPNrDV5iRxtNiUJHoUtaW2g';

function _getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// ========== メニュー ==========

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('ビジネスリサーチ')
    .addItem('📥 初期セットアップ（シート作成・スキーマ更新）', 'setupSheets')
    .addItem('🔄 ダッシュボードシートを更新', 'refreshDashboardSheet')
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
    'BMC_収益の流れ', 'BMC_主要リソース', 'BMC_主要活動', 'BMC_主要パートナー', 'BMC_コスト構造', '主要KPI'
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

function doGet() {
  var initialData = null;
  try { initialData = getDashboardData(); } catch(e) {}

  var htmlOut = HtmlService.createHtmlOutputFromFile('dashboard');
  var content = htmlOut.getContent();
  var jsonStr = initialData ? JSON.stringify(initialData) : 'null';
  content = content.replace('"__INITIAL_DATA_PLACEHOLDER__"', jsonStr);

  return HtmlService.createHtmlOutput(content)
    .setTitle('Business Research Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getDashboardData() {
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

  const detail = _buildProjectDetail(ss, sorted[0]['プロジェクトID']);
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
    const quotes = quotesData.filter(function(q) { return q['事業ID'] === b['事業ID']; });
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
      const targetBiz = (payload.businesses || []).find(function(b) { return b.role === '調査対象'; });
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
      (payload.businesses || []).forEach(function(biz, idx) {
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
      (payload.businesses || []).forEach(function(biz) {
        var bmc = biz.bmc || {};
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
          biz.kpi || biz.majorKpi || ''
        ]);
      });
    }

    // 4. ソース
    const sheetSrc = ss.getSheetByName('ソース');
    if (sheetSrc) {
      (payload.sources || []).forEach(function(src) {
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
      (payload.quotes || []).forEach(function(q) {
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
      (payload.analyses || []).forEach(function(a) {
        sheetAna.appendRow([
          a.analysisId || '',
          projectId,
          a.businessId || '',
          a.perspective || '',
          a.conclusion || '',
          JSON.stringify(a.evidence || []),
          a.confidence || '',
          a.evidenceLevel || ''
        ]);
      });
    }

    // 7. ニュース
    const sheetNews = ss.getSheetByName('ニュース');
    if (sheetNews) {
      (payload.news || []).forEach(function(n) {
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
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
