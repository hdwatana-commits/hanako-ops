import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze, timeline } from '../reel-engine.mjs';
test('synthetic 120 BPM percussion determines music-dependent cuts', () => {
  const rate = 8000, samples = new Float32Array(rate * 15);
  for (let t = .3; t < 15; t += .5) for (let j = 0; j < 240; j++) samples[Math.round(t * rate) + j] = .8 * Math.exp(-j / 35);
  const result = analyze(samples, rate);
  assert.equal(result.reliable, true);
  assert.ok(Math.abs(result.bpm - 120) <= 4);
  assert.ok(result.peaks.length >= 25);
  const cuts = timeline(15, 'hana', result);
  assert.ok(cuts[1] > 2.2 && cuts[1] < 2.4);
  assert.ok(result.peaks.some(peak => Math.abs(peak.time - cuts[1]) < .001));
  assert.ok(timeline(15, 'pop', result).length > cuts.length);
});
test('silence is not labeled a reliable beat estimate', () => {
  const result = analyze(new Float32Array(120000), 8000);
  assert.equal(result.reliable, false); assert.equal(result.bpm, null);
  assert.ok(timeline(15, 'hana', result).length > 4);
});
test('manual BPM and offset change cuts deterministically', () => {
  assert.deepEqual(timeline(5, 'pop', null, .2, 120), [0, 1.2, 2.2, 3.2, 4.2]);
  assert.ok(timeline(30, 'cinema', null, -1, 50).every(t => t >= 0 && t < 30));
});
import {createEditPlan,chooseStyle,styles,beatPulse} from '../reel-engine.mjs';
test('different musical tempos create different cut spacing',()=>{
 const slow=createEditPlan(20,'editorial',null,{manualBpm:80});const fast=createEditPlan(20,'editorial',null,{manualBpm:160});
 assert.ok(fast.cuts.length>slow.cuts.length);assert.equal(fast.source,'manual');assert.equal(fast.bpm,160);
});
test('quiet passages hold longer while strong passages cut faster',()=>{
 const analysis={reliable:true,bpm:120,confidence:.9,contrast:.8,beats:Array.from({length:40},(_,i)=>({time:i*.5,strength:.8})),sections:Array.from({length:40},(_,i)=>({time:i*.5,intensity:i>=12&&i<28?.95:.05}))};
 const plan=createEditPlan(20,'hana',analysis);
 const quiet=plan.shots.filter(s=>s.start<5).map(s=>s.end-s.start),loud=plan.shots.filter(s=>s.start>=7&&s.start<13).map(s=>s.end-s.start);
 assert.ok(loud.length>0);assert.ok(loud.reduce((a,b)=>a+b,0)/loud.length<quiet.reduce((a,b)=>a+b,0)/quiet.length);
 assert.equal(plan.source,'audio');assert.equal(plan.shots[0].photo,0);assert.ok(plan.shots.every((s,i)=>s.photo===i%4&&s.end>s.start));
});
test('automatic styles depend on estimated tempo and dynamics, not track titles',()=>{
 assert.equal(Object.keys(styles).length,10);assert.equal(chooseStyle('auto',{reliable:true,bpm:80,contrast:.5}),'airy');assert.equal(chooseStyle('auto',{reliable:true,bpm:150,contrast:.7}),'street');assert.equal(chooseStyle('auto',{reliable:true,bpm:120,contrast:.05}),'clean');assert.equal(chooseStyle('film',null),'film');
 const fallback=createEditPlan(15,'auto',null);assert.equal(fallback.source,'estimated');assert.equal(fallback.bpm,0);assert.equal(fallback.style,'hana');
});
test('audio analysis estimates slow and fast synthetic beats and sections',()=>{
 for(const bpm of[80,160]){const rate=8000,samples=new Float32Array(rate*20);for(let t=.3;t<19.9;t+=60/bpm)for(let j=0;j<240;j++)samples[Math.round(t*rate)+j]=(t<6?.18:t<14?.9:.18)*Math.exp(-j/35);const result=analyze(samples,rate);assert.equal(result.reliable,true);assert.ok(Math.abs(result.bpm-bpm)<7);assert.ok(result.contrast>.2);assert.ok(result.beats.length>15);assert.ok(result.sections.some(s=>s.intensity>.8));}
});
test('beat pulse decays, while cut intervals stay bounded in every style',()=>{
 for(const style of Object.keys(styles)){const plan=createEditPlan(30,style,null,{manualBpm:180});assert.equal(plan.cuts[0],0);assert.ok(plan.shots.every(s=>s.end>s.start&&s.end<=30));assert.ok(beatPulse(plan,.01)>beatPulse(plan,.2));}
});
test('all four photos appear even with very slow tracks and gentle styles',()=>{
 for(const style of Object.keys(styles))for(const bpm of[50,80,200]){const plan=createEditPlan(15,style,null,{manualBpm:bpm});assert.equal(new Set(plan.shots.map(s=>s.photo)).size,4,`${style} ${bpm}`);}
});
