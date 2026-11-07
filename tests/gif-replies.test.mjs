import test from 'node:test';import assert from 'node:assert/strict';
import {parseGiphyId,validateGifSettings,readGifSettings,chooseReplyGif,allowedReplyGif,gifScene,gifPreviewUrl,gifVideoUrl} from '../gif-replies.mjs';
const item=(id='Alpha123',scene='affection')=>({gif_id:id,scene,label:id,enabled:true});
const config={enabled:true,rate:100,emoji_enabled:true,items:[item(),item('Beta234'),item('Gamma345')]};
const comment={comment_id:'current',comment_text:'💕',username:'guest'},night=new Date('2026-11-06T12:00:00Z');
test('GIPHYページ・埋め込み・画像URLをIDへ統一し、他サイトやコードを拒否する',()=>{
 for(const url of ['Alpha123','https://giphy.com/gifs/thank-you-Alpha123','https://giphy.com/embed/Alpha123','https://media.giphy.com/media/Alpha123/giphy.gif','https://media2.giphy.com/media/v1.Y2lk/Alpha123/giphy.gif'])assert.equal(parseGiphyId(url),'Alpha123');
 for(const url of ['javascript:alert(1)','http://giphy.com/gifs/Alpha123','https://giphy.com.evil.test/gifs/Alpha123','https://giphy.com@evil.test/gifs/Alpha123','https://giphy.com/search/thanks','https://giphy.com/gifs/%22onerror%3Dalert(1)','https://tenor.com/view/foo'])assert.throws(()=>parseGiphyId(url));
 assert.equal(gifPreviewUrl('" onerror=bad'), '');
});
test('同じ場面へ複数登録でき、重複・件数超過・不正な設定を保存しない',()=>{
 assert.equal(validateGifSettings(config).items.length,3);
 assert.equal(validateGifSettings({...config,items:Array.from({length:30},(_,i)=>item('Gif'+i))}).items.length,30);
 const scenes=['thanks','happy','shy','affection','goodnight','hello','cheer','surprise','reaction'];
 assert.equal(validateGifSettings({...config,items:scenes.flatMap(scene=>Array.from({length:30},(_,i)=>item('Gif'+i,scene)))}).items.length,270);
 assert.throws(()=>validateGifSettings({...config,items:[item(),item()]}),/重複/);
 assert.throws(()=>validateGifSettings({...config,items:Array.from({length:31},(_,i)=>item('Gif'+i))}),/30件/);
 assert.throws(()=>validateGifSettings({...config,items:[]}),/1件以上/);
 for(const rate of [-1,101,0.5,'20'])assert.throws(()=>validateGifSettings({...config,rate}));
 assert.equal(readGifSettings({enabled:true,items:'bad'}).enabled,false);
});
test('24時間や30件で忘れず、全履歴の未使用・少使用・最終送信日の順で選ぶ',()=>{
 const summary={last_gif_id:'Alpha123',usage:[{gif_id:'Alpha123',uses:100,last_used_at:'2026-10-01T00:00:00Z'},{gif_id:'Beta234',uses:1,last_used_at:'2026-01-01T00:00:00Z'}]};
 assert.equal(chooseReplyGif(config,comment,'💕',summary,night).gif_id,'Gamma345');
 const equal={last_gif_id:'Alpha123',usage:[...summary.usage,{gif_id:'Gamma345',uses:1,last_used_at:'2026-09-01T00:00:00Z'}]};
 assert.equal(chooseReplyGif(config,comment,'💕',equal,night).gif_id,'Beta234');
 const uneven={...equal,usage:equal.usage.map(row=>row.gif_id==='Beta234'?{...row,uses:3}:row)};
 assert.equal(chooseReplyGif(config,comment,'💕',uneven,night).gif_id,'Gamma345');
 const twenty={...config,items:Array.from({length:30},(_,i)=>item('LongGif'+i))},history={usage:[],last_gif_id:null};
 const chosen=new Set();
 for(let i=0;i<30;i++){
  const selected=chooseReplyGif(twenty,{...comment,comment_id:'turn'+i},'💕',history,night);assert.ok(selected);assert.equal(chosen.has(selected.gif_id),false);chosen.add(selected.gif_id);
  history.last_gif_id=selected.gif_id;history.usage.push({gif_id:selected.gif_id,uses:1,last_used_at:new Date(Date.UTC(2026,0,i+1)).toISOString()});
 }
 assert.equal(chosen.size,30);
 const first=history.usage[0].gif_id;
 assert.equal(chooseReplyGif(twenty,{...comment,comment_id:'turn21'},'💕',history,night).gif_id,first);
});
test('割合は再試行でも安定し、絵文字だけは専用設定でAI不要のGIFを選べる',()=>{
 const zero={...config,rate:0};assert.ok(chooseReplyGif(zero,comment,'💕',[],night));
 assert.equal(chooseReplyGif({...zero,emoji_enabled:false},comment,'💕',[],night),null);
 assert.equal(chooseReplyGif(zero,{...comment,comment_text:'大好きです'},'ありがとう',[],night),null);
 const part={...config,rate:20},text={comment_text:'大好きです'};let used=0;
 for(let i=0;i<1000;i++){const c={...text,comment_id:String(i)},a=chooseReplyGif(part,c,'ありがとう',[],night);assert.deepEqual(chooseReplyGif(part,c,'ありがとう',[],night),a);if(a)used++;}assert.ok(used>150&&used<250,used);
});
test('直前と同じGIFを避け、使っていない候補を優先し、別候補なしなら文章だけにする',()=>{
 const old=[{reply_gif:item('Alpha123')},{reply_gif:item('Beta234')}];assert.equal(chooseReplyGif(config,comment,'💕',old,night).gif_id,'Gamma345');
 assert.equal(chooseReplyGif({...config,items:[item()]},comment,'💕',old,night),null);
 const selected=chooseReplyGif(config,comment,'💕',[],night);assert.ok(allowedReplyGif(config,comment,'💕',selected,night));
 assert.equal(allowedReplyGif({...config,enabled:false},comment,'💕',selected,night),null);
 assert.equal(allowedReplyGif({...config,items:config.items.filter(i=>i.gif_id!==selected.gif_id)},comment,'💕',selected,night),null);
 assert.equal(chooseReplyGif(config,{...comment,platform:'instagram'},'💕',[],night),null);
});
test('深刻な話・購入案内には添えず、おやすみGIFは日本時間の夜だけ選ぶ',()=>{
 for(const text of ['病院で大変だったよ','寂しい。ありがとう','不快だからやめて','My friend died. Thank you'])assert.equal(gifScene(text,'',night),null);
 assert.equal(gifScene('ありがとう','https://note.com/hanako47258/n/n94503654ef15',night),null);
 assert.equal(gifScene('Good night','',night),'goodnight');assert.equal(gifScene('おやすみ','',new Date('2026-11-06T02:00:00Z')),null);
 assert.equal(gifScene('Gracias!','',night),'thanks');assert.equal(gifScene('😂','',night),'happy');
 assert.equal(gifScene('好きな曲は？','',night),'reaction');
});
test('別の相手への返信を含めて同じGIFを連続させず、個人への前回分も避ける',()=>{
 const latest=[{reply_gif:item('Beta234')}],personal=[{reply_gif:item('Alpha123')}];
 assert.equal(chooseReplyGif(config,comment,'💕',personal,night,latest).gif_id,'Gamma345');
 assert.equal(chooseReplyGif({...config,items:config.items.slice(0,2)},comment,'💕',personal,night,latest),null);
 let previous=null;
 for(let i=0;i<100;i++){
  const selected=chooseReplyGif(config,{...comment,comment_id:String(i),username:'different-'+i},'💕',[],night,[{reply_gif:previous}]);
  assert.ok(selected);assert.notEqual(selected.gif_id,previous?.gif_id);previous=selected;
 }
 assert.ok(chooseReplyGif({...config,items:[item()]},comment,'💕',[],night,[{reply_gif:null}]));
});

test('最新ポスト限定の旧設定はOFFとして読み、新設定は真偽値だけを保存する',()=>{
 assert.equal(readGifSettings(config).latest_post_only,false);
 assert.equal(validateGifSettings({...config,latest_post_only:true}).latest_post_only,true);
 assert.equal(validateGifSettings({...config,latest_post_only:false}).latest_post_only,false);
 for(const latest_post_only of ['true',1,null,{}])assert.throws(()=>validateGifSettings({...config,latest_post_only}));
});

test('動画方式の設定は既定OFFで真偽値だけを保存し、動画URLは登録IDからのみ作る',()=>{
 assert.equal(readGifSettings(config).video_mode,false);assert.equal(validateGifSettings({...config,video_mode:true}).video_mode,true);
 for(const video_mode of ['true',1,null,{}])assert.throws(()=>validateGifSettings({...config,video_mode}));
 assert.equal(gifVideoUrl('Alpha123'),'https://media.giphy.com/media/Alpha123/giphy.mp4');
 for(const value of ['https://evil.test/a.mp4','../private','javascript:alert(1)'])assert.throws(()=>gifVideoUrl(value));
});
