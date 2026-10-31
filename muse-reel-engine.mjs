/**
 * Pure handoff builder. No network calls, image generation, storage, or music analysis.
 * config: {mode, theme:string|{label,direction}, brief,hair,outfit,location,composition,
 * identityNames?:string[],identityName?:string,styleReferenceNames?:string[],referenceUrls?:string[],
 * referenceStatus?:'unverified'|'observed',observations?,motionNotes?,timelineNotes?,
 * referenceVideoName?,bpm?:number,duration?:8|15|20|30|60,energy?:'gentle'|'balanced'|'dynamic'}
 * Labels are attachment names, never fetched URLs. Caller supplies the actual images separately.
 */
const text=(value,max=1800)=>String(value??'').trim().slice(0,max);
const defaults={hair:'本人写真の髪型を保つ',outfit:'選択した服装を全カットで固定',location:'自然光のある落ち着いた場所',composition:'9:16、目線の高さ、頭と手足に余白を取る'};
const motionSequence=[
 ['静止に近い姿勢からカメラへ目線を戻し、小さく首を傾ける','固定カメラからごく緩い寄り','穏やかな期待から小さな笑顔へ'],
 ['片手で髪を一度整え、肩の力を抜いて姿勢を戻す','目線の高さで緩い横移動','自然な瞬きと照れ笑い'],
 ['足元を安定させた小さな一歩のあと、重心をゆっくり戻す','全身を保ち軽く後退','カメラに気づいた嬉しそうな表情'],
 ['上半身をわずかに横へ向け、肩越しに目線を戻す','膝上で緩い弧を描く移動','微笑みから落ち着いた目線へ'],
 ['バッグか袖へ軽く手を添え、肩を一度小さく揺らす','手元から顔へ穏やかな移動','自然な笑いと一度の瞬き'],
 ['片手を胸より低い位置で小さく振り、静かに下ろす','固定の中距離','親しみのある笑顔'],
 ['カメラへ半歩だけ近づき、足を止めて目線を合わせる','後退を抑えた滑らかな追従','期待のある目線から柔らかな笑顔へ'],
 ['冒頭に近い立ち姿へ戻り、髪と手の動きを静かに止める','冒頭の画角へ緩く戻す','小さな笑顔を残して落ち着く']
];
export function normalizeMuseReferenceUrl(value){
 let url;try{url=new URL(String(value).trim());}catch{throw Error('参考URLはInstagramリールの https:// URLを入力してください。');}
 if(url.protocol!=='https:'||!['instagram.com','www.instagram.com'].includes(url.hostname)||url.username||url.password||url.port||!/^\/reels?\/[A-Za-z0-9_-]{5,64}\/?$/.test(url.pathname))throw Error('参考URLはInstagramの /reel/ または /reels/ の動画URLを入力してください。');
 return `https://www.instagram.com/reel/${url.pathname.split('/')[2]}/`;
}
function labels(value,max){if(!Array.isArray(value))return [];return value.map(v=>text(v,140)).filter(Boolean).slice(0,max);}
function normalize(config){
 const duration=Number(config.duration??15);if(![8,15,20,30,60].includes(duration))throw Error('動画の長さは8・15・20・30・60秒から選んでください。');
 const rawBpm=config.bpm,bpm=rawBpm===''||rawBpm==null?null:Number(rawBpm);if(bpm!==null&&(!Number.isFinite(bpm)||bpm<40||bpm>240))throw Error('BPMは40〜240の数値で指定してください。分からない場合は空欄にしてください。');
 if(config.referenceUrls!=null&&!Array.isArray(config.referenceUrls))throw Error('参考リールURLの形式を確認してください。');
 if((config.referenceUrls||[]).length>12)throw Error('参考リールURLは12件までです。');
 const referenceUrls=[...new Set((config.referenceUrls||[]).filter(v=>String(v).trim()).map(normalizeMuseReferenceUrl))];
 const observations=text(config.observations),timelineNotes=text(config.timelineNotes),observed=config.referenceStatus==='observed';
 if(observed&&!observations&&!timelineNotes)throw Error('確認済みにする場合は、動き・表情・カメラの確認メモを入力してください。');
 return {mode:config.mode==='detail'?'detail':'easy',duration,bpm,energy:['gentle','balanced','dynamic'].includes(config.energy)?config.energy:'balanced',theme:typeof config.theme==='object'&&config.theme?text(config.theme.label,140):text(config.theme,140)||'自然体のファッションリール',direction:text(config.theme?.direction),brief:text(config.brief),hair:text(config.hair,600)||defaults.hair,outfit:text(config.outfit,900)||defaults.outfit,location:text(config.location,600)||defaults.location,composition:text(config.composition,600)||defaults.composition,startFrameNames:labels(config.startFrameNames,10),identityNames:labels(config.identityNames||[config.identityName||'本人参照写真'],10),styleReferenceNames:labels(config.styleReferenceNames,10),referenceUrls,referenceStatus:observed?'observed':'unverified',observations,timelineNotes,motionNotes:text(config.motionNotes),chatgptResult:text(config.chatgptResult,12000),referenceVideoName:text(config.referenceVideoName,140)};
}
const seconds=value=>Number(value.toFixed(3));
function shotsFor(c){
 const count=Math.ceil(c.duration/8),shots=[];let start=0;
 for(let i=0;i<count;i++){
  const remaining=count-i-1,target=(i+1)*c.duration/count,period=c.bpm?60/c.bpm:0;
  const end=remaining===0?c.duration:seconds(Math.max(start+.6,c.duration-remaining*8,Math.min(start+8,c.duration-remaining*.6,period?Math.round(target/period)*period:target)));
  const [motion,camera,expression]=motionSequence[i%motionSequence.length];
  shots.push({index:i+1,start,end,duration:seconds(end-start),startFrame:c.startFrameNames[i]||`KEYFRAME_${String(i+1).padStart(2,'0')}_START.png`,endFrame:`KEYFRAME_${String(i+1).padStart(2,'0')}_END.png`,motion,camera,expression,beatCue:c.bpm?`推定 ${seconds(start*c.bpm/60)}〜${seconds(end*c.bpm/60)}拍目。主拍で動作を開始し、次の強拍の前に静止。BPMは手入力の目安で音声解析ではない。`:'テンポ未確認。静止→小さな動作→余韻の順で自然に動く。実際の拍は音源を添付して確認する。'});start=end;
 }
 return shots;
}
export function buildMuseReelPackage(config={}){
 const c=normalize(config),shots=shotsFor(c),manifest=[];
 c.identityNames.forEach((label,i)=>manifest.push({id:`IDENTITY_${i+1}`,role:'identity',label,instruction:'本人の顔・輪郭・肌の特徴と体格の同一性の基準。他人の顔や参考リールの人物へ置き換えない。'}));
 c.styleReferenceNames.forEach((label,i)=>manifest.push({id:`STYLE_${i+1}`,role:'style',label,instruction:'服・髪・場所・構図の参考。人物の同一性の基準にはしない。'}));
 if(c.referenceVideoName)manifest.push({id:'MOTION_REFERENCE',role:'motion',label:c.referenceVideoName,instruction:'ユーザーが添付した動きの参考動画。対応サービスでのみ添付。音声・振付・視線・カメラを実際に確認して使用。'});
 for(const shot of shots)for(const [key,role]of[['startFrame','keyframe-start'],['endFrame','keyframe-end']])manifest.push({id:`SHOT_${shot.index}_${role}`,role,label:shot[key],instruction:`ChatGPT等で準備する${shot.index}カット目の${role==='keyframe-start'?'開始':'終了'}画像。9:16の独立した画像1枚。コラージュや文字を入れない。`});
 const refStatus=c.referenceStatus==='observed'?'ユーザー確認メモあり（OPSによる動画確認・解析ではない）':'参考リールの内容は未確認（OPSはURL先の動きを取得・解析していない）';
 const refs=c.referenceUrls.length?c.referenceUrls.map((url,i)=>`${i+1}. ${url}`).join('\n'):'URLなし';
 const identity=c.identityNames.length?c.identityNames.join(' / '):'本人参照写真を別途添付';
 const settings=`テーマ：${c.theme}${c.direction?' ／ '+c.direction:''}\n本人画像：${identity}\n髪型：${c.hair}\n服装：${c.outfit}\n場所：${c.location}\n構図：${c.composition}\n全体：縦9:16・合計${c.duration}秒・${c.energy==='dynamic'?'明るくリズミカル。ただし動作は一度に一つ':c.energy==='gentle'?'静かで柔らかな動作':'自然で可愛い、抑揚のある動作'}\n音楽：${c.bpm?`手入力 ${c.bpm} BPM。拍の先頭・曲の開始位置・アクセントは未確認。`:'BPM未指定。音源未解析。'}`;
 const reference=`参考リール（内容の確認状況）：${refStatus}\n${refs}\n主参考：${c.referenceUrls[0]||'未指定'}（動作順と構図を近づける主対象。内容を確認できた場合に限る）\n補助参考：${c.referenceUrls.slice(1).join(' / ')||'なし'}（雰囲気・服装・場所の補足。未確認の動きは混ぜない）\n添付する参考動画：${c.referenceVideoName||'なし。URLを閲覧できない場合はユーザーが利用できる動画か連続スクリーンショットを追加する'}\n確認メモ：${c.observations||'なし'}\n時間別の動き：${c.timelineNotes||'なし'}\n希望の動き：${c.motionNotes||'目線・小さな重心移動・自然な笑顔を中心にする'}\n企画の補足：${c.brief||'人物と服装が見やすく、最初の1秒で目線を引くリールにする'}`;
 const attachmentText=manifest.map(item=>`- ${item.id}: ${item.label}（${item.instruction}）`).join('\n');
 const storyboard=shots.map(shot=>`カット${shot.index} [${shot.start}〜${shot.end}秒／${shot.duration}秒]\n  開始画像：${shot.startFrame}\n  終了画像：${shot.endFrame}\n  身体：${shot.motion}\n  表情：${shot.expression}\n  カメラ：${shot.camera}\n  拍：${shot.beatCue}`).join('\n\n');
 const limits='URLだけで参照動画を見たと判断しない。閲覧できなければその事実を明記し、振付・表情・BPM・歌詞を推測で断定しない。同じ動きの完全再現は保証せず、確認できた姿勢・動作順・目線・カメラの方向を近づける。未確認部分は「提案」として分ける。';
 const chatgptPrompt=`あなたはファッションリールの演出家です。制作先はMeta AIのMuse Image / Muse Videoです。添付の本人画像とスタイリング資料を使い、MUSEへ渡す開始・終了画像とカット別の動画指示を準備してください。まず画像・参照動画の閲覧可否を確認してください。\n\n${settings}\n\n${reference}\n\n【参照の扱い】\n${limits}\nユーザー確認メモがある場合も、あなた自身が確認した内容と区別する。参考動画を実際に見られる場合は、時刻・身体の動作・顔の表情・カメラ・強拍の表を先に作り、下の仮構成を確認結果に合わせて修正する。複数URLの動きを混ぜず、選んだ主参考の動作順を優先する。\n\n【作成する画像】\n成人の本人の同一性を維持。全カットで服の色・素材・装飾、髪の長さ、場所・照明の向きを統一する。開始画像は動作の準備姿勢、終了画像は自然な到達姿勢。顔と指を鮮明にし、頭と手足に余白を残す。9:16の画像を1枚ずつ独立して作る。文字・歌詞・ロゴ・フレーム・コラージュは画像に焼き込まない。画像生成できない場合は各画像の生成プロンプトを出し、生成済みとは言わない。次カットの開始姿勢は前カットの終了姿勢とつなげる。\n\n【仮のカット構成・未確認部分は提案】\n${storyboard}\n\n【返答形式】\n1. 確認できた資料と不足資料。2. 確認済みの動きと提案を分けたタイムライン。3. ファイル名付きの開始・終了画像、または各画像の生成プロンプト。4. MUSEに1カットずつ貼る動画プロンプト（秒数、身体、表情、カメラ、拍、終了姿勢を含む）。5. 接続と音楽合わせの編集指示。\nMUSEの対応する参照動画入力・開始終了フレーム・動画尺は未確認。利用画面で確認し、非対応項目は通常の画像＋テキスト指示へ置き換える。長尺を一度に生成する前提にせず、対応する尺で分割して編集する。音源と時刻がなければ正確なビート同期やリップシンクを約束しない。歌詞は取得せず、必要なら権利のある歌詞と時刻をユーザーに依頼する。\n\n【添付と出力ファイル一覧】\n${attachmentText}`;
 const shotBodies=shots.map(shot=>`【カット${shot.index}：全体${shot.start}〜${shot.end}秒、生成目安${shot.duration}秒】\n開始参照 ${shot.startFrame}、終了目標 ${shot.endFrame}。終了画像入力が非対応なら開始画像だけ添付し、終了姿勢を文章で指定。\n成人の本人画像 ${identity} の同じ人物を維持。${c.hair}。${c.outfit}。${c.location}。${c.composition}。\n${c.referenceStatus==='observed'?'ユーザー確認メモ・時間別の動きを最優先し、このカットの該当区間の姿勢、動作順、目線、カメラ方向へ近づける。確認メモにない動きだけ次の提案を使う。':'参照動画の動作は未確認。次は参考動画の解析結果ではなく演出の提案：'}\n動きの個別補足 ${c.motionNotes||'なし'}。時間別メモ ${c.timelineNotes||'なし'}。このカットの時間帯に該当する明示的な動作があれば、それを次の汎用提案より優先する。\n身体 ${shot.motion}。表情 ${shot.expression}。カメラ ${shot.camera}。${shot.beatCue}\n滑らかな加速と減速。顔・体型・服の構造を変形させない。指と手足の数を維持。動作は一度に一つ。物理的に可能な重心と接地。カメラは滑らかで過剰な揺れなし。終了は自然な静止姿勢で次へつなぐ。文字・字幕・ロゴを映像に生成しない。`);
 const shotPrompts=shotBodies.map(body=>`Meta AI / Muse Video カット別指示\n\n${settings}\n\n${reference}\n\n${limits}\n${c.chatgptResult?'【ChatGPTから持ち帰った構成・ユーザー入力】\n'+c.chatgptResult+'\nこのカットの該当区間は下の仮構成より優先する。未確認の主張は検証済みと扱わない。':'ChatGPTから持ち帰った構成：なし。'}\n\n${body}\n\n対応尺と画像・参照動画入力欄は利用画面で確認。音源と時刻がなければ正確な同期・リップシンクは約束しない。`);
 const museShots=shotBodies.join('\n\n');
 const musePrompt=`Meta AI / Muse Video用 リール制作指示（直接入力用・またはChatGPTで確認した後に更新する原案）\n\n${settings}\n\n${reference}\n\n【ChatGPTから持ち帰った構成・ユーザー入力】\n${c.chatgptResult||'なし。下の仮構成を使う。'}\n入力がある場合は下の仮構成より優先する。ただし資料の閲覧・動きの確認は別途確かめ、未確認の主張を検証済みと扱わない。\n\n【重要】\n${limits}\nURLの自動読み込みや参照動画入力への対応は確認していない。参照を開けない場合は画像と文章で進め、確認済みとは言わない。MUSEの実際の対応尺と入力欄を確認し、下のカットを1本ずつ生成する。合計${c.duration}秒は編集後の目標で、一度の生成尺の保証ではない。音声は別工程で付ける。拍の原点はユーザーが曲の開始位置へ合わせ、最終編集でカット・アクセントを微調整する。音源と歌唱時刻がなければリップシンクは指定しない。\n\n${museShots}\n\n【仕上げ】\nカットを記載順に接続し、髪・服・照明・画角の連続性を確認。主拍で動作が始まり、強いアクセントで目線や姿勢が決まるよう実音源へ調整。冒頭と終わりの画角を近づけてループ感を出す。歌詞・テキストは後編集で安全領域内に重ねる。\n\n【添付一覧】\n${attachmentText}`;
 return {chatgptPrompt,musePrompt,shotPrompts,manifest,shots,config:c};
}
