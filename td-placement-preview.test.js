'use strict';
// Node DOM/canvas contracts, not browser, physical touch, or human-play acceptance.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const E=require('./td-lanes-content'),UI=require('./td-lanes-ui'),R=require('./td-lanes-renderer');
let groups=0;function test(name,fn){fn();console.log('PASS',++groups,name);}
const plain=x=>JSON.parse(JSON.stringify(x));
function context(){
 const calls=[],stack=[];let dash=[],path=[];
 const ctx=new Proxy({lineWidth:9,strokeStyle:'old',fillStyle:'old',
  save(){stack.push([this.lineWidth,this.strokeStyle,this.fillStyle,dash.slice()]);},
  restore(){[this.lineWidth,this.strokeStyle,this.fillStyle,dash]=stack.pop();},
  setLineDash(a){dash=a.slice();},beginPath(){path=[];},moveTo(...a){path.push(['M',...a]);},lineTo(...a){path.push(['L',...a]);},
  stroke(){calls.push({op:'stroke',style:this.strokeStyle,width:this.lineWidth,dash:dash.slice(),path:path.slice()});},
  fillRect(...args){calls.push({op:'fillRect',style:this.fillStyle,args});},
 },{get:(o,k)=>o[k]||((...args)=>calls.push({op:k,args})),set:(o,k,v)=>(o[k]=v,true)});
 return{ctx,calls};
}
function guides(h){return h.calls.filter(c=>c.op==='fillRect'&&c.style==='#b9edff21');}
function nativeHarness({level=0,lang='en',renderer=true}={}){
 const nodes={},events={},captures={},writes=[],storageWrites=[],focusCalls=[],{ctx,calls}=context();let width=1120,height=650,latestState,raf,seen;
 class Node{
  constructor(tag){this.tag=tag;this.children=[];this.attributes={};this.style={};this.hidden=false;this.disabled=false;this._text='';}
  get textContent(){return this._text;}set textContent(v){writes.push([this.tag,'text',v]);this._text=v;}
  getAttribute(k){return this.attributes[k]??null;}setAttribute(k,v){writes.push([this.tag,k,v]);this.attributes[k]=v;}
  appendChild(n){n.parent=this;this.children.push(n);return n;}append(...ns){ns.forEach(n=>this.appendChild(n));}
  replaceChildren(...ns){this.children=[];this.append(...ns);}remove(){this.parent.children=this.parent.children.filter(n=>n!==this);}
  getBoundingClientRect(){return{left:-135,top:70,width,height};}
  getContext(){return ctx;}
  focus(...args){focusCalls.push({node:this,args});if(this.disabled||doc.activeElement===this)return;doc.activeElement?.onblur?.();doc.activeElement=this;this.onfocus?.();}
  blur(){if(doc.activeElement===this){doc.activeElement=null;this.onblur?.();}}
 }
 const html=fs.readFileSync(__dirname+'/index.html','utf8');
 for(const [,id]of html.matchAll(/id="([^"]+)"/g))nodes[id]=new Node(id);
 const doc={hidden:false,activeElement:null,documentElement:{},getElementById:id=>nodes[id],createElement:tag=>new Node(tag),addEventListener:(k,fn,capture)=>{events[k]=fn;captures[k]=capture;}};
 const data=new Map([['campus-defense-stage-v1',JSON.stringify({version:1,lastStage:level,highestStage:5,lang})]]);
 const win={localStorage:{getItem:k=>data.get(k)??null,setItem(k,v){storageWrites.push([k,v]);data.set(k,v);}},devicePixelRatio:1,addEventListener:(k,fn)=>events[k]=fn,requestAnimationFrame:fn=>raf=fn,matchMedia:()=>({matches:false,addEventListener:(k,fn)=>events.motion=fn})};
 const box=vm.createContext({document:doc,window:win,console});
 // Load the production HTML script order. Only capture public engine construction/draw calls.
 for(const [,url]of html.matchAll(/<script src="([^"?]+)[^"]*"><\/script>/g)){
  if(!renderer&&url==='td-lanes-renderer.js')continue;
  if(url==='td-lanes-ui.js'){
   const create=box.TDLanes.create;box.TDLanes.create=(...a)=>(latestState=create(...a));
   if(box.TDLanesRenderer){const draw=box.TDLanesRenderer.draw;box.TDLanesRenderer.draw=(ctx,view,opts)=>{seen={view,opts};draw(ctx,view,opts);};}
  }
  vm.runInContext(fs.readFileSync(__dirname+'/'+url,'utf8'),box,{filename:url});
 }
 return{nodes,events,captures,doc,box,calls,writes,storageWrites,focusCalls,get state(){return latestState;},get seen(){return seen;},
  cell:(r,c)=>nodes.grid.children[r*7+c],
  hover(r,c,type='mouse'){calls.length=0;this.cell(r,c).onpointerenter({pointerType:type,buttons:0});},
  focus(r,c){events.keydown({key:'Tab'});calls.length=0;this.cell(r,c).focus();},
  click(r,c,type='mouse'){const b=this.cell(r,c);events.pointerdown({pointerType:type,target:b});b.focus();calls.length=0;b.onclick();},
  frame(t=0){calls.length=0;raf(t);},resize(w,h){width=w;height=h;calls.length=0;events.resize();},reset(){calls.length=0;writes.length=0;storageWrites.length=0;}
 };
}
test('pure preview matches all 35 real firing origins for each basic guard without buying',()=>{
 for(const type of E.roster)for(let row=0;row<5;row++)for(let col=0;col<7;col++){
  const s=E.create(0),before=plain(s),lane=UI.placementLane(E,s,type,{row,col});assert(lane);assert.deepEqual(s,before);
  const actual=E.create(0);assert(E.deploy(actual,row,col,type).ok);assert.deepEqual(lane,R.forwardLane(actual,actual.units[0].id));
  for(const paused of [false,true]){s.phase='battle';s.paused=paused;assert.deepEqual(UI.placementLane(E,s,type,{row,col}),lane);}
 }
});
test('invalid, occupied (including unremoved dead units), terminal, locked and unaffordable are excluded',()=>{
 const s=E.create(0);for(const cell of [null,{}, {row:-1,col:0},{row:5,col:0},{row:0,col:-1},{row:0,col:7},{row:0.5,col:1},{row:NaN,col:1},{row:0,col:'1'}])assert.equal(UI.placementLane(E,s,'deepseek',cell),null);
 for(const phase of ['won','lost','invalid']){s.phase=phase;assert.equal(UI.placementLane(E,s,'deepseek',{row:0,col:0}),null);}s.phase='prepare';
 assert.equal(UI.placementLane(E,s,'missing',{row:0,col:0}),null);s.unlocked=[];assert.equal(UI.placementLane(E,s,'deepseek',{row:0,col:0}),null);s.unlocked=['deepseek'];
 s.compute=49;assert.equal(UI.placementLane(E,s,'deepseek',{row:0,col:0}),null);s.compute=50;assert(UI.placementLane(E,s,'deepseek',{row:0,col:0}));
 E.deploy(s,0,0,'deepseek');s.compute=180;assert.equal(UI.placementLane(E,s,'deepseek',{row:0,col:0}),null);s.units[0].hp=0;assert.equal(UI.placementLane(E,s,'deepseek',{row:0,col:0}),null);
});
test('pure art and renderer-missing fallback guides match original style, geometry and saved context',()=>{
 for(let row=0;row<5;row++)for(const col of [0,3,6]){
  const s=E.create(),lane=UI.placementLane(E,s,'deepseek',{row,col}),before=plain(s),a=context(),b=context(),c=context();
  R.drawLaneGeometry(a.ctx,lane);UI.drawPlacementLane(b.ctx,lane);E.deploy(s,row,col,'deepseek');R.drawForwardLane(c.ctx,s,s.units[0].id);
  assert.deepEqual(a.calls,b.calls);assert.deepEqual(a.calls,c.calls);assert.equal(a.calls.length,5);
  assert.deepEqual(a.calls[0],{op:'fillRect',style:'#b9edff21',args:[140+lane.start*120,175+row*82,1076-(140+lane.start*120),72]});
  assert.deepEqual(a.calls.slice(1).map(c=>[c.style,c.width,c.dash]),[['#243655b8',4,[7,7]],['#c9efffb8',2,[7,7]],['#243655b8',4,[]],['#c9efffb8',2,[]]]);
  assert.deepEqual([a.ctx.lineWidth,a.ctx.strokeStyle,a.ctx.fillStyle],[9,'old','old']);assert.equal(before.units.length,0);
 }
 for(const draw of [R.drawLaneGeometry,UI.drawPlacementLane]){const a=context();draw(a.ctx,null);assert.equal(a.calls.length,0);}
});
test('production-order pointer preview is one guide behind units, enemies and warnings, never a purchase',()=>{
 const h=nativeHarness();h.click(0,0);const before=plain(h.state),selected=h.seen.view.selectedUnit,goal=h.nodes.goal.textContent,summary=h.nodes['unit-summary'].textContent;h.reset();
 h.hover(4,6);assert.deepEqual(plain(h.state),before);assert.equal(h.seen.view.selectedUnit,selected);assert.equal(guides(h).length,1);assert.equal(guides(h)[0].args[1],503);assert(h.calls.findIndex(c=>c.style==='#b9edff21')<h.calls.findIndex(c=>c.op==='fillText'&&c.args[0]==='DeepSeek'));
 assert.equal(h.nodes.goal.textContent,goal);assert.equal(h.nodes['unit-summary'].textContent,summary);assert.equal(h.storageWrites.length,0);assert.equal(h.writes.length,0);
 h.cell(4,6).onpointerleave();assert.equal(h.seen.view.placementLane,null);assert.equal(h.seen.view.selectedUnit,selected);
 h.hover(0,0);assert.equal(h.seen.view.placementLane,null);h.hover(2,2);h.cell(2,2).onpointercancel();assert.equal(h.seen.view.placementLane,null);
 const src=fs.readFileSync(__dirname+'/td-lanes-renderer.js','utf8').slice(fs.readFileSync(__dirname+'/td-lanes-renderer.js','utf8').indexOf('function draw(ctx,'));
 assert(src.indexOf('if(placementLane)drawLaneGeometry')<src.indexOf('for(const u of s.units)'));assert(src.indexOf('if(placementLane)drawLaneGeometry')<src.indexOf('for(const e of s.enemies)'));assert(src.indexOf('if(placementLane)drawLaneGeometry')<src.indexOf('drawDetours(ctx,s,preview,o.lang)'));
});
test('keyboard, pointer and touch intent do not steal focus or resurrect stale previews',()=>{
 const h=nativeHarness();h.focus(1,1);assert.equal(h.seen.view.placementLane.row,1);assert.equal(h.doc.activeElement,h.cell(1,1));
 h.hover(3,3);assert.equal(h.seen.view.placementLane.row,3);assert.equal(h.doc.activeElement,h.cell(1,1));h.events.keydown({key:'Enter'});assert.equal(h.seen.view.placementLane.row,1,'keyboard activation follows its actual focused target');h.hover(3,3);h.cell(1,1).blur();assert.equal(h.seen.view.placementLane.row,3);
 h.focus(2,2);assert.equal(h.seen.view.placementLane.row,2);h.cell(3,3).onpointerleave();assert.equal(h.seen.view.placementLane.row,2);h.cell(2,2).blur();assert.equal(h.seen.view.placementLane,null);
 h.hover(4,4,'touch');assert.equal(h.seen.view.placementLane,null);h.click(4,4,'touch');assert.equal(h.state.units.length,1);assert.equal(h.state.compute,130);assert.equal(h.seen.view.placementLane,null);assert.equal(h.doc.activeElement,h.cell(4,4));
 h.hover(1,1);h.click(0,0,'touch');assert.equal(h.seen.view.placementLane,null);assert.equal(h.state.units.length,2);
 h.events.pointerdown({pointerType:'mouse'});h.cell(2,2).focus();assert.equal(h.seen.view.placementLane,null,'pointer-caused focus is not keyboard preview');
 h.focus(1,6);assert(h.seen.view.placementLane);h.events.blur();assert.equal(h.seen.view.placementLane,null);
});
test('successful activation spends once and clears preview; invalid buys keep existing errors/refund behavior',()=>{
 const h=nativeHarness();h.focus(0,0);h.cell(0,0).onclick();assert.equal(h.state.compute,130);assert.equal(h.seen.view.placementLane,null);assert.equal(h.doc.activeElement,h.cell(0,0));
 h.cell(0,0).onclick();assert.equal(h.state.compute,130);h.hover(1,1);const selected=h.seen.view.selectedUnit;assert(selected);assert(!h.nodes.refund.disabled);h.nodes.refund.onclick();assert.equal(h.state.compute,180);assert.equal(h.state.units.length,0);
 h.click(0,0);h.click(1,0);h.click(2,0);assert.equal(h.state.compute,30);h.hover(3,0);assert.equal(h.seen.view.placementLane,null);const before=plain(h.state);h.click(3,0);assert.deepEqual(plain(h.state),before);assert.match(h.nodes.goal.textContent,/Not enough GPU/);h.hover(4,0);assert.match(h.nodes.goal.textContent,/Not enough GPU/);assert.equal(h.seen.view.placementLane,null);
 h.state.compute=90;h.frame();assert(h.seen.view.placementLane,'new supply restores stationary pointer preview');h.hover(3,0);assert(h.seen.view.placementLane);h.nodes.cards.children[2].onclick();assert.equal(h.seen.view.placementLane,null,'more expensive guard clears unavailable guide');
 h.state.unlocked=[];h.hover(4,0);assert.equal(h.seen.view.placementLane,null);
 h.state.unlocked=['claude'];h.state.compute=119;h.focus(4,6);assert.equal(h.seen.view.placementLane,null);h.state.compute=120;h.frame();assert(h.seen.view.placementLane,'GPU arrival restores the still-focused available cell');assert.equal(h.doc.activeElement,h.cell(4,6));
 h.state.compute=119;h.frame();assert.equal(h.seen.view.placementLane,null);h.state.compute=120;h.frame();assert(h.seen.view.placementLane);h.cell(4,6).blur();assert.equal(h.seen.view.placementLane,null);h.frame();assert.equal(h.seen.view.placementLane,null);
});
test('Start, stage, retry, terminal, hidden and stale occupancy clear; pause permits paid placement',()=>{
 const h=nativeHarness();h.hover(0,0);h.nodes.start.onclick();assert.equal(h.seen.view.placementLane,null);h.hover(1,1);h.nodes.pause.onclick();assert(h.seen.view.placementLane);assert(h.state.paused);
 const before=plain(h.state);h.frame(0);h.frame(1000);assert.deepEqual(plain(h.state),before);h.click(1,1);assert.equal(h.state.compute,130);assert(h.state.paused);assert.equal(h.seen.view.placementLane,null);assert(!h.nodes.refund.disabled);h.nodes.refund.onclick();assert.equal(h.state.compute,155);assert.equal(h.state.stats.emergencyCount,1);
 h.hover(2,2);h.nodes.retry.onclick();assert.equal(h.seen.view.placementLane,null);assert.equal(h.state.compute,180);assert.equal(h.state.units.length,0);h.hover(0,6);h.nodes['stage-select'].value='1';h.nodes['stage-select'].onchange();assert.equal(h.seen.view.placementLane,null);assert.equal(h.state.level,1);
 h.hover(0,0);h.doc.hidden=true;h.events.visibilitychange();assert.equal(h.seen.view.placementLane,null);h.doc.hidden=false;h.events.visibilitychange();assert.equal(h.seen.view.placementLane,null);
 h.hover(0,0);h.box.TDLanes.deploy(h.state,0,0,'deepseek');h.frame();assert.equal(h.seen.view.placementLane,null);h.state.units=[];h.frame();assert.equal(h.seen.view.placementLane,null,'removal does not revive an old candidate');
 for(const phase of ['lost','won']){h.state.phase='prepare';h.frame();h.hover(4,6);h.state.phase=phase;h.frame();assert.equal(h.seen.view.placementLane,null);h.hover(3,6);assert.equal(h.seen.view.placementLane,null);assert(h.nodes.grid.children.every(b=>b.disabled));}
 h.nodes.start.onclick();assert.equal(h.state.phase,'prepare');assert.equal(h.seen.view.placementLane,null);
});
test('languages, reduced motion, repeated frames and scrolled narrow transforms keep layout/state intact',()=>{
 const h=nativeHarness();h.hover(4,6);const before=plain(h.state);h.nodes.language.onclick();assert.match(h.nodes['fiction-note'].textContent,/悬停或键盘聚焦/);assert.match(h.nodes['fiction-note'].textContent,/立即花费GPU/);assert(h.seen.view.placementLane);h.nodes.language.onclick();assert.match(h.nodes['fiction-note'].textContent,/Hover or keyboard-focus/);assert(!/Hover|悬停/.test(h.nodes['supply-explanation'].textContent),'supply ARIA description stays about supply');
 h.events.motion({matches:true});assert(h.seen.opts.reducedMotion);assert(h.seen.view.placementLane);h.reset();for(let i=0;i<120;i++)h.frame(i*16);assert.equal(h.writes.length,0);assert.equal(h.storageWrites.length,0);assert.deepEqual(plain(h.state),before);
 h.focus(4,6);
 for(const [width,height]of [[740,400],[1120,300],[739.123,401.789]]){h.resize(width,height);const tr=UI.transform(width,height),cell=h.cell(4,6),rect=cell.getBoundingClientRect();assert.equal(parseFloat(cell.style.left),tr.x+860*tr.scale);assert.equal(parseFloat(cell.style.top),tr.y+498*tr.scale);assert.deepEqual(UI.hitCell(rect.left+tr.x+920*tr.scale,rect.top+tr.y+539*tr.scale,rect),{row:4,col:6});assert.equal(guides(h).length,1);assert.deepEqual(h.seen.view.placementLane&&plain(h.seen.view.placementLane),{row:4,start:6.4,end:7.8});}
 const html=fs.readFileSync(__dirname+'/index.html','utf8');assert(!html.includes('placement-preview'));assert.equal(Object.keys(h.nodes).filter(id=>/placement|preview/.test(id)).join(','),'row-preview');
});
test('scroll and resize invalidate pointer-only intent, preserve keyboard focus and re-arm on real movement',()=>{
 const h=nativeHarness();assert.equal(h.captures.scroll,true,'capture observes non-bubbling arena scroll');h.click(0,0);const before=plain(h.state),selected=h.seen.view.selectedUnit,focused=h.doc.activeElement;h.reset();
 h.hover(4,6);h.resize(740,400);assert.equal(h.seen.view.placementLane,null);assert.equal(h.seen.view.selectedUnit,selected);assert.equal(guides(h).length,1);assert.equal(guides(h)[0].args[1],175,'selected guide returns');assert.equal(h.doc.activeElement,focused);
 h.reset();h.events.scroll();assert.equal(h.calls.length,0,'no redraw after pointer already cleared');
 h.cell(2,3).onpointermove({pointerType:'mouse',buttons:0});assert.equal(h.seen.view.placementLane.row,2);assert.equal(h.seen.view.placementLane.start,3.4);assert.equal(h.doc.activeElement,focused);
 h.reset();h.events.scroll();assert.equal(h.seen.view.placementLane,null);assert.equal(guides(h).length,1);assert.equal(guides(h)[0].args[1],175);h.reset();for(let i=0;i<10;i++)h.events.scroll();assert.equal(h.calls.length,0,'repeated scrolling does not redraw a cleared candidate');
 h.cell(3,4).onpointermove({pointerType:'touch',buttons:0});assert.equal(h.seen.view.placementLane,null);assert.equal(h.calls.length,0);
 h.cell(3,4).onpointermove({pointerType:'mouse',buttons:0});assert.equal(h.seen.view.placementLane.row,3);assert.equal(h.seen.view.placementLane.start,4.4);h.reset();h.cell(3,4).onpointermove({pointerType:'mouse',buttons:0});assert.equal(h.calls.length,0,'same-cell movement does not redraw');
 h.focus(1,6);const keyboardFocus=h.doc.activeElement;h.reset();h.events.scroll();assert.equal(h.calls.length,0);assert.equal(h.seen.view.placementLane.row,1);h.resize(1120,300);assert.equal(h.seen.view.placementLane.row,1);assert.equal(h.seen.view.placementLane.start,6.4);assert.equal(h.doc.activeElement,keyboardFocus);
 assert.deepEqual(plain(h.state),before);assert.equal(h.storageWrites.length,0);assert.equal(h.writes.length,0);assert.equal(h.seen.view.selectedUnit,selected);
});
test('art absent or entire renderer absent still draws the prospective guide behind fallback units',()=>{
 for(const renderer of [true,false]){const h=nativeHarness({renderer});h.click(0,0);h.hover(4,6);assert.equal(guides(h).length,1);assert(h.calls.findIndex(c=>c.style==='#b9edff21')<h.calls.findIndex(c=>c.op==='fillText'&&['DeepSeek','DS'].includes(c.args[0])));h.cell(4,6).onpointerleave();h.calls.length=0;h.resize(740,400);assert.equal(guides(h).length,1);h.state.units=[];h.resize(740,400);assert.equal(guides(h).length,0,'stale selected unit has no coverage');}
});
test('preview and no-preview sessions have identical engine events, purchases, RNG, records and outcomes',()=>{
 const a=nativeHarness({level:5}),b=nativeHarness({level:5}),eventsA=[],eventsB=[];
 for(const [h,events]of [[a,eventsA],[b,eventsB]]){const step=h.box.TDLanes.step;h.box.TDLanes.step=(...args)=>{const result=step(...args);events.push(plain(result));return result;};}
 const same=()=>assert.deepEqual(plain(a.state),plain(b.state));
 for(const [r,c]of [[0,0],[2,0],[4,0]]){a.hover(r,c);a.click(r,c);b.click(r,c);same();}
 a.nodes.start.onclick();b.nodes.start.onclick();
 for(let i=0;i<1600;i++){
  if(i%15===0)a.hover(i%5,6);if(i%23===0)a.cell(i%5,6).onpointerleave();
  if(i===100){a.nodes.pause.onclick();b.nodes.pause.onclick();a.hover(1,1);same();a.nodes.pause.onclick();b.nodes.pause.onclick();}
  if(i===200){a.click(1,1);b.click(1,1);}a.frame(i*100);b.frame(i*100);same();if(['won','lost'].includes(a.state.phase))break;
 }
 assert(['won','lost'].includes(a.state.phase));assert.deepEqual(eventsA,eventsB);assert.deepEqual(a.storageWrites,b.storageWrites);assert.equal(a.nodes['review-content'].textContent,b.nodes['review-content'].textContent);
});
// Spatial navigation exercises the real production handler with a focus double.
// Calling onclick below models a separate activation; it is not native-key acceptance.
const arrows=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
function key(h,key,extra={}){let prevented=0;h.events.keydown({key,target:h.doc.activeElement,...extra,preventDefault(){prevented++;}});return prevented;}
function navSnapshot(h){return plain({state:h.state,selected:h.seen.view.selectedUnit,cards:h.nodes.cards.children.map(b=>b.getAttribute('aria-pressed')),goal:h.nodes.goal.textContent,summary:h.nodes['unit-summary'].textContent,description:h.nodes['unit-description'].textContent,storage:h.storageWrites});}
function destination(row,col,key){return [Math.max(0,Math.min(4,row+(key==='ArrowDown'?1:key==='ArrowUp'?-1:0))),Math.max(0,Math.min(6,col+(key==='ArrowRight'?1:key==='ArrowLeft'?-1:0)))];}
function noFocusCalls(h,fn){const count=h.focusCalls.length;fn();assert.equal(h.focusCalls.length,count,'no forced focus across this interruption');}
function finishFrames(h){for(let i=0;i<1800&&h.state.phase==='battle';i++)h.frame(i*100);assert(['won','lost'].includes(h.state.phase));}

test('all 35 cells and four arrows clamp spatially in preparation, battle and paused battle',()=>{
 for(const phase of ['prepare','battle','paused']){
  const h=nativeHarness();if(phase!=='prepare')h.nodes.start.onclick();if(phase==='paused')h.nodes.pause.onclick();
  const cells=h.nodes.grid.children.slice();
  for(let row=0;row<5;row++)for(let col=0;col<7;col++)for(const arrow of arrows){
   h.focus(row,col);h.reset();const before=navSnapshot(h),calls=h.focusCalls.length,[r,c]=destination(row,col,arrow);
   assert.equal(key(h,arrow),1);assert.equal(h.doc.activeElement,h.cell(r,c));assert.deepEqual(navSnapshot(h),before);
   assert.deepEqual(plain(h.seen.view.placementLane),{row:r,start:c+.4,end:7.8});
   assert.equal(h.focusCalls.length-calls,r===row&&c===col?0:1);
   if(r!==row||c!==col)assert.deepEqual(h.focusCalls.at(-1).args,[],'ordinary focus(), without preventScroll');
   assert.equal(h.writes.length,0);assert.equal(h.storageWrites.length,0);
  }
  assert.deepEqual(h.nodes.grid.children,cells,'native row-major button identity/order retained');
  for(const cell of cells){assert.equal(cell.tag,'button');assert.equal(cell.getAttribute('tabindex'),null);assert.equal(cell.tabIndex,undefined);}
 }
});
test('modified or composing arrows do not move, cancel, change input intent or re-arm a preview',()=>{
 for(const phase of ['prepare','battle','paused']){
  const h=nativeHarness();if(phase!=='prepare')h.nodes.start.onclick();if(phase==='paused')h.nodes.pause.onclick();
  h.focus(2,3);h.hover(4,6);const before=navSnapshot(h),lane=plain(h.seen.view.placementLane),focus=h.doc.activeElement;
  for(const arrow of arrows){
   for(let mask=1;mask<16;mask++)noFocusCalls(h,()=>{
    const flags=Object.fromEntries(['altKey','ctrlKey','metaKey','shiftKey'].map((k,i)=>[k,!!(mask&(1<<i))]));
    assert.equal(key(h,arrow,flags),0);assert.equal(h.doc.activeElement,focus);assert.deepEqual(plain(h.seen.view.placementLane),lane);assert.deepEqual(navSnapshot(h),before);
   });
   noFocusCalls(h,()=>{assert.equal(key(h,arrow,{isComposing:true}),0);assert.deepEqual(plain(h.seen.view.placementLane),lane);});
  }
  h.cell(1,1).focus();assert.deepEqual(plain(h.seen.view.placementLane),lane,'ignored arrows did not switch pointer intent');
 }
});
test('unfocused and disabled cells cannot navigate, and other controls keep their own arrows',()=>{
 const h=nativeHarness();
 for(const target of [null,h.nodes.start,h.nodes.language,h.nodes['stage-select'],h.nodes.cards.children[0]]){
  if(target)target.focus();else h.doc.activeElement?.blur();
  const before=navSnapshot(h),focus=h.doc.activeElement;
  for(const arrow of arrows)noFocusCalls(h,()=>{assert.equal(key(h,arrow,{target:h.cell(2,3)}),0);assert.equal(h.doc.activeElement,focus);assert.deepEqual(navSnapshot(h),before);});
 }
 h.focus(2,3);h.cell(2,3).disabled=true;const before=navSnapshot(h);
 for(const arrow of arrows)noFocusCalls(h,()=>{assert.equal(key(h,arrow),0);assert.equal(h.doc.activeElement,h.cell(2,3));assert.deepEqual(navSnapshot(h),before);});
 h.cell(2,3).disabled=false;assert.equal(key(h,'ArrowDown'),1);assert.equal(h.doc.activeElement,h.cell(3,3));
});
test('arrows after pointer intent preview the new focused cell, not the old focus or hover',()=>{
 const h=nativeHarness();h.click(0,0);h.hover(4,6);const before=navSnapshot(h);
 assert.equal(key(h,'ArrowRight'),1);assert.equal(h.doc.activeElement,h.cell(0,1));assert.deepEqual(plain(h.seen.view.placementLane),{row:0,start:1.4,end:7.8});assert.deepEqual(navSnapshot(h),before);
 h.hover(3,4);assert.equal(key(h,'ArrowDown'),1);assert.equal(h.doc.activeElement,h.cell(1,1));assert.deepEqual(plain(h.seen.view.placementLane),{row:1,start:1.4,end:7.8});assert.deepEqual(navSnapshot(h),before);
 h.events.scroll();assert.equal(h.seen.view.placementLane.row,1);h.resize(740,400);assert.equal(h.doc.activeElement,h.cell(1,1));assert.equal(h.seen.view.placementLane.row,1,'logical keyboard preview survives existing resize rule, not a visibility assertion');
 h.click(4,6,'touch');assert.equal(h.state.compute,80);assert.equal(h.seen.view.placementLane,null);assert.equal(h.doc.activeElement,h.cell(4,6),'touch still deploys in one modeled click');
});
test('occupied and unaffordable cells remain reachable without selecting or spending on movement',()=>{
 const h=nativeHarness();h.click(0,0);const first=h.state.units[0].id;h.click(0,2);const second=h.state.units[1].id;h.focus(0,1);const before=navSnapshot(h);
 key(h,'ArrowLeft');assert.equal(h.doc.activeElement,h.cell(0,0));assert.equal(h.seen.view.placementLane,null);assert.equal(h.seen.view.selectedUnit,second);assert.deepEqual(navSnapshot(h),before);
 assert.equal(key(h,'Enter'),0);h.doc.activeElement.onclick();assert.equal(h.seen.view.selectedUnit,first);assert.equal(h.state.compute,80,'only explicit occupied activation selects, without buying');
 key(h,'ArrowRight');assert(h.seen.view.placementLane);h.nodes.cards.children[2].onclick();assert.equal(h.seen.view.placementLane,null);const expensive=navSnapshot(h);
 key(h,'ArrowRight');key(h,'ArrowRight');assert.equal(h.doc.activeElement,h.cell(0,3));assert.equal(h.seen.view.placementLane,null);assert.deepEqual(navSnapshot(h),expensive);assert(!h.doc.activeElement.disabled);
 assert.equal(key(h,' '),0);h.doc.activeElement.onclick();assert.equal(h.state.compute,80);assert.equal(h.state.units.length,2);assert.match(h.nodes.goal.textContent,/Not enough GPU/);
 const failed=navSnapshot(h);key(h,'ArrowDown');assert.deepEqual(navSnapshot(h),failed);assert.equal(h.seen.view.placementLane,null);h.nodes.cards.children[0].onclick();assert.equal(h.seen.view.placementLane.row,1);assert.equal(h.state.compute,80);
});
test('Tab, Shift+Tab, Enter, Space and unsupported keys remain uncanceled and untrapped',()=>{
 const h=nativeHarness();h.focus(2,3);
 for(const k of ['Tab','Enter',' ','Home','End','Escape','1'])for(const extra of [{},{shiftKey:true},{repeat:true}]){
  const before=navSnapshot(h),focused=h.doc.activeElement;noFocusCalls(h,()=>{assert.equal(key(h,k,extra),0);assert.equal(h.doc.activeElement,focused);assert.deepEqual(navSnapshot(h),before);});
 }
 assert.equal(key(h,'Tab'),0);h.cell(2,4).focus();assert.equal(h.doc.activeElement,h.cell(2,4),'model the ordinary next button, not a custom Tab handler');
 assert.equal(key(h,'Tab',{shiftKey:true}),0);h.cell(2,3).focus();assert.equal(h.doc.activeElement,h.cell(2,3));
 for(const k of ['Enter',' ']){assert.equal(key(h,k),0);h.doc.activeElement.onclick();assert.equal(h.state.compute,130);assert.equal(h.state.units.length,1);}
});
test('four Downs replace 28 modeled Tabs for the same three explicit DS purchases and 150 GPU',()=>{
 const a=nativeHarness(),b=nativeHarness();a.focus(0,0);b.focus(0,0);let downs=0,tabs=0;
 for(let purchase=0;purchase<3;purchase++){
  assert.equal(a.doc.activeElement,a.cell(purchase*2,0));assert.equal(b.doc.activeElement,b.cell(purchase*2,0));
  for(const h of [a,b]){assert.equal(key(h,'Enter'),0);h.doc.activeElement.onclick();}
  assert.deepEqual(navSnapshot(a),navSnapshot(b));
  if(purchase<2){
   const before=navSnapshot(a);for(let i=0;i<2;i++){assert.equal(key(a,'ArrowDown'),1);downs++;}
   for(let i=0;i<14;i++){assert.equal(key(b,'Tab'),0);b.nodes.grid.children[b.nodes.grid.children.indexOf(b.doc.activeElement)+1].focus();tabs++;}
   assert.deepEqual(navSnapshot(a),before);assert.deepEqual(navSnapshot(a),navSnapshot(b));
  }
 }
 assert.equal(downs,4);assert.equal(tabs,28);assert.equal(a.state.compute,30);assert.deepEqual(plain(a.state.units).map(u=>[u.row,u.col,u.type]),[[0,0,'deepseek'],[2,0,'deepseek'],[4,0,'deepseek']]);
 // This counts input opportunities only, not measured speed or native activation.
});
test('repeated arrows never buy, paused explicit activation still pays, and Retry restores the snapshot',()=>{
 const h=nativeHarness();h.click(0,0);h.nodes.start.onclick();const prep=plain(h.state.snapshot);h.nodes.pause.onclick();h.focus(1,0);const before=navSnapshot(h);
 for(let i=0;i<100;i++)assert.equal(key(h,i%2?'ArrowUp':'ArrowDown',{repeat:true}),1);
 assert.equal(h.doc.activeElement,h.cell(1,0));assert.deepEqual(navSnapshot(h),before);assert.equal(h.state.time,0);h.frame(0);h.frame(1000);assert.deepEqual(navSnapshot(h),before);
 assert.equal(key(h,' '),0);h.doc.activeElement.onclick();assert.equal(h.state.compute,80);assert.equal(h.state.units.length,2);assert(h.state.paused);assert.equal(h.state.time,0);assert.equal(h.seen.view.placementLane,null);
 for(let i=0;i<10;i++)key(h,'ArrowLeft',{repeat:true});assert.equal(h.state.compute,80);assert.equal(h.seen.view.placementLane,null);
 h.nodes.cards.children[2].onclick();key(h,'ArrowRight');const failed=plain(h.state);h.doc.activeElement.onclick();assert.deepEqual(plain(h.state),failed);assert.match(h.nodes.goal.textContent,/Not enough GPU/);
 noFocusCalls(h,()=>h.nodes.retry.onclick());assert.deepEqual(plain(h.state),prep);assert.equal(h.seen.view.placementLane,null);assert.equal(h.doc.activeElement,h.cell(1,1),'the double retains focus; app did not force it');
});
test('Start, stage, visibility, blur, natural terminal, Retry and Next do not retain focus by force or revive previews',()=>{
 const h=nativeHarness();h.focus(1,1);key(h,'ArrowDown');noFocusCalls(h,()=>h.nodes.start.onclick());assert.equal(h.seen.view.placementLane,null);
 key(h,'ArrowRight');assert(h.seen.view.placementLane);noFocusCalls(h,()=>{h.doc.hidden=true;h.events.visibilitychange();});assert(h.state.paused);assert.equal(h.seen.view.placementLane,null);
 const hidden=navSnapshot(h);for(const arrow of arrows)noFocusCalls(h,()=>assert.equal(key(h,arrow),0));assert.deepEqual(navSnapshot(h),hidden);assert.equal(h.seen.view.placementLane,null);
 noFocusCalls(h,()=>{h.doc.hidden=false;h.events.visibilitychange();});assert(h.state.paused);assert.equal(h.seen.view.placementLane,null);
 key(h,'ArrowRight');assert(h.seen.view.placementLane);noFocusCalls(h,()=>h.events.blur());assert.equal(h.seen.view.placementLane,null);
 key(h,'ArrowDown');noFocusCalls(h,()=>h.nodes.retry.onclick());assert.equal(h.seen.view.placementLane,null);key(h,'ArrowLeft');
 noFocusCalls(h,()=>{h.nodes['stage-select'].value='3';h.nodes['stage-select'].onchange();});assert.equal(h.state.level,3);assert.equal(h.seen.view.placementLane,null);
 for(const win of [false,true]){
  const t=nativeHarness({level:3});if(win){t.click(1,0);t.click(2,0);}t.nodes.start.onclick();t.focus(4,6);const count=t.focusCalls.length;finishFrames(t);assert.equal(t.state.phase,win?'won':'lost');assert.equal(t.focusCalls.length,count);assert.equal(t.seen.view.placementLane,null);assert(t.nodes.grid.children.every(b=>b.disabled));
  const terminal=navSnapshot(t);for(const arrow of arrows)noFocusCalls(t,()=>assert.equal(key(t,arrow),0));assert.deepEqual(navSnapshot(t),terminal);
  t.doc.activeElement.disabled=false;assert.equal(key(t,'ArrowLeft'),0,'phase guard also rejects stale enabled cells');t.doc.activeElement.disabled=true;
  t.doc.activeElement.blur();noFocusCalls(t,()=>{if(win)t.nodes.start.onclick();else t.nodes.retry.onclick();});assert.equal(t.doc.activeElement,null);assert.equal(t.state.phase,'prepare');assert.equal(t.state.level,win?4:3);assert.equal(t.seen.view.placementLane,null);assert(t.nodes.grid.children.every(b=>!b.disabled));
 }
});
test('renderer-absent navigation keeps fallback geometry and selected-guide rules without engine writes',()=>{
 const h=nativeHarness({renderer:false});h.click(0,0);h.focus(2,3);h.reset();const before=plain(h.state),storage=plain(h.storageWrites);
 key(h,'ArrowRight');assert.equal(h.doc.activeElement,h.cell(2,4));assert.deepEqual(plain(h.state),before);assert.deepEqual(h.storageWrites,storage);
 assert.deepEqual(guides(h).at(-1).args,[668,339,408,72]);
 h.focus(0,1);h.reset();key(h,'ArrowLeft');assert.equal(h.doc.activeElement,h.cell(0,0));assert.deepEqual(plain(h.state),before);assert.deepEqual(guides(h).at(-1).args,[188,175,888,72],'occupied destination keeps the ordinary selected guard guide');
});
test('locales and all guard cards retain selected cost and rightward geometry without movement purchases',()=>{
 for(const lang of ['zh','en'])for(let card=0;card<4;card++){
  const h=nativeHarness({lang});h.nodes.cards.children[card].onclick();h.focus(2,2);const before=navSnapshot(h);
  key(h,'ArrowRight');assert.deepEqual(navSnapshot(h),before);assert.deepEqual(plain(h.seen.view.placementLane),{row:2,start:3.4,end:7.8});assert.equal(h.doc.activeElement,h.cell(2,3));
  const focused=h.doc.activeElement;noFocusCalls(h,()=>h.nodes.language.onclick());assert.equal(h.doc.activeElement,focused);assert.deepEqual(plain(h.seen.view.placementLane),{row:2,start:3.4,end:7.8});
  h.doc.activeElement.onclick();assert.equal(h.state.compute,180-E.definitions.units[E.roster[card]].cost);assert.equal(h.state.units[0].type,E.roster[card]);assert.equal(h.seen.view.placementLane,null);
 }
});
test('navigation and baseline action sequences preserve actual events, RNG, resources and saved histories',()=>{
 for(const win of [false,true]){
  const a=nativeHarness({level:3}),b=nativeHarness({level:3}),traces=[[],[]];
  [a,b].forEach((h,i)=>{const step=h.box.TDLanes.step;h.box.TDLanes.step=(...args)=>{const events=step(...args);traces[i].push(plain(events));return events;};});
  const same=()=>{assert.deepEqual(navSnapshot(a),navSnapshot(b));assert.equal(a.nodes['review-content'].textContent,b.nodes['review-content'].textContent);assert.equal(a.nodes['previous-stage-result'].textContent,b.nodes['previous-stage-result'].textContent);};
  if(win)for(const row of [1,2]){a.focus(row-1,0);key(a,'ArrowDown');b.focus(row,0);a.doc.activeElement.onclick();b.doc.activeElement.onclick();same();}
  for(let attempt=0;attempt<2;attempt++){
   for(const h of [a,b])h.nodes.start.onclick();a.focus(4,3);same();
   for(let i=0;i<1800&&a.state.phase==='battle';i++){
    if(i%17===0)key(a,i%34?'ArrowRight':'ArrowLeft',{repeat:true});
    if(i===30){for(const h of [a,b])h.nodes.pause.onclick();key(a,'ArrowUp');same();for(const h of [a,b]){h.nodes.language.onclick();h.doc.hidden=true;h.events.visibilitychange();h.doc.hidden=false;h.events.visibilitychange();h.nodes.pause.onclick();}}
    a.frame(i*100);b.frame(i*100);same();
   }
   assert.equal(a.state.phase,win?'won':'lost');assert(a.storageWrites.some(([k])=>k.startsWith(a.box.TDReplayStore.PREFIX)));assert.deepEqual(traces[0],traces[1]);
   if(attempt===0){a.nodes.retry.onclick();b.nodes.retry.onclick();same();assert.equal(a.seen.view.placementLane,null);}
  }
  if(win){a.nodes.start.onclick();b.nodes.start.onclick();same();assert.equal(a.state.level,4);assert.equal(a.seen.view.placementLane,null);}
 }
});

delete global.TDLanesRenderer;
console.log(groups+' placement-preview contract groups passed; no browser/device acceptance.');
