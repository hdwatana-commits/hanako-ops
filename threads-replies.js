import { TONES } from './reply-rules.mjs';
const section=document.createElement('section');
section.id='threads-replies'; section.className='view';
section.innerHTML=`
<div class="panel reply-hero"><p class="eyebrow">HANA · CONVERSATION STUDIO</p><h3>Threads 返信管理</h3><p>ひとつひとつの会話を、ハナらしく。</p><p id="replyStatus" role="status" aria-live="polite">クラウド同期にログインし、「読み込む」で設定を確認してください。</p><div class="button-row"><button id="replyLoad">読み込む</button><button id="replyCheck" disabled>接続とAIをテスト</button><button id="replyRun" disabled>今すぐ確認</button></div><p id="replyCheckResult" class="reply-help"></p></div>
<form id="replySettings" class="panel reply-settings"><div class="panel-heading"><h3>返信の設定</h3><button class="primary" type="submit" disabled>クラウドに保存</button></div>
<fieldset disabled id="replyFields"><div class="reply-grid">
<label class="reply-check"><input type="checkbox" name="enabled"> 自動処理を有効にする</label>
<label>返信モード<select name="mode"><option value="draft">下書き作成のみ</option><option value="auto">AIで作成して自動投稿</option></select></label>
<label>Geminiの接続先<select name="ai_connection"><option value="default">接続1（現在のアカウント）</option><option value="secondary">接続2</option><option value="third">接続3</option></select></label>
<label>開始時間（日本時間）<input name="start_time" type="time" value="09:00" required></label>
<label>終了時間（日本時間）<input name="end_time" type="time" value="23:00" required></label>
<label>返信までの待ち時間（分）<input name="delay_minutes" type="number" min="0" max="1440" value="5" required></label>
<label>返信の最大文字数<input name="max_chars" type="number" min="20" max="500" value="180" required></label></div>
<p class="reply-help">同じ開始・終了時間は24時間。日付をまたぐ場合は開始曜日を基準にします。時間外のコメントは次の稼働時間まで待機します。</p>
<p class="reply-help" id="replyConnectionHelp">接続先を選んで「クラウドに保存」で変更します。APIキーはSupabaseのSecretsに登録してください。上限到達時の自動切り替えはありません。</p>
<fieldset><legend>稼働する曜日</legend><div class="reply-choices">${['日','月','火','水','木','金','土'].map((x,i)=>`<label><input type="checkbox" name="weekdays" value="${i}" checked> ${x}</label>`).join('')}</div></fieldset>
<fieldset><legend>テンション（複数選択可）</legend><div class="reply-choices">${Object.entries(TONES).map(([id,label])=>`<label><input type="checkbox" name="tones" value="${id}" ${id==='cute'?'checked':''}> ${label}</label>`).join('')}</div></fieldset>
<label class="reply-check"><input name="adapt_tone" type="checkbox" checked> 選んだテンションの中で、相手の雰囲気に合わせる</label>
<label class="reply-check"><input name="use_history" type="checkbox" checked> この人との過去の会話を返信に反映する</label>
<label>ハナの返信カスタマイズ<textarea name="custom_prompt" rows="7" maxlength="8000" placeholder="例：絵文字は1個まで。つけ麺の話にはおすすめの味を聞く。"></textarea></label>
<p class="reply-help">ハナの基本設定、同じ言語での返信、会う・電話の約束をしないルールは初期設定に含まれています。対象は設定を初めて読み込んだ時刻以降のコメント。過去のコメントは履歴として取り込みます。</p></fieldset></form>
<div class="reply-grid reply-panels"><section class="panel"><div class="panel-heading"><h3>返信の状況</h3><select id="replyFilter" aria-label="返信状況の絞り込み"><option value="all">すべて</option><option value="draft">下書き</option><option value="pending">待機中</option><option value="published">返信済み</option><option value="failed">生成失敗</option><option value="uncertain">結果確認が必要</option></select></div><p class="reply-help">最新100件。本文はコピーできます。</p><div id="replyQueue"><p>読み込み後に表示します。</p></div></section>
<section class="panel"><h3>ファンランク・順位</h3><p class="reply-help">得点＝コメント数＋交流日数×3。同点は同順位。収集できたコメントを集計します。</p><label>ユーザー名で検索<input id="replySearch" type="search" placeholder="ユーザー名"></label><div id="replyFans"><p>読み込み後に表示します。</p></div></section></div>
<section class="panel" id="replyHistoryPanel" hidden><div class="panel-heading"><h3 id="replyHistoryTitle">会話履歴</h3><button id="replyHistoryClose">閉じる</button></div><div id="replyHistory"></div><button id="replyMore" hidden>さらに50件表示</button></section>`;
document.querySelector('#connections').after(section);
views['threads-replies']='Threads 返信管理';
const nav=document.createElement('button');nav.className='nav-tab';nav.dataset.view='threads-replies';
nav.innerHTML='<span class="nav-icon" aria-hidden="true">↩</span><span>Threads返信</span>';
document.querySelector('.nav-tab[data-view="connections"]').after(nav);
nav.addEventListener('click',()=>activateView('threads-replies'));
const $=selector=>section.querySelector(selector);
const form=$('#replySettings');let loaded=null, person='', offset=0, busy=false;
const labels={pending:'待機中',generating:'生成中',draft:'下書き',publishing:'公開結果を確認中',published:'返信済み',failed:'生成失敗',uncertain:'結果確認が必要',history:'過去のコメント'};
function textNode(tag,value,className='') {const element=document.createElement(tag);element.textContent=value;element.className=className;return element;}
function status(value){$('#replyStatus').textContent=value;}
async function call(action,body={}) {
  if(!cloudSync.signedIn) throw new Error('画面上部の同期設定から、所有者アカウントでログインしてください。');
  const response=await fetch(`${cloudSync.url}/functions/v1/threads-replies`,{method:'POST',headers:{apikey:cloudSync.key,Authorization:`Bearer ${await cloudSync.getAccessToken()}`,'Content-Type':'application/json'},body:JSON.stringify({action,...body}),signal:AbortSignal.timeout(120000)});
  let data;try{data=await response.json();}catch{throw new Error('返信管理APIを確認してください。初回はサーバー設定が必要です。');}
  if(!response.ok||data.error) throw new Error(data.error||'返信管理APIを確認してください。');return data;
}
async function task(fn){if(busy)return;busy=true;section.setAttribute('aria-busy','true');try{await fn();}catch(e){status(e.message);}finally{busy=false;section.removeAttribute('aria-busy');}}
async function load(){
  const data=await call('load');loaded=data;
  const connectionSelect=form.elements.namedItem('ai_connection');
  for(const option of connectionSelect.options){const available=data.connections?.find(c=>c.id===option.value)?.configured;option.disabled=!available;option.textContent=({default:'接続1（現在のアカウント）',secondary:'接続2',third:'接続3'})[option.value]+(available?' · 登録済み':' · 未登録');}
  for(const [name,value] of Object.entries(data.settings)){
    const fields=[...form.querySelectorAll(`[name="${name}"]`)];
    fields.forEach(field=>{if(field.type==='checkbox')field.checked=Array.isArray(value)?value.map(String).includes(field.value):Boolean(value);else field.value=name.endsWith('_time')?String(value).slice(0,5):value;});
  }
  $('#replyFields').disabled=false;form.querySelector('[type="submit"]').disabled=false;$('#replyRun').disabled=!data.connected;$('#replyCheck').disabled=false;
  if(!data.settings.ai_connection)connectionSelect.value='default';
  $('#replyConnectionHelp').textContent='接続先を選んで「クラウドに保存」で変更します。接続2・3のキーはSupabaseのGEMINI_API_KEY_SECONDARY / GEMINI_API_KEY_THIRDに登録してください。上限による待機中は変更できません。';
  status(`${data.settings.enabled?'有効':'停止中'} · ${data.settings.mode==='auto'?'自動投稿':'下書きのみ'} · ${data.connected?'API設定あり（接続の動作確認は今すぐ確認から）':'Threads・AIのサーバー設定が必要です'}${data.settings.last_error?' · '+data.settings.last_error:''}`);
  renderQueue();renderFans();
}
function card(c){const article=document.createElement('article');article.className='reply-card';
  article.append(textNode('strong',c.username),textNode('small',`${new Date(c.commented_at).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'})} · ${labels[c.status]||c.status}`),textNode('p',c.comment_text||'（テキストなし）'));
  if(c.post_text) {const details=document.createElement('details');details.append(textNode('summary','元の投稿'),textNode('p',c.post_text));article.append(details);}
  if(c.reply_text){article.append(textNode('p',c.reply_text,'reply-body'));const copy=textNode('button','返信本文をコピー');copy.onclick=()=>task(async()=>{await navigator.clipboard.writeText(c.reply_text);status('返信本文をコピーしました。');});article.append(copy);}
  if(c.error)article.append(textNode('p',c.error,'reply-error'));
  if(c.status==='draft'){const publish=textNode('button','この下書きを投稿');publish.onclick=()=>task(async()=>{await call('publish',{commentId:c.comment_id});await load();});article.append(publish);}
  if(['failed','generating'].includes(c.status)){const retry=textNode('button','再生成の待機に戻す');retry.onclick=()=>task(async()=>{const result=await call('retry',{commentId:c.comment_id});await load();if(result.status==='busy')status('処理中です。数分後に再実行してください。');});article.append(retry);}
  const history=textNode('button','この人の履歴');history.onclick=()=>task(()=>showHistory(c.username));article.append(history);return article;
}
function renderQueue(){const queue=$('#replyQueue');queue.replaceChildren();const values=(loaded?.replies||[]).filter(c=>$('#replyFilter').value==='all'||c.status===$('#replyFilter').value);if(!values.length)queue.append(textNode('p','対象の返信はありません。'));values.forEach(c=>queue.append(card(c)));}
function renderFans(){const list=$('#replyFans');list.replaceChildren();const values=(loaded?.fans||[]).filter(p=>p.username.toLowerCase().includes($('#replySearch').value.toLowerCase()));if(!values.length)list.append(textNode('p','収集済みの交流はありません。'));values.forEach(p=>{const row=document.createElement('article');row.className='reply-card';row.append(textNode('strong',`${p.position}位 · ${p.username}`),textNode('p',`${p.fan_rank} · ${p.score}点`),textNode('small',`コメント ${p.comments}件 / 交流 ${p.active_days}日 / 返信済み ${p.replies}件`));const open=textNode('button','履歴を見る');open.onclick=()=>task(()=>showHistory(p.username));row.append(open);list.append(row);});}
async function showHistory(username,more=false){const result=await call('history',{username,offset:more?offset:0});if(!more){person=username;offset=0;$('#replyHistory').replaceChildren();}result.history.forEach(c=>$('#replyHistory').append(card(c)));offset+=result.history.length;$('#replyMore').hidden=result.history.length<50;$('#replyHistoryTitle').textContent=`${username} の会話履歴`;$('#replyHistoryPanel').hidden=false;$('#replyHistoryPanel').scrollIntoView({behavior:'smooth',block:'start'});}
$('#replyLoad').onclick=()=>task(load);
$('#replyCheck').onclick=()=>task(async()=>{status('ThreadsとAIの接続を確認しています。');const result=await call('check');$('#replyCheckResult').textContent=[`AI（${result.openai.provider||'openai'} / ${result.openai.model}）: ${result.openai.ok?'返信生成OK':result.openai.error||'キー未設定'}`,`Threads: ${result.threads.ok?'接続OK（'+result.threads.username+'）':result.threads.error||'認証未設定'}`,result.openai.sample?'生成例: '+result.openai.sample:''].filter(Boolean).join('\n');status(result.ready?'ThreadsとAIの接続を確認しました。': '接続結果を確認してください。');});
$('#replyRun').onclick=()=>task(async()=>{const result=await call('run');await load();status(({quota_wait:'Gemini無料枠の上限です。待機中のコメントは1時間後に再試行します。',busy:'処理中です。少し待って再度読み込んでください。',off:'自動処理は停止中です。',outside_window:'コメントを確認しました。返信は次の稼働時間まで待機します。',processed:'返信を1件処理しました。',idle:'コメントを確認しました。ページを順番に収集中です。'})[result.status]||result.status);});
form.onsubmit=e=>{e.preventDefault();task(async()=>{const f=new FormData(form);await call('save',{settings:{enabled:f.has('enabled'),mode:f.get('mode'),ai_connection:f.get('ai_connection'),start_time:f.get('start_time'),end_time:f.get('end_time'),weekdays:f.getAll('weekdays').map(Number),delay_minutes:Number(f.get('delay_minutes')),tones:f.getAll('tones'),adapt_tone:f.has('adapt_tone'),custom_prompt:f.get('custom_prompt'),max_chars:Number(f.get('max_chars')),use_history:f.has('use_history')}});await load();status('返信設定をクラウドに保存しました。');});};
$('#replyFilter').onchange=renderQueue;$('#replySearch').oninput=renderFans;
$('#replyHistoryClose').onclick=()=>$('#replyHistoryPanel').hidden=true;
$('#replyMore').onclick=()=>task(()=>showHistory(person,true));

