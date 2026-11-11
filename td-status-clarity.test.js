'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const E=require('./td-lanes-content'),UI=require('./td-lanes-ui'),R=require('./td-lanes-renderer'),{capture,copy}=require('./qa/status-clarity-fixtures');
let groups=0;const test=(name,fn)=>{fn();console.log('PASS',++groups,name);};
const freeze=o=>{if(o&&typeof o==='object'){Object.freeze(o);Object.values(o).forEach(freeze);}return o;};
const probe=()=>{const texts=[],calls=[],ctx=new Proxy({fillText:(...a)=>{texts.push(a[0]);calls.push(['fillText',...a]);}},{get:(o,k)=>o[k]||((...a)=>calls.push([k,...a])),set:(o,k,v)=>(o[k]=v,true)});return{ctx,texts,calls};};
const standalone={};Object.defineProperty(standalone,'localStorage',{get(){throw Error('Renderer accessed storage');}});vm.runInNewContext(fs.readFileSync(__dirname+'/td-lanes-renderer.js','utf8'),standalone);const S=standalone.TDLanesRenderer;
const captures=capture(E),states=captures.states;
function draw(renderer,s,lang,selectedUnit,extra={}){const p=probe();renderer.draw(p.ctx,{state:s,definitions:E.definitions,preview:E.preview(6),selectedUnit,...extra},{width:740,height:400,lang,visualTime:s.time,reducedMotion:false,effects:[]});return p;}
test('raw bilingual status is complete; only ordinary unselected Grok next1-3 captions are hidden',()=>{
 for(const type of E.roster)for(const fired of [0,1,2,3,4,5,6,7,8])for(const status of ['normal','rice','weak','review'])for(const warning of [null,{status:'rice',startsIn:1.2},{status:'weak',startsIn:1.2},{status:'review',startsIn:1.2}])for(const lang of ['zh','en'])for(const selected of [null,'other','g']){
  const u=freeze({id:'g',type,fired,status,statusRemaining:1.2,warning,hp:10}),full=UI.unitStatus(u,lang),hidden=type==='grok'&&status==='normal'&&!warning&&fired%4!==3&&selected!=='g';
  assert.equal(R.guardStatus(u,lang),full);assert.equal(S.guardStatus(u,lang),full);
  assert.equal(UI.canvasUnitStatus(u,lang,selected),hidden?'':full);assert.equal(R.guardCaption(u,lang,selected),hidden?'':full);assert.equal(S.guardCaption(u,lang,selected),hidden?'':full);
  if(type==='grok'&&status==='normal'&&!warning)assert(full.includes((fired%4+1)+'/4'));
 }
});
test('legal Main5 captures draw all four next counters, both selections/languages and every fallback truthfully',()=>{
 for(const name of ['next1','next2','next3','next4','fourth-release','paused','won','lost'])for(const lang of ['zh','en'])for(const selection of [false,true]){
  const s=freeze(copy(states[name].state)),g=s.units.find(u=>u.type==='grok'),selected=selection?g.id:null,full=UI.unitStatus(g,lang),want=selection||g.fired%4===3;
  for(const renderer of [R,S]){const p=draw(renderer,s,lang,selected);assert.equal(p.texts.includes(full),want,name);assert(p.texts.includes('Grok'),'named no-art fallback');}
  const p=probe();UI.fallback(p.ctx,s,E,lang,{selectedUnit:selected});assert.equal(p.texts.includes(full),want,name);assert(p.texts.includes('Grok'));
  if(name==='fourth-release'){assert.equal(g.fired,4);assert(full.includes('1/4'));assert.equal(R.specialistFrame(g,s,s.time,false,1.8).index,7);assert.equal(S.specialistFrame(g,s,s.time,false,1.8).index,7);assert(s.shots.some(sh=>sh.type==='grok'&&sh.quality==='weak'));assert(p.texts.includes('4'),'committed weak projectile remains visible');assert(draw(R,s,lang,selected).texts.includes('4'));}
 }
});
test('real pending/active rice, GPT weak and review cues remain global; low-health drawing is unchanged',()=>{
 for(const type of ['deepseek','gpt','claude'])for(const kind of ['warning','active'])for(const lang of ['zh','en']){
  const s=freeze(copy(states[type+'-'+kind].state)),u=s.units[0],full=UI.unitStatus(u,lang);assert(full);
  for(const renderer of [R,S])assert(draw(renderer,s,lang,null).texts.includes(full));const p=probe();UI.fallback(p.ctx,s,E,lang);assert(p.texts.includes(full));
 }
 for(const fired of [0,1,2,3,4]){
  const s=copy(states.next1.state);s.units=s.units.filter(u=>u.type==='grok');s.units[0].hp=10;s.units[0].fired=fired;freeze(s);
  for(const renderer of [R,S]){const a=draw(renderer,s,'en',null),b=draw(renderer,s,'en',s.units[0].id);assert.deepEqual(a.calls.filter(c=>c[0]==='fillRect'&&c[4]!==72),b.calls.filter(c=>c[0]==='fillRect'&&c[4]!==72));assert(a.calls.some(c=>c[0]==='fillRect'&&c[3]===3&&c[4]===7),'geometric low-health exclamation');}
  const p=probe();UI.fallback(p.ctx,s,E,'en');assert(p.calls.some(c=>c[0]==='fillRect'&&c[3]===3&&c[4]===7));
 }
});
test('actual mounted selection restores every counter and full detail without deployment, events or storage writes',()=>{
 const source=fs.readFileSync(__dirname+'/td-lanes-dom-writes.test.js','utf8').split('function count(h)')[0],harness=Function('require','__dirname',source+'\nreturn harness;')(require,__dirname);
 for(const lang of ['en','zh']){
  const h=harness(6,UI),c=h.app.controller;h.nodes.cards.children[3].onclick();h.nodes.grid.children[21].onclick();h.nodes.start.onclick();if(c.lang!==lang)h.nodes.language.onclick();const g=c.state.units[0];let writes=0;h.win.localStorage.setItem=()=>writes++;
  for(const fired of [0,1,2,3,4]){
   if(c.state.paused)c.pause();while(g.fired<fired&&c.state.phase==='battle')c.tick(1/60);assert.equal(g.fired,fired);assert(c.pause().ok);h.app.render();
   const before=JSON.stringify(c.state),facts=JSON.stringify(c.review),full=UI.unitStatus(g,lang);
   h.nodes.cards.children[0].onclick();assert.equal(c.selectedUnit,null);assert.equal(h.nodes['selected-unit'].hidden,true);assert(h.nodes.grid.children[21].getAttribute('aria-label').includes(full));assert.equal(draw(R,c.state,lang,null).texts.includes(full),fired%4===3);
   h.nodes.grid.children[21].onclick();assert.equal(c.selectedUnit,g.id);assert(h.nodes['unit-summary'].textContent.includes(full));assert.equal(h.nodes.grid.children[21].getAttribute('aria-pressed'),'true');assert(draw(R,c.state,lang,c.selectedUnit).texts.includes(full));
   for(let i=0;i<20;i++){h.app.render();h.app.frame(i*16);}assert.equal(JSON.stringify(c.state),before);assert.equal(JSON.stringify(c.review),facts);assert.equal(writes,0);assert.equal(c.state.units.length,1);assert.deepEqual(c.tick(1),[]);
   delete global.TDLanesRenderer;h.app.render();assert(h.nodes['unit-summary'].textContent.includes(full));assert(h.nodes.grid.children[21].getAttribute('aria-label').includes(full));assert.equal(JSON.stringify(c.state),before);assert.equal(writes,0);
  }
 }
 global.TDLanesRenderer=R;
});
test('all guard art, full status and low-health envelopes remain reserved; selection cannot relocate pack cues',()=>{
 const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
 for(const {state:s}of Object.values(states))for(const lang of ['zh','en'])for(const [width,height]of [[740,400],[1120,650],[1136,414]]){
  const base=R.packCueLayout(s,lang,{width,height,preview:E.preview(6)});
  for(const selectedUnit of [null,...s.units.map(u=>u.id)])assert.deepEqual(R.packCueLayout(s,lang,{width,height,preview:E.preview(6),selectedUnit}),base);
  for(const cue of base)for(const u of s.units.filter(u=>u.hp>0)){
   const x=140+u.x*120,y=211+u.row*82;assert(!overlaps(cue,{x:x-51,y:y-70,w:102,h:110}));
   if(R.guardStatus(u,lang))assert(!overlaps(cue,{x:x-(u.type==='grok'?82:66),y:y-76,w:u.type==='grok'?164:132,h:21}));
  }
 }
});
test('selected range and affordable placement previews keep their existing precedence',()=>{
 const s=freeze(copy(states['mixed-46'].state)),g=s.units.find(u=>u.type==='grok'),lane=UI.placementLane(E,s,'deepseek',{row:3,col:2});assert(lane);
 const selected=draw(R,s,'en',g.id),preview=draw(R,s,'en',g.id,{placementLane:lane});assert(selected.calls.some(c=>c[0]==='fillRect'&&c[1]===140+(g.x-.1)*120));assert(preview.calls.some(c=>c[0]==='fillRect'&&c[1]===140+lane.start*120));
 const p=probe();UI.fallback(p.ctx,s,E,'en',{selectedUnit:g.id,placementLane:lane});assert(p.calls.some(c=>c[0]==='fillRect'&&c[1]===140+lane.start*120));
});
test('rendering throughout a complete legal Main5 replay preserves every state, event, RNG and outcome',()=>{
 let ticks=0,draws=0;const rendered=capture(E,(s,events)=>{
  ticks++;if(ticks%30)return;const before=JSON.stringify({s,events}),frozen=freeze(copy(s));
  for(const lang of ['zh','en'])for(const selected of [null,s.units.find(u=>u.type==='grok')?.id]){draw(S,frozen,lang,selected);draws++;const p=probe();UI.fallback(p.ctx,frozen,E,lang,{selectedUnit:selected});}
  assert.equal(JSON.stringify({s,events}),before);
 });assert.equal(ticks,5260);assert(draws>600);assert.deepEqual(rendered,captures);
});
console.log(groups+' guard-status presentation groups passed. Local fixtures only, not browser/device acceptance.');
