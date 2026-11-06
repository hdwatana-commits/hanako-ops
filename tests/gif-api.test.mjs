import test from 'node:test';import assert from 'node:assert/strict';
let handler;const env={SUPABASE_URL:'https://db.test',SUPABASE_ANON_KEY:'anon',SUPABASE_SERVICE_ROLE_KEY:'service',HANAKO_OWNER_USER_ID:'owner',HANAKO_REPLY_CRON_SECRET:'cron',THREADS_USER_ID:'threads-owner',THREADS_ACCESS_TOKEN:'test-threads-token',OPENAI_API_KEY:'sk-test',REPLY_AI_PROVIDER:'openai'};
globalThis.Deno={env:{get:key=>env[key]},serve:fn=>handler=fn};
await import('../supabase/functions/threads-replies/index.ts');
const response=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
const invoke=(body,headers={})=>handler(new Request('https://fn.test',{method:'POST',headers:{Authorization:'Bearer owner','Content-Type':'application/json',...headers},body:JSON.stringify(body)}));
const catalog=(scene='affection')=>({enabled:true,rate:100,emoji_enabled:true,items:[{scene,gif_id:'Alpha123',label:'A',enabled:true},{scene,gif_id:'Beta234',label:'B',enabled:true}]});
function fixture({scenario='success',emoji=true,wait=false}={}){
 let c={comment_id:'gif-current',post_id:'test-post',username:'guest',comment_text:emoji?'💕':'ありがとう！',status:'pending',commented_at:new Date().toISOString()},s={enabled:true,mode:'auto',start_time:'00:00',end_time:'00:00',weekdays:[0,1,2,3,4,5,6],tones:['cute'],adapt_tone:true,max_chars:180,use_history:false,custom_prompt:'',ai_provider:'openai',openai_ready:!wait,gif_reply:catalog(emoji?'affection':'thanks')};
 const created=[],published=[];let aiCalls=0;
 globalThis.fetch=async(url,opts={})=>{
  url=String(url);const parsed=new URL(url),body=typeof opts.body==='string'?JSON.parse(opts.body):{};
  if(url.includes('auth/v1/user'))return response({id:opts.headers.Authorization==='Bearer other'?'other':'owner'});
  if(url.includes('/rpc/hanako_reply_lock'))return response(true);
  if(url.includes('/rpc/hanako_openai_key_read'))return response('sk-test');
  if(url.includes('/rpc/hanako_reply_claim')){c={...c,status:'generating'};return response(c);}
  if(url.includes('/hanako_reply_settings')){if(opts.method==='PATCH')s={...s,...body};return response([s]);}
  if(url.includes('/hanako_fan_profiles'))return response([]);
  if(url.includes('/rpc/hanako_instagram_available')||url.includes('/rpc/hanako_note_available'))return response(true);
  if(url.includes('reply_gif=not.is.null')){assert.match(url,/user_id=eq.owner&username=eq.guest&is_owner=eq.false&status=eq.published/);assert.match(url,/reply_published_at=gte\./);return response([{reply_gif:{gif_id:'Alpha123'}}]);}
  if(url.includes('/hanako_reply_comments')){if(opts.method==='PATCH'){if(!url.includes('status=in.'))c={...c,...body};return response([]);}return response(url.includes('reply_due_at=lte.')?[c]:[]);}
  if(parsed.pathname==='/v1.0/me')return response({id:'threads-owner',username:'hana'});
  if(parsed.pathname==='/v1.0/me/threads'&&opts.method!=='POST')return response({data:[{id:'test-post',text:'今日の写真'}]});
  if(parsed.pathname.endsWith('/replies')||parsed.pathname.endsWith('/conversation'))return response({data:[]});
  if(parsed.pathname==='/v1.0/me/threads'&&opts.method==='POST'){
   const params=Object.fromEntries(opts.body);created.push(params);
   if(scenario==='reject'&&params.gif_attachment)return response({error:{code:100}},400);
   return response({id:'container-'+created.length});
  }
  if(parsed.pathname.startsWith('/v1.0/container-')){if(scenario==='disable')s={...s,gif_reply:{...s.gif_reply,enabled:false}};return response({status:scenario==='prepare-reject'&&created.length===1?'ERROR':'FINISHED'});}
  if(parsed.pathname==='/v1.0/me/threads_publish'){published.push(opts.body.get('creation_id'));if(scenario==='uncertain')throw Error('Connection lost');return response({id:'published'});}
  if(url.includes('api.openai.com')){aiCalls++;return response({status:'completed',output:[{type:'message',content:[{type:'output_text',text:'こちらこそありがとう☺️'}]}]});}
  throw Error('Unexpected request '+url);
 };
 return {get comment(){return c},get settings(){return s},get aiCalls(){return aiCalls},created,published};
}
test('GIF設定は所有者のみ保存でき、別の返信設定を変えず不正な入力を拒否する',async()=>{
 const f=fixture(),before=f.settings.enabled,config=catalog();
 assert.equal((await invoke({action:'gif_save',settings:config},{Authorization:'Bearer other'})).status,400);
 assert.equal((await invoke({action:'gif_save',settings:config},{'x-cron-secret':'cron'})).status,403);
 assert.equal((await invoke({action:'gif_save',settings:{...config,items:[{...config.items[0],gif_id:'javascript:bad'}]}})).status,400);
 const result=await invoke({action:'gif_save',settings:{...config,rate:30}});assert.equal(result.status,200);assert.equal((await result.json()).settings.rate,30);assert.equal(f.settings.enabled,before);assert.equal(f.settings.gif_reply.items.length,2);
});
test('AI上限の待機中も絵文字にはAIなしで、直前と別のGIFを添えて1回だけ返信する',async()=>{
 const f=fixture({wait:true});const result=await invoke({action:'run'});assert.equal(result.status,200,JSON.stringify(await result.json()));
 assert.equal(f.aiCalls,0);assert.equal(f.created.length,1);assert.equal(f.published.length,1);assert.equal(f.comment.status,'published');assert.equal(f.comment.reply_gif.gif_id,'Beta234');
 assert.deepEqual(JSON.parse(f.created[0].gif_attachment),{gif_id:'Beta234',provider:'GIPHY'});assert.equal(f.created[0].reply_to_id,'gif-current');assert.ok(f.created[0].text);
});
test('文字のあるコメントでは通常のAI返信にGIFを添え、GIF選択のためにAIを追加しない',async()=>{
 const f=fixture({emoji:false});const result=await invoke({action:'run'});assert.equal(result.status,200,JSON.stringify(await result.json()));assert.equal(f.aiCalls,1);assert.equal(f.published.length,1);assert.equal(f.comment.reply_gif.scene,'thanks');
});
test('GIFの準備が拒否されたら文章へ切り替え、投稿結果不明では再送しない',async()=>{
 const f=fixture({scenario:'reject'});let result=await invoke({action:'run'});assert.equal(result.status,200,JSON.stringify(await result.json()));assert.equal(f.created.length,2);assert.ok(f.created[0].gif_attachment);assert.equal(f.created[1].gif_attachment,undefined);assert.equal(f.published.length,1);assert.equal(f.comment.reply_gif,null);assert.match(f.comment.error,/文章・絵文字のみ/);
 const unknown=fixture({scenario:'uncertain'});result=await invoke({action:'run'});assert.equal(result.status,400);assert.equal(unknown.created.length,1);assert.equal(unknown.published.length,1);assert.equal(unknown.comment.status,'uncertain');
});
test('GIFの準備中にOFFへ変更されたら、そのGIFを公開せず文章のみを1回投稿する',async()=>{
 const f=fixture({scenario:'disable'});const result=await invoke({action:'run'});assert.equal(result.status,200,JSON.stringify(await result.json()));assert.equal(f.created.length,2);assert.ok(f.created[0].gif_attachment);assert.equal(f.created[1].gif_attachment,undefined);assert.deepEqual(f.published,['container-2']);assert.equal(f.comment.reply_gif,null);
});
test('GIFのコンテナ準備が失敗しても、未公開のGIFを放棄し文章だけを1回公開する',async()=>{
 const f=fixture({scenario:'prepare-reject'});const r=await invoke({action:'run'});assert.equal(r.status,200,JSON.stringify(await r.json()));assert.equal(f.created.length,2);assert.deepEqual(f.published,['container-2']);assert.equal(f.comment.reply_gif,null);assert.match(f.comment.error,/文章・絵文字のみ/);
});
