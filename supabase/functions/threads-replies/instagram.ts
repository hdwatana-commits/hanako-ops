import {firstInstagramComments,instagramPairFilter} from '../../../instagram-reply-rules.mjs';
export async function instagramReplyMemory(db:any,ownerId:string,authorId:string,commentId:string){
 const base=`hanako_ig_reply_queue?user_id=eq.${encodeURIComponent(ownerId)}&status=eq.published&comment_id=neq.${encodeURIComponent(commentId)}`;
 const history=await db(`${base}&author_id=eq.${encodeURIComponent(authorId)}&order=commented_at.desc&limit=20&select=comment_id,comment_text,reply_text,caption,commented_at,status,reply_id`);
 const recent=await db(`${base}&order=updated_at.desc&limit=12&select=reply_text`);
 return {instagram_history:history.map((h:any)=>({...h,post_text:h.caption})),instagram_recent_replies:recent.map((h:any)=>h.reply_text).filter(Boolean)};
}
export function instagramReplies(deps:any){
 const instagramTone="\\n【Instagram専用：スーパードMモード】名前は演出上のラベル。実際の口調は照れ屋で甘えん坊、優しく可愛く、褒められるとすぐドキドキする。お礼・共感・投稿の具体的な感想・軽い冗談・質問への回答から、今回のコメントに合う反応を選ぶ。毎回褒め言葉への照れで返さず、照れやドキドキは合う場面だけ使う。例文のコピーはせず、投稿のキャプションと相手の言葉を具体的に拾う。past_conversationはこのInstagram利用者との過去の交流だけで、別投稿でも既出の話を考慮してよい。recent_repliesには他の相手への返信も含むため、言い回しの重複回避だけに使い、他人との会話内容をこの相手の経験として扱わない。同じ冒頭・語尾・擬音・感想の型を続けず、普通のお礼や落ち着いた返答も自然に選ぶ。毎回同じ擬音や語尾にせず、擬音は多くても1返信に1つ、普通のお礼や質問には内容に沿って自然に答える。外国語には同じ言語で自然に表現し、日本語の擬音を無理に入れない。性的な喘ぎ声・具体的な性行為・性癖の強調・服従や何でも従う約束はしない。";
 const {db,owner,env,settings,generate,inWindow,exclusionReason,hasNotePromotion,wrongNoteReply,hasInstagramPromotion,wrongGreeting,wrongReplyLanguage}=deps;
 const filter=()=>`user_id=eq.${encodeURIComponent(owner())}`;
 let credentials:any=null;
 const creds=async()=>{if(credentials)return credentials;const cfg=await config();const token=await db('rpc/hanako_ig_token_read','POST',{owner_id:owner()})||env('INSTAGRAM_ACCESS_TOKEN',true);const id=cfg.account_id||env('INSTAGRAM_USER_ID',true);if(!id||!token)throw Error('InstagramユーザーIDとコメント返信用トークンをOPSで登録してください');return credentials={id,token,host:cfg.api_host||env('INSTAGRAM_API_HOST',true)||'graph.facebook.com',version:cfg.graph_version||env('META_GRAPH_VERSION',true)||'v23.0'};};
 const graph=async(path:string,params:any={},method='GET')=>{
  const connection=await creds();const host=connection.host;if(!['graph.facebook.com','graph.instagram.com'].includes(host))throw Error('Instagram APIのホスト設定を確認してください');
  const version=connection.version;if(!/^v\d+\.\d+$/.test(version))throw Error('Instagram APIバージョンが不正です');
  const url=new URL(`https://${host}/${version}/${path}`);if(method==='GET')url.search=new URLSearchParams(params).toString();
  let r:any;try{r=await fetch(url,{method,headers:{Authorization:`Bearer ${connection.token}`},...(method==='GET'?{}:{body:new URLSearchParams(params)}),signal:AbortSignal.timeout(30000)});}catch{throw Error('Instagram通信に失敗しました。認証と接続を確認してください');}
  const value=await r.json();if(!r.ok||value.error)throw Error(`Instagram: HTTP ${r.status}（コード${Number(value.error?.code)||0}）。トークン期限とコメント管理権限を確認してください`);return value;
 };
 const config=async()=>{const rows=await db(`hanako_ig_reply_settings?${filter()}`);return rows[0]||(await db('hanako_ig_reply_settings','POST',{user_id:owner()}))[0];};
 const update=async(value:any)=>db(`hanako_ig_reply_settings?${filter()}`,'PATCH',value);
 const patch=async(c:any,value:any)=>db(`hanako_ig_reply_queue?${instagramPairFilter(owner(),c.media_id,c.author_id)}`,'PATCH',{...value,updated_at:new Date().toISOString()});
 const account=async()=>{const connection=await creds();const me=await graph(connection.id,{fields:'id,username'});if(!me.id||String(me.id)!==connection.id||me.username!=='hanako47258')throw Error('返信先のInstagramアカウントを確認してください（hanako47258）');return me;};
 const media=async(limit:number)=>{const page=await graph(`${(await creds()).id}/media`,{fields:'id,caption,media_type,media_product_type,timestamp',limit:String(limit)});return (page.data||[]).slice(0,limit);};
 const all=async(path:string,fields:string)=>{let after='';const values:any[]=[];for(let n=0;n<50;n++){const p=await graph(path,{fields,limit:'100',...(after?{after}:{})});values.push(...(p.data||[]));if(!p.paging?.next)return values;const next=p.paging?.cursors?.after;if(!next||next===after)throw Error('Instagramの全コメント確認を完了できませんでした');after=next;}throw Error('コメントの取得上限です。初回コメントを確認できるまで返信しません');};
 const alreadyReplied=async(c:any,allComments:any[],me:any)=>{for(const comment of allComments.filter(x=>x.from?.id===c.author_id)){const replies=await all(`${comment.id}/replies`,'id,from,text,timestamp');if(replies.some(x=>x.from?.id===me.id||x.from?.username===me.username))return true;}return false;};
 const check=async()=>{const me=await account();const posts=await media(1);if(posts[0])await graph(`${posts[0].id}/comments`,{fields:'id,text,timestamp,from,parent_id',limit:'1'});return {ready:true,username:me.username,read_comments:true,write_permission:'初回返信時に確認'};};
 const run=async()=>{
  const cfg=await config();if(!cfg.enabled)return {status:'off'};if(!await db('rpc/hanako_ig_reply_lock','POST',{owner_id:owner()}))return {status:'busy'};
  try{
   const s=await settings();if(!inWindow(s))return {status:'outside_window'};
   if((s.ai_provider==='openai'&&s.openai_ready===false)||(s.ai_retry_at&&Date.parse(s.ai_retry_at)>Date.now()))return {status:'quota_wait'};
   const me=await account(),posts=await media(cfg.post_limit);if(!posts.length)return {status:'idle'};
   const post=posts[(cfg.scan_offset||0)%posts.length];await update({scan_offset:((cfg.scan_offset||0)+1)%posts.length});
   const comments=await all(`${post.id}/comments`,'id,text,timestamp,from,parent_id');
   const first=firstInstagramComments(comments,me);
   const rows=first.map((c:any)=>({user_id:owner(),media_id:post.id,author_id:c.from.id,username:c.from.username,comment_id:c.id,comment_text:c.text||'',caption:post.caption||'',media_type:post.media_product_type||post.media_type||'',commented_at:c.timestamp,status:Date.parse(c.timestamp)<Date.parse(cfg.started_at)?'skipped':'pending',error:Date.parse(c.timestamp)<Date.parse(cfg.started_at)?'開始前の初回コメントのため対象外':''}));
   if(rows.length)await db('hanako_ig_reply_queue?on_conflict=user_id,media_id,author_id','POST',rows,'resolution=ignore-duplicates,return=representation');
   await db(`hanako_ig_reply_queue?${filter()}&status=eq.generating&updated_at=lt.${encodeURIComponent(new Date(Date.now()-600000).toISOString())}`,'PATCH',{status:'failed',error:'生成が中断されました',updated_at:new Date().toISOString()});
   await db(`hanako_ig_reply_queue?${filter()}&status=eq.publishing&updated_at=lt.${encodeURIComponent(new Date(Date.now()-600000).toISOString())}`,'PATCH',{status:'uncertain',error:'公開結果が不明です。自動再送しません'});
   const candidates=await db(`hanako_ig_reply_queue?${filter()}&media_id=eq.${encodeURIComponent(post.id)}&status=in.(pending,failed)&attempts=lt.3&reply_due_at=lte.${encodeURIComponent(new Date().toISOString())}&order=commented_at.asc&limit=1`);
   const c=candidates[0];if(!c){await update({last_run:new Date().toISOString(),last_error:''});return {status:'idle',media_id:post.id,people:first.length};}
   const original=first.find((x:any)=>x.from.id===c.author_id);if(!original||original.id!==c.comment_id){await patch(c,{status:'skipped',error:'最初のコメントを確認できません'});return {status:'skipped'};}
   const excluded=exclusionReason(s,{username:c.username,comment_text:c.comment_text});if(excluded||await alreadyReplied(c,comments,me)){await patch(c,{status:'skipped',error:excluded||'本人が既に返信済みです'});return {status:'skipped'};}
   if(!await db('rpc/hanako_ig_claim_pair','POST',{owner_id:owner(),target_media:c.media_id,target_author:c.author_id}))return {status:'busy'};
   const input={comment_id:c.comment_id,username:`ig_${c.author_id}`,comment_text:c.comment_text,post_text:c.caption,platform:'instagram',...await instagramReplyMemory(db,owner(),c.author_id,c.comment_id)};
   let text:string;try{text=await generate({...s,use_history:false,custom_prompt:s.custom_prompt+instagramTone+'\nInstagramの投稿・リールへの初回コメントだけの返信。会話を続ける質問は付けず、短く自然に返す。Instagramへの案内や自分のInstagramリンクは書かない。あだ名を創作しない。'},input);}catch(e){if(deps.isQuotaError?.(e)){await patch(c,{status:'pending',attempts:c.attempts,error:'AIの上限です。待機します'});await deps.updateSettings({ai_retry_at:new Date(Date.now()+3600000).toISOString()});return {status:'quota_wait'};}await patch(c,{status:'failed',error:e instanceof Error?e.message:'生成失敗'});throw e;}
   await patch(c,{status:'draft',reply_text:text});if(cfg.mode==='draft')return {status:'draft'};
   const fresh=await config(),freshSettings=await settings();if(!fresh.enabled||fresh.mode!=='auto'||!inWindow(freshSettings)||JSON.stringify([freshSettings.ai_provider,freshSettings.ai_connection])!==JSON.stringify([s.ai_provider,s.ai_connection]))return {status:'draft'};
   if(!(await media(fresh.post_limit)).some((p:any)=>p.id===c.media_id)){await patch(c,{status:'skipped',error:'現在の対象投稿の範囲外です'});return {status:'skipped'};}
   const newlyExcluded=exclusionReason(freshSettings,{username:c.username,comment_text:c.comment_text});if(newlyExcluded){await patch(c,{status:'skipped',error:newlyExcluded});return {status:'skipped'};}
   const currentComments=await all(`${post.id}/comments`,'id,text,timestamp,from,parent_id');
   if(firstInstagramComments(currentComments,me).find((x:any)=>x.from.id===c.author_id)?.id!==c.comment_id){await patch(c,{status:'skipped',error:'送信前に最初のコメントを確認できませんでした'});return {status:'skipped'};}
   if(await alreadyReplied(c,currentComments,me)){await patch(c,{status:'skipped',error:'本人が既に返信済みです'});return {status:'skipped'};}
   if(wrongGreeting(text)||wrongReplyLanguage(c.comment_text,text)||hasInstagramPromotion(text)||wrongNoteReply(text,true))throw Error('Instagram返信文の形式・言語を再確認してください');
   if(hasNotePromotion(text)&&!await db('rpc/hanako_note_claim','POST',{owner_id:owner(),fan_username:`ig_${c.author_id}`,target_comment_id:c.comment_id})){
    text=await generate({...s,use_history:false,custom_prompt:s.custom_prompt+instagramTone+'\nInstagram初回への短い返答だけ。Note案内は本日済みのため禁止。質問やInstagram案内も書かない。'},input);if(hasNotePromotion(text)||hasInstagramPromotion(text)||wrongGreeting(text)||wrongReplyLanguage(c.comment_text,text))throw Error('案内なしの返信を確認できませんでした');await patch(c,{reply_text:text});
   }
   await patch(c,{status:'publishing'});
   try{const result=await graph(`${c.comment_id}/replies`,{message:text},'POST');if(!result.id)throw Error('返信結果IDを確認できません');await patch(c,{status:'published',reply_id:result.id,error:''});}
   catch(e){await patch(c,{status:'uncertain',error:'Instagramの投稿結果を確認してください。自動再送しません'});throw e;}
   await update({last_run:new Date().toISOString(),last_error:''});return {status:'published',comment_id:c.comment_id};
  }catch(e){await update({last_run:new Date().toISOString(),last_error:e instanceof Error?e.message:'Instagram処理失敗'});throw e;}
  finally{await update({lease_until:null});}
 };
 return {check,run,connect:async(value:any)=>{await config();if(!value)throw Error('Instagram接続情報が必要です');if(!/^[0-9]{5,30}$/.test(value.account_id||'')||!['graph.facebook.com','graph.instagram.com'].includes(value.api_host)||!/^v\d+\.\d+$/.test(value.graph_version||'')||! /^[A-Za-z0-9._-]{20,4096}$/.test(value.token||''))throw Error('Instagram接続情報の形式を確認してください');credentials={id:value.account_id,host:value.api_host,version:value.graph_version,token:value.token};await check();await db('rpc/hanako_ig_token_save','POST',{owner_id:owner(),token_value:value.token});await update({account_id:value.account_id,api_host:value.api_host,graph_version:value.graph_version});return {saved:true};},load:async()=>({settings:await config(),token_configured:Boolean(await db('rpc/hanako_ig_token_read','POST',{owner_id:owner()})||env('INSTAGRAM_ACCESS_TOKEN',true)),replies:await db(`hanako_ig_reply_queue?${filter()}&order=commented_at.desc&limit=100`)}),save:async(value:any)=>{if(typeof value.enabled!=='boolean'||!['auto','draft'].includes(value.mode)||!Number.isInteger(value.post_limit)||value.post_limit<1||value.post_limit>4)throw Error('Instagram返信設定が不正です');const current=await config();if(value.enabled)await check();await update({enabled:value.enabled,mode:value.mode,post_limit:value.post_limit,...(value.enabled&&!current.activated_at?{activated_at:new Date().toISOString(),started_at:new Date().toISOString()}:{})});return {saved:true};}};
}




