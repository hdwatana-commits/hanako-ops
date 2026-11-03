export function isDailyActivityQuestion(value){
 const text=String(value||'').normalize('NFKC');
 return text.length<=80&&(text.match(/[?？]/g)||[]).length<=1&&!/(?:いつも|普段|仕事|職業|彼氏|家族|兄|撮影|コスプレ|明日|昨日|来週|好きな|おすすめ|何歳|誰|だれ)/.test(text)&&/何(?:を)?(?:してる|している|してます|しています|やってる|やっている|して過ご|やって過ご)|どう過ごして/.test(text);
}
export function dailyActivityReply(comment,plan){return isDailyActivityQuestion(comment)&&plan?.answer_ja?plan.answer_ja:'';}
export function isActivityRepetitionComplaint(value){
 const text=String(value||'').normalize('NFKC');
 return /(?:買い物|買物|ショッピング|同じ話|同じこと|同じ返事|同じ返信).{0,24}(?:ばっか|ばかり|何度も|毎回|繰り返|また|いつも)|(?:また|いつも|毎回|何度も|ばっか|ばかり).{0,24}(?:買い物|買物|ショッピング)|(?:同じ話|同じこと|同じ返事|同じ返信).{0,12}(?:やめ|しないで|飽き)|always.{0,20}shopping/iu.test(text);
}
export function isDailyActivityRequest(value){
 const text=String(value||'').normalize('NFKC');
 if(isActivityRepetitionComplaint(text)||/いつも|普段|昨日|明日|来週|職業/u.test(text))return false;
 return isDailyActivityQuestion(text)||/(?:今日|今(?:から|夜)?|これから).{0,18}(?:何(?:を)?(?:する|して|やって)|どう過ご|予定|どこ.{0,6}(?:行く|行って|お出かけ)|仕事(?:なの|ですか|かな|[?？])|買い物(?:なの|ですか|かな|[?？])|友達と(?:遊ぶ|会う)[?？])|(?:何(?:を)?(?:する|してる)|どこ(?:に|へ)?行く).{0,10}(?:今日|今から)|what (?:are you doing|are your plans).{0,12}(?:today|now)|(?:are you|do you).{0,12}(?:working|shopping).{0,12}today/iu.test(text);
}
const activityTopics=[
 {code:'shopping',topic:/買い物|買物|ショッピング|shopping/iu,report:/(?:今日(?:は|も)?|これから|今から|私(?:は|も)?|わたし(?:は|も)?).{0,16}(?:買い物|買物|ショッピング)|(?:買い物|買物|ショッピング).{0,14}(?:行って|行く|楽しん|楽しめ|してくる|してきた|してた|の日)|(?:today|I['’]m|I am).{0,25}(?:going shopping|shopping)/iu},
 {code:'friends',topic:/友達|友だち|お友達|friends/iu,report:/(?:今日(?:は|も)?|これから|今から|私(?:は|も)?).{0,16}友(?:達|だち)と.{0,8}(?:遊ぶ|遊ん|会う|会って|出かけ)|友(?:達|だち)と遊ぶ日|(?:today|I['’]m|I am).{0,25}(?:meeting|seeing|hanging out with) (?:my )?friends/iu},
 {code:'work',topic:/仕事|働|勤務|work/iu,report:/(?:今日(?:は|も)?|これから|今から).{0,12}(?:ITの)?(?:お)?仕事(?:の日|だよ|して|に行|へ行)|(?:today|I['’]m|I am).{0,20}working/iu}
];
export function activityReplyContext(comment,post,plan,conversation=[]){
 const complaint=isActivityRepetitionComplaint(comment),requested=isDailyActivityRequest(comment);
 const history=conversation.filter(h=>{
  const time=Date.parse(h.reply_at||h.at);return Number.isFinite(time)&&new Date(time).toLocaleDateString('sv-SE',{timeZone:'Asia/Tokyo'})===plan?.day_jst;
 }).flatMap(h=>h.replies||[]);
 return {requested,repetition_complaint:complaint,plan_code:requested?plan?.activity_code:null,
  allowed_topics:complaint?[]:activityTopics.filter(x=>x.topic.test(`${comment||''}\n${post||''}`)).map(x=>x.code),
  already_shared_today:requested&&history.some(text=>activityTopics.find(x=>x.code===plan?.activity_code)?.topic.test(text)),
  recent_activity_reports:[...new Set(conversation.slice(-6).flatMap(h=>h.replies||[]).flatMap(text=>activityTopics.filter(x=>x.report.test(text)).map(x=>x.code)))]};
}
export function wrongActivityReply(text,context){
 const reports=activityTopics.filter(x=>x.report.test(String(text||'')));
 if(!context?.requested)return reports.some(x=>!context?.allowed_topics?.includes(x.code));
 return Boolean(context.plan_code&&context.plan_code!=='unconfirmed'&&reports.some(x=>x.code!==context.plan_code));
}
export const ACTIVITY_CONVERSATION_PROMPT=`
【最優先：予定の繰り返しと自然な話題】
daily_activityは今日の予定を直接聞かれた場合だけ渡される参照情報。毎回伝える近況や話題転換の材料ではない。activity_context.requestedがfalseなら予定を自発的に報告せず、挨拶・褒め言葉・ねぎらい・見送り・野菜等の質問を、買い物・仕事・友達との予定の宣言で締めない。元ポストの『行ってきます』だけから目的地や買い物を補わない。相手の『お疲れさま』『気をつけて』には、気遣いや今の話題に自然に応じればよい。
requestedがtrueなら同日の共通予定を保ちながら今回聞かれたことに答え、answer_jaを固定文としてコピーしない。仕事・買い物・友達との予定を相手ごとに変えない。予定があるだけで『これから出発』『今いる』『帰宅した』『楽しんできた』『買った』とは判断せず、未確認の場所・時間・購入品・進行状況を足さない。already_shared_todayなら既に伝えた予定を初めての近況のように繰り返さず、確認には短く答えて、必要なら実際の履歴につながる別の話題へ自然に進む。いつも・普段の仕事や趣味の質問は今日の予定とは別であり、確定プロフィールで答える。
repetition_complaintがtrueなら、同じ話が続いた指摘を短く受け止め、その予定を再説明しない。『毎回違うものを買ってる』『別のお店に行く』等の言い訳を創作しない。相手の今回の質問に答え、質問がなければ履歴と確定した好みから直近に続いていない話題を1つだけ選ぶ。食・野菜・音楽・映画・アニメ・服・旅行・ゲームの話を、未確認の今日の実体験としてではなく、好みや感想として自然に共有してよい。毎回同じ話題リストを並べたり、『ところで何が好き？』の型で切り替えたりしない。会話が自然に終わる場面では無理に続けない。Instagramでは新しい質問を付けない。
recent_activity_reportsは同じ相手への実際の最近の返答で繰り返した予定の種類。質問されていないのに再登場させない。現在の具体的な質問や気持ちを先に扱い、プロフィールの趣味を順番に消化するような機械的な話題転換もしない。外国語も同じ原則で相手の言語で返す。
`;
export function cosplayUpdate(day){return day>='2026-10-18'?'綾波レイとアスカのコスプレを公開済み。アスカを見た人には、両方見たかを決め付けず、レイとアスカのどちらの自分が好みだったか改めて聞いてよい。既に比較の答えがあれば繰り返さない。明日公開予定とは言わない。':day==='2026-10-17'?'綾波レイのコスプレを公開済み。見たという感想には、明日（2026年10月18日）公開予定のアスカのコスプレはもっと大胆だから楽しみにしてほしいと短く自然に伝えてよい。未公開の衣装の細部や写真内容は創作しない。':'';}
export function outdatedCosplayReply(text,day){return day!=='2026-10-17'&&/アスカ|asuka/i.test(text||'')&&/明日|tomorrow/i.test(text||'');}
