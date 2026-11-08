export function geminiDailyQuota(error){
 const evidence=[String(error?.message||'')];
 for(const detail of Array.isArray(error?.details)?error.details:[]){
  for(const v of Array.isArray(detail?.violations)?detail.violations:[])evidence.push(String(v.quotaId||''),String(v.description||''),String(v.quotaMetric||''));
 }
 return evidence.some(value=>/per[\s_-]*day|daily (?:request|quota|limit)|\bRPD\b/i.test(value));
}

export function geminiResumeAt(now=Date.now()){
 const jst=new Date(now+9*3600000);
 let reset=Date.UTC(jst.getUTCFullYear(),jst.getUTCMonth(),jst.getUTCDate(),8,5);
 if(reset<=now)reset+=86400000;
 return new Date(reset).toISOString();
}

export function geminiFallbackState(preferred,until,now=Date.now()){
 if(preferred!=='gemini'||!until)return 'none';
 const expires=Date.parse(until);
 return !Number.isFinite(expires)?'none':expires>now?'active':'expired';
}
