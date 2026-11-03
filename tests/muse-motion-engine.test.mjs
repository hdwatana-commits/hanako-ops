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
      assert.match(shot.referenceMapping, new RegExp(`source ${shot.sourceStart.toFixed(3)}`));
      assert.match(shot.prompt,new RegExp(`ACTION DURATION: exactly ${shot.duration.toFixed(3)} seconds`));
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
  assert.match(plan.shotPrompts[1], /CUT-local 0\.000–0\.500s/);
  assert.match(plan.shots[1].referenceMapping,/output 5\.000–10\.000s \/ source 17\.500–22\.500s/);
  assert.doesNotMatch(plan.shotPrompts[1],/\/ output \d|\/ source \d/);
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
  assert.throws(()=>buildMuseMotionPackage(config({duration:5.01,maxCutDuration:5,observations:[observed(0,5.01)],frameTimes:[0,5]})),/1コマ/);
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

test('natural secondary detail is explicit in every CUT without replacing choreography or the original identity',()=>{
 const standard=buildMuseMotionPackage(config()),delicate=buildMuseMotionPackage(config({naturalMotion:'delicate',hair:'a low ponytail',outfit:'a pink cardigan and pleated skirt'}));
 assert.equal(standard.config.naturalMotion,'standard');assert.equal(delicate.config.naturalMotion,'delicate');
 assert.deepEqual(delicate.shots.map(shot=>[shot.start,shot.end,shot.sourceStart,shot.sourceEnd]),standard.shots.map(shot=>[shot.start,shot.end,shot.sourceStart,shot.sourceEnd]));
 assert.deepEqual(delicate.shots.map(shot=>shot.halfSecondCues),standard.shots.map(shot=>shot.halfSecondCues));
 for(const shot of delicate.shots){assert.match(shot.prompt,/SECONDARY MOTION — SUBORDINATE TO THE SINGLE ACTION SCHEDULE/);assert.match(shot.prompt,/DELICATE DETAIL/);assert.match(shot.prompt,/small plausible delay/);assert.match(shot.prompt,/not an observed action/);assert.match(shot.prompt,/five fingers per intact hand/);assert.match(shot.prompt,/Do not invent a blink, wink, gaze reset or smile/i);assert.match(shot.prompt,/my-photo\.jpg/);assert.match(shot.prompt,/a low ponytail/);assert.match(shot.prompt,/preserve the reference|Preserve the reference/i);}
});

test('observed-only delicate detail leaves unseen hair and garment trajectories unspecified',()=>{
 const plan=buildMuseMotionPackage(config({naturalMotion:'delicate',interpolationMode:'observed'}));
 for(const shot of plan.shots){assert.match(shot.prompt,/OBSERVED-ONLY POLICY/);assert.match(shot.prompt,/Do not direct an unobserved inertial lag or settling sequence/);assert.doesNotMatch(shot.prompt,/let loose hair tips/);assert.match(shot.prompt,/do not invent a blink/i);}
});

test('secondary cloth motion stays off when requested and never adds a skirt to trousers',()=>{
 const plan=buildMuseMotionPackage(config({naturalMotion:'delicate',skirtMotion:false,outfit:'blue jeans and a cotton shirt'}));
 for(const shot of plan.shots){assert.match(shot.prompt,/Enhanced skirt flutter is OFF/);assert.doesNotMatch(shot.prompt,/delicate, visible flutter/);assert.match(shot.prompt,/do not request extra hem movement or add a skirt/);assert.match(shot.prompt,/blue jeans and a cotton shirt/);}
 for(const frame of plan.keyframes){assert.match(frame.prompt,/Enhanced skirt flutter is OFF/);assert.match(frame.prompt,/without adding decorative hem movement/);}
 const skirt=buildMuseMotionPackage(config({naturalMotion:'delicate',outfit:'a pleated skirt'}));
 assert.ok(skirt.shotPrompts.every(prompt=>prompt.includes('Do not add a skirt to a trouser outfit.')));
});

test('secondary dynamics carry through internal joins and keyframes retain the actual observed shape',()=>{
 const plan=buildMuseMotionPackage(config({naturalMotion:'delicate'}));
 for(const shot of plan.shots.slice(0,-1)){assert.match(shot.prompt,/without a reset or forced settling at the out-point/);assert.match(shot.prompt,/INTERNAL CUT: continue the existing movement/);assert.match(shot.prompt,/Continue hair, cloth and hand momentum through an internal CUT/);assert.match(shot.prompt,/allow settling only when the reference actually settles/);}
 for(const frame of plan.keyframes){assert.match(frame.prompt,/SINGLE-FRAME PHYSICAL CONSISTENCY/);assert.match(frame.prompt,/A still image does not demonstrate a motion trajectory/);assert.match(frame.prompt,/preserve its pixels and pose rather than redrawing its hair, cloth or hands/);assert.doesNotMatch(frame.prompt,/allow a delicate, visible flutter/);}
 assert.match(plan.shots[1].keyframeStartPrompt,/CUT_01_LAST_FRAME\.png/);
 assert.equal(plan.shots.at(-1).end,20);
});

test('natural secondary detail accepts only supported modes',()=>{
 for(const naturalMotion of ['dynamic','',false,{},1])assert.throws(()=>buildMuseMotionPackage(config({naturalMotion})),/自然な動き/);
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

test('the requested cut length is retained instead of stretching every cut by equal division',()=>{
 const plan=buildMuseMotionPackage(config({duration:10.3,observations:[observed(0,10.3)],frameTimes:Array.from({length:21},(_,i)=>i*.5)}));
 assert.deepEqual(plan.shots.map(shot=>shot.duration),[5,5,.3]);
 assert.deepEqual(plan.editingManifest.cuts.map(cut=>[cut.outputStart,cut.outputEnd,cut.trimStart,cut.trimEnd]),[[0,5,0,5],[5,10,0,5],[10,10.3,0,.3]]);
 assert.equal(plan.editingManifest.duration,10.3);assert.equal(plan.editingManifest.transition,'cut');assert.equal(plan.editingManifest.fps,30);
 const exact=buildMuseMotionPackage(config({duration:4.2,maxCutDuration:1.4,observations:[observed(0,4.2)],frameTimes:[]}));
 assert.deepEqual(exact.shots.map(shot=>shot.duration),[1.4,1.4,1.4],'floating-point division must not create an empty extra cut');
});

test('native generation duration never doubles the action clock or silently changes playback speed',()=>{
 const plan=buildMuseMotionPackage(config({generationDuration:10}));
 for(const shot of plan.shots){
  assert.equal(shot.duration,5);assert.equal(shot.generationDuration,10);assert.equal(shot.trimStart,0);assert.equal(shot.trimEnd,5);assert.equal(shot.playbackRate,1);
  assert.match(shot.prompt,/ACTION DURATION: exactly 5\.000 seconds/);assert.match(shot.prompt,/ONE CLOCK ONLY/);assert.match(shot.prompt,/generation setting is 10\.000s/);assert.match(shot.prompt,/FIRST 5\.000s/);assert.match(shot.prompt,/not followed by a second performance/);
  assert.doesNotMatch(shot.prompt,/\/ output \d|\/ source \d|CUT-local 0\.000s maps to source/);
 }
 assert.match(plan.editingInstructions,/動作自体が10秒へ引き伸ばされている場合/);assert.match(plan.editingInstructions,/長さだけを根拠に自動加速しません/);
 for(const generationDuration of [0,31,false,'bad'])assert.throws(()=>buildMuseMotionPackage(config({generationDuration})));
 assert.throws(()=>buildMuseMotionPackage(config({generationDuration:3})),/生成尺より長い/);
 assert.equal(buildMuseMotionPackage(config()).config.generationDuration,null,'unsupported service durations cannot be invented');
});

test('adjacent cuts share one sampled boundary estimate instead of choosing conflicting neighbouring poses',()=>{
 const plan=buildMuseMotionPackage(config({duration:10,observations:[observed(0,5,{body:'Lean left with left foot planted.'}),observed(5,10,{body:'Lean right with right foot planted.'})],frameTimes:Array.from({length:20},(_,i)=>i*.5)}));
 const a=plan.shots[0],b=plan.shots[1];assert.equal(a.endBoundary,b.startBoundary);
 assert.equal(a.endBoundary.pose.body,'Lean right with right foot planted.');assert.equal(a.endBoundary.reviewRequired,true);assert.equal(a.endBoundary.basis,'sample-anchored interval estimate');
 assert.match(a.keyframeEndPrompt,/Lean right with right foot planted/);assert.match(b.keyframeStartPrompt,/Lean right with right foot planted/);
 assert.match(a.prompt,/INTERNAL CUT: continue the existing movement/);assert.match(a.prompt,/Do not add deceleration, a neutral stance, a freeze/);
 assert.equal(b.endBoundary.pose,null,'the unsampled final endpoint is not fabricated from the last interval');assert.match(b.keyframeEndPrompt,/endpoint pose is UNKNOWN/);
});

test('later cuts use the actual trimmed video end frame rather than assuming a planned keyframe was rendered',()=>{
 const plan=buildMuseMotionPackage(config());
 for(const [index,shot] of plan.shots.entries()){
  assert.equal(shot.actualEndFrameName,`CUT_${String(index+1).padStart(2,'0')}_LAST_FRAME.png`);assert.equal(shot.referenceClipName,`REFERENCE_CUT_${String(index+1).padStart(2,'0')}.mp4`);
  assert.match(shot.prompt,new RegExp(shot.referenceClipName));
  if(index){assert.equal(shot.actualStartFrom,plan.shots[index-1].actualEndFrameName);assert.match(shot.prompt,/actual LAST DISPLAYED FRAME/);assert.match(shot.prompt,/AFTER trimming/);assert.match(shot.keyframeStartPrompt,/planned end-keyframe alias does not prove/);}
 }
 assert.equal(plan.manifest.filter(row=>row.role==='actual-end-frame').length,4);assert.match(plan.editingInstructions,/計画上のKEYFRAME_END画像は、実動画が同じ姿勢で終わった証拠ではありません/);
});

test('a continuous observation is directed once and later checkpoints continue it without replaying the full dance',()=>{
 const plan=buildMuseMotionPackage(config({duration:5,observations:[observed(0,5)],frameTimes:Array.from({length:10},(_,i)=>i*.5)}));
 const prompt=plan.shots[0].prompt;
 assert.equal((prompt.match(/HALF-SECOND PERFORMANCE CHECKPOINTS/g)||[]).length,1);
 assert.equal((prompt.match(/Reference torso, hips and shoulders:/g)||[]).length,1);
 assert.match(prompt,/continue the SAME action from the preceding checkpoint/);assert.match(prompt,/Follow this list ONCE/);
});

const detail=(time,motion,confidence='medium')=>({time,motion,confidence});

test('intermediate details are bounded, ordered observations inside their main interval',()=>{
 const motionDetails=[detail(.125,'  Right wrist continues upward.  '),detail(.25,'Weight shifts onto the planted left foot.','high'),detail(.375,'Gaze returns toward the lens.','low')];
 const row=normalizeMotionObservations([observed(0,.5,{motionDetails})],{duration:2})[0];
 assert.deepEqual(row.motionDetails,[detail(.125,'Right wrist continues upward.'),motionDetails[1],motionDetails[2]]);
 assert.equal(motionDetails[0].motion,'  Right wrist continues upward.  ','normalization must not mutate the stored observations');
 assert.deepEqual(normalizeMotionObservations([observed(0,2)],{duration:2})[0].motionDetails,[]);
 for(const invalid of [null,{},[detail(0,'At start')],[detail(.5,'At end')],[detail(.25,'A'),detail(.125,'B')],[detail(.25,'A'),detail(.25,'B')],[detail('0.125','A')],[detail(false,'A')],[detail(NaN,'A')],[detail(.125,'')],[detail(.125,'\u0001')],[detail(.125,'a'.repeat(161))],[detail(.125,'A','verified')],Array.from({length:4},(_,i)=>detail(.1+i*.1,'A'))]){
  assert.throws(()=>normalizeMotionObservations([observed(0,.5,{motionDetails:invalid})],{duration:2}));
 }
});

test('details crossing a CUT use one local clock and are never duplicated at either boundary',()=>{
 const plan=buildMuseMotionPackage(config({duration:10,observations:[observed(4.5,5.5,{motionDetails:[detail(4.625,'UNIQUE_WRIST_ARC'),detail(5,'UNIQUE_JOIN_WEIGHT'),detail(5.125,'UNIQUE_EYE_RETURN')]})],frameTimes:[0,4.5,4.625,5,5.125,5.5,9.5],sampleInterval:.125}));
 const first=plan.shots[0].observations.find(row=>row.kind==='provided'),second=plan.shots[1].observations.find(row=>row.kind==='provided');
 assert.deepEqual(first.motionDetails,[{...detail(4.625,'UNIQUE_WRIST_ARC'),cutTime:4.625,sourceTime:17.125}]);
 assert.deepEqual(second.motionDetails,[{...detail(5,'UNIQUE_JOIN_WEIGHT'),cutTime:0,sourceTime:17.5},{...detail(5.125,'UNIQUE_EYE_RETURN'),cutTime:.125,sourceTime:17.625}]);
 assert.match(plan.shots[0].prompt,/CUT-local 4\.625s — INTERMEDIATE MOTION/);assert.match(plan.shots[1].prompt,/CUT-local 0\.000s — INTERMEDIATE MOTION/);assert.match(plan.shots[1].prompt,/CUT-local 0\.125s — INTERMEDIATE MOTION/);
 assert.doesNotMatch(plan.shots[1].prompt,/CUT-local 5\.125s/);
 for(const token of ['UNIQUE_WRIST_ARC','UNIQUE_JOIN_WEIGHT','UNIQUE_EYE_RETURN'])assert.equal(plan.shotPrompts.join('\n').split(token).length-1,1);
 const detailTimes=plan.shots.flatMap(shot=>shot.halfSecondCues.flatMap(cue=>cue.observations.flatMap(row=>row.motionDetails.map(point=>point.time))));
 assert.deepEqual(detailTimes,[4.625,5,5.125]);
});

test('repeating a basic posture never suppresses a different detail inside the next half-second',()=>{
 const plan=buildMuseMotionPackage(config({duration:2,observations:[observed(0,1,{motionDetails:[detail(.125,'FIRST_HAND_ARC'),detail(.625,'SECOND_WEIGHT_SHIFT')]})],frameTimes:[0,.125,.5,.625,1,1.5],sampleInterval:.125}));
 const prompt=plan.shots[0].prompt;
 assert.equal(prompt.split('FIRST_HAND_ARC').length-1,1);assert.equal(prompt.split('SECOND_WEIGHT_SHIFT').length-1,1);
 assert.equal((prompt.match(/Reference torso, hips and shoulders:/g)||[]).length,1);
 assert.match(prompt,/CUT-local 0\.625s — INTERMEDIATE MOTION/);assert.match(prompt,/continue the SAME action/);
 assert.match(prompt,/AI estimate from an additional sampled frame/);
});

test('unsupported intermediate evidence remains unconfirmed even if the caller supplies a high confidence',()=>{
 const plan=buildMuseMotionPackage(config({duration:2,observations:[observed(0,.5,{motionDetails:[detail(.25,'Unverified hand path','high')]})],frameTimes:[0,.5,1,1.5],sampleInterval:.25}));
 assert.match(plan.shots[0].prompt,/unconfirmed intermediate detail; source image not established/);
 assert.ok(plan.warnings.some(message=>message.includes('補助コマを確認できない')));
 assert.doesNotMatch(plan.shots[0].prompt,/AI estimate from an additional sampled frame/);
});

test('inferred natural connections and observed-only directions retain the same source timing and recorded gestures',()=>{
 const input=config({duration:10,observations:[observed(0,.5,{motionDetails:[detail(.125,'Wrist rises along the visible arc.')]})],frameTimes:[0,.125,.5,5,9.5],beatTimes:[.3,5.3],beatStatus:'estimated',sampleInterval:.125});
 const natural=buildMuseMotionPackage({...input,interpolationMode:'natural'}),observedOnly=buildMuseMotionPackage({...input,interpolationMode:'observed'});
 assert.deepEqual(natural.timeline,observedOnly.timeline);
 assert.deepEqual(natural.shots.map(shot=>({start:shot.start,end:shot.end,beatTimes:shot.beatTimes,observations:shot.observations})),observedOnly.shots.map(shot=>({start:shot.start,end:shot.end,beatTimes:shot.beatTimes,observations:shot.observations})));
 assert.match(natural.musePrompt,/NATURAL CONNECTION MODE — INFERRED INTERPOLATION, NOT OBSERVED FACT/);assert.match(natural.musePrompt,/shortest physically plausible continuous connection/);
 assert.match(observedOnly.musePrompt,/OBSERVED-ONLY MODE/);assert.match(observedOnly.musePrompt,/Do not introduce a pose hold or freeze/);assert.doesNotMatch(observedOnly.musePrompt,/NATURAL CONNECTION MODE/);
 for(const plan of [natural,observedOnly]){assert.match(plan.musePrompt,/actual LAST DISPLAYED FRAME/);assert.match(plan.musePrompt,/ACTION DURATION: exactly 5\.000 seconds/);assert.match(plan.musePrompt,/UNKNOWN/);assert.match(plan.musePrompt,/original 1\.0x playback speed/);}
});

test('a song name is unverified metadata and cannot manufacture choreography, BPM, lyrics or beat positions',()=>{
 const input=config({duration:2,observations:[observed(0,2)],frameTimes:[0,.5,1,1.5]});
 const base=buildMuseMotionPackage(input),withLabel=buildMuseMotionPackage({...input,musicTitle:'A song\nlabel',musicArtist:'An artist',sampleInterval:.25});
 assert.equal(withLabel.config.musicTitle,'A song label');assert.equal(withLabel.config.musicArtist,'An artist');assert.equal(withLabel.config.bpm,null);assert.deepEqual(withLabel.config.beatTimes,[]);
 assert.deepEqual(withLabel.observations,base.observations);assert.deepEqual(withLabel.shots[0].observations,base.shots[0].observations);
 assert.match(withLabel.musePrompt,/MUSIC LABEL — UNVERIFIED IDENTIFICATION DATA/);assert.match(withLabel.musePrompt,/A title or artist name does not establish this reel's choreography/);assert.match(withLabel.musePrompt,/Never fill unseen motion from knowledge of a song/);assert.match(withLabel.musePrompt,/Do not retrieve, generate or transcribe song audio or lyrics/);
 assert.ok(withLabel.warnings.some(message=>message.includes('曲名だけから')));assert.ok(withLabel.warnings.some(message=>message.includes('詳細動作はまだ取得')));
 assert.match(withLabel.editingInstructions,/曲名は音源の識別だけ/);
});

test('detail sampling settings are explicit and do not claim an unrequested mode',()=>{
 const standard=buildMuseMotionPackage(config());assert.equal(standard.config.sampleInterval,.5);assert.equal(standard.config.interpolationMode,'natural');assert.equal(standard.config.musicTitle,'');
 for(const sampleInterval of [.5,.25,.125])assert.equal(buildMuseMotionPackage(config({sampleInterval})).config.sampleInterval,sampleInterval);
 for(const sampleInterval of [.1,0,1,NaN,false])assert.throws(()=>buildMuseMotionPackage(config({sampleInterval})));
 for(const interpolationMode of ['official','music-guessed','',false])assert.throws(()=>buildMuseMotionPackage(config({interpolationMode})));
});
