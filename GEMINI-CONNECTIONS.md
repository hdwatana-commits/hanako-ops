# Gemini接続の手動選択

OPSのThreads返信から「Geminiの接続先」を選んで「クラウドに保存」で変更できます。別アカウント・プロジェクトへの通常の移行用です。接続先は自動巡回せず、利用上限による待機中は変更を拒否します。選択した接続が未登録なら保存・生成は失敗し、別キーへフォールバックしません。

Supabase Secretsに本人がキーを保存してください。

| OPS表示 | Secret名 |
|---|---|
| 接続1 | GEMINI_API_KEY |
| 接続2 | GEMINI_API_KEY_SECONDARY |
| 接続3 | GEMINI_API_KEY_THIRD |

キーの入力・保存はSupabaseのSecrets画面で行います。OPS、GitHub、返信履歴にはキーを保存しません。OPSには登録状態だけを返します。接続の保存では自動返信をONにせず、現在のスイッチ・モードを維持してください。変更後「接続とAIをテスト」で選択した接続の動作を確認できます。

既存DBにはsupabase-gemini-connections.sqlを適用します。新規DBはsupabase-threads-replies.sqlに列を含みます。Google側の無料・有料状態はコードでは判断しないため、使用するプロジェクトのプランを本人が確認してください。課金を有効にする操作は行いません。
