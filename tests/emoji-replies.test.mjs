import test from 'node:test';
import assert from 'node:assert/strict';
import {isEmojiOnly,emojiReply} from '../reply-rules.mjs';
test('絵文字の肌色・家族・旗・キーキャップと改行を判定する',()=>{for(const t of ['❤️','😂😂','👍🏽','👨‍👩‍👧‍👦','🇯🇵','1️⃣','#️⃣','😢\n🫶','  🤭  ','👩🏽‍💻','🏳️‍🌈','\u200B🥰'])assert.equal(isEmojiOnly(t),true,t);for(const t of ['',null,'ありがとう❤️','かわいい','123','#',':)','©','🫶質問？','\u200D','🇯'])assert.equal(isEmojiOnly(t),false,String(t));});
test('複数パターンは絵文字だけで、悲しさや怒りには穏やかに返す',()=>{assert.notEqual(emojiReply('❤️',()=>0),emojiReply('❤️',()=>0.99));for(const t of ['😭','😡','❤️','😂'])for(const n of [0,0.2,0.5,0.99])assert.equal(isEmojiOnly(emojiReply(t,()=>n)),true);assert.equal(emojiReply('ありがとう❤️'),null);});
