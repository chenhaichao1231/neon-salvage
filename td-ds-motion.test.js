'use strict';
const assert=require('node:assert/strict'),E=require('./td-lanes'),R=require('./td-lanes-renderer');
const u={type:'deepseek',row:0,col:0,x:.5,hp:90,status:'normal',statusRemaining:0,fired:1,cooldown:1.1};const s=E.create();s.units=[u];s.enemies=[{hp:9999,row:0,x:5,type:'armor',id:'target',cooldown:0}];
assert.equal(E.definitions.units.deepseek.interval,1.1);
for(const [cd,idx] of [[1.1,2],[.97,3],[.85,4],[.66,5],[.54,0],[.2,1]]){u.cooldown=cd;assert.equal(R.dsFrame(u,s,0,false).index,idx);}
for(const [cd,sheet,idx] of [[1.1,'dsAttack',2],[.97,'dsAttack',2],[.85,'dsIdle',0],[.66,'dsIdle',0],[.2,'dsIdle',0],[0,'dsIdle',0]]){u.cooldown=cd;assert.deepEqual(R.dsFrame(u,s,999,true),{sheet,cols:3,rows:sheet==='dsIdle'?1:2,index:idx});}
// A final target disappearing must not truncate an in-progress cast/recovery.
s.enemies=[];for(const phase of ['battle','won','lost']){s.phase=phase;for(const [cd,idx] of [[1.1,2],[.97,3],[.85,4],[.66,5]]){u.cooldown=cd;assert.equal(R.dsFrame(u,s,999,false).index,idx);}}
u.cooldown=.2;assert.equal(R.dsFrame(u,s,0,false).sheet,'dsIdle');
// Rice takes precedence and returns to current cooldown, not a stored/cached action.
u.status='rice';for(const [remaining,index] of [[2,3],[1.75,4],[1.5,5],[.05,3]]){u.statusRemaining=remaining;assert.equal(R.dsFrame(u,s,0,false).index,index);assert.equal(R.dsFrame(u,s,999,true).index,4);}
u.status='normal';u.cooldown=0;assert.equal(R.dsFrame(u,s,0,false).sheet,'dsIdle');u.cooldown=1.1;assert.equal(R.dsFrame(u,s,0,false).index,2);
for(const [key,width,height] of [['dsIdle',2172,724],['dsAttack',1536,1024],['dsActions',1536,1024]])R.assets[key]={width,height,complete:true};
let calls=[];const ctx=new Proxy({drawImage:(...args)=>calls.push(args)},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
function draw(clock,reduced=false){calls=[];const before=JSON.stringify(s);R.draw(ctx,{state:s,definitions:E.definitions,layout:{}},{width:1120,height:650,visualTime:clock,reducedMotion:reduced,lang:'en'});assert.equal(JSON.stringify(s),before);return calls.find(a=>Object.values(R.assets).includes(a[0]));}
s.paused=true;for(const status of ['normal','rice']){u.status=status;u.statusRemaining=1.5;for(const cd of [1.1,.97,.85,.66]){u.cooldown=cd;const reference=draw(0);for(let i=0;i<10;i++)assert.deepEqual(draw(999),reference);assert.deepEqual(reference.slice(-2),[96,96]);}}
// Real 1.1s engine cadence exercises all action poses, without renderer state writes.
const combat=E.create();E.deploy(combat,0,0,'deepseek');E.start(combat);combat.nextSpawn=999;combat.enemies=[{id:'target',type:'armor',hp:99999,row:0,x:5,cooldown:0,slowUntil:0,mark:null}];const observed=new Set();for(let i=0;i<150;i++){E.step(combat,1/60);const before=JSON.stringify(combat),unit=combat.units[0];observed.add(R.dsFrame(unit,combat,combat.time,false).index);assert.equal(JSON.stringify(combat),before);}assert.deepEqual([...observed].sort(),[0,1,2,3,4,5]);E.retry(combat);assert.equal(combat.units[0].fired,0);assert.equal(R.dsFrame(combat.units[0],combat,0,false).sheet,'dsIdle');
console.log('DS: real cadence, reduced-motion release/rest, fixed viewport, rice transitions, terminal recovery, repeated redraw, pause and retry passed');

// Preparation intentionally blinks; battle idle ignores unrelated redraw wall clocks.
u.status='normal';u.fired=0;u.cooldown=0;s.paused=false;s.phase='prepare';s.time=0;
assert.equal(R.dsFrame(u,s,2.9,false).index,1);assert.equal(R.dsFrame(u,s,0,false).index,0);
s.phase='battle';s.time=2.9;assert.equal(R.dsFrame(u,s,0,false).index,1);assert.deepEqual(R.dsFrame(u,s,0,false),R.dsFrame(u,s,999,false));
s.paused=true;const pausedIdle=draw(0);assert.deepEqual(draw(999),pausedIdle);
s.paused=false;s.phase='won';assert.equal(R.dsFrame(u,s,2.9,false).index,1);
console.log('DS idle: preparation blink retained, battle simulation clock, exact paused crop, cosmetic terminal idle passed');
