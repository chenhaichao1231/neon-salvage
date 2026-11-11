'use strict';
// Production scripts and simulation, with DOM/canvas/storage doubles. No browser acceptance.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const html=fs.readFileSync(__dirname+'/index.html','utf8'),plain=x=>JSON.parse(JSON.stringify(x));
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const oldHash='4da417cfc636a8cbab9305ae5db0f6e634c394a1c7b833c1c78d459cc43ccd44';
const marker='// Main 7: middle lanes change armor and crowd roles with the original rules.\n';
const source=f=>fs.readFileSync(__dirname+'/'+f,'utf8');
const contentSource=source('td-lanes-content.js'),tail="if(typeof module==='object'&&module.exports)module.exports=E;";
const oldContent=contentSource.slice(0,contentSource.indexOf(marker))+contentSource.slice(contentSource.indexOf(tail));
const bookmarkKey='campus-defense-stage-v1';let groups=0;
function test(name,fn){fn();console.log('PASS',++groups,name);}
function storage(last=8,highest=last,lang='en'){
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
const main6Plan=[[0,0,0],[0,2,0],[0,4,0],[10,1,0],[22,3,0],[28,0,1],[40,2,1],[52,4,1]];
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

test('exact append preserves original eight raw encounters and all gameplay bytes',()=>{
 const {E,U,P}=runtime(),old=runtime(true);assert.equal(E.levels.length,9);assert.equal(old.E.levels.length,8);
 assert.equal(hash(source('td-lanes.js')),'537c9d404a94be925e5b0c8632fca48a76cd74ba52269d8d142cd7bd5ceb1a5f');assert.equal(hash(oldContent),oldHash);
 assert.deepEqual(plain(E.levels.slice(0,8)),plain(old.E.levels));
 for(const k of ['definitions','roster','grid','economy'])assert.deepEqual(plain(E[k]),plain(old.E[k]));
 assert.equal(hash(JSON.stringify(E.levels[8],null,2)+'\n'),'640de2107346c2c4b611392af2ecf45906bf5c21098bc53c314b43298e5353f4');
 assert.equal(P.COMBAT_REVISION,'td-lanes-sha256:'+hash(source('td-lanes.js'))+';content-sha256:'+hash(contentSource));
 assert.deepEqual(plain(U.stageOrder(E)),[0,1,2,5,6,7,8,3,4]);assert.deepEqual(plain(E.levels.map((_,i)=>U.nextStage(E,i))),[1,2,5,4,5,6,7,8,0]);
 assert.deepEqual(plain(E.roster),['deepseek','gpt','claude','grok']);assert.equal(E.definitions.units.claude.damage,30);assert(html.includes('<span class="eyebrow">AI CAMPUS / DEMO 0.15</span>'));
});
test('54 exact arrivals disclose rotating middle roles, empty outer lanes and ordinary survival',()=>{
 const {E,U}=runtime(),d=E.levels[8],p=plain(E.preview(8));assert.deepEqual(Object.keys(d).sort(),['brief','name','phaseStarts','spawns']);
 assert.deepEqual(plain(d.phaseStarts),[4,20,36]);assert.deepEqual(plain(U.phaseGroups(d).map(g=>g.spawns.length)),[18,18,18]);assert.equal(p.length,54);assert.equal(p.at(-1).time,48);assert.equal(E.create(8).core,5);
 assert.deepEqual([0,1,2,3,4].map(row=>p.filter(e=>e.row===row).length),[0,18,18,18,0]);
 for(const [row,armor,begin]of [[1,[4,10,16],22],[2,[20,26,32],38],[3,[36,42,48],6]]){
  assert.deepEqual(p.filter(e=>e.row===row&&e.type==='armor').map(e=>e.time),armor);
  assert.deepEqual(p.filter(e=>e.row===row&&e.type==='swarm').map(e=>e.time),Array.from({length:15},(_,i)=>(begin*10+3*i)/10));
 }
 assert(p.every(e=>Object.keys(e).sort().join(',')==='row,time,type'));assert.deepEqual(['armor','swarm','data','charge'].map(t=>p.filter(e=>e.type===t).length),[9,45,0,0]);
 for(const lang of ['en','zh']){const h=harness(storage(8,8,lang));require('./td-compact-forecast.test').assertForecast(h.nodes,h.E,8,lang);assert.equal(h.nodes.goal.textContent,d.brief[lang]);}
});
test('automatic full-name bilingual menu and preparation controls preserve existing layout',()=>{
 const {createCanvas,GlobalFonts}=require('@napi-rs/canvas');GlobalFonts.registerFromPath('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc','stage-fit');const ctx=createCanvas(1,1).getContext('2d');ctx.font='14px stage-fit';
 for(const lang of ['zh','en']){
  const h=harness(storage(8,8,lang),true),n=h.nodes;empty({state:h.state},8);
  assert.deepEqual(n['stage-select'].children.map(o=>o.value),['0','1','2','5','6','7','8','3','4']);
  const option=n['stage-select'].children.find(o=>o.value==='8');assert.equal(option.textContent,'7 · '+h.E.levels[8].name[lang]);assert.equal(option.attributes.title,h.E.levels[8].name[lang]);assert.equal(option.attributes['aria-label'],h.E.levels[8].name[lang]);assert(ctx.measureText(option.textContent).width<=133);
  assert.equal(n['stage-select'].attributes.title,h.E.levels[8].name[lang]);assert(n['stage-select'].attributes['aria-label'].includes(h.E.levels[8].name[lang]));assert.equal(n.wave.textContent,lang==='zh'?'主线 7 · 第1/3段 · 0/54':'Main 7 · Push 1/3 · 0/54');
  assert.equal(n['row-preview'].children[0].textContent,'');assert.equal(n['row-preview'].children[4].textContent,'');assert.equal(n.cards.children.length,4);assert(n.retry.disabled);
  const before=JSON.stringify(h.state);h.cell(1,1).onpointerenter({pointerType:'mouse',buttons:0});assert.deepEqual(plain(h.view.placementLane),{row:1,start:1.4,end:7.8});assert.equal(JSON.stringify(h.state),before);assert.equal(h.st.writes.length,0);
  h.cell(1,1).onpointerleave();h.events.keydown({key:'Tab'});h.cell(3,0).focus();assert.deepEqual(plain(h.view.placementLane),{row:3,start:.4,end:7.8});assert.equal(JSON.stringify(h.state),before);
 }
});
test('old Main6 visit and actual historical win do not retroactively unlock Main7',()=>{
 for(const lang of ['zh','en']){
  const legacy=runtime(true),st=storage(7,7,lang),prior=legacy.U.controller(legacy.E,st);run(prior,main6Plan);assert.equal(prior.state.phase,'won');assert.equal(prior.nextStage,0);assert.equal(st.bookmark.highestStage,7);
  const key=legacy.P.PREFIX+7,raw=st.data.get(key),before=[...st.data],writes=st.writes.length,h=harness(st),c=h.c;empty(c,7);assert(!c.available(8));assert(!c.stage(8).ok);assert.equal(c.reference.previous,null);assert(c.reference.historical&&c.reference.incompatible);assert.equal(st.data.get(key),raw);assert.equal(st.writes.length,writes);assert.deepEqual([...st.data],before);
  c.start();c.tick(10);h.doc.hidden=true;h.events.visibilitychange();assert(c.state.paused);assert(!c.available(8));assert(!harness(st).c.available(8));assert.equal(st.writes.length,writes);c.retry();run(c);assert.equal(c.state.phase,'lost');assert(!c.available(8));assert.equal(st.bookmark.highestStage,7);
  c.retry();for(const level of [0,3,4,5,6,7])assert(c.stage(level).ok);c.language();assert(!harness(st).c.available(8));
 }
});
test('all eight previous valid local result records remain historical-only and untouched on load',()=>{
 const legacy=runtime(true);
 for(let level=0;level<8;level++){
  const old=storage(level,7),c=legacy.U.controller(legacy.E,old);run(c);const key=legacy.P.PREFIX+level,raw=old.data.get(key),facts=JSON.parse(raw).facts;
  for(const lang of ['zh','en']){
   const st=storage(level,7,lang);st.data.set(key,raw);const before=[...st.data],h=harness(st);assert.equal(st.writes.length,0);assert.deepEqual([...st.data],before);assert.equal(h.c.reference.previous,null);assert(h.c.reference.incompatible);assert.deepEqual(plain(h.c.reference.historical),facts);assert(!h.c.available(8));assert.equal(st.data.get(key),raw);
   assert.match(h.nodes['previous-stage-result'].textContent,lang==='zh'?/仅供回顾，不作成绩对比/:/shown for reference, without performance comparison/);run(h.c);assert.equal(h.c.review.previous,null);assert(h.c.review.incompatible);h.app.render();assert(!/Change from reference|较本局开始前/.test(h.nodes['review-content'].textContent));
  }
 }
});
test('actual Main6 win unlocks Main7; Next carries natural seed through win, exact retry, history and wrap',()=>{
 const {simulate}=require('./td-rotating-siege-policies.test');
 for(const lang of ['en','zh']){
  const st=storage(7,7,lang),h=harness(st),c=h.c;assert(!c.available(8));const prior=run(c,main6Plan);assert.equal(c.state.phase,'won');assert(c.available(8));assert.equal(c.nextStage,8);assert.deepEqual(st.bookmark,{version:1,lastStage:7,highestStage:8,lang});assert(harness(st).c.available(8));
  const carried=c.state.seed;assert.notEqual(carried,1);h.app.render();assert.equal(h.nodes.start.textContent,(lang==='zh'?'下一主线 · ':'Next main · ')+h.E.levels[8].name[lang]);h.nodes.start.onclick({detail:1});empty(c,8,carried);h.nodes.start.onclick({detail:2});empty(c,8,carried);
  let prevented=0;h.nodes.start.onkeydown({key:'Enter',repeat:true,preventDefault:()=>prevented++});assert.equal(prevented,1);empty(c,8,carried);
  const first=simulate({policy:'pierceReserve',controller:c}),terminal=plain(c.state),facts=plain(c.review),snapshot=plain(c.state.snapshot);assert.equal(c.state.phase,'won');assert.equal(c.state.core,5);assert.equal(c.state.nextSpawn,54);assert.equal(c.review.previous,null);assert.equal(c.nextStage,0);assert.equal(c.review.spent,180+c.state.stats.earned-c.state.compute);assert.equal(c.review.refunded,0);
  const writes=st.writes.length;h.app.render();assert(h.nodes.grid.children.every(n=>n.disabled));assert(h.nodes.refund.disabled);assert(h.nodes.pause.hidden);assert(!h.nodes.retry.disabled);const frozen=JSON.stringify(c.state);
  for(let i=0;i<120;i++)c.tick(1/60);for(const n of h.nodes.tokens.children){assert(n.disabled);n.onclick();}assert(!c.cell(0,6).ok);assert(!c.refund().ok);assert(!c.pause().ok);assert.equal(JSON.stringify(c.state),frozen);assert.equal(st.writes.length,writes);
  assert(c.retry().ok);assert.deepEqual(plain(c.state),snapshot);assert.deepEqual(plain(c.reference.previous),plain(h.P.summary(facts)));const second=simulate({policy:'pierceReserve',controller:c});assert.deepEqual(second.events,first.events);assert.deepEqual(second.final,first.final);assert.deepEqual(plain(c.state),terminal);assert.deepEqual(plain(c.review.previous),plain(h.P.summary(facts)));
  const key=h.P.PREFIX+8,raw=st.data.get(key),record=JSON.parse(raw);assert.deepEqual(Object.keys(record.facts).sort(),['core','leaks','losses','outcome','refunded','spent','time','withdrawals']);assert(!raw.includes('firstLeak'));const reload=harness(st);empty(reload.c,8);assert.equal(reload.c.reference.previous,null);assert(reload.c.reference.incompatible);assert.deepEqual(plain(reload.c.reference.historical),plain(h.P.summary(facts)));assert.equal(st.data.get(key),raw);
  h.app.render();assert.equal(h.nodes.start.textContent,lang==='zh'?'重玩首关':'Replay first');h.nodes.start.onclick({detail:1});empty(c,0,terminal.seed);assert(c.available(8));assert.equal(st.bookmark.highestStage,8);
  console.log('CARRIED '+JSON.stringify({lang,from:7,seed:carried,priorTime:prior.events.at(-1).time,raw8Time:terminal.time,core:terminal.core,spent:facts.spent,terminalSeed:terminal.seed}));
 }
});
test('real pause, affordable reinforcement, one withdrawal, interruption and retry preserve preparation',()=>{
 for(const lang of ['en','zh']){
  const h=harness(storage(8,8,lang)),c=h.c,n=h.nodes;assert(c.select('gpt').ok);assert(c.cell(1,0).ok);assert(c.select('grok').ok);assert(c.cell(3,0).ok);assert(c.start().ok);const prep=plain(c.state.snapshot);while(c.state.time<16)c.tick(1/60);h.app.render();assert(n['stage-select'].disabled);assert(!c.stage(0).ok);n.pause.onclick();const frozen=JSON.stringify(c.state);h.frame(0);h.frame(1000);assert.equal(JSON.stringify(c.state),frozen);
  assert(c.select('deepseek').ok);const money=c.state.compute;assert(c.cell(2,0).ok);assert.equal(c.state.compute,money-50);assert(c.state.paused);const reinforced=JSON.stringify(c.state);c.tick(10);assert.equal(JSON.stringify(c.state),reinforced);
  assert(c.refund().ok);assert.equal(c.state.stats.emergencyCount,1);assert.equal(c.state.stats.emergencyRefunds,25);assert(c.cell(1,0).ok);assert.equal(c.refund().reason,'emergency-used');
  const paused=JSON.stringify(c.state);h.doc.hidden=true;h.events.visibilitychange();h.doc.hidden=false;h.events.visibilitychange();h.frame(100000);c.tick(1);assert.equal(JSON.stringify(c.state),paused);n.language.onclick();assert.equal(JSON.stringify(c.state),paused);n.language.onclick();n.pause.onclick();c.tick(1/60);assert(c.state.time>JSON.parse(paused).time);n.retry.onclick();assert.deepEqual(plain(c.state),prep);assert.equal(c.state.stats.emergencyCount,0);assert.equal(c.state.stats.emergencyRefunds,0);assert.equal(c.state.phase,'prepare');
 }
});
test('Main6 unlock survives failed bookmark writes only within the active session',()=>{
 const backing=storage(7,7),st={getItem:k=>backing.getItem(k),setItem(k,v){if(k===bookmarkKey)throw Error('quota');backing.setItem(k,v);}},h=harness(st),c=h.c;run(c,main6Plan);assert.equal(c.state.phase,'won');assert(c.available(8));assert.equal(c.storageNotice,'unavailable');assert.equal(backing.bookmark.highestStage,7);assert(!harness(backing).c.available(8));assert(c.retry().ok);assert(c.available(8));assert.equal(c.stage(8).reason,'phase');for(const u of [...c.state.units]){assert(c.cell(u.row,u.col).ok);assert(c.refund().ok);}assert(c.stage(8).ok);empty(c,8);assert(!harness(backing).c.available(8));
});
test('both speed controls replay exact controller actions and terminal freeze for win and multi-leak loss',()=>{
 const {simulate,controllerAction}=require('./td-rotating-siege-policies.test');
 for(const policy of ['pierceReserve','familiarBroad']){
  const expected=simulate({policy,seed:1,delay:policy==='familiarBroad'?6:0});
  for(const speed of [1,2])for(const lang of ['en','zh']){
   const h=harness(storage(8,8,lang)),c=h.c;if(speed===2)h.nodes.speed.onclick();assert.equal(c.speed,speed);let ai=0;const events=[];
   const act=()=>{while(ai<expected.actions.length&&expected.actions[ai].tick===c.state.tick){const a=expected.actions[ai++];assert.deepEqual(plain(c.state),a.before);assert.deepEqual(plain(controllerAction(c,a.kind,a.args)),a.result);assert.deepEqual(plain(c.state),a.after);}};
   act();while(c.state.phase==='battle'){const emitted=plain(c.tick(1/(60*speed)));events.push(...emitted.map(e=>({tick:c.state.tick,...e})));act();}
   assert.equal(ai,expected.actions.length);assert.deepEqual(events,expected.events);assert.deepEqual(plain(c.state),expected.final);h.app.render();assert.equal(h.nodes.core.textContent,(lang==='zh'?'核心 ':'Core ')+c.state.core+'/5');assert(h.nodes.grid.children.every(n=>n.disabled));assert(h.nodes.refund.disabled);assert(h.nodes.pause.hidden);
   const facts=plain(c.review),raw=h.st.data.get(h.P.PREFIX+8);assert.equal(JSON.parse(raw).facts.core,c.state.core);assert.equal(c.state.core,5-facts.leaks.reduce((a,b)=>a+b,0));assert(h.P.validFacts(plain(h.P.summary(facts))));
   if(policy==='familiarBroad'){assert.equal(c.state.phase,'lost');assert(c.state.core<0);assert(h.nodes.start.hidden);assert.match(h.nodes.goal.textContent,lang==='zh'?/核心失守/:/Core lost/);assert.match(h.nodes['review-content'].textContent,lang==='zh'?/本局结果：失败/:/This attempt: failed/);}
   const frozen=JSON.stringify(c.state),writes=h.st.writes.length;for(let i=0;i<120;i++)c.tick(1/60);assert.equal(JSON.stringify(c.state),frozen);assert.equal(h.st.writes.length,writes);assert(c.retry().ok);assert.deepEqual(plain(c.state),expected.prepared);assert.deepEqual(plain(c.reference.previous),JSON.parse(raw).facts);
   const reload=harness(h.st);empty(reload.c,8);assert.deepEqual(plain(reload.c.reference.previous),JSON.parse(raw).facts);assert.equal(h.st.data.get(h.P.PREFIX+8),raw);
  }
 }
});
test('paired 60Hz wall frames at1×/2× preserve real combat; only unused terminal accumulator differs',()=>{
 const {simulate,controllerAction}=require('./td-rotating-siege-policies.test');
 for(const policy of ['pierceReserve','familiarBroad']){
  const expected=simulate({policy,seed:1,delay:policy==='familiarBroad'?6:0}),h=harness(storage(8,8,'en')),c=h.c;h.nodes.speed.onclick();const events=[];let ai=0,wallFrames=0;
  assert(expected.actions.every(a=>a.tick%2===0),'this fixed paired-frame witness needs even action boundaries');
  const act=()=>{while(ai<expected.actions.length&&expected.actions[ai].tick===c.state.tick){const a=expected.actions[ai++];assert.deepEqual(plain(c.state),a.before);assert.deepEqual(plain(controllerAction(c,a.kind,a.args)),a.result);assert.deepEqual(plain(c.state),a.after);}};
  act();while(c.state.phase==='battle'){events.push(...plain(c.tick(1/60)));wallFrames++;act();}
  assert.equal(ai,expected.actions.length);assert.deepEqual(events,expected.events.map(({tick,...event})=>event));
  const differences=Object.keys(expected.final).filter(key=>JSON.stringify(c.state[key])!==JSON.stringify(expected.final[key]));assert.deepEqual(differences,['accumulator']);assert.equal(expected.final.accumulator,0);assert.equal(c.state.accumulator,1/60);assert.equal(wallFrames,Math.ceil(expected.final.tick/2));
  for(const key of Object.keys(expected.final))if(key!=='accumulator')assert.deepEqual(plain(c.state[key]),expected.final[key],key);
  const terminal=JSON.stringify(c.state);for(let i=0;i<120;i++)c.tick(1/60);assert.equal(JSON.stringify(c.state),terminal);assert(c.retry().ok);assert.deepEqual(plain(c.state),expected.prepared);
  console.log('PAIRED-SPEED '+JSON.stringify({policy,wallFrames,terminalTick:expected.final.tick,rawAccumulatorAt1x:expected.final.accumulator,rawAccumulatorAt2x:1/60,onlyDifference:'unused terminal accumulator; never changed or normalized in engine'}));
 }
});
console.log('PASS '+groups+' Main7 integration groups; exact production controller and DOM/storage contracts, no browser acceptance');
