import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCaptionPlan,validateCaptionCues,activeCaption} from '../reel-captions.mjs';
test('plain supplied lyrics are weighted, bounded, ordered and labeled estimates',()=>{
 const plan=buildCaptionPlan('かわいいね\n春の光と歩いていこう\nまた明日',{duration:15,start:1,end:14});
 assert.equal(plan.basis,'estimate');assert.equal(plan.cues.length,3);assert.equal(plan.cues[0].start,1);assert.equal(plan.cues.at(-1).end,14);
 assert.ok(plan.cues[1].end-plan.cues[1].start>plan.cues[0].end-plan.cues[0].start);
 assert.equal(activeCaption(plan.cues,0),null);assert.equal(activeCaption(plan.cues,14),null);
 assert.equal(activeCaption(plan.cues,plan.cues[1].start).text,'春の光と歩いていこう');
});
test('beats influence estimated boundaries but do not claim recognized singing',()=>{
 const plain=buildCaptionPlan('ひかり\nきらり',{duration:15});
 const beat=buildCaptionPlan('ひかり\nきらり',{duration:15,analysis:{reliable:true,peaks:[{time:7.6}]}});
 assert.equal(plain.cues[0].end,7.5);assert.equal(beat.cues[0].end,7.6);assert.match(beat.message,/認識ではありません/);
});
test('LRC timestamps and empty timed lines preserve explicit subtitle gaps',()=>{
 const plan=buildCaptionPlan('[ar:My music]\n[00:01.00]最初の言葉\n[00:04.00]\n[00:06.25]次の言葉\n[00:12.00]',{duration:15});
 assert.equal(plan.basis,'lrc');assert.deepEqual(plan.cues,[{text:'最初の言葉',start:1,end:4},{text:'次の言葉',start:6.25,end:12}]);assert.equal(activeCaption(plan.cues,5),null);
});
test('full-song LRC subtracts audio start and clips to video range',()=>{
 const plan=buildCaptionPlan('[00:28.00]前からの歌詞\n[00:33.50]ここから\n[00:42.00]終わり',{duration:15,audioStart:30,timeBase:'audio',offset:.5});
 assert.deepEqual(plan.cues,[{text:'前からの歌詞',start:0,end:4},{text:'ここから',start:4,end:12.5},{text:'終わり',start:12.5,end:15}]);
});
test('repeated LRC timestamps can repeat one line',()=>{
 const plan=buildCaptionPlan('[00:01.00][00:08.00]くりかえし\n[00:12.00]',{duration:15});
 assert.equal(plan.cues.length,2);assert.equal(plan.cues[1].start,8);
});
test('overlaps, bad timestamps, excess lines and unsafe ranges are rejected',()=>{
 assert.throws(()=>validateCaptionCues([{text:'a',start:0,end:2},{text:'b',start:1,end:3}],15),/重なって/);
 assert.throws(()=>buildCaptionPlan('[00:99.00]bad',{duration:15}),/LRC/);
 assert.throws(()=>buildCaptionPlan('[00:01]a\n[00:01]b',{duration:15}),/重複/);
 assert.throws(()=>buildCaptionPlan(Array(31).fill('歌詞').join('\n'),{duration:15}),/30行/);
 assert.throws(()=>buildCaptionPlan('あ'.repeat(61),{duration:15}),/60文字/);
 assert.throws(()=>buildCaptionPlan('test',{duration:15,offset:-1}),/動画の外/);
 assert.throws(()=>buildCaptionPlan('[offset:1000]\n[00:01]a',{duration:15}),/offset/);
});
