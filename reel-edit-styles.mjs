import {styles} from './reel-engine.mjs?v=2';
export function mountEditStyles(root,{getAnalysis,getPlan,getPhoto,drawPreview,onChange}){
  const $=name=>root.querySelector('#reel'+name),select=$('Style');
  select.replaceChildren();const auto=document.createElement('option');auto.value='auto';auto.textContent='おまかせ（曲のテンポ・強弱で選ぶ）';select.append(auto);
  for(const[key,style]of Object.entries(styles)){const option=document.createElement('option');option.value=key;option.textContent=style.label;select.append(option);}select.value='auto';
  select.closest('.reel-row').insertAdjacentHTML('afterend',`<div id="reelStyleGallery" class="reel-style-gallery" aria-label="編集スタイルの見本"></div><p id="reelStyleDescription" class="reel-note"></p>
    <button id="reelAnalyzeEdit" type="button">♪ 音楽に合わせた編集を確認</button><p id="reelEditSummary" role="status" aria-live="polite">音声ファイルは制作時にテンポ・強弱を解析します。Instagram公式音楽は曲のBPM指定・タップに対応します。</p>
    <details id="reelStylePreviewDetails"><summary>このスタイルの見え方をプレビュー</summary><canvas id="reelStyleCanvas" width="270" height="480" aria-label="編集スタイルのプレビュー"></canvas><p class="reel-note">写真は全体を維持します。動きと切り替えは完成動画で確認できます。</p></details>`);
  let analysis=null;
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
    try{const plan=getPlan(analysis);if($('StylePreviewDetails').open){const ctx=$('StyleCanvas').getContext('2d');ctx.save();ctx.setTransform(.25,0,0,.25,0,0);drawPreview(ctx,Math.min(1,plan.duration/3),plan);ctx.restore();}}catch(e){$('EditSummary').textContent=e.message;}
  }
  function updatePlan(plan){
    const source=plan.source==='audio'?`音声解析・推定 ${plan.bpm} BPM` :plan.source==='music-tap'?`試聴しながらタップ・${plan.bpm} BPM（拍の位置は未検証）`:plan.bpm?`指定 ${plan.bpm} BPM（拍の位置は手動）`:'音源未解析・仮の120 BPM（同期保証なし）';
    $('EditSummary').textContent=`${source} ／ ${styles[plan.style].label} ／ ${plan.shots.length}カット${plan.source==='audio'&&plan.contrast>.12?' ／ 強弱でカット間隔を調整':''}`;
    root.querySelectorAll('#reelStyleGallery button').forEach(button=>button.classList.toggle('recommended',select.value==='auto'&&button.dataset.style===plan.style));
    refresh();
  }
  select.addEventListener('change',()=>{try{updatePlan(getPlan(analysis));onChange();}catch(e){$('EditSummary').textContent=e.message;}});
  $('StylePreviewDetails').ontoggle=refresh;
  $('AnalyzeEdit').onclick=async()=>{$('AnalyzeEdit').disabled=true;try{$('EditSummary').textContent='曲のテンポ・強弱を解析しています…';analysis=await getAnalysis();updatePlan(getPlan(analysis));onChange();}catch(e){$('EditSummary').textContent=e.message;}finally{$('AnalyzeEdit').disabled=false;}};
  for(const name of['Audio','Start','Duration','Mode'])$(name).addEventListener('change',()=>{analysis=null;refresh();$('EditSummary').textContent='素材が変わりました。「音楽に合わせた編集を確認」で更新できます。';});
  for(const name of['Bpm','Offset'])$(name).addEventListener('input',()=>{try{updatePlan(getPlan(analysis));}catch(e){$('EditSummary').textContent=e.message;}});
  root.addEventListener('reel-rhythm-change',()=>{try{updatePlan(getPlan(analysis));}catch(e){$('EditSummary').textContent=e.message;}});
  refresh();return{refresh,updatePlan,setAnalysis(value){analysis=value;}};
}
