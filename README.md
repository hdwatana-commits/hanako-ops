# Hanako Room Ops

楽天ROOMへ誘導するレディースファッションSNS運用ツールです。

## 使い方

1. `index.html` をブラウザで開く
2. 「商品パイプライン」にROOMへ載せたい商品を登録
3. 「投稿メーカー」で媒体と切り口を選んで投稿文を生成
4. コピーして投稿、または「明日に入れる」で投稿カレンダーに保存
5. 投稿後は「成果メモ」にクリック数や売上件数を記録

投稿メーカーでは、届けたい相手、投稿目的、季節、文体、寄り添う悩み、冒頭のつかみ、今回だけ入れたい情報を指定できます。`別案を作る`では構成を変え、`3案を比較`では情景・本音・問いかけの3方向を同時に生成します。右側の完成度レビューでは、媒体別の文字量、広告表記、具体性、CTA、共感、会話の余白、誇大表現を確認できます。

Xを選ぶと、`比較`、`ランキング`、`セール速報`、`着回し案` の投稿型に切り替わります。比較とランキングは登録済み商品を複数使うため、商品を3つ以上登録すると投稿の質が上がります。

Instagramを選ぶと、`カルーセル3選`、`楽天で買える高見え`、`リール台本`、`着回し保存版`、`失敗しない選び方` の保存型に切り替わります。出力には表紙案、スライド構成、リール秒割り、キャプション、保存CTAが入ります。

Threadsを選ぶと、`1日5本セット`、`今日の可愛い発掘`、`骨格ウェーブ寄せ`、`軽い雑談`、`ROOM更新メモ` の短文型に切り替わります。毎日3〜5本の軽い接触を作る想定で、朝・昼・夕方・夜・ROOM更新の投稿案を出せます。

各媒体に `女子大生あるある` を追加しています。商品紹介だけでなく、礼儀正しい女子大生目線のファッション共感投稿を自然に混ぜるための型です。Threadsは短文5本、Instagramは共感カルーセル、Xは短い共感ポストとして出力します。

データはブラウザのローカルストレージに保存されます。右上の下向きボタンでJSONバックアップを書き出せます。

## スマホで本気運用する

このツールはPWA対応済みです。HTTPSで公開すると、スマホのホーム画面に追加してアプリのように使えます。

### GitHub Pages

1. このフォルダのファイルをGitHubリポジトリに置く
2. GitHubの `Settings` → `Pages` を開く
3. `Deploy from a branch` を選ぶ
4. `main` ブランチの `/root` を公開する
5. 表示されたURLをスマホで開く
6. iPhoneはSafariの共有ボタンから「ホーム画面に追加」、AndroidはChromeの「アプリをインストール」

iPhoneで公開URLを開くと、画面上部に `iPhoneに追加` ボタンが表示されます。押すと、Safariでの追加手順が3ステップで表示されます。

### Netlify

1. Netlifyで新しいサイトを作る
2. このフォルダをドラッグ&ドロップ、またはGitHubリポジトリを連携
3. 公開URLをスマホで開く
4. ホーム画面に追加する

クラウド同期を設定しない場合、スマホとPCのデータは別々に保存されます。その場合は、右上の書き出し/読み込みでJSONバックアップを移してください。

## クラウド同期を有効にする

Supabaseの無料プロジェクトを1つ作ると、PCとiPhoneで同じデータを自動同期できます。

1. [Supabase](https://supabase.com/)でプロジェクトを作る
2. `SQL Editor` を開く
3. [supabase-setup.sql](supabase-setup.sql) の内容を貼り付けて実行する
4. Supabaseの `Project Settings` → `API` から `Project URL` と公開用の `anon` または `publishable` keyを確認する
5. [config.js](config.js) を次のように設定する

```js
window.HANAKO_CLOUD_CONFIG = {
  supabaseUrl: "https://あなたのプロジェクト.supabase.co",
  supabaseAnonKey: "公開用キー",
};
```

6. GitHub PagesまたはNetlifyへ再公開する
7. PCで画面上部の `同期` → `初回登録` を押す
8. iPhoneでも同じメールアドレスとパスワードでログインする

以後は編集内容が約1秒後にクラウドへ保存されます。別端末を開いた時やアプリへ戻った時にも新しいデータを確認します。オフライン中は端末内に保存され、通信復帰後の編集から同期を再開します。

Supabaseでメール確認を有効にしている場合、初回登録後に確認メールを開いてからログインしてください。ブラウザには公開用キーだけを設定し、`service_role` keyは絶対に置かないでください。

## 楽天URLから商品・宿泊施設を自動登録する

商品パイプラインのURL欄へ楽天ROOM、楽天市場、楽天トラベル、楽天アフィリエイトURLを貼ると、商品名または宿泊施設名、価格、カテゴリ、画像、推しポイント候補を自動入力します。宿泊施設では取得できる場合、住所、評価、口コミ数、チェックイン・アウト、主な設備も保存します。アフィリエイトURLは成果計測を維持するため、登録リンクとしてそのまま保存します。

この機能はSupabase Edge Functionを1回だけ公開する必要があります。

1. Supabase Dashboardで対象プロジェクトを開く
2. 左メニューの `Edge Functions` を開く
3. `Deploy a new function` を押す
4. 関数名を `rakuten-product-import` にする
5. [supabase/functions/rakuten-product-import/index.ts](supabase/functions/rakuten-product-import/index.ts) の全文を貼り付ける
6. JWT verificationを有効にした状態でDeployする
7. 更新した `index.html`、`app.js`、`styles.css`、`cloud-sync.js`、`sw.js` をGitHubへアップロードする

自動取得は同期アカウントでログインしている時だけ利用できます。楽天トラベル対応版へ更新する場合は、同じ関数のコード全文を貼り替えて再度Deployしてください。宿泊料金が日程によって変わるページでは「料金は日程で変動」と登録します。投稿メーカーでは「誰と行くか」と「一番大切な条件」を選ぶと、旅行専用のInstagram・Threads・X投稿へ切り替わります。楽天側のページ構成によって取得できない場合は、楽天市場の商品ページまたは楽天トラベルの宿泊施設ページを直接開き、そのURLで再試行してください。

## 運用メモ

- 投稿文には `PR`、`広告`、`アフィリエイトを含みます` などの表記を入れてください。
- 無差別フォロー、無差別いいね、自動リプ大量送信、同一文面の連投は避けてください。
- 商品画像や公式素材は、利用条件を確認してから使ってください。
- ファッション投稿では、投稿メーカーの「着ていく場面」「一番重視すること」「気になるポイント」を選ぶと、同じ商品でも通学・通勤・デート・推し活向けに文章が変わります。
- 商品ページから取得できたブランド・色・素材・評価は確認済み情報として表示し、取得できない情報は推測せず商品ページで確認する文章になります。
- 商品パイプラインでは、各商品にInstagram・Threads・Xのおすすめ投稿型、初期テスト用の曜日・時間、提案理由を自動表示します。「この案で作る」で投稿メーカーへ設定し、「予定に追加」で次の推奨日時をカレンダーへ入れられます。
- 投稿時間は成果を保証するものではありません。商品カテゴリと投稿内容から決めた初期テスト時間として使い、成果メモを記録しながら調整してください。

## ROOM投稿機能

左メニューの `ROOM投稿` では、商品パイプラインの商品からROOM専用投稿文を生成できます。既存のROOMレビュー生成エンジンを `room-review-generator.js` としてアプリへ統合しています。

1. 商品を選んで `ROOM文を作る`
2. 内容を確認し、`コピーして商品を開く`
3. PCではROOMヘルパー、iPhoneでは貼り付けを使ってROOM側へ入力
4. ROOM側で商品・価格・在庫・文章を確認して公開
5. アプリの投稿待ちを `投稿済みにする`

投稿待ちキューはクラウド同期の対象です。PC用Chrome拡張は `room-helper-extension-v1.zip` からダウンロードできます。ZIPを展開し、Chromeの `拡張機能を管理` → `デベロッパーモード` → `パッケージ化されていない拡張機能を読み込む` で、展開したフォルダを選択します。

誤商品・誤文面の公開を防ぐため、ROOM側の最終投稿操作は自動化せず、利用者が確認して行う設計です。

## コーデ作成・無料Gemini着用イメージ

左メニューの `コーデ` では、登録済み商品を組み合わせてROOM用レビュー文、投稿用コーデ画像ボード、Geminiに貼るための着用イメージ指示文を作れます。

1. 自分の全身写真を選ぶ
2. 雰囲気とシーンを選ぶ
3. ワンピース、トップス、ボトムス、バッグ、シューズ、アクセを選ぶ
4. `コーデ文と画像ボードを作る` でROOM文と画像ボードを生成
5. `Gemini用プロンプト作成` でGeminiに貼る指示文を作る
6. `Gemini文コピー` でコピーし、`Geminiを開く` からGeminiへ貼り付ける
7. Geminiで作った画像を保存し、アプリの `Geminiで作った画像を添付` へ戻す

この無料モードではOpenAI APIキー、Gemini APIキー、Supabase Edge Functionの追加は不要です。本人の写真だけを使い、投稿では「着用イメージ」「コーデ案」として扱ってください。実物のサイズ感、色味、素材感、完全な再現性は保証せず、商品ページ確認へ誘導する設計です。

## X・Instagram・Threadsへ投稿する

SNSのアクセストークンはGitHubやブラウザへ置かず、Supabase Edge Function Secretsで管理します。

### Edge Functionを公開

1. Supabaseの `Edge Functions` → `Deploy a new function` → `Via Editor`
2. 関数名を `social-publish`
3. [supabase/functions/social-publish/index.ts](supabase/functions/social-publish/index.ts) の全文を貼る
4. `Verify JWT with legacy secret`をONにしてDeploy
5. `index.html`、`app.js`、`styles.css`、`sw.js`をGitHubへアップロード

### Supabase Secrets

SupabaseのEdge Functions設定に、利用するSNSの値を登録します。

```text
X_API_KEY
X_API_SECRET
X_ACCESS_TOKEN
X_ACCESS_TOKEN_SECRET
INSTAGRAM_ACCESS_TOKEN
INSTAGRAM_USER_ID
THREADS_ACCESS_TOKEN
THREADS_USER_ID
META_GRAPH_VERSION
```

`META_GRAPH_VERSION`にはMeta Developer Dashboardで利用中のGraph APIバージョンを入力します。利用しないSNSの値は不要です。

### 必要な権限

- X: OAuth 1.0aのApp permissionsをRead and writeにして、API Key、API Secret、Access Token、Access Token Secretを登録
- Instagram: プロアカウントとコンテンツ公開権限。画像は外部から取得できる公開URLが必要
- Threads: `threads_basic`と`threads_content_publish`を許可したユーザートークン

設定後、アプリの `SNS連携` → `接続を確認` で状態を確認できます。投稿メーカーで内容を作り、`SNSへ投稿`を押すと確認後に公開します。

この構成はハナコ本人の1アカウント運用向けです。第三者にもログイン接続を提供する場合は、各SNSのOAuthフロー、トークン更新、アプリ審査を別途実装してください。
