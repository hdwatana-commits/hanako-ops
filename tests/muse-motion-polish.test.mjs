import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMusePolish,polishFrameState,captionSafeBox,layoutMuseCaption,drawMusePolish,trimMuseCutSpecs,assessLoopPixels} from '../muse-motion-polish.mjs';
const normalize=(input,duration=20)=>normalizeMusePolish(input,{duration});

test('beat accents require explicit beat positions and never synthesize a BPM grid',()=>{
 const without=normalize({beatStyle:'sparkle'});assert.equal(without.beatStyle,'none');assert.equal(polishFrameState(without,1).subjectScale,1);
 const config=normalize({beatStyle:'soft',beatTimes:[2,1,2]});assert.deepEqual(config.beatTimes,[1,2]);
 assert.equal(polishFrameState(config,1).pulse,1);assert.equal(polishFrameState(config,1).subjectScale,1);assert.equal(polishFrameState(config,1.5).pulse,0);assert.equal(polishFrameState(config,.8).beatIndex,-1);
 for(let time=0;time<3;time+=.01){const state=polishFrameState(config,time);assert.ok(state.subjectScale>=.985&&state.subjectScale<=1,'contain framing must never enlarge past the full source fit');}
});
test('captions validate the actual output clock, preserve Japanese line breaks and fade at both ends',()=>{
 const config=normalize({caption:{text:'今日の主役は\nこのふわっと感♡',start:.5,end:3,position:'upper',color:'pink'}});
 assert.equal(config.caption.text,'今日の主役は\nこのふわっと感♡');assert.equal(polishFrameState(config,.5).captionAlpha,0);assert.equal(polishFrameState(config,.6).captionAlpha,.4999999999999999);assert.equal(polishFrameState(config,1).captionAlpha,1);assert.ok(polishFrameState(config,2.9).captionAlpha<1);assert.equal(polishFrameState(config,3).captionAlpha,0);
 for(const caption of[{text:'x',start:3,end:2},{text:'x',end:21},{text:'x',position:'middle'},{text:'x',color:'red'},{text:'あ'.repeat(61)},{text:4}])assert.throws(()=>normalize({caption}));
 assert.equal(normalize({caption:{text:'  '}}).caption,null);
});
test('caption boxes leave space around the Instagram side and bottom controls',()=>{
 for(const position of['upper','lower']){const box=captionSafeBox(1080,1920,position);assert.ok(box.x>=1080*.08);assert.ok(box.x+box.width<=1080*.84);assert.ok(box.y>1920*.2);assert.ok(box.y+box.height<=1920*.8);}
});
test('canvas captions are outlined and multiline while sparkles remain at the outer sides',()=>{
 const calls=[],ctx={save(){calls.push(['save']);},restore(){calls.push(['restore']);},measureText:text=>({width:Array.from(text).length*60}),strokeText(...args){calls.push(['outline',...args]);},fillText(...args){calls.push(['text',...args]);},beginPath(){},moveTo(x,y){calls.push(['sparkle',x,y]);},lineTo(){},stroke(){calls.push(['stroke']);}};
 drawMusePolish(ctx,1080,1920,normalize({caption:{text:'今日の主役は\nこのスカート♡',start:0,end:3,color:'pink'},beatStyle:'sparkle',beatTimes:[1]}),1);
 assert.equal(calls.filter(call=>call[0]==='outline').length,2);assert.equal(calls.filter(call=>call[0]==='text').length,2);assert.equal(calls.filter(call=>call[0]==='stroke').length,4);assert.equal(ctx.fillStyle,'#ffafd5');
 assert.ok(calls.filter(call=>call[0]==='sparkle').every(call=>call[1]<1080*.08||call[1]>1080*.88));
 const silent=[];drawMusePolish({...ctx,stroke(){silent.push('sparkle');},fillText(){silent.push('caption');}},1080,1920,normalize({}),1);assert.deepEqual(silent,[]);
});
test('all 60 characters and four hard lines fit inside the safe box without dropping text',()=>{
 const ctx={font:'',measureText(text){const size=Number(this.font.match(/([\d.]+)px/)[1]);return{width:Array.from(text).length*size*1.4};}};
 for(const text of['あ'.repeat(54)+'\nい\nう\nえ','あ'.repeat(60),'Ｗ'.repeat(28)+'\n'+ 'Ｗ'.repeat(29)+'\n\n']){
  const caption=normalize({caption:{text,end:3}}).caption,layout=layoutMuseCaption(ctx,caption);
  assert.equal(layout.lines.join(''),caption.text.replaceAll('\n',''),'every glyph must survive line wrapping');assert.ok(layout.lines.length*layout.lineHeight<=layout.availableHeight+.001);assert.ok(layout.lines.every(line=>ctx.measureText(line).width<=layout.maxWidth+.001));assert.ok(layout.y+layout.lines.length*layout.lineHeight<=layout.box.y+layout.box.height);assert.ok(layout.fontSize>0);
 }
});
test('an explicit loop trim consumes a continuous range across CUTs without replaying or stretching',()=>{
 const first={file:{name:'one'},duration:5,inPoint:1,playbackRate:1},second={file:{name:'two'},duration:5,inPoint:2,playbackRate:2},third={file:{name:'three'},duration:5,inPoint:0};
 const trimmed=trimMuseCutSpecs([first,second,third],{start:3,end:12});assert.deepEqual(trimmed.map(shot=>[shot.file.name,shot.inPoint,shot.duration,shot.playbackRate??1]),[['one',4,2,1],['two',2,5,2],['three',0,2,1]]);assert.equal(first.inPoint,1);assert.equal(first.duration,5);
 assert.deepEqual(trimMuseCutSpecs([first,second],{start:5,end:8}).map(shot=>[shot.file.name,shot.inPoint,shot.duration]),[['two',2,3]]);
 for(const range of[{start:-1},{start:3,end:2},{start:0,end:11},{start:0,end:.01}])assert.throws(()=>trimMuseCutSpecs([first,second],range));
});
const pixels=value=>Uint8ClampedArray.from({length:4*4*4},(_,index)=>index%4===3?255:value);
test('loop assessment distinguishes appearance and movement direction and always requires human review',()=>{
 const report=assessLoopPixels({first:pixels(100),last:pixels(100),afterFirst:pixels(105),beforeLast:pixels(95),width:4,height:4});assert.equal(report.status,'candidate');assert.equal(report.appearanceDifference,0);assert.equal(report.motionDifference,0);assert.equal(report.identityVerified,false);assert.equal(report.beatVerified,false);assert.equal(report.requiresReview,true);
 const jump=assessLoopPixels({first:pixels(20),last:pixels(200),afterFirst:pixels(25),beforeLast:pixels(195),width:4,height:4});assert.equal(jump.status,'review');assert.ok(jump.appearanceDifference>.5);
 const opposite=assessLoopPixels({first:pixels(100),last:pixels(100),afterFirst:pixels(80),beforeLast:pixels(80),width:4,height:4});assert.equal(opposite.status,'review');assert.equal(opposite.appearanceDifference,0);assert.ok(opposite.motionDifference>.1);
 assert.throws(()=>assessLoopPixels({first:pixels(1),last:pixels(1),width:4,height:4}));
});
test('invalid beat data fails before media is processed',()=>{
 for(const beatTimes of[[NaN],[Infinity],[-1],[20],['1'],new Array(241).fill(1)])assert.throws(()=>normalize({beatTimes}));
 assert.throws(()=>normalizeMusePolish({}, {duration:Infinity}));assert.throws(()=>normalize({beatStyle:'flash',beatTimes:[1]}));
});
