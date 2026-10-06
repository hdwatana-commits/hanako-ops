import test from 'node:test';
import assert from 'node:assert/strict';
import {HANA_PROFILE,replyCustomPrompt} from '../hana-profile.mjs';
test('所有者専用の内部情報は除き、通常の追加設定を残す',()=>{assert.equal(replyCustomPrompt('口調の指定\n[HANA_PRIVATE_PROFILE]private-only[/HANA_PRIVATE_PROFILE]\n追加指定'),'口調の指定\n追加指定');assert.doesNotMatch(HANA_PROFILE,/22歳|２２歳|慶應|慶応|20人|２０人|渋谷在住/);assert.match(HANA_PROFILE,/渋谷のつじ田/);assert.match(HANA_PROFILE,/年齢・生年・住まいの地名/);});
