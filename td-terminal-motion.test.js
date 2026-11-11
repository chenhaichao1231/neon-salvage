'use strict';
const assert=require('node:assert/strict'),R=require('./td-lanes-renderer'),UI=require('./td-lanes-ui'),E=require('./td-lanes');
for(const phase of ['won','lost'])for(const type of ['deepseek','gpt']){
 const interval=E.definitions.units[type].interval,fn=type==='deepseek'?R.dsFrame:R.gptFrame;
 const u={type,row:0,col:0,x:.5,status:'normal',fired:1,cooldown:interval};const s={phase,time:10,enemies:[{hp:1,row:0,x:5}],paused:false};
 const before=JSON.stringify({u,s});
 for(const [elapsed,index] of [[0,2],[.3,3],[.5,4],[.7,5],[.85,0],[5,0]])assert.equal(fn(u,s,0,false,interval,elapsed).index,index,`${phase} ${type} at ${elapsed}`);
 for(const elapsed of [.3,.6,5])assert.equal(fn(u,s,0,true,interval,elapsed).index,0);
 // A terminal wind-up cannot promise another shot, even when enemies remain on loss.
 u.cooldown=.1;assert.equal(fn(u,s,0,false,interval,0).index,0);
 // Already completed casts cannot retrigger, and never-fired units cannot release.
 u.cooldown=0;assert.equal(fn(u,s,0,false,interval,0).index,0);u.cooldown=interval;u.fired=0;assert.equal(fn(u,s,0,false,interval,.15).index,0);
 u.fired=1;if(type==='deepseek'){u.status='rice';u.statusRemaining=1.5;assert.deepEqual(fn(u,s,0,false,interval,0),fn(u,s,0,false,interval,99));u.status='normal';}else{u.status='weak';u.statusRemaining=2;assert.equal(fn(u,s,0,false,interval,.85).index,0);u.status='normal';delete u.statusRemaining;}
 if(type==='deepseek')delete u.statusRemaining;assert.equal(JSON.stringify({u,s}),before,'frame selection has no writes');
 s.phase='battle';assert.equal(fn(u,s,0,false,interval,99).index,2,'terminal tail ignored during battle');
}
const clock=UI.terminalClock(),s={phase:'prepare',paused:false,time:0};assert.equal(clock(s,100),0);s.phase='battle';assert.equal(clock(s,101),0);s.phase='won';assert.equal(clock(s,102),0);assert(Math.abs(clock(s,102.2)-.2)<1e-9);assert(Math.abs(clock(s,102.2)-.2)<1e-9);s.paused=true;assert(Math.abs(clock(s,200)-.2)<1e-9);s.paused=false;assert(Math.abs(clock(s,200.1)-.3)<1e-9);s.phase='prepare';assert.equal(clock(s,201),0);s.phase='lost';assert.equal(clock(s,202),0);assert.equal(clock({...s},203),0,'new state cannot inherit tail');
console.log('Terminal motion: DS/GPT release/recovery/rest, no terminal windup, rice/weak truth, no simulation writes, repeated renders, pause and retry reset passed');
// Integration: elapsed tail reaches actual draw crop, destination remains 96px, weak dimming stays.
for(const k of ['dsAttack','gptAttack'])R.assets[k]={width:1536,height:1024,complete:true};R.assets.dsIdle={width:2172,height:724,complete:true};
const renderState=E.create();renderState.phase='lost';renderState.units=[{id:'ds',type:'deepseek',row:0,col:0,x:.5,status:'rice',statusRemaining:1.5,fired:1,cooldown:1.1,hp:90},{id:'gpt',type:'gpt',row:1,col:0,x:.5,status:'weak',statusRemaining:2,fired:1,cooldown:1.4,hp:120}];R.assets.dsActions={width:1536,height:1024,complete:true};let draws=[];const ctx=new Proxy({drawImage:(...args)=>draws.push({args,alpha:ctx.globalAlpha})},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});const original=JSON.stringify(renderState);R.draw(ctx,{state:renderState,definitions:E.definitions,layout:{}},{width:1120,height:650,lang:'en',terminalElapsed:1,visualTime:2});assert.equal(JSON.stringify(renderState),original);const g=draws.find(d=>d.args[0]===R.assets.gptAttack),d=draws.find(d=>d.args[0]===R.assets.dsActions);assert.deepEqual(g.args.slice(1,5),[0,0,512,512]);assert.deepEqual(g.args.slice(-2),[96,96]);assert.equal(g.alpha,.7);assert.deepEqual(d.args.slice(1,5),[512,512,512,512]);
console.log('Terminal draw integration: settled GPT crop, unchanged weak alpha/rice pose and constant destination passed');
