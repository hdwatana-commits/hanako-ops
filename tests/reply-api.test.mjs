import test from 'node:test';
import assert from 'node:assert/strict';
let handler;
const secrets={SUPABASE_URL:'https://db.test',SUPABASE_ANON_KEY:'anon',SUPABASE_SERVICE_ROLE_KEY:'service',HANAKO_OWNER_USER_ID:'owner',HANAKO_REPLY_CRON_SECRET:'cron',THREADS_USER_ID:'threads-owner',THREADS_ACCESS_TOKEN:'threads-token',OPENAI_API_KEY:'ai-key'};
globalThis.Deno={env:{get:name=>secrets[name]},serve:fn=>{handler=fn;}};
await import('../supabase/functions/threads-replies/index.ts');
const response=value=>new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json'}});
const invoke=(body,headers={})=>handler(new Request('https://function.test',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer owner',...headers},body:JSON.stringify(body)}));
test('所有者以外は履歴を読めない',async()=>{
  globalThis.fetch=async url=>{assert.match(url,/auth\/v1\/user$/);return response({id:'other'});};
  const result=await invoke({action:'load'});assert.equal(result.status,400);assert.match((await result.json()).error,/所有者/);
});
test('Cron秘密値では設定変更できない',async()=>{
  globalThis.fetch=async()=>{throw new Error('Unexpected network');};
  assert.equal((await invoke({action:'save'},{'x-cron-secret':'cron'})).status,403);
});

test('接続診断は通信例外の認証情報を返さない',async()=>{
  globalThis.fetch=async url=>{
    if(String(url).includes('hanako_reply_settings'))return response([{use_history:false,tones:['cute'],max_chars:180}]);
    throw new Error('Invalid header Bearer private-key-must-not-leak');
  };
  const result=await invoke({action:'check'},{'x-cron-secret':'cron'});
  assert.equal(result.status,200);
  const body=await result.json();assert.equal(body.ready,false);
  assert.doesNotMatch(JSON.stringify(body),/private-key-must-not-leak/);
});
test('投稿の通信結果が不明ならuncertainとなり、再送しない',async()=>{
  let s={enabled:true,mode:'auto',start_time:'00:00',end_time:'00:00',weekdays:[0,1,2,3,4,5,6],tones:['cute'],adapt_tone:true,custom_prompt:'',max_chars:180,use_history:true,started_at:'2026-01-01T00:00:00Z',scan_posts:[],scan_after:null};
  let c={comment_id:'comment1',username:'guest',comment_text:'かわいい',post_text:'今日の服',status:'pending'};
  let locked=false, writes=0;
  globalThis.fetch=async(url,opts={})=>{
    url=String(url);const body=opts.body?JSON.parse(typeof opts.body==='string'?opts.body:'{}'):{};
    if(url.startsWith('https://db.test')){
      if(url.endsWith('auth/v1/user'))return response({id:'owner'});
      if(url.includes('rpc/hanako_reply_lock')){if(locked)return response(false);locked=true;return response(true);}
      if(url.includes('rpc/hanako_reply_claim')){if(c.status!=='pending')return response(null);c.status='generating';return response(c);}
      if(url.includes('hanako_reply_settings')){if(opts.method==='PATCH'){s={...s,...body};if(body.lease_until===null)locked=false;}return response([s]);}
      if(url.includes('hanako_reply_comments')){
        if(opts.method==='PATCH'){c={...c,...body};return response([c]);}
        if(opts.method==='POST')return response([]);
        if(url.includes('username=eq.'))return response([]);
        return response([c]);
      }
    }
    if(url.includes('graph.threads.net')){
      if(opts.method==='POST'){writes++;assert.equal(c.status,'publishing');throw new Error('connection lost');}
      if(url.includes('/me?'))return response({id:'threads-owner',username:'hana'});
      if(url.includes('/me/threads?'))return response({data:[]});
    }
    if(url==='https://api.openai.com/v1/responses')return response({status:'completed',output:[{type:'message',content:[{type:'output_text',text:'そう言われると照れちゃう🤭'}]}]});
    throw new Error('Unexpected request: '+url);
  };
  assert.equal((await invoke({action:'run'})).status,400);
  assert.equal(c.status,'uncertain');assert.equal(writes,1);
  assert.equal((await invoke({action:'run'})).status,200);assert.equal(writes,1);
});
