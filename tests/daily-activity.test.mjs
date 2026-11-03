import test from 'node:test';import assert from 'node:assert/strict';import {isDailyActivityQuestion,dailyActivityReply,cosplayUpdate,isDailyActivityRequest,activityReplyContext,wrongActivityReply} from '../daily-activity.mjs';
test('単純な今日の質問に共通の内容を使い、職業や別の質問を取り違えない',()=>{const plan={answer_ja:'今日はお買い物を楽しむ日だよ☺️'};for(const text of ['今日は何してる？','どう過ごしてるの'])assert.equal(dailyActivityReply(text,plan),plan.answer_ja);for(const text of ['いつも何やってるの','お仕事は何してる？','明日は何してる？','今日は何してる？好きな曲は？','今日は誰と何してる？'])assert.equal(isDailyActivityQuestion(text),false);});
test('予定は質問されたときだけ参照し、見送り・野菜の話・繰り返しの指摘に差し込まない',()=>{
 const plan={day_jst:'2026-11-03',activity_code:'shopping'};
 for(const comment of ['今日は何してる？','今日は何するの？','今日は買い物？','What are you doing today?','今日は何してる？好きな曲は？'])assert.equal(isDailyActivityRequest(comment),true,comment);
 for(const comment of ['気をつけて行ってらっしゃい','おつかれさまでした','コールラビを使う料理も食べたい','買い物行ってくるばっかりじゃん','また買い物なの？','いつも何してるの？','明日は何してる？']){
  const context=activityReplyContext(comment,'ぎゅーしてくれたら行ってきます',plan);
  assert.equal(context.requested,false,comment);
  assert.equal(wrongActivityReply('ありがとう。今日はお買い物を楽しんでくるね。',context),true,comment);
  assert.equal(wrongActivityReply('ありがとう、気をつけるね☺️',context),false,comment);
 }
 const wanted=activityReplyContext('今日は何してる？','',plan,[{at:'2026-11-02T23:00:00Z',replies:['今日は買い物の日だよ']}]);
 assert.equal(wanted.already_shared_today,true);
 assert.equal(wrongActivityReply('今日は友達と遊ぶ日だよ',wanted),true);
 assert.equal(wrongActivityReply('今日は買い物の日だよ',wanted),false);
 const food=activityReplyContext('ピアノで何が好き？','',null);assert.equal(wrongActivityReply('乙女の祈りが好きだよ☺️',food),false);
 assert.equal(wrongActivityReply('買い物を楽しんできてね☺️',activityReplyContext('買い物に行ってくるよ','',null)),false);
});
test('アスカの予告は指定日だけで、公開後は比較の感想を聞く',()=>{assert.match(cosplayUpdate('2026-10-17'),/2026年10月18日/);assert.match(cosplayUpdate('2026-10-18'),/公開済み/);assert.match(cosplayUpdate('2026-10-19'),/どちら/);});
