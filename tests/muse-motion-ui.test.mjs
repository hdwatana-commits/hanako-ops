import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {buildMuseMotionPackage} from '../muse-motion-engine.mjs';

const source=fs.readFileSync(new URL('../muse-motion.mjs',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replace('export function mountMuseMotion','function mountMuseMotion');
class Element{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.listeners={};this.value='';this.checked=false;this.hidden=false;this.disabled=false;this.currentTime=0;this.files=[];}
 set innerHTML(value){this.html=value;if(this.tagName==='DETAILS'&&value.includes('motionInputs')){this.controls=new Map();for(const match of value.matchAll(/<(input|textarea|video|progress|button|div|section|figure|img|p|details|select)[^>]*id="(motion[^"]+)"[^>]*>/g)){const element=new Element(match[1]);element.id=match[2];element.value=/value="([^"]*)"/.exec(match[0])?.[1]||'';element.checked=/\bchecked\b/.test(match[0]);element.hidden=/\bhidden\b/.test(match[0]);this.controls.set(element.id,element);}}}
 get innerHTML(){return this.html||'';}
 querySelector(selector){return this.controls?.get(selector.slice(1))||null;}
 querySelectorAll(){return [...(this.controls?.values()||[])];}
 addEventListener(type,handler){(this.listeners[type]||=[]).push(handler);}
 emit(type){for(const handler of this.listeners[type]||[])handler({target:this});}
 append(...elements){this.children.push(...elements);}
 replaceChildren(...elements){this.children=elements;}
 setAttribute(name,value){this[name]=value;}
 removeAttribute(name){delete this[name];}
 pause(){this.paused=true;}
 load(){}
 play(){this.paused=false;return Promise.resolve();}
}
const observation={start:0,end:2,camera:'Fixed frontal full-body shot.',body:'Small continuous weight transfer.',leftHand:'Left hand stays beside waist.',rightHand:'Right hand rises near cheek.',feet:'Left step then grounded feet.',face:'Head remains toward camera.',gaze:'Look toward lens.',expression:'Soft smile.',transition:'Ease into a stable ending pose.',confidence:'medium'};
function setup({signedIn=true,token=async()=> 'session-token'}={}){
 let panel;const calls=[],document={createElement:tag=>new Element(tag),body:new Element('body')};
 const context=vm.createContext({document,Blob,File,AbortController,DOMException,setTimeout,clearTimeout,navigator:{clipboard:{writeText:async()=>{}}},URL:{createObjectURL:()=> 'blob:local',revokeObjectURL:()=>{}},buildMuseMotionPackage,
  inspectMotionVideo:async()=>({duration:15,width:1080,height:1920}),validateMotionClip:(range,duration)=>{if(range.start<0||range.duration<2||range.start+range.duration>duration)throw Error('区間が不正');},
  extractMotionFrames:async(_file,{onProgress})=>{onProgress({done:4,total:4});return[0,.5,1,1.5].map(time=>({time,dataUrl:`data:image/jpeg;base64,${time}`,sourceTime:time+3}));},
  analyzeMotionTempo:async()=>({bpm:120,beatTimes:[.1,.6,1.1,1.6],beatStatus:'estimated'}),
  window:{HanakoCloudSync:class{constructor(){this.signedIn=signedIn;this.url='https://cloud.test';this.key='public-key';}getAccessToken(){return token();}}},
  fetch:async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return{ok:true,json:async()=>({observations:[observation],summary:'参考動作の候補です。'})};}
 });
 vm.runInContext(source,context);
 context.mountMuseMotion({querySelector:()=>({after:element=>{panel=element;}})},{prepareIdentity:async file=>({blob:new Blob(['photo']),name:file.name})});
 return{$:name=>panel.querySelector('#motion'+name),calls,panel};
}
async function load(ui){
 ui.$('Video').files=[{name:'reference.mov',size:100,lastModified:1}];ui.$('Video').onchange();await Promise.resolve();await Promise.resolve();
 ui.$('Identity').files=[{name:'me.jpg'}];await ui.$('Identity').onchange();
 ui.$('Start').value='3';ui.$('Duration').value='2';ui.$('Duration').emit('change');
 await ui.$('Prepare').onclick();
}

test('reference frames flow through analysis into half-second MUSE prompts without sending the identity or audio',async()=>{
 const ui=setup();await load(ui);assert.equal(ui.$('Frames').children.length,4);assert.match(ui.$('TempoStatus').textContent,/120 BPM/);
 ui.$('Consent').checked=true;await ui.$('Analyze').onclick();assert.equal(ui.calls.length,1);
 assert.equal(ui.calls[0].url,'https://cloud.test/functions/v1/muse-motion-analyze');assert.deepEqual(Object.keys(ui.calls[0].body).sort(),['consent','duration','frames','referenceStart']);
 assert.deepEqual(ui.calls[0].body.frames.map(frame=>Object.keys(frame).sort()),Array.from({length:4},()=>['image','time']));
 assert.equal(ui.calls[0].body.referenceStart,3);assert.equal(ui.$('Timeline').children.length,1);
 ui.$('Build').onclick();assert.equal(ui.$('Outputs').hidden,false);assert.match(ui.$('MusePrompt').value,/source 3\.000/);
 assert.match(ui.$('MusePrompt').value,/HALF-SECOND PERFORMANCE CHECKPOINTS/);assert.match(ui.$('MusePrompt').value,/original 1\.0x playback speed/);assert.match(ui.$('MusePrompt').value,/delicate, visible flutter/);
 assert.equal(ui.$('Shots').children.length,1);assert.match(ui.$('KeyframePrompt').value,/MY_IDENTITY\.jpg/);
 ui.$('Skirt').checked=false;ui.$('Skirt').emit('input');assert.equal(ui.$('Outputs').hidden,true);ui.$('Build').onclick();assert.doesNotMatch(ui.$('MusePrompt').value,/delicate, visible flutter/);
});

test('AI analysis is not invoked without specific consent or a signed-in OPS session',async()=>{
 for(const signedIn of [true,false]){const ui=setup({signedIn});await load(ui);ui.$('Consent').checked=!signedIn;await ui.$('Analyze').onclick();assert.equal(ui.calls.length,0);assert.match(ui.$('Status').textContent,signedIn?/同意/:/ログイン/);assert.equal(ui.$('Analyze').disabled,false);}
});

test('cancelling while the session refreshes prevents a late frame upload',async()=>{
 let release;const gate=new Promise(resolve=>{release=resolve;});const ui=setup({token:()=>gate});await load(ui);ui.$('Consent').checked=true;
 const run=ui.$('Analyze').onclick();await Promise.resolve();await Promise.resolve();ui.$('Cancel').onclick();release('session-token');await run;assert.equal(ui.calls.length,0);assert.match(ui.$('Status').textContent,/中止/);
});
