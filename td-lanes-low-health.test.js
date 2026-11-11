'use strict';const assert=require('node:assert/strict'),fs=require('node:fs'),E=require('./td-lanes'),UI=require('./td-lanes-ui');let total=0;function test(name,fn){fn();console.log('PASS',++total,name);}
function harness(real=false,storage){const nodes={},events={},html=fs.readFileSync(__dirname+'/index.html','utf8');class Node{constructor(){this.children=[];this.style={};this.attributes={};this.hidden=false;this.disabled=false;this.textContent='';this.handlers={};}getAttribute(k){return this.attributes[k]??null;}setAttribute(k,v){this.attributes[k]=v;}appendChild(n){n.parent=this;this.children.push(n);return n;}append(...ns){ns.forEach(n=>this.appendChild(n));}replaceChildren(...ns){this.children=[];this.append(...ns);}remove(){this.parent.children=this.parent.children.filter(n=>n!==this);}addEventListener(k,f){this.handlers[k]=f;}getBoundingClientRect(){return{left:0,top:0,width:1120,height:650};}}
for(const [,id]of html.matchAll(/id="([^"]+)"/g))nodes[id]=new Node();let image;const ctx=real?(()=>{const{createCanvas,GlobalFonts}=require('@napi-rs/canvas');GlobalFonts.registerFromPath('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc','system-ui');image=createCanvas(1120,650);return image.getContext('2d');})():new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});nodes.scene.getContext=()=>ctx;if(real){Object.defineProperty(nodes.scene,'width',{get:()=>image.width,set:v=>image.width=v});Object.defineProperty(nodes.scene,'height',{get:()=>image.height,set:v=>image.height=v});}
const doc={hidden:false,documentElement:{},getElementById:id=>nodes[id],createElement:()=>new Node(),addEventListener:(k,v)=>events[k]=v},win={devicePixelRatio:1,requestAnimationFrame(){},addEventListener:(k,v)=>events[k]=v,matchMedia:()=>({matches:false,addEventListener(){}})};if(storage)win.localStorage=storage;const app=UI.mount(E,doc,win);return{app,nodes,events,doc,win,image};}

const R=require('./td-lanes-renderer'),D=E.definitions;
function recorded(){const calls=[],stack=[];const ctx={fillStyle:'original',save(){stack.push(this.fillStyle);},restore(){this.fillStyle=stack.pop();},fillRect(...v){calls.push([this.fillStyle,...v]);}};return {ctx,calls};}
test('inclusive thresholds, live supported types only, standalone parity and pure drawing',()=>{
 for(const type of ['deepseek','gpt','claude','grok','gemini','missing'])for(const hp of [-1,0,NaN,Infinity,1,22.5,22.5001,30,30.0001,45,60,61,120]){
 const u={type,hp},low=E.roster.includes(type)&&hp>0&&hp<=D.units[type].hp*.25;
 assert.equal(UI.isLowHealth(u,D),low);assert.equal(R.isLowHealth(u,D),low);
 const a=recorded(),b=recorded(),before=JSON.stringify(u);UI.drawLowHealth(a.ctx,u,D,500,293);R.drawLowHealth(b.ctx,u,D,500,293);assert.deepEqual(a.calls,b.calls);assert.equal(JSON.stringify(u),before);assert.equal(a.ctx.fillStyle,'original');if(low)assert.deepEqual(a.calls[3],['#18223d',451,316,20,20],'badge stays left of guard, away from the right-side melee blocker');
 assert.equal(a.calls.length,low?7:(E.roster.includes(type)&&hp>0&&hp<=D.units[type].hp*.5?2:0));
 }
 assert.equal(UI.healthLabel({type:'gpt',hp:30},D,'en'),'Low HP');assert.equal(UI.healthLabel({type:'gpt',hp:30},D,'zh'),'低生命');
});
for(const type of ['deepseek','gpt'])test('actual battle damage, selected/cell text, pause, withdrawal, replacement and retry: '+type,()=>{
 const h=harness(false,{getItem:()=>JSON.stringify({version:1,lastStage:1,highestStage:1,lang:'en'}),setItem(){}}),c=h.app.controller;
 c.select(type);c.cell(0,6);c.start();while(c.state.phase==='battle'&&!UI.isLowHealth(c.state.units[0],D))c.tick(1/60);
 assert(UI.isLowHealth(c.state.units[0],D));h.app.render();assert(h.nodes['unit-summary'].textContent.includes('Low HP'));assert(h.nodes['unit-summary'].textContent.includes('Forward in this lane'));assert(h.nodes.grid.children[6].attributes['aria-label'].includes('Low HP'));
 c.pause();const before=JSON.stringify(c.state);c.tick(1);h.app.render();assert.equal(JSON.stringify(c.state),before);assert(h.nodes['unit-summary'].textContent.includes('Low HP'));
 c.language();h.app.render();assert(h.nodes['unit-summary'].textContent.includes('低生命'));assert(h.nodes.grid.children[6].attributes['aria-label'].includes('低生命'));
 c.pause();assert(c.refund().ok);h.app.render();assert(!h.nodes.grid.children[6].attributes['aria-label'].includes('低生命'));assert(c.cell(0,6).ok);h.app.render();assert(!h.nodes['unit-summary'].textContent.includes('低生命'));assert.equal(c.state.units[0].hp,D.units[type].hp);
 c.retry();c.cell(0,6);h.app.render();assert(!h.nodes['unit-summary'].textContent.includes('低生命'));assert.equal(c.state.units[0].hp,D.units[type].hp);
});
test('status and forward text coexist with low health without rewriting status semantics',()=>{
 const h=harness(),c=h.app.controller;c.cell(0,0);const u=c.state.units[0];u.hp=18;
 for(const [status,warning,zh,en] of [['rice',null,'吃饭中','Rice break'],['weak',null,'思路卡住','Brain fog'],['normal',{status:'rice',startsIn:1},'准备开饭','Rice break soon']]){
 u.status=status;u.statusRemaining=1;u.warning=warning;
 for(const lang of ['zh','en']){if(c.lang!==lang)c.language();h.app.render();const label=lang==='zh'?zh:en,health=lang==='zh'?'低生命':'Low HP';assert(h.nodes['unit-summary'].textContent.includes(label));assert(h.nodes['unit-summary'].textContent.includes(health));assert(h.nodes.grid.children[0].attributes['aria-label'].includes(label));assert(h.nodes.grid.children[0].attributes['aria-label'].includes(health));}
 }
});

test('half-health fallback covers the same base bar with no green edge',()=>{const s=E.create();E.deploy(s,0,0,'gpt');s.units[0].hp=60;const calls=[];const ctx=new Proxy({},{get:(o,k)=>k==='fillRect'?(...v)=>calls.push([o.fillStyle,...v]):o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});UI.fallback(ctx,s,E,'en');assert(calls.some(v=>JSON.stringify(v)===JSON.stringify(['#90e0be',174,245,26,4])));assert(calls.some(v=>JSON.stringify(v)===JSON.stringify(['#ffcb66',174,245,26,4])));assert(!calls.some(v=>v[0]==='#fff4ce'));});
