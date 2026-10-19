export const isVideoSource=file=>file?.type?.startsWith('video/')||/\.(mov|mp4|m4v)$/i.test(file?.name||'');
export function validateSource(file){if(!file)throw Error('音楽ファイルまたは画面収録の動画を選んでください。');const limit=isVideoSource(file)?150:40;if(file.size>limit*1024*1024)throw Error(`音楽は40MB、動画は150MBまでです。動画は必要な部分だけ短くして選んでください。`);}
export async function decodeSource(context,file){validateSource(file);try{return await context.decodeAudioData(await file.arrayBuffer());}catch{throw Error('このファイルの音声を読み取れません。音声のあるMP4/MOVを選ぶか、M4Aなどの音声ファイルに変換してください。録画が無音の場合は音声を取り込めません。');}}
export function audioClipWav(buffer,start,duration){
  if(!Number.isFinite(start)||start<0||![15,20,30].includes(duration)||start+duration>buffer.duration+.001)throw Error('音楽の開始位置と動画の長さを確認してください。');
  const rate=16000,count=duration*rate,out=new ArrayBuffer(44+count*2),view=new DataView(out),label=(at,text)=>{for(let i=0;i<text.length;i++)view.setUint8(at+i,text.charCodeAt(i));};
  label(0,'RIFF');view.setUint32(4,out.byteLength-8,true);label(8,'WAVEfmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);label(36,'data');view.setUint32(40,count*2,true);
  const channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i));let energy=0;
  for(let i=0;i<count;i++){const pos=(start+i/rate)*buffer.sampleRate,at=Math.floor(pos),fraction=pos-at;let value=0;for(const channel of channels)value+=((channel[at]||0)*(1-fraction)+(channel[at+1]||0)*fraction)/channels.length;value=Math.max(-1,Math.min(1,value));energy+=value*value;view.setInt16(44+i*2,Math.round(value*(value<0?32768:32767)),true);}
  if(Math.sqrt(energy/count)<.001)throw Error('選択区間が無音に近いため、歌詞を認識できません。開始位置や録画の音声を確認してください。');return new Blob([out],{type:'audio/wav'});
}
