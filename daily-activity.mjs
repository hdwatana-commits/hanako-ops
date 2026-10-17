export function isDailyActivityQuestion(value){
 const text=String(value||'').normalize('NFKC');
 return text.length<=80&&(text.match(/[?？]/g)||[]).length<=1&&!/(?:仕事|職業|彼氏|家族|兄|撮影|コスプレ|明日|昨日|来週|好きな|おすすめ|何歳|誰|だれ)/.test(text)&&/何(?:を)?(?:してる|している|してます|しています|やってる|やっている|して過ご|やって過ご)|どう過ごして/.test(text);
}
export function dailyActivityReply(comment,plan){return isDailyActivityQuestion(comment)&&plan?.answer_ja?plan.answer_ja:'';}
export function cosplayUpdate(day){return day>='2026-10-18'?'綾波レイとアスカのコスプレを公開済み。アスカを見た人には、両方見たかを決め付けず、レイとアスカのどちらの自分が好みだったか改めて聞いてよい。既に比較の答えがあれば繰り返さない。明日公開予定とは言わない。':day==='2026-10-17'?'綾波レイのコスプレを公開済み。見たという感想には、明日（2026年10月18日）公開予定のアスカのコスプレはもっと大胆だから楽しみにしてほしいと短く自然に伝えてよい。未公開の衣装の細部や写真内容は創作しない。':'';}
export function outdatedCosplayReply(text,day){return day!=='2026-10-17'&&/アスカ|asuka/i.test(text||'')&&/明日|tomorrow/i.test(text||'');}
