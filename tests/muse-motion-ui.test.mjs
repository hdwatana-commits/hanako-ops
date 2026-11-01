import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {buildMuseMotionPackage,normalizeMotionObservations} from '../muse-motion-engine.mjs';
import {buildMotionSocialPackage} from '../muse-motion-social.mjs';
import {planMotionBatches} from '../muse-motion-batches.mjs';

const source=fs.readFileSync(new URL('../muse-motion.mjs',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replace('export function mountMuseMotion','function mountMuseMotion');
class Element{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.listeners={};this.value='';this.checked=false;this.hidden=false;this.disabled=false;this.currentTime=0;this.files=[];}
 set innerHTML(value){this.html=value;if(this.tagName==='DETAILS'&&value.includes('motionInputs')){this.controls=new Map();for(const match of value.matchAll(/<(input|textarea|video|progress|button|div|section|figure|img|p|details|select)[^>]*id="(motion[^"]+)"[^>]*>/g)){const element=new Element(match[1]);element.id=match[2];element.value=/value="([^"]*)"/.exec(match[0])?.[1]||'';element.checked=/\bchecked\b/.test(match[0]);element.readOnly=/\breadonly\b/.test(match[0]);element.hidden=/\bhidden\b/.test(match[0]);this.controls.set(element.id,element);}}}
 get innerHTML(){return this.html||'';}
 querySelector(selector){return this.controls?.get(selector.slice(1))||null;}
 querySelectorAll(selector){const all=new Set();const collect=element=>{if(all.has(element))return;all.add(element);for(const child of element.children||[])collect(child);};for(const element of this.controls?.values()||this.children)collect(element);return [...all].filter(element=>!selector||['INPUT','SELECT','BUTTON'].includes(element.tagName)||(element.tagName==='TEXTAREA'&&!element.readOnly));}
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
function setup({signedIn=true,token=async()=> 'session-token',respond,overrides={}}={}){
 let panel;const calls=[],document={createElement:tag=>new Element(tag),body:new Element('body')};
 const copied=[];
 const context=vm.createContext({document,Blob,File,AbortController,DOMException,setTimeout,clearTimeout,navigator:{clipboard:{writeText:async value=>{copied.push(value);}}},URL:{createObjectURL:()=> 'blob:local',revokeObjectURL:()=>{}},buildMuseMotionPackage,normalizeMotionObservations,buildMotionSocialPackage,planMotionBatches,
  inspectMotionVideo:async()=>({duration:15,width:1080,height:1920}),validateMotionClip:(range,duration)=>{if(range.start<0||range.duration<2||range.start+range.duration>duration)throw Error('区間が不正');},
  extractMotionFrames:async(_file,{duration,start,onProgress})=>{const frames=Array.from({length:Math.ceil(duration/.5)},(_,i)=>({time:i*.5,dataUrl:`data:image/jpeg;base64,${i}`,sourceTime:start+i*.5}));onProgress({done:frames.length,total:frames.length,bytes:3000,byteLimit:2000000});return frames;},
  analyzeMotionTempo:async()=>({bpm:120,beatTimes:[.1,.6,1.1,1.6],beatStatus:'estimated'}),
  window:{HanakoCloudSync:class{constructor(){this.signedIn=signedIn;this.url='https://cloud.test';this.key='public-key';}getAccessToken(){return token();}}},
  fetch:async(url,options)=>{const body=JSON.parse(options.body);calls.push({url,body,options});return respond?respond(body,options,calls.length):batchResponse(body);},...overrides
 });
 vm.runInContext(source,context);
 context.mountMuseMotion({querySelector:()=>({after:element=>{panel=element;}})},{prepareIdentity:async file=>({blob:new Blob(['photo']),name:file.name})});
 return{$:name=>panel.querySelector('#motion'+name),calls,panel,copied,context};
}
function batchResponse(body,rows=[{...observation,start:body.analysisStart,end:body.analysisEnd}]){return{ok:true,json:async()=>({batchProtocol:1,analysisStart:body.analysisStart,analysisEnd:body.analysisEnd,observations:rows,summary:'参考動作の候補です。'})};}
async function load(ui,{duration=2,start=3}={}){
 ui.$('Video').files=[{name:'reference.mov',size:100,lastModified:1}];await ui.$('Video').onchange();await Promise.resolve();await Promise.resolve();
 ui.$('Identity').files=[{name:'me.jpg'}];await ui.$('Identity').onchange();
 ui.$('Start').value=String(start);ui.$('Duration').value=String(duration);ui.$('Duration').emit('change');
 await ui.$('Prepare').onclick();
}

test('reference frames flow through analysis into half-second MUSE prompts without sending the identity or audio',async()=>{
 const ui=setup();await load(ui);assert.equal(ui.$('Frames').children.length,4);assert.match(ui.$('TempoStatus').textContent,/120 BPM/);
 ui.$('Consent').checked=true;await ui.$('Analyze').onclick();assert.equal(ui.calls.length,1);
 assert.equal(ui.calls[0].url,'https://cloud.test/functions/v1/muse-motion-analyze');assert.deepEqual(Object.keys(ui.calls[0].body).sort(),['analysisEnd','analysisStart','consent','duration','frames','referenceStart']);
 assert.deepEqual(ui.calls[0].body.frames.map(frame=>Object.keys(frame).sort()),Array.from({length:4},()=>['image','time']));
 assert.equal(ui.calls[0].body.referenceStart,3);assert.equal(ui.$('Timeline').children.length,1);
 ui.$('Build').onclick();assert.equal(ui.$('Outputs').hidden,false);assert.match(ui.$('MusePrompt').value,/source 3\.000/);
 assert.match(ui.$('MusePrompt').value,/HALF-SECOND PERFORMANCE CHECKPOINTS/);assert.match(ui.$('MusePrompt').value,/original 1\.0x playback speed/);assert.match(ui.$('MusePrompt').value,/delicate, visible flutter/);
 assert.equal(ui.$('Shots').children.length,1);assert.match(ui.$('KeyframePrompt').value,/MY_IDENTITY\.jpg/);
 ui.$('Skirt').checked=false;ui.$('Skirt').emit('input');assert.equal(ui.$('Outputs').hidden,true);ui.$('Build').onclick();assert.doesNotMatch(ui.$('MusePrompt').value,/delicate, visible flutter/);
});

const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};};
const turn=()=>new Promise(resolve=>setImmediate(resolve));
const framesFor=tag=>[0,.5,1,1.5].map(time=>({time,dataUrl:`data:image/jpeg;base64,${tag}-${time}`,sourceTime:time+3}));
function fakeTimers(){
 let serial=0,now=100000;const jobs=new Map();const DateClock=class extends Date{static now(){return now;}};
 return{Date:DateClock,advance:ms=>{now+=ms;},setTimeout:(callback,delay)=>{const id=++serial;jobs.set(id,{callback,delay});return id;},clearTimeout:id=>jobs.delete(id),fire(delay){const entries=[...jobs].filter(([,job])=>job.delay===delay);assert.ok(entries.length,`Expected a ${delay}ms deadline`);for(const [id,job]of entries){jobs.delete(id);job.callback();}},jobs};
}
async function assertFinishedAfterCancel(ui,run){
 let finished=false;Promise.resolve(run).then(()=>{finished=true;});ui.$('Cancel').onclick();await turn();
 assert.equal(finished,true,'cancellation must settle without the non-cooperative task resolving');
 for(const key of ['Prepare','Manual','ApplyBpm','Video'])assert.equal(ui.$(key).disabled,false,`${key} must be usable after cancellation`);
 assert.match(ui.$('Status').textContent,/中止/);await run;
}

test('cancel immediately restores controls while audio decoding never resolves',async t=>{
 const ui=setup();t.after(()=>ui.$('Cancel').onclick());await load(ui);const audio=deferred();let started=false;
 ui.context.analyzeMotionTempo=async()=>{started=true;return audio.promise;};ui.$('Duration').emit('change');
 const run=ui.$('Prepare').onclick();await turn();assert.equal(started,true);assert.equal(ui.$('Prepare').disabled,true);
 await assertFinishedAfterCancel(ui,run);
 // Releasing the old audio later must not publish its obsolete result.
 audio.resolve({bpm:222,beatTimes:[.1],beatStatus:'estimated'});await turn();assert.notEqual(ui.$('Bpm').value,'222');
});

test('manual fallback remains available during a stalled analysis and late results cannot erase the note',async t=>{
 const ui=setup();t.after(()=>ui.$('Cancel').onclick());await load(ui);const audio=deferred();ui.context.analyzeMotionTempo=()=>audio.promise;ui.$('Duration').emit('change');
 const run=ui.$('Prepare').onclick();await turn();assert.equal(ui.$('Prepare').disabled,true);assert.equal(ui.$('Manual').disabled,false);assert.equal(ui.$('Frames').children.length,4,'prepared video frames are visible before audio finishes');
 ui.$('Manual').onclick();await turn();await run;assert.equal(ui.$('Prepare').disabled,false);assert.equal(ui.$('Timeline').children.length,1);assert.equal(ui.$('TimelinePanel').hidden,false);
 audio.resolve({bpm:222,beatTimes:[.1],beatStatus:'estimated'});await turn();assert.equal(ui.$('Timeline').children.length,1);assert.notEqual(ui.$('Bpm').value,'222');assert.match(ui.$('Status').textContent,/手入力/);
});

test('cancel settles during a session refresh before its token promise is released',async t=>{
 const token=deferred();let requested=false;const ui=setup({token:()=>{requested=true;return token.promise;}});t.after(()=>ui.$('Cancel').onclick());await load(ui);ui.$('Consent').checked=true;
 const run=ui.$('Analyze').onclick();await turn();assert.equal(requested,true);await assertFinishedAfterCancel(ui,run);
 token.resolve('late-token');await turn();assert.equal(ui.calls.length,0,'a late token must not upload reference frames');
});

test('a cancelled metadata read cannot replace a newer source or unlock its active operation',async t=>{
 const old=deferred(),next=deferred();const ui=setup({overrides:{inspectMotionVideo:file=>file.name==='old.mov'?old.promise:next.promise}});t.after(()=>ui.$('Cancel').onclick());
 ui.$('Video').files=[{name:'old.mov',size:100,lastModified:1}];const first=ui.$('Video').onchange();await turn();await assertFinishedAfterCancel(ui,first);
 ui.$('Video').files=[{name:'new.mov',size:200,lastModified:2}];const second=ui.$('Video').onchange();await turn();assert.equal(ui.$('Prepare').disabled,true);
 old.resolve({duration:99,width:1920,height:1080});await turn();assert.equal(ui.$('Prepare').disabled,true,'the old finally must not unlock a newer operation');assert.doesNotMatch(ui.$('VideoInfo').textContent||'',/old\.mov/);
 next.resolve({duration:15,width:1080,height:1920});await second;assert.match(ui.$('VideoInfo').textContent,/new\.mov/);assert.equal(ui.$('Prepare').disabled,false);
});

test('late extracted frames and progress cannot overwrite the next preparation',async t=>{
 const ui=setup();t.after(()=>ui.$('Cancel').onclick());await load(ui);const pending=[];
 ui.context.extractMotionFrames=(_file,options)=>{const gate=deferred();pending.push({...gate,options});return gate.promise;};ui.$('Duration').emit('change');
 const first=ui.$('Prepare').onclick();await turn();await assertFinishedAfterCancel(ui,first);
 const second=ui.$('Prepare').onclick();await turn();assert.equal(pending.length,2);const status=ui.$('Status').textContent,progress=ui.$('Progress').value;
 pending[0].options.onProgress({done:60,total:60});pending[0].resolve(framesFor('OLD'));await turn();assert.equal(ui.$('Prepare').disabled,true);assert.equal(ui.$('Status').textContent,status);assert.equal(ui.$('Progress').value,progress);assert.equal(ui.$('Frames').children.length,0);
 pending[1].resolve(framesFor('NEW'));await second;assert.equal(ui.$('Frames').children.length,4);assert.match(ui.$('Frames').children[0].children[0].src,/NEW/);assert.equal(ui.$('Prepare').disabled,false);
});

test('a failed frame extraction can be retried without reloading the page',async t=>{
 const ui=setup();t.after(()=>ui.$('Cancel').onclick());await load(ui);let attempts=0;ui.context.extractMotionFrames=async()=>{if(++attempts===1)throw Error('frame decode failed');return framesFor('RETRY');};ui.$('Duration').emit('change');
 await ui.$('Prepare').onclick();assert.equal(ui.$('Prepare').disabled,false);assert.match(ui.$('Status').textContent,/frame decode failed/);
 await ui.$('Prepare').onclick();assert.equal(attempts,2);assert.equal(ui.$('FramePanel').hidden,false);assert.equal(ui.$('Frames').children.length,4);
});

test('audio failure keeps prepared frames and lets manual editing continue',async t=>{
 const ui=setup();t.after(()=>ui.$('Cancel').onclick());await load(ui);let extractions=0;ui.context.extractMotionFrames=async()=>{extractions++;return framesFor('VISIBLE');};ui.context.analyzeMotionTempo=async()=>{throw Error('unsupported audio');};ui.$('Duration').emit('change');
 await ui.$('Prepare').onclick();assert.equal(ui.$('FramePanel').hidden,false);assert.equal(ui.$('Frames').children.length,4);assert.equal(ui.$('Bpm').value,'');assert.match(ui.$('TempoStatus').textContent,/未確認|手入力|BPM/);assert.equal(ui.$('Manual').disabled,false);
 ui.$('Manual').onclick();assert.equal(ui.$('Timeline').children.length,1);await ui.$('Prepare').onclick();assert.equal(extractions,1,'a valid frame cache survives an audio failure');assert.equal(ui.$('Timeline').children.length,1,'a cached preparation does not erase manual motion notes');
});

test('the whole-operation deadline restores the form even when metadata never returns',async t=>{
 const timers=fakeTimers();const ui=setup({overrides:{inspectMotionVideo:()=>new Promise(()=>{}),setTimeout:timers.setTimeout,clearTimeout:timers.clearTimeout}});t.after(()=>ui.$('Cancel').onclick());
 ui.$('Video').files=[{name:'stalled.mov',size:100,lastModified:1}];const run=ui.$('Video').onchange();await turn();let finished=false;Promise.resolve(run).then(()=>{finished=true;});
 timers.fire(240000);await turn();assert.equal(finished,true);assert.equal(ui.$('Video').disabled,false);assert.equal(ui.$('Prepare').disabled,false);assert.match(ui.$('Status').textContent,/手入力|短い区間/);await run;
 ui.context.inspectMotionVideo=async()=>({duration:15,width:1080,height:1920});ui.$('Video').files=[{name:'working.mov',size:100,lastModified:2}];await ui.$('Video').onchange();assert.match(ui.$('VideoInfo').textContent,/working\.mov/);
});

test('the extraction deadline permits manual fallback instead of leaving every action disabled',async t=>{
 const timers=fakeTimers();const ui=setup({overrides:{setTimeout:timers.setTimeout,clearTimeout:timers.clearTimeout}});t.after(()=>ui.$('Cancel').onclick());await load(ui);ui.context.extractMotionFrames=()=>new Promise(()=>{});ui.$('Duration').emit('change');
 const run=ui.$('Prepare').onclick();await turn();timers.fire(90000);await turn();await run;assert.equal(ui.$('Prepare').disabled,false);assert.equal(ui.$('Manual').disabled,false);assert.match(ui.$('Status').textContent,/タイムアウト|時間/);
 ui.$('Manual').onclick();assert.equal(ui.$('Timeline').children.length,1);
});

test('AI analysis is not invoked without specific consent or a signed-in OPS session',async()=>{
 for(const signedIn of [true,false]){const ui=setup({signedIn});await load(ui);ui.$('Consent').checked=!signedIn;await ui.$('Analyze').onclick();assert.equal(ui.calls.length,0);assert.match(ui.$('Status').textContent,signedIn?/同意/:/ログイン/);assert.equal(ui.$('Analyze').disabled,false);}
});

test('cancelling while the session refreshes prevents a late frame upload',async()=>{
 let release;const gate=new Promise(resolve=>{release=resolve;});const ui=setup({token:()=>gate});await load(ui);ui.$('Consent').checked=true;
 const run=ui.$('Analyze').onclick();await Promise.resolve();await Promise.resolve();ui.$('Cancel').onclick();release('session-token');await run;assert.equal(ui.calls.length,0);assert.match(ui.$('Status').textContent,/中止/);
});

test('caption choices work without uploaded media or login and never call a paid API',async()=>{
 const ui=setup({signedIn:false});ui.$('CaptionPlatform').value='Threads';ui.$('CaptionTone').value='soft';ui.$('CaptionTheme').value='outfit';ui.$('CaptionNote').value='今日はピンクの気分 ♡';
 ui.$('MakeCaptions').onclick();assert.equal(ui.calls.length,0);assert.equal(ui.$('CaptionOutput').hidden,false);assert.equal(ui.$('CaptionChoices').children.length,3);assert.match(ui.$('CaptionText').value,/今日はピンク/);assert.doesNotMatch(ui.$('CaptionText').value,/#/);assert.ok(ui.$('OverlayText').value.length>0);
 const first=ui.$('CaptionText').value;ui.$('AnotherCaptions').onclick();assert.notEqual(ui.$('CaptionText').value,first);
 ui.$('CaptionText').value='自分で直したキャプション 🎀';await ui.$('CopyCaption').onclick();assert.equal(ui.copied.at(-1),'自分で直したキャプション 🎀');
 ui.$('CaptionText').value='あ'.repeat(501);await ui.$('CopyCaption').onclick();assert.equal(ui.copied.length,1);assert.match(ui.$('CaptionStatus').textContent,/文字数/);
});

test('buzz mode reaches every cut while rebuilding keeps an edited caption and overlay',async()=>{
 const ui=setup();await load(ui);ui.$('Consent').checked=true;await ui.$('Analyze').onclick();ui.$('MakeCaptions').onclick();ui.$('CaptionText').value='この文章を残してね♡';ui.$('OverlayText').value='自分のテロップ';
 ui.$('BuzzMode').value='cute';ui.$('BuzzMode').emit('change');ui.$('Build').onclick();assert.match(ui.$('MusePrompt').value,/CUTE PRESENTATION PROPOSAL/);assert.match(ui.$('MusePrompt').value,/0\.5-second/);assert.equal(ui.$('CaptionText').value,'この文章を残してね♡');assert.equal(ui.$('OverlayText').value,'自分のテロップ');
 ui.$('BuzzMode').value='dynamic';ui.$('BuzzMode').emit('change');assert.equal(ui.$('Outputs').hidden,true);ui.$('Build').onclick();assert.match(ui.$('MusePrompt').value,/DYNAMIC PRESENTATION PROPOSAL/);assert.equal(ui.calls.length,1);
});

test('sixty frames are analyzed sequentially in small overlapping batches without dropping the half-second grid',async()=>{
 let active=0,maxActive=0;
 const ui=setup({overrides:{inspectMotionVideo:async()=>({duration:40,width:1080,height:1920})},respond:async body=>{active++;maxActive=Math.max(maxActive,active);await turn();active--;return batchResponse(body);}});
 await load(ui,{duration:30,start:0});ui.$('Consent').checked=true;await ui.$('Analyze').onclick();
 assert.equal(ui.$('Frames').children.length,60);assert.equal(ui.calls.length,6);assert.equal(maxActive,1);
 assert.deepEqual(ui.calls.map(call=>[call.body.analysisStart,call.body.analysisEnd]),[[0,5],[5,10],[10,15],[15,20],[20,25],[25,30]]);
 assert.ok(ui.calls.every(call=>call.body.frames.length<=11));
 assert.deepEqual([...new Set(ui.calls.flatMap(call=>call.body.frames.map(frame=>frame.time)))],Array.from({length:60},(_,i)=>i*.5));
 assert.equal(ui.calls[0].body.frames.at(-1).time,ui.calls[1].body.frames[0].time);assert.equal(ui.calls.at(-1).body.frames.at(-1).time,29.5);
 assert.equal(ui.$('Timeline').children.length,6);assert.match(ui.$('Phase').textContent,/4 \/ 4|完成/);assert.match(ui.$('BatchStatus').textContent,/6 \/ 6/);
 assert.equal(ui.$('Retry').hidden,true);assert.equal(ui.$('Analyze').disabled,false);assert.equal(ui.$('Activity')['aria-busy'],'false');
});

test('a failed batch keeps successful global-time notes and explicitly retries only unfinished ranges',async()=>{
 let fail=true;const ui=setup({respond:body=>{if(body.analysisStart===4&&fail){fail=false;return{ok:false,status:504,json:async()=>({stage:'analysis',code:'analysis_timeout',error:'AIの応答が時間切れになりました。'})};}return batchResponse(body);}});
 await load(ui,{duration:12});ui.$('Consent').checked=true;await ui.$('Analyze').onclick();
 assert.deepEqual(ui.calls.map(call=>call.body.analysisStart),[0,4]);assert.equal(ui.$('Timeline').children.length,1);assert.match(ui.$('AnalysisSummary').textContent,/1 \/ 3/);
 assert.match(ui.$('StageStatus').textContent,/AI解析.*時間切れ/);assert.equal(ui.$('Retry').hidden,false);assert.equal(ui.$('Retry').disabled,false);assert.equal(ui.$('Analyze').disabled,false);
 await turn();assert.equal(ui.calls.length,2,'no paid retry happens before the user chooses to resume');
 await ui.$('Retry').onclick();assert.deepEqual(ui.calls.map(call=>call.body.analysisStart),[0,4,4,8]);assert.equal(ui.$('Timeline').children.length,3);
 assert.equal(ui.calls[2].body.referenceStart,3);assert.equal(ui.calls[2].body.frames[0].time,4);assert.equal(ui.calls[3].body.analysisEnd,12);
 ui.$('Build').onclick();assert.equal(ui.$('Outputs').hidden,false);assert.match(ui.$('MusePrompt').value,/source 7\.000/);assert.equal(ui.$('Retry').hidden,true);
});

test('cancelling a later batch keeps progress and late old results cannot change a resumed operation',async t=>{
 const old=deferred(),next=deferred();const ui=setup({respond:(body,_options,count)=>count===2?old.promise:count===3?next.promise:batchResponse(body)});t.after(()=>ui.$('Cancel').onclick());
 await load(ui,{duration:12});ui.$('Consent').checked=true;const run=ui.$('Analyze').onclick();await turn();assert.equal(ui.calls.length,2);assert.equal(ui.$('Timeline').children.length,1);
 await assertFinishedAfterCancel(ui,run);assert.equal(ui.$('Retry').hidden,false);assert.equal(ui.calls[1].options.signal.aborted,true);
 const resumed=ui.$('Retry').onclick();await turn();assert.equal(ui.calls.length,3);assert.equal(ui.calls[2].body.analysisStart,4);
 const phase=ui.$('Phase').textContent,status=ui.$('StageStatus').textContent;
 old.resolve(batchResponse(ui.calls[1].body,[{...observation,start:4,end:8,expression:'OLD RESULT MUST NOT APPEAR'}]));await turn();
 assert.equal(ui.$('Phase').textContent,phase);assert.equal(ui.$('StageStatus').textContent,status);assert.equal(ui.$('Prepare').disabled,true);assert.equal(ui.$('Timeline').children.length,1);
 next.resolve(batchResponse(ui.calls[2].body));await resumed;assert.deepEqual(ui.calls.map(call=>call.body.analysisStart),[0,4,4,8]);
 assert.equal(ui.$('Timeline').children.length,3);assert.doesNotMatch(JSON.stringify(ui.$('Timeline').children),/OLD RESULT/);
});

test('a batch request timeout restores controls and reuses completed ranges when the user resumes',async t=>{
 const timers=fakeTimers();const ui=setup({overrides:{Date:timers.Date,setTimeout:timers.setTimeout,clearTimeout:timers.clearTimeout},respond:(body,_options,count)=>count===2?new Promise(()=>{}):batchResponse(body)});t.after(()=>ui.$('Cancel').onclick());
 await load(ui,{duration:12});ui.$('Consent').checked=true;const run=ui.$('Analyze').onclick();await turn();assert.equal(ui.calls.length,2);
 assert.ok([...timers.jobs.values()].some(job=>job.delay===450000),'the multi-batch operation has enough time for all bounded requests');
 assert.ok(![...timers.jobs.values()].some(job=>job.delay===240000),'the earlier whole-task limit cannot cut off a healthy multi-batch analysis');
 timers.fire(100000);await turn();await run;assert.equal(ui.$('Retry').hidden,false);assert.equal(ui.$('Prepare').disabled,false);assert.equal(ui.$('Timeline').children.length,1);assert.equal(timers.jobs.size,0);
 assert.match(ui.$('StageStatus').textContent,/区間 2 \/ 3.*時間切れ/);assert.equal(ui.calls[1].options.signal.aborted,true);
 await ui.$('Retry').onclick();assert.deepEqual(ui.calls.map(call=>call.body.analysisStart),[0,4,4,8]);assert.equal(timers.jobs.size,0);
});

test('current phase and elapsed time keep updating during token, AI and response-body waits',async t=>{
 const timers=fakeTimers(),token=deferred(),headers=deferred(),body=deferred();const ui=setup({token:()=>token.promise,overrides:{Date:timers.Date,setTimeout:timers.setTimeout,clearTimeout:timers.clearTimeout},respond:()=>headers.promise});t.after(()=>ui.$('Cancel').onclick());
 await load(ui,{duration:12});ui.$('Consent').checked=true;const run=ui.$('Analyze').onclick();await turn();
 assert.match(ui.$('Phase').textContent,/接続/);assert.match(ui.$('StageStatus').textContent,/ログイン/);assert.equal(ui.$('Activity')['aria-busy'],'true');
 timers.advance(7000);timers.fire(1000);assert.match(ui.$('Elapsed').textContent,/7秒経過.*7秒.*15秒/);
 token.resolve('session-token');await turn();assert.match(ui.$('Phase').textContent,/区間 1 \/ 3/);assert.match(ui.$('StageStatus').textContent,/3\.00〜7\.00秒/);assert.match(ui.$('DataStatus').textContent,/9枚.*KB.*24枚/);
 assert.match(ui.$('WaitHint').textContent,/内部.*取得できません/);assert.equal(ui.$('Progress').value,0,'the elapsed clock must not invent completed work');
 timers.advance(4000);timers.fire(1000);assert.match(ui.$('Elapsed').textContent,/11秒経過.*4秒.*100秒/);
 headers.resolve({ok:true,json:()=>body.promise});await turn();assert.match(ui.$('StageStatus').textContent,/応答を受信.*確認/);
 timers.advance(2000);timers.fire(1000);assert.match(ui.$('Elapsed').textContent,/13秒経過/);
 await assertFinishedAfterCancel(ui,run);assert.equal(timers.jobs.size,0);const clockText=ui.$('Elapsed').textContent;
 body.resolve((await batchResponse(ui.calls[0].body).json()));await turn();assert.equal(ui.$('Elapsed').textContent,clockText);assert.equal(ui.$('Activity')['aria-busy'],'false');assert.equal(ui.$('Timeline').children.length,0);
});

test('a response body that never finishes cannot hide a completed previous batch or lock retry',async t=>{
 const timers=fakeTimers();let stall=true;const ui=setup({overrides:{Date:timers.Date,setTimeout:timers.setTimeout,clearTimeout:timers.clearTimeout},respond:body=>{if(body.analysisStart===4&&stall){stall=false;return{ok:true,json:()=>new Promise(()=>{})};}return batchResponse(body);}});t.after(()=>ui.$('Cancel').onclick());
 await load(ui,{duration:12});ui.$('Consent').checked=true;const run=ui.$('Analyze').onclick();await turn();assert.match(ui.$('StageStatus').textContent,/応答を受信.*確認/);
 timers.fire(100000);await run;assert.equal(ui.$('Timeline').children.length,1);assert.equal(ui.$('Retry').hidden,false);
 await ui.$('Retry').onclick();assert.deepEqual(ui.calls.map(call=>call.body.analysisStart),[0,4,4,8]);assert.equal(ui.$('Timeline').children.length,3);
});

test('an unsupported or mismatched batch reply is rejected before committing notes or sending the next range',async()=>{
 for(const invalid of [body=>({observations:[observation]}),body=>({batchProtocol:1,analysisStart:body.analysisStart+1,analysisEnd:body.analysisEnd,observations:[observation]}),body=>({batchProtocol:1,analysisStart:body.analysisStart,analysisEnd:body.analysisEnd,observations:[{...observation,start:0,end:body.analysisEnd+.5}]})]){
  const ui=setup({respond:body=>({ok:true,json:async()=>invalid(body)})});await load(ui,{duration:12});ui.$('Consent').checked=true;await ui.$('Analyze').onclick();
  assert.equal(ui.calls.length,1);assert.equal(ui.$('Timeline').children.length,0);assert.equal(ui.$('Prepare').disabled,false);assert.match(ui.$('StageStatus').textContent,/解析結果を確認できません/);
 }
});

test('changing the selected interval clears its old partial cache before a fresh analysis',async()=>{
 let fail=true;const ui=setup({respond:body=>{if(body.analysisStart===4&&fail){fail=false;return{ok:false,json:async()=>({error:'temporarily busy'})};}return batchResponse(body);}});
 await load(ui,{duration:12});ui.$('Consent').checked=true;await ui.$('Analyze').onclick();assert.equal(ui.$('Retry').hidden,false);
 ui.$('Duration').value='10';ui.$('Duration').emit('change');assert.equal(ui.$('Retry').hidden,true);assert.equal(ui.$('Timeline').children.length,0);assert.equal(ui.$('Consent').checked,false);
 await ui.$('Prepare').onclick();ui.$('Consent').checked=true;await ui.$('Analyze').onclick();
 assert.deepEqual(ui.calls.map(call=>[call.body.duration,call.body.analysisStart]),[[12,0],[12,4],[10,0],[10,5]]);assert.equal(ui.$('Timeline').children.length,2);
});

test('new partial-note controls stay locked until processing ends while read-only prompts remain selectable',async t=>{
 const pending=deferred();const ui=setup({respond:(body,_options,count)=>count===2?pending.promise:batchResponse(body)});t.after(()=>ui.$('Cancel').onclick());
 await load(ui,{duration:12});ui.$('Consent').checked=true;const run=ui.$('Analyze').onclick();await turn();assert.equal(ui.calls.length,2);
 const controls=ui.$('Timeline').querySelectorAll('input,select,textarea:not([readonly]),button');assert.ok(controls.length>0);
 for(const control of controls)assert.equal(control.disabled,true,`${control.tagName} created after a partial result must not accept edits that a later result would erase`);
 assert.equal(ui.$('MusePrompt').disabled,false);assert.equal(ui.$('ChatgptPrompt').disabled,false);assert.equal(ui.$('Cancel').disabled,false);assert.equal(ui.$('Manual').disabled,false);
 await assertFinishedAfterCancel(ui,run);for(const control of controls)assert.equal(control.disabled,false,'partial notes become editable after cancellation');
});

test('clicking analysis again after full completion reuses every completed batch without another paid request',async()=>{
 const ui=setup();await load(ui,{duration:12});ui.$('Consent').checked=true;await ui.$('Analyze').onclick();assert.equal(ui.calls.length,3);assert.equal(ui.$('Timeline').children.length,3);
 await ui.$('Analyze').onclick();assert.equal(ui.calls.length,3,'a fully cached analysis is free to reopen');assert.equal(ui.$('Timeline').children.length,3);assert.equal(ui.$('Retry').hidden,true);assert.equal(ui.$('Analyze').disabled,false);
 ui.$('Build').onclick();assert.equal(ui.$('Outputs').hidden,false);
});
