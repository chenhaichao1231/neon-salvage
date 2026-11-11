'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const E = require('./td-lanes-content');
const digest = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

// Frozen bounded design audit, not an optimal-play or human-acceptance claim.
// The original pilot failed three of four policies. A documented correction moved
// shared rescue checks from 64+d to 28+d and replaced the poor armorSplash plan
// with mixedFronts. No schedule tuning followed. Those pilot failures are not
// part of these 48 corrected cases; guard losses and the armor leak remain below.
// Expected SHA-256 values come from the frozen pre-integration trace JSON, never
// from this engine's output. Every field of outcome, initial, actions, events,
// half-second frames and final (including the retry snapshot) is checked exactly.
// There is NO text normalization: snapshots store numeric level ID 6, not briefing
// prose, so the final compact briefing does not alter these historical traces.
// JSON property/array order and all floating-point values are deliberately exact.
// Uses the integrated seventh encounter and public API only: no content injection,
// resource/HP mutation, manual collection, external fixtures, filesystem or Git.
assert.equal(E.levels.length, 9);
assert.equal(digest(E.levels[6]), 'c0b02a687bf0bab2df7be968d9bde8b12b9e5fd6946aa24a467a93a04e96d2cc');
const contentBefore = JSON.stringify(E.levels);

function simulate({version='v1',policy='boltAllocation',seed=1,delay=0,withdraw=true,level=null,trace=true}={}){
 const levelId=level===null?6:level;
 const s=E.create(levelId,{seed}),actions=[],events=[],frames=[],considered=[];
 const gross=()=>actions.filter(a=>a.kind==='deploy'&&a.result.ok).reduce((a,b)=>a+E.definitions.units[b.type].cost,0);
 const remaining=row=>E.preview(s.level).slice(s.nextSpawn).some(p=>p.row===row)||s.enemies.some(e=>e.row===row);
 const idle=()=>s.units.filter(u=>!remaining(u.row)).sort((a,b)=>E.definitions.units[a.type].cost-E.definitions.units[b.type].cost||a.row-b.row||a.col-b.col);
 const act=(kind,args,reason)=>{const before=s.compute;let result=E[kind](s,...args);let a={time:s.time,kind,args,reason,before,after:s.compute,result};if(kind==='deploy')Object.assign(a,{row:args[0],col:args[1],type:args[2]}); actions.push(a);assert(result.ok,JSON.stringify(a));return result;};
 const paid=(kind,args,reason)=>{if(s.phase==='battle'){act('pause',[true],'paid decision'); const state=JSON.stringify(s);assert.deepEqual(E.step(s,1),[]);assert.equal(JSON.stringify(s),state);}const r=act(kind,args,reason);if(s.phase==='battle')act('pause',[false],'resume');return r;};
 const buy=(row,col,type,reason)=>paid('deploy',[row,col,type],reason);
 const tryWithdrawal=(reason,specific=null)=>{if(!withdraw||s.stats.emergencyCount)return false;let u=specific?s.units.find(u=>u.row===specific.row&&u.col===specific.col&&!remaining(u.row)):idle()[0];if(!u)return false;paid('emergencyWithdraw',[u.id],reason);return true;};
 let queue=[];
 const plan=(time,row,col,type,reason)=>queue.push({time:time+delay,row,col,type,reason});
 if(policy==='mixedFronts'){
  buy(3,0,'grok','initial crowd coverage');buy(1,0,'deepseek','initial armor lane coverage');buy(2,0,'deepseek','opening center coverage');
  plan(16,0,0,'deepseek','cover first edge');plan(28,4,0,'deepseek','cover second edge');plan(40,3,1,'deepseek','support crowd against chargers');plan(52,4,1,'grok','split splash to second crowd');plan(64,1,1,'deepseek','support lingering armor');
 }else{
  for(let row=0;row<3;row++)buy(row,0,'deepseek','initial broad coverage');
  plan(10,3,0,'deepseek','cover lane4');plan(22,4,0,'deepseek','cover lane5');
  if(policy==='boltAllocation'){
   plan(28,3,1,'deepseek','reinforce active crowd');plan(40,4,1,'deepseek','split to second crowd');plan(52,1,1,'deepseek','support lingering armor');plan(64,0,1,'deepseek','outer charger reinforcement');
  }else if(policy==='familiarMain4'){
   plan(28,2,1,'deepseek','familiar center reinforcement');plan(40,4,1,'deepseek','familiar lane5 reinforcement');plan(52,0,1,'deepseek','familiar lane1 reinforcement');
  }else throw Error(policy);
 }
 const initial=JSON.parse(JSON.stringify(s));act('start',[],'start');
 let nextRescue=28+delay;
 function rescue(){
  const threats=Array.from({length:5},(_,row)=>{const es=s.enemies.filter(e=>e.row===row&&e.x<3),us=s.units.filter(u=>u.row===row);return {row,es,us,hp:us.length?Math.min(...us.map(u=>u.hp)):0,x:es.length?Math.min(...es.map(e=>e.x)):99};}).filter(r=>r.es.length&&(r.us.length<2||r.hp<=45)).sort((a,b)=>(a.us.length>0)-(b.us.length>0)||a.hp-b.hp||a.x-b.x||a.row-b.row);
  const t=threats[0];if(!t)return;
  const c=Array.from({length:7},(_,i)=>i).find(c=>!t.us.some(u=>u.col===c));
  if(c===undefined)return;
  if(s.compute<50)tryWithdrawal('ordinary recovery: idle lane refund');
  if(s.compute>=50)buy(t.row,c,'deepseek','ordinary late threat recovery');else considered.push({time:s.time,kind:'rescue-shortage',row:t.row,col:c,compute:s.compute,nearestEnemyX:t.x,minGuardHP:t.hp});
 }
 while(s.phase==='battle'&&s.time<180){
  events.push(...E.step(s,1/60));if(s.phase!=='battle')break;
  const due=queue.filter(a=>a.time<=s.time+1e-9);queue=queue.filter(a=>a.time>s.time+1e-9);
  for(const a of due){
   const cost=E.definitions.units[a.type].cost;
   if(s.units.some(u=>u.row===a.row&&u.col===a.col&&u.type===a.type)){considered.push({time:s.time,kind:'scheduled-satisfied-by-recovery',...a,compute:s.compute});}
   else if(s.compute>=cost&&!s.units.some(u=>u.row===a.row&&u.col===a.col))buy(a.row,a.col,a.type,a.reason);
   else {considered.push({time:s.time,kind:'scheduled-defer',...a,compute:s.compute,cost});queue.push({...a,time:s.time+6});}
  }
  if(s.time>=nextRescue-1e-9){rescue();nextRescue+=6;}
  if(trace&&s.tick%30===0)frames.push({time:s.time,compute:s.compute,core:s.core,units:s.units.map(u=>({id:u.id,row:u.row,col:u.col,type:u.type,hp:u.hp,status:u.status})),enemies:s.enemies.map(e=>({id:e.id,row:e.row,type:e.type,x:e.x,hp:e.hp}))});
 }
 const guardDamage=events.filter(e=>e.type==='unit-hit').reduce((a,e)=>a+e.amount,0);
 const outcome={version,level:levelId,policy,seed,delay,withdraw,phase:s.phase,time:s.time,core:s.core,kills:s.stats.kills,leaks:s.stats.leaks,unitsLost:s.stats.unitsLost,gross:gross(),refund:s.stats.emergencyRefunds,balance:s.compute,earned:s.stats.earned,guardDamage,damagedLanes:[...new Set(events.filter(e=>e.type==='unit-hit').map(e=>e.row+1))],lostLanes:events.filter(e=>e.type==='unit-lost').map(e=>e.row+1),leakEvents:events.filter(e=>e.type==='leak'),withdrawal:s.stats.emergencyWithdrawal,unfulfilled:queue,deferrals:considered};
 return {outcome,initial,actions,events:trace?events:events.filter(e=>['leak','unit-hit','unit-lost'].includes(e.type)),frames,final:JSON.parse(JSON.stringify(s))};
}

const fixtures = [
  {
    "name": "mixedFronts-seed1-delay0",
    "options": {
      "policy": "mixedFronts",
      "seed": 1,
      "delay": 0,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 87.66666666666667,
      "core": 5,
      "unitsLost": 0,
      "gross": 460,
      "refund": 25,
      "balance": 45,
      "guardDamage": 18
    },
    "digests": {
      "outcome": "ae1d22242c7bb5b8d1bf9c02cc2e1bc2de185306b457c48c882b313c89b42ae5",
      "initial": "d63b61281ff692eaaeff48f92cba0ed87bbb82fafed71b7fc26fe5276d5d7f21",
      "actions": "d651290696a353dcad87441f2cec57e0ad6eee58a6bee17a9f5b0985210285c0",
      "events": "7958b69ba248c8ff52a04626fa7d8613b09be86e02337e1c0d7d75f914bfe358",
      "frames": "db0bc79e46907f6555f24012789872d85a037a8a303b771420c19c8da302a96d",
      "final": "f2b5ee8366dc62d953dff7ca743f6fd34e8777b72e26eecc46234d7ca47eddd7",
      "paidActions": "c8f6b9a194126690f2a634247a836271b7a671172eeab23bbf158bb2c474bb57"
    }
  },
  {
    "name": "mixedFronts-seed1-delay3",
    "options": {
      "policy": "mixedFronts",
      "seed": 1,
      "delay": 3,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 87.66666666666667,
      "core": 5,
      "unitsLost": 0,
      "gross": 460,
      "refund": 25,
      "balance": 45,
      "guardDamage": 54
    },
    "digests": {
      "outcome": "dc3c13314893eacb1296a28636c64a28e5ccd1056a168a723d330bd9111695e6",
      "initial": "d63b61281ff692eaaeff48f92cba0ed87bbb82fafed71b7fc26fe5276d5d7f21",
      "actions": "61b6c5ad860436a38786405bd1fa049d94dca9e0050f23fdf7b69a14600dd027",
      "events": "411513608c2037f1fdefec6d012761281e0af637e257545a7b0f1562b3e4c85a",
      "frames": "c9cd31874066ab2050f7b75bda56453ed93c7fd9eb6e010b11164860cae6fdb4",
      "final": "5541bf913e345357b7b130874d55aa94cfcf61fc566e0de506269bf5bdfddda0",
      "paidActions": "ef653a26ce5422eb0f3927a1242fe93714020c56493f361ca2e7abd88060ebe2"
    }
  },
  {
    "name": "mixedFronts-seed1-delay6",
    "options": {
      "policy": "mixedFronts",
      "seed": 1,
      "delay": 6,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 87.66666666666667,
      "core": 5,
      "unitsLost": 0,
      "gross": 460,
      "refund": 25,
      "balance": 45,
      "guardDamage": 25
    },
    "digests": {
      "outcome": "8e0169b1d938b8eac54836a83c4ca17976a603a45276d8a7bafa53154c7579b9",
      "initial": "d63b61281ff692eaaeff48f92cba0ed87bbb82fafed71b7fc26fe5276d5d7f21",
      "actions": "62c77d327a6bf31d6b21a048da5c3420ea056d83519e7616e57a14c0ff6fd728",
      "events": "3da47c3246ef4d3e36bc520cc9b46c611dde32d2bc375d28a2683eb4f469ba0b",
      "frames": "5c0cead462689102b9bdbc16b1465a14e0791e1d48c7c3e905cfb0265ad1b43a",
      "final": "3274b3198e2b0bb14b3c2d82b4b421d0b8ab7335329c48c3c5de20ada1918866",
      "paidActions": "9c2c9b00d84d478169ee44279ccb0298b0cfdd903823f4be189340d3bde173a9"
    }
  },
  {
    "name": "mixedFronts-seed7-delay0",
    "options": {
      "policy": "mixedFronts",
      "seed": 7,
      "delay": 0,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 88.26666666666667,
      "core": 5,
      "unitsLost": 0,
      "gross": 460,
      "refund": 25,
      "balance": 45,
      "guardDamage": 18
    },
    "digests": {
      "outcome": "4a5fba1041eaa77a426da4242807828dbc5f91ec5db48169f5e2c715602e1b17",
      "initial": "22cfd06f4b72b133e2fb1360f15cc3c2c9d612043cb4b5a7b7cf163a692b4318",
      "actions": "d651290696a353dcad87441f2cec57e0ad6eee58a6bee17a9f5b0985210285c0",
      "events": "a27ca639521643499658bc54719b71b85a9ab5f220cf4c860295767299d21d60",
      "frames": "de72c27ce9276f6f7fbb9849cb48609205181c3dca6a1bcb5e49267eaea4a5db",
      "final": "974eaccfcd28378359381eec4db4a3a6e08d4efe1a2941474ba32612e0ab1710",
      "paidActions": "c8f6b9a194126690f2a634247a836271b7a671172eeab23bbf158bb2c474bb57"
    }
  },
  {
    "name": "mixedFronts-seed7-delay3",
    "options": {
      "policy": "mixedFronts",
      "seed": 7,
      "delay": 3,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 88.26666666666667,
      "core": 5,
      "unitsLost": 0,
      "gross": 460,
      "refund": 25,
      "balance": 45,
      "guardDamage": 54
    },
    "digests": {
      "outcome": "57ea22826b79d141252081762b7bbb8c964d2709261de8a5c79e756b0fce00cb",
      "initial": "22cfd06f4b72b133e2fb1360f15cc3c2c9d612043cb4b5a7b7cf163a692b4318",
      "actions": "61b6c5ad860436a38786405bd1fa049d94dca9e0050f23fdf7b69a14600dd027",
      "events": "74cec80f6033806fef9db80d25fe76cc932b7dba65022b9ce85596dfdc535bb0",
      "frames": "48b7cec695b5d0260a27d82ac3a06392da53c4f652d2fa7bedecb8c9520f26e2",
      "final": "69d45be0f3a6395d67f9918c269f94eb349cc239b604781a2c9d3589f766bc97",
      "paidActions": "ef653a26ce5422eb0f3927a1242fe93714020c56493f361ca2e7abd88060ebe2"
    }
  },
  {
    "name": "mixedFronts-seed7-delay6",
    "options": {
      "policy": "mixedFronts",
      "seed": 7,
      "delay": 6,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 89.33333333333333,
      "core": 5,
      "unitsLost": 0,
      "gross": 460,
      "refund": 25,
      "balance": 45,
      "guardDamage": 25
    },
    "digests": {
      "outcome": "568e015308136c9a8d9edc670653c42b42a519b899422f076627c3925e951e86",
      "initial": "22cfd06f4b72b133e2fb1360f15cc3c2c9d612043cb4b5a7b7cf163a692b4318",
      "actions": "62c77d327a6bf31d6b21a048da5c3420ea056d83519e7616e57a14c0ff6fd728",
      "events": "0066941258e38d21c4244182bf70d38cd108789635c3766d702176a34516edbb",
      "frames": "b82812f092290d3887036965639249d9f1021014402e97e8e63232e8141ffadb",
      "final": "de00bc6ad4a8f65d4c7636c3583985714836ca410ac6daf231f35b20a281ff91",
      "paidActions": "9c2c9b00d84d478169ee44279ccb0298b0cfdd903823f4be189340d3bde173a9"
    }
  },
  {
    "name": "mixedFronts-seed30-delay0",
    "options": {
      "policy": "mixedFronts",
      "seed": 30,
      "delay": 0,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 87.76666666666667,
      "core": 5,
      "unitsLost": 0,
      "gross": 460,
      "refund": 25,
      "balance": 45,
      "guardDamage": 18
    },
    "digests": {
      "outcome": "0ed0f62da31bd999a8dcb878600f33e9135c9190b363c9525b59bd83f70a2cde",
      "initial": "734c26512a492a0515eb9c0eb92cc31aa256a97160cd84eef3c482667de36409",
      "actions": "d651290696a353dcad87441f2cec57e0ad6eee58a6bee17a9f5b0985210285c0",
      "events": "41e4a41785951493b55094b21eb10b82df0960c513f6082c6f2e3dd494b014b0",
      "frames": "642e6281c524252b7607fda216ea9dbef1b2b263b9f096ef95346c1a0d65532c",
      "final": "1955fb7e5b5616556e83224fde47b354928dbc462f64be5ade38a06c61c86f23",
      "paidActions": "c8f6b9a194126690f2a634247a836271b7a671172eeab23bbf158bb2c474bb57"
    }
  },
  {
    "name": "mixedFronts-seed30-delay3",
    "options": {
      "policy": "mixedFronts",
      "seed": 30,
      "delay": 3,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 87.76666666666667,
      "core": 5,
      "unitsLost": 0,
      "gross": 460,
      "refund": 25,
      "balance": 45,
      "guardDamage": 54
    },
    "digests": {
      "outcome": "ed05f2fdf9c300be50eead2c0e360dddbaa51f30d553b1b0510f0f34a5284467",
      "initial": "734c26512a492a0515eb9c0eb92cc31aa256a97160cd84eef3c482667de36409",
      "actions": "61b6c5ad860436a38786405bd1fa049d94dca9e0050f23fdf7b69a14600dd027",
      "events": "6ce2f771ec81df3f19aa975c6b2ea6b907bab18d9ad08f4c5f6b4b5345797c5e",
      "frames": "269d701fb276cf17e1349e3bf87a06248378ed9f9aa84ddd54cb34acb92e2a29",
      "final": "dfdf177f5fc212c8f0dae3a3b0de02764ba34af9288e72736e0b2231c7ec8d14",
      "paidActions": "ef653a26ce5422eb0f3927a1242fe93714020c56493f361ca2e7abd88060ebe2"
    }
  },
  {
    "name": "mixedFronts-seed30-delay6",
    "options": {
      "policy": "mixedFronts",
      "seed": 30,
      "delay": 6,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 88.85,
      "core": 5,
      "unitsLost": 0,
      "gross": 460,
      "refund": 25,
      "balance": 45,
      "guardDamage": 25
    },
    "digests": {
      "outcome": "084c0bac0a190b4b0766814032075a8ea30eb5381a5a5a537549a88a19883c99",
      "initial": "734c26512a492a0515eb9c0eb92cc31aa256a97160cd84eef3c482667de36409",
      "actions": "62c77d327a6bf31d6b21a048da5c3420ea056d83519e7616e57a14c0ff6fd728",
      "events": "60393d6f631416ccb5404260a2426a14e083e2fb64737c75f43330188092dac8",
      "frames": "a4c2ff75a08dcb6993d9177f1f964384736e6ca5802f4cd33770c087f90a6e19",
      "final": "0b012118a80755f2cc7ae770534763e8b78a4cd9bfcbc68d7beb53bcd04572ce",
      "paidActions": "9c2c9b00d84d478169ee44279ccb0298b0cfdd903823f4be189340d3bde173a9"
    }
  },
  {
    "name": "mixedFronts-seed127-delay0",
    "options": {
      "policy": "mixedFronts",
      "seed": 127,
      "delay": 0,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 86.7,
      "core": 5,
      "unitsLost": 0,
      "gross": 460,
      "refund": 25,
      "balance": 45,
      "guardDamage": 18
    },
    "digests": {
      "outcome": "379a0b06f3f0d68c1c400d186acab85b9dda79ebabe7a501906cd34281d25aea",
      "initial": "42262ac15a723d1343ea3340311f1d0f64918659629b271e9034081666010420",
      "actions": "d651290696a353dcad87441f2cec57e0ad6eee58a6bee17a9f5b0985210285c0",
      "events": "be8f3286727e180644e4642bf7b68d7c9380a47523c60b4147d8326a61826f1d",
      "frames": "ff10139a12cef2cbd23127e428fcb76adb1fb98da5584c0245abf4609cf3102f",
      "final": "ac71954b64c66e40d24c9419e7f7aa2dda0f2be9996dd6c56f94910bae8851e4",
      "paidActions": "c8f6b9a194126690f2a634247a836271b7a671172eeab23bbf158bb2c474bb57"
    }
  },
  {
    "name": "mixedFronts-seed127-delay3",
    "options": {
      "policy": "mixedFronts",
      "seed": 127,
      "delay": 3,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 86.7,
      "core": 5,
      "unitsLost": 0,
      "gross": 460,
      "refund": 25,
      "balance": 45,
      "guardDamage": 54
    },
    "digests": {
      "outcome": "1f03de6caa2df9879ae10d1a7b3db2f3bea29a3d6b0c6db1f4e187c2b420363d",
      "initial": "42262ac15a723d1343ea3340311f1d0f64918659629b271e9034081666010420",
      "actions": "61b6c5ad860436a38786405bd1fa049d94dca9e0050f23fdf7b69a14600dd027",
      "events": "69cbc0deac5b6a08806a6a4b9b62b4fa7102c9438ce5924ba0c1de3e247692da",
      "frames": "0bc9836abcbd40986ee82278197eba0053846c9b0a8b20a1b425fc281e657505",
      "final": "e7f4830c435ef2973fd9352900d653f70999c7b34149f71fb0998769ae4ca469",
      "paidActions": "ef653a26ce5422eb0f3927a1242fe93714020c56493f361ca2e7abd88060ebe2"
    }
  },
  {
    "name": "mixedFronts-seed127-delay6",
    "options": {
      "policy": "mixedFronts",
      "seed": 127,
      "delay": 6,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 86.7,
      "core": 5,
      "unitsLost": 0,
      "gross": 460,
      "refund": 25,
      "balance": 45,
      "guardDamage": 25
    },
    "digests": {
      "outcome": "faafeaf4d7877ca0347c52d8f73592a241960093512a4e885baeaa47c3f79fff",
      "initial": "42262ac15a723d1343ea3340311f1d0f64918659629b271e9034081666010420",
      "actions": "62c77d327a6bf31d6b21a048da5c3420ea056d83519e7616e57a14c0ff6fd728",
      "events": "5b8de282dc61233f333ca882b94d81b31f2f6297cc4ac854955fb1f826eb13ad",
      "frames": "ce33d59aaceb492a5c3d1e7a36d51d6bbf8a48fcae2b23baf2b4cedb4f26e21e",
      "final": "54b3a21f58fc81add49533686886ef88d3a0b39c9aa82a6894cd047e5bfaec2a",
      "paidActions": "9c2c9b00d84d478169ee44279ccb0298b0cfdd903823f4be189340d3bde173a9"
    }
  },
  {
    "name": "boltAllocation-seed1-delay0",
    "options": {
      "policy": "boltAllocation",
      "seed": 1,
      "delay": 0,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 78.23333333333333,
      "core": 5,
      "unitsLost": 0,
      "gross": 450,
      "refund": 0,
      "balance": 30,
      "guardDamage": 0
    },
    "digests": {
      "outcome": "2866967d56baf6effc7d424d89523900807bdfdb2c88a7b8cfd2ef7f277f47dc",
      "initial": "fb3d2c1d7042be719419a85c6ced6d018612d2f0cca66bab13aa091d25b22192",
      "actions": "9b41c46e8e54c965a7d5b5fea28267862133e60ceab24629fc7d3670eaa72b5d",
      "events": "57a60c46e8c468d3a2e526ccdc4ec7a52f38339c5c1ce2d1fc331c75458d6281",
      "frames": "8c40d427b67309213e7c6ca0e27fcb8a6b08b39b74e00ffe31496af24d17445a",
      "final": "c810649d26ee1e865d334b49a1ccac58650138b91178c7e71d7ff38dae5eaf15",
      "paidActions": "8cf4c2999521dbbf7e51712c3ac2e8c3b84afd8c7648effe85135c9258a501a2"
    }
  },
  {
    "name": "boltAllocation-seed1-delay3",
    "options": {
      "policy": "boltAllocation",
      "seed": 1,
      "delay": 3,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 79.31666666666666,
      "core": 5,
      "unitsLost": 0,
      "gross": 450,
      "refund": 0,
      "balance": 30,
      "guardDamage": 0
    },
    "digests": {
      "outcome": "bea83b7891f5c2a46147ce501d4492530478b75d503eec3e0aa9ec7b09bab3ce",
      "initial": "fb3d2c1d7042be719419a85c6ced6d018612d2f0cca66bab13aa091d25b22192",
      "actions": "fd3704d7478ec2c6b640c36f33c5d515888b62cf6fe64cfeef6fc4fd1dedc11e",
      "events": "8714d1ca24ec415ed7498d435bc731e8578517c4f8d58a7f35bd6640bae7a300",
      "frames": "2829ee62e852a184d417d87587cb27b09e42fa249c1f98cc535ec6e0a19e1db3",
      "final": "92e8d1524099430020ec28600d8419624a30b6dac409781ebe3483ccbece050a",
      "paidActions": "3aa367bc08b73e95b6d6be94105e87466247aa3086f4565230826d028d3118e8"
    }
  },
  {
    "name": "boltAllocation-seed1-delay6",
    "options": {
      "policy": "boltAllocation",
      "seed": 1,
      "delay": 6,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 82,
      "core": 5,
      "unitsLost": 0,
      "gross": 450,
      "refund": 0,
      "balance": 30,
      "guardDamage": 102
    },
    "digests": {
      "outcome": "63f06da345b7c75498193090302bda764b240ce848242fb0aac8a98cd24f2fd7",
      "initial": "fb3d2c1d7042be719419a85c6ced6d018612d2f0cca66bab13aa091d25b22192",
      "actions": "2217fceda5211203a7ffcf13a5adaa1c77b7ff026c6006a63d8d7d830382dfa1",
      "events": "66087af84de04186d5c6810bd07bc2056e0067f29b9db62ad2b3c77a5d150b82",
      "frames": "4b194520279821227fa45e7a0903c293f6a495c136f2582fa5491cf5db7cce8a",
      "final": "e6be254502eaf6eb5d3eff62bd560a8d428ac1d9cb48c436292d4280fd817597",
      "paidActions": "6ff7a85882714e4ee695904b8b0921e07075526d99b915d2b59c7e69e6420b04"
    }
  },
  {
    "name": "boltAllocation-seed7-delay0",
    "options": {
      "policy": "boltAllocation",
      "seed": 7,
      "delay": 0,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 79.15,
      "core": 5,
      "unitsLost": 0,
      "gross": 450,
      "refund": 0,
      "balance": 30,
      "guardDamage": 0
    },
    "digests": {
      "outcome": "00f428852df44b559dd32c63d2ba346c906c69d8a19ba726d885190c87f45756",
      "initial": "5d79a389c69fe7a828dc0b950fd7e1ae3ac2fa0b986945b97ff18eec21093238",
      "actions": "9b41c46e8e54c965a7d5b5fea28267862133e60ceab24629fc7d3670eaa72b5d",
      "events": "ceda31eff9fdf94129ffb5c5e2950fd8da3ee5e32012534567d2945d97bd04f3",
      "frames": "7e63fa0a3d2d6f6153647af7d8d7096c8236ae14d429d95b6e035e81d54066bc",
      "final": "92876c066e50b6309bd6b52309a262f88268ad5d4878c6cdf0868de58b91badc",
      "paidActions": "8cf4c2999521dbbf7e51712c3ac2e8c3b84afd8c7648effe85135c9258a501a2"
    }
  },
  {
    "name": "boltAllocation-seed7-delay3",
    "options": {
      "policy": "boltAllocation",
      "seed": 7,
      "delay": 3,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 80.21666666666667,
      "core": 5,
      "unitsLost": 0,
      "gross": 450,
      "refund": 0,
      "balance": 30,
      "guardDamage": 7
    },
    "digests": {
      "outcome": "991641397e87e9c45fcbd2847b92d1716035bb5692f4ccf34da7f44c155b0c5e",
      "initial": "5d79a389c69fe7a828dc0b950fd7e1ae3ac2fa0b986945b97ff18eec21093238",
      "actions": "fd3704d7478ec2c6b640c36f33c5d515888b62cf6fe64cfeef6fc4fd1dedc11e",
      "events": "b70c42744f05a79a838815df57543892ce0d4796ad761cecd399d0fb076a6a08",
      "frames": "d9042a7a9f17abcd704c0d6348a4158b39e1c4b0f408a5e3c12222f16b3956bb",
      "final": "5a8900b61878ea0e1eddecf71b22e650f1f9175a1b39e6ea123ea1b75c7c56c1",
      "paidActions": "3aa367bc08b73e95b6d6be94105e87466247aa3086f4565230826d028d3118e8"
    }
  },
  {
    "name": "boltAllocation-seed7-delay6",
    "options": {
      "policy": "boltAllocation",
      "seed": 7,
      "delay": 6,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 82.36666666666666,
      "core": 5,
      "unitsLost": 0,
      "gross": 450,
      "refund": 0,
      "balance": 30,
      "guardDamage": 88
    },
    "digests": {
      "outcome": "2de03299101a6384f8fb154c49c1f42600bff3d5ad04a84e81c6dc96768c7e4f",
      "initial": "5d79a389c69fe7a828dc0b950fd7e1ae3ac2fa0b986945b97ff18eec21093238",
      "actions": "2217fceda5211203a7ffcf13a5adaa1c77b7ff026c6006a63d8d7d830382dfa1",
      "events": "f76d93b2a1817fa18ff0a10495fbaa3be36e3b135ed6705919c7d28cd5956905",
      "frames": "c65f706f7702d31a4cd0a7d6fe95e69c985f4364c9561034cd78dde38adb1b86",
      "final": "d28771d57620f7066feaff08e626f3d85a4434b7b0fdeb7e8f7ad3bb0b3aacf5",
      "paidActions": "6ff7a85882714e4ee695904b8b0921e07075526d99b915d2b59c7e69e6420b04"
    }
  },
  {
    "name": "boltAllocation-seed30-delay0",
    "options": {
      "policy": "boltAllocation",
      "seed": 30,
      "delay": 0,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 77.93333333333334,
      "core": 5,
      "unitsLost": 0,
      "gross": 450,
      "refund": 0,
      "balance": 30,
      "guardDamage": 0
    },
    "digests": {
      "outcome": "97c2950cb162d7ef4a38d1d4f6d816b094fab46b8b95d436341127ca3777952b",
      "initial": "37b4ee4cd25dd22f1ba7b99500ea8229041c330193476425fab0a3bd582c175a",
      "actions": "9b41c46e8e54c965a7d5b5fea28267862133e60ceab24629fc7d3670eaa72b5d",
      "events": "6b43cdddefb7e5fb9588744999ba0dff477b820c34aeb58e5e2900122c18b0ab",
      "frames": "6415721eac3e7f995429eaf420bc8f47b15ac4dab0044a6c844e73c33ac3c770",
      "final": "24e1710ef718ee9403704d0ab593291ebdd7c1ff92bcbee8ae02601dc69e18ab",
      "paidActions": "8cf4c2999521dbbf7e51712c3ac2e8c3b84afd8c7648effe85135c9258a501a2"
    }
  },
  {
    "name": "boltAllocation-seed30-delay3",
    "options": {
      "policy": "boltAllocation",
      "seed": 30,
      "delay": 3,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 80.08333333333333,
      "core": 5,
      "unitsLost": 0,
      "gross": 450,
      "refund": 0,
      "balance": 30,
      "guardDamage": 7
    },
    "digests": {
      "outcome": "25cbe57c2bfb2725b21d980777079b47e9bf5d2c55e4825fd4d5ad09a38dd3d2",
      "initial": "37b4ee4cd25dd22f1ba7b99500ea8229041c330193476425fab0a3bd582c175a",
      "actions": "fd3704d7478ec2c6b640c36f33c5d515888b62cf6fe64cfeef6fc4fd1dedc11e",
      "events": "0ad8e6b43f2ee4f40bec6ee23544b0481bdee511b3b2a012908b190e21f1b08f",
      "frames": "aa839833429e9d8f65adea9b24f11377215e821acd491c8adf638a16c207b1fc",
      "final": "c2c71b6985721c38ba6217c72dc2c652196bb4495a89b55168f7a14747caef36",
      "paidActions": "3aa367bc08b73e95b6d6be94105e87466247aa3086f4565230826d028d3118e8"
    }
  },
  {
    "name": "boltAllocation-seed30-delay6",
    "options": {
      "policy": "boltAllocation",
      "seed": 30,
      "delay": 6,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 81.16666666666667,
      "core": 5,
      "unitsLost": 0,
      "gross": 450,
      "refund": 0,
      "balance": 30,
      "guardDamage": 88
    },
    "digests": {
      "outcome": "96e52f315223903c716f2e50655426d1a8afc6e206ba5f0209b3def14433ec6e",
      "initial": "37b4ee4cd25dd22f1ba7b99500ea8229041c330193476425fab0a3bd582c175a",
      "actions": "2217fceda5211203a7ffcf13a5adaa1c77b7ff026c6006a63d8d7d830382dfa1",
      "events": "39871d15523c44e9038a651140369eba7f4e6706d9f56ef2b87e785b81416996",
      "frames": "e908b9a89ca6d066925c1e86ff13c5c339cb5b7ef25d1fa93d8f7593185c839a",
      "final": "917ad03a896e39add028ac276457ff3020b75a52f727fd7f823531a016ba8f45",
      "paidActions": "6ff7a85882714e4ee695904b8b0921e07075526d99b915d2b59c7e69e6420b04"
    }
  },
  {
    "name": "boltAllocation-seed127-delay0",
    "options": {
      "policy": "boltAllocation",
      "seed": 127,
      "delay": 0,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 78.46666666666667,
      "core": 5,
      "unitsLost": 0,
      "gross": 450,
      "refund": 0,
      "balance": 30,
      "guardDamage": 0
    },
    "digests": {
      "outcome": "bbeb86d586d9e8305d2b2ac84dccc618c801bb942bd514750a824ae03e4d47f1",
      "initial": "f3b2c75a71ff51ce1b71f2fb67560827ea0b4f5b78e785f3c7fb03ddb369683f",
      "actions": "9b41c46e8e54c965a7d5b5fea28267862133e60ceab24629fc7d3670eaa72b5d",
      "events": "fc93d7f3c66bab7f6e1b8ee0fb194a98025efc80fed66b5b591ad1e9b96262e8",
      "frames": "7b64dd03bea39328baca63060d5e4b70b3b9297f4f8593e6edd3c1034c6928da",
      "final": "1b281c78f09a2abd10a3bb5fcfcfd56d5fd6948c30e9c690846f491909293bd3",
      "paidActions": "8cf4c2999521dbbf7e51712c3ac2e8c3b84afd8c7648effe85135c9258a501a2"
    }
  },
  {
    "name": "boltAllocation-seed127-delay3",
    "options": {
      "policy": "boltAllocation",
      "seed": 127,
      "delay": 3,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 80.08333333333333,
      "core": 5,
      "unitsLost": 0,
      "gross": 450,
      "refund": 0,
      "balance": 30,
      "guardDamage": 0
    },
    "digests": {
      "outcome": "829b91bb7dc853a2a5a1eafbdd7621a302ab3ec738c2b1048bce60ae34f9f77a",
      "initial": "f3b2c75a71ff51ce1b71f2fb67560827ea0b4f5b78e785f3c7fb03ddb369683f",
      "actions": "fd3704d7478ec2c6b640c36f33c5d515888b62cf6fe64cfeef6fc4fd1dedc11e",
      "events": "ac49d2b00aa6958364433c43e9985fcd57d2690f85cc5fec0994e817b682098c",
      "frames": "675cd1016c6c450813a49caea68fcc80d40d68f9110be7983bca30969d669270",
      "final": "e1ffcc9693b7809c8634dff069edc16480172be35d50c495ee28f302e2001467",
      "paidActions": "3aa367bc08b73e95b6d6be94105e87466247aa3086f4565230826d028d3118e8"
    }
  },
  {
    "name": "boltAllocation-seed127-delay6",
    "options": {
      "policy": "boltAllocation",
      "seed": 127,
      "delay": 6,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 81.7,
      "core": 5,
      "unitsLost": 0,
      "gross": 450,
      "refund": 0,
      "balance": 30,
      "guardDamage": 95
    },
    "digests": {
      "outcome": "a92c68ddf88e7b511c65d7c267076372fa94afcbdf1198bed035c5e996916e64",
      "initial": "f3b2c75a71ff51ce1b71f2fb67560827ea0b4f5b78e785f3c7fb03ddb369683f",
      "actions": "2217fceda5211203a7ffcf13a5adaa1c77b7ff026c6006a63d8d7d830382dfa1",
      "events": "ba662a1eed286e53ff1c231574e1fc50e08af343191fb44675f15667931f5804",
      "frames": "374aea4fdd3123c4ec4c60d43560fb068a71c712d8fd74b9bc49bec475a2acc3",
      "final": "3b93eff714973372113433badeb36161279056a034d35f1f4bf19328bb135fdf",
      "paidActions": "6ff7a85882714e4ee695904b8b0921e07075526d99b915d2b59c7e69e6420b04"
    }
  },
  {
    "name": "familiarMain4-seed1-delay0",
    "options": {
      "policy": "familiarMain4",
      "seed": 1,
      "delay": 0,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 84.76666666666667,
      "core": 5,
      "unitsLost": 0,
      "gross": 500,
      "refund": 25,
      "balance": 5,
      "guardDamage": 107
    },
    "digests": {
      "outcome": "0d2f09a5b37c780bbba73f19573f39a5edfbb5d3b1d5e61c1b05632a0b21e1b5",
      "initial": "fb3d2c1d7042be719419a85c6ced6d018612d2f0cca66bab13aa091d25b22192",
      "actions": "b4b041bca4d1910de8a7fabbfaef07926c79a8dc2e0e660f2973ef38982c629d",
      "events": "0a73a287e5a25bbbf918f05268e3bc681c959fffec909affc9b3cc257d3fa1ca",
      "frames": "497e8f8dd7e177d97af822cd9d27375d58989a67c99559ae230ac3b609de0d5d",
      "final": "ffae6daa3e93835139279d59082d3e12e15233274a09fa6da60b68972f686db4",
      "paidActions": "c3e250f900a4a70e0aef292ec719bb20cf20a55227729530825a8765db7e1905"
    }
  },
  {
    "name": "familiarMain4-seed1-delay3",
    "options": {
      "policy": "familiarMain4",
      "seed": 1,
      "delay": 3,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 94.5,
      "core": 5,
      "unitsLost": 1,
      "gross": 500,
      "refund": 25,
      "balance": 5,
      "guardDamage": 256
    },
    "digests": {
      "outcome": "c806222459825183df57e3f900c84a79a4c90b5f61f1e362808ed53a6181db24",
      "initial": "fb3d2c1d7042be719419a85c6ced6d018612d2f0cca66bab13aa091d25b22192",
      "actions": "8192251c19882e007f1a54dc7ec14c52087572800770a7830d2e04b9cc993052",
      "events": "584a71043a7fd7e2b50baadb4e2da9a282a22ba1f5266ae71d6ede317fe1a4b8",
      "frames": "cb80765877fc82f2dcbbbadfc95b6dc864a7adb44b15abfae513811c3ff73eda",
      "final": "a48a3e35f91b8c5a80caf3e670e2e1f5ca354172ed0df6c82249e21608c068bf",
      "paidActions": "27217475262822b6abefbd4b5d0d00a749b03a3223fd73487755608b06bde45b"
    }
  },
  {
    "name": "familiarMain4-seed1-delay6",
    "options": {
      "policy": "familiarMain4",
      "seed": 1,
      "delay": 6,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 84.76666666666667,
      "core": 5,
      "unitsLost": 0,
      "gross": 500,
      "refund": 25,
      "balance": 5,
      "guardDamage": 156
    },
    "digests": {
      "outcome": "71cff2929c0d647bd9cf4dabce072cb375cf37337b6a99927c8613852ef1650c",
      "initial": "fb3d2c1d7042be719419a85c6ced6d018612d2f0cca66bab13aa091d25b22192",
      "actions": "9410af3a2a5668595e78cb7d73413738f9a990a3ab1f5b040bc7ef98028de4ab",
      "events": "f88e793ce7d330df07096e275b2c04bb889e9aef4b914e89e35384bd62889f1d",
      "frames": "3be8f251b17734a1e4e928ab38191a4456bae9e6c8ea584d4feb6c99e7391435",
      "final": "a3c25b902ce4ce08186b2103997d5bf80ffbd12a99d62efed4bcb6a7afa87b2b",
      "paidActions": "83f41be706fd7396b3800dabc213d4c3275a43dd3436ec34c9b05b6c53c4f6a8"
    }
  },
  {
    "name": "familiarMain4-seed7-delay0",
    "options": {
      "policy": "familiarMain4",
      "seed": 7,
      "delay": 0,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 85.65,
      "core": 5,
      "unitsLost": 1,
      "gross": 500,
      "refund": 25,
      "balance": 5,
      "guardDamage": 125
    },
    "digests": {
      "outcome": "6226f397f959125e0ba7ea9ac0f7feda70c1c45bc8e0cf26a891992ddd00e328",
      "initial": "5d79a389c69fe7a828dc0b950fd7e1ae3ac2fa0b986945b97ff18eec21093238",
      "actions": "b4b041bca4d1910de8a7fabbfaef07926c79a8dc2e0e660f2973ef38982c629d",
      "events": "370ea05c05198fd67137d35d44a42e849de308d8733eea4826b98f35b6cca332",
      "frames": "5cf433ddc1ff51167c44586e9d2454e58cb7d3a50a1c55a3f0368942aaf824a9",
      "final": "0e57c3f48ade5a099086dea1deacaeb84719435da508857bba8b9b63d7540be6",
      "paidActions": "c3e250f900a4a70e0aef292ec719bb20cf20a55227729530825a8765db7e1905"
    }
  },
  {
    "name": "familiarMain4-seed7-delay3",
    "options": {
      "policy": "familiarMain4",
      "seed": 7,
      "delay": 3,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 102.53333333333333,
      "core": 4,
      "unitsLost": 3,
      "gross": 500,
      "refund": 25,
      "balance": 5,
      "guardDamage": 271
    },
    "digests": {
      "outcome": "da380cc5ec0298557e622da89cbc196624909b6eeda410bcccd4cf37b7c89257",
      "initial": "5d79a389c69fe7a828dc0b950fd7e1ae3ac2fa0b986945b97ff18eec21093238",
      "actions": "8192251c19882e007f1a54dc7ec14c52087572800770a7830d2e04b9cc993052",
      "events": "b5355d3f0ce72e51408d0bd40ae2ad8ab198f31ec12314e25462f6e7c9904b49",
      "frames": "01fcb0cef108a6188ef9a3d7068d89b1e7a858723e2de44036fbd7c43b508cda",
      "final": "e4ab216e6624c78c15d90db554389c224efae2299f1d0284e3c77c93225b13e6",
      "paidActions": "27217475262822b6abefbd4b5d0d00a749b03a3223fd73487755608b06bde45b"
    }
  },
  {
    "name": "familiarMain4-seed7-delay6",
    "options": {
      "policy": "familiarMain4",
      "seed": 7,
      "delay": 6,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 85.65,
      "core": 5,
      "unitsLost": 1,
      "gross": 500,
      "refund": 25,
      "balance": 5,
      "guardDamage": 160
    },
    "digests": {
      "outcome": "98c4afceb40238c8e948f7fff70891c02a26c9e1a656ef0a807d38ddab7cfdde",
      "initial": "5d79a389c69fe7a828dc0b950fd7e1ae3ac2fa0b986945b97ff18eec21093238",
      "actions": "9410af3a2a5668595e78cb7d73413738f9a990a3ab1f5b040bc7ef98028de4ab",
      "events": "6f7dab38042470642fb1b1f0b04729a1c4b69f9013238823ef327299c67de159",
      "frames": "6bcc4de28dd21a7af0ecbdf48b508cb5c9186976ef3f3d999eb6b14ec3e7e078",
      "final": "a136cd4eb5049c0a60071d386e0058540364f3d2e0453b0567ee7d4bb7792634",
      "paidActions": "83f41be706fd7396b3800dabc213d4c3275a43dd3436ec34c9b05b6c53c4f6a8"
    }
  },
  {
    "name": "familiarMain4-seed30-delay0",
    "options": {
      "policy": "familiarMain4",
      "seed": 30,
      "delay": 0,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 84.46666666666667,
      "core": 5,
      "unitsLost": 0,
      "gross": 500,
      "refund": 25,
      "balance": 5,
      "guardDamage": 107
    },
    "digests": {
      "outcome": "a99304978ac36434ac90988fe1cb48f117dde9c9f1dfec6e045fa603c02fc082",
      "initial": "37b4ee4cd25dd22f1ba7b99500ea8229041c330193476425fab0a3bd582c175a",
      "actions": "b4b041bca4d1910de8a7fabbfaef07926c79a8dc2e0e660f2973ef38982c629d",
      "events": "7b02a268ebc697f9e202347178c080938cfa1f08ea86b64d65b09eb7cc2f774a",
      "frames": "5ab067c7fbdb28711a74621daa2cde3da47cc931538c2740c1b8996892d18089",
      "final": "84bdff60e1ff4c3ce54c08b2983633282b4ccbb9115ed17971e6e79194abe98b",
      "paidActions": "c3e250f900a4a70e0aef292ec719bb20cf20a55227729530825a8765db7e1905"
    }
  },
  {
    "name": "familiarMain4-seed30-delay3",
    "options": {
      "policy": "familiarMain4",
      "seed": 30,
      "delay": 3,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 95.3,
      "core": 5,
      "unitsLost": 2,
      "gross": 500,
      "refund": 25,
      "balance": 5,
      "guardDamage": 242
    },
    "digests": {
      "outcome": "532f80f07a4592b95ff3427fb77bccfb9854ac711a87cb8e24e50d29f7c2c5e8",
      "initial": "37b4ee4cd25dd22f1ba7b99500ea8229041c330193476425fab0a3bd582c175a",
      "actions": "8192251c19882e007f1a54dc7ec14c52087572800770a7830d2e04b9cc993052",
      "events": "5eed01547849ece5caa8fd50587ee444fc766c0677180dc851f9f53d1481b0d6",
      "frames": "d6a8ad64993775e5cce6022aa249e7fdfe73ab433ef87841a71747e51ef20b80",
      "final": "40acf3175877c646b82c59ab7181b1662c3fcf58497345c2d1039940bc873f40",
      "paidActions": "27217475262822b6abefbd4b5d0d00a749b03a3223fd73487755608b06bde45b"
    }
  },
  {
    "name": "familiarMain4-seed30-delay6",
    "options": {
      "policy": "familiarMain4",
      "seed": 30,
      "delay": 6,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 84.46666666666667,
      "core": 5,
      "unitsLost": 0,
      "gross": 500,
      "refund": 25,
      "balance": 5,
      "guardDamage": 142
    },
    "digests": {
      "outcome": "e111f4bebedac8e674893fda1a48fa1255d120eb82f020c6fd80843da8034d1d",
      "initial": "37b4ee4cd25dd22f1ba7b99500ea8229041c330193476425fab0a3bd582c175a",
      "actions": "9410af3a2a5668595e78cb7d73413738f9a990a3ab1f5b040bc7ef98028de4ab",
      "events": "1ffe4938d1b6d6a90c717ce7340cd64463671cfcc1e6ab3874ab9ba9e1a295fa",
      "frames": "a44ce5d4fc675f2af00777ae5e6869c793ac4f5ba683ba61f2fe659729b0e9a3",
      "final": "591bbded592c0ef21774d4ba38cba5d4328472755385f83e18c8552a46a793ec",
      "paidActions": "83f41be706fd7396b3800dabc213d4c3275a43dd3436ec34c9b05b6c53c4f6a8"
    }
  },
  {
    "name": "familiarMain4-seed127-delay0",
    "options": {
      "policy": "familiarMain4",
      "seed": 127,
      "delay": 0,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 84.46666666666667,
      "core": 5,
      "unitsLost": 0,
      "gross": 500,
      "refund": 25,
      "balance": 5,
      "guardDamage": 107
    },
    "digests": {
      "outcome": "e44a9e87fba33017b644aac50dccf8a386845a4fca3df1833ccca4c6c306eb6d",
      "initial": "f3b2c75a71ff51ce1b71f2fb67560827ea0b4f5b78e785f3c7fb03ddb369683f",
      "actions": "b4b041bca4d1910de8a7fabbfaef07926c79a8dc2e0e660f2973ef38982c629d",
      "events": "6182c083ab099f509cbf259615e7f83b2ac7d92dafc314117ab3f2769211139d",
      "frames": "19f08eb1c73a65fd4efe0076a07ace6ff954474ec2a90292fe728f850d8e6410",
      "final": "5111f84e3c188f3e72c4eb5c222f30149de640c52d08a4d4d75e660d735f53c8",
      "paidActions": "c3e250f900a4a70e0aef292ec719bb20cf20a55227729530825a8765db7e1905"
    }
  },
  {
    "name": "familiarMain4-seed127-delay3",
    "options": {
      "policy": "familiarMain4",
      "seed": 127,
      "delay": 3,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 94.3,
      "core": 5,
      "unitsLost": 2,
      "gross": 500,
      "refund": 25,
      "balance": 5,
      "guardDamage": 235
    },
    "digests": {
      "outcome": "5faf41bccf97b6d04b89b45562c3d6c7b0aaa6c428953f29017828518779b8db",
      "initial": "f3b2c75a71ff51ce1b71f2fb67560827ea0b4f5b78e785f3c7fb03ddb369683f",
      "actions": "8192251c19882e007f1a54dc7ec14c52087572800770a7830d2e04b9cc993052",
      "events": "92c5be4f97680934f1cdcd6613e1b8d4230a733b1635359fa79ba33dbf4e1b8f",
      "frames": "3b5b5e995e36b489639cc075b0250cc14b988019953ee3fdc92dcf1c598aa633",
      "final": "ee39e1103aaf76492be669e676f1891d7f6ecf4cbda89c228335959b38891cf1",
      "paidActions": "27217475262822b6abefbd4b5d0d00a749b03a3223fd73487755608b06bde45b"
    }
  },
  {
    "name": "familiarMain4-seed127-delay6",
    "options": {
      "policy": "familiarMain4",
      "seed": 127,
      "delay": 6,
      "withdraw": true
    },
    "expected": {
      "phase": "won",
      "time": 84.46666666666667,
      "core": 5,
      "unitsLost": 0,
      "gross": 500,
      "refund": 25,
      "balance": 5,
      "guardDamage": 149
    },
    "digests": {
      "outcome": "e0f543c3ecd694a91cd8b39132601574934445f348cbbf78057f43dd7fc0ad10",
      "initial": "f3b2c75a71ff51ce1b71f2fb67560827ea0b4f5b78e785f3c7fb03ddb369683f",
      "actions": "9410af3a2a5668595e78cb7d73413738f9a990a3ab1f5b040bc7ef98028de4ab",
      "events": "c370748a2376377895cabf1bcbaa0efc5fb8e80d00bfaba0bad529e6be3f032a",
      "frames": "b6fcc30d7757b602c50a786aab26dccadd40457a9c5415654759d949d740cb54",
      "final": "acedb702d2c6dbe1cfa64eb60dfbea88a2827415b289016be28c080427dee920",
      "paidActions": "83f41be706fd7396b3800dabc213d4c3275a43dd3436ec34c9b05b6c53c4f6a8"
    }
  },
  {
    "name": "mixedFronts-retain-seed1-delay0",
    "options": {
      "policy": "mixedFronts",
      "seed": 1,
      "delay": 0,
      "withdraw": false
    },
    "expected": {
      "phase": "won",
      "time": 87.66666666666667,
      "core": 5,
      "unitsLost": 0,
      "gross": 460,
      "refund": 0,
      "balance": 20,
      "guardDamage": 72
    },
    "digests": {
      "outcome": "8c5d06789402fc3a031659ca2453ae35925cb0caecfbbced962068aaea933bcc",
      "initial": "d63b61281ff692eaaeff48f92cba0ed87bbb82fafed71b7fc26fe5276d5d7f21",
      "actions": "f2d3aec113ddcdc4373e9f6d247bdfe0422cc31c9bcef096675718eb81c94d1e",
      "events": "1de0d41230524f2414b8069d10b48304c9014c17906b4f796f45f784d6c4e8f5",
      "frames": "89cbe01ae1c823b82c45d0a38821f6a0507211f2a5104fcc31d0150b7dc7d08b",
      "final": "0f83341662c01b9497f6796b2d915503cc492fbb2bab6b912c62ee0b6a4b8be7",
      "paidActions": "d21143a388bcb67a102b77337047a58bffcc02a06494e0d009a13ee7250db2a2"
    }
  },
  {
    "name": "mixedFronts-retain-seed1-delay3",
    "options": {
      "policy": "mixedFronts",
      "seed": 1,
      "delay": 3,
      "withdraw": false
    },
    "expected": {
      "phase": "won",
      "time": 87.66666666666667,
      "core": 5,
      "unitsLost": 1,
      "gross": 460,
      "refund": 0,
      "balance": 20,
      "guardDamage": 90
    },
    "digests": {
      "outcome": "a6ade0f11d79aa3db8b1f9031e263d7fd5b232d5c0fd712374a5c8d9e23ffd67",
      "initial": "d63b61281ff692eaaeff48f92cba0ed87bbb82fafed71b7fc26fe5276d5d7f21",
      "actions": "3ad2cc9dff5396c7ed9031660e32d22ab0e0533e2ea754db668a204f7d38c29c",
      "events": "7d720c8cd4c27985b295c1d970aa36b43375a7673aea37f2e970b9d6a5b0cfb2",
      "frames": "fe9c0d49f97398e3d3c00bfc903175c42ee3daf9dd1dce54f23945170f5d2a48",
      "final": "8af0d17b4080a33ddf9a81c53a2bdb9f30f2314bd05b848f87abdcb0e5499353",
      "paidActions": "1596063ba8cfb408228f410a92b2c65fb414027192e535d56ea60303dc9cf82b"
    }
  },
  {
    "name": "mixedFronts-retain-seed1-delay6",
    "options": {
      "policy": "mixedFronts",
      "seed": 1,
      "delay": 6,
      "withdraw": false
    },
    "expected": {
      "phase": "won",
      "time": 87.66666666666667,
      "core": 5,
      "unitsLost": 0,
      "gross": 460,
      "refund": 0,
      "balance": 20,
      "guardDamage": 79
    },
    "digests": {
      "outcome": "31ee86a6dcaf1a2998dc4279e3db7af30025632f971e0b45891980140fe39853",
      "initial": "d63b61281ff692eaaeff48f92cba0ed87bbb82fafed71b7fc26fe5276d5d7f21",
      "actions": "6eec035bc5fb5ded20de0632ab147d01a5add611ccd4749f2ac86b4b6addb6df",
      "events": "817d572db05fb0df01a0aeda5e035d4a0acf99debfbd432fcaa22ba38bb40547",
      "frames": "536bc7d376351cfbadef686e0518f736e98795df776a51550948d1e5bf5dcdd7",
      "final": "38f6903053e0f2716acb451f8e7f2026952fdc24cf2faab17b9df5f11edc03a2",
      "paidActions": "03564364d389117e7645785670687d00aad88e61676ed622fd778de57da21ca3"
    }
  },
  {
    "name": "mixedFronts-retain-seed7-delay0",
    "options": {
      "policy": "mixedFronts",
      "seed": 7,
      "delay": 0,
      "withdraw": false
    },
    "expected": {
      "phase": "won",
      "time": 88.26666666666667,
      "core": 5,
      "unitsLost": 1,
      "gross": 460,
      "refund": 0,
      "balance": 20,
      "guardDamage": 90
    },
    "digests": {
      "outcome": "2517611ce7ec25baa282168e8429a84a1737c0fdbc6c590954519ece644de45a",
      "initial": "22cfd06f4b72b133e2fb1360f15cc3c2c9d612043cb4b5a7b7cf163a692b4318",
      "actions": "f2d3aec113ddcdc4373e9f6d247bdfe0422cc31c9bcef096675718eb81c94d1e",
      "events": "89c4b40c8af50d922d4124f7eb93148366f2cc31398cfa8f9c086af2c55fe019",
      "frames": "0c7f02cbad07dfe29b336fab6b8e8966da5c63440616126b6d76e86f47806cca",
      "final": "7cfa36e48ce2790c29d6be3d77018f7d7f8f12cfd847c797030fc3f64cd64969",
      "paidActions": "d21143a388bcb67a102b77337047a58bffcc02a06494e0d009a13ee7250db2a2"
    }
  },
  {
    "name": "mixedFronts-retain-seed7-delay3",
    "options": {
      "policy": "mixedFronts",
      "seed": 7,
      "delay": 3,
      "withdraw": false
    },
    "expected": {
      "phase": "won",
      "time": 88.26666666666667,
      "core": 5,
      "unitsLost": 1,
      "gross": 460,
      "refund": 0,
      "balance": 20,
      "guardDamage": 90
    },
    "digests": {
      "outcome": "66579f1ef8a64a37841bbc22cc299b02499c1538d8cf99303c913bfb694a87d6",
      "initial": "22cfd06f4b72b133e2fb1360f15cc3c2c9d612043cb4b5a7b7cf163a692b4318",
      "actions": "3ad2cc9dff5396c7ed9031660e32d22ab0e0533e2ea754db668a204f7d38c29c",
      "events": "ce04574d9a2bd5938af7d977a2909b8d25073cdd3429d482759119fde4ea59df",
      "frames": "56f6e348876c634c6d3bac260641866c922bd29810e7aaffc536ed6221a91089",
      "final": "1e38c3d0856dd0d09b160041d7580c9c12708c92911e871843f7ef7873228ce2",
      "paidActions": "1596063ba8cfb408228f410a92b2c65fb414027192e535d56ea60303dc9cf82b"
    }
  },
  {
    "name": "mixedFronts-retain-seed7-delay6",
    "options": {
      "policy": "mixedFronts",
      "seed": 7,
      "delay": 6,
      "withdraw": false
    },
    "expected": {
      "phase": "won",
      "time": 89.33333333333333,
      "core": 5,
      "unitsLost": 1,
      "gross": 460,
      "refund": 0,
      "balance": 20,
      "guardDamage": 97
    },
    "digests": {
      "outcome": "eccc5f1954862e485a8ed05858f4083fc07e84b0552a7175d471bb0f61d0abd1",
      "initial": "22cfd06f4b72b133e2fb1360f15cc3c2c9d612043cb4b5a7b7cf163a692b4318",
      "actions": "6eec035bc5fb5ded20de0632ab147d01a5add611ccd4749f2ac86b4b6addb6df",
      "events": "aa7780c936b01d749e10b0f56140fe7dba679d044a4f651a9ba5e5a2e0bf09f8",
      "frames": "cf27ab44d8bd8a1094f7200e550c18dfc39c5328208a47418aa8a26e472ad901",
      "final": "31c7a512fc257361b4ab8ca65d383be8902cbfde2e925bde0b4ee23dbe49a129",
      "paidActions": "03564364d389117e7645785670687d00aad88e61676ed622fd778de57da21ca3"
    }
  },
  {
    "name": "mixedFronts-retain-seed30-delay0",
    "options": {
      "policy": "mixedFronts",
      "seed": 30,
      "delay": 0,
      "withdraw": false
    },
    "expected": {
      "phase": "won",
      "time": 87.76666666666667,
      "core": 5,
      "unitsLost": 0,
      "gross": 460,
      "refund": 0,
      "balance": 20,
      "guardDamage": 72
    },
    "digests": {
      "outcome": "ad8630c54c6b6f4dc8c1a889d5d1cc5691e3d6ef0de4de9668e6997fe308e441",
      "initial": "734c26512a492a0515eb9c0eb92cc31aa256a97160cd84eef3c482667de36409",
      "actions": "f2d3aec113ddcdc4373e9f6d247bdfe0422cc31c9bcef096675718eb81c94d1e",
      "events": "068be580aec59236f6002bff6c824344e0b4d4e4794c30dd5e349f61cc9fe677",
      "frames": "22096fcc19b277c7129406b7626e2db0b0960113a478693ebbe7313bb0c0ba40",
      "final": "6e6985c65111e80b06dbae369b38bd39b9cad572dfa6007a8125550f138b5f49",
      "paidActions": "d21143a388bcb67a102b77337047a58bffcc02a06494e0d009a13ee7250db2a2"
    }
  },
  {
    "name": "mixedFronts-retain-seed30-delay3",
    "options": {
      "policy": "mixedFronts",
      "seed": 30,
      "delay": 3,
      "withdraw": false
    },
    "expected": {
      "phase": "won",
      "time": 87.76666666666667,
      "core": 5,
      "unitsLost": 1,
      "gross": 460,
      "refund": 0,
      "balance": 20,
      "guardDamage": 90
    },
    "digests": {
      "outcome": "c366fbfaee49e385987229e5aa8d6dbdcac52a64ac1313967eb8c5261c58bbe9",
      "initial": "734c26512a492a0515eb9c0eb92cc31aa256a97160cd84eef3c482667de36409",
      "actions": "3ad2cc9dff5396c7ed9031660e32d22ab0e0533e2ea754db668a204f7d38c29c",
      "events": "46affe9e145c9437b2b1fa741bc1d49368be77064c93e214dea5b7ec272f7e67",
      "frames": "f9855d522eb9c314f95e7dcb0c8f0f3b69e117d28cf36c13ecc5eede1aa584fe",
      "final": "0258b58edd92c1f93bc7a62c052823bbcd001cd46c6d5a6d0c0e78536ba4bf6a",
      "paidActions": "1596063ba8cfb408228f410a92b2c65fb414027192e535d56ea60303dc9cf82b"
    }
  },
  {
    "name": "mixedFronts-retain-seed30-delay6",
    "options": {
      "policy": "mixedFronts",
      "seed": 30,
      "delay": 6,
      "withdraw": false
    },
    "expected": {
      "phase": "won",
      "time": 88.85,
      "core": 5,
      "unitsLost": 0,
      "gross": 460,
      "refund": 0,
      "balance": 20,
      "guardDamage": 79
    },
    "digests": {
      "outcome": "13ea33dcb95126d5d018e51bafe2654ff510de7d1d119ebecb1576c8dd3dddbc",
      "initial": "734c26512a492a0515eb9c0eb92cc31aa256a97160cd84eef3c482667de36409",
      "actions": "6eec035bc5fb5ded20de0632ab147d01a5add611ccd4749f2ac86b4b6addb6df",
      "events": "510efc6741c89850fcd167cd349bba0719c52b9eca7f17813560766e79af7bd1",
      "frames": "99baa5146b51b4bb407a72862eb1f26aed83e33dc49d10af9df90c1c36c14b95",
      "final": "a19b86b1738063794b175138eaecfef9144999029717a996f37d1b62179c500a",
      "paidActions": "03564364d389117e7645785670687d00aad88e61676ed622fd778de57da21ca3"
    }
  },
  {
    "name": "mixedFronts-retain-seed127-delay0",
    "options": {
      "policy": "mixedFronts",
      "seed": 127,
      "delay": 0,
      "withdraw": false
    },
    "expected": {
      "phase": "won",
      "time": 86.7,
      "core": 5,
      "unitsLost": 0,
      "gross": 460,
      "refund": 0,
      "balance": 20,
      "guardDamage": 72
    },
    "digests": {
      "outcome": "e51cc4a530a5849d23a8ec9d8c2a5944a361aa8a5249bd90636d26ea9950c68b",
      "initial": "42262ac15a723d1343ea3340311f1d0f64918659629b271e9034081666010420",
      "actions": "f2d3aec113ddcdc4373e9f6d247bdfe0422cc31c9bcef096675718eb81c94d1e",
      "events": "ca40671cca028fa76c9f683b0a6485f43497aeb733b77c810b1a4304ecaaf336",
      "frames": "9ea8264f354e60afb52ecd26527cf056a2ce6e10dd543a66ba2e3833f170887c",
      "final": "3cabfb50acc891bc7d86f6702200c581c686bb4b3876ae301cc9877e1323561d",
      "paidActions": "d21143a388bcb67a102b77337047a58bffcc02a06494e0d009a13ee7250db2a2"
    }
  },
  {
    "name": "mixedFronts-retain-seed127-delay3",
    "options": {
      "policy": "mixedFronts",
      "seed": 127,
      "delay": 3,
      "withdraw": false
    },
    "expected": {
      "phase": "won",
      "time": 86.7,
      "core": 5,
      "unitsLost": 0,
      "gross": 460,
      "refund": 0,
      "balance": 20,
      "guardDamage": 72
    },
    "digests": {
      "outcome": "536e0872762e21d522e0905dfa90d5b97fe95553f390236efbd20c7f58c6555d",
      "initial": "42262ac15a723d1343ea3340311f1d0f64918659629b271e9034081666010420",
      "actions": "3ad2cc9dff5396c7ed9031660e32d22ab0e0533e2ea754db668a204f7d38c29c",
      "events": "c00611c142d5c68856995e5913752670344314ad92725b0ca6e640fb0656e5b7",
      "frames": "3a5ede4dfdfb027b98f96e0f30269704d209b7b8ebfbb67ea4b1ed5ab606e945",
      "final": "d834fb0a2750c3fa56e66a30c34929260ed9264bedb3ba66ed41457822d5b004",
      "paidActions": "1596063ba8cfb408228f410a92b2c65fb414027192e535d56ea60303dc9cf82b"
    }
  },
  {
    "name": "mixedFronts-retain-seed127-delay6",
    "options": {
      "policy": "mixedFronts",
      "seed": 127,
      "delay": 6,
      "withdraw": false
    },
    "expected": {
      "phase": "won",
      "time": 86.7,
      "core": 5,
      "unitsLost": 0,
      "gross": 460,
      "refund": 0,
      "balance": 20,
      "guardDamage": 79
    },
    "digests": {
      "outcome": "23f2125a32732d45942a5f6228208601ac2acac1aaf890eabc53f7d30deaed3f",
      "initial": "42262ac15a723d1343ea3340311f1d0f64918659629b271e9034081666010420",
      "actions": "6eec035bc5fb5ded20de0632ab147d01a5add611ccd4749f2ac86b4b6addb6df",
      "events": "b58fffe6725e1c33f135ebf8bc82e54800b6bf0baa95452bbdf5125fe49fda6d",
      "frames": "781d2c9151c821036bd9ef01879f1f9024a930c015388c32b7ca4756573edad6",
      "final": "912fa2989458dcccf7784de7fb2c8a329104702770f2e6b669575b62d4ee37f2",
      "paidActions": "03564364d389117e7645785670687d00aad88e61676ed622fd778de57da21ca3"
    }
  }
];

let deployments = 0, withdrawals = 0, lossRuns = 0, guardLosses = 0, leaks = 0;
for (const fixture of fixtures) {
 const result = simulate(fixture.options);
 for (const [key, expected] of Object.entries(fixture.expected)) {
  assert.equal(result.outcome[key], expected, fixture.name + ': outcome.' + key);
 }
 for (const key of ['outcome', 'initial', 'actions', 'events', 'frames', 'final']) {
  assert.equal(digest(result[key]), fixture.digests[key], fixture.name + ': complete ' + key);
 }
 const paidActions = result.actions.filter(a => ['deploy', 'emergencyWithdraw'].includes(a.kind));
 assert.equal(digest(paidActions), fixture.digests.paidActions, fixture.name + ': paid actions');
 for (const action of paidActions) {
  assert.equal(action.result.ok, true);
  assert(action.before >= 0 && action.after >= 0);
  if (action.kind === 'deploy') {
   deployments++;
   assert.equal(action.before - action.after, E.definitions.units[action.type].cost);
  } else {
   withdrawals++;
   assert.equal(action.after - action.before, 25);
  }
 }
 const o = result.outcome;
 assert.equal(o.phase, 'won');
 assert.deepEqual(o.unfulfilled, []);
 assert.equal(o.earned, 300);
 assert.equal(180 + o.earned + o.refund - o.gross, o.balance);
 assert.equal(result.final.stats.emergencyCount, fixture.options.withdraw && fixture.options.policy !== 'boltAllocation' ? 1 : 0);
 assert(!result.actions.some(a => a.kind === 'collect'));
 assert.deepEqual(result.events.filter(e => e.type === 'spawn').map(e => ({row:e.row,type:e.enemyType,time:e.time})), E.preview(6));
 lossRuns += o.unitsLost > 0;
 guardLosses += o.unitsLost;
 leaks += o.leaks;
}
assert.equal(fixtures.length, 48);
assert.equal(deployments, 420);
assert.equal(withdrawals, 24);
assert.equal(lossRuns, 11); // Six familiar runs and five explicitly retained-guard runs.
assert.equal(guardLosses, 15);
assert.equal(leaks, 1); // Familiar seed 7/+3: three guards defeated and one armor leak.
assert.equal(JSON.stringify(E.levels), contentBefore);
console.log('PASS 48 frozen Overlapping fronts policies: full trace/state digests, 420 paid deployments, 24 refunds; 15 guard defeats and one armor leak preserved');
