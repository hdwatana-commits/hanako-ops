import test from 'node:test';
import assert from 'node:assert/strict';
let handler;
const env={SUPABASE_URL:'https://db.test',SUPABASE_ANON_KEY:'anon',SUPABASE_SERVICE_ROLE_KEY:'service',HANAKO_OWNER_USER_ID:'owner',HANAKO_REPLY_CRON_SECRET:'cron',THREADS_USER_ID:'threads-owner',THREADS_ACCESS_TOKEN:'test-token',OPENAI_API_KEY:'sk-test',REPLY_AI_PROVIDER:'openai'};
globalThis.Deno={env:{get:k=>env[k]},serve:fn=>handler=fn};
await import('../supabase/functions/threads-replies/index.ts');
const response=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
const invoke=body=>handler(new Request('https://fn.test',{method:'POST',headers:{Authorization:'Bearer owner','Content-Type':'application/json'},body:JSON.stringify(body)}));
const ago=ms=>new Date(Date.now()-ms).toISOString();
const row=(id,extra={})=>({comment_id:id,post_id:'post',username:'guest'+id,comment_text:'💕',commented_at:ago(600000),created_at:ago(600000),reply_due_at:ago(500000),status:'pending',generation_attempts:0,is_owner:false,...extra});
function fixture(initial,{manual=[],waitFirst=false,rejectVideo=false,preflightFailure=false,failGeneration=false,stopDuringPrepare=false}={}){
 const rows=initial.map(r=>structuredClone(r)),containers=[],published=[],reads=new Map();let aiCalls=0;
 let s={enabled:true,mode:'auto',start_time:'00:00',end_time:'00:00',weekdays:[0,1,2,3,4,5,6],tones:['cute'],adapt_tone:true,max_chars:180,use_history:false,custom_prompt:'',ai_provider:'openai',openai_ready:true,started_at:ago(86400000),post_limit:2,gif_reply:{enabled:true,rate:100,emoji_enabled:true,video_mode:true,items:['Alpha123','Beta234','Gamma345','Delta456'].map(gif_id=>({scene:'reaction',gif_id,label:gif_id,enabled:true}))}};
 function match(r,q){
  for(const k of ['comment_id','status','post_id','container_id','reply_id','is_owner','reply_automatic','error']){
   const v=q.get(k);if(!v)continue;
   if(v==='is.null'&&r[k]!=null)return false;if(v==='not.is.null'&&r[k]==null)return false;
   if(v.startsWith('eq.')&&String(r[k]??'')!==v.slice(3))return false;
   if(v.startsWith('neq.')&&String(r[k]??'')===v.slice(4))return false;
   if(v.startsWith('in.(')&&!v.slice(4,-1).split(',').includes(String(r[k])))return false;
   if(v.startsWith('not.in.(')&&v.slice(8,-1).split(',').includes(String(r[k])))return false;
  }
  if(q.get('reply_gif')==='not.is.null'&&!r.reply_gif)return false;
  if(q.get('next_attempt_at')?.startsWith('lte.')&&(!r.next_attempt_at||Date.parse(r.next_attempt_at)>Date.now()))return false;
  if(q.has('or')&&q.get('or').includes('status.eq.pending')&&!(r.status==='pending'||(r.status==='failed'&&r.generation_attempts<3&&Date.parse(r.next_attempt_at)<=Date.now())))return false;
  return true;
 }
 globalThis.fetch=async(url,opts={})=>{
  const u=new URL(String(url)),q=u.searchParams,p=u.pathname,b=typeof opts.body==='string'?JSON.parse(opts.body):{};
  if(p==='/auth/v1/user')return response({id:'owner'});
  if(p.endsWith('/hanako_reply_settings')){if(opts.method==='PATCH')s={...s,...b};return response([s]);}
  if(p.endsWith('/rpc/hanako_reply_lock'))return response(true);
  if(p.endsWith('/rpc/hanako_reply_claim')){
   const c=rows.find(r=>!r.container_id&&!r.reply_id&&(r.status==='pending'||r.status==='failed'&&r.generation_attempts<3&&Date.parse(r.next_attempt_at)<=Date.now()));
   if(!c)return response(null);c.status='generating';c.generation_attempts++;return response(c);
  }
  if(p.endsWith('/rpc/hanako_reply_gif_usage'))return response({usage:[],last_gif_id:null});
  if(p.includes('/rpc/hanako_note_')||p.includes('/rpc/hanako_instagram_'))return response(true);
  if(p.endsWith('/rpc/hanako_openai_key_read'))return response('sk-test');
  if(p.endsWith('/hanako_fan_profiles'))return response([]);
  if(p.endsWith('/hanako_reply_comments')){
   if(opts.method==='POST')return response([]);
   let found=rows.filter(r=>match(r,q));
   if(opts.method==='PATCH'){found.forEach(r=>Object.assign(r,b));return response(found);}
   if(q.get('select')?.includes('reply_text')&&!q.get('select').includes('status')&&!q.get('select').includes('reply_gif'))return response([]);
   if(q.get('order')?.startsWith('reply_published_at'))found.sort((a,b)=>Date.parse(b.reply_published_at||0)-Date.parse(a.reply_published_at||0));
   return response(found.slice(0,Number(q.get('limit'))||100));
  }
  if(p==='/v1.0/me')return response({id:'threads-owner',username:'hana'});
  if(p==='/v1.0/me/threads'&&opts.method!=='POST')return response({data:[{id:'post',text:'好きなことを話そう'}]});
  if(p.endsWith('/conversation'))return response({data:[]});
  if(p.endsWith('/replies')){
   const id=p.split('/').at(-2),n=(reads.get(id)||0)+1;reads.set(id,n);
   if(preflightFailure&&n===2)return response({error:{code:2,message:'Temporary read failure'}},500);
   return response({data:manual.includes(id)?[{id:'manual',is_reply_owned_by_me:true}]:[]});
  }
  if(p==='/v1.0/me/threads'&&opts.method==='POST'){
   const args=Object.fromEntries(opts.body);containers.push(args);
   if(rejectVideo&&args.media_type==='VIDEO')return response({error:{code:100,message:'Bad media'}},400);
   return response({id:'container-'+containers.length});
  }
  if(p.startsWith('/v1.0/container-')){if(stopDuringPrepare)s.enabled=false;const n=(reads.get(p)||0)+1;reads.set(p,n);return response({status:waitFirst&&p.endsWith('-1')&&n===1?'IN_PROGRESS':'FINISHED'});}
  if(p==='/v1.0/me/threads_publish'){const id=opts.body.get('creation_id');published.push(id);return response({id:'reply-'+id});}
  if(u.hostname==='api.openai.com'){aiCalls++;const input=JSON.parse(b.input);return response({status:'completed',output:[{type:'message',content:[{type:'output_text',text:failGeneration&&input.current_comment==='失敗するコメント'?'会いたいよ':'桃が好きだよ☺️'}]}]});}
  throw Error('Unexpected request '+p+'?'+q);
 };
 return {rows,containers,published,get aiCalls(){return aiCalls},get settings(){return s}};
}
test('1回で複数人に返し、同じコメントは同じ実行内で再処理しない',async()=>{
 const f=fixture([row('a'),row('b'),row('c')]);const r=await invoke({action:'run'});assert.equal(r.status,200,JSON.stringify(await r.json()));assert.equal(f.published.length,3);assert.equal(new Set(f.containers.map(c=>c.reply_to_id)).size,3);assert.equal(f.aiCalls,0);assert.ok(f.rows.every(r=>r.status==='published'&&r.reply_gif.delivery==='video'));
});
test('1人の生成が失敗しても次の人への返信を止めない',async()=>{
 const f=fixture([row('a',{comment_text:'失敗するコメント'}),row('b'),row('c')],{failGeneration:true});const r=await invoke({action:'run'});assert.equal(r.status,200,JSON.stringify(await r.json()));assert.equal(f.rows[0].status,'failed');assert.ok(f.rows[0].next_attempt_at);assert.equal(f.published.length,2);assert.equal(f.aiCalls,3);
});
test('動画の準備待ちで他の人を止めず、次回は同じコンテナを一度だけ公開する',async()=>{
 const f=fixture([row('a'),row('b')],{waitFirst:true});let r=await invoke({action:'run'});assert.equal(r.status,200,JSON.stringify(await r.json()));assert.equal(f.rows[0].status,'publishing');assert.equal(f.rows[1].status,'published');assert.equal(f.containers.length,2);
 r=await invoke({action:'run'});assert.equal(r.status,200,JSON.stringify(await r.json()));assert.equal(f.containers.length,2);assert.equal(f.published.length,2);assert.equal(new Set(f.published).size,2);
});
test('手動返信した相手は飛ばして次の人へ進む',async()=>{
 const f=fixture([row('a'),row('b')],{manual:['a']});const r=await invoke({action:'run'});assert.equal(r.status,200,JSON.stringify(await r.json()));assert.equal(f.rows[0].status,'skipped');assert.equal(f.published.length,1);assert.equal(f.containers[0].reply_to_id,'b');
});
test('場面の単語がない普通の文章にも、100%設定ならその他リアクションの動画を添える',async()=>{
 const f=fixture([row('a',{comment_text:'好きな果物は？'})]);const r=await invoke({action:'run'});assert.equal(r.status,200,JSON.stringify(await r.json()));assert.equal(f.containers[0].media_type,'VIDEO');assert.equal(f.rows[0].reply_gif.scene,'reaction');assert.ok(f.rows[0].reply_runtime.media_expected);
});
test('動画400では文章だけを公開せず、別の素材で再試行し、失敗上限を画面に残す',async()=>{
 const f=fixture([row('a')],{rejectVideo:true});let r=await invoke({action:'run'});assert.equal(r.status,200,JSON.stringify(await r.json()));assert.equal(f.rows[0].status,'draft');assert.equal(f.published.length,0);
 for(let n=0;n<2;n++){f.rows[0].next_attempt_at=ago(1000);r=await invoke({action:'run'});assert.equal(r.status,200,JSON.stringify(await r.json()));}
 assert.equal(f.rows[0].status,'failed');assert.equal(f.rows[0].next_attempt_at,null);assert.equal(f.containers.length,3);assert.ok(f.containers.every(c=>c.media_type==='VIDEO'));assert.equal(new Set(f.containers.map(c=>c.video_url)).size,3);assert.equal(f.published.length,0);assert.equal(f.aiCalls,0);
});
test('生成後・投稿前の失敗で自動返信が下書きのまま放置されない',async()=>{
 const f=fixture([row('a')],{preflightFailure:true});const r=await invoke({action:'run'});assert.equal(r.status,400);assert.equal(f.rows[0].status,'failed');assert.ok(f.rows[0].next_attempt_at);assert.equal(f.containers.length,0);assert.equal(f.published.length,0);
});
test('中断した自動処理だけを再開し、手動の下書きは自動公開しない',async()=>{
 const f=fixture([row('auto',{status:'draft',reply_automatic:true,reply_runtime:{started_at:ago(600000)},reply_text:'💕'}),row('manual',{status:'draft',reply_automatic:false,reply_text:'手書きの下書き'})]);const r=await invoke({action:'run'});assert.equal(r.status,200,JSON.stringify(await r.json()));assert.equal(f.rows[0].status,'published');assert.equal(f.rows[1].status,'draft');assert.equal(f.published.length,1);
});

test('動画の準備中に全自動返信をオフへ変えたら公開せず待機へ戻す',async()=>{
 const f=fixture([row('a')],{stopDuringPrepare:true});const r=await invoke({action:'run'});assert.equal(r.status,200,JSON.stringify(await r.json()));assert.equal(f.published.length,0);assert.equal(f.rows[0].status,'pending');assert.equal(f.rows[0].container_id,null);
});
