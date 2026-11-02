// Keep half-second observations and their original timestamps. Denser samples
// are separate visual context, never extra anchor rows or a retimed dance.
export function planMotionBatches(frames,duration){
 if(!Number.isFinite(duration)||duration<2||duration>30||!Array.isArray(frames)||frames.length<2||frames.length>240)throw Error('解析する区間と参考コマを準備し直してください。');
 const sampleInterval=frames[1]?.time;
 if(![.5,.25,.125].includes(sampleInterval)||frames.length!==Math.ceil(duration/sampleInterval))throw Error('区間の冒頭から末尾までの参考コマを、同じ間隔で準備してください。');
 for(const [index,frame]of frames.entries())if(!Number.isFinite(frame.time)||frame.time<0||frame.time>=duration||Math.abs(frame.time-index*sampleInterval)>.0001||typeof frame.dataUrl!=='string')throw Error('参考コマの時刻を確認できません。準備し直してください。');
 const anchors=frames.filter(frame=>Number.isInteger(frame.time*2));
 if(anchors.length!==Math.ceil(duration*2)||anchors.length>60)throw Error('0.5秒ごとの基準コマを省略せず準備してください。');
 const count=Math.ceil(duration/5),batches=[];
 for(let index=0;index<count;index++){
  const from=Math.round(index*anchors.length/count),to=Math.round((index+1)*anchors.length/count),start=anchors[from].time,end=to<anchors.length?anchors[to].time:duration;
  if(end-start>6.01||end<=start)throw Error('解析区間を分割できませんでした。区間を選び直してください。');
  const motionFrames=frames.filter(frame=>frame.time>start&&frame.time<end&&!Number.isInteger(frame.time*2));
  if(motionFrames.length>30)throw Error('細かな動きの参考コマが多すぎます。区間を短くしてください。');
  batches.push({id:`${start}:${end}`,start,end,frames:anchors.slice(from,to+(to<anchors.length?1:0)),motionFrames,sampleInterval});
 }
 return batches;
}
