import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
const source=readFileSync(new URL('../supabase/functions/instagram-audio/index.ts',import.meta.url),'utf8');
const audio={audio_id:'1234',title:'Test song',display_artist:'Artist',duration_in_ms:60000,download_url:'https://scontent.fbcdn.net/preview',on_platform_audio_preview_link:'https://www.instagram.com/reels/audio/1234/',is_ads_eligible:false};
function worker(overrides={}){
 let handler;const calls=[],objects=new Map();let published=0;
 const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'anon',SUPABASE_SERVICE_ROLE_KEY:'service-secret',HANAKO_OWNER_USER_ID:'owner',INSTAGRAM_ACCESS_TOKEN:overrides.noSecrets?'':'meta-secret',INSTAGRAM_USER_ID:overrides.noSecrets?'':'555'};
 const fetch=async(url,options={})=>{
  const u=new URL(url),p=u.pathname;calls.push({url:String(url),...options});
  if(p.startsWith('/rest/v1/hanako_ig_reply_settings')){if(options.method==='POST'){assert.equal(options.headers.Prefer,'resolution=merge-duplicates,return=representation');return Response.json([JSON.parse(options.body)]);}return Response.json(overrides.savedConfig?[overrides.savedConfig]:[]);}
  if(p==='/rest/v1/rpc/hanako_ig_token_read')return Response.json(overrides.savedToken||null);
  if(p==='/rest/v1/rpc/hanako_ig_token_save')return Response.json(true);
  if(p==='/auth/v1/user')return Response.json({id:overrides.nonOwner?'other':'owner'});
  if(u.hostname==='graph.facebook.com'){
   assert.equal(options.headers.Authorization,`Bearer ${overrides.savedToken||overrides.candidateToken||'meta-secret'}`);assert.equal(u.searchParams.has('access_token'),false);
   if(overrides.metaError)return Response.json({error:{code:200,message:'Permission denied'}},{status:403});
   if(p.endsWith('/ig_audio'))return Response.json({audio:[{...audio,...overrides.audio}]});
   if(p.endsWith('/55555'))return Response.json({id:'55555',username:'hanako'});
   if(p.endsWith('/1234'))return Response.json(audio);
   if(p.endsWith('/555/media'))return Response.json({id:'777'});
   if(p.endsWith('/777'))return Response.json({status_code:published?'PUBLISHED':'FINISHED'});
   if(p.endsWith('/555/media_publish')){published++;if(overrides.uncertain)throw Error('timeout');return Response.json({id:'888'});}
  }
  if(p.endsWith('/bucket/hanako-private-reels'))return Response.json({public:false});
  if(p.includes('/object/list/'))return Response.json([]);
  if(p.includes('/object/upload/sign/'))return Response.json({url:p.replace('/storage/v1','')+'?token=upload-token'});
  if(p.includes('/object/info/'))return Response.json({size:2000,content_type:'video/mp4'});
  if(p.includes('/object/sign/'))return Response.json({signedURL:p.replace('/storage/v1','')+'?token=video-token'});
  if(p.endsWith('/object/hanako-private-reels')&&options.method==='DELETE')return Response.json([]);
  if(p.includes('/object/authenticated/')){
   const key=p.replace('/object/authenticated/','/object/');return objects.has(key)?Response.json(objects.get(key)):Response.json({message:'not found'},{status:404});
  }
  if(p.includes('/object/hanako-private-reels/')&&['POST','PUT'].includes(options.method)){
   if(options.method==='POST'&&objects.has(p))return Response.json({message:'already exists'},{status:409});
   objects.set(p,JSON.parse(options.body));return Response.json({Key:p});
  }
  throw Error('unexpected '+p);
 };
 const context=vm.createContext({Deno:{env:{get:n=>env[n]||''},serve:fn=>handler=fn},fetch,URL,Response,Request,URLSearchParams,AbortSignal,crypto,Date,console});
 vm.runInContext(stripTypeScriptTypes(source,{mode:'transform'}),context);
 return {calls,request:async(body,token='user-token')=>{const r=await handler(new Request('https://example.supabase.co/functions/v1/instagram-audio',{method:'POST',headers:{...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body)}));return{status:r.status,data:await r.json()};}};
}
test('catalog requires validated owner; no unauthenticated or cross-user access',async()=>{
 const a=worker();assert.equal((await a.request({action:'search'},'')).status,401);assert.equal(a.calls.length,0);
 const b=worker({nonOwner:true});assert.equal((await b.request({action:'search'})).status,403);assert.equal(b.calls.length,1);
});
test('search uses official endpoint and search_query; normalizes preview metadata',async()=>{
 const w=worker();const result=await w.request({action:'search',query:'artist',audio_type:'music'});assert.equal(result.status,200);assert.equal(result.data.audio[0].artist,'Artist');assert.equal(result.data.audio[0].preview_url,audio.download_url);assert.equal(result.data.audio[0].is_ads_eligible,false);
 const call=w.calls.find(c=>c.url.includes('/ig_audio'));assert.equal(new URL(call.url).searchParams.get('search_query'),'artist');assert.equal(JSON.stringify(result).includes('meta-secret'),false);
});
test('unsafe preview URLs are removed and permission failures are actionable',async()=>{
 const w=worker({audio:{download_url:'https://evil.example/audio'}});assert.equal((await w.request({action:'search'})).data.audio[0].preview_url,null);
 const denied=await worker({metaError:true}).request({action:'search'});assert.equal(denied.data.code,'META_200');assert.match(denied.data.error,/Facebook/);
});
test('prepare issues private upload scoped to owner; no music embedding or early publish',async()=>{
 const w=worker();const result=await w.request({action:'prepare',audio_id:'1234',size:2000,duration:15});assert.equal(result.status,200);assert.match(result.data.upload_url,/storage\/v1\/object\/upload\/sign\/hanako-private-reels\/owner\//);assert.equal(w.calls.some(c=>c.url.includes('/media_publish')),false);
 assert.equal((await w.request({action:'jobStatus',job_id:'../../other'})).status,400);
 assert.equal((await w.request({action:'prepare',audio_id:'1234',size:50*1024*1024,duration:15})).status,400);
});
test('explicit publish attaches selected audio and repeated calls cannot create duplicates',async()=>{
 const w=worker();const prepared=await w.request({action:'prepare',audio_id:'1234',size:2000,duration:15});const job_id=prepared.data.job_id;
 const created=await w.request({action:'createReel',job_id,caption:'Hello'});assert.equal(created.status,200,JSON.stringify(created));
 const create=w.calls.find(c=>c.url.endsWith('/555/media'));const form=new URLSearchParams(create.body);assert.equal(form.get('media_type'),'REELS');assert.equal(JSON.parse(form.get('audio_configuration')).audio_id,'1234');assert.equal(form.has('audio_start_time'),false);
 assert.equal((await w.request({action:'publish',job_id})).status,400);
 assert.equal((await w.request({action:'publish',job_id,confirm:true})).data.state,'published');
 assert.equal((await w.request({action:'publish',job_id,confirm:true})).data.state,'published');
 assert.equal(w.calls.filter(c=>c.url.endsWith('/555/media_publish')).length,1);
});
test('ambiguous publish response leaves durable lock that prevents retries',async()=>{
 const w=worker({uncertain:true});const p=await w.request({action:'prepare',audio_id:'1234',size:2000,duration:15});const job_id=p.data.job_id;await w.request({action:'createReel',job_id});
 assert.equal((await w.request({action:'publish',job_id,confirm:true})).data.code,'META_UNCERTAIN');
 const next=await w.request({action:'publish',job_id,confirm:true});assert.equal(next.data.state,'published');assert.equal(w.calls.filter(c=>c.url.endsWith('/555/media_publish')).length,1);
});
test('missing credentials report setup guidance and never call Meta',async()=>{
 const w=worker({noSecrets:true});const result=await w.request({action:'search'});assert.equal(result.status,409);assert.equal(result.data.code,'INSTAGRAM_SETUP_REQUIRED');assert.equal(w.calls.some(c=>c.url.includes('graph.facebook.com')),false);
 const status=await w.request({action:'connectionStatus'});assert.equal(status.data.configured,false);
});
test('Vault connection is reused without server INSTAGRAM_USER_ID or token',async()=>{
 const w=worker({noSecrets:true,savedConfig:{account_id:'55555',api_host:'graph.facebook.com',graph_version:'v24.0'},savedToken:'saved-vault-token'});
 const result=await w.request({action:'search',query:'test'});assert.equal(result.status,200);assert.equal(new URL(w.calls.find(c=>c.url.includes('/ig_audio')).url).searchParams.get('user_id'),'55555');assert.equal(JSON.stringify(result).includes('saved-vault-token'),false);
});
test('Instagram Login connection is not misused with Facebook-only Audio API',async()=>{
 const w=worker({noSecrets:true,savedConfig:{account_id:'55555',api_host:'graph.instagram.com'},savedToken:'vault-token'});
 assert.equal((await w.request({action:'search'})).data.code,'FACEBOOK_LOGIN_REQUIRED');assert.equal(w.calls.some(c=>c.url.includes('graph.facebook.com')),false);
});
test('registration validates account and actual music access before encrypted saving',async()=>{
 const token='candidate-token-with-appropriate-permissions';const w=worker({noSecrets:true,candidateToken:token});const result=await w.request({action:'connect',account_id:'55555',token,graph_version:'v24.0'});
 assert.equal(result.status,200,JSON.stringify(result));assert.equal(result.data.music_access,true);assert.equal(JSON.stringify(result).includes(token),false);
 const paths=w.calls.map(c=>new URL(c.url).pathname);assert.ok(paths.findIndex(p=>p.endsWith('/ig_audio'))<paths.indexOf('/rest/v1/rpc/hanako_ig_token_save'));
});
test('failed music validation and active comment connections are never overwritten',async()=>{
 const token='candidate-token-with-appropriate-permissions';
 const denied=worker({noSecrets:true,metaError:true,candidateToken:token});assert.equal((await denied.request({action:'connect',account_id:'55555',token})).status,400);assert.equal(denied.calls.some(c=>c.url.includes('hanako_ig_token_save')),false);
 const active=worker({savedConfig:{enabled:true,account_id:'55555',api_host:'graph.facebook.com'},savedToken:token});assert.equal((await active.request({action:'connect',account_id:'55555',token})).data.code,'CONNECTION_IN_USE');assert.equal(active.calls.some(c=>c.url.includes('hanako_ig_token_save')),false);
});
