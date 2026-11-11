'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),E=require('./td-lanes'),UI=require('./td-lanes-ui');
// Reuse the existing instrumented DOM harness without executing its suites.
const source=fs.readFileSync(__dirname+'/td-lanes-dom-writes.test.js','utf8').split('function count(h)')[0];
const harness=Function('require','__dirname',source+'\nreturn harness;')(require,__dirname);
let groups=0;function test(name,fn){fn();console.log('PASS',++groups,name);}
const label=(s,lang='en')=>{const before=JSON.stringify(s),v=UI.supplyText(s,lang);assert.equal(JSON.stringify(s),before);return v;};
function advance(s,time){while(s.phase==='battle'&&s.time<time-1e-8)E.step(s,1/60);}
function battle(){const s=E.create(1);E.start(s);return s;}
test('real first spawn, immediate manual pickup, automatic boundary and second spawn',()=>{
 const s=battle();advance(s,5.983333);assert.match(label(s),/Next supply \+30 · in 1s/);E.step(s,1/60);assert.equal(s.time,6);assert.match(label(s),/\+30 available · auto-credit in 4s/);assert.equal(s.compute,180);
 const manual=structuredClone(s);E.collect(manual,manual.gpus[0].id);assert.equal(manual.compute,210);assert.match(label(manual),/Next supply \+30 · in 6s/);
 advance(s,9.983333);assert.match(label(s),/auto-credit in 1s/);E.step(s,1/60);assert.equal(s.time,10);assert.equal(s.compute,210);assert.match(label(s),/in 2s/);advance(s,12);assert.match(label(s),/available · auto-credit in 4s/);assert.equal(s.gpuCount,2);
});
test('preparation, last pending, exhausted, early win and actual loss',()=>{
 assert.match(label(E.create()),/6 battle s/);const s=battle();s.time=60;s.nextGpu=66;s.gpuCount=s.gpuQuota;s.gpus=[{id:'last',born:60,value:30,collected:false}];assert.match(label(s),/^Last supply \+30 available/);assert.match(label(s,'zh'),/最后补给 \+30 可领取/);s.paused=true;assert.match(label(s),/^Paused · Last supply \+30 available/);assert.match(label(s,'zh'),/已暂停.*可领取/);s.paused=false;E.collect(s,'last');assert.equal(label(s),'All supply received');assert.equal(label(s,'zh'),'补给已全部到账');
 const win=battle();win.nextSpawn=E.preview(1).length;E.step(win,1/60);assert.equal(win.phase,'won');assert.equal(win.stats.earned,300);assert.equal(label(win),'All supply received');
 const loss=battle();loss.core=0;E.step(loss,1/60);assert.equal(loss.phase,'lost');assert.equal(label(loss),'Supply stopped · battle over');assert(!/in \d|auto-credit/.test(label(loss)));assert.equal(loss.stats.earned,0);
});
test('real controller pause/resume, hidden pause, speeds, retry and stage switch',()=>{
 const h=harness(1),c=h.app.controller;h.nodes.start.onclick();c.tick(1);h.app.render();assert.match(h.nodes['supply-status'].textContent,/in 5s/);h.nodes.speed.onclick();assert.equal(c.speed,2);c.tick(.5);c.tick(.5);h.app.render();assert.equal(c.state.time,3);assert.match(h.nodes['supply-status'].textContent,/in 3s/);
 h.nodes.pause.onclick();const frozen=JSON.stringify(c.state);c.tick(1);h.app.render();assert.equal(JSON.stringify(c.state),frozen);assert.match(h.nodes['supply-status'].textContent,/^Paused/);h.nodes.pause.onclick();c.tick(.5);c.tick(.5);c.tick(.5);h.app.render();assert.match(h.nodes['supply-status'].textContent,/available/);
 h.doc.hidden=true;h.events.visibilitychange();const time=c.state.time;h.app.frame(0);h.app.frame(1000);assert.equal(c.state.time,time);assert.match(h.nodes['supply-status'].textContent,/^Paused.*available/);assert(h.nodes['supply-status'].textContent.includes('available'));h.doc.hidden=false;h.events.visibilitychange();assert(c.state.paused);h.nodes.pause.onclick();assert(!c.state.paused);
 h.nodes.retry.onclick();assert.equal(c.state.time,0);assert.match(h.nodes['supply-status'].textContent,/6 battle s/);h.nodes['stage-select'].value='0';h.nodes['stage-select'].onchange();assert.equal(c.state.level,0);assert.match(h.nodes['supply-status'].textContent,/6 battle s/);
});
test('both languages, no live countdown, write stability, main/fallback suppression, resource-line placement',()=>{
 const h=harness(),c=h.app.controller;h.nodes.start.onclick();c.tick(.1);h.app.render();h.reset();c.tick(.1);h.app.render();assert(!h.writes.some(w=>w.label==='supply-status'));c.tick(.9);h.app.render();assert.equal(h.writes.filter(w=>w.label==='supply-status').length,1);
 assert(h.seen.opts.supplyOverlay);assert(!/Next supply|auto-credit in/.test(h.nodes.goal.textContent));h.nodes.language.onclick();assert.match(h.nodes['supply-status'].textContent,/下次补给/);assert.match(h.nodes['supply-explanation'].textContent,/2×/);h.nodes.pause.onclick();assert.match(h.nodes['supply-status'].textContent,/已暂停/);
 for(const [w,hgt]of [[1120,650],[740,400],[1120,300]]){h.resize(w,hgt);assert.equal(h.nodes['supply-status'].style.top,undefined);assert.equal(h.nodes['supply-status'].style.fontSize,undefined);}
 const html=fs.readFileSync(__dirname+'/index.html','utf8');assert.match(html,/<p id="supply-status" aria-describedby="supply-explanation"><\/p>/);assert.match(html,/<div class="resources"><strong id="gpu">[\s\S]*?<p id="supply-status"[^>]*><\/p><\/div>/);assert(!html.slice(html.indexOf('<section id="arena"'),html.indexOf('<section class="selection"')).includes('supply-status'));assert(!html.includes('id="board" role="status"'));assert(!html.includes('id="arena" aria-live'));assert(!/aria-live|role="status"/.test(html.slice(html.indexOf('<header>'),html.indexOf('</header>'))));assert(html.includes('id="supply-explanation"'));
 const texts=[],ctx=new Proxy({},{get:(o,k)=>o[k]||((...a)=>{if(k==='fillText')texts.push(a[0]);}),set:(o,k,v)=>(o[k]=v,true)});
 UI.fallback(ctx,c.state,E,'zh',{supplyOverlay:true});assert(!texts.some(t=>/补给/.test(t)));UI.fallback(ctx,c.state,E,'zh');assert(texts.some(t=>/已暂停.*补给/.test(t)));
 const R=require('./td-lanes-renderer');texts.length=0;R.draw(ctx,{state:c.state,definitions:E.definitions,layout:{}},{width:740,height:400,lang:'en',supplyOverlay:true});assert(!texts.some(t=>/SUPPLY/.test(t)));
 delete global.TDLanesRenderer;h.app.render();assert.match(h.nodes['supply-status'].textContent,/已暂停/);
 for(const lang of ['en','zh'])for(const phase of ['prepare','battle','won','lost']){const s=E.create();s.phase=phase;assert(label(s,lang));assert(UI.supplyExplanation(lang).includes('2×'));}
});
test('read-only feedback has identical complete outcomes and resource ledgers',()=>{
 const a=E.create(4),b=E.create(4);for(const s of [a,b]){E.deploy(s,1,0,'deepseek');E.deploy(s,2,0,'deepseek');E.start(s);}
 while(a.phase==='battle'){E.step(a,1/60);E.step(b,1/60);label(b);label(b,'zh');}assert.deepEqual(a,b);
});
test('GPU hit rectangles and rotation remain unchanged across the whole flight',()=>{
 const css=fs.readFileSync(__dirname+'/td-lanes.css','utf8');assert.match(css,/\.drop\{width:88px;height:67px/);assert.match(css,/#arena\{[^}]*overflow:hidden/);assert.match(css,/#supply-status\{[^}]*flex-basis:100%[^}]*overflow-wrap:anywhere/);
 for(const [w,height]of [[1120,650],[740,400],[1120,300]])for(const reduced of [false,true])for(const x of [.4,3.5,6.6])for(let supplier=0;supplier<4;supplier++){
  const t=UI.transform(w,height),g={x,born:6+supplier*6};if(x===3.5){const oldCaptionTop=t.y+143*t.scale,landedCenter=t.y+132*t.scale;assert(landedCenter+33.5>oldCaptionTop,'old caption overlaps a landed GPU; moving it out is required');}
  for(let frame=0;frame<=48;frame++){const f=UI.gpuFlight(g,g.born+frame/60,reduced),r=Math.abs(f.angle)*Math.PI/180,cx=t.x+f.x*t.scale,cy=t.y+f.y*t.scale;
   const halfW=44*Math.cos(r)+33.5*Math.sin(r),halfH=44*Math.sin(r)+33.5*Math.cos(r);assert(Number.isFinite(cx+cy+halfW+halfH));assert(halfW>=44-1e-9);assert(halfH>=33.5-1e-9);assert(f.y<=132+1e-9);assert(f.y>=26-1e-9);const progress=reduced?1:Math.min(1,frame/48);assert(Math.abs(f.angle-(progress===1?0:(1-progress)*-18))<1e-9);
   // Tokens may extend above the board during flight. Arena clips them; header is outside it.
   assert(Math.max(0,cy-halfH)>=0);assert(Math.min(height,cy+halfH)<=height);
  }
 }
});
console.log('Supply feedback suite passed.');
