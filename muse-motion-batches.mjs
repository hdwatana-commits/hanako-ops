// Keep original clip-relative timestamps. The shared boundary image is context,
// not an extra observation interval or a change to the half-second sample grid.
export function planMotionBatches(frames,duration){
 if(!Number.isFinite(duration)||duration<2||duration>30||!Array.isArray(frames)||frames.length<2||frames.length>60)throw Error('解析する区間と参考コマを準備し直してください。');
 let previous=-1;
 for(const frame of frames){if(!Number.isFinite(frame.time)||frame.time<0||frame.time>=duration||frame.time<=previous||(previous>=0&&frame.time-previous>.501)||typeof frame.dataUrl!=='string')throw Error('参考コマの時刻を確認できません。準備し直してください。');previous=frame.time;}
 if(frames[0].time>.001||frames.at(-1).time<duration-.6)throw Error('区間の冒頭から末尾までの参考コマを準備してください。');
 const count=Math.ceil(duration/5),batches=[];
 for(let index=0;index<count;index++){
  const from=Math.round(index*frames.length/count),to=Math.round((index+1)*frames.length/count),start=frames[from].time,end=to<frames.length?frames[to].time:duration;
  if(end-start>6.01||end<=start)throw Error('解析区間を分割できませんでした。区間を選び直してください。');
  batches.push({id:`${start}:${end}`,start,end,frames:frames.slice(from,to+(to<frames.length?1:0))});
 }
 return batches;
}
