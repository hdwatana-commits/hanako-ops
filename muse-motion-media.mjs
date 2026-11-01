// Reference movies, their audio and the identity image remain on this device.
// Only the caller can explicitly send the extracted stills to a vision service.
import {analyze} from './reel-engine.mjs?v=5';

export const MOTION_MEDIA_LIMITS={videoBytes:150*1024*1024,audioBytes:40*1024*1024,audioReadMs:8000,audioDecodeMs:15000,sourceDuration:600,clipMin:2,clipMax:30,frames:60,longEdge:384,frameChars:150000,totalFrameChars:2000000};
const rounded=value=>Math.round(value*1000)/1000;
const abortError=()=>new DOMException('処理を中止しました。','AbortError');
const checkAbort=signal=>{if(signal?.aborted)throw abortError();};

// File reads and native audio decoding do not accept AbortSignal and can remain
// pending on mobile. Stop waiting promptly; a late native result is ignored.
function mediaTask(run,{signal,timeout}){
 checkAbort(signal);
 return new Promise((resolve,reject)=>{
  let timer,settled=false;
  const clean=()=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);};
  const finish=(callback,value)=>{if(settled)return;settled=true;clean();callback(value);};
  const abort=()=>finish(reject,abortError());
  signal?.addEventListener('abort',abort,{once:true});
  timer=setTimeout(()=>finish(reject,new DOMException('音声解析がタイムアウトしました。','TimeoutError')),timeout);
  try{Promise.resolve(run()).then(value=>finish(resolve,value),error=>finish(reject,error));}catch(error){finish(reject,error);}
 });
}

export function validateMotionVideo(file){
 if(!file||!Number.isFinite(file.size)||file.size<=0)throw Error('参考動画を選んでください。');
 if(!/^video\/(mp4|quicktime)$/i.test(file.type||'')&&!/\.(mp4|mov|m4v)$/i.test(file.name||''))throw Error('参考動画はMP4・MOVを選んでください。');
 if(file.size>MOTION_MEDIA_LIMITS.videoBytes)throw Error('参考動画は150MB以内にしてください。必要な部分だけ短くして選び直せます。');
}
export function validateMotionClip({start=0,duration},sourceDuration){
 if(!Number.isFinite(sourceDuration)||sourceDuration<=0||sourceDuration>MOTION_MEDIA_LIMITS.sourceDuration)throw Error('参考動画は10分以内で、長さを読み取れる動画にしてください。');
 if(!Number.isFinite(start)||start<0||!Number.isFinite(duration)||duration<MOTION_MEDIA_LIMITS.clipMin||duration>MOTION_MEDIA_LIMITS.clipMax||start+duration>sourceDuration+.001)throw Error('参考動画の中から、2〜30秒の区間を指定してください。');
 return{start,duration};
}
export function motionFrameTimes(duration){
 if(!Number.isFinite(duration)||duration<2||duration>30)throw Error('参照する区間は2〜30秒にしてください。');
 const count=Math.min(MOTION_MEDIA_LIMITS.frames,Math.ceil(duration*2));
 // Exactly half-second checkpoints; do not stretch time to fit an ending frame.
 return Array.from({length:count},(_,index)=>rounded(index*.5));
}
export function fitMotionFrame(width,height,longEdge=MOTION_MEDIA_LIMITS.longEdge){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<1||height<1||!Number.isFinite(longEdge)||longEdge<1)throw Error('動画の画角を読み取れませんでした。');
 const scale=Math.min(1,longEdge/Math.max(width,height));
 return{width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};
}

function mediaEvent(video,name,{signal,timeout=12000,trigger}={}){
 checkAbort(signal);
 return new Promise((resolve,reject)=>{
  let timer;
  const clean=()=>{clearTimeout(timer);video.removeEventListener(name,done);video.removeEventListener('error',fail);signal?.removeEventListener('abort',abort);};
  const done=()=>{clean();resolve();},fail=()=>{clean();reject(Error('動画を読み込めませんでした。iPhoneで再生できるMP4/MOVに変換して選び直してください。'));},abort=()=>{clean();reject(abortError());};
  video.addEventListener(name,done,{once:true});video.addEventListener('error',fail,{once:true});signal?.addEventListener('abort',abort,{once:true});
  timer=setTimeout(()=>{clean();reject(Error('動画の読み込みがタイムアウトしました。短い区間へ切り出すか、別のMP4/MOVをお試しください。'));},timeout);
  if(trigger)try{trigger();}catch(error){clean();reject(error);}
 });
}
async function openVideo(file,{signal}={}){
 validateMotionVideo(file);checkAbort(signal);
 const video=document.createElement('video'),url=URL.createObjectURL(file);
 video.muted=true;video.playsInline=true;video.preload='auto';video.setAttribute('playsinline','');video.setAttribute('aria-hidden','true');video.tabIndex=-1;
 // Safari decodes a paused video more consistently when it is in the document.
 video.style.cssText='position:fixed;left:-10000px;top:0;width:1px;height:1px;pointer-events:none';
 document.body.append(video);
 let cleaned=false;
 const cleanup=()=>{if(cleaned)return;cleaned=true;for(const release of [()=>video.pause(),()=>video.removeAttribute('src'),()=>video.load(),()=>video.remove(),()=>URL.revokeObjectURL(url)])try{release();}catch{}};
 try{
  await mediaEvent(video,'loadedmetadata',{signal,trigger:()=>{video.src=url;video.load();}});checkAbort(signal);
  const metadata={duration:video.duration,width:video.videoWidth,height:video.videoHeight};
  if(!Number.isFinite(metadata.duration)||metadata.duration<=0||metadata.duration>600)throw Error('参考動画は10分以内で、長さを読み取れる動画にしてください。');
  fitMotionFrame(metadata.width,metadata.height);
  return{video,metadata,cleanup};
 }catch(error){cleanup();throw error;}
}
export async function inspectMotionVideo(file,{signal}={}){
 const media=await openVideo(file,{signal});try{return media.metadata;}finally{media.cleanup();}
}
async function settleFrame(video,signal){
 checkAbort(signal);
 if(video.requestVideoFrameCallback){
  // A paused seek may already have presented its frame. In that case the
  // callback need not fire, so retain the seeked fallback instead of hanging.
  await new Promise((resolve,reject)=>{
   let callback,timer;const clean=()=>{clearTimeout(timer);if(callback!==undefined)video.cancelVideoFrameCallback?.(callback);signal?.removeEventListener('abort',abort);};
   const finish=()=>{clean();resolve();},abort=()=>{clean();reject(abortError());};
   signal?.addEventListener('abort',abort,{once:true});callback=video.requestVideoFrameCallback(finish);timer=setTimeout(finish,80);
  });
 }else await new Promise((resolve,reject)=>{
  let timer;const abort=()=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);reject(abortError());};
  signal?.addEventListener('abort',abort,{once:true});timer=setTimeout(()=>{signal?.removeEventListener('abort',abort);resolve();},40);
 });
 checkAbort(signal);
}

// Reserve an equal share of the image-data budget for every half-second sample.
// Lower JPEG quality before reducing dimensions; never remove timing samples to
// make a busy background fit. A 256px long edge is the minimum visual fallback.
function encodeMotionFrame(video,canvas,ctx,size,budget,signal){
 const edges=[...new Set([Math.max(size.width,size.height),Math.min(320,Math.max(size.width,size.height)),Math.min(256,Math.max(size.width,size.height))])];
 for(const edge of edges){
  checkAbort(signal);const fit=fitMotionFrame(size.width,size.height,edge);canvas.width=fit.width;canvas.height=fit.height;ctx.drawImage(video,0,0,fit.width,fit.height);
  for(const quality of [.66,.56,.46]){
   checkAbort(signal);const dataUrl=canvas.toDataURL('image/jpeg',quality);checkAbort(signal);
   if(!dataUrl.startsWith('data:image/jpeg;base64,'))throw Error('確認用のJPEG画像を作れませんでした。Safariを更新するか、別のMP4/MOVをお試しください。');
   if(dataUrl.length<=budget)return dataUrl;
  }
 }
 throw Error('参考コマを、動きが分かる画質と送信容量の範囲に収められませんでした。使用区間を短くして再試行してください。0.5秒ごとのコマは省略していません。');
}
export async function extractMotionFrames(file,{start=0,duration,signal,onProgress=()=>{}}={}){
 const media=await openVideo(file,{signal}),{video,metadata}=media;
 try{
  validateMotionClip({start,duration},metadata.duration);
  if(video.readyState<2)await mediaEvent(video,'loadeddata',{signal});
  const size=fitMotionFrame(metadata.width,metadata.height),canvas=document.createElement('canvas');canvas.width=size.width;canvas.height=size.height;
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('このブラウザでは参考フレームを作れません。Safariを更新してお試しください。');
  const frames=[],times=motionFrameTimes(duration),frameBudget=Math.min(MOTION_MEDIA_LIMITS.frameChars,Math.floor(MOTION_MEDIA_LIMITS.totalFrameChars/times.length));let chars=0;
  for(const [index,time] of times.entries()){
   checkAbort(signal);const sourceTime=Math.min(start+time,metadata.duration-.001);
   if(Math.abs(video.currentTime-sourceTime)>.0001)await mediaEvent(video,'seeked',{signal,trigger:()=>{video.currentTime=sourceTime;}});
   await settleFrame(video,signal);
   const dataUrl=encodeMotionFrame(video,canvas,ctx,size,frameBudget,signal);chars+=dataUrl.length;
   if(!dataUrl.startsWith('data:image/jpeg;base64,')||dataUrl.length>MOTION_MEDIA_LIMITS.frameChars||chars>MOTION_MEDIA_LIMITS.totalFrameChars)throw Error('確認用フレームの容量が大きいため、参考区間を短くしてお試しください。');
   frames.push({time,dataUrl,sourceTime:rounded(sourceTime)});onProgress({done:index+1,total:times.length,bytes:chars,byteLimit:MOTION_MEDIA_LIMITS.totalFrameChars,frameBytes:dataUrl.length});
  }
  return frames;
 }finally{media.cleanup();}
}

export function monoMotionClip(buffer,{start=0,duration},rate=12000){
 validateMotionClip({start,duration},buffer.duration);
 if(!Number.isFinite(buffer.sampleRate)||buffer.sampleRate<=0||!Number.isInteger(buffer.numberOfChannels)||buffer.numberOfChannels<1||buffer.numberOfChannels>8||!Number.isFinite(rate)||rate<1000||rate>48000)throw Error('音声の形式を読み取れませんでした。');
 const channels=Array.from({length:buffer.numberOfChannels},(_,index)=>buffer.getChannelData(index)),samples=new Float32Array(Math.round(duration*rate));
 for(let index=0;index<samples.length;index++){
  const position=(start+index/rate)*buffer.sampleRate,at=Math.floor(position),fraction=position-at;let value=0;
  for(const channel of channels)value+=((channel[at]||0)*(1-fraction)+(channel[at+1]||0)*fraction)/channels.length;
  samples[index]=Math.max(-1,Math.min(1,Number.isFinite(value)?value:0));
 }
 return{samples,rate};
}
const unknown=reason=>({bpm:null,beatTimes:[],beatStatus:'unverified',confidence:0,reason});
export function analyzeMotionSamples(samples,rate){
 if(!samples?.length)return unknown('音声がないため、テンポは未確認です。');
 const analysis=analyze(samples,rate),energy=samples.reduce((sum,value)=>sum+value*value,0)/samples.length;
 if(energy<.000001)return unknown('選択区間が無音に近いため、テンポは未確認です。');
 if(!analysis.reliable||!Number.isFinite(analysis.bpm))return unknown('拍を安定して検出できませんでした。動画を試聴し、必要ならBPMを手入力してください。');
 return{bpm:analysis.bpm,beatTimes:analysis.beats.map(beat=>rounded(beat.time)),beatStatus:'estimated',confidence:analysis.confidence,reason:'この端末で音声から推定した拍です。正確な振付との一致は試聴して補正してください。'};
}
export async function analyzeMotionTempo(file,{start=0,duration,signal}={}){
 validateMotionVideo(file);checkAbort(signal);
 // Only audio analysis needs a full compressed-file allocation. Large videos
 // can still supply reference frames and use manually entered tempo instead.
 if(file.size>MOTION_MEDIA_LIMITS.audioBytes)return unknown('40MBを超える動画の音声解析は省略しました。動きの解析は続けられます。必要なら動画を短く切り出すか、BPMを手入力してください。');
 const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return unknown('このブラウザでは音声解析に対応していません。BPMを手入力できます。');
 let context;
 try{
  const metadata=await inspectMotionVideo(file,{signal});validateMotionClip({start,duration},metadata.duration);
  // decodeAudioData loads the entire compressed track. Bound that allocation on
  // iPhone; users can trim a long source movie without losing the video route.
  if(metadata.duration>120)return unknown('2分を超える動画の音声解析は省略しました。必要な部分を短く切り出すか、BPMを手入力してください。');
  context=new Audio();
  const bytes=await mediaTask(()=>file.arrayBuffer(),{signal,timeout:MOTION_MEDIA_LIMITS.audioReadMs});checkAbort(signal);
  const buffer=await mediaTask(()=>context.decodeAudioData(bytes),{signal,timeout:MOTION_MEDIA_LIMITS.audioDecodeMs});checkAbort(signal);
  const clip=monoMotionClip(buffer,{start,duration});return analyzeMotionSamples(clip.samples,clip.rate);
 }catch(error){if(signal?.aborted||error?.name==='AbortError')throw abortError();if(error?.name==='TimeoutError')return unknown('音声解析がタイムアウトしたため、テンポは未確認です。動きの解析は続けられます。必要ならBPMを手入力してください。');return unknown('動画の音声を読み取れないため、テンポは未確認です。音声のあるMP4/MOVか、手入力BPMを使ってください。');}
 finally{if(context)try{Promise.resolve(context.close()).catch(()=>{});}catch{}}
}
