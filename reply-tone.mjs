const formal=/ありがとうございます|ございます|いたします|いたしました|承知しました|承知いたしました|かしこまりました|おっしゃ|存じます|でしょうか/u;
export function replyToneContext(comment,replies=[]){
 const text=String(comment||'');
 const reject=/敬語.{0,15}(?:やめ|使わ|しない|いら|不要|ほしくない)|急に敬語|距離.{0,8}(?:感じ|取ら|置か)/u.test(text);
 const request=!reject&&/敬語で(?:話して|返信して|お願い)|丁寧語で(?:話して|返信して|お願い)/u.test(text);
 const examples=replies.filter(s=>/[ぁ-んァ-ン一-龯]/u.test(s)&&!formal.test(s)&&!/(?:です|ます)[。！？!?…\s]*$/u.test(s)).slice(-3);
 return {register:request?'polite':'friendly_casual',has_casual_history:examples.length>0,examples};
}
export function wrongReplyRegister(text,context){
 if(context?.register!=='friendly_casual'||!/[ぁ-んァ-ン一-龯]/u.test(text))return false;
 if(formal.test(text))return true;
 const endings=String(text).match(/(?:です|ます)[。！？!?…\s]*(?=$|\n)/gu)||[];
 return endings.length>=(context.has_casual_history?1:2);
}
