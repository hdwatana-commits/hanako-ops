# Gemini接続の手動選択

OPSのThreads返信から「Geminiの接続先」を選んで「クラウドに保存」で変更できます。別アカウント・プロジェクトへの通常の移行用です。接続先は自動巡回せず、利用上限による待機中は変更を拒否します。選択した接続が未登録なら保存・生成は失敗し、別キーへフォールバックしません。

OPSの「Gemini APIキーの登録」で接続1〜3を選び、Google AI Studioのキーを貼り付けて「キーを登録・更新」を押します。所有者の認証が必要です。登録済みの表示は保存状態を表し、Google側で有効かどうかは「接続とAIをテスト」で確認します。

OPSからの登録はSupabase Vaultに暗号化して保存します。service_roleだけが実行できるRPCを、所有者認証済みのEdge Functionから呼びます。キーは履歴・ブラウザーの永続ストレージ・GitHubに保存せず、APIレスポンスにも返しません。入力欄は送信後に空にします。キー変更は返信処理のロックと利用上限の待機状態を確認します。既存DBにはsupabase-gemini-key-registry.sqlも適用してください。

手動でFunctions Secretsに登録する方法も利用できます。OPSに該当画面へのリンクと、接続ごとのSecret名をコピーするボタンがあります。

| OPS表示 | Secret名 |
|---|---|
| 接続1 | GEMINI_API_KEY |
| 接続2 | GEMINI_API_KEY_SECONDARY |
| 接続3 | GEMINI_API_KEY_THIRD |

Vaultに登録した同じ接続のキーが優先され、未登録の接続だけ既存のFunction Secretを使います。OPSから登録したキーはFunctions Secrets一覧には表示されません。接続の保存では自動返信をONにせず、現在のスイッチ・モードを維持してください。変更後「接続とAIをテスト」で選択した接続の動作を確認できます。

既存DBにはsupabase-gemini-connections.sqlを適用します。新規DBはsupabase-threads-replies.sqlに列を含みます。Google側の無料・有料状態はコードでは判断しないため、使用するプロジェクトのプランを本人が確認してください。課金を有効にする操作は行いません。
