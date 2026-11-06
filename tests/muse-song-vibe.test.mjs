import test from 'node:test';
import assert from 'node:assert/strict';
import {initialMuseSongs} from '../muse-song-catalog.mjs';
import {buildSongVibe,suggestedVibe,vibePatterns,microHipSwayAt} from '../muse-song-vibe-engine.mjs';
import {reelReferenceLibrary,referenceCategories} from '../muse-reference-library.mjs';
const base={song:initialMuseSongs[0],identityName:'MY_IDENTITY.jpg'};
test('all twenty song candidates choose a real pattern without fabricated song timing',()=>{
 assert.equal(initialMuseSongs.length,20);
 for(const song of initialMuseSongs){assert.ok(vibePatterns.includes(suggestedVibe(song)));const out=buildSongVibe({...base,song});assert.match(out.all,/No verified BPM or beat grid/);assert.match(out.all,/Audio interval: unconfirmed/);assert.match(out.editing,/音源開始：未設定/);}
});
test('half-second local schedules cover every selected duration exactly with no doubled clock',()=>{
 for(const duration of [7,10,15,20,30]){const out=buildSongVibe({...base,duration});assert.equal(out.shots[0].start,0);assert.equal(out.shots.at(-1).end,duration);assert.equal(out.shots.reduce((n,s)=>n+s.duration,0),duration);for(const [i,s]of out.shots.entries()){if(i)assert.equal(s.start,out.shots[i-1].end);assert.equal(s.rows[0].start,0);assert.equal(s.rows.at(-1).end,s.duration);for(const [j,r]of s.rows.entries()){assert.equal(r.end-r.start,.5);if(j)assert.equal(r.start,s.rows[j-1].end);}assert.match(s.prompt,/sole authority for facial identity/);assert.match(s.prompt,/do not add one/);assert.match(s.prompt,/No double-length performance/);if(i)assert.match(s.prompt,/Do not reset to the source pose at the cut boundary/);}}
});
test('manual music start maps onto cuts but manual BPM never becomes a verified beat grid',()=>{
 const out=buildSongVibe({...base,duration:20,audioStart:12.5,bpm:120});assert.match(out.shots[1].prompt,/17.50–22.50 seconds/);assert.match(out.all,/NOT a measured beat grid/);assert.match(out.editing,/正確な拍同期は未検証/);
});
test('missing photo, bad duration, invalid pattern and nonfinite tempo or audio offset fail',()=>{
 for(const change of [{identityName:''},{duration:14},{patternId:'bad'},{bpm:'NaN'},{bpm:0},{audioStart:-1},{audioStart:Infinity}])assert.throws(()=>buildSongVibe({...base,...change}));
});
test('explicit patterns produce different gestures and captions without replacing clothes',()=>{
 const outputs=vibePatterns.map(p=>buildSongVibe({...base,patternId:p.id}));assert.equal(new Set(outputs.map(o=>o.caption)).size,vibePatterns.length);assert.match(outputs.find(o=>o.pattern.id==='detail').all,/never invent a bag/);assert.match(outputs.find(o=>o.pattern.id==='cheek').all,/fingers clear of the face/);
});
test('40 observed references have real sources, ordered sample coverage, category and catalog song',()=>{
 assert.equal(reelReferenceLibrary.length,40);assert.equal(new Set(reelReferenceLibrary.map(r=>r.id)).size,40);
 for(const account of ['kjiangmiao','xiaoyingsuny55'])assert.equal(reelReferenceLibrary.filter(r=>r.account===account).length,20);
 for(const r of reelReferenceLibrary){assert.match(r.url,new RegExp('^https://www.instagram.com/'+r.account+'/reel/'));assert.ok(referenceCategories[r.category]);assert.ok(initialMuseSongs.some(s=>s.id===r.songId));assert.equal(r.analysisStatus,'sampled');assert.ok(r.sampleTimes.length>=Math.ceil(r.duration/.5));assert.ok(r.sampleTimes.every(t=>Number.isFinite(t)&&t>=0&&t<=r.duration));assert.ok(r.points.every((p,i)=>p.note&&p.time>=0&&p.time<=r.duration&&(!i||p.time>r.points[i-1].time)));}
});
test('all 40 references generate their own observed timing and source, without substituting source identity',()=>{
 for(const r of reelReferenceLibrary){const out=buildSongVibe({...base,song:initialMuseSongs.find(s=>s.id===r.songId),referenceId:r.id,duration:'reference'});assert.ok(Math.abs(out.shots.at(-1).end-r.duration)<1e-8);assert.match(out.all,/Source: https:\/\/www.instagram.com/);assert.ok(out.all.includes(r.url));assert.ok(out.all.includes(r.points[1].note));assert.match(out.all,/inferred adaptation/);assert.match(out.all,/Do not copy the creator's face/);assert.match(out.all,/No verified BPM or beat grid/);for(const s of out.shots){assert.ok(s.rows.every((row,i)=>row.start>=0&&row.end<=s.duration&&(!i||row.start===s.rows[i-1].end)));assert.equal(s.rows.at(-1).end,s.duration);}}
});
test('multi-cut references stay edit transitions, while requested long outputs hold rather than stretching',()=>{
 const r=reelReferenceLibrary.find(r=>r.category==='montage');const out=buildSongVibe({...base,referenceId:r.id,duration:30});assert.match(out.all,/Do not morph clothes/);assert.match(out.all,/reference has ended/);assert.match(out.all,/do not rescale all movements/);assert.throws(()=>buildSongVibe({...base,duration:'reference'}));assert.throws(()=>buildSongVibe({...base,referenceId:'missing'}));
});
test('micro sway preserves all 40 reference sources and timings, with opt-in constraints in every cut',()=>{
 for(const r of reelReferenceLibrary){const plain=buildSongVibe({...base,referenceId:r.id,duration:'reference'}),micro=buildSongVibe({...base,referenceId:r.id,duration:'reference',hipMode:'micro'});assert.equal(plain.hipMode,'off');assert.doesNotMatch(plain.all,/ADDED MICRO HIP SWAY/);assert.deepEqual(micro.shots.map(s=>[s.start,s.end]),plain.shots.map(s=>[s.start,s.end]));for(const s of micro.shots){assert.match(s.prompt,/ADDED MICRO HIP SWAY MODE/);assert.match(s.prompt,/If seated/);assert.match(s.prompt,/No thrusting/);assert.ok(s.prompt.includes(r.url));assert.match(s.prompt,/NOT an analyzed song tempo/);assert.match(s.prompt,/Keep trousers as trousers/);}assert.equal(micro.shots[0].rows[0].hipSway.from.amplitude,0);assert.equal(micro.shots.at(-1).rows.at(-1).hipSway.to.amplitude,0);}
});
test('micro sway phase carries through cuts at noninteger tempo; fade applies only at full interval ends',()=>{
 const out=buildSongVibe({...base,duration:20,bpm:123,hipMode:'micro'});
 for(let i=1;i<out.shots.length;i++){const before=out.shots[i-1].rows.at(-1).hipSway.to,after=out.shots[i].rows[0].hipSway.from;assert.deepEqual(before,after);assert.equal(after.amplitude,1);assert.notEqual(after.phase,0);}
 assert.equal(microHipSwayAt(.25,{duration:7}).phase,.25);
 assert.match(out.all,/two beats per full cycle/);
});
test('added sway stops when a shorter reference ends and rejects unknown modes',()=>{
 const r=reelReferenceLibrary[0],out=buildSongVibe({...base,referenceId:r.id,duration:20,hipMode:'micro'});
 for(const s of out.shots)for(const row of s.rows)if(s.start+row.start>=r.duration){assert.equal(row.hipSway.from.amplitude,0);assert.match(row.action,/hold still; no added sway/);}
 assert.throws(()=>buildSongVibe({...base,hipMode:'invalid'}));
});
