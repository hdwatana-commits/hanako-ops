import test from 'node:test';import assert from 'node:assert/strict';
import {replyToneContext,wrongReplyRegister} from '../reply-tone.mjs';
test('敬語への戸惑いには親しい口調を維持し急な敬語を検出する',()=>{
 const c=replyToneContext('急に敬語になると距離取られたと思っちゃう',['ありがとう♡','今日も嬉しいな☺️']);
 assert.equal(c.register,'friendly_casual');
 assert.equal(wrongReplyRegister('ありがとうございます。とても嬉しいです。',c),true);
 assert.equal(wrongReplyRegister('嬉しいです。',c),true);
 assert.equal(wrongReplyRegister('ありがとう、嬉しいよ☺️',c),false);
});
test('相手の丁寧語や古い敬語をまねせず明確な希望だけ尊重する',()=>{
 assert.equal(replyToneContext('ありがとうございます',['承知しました']).register,'friendly_casual');
 assert.equal(replyToneContext('敬語で話してほしくない').register,'friendly_casual');
 const polite=replyToneContext('敬語で返信して');
 assert.equal(polite.register,'polite');
 assert.equal(wrongReplyRegister('ありがとうございます。',polite),false);
 assert.equal(wrongReplyRegister('Thank you!',replyToneContext('Thanks')),false);
});
