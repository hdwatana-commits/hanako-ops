// Local-only analysis. Reuses OPS's own beat estimator; no audio is uploaded.
import {analyze} from './reel-engine.mjs?v=5';
const clamp=(x,lo=0,hi=1)=>Math.max(lo,Math.min(hi,x));
const round=x=>Math.round(x*1000)/1000;
const mean=a=>a.reduce((s,x)=>s+x,0)/Math.max(1,a.length);
const deviation=a=>{const m=mean(a);return Math.sqrt(mean(a.map(x=>(x-m)**2)));};
const quantile=(a,q)=>{const sorted=[...a].sort((x,y)=>x-y);return sorted[Math.floor((sorted.length-1)*q)]||0;};
export const SONG_ANALYSIS_METHOD='OPS local beat estimator + 4-second RMS/spectral-proxy repetition candidates v1; chorus and acoustic accents require listening review; accents are not verified metrical downbeats';

function features(samples,rate){
 const size=Math.round(rate*4),hop=Math.max(1,Math.floor(rate/8000)),blocks=[];
 for(let start=0;start+size<=samples.length;start+=size){
  const bins=[],colors=[],crossings=[];
  for(let k=0;k<8;k++){
   const from=start+Math.floor(size*k/8),to=start+Math.floor(size*(k+1)/8);let total=0,low=0,bass=0,cross=0,last=0,count=0;
   const alpha=1-Math.exp(-2*Math.PI*180/(rate/hop));
   for(let i=from;i<to;i+=hop){const x=samples[i];low+=alpha*(x-low);total+=x*x;bass+=low*low;if((x>=0)!==(last>=0))cross++;last=x;count++;}
   bins.push(Math.sqrt(total/Math.max(1,count)));colors.push(total?bass/total:0);crossings.push(cross/Math.max(1,count));
  }
  blocks.push({start:start/rate,energy:mean(bins),bins,colors,crossings});
 }
 return blocks;
}
function similarity(blocks,a,b,length){
 const ea=mean(blocks.slice(a,a+length).map(x=>x.energy)),eb=mean(blocks.slice(b,b+length).map(x=>x.energy));
 if(!ea||!eb||Math.max(ea,eb)/Math.min(ea,eb)>1.5)return 0;
 let error=0,n=0;
 for(let j=0;j<length;j++)for(let k=0;k<8;k++){
  const x=blocks[a+j],y=blocks[b+j];
  error+=Math.min(2,Math.abs(x.bins[k]/ea-y.bins[k]/eb))*.5;
  error+=Math.min(1,Math.abs(x.colors[k]-y.colors[k]))*.3;
  error+=Math.min(1,Math.abs(x.crossings[k]-y.crossings[k])*4)*.2;n++;
 }
 return clamp(1-error/Math.max(1,n));
}
function chorusCandidates(blocks,duration){
 if(blocks.length<10)return [];
 const energies=blocks.map(x=>x.energy),p15=quantile(energies,.15),p85=quantile(energies,.85),loud=quantile(energies,.6);
 // Stationary noise, steady tones and unchanging repeated loops do not identify song structure.
 if(p85<.006||(p85-p15)/Math.max(.001,p85)<.2)return [];
 const phrases=blocks.length>=14?5:4,candidates=[];
 for(let a=1;a+phrases<=blocks.length;a++){
  const row=blocks[a],before=blocks[a-1],average=mean(blocks.slice(a,a+phrases).map(x=>x.energy));
  const lift=(average-before.energy)/Math.max(.005,average);
  const colorChange=Math.abs(mean(row.colors)-mean(before.colors));
  if(average<loud*.95||(lift<.18&&colorChange<.12))continue;
  const detail=blocks.slice(a,a+phrases).flatMap(x=>x.bins),shape=deviation(detail)/Math.max(.001,mean(detail));
  if(shape<.035)continue;
  let best=0,match=-1;
  for(let b=1;b+phrases<=blocks.length;b++){
   if(Math.abs(a-b)<phrases+1)continue;
   const score=similarity(blocks,a,b,phrases);
   if(score>best){best=score;match=b;}
  }
  if(best<.92||match<0)continue;
  let length=phrases;
  while(length<8&&a+length<blocks.length&&match+length<blocks.length&&blocks[a+length].energy>=loud*.9&&blocks[match+length].energy>=loud*.9&&similarity(blocks,a+length,match+length,1)>.92)length++;
  const start=round(row.start),end=round(Math.min(duration,start+length*4));
  const confidence=round(Math.min(.72,.4+(best-.9)*1.1+Math.min(.12,Math.max(0,lift)*.15)));
  candidates.push({start,end,confidence,reason:`約${Math.abs(a-match)*4}秒離れた区間に似た音量・音色・拍形の反復と音の立ち上がりを検出。サビかは未確認。`,similarSectionStart:round(blocks[match].start)});
 }
 return candidates.sort((a,b)=>b.confidence-a.confidence||a.start-b.start).filter((row,i,all)=>all.slice(0,i).every(x=>Math.abs(x.start-row.start)>=8)).slice(0,5);
}

/** Mono PCM only, max 10 minutes. Any reported chorus is a coarse candidate, never verified. */
export function analyzeSongAudio(samples,rate,{fingerprint,duration:declaredDuration}={}){
 if(!(samples instanceof Float32Array)||!samples.length)throw Error('解析するモノラル音声データがありません。');
 if(!Number.isFinite(rate)||rate<1000||rate>48000)throw Error('音声のサンプルレートを確認してください。');
 const duration=samples.length/rate;
 if(duration>600)throw Error('解析できる音源は10分までです。必要なバージョンだけに短くしてください。');
 if(declaredDuration!==undefined&&(!Number.isFinite(declaredDuration)||Math.abs(declaredDuration-duration)>.1))throw Error('音源の長さと解析データが一致しません。');
 for(const sample of samples)if(!Number.isFinite(sample))throw Error('音声データに読み込めない値があります。');
 const result=analyze(samples,rate),blocks=features(samples,rate),candidates=chorusCandidates(blocks,duration);
 const accents=result.peaks.filter(p=>p.accent>=.8).map(p=>({time:round(p.time),strength:round(p.accent)}));
 const selected=candidates[0]||null,status=selected||result.reliable?'auto-review':'unverified';
 const metadata={duration:round(duration),bpm:result.reliable?result.bpm:null,beats:result.reliable?result.beats.map(p=>({time:round(p.time),strength:round(p.strength),inferred:Boolean(p.inferred)})):[],accents,chorusStart:selected?.start??null,chorusEnd:selected?.end??null,chorusCandidates:candidates,recommendedClips:{},analysisStatus:status,chorusStatus:selected?'auto-review':'unverified',rhythmStatus:result.reliable?'auto-review':'unverified',confidence:selected?.confidence??0,beatConfidence:round(result.reliable?result.confidence:0),analysisMethod:SONG_ANALYSIS_METHOD,analyzedAt:new Date().toISOString(),fingerprint:typeof fingerprint==='string'?fingerprint.slice(0,160):null,downbeatStatus:'unverified',notes:'サビは反復と音量・音色の変化からの候補です。強い音のピークは小節の1拍目や公式振付のアクセントを保証しません。試聴して補正してください。'};
 for(const seconds of[10,15,20,30]){const clip=chooseSongClip(metadata,seconds);if(clip.start!==null)metadata.recommendedClips[seconds]={start:clip.start,end:clip.end,status:clip.status};}
 return metadata;
}

/** Auto selection stays within the identified chorus. Manual start intentionally overrides that bound, never the source length. */
export function chooseSongClip(metadata,requestedDuration,{manualStart,chorusStart,chorusEnd}={}){
 const duration=Number(requestedDuration);if(![10,15,20,30].includes(duration))throw Error('動画尺は10・15・20・30秒から選んでください。');
 const sourceDuration=metadata?.duration;
 const validLength=Number.isFinite(sourceDuration)&&sourceDuration>0;
 const hasManual=manualStart!==undefined&&manualStart!==null&&manualStart!=='';
 const unavailable=(reason,alternatives=[],availableSeconds=null)=>({start:null,end:null,duration,status:'unavailable',needsReview:true,alternatives,availableSeconds,reason});
 if(!validLength)return unavailable('音源の長さが未確認です。利用権のある音源を登録して解析してください。');
 if(hasManual){
  const start=Number(manualStart);if(!Number.isFinite(start)||start<0)throw Error('開始位置は0以上の秒数で指定してください。');
  if(start+duration>sourceDuration+.001){const available=Math.max(0,sourceDuration-start);return unavailable('指定区間が音源の終わりを超えます。短い動画尺か前の開始位置を選んでください。',[10,15,20,30].filter(d=>d<=available+.001).map(d=>({duration:d,start:round(start),end:round(start+d)})),round(available));}
  return {start:round(start),end:round(start+duration),duration,status:'manual',needsReview:true,alternatives:[],availableSeconds:round(sourceDuration-start),reason:'手動指定した使用区間です。サビ・拍の位置は試聴して確認してください。'};
 }
 const start=chorusStart===undefined?metadata?.chorusStart:chorusStart,end=chorusEnd===undefined?metadata?.chorusEnd:chorusEnd;
 if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start||end>sourceDuration+.001)return unavailable('サビの位置は未確認です。音源を解析するか、試聴してサビ開始・終了を登録してください。');
 const available=Math.min(end,sourceDuration)-start,alternatives=[10,15,20,30].filter(d=>d<=available+.001).map(d=>({duration:d,start:round(start),end:round(start+d)}));
 if(available+.001<duration)return unavailable('サビ区間が選択した動画尺より短いため延長しません。短い尺の候補を選ぶか、使用区間を手動指定してください。',alternatives,round(available));
 const unchanged=(chorusStart===undefined||chorusStart===metadata.chorusStart)&&(chorusEnd===undefined||chorusEnd===metadata.chorusEnd),verified=(metadata.chorusStatus??metadata.analysisStatus)==='verified'&&unchanged;
 return {start:round(start),end:round(start+duration),duration,status:verified?'verified':'auto-review',needsReview:!verified,alternatives,availableSeconds:round(available),reason:verified?'この音源バージョンで確認済みのサビ区間です。':'自動解析または未検証の候補です。試聴して位置を確認してください。'};
}
