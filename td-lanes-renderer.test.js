'use strict';
const assert=require('node:assert/strict'),E=require('./td-lanes'),R=require('./td-lanes-renderer');
for(const k of Object.keys(R.files))R.assets[k]={width:1600,height:900,complete:true};
let images=0;const numeric=new Set(['translate','scale','fillRect','strokeRect','ellipse','roundRect','moveTo','lineTo','arc']);const ctx=new Proxy({},{get:(o,k)=>o[k]||((...args)=>{if(k==='drawImage'){images++;args.slice(1).forEach(x=>assert(Number.isFinite(x),'finite sprite coordinate'));}if(numeric.has(k))args.filter(x=>typeof x==='number').forEach(x=>assert(Number.isFinite(x),'finite '+k));}),set:(o,k,v)=>(o[k]=v,true)});
for(const reducedMotion of [false,true])for(const lang of ['zh','en']){const s=E.create();E.deploy(s,0,0,'deepseek');E.deploy(s,1,1,'gpt');E.start(s);for(let i=0;i<12;i++)E.step(s,1);for(const status of ['normal','rice','weak']){s.units[0].status=status;const before=JSON.stringify(s);R.draw(ctx,{state:s,definitions:E.definitions,layout:{}},{width:1120,height:650,lang,reducedMotion});assert.equal(JSON.stringify(s),before,'render is read-only');}}
assert(images>0);console.log('Renderer: active/reduced motion, both languages, all poses, finite coordinates and read-only state passed');
const ds={row:0,col:0,x:.5,status:'normal',fired:0,cooldown:0},state={enemies:[]};
assert.equal(R.dsFrame(ds,state,0,false).index,0);
assert.equal(R.dsFrame(ds,state,2.9,false).index,1);
assert.equal(R.dsFrame(ds,state,3.2,false).index,2);
assert.equal(R.dsFrame(ds,state,3.2,true).index,0);
ds.status='rice';for(const [remaining,index] of [[2,3],[1.75,4],[1.5,5]]){ds.statusRemaining=remaining;assert.equal(R.dsFrame(ds,state,0,false).index,index);}
ds.status='normal';ds.fired=1;state.enemies=[{hp:10,row:0,x:5}];ds.cooldown=1.05;assert.equal(R.dsFrame(ds,state,0,false).index,2);ds.cooldown=.85;assert.equal(R.dsFrame(ds,state,0,false).index,4);
console.log('DS idle blink/turn, attack and three rice poses follow visible combat states');

state.enemies=[];ds.cooldown=1.05;assert.equal(R.dsFrame(ds,state,0,false).index,2,'last kill does not truncate cast');ds.cooldown=.85;assert.equal(R.dsFrame(ds,state,0,false).index,4,'last kill keeps recovery');ds.cooldown=.1;assert.equal(R.dsFrame(ds,state,0,false).sheet,'dsIdle','no windup without target');

for(const reduced of [false,true])for(const type of ['shot','hit','kill','unit-hit','unit-lost','leak']){const fx=[{type,row:2,x:3,born:1,life:.7,variant:2}];const before=JSON.stringify(fx);R.drawEffects(ctx,fx,1.3,reduced);assert.equal(JSON.stringify(fx),before);}
console.log('Cosmetic hit/death/shield feedback uses finite coordinates without mutating events');
const groupState=E.create();groupState.enemies=[{id:'a',row:1,x:5,type:'swarm',hp:10},{id:'b',row:1,x:5.1,type:'swarm',hp:10},{id:'c',row:1,x:5.2,type:'swarm',hp:10},{id:'d',row:2,x:5,type:'swarm',hp:10}];const labels=[];ctx.fillText=(v)=>labels.push(v);R.draw(ctx,{state:groupState,definitions:E.definitions,layout:{}},{width:1120,height:650,lang:'zh',reducedMotion:true});assert.equal(labels.filter(v=>v==='×3').length,1);assert(!labels.includes('×4'));console.log('Overlap badge counts live enemies in the same lane, not nearby other lanes');
