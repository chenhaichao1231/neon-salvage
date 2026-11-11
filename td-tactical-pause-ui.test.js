'use strict';
// DOM/canvas contract checks, not browser/device acceptance. No live game injection.
const assert=require('node:assert/strict'),fs=require('node:fs'),E=require('./td-lanes'),UI=require('./td-lanes-ui'),R=require('./td-lanes-renderer');
const source=fs.readFileSync(__dirname+'/td-lanes-dom-writes.test.js','utf8').split('function count(h)')[0];
const harness=Function('require','__dirname',source+'\nreturn harness;')(require,__dirname);
const advance=(s,t)=>{while(s.phase==='battle'&&s.time<t-1e-8)E.step(s,1/60);};
let groups=0;
for(const lang of ['zh','en']){
 const h=harness(0),c=h.app.controller;if(c.lang!==lang)h.nodes.language.onclick();
 for(const i of [0,7,14])h.nodes.grid.children[i].onclick();h.nodes.start.onclick();const prep=structuredClone(c.state.snapshot);advance(c.state,6);h.app.render();h.nodes.pause.onclick();
 const before=structuredClone(c.state);c.tick(100);assert.deepEqual(c.state,before);assert.equal(h.nodes.pause.textContent,lang==='zh'?'继续':'Resume');assert.match(h.nodes.goal.textContent,lang==='zh'?/立即扣费/:/spend GPU/);
 assert(!h.nodes.tokens.children[0].disabled);assert.equal(c.state.compute,30);h.nodes.grid.children[21].onclick();assert.equal(c.message,'compute');assert.match(h.nodes.goal.textContent,lang==='zh'?/继续后等待/:/resume to wait/);
 const pickup=h.nodes.tokens.children[0];pickup.onclick();assert.equal(c.state.compute,60);pickup.onclick();assert.equal(c.state.compute,60);h.nodes.grid.children[21].onclick();assert.equal(c.state.compute,10);assert.equal(c.state.units.length,4);assert(c.state.paused);h.nodes.grid.children[21].onclick();assert.equal(c.state.compute,10);
 assert(!h.nodes.refund.disabled);h.nodes.refund.onclick();assert.equal(c.state.compute,35);assert.equal(c.state.stats.emergencyCount,1);assert.equal(c.state.stats.emergencyRefunds,25);assert.equal(c.state.stats.earned,30);h.nodes.refund.onclick();assert.equal(c.state.compute,35);
 const after=structuredClone(c.state);h.app.frame(0);h.app.frame(1000);assert.deepEqual(c.state,after);h.nodes.language.onclick();assert.deepEqual(c.state,after);assert.match(h.nodes['supply-explanation'].textContent,lang==='en'?/立即花费/:/spends GPU immediately/);h.nodes.language.onclick();
 h.doc.hidden=true;h.events.visibilitychange();h.doc.hidden=false;h.events.visibilitychange();c.tick(1);assert.deepEqual(c.state,after);h.nodes.pause.onclick();c.tick(1/60);assert(c.state.time>after.time);h.nodes.retry.onclick();assert.deepEqual(c.state,prep);groups++;
}
// Natural defeat can leave a visible GPU: it must be disabled, with phase guards intact.
{const h=harness(3),c=h.app.controller;h.nodes.start.onclick();advance(c.state,100);assert.equal(c.state.phase,'lost');h.app.render();assert(h.nodes.tokens.children.length);const before=structuredClone(c.state);for(const b of h.nodes.tokens.children){assert(b.disabled);b.onclick();}assert.deepEqual(c.state,before);assert(h.nodes.grid.children.every(b=>b.disabled));groups++;}
// Both renderer paths draw everything normally during pause, omitting only the former central plaque.
for(const lang of ['zh','en'])for(const [width,height]of [[1120,650],[740,400],[1120,300]]){
 const s=E.create(4);E.deploy(s,1,5,'deepseek');E.deploy(s,2,0,'gpt');E.start(s);advance(s,6);while(!s.shots.length&&s.time<8)E.step(s,1/60);E.pause(s,true);assert(s.shots.length&&s.enemies.length&&s.gpus.some(g=>!g.collected));
 for(const main of [true,false]){const calls=[],ctx=new Proxy({},{get:(o,k)=>o[k]||((...a)=>calls.push([k,...a])),set:(o,k,v)=>(o[k]=v,true)});const before=structuredClone(s);
 if(main)R.draw(ctx,{state:s,definitions:E.definitions,layout:{},selectedUnit:s.units[0].id},{width,height,lang});else UI.fallback(ctx,s,E,lang);
 assert.deepEqual(s,before);assert(!calls.some(a=>a[0]==='fillText'&&['PAUSED','已暂停'].includes(a[1])));assert(!calls.some(a=>(a[0]==='roundRect'&&a[1]===375&&a[2]===285)||(a[0]==='fillRect'&&a[1]===390&&a[2]===290)));
 assert(calls.some(a=>a[0]==='fillRect'),'board and health geometry remains');if(main)assert(calls.some(a=>a[0]==='setLineDash'&&a[1][0]===7),'selected forward lane stays visible');
 const terminal=structuredClone(s);E.pause(terminal,false);advance(terminal,100);assert(['won','lost'].includes(terminal.phase));calls.length=0;if(main)R.draw(ctx,{state:terminal,definitions:E.definitions,layout:{}},{width,height,lang});else UI.fallback(ctx,terminal,E,lang);assert(calls.some(a=>a[0]==='fillText'&&/CORE LOST|核心失守|CHALLENGE INCOMPLETE|挑战未完成|LINE HELD|防线守住/.test(a[1])));
 }
 groups++;
}
delete global.TDLanesRenderer;
console.log('PASS '+groups+' tactical pause bilingual UI / freeze / retry / terminal / bounded canvas groups (not browser acceptance)');
