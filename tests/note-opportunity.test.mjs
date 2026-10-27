import test from 'node:test';import assert from 'node:assert/strict';import {noteOpportunity} from '../note-opportunity.mjs';
const chat=Array.from({length:3},()=>({comment:'今日も楽しいね',replies:['ありがとう']}));
test('直接の誘いと盛り上がった会話を購入案内の候補にする',()=>{
 for(const text of ['会いたい','DMしていい？','連絡先教えて','電話したい'])assert.equal(noteOpportunity(text,[],true).reason,'direct_invitation');
 assert.equal(noteOpportunity('お話ししていて楽しい',chat,true).suggest,true);
 assert.equal(noteOpportunity('ありがとう',[],true).suggest,false);
});
test('同日上限・拒否・購入済み・不安や相談では営業しない',()=>{
 assert.equal(noteOpportunity('会いたい',chat,false).suggest,false);
 for(const text of ['もう買ったよ','お金がない','寂しい、会いたい','嫌われたのか不安','入院してつらい'])assert.equal(noteOpportunity(text,chat,true).suggest,false);
 assert.equal(noteOpportunity('楽しいね',[{comment:'買いたくない',replies:['わかった']} ,...chat],true).suggest,false);
 assert.equal(noteOpportunity('記事を読みたい、リンク教えて',[{comment:'買えない',replies:[]}],true).suggest,true);
});
