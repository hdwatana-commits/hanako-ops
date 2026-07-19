# ファッションハナコOPS Phase 2 実装計画

## 1. Phase 1の完了状況

Phase 1は静的PWAのローカルサービス層として実装済みです。`ops-engine.js` が商品正規化、canonicalProductId生成、重複・色違い判定、再投稿可能日、売れやすさスコア、運用優先度、推奨コレクション、DailySelection生成を担当しています。`app.js` には今朝のおすすめ、Sランク表示、一括採用・除外、投稿パイプライン、手動判断履歴が統合されています。

Supabase向けには `supabase-ops-phase1.sql` が用意されていますが、実アプリの主動作は localStorage と同期JSONです。

## 2. 未実装または暫定実装の箇所

- バックエンドAPIサーバーは未実装です。Phase 2では静的PWA内のローカルAPI相当として実装します。
- 売上実績は手入力メモ中心でした。Phase 2でCSV取込を追加しました。
- コレクションルールは固定ルール中心でした。Phase 2で画面編集とプレビューを追加しました。
- 投稿企画の類似判定、判断待ち受信箱、実績補正はPhase 2で新規追加です。

## 3. 既存DBスキーマ

既存SQLは `supabase-setup.sql`、`supabase-photo-storage.sql`、`supabase-ops-phase1.sql` です。Phase 1では商品、投稿、コレクション、DailySelection、UserDecisionなどの基本テーブルが想定されています。

## 4. 既存API

サーバーAPIではなく、ブラウザ内関数がAPI相当です。

- `HanakoOpsEngine.buildDailySelection`
- `HanakoOpsEngine.enrichProduct`
- `HanakoOpsEngine.recommendCollections`
- `runDailySelection`
- `sendProductToPipeline`
- `sendProductToRoomQueue`

## 5. 既存画面

- ホーム
- 商品を探す・登録
- 今朝のおすすめ
- 投稿パイプライン
- SNS投稿メーカー
- コーデ作成
- ROOM投稿
- カレンダー
- 成果メモ
- 同期

## 6. 再利用可能なコンポーネント

- `panel`、`panel-heading`
- `status-pill`
- `daily-card`
- `pipeline-board`
- `metricForm` と成果メモ
- `saveUserDecision`
- `buildOpsPostHistory`
- `copyText`
- `saveState` / `cloud-sync.js`

## 7. Phase 2で追加したテーブル

`supabase-ops-phase2.sql` に以下を追加しました。

- CollectionRuleVersion
- CollectionMembership
- CollectionBalanceSnapshot
- PostSimilarity
- DecisionInboxItem
- CsvImport
- CsvColumnMapping
- CsvImportRow
- SalesAttribution
- PerformanceAggregate
- ScoreAdjustment
- WeeklyInsight
- RuleConflict
- AutomationDecision
- JobRun
- ErrorLog

## 8. 既存データへのマイグレーション方針

既存の `collections` は `HanakoPhase2Engine.defaultCollectionRules()` でPhase 2形式へ正規化します。既存商品・投稿・ROOMキューはそのまま使い、Phase 2ジョブの再実行で分類、偏り、類似、受信箱、成果集計を再生成します。削除ではなく状態変更を残す方針です。

## 9. 売上CSVの想定形式

列順は固定しません。以下の列を自動マッピングします。

- 発生日、確定日、注文日
- 商品名、商品URL、商品コード
- ショップ名、ショップコード
- 売上金額、件数、成果報酬
- ステータス、料率、デバイス
- 注文ID、管理用ID

UTF-8、UTF-8 BOM、Shift_JIS、CP932相当のCSVを想定します。ブラウザでは `TextDecoder("shift_jis")` を使います。

## 10. 実装リスク

- 楽天アフィリエイトCSVの列名が変わる可能性があります。そのため列マッピング保存を入れています。
- 投稿と売上の紐付けは誤帰属リスクがあります。90未満は仮または判断待ちにしています。
- サンプル数が少ない成果補正は過学習になります。20件未満は補正なしにしています。
- 静的PWAのため大量CSVはブラウザメモリに依存します。必要になればPhase 3以降でEdge Function化します。

## 11. Phase 2の作業順序

1. DBマイグレーション追加
2. Phase 2ローカルエンジン追加
3. コレクションルール管理とプレビュー
4. 自動分類・偏り分析
5. 判断待ち受信箱
6. 投稿企画類似判定
7. CSV取込と売上紐付け
8. 成果分析とスコア補正
9. 週間改善レポート
10. テストと運用手順

## 実装済みのPhase 2成果物

- `ops-phase2-engine.js`
- `supabase-ops-phase2.sql`
- 商品画面の判断待ち受信箱
- 商品画面のコレクションルール管理
- 成果画面のCSV取込
- 成果分析・実績補正
- 週間改善レポート
- `tests/ops-phase2-tests.html`
- `sample-data/sales-results-sample.csv`

## 既知の制約

現在は静的PWA内でのローカルジョブです。公式APIによる毎朝自動収集、サーバー側スケジューラー、大規模CSVのバックグラウンド処理はPhase 3以降でEdge Function化する前提です。
