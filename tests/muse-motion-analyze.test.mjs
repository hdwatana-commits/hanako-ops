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
function worker({ other = false, key = true, result, providerStatus = 200, envExtra = {}, error = null, intercept, timers } = {}) {
  let handler; const calls = [];
  const env = { SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'service', HANAKO_OWNER_USER_ID: 'owner', ...envExtra };
  vm.runInNewContext(source, { Deno: { env: { get: name => env[name] }, serve: fn => { handler = fn; } }, Response, Request, Uint8Array, DataView, TextDecoder, AbortSignal, AbortController, DOMException, setTimeout: timers?.setTimeout || setTimeout, clearTimeout: timers?.clearTimeout || clearTimeout, atob, fetch: async (url, options) => {
    calls.push({ url: String(url), options });
    const intercepted = intercept?.(String(url), options); if (intercepted !== undefined) return intercepted;
    if (String(url).endsWith('/auth/v1/user')) return Response.json({ id: other ? 'other' : 'owner' });
    if (String(url).endsWith('/hanako_openai_key_read')) return Response.json(key ? 'sk-private-test' : null);
    assert.equal(url, 'https://api.openai.com/v1/responses');
    if (error) throw error;
    return Response.json(providerStatus === 200 ? (result || { output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ summary: '向きを変える動きの候補です。', observations: [row()] }) }] }] }) : { error: { message: 'secret provider details sk-do-not-return' } }, { status: providerStatus });
  } });
  return { handler, calls };
}
function request(body = input(), headers = {}, signal) { return new Request('https://function.test', { method: 'POST', headers: { Authorization: 'Bearer owner-session', 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body), signal }); }
const paid = w => w.calls.filter(call => call.url.includes('api.openai.com'));
const halfRows = (start, end) => Array.from({ length: Math.ceil((end - start) * 2) }, (_, i) => row(start + i / 2, Math.min(end, start + (i + 1) / 2)));
const batchInput = (start = 10, end = 15, duration = 20) => ({ consent: true, duration, referenceStart: 12, analysisStart: start, analysisEnd: end, frames: Array.from({ length: Math.floor((Math.min(end, duration - .5) - start) * 2) + 1 }, (_, i) => ({ time: start + i / 2, image })) });
function clock() {
 const pending = new Map(); let next = 0;
 return { pending, setTimeout(fn, ms) { const id = ++next; pending.set(id, { fn, ms }); return id; }, clearTimeout(id) { pending.delete(id); }, fire(ms) { const found = [...pending].find(([, task]) => task.ms === ms); assert.ok(found, `pending deadline ${ms}`); pending.delete(found[0]); found[1].fn(); } };
}
async function until(predicate) { for (let i = 0; i < 20 && !predicate(); i++) await new Promise(resolve => setImmediate(resolve)); assert.ok(predicate(), 'expected processing stage was reached'); }

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

test('small motion batches retain whole-clip timestamps and a shared boundary frame with bounded output', async () => {
 const w = worker({ result: { output_text: JSON.stringify({ summary: '中盤の動きです。', observations: halfRows(10, 15) }) } });
 const response = await w.handler(request(batchInput())); const body = await response.json();
 assert.equal(response.status, 200); assert.equal(body.analysisStart, 10); assert.equal(body.analysisEnd, 15); assert.equal(body.batchProtocol, 1);
 assert.deepEqual(body.frameTimes, [10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15]);
 assert.equal(body.observations[0].start, 10); assert.equal(body.observations[0].end, 10.5); assert.equal(body.observations.at(-1).end, 15); assert.equal(body.observationProtocol, 2);
 const payload = JSON.parse(paid(w)[0].options.body);
 assert.equal(payload.max_output_tokens, 5000); assert.equal(payload.text.format.schema.properties.observations.maxItems, 10); assert.equal(payload.text.format.schema.properties.observations.minItems, 10);
 assert.match(payload.input[0].content[0].text, /ONLY clip 10 through 15/);
 assert.match(payload.input[0].content[0].text, /Never subtract 10/); assert.equal(paid(w).length, 1);
 const last = worker({ result: { output_text: JSON.stringify({ summary: '終盤の動きです。', observations: halfRows(25, 30) }) } });
 assert.equal((await last.handler(request(batchInput(25, 30, 30)))).status, 200);
});

test('motion batch validation rejects missing, oversized, out-of-window or uncovered frame ranges before paid calls', async () => {
 const base = batchInput();
 const invalid = [
  { ...base, analysisEnd: undefined }, { ...base, analysisStart: -1 }, { ...base, analysisEnd: 17 }, { ...base, analysisEnd: 10.05 },
  { ...base, frames: [{ time: 9.5, image }, ...base.frames] }, { ...base, frames: [...base.frames, { time: 15.5, image }] },
  { ...base, frames: base.frames.slice(1) }, { ...base, frames: base.frames.slice(0, -2) },
  { ...base, frames: Array.from({ length: 15 }, (_, i) => ({ time: 10 + i / 3, image })) },
 ];
 for (const body of invalid) { const w = worker(); const response = await w.handler(request(body)); assert.equal(response.status, 400); assert.equal(paid(w).length, 0); assert.equal((await response.json()).code, 'invalid_input'); }
});

test('motion batch results cannot write into a different chunk or silently retime global seconds', async () => {
 for (const observation of [row(0, 5), row(10, 15.5), row(9.5, 15), row(15, 15.5)]) {
  const w = worker({ result: { output_text: JSON.stringify({ summary: '', observations: [observation] }) } });
  const response = await w.handler(request(batchInput())); const body = await response.json();
  assert.equal(response.status, 422); assert.equal(body.stage, 'result'); assert.equal(body.code, 'invalid_result'); assert.equal(body.retryable, true);
 }
});

test('checkpoint analysis keeps each changing start-frame pose instead of collapsing a dance into one generic interval', async () => {
 const observations = halfRows(10, 15).map((item, index) => ({ ...item, rightHand: `Right palm position ${index}; visible in start frame`, transition: index === 9 ? 'Arrive at shared boundary pose at 15.0s' : `Move toward next visible position ${index + 1}` }));
 const w = worker({ result: { output_text: JSON.stringify({ summary: '時刻ごとの手の位置です。', observations }) } });
 const response = await w.handler(request(batchInput())), result = await response.json();
 assert.equal(response.status, 200); assert.equal(result.observationSemantics, 'start_frame_pose_and_next_frame_transition');
 assert.deepEqual(result.observations.map(item => [item.start, item.end, item.rightHand]), observations.map(item => [item.start, item.end, item.rightHand]));
 assert.equal(result.observations.at(-1).end, 15); assert.ok(!result.observations.some(item => item.start === 15), 'the shared ending image is context, not a duplicated action');
 const payload = JSON.parse(paid(w)[0].options.body), schema = payload.text.format.schema.properties.observations;
 assert.deepEqual(schema.items.properties.start.enum, [10,10.5,11,11.5,12,12.5,13,13.5,14,14.5]);
 assert.deepEqual(schema.items.properties.end.enum, [10.5,11,11.5,12,12.5,13,13.5,14,14.5,15]);
 assert.equal(schema.items.properties.body.maxLength, 140);
 assert.match(payload.instructions, /visual snapshot at the interval START/);
 assert.match(payload.instructions, /not a slideshow of resets/);
 assert.match(payload.input[0].content[0].text, /Do not merge, skip, duplicate or stretch/);
 assert.equal(payload.max_output_tokens, 5000); assert.equal(paid(w).length, 1);
});

test('checkpoint output rejects merged, missing, reordered, duplicated or shifted intervals without retrying a paid request', async () => {
 const complete = halfRows(10, 15);
 const invalid = [
  [row(10, 15)],
  complete.slice(1),
  [complete[1], complete[0], ...complete.slice(2)],
  [complete[0], complete[0], ...complete.slice(2)],
  [{ ...complete[0], start: 10.001 }, ...complete.slice(1)],
  [{ ...complete[0], end: 11 }, ...complete.slice(1)],
  [{ ...complete[0], body: 'x'.repeat(141) }, ...complete.slice(1)],
 ];
 for (const observations of invalid) {
  const w = worker({ result: { output_text: JSON.stringify({ summary: '', observations }) } }), response = await w.handler(request(batchInput()));
  assert.equal(response.status, 422); assert.equal((await response.json()).code, 'invalid_result'); assert.equal(paid(w).length, 1);
 }
});

test('unknown checkpoints remain unknown and a fractional final sample does not stretch or drop the requested duration', async () => {
 const body = { consent: true, duration: 2.05, referenceStart: 12, analysisStart: 0, analysisEnd: 2.05, frames: [0,.5,1,1.5,2].map(time => ({ time, image })) };
 const observations = halfRows(0, 2.05).map(item => ({ ...item, ...Object.fromEntries(fields.map(field => [field, 'Not visible / unconfirmed'])), confidence: 'low' }));
 const w = worker({ result: { output_text: JSON.stringify({ summary: '見えない動作は未確認です。', observations }) } }), response = await w.handler(request(body)), result = await response.json();
 assert.equal(response.status, 200); assert.equal(result.observations.length, 5); assert.equal(result.observations.at(-1).start, 2); assert.equal(result.observations.at(-1).end, 2.05);
 assert.ok(result.observations.every(item => fields.every(field => item[field] === 'Not visible / unconfirmed')));
 assert.match(JSON.parse(paid(w)[0].options.body).instructions, /keep every required checkpoint row with low confidence/);
 const legacy = worker(), oldResult = await (await legacy.handler(request())).json();
 assert.equal(oldResult.observationProtocol, 1); assert.equal(oldResult.observations.length, 1, 'legacy single-request clients still accept interval notes');
});

test('motion output truncation identifies the token limit and does not retry a paid call', async () => {
 const w = worker({ result: { status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' } } });
 const response = await w.handler(request(batchInput())); const body = await response.json();
 assert.equal(response.status, 422); assert.equal(body.code, 'output_limit'); assert.equal(body.stage, 'result'); assert.equal(body.retryable, true); assert.equal(paid(w).length, 1);
});

test('a stalled provider or provider response body releases the batch at its own deadline', async () => {
 for (const bodyOnly of [false, true]) {
  const timers = clock(); const w = worker({ timers, intercept: url => url.includes('api.openai.com') ? (bodyOnly ? { ok: true, text: () => new Promise(() => {}) } : new Promise(() => {})) : undefined });
  const pending = w.handler(request(batchInput())); await until(() => paid(w).length === 1); timers.fire(55000);
  const response = await pending; const result = await response.json();
  assert.equal(response.status, 504); assert.equal(result.code, 'analysis_timeout'); assert.equal(result.stage, 'analysis'); assert.equal(result.retryable, true);
  assert.equal(paid(w)[0].options.signal.aborted, true); assert.equal(paid(w).length, 1); assert.equal(timers.pending.size, 0);
 }
});

test('disconnecting a client cancels the provider wait without a second paid request', async () => {
 const timers = clock(), control = new AbortController();
 const w = worker({ timers, intercept: url => url.includes('api.openai.com') ? new Promise(() => {}) : undefined });
 const pending = w.handler(request(batchInput(), {}, control.signal)); await until(() => paid(w).length === 1); control.abort();
 const response = await pending; const result = await response.json();
 assert.equal(response.status, 499); assert.equal(result.code, 'cancelled'); assert.equal(paid(w)[0].options.signal.aborted, true);
 assert.equal(paid(w).length, 1); assert.equal(timers.pending.size, 0);
});

test('stalled authentication and key response bodies report the actual waiting stage and release without model calls', async () => {
 for (const [suffix, stage] of [['/auth/v1/user', 'authentication'], ['/hanako_openai_key_read', 'connection']]) {
  const timers = clock(), w = worker({ timers, intercept: url => url.endsWith(suffix) ? { ok: true, json: () => new Promise(() => {}) } : undefined });
  const pending = w.handler(request(batchInput())); await until(() => w.calls.some(call => call.url.endsWith(suffix))); timers.fire(10000);
  const response = await pending; const result = await response.json();
  assert.equal(response.status, 504); assert.equal(result.stage, stage); assert.equal(result.code, 'analysis_timeout'); assert.equal(paid(w).length, 0); assert.equal(timers.pending.size, 0);
 }
});

test('a stalled request body is cancelled when input decoding times out', async () => {
 const timers = clock(); let cancelled = false;
 const body = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('{')); }, cancel() { cancelled = true; } });
 const req = new Request('https://function.test', { method: 'POST', headers: { Authorization: 'Bearer owner-session', 'Content-Type': 'application/json' }, body, duplex: 'half' });
 const w = worker({ timers }); const pending = w.handler(req); await until(() => w.calls.length === 1 && [...timers.pending.values()].some(task => task.ms === 10000));
 // The auth response must finish first; only the input stage remains pending.
 await new Promise(resolve => setImmediate(resolve)); timers.fire(10000);
 const response = await pending; const result = await response.json();
 assert.equal(response.status, 504); assert.equal(result.stage, 'input'); assert.equal(cancelled, true); assert.equal(paid(w).length, 0); assert.equal(timers.pending.size, 0);
});

const denseInput=(step=.125)=>{
 const base=batchInput(),motionFrames=[];
 for(let time=base.analysisStart+step;time<base.analysisEnd;time+=step)if(!base.frames.some(frame=>frame.time===time))motionFrames.push({time,image});
 return{...base,motionFrames};
};
const denseRows=body=>halfRows(body.analysisStart,body.analysisEnd).map(item=>({...item,motionDetails:body.motionFrames.filter(frame=>frame.time>item.start&&frame.time<item.end).map(frame=>({time:frame.time,motion:'Right hand arcs upward; weight shifts onto grounded left foot.',confidence:'medium'}))}));

test('dense context retains exact intermediate evidence and global times without changing the half-second primary rows',async()=>{
 for(const step of [.25,.125]){
  const body=denseInput(step),observations=denseRows(body),w=worker({result:{output_text:JSON.stringify({summary:'半秒の間の手の軌道です。',observations})}});
  const response=await w.handler(request(body)),result=await response.json();assert.equal(response.status,200);
  assert.equal(result.observationProtocol,3);assert.equal(result.observationSemantics,'start_frame_pose_with_intermediate_motion_evidence');assert.deepEqual(result.observations,observations);
  assert.deepEqual(result.motionFrameTimes,body.motionFrames.map(frame=>frame.time));assert.equal(result.observations.length,10);assert.equal(result.observations[0].start,10);assert.equal(result.observations.at(-1).end,15);
  const payload=JSON.parse(paid(w)[0].options.body),images=payload.input[0].content.filter(item=>item.type==='input_image'),schema=payload.text.format.schema;
  assert.equal(images.length,body.frames.length+body.motionFrames.length);assert.equal(images.length,step===.125?41:21);assert.equal(payload.max_output_tokens,7000);assert.equal(payload.store,false);
  assert.ok(schema.properties.observations.items.required.includes('motionDetails'));assert.equal(schema.properties.observations.items.properties.motionDetails.maxItems,3);
  assert.equal(schema.properties.observations.items.properties.motionDetails.items.additionalProperties,false);assert.equal(schema.properties.soundtrack,undefined);
  assert.match(payload.instructions,/Song|song/);assert.match(payload.input[0].content[0].text,/Do not infer choreography from song names/);
  const labels=payload.input[0].content.filter(item=>item.type==='input_text').slice(1).map(item=>Number(/clip ([0-9.]+) seconds/.exec(item.text)[1]));assert.deepEqual(labels,[...body.frames,...body.motionFrames].map(frame=>frame.time).sort((a,b)=>a-b));assert.equal(paid(w).length,1);
 }
});

test('malformed or excessive dense context is rejected before reading a provider key or sending paid requests',async()=>{
 const base=denseInput();
 const invalid=[
  {...input(),motionFrames:[]}, {...base,motionFrames:null}, {...base,motionFrames:[{time:10,image}]},
  {...base,motionFrames:[{time:10.1,image}]}, {...base,motionFrames:[{time:15.125,image}]},
  {...base,motionFrames:[{time:10.125,image},{time:10.125,image}]}, {...base,motionFrames:[{time:10.375,image},{time:10.125,image}]},
  {...base,motionFrames:[{time:10.125,image:'https://private.test/frame.jpg'}]},
  {...base,motionFrames:[{time:10.125,image,identity:'private identity'}]},
  {...base,motionFrames:Array.from({length:37},(_,i)=>({time:10+i*.125,image}))},
  {...base,readSoundtrack:'yes'},
 ];
 for(const body of invalid){const w=worker(),response=await w.handler(request(body));assert.equal(response.status,400);assert.equal(paid(w).length,0);assert.ok(!w.calls.some(call=>call.url.endsWith('/hanako_openai_key_read')));}
 const sparse={...base,frames:[{time:10,image},{time:11,image},{time:12,image},{time:13,image},{time:14,image},{time:15,image}]};const w=worker();assert.equal((await w.handler(request(sparse))).status,400,'more than three details per anchor interval cannot be silently compressed');assert.equal(paid(w).length,0);
});

test('dense output cannot skip, duplicate, invent or move a context time into a different primary interval',async()=>{
 const body=denseInput(),complete=denseRows(body);
 const mutate=callback=>{const value=structuredClone(complete);callback(value);return value;};
 const invalid=[
  mutate(rows=>{delete rows[0].motionDetails;}), mutate(rows=>rows[0].motionDetails.pop()),
  mutate(rows=>{rows[0].motionDetails[0].time+=.001;}), mutate(rows=>{rows[0].motionDetails[0].time=10.625;}),
  mutate(rows=>{rows[0].motionDetails[1]=rows[0].motionDetails[0];}),
  mutate(rows=>{rows[0].motionDetails[0].confidence='verified';}),
  mutate(rows=>{rows[0].motionDetails[0].motion='x'.repeat(121);}),
  mutate(rows=>{rows[0].motionDetails[0].lyrics='not allowed';}),
  mutate(rows=>{rows[0].motionDetails[0].motion='';}),
 ];
 for(const observations of invalid){const w=worker({result:{output_text:JSON.stringify({summary:'',observations})}}),response=await w.handler(request(body));assert.equal(response.status,422);assert.equal((await response.json()).code,'invalid_result');assert.equal(paid(w).length,1);}
});

test('unknown motion details remain unconfirmed and an empty context array does not fabricate intermediate poses',async()=>{
 const body=denseInput(),observations=denseRows(body).map(item=>({...item,motionDetails:item.motionDetails.map(detail=>({...detail,motion:'Not visible / unconfirmed',confidence:'low'}))}));
 const w=worker({result:{output_text:JSON.stringify({summary:'補助コマでも見えない箇所は未確認。',observations})}}),result=await(await w.handler(request(body))).json();assert.equal(result.observations[0].motionDetails[0].motion,'Not visible / unconfirmed');assert.equal(result.observations[0].motionDetails[0].confidence,'low');
 const empty={...batchInput(),motionFrames:[]},rows=denseRows(empty),old=worker({result:{output_text:JSON.stringify({summary:'',observations:rows})}}),response=await old.handler(request(empty));assert.equal(response.status,200);assert.ok((await response.json()).observations.every(item=>item.motionDetails.length===0));assert.equal(JSON.parse(paid(old)[0].options.body).text.format.schema.properties.observations.items.properties.motionDetails.maxItems,0);
});

test('motion detail text cannot smuggle a source clock into CUT-local directions while movement numbers remain valid',async()=>{
 const body=denseInput(.25);
 for(const motion of ['At 10.250s raise right palm.','At 10.25 seconds turn the head.','Hold for 125 ms.','At 00:10.250 shift left.','t=10.25, look at camera.','CUT 2: raise the right hand.']){
  const observations=denseRows(body);observations[0].motionDetails[0].motion=motion;
  const w=worker({result:{output_text:JSON.stringify({summary:'',observations})}}),response=await w.handler(request(body));assert.equal(response.status,422);assert.equal(paid(w).length,1);
 }
 const observations=denseRows(body);observations[0].motionDetails[0].motion='Right elbow bends 90 degrees; two small grounded steps.';
 const w=worker({result:{output_text:JSON.stringify({summary:'',observations})}}),response=await w.handler(request(body));assert.equal(response.status,200);assert.equal((await response.json()).observations[0].motionDetails[0].motion,observations[0].motionDetails[0].motion);
 assert.match(JSON.parse(paid(w)[0].options.body).instructions,/timestamps ONLY in the numeric time field/);
 const legacy=worker({result:{output_text:JSON.stringify({summary:'',observations:[row(0,1.5)]})}});assert.equal((await legacy.handler(request())).status,200);
});

test('soundtrack reading is explicit visible-label metadata and never enables lyrics, lookup or choreography inference',async()=>{
 const body={...denseInput(.25),readSoundtrack:true},observations=denseRows(body),soundtrack={title:'Visible song label',artist:'Visible artist',confidence:'medium'};
 const w=worker({result:{output_text:JSON.stringify({summary:'',observations,soundtrack})}}),response=await w.handler(request(body)),result=await response.json();assert.equal(response.status,200);assert.deepEqual(result.soundtrack,soundtrack);assert.equal(result.soundtrackSource,'visible_overlay_only');assert.equal(result.soundtrack_verified,false);assert.equal(result.audio_analyzed,false);
 const payload=JSON.parse(paid(w)[0].options.body);assert.ok(payload.text.format.schema.required.includes('soundtrack'));assert.match(payload.instructions,/Song names NEVER supply unobserved motion/);assert.match(payload.instructions,/No song lookup, downloads, guessed artists, lyric transcription/);assert.match(payload.input[0].content[0].text,/not a verified song\/version match/);
 assert.ok(w.calls.every(call=>/db\.test|api\.openai\.com/.test(call.url)));assert.equal(paid(w).length,1);
 const standard={...batchInput(),readSoundtrack:true},old=worker({result:{output_text:JSON.stringify({summary:'',observations:halfRows(10,15),soundtrack})}}),standardResult=await(await old.handler(request(standard))).json();assert.equal(standardResult.observationProtocol,3);assert.equal(standardResult.observations[0].motionDetails,undefined);
});

test('unreadable and generic audio labels stay empty and soundtrack output is excluded from older requests',async()=>{
 for(const soundtrack of [{title:'',artist:'',confidence:'high'},{title:'Original audio',artist:'some account',confidence:'high'},{title:'オリジナル音源',artist:'投稿者',confidence:'medium'}]){
  const w=worker({result:{output_text:JSON.stringify({summary:'',observations:halfRows(10,15),soundtrack})}}),result=await(await w.handler(request({...batchInput(),readSoundtrack:true}))).json();assert.deepEqual(result.soundtrack,{title:'',artist:'',confidence:'low'});
 }
 const unexpected=worker({result:{output_text:JSON.stringify({summary:'',observations:halfRows(10,15),soundtrack:{title:'Guessed song',artist:'',confidence:'low'}})}});assert.equal((await unexpected.handler(request(batchInput()))).status,422);assert.equal(paid(unexpected).length,1);
 const noMetadata=worker({result:{output_text:JSON.stringify({summary:'',observations:halfRows(10,15)})}}),legacy=await(await noMetadata.handler(request(batchInput()))).json();assert.equal(legacy.observationProtocol,2);assert.equal(legacy.soundtrack,undefined);
});

test('soundtrack schema rejects malformed labels, control characters and extra lyric data without paid retry',async()=>{
 const invalid=[null,{title:'x',artist:'y',confidence:'verified'},{title:'x'.repeat(161),artist:'',confidence:'low'},{title:'song\nlyric',artist:'',confidence:'low'},{title:'song',artist:'artist',confidence:'medium',lyrics:'not requested'}];
 for(const soundtrack of invalid){const w=worker({result:{output_text:JSON.stringify({summary:'',observations:halfRows(10,15),soundtrack})}});assert.equal((await w.handler(request({...batchInput(),readSoundtrack:true}))).status,422);assert.equal(paid(w).length,1);}
});

test('dense output still times out and truncates cleanly without automatically repeating a paid request',async()=>{
 const body=denseInput();const truncated=worker({result:{status:'incomplete',incomplete_details:{reason:'max_output_tokens'}}}),response=await truncated.handler(request(body));assert.equal(response.status,422);assert.equal((await response.json()).code,'output_limit');assert.equal(paid(truncated).length,1);
 const timers=clock(),stalled=worker({timers,intercept:url=>url.includes('api.openai.com')?new Promise(()=>{}):undefined}),pending=stalled.handler(request(body));await until(()=>paid(stalled).length===1);timers.fire(55000);const timeout=await pending;assert.equal(timeout.status,504);assert.equal((await timeout.json()).stage,'analysis');assert.equal(paid(stalled).length,1);assert.equal(paid(stalled)[0].options.signal.aborted,true);
});
