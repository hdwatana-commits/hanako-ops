/** Local presentation/caption proposals only; no media analysis, uploads or posting. */
const options = (value, allowed, fallback) => allowed.includes(value) ? value : fallback;
const clean = (value, max = 120) => Array.from(String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim()).slice(0, max).join('');
const usable = value => typeof value === 'string' && value.trim() && !/unknown|unconfirmed|not visible|not observed|cannot see|\b(?:no|not|never|without|neither)\b|未確認|見えない/i.test(value);
function observedTheme(input) {
 if (!['auto', 'manual'].includes(input.analysisStatus) || !Array.isArray(input.observations)) return 'mood';
 const rows = input.observations.slice(0, 60).filter(row => row && ['medium', 'high'].includes(row.confidence));
 if (rows.some(row => usable(row.expression) && !/no smile|not smiling|without a smile/i.test(row.expression) && /smil|grin|laugh|笑顔|微笑/i.test(row.expression))) return 'smile';
 if (rows.some(row => [row.feet, row.body].some(value => usable(value) && !/no steps?|not stepping|without stepping/i.test(value) && /steps?|stepping|dance|dancing|ステップ|踊/i.test(value)))) return 'dance';
 if (rows.some(row => [row.body, row.camera, row.leftHand, row.rightHand].some(value => usable(value) && /skirt|dress|outfit|pleat|衣装|スカート|コーデ/i.test(value)))) return 'outfit';
 return 'mood';
}

const themes = {
 mood: { label:'可愛い雰囲気', body:['ふわっと可愛い雰囲気を、少しだけ。','仕草にときめく一瞬を、そっと。','自分らしい可愛さが伝わるといいな。'], question:['どの瞬間が気になった？','この雰囲気、好き？','お気に入りの一瞬はどこ？'], overlay:['今日のときめき、見つけてね♡','可愛い一瞬を、見つけてほしい♡','最後の余韻まで、見てほしいな♡'], tags:['#リール動画','#大人可愛い','#自分らしく'] },
 dance: { label:'ダンスの仕草', body:['リズムに乗せた仕草も、私らしく可愛く。','ひとつひとつの動きに、ときめきを添えて。','可愛い動きの余韻まで楽しんでもらえたら。'], question:['どの仕草がいちばん好き？','このリズム感、好き？','もう一度見たくなる瞬間はどこ？'], overlay:['このステップ、好きになってね♡','リズムの中の可愛さ、見つけて♡','最後の仕草まで、見てほしいな♡'], tags:['#リール動画','#ダンス動画','#大人可愛い'] },
 outfit: { label:'コーデの見どころ', body:['服も仕草も、自分らしい可愛さで。','シルエットや小さな仕草まで楽しめるといいな。','お気に入りの雰囲気を、動きにそっと添えて。'], question:['コーデと仕草、どちらが気になった？','この雰囲気、好き？','どの瞬間のコーデが気になる？'], overlay:['コーデの可愛さも、見つけてね♡','仕草とコーデ、どっちが好き？♡','動くたびの可愛さ、見つけてね♡'], tags:['#リール動画','#コーデ動画','#大人可愛い','#ファッション'] },
 smile: { label:'笑顔と目線', body:['表情がふっとほどける瞬間に、ときめきを。','目線と小さな笑顔まで、そっと届けたい。','やわらかな表情で、可愛い余韻を残せたら。'], question:['どの表情がいちばん好き？','笑顔と目線、どちらが気になった？','もう一度見たくなる表情はどこ？'], overlay:['その笑顔の瞬間、見つけてね♡','笑顔の中の可愛さ、見つけてね♡','ふとした表情も、見つけてね♡'], tags:['#リール動画','#笑顔','#大人可愛い'] },
};
const tones = {
 sweet: { label:'甘め・かわいい', hooks:['ちょっとだけ、ときめいてほしいな♡','可愛い瞬間、見つけてくれた？♡','きゅんとする一瞬を届けたい♡','今日の可愛さ、ひとつ見つけて♡'], endings:['♡','🎀','♡'] },
 playful: { label:'あざと可愛い', hooks:['ねえ、今の一瞬見てた？♡','どこで目が止まった？♡','ちょっとだけ、こっちに夢中になって♡','その一瞬、見逃さないでね♡'], endings:['♡','✨','♡'] },
 soft: { label:'ふんわり上品', hooks:['やわらかな余韻を、少しだけ。','ふと目が留まる一瞬を。','小さなときめきを、そっと。','自分らしい一瞬が届きますように。'], endings:['','🌷',''] },
};

function buzzProposal(mode) {
 const core = 'These are OPTIONAL PRESENTATION PROPOSALS, not observed facts from the reference. The confirmed reference choreography, anatomical left/right, gaze order, camera/framing sequence, 1.0x playback speed, source timestamps and 0.5-second checkpoints take precedence. Never insert a new gesture, change a pose duration, retime to a beat, increase gesture amplitude, add a camera move, alter the expression order, or fabricate an unseen action to make the clip more engaging. Keep identity, costume, skirt fabric physics, background and lighting continuity unchanged. No guarantee of reach, virality or engagement. Do not render captions, text or logos into the generated footage; any short overlay is for separate editing.';
 const proposals = {
  reference: { label:'参考を忠実に', hook:'参考動画の冒頭の画角・動きをそのまま使い、表情や手足が見やすい仕上がりを確認します。', ending:'参考の終了姿勢を保ち、次のカットへ自然につなぎます。', prompt:'REFERENCE-FIRST PRESENTATION: Preserve the reference as closely as the confirmed observations allow. Prioritize a readable face and visible moving hands and feet within the approved framing. Do not add a promotional flourish.' },
  cute: { label:'バズり・かわいい', hook:'冒頭0〜1秒で、参考にある目線や表情が伝わるよう見やすさを重視します。新しい仕草や目線は加えません。', ending:'参考にある笑顔や終了姿勢の余韻を生かします。冒頭とつながる場合だけ、編集で自然なループを検討します。', prompt:'CUTE PRESENTATION PROPOSAL: In the original opening 0–1 seconds, make any already-observed eye contact and facial expression easy to read, without moving or replacing that moment. Give the observed smile, finger details and physically plausible skirt flutter delicate visual clarity. Keep a natural, soft photographic finish within the approved light setup, with no skin smoothing or body changes. At the existing ending, preserve the original expression and settling pose. A loop is an editing option only if the confirmed ending actually matches the beginning; do not invent a new ending pose.' },
  dynamic: { label:'バズり・ダイナミック', hook:'冒頭0〜1秒から、参考にある動作の切り返しや全身の動きを見やすく。振付や速度・画角は変えません。', ending:'参考どおりの決め姿勢と減速を明瞭にし、動作が落ち着いたところで自然につなぎます。', prompt:'DYNAMIC PRESENTATION PROPOSAL: Make existing weight transfers, direction changes, hand shapes and grounded foot contacts visually clear from the original opening. Use crisp, continuous execution of the observed movement without increasing its speed, range or force. Preserve realistic motion blur, anatomical balance and natural fabric inertia. Do not add a zoom, flash, shake, jump, exaggerated wind or new dance move. Keep any observed expression changes at their original times. Preserve the confirmed ending pose and natural deceleration; consider a loop later only when the actual end and beginning already connect.' },
 };
 const selected=proposals[mode];
 return {...selected,prompt:core+'\n'+selected.prompt,editingNotes:['キャプションは投稿欄用の文章テンプレート案です。映像内の文字・字幕はOPSの手順4の仕上げ、または編集アプリで追加します。','冒頭テロップは顔・手・足やInstagramの操作表示と重ならない位置へ。元動画の動作時間と音楽のフレーズを優先します。','ループは冒頭と終了の姿勢が実際につながる場合だけ検討し、尺や振付を勝手に変更しません。']};
}

export function buildMotionSocialPackage(input={}) {
 const buzzMode=options(input.buzzMode,['reference','cute','dynamic'],'reference');
 const captionTheme=options(input.captionTheme,['auto','dance','outfit','smile'],'auto');
 const captionTone=options(input.captionTone,['sweet','playful','soft'],'sweet');
 const platform=input.platform==='Threads'?'Threads':'Instagram';
 const rawVariant=Number(input.captionVariant),variant=Number.isFinite(rawVariant)?Math.abs(Math.trunc(rawVariant))%12:0;
 const captionNote=clean(input.captionNote),themeId=captionTheme==='auto'?observedTheme(input):captionTheme,theme=themes[themeId],tone=tones[captionTone];
 const labels=['ふわっと気持ちを伝える','短い導入で目を引く','会話につながるひとこと'];
 const captions=Array.from({length:3},(_,index)=>{
  const hook=tone.hooks[(variant+index)%tone.hooks.length],body=theme.body[(variant+index)%3],question=theme.question[(variant+index)%3]+tone.endings[index];
  const lines=index===1?[hook,question]:[hook,body,question];
  if(captionNote)lines.splice(lines.length-1,0,captionNote);
  const text=lines.join('\n'),hashtags=platform==='Instagram'?[...theme.tags]:[];
  return{id:`${themeId}-${captionTone}-${variant}-${index}`,label:labels[index],text,hashtags,fullText:text+(hashtags.length?'\n\n'+hashtags.join(' '):''),shortOverlay:theme.overlay[(variant+index)%3]};
 });
 return{captions,buzz:buzzProposal(buzzMode),notes:['端末内で作る文章テンプレート案です。AIが完成動画を視聴して作った投稿文ではありません。','歌詞・曲名・実際の外出先や交際などを自動取得・推測しません。投稿前に内容をご自身で確認してください。','「バズり」は演出の提案名です。再生数や反応を保証するものではありません。'],config:{buzzMode,captionTheme,captionTone,captionNote,captionVariant:variant,platform,resolvedTheme:themeId,themeLabel:theme.label,toneLabel:tone.label}};
}
