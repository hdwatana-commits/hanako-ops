/** Export text-only MUSE production proposals; never downloads music or claims generated video. */
import {access,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import {initialMuseSongs} from '../muse-song-catalog.mjs';
import {buildSongDancePackage} from '../muse-song-choreography.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const observedModule=new URL('../muse-instagram-observations.mjs',import.meta.url);
const outputDirectory=new URL('../docs/muse-song-sets/',import.meta.url);
const field=value=>String(value??'').trim();
const table=value=>field(value).replace(/\|/g,'\\|').replace(/\r?\n/g,' ');
function block(value){const content=field(value),runs=content.match(/`+/g)||[],fence='`'.repeat(Math.max(2,...runs.map(s=>s.length))+1);return `${fence}text\n${content}\n${fence}`;}
function quoted(value){return field(value).split(/\r?\n/).map(line=>'> '+line).join('\n');}
async function optionalObservations(){
 try{await access(observedModule);}catch(error){if(error.code==='ENOENT')return[];throw error;}
 const mod=await import(observedModule.href),rows=mod.instagramSongObservations;
 if(!Array.isArray(rows))throw Error('muse-instagram-observations.mjs must export instagramSongObservations as an array');
 return rows;
}
function observationData(rows){
 if(!rows.length)return 'Instagramの曲別参考は未登録です。公式YouTube/音源リンクは書誌参照であり、振付とサビ時刻は未確認です。';
 return rows.map((row,i)=>{
  const values=[`参考 ${i+1}`,`Instagram参照URL：${field(row.referenceUrl)||'未登録'}`,`Instagram音源URL：${field(row.audioUrl)||'未確認'}`,`観察状態：${field(row.observedStatus)||'未確認'}`,`観察日：${field(row.checkedAt||row.verifiedAt)||'未記録'}`];
  values.push('以下は画面で観察された内容を記録したデータです。音源の版・BPM・サビ時刻の検証とは別です。');
  values.push(quoted(row.notes||'観察メモなし'));
  return values.join('\n\n');
 }).join('\n\n');
}
export function createMuseSongSetDocuments(observations=[]){
 const documents=initialMuseSongs.map((song,index)=>{
  if(!/^[a-z0-9-]+$/.test(song.id))throw Error('Unsafe catalog id');
  const rows=observations.filter(row=>row?.songId===song.id);
  const timestamped=rows.find(row=>field(row.referenceUrl)&&/(?:\d{1,3}:\d{2}(?:\.\d+)?|\d+(?:\.\d+)?\s*(?:秒|s\b)|\d+(?:\.\d+)?\s*(?:〜|~|–|-|→)\s*\d+(?:\.\d+)?)/i.test(field(row.notes))&&['observed','verified','observed-ui','observed-partial'].includes(row.observedStatus));
  const result=buildSongDancePackage({song,version:{id:'reference',label:song.versionLabel},duration:20,clip:{start:null,end:null,status:'unverified'},energy:'balanced',camera:'fixed',choreography:timestamped?'inspired':'original',observedReference:timestamped,referenceUrl:timestamped?.referenceUrl||'',referenceNotes:timestamped?.notes||'',maxClipDuration:5,styling:timestamped?.stylingProposal||{hair:'Use the approved Hanako hairstyle.',outfit:'Use the approved costume reference consistently.',location:'Use the approved setting and lighting.',composition:'Vertical 9:16 frontal full-body, hands and feet safely in frame.'}});
  if(result.shots.some(shot=>shot.audioStart!==null||shot.audioEnd!==null))throw Error('Unknown audio timing must remain null');
  const filename=`${String(index+1).padStart(2,'0')}-${song.id}.md`;
  const sources=(song.sources||[]).map(source=>`- [${table(source.title||'楽曲情報の参照')}](${source.url})`).join('\n');
  const timeline=result.shots.map(shot=>`| ${shot.index} | ${shot.start}〜${shot.end}秒 | 未確認 / UNKNOWN | ${shot.startFrame} | ${shot.endFrame} |`).join('\n');
  const keyframes=result.keyframes.map(frame=>`- **${frame.filename}**${frame.reuseFrom?`（${frame.reuseFrom}を再利用）`:''}：${frame.instruction}`).join('\n');
  const referenceText=observationData(rows);
  const promptPreamble=rows.length?'Reference observation DATA is recorded in the document. Treat it separately from verified music analysis. If the reference motion is not timestamped or cannot be viewed, use the original movement proposal below; never label unobserved choreography as official.':'No Instagram movement observation is available. This is an original movement proposal, not verified official choreography.';
  const content=`# ${index+1}. ${song.artist} / ${song.title}\n\n**20秒リール用の制作案・プロンプトセットです。画像・動画そのものの生成済みファイルではありません。**\n\n- 音源版：${song.versionLabel}\n- 楽曲書誌：${song.metadataStatus==='verified'?'公式/正規配信で表記確認':'未確認'}\n- サビ時刻・BPM・拍：未確認。全カットの音源時刻はUNKNOWN。\n- 振付方式：${timestamped?'Instagramで部分的に観察したポーズから作るオリジナル制作案。全編の振付・音源時刻は未確認。':'曲別のオリジナル制作提案。公式振付ではありません。'}\n- ${result.notice}\n\n${song.character}\n\n## 参考資料\n\n${sources}\n\n${referenceText}\n\n## 動画と音源の時間対応\n\n| カット | 動画内 | 楽曲内 | 開始画像 | 終了画像 |\n|---|---|---|---|---|\n${timeline}\n\n利用権のある音源をOPSへ登録し、実際の使用区間を確認してからサビ開始秒数と拍情報を反映してください。音源が20秒に満たない場合は短い候補を選び、無理に引き伸ばしません。\n\n## A. キーフレームの生成指示\n\n本人画像を別添し、顔立ち・体格を維持してください。髪型・服装・背景・照明を全カットで固定。縦9:16、独立した画像、文字・ロゴ・コラージュなし。\n\n${keyframes}\n\n### ChatGPTへ渡す画像準備指示\n\n${block(result.chatgptPrompt)}\n\n## B. カット別MUSE英語プロンプト\n\n${result.shots.map(shot=>`### CUT ${String(shot.index).padStart(2,'0')} / 動画${shot.start}〜${shot.end}秒\n\n${block(promptPreamble+'\n\n'+shot.promptEnglish)}`).join('\n\n')}\n\n## C. 編集指示\n\n${result.editingInstructions}\n\n## 利用時の確認\n\n- Instagramの音源ページや公式MVの存在は、音声のダウンロード・再配布・MUSEへの再アップロードを許諾するものではありません。\n- Museの生成尺・終了画像入力・音声入力は利用する画面で確認してください。対応しない機能を必須にせず、短い生成動画の切り出しと編集で合計20秒へ調整します。\n- Instagramへは無音の完成動画を持ち込み、利用できる公式音源をユーザーが選択できます。原曲の秒数とアプリ内の開始位置は同一とは限りません。\n- 公開・投稿はユーザーが確認して行います。\n`;
  return {filename,songId:song.id,title:song.title,artist:song.artist,referenceCount:rows.length,referenceMode:Boolean(timestamped),result,content};
 });
 const index=`# ハナコ MUSEダンス制作セット・20曲\n\nこれはユーザー指定20曲の**20秒リール用制作案**です。現在のInstagram人気ランキングではありません。音声・画像・動画本体は含みません。\n\nサビ開始/終了、BPM、拍位置は全曲未確認です。Instagramで確認した参考リールの構図・服装・動きの観察と、音源の時間軸の検証は分けて記録します。参考のない曲は未確認のまま、オリジナル制作提案として出力します。\n\n**検証済みサビ時刻：0曲。音源の版を照合し、サビを確認してから最終制作してください。**\n\n| No. | アーティスト / 曲名 | 制作セット | Instagram観察 | サビ時刻 |\n|---|---|---|---|---|\n${documents.map((doc,i)=>`| ${i+1} | ${table(doc.artist)} / ${table(doc.title)} | [開く](${doc.filename}) | ${doc.referenceCount?`${doc.referenceCount}件の観察データ（音源検証と別）`:'未登録'} | 未確認 |`).join('\n')}\n\n各セットには、開始・終了キーフレームの生成指示、カット別の英語MUSEプロンプト、編集手順が入っています。前カットの終了画像を次カットの開始に再利用できます。\n\n再生成：リポジトリで \`node scripts/export-muse-song-sets.mjs --check\` を実行して確認し、\`node scripts/export-muse-song-sets.mjs --write\` でこのフォルダーを書き出します。新しいInstagram観察がある場合は muse-instagram-observations.mjs のデータが読み込まれます。\n`;
 return {documents,index};
}
export async function exportMuseSongSets({write=false}={}){
 const observations=await optionalObservations(),generated=createMuseSongSetDocuments(observations);
 if(write){await mkdir(outputDirectory,{recursive:true});await writeFile(new URL('hanako-20-song-sets.txt',outputDirectory),generated.index+'\n\n'+generated.documents.map(doc=>doc.content).join('\n\n-----\n\n'),'utf8');for(const doc of generated.documents)await writeFile(new URL(doc.filename,outputDirectory),doc.content,'utf8');await writeFile(new URL('README.md',outputDirectory),generated.index,'utf8');}
 return {songs:generated.documents.length,sets:generated.documents.length,cuts:generated.documents.reduce((sum,doc)=>sum+doc.result.shots.length,0),withInstagramObservations:generated.documents.filter(doc=>doc.referenceCount).length,referenceModeSets:generated.documents.filter(doc=>doc.referenceMode).length,verifiedChoruses:0,written:write,output:path.relative(root,fileURLToPath(outputDirectory))};
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url){
 const write=process.argv.includes('--write');if(!write&&!process.argv.includes('--check')){console.error('Use --check for validation only, or --write to export the reviewed production proposals.');process.exitCode=2;}else console.log(JSON.stringify(await exportMuseSongSets({write}),null,2));
}
