const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(req.method!=='POST')return json({error:'POSTのみ利用できます'},405);
  try{
    const base=Deno.env.get('SUPABASE_URL'),service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),owner=Deno.env.get('HANAKO_OWNER_USER_ID');
    if(!base||!service||!owner)return json({error:'音声認識のサーバー設定が必要です'},503);
    const authorization=req.headers.get('Authorization')||'';if(!/^Bearer \S+$/.test(authorization))return json({error:'OPSにログインしてください'},401);
    const auth=await fetch(`${base}/auth/v1/user`,{headers:{apikey:service,Authorization:authorization},signal:AbortSignal.timeout(10000)});const user=await auth.json().catch(()=>({}));if(!auth.ok)return json({error:'OPSへのログインを更新してください'},401);if(user.id!==owner)return json({error:'この機能は所有者のみ利用できます'},403);
    const keyResponse=await fetch(`${base}/rest/v1/rpc/hanako_openai_key_read`,{method:'POST',headers:{apikey:service,Authorization:`Bearer ${service}`,'Content-Type':'application/json'},body:JSON.stringify({owner_id:owner}),signal:AbortSignal.timeout(10000)});
    const stored=keyResponse.ok?await keyResponse.json():null;
    const key=typeof stored==='string'&&/^sk-\S+$/.test(stored)?stored:['OPENAI_API_KEY','HanakoOPS Replies'].map(n=>Deno.env.get(n)?.trim()).find(v=>v&&/^sk-\S+$/.test(v));
    if(req.headers.get('Content-Type')?.includes('application/json')){const body=await req.json();if(body.action==='status')return json({configured:Boolean(key),model:'whisper-1'});return json({error:'操作が不正です'},400);}
    if(!key)return json({error:'連携画面でOpenAI APIキーを登録してください。音声認識にはOpenAI接続が必要です。'},503);
    // Bound the body before multipart parsing; never accept arbitrary URLs or full videos.
    const reader=req.body?.getReader();if(!reader)return json({error:'音声を選択してください'},400);const chunks:Uint8Array[]=[];let size=0;
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1100000){await reader.cancel();return json({error:'最大30秒の音声だけ送信できます'},413);}chunks.push(value);}
    const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    const input=await new Response(bytes,{headers:{'Content-Type':req.headers.get('Content-Type')||''}}).formData();
    if(input.get('consent')!=='true')return json({error:'音声送信への同意が必要です'},400);
    const file=input.get('file');if(!(file instanceof File))return json({error:'音声がありません'},400);
    const wav=new Uint8Array(await file.arrayBuffer());if(wav.length<44)return json({error:'音声形式が不正です'},400);const view=new DataView(wav.buffer),tag=(at:number,length:number)=>new TextDecoder().decode(wav.subarray(at,at+length));
    const duration=(wav.length-44)/32000;
    if(tag(0,4)!=='RIFF'||tag(8,8)!=='WAVEfmt '||tag(36,4)!=='data'||view.getUint32(16,true)!==16||view.getUint16(20,true)!==1||view.getUint16(22,true)!==1||view.getUint32(24,true)!==16000||view.getUint16(34,true)!==16||![15,20,30].includes(duration)||view.getUint32(40,true)!==wav.length-44)return json({error:'15・20・30秒のモノラルWAVだけ利用できます'},400);
    const form=new FormData();form.set('file',new Blob([wav],{type:'audio/wav'}),'clip.wav');form.set('model','whisper-1');form.set('response_format','verbose_json');form.set('timestamp_granularities[]','segment');form.set('temperature','0');
    const response=await fetch('https://api.openai.com/v1/audio/transcriptions',{method:'POST',headers:{Authorization:`Bearer ${key}`},body:form,signal:AbortSignal.timeout(65000)});
    if(!response.ok)return json({error:response.status===429?'音声認識の利用上限です。OpenAIの残高・利用制限を確認し、時間をおいてお試しください。':response.status===401?'OpenAI接続を確認してください。':'音声認識に失敗しました。区間を変えるか、時間をおいてお試しください。'},502);
    const result=await response.json();let previousEnd=0,total=0;
    const cues=[];for(const row of Array.isArray(result.segments)?result.segments:[]){const text=String(row.text||'').trim(),start=Math.max(previousEnd,0,Number(row.start)),end=Math.min(duration,Number(row.end));if(!text||row.no_speech_prob>.7||row.avg_logprob< -1.3||!Number.isFinite(start)||!Number.isFinite(end)||end-start<.1||text.length>300||total+text.length+30>2400)continue;const chars=Array.from(text.replace(/\s+/g,' ')),parts=Math.ceil(chars.length/40);if((end-start)/parts<.1)continue;for(let i=0;i<parts&&cues.length<30;i++){const line=chars.slice(i*40,(i+1)*40).join('');cues.push({text:line,start:start+(end-start)*i/parts,end:start+(end-start)*(i+1)/parts});}previousEnd=end;total+=text.length+parts;if(cues.length>=30)break;}
    if(!cues.length)return json({error:'歌詞・音声を認識できませんでした。歌声が聞こえる区間を選ぶか、歌詞を手入力してください。'},422);
    return json({cues,model:'whisper-1',review_required:true});
  }catch(error){return json({error:error instanceof Error&&['TimeoutError','AbortError'].includes(error.name)?'音声認識がタイムアウトしました。時間をおいてお試しください。':'音声を処理できませんでした。ファイル形式と開始位置を確認してください。'},400);}
});
