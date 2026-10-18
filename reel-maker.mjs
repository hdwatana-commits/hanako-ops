import { analyze, timeline, styles } from './reel-engine.mjs';
const root = document.querySelector('#reels');
root.innerHTML = `
  <div class="reel-wrap"><p class="eyebrow">Instagram → リール自動制作</p><h2>4枚の写真に、かわいいリズムを。</h2>
  <p>写真はそのまま。音楽に合わせてハートや光を重ねます。素材は端末内で処理します。</p>
  <fieldset id="reelInputs"><legend>リールの素材とスタイル</legend>
  <label>① 写真を4枚選択 <input id="reelPhotos" type="file" accept="image/jpeg,image/png,image/heic,image/heif" multiple></label>
  <p class="reel-note">写真全体を表示し、余白は背景ぼかしで補完します。HEICを読めない端末ではJPGに変換してください。</p>
  <div id="reelPhotoList" class="reel-photos"></div>
  <label>② 音楽 <select id="reelMode"><option value="file">利用権のある音楽ファイル</option><option value="silent">Instagramで音楽を後付け（無音）</option></select></label>
  <div id="reelAudioPanel"><input id="reelAudio" aria-label="音楽ファイル" type="file" accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,.mp3,.m4a,.wav"><audio id="reelAudioPreview" controls preload="metadata"></audio>
  <label><input id="reelRights" type="checkbox"> この音楽を動画で使用する権利を持っています</label>
  <label>音楽の開始位置（秒）<input id="reelStart" type="number" value="0" min="0" step="0.1"></label></div>
  <p id="reelMusicNotice" class="reel-note">Instagram公式楽曲検索は利用条件を確認中のため未接続です。クリエイターアカウントでも商用利用権は別途確認してください。</p>
  <div class="reel-row"><label>③ 編集スタイル<select id="reelStyle"><option value="hana">おまかせ（ハナ・かわいい系）</option><option value="cinema">おしゃれ・シネマ系</option><option value="pop">ポップ・テンポ系</option></select></label>
  <label>長さ<select id="reelDuration"><option>15</option><option>20</option><option>30</option></select>秒</label></div>
  <details><summary>テキスト・リズムを調整</summary><p>権利上問題のない文章を入力してください。改行できます。</p>
  <label>テキスト<textarea id="reelText" rows="3" maxlength="160" placeholder="今日のかわいいを、ひとつ。"></textarea></label>
  <div class="reel-row"><label>表示開始（秒）<input id="reelTextStart" type="number" min="0" value="0" step="0.1"></label><label>表示終了（秒）<input id="reelTextEnd" type="number" min="0" value="15" step="0.1"></label></div>
  <div class="reel-row"><label>文字色<select id="reelColor"><option value="#ffffff">白</option><option value="#ffb7d2">ピンク</option></select></label><label>文字位置<select id="reelPosition"><option value="1280">下（安全領域内）</option><option value="900">中央</option><option value="380">上（安全領域内）</option></select></label></div>
  <label>BPMを手動指定（空欄で自動解析）<input id="reelBpm" type="number" min="50" max="200" placeholder="例：120"></label>
  <label>ビート位置の補正（秒）<input id="reelOffset" type="number" min="-1" max="1" step="0.02" value="0"></label></details>
  </fieldset>
  <p class="reel-note">1080×1920・MP4。30fpsを要求して録画します。制作中はこの画面を開いたままにしてください。</p>
  <button id="reelGenerate" class="primary-button" type="button">リールを自動制作</button><button id="reelCancel" type="button" hidden>制作を中止</button>
  <p id="reelStatus" role="status" aria-live="polite"></p><progress id="reelProgress" max="100" value="0" aria-label="制作の進捗"></progress>
  <div id="reelResult" hidden><video id="reelPreview" controls playsinline preload="metadata"></video>
  <div class="reel-row"><a id="reelDownload" download="hanako-reel.mp4">MP4をダウンロード</a><button id="reelShare" type="button">iPhoneで保存・共有</button></div>
  <p>共有メニューから「ビデオを保存」を選択。無音の場合はInstagramで「＋」→「リール」→保存した動画→「音源」を選びます。Instagramを開くだけでは動画は転送されません。</p>
  <a href="https://www.instagram.com/" target="_blank" rel="noopener">Instagramを開く</a></div></div>`;
const $ = id => root.querySelector('#reel' + id);
let photos = [], audioFile = null, audioUrl = '', resultUrl = '', result = null, busy = false, cancel = false;
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
}
$('Photos').onchange = async event => {
  const files = [...event.target.files];
  $('Inputs').disabled = true;
  $('Generate').disabled = true;
  try {
    if (files.length + photos.length > 4) throw Error('写真は4枚までです。差し替える写真を先に削除してください。');
    for (const file of files) photos.push(await loadPhoto(file));
    status(`${photos.length}/4枚を選択しました。`);
  } catch (e) { status(e.message); }
  finally { photoList(); event.target.value = ''; $('Inputs').disabled = false; $('Generate').disabled = false; }
};
$('Audio').onchange = event => {
  if (audioUrl) URL.revokeObjectURL(audioUrl);
  audioFile = event.target.files[0] || null;
  audioUrl = audioFile ? URL.createObjectURL(audioFile) : '';
  $('AudioPreview').src = audioUrl; $('Rights').checked = false;
};
$('Mode').onchange = () => {
  $('AudioPanel').hidden = $('Mode').value === 'silent';
  $('MusicNotice').textContent = $('Mode').value === 'silent' ? '無音で生成します。音源を取得しないため、Instagramで追加する音楽との正確なビート同期は保証できません。' : 'Instagram公式楽曲検索は利用条件を確認中のため未接続です。利用権のある音楽を選択してください。';
};
$('Duration').onchange = () => { $('TextEnd').value = $('Duration').value; };
$('Cancel').onclick = () => { cancel = true; };
document.addEventListener('visibilitychange', () => { if (busy && document.hidden) cancel = true; });
window.addEventListener('beforeunload', e => { if (busy) { e.preventDefault(); e.returnValue = ''; } });

function draw(ctx, t, cuts, style, analysis, text) {
  let index = 0; while (index + 1 < cuts.length && cuts[index + 1] <= t) index++;
  const image = photos[index % 4].image;
  const elapsed = t - cuts[index], end = cuts[index + 1] || Number($('Duration').value);
  const p = elapsed / (end - cuts[index]);
  const accent = analysis?.peaks.some(b => Math.abs(b.time + Number($('Offset').value) - t) < .07);
  ctx.fillStyle = '#f5dfe7'; ctx.fillRect(0, 0, 1080, 1920);
  const cover = Math.max(1080 / image.width, 1920 / image.height);
  ctx.save(); ctx.filter = 'blur(32px) brightness(.85)';
  ctx.drawImage(image, (1080 - image.width * cover * 1.1) / 2, (1920 - image.height * cover * 1.1) / 2, image.width * cover * 1.1, image.height * cover * 1.1); ctx.restore();
  // Keep the whole image within a padded frame even at maximum zoom.
  const scale = Math.min(1000 / image.width, 1600 / image.height) * (1 + styles[style].zoom * (index % 2 ? 1 - p : p));
  ctx.save();
  ctx.globalAlpha = Math.min(1, elapsed / .13 + .15);
  ctx.drawImage(image, (1080 - image.width * scale) / 2 + Math.sin(p * Math.PI) * 7, (1920 - image.height * scale) / 2 + Math.cos(p * Math.PI) * 8, image.width * scale, image.height * scale); ctx.restore();
  if (style === 'hana') {
    for (let i = 0; i < 16; i++) {
      const x = (i * 173 + Math.sin(t * .6 + i) * 28) % 1080;
      const y = 1920 - ((t * (27 + i % 4 * 10) + i * 139) % 2100);
      ctx.save(); ctx.globalAlpha = .28 + .15 * Math.sin(t + i); ctx.fillStyle = '#ffc1d8'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      if (i % 3 === 0) { ctx.font = '40px sans-serif'; ctx.fillText('♥', x, y); }
      else if (i % 3 === 1) { ctx.beginPath(); ctx.arc(x, y, 18 + i % 4 * 7, 0, Math.PI * 2); ctx.stroke(); }
      else { ctx.font = '32px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText('✦', x, y); }
      ctx.restore();
    }
  }
  if (style === 'pop' && accent) { ctx.fillStyle = 'rgba(255,255,255,.13)'; ctx.fillRect(0, 0, 1080, 1920); }
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
}

$('Generate').onclick = async () => {
  if (busy) return;
  let context, stream, source, recorder, timer, animation, wake;
  try {
    if (photos.length !== 4) throw Error('写真を4枚選択してください。');
    const mime = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a.40.2'].find(type => globalThis.MediaRecorder?.isTypeSupported(type));
    if (!mime || !HTMLCanvasElement.prototype.captureStream) throw Error('このブラウザではH.264/AACのMP4制作に対応していません。最新のiPhone Safariでお試しください。');
    const duration = number('Duration', 15, 30), start = number('Start', 0, 86400);
    const manual = $('Bpm').value ? number('Bpm', 50, 200) : 0, offset = number('Offset', -1, 1);
    const text = { value: $('Text').value, start: number('TextStart', 0, duration), end: number('TextEnd', 0, duration), color: $('Color').value, y: Number($('Position').value) };
    if (text.end <= text.start) throw Error('テキストの終了時刻は開始より後にしてください。');
    const sound = $('Mode').value === 'file';
    if (sound && (!audioFile || !$('Rights').checked)) throw Error('音楽ファイルと利用権の確認が必要です。');
    if (sound && audioFile.size > 40 * 1024 * 1024) throw Error('音楽は40MB以下にしてください。');
    busy = true; cancel = false; $('Inputs').disabled = true; $('Generate').disabled = true; $('Cancel').hidden = false; $('Progress').value = 0;
    $('AudioPreview').pause();
    context = new (window.AudioContext || window.webkitAudioContext)(); await context.resume();
    if (context.state !== 'running') throw Error('音声処理を開始できません。もう一度制作ボタンを押してください。');
    let buffer, analysis = null;
    status('音楽を解析しています…');
    if (sound) {
      buffer = await context.decodeAudioData(await audioFile.arrayBuffer());
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
    const style = $('Style').value;
    const cuts = timeline(duration, style, analysis, offset, manual);
    const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1920;
    const ctx = canvas.getContext('2d', { alpha: false }); draw(ctx, 0, cuts, style, analysis, text);
    stream = canvas.captureStream(30);
    if (sound) {
      source = context.createBufferSource(); source.buffer = buffer;
      const destination = context.createMediaStreamDestination(); source.connect(destination);
      destination.stream.getAudioTracks().forEach(track => stream.addTrack(track));
    }
    const chunks = [];
    recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6500000, audioBitsPerSecond: 192000 });
    const done = new Promise((resolve, reject) => {
      recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      recorder.onerror = () => reject(Error('動画の録画に失敗しました。ほかのアプリを閉じて再試行してください。'));
      recorder.onstop = resolve;
    });
    try { wake = await navigator.wakeLock?.request('screen'); } catch { /* Screen must stay foreground. */ }
    const started = context.currentTime;
    recorder.start(1000); if (source) source.start(started, start, duration);
    const label = manual ? `手動 ${manual} BPM` : analysis?.reliable ? `推定 ${analysis.bpm || '—'} BPM` : sound ? 'ビート検出の信頼度が低いためBPM手動調整を推奨' : '無音・仮リズム';
    const frame = () => { draw(ctx, Math.min(duration, context.currentTime - started), cuts, style, analysis, text); animation = requestAnimationFrame(frame); }; frame();
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
    $('Preview').src = resultUrl; $('Download').href = resultUrl; $('Result').hidden = false; $('Progress').value = 100;
    status(`完成しました。${label} ／ 写真切り替え${cuts.length}カット。再生して音と画質をご確認ください。`);
    $('Generate').textContent = 'リールを再生成';
  } catch (e) { status(e.message || '制作に失敗しました。もう一度お試しください。'); }
  finally {
    clearInterval(timer); cancelAnimationFrame(animation);
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    try { source?.stop(); } catch { /* Source already ended. */ }
    stream?.getTracks().forEach(track => track.stop());
    try { await context?.close(); } catch { /* Release remaining UI even if context was interrupted. */ }
    try { await wake?.release(); } catch { /* Lock may have been released by the OS. */ }
    busy = false; $('Inputs').disabled = false; $('Generate').disabled = false; $('Cancel').hidden = true;
  }
};
$('Share').onclick = async () => {
  if (!result) return;
  try {
    if (navigator.canShare?.({ files: [result] })) await navigator.share({ files: [result], title: 'ハナコのリール' });
    else { $('Download').click(); status('ダウンロードした動画を写真アプリへ保存してください。'); }
  } catch (e) { if (e.name !== 'AbortError') status('共有できませんでした。MP4をダウンロードしてください。'); }
};
