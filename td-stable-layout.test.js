'use strict';
// Text-fit/DOM contracts only. This is not a CSS layout engine or browser acceptance.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {createCanvas,GlobalFonts}=require('@napi-rs/canvas');
GlobalFonts.registerFromPath('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc','system-ui');
const E=require('./td-lanes'),UI=require('./td-lanes-ui');
const source=fs.readFileSync(__dirname+'/td-lanes-dom-writes.test.js','utf8').split('function count(h)')[0];
const harness=Function('require','__dirname',source+'\nreturn harness;')(require,__dirname);
const html=fs.readFileSync(__dirname+'/index.html','utf8'),css=fs.readFileSync(__dirname+'/td-lanes.css','utf8');
const reserve={description:html.match(/class="description-slot"><span[^>]*>([^<]+)/)[1],summary:html.match(/class="selection-reserve[^>]*><span>([^<]+)/)[1],refund:html.match(/class="refund-reserve">([^<]+)/)[1]};
const ctx=createCanvas(1,1).getContext('2d');
function lines(text,width,size){ctx.font=size+'px system-ui';let count=1,line='';for(const token of text.match(/[\u3400-\u9fff]|[^\s\u3400-\u9fff]+|\s+/g)||[]){if(line&&ctx.measureText(line+token).width>width){count++;line='';}for(const char of token){if(ctx.measureText(line+char).width>width){count++;line='';}if(line||char.trim())line+=char;}}return count;}
const samples={goal:[],description:[],summary:[],refund:[],supply:[]};
for(let level=0;level<E.levels.length;level++)for(const lang of ['en','zh'])for(const battleType of E.roster){
 const h=harness(level),c=h.app.controller;if(c.lang!==lang)h.nodes.language.onclick();
 const capture=()=>{h.app.render();for(const [key,id]of Object.entries({goal:'goal',description:'unit-description',summary:'unit-summary',refund:'refund',supply:'supply-status'}))samples[key].push(h.nodes[id].textContent);};
 capture();for(const type of E.roster){c.select(type);c.cell(0,0);capture();c.refund();}
 c.select(battleType);c.cell(0,0);c.start();capture();const unit=c.state.units[0];
 for(let repeat=0;repeat<3;repeat++)for(const hp of [unit.hp,6])for(const status of ['normal','rice','weak','review'])for(const warning of [null,{status:'rice',startsIn:2},{status:'weak',startsIn:2},{status:'review',startsIn:2}]){
 unit.hp=hp;unit.status=status;unit.statusRemaining=3;unit.warning=warning;
 c.cell(0,0);capture();c.pause();capture();c.pause();c.select('gpt');capture();assert(h.nodes['selected-unit'].hidden);c.cell(0,0);capture();assert(!h.nodes['selected-unit'].hidden);
 }
 c.state.gpus=[{id:'last',value:30,born:c.state.time,collected:false}];c.state.gpuCount=c.state.gpuQuota;c.pause();capture();c.pause();c.refund();capture();assert(h.nodes['selected-unit'].hidden);c.retry();capture();
 h.asset('failed');capture();c.start();capture();c.pause();capture();
}
for(const key of Object.keys(samples))samples[key]=[...new Set(samples[key])];
let comparisons=0;const evidence=[];
for(const viewport of [320,375,520,740,760,761,959,960,1024,1180,1280,1440]){
 const width=Math.min(1400,viewport)-(viewport<=959?20:40),descriptionWidth=viewport<=959?width:width-424-12,summaryWidth=viewport<=760?width:(descriptionWidth-8)/2;
 const columns={description:[descriptionWidth,14],summary:[summaryWidth,14],refund:[summaryWidth-30,16]};
 const sizes={};for(const [key,[w,font]]of Object.entries(columns)){const reserved=lines(reserve[key],w,font);const max=Math.max(...samples[key].map(text=>lines(text,w,font)));assert(max<=reserved,`${viewport}px ${key}: needs ${max}, reserved ${reserved}: ${samples[key].find(text=>lines(text,w,font)===max)}`);comparisons+=samples[key].length;sizes[key]=[max,reserved];}
 const supplyWidth=viewport<=520?width:viewport<=959?width-220-66-20:width-380-66-36;
 const supplyMax=Math.max(...samples.supply.map(text=>lines(text,supplyWidth,12)));assert(supplyMax<=2,`${viewport}px supply needs ${supplyMax} lines`);sizes.supply=supplyMax;const selectionEstimate=viewport<=959?null:Math.max(122,sizes.description[1]*21+8+Math.max(sizes.summary[1]*21,sizes.refund[1]*24+18,44));sizes.selectionHeightEstimate=selectionEstimate;evidence.push({viewport,contentWidth:width,textLines:sizes});
}
assert.match(html,/<div class="selection-slot"><div class="selection-reserve layout-reserve" aria-hidden="true">/);
assert(!html.match(/class="refund-reserve"[^>]*tabindex/));
assert.match(css,/\.layout-reserve\{visibility:hidden;pointer-events:none;user-select:none\}/);
assert.match(css,/#cards\{grid-column:1;grid-row:1 \/ 3/);
assert(!css.includes('50dvh'));
assert.match(css,/#battle-review\{grid-column:1 \/ -1;grid-row:3\}/);
assert(!/text-overflow:ellipsis|line-clamp/.test(css));
console.log('PASS repeated selection, pause, language, status, low HP, withdrawal, supply and retry DOM flows');
console.log('PASS '+comparisons+' bounded text-fit comparisons across 12 widths; NOT browser geometry');
console.log(JSON.stringify(evidence,null,2));
