import test from 'node:test';
import assert from 'node:assert/strict';
import {originalIdentityLock,verifiedIdentityContinuity} from '../muse-identity-lock.mjs';
import {buildMuseMotionPackage} from '../muse-motion-engine.mjs';
import {buildMuseReelPackage} from '../muse-reel-engine.mjs';
import {buildSongDancePackage} from '../muse-song-choreography.mjs';

const assertLock=prompt=>{
 assert.match(prompt,/CRITICAL — ORIGINAL PHOTO IDENTITY LOCK/);
 assert.match(prompt,/PRIMARY FACE SOURCE: ORIGINAL\.jpg/);
 assert.match(prompt,/sole authority for facial identity in EVERY CUT and EVERY FRAME/);
 assert.match(prompt,/Never use an earlier generated face as a new identity baseline/);
 assert.match(prompt,/Natural smiles, blinking, gaze changes, mouth movement and head rotation are allowed/);
 assert.match(prompt,/This identity lock takes priority over style suggestions, buzz presentation, choreography notes and pasted plans/);
 assert.match(prompt,/Attach the SAME ORIGINAL PHOTO again/);
};

test('the first original is primary and derived images never replace it as the face source',()=>{
 const lock=originalIdentityLock(['ORIGINAL.jpg','original-side.jpg']);assertLock(lock);assert.match(lock,/PRIMARY FACE SOURCE wins any conflict/);assert.match(lock,/one image slot/);assert.match(lock,/not just the preceding CUT/);
 const continuity=verifiedIdentityContinuity('END_01.png','START_02.png');assert.match(continuity,/ONLY if the face still matches the original/);assert.match(continuity,/do NOT reuse it unchanged/);assert.match(continuity,/regenerate any affected video CUT/);
});

test('every reference-motion cut and keyframe including reused starts has the original face lock',()=>{
 for(const buzzMode of ['reference','cute','dynamic']){
  const plan=buildMuseMotionPackage({duration:20,identityName:'ORIGINAL.jpg',referenceName:'other-person.mov',buzzMode});
  assert.equal(plan.shots.length,4);
  for(const shot of plan.shots){assertLock(shot.prompt);assertLock(shot.keyframeStartPrompt);assertLock(shot.keyframeEndPrompt);if(shot.index>1){assert.match(shot.prompt,/IDENTITY-CHECKED CONTINUITY/);assert.match(shot.keyframeStartPrompt,/do NOT reuse it unchanged/);}}
  assertLock(plan.chatgptPrompt);assert.match(plan.editingInstructions,/CUT 2以降も毎回/);
 }
});

test('each generic MUSE cut prioritizes the original over returned plans and reference performers',()=>{
 const plan=buildMuseReelPackage({duration:30,identityNames:['ORIGINAL.jpg','original-side.jpg'],chatgptResult:'A user supplied styling plan.'});
 for(const prompt of plan.shotPrompts)assertLock(prompt);assertLock(plan.chatgptPrompt);assertLock(plan.musePrompt);
 assert.match(plan.musePrompt,/元の本人画像/);assert.match(plan.chatgptPrompt,/顔が違う終了画像は次へ引き継がず/);
});

test('music-based cuts and both keyframe phases always anchor facial identity to the original',()=>{
 const plan=buildSongDancePackage({song:{id:'test',title:'Test',artist:'Test',movementFamily:'cute'},duration:20,styling:{identityNames:['ORIGINAL.jpg']}});
 assert.equal(plan.shots.length,4);for(const shot of plan.shots){assertLock(shot.promptEnglish);if(shot.index>1)assert.match(shot.promptEnglish,/ONLY after matching its face directly to the original photo/);}
 for(const frame of plan.keyframes){assert.match(frame.instruction,/顔の最優先基準は元の本人画像 ORIGINAL\.jpg/);if(frame.reuseFrom)assert.match(frame.instruction,/顔がずれていれば、元写真から修正/);}
 assert.match(plan.chatgptPrompt,/元本人画像と顔が一致すると確認/);assert.match(plan.editingInstructions,/元写真から修正/);
});
