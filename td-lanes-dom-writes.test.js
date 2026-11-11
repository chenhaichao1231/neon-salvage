'use strict';
// Counts JS-side DOM assignments/calls, not browser layout cost, FPS or battery.
// Optional baseline: node td-lanes-dom-writes.test.js --measure /absolute/path/to/baseline-ui.js
const assert=require('node:assert/strict'),fs=require('node:fs');
const measure=process.argv.includes('--measure');
const UI=require(measure?process.argv[process.argv.indexOf('--measure')+1]:'./td-lanes-ui');
const E=require('./td-lanes');
// Deliberately lossy CSSOM-like serialization; not a browser emulator.
const serializeStyle=value=>String(value).replace(/-?\d+(?:\.\d+)?/g,n=>String(Number(Number(n).toFixed(3)))).replace(/,\s*/g,', ');
function harness(level=0,adapter=UI,normalize=false){
 const writes=[],nodes={},events={};let width=1120,height=650,draws=0,asset='ready',seen;
 const tracked=new Set(['textContent','hidden','disabled','value','lang','title','width','height']);
 function track(o,label){return new Proxy(o,{set(target,key,value){if(tracked.has(key))writes.push({kind:key==='textContent'?'text':'property',label,key,value});target[key]=value;return true;}});}
 class Node{
  constructor(label){this.label=label;this.children=[];this.attributes={};this.textContent='';this.hidden=false;this.disabled=false;
   this.style=new Proxy({},{set:(o,key,value)=>{writes.push({kind:'style',label,key,value});o[key]=normalize?serializeStyle(value):value;return true;}});return track(this,label);}
  getAttribute(k){return this.attributes[k]??null;}
  setAttribute(key,value){writes.push({kind:'attribute',label:this.label,key,value});this.attributes[key]=value;}
  appendChild(n){n.parent=this;this.children.push(n);writes.push({kind:'structure',label:this.label});return n;}
  append(...ns){ns.forEach(n=>this.appendChild(n));}
  replaceChildren(...ns){writes.push({kind:'structure',label:this.label});this.children=[];this.append(...ns);}
  remove(){writes.push({kind:'structure',label:this.label});this.parent.children=this.parent.children.filter(n=>n!==this);}
  getBoundingClientRect(){return{left:0,top:0,width,height};}
 }
 for(const[,id]of fs.readFileSync(__dirname+'/index.html','utf8').matchAll(/id="([^"]+)"/g))nodes[id]=new Node(id);
 const ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});nodes.scene.getContext=()=>ctx;
 const doc=track({hidden:false,documentElement:track({},'html'),getElementById:id=>nodes[id],createElement:tag=>new Node(tag),addEventListener:(k,v)=>events[k]=v},'document');
 const storage={getItem:()=>JSON.stringify({version:1,lastStage:level,highestStage:level,lang:'en'}),setItem(){}};
 const win={localStorage:storage,devicePixelRatio:1,requestAnimationFrame(){},addEventListener:(k,v)=>events[k]=v,matchMedia:()=>({matches:false,addEventListener:(k,v)=>events.motion=v})};
 global.TDLanesRenderer={files:{art:'test'},assetState:()=>asset,draw:(ctx,view,opts)=>{draws++;seen={view,opts};}};
 const app=adapter.mount(E,doc,win);
 return{app,nodes,events,doc,win,writes,reset:()=>{writes.length=0;},resize:(w,h)=>{width=w;height=h;events.resize();},asset:v=>{asset=v;},get draws(){return draws;},get seen(){return seen;}};
}
function count(h){return h.writes.reduce((r,w)=>(r[w.kind]=(r[w.kind]||0)+1,r),{});}
function unchanged(h,name){h.reset();const draws=h.draws;for(let i=0;i<120;i++)h.app.frame(10000+i*1000/60);assert.equal(h.draws-draws,120);console.log('MEASURE',name,JSON.stringify({frames:120,total:h.writes.length,byKind:count(h),draws:120}));if(!measure)assert.equal(h.writes.length,0,name);}
let h=harness();unchanged(h,'empty preparation');
h.nodes.grid.children[0].onclick();h.nodes.start.onclick();for(let i=0;i<62;i++)h.app.controller.tick(.1);h.app.render();assert.equal(h.nodes.tokens.children.length,1);h.nodes.pause.onclick();unchanged(h,'paused battle with selected guard and airborne GPU');
h=harness(3);h.nodes.grid.children[12].onclick();h.nodes.start.onclick();for(let i=0;i<500&&!h.app.controller.state.enemies.some(e=>e.turnState==='waiting');i++)h.app.controller.tick(1/60);assert(h.app.controller.state.enemies.some(e=>e.turnState==='waiting'));h.app.render();h.nodes.pause.onclick();unchanged(h,'paused detour countdown');
h=harness(2);h.app.controller.state.phase='won';h.app.render();assert.equal(h.nodes.start.textContent,'Try optional challenge');unchanged(h,'terminal optional-next label');
function finishConvoy(h,win){if(win){h.nodes.grid.children[7].onclick();h.nodes.grid.children[14].onclick();}h.nodes.start.onclick();for(let i=0;i<300&&h.app.controller.state.phase==='battle';i++)h.app.controller.tick(1);assert.equal(h.app.controller.state.phase,win?'won':'lost');h.app.render();assert(h.app.controller.review);assert.equal(h.nodes['battle-review'].hidden,false);assert(h.nodes['review-content'].textContent.includes(win?'No leaks or guards lost':'Affected lanes (leaks/guards lost):'));}
for(const win of [true,false]){h=harness(4);finishConvoy(h,win);const before=JSON.stringify(h.app.controller.state),facts=JSON.stringify(h.app.controller.review);h.nodes['battle-review'].open=true;unchanged(h,'completed convoy '+(win?'win':'loss')+' with open battle review');assert.equal(h.nodes['battle-review'].open,true);assert.equal(JSON.stringify(h.app.controller.state),before);assert.equal(JSON.stringify(h.app.controller.review),facts);}
h=harness(0,UI,true);h.resize(739.123,401.789);unchanged(h,'normalizing styles at fractional geometry');
h.nodes.grid.children[0].onclick();h.nodes.start.onclick();for(let i=0;i<62;i++)h.app.controller.tick(.1);h.app.render();h.nodes.pause.onclick();unchanged(h,'normalizing styles with paused airborne GPU');
if(measure){delete global.TDLanesRenderer;process.exit(0);}
let groups=0;function test(name,fn){fn();console.log('PASS',++groups,name);}
test('actual RAF time advances integer forecasts without rewriting static controls',()=>{
 const h=harness();h.nodes.start.onclick();h.app.frame(0);const row=h.nodes['row-preview'].children[0];assert(row.textContent.endsWith('4s'));h.reset();for(let i=1;i<=11;i++)h.app.frame(i*100);
 assert(h.app.controller.state.time>1);assert(row.textContent.endsWith('3s'));assert(!h.writes.some(w=>w.label==='title'||w.label==='language'||w.kind==='style'));
 assert(h.writes.some(w=>w.kind==='text'));assert(h.seen.opts.visualTime>1);
});
test('real warning/status boundaries update selected summary and ARIA, including recovery',()=>{
 const h=harness();h.nodes.grid.children[0].onclick();h.nodes.start.onclick();const c=h.app.controller,u=c.state.units[0];let states=new Set(),previous='',changes=0;
 for(let i=0;i<300&&c.state.phase==='battle';i++){c.tick(.1);h.reset();h.app.render();const status=UI.unitStatus(u,c.lang);states.add(u.status);assert(h.nodes['unit-summary'].textContent.endsWith(status||'Forward in this lane'));assert(h.nodes.grid.children[0].getAttribute('aria-label').endsWith(status));
  if(status!==previous){changes++;assert(h.writes.some(w=>w.label==='unit-summary'&&w.kind==='text'));assert(h.writes.some(w=>w.key==='aria-label'));}previous=status;
 }
 assert(states.has('rice'));assert(states.has('normal'));assert(changes>=3);
});
test('real detour clock refreshes decimal waiting label once per displayed change',()=>{
 const h=harness(3);h.nodes.grid.children[12].onclick();h.nodes.start.onclick();const c=h.app.controller;for(let i=0;i<500&&!c.state.enemies.some(e=>e.turnState==='waiting');i++)c.tick(1/60);h.app.render();const row=h.nodes['row-preview'].children[1],before=row.textContent;c.tick(.1);h.reset();h.app.render();assert.notEqual(row.textContent,before);assert(row.textContent.includes('Wait '));assert(h.writes.filter(w=>w.kind==='text'&&w.value===row.textContent).length===1);
 h.nodes.pause.onclick();const frozen=row.textContent;h.app.frame(0);h.app.frame(100);assert.equal(row.textContent,frozen);
});
test('language updates live labels once; repeated rendering stays quiet',()=>{
 const h=harness(3);h.nodes.grid.children[12].onclick();h.nodes.start.onclick();h.nodes.pause.onclick();const before=JSON.stringify(h.app.controller.state);h.reset();h.nodes.language.onclick();assert.equal(h.doc.documentElement.lang,'zh-CN');assert.equal(h.doc.title,'校园防线');assert(h.nodes.grid.children[12].getAttribute('aria-label').includes('第2行'));assert.equal(JSON.stringify(h.app.controller.state),before);
 assert.equal(h.writes.filter(w=>w.label==='goal'&&w.kind==='text').length,1);h.reset();h.app.render();assert.equal(h.writes.length,0);
});
test('English and Chinese group names follow the selected document language without changing battle state',()=>{
 const h=harness();h.nodes.grid.children[0].onclick();h.nodes.start.onclick();h.nodes.pause.onclick();const before=JSON.stringify(h.app.controller.state);
 const expected={arena:['Five-lane defense; scroll sideways on narrow screens','五行校园防线；窄屏可横向滚动'],grid:['Deployment cells','部署格'],tokens:['GPU supplies','GPU补给'],cards:['Choose character','选择角色']};
 for(const [id,labels]of Object.entries(expected))assert.equal(h.nodes[id].getAttribute('aria-label'),labels[0]);
 h.reset();h.nodes.language.onclick();assert.equal(h.doc.documentElement.lang,'zh-CN');for(const [id,labels]of Object.entries(expected)){assert.equal(h.nodes[id].getAttribute('aria-label'),labels[1]);assert.equal(h.writes.filter(w=>w.label===id&&w.key==='aria-label').length,1);}
 h.reset();h.app.render();assert.equal(h.writes.length,0);h.nodes.language.onclick();for(const [id,labels]of Object.entries(expected))assert.equal(h.nodes[id].getAttribute('aria-label'),labels[0]);assert.equal(JSON.stringify(h.app.controller.state),before);
});
test('resize changes overlay and canvas dimensions; same-size resize is write-free',()=>{
 const h=harness();h.reset();h.resize(740,400);assert(h.writes.some(w=>w.kind==='style'));assert.equal(h.nodes.scene.width,740);const tr=UI.transform(740,400);assert.equal(parseFloat(h.nodes.grid.children[0].style.left),tr.x+140*tr.scale);h.reset();h.resize(740,400);assert.equal(h.writes.length,0);
});
test('asset failure and recovery are rechecked on unchanged paused frames',()=>{
 const h=harness();h.nodes.start.onclick();h.nodes.pause.onclick();h.asset('failed');h.reset();h.app.frame(0);assert(h.nodes.goal.textContent.includes('Some art failed'));assert.equal(h.writes.filter(w=>w.label==='goal').length,1);h.reset();h.app.frame(100);assert.equal(h.writes.length,0);h.asset('ready');h.reset();h.app.frame(200);assert(!h.nodes.goal.textContent.includes('Some art failed'));assert.equal(h.writes.filter(w=>w.label==='goal').length,1);
});
test('repeated input remains safe and correction reads actual DOM rather than cached state',()=>{
 const h=harness();h.nodes.grid.children[0].onclick();h.reset();h.nodes.grid.children[0].onclick();assert.equal(h.writes.length,0);assert.equal(h.app.controller.state.compute,130);
 h.nodes.gpu.textContent='stale';h.nodes.grid.children[0].setAttribute('aria-pressed','false');h.reset();h.app.render();assert.equal(h.nodes.gpu.textContent,'GPU 130');assert.equal(h.nodes.grid.children[0].getAttribute('aria-pressed'),'true');assert.equal(h.writes.length,2);
 h.nodes.refund.onclick();assert.equal(h.app.controller.state.units.length,0);assert.equal(h.app.controller.state.compute,180);h.nodes.start.onclick({detail:1});h.nodes.start.onclick({detail:2});assert.equal(h.app.controller.state.phase,'battle');
});
test('GPU animation continues moving, pause freezes it, and collection removes its control',()=>{
 const h=harness();h.nodes.start.onclick();for(let i=0;i<6;i++)h.app.controller.tick(1);h.app.render();const token=h.nodes.tokens.children[0],before=token.style.left;h.app.frame(0);h.reset();h.app.frame(100);assert.notEqual(token.style.left,before);assert(h.writes.some(w=>w.kind==='style'));h.nodes.pause.onclick();const frozen=token.style.left;h.reset();h.app.frame(200);assert.equal(token.style.left,frozen);assert.equal(h.writes.length,0);h.nodes.pause.onclick();token.onclick();const compute=h.app.controller.state.compute;token.onclick();assert.equal(h.app.controller.state.compute,compute);assert.equal(h.nodes.tokens.children.length,0);
});
test('completed review language writes once, clones remain isolated, retry hides and clears facts',()=>{
 const h=harness(4);finishConvoy(h,true);const facts=JSON.stringify(h.app.controller.review),copy=h.app.controller.review;copy.leaks[0]=999;assert.equal(JSON.stringify(h.app.controller.review),facts);
 h.nodes['battle-review'].open=true;h.reset();h.nodes.language.onclick();assert(h.nodes['review-content'].textContent.includes('无漏敌，无守卫损失'));assert.equal(h.nodes['review-title'].textContent,'查看本局记录');for(const id of ['review-title','review-content'])assert.equal(h.writes.filter(w=>w.label===id&&w.kind==='text').length,1);assert.equal(h.nodes['battle-review'].open,true);h.reset();h.app.render();assert.equal(h.writes.length,0);
 h.nodes.retry.onclick();assert.equal(h.nodes['battle-review'].hidden,true);assert.equal(h.nodes['review-content'].textContent,'');assert.equal(h.app.controller.review,null);assert.equal(h.app.controller.selectedUnit,null);h.nodes.grid.children[7].onclick();assert(h.app.controller.selectedUnit);h.nodes.cards.children[1].onclick();assert.equal(h.app.controller.selectedUnit,null);
});
test('missing optional helper still mounts and plays, with terminal review hidden',()=>{
 const vm=require('node:vm'),box={};vm.runInNewContext(fs.readFileSync(__dirname+'/td-lanes-ui.js','utf8'),box);const h=harness(4,box.TDLanesUI);h.nodes.start.onclick();for(let i=0;i<300&&h.app.controller.state.phase==='battle';i++)h.app.controller.tick(1);h.app.render();assert.equal(h.app.controller.state.phase,'lost');assert.equal(h.app.controller.review,null);assert.equal(h.nodes['battle-review'].hidden,true);assert.equal(h.nodes['review-content'].textContent,'');
});
test('actual terminal shot settles across visible RAF frames, not hidden time or UI-only redraws',()=>{
 const R=require('./td-lanes-renderer'),h=harness(4);h.nodes.cards.children[1].onclick();h.nodes.grid.children[12].onclick();h.nodes.grid.children[19].onclick();h.nodes.start.onclick();let now=0;h.app.frame(now);
 function win(){for(let i=0;i<3000&&h.app.controller.state.phase==='battle';i++){now+=1000/60;h.app.frame(now);}assert.equal(h.app.controller.state.phase,'won');assert.equal(h.seen.opts.terminalElapsed,0);}
 win();const s=h.app.controller.state,u=s.units.find(u=>u.fired>0&&E.definitions.units.gpt.interval-u.cooldown<.24);assert(u,'real terminal shot is still releasing');
 const before=JSON.stringify(s);assert.notEqual(R.gptFrame(u,s,h.seen.opts.visualTime,false,1.4,0).index,0);
 h.app.render();h.nodes.language.onclick();h.resize(740,400);assert.equal(h.seen.opts.terminalElapsed,0);assert.equal(JSON.stringify(s),before);
 h.doc.hidden=true;now+=60000;h.app.frame(now);now+=60000;h.app.frame(now);h.doc.hidden=false;now+=1000/60;h.app.frame(now);assert(h.seen.opts.terminalElapsed>0&&h.seen.opts.terminalElapsed<.02,'hidden elapsed time is not accrued');
 for(let i=0;i<40;i++){now+=1000/60;h.app.frame(now);}assert(h.seen.opts.terminalElapsed>.6);assert.equal(R.gptFrame(u,s,h.seen.opts.visualTime,false,1.4,h.seen.opts.terminalElapsed).index,0);assert.equal(JSON.stringify(s),before);
 h.nodes.retry.onclick();assert.equal(h.app.controller.state.phase,'prepare');assert.equal(h.seen.opts.terminalElapsed,0);h.nodes.start.onclick();win();assert.equal(h.seen.opts.terminalElapsed,0,'new terminal result gets its own tail');
});


test('normalized readback settles, resize intent changes apply, and externally changed styles repair',()=>{
 const h=harness(0,UI,true);h.resize(739.123,401.789);const cell=h.nodes.grid.children[0],left=cell.style.left;
 const requested=(UI.transform(739.123,401.789).x+140*UI.transform(739.123,401.789).scale)+'px';assert.notEqual(left,requested);assert.equal(left,serializeStyle(requested));
 h.reset();h.app.position();assert.equal(h.writes.length,0);
 cell.style.left='999px';cell.style.width='1px';h.reset();h.app.position();assert.equal(cell.style.left,left);assert.equal(h.writes.length,2);assert(h.writes.every(w=>w.kind==='style'));h.reset();h.app.position();assert.equal(h.writes.length,0);
 h.resize(641.234,399.876);assert.notEqual(cell.style.left,left);h.reset();h.resize(641.234,399.876);assert.equal(h.writes.length,0);
 // Different intent is applied even when the new value serializes to the same pixels.
 h.reset();h.resize(641.2340001,399.876);assert(h.writes.some(w=>w.kind==='style'));h.reset();h.app.position();assert.equal(h.writes.length,0);
});
test('normalizing GPU transform follows motion, freezes, repairs external changes and respects reduced motion',()=>{
 const h=harness(0,UI,true);h.resize(739.123,401.789);h.nodes.start.onclick();for(let i=0;i<62;i++)h.app.controller.tick(.1);h.app.render();const token=h.nodes.tokens.children[0],before=token.style.transform;assert(before.includes(', '));
 h.app.controller.tick(.1);h.app.render();assert.notEqual(token.style.transform,before);h.nodes.pause.onclick();const frozen=token.style.transform;h.reset();h.app.render();assert.equal(h.writes.length,0);
 token.style.transform='rotate(99deg)';h.reset();h.app.render();assert.equal(token.style.transform,frozen);assert.equal(h.writes.filter(w=>w.kind==='style').length,1);h.reset();h.app.render();assert.equal(h.writes.length,0);
 h.events.motion({matches:true});h.app.render();assert.equal(token.style.transform,serializeStyle('translate(-50%,-50%) rotate(0deg)'));h.reset();h.app.render();assert.equal(h.writes.length,0);
});
test('normalizing style cache is independent of language, status, failed assets and recovery',()=>{
 const h=harness(0,UI,true);h.resize(739.123,401.789);h.nodes.grid.children[0].onclick();h.nodes.start.onclick();const u=h.app.controller.state.units[0];let sawRice=false;
 for(let i=0;i<300&&h.app.controller.state.phase==='battle';i++){h.app.controller.tick(.1);h.app.render();if(u.status==='rice'){sawRice=true;assert(h.nodes['unit-summary'].textContent.includes('Rice break'));break;}}assert(sawRice);
 h.nodes.pause.onclick();h.reset();const draws=h.draws;h.nodes.language.onclick();assert(h.nodes['unit-summary'].textContent.includes('吃饭中'));assert(!h.writes.some(w=>w.kind==='style'));
 h.asset('failed');h.app.frame(0);assert(h.nodes.goal.textContent.includes('部分美术加载失败'));h.asset('ready');h.app.frame(100);assert(!h.nodes.goal.textContent.includes('部分美术加载失败'));assert.equal(h.draws-draws,3);
 h.reset();h.app.frame(200);assert.equal(h.writes.length,0);
 h.nodes.pause.onclick();for(let i=0;i<50&&u.status==='rice';i++){h.app.controller.tick(.1);h.app.render();}assert.equal(u.status,'normal');assert(!h.nodes['unit-summary'].textContent.includes('吃饭中'));assert(!h.nodes.grid.children[0].getAttribute('aria-label').includes('吃饭中'));
});
delete global.TDLanesRenderer;console.log(groups+' DOM write regression groups passed; mock work counts only.');
