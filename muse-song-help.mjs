/** User guidance and in-page links only; never generates, uploads, or publishes media. */
export function mountSongHelp(card,root){
 const $=id=>document.getElementById(id);
 const guide=document.createElement('section');guide.className='song-help';guide.id='songHelp';guide.setAttribute('aria-labelledby','songHelpTitle');
 guide.innerHTML=`<div class="song-help-intro"><span class="song-help-badge">はじめての方へ</span><h3 id="songHelpTitle">何をする機能？ 完成まで、どう進める？</h3><p><strong>ここで作るのは、選んだ曲を使うMUSE動画の「制作指示書」です。</strong> 人物が動く動画はMUSEで作り、動画編集アプリでつないでMP4に仕上げます。</p><ol class="song-help-flow" aria-label="完成までの担当"><li><b>OPS</b><span>曲・構成・指示書</span></li><li><b>ChatGPT</b><span>開始・終了画像</span></li><li><b>MUSE</b><span>短い動画を作る</span></li><li><b>動画編集・Instagram</b><span>結合・音楽・保存</span></li></ol><p class="song-help-definition"><strong>制作セット／制作指示書とは：</strong>画像を作る指示、カット別の英語の動画指示、編集手順をまとめたテキストです。「指示書を保存」では動画ファイルは保存されません。</p><button type="button" class="song-help-start" data-song-help-target="track">説明を閉じて、曲を選ぶ</button></div>
 <details id="songHelpDetails" open><summary>完成までの7手順 ― 作業の意味と押すボタン</summary><p class="song-help-preparation"><strong>用意するもの：</strong>本人写真1枚、使いたい曲、ChatGPT・MUSE、動画をつなげられる編集アプリ。音声ファイルがない場合も、Instagramで音楽を後付けする流れで準備できます。</p>
 <ol class="song-help-steps">
 <li><details open data-help-step="1"><summary><span>1</span>本人写真と見た目を決める <small>OPS</small></summary><div><p><b>作業の意味：</b>全カットで顔・体格・服装・髪・背景をそろえるための基準を用意します。</p><p><b>操作：</b>下のMUSE欄で「写真の役割」を「本人画像」にして「写真を追加」。髪型・服装・場所は「こだわり」で指定するか、「SNSの髪型・服・場所・本人画像を取り込む」を使います。</p><p>登録した写真自体は、指示のコピーには含まれません。ChatGPTとMUSEにも、同じ元の写真・参考画像を手動で添付してください。</p><button type="button" data-song-help-target="appearance">本人写真・見た目の設定へ</button></div></details></li>
 <li><details data-help-step="2"><summary><span>2</span>曲・完成尺・動きを選ぶ <small>この音楽欄</small></summary><div><p><b>作業の意味：</b>どんな曲で、何秒の、どのような動きのリールにするかを決めます。</p><p><b>まずは：</b>曲を1つ選び、「動画尺：20秒」「振付：Instagramの参考から制作案」「動作：標準」「カメラ：正面固定」で進められます。</p><p>この音楽ルートの完成尺は、この欄の<strong>「動画尺」</strong>を使います。下の汎用MUSE欄にある「仕上げたい長さ」は、別の企画を作るときの設定です。</p><p>「参考の衣装・場所・構図を使う」にチェックすると、その曲の参考スタイルを提案に使います。本人の顔・体格は本人写真を基準にします。参考は部分的なポーズの観察で、全編の公式振付を確認したものではありません。</p><button type="button" data-song-help-target="track">曲と動画尺の設定へ</button></div></details></li>
 <li><details data-help-step="3"><summary><span>3</span>音楽を後付けするか、音源を確認する <small>OPS → Instagram</small></summary><div><p><b>作業の意味：</b>曲のどの部分を使うか決めます。音源がなければ、時刻を決めずに仮の構成から始めます。</p><div class="song-help-routes"><section><h4>音声ファイルがない場合</h4><p>サビの秒数は空欄のまま進めます。無音の完成動画を書き出して、Instagramで利用できる同じ曲を選び、試聴しながら使用位置を合わせます。正確な拍・サビとの同期は未確認です。</p><button type="button" data-song-help-step="4">指示書の準備へ進む</button></section><section><h4>利用権のある音源がある場合</h4><p>「サビ未確認の曲を解析・確認する」でMP3・M4A・WAVやMP4/MOVの音源を登録します。</p><p><b>解析 → サビ候補・開始／終了を選ぶ → 「候補・修正値を保存（要確認）」 → 「選択した区間を試聴」 → 確認チェック → 「このバージョンのサビを検証済みにする」</b>の順です。</p><p>サビ候補を選んだら、先に保存してから試聴します。短い区間しか使えない場合は、表示された短い動画尺の候補を選びます。手入力の開始位置は「確認済み」を意味しません。</p><button type="button" data-song-help-target="analysis">音源の解析・確認へ</button></section></div><p>「音源バージョン」は原曲・MV・速度変更版などの区別です。原曲、YouTube、参考リールでは秒数が異なります。YouTubeの確認機能は視聴した動画版の時刻を記録し、音声をダウンロードする機能ではありません。</p></div></details></li>
 <li><details data-help-step="4"><summary><span>4</span>制作指示書を準備する <small>OPS</small></summary><div><p><b>作業の意味：</b>選んだ条件を、画像と動画を作るための文章にまとめます。曲・設定を変えると案は自動で更新されます。</p><p><b>操作：</b>最後にこの音楽欄の「この曲の制作指示書を更新」を押して確認します。音楽に合わせる制作では、この欄の出力を使います。</p><p>下の汎用MUSE欄の「画像準備と動画指示を作る」は、曲別の指示とは別の企画を作るボタンです。本人写真・見た目の共通設定を済ませたら、この音楽欄へ戻って進めてください。</p><p>「制作指示書を保存（テキスト）」で保存されるのは文章です。この時点ではMP4はできていません。</p><button type="button" data-song-help-target="generate">制作指示書の更新ボタンへ</button></div></details></li>
 <li><details data-help-step="5"><summary><span>5</span>動画の開始・終了画像を用意する <small>ChatGPT</small></summary><div><p><b>作業の意味：</b>動き始めと動き終わりの姿勢を決め、カットのつながりを自然にします。この基準画像を「キーフレーム」と呼びます。</p><p><b>操作：</b>「ChatGPTへ渡す画像作成指示をコピー」を押し、ChatGPTに貼り付けます。<strong>本人写真と、衣装・髪・場所の参考画像も一緒に手動で添付</strong>し、指示に沿って画像の作成を依頼します。OPSから自動送信はしません。</p><p>KEYFRAME_01_START.pngは1本目の開始画像、KEYFRAME_01_END.pngは終了画像です。文字・ロゴ・コラージュなしの縦9:16を、1枚ずつ別画像で保存します。元写真と顔が一致する終了画像だけを次の開始に再利用します。顔がずれた画像は元写真から修正してから使ってください。</p><p>画像を作れない環境では、出力された画像作成指示を、利用できる画像生成機能で使って準備してください。</p><button type="button" data-song-help-target="keyframes">画像作成指示のコピー欄へ</button><a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">ChatGPTを開く ↗</a></div></details></li>
 <li><details data-help-step="6"><summary><span>6</span>CUTごとに短い動画を作る <small>MUSE</small></summary><div><p><b>作業の意味：</b>一度に長い動きを作らず、顔や衣装をそろえながら短い動画を順番に作ります。<strong>CUT（カット）＝動画の1区間</strong>です。20秒の初期案は4カットです。</p><p><b>操作：</b>「CUT 1 の英語指示をコピー」を押し、用意したCUT 1の開始画像と一緒にMUSEへ渡します。生成した動画を保存し、CUT 2以降も同じ順で進めます。CUT 2以降も、同じ元の本人画像を毎回添付してください。前カットの画像は姿勢の参考で、顔は元写真を優先します。</p><p>カットの秒数は編集で使う長さの目安です。MUSEの出力が長ければ後で切り出します。終了画像を指定できない画面では、開始画像と英語指示の「Ending pose（終わりの姿勢）」を使います。曲の時刻がUNKNOWNなら、曲との同期はまだ未確認です。</p><button type="button" data-song-help-target="cuts">カット別の英語指示へ</button><a href="https://www.meta.ai/" target="_blank" rel="noopener noreferrer">Meta AIを開く ↗</a></div></details></li>
 <li><details data-help-step="7"><summary><span>7</span>つないで音楽を付け、MP4で保存 <small>動画編集アプリ・Instagram</small></summary><div><p><b>作業の意味：</b>別々に作った動画を1本にし、音と動作のタイミングを仕上げます。</p><p><b>操作：</b>お使いの動画編集アプリへ動画を読み込み、<strong>CUT番号の順</strong>に並べます（20秒の初期案なら1 → 2 → 3 → 4）。前後の姿勢を合わせ、選んだ完成尺へ切り出します。生成動画の音声をミュートし、利用権のある音源を付けるか、無音のままMP4で書き出します。</p><p>無音で書き出した場合は、Instagramで動画を選び、公式の楽曲ライブラリから使える曲を追加します。原曲の秒数とアプリ内の開始位置は同一とは限らないため、試聴して同じフレーズへ合わせ、仕上がりを確認して投稿してください。</p><p><strong>このMUSE機能には、生成した動画を結合する編集機能はありません。</strong>「結合とInstagram音楽追加の編集指示」を見ながら、動画編集アプリで作業します。</p><button type="button" data-song-help-target="editing">結合・音楽追加の編集指示へ</button></div></details></li>
 </ol><button type="button" class="song-help-start" data-song-help-target="track">説明を閉じて、曲を選ぶ</button></details>
 <p id="songHelpNext" class="song-help-next" role="status" aria-live="polite"></p>
 <details class="song-help-alternative"><summary>写真を切り替えるリールを、OPSでMP4にしたいとき</summary><p>下の「写真に、かわいいリズムを。」では、静止画4〜14枚を音楽に合わせて切り替えるMP4を作れます。MUSEで人物を動かす制作とは別の流れです。MUSEの動画をつなぐ機能ではありません。</p><p>写真を選ぶ → Instagram公式音楽または利用権のある音声ファイルを選ぶ → スタイル・長さを選ぶ → 「リールを自動制作」 → プレビュー・保存、の順です。Instagram公式音楽を使う場合の保存MP4は無音です。</p><button type="button" data-song-help-target="photo-reel">写真を切り替えるMP4制作へ</button></details>`;
 card.querySelector('.muse-content').prepend(guide);
 const output=$('songOutputs'),keyframes=$('songCopyKeyframes')?.closest('details'),shots=$('songShotCards'),editing=$('songEditing')?.closest('details');
 if(output&&keyframes&&shots){
  output.querySelector('h3').textContent='制作指示書を使う：画像 → 動画 → 仕上げ';
  keyframes.querySelector('summary').textContent='1. ChatGPTで開始・終了画像を準備する';
  output.insertBefore(keyframes,shots);
  const title=document.createElement('h3');title.textContent='2. MUSEでCUTごとに動画化する';output.insertBefore(title,shots);
  const note=document.createElement('p');note.className='muse-note';note.textContent='用意した開始画像と、対応するCUTの英語指示をMUSEへ渡します。動画はカットごとに保存し、編集アプリでつなぎます。';output.insertBefore(note,shots);
 }
 if(editing)editing.querySelector('summary').textContent='3. 動画をつないで音楽を付ける（編集アプリで作業）';
 const returnButton=document.createElement('button');returnButton.type='button';returnButton.textContent='この後の手順を確認する';returnButton.dataset.songHelpStep='5';if(output)output.prepend(returnButton);
 const backToMusic=document.createElement('button');backToMusic.type='button';backToMusic.textContent='写真の準備ができたら、曲の設定へ戻る';backToMusic.dataset.songHelpTarget='track';$('museAssets')?.after(backToMusic);
 const targets={appearance:'museAssetRole',track:'songTrack',analysis:'songAnalysisDetails',generate:'songGenerate',keyframes:'songCopyKeyframes',cuts:'songShotCards',editing:'songEditing','photo-reel':'reelInputs'};
 function reveal(target){for(let node=target;node;node=node.parentElement)if(node.tagName==='DETAILS')node.open=true;}
 root.addEventListener('click',event=>{
  const step=event.target.closest('[data-song-help-step]');if(step){$('songHelpDetails').open=true;const panel=guide.querySelector(`[data-help-step="${step.dataset.songHelpStep}"]`);if(panel){panel.open=true;panel.scrollIntoView({behavior:'smooth',block:'start'});}return;}
  const button=event.target.closest('[data-song-help-target]');if(!button)return;const name=button.dataset.songHelpTarget,target=$(targets[name]);if(!target)return;
  if(['keyframes','cuts','editing'].includes(name)&&output?.hidden){$('songStatus').textContent='先に曲と設定を選び、「この曲の制作指示書を更新」を押してください。';return;}
  if(button.classList.contains('song-help-start'))$('songHelpDetails').open=false;
  reveal(target);target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
 });
 let queued=false;
 function refresh(){
  queued=false;const duration=$('songDuration')?.value||'20',count=$('songShotCards')?.children.length||0,start=$('songStart')?.value;
  const next=output?.hidden?'曲と設定を確認して「この曲の制作指示書を更新」を押してください。':`今の指示書：完成${duration}秒・${count}カット。${start?`曲内の開始位置 ${Number(start).toFixed(2)}秒。`:'曲内の開始位置は未確認の仮構成です。'} 次は手順5で、画像作成指示と本人写真をChatGPTへ渡します。`;
  if($('songHelpNext').textContent!==next)$('songHelpNext').textContent=next;
 }
 const schedule=()=>{if(!queued){queued=true;requestAnimationFrame(refresh);}};
 card.addEventListener('change',schedule);card.addEventListener('input',schedule);
 const observer=new MutationObserver(schedule);if($('songStatus'))observer.observe($('songStatus'),{childList:true,characterData:true,subtree:true});if(output)observer.observe(output,{attributes:true,attributeFilter:['hidden']});
 refresh();return{refresh};
}
