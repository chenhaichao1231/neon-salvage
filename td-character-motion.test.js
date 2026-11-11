'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),E=require('./td-lanes'),R=require('./td-lanes-renderer'),UI=require('./td-lanes-ui');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const unit=(type)=>({id:type,type,row:0,col:0,x:.5,hp:E.definitions.units[type].hp,status:'normal',statusRemaining:0,fired:0,cooldown:0});
const state=()=>({phase:'battle',time:0,paused:false,enemies:[{id:'target',hp:99999,row:0,x:5}]});
function pose(u,s,clock=0,reduced=false,tail=0){return R[u.type==='gpt'?'gptFrame':'dsFrame'](u,s,clock,reduced,E.definitions.units[u.type].interval,tail);}
// Authored quiet poses, no idle magic, separate prepare clock and battle clock.
for(const type of ['deepseek','gpt']){const u=unit(type),s=state(),key=type==='gpt'?'gptIdle':'dsIdle',seen=new Set();for(let i=0;i<228;i++){s.time=i/60;const f=pose(u,s,999);assert.equal(f.sheet,key);seen.add(f.index);assert.equal(R.characterBreath(u,s,999,true,f),1);assert(Math.abs(R.characterBreath(u,s,999,false,f)-1)<=.01200001);}assert.deepEqual([...seen].sort(),[0,1,2]);s.paused=true;const f=pose(u,s,0),b=R.characterBreath(u,s,0,false,f);assert.deepEqual(pose(u,s,1000),f);assert.equal(R.characterBreath(u,s,1000,false,f),b);s.paused=false;s.phase='prepare';assert.notDeepEqual(pose(u,s,0),pose(u,s,1.6));}
// Every real-shot release/follow-through gets >=100ms at 2x, not just a blink.
for(const type of ['deepseek','gpt']){const u=unit(type),s=state(),interval=E.definitions.units[type].interval;u.fired=1;const spans=[];let previous=null;for(let i=0;i<48;i++){const age=i/60;u.cooldown=interval-age;const f=pose(u,s),id=f.sheet+':'+f.index;if(id===previous)spans[spans.length-1].frames++;else spans.push({id,frames:1});previous=id;assert.equal(R.characterBreath(u,s,0,false,f),1,'casts are not stretched');}for(const part of spans.slice(0,3))assert(part.frames/60/2>=.1-1e-9,`${type} ${part.id} held at 2x`);u.cooldown=.2;assert.equal(pose(u,s).index,1);s.enemies=[];assert.equal(pose(u,s).sheet,type==='gpt'?'gptIdle':'dsIdle','vanished target cancels anticipation');u.cooldown=interval-.3;assert.equal(pose(u,s).index,3,'vanished target cannot cancel a fired follow-through');for(const phase of ['won','lost']){s.phase=phase;assert.equal(pose(u,s,0,false,.6).sheet,type==='gpt'?'gptIdle':'dsIdle');u.cooldown=.2;assert.equal(pose(u,s).sheet,type==='gpt'?'gptIdle':'dsIdle');u.cooldown=interval-.3;}u.fired=0;u.cooldown=interval;assert.equal(pose(u,s).sheet,type==='gpt'?'gptIdle':'dsIdle','never-fired cannot fake a release');}
assert.deepEqual([2,1.7,1.3,1, .6,.1].map(R.riceIndex),[3,4,5,3,4,5]);
// Engine paired runs: speed changes only presentation sampling; status entry/exit,
// events, targeting, damage and all other state stay identical after rendering.
let pairedTicks=0,riceEntries=0,riceExits=0;
for(const speed of [1,2]){const a=E.create(1);E.deploy(a,0,0,'deepseek');E.deploy(a,2,0,'gpt');E.start(a);a.nextSpawn=999;a.enemies=[0,2].map((row,i)=>({id:'e'+i,type:'armor',row,x:7,hp:99999,cooldown:0,slowUntil:0,mark:null}));const b=structuredClone(a),ctx=new Proxy({}, {get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});for(let i=0;i<960/speed;i++){const events=E.step(a,speed/30),control=E.step(b,speed/30);assert.deepEqual(events,control);for(const ev of events){if(ev.type==='status-change'&&ev.unitId===a.units[0]?.id){if(ev.status==='rice')riceEntries++;if(ev.status==='normal')riceExits++;}if(ev.type==='shot'){const u=a.units.find(x=>x.id===ev.source);if(u)assert.equal(pose(u,a).index,2,'actual engine shot selects release on its own tick');}}
 R.draw(ctx,{state:a,definitions:E.definitions,layout:{}},{width:740,height:400,lang:'en',visualTime:999+i});assert.deepEqual(a,b);pairedTicks++;if(i===50){E.pause(a,true);E.pause(b,true);const frozen=structuredClone(a);for(let j=0;j<8;j++){E.step(a,speed/30);R.draw(ctx,{state:a,definitions:E.definitions,layout:{}},{width:740,height:400,lang:'en',visualTime:2000+j});assert.deepEqual(a,frozen);}E.pause(a,false);E.pause(b,false);}}
 E.retry(a);assert(a.units.every(u=>u.fired===0));assert(a.units.every(u=>pose(u,a).sheet===(u.type==='gpt'?'gptIdle':'dsIdle')));}
assert.equal(riceEntries,2);assert.equal(riceExits,2);
async function pixels(){for(const key of Object.keys(R.files))R.assets[key]=await loadImage(path.join(__dirname,R.files[key]));
 const idle=R.assets.gptIdle;assert.equal(idle.width,2172);assert.equal(idle.height,724);const c=createCanvas(idle.width,idle.height),ctx=c.getContext('2d');ctx.drawImage(idle,0,0);const rgba=ctx.getImageData(0,0,c.width,c.height).data;let transparent=0;for(let i=3;i<rgba.length;i+=4)if(rgba[i]===0)transparent++;assert(transparent>rgba.length/4*.5,'new idle preserves true transparent background');for(let frame=0;frame<3;frame++)for(const x of [frame*724,frame*724+723])for(let y=0;y<724;y++)assert(rgba[(y*2172+x)*4+3]<=1,'no visible character alpha may bleed across a frame boundary');
 // Render all actual board scales. Whole-pixel equality tests include breath transforms,
 // source crop, terminal tail, status overlays and weak alpha, not only frame objects.
 for(const [width,height]of [[1120,650],[740,400],[1120,300]])for(const type of ['deepseek','gpt'])for(const status of ['normal',type==='gpt'?'weak':'rice'])for(const reducedMotion of [false,true]){const s=E.create();s.phase='battle';s.time=27.4;s.paused=true;const u=unit(type);Object.assign(u,{status,statusRemaining:1.5,fired:1,cooldown:.5});s.units=[u];const draw=(clock)=>{const c=createCanvas(width,height),before=JSON.stringify(s);R.draw(c.getContext('2d'),{state:s,definitions:E.definitions,layout:{}},{width,height,lang:'en',visualTime:clock,reducedMotion});assert.equal(JSON.stringify(s),before);return c.toBuffer('image/png');};assert.deepEqual(draw(0),draw(9000),'paused pixels do not advance with wall time');}
 // No idle-sheet failure can fabricate a cast; a DS broad-cast failure uses the existing
 // correct release/charge frame rather than disappearing or inventing another shot.
 const oldIdle=R.assets.gptIdle;R.assets.gptIdle={width:0,height:0,complete:true};assert.deepEqual(R.availableCharacterFrame({sheet:'gptIdle',cols:3,rows:1,index:2}),{sheet:'gptAttack',cols:3,rows:2,index:0});R.assets.gptIdle=oldIdle;const ds=R.assets.dsActions;R.assets.dsActions={width:0,height:0,complete:true};for(const index of [1,2])assert.deepEqual(R.availableCharacterFrame({sheet:'dsActions',cols:3,rows:2,index}),{sheet:'dsAttack',cols:3,rows:2,index});R.assets.dsActions=ds;
 // Exact-byte expectations verified against every root PNG in baseline 60f3108.
 // Self-contained in source exports/shallow clones: no Git executable or history needed.
 const originalArtSha256={
  "td-ai-sprites.png": "2106aababd8691ec7acd4ed9972a470d367d6ffc2579c2081fd3e5d0a33232be",
  "td-armor-actions.png": "46ab4d0e8cf90089d9bab126da3dcc6e7ceb5bc1edca76de27542327c27c7c38",
  "td-campus-background.png": "d2e7e53e338bdd292e1860db82af7bb492dc279f25572778b0159a861b5f3591",
  "td-ds-actions.png": "627f0d4dc71d3753658fd03be044791eb5a0c3df6443dd8dd7281128abe6fc09",
  "td-ds-attack.png": "fda8e2c3a011a1b580a65fa81a560daa9fea93c6e7b2c16f96ebe8ed5507981e",
  "td-ds-idle.png": "cd94cb84a46ad12114958a18a677da5df580cdcd255bc49f45088d5989f6775c",
  "td-enemies.png": "c93386d8c5aa1b774d41b3d8e9ad16226ae402b96f3340f9afe126a92e950b30",
  "td-fragment-actions.png": "313994b7c89e6f515795df7f04118c70ac2ae7a43e49e964cd043c9b25095bd1",
  "td-gpt-attack.png": "47c35b21c05be4178751957006843737bc7743032c4fc065e36104c90b57985b",
  "td-gpu.png": "ba3e5ee697fd57e1a8760ef30914876f3fa2050e24d780dca5ba8bff7ef53e0f",
  "td-suppliers.png": "168f175170ef5830264f43e8be8f5bdfe88f25b7691ee046f71e3d66d8adb30b"
};
 assert.equal(Object.keys(originalArtSha256).length,11);
 for(const [file,expected] of Object.entries(originalArtSha256))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,file))).digest('hex'),expected,file+' must preserve its original bytes');
 console.log(`PASS character motion: ${pairedTicks} paired 1x/2x ticks, natural rice entry/exit, authored idle, readable holds, exact paused pixels at 3 scales, terminal recovery, fallback, alpha/frame boundaries, unchanged source art.`);}
pixels().catch(e=>{console.error(e);process.exitCode=1;});
