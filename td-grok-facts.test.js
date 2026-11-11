'use strict';
const assert=require('node:assert/strict'),E=require('./td-lanes'),R=require('./td-battle-review');
let count=0;const test=(name,fn)=>{fn();console.log('PASS',++count,name);};
const hit=(shotId,target,unitType='grok',extra={})=>({type:'hit',shotId,target,unitType,...extra});
function attempt(r=R.tracker(),level=0,seed=1){const s=E.create(level,{seed});r.begin(s,E.preview(level));s.phase='battle';return {r,s};}
function end(r,s,phase='won'){s.phase=phase;r.observe([],s);return r.result;}
function freeze(x){if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;}
test('distinct threshold, interleaved GPT, third target and repeated batches',()=>{
 for(const size of [1,2,7,99]){
  const {r,s}=attempt();const events=freeze([hit('g','a'),hit('p','a','gpt'),hit('g','a'),hit('g','b'),hit('p','b','gpt'),hit('g','c'),hit('w','a','grok',{quality:'weak',amount:4}),hit('w','b','grok',{quality:'weak',amount:4})]);
  const before=JSON.stringify(s);for(let i=0;i<events.length;i+=size){const batch=events.slice(i,i+size);r.observe(batch,s);r.observe(batch,s);}assert.equal(JSON.stringify(s),before);
  const x=end(r,s);assert.equal(x.grokMultiShots,2);assert.equal(x.secondHits,1);r.observe(events,s);assert.deepEqual(r.result,x);
 }
 const {r,s}=attempt();r.observe([hit('g','a')],s);assert.equal(end(r,s).grokMultiShots,0);
});
test('misses, visuals, unsupported towers and missing identities are not hit evidence',()=>{
 const {r,s}=attempt();const events=[{type:'shot',unitType:'grok',shotId:'miss'},{type:'cluster-impact',unitType:'grok',shotId:'impact'},hit('one','a'),hit(null,'a'),hit('invalid',null)];
 for(const type of ['deepseek','claude','gemini'])events.push(hit(type,'a',type),hit(type,'b',type));r.observe(events,s);
 assert.equal(end(r,s).grokMultiShots,0);assert.equal(r.result.secondHits,0);
});
test('terminal freeze, cancel/reset, retry IDs and seeded previous snapshots',()=>{
 const {r,s}=attempt();const events=[hit('g','a'),hit('g','b')];r.observe(events,s);const first=end(r,s,'lost');assert.equal(first.grokMultiShots,1);
 r.observe([hit('later','a'),hit('later','b')],s);assert.deepEqual(r.result,first);
 r.reset(0);assert.equal(r.result,null);let next=attempt(r).s;r.observe(events,next);r.reset(0);assert.equal(r.result,null);r.observe(events,next);assert.equal(r.result,null);
 next=attempt(r).s;const second=end(r,next);assert.equal(second.grokMultiShots,0);assert.equal(second.previous.grokMultiShots,1);
 second.previous.grokMultiShots=99;second.leaks[0]=9;assert.equal(r.result.previous.grokMultiShots,1);assert.equal(r.result.leaks[0],0);assert.equal(first.grokMultiShots,1);
 next=attempt(r).s;r.observe(events,next);assert.equal(end(r,next).grokMultiShots,1);
 next=attempt(r,0,2).s;assert.equal(end(r,next).previous,null);
 r.reset(1);next=attempt(r,1).s;assert.equal(end(r,next).previous,null);
});
test('real weak projectile after withdrawal counts, pause does not, retry snapshot stays untouched',()=>{
 const s=E.create(),r=R.tracker();assert(E.deploy(s,0,0,'grok').ok);const original=JSON.stringify(s);r.begin(s,E.preview(0));E.start(s);const snapshot=JSON.stringify(s.snapshot);s.nextSpawn=E.preview(0).length;s.units[0].fired=3;
 s.enemies.push(...[1.3,1.5,1.7].map((x,i)=>({id:'fixture'+i,type:'swarm',x,row:0,hp:1,cooldown:0,slowUntil:0,mark:null})));
 const launch=E.step(s,1/60);assert(launch.some(e=>e.type==='shot'&&e.quality==='weak'));r.observe(launch,s);assert.equal(r.result,null);
 const id=s.units[0].id;E.pause(s,true);assert(E.emergencyWithdraw(s,id).ok);const paused=JSON.stringify(s);for(let i=0;i<5;i++)r.observe(E.step(s,1),s);assert.equal(JSON.stringify(s),paused);assert.equal(r.result,null);
 E.pause(s,false);const hits=[];while(s.phase==='battle'&&s.time<1){const es=E.step(s,1/60);hits.push(...es.filter(e=>e.type==='hit'));r.observe(es,s);}assert.equal(s.phase,'won');assert.equal(hits.length,3);assert(hits.every(e=>e.source===id&&e.quality==='weak'));assert.equal(r.result.grokMultiShots,1);assert.equal(r.result.secondHits,0);assert.equal(r.result.withdrawals,1);assert.equal(r.result.refunded,40);assert.equal(r.result.spent,80);assert.equal(JSON.stringify(s.snapshot),snapshot);
 assert(E.retry(s).ok);assert.equal(JSON.stringify(s),original);r.reset(0);r.begin(s,E.preview(0));assert.equal(r.result,null);const retry=end(r,s);assert.equal(retry.grokMultiShots,0);assert.equal(retry.previous.grokMultiShots,1);
});
test('bilingual observation is exactly one clause, zero and nonzero, no new comparison',()=>{
 for(const n of [0,1,21]){const {r,s}=attempt();const result=end(r,s);result.grokMultiShots=n;result.previous={...result,grokMultiShots:7};
  for(const lang of ['en','zh']){freeze(result);const before=JSON.stringify(result),lines=R.lines(result,lang);assert.equal(lines[1],lang==='en'?`Actual turns 0 · GPT second-target hits 0 · Grok shots hitting 2+ targets ${n}`:`实际转行 0 · GPT 第二目标命中 0 · Grok 命中至少2个目标的发数 ${n}`);assert.equal(lines.filter(x=>x.includes('Grok')).length,1);assert.equal(JSON.stringify(result),before);}
 }
});
console.log(count+' Grok observation groups passed');
