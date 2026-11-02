import test from 'node:test';
import assert from 'node:assert/strict';
import {planMotionBatches} from '../muse-motion-batches.mjs';
import {motionFrameTimes} from '../muse-motion-media.mjs';

test('all supported clip lengths retain half-second samples and contiguous global times in small batches',()=>{
 for(let ticks=40;ticks<=600;ticks++){
  const duration=ticks/20,frames=motionFrameTimes(duration).map(time=>({time,dataUrl:`frame-${time}`})),batches=planMotionBatches(frames,duration);
  assert.equal(batches[0].start,0);assert.equal(batches.at(-1).end,duration);
  assert.deepEqual([...new Set(batches.flatMap(batch=>batch.frames))],frames,'no reference image may be dropped to fit a request');
  for(let i=0;i<batches.length;i++){
   const batch=batches[i];assert.ok(batch.end-batch.start<=6.01);assert.ok(batch.frames.length>=2&&batch.frames.length<=14);
   assert.equal(batch.frames[0].time,batch.start);assert.ok(batch.frames.at(-1).time>=batch.end-.6);
   if(i){assert.equal(batches[i-1].end,batch.start);assert.equal(batches[i-1].frames.at(-1),batch.frames[0],'the boundary image preserves visual context');}
  }
 }
});

test('a 30-second source is sent as six chronological requests instead of sixty images at once',()=>{
 const frames=motionFrameTimes(30).map(time=>({time,dataUrl:'frame'})),batches=planMotionBatches(frames,30);
 assert.equal(batches.length,6);assert.deepEqual(batches.map(({start,end})=>[start,end]),[[0,5],[5,10],[10,15],[15,20],[20,25],[25,30]]);
 assert.equal(batches.at(-1).frames.at(-1).time,29.5);
});

test('missing or disordered frames cannot be presented as a complete reference clip',()=>{
 const frames=motionFrameTimes(10).map(time=>({time,dataUrl:'frame'}));
 for(const invalid of [frames.slice(1),frames.slice(0,-2),frames.toReversed(),frames.filter(frame=>frame.time!==4.5)])assert.throws(()=>planMotionBatches(invalid,10));
});

test('dense images supply separate in-between evidence while keeping the same small anchor requests',()=>{
 for(const duration of [2,2.01,2.125,4.99,5,5.05,10.3,15,29.99,30])for(const sampleInterval of [.25,.125]){
  const frames=motionFrameTimes(duration,sampleInterval).map(time=>({time,dataUrl:`frame-${time}`})),batches=planMotionBatches(frames,duration);
  const standard=planMotionBatches(frames.filter(frame=>Number.isInteger(frame.time*2)),duration);
  assert.deepEqual(batches.map(batch=>[batch.start,batch.end]),standard.map(batch=>[batch.start,batch.end]));
  const anchorSet=new Set(batches.flatMap(batch=>batch.frames)),motion=batches.flatMap(batch=>batch.motionFrames);
  assert.deepEqual([...anchorSet],frames.filter(frame=>Number.isInteger(frame.time*2)));
  assert.deepEqual(motion,frames.filter(frame=>!Number.isInteger(frame.time*2)),'each in-between image belongs to exactly one request');
  assert.equal(new Set(motion).size,motion.length);
  for(const batch of batches){
   assert.equal(batch.sampleInterval,sampleInterval);assert.ok(batch.frames.length<=14);assert.ok(batch.motionFrames.length<=30);
   assert.ok(batch.frames.every(frame=>Number.isInteger(frame.time*2)));
   assert.ok(batch.motionFrames.every(frame=>frame.time>batch.start&&frame.time<batch.end&&!anchorSet.has(frame)));
  }
 }
});

test('thirty seconds at the maximum density keeps six requests rather than growing the AI observation grid',()=>{
 const frames=motionFrameTimes(30,.125).map(time=>({time,dataUrl:'frame'})),batches=planMotionBatches(frames,30);
 assert.equal(batches.length,6);assert.deepEqual(batches.map(batch=>batch.motionFrames.length),[30,30,30,30,30,30]);
 assert.equal(batches[0].frames.length,11);assert.equal(batches.at(-1).frames.length,10);
 assert.equal(batches.at(-1).motionFrames.at(-1).time,29.875);
 const normal=planMotionBatches(motionFrameTimes(5).map(time=>({time,dataUrl:'frame'})),5);
 assert.deepEqual(normal[0].motionFrames,[]);assert.equal(normal[0].sampleInterval,.5);
});

test('dense grids with a missing anchor or supplemental image cannot silently lose motion evidence',()=>{
 const frames=motionFrameTimes(10,.125).map(time=>({time,dataUrl:'frame'}));
 for(const invalid of [frames.filter(frame=>frame.time!==4.5),frames.filter(frame=>frame.time!==4.625),frames.toReversed(),frames.slice(1),frames.concat({time:10,dataUrl:'extra'})])assert.throws(()=>planMotionBatches(invalid,10));
 assert.throws(()=>planMotionBatches(Array.from({length:300},(_,i)=>({time:i*.1,dataUrl:'frame'})),30));
});
