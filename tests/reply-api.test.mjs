import test from 'node:test';
import assert from 'node:assert/strict';
let handler;
let vault={}, vaultWrites=0, vaultReads=0, fetchMock;
Object.defineProperty(globalThis,'fetch',{configurable:true,get:()=>fetchMock,set:fn=>{fetchMock=async(url,opts={})=>{
  if(String(url).includes('/rpc/hanako_gemini_key_')) {
    const body=JSON.parse(opts.body);assert.equal(body.owner_id,'owner');assert.equal(opts.headers.Authorization,'Bearer service');
    if(String(url).endsWith('_status'))return response(Object.entries(vault).map(([profile])=>({profile,configured:true})));
    if(String(url).endsWith('_read')){vaultReads++;return response(vault[body.profile]||null);}
    if(String(url).endsWith('_save')){vaultWrites++;vault[body.profile]=body.key_value;return response(true);}
  }
  return fn(url,opts);
};}});
const secrets={REPLY_AI_PROVIDER:'openai',SUPABASE_URL:'https://db.test',SUPABASE_ANON_KEY:'anon',SUPABASE_SERVICE_ROLE_KEY:'service',HANAKO_OWNER_USER_ID:'owner',HANAKO_REPLY_CRON_SECRET:'cron',THREADS_USER_ID:'threads-owner',THREADS_ACCESS_TOKEN:'threads-token',OPENAI_API_KEY:'sk-ai-key'};
globalThis.Deno={env:{get:name=>secrets[name]},serve:fn=>{handler=fn;}};
await import('../supabase/functions/threads-replies/index.ts');
const response=value=>new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json'}});
const invoke=(body,headers={})=>handler(new Request('https://function.test',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer owner',...headers},body:JSON.stringify(body)}));

test('選択したGemini接続のみを使用し、キーを画面に返さない',async()=>{
  secrets.REPLY_AI_PROVIDER='gemini';secrets.GEMINI_API_KEY='primary-private';secrets.GEMINI_API_KEY_SECONDARY='secondary-private';
  const s={ai_connection:'secondary',use_history:false,tones:['cute'],custom_prompt:'',max_chars:180};
  let requests=0;
  globalThis.fetch=async(url,opts={})=>{
    url=String(url);
    if(url.includes('auth/v1/user'))return response({id:'owner'});
    if(url.includes('hanako_reply_settings'))return response([s]);
    if(url.includes('hanako_reply_comments')||url.includes('rpc/hanako_reply_fans'))return response([]);
    if(url.includes('/me?'))return response({id:'threads-owner',username:'hana'});
    if(url.includes('/me/threads?'))return response({data:[]});
    if(url.includes('generativelanguage.googleapis.com')){requests++;assert.equal(opts.headers['x-goog-api-key'],'secondary-private');return response({candidates:[{finishReason:'STOP',content:{parts:[{text:'ありがとう、嬉しいな✨'}]}}]});}
    throw new Error('Unexpected request');
  };
  try {
    assert.equal((await (await invoke({action:'check'},{'x-cron-secret':'cron'})).json()).ready,true);
    const loaded=await (await invoke({action:'load'})).json();
    assert.equal(requests,1);assert.equal(loaded.settings.ai_connection,'secondary');
    assert.deepEqual(loaded.connections,[{id:'default',configured:true},{id:'secondary',configured:true},{id:'third',configured:false}]);
    assert.doesNotMatch(JSON.stringify(loaded),/primary-private|secondary-private/);
  } finally {secrets.REPLY_AI_PROVIDER='openai';delete secrets.GEMINI_API_KEY;delete secrets.GEMINI_API_KEY_SECONDARY;}
});

test('利用上限の待機中はGemini接続を変更しない',async()=>{
  secrets.REPLY_AI_PROVIDER='gemini';secrets.GEMINI_API_KEY_SECONDARY='secondary-private';
  const s={enabled:false,mode:'auto',start_time:'09:00',end_time:'23:00',weekdays:[0,1,2,3,4,5,6],delay_minutes:5,tones:['cute'],adapt_tone:true,custom_prompt:'',max_chars:180,use_history:true,ai_connection:'default',ai_retry_at:new Date(Date.now()+3600000).toISOString()};
  globalThis.fetch=async(url,opts={})=>{
    assert.notEqual(opts.method,'PATCH');
    if(String(url).includes('auth/v1/user'))return response({id:'owner'});
    if(String(url).includes('hanako_reply_settings'))return response([s]);
    throw new Error('Unexpected request');
  };
  try {const result=await invoke({action:'save',settings:{...s,ai_connection:'secondary'}});assert.equal(result.status,400);assert.match((await result.json()).error,/待機中/);}
  finally {secrets.REPLY_AI_PROVIDER='openai';delete secrets.GEMINI_API_KEY_SECONDARY;}
});

test('会う表現の候補を破棄し、一度だけ生成し直す',async()=>{
  secrets.REPLY_AI_PROVIDER='gemini';secrets.GEMINI_API_KEY='test-gemini';
  let generations=0;
  globalThis.fetch=async(url)=>{
    url=String(url);
    if(url.includes('hanako_reply_settings'))return response([{use_history:false,tones:['cute'],custom_prompt:'',max_chars:180}]);
    if(url.includes('hanako_reply_comments'))return response([]);
    if(url.includes('/me?'))return response({id:'threads-owner',username:'hana'});
    if(url.includes('/me/threads?'))return response({data:[]});
    if(url.includes('generativelanguage.googleapis.com')){
      generations++;
      return response({candidates:[{finishReason:'STOP',content:{parts:[{text:generations===1?'本当に会えたら何してお話しよっか？':'ここでお話しできるのが嬉しいな🤭'}]}}]});
    }
    throw new Error('Unexpected request');
  };
  try {
    const body=await (await invoke({action:'check'},{'x-cron-secret':'cron'})).json();
    assert.equal(body.openai.ok,true);assert.equal(generations,2);
    assert.equal(body.openai.sample,'ここでお話しできるのが嬉しいな🤭');
  } finally {secrets.REPLY_AI_PROVIDER='openai';delete secrets.GEMINI_API_KEY;}
});

test('Gemini無料枠429では待機し、有料APIにも投稿にも進まない',async()=>{
  secrets.REPLY_AI_PROVIDER='gemini';secrets.GEMINI_API_KEY='test-gemini';
  let s={enabled:true,mode:'auto',start_time:'00:00',end_time:'00:00',weekdays:[0,1,2,3,4,5,6],tones:['cute'],adapt_tone:true,max_chars:180,use_history:false,scan_posts:[]};
  let c={comment_id:'quota-comment',username:'guest',comment_text:'可愛い',status:'pending'};
  let calls=0;
  globalThis.fetch=async(url,opts={})=>{
    url=String(url);const body=opts.body&&typeof opts.body==='string'?JSON.parse(opts.body):{};
    if(url.includes('auth/v1/user'))return response({id:'owner'});
    if(url.includes('rpc/hanako_reply_lock'))return response(true);
    if(url.includes('rpc/hanako_reply_claim')){c.status='generating';return response(c);}
    if(url.includes('hanako_reply_settings')){if(opts.method==='PATCH')s={...s,...body};return response([s]);}
    if(url.includes('hanako_reply_comments')){if(opts.method==='PATCH')c={...c,...body};return response([c]);}
    if(url.includes('/me?'))return response({id:'threads-owner',username:'hana'});
    if(url.includes('/me/threads?'))return response({data:[]});
    if(url.includes('generativelanguage.googleapis.com')){calls++;return new Response('{"error":{"code":429}}',{status:429});}
    throw new Error('Unexpected request');
  };
  try {
    assert.equal((await (await invoke({action:'run'})).json()).status,'quota_wait');
    assert.equal(c.status,'pending');assert.ok(Date.parse(s.ai_retry_at)>Date.now());
    assert.equal((await (await invoke({action:'run'})).json()).status,'quota_wait');assert.equal(calls,1);
  } finally {secrets.REPLY_AI_PROVIDER='openai';delete secrets.GEMINI_API_KEY;}
});
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



test('OPSからのキー登録は所有者限定で暗号化RPCへ渡し、自動返信設定を変更しない',async()=>{
  const key='AIza'+'Z'.repeat(35);let changes=[];
  globalThis.fetch=async(url,opts={})=>{
    if(String(url).includes('auth/v1/user'))return response({id:'owner'});
    if(String(url).includes('rpc/hanako_reply_lock'))return response(true);
    if(String(url).includes('hanako_reply_settings')){if(opts.method==='PATCH')changes.push(JSON.parse(opts.body));return response([{enabled:false,ai_connection:'default'}]);}
    throw new Error('Unexpected request');
  };
  try {
    const result=await invoke({action:'key_save',profile:'secondary',key});assert.equal(result.status,200);
    const saved=await result.json();assert.equal(saved.saved,true);assert.equal(saved.connections.find(c=>c.id==='secondary').configured,true);assert.ok(!JSON.stringify(saved).includes(key));assert.equal(vault.secondary,key);assert.deepEqual(changes,[{lease_until:null}]);
    const writes=vaultWrites;
    assert.equal((await invoke({action:'key_save',profile:'secondary',key},{'x-cron-secret':'cron'})).status,403);
    globalThis.fetch=async()=>response({id:'other'});
    assert.equal((await invoke({action:'key_save',profile:'secondary',key})).status,400);assert.equal(vaultWrites,writes);
  } finally {vault={};}
});

test('キー登録は不正キー・待機中・処理中を拒否する',async()=>{
  let current={ai_retry_at:new Date(Date.now()+3600000).toISOString()};const writes=vaultWrites;
  globalThis.fetch=async(url)=>{
    if(String(url).includes('auth/v1/user'))return response({id:'owner'});
    if(String(url).includes('hanako_reply_settings'))return response([current]);
    if(String(url).includes('rpc/hanako_reply_lock'))return response(false);
    throw new Error('Unexpected request');
  };
  assert.equal((await invoke({action:'key_save',profile:'secondary',key:'invalid'})).status,400);
  const key='AIza'+'Z'.repeat(35);
  assert.match((await (await invoke({action:'key_save',profile:'secondary',key})).json()).error,/待機中/);
  current={};assert.match((await (await invoke({action:'key_save',profile:'secondary',key})).json()).error,/処理中/);
  assert.equal(vaultWrites,writes);
});

test('Vaultのキーを生成に使い、画面・診断に返さない',async()=>{
  secrets.REPLY_AI_PROVIDER='gemini';vault.secondary='AIza'+'Q'.repeat(35);
  globalThis.fetch=async(url,opts={})=>{
    url=String(url);
    if(url.includes('auth/v1/user'))return response({id:'owner'});
    if(url.includes('hanako_reply_settings'))return response([{ai_connection:'secondary',use_history:false,tones:['cute'],custom_prompt:'',max_chars:180}]);
    if(url.includes('hanako_reply_comments')||url.includes('rpc/hanako_reply_fans'))return response([]);
    if(url.includes('/me?'))return response({id:'threads-owner',username:'hana'});
    if(url.includes('/me/threads?'))return response({data:[]});
    if(url.includes('generativelanguage.googleapis.com')){assert.equal(opts.headers['x-goog-api-key'],vault.secondary);return response({candidates:[{finishReason:'STOP',content:{parts:[{text:'嬉しいな✨'}]}}]});}
    throw new Error('Unexpected request');
  };
  try {
    const loaded=await (await invoke({action:'load'})).json();assert.equal(loaded.connected,true);assert.ok(!JSON.stringify(loaded).includes(vault.secondary));
    const checked=await (await invoke({action:'check'})).json();assert.equal(checked.ready,true);assert.ok(!JSON.stringify(checked).includes(vault.secondary));
  } finally {vault={};secrets.REPLY_AI_PROVIDER='openai';}
});
