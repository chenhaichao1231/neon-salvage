'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const E=require('./td-lanes-content');
const digest=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
// FINAL bounded policy audit: not optimality, human fun or browser acceptance.
// Initial failures and the rejected cheapest-idle-only refund rule remain in the
// private study archive. Final recovery chooses a refund sufficient for rescue.
// Heavy is a contrast, not a recommended viable policy; all six losses are kept.
// Constants derive ONLY from frozen study traces, before integration execution.
// Complete 60Hz actions/events, initial/final state and sampled frames are exact:
// no float tolerance, omitted fields, accumulator removal or text normalization.
// Frozen trace states contain numeric level 7, not briefing prose. Scheduled
// epsilon below is the original policy timing rule, NOT comparison tolerance.
// Uses production raw7 directly. Never mutates content or injects state/schedules.
const contentBefore=JSON.stringify(E.levels);
assert.equal(E.levels.length,9);
assert.equal(digest(E.levels[7]),'a9b6f44798904a1ff099c49305438e5c0d670072014dc818aa7f2825ca1a7090');
function simulate({version='v1',policy='broadBolts',seed=1,delay=0,withdraw=true,level=null,trace=true}={}){
 const s=E.create(level===null?7:level,{seed}),actions=[],events=[],frames=[],considered=[];
 const gross=()=>actions.filter(a=>a.kind==='deploy'&&a.result.ok).reduce((sum,a)=>sum+E.definitions.units[a.type].cost,0);
 const remaining=row=>E.preview(s.level).slice(s.nextSpawn).some(p=>p.row===row)||s.enemies.some(e=>e.row===row);
 const idle=()=>s.units.filter(u=>!remaining(u.row)).sort((a,b)=>E.definitions.units[a.type].cost-E.definitions.units[b.type].cost||a.row-b.row||a.col-b.col);
 const act=(kind,args,reason)=>{const before=s.compute,result=E[kind](s,...args),a={time:s.time,kind,args,reason,before,after:s.compute,result};if(kind==='deploy')Object.assign(a,{row:args[0],col:args[1],type:args[2]});actions.push(a);assert(result.ok,JSON.stringify(a));return result;};
 const paid=(kind,args,reason)=>{if(s.phase==='battle'){act('pause',[true],'paid decision');const before=JSON.stringify(s);assert.deepEqual(E.step(s,1),[]);assert.equal(JSON.stringify(s),before);}const result=act(kind,args,reason);if(s.phase==='battle')act('pause',[false],'resume');return result;};
 const buy=(row,col,type,reason)=>paid('deploy',[row,col,type],reason);
 const refundForRecovery=t=>{if(!withdraw||s.stats.emergencyCount)return false;const candidates=idle();let u=candidates.find(u=>s.compute+E.definitions.units[u.type].cost/2>=50)||candidates.sort((a,b)=>E.definitions.units[b.type].cost-E.definitions.units[a.type].cost)[0];if(!u){u=t.us.filter(u=>u.hp<=36&&s.compute+E.definitions.units[u.type].cost/2>=50).sort((a,b)=>a.hp-b.hp)[0];}if(!u)return false;paid('emergencyWithdraw',[u.id],!remaining(u.row)?'ordinary recovery: exhausted lane refund':'ordinary recovery: endangered guard replacement');return true;};
 let queue=[];const plan=(time,row,col,type,reason)=>queue.push({due:time+delay,time:time+delay,row,col,type,reason});
 if(policy==='broadBolts'||policy==='familiarBroad'){
  if(policy==='broadBolts'){[0,2,4].forEach(row=>buy(row,0,'deepseek','initial mixed-lane coverage'));plan(10,1,0,'deepseek','cover slower lane2');plan(22,3,0,'deepseek','cover slower lane4');}
  else{[0,1,2].forEach(row=>buy(row,0,'deepseek','initial broad coverage'));plan(10,3,0,'deepseek','cover lane4');plan(22,4,0,'deepseek','cover lane5');}
  plan(28,0,1,'deepseek','reinforce first mixed packet');plan(40,2,1,'deepseek','reinforce center mixed packet');plan(52,4,1,'deepseek','reinforce third mixed packet');
 }else if(policy==='piercePacket'){
  buy(0,0,'gpt','initial piercing through mixed packet');buy(2,0,'deepseek','initial center coverage');
  plan(10,4,0,'deepseek','cover third mixed lane');plan(22,1,0,'deepseek','cover slower lane2');plan(28,3,0,'deepseek','cover slower lane4');plan(40,2,1,'deepseek','reinforce center mixed packet');plan(52,4,1,'grok','catch third-lane pursuers');
 }else if(policy==='heavyThenLight'){
  buy(0,0,'claude','clear leading armor');buy(2,0,'deepseek','initial center coverage');
  plan(16,4,0,'deepseek','cover third mixed lane');plan(28,1,0,'deepseek','cover slower lane2');plan(34,3,0,'deepseek','cover slower lane4');plan(46,2,1,'deepseek','reinforce center mixed packet');plan(64,4,1,'grok','catch third-lane pursuers');
 }else throw Error(policy);
 const initial=JSON.parse(JSON.stringify(s));act('start',[],'start');let nextRescue=28+delay;
 function rescue(){
  const threats=Array.from({length:5},(_,row)=>{const es=s.enemies.filter(e=>e.row===row&&e.x<3),us=s.units.filter(u=>u.row===row);return {row,es,us,hp:us.length?Math.min(...us.map(u=>u.hp)):0,x:es.length?Math.min(...es.map(e=>e.x)):99};}).filter(r=>r.es.length&&(r.us.length<2||r.hp<=45)).sort((a,b)=>(a.us.length>0)-(b.us.length>0)||a.hp-b.hp||a.x-b.x||a.row-b.row);
  const t=threats[0];if(!t)return;
  if(s.compute<50)refundForRecovery(t);
  const c=Array.from({length:7},(_,i)=>i).find(c=>!s.units.some(u=>u.row===t.row&&u.col===c));if(c===undefined)return;
  if(s.compute>=50)buy(t.row,c,'deepseek','ordinary visible threat recovery');else considered.push({time:s.time,kind:'rescue-shortage',row:t.row,col:c,compute:s.compute,nearestEnemyX:t.x,minGuardHP:t.hp});
 }
 while(s.phase==='battle'&&s.time<180){
  events.push(...E.step(s,1/60));if(s.phase!=='battle')break;
  const due=queue.filter(a=>a.time<=s.time+1e-9);queue=queue.filter(a=>a.time>s.time+1e-9);
  for(const a of due){const cost=E.definitions.units[a.type].cost,existing=s.units.find(u=>u.row===a.row&&u.col===a.col);
   if(existing){considered.push({time:s.time,kind:'scheduled-slot-filled-by-recovery',plan:a,compute:s.compute,existingType:existing.type});}
   else if(s.compute>=cost)buy(a.row,a.col,a.type,a.reason);
   else{considered.push({time:s.time,kind:'scheduled-defer',plan:a,compute:s.compute,cost});queue.push({...a,time:s.time+6});}
  }
  if(s.time>=nextRescue-1e-9){rescue();nextRescue+=6;}
  if(trace&&s.tick%30===0)frames.push({time:s.time,compute:s.compute,core:s.core,units:s.units.map(u=>({id:u.id,row:u.row,col:u.col,type:u.type,hp:u.hp,status:u.status})),enemies:s.enemies.map(e=>({id:e.id,row:e.row,type:e.type,x:e.x,hp:e.hp}))});
 }
 const hits=events.filter(e=>e.type==='hit'),shots=events.filter(e=>e.type==='shot'),multi=new Map();for(const e of hits){const a=multi.get(e.shotId)||[];a.push(e);multi.set(e.shotId,a);}
 const outcome={version,level:s.level,policy,seed,delay,withdraw,phase:s.phase,time:s.time,core:s.core,kills:s.stats.kills,leaks:s.stats.leaks,unitsLost:s.stats.unitsLost,gross:gross(),refund:s.stats.emergencyRefunds,balance:s.compute,earned:s.stats.earned,guardDamage:events.filter(e=>e.type==='unit-hit').reduce((sum,e)=>sum+e.amount,0),lostLanes:events.filter(e=>e.type==='unit-lost').map(e=>e.row+1),leakEvents:events.filter(e=>e.type==='leak'),withdrawal:s.stats.emergencyWithdrawal,unfulfilled:queue,deferrals:considered,hitFacts:{gptTwoTargetShots:[...multi.values()].filter(a=>a[0].unitType==='gpt'&&new Set(a.map(e=>e.target)).size>=2).length,grokMultiTargetShots:[...multi.values()].filter(a=>a[0].unitType==='grok'&&new Set(a.map(e=>e.target)).size>=2).length,gptMixedArmorLightShots:[...multi.values()].filter(a=>a[0].unitType==='gpt'&&a.some(e=>e.enemyType==='armor')&&a.some(e=>e.enemyType!=='armor')).length,grokMixedArmorLightShots:[...multi.values()].filter(a=>a[0].unitType==='grok'&&a.some(e=>e.enemyType==='armor')&&a.some(e=>e.enemyType!=='armor')).length}};
 return {outcome,initial,actions,events:trace?events:[],frames,final:JSON.parse(JSON.stringify(s))};
}

const fixtures=[
  {
    "name": "broadBolts-seed1-delay0",
    "options": {
      "policy": "broadBolts",
      "seed": 1,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "core": 5,
      "unitsLost": 0,
      "gross": 400,
      "refund": 0,
      "balance": 80
    },
    "digests": {
      "outcome": "e981b5988734998ecbae6da58fe5bc6a76424c4446e95b9ff93f36f649c79352",
      "initial": "86f0fbfe39767c10de6540c3445cc5fbe9b5349cda6318549ce91f7d6ad3bfed",
      "actions": "bb2f3d974609d28f646363bb8c0ec2d8972dcd4725cf91b57c81f398819a1953",
      "events": "73777c3e2c32981089d743aa688ade5274ed95e1bcedd64e8aea168557da2a9e",
      "frames": "b261a29df33f7f6e61491a7e4dff6d180793378bbd9fb2e408fb67c495623870",
      "final": "eaa2f65797e625f03e0297c204b5dd5a835ba16f1a334e9e34ba5983207e74ea"
    }
  },
  {
    "name": "broadBolts-seed1-delay3",
    "options": {
      "policy": "broadBolts",
      "seed": 1,
      "delay": 3
    },
    "expected": {
      "phase": "won",
      "core": 5,
      "unitsLost": 1,
      "gross": 450,
      "refund": 0,
      "balance": 30
    },
    "digests": {
      "outcome": "d4c11176e7ee6eb8370457cecdcaec17c24bcdb531d4f84a60a8a144bed5a2f5",
      "initial": "86f0fbfe39767c10de6540c3445cc5fbe9b5349cda6318549ce91f7d6ad3bfed",
      "actions": "335e7912114e0372618bcbb7eaa684166adcdb90e52dc23d3421f0cae6bcdca3",
      "events": "57646e13d0dfe03fdd9167ad9804bc4f7a2e621e76ad269bf85ee6d0ab5e1ff6",
      "frames": "f603b27e8360a1df54dbd4b9e9a579742f738e1e03126abfb175d4b959b72978",
      "final": "9dc40e74df3268b6b2b0bf79d3a5199785f889a7abb81ed2571f0cbe615a6cc0"
    }
  },
  {
    "name": "broadBolts-seed1-delay6",
    "options": {
      "policy": "broadBolts",
      "seed": 1,
      "delay": 6
    },
    "expected": {
      "phase": "won",
      "core": 5,
      "unitsLost": 0,
      "gross": 500,
      "refund": 25,
      "balance": 5
    },
    "digests": {
      "outcome": "9bfa83f90f3399b548ff95667a3fdfaf1e1fa684d0a78cacdf0f6374646ce2ec",
      "initial": "86f0fbfe39767c10de6540c3445cc5fbe9b5349cda6318549ce91f7d6ad3bfed",
      "actions": "a2a3f62663c1d161a05562ddd3efc2a1baa7d1c49a954b33ba0369be15ce0ccc",
      "events": "0bd068cb67247049b53ad2f02350e5a0d6097ad2426f75a0ac56e35e809b4660",
      "frames": "82dbd3d17a54032687e2a3501bf0ce73ebf8ae8d2c87fc15bea6f1cf664dc0a5",
      "final": "8c90bf9477d10c31fb3932b388f9381f975e4c95ccad4a62722fdc19f2be2485"
    }
  },
  {
    "name": "broadBolts-seed7-delay0",
    "options": {
      "policy": "broadBolts",
      "seed": 7,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "core": 5,
      "unitsLost": 0,
      "gross": 450,
      "refund": 0,
      "balance": 30
    },
    "digests": {
      "outcome": "941ee5b1bb341ca703df1310f498c1893886ef883972120cb1af064b0d67985e",
      "initial": "9008862c14fd7545b8cc1eb2020b4d8f2eaba8302da0236ee9e663f99e47dfa2",
      "actions": "869f97486d2835f0aaa208003732426e403bd4c5a5303e55c4fe6f6a2ae1f85f",
      "events": "1920a327b4989891d0c48f11c9b93633096ffe5b8ee698679186979fb6ae0ace",
      "frames": "e7fbdae1268a4ad9b4ebe607f935cc35a344ba226af09301a0a8a49081349a32",
      "final": "858bc3c59e41ca95449750247097a7e5bff2be60788b0700a439c899a86a18b9"
    }
  },
  {
    "name": "broadBolts-seed7-delay3",
    "options": {
      "policy": "broadBolts",
      "seed": 7,
      "delay": 3
    },
    "expected": {
      "phase": "won",
      "core": 5,
      "unitsLost": 2,
      "gross": 500,
      "refund": 25,
      "balance": 5
    },
    "digests": {
      "outcome": "d38f60c44b1663a900ad2c1f7629ef8a0a54c98729a50f7722886195b34bf4d8",
      "initial": "9008862c14fd7545b8cc1eb2020b4d8f2eaba8302da0236ee9e663f99e47dfa2",
      "actions": "aff8cce6e8f94b6b7f2ae1ea81e51c31ddd667c2d8b1aafb82ffb3268bf18d4e",
      "events": "f519bc0114f23c231b64e03f55194941ab6e31e8d2630482cd08346a2f72521e",
      "frames": "b2134cfbd69777f9cd1052dbf2caa452d64e32e4bb060f15fc13818da285aa5d",
      "final": "4e79ae6f467921853b1e14d5e3d38d55a0e02cac2dd2122befebdabd1be85639"
    }
  },
  {
    "name": "broadBolts-seed7-delay6",
    "options": {
      "policy": "broadBolts",
      "seed": 7,
      "delay": 6
    },
    "expected": {
      "phase": "won",
      "core": 5,
      "unitsLost": 2,
      "gross": 500,
      "refund": 25,
      "balance": 5
    },
    "digests": {
      "outcome": "bdd19516e3df8a93d8fda6fe9838e4f30eb7d820f0498d2bfe318d80985b2591",
      "initial": "9008862c14fd7545b8cc1eb2020b4d8f2eaba8302da0236ee9e663f99e47dfa2",
      "actions": "2d35ea4d90c71a8b7effb3f652a6dfbc846cc7e6bd5d7843fc45b7bbd7579932",
      "events": "83b6019c32d835f7eecfaada0783820d28f6887b89dd9cab3edd9058956b262b",
      "frames": "85375e088963ac103666ae89d69af4575364266873fb3b7f7a28e2c407b061c6",
      "final": "e3100dbef2c8243590221c6585346d84d03905a4624e100f9e8de75e7ed4b0db"
    }
  },
  {
    "name": "broadBolts-seed30-delay0",
    "options": {
      "policy": "broadBolts",
      "seed": 30,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "core": 5,
      "unitsLost": 0,
      "gross": 400,
      "refund": 0,
      "balance": 80
    },
    "digests": {
      "outcome": "d87ec2726f0aade293f8a614945d91409138b9c33979574b079eea94b4b536c3",
      "initial": "09cf472d19406af2621bd3fb034efe7c24a36526b38a4e9b595ab41358ca1b81",
      "actions": "bb2f3d974609d28f646363bb8c0ec2d8972dcd4725cf91b57c81f398819a1953",
      "events": "c2bd0713ace07b6518de013ee49fc9e767829a20015d561f4a0be1f4f274e86a",
      "frames": "37395aa746696e1ca55ec0f9754edacc462cd05e3d78f31bc5fb5e05dfe3332a",
      "final": "fcb7848736d9146b8858a4cc3e526ea2c4e49b250cb0584fbdcf49e2deb248f7"
    }
  },
  {
    "name": "broadBolts-seed30-delay3",
    "options": {
      "policy": "broadBolts",
      "seed": 30,
      "delay": 3
    },
    "expected": {
      "phase": "won",
      "core": 5,
      "unitsLost": 1,
      "gross": 450,
      "refund": 0,
      "balance": 30
    },
    "digests": {
      "outcome": "eaac20593012f46de3c14b02675cbe228a31c3bc827f4f86f154a9a1991f9ee9",
      "initial": "09cf472d19406af2621bd3fb034efe7c24a36526b38a4e9b595ab41358ca1b81",
      "actions": "335e7912114e0372618bcbb7eaa684166adcdb90e52dc23d3421f0cae6bcdca3",
      "events": "12b668ca993b20d72a7ec5bcb7d16e996babf8f1d2d0f6bae56cb08d939b0705",
      "frames": "d883af364f90a976f681cd67225f92d06225e590b5ee291e1f01cf6b2c7b8ed0",
      "final": "77c77a04c08a4e57ccae28d96c961f7b6bf7812d3370d599c014ad3a4cdbef2f"
    }
  },
  {
    "name": "broadBolts-seed30-delay6",
    "options": {
      "policy": "broadBolts",
      "seed": 30,
      "delay": 6
    },
    "expected": {
      "phase": "won",
      "core": 5,
      "unitsLost": 0,
      "gross": 500,
      "refund": 25,
      "balance": 5
    },
    "digests": {
      "outcome": "91bded76e09355aa70dc9ce41a9b3f9d65acef69691761a663fcdf8c05da6110",
      "initial": "09cf472d19406af2621bd3fb034efe7c24a36526b38a4e9b595ab41358ca1b81",
      "actions": "a2a3f62663c1d161a05562ddd3efc2a1baa7d1c49a954b33ba0369be15ce0ccc",
      "events": "45b66b86fb773f037f94577de59c790c7ada7d92069a105b9189839b0855c316",
      "frames": "e88eeb1f287608ce6591e8ab9a8ce4a894e14810d325d72a4f537b570b30bb6e",
      "final": "50377f99a499d560caff51ac539af393f63439e70e8fe9d79d79b06c94183e54"
    }
  },
  {
    "name": "broadBolts-seed127-delay0",
    "options": {
      "policy": "broadBolts",
      "seed": 127,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "core": 5,
      "unitsLost": 0,
      "gross": 450,
      "refund": 0,
      "balance": 30
    },
    "digests": {
      "outcome": "70ad46fcc4540d959d04eb9316c1986c1976c504234d62f4fa8de827ef1ae138",
      "initial": "e86f54631ce4b6afb0fa1fa81c27385d604d565ed9acf5b48a7cab75c01f2dfc",
      "actions": "869f97486d2835f0aaa208003732426e403bd4c5a5303e55c4fe6f6a2ae1f85f",
      "events": "2b3bf696b3b5277df117d4526aeb66a1f4080a7110973691e94ae1755b28f0e0",
      "frames": "984aab7c834c6fe4c1c51af71bc76788938a950254cd4ebaa90daf624422bc13",
      "final": "7c0d66903ee795f7fb03e8752493f0e2f8e1d50746f2a866784c64533b49d566"
    }
  },
  {
    "name": "broadBolts-seed127-delay3",
    "options": {
      "policy": "broadBolts",
      "seed": 127,
      "delay": 3
    },
    "expected": {
      "phase": "won",
      "core": 5,
      "unitsLost": 1,
      "gross": 500,
      "refund": 25,
      "balance": 5
    },
    "digests": {
      "outcome": "0f872c81937e5ddb3f7afe2af1b72137796fcc8b0607718fc1f8cc739a141c16",
      "initial": "e86f54631ce4b6afb0fa1fa81c27385d604d565ed9acf5b48a7cab75c01f2dfc",
      "actions": "aff8cce6e8f94b6b7f2ae1ea81e51c31ddd667c2d8b1aafb82ffb3268bf18d4e",
      "events": "1e5054873b94def0c9ab367a9a796426dc2469044474c9635f74fc09d0d20679",
      "frames": "92d8e9cbbb7df3ed02cfd4dd3d146c1d600efd051196fc0f873d2e54932bd68d",
      "final": "b2c2698e2495bad39ad2424593d203477324ab5918171bfef84f832e99d5f349"
    }
  },
  {
    "name": "broadBolts-seed127-delay6",
    "options": {
      "policy": "broadBolts",
      "seed": 127,
      "delay": 6
    },
    "expected": {
      "phase": "won",
      "core": 4,
      "unitsLost": 3,
      "gross": 500,
      "refund": 25,
      "balance": 5
    },
    "digests": {
      "outcome": "be9fa2865af67bf0525f61396292414a725cfbae66d625c881e0519873361684",
      "initial": "e86f54631ce4b6afb0fa1fa81c27385d604d565ed9acf5b48a7cab75c01f2dfc",
      "actions": "a6ca139007f9887c1b5275749be686552f588488ed01efe051cbf48ec283df83",
      "events": "33f6415eb17f76165ffb2f6175aa195f90d8f75e2ae26c37d3dc4275c7163aaf",
      "frames": "65df5c7248cd89ad94c4c0eab9ba8ba732206aac00398c1df8cddfa1083fe27f",
      "final": "d74d0fe46b6a487ab3bd15f296e709578b6b867bfcf9ce4ce79a7df5a11ee794"
    }
  },
  {
    "name": "piercePacket-seed1-delay0",
    "options": {
      "policy": "piercePacket",
      "seed": 1,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "core": 5,
      "unitsLost": 0,
      "gross": 420,
      "refund": 0,
      "balance": 60
    },
    "digests": {
      "outcome": "6b05d28f4089e6d6607b2aaad897ed125ad7a5afaf4a5e4b02cddc45cbabaa6b",
      "initial": "56d388a2efb5a828cb6581e9dd11ea6e30b57d2813d13ba381e681d6edebac76",
      "actions": "49d06262f7e609fba0e1f9e1b0b449d2812ab6dbadf51edd86fc0a37d0909168",
      "events": "d18c8008a09bd2a7175642fb05c10156bc7680e1c9d94cd2c3589852e15ff1b7",
      "frames": "2c33c32c420216da07c25960df4155b6aac73087d680c3eec7fa2e1ab44610dc",
      "final": "ae4bd1a8b6bf83862f0c4bd9031fa1748784a67148d11d87b003cf14e544162e"
    }
  },
  {
    "name": "piercePacket-seed1-delay3",
    "options": {
      "policy": "piercePacket",
      "seed": 1,
      "delay": 3
    },
    "expected": {
      "phase": "won",
      "core": 5,
      "unitsLost": 0,
      "gross": 390,
      "refund": 0,
      "balance": 90
    },
    "digests": {
      "outcome": "d496cdacf9394f919840836a61a9355cb2a797b490007a5b4c242e55ea8ed79c",
      "initial": "56d388a2efb5a828cb6581e9dd11ea6e30b57d2813d13ba381e681d6edebac76",
      "actions": "29245e2c83e82374298cee180992d0983c1908e035fa2216672887e43e55c5d3",
      "events": "e52711f7de8ad4c6c16765951113137592c473eddc6197720c38a7ba4abafbf0",
      "frames": "f7a1b54912b706facb3ca549bae6bc1619a71112a94e331395de031bf91b3645",
      "final": "03511b2b9806e273ed8a723e3dbb7f59d88aafba27e8e45450baf8a6bea3aedc"
    }
  },
  {
    "name": "piercePacket-seed1-delay6",
    "options": {
      "policy": "piercePacket",
      "seed": 1,
      "delay": 6
    },
    "expected": {
      "phase": "won",
      "core": 5,
      "unitsLost": 0,
      "gross": 490,
      "refund": 25,
      "balance": 15
    },
    "digests": {
      "outcome": "64d05a733c80d92e43233e191bb8ea6e17c471fc093eec723024d621eb5e336b",
      "initial": "56d388a2efb5a828cb6581e9dd11ea6e30b57d2813d13ba381e681d6edebac76",
      "actions": "9fe3e28f4e542c8e41ac271932945d1a3021595c513edcb288d153272b12eb28",
      "events": "66dee91b8743a418aebe75df545c857b6d508d45ce40b7b0bf7c6f21e665d0d3",
      "frames": "bc53ff1430a999122511fc6217e10e5f040039b744edcb930bf1657b7130e63f",
      "final": "6974b9da488b6e5e76f46751f3959e8bc5cffda9c373b93de33bc98379da98b9"
    }
  },
  {
    "name": "piercePacket-seed7-delay0",
    "options": {
      "policy": "piercePacket",
      "seed": 7,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "core": 5,
      "unitsLost": 0,
      "gross": 420,
      "refund": 0,
      "balance": 60
    },
    "digests": {
      "outcome": "c6ecccba3e82e0dbfdf3387c8511dbfb4fb694918dcc42854d05eeb827944462",
      "initial": "7006c5346cb73f24cc2d2f7357063104e9cf9123367a5a405b7e66da8eaac005",
      "actions": "49d06262f7e609fba0e1f9e1b0b449d2812ab6dbadf51edd86fc0a37d0909168",
      "events": "ae0b5d2ae30e53a09fe29921dcbe00fac95a33284c84ba086989e5c806fbfd55",
      "frames": "c117d85420e5777d7c1fc91e08046a794e306662381ba3173cacc3e0ee134496",
      "final": "55ce0e6a0f12deda9cb575e400960465ea53a0755692660f0ada800b06bd44b4"
    }
  },
  {
    "name": "piercePacket-seed7-delay3",
    "options": {
      "policy": "piercePacket",
      "seed": 7,
      "delay": 3
    },
    "expected": {
      "phase": "won",
      "core": 5,
      "unitsLost": 0,
      "gross": 390,
      "refund": 0,
      "balance": 90
    },
    "digests": {
      "outcome": "8dd3a539b06bab72803d73a6560c80e8bad00fd0c930910c7a5c0b33a3f5fbc3",
      "initial": "7006c5346cb73f24cc2d2f7357063104e9cf9123367a5a405b7e66da8eaac005",
      "actions": "29245e2c83e82374298cee180992d0983c1908e035fa2216672887e43e55c5d3",
      "events": "c1b113633c2761992c482715e071a42a01fbe73b778a50791e0077faaf1cf28e",
      "frames": "9b5aa2ff7950b65ee91f112ba43c269bcb2db1b4444f3a1fbe6733d6e32ce41c",
      "final": "8b1c5e5e1e2688a4d642d4b426ad47e2e4f2f3c582126fabdf4e446fd676f83e"
    }
  },
  {
    "name": "piercePacket-seed7-delay6",
    "options": {
      "policy": "piercePacket",
      "seed": 7,
      "delay": 6
    },
    "expected": {
      "phase": "won",
      "core": 5,
      "unitsLost": 2,
      "gross": 520,
      "refund": 45,
      "balance": 5
    },
    "digests": {
      "outcome": "08af7d6db9f036fb2d69596a4a4118d83ffe366047d7cd6575449148aca9b731",
      "initial": "7006c5346cb73f24cc2d2f7357063104e9cf9123367a5a405b7e66da8eaac005",
      "actions": "a7297eabb2230f5688d11bdb6894e1f2baf53794ccb0b5e6f7c0d605c86c5bbe",
      "events": "3600eec47a402024fc6d121d490017e79050a9618017ab2dce4aaa103ce0203f",
      "frames": "90212bd0e1d8a7241a32c48baac41b1696181a3b9240199839bb052616042d44",
      "final": "6622d1f95cc87f8dc739dbb84e100dee116538b5b6361d8ac266d108437fb101"
    }
  },
  {
    "name": "piercePacket-seed30-delay0",
    "options": {
      "policy": "piercePacket",
      "seed": 30,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "core": 5,
      "unitsLost": 0,
      "gross": 470,
      "refund": 0,
      "balance": 10
    },
    "digests": {
      "outcome": "7cdfed434154b42d0b4fafb4c059cf1cd06bfdcdfdc545160686e8feeaeab4fd",
      "initial": "dc2e3c21b0a4484e1ccb269ed10ad67ebae0f152d6884f70a2fbf5801bacb136",
      "actions": "f5998aae0b12168b196ed468950077db53fe974cbfea8b32c9f2309d875a7f80",
      "events": "bed83a534652dc93cdd9334ea88c459bd2de15f2d6e1c510debb882c754274cb",
      "frames": "f71ce3154f2b9cf312d1b13a36f4e0f4b2d2fc33f0b0895646f4401b6049d8fb",
      "final": "5cc14d9db31d57df80f868c28484f18dd41ca9337ad0a4580516a4ec0db70f2c"
    }
  },
  {
    "name": "piercePacket-seed30-delay3",
    "options": {
      "policy": "piercePacket",
      "seed": 30,
      "delay": 3
    },
    "expected": {
      "phase": "won",
      "core": 5,
      "unitsLost": 0,
      "gross": 390,
      "refund": 0,
      "balance": 90
    },
    "digests": {
      "outcome": "c26bb2c470105be444e51a335a39b98f3538132a250393693e1d4341cf51a395",
      "initial": "dc2e3c21b0a4484e1ccb269ed10ad67ebae0f152d6884f70a2fbf5801bacb136",
      "actions": "29245e2c83e82374298cee180992d0983c1908e035fa2216672887e43e55c5d3",
      "events": "f863d00867bba19e1e6ac6dd90eca47d1f2a18056dd714dca869e2542c5afc19",
      "frames": "d2a98965327305b2119c5429ec2ce451478c03ad4bb67ebd77a06c7699b1da71",
      "final": "923d9c7fc5f7c680f7f89b2b23da0cbb474ccc1f805c9dea73d88fd179249e01"
    }
  },
  {
    "name": "piercePacket-seed30-delay6",
    "options": {
      "policy": "piercePacket",
      "seed": 30,
      "delay": 6
    },
    "expected": {
      "phase": "won",
      "core": 5,
      "unitsLost": 0,
      "gross": 490,
      "refund": 25,
      "balance": 15
    },
    "digests": {
      "outcome": "cb3a9a369a39e459a4755a2d3f43c5cdee2f35c2c84e0d32b08b64ddbc11642d",
      "initial": "dc2e3c21b0a4484e1ccb269ed10ad67ebae0f152d6884f70a2fbf5801bacb136",
      "actions": "8625b0cdf330558fb14290bc4798f7fe0aa65b4d55a91a9fb4cd088f082d4aa1",
      "events": "6d255b7cd9df471207088472a4ad025027403d7017b46ba8d52082018682e9e8",
      "frames": "432e555377d697e3816618e977983045bf3a8f51089428ca153e2993b2ae01cc",
      "final": "dc680b6a2f19eee4410e291581a0cd29144ce19f46ccc3078f26bb42c634cfc9"
    }
  },
  {
    "name": "piercePacket-seed127-delay0",
    "options": {
      "policy": "piercePacket",
      "seed": 127,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "core": 5,
      "unitsLost": 0,
      "gross": 420,
      "refund": 0,
      "balance": 60
    },
    "digests": {
      "outcome": "999e08f091e8744417f3d6afa47a8a79a0269e63fc4cc752ffaa2eb1d61658fb",
      "initial": "0d2b3f95211fde6fe85852f1de40b43260c182154010ab94913bb81759fdb89d",
      "actions": "49d06262f7e609fba0e1f9e1b0b449d2812ab6dbadf51edd86fc0a37d0909168",
      "events": "7c296ae30fd809accabf9dc4a77d0ef7dbe47b6daf0cf194da71eaf09ae21181",
      "frames": "22dee0268a6174e064559876ca1419bf1ece2e033388fd4ab272084fc4b375da",
      "final": "0a4fe39c80d252fcaaf0ef7279219df64c4e9f3141abc33bd9bdd329fdda47e4"
    }
  },
  {
    "name": "piercePacket-seed127-delay3",
    "options": {
      "policy": "piercePacket",
      "seed": 127,
      "delay": 3
    },
    "expected": {
      "phase": "won",
      "core": 5,
      "unitsLost": 0,
      "gross": 390,
      "refund": 0,
      "balance": 90
    },
    "digests": {
      "outcome": "7a6c7c987c11b0af79974e6297df82c9356f24f59b023233288cbfe6e30c6a18",
      "initial": "0d2b3f95211fde6fe85852f1de40b43260c182154010ab94913bb81759fdb89d",
      "actions": "29245e2c83e82374298cee180992d0983c1908e035fa2216672887e43e55c5d3",
      "events": "04f509d4928b22b81d00c9be4064a016d4a9ace374cf9be5b184975bde75654b",
      "frames": "1e1573ac5de086d925d335ed367cf4d27b3ee9e225aa4f25297d1f309c7dcae4",
      "final": "90ee77c362e61e63fab28a12fa7580db6829ff4ec59b7a5c281504332c209b9f"
    }
  },
  {
    "name": "piercePacket-seed127-delay6",
    "options": {
      "policy": "piercePacket",
      "seed": 127,
      "delay": 6
    },
    "expected": {
      "phase": "won",
      "core": 5,
      "unitsLost": 2,
      "gross": 520,
      "refund": 45,
      "balance": 5
    },
    "digests": {
      "outcome": "a7378a6e63bbaffb45276324f325a806e3c4c1db784019780115d418e7282e2b",
      "initial": "0d2b3f95211fde6fe85852f1de40b43260c182154010ab94913bb81759fdb89d",
      "actions": "89074ef5c0668b102c19c1a27016024db79ce7003470585f79209a500aab0a5d",
      "events": "b6b7d84e0b6e1015c0337da097fa707bb0c122739b31fd333661a6fb1fdda429",
      "frames": "eb3c96afcdfc782572680c6fb13aba9a722867b415579b37eaaade326d9c6393",
      "final": "720cce63157be400b66bc00bd279cdad430b480064df103bd63b881f4b12dd5e"
    }
  },
  {
    "name": "heavyThenLight-seed1-delay0",
    "options": {
      "policy": "heavyThenLight",
      "seed": 1,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "core": 5,
      "unitsLost": 0,
      "gross": 520,
      "refund": 60,
      "balance": 20
    },
    "digests": {
      "outcome": "0ddde950529a3e0ec20776655aaedeff53758abed0abcee7e7d62df323f2fae6",
      "initial": "805580002f6e6b1e1fe7c7ccbbe4ac11432d0d99b8769d4bb1f669ca0b507231",
      "actions": "82fd2bcdc190711995ac180a3d19f738ffb9b02d0ec27007fc6c8345199ca7d6",
      "events": "5613d9dcf954544f2a6b5c67ef869ff0c63a7ac7afd52a78df2799ed13defe5c",
      "frames": "5135eb082eb604b7af54bd0d43222fa0aaf86b07f8b6731277ca9e1ff58bb169",
      "final": "18ed2dab4f94744fe9084350785b47ea1895828287227fa54550f478be8837c6"
    }
  },
  {
    "name": "heavyThenLight-seed1-delay3",
    "options": {
      "policy": "heavyThenLight",
      "seed": 1,
      "delay": 3
    },
    "expected": {
      "phase": "won",
      "core": 5,
      "unitsLost": 4,
      "gross": 520,
      "refund": 60,
      "balance": 20
    },
    "digests": {
      "outcome": "ab6a2a1144166f98acf39a5860c17a8ac1971b41e5dce5201a2bc834c3340179",
      "initial": "805580002f6e6b1e1fe7c7ccbbe4ac11432d0d99b8769d4bb1f669ca0b507231",
      "actions": "2c7a18f4c5c90947af9e21c105de216946be1363e1cb8f19593b0e05eb69f6a1",
      "events": "9c6143150f3f0a80bd0eaace96bb79a5da6b1e7f00af90960f5ec2eb878997ff",
      "frames": "d8527760b90e2310b773d2c7d4f3a51576cf6c4a14d0b0d74cd1bafcc44cb3cd",
      "final": "5a3fd25336ccf4967b6645cfd9c7b51627f412ff9e69d5b5915ec28ba013f755"
    }
  },
  {
    "name": "heavyThenLight-seed1-delay6",
    "options": {
      "policy": "heavyThenLight",
      "seed": 1,
      "delay": 6
    },
    "expected": {
      "phase": "lost",
      "core": 0,
      "unitsLost": 4,
      "gross": 470,
      "refund": 25,
      "balance": 35
    },
    "digests": {
      "outcome": "fced933d37af8ac0ec244e1e26dbbb26b2ef07a2144fde06e86b9beb925708bc",
      "initial": "805580002f6e6b1e1fe7c7ccbbe4ac11432d0d99b8769d4bb1f669ca0b507231",
      "actions": "a8c7d6fe57d951e79a004837a121e95b5d57eb46fd17e8b5d8044a87d2670fbc",
      "events": "4dfa6d0a9479aede53252f2c46ae9a4a270e75837408505de541de416f57b552",
      "frames": "05c9ba360ad83f46c58fa32944fb1176095ccfd6fcf9ee06e10f0d918602cd67",
      "final": "ecb3d756a4599172d2963ca2dd33be99d5faa4f8ba42aef0ced28d065ea6d45a"
    }
  },
  {
    "name": "heavyThenLight-seed7-delay0",
    "options": {
      "policy": "heavyThenLight",
      "seed": 7,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "core": 5,
      "unitsLost": 2,
      "gross": 520,
      "refund": 60,
      "balance": 20
    },
    "digests": {
      "outcome": "d4c4553f9d4932d6f695c3ab435fe598f00d3c9e5251e6297871c86378338cb6",
      "initial": "63431a28d0e9a4d9a475ecaaa2cc723665ece13786a8d22aa5271a0d9e6bbc90",
      "actions": "ce6b0cecc89f6ef5192ed676908163bf5dac319f4b57569cb614ae00246bdb21",
      "events": "0ebb94bdd4f1f16def75f091ff5e06f0a65ca37f9c09fefc6b3ab4f53f1453ea",
      "frames": "08e0c3139188299dd3b86e8898bc5b3eea6a14b8a7b839fd51e32b3624279817",
      "final": "a554317a9d594f4007607d0795900331b1f4037b3e55ef203452c2e8b6d6ec87"
    }
  },
  {
    "name": "heavyThenLight-seed7-delay3",
    "options": {
      "policy": "heavyThenLight",
      "seed": 7,
      "delay": 3
    },
    "expected": {
      "phase": "lost",
      "core": 0,
      "unitsLost": 4,
      "gross": 520,
      "refund": 60,
      "balance": 20
    },
    "digests": {
      "outcome": "aac6bf7d29355213167885496010783b3eeb3a99b7723de81b905accf16dc6d8",
      "initial": "63431a28d0e9a4d9a475ecaaa2cc723665ece13786a8d22aa5271a0d9e6bbc90",
      "actions": "488bfdd9befd13b9bed11ec94cb7dfef79c048682c60f1cb397f03c2a581b10b",
      "events": "0ce94f7b231842f6a48855199078cbe67b193ed57a75ec71bc414d3031d0ab52",
      "frames": "34b06128d57669a9b2ef2bcdc8c2d9df626eea44eccd2e1c5a836beb45528bf5",
      "final": "e9926461911a98423cfa35875a432074c0b46a0c95cd92361108a958a290844b"
    }
  },
  {
    "name": "heavyThenLight-seed7-delay6",
    "options": {
      "policy": "heavyThenLight",
      "seed": 7,
      "delay": 6
    },
    "expected": {
      "phase": "lost",
      "core": 0,
      "unitsLost": 4,
      "gross": 470,
      "refund": 25,
      "balance": 35
    },
    "digests": {
      "outcome": "d7e701d4c5f9e4681cd96a47f90bf217a38646073baab42a6fec9e43eb6bd083",
      "initial": "63431a28d0e9a4d9a475ecaaa2cc723665ece13786a8d22aa5271a0d9e6bbc90",
      "actions": "a62dd2ca433d8916ef772317fd54c0b4fb6a8de9a9cab3f566eed27950f0d1b0",
      "events": "f8aa67955dd78391eb562836159bff60e62380ffe010c6d4bb06bdc802695eeb",
      "frames": "7f4102cc53616e844867cb136a7df3883100060809870bd96e1f7e99e74a6134",
      "final": "b46a744c3de945b07e195b62adae7e5e191f8da71da0d3d4407726c9544a979f"
    }
  },
  {
    "name": "heavyThenLight-seed30-delay0",
    "options": {
      "policy": "heavyThenLight",
      "seed": 30,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "core": 5,
      "unitsLost": 0,
      "gross": 520,
      "refund": 60,
      "balance": 20
    },
    "digests": {
      "outcome": "cbcdf70c590f846750aeb55e35ed0e6b3ebbc91ace9355f6ae8a57ed3cf2a2ac",
      "initial": "33a3cbebb67d59d1b760613b745fbff02596e34606174129c4f07ff2f62b2ba4",
      "actions": "82fd2bcdc190711995ac180a3d19f738ffb9b02d0ec27007fc6c8345199ca7d6",
      "events": "bf18091bce69b5ee6683677bac93428341365ae16625d6a2f9ec197557bf01dc",
      "frames": "85ad6676643f529b0bde6073538b973bc03919a76332078914abc029ef44239c",
      "final": "68b17e915d8640e596051792f8f530669654072b2069adabf6662c995b005c61"
    }
  },
  {
    "name": "heavyThenLight-seed30-delay3",
    "options": {
      "policy": "heavyThenLight",
      "seed": 30,
      "delay": 3
    },
    "expected": {
      "phase": "won",
      "core": 5,
      "unitsLost": 4,
      "gross": 520,
      "refund": 60,
      "balance": 20
    },
    "digests": {
      "outcome": "4e52baa361ada29343184cfb7fc4e5289722d9089f92fa9cd0e5b6e74c66446a",
      "initial": "33a3cbebb67d59d1b760613b745fbff02596e34606174129c4f07ff2f62b2ba4",
      "actions": "2c7a18f4c5c90947af9e21c105de216946be1363e1cb8f19593b0e05eb69f6a1",
      "events": "f0fb7ed0d94c87588a8f4c8b6939f70c07e50759108004e129bf46a63f4b0b6d",
      "frames": "25ea2a0c960991632992b69028d837b439f43821c07d32e0990cacfbd24c1bed",
      "final": "0db18bcad69e4180161176d44ced25a3ee5569e0871b6cb10755a7ce84e90c78"
    }
  },
  {
    "name": "heavyThenLight-seed30-delay6",
    "options": {
      "policy": "heavyThenLight",
      "seed": 30,
      "delay": 6
    },
    "expected": {
      "phase": "lost",
      "core": 0,
      "unitsLost": 4,
      "gross": 470,
      "refund": 25,
      "balance": 35
    },
    "digests": {
      "outcome": "9af39bd520221a22f950907241dd771ed3d864cf1989af72c8951172f285449d",
      "initial": "33a3cbebb67d59d1b760613b745fbff02596e34606174129c4f07ff2f62b2ba4",
      "actions": "a8c7d6fe57d951e79a004837a121e95b5d57eb46fd17e8b5d8044a87d2670fbc",
      "events": "a288652f159277f40438c07d2d8ded2d2f20206f65e953afd0bfd6ad5135b426",
      "frames": "56c1b1067f0130edc1dd97b891596547782ddc9e8b8d189133e1c0b8b037c902",
      "final": "991cf554b9c2bd9959226cdca6b3e5b4b7ef49f59bd222a8bd1163ced1866fa5"
    }
  },
  {
    "name": "heavyThenLight-seed127-delay0",
    "options": {
      "policy": "heavyThenLight",
      "seed": 127,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "core": 4,
      "unitsLost": 3,
      "gross": 520,
      "refund": 60,
      "balance": 20
    },
    "digests": {
      "outcome": "52a134a1d9de3f5be98ef006d1b28721beaa7424a9c35ade857da79e3a186e54",
      "initial": "4f04263d6b32190927181ac12f4a3e6f5d9623e9139f044ab8e7b90df29fd1aa",
      "actions": "867e800e860450e87946bb96811c63fb038019a419d7ab7a9508538ff6b49efa",
      "events": "9cd5a39427d9ee7107a3f2b2f7e50c1e50e7f723b5d6f46b976674c8af62ffe6",
      "frames": "451f09441dbb4f136c3e4daa29cb35bff4355729019a4e91d7e06dcf962d1d53",
      "final": "a95b9661948375a73826d4560353eb48305a3241728cd9d36002781915a7502a"
    }
  },
  {
    "name": "heavyThenLight-seed127-delay3",
    "options": {
      "policy": "heavyThenLight",
      "seed": 127,
      "delay": 3
    },
    "expected": {
      "phase": "lost",
      "core": 0,
      "unitsLost": 5,
      "gross": 520,
      "refund": 60,
      "balance": 20
    },
    "digests": {
      "outcome": "4ed1fdef96530646831b5ba6c5d85b5c8817a1c9dcd7af405caa5e9db1426b9a",
      "initial": "4f04263d6b32190927181ac12f4a3e6f5d9623e9139f044ab8e7b90df29fd1aa",
      "actions": "2c7a18f4c5c90947af9e21c105de216946be1363e1cb8f19593b0e05eb69f6a1",
      "events": "1529d586a1634664a3ff69c463a8d60868c6720a162b43d405e240b7050f0765",
      "frames": "6df13892760df6fd51ab5d38530ebc2bdd3d1694066946601a0db97a9e5f0929",
      "final": "7cfea7c77a3289fceed8f925e17e238b1e54bd936606194ada64ee0500f3d55a"
    }
  },
  {
    "name": "heavyThenLight-seed127-delay6",
    "options": {
      "policy": "heavyThenLight",
      "seed": 127,
      "delay": 6
    },
    "expected": {
      "phase": "lost",
      "core": 0,
      "unitsLost": 4,
      "gross": 470,
      "refund": 25,
      "balance": 35
    },
    "digests": {
      "outcome": "ef661cac632be7ce5ab0be3976e4522fe61049268029a3b7108536117923eef5",
      "initial": "4f04263d6b32190927181ac12f4a3e6f5d9623e9139f044ab8e7b90df29fd1aa",
      "actions": "a8c7d6fe57d951e79a004837a121e95b5d57eb46fd17e8b5d8044a87d2670fbc",
      "events": "860c3de8a4056d1e551046660bf3c4cbdaf95f9e2cd77a9fe0fdeea822db46f9",
      "frames": "415ab601822c8b1665ec294da4d9532124d49457e7152a5fd459ee6a2ec683a4",
      "final": "a0ed75319b317d8472323399553c2812d83a569bc4f5c99628ae1a683ee423b5"
    }
  },
  {
    "name": "familiarBroad-seed1-delay0",
    "options": {
      "policy": "familiarBroad",
      "seed": 1,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "core": 5,
      "unitsLost": 2,
      "gross": 500,
      "refund": 25,
      "balance": 5
    },
    "digests": {
      "outcome": "238e5146ce2e0525e77d4f28b87c7415b4e523be5898b32e586ba2e894e8a24c",
      "initial": "c916b8803e078ef24a4c47adfc9e9063beb3fd8e3b3f86b2feadbf58df2add55",
      "actions": "351894924969c5c07ca08c3433466f6ed15a907d3c7fe34cc6f1cc545d67beaf",
      "events": "16dd2eaadbedcbded17c95cd7a9918232ec0f82dbf8b4efd925a301395edd0ff",
      "frames": "672fc22f3a96c7b02f91a160d506f47da7f2abb65c13032b60668568d4d1320f",
      "final": "fcb6606a15f4cf447672e929425bd72573f037b48344abf6982912ccafb8bb2a"
    }
  },
  {
    "name": "familiarBroad-seed1-delay3",
    "options": {
      "policy": "familiarBroad",
      "seed": 1,
      "delay": 3
    },
    "expected": {
      "phase": "lost",
      "core": 0,
      "unitsLost": 4,
      "gross": 500,
      "refund": 25,
      "balance": 5
    },
    "digests": {
      "outcome": "9a685944d05882696501b41d50f46bca50d027636d8294edfa5f084638eaa944",
      "initial": "c916b8803e078ef24a4c47adfc9e9063beb3fd8e3b3f86b2feadbf58df2add55",
      "actions": "88a21b773c73b4bd32741be999f484fdd4e05f1cf5bfda188ea7931bb3ad03aa",
      "events": "8eba77b33f4d3c6940eacb055f86fd5a3276b8c671d6d623ee8f874ecc73fc4d",
      "frames": "59a86e6b67dd17957ddb16b0ff9cae9c5eb83ed3b17bd10ea3b1b9b66d312bea",
      "final": "8504977dcccf0b0e25f123b3d399d0c253dc7a2b673dcbe465c01d0651db2ff7"
    }
  },
  {
    "name": "familiarBroad-seed1-delay6",
    "options": {
      "policy": "familiarBroad",
      "seed": 1,
      "delay": 6
    },
    "expected": {
      "phase": "won",
      "core": 5,
      "unitsLost": 2,
      "gross": 500,
      "refund": 25,
      "balance": 5
    },
    "digests": {
      "outcome": "58b0e1407f78d616b02c28012f04b2676bb4154811af060639261ac7eb2eb46f",
      "initial": "c916b8803e078ef24a4c47adfc9e9063beb3fd8e3b3f86b2feadbf58df2add55",
      "actions": "0e5275d0dd5e094a403b3b135b4f92e7f9ef0d7d30f258332d2a15fc9b0c2b24",
      "events": "469ba2181743d3ea5c75c389d990dcc487e37400ce9a8a8faab7b4bac15e9b9e",
      "frames": "f88e8a122ad1e5700400e53ae3476d4309dad9247f3a52a28ad100bbd85fe955",
      "final": "d3872ac127ea89a5b1921d0232353a22cf066b4471f8704236310b3663df70d6"
    }
  },
  {
    "name": "familiarBroad-seed7-delay0",
    "options": {
      "policy": "familiarBroad",
      "seed": 7,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "core": 5,
      "unitsLost": 2,
      "gross": 500,
      "refund": 25,
      "balance": 5
    },
    "digests": {
      "outcome": "0a1881222f805b826b26398fd9d87fbdcae174856136d1efa427b38f59f26852",
      "initial": "e6b3035a2b69ccaa0f4fbd4372ef0539e3e09476eb5d1ea3a806a411f89efa17",
      "actions": "351894924969c5c07ca08c3433466f6ed15a907d3c7fe34cc6f1cc545d67beaf",
      "events": "fc06a62854a449bfe24c78b0f68ad0a7c9f0bebb75f2bbf4c29679ae17e715c6",
      "frames": "7cb1e41efacca6282cae3df37f106a68a79bb0f0d6aa950fccb0ae80842d540c",
      "final": "fe04d2c93d2d44eb8ef33c6e848c6039c491cdc76e8e2c5e083c331c5275f8c8"
    }
  },
  {
    "name": "familiarBroad-seed7-delay3",
    "options": {
      "policy": "familiarBroad",
      "seed": 7,
      "delay": 3
    },
    "expected": {
      "phase": "won",
      "core": 1,
      "unitsLost": 4,
      "gross": 500,
      "refund": 25,
      "balance": 5
    },
    "digests": {
      "outcome": "85a29b00f31ff96e696329fc4e807edef0e2c2200c148a9cb689bebfd3b80a29",
      "initial": "e6b3035a2b69ccaa0f4fbd4372ef0539e3e09476eb5d1ea3a806a411f89efa17",
      "actions": "88a21b773c73b4bd32741be999f484fdd4e05f1cf5bfda188ea7931bb3ad03aa",
      "events": "edc58cc08f0a8e6a6de8032ac4735f2b8c799b49464683c3a33f52ac08eeb2cc",
      "frames": "badbf17ba141dccb8acee4443d082536eeb733551c9598983c6d3c0527ad5699",
      "final": "2f7e18b5510e464768dfbc304b12c32e82a67e766d689bf475b27c5fdbf8ae7c"
    }
  },
  {
    "name": "familiarBroad-seed7-delay6",
    "options": {
      "policy": "familiarBroad",
      "seed": 7,
      "delay": 6
    },
    "expected": {
      "phase": "won",
      "core": 5,
      "unitsLost": 2,
      "gross": 500,
      "refund": 25,
      "balance": 5
    },
    "digests": {
      "outcome": "d63d1ddaaa2fe9c292ad2a4ea21ef2f1e339ce944c274126e2b087c0beab62f2",
      "initial": "e6b3035a2b69ccaa0f4fbd4372ef0539e3e09476eb5d1ea3a806a411f89efa17",
      "actions": "0e5275d0dd5e094a403b3b135b4f92e7f9ef0d7d30f258332d2a15fc9b0c2b24",
      "events": "218816c3c4fdc2b17162954f0a08ad9183eceed2c7af2ab239d7297107b0cefc",
      "frames": "9eb99405497f33effc999db21061141f67983580b8ed00fcb7871f232dbe4a39",
      "final": "8247e6f21e8c76d0bb6a858d1caa33e9e5bd0c16d0a2303d89a017b7f4a4d8a9"
    }
  },
  {
    "name": "familiarBroad-seed30-delay0",
    "options": {
      "policy": "familiarBroad",
      "seed": 30,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "core": 5,
      "unitsLost": 2,
      "gross": 500,
      "refund": 25,
      "balance": 5
    },
    "digests": {
      "outcome": "ea02dfb97d9cc368cbb141ced3f574b6735e46cb2cba9a787cf5b2c43c976eb7",
      "initial": "2e756f0319676285c9583c150be998e5a55d5cb450471ba14797bd1f739bbed3",
      "actions": "351894924969c5c07ca08c3433466f6ed15a907d3c7fe34cc6f1cc545d67beaf",
      "events": "a35138e29b476e382e215394a1aa45002bd0f42d772c8f15d597c037cf266f77",
      "frames": "9d01d2fb646418abfee0c420fbcc12f6f8e5795a6ac4430091706e89564b1e5a",
      "final": "da7b55a3b71373d2dba4539df1c5594bba82bf6e4a9583f2acb7e0dad64a72b5"
    }
  },
  {
    "name": "familiarBroad-seed30-delay3",
    "options": {
      "policy": "familiarBroad",
      "seed": 30,
      "delay": 3
    },
    "expected": {
      "phase": "lost",
      "core": 0,
      "unitsLost": 4,
      "gross": 500,
      "refund": 25,
      "balance": 5
    },
    "digests": {
      "outcome": "2715262ba1d51aca08cb3251cdbde40b21a034a2c2400f75d3327c8f3b1b787e",
      "initial": "2e756f0319676285c9583c150be998e5a55d5cb450471ba14797bd1f739bbed3",
      "actions": "88a21b773c73b4bd32741be999f484fdd4e05f1cf5bfda188ea7931bb3ad03aa",
      "events": "a179f8e6521eafd57805e461f922a029f30c0f47479deaffba2b30fea7ea073e",
      "frames": "e7d9d2f35d5f2d89d4cb827f6d582c4df77a2dae659e182c67db5a19f2cb6d89",
      "final": "2913128e1be4043e9ba013da95f15597592c9c7925a58e506aae78b98aa72aa6"
    }
  },
  {
    "name": "familiarBroad-seed30-delay6",
    "options": {
      "policy": "familiarBroad",
      "seed": 30,
      "delay": 6
    },
    "expected": {
      "phase": "won",
      "core": 5,
      "unitsLost": 2,
      "gross": 500,
      "refund": 25,
      "balance": 5
    },
    "digests": {
      "outcome": "38fb3765ca135dce38e9b8fb13fc8c3c8e254b062380d09b578ddcab0ce2f032",
      "initial": "2e756f0319676285c9583c150be998e5a55d5cb450471ba14797bd1f739bbed3",
      "actions": "0e5275d0dd5e094a403b3b135b4f92e7f9ef0d7d30f258332d2a15fc9b0c2b24",
      "events": "e52a2abf913d1f3eb51de5db9dc5fa244b131957722c5d1ebcc735008a978cc8",
      "frames": "b59c69a36214894a6c9df4ea2403d8c9cb87106689ed675d258ee06deca378b2",
      "final": "1d1734d13c3b63776f784d568cbab6ab701340ec023794d710d29cabe0a74ba6"
    }
  },
  {
    "name": "familiarBroad-seed127-delay0",
    "options": {
      "policy": "familiarBroad",
      "seed": 127,
      "delay": 0
    },
    "expected": {
      "phase": "won",
      "core": 3,
      "unitsLost": 4,
      "gross": 500,
      "refund": 25,
      "balance": 5
    },
    "digests": {
      "outcome": "71faf9d9a1ed58cf5ec02051f5d9f1b70166a8c94c555af29f7b7ee549ec206d",
      "initial": "f7fdca8f7afa03fdced4d39d82e329d9f8341aa2a7cb0c11d7b4a122565ae9d8",
      "actions": "59d7a7012cfb969c77f16e0cf7b502c7ec0e116e49f0e2e52484ff747fb2063b",
      "events": "466b9e9fa7f4d4b8deda16f5db16b3506dcfd3bcd4594c7675cca038a5f73d8e",
      "frames": "3e58274a0df1fecc2cedcd4de3be7ada5ca2ea4e9e7d3abeac5e3877d740073f",
      "final": "70314660ea0988df3e8ddca2285b61fc9278f284f6e8146aa1a8d8d8f9fbc4ce"
    }
  },
  {
    "name": "familiarBroad-seed127-delay3",
    "options": {
      "policy": "familiarBroad",
      "seed": 127,
      "delay": 3
    },
    "expected": {
      "phase": "lost",
      "core": 0,
      "unitsLost": 4,
      "gross": 500,
      "refund": 25,
      "balance": 5
    },
    "digests": {
      "outcome": "deb716aef0345474db26988abea2669b6ec809dbcf9084c959349a72e82a4392",
      "initial": "f7fdca8f7afa03fdced4d39d82e329d9f8341aa2a7cb0c11d7b4a122565ae9d8",
      "actions": "88a21b773c73b4bd32741be999f484fdd4e05f1cf5bfda188ea7931bb3ad03aa",
      "events": "f5f2bbd748ae3696d144fb700d1aa5227744e4fb44e6a777481bc48252027b5c",
      "frames": "e2868f333893df1a06247f572ee993d5f96d5625c24bcd2ef4e03d0ba2148832",
      "final": "d9c7560b4cff86974114f4401775f66cd389a37272742862f7f4a59767d92d1a"
    }
  },
  {
    "name": "familiarBroad-seed127-delay6",
    "options": {
      "policy": "familiarBroad",
      "seed": 127,
      "delay": 6
    },
    "expected": {
      "phase": "won",
      "core": 5,
      "unitsLost": 2,
      "gross": 500,
      "refund": 25,
      "balance": 5
    },
    "digests": {
      "outcome": "ba0afe0e4bd14c7c89c44f94a28c1778903a28cfc3eaf20c66c2fcded86fbba5",
      "initial": "f7fdca8f7afa03fdced4d39d82e329d9f8341aa2a7cb0c11d7b4a122565ae9d8",
      "actions": "0e5275d0dd5e094a403b3b135b4f92e7f9ef0d7d30f258332d2a15fc9b0c2b24",
      "events": "050d3e37843cc91b579c15a4b961c0e09b2459cdc90024aab56ef92859bbcd6b",
      "frames": "88a2f4248da6f64dbea7166abd91ec63ee94394d08c129056981a5f4b3db534a",
      "final": "130f4160a87594018dd6a7c93c7013af1fa5e8c5f125ad36de77797e73424380"
    }
  }
];
function witnesses(r){
 const groups=new Map();for(const hit of r.events.filter(e=>e.type==='hit'&&e.unitType==='gpt')){if(!groups.has(hit.shotId))groups.set(hit.shotId,[]);groups.get(hit.shotId).push(hit);}
 const ordered=[...groups.values()];
 const armorFirst=ordered.find(h=>h.length===2&&h[0].enemyType==='armor'&&h[1].enemyType==='charge');
 assert(armorFirst,'actual armor then charger projectile hits');
 const chargerFirst=ordered.find(h=>h.length===2&&h[0].enemyType==='charge'&&h[1].enemyType==='armor'&&h[0].target===armorFirst[1].target&&h[1].target===armorFirst[0].target);
 assert(chargerFirst,'same living pair reverses target order');
 const pairAt=f=>{const armor=f.enemies.find(e=>e.id===armorFirst[0].target),charger=f.enemies.find(e=>e.id===armorFirst[1].target);return armor&&charger?{time:f.time,armor,charger}:null;};
 const pairs=r.frames.map(pairAt).filter(Boolean),behind=pairs.find(p=>p.charger.x>p.armor.x),ahead=pairs.find(p=>p.charger.x<p.armor.x);
 assert(behind&&ahead&&behind.time<ahead.time,'sampled living charger overtakes armor');
 assert.equal(r.outcome.hitFacts.gptMixedArmorLightShots,15);assert.equal(r.outcome.hitFacts.gptTwoTargetShots,32);
 return {armorFirst,chargerFirst,behind,ahead,hitFacts:r.outcome.hitFacts};
}
function run(){
 let deployments=0,withdrawals=0;const results=[],wins={broadBolts:0,piercePacket:0,heavyThenLight:0,familiarBroad:0};
 for(const f of fixtures){
  const r=simulate(f.options);r.outcome.auditPolicy=f.options.policy;
  for(const [key,expected] of Object.entries(f.digests))assert.equal(digest(r[key]),expected,`${f.name}: exact ${key}`);
  for(const [key,expected] of Object.entries(f.expected))assert.equal(r.outcome[key],expected,`${f.name}: ${key}`);
  let spent=0,refunded=0;
  for(const a of r.actions){
   assert(a.result.ok);assert.notEqual(a.kind,'collect');
   const credits=30*Math.max(0,Math.min(10,Math.floor((a.time-4+1e-9)/6)));
   assert.equal(a.before,180+credits+refunded-spent);
   if(a.kind==='deploy'){const cost=E.definitions.units[a.type].cost;assert(E.roster.includes(a.type));assert(a.before>=cost);spent+=cost;deployments++;assert.equal(a.after,a.before-cost);}
   if(a.kind==='emergencyWithdraw'){refunded+=a.result.amount;withdrawals++;assert.equal(a.after,a.before+a.result.amount);}
  }
  assert.equal(r.outcome.gross,spent);assert.equal(r.outcome.refund,refunded);
  assert.equal(r.final.compute,180+r.final.stats.earned+refunded-spent);assert.equal(r.final.stats.earned,300);assert(r.final.stats.emergencyCount<=1);
  assert.deepEqual(r.events.filter(e=>e.type==='spawn').map(e=>({row:e.row,type:e.enemyType,time:e.time})),E.preview(7));
  if(r.outcome.unfulfilled.length){assert.equal(f.options.policy,'heavyThenLight');assert.equal(f.options.delay,6);assert.equal(r.outcome.phase,'lost');}
  if(f.options.policy==='broadBolts')assert(r.outcome.core>=4);
  if(f.options.policy==='piercePacket')assert.equal(r.outcome.core,5);
  if(r.outcome.phase==='won')wins[f.options.policy]++;
  if(f.name==='piercePacket-seed1-delay0')witnesses(r);
  results.push(r.outcome);
 }
 assert.equal(deployments,429);assert.equal(withdrawals,34);
 assert.deepEqual(wins,{broadBolts:12,piercePacket:12,heavyThenLight:6,familiarBroad:9});
 assert.equal(JSON.stringify(E.levels),contentBefore);
 console.log('PASS Main6: 48 exact production traces; 429 deployments / 34 withdrawals; wins '+JSON.stringify(wins)+'; living target-order reversal and mixed piercing witnesses');
 return results;
}
if(require.main===module)run();
module.exports={simulate,fixtures,witnesses,run};
