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
