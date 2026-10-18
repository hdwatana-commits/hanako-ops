import {styles,beatPulse} from './reel-engine.mjs?v=2';
export function drawPhotoScene(ctx,{photos,time,plan}){
  const profile=styles[plan.style];let index=0;while(index+1<plan.shots.length&&plan.shots[index+1].start<=time)index++;
  const shot=plan.shots[index],image=photos[shot.photo]?.image||photos[0]?.image;
  if(!image){ctx.fillStyle=profile.palette[0];ctx.fillRect(0,0,1080,1920);return;}
  const pulse=beatPulse(plan,time),progress=Math.max(0,Math.min(1,(time-shot.start)/(shot.end-shot.start))),family=profile.family;
  ctx.fillStyle=profile.palette[0];ctx.fillRect(0,0,1080,1920);
  if(!['clean','editorial','luxe','travel'].includes(family)){
    const cover=Math.max(1080/image.width,1920/image.height)*1.08;
    ctx.save();ctx.filter=`blur(32px) brightness(.86) ${profile.filter}`;ctx.drawImage(image,(1080-image.width*cover)/2,(1920-image.height*cover)/2,image.width*cover,image.height*cover);ctx.restore();
  }
  if(family==='luxe'){
    const gradient=ctx.createLinearGradient(0,0,1080,1920);gradient.addColorStop(0,'#151416');gradient.addColorStop(1,'#635e60');ctx.fillStyle=gradient;ctx.fillRect(0,0,1080,1920);
    ctx.strokeStyle='rgba(232,219,195,.6)';ctx.lineWidth=2;ctx.strokeRect(56,118,968,1664);
  }
  const frame=['editorial','film','travel'].includes(family);
  if(frame){ctx.save();ctx.shadowColor='rgba(46,32,30,.12)';ctx.shadowBlur=22;ctx.shadowOffsetY=10;ctx.fillStyle=family==='film'?'#f9eddc':'#fffdf9';ctx.fillRect(65,150,950,1630);ctx.restore();}
  const drawImage=(photo,phase,opacity,number)=>{
    const img=photos[photo]?.image||image;
    const base=Math.min((frame?870:1000)/img.width,(frame?1460:1600)/img.height);
    const rhythmic=['street','pop'].includes(family)?pulse*.014:0;
    const scale=base*(1+profile.zoom*(number%2?1-phase:phase)+rhythmic);
    const pan=(family==='clean'?3:family==='street'?12:7)*Math.sin(phase*Math.PI);
    ctx.save();ctx.globalAlpha=opacity;ctx.filter=profile.filter;
    if(family==='travel'){ctx.translate(540,960);ctx.rotate(Math.sin(phase*Math.PI)*.004);ctx.translate(-540,-960);}
    ctx.drawImage(img,(1080-img.width*scale)/2+pan*(number%2?-1:1),(1920-img.height*scale)/2+Math.cos(phase*Math.PI)*6,img.width*scale,img.height*scale);ctx.restore();
  };
  const elapsed=time-shot.start,fade=profile.transition?Math.min(1,elapsed/shot.transition):1;
  if(index>0&&fade<1)drawImage(plan.shots[index-1].photo,1,1,index-1);
  drawImage(shot.photo,progress,index===0?1:fade,index);
  if(family==='film'){
    ctx.save();ctx.globalAlpha=.045;ctx.fillStyle='#3d2b1c';const seed=Math.floor(time*12);
    for(let i=0;i<240;i++){const x=(i*193+seed*71)%1080,y=(i*277+seed*31)%1920;ctx.fillRect(x,y,3,3);}ctx.restore();
    ctx.strokeStyle='rgba(95,63,38,.28)';ctx.lineWidth=2;ctx.strokeRect(78,163,924,1604);
  }
  if(['airy','cinema','travel'].includes(family)){
    const glow=ctx.createRadialGradient(150+Math.sin(time*.3)*80,300,0,150,300,1250);glow.addColorStop(0,family==='travel'?'rgba(255,224,167,.22)':'rgba(255,244,253,.2)');glow.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,1080,1920);
  }
  if(family==='hana'||family==='cute'){
    for(let i=0;i<16;i++){const x=(i*173+Math.sin(time*.6+i)*28)%1080,y=1920-((time*(27+i%4*10)+i*139)%2100);ctx.save();ctx.globalAlpha=.25+.13*Math.sin(time+i);ctx.fillStyle='#ffc1d8';ctx.strokeStyle='#fff';ctx.lineWidth=3;
      if(i%3===0){ctx.font='40px sans-serif';ctx.fillText('♥',x,y);}else if(i%3===1){ctx.beginPath();ctx.arc(x,y,18+i%4*7,0,Math.PI*2);ctx.stroke();}else{ctx.font='32px sans-serif';ctx.fillStyle='#fff';ctx.fillText('✦',x,y);}ctx.restore();}
  }
  if(family==='pop'&&pulse>.25){ctx.fillStyle=`rgba(255,255,255,${pulse*.085})`;ctx.fillRect(0,0,1080,1920);}
  if(family==='street'&&pulse>.45){ctx.strokeStyle=`rgba(255,255,255,${pulse*.3})`;ctx.lineWidth=3;ctx.strokeRect(28,66,1024,1788);}
  if(family==='editorial'){ctx.strokeStyle='rgba(101,81,71,.35)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(95,1812);ctx.lineTo(985,1812);ctx.stroke();}
}
