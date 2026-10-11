export const FAN_PROFILE_FIELDS={foods:'好きな食べ物',vegetables:'好きな野菜',place:'本人が話した地域',age:'本人が話した年齢',character:'本人が話した性格',style:'本人が希望する会話・距離感'};
export function safeNickname(value){return typeof value==='string'&&/^[\p{L}\p{M}ー・]{2,20}$/u.test(value)&&!/(?:エロ|変態|奴隷|おじ|おば|童貞|処女|豚|ブス|バカ|馬鹿|会い|電話|sex|fuck|slave)/i.test(value);}
export function japaneseUsername(value){
 const stem=String(value||'').split(/[._]/)[0].replace(/\d+$/,'').toLowerCase();
 if(!/^[a-z]{2,12}$/.test(stem))return '';
 const common={john:'ジョン',mike:'マイク',tom:'トム',alex:'アレックス',jack:'ジャック',james:'ジェームズ',bob:'ボブ',chris:'クリス'};
 if(common[stem])return common[stem];
 const kana={shi:'し',chi:'ち',tsu:'つ',fu:'ふ',ji:'じ',sha:'しゃ',shu:'しゅ',sho:'しょ',cha:'ちゃ',chu:'ちゅ',cho:'ちょ',ja:'じゃ',ju:'じゅ',jo:'じょ'};
 const vowels='aiueo';
 for(const [consonant,row] of Object.entries({k:'かきくけこ',s:'さしくせそ',t:'たちつてと',n:'なにぬねの',h:'はひふへほ',m:'まみむめも',r:'らりるれろ',g:'がぎぐげご',z:'ざじずぜぞ',d:'だぢづでど',b:'ばびぶべぼ',p:'ぱぴぷぺぽ'}))for(let i=0;i<5;i++)kana[consonant+vowels[i]]=row[i];
 for(const [prefix,base] of Object.entries({ky:'き',gy:'ぎ',ny:'に',hy:'ひ',by:'び',py:'ぴ',my:'み',ry:'り'}))for(const [v,small] of Object.entries({a:'ゃ',u:'ゅ',o:'ょ'}))kana[prefix+v]=base+small;
 Object.assign(kana,{a:'あ',i:'い',u:'う',e:'え',o:'お',ya:'や',yu:'ゆ',yo:'よ',wa:'わ',wo:'を'});
 let remaining=stem,out='';const keys=Object.keys(kana).sort((a,b)=>b.length-a.length);
 while(remaining){
  if(remaining[0]==='n'&&(remaining.length===1||!/^[aiueoy]/.test(remaining[1]))){out+='ん';remaining=remaining.slice(1);continue;}
  if(remaining[0]===remaining[1]&&/^[kstpgbzdhfmr]$/.test(remaining[0])){out+='っ';remaining=remaining.slice(1);continue;}
  const key=keys.find(k=>remaining.startsWith(k));if(!key)return '';out+=kana[key];remaining=remaining.slice(key.length);
 }
 return out;
}
export function profileNickname(profile,username){
 if(profile?.nickname_enabled===false||profile?.auto_profile?.nickname_stop?.value)return '';
 const named=profile?.manual_nickname||profile?.auto_profile?.nickname?.value;
 if(safeNickname(named))return named;
 if(profile?.auto_profile?.nickname_language?.value!=='ja')return '';
 const reading=japaneseUsername(username);
 return reading&&safeNickname(reading+'っち')?reading+'っち':'';
}
export function mergeFanProfile(previous={},rows=[]){
 const result={...previous};
 for(const r of [...rows].sort((a,b)=>String(a.commented_at).localeCompare(String(b.commented_at)))){
  if(r.is_owner||!r.comment_id)continue;
  const text=String(r.comment_text||'').normalize('NFKC');
  const languageText=text.replace(/https?:\/\/\S+|@[a-zA-Z0-9._]+/g,'');
  if(/[\p{L}]/u.test(languageText)&&(!result.nickname_language?.at||result.nickname_language.at<=(r.commented_at||'')))result.nickname_language={value:/[\u3041-\u3096\u30A1-\u30FA]/u.test(languageText)?'ja':'other',at:r.commented_at||''};
  if(/(?:あだ名|名前).{0,12}(?:やめて|呼ばない)|呼ばないで/.test(text))result.nickname_stop={value:true,at:r.commented_at,source_id:r.comment_id};
  const nickname=text.match(/(?:^|[。！!\n])\s*([\p{L}\p{M}ー・]{2,20})(?:って|と)呼んで(?:ね|ください|ほしい|$)/u);
  if(nickname&&safeNickname(nickname[1]))result.nickname={value:nickname[1],at:r.commented_at,source_id:r.comment_id,quote:text.slice(0,160)};
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
 return {nickname:profileNickname(profile,profile.username),preferences:Object.fromEntries(['foods','vegetables','style'].filter(k=>profile.auto_profile?.[k]).map(k=>[k,{value:profile.auto_profile[k].value,kind:'本人の発言（要確認）'}])),owner_notes:profile.use_notes?profile.manual_notes||'':''};
}
