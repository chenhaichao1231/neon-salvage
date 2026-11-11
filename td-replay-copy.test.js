'use strict';
const assert=require('node:assert/strict'),R=require('./td-battle-review');
const compact={outcome:'won',core:4,leaks:[0,1,0,0,0],losses:[0,0,1,0,0],spent:490,time:86.3,withdrawals:1,refunded:45};
const full={...compact,firstLeak:{row:1,time:31.2},turns:2,secondHits:3,grokMultiShots:4,withdrawal:{time:12.5,unitType:'gpt',row:2,col:3,amount:45}};
for(const lang of ['en','zh']){
 const zh=lang==='zh',pre=R.referenceLines({previous:compact,provenance:'browser'},lang).join('\n');
 for(const bit of ['4/5','490','86.3','45',zh?'不是最佳成绩':'not a personal best',zh?'不跨设备同步':'no cross-device sync'])assert(pre.includes(bit));
 assert(pre.includes(zh?'上次保存结果':'Last saved result'));
 assert(!/GPT|Grok|12\.5|31\.2|NaN|undefined/.test(pre));
 const session=R.referenceLines({previous:compact,provenance:'session',notice:'write-error'},lang).join('\n');
 assert(session.includes(zh?'本次会话上次结果':'Previous result this session'));
 assert(!session.includes(zh?'上次保存结果':'Last saved result'));
 assert(session.includes(zh?'本关新结果仅保留在本次会话中':'New results for this stage are kept only for this session'));
 assert(!/quota|capacity|permission|容量|权限/.test(session));
 const defeat={...compact,outcome:'lost',core:-1,leaks:[2,1,1,1,1]};
 const lost=R.referenceLines({previous:defeat,provenance:'browser'},lang).join('\n');
 assert(lost.includes('-1/5'));assert(lost.includes(zh?'败局前86.3秒':'86.3s until defeat'));assert(!lost.includes(zh?'通关':'cleared'));
 assert.deepEqual(R.referenceLines({previous:null,provenance:null,notice:null},lang),[]);
 const incompatible=R.referenceLines({previous:null,incompatible:true},lang).join('\n');assert(incompatible.includes(zh?'不作对比':'no comparison'));assert(!incompatible.includes('490'));
 for(const outcome of ['won','lost'])for(const previousOutcome of ['won','lost']){
 const result={...full,outcome,previous:{...compact,outcome:previousOutcome},previousProvenance:'browser',provenance:'session',notice:'write-error',durable:true};
 const text=R.lines(result,lang).join('\n');
 assert(text.includes(zh?'本局开始前的参考结果':'Reference from before this attempt'));
 assert(text.includes(zh?'此前保存在此浏览器':'previously saved in this browser'));
 assert(text.includes(zh?'本次会话':'this session'));
 assert(!text.includes(zh?'上次撤离：':'Previous withdrawal:'));
 assert.equal(text.includes(zh?'通关用时 ':'clear time '),outcome==='won'&&previousOutcome==='won');
 for(const fact of ['490','86.3','12.5','31.2','GPT','Grok'])assert(text.includes(fact));
 assert(!text.includes(zh?'本局结果已保存':'This result was saved'));
 assert(!/undefined|NaN/.test(text));
 }
 const currentSaved=R.lines({...full,previous:null,durable:true,provenance:'browser'},lang).join('\n');assert(currentSaved.includes(zh?'本局结果已保存':'This result was saved'));
 const invalid=R.lines({...full,previous:compact,durable:true,provenance:'browser',notice:'invalid-facts'},lang).join('\n');assert(invalid.includes(zh?'旧记录未改动':'previous record is unchanged'));assert(!invalid.includes(zh?'本局结果已保存':'This result was saved'));assert(!invalid.includes(zh?'本关新结果仅保留':'New results for this stage are kept'));
 const rich=R.lines({...full,previous:full,durable:true,provenance:'browser',previousProvenance:'session'},lang).join('\n');assert(rich.includes(zh?'上次撤离：':'Previous withdrawal:'));
}
console.log('PASS durable bilingual preparation, current and compact/full previous facts, provenance, gross withdrawals, negative core and wins-only time comparison');
for(const lang of ['en','zh'])for(const source of ['browser','session']){
 const lines=R.referenceLines({historical:compact,historicalProvenance:source,previous:null,incompatible:true,provenance:null,notice:null},lang),text=lines.join(' ');
 assert(lines[0].includes(lang==='en'?'Plans or rules differ':'计划或规则与本次不同'));
 assert(lines[0].startsWith(source==='browser'?(lang==='en'?'Last saved result.':'上次保存结果；'):(lang==='en'?'Previous result this session.':'本次会话上次结果；')));
 assert(!text.includes(lang==='en'?'Same stage, seeded schedule and rules':'同关、同随机计划与规则'));assert(text.includes(lang==='en'?'not a personal best':'不是最佳成绩'));assert(text.includes(lang==='en'?'Spending is before withdrawal refunds':'花费不扣撤离退款'));if(source==='session')assert(text.includes(lang==='en'?'only for this session':'仅保留在本次会话')); 
}
