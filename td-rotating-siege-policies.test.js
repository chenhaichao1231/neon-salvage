'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const E=require('./td-lanes-content'),UI=require('./td-lanes-ui');
const copy=x=>JSON.parse(JSON.stringify(x));
const digest=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
// Frozen bounded audit, not optimal play or human acceptance. All losing runs stay.
// Policy code retains the original legal action rules and timings verbatim.
// Expected digests originate from archived pre-integration traces, not this run.
// The archived level ID is already raw8: identity mapping 8 -> 8. No rewritten
// state fields, float tolerance, accumulator normalization, or fixture injection.
// Every 60Hz state + emitted event list is covered by outcome.trajectoryHash;
// full action before/after states, observations and sampled frames are also exact.
// This standalone suite uses production public actions and needs no private files.
const LEVEL=8,revision='r2';
const POLICIES=['cheapPairs','forecastBolts','pierceReserve','selectiveHeavy','heavyOpening','familiarBroad'];
assert.equal(E.levels.length,9);
assert.equal(digest(E.levels[LEVEL]),'fb9a556b248f69df3f94787e7903d7b746f3107a45ef8ef6cba3bfabe84486d7');
const baseline=JSON.stringify(E.levels.slice(0,LEVEL)),contentBefore=JSON.stringify(E.levels);
function makeController(seed){
 const data=new Map([[UI.bookmarkKey,JSON.stringify({version:1,lastStage:8,highestStage:8,lang:'en'})]]);
 const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 return UI.controller({...E,create:(level,options)=>E.create(level,options||{seed})},storage);
}
function controllerAction(c,kind,args){
 if(kind==='deploy'){assert(c.select(args[2]).ok);return c.cell(args[0],args[1]);}
 if(kind==='pause'){assert.notEqual(c.state.paused,args[0]);return c.pause();}
 if(kind==='emergencyWithdraw'){const u=c.state.units.find(u=>u.id===args[0]);assert(u);assert(c.cell(u.row,u.col).ok);return c.refund();}
 if(kind==='start')return c.start();
 throw Error('Unexpected action '+kind);
}
function simulate({policy,seed=1,delay=0,controller=null}={}){
 assert(POLICIES.includes(policy));
 const c=controller||makeController(seed); const s=c.state; seed=s.seed; const actions=[],events=[],frames=[],observations=[],hash=crypto.createHash('sha256');
 const origin=copy(s),schedule=E.preview(LEVEL);let lastSpawnFrame=null,peakLive=0,emptyAfterFirst=0;
 const remaining=row=>s.enemies.some(e=>e.row===row)||schedule.slice(s.nextSpawn).some(e=>e.row===row);
 const idle=()=>s.units.filter(u=>!remaining(u.row)).sort((a,b)=>E.definitions.units[a.type].cost-E.definitions.units[b.type].cost||a.row-b.row||a.col-b.col);
 const observe=(kind,extra={})=>observations.push({kind,tick:s.tick,time:s.time,compute:s.compute,units:copy(s.units),enemies:copy(s.enemies),forecast:schedule.slice(s.nextSpawn),...extra});
 const act=(kind,args,reason)=>{const before=copy(s),result=controllerAction(c,kind,args);actions.push({tick:s.tick,time:s.time,kind,args,reason,result,before,after:copy(s)});assert(result.ok,JSON.stringify(actions.at(-1)));return result;};
 const paid=(kind,args,reason)=>{const live=s.phase==='battle';if(live){act('pause',[true],'ordinary paid decision');const frozen=JSON.stringify(s);assert.deepEqual(copy(c.tick(1)),[]);assert.equal(JSON.stringify(s),frozen);}const result=act(kind,args,reason);if(live)act('pause',[false],'resume');return result;};
 const buy=(r,c,t,why)=>{const existing=s.phase==='prepare'&&s.units.find(u=>u.row===r&&u.col===c);if(existing){assert.equal(existing.type,t);return {ok:true};}return paid('deploy',[r,c,t],why);};
 const queue=[];const plan=(time,row,col,type,reason)=>queue.push({due:time+delay,next:time+delay,row,col,type,reason});
 if(['cheapPairs','reinforcedBolts','reserveBolts','forecastBolts'].includes(policy)){
  [1,2,3].forEach(r=>buy(r,0,'deepseek','efficient middle-lane coverage'));
  plan(10,1,1,'deepseek','support first armor train');plan(22,3,1,'deepseek','support opening crowd before later armor');plan(28,2,1,'deepseek','support second armor train');
  if(policy==='reinforcedBolts'){plan(40,1,2,'deepseek','reserve for first role reversal');plan(52,3,2,'deepseek','reserve for last armor train');plan(64,2,2,'deepseek','reserve for last crowd');}
 }else if(policy==='heavyOpening'){
  buy(1,0,'claude','specialize in first armor train');plan(10,3,0,'grok','specialize in opening crowd');plan(22,2,0,'deepseek','cover second armor lane');plan(34,2,1,'deepseek','reinforce second armor lane');plan(46,1,1,'grok','support early heavy guard after role reversal');plan(64,3,1,'claude','later heavy relief; only idle refund if needed');
 }else if(policy==='heavyRelief'||policy==='selectiveHeavy'){
  buy(3,0,'grok','opening compact crowd');[1,2].forEach(r=>buy(r,0,'deepseek','early cheap armor coverage'));
  plan(16,1,1,'deepseek','support first armor train');plan(28,2,1,'deepseek','support second armor train');
  if(policy==='heavyRelief'){plan(46,1,2,'grok','first role reversal crowd relief');plan(64,3,1,'claude','late armor relief behind opening splash');}
  else plan(52,3,1,'claude','reserve for visible/forecast armor behind opening splash');
 }else if(policy==='pierceRelief'||policy==='pierceReserve'){
  buy(1,0,'gpt','pierce armor train');buy(3,0,'grok','opening crowd');plan(16,2,0,'deepseek','cover center armor');plan(34,2,1,'gpt','center piercing before crowd');
  if(policy==='pierceRelief'){plan(52,1,1,'grok','first role reversal crowd relief');plan(64,3,1,'deepseek','support final armor');}
  else plan(40,3,1,'deepseek','reserve cheap support when opening crowd lane changes to armor');
 }else if(policy==='familiarBroad'){
  [0,1,2].forEach(r=>buy(r,0,'deepseek','fixed current broad opening'));
  plan(10,3,0,'deepseek','fixed lane4 coverage');plan(22,4,0,'deepseek','fixed lane5 coverage');plan(28,0,1,'deepseek','fixed first mixed-packet reinforcement');plan(40,2,1,'deepseek','fixed center reinforcement');plan(52,4,1,'deepseek','fixed third-packet reinforcement');
 }
 const prepared=copy(s);act('start',[],'start');let nextRescue=28+delay,nextReserve=40+delay;
 const refundForRecovery=t=>{if(s.stats.emergencyCount)return false;const candidates=idle();let u=candidates.find(u=>s.compute+E.definitions.units[u.type].cost/2>=50)||[...candidates].sort((a,b)=>E.definitions.units[b.type].cost-E.definitions.units[a.type].cost)[0];if(!u)u=t.us.filter(u=>u.hp<=36&&s.compute+E.definitions.units[u.type].cost/2>=50).sort((a,b)=>a.hp-b.hp)[0];if(!u)return false;paid('emergencyWithdraw',[u.id],!remaining(u.row)?'ordinary recovery: exhausted lane refund':'ordinary recovery: endangered guard replacement');return true;};
 function rescue(){
  const threats=Array.from({length:5},(_,row)=>{const es=s.enemies.filter(e=>e.row===row&&e.x<3),us=s.units.filter(u=>u.row===row);return {row,es,us,hp:us.length?Math.min(...us.map(u=>u.hp)):0,x:es.length?Math.min(...es.map(e=>e.x)):99};}).filter(r=>r.es.length&&(r.us.length<2||r.hp<=45)).sort((a,b)=>(a.us.length>0)-(b.us.length>0)||a.hp-b.hp||a.x-b.x||a.row-b.row);
  observe('recovery-check',{threats});const t=threats[0];if(!t)return;
  if(s.compute<50)refundForRecovery(t);
  const c=Array.from({length:7},(_,i)=>i).find(c=>!s.units.some(u=>u.row===t.row&&u.col===c));
  if(c!==undefined&&s.compute>=50)buy(t.row,c,'deepseek','ordinary visible threat recovery');else observe('recovery-shortage',{row:t.row,col:c});
 }
 while(s.phase==='battle'&&s.tick<60*180){
  const emitted=c.tick(1/60);events.push(...emitted.map(event=>({tick:s.tick,...event})));peakLive=Math.max(peakLive,s.enemies.length);
  if(s.nextSpawn>0&&s.nextSpawn<schedule.length&&!s.enemies.length)emptyAfterFirst++;
  if(!lastSpawnFrame&&s.nextSpawn===schedule.length)lastSpawnFrame=copy(s);
  hash.update(JSON.stringify({state:s,events:emitted}));
  if(s.tick%60===0)frames.push(copy(s));
  if(s.phase!=='battle')break;
  for(let i=0;i<queue.length;){const a=queue[i];if(a.next>s.time+1e-9){i++;continue;}
   observe('scheduled-check',{plan:copy(a)});const existing=s.units.find(u=>u.row===a.row&&u.col===a.col),cost=E.definitions.units[a.type].cost;
   if(((policy==='selectiveHeavy'&&a.type==='claude')||(policy==='pierceReserve'&&a.due===40+delay))&&!s.enemies.some(e=>e.row===a.row&&e.type==='armor')&&!schedule.slice(s.nextSpawn).some(e=>e.row===a.row&&e.type==='armor')){observe('scheduled-no-armor-needed',{plan:copy(a)});queue.splice(i,1);continue;}
   if(existing){observe('scheduled-slot-filled',{plan:copy(a),existing:copy(existing)});queue.splice(i,1);continue;}
   if(policy==='heavyOpening'&&a.type==='claude'&&s.time>=64+delay&&s.compute<cost&&!s.stats.emergencyCount){const u=idle().find(u=>s.compute+E.definitions.units[u.type].cost/2>=cost);if(u)paid('emergencyWithdraw',[u.id],'optional genuinely idle refund for planned heavy relief');}
   if(s.compute>=cost){buy(a.row,a.col,a.type,a.reason);queue.splice(i,1);}
   else{observe('scheduled-defer',{plan:copy(a),cost});a.next=s.time+6;i++;}
  }
  if(['reserveBolts','forecastBolts'].includes(policy)&&s.time>=nextReserve-1e-9){
   const threats=Array.from({length:5},(_,row)=>({row,us:s.units.filter(u=>u.row===row),es:s.enemies.filter(e=>e.row===row)})).map(t=>({...t,x:Math.min(...t.es.map(e=>e.x))})).filter(t=>t.us.length===2&&t.es.length>=6&&(policy==='forecastBolts'||t.x<4.5)).sort((a,b)=>a.x-b.x||b.es.length-a.es.length||a.row-b.row);
   observe('reserve-check',{threats});const t=threats[0];if(t&&s.compute>=50){const c=Array.from({length:7},(_,i)=>i).find(c=>!s.units.some(u=>u.row===t.row&&u.col===c));buy(t.row,c,'deepseek','reserve reinforcement for visible large approaching group');}nextReserve+=6;
  }
  if(s.time>=nextRescue-1e-9){rescue();nextRescue+=6;}
 }
 const fullEvents=events,shots=new Map(),hitTotals={};for(const e of fullEvents.filter(e=>e.type==='hit')){const group=shots.get(e.shotId)||[];group.push(e);shots.set(e.shotId,group);const k=e.unitType+'→'+e.enemyType;hitTotals[k]=(hitTotals[k]||0)+e.amount;}
 const gross=origin.units.reduce((n,u)=>n+E.definitions.units[u.type].cost,0)+actions.filter(a=>a.kind==='deploy').reduce((n,a)=>n+E.definitions.units[a.args[2]].cost,0),lastArrival=schedule.at(-1).time,tail=fullEvents.filter(e=>e.time>lastArrival);
 const outcome={policy,seed,delay,phase:s.phase,time:s.time,core:s.core,kills:s.stats.kills,leaks:s.stats.leaks,unitsLost:s.stats.unitsLost,gross,refund:s.stats.emergencyRefunds,balance:s.compute,earned:s.stats.earned,guardDamage:fullEvents.filter(e=>e.type==='unit-hit').reduce((n,e)=>n+e.amount,0),withdrawal:s.stats.emergencyWithdrawal,lastArrival,cleanup:s.time-lastArrival,peakLive,emptySeconds:emptyAfterFirst/60,unfulfilled:queue,actualTargetDamage:hitTotals,multitarget:{gpt:[...shots.values()].filter(g=>g[0].unitType==='gpt'&&new Set(g.map(e=>e.target)).size>=2).length,grok:[...shots.values()].filter(g=>g[0].unitType==='grok'&&new Set(g.map(e=>e.target)).size>=2).length},tail:{initialEnemies:lastSpawnFrame?.enemies,lastEvents:tail.filter(e=>['kill','leak','unit-hit','unit-lost'].includes(e.type)),hitCount:tail.filter(e=>e.type==='hit').length,guardDamage:tail.filter(e=>e.type==='unit-hit').reduce((n,e)=>n+e.amount,0),paidActions:actions.filter(a=>a.time>lastArrival&&['deploy','emergencyWithdraw'].includes(a.kind)).map(a=>({time:a.time,kind:a.kind,args:a.args,reason:a.reason})),lastEnemy:fullEvents.filter(e=>['kill','leak'].includes(e.type)).at(-1)},trajectoryHash:hash.digest('hex')};
 assert.equal(s.compute,180+s.stats.earned+s.stats.emergencyRefunds-gross);assert(s.stats.emergencyCount<=1);assert.equal(JSON.stringify(E.levels.slice(0,LEVEL)),baseline);
 return {revision,options:{policy,seed,delay},outcome,origin,prepared,actions,events,frames,lastSpawnFrame,observations,final:copy(s)};
}
const fixtures=[
  {
    "name": "cheapPairs-s1-d0",
    "options": {
      "policy": "cheapPairs",
      "seed": 1,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "time": 79.4,
      "core": 5,
      "unitsLost": 1,
      "gross": 350,
      "refund": 0,
      "balance": 130,
      "guardDamage": 201,
      "cleanup": 31.400000000000006,
      "peakLive": 29
    },
    "digests": {
      "outcome": "d1f468f8b12e0d48bda4aa1b299b44202923f750c88feff04d87503881b68ccb",
      "origin": "bdedb4e0be3f13934758b387d244b02b328e538b29091328b816e12d41638709",
      "prepared": "297ea803325cef29668685abce7576bd382342d4b3c16f45189dedd32071a456",
      "actions": "47c845b5adfa652d9bcc5b51e9728c46dda3512dce1a0cb41bb5556a47e590ec",
      "events": "16857c2f6deeb321f1f645d14cd9136e697a7634d5c6ff0c311ff622452f1276",
      "frames": "34541ef7c5a7580b9da3d3edddd94aca992dbfdfd5df777fefd9abb98611a5e9",
      "lastSpawnFrame": "23b539ec74b7422971d99e410151013049dacf56d3e4aa0163bdbce037013342",
      "observations": "fbb65dedc351ad51a04ffb68cb902773c9db09e57156c83c7dacd7aeb143ae2f",
      "final": "e5f24e2e585c62057e7ea6fab40d0034095a701d993f10aedb84e7d1d0140971"
    }
  },
  {
    "name": "cheapPairs-s1-d3",
    "options": {
      "policy": "cheapPairs",
      "seed": 1,
      "delay": 3
    },
    "expected": {
      "phase": "won",
      "time": 82.11666666666666,
      "core": 5,
      "unitsLost": 2,
      "gross": 400,
      "refund": 0,
      "balance": 80,
      "guardDamage": 333,
      "cleanup": 34.11666666666666,
      "peakLive": 29
    },
    "digests": {
      "outcome": "1d9f88ac99faf3cf9e9ad46e2ab10746102a974161cfc74a11011f001764b511",
      "origin": "bdedb4e0be3f13934758b387d244b02b328e538b29091328b816e12d41638709",
      "prepared": "297ea803325cef29668685abce7576bd382342d4b3c16f45189dedd32071a456",
      "actions": "0ce4389390902dbd1673f93345068440740f0ae5786f24441d1d3622144561f5",
      "events": "362c20e9f76e7b57a74c594ea9cd4341d226b6c050896c17ba3059a33fdebf8f",
      "frames": "622a4158a093b600866890506dae510b0d89a2778b80ba5b0602d80e31ca664f",
      "lastSpawnFrame": "d82721f377ba78118b93faa782c2b65429a05ad7f377fc7fc51ef0a5dca184ad",
      "observations": "b445cabbdfe497af5bdc5a5d8d93ba7cd5cd4bb1dd6da225c04c07a80ac82a88",
      "final": "948e1b3742cfc5896340c12ea90359fd3f7cb0aee2eb9554fbb152a0c1bb4f86"
    }
  },
  {
    "name": "cheapPairs-s1-d6",
    "options": {
      "policy": "cheapPairs",
      "seed": 1,
      "delay": 6
    },
    "expected": {
      "phase": "won",
      "time": 86.4,
      "core": 5,
      "unitsLost": 3,
      "gross": 450,
      "refund": 0,
      "balance": 30,
      "guardDamage": 317,
      "cleanup": 38.400000000000006,
      "peakLive": 29
    },
    "digests": {
      "outcome": "43a7e44fcfea5fce4af42708b9890d92e765b0367c3d3be8e7c86e373840ca42",
      "origin": "bdedb4e0be3f13934758b387d244b02b328e538b29091328b816e12d41638709",
      "prepared": "297ea803325cef29668685abce7576bd382342d4b3c16f45189dedd32071a456",
      "actions": "5908b704dcc71877998c07ab072dac202f361a498b140137659c7d10d20d0e97",
      "events": "818b1f584daf3bfd08b69fe9fa8f790dd7559078a8fcc71559cdc33dde914349",
      "frames": "865125641cec3c8b12ad15a865e0a54d99908f215f3e354c2e99d346c16affd9",
      "lastSpawnFrame": "21d896d206fbdc717b0e6aadd345750b1c8e6684980aa8f4dd9faa650452ede4",
      "observations": "304e7c62b57b213c65ed0585c2f7d02580159434fef0de7dcd8ffa1af550df87",
      "final": "669421b7cbe61a056adace5fe1fb203acf0945dd83c2f35d142df99f94d93c44"
    }
  },
  {
    "name": "cheapPairs-s127-d0",
    "options": {
      "policy": "cheapPairs",
      "seed": 127,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "time": 81.3,
      "core": 5,
      "unitsLost": 1,
      "gross": 400,
      "refund": 0,
      "balance": 80,
      "guardDamage": 222,
      "cleanup": 33.3,
      "peakLive": 28
    },
    "digests": {
      "outcome": "0300536f29095b3d41ce47181448dec95ae844f641fa4dbd57155aaf3d21e264",
      "origin": "43a0b40e0f20f22cb3e6dccb9914d828d24e015ecc1772ee95fbe6f2e1834994",
      "prepared": "6c39661c7f1bf82f1020bc1e82d09d7fad5ae94ca28eee9ef88eff756a549890",
      "actions": "6e5230ce8f390b9ea347685eae2e955c06d6573a7028ce4856fa1ea0ba2ff84b",
      "events": "adfa246085effc0a9e3ebfcfa09d8b6c2feb609125eb553a1cdc8090e2c9f2ec",
      "frames": "fcff5a34f13aab98fccea61d55f034bfc8181945a063732e0fc6fe73a2775b78",
      "lastSpawnFrame": "d41238098ddd881a90f697c8b463ec2afe8a5d18d9d3bc9716d51855d95108b8",
      "observations": "8e9f0885863537d01afaf3099ba6cc55364ea100d371293d98b8cd69bc32758a",
      "final": "f692175a52c46a7478f84f315bb6e1246d05a733a2c3b015b2d6702afab935a3"
    }
  },
  {
    "name": "cheapPairs-s127-d3",
    "options": {
      "policy": "cheapPairs",
      "seed": 127,
      "delay": 3
    },
    "expected": {
      "phase": "won",
      "time": 79.23333333333333,
      "core": 5,
      "unitsLost": 2,
      "gross": 500,
      "refund": 25,
      "balance": 5,
      "guardDamage": 369,
      "cleanup": 31.233333333333334,
      "peakLive": 28
    },
    "digests": {
      "outcome": "7c955c42eaf39d1e36477921dff9fcfabebc8245646e746b6f17dc663f3af654",
      "origin": "43a0b40e0f20f22cb3e6dccb9914d828d24e015ecc1772ee95fbe6f2e1834994",
      "prepared": "6c39661c7f1bf82f1020bc1e82d09d7fad5ae94ca28eee9ef88eff756a549890",
      "actions": "c639fb503898c5b23618886c71e7a4b111400892b15ef928ebbe1902d383d210",
      "events": "fb4af9f72573e10255be6f297c860e18293ac61d30083c2e674c2ecdfcf42f97",
      "frames": "d069744424238e448598e19a7d90993885d850022bbc9e6787245abefc52e07c",
      "lastSpawnFrame": "f50458b78e2c87bdb5b21347a3af1b70ecf821c37d01dc4b7d7cfbc3c3aaf7c1",
      "observations": "61f2b3b6c04306d0a4840f1fb7c745bd84a19b264cce8f327d2d1137e60e45b8",
      "final": "f3bfc13bb1aab2eef778344bf5301627f9e10caea5309b58089f03aebd986a2d"
    }
  },
  {
    "name": "cheapPairs-s127-d6",
    "options": {
      "policy": "cheapPairs",
      "seed": 127,
      "delay": 6
    },
    "expected": {
      "phase": "won",
      "time": 87.8,
      "core": 5,
      "unitsLost": 3,
      "gross": 450,
      "refund": 0,
      "balance": 30,
      "guardDamage": 353,
      "cleanup": 39.8,
      "peakLive": 29
    },
    "digests": {
      "outcome": "c9c94ccaafc1a0e67bad7fe004c637ccc6291dbf20476a310b6e2f26970ec3e1",
      "origin": "43a0b40e0f20f22cb3e6dccb9914d828d24e015ecc1772ee95fbe6f2e1834994",
      "prepared": "6c39661c7f1bf82f1020bc1e82d09d7fad5ae94ca28eee9ef88eff756a549890",
      "actions": "415afaeaa6363f50e9d3d1545a7a5351008669a3847df676c8cd6ede31486e87",
      "events": "49121906872847b6447aca83dab11d5bfb0a0c00fa0d3f8ccec768cb12f63227",
      "frames": "588058241c570c948252976243efcf98f01cb3ceea5b5bf6b6072739f226ec21",
      "lastSpawnFrame": "e42d3eb01e725c198f494cac1933a42760d26c4ead4e382239826eccd13451f4",
      "observations": "3b4c0041dbaebd4f38bba3a784eaacf088416044a4b11def83361457bd07b089",
      "final": "06133e5445397e9bb31cf6633c3e4f632bc50ef8bb68fbbe4c6bc7823ab447b2"
    }
  },
  {
    "name": "cheapPairs-s30-d0",
    "options": {
      "policy": "cheapPairs",
      "seed": 30,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "time": 82,
      "core": 5,
      "unitsLost": 1,
      "gross": 400,
      "refund": 0,
      "balance": 80,
      "guardDamage": 229,
      "cleanup": 34,
      "peakLive": 28
    },
    "digests": {
      "outcome": "f22587e14b52eccac8f13b45be85128a39cb2bce3d54124c39d36491366ee5d3",
      "origin": "55da101118198a4fab0a9c99e8f9a7a885c8a1f42f08084bf3248684b24d55f7",
      "prepared": "de3b2860c53b836ef09510539b4d10fe210f5f0fbb712e3570017ca2bb466849",
      "actions": "6dfa04293e43d76a5ab6159d5ed327d79b951ed8b84c96b438035fa169bc7a53",
      "events": "739e6cbc465a92a1cbdb07eb7385b7b232932306da6a1407a6a9dcdc0d926d45",
      "frames": "b20528bf5ed972c5be16caeac73fa5c49287d1aec0246ea1f7c5b312bc449d95",
      "lastSpawnFrame": "7dca5afe83b675e004128898c4f6a7b05a4536076ac4e8a0a39e0a4aabf75c6c",
      "observations": "23c659c75ad8a54d13d87053e8dac566df9decc995685149650f1a507dfa2ae1",
      "final": "96d270c966760322c0368396c4f7585e0483e82e6e42146077ac93c86b27e97c"
    }
  },
  {
    "name": "cheapPairs-s30-d3",
    "options": {
      "policy": "cheapPairs",
      "seed": 30,
      "delay": 3
    },
    "expected": {
      "phase": "won",
      "time": 90.08333333333333,
      "core": 5,
      "unitsLost": 3,
      "gross": 450,
      "refund": 0,
      "balance": 30,
      "guardDamage": 376,
      "cleanup": 42.08333333333333,
      "peakLive": 28
    },
    "digests": {
      "outcome": "3357fc1527c90ebcf0ffc20f6d713ec3a1e8eb136a1e5ebe8f32c5cdc9ca5e93",
      "origin": "55da101118198a4fab0a9c99e8f9a7a885c8a1f42f08084bf3248684b24d55f7",
      "prepared": "de3b2860c53b836ef09510539b4d10fe210f5f0fbb712e3570017ca2bb466849",
      "actions": "32550aaba855c6b2b12eecf95885401e1118041875d5f1bb8a61d06cae9c1431",
      "events": "cc731aba65b8e8d6a1d76f0a54f6e9065c0ca2815a9176cf6d14766b3fdac4bb",
      "frames": "d028cf3715335f68d2269e97c38e93845dbacf920ed2d91519f585625cfd7284",
      "lastSpawnFrame": "09f001cd55d02e0842a6ed40e2c3bcf800ec21e805e8e8bdaf6bc4245853b8da",
      "observations": "30a2f81372714b554f205fb1e889d22a4357ede592cfeedf61c289267fba54b0",
      "final": "49f8d86b626c9e7c616d0d82b6bc231e1d7ee24e72681efc562140e2a3f0bd4c"
    }
  },
  {
    "name": "cheapPairs-s30-d6",
    "options": {
      "policy": "cheapPairs",
      "seed": 30,
      "delay": 6
    },
    "expected": {
      "phase": "won",
      "time": 86.38333333333334,
      "core": 5,
      "unitsLost": 4,
      "gross": 500,
      "refund": 25,
      "balance": 5,
      "guardDamage": 385,
      "cleanup": 38.38333333333334,
      "peakLive": 29
    },
    "digests": {
      "outcome": "36fd24e1d3fb8c15fd5e825be45f596530847bbc40426acdd3d962a6037590b9",
      "origin": "55da101118198a4fab0a9c99e8f9a7a885c8a1f42f08084bf3248684b24d55f7",
      "prepared": "de3b2860c53b836ef09510539b4d10fe210f5f0fbb712e3570017ca2bb466849",
      "actions": "ee004729b8ef3fcafa5e87b68fb444cfdc70c877d9535d0f588f894a62b32513",
      "events": "a0085fa1aca916ebe6e0f39cacec1f9385ff661080292dfbd97800796880f31d",
      "frames": "9299ddc3223fd21e92f0a9ba245c86737dd9843ac84562b227f0b042f64e8661",
      "lastSpawnFrame": "8fe31f32d72a8f4c04152e4e261cd91afecea8773e4f815db5de13742c682ad8",
      "observations": "a9f1eea87888b4a50f73d5a5213e174e6dab20d80911879cb2f900dbd9bdfc5a",
      "final": "8f1ced3954b00aee1a27f6c812c284de79a5c35210a6287ca3d7ee16a52a18c6"
    }
  },
  {
    "name": "cheapPairs-s7-d0",
    "options": {
      "policy": "cheapPairs",
      "seed": 7,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "time": 79.6,
      "core": 5,
      "unitsLost": 0,
      "gross": 400,
      "refund": 0,
      "balance": 80,
      "guardDamage": 222,
      "cleanup": 31.599999999999994,
      "peakLive": 28
    },
    "digests": {
      "outcome": "05ab0d9c9a8fa6f3c0bd690893174cd6e5fb1a8f02566d25a7cf047a4ebbeb7f",
      "origin": "5a08cb76482de08d7ca041d862c7f3383b9b805a1f9d24e69dbd92682a16b162",
      "prepared": "ab3182de74fceca3011cc543ca3e7065a966f10924724fb6b1c9ec6928f63124",
      "actions": "e4f716965415ffc75cb09d05e7a74a5d571d47303f1aeb833bb7ffe95e8c7fcc",
      "events": "86b242ba309cbd57484be6fddf48df96f07d123af880347515a217c22b49af71",
      "frames": "321bc5b5fe148487dc4eae4d9d5105af92ad35ca25514aff4ae293fe0fc822ed",
      "lastSpawnFrame": "558c9b31fbcca75284f9a3cfd247eba5a86ff696bae462338fbc6ab4a19f5a38",
      "observations": "14f5b9ec523df06b583c0a4b0e884d74334df68f34cd85a5bbb878f84f0f18ec",
      "final": "734594673dce81f9c02b60e8ef25f5c968cfe1b7d0f3baeacbea385f455da468"
    }
  },
  {
    "name": "cheapPairs-s7-d3",
    "options": {
      "policy": "cheapPairs",
      "seed": 7,
      "delay": 3
    },
    "expected": {
      "phase": "won",
      "time": 78,
      "core": 5,
      "unitsLost": 1,
      "gross": 400,
      "refund": 0,
      "balance": 80,
      "guardDamage": 351,
      "cleanup": 30,
      "peakLive": 28
    },
    "digests": {
      "outcome": "b353411730c1231d1b754288b6dfbc75be413829bcfed641003927d0a7a54a2f",
      "origin": "5a08cb76482de08d7ca041d862c7f3383b9b805a1f9d24e69dbd92682a16b162",
      "prepared": "ab3182de74fceca3011cc543ca3e7065a966f10924724fb6b1c9ec6928f63124",
      "actions": "4a339164864b54b78253a296d14f31f1eabf35e1786fa2e1b167869741f53e0c",
      "events": "57f59aafcc66b593bf33f5a73f8812e6868a124f944e75c6467207744a3da61b",
      "frames": "b7765e8fb923f4d3f5a9acebfbb85cfdb6041163c1102ede8fc5d67fed4a1ea6",
      "lastSpawnFrame": "ab551c6496613c98737480b04fb0431955aa7735de119bbaaf757233e020ed3f",
      "observations": "035849d735e684fdd1943b3a32ca77d18fdd9946ac89c87be9847c5226868091",
      "final": "d5a50fccedc8e3860e00204bae34fa27f9e718a24db6d664ecd0048888c34893"
    }
  },
  {
    "name": "cheapPairs-s7-d6",
    "options": {
      "policy": "cheapPairs",
      "seed": 7,
      "delay": 6
    },
    "expected": {
      "phase": "won",
      "time": 82.9,
      "core": 5,
      "unitsLost": 3,
      "gross": 450,
      "refund": 0,
      "balance": 30,
      "guardDamage": 321,
      "cleanup": 34.900000000000006,
      "peakLive": 29
    },
    "digests": {
      "outcome": "781da6a0247d7b7853239b5dd5d434aa997e25d0669f45275bc295cb68a4aa5b",
      "origin": "5a08cb76482de08d7ca041d862c7f3383b9b805a1f9d24e69dbd92682a16b162",
      "prepared": "ab3182de74fceca3011cc543ca3e7065a966f10924724fb6b1c9ec6928f63124",
      "actions": "9be9bc33662433c331b58981738624b7749018b11d48c8d5863d4e03388a07ea",
      "events": "9eaddd54844bb0cd357ed961722e829a85cf4fde88e7f9db81c26d6fcaf1afdf",
      "frames": "5693c551928ea7baf1ea2bb7a8c7920bf544c76d5dfc1139cdc5cb9a9ef2c5eb",
      "lastSpawnFrame": "2a664cf2378dfe60ff3ebcb3d6a2097a8eed8f40c80eb9ec66e971107fc12e12",
      "observations": "3b44e2638a6c1b0787597862ff7ca4318db7ace5782498a0f513dd265feb7ebb",
      "final": "3b028cc5037b3601e014bbc1c9ec41159b7cb2e5daaa896fbc79701dfa686e74"
    }
  },
  {
    "name": "familiarBroad-s1-d0",
    "options": {
      "policy": "familiarBroad",
      "seed": 1,
      "delay": 0
    },
    "expected": {
      "phase": "lost",
      "time": 47.28333333333333,
      "core": 0,
      "unitsLost": 2,
      "gross": 400,
      "refund": 25,
      "balance": 15,
      "guardDamage": 182,
      "cleanup": -0.7166666666666686,
      "peakLive": 41
    },
    "digests": {
      "outcome": "1b7dc2744ff0805a121859f5a0cef4030679c921f34cb53eb72673c9def81109",
      "origin": "bdedb4e0be3f13934758b387d244b02b328e538b29091328b816e12d41638709",
      "prepared": "05fb452a58b1a48f51ebb1ec14ed2412e9efb08ac3dbaf6f633cbed8ac5b5713",
      "actions": "eaa7fcd1276ea0ba7ac13bd28d578618b56fed901733cd137860b4df9169c238",
      "events": "8dbc59abfa0c2cb5c5377af665e775caf4e37005494a45eef88ca5eb7d7c986e",
      "frames": "00b7c40eee57756c1c39524f5e66e8adbf6e55b45f6efec4d31f61309b903822",
      "lastSpawnFrame": "74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b",
      "observations": "2f0fe347bd1871d6cefbacab93913e729185da4db3eaa03d5599692a9669fb61",
      "final": "c63fa20d203ded47c0dbb3b7c821b047d46891f2560d54733bc26e61242130b8"
    }
  },
  {
    "name": "familiarBroad-s1-d3",
    "options": {
      "policy": "familiarBroad",
      "seed": 1,
      "delay": 3
    },
    "expected": {
      "phase": "lost",
      "time": 46.666666666666664,
      "core": -1,
      "unitsLost": 2,
      "gross": 350,
      "refund": 25,
      "balance": 65,
      "guardDamage": 182,
      "cleanup": -1.3333333333333357,
      "peakLive": 42
    },
    "digests": {
      "outcome": "fc395fb8dcfd0bc41dbdeaf19eabae0d6fd9c22b52d638f108a32e8e2163b155",
      "origin": "bdedb4e0be3f13934758b387d244b02b328e538b29091328b816e12d41638709",
      "prepared": "05fb452a58b1a48f51ebb1ec14ed2412e9efb08ac3dbaf6f633cbed8ac5b5713",
      "actions": "c4a09dc1547d7fae90e6e5163fa3a7a45668531289a093993bbd179d256b65f0",
      "events": "9767f1c8952f212b5f045a4ec42ba5e90978df42702ea4bb5297da44a2c00597",
      "frames": "604154b76398bd2ae271d7fe9d38d167abafea6323fb9801538bac2f96ddeaed",
      "lastSpawnFrame": "74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b",
      "observations": "2bfb1bf7d474ce468c769d19a2dd3ea6be49ac19a90c93f12c5b699fb5da2834",
      "final": "c1e4ca6e420770c79fd1ae34ca668c4b8b761b3d44ae25015efd985471e1ff82"
    }
  },
  {
    "name": "familiarBroad-s1-d6",
    "options": {
      "policy": "familiarBroad",
      "seed": 1,
      "delay": 6
    },
    "expected": {
      "phase": "lost",
      "time": 45.78333333333333,
      "core": -3,
      "unitsLost": 2,
      "gross": 350,
      "refund": 25,
      "balance": 35,
      "guardDamage": 182,
      "cleanup": -2.2166666666666686,
      "peakLive": 44
    },
    "digests": {
      "outcome": "ff88738f9027835662257002e2e23f15f3c182c140a307a45165ad1908438e18",
      "origin": "bdedb4e0be3f13934758b387d244b02b328e538b29091328b816e12d41638709",
      "prepared": "05fb452a58b1a48f51ebb1ec14ed2412e9efb08ac3dbaf6f633cbed8ac5b5713",
      "actions": "e61df1afc5ef5676bca0cc8f7a11b4e392ca282fef9fd38551540b5969050824",
      "events": "06c6a08eb6e3441b9669280cde9a6b6599d4737d085efa8f2ba48ed94d428743",
      "frames": "0fda3878b3e028d11e66f0fed95ada23c596e54913916b88241d3a89a96893ac",
      "lastSpawnFrame": "74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b",
      "observations": "c95cc263b89b167f5fd1e388b2a7ffee4328f7829d79a8003beab11fe4f1a3eb",
      "final": "24420c8b4bddcb4a46c4339c2208087ada91cb0a0e33f2481f90841ff1404774"
    }
  },
  {
    "name": "familiarBroad-s127-d0",
    "options": {
      "policy": "familiarBroad",
      "seed": 127,
      "delay": 0
    },
    "expected": {
      "phase": "lost",
      "time": 47.28333333333333,
      "core": 0,
      "unitsLost": 2,
      "gross": 400,
      "refund": 25,
      "balance": 15,
      "guardDamage": 182,
      "cleanup": -0.7166666666666686,
      "peakLive": 40
    },
    "digests": {
      "outcome": "2f054529d1d6bba6a145c3a0492fd9e6bda0fea9e9ca8d82229e9844fed240d2",
      "origin": "43a0b40e0f20f22cb3e6dccb9914d828d24e015ecc1772ee95fbe6f2e1834994",
      "prepared": "287c0ea9b3b58ad589f70f06465ddef0f14209f980926760328b244ec49eedf5",
      "actions": "403a9188ca837589c419acf53339e882f03d09cb842e9130a8b2c89b28911c14",
      "events": "5dbff7746fd8cd00e37b8f98d6197a6fca60b504a40ee10c6a971ae83ce5884e",
      "frames": "d93d8db8f1a26efbe2688fa7352134146ec743338ce9baf27a601aab173f309f",
      "lastSpawnFrame": "74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b",
      "observations": "564d0e252942c606462a2df6e2e35274fda1f5f88f80d6b54851c5e64328641a",
      "final": "c3b387fc6dd21d83080321a25cb6fc22ca62288a1030c468ffcece8a13c1ad15"
    }
  },
  {
    "name": "familiarBroad-s127-d3",
    "options": {
      "policy": "familiarBroad",
      "seed": 127,
      "delay": 3
    },
    "expected": {
      "phase": "lost",
      "time": 46.666666666666664,
      "core": -1,
      "unitsLost": 2,
      "gross": 350,
      "refund": 25,
      "balance": 65,
      "guardDamage": 182,
      "cleanup": -1.3333333333333357,
      "peakLive": 41
    },
    "digests": {
      "outcome": "43274c2807f6772ac630d7927f5013ae488ae8f988001cb8bd97ac60bf650fe5",
      "origin": "43a0b40e0f20f22cb3e6dccb9914d828d24e015ecc1772ee95fbe6f2e1834994",
      "prepared": "287c0ea9b3b58ad589f70f06465ddef0f14209f980926760328b244ec49eedf5",
      "actions": "82c66a770e7545c28b0fdc4b3ae13c711033571ac279e53b63ee27b50b923f93",
      "events": "efa3c62ada1b370eee0871bc8dd56cbefeaca7e57590d4c2d9422824bf6deab5",
      "frames": "825b0e443bb29c14a4d7a2d4a7db36b1cc2439ebd2f9152971213c6703a9745f",
      "lastSpawnFrame": "74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b",
      "observations": "63e697d965811a3996a131e5b9b2ce73a4c2c27603900ce23568398a29d3a6c1",
      "final": "45ddbb899da34e5c5dba49acf6ade1d86b430bd2b6857225ef9b74a918ca4f59"
    }
  },
  {
    "name": "familiarBroad-s127-d6",
    "options": {
      "policy": "familiarBroad",
      "seed": 127,
      "delay": 6
    },
    "expected": {
      "phase": "lost",
      "time": 45.78333333333333,
      "core": -3,
      "unitsLost": 2,
      "gross": 350,
      "refund": 25,
      "balance": 35,
      "guardDamage": 182,
      "cleanup": -2.2166666666666686,
      "peakLive": 43
    },
    "digests": {
      "outcome": "9ed5d14f8edd6a133d4e89e1957c8d37fa076dc8677cc0bbc20aea11c5c7559e",
      "origin": "43a0b40e0f20f22cb3e6dccb9914d828d24e015ecc1772ee95fbe6f2e1834994",
      "prepared": "287c0ea9b3b58ad589f70f06465ddef0f14209f980926760328b244ec49eedf5",
      "actions": "a1de85638a51fec112f7a706e4f332bbda83e10c66ded590b0703f3c411d9b1b",
      "events": "c3df4328268fbeed036ed759f4a5f265e4e1ef9a8aca2b9d61f962e6a1b6f18e",
      "frames": "bb02d88c03f52a8b94908c4a2fde54aac99fe584b28b3ccaea8635b8ee491ffc",
      "lastSpawnFrame": "74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b",
      "observations": "1f368d7bd559f3c3f02f1e6024783db54c314266e761b770f78276e9198a3451",
      "final": "4d734d8bfcc58be139fed4715f5487333b25573fe46acf86387d809a395717de"
    }
  },
  {
    "name": "familiarBroad-s30-d0",
    "options": {
      "policy": "familiarBroad",
      "seed": 30,
      "delay": 0
    },
    "expected": {
      "phase": "lost",
      "time": 47.28333333333333,
      "core": 0,
      "unitsLost": 2,
      "gross": 400,
      "refund": 25,
      "balance": 15,
      "guardDamage": 182,
      "cleanup": -0.7166666666666686,
      "peakLive": 40
    },
    "digests": {
      "outcome": "c740f5d3df58667b2eeb5bb97ac74b103c9cde97f278a993f863dc1c57b405ea",
      "origin": "55da101118198a4fab0a9c99e8f9a7a885c8a1f42f08084bf3248684b24d55f7",
      "prepared": "16493c4c9dcdd459fc62b30e9814127d7a9b80d6e2922a8655cf0f226dbf9a8b",
      "actions": "8f6469eb0ee8fc46ec6392b9c03db713384a855b7e5a78ff3f931da6fd253f77",
      "events": "4ce22df61720b9c65c7605f048530d90d0aaf43547d0645f5017edfdd1e41265",
      "frames": "6fc7ed5350e71ccc23283ced9f1971bc48706df886434de5342062a3dba4ba6f",
      "lastSpawnFrame": "74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b",
      "observations": "7280ea16ca9062d47513840a890127fe50e2b27f17e28e17b4427bf66c996625",
      "final": "d34df48c1e245ee97d6f3e98a95db396fbd7d8799ede85dc2fdd01f297fbfbc4"
    }
  },
  {
    "name": "familiarBroad-s30-d3",
    "options": {
      "policy": "familiarBroad",
      "seed": 30,
      "delay": 3
    },
    "expected": {
      "phase": "lost",
      "time": 46.666666666666664,
      "core": -1,
      "unitsLost": 2,
      "gross": 350,
      "refund": 25,
      "balance": 65,
      "guardDamage": 182,
      "cleanup": -1.3333333333333357,
      "peakLive": 41
    },
    "digests": {
      "outcome": "edc6d2e17ee2673f5c38f3f4f7efcc8a1f53542f448b06aa1c65212c43386e05",
      "origin": "55da101118198a4fab0a9c99e8f9a7a885c8a1f42f08084bf3248684b24d55f7",
      "prepared": "16493c4c9dcdd459fc62b30e9814127d7a9b80d6e2922a8655cf0f226dbf9a8b",
      "actions": "d8f872f8fed0535dc2c5d3d8b44421e2a29d1da37bfa90578218ec11872b23e1",
      "events": "d9a67645dd974c50aeb2429642f6350cabc440d2ec57880e315ee15bccade58e",
      "frames": "aebefece4719355321f9cddc628e1264c5cd0016e6361b7997252da99076f99a",
      "lastSpawnFrame": "74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b",
      "observations": "4a1b4591636d43c1215d280402d98a2ac3a07fcf048d7a252c2e7debfa58c567",
      "final": "b8f8377c104a3b193f464188b7bb2baf0cb4966a0e20eb01caeb308e4d7d9409"
    }
  },
  {
    "name": "familiarBroad-s30-d6",
    "options": {
      "policy": "familiarBroad",
      "seed": 30,
      "delay": 6
    },
    "expected": {
      "phase": "lost",
      "time": 45.78333333333333,
      "core": -3,
      "unitsLost": 2,
      "gross": 350,
      "refund": 25,
      "balance": 35,
      "guardDamage": 182,
      "cleanup": -2.2166666666666686,
      "peakLive": 43
    },
    "digests": {
      "outcome": "f3f06b834c9095c181c38d1291c2a86e3e17ed82f5ce622642ccb3a8107dfa1d",
      "origin": "55da101118198a4fab0a9c99e8f9a7a885c8a1f42f08084bf3248684b24d55f7",
      "prepared": "16493c4c9dcdd459fc62b30e9814127d7a9b80d6e2922a8655cf0f226dbf9a8b",
      "actions": "78688c853c4004ba359b97f0ecb97e1c42bc5206f2e71b6f26081203f46652f7",
      "events": "d6a41b9b29c4aa5d70a63a2455865b62318f3486dd136b5e63656f5714897aee",
      "frames": "d23a27c7e7ae02ebd9f3cfba61a2939ddf8e56a6f40818579ac2e12225296d72",
      "lastSpawnFrame": "74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b",
      "observations": "94a267914e6f8e907f93161f8fc291f4f7538b5c0da24a79a556cb7046d6341d",
      "final": "f13ca584462e34cd2489b1e665ce1e2dfcd036a69e782419178764c1fccfc014"
    }
  },
  {
    "name": "familiarBroad-s7-d0",
    "options": {
      "policy": "familiarBroad",
      "seed": 7,
      "delay": 0
    },
    "expected": {
      "phase": "lost",
      "time": 47.28333333333333,
      "core": 0,
      "unitsLost": 2,
      "gross": 400,
      "refund": 25,
      "balance": 15,
      "guardDamage": 182,
      "cleanup": -0.7166666666666686,
      "peakLive": 40
    },
    "digests": {
      "outcome": "57e95a92e89572556b5c6136c119abfd540fd852b7b8d3db4bc1cb91dd20a181",
      "origin": "5a08cb76482de08d7ca041d862c7f3383b9b805a1f9d24e69dbd92682a16b162",
      "prepared": "9fdaa1611909039767430cb9cf742487495c6548b4d92b2d5dc56f75163b5f55",
      "actions": "e73ec12209a9c58e0460a083d4ae0a21aa1c19a50ced4ce262383e5498150d21",
      "events": "876310edf204204f4831aecb1c2d0005e28d13d6c8785f9d3d7a8782bb9d0731",
      "frames": "75df48f8049e9378d5fbd059c18c180458a666f8b464a758ea0e6ab7549d2dcf",
      "lastSpawnFrame": "74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b",
      "observations": "26549e4b210fad898a9b854738fb42eb5dca261af72c78b969465328e1d3ce22",
      "final": "a3f92d18cbf899ff2ea937ce2a1f935b03afc10a469b4d9f9c1408fc5b3eb734"
    }
  },
  {
    "name": "familiarBroad-s7-d3",
    "options": {
      "policy": "familiarBroad",
      "seed": 7,
      "delay": 3
    },
    "expected": {
      "phase": "lost",
      "time": 46.666666666666664,
      "core": -1,
      "unitsLost": 2,
      "gross": 350,
      "refund": 25,
      "balance": 65,
      "guardDamage": 182,
      "cleanup": -1.3333333333333357,
      "peakLive": 41
    },
    "digests": {
      "outcome": "02414f5d67648f0005d55706dd18e1be34b445938e5db122783f222d222123e0",
      "origin": "5a08cb76482de08d7ca041d862c7f3383b9b805a1f9d24e69dbd92682a16b162",
      "prepared": "9fdaa1611909039767430cb9cf742487495c6548b4d92b2d5dc56f75163b5f55",
      "actions": "23f9d901b4cd2be456a8376ac10e16bf8be57cf3dec4f8142b2662d4bb408cc0",
      "events": "3ec93193f965ae652cfd06ed27ee0553d3041613d507a1c5f5874eae6f44f519",
      "frames": "a67f4342468d23c0701c0797225045c35056eaa8b50771e7204428dc4068cabe",
      "lastSpawnFrame": "74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b",
      "observations": "2876466238b4d30d74008c41910f374a9fa5be81ea804765bd191dccf4f0f483",
      "final": "4a8034d49cea32db3dc2724c61bcd4a28b41e02c43717eae5312bc5f4bb263c5"
    }
  },
  {
    "name": "familiarBroad-s7-d6",
    "options": {
      "policy": "familiarBroad",
      "seed": 7,
      "delay": 6
    },
    "expected": {
      "phase": "lost",
      "time": 45.78333333333333,
      "core": -3,
      "unitsLost": 2,
      "gross": 350,
      "refund": 25,
      "balance": 35,
      "guardDamage": 182,
      "cleanup": -2.2166666666666686,
      "peakLive": 43
    },
    "digests": {
      "outcome": "f69619fc3f75cd25cac2f188814ef0d03d237054f383a473647e597ec861b3be",
      "origin": "5a08cb76482de08d7ca041d862c7f3383b9b805a1f9d24e69dbd92682a16b162",
      "prepared": "9fdaa1611909039767430cb9cf742487495c6548b4d92b2d5dc56f75163b5f55",
      "actions": "e7a2e3c8801701ce988c33a6947d7c0b2f596a63a1f298f7beb6997943b41c3d",
      "events": "aafc5fe594de94759d5bf07dc0efda308a4474526cb3f60dbb9d4f917357d2fc",
      "frames": "7c04cb0696bc98ffe05375f6234023707feebe72ea76809f05a1fc6772b7c02f",
      "lastSpawnFrame": "74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b",
      "observations": "1e062c087939555f209a118e3a6711444d108cc3fcc375168eeca30ac75dcd1b",
      "final": "6da673c139ed8809b58dc180b43fd33d4ce79be63fd66c9459ce806629718bf7"
    }
  },
  {
    "name": "forecastBolts-s1-d0",
    "options": {
      "policy": "forecastBolts",
      "seed": 1,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "time": 69.31666666666666,
      "core": 5,
      "unitsLost": 0,
      "gross": 400,
      "refund": 0,
      "balance": 80,
      "guardDamage": 95,
      "cleanup": 21.316666666666663,
      "peakLive": 28
    },
    "digests": {
      "outcome": "aeabb281e97825f69fe8cdd4b8dc5c2b1d131f49834c9a6fca12639c20d85109",
      "origin": "bdedb4e0be3f13934758b387d244b02b328e538b29091328b816e12d41638709",
      "prepared": "297ea803325cef29668685abce7576bd382342d4b3c16f45189dedd32071a456",
      "actions": "8458924a674db3edd4a0f37ee62fd3b1af42dfb152ca4ffd49c4a3c879816405",
      "events": "da7f4eced2355f110f55ea8e3b68736b730d7d9213d39a89eb98ec4dfe260395",
      "frames": "5bebce88b948e444c948eb39f67264bda558328002097589e350b3aa2dcbaa4e",
      "lastSpawnFrame": "c2d8047dd343e313ca6293dcd926c517e9616750a953cf9a962512fc877d01e2",
      "observations": "865bc9b6b0b0ce34537f2f487500cc86aacf21bcc2f02377613912f73c28aa36",
      "final": "4f1c36ad5564bb1101c29e1b0bf745e307ab4d93cbdda2c09aa8931976d31d70"
    }
  },
  {
    "name": "forecastBolts-s1-d3",
    "options": {
      "policy": "forecastBolts",
      "seed": 1,
      "delay": 3
    },
    "expected": {
      "phase": "won",
      "time": 71.51666666666667,
      "core": 5,
      "unitsLost": 1,
      "gross": 400,
      "refund": 0,
      "balance": 80,
      "guardDamage": 243,
      "cleanup": 23.516666666666666,
      "peakLive": 29
    },
    "digests": {
      "outcome": "284006f9843a2802f1b887cb39e73d8c8e351af295eb7909cc3228b645dadbe0",
      "origin": "bdedb4e0be3f13934758b387d244b02b328e538b29091328b816e12d41638709",
      "prepared": "297ea803325cef29668685abce7576bd382342d4b3c16f45189dedd32071a456",
      "actions": "d198e7dceb03085737964e1cebdc91b582af7dcc1ba08291dfc2bbd21ce2fb63",
      "events": "3a432e349cdc11959258202a8d0bca161af9a9a6767e00d3f4aec10a4a8a1a47",
      "frames": "761db2d00a25f34fcd24627dd701dd3d6dd7f63479562e7c15b163826f013c5b",
      "lastSpawnFrame": "b2b7bec88659c5538066bacb8de40e2e2789f4eebeaa5cb308427f3ab93fb242",
      "observations": "ef6dfd8f576370faef388dfc1f3ccecd3af364098499e2fa96abac5671e15175",
      "final": "43214be9f25e7cdd8fca89ee45f7d946f4386411086b8cb9fa143c1113f30aa1"
    }
  },
  {
    "name": "forecastBolts-s1-d6",
    "options": {
      "policy": "forecastBolts",
      "seed": 1,
      "delay": 6
    },
    "expected": {
      "phase": "won",
      "time": 72.03333333333333,
      "core": 5,
      "unitsLost": 2,
      "gross": 450,
      "refund": 0,
      "balance": 30,
      "guardDamage": 257,
      "cleanup": 24.03333333333333,
      "peakLive": 29
    },
    "digests": {
      "outcome": "61eed953f4ac25cf5dece8c923eede1f6c652dc36699e5e3600850720abd8604",
      "origin": "bdedb4e0be3f13934758b387d244b02b328e538b29091328b816e12d41638709",
      "prepared": "297ea803325cef29668685abce7576bd382342d4b3c16f45189dedd32071a456",
      "actions": "ccb57448bed6d12d571def4b9f43ecae1b7217b8088c3dbd5171656740d4a250",
      "events": "c6b6092d13b5c572cc040605da766471412eb412c36cee53df204523e8152abb",
      "frames": "871fb33f14ef4856e0ac73629625077d2b9303fdf53bdc8c268afe27c098284f",
      "lastSpawnFrame": "21d896d206fbdc717b0e6aadd345750b1c8e6684980aa8f4dd9faa650452ede4",
      "observations": "49754a717be9d07f2787367a56467c7e6c18d3d0f7bb65d48a5214794abd0bed",
      "final": "98dedaca15e9fb628ed16c267c8823d3c54dc02414a17175ebd122b63439a2e0"
    }
  },
  {
    "name": "forecastBolts-s127-d0",
    "options": {
      "policy": "forecastBolts",
      "seed": 127,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "time": 69.9,
      "core": 5,
      "unitsLost": 0,
      "gross": 400,
      "refund": 0,
      "balance": 80,
      "guardDamage": 148,
      "cleanup": 21.900000000000006,
      "peakLive": 28
    },
    "digests": {
      "outcome": "fc5f5c2243b95d33e5e20a5a21fafde9df5acecd5d41ae4d72e5719ea881002a",
      "origin": "43a0b40e0f20f22cb3e6dccb9914d828d24e015ecc1772ee95fbe6f2e1834994",
      "prepared": "6c39661c7f1bf82f1020bc1e82d09d7fad5ae94ca28eee9ef88eff756a549890",
      "actions": "fe319f459772d04b5eb78a0d5f630e9735c4fbd34e2d7042a6c16ea9a62f1806",
      "events": "2a5de1ab1b0f68663170b873313561b85047fed1ba244ab278688b1be18db70b",
      "frames": "48250ec44feac59db6d15cb012874648c04216aa65f88b97b75475a44e390f89",
      "lastSpawnFrame": "5432236887be73ed04305d3af491f326d2257e46d686e28b9658bdba183c6c8c",
      "observations": "0404445b6cebd5c8b3cd5efd9bd7fee537acaf841db6f5d8be7cec70b7801fd7",
      "final": "ce6b21ee9718947221536bc40a17753ddedd729e0973be3f7308c6a6289df56f"
    }
  },
  {
    "name": "forecastBolts-s127-d3",
    "options": {
      "policy": "forecastBolts",
      "seed": 127,
      "delay": 3
    },
    "expected": {
      "phase": "won",
      "time": 71.51666666666667,
      "core": 5,
      "unitsLost": 1,
      "gross": 400,
      "refund": 0,
      "balance": 80,
      "guardDamage": 239,
      "cleanup": 23.516666666666666,
      "peakLive": 28
    },
    "digests": {
      "outcome": "34d502a9eed1ff800f555e599d9d117ce97d1ecc8f210c04be119e3b21fdb0d3",
      "origin": "43a0b40e0f20f22cb3e6dccb9914d828d24e015ecc1772ee95fbe6f2e1834994",
      "prepared": "6c39661c7f1bf82f1020bc1e82d09d7fad5ae94ca28eee9ef88eff756a549890",
      "actions": "60f5a821355cfc18d7a69ebfeff1d05adfcba0f3604f36fdfbc72e7a3e6fb18a",
      "events": "6c4f392ee9ef16aecff362a40242cd5e74b29fa50c16f68b3cad2123948aaba0",
      "frames": "dce8fee6cf54db812b35cd99c9ec0b702b4142e7e211a4de8d9ad01dfb7f9113",
      "lastSpawnFrame": "f3d8a506416811197f32569fa6020f54e585546cd77707f1ceda104f9373d35e",
      "observations": "fc001d8392cb705aaa2baade8c09926acced1ad728281240c4912a72f98d781e",
      "final": "38ec617f24f78745737fbc1a4b390ff75943f0c4b0d48259c32c650e1ac6a8ab"
    }
  },
  {
    "name": "forecastBolts-s127-d6",
    "options": {
      "policy": "forecastBolts",
      "seed": 127,
      "delay": 6
    },
    "expected": {
      "phase": "won",
      "time": 73.13333333333334,
      "core": 5,
      "unitsLost": 2,
      "gross": 450,
      "refund": 0,
      "balance": 30,
      "guardDamage": 282,
      "cleanup": 25.13333333333334,
      "peakLive": 29
    },
    "digests": {
      "outcome": "5622392cf34cd45d3f3e7389c5e25ee57aa66a8005436597804bac62fe631c6b",
      "origin": "43a0b40e0f20f22cb3e6dccb9914d828d24e015ecc1772ee95fbe6f2e1834994",
      "prepared": "6c39661c7f1bf82f1020bc1e82d09d7fad5ae94ca28eee9ef88eff756a549890",
      "actions": "93347ea513df3bbae5198245be115ec2907108815e2f35a8df9713ce15c001e8",
      "events": "bfe3b39933e18ab6cb66972025b6decba9a6e2cff3c20bc73cfd9bf0314d1a79",
      "frames": "7e19c7085a48265541d556aef53f5acdbbc938782bc48ee9b639f2db946a3c94",
      "lastSpawnFrame": "e42d3eb01e725c198f494cac1933a42760d26c4ead4e382239826eccd13451f4",
      "observations": "fb0a4d16478ad8c8f26dfa041930c4e9c41f8a57100caaaf45909413533a57a1",
      "final": "2bcdfce9f9641a6911e6705132434f650c4c6ba8cde77efe8e2914d2cb854d89"
    }
  },
  {
    "name": "forecastBolts-s30-d0",
    "options": {
      "policy": "forecastBolts",
      "seed": 30,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "time": 69.9,
      "core": 5,
      "unitsLost": 0,
      "gross": 400,
      "refund": 0,
      "balance": 80,
      "guardDamage": 166,
      "cleanup": 21.900000000000006,
      "peakLive": 27
    },
    "digests": {
      "outcome": "706a51d0dc6105d0d3f2fa7dee8d988cabf8f2afe8b0ab5a9153d5c6435d6d7c",
      "origin": "55da101118198a4fab0a9c99e8f9a7a885c8a1f42f08084bf3248684b24d55f7",
      "prepared": "de3b2860c53b836ef09510539b4d10fe210f5f0fbb712e3570017ca2bb466849",
      "actions": "5c632518517706d99838e38014e481a2a599d6141bda1433be18744e520c934b",
      "events": "8d27de37f5f36a0c00616a538fc3edb0566ccf7cca944a58ae83ab346a6c643d",
      "frames": "0b81dfde2d75b18c2d3d29f14a8622282c928863d8262ca6dc6a38f760679ada",
      "lastSpawnFrame": "21b3e9538fa4d01acee21dcc2f489bedf2c57d285b51ac388da89242bd7cad53",
      "observations": "0a9ec3aa009dd10340b4fb0fb8304122c024b19ff7f6e9f519eeac4bebdff388",
      "final": "da7d48d0e452499aaddbcaf33c440c04dad8c3b09208c264ccfee66fac6c929b"
    }
  },
  {
    "name": "forecastBolts-s30-d3",
    "options": {
      "policy": "forecastBolts",
      "seed": 30,
      "delay": 3
    },
    "expected": {
      "phase": "won",
      "time": 90.08333333333333,
      "core": 5,
      "unitsLost": 3,
      "gross": 450,
      "refund": 0,
      "balance": 30,
      "guardDamage": 289,
      "cleanup": 42.08333333333333,
      "peakLive": 28
    },
    "digests": {
      "outcome": "27f5a1c04523a9b621128b57853869b45ba7f9e5992b21075977ca54bddf110c",
      "origin": "55da101118198a4fab0a9c99e8f9a7a885c8a1f42f08084bf3248684b24d55f7",
      "prepared": "de3b2860c53b836ef09510539b4d10fe210f5f0fbb712e3570017ca2bb466849",
      "actions": "5cfd4226cb16ca29834235adc90ac1509634bad87f97017a6bdaee4f9f8b350e",
      "events": "e491242940e53423b97e35b4e25ac05c9ebcfbd2a8f690300449034cfd90b522",
      "frames": "66e0749f60bf80abe46d82baf722ebb87c581b12afdf55bc3e34be1be3729a16",
      "lastSpawnFrame": "03bc91606d066d6ddce5b8f63fdef2e2251560f761508e1f4839696679163187",
      "observations": "2d7310ba02b9a2215078ce0f93c10220c844d4de6cac540a047555ad94f11ac0",
      "final": "ad39e795d85c1b3ab7a7a34ad1f8046c76e260f7a75dd06ce8c3d877c5d0ed1e"
    }
  },
  {
    "name": "forecastBolts-s30-d6",
    "options": {
      "policy": "forecastBolts",
      "seed": 30,
      "delay": 6
    },
    "expected": {
      "phase": "won",
      "time": 72.33333333333333,
      "core": 5,
      "unitsLost": 2,
      "gross": 450,
      "refund": 0,
      "balance": 30,
      "guardDamage": 279,
      "cleanup": 24.33333333333333,
      "peakLive": 29
    },
    "digests": {
      "outcome": "de43c7e6db274be9afc6e13670a801e9f443d9026fc62bab7a79324d8ac93764",
      "origin": "55da101118198a4fab0a9c99e8f9a7a885c8a1f42f08084bf3248684b24d55f7",
      "prepared": "de3b2860c53b836ef09510539b4d10fe210f5f0fbb712e3570017ca2bb466849",
      "actions": "959aac596364f3520a0be4e89f2189245f0b9d82f3df98cd627361f484fc2e36",
      "events": "40f44ab6b5d4268559db40844711ffc6c522dcf3385c3df0fd6560fb73ca2da8",
      "frames": "8af0a19fcd6f2a45e00d8be95bd40ed871c8f4e0bfd495900850cc4038633731",
      "lastSpawnFrame": "8fe31f32d72a8f4c04152e4e261cd91afecea8773e4f815db5de13742c682ad8",
      "observations": "4c4f5b423bf9ce62b67e5dc440e3fb6a5cf44544a91b8e1cce54af2541c5d983",
      "final": "0e243de03c047f943d805072e7e948723a408276f06a9a61d432e0787c4cb684"
    }
  },
  {
    "name": "forecastBolts-s7-d0",
    "options": {
      "policy": "forecastBolts",
      "seed": 7,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "time": 70.36666666666666,
      "core": 5,
      "unitsLost": 0,
      "gross": 400,
      "refund": 0,
      "balance": 80,
      "guardDamage": 166,
      "cleanup": 22.36666666666666,
      "peakLive": 28
    },
    "digests": {
      "outcome": "5831cdd8f3e18876096f8d88d67568205508c5f5de529ddb9303767139e77e7a",
      "origin": "5a08cb76482de08d7ca041d862c7f3383b9b805a1f9d24e69dbd92682a16b162",
      "prepared": "ab3182de74fceca3011cc543ca3e7065a966f10924724fb6b1c9ec6928f63124",
      "actions": "ed7ba7927ab28d9f84cd16ed7f5664734089e66aed9ae83f734a713031b9596f",
      "events": "f3464170cc7e235b0a201802c897dae014b423ad28cb060542ad4524d5c64aa2",
      "frames": "063b2d7fe56e5830d5fac53c4dccb071215314313d82480fc3e55e720ee5d728",
      "lastSpawnFrame": "6546a2804e8f7abdaf6b03a032a5f2f3a05377b5364eb5da66bd39ce487e4373",
      "observations": "72da066b0597a11b0df1cddfc198bad80e26c8f61cd777c1c61664c78c0bd968",
      "final": "18eb88566e9c4106df234224caa89edf214c90814ceaab042ff48de9e57f7bd6"
    }
  },
  {
    "name": "forecastBolts-s7-d3",
    "options": {
      "policy": "forecastBolts",
      "seed": 7,
      "delay": 3
    },
    "expected": {
      "phase": "won",
      "time": 71.03333333333333,
      "core": 5,
      "unitsLost": 1,
      "gross": 400,
      "refund": 0,
      "balance": 80,
      "guardDamage": 254,
      "cleanup": 23.03333333333333,
      "peakLive": 28
    },
    "digests": {
      "outcome": "65d947f06fdfc51ec473f3c38461909cb5b3b306158845a4e2b9869628e87d0f",
      "origin": "5a08cb76482de08d7ca041d862c7f3383b9b805a1f9d24e69dbd92682a16b162",
      "prepared": "ab3182de74fceca3011cc543ca3e7065a966f10924724fb6b1c9ec6928f63124",
      "actions": "9722b3847127f6884d1e170d1fc58d616852b84add1a08e2c86ac616c2beeeb7",
      "events": "bcdf64609246a8b4731acdff0328557b54ef9fa4f71477205f461b8771eb3c0c",
      "frames": "7b9cc221bbe5a905b4f905e81608f540fc220ab6fb815b20ea8bc4815c791844",
      "lastSpawnFrame": "a557994ca9a85c355df8c56c476e72ef2eceb23a10afd800c24dc93419a6b12b",
      "observations": "aa2d3034f0c76eedc9f93f63c01a5f5316d6882f8df5d7a55615cc6eb7e2bd5d",
      "final": "e78da7c9499557485f84f352407145df28e4e9973452ac2b3a6e91dca9309896"
    }
  },
  {
    "name": "forecastBolts-s7-d6",
    "options": {
      "policy": "forecastBolts",
      "seed": 7,
      "delay": 6
    },
    "expected": {
      "phase": "won",
      "time": 72.51666666666667,
      "core": 5,
      "unitsLost": 2,
      "gross": 450,
      "refund": 0,
      "balance": 30,
      "guardDamage": 275,
      "cleanup": 24.516666666666666,
      "peakLive": 29
    },
    "digests": {
      "outcome": "b8dd124561fc21fc6fde350ed9e06a87db737cf4fe4a224eb6689fcc5adafb45",
      "origin": "5a08cb76482de08d7ca041d862c7f3383b9b805a1f9d24e69dbd92682a16b162",
      "prepared": "ab3182de74fceca3011cc543ca3e7065a966f10924724fb6b1c9ec6928f63124",
      "actions": "6b45e1c33c7ea2873ab1db95cd19db326595461d6da186f91e3bf0425ae9b75e",
      "events": "206cc5f7e8d74c70c0016bac5ed073342beb8574e3fa70a9f69d26681226879d",
      "frames": "87e2342df86f918d40a111b5828a05e42f57a0a9cc269300f574e7bc73889d9b",
      "lastSpawnFrame": "2a664cf2378dfe60ff3ebcb3d6a2097a8eed8f40c80eb9ec66e971107fc12e12",
      "observations": "cd831286063546cf3a8c14faf8456590049b030005d8c6ce24d05d48305789a5",
      "final": "4254f1a45efa4e9bcc8ecd653520da0ec9c8d7b1c3e927f372068408b50c5097"
    }
  },
  {
    "name": "heavyOpening-s1-d0",
    "options": {
      "policy": "heavyOpening",
      "seed": 1,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "time": 89.7,
      "core": 5,
      "unitsLost": 1,
      "gross": 500,
      "refund": 40,
      "balance": 20,
      "guardDamage": 188,
      "cleanup": 41.7,
      "peakLive": 28
    },
    "digests": {
      "outcome": "d64b6b6e2162152b742ca24f784ebcfecbc52ad87fd9ad84ff6a3647262f4c01",
      "origin": "bdedb4e0be3f13934758b387d244b02b328e538b29091328b816e12d41638709",
      "prepared": "af6e1693893926615617ea78bb5f5be12090fb2f9afa84acfc32b775caf67d22",
      "actions": "a0cfef39ddc90b1e9388ba02438cb6dcdcbe8222d4e530b9cbfb225272c32497",
      "events": "34442211ce69035ec116994c7f662b530ece328af8da070e9b1a5fcd1b10a23f",
      "frames": "3af95fc79ea344756bb34c535263e0d396e9fec60840b7214f296d0b9049767f",
      "lastSpawnFrame": "b590b13c0cafdb29460470888aadcacbb01b6b695a819da2dc98bb4beb5eccd8",
      "observations": "fd664bd7e8d50efad338826758cd63803ada9c16146676c413638ef3db30c6fc",
      "final": "3db8caf862a6ed7138440138b89724847ba54a8b400240e7c0c1fad356a40c5c"
    }
  },
  {
    "name": "heavyOpening-s1-d3",
    "options": {
      "policy": "heavyOpening",
      "seed": 1,
      "delay": 3
    },
    "expected": {
      "phase": "won",
      "time": 92.01666666666667,
      "core": 4,
      "unitsLost": 2,
      "gross": 500,
      "refund": 40,
      "balance": 20,
      "guardDamage": 221,
      "cleanup": 44.016666666666666,
      "peakLive": 28
    },
    "digests": {
      "outcome": "7511094b01320ac89932094e894cad87dafe0c6369f67b8e47a390ab97f4875d",
      "origin": "bdedb4e0be3f13934758b387d244b02b328e538b29091328b816e12d41638709",
      "prepared": "af6e1693893926615617ea78bb5f5be12090fb2f9afa84acfc32b775caf67d22",
      "actions": "4559c49b75e3753c6ddbe7099084b9daa0488562997217bd7e1f5a6d3bf7d948",
      "events": "24aa2f1130864cb5c0974d797fd29daf97cf5cc3e634921d358a3cc78f19d4d7",
      "frames": "1fc9f36b51443e20ec58fd751fb256157156c585d04c4c160f84f79b7317c796",
      "lastSpawnFrame": "8399f024d16c61332eac9c4147f822c9852a1a9e4585ff13872c9966d4afcb05",
      "observations": "0a5e28a46d2f84e0e266475855cfd8eb057a7d26b0a6d029208f8e35f750dfc6",
      "final": "d89556ef37d524560e1a30ccae83a72f8a53157577ac52cf47826684043822be"
    }
  },
  {
    "name": "heavyOpening-s1-d6",
    "options": {
      "policy": "heavyOpening",
      "seed": 1,
      "delay": 6
    },
    "expected": {
      "phase": "won",
      "time": 92,
      "core": 1,
      "unitsLost": 4,
      "gross": 500,
      "refund": 25,
      "balance": 5,
      "guardDamage": 364,
      "cleanup": 44,
      "peakLive": 29
    },
    "digests": {
      "outcome": "ffd2e8f8b20e61fb21d3c4c7a03b44078b2aedbfc4fd3ff27fc78cecf1f5af02",
      "origin": "bdedb4e0be3f13934758b387d244b02b328e538b29091328b816e12d41638709",
      "prepared": "af6e1693893926615617ea78bb5f5be12090fb2f9afa84acfc32b775caf67d22",
      "actions": "f8a52ced1c89ae7bd40683e4909e6afb604e2326b72376e4e64453c24f623665",
      "events": "e8c9b038ed586a3ac8ce2a03576aaede04a9a4c88bf760e9101161488be4df98",
      "frames": "4e1a44574df38b3bc88cffd9b438b96627b1cf84fb64c27ef436f0afedad59a8",
      "lastSpawnFrame": "e6564fe222e3f54bcb120ecca961cbb85b94d33d60e0b576875f44abbb60be9f",
      "observations": "e2384151718290537168128e8b6f572faa95b7da91380b7b25f7608051cd8542",
      "final": "0e0f8299776fc3fe6e8c677770148fc128c415fbd675fd1e9db74fc24fadcaf4"
    }
  },
  {
    "name": "heavyOpening-s127-d0",
    "options": {
      "policy": "heavyOpening",
      "seed": 127,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "time": 97.21666666666667,
      "core": 4,
      "unitsLost": 2,
      "gross": 500,
      "refund": 40,
      "balance": 20,
      "guardDamage": 209,
      "cleanup": 49.21666666666667,
      "peakLive": 28
    },
    "digests": {
      "outcome": "8a5a26349de1af8bdc59b75dfb77832cbcd48037cd674d194cfeb9e73ed6b56d",
      "origin": "43a0b40e0f20f22cb3e6dccb9914d828d24e015ecc1772ee95fbe6f2e1834994",
      "prepared": "d486a762fc2c05f8d4fd45e4f6ac88458b482c45dd83304f87a9aeed6f340844",
      "actions": "538f8336937d9c84a8483ff406a5e1efa48b156152bad80f53907c25fa99cef5",
      "events": "bccfe1df1c34abdc587ad3df70efa744e0b2913fc881801a5977e8cd8e365680",
      "frames": "ae3ce95deaddc3b3acc74d0f80ce65ed398874b0e85308c5dfb95e568588f46f",
      "lastSpawnFrame": "c929dc543bf88f2054bcb31b4fb8877cb961aa14b51aa4d662bd3f61ac2f9067",
      "observations": "9284056a4322235a8c7fc1189637439b8cd5bb39e42e59426816fa8af397156a",
      "final": "81a23e458f43a16d5b66699d1aebd905bef78b15f18be679c27fe5c4a337b951"
    }
  },
  {
    "name": "heavyOpening-s127-d3",
    "options": {
      "policy": "heavyOpening",
      "seed": 127,
      "delay": 3
    },
    "expected": {
      "phase": "won",
      "time": 92,
      "core": 1,
      "unitsLost": 2,
      "gross": 500,
      "refund": 40,
      "balance": 20,
      "guardDamage": 210,
      "cleanup": 44,
      "peakLive": 28
    },
    "digests": {
      "outcome": "1518a15d417a0e723890334b458a01cf95f7d62cca37c2c3167321b4ccc8ad96",
      "origin": "43a0b40e0f20f22cb3e6dccb9914d828d24e015ecc1772ee95fbe6f2e1834994",
      "prepared": "d486a762fc2c05f8d4fd45e4f6ac88458b482c45dd83304f87a9aeed6f340844",
      "actions": "38ba02493fa0fd38c7c8b4f36bc551f49aca61e94b67896eab88b54b164a4487",
      "events": "1bd03bb0d8b23d4edee0c92f889b6b99fda7c5eea5dd4c50f965d8c2e3b33676",
      "frames": "6839eaafee18d6991cb29a2a7d3dad88cdf14f1c571af73e2816a3e09809c70e",
      "lastSpawnFrame": "f18198145c9a9a600e746479723db71d56800aa95da90f37f9772645c276027d",
      "observations": "ac0689a196e562070d4544d0fd4215a36cf15fe3d2ddc55d25bb06bf22c46bcf",
      "final": "4f19d26c390818054d8983160b1482ecb6cb95bd55ccd4fbdbdd799865f6a591"
    }
  },
  {
    "name": "heavyOpening-s127-d6",
    "options": {
      "policy": "heavyOpening",
      "seed": 127,
      "delay": 6
    },
    "expected": {
      "phase": "lost",
      "time": 92,
      "core": 0,
      "unitsLost": 4,
      "gross": 500,
      "refund": 25,
      "balance": 5,
      "guardDamage": 392,
      "cleanup": 44,
      "peakLive": 29
    },
    "digests": {
      "outcome": "c3d0b3959b1ed9c718af3bbc93fee7496591bfdf55dc74f97cdf86486f822366",
      "origin": "43a0b40e0f20f22cb3e6dccb9914d828d24e015ecc1772ee95fbe6f2e1834994",
      "prepared": "d486a762fc2c05f8d4fd45e4f6ac88458b482c45dd83304f87a9aeed6f340844",
      "actions": "c2c30daed03585f14b0999805f78e14a34ab368a16c4864d164d12ea489b8a20",
      "events": "70ab27f75ecdd2b1557faf795f0dd5d58d65bae6a90b415e038937a5f5e7e19b",
      "frames": "c2415235410bec3a69aba704914712f58148e13aa631964bef3a97a45051d07c",
      "lastSpawnFrame": "d3e8048b6eddae612806f0cf666316b545df6f8d90af1de0682bfcad6f9cba7c",
      "observations": "1d8a145f20dc32f4e068861bbdb0f41798e8e14a97f804910c7c31969a353f91",
      "final": "5593a5f0f606f257b3b1bffe99f760f60b3ce85e04b661055e3a03fd417c726f"
    }
  },
  {
    "name": "heavyOpening-s30-d0",
    "options": {
      "policy": "heavyOpening",
      "seed": 30,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "time": 97.21666666666667,
      "core": 4,
      "unitsLost": 2,
      "gross": 500,
      "refund": 40,
      "balance": 20,
      "guardDamage": 195,
      "cleanup": 49.21666666666667,
      "peakLive": 28
    },
    "digests": {
      "outcome": "43c74ae6ff0c16d85ef7c5e8e043ae58ee3e04fe933ebf926aa2cbbdf127e763",
      "origin": "55da101118198a4fab0a9c99e8f9a7a885c8a1f42f08084bf3248684b24d55f7",
      "prepared": "1d6ba5b2a270f1737d540ea39558b9e20bb213adb650415138795ac1bb26bf18",
      "actions": "1b7fca3cac351b32e998becc31451ec40f29e6146d8639934d40504851b3fce4",
      "events": "63391065cc6d5501b9fa648a6105fae2b8c2cdb913f531cda90c1d154c3fbe5a",
      "frames": "61a69f199fc78809234f8c99cb4700d98827aac533e0ed4007a747d1ace10508",
      "lastSpawnFrame": "390c2cd3583524a2ed3556bcf48db9e21946cd2d9ca8ae92c2b2967209448b5d",
      "observations": "120981cba801d70e96a7ffa6e62f802e375592e0a752cd7d2b4af9fe0bc47cfb",
      "final": "fb4238f5029774612027ca0452416633bec98e679ad26f64ea16f222598f848a"
    }
  },
  {
    "name": "heavyOpening-s30-d3",
    "options": {
      "policy": "heavyOpening",
      "seed": 30,
      "delay": 3
    },
    "expected": {
      "phase": "won",
      "time": 92,
      "core": 3,
      "unitsLost": 2,
      "gross": 500,
      "refund": 40,
      "balance": 20,
      "guardDamage": 245,
      "cleanup": 44,
      "peakLive": 28
    },
    "digests": {
      "outcome": "d8d49daf766bdb2200c4d1412e20464a65809345f5820fa35820c25fc10df18b",
      "origin": "55da101118198a4fab0a9c99e8f9a7a885c8a1f42f08084bf3248684b24d55f7",
      "prepared": "1d6ba5b2a270f1737d540ea39558b9e20bb213adb650415138795ac1bb26bf18",
      "actions": "d50b67719798789a8018b59b12770a19bd62d2e176dc97a7fe1530e6b399d120",
      "events": "4a3987f1189a0e1177ac7c8bc699ff451970dd79cc157d43e114634b623f8aff",
      "frames": "569bbbe1ad7a656c59f010fb10fad297db2315dd314b5b562cc5a7ca8a5424b8",
      "lastSpawnFrame": "e7e3e140c406221d12eb4e91e42bf5068d0220d6346de8074a331b0e61a79402",
      "observations": "950df926f52312176c59207b85536ac71f3abe8b393add7c086ccc81b69fdf9e",
      "final": "b6890c5726da0b2f79a8f8d9db6547a1f416a55dfe579f22ae6e169e540adade"
    }
  },
  {
    "name": "heavyOpening-s30-d6",
    "options": {
      "policy": "heavyOpening",
      "seed": 30,
      "delay": 6
    },
    "expected": {
      "phase": "won",
      "time": 92,
      "core": 1,
      "unitsLost": 4,
      "gross": 500,
      "refund": 25,
      "balance": 5,
      "guardDamage": 364,
      "cleanup": 44,
      "peakLive": 29
    },
    "digests": {
      "outcome": "2ca94f63ebd5f66360f310cd91d1db5e331751bed74ffa84094425fa4c5cb6c9",
      "origin": "55da101118198a4fab0a9c99e8f9a7a885c8a1f42f08084bf3248684b24d55f7",
      "prepared": "1d6ba5b2a270f1737d540ea39558b9e20bb213adb650415138795ac1bb26bf18",
      "actions": "1f4fdced5ba0fb849ead4025261f4012f6850f770a34469f0942412d3da3aa96",
      "events": "ecb772ecf2daf652aaebb3c3a07266b4a4ff31d0b17e473ee208ddf98bc30340",
      "frames": "3570d929d8b3c789036d3a0bfc845c48a51f6faa7af87649be2ca516552b9cd0",
      "lastSpawnFrame": "9cd3d5bc70a796e73440aad7a78c1858242bae987420e374123ed28d392c98f8",
      "observations": "03ed3aa172258400ff5c22ebc6938836c067aa6a2c1cb89b9fd47367a41266c9",
      "final": "aa789b8766662710c3e0d0d07cc00460dd1007f40b7d3aef4aa9b5c1882bc7c7"
    }
  },
  {
    "name": "heavyOpening-s7-d0",
    "options": {
      "policy": "heavyOpening",
      "seed": 7,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "time": 88.3,
      "core": 5,
      "unitsLost": 1,
      "gross": 500,
      "refund": 40,
      "balance": 20,
      "guardDamage": 177,
      "cleanup": 40.3,
      "peakLive": 28
    },
    "digests": {
      "outcome": "07ef0e61cec2edd991acded60adba792a382686570d4b34f82ee149bd935996f",
      "origin": "5a08cb76482de08d7ca041d862c7f3383b9b805a1f9d24e69dbd92682a16b162",
      "prepared": "f5d4c46867488bd59a788045e8a3919a3632d5bbacbc802526f172a4e544f7aa",
      "actions": "26f5b39ec5f3c24c4a0725c1c184806dc13bf28505314b438fbf8c0112086b75",
      "events": "322b714c18e61b18cd45a8f4af90f11c99b3e12c67fe18768adeadbbcae0c652",
      "frames": "8ec9601f99e7347f849d35633354df7df0abc8a2255c4258ec5d15ccf29b52e7",
      "lastSpawnFrame": "4096d7b283e8b0f60c865bb07b59f940cc3e59008524af39bf003d0d74cb9118",
      "observations": "4d56375f12a75477bc8a48efb1b1e455f708bd2cfd269466050d4cfcba3f0289",
      "final": "9cd5cffbe64772554280692b010d76025bb0c87f874997bf5088649c1b61e4a3"
    }
  },
  {
    "name": "heavyOpening-s7-d3",
    "options": {
      "policy": "heavyOpening",
      "seed": 7,
      "delay": 3
    },
    "expected": {
      "phase": "won",
      "time": 92,
      "core": 2,
      "unitsLost": 2,
      "gross": 500,
      "refund": 40,
      "balance": 20,
      "guardDamage": 210,
      "cleanup": 44,
      "peakLive": 28
    },
    "digests": {
      "outcome": "e18f6208736f83e23f5ef75b8286393469f5addd5b90b9540e92bf9fcd67a746",
      "origin": "5a08cb76482de08d7ca041d862c7f3383b9b805a1f9d24e69dbd92682a16b162",
      "prepared": "f5d4c46867488bd59a788045e8a3919a3632d5bbacbc802526f172a4e544f7aa",
      "actions": "a7a2da30ce0ade45b5c250d7a33b670a261940cd608d81230191ca0f5eff5500",
      "events": "62b1f473b7dffb1765d4a69ab524562914238b268cb459130ca65922f2b2d33e",
      "frames": "59c88936671abadf287b95d0346baebf85c2ab02e5c3d0eda7f81a1e1e7d6f9e",
      "lastSpawnFrame": "8c0007df795ee0e7c6e53783811b21e10ec4336169ff3deca9f5edabbce44504",
      "observations": "e1503ff64fd782410395c5eb1ea19911b3e6ef94b32d176bad114573a0fba7a4",
      "final": "2a73fcf3abc17b92dd4c3a4fbc48a56f584de0222182a38814966876d3caed04"
    }
  },
  {
    "name": "heavyOpening-s7-d6",
    "options": {
      "policy": "heavyOpening",
      "seed": 7,
      "delay": 6
    },
    "expected": {
      "phase": "won",
      "time": 92,
      "core": 1,
      "unitsLost": 4,
      "gross": 500,
      "refund": 25,
      "balance": 5,
      "guardDamage": 392,
      "cleanup": 44,
      "peakLive": 29
    },
    "digests": {
      "outcome": "7183408374bd8f094a4fe4f78acf1141fdc8d4c0367be636078faa4f3c03dfe9",
      "origin": "5a08cb76482de08d7ca041d862c7f3383b9b805a1f9d24e69dbd92682a16b162",
      "prepared": "f5d4c46867488bd59a788045e8a3919a3632d5bbacbc802526f172a4e544f7aa",
      "actions": "57f3f3566aea39c2f41ad601c1674af47c4f33a7fd758af72758a359d22cd22d",
      "events": "c0f53f0a6d22db7aeec4e108369d3e922a65f22ef6f1591e2e6e6e6398712aaf",
      "frames": "b2bc67fe1c03f47046bb097c5121eb545bd28062bf6107204a3e9b8df2f7be9f",
      "lastSpawnFrame": "722f0ed184d73e6cbae37446738a69969043816339a9d256e2a56e0a828b04b2",
      "observations": "ef8ecd731b7ee20144a79c20ac9fd22c1e09f460d68741951aac2b9659ac43d5",
      "final": "07da3aeb90db8cab106745f4d20d2078b7dc43e260ab7d2e2c35c8e0c8a435b3"
    }
  },
  {
    "name": "pierceReserve-s1-d0",
    "options": {
      "policy": "pierceReserve",
      "seed": 1,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "time": 64.05,
      "core": 5,
      "unitsLost": 0,
      "gross": 360,
      "refund": 0,
      "balance": 120,
      "guardDamage": 0,
      "cleanup": 16.049999999999997,
      "peakLive": 27
    },
    "digests": {
      "outcome": "eab1bc209753bb172f65f8c0d4835a146d851a22675a2a190d76f51c4b48b6f5",
      "origin": "bdedb4e0be3f13934758b387d244b02b328e538b29091328b816e12d41638709",
      "prepared": "bc565ab5411a7f6a8669eccfc6a3638fc7718d7e15bbb2d9526f3122da67c963",
      "actions": "60cd5d9877d71c75a6686b6a557264aba50ff29917469777951f6e5a17e98b80",
      "events": "a2456cbc0718f047951702f747a14be05c032b8b121a58056f626757945cfeba",
      "frames": "468b634fbe734ba9a92391505c9f9c32e11a50ea0c267fe38657de0d39abb42c",
      "lastSpawnFrame": "208fb25c2a3d4e0cb9fe202c08a9acf239912fb26eb3004332619d7e40fd8c7d",
      "observations": "960102dbad140b9488dfdf191f9d0c6fdac1154f3468685fd8b5ed1fa49489c7",
      "final": "5eb2fc4066976d5ac8d3e5f1da85a70b5549f279493f1ddac8c505778ae07a97"
    }
  },
  {
    "name": "pierceReserve-s1-d3",
    "options": {
      "policy": "pierceReserve",
      "seed": 1,
      "delay": 3
    },
    "expected": {
      "phase": "won",
      "time": 65.83333333333333,
      "core": 5,
      "unitsLost": 0,
      "gross": 410,
      "refund": 0,
      "balance": 70,
      "guardDamage": 0,
      "cleanup": 17.83333333333333,
      "peakLive": 27
    },
    "digests": {
      "outcome": "5e11310c74bf8cb4f1b3c1ee3c73c2f9a1193ce196110182eacc11d14ed97178",
      "origin": "bdedb4e0be3f13934758b387d244b02b328e538b29091328b816e12d41638709",
      "prepared": "bc565ab5411a7f6a8669eccfc6a3638fc7718d7e15bbb2d9526f3122da67c963",
      "actions": "6c7d0d70043f61337035e687b84c1279ece65a7aaf72417de9cba3ed6e070536",
      "events": "7a0f4c1f776208370f9ce1d620abb1a8cf1e5838918fac4536449eefb20b9ca7",
      "frames": "3f5f432c5cf5ea0abe3834b18a42a65faec1419a9f8945102aaa936d36d78644",
      "lastSpawnFrame": "398f8f2186a284901b978a4752f740b987175e44848c95add53da05fb400ba4f",
      "observations": "a6eb4237ea29bbb3af46d0ea6d55f2fda757190bbbc6116aef9389b451992858",
      "final": "93719e64866b73d385d2b3d1a9500b216a1ff83ad176f2276aa9af6a79ebe1c5"
    }
  },
  {
    "name": "pierceReserve-s1-d6",
    "options": {
      "policy": "pierceReserve",
      "seed": 1,
      "delay": 6
    },
    "expected": {
      "phase": "won",
      "time": 67.08333333333333,
      "core": 5,
      "unitsLost": 0,
      "gross": 360,
      "refund": 0,
      "balance": 120,
      "guardDamage": 0,
      "cleanup": 19.08333333333333,
      "peakLive": 27
    },
    "digests": {
      "outcome": "5a8a03f7925414bd8df6ee9584bafdae1aa07fb40cd7c6525302fef9ca54d3b9",
      "origin": "bdedb4e0be3f13934758b387d244b02b328e538b29091328b816e12d41638709",
      "prepared": "bc565ab5411a7f6a8669eccfc6a3638fc7718d7e15bbb2d9526f3122da67c963",
      "actions": "80fd5fb874c1446a42cfdc416dccc1dec713f7483cea56f5043dce13d9beb8b2",
      "events": "277508d68c193798b03034975d0d242d59ba4e508dc66e2a066f4ef21cdd4bcc",
      "frames": "2eb3f01f73ea22bdb4b91be438136615fcce17a455982c57193df065ce1f4fce",
      "lastSpawnFrame": "fa20bb8c6dac86b3fe4844d5d9ecec2482fe61e6b9df31cfabc1ddb36bd4fb4c",
      "observations": "cad6d1ef8b3fd7e376baa424e96c02fe5516838b0216e004eef9a10d4fc1fe2c",
      "final": "2f26e2608ea2eddcc52860fbc7783d38963677136a1169c178583074e997091b"
    }
  },
  {
    "name": "pierceReserve-s127-d0",
    "options": {
      "policy": "pierceReserve",
      "seed": 127,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "time": 64.05,
      "core": 5,
      "unitsLost": 0,
      "gross": 410,
      "refund": 0,
      "balance": 70,
      "guardDamage": 0,
      "cleanup": 16.049999999999997,
      "peakLive": 28
    },
    "digests": {
      "outcome": "65fe9e640f2e468be1ee2d6784c669e6f98e8c9f98272302ce5876f7e1271984",
      "origin": "43a0b40e0f20f22cb3e6dccb9914d828d24e015ecc1772ee95fbe6f2e1834994",
      "prepared": "84fd65078625e44e9420ddeae3165d0ef9c8867ed0bc2a7e2e1afd0db8d23c15",
      "actions": "174577a3e1ef15919cc6b1ad70b6e7274aa213aaaee9e791b55337f8c47792f2",
      "events": "bbaa66badb463465ccbd8ebd88e6a5ef6ccc73ac98cd2139c880f9aa9e1c6894",
      "frames": "3902418cc0eb995a1535af44eb733dc54d3617951aef0bde6f5071cb1bb82b05",
      "lastSpawnFrame": "2635b448f087a01c396fcbbe52ecb30ae761875995dc692d2b6d0939b60cd07e",
      "observations": "bcabaf4963b13a28729376361792c19b38813a1da7040ece2ded8019eb63a6bd",
      "final": "32f6ec44c0af5587231b597ac35cdd8c65093385bee1a149723ae70d63c854b1"
    }
  },
  {
    "name": "pierceReserve-s127-d3",
    "options": {
      "policy": "pierceReserve",
      "seed": 127,
      "delay": 3
    },
    "expected": {
      "phase": "won",
      "time": 65.23333333333333,
      "core": 5,
      "unitsLost": 0,
      "gross": 410,
      "refund": 0,
      "balance": 70,
      "guardDamage": 0,
      "cleanup": 17.233333333333334,
      "peakLive": 28
    },
    "digests": {
      "outcome": "7748516ab4f870b74c75ed7582eed112a38d7619a2c682efaedb497bdafe84fc",
      "origin": "43a0b40e0f20f22cb3e6dccb9914d828d24e015ecc1772ee95fbe6f2e1834994",
      "prepared": "84fd65078625e44e9420ddeae3165d0ef9c8867ed0bc2a7e2e1afd0db8d23c15",
      "actions": "7ed5f35a3f4f0ad21aa6a3734ae27091151ad3ad8f5e8fe91f6c4e5946f62b68",
      "events": "926731c834b9787607986b8f1566441d6a1961730ff1d232166fb210c4abf996",
      "frames": "79f7c11c29a069fc3632b1dd4a63d1321bc77b361a94c2072e1388bbf0f968a8",
      "lastSpawnFrame": "a144998ef6827080c696d0d5aa7d85443fa22d79299ab85adde606ce719d67ff",
      "observations": "2e96f4790e30ad6eb3ae4830c2af17a9f6de26fb8d0bd7db67b57c67d5ac819d",
      "final": "d543d5f849637b99adde6494955356a3b86d1f0a3ae2f71e332b84034993e04a"
    }
  },
  {
    "name": "pierceReserve-s127-d6",
    "options": {
      "policy": "pierceReserve",
      "seed": 127,
      "delay": 6
    },
    "expected": {
      "phase": "won",
      "time": 69.55,
      "core": 5,
      "unitsLost": 0,
      "gross": 410,
      "refund": 0,
      "balance": 70,
      "guardDamage": 0,
      "cleanup": 21.549999999999997,
      "peakLive": 28
    },
    "digests": {
      "outcome": "e8ae3e3b9f1bdbd36eb5e1a58eeedaf6060134596db782db9f0bc77422a02bdd",
      "origin": "43a0b40e0f20f22cb3e6dccb9914d828d24e015ecc1772ee95fbe6f2e1834994",
      "prepared": "84fd65078625e44e9420ddeae3165d0ef9c8867ed0bc2a7e2e1afd0db8d23c15",
      "actions": "2f3239eb09c03ddf640bdd72c9a7a24d796aa4a9601302b52b67576c71a02f0c",
      "events": "8046b96c27896704bc66d5aef85f723360cde210fb2b2c42ce18fae94dd68bfe",
      "frames": "202a7d0df8a67bf0dd361b66149ac373a0763247b8126f3451d1cca568533237",
      "lastSpawnFrame": "9204ee4057751029935f990ac74f8f88da5334456343c7ef2f415b7363d60b43",
      "observations": "dfa19090d91d616d368622cc9b478432121f72cdb5be95e2083eae74fc5a9d6d",
      "final": "c57ef7ba08c68ab16139f97381520784ec1a04f42b9a0dfd5e38ee0984ee4e7d"
    }
  },
  {
    "name": "pierceReserve-s30-d0",
    "options": {
      "policy": "pierceReserve",
      "seed": 30,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "time": 64.05,
      "core": 5,
      "unitsLost": 0,
      "gross": 410,
      "refund": 0,
      "balance": 70,
      "guardDamage": 0,
      "cleanup": 16.049999999999997,
      "peakLive": 27
    },
    "digests": {
      "outcome": "aee172d6b6670cdee4326eeef4b0b3e3af3348aed154130f37c43ee6146a4e90",
      "origin": "55da101118198a4fab0a9c99e8f9a7a885c8a1f42f08084bf3248684b24d55f7",
      "prepared": "add96e9d46f095c7cfcb15749fd812e7829d61e60102fafe11a0b706a548c231",
      "actions": "473303c735e3f606f27b89c7211adb6c71f2d09813e929395b3edfc74c5f6fb8",
      "events": "b1cfbf782028105b7e379696026229c03b9b223b0ea57daa4bcd422417002bfc",
      "frames": "d1f5d73a526a9becf6d3d906657a75ff814ece444949b90a3245a674851dc221",
      "lastSpawnFrame": "c8a3910266568a38ff8ff794117a9f3666b49ea0bfb781a562954faf6e8ca1b9",
      "observations": "aab96c963017b8bed7d16ad34308031d5851271db9ceb08c5f2840b68a0a2fe3",
      "final": "dc3929a71efdccb24afdc5ceac7632e0fe9fb7f38f6692bbed80697410becca7"
    }
  },
  {
    "name": "pierceReserve-s30-d3",
    "options": {
      "policy": "pierceReserve",
      "seed": 30,
      "delay": 3
    },
    "expected": {
      "phase": "won",
      "time": 65.23333333333333,
      "core": 5,
      "unitsLost": 0,
      "gross": 410,
      "refund": 0,
      "balance": 70,
      "guardDamage": 0,
      "cleanup": 17.233333333333334,
      "peakLive": 27
    },
    "digests": {
      "outcome": "e04ddcf8ed07c12223fcf42e3cb4212df901214ed34c8e525bce2642d07b0b23",
      "origin": "55da101118198a4fab0a9c99e8f9a7a885c8a1f42f08084bf3248684b24d55f7",
      "prepared": "add96e9d46f095c7cfcb15749fd812e7829d61e60102fafe11a0b706a548c231",
      "actions": "693924330fd8220a420002985dbd67b77774201f4596a11b589813e36752c52f",
      "events": "f29ee692e61eb7c6e82f7364d102318e6c81aad5123f083dd9c6e52ce4fa1ef7",
      "frames": "d9d08cd1e10dcabdc92d742a14defd13dd56bae4094e512d1f74fe0367bf2a96",
      "lastSpawnFrame": "5fdfd079ab387eeb837d15962d3a4c5121342b12450e693803c459740a1855f6",
      "observations": "6838fddc034e98273c758409fd1429482c6c07a82fe58c4afd807a6687e7afe8",
      "final": "28c10da0707ca3dece08658b5a58a6d87e84a72ea79c4bc044542709b5a818cd"
    }
  },
  {
    "name": "pierceReserve-s30-d6",
    "options": {
      "policy": "pierceReserve",
      "seed": 30,
      "delay": 6
    },
    "expected": {
      "phase": "won",
      "time": 68.18333333333334,
      "core": 5,
      "unitsLost": 0,
      "gross": 410,
      "refund": 0,
      "balance": 70,
      "guardDamage": 0,
      "cleanup": 20.183333333333337,
      "peakLive": 27
    },
    "digests": {
      "outcome": "3d5ffddc45fadf3ae283a07ff18b7431a2f04bb710efdab21ca0f30c81f4437b",
      "origin": "55da101118198a4fab0a9c99e8f9a7a885c8a1f42f08084bf3248684b24d55f7",
      "prepared": "add96e9d46f095c7cfcb15749fd812e7829d61e60102fafe11a0b706a548c231",
      "actions": "e483c57a5af9749bf582f581654b139747eef7a7c3ceed770d8ef59fcb360e28",
      "events": "5672abf2fdc6ef70ba561d5ffd06f129a0d7cc50a73bf26cc73f8089963cd21b",
      "frames": "a9459322ae7d493f8109ed53fab055893774092ac68f27d1203a2e9c6add0e9f",
      "lastSpawnFrame": "f6eb6544ca6cd302ec6ac7340a047be8cd113a42b3da22c0c7b66aa66ba6e751",
      "observations": "e28af2e414eaa28ae2c73f5a43ddd750f825c8d8e12357cdf1053624daff0831",
      "final": "630c36a9d7f62738f8929ed144b6c51385224216bc01c0621d75185b00cf24e0"
    }
  },
  {
    "name": "pierceReserve-s7-d0",
    "options": {
      "policy": "pierceReserve",
      "seed": 7,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "time": 64.23333333333333,
      "core": 5,
      "unitsLost": 0,
      "gross": 410,
      "refund": 0,
      "balance": 70,
      "guardDamage": 0,
      "cleanup": 16.233333333333334,
      "peakLive": 28
    },
    "digests": {
      "outcome": "dcad8d9c257de03fe7ef3a27b7ba73138166f6fc71672b686be8dae801e070c9",
      "origin": "5a08cb76482de08d7ca041d862c7f3383b9b805a1f9d24e69dbd92682a16b162",
      "prepared": "d9ad0cd1547672bdf4fd27cbe7a4215552b36feac95f5f3e6a8f73213d1bed41",
      "actions": "d46939d71d7a51a18366ac83f9f418d4fcec2b3923c49d62225f58497c4263a9",
      "events": "052cf1d0e14860997cbbac5c6256ed75d38c63aa94defcf412d4270ba64681bb",
      "frames": "c1a802a650bc9fab69023ff718ef08d5a8095aa81ab9113213e7221b9be33302",
      "lastSpawnFrame": "c65abadbc2ccdca16f338f8b647fbf94fdbcf2560743e2c70b6bcf67863b0ef1",
      "observations": "de0d40a3a0cac2f0072703df47329924d4edb84a409ac119235a29bb835b27b6",
      "final": "469cea7d1e0f4aceeb6e8473dbb13222ebc4f543cbcca2a95a12ccc6fbabc363"
    }
  },
  {
    "name": "pierceReserve-s7-d3",
    "options": {
      "policy": "pierceReserve",
      "seed": 7,
      "delay": 3
    },
    "expected": {
      "phase": "won",
      "time": 65.23333333333333,
      "core": 5,
      "unitsLost": 0,
      "gross": 410,
      "refund": 0,
      "balance": 70,
      "guardDamage": 0,
      "cleanup": 17.233333333333334,
      "peakLive": 28
    },
    "digests": {
      "outcome": "2d4440f8203e4cc0d60f819dc5aa9ea5f553c477d55cefc7ef8e1d3117d580a3",
      "origin": "5a08cb76482de08d7ca041d862c7f3383b9b805a1f9d24e69dbd92682a16b162",
      "prepared": "d9ad0cd1547672bdf4fd27cbe7a4215552b36feac95f5f3e6a8f73213d1bed41",
      "actions": "c52f495b44d3cd093094ad074f8381ffad8bd73a2a7d54cefe08291c9843f38c",
      "events": "0f0887a907c56d6ea92aa69f7d7432e227c7bcb17bbcc63f05554ee9d47e6479",
      "frames": "b0db37722778895648da02c86a95632119170dfb2f9732d177914945dff82364",
      "lastSpawnFrame": "16587b3e4981b99554b3ae29d7984a8c936d4e707393bf390a4c163cf82c8ad7",
      "observations": "5070c087dc1985799b26c9f4ac5378172f502af8c96a9d67e2fe21037e3941b2",
      "final": "114e6345fc0963064b0f8c1c2eb00664a42194b2fd591e4f179faa33d82c7718"
    }
  },
  {
    "name": "pierceReserve-s7-d6",
    "options": {
      "policy": "pierceReserve",
      "seed": 7,
      "delay": 6
    },
    "expected": {
      "phase": "won",
      "time": 68.18333333333334,
      "core": 5,
      "unitsLost": 0,
      "gross": 410,
      "refund": 0,
      "balance": 70,
      "guardDamage": 0,
      "cleanup": 20.183333333333337,
      "peakLive": 28
    },
    "digests": {
      "outcome": "06d9e9d055bdd55dbd718f0db2fbc97ac6612639837042d0e57c259a80af7d27",
      "origin": "5a08cb76482de08d7ca041d862c7f3383b9b805a1f9d24e69dbd92682a16b162",
      "prepared": "d9ad0cd1547672bdf4fd27cbe7a4215552b36feac95f5f3e6a8f73213d1bed41",
      "actions": "b374530aa1387b7c2a1c342ed3dd5d83c3330dd9a5ec7569cae9cef7c6b9c356",
      "events": "483612c7cae26b134eb3f10a0a1b2b0855372ad5eb931c8667106535b0aa4847",
      "frames": "41bcd36ee19b40be4241c013e081d7105546ed60a01254a9f7bf4cf186316c99",
      "lastSpawnFrame": "7fa4f77d1734a26842d55d5e4eee2682c25d18670446281857f03199b457725f",
      "observations": "600e7eacc3b3bcfa3e11f1667fd96a32749e0120853fe065326a03e50f49542a",
      "final": "84b2765a79e52efde4420d99b86012c228d6cf85b84176c5543c2a1e5131fb33"
    }
  },
  {
    "name": "selectiveHeavy-s1-d0",
    "options": {
      "policy": "selectiveHeavy",
      "seed": 1,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "time": 79.4,
      "core": 5,
      "unitsLost": 1,
      "gross": 450,
      "refund": 0,
      "balance": 30,
      "guardDamage": 173,
      "cleanup": 31.400000000000006,
      "peakLive": 29
    },
    "digests": {
      "outcome": "93d9c81107d4133d0af54891630be3743be603bede8788b2351d9b65adb11522",
      "origin": "bdedb4e0be3f13934758b387d244b02b328e538b29091328b816e12d41638709",
      "prepared": "7f40107d2cc14626f4ae481c527356757b81e86264503b239ccce97aa5d2fa2e",
      "actions": "bda078e95d9551fa6cd7aba4b15e60d455da4195fdf5b9c4c8b9800c1ef18d1c",
      "events": "b23e1918e8478005d35f293fc5b8810cc1516b883eeff934f5c0eafd2d473945",
      "frames": "3347b1213d035472f08eafa8420c79df336731440cb11232037b1880dd7e1693",
      "lastSpawnFrame": "2a216e7334c9d87034dc9f6f0c2f104db61638c0e9587bd301b64a079636dc10",
      "observations": "96dab6932e235ba89d97ed499b18e35cbe6bcee30ce784a50e481d65f39f7872",
      "final": "09cbda731803f53be720a5be0cef153ce61722af25a2ea14dcdb815357ef91f2"
    }
  },
  {
    "name": "selectiveHeavy-s1-d3",
    "options": {
      "policy": "selectiveHeavy",
      "seed": 1,
      "delay": 3
    },
    "expected": {
      "phase": "won",
      "time": 82.11666666666666,
      "core": 5,
      "unitsLost": 2,
      "gross": 500,
      "refund": 25,
      "balance": 5,
      "guardDamage": 188,
      "cleanup": 34.11666666666666,
      "peakLive": 29
    },
    "digests": {
      "outcome": "49c174735ac55bba9506f90d52ce618dec5b5becb04bedb50775a04906a82ae7",
      "origin": "bdedb4e0be3f13934758b387d244b02b328e538b29091328b816e12d41638709",
      "prepared": "7f40107d2cc14626f4ae481c527356757b81e86264503b239ccce97aa5d2fa2e",
      "actions": "e7cc4060b65606a2e5c0f78c489ea1b45f8aa82c00e9683deff06c8e265c4605",
      "events": "f3b4945d1e293a46fce13545abc31735eecd7025dd74cd87c84fb51974ae2a13",
      "frames": "bba71991145d6708cee5aa935359d77abd87b3082dbd33c3a46cd0a3398cb0a2",
      "lastSpawnFrame": "4f96a9f8631f917b21891ce8c571df2d12942925380850ba260f805bc46a0477",
      "observations": "4f3c7a15935a066b849367df87ca2561bd8fb44452fde4053ab6ce810f95723f",
      "final": "7ad1bdc8fdbf33e3fcd45c3280064f2fff6849f8ed96252de9214227a40734fe"
    }
  },
  {
    "name": "selectiveHeavy-s1-d6",
    "options": {
      "policy": "selectiveHeavy",
      "seed": 1,
      "delay": 6
    },
    "expected": {
      "phase": "won",
      "time": 86.4,
      "core": 5,
      "unitsLost": 2,
      "gross": 500,
      "refund": 25,
      "balance": 5,
      "guardDamage": 305,
      "cleanup": 38.400000000000006,
      "peakLive": 29
    },
    "digests": {
      "outcome": "4731d2867f1d3ada4cefc6825a46cce4709b5ec17996e3c5d4b4b0e7dcf6bc4a",
      "origin": "bdedb4e0be3f13934758b387d244b02b328e538b29091328b816e12d41638709",
      "prepared": "7f40107d2cc14626f4ae481c527356757b81e86264503b239ccce97aa5d2fa2e",
      "actions": "a3678bf4506621e6ff0b50ae8fddaad801b5ada49cddedea98f1343f9fe53998",
      "events": "a925d48f588eb4f884c14b4a08a5ab472eabb2326441011b179dbb3ff6d9cda0",
      "frames": "eba4c29afdc006a5be40213ca28d671449c39ac32d81f42f64170d2563740fe2",
      "lastSpawnFrame": "d2168a45334e1eb3a9000678bcfd9e9387f304e76bff2876b2b4b14b42472aca",
      "observations": "e92b8cc3c05884624b828e293552ae49b974a549e3f18d7052aeec945f113d01",
      "final": "e534ab1e2c90a970ffde19d3d87f37e09f3d107d12af59895b346a7dd258c5be"
    }
  },
  {
    "name": "selectiveHeavy-s127-d0",
    "options": {
      "policy": "selectiveHeavy",
      "seed": 127,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "time": 81.3,
      "core": 5,
      "unitsLost": 2,
      "gross": 500,
      "refund": 25,
      "balance": 5,
      "guardDamage": 191,
      "cleanup": 33.3,
      "peakLive": 28
    },
    "digests": {
      "outcome": "d70d121b6066d147943621e056f00e374a9d532878d6606af113f9426d011104",
      "origin": "43a0b40e0f20f22cb3e6dccb9914d828d24e015ecc1772ee95fbe6f2e1834994",
      "prepared": "6c90ba6d80d03c050712af5805d529b35ff2df6353522b886f531614c9ab269d",
      "actions": "c8b42d171c62485cbd6425676fd6e51f7f0dcbc7604c2eb40f35120e5a1ab79e",
      "events": "315f2cc65a0a16cfcbfcc33389fa8e0476ac0cda363acf25fe7ce4267153aeeb",
      "frames": "d60e8e6574d3e47208ee4bc3f3313c2c40beb9a89a27549de4ff63ac8f6bef15",
      "lastSpawnFrame": "8e0dbc827f463ff1ca6f99b753fa4076fc59fb1024f9796c28b6f0ec5fb52ff4",
      "observations": "d4fd161ef0faacd7a043c9bc56589665cb1c9a7563b10905f05c11c9bcf4f11e",
      "final": "a44c8f47671f47ffed911ddd838b883d6c9e2b52af81b9dc5bd7c28bf7f0fcf4"
    }
  },
  {
    "name": "selectiveHeavy-s127-d3",
    "options": {
      "policy": "selectiveHeavy",
      "seed": 127,
      "delay": 3
    },
    "expected": {
      "phase": "won",
      "time": 84.53333333333333,
      "core": 5,
      "unitsLost": 3,
      "gross": 500,
      "refund": 40,
      "balance": 20,
      "guardDamage": 309,
      "cleanup": 36.53333333333333,
      "peakLive": 29
    },
    "digests": {
      "outcome": "8fce8c654052481ff14cedd4fc2d7bbf76b14e4ce3ca5537ba016f57df0444c2",
      "origin": "43a0b40e0f20f22cb3e6dccb9914d828d24e015ecc1772ee95fbe6f2e1834994",
      "prepared": "6c90ba6d80d03c050712af5805d529b35ff2df6353522b886f531614c9ab269d",
      "actions": "2c0892685a440951fdacb79977d8c3943dece6f54f813753e2f250e327faf2a6",
      "events": "b10905781cc0da932c98b36c0c2f8ec5c3859dd004994d80b905cae3de8f3c88",
      "frames": "3f2e3242850d00f9686037dd9c4f69d056a30f2049bf61f93ff7b0408b803451",
      "lastSpawnFrame": "01fccb31feb939cc04aa6379a4e01acbd356920e5c24e214ce1eb80ae793c813",
      "observations": "b73df0291ad27706ec1d75a8798dd3f97d69f0ac83e1bdb09ce3dbcbf4b5e42b",
      "final": "17ea1005086d790f43c1d60ba714aa04dee837ebe94d03836d814f9d84d388b9"
    }
  },
  {
    "name": "selectiveHeavy-s127-d6",
    "options": {
      "policy": "selectiveHeavy",
      "seed": 127,
      "delay": 6
    },
    "expected": {
      "phase": "won",
      "time": 87.8,
      "core": 5,
      "unitsLost": 2,
      "gross": 500,
      "refund": 25,
      "balance": 5,
      "guardDamage": 394,
      "cleanup": 39.8,
      "peakLive": 30
    },
    "digests": {
      "outcome": "93c7a5402d40cc5bd0be62ba7e52abc077a9206a51c044468d2af295585f5de6",
      "origin": "43a0b40e0f20f22cb3e6dccb9914d828d24e015ecc1772ee95fbe6f2e1834994",
      "prepared": "6c90ba6d80d03c050712af5805d529b35ff2df6353522b886f531614c9ab269d",
      "actions": "69f81ede37d929b2d036d9b51e5ca11f5205f9df6cb39ee773f9669c120b14a4",
      "events": "df60c3e769a4bad8dea8a9418342f3b4a6efd752e91f8c874140150de5d77b62",
      "frames": "c9d835db4ccbf8a8274212702089109cde9f2cf066a1a8ead6f4f09c47fc6b8d",
      "lastSpawnFrame": "df8305a66f80037b11b6a8050760e32c666c2b914d4a6b1c9f749ca1209e0a3e",
      "observations": "7ddbfc453df9b3b458e02ebbb30b6a3f137bcd04944e360ebccd20c94783022b",
      "final": "b04128101a0d1dbdb933a563ebf3be13a625a74e1661eb540b12471cb0055e4a"
    }
  },
  {
    "name": "selectiveHeavy-s30-d0",
    "options": {
      "policy": "selectiveHeavy",
      "seed": 30,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "time": 82,
      "core": 5,
      "unitsLost": 2,
      "gross": 500,
      "refund": 25,
      "balance": 5,
      "guardDamage": 198,
      "cleanup": 34,
      "peakLive": 28
    },
    "digests": {
      "outcome": "9291ceeda4a7e53de11ddeb0a04d35cf117f07e45fb6cb687016259da9ccb7c9",
      "origin": "55da101118198a4fab0a9c99e8f9a7a885c8a1f42f08084bf3248684b24d55f7",
      "prepared": "b3b9eb67cc1f952b0082e462c44d18887c263cbc57932b1d4d45db4aeb28ba50",
      "actions": "bc45d6d1ef29d3b2b369918d285be4e5b39d4400125d81d33935b11b6bb2c129",
      "events": "854f91857b44a2d6d0a36e475c325ae5adf705becc316d13e15409d078ee1e0f",
      "frames": "68e44a74df9fadfd9d9e3fb518ac99f9a008c7a5dc926a70bb543fbeefaedb84",
      "lastSpawnFrame": "073298b1d1f95ee9c6e7ddfe4d523d9e376b36d37c5328e980f97b350f83c790",
      "observations": "1d4561f52aa139ff33483b4506be85e00c0b570f78c6c17a7bbaeccfce0c671e",
      "final": "6ae70647a095b3b7821c7c1c3c8e13a55fa72f7b0c3dcd10632a03b3351c68c5"
    }
  },
  {
    "name": "selectiveHeavy-s30-d3",
    "options": {
      "policy": "selectiveHeavy",
      "seed": 30,
      "delay": 3
    },
    "expected": {
      "phase": "won",
      "time": 83.1,
      "core": 5,
      "unitsLost": 3,
      "gross": 500,
      "refund": 40,
      "balance": 20,
      "guardDamage": 302,
      "cleanup": 35.099999999999994,
      "peakLive": 29
    },
    "digests": {
      "outcome": "b18aab2e8361c8e8d8d15342b63c0e36bfd7c5ad8c32df8599c96fef31019f5d",
      "origin": "55da101118198a4fab0a9c99e8f9a7a885c8a1f42f08084bf3248684b24d55f7",
      "prepared": "b3b9eb67cc1f952b0082e462c44d18887c263cbc57932b1d4d45db4aeb28ba50",
      "actions": "30354e78bf7d3130ad3b56ad53ed683a6424f6de69476f1775657f7f864e06fd",
      "events": "1c9676a40fd0d6c568c4f9d258154a65a9f633d96fca7d373fada59a2094ec06",
      "frames": "5857bff7a445f8995a5d1d1adc436a83c49faa28c00268bf4cc006722b2051fc",
      "lastSpawnFrame": "85455fa83a71a6f3faa8fe1240f92acffa09f2f18cbea20ab358b8891918ead2",
      "observations": "aa0b4c66cb6bc07019873b38119a95bbe895c0e88e516ff2dc51e0d2f858686d",
      "final": "8207c5824b760e63ecb37c2f24888d04f80ca7b24493b35974db63aa1686395e"
    }
  },
  {
    "name": "selectiveHeavy-s30-d6",
    "options": {
      "policy": "selectiveHeavy",
      "seed": 30,
      "delay": 6
    },
    "expected": {
      "phase": "won",
      "time": 97.21666666666667,
      "core": 4,
      "unitsLost": 3,
      "gross": 500,
      "refund": 25,
      "balance": 5,
      "guardDamage": 362,
      "cleanup": 49.21666666666667,
      "peakLive": 29
    },
    "digests": {
      "outcome": "0764501d1b9ead650b299d2083cecf9ce3bdfb9ec9ae375555a67bc93f8414bd",
      "origin": "55da101118198a4fab0a9c99e8f9a7a885c8a1f42f08084bf3248684b24d55f7",
      "prepared": "b3b9eb67cc1f952b0082e462c44d18887c263cbc57932b1d4d45db4aeb28ba50",
      "actions": "58e4493c1337a103884c389886384c2a5b3fc1cbfd0d12f840bc663ff5776a91",
      "events": "42a79cd93e9e702e9a20fe10820b4d675c755fd236493f95401a598529a2f2dd",
      "frames": "a4ffdb6af72dbf01b77ce48fc89ab6826e87c4a7e72d76bf149e4d11329eaf4b",
      "lastSpawnFrame": "b29483236e9e435bb062ed0a9d6117c6b22015d6a99edb71793e72c942bc8c04",
      "observations": "263fe10cfacdb5990aec445962aba420c4bd762f573936d8023daa9e8e6ae4ce",
      "final": "31b739b5fb8b80f736ad8d3e36d4ae83b1de855f76a8b8d5f8e5be4882489223"
    }
  },
  {
    "name": "selectiveHeavy-s7-d0",
    "options": {
      "policy": "selectiveHeavy",
      "seed": 7,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "time": 79.6,
      "core": 5,
      "unitsLost": 1,
      "gross": 500,
      "refund": 25,
      "balance": 5,
      "guardDamage": 191,
      "cleanup": 31.599999999999994,
      "peakLive": 28
    },
    "digests": {
      "outcome": "cb7e72b2c89ce3f72c3eb00e30e5399e385972f1a0058815425b1016b9a8224b",
      "origin": "5a08cb76482de08d7ca041d862c7f3383b9b805a1f9d24e69dbd92682a16b162",
      "prepared": "8cb723f377c214968121fec16e8f54b381f5bdf092a5759f411ce733f95fa969",
      "actions": "6ef11f031fc81761992fa922002bb03b7d8c11422f1a4b080271c50b8d19122f",
      "events": "f01ef81cd0ec43f39ced0bad7b006f0be2fbdb139ebe937b0e121232d5e0f419",
      "frames": "b3c14c8f2a2c3e61e5d9edb414d8369418e34b7a1939219590a945dffc3ead82",
      "lastSpawnFrame": "296c197d3b5eab9fbae7f628c0519b38b535f524ba24031cd4cc901fe729d7fb",
      "observations": "2473dc1ae895b48df1a5ce458378fd1f831b5c8ca1ec8ad5e5dfec52b2087ac0",
      "final": "a62a2ffe7869e21ce9c9904b10d963e57758a4d1233e893fab3d97bf47bb274d"
    }
  },
  {
    "name": "selectiveHeavy-s7-d3",
    "options": {
      "policy": "selectiveHeavy",
      "seed": 7,
      "delay": 3
    },
    "expected": {
      "phase": "won",
      "time": 78,
      "core": 5,
      "unitsLost": 1,
      "gross": 500,
      "refund": 25,
      "balance": 5,
      "guardDamage": 277,
      "cleanup": 30,
      "peakLive": 29
    },
    "digests": {
      "outcome": "b676ffe21a114a811232e519f874806e05a458b50c38354e341e3d9f687f4409",
      "origin": "5a08cb76482de08d7ca041d862c7f3383b9b805a1f9d24e69dbd92682a16b162",
      "prepared": "8cb723f377c214968121fec16e8f54b381f5bdf092a5759f411ce733f95fa969",
      "actions": "70e106a7252f8498a1ec98af8b4f985190d3cf9bec4acff63eff9e97ae89a62f",
      "events": "2172c045a1086d76df9bdba8e9020e0f3fb4f751f17d627a20e3ab500cade6cc",
      "frames": "3bff02df9d1efca29f71f0c95914c31e8ef7b2cc6758f9863802453cbd6baf96",
      "lastSpawnFrame": "6e5189102d62445dd5ad880d14d5ada341e4367684309f8481ee75a1bd2f7f39",
      "observations": "8e5adb537559d0880d883f50d57a7bd41865ff68b2da1e9668b04003fc5f8adf",
      "final": "923b28b62f55a7ea839eec5643f3bdcd659b493942a80fc7a545535cda16e935"
    }
  },
  {
    "name": "selectiveHeavy-s7-d6",
    "options": {
      "policy": "selectiveHeavy",
      "seed": 7,
      "delay": 6
    },
    "expected": {
      "phase": "won",
      "time": 82.9,
      "core": 5,
      "unitsLost": 2,
      "gross": 500,
      "refund": 25,
      "balance": 5,
      "guardDamage": 323,
      "cleanup": 34.900000000000006,
      "peakLive": 29
    },
    "digests": {
      "outcome": "d5b56af56edf744c448c7a2758eb136068915733209e5e21bceb93aa548143bc",
      "origin": "5a08cb76482de08d7ca041d862c7f3383b9b805a1f9d24e69dbd92682a16b162",
      "prepared": "8cb723f377c214968121fec16e8f54b381f5bdf092a5759f411ce733f95fa969",
      "actions": "ac96b1465cf16484bb70671d68a8de7f09cb76eadb3e5b6d91dd3d8661524618",
      "events": "83655278f8d185a0f60256b2230d5773a8d335ab178227cb8aa5c82838c2933a",
      "frames": "72f9e2ecae22a4f67a32672a592365401629b6a4e927fec473329ee5732495f5",
      "lastSpawnFrame": "0cb3d7d046d250ccf9700fe9624857bc9f4dba73281ac3c6a7b47850ca6f5074",
      "observations": "42fe0e937c15c7fb6bc0d89523253e769a5ef2476e839cfc6bc4495780421236",
      "final": "9bb33f4c64766aa68ab3c6756b81945955ae76cc92edd745badba3d7f2aceb6c"
    }
  }
];

function run(){
let wins=0,losses=0,negativeCore=0,deployments=0,withdrawals=0;
const outcomes=[];
for(const f of fixtures){
 const c=makeController(f.options.seed),r=simulate({...f.options,controller:c});outcomes.push(r.outcome);
 for(const [k,v] of Object.entries(f.expected))assert.equal(r.outcome[k],v,f.name+': '+k);
 for(const [k,v] of Object.entries(f.digests))assert.equal(digest(r[k]),v,f.name+': exact '+k);
 assert.equal(r.origin.level,8);assert.equal(r.origin.compute,180);assert.equal(r.origin.core,5);
 assert.deepEqual(r.origin.unlocked,['deepseek','gpt','claude','grok']);
 for(const a of r.actions){assert(a.result.ok);assert(a.before.compute>=0&&a.after.compute>=0);
  if(a.kind==='deploy'){deployments++;assert.equal(a.before.compute-a.after.compute,E.definitions.units[a.args[2]].cost);}
  if(a.kind==='emergencyWithdraw'){withdrawals++;const u=a.before.units.find(u=>u.id===a.args[0]);assert.equal(a.after.compute-a.before.compute,E.definitions.units[u.type].cost/2);}
 }
 assert(!r.actions.some(a=>a.kind==='collect'));
 const frozen=JSON.stringify(c.state);assert.deepEqual(c.tick(1),[]);assert.equal(JSON.stringify(c.state),frozen);assert(c.retry().ok);assert.deepEqual(c.state,r.prepared);
 wins+=r.outcome.phase==='won';losses+=r.outcome.phase==='lost';negativeCore+=r.outcome.core<0;
}
assert.equal(fixtures.length,72);assert.equal(wins,59);assert.equal(losses,13);assert.equal(negativeCore,8);assert.equal(deployments,537);assert.equal(withdrawals,37);
assert.equal(JSON.stringify(E.levels),contentBefore);
console.log(JSON.stringify({suite:'Rotating siege frozen policies',runs:fixtures.length,wins,losses,negativeCore,deployments,withdrawals}));
}
module.exports={simulate,makeController,controllerAction,fixtures};
if(require.main===module)run();
