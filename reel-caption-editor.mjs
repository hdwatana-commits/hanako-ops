import {buildCaptionPlan,validateCaptionCues,drawCaption} from './reel-captions.mjs?v=2';
export function mountCaptionEditor(root,{getAnalysis,getAudio,drawFrame,onPreviewStart=()=>{}}){
  const $=name=>root.querySelector('#reel'+name);
  $('Inputs').querySelector(':scope > details').insertAdjacentHTML('beforebegin',`<section class="reel-caption-editor" aria-label="歌詞字幕">
    <label class="reel-caption-toggle"><input id="reelLyricsEnabled" type="checkbox"> ♡ 歌詞に合わせて、かわいい字幕を入れる</label>
    <div id="reelLyricsControls" hidden><p class="reel-note">Instagram公式音楽から歌詞を自動取得する機能はありません。利用権のある歌詞を貼り付けるか、時刻付きLRCを読み込んでください。一度保存すれば、同じ曲の選択時に呼び出せます。</p>
    <p id="reelLyricsTrack" class="reel-note">公式音楽を選ぶと、曲ごとに歌詞を保存できます。</p>
    <label>動画に使う部分の歌詞<textarea id="reelLyricsText" rows="5" maxlength="2400" placeholder="1行目の歌詞\n2行目の歌詞\n3行目の歌詞"></textarea></label>
    <label>LRCファイルを読み込む<input id="reelLyricsFile" type="file" accept=".lrc,text/plain"></label>
    <label><input id="reelLyricsRights" type="checkbox"> この歌詞を字幕として表示する権利・許可があります</label>
    <div class="reel-row"><button id="reelLyricsSave" type="button" disabled>この曲に歌詞を保存</button><button id="reelLyricsLoad" type="button" disabled>保存した歌詞を呼び出す</button></div>
    <p class="reel-note">歌詞はこの端末・OPSユーザーごとに保存します。呼び出した後も、使用する部分と利用権を確認してください。曲の開始位置や表示時刻は毎回調整できます。</p>
    <div class="reel-row"><label>字幕のかわいさ<select id="reelLyricsStyle"><option value="pink">ふわふわピンク</option><option value="sparkle">キラキラホワイト</option><option value="karaoke">カラオケ風ポップ</option></select></label><label>字幕の位置<select id="reelLyricsPosition"><option value="1120">中央より下（安全領域内）</option><option value="800">中央</option><option value="440">上（安全領域内）</option></select></label></div>
    <div class="reel-row"><label>歌い始め・表示開始（動画の秒）<input id="reelLyricsStart" type="number" min="0" value="0" step="0.05"></label><label>表示終了（動画の秒）<input id="reelLyricsEnd" type="number" min="0" value="15" step="0.05"></label></div>
    <details><summary>LRC・字幕全体の調整</summary><label>LRCの時刻基準<select id="reelLyricsTimeBase"><option value="video">動画の先頭を0秒</option><option value="audio">音楽ファイルの先頭を0秒（開始位置を差し引く）</option></select></label><label>字幕全体をずらす（秒）<input id="reelLyricsOffset" type="number" min="-30" max="30" step="0.05" value="0"></label><p class="reel-note">LRCの行は次の時刻まで表示します。空の時刻行で字幕を消せます。カラオケ風の文字色変化は演出であり、単語ごとの歌唱認識ではありません。</p></details>
    <button id="reelLyricsAuto" type="button">歌詞の字幕を自動配置</button>
    <p id="reelLyricsStatus" role="status" aria-live="polite"></p>
    <p class="reel-note">自動配置は文字量と音楽のビートによる推定です。歌い出しは再生・タップで補正できます。Instagram公式音楽・後付け方式では、字幕と歌声の正確な同期を保証できません。</p>
    <canvas id="reelLyricsCanvas" width="270" height="480" aria-label="字幕のプレビュー"></canvas>
    <label>字幕プレビューの位置<input id="reelLyricsSeek" type="range" min="0" max="15" step="0.01" value="0"></label>
    <p id="reelLyricsClock">0.00 / 15.00 秒</p><div class="reel-row"><button id="reelLyricsPlay" type="button">字幕を再生</button><button id="reelLyricsStop" type="button">停止</button></div>
    <button id="reelLyricsTapStart" type="button">再生して、歌い出しをタップで合わせる</button><button id="reelLyricsTapNext" type="button" disabled>歌い出しで次の行を表示</button>
    <p class="reel-note">音声ファイル方式では選択した音楽も再生します。タップ合わせは、各行を歌い始める瞬間に下のボタンを押し、全行を合わせると確定します。</p>
    <details><summary>1行ずつ時刻を微調整</summary><div id="reelLyricsCues" class="reel-caption-cues"></div></details>
    </div></section>`);
  let plan=null,planSignature='',manual=false,working=false,playing=false,animation=0,previewTime=0,clockStart=0,clockTime=0,audioClock=null,taps=null,tapIncomplete=false,lastOffset=0;
  const say=message=>{$('LyricsStatus').textContent=message;};
  let lyricTrack=null;
  const lyricKey=()=>`hanako-reel-lyrics:${new window.HanakoCloudSync(window.HANAKO_CLOUD_CONFIG||{}).user?.id||'signed-out'}`;
  function savedLyrics(){try{const value=JSON.parse(localStorage.getItem(lyricKey())||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return {};}}
  function updateLibrary(){const active=$('Mode').value==='instagram'&&lyricTrack;$('LyricsSave').disabled=!active;$('LyricsLoad').disabled=!active||typeof savedLyrics()[lyricTrack.audio_id]?.text!=='string';$('LyricsTrack').textContent=active?`歌詞の保存先：${lyricTrack.title} ／ ${lyricTrack.artist||''}`:'公式音楽を選ぶと、曲ごとに歌詞を保存できます。';}
  function loadLyrics(){const saved=lyricTrack&&savedLyrics()[lyricTrack.audio_id];if(typeof saved?.text!=='string'||saved.text.length>2400)return;$('LyricsText').value=saved.text;$('LyricsRights').checked=false;invalidate();say('この曲に保存した歌詞を呼び出しました。使用する部分と利用権を確認し、「自動配置」を押してください。');}
  root.addEventListener('reel-music-selected',event=>{lyricTrack=event.detail;updateLibrary();if(!$('LyricsText').value.trim())loadLyrics();});
  $('Mode').addEventListener('change',updateLibrary);
  $('LyricsLoad').onclick=loadLyrics;
  $('LyricsSave').onclick=()=>{try{if(!lyricTrack||$('Mode').value!=='instagram')return;if(!$('LyricsText').value.trim())throw Error('保存する歌詞を入力してください。');if(!$('LyricsRights').checked)throw Error('歌詞を使用する権利・許可を確認してから保存してください。');const entries=Object.entries(savedLyrics()).filter(([id])=>id!==lyricTrack.audio_id).slice(-29);const library=Object.fromEntries(entries);library[lyricTrack.audio_id]={text:$('LyricsText').value,title:lyricTrack.title};localStorage.setItem(lyricKey(),JSON.stringify(library));updateLibrary();say('この曲に歌詞を保存しました。同じ曲を選ぶと、入力欄が空の場合に自動で呼び出します。');}catch(e){say(e.message||'歌詞を保存できません。端末の保存領域を確認してください。');}};
  const duration=()=>Number($('Duration').value);
  function options(){return {duration:duration(),start:Number($('LyricsStart').value),end:Number($('LyricsEnd').value),offset:Number($('LyricsOffset').value),timeBase:$('LyricsTimeBase').value,audioStart:$('Mode').value==='file'?Number($('Start').value):0};}
  const signature=()=>JSON.stringify({text:$('LyricsText').value,...options(),mode:$('Mode').value});
  const appearance=()=>({style:$('LyricsStyle').value,position:Number($('LyricsPosition').value)});
  function currentCues(){
    if(taps?.times.length){const index=taps.times.length-1;return [{text:taps.lines[index],start:taps.times[index],end:duration()}];}
    return plan?.cues||[];
  }
  function render(){
    const ctx=$('LyricsCanvas').getContext('2d');ctx.save();ctx.setTransform(.25,0,0,.25,0,0);
    drawFrame(ctx,previewTime,currentCues(),appearance());ctx.restore();
    $('LyricsSeek').value=String(previewTime);$('LyricsClock').textContent=`${previewTime.toFixed(2)} / ${duration().toFixed(2)} 秒`;
  }
  function stop(message=''){
    playing=false;cancelAnimationFrame(animation);audioClock?.pause();audioClock=null;
    $('LyricsPlay').textContent='字幕を再生';$('LyricsTapNext').disabled=true;
    if(taps){taps=null;say(message||'タップ合わせを中止しました。全行を合わせるまで元の時刻を保持します。');}
    else if(message)say(message);
    render();
  }
  function invalidate(){stop();tapIncomplete=false;plan=null;manual=false;planSignature='';$('LyricsCues').replaceChildren();say('歌詞・時刻・音楽を変更しました。「自動配置」を押すとプレビューできます。');render();}
  function table(){
    $('LyricsCues').replaceChildren();
    plan?.cues.forEach((cue,index)=>{
      const row=document.createElement('div');row.className='reel-caption-cue';
      const line=document.createElement('strong');line.textContent=`${index+1}. ${cue.text}`;row.append(line);
      for(const [key,label]of[['start','開始'],['end','終了']]){
        const field=document.createElement('label');field.textContent=label+'（秒）';
        const input=document.createElement('input');input.type='number';input.min='0';input.max=String(duration());input.step='.05';input.value=String(Math.round(cue[key]*1000)/1000);input.setAttribute('aria-label',`${index+1}行目 ${label}`);
        input.onchange=()=>{stop();cue[key]=Number(input.value);manual=true;planSignature=signature();try{validateCaptionCues(plan.cues,duration());say('行ごとの時刻を保存しました。');}catch(e){say(e.message);}render();};field.append(input);row.append(field);
      }
      const jump=document.createElement('button');jump.type='button';jump.textContent='この行を確認';jump.onclick=()=>{stop();previewTime=Math.max(0,Math.min(duration(),cue.start+.05));render();};row.append(jump);$('LyricsCues').append(row);
    });
  }
  function build(analysis=null){
    plan=buildCaptionPlan($('LyricsText').value,{...options(),analysis});tapIncomplete=false;planSignature=signature();manual=false;table();say(plan.message);render();return plan;
  }
  async function auto(){
    if(working)return;working=true;$('LyricsAuto').disabled=true;stop();
    try{say('字幕のタイミングを計算しています…');const previous=signature();const analysis=await getAnalysis();if(previous!==signature())throw Error('入力が変わりました。もう一度自動配置してください。');build(analysis);}
    catch(e){say(e.message);}finally{working=false;$('LyricsAuto').disabled=false;}
  }
  function time(){return Math.max(0,Math.min(duration(),audioClock?audioClock.currentTime-options().audioStart:clockTime+(performance.now()-clockStart)/1000));}
  async function play(){
    if(playing){stop();return false;}
    if(working)throw Error('字幕の自動配置が終わるまでお待ちください。');
    if(!plan||planSignature!==signature())build();
    if(previewTime>=duration()-.02)previewTime=0;
    onPreviewStart();const source=getAudio();
    if(source){source.element.currentTime=source.start+previewTime;try{await source.element.play();}catch{throw Error('音楽を再生できません。音声ファイルを確認し、もう一度再生してください。');}audioClock=source.element;}
    clockTime=previewTime;clockStart=performance.now();playing=true;$('LyricsPlay').textContent='一時停止';
    const frame=()=>{if(!playing)return;previewTime=time();render();if(previewTime>=duration()-.02||audioClock?.ended){stop();return;}animation=requestAnimationFrame(frame);};frame();return true;
  }
  $('LyricsEnabled').onchange=()=>{$('LyricsControls').hidden=!$('LyricsEnabled').checked;if(!$('LyricsEnabled').checked)stop();else render();};
  $('LyricsAuto').onclick=auto;
  $('LyricsPlay').onclick=async()=>{try{await play();}catch(e){say(e.message);}};
  $('LyricsStop').onclick=()=>stop();
  $('LyricsSeek').oninput=()=>{const next=Number($('LyricsSeek').value);stop();previewTime=next;render();};
  for(const field of['LyricsText','LyricsStart','LyricsEnd','LyricsTimeBase'])$(field).addEventListener('input',invalidate);
  $('LyricsOffset').addEventListener('input',()=>{
    const next=Number($('LyricsOffset').value),delta=next-lastOffset;lastOffset=next;
    if(manual&&plan){stop();plan.cues=plan.cues.map(cue=>({...cue,start:cue.start+delta,end:cue.end+delta}));planSignature=signature();table();try{validateCaptionCues(plan.cues,duration());say('手動で合わせた字幕を、まとめてずらしました。');}catch(e){say(e.message);}render();}else invalidate();
  });
  for(const field of['LyricsStyle','LyricsPosition'])$(field).addEventListener('change',render);
  for(const field of['Start','Audio','Mode'])$(field).addEventListener('change',invalidate);
  $('Duration').addEventListener('change',()=>{$('LyricsEnd').value=String(duration());$('LyricsSeek').max=String(duration());previewTime=Math.min(previewTime,duration());invalidate();});
  $('LyricsFile').onchange=async event=>{
    try{const file=event.target.files[0];if(!file)return;if(file.size>64000)throw Error('LRCファイルは64KB以下にしてください。');const text=await file.text();if(text.length>2400)throw Error('LRCは動画に使う部分だけ、2400文字以内にしてください。');$('LyricsText').value=text.replace(/^\uFEFF/,'');$('LyricsRights').checked=false;invalidate();say('LRCを読み込みました。時刻基準と利用権を確認し、「自動配置」を押してください。');}catch(e){say(e.message);}finally{event.target.value='';}
  };
  $('LyricsTapStart').onclick=async()=>{
    try{stop();if(!plan||planSignature!==signature())build();const lines=plan.cues.map(cue=>cue.text);previewTime=Math.max(0,options().start);if(!(await play()))return;taps={lines,times:[]};tapIncomplete=true;$('LyricsTapNext').disabled=false;$('LyricsTapNext').textContent=`1/${lines.length}行目の歌い出しで押す`;$('LyricsTapNext').focus({preventScroll:true});say('歌い始める瞬間に、行送りボタンを押してください。全行を合わせると時刻を確定します。');}
    catch(e){say(e.message);}
  };
  $('LyricsTapNext').onclick=()=>{
    if(!playing||!taps)return;const value=time();
    if(taps.times.length&&value-taps.times.at(-1)<.1){say('字幕は0.1秒以上あけてください。');return;}
    if(options().end-value<.1){say('動画の終了直前です。停止して字幕の表示範囲を調整してください。');return;}
    taps.times.push(value);
    if(taps.times.length===taps.lines.length){
      plan={cues:taps.lines.map((text,index)=>({text,start:taps.times[index],end:taps.times[index+1]??options().end})),basis:'tap'};
      plan.cues=validateCaptionCues(plan.cues,duration());planSignature=signature();manual=true;taps=null;tapIncomplete=false;$('LyricsTapNext').disabled=true;table();say('全行の歌い出しをタップで合わせました。この時刻を動画に使います。');
    }else{$('LyricsTapNext').textContent=`${taps.times.length+1}/${taps.lines.length}行目の歌い出しで押す`;}
    render();
  };
  $('AudioPreview').addEventListener('ended',()=>{if(playing)stop();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  return {
    hasText(){return Boolean($('LyricsText').value.trim());},
    importTranscript(cues){stop();const checked=validateCaptionCues(cues,duration());if(!checked.length)throw Error('歌詞・音声を認識できませんでした。別の区間か、手入力をお試しください。');$('LyricsEnabled').checked=true;$('LyricsControls').hidden=false;$('LyricsText').value=checked.map(c=>c.text).join('\n');$('LyricsStart').value='0';$('LyricsEnd').value=String(duration());$('LyricsOffset').value='0';lastOffset=0;$('LyricsTimeBase').value='video';$('LyricsRights').checked=false;plan={cues:checked,basis:'transcription'};manual=true;tapIncomplete=false;planSignature=signature();table();previewTime=0;say('音声認識の下書きです。歌詞の間違い・抜け・時刻を確認し、使用する権利を確認してください。');render();},
    pause(){stop();},
    capture(analysis){
      if(!$('LyricsEnabled').checked)return null;
      if(working)throw Error('字幕の自動配置が終わるまでお待ちください。');
      if(tapIncomplete)throw Error('タップ合わせが途中です。全行を合わせるか「自動配置」で元の時刻に戻してください。');
      if(!$('LyricsRights').checked)throw Error('歌詞を字幕として使う権利・許可を確認してください。');
      if(!manual||planSignature!==signature())build(analysis);
      return {cues:validateCaptionCues(plan.cues,duration()).map(cue=>({...cue})),appearance:appearance(),basis:plan.basis};
    },
    render,
  };
}
