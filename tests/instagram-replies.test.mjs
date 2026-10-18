import test from 'node:test';import assert from 'node:assert/strict';
import {firstInstagramComments} from '../instagram-reply-rules.mjs';
import {instagramReplies} from '../supabase/functions/threads-replies/instagram.ts';
const me={id:'12345678',username:'hanako47258'};
const makeComment=(id,author='42',minutes=10)=>({id,from:{id:author,username:'guest'},text:'かわいい',timestamp:new Date(Date.now()-minutes*60000).toISOString()});
test('安定IDごとに最初を選び、返信・本人・ID不明を除外する',()=>{const old=makeComment('old','42',20),later=makeComment('later','42',10);assert.equal(firstInstagramComments([later,old],me)[0].id,'old');assert.equal(firstInstagramComments([{...old,parent_id:'root'},{...later,from:me}],me).length,0);assert.throws(()=>firstInstagramComments([{...old,from:{username:'guest'}}],me));});
function setup({comments=[makeComment('later','42',5),makeComment('first','42',15)],manual=false,writeFails=false,posts=[{id:'p1',caption:'今日の服',media_product_type:'REELS'}]}={}){
 const ctx={rows:[],cfg:{user_id:'owner',enabled:true,mode:'auto',post_limit:4,started_at:new Date(Date.now()-3600000).toISOString(),activated_at:new Date().toISOString(),scan_offset:0,account_id:me.id,api_host:'graph.facebook.com',graph_version:'v23.0'},generated:0,writes:[],comments};
 const db=async(path,method='GET',body)=>{
  if(path.startsWith('rpc/hanako_ig_token_read'))return 'token-private';if(path.startsWith('rpc/hanako_ig_reply_lock'))return true;
  if(path.startsWith('rpc/hanako_ig_claim_pair')){const row=ctx.rows.find(c=>c.media_id===body.target_media&&c.author_id===body.target_author&&['pending','failed'].includes(c.status));if(!row)return null;row.status='generating';row.attempts++;return {...row};}
  if(path.startsWith('hanako_ig_reply_settings')){if(method==='PATCH')Object.assign(ctx.cfg,body);return [ctx.cfg];}
  if(path.startsWith('hanako_ig_reply_queue')){
   if(method==='POST'){for(const c of body)if(!ctx.rows.some(x=>x.media_id===c.media_id&&x.author_id===c.author_id))ctx.rows.push({...c,attempts:0,reply_due_at:c.commented_at});return [];}
   const params=new URLSearchParams(path.split('?')[1]);
   if(method==='PATCH'){for(const c of ctx.rows)if((!params.has('media_id')||params.get('media_id')==='eq.'+c.media_id)&&(!params.has('author_id')||params.get('author_id')==='eq.'+c.author_id)&&(!params.has('status')||params.get('status')==='eq.'+c.status))Object.assign(c,body);return [];}
   return ctx.rows.filter(c=>params.get('media_id')==='eq.'+c.media_id&&['pending','failed'].includes(c.status)&&c.attempts<3).slice(0,1);
  }
  throw Error('Unexpected db '+path);
 };
 globalThis.fetch=async(url,opts={})=>{const u=new URL(url);const path=u.pathname;let value;if(path.endsWith('/'+me.id))value=me;else if(path.endsWith('/media'))value={data:posts};else if(path.endsWith('/comments'))value={data:ctx.comments};else if(path.endsWith('/replies')&&opts.method==='POST'){ctx.writes.push({path,text:opts.body.get('message')});if(writeFails)throw Error('timeout');value={id:'published'};}else if(path.endsWith('/replies'))value={data:manual?[{id:'manual',from:me}]:[]};else throw Error('Unexpected graph '+url);return new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json'}});};
 const api=instagramReplies({db,owner:()=> 'owner',env:()=>undefined,settings:async()=>({ai_provider:'openai',openai_ready:true,custom_prompt:''}),generate:async(s,c)=>{ctx.generated++;assert.equal(c.platform,'instagram');assert.equal(s.use_history,false);return 'ありがとう♡';},inWindow:()=>true,exclusionReason:()=>'',hasNotePromotion:()=>false,wrongNoteReply:()=>false,hasInstagramPromotion:()=>false,wrongGreeting:()=>false,wrongReplyLanguage:()=>false});return {ctx,api};
}
test('リールも最初の1件に1回だけ返信し、同じ人の続きには投稿しない',async()=>{const {ctx,api}=setup();assert.equal((await api.run()).status,'published');assert.equal(ctx.writes[0].path,'/v23.0/first/replies');assert.equal((await api.run()).status,'idle');assert.equal(ctx.writes.length,1);assert.equal(ctx.generated,1);});
test('投稿が違えば同じ利用者にもそれぞれ1回返信する',async()=>{const {ctx,api}=setup({posts:[{id:'p1'},{id:'p2'}]});await api.run();await api.run();assert.equal(ctx.writes.length,2);assert.equal(ctx.rows.length,2);});
test('読み込みでトークンを返さず、別のInstagramアカウントは登録しない',async()=>{const {api}=setup();assert.doesNotMatch(JSON.stringify(await api.load()),/token-private/);globalThis.fetch=async()=>new Response(JSON.stringify({id:me.id,username:'another_account'}));await assert.rejects(()=>api.connect({account_id:me.id,api_host:'graph.facebook.com',graph_version:'v23.0',token:'a'.repeat(30)}),/アカウントを確認/);});
test('手動返信済み・開始前の初回・投稿結果不明は自動再送しない',async()=>{
 let a=setup({manual:true});assert.equal((await a.api.run()).status,'skipped');assert.equal(a.ctx.generated,0);
 a=setup({comments:[makeComment('old','42',120),makeComment('later','42',5)]});assert.equal((await a.api.run()).status,'idle');assert.equal(a.ctx.rows[0].status,'skipped');assert.equal(a.ctx.writes.length,0);
 a=setup({writeFails:true});await assert.rejects(()=>a.api.run());assert.equal(a.ctx.rows[0].status,'uncertain');assert.equal((await a.api.run()).status,'idle');assert.equal(a.ctx.writes.length,1);
});
