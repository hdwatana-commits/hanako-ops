import test from 'node:test';
import assert from 'node:assert/strict';
import {validateMotionVideo,validateMotionClip,motionFrameTimes,fitMotionFrame,monoMotionClip,analyzeMotionSamples,inspectMotionVideo,extractMotionFrames,analyzeMotionTempo,MOTION_MEDIA_LIMITS} from '../muse-motion-media.mjs';

test('reference uploads accept local MP4/MOV only and bound file size',()=>{
 validateMotionVideo({name:'iPhone.MOV',type:'',size:1});
 validateMotionVideo({name:'video',type:'video/mp4',size:150*1024*1024});
 assert.throws(()=>validateMotionVideo({name:'remote.txt',type:'text/plain',size:20}),/MP4/);
 assert.throws(()=>validateMotionVideo({name:'large.mp4',size:150*1024*1024+1}),/150MB/);
 assert.throws(()=>validateMotionVideo({name:'empty.mp4',size:0}),/選んで/);
});

test('an already-cancelled operation never allocates a video decoder or reads audio',async()=>{
 const controller=new AbortController();controller.abort();
 const file={name:'reference.mp4',type:'video/mp4',size:100,arrayBuffer(){throw Error('must not read an aborted source');}};
 for(const run of [inspectMotionVideo,extractMotionFrames,analyzeMotionTempo])await assert.rejects(run(file,{start:0,duration:2,signal:controller.signal}),{name:'AbortError'});
});

test('clip ranges never silently extend outside the source or the 30-second limit',()=>{
 assert.deepEqual(validateMotionClip({start:12.5,duration:20},40),{start:12.5,duration:20});
 for(const range of [{start:-1,duration:10},{start:0,duration:1.9},{start:0,duration:30.01},{start:25,duration:20},{start:NaN,duration:20}])assert.throws(()=>validateMotionClip(range,40),/2〜30秒/);
 assert.throws(()=>validateMotionClip({start:0,duration:20},601),/10分/);
});

test('sampling uses exact half-second timestamps and never stretches the reference tempo',()=>{
 for(const duration of [2,2.25,8,15,20,29.99,30]){
  const times=motionFrameTimes(duration);assert.ok(times.length<=60);assert.ok(times.length<=Math.ceil(duration*2));assert.equal(times[0],0);
  assert.ok(duration-times.at(-1)<=.5001);assert.ok(times.every((time,index)=>time>=0&&time<duration&&time===index*.5));
 }
 assert.equal(motionFrameTimes(30).length,MOTION_MEDIA_LIMITS.frames);
 assert.throws(()=>motionFrameTimes(31),/2〜30秒/);
});

test('reference frames preserve aspect ratio and do not enlarge small sources',()=>{
 assert.deepEqual(fitMotionFrame(1080,1920),{width:216,height:384});
 assert.deepEqual(fitMotionFrame(1920,1080),{width:384,height:216});
 assert.deepEqual(fitMotionFrame(120,160),{width:120,height:160});
 assert.throws(()=>fitMotionFrame(0,1920),/画角/);
});

test('tempo PCM contains only the selected interval and averages both channels',()=>{
 const left=Float32Array.from({length:48000*5},(_,index)=>index<48000*2?1:.25),right=Float32Array.from(left,number=>number*.5);
 const clip=monoMotionClip({duration:5,sampleRate:48000,numberOfChannels:2,getChannelData:index=>index?right:left},{start:2,duration:2});
 assert.equal(clip.rate,12000);assert.equal(clip.samples.length,24000);assert.ok(clip.samples.every(value=>Math.abs(value-.1875)<.00001));
 assert.throws(()=>monoMotionClip({duration:5,sampleRate:48000,numberOfChannels:2,getChannelData:index=>index?right:left},{start:4,duration:2}),/2〜30秒/);
});

test('silent or irregular audio never receives a fabricated BPM or beat grid',()=>{
 const silence=analyzeMotionSamples(new Float32Array(12000*10),12000);assert.equal(silence.bpm,null);assert.equal(silence.beatStatus,'unverified');assert.deepEqual(silence.beatTimes,[]);
 const constant=analyzeMotionSamples(new Float32Array(12000*10).fill(.1),12000);assert.equal(constant.bpm,null);assert.equal(constant.beatStatus,'unverified');
});

test('an audible regular pulse gets estimated beats rather than a verified-sync claim',()=>{
 const rate=12000,samples=new Float32Array(rate*15);
 for(let beat=.2;beat<15;beat+=.5)for(let index=0;index<rate*.08;index++)samples[Math.floor(beat*rate)+index]=Math.sin(index*.3)*Math.exp(-index/(rate*.015))*.7;
 const result=analyzeMotionSamples(samples,rate);assert.equal(result.beatStatus,'estimated');assert.equal(result.bpm,120);assert.ok(result.confidence>.5);assert.ok(result.beatTimes.length>20);assert.ok(result.beatTimes.every(time=>time>=0&&time<15));
});

function mediaBrowser(t,{metadata=true,read=async()=>new ArrayBuffer(8),decode=async()=>({duration:2,sampleRate:8000,numberOfChannels:1,getChannelData:()=>new Float32Array(16000)}),close=()=>Promise.resolve()}={}){
 const state={videos:[],revoked:[],decodeCalls:0,closeCalls:0};
 class Video extends EventTarget{
  constructor(){super();this.style={};this.duration=2;this.videoWidth=1080;this.videoHeight=1920;this.removed=false;}
  setAttribute(){}
  removeAttribute(name){delete this[name];}
  load(){if(this.src&&metadata)queueMicrotask(()=>this.dispatchEvent(new Event('loadedmetadata')));}
  pause(){}
  remove(){this.removed=true;}
 }
 const replacements={document:{createElement:()=>{const video=new Video();state.videos.push(video);return video;},body:{append(){}}},AudioContext:class{
  decodeAudioData(bytes){state.decodeCalls++;return decode(bytes);}
  close(){state.closeCalls++;return close();}
 }};
 for(const [key,value]of Object.entries(replacements)){
  const original=Object.getOwnPropertyDescriptor(globalThis,key);Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
  t.after(()=>{if(original)Object.defineProperty(globalThis,key,original);else delete globalThis[key];});
 }
 t.mock.method(URL,'createObjectURL',()=> 'blob:reference');t.mock.method(URL,'revokeObjectURL',url=>state.revoked.push(url));
 return{state,file:{name:'reference.mp4',type:'video/mp4',size:100,arrayBuffer:read}};
}

test('cancelling a stalled file read releases resources without starting a late decoder',{timeout:1000},async t=>{
 let started,release;const waiting=new Promise(resolve=>{started=resolve;}),read=new Promise(resolve=>{release=resolve;});
 const {state,file}=mediaBrowser(t,{read:()=>{started();return read;}}),controller=new AbortController();
 const run=analyzeMotionTempo(file,{start:0,duration:2,signal:controller.signal});await waiting;controller.abort();
 await assert.rejects(run,{name:'AbortError'});assert.equal(state.closeCalls,1);assert.equal(state.decodeCalls,0);
 release(new ArrayBuffer(8));await Promise.resolve();await Promise.resolve();assert.equal(state.decodeCalls,0);
 assert.ok(state.videos.every(video=>video.removed));assert.equal(state.revoked.length,1);
});

test('cancelling an unresponsive native decoder does not wait for close either',{timeout:1000},async t=>{
 let started;const waiting=new Promise(resolve=>{started=resolve;});
 const {state,file}=mediaBrowser(t,{decode:()=>{started();return new Promise(()=>{});},close:()=>new Promise(()=>{})}),controller=new AbortController();
 const run=analyzeMotionTempo(file,{start:0,duration:2,signal:controller.signal});await waiting;controller.abort();
 await assert.rejects(run,{name:'AbortError'});assert.equal(state.decodeCalls,1);assert.equal(state.closeCalls,1);assert.ok(state.videos.every(video=>video.removed));
});

test('stalled native decoding returns an unknown tempo after a deadline',{timeout:1000},async t=>{
 const nativeTimer=globalThis.setTimeout;
 t.mock.method(globalThis,'setTimeout',(callback,delay,...args)=>nativeTimer(callback,[MOTION_MEDIA_LIMITS.audioReadMs,MOTION_MEDIA_LIMITS.audioDecodeMs].includes(delay)?0:delay,...args));
 const {state,file}=mediaBrowser(t,{decode:()=>new Promise(()=>{}),close:()=>new Promise(()=>{})});
 const result=await analyzeMotionTempo(file,{start:0,duration:2});assert.equal(result.beatStatus,'unverified');assert.equal(result.bpm,null);assert.match(result.reason,/タイムアウト/);assert.equal(state.closeCalls,1);
});

test('a stalled file read reaches its deadline without starting the native decoder',{timeout:1000},async t=>{
 const nativeTimer=globalThis.setTimeout;
 t.mock.method(globalThis,'setTimeout',(callback,delay,...args)=>nativeTimer(callback,delay===MOTION_MEDIA_LIMITS.audioReadMs?0:delay,...args));
 const {state,file}=mediaBrowser(t,{read:()=>new Promise(()=>{}),close:()=>new Promise(()=>{})});
 const result=await analyzeMotionTempo(file,{start:0,duration:2});assert.equal(result.beatStatus,'unverified');assert.match(result.reason,/タイムアウト/);assert.equal(state.decodeCalls,0);assert.equal(state.closeCalls,1);
});

test('successful analysis returns even if the native audio context never closes',{timeout:1000},async t=>{
 const {state,file}=mediaBrowser(t,{close:()=>new Promise(()=>{})});
 const result=await analyzeMotionTempo(file,{start:0,duration:2});assert.equal(result.beatStatus,'unverified');assert.match(result.reason,/無音/);assert.equal(state.closeCalls,1);
});

test('metadata waits abort promptly and release their object URL',{timeout:1000},async t=>{
 const {state,file}=mediaBrowser(t,{metadata:false}),controller=new AbortController();
 const run=inspectMotionVideo(file,{signal:controller.signal});controller.abort();await assert.rejects(run,{name:'AbortError'});
 assert.equal(state.decodeCalls,0);assert.ok(state.videos[0].removed);assert.deepEqual(state.revoked,['blob:reference']);
});

test('large reference videos retain the visual route but skip full-file audio allocation',async()=>{
 const file={name:'reference.mov',type:'video/quicktime',size:MOTION_MEDIA_LIMITS.audioBytes+1,arrayBuffer(){throw Error('large audio must not be read');}};
 validateMotionVideo(file);const result=await analyzeMotionTempo(file,{start:0,duration:2});assert.equal(result.beatStatus,'unverified');assert.equal(result.bpm,null);assert.match(result.reason,/40MB/);assert.match(result.reason,/動きの解析は続けられます/);
});
