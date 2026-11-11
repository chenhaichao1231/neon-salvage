'use strict';
// Production scripts and simulation, with DOM/canvas/storage doubles. No browser acceptance.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const html=fs.readFileSync(__dirname+'/index.html','utf8'),plain=x=>JSON.parse(JSON.stringify(x));
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const oldHash='ba043f107226ce7338c46236a8883b3d46d275337ca0585e909ca6ff9d60cc0a';
const marker='// Main 6: mixed pursuit changes target order through existing enemy movement.\n';
const main5Hash='1b970e7389da1bc8762a121ba6150b6c6a68c025a03ca4b2c176c9a5b2912688';
const publicMarker='// Main 5: overlapping active fronts, using only existing enemies and ordinary survival.\n';
const source=f=>fs.readFileSync(__dirname+'/'+f,'utf8');
const contentSource=source('td-lanes-content.js'),tail="if(typeof module==='object'&&module.exports)module.exports=E;";
const oldContent=contentSource.slice(0,contentSource.indexOf(marker))+contentSource.slice(contentSource.indexOf(tail));
const publicContent=contentSource.slice(0,contentSource.indexOf(publicMarker))+contentSource.slice(contentSource.indexOf(tail));
const bookmarkKey='campus-defense-stage-v1';let groups=0;
function test(name,fn){fn();console.log('PASS',++groups,name);}
function storage(last=7,highest=last,lang='en'){
 const data=new Map([['unrelated','keep'],[bookmarkKey,JSON.stringify({version:1,lastStage:last,highestStage:highest,lang})]]),writes=[];
 return{data,writes,getItem:k=>data.get(k)??null,setItem(k,v){writes.push([k,v]);data.set(k,v);},get bookmark(){return JSON.parse(data.get(bookmarkKey));}};
}
function runtime(legacy=false){
 const box={};
 for(const [,file]of html.matchAll(/<script src="([^?]+)\?[^\"]*"><\/script>/g)){
  let text=source(file);if(legacy&&file==='td-lanes-content.js')text=legacy==='public'?publicContent:oldContent;
  if(legacy&&file==='td-replay-store.js')text=text.replace(hash(contentSource),legacy==='public'?oldHash:main5Hash);
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

test('exact frozen raw7, original seven source and definitions, mechanics and existing script order',()=>{
 const {E,U,P}=runtime();assert.equal(E.levels.length,9);
 assert.equal(hash(source('td-lanes.js')),'537c9d404a94be925e5b0c8632fca48a76cd74ba52269d8d142cd7bd5ceb1a5f');
 assert.equal(hash(oldContent),main5Hash,'only the raw7 append may differ from accepted Main5 content source');assert.equal(hash(publicContent),oldHash);
 assert.equal(hash(JSON.stringify(E.levels.slice(0,7))),'446a814cf47199da8e63e4f6ae6c12fa4bdfbec9ed0cb3e4517f837431ce4d86');
 assert.equal(hash(JSON.stringify(E.levels[7],null,2)+'\n'),'8cc752cde34920b79c74087b1ff855f094729b134bc03dc85e1ab616fb44d26c');
 assert.equal(hash(contentSource),'b12954dbdaf64ced12681ffb67ce957665194eb7df3de88eba490b203879e3d9');
 assert.equal(P.COMBAT_REVISION,'td-lanes-sha256:'+hash(source('td-lanes.js'))+';content-sha256:'+hash(contentSource));
 assert.deepEqual([...html.matchAll(/<script src="([^?]+)\?/g)].map(m=>m[1]),['td-lanes.js','td-lanes-content.js','td-lanes-renderer.js','td-battle-review.js','td-replay-store.js','td-lanes-ui.js']);
 assert.deepEqual(plain(E.roster),['deepseek','gpt','claude','grok']);assert.deepEqual(Object.keys(E.levels[7]).sort(),['brief','name','phaseStarts','spawns']);
 assert.deepEqual(plain(U.stageOrder(E)),[0,1,2,5,6,7,8,3,4]);assert.equal(E.levels.map((_,i)=>U.nextStage(E,i)).join(','),'1,2,5,4,5,6,7,8,0');assert(html.includes('DEMO 0.15'));assert(html.includes('<span class="eyebrow">AI CAMPUS / DEMO 0.15</span>'));
});
test('53 exact existing enemies, lane/type/time and phase counts, ordinary five-core survival',()=>{
 const {E,U}=runtime(),d=E.levels[7],schedule=E.preview(7);
 const exact=[{armor:[4,8,36],charge:[10,14,42,46],swarm:[12,12.4,12.8,13.2,44,44.4,44.8,45.2]},{data:[7,11,31,51]},{armor:[10,14,42],charge:[16,20,48,52],swarm:[18,18.4,18.8,19.2,50,50.4,50.8,51.2]},{data:[13,17,37,57]},{armor:[16,20,48],charge:[22,26,54,58],swarm:[24,24.4,24.8,25.2,56,56.4,56.8,57.2]}];
 assert.equal(schedule.length,53);assert.equal(schedule.at(-1).time,58);assert.deepEqual(plain(d.phaseStarts),[4,16,36,48]);
 for(let row=0;row<5;row++)for(const type of Object.keys(E.definitions.enemies))assert.deepEqual(plain(schedule.filter(p=>p.row===row&&p.type===type).map(p=>p.time)),exact[row][type]||[]);
 assert.deepEqual(plain(U.phaseGroups(d).map(g=>g.spawns.length)),[13,16,9,15]);assert.deepEqual([0,1,2,3,4].map(r=>schedule.filter(p=>p.row===r).length),[15,4,15,4,15]);assert.deepEqual(['data','armor','swarm','charge'].map(t=>schedule.filter(p=>p.type===t).length),[8,9,24,12]);assert.equal(E.create(7).core,5);
 assert(schedule.every(p=>Object.keys(p).sort().join(',')==='row,time,type'));assert(!Object.hasOwn(d,'objective'));assert(!Object.hasOwn(d,'optional'));
});
test('production script-order automatic mount retains bilingual full identities and read-only pointer/keyboard preview',()=>{
 for(const lang of ['zh','en']){
  const st=storage(7,7,lang),h=harness(st,true),n=h.nodes;empty({state:h.state},7);
  assert.equal(n.goal.textContent,h.E.levels[7].brief[lang]);assert.deepEqual(n['stage-select'].children.map(o=>o.value),['0','1','2','5','6','7','8','3','4']);
  for(const id of [6,7]){const o=n['stage-select'].children.find(o=>o.value===String(id));assert.equal(o.textContent,(id-1)+' · '+(lang==='en'?(id===6?'Overlap fronts':'Mixed pursuit'):h.E.levels[id].name[lang]));assert.equal(o.attributes.title,h.E.levels[id].name[lang]);assert.equal(o.attributes['aria-label'],h.E.levels[id].name[lang]);}
  assert.equal(n['stage-select'].attributes.title,h.E.levels[7].name[lang]);assert(n['stage-select'].attributes['aria-label'].includes(h.E.levels[7].name[lang]));
  assert.equal(n.wave.textContent,lang==='zh'?'主线 6 · 第1/4段 · 0/53':'Main 6 · Push 1/4 · 0/53');require('./td-compact-forecast.test').assertForecast(n,h.E,7,lang);assert.equal(n.cards.children.length,4);
  const before=JSON.stringify(h.state);h.cell(4,1).onpointerenter({pointerType:'mouse',buttons:0});assert.deepEqual(plain(h.view.placementLane),{row:4,start:1.4,end:7.8});assert.equal(JSON.stringify(h.state),before);assert.equal(st.writes.length,0);
  h.cell(4,1).onpointerleave();assert.equal(h.view.placementLane,null);h.events.keydown({key:'Tab'});h.cell(2,0).focus();assert.deepEqual(plain(h.view.placementLane),{row:2,start:.4,end:7.8});assert.equal(JSON.stringify(h.state),before);
  n.start.onclick();assert.equal(h.state.phase,'battle');assert.equal(h.view.placementLane,null);n.pause.onclick();h.cell(0,0).onpointerenter({pointerType:'mouse',buttons:0});assert(h.view.placementLane);const frozen=JSON.stringify(h.state);h.frame(0);h.frame(1000);assert.equal(JSON.stringify(h.state),frozen);h.doc.hidden=true;h.events.visibilitychange();assert.equal(h.view.placementLane,null);assert(h.state.paused);
 }
});
test('compact selector alias is limited to exact raw7 English name and preserves fixed font budget',()=>{
 const {E,U}=runtime(),{createCanvas,GlobalFonts}=require('@napi-rs/canvas');GlobalFonts.registerFromPath('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc','stage-fit');const ctx=createCanvas(1,1).getContext('2d');ctx.font='14px stage-fit';
 assert(ctx.measureText('6 · '+E.levels[7].name.en).width>133);assert(ctx.measureText(U.stageLabel(E,7,'en')).width<=133);assert.equal(U.stageLabel(E,6,'en'),'5 · Overlap fronts');
 const other={...E,levels:plain(E.levels)};other.levels[7].name.en='Other encounter';assert.equal(U.stageLabel(other,7,'en'),'6 · Other encounter');other.levels[8]={...plain(E.levels[7])};assert.equal(U.stageLabel(other,8,'en'),'7 · Interleaved pursuit');assert.equal(U.stageLabel(E,7,'zh'),'6 · 交错的追兵');
 assert(source('td-lanes.css').includes('max-width:165px'));
});
test('raw6 bookmarks, old victory history and actual losses never prove Main5 completed with Main6 present',()=>{
 for(const lang of ['zh','en']){
  const historical=runtime('main5'),old=storage(6,6,lang),prior=historical.U.controller(historical.E,old);assert.equal(historical.E.levels.length,7);run(prior,main5Plan);assert.equal(prior.state.phase,'won');assert.equal(prior.nextStage,0);assert.equal(old.bookmark.highestStage,6);const key=historical.P.PREFIX+6,raw=old.data.get(key);
  const h=harness(old),c=h.c;empty(c,6);assert(!c.available(7));assert(!c.stage(7).ok);assert(c.reference.historical);assert(c.reference.incompatible);assert.equal(c.reference.previous,null);assert.equal(old.data.get(key),raw);const writes=old.writes.length;
  c.start();c.tick(10);h.doc.hidden=true;h.events.visibilitychange();assert(c.state.paused);assert(!c.available(7));assert(!harness(old).c.available(7));assert.equal(old.writes.length,writes);c.retry();run(c);assert.equal(c.state.phase,'lost');assert(!c.available(7));assert.equal(old.bookmark.highestStage,6);
  c.retry();assert(c.stage(0).ok);assert(c.stage(3).ok);assert(c.stage(4).ok);assert(c.stage(5).ok);assert(c.stage(6).ok);c.language();assert(!harness(old).c.available(7));
 }
});
test('actual Main5 victory unlocks Main6; Next carries RNG, exact Main6 retry and new Main7 unlock',()=>{
 for(const lang of ['zh','en']){
  const st=storage(6,6,lang),h=harness(st),c=h.c;assert(!c.available(7));const previous=run(c,main5Plan);assert.equal(c.state.phase,'won');assert(c.available(7));assert.deepEqual(st.bookmark,{version:1,lastStage:6,highestStage:7,lang});assert.equal(c.nextStage,7);assert(harness(st).c.available(7));
  const pre5=plain(c.state.snapshot);assert(c.retry().ok);assert.deepEqual(plain(c.state),pre5);assert(c.available(7));assert.deepEqual(run(c,main5Plan,true).events,previous.events);
  const carried=c.state.seed;assert.equal(carried,2745540835);h.app.render();assert.equal(h.nodes.start.textContent,(lang==='zh'?'下一主线 · ':'Next main · ')+h.E.levels[7].name[lang]);h.nodes.start.onclick({detail:1});empty(c,7,carried);h.nodes.start.onclick({detail:2});empty(c,7,carried);
  const first=run(c,main6Plan),snapshot=plain(c.state.snapshot),terminal=plain(c.state),facts=plain(c.review);assert.equal(c.state.phase,'won');assert.equal(c.state.core,5);assert.equal(c.state.time,92.11666666666666);assert.equal(c.review.spent,400);assert.equal(c.review.refunded,0);assert.equal(c.state.nextSpawn,53);assert.equal(c.nextStage,8);assert(c.available(8));assert.equal(st.bookmark.highestStage,8);assert.equal(c.review.previous,null);
  const writes=st.writes.length;for(let i=0;i<120;i++)c.tick(1/60);assert.equal(st.writes.length,writes);assert.deepEqual(plain(c.state),terminal);assert(c.retry().ok);assert.deepEqual(plain(c.state),snapshot);assert.deepEqual(plain(c.reference.previous),plain(h.P.summary(facts)));const second=run(c,main6Plan,true);assert.deepEqual(second.events,first.events);assert.deepEqual(second.paid,first.paid.filter(p=>p.time>0));assert.deepEqual(plain(c.state),terminal);assert.deepEqual(plain(c.review.previous),plain(h.P.summary(facts)));
  const raw=st.data.get(h.P.PREFIX+7),record=JSON.parse(raw);assert.deepEqual(Object.keys(record.facts).sort(),['core','leaks','losses','outcome','refunded','spent','time','withdrawals']);assert(!raw.includes('firstLeak'));const reload=harness(st);empty(reload.c,7);assert.equal(reload.c.reference.previous,null);assert(reload.c.reference.incompatible);assert.deepEqual(plain(reload.c.reference.historical),plain(h.P.summary(facts)));assert.equal(st.data.get(h.P.PREFIX+7),raw);
  h.app.render();assert.equal(h.nodes.start.textContent,(lang==='zh'?'下一主线 · ':'Next main · ')+h.E.levels[8].name[lang]);h.nodes.start.onclick({detail:1});empty(c,8,terminal.seed);assert(c.available(7));assert(c.available(8));assert.equal(st.bookmark.highestStage,8);
 }
});
test('raw7 loss, first leaked enemy identity, exact retry/deltas and reload never expand compact history',()=>{
 for(const lang of ['zh','en']){
  const h=harness(storage(7,7,lang)),{c,nodes:n,st}=h,first=run(c);assert.equal(c.state.phase,'lost');const leak=first.events.find(e=>e.type==='leak');assert.deepEqual(plain(c.review.firstLeak),{row:leak.row,time:leak.time,enemyType:leak.enemyType});h.app.render();assert(n['review-content'].textContent.includes(h.E.definitions.enemies[leak.enemyType].name[lang]));assert(n['review-content'].textContent.includes(lang==='zh'?'首次漏敌':'First leak'));
  const raw=st.data.get(h.P.PREFIX+7),facts=JSON.parse(raw).facts;assert(!raw.includes('firstLeak'));assert(!raw.includes('enemyType'));assert(c.retry().ok);h.app.render();assert(n['battle-review'].hidden);assert(!/First leak|首次漏敌/.test(n['previous-stage-result'].textContent));const second=run(c,[],true);assert.deepEqual(second.events,first.events);assert.deepEqual(plain(c.review.previous),facts);h.app.render();assert(n['review-content'].textContent.includes(lang==='zh'?'较本局开始前':'Change from reference'));
  const reload=harness(st);empty(reload.c,7);assert.equal(reload.c.review,null);assert.deepEqual(plain(reload.c.reference.previous),facts);assert(!/First leak|首次漏敌/.test(reload.nodes['previous-stage-result'].textContent));assert.equal(st.bookmark.highestStage,7);
 }
});
test('both public0.14 and Main5-local valid records are preserved on load as warning-only historical facts',()=>{
 for(const revision of ['public','main5']){
  const legacy=runtime(revision);assert.equal(legacy.E.levels.length,revision==='public'?6:7);
  for(let stage=0;stage<legacy.E.levels.length;stage++){
   const old=storage(stage,legacy.E.levels.length-1),c=legacy.U.controller(legacy.E,old);run(c);const key=legacy.P.PREFIX+stage,raw=old.data.get(key),facts=JSON.parse(raw).facts;
   for(const lang of ['zh','en']){
    const st=storage(stage,legacy.E.levels.length-1,lang);st.data.set(key,raw);const before=[...st.data],h=harness(st);assert.equal(st.writes.length,0);assert.deepEqual([...st.data],before);assert.equal(h.c.reference.previous,null);assert(h.c.reference.incompatible);assert.deepEqual(plain(h.c.reference.historical),facts);assert.equal(st.data.get(key),raw);assert(!h.c.available(7));assert(!h.nodes['previous-stage-result'].hidden);assert.match(h.nodes['previous-stage-result'].textContent,lang==='zh'?/仅供回顾，不作成绩对比/:/shown for reference, without performance comparison/);
    run(h.c);assert.equal(h.c.review.previous,null);assert(h.c.review.incompatible);h.app.render();assert(!/Change from reference|较本局开始前/.test(h.nodes['review-content'].textContent));
   }
  }
 }
});
test('raw7 access from a real Main5 win survives only in session if bookmark writes fail',()=>{
 const backing=storage(6,6),st={getItem:k=>backing.getItem(k),setItem(k,v){if(k===bookmarkKey)throw Error('quota');backing.setItem(k,v);}},h=harness(st),c=h.c;run(c,main5Plan);assert.equal(c.state.phase,'won');assert(c.available(7));assert.equal(c.storageNotice,'unavailable');assert.equal(backing.bookmark.highestStage,6);assert(!harness(backing).c.available(7));assert(c.retry().ok);assert(c.available(7));assert.equal(c.stage(7).reason,'phase');for(const u of [...c.state.units]){assert(c.cell(u.row,u.col).ok);assert(c.refund().ok);}assert(c.stage(7).ok);empty(c,7);assert(!harness(backing).c.available(7));
});
console.log('PASS '+groups+' real Main6 integration groups; production scripts with DOM/storage doubles, no browser acceptance');
