// .claude/scripts/business-research/setup_dashboard.gs
/**
 * ビジネスリサーチダッシュボード Google Apps Script
 *
 * 【使い方】
 * 1. 新規のGoogleスプレッドシートを作成し、「拡張機能」>「Apps Script」を開く
 * 2. このコードを `コード.gs` に貼り付ける
 * 3. 同様に `dashboard.html` ファイルを作成し、HTMLコードを貼り付ける
 * 4. ファイルを保存後、スプレッドシートに戻って数秒待つと、「ビジネスリサーチ」というメニューが追加されます
 * 5. 「初期セットアップ」を実行するとシートが自動作成されます
 * 6. WebアプリとしてデプロイするとダッシュボードURLとWebhook URL（JSON受信）が生成されます
 */

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('ビジネスリサーチ')
      .addItem('📥 初期セットアップ（シート作成）', 'setupSheets')
      .addToUi();
}

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. 調査管理
  let sheet1 = ss.getSheetByName('調査管理');
  if (!sheet1) sheet1 = ss.insertSheet('調査管理');
  sheet1.getRange('A1:M1').setValues([['調査ID', '調査対象名', '調査対象URL', 'カテゴリ', '調査目的', '入力メモ', '調査日時', '調査ステータス', '勝ち方の要約', '弱みの要約', '狙えそうな余白', '次に深掘るべきこと', '最終更新日時']]);
  sheet1.getRange('A1:M1').setFontWeight('bold').setBackground('#f3f4f6');
  
  // 2. 企業分析
  let sheet2 = ss.getSheetByName('企業分析');
  if (!sheet2) sheet2 = ss.insertSheet('企業分析');
  sheet2.getRange('A1:AF1').setValues([['調査ID', '企業分析ID', '企業名', 'サービス名', '公式URL', '分析対象区分', 'カテゴリ', '主な顧客セグメント', '周辺顧客セグメント', 'セグメント根拠', '主訴求', '顧客の悩み仮説', 'インサイト仮説', '提供価値', '信頼要素', '独自の仕組み', '体制仮説', '再現しにくい強み', '真似しやすい部分', '頻出不満', '不満の背景', '不満の対象層', '攻略余地', '勝ちパターン要約', '狙えそうな切り口', '避けるべき戦い方', '次に深掘るべきこと', '競合根拠', '参考URL一覧', '事実/推定/仮説の区分', '確信度', '更新日時']]);
  sheet2.getRange('A1:AF1').setFontWeight('bold').setBackground('#f3f4f6');
  
  // 3. ソース一覧
  let sheet3 = ss.getSheetByName('ソース一覧');
  if (!sheet3) sheet3 = ss.insertSheet('ソース一覧');
  sheet3.getRange('A1:M1').setValues([['調査ID', '企業分析ID', 'ソースID', '企業名', 'サービス名', 'ソース種別', 'ページタイトル', 'URL', '取得日時', '使った観点', '抜粋メモ', '根拠区分', '確信度']]);
  sheet3.getRange('A1:M1').setFontWeight('bold').setBackground('#f3f4f6');

  // 初期シートは削除
  let sheet1st = ss.getSheetByName('シート1');
  if (sheet1st) ss.deleteSheet(sheet1st);

  SpreadsheetApp.getUi().alert('シートのセットアップが完了しました。Webhookからのデータ受信が可能です。');
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile('dashboard')
      .setTitle('Business Research Dashboard')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * ダッシュボード描画用に「調査管理」シートの最新データを取得する関数
 */
function getDashboardData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('調査管理');
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const headers = data[0];
  const rows = data.slice(1);
  return rows.map(r => {
    let obj = {};
    headers.forEach((h, i) => { obj[h] = r[i]; });
    return obj;
  }).reverse(); // 最新を上に
}

/**
 * WebhookとしてJSONを受け取り、スプレッドシートに追記する関数
 * Claude エージェント（またはcurl）がPOSTするURLになります
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const now = new Date();
    
    // 1. 調査管理シートへ挿入
    const sheet1 = ss.getSheetByName('調査管理');
    if (sheet1) {
      sheet1.appendRow([
        payload.researchId,
        payload.target.companyName,
        payload.target.url,
        payload.target.category,
        payload.target.purpose,
        '', // 入力メモ
        now, // 調査日時
        '完了',
        payload.summary.winningStrategy,
        payload.summary.weakness,
        payload.summary.opportunity,
        payload.summary.nextSteps,
        now
      ]);
    }
    
    // 2. 企業分析シートへ挿入
    const sheet2 = ss.getSheetByName('企業分析');
    if (sheet2) {
      const companyId = payload.researchId + "-target";
      sheet2.appendRow([
        payload.researchId,
        companyId,
        payload.target.companyName,
        payload.target.serviceName,
        payload.target.url,
        "調査対象",
        payload.target.category,
        payload.customer.mainSegment,
        payload.customer.subSegment,
        payload.customer.reasoning,
        payload.valueProposition.mainAppeal,
        payload.valueProposition.painPoints,
        payload.valueProposition.insight,
        payload.valueProposition.value,
        payload.valueProposition.trustFactors,
        payload.mechanism.uniqueSystem,
        payload.mechanism.organization,
        payload.mechanism.hardToCopy,
        payload.mechanism.easyToCopy,
        payload.dissatisfaction.commonComplaints,
        payload.dissatisfaction.background,
        payload.dissatisfaction.targetAudience,
        payload.winningHypothesis.targetSegment, // 攻略余地として
        payload.summary.winningStrategy,
        payload.winningHypothesis.targetSegment,
        payload.winningHypothesis.avoidArea,
        payload.winningHypothesis.nextAction,
        '', // 競合根拠
        '', // 参考URL一覧
        '混在', // 区分
        '', // 確信度
        now
      ]);
      
      // 競合の追加（直接/間接など）
      if (payload.competitors && payload.competitors.length > 0) {
        payload.competitors.forEach((comp, idx) => {
          sheet2.appendRow([
            payload.researchId,
            payload.researchId + "-comp-" + idx,
            comp.name,
            comp.name,
            '',
            comp.type,
            '', // カテゴリ
            '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', comp.description, '', '', '', now
          ]);
        });
      }
    }
    
    // 3. ソース一覧シートへ挿入
    const sheet3 = ss.getSheetByName('ソース一覧');
    if (sheet3 && payload.sources && payload.sources.length > 0) {
      payload.sources.forEach((src, idx) => {
        sheet3.appendRow([
          payload.researchId,
          '', // 企業分析ID
          payload.researchId + "-src-" + idx,
          payload.target.companyName,
          payload.target.serviceName,
          src.type,
          src.title,
          src.url,
          now,
          src.perspective,
          src.memo,
          src.evidenceLevel,
          '' // 確信度
        ]);
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify({status: "success", id: payload.researchId})).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({error: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}
