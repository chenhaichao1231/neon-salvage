/* Run the real simulation with a minimal DOM adapter, not a substitute browser. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const events={};let reloaded=false;const nodes=new Map();const node=()=>({style:{},hidden:false,_html:'',get innerHTML(){return this._html;},set innerHTML(v){this._html=v;this.buttons={};},textContent:'',querySelectorAll(selector){const key=selector.slice(6,-1);return this.buttons?.[key]||(this.buttons={...this.buttons,[key]:[...this.innerHTML.matchAll(new RegExp('data-'+key+'="([^"]+)"','g'))].map(m=>({dataset:{[key.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]:m[1]}}))})[key];},addEventListener(type,fn){(this.events||={})[type]=fn;},setPointerCapture(){},getContext(){return new Proxy({},{get:()=>()=>{}});}});
const doc={querySelector(s){if(!nodes.has(s))nodes.set(s,node());return nodes.get(s);},addEventListener(){},hidden:false};
const sandbox={document:doc,innerWidth:1280,innerHeight:720,devicePixelRatio:1,performance:{now:()=>0},localStorage:{getItem:()=>null,setItem(){}},location:{hash:'',reload(){reloaded=true;}},addEventListener(type,fn){events[type]=fn;},requestAnimationFrame(){},Math,Date,Set,console};sandbox.globalThis=sandbox;
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(__dirname+'/engine.js','utf8'),sandbox);
for(const file of ['cargo','rivals','stations','campaign','rigs','dock','signal'])vm.runInContext(fs.readFileSync(__dirname+'/'+file+'.js','utf8'),sandbox);
let src=fs.readFileSync(__dirname+'/game.js','utf8').replace('menu();requestAnimationFrame(frame);','globalThis.testApi={signalPanel,getSignalState,replaceSignalState,dockChoice,getDockState,replaceDockState,launchDock,storyStation,getCampaignState,replaceCampaignState,activateRig,updateShelter,currentBackup,cargoAction,cargoExit,start,update,pause,dash,end,menu,garage,getRun:()=>run,getState:()=>state,setState:v=>state=v,getSave:()=>save,spawn,routes,upgrades,draw,help,getReduced:()=>reducedMotion,upgradePreview,choose,moveDir,getHistory:()=>history,relics,chooseRelic,attackAngles,anomalyChoice,extraction};menu();');vm.runInContext(src,sandbox);

const api=sandbox.testApi,C=sandbox.Cargo,S=sandbox.Signal,R=sandbox.Rivals;
const writes=[];sandbox.localStorage.setItem=(key,value)=>writes.push({key,value});
function launch(){api.start(false,null,'cargo');const r=api.getRun();r.spawn=999;r.fire=999;r.bossAt=999;r.rival.status='dead';r.enemies=[];r.shots=[];r.cargo.items=[];return r;}
function feed(r,index=0){const relay=r.signal.relays[index];r.p.x=relay.x;r.p.y=relay.y;const item=C.add(r.cargo,relay.x,relay.y,1);r.cargo.heldId=item.id;api.signalPanel();doc.querySelector('#signal-feed').onclick();return item;}
function close(){doc.querySelector('#signal-close').onclick();}
let r=launch();assert.equal(r.signal.relays.length,3);const relay=r.signal.relays[0];let item=feed(r);assert.equal(r.signal.relays[0].charge,18);assert.equal(r.cargo.heldId,null);assert.ok(!r.cargo.items.includes(item));assert.equal(r.cargo.banked,0);doc.querySelector('#signal-feed').onclick();assert.equal(relay.charge,18);doc.querySelector('#signal-jam').onclick();assert.equal(relay.mode,'jam');assert.equal(relay.tuneReady,5);doc.querySelector('#signal-gather').onclick();assert.equal(relay.mode,'jam');close();
// Normal rival acquisition and revalidation are both denied by live Jam.
r.rival=R.create({x:relay.x+150,y:relay.y});item=C.add(r.cargo,relay.x+100,relay.y,3);r.p.x=900;r.p.y=900;api.update(.01);assert.equal(r.rival.targetId,null);relay.charge=0;api.update(.01);assert.equal(r.rival.targetId,item.id);relay.charge=10;api.update(.01);assert.equal(r.rival.targetId,null);assert.ok(r.cargo.items.includes(item));assert.equal(item.owner,undefined);
// Jamming cannot confiscate a cargo item already held by the rival.
item.owner='rival:1';r.rival.heldId=item.id;r.rival.targetId=item.id;api.update(.01);assert.equal(r.rival.heldId,item.id);assert.equal(item.owner,'rival:1');
// Gather moves original cargo through real Cargo physics and steers ordinary enemies.
r=launch();feed(r);close();const a=r.signal.relays[0];item=C.add(r.cargo,a.x+150,a.y,1);const id=item.id,count=r.cargo.items.length;r.p.x=900;r.p.y=900;const enemy={type:'chaser',x:a.x+150,y:a.y,hp:100,maxHp:100,radius:12,speed:50,shot:9,hit:0};r.enemies=[enemy];api.update(.1);assert.ok(item.x<a.x+150);assert.equal(item.id,id);assert.equal(r.cargo.items.length,count);assert.ok(enemy.x<a.x+150);assert.equal(a.hp,undefined);
// Shooter aims at relay, not distant pilot. Boss ignores broadcast.
r.enemies=[{type:'shooter',x:a.x+330,y:a.y,hp:100,maxHp:100,radius:12,speed:0,shot:0,hit:0}];api.update(.01);assert.ok(r.shots[0].vx<0);assert.ok(Math.abs(r.shots[0].vy)<1e-6);
// Parallel independent mode and preserved no-friendly-fire contract.
feed(r,1);doc.querySelector('#signal-jam').onclick();close();assert.equal(r.signal.relays[0].mode,'gather');assert.equal(r.signal.relays[1].mode,'jam');assert.ok(r.signal.relays[0].charge>0);assert.ok(r.signal.relays[1].charge>0);
r.enemies=[];r.p.x=800;r.p.y=800;item=C.add(r.cargo,0,0,1);const hp=item.hp;r.shots=[{x:-50,y:0,vx:1000,vy:0,life:2,damage:99,pierce:0,hits:new Set(),enemy:false}];api.update(.1);assert.equal(item.hp,hp);
// Failure does not unlock; ignored successful run does not unlock.
api.end(false);assert.equal(api.getSignalState().engineeringUnlocked,false);r=launch();api.end(true);assert.equal(api.getSignalState().engineeringUnlocked,false);
// Actual extraction UI unlocks once after use; old wallet/campaign stay separate.
r=launch();feed(r);close();r.p.x=0;r.p.y=0;const before=writes.filter(w=>w.key==='neon_salvage_signal').length;api.cargoExit();assert.equal(api.getState(),'cargo-exit');doc.querySelector('#cargo-confirm').onclick();assert.equal(api.getSignalState().engineeringUnlocked,true);assert.equal(writes.filter(w=>w.key==='neon_salvage_signal').length,before+1);api.end(true);assert.equal(writes.filter(w=>w.key==='neon_salvage_signal').length,before+1);
api.storyStation();doc.querySelector('#overlay').querySelectorAll('[data-signal-layout]').find(b=>b.dataset.signalLayout==='west').onclick();assert.equal(api.getSignalState().placement,'west');r=launch();assert.equal(r.signal.relays[0].x,-470);assert.equal(r.signal.relays[0].charge,0);assert.equal(r.signal.relays[1].x,360);
// Format4 strict restore and legacy format3 must preserve current broadcast progress.
const text=api.currentBackup();assert.equal(JSON.parse(text).format,4);api.garage();doc.querySelector('#saves').onclick();const field=doc.querySelector('#save-json');field.value=sandbox.Salvage.encodeBundle(api.getSave(),api.getCampaignState(),sandbox.Campaign.validate,api.getDockState(),sandbox.Dock.validate);doc.querySelector('#preview-save').onclick();doc.querySelector('#apply-save').onclick();assert.equal(api.getSignalState().placement,'west');const bad=JSON.parse(text);bad.signal.placement='north';field.value=JSON.stringify(bad);doc.querySelector('#preview-save').onclick();assert.equal(doc.querySelector('#apply-save').disabled,true);assert.equal(api.getSignalState().placement,'west');api.draw();
console.log('Signal integration passed: real feed/forces/AI, Jam acquisition and pursuit filtering, rival ownership, parallel modes, no friendly fire, real extraction unlock, next-run layout, and format4/legacy restore.');
// Forty seconds of real shooter steering: range arrival releases lure, not 40s of camping.
r=launch();const lure=r.signal.relays[0];lure.charge=60;r.p.x=900;r.p.y=900;r.p.hp=r.p.maxHp=10000;r.next=Infinity;const shooter={type:'shooter',x:lure.x+330,y:lure.y,hp:100,maxHp:100,radius:12,speed:45,shot:999,hit:0};r.enemies=[shooter];let releasedAt=null,immuneFrames=0;for(let i=0;i<400;i++){api.update(.1);const lock=r.signal.lureLocks.get(shooter);if(lock?.until>r.signal.time){immuneFrames++;if(releasedAt===null)releasedAt=r.time;}}assert.ok(releasedAt<2);assert.ok(immuneFrames>=75);assert.ok(lure.charge>19);assert.ok(shooter.y>lure.y+150);console.log('Shooter range regression passed: real 40s simulation releases lure promptly and resumes player pursuit.');
// Preview is shown before spending, in both languages, and reflects the same live entities.
r=launch();const previewRelay=r.signal.relays[0];r.p.x=previewRelay.x;r.p.y=previewRelay.y;const freeItem=C.add(r.cargo,previewRelay.x+120,previewRelay.y,3);freeItem.hp=45;const heldFuel=C.add(r.cargo,previewRelay.x,previewRelay.y,1);r.cargo.heldId=heldFuel.id;r.rival=R.create({x:500,y:500});r.rival.targetId=freeItem.id;const beforePreview=JSON.stringify(r.cargo);api.signalPanel();let markup=doc.querySelector('#overlay').innerHTML;assert.match(markup,/signal-preview/);assert.match(markup,/1 件自由残骸，剩余货值 18.0/);assert.match(markup,/当前追逐目标在屏蔽范围内/);assert.match(markup,/不保证收益或拦截/);assert.equal(JSON.stringify(r.cargo),beforePreview);assert.equal(previewRelay.charge,0);close();sandbox.neonEnglish=true;api.signalPanel();markup=doc.querySelector('#overlay').innerHTML;assert.match(markup,/1 free wrecks, remaining value 18.0/);assert.match(markup,/Not a promise of earnings or interception/);assert.equal(JSON.stringify(r.cargo),beforePreview);close();sandbox.neonEnglish=false;console.log('Relay preview UI passed: before-spend live snapshot, bilingual, ownership-preserving and no guaranteed returns.');
// Relay panel hierarchy: spend/preview/actions stay visible; full rules begin collapsed.
for(const en of [false,true]){
  sandbox.neonEnglish=en;r=launch();const relay=r.signal.relays[0];r.p.x=relay.x;r.p.y=relay.y;
  const cargo=C.add(r.cargo,relay.x,relay.y,2);r.cargo.heldId=cargo.id;
  const before=JSON.stringify(r.cargo);api.signalPanel();const html=doc.querySelector('#overlay').innerHTML;
  assert.match(html,/<section class="panel signal-panel"/);assert.match(html,/<details class="signal-explainer">/);
  assert.ok(!/<details[^>]*\sopen(?:\s|>)/.test(html));
  assert.equal((html.match(/id="signal-close"/g)||[]).length,1);
  assert.ok(html.indexOf('id="signal-close"')<html.indexOf('signal-cost'));
  assert.ok(html.indexOf('id="signal-feed"')<html.indexOf('signal-explainer'));
  assert.ok(html.indexOf('id="signal-preview"')<html.indexOf('signal-explainer'));
  assert.ok(html.indexOf('id="signal-jam"')<html.indexOf('signal-explainer'));
  const visible=html.slice(0,html.indexOf('<details'));
  assert.ok(visible.includes(en?'Consumes the whole held wreck':'消耗整件拖载残骸'));
  assert.ok(visible.includes(en?'Gather also lures raiders':'聚拢也会引来敌人'));
  assert.ok(visible.includes(en?'Jam cannot reclaim held cargo':'屏蔽不能夺回已持货物'));
  assert.ok(html.includes(en?'How it works':'工作原理'));assert.equal(JSON.stringify(r.cargo),before);close();
}
sandbox.neonEnglish=false;
console.log('Relay hierarchy passed: bilingual collapsed rules, visible irreversible cost and risks, preview before details, reachable close/action order, no state mutation.');
