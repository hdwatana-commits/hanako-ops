import test from 'node:test';
import assert from 'node:assert/strict';
import {HANA_PROFILE,replyCustomPrompt} from '../hana-profile.mjs';
test('内部情報を除き、更新した公開条件を守る',()=>{assert.equal(replyCustomPrompt('口調の指定\n[HANA_PRIVATE_PROFILE]private-only[/HANA_PRIVATE_PROFILE]\n追加指定'),'口調の指定\n追加指定');assert.doesNotMatch(HANA_PROFILE,/22歳|２２歳|20人|２０人/);assert.match(HANA_PROFILE,/慶應義塾大学卒業/);assert.match(HANA_PROFILE,/今回を含め2回以上/);assert.match(HANA_PROFILE,/履歴不足/);assert.match(HANA_PROFILE,/まだ弾けない/);assert.match(HANA_PROFILE,/ハナ個人の感想/);assert.match(HANA_PROFILE,/渋谷のつじ田/);});
