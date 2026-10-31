/** Navigation and presentation only. Existing controls own generation, storage and publishing. */
export const snsStudioModes=[
 {id:'instagram',icon:'◎',title:'Instagramの写真投稿',detail:'世界観をそろえた写真とキャプション',tag:'3枚 / おまかせ4枚'},
 {id:'threads',icon:'@',title:'Threadsの写真投稿',detail:'日常の写真と、会話が生まれるひとこと',tag:'2・3・4・8枚'},
 {id:'ab',icon:'A/B',title:'2択で聞く投稿',detail:'服・髪型・表情などを2枚で比較',tag:'AとBを別々に'},
 {id:'photobook',icon:'▤',title:'写真集を作る',detail:'テーマをそろえた、まとまりのある連作',tag:'8〜30枚'},
 {id:'free',icon:'✧',title:'自由に企画する',detail:'ハナの日常を、好きな設定で組み立てる',tag:'テーマから選ぶ'},
 {id:'commerce',icon:'▱',title:'商品を紹介する',detail:'楽天URL・登録商品から投稿を作る',tag:'Instagram / Threads / X'}
];
export function inferSnsStudioMode({hanako,instagram,threads,ab,photobook}){
 if(!hanako)return'commerce';if(photobook)return'photobook';if(instagram)return'instagram';if(threads)return ab?'ab':'threads';return'free';
}
const steps=[['plan','企画','何を・どこへ投稿する？','投稿形式とテーマを決めましょう。'],['photos','写真・見た目','写真の世界観をつくる','本人写真、服、髪型、場所を選んでAIへ渡す指示を準備します。'],['text','文章','伝わる投稿文に整える','目的と雰囲気を選び、投稿文や別案を作れます。'],['result','完成・保存','仕上がりを確認する','投稿文を編集し、画像と一緒に保存・予定・投稿へ進みます。'],['daily','毎日の下書き','毎日の下書きをまとめて管理','自動作成の設定と、確認待ちの投稿をここにまとめました。'],['settings','こだわり設定','いつもの発信を、自分らしく','キャラクター・過去投稿の学習・詳細な表現を調整できます。']];
export function mountSnsStudio(root){
 if(!root||root.dataset.studioMounted)return null;
 const oldLayout=root.querySelector('.three-column'),source=oldLayout?.querySelector(':scope > .panel'),outputPanel=oldLayout?.querySelector('.output-panel'),review=oldLayout?.querySelector(':scope > .panel:last-child');
 if(!source||!outputPanel||!review)return null;
 const $=id=>document.getElementById(id),originalControls=[...root.querySelectorAll('input[id],select[id],textarea[id],button[id]')];
 root.dataset.studioMounted='true';root.classList.add('sns-studio');
 const header=document.createElement('section');header.id='snsStudioHeader';header.innerHTML=`<div class="sns-studio-hero"><p class="sns-studio-eyebrow">HANAKO / SNS POST STUDIO</p><h2>今日の「伝えたい」を、かたちに。</h2><p>投稿の種類を選んで、写真と文章をひとつずつ。いつもの設定も、そのまま使えます。</p><div class="sns-hero-actions"><button type="button" data-sns-go="result">作成中の投稿を見る</button><button type="button" data-sns-go="daily">毎日の下書き</button></div></div><h3 class="sns-mode-heading">何を作りますか？</h3><div class="sns-mode-grid" role="group" aria-label="作りたい投稿"></div><div class="sns-studio-utility"></div><div id="snsStudioCurrent" class="sns-current-summary" aria-live="polite"></div>`;
 const modeGrid=header.querySelector('.sns-mode-grid');
 for(const mode of snsStudioModes){const button=document.createElement('button');button.type='button';button.className='sns-mode-card';button.dataset.snsMode=mode.id;button.setAttribute('aria-pressed','false');button.innerHTML=`<span class="sns-mode-icon" aria-hidden="true">${mode.icon}</span><strong>${mode.title}</strong><small>${mode.detail}</small><span class="sns-mode-tag">${mode.tag}</span>`;button.onclick=()=>chooseMode(mode.id);modeGrid.append(button);}
 const nav=document.createElement('nav');nav.className='sns-step-nav';nav.setAttribute('aria-label','SNS投稿の作成手順');nav.setAttribute('role','tablist');
 const layout=document.createElement('div');layout.className='sns-stage-layout';const deck=document.createElement('div');deck.className='sns-stage-deck';
 const panels=new Map(),bodies=new Map(),tabs=new Map();
 for(const [index,[id,label,title,note]]of steps.entries()){
  const button=document.createElement('button');button.type='button';button.dataset.snsStudioStep=id;button.id='snsStudioTab-'+id;button.setAttribute('role','tab');button.setAttribute('aria-controls','snsStage-'+id);button.setAttribute('aria-selected','false');button.innerHTML=`<span class="sns-step-number">${index<4?index+1:'·'}</span>${label}`;button.onclick=()=>showStep(id);nav.append(button);tabs.set(id,button);
  const panel=document.createElement('section');panel.id='snsStage-'+id;panel.className='sns-stage';panel.dataset.snsPanel=id;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);panel.hidden=true;panel.innerHTML=`<div class="sns-stage-heading"><h3 tabindex="-1">${title}</h3><p>${note}</p></div><div class="sns-stage-body"></div>`;panels.set(id,panel);bodies.set(id,panel.querySelector('.sns-stage-body'));deck.append(panel);
 }
 const summary=document.createElement('aside');summary.className='sns-summary-panel';summary.setAttribute('aria-label','今回の投稿の設定と進み具合');summary.innerHTML='<div class="sns-section-card"><p class="sns-studio-eyebrow">YOUR POST</p><h3 id="snsStudioModeTitle">今回の投稿</h3><div id="snsStudioLookSummary"></div><div id="snsStudioReadiness"></div><div class="sns-summary-actions"><button type="button" data-sns-go="photos">写真を選ぶ</button><button type="button" data-sns-go="result">完成稿へ</button><button type="button" id="snsStudioChangeMode">投稿の種類を変更</button></div></div>';
 layout.append(deck,summary);root.prepend(header,nav,layout);
 function updateStickyOffsets(){
  const topbar=document.querySelector('.topbar'),top=Math.ceil((topbar?.getBoundingClientRect().height||88)+8);
  root.style.setProperty('--sns-studio-top',top+'px');
  root.style.setProperty('--sns-studio-content-top',(top+nav.getBoundingClientRect().height+20)+'px');
 }
 if(typeof ResizeObserver!=='undefined'){const sizes=new ResizeObserver(updateStickyOffsets);sizes.observe(nav);const topbar=document.querySelector('.topbar');if(topbar)sizes.observe(topbar);}
 window.addEventListener('resize',updateStickyOffsets);requestAnimationFrame(updateStickyOffsets);
 const nativeModes=document.createElement('div');nativeModes.hidden=true;nativeModes.id='snsStudioNativeModes';root.append(nativeModes);
 for(const id of['snsHanakoMode','snsHanakoInstagramMode','snsHanakoThreadsMode','snsHanakoThreadsAbMode','snsHanakoPhotobookMode']){const input=$(id);if(input)nativeModes.append(input.closest('label')||input);}
 function card(step,title,note='',classes=''){
  const box=document.createElement('section');box.className='sns-section-card '+classes;const head=document.createElement('div');head.className='sns-section-heading';const h=document.createElement('h4');h.textContent=title;head.append(h);if(note){const p=document.createElement('p');p.textContent=note;head.append(p);}box.append(head);bodies.get(step).append(box);return box;
 }
 function take(id,target){const node=$(id);if(node)target.append(node);return node;}
 function field(id,target,labelText){
  const control=$(id);if(!control)return null;const box=document.createElement('div');box.className='sns-field';
  let label=control.labels?.[0]||null;
  if(!label){let previous=control.previousElementSibling;if(previous?.matches('.hanako-picker-open'))previous=previous.previousElementSibling;if(previous?.matches('label.field-label')&&!previous.htmlFor)label=previous;}
  if(label?.contains(control)){box.append(label);}else{if(!label){label=document.createElement('label');label.textContent=labelText||control.getAttribute('aria-label')||id;}label.htmlFor=id;box.append(label);const picker=root.querySelector(`[data-hanako-picker="${id}"]`);if(picker)box.append(picker);box.append(control);}
  if(labelText)label.childNodes.forEach(node=>{if(node.nodeType===3&&node.textContent.trim())node.textContent=labelText;});
  if(control.tagName==='TEXTAREA')box.classList.add('sns-wide');target.append(box);return box;
 }
 function detail(step,title){const d=document.createElement('details');d.className='sns-section-card';const s=document.createElement('summary');s.textContent=title;d.append(s);bodies.get(step).append(d);return d;}
 const destination=card('plan','投稿先と目的');destination.id='snsStudioDestination';const platformLabel=document.createElement('p');platformLabel.textContent='投稿先';platformLabel.className='field-label';const platformWrap=document.createElement('div');platformWrap.id='snsStudioPlatform';platformWrap.append(platformLabel);take('platformTabs',platformWrap);destination.append(platformWrap);field('goalSelect',destination,'投稿の目的');
 const ideas=take('snsHanakoIdeas',bodies.get('plan'));if(ideas)ideas.classList.add('sns-section-card');take('snsHanakoTimeRecommendation',bodies.get('plan'));
 const quick=card('plan','迷ったら、おまかせセット','組み合わせだけを提案します。画像作成や投稿は、この後に自分で進められます。');const quickGrid=document.createElement('div');quickGrid.className='sns-quick-action-grid';quick.append(quickGrid);
 for(const [id,label,status]of[['createHanakoBuzzKawaii','Threads・バズかわ4枚の設定','snsHanakoBuzzKawaiiStatus'],['createHanakoInstagramBuzzKawaii','Instagram・室内4枚の設定','snsHanakoInstagramBuzzStatus'],['createHanakoInstagramOutingBuzz','Instagram・お出かけ4枚の設定','snsHanakoInstagramOutingBuzzStatus'],['createHanakoGrocerStory','Threads・八百屋ストーリー8枚の設定','snsHanakoGrocerStoryStatus']]){
  const box=document.createElement('div');const button=take(id,box);if(button){button.textContent=label;button.classList.remove('primary');}take(status,box);quickGrid.append(box);
 }
 const commerce=card('plan','紹介する商品','URLから読み込むか、登録済みの商品を選びます。','social-commerce-only');const importer=$('socialProductUrl')?.closest('.social-url-import');if(importer)commerce.append(importer);field('selectedProduct',commerce,'登録済みの商品');field('angleSelect',commerce,'切り口・投稿の種類');field('audienceSelect',commerce,'届けたい相手');take('fashionSettings',commerce);take('travelSettings',commerce);const concepts=$('snsConceptCards')?.closest('.sns-concept-studio');if(concepts)commerce.append(concepts);
 const modeOptions=card('photos','選んだ投稿形式の設定');modeOptions.classList.add('sns-mode-options');modeOptions.id='snsStudioModeOptions';for(const id of['snsHanakoPhotobookSettings','snsHanakoInstagramSettings','snsHanakoThreadsSettings'])take(id,modeOptions);
 const tools=$('snsGeminiTools'),photoPicker=tools?.querySelector('.sns-photo-picker');if(photoPicker){const photoCard=document.createElement('section');photoCard.className='sns-section-card sns-gemini-tools';photoCard.append(photoPicker);bodies.get('photos').prepend(photoCard);}
 const gas=take('snsHanakoGasSettings',bodies.get('photos'));if(gas){gas.classList.add('sns-section-card');const eyebrow=gas.querySelector('.eyebrow');if(eyebrow)eyebrow.textContent='PHOTO DIRECTION';if($('snsHanakoGasTitle'))$('snsHanakoGasTitle').textContent='服・髪型・場所を選ぶ';}
 const sensual=$('snsHanakoSensualLevel')?.closest('.sns-hanako-sensual');if(sensual)detail('photos','表現の雰囲気を細かく調整').append(sensual);
 const commerceLooks=card('photos','写真の見た目を選ぶ','キーワードやカテゴリから探せます。','social-commerce-only');const lookGrid=document.createElement('div');lookGrid.className='sns-field-grid';commerceLooks.append(lookGrid);
 for(const [id,label]of[['snsScenePreset','シーン・テーマ'],['snsOutfitPreset','服装'],['snsHairPreset','髪型'],['snsPosePreset','ポーズ'],['snsCompositionPreset','構図・視点'],['snsLightingPreset','光・時間帯'],['snsLocationPreset','場所'],['snsCarouselPreset','複数枚の見せ方'],['snsThreadsImageCount','画像枚数']])field(id,lookGrid,label);
 const custom=detail('photos','自由な指定で、写真をもっと自分らしく');const customGrid=document.createElement('div');customGrid.className='sns-field-grid';custom.append(customGrid);for(const [id,label]of[['snsSceneTheme','シーンの自由指定'],['snsOutfit','服装の自由指定'],['snsHairStyle','髪型の自由指定'],['snsPose','ポーズの自由指定'],['snsComposition','構図の自由指定'],['snsLighting','光の自由指定'],['snsVisualLocation','場所の自由指定'],['snsCreativeExtra','画像全体への追加指定']])field(id,customGrid,label);
 const customHint=document.createElement('p');customHint.className='muted';customHint.textContent='自由指定は選択肢より優先します。Threadsなど、投稿形式による場所・枚数の制約は引き継ぎます。';custom.append(customHint);
 const teacher=$('snsIncludeHanakoTeacher')?.closest('.sns-teacher-control-main');if(teacher)detail('photos','ハナコ先生のイラスト・吹き出し').append(teacher);
 const prepare=take('generateHanakoGasImage',bodies.get('photos'));if(prepare)prepare.textContent='この撮影設定でAI用の指示を準備';
 if(tools)bodies.get('photos').append(tools);
 const importResult=$('snsGeminiResultDetails');if(importResult){const returned=card('result','外部AIで作った結果を取り込む','','sns-gemini-tools');returned.append(importResult);}
 bodies.get('result').prepend(outputPanel);bodies.get('result').append(review);
 const textSettings=card('text','文章の基本設定');const textGrid=document.createElement('div');textGrid.className='sns-field-grid';textSettings.append(textGrid);for(const [id,label]of[['toneSelect','文章の雰囲気'],['emotionSelect','寄り添う気持ち'],['hookSelect','冒頭のつかみ'],['viralPatternSelect','文章の組み立て'],['seasonSelect','季節'],['ownershipSelect','商品との関係'],['postBrief','今回だけ入れたい情報']])field(id,textGrid,label);
 $('ownershipSelect')?.closest('.sns-field')?.classList.add('social-commerce-only');
 const optimization=detail('text','成果の目標を細かく調整');field('optimizationSelect',optimization,'重視する成果');take('learningHint',optimization);
 const actions=$('generatePost')?.closest('.generator-actions');if(actions){bodies.get('text').append(actions);$('generatePost').textContent='投稿文と画像の指示を作る';$('goToSocialGemini').textContent='画像作成の画面へ';}
 take('hanakoDaily',bodies.get('daily'));
 const character=card('settings','ハナの人柄と発信ルール');for(const [id,label]of[['snsCharacterRole','発信キャラクター・役割'],['snsCharacterVoice','人柄・話し方'],['snsSafetyBoundary','公開する内容のルール']])field(id,character,label);
 const learning=card('settings','過去の投稿から学ぶ','CSVを読み込むと、文章の長さや反応の傾向を投稿づくりに生かせます。');take('snsPatternAnalysisSummary',learning);field('snsPatternCsvFile',learning,'過去投稿のCSV・TSV');take('downloadHanakoCsvTemplate',learning);take('snsHanakoLearningStatus',learning);
 // Preserve any unrecognized future controls in an accessible fallback instead of discarding them.
 if(source.querySelector('input,select,textarea,button'))detail('settings','その他の設定').append(source);else source.remove();
 const banner=root.querySelector('.reel-entry-banner');if(banner){const reelButton=banner.querySelector('button');if(reelButton)header.querySelector('.sns-studio-utility').append(reelButton);banner.remove();}
 if(!oldLayout.children.length)oldLayout.remove();
 const footer=document.createElement('div');footer.className='sns-flow-footer';footer.innerHTML='<button type="button" id="snsStudioPrevious">前へ</button><span id="snsStudioStepHint"></span><button type="button" class="primary" id="snsStudioNext">次へ</button>';deck.append(footer);
 const reset=document.createElement('button');reset.type='button';reset.textContent='こだわり設定・学習';reset.onclick=()=>showStep('settings');header.querySelector('.sns-studio-utility').append(reset);
 $('snsStudioChangeMode').onclick=()=>{showStep('plan',{scroll:false});header.scrollIntoView({behavior:'smooth',block:'start'});};
 const countLabel=document.createElement('span');countLabel.id='snsStudioCharacterCount';countLabel.className='sns-character-count';$('copyPost')?.before(countLabel);$('postOutput').placeholder='投稿文を作ると、ここに完成稿が表示されます。直接編集もできます。';
 let activeStep='plan',pendingGeneration=false,renderQueued=false;
 const modeSnapshot=()=>({hanako:Boolean($('snsHanakoMode')?.checked),instagram:Boolean($('snsHanakoInstagramMode')?.checked),threads:Boolean($('snsHanakoThreadsMode')?.checked),ab:Boolean($('snsHanakoThreadsAbMode')?.checked),photobook:Boolean($('snsHanakoPhotobookMode')?.checked)});
 const currentMode=()=>inferSnsStudioMode(modeSnapshot());
 function setChecked(id,checked){const input=$(id);if(input&&input.checked!==checked){input.checked=checked;input.dispatchEvent(new Event('change',{bubbles:true}));}}
 function chooseMode(id){
  if(!snsStudioModes.some(mode=>mode.id===id))return;
  if(currentMode()!==id){
   if(id==='commerce'){for(const field of['snsHanakoThreadsAbMode','snsHanakoInstagramMode','snsHanakoThreadsMode','snsHanakoPhotobookMode'])setChecked(field,false);setChecked('snsHanakoMode',false);}
   else{setChecked('snsHanakoMode',true);if(id==='free'){for(const field of['snsHanakoThreadsAbMode','snsHanakoInstagramMode','snsHanakoThreadsMode','snsHanakoPhotobookMode'])setChecked(field,false);}else{const target={instagram:'snsHanakoInstagramMode',threads:'snsHanakoThreadsMode',ab:'snsHanakoThreadsMode',photobook:'snsHanakoPhotobookMode'}[id];setChecked(target,true);if(id==='ab'||id==='threads')setChecked('snsHanakoThreadsAbMode',id==='ab');}}
  }
  render();showStep('plan');
 }
 function showStep(id,{scroll=true,focus=false}={}){
  if(!panels.has(id))return;activeStep=id;for(const [key,panel]of panels)panel.hidden=key!==id;
  for(const [key,button]of tabs){button.setAttribute('aria-selected',String(key===id));button.tabIndex=key===id?0:-1;if(key===id)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');}
  const index=steps.findIndex(step=>step[0]===id);$('snsStudioPrevious').hidden=index===0;$('snsStudioNext').hidden=index>=3;$('snsStudioStepHint').textContent=index<4?`${index+1} / 4　${steps[index][1]}`:'必要なときだけ設定できます';$('snsStudioNext').textContent=index<3?`次へ：${steps[index+1][1]}`:'次へ';
  if(scroll&&root.classList.contains('active'))panels.get(id).scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  if(focus)panels.get(id).querySelector('h3').focus({preventScroll:true});
 }
 function selectedText(id){const el=$(id);return el?.selectedOptions?.[0]?.textContent?.trim()||'';}
 function updateText(node,value){if(node&&node.textContent!==value)node.textContent=value;}
 function render(){
  const id=currentMode(),mode=snsStudioModes.find(mode=>mode.id===id),snapshot=modeSnapshot();for(const button of modeGrid.children)button.setAttribute('aria-pressed',String(button.dataset.snsMode===id));
  if($('snsHanakoTimeRecommendation'))$('snsHanakoTimeRecommendation').hidden=!snapshot.hanako;
  const platform=root.querySelector('#platformTabs button.active')?.dataset.platform||'Threads';$('snsStudioPlatform').hidden=!['commerce','free'].includes(id);modeOptions.hidden=!snapshot.instagram&&!snapshot.threads&&!snapshot.photobook;
  const count=snapshot.photobook?selectedText('snsHanakoPhotobookCount'):snapshot.threads?selectedText('snsHanakoThreadsCount'):selectedText('snsThreadsImageCount');
  updateText($('snsStudioModeTitle'),mode.title);const summaryText=[snapshot.photobook?'写真集':platform,count,selectedText('snsHanakoExpression')].filter(Boolean);
  const current=$('snsStudioCurrent');const description=summaryText.join('　/　');updateText(current,`今回の設定：${mode.title}　${description}`);
  const look=$('snsStudioLookSummary');const lookText=[['服装',selectedText('snsOutfitPreset')],['髪型',selectedText('snsHairPreset')],['場所',selectedText('snsLocationPreset')]];
  if(!look.children.length)for(let i=0;i<3;i++){const p=document.createElement('p');p.className='sns-summary-chip';look.append(p);}lookText.forEach(([name,value],i)=>updateText(look.children[i],`${name}：${value||'未選択'}`));
  const photo=Boolean(root.querySelector('#snsCoordPhotoLibrary [aria-pressed="true"],#snsCoordPhotoLibrary .selected,#snsCoordPhotoLibrary .active'));
  const promptStale=($('snsGeminiStatus')?.textContent||'').includes('条件変更');
  const hasText=Boolean($('postOutput')?.value.trim());updateText($('snsStudioCharacterCount'),`${$('postOutput')?.value.length||0}文字`);const readiness=$('snsStudioReadiness');const checks=[['写真',photo?'本人写真を選択済み':'本人写真は「写真・見た目」で選択',photo],['本文',hasText?`${$('postOutput').value.length}文字の完成稿あり`:'まだ投稿文は作られていません',hasText],['画像指示',promptStale?'条件が変わりました。画像の指示を更新してください':$('snsGeminiPrompt')?.value.trim()?'画像作成の指示あり':'撮影設定を選んで準備できます',!promptStale&&Boolean($('snsGeminiPrompt')?.value.trim())]];
  if(!readiness.children.length)for(let i=0;i<checks.length;i++){const p=document.createElement('p');p.className='sns-readiness-item';readiness.append(p);}checks.forEach(([label,value,ready],i)=>{updateText(readiness.children[i],`${label}：${value}`);const flag=String(ready);if(readiness.children[i].dataset.ready!==flag)readiness.children[i].dataset.ready=flag;});
 }
 function scheduleRender(){if(renderQueued)return;renderQueued=true;requestAnimationFrame(()=>{renderQueued=false;render();});}
 root.addEventListener('input',scheduleRender);root.addEventListener('change',scheduleRender);
 // Arm navigation before the existing target handler mutates outputMeta. Some browsers run
 // mutation callbacks between the target listener and the bubbling listener.
 root.addEventListener('click',event=>{
  const id=event.target.closest('button')?.id;
  if(['generatePost','generateVariation','generateThree','socialImportAndGenerate'].includes(id))pendingGeneration=true;
  if(['generateHanakoGasImage','goToSocialGemini'].includes(id))showStep('photos',{scroll:false});
 },true);
 root.addEventListener('click',event=>{
  const go=event.target.closest('[data-sns-go]');if(go)showStep(go.dataset.snsGo);
  const clicked=event.target.closest('button');if(!clicked)return;
  if(clicked.id.startsWith('createHanako')){scheduleRender();showStep('photos');}
  scheduleRender();
 });
 $('snsStudioPrevious').onclick=()=>showStep(steps[Math.max(0,steps.findIndex(step=>step[0]===activeStep)-1)][0],{focus:true});$('snsStudioNext').onclick=()=>showStep(steps[Math.min(3,steps.findIndex(step=>step[0]===activeStep)+1)][0],{focus:true});
 nav.addEventListener('keydown',event=>{const buttons=[...tabs.values()],index=buttons.indexOf(event.target);if(index<0)return;const target=event.key==='ArrowRight'?buttons[(index+1)%buttons.length]:event.key==='ArrowLeft'?buttons[(index+buttons.length-1)%buttons.length]:null;if(target){event.preventDefault();target.focus();target.click();}});
 const observer=new MutationObserver(()=>{scheduleRender();if(pendingGeneration&&$('postOutput')?.value.trim()){pendingGeneration=false;showStep('result');}});if($('outputMeta'))observer.observe($('outputMeta'),{childList:true,subtree:true,characterData:true});
 const stateObserver=new MutationObserver(scheduleRender);for(const node of[$('snsCoordPhotoLibrary'),$('platformTabs'),$('snsHanakoGasSettings'),$('snsGeminiStatus')])if(node)stateObserver.observe(node,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','disabled','class','aria-pressed']});
 document.addEventListener('hanako-sns-ui-change',scheduleRender);window.addEventListener('focus',scheduleRender);
 document.querySelector('.nav-tab[data-view="generator"]')?.addEventListener('click',scheduleRender);
 const missing=originalControls.filter(node=>!root.contains(node));if(missing.length)throw Error('SNS studio lost controls: '+missing.map(node=>node.id).join(', '));
 showStep('plan',{scroll:false});render();
 if(new URL(location.href).searchParams.get('view')==='generator')document.querySelector('.nav-tab[data-view="generator"]')?.click();
 return{refresh:render,showStep,chooseMode};
}
if(typeof document!=='undefined'){
 const start=()=>mountSnsStudio(document.getElementById('generator'));
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else queueMicrotask(start);
}
