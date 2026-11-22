import test from 'node:test';import assert from 'node:assert/strict';import {noteOpportunity} from '../note-opportunity.mjs';

test('写真への好意的な感想からInstagramを一部紹介し、上限・拒否・相談を優先する',async()=>{
 const {instagramOpportunity}=await import('../note-opportunity.mjs');
 const comment='今日の洋服と写真、とっても可愛いね！';
 const ids=Array.from({length:10000},(_,i)=>String(18000000000000000n+BigInt(i)));
 const selected=ids.filter(commentId=>instagramOpportunity(comment,[],true,{commentId}).suggest);
 assert.ok(selected.length>=65&&selected.length<=135);
 const commentId=selected[0],options={commentId};
 assert.equal(instagramOpportunity(comment,[],true,options).suggest,true);
 assert.equal(instagramOpportunity(comment,[],false,options).suggest,false);
 assert.equal(instagramOpportunity(comment,[],true,{...options,platform:'instagram'}).suggest,false);
 for(const text of ['写真かわいいけど寂しい','写真より会いたい、大好き','コーデ可愛いけど宣伝いらない','どの服が可愛い？','💕💕💕']){
  assert.equal(instagramOpportunity(text,[],true,options).suggest,false);
 }
 assert.equal(instagramOpportunity(comment,[{comment:'勧誘はやめて'}],true,options).suggest,false);
});
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

test('追加案内を昼間に広げ、19:30から日付が変わるまでは対象を増やす',()=>{
 const text='今日のコーデ、とっても可愛いね！';
 const evening=new Date('2026-11-08T10:30:00Z');
 const ids=Array.from({length:1000},(_,i)=>String(18000000000000000n+BigInt(i)));
 const selected=ids.filter(commentId=>noteOpportunity(text,[],true,{now:evening,commentId}).suggest);
 const daytime=new Date('2026-11-08T10:29:59Z');
 const daytimeSelected=ids.filter(commentId=>noteOpportunity(text,[],true,{now:daytime,commentId}).suggest);
 assert.ok(selected.length>=400&&selected.length<=480);
 assert.ok(daytimeSelected.length>=70&&daytimeSelected.length<=130);
 assert.ok(daytimeSelected.every(id=>selected.includes(id)));
 const commentId=selected.find(id=>!daytimeSelected.includes(id));
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
