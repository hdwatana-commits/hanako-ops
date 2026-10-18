import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze, timeline } from '../reel-engine.mjs';
test('synthetic 120 BPM percussion determines music-dependent cuts', () => {
  const rate = 8000, samples = new Float32Array(rate * 15);
  for (let t = .3; t < 15; t += .5) for (let j = 0; j < 240; j++) samples[Math.round(t * rate) + j] = .8 * Math.exp(-j / 35);
  const result = analyze(samples, rate);
  assert.equal(result.reliable, true);
  assert.ok(Math.abs(result.bpm - 120) <= 4);
  assert.ok(result.peaks.length >= 25);
  const cuts = timeline(15, 'hana', result);
  assert.ok(cuts[1] > 2.2 && cuts[1] < 2.4);
  assert.ok(result.peaks.some(peak => Math.abs(peak.time - cuts[1]) < .001));
  assert.ok(timeline(15, 'pop', result).length > cuts.length);
});
test('silence is not labeled a reliable beat estimate', () => {
  const result = analyze(new Float32Array(120000), 8000);
  assert.equal(result.reliable, false); assert.equal(result.bpm, null);
  assert.ok(timeline(15, 'hana', result).length > 4);
});
test('manual BPM and offset change cuts deterministically', () => {
  assert.deepEqual(timeline(5, 'pop', null, .2, 120), [0, 1.2, 2.2, 3.2, 4.2]);
  assert.ok(timeline(30, 'cinema', null, -1, 50).every(t => t >= 0 && t < 30));
});
