/* Read-only battle observations and reference copy. Never mutates engine state. */
(function(root){'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
function signature(s,schedule){return JSON.stringify({level:s.level,seed:s.seed,status:Object.entries(s.statusSchedule).sort(([a],[b])=>a.localeCompare(b)),schedule});}
function tracker(){let active=null,last=null,result=null;
return {
 begin(s,schedule){active={key:signature(s,schedule),level:s.level,leaks:[0,0,0,0,0],losses:[0,0,0,0,0],firstLeak:null,turns:0,secondHits:0,grokMultiShots:0,seen:new Set(),shots:new Map()};result=null;},
 reset(level){active=null;result=null;if(last&&last.level!==level)last=null;},
 observe(events,s){if(!active)return;for(const e of events){if(!['leak','unit-lost','detour-turn','hit'].includes(e.type))continue;
 const key=e.type==='hit'?'hit|'+e.shotId+'|'+e.target:e.type+'|'+e.id;
 if(active.seen.has(key))continue;active.seen.add(key);
 if(e.type==='hit'){if(!['gpt','grok'].includes(e.unitType)||!e.shotId||!e.target)continue;let targets=active.shots.get(e.shotId);if(!targets){targets=new Set();active.shots.set(e.shotId,targets);}targets.add(e.target);if(targets.size===2){if(e.unitType==='gpt')active.secondHits++;else active.grokMultiShots++;}}
 else if(e.type==='detour-turn')active.turns++;
 else if(Number.isInteger(e.row)&&e.row>=0&&e.row<5){if(e.type==='unit-lost')active.losses[e.row]++;else{active.leaks[e.row]++;if(!active.firstLeak||e.time<active.firstLeak.time)active.firstLeak={row:e.row,time:e.time};}}
 }
 if(!['won','lost'].includes(s.phase))return;
 const {seen,shots,...facts}=active;const current={...facts,outcome:s.phase,time:s.time,core:s.core,withdrawal:s.stats.emergencyWithdrawal?clone(s.stats.emergencyWithdrawal):null,withdrawals:s.stats.emergencyCount||0,refunded:s.stats.emergencyRefunds||0,spent:180+s.stats.earned+(s.stats.emergencyRefunds||0)-s.compute};
 result={...current,previous:last?.key===current.key?clone(last):null};last=clone(current);active=null;
 },
 get result(){return result?clone(result):null;}
};}
// Compact stored observations deliberately have no shot facts or withdrawal event detail.
function summary(r,lang){const zh=lang==='zh',sum=a=>a.reduce((x,y)=>x+y,0),leaks=sum(r.leaks),losses=sum(r.losses);
 return (zh?'核心':'Core ')+r.core+'/5 · '+(zh?'漏敌'+leaks:leaks+' leak'+(leaks===1?'':'s'))+' · '+(zh?'守卫被击败'+losses:losses+' guard'+(losses===1?'':'s')+' defeated')+' · '+(zh?'花费'+r.spent+' GPU':r.spent+' GPU spent')+' · '+(r.outcome==='won'?(zh?'通关'+r.time.toFixed(1)+'秒':'cleared in '+r.time.toFixed(1)+'s'):(zh?'败局前'+r.time.toFixed(1)+'秒':r.time.toFixed(1)+'s until defeat'))+((r.withdrawals||r.refunded)?' · '+(zh?'撤离'+(r.withdrawals||0)+' · 退回'+(r.refunded||0)+' GPU':(r.withdrawals||0)+' withdrawn · '+(r.refunded||0)+' GPU refunded'):'');
}
function retentionLines(provenance,notice,lang){const zh=lang==='zh';
 if(notice==='invalid-facts')return[zh?'本局记录无法保留，旧记录未改动。':'This result could not be retained; the previous record is unchanged.'];
 const out=[];
 if(provenance==='session'||notice&&notice!=='incompatible')out.push(zh?'本关新结果仅保留在本次会话中。':'New results for this stage are kept only for this session.');
 return out;
}
function referenceLines(reference,lang){if(!reference)return[];const zh=lang==='zh',r=reference.historical||reference.previous,out=[],source=reference.historical?reference.historicalProvenance:reference.provenance;
 if(r&&reference.incompatible){out.push(source==='browser'?(zh?'上次保存结果；计划或规则与本次不同，仅供回顾，不作成绩对比。':'Last saved result. Plans or rules differ from this attempt; shown for reference, without performance comparison.'):(zh?'本次会话上次结果；计划或规则与本次不同，仅供回顾，不作成绩对比。':'Previous result this session. Plans or rules differ from this attempt; shown for reference, without performance comparison.'));out.push((r.outcome==='won'?(zh?'守住':'held'):(zh?'失败':'failed'))+' · '+summary(r,lang));out.push(zh?'保留上次结果，不是最佳成绩。花费不扣撤离退款。':'Last result, not a personal best. Spending is before withdrawal refunds.');out.push(zh?'仅此浏览器，不跨设备同步；刷新不恢复战斗。':'This browser only, no cross-device sync; refresh does not resume a battle.');}
 else if(r){out.push((source==='browser'?(zh?'上次保存结果：':'Last saved result: '):(zh?'本次会话上次结果：':'Previous result this session: '))+(r.outcome==='won'?(zh?'守住':'held'):(zh?'失败':'failed')),summary(r,lang));
 out.push(zh?'同关、同随机计划与规则；保留上次结果，不是最佳成绩。花费不扣撤离退款。':'Same stage, seeded schedule and rules. Last result, not a personal best. Spending is before withdrawal refunds.');
 out.push(zh?'仅此浏览器，不跨设备同步；刷新不恢复战斗。':'This browser only, no cross-device sync; refresh does not resume a battle.');
 }else if(reference.incompatible||reference.notice==='incompatible')out.push(zh?'旧结果的计划或规则不同，本局不作对比。':'The saved result used different plans or rules; no comparison this time.');
 return out.concat(retentionLines(source,reference.notice,lang));
}
function lines(r,lang){if(!r)return[];const zh=lang==='zh',sum=a=>a.reduce((x,y)=>x+y,0),signed=n=>(n>0?'+':'')+n;
 const affected=r.leaks.map((n,i)=>({row:i+1,leaks:n,losses:r.losses[i]})).filter(x=>x.leaks||x.losses);
 const withdrawn=r.withdrawals||0;const facts=affected.length?(zh?'受损行（漏敌/守卫损失）：':'Affected lanes (leaks/guards lost): ')+affected.map(x=>x.row+': '+x.leaks+'/'+x.losses).join(' · '):(withdrawn?(zh?'无漏敌，无守卫被击败':'No leaks or guards defeated'):(zh?'无漏敌，无守卫损失':'No leaks or guards lost'));
 const first=r.firstLeak?(zh?'首次漏敌：第'+(r.firstLeak.row+1)+'行，':'First leak: lane '+(r.firstLeak.row+1)+', ')+r.firstLeak.time.toFixed(1)+'s':'';
 const out=[facts+(withdrawn?(zh?' · 主动撤离 ':' · Voluntary withdrawals ')+withdrawn+(zh?' · 退回 ':' · Refunded ')+(r.refunded||0)+' GPU':''),(first?first+' · ':'')+(zh?'实际转行 ':'Actual turns ')+r.turns+' · '+(zh?'GPT 第二目标命中 ':'GPT second-target hits ')+r.secondHits+' · '+(zh?'Grok 命中至少2个目标的发数 ':'Grok shots hitting 2+ targets ')+r.grokMultiShots];
 const describe=w=>w.time.toFixed(1)+'s · '+({deepseek:'DS',gpt:'GPT',claude:'Claude',grok:'Grok'}[w.unitType]||w.unitType)+(zh?' 第'+(w.row+1)+'行第'+(w.col+1)+'格撤离，退回':' lane '+(w.row+1)+' cell '+(w.col+1)+' withdrawn, ')+w.amount+(zh?' GPU':' GPU returned');
 if(r.withdrawal)out.push(describe(r.withdrawal));
 if(r.previous?.withdrawal)out.push((zh?'上次撤离：':'Previous withdrawal: ')+describe(r.previous.withdrawal));
 if(r.previous){const p=r.previous;out.push((r.durable?(zh?'较本局开始前的参考结果（同关同随机计划与规则，':'Change from reference from before this attempt (same stage/seeded schedule and rules, '):(zh?'较上次结束的战斗（同关同随机计划，':'Change from last finished attempt (same stage/seeded schedule, '))+(p.outcome==='won'?(zh?'守住':'held'):(zh?'失败':'failed'))+(zh?'）：':'): ')+(zh?'漏敌 ':'leaks ')+signed(sum(r.leaks)-sum(p.leaks))+' · '+(zh?'守卫损失 ':'guards lost ')+signed(sum(r.losses)-sum(p.losses))+((r.withdrawals||p.withdrawals)?(zh?' · 主动撤离 ':' · Withdrawals ')+signed((r.withdrawals||0)-(p.withdrawals||0))+(zh?' · 退回GPU ':' · Refunded GPU ')+signed((r.refunded||0)-(p.refunded||0)):'')+(zh?' · GPU花费 ':' · GPU spent ')+signed(r.spent-p.spent)+(r.outcome==='won'&&p.outcome==='won'?' · '+(zh?'通关用时 ':'clear time ')+signed(Number((r.time-p.time).toFixed(1)))+'s':''));}
 if(withdrawn||r.previous?.withdrawals)out.push(zh?'部署花费含已撤离角色的原价；撤离退款不抵扣花费，也不计入固定补给。':'Spending is gross deployment cost. Withdrawal refunds do not reduce it or count as fixed supply.');
 if(r.durable){
 out.unshift((zh?'本局结果：':'This attempt: ')+(r.outcome==='won'?(zh?'守住':'held'):(zh?'失败':'failed'))+' · '+summary(r,lang));
 if(r.incompatible&&!r.previous)out.push(zh?'此前结果条件不同，本局不作对比。':'The prior result used different conditions; no comparison this time.');
 if(r.previous)out.push((zh?'本局开始前的参考结果':'Reference from before this attempt')+(r.previousProvenance==='browser'?(zh?'（此前保存在此浏览器）：':' (previously saved in this browser): '):(zh?'（本次会话）：':' (this session): '))+(r.previous.outcome==='won'?(zh?'守住':'held'):(zh?'失败':'failed'))+' · '+summary(r.previous,lang));
 if(r.provenance==='browser'&&r.notice!=='invalid-facts')out.push(zh?'本局结果已保存在此浏览器；保留上次结果，不是最佳成绩。':'This result was saved in this browser. Last result, not a personal best.');
 out.push(...retentionLines(r.provenance,r.notice,lang));
 out.push(zh?'仅此浏览器，不跨设备同步；刷新不恢复战斗。失败统计止于败局，通关用时仅对比胜局。':'This browser only, no cross-device sync; refresh does not resume a battle. Failed totals stop at defeat; clear times compare wins only.');
 }else out.push(zh?'仅本次会话；失败统计止于败局，通关用时仅对比胜局。':'Session only. Failed totals stop at defeat; clear times compare wins only.');return out;}
const api={tracker,signature,lines,referenceLines};root.TDBattleReview=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
