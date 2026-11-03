// Pure, local finishing helpers. Beat accents never retime or invent choreography.
const round=value=>Number(value.toFixed(6));
const finite=(value,label)=>{if(typeof value!=='number'||!Number.isFinite(value))throw Error(`${label}を数値で指定してください。`);return value;};
export function normalizeMusePolish(input={}, {duration}={}){
 finite(duration,'仕上げる長さ');if(duration<=0||duration>30.034)throw Error('仕上げる長さは30秒以内にしてください。');
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('仕上げ設定を確認してください。');
 const beatStyle=input.beatStyle??'none';if(!['none','soft','sparkle'].includes(beatStyle))throw Error('拍の演出を選び直してください。');
 const supplied=input.beatTimes??[];if(!Array.isArray(supplied)||supplied.length>240)throw Error('拍位置は240個以内にしてください。');
 const beatTimes=[...new Set(supplied.map(value=>{finite(value,'拍位置');if(value<0||value>=duration)throw Error('拍位置を完成動画の範囲内にしてください。');return round(Math.min(value,duration-.000001));} ))].sort((a,b)=>a-b);
 let caption=null;
 if(input.caption?.text!=null&&typeof input.caption.text!=='string')throw Error('テロップを文字で入力してください。');
 if(input.caption?.text?.trim()){
  const raw=input.caption;
  const text=raw.text.replace(/\r\n?/g,'\n').trim();if(Array.from(text).length>60||text.split('\n').length>4)throw Error('テロップは60文字・4行以内にしてください。');
  const start=finite(raw.start??0,'テロップ開始'),end=finite(raw.end??Math.min(duration,3),'テロップ終了');
  if(start<0||end>duration+.000001||end<=start)throw Error('テロップの開始・終了を完成動画の範囲内にしてください。');
  const position=raw.position??'lower',color=raw.color??'white';
  if(!['upper','lower'].includes(position)||!['white','pink'].includes(color))throw Error('テロップの位置・色を選び直してください。');
  caption={text,start,end,position,color,fade:Math.min(.2,(end-start)/3)};
 }
 return{caption,beatStyle:beatTimes.length?beatStyle:'none',beatTimes,duration};
}
export function polishFrameState(config,time){
 finite(time,'映像位置');const caption=config.caption;let captionAlpha=0;
 if(caption&&time>=caption.start&&time<caption.end)captionAlpha=Math.max(0,Math.min(1,(time-caption.start)/caption.fade,(caption.end-time)/caption.fade));
 let beatIndex=-1;for(let index=0;index<config.beatTimes.length&&config.beatTimes[index]<=time;index++)beatIndex=index;
 const age=beatIndex<0?Infinity:time-config.beatTimes[beatIndex],pulse=config.beatStyle==='none'||age>=.36?0:Math.exp(-age*8)*(1-age/.36);
 return{captionAlpha,beatIndex,pulse,subjectScale:config.beatStyle==='none'?1:.985+.015*pulse,sparkle:config.beatStyle==='sparkle'&&pulse>.001};
}
export function captionSafeBox(width=1080,height=1920,position='lower'){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0||!['upper','lower'].includes(position))throw Error('テロップの画角・位置を確認してください。');
 return{x:width*.08,y:height*(position==='upper'?.23:.63),width:width*.74,height:height*.15};
}
function captionLines(ctx,text,maxWidth){
 const lines=[];for(const line of text.split('\n')){let current='';for(const letter of Array.from(line)){if(current&&ctx.measureText(current+letter).width>maxWidth){lines.push(current);current=letter;}else current+=letter;}lines.push(current);}return lines;
}
export function layoutMuseCaption(ctx,caption,width=1080,height=1920){
 const box=captionSafeBox(width,height,caption.position),unit=width/1080,padding=16*unit,availableWidth=box.width-padding*2,availableHeight=box.height-padding*2;
 let size=64*unit,lines=[];
 // Hard line breaks are preserved. A long hard line can wrap into more than
 // four visual rows; fit the complete result rather than slicing away words.
 for(let pass=0;pass<48;pass++){
  ctx.font=`700 ${size}px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", sans-serif`;lines=captionLines(ctx,caption.text,availableWidth);
  const widest=Math.max(...lines.map(line=>ctx.measureText(line).width),0);
  if(widest<=availableWidth+.001&&lines.length*size*1.3<=availableHeight+.001)break;
  const fit=Math.min(availableWidth/Math.max(widest,1),availableHeight/Math.max(lines.length*size*1.3,1));size=Math.max(unit,Math.min(size-2*unit,size*fit*.98));
 }
 return{box,fontSize:size,lines,lineHeight:size*1.3,x:box.x+box.width/2,y:box.y+padding,maxWidth:availableWidth,availableHeight};
}
export function drawMusePolish(ctx,width,height,config,time){
 const state=polishFrameState(config,time);
 if(state.sparkle){
  ctx.save();ctx.globalAlpha=state.pulse*.65;ctx.strokeStyle='#fff7fc';ctx.lineWidth=2.5*width/1080;
  for(let index=0;index<4;index++){
   const x=width*(index%2?.92:.04),y=height*(.22+((index*3+state.beatIndex)%7)*.075),size=width*(.006+.004*state.pulse);
   ctx.beginPath();ctx.moveTo(x-size,y);ctx.lineTo(x+size,y);ctx.moveTo(x,y-size);ctx.lineTo(x,y+size);ctx.stroke();
  }
  ctx.restore();
 }
 if(config.caption&&state.captionAlpha>0){
  const caption=config.caption;ctx.save();ctx.globalAlpha=state.captionAlpha;const layout=layoutMuseCaption(ctx,caption,width,height),size=layout.fontSize;
  ctx.textAlign='center';ctx.textBaseline='top';ctx.lineJoin='round';ctx.lineWidth=Math.max(3,size*.075);ctx.strokeStyle='rgba(50,25,43,.86)';ctx.fillStyle=caption.color==='pink'?'#ffafd5':'#ffffff';ctx.shadowColor='rgba(24,12,22,.62)';ctx.shadowBlur=10*width/1080;ctx.shadowOffsetY=3*height/1920;
  for(const [index,line]of layout.lines.entries()){const y=layout.y+index*layout.lineHeight;ctx.strokeText(line,layout.x,y,layout.maxWidth);ctx.fillText(line,layout.x,y,layout.maxWidth);}
  ctx.restore();
 }
 return state;
}
export function trimMuseCutSpecs(shots,{start=0,end}={}){
 if(!Array.isArray(shots)||!shots.length)throw Error('仕上げるCUTを指定してください。');
 const total=shots.reduce((sum,shot)=>{const duration=finite(shot.duration,'CUT秒数');if(duration<=0||duration>30)throw Error('CUTの秒数を確認してください。');const inPoint=finite(shot.inPoint??0,'素材の開始位置');if(inPoint<0)throw Error('素材の開始位置を確認してください。');return sum+duration;},0);end=end??total;finite(start,'仕上げ開始');finite(end,'仕上げ終了');
 if(start<0||end>total+.000001||end<=start||end-start<1/30)throw Error('ループ用の使用区間は素材内で1コマ以上にしてください。');
 let cursor=0;const result=[];
 for(const shot of shots){const left=Math.max(start,cursor),right=Math.min(end,cursor+shot.duration),speed=shot.playbackRate??1;if(![1,2].includes(speed))throw Error('速度は1倍または明示した2倍にしてください。');if(right>left+.000001)result.push({...shot,inPoint:round((shot.inPoint??0)+(left-cursor)*speed),duration:round(right-left)});cursor+=shot.duration;}
 return result;
}
/** Pixel comparison is only a seam hint: it cannot establish matching identity or pose. */
export function assessLoopPixels({first,last,afterFirst,beforeLast,width,height}={}){
 const size=width*height*4;
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<2||height<2||![first,last,afterFirst,beforeLast].every(value=>value?.length===size))throw Error('ループ比較用の画像を読み取れませんでした。');
 let appearance=0,motion=0,activity=0;
 for(let index=0;index<size;index+=4){
  for(let channel=0;channel<3;channel++){
   const at=index+channel,a=first[at],b=last[at],incoming=b-beforeLast[at],outgoing=afterFirst[at]-a;
   if(![a,b,incoming,outgoing].every(Number.isFinite))throw Error('ループ比較用の画素が不正です。');
   appearance+=Math.abs(a-b);motion+=Math.abs(incoming-outgoing);activity+=Math.abs(incoming)+Math.abs(outgoing);
  }
 }
 const denominator=width*height*3*255,appearanceDifference=round(appearance/denominator),motionDifference=round(motion/denominator),movement=round(activity/denominator/2);
 const candidate=appearanceDifference<.065&&motionDifference<.045;
 return{status:candidate?'candidate':'review',appearanceDifference,motionDifference,movement,requiresReview:true,reason:candidate?'画像の見た目と前後の変化が近い候補です。顔・姿勢・移動方向・音楽はプレビューで確認してください。':'最初と最後に差があります。顔・姿勢・移動方向を見比べ、自然につながる区間を手動で選んでください。',method:'low_resolution_pixel_difference',identityVerified:false,beatVerified:false};
}
