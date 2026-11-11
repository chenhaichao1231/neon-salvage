'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {createCanvas,GlobalFonts}=require('@napi-rs/canvas');
const E=require('./td-lanes'),UI=require('./td-lanes-ui');
GlobalFonts.registerFromPath('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc','system-ui');
const measure=createCanvas(1,1).getContext('2d');
const images=[];
class FakeImage{constructor(){this.width=0;this.height=0;this.complete=false;images.push(this);}set src(url){this.url=url;}}
const box={Image:FakeImage};vm.runInNewContext(fs.readFileSync(__dirname+'/td-lanes-renderer.js','utf8'),box);
const R=box.TDLanesRenderer,supplier=images.find(im=>im.url==='td-suppliers.png');
const labels=[],crops=[],pills=[];
const ctx=new Proxy({
 fillText(text,x,y){labels.push({text,x,y,font:ctx.font});},
 drawImage(image,...args){if(image===supplier)crops.push(args);},
 roundRect(...args){pills.push(args);}
},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
let count=0;
for(const mode of ['loading','ready','failed','recovered']){
 supplier.width=mode==='ready'||mode==='recovered'?2164:0;
 supplier.height=supplier.width?720:0;
 supplier.complete=mode!=='loading';
 if(mode==='failed')supplier.onerror();
 if(supplier.width)supplier.onload();
 for(const lang of ['zh','en'])for(const [width,height]of [[1120,650],[740,400],[1120,300]])for(const phase of ['prepare','battle','paused','won','lost']){
  const state=E.create(4);E.deploy(state,1,5,'deepseek');E.deploy(state,2,0,'gpt');
  if(phase!=='prepare')E.start(state);
  if(phase==='paused')E.pause(state,true);
  if(phase==='won'||phase==='lost')state.phase=phase;
  const before=JSON.stringify(state);labels.length=0;crops.length=0;pills.length=0;
  R.draw(ctx,{state,definitions:E.definitions,layout:{}},{width,height,lang,reducedMotion:true});
  assert.equal(JSON.stringify(state),before,'supplier drawing cannot mutate battle state');
  const names=labels.filter(t=>t.y===133);
  assert.deepEqual(names.map(t=>t.text),['Jensen','Liang','Tibo',lang==='zh'?'苏姿丰':'Lisa Su']);
  assert.deepEqual(names.map(t=>t.x),[275,465,655,845]);
  assert(!labels.some(t=>t.text==='AMD'),'the company is not a character name');
  for(const label of names){
   assert.equal(label.font,'600 12px system-ui');measure.font=label.font;
   const metric=measure.measureText(label.text);
   assert(metric.width<=64,'label fits the existing 80px pill with at least 8px side padding');
   assert(Math.max(metric.actualBoundingBoxLeft,metric.actualBoundingBoxRight)<=40,'ink fits pill width');
   assert(pills.some(p=>p[0]===label.x-40&&p[1]===118&&p[2]===80&&p[3]===21));
  }
  if(supplier.width){assert.equal(crops.length,4);for(let i=0;i<4;i++)assert.deepEqual(crops[i],[i*541,0,541,720,232+i*190,8,86,116]);}
  else assert.equal(crops.length,0);
  count++;
 }
}
// Missing renderer has never drawn supplier figures. Do not invent new fallback content.
for(const lang of ['zh','en']){labels.length=0;UI.fallback(ctx,E.create(),E,lang);assert(!labels.some(t=>['AMD','苏姿丰','Lisa Su'].includes(t.text)));}
for(const file of ['td-lanes-renderer.js','td-lanes-ui.js','index.html'])assert(!/\bAMD\b/.test(fs.readFileSync(__dirname+'/'+file,'utf8')),file+' contains no stale company-character text');
measure.font='600 12px system-ui';
console.log(`PASS ${count} supplier renders: both languages, loading/failure/recovery, three canvas sizes, five states, unchanged crops/anchors, read-only state and no stale AMD label.`);
console.log('Native Canvas label widths: '+['苏姿丰','Lisa Su'].map(name=>name+' '+measure.measureText(name).width.toFixed(2)+'px / 80px pill').join('; ')+'.');
