import { inWindow, validateSettings, TONES } from '../../../reply-rules.mjs';
import { HANA_PROMPT } from './prompt.ts';
const env = (name: string) => { const value=Deno.env.get(name); if(!value) throw new Error(`サーバー設定 ${name} が必要です`); return value; };
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization,apikey,content-type', 'Access-Control-Allow-Methods': 'POST,OPTIONS' };
const owner = () => env('HANAKO_OWNER_USER_ID');
const filter = () => `user_id=eq.${encodeURIComponent(owner())}`;
const respond = (body: unknown,status=200) => new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
async function api(url: string, options: RequestInit, label: string) {
  const response=await fetch(url,{...options,signal:AbortSignal.timeout(45000)});
  const body=await response.json();
  if(!response.ok||body?.error) throw new Error(`${label}: HTTP ${response.status}。権限・期限・利用上限を確認してください`);
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
async function generate(s: any,c: any) {
  const history=s.use_history ? await db(`hanako_reply_comments?${filter()}&username=eq.${encodeURIComponent(c.username)}&comment_id=neq.${encodeURIComponent(c.comment_id)}&order=commented_at.desc&limit=20&select=comment_text,reply_text,post_text,commented_at`) : [];
  const parent=c.parent_id ? await db(`hanako_reply_comments?${filter()}&comment_id=eq.${encodeURIComponent(c.parent_id)}&select=comment_text,reply_text`) : [];
  const response=await api('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${env('OPENAI_API_KEY')}`,'Content-Type':'application/json'},body:JSON.stringify({
    model:Deno.env.get('OPENAI_REPLY_MODEL')||'gpt-6-astra',store:false,
    instructions:`${HANA_PROMPT}\n選択されたテンション: ${s.tones.map((x:string)=>TONES[x]).join('、')}。${s.adapt_tone?'この範囲で相手に合わせる。':'選択された口調を優先する。'}\n最大${s.max_chars}文字。\n所有者の追加設定:\n${s.custom_prompt}`,
    input:JSON.stringify({post:c.post_text,comment:c.comment_text||'(テキストなし。内容を憶測しない)',parent,history:history.reverse()})
  })},'AI返信生成');
  if(response.status!=='completed') throw new Error('AIの生成が未完了です');
  const text=(response.output||[]).filter((x:any)=>x.type==='message').flatMap((x:any)=>x.content||[]).filter((x:any)=>x.type==='output_text').map((x:any)=>x.text).join('').trim();
  if(!text||[...text].length>s.max_chars||/```|@|\S+さん/.test(text)) throw new Error('返信形式を確認してください');
  return text;
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
      status:!isOwner&&Date.parse(c.timestamp)>=Date.parse(s.started_at)?'pending':'history'};
  });
  if(rows.length) await db('hanako_reply_comments?on_conflict=user_id,comment_id','POST',rows,'resolution=ignore-duplicates,return=representation');
  const after=page.paging?.next?page.paging?.cursors?.after:null;
  if(!after) posts.shift();
  await updateSettings({scan_posts:posts,scan_comment_after:after,scan_after:next});
}
async function publish(c: any) {
  // Write publishing before any external write. Never automatically retry an uncertain result.
  await updateComment(c.comment_id,{status:'publishing',error:''});
  try {
    const container=await meta('me/threads',{media_type:'TEXT',text:c.reply_text,reply_to_id:c.comment_id},'POST');
    if(!container.id) throw new Error('ThreadsコンテナIDがありません');
    await updateComment(c.comment_id,{container_id:container.id});
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
      await updateComment(rows[0].comment_id,{status:'pending',error:''}); return {status:'pending'};
    }
    if(!s.enabled) return {status:'off'};
    const me=await checkThreadsOwner();
    await scan(s,me);
    if(!inWindow(s)) {await updateSettings({last_run:new Date().toISOString(),last_error:''}); return {status:'outside_window'};}
    const c=await db('rpc/hanako_reply_claim','POST',{owner_id:owner()});
    if(c) {
      try {
        const text=await generate(s,c);
        await updateComment(c.comment_id,{status:'draft',reply_text:text,error:''});
        // Re-read after generation so OFF and changed hours take effect before posting.
        const fresh=await settings();
        if(fresh.enabled&&fresh.mode==='auto'&&inWindow(fresh)) await publish({...c,reply_text:text});
      } catch(e) {
        const latest=await db(`hanako_reply_comments?${filter()}&comment_id=eq.${encodeURIComponent(c.comment_id)}`);
        if(latest[0]?.status==='generating') await updateComment(c.comment_id,{status:'failed',error:e instanceof Error?e.message:'生成失敗'});
        throw e;
      }
    }
    await updateSettings({last_run:new Date().toISOString(),last_error:''});
    return {status:c?'processed':'idle'};
  } catch(e) {await updateSettings({last_error:e instanceof Error?e.message:'処理失敗'}).catch(()=>{});throw e;}
  finally {await updateSettings({lease_until:null});}
}
Deno.serve(async request=>{
  if(request.method==='OPTIONS') return new Response('ok',{headers:cors});
  if(request.method!=='POST') return respond({error:'POSTのみ利用できます'},405);
  try {
    const body=await request.json();
    const secret=Deno.env.get('HANAKO_REPLY_CRON_SECRET');
    const isCron=Boolean(secret)&&request.headers.get('x-cron-secret')===secret;
    if(!isCron) await authenticate(request);
    if(isCron&&body.action!=='run') return respond({error:'許可されていません'},403);
    if(['run','publish','retry'].includes(body.action)) return respond(await run(body.action,body));
    if(body.action==='load') return respond({settings:await settings(),fans:await db('rpc/hanako_reply_fans','POST',{owner_id:owner()}),
      replies:await db(`hanako_reply_comments?${filter()}&status=neq.history&order=commented_at.desc&limit=100`),
      connected:Boolean(Deno.env.get('THREADS_ACCESS_TOKEN')&&Deno.env.get('THREADS_USER_ID')&&Deno.env.get('OPENAI_API_KEY'))});
    if(body.action==='save') { const value=validateSettings(body.settings); await settings(); await updateSettings(value); return respond({saved:true}); }
    if(body.action==='history') {
      const offset=Math.max(0,Math.min(100000,Number(body.offset)||0));
      return respond({history:await db(`hanako_reply_comments?${filter()}&username=eq.${encodeURIComponent(String(body.username))}&order=commented_at.desc&limit=50&offset=${Math.floor(offset)}`)});
    }
    return respond({error:'操作が不正です'},400);
  } catch(e) {return respond({error:e instanceof Error?e.message:'処理に失敗しました'},400);}
});
