// Local-only, silent H.264 finishing. Source video pixels are decoded, fitted
// without distortion and sampled at an explicit speed; no AI or network API.
import {Muxer,ArrayBufferTarget} from './vendor/mp4-muxer-5.2.2/mp4-muxer.mjs';
import {normalizeMusePolish,polishFrameState,drawMusePolish,trimMuseCutSpecs,assessLoopPixels} from './muse-motion-polish.mjs?v=1';

const FPS=30,MAX_BYTES=150*1024*1024;
const abortError=()=>new DOMException('動画の処理を中止しました。','AbortError');
const check=signal=>{if(signal?.aborted)throw abortError();};
const rounded=value=>Number(value.toFixed(6));
function finite(value,label){if(typeof value!=='number'||!Number.isFinite(value))throw Error(`${label}を数値で指定してください。`);return value;}
function validateFile(file){
 if(!file||!Number.isFinite(file.size)||file.size<=0)throw Error('MUSEで保存した動画を選んでください。');
 if(!/^video\/(mp4|quicktime|x-m4v)$/i.test(file.type||'')&&!/\.(mp4|mov|m4v)$/i.test(file.name||''))throw Error('動画はMP4・MOVを選んでください。');
 if(file.size>MAX_BYTES)throw Error('動画は1本150MB以内にしてください。');
}
function task(run,{signal,timeout=12000,message='動画の処理が時間切れになりました。'}={}){
 check(signal);
 return new Promise((resolve,reject)=>{
  let timer,settled=false;
  const clean=()=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);};
  const finish=(fn,value)=>{if(settled)return;settled=true;clean();fn(value);};
  const abort=()=>finish(reject,abortError());signal?.addEventListener('abort',abort,{once:true});
  timer=setTimeout(()=>finish(reject,new DOMException(message,'TimeoutError')),timeout);
  Promise.resolve().then(()=>{if(settled)throw abortError();check(signal);return run();}).then(value=>finish(resolve,value),error=>finish(reject,error));
 });
}
function event(video,name,{signal,trigger}={}){
 check(signal);
 return new Promise((resolve,reject)=>{
  let timer;
  const clean=()=>{clearTimeout(timer);video.removeEventListener(name,done);video.removeEventListener('error',fail);signal?.removeEventListener('abort',abort);};
  const done=()=>{clean();resolve();},fail=()=>{clean();reject(Error('動画を読み込めませんでした。iPhoneで再生できるMP4/MOVを選んでください。'));},abort=()=>{clean();reject(abortError());};
  video.addEventListener(name,done,{once:true});video.addEventListener('error',fail,{once:true});signal?.addEventListener('abort',abort,{once:true});
  timer=setTimeout(()=>{clean();reject(new DOMException('動画の読み込みが時間切れになりました。MP4/MOVを選び直してください。','TimeoutError'));},12000);
  try{trigger?.();}catch(error){clean();reject(error);}
 });
}
async function open(file,{signal}={}){
 validateFile(file);check(signal);const video=document.createElement('video'),url=URL.createObjectURL(file);
 video.muted=true;video.playsInline=true;video.preload='auto';video.setAttribute('playsinline','');video.setAttribute('aria-hidden','true');video.style.cssText='position:fixed;left:-10000px;top:0;width:1px;height:1px;pointer-events:none';
 document.body.append(video);let cleaned=false;
 const cleanup=()=>{if(cleaned)return;cleaned=true;for(const run of[()=>video.pause(),()=>video.removeAttribute('src'),()=>video.load(),()=>video.remove(),()=>URL.revokeObjectURL(url)])try{run();}catch{}};
 try{
  await event(video,'loadedmetadata',{signal,trigger:()=>{video.src=url;video.load();}});check(signal);
  const {duration,videoWidth:width,videoHeight:height}=video;
  if(!Number.isFinite(duration)||duration<=0||duration>600||!width||!height)throw Error('動画の長さ・画角を読み取れません。10分以内のMP4/MOVを選んでください。');
  if(video.readyState<2)await event(video,'loadeddata',{signal});
  return{video,metadata:{duration,width,height},cleanup};
 }catch(error){cleanup();throw error;}
}
async function seek(video,time,{signal}={}){
 check(signal);
 if(Math.abs(video.currentTime-time)>.00001)await event(video,'seeked',{signal,trigger:()=>{video.currentTime=time;}});
 // A paused seek has already decoded its target; never wait indefinitely for a
 // presentation callback that Safari may not invoke while playback is paused.
 check(signal);
}
export async function inspectGeneratedCut(file,{signal}={}){const media=await open(file,{signal});try{return media.metadata;}finally{media.cleanup();}}

/** Quantize cumulative boundaries, so rounding never accumulates across CUTs. */
export function planMuseCutAssembly(shots,{fps=FPS}={}){
 if(fps!==FPS)throw Error('仕上げのフレームレートは30fpsです。');
 if(!Array.isArray(shots)||!shots.length||shots.length>30)throw Error('仕上げるCUTを1〜30本指定してください。');
 let requested=0,frames=0;const result=[];
 for(const [index,shot]of shots.entries()){
  validateFile(shot.file);const duration=finite(shot.duration,'CUTの使用秒数'),inPoint=finite(shot.inPoint??0,'動画の開始位置'),playbackRate=shot.playbackRate??1;
  if(duration<=0||duration>30||inPoint<0||inPoint>600||![1,2].includes(playbackRate))throw Error('使用秒数は0秒より長く30秒以内、開始位置は0秒以上、速度は1倍または明示した2倍にしてください。');
  const start=frames;requested+=duration;frames=Math.round(requested*fps);const count=frames-start;
  if(count<1)throw Error('CUTの長さは1フレーム（約0.033秒）以上にしてください。');
  const outputDuration=count/fps,outPoint=inPoint+outputDuration*playbackRate,lastFrameTime=inPoint+(count-1)/fps*playbackRate;
  if(outPoint>600+.001)throw Error('指定区間が動画の上限を超えています。');
  if(shot.sourceDuration!=null&&(inPoint+duration*playbackRate>finite(shot.sourceDuration,'素材の長さ')+.001||lastFrameTime>=shot.sourceDuration))throw Error(`CUT ${index+1} の素材が不足しています。使用区間・速度を確認してください。`);
  result.push({index:index+1,file:shot.file,inPoint,outPoint:rounded(outPoint),playbackRate,duration:rounded(outputDuration),requestedDuration:duration,frameCount:count,startFrame:start,endFrame:frames,lastFrameTime:rounded(lastFrameTime)});
 }
 if(requested>30+.001)throw Error('仕上げる動画の合計は30秒以内にしてください。');
 return{fps,frameCount:frames,duration:rounded(frames/fps),requestedDuration:rounded(requested),roundingSeconds:rounded(frames/fps-requested),shots:result};
}
export function fitCutFrame(width,height,outWidth=1080,outHeight=1920){
 for(const value of[width,height,outWidth,outHeight])if(!Number.isFinite(value)||value<1)throw Error('動画の画角が不正です。');
 const scale=Math.min(outWidth/width,outHeight/height),w=width*scale,h=height*scale;
 return{x:(outWidth-w)/2,y:(outHeight-h)/2,width:w,height:h};
}
function draw(ctx,video,width,height,subjectScale=1){
 const sourceWidth=video.videoWidth,sourceHeight=video.videoHeight,fit=fitCutFrame(sourceWidth,sourceHeight,width,height),cover=Math.max(width/sourceWidth,height/sourceHeight);
 ctx.save();ctx.fillStyle='#17131a';ctx.fillRect(0,0,width,height);ctx.filter='blur(28px) brightness(.7)';
 const backgroundWidth=sourceWidth*cover*1.08,backgroundHeight=sourceHeight*cover*1.08;
 ctx.drawImage(video,(width-backgroundWidth)/2,(height-backgroundHeight)/2,backgroundWidth,backgroundHeight);ctx.filter='none';const foregroundWidth=fit.width*subjectScale,foregroundHeight=fit.height*subjectScale;ctx.drawImage(video,(width-foregroundWidth)/2,(height-foregroundHeight)/2,foregroundWidth,foregroundHeight);ctx.restore();
}
function canvas(width,height){const value=document.createElement('canvas');value.width=width;value.height=height;const ctx=value.getContext('2d',{alpha:false});if(!ctx)throw Error('このブラウザでは動画の画像を処理できません。');return{canvas:value,ctx};}
function png(value,{signal}={}){return task(()=>new Promise((resolve,reject)=>value.toBlob(blob=>blob?resolve(blob):reject(Error('接続用の画像を保存できませんでした。')),'image/png')),{signal,timeout:8000});}

/** Return the actual last displayed source frame, not an AI keyframe proposal. */
export async function extractCutBoundary(file,{inPoint=0,duration,playbackRate=1,edge='end',fps=FPS,signal}={}){
 if(!['start','end'].includes(edge))throw Error('画像の位置は開始または終了を指定してください。');
 const plan=planMuseCutAssembly([{file,inPoint,duration,playbackRate}],{fps}),shot=plan.shots[0],media=await open(file,{signal});
 try{
  if(shot.inPoint+shot.requestedDuration*shot.playbackRate>media.metadata.duration+.001||shot.lastFrameTime>=media.metadata.duration)throw Error('指定した使用区間が素材の長さを超えています。');
  const time=edge==='start'?shot.inPoint:shot.lastFrameTime;
  await seek(media.video,time,{signal});const size=fitCutFrame(media.metadata.width,media.metadata.height,1080,1920),target=canvas(1080,1920);draw(target.ctx,media.video,1080,1920);
  const blob=await png(target.canvas,{signal});check(signal);
  return{blob,time,width:1080,height:1920,sourceWidth:media.metadata.width,sourceHeight:media.metadata.height,edge,duration:plan.duration,requestedDuration:plan.requestedDuration,roundingSeconds:plan.roundingSeconds,contentBox:size};
 }finally{media.cleanup();}
}
async function encoderConfig({width=1080,height=1920,fps=FPS,signal}={}){
 if(!globalThis.VideoEncoder||!globalThis.VideoFrame)return null;
 if(width!==1080||height!==1920||fps!==FPS)throw Error('仕上げは1080×1920・30fpsです。');
 for(const codec of['avc1.420028','avc1.4d0028','avc1.640028']){
  check(signal);const config={codec,width,height,framerate:fps,bitrate:6500000,latencyMode:'realtime',avc:{format:'avc'}};
  try{const support=await task(()=>VideoEncoder.isConfigSupported(config),{signal,timeout:8000});if(support.supported)return config;}catch(error){check(signal);if(error?.name==='TimeoutError')return null;}
 }
 return null;
}
export async function canRenderMuseCuts(options={}){return Boolean(await encoderConfig(options));}

/** Local seam hint. Pixel similarity never verifies facial identity or choreography. */
export async function assessMuseLoop({shots,trim,signal}={}){
 check(signal);const specs=trim?trimMuseCutSpecs(shots,trim):shots,plan=planMuseCutAssembly(specs),first=plan.shots[0],last=plan.shots.at(-1),surface=canvas(1080,1920),small=canvas(64,114);
 if(plan.frameCount<4||first.frameCount<2||last.frameCount<2)throw Error('ループの確認には4コマ以上、最初と最後のCUTは2コマ以上の動画を指定してください。');
 const sample=async(shot,times)=>{
  const media=await open(shot.file,{signal});try{
   if(shot.inPoint+shot.requestedDuration*shot.playbackRate>media.metadata.duration+.001||shot.lastFrameTime>=media.metadata.duration)throw Error('ループ比較の素材が不足しています。使用区間を確認してください。');
   const values=[];for(const time of times){
    await seek(media.video,time,{signal});draw(surface.ctx,media.video,1080,1920);small.ctx.drawImage(surface.canvas,0,0,64,114);
    const pixels=new Uint8ClampedArray(small.ctx.getImageData(0,0,64,114).data),blob=await png(surface.canvas,{signal});check(signal);values.push({pixels,blob,time});
   }return values;
  }finally{media.cleanup();}
 };
 const start=await sample(first,[first.inPoint,Math.min(first.lastFrameTime,first.inPoint+first.playbackRate/FPS)]),end=await sample(last,[Math.max(last.inPoint,last.lastFrameTime-last.playbackRate/FPS),last.lastFrameTime]);
 check(signal);return{...assessLoopPixels({first:start[0].pixels,afterFirst:start[1].pixels,beforeLast:end[0].pixels,last:end[1].pixels,width:64,height:114}),startBlob:start[0].blob,endBlob:end[1].blob,startTime:start[0].time,endTime:end[1].time,duration:plan.duration};
}

/** Fixed-timestamp encoding. Extra source duration is discarded, never stretched. */
export async function renderMuseCuts({shots,polish,trim,width=1080,height=1920,fps=FPS,signal,onProgress=()=>{}}={}){
 check(signal);const untrimmed=planMuseCutAssembly(shots,{fps}),plan=trim?planMuseCutAssembly(trimMuseCutSpecs(shots,trim),{fps}):untrimmed,decoration=normalizeMusePolish(polish,{duration:untrimmed.requestedDuration}),polishOffset=trim?.start??0,config=await encoderConfig({width,height,fps,signal});
 if(!config)throw Error('このブラウザは指定尺のH.264 MP4仕上げに対応していません。対応する最新ブラウザか、動画編集アプリで使用区間を切り出してください。');
 const own=new AbortController(),cancel=()=>own.abort(),timeout=setTimeout(()=>own.abort(),240000);signal?.addEventListener('abort',cancel,{once:true});
 let encoder,media,wake,encodingError=null,done=0;
 try{
  check(signal);check(own.signal);
  const target=new ArrayBufferTarget(),muxer=new Muxer({target,video:{codec:'avc',width,height,frameRate:fps},fastStart:'in-memory',firstTimestampBehavior:'strict'}),surface=canvas(width,height);
  encoder=new VideoEncoder({output:(chunk,metadata)=>{if(own.signal.aborted)return;try{muxer.addVideoChunk(chunk,metadata);}catch(error){encodingError=error;}},error:error=>{encodingError=error;}});encoder.configure(config);
  let pendingWake;
  try{pendingWake=navigator.wakeLock?.request('screen');wake=await task(()=>pendingWake,{signal:own.signal,timeout:3000});}
  catch{Promise.resolve(pendingWake).then(lock=>lock?.release()).catch(()=>{});check(own.signal);}
  for(const shot of plan.shots){
   check(own.signal);onProgress({phase:'opening',cut:shot.index,index:shot.index-1,totalCuts:plan.shots.length,done,total:plan.frameCount,percent:done/plan.frameCount*100});
   media=await open(shot.file,{signal:own.signal});if(shot.inPoint+shot.requestedDuration*shot.playbackRate>media.metadata.duration+.001||shot.lastFrameTime>=media.metadata.duration)throw Error(`CUT ${shot.index} の素材が不足しています。開始位置・使用秒数・速度を確認してください。`);
   for(let local=0;local<shot.frameCount;local++){
    check(own.signal);if(encodingError)throw encodingError;
    const sourceTime=shot.inPoint+local/fps*shot.playbackRate,polishTime=polishOffset+done/fps;await seek(media.video,sourceTime,{signal:own.signal});const state=polishFrameState(decoration,polishTime);draw(surface.ctx,media.video,width,height,state.subjectScale);drawMusePolish(surface.ctx,width,height,decoration,polishTime);
    const timestamp=Math.round(done*1000000/fps),next=Math.round((done+1)*1000000/fps),frame=new VideoFrame(surface.canvas,{timestamp,duration:next-timestamp});
    try{encoder.encode(frame,{keyFrame:local===0||done%(fps*2)===0});}finally{frame.close();}
    done++;if(encoder.encodeQueueSize>5)await task(()=>encoder.flush(),{signal:own.signal,timeout:20000,message:'動画の書き出しが時間切れになりました。'});
    onProgress({phase:'frames',cut:shot.index,index:shot.index-1,totalCuts:plan.shots.length,done,total:plan.frameCount,percent:done/plan.frameCount*100});
   }
   media.cleanup();media=null;
  }
  onProgress({phase:'finalizing',cut:plan.shots.length,index:plan.shots.length-1,totalCuts:plan.shots.length,done,total:plan.frameCount,percent:99});
  await task(()=>encoder.flush(),{signal:own.signal,timeout:30000,message:'MP4の保存準備が時間切れになりました。'});check(own.signal);if(encodingError)throw encodingError;muxer.finalize();
  const blob=new Blob([target.buffer],{type:'video/mp4'});if(!blob.size)throw Error('MP4を保存できませんでした。');
  return{blob,...plan,shots:plan.shots.map(({file,...shot})=>shot),mime:'video/mp4',audio:false,width,height,polish:decoration,trim:trim?{start:polishOffset,end:trim.end??untrimmed.requestedDuration}:null};
 }catch(error){if(own.signal.aborted&&!signal?.aborted)throw new DOMException('仕上げ処理が時間切れになりました。CUTを短くするか、ほかのアプリを閉じてお試しください。','TimeoutError');throw error;}
 finally{clearTimeout(timeout);signal?.removeEventListener('abort',cancel);own.abort();media?.cleanup();try{encoder?.close();}catch{}try{Promise.resolve(wake?.release()).catch(()=>{});}catch{}}
}
