'use strict';
// Node/vm production-script tests with DOM/storage doubles. Not browser acceptance.
// Explicit original-six fixtures trim and append encounters in memory only.
// Production nine-encounter checks use the unmodified production scripts.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const html=fs.readFileSync(__dirname+'/index.html','utf8'),clone=x=>JSON.parse(JSON.stringify(x));
const bookmarkKey='campus-defense-stage-v1';let count=0;
function test(name,fn){fn();console.log('PASS',++count,name);}
function storage(last,highest=last,lang='en'){
 const data=new Map([['unrelated','keep']]),reads=[],writes=[];
 if(last!==undefined)data.set(bookmarkKey,JSON.stringify({version:1,lastStage:last,highestStage:highest,lang}));
 return{data,reads,writes,getItem(k){reads.push(k);return data.get(k)??null;},setItem(k,v){writes.push({k,v});data.set(k,v);},get bookmark(){return JSON.parse(data.get(bookmarkKey)||'null');},get bookmarkWrites(){return writes.filter(w=>w.k===bookmarkKey);}};
}
const legacyContentHash='ba043f107226ce7338c46236a8883b3d46d275337ca0585e909ca6ff9d60cc0a';
function runtime(extra=0,{originalSix=false,legacyRevision=false}={}){
 const box={};
 for(const [,name]of html.matchAll(/<script src="([^?]+)\?[^\"]*"><\/script>/g)){
  let source=fs.readFileSync(__dirname+'/'+name,'utf8');
  // Only the original-six golden trace needs its historical serialized revision.
  if(legacyRevision&&name==='td-replay-store.js')source=source.replace(/content-sha256:[a-f0-9]{64}/,'content-sha256:'+legacyContentHash);
  vm.runInNewContext(source,box,{filename:name});
 }
 const E=box.TDLanes,UI=box.TDLanesUI;
 assert.equal(E.levels.length,9);
 if(originalSix)E.levels.splice(6);
 else assert.equal(extra,0,'synthetic additions must use the explicit original-six fixture');
 const original=JSON.stringify(E.levels),originalCount=E.levels.length;
 for(let i=0;i<extra;i++)E.levels.push({name:{zh:'测试主线'+(i+5),en:'Fixture main '+(i+5)},brief:{zh:'仅测试',en:'Test only'},phaseStarts:[4],spawns:Array.from({length:6},(_,j)=>({row:0,type:'data',time:4+j}))});
 assert.equal(JSON.stringify(E.levels.slice(0,originalCount)),original);
 return{box,E,UI};
}
function sixFixture(extra=0,legacyRevision=false){return runtime(extra,{originalSix:true,legacyRevision});}
function mount(r,st){
 const nodes={},events={};
 class Node{
  constructor(){this.children=[];this.style={};this.attributes={};this.hidden=false;this.disabled=false;this.textContent='';this.handlers={};}
  getAttribute(k){return this.attributes[k]??null;}setAttribute(k,v){this.attributes[k]=v;}
  appendChild(n){n.parent=this;this.children.push(n);return n;}append(...ns){ns.forEach(n=>this.appendChild(n));}
  replaceChildren(...ns){this.children=[];this.append(...ns);}remove(){this.parent.children=this.parent.children.filter(n=>n!==this);}
  addEventListener(k,f){this.handlers[k]=f;}getBoundingClientRect(){return{left:0,top:0,width:1120,height:650};}
 }
 for(const [,id]of html.matchAll(/id="([^"]+)"/g))nodes[id]=new Node();
 const ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});nodes.scene.getContext=()=>ctx;
 const doc={hidden:false,documentElement:{},getElementById:id=>nodes[id],createElement:()=>new Node(),addEventListener:(k,v)=>events[k]=v};
 const win={localStorage:st,devicePixelRatio:1,requestAnimationFrame(){},addEventListener:(k,v)=>events[k]=v,matchMedia:()=>({matches:false,addEventListener(){}})};
 const app=r.UI.mount(r.E,doc,win);return{...r,app,c:app.controller,nodes,events,doc};
}
const ds400=[[0,0,0],[0,1,0],[0,2,0],[10,3,0],[22,4,0],[28,2,1],[40,4,1],[52,0,1]];
function finish(c){const events=[];while(c.state.phase==='battle'&&c.state.time<180)events.push(...clone(c.tick(1/60)));assert.notEqual(c.state.phase,'battle');return events;}
function winMain(c,retry=false){
 let i=0;const plan=ds400.filter(a=>!retry||a[0]);const buy=()=>{while(i<plan.length&&c.state.time+1e-8>=plan[i][0]){const [,row,col]=plan[i++];assert(c.select('deepseek').ok);assert(c.cell(row,col).ok);}};
 buy();assert(c.start().ok);const events=[];while(c.state.phase==='battle'&&c.state.time<180){buy();events.push(...clone(c.tick(1/60)));}assert.equal(c.state.phase,'won');return events;
}
function winFixture(c,retry=false){if(!retry){assert(c.cell(0,0).ok);assert(c.select('gpt').ok);assert(c.cell(0,1).ok);}assert(c.start().ok);const events=finish(c);assert.equal(c.state.phase,'won');return events;}
function access(c,n){return Array.from({length:n},(_,i)=>c.available(i));}
function empty(c,level){assert.equal(c.state.level,level);assert.equal(c.state.phase,'prepare');assert.equal(c.state.compute,180);assert.equal(c.state.units.length,0);assert.equal(c.state.seed,1);}

test('production has nine encounters with frozen combat bytes and exact current content/replay fence',()=>{
 const r=runtime(),hash=f=>crypto.createHash('sha256').update(fs.readFileSync(__dirname+'/'+f)).digest('hex');
 assert.equal(hash('td-lanes.js'),'537c9d404a94be925e5b0c8632fca48a76cd74ba52269d8d142cd7bd5ceb1a5f');
 assert.equal(hash('td-lanes-content.js'),'b12954dbdaf64ced12681ffb67ce957665194eb7df3de88eba490b203879e3d9');
 assert.equal(r.box.TDReplayStore.COMBAT_REVISION,'td-lanes-sha256:'+hash('td-lanes.js')+';content-sha256:'+hash('td-lanes-content.js'));
 assert.deepEqual(clone(r.UI.stageOrder(r.E)),[0,1,2,5,6,7,8,3,4]);
 assert.deepEqual(Array.from({length:9},(_,i)=>r.UI.nextStage(r.E,i)),[1,2,5,4,5,6,7,8,0]);
 const expected={en:['1 · First connection','2 · Crowded stream','3 · Breach attempt','Optional1 · Detour','Optional2 · Convoy','4 · Shifting pressure','5 · Overlap fronts','6 · Mixed pursuit','7 · Rotating siege'],zh:['1 · 接通防线','2 · 拥挤的数据流','3 · 突破尝试','可选1 · 绕行','可选2 · 合流车队','4 · 转移的压力','5 · 交叠的战线','6 · 交错的追兵','7 · 轮换的围攻']};
 for(const lang of ['zh','en'])assert.deepEqual(Array.from({length:9},(_,i)=>r.UI.stageLabel(r.E,i,lang)),expected[lang]);
});

test('all 42 legacy bookmark/language variants preserve access in production and original-six synthetic extension',()=>{
 for(const extra of [0,2]){
  const r=extra?sixFixture(extra):runtime();
  for(let highest=0;highest<6;highest++)for(let last=0;last<=highest;last++)for(const lang of ['zh','en']){
   const st=storage(last,highest,lang),before=[...st.data],c=r.UI.controller(r.E,st);
   empty(c,last);assert.equal(c.lang,lang);assert.equal(c.highestStage,highest);assert.equal(st.writes.length,0);assert.deepEqual([...st.data],before);
   assert.deepEqual(access(c,r.E.levels.length),Array.from({length:r.E.levels.length},(_,i)=>i<6&&(i===5?highest>=3:i<=highest)));
   for(const invalid of [-1,1.5,'0',NaN,Infinity,r.E.levels.length])assert.equal(c.available(invalid),false);
  }
 }
});

test('original-six + two synthetic mains: fresh user and first two wins retain Next-only bookmark timing even with two appended mains',()=>{
 const r=sixFixture(2),st=storage(),c=r.UI.controller(r.E,st);empty(c,0);assert.equal(c.lang,'zh');assert.deepEqual(access(c,8),[true,false,false,false,false,false,false,false]);
 for(const level of [0,1]){
  winMain(c);assert.equal(c.highestStage,level);assert(!c.available(level+1));assert.equal(st.bookmarkWrites.length,level);
  const refreshed=r.UI.controller(r.E,st);empty(refreshed,level);assert(!refreshed.available(level+1));
  assert(c.start().ok);assert.equal(c.state.level,level+1);assert.equal(c.highestStage,level+1);assert.equal(st.bookmarkWrites.length,level+1);
 }
 assert(!c.available(5));assert(!c.available(6));
});

test('original-six + two synthetic mains: main 3 victory immediately saves only main 4; retry, reload, menu and main-4 entry cannot unlock main 5',()=>{
 const r=sixFixture(2),st=storage(2,2,'zh'),c=r.UI.controller(r.E,st);const first=winMain(c),snapshot=clone(c.state.snapshot);
 assert.equal(c.highestStage,5);assert.equal(st.bookmarkWrites.length,1);assert.deepEqual(st.bookmark,{version:1,lastStage:2,highestStage:5,lang:'zh'});
 assert(c.available(5));assert(!c.available(6));assert(!c.available(7));assert(!c.stage(6).ok);
 const reload=r.UI.controller(r.E,st);empty(reload,2);assert(reload.available(5));assert(!reload.available(6));assert.equal(reload.lang,'zh');
 assert(c.retry().ok);assert.deepEqual(clone(c.state),snapshot);assert(c.available(5));assert(!c.available(6));assert.deepEqual(winMain(c,true),first);assert.equal(st.bookmarkWrites.length,1);
 assert(c.review.previous);assert(c.stage(0).ok);assert(c.stage(5).ok);empty(c,5);assert(!c.available(6));assert.equal(st.bookmark.highestStage,5);
 assert(c.stage(3).ok);assert(c.stage(4).ok);assert(c.stage(5).ok);assert(!c.available(6));assert(!c.stage(6).ok);
 const entered=r.UI.controller(r.E,st);empty(entered,5);assert(!entered.available(6));assert.equal(st.data.get('unrelated'),'keep');
});

test('original-six + two synthetic mains: legacy drill access, optional wins and losses preserve 3→4→5 without granting a later main',()=>{
 const r=sixFixture(2);
 for(const last of [3,4])for(const win of [false,true]){
  const st=storage(last),c=r.UI.controller(r.E,st);assert(c.available(5));assert(!c.available(6));
  if(win){assert(c.cell(1,0).ok);assert(c.cell(2,0).ok);}assert(c.start().ok);finish(c);assert.equal(c.state.phase,win?'won':'lost');
  assert.equal(st.bookmarkWrites.length,0);assert(!c.available(6));
  if(win){assert.equal(c.nextStage,last+1);assert(c.start().ok);assert.equal(c.state.level,last+1);}else{assert(c.stage(5).ok);assert.equal(c.state.level,5);}
  assert(!c.available(6));assert(!c.available(7));assert(!r.UI.controller(r.E,st).available(6));
 }
});

test('original-six fixture: terminal main 4 writes no unseen unlock, even if valid win history exists later',()=>{
 const r=sixFixture(),st=storage(5),c=r.UI.controller(r.E,st);winMain(c);assert.equal(c.nextStage,0);assert.equal(st.bookmarkWrites.length,0);assert.equal(st.bookmark.highestStage,5);
 const key=r.box.TDReplayStore.PREFIX+5,history=st.data.get(key);assert(history);assert.equal(JSON.parse(history).facts.outcome,'won');
 const expanded=sixFixture(2),loaded=expanded.UI.controller(expanded.E,st);empty(loaded,5);assert(loaded.reference.previous);assert.equal(loaded.reference.previous.outcome,'won');
 assert(!loaded.available(6));assert(!loaded.available(7));assert.equal(st.data.get(key),history);assert.equal(st.bookmarkWrites.length,0);
});

test('original-six + two synthetic mains: a real main-4 win saves main 5 before Next; retry preserves exact combat, compatible history and access',()=>{
 const r=sixFixture(2),st=storage(5),c=r.UI.controller(r.E,st),events=winMain(c),snapshot=clone(c.state.snapshot),facts=clone(c.review);
 assert.equal(c.highestStage,6);assert.equal(c.nextStage,6);assert(c.available(6));assert(!c.available(7));assert.equal(st.bookmarkWrites.length,1);
 assert.deepEqual(st.bookmark,{version:1,lastStage:5,highestStage:6,lang:'en'});
 const refreshed=r.UI.controller(r.E,st);empty(refreshed,5);assert(refreshed.available(6));assert(!refreshed.available(7));assert(refreshed.reference.previous);
 const terminal=JSON.stringify(c.state),writes=st.writes.length;for(let i=0;i<120;i++)c.tick(1/60);assert.equal(JSON.stringify(c.state),terminal);assert.equal(st.writes.length,writes);
 assert(c.retry().ok);assert.deepEqual(clone(c.state),snapshot);assert(c.reference.previous);assert(c.available(6));assert(!c.available(7));assert.deepEqual(winMain(c,true),events);
 assert.deepEqual(clone(c.review.previous),clone(r.box.TDReplayStore.summary(facts)));assert.equal(st.bookmarkWrites.length,1);
 const seed=c.state.seed;assert(c.start().ok);assert.equal(c.state.level,6);assert.equal(c.state.seed,seed);assert.equal(c.state.compute,180);assert.equal(c.state.units.length,0);assert.equal(c.review,null);
 assert.equal(st.bookmark.highestStage,6);assert.equal(st.bookmark.lastStage,6);assert(!c.available(7));
});

test('original-six + two synthetic mains: appended mains get sequential ordinals, Next and victory-only unlock across two additions',()=>{
 const r=sixFixture(2),st=storage(6),h=mount(r,st),{c,nodes:n}=h;
 assert.deepEqual(clone(r.UI.stageIds(r.E)),[0,1,2,5,6,7]);assert.deepEqual(n['stage-select'].children.map(o=>o.value),['0','1','2','5','6','7','3','4']);
 assert(n.wave.textContent.startsWith('Main 5 ·'));assert.equal(r.UI.stageLabel(r.E,6,'en'),'5 · Fixture main 5');assert.equal(r.UI.stageLabel(r.E,7,'zh'),'6 · 测试主线6');assert.equal(c.nextStage,7);
 assert(n['stage-select'].children.find(o=>o.value==='7').disabled);assert(!c.stage(7).ok);
 winFixture(c);h.app.render();assert.equal(n.start.textContent,'Next main · Fixture main 6');assert.equal(c.highestStage,7);assert(c.available(7));assert.equal(st.bookmark.highestStage,7);assert.equal(st.bookmark.lastStage,6);
 const reloaded=r.UI.controller(r.E,st);empty(reloaded,6);assert(reloaded.available(7));
 n.start.onclick({detail:1});assert.equal(c.state.level,7);assert.equal(c.state.phase,'prepare');assert(n.wave.textContent.startsWith('Main 6 ·'));n.start.onclick({detail:2});assert.equal(c.state.phase,'prepare');
 n.language.onclick();assert(n.wave.textContent.startsWith('主线 6 ·'));assert.equal(n['stage-select'].children.find(o=>o.value==='3').textContent,'可选1 · 绕行');assert.equal(n['stage-select'].children.find(o=>o.value==='4').textContent,'可选2 · 合流车队');
 winFixture(c);h.app.render();assert.equal(c.nextStage,0);assert.equal(n.start.textContent,'重玩首关');assert.equal(st.bookmark.highestStage,7);n.start.onclick({detail:1});assert.equal(c.state.level,0);assert(c.available(7));
});

test('original-six + two synthetic mains: loss, start, pause, interruption, retry, switching and language cannot shortcut a future main',()=>{
 const r=sixFixture(2);
 for(const stage of [5,6]){
  const st=storage(stage),h=mount(r,st),{c,nodes:n}=h;assert(!c.available(stage+1));n.start.onclick();c.tick(10);h.app.render();
  h.doc.hidden=true;h.events.visibilitychange();const interrupted=JSON.stringify(c.state);h.doc.hidden=false;h.events.visibilitychange();c.tick(2);assert.equal(JSON.stringify(c.state),interrupted);
  const reloaded=r.UI.controller(r.E,st);empty(reloaded,stage);assert(!reloaded.available(stage+1));assert.equal(st.bookmarkWrites.length,0);
  n.language.onclick();assert.equal(c.lang,'zh');assert(!c.available(stage+1));n.pause.onclick();finish(c);assert.equal(c.state.phase,'lost');assert(!c.available(stage+1));assert(!c.stage(stage+1).ok);
  n.retry.onclick();assert.equal(c.state.phase,'prepare');assert.equal(c.state.compute,180);assert(!c.available(stage+1));assert(c.stage(0).ok);assert(c.stage(3).ok);assert(c.stage(stage).ok);assert(!c.available(stage+1));
  assert.equal(r.UI.controller(r.E,st).lang,'zh');assert(!r.UI.controller(r.E,st).available(stage+1));assert.equal(st.bookmark.highestStage,stage);
 }
});

test('original-six + two synthetic mains: synthetic stage exact retry compares same plans; reload recalls history without restoring resources',()=>{
 const r=sixFixture(2),st=storage(6),c=r.UI.controller(r.E,st),first=winFixture(c),snapshot=clone(c.state.snapshot),firstFacts=clone(c.review);
 assert(c.retry().ok);assert.deepEqual(clone(c.state),snapshot);assert(c.reference.previous);assert.deepEqual(winFixture(c,true),first);assert.deepEqual(clone(c.review.previous),clone(r.box.TDReplayStore.summary(firstFacts)));
 const stored=st.data.get(r.box.TDReplayStore.PREFIX+6),reloaded=r.UI.controller(r.E,st);empty(reloaded,6);assert(reloaded.reference.previous);assert.equal(reloaded.reference.previous.outcome,'won');assert.equal(st.data.get(r.box.TDReplayStore.PREFIX+6),stored);assert(reloaded.available(7));
 // A real Next retains mutable RNG, whereas a fresh reload returns to seed 1.
 const fromMain4=r.UI.controller(r.E,storage(5));winMain(fromMain4);const seed=fromMain4.state.seed;assert.notEqual(seed,1);assert(fromMain4.start().ok);assert.equal(fromMain4.state.level,6);assert.equal(fromMain4.state.seed,seed);
});

test('original-six + two synthetic mains: failed writes keep earned access session-only without retrying terminal frames or corrupting history',()=>{
 const r=sixFixture(2),backing=storage(5);let failures=0;const broken={getItem:k=>backing.getItem(k),setItem(k){if(k===bookmarkKey)failures++;throw Error('quota');}};
 const c=r.UI.controller(r.E,broken);winMain(c);assert.equal(failures,1);assert.equal(c.storageNotice,'unavailable');assert(c.available(6));assert(!c.available(7));
 for(let i=0;i<120;i++)c.tick(1/60);assert.equal(failures,1);assert(c.retry().ok);assert(c.available(6));assert(!r.UI.controller(r.E,backing).available(6));assert.equal(backing.bookmark.highestStage,5);
 const bad=storage();bad.data.set(bookmarkKey,'{"version":99}');const loaded=r.UI.controller(r.E,bad);empty(loaded,0);assert(loaded.storageNotice);assert.equal(bad.writes.length,0);assert.equal(bad.data.get(bookmarkKey),'{"version":99}');assert(!loaded.available(6));
});
test('original six full lifecycle trace matches the accepted baseline, without Git or baseline files',()=>{
 // Golden trace verified directly against accepted 34273ed's unmodified UI.
 // Includes complete state, events, review/reference payloads and serialized storage.
 // Explicitly remove Main 5 and restore only the legacy revision in this VM fixture;
 // the separate production-source test above still enforces the current seven-stage fence.
 const {E,UI:U}=sixFixture(0,true),trace=[];
 function memory(last,highest,lang){const data=new Map([[bookmarkKey,JSON.stringify({version:1,lastStage:last,highestStage:highest,lang})]]),writes=[];return{data,writes,getItem:k=>data.get(k)??null,setItem:(k,v)=>{data.set(k,v);writes.push([k,v]);}};}
 const snap=(c,s)=>({state:c.state,highest:c.highestStage,lang:c.lang,access:E.levels.map((_,i)=>c.available(i)),next:c.nextStage,review:c.review,reference:c.reference,notice:c.storageNotice,writes:s.writes,store:[...s.data]});
 for(const lang of ['zh','en'])for(let high=0;high<6;high++)for(let last=0;last<=high;last++){
  const s=memory(last,high,lang),c=U.controller(E,s);trace.push(JSON.stringify(snap(c,s)));c.language();trace.push(JSON.stringify(snap(c,s)));
  for(let target=0;target<6;target++){trace.push(JSON.stringify(c.stage(target)));trace.push(JSON.stringify(snap(c,s)));}
  c.start();c.tick(10);c.pause();c.tick(10);c.retry();trace.push(JSON.stringify(snap(c,s)));
 }
 for(const level of [0,1,2,3,4,5])for(const win of [false,true]){
  const s=memory(level,level,'en'),c=U.controller(E,s);let i=0;const plan=level===3||level===4?[[0,1,0],[0,2,0]]:ds400;
  function buy(retry=false){while(win&&i<plan.length&&c.state.time+1e-8>=plan[i][0]){const [time,row,col]=plan[i++];if(!retry||time)c.cell(row,col);}}
  for(let attempt=0;attempt<2;attempt++){
   i=0;buy(attempt===1);c.start();const events=[];
   while(c.state.phase==='battle'&&c.state.time<180){buy(attempt===1);events.push(...c.tick(1/60));}
   trace.push(JSON.stringify({events,snap:snap(c,s)}));if(!attempt)c.retry();
  }
  c.start();trace.push(JSON.stringify(snap(c,s)));trace.push(JSON.stringify(snap(U.controller(E,s),s)));
 }
 assert.equal(crypto.createHash('sha256').update(trace.join('\n')).digest('hex'),'295faad2661462386af008b8817388c5e3137fa12cc932303eec055f30e96dfb');
});
console.log('PASS '+count+' campaign extension groups; real engine/script order; current production fences plus explicit original-six/synthetic fixtures; mocked DOM/storage only');
