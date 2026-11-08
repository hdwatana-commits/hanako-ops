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

test('夜の追加案内は日本時間19:30から日付が変わるまで、対象の一部だけに出す',()=>{
 const text='今日のコーデ、とっても可愛いね！';
 const evening=new Date('2026-11-08T10:30:00Z');
 const ids=Array.from({length:1000},(_,i)=>String(18000000000000000n+BigInt(i)));
 const selected=ids.filter(commentId=>noteOpportunity(text,[],true,{now:evening,commentId}).suggest);
 assert.ok(selected.length>=85&&selected.length<=135);
 const commentId=selected[0];
 for(const [utc,expected] of [['10:29:59',false],['10:30:00',true],['14:59:59',true],['15:00:00',false]]){
   assert.equal(noteOpportunity(text,[],true,{commentId,now:new Date('2026-11-08T'+utc+'Z')}).suggest,expected);
 }
 const opts={commentId,now:evening};
 assert.equal(noteOpportunity(text,[],true,opts).suggest,true);
 assert.equal(noteOpportunity(text,[],true,{...opts,platform:'instagram'}).suggest,false);
 assert.equal(noteOpportunity(text,[],false,opts).suggest,false);
 assert.equal(noteOpportunity(text,[{comment:'宣伝はやめて'}],true,opts).suggest,false);
 for(const excluded of ['可愛いけど心配だよ','可愛いけどつらい','どの服が可愛いと思う？','💕💕💕'])assert.equal(noteOpportunity(excluded,[],true,opts).suggest,false);
});
