// User-supplied lyrics only. These timings do not perform speech/lyric recognition.
const count = text => Array.from(text).length;
export const captionStyles = { pink:'ふわふわピンク', sparkle:'キラキラホワイト', karaoke:'カラオケ風ポップ' };
export function validateCaptionCues(cues, duration) {
  if (!Array.isArray(cues) || !cues.length) throw Error('字幕に使う歌詞を1行以上入力してください。');
  if (cues.length > 30) throw Error('字幕は30行までです。動画に使う部分だけを入力してください。');
  let previousEnd=0;
  return cues.map((cue,index)=>{
    const text=String(cue.text||'').trim(),start=Number(cue.start),end=Number(cue.end);
    if(!text || count(text)>60) throw Error(`${index+1}行目の字幕は1〜60文字にしてください。長い歌詞は行を分けてください。`);
    if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end>duration+.001||end-start<.1) throw Error(`${index+1}行目の開始・終了時刻を確認してください（動画内で0.1秒以上）。`);
    if(start<previousEnd-.001)throw Error(`${index+1}行目が前の字幕と重なっています。時刻を調整してください。`);
    previousEnd=end;return {text,start,end};
  });
}
export function buildCaptionPlan(value,{duration,start=0,end=duration,offset=0,timeBase='video',audioStart=0,analysis=null}={}) {
  if(!Number.isFinite(duration)||duration<=0||!Number.isFinite(start)||!Number.isFinite(end)||start<0||end>duration||end<=start||!Number.isFinite(offset)||!Number.isFinite(audioStart))throw Error('字幕の表示範囲を動画の長さに合わせてください。');
  const text=String(value||'').replace(/\r/g,'').trim();
  if(!text)throw Error('字幕に使う歌詞を入力してください。');
  if(text.length>2400)throw Error('歌詞は2400文字以内にしてください。');
  const hasLrc=/^\s*\[\d/m.test(text);
  if(hasLrc){
    if (Number(text.match(/^\s*\[offset:([+-]?\d+)\]/mi)?.[1] || 0)) throw Error('LRCのoffsetタグを0にし、「字幕全体をずらす」で補正量を指定してください。');
    const lrcOffset=0;
    const events=[];
    for(const line of text.split('\n')){
      const matches=[...line.matchAll(/\[(\d{1,3}):([0-5]\d)(?:[.:](\d{1,3}))?\]/g)];
      if(!matches.length){if(/^\s*\[\d/.test(line))throw Error('LRCの時刻は [00:12.34] の形式にしてください。');continue;}
      const lyric=line.replace(/\[[^\]]*\]/g,'').trim();
      for(const match of matches){const fraction=match[3]?Number(`0.${match[3]}`):0;events.push({time:Number(match[1])*60+Number(match[2])+fraction+lrcOffset+(timeBase==='audio'?-audioStart:0)+offset,text:lyric});}
    }
    events.sort((a,b)=>a.time-b.time);
    for(let i=1;i<events.length;i++)if(Math.abs(events[i].time-events[i-1].time)<.001)throw Error('同じ時刻の歌詞が重複しています。1行にまとめてください。');
    const cues=events.flatMap((event,index)=>{
      const from=Math.max(start,event.time),to=Math.min(end,events[index+1]?.time??end);
      return event.text&&to-from>=.1?[{text:event.text,start:from,end:to}]:[];
    });
    return {cues:validateCaptionCues(cues,duration),basis:'lrc',message:'LRCの指定時刻で字幕を表示します。'};
  }
  const lines=text.split('\n').map(line=>line.trim()).filter(Boolean);
  if(lines.length>30)throw Error('字幕は30行までです。');
  const from=start+offset,to=end+offset;
  if(from<0||to>duration)throw Error('字幕のずらし量を適用すると動画の外に出ます。表示範囲を調整してください。');
  const minimum=.25;
  if(to-from<minimum*lines.length)throw Error('字幕の表示範囲が短すぎます。行を減らすか範囲を広げてください。');
  const weights=lines.map(line=>Math.max(2,Math.sqrt(count(line))));
  const total=weights.reduce((a,b)=>a+b,0),remaining=(to-from)-minimum*lines.length;
  const beats=(analysis?.reliable?analysis.peaks:[]).map(beat=>beat.time).filter(Number.isFinite);
  const boundaries=[from];let accumulated=0;
  for(let i=0;i<lines.length-1;i++){
    accumulated+=weights[i];const ideal=from+minimum*(i+1)+remaining*accumulated/total;
    const low=boundaries.at(-1)+minimum,high=to-minimum*(lines.length-i-1);
    const candidate=beats.filter(time=>time>=low&&time<=high&&Math.abs(time-ideal)<=.22).sort((a,b)=>Math.abs(a-ideal)-Math.abs(b-ideal))[0];
    boundaries.push(candidate??Math.max(low,Math.min(high,ideal)));
  }
  boundaries.push(to);
  return {cues:validateCaptionCues(lines.map((line,index)=>({text:line,start:boundaries[index],end:boundaries[index+1]})),duration),basis:beats.length?'beat-estimate':'estimate',message:beats.length?'文字量と音楽のビートから推定配置しました。歌唱位置の認識ではありません。':'文字量と表示範囲から推定配置しました。歌い出しは再生・タップで調整してください。'};
}
export function activeCaption(cues,time){return cues.find(cue=>time>=cue.start&&time<cue.end)||null;}
function rounded(ctx,x,y,width,height,radius){ctx.beginPath();ctx.moveTo(x+radius,y);ctx.arcTo(x+width,y,x+width,y+height,radius);ctx.arcTo(x+width,y+height,x,y+height,radius);ctx.arcTo(x,y+height,x,y,radius);ctx.arcTo(x,y,x+width,y,radius);ctx.closePath();}
export function drawCaption(ctx,time,cues,{style='pink',position=1120}={}){
  const cue=activeCaption(cues,time);if(!cue)return;
  const elapsed=time-cue.start,remaining=cue.end-time,progress=Math.max(0,Math.min(1,elapsed/(cue.end-cue.start)));
  let font=64,lines=[];
  const wrap=()=>{const output=[];let current='';for(const char of cue.text){if(ctx.measureText(current+char).width>760&&current){output.push(current);current='';}current+=char;}if(current)output.push(current);return output;};
  ctx.save();
  do{ctx.font=`bold ${font}px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif`;lines=wrap();if(lines.length<=3)break;font-=2;}while(font>=30);
  const height=lines.length*(font+18)+56,width=Math.min(860,Math.max(300,...lines.map(line=>ctx.measureText(line).width+100)));
  const centerY=Math.max(280+height/2,Math.min(1490-height/2,Number(position)||1120));
  ctx.globalAlpha=Math.max(0,Math.min(1,elapsed/.18,remaining/.18));
  ctx.translate(510,centerY-Math.sin(Math.min(1,elapsed/.4)*Math.PI)*10);
  const pop=.96+.04*Math.min(1,elapsed/.2);ctx.scale(pop,pop);
  if(style!=='sparkle'){
    ctx.shadowColor='rgba(111,50,79,.2)';ctx.shadowBlur=14;ctx.shadowOffsetY=5;
    ctx.fillStyle=style==='karaoke'?'rgba(255,255,255,.94)':'rgba(255,226,239,.93)';
    rounded(ctx,-width/2,-height/2,width,height,28);ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;
    ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=4;ctx.stroke();
  }
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.lineWidth=style==='sparkle'?8:5;
  ctx.strokeStyle=style==='sparkle'?'#805367':'#fff';ctx.fillStyle=style==='sparkle'?'#fff':'#a43870';
  lines.forEach((line,index)=>{
    const y=(index-(lines.length-1)/2)*(font+18);ctx.strokeText(line,0,y);ctx.fillText(line,0,y);
    if(style==='karaoke'){
      const lineLength=Array.from(line).length,prior=lines.slice(0,index).reduce((sum,row)=>sum+Array.from(row).length,0);
      const fill=Math.max(0,Math.min(1,(progress*Array.from(cue.text).length-prior)/lineLength));
      const lineWidth=ctx.measureText(line).width;
      ctx.save();ctx.beginPath();ctx.rect(-lineWidth/2-4,y-font/2-8,(lineWidth+8)*fill,font+16);ctx.clip();ctx.fillStyle='#ed72ae';ctx.fillText(line,0,y);ctx.restore();
    }
  });
  ctx.font='34px sans-serif';ctx.fillStyle=style==='sparkle'?'#fff6be':'#e688b2';ctx.fillText(style==='sparkle'?'✦':'♥',-width/2+16,-height/2-10);ctx.fillText('✧',width/2-12,height/2+8);
  ctx.restore();
}
