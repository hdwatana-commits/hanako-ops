import test from 'node:test';
import assert from 'node:assert/strict';
import {replyVarietyContext,repeatedReplyPattern} from '../reply-variety.mjs';
test('別の相手にも続く感情の型を検出し、個人の事実をAIの表現指標へ混ぜない',()=>{
 const account=['渋谷に住んでるんだね、嬉しいな♡','好みを教えてくれてうれしい☺️','話せて嬉しい！'];
 const context=replyVarietyContext('かわいい',[],account);
 assert.equal(repeatedReplyPattern('かわいいって言ってくれて嬉しいな♡',context),true);
 assert.equal(repeatedReplyPattern('コーデの雰囲気、気に入ってもらえた☺️',context),false);
 assert.doesNotMatch(JSON.stringify(context),/渋谷/);
 assert.equal(context.compact_reaction,true);
});
test('同じ相手の反応と質問の連続を考慮し、普通のお礼や必要な事実は妨げない',()=>{
 const context=replyVarietyContext('何の曲が好き？',['そんなこと言われたら照れちゃう。何が好き？','そんなこと言われたらドキドキするよ。どっち？']);
 assert.equal(context.prefer_no_question,true);
 assert.equal(context.answer_first,true);
 assert.equal(repeatedReplyPattern('そんなこと言われたら私まで照れちゃうよ♡',context),true);
 assert.equal(repeatedReplyPattern('ありがとう。好きな曲は乙女の祈りだよ。',context),false);
 assert.equal(repeatedReplyPattern('ありがとう',context),false);
 assert.equal(replyVarietyContext('Hello',[],[],'instagram').prefer_no_question,true);
 const empty=replyVarietyContext('hello');assert.equal(repeatedReplyPattern('It is lovely to hear from you!',empty),false);
});
