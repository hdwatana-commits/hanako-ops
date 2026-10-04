# Threads返信管理の追加

HanakoOPS v327として公開済みです。Supabaseに返信用テーブル・RPC・Edge Function・1分ごとのCronを反映しました。初期状態は停止・下書きモードです。現在のプロジェクトにはThreadsユーザートークンとユーザーIDが未登録のため、実際の取得・返信にはThreads APIの接続が必要です。

## 変更ファイル

既存の `index.html` はCSSとモジュールの読み込みだけを追加。`sw.js` はキャッシュ名を更新し新しいファイルをキャッシュ対象に追加。既存の `app.js` は変更していません。

新規: `threads-replies.js`、`threads-replies.css`、`reply-rules.mjs`、`supabase-threads-replies.sql`、`supabase/functions/threads-replies/index.ts`、同フォルダーの `prompt.ts`、`tests/reply-rules.test.mjs`。

この作業フォルダーは公開リポジトリの必要ファイルだけを取得したものです。完全なGitクローンではありません。上記の変更ファイルだけを、最新版の本体リポジトリに適用してください。`.baseline` は比較用で公開不要です。配布ZIPは変更対象のみを含みます。

## 導入

1. Supabase SQL Editorで `supabase-threads-replies.sql` のテーブル・関数部分を実行します。末尾のCron例は初期状態ではコメントアウトされています。
2. 既存のSecrets `SUPABASE_URL`、`SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`、`HANAKO_OWNER_USER_ID`、`THREADS_ACCESS_TOKEN`、`THREADS_USER_ID`、`OPENAI_API_KEY` を確認します。Cronには専用の `HANAKO_REPLY_CRON_SECRET` があれば使用し、なければ既存の `HANAKO_CRON_SECRET` を使用します。モデル変更は `OPENAI_REPLY_MODEL` で設定可能です。
3. `threads-replies` Edge Functionをデプロイします。ローカルのSupabase CLIで `supabase functions deploy threads-replies`。親ディレクトリーの `reply-rules.mjs` を含めてバンドルします。JWT検証はONを維持してください。ブラウザーでは本人ログインのJWT、Cronでは既存の仕組みと同じレガシーanon JWT＋専用Cron秘密値を使います。
4. Threadsユーザートークンには `threads_basic`、`threads_content_publish`、`threads_read_replies`、`threads_manage_replies` が必要です。`THREADS_USER_ID` と認証ユーザーのIDが一致しない場合は投稿しません。トークン更新はこの機能では自動化していません。
5. 新規の画面ファイルと変更済み `index.html`、`sw.js` をGitHub Pagesへ反映します。既存のファイルと画像は維持してください。
6. OPSで本人としてログインし「Threads返信」→「読み込む」。曜日、時間、待ち時間、テンション、追加指示を設定し、まず下書きモードで有効にして保存します。「今すぐ確認」でAPIと文章の動作を確認します。
7. 今回のプロジェクトでは `supabase-threads-replies-cron.sql` を適用済みです。既存のVault設定をサーバー内で参照し、1分ごとに起動します。有効な返信設定がある場合だけAPIを呼び、1回につきコメント1ページを収集、返信を最大1件処理します。既存の `hanako-daily` のCronは変更していません。

## 動作

- 保存は所有者のみ。APIキーやThreadsトークンをGitHub Pagesやブラウザーへ渡しません。
- 日本時間の曜日・稼働時間に従い、コメント投稿時刻＋待ち時間以降に返信します。時間外もコメント収集は行い、返信は次の稼働時間まで待機します。
- 初回の設定作成時刻以降のコメントが返信対象。以前のものは履歴とランキングのために収集します。停止中に届いたコメントも、再開後は返信対象に残ります。
- 同じコメントIDは重複登録しません。実行の排他ロックと投稿直前の記録により二重投稿を抑えます。結果不明のものは自動再送しません。生成中にOFFに変更した場合は下書きで止まります。すでにThreadsへ送信済みの要求は取り消せません。
- 元の投稿、親コメント、同じユーザーの直近20件をAIへ渡します。外国語やテンションの調整はAIへの指示であり、完全な遵守を保証するものではありません。
- 履歴とファンランクはAPIから取得できたコメントを対象にします。非表示・削除・未承認コメント等で完全な履歴にならないことがあります。収集はページごとに進むため、大きいアカウントでは反映に時間がかかります。
- 現状の人物キーはThreadsのユーザー名です。ユーザー名の変更前後は別の履歴となる可能性があり、APIで安定した投稿者IDが使える場合に統合方式を拡張できます。好みや履歴から健康・性的嗜好などの敏感な属性を別途推測・保存する機能は設けていません。
- ランクはコメント数＋日本時間での交流日数×3。15点でシルバー、40点でゴールド、100点でプラチナ。同点は同順位です。実際のフォロー有無を表す指標ではありません。
- 下書きモードで作成済みの返信は、自動モードへ切り替えても一斉に自動投稿しません。「この下書きを投稿」で個別投稿します。結果不明はThreads側を確認してください。
- 生成失敗は「再生成の待機に戻す」で再処理できます。異常終了で生成中のままの場合も、5分の排他ロック期限後に同じ操作で戻せます。投稿中のまま残ったものは自動再送しません。

## 検証

`node --experimental-strip-types --test tests/reply-rules.test.mjs tests/reply-api.test.mjs`。7件合格。SQL適用とEdge Functionのデプロイ、Cron登録を確認しました。Threadsコメント取得・AIの実生成・実投稿は、Threads認証設定を完了してから検証する必要があります。

ブラウザーのSupabaseエディターへは `node build-reply-dashboard.mjs` で生成する `threads-replies-dashboard.ts` を1ファイルとしてデプロイできます。元のモジュール版と同じ処理です。
