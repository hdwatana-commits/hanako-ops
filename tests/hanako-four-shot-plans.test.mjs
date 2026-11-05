import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const source=readFileSync(new URL('app.js',root),'utf8');
const library=readFileSync(new URL('hanako-four-shot-plans.js',root),'utf8');
const html=readFileSync(new URL('index.html',root),'utf8');
const sandbox={};vm.runInNewContext(library,sandbox);
const planner=sandbox.HanakoFourShotPlans;
test('16通りは4枚の構図・仕草を持ち、全種類を使ってから再選択し、保存後も続きから選ぶ',()=>{
 assert.equal(planner.plans.length,16);
 assert.equal(new Set(planner.plans.map(plan=>plan.shots.map(x=>x.id).join('|'))).size,16);
 for(const plan of planner.plans){assert.equal(new Set(plan.shots.map(x=>x.id)).size,4);for(const shot of plan.shots){assert.ok(shot.camera);assert.ok(shot.pose);}}
 for(const mode of ['threads','instagramIndoor','instagramOuting']){
  let deck={},last='';
  for(let cycle=0;cycle<4;cycle++){
   const ids=[];
   for(let i=0;i<16;i++){
    const before=JSON.stringify(deck),next=planner.choose(mode,deck,()=>0);
    assert.equal(JSON.stringify(deck),before);assert.notEqual(next.id,last);
    deck=JSON.parse(JSON.stringify(next));ids.push(deck.id);last=deck.id;
   }
   assert.equal(new Set(ids).size,16);
  }
 }
 assert.ok(planner.get(planner.choose('threads',{id:'removed',remaining:['removed']},()=>1).id,'threads'));
 assert.equal(planner.get('streetRhythm','normal'),null);
});

function functionText(name){const a=source.indexOf(`function ${name}(`),b=source.indexOf('\nfunction ',a+1);assert.ok(a>=0&&b>a);return source.slice(a,b);}
function catalogText(name){const a=source.indexOf(`const ${name} = [`),b=source.indexOf('\n];',a);assert.ok(a>=0&&b>a);return source.slice(a,b+4);}
test('実際の3つのボタンを繰り返しても構成が続かず、通常保存と再読込で4枚の構成を保つ',()=>{
 const elements=new Map();
 for(const match of html.matchAll(/<select\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)){
  const options=[...match[2].matchAll(/<option\b[^>]*\bvalue="([^"]*)"[^>]*>([\s\S]*?)<\/option>/g)].map(m=>({value:m[1],textContent:m[2].replace(/<[^>]+>/g,'')}));
  elements.set('#'+match[1],{options,value:options[0]?.value||'',checked:false});
 }
 // The app adds catalog choices after loading; the lifecycle fixture includes them too.
 const dynamicValues=[...new Set([...source.matchAll(/"([a-z][A-Za-z0-9]{1,50})"/g)].map(m=>m[1]))];
 for(const id of ['snsLocationPreset','snsOutfitPreset','snsHairPreset','snsPosePreset','snsHanakoExpression','snsCompositionPreset','snsLightingPreset']){
  const field=elements.get('#'+id);field.options.push(...dynamicValues.map(value=>({value,textContent:value})));
 }
 const element=id=>{if(!elements.has(id))elements.set(id,{value:'',checked:false,options:[]});return elements.get(id);};
 let persisted='';
 const c={state:{socialCreativeProfile:{}},HanakoFourShotPlans:planner,activePlatform:'Threads',document:{querySelector:element,querySelectorAll:()=>[]},getSocialCreativeProfile:()=>c.state.socialCreativeProfile,hanakoThreadsLocations:[],getHanakoThreadsAbLayout:()=> 'separate',showToast:()=>{},saveState:()=>{persisted=JSON.stringify(c.state);},markSocialGeminiPromptStale:()=>{}};
 for(const name of ['renderHanakoPhotobookSettings','renderHanakoInstagramSettings','renderHanakoThreadsSettings','renderHanakoGasSettings','renderSocialConcepts'])c[name]=()=>{};
 vm.createContext(c);
 vm.runInContext(['hanakoBuzzKawaiiThemes','hanakoInstagramBuzzStories','hanakoInstagramOutingStories'].map(catalogText).join('\n')+'\n'+source.slice(source.indexOf('function getHanakoFourShotMode('),source.indexOf('function buildSocialCreativeDirective('))+'\n'+functionText('saveSocialCreativeProfile')+'\n'+['createHanakoBuzzKawaii','createHanakoInstagramBuzzKawaii','createHanakoInstagramOutingBuzz'].map(functionText).join('\n'),c);
 for(const [button,mode] of [['createHanakoBuzzKawaii','threads'],['createHanakoInstagramBuzzKawaii','instagramIndoor'],['createHanakoInstagramOutingBuzz','instagramOuting']]){
  const ids=[];
  for(let i=0;i<16;i++){
   vm.runInContext(`${button}()`,c);
   const chosen=c.state.socialCreativeProfile.hanakoFourShotPlans[mode].id;ids.push(chosen);
   assert.equal(c.state.socialCreativeProfile.threadsImageCount,4);
   vm.runInContext('saveSocialCreativeProfile()',c);
   c.state=JSON.parse(persisted);
   assert.equal(c.state.socialCreativeProfile.hanakoFourShotPlans[mode].id,chosen);
  }
  assert.equal(new Set(ids).size,16,mode);
 }
 assert.equal(Object.keys(c.state.socialCreativeProfile.hanakoFourShotPlans).length,3);
});
test('初回とオフライン用の両方で構成ライブラリをアプリより先に読み込む',()=>{
 const appScript=html.match(/src="app\.js\?v=\d+"/);
 assert.ok(appScript);
 assert.ok(html.indexOf('src="hanako-four-shot-plans.js?v=1"')<html.indexOf(appScript[0]));
 const worker=readFileSync(new URL('sw.js',root),'utf8');
 assert.equal((worker.match(/\.\/hanako-four-shot-plans\.js\?v=1/g)||[]).length,2);
});
