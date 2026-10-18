// Catalog preview and publishing are separate: Meta's preview URL is never embedded in an MP4.
export function mountInstagramMusic(root) {
  const $ = id => root.querySelector('#reel' + id);
  $('Mode').insertAdjacentHTML('beforeend','<option value="instagram">Instagram公式音楽を検索・選択</option>');
  $('AudioPanel').insertAdjacentHTML('afterend', `<section id="reelInstagramMusic" hidden aria-label="Instagram公式音楽">
    <p class="reel-note">Facebookページに連携したクリエイター／ビジネスアカウント向け。OPSのクラウドログインが必要です。</p>
    <details id="reelMusicConnection"><summary>Instagram音楽の接続設定（初回・エラー時）</summary>
      <p class="reel-note">OPSの「同期済み」とInstagramの接続は別です。Facebookページを連携したプロアカウントと、Facebook Loginの instagram_basic / instagram_content_publish 権限が必要です。アカウントID・トークンはMetaの開発者設定で取得してください。</p>
      <button id="reelMusicConnectionCheck" type="button">登録状況を確認</button>
      <label>数字のInstagramプロアカウントID<input id="reelMusicAccountId" type="text" inputmode="numeric" autocomplete="off" maxlength="30" placeholder="ユーザー名やFacebookページIDではありません"></label>
      <label>Facebook Loginのアクセストークン<input id="reelMusicToken" type="password" autocomplete="off" spellcheck="false" maxlength="4096"></label>
      <label>APIバージョン<input id="reelMusicGraphVersion" value="v23.0" pattern="v[0-9]+[.][0-9]+"></label>
      <button id="reelMusicConnect" type="button">音楽APIを接続テストして保存</button>
      <p id="reelMusicConnectionStatus" role="status" aria-live="polite"></p>
      <p class="reel-note">トークンはチャットに送らず、この欄に入力してください。実際に楽曲を取得できた場合だけ暗号化して保存し、再表示しません。コメント返信で使用中の接続は上書きしません。</p>
      <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer">Metaのアプリ設定を開く</a>
    </details>
    <label>曲名・アーティスト名<input id="reelMusicQuery" type="search" maxlength="120" placeholder="曲名やアーティスト名"></label>
    <label>音源の種類<select id="reelMusicType"><option value="music">音楽</option><option value="original_sound">オリジナル音源</option></select></label>
    <div class="reel-row"><button id="reelMusicSearch" type="button">楽曲を検索</button><button id="reelMusicTrending" type="button">人気の音源</button><button id="reelMusicFavorites" type="button">お気に入り</button></div>
    <p id="reelMusicStatus" role="status" aria-live="polite"></p><div id="reelMusicResults" class="reel-music-results"></div>
    <div id="reelMusicSelected" class="reel-music-selected" hidden></div><audio id="reelMusicPreview" controls preload="none" hidden></audio>
    <p class="reel-note">検索対象はMetaが第三者利用を認めた音源で、Instagramアプリの全楽曲とは異なります。試聴URLがない曲はInstagram上で試聴します。音源は投稿時にInstagramが付与し、保存MP4は無音です。音源の開始位置指定・波形取得・正確なビート同期は今回の公式仕様では提供されていません。広告利用可否は別途確認してください。</p>
  </section>`);
  $('Result').insertAdjacentHTML('beforeend', `<section id="reelMusicPublishPanel" hidden class="reel-music-publish"><h3>選んだ音楽でInstagramへ</h3>
    <p id="reelMusicPublishTrack"></p><p class="reel-note">動画を一時的に非公開ストレージへ送り、Metaに渡します。保存MP4は無音のままです。音楽を合成した完成リールの事前プレビューは公式APIで提供されていません。</p>
    <label>キャプション<textarea id="reelMusicCaption" rows="3" maxlength="2200"></textarea></label>
    <button id="reelMusicPrepare" type="button">この動画と楽曲で投稿準備</button><button id="reelMusicCheck" type="button" hidden>投稿状況を確認</button>
    <label><input id="reelMusicConsent" type="checkbox"> この動画・楽曲・文章を確認し、Instagramへの公開を許可します</label>
    <button id="reelMusicPublish" type="button" disabled>確認してInstagramへ公開</button>
    <button id="reelMusicDelete" type="button" hidden>サーバーの一時動画を削除</button><p id="reelMusicPublishStatus" role="status" aria-live="polite"></p>
  </section>`);
  let selected = null, generated = null, job = null, working = false, rendering = false, searchSequence = 0;
  const client = () => new window.HanakoCloudSync(window.HANAKO_CLOUD_CONFIG || {});
  const say = text => { $('MusicStatus').textContent = text; };
  const publishSay = text => { $('MusicPublishStatus').textContent = text; };
  const favoritesKey = () => `hanako-reel-music-favorites:${client().user?.id || 'signed-out'}`;
  const pendingKey = () => `hanako-reel-music-pending:${client().user?.id || 'signed-out'}`;
  function favorites() { try { return JSON.parse(localStorage.getItem(favoritesKey()) || '[]').filter(x => /^\d+$/.test(x.audio_id)); } catch { return []; } }
  function remember() { try { if (job) localStorage.setItem(pendingKey(), JSON.stringify(job)); } catch { publishSay('端末の保存領域が不足しています。投稿準備の情報を保持できません。'); } }
  async function api(action, payload = {}) {
    const cloud = client();
    if (!cloud.signedIn) throw Error('画面上部の同期設定から、OPSのクラウドにログインしてください。');
    const token = await cloud.getAccessToken();
    const response = await fetch(`${cloud.url}/functions/v1/instagram-audio`, { method:'POST', headers:{ apikey:cloud.key, Authorization:`Bearer ${token}`, 'Content-Type':'application/json' }, body:JSON.stringify({ action,...payload }), signal:AbortSignal.timeout(55000) });
    const data = await response.json().catch(()=>({}));
    if (!response.ok) {
      if (['INSTAGRAM_SETUP_REQUIRED','FACEBOOK_LOGIN_REQUIRED','SETUP_REQUIRED'].includes(data.code)) $('MusicConnection').open=true;
      const error=new Error(data.error || data.message || 'Instagram音楽連携に失敗しました。Facebookページ連携と権限を確認してください。');error.code=data.code;throw error;
    }
    return data;
  }
  $('MusicConnectionCheck').onclick=async()=>{
    try{const data=await api('connectionStatus');$('MusicConnectionStatus').textContent=data.configured?'Instagramの接続情報は登録済みです。「楽曲を検索」で音楽APIへの接続を確認してください。':data.message;if(data.account_id)$('MusicAccountId').value=data.account_id;}
    catch(e){$('MusicConnectionStatus').textContent=e.message;}
  };
  $('MusicConnect').onclick=async()=>{
    const token=$('MusicToken');$('MusicConnect').disabled=true;
    try{$('MusicConnectionStatus').textContent='Instagramアカウントと音楽APIを確認しています…';const data=await api('connect',{account_id:$('MusicAccountId').value.trim(),token:token.value.trim(),graph_version:$('MusicGraphVersion').value.trim()});$('MusicConnectionStatus').textContent=`@${data.username} の音楽API接続を確認し、暗号化して保存しました。「楽曲を検索」をご利用ください。`;say('Instagram音楽APIの接続が完了しました。曲名・アーティストを検索できます。');}
    catch(e){$('MusicConnectionStatus').textContent=e.message;}finally{token.value='';$('MusicConnect').disabled=false;}
  };
  function button(text, handler) { const b = document.createElement('button'); b.type='button'; b.textContent=text; b.onclick=handler; return b; }
  function link(text, url) { const a=document.createElement('a');a.textContent=text;a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a; }
  function showSelected(audio) {
    selected = audio; $('MusicSelected').hidden = false; $('MusicSelected').replaceChildren();
    const title = document.createElement('strong'); title.textContent=`選択中：${audio.title} ／ ${audio.artist}`; $('MusicSelected').append(title);
    $('MusicPreview').pause(); $('MusicPreview').hidden = !audio.preview_url;
    if (audio.preview_url) $('MusicPreview').src=audio.preview_url; else $('MusicPreview').removeAttribute('src');
    say('楽曲を選択しました。音源はInstagramへの投稿時に付与します。');
  }
  function render(tracks, fromFavorites = false) {
    $('MusicResults').replaceChildren();
    for (const audio of tracks) {
      const card=document.createElement('article');card.className='reel-music-track';
      const title=document.createElement('strong');title.textContent=audio.title;
      const detail=document.createElement('p');detail.textContent=`${audio.artist || 'アーティスト情報なし'}${audio.duration_ms ? ` ／ ${Math.round(audio.duration_ms/1000)}秒` : ''}`;
      const ads=document.createElement('small');ads.textContent=audio.is_ads_eligible===true?'広告利用：対象（用途・規約も確認）':audio.is_ads_eligible===false?'広告利用：対象外':'広告利用：未確認';
      card.append(title,detail,ads);
      card.append(button('この曲を選ぶ',async()=>{
        try { const response=await api('metadata',{audio_id:audio.audio_id});showSelected(response.audio); } catch(e){say(e.message);}
      }));
      card.append(button('試聴',async()=>{
        try { const response=await api('metadata',{audio_id:audio.audio_id});const track=response.audio;
          if(track.preview_url){$('MusicPreview').src=track.preview_url;$('MusicPreview').hidden=false;await $('MusicPreview').play();}
          else {say('端末内の試聴URLがありません。下の「Instagramで試聴」リンクをご利用ください。');if(track.instagram_url&&!card.querySelector('a'))card.append(link('Instagramで試聴',track.instagram_url));}
        }catch(e){say(e.message||'試聴を開始できませんでした。再度お試しください。');}
      }));
      if(audio.instagram_url)card.append(link('Instagramで試聴',audio.instagram_url));
      const favorite = favorites().some(x=>x.audio_id===audio.audio_id);
      card.append(button(favorite?'★ お気に入り解除':'☆ お気に入り',event=>{
        const list=favorites(),exists=list.some(x=>x.audio_id===audio.audio_id);
        const next=exists?list.filter(x=>x.audio_id!==audio.audio_id):[...list,{audio_id:audio.audio_id,title:audio.title,artist:audio.artist}].slice(-100);
        try{localStorage.setItem(favoritesKey(),JSON.stringify(next));event.currentTarget.textContent=exists?'☆ お気に入り':'★ お気に入り解除';if(fromFavorites)render(next,true);}catch{say('お気に入りを保存できません。端末の保存領域を確認してください。');}
      }));
      $('MusicResults').append(card);
    }
  }
  async function search(trending = false) {
    const sequence=++searchSequence;$('MusicSearch').disabled=true;$('MusicTrending').disabled=true;say('Instagram公式音楽を検索しています…');
    try{const data=await api('search',{query:trending?'':$('MusicQuery').value,audio_type:$('MusicType').value});if(sequence!==searchSequence)return;render(data.audio);say(data.audio.length?`${data.audio.length}件の音源が見つかりました。`:'音源が見つかりません。別の検索語をお試しください。');}
    catch(e){if(sequence===searchSequence)say(e.message);}finally{if(sequence===searchSequence){$('MusicSearch').disabled=false;$('MusicTrending').disabled=false;}}
  }
  $('MusicSearch').onclick=()=>search();$('MusicTrending').onclick=()=>search(true);
  $('MusicQuery').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();search();}};
  $('MusicFavorites').onclick=()=>{++searchSequence;$('MusicSearch').disabled=false;$('MusicTrending').disabled=false;render(favorites(),true);say('お気に入りはこの端末・OPSユーザーごとに保存します。選択時に最新の利用可否を確認します。');};
  $('MusicPreview').onerror=()=>say('試聴URLの期限切れまたは再生非対応です。もう一度「試聴」を押して更新してください。');
  function updateMode() {
    const official=$('Mode').value==='instagram';$('InstagramMusic').hidden=!official;$('AudioPanel').hidden=$('Mode').value!=='file';
    if(!official)$('MusicPreview').pause();
    $('MusicNotice').textContent=official?'Instagram公式音楽：曲を選んで無音動画を制作し、確認後に音源付きで公開できます。開始位置指定・正確なビート同期は非対応です。':$('Mode').value==='silent'?'無音で生成し、Instagramアプリで音楽を追加します。正確なビート同期は保証できません。':'利用権のある音声ファイルでビート同期したMP4を制作します。';
  }
  $('Mode').addEventListener('change',updateMode);updateMode();
  function showJob() { $('MusicCheck').hidden=!job;$('MusicDelete').hidden=!job; }
  async function checkJob() {
    if(!job)return;
    const data=await api('jobStatus',{job_id:job.job_id});job.state=data.state;remember();showJob();
    const published=['published','PUBLISHED'].includes(data.state);
    $('MusicPublish').disabled=data.state!=='FINISHED'||!$('MusicConsent').checked;
    publishSay(published?'Instagramへ公開済みです。Instagramアプリでご確認ください。':data.state==='FINISHED'?'投稿準備が完了しました。内容を確認し、公開を許可する場合だけチェックを入れて公開ボタンを押してください。':['ERROR','EXPIRED'].includes(data.state)?'Instagram側で動画処理に失敗、または期限切れです。一時動画を削除し、動画を作り直してください。':'Instagramで動画を処理しています。しばらくして「投稿状況を確認」を押してください。');
    if(published){try{localStorage.removeItem(pendingKey());}catch{}$('MusicPublish').disabled=true;}
  }
  $('MusicConsent').onchange=()=>{$('MusicPublish').disabled=working||job?.state!=='FINISHED'||!$('MusicConsent').checked;};
  $('MusicPrepare').onclick=async()=>{
    if(working||rendering||!generated)return;
    working=true;$('MusicPrepare').disabled=true;$('MusicConsent').checked=false;$('MusicPublish').disabled=true;
    try{
      if(job)throw Error('前の投稿準備が残っています。投稿状況を確認してから一時動画を削除してください。');
      publishSay('非公開ストレージへ送る準備をしています…');
      const prepared=await api('prepare',{audio_id:generated.audio.audio_id,size:generated.file.size,duration:generated.duration});
      job={job_id:prepared.job_id,state:'uploading'};remember();showJob();
      publishSay('動画をアップロードしています…');
      const upload=await fetch(prepared.upload_url,{method:'PUT',headers:{'Content-Type':'video/mp4','x-upsert':'false','cache-control':'max-age=3600'},body:generated.file,signal:AbortSignal.timeout(120000)});
      if(!upload.ok)throw Error('動画のアップロードに失敗しました。一時動画を削除してから再試行してください。');
      publishSay('Instagramへ動画と楽曲を渡しています。まだ公開はしません。');
      await api('createReel',{job_id:job.job_id,caption:$('MusicCaption').value});
      await checkJob();
    }catch(e){publishSay(e.message);}finally{working=false;$('MusicPrepare').disabled=false;}
  };
  $('MusicCheck').onclick=async()=>{if(working)return;try{await checkJob();}catch(e){publishSay(e.message);}};
  $('MusicPublish').onclick=async()=>{
    if(working||rendering||!job||!$('MusicConsent').checked||job.state!=='FINISHED')return;
    working=true;$('MusicPublish').disabled=true;job.state='publish_requested';remember();
    try{publishSay('Instagramへ公開しています。画面を閉じずにお待ちください。');const data=await api('publish',{job_id:job.job_id,confirm:true});job.state=data.state;remember();publishSay('Instagramへ公開しました。Instagramアプリでリールをご確認ください。');try{localStorage.removeItem(pendingKey());}catch{}}
    catch(e){publishSay(`${e.message} 自動再送はしません。「投稿状況を確認」で確認してください。`);}finally{working=false;$('MusicConsent').checked=false;}
  };
  $('MusicDelete').onclick=async()=>{
    if(working||rendering||!job)return;working=true;
    try{await api('deleteVideo',{job_id:job.job_id});job=null;try{localStorage.removeItem(pendingKey());}catch{}showJob();$('MusicPublish').disabled=true;publishSay('サーバーの一時動画を削除しました。すでに公開されたInstagram投稿は削除しません。');}
    catch(e){publishSay(e.message);}finally{working=false;}
  };
  try{const saved=JSON.parse(localStorage.getItem(pendingKey())||'null');if(saved?.job_id){job=saved;showJob();$('MusicPublishPanel').hidden=false;$('Result').hidden=false;publishSay('前回の投稿準備があります。「投稿状況を確認」で結果を確認してください。');}}catch{}
  return {
    captureChoice(){if(working||rendering||job)throw Error('投稿準備が残っています。投稿状況を確認してから一時動画を削除してください。');if($('Mode').value==='instagram'){if(!selected)throw Error('Instagram公式音楽から楽曲を選択してください。');return {...selected};}return null;},
    setGenerating(value){rendering=value;$('MusicPrepare').disabled=value;$('MusicPublish').disabled=value||working||job?.state!=='FINISHED'||!$('MusicConsent').checked;},
    pause(){ $('MusicPreview').pause(); },
    setResult(file,duration,audio){generated=audio?{file,duration,audio}:null;$('MusicPublishPanel').hidden=!audio&&!job;$('MusicPublishTrack').textContent=audio?`この動画の音源：${audio.title} ／ ${audio.artist}`:'';$('MusicConsent').checked=false;$('MusicPublish').disabled=true;}
  };
}
