# Business Research — 事業調査エージェント

「この事業調査しておいて」と言うだけで、AIが競合・顧客・強み・弱み・勝ち筋を**6観点で並列調査**し、GoogleスプレッドシートとWebダッシュボードに蓄積するエージェント型 skill です。

---

## このskillが答える問い

この事業は…
- **誰に** 選ばれているのか
- **なぜ** 選ばれているのか
- **どんな仕組みで** その価値を実現しているのか
- **どこに** 不満や隙があるのか
- **自分はどこで** 勝てそうか

---

## デモ動画

<!-- TODO: デモ動画 URL をここに貼る -->

---

## インストール

```bash
# Claude Code で実行
/plugin marketplace add kaishushito/agi-lab-skills-marketplace
/plugin install business-research@agi-lab-skills
```

---

## 使い方

```
NotionについてURLはhttps://notion.so、目的は「差別化ポイントを知りたい」で事業調査して
```

それだけで Claude が以下を自動で行います：

1. 公式サイト・LP・導入事例・レビュー・比較記事などを並列に調査
2. 6観点（競合・顧客・価値・仕組み・不満・勝ち筋）で整理
3. 構造化 JSON をスプレッドシートの Webhook に POST
4. ターミナルに最終サマリー（勝ち方・弱み・狙い目）を出力

---

## ダッシュボードのセットアップ

### 1. スプレッドシートを作成する

1. [Google スプレッドシート](https://sheets.new) で新規シートを作成
2. 「拡張機能」>「Apps Script」を開く

### 2. GAS コードを貼り付ける

1. `コード.gs` に [`scripts/setup_dashboard.gs`](plugins/business-research/scripts/setup_dashboard.gs) の内容を貼り付ける
2. 「ファイル」>「新しいファイル」>「HTML」で **`dashboard`** という名前のファイルを作成
3. [`scripts/dashboard.html`](plugins/business-research/scripts/dashboard.html) の内容を貼り付ける
4. 保存する

### 3. 初期セットアップを実行する

スプレッドシートに戻ると **「ビジネスリサーチ」** メニューが表示されます。

「📥 初期セットアップ（シート作成）」を実行すると、以下の4シートが自動作成されます：

| シート名 | 役割 |
|---|---|
| 調査管理 | 1行＝1回の調査（親レコード） |
| 企業分析 | 1行＝1企業の分析結果（競合含む） |
| ソース一覧 | 1行＝1参考URL（根拠追跡用） |
| ダッシュボード表示用 | ダッシュボード向け整形済みビュー |

### 4. Webhook URL を発行する

1. 「デプロイ」>「新しいデプロイ」>「ウェブアプリ」
2. 実行するユーザー：**自分**
3. アクセスできるユーザー：**全員**（または組織内）
4. デプロイして URL をコピーする

### 5. 環境変数に Webhook URL を設定する

```bash
claude config set env.BUSINESS_RESEARCH_WEBHOOK "https://script.google.com/macros/s/XXXX/exec"
```

これで調査結果が自動的にスプレッドシートに保存されます。

### 6. ダッシュボードを開く

デプロイ URL にブラウザでアクセスするとダッシュボードが表示されます。

---

## ダッシュボードのセクション構成

| セクション | 内容 |
|---|---|
| ① 事業サマリー | サービス名・カテゴリ・調査目的・勝ち方の要約 |
| ② 競合整理 | 直接競合・間接競合・代替手段・比較されやすい相手 |
| ③ 顧客と刺さる理由 | 顧客層・主訴求・悩み仮説・インサイト |
| ④ 勝ち方の構造 | 独自の仕組み・体制仮説・再現しにくい強み |
| ⑤ 不満と余白 | 頻出不満・不満の背景・対象層 |
| ⑥ 自分の勝ち筋 | 狙える切り口・避けるべき土俵・次の一手 |
| ⑦ ソース一覧 | 参考URL・根拠区分（事実/推定/仮説）・抜粋メモ |

---

## 調査品質の方針

- **事実と推定（仮説）を区別**して出力する
- **根拠 URL を必ず記録**する
- **不明なものは不明**と記載し、無理に断定しない
- ただの要約ではなく、**意思決定に使える示唆**を出す

---

## Repository Structure

```
.claude-plugin/
└── marketplace.json

plugins/
├── business-research/
│   ├── .claude-plugin/
│   │   └── plugin.json
│   ├── skills/
│   │   └── business-research/
│   │       └── SKILL.md
│   └── scripts/
│       ├── setup_dashboard.gs   ← Google Apps Script
│       └── dashboard.html       ← ダッシュボード UI
└── hackathon-starter/
    ├── .claude-plugin/
    │   └── plugin.json
    └── skills/
        └── starter-guide/
            └── SKILL.md
```

---

## License

MIT
