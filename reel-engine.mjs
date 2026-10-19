// Music analysis stays on the device. BPM is an estimate, not genre recognition.
export const styles = {
  hana:{label:'ハナ・かわいい',description:'ハートが弾ける、きらめく写真コラージュ',beats:4,zoom:.035,minHold:.9,transition:.18,palette:['#ffe3ef','#f8bad3'],filter:'none',family:'cute'},
  cinema:{label:'シネマ・ムード',description:'立体ズームと流れる光のシネマ演出',beats:8,zoom:.018,minHold:1.8,transition:.5,palette:['#ded4cc','#9b8e85'],filter:'saturate(.85) contrast(1.03)',family:'cinema'},
  pop:{label:'ポップ・テンポ',description:'弾む写真、星のバーストとリズムリング',beats:2,zoom:.045,minHold:.65,transition:.08,palette:['#ffe4ad','#ffc4d9'],filter:'saturate(1.08)',family:'pop'},
  editorial:{label:'雑誌風エディトリアル',description:'重なる表紙カード、立体感のある雑誌風',beats:4,zoom:.022,minHold:1.1,transition:.22,palette:['#f9f6f0','#d8c6bc'],filter:'saturate(.91) contrast(1.02)',family:'editorial'},
  clean:{label:'クリーン・ミニマル',description:'浮かぶ写真と細いフレーム、上品な光',beats:4,zoom:.012,minHold:1.4,transition:.38,palette:['#fffef9','#e9e6df'],filter:'saturate(.9) brightness(1.03)',family:'clean'},
  film:{label:'パリ・フィルム',description:'揺れるポラロイド、光漏れとフィルム粒子',beats:4,zoom:.025,minHold:1.2,transition:.3,palette:['#f0d4ab','#b99a7a'],filter:'sepia(.16) saturate(.87) contrast(1.04)',family:'film'},
  airy:{label:'エアリー・ソフト',description:'大きなハートと透明な泡、夢のような光',beats:8,zoom:.023,minHold:1.6,transition:.6,palette:['#ffedf1','#e9e5fa'],filter:'saturate(.85) brightness(1.05)',family:'airy'},
  luxe:{label:'モノクロ・ラグジュアリー',description:'モノクロ写真に金のフレームと星の輝き',beats:8,zoom:.015,minHold:1.6,transition:.35,palette:['#2b292b','#bcb7b2'],filter:'grayscale(1) contrast(1.08)',family:'luxe'},
  street:{label:'ストリート・ビート',description:'左右に滑る写真、回転するネオンフレーム',beats:2,zoom:.04,minHold:.6,transition:.06,palette:['#ddd8ef','#6b6283'],filter:'saturate(.91) contrast(1.07)',family:'street'},
  travel:{label:'トラベル・ダイアリー',description:'旅の写真が重なる、動くスクラップブック',beats:4,zoom:.026,minHold:1.1,transition:.3,palette:['#f4e6cc','#a6c9cc'],filter:'sepia(.08) saturate(.96) brightness(1.03)',family:'travel'},
};
const quantile=(array,q)=>{const sorted=[...array].sort((a,b)=>a-b);return sorted[Math.floor((sorted.length-1)*q)]||0;};
export function analyze(samples,rate){
  if(!Number.isFinite(rate)||rate<=0)throw Error('音声のサンプルレートが不正です。');
  const hop=Math.max(1,Math.round(rate*.02)),energy=[],novelty=[];let low=0,previous=0,previousBass=0,previousHigh=0,highTotal=0,total=0;
  const alpha=1-Math.exp(-2*Math.PI*180/rate);
  for(let i=0;i<samples.length;i+=hop){
    let sum=0,bass=0,high=0;
    const length=Math.min(hop,samples.length-i);
    for(let j=i;j<i+length;j++){const x=samples[j];low+=alpha*(x-low);sum+=x*x;bass+=low*low;high+=(x-low)*(x-low);}
    const rms=Math.sqrt(sum/length),b=Math.sqrt(bass/length),h=Math.sqrt(high/length);energy.push(rms);
    novelty.push(Math.max(0,rms-previous)+.7*Math.max(0,b-previousBass)+.35*Math.max(0,h-previousHigh));previous=rms;previousBass=b;previousHigh=h;highTotal+=high;total+=sum;
  }
  const peaks=[];
  for(let i=2;i<novelty.length-2;i++){
    const local=novelty.slice(Math.max(0,i-25),i),mean=local.reduce((a,b)=>a+b,0)/local.length;
    if(energy[i]>.006&&novelty[i]>Math.max(.002,mean*1.5)&&novelty[i]>=novelty[i-1]&&novelty[i]>novelty[i+1]){
      const time=i*hop/rate;if(!peaks.length||time-peaks.at(-1).time>.23)peaks.push({time,strength:novelty[i]});
    }
  }
  const intervals=peaks.slice(1).map((p,i)=>p.time-peaks[i].time).filter(t=>t<1.5),bins=new Map();
  for(const interval of intervals){let bpm=60/interval;while(bpm<65)bpm*=2;while(bpm>185)bpm/=2;const bin=Math.round(bpm/2)*2;bins.set(bin,(bins.get(bin)||0)+1);}
  const candidate=[...bins].sort((a,b)=>b[1]-a[1])[0]?.[0]||null;
  const fit=candidate?intervals.filter(t=>Math.abs(t/(60/candidate)-Math.round(t/(60/candidate)))<.15).length/Math.max(1,intervals.length):0;
  const reliable=peaks.length>=6&&intervals.length>=4&&fit>=.55;
  const confidence=reliable?Math.min(.95,.45+.4*fit+.1*Math.min(1,peaks.length/30)):Math.min(.45,fit*.4);
  const strong=quantile(peaks.map(p=>p.strength),.8)||1;
  peaks.forEach(p=>{p.accent=Math.min(1,p.strength/strong);});
  const sections=[];
  for(let i=0;i<energy.length;i+=25){const window=energy.slice(Math.max(0,i-12),Math.min(energy.length,i+38));sections.push({time:i*hop/rate,energy:window.reduce((a,b)=>a+b,0)/Math.max(1,window.length),intensity:.5});}
  const quiet=quantile(sections.map(s=>s.energy),.15),loud=quantile(sections.map(s=>s.energy),.9),contrast=loud>.001?(loud-quiet)/loud:0;
  sections.forEach(s=>{s.intensity=contrast>.12?Math.max(0,Math.min(1,(s.energy-quiet)/Math.max(.001,loud-quiet))):.5;});
  const duration=samples.length/rate,beats=[];
  if(reliable){const period=60/candidate;let best=peaks[0].time%period,score=-1;
    for(const phasePeak of peaks.slice(0,12)){const phase=phasePeak.time%period;const value=peaks.reduce((sum,p)=>{const distance=Math.abs((p.time-phase)/period-Math.round((p.time-phase)/period));return sum+(distance<.15?p.accent*(1-distance):0);},0);if(value>score){score=value;best=phase;}}
    for(let t=best;t<duration;t+=period){const nearby=peaks.find(p=>Math.abs(p.time-t)<.06);beats.push({time:nearby?.time??t,strength:nearby?.accent??.35,inferred:!nearby});}
  }
  return {bpm:candidate,peaks,beats,reliable,confidence,sections,contrast,brightness:total?Math.min(1,highTotal/total):0,duration};
}
export function intensityAt(analysis,time){const rows=analysis?.sections;if(!rows?.length)return .5;const index=Math.max(0,Math.min(rows.length-1,Math.floor(time/.5)));return rows[index].intensity;}
export function chooseStyle(requested,analysis,manualBpm=0){
  if(requested!=='auto')return styles[requested]?requested:'hana';
  const bpm=manualBpm||(analysis?.reliable?analysis.bpm:0);
  if(!bpm)return 'hana';
  if(bpm>=140)return analysis?.contrast>.35?'street':'pop';
  if(bpm<=88)return 'airy';
  if(analysis?.contrast<.16)return 'clean';
  if(bpm<=108)return 'cinema';
  return 'editorial';
}
export function createEditPlan(duration,requested,analysis,{offset=0,manualBpm=0,manualSource='manual',photoCount=4}={}){
  photoCount=Number.isInteger(photoCount)&&photoCount>=4&&photoCount<=12?photoCount:4;
  const style=chooseStyle(requested,analysis,manualBpm),profile=styles[style],cuts=[0];
  const actual=Boolean(analysis?.reliable),bpm=manualBpm||(actual?analysis.bpm:0);
  let beats=manualBpm?Array.from({length:Math.ceil((duration+2)*manualBpm/60)},(_,i)=>({time:i*60/manualBpm+offset,strength:.5})):(actual?(analysis.beats?.length?analysis.beats:analysis.peaks).map(p=>({time:p.time+offset,strength:p.strength||.5})):[]);
  const source=manualBpm?manualSource:actual?'audio':'estimated';
  if(!beats.length)beats=Array.from({length:Math.ceil(duration*2)},(_,i)=>({time:i*.5+offset,strength:.35}));
  const maximumHold=Math.max(Math.min(profile.minHold,duration/photoCount*.7),duration/photoCount-(60/(bpm||120))*.5);
  let count=0;
  for(const beat of beats){
    const t=beat.time;if(t<0)continue;
    const intensity=intensityAt(analysis,t-offset),dynamic=actual&&analysis.contrast>.12;
    const step=dynamic&&intensity>.75?Math.max(2,profile.beats/2):dynamic&&intensity<.2?Math.min(12,profile.beats*2):profile.beats;
    if((count>=step||t-cuts.at(-1)>=maximumHold)&&t-cuts.at(-1)>=profile.minHold&&t<duration-.4){cuts.push(t);count=0;}count++;
  }
  while(cuts.length<photoCount){let longest=0;for(let i=1;i<cuts.length;i++)if((cuts[i+1]??duration)-cuts[i]>(cuts[longest+1]??duration)-cuts[longest])longest=i;cuts.splice(longest+1,0,(cuts[longest]+(cuts[longest+1]??duration))/2);}
  const shots=cuts.map((start,i)=>({start,end:cuts[i+1]??duration,photo:i%photoCount,intensity:intensityAt(analysis,start-offset),transition:Math.min((cuts[i+1]??duration)-start,profile.transition*(actual&&intensityAt(analysis,start-offset)>.75?.7:1))}));
  return {style,requested,bpm,source,beats,shots,cuts,duration,offset,confidence:actual?analysis.confidence:0,contrast:analysis?.contrast||0};
}
export function beatPulse(plan,time){let pulse=0;for(const beat of plan.beats){const delta=time-beat.time;if(delta>=0&&delta<.24)pulse=Math.max(pulse,Math.exp(-delta*15)*Math.min(1,beat.strength||.5));}return pulse;}
export function timeline(duration,style,analysis,offset=0,manualBpm=0){return createEditPlan(duration,style,analysis,{offset,manualBpm}).cuts;}
