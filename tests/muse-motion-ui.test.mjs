import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {buildMuseMotionPackage,normalizeMotionObservations} from '../muse-motion-engine.mjs';
import {buildMotionSocialPackage} from '../muse-motion-social.mjs';
import {planMotionBatches} from '../muse-motion-batches.mjs';
import {proposeMotionHighlights,cropMotionAnalysis} from '../muse-motion-highlights.mjs';

const source=fs.readFileSync(new URL('../muse-motion.mjs',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replace('export function mountMuseMotion','function mountMuseMotion');
class Element{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.listeners={};this.value='';this.checked=false;this.hidden=false;this.disabled=false;this.currentTime=0;this.files=[];}
 set innerHTML(value){this.html=value;if(this.tagName==='DETAILS'&&value.includes('motionInputs')){this.controls=new Map();for(const match of value.matchAll(/<(input|textarea|video|progress|button|div|section|figure|img|p|details|select)[^>]*id="(motion[^"]+)"[^>]*>/g)){const element=new Element(match[1]);element.id=match[2];element.value=/value="([^"]*)"/.exec(match[0])?.[1]||'';element.checked=/\bchecked\b/.test(match[0]);element.readOnly=/\breadonly\b/.test(match[0]);element.hidden=/\bhidden\b/.test(match[0]);this.controls.set(element.id,element);}}}
 get innerHTML(){return this.html||'';}
 querySelector(selector){return this.controls?.get(selector.slice(1))||null;}
 querySelectorAll(selector){const all=new Set();const collect=element=>{if(all.has(element))return;all.add(element);for(const child of element.children||[])collect(child);};for(const element of this.controls?.values()||this.children)collect(element);return [...all].filter(element=>!selector||selector.split(',').some(part=>part.trim()==='textarea:not([readonly])'?element.tagName==='TEXTAREA'&&!element.readOnly:element.tagName===part.trim().toUpperCase()));}
 addEventListener(type,handler){(this.listeners[type]||=[]).push(handler);}
 emit(type){for(const handler of this.listeners[type]||[])handler({target:this});}
 append(...elements){this.children.push(...elements);}
 replaceChildren(...elements){this.children=elements;}
 setAttribute(name,value){this[name]=value;}
 removeAttribute(name){delete this[name];}
 pause(){this.paused=true;}
 scrollIntoView(){}
 load(){}
 play(){this.paused=false;return Promise.resolve();}
}
const observation={start:0,end:2,camera:'Fixed frontal full-body shot.',body:'Small continuous weight transfer.',leftHand:'Left hand stays beside waist.',rightHand:'Right hand rises near cheek.',feet:'Left step then grounded feet.',face:'Head remains toward camera.',gaze:'Look toward lens.',expression:'Soft smile.',transition:'Ease into a stable ending pose.',confidence:'medium'};
function setup({signedIn=true,token=async()=> 'session-token',respond,sampleInterval='.5',overrides={}}={}){
 let panel;const calls=[],document={createElement:tag=>new Element(tag),body:new Element('body')};
 const copied=[];
 const context=vm.createContext({document,Blob,File,AbortController,DOMException,setTimeout,clearTimeout,navigator:{clipboard:{writeText:async value=>{copied.push(value);}}},URL:{createObjectURL:()=> 'blob:local',revokeObjectURL:()=>{}},buildMuseMotionPackage,normalizeMotionObservations,buildMotionSocialPackage,planMotionBatches,proposeMotionHighlights,cropMotionAnalysis,mountMuseMotionFinish:()=>({setPlan(){},clear(){}}),
  inspectMotionVideo:async()=>({duration:15,width:1080,height:1920}),validateMotionClip:(range,duration)=>{if(range.start<0||range.duration<2||range.start+range.duration>duration)throw Error('区間が不正');},
  extractMotionFrames:async(_file,{duration,start,onProgress})=>{const frames=Array.from({length:Math.ceil(duration/.5)},(_,i)=>({time:i*.5,dataUrl:`data:image/jpeg;base64,${i}`,sourceTime:start+i*.5}));onProgress({done:frames.length,total:frames.length,bytes:3000,byteLimit:2000000});return frames;},
  analyzeMotionTempo:async()=>({bpm:120,beatTimes:[.1,.6,1.1,1.6],beatStatus:'estimated'}),
  window:{HanakoCloudSync:class{constructor(){this.signedIn=signedIn;this.url='https://cloud.test';this.key='public-key';}getAccessToken(){return token();}}},
  fetch:async(url,options)=>{const body=JSON.parse(options.body);calls.push({url,body,options});return respond?respond(body,options,calls.length):batchResponse(body);},...overrides
 });
 vm.runInContext(source,context);
 context.mountMuseMotion({querySelector:()=>({after:element=>{panel=element;}})},{prepareIdentity:async file=>({blob:new Blob(['photo']),name:file.name})});
 panel.querySelector('#motionSampleInterval').value=sampleInterval;
 return{$:name=>panel.querySelector('#motion'+name),calls,panel,copied,context};
}
function batchResponse(body,rows=[{...observation,start:body.analysisStart,end:body.analysisEnd}],extra={}){return{ok:true,json:async()=>({batchProtocol:1,analysisStart:body.analysisStart,analysisEnd:body.analysisEnd,observations:rows,summary:'参考動作の候補です。',...extra})};}
async function load(ui,{duration=2,start=3}={}){
 ui.$('Video').files=[{name:'reference.mov',size:100,lastModified:1}];await ui.$('Video').onchange();await Promise.resolve();await Promise.resolve();
 ui.$('Identity').files=[{name:'me.jpg'}];await ui.$('Identity').onchange();
 ui.$('Start').value=String(start);ui.$('Duration').value=String(duration);ui.$('Duration').emit('change');
 await ui.$('Prepare').onclick();
}

test('reference frames flow through analysis into half-second MUSE prompts without sending the identity or audio',async()=>{
 const ui=setup();await load(ui);assert.equal(ui.$('Frames').children.length,4);assert.match(ui.$('TempoStatus').textContent,/120 BPM/);
 ui.$('Consent').checked=true;await ui.$('Analyze').onclick();assert.equal(ui.calls.length,1);
 assert.equal(ui.calls[0].url,'https://cloud.test/functions/v1/muse-motion-analyze');assert.deepEqual(Object.keys(ui.calls[0].body).sort(),['analysisEnd','analysisStart','consent','duration','frames','readSoundtrack','referenceStart']);
 assert.deepEqual(ui.calls[0].body.frames.map(frame=>Object.keys(frame).sort()),Array.from({length:4},()=>['image','time']));
 assert.equal(ui.calls[0].body.referenceStart,3);assert.equal(ui.$('Timeline').children.length,1);
 ui.$('Build').onclick();assert.equal(ui.$('Outputs').hidden,false);assert.match(ui.$('Editing').value,/3\.000/);
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
 ui.$('Build').onclick();assert.equal(ui.$('Outputs').hidden,false);assert.match(ui.$('Editing').value,/8\.000/);assert.equal(ui.$('Retry').hidden,true);
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
 assert.ok([...timers.jobs.values()].some(job=>job.delay===540000),'the multi-batch operation has enough time for all bounded requests');
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

const descendants=element=>element.children.flatMap(child=>[child,...descendants(child)]);
const denseExtractor=calls=>async(_file,{duration,start,sampleInterval,onProgress})=>{
 calls.push({duration,start,sampleInterval});
 const frames=Array.from({length:Math.ceil(duration/sampleInterval)},(_,i)=>({time:i*sampleInterval,dataUrl:`data:image/jpeg;base64,dense-${i}`,sourceTime:start+i*sampleInterval}));
 onProgress({done:frames.length,total:frames.length,bytes:frames.length*32000,byteLimit:2000000*.5/sampleInterval,sampleInterval});return frames;
};
function detailedResponse(body,extra={}){
 const rows=body.frames.filter(frame=>frame.time<body.analysisEnd).map((frame,index,anchors)=>{
  const end=anchors[index+1]?.time??body.analysisEnd;
  return{...observation,start:frame.time,end,motionDetails:(body.motionFrames||[]).filter(point=>point.time>frame.time&&point.time<end).map(point=>({time:point.time,motion:`Visible hand arc ${point.time>=5?'LATER_CUT_MARKER':'OPENING_MARKER'}`,confidence:'medium'}))};
 });
 return batchResponse(body,rows,extra);
}

test('the recommended default asks for quarter-second extraction and sends its extra samples with specific consent',async()=>{
 const extracted=[],ui=setup({sampleInterval:'',overrides:{extractMotionFrames:denseExtractor(extracted)}});await load(ui);
 assert.equal(extracted[0].sampleInterval,.25);assert.equal(ui.$('Frames').children.length,4,'the gallery stays on half-second anchors');assert.match(ui.$('DataStatus').textContent,/3\.81 MB以内/);
 await ui.$('Analyze').onclick();assert.equal(ui.calls.length,0,'denser frames still require explicit consent');
 ui.$('Consent').checked=true;await ui.$('Analyze').onclick();assert.equal(ui.calls.length,1);assert.equal(ui.calls[0].body.readSoundtrack,true);
 assert.deepEqual(ui.calls[0].body.frames.map(frame=>frame.time),[0,.5,1,1.5]);assert.deepEqual(ui.calls[0].body.motionFrames.map(frame=>frame.time),[.25,.75,1.25,1.75]);
 assert.deepEqual(ui.calls[0].body.motionFrames.map(frame=>Object.keys(frame).sort()),Array.from({length:4},()=>['image','time']));
 assert.ok(!('identity' in ui.calls[0].body)&&!('audio' in ui.calls[0].body));
});

test('maximum detail retains 240 images across six requests while keeping sixty anchor observations',async()=>{
 const extracted=[],ui=setup({sampleInterval:'0.125',respond:body=>detailedResponse(body),overrides:{inspectMotionVideo:async()=>({duration:40,width:1080,height:1920}),extractMotionFrames:denseExtractor(extracted)}});
 await load(ui,{duration:30,start:0});assert.equal(extracted[0].sampleInterval,.125);assert.equal(ui.$('Frames').children.length,60);
 ui.$('Consent').checked=true;await ui.$('Analyze').onclick();assert.equal(ui.calls.length,6);assert.equal(ui.$('Timeline').children.length,60);
 assert.ok(ui.calls.every(call=>call.body.frames.length<=11&&call.body.motionFrames.length===30));
 const anchors=[...new Set(ui.calls.flatMap(call=>call.body.frames.map(frame=>frame.time)))],context=ui.calls.flatMap(call=>call.body.motionFrames.map(frame=>frame.time));
 assert.equal(anchors.length,60);assert.equal(context.length,180);assert.equal(new Set(context).size,180);
 assert.deepEqual([...anchors,...context].sort((a,b)=>a-b),Array.from({length:240},(_,i)=>i*.125));
 assert.match(ui.$('DataStatus').textContent,/40枚（補助30枚）.*240枚/);assert.match(ui.$('BatchStatus').textContent,/6 \/ 6/);
 const micro=descendants(ui.$('Timeline')).filter(element=>element.tagName==='TEXTAREA'&&element['aria-label']==='半秒の間の補助観察');
 assert.equal(micro.length,60);assert.ok(micro.every(element=>element.readOnly));assert.ok(micro.every(element=>!element.disabled),'read-only intermediate evidence must remain selectable after parsing');assert.match(micro[0].value,/0\.125秒.*Visible hand arc/);assert.match(micro.at(-1).value,/29\.875秒/);
});

test('changing sample density clears partial consent and cache before a different-density retry',async()=>{
 let fail=true;const extracted=[],ui=setup({sampleInterval:'0.125',overrides:{extractMotionFrames:denseExtractor(extracted)},respond:body=>body.analysisStart===4&&fail?(fail=false,{ok:false,json:async()=>({error:'temporary issue'})}):detailedResponse(body)});
 await load(ui,{duration:12});ui.$('Consent').checked=true;await ui.$('Analyze').onclick();assert.equal(ui.calls.length,2);assert.equal(ui.$('Retry').hidden,false);
 assert.equal(ui.calls[0].body.motionFrames.length,24);ui.$('SampleInterval').value='0.25';ui.$('SampleInterval').emit('change');
 assert.equal(ui.$('Consent').checked,false);assert.equal(ui.$('Retry').hidden,true);assert.equal(ui.$('Frames').children.length,0);assert.equal(ui.$('Timeline').children.length,0);
 await ui.$('Analyze').onclick();assert.equal(ui.calls.length,2,'old consent cannot authorize a changed preparation');
 await ui.$('Prepare').onclick();ui.$('Consent').checked=true;await ui.$('Analyze').onclick();
 assert.deepEqual(extracted.map(value=>value.sampleInterval),[.125,.25]);assert.deepEqual(ui.calls.map(call=>call.body.analysisStart),[0,4,0,4,8]);
 assert.equal(ui.calls[2].body.motionFrames.length,8);assert.equal(ui.$('Timeline').children.length,24);
});

test('read-only intermediate observations remain selectable while later batches are still processing',async t=>{
 const pending=deferred(),ui=setup({sampleInterval:'0.125',overrides:{extractMotionFrames:denseExtractor([])},respond:(body,_options,count)=>count===2?pending.promise:detailedResponse(body)});t.after(()=>ui.$('Cancel').onclick());
 await load(ui,{duration:12});ui.$('Consent').checked=true;const run=ui.$('Analyze').onclick();await turn();
 const micro=descendants(ui.$('Timeline')).filter(element=>element.tagName==='TEXTAREA'&&element['aria-label']==='半秒の間の補助観察');assert.equal(micro.length,8);assert.ok(micro.every(element=>element.readOnly&&!element.disabled));
 const editable=ui.$('Timeline').querySelectorAll('input,textarea:not([readonly]),button');assert.ok(editable.length>0);assert.ok(editable.every(element=>element.disabled));
 await assertFinishedAfterCancel(ui,run);assert.ok(micro.every(element=>!element.disabled));
});

test('a cancelled dense request cannot populate the later density cache or music label',async t=>{
 const pending=deferred(),extracted=[],ui=setup({sampleInterval:'0.125',overrides:{extractMotionFrames:denseExtractor(extracted)},respond:(body,_options,count)=>count===2?pending.promise:detailedResponse(body)});t.after(()=>ui.$('Cancel').onclick());
 await load(ui,{duration:12});ui.$('Consent').checked=true;const old=ui.$('Analyze').onclick();await turn();assert.equal(ui.calls.length,2);await assertFinishedAfterCancel(ui,old);
 ui.$('SampleInterval').value='0.25';ui.$('SampleInterval').emit('change');await ui.$('Prepare').onclick();ui.$('Consent').checked=true;await ui.$('Analyze').onclick();
 const count=ui.calls.length,notes=ui.$('Timeline').children.length;
 pending.resolve(detailedResponse(ui.calls[1].body,{soundtrack:{title:'STALE SONG',artist:'OLD ARTIST',confidence:'high'}}));await turn();
 assert.equal(ui.calls.length,count);assert.equal(ui.$('Timeline').children.length,notes);assert.equal(ui.$('MusicTitle').value,'');assert.equal(ui.$('MusicArtist').value,'');
});

test('dense extraction gets a bounded longer deadline while releasing the form and consent after timeout',async t=>{
 const timers=fakeTimers(),ui=setup({sampleInterval:'0.125',overrides:{Date:timers.Date,setTimeout:timers.setTimeout,clearTimeout:timers.clearTimeout,extractMotionFrames:()=>new Promise(()=>{})}});t.after(()=>ui.$('Cancel').onclick());
 ui.$('Video').files=[{name:'screen-recording.mov',size:100,lastModified:1}];await ui.$('Video').onchange();const run=ui.$('Prepare').onclick();await turn();
 assert.ok([...timers.jobs.values()].some(job=>job.delay===180000));assert.ok(![...timers.jobs.values()].some(job=>job.delay===90000));
 timers.fire(180000);await run;assert.equal(ui.$('Prepare').disabled,false);assert.equal(ui.$('SampleInterval').disabled,false);assert.equal(ui.$('Consent').checked,false);assert.match(ui.$('StageStatus').textContent,/時間切れ/);assert.equal(timers.jobs.size,0);
});

test('only confident readable soundtrack candidates fill labels and labels survive range changes but not new videos',async()=>{
 const candidate={title:'画面に見えた曲',artist:'表示アーティスト',confidence:'medium'},ui=setup({respond:body=>batchResponse(body,undefined,{soundtrack:candidate})});
 await load(ui);ui.$('Consent').checked=true;await ui.$('Analyze').onclick();assert.equal(ui.$('MusicTitle').value,candidate.title);assert.equal(ui.$('MusicArtist').value,candidate.artist);assert.match(ui.$('MusicStatus').textContent,/候補.*確認/);
 ui.$('Start').value='4';ui.$('Start').emit('change');assert.equal(ui.$('MusicTitle').value,candidate.title);assert.equal(ui.$('MusicArtist').value,candidate.artist);
 ui.$('Video').files=[{name:'another.mov',size:100,lastModified:2}];await ui.$('Video').onchange();assert.equal(ui.$('MusicTitle').value,'');assert.equal(ui.$('MusicArtist').value,'');assert.match(ui.$('MusicStatus').textContent,/未確認/);
});

test('uncertain, empty or malformed soundtrack metadata cannot invent a song label',async()=>{
 for(const soundtrack of [undefined,null,{title:'Guess',artist:'Guess',confidence:'low'},{title:'Guess',confidence:'unverified'},{title:' ',artist:'\n',confidence:'high'},{title:{guess:'not a title'},artist:['not an artist'],confidence:'high'}]){
  const ui=setup({respond:body=>batchResponse(body,undefined,{soundtrack})});await load(ui);ui.$('Consent').checked=true;await ui.$('Analyze').onclick();
  assert.equal(ui.$('MusicTitle').value,'');assert.equal(ui.$('MusicArtist').value,'');assert.match(ui.$('MusicStatus').textContent,/未確認/);
 }
});

test('manually edited music labels and cleared fields are never overwritten by resumed or cached AI results',async()=>{
 let fail=true;const ui=setup({respond:body=>body.analysisStart===4&&fail?(fail=false,{ok:false,json:async()=>({error:'temporary'})}):batchResponse(body,undefined,{soundtrack:{title:'AI label',artist:'AI artist',confidence:'high'}})});
 await load(ui,{duration:12});ui.$('Consent').checked=true;await ui.$('Analyze').onclick();assert.equal(ui.$('MusicTitle').value,'AI label');
 ui.$('MusicTitle').value='自分で確認した曲';ui.$('MusicTitle').emit('input');ui.$('MusicArtist').value='';ui.$('MusicArtist').emit('input');
 await ui.$('Retry').onclick();assert.equal(ui.$('MusicTitle').value,'自分で確認した曲');assert.equal(ui.$('MusicArtist').value,'');
 await ui.$('Analyze').onclick();assert.equal(ui.calls.length,4);assert.equal(ui.$('MusicTitle').value,'自分で確認した曲');assert.equal(ui.$('MusicArtist').value,'');assert.match(ui.$('MusicStatus').textContent,/手入力/);
});

test('soundtrack candidates from different batches cannot be combined into a fabricated title-and-artist pair',async()=>{
 const ui=setup({respond:(body,_options,count)=>batchResponse(body,undefined,{soundtrack:count===1?{title:'Song A',artist:'',confidence:'high'}:{title:'Song B',artist:'Artist B',confidence:'high'}})});
 await load(ui,{duration:12});ui.$('Consent').checked=true;await ui.$('Analyze').onclick();assert.equal(ui.$('MusicTitle').value,'Song A');assert.equal(ui.$('MusicArtist').value,'');
});

test('a matching later soundtrack label may complete its missing counterpart without mixing unrelated candidates',async()=>{
 for(const first of [{title:'Song A',artist:'',confidence:'medium'},{title:'',artist:'Artist A',confidence:'medium'}]){
  const ui=setup({respond:(body,_options,count)=>batchResponse(body,undefined,{soundtrack:count===1?first:{title:'Song A',artist:'Artist A',confidence:'high'}})});
  await load(ui,{duration:12});ui.$('Consent').checked=true;await ui.$('Analyze').onclick();assert.equal(ui.$('MusicTitle').value,'Song A');assert.equal(ui.$('MusicArtist').value,'Artist A');
 }
});

test('micro-observations reach MUSE using cut-local seconds while labels never manufacture missing choreography',async()=>{
 const ui=setup({sampleInterval:'0.125',overrides:{extractMotionFrames:denseExtractor([])},respond:body=>detailedResponse(body,{soundtrack:{title:'Identified Song',artist:'Visible Artist',confidence:'high'}})});
 await load(ui,{duration:10,start:3});ui.$('Consent').checked=true;await ui.$('Analyze').onclick();ui.$('Interpolation').value='observed';ui.$('Build').onclick();assert.equal(ui.$('Outputs').hidden,false);
 const second=ui.$('Shots').children[1],prompt=descendants(second).find(element=>element.tagName==='TEXTAREA').value;
 assert.match(prompt,/CUT-local 0\.125s — INTERMEDIATE MOTION/);assert.match(prompt,/Visible hand arc LATER_CUT_MARKER/);assert.match(prompt,/AI estimate from an additional sampled frame/);
 assert.match(prompt,/OBSERVED-ONLY MODE/);assert.match(prompt,/Identified Song/);assert.match(prompt,/Never fill unseen motion from knowledge of a song/);assert.doesNotMatch(prompt,/CUT-local 5\.125s/);
 assert.equal(ui.calls.length,2,'building richer prompts does not issue another paid analysis');
});

async function analysedHighlightUi(){
 const ui=setup({overrides:{inspectMotionVideo:async()=>({duration:60,width:1080,height:1920}),analyzeMotionTempo:async()=>({bpm:120,beatTimes:Array.from({length:60},(_,index)=>index*.5+.25),beatStatus:'estimated'})},respond:body=>batchResponse(body,Array.from({length:Math.ceil((body.analysisEnd-body.analysisStart)*2)},(_,index)=>{const start=body.analysisStart+index*.5;return {...observation,start,end:Math.min(body.analysisEnd,start+.5),gaze:start===5?'Look directly into the lens.':'Look away from camera.',expression:start===5?'A gentle smile.':'Neutral expression.',motionDetails:[{time:start+.25,motion:'Continue the observed hand arc.',confidence:'medium'}]};}))});
 await load(ui,{duration:30,start:3});ui.$('Consent').checked=true;await ui.$('Analyze').onclick();assert.equal(ui.calls.length,6);return ui;
}
function findHighlight(ui,duration=20){ui.$('HighlightDuration').value=String(duration);ui.$('FindHighlights').onclick();const card=ui.$('HighlightChoices').children[0];assert.ok(card,'observed eye contact supplies a candidate');return{card,preview:card.children[2],apply:card.children[3]};}

test('a 20-second highlight rebases cached observations, frames, beats and MUSE source times without another AI request',async()=>{
 const ui=await analysedHighlightUi(),candidate=findHighlight(ui);assert.match(candidate.card.children[0].textContent,/7\.50〜27\.50秒/);candidate.apply.onclick();
 assert.equal(ui.$('Start').value,'7.5');assert.equal(ui.$('Duration').value,'20');assert.equal(ui.$('Consent').checked,false);assert.equal(ui.$('RestoreHighlights').hidden,false);assert.equal(ui.$('Frames').children.length,40);assert.equal(ui.$('Timeline').children.length,40);assert.equal(ui.$('Preview').currentTime,7.5);
 assert.match(ui.$('Frames').children[0].children[0].src,/,9$/,'the first cached image is the original local 4.5s sample');assert.equal(ui.$('Beats').value.split(', ')[0],'0.250');assert.equal(ui.$('Beats').value.split(', ').at(-1),'19.750');
 const micro=descendants(ui.$('Timeline')).find(element=>element['aria-label']==='半秒の間の補助観察');assert.match(micro.value,/0\.250秒/);
 ui.$('NaturalMotion').value='standard';ui.$('NaturalMotion').emit('input');ui.$('Build').onclick();assert.equal(ui.$('Shots').children.length,4);assert.match(ui.$('Editing').value,/source 7\.500–12\.500s/);assert.match(ui.$('MusePrompt').value,/STANDARD DETAIL/);assert.equal(ui.calls.length,6);
 ui.$('RestoreHighlights').onclick();assert.equal(ui.$('Start').value,'3');assert.equal(ui.$('Duration').value,'30');assert.equal(ui.$('Frames').children.length,60);assert.equal(ui.$('Timeline').children.length,60);assert.equal(ui.$('Beats').value.split(', ').at(-1),'29.750');assert.equal(ui.$('RestoreHighlights').hidden,true);
 ui.$('Build').onclick();assert.equal(ui.$('Shots').children.length,6);assert.match(ui.$('Editing').value,/source 3\.000–8\.000s/);assert.equal(ui.calls.length,6,'applying, restoring and rebuilding only reuse local cached evidence');
});

test('switching 15-second and 20-second highlights always crops the original range rather than accumulating offsets',async()=>{
 const ui=await analysedHighlightUi();findHighlight(ui,15).apply.onclick();assert.equal(ui.$('Start').value,'7.5');assert.equal(ui.$('Duration').value,'15');
 findHighlight(ui,20).apply.onclick();assert.equal(ui.$('Start').value,'7.5');assert.equal(ui.$('Duration').value,'20');assert.equal(ui.$('Frames').children.length,40);assert.equal(ui.$('Beats').value.split(', ').length,40);
 ui.$('RestoreHighlights').onclick();assert.equal(ui.$('Start').value,'3');assert.equal(ui.$('Duration').value,'30');assert.equal(ui.calls.length,6);
});

test('editing a cropped hand observation removes stale choices and restore snapshots without discarding the correction',async()=>{
 const ui=await analysedHighlightUi(),old=findHighlight(ui);old.apply.onclick();const field=ui.$('Timeline').children[0].querySelectorAll('textarea')[3];field.value='Keep the corrected right hand beside the shoulder.';field.oninput();
 assert.equal(ui.$('HighlightChoices').children.length,0);assert.equal(ui.$('RestoreHighlights').hidden,true);assert.match(ui.$('HighlightStatus').textContent,/編集を保持/);
 old.apply.onclick();await old.preview.onclick();assert.equal(ui.$('Start').value,'7.5');assert.equal(ui.$('Duration').value,'20');assert.equal(field.value,'Keep the corrected right hand beside the shoulder.');
 findHighlight(ui,15).apply.onclick();ui.$('Build').onclick();assert.match(ui.$('MusePrompt').value,/corrected right hand beside the shoulder/);assert.equal(ui.calls.length,6);
});

test('BPM and explicit beat edits invalidate old candidate actions while keeping user-entered timing',async()=>{
 for(const key of ['Bpm','Beats']){
  const ui=await analysedHighlightUi(),old=findHighlight(ui);old.apply.onclick();ui.$(key).value=key==='Bpm'?'125':'0.125, 0.625, 1.125';ui.$(key).oninput();
  assert.equal(ui.$('HighlightChoices').children.length,0);assert.equal(ui.$('RestoreHighlights').hidden,true);old.apply.onclick();assert.equal(ui.$(key).value,key==='Bpm'?'125':'0.125, 0.625, 1.125');
  findHighlight(ui,15).apply.onclick();ui.$('Build').onclick();assert.match(ui.$('MusePrompt').value,key==='Bpm'?/BPM 125 \(user-entered\)/:/0\.125, 0\.625, 1\.125/);assert.equal(ui.calls.length,6);
 }
});

test('new AI results remove original-range snapshots so later suggestions use the newly analysed range',async()=>{
 const ui=await analysedHighlightUi(),old=findHighlight(ui);old.apply.onclick();ui.$('Consent').checked=true;await ui.$('Analyze').onclick();
 assert.equal(ui.calls.length,10);assert.equal(ui.$('HighlightChoices').children.length,0);assert.equal(ui.$('RestoreHighlights').hidden,true);assert.equal(ui.$('Duration').value,'20');
 const current=findHighlight(ui,20);assert.match(current.card.children[0].textContent,/7\.50〜27\.50秒/);current.apply.onclick();assert.equal(ui.$('Start').value,'7.5');ui.$('RestoreHighlights').onclick();assert.equal(ui.$('Start').value,'7.5');assert.equal(ui.$('Duration').value,'20');
});

test('manual frame, observation and CUT seeks clear a candidate-only playback end boundary',async()=>{
 for(const kind of ['frame','observation','cut']){
  const ui=await analysedHighlightUi(),candidate=findHighlight(ui);await candidate.preview.onclick();assert.equal(ui.$('Preview').currentTime,7.5);
  if(kind==='frame')ui.$('Frames').children[0].onclick();
  if(kind==='observation')ui.$('Timeline').children[0].querySelectorAll('button').find(button=>button.textContent==='この位置を動画で確認').onclick();
  if(kind==='cut'){ui.$('Build').onclick();ui.$('Shots').children[0].querySelectorAll('button').find(button=>button.textContent==='元の参考動画をこのCUTの開始位置へ').onclick();}
  ui.$('Preview').paused=false;ui.$('Preview').currentTime=30;ui.$('Preview').emit('timeupdate');assert.equal(ui.$('Preview').paused,false,'selected range ends at source 33s, not the candidate-only 27.5s boundary');
  ui.$('Preview').currentTime=33;ui.$('Preview').emit('timeupdate');assert.equal(ui.$('Preview').paused,true);
 }
});
