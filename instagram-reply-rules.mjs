export function firstInstagramComments(comments,owner){
 const ordered=[...comments].filter(c=>!c.parent_id).sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp)||String(a.id).localeCompare(String(b.id)));
 const people=new Map();
 for(const c of ordered){
  if(c.from?.id===owner.id||String(c.from?.username||'').toLowerCase()===String(owner.username).toLowerCase())continue;
  if(!c.id||!c.from?.id||!c.from?.username||!Number.isFinite(Date.parse(c.timestamp)))throw Error('利用者IDまたは日時を取得できないため、初回コメントを確認できません');
  if(!people.has(c.from.id))people.set(c.from.id,c);
 }
 return [...people.values()];
}
export function instagramPairFilter(userId,mediaId,authorId){return `user_id=eq.${encodeURIComponent(userId)}&media_id=eq.${encodeURIComponent(mediaId)}&author_id=eq.${encodeURIComponent(authorId)}`;}
