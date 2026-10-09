export const TONES = { calm: 'おだやか', friendly: '親しみやすい', energetic: '元気', cute: 'あざと可愛い', flirty: 'ほんのり思わせぶり' };
export const RELATIONSHIP_LEVELS = [
  {name:'はじめまして',comments:0,days:0,replies:0,tone:'親しみやすく、軽い照れ。初対面で恋人扱いしない。'},
  {name:'顔なじみ',comments:3,days:2,replies:2,tone:'また話せた嬉しさと、覚えている好みを自然に伝える。'},
  {name:'気になる存在',comments:8,days:3,replies:5,tone:'相手も好意的なら、ちょっと意識している照れと控えめな甘さ。'},
  {name:'甘えたくなる存在',comments:20,days:5,replies:12,tone:'相手も甘い会話を楽しんでいるなら、親しい気遣いや小さな甘え。'},
  {name:'恋人みたいな距離',comments:40,days:10,replies:25,tone:'互いに好意的な会話の中だけで、彼女みたいな温かさと遊び心。交際の事実や独占は主張しない。'}
];
export function relationshipLevel(stats={}) {
  let level=0;
  RELATIONSHIP_LEVELS.forEach((r,i)=>{if((stats.comments||0)>=r.comments&&(stats.active_days||0)>=r.days&&(stats.replies||0)>=r.replies)level=i;});
  return {level,...RELATIONSHIP_LEVELS[level]};
}
export function inWindow(settings, now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tokyo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now).map(p => [p.type,p.value]));
  const weekday = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(parts.weekday);
  const time = `${parts.hour}:${parts.minute}`;
  const start = settings.start_time.slice(0,5), end = settings.end_time.slice(0,5);
  // Overnight windows belong to the weekday on which they start.
  if (start > end) return time >= start ? settings.weekdays.includes(weekday) : time < end && settings.weekdays.includes((weekday+6)%7);
  return settings.weekdays.includes(weekday) && (start === end || (time >= start && time < end));
}
export function validateSettings(input) {
  const value = { enabled: input.enabled, mode: input.mode, start_time: input.start_time, end_time: input.end_time,
    weekdays: input.weekdays, delay_minutes: input.delay_minutes, tones: input.tones, adapt_tone: input.adapt_tone,
    custom_prompt: input.custom_prompt, max_chars: input.max_chars, use_history: input.use_history };
  for (const key of ['enabled','adapt_tone','use_history']) if (typeof value[key] !== 'boolean') throw new Error('切り替え設定が不正です');
  if (!['draft','auto'].includes(value.mode)) throw new Error('返信モードが不正です');
  for (const key of ['start_time','end_time']) if (!/^([01]\d|2[0-3]):[0-5]\d(:00)?$/.test(value[key])) throw new Error('時間が不正です');
  if (!Array.isArray(value.weekdays) || !value.weekdays.length || value.weekdays.some(x=>!Number.isInteger(x)||x<0||x>6)) throw new Error('曜日を選んでください');
  if (!Array.isArray(value.tones) || !value.tones.length || value.tones.length>5 || value.tones.some(x=>typeof x!=='string'||!Object.hasOwn(TONES,x))) throw new Error('テンションを選んでください');
  if (!Number.isInteger(value.delay_minutes)||value.delay_minutes<0||value.delay_minutes>1440) throw new Error('待ち時間は0〜1440分です');
  if (!Number.isInteger(value.max_chars)||value.max_chars<20||value.max_chars>500) throw new Error('文字数は20〜500です');
  if (typeof value.custom_prompt!=='string'||value.custom_prompt.length>8000) throw new Error('カスタマイズは8000文字以内です');
  if(input.delay_mode!==undefined){if(!['normal','instant'].includes(input.delay_mode))throw new Error('返信速度モードが不正です');value.delay_mode=input.delay_mode;}
  if (input.ai_connection !== undefined) {
    if (!['default','secondary','third'].includes(input.ai_connection)) throw new Error('Gemini接続が不正です');
    value.ai_connection=input.ai_connection;
  }
  for(const name of ['ng_users','ng_words']) if(input[name]!==undefined) {
    if(!Array.isArray(input[name])||input[name].length>200||input[name].some(x=>typeof x!=='string'||x.length>100))throw new Error('NGリストは各200件、1件100文字以内です');
    value[name]=[...new Set(input[name].map(x=>x.normalize('NFKC').trim()).filter(Boolean).map(x=>name==='ng_users'?x.replace(/^@/,'').toLowerCase():x))];
    if(name==='ng_users'&&value[name].some(x=>! /^[a-z0-9._]{1,30}$/.test(x)))throw new Error('NG対象者はThreadsのユーザー名を1行ずつ入力してください');
  }
  return value;
}
export function exclusionReason(settings,comment) {
  const normalize=x=>String(x||'').normalize('NFKC').trim().toLowerCase();
  if((settings.ng_users||[]).some(x=>normalize(x).replace(/^@/,'')===normalize(comment.username).replace(/^@/,'')))return 'NG対象者のため自動返信しません';
  if((settings.ng_words||[]).some(x=>normalize(x)&&normalize(comment.comment_text).includes(normalize(x))))return 'NGワードを含むため自動返信しません';
  return '';
}
export function replyClock(now=new Date()) {
  const hour=Number(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tokyo',hour:'2-digit',hourCycle:'h23'}).format(now));
  return {time:now.toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'}),period:hour>=5&&hour<11?'朝':hour>=11&&hour<17?'昼':'夜'};
}
export function wrongGreeting(text,now=new Date()) {
  const period=replyClock(now).period;
  const morning=/おはよ|good\s*morning|早上好|早安|좋은\s*아침/i.test(text);
  const evening=/こんばん[はわ]|good\s*evening|晚上好|晚安/i.test(text);
  return (period!=='朝'&&morning)||(period!=='夜'&&evening);
}
