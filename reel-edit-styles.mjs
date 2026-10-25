import {themeStories} from './reel-theme-stage.mjs?v=1';
import {styles} from './reel-engine.mjs?v=5';
export function mountEditStyles(root,{getAnalysis,getPlan,getPhoto,drawPreview,onChange}){
  const $=name=>root.querySelector('#reel'+name),select=$('Style');
  select.replaceChildren();const auto=document.createElement('option');auto.value='auto';auto.textContent='おまかせ（曲のテンポ・強弱で選ぶ）';select.append(auto);
  for(const[key,style]of Object.entries(styles)){const option=document.createElement('option');option.value=key;option.textContent=style.label;select.append(option);}select.value='auto';
  select.closest('.reel-row').insertAdjacentHTML('afterend',`<div id="reelStyleGallery" class="reel-style-gallery" aria-label="編集スタイルの見本"></div><p id="reelStyleDescription" class="reel-note"></p><p id="reelStyleStory" class="reel-note" aria-live="polite"></p>
    <button id="reelAnalyzeEdit" type="button">♪ 音楽に合わせた編集を確認</button><p id="reelEditSummary" role="status" aria-live="polite">音声ファイルは制作時にテンポ・強弱を解析します。Instagram公式音楽は曲のBPM指定・タップに対応します。</p>
    <label>演出の華やかさ<select id="reelEffectLevel"><option value="1">華やか（おすすめ）</option><option value="1.35">もっとダイナミック</option><option value="0.55">やさしく</option></select></label>
    <details id="reelStylePreviewDetails" open><summary>動く仕上がりプレビュー</summary><canvas id="reelStyleCanvas" width="270" height="480" aria-label="編集スタイルのプレビュー"></canvas><button id="reelStylePlay" type="button">▶ この演出を再生</button><p id="reelStyleClock" role="status"></p><p class="reel-note">写真を選び、再生すると切り替え・ズーム・飾りの動きを確認できます。プレビューは無音です。Instagram公式音楽との正確な同期を確認するものではありません。</p></details>`);
  let analysis=null,playing=false,animation=0,started=0,lastFrame=0;
  function stop(){playing=false;cancelAnimationFrame(animation);$('StylePlay').textContent='▶ この演出を再生';}
  function paint(time,plan){const ctx=$('StyleCanvas').getContext('2d');ctx.save();ctx.setTransform(.25,0,0,.25,0,0);drawPreview(ctx,time,plan);ctx.restore();}
  $('StylePlay').onclick=()=>{if(playing){stop();return;}playing=true;started=performance.now();lastFrame=0;$('StylePlay').textContent='■ プレビューを止める';const tick=now=>{if(!playing)return;if(document.hidden||!root.getClientRects().length||!$('StylePreviewDetails').open){stop();return;}try{if(now-lastFrame>50){const plan=getPlan(analysis),time=((now-started)/1000)%plan.duration;paint(time,plan);$('StyleClock').textContent=`${time.toFixed(1)} / ${plan.duration} 秒・無音プレビュー`;lastFrame=now;}}catch(e){stop();$('EditSummary').textContent=e.message;return;}animation=requestAnimationFrame(tick);};animation=requestAnimationFrame(tick);};
  $('EffectLevel').onchange=()=>{refresh();onChange();};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  root.addEventListener('reel-preview-stop',stop);
  for(const[key,style]of Object.entries(styles)){
    const button=document.createElement('button');button.type='button';button.dataset.style=key;button.setAttribute('aria-pressed','false');
    const art=document.createElement('span');art.className=`reel-style-art reel-style-${key}`;art.style.background=`linear-gradient(145deg,${style.palette[0]},${style.palette[1]})`;
    const image=document.createElement('img');image.alt='';image.hidden=true;image.style.filter=style.filter;art.append(image);
    const mark=document.createElement('span');mark.className='reel-style-mark';mark.textContent={hana:'♡',cinema:'◌',pop:'✦',editorial:'Aa',clean:'—',film:'35',airy:'☁',luxe:'H',street:'↗',travel:'✉'}[key];art.append(mark);
    const name=document.createElement('strong');name.textContent=style.label;const description=document.createElement('small');description.textContent=style.description;button.append(art,name,description);button.onclick=()=>{select.value=key;select.dispatchEvent(new Event('change',{bubbles:true}));};$('StyleGallery').append(button);
  }
  function refresh(){
    const source=getPhoto();root.querySelectorAll('#reelStyleGallery button').forEach(button=>{button.setAttribute('aria-pressed',String(button.dataset.style===select.value));const img=button.querySelector('img');img.hidden=!source;if(source)img.src=source;});
    $('StyleDescription').textContent=select.value==='auto'?'おまかせ：解析したBPM・強弱に合わせてスタイルとカット間隔を選びます。ジャンルや歌詞を認識する機能ではありません。':styles[select.value].description;
    try{const plan=getPlan(analysis);$('StyleStory').textContent='演出の流れ：'+themeStories[styles[plan.style].family];if($('StylePreviewDetails').open&&!playing)paint(Math.min(1,plan.duration/3),plan);}catch(e){$('EditSummary').textContent=e.message;}
  }
  function updatePlan(plan){
    const source=plan.source==='audio'?`音声解析・推定 ${plan.bpm} BPM` :plan.source==='music-tap'?`試聴しながらタップ・${plan.bpm} BPM（拍の位置は未検証）`:plan.bpm?`指定 ${plan.bpm} BPM（拍の位置は手動）`:'音源未解析・仮の120 BPM（同期保証なし）';
    $('EditSummary').textContent=`${source} ／ ${styles[plan.style].label} ／ ${plan.shots.length}カット${plan.source==='audio'&&plan.contrast>.12?' ／ 強弱でカット間隔を調整':''}`;
    root.querySelectorAll('#reelStyleGallery button').forEach(button=>button.classList.toggle('recommended',select.value==='auto'&&button.dataset.style===plan.style));
    refresh();
  }
  select.addEventListener('change',()=>{try{updatePlan(getPlan(analysis));onChange();}catch(e){$('EditSummary').textContent=e.message;}});
  $('StylePreviewDetails').ontoggle=()=>{if(!$('StylePreviewDetails').open)stop();refresh();};
  $('AnalyzeEdit').onclick=async()=>{$('AnalyzeEdit').disabled=true;try{$('EditSummary').textContent='曲のテンポ・強弱を解析しています…';analysis=await getAnalysis();updatePlan(getPlan(analysis));onChange();}catch(e){$('EditSummary').textContent=e.message;}finally{$('AnalyzeEdit').disabled=false;}};
  for(const name of['Audio','Start','Duration','Mode'])$(name).addEventListener('change',()=>{analysis=null;refresh();$('EditSummary').textContent='素材が変わりました。「音楽に合わせた編集を確認」で更新できます。';});
  for(const name of['Bpm','Offset'])$(name).addEventListener('input',()=>{try{updatePlan(getPlan(analysis));}catch(e){$('EditSummary').textContent=e.message;}});
  root.addEventListener('reel-rhythm-change',()=>{try{updatePlan(getPlan(analysis));}catch(e){$('EditSummary').textContent=e.message;}});
  refresh();return{refresh,updatePlan,setAnalysis(value){analysis=value;}};
}
