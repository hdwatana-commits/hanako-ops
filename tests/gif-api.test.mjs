import test from 'node:test';import assert from 'node:assert/strict';
let handler;const env={SUPABASE_URL:'https://db.test',SUPABASE_ANON_KEY:'anon',SUPABASE_SERVICE_ROLE_KEY:'service',HANAKO_OWNER_USER_ID:'owner',HANAKO_REPLY_CRON_SECRET:'cron',THREADS_USER_ID:'threads-owner',THREADS_ACCESS_TOKEN:'test-threads-token',OPENAI_API_KEY:'sk-test',REPLY_AI_PROVIDER:'openai'};
globalThis.Deno={env:{get:key=>env[key]},serve:fn=>handler=fn};
await import('../supabase/functions/threads-replies/index.ts');
const response=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
const invoke=(body,headers={})=>handler(new Request('https://fn.test',{method:'POST',headers:{Authorization:'Bearer owner','Content-Type':'application/json',...headers},body:JSON.stringify(body)}));
const catalog=(scene='affection')=>({enabled:true,rate:100,emoji_enabled:true,items:[{scene,gif_id:'Alpha123',label:'A',enabled:true},{scene,gif_id:'Beta234',label:'B',enabled:true}]});
function fixture({scenario='success',emoji=true,wait=false,latestOnly=false,latest=true,recover=false,video=false}={}){
 let c={comment_id:'gif-current',post_id:'test-post',username:'guest',comment_text:emoji?'💕':'ありがとう！',status:'pending',commented_at:new Date().toISOString()},s={enabled:true,mode:'auto',start_time:'00:00',end_time:'00:00',weekdays:[0,1,2,3,4,5,6],tones:['cute'],adapt_tone:true,max_chars:180,use_history:false,custom_prompt:'',ai_provider:'openai',openai_ready:!wait,gif_reply:catalog(emoji?'affection':'thanks')};
 s.gif_reply.latest_post_only=latestOnly;s.gif_reply.video_mode=video;
 if(recover)c={...c,status:'uncertain',container_id:'container-saved',reply_text:'💕',reply_gif:{...s.gif_reply.items[0],provider:'GIPHY'}};
 const created=[],published=[];let aiCalls=0,stateReads=0,postAdvanced=!latest;
 globalThis.fetch=async(url,opts={})=>{
  url=String(url);const parsed=new URL(url),body=typeof opts.body==='string'?JSON.parse(opts.body):{};
  if(url.includes('auth/v1/user'))return response({id:opts.headers.Authorization==='Bearer other'?'other':'owner'});
  if(url.includes('/rpc/hanako_reply_lock'))return response(true);
  if(url.includes('/rpc/hanako_openai_key_read'))return response('sk-test');
  if(url.includes('/rpc/hanako_reply_claim')){c={...c,status:'generating'};return response(c);}
  if(url.includes('/hanako_reply_settings')){if(opts.method==='PATCH')s={...s,...body};return response([s]);}
  if(url.includes('/hanako_fan_profiles'))return response([]);
  if(url.includes('/rpc/hanako_instagram_available')||url.includes('/rpc/hanako_note_available'))return response(true);
  if(url.includes('/rpc/hanako_reply_gif_usage')){assert.equal(opts.method,'POST');assert.deepEqual(body,{owner_id:'owner',fan_username:'guest'});return response({last_gif_id:'Alpha123',usage:[{gif_id:'Alpha123',uses:1,last_used_at:'2026-01-01T00:00:00Z'}]});}
  if(url.includes('limit=1&select=reply_gif')){assert.match(url,/user_id=eq.owner&is_owner=eq.false&status=eq.published/);assert.doesNotMatch(url,/username=|reply_gif=not.is.null/);return response(scenario==='global-repeat'?[{reply_gif:{gif_id:'Beta234'}}]:[]);}
  if(url.includes('/hanako_reply_comments')){if(opts.method==='PATCH'){if(!url.includes('status=in.')&&(!url.includes('status=eq.')||new URL(url).searchParams.get('status')==='eq.'+c.status))c={...c,...body};return response([]);}return response(url.includes('status=eq.publishing')?(c.status==='publishing'?[c]:[]):url.includes('status=eq.uncertain')?(c.status==='uncertain'?[c]:[]):url.includes('reply_due_at=lte.')?[c]:[]);}
  if(parsed.pathname==='/v1.0/me')return response({id:'threads-owner',username:'hana'});
  if(parsed.pathname==='/v1.0/me/threads'&&opts.method!=='POST')return response({data:[{id:'owner-reply',is_reply:true},...(postAdvanced?[{id:'new-post',text:'新しい写真'}]:[]),{id:'test-post',text:'今日の写真'}]});
  if(parsed.pathname.endsWith('/replies')||parsed.pathname.endsWith('/conversation'))return response({data:scenario==='manual-replied'?[{is_reply_owned_by_me:true}]:created.some(p=>p.auto_publish_text==='true')?[{id:'direct-published',is_reply_owned_by_me:true,gif_url:'https://i.giphy.com/media/Alpha123/giphy.gif',text:'💕'}]:[]});
  if(parsed.pathname==='/v1.0/me/threads'&&opts.method==='POST'){
   const params=Object.fromEntries(opts.body);created.push(params);
   if(scenario==='reject'&&params.gif_attachment)return response({error:{code:100}},400);
   return response({id:'container-'+created.length});
  }
  if(parsed.pathname.startsWith('/v1.0/container-')){stateReads++;if(scenario==='new-post')postAdvanced=true;if(scenario==='enable-latest'){postAdvanced=true;s.gif_reply.latest_post_only=true;}if(scenario==='disable')s={...s,gif_reply:{...s.gif_reply,enabled:false}};return response({status:scenario==='video-processing'&&stateReads===1?'IN_PROGRESS':scenario==='already-published'?'PUBLISHED':scenario==='prepare-reject'&&created.length===1?'ERROR':'FINISHED'});}
  if(parsed.pathname==='/v1.0/me/threads_publish'){published.push(opts.body.get('creation_id'));if(scenario==='uncertain')throw Error('Connection lost');if(scenario==='publish-500')return response({error:{code:1,error_subcode:99,message:'Failure '+env.THREADS_ACCESS_TOKEN}},500);return response({id:'published'});}
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
 const saved=await invoke({action:'gif_save',settings:{...config,latest_post_only:true}});assert.equal(saved.status,200);assert.equal((await saved.json()).settings.latest_post_only,true);assert.equal(f.settings.gif_reply.latest_post_only,true);
 assert.equal((await invoke({action:'gif_save',settings:{...config,latest_post_only:'true'}})).status,400);assert.equal(f.settings.gif_reply.latest_post_only,true);
 const off=await invoke({action:'gif_save',settings:{...config,latest_post_only:false}});assert.equal(off.status,200);assert.equal(f.settings.gif_reply.latest_post_only,false);
});
test('1場面30件の保存を受け付け、31件を保存しない',async()=>{
 const f=fixture(),base=catalog(),items=Array.from({length:30},(_,i)=>({...base.items[0],gif_id:'Registered'+i}));
 let r=await invoke({action:'gif_save',settings:{...base,items}});assert.equal(r.status,200);assert.equal(f.settings.gif_reply.items.length,30);
 r=await invoke({action:'gif_save',settings:{...base,items:[...items,{...items[0],gif_id:'Overflow'}]}});assert.equal(r.status,400);assert.equal(f.settings.gif_reply.items.length,30);
});
test('AI上限の待機中も絵文字にはAIなしで、直前と別のGIFを添えて1回だけ返信する',async()=>{
 const f=fixture({wait:true});const result=await invoke({action:'run'});assert.equal(result.status,200,JSON.stringify(await result.json()));
 assert.equal(f.aiCalls,0);assert.equal(f.created.length,1);assert.equal(f.published.length,1);assert.equal(f.comment.status,'published');assert.equal(f.comment.reply_gif.gif_id,'Beta234');
 assert.deepEqual(JSON.parse(f.created[0].gif_attachment),{gif_id:'Beta234',provider:'GIPHY'});assert.equal(f.created[0].reply_to_id,'gif-current');assert.ok(f.created[0].text);
});
test('文字のあるコメントでは通常のAI返信にGIFを添え、GIF選択のためにAIを追加しない',async()=>{
 const f=fixture({emoji:false});const result=await invoke({action:'run'});assert.equal(result.status,200,JSON.stringify(await result.json()));assert.equal(f.aiCalls,1);assert.equal(f.published.length,1);assert.equal(f.comment.reply_gif.scene,'thanks');assert.equal(f.created[0].text,'こちらこそありがとう☺️');assert.ok(f.created[0].gif_attachment);
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
test('個人の前回分とアカウント直前分で候補を使い切る場合はGIFを重ねず1回返信する',async()=>{
 const f=fixture({scenario:'global-repeat'});const r=await invoke({action:'run'});assert.equal(r.status,200,JSON.stringify(await r.json()));assert.equal(f.created.length,1);assert.equal(f.created[0].gif_attachment,undefined);assert.equal(f.comment.reply_gif,null);assert.equal(f.published.length,1);assert.equal(f.aiCalls,0);
});

test('最新ポスト限定は返信投稿を数えず、最新の通常ポストにだけGIFを添える',async()=>{
 const f=fixture({latestOnly:true});const r=await invoke({action:'run'});assert.equal(r.status,200,JSON.stringify(await r.json()));assert.ok(f.created[0].gif_attachment);assert.equal(f.published.length,1);
});
test('最新ポスト限定でも古い対象ポストには文章・絵文字で返信し、OFFならGIFを添える',async()=>{
 for(const emoji of [true,false]){
  const f=fixture({latestOnly:true,latest:false,emoji});const r=await invoke({action:'run'});assert.equal(r.status,200,JSON.stringify(await r.json()));assert.equal(f.created.length,1);assert.equal(f.created[0].gif_attachment,undefined);assert.ok(f.created[0].text);assert.equal(f.comment.reply_gif,null);assert.equal(f.published.length,1);assert.equal(f.aiCalls,emoji?0:1);
 }
 const f=fixture({latestOnly:false,latest:false});const r=await invoke({action:'run'});assert.equal(r.status,200,JSON.stringify(await r.json()));assert.ok(f.created[0].gif_attachment);assert.equal(f.published.length,1);
});
test('GIF準備中の新規ポストや限定ONで対象が変わったらGIFを公開せず文章だけを1回返信する',async()=>{
 for(const scenario of ['new-post','enable-latest']){
  const f=fixture({scenario,latestOnly:scenario==='new-post'});const r=await invoke({action:'run'});assert.equal(r.status,200,JSON.stringify(await r.json()));assert.equal(f.created.length,2);assert.ok(f.created[0].gif_attachment);assert.equal(f.created[1].gif_attachment,undefined);assert.deepEqual(f.published,['container-2']);assert.equal(f.comment.reply_gif,null);
 }
});

test('未公開を確認したGIFだけ既存コンテナで復旧し、2回目は何も公開しない',async()=>{
 const f=fixture({recover:true});let r=await invoke({action:'gif_recover'});assert.equal(r.status,200,JSON.stringify(await r.json()));assert.equal(f.created.length,0);assert.deepEqual(f.published,['container-saved']);assert.equal(f.comment.status,'published');
 r=await invoke({action:'gif_recover'});assert.equal(r.status,200);assert.deepEqual(f.published,['container-saved']);
});
test('公開済みのコンテナ・手動返信済みの相手・所有者以外ではGIFを再送しない',async()=>{
 for(const scenario of ['already-published','manual-replied']){const f=fixture({recover:true,scenario});const r=await invoke({action:'gif_recover'});assert.equal(r.status,200,JSON.stringify(await r.json()));assert.equal(f.published.length,0);assert.equal(f.created.length,0);}
 const f=fixture({recover:true});const r=await invoke({action:'gif_recover'},{Authorization:'Bearer other'});assert.equal(r.status,400);assert.equal(f.published.length,0);
});
test('GIF公開500の工程とコードを保存し、認証情報を除外し、自動で再送しない',async()=>{
 const f=fixture({scenario:'publish-500'});const r=await invoke({action:'run'});assert.equal(r.status,400);assert.equal(f.comment.status,'uncertain');assert.match(f.comment.error,/HTTP 500/);assert.match(f.comment.error,/code 1/);assert.match(f.comment.error,/POST me\/threads_publish/);assert.equal(f.comment.error.includes(env.THREADS_ACCESS_TOKEN),false);assert.equal(f.published.length,1);
});

test('動画方式は登録GIFの固定MP4 URLを使い、文章と動画を1回だけ公開して履歴に記録する',async()=>{
 const f=fixture({video:true});const r=await invoke({action:'run'});assert.equal(r.status,200,JSON.stringify(await r.json()));assert.equal(f.created.length,1);assert.equal(f.created[0].media_type,'VIDEO');assert.equal(f.created[0].video_url,'https://media.giphy.com/media/Beta234/giphy.mp4');assert.equal(f.created[0].gif_attachment,undefined);assert.ok(f.created[0].text);assert.equal(f.published.length,1);assert.equal(f.comment.reply_gif.delivery,'video');assert.equal(f.aiCalls,0);
});
test('GIFの未公開を確認して動画方式へ復旧すると古いGIFコンテナを使わず、動画だけを1回公開する',async()=>{
 const f=fixture({video:true,recover:true});const r=await invoke({action:'gif_recover'});assert.equal(r.status,200,JSON.stringify(await r.json()));assert.equal(f.created.length,1);assert.equal(f.created[0].media_type,'VIDEO');assert.deepEqual(f.published,['container-1']);assert.equal(f.comment.status,'published');assert.equal(f.comment.reply_gif.delivery,'video');
});

test('動画の準備が次の実行まで続いてもコンテナを作り直さず、準備完了後に1回だけ公開する',async()=>{
 const f=fixture({video:true,scenario:'video-processing'});let r=await invoke({action:'run'});assert.equal(r.status,200,JSON.stringify(await r.json()));assert.equal(f.comment.status,'publishing');assert.match(f.comment.error,/準備中/);assert.equal(f.created.length,1);assert.equal(f.published.length,0);
 r=await invoke({action:'run'});assert.equal(r.status,200,JSON.stringify(await r.json()));assert.equal(f.created.length,1);assert.deepEqual(f.published,['container-1']);assert.equal(f.comment.status,'published');assert.equal(f.aiCalls,0);
});
