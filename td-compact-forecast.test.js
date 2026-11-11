'use strict';
// Decode only visible line text, independently of the implementation's grouping
// objects and arithmetic helpers. No hidden originals can supply missing arrivals.
const assert=require('node:assert/strict'),fs=require('node:fs');
const plain=x=>JSON.parse(JSON.stringify(x));
const phaseCounts=[[10,10,10],[5,18,5,22],[8,19,16,11],[2],[9],[11,8,12,12],[5,14,23,11],[13,16,9,15],[18,18,18]];
const compactCounts=[[10,10,10],[5,12,5,14],[8,11,10,7],[2],[2],[11,3,3,6],[5,8,13,6],[11,10,6,11],[5,5,5]];
function textTicks(text){
 assert.match(text,/^(0|[1-9]\d*)(?:\.\d{1,2})?$/);
 const [whole,fraction='']=text.split('.');return BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0'));
}
function tickNumber(ticks){
 const padded=String(ticks).padStart(3,'0');return Number(padded.slice(0,-2)+'.'+padded.slice(-2));
}
function expandForecastText(text,E,lang){
 const zh=lang==='zh',number='(\\d+(?:\\.\\d{1,2})?)';
 const header=text.match(new RegExp('^'+number+'(?:–'+number+')?s · '+(zh?'第([1-5])行':'Lane ([1-5])')+' · (.+)$'));
 assert(header,'forecast header: '+text);
 const [,first,last,lane]=header;let rest=header[4],toRow;
 const route=rest.match(zh?/ → 第([1-5])行（触发后）$/:/ → Lane ([1-5]) \(if triggered\)$/);
 if(route){toRow=Number(route[1])-1;rest=rest.slice(0,-route[0].length);}
 const batch=rest.match(/^(.+) ×([1-9]\d*) · (.+)$/);let name=rest,count=1,interval=0n;
 if(batch){
  name=batch[1];count=Number(batch[2]);assert(Number.isSafeInteger(count)&&count>=3);
  if(batch[3]===(zh?'同时来袭':'simultaneous'))assert.equal(last,undefined,'same endpoint needs no duplicate label');
  else{const timing=batch[3].match(zh?/^每(\d+(?:\.\d{1,2})?)s一名$/:/^every (\d+(?:\.\d{1,2})?)s$/);assert(timing,'explicit interval: '+text);interval=textTicks(timing[1]);assert(interval>0n);assert.notEqual(last,undefined,'inclusive last time is visible');}
 }else assert.equal(last,undefined,'a range must expose count and interval');
 const type=Object.keys(E.definitions.enemies).find(type=>E.definitions.enemies[type].name[lang]===name);assert(type,'full exact enemy name: '+name);
 const start=textTicks(first),end=start+BigInt(count-1)*interval;assert.equal(end,textTicks(last??first),'visible endpoint matches count and interval');
 return Array.from({length:count},(_,i)=>({row:Number(lane)-1,type,time:tickNumber(start+BigInt(i)*interval),...(toRow===undefined?{}:{toRow})}));
}
function assertForecast(nodes,E,level,lang){
 const children=nodes['forecast-content'].children,phases=[],definition=E.levels[level];
 for(const node of children){
  if(node.className==='phase-heading')phases.push({heading:node.textContent,lines:[]});
  if(node.className==='forecast-spawn'){assert(phases.length);phases.at(-1).lines.push(node.textContent);}
 }
 const starts=definition.phaseStarts||[definition.spawns[0]?.time||0];
 assert.equal(phases.length,starts.length);const all=[];
 for(let i=0;i<phases.length;i++){
  const expected=plain(definition.spawns.filter(p=>p.time>=starts[i]&&p.time<(starts[i+1]??Infinity)));
  const expanded=phases[i].lines.flatMap(line=>expandForecastText(line,E,lang));
  assert.deepEqual(expanded,expected,'visible full ordered records, raw'+level+' phase'+i+' '+lang);
  assert.equal(expected.length,phaseCounts[level][i]);assert.equal(phases[i].lines.length,compactCounts[level][i]);
  const title=definition.optional?(lang==='zh'?'机制练习':'Mechanic drill'):(lang==='zh'?'第'+(i+1)+'段':'Push '+(i+1));
  assert.equal(phases[i].heading,title+' · '+starts[i]+'–'+expected.at(-1).time+'s · '+expected.length+(lang==='zh'?'名敌人':' enemies'));
  all.push(...expanded);
 }
 assert.deepEqual(all,plain(definition.spawns));return phases;
}
module.exports={expandForecastText,assertForecast};

if(require.main===module){
 const E=require('./td-lanes-content'),UI=require('./td-lanes-ui');let groups=0;
 const test=(name,fn)=>{fn();console.log('PASS',++groups,name);};
 const p=(time,extra={})=>({row:0,type:'swarm',time,...extra});
 function lines(records,lang='en'){return UI.compactForecast(E,records).map(line=>UI.forecastLine(E,line,lang));}
 function roundTrip(records){for(const lang of ['en','zh'])assert.deepEqual(lines(records,lang).flatMap(line=>expandForecastText(line,E,lang)),records);}
 function individual(records){const compact=UI.compactForecast(E,records);assert.equal(compact.length,records.length);compact.forEach((entry,i)=>{assert.equal(entry.kind,'single');assert.equal(entry.record,records[i]);});}
 const production=fs.readFileSync(__dirname+'/td-interleaved-pursuit-integration.test.js','utf8').split("test('exact frozen")[0];
 const {harness,storage,run}=Function('require','__dirname',production+'\nreturn {harness,storage,runtime,run};')(require,__dirname);
 const writeHarnessSource=fs.readFileSync(__dirname+'/td-lanes-dom-writes.test.js','utf8').split('function count(h)')[0];
 const writeHarness=Function('require','__dirname',writeHarnessSource+'\nreturn harness;')(require,__dirname);

 test('exact canonical decimal ticks reject unsupported precision and unsafe inputs without repair',()=>{
  for(const [value,want]of [[0,0n],[.01,1n],[.1,10n],[14.3,1430n],[57.25,5725n],[90071992547409,9007199254740900n]])assert.equal(UI.forecastTicks(value),want);
  for(const value of [-0,-1,-.1,Infinity,-Infinity,NaN,1e21,1e-7,.001,.1+.2,90071992547410,'1',null,undefined,{},1n])assert.equal(UI.forecastTicks(value),null,String(value));
  for(const ticks of [0n,1n,10n,1430n,5725n])assert.equal(UI.forecastTicks(Number(UI.forecastDecimal(ticks))),ticks);
 });
 test('only regular maximal runs of three or more collapse; decimals and simultaneous values round-trip visibly',()=>{
  for(const records of [[p(1)],[p(1),p(2)],[p(1),p(2),p(3),p(5)],[p(1),p(3),p(4),p(5)],[p(3),p(2),p(1)]]){individual(records);roundTrip(records);}
  for(const records of [[p(14),p(14.3),p(14.6),p(14.9)],[p(.01),p(.02),p(.03)],[p(4),p(4),p(4)],[p(0),p(0),p(0)]]){assert.equal(UI.compactForecast(E,records).length,1);roundTrip(records);}
  assert.equal(lines([p(4),p(4),p(4)])[0],'4s · Lane 1 · Fragment ×3 · simultaneous');
  assert.equal(lines([p(4),p(4),p(4)],'zh')[0],'4s · 第1行 · 碎片群 ×3 · 同时来袭');
 });
 test('unsupported time anywhere prevents grouping the entire maximal metadata run',()=>{
  for(const value of [-0,-1,Infinity,NaN,1e21,1e-7,1.001,.1+.2,90071992547410,'4',null,undefined]){
   const records=[p(1),p(2),p(3),p(value),p(5),p(6),p(7)];individual(records);
   for(const lang of ['en','zh'])assert.deepEqual(lines(records,lang),records.map(r=>r.time+'s · '+(lang==='zh'?'第1行 · 碎片群':'Lane 1 · Fragment')));
  }
 });
 test('unknown metadata, types and routes stay individual; route presence and direction are exact barriers',()=>{
  for(const extra of [{route:'new'},{note:undefined},{type:'future'},{type:'toString'},{row:-1},{row:5},{row:1.5},{row:-0},{toRow:undefined},{toRow:null},{toRow:0},{toRow:2},{toRow:'1'},{toRow:-0},{toRow:NaN},{toRow:Infinity},{[Symbol('route')]:'new'}])individual([p(1,extra),p(2,extra),p(3,extra)]);
  const hidden=p(2);Object.defineProperty(hidden,'route',{value:'hidden'});individual([p(1),hidden,p(3)]);
  individual([p(1,{toRow:1}),p(2),p(3)]);
  const routes=[...Array.from({length:3},(_,i)=>p(i,{row:1,toRow:0})),...Array.from({length:3},(_,i)=>p(i+3,{row:1,toRow:2})),...Array.from({length:3},(_,i)=>p(i+6,{row:1})),...Array.from({length:3},(_,i)=>p(i+9,{toRow:1}))];
  assert.equal(UI.compactForecast(E,routes).length,4);roundTrip(routes);
  // Same destination is not the same route, nor are absent and explicit route fields.
  individual([p(1,{toRow:1}),p(2,{row:2,toRow:1}),p(3,{toRow:1})]);
  const unknown=[p(1),p(2),p(3),p(4,{route:'new'}),p(5),p(6),p(7)];assert.deepEqual(UI.compactForecast(E,unknown).map(e=>e.kind),['batch','single','batch']);
 });
 test('inherited recognized metadata stays individual and preserves the original conditional route strings',()=>{
  const prototypes=[{toRow:1},Object.create({toRow:1}),Object.defineProperty({},'toRow',{value:1}),Object.defineProperty({},'toRow',{get:()=>1})];
  for(const prototype of prototypes){
   const records=[1,2,3].map(time=>Object.assign(Object.create(prototype),{time,row:0,type:'charge'}));individual(records);
   for(const lang of ['en','zh'])assert.deepEqual(lines(records,lang),records.map(r=>r.time+(lang==='zh'?'s · 第1行 · 冲锋数据 → 第2行（触发后）':'s · Lane 1 · Charging data → Lane 2 (if triggered)')));
  }
  // Unknown or invalid inherited destinations also stay untouched, including the
  // old suffix behavior for any integer destination. This is not route repair.
  for(const toRow of [undefined,null,0,2,'1',NaN]){
   const records=[1,2,3].map(time=>Object.assign(Object.create({toRow}),{time,row:0,type:'charge'}));individual(records);
   for(const lang of ['en','zh'])assert.deepEqual(lines(records,lang),records.map(r=>r.time+(lang==='zh'?'s · 第1行 · 冲锋数据':'s · Lane 1 · Charging data')+(Number.isInteger(toRow)?(lang==='zh'?' → 第'+(toRow+1)+'行（触发后）':' → Lane '+(toRow+1)+' (if triggered)'):'')));
  }
  for(const field of ['time','row','type']){
   const records=[1,2,3].map(time=>{const own=p(time),value=own[field];delete own[field];return Object.assign(Object.create({[field]:value}),own);});individual(records);
  }
 });
 test('every different row/type event and equal-time interleaving retains its existing order',()=>{
  for(const records of [[p(1),p(2),p(3,{row:1}),p(4)],[p(1),p(2),p(3,{type:'data'}),p(4)],[p(4),p(4,{type:'charge'}),p(4),p(4)]]){individual(records);roundTrip(records);}
  const tied=[p(1),p(2),p(3),p(3,{row:1}),p(3),p(4),p(5)];assert.equal(UI.compactForecast(E,tied).length,3);roundTrip(tied);
  const phases=UI.phaseGroups({phaseStarts:[1,3],spawns:[p(1),p(2),p(3),p(4)]});assert.equal(phases.flatMap(g=>UI.compactForecast(E,g.spawns)).length,4);
 });
 test('all nine actual phase partitions reconstruct 348 ordered records from 214 bilingual visible lines without mutation',()=>{
  const before=structuredClone(E.levels);let raw=0,compact=0;
  for(let level=0;level<E.levels.length;level++){
   const definition=E.levels[level],phases=UI.phaseGroups(definition);assert.deepEqual(phases.map(g=>g.spawns.length),phaseCounts[level]);
   assert.deepEqual(phases.map(g=>UI.compactForecast(E,g.spawns).length),compactCounts[level]);raw+=definition.spawns.length;compact+=compactCounts[level].reduce((a,b)=>a+b,0);
   for(const phase of phases)roundTrip(phase.spawns);
   for(const lang of ['en','zh']){const h=harness(storage(level,8,lang),true);assertForecast(h.nodes,h.E,level,lang);assert.equal(h.st.writes.length,0);
    const legend=h.nodes['forecast-content'].children.find(n=>n.className==='enemy-count-legend');assert(legend.children.some(n=>n.textContent===UI.enemyCountLegend(lang).note));
    if(definition.optional)assert.equal(h.nodes['forecast-content'].children[0].textContent,(lang==='zh'?'* 箭头为触发后的目标行。':'* Arrow marks the destination if triggered. ')+UI.detourRule(lang,definition.spawns.length));
   }
  }
  assert.equal(raw,348);assert.equal(compact,214);assert.deepEqual(E.levels,before);
  // Freeze inputs to catch even transient in-place sort or field edits.
  for(const phase of UI.phaseGroups(E.levels[6])){const frozen=Object.freeze(phase.spawns.map(r=>Object.freeze({...r})));roundTrip(frozen);}
  console.log('ROUNDTRIP '+JSON.stringify({original:raw,displayed:compact,phaseCounts,compactCounts}));
 });
 test('actual Main5 and Main6 interruptions remain visible in place, with no prefix salvage',()=>{
  const l5=UI.phaseGroups(E.levels[6]).flatMap(g=>lines(g.spawns));
  const group='14–15.8s · Lane 4 · Fragment ×7 · every 0.3s',index=l5.indexOf(group);assert(index>=0);
  assert.equal(l5[index+1],'16s · Lane 5 · Data blob');assert.equal(l5[index+2],'16.1s · Lane 4 · Fragment');assert(!l5.some(s=>s.startsWith('14–16.1s')));
  for(const [time,row,end]of [[13,0,13.2],[51,2,51.2],[57,4,57.2]]){
   const l6=UI.phaseGroups(E.levels[7]).flatMap(g=>lines(g.spawns)),at=l6.findIndex(s=>s===time+'s · Lane '+(time===51?2:4)+' · Data blob');assert(at>0);
   assert.match(l6[at-1],new RegExp('Lane '+(row+1)+' · Fragment ×3 · every 0.4s$'));assert.equal(l6[at+1],end+'s · Lane '+(row+1)+' · Fragment');
  }
  assert.equal(lines([p(4,{row:1,type:'charge',toRow:2}),p(4.6,{row:1,type:'charge',toRow:2}),p(5.2,{row:1,type:'charge',toRow:2})])[0],'4–5.2s · Lane 2 · Charging data ×3 · every 0.6s → Lane 3 (if triggered)');
 });
 test('automatic production mount, stage/language switches and selection keep one existing forecast list',()=>{
  const h=harness(storage(0,8,'en'),true),n=h.nodes;n.forecast.open=true;n.forecast.scrollTop=73;
  for(const level of [8,6,7,4,2,5,1,3,0]){
   n['stage-select'].value=String(level);n['stage-select'].onchange();assert.equal(h.state.level,level);assertForecast(n,h.E,level,'en');
   const before=JSON.stringify(h.state);n.language.onclick();assertForecast(n,h.E,level,'zh');assert.equal(JSON.stringify(h.state),before);n.language.onclick();assertForecast(n,h.E,level,'en');assert.equal(n.forecast.open,true);assert.equal(n.forecast.scrollTop,73);
  }
  n.grid.children[0].onclick();const selected=n.grid.children[0].getAttribute('aria-pressed'),before=JSON.stringify(h.state);n.language.onclick();assert.equal(n.grid.children[0].getAttribute('aria-pressed'),selected);assert.equal(JSON.stringify(h.state),before);
  assert.equal(n.cards.children.length,4);assert.equal(n['row-preview'].children.length,5);
  const html=fs.readFileSync(__dirname+'/index.html','utf8');assert.match(html,/<details id="forecast">/);assert.equal((html.match(/id="forecast-content"/g)||[]).length,1);
 });
 test('compatible and historical reference before Start, hidden battle, retry and reload keep exact forecasts and history',()=>{
  for(const level of [4,6,7,8])for(const lang of ['en','zh'])for(const historical of [false,true]){
   const st=storage(level,8,lang),initial=harness(st);run(initial.c);const key=initial.P.PREFIX+level;
   if(historical){const record=JSON.parse(st.data.get(key));record.context=record.context.replace('td-lanes-sha256:','old-td-lanes-sha256:');st.data.set(key,JSON.stringify(record));}
   const raw=st.data.get(key),h=harness(st),n=h.nodes;assert.equal(st.data.get(key),raw);assert(!n['previous-stage-result'].hidden);assertForecast(n,h.E,level,lang);
   if(historical)assert(h.c.reference.historical);else assert(h.c.reference.previous);
   const forecast=n['forecast-content'].children.slice(),reads=st.writes.length;for(let i=0;i<120;i++)h.app.render();assert.equal(st.writes.length,reads);assert.deepEqual(n['forecast-content'].children,forecast);
   n.start.onclick();assert(n['previous-stage-result'].hidden);h.frame(0);h.frame(100);h.doc.hidden=true;h.events.visibilitychange();const frozen=JSON.stringify(h.c.state);h.frame(50000);assert.equal(JSON.stringify(h.c.state),frozen);assert.equal(st.data.get(key),raw);
   h.doc.hidden=false;h.events.visibilitychange();h.frame(50100);assert.equal(JSON.stringify(h.c.state),frozen);n.retry.onclick();assertForecast(n,h.E,level,lang);assert(!n['previous-stage-result'].hidden);assert.deepEqual(n['forecast-content'].children,forecast);
   const reloaded=harness(st);assertForecast(reloaded.nodes,reloaded.E,level,lang);assert.equal(reloaded.c.state.phase,'prepare');assert.equal(st.data.get(key),raw);
  }
 });
 test('unchanged renders and preparation/paused/hidden frames add no forecast DOM writes or storage writes',()=>{
  for(const level of [1,2,4,5,6,7,8]){
   const h=writeHarness(level),n=h.nodes;let saves=0;h.win.localStorage.setItem=()=>saves++;
   const check=()=>{h.reset();const rows=n['forecast-content'].children.slice(),before=saves;for(let i=0;i<120;i++)h.app.frame(1000+i*16);assert.equal(h.writes.length,0);assert.equal(saves,before);assert.deepEqual(n['forecast-content'].children,rows);};
   check();n.start.onclick();n.pause.onclick();check();h.doc.hidden=true;check();
  }
 });
 console.log('PASS '+groups+' compact forecast groups; visible representation and local DOM/storage doubles, no browser/device acceptance');
 delete global.TDLanesRenderer;
}
