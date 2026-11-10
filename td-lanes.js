/* TDLanes: pure CommonJS/browser engine. Units are grid cells and seconds.
 * create(level=0,{seed=1,unlocked=['deepseek','gpt']}) -> state.
 * deploy(s,row,col,type), refund(s,id), start(s), pause(s,bool), collect(s,id),
 * retry(s) mutate and return {ok,reason?}. step(s,seconds) returns events.
 * 5 rows x 7 columns; row/col zero-based. GPU: 30 every 6 battle seconds,
 * collectible immediately, automatically credited after 4 seconds, never expires.
 * Fixed allowance: 10 GPUs (300) per level; victory credits all remainder.
 * statusSchedule[row:col:type]={first,period} is generated from the initial seed.
 * Each deployed unit exposes status(normal/rice/weak), statusRemaining, warning
 * null or {status,startsIn,duration}. A late deployment skips insufficient notice.
 * Status-warning events give 2 seconds notice; rice pauses fire for 2s, weak
 * scales shots fired within its 3s window to .7, without changing targeting.
 * Pause freezes ALL simulation. Battle deployment allowed; refunds prepare only.
 * retry battle/lost restores exact pre-start snapshot, including seed/resources.
 * preview(level) gives EVERY spawn with absolute time and row, not random hints.
 * Shots travel; Every GPT shot can hit up to 2 distinct targets.
 * Claude refreshes one nonstacking mark; 3 later hits from OTHER unit ids trigger
 * 18 armor-ignoring bonus once. Same projectile cannot repeatedly hit its target.
 * Gemini impact slows enemies within .8 cells in same row, refresh not stack.
 * Visual events shot/hit/kill/unit-hit/unit-lost/leak snapshot row,x,time.
 * x is in grid cells: shot launch point, otherwise affected entity center
 * (leak may be negative). unitType identifies the firing/hurt unit; enemyType
 * identifies the hit/killed/leaking enemy or the unit-hit attacker.
 * These numbers are first-playtest hypotheses, not claims about brand quality.
 */
(function(root){'use strict';
const names=(zh,en)=>({zh,en});
const units={
 deepseek:{name:names('DeepSeek · 直射','DeepSeek · Bolt'),cost:50,hp:90,damage:10,interval:1.1,speed:6,description:names('低费用直射；偶尔预告后吃饭2秒，暂停射击（虚构游戏规则）。','Low-cost fire; a seeded, warned 2s rice break occasionally pauses shooting (fictional game rule).')},
 gpt:{name:names('GPT · 穿透','GPT · Pierce'),cost:90,hp:120,damage:14,interval:1.4,speed:7,description:names('每发最多穿透2个不同目标；偶尔预告后弱输出3秒，伤害为70%（虚构游戏规则）。','Every shot pierces up to 2 distinct targets; warned 3s weak windows deal 70% damage (fictional game rule).')},
 claude:{name:names('Claude · 标记','Claude · Mark'),cost:85,hp:90,damage:7,interval:2.1,speed:5,description:names('标记持续4秒；其他角色再命中3次，触发一次18额外伤害。','Marks for 4s; three subsequent hits by other units trigger 18 bonus damage once.')},
 gemini:{name:names('Gemini · 星弹','Gemini · Star'),cost:80,hp:90,damage:6,interval:1.7,speed:5.5,description:names('命中附近敌人减速25%，持续1.5秒，不叠加。','Impact slows nearby enemies by 25% for 1.5s; does not stack.')}
};
const enemies={
 data:{name:names('数据团','Data blob'),hp:42,speed:.18,damage:12,interval:1},
 swarm:{name:names('碎片群','Fragment'),hp:22,speed:.22,damage:7,interval:.8},
 armor:{name:names('装甲数据','Armored data'),hp:110,speed:.13,damage:18,interval:1.3,armor:.35},
 charge:{name:names('冲锋数据','Charging data'),hp:55,speed:.36,damage:16,interval:.75}
};
const levels=[{name:names('接通防线','First connection'),brief:names('敌人从右来，角色只向右攻击。选角色→点左侧空格→开始，保住左侧核心。','Enemies approach from the right; guards fire right. Choose a guard, place it in a left cell, then start. Defend the core.'),spawns:[]},{name:names('拥挤的数据流','Crowded stream'),brief:names('后段第1、3行各来6只碎片，其他行各1只。便宜铺场或重点穿透都能守住；试试更省或更快的布阵。','Later, lanes 1 and 3 each get six fragments; other lanes get one. Cheap coverage or focused piercing can both hold. Try a cheaper or faster layout.'),spawns:[]},{name:names('突破尝试','Breach attempt'),brief:names('冲锋怪速度更快。关注各行预告，及时补位；角色打不到已经走到其左边的敌人。','Chargers move faster. Watch each lane and reinforce in time; guards cannot hit enemies that have already passed to their left.'),spawns:[]}];
for(let r=0;r<5;r++){levels[0].spawns.push({row:r,type:'data',time:4+r*4},{row:r,type:'data',time:29+r*2});levels[1].spawns.push({row:r,type:'armor',time:5+r*3});for(let i=0;i<((r===0||r===2)?6:1);i++)levels[1].spawns.push({row:r,type:'swarm',time:38+r+i*.2});levels[2].spawns.push({row:r,type:'armor',time:3+r*2},{row:r,type:'charge',time:17+r*2},{row:r,type:'charge',time:31+r});}
levels.forEach(l=>l.spawns.sort((a,b)=>a.time-b.time||a.row-b.row));
const copy=x=>JSON.parse(JSON.stringify(x)),fail=reason=>({ok:false,reason}),ok=()=>({ok:true});
function makeSchedule(seed){let out={};for(let r=0;r<5;r++)for(let c=0;c<7;c++)for(const type of ['deepseek','gpt']){seed=(Math.imul(seed,1664525)+1013904223)>>>0;let first=20+seed%11;seed=(Math.imul(seed,1664525)+1013904223)>>>0;out[r+':'+c+':'+type]={first,period:20+seed%11};}return out;}
function create(level=0,options={}){if(!levels[level])throw Error('level');return {version:1,level,phase:'prepare',paused:false,seed:options.seed>>>0||1,time:0,tick:0,accumulator:0,compute:180,core:5,unlocked:[...new Set(options.unlocked||['deepseek','gpt'])].filter(x=>units[x]),units:[],enemies:[],shots:[],gpus:[],nextSpawn:0,nextGpu:6,gpuCount:0,gpuQuota:10,statusSchedule:makeSchedule(options.seed>>>0||1),nextId:1,snapshot:null,stats:{earned:0,kills:0,leaks:0,unitsLost:0}};}
function deploy(s,row,col,type){if(!['prepare','battle'].includes(s.phase))return fail('phase');if(!Number.isInteger(row)||!Number.isInteger(col)||row<0||row>=5||col<0||col>=7)return fail('cell');if(!units[type]||!s.unlocked.includes(type))return fail('locked');if(s.units.some(u=>u.row===row&&u.col===col))return fail('occupied');const d=units[type];if(s.compute<d.cost)return fail('compute');s.compute-=d.cost;s.units.push({id:'u'+s.nextId++,row,col,x:col+.5,type,hp:d.hp,cooldown:0,fired:0,status:'normal',statusRemaining:0,warning:null,eligibleAfter:s.time+2,lastWarning:null});return ok();}
function refund(s,id){if(s.phase!=='prepare')return fail('phase');let i=s.units.findIndex(u=>u.id===id);if(i<0)return fail('unit');s.compute+=units[s.units[i].type].cost;s.units.splice(i,1);return ok();}
function start(s){if(s.phase!=='prepare')return fail('phase');s.snapshot=copy({...s,snapshot:null});s.phase='battle';return ok();}
function pause(s,value){if(s.phase!=='battle')return fail('phase');s.paused=!!value;return ok();}
function retry(s){if(!['battle','lost','won'].includes(s.phase)||!s.snapshot)return fail('phase');const old=copy(s.snapshot);Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,old);return ok();}
function collect(s,id){const g=s.gpus.find(g=>g.id===id);if(!g||g.collected)return fail('gpu');if(s.phase!=='battle'||s.paused)return fail('phase');credit(s,g);return ok();}
function credit(s,g){g.collected=true;s.compute+=g.value;s.stats.earned+=g.value;}
function rng(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
function damage(s,e,shot,events){const d=units[shot.type];const amount=d.damage*(shot.damageScale===undefined?1:shot.damageScale)*(1-(enemies[e.type].armor||0));e.hp-=amount;events.push({type:'hit',source:shot.source,target:e.id,amount,row:e.row,x:e.x,time:s.time,unitType:shot.type,enemyType:e.type});if(e.mark&&e.mark.until>s.time&&e.mark.owner!==shot.source){e.mark.hits++;if(e.mark.hits>=3){e.hp-=18;events.push({type:'mark-trigger',target:e.id,amount:18});e.mark=null;}}
if(shot.type==='claude'&&e.hp>0)e.mark={owner:shot.source,hits:0,until:s.time+4};
if(shot.type==='gemini')s.enemies.filter(n=>n.hp>0&&n.row===e.row&&Math.abs(n.x-e.x)<=.8).forEach(n=>n.slowUntil=s.time+1.5);
}
function updateStatus(s,u,events){const plan=s.statusSchedule[u.row+':'+u.col+':'+u.type];if(!plan)return;const duration=u.type==='deepseek'?2:3;let k=Math.max(0,Math.floor((s.time-plan.first)/plan.period));let begin=plan.first+k*plan.period;if(s.time>=begin+duration)begin+=plan.period;const previous=u.status||'normal';u.status='normal';u.statusRemaining=0;u.warning=null;if(begin>=(u.eligibleAfter||0)){if(s.time>=begin&&s.time<begin+duration){u.status=u.type==='deepseek'?'rice':'weak';u.statusRemaining=begin+duration-s.time;}else if(begin-s.time<=2+1e-9&&begin>s.time){u.warning={status:u.type==='deepseek'?'rice':'weak',startsIn:begin-s.time,duration};if(u.lastWarning!==begin){u.lastWarning=begin;events.push({type:'status-warning',unitId:u.id,status:u.warning.status,startsAt:begin,duration});}}}if(previous!==u.status)events.push({type:'status-change',unitId:u.id,status:u.status,duration:u.statusRemaining});}
function tick(s,events){const dt=1/60;s.tick++;s.time=s.tick/60;const schedule=levels[s.level].spawns;
while(s.nextSpawn<schedule.length&&schedule[s.nextSpawn].time<=s.time){const p=schedule[s.nextSpawn++],d=enemies[p.type];const e={id:'e'+s.nextId++,row:p.row,type:p.type,x:7.8,hp:d.hp,cooldown:0,slowUntil:0,mark:null};s.enemies.push(e);events.push({type:'spawn',id:e.id,row:e.row,enemyType:e.type});}
while(s.gpuCount<s.gpuQuota&&s.nextGpu<=s.time){s.gpuCount++;const g={id:'g'+s.nextId++,x:.4+rng(s)*6.2,born:s.nextGpu,value:30,collected:false};s.gpus.push(g);s.nextGpu+=6;events.push({type:'gpu',id:g.id});}
s.gpus.forEach(g=>{if(!g.collected&&s.time>=g.born+4){credit(s,g);events.push({type:'gpu-credit',id:g.id,value:g.value});}});
for(const u of s.units){updateStatus(s,u,events);u.cooldown=Math.max(0,u.cooldown-dt);if(u.status!=='rice'&&u.cooldown<=0&&s.enemies.some(e=>e.hp>0&&e.row===u.row&&e.x>=u.x-.1)){u.fired++;s.shots.push({id:'s'+s.nextId++,source:u.id,type:u.type,damageScale:u.status==='weak'?.7:1,row:u.row,x:u.x+.15,left:u.type==='gpt'?2:1,hits:[]});u.cooldown=units[u.type].interval;events.push({type:'shot',source:u.id,piercing:u.type==='gpt',row:u.row,x:u.x+.15,time:s.time,unitType:u.type});}}
for(const sh of s.shots){const end=sh.x+units[sh.type].speed*dt;const targets=s.enemies.filter(e=>e.hp>0&&e.row===sh.row&&!sh.hits.includes(e.id)&&e.x>=sh.x-.22&&e.x<=end+.22).sort((a,b)=>a.x-b.x);for(const e of targets){damage(s,e,sh,events);sh.hits.push(e.id);if(--sh.left<=0)break;}sh.x=end;}
s.shots=s.shots.filter(sh=>sh.left>0&&sh.x<8.5);
for(const e of s.enemies){if(e.hp<=0)continue;if(e.mark&&e.mark.until<=s.time)e.mark=null;e.cooldown=Math.max(0,e.cooldown-dt);const block=s.units.filter(u=>u.hp>0&&u.row===e.row&&u.x<=e.x+.1&&e.x-u.x<=.44).sort((a,b)=>b.x-a.x)[0];if(block){if(e.cooldown<=0){block.hp-=enemies[e.type].damage;e.cooldown=enemies[e.type].interval;events.push({type:'unit-hit',source:e.id,target:block.id,amount:enemies[e.type].damage,row:block.row,x:block.x,time:s.time,unitType:block.type,enemyType:e.type});}}else e.x-=enemies[e.type].speed*(e.slowUntil>s.time?.75:1)*dt;}
s.units=s.units.filter(u=>{if(u.hp<=0){s.stats.unitsLost++;events.push({type:'unit-lost',id:u.id,row:u.row,x:u.x,time:s.time,unitType:u.type});}return u.hp>0;});
s.enemies=s.enemies.filter(e=>{if(e.hp<=0){s.stats.kills++;events.push({type:'kill',id:e.id,row:e.row,x:e.x,time:s.time,enemyType:e.type});return false;}if(e.x<0){s.core--;s.stats.leaks++;events.push({type:'leak',id:e.id,row:e.row,x:e.x,time:s.time,enemyType:e.type});return false;}return true;});
if(s.core<=0){s.phase='lost';events.push({type:'lost'});}else if(s.nextSpawn===schedule.length&&!s.enemies.length){s.phase='won';/* Pending GPU cannot be lost to an early victory. */s.gpus.forEach(g=>{if(!g.collected)credit(s,g);});const remainder=(s.gpuQuota-s.gpuCount)*30;s.compute+=remainder;s.stats.earned+=remainder;s.gpuCount=s.gpuQuota;events.push({type:'gpu-settle',value:remainder});events.push({type:'won'});}}
function step(s,dt){const events=[];if(s.phase!=='battle'||s.paused||!Number.isFinite(dt)||dt<=0)return events;s.accumulator+=Math.min(dt,1);while(s.accumulator+1e-9>=1/60&&s.phase==='battle'){s.accumulator-=1/60;tick(s,events);}return events;}
const api={create,deploy,refund,start,pause,retry,collect,step,preview:level=>copy(levels[level]?.spawns||[]),definitions:{units,enemies},levels,grid:{rows:5,cols:7},economy:{initial:180,gpuValue:30,gpuInterval:6,autoCollectDelay:4,quota:10,total:300},statusLabels:{normal:names('正常','Ready'),rice:names('吃饭中','Rice break'),weak:names('思路卡住','Brain fog'),riceWarning:names('准备开饭','Rice break soon'),weakWarning:names('即将卡住','Brain fog soon')}};
if(typeof module!=='undefined'&&module.exports)module.exports=api;root.TDLanes=api;
})(typeof globalThis!=='undefined'?globalThis:this);
