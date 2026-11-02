import test from 'node:test';
import assert from 'node:assert/strict';
import {planMuseCutAssembly,fitCutFrame,inspectGeneratedCut,extractCutBoundary,renderMuseCuts,canRenderMuseCuts} from '../muse-motion-cut-media.mjs';
const file=(name='cut.mp4')=>new File([new Uint8Array(100)],name,{type:'video/mp4'});

test('long generated clips are cut at 1x without stretching or taking the extra duration',()=>{
 const plan=planMuseCutAssembly([{file:file(),duration:5,sourceDuration:10},{file:file(),inPoint:1,duration:5,sourceDuration:10}]);
 assert.equal(plan.frameCount,300);assert.equal(plan.duration,10);assert.deepEqual(plan.shots.map(shot=>[shot.inPoint,shot.outPoint,shot.playbackRate]),[[0,5,1],[1,6,1]]);
 assert.equal(plan.shots[0].lastFrameTime,4.966667);
});
test('fractional CUT boundaries round cumulatively rather than accumulating drift',()=>{
 const plan=planMuseCutAssembly([3.45,3.45,3.4].map(duration=>({file:file(),duration})));
 assert.equal(plan.frameCount,309);assert.equal(plan.duration,10.3);assert.equal(plan.roundingSeconds,0);
 assert.deepEqual(plan.shots.map(shot=>shot.frameCount),[104,103,102]);assert.equal(plan.shots.at(-1).endFrame,309);
 const rounded=planMuseCutAssembly([{file:file(),duration:4.15}]);assert.equal(rounded.duration,4.166667);assert.equal(rounded.roundingSeconds,.016667);
});
test('only explicit 2x playback consumes double source footage and source shortages fail',()=>{
 const plan=planMuseCutAssembly([{file:file(),duration:5,playbackRate:2,sourceDuration:10}]);assert.equal(plan.shots[0].outPoint,10);assert.equal(plan.shots[0].lastFrameTime,9.933333);
 for(const shot of[{duration:5,playbackRate:2,sourceDuration:9},{duration:5,playbackRate:.5},{duration:0},{duration:5,inPoint:-1}])assert.throws(()=>planMuseCutAssembly([{file:file(),...shot}]));
 assert.throws(()=>planMuseCutAssembly([{file:file('bad.txt'),duration:1}],{fps:24}));
});

test('a fractional source ending contains the final sampled frame even when the MP4 boundary rounds up',async t=>{
 const plan=planMuseCutAssembly([{file:file(),duration:4.15,sourceDuration:4.15}]);
 assert.equal(plan.frameCount,125);assert.equal(plan.duration,4.166667);assert.equal(plan.shots[0].lastFrameTime,4.133333);
 const state=browser(t,{duration:4.15});const result=await renderMuseCuts({shots:[{file:file(),duration:4.15}]});
 assert.equal(result.frameCount,125);assert.equal(state.frames.length,125);assert.equal(state.videos[0].seeks.at(-1),124/30);
 const boundary=await extractCutBoundary(file(),{duration:4.15});assert.equal(boundary.time,4.133333);
});
test('foreground framing contains the complete person without stretching a 4:5 or landscape source',()=>{
 assert.deepEqual(fitCutFrame(1080,1350),{x:0,y:285,width:1080,height:1350});
 const landscape=fitCutFrame(1920,1080);assert.equal(landscape.width,1080);assert.equal(landscape.height,607.5);assert.equal(landscape.width/landscape.height,1920/1080);
});

function browser(t,{duration=10,stallSeek=false,stallPng=false,stallFlush=false}={}){
 const keys=['document','VideoEncoder','VideoFrame','EncodedVideoChunk','navigator'],originals=new Map(keys.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 const originalCreate=URL.createObjectURL,originalRevoke=URL.revokeObjectURL,state={videos:[],frames:[],chunks:[],draws:[],revoked:[],encoders:[],pngCallbacks:[]};
 const define=(key,value)=>Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});
 class Video extends EventTarget{
  constructor(){super();this.style={};this.duration=duration;this.videoWidth=1080;this.videoHeight=1920;this.readyState=2;this._time=0;this.seeks=[];}
  set currentTime(time){this._time=time;this.seeks.push(time);if(!stallSeek)queueMicrotask(()=>this.dispatchEvent(new Event('seeked')));}
  get currentTime(){return this._time;}
  setAttribute(){} removeAttribute(){} pause(){this.paused=true;} remove(){this.removed=true;}
  load(){if(this.src)queueMicrotask(()=>this.dispatchEvent(new Event('loadedmetadata')));}
 }
 const ctx={save(){},restore(){},fillRect(){},drawImage(video,...coordinates){state.draws.push({time:video.currentTime,coordinates,filter:this.filter});}};
 define('document',{body:{append(){}},createElement(tag){if(tag==='video'){const video=new Video();state.videos.push(video);return video;}if(tag==='canvas')return{width:0,height:0,getContext:()=>ctx,toBlob(callback){state.pngCallbacks.push(callback);if(!stallPng)queueMicrotask(()=>callback(new Blob(['png'],{type:'image/png'})));}};throw Error(tag);}});
 define('navigator',{});URL.createObjectURL=()=>`blob:video-${state.videos.length}`;URL.revokeObjectURL=url=>state.revoked.push(url);
 class Frame{constructor(_canvas,options){Object.assign(this,options);state.frames.push(this);}close(){this.closed=true;}}
 class Chunk{constructor(frame,key){Object.assign(this,{timestamp:frame.timestamp,duration:frame.duration,type:key?'key':'delta',byteLength:6});}copyTo(target){target.set([0,0,0,2,101,0]);}}
 class Encoder{
  static async isConfigSupported(){return{supported:true};}
  constructor(callbacks){this.callbacks=callbacks;this.encodeQueueSize=0;state.encoders.push(this);}
  configure(config){this.config=config;}
  encode(frame,{keyFrame}){const chunk=new Chunk(frame,keyFrame);state.chunks.push(chunk);this.callbacks.output(chunk,{decoderConfig:{codec:this.config.codec,codedWidth:1080,codedHeight:1920,description:new Uint8Array([1,66,0,40,255,225,0,0])}});}
  flush(){return stallFlush?new Promise(()=>{}):Promise.resolve();}
  close(){this.closed=true;}
 }
 define('VideoEncoder',Encoder);define('VideoFrame',Frame);define('EncodedVideoChunk',Chunk);
 t.after(()=>{for(const[key,descriptor]of originals){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}URL.createObjectURL=originalCreate;URL.revokeObjectURL=originalRevoke;});
 return state;
}

test('inspection and actual last-frame extraction release video URLs and preserve source timing',async t=>{
 const state=browser(t);assert.deepEqual(await inspectGeneratedCut(file()),{duration:10,width:1080,height:1920});
 const result=await extractCutBoundary(file(),{duration:5,inPoint:1});assert.equal(result.blob.type,'image/png');assert.equal(result.time,5.966667);assert.equal(state.videos.at(-1).currentTime,result.time);assert.ok(state.videos.every(video=>video.removed));assert.equal(state.revoked.length,2);
 const doubled=await extractCutBoundary(file(),{duration:5,playbackRate:2});assert.equal(doubled.time,9.933333);
 const start=await extractCutBoundary(file(),{duration:5,inPoint:2,edge:'start'});assert.equal(start.time,2);
});
test('fixed WebCodecs timestamps yield the requested frame count with a real MP4 container and no audio track',async t=>{
 const state=browser(t),progress=[];const result=await renderMuseCuts({shots:[{file:file(),duration:5},{file:file(),inPoint:1,duration:5}],onProgress:event=>progress.push(event)});
 assert.equal(result.blob.type,'video/mp4');assert.equal(result.audio,false);assert.equal(result.duration,10);assert.equal(result.frameCount,300);assert.equal(state.frames.length,300);assert.ok(state.frames.every(frame=>frame.closed));
 assert.equal(state.frames[0].timestamp,0);assert.equal(state.frames[150].timestamp,5000000);assert.equal(state.frames.at(-1).timestamp+state.frames.at(-1).duration,10000000);
 const binary=new Uint8Array(await result.blob.arrayBuffer()),text=new TextDecoder('latin1').decode(binary);assert.ok(text.includes('ftyp'));assert.ok(text.includes('moov'));assert.ok(text.includes('avc1'));assert.ok(!text.includes('mp4a'));assert.equal((text.match(/vide/g)||[]).length,1);
 assert.ok(state.videos.every(video=>video.removed));assert.ok(state.encoders.every(encoder=>encoder.closed));assert.equal(state.videos[0].seeks.at(-1),149/30);assert.equal(state.videos[1].seeks.at(-1),1+149/30);
 assert.equal(progress[0].phase,'opening');assert.equal(progress.at(-1).phase,'finalizing');assert.equal(progress.at(-1).done,300);
});
test('encoding cancellation closes the encoder and source without returning a partial result',async t=>{
 const state=browser(t),controller=new AbortController();await assert.rejects(renderMuseCuts({shots:[{file:file(),duration:5}],signal:controller.signal,onProgress:({done})=>{if(done===3)controller.abort();}}),{name:'AbortError'});
 assert.equal(state.frames.length,3);assert.ok(state.frames.every(frame=>frame.closed));assert.ok(state.encoders.every(encoder=>encoder.closed));assert.ok(state.videos.every(video=>video.removed));
});
test('an unsupported browser is rejected before opening source movies or silently using an imprecise recorder',async t=>{
 const state=browser(t);delete globalThis.VideoEncoder;assert.equal(await canRenderMuseCuts(),false);await assert.rejects(renderMuseCuts({shots:[{file:file(),duration:5}]}),/対応していません/);assert.equal(state.videos.length,0);
});
test('a material source shortage is rejected rather than frozen or extended',async t=>{
 const state=browser(t,{duration:4});await assert.rejects(renderMuseCuts({shots:[{file:file(),duration:5}]}),/素材が不足/);assert.equal(state.frames.length,0);assert.ok(state.videos.every(video=>video.removed));assert.ok(state.encoders.every(encoder=>encoder.closed));
});
test('cancellation while a PNG callback is stalled releases the source and ignores the late callback',async t=>{
 const state=browser(t,{stallPng:true}),controller=new AbortController(),run=extractCutBoundary(file(),{duration:5,signal:controller.signal});
 while(!state.pngCallbacks.length)await new Promise(resolve=>setImmediate(resolve));controller.abort();await assert.rejects(run,{name:'AbortError'});assert.ok(state.videos.every(video=>video.removed));state.pngCallbacks[0](new Blob(['late']));
});
test('cancellation while a native encoder flush is stalled does not leave the operation waiting',async t=>{
 const state=browser(t,{stallFlush:true}),controller=new AbortController();let reached;
 const finalizing=new Promise(resolve=>{reached=resolve;});const run=renderMuseCuts({shots:[{file:file(),duration:.1}],signal:controller.signal,onProgress:event=>{if(event.phase==='finalizing')reached();}});
 await finalizing;controller.abort();await assert.rejects(run,{name:'AbortError'});assert.ok(state.encoders.every(encoder=>encoder.closed));assert.ok(state.videos.every(video=>video.removed));
});
test('an interrupted codec capability probe returns immediately without allocating videos',async t=>{
 const state=browser(t),controller=new AbortController();VideoEncoder.isConfigSupported=()=>new Promise(()=>{});
 const run=canRenderMuseCuts({signal:controller.signal});controller.abort();await assert.rejects(run,{name:'AbortError'});assert.equal(state.videos.length,0);
});
