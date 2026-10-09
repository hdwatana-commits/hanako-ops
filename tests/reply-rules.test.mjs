import test from 'node:test';
import assert from 'node:assert/strict';
import { inWindow, validateSettings, relationshipLevel, exclusionReason, wrongGreeting, replyClock } from '../reply-rules.mjs';
const s={enabled:false,mode:'draft',start_time:'09:00',end_time:'23:00',weekdays:[0,1,2,3,4,5,6],delay_minutes:5,tones:['cute','friendly'],adapt_tone:true,custom_prompt:'',max_chars:180,use_history:true};
test('日本時間の開始は含み、終了は含まない',()=>{
  assert.equal(inWindow(s,new Date('2026-10-04T00:00:00Z')),true);
  assert.equal(inWindow(s,new Date('2026-10-04T14:00:00Z')),false);
});
test('日をまたぐ窓は開始曜日に属する',()=>{
  const overnight={...s,start_time:'22:00',end_time:'02:00',weekdays:[6]};
  assert.equal(inWindow(overnight,new Date('2026-10-03T14:00:00Z')),true);
  assert.equal(inWindow(overnight,new Date('2026-10-03T16:00:00Z')),true);
  assert.equal(inWindow(overnight,new Date('2026-10-04T14:00:00Z')),false);
});
test('同じ時間は選択曜日の24時間',()=>{
  assert.equal(inWindow({...s,start_time:'09:00',end_time:'09:00',weekdays:[0]},new Date('2026-10-03T17:00:00Z')),true);
});
test('設定の不正な型、テンション、時間、長さを拒否する',()=>{
  assert.deepEqual(validateSettings({...s,lease_until:'tamper'}),s);
  for(const invalid of [{enabled:'true'},{tones:['unknown']},{tones:['__proto__']},{tones:[]},{weekdays:[]},{weekdays:[7]},{delay_minutes:-1},{start_time:'25:00'},{max_chars:501},{custom_prompt:'x'.repeat(8001)}])assert.throws(()=>validateSettings({...s,...invalid}));
});

test('距離感は日数と双方向の返答が揃ったときだけ進み、大量の一方的コメントでは進まない',()=>{
  assert.equal(relationshipLevel().name,'はじめまして');
  assert.equal(relationshipLevel({comments:100,active_days:1,replies:100}).level,0);
  assert.equal(relationshipLevel({comments:100,active_days:20,replies:0}).level,0);
  assert.equal(relationshipLevel({comments:3,active_days:2,replies:2}).name,'顔なじみ');
  assert.equal(relationshipLevel({comments:8,active_days:3,replies:5}).name,'気になる存在');
  assert.equal(relationshipLevel({comments:20,active_days:5,replies:12}).name,'甘えたくなる存在');
  assert.equal(relationshipLevel({comments:40,active_days:10,replies:25}).name,'恋人みたいな距離');
});
test('NG対象者は正規化した完全一致、NGワードは正規化した部分一致',()=>{
  const lists=validateSettings({...s,ng_users:[' @Guest ','ＧＵＥＳＴ'],ng_words:[' ＤＭ ','禁止']});
  assert.deepEqual(lists.ng_users,['guest']);
  assert.match(exclusionReason(lists,{username:'GUEST',comment_text:'こんにちは'}),/NG対象者/);
  assert.equal(exclusionReason(lists,{username:'guest2',comment_text:'こんにちは'}),'');
  assert.match(exclusionReason(lists,{username:'else',comment_text:'dmください'}),/NGワード/);
  assert.match(exclusionReason(lists,{username:'else',comment_text:'これは禁止だよ'}),/NGワード/);
  assert.throws(()=>validateSettings({...s,ng_users:['https://threads.com/user']}));
  assert.throws(()=>validateSettings({...s,ng_words:Array(201).fill('x')}));
});
test('挨拶はコメントの時刻ではなく、日本時間の返信時刻に合わせる',()=>{
  const morning=new Date('2026-10-06T22:00:00Z'),day=new Date('2026-10-07T04:00:00Z'),night=new Date('2026-10-07T12:00:00Z');
  assert.equal(replyClock(morning).period,'朝');assert.equal(wrongGreeting('こんばんわ♡',morning),true);
  assert.equal(wrongGreeting('おはよう',morning),false);assert.equal(wrongGreeting('Good morning!',night),true);
  assert.equal(wrongGreeting('早上好',night),true);assert.equal(wrongGreeting('晚上好',day),true);
  assert.equal(wrongGreeting('おはよう',day),true);assert.equal(wrongGreeting('こんばんは',night),false);
  assert.equal(wrongGreeting('ありがとう、嬉しいな',night),false);
});

test('返信速度は通常と3分の即返信だけを許可し、旧クライアントは既存値を保持する',()=>{const s={enabled:true,mode:'auto',start_time:'06:00',end_time:'01:00',weekdays:[0,1,2,3,4,5,6],delay_minutes:5,tones:['cute'],adapt_tone:true,custom_prompt:'',max_chars:250,use_history:true};assert.equal(validateSettings({...s,delay_mode:'normal'}).delay_mode,'normal');assert.equal(validateSettings({...s,delay_mode:'instant'}).delay_mode,'instant');assert.throws(()=>validateSettings({...s,delay_mode:'immediate'}));assert.equal(Object.hasOwn(validateSettings(s),'delay_mode'),false);});
