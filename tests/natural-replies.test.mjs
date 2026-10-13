import test from 'node:test';
import assert from 'node:assert/strict';
import {tooSimilarReply,hasNotePromotion,wrongNoteReply,repeatedEnding,NOTE_ARTICLE_URL} from '../reply-rules.mjs';
test('指定記事だけを案内し上限後はリンクなしの購入誘導も止める',()=>{assert.equal(wrongNoteReply(NOTE_ARTICLE_URL,true),false);assert.equal(wrongNoteReply('https://note.com/hanako47258',true),true);assert.equal(wrongNoteReply('noteの記事、買って読んでね',false),true);assert.equal(hasNotePromotion('ゲームは何が好き？'),false);});
test('同じ語尾が3回続く候補を止め、語尾を変えた候補は通す',()=>{assert.equal(repeatedEnding('お洋服も好きだよ♡',['野菜が好きだよ☺️','音楽も好きだよ']),true);assert.equal(repeatedEnding('次はどんな曲にしようかな',['野菜が好きだよ','音楽も好きだよ']),false);assert.equal(repeatedEnding('嬉しいな',['ありがとう']),false);});
test('長い定型文のコピーとほぼ同じ言い回しを検出する',()=>{const old='そう言ってもらえると朝からとっても嬉しくなっちゃうよ♡';assert.equal(tooSimilarReply(old.replace('♡','🤭'),[old]),true);assert.equal(tooSimilarReply('そう言ってもらえると朝からとっても嬉しくなっちゃうよね♡',[old]),true);assert.equal(tooSimilarReply('この色褒めてもらえるの嬉しいな。次のお洋服も楽しみ♡',[old]),false);});
test('短いお礼・挨拶や必須URLだけの繰り返しは再生成しない',()=>{assert.equal(tooSimilarReply('ありがと♡',['ありがと♡']),false);assert.equal(tooSimilarReply('Thanks!',['Thanks!']),false);assert.equal(tooSimilarReply('https://note.com/hanako47258',['https://note.com/hanako47258']),false);});
