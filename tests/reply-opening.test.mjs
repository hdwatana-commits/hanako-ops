import test from 'node:test';
import assert from 'node:assert/strict';
import {reduceAhiOpening} from '../reply-rules.mjs';
test('同じコメントでは再試行しても同じ判定、書き出しは約4分の1に減る',()=>{
 const replies=Array.from({length:1000},(_,i)=>reduceAhiOpening('あひっ💕\nありがとう！',String(i)));
 const kept=replies.filter(x=>x.startsWith('あひっ')).length;
 assert.ok(kept>=240&&kept<=260,String(kept));
 replies.forEach((text,i)=>assert.equal(text,reduceAhiOpening('あひっ💕\nありがとう！',String(i))));
 assert.ok(replies.every(x=>x==='あひっ💕\nありがとう！'||x==='ありがとう！'));
});
test('本文中の表現・通常の返信・外国語・単語は変更せず、空文にしない',()=>{
 for(const text of ['ありがとう💕','Thanks!','あひるが好き','それはあひっ💕ってなる'])assert.equal(reduceAhiOpening(text,'id'),text);
 assert.ok(reduceAhiOpening('あひっ💕','id').length>0);
});
