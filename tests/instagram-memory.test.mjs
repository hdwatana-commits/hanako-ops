import test from 'node:test';
import assert from 'node:assert/strict';
import {instagramReplyMemory} from '../supabase/functions/threads-replies/instagram.ts';

test('Instagram履歴は所有者・安定IDで絞り、他人の返信は本文だけを重複回避へ渡す',async()=>{
 const queries=[];
 const db=async query=>{
  queries.push(query);
  return query.includes('author_id=')?[{comment_id:'old',comment_text:'青が好き',caption:'青い服',reply_text:'青もいいよね',status:'published'}]:[{reply_text:'ありがとう'},{reply_text:null}];
 };
 const memory=await instagramReplyMemory(db,'owner','author','current');
 assert.equal(queries.length,2);
 for(const q of queries){assert.match(q,/^hanako_ig_reply_queue\?user_id=eq.owner&status=eq.published&comment_id=neq.current/);assert.doesNotMatch(q,/hanako_reply_comments/);}
 assert.match(queries[0],/author_id=eq.author&order=commented_at.desc&limit=20/);
 assert.match(queries[1],/order=updated_at.desc&limit=12&select=reply_text$/);
 assert.equal(memory.instagram_history[0].post_text,'青い服');
 assert.deepEqual(memory.instagram_recent_replies,['ありがとう']);
});
