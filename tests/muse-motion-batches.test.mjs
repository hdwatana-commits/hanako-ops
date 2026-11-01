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
