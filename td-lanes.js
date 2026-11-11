/* TDLanes: pure CommonJS/browser engine. Units are grid cells and seconds.
 * create(level=0,{seed=1,unlocked=['deepseek','gpt','claude','grok']}) -> state.
 * deploy(s,row,col,type), refund(s,id), emergencyWithdraw(s,id), start(s), pause(s,bool), collect(s,id),
 * retry(s) mutate and return {ok,reason?}. step(s,seconds) returns events.
 * 5 rows x 7 columns; row/col zero-based. GPU: 30 every 6 battle seconds,
 * collectible immediately, automatically credited after 4 seconds, never expires.
 * Fixed allowance: 10 GPUs (300) per level; victory credits all remainder.
 * statusSchedule[row:col:type]={first,period} is generated from the initial seed.
 * Each deployed unit exposes status(normal/rice/weak/review), statusRemaining, warning
 * null or {status,startsIn,duration}. A late deployment skips insufficient notice.
 * Status-warning events give 2 seconds notice; rice pauses fire for 2s, weak
 * scales shots fired within its 3s window to .7, without changing targeting.
 * Pause freezes simulation time; ordinary battle actions commit immediately. Battle deployment allowed; full refunds prepare only; one half-cost emergency withdrawal per battle.
 * retry battle/lost restores exact pre-start snapshot, including seed/resources.
 * preview(level) gives EVERY spawn with absolute time and row, not random hints.
 * Shots travel; Every GPT shot can hit up to 2 distinct targets.
 * Claude fires a single 30-damage armor-ignoring shot; warned automatic review
 * pauses new fire for 3s. No player questions or personal data are involved.
 * Grok impacts up to 3 same-lane targets within .8 cells. Every fourth committed
 * shot deals 4 damage instead of 16; misses also advance that visible cycle.
 * Gemini impact slows enemies within .8 cells in same row, refresh not stack.
 * Visual events shot/hit/kill/unit-hit/unit-lost/leak snapshot row,x,time.
 * x is in grid cells: shot launch point, otherwise affected entity center
 * (leak may be negative). unitType identifies the firing/hurt unit; enemyType
 * identifies the hit/killed/leaking enemy or the unit-hit attacker.
 * Optional detour: preview toRow; enemy originalRow/toRow, turnState
 * approach/waiting/done, turnAt and turnRemaining. Waiting is vulnerable.
 * detour-warning/turn events snapshot row,x,time,fromRow,toRow and countdown.
 * These numbers are first-playtest hypotheses, not claims about brand quality.
 */
(function(root){'use strict';
const names=(zh,en)=>({zh,en});
const units={
 deepseek:{name:names('DeepSeek · 直射','DeepSeek · Bolt'),cost:50,hp:90,damage:10,interval:1.1,speed:6,description:names('低费用直射；偶尔预告后吃饭2秒，暂停射击（虚构游戏规则）。','Low-cost fire; a seeded, warned 2s rice break occasionally pauses shooting (fictional game rule).')},
 gpt:{name:names('GPT · 穿透','GPT · Pierce'),cost:90,hp:120,damage:14,interval:1.4,speed:7,description:names('每发最多穿透2个不同目标；偶尔预告后弱输出3秒，伤害为70%（虚构游戏规则）。','Every shot pierces up to 2 distinct targets; warned 3s weak windows deal 70% damage (fictional game rule).')},
 claude:{name:names('Claude · 重击','Claude · Heavy'),cost:120,hp:90,damage:30,interval:2,speed:6,description:names('单发30伤害，无视装甲；复核前预告2秒，自动离线3秒后恢复。实力强，偶尔被叫去复核（虚构规则，无玩家问答）。','One 30-damage armor-ignoring hit. A 2s warning precedes a 3s automatic offline review. Powerful, occasionally called away (fictional rule; no player quiz).')},
 grok:{name:names('Grok · 溅射','Grok · Splash'),cost:80,hp:90,damage:16,interval:1.8,speed:6,description:names('命中后波及本行0.8格内至多3个目标；每第4发变成烂输出，伤害16→4。敢放大招，也会拉胯（虚构规则）。','Hits up to 3 targets within 0.8 cells in the same lane. Every 4th shot is weak output: damage 16 → 4. Bold, but messy (fictional rule).')},
 gemini:{name:names('Gemini · 星弹','Gemini · Star'),cost:80,hp:90,damage:6,interval:1.7,speed:5.5,description:names('命中附近敌人减速25%，持续1.5秒，不叠加。','Impact slows nearby enemies by 25% for 1.5s; does not stack.')}
};
const enemies={
 data:{name:names('数据团','Data blob'),hp:42,speed:.18,damage:12,interval:1},
 swarm:{name:names('碎片群','Fragment'),hp:22,speed:.22,damage:7,interval:.8},
 armor:{name:names('装甲数据','Armored data'),hp:110,speed:.13,damage:18,interval:1.3,armor:.35},
 charge:{name:names('冲锋数据','Charging data'),hp:55,speed:.36,damage:16,interval:.75}
};
const roster=Object.freeze(['deepseek','gpt','claude','grok']);
// Exact timed packets. Counts and forecasts derive from these actual spawn records.
const normalSpawns=[[{"row":0,"type":"data","time":4},{"row":0,"type":"data","time":6},{"row":1,"type":"data","time":7},{"row":1,"type":"data","time":9},{"row":2,"type":"data","time":10},{"row":2,"type":"data","time":12},{"row":3,"type":"data","time":13},{"row":3,"type":"data","time":15},{"row":4,"type":"data","time":16},{"row":4,"type":"data","time":18},{"row":0,"type":"swarm","time":26},{"row":0,"type":"swarm","time":26.5},{"row":1,"type":"swarm","time":28},{"row":1,"type":"swarm","time":28.5},{"row":2,"type":"swarm","time":30},{"row":2,"type":"swarm","time":30.5},{"row":3,"type":"swarm","time":32},{"row":3,"type":"swarm","time":32.5},{"row":4,"type":"swarm","time":34},{"row":4,"type":"swarm","time":34.5},{"row":0,"type":"data","time":44},{"row":1,"type":"data","time":46},{"row":0,"type":"data","time":47},{"row":2,"type":"data","time":48},{"row":1,"type":"data","time":49},{"row":3,"type":"data","time":50},{"row":2,"type":"data","time":51},{"row":4,"type":"data","time":52},{"row":3,"type":"data","time":53},{"row":4,"type":"data","time":55}],[{"row":0,"type":"armor","time":4},{"row":1,"type":"armor","time":7},{"row":2,"type":"armor","time":10},{"row":3,"type":"armor","time":13},{"row":4,"type":"armor","time":16},{"row":0,"type":"swarm","time":23},{"row":0,"type":"swarm","time":23.3},{"row":0,"type":"swarm","time":23.6},{"row":0,"type":"swarm","time":23.9},{"row":1,"type":"swarm","time":24},{"row":0,"type":"swarm","time":24.2},{"row":1,"type":"swarm","time":24.3},{"row":0,"type":"swarm","time":24.5},{"row":2,"type":"swarm","time":25},{"row":2,"type":"swarm","time":25.3},{"row":2,"type":"swarm","time":25.6},{"row":2,"type":"swarm","time":25.9},{"row":3,"type":"swarm","time":26},{"row":2,"type":"swarm","time":26.2},{"row":3,"type":"swarm","time":26.3},{"row":2,"type":"swarm","time":26.5},{"row":4,"type":"swarm","time":27},{"row":4,"type":"swarm","time":27.3},{"row":0,"type":"armor","time":37},{"row":1,"type":"armor","time":39},{"row":2,"type":"armor","time":41},{"row":3,"type":"armor","time":43},{"row":4,"type":"armor","time":45},{"row":0,"type":"swarm","time":53},{"row":0,"type":"swarm","time":53.25},{"row":0,"type":"swarm","time":53.5},{"row":0,"type":"swarm","time":53.75},{"row":0,"type":"swarm","time":54},{"row":1,"type":"swarm","time":54},{"row":0,"type":"swarm","time":54.25},{"row":1,"type":"swarm","time":54.25},{"row":0,"type":"swarm","time":54.5},{"row":0,"type":"swarm","time":54.75},{"row":2,"type":"swarm","time":55},{"row":2,"type":"swarm","time":55.25},{"row":2,"type":"swarm","time":55.5},{"row":2,"type":"swarm","time":55.75},{"row":2,"type":"swarm","time":56},{"row":3,"type":"swarm","time":56},{"row":2,"type":"swarm","time":56.25},{"row":3,"type":"swarm","time":56.25},{"row":2,"type":"swarm","time":56.5},{"row":2,"type":"swarm","time":56.75},{"row":4,"type":"swarm","time":57},{"row":4,"type":"swarm","time":57.25}],[{"row":0,"type":"data","time":4},{"row":1,"type":"data","time":7},{"row":1,"type":"data","time":10},{"row":2,"type":"data","time":10},{"row":3,"type":"data","time":13},{"row":4,"type":"data","time":16},{"row":0,"type":"armor","time":17},{"row":4,"type":"data","time":19},{"row":2,"type":"swarm","time":22},{"row":2,"type":"swarm","time":22.25},{"row":2,"type":"swarm","time":22.5},{"row":2,"type":"swarm","time":22.75},{"row":2,"type":"swarm","time":23},{"row":2,"type":"swarm","time":23.25},{"row":3,"type":"charge","time":25},{"row":1,"type":"swarm","time":28},{"row":1,"type":"swarm","time":28.3},{"row":3,"type":"charge","time":28.5},{"row":1,"type":"swarm","time":28.6},{"row":1,"type":"swarm","time":28.9},{"row":0,"type":"armor","time":32},{"row":4,"type":"swarm","time":32},{"row":4,"type":"swarm","time":32.3},{"row":4,"type":"swarm","time":32.6},{"row":4,"type":"swarm","time":32.9},{"row":2,"type":"armor","time":37},{"row":3,"type":"armor","time":40},{"row":2,"type":"swarm","time":45},{"row":2,"type":"swarm","time":45.25},{"row":2,"type":"swarm","time":45.5},{"row":2,"type":"swarm","time":45.75},{"row":2,"type":"swarm","time":46},{"row":3,"type":"charge","time":46},{"row":2,"type":"swarm","time":46.25},{"row":2,"type":"swarm","time":46.5},{"row":2,"type":"swarm","time":46.75},{"row":0,"type":"armor","time":47},{"row":0,"type":"charge","time":47},{"row":1,"type":"charge","time":48},{"row":3,"type":"charge","time":49.5},{"row":1,"type":"charge","time":52},{"row":4,"type":"charge","time":52},{"row":4,"type":"charge","time":56},{"row":2,"type":"swarm","time":61},{"row":2,"type":"swarm","time":61.25},{"row":2,"type":"swarm","time":61.5},{"row":2,"type":"swarm","time":61.75},{"row":2,"type":"swarm","time":62},{"row":3,"type":"charge","time":62},{"row":2,"type":"swarm","time":62.25},{"row":1,"type":"data","time":63},{"row":3,"type":"charge","time":65.5},{"row":4,"type":"data","time":66},{"row":0,"type":"armor","time":68}]];
const levels=[
 {name:names('接通防线','First connection'),brief:names('三段共30名敌人：数据试探、碎片小群、再次推进。四种守卫立即可用，先铺好各行，再按敌人类型补强。','30 enemies in three pushes: data scouts, fragment pairs, then another advance. All four guards are available. Cover lanes, then reinforce for enemy types.'),phaseStarts:[4,26,44]},
 {name:names('拥挤的数据流','Crowded stream'),brief:names('四段共50名敌人。第1、3行碎片最密集，前后有重甲压阵。Grok擅长近距离集群，GPT可穿透相隔更远的两个目标。','50 enemies in four pushes. Lanes 1 and 3 carry the densest fragments, with armor before and between them. Grok handles tight crowds; GPT pierces separated pairs.'),phaseStarts:[4,23,37,53]},
 {name:names('突破尝试','Breach attempt'),brief:names('四段共54名敌人。第1行重甲、第3行集群、第4行冲锋最突出。按位置安排重击、溅射、穿透与廉价直射，留意各自的代价。','54 enemies in four pushes. Armor in lane 1, crowds in lane 3, chargers in lane 4. Place heavy hits, splash, piercing and cheap bolts where each matters, with their drawbacks in mind.'),phaseStarts:[4,22,45,61]}
].map((level,i)=>({...level,spawns:normalSpawns[i]}));
levels.push({name:names('机制练习 · 一次绕行','Mechanic drill · One detour'),optional:true,objective:{kind:'zero-leaks',maxLeaks:0},brief:names('接近本行守卫两格时停2秒，再转向箭头邻行；停顿仍可击中，只转一次。','Within two cells of a guard ahead, pause 2s then turn to the marked lane once. Still vulnerable while waiting.'),spawns:[{row:1,type:'charge',time:4,toRow:2},{row:2,type:'swarm',time:6}]});
// Optional follow-up: route a convoy without changing any combat/economy rules.
levels.push({name:names('机制练习 · 合流车队','Mechanic drill · Converging convoy'),optional:true,objective:{kind:'zero-leaks',maxLeaks:0},brief:names('第2行三只冲锋可绕到第3行；第3行六只碎片。后排分担或前排引流，比较省钱与穿透。','Three chargers in lane 2 can turn into lane 3, where six fragments arrive. Compare rear defense with forward routing and piercing.'),spawns:[...Array.from({length:3},(_,i)=>({row:1,type:'charge',time:4+i*.6,toRow:2})),...Array.from({length:6},(_,i)=>({row:2,type:'swarm',time:6+i*.2}))]});
levels.forEach(l=>l.spawns.sort((a,b)=>a.time-b.time||a.row-b.row));
const copy=x=>JSON.parse(JSON.stringify(x)),fail=reason=>({ok:false,reason}),ok=()=>({ok:true});
function makeSchedule(seed){let out={};for(let r=0;r<5;r++)for(let c=0;c<7;c++)for(const type of ['deepseek','gpt']){seed=(Math.imul(seed,1664525)+1013904223)>>>0;let first=20+seed%11;seed=(Math.imul(seed,1664525)+1013904223)>>>0;out[r+':'+c+':'+type]={first,period:20+seed%11};}// Append Claude only AFTER all legacy entries, preserving every DS/GPT seeded plan.
for(let r=0;r<5;r++)for(let c=0;c<7;c++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const first=24+seed%7;seed=(Math.imul(seed,1664525)+1013904223)>>>0;out[r+':'+c+':claude']={first,period:24+seed%7};}return out;}
function create(level=0,options={}){if(!levels[level])throw Error('level');return {version:1,level,phase:'prepare',paused:false,seed:options.seed>>>0||1,time:0,tick:0,accumulator:0,compute:180,core:5,unlocked:[...new Set(options.unlocked||roster)].filter(x=>units[x]),units:[],enemies:[],shots:[],gpus:[],nextSpawn:0,nextGpu:6,gpuCount:0,gpuQuota:10,statusSchedule:makeSchedule(options.seed>>>0||1),nextId:1,snapshot:null,stats:{earned:0,kills:0,leaks:0,unitsLost:0,emergencyCount:0,emergencyRefunds:0,emergencyWithdrawal:null}};}
function deploy(s,row,col,type){if(!['prepare','battle'].includes(s.phase))return fail('phase');if(!Number.isInteger(row)||!Number.isInteger(col)||row<0||row>=5||col<0||col>=7)return fail('cell');if(!units[type]||!s.unlocked.includes(type))return fail('locked');if(s.units.some(u=>u.row===row&&u.col===col))return fail('occupied');const d=units[type];if(s.compute<d.cost)return fail('compute');s.compute-=d.cost;s.units.push({id:'u'+s.nextId++,row,col,x:col+.5,type,hp:d.hp,cooldown:0,fired:0,status:'normal',statusRemaining:0,warning:null,eligibleAfter:s.time+2,lastWarning:null});return ok();}
function refund(s,id){if(s.phase!=='prepare')return fail('phase');let i=s.units.findIndex(u=>u.id===id);if(i<0)return fail('unit');s.compute+=units[s.units[i].type].cost;s.units.splice(i,1);return ok();}
// Separate from preparation refunds: never counts as an enemy-caused loss or supply.
function emergencyWithdraw(s,id){
 if(s.phase!=='battle')return fail('phase');
 if((s.stats.emergencyCount||0)>=1)return fail('emergency-used');
 const i=s.units.findIndex(u=>u.id===id&&u.hp>0&&roster.includes(u.type));if(i<0)return fail('unit');
 const u=s.units[i],amount=units[u.type].cost/2;s.units.splice(i,1);s.compute+=amount;
 s.stats.emergencyCount=(s.stats.emergencyCount||0)+1;s.stats.emergencyRefunds=(s.stats.emergencyRefunds||0)+amount;
 s.stats.emergencyWithdrawal={unitType:u.type,row:u.row,col:u.col,time:s.time,amount};
 return {ok:true,amount};
}
function start(s){if(s.phase!=='prepare')return fail('phase');s.snapshot=copy({...s,snapshot:null});s.phase='battle';return ok();}
function pause(s,value){if(s.phase!=='battle')return fail('phase');s.paused=!!value;return ok();}
function retry(s){if(!['battle','lost','won'].includes(s.phase)||!s.snapshot)return fail('phase');const old=copy(s.snapshot);Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,old);return ok();}
function collect(s,id){const g=s.gpus.find(g=>g.id===id);if(!g||g.collected)return fail('gpu');if(s.phase!=='battle')return fail('phase');credit(s,g);return ok();}
function credit(s,g){g.collected=true;s.compute+=g.value;s.stats.earned+=g.value;}
function rng(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
function damage(s,e,shot,events){
 const d=units[shot.type],amount=d.damage*(shot.damageScale===undefined?1:shot.damageScale)*(shot.type==='claude'?1:1-(enemies[e.type].armor||0));
 e.hp-=amount;
 events.push({type:'hit',shotId:shot.id,source:shot.source,target:e.id,amount,row:e.row,x:e.x,time:s.time,unitType:shot.type,enemyType:e.type,...(shot.type==='grok'?{quality:shot.quality||'normal',shotNumber:shot.shotNumber,damageScale:shot.damageScale??1}:{})});
 // Gemini remains dormant and is never included in the basic roster.
 if(shot.type==='gemini')s.enemies.filter(n=>n.hp>0&&n.row===e.row&&Math.abs(n.x-e.x)<=.8).forEach(n=>n.slowUntil=s.time+1.5);
}
function updateStatus(s,u,events){const plan=s.statusSchedule[u.row+':'+u.col+':'+u.type];if(!plan)return;const duration=u.type==='deepseek'?2:3;let k=Math.max(0,Math.floor((s.time-plan.first)/plan.period));let begin=plan.first+k*plan.period;if(s.time>=begin+duration)begin+=plan.period;const previous=u.status||'normal';u.status='normal';u.statusRemaining=0;u.warning=null;if(begin>=(u.eligibleAfter||0)){if(s.time>=begin&&s.time<begin+duration){u.status=u.type==='deepseek'?'rice':u.type==='claude'?'review':'weak';u.statusRemaining=begin+duration-s.time;}else if(begin-s.time<=2+1e-9&&begin>s.time){u.warning={status:u.type==='deepseek'?'rice':u.type==='claude'?'review':'weak',startsIn:begin-s.time,duration};if(u.lastWarning!==begin){u.lastWarning=begin;events.push({type:'status-warning',unitId:u.id,status:u.warning.status,startsAt:begin,duration});}}}if(previous!==u.status)events.push({type:'status-change',unitId:u.id,status:u.status,duration:u.statusRemaining});}
function tick(s,events){const dt=1/60;s.tick++;s.time=s.tick/60;const schedule=levels[s.level].spawns;
while(s.nextSpawn<schedule.length&&schedule[s.nextSpawn].time<=s.time){const p=schedule[s.nextSpawn++],d=enemies[p.type];const e={id:'e'+s.nextId++,row:p.row,type:p.type,x:7.8,hp:d.hp,cooldown:0,slowUntil:0,mark:null};if(Number.isInteger(p.toRow)&&p.toRow>=0&&p.toRow<5&&Math.abs(p.toRow-p.row)===1)Object.assign(e,{originalRow:p.row,toRow:p.toRow,turnState:'approach',turnAt:null,turnRemaining:0});s.enemies.push(e);events.push({type:'spawn',id:e.id,row:e.row,x:e.x,time:s.time,enemyType:e.type,...(e.toRow===undefined?{}:{toRow:e.toRow})});}
while(s.gpuCount<s.gpuQuota&&s.nextGpu<=s.time){s.gpuCount++;const g={id:'g'+s.nextId++,x:.4+rng(s)*6.2,born:s.nextGpu,value:30,collected:false};s.gpus.push(g);s.nextGpu+=6;events.push({type:'gpu',id:g.id});}
s.gpus.forEach(g=>{if(!g.collected&&s.time>=g.born+4){credit(s,g);events.push({type:'gpu-credit',id:g.id,value:g.value});}});
for(const u of s.units){
 updateStatus(s,u,events);u.cooldown=Math.max(0,u.cooldown-dt);
 if(!['rice','review'].includes(u.status)&&u.cooldown<=0&&s.enemies.some(e=>e.hp>0&&e.row===u.row&&e.x>=u.x-.1)){
  u.fired++;
  const weakOutput=u.type==='grok'&&u.fired%4===0;
  const quality=u.type==='grok'?{quality:weakOutput?'weak':'normal',shotNumber:u.fired}:{};
  const damageScale=weakOutput?.25:u.status==='weak'?.7:1;
  const shot={id:'s'+s.nextId++,source:u.id,type:u.type,damageScale,...quality,row:u.row,x:u.x+.15,left:u.type==='gpt'?2:1,hits:[]};
  s.shots.push(shot);u.cooldown=units[u.type].interval;
  events.push({type:'shot',shotId:shot.id,source:u.id,piercing:u.type==='gpt',row:u.row,x:shot.x,time:s.time,unitType:u.type,...(u.type==='grok'?{...quality,damageScale}:{})});
 }
}
for(const sh of s.shots){
 const end=sh.x+units[sh.type].speed*dt;
 const targets=s.enemies.filter(e=>e.hp>0&&e.row===sh.row&&!sh.hits.includes(e.id)&&e.x>=sh.x-.22&&e.x<=end+.22).sort((a,b)=>a.x-b.x);
 for(const e of targets){
  if(sh.type==='grok'){
   // Commit one impact, primary first, then at most two nearest neighbors.
   const neighbors=s.enemies.filter(n=>n!==e&&n.hp>0&&n.row===e.row&&!sh.hits.includes(n.id)&&Math.abs(n.x-e.x)<=.8+1e-9)
    .sort((a,b)=>Math.abs(a.x-e.x)-Math.abs(b.x-e.x)||a.x-b.x||String(a.id).localeCompare(String(b.id))).slice(0,2);
   events.push({type:'cluster-impact',shotId:sh.id,source:sh.source,row:e.row,x:e.x,time:s.time,unitType:sh.type,quality:sh.quality||'normal',shotNumber:sh.shotNumber,damageScale:sh.damageScale??1});
   for(const target of [e,...neighbors]){damage(s,target,sh,events);sh.hits.push(target.id);}
   sh.left=0;break;
  }
  damage(s,e,sh,events);sh.hits.push(e.id);if(--sh.left<=0)break;
 }
 sh.x=end;
}
s.shots=s.shots.filter(sh=>sh.left>0&&sh.x<8.5);
for(const e of s.enemies){if(e.hp<=0)continue;
if(e.turnState==='approach'){const guard=s.units.filter(u=>u.hp>0&&u.row===e.row&&u.x<=e.x&&e.x-u.x<=2).sort((a,b)=>b.x-a.x)[0];if(guard){e.turnState='waiting';e.turnAt=s.time+2;e.turnRemaining=2;events.push({type:'detour-warning',id:e.id,row:e.row,fromRow:e.row,toRow:e.toRow,x:e.x,time:s.time,enemyType:e.type,duration:2,remaining:2});}}
if(e.turnState==='waiting'){e.turnRemaining=Math.max(0,e.turnAt-s.time);if(e.turnRemaining>1e-9)continue;const fromRow=e.row;e.row=e.toRow;e.turnState='done';e.turnRemaining=0;const landing=s.units.filter(u=>u.hp>0&&u.row===e.row&&Math.abs(u.x-e.x)<=.44).sort((a,b)=>b.x-a.x)[0];if(landing)e.x=Math.max(e.x,landing.x+.43);events.push({type:'detour-turn',id:e.id,row:e.row,fromRow,toRow:e.toRow,x:e.x,time:s.time,enemyType:e.type,duration:0,remaining:0});}
if(e.mark&&e.mark.until<=s.time)e.mark=null;e.cooldown=Math.max(0,e.cooldown-dt);const block=s.units.filter(u=>u.hp>0&&u.row===e.row&&u.x<=e.x+.1&&e.x-u.x<=.44).sort((a,b)=>b.x-a.x)[0];if(block){if(e.cooldown<=0){block.hp-=enemies[e.type].damage;e.cooldown=enemies[e.type].interval;events.push({type:'unit-hit',source:e.id,target:block.id,amount:enemies[e.type].damage,row:block.row,x:block.x,time:s.time,unitType:block.type,enemyType:e.type});}}else e.x-=enemies[e.type].speed*(e.slowUntil>s.time?.75:1)*dt;}
s.units=s.units.filter(u=>{if(u.hp<=0){s.stats.unitsLost++;events.push({type:'unit-lost',id:u.id,row:u.row,x:u.x,time:s.time,unitType:u.type});}return u.hp>0;});
s.enemies=s.enemies.filter(e=>{if(e.hp<=0){s.stats.kills++;events.push({type:'kill',id:e.id,row:e.row,x:e.x,time:s.time,enemyType:e.type});return false;}if(e.x<0){s.core--;s.stats.leaks++;events.push({type:'leak',id:e.id,row:e.row,x:e.x,time:s.time,enemyType:e.type});return false;}return true;});
if(levels[s.level].objective?.kind==='zero-leaks'&&s.stats.leaks>0){s.phase='lost';s.failureReason='challenge-leak';events.push({type:'lost',reason:'challenge-leak'});}else if(s.core<=0){s.phase='lost';events.push({type:'lost'});}else if(s.nextSpawn===schedule.length&&!s.enemies.length){s.phase='won';/* Pending GPU cannot be lost to an early victory. */s.gpus.forEach(g=>{if(!g.collected)credit(s,g);});const remainder=(s.gpuQuota-s.gpuCount)*30;s.compute+=remainder;s.stats.earned+=remainder;s.gpuCount=s.gpuQuota;events.push({type:'gpu-settle',value:remainder});events.push({type:'won'});}}
function step(s,dt){const events=[];if(s.phase!=='battle'||s.paused||!Number.isFinite(dt)||dt<=0)return events;s.accumulator+=Math.min(dt,1);while(s.accumulator+1e-9>=1/60&&s.phase==='battle'){s.accumulator-=1/60;tick(s,events);}return events;}
const api={roster,create,deploy,refund,emergencyWithdraw,start,pause,retry,collect,step,preview:level=>copy(levels[level]?.spawns||[]),definitions:{units,enemies},levels,grid:{rows:5,cols:7},economy:{initial:180,gpuValue:30,gpuInterval:6,autoCollectDelay:4,quota:10,total:300},statusLabels:{normal:names('正常','Ready'),rice:names('吃饭中','Rice break'),weak:names('思路卡住','Brain fog'),riceWarning:names('准备开饭','Rice break soon'),weakWarning:names('即将卡住','Brain fog soon'),review:names('复核离线','Offline review'),reviewWarning:names('复核即将开始','Review soon')}};
if(typeof module!=='undefined'&&module.exports)module.exports=api;root.TDLanes=api;
})(typeof globalThis!=='undefined'?globalThis:this);
