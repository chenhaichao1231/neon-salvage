/* Run the real simulation with a minimal DOM adapter, not a substitute browser. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const events={};let reloaded=false;const nodes=new Map();const node=()=>({style:{},hidden:false,_html:'',get innerHTML(){return this._html;},set innerHTML(v){this._html=v;this.buttons={};},textContent:'',querySelectorAll(selector){const key=selector.slice(6,-1);return this.buttons?.[key]||(this.buttons={...this.buttons,[key]:[...this.innerHTML.matchAll(new RegExp('data-'+key+'="([^"]+)"','g'))].map(m=>({dataset:{[key]:m[1]}}))})[key];},addEventListener(type,fn){(this.events||={})[type]=fn;},setPointerCapture(){},getContext(){return new Proxy({},{get:()=>()=>{}});}});
const doc={querySelector(s){if(!nodes.has(s))nodes.set(s,node());return nodes.get(s);},addEventListener(){},hidden:false};
const sandbox={document:doc,innerWidth:1280,innerHeight:720,devicePixelRatio:1,performance:{now:()=>0},localStorage:{getItem:()=>null,setItem(){}},location:{hash:'',reload(){reloaded=true;}},addEventListener(type,fn){events[type]=fn;},requestAnimationFrame(){},Math,Date,Set,console};sandbox.globalThis=sandbox;
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(__dirname+'/engine.js','utf8'),sandbox);
vm.runInContext(fs.readFileSync(__dirname+'/cargo.js','utf8'),sandbox);
for(const f of ['rivals.js','stations.js','campaign.js','rigs.js'])vm.runInContext(fs.readFileSync(__dirname+'/'+f,'utf8'),sandbox);
let src=fs.readFileSync(__dirname+'/game.js','utf8').replace('menu();requestAnimationFrame(frame);','globalThis.testApi={cargoAction,cargoExit,start,update,pause,dash,end,menu,garage,getRun:()=>run,getState:()=>state,setState:v=>state=v,getSave:()=>save,spawn,routes,upgrades,draw,help,getReduced:()=>reducedMotion,upgradePreview,choose,moveDir,getHistory:()=>history,relics,chooseRelic,attackAngles,anomalyChoice,extraction};menu();');vm.runInContext(src,sandbox);

const api=sandbox.testApi,Cargo=sandbox.Cargo;
api.start(false,{seed:42,hull:0,power:0},'cargo');let r=api.getRun();
assert.equal(r.mode,'cargo');assert.equal(r.cargo.items.length,18);const field=JSON.stringify(r.cargo.items);
api.start(false,{seed:42,hull:0,power:0},'cargo');r=api.getRun();assert.equal(JSON.stringify(r.cargo.items),field);
r.spawn=999;r.fire=999;r.bossAt=999;r.time=91;api.update(.01);assert.equal(api.getState(),'playing');assert.equal(r.beacon,null);assert.equal(r.anomaly,null);
r.cargo.items=[];let item=Cargo.add(r.cargo,0,0,2);api.cargoAction();assert.equal(r.cargo.heldId,item.id);
for(let i=0;i<95;i++)api.update(1/60);assert.equal(r.cargo.banked,24);assert.equal(r.cargo.items.length,0);
item=Cargo.add(r.cargo,0,0);api.cargoAction();api.dash();assert.equal(r.cargo.heldId,null);assert.equal(r.cargo.items.length,1);
r.cargo.items=[];r.p.x=500;r.p.y=0;r.p.inv=0;item=Cargo.add(r.cargo,470,0);const hp=r.p.hp;r.shots=[{x:450,y:0,vx:2000,vy:0,enemy:true,life:1}];api.update(.01);assert.equal(r.p.hp,hp);assert.equal(item.hp,20);assert.equal(r.shots.length,0);
r.cargo.items=[];item=Cargo.add(r.cargo,470,0);r.enemies=[{x:500,y:0,type:'chaser',hp:100,maxHp:100,speed:0,radius:12,shot:9,hit:0}];r.shots=[{x:450,y:0,vx:2000,vy:0,enemy:false,life:1,damage:10,pierce:0,hits:new Set()}];api.update(.01);assert.equal(r.enemies[0].hp,100);assert.equal(item.hp,20);
r.enemies=[];r.shots=[];r.cargo.items=[];item=Cargo.add(r.cargo,r.p.x,r.p.y);r.p.towAngle=Math.PI/2;r.p.angle=0;api.cargoAction();api.cargoAction();assert.ok(Math.abs(item.vx)<1e-6);assert.equal(item.vy,520);
const historyCount=api.getHistory().length,credits=api.getSave().credits;r.cargo.banked=24.8;api.end(false);assert.equal(api.getSave().credits,credits+24);assert.equal(api.getHistory().length,historyCount);api.end(false);assert.equal(api.getSave().credits,credits+24);
doc.querySelector('#again').onclick();r=api.getRun();assert.equal(r.mode,'cargo');r.cargo.banked=12;api.cargoExit();assert.equal(api.getState(),'cargo-exit');doc.querySelector('#cargo-cancel').onclick();assert.equal(api.getState(),'playing');api.cargoExit();doc.querySelector('#cargo-confirm').onclick();assert.equal(api.getState(),'ended');assert.equal(api.getHistory().length,historyCount);
api.start(false);r=api.getRun();assert.equal(r.mode,'flight');assert.equal(r.cargo,null);assert.equal(doc.querySelector('#cargo-action').hidden,true);
// Ownership protocol: rivals cannot be grabbed, moved or evicted; shots still hit their cover.
const c=Cargo.create();const owned=Cargo.add(c,0,0);owned.owner='rival:1';assert.equal(Cargo.targetNearest(c,{x:0,y:0}),null);owned.vx=100;Cargo.update(c,{x:500,y:0},[],[],1);assert.equal(owned.x,0);for(let i=0;i<30;i++)Cargo.add(c,1000,1000);assert.ok(c.items.includes(owned));Cargo.update(c,{x:500,y:0},[],[{x:0,y:0,life:1,enemy:true}],0);assert.equal(owned.hp,20);
api.start(false,null,'cargo');api.draw();console.log('Cargo integration passed: seeded field, isolated mode, banking, dash release, cover ordering, movement-directed throw, settlement/history isolation, exit/cancel, rival ownership and draw.');
// Regression: nearest entity before cover, plus piercing continuation into cover.
function setupLine(pierce){api.start(false,null,'cargo');r=api.getRun();r.cargo.items=[];r.spawn=999;r.fire=999;r.bossAt=999;r.p.x=500;r.p.y=500;const cover=Cargo.add(r.cargo,170,0);const enemy={x:100,y:0,type:'chaser',hp:100,maxHp:100,speed:0,radius:12,shot:9,hit:0};r.enemies=[enemy];r.shots=[{x:0,y:0,vx:2000,vy:0,enemy:false,life:1,damage:10,pierce,hits:new Set()}];api.update(.1);return {cover,enemy};}
let order=setupLine(0);assert.equal(order.enemy.hp,90);assert.equal(order.cover.hp,30);
order=setupLine(1);assert.equal(order.enemy.hp,90);assert.equal(order.cover.hp,20);
api.start(false,null,'cargo');r=api.getRun();r.cargo.items=[];r.spawn=999;r.fire=999;r.bossAt=999;r.p.hp=1;r.p.inv=0;item=Cargo.add(r.cargo,-48,0);Cargo.action(r.cargo,r.p);item.bankTime=1.499;r.enemies=[{x:0,y:0,type:'chaser',hp:100,maxHp:100,speed:0,radius:12,shot:9,hit:0}];api.update(.01);assert.equal(api.getState(),'ended');assert.equal(r.cargo.banked,0);
api.start(false,null,'cargo');r=api.getRun();r.cargo.items=[];r.spawn=999;r.fire=999;r.bossAt=999;r.p.hp=1;r.p.inv=0;item=Cargo.add(r.cargo,-48,0);Cargo.action(r.cargo,r.p);item.bankTime=1.499;r.shots=[{x:0,y:0,vx:0,vy:0,life:1,enemy:true}];api.update(.01);assert.equal(api.getState(),'ended');assert.equal(r.cargo.banked,0);
api.start(false,null,'cargo');r=api.getRun();r.cargo.items=[];r.spawn=999;r.bossAt=999;r.enemies=[{x:300,y:0,type:'chaser',hp:100,maxHp:100,speed:0,radius:12,shot:9,hit:0}];doc.querySelector('#cargo-fire').onclick();assert.equal(r.autoFire,false);api.update(.01);assert.equal(r.shots.length,0);events.keydown({key:'q',preventDefault(){}});assert.equal(r.autoFire,true);api.update(.01);assert.ok(r.shots.length>0);api.pause();doc.querySelector('#pause-help').onclick();assert.match(doc.querySelector('#overlay').innerHTML,/拾荒争夺指南/);assert.ok(!doc.querySelector('#overlay').innerHTML.includes('每 90 秒'));
console.log('Cargo regressions passed: first hit / piercing cover order, contact and projectile death deny new banking, Q/button fire toggle, mode-specific guide.');

// Turret consumes one real cargo; rival drops the original object on live-game damage.
api.start(false,{seed:21,hull:0,power:0},'cargo');r=api.getRun();r.spawn=999;r.bossAt=999;r.fire=999;r.autoFire=false;r.cargo.items=[];
const station=r.stations.stations[0];r.p.x=station.x;r.p.y=station.y;item=Cargo.add(r.cargo,station.x,station.y,2);r.cargo.heldId=item.id;
events.keydown({key:'f',preventDefault(){}});assert.equal(station.ammo,12);assert.equal(r.cargo.items.length,0);assert.equal(r.cargo.banked,0);events.keydown({key:'f',preventDefault(){}});assert.equal(station.ammo,12);
const rival=r.rival.rival;rival.x=500;rival.y=0;r.p.x=0;r.p.y=0;item=Cargo.add(r.cargo,500,0,2);sandbox.Rivals.update(r.rival,r.cargo,.01);assert.equal(item.owner,'rival:1');const same=item;
r.enemies=[rival];r.shots=[{x:500,y:0,vx:0,vy:0,enemy:false,life:1,damage:1,pierce:0,hits:new Set()}];api.update(.01);assert.equal(item.owner,undefined);assert.equal(r.cargo.items[0],same);assert.equal(r.cargo.items.length,1);assert.equal(r.cargo.banked,0);assert.equal(r.kills,0);
api.draw();console.log('Tactical integration passed: F supplies once without bank credit; live projectile interrupts rival, preserving original cargo without kill rewards.');
