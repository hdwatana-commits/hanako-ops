# ファッションハナコOPS Phase 1 実装計画

## 1. 使用技術
- 静的PWA: `index.html`, `styles.css`, `app.js`, `sw.js`
- データ保存: `localStorage` の `hanako-room-ops`
- 任意クラウド同期: Supabase Auth + `public.hanako_app_data.payload` JSONB
- 画像保存: Supabase Storage `hanako-private-photos`
- 商品取得: Supabase Edge Function `rakuten-product-import`

## 2. ディレクトリ構成
- `app.js`: 既存アプリ本体、画面描画、投稿文生成、ROOM/コーデ/SNS連携
- `room-review-generator.js`: ROOMレビュー文生成エンジン
- `cloud-sync.js`: Supabase同期
- `supabase/`: Edge Functions
- `supabase-setup.sql`: 現行のJSONB同期テーブル
- `icons/`, `covers/`: PWA・アプリ画像

## 3. 現在の関連機能
- 商品登録: URL取得、楽天検索、手入力
- 投稿: SNS投稿文、ROOMレビュー文、コーデ文、AI画像プロンプト
- 投稿予定: 簡易カレンダー
- 成果: views/saves/replies/clicks/sales の手入力
- 同期: アプリ全体のJSON payload同期

## 4. 既存DBスキーマ
現状は `hanako_app_data(user_id, payload, updated_at)` の一括JSON保存が中心です。Phase 1ではローカルMVPを動かしつつ、将来の分析・バッチに備えて正規化テーブルSQLを追加します。

## 5. 再利用できるもの
- `state.products`
- `state.roomQueue`
- `state.calendar`
- `state.metrics`
- `renderProducts`, `renderRoomQueue`, `renderCalendar`, `renderMetrics`
- `fetchRakutenProduct`, `fetchRakutenProductSearch`
- `RoomReviewGenerator`

## 6. 変更が必要なファイル
- `index.html`: 今日のおすすめ、パイプライン導線、`ops-engine.js` 読み込み
- `app.js`: DailySelection生成、一括採用/除外、手動修正履歴
- `styles.css`: Sランクカード、KPI、パイプラインUI
- `ops-engine.js`: 重複判定、canonical ID、スコア、分類
- `supabase-ops-phase1.sql`: 正規化テーブル
- `tests/ops-engine-tests.html`: ブラウザで動く最低限テスト
- `README.md`: セットアップと運用手順

## 7. 追加予定のテーブル
Product, ProductVariant, ProductFamily, ProductSnapshot, ProductScore, ProductTag, Post, PostPlan, PostAsset, Collection, CollectionRule, CollectionMembership, DuplicateMatch, SalesResult, DailySelection, SelectionReason, ExclusionRule, BrandPerformance, CategoryPerformance, PriceRangePerformance, UserDecision, JobRun, ErrorLog。

## 8. 実装リスク
- 楽天ROOMの成果は自動取得できないため、CSV/手入力が必要。
- 現行アプリはJSONB一括同期なので、正規化テーブルと二重運用になる期間がある。
- 商品画像類似度はPhase 3扱い。Phase 1では画像URL/商品名/色/コードで判定。
- API失敗時は前回データ・手動登録商品で動かす。存在しない実績値は推測保存しない。
- スコアは初期ルールベース。根拠を保存し、後から重み変更できる形にする。

## 9. Phase 1 作業計画
1. `ops-engine.js` を追加し、商品正規化、canonicalProductId、重複判定、再投稿可能日、スコアリング、コレクション提案を実装。
2. `state.dailySelections`, `state.postPlans`, `state.collections`, `state.userDecisions` を追加。
3. 商品登録時にOpsメタ情報を付与。
4. 「今日のおすすめ」画面を商品画面上部へ追加。初期表示はSランク最大30件。
5. 一括採用・一括除外・画像生成キュー・ROOM文生成キュー送信を追加。
6. 投稿パイプラインの簡易ステータスを追加。
7. Supabase正規化マイグレーション、サンプルデータ、ブラウザテストを追加。

## 仮定
- 自動収集は既存の楽天検索/URL登録と手動登録商品を候補ソースにする。正式APIの定期実行はEdge Function/cron化をPhase 2以降に拡張する。
- Phase 1の「毎朝200商品」は、取得済み候補が200未満の場合は存在する候補だけでDailySelectionを作る。空の候補を捏造しない。
- 成果報酬、売上金額、購入日はCSVまたは手入力で保存する。推測値は保存しない。
