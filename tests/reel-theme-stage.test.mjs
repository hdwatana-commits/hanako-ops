import test from 'node:test';
import assert from 'node:assert/strict';
import {sceneLayout,themeStories,drawThemeStage} from '../reel-theme-stage.mjs';
import {sceneMotion} from '../reel-style-renderer.mjs';
test('all theme compositions preserve a full portrait inside the output frame',()=>{
 for(const family of Object.keys(themeStories))for(const level of [.55,1,1.35])for(let index=0;index<12;index++)for(const phase of [0,.25,.5,.75,1]){
 const l=sceneLayout(family,index,phase,level),m=sceneMotion(family,phase,1,index,level),a=Math.abs(l.angle+m.angle),w=l.width*m.zoom,h=l.width*1.25*m.zoom;
 assert.ok(Math.abs(l.x+m.x-540)+(w*Math.cos(a)+h*Math.sin(a))/2<540,`${family}: horizontal bounds`);
 assert.ok(Math.abs(l.y+m.y-960)+(h*Math.cos(a)+w*Math.sin(a))/2<960,`${family}: vertical bounds`);
 }
});
test('every theme renders opening, cuts and finale at all strengths without canvas state leaks',()=>{
 let saves=0;const gradient={addColorStop(){}};
 const ctx=new Proxy({save(){saves++},restore(){saves--},createLinearGradient(){return gradient}}, {get:(o,k)=>k in o?o[k]:(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 for(const family of Object.keys(themeStories))for(const duration of [15,20,30])for(const time of [0,.4,3,duration-1,duration])for(const level of [.55,1,1.35])for(const front of [false,true]){
 drawThemeStage(ctx,{family,time,index:3,phase:.12,pulse:.8,duration,level,front});assert.equal(saves,0);
 }
});
