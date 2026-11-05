import test from 'node:test';
import assert from 'node:assert/strict';
import {initialMuseSongs} from '../muse-song-catalog.mjs';
import {buildSongVibe,suggestedVibe,vibePatterns} from '../muse-song-vibe-engine.mjs';
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
