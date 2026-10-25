import {stopChoiceReprompt} from './reply-rules.mjs';
export function answeredQuestions(turns){
 const results=[];
 for(let i=0;i<turns.length-1;i++){
  const question=turns[i],answer=turns[i+1];
  if(!question.is_owner||answer.is_owner||answer.parent_id!==question.comment_id)continue;
  for(const text of String(question.comment_text||'').match(/[^。！？!?\n]*[?？]/gu)||[]){
   if(String(answer.comment_text||'').trim())results.push({question:text.trim(),answer:answer.comment_text,answer_id:answer.comment_id});
  }
 }
 return results;
}
export async function loadThreadContext(db,ownerId,c,enabled){
 if(!enabled||!c.post_id||!c.username)return {same_post_history:[],thread_ancestors:[],answered_questions:[],context_enabled:false};
 const base=`hanako_reply_comments?user_id=eq.${encodeURIComponent(ownerId)}&post_id=eq.${encodeURIComponent(c.post_id)}&username=eq.${encodeURIComponent(c.username)}&is_owner=eq.false&comment_id=neq.${encodeURIComponent(c.comment_id)}&commented_at=lte.${encodeURIComponent(c.commented_at||new Date().toISOString())}`;
 const fields='comment_id,parent_id,comment_text,reply_text,post_text,commented_at,status,reply_id,reply_published_at';
 const recent=await db(`${base}&order=commented_at.desc&limit=40&select=${fields}`);
 const first=await db(`${base}&order=commented_at.asc&limit=10&select=${fields}`);
 const history=[...new Map([...first,...recent].map(x=>[x.comment_id,x])).values()].sort((a,b)=>Date.parse(a.commented_at)-Date.parse(b.commented_at)).map(h=>({...h,reply_text:h.status==='published'?h.reply_text:null}));
 const ancestors=[],seen=new Set([c.comment_id]);let parent=c.parent_id;
 for(let depth=0;parent&&depth<12&&!seen.has(parent);depth++){
  seen.add(parent);
  const rows=await db(`hanako_reply_comments?user_id=eq.${encodeURIComponent(ownerId)}&post_id=eq.${encodeURIComponent(c.post_id)}&comment_id=eq.${encodeURIComponent(parent)}&commented_at=lte.${encodeURIComponent(c.commented_at||new Date().toISOString())}&select=comment_id,parent_id,comment_text,commented_at,is_owner,username`);
  const row=rows[0];if(!row||(!row.is_owner&&row.username!==c.username))break;
  ancestors.unshift(row);parent=row.parent_id;
 }
 const current={comment_id:c.comment_id,parent_id:c.parent_id,comment_text:c.comment_text,is_owner:false};
 const pairs=[...answeredQuestions([...ancestors,current])];
 if(/白|🤍|white/i.test(c.post_text||'')&&/黒|🖤|black/i.test(c.post_text||'')){
  for(const answer of [...history,current])if(/白|黒|両方|どっちも|グレー|選べない|選ばない|🤍|🖤/.test(answer.comment_text||'')&&!/[?？]|どっちが|どちらが/.test(answer.comment_text||''))pairs.push({question:'白と黒、どっちが好き？',answer:answer.comment_text,answer_id:answer.comment_id});
 }
 for(const h of history){
  if(h.status!=='published'||!h.reply_id||!h.reply_text)continue;
  const answers=[...history,current].filter(a=>a.parent_id===h.reply_id);
  for(const answer of answers)pairs.push(...answeredQuestions([{comment_id:h.reply_id,comment_text:h.reply_text,is_owner:true},{...answer,is_owner:false}]));
 }
 return {same_post_history:history,thread_ancestors:ancestors,answered_questions:[...new Map(pairs.map(p=>[p.question+'|'+p.answer_id,p])).values()],context_enabled:true};
}
export function avoidAnsweredQuestions(text,answered=[]){
 if(answered.some(a=>/白|🤍|white/i.test(a.question)&&/黒|🖤|black/i.test(a.question)))text=stopChoiceReprompt(text);
 const clean=s=>String(s||'').toLowerCase().replace(/[\p{P}\p{S}\p{M}\s]/gu,'');
 const grams=s=>new Set(Array.from({length:Math.max(0,s.length-1)},(_,i)=>s.slice(i,i+2)));
 const matches=(a,b)=>{a=clean(a);b=clean(b);if(a===b)return true;if(a.length<6||b.length<6)return false;const x=grams(a),y=grams(b);const overlap=[...x].filter(v=>y.has(v)).length;return overlap/Math.max(x.size,y.size)>=0.72;};
 return String(text||'').split(/(?<=[。！？!?])|(?=\n)|(?<=\n)/u).filter(part=>!(/[?？]/.test(part)&&answered.some(a=>matches(part,a.question)))).join('').trim()||'ありがとう☺️';
}
