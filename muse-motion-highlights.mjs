/** Local suggestions from existing observation notes. No video AI, audio lookup or uploads. */
const fields=['camera','body','leftHand','rightHand','feet','face','gaze','expression','transition'];
const round=value=>Math.round(value*1000)/1000;
const clean=value=>typeof value==='string'?value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim().slice(0,800):'';
const known=value=>Boolean(clean(value))&&!/\b(?:unknown|unconfirmed|unclear|not visible|occluded)\b|未確認|不明|見えない/i.test(value);
function finite(value,label){if(typeof value!=='number'||!Number.isFinite(value))throw Error(`${label}を数値で指定してください。`);return value;}
function checkDuration(value,label='区間の長さ'){finite(value,label);if(value<2||value>30)throw Error(`${label}は2〜30秒で指定してください。`);return value;}
function rows(value){
 if(!Array.isArray(value)||value.length>60)throw Error('動きのメモは60区間以内で指定してください。');
 const output=value.map(row=>{
  if(!row||typeof row!=='object'||Array.isArray(row))throw Error('動きのメモを確認してください。');
  const start=finite(row.start,'メモの開始位置'),end=finite(row.end,'メモの終了位置');
  if(start<0||end<=start)throw Error('動きのメモの開始・終了位置を確認してください。');
  return {...row,start,end};
 }).sort((a,b)=>a.start-b.start||a.end-b.end);
 for(let i=1;i<output.length;i++)if(output[i].start<output[i-1].end-.00001)throw Error('動きのメモの時間帯が重なっています。');
 return output;
}
const hasNegation=value=>/\b(?:not|no|never|without|away|averted|off[- ]camera)\b|目線を外|笑顔ではな|笑わな|カメラを見ない/i.test(value);
const lens=value=>known(value)&&!hasNegation(value)&&/\b(?:eye contact|(?:look\w*|gaze\w*|eyes?)\s+(?:directly\s+)?(?:at|into|towards?|to)\s+(?:the\s+)?(?:camera|lens))\b|カメラ目線|カメラを見|レンズを見/i.test(value);
const smile=value=>known(value)&&!hasNegation(value)&&/\b(?:smil\w*|grin\w*|beam\w*|cheerful)\b|笑顔|微笑|照れ笑/i.test(value);
const pose=value=>known(value)&&!hasNegation(value)&&/\b(?:wave\w*|heart|cheek|pose\w*|turn\w*|step\w*|reach\w*)\b|手を振|ハート|頬|ポーズ|ステップ|ターン/i.test(value);

/** Suggestions cover only the currently analysed range; they are not a virality prediction. */
export function proposeMotionHighlights({observations=[],duration,referenceStart=0,targetDuration=15,analysisStatus='unverified'}={}){
 checkDuration(duration);finite(referenceStart,'参考動画の開始位置');
 if(referenceStart<0)throw Error('参考動画の開始位置は0秒以上にしてください。');
 if(![15,20].includes(targetDuration))throw Error('見せ場の候補は15秒・20秒から選んでください。');
 const source=rows(observations);
 if(source.some(row=>row.end>duration+.00001))throw Error('動きのメモが解析した区間を超えています。');
 const base={basis:'observation_text_heuristic',analysisStatus,analysedDuration:duration,targetDuration,reviewRequired:true};
 if(targetDuration>duration)return {...base,candidates:[],reason:`解析した${duration}秒より短い尺を選ぶか、${targetDuration}秒以上の区間を解析してください。`};
 if(!['auto','manual'].includes(analysisStatus))return {...base,candidates:[],reason:'動きの解析または手入力のメモを用意すると、その記載から見せ場の候補を探せます。未確認の映像内容は推測しません。'};
 const usable=source.filter(row=>row.kind!=='gap'&&(analysisStatus==='manual'||['medium','high'].includes(row.confidence))&&fields.some(field=>known(row[field])));
 if(!usable.length)return {...base,candidates:[],reason:'見せ場を判断できる動きのメモがありません。UNKNOWNや確信度の低いAIメモから、目線・笑顔・振付を推測しません。'};
 const maxStart=duration-targetDuration,starts=new Set([0]);
 for(let start=.5;start<=maxStart+.00001;start+=.5)starts.add(round(start));
 // The half-second source grid remains unchanged. Do not shift the choreography to create a hook.
 const candidates=[...starts].map(start=>{
  const end=round(start+targetDuration),opening=usable.filter(row=>row.start<start+1&&row.end>start),inside=usable.filter(row=>row.start<end&&row.end>start),evidence=[],reasons=[];
  let score=0;
  const evidenceFor=(row,field,kind)=>({kind,field,start:round(Math.max(start,row.start)),end:round(Math.min(end,row.end)),text:clean(row[field]),confidence:row.confidence||'low'});
  const first=(field,test)=>opening.find(row=>test(row[field]));
  const eye=first('gaze',lens),expression=first('expression',smile);
  if(eye){evidence.push(evidenceFor(eye,'gaze','opening_gaze'));reasons.push('冒頭1秒のメモにカメラ目線の記載');score+=eye.confidence==='high'?5:3;}
  if(expression){evidence.push(evidenceFor(expression,'expression','opening_expression'));reasons.push('冒頭1秒のメモに笑顔・微笑みの記載');score+=expression.confidence==='high'?4:2.5;}
  const gesture=opening.find(row=>['leftHand','rightHand','body','feet'].some(field=>pose(row[field])));
  if(gesture){const field=['leftHand','rightHand','body','feet'].find(field=>pose(gesture[field]));evidence.push(evidenceFor(gesture,field,'opening_pose'));reasons.push('冒頭1秒のメモに手振り・ポーズ・ステップの記載');score+=1.5;}
  const signatures=new Set(inside.map(row=>['body','leftHand','rightHand','feet','expression'].map(field=>known(row[field])?clean(row[field]).toLowerCase():'').join('|')).filter(value=>value.replace(/\|/g,'')));
  if(signatures.size>1){reasons.push('区間内のメモに複数の動作・表情の変化');score+=Math.min(3,(signatures.size-1)*.3);}
  const coverage=inside.reduce((sum,row)=>sum+Math.max(0,Math.min(end,row.end)-Math.max(start,row.start)),0)/targetDuration;
  score*=.4+.6*coverage;
  return {id:`highlight-${start.toFixed(3)}-${targetDuration}`,start:round(start),end,duration:targetDuration,sourceStart:round(referenceStart+start),sourceEnd:round(referenceStart+end),reasons,evidence,evidenceStatus:analysisStatus==='auto'?'AI観察メモからの候補・要確認':'手入力メモからの候補・未検証',reviewRequired:true,_score:score};
 }).filter(candidate=>candidate.reasons.length).sort((a,b)=>b._score-a._score||a.start-b.start);
 const picked=[];
 for(const candidate of candidates){if(picked.every(previous=>Math.abs(previous.start-candidate.start)>=1.5)){const {_score,...publicCandidate}=candidate;picked.push(publicCandidate);if(picked.length===3)break;}}
 return {...base,candidates:picked,reason:picked.length?'既存メモの文言から選んだ候補です。動画を再生し、画角・振付・音楽の区切りを確認して選んでください。再生数を予測したものではありません。':'冒頭の見せ場を示すメモがありません。元動画を見ながら開始位置を手動で選べます。'};
}

/** Rebase cached evidence into a contiguous source subrange, never retime or invent it. */
export function cropMotionAnalysis({observations=[],frames=[],tempo=null,rangeStart=0,rangeDuration}={}){
 finite(rangeStart,'候補の開始位置');checkDuration(rangeDuration,'候補の長さ');
 if(rangeStart<0)throw Error('候補の開始位置は0秒以上にしてください。');
 const end=rangeStart+rangeDuration,sourceRows=rows(observations);
 if(!Array.isArray(frames))throw Error('参考コマのデータを確認してください。');
 const nextRows=sourceRows.filter(row=>row.start<end&&row.end>rangeStart).map(row=>{
  const from=Math.max(row.start,rangeStart),to=Math.min(row.end,end);
  const result={...row,start:round(from-rangeStart),end:round(to-rangeStart)};
  if(row.motionDetails!==undefined){
   if(!Array.isArray(row.motionDetails))throw Error('詳細動作のデータを確認してください。');
   result.motionDetails=row.motionDetails.filter(point=>{finite(point?.time,'詳細動作の位置');return point.time>from&&point.time<to;}).map(point=>({...point,time:round(point.time-rangeStart)}));
  }
  if(Number.isFinite(row.sourceStart))result.sourceStart=round(row.sourceStart+from-row.start);
  if(Number.isFinite(row.sourceEnd))result.sourceEnd=round(row.sourceEnd-(row.end-to));
  return result;
 });
 const nextFrames=frames.filter(frame=>{finite(frame?.time,'参考コマの位置');return frame.time>=rangeStart&&frame.time<end;}).map(frame=>({...frame,time:round(frame.time-rangeStart)}));
 let nextTempo=null;
 if(tempo!==null){
  if(!tempo||typeof tempo!=='object'||Array.isArray(tempo))throw Error('拍位置のデータを確認してください。');
  const beatTimes=tempo.beatTimes??[];
  if(!Array.isArray(beatTimes))throw Error('拍位置は配列で指定してください。');
  nextTempo={...tempo,beatTimes:beatTimes.filter(time=>{finite(time,'拍位置');return time>=rangeStart&&time<end;}).map(time=>round(time-rangeStart))};
 }
 return {observations:nextRows,frames:nextFrames,tempo:nextTempo,duration:rangeDuration,rangeStart,requiresReview:true};
}
