import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const start=source.indexOf('function installHanakoPickers() {');
const end=source.indexOf('\nqueueMicrotask(initialize);',start);
assert.ok(start>=0&&end>start);

// Minimal native-control fixture: execute the real picker handlers and assert applied choices/events.
function fixture({stored='',blocked=false}={}){
 const memory=new Map(stored?[['hanako-option-picker-v1',stored]]:[]);
 const document={activeElement:null};
 class Element{
  constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.attributes={};this.listeners={};this.textContent='';this.value='';this.disabled=false;this.hidden=false;this.open=false;const classes=new Set();this.classList={toggle:(name,on)=>on?classes.add(name):classes.delete(name),contains:name=>classes.has(name)};}
  set innerHTML(html){this.replaceChildren();for(const match of html.matchAll(/<(\w+)[^>]*\bid="([^"]+)"[^>]*>/g)){const node=new Element(match[1]);node.id=match[2];this.appendChild(node);}}
  get options(){return this.children.flatMap(child=>child.tagName==='OPTGROUP'?child.children:[child]).filter(child=>child.tagName==='OPTION');}
  get isConnected(){return this===document.body||Boolean(this.parentElement?.isConnected);}
  setAttribute(name,value){this.attributes[name]=String(value);}
  getAttribute(name){return this.attributes[name]??null;}
  appendChild(node){if(node.parentElement)node.parentElement.children=node.parentElement.children.filter(child=>child!==node);this.children.push(node);node.parentElement=this;return node;}
  append(...nodes){for(const node of nodes)this.appendChild(node);}
  before(node){const siblings=this.parentElement.children,index=siblings.indexOf(this);siblings.splice(index,0,node);node.parentElement=this.parentElement;}
  replaceChildren(...nodes){for(const node of this.children)node.parentElement=null;this.children=[];this.append(...nodes);}
  all(){return this.children.flatMap(child=>[child,...child.all()]);}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  querySelectorAll(selector){return this.all().filter(node=>selector.startsWith('#')?node.id===selector.slice(1):selector==='button'?node.tagName==='BUTTON':selector==='[data-choice-favorite]'?Object.hasOwn(node.dataset,'choiceFavorite'):selector.startsWith('[data-hanako-picker=')?node.dataset.hanakoPicker===selector.match(/="([^"]+)"/)[1]:false);}
  matches(selector){return selector===':disabled'&&(this.disabled||Boolean(this.parentElement?.tagName==='FIELDSET'&&this.parentElement.disabled));}
  closest(selector){if(selector==='dialog')return this.tagName==='DIALOG'?this:this.parentElement?.closest(selector)||null;return null;}
  addEventListener(type,listener){(this.listeners[type]||=[]).push(listener);}
  dispatchEvent(event){event.target=this;for(const listener of this.listeners[event.type]||[])listener(event);return true;}
  click(){if(!this.disabled)this.dispatchEvent({type:'click'});}
  focus(){document.activeElement=this;}
  showModal(){this.open=true;}
  close(){this.open=false;this.dispatchEvent({type:'close'});}
  getBoundingClientRect(){return{left:10,right:100,top:10,bottom:100};}
 }
 document.body=new Element('body');
 document.createElement=tag=>new Element(tag);
 document.querySelector=selector=>document.body.querySelector(selector);
 document.getElementById=id=>typeof id==='string'?document.body.all().find(node=>node.id===id)||null:null;
 const fieldset=new Element('fieldset');fieldset.disabled=blocked;document.body.appendChild(fieldset);
 function option(value,label,{disabled=false,hidden=false}={}){const node=new Element('option');Object.assign(node,{value,textContent:label,disabled,hidden});return node;}
 const sourceSelect=new Element('select');sourceSelect.id='snsLocationPreset';
 const studio=new Element('optgroup');studio.label='室内・スタジオ';studio.append(option('studio','明るいスタジオ'),option('cafe','カフェの窓辺'));
 const city=new Element('optgroup');city.label='海外都市';city.append(option('paris','パリの街角',{disabled:true}));
 const hidden=new Element('optgroup');hidden.label='非表示';hidden.hidden=true;hidden.append(option('hidden','非表示の場所'));
 sourceSelect.append(studio,city,hidden);sourceSelect.value='studio';
 const mirror=new Element('select');mirror.id='hanakoGasLocation';mirror.value='studio';for(const entry of sourceSelect.options)mirror.appendChild(option(entry.value,entry.textContent));
 fieldset.append(sourceSelect,mirror);
 const opener=new Element('button');opener.dataset.hanakoPicker='hanakoGasLocation';document.body.appendChild(opener);opener.focus();
 let changes=0;mirror.addEventListener('change',()=>{changes++;sourceSelect.value=mirror.value;});
 const sandbox={document,hanakoGasFieldMap:{hanakoGasLocation:'snsLocationPreset'},localStorage:{getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value)},Event:class{constructor(type,init){this.type=type;Object.assign(this,init);}}};
 vm.createContext(sandbox);vm.runInContext(source.slice(start,end),sandbox);
 const open=(select=mirror)=>sandbox.openHanakoPicker(select),node=id=>document.getElementById(id),choices=()=>node('hanakoChoiceResults').all().filter(el=>Object.hasOwn(el.dataset,'choiceValue'));
 return {document,sourceSelect,mirror,opener,memory,sandbox,open,node,choices,get changes(){return changes;}};
}

test('picker uses canonical mirror options, correct title and native delegated change exactly once',()=>{
 const f=fixture();f.open();assert.equal(f.node('hanakoChoiceTitle').textContent,'場所を選ぶ');assert.equal(f.node('hanakoChoiceCurrent').textContent,'選択中：明るいスタジオ');
 assert.equal(f.choices().length,3);assert.equal(f.choices().find(node=>node.dataset.choiceValue==='paris').disabled,true);assert.equal(f.choices().some(node=>node.dataset.choiceValue==='hidden'),false);
 f.choices().find(node=>node.dataset.choiceValue==='cafe').click();assert.equal(f.mirror.value,'cafe');assert.equal(f.sourceSelect.value,'cafe');assert.equal(f.changes,1);assert.equal(f.node('hanakoChoiceDialog').open,false);assert.equal(f.document.activeElement,f.opener);
});

test('a live mode restriction or disabled fieldset cannot be bypassed by a stale search result',()=>{
 const f=fixture();f.open();const button=f.choices().find(node=>node.dataset.choiceValue==='cafe');f.sourceSelect.options.find(node=>node.value==='cafe').disabled=true;button.click();assert.equal(f.mirror.value,'studio');assert.equal(f.changes,0);assert.equal(f.node('hanakoChoiceDialog').open,true);assert.match(f.node('hanakoChoiceMeta').textContent,/更新/);
 const blocked=fixture({blocked:true});blocked.open();assert.equal(blocked.node('hanakoChoiceDialog'),null);
});

test('search normalizes kana and spacing and changing query cannot trap an invisible category',()=>{
 const f=fixture();f.open();f.node('hanakoChoiceSearch').value='かふぇ　窓';f.node('hanakoChoiceSearch').oninput();assert.deepEqual(f.choices().map(node=>node.dataset.choiceValue),['cafe']);
 f.node('hanakoChoiceCategories').children.find(node=>node.dataset.category==='室内・スタジオ').click();f.node('hanakoChoiceSearch').value='パリ';f.node('hanakoChoiceSearch').oninput();assert.deepEqual(f.choices().map(node=>node.dataset.choiceValue),['paris']);
});

test('favorites and recent selections persist across canonical/mirror picker openings without extra changes',()=>{
 const f=fixture({stored:'{broken json'});f.open();const star=f.node('hanakoChoiceResults').all().find(node=>node.dataset.choiceFavorite==='cafe');star.click();assert.equal(f.changes,0);
 f.node('hanakoChoiceTools').children.find(node=>node.dataset.scope==='favorites').click();assert.deepEqual(f.choices().map(node=>node.dataset.choiceValue),['cafe']);f.choices()[0].click();
 const saved=JSON.parse(f.memory.get('hanako-option-picker-v1'));assert.deepEqual(saved.favorites.snsLocationPreset,['cafe']);assert.deepEqual(saved.recent.snsLocationPreset,['cafe']);
 f.open(f.sourceSelect);f.node('hanakoChoiceTools').children.find(node=>node.dataset.scope==='recent').click();assert.deepEqual(f.choices().map(node=>node.dataset.choiceValue),['cafe']);assert.equal(f.changes,1);
});

test('Escape and backdrop dismissal restore focus without selecting anything',()=>{
 const f=fixture();f.open();const dialog=f.node('hanakoChoiceDialog');let prevented=false;dialog.dispatchEvent({type:'cancel',preventDefault(){prevented=true;}});assert.equal(prevented,true);assert.equal(dialog.open,false);assert.equal(f.document.activeElement,f.opener);assert.equal(f.changes,0);
 f.open();dialog.dispatchEvent({type:'click',clientX:0,clientY:0});assert.equal(dialog.open,false);assert.equal(f.changes,0);
});
