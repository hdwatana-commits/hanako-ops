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
test('文の区切りと日本語の絵文字後の余白を改行し、本文・URL・小数・略語を保持する',()=>{
 assert.equal(normalizeReplyLayout('ありがとう☺️ 私も好きだよ♡'),'ありがとう☺️\n私も好きだよ♡');
 assert.equal(normalizeReplyLayout('黒も似合うね。今日は気分を変えてみたよ！♡'),'黒も似合うね。\n今日は気分を変えてみたよ！♡');
 assert.equal(normalizeReplyLayout('Thanks! You made my day. Hope yours is lovely.'),'Thanks!\nYou made my day.\nHope yours is lovely.');
 assert.equal(normalizeReplyLayout('That makes me smile! 🥰'),'That makes me smile! 🥰');
 assert.equal(normalizeReplyLayout('Dr. Smith likes it. A score of 3.5 is fine.'),'Dr. Smith likes it.\nA score of 3.5 is fine.');
 assert.equal(normalizeReplyLayout('読んでね。https://note.com/hanako47258/n/n94503654ef15'),'読んでね。\nhttps://note.com/hanako47258/n/n94503654ef15');
 for(const text of ['ありがとう💕','🤍 🖤','黒と白なら今日は黒かな','This is one short sentence.','https://example.com/a.b?q=3.5'])assert.equal(normalizeReplyLayout(text),text);
 const text='ありがとう☺️ 私も好きだよ♡\n\n読んでね。https://note.com/hanako47258/n/n94503654ef15';
 assert.equal(normalizeReplyLayout(normalizeReplyLayout(text)),normalizeReplyLayout(text));
});
