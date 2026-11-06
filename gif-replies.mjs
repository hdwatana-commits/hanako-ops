export const GIF_SCENES=Object.freeze({thanks:'ありがとう',happy:'うれしい・笑顔',shy:'照れ',affection:'好意・ハート',goodnight:'おやすみ',hello:'ごあいさつ',cheer:'応援・拍手',surprise:'びっくり',reaction:'その他のリアクション'});
export const DEFAULT_GIF_SETTINGS=Object.freeze({enabled:false,rate:20,emoji_enabled:true,latest_post_only:false,items:[]});
export function parseGiphyId(value){
 const text=String(value||'').trim();if(!text||text.length>1000)throw Error('GIPHYのGIFページURLかGIF IDを入力してください');
 if(/^[a-zA-Z0-9]{1,100}$/.test(text))return text;
 let url;try{url=new URL(text);}catch{throw Error('GIPHYのGIFページURLを入力してください');}
 if(url.protocol!=='https:'||!/(^|\.)giphy\.com$/i.test(url.hostname)||url.username||url.password||url.port)throw Error('https://giphy.com/ のGIFページURLを入力してください');
 const path=url.pathname.split('/').filter(Boolean);let id='';
 if(path[0]==='gifs'&&path.length===2)id=path[1].split('-').at(-1);
 else if(path[0]==='embed'&&path.length===2)id=path[1];
 else if(path[0]==='media')id=path[1]?.startsWith('v1.')?path[2]:path[1];
 if(!/^[a-zA-Z0-9]{1,100}$/.test(id))throw Error('GIF個別ページのURLを貼り付けてください（検索結果のURLは使えません）');
 return id;
}
export function gifPreviewUrl(value){try{return `https://i.giphy.com/media/${parseGiphyId(value)}/giphy.gif`;}catch{return '';}}
export function validateGifSettings(input){
 if(!input||typeof input.enabled!=='boolean'||typeof input.emoji_enabled!=='boolean'||!Number.isInteger(input.rate)||input.rate<0||input.rate>100||!Array.isArray(input.items)||input.items.length>180)throw Error('GIFの有効・無効、使用割合（0〜100%）、登録内容を確認してください');
 if(input.latest_post_only!==undefined&&typeof input.latest_post_only!=='boolean')throw Error('GIFを最新のポストだけにする設定を確認してください');
 const seen=new Set(),counts={};
 const items=input.items.map(item=>{
  if(!item||!Object.hasOwn(GIF_SCENES,item.scene)||typeof item.enabled!=='boolean'||typeof item.label!=='string'||item.label.length>60)throw Error('GIFの場面・名前・使用設定を確認してください');
  const gif_id=parseGiphyId(item.gif_id),key=item.scene+':'+gif_id;
  if(seen.has(key))throw Error('同じ場面に同じGIFが重複しています');seen.add(key);
  counts[item.scene]=(counts[item.scene]||0)+1;if(counts[item.scene]>20)throw Error('GIFは1つの場面に20件まで登録できます');
  return {scene:item.scene,gif_id,label:item.label.trim()||GIF_SCENES[item.scene],enabled:item.enabled};
 });
 if(input.enabled&&!items.some(item=>item.enabled))throw Error('使用するGIFを1件以上登録してから有効にしてください');
 return {enabled:input.enabled,rate:input.rate,emoji_enabled:input.emoji_enabled,latest_post_only:input.latest_post_only??false,items};
}
export function readGifSettings(input){try{return validateGifSettings(input||DEFAULT_GIF_SETTINGS);}catch{return {...DEFAULT_GIF_SETTINGS,items:[]};}}
const gifHash=value=>{let result=2166136261;for(const c of String(value||''))result=Math.imul(result^c.codePointAt(0),16777619)>>>0;return result;};
const gifEmojiOnly=value=>{const text=String(value||'').trim();return text.length>0&&/[\p{Extended_Pictographic}\p{Emoji_Presentation}]/u.test(text)&&!/[\p{Letter}\p{Number}]/u.test(text);};
export function gifScene(comment,reply='',now=new Date()){
 const text=String(comment||'').normalize('NFKC').trim();
 if(!text||/亡く|亡くな|お悔や|葬|死|病|入院|事故|災害|つらい|辛い|苦しい|怖い|寂しい|孤独|不安|嫌い|やめて|不快|謝罪|ごめん|ばっか|ばかり|迷惑|苦情|同じ.{0,8}(?:返|話)|sorry|died|death|grief|funeral|hospital|depress|suicid|lonely|scared|condolence/iu.test(text)||/note\.com|instagram\.com|記事.{0,20}(?:買|購入)/iu.test(reply))return null;
 if(/おやすみ|good\s*night|buenas\s*noches|bonne\s*nuit|晚安|잘\s*자|😴|💤/iu.test(text)){
  const hour=Number(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tokyo',hour:'2-digit',hourCycle:'h23'}).format(now));return hour>=17||hour<5?'goodnight':null;
 }
 if(/ありがと|感謝|thanks?|thank\s*you|gracias|merci|謝謝|谢谢|감사|🙏/iu.test(text))return 'thanks';
 if(/おはよ|こんにち|こんばん|hello|good\s*(?:morning|evening)|hola|bonjour|你好|안녕|👋/iu.test(text))return 'hello';
 if(/照れ|はずかし|恥ずかし|blush|shy|🫣|☺️/iu.test(text))return 'shy';
 if(/がんば|頑張|応援|おめでと|congrat|good\s*luck|cheer|👏|💪|🎉/iu.test(text))return 'cheer';
 if(/びっくり|驚|surpris|wow|😳|😲|😮/iu.test(text))return 'surprise';
 if(/大好き|好きだ|好きです|love\s*you|te\s*amo|❤️|💕|💖|💗|💓|💞|🥰|😍|😘/iu.test(text))return 'affection';
 if(/かわいい|可愛い|すてき|素敵|嬉し|うれし|笑|cute|beautiful|lovely|happy|😂|🤣|😆|😁|😊|😀/iu.test(text))return 'happy';
 return gifEmojiOnly(text)?'reaction':null;
}
function gifCandidates(settings,comment,reply,now){
 const config=readGifSettings(settings),text=String(comment.comment_text||'');
 if(!config.enabled||comment.platform==='instagram')return null;
 const scene=gifScene(text,reply,now);if(!scene)return null;
 if(gifEmojiOnly(text)){if(!config.emoji_enabled)return null;}
 else if(gifHash(comment.comment_id)%100>=config.rate)return null;
 let items=config.items.filter(item=>item.enabled&&item.scene===scene);
 if(!items.length)items=config.items.filter(item=>item.enabled&&item.scene==='reaction');
 return items.length?items:null;
}
export function chooseReplyGif(settings,comment,reply,history=[],now=new Date(),accountLatest=[]){
 const items=gifCandidates(settings,comment,reply,now);if(!items)return null;
 const usage=new Map();let lastId=null;
 if(Array.isArray(history)){
  for(const [index,row] of history.entries()){
   const id=row.reply_gif?.gif_id;if(!id)continue;
   if(!lastId)lastId=id;
   const old=usage.get(id)||{count:0,last:0},date=Date.parse(row.reply_published_at);
   usage.set(id,{count:old.count+1,last:Math.max(old.last,Number.isFinite(date)?date:Math.max(1,Number(now)-index))});
  }
 }else if(history&&Array.isArray(history.usage)){
  lastId=history.last_gif_id;
  for(const row of history.usage){
   const count=Number(row.uses),last=Date.parse(row.last_used_at);
   if(typeof row.gif_id==='string'&&Number.isFinite(count)&&count>=0)usage.set(row.gif_id,{count,last:Number.isFinite(last)?last:0});
  }
 }
 const excluded=new Set([lastId,accountLatest[0]?.reply_gif?.gif_id].filter(Boolean));
 const available=items.filter(item=>!excluded.has(item.gif_id));if(!available.length)return null;
 const count=item=>usage.get(item.gif_id)?.count||0,last=item=>usage.get(item.gif_id)?.last||0;
 const minimum=Math.min(...available.map(count)),leastUsed=available.filter(item=>count(item)===minimum);
 const oldest=Math.min(...leastUsed.map(last)),pool=leastUsed.filter(item=>last(item)===oldest);
 const chosen=pool[gifHash(comment.comment_id+':gif')%pool.length];
 return {provider:'GIPHY',gif_id:chosen.gif_id,scene:chosen.scene,label:chosen.label};
}
export function allowedReplyGif(settings,comment,reply,selection,now=new Date()){
 if(selection?.provider!=='GIPHY')return null;
 const item=gifCandidates(settings,comment,reply,now)?.find(item=>item.gif_id===selection.gif_id&&item.scene===selection.scene);
 return item?{provider:'GIPHY',gif_id:item.gif_id,scene:item.scene,label:item.label}:null;
}
