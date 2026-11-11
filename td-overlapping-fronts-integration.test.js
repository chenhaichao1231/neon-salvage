'use strict';
// Production scripts and simulation, with DOM/canvas/storage doubles. No browser acceptance.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const html=fs.readFileSync(__dirname+'/index.html','utf8'),plain=x=>JSON.parse(JSON.stringify(x));
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const oldHash='ba043f107226ce7338c46236a8883b3d46d275337ca0585e909ca6ff9d60cc0a';
const marker='// Main 5: overlapping active fronts, using only existing enemies and ordinary survival.\n';
const source=f=>fs.readFileSync(__dirname+'/'+f,'utf8');
const contentSource=source('td-lanes-content.js'),tail="if(typeof module==='object'&&module.exports)module.exports=E;";
const oldContent=contentSource.slice(0,contentSource.indexOf(marker))+contentSource.slice(contentSource.indexOf(tail));
const bookmarkKey='campus-defense-stage-v1';let groups=0;
function test(name,fn){fn();console.log('PASS',++groups,name);}
function storage(last=6,highest=last,lang='en'){
 const data=new Map([['unrelated','keep'],[bookmarkKey,JSON.stringify({version:1,lastStage:last,highestStage:highest,lang})]]),writes=[];
 return{data,writes,getItem:k=>data.get(k)??null,setItem(k,v){writes.push([k,v]);data.set(k,v);},get bookmark(){return JSON.parse(data.get(bookmarkKey));}};
}
function runtime(legacy=false){
 const box={};
 for(const [,file]of html.matchAll(/<script src="([^?]+)\?[^\"]*"><\/script>/g)){
  let text=source(file);if(legacy&&file==='td-lanes-content.js')text=oldContent;
  if(legacy&&file==='td-replay-store.js')text=text.replace(hash(contentSource),oldHash);
  vm.runInNewContext(text,box,{filename:file});
 }
 return{box,E:box.TDLanes,U:box.TDLanesUI,P:box.TDReplayStore,R:box.TDBattleReview};
}
function harness(st=storage(),auto=false){
 const nodes={},events={},calls=[];let raf,state,view;
 class Node{
  constructor(){this.children=[];this.style={};this.attributes={};this.hidden=false;this.disabled=false;this.textContent='';}
  getAttribute(k){return this.attributes[k]??null;}setAttribute(k,v){this.attributes[k]=v;}
  appendChild(n){n.parent=this;this.children.push(n);return n;}append(...ns){ns.forEach(n=>this.appendChild(n));}
  replaceChildren(...ns){this.children=[];this.append(...ns);}remove(){this.parent.children=this.parent.children.filter(n=>n!==this);}
  addEventListener(k,f){events[k]=f;}getBoundingClientRect(){return{left:0,top:0,width:1120,height:650};}
  focus(){doc.activeElement=this;this.onfocus?.();}
 }
 for(const [,id]of html.matchAll(/id="([^"]+)"/g))nodes[id]=new Node();
 const ctx=new Proxy({fillRect(...args){calls.push({style:this.fillStyle,args});}},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});nodes.scene.getContext=()=>ctx;
 const doc={hidden:false,documentElement:{},getElementById:id=>nodes[id],createElement:()=>new Node(),addEventListener:(k,v)=>events[k]=v};
 const win={localStorage:st,devicePixelRatio:1,requestAnimationFrame:f=>raf=f,addEventListener:(k,v)=>events[k]=v,matchMedia:()=>({matches:false,addEventListener(){}})};
 const box=auto?{document:doc,window:win}:{window:win};
 for(const [,file]of html.matchAll(/<script src="([^?]+)\?[^\"]*"><\/script>/g)){
  if(file==='td-lanes-ui.js'){
   const create=box.TDLanes.create;box.TDLanes.create=(...a)=>(state=create(...a));
   const draw=box.TDLanesRenderer.draw;box.TDLanesRenderer.draw=(ctx,v,o)=>{view=v;return draw(ctx,v,o);};
  }
  vm.runInNewContext(source(file),box,{filename:file});
 }
 const app=auto?null:box.TDLanesUI.mount(box.TDLanes,doc,win);
 return{box,E:box.TDLanes,U:box.TDLanesUI,P:box.TDReplayStore,R:box.TDBattleReview,st,app,c:app?.controller,nodes,doc,events,calls,get state(){return state;},get view(){return view;},frame:t=>raf(t),cell:(r,c)=>nodes.grid.children[r*7+c]};
}
const main4Plan=[[0,0,0],[0,1,0],[0,2,0],[10,3,0],[22,4,0],[28,2,1],[40,4,1],[52,0,1]];
const main5Plan=[[0,0,0],[0,1,0],[0,2,0],[10,3,0],[22,4,0],[28,3,1],[40,4,1],[52,1,1],[64,0,1]];
function run(c,plan=[],retry=false){
 let i=0;const events=[],paid=[];
 const buy=()=>{while(i<plan.length&&c.state.time+1e-9>=plan[i][0]){
  const [time,row,col]=plan[i++];if(retry&&!time)continue;
  const active=c.state.phase==='battle';if(active){assert(c.pause().ok);const frozen=JSON.stringify(c.state);assert.equal(c.tick(1).length,0);assert.equal(JSON.stringify(c.state),frozen);}
  assert(c.select('deepseek').ok);const before=c.state.compute;assert(c.cell(row,col).ok);paid.push({time:c.state.time,row,col,before,after:c.state.compute});if(active)assert(c.pause().ok);
 }};
 buy();assert(c.start().ok);while(c.state.phase==='battle'&&c.state.time<180){events.push(...plain(c.tick(1/60)));if(c.state.phase==='battle')buy();}
 assert.notEqual(c.state.phase,'battle');return{events,paid};
}
function empty(c,level,seed=1){assert.equal(c.state.level,level);assert.equal(c.state.phase,'prepare');assert.equal(c.state.seed,seed);assert.equal(c.state.compute,180);assert.equal(c.state.units.length,0);}

test('exact frozen content, first six definitions and all six production entry scripts are preserved',()=>{
 const r=runtime(),{E,U,P}=r;assert.equal(E.levels.length,9);
 assert.equal(hash(source('td-lanes.js')),'537c9d404a94be925e5b0c8632fca48a76cd74ba52269d8d142cd7bd5ceb1a5f');
 assert.equal(hash(oldContent),oldHash,'removing only appended block recovers exact original source bytes');
 assert.equal(hash(JSON.stringify(E.levels.slice(0,6))),'2a7c833dda2192de361e97a9130ffebe8c371531e49fb6fe730e0eb38a4a5423');
 assert.equal(hash(JSON.stringify(E.levels[6],null,2)+'\n'),'e5aa86294e818b17eb030d061712942692d0c495b9a027b5abc4845ea9b944dc');
 assert.equal(P.COMBAT_REVISION,'td-lanes-sha256:'+hash(source('td-lanes.js'))+';content-sha256:'+hash(contentSource));
 assert.deepEqual([...html.matchAll(/<script src="([^?]+)\?/g)].map(m=>m[1]),['td-lanes.js','td-lanes-content.js','td-lanes-renderer.js','td-battle-review.js','td-replay-store.js','td-lanes-ui.js']);
 assert.deepEqual(plain(E.roster),['deepseek','gpt','claude','grok']);assert.deepEqual(Object.keys(E.levels[6]).sort(),['brief','name','phaseStarts','spawns']);
 assert.deepEqual(plain(U.stageOrder(E)),[0,1,2,5,6,7,8,3,4]);assert.deepEqual(E.levels.map((_,i)=>U.nextStage(E,i)).join(','),'1,2,5,4,5,6,7,8,0');
 assert(html.includes('<span class="eyebrow">AI CAMPUS / DEMO 0.15</span>'),'release banner identifies Demo 0.15');
});
test('53 exact lane/type/time arrivals and four phase counts use ordinary five-core survival',()=>{
 const {E,U}=runtime(),d=E.levels[6],schedule=E.preview(6);
 const exact=[{data:[10,14],armor:[52],charge:[34,37,40,54,57]},{armor:[8,13,18,32,36]},{data:[4,7]},{swarm:[14,14.3,14.6,14.9,15.2,15.5,15.8,16.1,32,32.3,32.6,32.9,33.2,33.5],charge:[20,23,35,38]},{data:[16,19],swarm:[36,36.3,36.6,36.9,37.2,37.5,37.8,38.1,52,52.3,52.6,52.9,53.2,53.5],charge:[40,43,55,58]}];
 assert.equal(schedule.length,53);assert.equal(schedule.at(-1).time,58);assert.deepEqual(plain(d.phaseStarts),[4,14,32,52]);
 for(let row=0;row<5;row++)for(const type of Object.keys(E.definitions.enemies))assert.deepEqual(plain(schedule.filter(p=>p.row===row&&p.type===type).map(p=>p.time)),exact[row][type]||[]);
 assert.deepEqual(plain(U.phaseGroups(d).map(g=>g.spawns.length)),[5,14,23,11]);
 assert.deepEqual(['data','armor','swarm','charge'].map(t=>schedule.filter(p=>p.type===t).length),[6,6,28,13]);assert.equal(E.create(6).core,5);
 assert(!Object.hasOwn(d,'objective'));assert(!Object.hasOwn(d,'optional'));assert(schedule.every(p=>Object.keys(p).sort().join(',')==='row,time,type'));
});
test('actual script-order automatic mount shows both briefings, main menu, counts and read-only coverage',()=>{
 for(const lang of ['zh','en']){
  const st=storage(6,6,lang),h=harness(st,true),n=h.nodes;empty({state:h.state},6);
  assert.equal(n.goal.textContent,h.E.levels[6].brief[lang]);assert.equal(n['stage-select'].children.find(o=>o.value==='6').textContent,'5 · '+(lang==='en'?'Overlap fronts':h.E.levels[6].name[lang]));
  assert.equal(n.wave.textContent,lang==='zh'?'主线 5 · 第1/4段 · 0/53':'Main 5 · Push 1/4 · 0/53');
  require('./td-compact-forecast.test').assertForecast(n,h.E,6,lang);assert.equal(n['forecast-content'].children.filter(n=>n.className==='phase-heading').length,4);assert.equal(n.cards.children.length,4);
  const before=JSON.stringify(h.state);h.cell(3,1).onpointerenter({pointerType:'mouse',buttons:0});assert.deepEqual(plain(h.view.placementLane),{row:3,start:1.4,end:7.8});
  assert(h.calls.some(c=>c.style==='#b9edff21'));assert.equal(JSON.stringify(h.state),before);assert.equal(st.writes.length,0);
  h.cell(3,1).onpointerleave();assert.equal(h.view.placementLane,null);h.events.keydown({key:'Tab'});h.cell(1,0).focus();assert.deepEqual(plain(h.view.placementLane),{row:1,start:.4,end:7.8});assert.equal(JSON.stringify(h.state),before);
  n.start.onclick();assert.equal(h.state.phase,'battle');assert.equal(h.view.placementLane,null);n.pause.onclick();h.cell(4,0).onpointerenter({pointerType:'mouse',buttons:0});assert(h.view.placementLane);const frozen=JSON.stringify(h.state);h.frame(0);h.frame(1000);assert.equal(JSON.stringify(h.state),frozen);
  h.doc.hidden=true;h.events.visibilitychange();assert.equal(h.view.placementLane,null);assert.equal(h.state.paused,true);
 }
});
test('actual nine-stage campaign preserves first-two Next-only timing and main3 immediate persistence',()=>{
 const st=storage(0,0),h=harness(st),c=h.c;
 for(const level of [0,1]){
  const writes=st.writes.filter(([k])=>k===bookmarkKey).length;run(c,main4Plan);assert.equal(c.state.phase,'won');assert.equal(c.highestStage,level);assert(!c.available(level+1));assert.equal(st.writes.filter(([k])=>k===bookmarkKey).length,writes);
  const reload=harness(st);empty(reload.c,level);assert(!reload.c.available(level+1));assert(c.start().ok);assert.equal(c.state.level,level+1);assert.equal(st.bookmark.highestStage,level+1);
 }
 run(c,main4Plan);assert.equal(c.state.phase,'won');assert.equal(c.highestStage,5);assert(c.available(5));assert(!c.available(6));assert.deepEqual(st.bookmark,{version:1,lastStage:2,highestStage:5,lang:'en'});
 const reload=harness(st);empty(reload.c,2);assert(reload.c.available(5));assert(!reload.c.available(6));const snapshot=plain(c.state.snapshot);assert(c.retry().ok);assert.deepEqual(plain(c.state),snapshot);assert(c.available(5));assert(!c.available(6));
});
test('legacy main/drill access, actual losses and interruptions never grant main 5',()=>{
 for(const high of [3,4,5])for(const lang of ['zh','en']){
  const st=storage(high,high,lang),h=harness(st),c=h.c;assert(c.available(5));assert(!c.available(6));assert(!c.stage(6).ok);
  assert(c.stage(5).ok);const n=st.writes.length;c.start();c.tick(10);h.doc.hidden=true;h.events.visibilitychange();assert(c.state.paused);assert(!c.available(6));const reload=harness(st);empty(reload.c,5);assert(!reload.c.available(6));assert.equal(st.writes.length,n);
  assert(c.retry().ok);run(c);assert.equal(c.state.phase,'lost');assert(!c.available(6));assert(!c.stage(6).ok);assert.equal(st.bookmark.highestStage,5);
  assert(c.retry().ok);assert(c.stage(0).ok);assert(c.stage(3).ok);assert(c.stage(4).ok);assert(c.stage(5).ok);c.language();assert(!harness(st).c.available(6));
 }
});
test('real main4→main5 carries mutable RNG; win, exact retry, history, reload and new Main6 Next stay honest',()=>{
 for(const lang of ['zh','en']){
  const st=storage(5,5,lang),h=harness(st),c=h.c;
  const main4=run(c,main4Plan),main4Snapshot=plain(c.state.snapshot);assert.equal(c.state.phase,'won');assert(c.available(6));assert.deepEqual(st.bookmark,{version:1,lastStage:5,highestStage:6,lang});assert.equal(c.nextStage,6);
  const ready=harness(st);empty(ready.c,5);assert(ready.c.available(6));assert(ready.c.stage(6).ok);empty(ready.c,6);
  assert(c.retry().ok);assert.deepEqual(plain(c.state),main4Snapshot);assert(c.available(6));assert.deepEqual(run(c,main4Plan,true).events,main4.events);
  const carried=c.state.seed;assert.notEqual(carried,1);h.app.render();assert.equal(h.nodes.start.textContent,(lang==='zh'?'下一主线 · ':'Next main · ')+h.E.levels[6].name[lang]);
  h.nodes.start.onclick({detail:1});empty(c,6,carried);h.nodes.start.onclick({detail:2});empty(c,6,carried);
  const first=run(c,main5Plan),snapshot=plain(c.state.snapshot),terminal=plain(c.state),facts=plain(c.review);assert.equal(c.state.phase,'won');assert.equal(c.state.core,5);assert.equal(c.state.nextSpawn,53);assert.equal(c.review.spent,450);assert.equal(c.review.previous,null);assert.equal(c.nextStage,7);assert(c.available(7));assert.equal(st.bookmark.highestStage,7);
  const count=st.writes.length;for(let i=0;i<100;i++)c.tick(1/60);assert.equal(st.writes.length,count);assert.deepEqual(plain(c.state),terminal);
  assert(c.retry().ok);assert.deepEqual(plain(c.state),snapshot);assert.deepEqual(plain(c.reference.previous),plain(h.P.summary(facts)));const again=run(c,main5Plan,true);assert.deepEqual(again.events,first.events);assert.deepEqual(again.paid,first.paid.filter(p=>p.time>0));assert.deepEqual(plain(c.state),terminal);assert.deepEqual(plain(c.review.previous),plain(h.P.summary(facts)));
  const raw=st.data.get(h.P.PREFIX+6),record=JSON.parse(raw);assert.deepEqual(Object.keys(record.facts).sort(),['core','leaks','losses','outcome','refunded','spent','time','withdrawals']);assert(!raw.includes('firstLeak'));assert(!raw.includes('enemyType'));
  const reload=harness(st);empty(reload.c,6);assert.equal(reload.c.reference.previous,null);assert.equal(reload.c.reference.incompatible,true);assert.deepEqual(plain(reload.c.reference.historical),plain(h.P.summary(facts)));assert.equal(st.data.get(h.P.PREFIX+6),raw);
  assert.match(reload.nodes['previous-stage-result'].textContent,lang==='zh'?/计划或规则与本次不同/:/Plans or rules differ/);
  h.app.render();assert.equal(h.nodes.start.textContent,(lang==='zh'?'下一主线 · ':'Next main · ')+h.E.levels[7].name[lang]);h.nodes.start.onclick({detail:1});empty(c,7,terminal.seed);assert(c.available(6));assert(c.available(7));assert.equal(st.bookmark.highestStage,7);assert.equal(st.data.get('unrelated'),'keep');
 }
});
test('current raw6 leak identity and exact-retry deltas never enter compact history',()=>{
 for(const lang of ['zh','en']){
  const st=storage(6,6,lang),h=harness(st),{c,nodes:n}=h,first=run(c);assert.equal(c.state.phase,'lost');const leak=first.events.find(e=>e.type==='leak');assert(leak);
  assert.deepEqual(plain(c.review.firstLeak),{row:leak.row,time:leak.time,enemyType:leak.enemyType});h.app.render();assert(n['review-content'].textContent.includes(h.E.definitions.enemies[leak.enemyType].name[lang]));assert(n['review-content'].textContent.includes(lang==='zh'?'首次漏敌':'First leak'));
  const raw=st.data.get(h.P.PREFIX+6),facts=JSON.parse(raw).facts;assert(!Object.hasOwn(facts,'firstLeak'));assert(c.retry().ok);h.app.render();assert(n['battle-review'].hidden);assert(!/First leak|首次漏敌/.test(n['previous-stage-result'].textContent));
  const again=run(c,[],true);assert.deepEqual(again.events,first.events);assert.deepEqual(plain(c.review.previous),facts);h.app.render();assert(n['review-content'].textContent.includes(lang==='zh'?'较本局开始前':'Change from reference'));
  const reload=harness(st);assert.equal(reload.c.review,null);assert(!/First leak|首次漏敌/.test(reload.nodes['previous-stage-result'].textContent));
 }
});
test('valid old0.14 records for all original stages remain visible, untouched on load, and cannot produce deltas',()=>{
 const legacy=runtime(true);assert.equal(legacy.E.levels.length,6);assert.equal(hash(oldContent),oldHash);
 for(let stage=0;stage<6;stage++){
  const old=storage(stage,5),c=legacy.U.controller(legacy.E,old);run(c);const key=legacy.P.PREFIX+stage,raw=old.data.get(key),facts=JSON.parse(raw).facts;
  for(const lang of ['zh','en']){
   const st=storage(stage,5,lang);st.data.set(key,raw);const before=[...st.data],h=harness(st);assert.equal(st.writes.length,0);assert.deepEqual([...st.data],before);assert.equal(h.c.reference.previous,null);assert.equal(h.c.reference.incompatible,true);assert.deepEqual(plain(h.c.reference.historical),facts);
   assert(!h.nodes['previous-stage-result'].hidden);assert.match(h.nodes['previous-stage-result'].textContent,lang==='zh'?/仅供回顾，不作成绩对比/:/shown for reference, without performance comparison/);assert.equal(st.data.get(key),raw);
   run(h.c);assert.equal(h.c.review.previous,null);assert.equal(h.c.review.incompatible,true);h.app.render();const text=h.nodes['review-content'].textContent;assert(text.includes(lang==='zh'?'此前结果条件不同，本局不作对比':'prior result used different conditions; no comparison'));assert(!/Change from reference|较本局开始前/.test(text));
  }
 }
});
console.log('PASS '+groups+' Main5 integration groups on the nine-stage production campaign; local Node/vm only');
