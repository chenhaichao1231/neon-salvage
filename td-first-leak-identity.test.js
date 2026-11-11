'use strict';
const assert=require('node:assert/strict'),E=require('./td-lanes-content'),R=require('./td-battle-review'),Store=require('./td-replay-store'),UI=require('./td-lanes-ui');
let count=0;function test(name,fn){fn();console.log('PASS',++count,name);}
const copy=x=>JSON.parse(JSON.stringify(x));
const leak=(id,enemyType,row=3,time=90.2)=>({type:'leak',id,row,time,enemyType});
function tracked(batches){const s=E.create(2),r=R.tracker();r.begin(s,E.preview(2));for(const events of batches)r.observe(events,s);r.observe([],{...s,phase:'lost'});return r;}
const base={leaks:[0,0,0,1,0],losses:[0,0,0,0,0],firstLeak:{row:3,time:90.2},turns:0,secondHits:0,grokMultiShots:0,outcome:'lost',core:4,spent:180,time:100,withdrawals:0,refunded:0};
const firstSentence=(type,lang,row=3,time=90.2)=>(lang==='zh'?'首次漏敌：第'+(row+1)+'行，':'First leak: lane '+(row+1)+', ')+(type?E.definitions.enemies[type].name[lang]+(lang==='zh'?'，':', '):'')+time.toFixed(1)+'s';
test('four recognized event identities use exact engine names in the existing sentence only',()=>{
 for(const type of Object.keys(E.definitions.enemies)){
  const event=Object.freeze(leak('e1',type)),r=tracked([Object.freeze([event])]),facts=r.result;
  assert.deepEqual(facts.firstLeak,{row:3,time:90.2,enemyType:type});
  for(const lang of ['zh','en'])for(const durable of [false,true]){
   const legacy={...base,durable},full={...legacy,firstLeak:facts.firstLeak},before=copy(full),lines=R.lines(full,lang);
   assert.equal(lines.filter(line=>line.includes(firstSentence(type,lang))).length,1);
   assert.deepEqual(lines.map(line=>line.replace(firstSentence(type,lang),firstSentence(null,lang))),R.lines(legacy,lang),'no other line or fact changes');
   assert.deepEqual(full,before,'formatting is read-only');
  }
  facts.firstLeak.enemyType='data';assert.equal(r.result.firstLeak.enemyType,type,'result getter returns a detached snapshot');
 }
});
test('missing, unknown, inherited and malformed types keep exact legacy text without coercion',()=>{
 const cannotCoerce={toString(){throw Error('must not coerce enemy type');},valueOf(){throw Error('must not coerce enemy type');}};
 const malformed=[undefined,null,'unknown','__proto__','constructor','prototype','toString','Charge','armor<img src=x>','charge\nFirst leak:',0,1,NaN,true,[],['charge'],{},Object.create(null),new String('charge'),cannotCoerce,Symbol('charge'),1n,()=> 'charge'];
 for(const enemyType of malformed){
  const event=Object.freeze(leak('e1',enemyType)),r=tracked([[event]]);
  assert.deepEqual(r.result.firstLeak,base.firstLeak);
  assert.equal(event.enemyType,enemyType);
  for(const lang of ['zh','en']){
   assert.deepEqual(R.lines({...base,firstLeak:{...base.firstLeak,enemyType}},lang),R.lines(base,lang));
   assert.deepEqual(R.lines(r.result,lang),R.lines({...r.result,firstLeak:base.firstLeak},lang));
  }
 }
 const legacy=leak('old',undefined);delete legacy.enemyType;assert.deepEqual(tracked([[legacy]]).result.firstLeak,base.firstLeak);
 const standalone={};require('node:vm').runInNewContext(require('node:fs').readFileSync(__dirname+'/td-battle-review.js','utf8'),standalone);
 assert.equal(standalone.TDLanes,undefined);assert(standalone.TDBattleReview.lines({...base,firstLeak:{...base.firstLeak,enemyType:'charge'}},'en').some(line=>line.includes(firstSentence('charge','en'))));
});
test('earliest time wins; equal times retain first observed identity and duplicate IDs never backfill',()=>{
 const batches=[[leak('late','charge',3,90),leak('latest','data',0,100)],[leak('early','armor',1,80),leak('tie','swarm',2,80)]];
 const r=tracked([...batches,...batches.map(copy),[leak('early','charge',4,1)]]);
 assert.deepEqual(r.result.firstLeak,{row:1,time:80,enemyType:'armor'});assert.deepEqual(r.result.leaks,[1,1,1,1,0]);
 assert.deepEqual(tracked([[leak('tie','swarm',2,80),leak('early','armor',1,80)]]).result.firstLeak,{row:2,time:80,enemyType:'swarm'});
 const unknown=leak('unknown','new-kind',4,50),known=leak('known','data',0,50);
 assert.deepEqual(tracked([[unknown,known,leak('unknown','charge',4,40)]]).result.firstLeak,{row:4,time:50});
 assert.deepEqual(tracked([[leak('old',undefined,1,60)],[leak('new','charge',3,40)]]).result.firstLeak,{row:3,time:40,enemyType:'charge'});
 assert.deepEqual(tracked([[leak('bad','charge',5,1),leak('valid','armor',1,2)]]).result.firstLeak,{row:1,time:2,enemyType:'armor'});
});
function memory(level){const data=new Map([[UI.bookmarkKey,JSON.stringify({version:1,lastStage:level,highestStage:Math.max(5,level),lang:'en'})]]);return{data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};}
// Production engine actions only: no HP, resources, enemies, schedules or terminal-state injection.
// The armor run fills lanes 1..5 with GPT as each 90 GPU becomes available.
const armorPlan=[[0,0,0,'gpt'],[0,1,0,'gpt'],[22,2,0,'gpt'],[40,3,0,'gpt'],[58,4,0,'gpt']];
function play(level,plan=[]){
 const storage=memory(level),c=UI.controller(E,storage),mirror=E.create(level),events=[];let i=0;
 const buy=()=>{while(i<plan.length&&c.state.time+1e-9>=plan[i][0]){const[,row,col,type]=plan[i++];assert(c.select(type).ok);assert(c.cell(row,col).ok);assert(E.deploy(mirror,row,col,type).ok);}};
 buy();assert(c.start().ok);assert(E.start(mirror).ok);
 for(let steps=0;steps<200&&c.state.phase==='battle';steps++){
  buy();const expected=E.step(mirror,1),actual=c.tick(1);assert.deepEqual(actual,expected);assert.deepEqual(c.state,mirror,'observation must not change engine state');events.push(...actual);
 }
 assert.notEqual(c.state.phase,'battle');assert.equal(i,plan.length);return{c,storage,events};
}
test('actual first leak of each type comes from legal production play, including mixed pressure',()=>{
 for(const[level,plan,type]of [[0,[],'data'],[1,[],'swarm'],[1,armorPlan,'armor'],[2,[],'charge']]){
  const {c,events}=play(level,plan),first=events.find(e=>e.type==='leak'),r=c.review;
  assert.equal(first.enemyType,type);assert.deepEqual(r.firstLeak,{row:first.row,time:first.time,enemyType:first.enemyType});
  for(const lang of ['zh','en'])assert(R.lines(r,lang).some(line=>line.includes(firstSentence(type,lang,first.row,first.time))));
  assert.equal(r.leaks.reduce((a,b)=>a+b),events.filter(e=>e.type==='leak').length);
  if(level===2)assert(new Set(events.filter(e=>e.type==='leak').map(e=>e.enemyType)).size>1,'mixed leaked types cannot overwrite the first identity');
 }
});
test('all nine production encounters retain state/events and compact retry/reload schema',()=>{
 for(let level=0;level<E.levels.length;level++){
  const {c,storage,events}=play(level),result=c.review,first=events.find(e=>e.type==='leak'),key=Store.PREFIX+level;
  assert.equal(E.levels.length,9);assert.equal(result.firstLeak.enemyType,first.enemyType);
  const compact=Store.summary(result),stored=JSON.parse(storage.data.get(key));
  assert.deepEqual(Object.keys(compact).sort(),['core','leaks','losses','outcome','refunded','spent','time','withdrawals']);
  assert(Store.validFacts(compact));assert.deepEqual(stored,{version:1,context:Store.context(E,c.state),facts:compact});
  assert(!Object.hasOwn(compact,'firstLeak'));assert(!Object.hasOwn(compact,'enemyType'));
  assert(c.retry().ok);assert.equal(c.review,null);assert.deepEqual(c.reference.previous,compact);
  for(const lang of ['zh','en']){
   const text=R.referenceLines(c.reference,lang).join('\n');assert(!text.includes(lang==='zh'?'首次漏敌':'First leak'));assert(!text.includes(E.definitions.enemies[first.enemyType].name[lang]));
  }
  assert(c.start().ok);c.tick(1);assert.equal(c.review,null);assert(c.pause().ok);const paused=copy(c.state);c.tick(1);assert.deepEqual(c.state,paused);assert.equal(c.review,null);
  assert(c.retry().ok);assert.deepEqual(c.reference.previous,compact);assert(c.start().ok);
  for(let steps=0;steps<200&&c.state.phase==='battle';steps++)c.tick(1);
  const repeated=c.review;assert.deepEqual(repeated.firstLeak,result.firstLeak);assert.deepEqual(repeated.previous,compact);
  for(const lang of ['zh','en']){
   const text=R.lines(repeated,lang).join('\n');assert.equal(text.split(lang==='zh'?'首次漏敌':'First leak').length-1,1);
   const withoutType=copy(repeated);delete withoutType.firstLeak.enemyType;
   assert.equal(text.replace(firstSentence(first.enemyType,lang,first.row,first.time),firstSentence(null,lang,first.row,first.time)),R.lines(withoutType,lang).join('\n'),'same-plan deltas and reference copy unchanged');
  }
  const reload=UI.controller(E,storage);assert.equal(reload.state.phase,'prepare');assert.equal(reload.review,null);assert.deepEqual(reload.reference.previous,compact);
 }
});
console.log(count+' first-leak identity groups passed');
