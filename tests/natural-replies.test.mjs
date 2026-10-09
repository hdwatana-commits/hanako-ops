import test from 'node:test';
import assert from 'node:assert/strict';
import {tooSimilarReply} from '../reply-rules.mjs';
test('長い定型文のコピーとほぼ同じ言い回しを検出する',()=>{const old='そう言ってもらえると朝からとっても嬉しくなっちゃうよ♡';assert.equal(tooSimilarReply(old.replace('♡','🤭'),[old]),true);assert.equal(tooSimilarReply('そう言ってもらえると朝からとっても嬉しくなっちゃうよね♡',[old]),true);assert.equal(tooSimilarReply('この色褒めてもらえるの嬉しいな。次のお洋服も楽しみ♡',[old]),false);});
test('短いお礼・挨拶や必須URLだけの繰り返しは再生成しない',()=>{assert.equal(tooSimilarReply('ありがと♡',['ありがと♡']),false);assert.equal(tooSimilarReply('Thanks!',['Thanks!']),false);assert.equal(tooSimilarReply('https://note.com/hanako47258',['https://note.com/hanako47258']),false);});
