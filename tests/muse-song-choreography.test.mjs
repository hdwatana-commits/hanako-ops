import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSongDancePackage} from '../muse-song-choreography.mjs';
const song={id:'song-a',title:'曲A',artist:'歌手',movementFamily:'cute'};
test('unknown chorus stays null and is explicitly provisional',()=>{
 const p=buildSongDancePackage({song,duration:20});assert.equal(p.status,'unverified');
 for(const s of p.shots){assert.equal(s.audioStart,null);assert.equal(s.audioEnd,null);assert.match(s.promptEnglish,/UNKNOWN \/ UNKNOWN/);assert.match(s.promptEnglish,/provisional movement proposal/);assert.equal(s.beatTimes.length,0);}
 assert.match(p.editingInstructions,/未確認/);assert.match(p.chatgptPrompt,/サビ秒数・拍を仮の値で埋めない/);
});
test('all supported durations have contiguous bounded cuts and frame continuity',()=>{
 for(const duration of[10,15,20,30])for(const maxClipDuration of[3,5,8]){
 const p=buildSongDancePackage({song,duration,maxClipDuration,clip:{start:12.5,end:12.5+duration,status:'verified'},version:{duration:200}});assert.equal(p.shots[0].start,0);assert.equal(p.shots.at(-1).end,duration);
 for(const [i,s]of p.shots.entries()){assert.ok(s.duration>0&&s.duration<=maxClipDuration+.001);assert.ok(Math.abs(s.audioStart-(12.5+s.start))<.001);assert.ok(Math.abs(s.audioEnd-(12.5+s.end))<.001);if(i){assert.equal(s.start,p.shots[i-1].end);assert.equal(s.startFrame,p.shots[i-1].endFrame);assert.equal(p.keyframes[i*2].reuseFrom,p.shots[i-1].endFrame);}}
 assert.match(p.shots[0].eye,/first 0.8 seconds/);assert.match(p.shots.at(-1).expression,/shy smile/);assert.match(p.editingInstructions,new RegExp(`合計${duration}秒`));
 }
});
test('actual audio onsets are mapped from exact-version time into clip-local and video time',()=>{
 const p=buildSongDancePackage({song,duration:10,clip:{start:12,end:22,status:'auto-review'},version:{bpm:120,beats:[{time:11.9},{time:12.25,strength:.8},{time:17.5,strength:.6},{time:22.1}],accents:[{time:13,strength:1}]}});
 assert.deepEqual(p.shots[0].beatTimes.map(b=>[b.audioTime,b.videoTime,b.localTime]),[[12.25,.25,.25]]);assert.deepEqual(p.shots[1].beatTimes.map(b=>[b.audioTime,b.videoTime,b.localTime]),[[17.5,5.5,.5]]);assert.equal(p.shots[0].accentTimes[0].localTime,1);assert.match(p.shots[0].promptEnglish,/not verified bar downbeats/);assert.match(p.shots[0].promptEnglish,/user review required/);
});
test('songs vary original movements reproducibly and motion family changes the character',()=>{
 const a=buildSongDancePackage({song,duration:15}),b=buildSongDancePackage({song:{...song,id:'song-b'},duration:15}),c=buildSongDancePackage({song:{...song,movementFamily:'sharp'},duration:15});assert.deepEqual(a.shots,buildSongDancePackage({song,duration:15}).shots);assert.notDeepEqual(a.shots.map(s=>s.feet),b.shots.map(s=>s.feet));assert.notDeepEqual(a.shots.map(s=>s.rightHand),c.shots.map(s=>s.rightHand));
});
test('reference mode requires timestamped source observations and labels them user supplied',()=>{
 assert.throws(()=>buildSongDancePackage({song,duration:15,choreography:'reference'}),/時刻付き/);assert.throws(()=>buildSongDancePackage({song,duration:15,choreography:'reference',referenceUrl:'https://www.instagram.com/reel/abc123/',referenceNotes:'Follow the official dance'}),/時刻付き/);
 const p=buildSongDancePackage({song,duration:15,choreography:'reference',referenceUrl:'https://www.instagram.com/reel/abc123/',referenceNotes:'0-2 seconds: raise the right hand once. 2-5 seconds: hold.'});for(const s of p.shots){assert.match(s.promptEnglish,/confirmed source observations take precedence/);assert.match(s.promptEnglish,/not independently verified official choreography/);assert.match(s.promptEnglish,/raise the right hand once/);}
});
test('invalid audio bounds and unsupported lengths cannot produce a usable package',()=>{
 for(const clip of[{start:42,end:null},{start:-1,end:19},{start:42,end:52}])assert.throws(()=>buildSongDancePackage({song,duration:20,clip}),/区間|開始/);
 assert.throws(()=>buildSongDancePackage({song,duration:20,clip:{start:90,end:110},version:{duration:100}}),/音源の長さ/);assert.throws(()=>buildSongDancePackage({song,duration:60}),/動画尺/);assert.throws(()=>buildSongDancePackage({song,duration:15,bpm:NaN}),/BPM/);
});
