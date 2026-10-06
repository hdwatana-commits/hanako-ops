import { inWindow, validateSettings, TONES, relationshipLevel, exclusionReason, replyClock, wrongGreeting } from '../../../reply-rules.mjs';
import { HANA_PROMPT, RELATIONSHIP_PROMPT, DESTINATION_PROMPT } from './prompt.ts';
const env = (name: string) => { const value=Deno.env.get(name); if(!value) throw new Error(`サーバー設定 ${name} が必要です`); return value; };
const openaiKey = () => {
  for (const name of ['OPENAI_API_KEY','HanakoOPS Replies']) {
    const value=Deno.env.get(name)?.trim();
    if(value && /^sk-\S+$/.test(value)) return value;
  }
  throw new Error('有効なOpenAI APIキーの登録が必要です');
};
const aiProvider = () => Deno.env.get('REPLY_AI_PROVIDER') || 'gemini';
const GEMINI_CONNECTIONS: Record<string,string>={default:'GEMINI_API_KEY',secondary:'GEMINI_API_KEY_SECONDARY',third:'GEMINI_API_KEY_THIRD'};
const geminiKeyName=(s: any) => {const name=GEMINI_CONNECTIONS[s?.ai_connection||'default'];if(!name) throw new Error('Gemini接続が不正です');return name;};
async function connections() {
  const stored=await db('rpc/hanako_gemini_key_status','POST',{owner_id:owner()});
  return Object.entries(GEMINI_CONNECTIONS).map(([id,name])=>({id,configured:Boolean(stored.find((x:any)=>x.profile===id)?.configured||Deno.env.get(name)?.trim())}));
}
async function geminiKey(s: any) {
  const name=geminiKeyName(s);
  const stored=await db('rpc/hanako_gemini_key_read','POST',{owner_id:owner(),profile:s?.ai_connection||'default'});
  return stored || env(name).trim();
}
async function aiConfigured(s?: any) {if(aiProvider()==='gemini') return (await connections()).find(x=>x.id===(s?.ai_connection||'default'))?.configured||false;try{openaiKey();return true;}catch{return false;}}
const invalidReply = (text: string,max: number) => !text || [...text].length>max || /```|@|(?:〇|○|◯|×|X){2,}|\S+(?:さん|くん|君|ちゃん|様)/.test(text) || /会[うえいお]|逢|デート|電話|通話|連絡先|待ち合わせ|DM|LINE|\b(?:meet|meeting|date|call|phone|whatsapp|telegram)\b|见面|見面|전화|만나/i.test(text);
class FreeQuotaError extends Error {}
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization,apikey,content-type', 'Access-Control-Allow-Methods': 'POST,OPTIONS' };
const owner = () => env('HANAKO_OWNER_USER_ID');
const filter = () => `user_id=eq.${encodeURIComponent(owner())}`;
const respond = (body: unknown,status=200) => new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
async function api(url: string, options: RequestInit, label: string) {
  let response: Response;
  try { response=await fetch(url,{...options,signal:AbortSignal.timeout(45000)}); }
  catch { throw new Error(`${label}: 通信または認証設定を確認してください`); }
  const body=await response.json();
  if(label==='Gemini返信生成'&&response.status===429) throw new FreeQuotaError('Gemini無料枠の上限です。コメントを待機させて後で再試行します');
  if(!response.ok||(label!=='データ保存'&&body?.error)) throw new Error(`${label}: HTTP ${response.status}。権限・期限・利用上限を確認してください`);
  return body;
}
async function db(resource: string,method='GET',body?: unknown,prefer='return=representation') {
  return api(`${env('SUPABASE_URL')}/rest/v1/${resource}`,{method,headers:{apikey:env('SUPABASE_SERVICE_ROLE_KEY'),Authorization:`Bearer ${env('SUPABASE_SERVICE_ROLE_KEY')}`,'Content-Type':'application/json',Prefer:prefer},...(body===undefined?{}:{body:JSON.stringify(body)})},'データ保存');
}
async function meta(endpoint: string,params: Record<string,string>={},method='GET') {
  const url=new URL(`https://graph.threads.net/v1.0/${endpoint}`);
  if(method==='GET') url.search=new URLSearchParams(params).toString();
  return api(url.toString(),{method,headers:{Authorization:`Bearer ${env('THREADS_ACCESS_TOKEN')}`},...(method==='GET'?{}:{body:new URLSearchParams(params)})},'Threads');
}
async function settings() {
  const rows=await db(`hanako_reply_settings?${filter()}`);
  if(rows.length) return rows[0];
  return (await db('hanako_reply_settings','POST',{user_id:owner()}))[0];
}
async function updateSettings(value: unknown) { return db(`hanako_reply_settings?${filter()}`,'PATCH',value); }
async function updateComment(id: string,value: unknown) { return db(`hanako_reply_comments?${filter()}&comment_id=eq.${encodeURIComponent(id)}`,'PATCH',value); }
async function queueCount() {
  if(!Deno.env.get('THREADS_ACCESS_TOKEN'))return 0;
  const posts=await latestPosts();
  if(!posts.length)return 0;
  const query=`hanako_reply_comments?${filter()}&select=comment_id&is_owner=eq.false&container_id=is.null&reply_id=is.null&post_id=in.(${posts.map(p=>encodeURIComponent(p.id)).join(',')})&or=(status.eq.pending,and(status.eq.failed,generation_attempts.lt.3,next_attempt_at.not.is.null))`;
  const result=await fetch(`${env('SUPABASE_URL')}/rest/v1/${query}`,{method:'HEAD',headers:{apikey:env('SUPABASE_SERVICE_ROLE_KEY'),Authorization:`Bearer ${env('SUPABASE_SERVICE_ROLE_KEY')}`,Prefer:'count=exact'},signal:AbortSignal.timeout(45000)});
  const total=result.headers.get('content-range')?.split('/')[1];
  if(!result.ok||!total||!/^\d+$/.test(total))throw new Error('順番待ち件数を取得できませんでした。もう一度読み込んでください');
  return Number(total);
}
async function authenticate(request: Request) {
  const token=request.headers.get('authorization')||'';
  const user=await api(`${env('SUPABASE_URL')}/auth/v1/user`,{headers:{apikey:env('SUPABASE_ANON_KEY'),Authorization:token}},'ログイン');
  if(user.id!==owner()) throw new Error('所有者のみ利用できます');
}
async function checkThreadsOwner() {
  const me=await meta('me',{fields:'id,username'});
  if(String(me.id)!==env('THREADS_USER_ID')) throw new Error('Threadsの認証アカウントが所有者設定と一致しません');
  return me;
}
async function generate(s: any,c: any,attempt=0): Promise<string> {
  const history=s.use_history ? await db(`hanako_reply_comments?${filter()}&username=eq.${encodeURIComponent(c.username)}&comment_id=neq.${encodeURIComponent(c.comment_id)}&order=commented_at.desc&limit=20&select=comment_id,comment_text,reply_text,post_text,commented_at,status`) : [];
  const ids=history.map((h:any)=>h.comment_id).filter(Boolean);
  const manual=ids.length ? await db(`hanako_reply_comments?${filter()}&is_owner=eq.true&parent_id=in.(${ids.map((id:string)=>encodeURIComponent(id)).join(',')})&select=parent_id,comment_text,commented_at&order=commented_at.asc`) : [];
  const fans=s.use_history ? await db('rpc/hanako_reply_fans','POST',{owner_id:owner()}) : [];
  const stats=(fans||[]).find((f:any)=>f.username===c.username)||{};
  const relationship=relationshipLevel(stats);
  const conversation=history.reverse().map((h:any)=>({post:h.post_text,comment:h.comment_text,at:h.commented_at,replies:[...(h.status==='published'&&h.reply_text?[h.reply_text]:[]),...manual.filter((r:any)=>r.parent_id===h.comment_id).map((r:any)=>r.comment_text)]}));
  const parent=c.parent_id ? await db(`hanako_reply_comments?${filter()}&comment_id=eq.${encodeURIComponent(c.parent_id)}&select=comment_text,reply_text`) : [];
  const instructions=`${HANA_PROMPT}\n${RELATIONSHIP_PROMPT}\n${DESTINATION_PROMPT}\n相手の名前・ユーザー名・敬称・仮名で呼びかけない。「〇〇」「○○」「〇〇くん」「〇〇さん」等のプレースホルダーも絶対に出さない。相手の性別を推測しない。自然な日本語を確認してから返信する。\n選択されたテンション: ${s.tones.map((x:string)=>TONES[x]).join('、')}。${s.adapt_tone?'この範囲で相手に合わせる。':'選択された口調を優先する。'}\n最大${s.max_chars}文字。\n所有者の追加設定:\n${s.custom_prompt}`;
  const input=JSON.stringify({reply_time_jst:replyClock(),current_post:c.post_text,current_comment:c.comment_text||'(テキストなし。内容を憶測しない)',parent,relationship:{name:relationship.name,tone:relationship.tone,comments:stats.comments||0,active_days:stats.active_days||0,exchanges:stats.replies||0,history_enabled:Boolean(s.use_history)},past_conversation:conversation});
  if(aiProvider()==='gemini') {
    const model=Deno.env.get('GEMINI_REPLY_MODEL')||'gemini-3.5-flash-lite';
    const response=await api(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{method:'POST',headers:{'x-goog-api-key':await geminiKey(s),'Content-Type':'application/json'},body:JSON.stringify({systemInstruction:{parts:[{text:instructions}]},contents:[{role:'user',parts:[{text:input}]}],generationConfig:{maxOutputTokens:1024}})},'Gemini返信生成');
    const candidate=response.candidates?.[0];
    if(candidate?.finishReason!=='STOP') throw new Error('Geminiの生成が未完了または制限されました');
    const text=(candidate.content?.parts||[]).filter((p:any)=>!p.thought).map((p:any)=>p.text||'').join('').trim();
    if(invalidReply(text,s.max_chars)||wrongGreeting(text)) {
      if(!attempt) return generate({...s,custom_prompt:s.custom_prompt+'\n前回の候補は規則違反だったため破棄済み。名前や敬称を付けず、会う・会える・デート・電話・DM・連絡先に一切言及しない。写真・イラストの依頼や対面の誘いならnoteだけを案内し、記事を買って読んでくれたら嬉しいと軽く可愛くお願いする。noteの場所を尋ねられたらInstagramのプロフィールから行けると伝える。それ以外の誘いはコメント内で優しくかわす。最大文字数の半分程度で簡潔に書く。時間帯の挨拶は付けず、内容にだけ返す。'},c,1);
      throw new Error('返信形式を確認してください');
    }
    return text;
  }
  const response=await api('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${openaiKey()}`,'Content-Type':'application/json'},body:JSON.stringify({
    model:Deno.env.get('OPENAI_REPLY_MODEL')||'gpt-6-astra',store:false,
    instructions,
    input
  })},'AI返信生成');
  if(response.status!=='completed') throw new Error('AIの生成が未完了です');
  const text=(response.output||[]).filter((x:any)=>x.type==='message').flatMap((x:any)=>x.content||[]).filter((x:any)=>x.type==='output_text').map((x:any)=>x.text).join('').trim();
  if(wrongGreeting(text)&&!attempt)return generate({...s,custom_prompt:s.custom_prompt+'\n挨拶が現在時刻と矛盾したため破棄。時間帯の挨拶を一切付けず、コメントの内容にだけ返す。'},c,1);
  if(invalidReply(text,s.max_chars)||wrongGreeting(text)) throw new Error('返信形式・時間帯の挨拶を確認してください');
  return text;
}
async function checkConnections() {
  const s=await settings();
  const result:any={openai:{provider:aiProvider(),configured:await aiConfigured(s),ok:false,model:aiProvider()==='gemini'?(Deno.env.get('GEMINI_REPLY_MODEL')||'gemini-3.5-flash-lite'):(Deno.env.get('OPENAI_REPLY_MODEL')||'gpt-6-astra')},threads:{configured:Boolean(Deno.env.get('THREADS_ACCESS_TOKEN')&&Deno.env.get('THREADS_USER_ID')),ok:false}};
  if(result.openai.configured) {
    try { result.openai.sample=await generate({...s,use_history:false},{comment_text:'今日の服、すごく似合ってる！',post_text:'今日のお気に入りコーデ。',username:'connection-test'});result.openai.ok=true; }
    catch(e){result.openai.error=e instanceof Error?e.message:'AI接続に失敗しました';}
  }
  if(Deno.env.get('THREADS_ACCESS_TOKEN')) {
    try {
      const identity=await meta('me',{fields:'id,username'});
      result.threads.id=String(identity.id);result.threads.username=identity.username;
      if(!Deno.env.get('THREADS_USER_ID')) throw new Error('THREADS_USER_IDに表示された本人アカウントIDを設定してください');
      const me=await checkThreadsOwner();
      const posts=await meta('me/threads',{fields:'id,text,is_reply',limit:'5'});
      const post=(posts.data||[]).find((p:any)=>!p.is_reply);
      if(post) await meta(`${post.id}/conversation`,{fields:'id,text,username,timestamp',limit:'1'});
      result.threads.ok=true;result.threads.username=me.username;
      const uncertain=await db(`hanako_reply_comments?${filter()}&status=eq.uncertain&select=comment_id,container_id&limit=10`);
      result.threads.uncertain=[];
      for(const item of uncertain) {
        if(!item.container_id) continue;
        try {const container=await meta(item.container_id,{fields:'id,status,error_message'});result.threads.uncertain.push({comment_id:item.comment_id,status:container.status,error:container.error_message||''});}
        catch {result.threads.uncertain.push({comment_id:item.comment_id,status:'UNKNOWN'});}
      }
    } catch(e){result.threads.error=e instanceof Error?e.message:'Threads接続に失敗しました';}
  }
  result.ready=result.openai.ok&&result.threads.ok;
  return result;
}
// One page per invocation; persist cursors so large accounts do not starve older posts.
async function scan(s: any,me: any) {
  let posts=s.scan_posts||[];
  let next=s.scan_after;
  if(!posts.length) {
    const page=await meta('me/threads',{fields:'id,text,is_reply',limit:'50',...(next?{after:next}:{})});
    posts=(page.data||[]).filter((p:any)=>!p.is_reply);
    next=page.paging?.next?page.paging?.cursors?.after:null;
    await updateSettings({scan_posts:posts,scan_after:next,scan_comment_after:null});
  }
  if(!posts.length) return;
  const post=posts[0];
  const page=await meta(`${post.id}/conversation`,{fields:'id,text,username,timestamp,is_reply_owned_by_me,replied_to',limit:'50',...(s.scan_comment_after?{after:s.scan_comment_after}:{})});
  const rows=(page.data||[]).filter((c:any)=>c.id&&c.timestamp&&c.username).map((c:any)=>{
    const isOwner=Boolean(c.is_reply_owned_by_me)||c.username===me.username;
    return {user_id:owner(),comment_id:c.id,post_id:post.id,parent_id:c.replied_to?.id||null,username:c.username,
      comment_text:c.text||'',post_text:post.text||'',commented_at:c.timestamp,is_owner:isOwner,
      status:'history'};
  });
  if(rows.length) await db('hanako_reply_comments?on_conflict=user_id,comment_id','POST',rows,'resolution=ignore-duplicates,return=representation');
  await skipCollectedReplies(rows);
  const after=page.paging?.next?page.paging?.cursors?.after:null;
  if(!after) posts.shift();
  await updateSettings({scan_posts:posts,scan_comment_after:after,scan_after:next});
}
// Replies do not count as posts. Follow pages until two original posts are found.
async function latestPosts() {
  const posts:any[]=[];let after:string|undefined;
  do {
    const page=await meta('me/threads',{fields:'id,text,is_reply',limit:'50',...(after?{after}:{})});
    for(const p of page.data||[])if(!p.is_reply&&!posts.some(x=>x.id===p.id))posts.push(p);
    if(posts.length>=2)return posts.slice(0,2);
    after=page.paging?.next?page.paging?.cursors?.after:undefined;
    if(page.paging?.next&&!after)throw new Error('対象ポストの確認を完了できませんでした');
  } while(after);
  return posts;
}
async function skipOutsideLatest(c:any) {
  if((await latestPosts()).some(p=>p.id===c.post_id))return false;
  await updateComment(c.comment_id,{status:'skipped',error:'直近2件のポスト以外のため自動返信しません',next_attempt_at:null});
  return true;
}
async function scanRecent(s: any,me: any) {
  const fields='id,text,username,timestamp,is_reply_owned_by_me,replied_to';
  const newest=await latestPosts();
  const scope=newest.length?`&post_id=not.in.(${newest.map(p=>encodeURIComponent(p.id)).join(',')})`:'';
  await db(`hanako_reply_comments?${filter()}&status=in.(pending,failed,draft)&container_id=is.null&reply_id=is.null${scope}`,'PATCH',{status:'skipped',error:'直近2件のポスト以外のため自動返信しません',next_attempt_at:null});
  const live=s.live_scan||{};
  let posts=(live.posts||[]).filter((p:any)=>newest.some(n=>n.id===p.id)),next=null,after=live.comment_after||null;
  if(live.posts?.[0]?.id!==posts[0]?.id)after=null;
  if(!posts.length) {
    posts=[...newest];after=null;
  }
  let checked=0;
  async function ingest(post:any,cursor?:string|null) {
    const page=await meta(`${post.id}/conversation`,{fields,limit:'50',reverse:'true',...(cursor?{after:cursor}:{})});
    const eligible=(page.data||[]).filter((c:any)=>c.id&&c.timestamp&&c.username&&Date.parse(c.timestamp)>=Date.parse(s.started_at));
    const rows=eligible.map((c:any)=>{const isOwner=Boolean(c.is_reply_owned_by_me)||c.username===me.username;return {user_id:owner(),comment_id:c.id,post_id:post.id,parent_id:c.replied_to?.id||null,username:c.username,comment_text:c.text||'',post_text:post.text||'',commented_at:c.timestamp,is_owner:isOwner,status:isOwner?'history':'pending'};});
    if(rows.length)await db('hanako_reply_comments?on_conflict=user_id,comment_id','POST',rows,'resolution=ignore-duplicates,return=representation');
    await skipCollectedReplies(rows);
    checked++;
    const reachedHistory=(page.data||[]).some((c:any)=>c.timestamp&&Date.parse(c.timestamp)<Date.parse(s.started_at));
    return !reachedHistory&&page.paging?.next?page.paging?.cursors?.after:null;
  }
  const heads=new Map<string,any>();
  for(const post of newest)heads.set(post.id,await ingest(post));
  if(posts.length) {
    const post=posts[0];
    after=!after&&heads.has(post.id)?heads.get(post.id):await ingest(post,after);
    if(!after)posts.shift();
  }
  await updateSettings({live_scan:{posts,after:next,comment_after:after,checked,last_checked:new Date().toISOString()}});
  return checked;
}
async function skipCollectedReplies(rows:any[]) {
  for(const id of new Set(rows.filter(r=>r.is_owner&&r.parent_id).map(r=>r.parent_id))) {
    await db(`hanako_reply_comments?${filter()}&comment_id=eq.${encodeURIComponent(String(id))}&status=in.(pending,failed,draft)&container_id=is.null&reply_id=is.null`,'PATCH',{status:'skipped',error:'本人が返信済みのためスキップしました',next_attempt_at:null});
  }
}
async function skipExcluded(c:any,s:any) {
  const error=exclusionReason(s,c);
  if(!error)return false;
  await updateComment(c.comment_id,{status:'skipped',error,next_attempt_at:null});
  return true;
}
async function skipIfReplied(c:any) {
  let after:string|undefined;
  do {
    const page=await meta(`${c.comment_id}/replies`,{fields:'id,is_reply_owned_by_me,username',limit:'50',...(after?{after}:{})});
    if((page.data||[]).some((r:any)=>r.is_reply_owned_by_me)) {
      await updateComment(c.comment_id,{status:'skipped',error:'本人が返信済みのためスキップしました',next_attempt_at:null});
      return true;
    }
    after=page.paging?.next?page.paging?.cursors?.after:undefined;
    if(page.paging?.next&&!after) throw new Error('手動返信の確認を完了できませんでした');
  } while(after);
  return false;
}
async function publish(c: any) {
  if(await skipOutsideLatest(c))return;
  if(await skipExcluded(c,await settings())) return;
  if(await skipIfReplied(c)) return;
  if(wrongGreeting(c.reply_text)) throw new Error('返信時刻と挨拶が合いません。再生成してください');
  if(invalidReply(c.reply_text,500)) throw new Error('返信文が会う・電話・連絡先交換の禁止または形式のルールに反しています。再生成してください');
  // Write publishing before any external write. Never automatically retry an uncertain result.
  await updateComment(c.comment_id,{status:'publishing',error:''});
  try {
    const container=await meta('me/threads',{media_type:'TEXT',text:c.reply_text,reply_to_id:c.comment_id},'POST');
    if(!container.id) throw new Error('ThreadsコンテナIDがありません');
    await updateComment(c.comment_id,{container_id:container.id});
    // Meta prepares containers asynchronously. Publish only after readiness is confirmed.
    let ready=false;
    for(let attempt=0;attempt<6;attempt++) {
      const state=await meta(container.id,{fields:'id,status,error_message'});
      if(state.status==='FINISHED') {ready=true;break;}
      if(state.status!=='IN_PROGRESS') throw new Error('Threadsの返信準備が完了しませんでした。投稿状態を確認してください');
      if(attempt<5) await new Promise(resolve=>setTimeout(resolve,2000));
    }
    if(!ready) throw new Error('Threadsの返信準備が時間内に完了しませんでした。投稿状態を確認してください');
    if(await skipExcluded(c,await settings())) return;
    if(await skipOutsideLatest(c))return;
    if(wrongGreeting(c.reply_text))throw new Error('返信時刻と挨拶が合いません。再生成してください');
    const result=await meta('me/threads_publish',{creation_id:container.id},'POST');
    if(!result.id) throw new Error('Threads投稿結果IDがありません');
    await updateComment(c.comment_id,{status:'published',reply_id:result.id,error:''});
  } catch(e) {
    await updateComment(c.comment_id,{status:'uncertain',error:'投稿結果が不明です。Threads側を確認してください。自動再送はしません'}).catch(()=>{});
    throw e;
  }
}
async function run(action: string,body: any) {
  const s=await settings();
  if(!await db('rpc/hanako_reply_lock','POST',{owner_id:owner()})) return {status:'busy'};
  try {
    if(action==='publish') {
      const rows=await db(`hanako_reply_comments?${filter()}&comment_id=eq.${encodeURIComponent(String(body.commentId))}`);
      if(!rows[0]||rows[0].status!=='draft') throw new Error('公開できる下書きがありません');
      await checkThreadsOwner(); await publish(rows[0]); return {status:'published'};
    }
    if(action==='retry') {
      const rows=await db(`hanako_reply_comments?${filter()}&comment_id=eq.${encodeURIComponent(String(body.commentId))}`);
      if(!rows[0]||!['failed','generating'].includes(rows[0].status)) throw new Error('再生成できる返信がありません');
      await updateComment(rows[0].comment_id,{status:'pending',error:'',generation_attempts:0,next_attempt_at:null}); return {status:'pending'};
    }
    if(!s.enabled) return {status:'off'};
    if(s.ai_retry_at&&new Date(s.ai_retry_at).getTime()>Date.now())return {status:'quota_wait',retry_at:s.ai_retry_at};
    const me=await checkThreadsOwner();
    const checked=await scanRecent(s,me);
    if(!inWindow(s)) {await updateSettings({last_run:new Date().toISOString(),last_error:''}); return {status:'outside_window'};}
    const c=await db('rpc/hanako_reply_claim','POST',{owner_id:owner()});
    if(c) {
      try {
        if(await skipOutsideLatest(c)||await skipExcluded(c,await settings()))return {status:'skipped',checked};
        if(await skipIfReplied(c)) {
          await updateSettings({last_run:new Date().toISOString(),last_error:''});
          return {status:'skipped',checked};
        }
        const text=await generate(s,c);
        await updateComment(c.comment_id,{status:'draft',reply_text:text,error:'',next_attempt_at:null});
        // Re-read after generation so OFF and changed hours take effect before posting.
        const fresh=await settings();
        if(fresh.enabled&&fresh.mode==='auto'&&inWindow(fresh)&&(fresh.ai_connection||'default')===(s.ai_connection||'default')) await publish({...c,reply_text:text});
      } catch(e) {
        if(e instanceof FreeQuotaError) {
          await updateComment(c.comment_id,{status:'pending',error:e.message,generation_attempts:Math.max(0,(c.generation_attempts||1)-1)});
          const retry_at=new Date(Date.now()+3600000).toISOString();
          await updateSettings({ai_retry_at:retry_at,last_error:e.message,last_run:new Date().toISOString()});
          return {status:'quota_wait',retry_at};
        }
        const latest=await db(`hanako_reply_comments?${filter()}&comment_id=eq.${encodeURIComponent(c.comment_id)}`);
        if(latest[0]?.status==='generating') {
          const retry=(c.generation_attempts||1)<3;
          await updateComment(c.comment_id,{status:'failed',error:(e instanceof Error?e.message:'生成失敗')+(retry?'。5分後に再生成します':'。再試行の上限です。設定を確認してください'),next_attempt_at:retry?new Date(Date.now()+300000).toISOString():null});
        }
        throw e;
      }
    }
    // Historical fan statistics are lower priority and keep their original cursors.
    let historyError='';
    if(!c&&new Date().getUTCMinutes()%5===0)try{await scan(s,me);}catch(e){historyError=e instanceof Error?e.message:'履歴の収集に失敗しました';}
    await updateSettings({last_run:new Date().toISOString(),last_error:historyError,ai_retry_at:null});
    return {status:c?'processed':'idle',checked};
  } catch(e) {await updateSettings({last_error:e instanceof Error?e.message:'処理失敗'}).catch(()=>{});throw e;}
  finally {await updateSettings({lease_until:null});}
}
Deno.serve(async request=>{
  if(request.method==='OPTIONS') return new Response('ok',{headers:cors});
  if(request.method!=='POST') return respond({error:'POSTのみ利用できます'},405);
  try {
    const body=await request.json();
    const secret=Deno.env.get('HANAKO_REPLY_CRON_SECRET') || Deno.env.get('HANAKO_CRON_SECRET');
    const isCron=Boolean(secret)&&request.headers.get('x-cron-secret')===secret;
    if(!isCron) await authenticate(request);
    if(isCron&&!['run','check'].includes(body.action)) return respond({error:'許可されていません'},403);
    if(body.action==='check') return respond(await checkConnections());
    if(['run','publish','retry'].includes(body.action)) return respond(await run(body.action,body));
    if(body.action==='key_save') {
      const profile=String(body.profile||'');
      if(!Object.hasOwn(GEMINI_CONNECTIONS,profile)) throw new Error('登録先を選択してください');
      const key=typeof body.key==='string'?body.key.trim():'';
      if(!/^AIza[A-Za-z0-9_-]{35}$/.test(key)) throw new Error('Google AI StudioのGemini APIキーを貼り付けてください');
      const current=await settings();
      if(current.ai_retry_at&&Date.parse(current.ai_retry_at)>Date.now()) throw new Error('利用上限による待機中はキーを変更できません。待機終了後に登録してください');
      if(!await db('rpc/hanako_reply_lock','POST',{owner_id:owner()})) throw new Error('返信処理中です。少し待ってから登録してください');
      try {
        const fresh=await settings();
        if(fresh.ai_retry_at&&Date.parse(fresh.ai_retry_at)>Date.now()) throw new Error('利用上限による待機中はキーを変更できません。待機終了後に登録してください');
        await db('rpc/hanako_gemini_key_save','POST',{owner_id:owner(),profile,key_value:key});
      }
      finally {await updateSettings({lease_until:null});}
      const registered=await connections();
      if(!registered.find(x=>x.id===profile)?.configured) throw new Error('キーの保存結果を確認できませんでした。登録状態を確認してください');
      return respond({saved:true,connections:registered});
    }
    if(body.action==='key_status') return respond({connections:await connections()});
    if(body.action==='load') {const current=await settings();return respond({settings:current,queue_count:await queueCount(),connections:await connections(),fans:await db('rpc/hanako_reply_fans','POST',{owner_id:owner()}),
      replies:await db(`hanako_reply_comments?${filter()}&status=neq.history&order=commented_at.desc&limit=100`),
      connected:Boolean(Deno.env.get('THREADS_ACCESS_TOKEN')&&Deno.env.get('THREADS_USER_ID')&&await aiConfigured(current))});}
    if(body.action==='save') { const value:any=validateSettings(body.settings); const current=await settings();
      if(value.ai_connection && value.ai_connection!==(current.ai_connection||'default')) {
        if(!await aiConfigured({...current,...value})) throw new Error('選択したGemini接続のAPIキーを登録してください');
        if(current.ai_retry_at&&Date.parse(current.ai_retry_at)>Date.now()) throw new Error('利用上限による待機中は接続を切り替えられません。待機終了後に変更してください');
      }
      await updateSettings(value); if(value.ng_users!==undefined||value.ng_words!==undefined)await db('rpc/hanako_reply_apply_exclusions','POST',{owner_id:owner()}); return respond({saved:true}); }
    if(body.action==='history') {
      const offset=Math.max(0,Math.min(100000,Number(body.offset)||0));
      return respond({history:await db(`hanako_reply_comments?${filter()}&username=eq.${encodeURIComponent(String(body.username))}&order=commented_at.desc&limit=50&offset=${Math.floor(offset)}`)});
    }
    return respond({error:'操作が不正です'},400);
  } catch(e) {return respond({error:e instanceof Error?e.message:'処理に失敗しました'},400);}
});

