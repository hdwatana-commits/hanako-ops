import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {geminiDailyQuota,geminiResumeAt,geminiFallbackState} from '../reply-ai-fallback.mjs';

test('Gemini quota classification distinguishes daily limits from per-minute throttling',()=>{
 assert.equal(geminiDailyQuota({details:[{violations:[{quotaId:'GenerateRequestsPerDayPerProjectPerModel-FreeTier'}]}]}),true);
 assert.equal(geminiDailyQuota({message:'Generate content requests per day limit exceeded'}),true);
 assert.equal(geminiDailyQuota({details:[{violations:[{quotaId:'GenerateRequestsPerMinutePerProjectPerModel-FreeTier'}]}]}),false);
 assert.equal(geminiDailyQuota({message:'Service unavailable'}),false);
});
test('JST cutoff is fixed at 17:05 and manual OpenAI remains selected',()=>{
 assert.equal(geminiResumeAt(Date.parse('2026-11-08T08:04:59Z')),'2026-11-08T08:05:00.000Z');
 assert.equal(geminiResumeAt(Date.parse('2026-11-08T08:05:00Z')),'2026-11-09T08:05:00.000Z');
 assert.equal(geminiResumeAt(Date.parse('2026-12-31T17:00:00Z')),'2027-01-01T08:05:00.000Z');
 assert.equal(geminiFallbackState('openai','2026-11-08T08:05:00Z',0),'none');
});

const source=readFileSync(new URL('../supabase/functions/threads-replies/index.ts',import.meta.url),'utf8');
const code=stripTypeScriptTypes(source.slice(source.indexOf('function replyFallbackState'),source.indexOf('async function generateWithProvider')));
function scenario(clock,failures={},config={}){
 const selected={ai_provider:'gemini',ai_connection:'default',openai_ready:true,ai_retry_at:null,gemini_fallback_until:null,...config};
 const calls=[];
 class FreeQuotaError extends Error {}
 class GeminiDailyQuotaError extends FreeQuotaError {}
 const now={value:Date.parse(clock)};
 const fakeDate=class extends Date{static now(){return now.value;}};
 const module=new Function('Date','geminiFallbackState','aiProvider','geminiResumeAt','filter','db','settings','openaiConfigured','generateWithProvider','FreeQuotaError','GeminiDailyQuotaError',code+';return {generate,replyAiWaiting};')(
  fakeDate,(preferred,until)=>geminiFallbackState(preferred,until,now.value),s=>s.ai_provider,geminiResumeAt,()=>'',async(_resource,_method,body)=>[Object.assign(selected,body)],async()=>({...selected}),async()=>true,
  async(s)=>{calls.push(s.ai_provider);if(failures[s.ai_provider]==='daily')throw new GeminiDailyQuotaError();if(failures[s.ai_provider])throw new FreeQuotaError();return s.ai_provider;},
  FreeQuotaError,GeminiDailyQuotaError);
 return {module,calls,selected,now,failures,generate:()=>module.generate({...selected},{username:'fan'})};
}
test('same reply falls back to OpenAI, then Gemini resumes even if OpenAI is blocked',async()=>{
 const s=scenario('2026-11-08T07:00:00Z',{gemini:'daily'});
 assert.equal(await s.generate(),'openai');
 assert.deepEqual(s.calls,['gemini','openai']);
 assert.equal(s.selected.gemini_fallback_until,'2026-11-08T08:05:00.000Z');
 assert.equal(await s.generate(),'openai');
 s.selected.openai_ready=false;s.selected.ai_retry_at='2026-11-08T09:00:00Z';
 assert.equal(s.module.replyAiWaiting(s.selected),true);
 s.now.value=Date.parse('2026-11-08T08:05:00Z');
 delete s.failures.gemini;
 assert.equal(s.module.replyAiWaiting(s.selected),false);
 assert.equal(await s.generate(),'gemini');
 assert.equal(s.selected.gemini_fallback_until,null);
 assert.equal(s.selected.ai_retry_at,null);
});
test('a late Gemini reset is retried in 15 minutes, and an unavailable OpenAI is not called',async()=>{
 const s=scenario('2026-11-08T08:05:00Z',{gemini:'daily'},{gemini_fallback_until:'2026-11-08T08:05:00Z',openai_ready:false});
 await assert.rejects(s.generate(),/残高または接続/);
 assert.deepEqual(s.calls,['gemini']);
 assert.equal(s.selected.gemini_fallback_until,'2026-11-08T08:20:00.000Z');
});
test('brief throttling does not initiate paid fallback',async()=>{
 const s=scenario('2026-11-08T07:00:00Z',{gemini:'minute'});
 await assert.rejects(s.generate());
 assert.deepEqual(s.calls,['gemini']);
 assert.equal(s.selected.gemini_fallback_until,null);
});
