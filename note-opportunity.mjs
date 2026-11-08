// Add a stable 11% sample of extra positive reactions during the JST evening window.
function eveningNoteSample(commentId,now){
 if(!commentId)return false;
 const jst=new Date(now.getTime()+9*60*60*1000);
 if(jst.getUTCHours()*60+jst.getUTCMinutes()<19*60+30)return false;
 let hash=2166136261;
 for(const ch of String(commentId))hash=Math.imul(hash^ch.charCodeAt(0),16777619);
 return (hash>>>0)%100<11;
}

export function noteOpportunity(comment,conversation=[],allowed=false,{now=new Date(),commentId,platform='threads'}={}){
 if(!allowed)return {reason:'daily_limit',suggest:false};
 const current=String(comment||'').trim();
 if(!current)return {reason:'no_text',suggest:false};
 const past=conversation.map(c=>String(c.comment||''));
 const interested=/note|ノート|記事/iu.test(current)&&/教えて|リンク|どこ|読みたい|買いたい|購入したい|見たい/u.test(current);
 const refusal=/買わない|買えない|買いたくない|購入しない|購入できない|いらない|不要|宣伝.*(?:やめ|嫌)|勧誘.*(?:やめ|嫌)|お金がない|お金ない|余裕がない|買った|購入済|読みました|読んだ/u;
 if(!interested&&[current,...past].some(t=>refusal.test(t)))return {reason:'declined_or_purchased',suggest:false};
 if(/つらい|辛い|苦しい|痛い|入院|病気|亡く|死にたい|落ち込|不安|寂し|嫌われ|見捨て|依存/u.test(current))return {reason:'support_first',suggest:false};
 if(interested)return {reason:'article_interest',suggest:true};
 if(/会いたい|会いたく|会おう|会える|会って|デート|連絡先|DM|ＤＭ|ダイレクトメッセージ|直接メッセージ|LINE|ライン交換|電話|通話|ビデオ通話|meet you|meet up|your number|call you|direct message/iu.test(current))return {reason:'direct_invitation',suggest:true};
 const exchanges=conversation.filter(c=>c.replies?.length).length;
 if(exchanges>=3&&/楽しい|たのしい|面白い|おもしろい|盛り上が|笑っ|笑える|ありがとう|素敵な話|楽しかった/u.test(current))return {reason:'friendly_conversation',suggest:true};
 // Keep the usual choices above; this extra sample is Threads-only.
 if(platform==='threads'&&current.length>=5&&/かわいい|可愛い|かわいすぎ|綺麗|きれい|素敵|すてき|似合|大好き|最高|楽し[いか]|面白[いか]|おもしろ[いか]|\b(cute|pretty|lovely|beautiful|gorgeous)\b/iu.test(current)&&!/[?？]|note|ノート|記事|嫌い|苦手|迷惑|宣伝|やめて|いらない|不要|興味ない|怖い|心配|疲れ|お大事|大丈夫|じゃない|くない|ません|not |don't/iu.test(current)&&eveningNoteSample(commentId,now))return {reason:'friendly_conversation',suggest:true};
 return {reason:'ordinary_reply',suggest:false};
}
