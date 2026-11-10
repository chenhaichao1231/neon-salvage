(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.Signal=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const RULES=Object.freeze({feedRange:90,fieldRange:250,lureRange:380,arrivalRange:65,shooterArrivalRange:280,retargetDelay:8,tuneCooldown:5,maxCharge:60,secondsPerValue:1.5,cargoSpeed:110});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),free=(c,i)=>i&&i.hp>0&&!i.owner&&!i.thrown&&!i.storyId&&i.id!==c.heldId;
const value=i=>i&&Number.isFinite(i.mass)&&Number.isFinite(i.hp)&&Number.isFinite(i.maxHp)&&i.hp>0&&i.maxHp>0?Math.max(0,Math.min(3,i.mass))*12*Math.min(1,i.hp/i.maxHp):0;
function create(){return {version:1,engineeringUnlocked:false,placement:'center'};}
function valid(s){return !!s&&typeof s==='object'&&!Array.isArray(s)&&Object.keys(s).length===3&&s.version===1&&typeof s.engineeringUnlocked==='boolean'&&['center','west','east'].includes(s.placement)&&(s.engineeringUnlocked||s.placement==='center');}
function validate(s){if(!valid(s))throw Error('Invalid Signal save');return {...s};}
function migrate(s){if(s==null||s?.version===0)return create();return validate(s);}
function configure(s,placement){if(!s.engineeringUnlocked||!['center','west','east'].includes(placement))return false;s.placement=placement;return true;}
function start(s){validate(s);const anchor={center:{x:0,y:-280},west:{x:-470,y:220},east:{x:500,y:-200}}[s.placement];return {time:0,interacted:false,finished:false,lureLocks:new WeakMap(),relays:[{id:'anchor',...anchor},{id:'north-east',x:360,y:260},{id:'south-west',x:-300,y:-360}].map(r=>({...r,radius:24,mode:'gather',charge:0,tuneReady:0})),observed:false};}
function feed(run,cargo,player,id){
 if(run.finished)return null;const r=run.relays.find(r=>r.id===id),index=cargo.items.findIndex(i=>i.id===cargo.heldId),i=cargo.items[index];
 if(!r||!i||i.owner||i.thrown||i.storyId||!value(i)||distance(player,r)>RULES.feedRange||distance(i,r)>RULES.feedRange||r.charge>=RULES.maxCharge)return null;
 const charge=Math.min(RULES.maxCharge-r.charge,value(i)*RULES.secondsPerValue);cargo.items.splice(index,1);cargo.heldId=null;r.charge+=charge;run.interacted=true;
 return {type:'signal-fed',relayId:id,itemId:i.id,charge,wastedCharge:Math.max(0,value(i)*RULES.secondsPerValue-charge)};
}
function tune(run,player,id,mode){const r=run.relays.find(r=>r.id===id);if(run.finished||!r||!['gather','jam'].includes(mode)||r.mode===mode||r.charge<=0||run.time<r.tuneReady||distance(player,r)>RULES.feedRange)return null;r.mode=mode;r.tuneReady=run.time+RULES.tuneCooldown;run.interacted=true;return {type:'signal-tuned',relayId:id,mode};}
function update(run,cargo,dt){
 if(run.finished||!Number.isFinite(dt)||dt<=0)return [];dt=Math.min(.25,dt);run.time+=dt;const events=[];
 for(const r of run.relays){const old=r.charge;r.charge=Math.max(0,r.charge-dt);if(old>0&&r.charge===0)events.push({type:'signal-offline',relayId:r.id});}
 for(const item of cargo.items){if(!free(cargo,item))continue;let target=null,best=RULES.fieldRange;
  for(const r of run.relays){if(r.charge<=0||r.mode!=='gather')continue;const d=distance(item,r);if(d<best){best=d;target=r;}}
  if(!target||best<target.radius+item.radius+8)continue;
  const dx=(target.x-item.x)/best,dy=(target.y-item.y)/best;
  item.vx=(Number.isFinite(item.vx)?item.vx:0)+dx*220*dt;item.vy=(Number.isFinite(item.vy)?item.vy:0)+dy*220*dt;
  const speed=Math.hypot(item.vx,item.vy);if(speed>RULES.cargoSpeed){item.vx*=RULES.cargoSpeed/speed;item.vy*=RULES.cargoSpeed/speed;}
  if(!run.observed){run.observed=true;events.push({type:'signal-observed',textKey:'observation'});}
 }
 return events;
}
function enemyTarget(run,enemy,player){
 if(run.finished||!enemy||!(enemy.hp>0)||enemy.type==='boss'||enemy.type==='rival'||distance(enemy,player)<90)return player;
 const arrivalRange=enemy.type==='shooter'?RULES.shooterArrivalRange:RULES.arrivalRange;
 let lock=run.lureLocks.get(enemy);
 if(lock&&lock.until>run.time)return player;
 let target=lock?.relayId?run.relays.find(r=>r.id===lock.relayId&&r.mode==='gather'&&r.charge>0):null;
 if(target&&distance(enemy,target)<=arrivalRange){run.lureLocks.set(enemy,{until:run.time+RULES.retargetDelay});return player;}
 if(!target){let best=RULES.lureRange;for(const r of run.relays){if(r.charge<=0||r.mode!=='gather')continue;const d=distance(enemy,r);if(d<best){best=d;target=r;}}}
 if(!target)return player;
 if(distance(enemy,target)<=arrivalRange){run.lureLocks.set(enemy,{until:run.time+RULES.retargetDelay});return player;}
 run.lureLocks.set(enemy,{relayId:target.id,until:0});return target;
}
function rivalEligible(run,cargo,item){if(!item||!(item.hp>0)||item.owner||item.thrown||item.id===cargo.heldId)return false;if(run.finished||item.storyId)return true;return !run.relays.some(r=>r.charge>0&&r.mode==='jam'&&distance(item,r)<=RULES.fieldRange);}
// Hypothetical powered-mode snapshot. Reads live objects; never changes ownership or lure locks.
function preview(run,cargo,player,enemies=[],rival=null,id){
 const relay=run.relays.find(r=>r.id===id);if(!relay)return null;
 const result={freeCount:0,remainingValue:0,gatherCount:0,lureCount:0,rivalTarget:'none'};
 for(const item of cargo.items){
  if(!free(cargo,item)||distance(item,relay)>RULES.fieldRange)continue;
  result.freeCount++;result.remainingValue+=value(item);
  const d=distance(item,relay);
  if(d>=RULES.fieldRange||d<relay.radius+item.radius+8)continue;
  const closest=run.relays.filter(r=>r===relay||r.charge>0&&r.mode==='gather').reduce((best,r)=>distance(item,r)<distance(item,best)?r:best);
  if(closest===relay)result.gatherCount++;
 }
 for(const enemy of enemies){
  if(!enemy||!(enemy.hp>0)||enemy.type==='boss'||enemy.type==='rival'||distance(enemy,player)<90)continue;
  const lock=run.lureLocks.get(enemy);if(lock&&lock.until>run.time)continue;
  const locked=lock?.relayId?run.relays.find(r=>r.id===lock.relayId&&(r===relay||r.charge>0&&r.mode==='gather')):null;
  const candidate=locked||run.relays.filter(r=>r===relay||r.charge>0&&r.mode==='gather').reduce((best,r)=>!best||distance(enemy,r)<distance(enemy,best)?r:best,null);
  const d=distance(enemy,relay),arrival=enemy.type==='shooter'?RULES.shooterArrivalRange:RULES.arrivalRange;
  if(candidate===relay&&d<RULES.lureRange&&d>arrival)result.lureCount++;
 }
 if(rival&&!['dead','escaped'].includes(rival.status)){
  const held=cargo.items.find(i=>i.id===rival.heldId&&i.owner);
  const target=cargo.items.find(i=>i.id===rival.targetId);
  if(held)result.rivalTarget='held';
  else if(target){result.rivalTarget=target.storyId?'story':!free(cargo,target)?'unavailable':distance(target,relay)<=RULES.fieldRange?'inside':'outside';}
 }
 return result;
}
function finish(state,run,escaped){if(run.finished)return null;run.finished=true;if(!escaped||!run.interacted||state.engineeringUnlocked)return null;state.engineeringUnlocked=true;return {type:'signal-engineering',textKey:'engineering',credits:0};}
const texts={zh:{title:'误导广播：同一片残骸',intro:'洛：广播没有创造货物。它在改变谁先赶到。三个中继台互不依赖，你可以改频，也可以照常拾荒。',gather:'聚拢：把附近自由残骸吸向中继，同时引来普通掠夺者。到台的敌人很快会重新追你。',jam:'屏蔽：附近自由残骸暂时不会被竞争者选中；不会赶走已经在场的敌人，也不能夺走竞争者手中的货物。',cost:'投入一件手持普通残骸供能，整件消耗。最多储能60秒，超额浪费。供能后切换频道免费，每次切换锁定5秒。',observation:'洛：看到了吗？同一块残骸变了位置，来抢它的也变了。有人用广播安排相遇，但我们还不知道是谁。',engineering:'回收站记录了你的改频方案。以后可把一台中继固定在中央、西侧或东侧，不提升伤害；本局的消耗与货物不会复制到下局。'},en:{title:'Misleading Broadcast: The Same Wreckage',intro:'Luo: The broadcast creates no cargo. It changes who arrives first. The three relays work independently. Retune them, or salvage as usual.',gather:'Gather: pulls nearby free wreckage toward the relay and lures ordinary raiders. Enemies that reach it soon return to hunting you.',jam:'Jam: nearby free wreckage cannot be selected by the rival for now. This does not clear existing enemies or steal cargo already held by the rival.',cost:'Spend one ordinary held wreck for power. The entire object is consumed. Capacity is 60 seconds; excess charge is wasted. Switching powered channels is free, with a five-second retuning lock.',observation:'Luo: See that? The same wreck moved, and so did its competitors. Someone is using the broadcast to arrange encounters. We still do not know who.',engineering:'The station recorded your retuning work. On later runs, place one relay centrally, west or east. This grants no damage increase and copies neither spent resources nor cargo into another run.'}};
for(const t of Object.values(texts))Object.freeze(t);Object.freeze(texts);
return Object.freeze({RULES,create,valid,validate,migrate,configure,start,feed,tune,update,enemyTarget,rivalEligible,preview,finish,texts});
});
