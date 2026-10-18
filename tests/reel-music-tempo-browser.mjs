import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/hdwat/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
const audio={audio_id:'1234',title:'公式テスト音源',artist:'テストアーティスト',duration_ms:60000,preview_url:null,instagram_url:'https://www.instagram.com/reels/audio/1234/',is_ads_eligible:false};
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[],actions=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('hanako-cloud-session',JSON.stringify({access_token:'test-user-token',expires_at:Math.floor(Date.now()/1000)+3600,user:{id:'test-user'}})));
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.pathname.endsWith('/functions/v1/instagram-audio')){
   const body=route.request().postDataJSON();actions.push(body.action);
   const responses={search:{audio:[audio]},metadata:{audio},prepare:{job_id:'test-job',upload_url:'https://hanako.test/upload'},createReel:{state:'IN_PROGRESS'},jobStatus:{state:'FINISHED'},publish:{state:'published',published_id:'888'},deleteVideo:{deleted:true}};
   return route.fulfill({json:responses[body.action]||{}});
  }
  if(url.pathname==='/upload')return route.fulfill({json:{uploaded:true}});
  if(url.hostname!=='hanako.test')return route.abort();
  if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="reel-maker.css"><section id="reels"></section><script>window.HANAKO_CLOUD_CONFIG={supabaseUrl:"https://hanako.test",supabaseAnonKey:"public-key"}</script><script src="cloud-sync.js"></script><script type="module" src="reel-maker.mjs"></script></html>'});
  const file=path.resolve('.'+url.pathname);try{return route.fulfill({body:await readFile(file),contentType:({'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css'})[path.extname(file)]||'application/octet-stream'});}catch{return route.fulfill({status:404,body:''});}
 });
 await page.goto('https://hanako.test/');await page.selectOption('#reelMode','instagram');assert.equal(await page.locator('#reelInstagramMusic').isVisible(),true);assert.equal(await page.locator('#reelAudioPanel').isVisible(),false);
 await page.fill('#reelMusicQuery','テスト');await page.click('#reelMusicSearch');await page.getByRole('button',{name:'この曲を選ぶ',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#reelMusicSelected').textContent.includes('公式テスト音源'));
 await page.getByRole('button',{name:'☆ お気に入り',exact:true}).click();await page.click('#reelMusicFavorites');assert.equal(await page.locator('.reel-music-track').count(),1);
 await page.click('#reelMusicTempoReset');
 for(let i=0;i<4;i++){await page.click('#reelMusicTapTempo');if(i<3)await page.waitForTimeout(480);}
 const tapped=Number(await page.locator('#reelMusicBpm').inputValue());assert.ok(tapped>=80&&tapped<=140);
 await page.fill('#reelMusicBpm','144');await page.locator('#reelMusicBpm').dispatchEvent('input');
 await page.click('#reelAnalyzeEdit');await page.waitForFunction(()=>document.querySelector('#reelEditSummary').textContent.includes('144 BPM'));
 assert.match(await page.locator('#reelEditSummary').textContent(),/指定 144 BPM/);
 const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=540;c.height=675;const x=c.getContext('2d');x.fillStyle='#f5bfd5';x.fillRect(0,0,540,675);return c.toDataURL().split(',')[1];});
 await page.setInputFiles('#reelPhotos',Array.from({length:4},(_,i)=>({name:`p${i}.png`,mimeType:'image/png',buffer:Buffer.from(png,'base64')})));
 await page.waitForFunction(()=>document.querySelectorAll('#reelPhotoList img').length===4);await page.click('#reelGenerate');
 await page.waitForFunction(()=>!document.querySelector('#reelResult').hidden,{},{timeout:40000});
 assert.match(await page.locator('#reelMusicPublishTrack').textContent(),/公式テスト音源/);assert.equal(actions.includes('publish'),false);
 await page.click('#reelMusicPrepare');await page.waitForFunction(()=>document.querySelector('#reelMusicPublishStatus').textContent.includes('投稿準備が完了'));
 assert.equal(await page.locator('#reelMusicPublish').isDisabled(),true);assert.equal(actions.includes('publish'),false);
 await page.check('#reelMusicConsent');await page.click('#reelMusicPublish');await page.waitForFunction(()=>document.querySelector('#reelMusicPublishStatus').textContent.includes('公開しました'));
 assert.equal(actions.filter(x=>x==='publish').length,1);assert.deepEqual(errors,[]);
 await page.screenshot({path:'tests/reel-music-tempo-preview.png',fullPage:true});
 console.log(JSON.stringify({passed:true,actions,errors}));
}finally{await browser.close();}
