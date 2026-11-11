'use strict';
const assert=require('node:assert/strict'),R=require('./td-battle-review');
const base={leaks:[0,0,0,0,0],losses:[0,0,0,0,0],firstLeak:null,turns:0,secondHits:0,outcome:'won',spent:100,time:25};
for(const lang of ['en','zh']){
 const result={...base,previous:{...base}};
 const text=R.lines(result,lang).join('\n');
 if(lang==='en'){assert(!/[（）：]/.test(text));assert(text.includes('held): leaks 0'));assert(text.includes('No leaks or guards lost'));}
 else{assert(text.includes('守住）：漏敌 0'));assert(!text.includes(')'));assert(text.includes('无漏敌，无守卫损失'));}
 assert(!text.includes('1: 0/0'));assert(!text.includes('5: 0/0'));
 const affected=R.lines({...result,leaks:[0,1,0,0,0],losses:[0,0,0,2,0],firstLeak:{row:1,time:15.5}},lang);
 assert(affected[0].includes('2: 1/0'));assert(affected[0].includes('4: 0/2'));assert(!affected[0].includes('1:'));
 assert(affected[1].includes('15.5s'));
 const failed=R.lines({...result,outcome:'lost'},lang).join('\n');
 assert(!failed.includes('clear time '));assert(!failed.includes('通关用时 '));
 assert(failed.includes(lang==='en'?'Failed totals stop at defeat':'失败统计止于败局'));
 const noPrevious=R.lines(base,lang).join('\n');assert(!noPrevious.includes('GPU'));assert(!noPrevious.includes('25'));
}
console.log('PASS bilingual punctuation, sparse lane facts, first leak, failure limits, no duplicate absolute cost/time');
