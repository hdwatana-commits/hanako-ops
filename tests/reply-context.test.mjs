import test from 'node:test';
import assert from 'node:assert/strict';
import {loadThreadContext,avoidAnsweredQuestions} from '../reply-context.mjs';
test('同じ投稿の最初の回答と直接の親子関係を取得し回答済みの状態を作る',async()=>{
 const c={post_id:'post',username:'guest',comment_id:'now',parent_id:'ack',comment_text:'ありがとう',commented_at:'2026-10-24T10:00:00Z'};
 const turns={ack:{comment_id:'ack',parent_id:'answer',comment_text:'黒を選んでくれてありがとう',is_owner:true},answer:{comment_id:'answer',parent_id:'question',comment_text:'黒が好き',is_owner:false,username:'guest'},question:{comment_id:'question',comment_text:'白と黒、どっちが好き？',is_owner:true}};
 const queries=[];const db=async q=>{queries.push(q);if(q.includes('username=eq.'))return [];return Object.values(turns).filter(t=>q.includes('comment_id=eq.'+t.comment_id+'&'));};
 const ctx=await loadThreadContext(db,'owner',c,true);
 assert.equal(ctx.thread_ancestors.length,3);
 assert.deepEqual(ctx.answered_questions,[{question:'白と黒、どっちが好き？',answer:'黒が好き',answer_id:'answer'}]);
 assert.ok(queries.every(q=>q.includes('user_id=eq.owner&post_id=eq.post')&&q.includes('commented_at=lte.')));
 assert.ok(queries.some(q=>q.includes('order=commented_at.asc&limit=10')));
 assert.equal(avoidAnsweredQuestions('ありがとう。白と黒、どっちが好き？',ctx.answered_questions),'ありがとう。');
});
test('別人の親コメントを履歴に混ぜず、履歴無効時は取得しない',async()=>{
 const c={post_id:'p',username:'guest',comment_id:'c',parent_id:'other'};
 const db=async q=>q.includes('username=eq.')?[]:[{comment_id:'other',is_owner:false,username:'different'}];
 assert.deepEqual((await loadThreadContext(db,'owner',c,true)).thread_ancestors,[]);
 const ctx=await loadThreadContext(()=>{throw Error('must not read');},'owner',c,false);
 assert.equal(ctx.context_enabled,false);
});
test('回答済みの一般質問も除去し、別の質問と本文を残す',()=>{
 const answered=[{question:'好きなアニメは？',answer:'推しの子'}];
 assert.equal(avoidAnsweredQuestions('教えてくれてありがとう。好きなアニメは？',answered),'教えてくれてありがとう。');
 assert.equal(avoidAnsweredQuestions('推しの子が好きなんだね。どの場面が好き？',answered),'推しの子が好きなんだね。どの場面が好き？');
});
test('別の投稿の選択は持ち越さず、同じ投稿で答えた場合だけ再質問を止める',async()=>{
 const c={post_id:'new-post',post_text:'🤍白か🖤黒、どっちが好き？',username:'guest',comment_id:'current',comment_text:'こんにちは'};
 const db=async()=>[];
 const fresh=await loadThreadContext(db,'owner',c,true);
 assert.equal(avoidAnsweredQuestions('白と黒、どっちが好き？',fresh.answered_questions),'白と黒、どっちが好き？');
 const answered=await loadThreadContext(db,'owner',{...c,comment_text:'黒が好き'},true);
 assert.equal(avoidAnsweredQuestions('ありがとう。白と黒、どちらが好み？',answered.answered_questions),'ありがとう。');
});
