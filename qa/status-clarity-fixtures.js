'use strict';
// Legal engine captures, not browser or device evidence. No injected resources/enemies.
const assert=require('node:assert/strict'),ledger=require('./status-clarity/actions.json');
const copy=v=>JSON.parse(JSON.stringify(v));
function capture(E,observe=()=>{}){
 const s=E.create(6,{seed:ledger.seed}),states={},events=[];let i=0;
 const save=(name,ev=[])=>{states[name]={state:copy(s),events:copy(ev)};};
 const act=()=>{while(i<ledger.actions.length&&ledger.actions[i].time<=s.time+1e-9){const a=ledger.actions[i++];assert.equal(s.compute,a.before);assert.deepEqual(E[a.kind](s,...a.args),a.result);assert.equal(s.compute,a.after);}};
 act();
 while(s.phase==='battle'&&s.time<180){
  const ev=E.step(s,1/60);events.push(...ev);act();observe(s,ev);
  const g=s.units.find(u=>u.type==='grok');
  if(g){
   const next=g.fired%4+1;
   if(!states['next'+next]&&(next!==1||g.fired===4&&g.cooldown<1))save('next'+next,ev);
   if(!states['fourth-release']&&ev.some(e=>e.type==='shot'&&e.unitType==='grok'&&e.shotNumber===4))save('fourth-release',ev);
  }
  if(s.time===40||s.time===46)save('mixed-'+s.time,ev);
 }
 assert.equal(i,ledger.actions.length);assert.equal(s.phase,ledger.outcome.phase);assert.equal(s.time,ledger.outcome.time);assert.equal(s.core,5);save('won');
 const paused=copy(states['mixed-46']);assert(E.pause(paused.state,true).ok);states.paused=paused;
 // A separate losing legal Main5 battle keeps a Grok present at terminal loss.
 const loss=E.create(6,{seed:1});assert(E.deploy(loss,3,0,'grok').ok);assert(E.start(loss).ok);while(loss.phase==='battle'&&loss.time<180)E.step(loss,1/60);assert.equal(loss.phase,'lost');states.lost={state:loss,events:[]};
 // Capture real seeded pending/active statuses for each affected identity.
 for(const [type,status]of [['deepseek','rice'],['gpt','weak'],['claude','review']]){
  const w=E.create(6,{seed:1});assert(E.deploy(w,1,0,type).ok);assert(E.start(w).ok);
  while(w.phase==='battle'&&(!states[type+'-warning']||!states[type+'-active'])){
   const ev=E.step(w,1/60),u=w.units[0];if(!u)break;
   if(u.warning?.status===status&&!states[type+'-warning'])states[type+'-warning']={state:copy(w),events:copy(ev)};
   if(u.status===status&&!states[type+'-active'])states[type+'-active']={state:copy(w),events:copy(ev)};
  }
  assert(states[type+'-warning']);assert(states[type+'-active']);
 }
 assert(['next1','next2','next3','next4','fourth-release','mixed-46'].every(k=>states[k]));
 return{states,events,final:copy(s)};
}
module.exports={capture,copy};
