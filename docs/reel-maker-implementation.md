# リール自動制作：実装・運用メモ（2026-10-18）

## 調査と選定
対象は publish-v321。HTML/CSS/素のJavaScript製の静的PWA。package.jsonやビルド工程はなく、index.htmlとapp.jsの画面切替で動作する。旧版v271-edit/v320-editには変更しない。
認証・同期はcloud-sync.jsがSupabase Auth/REST/Storageを呼び出す。SQLにアプリ状態、投稿・下書き、非公開写真用の構成がある。social-publish Edge Functionは所有者確認後にInstagramフィード/カルーセル等を公開する。既存Secretsや既存投稿フローは変更しない。READMEではGitHubへ静的ファイルをアップロードする運用を案内している。

|方式|現行構成との適合・費用・制限|
|---|---|
|Canvas + Web Audio + MediaRecorder（採用）|追加サービス・環境変数・素材送信なし。SafariのH.264/AAC MP4対応を実行時検査。端末性能に依存し、画面を開いて実時間で録画する|
|FFmpeg専用ワーカー|安定した固定fps/エンコードに適するが、既存に実行ホストがなく、キュー・認証・ストレージと運用追加が必要|
|Remotion|専用レンダー環境・依存追加が必要。今回の静的PWAへの最小追加には過大|
|Supabase Edge Functions|ホスト版のCPU上限2秒、メモリ256MB。動画エンコードの実行先には採用しない|

公式資料: https://webkit.org/blog/11353/mediarecorder-api/ 、https://supabase.com/docs/guides/functions/limits 。changelog.mdの取得も試みたが取得できず。Supabaseのスキーマ・関数・認証変更は行わない。

## 実装
- Instagram → リール自動制作を既存ナビへ追加。独立モジュールと専用CSSで既存UIへの影響を限定。
- 写真4枚。左右ボタンで並び替え、削除後に差し替え。JPG/PNG、HEICはブラウザがデコードできる場合のみ。25MB/枚上限。画像を最大辺1920へ縮小しメモリ抑制。
- 全体を余白付きで収めるため顔・服装はトリミングしない。背景は同じ画像のぼかし。顔検出による自動クロップではない。
- MP3/M4A/WAV等は端末の音声デコード対応次第。40MB上限。開始位置、試聴、利用権確認、15/20/30秒。
- 選択区間をモノラル解析。20ms RMSエネルギーの局所ピーク検出と間隔ヒストグラムによるBPM推定。実音源のテンポ変化・シンコペーションでは誤検出し得る。低信頼時に案内。手動BPMと±1秒補正を用意。
- 3種テンプレート。ハート・泡・光、ズーム、パン、フェード、ビートカット、ポップの弱いフラッシュ。人物のピクセルを変形・再生成しない。
- テキスト1区間、改行、開始/終了、3位置、2色、縁取り、フェード。最大160字、描画は最大5行。複数の独立した歌詞キュー編集は未実装。
- MP4 H.264/AAC、1080×1920、30fps要求、映像6.5Mbps。実際のfps/ビットレートはブラウザと負荷に依存。固定30fpsの保証やサーバー後処理なし。
- 進捗・中止・再生成・プレビュー・ダウンロード・対応端末のファイル共有。画面非表示時は中止して再試行を案内。成功・失敗時にストリーム/AudioContextを解放。
- 同時生成は画面内1件。サーバージョブ、永続キュー、バックグラウンド生成、端末間素材同期なし。再読込で素材・結果は消える。保存済みMP4のみ端末に残る。
- SWキャッシュ/versionを360へ更新。既存非公開写真キャッシュの保持方式を維持。

## Instagram公式音楽APIの確認結果
公式Audio APIの候補URL:
https://developers.facebook.com/docs/instagram-platform/content-publishing/audio-api/
公式Instagram Login投稿資料:
https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/content-publishing/
公式ライセンス案内:
https://www.facebook.com/help/instagram/402084904469945

本環境ではMeta公式Audio API資料が429/取得不可となり、検索・楽曲取得・プレビュー・波形・開始位置・音源指定投稿・クリエイター対応・必要権限/審査・ログイン方式別の適用条件を一次資料から確定できなかった。「音楽APIが存在しない/利用できない」とは結論しない。未確認の機能は接続せず、UIに確認中と表示する。第三者記事を実装根拠にしない。非公開API・スクレイピング・楽曲ダウンロードなし。
方式Aは権利のある音源をアップロード。方式Bは無音動画を保存しInstagramアプリで公式音源を手動追加。方式Bのビート同期は保証しない。楽曲検索・お気に入り・波形表示・API投稿は未実装。商用/広告利用の許諾と地域・アカウント条件は利用者が確認する必要がある。既存のアクセストークン方式を音楽対応とみなさず、追加権限の推測実装はしない。
参考Instagramアカウント/リールも取得不可のため、参考動画との一致は未確認。依頼に記載された視覚要件に基づく実装。

## デプロイ・iPhone操作
追加環境変数・APIキー・有料サービスなし。既存静的ホストへindex.html/app.js/sw.js/version.jsonとreel-maker.mjs/reel-engine.mjs/reel-maker.cssを一緒に配布する。本番公開先は https://hdwatana-commits.github.io/hanako-ops/ 。既存GitHubリポジトリのmainブランチへ必要なファイルを反映してGitHub Pagesで公開する。
HTTPSで開き、更新後にInstagram → リール自動制作、写真4枚、音楽（または後付け）、スタイル、制作の順。制作中はSafariを前面に保つ。完成後に再生確認し「iPhoneで保存・共有」→「ビデオを保存」。共有非対応時はMP4ダウンロード。無音の場合はInstagramで新規リールに保存動画を選び音源を追加する。自動投稿はしない。

## 検証
node --check reel-maker.mjs / reel-engine.mjs / app.js / sw.js。
node --test tests/reel-engine.test.mjs tests/social-publish.test.mjs tests/photo-cache.test.mjs：9/9通過。
既存全体テストは48件中46件通過・2件失敗（追加テスト前）。カタログ件数の期待値と追加済み衣装グループが不一致。reply-api.test.mjsは既存reply-rules.mjsのhasInstagramPromotionエクスポート不足で読み込み失敗。今回触れていない箇所であり、スコープ外の修正は行わない。
iPhone実機Safariは接続されておらず、実機保存・共有は未検証。ブラウザ試験は別途結果を下記に記録。

### ブラウザ試験の最終結果
Windows Chrome headless、390×844のモバイル幅で合格。実際のアプリHTML/JavaScriptを読み込み、メニュー遷移、写真4枚、権利確認、テキスト入力、音声付き制作、プレビューのメタデータ、ダウンロードイベント/ファイル名、既存商品画面への復帰を検査。外部リクエストは遮断しており、認証済みクラウド操作は検査していない。
生成結果：1080×1920、15.011167秒、2,986,728バイト、推定120 BPM、9カット。MP4内にavc1とmp4aのコーデック識別子を確認。ブラウザの未処理例外0件。ダウンロードイベントは確認できたが、この隔離環境ではブラウザによるディスク保存はcancelされるため、生成Blobを検証スクリプトで保存した。iPhone写真アプリへの保存を確認したものではない。
サンプル：tests/reel-smoke-output.mp4、画面：tests/reel-mobile-preview.png。実行スクリプト：tests/reel-browser-smoke.mjs（本環境のPlaywrightパスを使用）。
全体再実行は51件中49件通過、上記の既存2件が失敗。静的サイトのためビルドコマンドは存在せず、構文チェックと実ブラウザ生成を実施。

### 変更ファイル一覧
追加：reel-engine.mjs、reel-maker.mjs、reel-maker.css、tests/reel-engine.test.mjs、tests/reel-browser-smoke.mjs、docs/reel-maker-implementation.md。
変更：index.html、app.js（画面名1項目のみ）、sw.js、version.json、README.md。
検証成果物：tests/reel-smoke-output.mp4、tests/reel-mobile-preview.png、tests/reel-regression-results.txt。
