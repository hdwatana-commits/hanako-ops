import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMuseReelPackage,normalizeMuseReferenceUrl} from '../muse-reel-engine.mjs';

test('canonical references allow only Instagram reel links and drop tracking',()=>{
 assert.equal(normalizeMuseReferenceUrl('https://instagram.com/reels/DeEV7smTjlC/?igsh=abc'),'https://www.instagram.com/reel/DeEV7smTjlC/');
 for(const url of ['http://www.instagram.com/reel/DeEV7smTjlC/','https://instagram.com.evil.example/reel/DeEV7smTjlC/','https://user:pw@instagram.com/reel/DeEV7smTjlC/','https://instagram.com:8080/reel/DeEV7smTjlC/','https://instagram.com/p/DeEV7smTjlC/','javascript:alert(1)','https://127.0.0.1/reel/DeEV7smTjlC/'])assert.throws(()=>normalizeMuseReferenceUrl(url),/Instagram/);
});
test('unverified reference is disclosed and outputs do not invent inspected movement',()=>{
 const p=buildMuseReelPackage({referenceUrls:['https://www.instagram.com/reel/DeEV7smTjlC/'],hair:'低めのポニー',outfit:'赤いカーディガン',location:'窓辺のカフェ',motionNotes:'2拍目に左手で小さく手を振る'});
 for(const prompt of[p.chatgptPrompt,p.musePrompt]){assert.match(prompt,/内容は未確認/);assert.match(prompt,/低めのポニー/);assert.match(prompt,/赤いカーディガン/);assert.match(prompt,/窓辺のカフェ/);assert.match(prompt,/2拍目に左手/);assert.match(prompt,/完全再現は保証せず/);assert.match(prompt,/音源/);}
 assert.equal(p.config.referenceStatus,'unverified');assert.ok(p.manifest.some(a=>a.role==='identity'));assert.ok(p.manifest.every(a=>typeof a.label==='string'));
});
test('observed status requires explicit user observations rather than trusting a URL',()=>{
 assert.throws(()=>buildMuseReelPackage({referenceStatus:'observed'}),/確認メモ/);
 const p=buildMuseReelPackage({referenceStatus:'observed',observations:'0〜2秒は右へ振り向く',timelineNotes:'3秒で微笑む'});
 assert.match(p.musePrompt,/OPSによる動画確認・解析ではない/);assert.match(p.musePrompt,/ユーザー確認メモ・時間別の動きを最優先/);
});
test('short and long plans are contiguous, bounded and preserve full requested duration',()=>{
 for(const duration of[8,15,20,30,60])for(const bpm of[null,40,93,120,240]){
  const p=buildMuseReelPackage({duration,bpm});assert.equal(p.shots[0].start,0);assert.equal(p.shots.at(-1).end,duration);
  const files=new Set();for(let i=0;i<p.shots.length;i++){const s=p.shots[i];assert.ok(s.duration>0&&s.duration<=8.001);assert.ok(Math.abs(s.end-s.start-s.duration)<.0011);if(i)assert.equal(s.start,p.shots[i-1].end);assert.ok(!files.has(s.startFrame));files.add(s.startFrame);}
  assert.equal(p.manifest.filter(m=>m.role.startsWith('keyframe-')).length,p.shots.length*2);
  assert.match(p.musePrompt,/一度の生成尺の保証ではない/);assert.match(p.chatgptPrompt,/コラージュや文字を入れない|コラージュは画像に焼き込まない/);
 }
});
test('BPM remains a manual estimate; invalid duration, BPM and excess URLs fail early',()=>{
 const p=buildMuseReelPackage({bpm:120});assert.match(p.musePrompt,/手入力 120 BPM/);assert.match(p.shots[0].beatCue,/音声解析ではない/);
 for(const bpm of[0,NaN,Infinity,241,'no'])assert.throws(()=>buildMuseReelPackage({bpm}),/BPM/);
 assert.throws(()=>buildMuseReelPackage({duration:9}),/長さ/);assert.throws(()=>buildMuseReelPackage({referenceUrls:Array(13).fill('https://instagram.com/reel/DeEV7smTjlC/')}),/12件/);
});
test('returning a ChatGPT result labels it user supplied and gives it precedence',()=>{
 const p=buildMuseReelPackage({chatgptResult:'0〜4秒：左手を一度振る。4〜8秒：目線を戻す。',referenceVideoName:'motion.mov',styleReferenceNames:['outfit.jpg']});
 assert.match(p.musePrompt,/0〜4秒：左手を一度振る/);assert.match(p.musePrompt,/下の仮構成より優先/);assert.match(p.musePrompt,/未確認の主張を検証済みと扱わない/);assert.ok(p.manifest.some(m=>m.role==='motion'&&m.label==='motion.mov'));assert.ok(p.manifest.some(m=>m.role==='style'&&m.label==='outfit.jpg'));
});

test('each cut carries observations, primary reference and complete styling independently',()=>{
 const p=buildMuseReelPackage({duration:30,referenceStatus:'observed',observations:'最初の強拍で右手を上げる',outfit:'ピンクのニット',location:'夕方のカフェ',referenceUrls:['https://instagram.com/reel/DeEV7smTjlC/','https://instagram.com/reel/DdYvlEgRQrj/'],chatgptResult:'4秒で目線を戻す',identityNames:Array.from({length:10},(_,i)=>`本人${i}.jpg`),styleReferenceNames:Array.from({length:10},(_,i)=>`服${i}.jpg`)});
 assert.equal(p.shotPrompts.length,p.shots.length);assert.equal(p.manifest.filter(m=>m.role==='identity').length,10);assert.equal(p.manifest.filter(m=>m.role==='style').length,10);
 for(const [i,prompt]of p.shotPrompts.entries()){
 assert.match(prompt,/最初の強拍で右手を上げる/);assert.match(prompt,/ピンクのニット/);assert.match(prompt,/夕方のカフェ/);assert.match(prompt,/主参考：https:\/\/www.instagram.com\/reel\/DeEV7smTjlC\//);assert.match(prompt,/補助参考：https:\/\/www.instagram.com\/reel\/DdYvlEgRQrj\//);assert.match(prompt,/4秒で目線を戻す/);assert.match(prompt,/下の仮構成より優先/);assert.ok(prompt.includes(p.shots[i].startFrame));
 }
});

test('registered ChatGPT start frames map to their corresponding cuts',()=>{
 const p=buildMuseReelPackage({duration:15,startFrameNames:['hanako-keyframe-2.jpg','hanako-keyframe-3.jpg']});assert.equal(p.shots[0].startFrame,'hanako-keyframe-2.jpg');assert.equal(p.shots[1].startFrame,'hanako-keyframe-3.jpg');assert.ok(p.shotPrompts[0].includes('hanako-keyframe-2.jpg'));
});
