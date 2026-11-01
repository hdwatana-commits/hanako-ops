import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMuseMotionPackage, normalizeMotionObservations, motionObservationFields } from '../muse-motion-engine.mjs';

const observed = (start, end, extra = {}) => ({ start, end, camera: 'Front-facing medium-full view; fixed camera.', body: 'Shift weight gently to the left, then recenter.', leftHand: 'Keep the left hand beside the waist.', rightHand: 'Lift the right open hand beside the cheek.', feet: 'Take one small step with the left foot; keep the right foot grounded.', face: 'Turn the head toward the camera.', gaze: 'Look into the lens.', expression: 'A small smile becomes a shy grin.', transition: 'Ease into the pose and settle briefly.', confidence: 'medium', summary: '頬の横で手を振る', ...extra });
const config = extra => ({ duration: 20, referenceStart: 12.5, referenceName: 'reference.mov', identityName: 'my-photo.jpg', observations: [observed(0, 20)], analysisStatus: 'auto', frameTimes: Array.from({ length: 41 }, (_, i) => i / 2), ...extra });

test('selected source timing maps to contiguous output cuts, including fractional durations', () => {
  for (const duration of [2, 4.15, 5, 10.3, 20, 29.99, 30]) {
    const plan = buildMuseMotionPackage(config({ duration, observations: [observed(0, duration)], frameTimes: [0, duration] }));
    assert.equal(plan.shots[0].start, 0);
    assert.equal(plan.shots.at(-1).end, duration);
    for (const [i, shot] of plan.shots.entries()) {
      assert.ok(shot.duration > 0 && shot.duration <= 5.001);
      assert.equal(shot.sourceStart, Number((shot.start + 12.5).toFixed(3)));
      assert.equal(shot.sourceEnd, Number((shot.end + 12.5).toFixed(3)));
      assert.match(shot.prompt, new RegExp(`CUT-local 0\\.000s maps to source ${shot.sourceStart.toFixed(3)}`));
      if (i) assert.equal(shot.start, plan.shots[i - 1].end);
    }
  }
});

test('an observation crossing a cut is clipped and retains source and cut-local coordinates', () => {
  const plan = buildMuseMotionPackage(config({ duration: 10, observations: [observed(3, 7)], frameTimes: [] }));
  const first = plan.shots[0].observations.find(row => row.kind === 'provided');
  const second = plan.shots[1].observations.find(row => row.kind === 'provided');
  assert.deepEqual([first.start, first.end, first.cutStart, first.cutEnd, first.sourceStart, first.sourceEnd], [3, 5, 3, 5, 15.5, 17.5]);
  assert.deepEqual([second.start, second.end, second.cutStart, second.cutEnd, second.sourceStart, second.sourceEnd], [5, 7, 0, 2, 17.5, 19.5]);
  assert.match(plan.shotPrompts[1], /CUT 0\.000–2\.000s \/ output 5\.000–7\.000s \/ source 17\.500–19\.500s/);
});

test('unobserved time remains UNKNOWN rather than invented choreography or a claimed official dance', () => {
  const plan = buildMuseMotionPackage(config({ duration: 10, observations: [observed(2, 4)], frameTimes: [] }));
  assert.deepEqual(plan.timeline.map(row => [row.start, row.end, row.kind]), [[0, 2, 'gap'], [2, 4, 'provided'], [4, 10, 'gap']]);
  assert.match(plan.musePrompt, /UNCONFIRMED GAP/);
  assert.match(plan.musePrompt, /No movement was observed/);
  assert.match(plan.musePrompt, /Do not claim to reproduce its choreography/);
  assert.ok(plan.warnings.some(text => text.includes('UNKNOWN')));
  const empty = buildMuseMotionPackage(config({ observations: [], analysisStatus: 'unverified' }));
  assert.equal(empty.timeline.length, 1);
  assert.ok(empty.shots.every(shot => shot.observations.every(row => row.kind === 'gap')));
  assert.match(empty.keyframes[0].prompt, /endpoint pose is UNKNOWN/);
});

test('timestamps reject overlap, invalid values, out-of-range motion and excessive rows', () => {
  for (const rows of [[observed(-1, 2)], [observed(0, 21)], [observed(2, 2)], [observed(3, 2)], [observed(NaN, 3)], [observed(null, 2)], [observed(0, 8), observed(7, 9)], Array.from({ length: 61 }, () => observed(0, 1))]) {
    assert.throws(() => normalizeMotionObservations(rows, { duration: 20 }));
  }
  const sorted = normalizeMotionObservations([observed(10, 20), observed(0, 10)], { duration: 20 });
  assert.deepEqual(sorted.map(row => row.start), [0, 10]);
  const sparse = normalizeMotionObservations([{ start: 0, end: 2, body: 'Hold still.' }], { duration: 2 });
  assert.equal(sparse[0].body, 'Hold still.');
  assert.equal(sparse[0].confidence, 'low');
  assert.match(sparse[0].leftHand, /UNKNOWN/);
});

test('identity, costume and setting accompany every copyable cut without adopting the reference face', () => {
  const plan = buildMuseMotionPackage(config({ hair: 'a low ponytail', outfit: 'a pink cardigan and white skirt', location: 'one sunlit room' }));
  for (const prompt of plan.shotPrompts) {
    assert.match(prompt, /my-photo\.jpg/);
    assert.match(prompt, /reference\.mov/);
    assert.match(prompt, /not the person seen in the motion-reference video/);
    assert.match(prompt, /a low ponytail/);
    assert.match(prompt, /a pink cardigan and white skirt/);
    assert.match(prompt, /one sunlit room/);
    assert.match(prompt, /no identity or facial drift/);
    for (const field of ['Reference camera/framing:', 'Reference torso, hips and shoulders:', 'anatomical LEFT hand:', 'anatomical RIGHT hand:', 'Reference footsteps', 'Reference head/face direction:', 'Reference eye direction:', 'Reference facial expression:', 'acceleration, deceleration']) assert.ok(prompt.includes(field));
  }
  assert.match(plan.chatgptPrompt, /Review the actual attached video and identity image/);
  assert.match(plan.editingInstructions, /手動で添付/);
});

test('start/end keyframe instructions retain continuous poses and do not claim files were generated', () => {
  const plan = buildMuseMotionPackage(config({ duration: 20 }));
  assert.equal(plan.shots.length, 4);
  assert.equal(plan.keyframes.length, 8);
  assert.equal(plan.manifest.filter(row => row.role.startsWith('keyframe')).length, 8);
  assert.equal(plan.shots[0].reuseStartFrom, null);
  for (let i = 1; i < plan.shots.length; i++) {
    assert.equal(plan.shots[i].reuseStartFrom, plan.shots[i - 1].endFrame);
    assert.match(plan.shots[i].keyframeStartPrompt, /reuse an exact copy/);
    assert.ok(plan.shots[i].keyframeStartPrompt.includes(plan.shots[i - 1].endFrame));
  }
  assert.match(plan.keyframePrompt, /No image files have been generated/);
  assert.match(plan.keyframePrompt, /independent image, never a collage/);
  assert.match(plan.musePrompt, /only if the current Meta screen supports/);
  assert.match(plan.musePrompt, /editing target, not a guarantee/);
});

test('mirror mode maps anatomical gestures explicitly while retaining original observations', () => {
  const plan = buildMuseMotionPackage(config({ mirror: true }));
  assert.match(plan.musePrompt, /reference LEFT hand\/foot to the identity subject's RIGHT hand\/foot/);
  assert.match(plan.musePrompt, /Do NOT mirror the camera motion/);
  assert.match(plan.musePrompt, /Camera\/screen-left is not anatomical-left/);
  assert.equal(plan.observations[0].leftHand, 'Keep the left hand beside the waist.');
  assert.equal(plan.observations[0].rightHand, 'Lift the right open hand beside the cheek.');
  assert.match(buildMuseMotionPackage(config()).musePrompt, /ORIGINAL DIRECTION MODE/);
});

test('beat cues are clip-local estimates with no fabricated bar phase or exact sync claim', () => {
  const plan = buildMuseMotionPackage(config({ duration: 10, observations: [observed(0, 10)], frameTimes: [0, 10], bpm: 120, beatTimes: [5.5, 0, 5, 10, { time: 1 }], beatStatus: 'estimated' }));
  assert.deepEqual(plan.shots[0].beatTimes, [0, 1]);
  assert.deepEqual(plan.shots[1].beatTimes, [0, .5, 5]);
  assert.match(plan.shotPrompts[1], /Cue positions in this CUT's local seconds: 0\.000, 0\.500, 5\.000/);
  assert.match(plan.musePrompt, /audio-derived estimates, not verified beats/);
  assert.match(plan.musePrompt, /Downbeats and musical accents are UNKNOWN/);
  assert.match(plan.musePrompt, /Exact synchronization must be checked/);
  const manual = buildMuseMotionPackage(config({ bpm: 100, beatTimes: [1, 2], beatStatus: 'manual' }));
  assert.match(manual.musePrompt, /user-entered timing marks, not detected beats/);
  const missing = buildMuseMotionPackage(config());
  assert.match(missing.musePrompt, /BPM UNKNOWN/);
  assert.match(missing.musePrompt, /No beat positions/);
  for (const beatTimes of [[-1], [20.1], [Infinity]]) assert.throws(() => buildMuseMotionPackage(config({ beatTimes })));
});

test('AI estimates, manual notes and sparse frames stay reviewable and summaries remain separate', () => {
  const auto = buildMuseMotionPackage(config({ frameTimes: [0, 4, 10, 20] }));
  assert.ok(auto.warnings.some(text => text.includes('疎')));
  assert.match(auto.musePrompt, /AI estimates from sampled frames; human review required/);
  assert.equal(auto.observations[0].summary, '頬の横で手を振る');
  assert.ok(!auto.musePrompt.includes('頬の横で手を振る'));
  const manual = buildMuseMotionPackage(config({ analysisStatus: 'manual', observations: [observed(0, 20, { body: '日本語の修正メモ' })] }));
  assert.match(manual.musePrompt, /user-entered observations; not independently verified/);
  assert.ok(manual.warnings.some(text => text.includes('自動英訳しない')));
});

test('input limits reject missing identity, invalid ranges, BPM and unsupported cuts', () => {
  for (const duration of [1.99, 30.01, NaN, null, false]) assert.throws(() => buildMuseMotionPackage(config({ duration })));
  for (const referenceStart of [-1, Infinity, 'bad']) assert.throws(() => buildMuseMotionPackage(config({ referenceStart })));
  for (const bpm of [0, 241, 'bad', false]) assert.throws(() => buildMuseMotionPackage(config({ bpm })));
  for (const maxCutDuration of [0, 5.1, Infinity]) assert.throws(() => buildMuseMotionPackage(config({ maxCutDuration })));
  assert.throws(() => buildMuseMotionPackage(config({ identityName: '' })), /本人画像/);
  assert.equal(motionObservationFields.length, 9);
});

test('every cut has half-second checkpoints with original source time and continuous tempo',()=>{
 for(const duration of [2,10.3,20,30]){
  const plan=buildMuseMotionPackage(config({duration,observations:[observed(0,duration)],frameTimes:[0,duration]}));
  const cues=plan.shots.flatMap(shot=>shot.halfSecondCues);
  assert.equal(cues[0].start,0);assert.equal(cues.at(-1).end,duration);
  for(const [index,cue] of cues.entries()){
   assert.ok(cue.end-cue.start<=.50001);assert.equal(cue.sourceStart,Number((12.5+cue.start).toFixed(3)));
   if(index)assert.equal(cue.start,cues[index-1].end);
  }
  for(const shot of plan.shots){assert.match(shot.prompt,/HALF-SECOND PERFORMANCE CHECKPOINTS/);assert.match(shot.prompt,/original 1\.0x playback speed/);assert.match(shot.prompt,/Do not snap or shift/);}
 }
});

test('skirt flutter follows steps, inertia and gravity without changing clothing or inventing wind',()=>{
 const plan=buildMuseMotionPackage(config({outfit:'A pink pleated skirt'}));
 for(const shot of plan.shots){assert.match(shot.prompt,/delicate, visible flutter/);assert.match(shot.prompt,/inertial lag/);assert.match(shot.prompt,/No added wind/);assert.match(shot.prompt,/original hem length/);assert.match(shot.prompt,/Do not add a skirt to a trouser outfit/);}
 const off=buildMuseMotionPackage(config({skirtMotion:false}));assert.doesNotMatch(off.shotPrompts[0],/delicate, visible flutter/);
});

test('buzz presentation modes preserve all source timing, beat positions and observed movement',()=>{
 const baseline=buildMuseMotionPackage(config({beatTimes:[.3,.8,1.3],beatStatus:'estimated'}));
 for(const buzzMode of ['cute','dynamic']){
  const plan=buildMuseMotionPackage(config({buzzMode,captionNote:'POST_TEXT_ONLY',beatTimes:[.3,.8,1.3],beatStatus:'estimated'}));
  assert.deepEqual(plan.timeline,baseline.timeline);
  assert.deepEqual(plan.shots.map(shot=>({start:shot.start,end:shot.end,observations:shot.observations,halfSecondCues:shot.halfSecondCues,beatTimes:shot.beatTimes})),baseline.shots.map(shot=>({start:shot.start,end:shot.end,observations:shot.observations,halfSecondCues:shot.halfSecondCues,beatTimes:shot.beatTimes})));
  assert.ok(plan.shots.every(shot=>shot.prompt.includes('PRESENTATION PROPOSAL')));
  assert.doesNotMatch(plan.musePrompt,/POST_TEXT_ONLY/);assert.doesNotMatch(plan.chatgptPrompt,/POST_TEXT_ONLY/);assert.match(plan.social.captions[0].fullText,/POST_TEXT_ONLY/);
 }
 assert.ok(baseline.shots.every(shot=>!shot.prompt.includes('PRESENTATION PROPOSAL')));
});
