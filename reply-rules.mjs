export const TONES = { calm: 'おだやか', friendly: '親しみやすい', energetic: '元気', cute: 'あざと可愛い', flirty: 'ほんのり思わせぶり' };
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
  if (input.ai_connection !== undefined) {
    if (!['default','secondary','third'].includes(input.ai_connection)) throw new Error('Gemini接続が不正です');
    value.ai_connection=input.ai_connection;
  }
  return value;
}
