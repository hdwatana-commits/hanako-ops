# Instagram公式音楽連携（2026-10-18、v365）

## 一次資料で確認できたこと
2026-10-18にMeta公式のAudio APIページをHTTP 200で直接取得し確認。ページの更新日は2026-06-16。前の実装メモで「取得不可・条件確認中」としていた判断を更新する。
https://developers.facebook.com/docs/instagram-platform/content-publishing/audio-api/

- Instagram Business/Creatorが対象。Facebookページとのリンク、Facebook Login、有効なユーザーアクセストークン、instagram_basic / instagram_content_publish権限が必要。Instagram Login方式は対象外。
- GET /ig_audio のaudio_type（music / original_sound）、user_id、search_queryで検索。検索語が空なら人気音源。
- GET /{audio_id} で最新メタデータを取得。download_urlは試聴用の一時URL（約1.5日）で、存在しない場合もある。on_platform_audio_preview_linkがあればInstagram上で試聴できる。
- 第三者利用が許可された音源が対象。Instagramアプリの全楽曲と一致するとは限らない。
- リールコンテナ作成時にaudio_configuration.audio_idで音源を付与できる。音源付き完成リールの事前プレビューは非対応。
- 公式文書で使用可能な開始位置・波形パラメーターは確認できないため、推測したパラメーターを送信しない。音源付き動画のダウンロード権や任意MP4への音源埋め込み権も与えられたと扱わない。
- is_ads_eligibleを表示するが、商用・広告利用の一般的な許諾を保証するものではない。今回広告用のproduct=ADSやads_managementは使わない。
- 本番利用では対象権限のアプリ審査・アクセスレベル、Facebookページとの連携、トークン期限をMeta Dashboardで確認する。既存接続の権限不足やトークン失効時にはUIで具体的に案内する。既存のInstagram接続を再利用し、新しいOAuth画面・アプリは追加しない。

## 実装
- 既存リール画面で音楽の選択方法を「Instagram公式音楽を検索・選択」に切替。
- 曲名/アーティスト検索、人気音源、オリジナル音源、試聴、選択、お気に入り。お気に入りは端末・OPSユーザーごとのlocalStorageにID/曲名のみ保存。一時URLは保存せず再取得。
- このモードの保存MP4は無音。音源はInstagramで公開するときに付与。自動ビート解析は利用権のある音声アップロード方式だけ。公式音楽は仮リズム/手動BPMで制作し正確な同期を保証しない。
- 完成時点の動画と選択音源を固定して投稿準備。動画を非公開Storageへ署名付きURLでアップロードし、Instagramへ1時間の署名付きURLを渡す。まだ公開しない。
- 動画処理の状態確認は別の短いAPI呼び出し。公開許可チェックと「確認してInstagramへ公開」ボタンが必要。実装作業中の実アカウントへのテスト投稿は行っていない。
- 新しいinstagram-audio Edge Functionに分離。既存social-publishは変更なし。サーバーでAuth /auth/v1/userを検証し、HANAKO_OWNER_USER_IDとの一致を全操作で強制。Meta/Supabase秘密キーはブラウザに返さない。
- Metaのホスト・エンドポイントは固定。試聴/画像URLはHTTPSの既知Meta CDN、Instagramリンクに制限。APIエラーからトークンを除去。任意のURLをサーバーが取得する処理なし。
- hanako-private-reels専用bucketを初回準備時にStorage APIで作成（private、40MB、video/mp4とapplication/jsonのみ）。service_roleでのみアクセス。一般ユーザー向けのStorage RLSポリシーは追加しない。署名付きアップロードURLは所有者パスの新規動画1件に限定。アップロード後は実サイズ・MIMEを検証。既存写真bucketに変更なし。
- ジョブJSONとcreate/publishのロックはStorageに永続化。原子的な新規オブジェクト作成で二重送信を防止。公開応答が不明な場合はロックを残し、自動再送せず状態確認を案内。再読込時も端末のジョブIDから状態確認できる。
- 公開成功時に一時動画を削除。手動の一時動画削除も用意。次回の投稿準備時に同一ユーザーの24時間超の動画、30日超のジョブ/ロックを最大1000件の一覧から整理。定期実行ではないため、利用が止まった場合は残存する。必要時にStorage管理画面で削除できる。

## 環境変数・配布
既存Secretsをそのまま使う：SUPABASE_URL、SUPABASE_ANON_KEY、SUPABASE_SERVICE_ROLE_KEY、HANAKO_OWNER_USER_ID、INSTAGRAM_USER_ID、INSTAGRAM_ACCESS_TOKEN。META_GRAPH_VERSIONは既存設定を優先（未設定時v23.0）。音楽検索の例は公式v22.0で記載されており、不明な最新版へ勝手に切替えない。
追加キー・有料APIは不要。ただし動画一時保存・転送には既存Supabase枠を消費する。新規DBテーブル、既存認証・投稿権限の変更なし。
配布対象：index.html、sw.js、version.json、reel-maker.mjs、reel-maker.css、reel-music.mjs。関数：supabase/functions/instagram-audio/index.ts（verify_jwt=true）。

## 検証
- tests/instagram-audio.test.mjs：未ログイン・非所有者拒否、検索パラメーター、試聴URL、権限エラー、所有者の署名付きアップロード、上限サイズ、明示的公開、音源指定、二重投稿/不明応答の再送防止を検査。
- 既存投稿・ビート解析・非公開写真キャッシュと合わせ15件通過。
- tests/reel-music-browser.mjs：390px幅のChromeで、モック公式APIを用い検索/お気に入り/選択/15秒の無音生成/投稿準備/許可前の公開禁止/許可後1回だけ公開を検証。未処理JSエラーなし。実アカウントへの公開はしない。
- 実際のMetaアカウントのカタログへのアクセス可否はOPS所有者のログイン後に検索で確認する必要がある。今回のテストは実Metaトークンの権限成功を保証しない。iPhone実機の試聴・共有も未検証。
- Supabaseの変更情報を確認。直近のTLS1.2旧暗号スイート廃止（2026-11-10予定）は現行ブラウザ/fetchの実装変更を要しない。Security Advisorは既存の漏洩パスワード保護OFF警告と、意図的にクライアントポリシーを持たない既存テーブルのINFOを返した。本機能でDBポリシーは変更していない。

## 使い方
ホームの「リールを作る」→写真4枚→音楽「Instagram公式音楽を検索・選択」→曲名/アーティストを検索→選択→動画制作。プレビュー後「この動画と楽曲で投稿準備」→処理状態を確認→公開を許可するチェック→「確認してInstagramへ公開」。公式音楽付きの完成動画はInstagram側で確認する。

## 接続設定不足の修正（v367）
2026-10-18の利用時にINSTAGRAM_USER_ID未設定エラーが発生。音楽APIがSecretsのみ参照し、OPSのVault共通接続を参照していなかった。実環境では共通設定のIDとVaultトークンも未登録だった（秘密の値は取得・出力せず、登録有無だけ確認）。OPSの同期ログインとInstagramへの認可は別。
音楽APIは、所有者のOPS設定＋VaultのFacebook Login接続を優先し、サーバーSecretsの完全な組をフォールバックとして使用する。Instagram Login接続をFacebook Login用Audio APIへ流用しない。リクエスト単位で接続情報を扱い、異なる呼び出し間にトークンを保持しない。
リール画面に「Instagram音楽の接続設定」を追加。実アカウントと音楽APIの取得が両方成功した場合のみ、既存のservice_role専用RPCでトークンをVaultへ保存する。ID・APIホスト・バージョンは既存設定へ保存し、返信の有効状態などは保持する。コメント返信使用中や異なるアカウントへの差し替えは拒否する。候補トークンもエラーから除去し、入力欄は成功・失敗とも消去、localStorageへ保存しない。
追加のDBスキーマ・認証変更なし。実際に音楽取得を開始するには、Meta側のFacebookページ連携・Facebook LoginのID/トークン・必要権限を利用者が設定する必要がある。未登録の認可情報を自動で作成したり、登録完了を装ったりはしない。
関連テスト26件通過。390/1440pxのブラウザで未設定エラー→設定欄が開く→テスト保存→入力トークン消去→検索のフローをモック応答で確認。本番アカウントの認証・楽曲取得成功の確認とは区別する。
