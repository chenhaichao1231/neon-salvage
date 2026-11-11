'use strict';const assert=require('node:assert/strict'),fs=require('node:fs'),E=require('./td-lanes'),UI=require('./td-lanes-ui');let total=0;function test(name,fn){fn();console.log('PASS',++total,name);}
function harness(real=false,storage){const nodes={},events={},html=fs.readFileSync(__dirname+'/index.html','utf8');class Node{constructor(){this.children=[];this.style={};this.attributes={};this.hidden=false;this.disabled=false;this.textContent='';this.handlers={};}getAttribute(k){return this.attributes[k]??null;}setAttribute(k,v){this.attributes[k]=v;}appendChild(n){n.parent=this;this.children.push(n);return n;}append(...ns){ns.forEach(n=>this.appendChild(n));}replaceChildren(...ns){this.children=[];this.append(...ns);}remove(){this.parent.children=this.parent.children.filter(n=>n!==this);}addEventListener(k,f){this.handlers[k]=f;}getBoundingClientRect(){return{left:0,top:0,width:1120,height:650};}}
for(const [,id]of html.matchAll(/id="([^"]+)"/g))nodes[id]=new Node();let image;const ctx=real?(()=>{const{createCanvas,GlobalFonts}=require('@napi-rs/canvas');GlobalFonts.registerFromPath('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc','system-ui');image=createCanvas(1120,650);return image.getContext('2d');})():new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});nodes.scene.getContext=()=>ctx;if(real){Object.defineProperty(nodes.scene,'width',{get:()=>image.width,set:v=>image.width=v});Object.defineProperty(nodes.scene,'height',{get:()=>image.height,set:v=>image.height=v});}
const doc={hidden:false,documentElement:{},getElementById:id=>nodes[id],createElement:()=>new Node(),addEventListener:(k,v)=>events[k]=v},win={devicePixelRatio:1,requestAnimationFrame(){},addEventListener:(k,v)=>events[k]=v,matchMedia:()=>({matches:false,addEventListener(){}})};if(storage)win.localStorage=storage;const app=UI.mount(E,doc,win);return{app,nodes,events,doc,win,image};}
test('Old four-stage bookmark is accepted unchanged',()=>{let raw=JSON.stringify({version:1,lastStage:3,highestStage:3,lang:'en'});const storage={getItem:()=>raw,setItem:(k,v)=>raw=v};const c=UI.controller(E,storage);assert.equal(c.state.level,3);assert.equal(c.highestStage,3);assert.equal(c.storageNotice,null);for(const row of [1,2])assert(E.deploy(c.state,row,0,'deepseek').ok);c.start();while(c.state.phase==='battle')c.tick(1);assert.equal(c.state.phase,'won');c.start();assert.equal(c.state.level,4);assert.equal(JSON.parse(raw).highestStage,4);assert.equal(JSON.parse(raw).version,1);});
test('Convoy objective uses nine in both languages and retry preserves starting layout',()=>{const storage={getItem:()=>JSON.stringify({version:1,lastStage:4,highestStage:4,lang:'en'}),setItem(){}};const {app,nodes}=harness(false,storage),c=app.controller;assert.match(nodes.goal.textContent,/Stop all 9 enemies/);assert.match(nodes.goal.textContent,/Three chargers/);c.language();app.render();assert.match(nodes.goal.textContent,/全部9名/);for(const row of [1,2])c.cell(row,0);c.start();const original=JSON.stringify(c.state.snapshot);while(c.state.phase==='battle')c.tick(1);assert.equal(c.state.phase,'won');c.retry();assert.equal(c.state.compute,80);assert.equal(c.state.time,0);assert.equal(c.state.units.length,2);assert.equal(c.state.level,4);});
// Real interventions, passive collection only. No battle-state injection.
function reinforce(seed,receiverType,plan){
 const s=E.create(4,{seed});assert(E.deploy(s,1,6,'deepseek').ok);assert(E.deploy(s,2,6,receiverType).ok);assert(E.start(s).ok);let deployed=false;
 while(s.phase==='battle'&&s.time<90){
  if(plan&&!deployed&&s.time+1e-9>=plan.time){assert(E.deploy(s,plan.row,plan.col,plan.type).ok,'reinforcement is affordable');deployed=true;}
  E.step(s,1/60);
 }
 assert.notEqual(s.phase,'battle','bounded real battle completes');if(plan)assert(deployed);return s;
}
test('timely rear reinforcement rescues leaks but not the sacrificed guard; equal-cost wrong lane fails',()=>{
 for(const seed of [1,12,30]){
  const base=reinforce(seed,'deepseek'),rear=reinforce(seed,'deepseek',{row:2,col:0,type:'deepseek',time:6}),wrong=reinforce(seed,'deepseek',{row:1,col:0,type:'deepseek',time:6});
  assert.equal(base.phase,'lost');assert.equal(wrong.phase,'lost');assert.equal(rear.phase,'won');assert.equal(rear.stats.leaks,0);assert.equal(rear.stats.unitsLost,1);assert.equal(180+rear.stats.earned-rear.compute,150);
  const passiveMixed=reinforce(seed,'gpt',{row:2,col:0,type:'deepseek',time:10});assert.equal(passiveMixed.phase,'won');assert.equal(passiveMixed.stats.unitsLost,1);assert.equal(180+passiveMixed.stats.earned-passiveMixed.compute,190);
 }
});
test('a more expensive rescue still has a real timing limit in the same opening',()=>{
 for(const seed of [1,12,30]){
  const onTime=reinforce(seed,'deepseek',{row:2,col:0,type:'gpt',time:20}),late=reinforce(seed,'deepseek',{row:2,col:0,type:'gpt',time:26});
  assert.equal(onTime.phase,'won');assert.equal(onTime.stats.leaks,0);assert.equal(onTime.stats.unitsLost,1);assert.equal(late.phase,'lost');assert(late.stats.leaks>0);
  for(const s of [onTime,late])assert.equal(180+s.stats.earned-s.compute,190,'same spend, not the same outcome');
 }
});
