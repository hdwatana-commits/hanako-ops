import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeReplyLayout,reduceAhiOpening} from '../reply-rules.mjs';
test('文字として露出した改行とWindows改行を整え、段落を保つ',()=>{
 assert.equal(normalizeReplyLayout('ありがとう\\n嬉しいな'), 'ありがとう\n嬉しいな');
 assert.equal(normalizeReplyLayout('Hello\\r\\nThank you'), 'Hello\nThank you');
 assert.equal(normalizeReplyLayout(' ありがとう  \r\n\r\n\r\n嬉しいな  '),'ありがとう\n\n嬉しいな');
});
test('URLや外国語の本文を保持し、書き出し除去の前に改行を解釈する',()=>{
 const text='Thanks!\nhttps://note.com/hanako47258/n/n94503654ef15';
 assert.equal(normalizeReplyLayout(text),text);
 for(let i=0;i<20;i++){
  const result=reduceAhiOpening(normalizeReplyLayout('あひっ💕\\nありがとう'),String(i));
  assert.ok(result==='あひっ💕\nありがとう'||result==='ありがとう');
 }
});
