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

- **調査対象の事業名/サービス名** または **調べたいサービス像の説明**（どちらか必須）

それ以外（公式URL・カテゴリ・調査目的）は原則として質問せず、公開情報から補完します。  
`project.purpose` が必要な場合は、固定で `競争環境の把握と勝ち筋仮説の抽出` を入れてください。

---

## 2. 調査対象の特定と事業IDの決定

### 2-1. 入力が明確な場合（通常）

調査開始前に以下を決定します。

- **projectId**: `YYYYMMDD-{slug}` 例: `20260320-notion`
- **調査対象事業ID**: `{projectId}-target`
- **競合事業ID**: `{projectId}-comp-{0,1,2,...}`
- **ポジション軸**: 業種に合わせた2軸を設定（例: X軸=月額料金USD、Y軸=対象規模スコア1-10）

**ID運用ルール（重要）：**
- `projectId` は一意必須。同じ `projectId` を再送するとWebhookで `project_id_already_exists` エラーになります。
- 再調査時は `projectId` を必ず変更（例: `20260321-notion-v2`）。
- `sourceId / quoteId / analysisId / newsId` も重複禁止。

### 2-2. 入力が曖昧な場合（事業名が不明）

ユーザー入力が「ふわっとしたサービス説明」の場合は、次の順序で処理すること。

1. 入力文から `カテゴリ/用途/対象ユーザー/利用シーン` を抽出して調査テーマを定義する  
2. 調査テーマから連想される実在サービス候補を **5〜8件** 列挙する  
3. 候補の中から、テーマとの一致度が最も高い1社を `role=調査対象` として採用する  
4. 残り候補から比較軸が異なる3社を `role=直接競合/間接競合/代替サービス` として採用する  
5. 通常フロー（3.並列調査以降）を同じ深さで実行する  

**曖昧入力時の命名ルール：**
- `project.projectName` の先頭に `探索:` を付ける（例: `探索: AI議事録サービス競合調査`）
- `project.category` は抽出したカテゴリを明示する
- `businesses[role=調査対象]` は必ず実在サービス名を入れる（仮想サービス名は禁止）

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

### ② ビジネスモデルキャンバス（BMC）+ 詳細データ（`bmcDetails`）
- 9ブロック（価値提案・顧客セグメント・チャネル・顧客との関係・収益の流れ・主要リソース・主要活動・主要パートナー・コスト構造）を調査
- **`bmc` フィールド**：各ブロックを1〜2文の要約で記載（既存）
- **`bmcDetails` フィールド**：各ブロックの詳細データは **`topics` 配列を第一優先** で記載する（クリック時にトピックカード表示）
  - 共通フォーマット: `topics: [{ topic, detail, refs: [{type, id}] }]`
  - `refs[].type` は `sourceId / newsId / quoteId` のいずれか
  - `refs[].id` は対応する `sources/news/quotes` 内の実在ID
  - 旧フォーマット（`points/primary/items...`）も互換表示されるが、新規出力は `topics` を使う
- 調査先：公式サイト・採用ページ・決算資料・プレスリリース
- **必須ルール（重要）**：
  - 9ブロックすべての `summary` を必ず埋める（空文字禁止）
  - 9ブロックすべてで `topics` を最低1件以上入れる
  - 各 `topic` は「1主張」を明確に書く（短く太字で見出し化される前提）
  - `detail` はその主張の補足を1〜2文で書く（任意）
  - `refs` は必須（最低1件）。`sourceId/newsId/quoteId` の実在IDのみ使う
  - `bmcDetails` 本文には URL を直接書かない（URLは `sources[]/news[]` 側に保持）

### ③ 顧客セグメント
- 主な顧客層・周辺顧客層に加えて、**その顧客が抱える課題**を明記する
- `customerSegments.topics` には最低でも以下の論点を含める
  - どんな顧客か（属性）
  - どんな課題を抱えているか（具体）
  - 現在の代替行動（スプレッドシート/紙/他サービス等）
- 調査先：公式サイトの「導入事例」「お客様の声」、採用ページ、LP

### ④ 選ばれる理由（価値）
- 主訴求・顧客課題・刺さるインサイト・提供価値・信頼要素を整理する
- `valueProposition.topics` には最低でも以下の論点を含める
  - 課題（Pain）: 顧客が何に困っているか
  - 既存手段の限界（Why not alternatives）: なぜ他の手段では解決できないか
  - 提供コンセプト（Concept）: どんな思想/設計で解決するか
- 調査先：LP、FAQ、公開インタビュー、note、Podcast

### ⑤ 価値を支える仕組み
- 独自の仕組み・運営体制の仮説・再現しにくい強み・真似しやすい部分
- 調査先：採用ページ、公式ブログ、会社紹介、プレスリリース

### ⑥ レビュー・外部評価（ポジティブ・ネガティブ両方を収集）

**目標：各事業につき最低 ポジティブ4件・ネガティブ4件・アナリスト/外部評価2件（合計10件以上）**

#### ポジティブレビュー（`sentiment: ポジティブ`, `perspective: 価値 or 顧客`）
- 何が刺さっているか・どの機能やサービスが評価されているか・どんなユーザーが熱烈に支持するか
- 調査先（優先順。**日本語情報を最優先**）：
  - 日本語の App Store / Google Play レビュー
  - 日本語のレビューサイト（国内比較記事・口コミサイト）
  - 日本語の X / YouTube / note の体験談
  - 日本語情報が不足する場合のみ、英語圏ソース（G2 / Capterra / Reddit等）を補完利用

#### ネガティブレビュー（`sentiment: ネガティブ`, `perspective: 不満`）
- 頻出する不満・離脱理由・改善要望・どんな条件で不満が出るか
- 調査先（優先順。**日本語情報を最優先**）：
  - 日本語の App Store / Google Play 低評価レビュー
  - 日本語の X / YouTube コメント / 比較記事の不満言及
  - 日本語情報が不足する場合のみ、英語圏ソース（G2 / Capterra / Reddit等）を補完利用

#### 外部評価・アナリスト意見（`sentiment: ポジティブ/ネガティブ/ニュートラル`, `perspective: アナリスト`）
- テック系メディアの評価・有識者コメント・比較記事での位置づけ
- `customerProfile` に媒体名・評価者名を必ず記載（例: TechCrunch, ProductHunt, Forrester）
- 調査先：
  - TechCrunch / The Verge / CNET / Forbes / Wired
  - YouTube（テック系インフルエンサーのレビュー動画内の評価コメント。チャンネル名を `customerProfile` に記載）
  - Twitter/X（業界インフルエンサー・有識者のコメント）
  - ProductHunt（コメント欄）
  - Hacker News（スレッドのトップコメント）
  - Forrester / Gartner（公開コメントがあれば）

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
- **検証ルール（必須）**：
  - 各数値行は `refs`（`sourceId/newsId/quoteId`）で根拠を紐づける
  - 根拠にその数値が存在しない場合は、`assumption` に計算ロジックを必ず記載する
  - 根拠なし・仮定説明なしの数値行は禁止

**財務セルフ検証（必須・送信前に毎回実施）：**
1. 内訳合計チェック  
   - `revenue.items` の金額合計 ≒ `revenue.summary` 記載金額  
   - `cost.items` の金額合計 ≒ `cost.summary` 記載金額
2. 利益整合チェック  
   - `profit.summary` の利益額が `revenue.summary - cost.summary` と整合
3. 単位チェック  
   - 円/月、円/年、%、倍率の単位混在がない
4. 異常値チェック  
   - マイナス売上、極端な利益率（例: >90%）など不自然値を検知
5. 根拠妥当性チェック  
   - `refs` 先に当該数値または前提情報が存在するか確認  
   - 見つからない場合は `assumption` を補強（採用理由・計算式・係数の出所）

**エラー判定時の改善ルール（必須）：**
- エラーを見つけたらそのまま送信しない
- `refs` を追加するか、`assumption` を具体化して再計算する
- 再計算後に上記1〜5を再チェックし、全て通ったら送信する
- 修正履歴は `assumption` に短く残す（例: `有料転換率を5%→3%に修正（相場乖離のため）`）

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
- 情報のソースURLを必ず記録すること（`sourceId` 経由でダッシュボードに元記事リンクが貼られる）
- 根拠区分は「事実 / 推定 / 仮説」の3段階で記載すること
- 価格は具体的な数値で記録すること（「無料〜$10/月」等）
- ポジション軸の値は数値で記録すること
- 同じ論点が繰り返される場合は追加探索を打ち切る（早期終了）
- `analyses[].conclusion` は簡潔に2〜4文で記載し、冗長な背景説明を避ける
- **引用収集の最低ライン（各事業）：**
  - ポジティブレビュー（`perspective: 価値 or 顧客`）：**4件以上**
  - ネガティブレビュー（`perspective: 不満`）：**4件以上**
  - 外部評価・アナリスト（`perspective: アナリスト`）：**2件以上**
  - 合計：**各事業10件以上** を目標とする
- 引用は多様なプラットフォームから集める（同一プラットフォームの引用が偏らないよう注意）
- 引用の `customerProfile` には発言者の属性（企業規模・役職・業種等）を可能な範囲で記載する

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
          "refs": [{"type":"sourceId","id":"20260320-notion-target-src-6"}],
          "assumption": "公開価格は確認できるが契約社数は非公開のため、公開導入事例数を下限として推計。",
          "items": [
            {
              "main": "収益源A: 月XX件 × 単価XX万円 = XX万円/月（推定）",
              "refs": [{"type":"sourceId","id":"20260320-notion-target-src-6"}],
              "assumption": "成約件数は導入実績から逆算"
            },
            {
              "main": "収益源B: XX社 × XX万円/月 = XX万円/月（推定）",
              "refs": [{"type":"newsId","id":"20260320-notion-target-news-0"}],
              "assumption": "有料転換率は同カテゴリの一般値を採用"
            }
          ]
        },
        "cost": {
          "summary": "月間コスト推定: XXX万円（推定）",
          "refs": [{"type":"sourceId","id":"20260320-notion-target-src-2"}],
          "assumption": "従業員規模は公開情報、平均年収は業界統計を利用。",
          "items": [
            {
              "main": "人件費（XX名）: XX万円/月（推定）",
              "refs": [{"type":"sourceId","id":"20260320-notion-target-src-2"}],
              "assumption": "人員構成をエンジニア比率6割で仮定"
            },
            {
              "main": "マーケティング費: XX万円/月（推定）",
              "assumption": "SaaSの売上比率20%を仮置き"
            },
            {
              "main": "インフラ・ツール: XX万円/月（推定）",
              "assumption": "MAU規模に対する単価モデルで試算"
            }
          ]
        },
        "profit": {
          "summary": "営業利益率推定: XX%（推定）",
          "assumption": "上記 revenue/cost 推計値の差分で算出。",
          "items": [
            {
              "main": "月間売上: XX万円",
              "refs": [{"type":"sourceId","id":"20260320-notion-target-src-6"}]
            },
            {
              "main": "月間コスト: XX万円",
              "refs": [{"type":"sourceId","id":"20260320-notion-target-src-2"}]
            },
            {
              "main": "月間利益: XX万円（推定）",
              "assumption": "売上 - コストで算出"
            },
            {
              "main": "LTV/CAC比: XX倍（推定）",
              "assumption": "継続率はカテゴリ平均値を採用"
            }
          ]
        }
      },
      "achievements": {
        "summary": "導入実績・認定・受賞などの1行要約（例: 導入100社・Notion認定4社の1社）",
        "items": [
          "導入社数: XX社（事実）",
          "資金調達: シリーズX XXX万円（事実）",
          "認定・受賞: XX認定 / XX賞（事実）",
          "メディア掲載: TechCrunch掲載（事実）"
        ]
      },
      "bmcDetails": {
        "valueProposition": {
          "summary": "価値提案の1行要約",
          "topics": [
            {
              "topic": "導入初期の立ち上がりが速い",
              "detail": "テンプレート活用で初期設計を短時間で完了しやすい。",
              "refs": [{"type": "sourceId", "id": "20260320-notion-target-src-0"}]
            }
          ]
        },
        "customerSegments": {
          "summary": "顧客層の1行要約",
          "topics": [
            {
              "topic": "主要顧客はIT系の中小チーム",
              "detail": "導入障壁が低く、自己解決型で運用しやすい層に強い。",
              "refs": [{"type": "sourceId", "id": "20260320-notion-target-src-1"}]
            }
          ]
        },
        "channels": {
          "summary": "チャネルの1行要約",
          "topics": [
            {
              "topic": "PLGとテンプレート流入が主導線",
              "detail": "検索流入とコミュニティ共有で自然増を作っている。",
              "refs": [{"type": "sourceId", "id": "20260320-notion-target-src-4"}]
            }
          ]
        },
        "customerRelationships": {
          "summary": "顧客関係の1行要約",
          "topics": [
            {
              "topic": "コミュニティ主導の継続利用",
              "detail": "利用ノウハウがユーザー間で循環し、定着率に寄与する。",
              "refs": [{"type": "quoteId", "id": "20260320-notion-target-q-0"}]
            }
          ]
        },
        "revenueStreams": {
          "summary": "収益モデルの1行要約",
          "topics": [
            {
              "topic": "サブスクリプション課金が中心",
              "detail": "FreeからBusiness/EnterpriseへのアップセルでLTVを伸ばす。",
              "refs": [{"type": "sourceId", "id": "20260320-notion-target-src-6"}]
            }
          ]
        },
        "keyResources": {
          "summary": "主要リソースの1行要約",
          "topics": [
            {
              "topic": "テンプレート資産と連携エコシステム",
              "detail": "ユーザー資産が参入障壁として機能する。",
              "refs": [{"type": "sourceId", "id": "20260320-notion-target-src-2"}]
            }
          ]
        },
        "keyActivities": {
          "summary": "主要活動の1行要約",
          "topics": [
            {
              "topic": "機能拡張とUX改善の継続",
              "detail": "新機能リリースと運用改善を高頻度で実施。",
              "refs": [{"type": "newsId", "id": "20260320-notion-target-news-0"}]
            }
          ]
        },
        "keyPartners": {
          "summary": "主要パートナーの1行要約",
          "topics": [
            {
              "topic": "外部連携パートナーが拡張性を支える",
              "detail": "他SaaSとの接続性が選定理由の一部になっている。",
              "refs": [{"type": "sourceId", "id": "20260320-notion-target-src-3"}]
            }
          ]
        },
        "costStructure": {
          "summary": "コスト構造の1行要約",
          "topics": [
            {
              "topic": "インフラと開発人件費が主コスト",
              "detail": "利用増に応じてインフラ費が増加しやすい。",
              "refs": [{"type": "sourceId", "id": "20260320-notion-target-src-7"}]
            }
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
- 各数値行は `refs` か `assumption` のどちらかを必ず付与する
- `assumption` を使う場合は、採用した仮定と算出ロジックを1文で明記する
- `revenue/cost/profit` の要約値と内訳値の算術整合が取れていること（セルフ検証済み）

**各事業に必須の実績データ（`achievements`）：**
- `summary`：導入社数・資金調達・認定・受賞等の1行要約
- `items`：数値を伴う実績を箇条書き（「事実」「推定」を各行末に明記）

**BMC詳細データ（`bmcDetails`）：**
- BMCの各ブロックは `topics` 配列で出力する（クリック時にトピックカード表示）
- 各トピックは `{ topic, detail, refs }` を使う
- `refs` は `[{ type: "sourceId|newsId|quoteId", id: "<実在ID>" }]` 形式
- 強み・弱みの根拠となる顧客レビューは `quotes[]` に記録し、`perspective: "顧客"/"不満"` で分類する

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
環境変数 `BUSINESS_RESEARCH_WEBHOOK` が空なら送信を中止してください。  
POST時は JSON に `_secret` を追加し、レスポンスの `status` と `id` を必ず検証してください。

```bash
RESEARCH_JSON='<上記JSONをここに貼り付け>'
if [ -z "${BUSINESS_RESEARCH_WEBHOOK:-}" ]; then
  echo "ERROR: BUSINESS_RESEARCH_WEBHOOK is empty"
  exit 1
fi
SIGNED=$(echo "$RESEARCH_JSON" | python3 -c "
import sys, json, os
d = json.load(sys.stdin)
d['_secret'] = os.environ.get('WEBHOOK_SECRET', '')
print(json.dumps(d, ensure_ascii=False))
")
RESP=$(curl -s -X POST "$BUSINESS_RESEARCH_WEBHOOK" \
  -H "Content-Type: application/json" \
  -d "$SIGNED")
echo "$RESP"
STATUS=$(echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status',''))")
PID=$(echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',''))")
if [ "$STATUS" != "success" ] || [ -z "$PID" ]; then
  echo "ERROR: webhook response invalid (status=$STATUS, id=$PID)"
  exit 1
fi
```

**送信前チェック（必須）：**
- `project.projectId` が空でない
- `businesses` が1件以上あり、`role=調査対象` が1件ある
- すべての `businessId` がユニーク
- `sources/quotes/analyses/news` の `businessId` が `businesses[].businessId` に存在
- 各事業に `analyses` の `顧客/価値/仕組み/不満/直近の動き` が揃っている
- `analyses` に `businessId=null` の `示唆` が1件ある
- 各 `businesses[]` に `bmcDetails` が存在し、9ブロック（`valueProposition/customerSegments/channels/customerRelationships/revenueStreams/keyResources/keyActivities/keyPartners/costStructure`）が埋まっている
- 各ブロックに `topics` が1件以上ある
- 各 `topics[]` に `topic` がある
- 各 `topics[]` の `refs` が1件以上あり、参照IDが `sources/news/quotes` の実在IDと一致している
- `customerSegments.topics` に「顧客属性」と「顧客課題」の両方が含まれる
- `valueProposition.topics` に「課題」「既存手段の限界」「提供コンセプト」の3論点が含まれる
- 各 `businesses[].financials` の数値行は、`refs` または `assumption` のどちらかが必ず埋まっている
- `assumption` を使った数値行は、算出ロジックが1文で説明されている
- `revenue/cost` の内訳合計と summary が整合している
- `profit` が `revenue - cost` と整合している
- 単位（円/月・円/年・%・倍率）が混在せず、解釈可能である
- **各事業の `quotes[]` について：**
  - `sentiment: ポジティブ` の引用が **4件以上** あること
  - `sentiment: ネガティブ` の引用が **4件以上** あること
  - `perspective: アナリスト` の引用が **2件以上** あること
  - 不足している場合は追加調査してから送信すること

**POST後の確認（必須）：**
- 成功レスポンスは `{"status":"success","id":"<projectId>"}` 形式
- `status=success` でも `id` が空なら失敗扱いにして再送する
- `{"error":"project_id_already_exists"}` の場合は `projectId` を変更して再送
- `{"error":"Unauthorized"}` の場合は `WEBHOOK_SECRET` を確認
- 失敗時はJSONを修正して再送し、成功レスポンスを確認して終了する

**成功時のダッシュボード表示（必須）：**
- 環境変数 `BUSINESS_RESEARCH_DASHBOARD_BASE_URL`（WebアプリURL）を設定しておく
  - 例: `https://script.google.com/macros/s/AKfy.../exec`
- `BUSINESS_RESEARCH_DASHBOARD_BASE_URL` が空なら `BUSINESS_RESEARCH_WEBHOOK` を代用する
- POST成功時はレスポンスの `id` を使って、`<baseUrl>?projectId=<id>` を生成して案内する
- 調査完了フローでは、URL生成だけで終わらせず必ず自動で開く

```bash
BASE_URL="${BUSINESS_RESEARCH_DASHBOARD_BASE_URL:-$BUSINESS_RESEARCH_WEBHOOK}"
if [ -z "$BASE_URL" ]; then
  echo "ERROR: dashboard base url is empty"
  exit 1
fi

DASH_URL="${BASE_URL}?projectId=${PID}"
echo "Dashboard: $DASH_URL"
if command -v open >/dev/null 2>&1; then
  open "$DASH_URL" || true
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$DASH_URL" || true
fi
```

### B. 最終サマリー

調査結果を人間がすぐ判断できるよう、以下を短く返してください。

- 🏆 **勝ち方の要約**：調査対象が選ばれている本質的な理由
- ⚠️ **弱みの要約**：各社共通の不満・隙・攻めやすい点
- 💡 **自分が狙えそうな余白**：クロス分析から導いた差別化切り口と次の一手
