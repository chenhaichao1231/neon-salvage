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

const gpt={type:'gpt',row:0,col:0,x:.5,hp:120,status:'normal',statusRemaining:0,fired:0,cooldown:0};
const gs={enemies:[{hp:20,row:0,x:4}],paused:false};
assert.equal(E.definitions.units.gpt.interval,1.4,'GPT animation interval agrees with engine');
assert.equal(R.gptFrame(gpt,gs,0,false).index,0,'unfired unit is not falsely releasing');
gpt.fired=1;
for(const [cooldown,index] of [[1.4,2],[1.35,2],[1.25,3],[1.05,4],[.9,5],[.7,0],[.2,1]]){
 gpt.cooldown=cooldown;assert.equal(R.gptFrame(gpt,gs,0,false).index,index,'GPT frame at cooldown '+cooldown);
}
// No target must suppress anticipation, but cannot truncate an already emitted shot.
for(const enemies of [[],[{hp:0,row:0,x:4}],[{hp:10,row:1,x:4}],[{hp:10,row:0,x:-1}]]){
 gs.enemies=enemies;gpt.cooldown=.2;assert.equal(R.gptFrame(gpt,gs,0,false).index,0);
 gpt.cooldown=1.25;assert.equal(R.gptFrame(gpt,gs,0,false).index,3);
 gpt.cooldown=1.05;assert.equal(R.gptFrame(gpt,gs,0,false).index,4);
}
gs.enemies=[{hp:20,row:0,x:4}];gs.paused=true;gpt.cooldown=1.05;
const freeze=JSON.stringify({gpt,gs});assert.deepEqual(R.gptFrame(gpt,gs,0,false),R.gptFrame(gpt,gs,999,false),'paused cooldown keeps same pose despite wall-clock change');assert.equal(JSON.stringify({gpt,gs}),freeze);
for(const [cooldown,index] of [[1.4,3],[1.25,3],[1.05,0],[.2,0]]){gpt.cooldown=cooldown;assert.equal(R.gptFrame(gpt,gs,0,true).index,index,'reduced motion uses one release pose, not six-frame cycle');}
gpt.status='weak';gpt.statusRemaining=2;gpt.cooldown=.7;assert.equal(R.gptFrame(gpt,gs,0,false).index,0,'weak resting retains same model scale');gpt.cooldown=1.25;assert.equal(R.gptFrame(gpt,gs,0,false).index,3,'weak does not suppress real shots');
// Assert actual source rectangles, constant destination scale and explicit weak label.
R.assets.gptAttack={width:1536,height:1024,complete:true};const frameCalls=[],weakText=[];
const frameCtx=new Proxy({drawImage:(...a)=>frameCalls.push({args:a,alpha:frameCtx.globalAlpha}),fillText:t=>weakText.push(t)},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
const renderState=E.create();renderState.units=[gpt];renderState.enemies=[];
function renderGpt(time=0,reducedMotion=false){frameCalls.length=0;weakText.length=0;const before=JSON.stringify(renderState);R.draw(frameCtx,{state:renderState,definitions:E.definitions,layout:{}},{width:1120,height:650,lang:'en',reducedMotion,visualTime:time});assert.equal(JSON.stringify(renderState),before);return frameCalls.filter(c=>c.args[0]===R.assets.gptAttack);}
let rendered=renderGpt();assert.equal(rendered.length,1);assert.deepEqual(rendered[0].args.slice(1,5),[0,512,512,512]);assert.deepEqual(rendered[0].args.slice(7),[96,96]);assert.equal(rendered[0].alpha,.7);assert(weakText.includes('Brain fog 2s'));
gpt.cooldown=.7;rendered=renderGpt();assert.equal(rendered.length,1);assert.equal(rendered[0].alpha,.7);assert(weakText.includes('Brain fog 2s'));assert(!frameCalls.some(c=>c.args[0]===R.assets.ai),'weak idle avoids swapping to a differently proportioned legacy crop');
gpt.status='normal';renderState.paused=true;gpt.cooldown=1.05;const frozenCrop=renderGpt(0)[0].args.slice(1);assert.deepEqual(renderGpt(999)[0].args.slice(1),frozenCrop,'paused actual draw remains on same cropped frame');
// Follow a real first shot and a later cooldown; the renderer never invents shot timing.
const combat=E.create();E.deploy(combat,0,0,'gpt');E.start(combat);combat.nextSpawn=999;combat.enemies=[{id:'target',type:'armor',hp:9999,row:0,x:5,cooldown:0,slowUntil:0,mark:null}];const observed=new Set();
for(let i=0;i<140;i++){E.step(combat,1/60);const unit=combat.units[0];observed.add(R.gptFrame(unit,combat,combat.time,false).index);if(unit.cooldown>1.35&&unit.fired>0)assert.equal(R.gptFrame(unit,combat,combat.time,false).index,2,'release matches actual engine shot');}
assert.deepEqual([...observed].sort(),[0,1,2,3,4,5],'actual 1.4s cadence exercises all six poses');
console.log('GPT frames passed: real 1.4s cooldown, last-target recovery, weak distinction, fixed-size drawImage cropping, reduced motion, pause and read-only rendering');

// Fragment poses are derived from simulation time and actual per-enemy events only.
const bat={id:'e11',type:'swarm',row:0,x:1,hp:22,cooldown:0},batState={time:10,paused:false};
const wingFrames=new Set();for(let i=0;i<16;i++){batState.time=10+i/32;wingFrames.add(R.fragmentFrame(bat,batState).index);}assert.deepEqual([...wingFrames].sort(),[0,1,2]);
batState.time=10;const phases=new Set(Array.from({length:6},(_,i)=>R.fragmentFrame({...bat,id:'e'+(11+i)},batState).index));assert(phases.size>1,'different IDs are not all synchronized');
for(const time of [10,10.1,10.5,11]){batState.time=time;assert.equal(R.fragmentFrame(bat,batState,[{type:'hit',target:bat.id,amount:5,time}],true).index,1,'reduced motion keeps one static wing pose');}
batState.time=10;const hit=[{type:'hit',target:'e11',amount:5,time:10,born:999,life:.28}];assert.equal(R.fragmentFrame(bat,batState,hit).index,4,'real hit closes eye, ignoring unrelated visual clock');
batState.time=10.18;assert.equal(R.fragmentFrame(bat,batState,hit).index,5,'hit recovery is short');
batState.time=10.3;assert.deepEqual(R.fragmentFrame(bat,batState,hit),R.fragmentFrame(bat,batState,[]),'old events cannot restart hit reactions');assert.deepEqual(R.fragmentFrame(bat,batState,[...hit,...hit]),R.fragmentFrame(bat,batState,[]),'duplicate old event is not a new hit');
for(const event of [{type:'hit',target:'other',amount:5,time:10.3},{type:'hit',target:bat.id,amount:0,time:10.3},{type:'hit',target:bat.id,amount:5,time:11},{type:'hit',target:bat.id,amount:5,born:10.3},{type:'shot',target:bat.id,amount:5,time:10.3}])assert.deepEqual(R.fragmentFrame(bat,batState,[event]),R.fragmentFrame(bat,batState,[]),'ignore fake/unrelated/future hit');
const contact=[{type:'unit-hit',source:bat.id,target:'defender',amount:7,time:10.3}];assert.equal(R.fragmentFrame(bat,batState,contact).index,3,'contact attack event makes a real lunge');batState.time=10.46;assert.equal(R.fragmentFrame(bat,batState,contact).index,5);batState.time=10.6;assert.deepEqual(R.fragmentFrame(bat,batState,contact),R.fragmentFrame(bat,batState));
batState.paused=true;const stateBefore=JSON.stringify({bat,batState,hit,contact});for(let i=0;i<50;i++)R.fragmentFrame(bat,batState,hit);assert.equal(JSON.stringify({bat,batState,hit,contact}),stateBefore,'pose selection has no caches or simulation writes');
// Real draw calls preserve 49px size; do not normalize each wing frame by its bounds.
R.assets.fragmentActions={width:1536,height:1024,complete:true};const drawBatState=E.create();drawBatState.time=10;drawBatState.enemies=[bat];drawBatState.paused=true;
function renderBat(clock,effects=[],reducedMotion=false){frameCalls.length=0;const before=JSON.stringify({s:drawBatState,effects});R.draw(frameCtx,{state:drawBatState,definitions:E.definitions,layout:{}},{width:1120,height:650,lang:'en',visualTime:clock,effects,reducedMotion});assert.equal(JSON.stringify({s:drawBatState,effects}),before);return frameCalls.find(c=>c.args[0]===R.assets.fragmentActions).args.slice(1);}
const batPose=renderBat(0);assert.deepEqual(renderBat(100),batPose,'pause freezes wing pose and body anchor despite external visual clock');assert.deepEqual(batPose.slice(-2),[49,49]);assert.deepEqual(renderBat(0,hit).slice(0,4),[512,512,512,512]);assert.deepEqual(renderBat(0,hit).slice(4),batPose.slice(4),'hit never changes image scale or body drawing anchor');assert.deepEqual(renderBat(0,hit,true).slice(0,4),[512,0,512,512]);
// The real engine emits the IDs/time expected by the read-only renderer.
const contactCombat=E.create();E.deploy(contactCombat,0,0,'deepseek');E.start(contactCombat);contactCombat.nextSpawn=999;contactCombat.units[0].cooldown=99;contactCombat.enemies=[{...bat,id:'contact-bat',x:.75,hp:22,cooldown:0,slowUntil:0,mark:null}];
let contactEvents=E.step(contactCombat,1/60);assert(contactEvents.some(e=>e.type==='unit-hit'&&e.source==='contact-bat'));assert.equal(R.fragmentFrame(contactCombat.enemies[0],contactCombat,contactEvents).index,3);
contactCombat.shots=[{id:'test-shot',source:contactCombat.units[0].id,type:'deepseek',damageScale:.1,row:0,x:.6,left:1,hits:[]}];let hitEvents=E.step(contactCombat,1/60);assert(hitEvents.some(e=>e.type==='hit'&&e.target==='contact-bat'));assert.equal(R.fragmentFrame(contactCombat.enemies[0],contactCombat,hitEvents).index,4);
for(let i=0;i<20;i++)E.step(contactCombat,1/60);assert.deepEqual(R.fragmentFrame(contactCombat.enemies[0],contactCombat,hitEvents),R.fragmentFrame(contactCombat.enemies[0],contactCombat,[]));
console.log('Fragment frames passed: ID-offset simulated wingbeats, real contact/hit IDs and timestamps, no false retrigger, static reduced motion, paused fixed 49px draw and read-only state');

const detourState=E.create(3);E.deploy(detourState,1,5,'deepseek');const detourText=[],ranges=[];
const detourCtx=new Proxy({fillText:t=>detourText.push(t),strokeRect:(...v)=>ranges.push(v)},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
const detourBefore=JSON.stringify(detourState);R.drawDetours(detourCtx,detourState,E.preview(3),'en');assert.equal(JSON.stringify(detourState),detourBefore);assert(ranges.some(r=>r[2]===240),'two-cell range has 240 design pixels');assert(detourText.some(t=>t.includes('lane 3')));
detourState.phase='running';detourState.enemies=[{row:1,x:6,toRow:2,turnState:'waiting',turnRemaining:1.25}];detourText.length=0;R.drawDetours(detourCtx,detourState,[],'zh');assert(detourText.includes('1.3s · → 第3行'));detourState.enemies[0].turnState='done';detourText.length=0;R.drawDetours(detourCtx,detourState,[],'en');assert.equal(detourText.length,0,'completed turn cannot falsely promise a second turn');
console.log('Detour telegraphs show two-cell range, fixed lane, live countdown and no second turn');
detourState.enemies=[];detourState.phase='lost';detourState.core=4;detourState.failureReason='challenge-leak';detourText.length=0;R.draw(detourCtx,{state:detourState,definitions:E.definitions,layout:{},preview:E.preview(3)},{width:1120,height:650,lang:'en',reducedMotion:true});assert(detourText.includes('CHALLENGE INCOMPLETE'));assert(!detourText.includes('CORE LOST'));
