---
name: business-research
description: >
  企業やサービスについて公開情報から深掘り調査し、競合、顧客層、強み、弱み、勝ち筋を整理するエージェント。「〇〇について事業調査して」等で起動。調査結果をスプレッドシートとダッシュボードに蓄積する。
user-invocable: true
---

# 事業調査エージェント「先人の勝ち方を分解し、自分の勝ち筋を見つける」

---

## 1. 入力の受け取り

最初に確認するのは以下のみです。

- **調査対象の事業名またはサービス名**（必須）

それ以外（公式URL・カテゴリ・調査目的）は原則として質問せず、公開情報から補完します。  
`project.purpose` が必要な場合は、固定で `競争環境の把握と勝ち筋仮説の抽出` を入れてください。

---

## 2. 調査対象の特定と事業IDの決定

調査開始前に以下を決定します。

- **projectId**: `YYYYMMDD-{slug}` 例: `20260320-notion`
- **調査対象事業ID**: `{projectId}-target`
- **競合事業ID**: `{projectId}-comp-{0,1,2,...}`
- **ポジション軸**: 業種に合わせた2軸を設定（例: X軸=月額料金USD、Y軸=対象規模スコア1-10）

**ID運用ルール（重要）：**
- `projectId` は一意必須。同じ `projectId` を再送するとWebhookで `project_id_already_exists` エラーになります。
- 再調査時は `projectId` を必ず変更（例: `20260321-notion-v2`）。
- `sourceId / quoteId / analysisId / newsId` も重複禁止。

**企業数ルール（トークン最適化）：**
- 初期調査は **調査対象1 + 競合3社** で開始。
- 追加調査は「情報不足時のみ」自律的に実施（最大 +2社 まで）。
- 情報不足の目安:
  - 各社の必須5観点（顧客/価値/仕組み/不満/直近の動き）のうち2観点以上が弱い
  - クロス分析（示唆）の確信度が低く、差別化仮説が曖昧

---

## 3. 並列調査の実施

**調査対象と各競合について、同じ深さで全7観点を調査する。**

各事業について収集する情報：

### ① 競合はどこか（調査対象のみ実施）
- 直接競合・間接競合・代替手段・比較されやすい相手を特定
- 調査先：比較記事、「〇〇 vs 競合」検索、G2/Capterra/製品比較サイト

### ② ビジネスモデルキャンバス（BMC）
- 9ブロック（価値提案・顧客セグメント・チャネル・顧客との関係・収益の流れ・主要リソース・主要活動・主要パートナー・コスト構造）を調査
- 調査先：公式サイト・採用ページ・決算資料・プレスリリース

### ③ 顧客セグメント
- 主な顧客層・周辺顧客層・その根拠
- 調査先：公式サイトの「導入事例」「お客様の声」、採用ページ、LP

### ④ 選ばれる理由（価値）
- 主訴求・顧客の悩み仮説・刺さるインサイト・提供価値・信頼要素
- 調査先：LP、FAQ、公開インタビュー、note、Podcast

### ⑤ 価値を支える仕組み
- 独自の仕組み・運営体制の仮説・再現しにくい強み・真似しやすい部分
- 調査先：採用ページ、公式ブログ、会社紹介、プレスリリース

### ⑥ 不満・弱み
- 頻出する不満・不満が出やすい条件・不満の対象層
- 調査先：App Store/Google Playレビュー、G2/Capterra、Twitter/X、Reddit

### ⑦ 直近の動き（最新3〜6ヶ月）
- プレスリリース・お知らせ・新機能発表・資金調達・採用動向・YouTube動画
- **ニュースアイテムを個別に収集**（title + URL + date + type + summary）
- **戦略的解釈**：BMCを踏まえ、直近の動きが何を意味するかを分析（`直近の動き` perspective の分析）
- 調査先：公式ブログ・プレスルーム・TechCrunch・YouTube公式チャンネル

### ⑧ 財務シミュレーション（各事業）
- 売上・コスト・利益を推定ベースでシミュレートする
- 公開情報（料金ページ・導入社数・チーム規模・資金調達等）から推計し、事実は「（事実）」、推定は「（推定）」と各行に付記
- **1行要約**（summary）を先に書き、**内訳を箇条書き**（items）で展開する
- 形式: `"項目名: 計算式 = 月間金額（事実/推定）"` で統一

| 項目 | 内容 |
|------|------|
| revenue | 売上の構成要素ごとに単価×件数/社数で試算 |
| cost | 固定費（人件費・マーケ費・インフラ）を規模感から推定 |
| profit | 売上−コスト、利益率、LTV/CAC等の収益効率 |

### ⑨ 自分はどこで勝てそうか（クロス分析。プロジェクト単位で1件）
- ①〜⑧を全事業横断で統合し導出
- 狙えるセグメント・差別化の切り口・避けた方が良い土俵・次の一手

**調査時の注意点：**
- 引用は**原文ママ**で記録すること（日本語の場合も原文を残す）
- 情報のソースURLを必ず記録すること
- 根拠区分は「事実 / 推定 / 仮説」の3段階で記載すること
- 価格は具体的な数値で記録すること（「無料〜$10/月」等）
- ポジション軸の値は数値で記録すること
- 同じ論点が繰り返される場合は追加探索を打ち切る（早期終了）
- `analyses[].conclusion` は簡潔に2〜4文で記載し、冗長な背景説明を避ける

---

## 4. 出力

### A. スプレッドシート連携用 JSON

調査完了後、以下のJSONをコードブロックで出力してください。

```json
{
  "project": {
    "projectId": "YYYYMMDD-slug（例: 20260320-notion）",
    "projectName": "プロジェクト名（例: Notion競合調査）",
    "purpose": "調査目的",
    "category": "カテゴリ/業界",
    "positionAxisX": "X軸の名前（例: 月額料金（USD））",
    "positionAxisY": "Y軸の名前（例: 対象規模スコア（個人=1〜Enterprise=10））"
  },
  "businesses": [
    {
      "businessId": "20260320-notion-target",
      "role": "調査対象",
      "businessName": "Notion",
      "serviceName": "Notion",
      "url": "https://www.notion.so",
      "pricing": "Free / $10/月(Plus) / $15/月(Business) / Enterprise要相談",
      "kpi": "MAU 3000万 / ARR $2.5億（推定）",
      "positionX": 10,
      "positionY": 6,
      "bmc": {
        "valueProposition": "ドキュメント・データベース・タスクを1つのワークスペースに統合。ブロックエディタで自由にカスタマイズ可能。",
        "customerSegments": "スタートアップ・IT企業・個人クリエイター・学生。",
        "channels": "PLG（Product-Led Growth）。無料プランからのアップグレード。口コミ・テンプレートギャラリー。",
        "customerRelationships": "セルフサービス中心。コミュニティ・テンプレートによるセルフオンボーディング。",
        "revenueStreams": "サブスクリプション（Free/Plus/Business/Enterprise）。",
        "keyResources": "ブロックエディタエンジン・AIモデル・グローバルコミュニティ。",
        "keyActivities": "プロダクト開発・AI機能拡充・コミュニティ運営。",
        "keyPartners": "Slack・GitHub・Figma等の連携パートナー。",
        "costStructure": "エンジニアリング人件費・インフラ（GCP）・AI API費用。"
      },
      "financials": {
        "evidenceLevel": "事実 / 推定 / 仮説（必須）",
        "revenue": {
          "summary": "月間売上推定: XXX万円 / 年間ARR推定: XX億円（推定）",
          "items": [
            "収益源A: 月XX件 × 単価XX万円 = XX万円/月（推定）",
            "収益源B: XX社 × XX万円/月 = XX万円/月（推定）"
          ]
        },
        "cost": {
          "summary": "月間コスト推定: XXX万円（推定）",
          "items": [
            "人件費（XX名）: XX万円/月（推定）",
            "マーケティング費: XX万円/月（推定）",
            "インフラ・ツール: XX万円/月（推定）"
          ]
        },
        "profit": {
          "summary": "営業利益率推定: XX%（推定）",
          "items": [
            "月間売上: XX万円",
            "月間コスト: XX万円",
            "月間利益: XX万円（推定）",
            "LTV/CAC比: XX倍（推定）"
          ]
        }
      },
      "company": {
        "companyName": "Notion Labs",
        "companyUrl": "https://www.notion.so",
        "scale": "従業員約500名"
      }
    },
    {
      "businessId": "20260320-notion-comp-0",
      "role": "直接競合",
      "businessName": "Obsidian",
      "serviceName": "Obsidian",
      "url": "https://obsidian.md",
      "pricing": "Free（個人）/ $50/年（Sync）/ $96/年（商用ライセンス）",
      "kpi": "ユーザー数・売上等の公開KPI（不明な場合は省略可）",
      "positionX": 4,
      "positionY": 2,
      "bmc": {
        "valueProposition": "ローカルファイルベースのナレッジグラフ。プライバシー重視・オフライン完結。",
        "customerSegments": "エンジニア・研究者・パワーユーザー・プライバシー重視の個人。",
        "channels": "OSS口コミ・Reddit・個人ブログ。",
        "customerRelationships": "コミュニティ主導。フォーラム・プラグインエコシステム。",
        "revenueStreams": "個人無料。商用ライセンス$50/年。Sync/Publish有料オプション。",
        "keyResources": "ローカルMarkdownエンジン・プラグインAPI・コミュニティ開発者。",
        "keyActivities": "プラグインエコシステム維持・コア開発。",
        "keyPartners": "コミュニティプラグイン開発者（1000+プラグイン）。",
        "costStructure": "小規模チーム。インフラ最小限（ローカル中心）。"
      },
      "company": {
        "companyName": "Dynalist Inc",
        "companyUrl": "",
        "scale": "小規模"
      }
    }
  ],
  "sources": [
    {
      "sourceId": "20260320-notion-target-src-0",
      "businessId": "20260320-notion-target",
      "url": "参考URL",
      "title": "ページタイトル",
      "type": "公式サイト / LP / FAQ / 料金ページ / 比較記事 / レビュー / SNS / 採用ページ / インタビュー / note / Podcast",
      "perspective": "競合 / 顧客 / 価値 / 仕組み / 不満 / 示唆 / 直近の動き",
      "memo": "このソースで確認した内容の要点"
    }
  ],
  "quotes": [
    {
      "quoteId": "20260320-notion-target-q-0",
      "sourceId": "20260320-notion-target-src-0",
      "businessId": "20260320-notion-target",
      "text": "引用テキスト（原文ママ）",
      "sentiment": "ポジティブ / ネガティブ / ニュートラル",
      "perspective": "顧客 / 価値 / 仕組み / 不満 / 示唆",
      "customerProfile": "判明している場合のみ（例: 中小企業の非IT担当）",
      "evidenceLevel": "事実 / 推定 / 仮説"
    },
    {
      "quoteId": "20260320-notion-target-q-analyst-0",
      "sourceId": "20260320-notion-target-src-0",
      "businessId": "20260320-notion-target",
      "text": "外部アナリスト・メディアによる評価コメント（原文ママ）",
      "sentiment": "ポジティブ / ネガティブ / ニュートラル",
      "perspective": "アナリスト",
      "customerProfile": "TechCrunch / Forrester / 個人ブログ名など評価者・媒体名",
      "evidenceLevel": "事実 / 推定"
    }
  ],
  "news": [
    {
      "newsId": "20260320-notion-target-news-0",
      "businessId": "20260320-notion-target",
      "title": "Notion AI gets Q&A feature across entire workspace",
      "url": "https://www.notion.so/blog/notion-ai-qa",
      "date": "2026-02-20",
      "type": "プレスリリース / お知らせ / YouTube / ブログ / その他",
      "summary": "ワークスペース全体を対象にした質問応答AIを正式リリース。既存のAIアドオン加入者に提供開始。"
    }
  ],
  "analyses": [
    {
      "analysisId": "20260320-notion-target-ana-customer",
      "businessId": "20260320-notion-target",
      "perspective": "顧客",
      "conclusion": "結論（2〜4文）",
      "evidence": [
        {
          "quoteId": "20260320-notion-target-q-0",
          "quote": "根拠となる引用テキスト",
          "sourceUrl": "https://...",
          "sourceTitle": "ソースタイトル"
        }
      ],
      "confidence": "高 / 中 / 低",
      "evidenceLevel": "事実 / 推定 / 仮説"
    },
    {
      "analysisId": "20260320-notion-target-ana-value",
      "businessId": "20260320-notion-target",
      "perspective": "価値",
      "conclusion": "結論",
      "evidence": [],
      "confidence": "高",
      "evidenceLevel": "事実"
    },
    {
      "analysisId": "20260320-notion-target-ana-mechanism",
      "businessId": "20260320-notion-target",
      "perspective": "仕組み",
      "conclusion": "結論",
      "evidence": [],
      "confidence": "中",
      "evidenceLevel": "推定"
    },
    {
      "analysisId": "20260320-notion-target-ana-dissatisfaction",
      "businessId": "20260320-notion-target",
      "perspective": "不満",
      "conclusion": "結論",
      "evidence": [],
      "confidence": "高",
      "evidenceLevel": "事実"
    },
    {
      "analysisId": "20260320-notion-target-ana-recent",
      "businessId": "20260320-notion-target",
      "perspective": "直近の動き",
      "conclusion": "BMCを踏まえた直近の動きの戦略的解釈（2〜4文）。どの軸（収益・顧客・チャネル等）に対してどんな動きをしているかを解釈する。",
      "evidence": [],
      "confidence": "中",
      "evidenceLevel": "推定"
    },
    {
      "analysisId": "20260320-notion-comp-0-ana-customer",
      "businessId": "20260320-notion-comp-0",
      "perspective": "顧客",
      "conclusion": "競合Aの顧客セグメント分析",
      "evidence": [],
      "confidence": "中",
      "evidenceLevel": "推定"
    },
    {
      "analysisId": "20260320-notion-cross-insight",
      "businessId": null,
      "perspective": "示唆",
      "conclusion": "全事業を横断した上で自分が狙えそうな余白（2〜4文）",
      "evidence": [
        {
          "quoteId": "20260320-notion-target-q-0",
          "quote": "根拠引用",
          "sourceUrl": "https://...",
          "sourceTitle": "ソース"
        }
      ],
      "confidence": "中",
      "evidenceLevel": "仮説"
    }
  ]
}
```

**値の正規化ルール（スプシの入力規則に合わせる）：**
- `businesses[].role`: `調査対象 / 直接競合 / 間接競合 / 代替サービス / 比較対象`
- `sources[].type`: `公式サイト / レビューサイト / ニュース / ブログ / SNS / その他`
- `quotes[].sentiment`: `ポジティブ / ネガティブ / ニュートラル`
- `quotes[].perspective`: `顧客 / 価値 / 不満 / アナリスト`
- `analyses[].perspective`: `価値 / 仕組み / 顧客 / 不満 / 直近の動き / 示唆`
- `news[].type`: `プレスリリース / ニュース / レビュー / ブログ / SNS / その他`

**補足マッピング（迷いやすい項目）：**
- `businesses[].kpi` → `事業.主要KPI`
- `analyses[].businessId = null` は「プロジェクト横断分析（示唆）」として扱われる
- `sources[].perspective` は補助情報。ダッシュボード表示の主判定は `analyses/quotes` 側で行う

**各事業に必須の分析観点（計5件）：**
- `顧客`：誰に選ばれているか
- `価値`：なぜ選ばれているか
- `仕組み`：どんな仕組みで価値を出しているか
- `不満`：どの点で不満が出ているか
- `直近の動き`：BMCを踏まえた最新3〜6ヶ月の動きの戦略的解釈

**各事業に必須の財務項目（`financials`）：**
- `revenue`：売上の構成要素ごとに単価×件数で試算。1行要約 + 箇条書き内訳
- `cost`：固定費・変動費を規模感から推定。1行要約 + 箇条書き内訳
- `profit`：利益率・月間利益・LTV/CACを試算。1行要約 + 箇条書き内訳
- `evidenceLevel`：`事実 / 推定 / 仮説`（全体の信頼度。各itemにも（事実）/（推定）を付記）

**クロス分析（プロジェクト全体で1件）：**
- `示唆`：全事業を横断した上で自分が狙える余白

**引用の観点（`perspective` フィールド）について：**
- `顧客 / 価値 / 不満`：通常のユーザー口コミ・レビュー
- `アナリスト`：外部アナリスト・メディアによる評価。`customerProfile` に媒体名・評価者名を記載（例: TechCrunch, Forrester）
- `仕組み / 直近の動き / 示唆` は `analyses[].perspective` 側で扱う（引用は `evidence` で紐づける）

**`kpi` フィールドについて：**
- 各事業の `kpi` には、公開されているユーザー数・MAU・ARR・GMVなどの数値KPIを記載
- 公開情報がない場合は省略可（空文字列 `""` でも可）
- 例: `"MAU 3000万 / ARR $2.5億（推定）"`, `"累計導入社数1,200社（公式サイト記載）"`

**Webhook 連携：**
環境変数 `BUSINESS_RESEARCH_WEBHOOK` が設定されている場合は、JSONに `_secret` を追加してPOST送信してください。

```bash
RESEARCH_JSON='<上記JSONをここに貼り付け>'
SIGNED=$(echo "$RESEARCH_JSON" | python3 -c "
import sys, json, os
d = json.load(sys.stdin)
d['_secret'] = os.environ.get('WEBHOOK_SECRET', '')
print(json.dumps(d, ensure_ascii=False))
")
curl -s -X POST "$BUSINESS_RESEARCH_WEBHOOK" \
  -H "Content-Type: application/json" \
  -d "$SIGNED"
```

**送信前チェック（必須）：**
- `project.projectId` が空でない
- `businesses` が1件以上あり、`role=調査対象` が1件ある
- すべての `businessId` がユニーク
- `sources/quotes/analyses/news` の `businessId` が `businesses[].businessId` に存在
- 各事業に `analyses` の `顧客/価値/仕組み/不満/直近の動き` が揃っている
- `analyses` に `businessId=null` の `示唆` が1件ある

**POST後の確認（必須）：**
- 成功レスポンスは `{"status":"success","id":"<projectId>"}` 形式
- `{"error":"project_id_already_exists"}` の場合は `projectId` を変更して再送
- `{"error":"Unauthorized"}` の場合は `WEBHOOK_SECRET` を確認
- 失敗時はJSONを修正して再送し、成功レスポンスを確認して終了する

### B. 最終サマリー

調査結果を人間がすぐ判断できるよう、以下を短く返してください。

- 🏆 **勝ち方の要約**：調査対象が選ばれている本質的な理由
- ⚠️ **弱みの要約**：各社共通の不満・隙・攻めやすい点
- 💡 **自分が狙えそうな余白**：クロス分析から導いた差別化切り口と次の一手
