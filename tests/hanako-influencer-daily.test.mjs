import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const section=(start,end)=>{
 const from=source.indexOf(start),to=source.indexOf(end,from);
 assert.ok(from>=0&&to>from,`Missing application section: ${start}`);
 return source.slice(from,to);
};
const selectors={expression:'snsHanakoExpression',hair:'snsHairPreset',outfit:'snsOutfitPreset',composition:'snsCompositionPreset',pose:'snsPosePreset',location:'snsLocationPreset'};
const profileFields={expression:'hanakoExpression',hair:'hairPreset',outfit:'outfitPreset',composition:'compositionPreset',pose:'posePreset',location:'locationPreset'};

// Run the actual native-option installation and prompt builder, without booting
// the application, sending personal images or invoking an external model.
function fixture(){
 const escape=value=>String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
 const unescape=value=>value.replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
 class Element{
  constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.value='';this.textContent='';this.label='';this.hidden=false;this.dataset={};}
  get options(){return this.children.flatMap(child=>child.tagName==='OPTGROUP'?child.options:[child]).filter(child=>child.tagName==='OPTION');}
  get selectedOptions(){return this.options.filter(option=>option.value===this.value);}
  appendChild(node){node.parentElement=this;this.children.push(node);return node;}
  insertBefore(node,before){node.parentElement=this;const index=this.children.indexOf(before);if(index<0)this.children.push(node);else this.children.splice(index,0,node);return node;}
  after(node){if(this.parentElement)this.parentElement.insertBefore(node,this.parentElement.children[this.parentElement.children.indexOf(this)+1]);}
  querySelector(selector){return selector==='optgroup'?this.children.find(child=>child.tagName==='OPTGROUP')||null:null;}
  set innerHTML(value){this.children=[];for(const match of value.matchAll(/<option\b[^>]*value="([^"]*)"[^>]*>([\s\S]*?)<\/option>/g)){const option=new Element('option');option.value=unescape(match[1]);option.textContent=unescape(match[2]);const directive=/data-image-prompt="([^"]*)"/.exec(match[0]);if(directive)option.dataset.imagePrompt=unescape(directive[1]);this.appendChild(option);}}
  get innerHTML(){return this.children.map(child=>child.tagName==='OPTGROUP'?`<optgroup label="${escape(child.label)}">${child.innerHTML}</optgroup>`:`<option value="${escape(child.value)}"${child.dataset.imagePrompt?` data-image-prompt="${escape(child.dataset.imagePrompt)}"`:''}>${escape(child.textContent)}</option>`).join('');}
 }
 const nodes=new Map(),events=[];
 const document={querySelector:selector=>nodes.get(selector.slice(1))||null,createElement:tag=>new Element(tag),dispatchEvent:event=>{events.push(event.type);}};
 const original={expression:'bashful',hair:'keep',outfit:'sweetIvoryKnitMini',composition:'face',pose:'auto',location:'homeWindow'};
 for(const [kind,id]of Object.entries(selectors)){const select=new Element('select'),option=new Element('option');option.value=original[kind];option.textContent=`existing-${kind}`;select.appendChild(option);select.value=option.value;nodes.set(id,select);}
 for(const id of ['snsScenePreset','snsLightingPreset','snsThreadsImageCount','snsCarouselPreset','hanakoGasScene','hanakoGasOutfit','hanakoGasHair','hanakoGasPose','hanakoGasComposition','hanakoGasLighting','hanakoGasLocation','hanakoGasImageCount','hanakoGasCarousel'])nodes.set(id,new Element('select'));
 const context=vm.createContext({document,coordinateSelectEnhancements:{},getSocialCreativeProfile:()=>({hanakoMode:true,posePreset:'auto'}),installHanakoPickers(){},renderHanakoGasSettings(){},Event:class{constructor(type){this.type=type;}}});
 vm.runInContext(section('const socialCreativeDefaults = {','const hanakoExpressionOptions = {'),context);
 vm.runInContext(section('const hanakoExpressionOptions = {','const hanakoIdeaCatalog = ['),context);
 vm.runInContext(section('const museReelSnsPresets = {','function enhanceCoordinateSelectOptions() {'),context);
 vm.runInContext(section('function enhanceCoordinateSelectOptions() {','function installHanakoPickers() {'),context);
 vm.runInContext('enhanceCoordinateSelectOptions()',context);
 const catalog=vm.runInContext('hanakoInfluencerDailyCatalog',context);
 return{context,nodes,catalog,original,events,document};
}

test('all six requested categories add exactly twenty distinct usable choices without replacing older IDs',()=>{
 const f=fixture(),ids=[];
 assert.deepEqual(Object.keys(f.catalog).sort(),Object.keys(selectors).sort());
 for(const [kind,entries]of Object.entries(f.catalog)){
  assert.equal(entries.length,20,kind);
  assert.equal(new Set(Array.from(entries,item=>item.label)).size,20,`${kind} labels are distinct`);
  assert.equal(new Set(Array.from(entries,item=>item.prompt)).size,20,`${kind} directions are distinct`);
  const options=f.nodes.get(selectors[kind]).options;
  assert.ok(options.some(option=>option.value===f.original[kind]),`${kind} retains the previous selection`);
  for(const entry of entries){ids.push(entry.id);assert.match(entry.id,/^dailyGirl/);assert.ok(entry.label.trim()&&entry.prompt.trim());assert.equal(options.filter(option=>option.value===entry.id).length,1,`${entry.id} can be selected exactly once`);}
 }
 assert.equal(ids.length,120);assert.equal(new Set(ids).size,120);
 // Reopening or reinitialising the appearance screen must not append duplicates.
 vm.runInContext('enhanceCoordinateSelectOptions()',f.context);
 for(const [kind,entries]of Object.entries(f.catalog))for(const entry of entries)assert.equal(f.nodes.get(selectors[kind]).options.filter(option=>option.value===entry.id).length,1);
 const old=vm.runInContext('({outfits:hanakoExtraOutfits,expressions:hanakoExtraExpressions,poses:hanakoExtraPoses,locations:hanakoExtraLocations})',f.context);
 for(const [kind,groups]of Object.entries(old)){const values=groups.flatMap(group=>Array.from(group.items,item=>item.id));assert.equal(new Set(values).size,values.length,`${kind} IDs remain unique`);}
});

test('new long-hair arrangements preserve length and colour and requested everyday locations have precise directions',()=>{
 const {catalog}=fixture();
 for(const hair of catalog.hair){assert.match(hair.prompt,/ロング|長さ|長い髪/,hair.id);assert.match(hair.prompt,/髪色|髪の色|元の色/,hair.id);assert.match(hair.prompt,/保|維持|変え/,hair.id);}
 const toilet=catalog.location.find(item=>/トイレ/.test(item.label));assert.ok(toilet,'the home toilet-door setting is present');assert.match(toilet.prompt,/ドア|扉/);assert.match(toilet.prompt,/廊下/);assert.match(toilet.prompt,/閉じ|閉め|閉ま/);
 const wall=catalog.location.find(item=>/塀/.test(item.label));assert.ok(wall,'the ordinary roadside wall is present');assert.match(wall.prompt,/住宅|歩道|道沿い|路地/);
 assert.ok(catalog.location.every(item=>!/ホテルラウンジ|海外都市|世界遺産|宮殿/.test(item.label)),'new locations stay within the everyday-background request');
});

test('canonical appearance choices reach the visible Hanako controls with their selected values intact',()=>{
 const f=fixture();
 vm.runInContext(section('const hanakoGasFieldMap = {','function renderHanakoPhotobookSettings() {'),f.context);
 for(const name of ['renderHanakoPhotobookSettings','renderHanakoTimeRecommendation','renderHanakoInstagramSettings','renderHanakoThreadsSettings'])f.context[name]=()=>{};
 const mirrors={hair:'hanakoGasHair',outfit:'hanakoGasOutfit',composition:'hanakoGasComposition',pose:'hanakoGasPose',location:'hanakoGasLocation'};
 for(const [kind,id]of Object.entries(mirrors)){
  const selected=f.catalog[kind][19].id;f.nodes.get(selectors[kind]).value=selected;
  vm.runInContext('renderHanakoGasSettings()',f.context);
  const mirror=f.nodes.get(id);assert.equal(mirror.value,selected);for(const item of f.catalog[kind]){const option=mirror.options.find(option=>option.value===item.id);assert.ok(option,`${id} includes ${item.id}`);assert.equal(option.dataset.imagePrompt,item.prompt,`${id} retains the full image instruction`);}
 }
 assert.ok(f.events.includes('hanako-sns-ui-change'));
});

test('fixed daily creation receives all six full image instructions while previous choices retain their labels',()=>{
 const f=fixture();vm.runInContext(section('const hanakoGasFieldMap = {','function renderHanakoPhotobookSettings() {'),f.context);
 for(const name of ['renderHanakoPhotobookSettings','renderHanakoTimeRecommendation','renderHanakoInstagramSettings','renderHanakoThreadsSettings'])f.context[name]=()=>{};
 for(const [kind,id]of Object.entries(selectors))f.nodes.get(id).value=f.catalog[kind][0].id;
 vm.runInContext('renderHanakoGasSettings()',f.context);
 vm.runInContext(section('function selectedHanakoDailyLook() {','function renderHanakoDailyStoryPreview() {'),f.context);
 const selected=vm.runInContext('selectedHanakoDailyLook()',f.context);
 for(const [kind,entries]of Object.entries(f.catalog))assert.equal(selected[kind],entries[0].prompt,`${kind} must not lose details when daily settings are saved`);
 f.nodes.get('hanakoGasOutfit').value=f.original.outfit;assert.equal(vm.runInContext('selectedHanakoDailyLook().outfit',f.context),'existing-outfit');
 f.nodes.get('hanakoGasHair').value='keep';assert.equal(vm.runInContext('selectedHanakoDailyLook().hair',f.context),'');
});

test('every selected option contributes its complete image direction instead of falling back to the short label',()=>{
 const f=fixture();
 Object.assign(f.context,{socialConceptCatalog:[],hanakoIdeaCatalog:[{id:'test',title:'日常の写真',brief:'自然なスナップ'}],hanakoThreadsProfile:{handle:'hanako',themes:'日常',audience:'ファッション好き',voice:'自然体',targetLength:'短文',visualStyle:'自然光',sheetSampleSize:0},hanakoThreadsAbLooks:[],getHanakoDedicatedShotCount:()=>3});
 vm.runInContext(section('function extractSocialExtraLocation(','function buildSocialPerformanceDirective('),f.context);
 const base={hanakoMode:true,hanakoThreadsMode:true,hanakoIdea:'test',...Object.fromEntries(Object.entries(profileFields).map(([kind,key])=>[key,f.catalog[kind][0].id]))};
 for(const [kind,entries]of Object.entries(f.catalog))for(const item of entries){f.context.selectedProfile={...base,[profileFields[kind]]:item.id};const prompt=vm.runInContext("buildSocialCreativeDirective({creativeProfile:selectedProfile,socialCity:'unused-city',socialLandmark:'unused-landmark'})",f.context);assert.ok(prompt.includes(item.prompt),`${kind}/${item.id} reaches the generation instructions`);}
});
