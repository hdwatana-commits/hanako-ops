import {styles,beatPulse} from './reel-engine.mjs?v=3';
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>1-Math.pow(1-clamp(x),3);
// Uniform transforms preserve faces, clothing and the entire input photo.
export function sceneMotion(family,phase,pulse,index,level=1){
  const energetic=['pop','street','cute'].includes(family),direction=index%2?-1:1;
  return {zoom:1+level*((energetic?.075:.04)*phase+pulse*(energetic?.027:.008)),x:direction*Math.sin(phase*Math.PI)*level*(energetic?24:12),y:Math.sin(phase*Math.PI*2)*level*12,angle:level*(['travel','cute','film'].includes(family)?Math.sin(phase*Math.PI)*.024*direction:0)};
}
function heart(ctx,x,y,size,color){ctx.save();ctx.translate(x,y);ctx.scale(size/40,size/40);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,13);ctx.bezierCurveTo(-38,-9,-17,-34,0,-15);ctx.bezierCurveTo(17,-34,38,-9,0,13);ctx.fill();ctx.restore();}
function star(ctx,x,y,size,color){ctx.save();ctx.translate(x,y);ctx.fillStyle=color;ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,r=i%2?size*.23:size;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.restore();}
function card(ctx,img,x,y,width,height,angle,filter,alpha=1,border=16){
  const fit=Math.min(width/img.width,height/img.height),w=img.width*fit,h=img.height*fit;
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha*=alpha;ctx.shadowColor='rgba(46,19,49,.24)';ctx.shadowBlur=36;ctx.shadowOffsetY=18;ctx.fillStyle='#fffafc';ctx.fillRect(-w/2-border,-h/2-border,w+border*2,h+border*2+border*.8);ctx.shadowBlur=0;ctx.shadowOffsetY=0;ctx.filter=filter;ctx.drawImage(img,-w/2,-h/2,w,h);ctx.restore();
}
export function drawPhotoScene(ctx,{photos,time,plan}){
  const profile=styles[plan.style]||styles.hana,family=profile.family,level=plan.effectLevel??1;
  let index=0;while(index+1<plan.shots.length&&plan.shots[index+1].start<=time)index++;
  const shot=plan.shots[index],image=photos[shot.photo]?.image||photos[0]?.image;
  const pulse=beatPulse(plan,time),phase=clamp((time-shot.start)/(shot.end-shot.start)),elapsed=time-shot.start;
  const bg=ctx.createLinearGradient(0,0,1080,1920);bg.addColorStop(0,profile.palette[0]);bg.addColorStop(.55,family==='luxe'?'#38303d':'#fff7fb');bg.addColorStop(1,profile.palette[1]);ctx.fillStyle=bg;ctx.fillRect(0,0,1080,1920);
  if(image&&!['editorial','clean','luxe','travel'].includes(family)){
    const cover=Math.max(1080/image.width,1920/image.height)*1.15;ctx.save();ctx.globalAlpha=.48;ctx.filter=`blur(40px) ${profile.filter}`;ctx.drawImage(image,(1080-image.width*cover)/2,(1920-image.height*cover)/2,image.width*cover,image.height*cover);ctx.restore();ctx.fillStyle=family==='street'?'rgba(31,16,55,.24)':'rgba(255,235,246,.22)';ctx.fillRect(0,0,1080,1920);
  }
  for(let i=0;i<5;i++){const x=540+Math.sin(time*.35+i*1.8)*620,y=960+Math.cos(time*.24+i)*900,g=ctx.createRadialGradient(x,y,0,x,y,260+i*28);g.addColorStop(0,family==='street'?'rgba(179,129,255,.3)':'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,1080,1920);}
  if(['cute','airy'].includes(family)){ctx.save();ctx.globalAlpha=.14*level;for(let i=0;i<5;i++)heart(ctx,100+i*220,350+Math.sin(time*.6+i)*160+i%2*1000,140+40*Math.sin(time+i),'#f191b7');ctx.restore();}
  if(['pop','street'].includes(family)){ctx.save();ctx.translate(540,960);ctx.rotate(time*.055);ctx.strokeStyle=family==='pop'?'rgba(255,255,255,.45)':'rgba(225,202,255,.5)';ctx.lineWidth=12;for(let i=0;i<8;i++){const r=340+i*125+pulse*45*level;ctx.strokeRect(-r,-r,r*2,r*2);}ctx.restore();}
  const collage=['cute','editorial','travel','film'].includes(family);
  if(image&&collage&&level>=1){card(ctx,photos[(shot.photo+3)%4]?.image||image,140,520,290,440,-.18+Math.sin(time*.8)*.035,profile.filter,.75,12);card(ctx,photos[(shot.photo+1)%4]?.image||image,930,1390,300,440,.15+Math.cos(time*.7)*.035,profile.filter,.8,12);}
  const draw=(photo,progress,opacity,number,incoming=true)=>{
    const img=photos[photo]?.image||image;if(!img)return;
    const m=sceneMotion(family,progress,pulse,number,level),enter=incoming?(1-ease(elapsed/Math.max(.18,shot.transition||.28)))*level:0,dir=number%2?-1:1,intro=index===0?1-ease(time/.55):0;
    let x=540+m.x,y=960+m.y,angle=m.angle;
    if(family==='street')x+=enter*dir*1080;else if(family==='pop')y+=enter*dir*380;else if(collage){y+=enter*180;angle+=enter*.1*dir;}
    const scale=m.zoom*(1-enter*(['pop','street','cute'].includes(family)?.16:.07)-intro*.08),width=(collage?830:family==='clean'?880:900)*scale,height=(collage?1400:1510)*scale;
    ctx.save();ctx.globalAlpha=opacity;if(collage)card(ctx,img,x,y,width,height,angle,profile.filter,1,family==='film'?28:18);else{const fit=Math.min(width/img.width,height/img.height);ctx.translate(x,y);ctx.rotate(angle);ctx.shadowColor='rgba(30,15,35,.22)';ctx.shadowBlur=28;ctx.filter=profile.filter;ctx.drawImage(img,-img.width*fit/2,-img.height*fit/2,img.width*fit,img.height*fit);}ctx.restore();
  };
  const mix=index?clamp(elapsed/Math.max(.18,shot.transition||.28)):1;
  if(index&&mix<1)draw(plan.shots[index-1].photo,1,1-mix,index-1,false);draw(shot.photo,phase,mix,index);
  if(!image){ctx.save();ctx.textAlign='center';ctx.fillStyle=family==='luxe'?'#fff':'#9b4a75';ctx.font='bold 40px sans-serif';ctx.fillText('写真を選ぶと、この演出で動きます',540,960);ctx.restore();}
  const cute=['cute','airy','travel'].includes(family);
  if(cute||family==='pop')for(let i=0;i<24;i++){
    const x=i%2?980+Math.sin(time*.8+i)*38:75+Math.cos(time*.7+i)*35,y=1920-((time*(55+i%5*14)+i*173)%2140);ctx.save();ctx.globalAlpha=(.38+.23*Math.sin(time+i))*Math.min(1.3,level);
    if(cute&&i%3===0)heart(ctx,x,y,35+i%5*9,'#f67cae');else if(cute&&i%3===1){const r=20+i%4*12,g=ctx.createRadialGradient(x-r*.3,y-r*.35,0,x,y,r);g.addColorStop(0,'rgba(255,255,255,.65)');g.addColorStop(.7,'rgba(238,210,255,.08)');g.addColorStop(1,'rgba(255,255,255,.8)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}else star(ctx,x,y,18+i%4*6,'#fff');ctx.restore();
  }
  if(['cute','pop','street'].includes(family)){const burst=clamp(elapsed/.65);for(let i=0;i<10;i++){const a=i*Math.PI/5,x=540+Math.cos(a)*(400+burst*330),y=960+Math.sin(a)*(760+burst*320);ctx.save();ctx.globalAlpha=(1-burst)*.72*level;if(family==='cute')heart(ctx,x,y,55,'#ff83b4');else star(ctx,x,y,26,family==='street'?'#e1c9ff':'#fff8b9');ctx.restore();}if(family==='pop'){ctx.save();ctx.strokeStyle=`rgba(255,255,255,${pulse*.5})`;ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(540,960,480+pulse*70,840+pulse*80,0,0,Math.PI*2);ctx.stroke();ctx.restore();}}
  if(['cinema','airy','film','travel'].includes(family)){const x=-400+(time*.17%1)*1900,g=ctx.createLinearGradient(x-180,0,x+300,1920);g.addColorStop(0,'rgba(255,236,210,0)');g.addColorStop(.5,`rgba(255,236,210,${.16*level})`);g.addColorStop(1,'rgba(255,236,210,0)');ctx.fillStyle=g;ctx.fillRect(0,0,1080,1920);}
  if(family==='film'){ctx.save();ctx.fillStyle='rgba(84,45,32,.1)';const seed=Math.floor(time*12);for(let i=0;i<170;i++)ctx.fillRect((i*193+seed*71)%1080,(i*277+seed*31)%1920,3,3);ctx.restore();}
  if(['editorial','luxe','clean'].includes(family)){ctx.save();ctx.strokeStyle=family==='luxe'?'rgba(241,221,181,.75)':'rgba(134,91,108,.4)';ctx.lineWidth=family==='luxe'?3:2;ctx.strokeRect(38+Math.sin(time)*5,110,1004,1680);for(const x of[60,1020])star(ctx,x,180+Math.sin(time)*20,22+pulse*12,family==='luxe'?'#e9d4a7':'#b77792');ctx.restore();}
}
