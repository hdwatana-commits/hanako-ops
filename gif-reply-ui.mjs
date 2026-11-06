import {GIF_SCENES,DEFAULT_GIF_SETTINGS,parseGiphyId,gifPreviewUrl,validateGifSettings,readGifSettings} from './gif-replies.mjs?v=3';
function gifNode(tag,text,className=''){const node=document.createElement(tag);node.textContent=text;node.className=className;return node;}
export function createGifPreview(selection){
 const url=gifPreviewUrl(selection?.gif_id);if(!url)return null;
 const box=document.createElement('div');box.className='reply-gif-preview';
 const link=document.createElement('a');link.href=`https://giphy.com/gifs/${encodeURIComponent(parseGiphyId(selection.gif_id))}`;link.target='_blank';link.rel='noopener noreferrer';
 const image=document.createElement('img');image.src=url;image.alt=selection.label||GIF_SCENES[selection.scene]||'返信に添えるGIF';image.loading='lazy';image.referrerPolicy='no-referrer';link.append(image);
 image.addEventListener('error',()=>{image.hidden=true;link.append(gifNode('span','プレビューを表示できません。GIPHYで確認'));},{once:true});
 box.append(link,gifNode('small',`${GIF_SCENES[selection.scene]||'GIF'} · ${selection.label||'登録済みGIF'}`));return box;
}
export function createGifReplyPanel({call,notify=()=>{}}){
 const element=document.createElement('form');element.className='panel reply-settings reply-gif-panel';element.id='replyGifSettings';
 element.innerHTML=`<h3>ThreadsのGIF返信</h3><p class="reply-help">場面ごとに複数のGIFを登録できます（各20件まで）。GIPHYで使いたいGIFを開き、その個別ページのURLを貼り付けて「この場面に追加」、最後に「GIF設定を保存」を押してください。Instagramの公開コメント返信は対象外です。</p>
 <fieldset disabled><div class="reply-grid"><label class="reply-check"><input type="checkbox" name="enabled"> GIF返信を有効にする</label><label>通常の返信でGIFを添える割合（%）<input name="rate" type="number" min="0" max="100" value="20" required></label></div><label class="reply-check"><input name="emoji_enabled" type="checkbox" checked> 絵文字だけのコメントには登録済みGIFと短い絵文字で返信する（AIは使わない）</label>
 <p class="reply-help">通常のコメントは、文章に設定した割合でGIFを添えます。割合は場面を判定できたコメントに適用します。絵文字だけのコメントは上の専用設定に従います。深刻な相談や苦情には添えません。保存済みの全GIF送信履歴を使い、同じ相手へまだ送っていないGIFを最優先します。使ったことがある場合は、使用回数が少なく、最後に送ってから時間がたっている候補を選びます。同じ相手への前回分と、アカウント全体の直前の返信に添えたGIFは避けます。別の候補がない場合や未登録の場面は文章・絵文字で返します。</p>
 <div class="reply-grid"><label>場面<select name="scene"></select></label><label>GIFの名前（任意）<input name="label" maxlength="60" placeholder="例：ぺこっとお礼"></label></div><label>GIPHYのGIFページURL<input name="url" type="url" maxlength="1000" placeholder="https://giphy.com/gifs/…"></label><div class="button-row"><button id="replyGifAdd" type="button">この場面に追加</button><a id="replyGifSearch" href="https://giphy.com/" target="_blank" rel="noopener noreferrer">GIPHYでGIFを探す</a></div><div id="replyGifItems"></div><button class="primary" type="submit">GIF設定を保存</button></fieldset><p id="replyGifState" class="reply-help" role="status">所有者でログインし、上の「読み込む」で設定を確認してください。</p>`;
 const field=name=>element.elements.namedItem(name),list=element.querySelector('#replyGifItems'),state=element.querySelector('#replyGifState'),fieldset=element.querySelector('fieldset');
 let draft={...DEFAULT_GIF_SETTINGS,items:[]},ready=false,saving=false;
 for(const [key,label] of Object.entries(GIF_SCENES)){const option=document.createElement('option');option.value=key;option.textContent=label;field('scene').append(option);}
 const searches={thanks:'thank you',happy:'happy smile',shy:'shy blush',affection:'heart love',goodnight:'good night',hello:'hello wave',cheer:'cheering',surprise:'surprised',reaction:'cute reaction'};
 const search=()=>element.querySelector('#replyGifSearch').href='https://giphy.com/search/'+encodeURIComponent(searches[field('scene').value]||'cute reaction');search();
 const dirty=()=>{if(ready)state.textContent='変更は未保存です。「GIF設定を保存」で反映します。';};
 function render(){
  list.replaceChildren();if(!draft.items.length){list.append(gifNode('p','GIFはまだ登録されていません。場面を選んで追加してください。','reply-help'));return;}
  for(const [scene,label] of Object.entries(GIF_SCENES)){
   const entries=draft.items.map((item,index)=>({item,index})).filter(x=>x.item.scene===scene);if(!entries.length)continue;
   const group=document.createElement('details');group.open=true;group.className='reply-gif-group';group.append(gifNode('summary',`${label}（${entries.length}/20件）`));
   const grid=document.createElement('div');grid.className='reply-gif-grid';
   for(const {item,index} of entries){
    const card=document.createElement('article');card.className='reply-gif-item';const preview=createGifPreview(item);if(preview)card.append(preview);
    const toggle=document.createElement('label');toggle.className='reply-check';const check=document.createElement('input');check.type='checkbox';check.checked=item.enabled;check.addEventListener('change',()=>{draft.items[index].enabled=check.checked;dirty();});toggle.append(check,document.createTextNode('このGIFを使う'));
    const remove=gifNode('button','削除');remove.type='button';remove.setAttribute('aria-label',`${item.label}を削除`);remove.addEventListener('click',()=>{draft.items.splice(index,1);render();dirty();});card.append(toggle,remove);grid.append(card);
   }
   group.append(grid);list.append(group);
  }
 }
 element.querySelector('#replyGifAdd').addEventListener('click',()=>{
  try{
   const scene=field('scene').value,item={scene,gif_id:parseGiphyId(field('url').value),label:field('label').value.trim()||GIF_SCENES[scene],enabled:true};
   draft=validateGifSettings({...draft,enabled:false,items:[...draft.items,item]});field('url').value='';field('label').value='';render();dirty();
  }catch(e){state.textContent=e.message;}
 });
 field('scene').addEventListener('change',search);
 for(const name of ['enabled','rate','emoji_enabled'])field(name).addEventListener('change',dirty);
 element.addEventListener('submit',async event=>{
  event.preventDefault();if(!ready||saving)return;
  try{
   const value=validateGifSettings({enabled:field('enabled').checked,rate:Number(field('rate').value),emoji_enabled:field('emoji_enabled').checked,items:draft.items});
   saving=true;fieldset.disabled=true;state.textContent='GIF設定を保存しています…';
   const result=await call('gif_save',{settings:value});load(result.settings||value);state.textContent='GIF設定をクラウドに保存しました。次に作る返信から反映します。';notify('GIF設定をクラウドに保存しました。');
  }catch(e){state.textContent=e.message;}finally{saving=false;fieldset.disabled=!ready;}
 });
 function load(value){draft=readGifSettings(value);ready=true;fieldset.disabled=saving;field('enabled').checked=draft.enabled;field('rate').value=String(draft.rate);field('emoji_enabled').checked=draft.emoji_enabled;render();state.textContent=`${draft.enabled?'有効':'停止中'} · 登録${draft.items.length}件（使用するGIF ${draft.items.filter(x=>x.enabled).length}件）`;}
 return {element,load};
}
