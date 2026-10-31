import test from 'node:test';import assert from 'node:assert/strict';
import {initialMuseSongs} from '../muse-song-catalog.mjs';
import {normalizeSongVersion,normalizeSongLibrary,saveSongVersion,songLibraryView,safeSongSource} from '../muse-song-library.mjs';
import {chooseSongClip} from '../muse-song-analysis.mjs';
test('20 initial candidates have documented sources without invented chorus, BPM or duration',()=>{
 assert.equal(initialMuseSongs.length,20);assert.equal(new Set(initialMuseSongs.map(s=>s.id)).size,20);
 for(const song of initialMuseSongs){assert.ok(song.sources.length);assert.ok(safeSongSource(song.officialUrl));for(const field of ['duration','bpm','chorusStart','chorusEnd'])assert.equal(song[field],null);assert.equal(song.analysisStatus,'unverified');assert.deepEqual(song.beats,[]);assert.equal(chooseSongClip(normalizeSongVersion(song),20).start,null);}
});
test('confirmed chorus survives save and reload without promoting automatic beats to verified',()=>{
 const hash='a'.repeat(64),source={id:'audio-a',label:'購入した原曲',duration:150,chorusStart:39.25,chorusEnd:63,chorusStatus:'verified',verifiedAt:'2026-10-31T05:00:00Z',audioFingerprint:hash,bpm:120,rhythmStatus:'auto-review',beats:[{time:39.3,strength:.8}]};
 const stored=JSON.parse(JSON.stringify(saveSongVersion({},initialMuseSongs[0].id,source))),song=songLibraryView(initialMuseSongs,stored)[0],v=song.versions.at(-1),clip=chooseSongClip(v,20);
 assert.equal(v.chorusStatus,'verified');assert.equal(v.rhythmStatus,'auto-review');assert.equal(v.downbeatStatus,'unverified');assert.equal(clip.status,'verified');assert.equal(clip.start,39.25);assert.equal(clip.end,59.25);assert.equal(v.audioFingerprint,hash);
});
test('unbounded manual metadata or a forged verified flag never becomes trusted timing',()=>{
 for(const values of[{chorusStart:null,chorusEnd:null},{chorusStart:0,chorusEnd:9999},{chorusStart:30,chorusEnd:20}]){const v=normalizeSongVersion({...values,duration:100,chorusStatus:'verified'});assert.equal(v.chorusStatus,'unverified');assert.equal(v.chorusStart,null);}
 assert.equal(normalizeSongVersion({duration:100,chorusStart:20,chorusEnd:40,chorusStatus:'verified',verifiedAt:'today'}).chorusStatus,'unverified');
});
test('metadata serialization drops audio, credentials and arbitrary payloads while keeping versions distinct',()=>{
 let state=saveSongVersion({},'song',{id:'a',duration:100,chorusStart:20,chorusEnd:40,audio:'BASE64',blob:{data:'AUDIO'},sourceUrl:'https://user:secret@example.com',recommendedClips:{junk:'AUDIO'}});state=saveSongVersion(state,'song',{id:'b',duration:100,chorusStart:10,chorusEnd:25});
 const saved=normalizeSongLibrary(state),serialized=JSON.stringify(saved);assert.equal(saved.versions.song.length,2);assert.ok(!serialized.includes('BASE64'));assert.ok(!serialized.includes('AUDIO'));assert.ok(!serialized.includes('secret'));assert.equal(saved.versions.song[0].chorusStart,20);assert.equal(saved.versions.song[1].chorusStart,10);
});
test('hidden seeds restore without destroying their version cache',()=>{let state=saveSongVersion({},initialMuseSongs[0].id,{id:'v',duration:50});state.hiddenIds=[initialMuseSongs[0].id];assert.equal(songLibraryView(initialMuseSongs,state).length,19);state.hiddenIds=[];assert.equal(songLibraryView(initialMuseSongs,state)[0].versions.length,2);});

test('YouTube timing remains a separate, human-confirmed video version without importing beats',()=>{
 const video={id:'youtube-ekr2nIex040',label:'YouTube公式MV版',duration:170,chorusStart:20,chorusEnd:45,chorusStatus:'verified',verifiedAt:'2026-10-31T05:00:00Z',sourceKind:'youtube',youtubeVideoId:'ekr2nIex040',sourceUrl:'https://www.youtube.com/watch?v=ekr2nIex040'};
 const v=normalizeSongVersion(video);assert.equal(v.chorusStatus,'verified');assert.equal(v.audioFingerprint,null);assert.equal(v.sourceKind,'youtube');assert.equal(v.bpm,null);assert.equal(v.rhythmStatus,'unverified');assert.deepEqual(v.beats,[]);assert.equal(normalizeSongVersion({...video,sourceUrl:'https://example.com/watch?v=ekr2nIex040'}).chorusStatus,'unverified');
 const state=saveSongVersion({},initialMuseSongs[0].id,video),song=songLibraryView(initialMuseSongs,state)[0];assert.equal(song.versions[0].chorusStart,null);assert.equal(song.versions[1].chorusStart,20);
});
