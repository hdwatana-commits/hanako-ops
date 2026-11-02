// Account-wide samples supply style signals only, never another person's facts.
const reactionPatterns=[
 {name:'嬉しい・うれしいで気持ちをまとめる',pattern:/嬉し|うれし/u},
 {name:'照れ・ドキドキで返す',pattern:/照れ|ドキドキ|どきどき/u},
 {name:'想像して反応する',pattern:/想像|妄想/u},
 {name:'心が温まる・ほどけるという抽象的な感想',pattern:/(?:心|気持ち|疲れ).{0,10}(?:あたた|温ま|ほどけ|ふわっ)/u},
 {name:'定型的な褒め返し',pattern:/かわいいね|可愛いね|えらいな|偉いな/u}
];
const openingPatterns=[/^(?:ふふ|えへへ|あひっ)/u,/^そう言って(?:もら|くれ)/u,/^そんな(?:ふうに|こと)?言われ/u];
const words=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/https?:\/\/\S+/gu,'').replace(/[^\p{Letter}\p{Number}]/gu,'');
const texts=values=>values.filter(x=>typeof x==='string'&&x.trim());
export function replyVarietyContext(comment,samePerson=[],accountRecent=[],platform='threads'){
 const personal=texts(samePerson).slice(-6),account=texts(accountRecent).slice(-12);
 const frequent=pattern=>personal.slice(-3).filter(x=>pattern.test(x)).length>=2||account.filter(x=>pattern.test(x)).length>=3;
 return {
  avoid_reactions:reactionPatterns.filter(x=>frequent(x.pattern)).map(x=>x.name),
  avoid_openings:openingPatterns.filter(frequent).map(x=>x.source),
  recent_lengths:personal.slice(-3).map(x=>[...x].length),
  prefer_no_question:platform==='instagram'||(personal.length>=2&&personal.slice(-2).every(x=>/[?？]/u.test(x))),
  answer_first:/[?？]|教えて|どこ|どれ|何|いつ|どうして|なぜ/u.test(String(comment||'')),
  compact_reaction:[...String(comment||'')].length<=30&&!/[?？]/u.test(String(comment||''))
 };
}
export function repeatedReplyPattern(text,context){
 const value=String(text||'');
 if([...words(value)].length<12)return false;
 return reactionPatterns.some(x=>context?.avoid_reactions?.includes(x.name)&&x.pattern.test(value))||
  openingPatterns.some(x=>context?.avoid_openings?.includes(x.source)&&x.test(value.trim()));
}
export const REPLY_VARIETY_PROMPT=`
【最優先：単調な返し方を変える】
reply_variety_contextは同じ相手とアカウント全体の最近の返信から集めた表現の傾向であり、他人との出来事や好みではない。avoid_reactionsとavoid_openingsにある反応・書き出しは今回は使わず、同義語に置き換えるだけの同じ型も避ける。該当しない普通のお礼や、質問に答えるための作品名・好み等の事実まで変更しない。
相手の言葉を長く言い直して『って言ってくれてありがとう→嬉しい・照れる→♡』に毎回当てはめない。具体的な質問への答え、相手の発見への感想、短い喜び、内容に合う小さな冗談、話題に合う確定済みの好みの共有から、今回必要なものを選ぶ。すべてを詰めず、一言だけで十分なら短く終える。可愛さや恋愛の反応で内容を置き換えない。
recent_lengthsと同じ長さを埋める必要はなく、短い一言・必要な説明・余韻のある締めを内容に合わせて使い分ける。compact_reactionなら無理に話を膨らませない。prefer_no_questionなら今回は原則質問を足さず、相手の新しい質問には先に答える。会話を続ける目的で回答済みの質問・同じ二択・毎回の好み確認を繰り返さない。Instagramは質問なしの1回の返答で完結させる。
話題が停滞しているときだけ実際の会話から自然な接点のある別の話題へ移り、新しい質問や相談の途中で急に脱線しない。絵文字や語尾だけを変えた同じ文を繰り返さない。毎回ハートで締める必要はない。誤字・未確認の体験・過剰な内輪感を作って自然さを演出しない。
reply_retry_feedbackがある場合は、破棄された候補にその問題があった。今回の質問への回答と確定した事実を保ったまま、反応・構成を選び直す。元の投稿を別の話題へ変える指示ではない。
【最優先：読みやすい改行】
返信が2文以上なら文の区切りで実際に改行する。共感から回答、回答から案内へ切り替わる箇所も自然な段落にする。短い1文はそのままでよい。空行は必要な箇所に1つまで。文・単語・URLの途中を文字数だけで折り返さず、改行を文字列の\\nとして出力しない。同じ言語で自然な文に整える。
`;
