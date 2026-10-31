import {mountMuseReelMaker} from './muse-reel-maker.mjs?v=1';
import { analyze, timeline, styles, createEditPlan } from './reel-engine.mjs?v=5';
import { drawPhotoScene } from './reel-style-renderer.mjs?v=5';
import { mountEditStyles } from './reel-edit-styles.mjs?v=5';
import { mountInstagramMusic } from './reel-music.mjs?v=4';
import { drawCaption } from './reel-captions.mjs?v=2';
import { mountCaptionEditor } from './reel-caption-editor.mjs?v=4';
import {decodeSource,validateSource,audioClipWav,isVideoSource} from './reel-source.mjs?v=1';
const root = document.querySelector('#reels');
root.innerHTML = `
  <div class="reel-wrap"><p class="eyebrow">Instagram → リール自動制作</p><h2>写真に、かわいいリズムを。</h2>
  <p>写真はそのまま。音楽に合わせてハートや光を重ねます。動画制作は端末内で処理します。Instagramへの投稿準備時だけ動画をサーバーへ送ります。</p>
  <fieldset id="reelInputs"><legend>リールの素材とスタイル</legend>
  <label>① 写真を4〜14枚選択 <input id="reelPhotos" type="file" accept="image/jpeg,image/png,image/heic,image/heif" multiple></label>
  <p class="reel-note">写真全体を表示し、余白は背景ぼかしで補完します。HEICを読めない端末ではJPGに変換してください。</p>
  <div id="reelPhotoList" class="reel-photos"></div>
  <label>② 音楽 <select id="reelMode"><option value="file">利用権のある音楽ファイル</option><option value="silent">Instagramで音楽を後付け（無音）</option></select></label>
  <div id="reelAudioPanel"><label>音楽・画面収録の動画<input id="reelAudio" aria-label="音楽・画面収録の動画" type="file" accept="audio/*,video/mp4,video/quicktime,video/x-m4v,.mp3,.m4a,.wav,.mp4,.mov,.m4v"></label><video id="reelAudioPreview" class="reel-source-media" controls playsinline preload="metadata"></video>
  <p id="reelSourceStatus" class="reel-note">iPhoneの画面収録（MP4/MOV）も選べます。映像は素材にせず、音声だけ使用します。音楽40MB・動画150MBまで。録画は必要な部分だけ短くしてください。</p>
  <label><input id="reelRights" type="checkbox"> この音楽を動画で使用する権利を持っています</label>
  <label>音楽の開始位置（秒）<input id="reelStart" type="number" value="0" min="0" step="0.1"></label>
  <label><input id="reelTranscribeConsent" type="checkbox"> 使用区間の音声（最大60秒、30秒ずつ分割）をSupabase経由でOpenAIに送り、歌詞・字幕の下書きを作ることに同意します（API利用料がかかります）</label>
  <button id="reelTranscribe" type="button">この区間の歌詞・字幕を自動で下書き</button><button id="reelTranscribeCheck" type="button">文字起こしの接続を確認</button><p id="reelTranscribeStatus" role="status" aria-live="polite"></p><p class="reel-note">歌声・伴奏は誤認識や抜けが生じます。結果と時刻を必ず確認・修正してください。動画の映像と選択区間以外の音声は送信しません。</p></div>
  <p id="reelMusicNotice" class="reel-note">Instagram公式音楽の検索・選択にも対応しています。音楽の選択方法を切り替えてください。</p>
  <div class="reel-row"><label>③ 編集スタイル<select id="reelStyle"><option value="hana">おまかせ（ハナ・かわいい系）</option><option value="cinema">おしゃれ・シネマ系</option><option value="pop">ポップ・テンポ系</option></select></label>
  <label>長さ<select id="reelDuration"><option>15</option><option>20</option><option>30</option><option>60</option></select>秒</label></div>
  <details><summary>テキスト・リズムを調整</summary><p>権利上問題のない文章を入力してください。改行できます。</p>
  <label>テキスト<textarea id="reelText" rows="3" maxlength="160" placeholder="今日のかわいいを、ひとつ。"></textarea></label>
  <div class="reel-row"><label>表示開始（秒）<input id="reelTextStart" type="number" min="0" value="0" step="0.1"></label><label>表示終了（秒）<input id="reelTextEnd" type="number" min="0" value="15" step="0.1"></label></div>
  <div class="reel-row"><label>文字色<select id="reelColor"><option value="#ffffff">白</option><option value="#ffb7d2">ピンク</option></select></label><label>文字位置<select id="reelPosition"><option value="1280">下（安全領域内）</option><option value="900">中央</option><option value="380">上（安全領域内）</option></select></label></div>
  <label>BPMを手動指定（空欄で自動解析）<input id="reelBpm" type="number" min="50" max="200" placeholder="例：120"></label>
  <label>ビート位置の補正（秒）<input id="reelOffset" type="number" min="-1" max="1" step="0.02" value="0"></label></details>
  </fieldset>
  <p class="reel-note">1080×1920・MP4。30fpsを要求して録画します。制作中はこの画面を開いたままにしてください。60秒の動画は制作にも約60秒かかります。</p>
  <button id="reelGenerate" class="primary-button" type="button">リールを自動制作</button><button id="reelCancel" type="button" hidden>制作を中止</button>
  <p id="reelStatus" role="status" aria-live="polite"></p><progress id="reelProgress" max="100" value="0" aria-label="制作の進捗"></progress>
  <div id="reelResult" hidden><video id="reelPreview" controls playsinline preload="metadata"></video>
  <div class="reel-row"><a id="reelDownload" download="hanako-reel.mp4">MP4をダウンロード</a><button id="reelShare" type="button">iPhoneで保存・共有</button></div>
  <p>共有メニューから「ビデオを保存」を選択。無音の場合はInstagramで「＋」→「リール」→保存した動画→「音源」を選びます。Instagramを開くだけでは動画は転送されません。</p>
  <a href="https://www.instagram.com/" target="_blank" rel="noopener">Instagramを開く</a></div></div>`;
const $ = id => root.querySelector('#reel' + id);
let photos = [], audioFile = null, audioUrl = '', resultUrl = '', result = null, busy = false, cancel = false;
const instagramMusic = mountInstagramMusic(root);
let captionAnalysis = null;
const captionEditor = mountCaptionEditor(root, {
  getAnalysis: analyzeCaptionMusic,
  getAudio: () => $('Mode').value === 'file' && audioFile ? { element: $('AudioPreview'), start: Number($('Start').value) } : null,
  onPreviewStart: () => {root.dispatchEvent(new Event('reel-preview-stop'));instagramMusic.pause();},
  drawFrame: (ctx, time, cues, appearance) => {
    const captionPlan = { cues, appearance };
    if (photos.length >= 4) {
      const cuts = timeline(Number($('Duration').value), $('Style').value, captionAnalysis, Number($('Offset').value), Number($('Bpm').value));
      const text = { value: $('Text').value, start: Number($('TextStart').value), end: Number($('TextEnd').value), color: $('Color').value, y: Number($('Position').value) };
      draw(ctx, time, cuts, $('Style').value, captionAnalysis, text, captionPlan);
    } else {
      ctx.fillStyle = '#f8dce8'; ctx.fillRect(0, 0, 1080, 1920);
      if (photos[0]) { const img = photos[0].image, scale = Math.min(1080 / img.width, 1920 / img.height); ctx.drawImage(img, (1080 - img.width * scale) / 2, (1920 - img.height * scale) / 2, img.width * scale, img.height * scale); }
      drawCaption(ctx, time, cues, appearance);
    }
  },
});
const editStyles = mountEditStyles(root, {
  getAnalysis: analyzeCaptionMusic,
  getPhoto: () => photos[0]?.url,
  getPlan: analysis => currentEditPlan(analysis),
  drawPreview: (ctx, time, plan) => draw(ctx, time, plan.cuts, plan.style, captionAnalysis, { value: '' }, null, plan),
  onChange: () => captionEditor.render(),
});
function currentEditPlan(analysis) {
  const music = $('Mode').value === 'instagram' ? instagramMusic.getRhythm() : { bpm: 0, source: 'manual' };
  const generic = Number($('Bpm').value) || 0;
  return {...createEditPlan(Number($('Duration').value), $('Style').value, analysis, { offset: Number($('Offset').value), manualBpm: generic || music.bpm, manualSource: generic ? 'manual' : music.source, photoCount:photos.length }),effectLevel:Number($('EffectLevel')?.value||1)};
}
for (const id of ['Audio', 'Start', 'Mode', 'Duration']) $(id).addEventListener('change', () => { captionAnalysis = null; });
async function analyzeCaptionMusic() {
  captionAnalysis = null;
  if ($('Mode').value !== 'file' || !audioFile) return null;
  validateSource(audioFile);
  const context = new (window.AudioContext || window.webkitAudioContext)();
  try {
    await context.resume();
    const buffer = await decodeSource(context,audioFile);
    const start = Number($('Start').value), duration = Number($('Duration').value);
    if (!Number.isFinite(start) || start < 0 || start + duration > buffer.duration) throw Error('音楽の開始位置と動画の長さを確認してください。');
    const count = Math.floor(duration * buffer.sampleRate), from = Math.floor(start * buffer.sampleRate), mono = new Float32Array(count);
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) { const data = buffer.getChannelData(channel); for (let i = 0; i < count; i++) mono[i] += data[from + i] / buffer.numberOfChannels; }
    captionAnalysis = analyze(mono, buffer.sampleRate); return captionAnalysis;
  } finally { await context.close(); }
}
const status = text => { $('Status').textContent = text; };
function number(id, min, max) {
  const value = Number($(id).value);
  if (!Number.isFinite(value) || value < min || value > max) throw Error('数値の範囲を確認してください：' + $(id).parentElement.textContent);
  return value;
}
async function loadPhoto(file) {
  if (file.size > 25 * 1024 * 1024) throw Error('写真は1枚25MBまでです。');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image(); image.src = url; await image.decode();
    // Downsample for mobile memory; original aspect and full contents are preserved.
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 1920 / Math.max(image.width, image.height));
    canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    return { image: canvas, url, name: file.name };
  } catch { URL.revokeObjectURL(url); throw Error('写真を読み込めません。HEICの場合はJPGに変換してください。'); }
}
function photoList() {
  $('PhotoList').replaceChildren();
  photos.forEach((photo, index) => {
    const card = document.createElement('div');
    const img = document.createElement('img'); img.src = photo.url; img.alt = `写真${index + 1}`;
    card.append(img);
    for (const [label, action, disabled] of [
      ['←', () => { [photos[index - 1], photos[index]] = [photos[index], photos[index - 1]]; photoList(); }, index === 0],
      ['→', () => { [photos[index + 1], photos[index]] = [photos[index], photos[index + 1]]; photoList(); }, index === photos.length - 1],
      ['削除', () => { URL.revokeObjectURL(photo.url); photos.splice(index, 1); photoList(); }, false],
    ]) { const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.disabled = disabled; button.setAttribute('aria-label', `写真${index + 1} ${label}`); button.onclick = action; card.append(button); }
    $('PhotoList').append(card);
  });
  editStyles.refresh();
}
$('Photos').onchange = async event => {
  const files = [...event.target.files];
  $('Inputs').disabled = true;
  $('Generate').disabled = true;
  try {
    if (files.length + photos.length > 14) throw Error('写真は14枚までです。差し替える写真を先に削除してください。');
    for (const file of files) photos.push(await loadPhoto(file));
    status(`${photos.length}/14枚を選択しました。`);
  } catch (e) { status(e.message); }
  finally { photoList(); captionEditor.render(); event.target.value = ''; $('Inputs').disabled = false; $('Generate').disabled = false; }
};
$('Audio').onchange = event => {
  if (audioUrl) URL.revokeObjectURL(audioUrl);
  audioFile = event.target.files[0] || null;
  audioUrl = audioFile ? URL.createObjectURL(audioFile) : '';
  $('AudioPreview').src = audioUrl; $('Rights').checked = false;
  $('TranscribeConsent').checked=false;$('TranscribeStatus').textContent='';
  $('SourceStatus').textContent=audioFile?`${audioFile.name}：${isVideoSource(audioFile)?'動画の音声だけを取り込みます':'音楽ファイルを読み込みました'}。開始位置と長さを指定してください。`:'音楽・画面収録の動画を選んでください。';
};
let transcribing=false;
$('TranscribeCheck').onclick=async()=>{try{const cloud=new window.HanakoCloudSync(window.HANAKO_CLOUD_CONFIG||{});if(!cloud.signedIn)throw Error('画面上部の同期設定からOPSにログインしてください。');const token=await cloud.getAccessToken(),response=await fetch(`${cloud.url}/functions/v1/reel-transcribe`,{method:'POST',headers:{apikey:cloud.key,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({action:'status'}),signal:AbortSignal.timeout(20000)}),data=await response.json().catch(()=>({}));if(!response.ok)throw Error(data.error||'接続を確認できませんでした。');$('TranscribeStatus').textContent=data.configured?'文字起こしの接続設定は登録済みです。音楽・区間と送信への同意を確認して下書きを作れます。':'文字起こし用のOpenAI接続が未設定です。連携画面でOpenAI APIキーを登録してください。';}catch(e){$('TranscribeStatus').textContent=e.message;}};
$('Transcribe').onclick=async()=>{
  if(transcribing||busy)return;
  let context;
  try{
    validateSource(audioFile);if(!$('Rights').checked||!$('TranscribeConsent').checked)throw Error('音楽の利用権と音声送信への同意を確認してください。');
    if(captionEditor.hasText()&&!confirm('入力済みの歌詞を、認識した下書きに置き換えますか？'))return;
    const cloud=new window.HanakoCloudSync(window.HANAKO_CLOUD_CONFIG||{});if(!cloud.signedIn)throw Error('画面上部の同期設定からOPSにログインしてください。');
    const file=audioFile,start=Number($('Start').value),duration=Number($('Duration').value),previousLyrics=$('LyricsText').value;
    transcribing=true;$('Transcribe').disabled=true;$('Generate').disabled=true;root.dispatchEvent(new Event('reel-preview-stop'));captionEditor.pause();$('AudioPreview').pause();$('TranscribeStatus').textContent='選択区間の音声を取り出しています…';
    context=new (window.AudioContext||window.webkitAudioContext)();await context.resume();const buffer=await decodeSource(context,file);
    if(start+duration>buffer.duration+.001)throw Error('音楽の開始位置と動画の長さを確認してください。');
    const clips=[];for(let offset=0;offset<duration;offset+=30)clips.push({offset,clip:audioClipWav(buffer,start+offset,Math.min(30,duration-offset))});await context.close();context=null;
    const token=await cloud.getAccessToken(),data={cues:[]};
    for(const [i,{offset,clip}] of clips.entries()){
      const form=new FormData();form.set('file',clip,'reel-clip.wav');form.set('consent','true');
      $('TranscribeStatus').textContent=`歌声・音声を認識しています…（${i+1}/${clips.length}）`;
      const response=await fetch(`${cloud.url}/functions/v1/reel-transcribe`,{method:'POST',headers:{apikey:cloud.key,Authorization:`Bearer ${token}`},body:form,signal:AbortSignal.timeout(90000)}),part=await response.json().catch(()=>({}));if(!response.ok)throw Error(part.error||'音声認識に失敗しました。時間をおいて再試行してください。');
      data.cues.push(...(part.cues||[]).map(cue=>({...cue,start:cue.start+offset,end:cue.end+offset})));
    }
    if(file!==audioFile||start!==Number($('Start').value)||duration!==Number($('Duration').value)||$('Mode').value!=='file'||previousLyrics!==$('LyricsText').value)throw Error('素材・区間・歌詞が変わったため認識結果を反映しませんでした。もう一度実行してください。');
    captionEditor.importTranscript(data.cues);$('TranscribeStatus').textContent='歌詞・字幕の下書きを登録しました。下の字幕欄で内容・時刻・利用権を確認してください。';
  }catch(e){$('TranscribeStatus').textContent=e.message||'音声認識を開始できませんでした。';}finally{await context?.close();transcribing=false;$('Transcribe').disabled=false;$('Generate').disabled=busy;}
};
$('Duration').onchange = () => { $('TextEnd').value = $('Duration').value; };
$('Cancel').onclick = () => { cancel = true; };
document.addEventListener('visibilitychange', () => { if (busy && document.hidden) cancel = true; });
window.addEventListener('beforeunload', e => { if (busy) { e.preventDefault(); e.returnValue = ''; } });

function draw(ctx, t, cuts, style, analysis, text, captions = null, editPlan = null) {
  const plan = editPlan || currentEditPlan(analysis);
  drawPhotoScene(ctx, { photos, time: t, plan });
  if (text.value && t >= text.start && t <= text.end) {
    ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, (t - text.start) / .3, (text.end - t) / .3));
    ctx.font = 'bold 48px sans-serif'; ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.lineWidth = 7; ctx.strokeStyle = '#57404b'; ctx.fillStyle = text.color;
    const lines = text.value.split('\n').flatMap(line => {
      const result = []; let current = '';
      for (const char of line) { if (ctx.measureText(current + char).width > 800) { result.push(current); current = ''; } current += char; }
      result.push(current); return result;
    }).slice(0, 5);
    lines.forEach((line, i) => { const y = text.y + i * 64; ctx.strokeText(line, 510, y); ctx.fillText(line, 510, y); }); ctx.restore();
  }
  if (captions) drawCaption(ctx, t, captions.cues, captions.appearance);
}

$('Generate').onclick = async () => {
  if (busy) return;
  let context, stream, source, recorder, timer, animation, wake;
  try {
    if (photos.length < 4) throw Error('写真を4〜14枚選択してください。');
    const instagramChoice = instagramMusic.captureChoice();
    const mime = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a.40.2'].find(type => globalThis.MediaRecorder?.isTypeSupported(type));
    if (!mime || !HTMLCanvasElement.prototype.captureStream) throw Error('このブラウザではH.264/AACのMP4制作に対応していません。最新のiPhone Safariでお試しください。');
    const duration = number('Duration', 15, 60), start = number('Start', 0, 86400);
    const manual = $('Bpm').value ? number('Bpm', 50, 200) : 0, offset = number('Offset', -1, 1);
    const text = { value: $('Text').value, start: number('TextStart', 0, duration), end: number('TextEnd', 0, duration), color: $('Color').value, y: Number($('Position').value) };
    if (text.end <= text.start) throw Error('テキストの終了時刻は開始より後にしてください。');
    const sound = $('Mode').value === 'file';
    if (sound && (!audioFile || !$('Rights').checked)) throw Error('音楽ファイルと利用権の確認が必要です。');
    if (sound) validateSource(audioFile);
    busy = true; instagramMusic.setGenerating(true); cancel = false; $('Inputs').disabled = true; $('Generate').disabled = true; $('Cancel').hidden = false; $('Progress').value = 0;
    root.dispatchEvent(new Event('reel-preview-stop')); captionEditor.pause(); $('AudioPreview').pause(); instagramMusic.pause();
    context = new (window.AudioContext || window.webkitAudioContext)(); await context.resume();
    if (context.state !== 'running') throw Error('音声処理を開始できません。もう一度制作ボタンを押してください。');
    let buffer, analysis = null;
    status('音楽を解析しています…');
    if (sound) {
      buffer = await decodeSource(context,audioFile);
      if (buffer.duration < start + duration) throw Error('指定区間が音楽の長さを超えています。開始位置か動画の長さを変更してください。');
      const from = Math.floor(start * buffer.sampleRate), count = Math.floor(duration * buffer.sampleRate);
      const mono = new Float32Array(count);
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const data = buffer.getChannelData(channel);
        for (let i = 0; i < count; i++) mono[i] += data[from + i] / buffer.numberOfChannels;
      }
      analysis = analyze(mono, buffer.sampleRate);
    }
    if (cancel) throw Error('制作を中止しました。画面を開いたまま再試行してください。');
    captionAnalysis = analysis;
    const captions = captionEditor.capture(analysis);
    const plan = currentEditPlan(analysis);
    const style = plan.style;
    const cuts = plan.cuts;
    editStyles.setAnalysis(analysis); editStyles.updatePlan(plan);
    const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1920;
    const ctx = canvas.getContext('2d', { alpha: false }); draw(ctx, 0, cuts, style, analysis, text, captions, plan);
    stream = canvas.captureStream(30);
    if (sound) {
      source = context.createBufferSource(); source.buffer = buffer;
      const destination = context.createMediaStreamDestination(); source.connect(destination);
      destination.stream.getAudioTracks().forEach(track => stream.addTrack(track));
    }
    const chunks = [];
    recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: duration>30?4500000:6500000, audioBitsPerSecond: 192000 });
    const done = new Promise((resolve, reject) => {
      recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      recorder.onerror = () => reject(Error('動画の録画に失敗しました。ほかのアプリを閉じて再試行してください。'));
      recorder.onstop = resolve;
    });
    try { wake = await navigator.wakeLock?.request('screen'); } catch { /* Screen must stay foreground. */ }
    const started = context.currentTime;
    recorder.start(1000); if (source) source.start(started, start, duration);
    const label = plan.source === 'audio' ? `音声解析・推定 ${plan.bpm} BPM` : plan.bpm ? `${plan.source === 'music-tap' ? 'タップ' : '指定'} ${plan.bpm} BPM（拍位置は手動）` : sound ? '解析低信頼・仮テンポ（BPM調整を推奨）' : '無音・仮テンポ';
    const frame = () => { draw(ctx, Math.min(duration, context.currentTime - started), cuts, style, analysis, text, captions, plan); animation = requestAnimationFrame(frame); }; frame();
    timer = setInterval(() => {
      const t = context.currentTime - started;
      $('Progress').value = Math.min(99, t / duration * 100); status(`${label} ／ 制作中 ${Math.min(duration, Math.floor(t))}/${duration}秒`);
      if (cancel || t >= duration) { clearInterval(timer); cancelAnimationFrame(animation); if (recorder.state !== 'inactive') recorder.stop(); }
    }, 100);
    await done;
    if (cancel) throw Error('制作を中止しました。画面を開いたまま再試行してください。');
    const blob = new Blob(chunks, { type: recorder.mimeType });
    if (!blob.size) throw Error('動画を生成できませんでした。もう一度お試しください。');
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    result = new File([blob], 'hanako-reel.mp4', { type: 'video/mp4' }); resultUrl = URL.createObjectURL(result);
    instagramMusic.setResult(result, duration, instagramChoice);
    $('Preview').src = resultUrl; $('Download').href = resultUrl; $('Result').hidden = false; $('Progress').value = 100;
    status(`完成しました。${label} ／ ${styles[style].label} ／ 写真切り替え${cuts.length}カット${captions ? ` ／ 歌詞字幕${captions.cues.length}行` : ''}。再生して音と画質をご確認ください。`);
    $('Generate').textContent = 'リールを再生成';
  } catch (e) { status(e.message || '制作に失敗しました。もう一度お試しください。'); }
  finally {
    clearInterval(timer); cancelAnimationFrame(animation);
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    try { source?.stop(); } catch { /* Source already ended. */ }
    stream?.getTracks().forEach(track => track.stop());
    try { await context?.close(); } catch { /* Release remaining UI even if context was interrupted. */ }
    try { await wake?.release(); } catch { /* Lock may have been released by the OS. */ }
    busy = false; instagramMusic.setGenerating(false); $('Inputs').disabled = false; $('Generate').disabled = false; $('Cancel').hidden = true;
  }
};
$('Share').onclick = async () => {
  if (!result) return;
  try {
    if (navigator.canShare?.({ files: [result] })) await navigator.share({ files: [result], title: 'ハナコのリール' });
    else { $('Download').click(); status('ダウンロードした動画を写真アプリへ保存してください。'); }
  } catch (e) { if (e.name !== 'AbortError') status('共有できませんでした。MP4をダウンロードしてください。'); }
};

// Direct link for saved bookmarks and support instructions.
if (new URL(location.href).searchParams.get('view') === 'reels') {
  document.querySelector('.nav-tab[data-view="reels"]')?.click();
}

const museStudio=mountMuseReelMaker(root);
for(const entry of document.querySelectorAll('[data-open-muse]'))entry.addEventListener('click',()=>{document.querySelector('.nav-tab[data-view="reels"]')?.click();museStudio.open();});
if(new URL(location.href).searchParams.get('tool')==='muse'){document.querySelector('.nav-tab[data-view="reels"]')?.click();museStudio.open();}
