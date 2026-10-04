import test from 'node:test';
import assert from 'node:assert/strict';
import { inWindow, validateSettings, relationshipLevel } from '../reply-rules.mjs';
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