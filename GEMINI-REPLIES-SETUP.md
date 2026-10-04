# Gemini無料枠への切り替え

2026-10-04: 返信AIの既定値をGeminiに変更。モデルはgemini-3.5-flash-lite。Google AI StudioのDefault Gemini Project（gen-lang-client-0802733457）は無料枠で、同モデルの上限表示は15 RPM / 250K TPM / 500 RPDでした。上限は変更される可能性があります。テスト・再生成も同じ枠を使います。

Supabase Edge FunctionはGEMINI_API_KEYを参照します。Google AI Studioに既存のDefault Gemini API Keyがあります。本人がそのキーをSupabaseのName=GEMINI_API_KEY、Value=キー全文として保存する必要があります。課金を有効にしない無料プロジェクトのキーを使用してください。コードからGoogle側の課金状態は保証できません。

OpenAIへの自動フォールバックはありません。Geminiの429はコメントをpendingに戻し、ai_retry_atで1時間の再試行待機を設定します。日次上限が残っている間は、後の再試行でも待機を継続します。生成を完了できない／形式が不正な返信はfailedとして確認できます。投稿結果が不明な返信はuncertainのままで自動再送しません。

既存DBにはsupabase-gemini-replies.sqlを適用済み。新規導入時はsupabase-threads-replies.sqlに待機列を含みます。返信設定は停止／下書きのままです。Geminiキー保存後の実生成テストとThreads本人認証は未完了です。

無料APIではコメント・会話履歴がGoogleの製品改善に利用される場合があります。公式条件: https://ai.google.dev/gemini-api/terms
