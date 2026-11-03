import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {buildMuseMotionPackage} from '../muse-motion-engine.mjs';
import {normalizeMusePolish} from '../muse-motion-polish.mjs';

const source=fs.readFileSync(new URL('../muse-motion-finish.mjs',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replace('export function mountMuseMotionFinish','function mountMuseMotionFinish');
const descendants=element=>[...element.children,...element.children.flatMap(descendants)];
class Element{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.listeners={};this.value='';this.checked=false;this.hidden=false;this.disabled=false;this.files=[];this.currentTime=0;this.paused=true;}
 set innerHTML(value){this.html=value;this.controls=new Map();for(const match of value.matchAll(/<(input|textarea|select|video|progress|button|div|p)[^>]*id="(motionFinish[^"]+)"[^>]*>/g)){const element=new Element(match[1]);element.id=match[2];element.hidden=/\bhidden\b/.test(match[0]);element.value=/value="([^"]*)"/.exec(match[0])?.[1]||'';this.controls.set(element.id,element);}}
 get innerHTML(){return this.html||'';}
 querySelector(selector){return this.controls?.get(selector.slice(1))||null;}
 querySelectorAll(selector){const all=new Set(),collect=element=>{if(all.has(element))return;all.add(element);for(const child of element.children)collect(child);};for(const element of this.controls?.values()||this.children)collect(element);return [...all].filter(element=>selector.split(',').some(tag=>tag.toUpperCase()===element.tagName));}
 append(...elements){this.children.push(...elements);}
 replaceChildren(...elements){this.children=elements;}
 setAttribute(name,value){this[name]=value;}
 removeAttribute(name){delete this[name];}
 addEventListener(type,handler){(this.listeners[type]||=[]).push(handler);}
 emit(type){for(const handler of this.listeners[type]||[])handler({target:this});}
 pause(){this.paused=true;}
 load(){}
 remove(){this.removed=true;}
 click(){this.onclick?.();}
}
const turn=()=>new Promise(resolve=>setImmediate(resolve));
const gate=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};};
function setup(overrides={}){
 const created=[],revoked=[],downloads=[],renderCalls=[],boundaryCalls=[],inspectCalls=[],shares=[],jobs=new Map();let serial=0,jobId=0,now=100000;
 const blobs=new Map(),document={body:new Element('body'),createElement(tag){const element=new Element(tag);created.push(element);if(tag==='a')element.click=()=>downloads.push({name:element.download,blob:blobs.get(element.href),url:element.href});return element;}};
 const root=new Element('div');
 const context=vm.createContext({document,Blob,File,DOMException,AbortController,Date:class extends Date{static now(){return now;}},setTimeout:(callback,ms)=>{const id=++jobId;jobs.set(id,{callback,ms});return id;},clearTimeout:id=>jobs.delete(id),
  URL:{createObjectURL(blob){const url=`blob:test-${++serial}`;blobs.set(url,blob);return url;},revokeObjectURL(url){revoked.push(url);}},navigator:{canShare:()=>true,share:async value=>{shares.push(value);}},fetch:()=>{throw Error('A local finishing workflow must never call a cloud endpoint');},
  inspectGeneratedCut:async(file,options)=>{inspectCalls.push({file,...options});return{duration:file.duration??10,width:1080,height:1920};},
  extractCutBoundary:async(file,options)=>{boundaryCalls.push({file,...options});return{blob:new Blob([options.edge],{type:'image/png'}),time:options.inPoint+(options.edge==='end'?options.duration*options.playbackRate-1/30:0)};},
  canRenderMuseCuts:async()=>true,
  normalizeMusePolish,assessMuseLoop:async()=>({status:'candidate',startBlob:new Blob(['start'],{type:'image/png'}),endBlob:new Blob(['end'],{type:'image/png'}),reason:'画素比較の候補・目視確認が必要です。'}),
  renderMuseCuts:async options=>{renderCalls.push(options);options.onProgress?.({phase:'rendering',cut:1,totalCuts:options.shots.length,done:1,total:30,percent:50});const duration=options.shots.reduce((sum,shot)=>sum+shot.duration,0);return{blob:new Blob(['mp4'],{type:'video/mp4'}),duration,requestedDuration:duration,roundingSeconds:0};},...overrides});
 vm.runInContext(source,context);const api=context.mountMuseMotionFinish(root),panel=root.children[0];
 const $=name=>panel.querySelector('#motionFinish'+name),card=index=>$('Rows').children[index-1],find=(index,tag,predicate=()=>true)=>descendants(card(index)).find(element=>element.tagName===tag.toUpperCase()&&predicate(element));
 return{api,panel,$,card,find,context,renderCalls,boundaryCalls,inspectCalls,downloads,revoked,shares,jobs,advance(ms){now+=ms;},fire(ms){const items=[...jobs].filter(([,job])=>job.ms===ms);assert.ok(items.length,`Expected ${ms}ms timer`);for(const [id,job]of items){jobs.delete(id);job.callback();}}};
}
const plan=()=>buildMuseMotionPackage({duration:12,referenceStart:3,identityName:'MY_IDENTITY.jpg',referenceName:'reference.mov',observations:[{start:0,end:12,body:'Small grounded steps'}]});
const file=(name='muse.mp4',duration=10)=>({name,duration,size:100,type:'video/mp4'});
async function load(ui,index,asset=file(`cut-${index}.mp4`)){const pick=ui.find(index,'input',element=>element.type==='file');pick.files=[asset];await pick.onchange();return asset;}
const button=(ui,index,prefix)=>ui.find(index,'button',element=>element.textContent.startsWith(prefix));
async function loadAll(ui){for(let index=1;index<=3;index++)await load(ui,index);}

test('a three-cut plan creates local file slots and preserves the exact partial final duration',async()=>{
 const ui=setup();ui.api.setPlan(plan());assert.equal(ui.panel.hidden,false);assert.equal(ui.$('Rows').children.length,3);
 assert.deepEqual(ui.$('Rows').children.map(card=>card.children[0].textContent),['CUT 1 ／ 完成5.000秒','CUT 2 ／ 完成5.000秒','CUT 3 ／ 完成2.000秒']);
 await load(ui,1);assert.match(ui.find(1,'p',element=>element.textContent.includes('元動画')).textContent,/0\.000〜5\.000秒を等速/);assert.equal(ui.find(1,'select').value,'1');assert.equal(ui.inspectCalls.length,1);
 assert.equal(ui.find(1,'video').hidden,false);assert.equal(ui.$('Reviewed').checked,false);assert.equal(ui.$('Cancel').hidden,true);
});

test('file duration alone never accelerates a cut and a checked join uses selected ranges at explicit speed',async()=>{
 const ui=setup();ui.api.setPlan(plan());await loadAll(ui);
 const start=ui.find(2,'input',element=>element.type==='number');start.value='1.25';start.onchange();ui.$('Reviewed').checked=true;await ui.$('Join').onclick();
 assert.equal(ui.renderCalls.length,1);assert.deepEqual(Array.from(ui.renderCalls[0].shots,shot=>[shot.inPoint,shot.duration,shot.playbackRate]),[[0,5,1],[1.25,5,1],[0,2,1]]);
 assert.equal(ui.$('Preview').hidden,false);assert.equal(ui.$('Download').hidden,false);assert.match(ui.$('Status').textContent,/完成 12\.000秒/);
 ui.$('Download').onclick();assert.equal(ui.downloads.at(-1).name,'hanako-muse-12.000s.mp4');
 const speed=ui.find(1,'select');speed.value='2';speed.onchange();assert.equal(ui.$('Reviewed').checked,false);assert.equal(ui.$('Preview').hidden,true);assert.equal(ui.$('Download').hidden,true);
 await button(ui,1,'このCUTを指定尺で保存').onclick();assert.equal(ui.renderCalls.at(-1).shots[0].playbackRate,2);assert.equal(ui.downloads.at(-1).name,'CUT_01_5.000s.mp4');
});

test('missing files, insufficient source length and unreviewed joins never reach an encoder',async()=>{
 const ui=setup();ui.api.setPlan(plan());await ui.$('Join').onclick();assert.match(ui.$('Status').textContent,/確認チェック/);assert.equal(ui.renderCalls.length,0);
 ui.$('Reviewed').checked=true;await ui.$('Join').onclick();assert.match(ui.$('Status').textContent,/CUT 1.*動画/);assert.equal(ui.renderCalls.length,0);
 await load(ui,1,file('too-short.mp4',4));await button(ui,1,'このCUTを指定尺で保存').onclick();assert.match(ui.$('Status').textContent,/5\.000秒分/);assert.equal(ui.renderCalls.length,0);
 await load(ui,1);const speed=ui.find(1,'select');speed.value='2';speed.onchange();const start=ui.find(1,'input',element=>element.type==='number');start.value='.1';start.onchange();await button(ui,1,'このCUTを指定尺で保存').onclick();assert.equal(ui.renderCalls.length,0,'2x needs ten usable source seconds after the in-point');
 assert.equal(ui.$('Join').disabled,false);
});

test('actual ending PNG and seam comparisons use the previous trimmed end followed by the next selected start',async()=>{
 const ui=setup();ui.api.setPlan(plan());await loadAll(ui);
 await button(ui,1,'最後の1コマを保存').onclick();assert.equal(ui.downloads.at(-1).name,'CUT_01_LAST_FRAME.png');assert.equal(ui.downloads.at(-1).blob.type,'image/png');assert.equal(ui.boundaryCalls.at(-1).edge,'end');
 const start=ui.find(2,'input',element=>element.type==='number');start.value='2';start.onchange();await button(ui,2,'前CUTの終わり').onclick();
 assert.deepEqual(ui.boundaryCalls.slice(-2).map(call=>[call.file.name,call.edge,call.inPoint,call.duration,call.playbackRate]),[['cut-1.mp4','end',0,5,1],['cut-2.mp4','start',2,5,1]]);
 const images=descendants(ui.card(2)).filter(element=>element.tagName==='IMG');assert.equal(images.length,2);assert.deepEqual(images.map(image=>image.alt),['CUT 1 最後','CUT 2 最初']);assert.match(ui.$('Status').textContent,/顔・手足・重心・画角/);
 await button(ui,1,'前CUTの終わり').onclick();assert.match(ui.$('Status').textContent,/CUT 1には前/);
});

test('reference exports contain only the cut source range at 1x and timing JSON reports explicit user choices',async()=>{
 const ui=setup(),reference=file('reference.mov',30);ui.api.setPlan(plan(),{referenceFile:reference});
 await button(ui,2,'このCUTの参考動画').onclick();assert.equal(ui.renderCalls.length,1);assert.deepEqual(Array.from(ui.renderCalls[0].shots,shot=>[shot.file,shot.inPoint,shot.duration,shot.playbackRate]),[[reference,8,5,1]]);assert.equal(ui.downloads.at(-1).name,'REFERENCE_CUT_02.mp4');
 await load(ui,1);const speed=ui.find(1,'select');speed.value='2';speed.onchange();ui.$('Manifest').onclick();const manifest=JSON.parse(await ui.downloads.at(-1).blob.text());assert.equal(manifest.totalDuration,12);assert.equal(manifest.fps,30);assert.equal(manifest.audio,false);assert.equal(manifest.cuts[0].playbackRate,2);assert.equal(manifest.cuts[1].file,null);
});

test('unsupported H264 leaves the export unavailable and gives the external editing route',async()=>{
 const ui=setup({canRenderMuseCuts:async()=>false});ui.api.setPlan(plan());await loadAll(ui);ui.$('Reviewed').checked=true;await ui.$('Join').onclick();assert.equal(ui.renderCalls.length,0);assert.equal(ui.$('Download').hidden,true);assert.match(ui.$('Status').textContent,/終了画像とCUTの秒数表/);assert.equal(ui.$('Join').disabled,false);
});

test('cancelled media work settles immediately and its late output cannot replace a newer completed movie',async()=>{
 const old=gate(),ui=setup();ui.api.setPlan(plan());await loadAll(ui);ui.context.renderMuseCuts=()=>old.promise;ui.$('Reviewed').checked=true;const run=ui.$('Join').onclick();await turn();let settled=false;run.then(()=>{settled=true;});
 ui.$('Cancel').onclick();await turn();assert.equal(settled,true);assert.equal(ui.$('Join').disabled,false);assert.equal(ui.$('Cancel').hidden,true);assert.equal(ui.$('Rows').children.length,3);
 ui.context.renderMuseCuts=async()=>({blob:new Blob(['new'],{type:'video/mp4'}),duration:12,requestedDuration:12});await ui.$('Join').onclick();const fresh=ui.$('Preview').src;
 old.resolve({blob:new Blob(['old'],{type:'video/mp4'}),duration:99,requestedDuration:99});await turn();assert.equal(ui.$('Preview').src,fresh);assert.match(ui.$('Status').textContent,/12\.000秒/);assert.doesNotMatch(ui.$('Status').textContent,/99\.000/);
});

test('reset aborts a pending read and reclaims all preview and comparison URLs before accepting a new plan',async()=>{
 const ui=setup();ui.api.setPlan(plan());await loadAll(ui);await button(ui,2,'前CUTの終わり').onclick();const urlsBefore=[...ui.revoked];
 const pending=gate();ui.context.inspectGeneratedCut=()=>pending.promise;const pick=ui.find(1,'input',element=>element.type==='file');pick.files=[file('pending.mov')];const run=pick.onchange();await turn();ui.api.clear();await run;
 assert.equal(ui.panel.hidden,true);assert.equal(ui.$('Rows').children.length,0);assert.equal(ui.$('Preview').hidden,true);assert.ok(ui.revoked.length>=urlsBefore.length+5,'three videos and two comparison images must be released');
 ui.api.setPlan(plan());pending.resolve({duration:90,width:1080,height:1920});await turn();assert.equal(ui.$('Rows').children.length,3);assert.equal(ui.find(1,'video').hidden,true);assert.equal(ui.$('Reviewed').checked,false);
});

test('the finishing watchdog updates time and unlocks the form without starting a billable or hidden retry',async()=>{
 const ui=setup({inspectGeneratedCut:()=>new Promise(()=>{})});ui.api.setPlan(plan());const run=load(ui,1);await turn();ui.advance(4000);ui.fire(1000);assert.match(ui.$('Clock').textContent,/4秒経過/);ui.fire(300000);await run;assert.match(ui.$('Status').textContent,/時間切れ/);assert.equal(ui.$('Join').disabled,false);assert.equal(ui.$('Cancel').hidden,true);assert.equal(ui.renderCalls.length,0);assert.equal(ui.jobs.size,0);
});

test('finishing sends the chosen Japanese caption and actual estimated beats without changing cut durations',async()=>{
 const ui=setup(),next=plan();next.config.beatTimes=[.1,.6,5.1,11.6];next.config.beatStatus='estimated';ui.api.setPlan(next,{captionText:'今日の主役は\nこのふわっと感♡'});await loadAll(ui);
 assert.equal(ui.$('BeatStyle').value,'sparkle');assert.match(ui.$('BeatInfo').textContent,/推定した4拍/);ui.$('CaptionColor').value='pink';ui.$('CaptionPosition').value='upper';ui.$('Reviewed').checked=true;await ui.$('Join').onclick();
 const call=ui.renderCalls.at(-1);assert.equal(call.polish.caption.text,'今日の主役は\nこのふわっと感♡');assert.equal(call.polish.caption.color,'pink');assert.equal(call.polish.caption.position,'upper');assert.deepEqual(Array.from(call.polish.beatTimes),[.1,.6,5.1,11.6]);assert.equal(call.trim,undefined);assert.equal(call.shots.reduce((sum,shot)=>sum+shot.duration,0),12);
 ui.$('Caption').value='別のひと言♡';ui.$('Caption').emit('input');assert.equal(ui.$('Download').hidden,true);assert.equal(ui.$('Preview').hidden,true);
 ui.$('Manifest').onclick();const manifest=JSON.parse(await ui.downloads.at(-1).blob.text());assert.equal(manifest.polish.caption.text,'別のひと言♡');assert.equal(manifest.audioSourceStart,3);assert.equal(manifest.trim,null);
});

test('unverified beats never activate music accents and invalid captions fail before encoding',async()=>{
 const ui=setup(),next=plan();next.config.beatTimes=[.5];next.config.beatStatus='unverified';ui.api.setPlan(next);await loadAll(ui);ui.$('BeatStyle').value='sparkle';ui.$('Reviewed').checked=true;await ui.$('Join').onclick();assert.equal(ui.renderCalls[0].polish.beatStyle,'none');assert.deepEqual(Array.from(ui.renderCalls[0].polish.beatTimes),[]);
 ui.$('Caption').value='あ'.repeat(61);await ui.$('Join').onclick();assert.equal(ui.renderCalls.length,1);assert.match(ui.$('Status').textContent,/60文字/);assert.equal(ui.$('Join').disabled,false);
});

test('loop checks show actual boundaries and explicit trimming requires review and records the shifted music start',async()=>{
 const comparisons=[],ui=setup({assessMuseLoop:async options=>{comparisons.push(options);return{status:'review',reason:'動く向きを確認してください。',startBlob:new Blob(['first']),endBlob:new Blob(['last'])};}});ui.api.setPlan(plan());await loadAll(ui);ui.$('TrimEnabled').checked=true;ui.$('TrimStart').value='1';ui.$('TrimEnd').value='11';ui.$('TrimStart').emit('input');assert.match(ui.$('TrimInfo').textContent,/10\.000秒/);
 await ui.$('LoopCompare').onclick();assert.equal(comparisons.length,1);assert.equal(comparisons[0].trim.start,1);assert.equal(ui.$('LoopImages').children.length,2);assert.match(ui.$('LoopStatus').textContent,/画素の比較/);assert.equal(ui.$('LoopReviewed').checked,false);
 ui.$('Reviewed').checked=true;await ui.$('Join').onclick();assert.equal(ui.renderCalls.length,0);assert.match(ui.$('Status').textContent,/ループ確認/);ui.$('LoopReviewed').checked=true;await ui.$('Join').onclick();assert.equal(ui.renderCalls[0].trim.end,11);
 ui.$('Manifest').onclick();const manifest=JSON.parse(await ui.downloads.at(-1).blob.text());assert.equal(manifest.totalDuration,10);assert.equal(manifest.untrimmedDuration,12);assert.equal(manifest.audioSourceStart,4);
 ui.$('TrimEnd').value='10';ui.$('TrimEnd').emit('input');assert.equal(ui.$('LoopReviewed').checked,false);assert.equal(ui.$('LoopImages').children.length,0);assert.equal(ui.$('Download').hidden,true);
 ui.api.setPlan(plan());assert.equal(ui.$('TrimEnabled').checked,false);assert.equal(ui.$('TrimStart').value,'0');assert.equal(ui.$('TrimEnd').value,'12');
});

test('caption stays locked during rendering and cancelled loop reads cannot restore obsolete images',async()=>{
 const pending=gate(),ui=setup({renderMuseCuts:()=>pending.promise});ui.api.setPlan(plan());await loadAll(ui);ui.$('Reviewed').checked=true;const run=ui.$('Join').onclick();await turn();assert.equal(ui.$('Caption').disabled,true);ui.$('Cancel').onclick();await run;assert.equal(ui.$('Caption').disabled,false);pending.resolve({blob:new Blob(['late']),duration:12});await turn();assert.equal(ui.$('Preview').hidden,true);
 const images=gate();ui.context.assessMuseLoop=()=>images.promise;const reading=ui.$('LoopCompare').onclick();await turn();ui.$('Cancel').onclick();await reading;images.resolve({status:'candidate',reason:'late',startBlob:new Blob(['x']),endBlob:new Blob(['y'])});await turn();assert.equal(ui.$('LoopImages').children.length,0);
});

test('clearing a plan stops every selected source preview and releases its media URL',async()=>{
 const ui=setup();ui.api.setPlan(plan());await loadAll(ui);const videos=[1,2,3].map(index=>ui.find(index,'video'));for(const video of videos)video.paused=false;ui.api.clear();assert.ok(videos.every(video=>video.paused&&video.src===undefined));assert.equal(ui.panel.hidden,true);
});
