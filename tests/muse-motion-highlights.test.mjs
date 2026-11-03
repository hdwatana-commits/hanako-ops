import test from 'node:test';
import assert from 'node:assert/strict';
import {proposeMotionHighlights,cropMotionAnalysis} from '../muse-motion-highlights.mjs';

const row=(start,end,extra={})=>({start,end,body:'Small side steps.',leftHand:'An open hand beside the waist.',rightHand:'Right hand beside the cheek.',feet:'Take a small step.',gaze:'Look away from camera.',expression:'Neutral expression.',confidence:'medium',...extra});
const observations=()=>Array.from({length:60},(_,index)=>row(index/2,(index+1)/2,index===10?{gaze:'Look directly into the lens.',expression:'A gentle smile.',confidence:'high'}:{}));
const input=extra=>({observations:observations(),duration:30,referenceStart:12.5,targetDuration:15,analysisStatus:'auto',...extra});

test('highlight suggestions favor opening evidence and retain local/source clock separation',()=>{
 const result=proposeMotionHighlights(input());
 assert.equal(result.basis,'observation_text_heuristic');assert.equal(result.candidates.length,3);
 const first=result.candidates[0];assert.ok(first.start<=5&&first.start+1>5);assert.equal(first.end-first.start,15);assert.equal(first.sourceStart,12.5+first.start);assert.equal(first.sourceEnd,12.5+first.end);
 assert.ok(first.reasons.some(text=>text.includes('カメラ目線')));assert.ok(first.reasons.some(text=>text.includes('笑顔')));assert.equal(first.reviewRequired,true);
 assert.equal('_score'in first,false);assert.ok(first.evidence.every(item=>item.start>=first.start&&item.end<=first.end));
 for(const candidate of result.candidates)assert.ok(candidate.start>=0&&candidate.end<=30&&Number.isInteger(candidate.start*2));
});

test('20-second candidates stay inside the analysed source range and carry review status',()=>{
 const result=proposeMotionHighlights(input({targetDuration:20,analysisStatus:'manual'}));
 assert.ok(result.candidates.length>0);for(const candidate of result.candidates){assert.equal(candidate.duration,20);assert.ok(candidate.end<=30);assert.match(candidate.evidenceStatus,/手入力.*未検証/);}
 const exact=proposeMotionHighlights(input({observations:[row(0,20,{gaze:'Camera eye contact.'})],duration:20,targetDuration:20}));assert.equal(exact.candidates.length,1);assert.equal(exact.candidates[0].start,0);
});

test('missing, unverified, UNKNOWN and low-confidence AI notes never invent a hook',()=>{
 for(const extra of [{analysisStatus:'unverified'},{observations:[]},{observations:[{start:0,end:30,gaze:'UNKNOWN',expression:'UNKNOWN',confidence:'high'}]},{observations:[row(0,30,{gaze:'Look into the lens.',expression:'Smile.',confidence:'low'})]}]){
  const result=proposeMotionHighlights(input(extra));assert.deepEqual(result.candidates,[]);assert.ok(result.reason);
 }
 const negated=proposeMotionHighlights(input({observations:[row(0,30,{body:'Neutral stance.',leftHand:'Hands resting.',rightHand:'Hands resting.',feet:'Feet grounded.',gaze:'Do not look into the lens.',expression:'No smile.'})]}));assert.equal(negated.candidates.length,0);
});

test('a short analysed range asks for enough real source rather than stretching the candidate',()=>{
 const result=proposeMotionHighlights(input({observations:[row(0,10)],duration:10,targetDuration:15}));assert.deepEqual(result.candidates,[]);assert.match(result.reason,/15秒以上/);
 for(const extra of [{duration:NaN},{duration:31},{targetDuration:10},{referenceStart:-1},{observations:[row(0,31)]},{observations:[row(0,2),row(1,3)]}])assert.throws(()=>proposeMotionHighlights(input(extra)));
});

test('cropping cached notes clips boundary intervals and translates detailed motion once',()=>{
 const original={observations:[row(0,2,{sourceStart:12,sourceEnd:14,motionDetails:[{time:1.125,motion:'Observed hand arc.',confidence:'high'},{time:1.5,motion:'Observed endpoint.',confidence:'medium'}]}),row(2,4,{motionDetails:[{time:2.125,motion:'Observed step.',confidence:'medium'},{time:3.5,motion:'Outside crop.',confidence:'low'}]})],rangeStart:1.5,rangeDuration:2};
 const before=structuredClone(original),result=cropMotionAnalysis(original);
 assert.deepEqual(result.observations.map(item=>[item.start,item.end]),[[0,.5],[.5,2]]);assert.deepEqual(result.observations[0].motionDetails,[]);assert.deepEqual(result.observations[1].motionDetails,[{time:.625,motion:'Observed step.',confidence:'medium'}]);
 assert.deepEqual([result.observations[0].sourceStart,result.observations[0].sourceEnd],[13.5,14]);assert.equal(result.observations[0].confidence,'medium');assert.equal(result.requiresReview,true);assert.deepEqual(original,before);
});

test('cropped frames retain original source times and bytes; beats stay tied to the same audio',()=>{
 const frames=[{time:1.375,sourceTime:11.375,dataUrl:'before'},{time:1.5,sourceTime:11.5,dataUrl:'first'},{time:3.375,sourceTime:13.375,dataUrl:'last'},{time:3.5,sourceTime:13.5,dataUrl:'after'}],tempo={bpm:120,beatTimes:[1,1.5,2,3,3.5,4],beatStatus:'estimated',confidence:.63};
 const before=structuredClone({frames,tempo}),result=cropMotionAnalysis({frames,tempo,rangeStart:1.5,rangeDuration:2});
 assert.deepEqual(result.frames,[{time:0,sourceTime:11.5,dataUrl:'first'},{time:1.875,sourceTime:13.375,dataUrl:'last'}]);assert.deepEqual(result.tempo,{bpm:120,beatTimes:[0,.5,1.5],beatStatus:'estimated',confidence:.63});assert.deepEqual({frames,tempo},before);
});

test('empty caches remain empty and no BPM, beat or detail is manufactured',()=>{
 const result=cropMotionAnalysis({rangeStart:0,rangeDuration:15});assert.deepEqual(result.observations,[]);assert.deepEqual(result.frames,[]);assert.equal(result.tempo,null);
 for(const extra of [{rangeStart:-1},{rangeStart:'1'},{rangeDuration:1},{frames:[{time:NaN}]},{tempo:{beatTimes:['2']}},{observations:[row(0,3,{motionDetails:'bad'})]}])assert.throws(()=>cropMotionAnalysis({rangeStart:0,rangeDuration:2,...extra}));
});

test('candidate creation never mutates observations or exposes an algorithmic virality score',()=>{
 const values=input(),before=structuredClone(values),result=proposeMotionHighlights(values);assert.deepEqual(values,before);assert.match(result.reason,/再生数を予測したものではありません/);assert.doesNotMatch(JSON.stringify(result),/viralScore|popularityScore|_score/);
});
