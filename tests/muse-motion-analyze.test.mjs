import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';

const source = stripTypeScriptTypes(readFileSync(new URL('../supabase/functions/muse-motion-analyze/index.ts', import.meta.url), 'utf8'));
const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZk0AAAAASUVORK5CYII=';
const fields = ['camera', 'body', 'leftHand', 'rightHand', 'feet', 'face', 'gaze', 'expression', 'transition'];
const row = (start = 0, end = 1.5) => ({ start, end, ...Object.fromEntries(fields.map(name => [name, name === 'feet' ? 'Not visible / unconfirmed' : 'Visible pose, gently turn toward the camera.'])), confidence: 'medium' });
const input = () => ({ consent: true, duration: 2, referenceStart: 12, frames: [0, .5, 1, 1.5].map(time => ({ time, image })) });
function worker({ other = false, key = true, result, providerStatus = 200, envExtra = {}, error = null } = {}) {
  let handler; const calls = [];
  const env = { SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'service', HANAKO_OWNER_USER_ID: 'owner', ...envExtra };
  vm.runInNewContext(source, { Deno: { env: { get: name => env[name] }, serve: fn => { handler = fn; } }, Response, Request, Uint8Array, DataView, TextDecoder, AbortSignal, atob, fetch: async (url, options) => {
    calls.push({ url: String(url), options });
    if (String(url).endsWith('/auth/v1/user')) return Response.json({ id: other ? 'other' : 'owner' });
    if (String(url).endsWith('/hanako_openai_key_read')) return Response.json(key ? 'sk-private-test' : null);
    assert.equal(url, 'https://api.openai.com/v1/responses');
    if (error) throw error;
    return Response.json(providerStatus === 200 ? (result || { output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ summary: '向きを変える動きの候補です。', observations: [row()] }) }] }] }) : { error: { message: 'secret provider details sk-do-not-return' } }, { status: providerStatus });
  } });
  return { handler, calls };
}
function request(body = input(), headers = {}) { return new Request('https://function.test', { method: 'POST', headers: { Authorization: 'Bearer owner-session', 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) }); }
const paid = w => w.calls.filter(call => call.url.includes('api.openai.com'));

test('motion analysis requires owner authentication before inspecting frames or reading the key', async () => {
  const anonymous = worker();
  assert.equal((await anonymous.handler(new Request('https://f.test', { method: 'POST' }))).status, 401);
  assert.equal(anonymous.calls.length, 0);
  const other = worker({ other: true });
  assert.equal((await other.handler(request())).status, 403);
  assert.equal(other.calls.length, 1);
});

test('motion analysis requires specific frame consent and rejects identities, URLs and malformed clips before paid requests', async () => {
  const invalid = [
    { ...input(), consent: false }, { ...input(), identity: image }, { ...input(), duration: 31 }, { ...input(), referenceStart: 599 },
    { ...input(), frames: [{ time: 0, image: 'https://example.test/private.jpg' }, { time: 1.5, image }] },
    { ...input(), frames: [{ time: 0, image }, { time: 0, image }] },
    { ...input(), frames: [{ time: 0, image }, { time: 1.5, image: 'data:image/svg+xml;base64,PHN2Zy8+' }] },
    { ...input(), frames: [0, .5, 1, 1.5].map(time => ({ time, image, sourceTime: time })) },
    { ...input(), frames: [0, .5, 1, 1.5].map(time => ({ time, image: 'data:image/jpeg;base64,aGVsbG8=' })) },
  ];
  for (const body of invalid) { const w = worker(); assert.equal((await w.handler(request(body))).status, 400); assert.equal(paid(w).length, 0); }
  const w = worker(); assert.equal((await w.handler(request(input(), { 'Content-Type': 'video/mp4' }))).status, 415); assert.equal(paid(w).length, 0);
});

test('motion analysis bounds the body and image dimensions before model invocation', async () => {
  const large = worker();
  assert.equal((await large.handler(request(input(), { 'Content-Length': String(6 * 1024 * 1024) }))).status, 413);
  assert.equal(paid(large).length, 0);
  const bytes = Buffer.from(image.split(',')[1], 'base64'); bytes.writeUInt32BE(1024, 16);
  const dimensions = worker(); const body = input(); body.frames[0].image = 'data:image/png;base64,' + bytes.toString('base64');
  assert.equal((await dimensions.handler(request(body))).status, 400); assert.equal(paid(dimensions).length, 0);
  const streamed = worker(); const oversized = { ...input(), ignored: 'x'.repeat(5 * 1024 * 1024) };
  assert.equal((await streamed.handler(request(oversized))).status, 413); assert.equal(paid(streamed).length, 0);
});

test('motion analysis uses only timed reference frames, a protected key and a strict schema with storage disabled', async () => {
  const w = worker(); const response = await w.handler(request()); const body = await response.json();
  assert.equal(response.status, 200); assert.equal(body.observations[0].start, 0); assert.equal(body.observations[0].end, 1.5);
  assert.deepEqual(body.frameTimes, [0, .5, 1, 1.5]); assert.equal(body.referenceStart, 12); assert.equal(body.review_required, true); assert.equal(body.audio_analyzed, false);
  assert.equal(body.source, 'sampled_frames_ai'); assert.equal(body.key, undefined); assert.equal(body.frames, undefined);
  const call = paid(w)[0], payload = JSON.parse(call.options.body);
  assert.equal(call.options.headers.Authorization, 'Bearer sk-private-test'); assert.equal(payload.store, false); assert.equal(payload.model, 'gpt-5.5');
  assert.equal(payload.text.format.type, 'json_schema'); assert.equal(payload.text.format.strict, true); assert.equal(payload.text.format.schema.additionalProperties, false);
  assert.equal(payload.input[0].content.filter(item => item.type === 'input_image').length, 4);
  assert.ok(payload.input[0].content.filter(item => item.type === 'input_image').every(item => item.image_url === image && item.detail === 'low'));
  assert.match(payload.instructions, /untrusted reference content/); assert.match(payload.instructions, /anatomical left\/right/); assert.match(payload.instructions, /No audio is provided/);
  assert.ok(!w.calls.some(call => /storage\/|hanako_auto|\/files/.test(call.url)));
});

test('motion analysis supports the existing key fallback and configured model without client key exposure', async () => {
  const w = worker({ key: false, envExtra: { OPENAI_API_KEY: 'sk-env-test', OPENAI_TEXT_MODEL: 'configured-model', MUSE_MOTION_MODEL: 'motion-model' } });
  const status = await (await w.handler(request({ action: 'status' }))).json();
  assert.equal(status.configured, true); assert.equal(status.model, 'motion-model'); assert.equal(paid(w).length, 0);
  assert.equal((await w.handler(request())).status, 200); assert.equal(JSON.parse(paid(w)[0].options.body).model, 'motion-model');
});

test('motion analysis rejects overlapping, unsupported, out-of-range or overprecise observations rather than inventing corrections', async () => {
  const results = [
    { summary: '', observations: [row(0, 1), row(.5, 1.5)] },
    { summary: '', observations: [row(0, 3)] },
    { summary: '', observations: [row(.22, 1.5)] },
    { summary: '', observations: [{ ...row(), confidence: 'verified' }] },
    { summary: '', observations: [{ ...row(), expression: '' }] },
    { summary: '', observations: [{ ...row(), bpm: 120 }] },
    { summary: '', observations: [] },
  ];
  for (const value of results) { const w = worker({ result: { output_text: JSON.stringify(value) } }); assert.equal((await w.handler(request())).status, 422); assert.equal(paid(w).length, 1); }
});

test('motion analysis returns useful quota, no-key, timeout and incomplete-result errors without provider secrets or automatic retries', async () => {
  const noKey = worker({ key: false }); assert.equal((await noKey.handler(request())).status, 503); assert.equal(paid(noKey).length, 0);
  const quota = worker({ providerStatus: 429 }); const q = await quota.handler(request()); assert.equal(q.status, 429); assert.match((await q.json()).error, /利用上限/); assert.equal(paid(quota).length, 1);
  const rejected = worker({ providerStatus: 401 }); const r = await rejected.handler(request()); assert.equal(r.status, 502); assert.doesNotMatch(JSON.stringify(await r.json()), /sk-do-not-return/);
  const timeout = worker({ error: new DOMException('late', 'TimeoutError') }); assert.match((await (await timeout.handler(request())).json()).error, /タイムアウト/); assert.equal(paid(timeout).length, 1);
  const incomplete = worker({ result: { status: 'incomplete' } }); assert.equal((await incomplete.handler(request())).status, 422); assert.equal(paid(incomplete).length, 1);
});
