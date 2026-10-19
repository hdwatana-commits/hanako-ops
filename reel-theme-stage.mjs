const limit=x=>Math.max(0,Math.min(1,x));
export const themeStories={
 cute:'リボンで開幕 → ハートの写真便り → 花びらシャワーでフィナーレ',
 cinema:'光の幕開け → ワイドスクリーンの移動 → 光の余韻で締める',
 pop:'放射線で登場 → カラーブロックと弾む星 → 紙吹雪のフィナーレ',
 editorial:'表紙からスタート → ページをめくる写真特集 → 最終号の表紙へ',
 clean:'アーチの光 → 重なる彫刻的フレーム → ゆっくり光が広がる',
 film:'フィルムリーダー → コマ送りと光漏れ → フィルム枠の余韻で締める',
 airy:'オーロラの幕 → 花びらと透明な軌道 → 光の星が広がる',
 luxe:'金の扉が開く → 宝石の軌道とアールデコ → 金色の光でフィナーレ',
 street:'ネオン走査で登場 → 斜めの帯とグリッド → ネオンが交差する',
 travel:'旅のルートが出発 → 切手と写真のスクラップ → 旅の記録が完成'
};
// Bound the entire foreground, even when the source is a wide landscape photo.
export function sceneLayout(family,index,phase,level=1){
 const variation=index%3,travel=Math.sin(limit(phase)*Math.PI)*Math.min(1.35,Math.max(.55,level));
 const editorial=family==='editorial',scrap=['cute','film','travel'].includes(family);
 return {x:540+(editorial?(variation-1)*26:family==='street'?Math.sin(index)*16:0)*travel,
 y:960+(scrap?(variation-1)*20:0)*travel,
 width:editorial?(variation===1?750:800):scrap?800:870,
 height:editorial?(variation===1?1280:1370):scrap?1370:1450,
 angle:scrap?(variation-1)*.012*travel:0,variation};
}
function line(ctx,points,color,width=3){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();}
function sparkle(ctx,x,y,r,color){ctx.fillStyle=color;ctx.beginPath();for(let j=0;j<8;j++){const a=j*Math.PI/4,d=j%2?r*.2:r;ctx.lineTo(x+Math.cos(a)*d,y+Math.sin(a)*d);}ctx.closePath();ctx.fill();}
export function drawThemeStage(ctx,{family,time,index,phase,pulse,duration,level,front=false}){
 const intro=1-limit(time/.85),finale=limit((time-duration+2.4)/2.4),beat=pulse*level;
 ctx.save();
 if(!front){
  if(family==='cute'){
   for(let k=0;k<3;k++){ctx.strokeStyle=['#ed95bb88','#fff8','#d4b8ed77'][k];ctx.lineWidth=12-k*3;ctx.beginPath();for(let y=-100;y<2020;y+=16){const x=540+Math.sin(y/210+time*.65+k)*470;y===-100?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();}
  }else if(family==='cinema'){
   for(let k=0;k<3;k++){const x=((time*90+k*410)%1700)-300,g=ctx.createLinearGradient(x,0,x+250,0);g.addColorStop(0,'#ffffff00');g.addColorStop(.5,'#fff3d842');g.addColorStop(1,'#ffffff00');ctx.fillStyle=g;ctx.fillRect(x,0,250,1920);}
  }else if(family==='pop'){
   ctx.translate(540,960);ctx.rotate(index*.35+time*.025);for(let k=0;k<16;k++){ctx.rotate(Math.PI/8);ctx.fillStyle=k%2?'#ffe0a5':'#ffc9e0';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(1700,-140);ctx.lineTo(1700,140);ctx.fill();}
  }else if(family==='editorial'){
   ctx.fillStyle='#fffdf8';ctx.fillRect(34,150,1012,1620);line(ctx,[[64,320],[1016,320]],'#291f31',3);ctx.fillStyle='#352838';ctx.font='900 104px Georgia,serif';ctx.textAlign='center';ctx.fillText('STYLE FILE',540,280);ctx.font='22px sans-serif';ctx.fillText(`FASHION JOURNAL     /     ${String(index+1).padStart(2,'0')}`,540,1735);
  }else if(family==='clean'){
   for(let k=0;k<4;k++){ctx.strokeStyle=['#ffffffaa','#cfb9ad66'][k%2];ctx.lineWidth=20-k*4;ctx.beginPath();ctx.ellipse(540,1040,450+k*50+beat*8,780+k*60,-.09+Math.sin(time*.2)*.03,Math.PI,2*Math.PI);ctx.stroke();}
  }else if(family==='film'){
   ctx.fillStyle='#35251fe0';ctx.fillRect(0,0,70,1920);ctx.fillRect(1010,0,70,1920);ctx.fillStyle='#f4dfba';for(let y=-100;y<2020;y+=100){const v=y+(time*65%100);ctx.fillRect(20,v,30,46);ctx.fillRect(1030,v,30,46);}
  }else if(family==='airy'){
   for(let k=0;k<5;k++){ctx.strokeStyle=['#e5b6f855','#fff9','#b9e7e955'][k%3];ctx.lineWidth=52;ctx.beginPath();ctx.ellipse(540+Math.sin(time*.3+k)*100,960,490+k*70,750+k*90,Math.sin(time*.14+k)*.3,0,Math.PI*2);ctx.stroke();}
  }else if(family==='luxe'){
   for(let k=0;k<5;k++){const inset=32+k*14;line(ctx,[[inset,420],[inset,190],[200,190],[200,130],[880,130],[880,190],[1080-inset,190],[1080-inset,420]],'#dec49699',2);line(ctx,[[inset,1500],[inset,1770],[1080-inset,1770],[1080-inset,1500]],'#dec49677',2);}
  }else if(family==='street'){
   ctx.strokeStyle='#c9a1fa66';ctx.lineWidth=2;for(let y=180;y<1920;y+=110)line(ctx,[[0,y+time*30%110],[1080,y+time*30%110]],'#c9a1fa55',2);for(let x=-800;x<1800;x+=150)line(ctx,[[540,500],[x,1920]],'#c9a1fa55',2);
  }else if(family==='travel'){
   ctx.strokeStyle='#907b6977';ctx.lineWidth=4;ctx.setLineDash([9,15]);ctx.beginPath();ctx.moveTo(60,1500);ctx.bezierCurveTo(1250,1800,-200,300,1010,270);ctx.stroke();ctx.setLineDash([]);for(let k=0;k<4;k++){ctx.save();ctx.translate(k%2?970:100,340+k*380);ctx.rotate((k%2?1:-1)*.14);ctx.fillStyle='#fff9e8';ctx.fillRect(-65,-70,130,140);ctx.strokeStyle='#a18b72';ctx.strokeRect(-53,-58,106,116);ctx.font='24px serif';ctx.fillStyle='#826d5b';ctx.textAlign='center';ctx.fillText('JOURNEY',0,10);ctx.restore();}
  }
 }else{
  // Framing stays at the edges; the full original photo and later caption layer stay readable.
  if(['cute','airy','pop'].includes(family))for(let k=0;k<32;k++){
   const drift=(time*(75+k%7*12)+k*181)%2200,y=drift-140,x=k%2?1000+Math.sin(time+k)*35:80+Math.cos(time*.7+k)*40;
   ctx.save();ctx.translate(x,y);ctx.rotate(time*(k%2?1:-1)+k);ctx.globalAlpha=(.3+finale*.5)*Math.min(1,level);ctx.fillStyle=family==='pop'?['#ff638d','#ffcf56','#bc96ff'][k%3]:['#f4a6cb','#fff','#dbc3fa'][k%3];ctx.beginPath();ctx.ellipse(0,0,9+k%4*4,22+k%3*5,0,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  if(family==='luxe'||family==='airy'){for(let k=0;k<12;k++){const a=time*.2+k*Math.PI/6,x=540+Math.cos(a)*485,y=960+Math.sin(a)*800;sparkle(ctx,x,y,8+(beat+finale)*18,family==='luxe'?'#ffe3a4':'#fff');}}
  if(family==='street'){ctx.globalAlpha=.45;for(let k=0;k<3;k++){const y=(time*480+k*650)%2100-100;line(ctx,[[0,y+120],[150,y],[900,y],[1080,y-140]],k%2?'#fb87e6':'#c5ffed',5+beat*4);}}
  if(family==='cinema'){ctx.fillStyle='#18121d';const bar=52+intro*400;ctx.fillRect(0,0,1080,bar);ctx.fillRect(0,1920-bar,1080,bar);line(ctx,[[70,140],[70,210],[150,210]],'#fff8',2);line(ctx,[[1010,1780],[1010,1710],[930,1710]],'#fff8',2);}
  if(family==='film'){ctx.fillStyle='#fce8bd';ctx.font='22px monospace';ctx.fillText(`35mm   ${String(index+1).padStart(2,'0')}   FASHION`,98,1740);}
  if(family==='editorial'&&phase<.24){const p=limit(phase/.24);ctx.globalAlpha=(1-p)*.65;ctx.fillStyle='#fffdf4';ctx.beginPath();ctx.moveTo(1080*(1-p),0);ctx.lineTo(1080,0);ctx.lineTo(1080,1920);ctx.closePath();ctx.fill();}
  if(family==='clean'){line(ctx,[[65,260],[65,160],[230,160]],'#fff',5);line(ctx,[[1015,1660],[1015,1760],[850,1760]],'#fff',5);}
  if(intro>0){ctx.globalAlpha=intro;ctx.fillStyle=family==='luxe'?'#211b24':family==='street'?'#5d437e':'#fff1f5';const w=540*intro;ctx.fillRect(0,0,w,1920);ctx.fillRect(1080-w,0,w,1920);}
  if(finale>0){ctx.globalAlpha=finale*.75;ctx.strokeStyle=family==='luxe'?'#ebcc86':'#ffffff';ctx.lineWidth=3;const d=40+24*(1-finale);ctx.strokeRect(d,120,1080-d*2,1680);for(let k=0;k<8;k++)sparkle(ctx,k%2?1010:70,240+k*210,12+finale*14,ctx.strokeStyle);}
 }
 ctx.restore();
}
