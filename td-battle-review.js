/* Read-only, session-only battle observations. Never mutates or persists engine state. */
(function(root){'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
function signature(s,schedule){return JSON.stringify({level:s.level,seed:s.seed,status:Object.entries(s.statusSchedule).sort(([a],[b])=>a.localeCompare(b)),schedule});}
function tracker(){let active=null,last=null,result=null;
return {
 begin(s,schedule){active={key:signature(s,schedule),level:s.level,leaks:[0,0,0,0,0],losses:[0,0,0,0,0],firstLeak:null,turns:0,secondHits:0,seen:new Set(),shots:new Map()};result=null;},
 reset(level){active=null;result=null;if(last&&last.level!==level)last=null;},
 observe(events,s){if(!active)return;for(const e of events){if(!['leak','unit-lost','detour-turn','hit'].includes(e.type))continue;
 const key=e.type==='hit'?'hit|'+e.shotId+'|'+e.target:e.type+'|'+e.id;
 if(active.seen.has(key))continue;active.seen.add(key);
 if(e.type==='hit'){if(e.unitType!=='gpt'||!e.shotId||!e.target)continue;let targets=active.shots.get(e.shotId);if(!targets){targets=new Set();active.shots.set(e.shotId,targets);}targets.add(e.target);if(targets.size===2)active.secondHits++;}
 else if(e.type==='detour-turn')active.turns++;
 else if(Number.isInteger(e.row)&&e.row>=0&&e.row<5){if(e.type==='unit-lost')active.losses[e.row]++;else{active.leaks[e.row]++;if(!active.firstLeak||e.time<active.firstLeak.time)active.firstLeak={row:e.row,time:e.time};}}
 }
 if(!['won','lost'].includes(s.phase))return;
 const {seen,shots,...facts}=active;const current={...facts,outcome:s.phase,time:s.time,core:s.core,withdrawal:s.stats.emergencyWithdrawal?clone(s.stats.emergencyWithdrawal):null,withdrawals:s.stats.emergencyCount||0,refunded:s.stats.emergencyRefunds||0,spent:180+s.stats.earned+(s.stats.emergencyRefunds||0)-s.compute};
 result={...current,previous:last?.key===current.key?clone(last):null};last=clone(current);active=null;
 },
 get result(){return result?clone(result):null;}
};}
function lines(r,lang){if(!r)return[];const zh=lang==='zh',sum=a=>a.reduce((x,y)=>x+y,0),signed=n=>(n>0?'+':'')+n;
 const affected=r.leaks.map((n,i)=>({row:i+1,leaks:n,losses:r.losses[i]})).filter(x=>x.leaks||x.losses);
 const withdrawn=r.withdrawals||0;const facts=affected.length?(zh?'受损行（漏敌/守卫损失）：':'Affected lanes (leaks/guards lost): ')+affected.map(x=>x.row+': '+x.leaks+'/'+x.losses).join(' · '):(withdrawn?(zh?'无漏敌，无守卫被击败':'No leaks or guards defeated'):(zh?'无漏敌，无守卫损失':'No leaks or guards lost'));
 const first=r.firstLeak?(zh?'首次漏敌：第'+(r.firstLeak.row+1)+'行，':'First leak: lane '+(r.firstLeak.row+1)+', ')+r.firstLeak.time.toFixed(1)+'s':'';
 const out=[facts+(withdrawn?(zh?' · 主动撤离 ':' · Voluntary withdrawals ')+withdrawn+(zh?' · 退回 ':' · Refunded ')+(r.refunded||0)+' GPU':''),(first?first+' · ':'')+(zh?'实际转行 ':'Actual turns ')+r.turns+' · '+(zh?'GPT 第二目标命中 ':'GPT second-target hits ')+r.secondHits];
 const describe=w=>w.time.toFixed(1)+'s · '+(w.unitType==='deepseek'?'DS':'GPT')+(zh?' 第'+(w.row+1)+'行第'+(w.col+1)+'格撤离，退回':' lane '+(w.row+1)+' cell '+(w.col+1)+' withdrawn, ')+w.amount+(zh?' GPU':' GPU returned');
 if(r.withdrawal)out.push(describe(r.withdrawal));
 if(r.previous?.withdrawal)out.push((zh?'上次撤离：':'Previous withdrawal: ')+describe(r.previous.withdrawal));
 if(r.previous){const p=r.previous;out.push((zh?'较上次结束的战斗（同关同随机计划，':'Change from last finished attempt (same stage/seeded schedule, ')+(p.outcome==='won'?(zh?'守住':'held'):(zh?'失败':'failed'))+(zh?'）：':'): ')+(zh?'漏敌 ':'leaks ')+signed(sum(r.leaks)-sum(p.leaks))+' · '+(zh?'守卫损失 ':'guards lost ')+signed(sum(r.losses)-sum(p.losses))+((r.withdrawals||p.withdrawals)?(zh?' · 主动撤离 ':' · Withdrawals ')+signed((r.withdrawals||0)-(p.withdrawals||0))+(zh?' · 退回GPU ':' · Refunded GPU ')+signed((r.refunded||0)-(p.refunded||0)):'')+(zh?' · GPU花费 ':' · GPU spent ')+signed(r.spent-p.spent)+(r.outcome==='won'&&p.outcome==='won'?' · '+(zh?'通关用时 ':'clear time ')+signed(Number((r.time-p.time).toFixed(1)))+'s':''));}
 if(withdrawn||r.previous?.withdrawals)out.push(zh?'部署花费含已撤离角色的原价；撤离退款不抵扣花费，也不计入固定补给。':'Spending is gross deployment cost. Withdrawal refunds do not reduce it or count as fixed supply.');
 out.push(zh?'仅本次会话；失败统计止于败局，通关用时仅对比胜局。':'Session only. Failed totals stop at defeat; clear times compare wins only.');return out;}
const api={tracker,signature,lines};root.TDBattleReview=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
