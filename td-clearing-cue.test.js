'use strict';
// Mounted DOM doubles and exact legal controller replays, not browser acceptance.
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const E=require('./td-lanes-content'),UI=require('./td-lanes-ui'),Replay=require('./td-replay-store');
const copy=x=>JSON.parse(JSON.stringify(x)),mains=[0,1,2,5,6,7,8],drills=[3,4];
const source=fs.readFileSync(__dirname+'/td-lanes-dom-writes.test.js','utf8').split('function count(h)')[0];
const baseHarness=Function('require','__dirname',source+'\nreturn harness;')(require,__dirname);
function storage(level,lang='en'){
 const data=new Map([[UI.bookmarkKey,JSON.stringify({version:1,lastStage:level,highestStage:8,lang})]]),writes=[];
 return{data,writes,getItem:k=>data.get(k)??null,setItem(k,v){writes.push([k,v]);data.set(k,v);}};
}
function engine(seed=1){return{...E,create:(level,options)=>E.create(level,options||{seed})};}
function mounted(level=0,lang='en',seed=1){
 const st=storage(level,lang),h=baseHarness(level,{mount(_E,doc,win){win.localStorage=st;return UI.mount(engine(seed),doc,win);}});
 return{...h,st,c:h.app.controller};
}
function legacyWave(s,lang){
 const d=E.levels[s.level],zh=lang==='zh',starts=d.phaseStarts||[d.spawns[0]?.time||0],push=Math.max(0,starts.findLastIndex(t=>t<=s.time))+1;
 const ordinal=(d.optional?drills:mains).indexOf(s.level)+1;
 return(d.optional?(zh?'可选练习 ':'Optional drill '):(zh?'主线 ':'Main '))+ordinal+' · '+(d.optional?(zh?'练习':'Drill'):(zh?'第'+push+'/'+starts.length+'段':'Push '+push+'/'+starts.length))+' · '+s.nextSpawn+'/'+d.spawns.length;
}
function legacyAria(s,lang){
 const d=E.levels[s.level],zh=lang==='zh',total=d.spawns.length,starts=d.phaseStarts||[d.spawns[0]?.time||0],push=Math.max(0,starts.findLastIndex(t=>t<=s.time))+1;
 if(d.optional)return(zh?'机制练习 · ':'Mechanic drill · ')+total+(zh?'名敌人':' enemies')+' · '+s.nextSpawn+'/'+total+(zh?'已来袭':' arrived');
 return(zh?'第'+push+'/'+starts.length+'段':'Push '+push+'/'+starts.length)+' · '+(s.phase==='prepare'?(zh?'共'+total+'名敌人':total+' enemies total'):s.nextSpawn+'/'+total+(zh?'已来袭':' arrived')+' · '+s.enemies.filter(e=>e.hp>0).length+(zh?'在场':' active'));
}
function clearing(s,lang){
 const ordinal=mains.indexOf(s.level)+1,live=s.enemies.filter(e=>e.hp>0).length;
 if(lang==='zh')return '主线 '+ordinal+' · '+(s.paused?'已暂停 · 剩余':'清场：剩余')+live+'名';
 const enemies=live+' '+(live===1?'enemy':'enemies');
 return 'Main '+ordinal+' · '+(s.paused?'Paused · '+enemies+' left':'Clearing '+enemies);
}
function qualifies(s){return s.phase==='battle'&&!E.levels[s.level].optional&&s.nextSpawn===E.levels[s.level].spawns.length&&s.enemies.some(e=>e.hp>0);}
function check(h){
 const s=h.c.state,before=JSON.stringify(s);h.app.render();
 assert.equal(h.nodes.wave.textContent,qualifies(s)?clearing(s,h.c.lang):legacyWave(s,h.c.lang));
 assert.equal(h.nodes.wave.getAttribute('aria-label'),legacyAria(s,h.c.lang));
 assert.equal(JSON.stringify(s),before,'render cannot change simulation state');
 assert(!/Clearing 0|清场：剩余0|Paused · 0 enemies left/.test(h.nodes.wave.textContent));
}
function foes(count){return Array.from({length:count},(_,i)=>({id:'fixture-'+i,row:i%5,x:5,type:'data',hp:1}));}
function idle(h){
 const state=JSON.stringify(h.c.state),facts=JSON.stringify(h.c.review),data=JSON.stringify([...h.st.data]),writes=h.st.writes.length;
 h.reset();for(let i=0;i<120;i++)h.app.frame(10000+i*1000/60);
 assert.equal(h.writes.length,0,'120 unchanged frames must not write DOM');
 assert.equal(JSON.stringify(h.c.state),state);assert.equal(JSON.stringify(h.c.review),facts);
 assert.equal(JSON.stringify([...h.st.data]),data);assert.equal(h.st.writes.length,writes);
}
let groups=0;function test(name,fn){fn();console.log('PASS',++groups,name);}

test('all seven main ordinals use exact bilingual singular/plural and paused copy only at the final cursor',()=>{
 for(const level of mains)for(const lang of ['en','zh']){
  const h=mounted(level,lang),s=h.c.state,total=E.levels[level].spawns.length;
  check(h);idle(h);h.nodes.start.onclick({detail:1});h.nodes.start.onclick({detail:2});check(h);
  for(const time of [0,...E.levels[level].phaseStarts,E.levels[level].spawns.at(-1).time+100]){
   s.time=time;
   for(const nextSpawn of [0,total-1,total+1])for(const live of [0,1,21])for(const paused of [false,true]){
    Object.assign(s,{nextSpawn,paused,enemies:foes(live)});check(h);assert.equal(h.nodes.wave.textContent,legacyWave(s,lang));
   }
  }
  // Cursor, not time, push index or forecast absence, is authoritative.
  Object.assign(s,{time:0,nextSpawn:total});
  for(const live of [1,2,21,total])for(const paused of [false,true]){
   Object.assign(s,{enemies:foes(live),paused});check(h);assert.equal(h.nodes.wave.textContent,clearing(s,lang));
  }
  s.enemies=[...foes(1),{...foes(1)[0],id:'dead',hp:0},{...foes(1)[0],id:'overkill',hp:-9}];check(h);
  assert.equal(h.nodes.wave.textContent,lang==='en'?'Main '+(mains.indexOf(level)+1)+' · Paused · 1 enemy left':'主线 '+(mains.indexOf(level)+1)+' · 已暂停 · 剩余1名');
  s.enemies=foes(0);check(h);assert.equal(h.nodes.wave.textContent,legacyWave(s,lang));
  for(const phase of ['prepare','won','lost'])for(const paused of [false,true]){
   Object.assign(s,{phase,paused,enemies:foes(2)});check(h);assert.equal(h.nodes.wave.textContent,legacyWave(s,lang));
  }
 }
});

test('both optional drills retain exact visible and ARIA copy, including real vulnerable turn waits',()=>{
 for(const level of drills)for(const lang of ['en','zh']){
  const h=mounted(level,lang),c=h.c;
  h.nodes.grid.children[12].onclick();h.nodes.start.onclick();let waiting=false;
  for(let i=0;i<1200&&c.state.phase==='battle';i++){
   c.tick(1/60);check(h);
   if(c.state.enemies.some(e=>e.turnState==='waiting')){
    waiting=true;assert.equal(h.nodes.wave.textContent,legacyWave(c.state,lang));h.nodes.pause.onclick();check(h);idle(h);h.nodes.pause.onclick();break;
   }
  }
  assert(waiting,'legal drill must enter its real turn wait');
  for(const phase of ['prepare','battle','won','lost'])for(const paused of [false,true]){
   Object.assign(c.state,{phase,paused,nextSpawn:E.levels[level].spawns.length,enemies:foes(2)});check(h);
   assert.equal(h.nodes.wave.textContent,legacyWave(c.state,lang));
  }
 }
});

const plans={
 6:[[0,0,0],[0,1,0],[0,2,0],[10,3,0],[22,4,0],[28,3,1],[40,4,1],[52,1,1],[64,0,1]],
 7:[[0,0,0],[0,2,0],[0,4,0],[10,1,0],[22,3,0],[28,0,1],[40,2,1],[52,4,1]]
};
function runPlan(c,plan,onFrame=()=>{},stopAtTail=false){
 let i=0;const events=[],hash=crypto.createHash('sha256');
 const buy=()=>{while(i<plan.length&&c.state.time+1e-9>=plan[i][0]){
  const [,row,col]=plan[i++],active=c.state.phase==='battle';if(active)assert(c.pause().ok);
  assert(c.select('deepseek').ok);assert(c.cell(row,col).ok);if(active)assert(c.pause().ok);
 }};
 buy();assert(c.start().ok);
 while(c.state.phase==='battle'&&c.state.time<180){
  const before=copy(c.state),emitted=c.tick(1/60);events.push(...emitted);onFrame(before,emitted);
  hash.update(JSON.stringify({state:c.state,events:emitted}));
  if(stopAtTail&&qualifies(c.state))return;
  if(c.state.phase==='battle')buy();
 }
 assert.notEqual(c.state.phase,'battle');return{events,trajectory:hash.digest('hex'),final:copy(c.state),review:c.review};
}

test('legal Main 5 and 6 arrivals, kills, final kill and history stay exact with per-tick mounted rendering',()=>{
 for(const level of [6,7])for(const lang of ['en','zh']){
  const h=mounted(level,lang),plainStorage=storage(level,lang),plain=UI.controller(engine(),plainStorage),total=E.levels[level].spawns.length;
  let boundary=null,kills=0,singular=0;
  const rendered=runPlan(h.c,plans[level],(before,events)=>{
   check(h);const s=h.c.state;
   if(before.nextSpawn===total-1&&s.nextSpawn===total){
    boundary={time:s.time,before:before.enemies.length,live:s.enemies.length};assert.equal(before.time,58-1/60);assert.equal(s.time,58);assert(qualifies(s));
   }
   if(before.nextSpawn===total){
    const removed=events.filter(e=>e.type==='kill'||e.type==='leak').length;
    assert.equal(s.enemies.length,before.enemies.length-removed);kills+=events.filter(e=>e.type==='kill').length;
    if(s.phase==='battle'&&s.enemies.length===1)singular++;
   }
  });
  const unrendered=runPlan(plain,plans[level]);assert.deepEqual(rendered,unrendered);
  assert.deepEqual([...h.st.data],[...plainStorage.data]);assert.deepEqual(h.st.writes,plainStorage.writes);
  assert.deepEqual(boundary,{time:58,before:level===6?15:22,live:level===6?16:23});assert(kills>0&&singular>0);
  assert.equal(h.c.state.phase,'won');assert.equal(h.c.state.enemies.length,0);check(h);idle(h);
  const same=h.c.state,prepared=copy(same.snapshot),finished=h.st.getItem(Replay.PREFIX+level);
  h.nodes.retry.onclick();assert.equal(h.c.state,same);assert.deepEqual(same,prepared);check(h);assert.equal(h.st.getItem(Replay.PREFIX+level),finished);
  h.nodes.retry.onclick();assert.deepEqual(same,prepared);check(h);
  const retried=runPlan(h.c,plans[level].filter(p=>p[0]>0));assert.deepEqual(retried.events,rendered.events);assert.deepEqual(retried.final,rendered.final);check(h);
  h.nodes.start.onclick({detail:1});assert.equal(h.c.state.level,level+1);assert.equal(h.c.state.phase,'prepare');check(h);
  const next=h.c.state;h.nodes.start.onclick({detail:2});assert.equal(h.c.state,next);assert.equal(next.phase,'prepare');
  let prevented=false;h.nodes.start.onkeydown({key:'Enter',repeat:true,preventDefault(){prevented=true;}});assert(prevented);
  h.nodes['stage-select'].value='0';h.nodes['stage-select'].onchange();assert.equal(h.c.state.level,0);check(h);
  h.nodes.language.onclick();check(h);h.nodes.start.onclick({detail:1});check(h);assert.equal(h.c.state.phase,'battle');
 }
});

test('real clearing pause, resume, visibility and active or paused Retry freeze state and repair actual DOM',()=>{
 for(const level of [6,7])for(const lang of ['en','zh'])for(const pausedRetry of [false,true]){
  const h=mounted(level,lang),c=h.c;runPlan(c,plans[level],()=>{},true);check(h);assert(qualifies(c.state));
  const live=c.state.enemies.length,time=c.state.time,identity=c.state,prepared=copy(c.state.snapshot),originalLang=c.lang;
  h.nodes.pause.onclick();check(h);assert(c.state.paused);idle(h);
  const frozen=JSON.stringify(c.state);assert.deepEqual(c.tick(1000),[]);assert.equal(JSON.stringify(c.state),frozen);
  h.nodes.wave.textContent='stale clearing text';h.reset();h.app.render();
  assert.deepEqual(h.writes.map(w=>[w.label,w.kind,w.key]),[['wave','text','textContent']]);check(h);
  h.nodes.language.onclick();check(h);assert.equal(JSON.stringify(c.state),frozen);h.nodes.language.onclick();assert.equal(c.lang,originalLang);check(h);
  h.nodes.pause.onclick();check(h);assert.equal(c.state.time,time);assert.equal(c.state.enemies.length,live);
  h.doc.hidden=true;h.events.visibilitychange();check(h);assert(c.state.paused);
  const hidden=JSON.stringify(c.state);h.app.frame(100000);h.doc.hidden=false;h.events.visibilitychange();h.app.frame(200000);assert.equal(JSON.stringify(c.state),hidden);idle(h);
  h.nodes.pause.onclick();check(h);c.tick(1/60);check(h);assert(c.state.time>time);
  if(pausedRetry)h.nodes.pause.onclick();h.nodes.retry.onclick();assert.equal(c.state,identity);assert.deepEqual(c.state,prepared);check(h);
  h.nodes.retry.onclick();assert.deepEqual(c.state,prepared);check(h);idle(h);
 }
});

test('one count change writes only wave text and original ARIA; dead entries and idle frames write nothing',()=>{
 const h=mounted(8),s=h.c.state;Object.assign(s,{phase:'battle',paused:true,time:48,nextSpawn:54,enemies:foes(2)});check(h);idle(h);
 const version=h.c.viewVersion;s.enemies[0].hp=0;h.reset();h.app.render();
 assert.equal(h.c.viewVersion,version,'count updates do not use the review cache');
 assert.deepEqual(h.writes.map(w=>[w.label,w.kind,w.key]),[['wave','text','textContent'],['wave','attribute','aria-label']]);
 assert.equal(h.nodes.wave.textContent,'Main 7 · Paused · 1 enemy left');assert.equal(h.nodes.wave.getAttribute('aria-label'),'Push 3/3 · 54/54 arrived · 1 active');
 s.enemies[0].hp=-20;h.reset();h.app.render();assert.equal(h.writes.length,0);idle(h);
 h.nodes.wave.setAttribute('aria-label','stale');h.reset();h.app.render();assert.deepEqual(h.writes.map(w=>[w.label,w.kind,w.key]),[['wave','attribute','aria-label']]);
 s.enemies[1].hp=0;check(h);assert.equal(h.nodes.wave.textContent,'Main 7 · Push 3/3 · 54/54');
});

test('legal Main 7 win, post-arrival leak loss and 44-live pre-arrival peak preserve full replay and history',()=>{
 const {simulate}=require('./td-rotating-siege-policies.test');
 for(const options of [{policy:'pierceReserve',seed:1},{policy:'heavyOpening',seed:127,delay:6},{policy:'familiarBroad',seed:1,delay:6}])for(const lang of ['en','zh']){
  const h=mounted(8,lang,options.seed),st=storage(8,lang),plain=UI.controller(engine(options.seed),st),expected=simulate({...options,controller:plain});
  const tick=h.c.tick;let kills=0,leaks=0,peak=false,tail=false,terminalSurvivors=false;
  h.c.tick=dt=>{
   const before=copy(h.c.state),events=tick(dt),s=h.c.state;check(h);
   if(s.phase==='battle'&&s.nextSpawn===53&&s.enemies.length===44){peak=true;assert.equal(h.nodes.wave.textContent,lang==='en'?'Main 7 · Push 3/3 · 53/54':'主线 7 · 第3/3段 · 53/54');}
   if(qualifies(s))tail=true;
   if(before.nextSpawn===54){
    const k=events.filter(e=>e.type==='kill').length,l=events.filter(e=>e.type==='leak').length;
    kills+=k;leaks+=l;assert.equal(s.enemies.length,before.enemies.length-k-l);
   }
   if(s.phase==='lost'&&s.enemies.length){terminalSurvivors=true;assert.equal(h.nodes.wave.textContent,legacyWave(s,lang));}
   return events;
  };
  const actual=simulate({...options,controller:h.c});assert.deepEqual(actual,expected);
  assert.deepEqual(h.c.review,plain.review);assert.deepEqual([...h.st.data],[...st.data]);assert.deepEqual(h.st.writes,st.writes);
  if(options.policy==='familiarBroad'){assert(peak&&!tail&&terminalSurvivors);assert.equal(h.c.state.nextSpawn,53);}
  else {assert(tail&&kills>0);if(options.policy==='heavyOpening'){assert(leaks>0);assert.equal(h.c.state.phase,'lost');assert.equal(h.c.state.enemies.length,0,'the final leak loses this legal run; zero is never clearing or victory');}}
  check(h);idle(h);const identity=h.c.state,prepared=copy(identity.snapshot);h.nodes.retry.onclick();assert.equal(h.c.state,identity);assert.deepEqual(identity,prepared);check(h);
  console.log('LEGAL '+JSON.stringify({policy:options.policy,lang,tail,killsAfterFinalArrival:kills,leaksAfterFinalArrival:leaks,peak44BeforeFinalArrival:peak,outcome:actual.final.phase,time:actual.final.time}));
 }
});

test('all 3024 bounded native-font labels fit the unchanged 218px item without CSS or HTML changes',()=>{
 const {createCanvas,GlobalFonts}=require('@napi-rs/canvas'),ctx=createCanvas(1,1).getContext('2d');
 const fonts=[['CJK','/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'],['DejaVu','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'],['Noto','/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf']];
 for(const [name,path]of fonts)assert(GlobalFonts.registerFromPath(path,'Clearing'+name));
 const css=fs.readFileSync(__dirname+'/td-lanes.css','utf8');assert.match(css,/\.resources span#wave\{font-size:12px;min-width:218px\}/);
 let samples=0,max=0;
 for(const level of mains)for(let live=1;live<=54;live++)for(const paused of [false,true])for(const lang of ['en','zh']){
  const s={...E.create(level),phase:'battle',paused,nextSpawn:E.levels[level].spawns.length,enemies:foes(live)};
  const label=UI.waveText(E,s,lang);assert(!label.includes('\n'));
  for(const [name]of lang==='zh'?fonts.slice(0,1):fonts){ctx.font='12px Clearing'+name;const width=ctx.measureText(label).width;assert(width<=218,label+' measures '+width+'px');max=Math.max(max,width);samples++;}
 }
 assert.equal(samples,3024);console.log('FONT '+JSON.stringify({samples,maxWidthPx:max,itemMinWidthPx:218,browserGeometry:false}));
 const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(__dirname+'/'+f)).digest('hex');
 const frozen={
  "index.html": "0de4091f24faf0bc494df90771e5d9cd587f6b448fc2d6449271962b1ce6fc94",
  "td-lanes.html": "48508ba7098e1590aca23b198432b9c38a098c358ae378f1146d97b426b3678e",
  "td-play.html": "b00538a7eb877e201e73c71cc55d78accd11c343bcc3d0eda6531713cf7c4a4c",
  "td-lanes.css": "4b63261fffadc7e60a50d74e7dcd9fcefae44e709b32be587179ac5e4a1753a9",
  "td-lanes.js": "537c9d404a94be925e5b0c8632fca48a76cd74ba52269d8d142cd7bd5ceb1a5f",
  "td-engine.js": "84d214f97b135890740837d969349c4bbb41c588cde47ba9e9bc10db0eb2aa17",
  "td-lanes-content.js": "b12954dbdaf64ced12681ffb67ce957665194eb7df3de88eba490b203879e3d9",
  "td-lanes-renderer.js": "5db61c90329ce79086c5f9304a15d319e28ec8a1d61cab9479b0a18c044e4749",
  "td-battle-review.js": "abf9d8e364ca92027907cdf6bf9e7d8ba4364c66495bb403b162a99de69a7ab5",
  "td-replay-store.js": "1c333c32eff746b62cca11bb4a68809029b890edaa298aa0d12f2b461c3df0c9"
};
 for(const [file,digest]of Object.entries(frozen))assert.equal(sha(file),digest,file+' must remain byte-identical');
});

delete global.TDLanesRenderer;
console.log('PASS '+groups+' clearing-cue groups; simulation, DOM doubles and native fonts only.');
