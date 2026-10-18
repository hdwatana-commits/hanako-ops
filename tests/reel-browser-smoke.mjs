import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/hdwat/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base = path.resolve('.');
const server = createServer(async (req,res) => {
  const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file = path.resolve(base, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(base + path.sep)) {res.writeHead(403).end();return;}
  try { const data = await readFile(file); const ext = path.extname(file); res.setHeader('Content-Type', ({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'})[ext] || 'application/octet-stream'); res.end(data); } catch {res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try {
 browser = await chromium.launch({channel:'chrome',headless:true});
 const page = await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 await page.route('**/*', async route => {
 const url = new URL(route.request().url());
 if (url.hostname !== '127.0.0.1') return route.abort();
 const file = path.resolve(base, '.' + (url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname)));
 if (!file.startsWith(base + path.sep)) return route.abort();
 try { const ext=path.extname(file); await route.fulfill({body:await readFile(file),contentType:({'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'})[ext]||'application/octet-stream'}); } catch {await route.fulfill({status:404,body:''});}
});
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/`);
 await page.click('.home-hero-actions [data-open-view="reels"]');
 await page.waitForSelector('#reelGenerate');
 assert.equal(await page.locator('#viewTitle').textContent(),'Instagram → リール自動制作');
 await page.click('#reelGenerate'); assert.match(await page.locator('#reelStatus').textContent(),/4枚/);
 const png = await page.evaluate(()=>{ const c=document.createElement('canvas');c.width=540;c.height=675;const x=c.getContext('2d');x.fillStyle='#f3a7c5';x.fillRect(0,0,540,675);x.fillStyle='white';x.font='48px sans-serif';x.fillText('HANAKO',130,330);return c.toDataURL().split(',')[1]; });
 await page.setInputFiles('#reelPhotos',Array.from({length:4},(_,i)=>({name:`photo-${i}.png`,mimeType:'image/png',buffer:Buffer.from(png,'base64')})));
 await page.waitForFunction(()=>document.querySelectorAll('#reelPhotoList img').length===4);
 const rate=16000, samples=rate*16, wav=Buffer.alloc(44+samples*2);
 wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(samples*2,40);
 for(let i=0;i<samples;i++){const phase=i%(rate/2);const value=phase<600?Math.sin(i*2*Math.PI*440/rate)*Math.exp(-phase/100)*.7:0;wav.writeInt16LE(Math.round(value*32767),44+i*2);}
 await page.setInputFiles('#reelAudio',{name:'licensed-test.wav',mimeType:'audio/wav',buffer:wav});await page.check('#reelRights');
 await page.click('details:has(#reelText) > summary'); await page.locator('#reelText').fill('かわいい\n今日のコーデ');
 await page.click('#reelGenerate');
 await page.waitForFunction(()=>!document.querySelector('#reelResult').hidden,{},{timeout:45000});
 const info=await page.evaluate(async()=>{const v=document.querySelector('#reelPreview');await new Promise((resolve,reject)=>{if(v.readyState>=1)resolve();else{v.onloadedmetadata=resolve;v.onerror=reject;}});return {width:v.videoWidth,height:v.videoHeight,duration:v.duration,bytes:(await(await fetch(v.src)).blob()).size,status:document.querySelector('#reelStatus').textContent};});
 assert.equal(info.width,1080);assert.equal(info.height,1920);assert.ok(info.duration>=14.5&&info.duration<17);assert.ok(info.bytes>10000);
 await page.screenshot({path:'tests/reel-mobile-preview.png',fullPage:true});
 const [download] = await Promise.all([page.waitForEvent('download'), page.click('#reelDownload')]);
  assert.equal(download.suggestedFilename(),'hanako-reel.mp4');
 const bytes = await page.evaluate(async()=>Array.from(new Uint8Array(await(await fetch(document.querySelector('#reelPreview').src)).arrayBuffer())));
 await writeFile('tests/reel-smoke-output.mp4',Buffer.from(bytes));
 const mp4 = Buffer.from(bytes); assert.ok(mp4.includes(Buffer.from('avc1'))); assert.ok(mp4.includes(Buffer.from('mp4a')));
 await page.click('[data-view="products"]');await page.waitForSelector('#products.active');
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({passed:true,...info,errors},null,2));
} finally {await browser?.close();await new Promise(resolve=>server.close(resolve));}
