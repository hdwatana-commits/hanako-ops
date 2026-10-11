export const FAN_PROFILE_FIELDS={foods:'好きな食べ物',vegetables:'好きな野菜',place:'本人が話した地域',age:'本人が話した年齢',character:'本人が話した性格',style:'本人が希望する会話・距離感'};
export function mergeFanProfile(previous={},rows=[]){
 const result={...previous};
 for(const r of [...rows].sort((a,b)=>String(a.commented_at).localeCompare(String(b.commented_at)))){
  if(r.is_owner||!r.comment_id)continue;
  const text=String(r.comment_text||'').normalize('NFKC');
  // Only direct first-person declarations; questions and conjecture are not facts.
  if(/[?？]|(?:じゃない|ではない|だったら|かもしれ|例えば|友達|妻|夫|彼女|彼氏)/.test(text))continue;
  const checks={
   foods:/(?:^|[。！!\n])\s*(?:(?:私は|僕は|俺は|自分は|私の|僕の|俺の)?好きな食べ物(?:は|が)|my favou?rite food is)\s*([^。！!\n.]{1,60})/i,
   vegetables:/(?:^|[。！!\n])\s*(?:(?:私は|僕は|俺は|自分は|私の|僕の|俺の)?好きな野菜(?:は|が)|my favou?rite vegetable is)\s*([^。！!\n.]{1,60})/i,
   place:/(?:私は|僕は|俺は|自分は)\s*([^。！!\n]{1,25}?)(?:に住んで(?:います|る)|在住です)/,
   age:/(?:私は|僕は|俺は|自分は)\s*(\d{1,3})歳(?:です|だよ|になります)/,
   character:/(?:私は|僕は|俺は|自分は)\s*(人見知り|のんびり|せっかち|おしゃべり|マイペース|照れ屋|おっとり)(?:です|だよ|な性格)/,
   style:/(?:私は|僕は|俺は|自分は)\s*([^。！!\n]{1,60}?(?:話が好き|会話が好き|話は苦手|敬語がいい|タメ口がいい))/
  };
  for(const [key,re] of Object.entries(checks)){
   const m=text.match(re);if(!m)continue;
   if(key==='age'&&(Number(m[1])<1||Number(m[1])>120))continue;
   if(key==='place'&&/\d|丁目|番地|号室|マンション|アパート/.test(m[1]))continue;
   const at=r.commented_at||'';if(result[key]?.at&&result[key].at>at)continue;
   result[key]={value:m[1].trim()+(key==='age'?'歳':''),source_id:r.comment_id,quote:text.slice(0,160),at,kind:'本人の発言（要確認）'};
  }
 }
 return result;
}
export function fanReplyContext(profile){
 if(!profile)return null;
 // Age and residence stay in the owner dashboard, not in AI personalization.
 return {preferences:Object.fromEntries(['foods','vegetables','style'].filter(k=>profile.auto_profile?.[k]).map(k=>[k,{value:profile.auto_profile[k].value,kind:'本人の発言（要確認）'}])),owner_notes:profile.use_notes?profile.manual_notes||'':''};
}
