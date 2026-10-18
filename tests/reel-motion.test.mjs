import test from 'node:test';
import assert from 'node:assert/strict';
import {sceneMotion} from '../reel-style-renderer.mjs';
test('energetic styles have visibly stronger uniform motion than calm styles',()=>{
 const pop=sceneMotion('pop',.5,1,0),clean=sceneMotion('clean',.5,1,0);
 assert.ok(pop.zoom>clean.zoom);assert.ok(pop.x>clean.x);
 assert.ok(sceneMotion('cute',.5,1,0).angle>0);assert.ok(sceneMotion('cute',.5,1,1).angle<0);
});
test('all motion strengths remain finite and within portrait-safe bounds',()=>{
 for(const family of['cute','cinema','pop','editorial','clean','film','airy','luxe','street','travel'])for(const level of[.55,1,1.35])for(let i=0;i<=100;i++){
  const m=sceneMotion(family,i/100,1,0,level);
  assert.ok(Object.values(m).every(Number.isFinite));assert.ok(m.zoom>=1&&m.zoom<1.15);assert.ok(Math.abs(m.angle)<.033);assert.ok(Math.abs(m.x)<=33&&Math.abs(m.y)<=17);
  // A full 4:5 foreground fits inside 1080x1920 at settled positions.
  const w=family==='cute'||['editorial','film','travel'].includes(family)?830:900,h=w*1.25;
  assert.ok((w*Math.cos(m.angle)+h*Math.abs(Math.sin(m.angle)))*m.zoom+2*Math.abs(m.x)<1080);
 }
});
