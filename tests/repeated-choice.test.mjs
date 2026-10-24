import test from 'node:test';
import assert from 'node:assert/strict';
import {stopChoiceReprompt,normalizeReplyLayout} from '../reply-rules.mjs';
test('実際に発生した白黒の催促・再確認を除去する',()=>{
 for(const text of ['黒が好きなんだね🖤 今日は黒の私を選んでくれたってことかな？','白と黒、どっちの私が好みか教えて？♡','今日は私の白か黒、どっちが見たいか選んでほしいの🥺','White or black?'])assert.doesNotMatch(stopChoiceReprompt(text),/どっち|選んでほしい|ことかな|White or black/);
 assert.equal(stopChoiceReprompt('ありがとう。白か黒どちらが好き？'),'ありがとう。');
});
test('回答の受け止めや別の話題の質問は残す',()=>{
 for(const text of ['黒の私を選んでくれたのね🖤','どっちも好きなんだね🤍🖤','黒が好きって教えてくれてありがとう☺️','好きな映画は？'])assert.equal(stopChoiceReprompt(text),text);
 assert.equal(normalizeReplyLayout('ありがとう\\n白と黒、どっちが好き？'),'ありがとう');
});
