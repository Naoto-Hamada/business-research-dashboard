# Start Here（最初に読む1ページ）

このプロジェクトは、事業調査の結果を自動でスプレッドシートとダッシュボードに保存する仕組みです。

## 3ステップで開始

1. 前提ツールを確認する
- `clasp`, `jq`, `curl` が使える状態にする

2. セットアップを実行する
- ルートで次を実行:

```bash
bash plugins/business-research/scripts/setup_business_research.sh
```

このコマンドで以下が自動実行されます。
- スプレッドシート作成
- GAS 反映
- Webアプリ公開
- Webhook secret の登録
- Claude 環境変数設定

3. 調査を実行する
- Claude Code で次を実行:

```text
/business-research
```

続けて調査したいサービス名を入力します。

## 迷ったとき

- データ構造の詳細: `docs/spreadsheet_data_model.md`
- 再デプロイだけしたい: `plugins/business-research/scripts/deploy_business_research_gas.sh`
- プラグイン情報の調整: `plugins/business-research/scripts/personalize_plugin.sh`

## 注意

- `WEBHOOK_SECRET` は機密情報です。公開チャネルに貼らないでください。
- URL共有時は、機密値が含まれていないか確認してください。
