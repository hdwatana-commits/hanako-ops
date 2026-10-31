import test from 'node:test';
import assert from 'node:assert/strict';
import {initialMuseSongs} from '../muse-song-catalog.mjs';
import {instagramSongObservations,instagramObservationFor} from '../muse-instagram-observations.mjs';
import {buildSongDancePackage} from '../muse-song-choreography.mjs';
import {createMuseSongSetDocuments} from '../scripts/export-muse-song-sets.mjs';
test('all twenty catalog songs have traceable partial Instagram observations, separate from audio metadata',()=>{
 assert.equal(instagramSongObservations.length,20);assert.equal(new Set(instagramSongObservations.map(row=>row.songId)).size,20);
 for(const song of initialMuseSongs){const row=instagramObservationFor(song.id);assert.ok(row);assert.equal(row.observedStatus,'observed-partial');assert.equal(row.timingStatus,'unverified');assert.equal(row.sourceType,'instagram-ui');assert.match(row.referenceUrl,/^https:\/\/www\.instagram\.com\/reel\/[\w-]+\/$/);assert.match(row.audioUrl,/^https:\/\/www\.instagram\.com\/reels\/audio\/\d+\/$/);assert.ok(row.captionEvidence&&row.checkedAt&&row.creativeMotif&&row.stylingProposal);assert.ok(row.poseSamples.length);for(const p of row.poseSamples){assert.ok(p.time>=0&&p.time<row.referenceClipDuration);assert.ok(p.note);}for(const key of['bpm','chorusStart','chorusEnd','beats'])assert.equal(row[key],undefined);assert.equal(song.chorusStart,null);assert.equal(song.bpm,null);}
 assert.equal(instagramObservationFor('custom-song'),null);
});
test('Instagram-inspired sets vary by song and preserve unknown audio timing for every supported duration',()=>{
 const motifs=new Set();
 for(const song of initialMuseSongs){const row=instagramObservationFor(song.id);motifs.add(row.creativeMotif);
  for(const duration of[10,15,20,30]){const set=buildSongDancePackage({song,duration,choreography:'inspired',observedReference:row,styling:row.stylingProposal});assert.equal(set.status,'unverified');assert.equal(set.shots.at(-1).end,duration);
   for(const [i,shot]of set.shots.entries()){assert.equal(shot.audioStart,null);assert.equal(shot.audioEnd,null);assert.match(shot.promptEnglish,/Instagram-inspired ORIGINAL staging/);assert.match(shot.promptEnglish,/NOT the selected original song/);assert.ok(shot.promptEnglish.includes(row.referenceUrl));assert.ok(shot.promptEnglish.includes(row.creativeMotif));assert.ok(shot.promptEnglish.includes(row.stylingProposal.outfit));assert.doesNotMatch(shot.promptEnglish,/[\u3040-\u30ff\u4e00-\u9fff]/);if(i)assert.equal(shot.startFrame,set.shots[i-1].endFrame);}
   assert.notEqual(set.shots[0].motifCue,set.shots.at(-1).motifCue);assert.match(set.editingInstructions,/原曲のサビ位置ではありません/);
  }
 }
 assert.equal(motifs.size,20);
});
test('a reference for a different song cannot be silently reused',()=>{
 assert.throws(()=>buildSongDancePackage({song:initialMuseSongs[1],duration:20,choreography:'inspired',observedReference:instagramSongObservations[0]}),/観察データ/);
});
test('all twenty exported sets contain real source observations without inventing original-song timestamps',()=>{
 const {documents,index}=createMuseSongSetDocuments(instagramSongObservations);assert.equal(documents.length,20);assert.match(index,/検証済みサビ時刻：0曲/);
 for(const doc of documents){assert.equal(doc.result.shots.length,4);assert.equal(doc.referenceCount,1);assert.equal(doc.referenceMode,true);assert.match(doc.content,/2026-10-31/);assert.match(doc.content,/Instagramで部分的に観察/);assert.match(doc.content,/UNKNOWN/);assert.ok(doc.result.keyframes.some(frame=>frame.instruction.includes('Song-specific motif')));}
});
