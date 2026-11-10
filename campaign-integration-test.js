/* Run the real simulation with a minimal DOM adapter, not a substitute browser. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const events={};let reloaded=false;const nodes=new Map();const node=()=>({style:{},hidden:false,_html:'',get innerHTML(){return this._html;},set innerHTML(v){this._html=v;this.buttons={};},textContent:'',querySelectorAll(selector){const key=selector.slice(6,-1);return this.buttons?.[key]||(this.buttons={...this.buttons,[key]:[...this.innerHTML.matchAll(new RegExp('data-'+key+'="([^"]+)"','g'))].map(m=>({dataset:{[key.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]:m[1]}}))})[key];},addEventListener(type,fn){(this.events||={})[type]=fn;},setPointerCapture(){},getContext(){return new Proxy({},{get:()=>()=>{}});}});
const doc={querySelector(s){if(!nodes.has(s))nodes.set(s,node());return nodes.get(s);},addEventListener(){},hidden:false};
const sandbox={document:doc,innerWidth:1280,innerHeight:720,devicePixelRatio:1,performance:{now:()=>0},localStorage:{getItem:()=>null,setItem(){}},location:{hash:'',reload(){reloaded=true;}},addEventListener(type,fn){events[type]=fn;},requestAnimationFrame(){},Math,Date,Set,console};sandbox.globalThis=sandbox;
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(__dirname+'/engine.js','utf8'),sandbox);
for(const file of ['cargo','rivals','stations','campaign','rigs'])vm.runInContext(fs.readFileSync(__dirname+'/'+file+'.js','utf8'),sandbox);
let src=fs.readFileSync(__dirname+'/game.js','utf8').replace('menu();requestAnimationFrame(frame);','globalThis.testApi={storyStation,getCampaignState,replaceCampaignState,activateRig,updateShelter,currentBackup,cargoAction,cargoExit,start,update,pause,dash,end,menu,garage,getRun:()=>run,getState:()=>state,setState:v=>state=v,getSave:()=>save,spawn,routes,upgrades,draw,help,getReduced:()=>reducedMotion,upgradePreview,choose,moveDir,getHistory:()=>history,relics,chooseRelic,attackAngles,anomalyChoice,extraction};menu();');vm.runInContext(src,sandbox);

const api=sandbox.testApi,Cargo=sandbox.Cargo,Campaign=sandbox.Campaign,Rigs=sandbox.Rigs;
const writes=[];sandbox.localStorage.setItem=(key,value)=>writes.push({key,value});
function quiet(r){r.spawn=999;r.fire=999;r.bossAt=999;r.rival.status='dead';r.enemies=[];r.shots=[];}
api.storyStation();assert.equal(api.getState(),'station');assert.match(doc.querySelector('#overlay').innerHTML,/station-map/);
doc.querySelector('#story-launch').onclick();let r=api.getRun();quiet(r);assert.equal(r.story,true);assert.equal(r.rig.id,'pulse');assert.equal(r.stations.stations.length,0);
let core=r.cargo.items.find(i=>i.storyId);assert.equal(core.x,280);assert.equal(core.y,-160);const originalId=core.storyId;
// Lost physical core respawns next expedition, without story progress.
r.cargo.items.splice(r.cargo.items.indexOf(core),1);api.update(.01);assert.equal(r.coreLost,true);assert.equal(api.getCampaignState().coreBanked,false);
api.start(false,null,'cargo',true);r=api.getRun();quiet(r);core=r.cargo.items.find(i=>i.storyId);assert.equal(core.storyId,originalId);
// Real bank is the sole trigger, consumes core, grants zero alloy, persists once.
core.x=-52;core.y=0;r.cargo.heldId=core.id;core.bankTime=1.499;const storyWrites=writes.filter(x=>x.key==='neon_salvage_campaign').length;api.update(.01);assert.equal(api.getCampaignState().coreBanked,true);assert.equal(r.cargo.banked,0);assert.ok(!r.cargo.items.includes(core));assert.equal(writes.filter(x=>x.key==='neon_salvage_campaign').length,storyWrites+1);api.update(.01);assert.equal(writes.filter(x=>x.key==='neon_salvage_campaign').length,storyWrites+1);
api.end(true);doc.querySelector('#home').onclick();assert.equal(api.getState(),'station');const branch=doc.querySelector('#overlay').querySelectorAll('[data-story-choice]')[0];assert.equal(branch.dataset.storyChoice,'habitat');branch.onclick();assert.equal(api.getCampaignState().choice,'habitat');const afterChoice=JSON.stringify(api.getCampaignState());branch.onclick();assert.equal(JSON.stringify(api.getCampaignState()),afterChoice);
doc.querySelector('#story-launch').onclick();r=api.getRun();quiet(r);assert.equal(r.rig.id,'press');assert.ok(r.shelter);assert.equal(r.stations.stations.length,0);assert.ok(!r.cargo.items.some(i=>i.storyId));
// Facility repairs cargo, not hull; total budget limited to 30.
r.cargo.items=[];const damaged=Cargo.add(r.cargo,r.shelter.x,r.shelter.y,3);damaged.hp=1;r.p.hp=50;api.updateShelter(100);assert.equal(damaged.hp,31);assert.equal(r.shelter.budget,0);assert.equal(r.p.hp,50);api.updateShelter(100);assert.equal(damaged.hp,31);
// Press consumes same physical cargo once and cannot subsequently bank it.
r.cargo.heldId=damaged.id;api.activateRig();assert.ok(r.p.hp>50);assert.equal(r.cargo.items.length,0);assert.equal(r.cargo.heldId,null);const healed=r.p.hp;api.activateRig();assert.equal(r.p.hp,healed);
// Workshop's effects and run equipment are fixed; no story core after completion.
api.replaceCampaignState({...Campaign.create(),coreBanked:true,bankedCoreIds:[Campaign.CORE_ID],choice:'workshop',completed:true});api.storyStation();const reflect=doc.querySelector('#overlay').querySelectorAll('[data-rig]').find(b=>b.dataset.rig==='reflect');reflect.onclick();doc.querySelector('#story-launch').onclick();r=api.getRun();quiet(r);assert.equal(r.rig.id,'reflect');assert.equal(r.stations.stations.length,2);assert.equal(r.shelter,undefined);
r.cargo.items=[];r.p.inv=0;api.activateRig();const hp=r.p.hp;r.shots=[{x:100,y:0,vx:-1000,vy:0,life:2,enemy:true}];api.update(.1);assert.equal(r.p.hp,hp);assert.equal(r.shots[0].enemy,false);assert.equal(r.shots[0].damage,18);assert.equal(r.rig.cooldown,8.9);
// Reflection is not contact immunity.
r.enemies=[{x:0,y:0,type:'chaser',hp:100,maxHp:100,speed:0,radius:12,shot:9,hit:0}];api.update(.01);assert.equal(r.p.hp,hp-14);
// Only one shield update per gameplay frame; pause makes no clock progress.
const cooldown=r.rig.cooldown;api.pause();api.draw();assert.equal(r.rig.cooldown,cooldown);api.pause();
// Legacy restore retains story; bundle restore changes it, malformed bundle rejected.
const legacy=sandbox.Salvage.encodeBackup({credits:7,hull:1,power:2,best:3,runs:4});api.garage();doc.querySelector('#saves').onclick();const field=doc.querySelector('#save-json');field.value=legacy;doc.querySelector('#preview-save').onclick();assert.equal(doc.querySelector('#apply-save').disabled,false);doc.querySelector('#apply-save').onclick();assert.equal(api.getCampaignState().choice,'workshop');assert.equal(api.getSave().credits,7);
const bundle=sandbox.Salvage.encodeBundle(api.getSave(),Campaign.create(),Campaign.validate);field.value=bundle;doc.querySelector('#preview-save').onclick();doc.querySelector('#apply-save').onclick();assert.equal(api.getCampaignState().coreBanked,false);const malformed=JSON.parse(bundle);malformed.campaign={bad:true};field.value=JSON.stringify(malformed);doc.querySelector('#preview-save').onclick();assert.equal(doc.querySelector('#apply-save').disabled,true);
api.start(false,null,'cargo');r=api.getRun();assert.equal(r.story,false);assert.equal(r.stations.stations.length,2);assert.equal(r.rig.id,'pulse');api.draw();
console.log('Story integration passed: real core banking, loss recovery, persistent one-time branch, distinct facilities/equipment, shield/contact semantics, legacy/bundle restore and free cargo preservation.');
// Real station purchases persist wallet and projects, are mutually exclusive, and affect next runs.
Object.assign(api.getSave(),{credits:500,hull:3,power:2});api.storyStation();let projectButtons=doc.querySelector('#overlay').querySelectorAll('[data-project]');projectButtons.find(b=>b.dataset.project==='west').onclick();assert.equal(api.getSave().credits,320);assert.equal(api.getSave().hull,3);assert.equal(api.getCampaignState().projects.outpost,'west');projectButtons.find(b=>b.dataset.project==='east').onclick();assert.equal(api.getSave().credits,320);
for(let i=0;i<4;i++){doc.querySelector('#overlay').querySelectorAll('[data-project]').find(b=>b.dataset.project==='supplies').onclick();}assert.equal(api.getSave().credits,200);assert.equal(api.getCampaignState().projects.supplies,3);
doc.querySelector('#story-launch').onclick();r=api.getRun();quiet(r);assert.equal(r.stations.stations.length,0);assert.equal(api.getCampaignState().projects.supplies,3);assert.equal(r.cargo.depots.length,2);
const depot=r.cargo.depots[1];r.cargo.items=[];r.p.x=depot.x;r.p.y=depot.y;const cargo=Cargo.add(r.cargo,depot.x-48,depot.y);r.cargo.heldId=cargo.id;cargo.bankTime=1.499;api.update(.01);assert.equal(r.cargo.banked,12);api.cargoExit();assert.equal(api.getState(),'cargo-exit');doc.querySelector('#cargo-cancel').onclick();
api.start(false,null,'cargo');r=api.getRun();assert.equal(r.stations.stations[0].ammo,36);assert.equal(api.getCampaignState().projects.supplies,0);assert.equal(r.cargo.depots.length,2);api.start(false,null,'cargo');assert.equal(api.getRun().stations.stations[0].ammo,0);
// Player and cargo must occupy the same depot, not two different sites.
const isolated=Cargo.create();isolated.depots=[{x:0,y:0,radius:65},{x:400,y:0,radius:65}];const remote=Cargo.add(isolated,400,0);isolated.heldId=remote.id;remote.bankTime=1.49;Cargo.update(isolated,{x:0,y:0,angle:0,hp:100},[],[],.001);assert.equal(remote.bankTime,0);assert.equal(isolated.banked,0);
// Shield precedes a cover object lying behind its intersection; nearer cover wins.
function reflectWithCover(coverX){api.start(false,null,'cargo');r=api.getRun();quiet(r);r.cargo.items=[];r.p.inv=0;r.rig=Rigs.create('reflect');api.activateRig();const c=Cargo.add(r.cargo,coverX,0);r.shots=[{x:150,y:0,vx:-1500,vy:0,life:2,enemy:true}];api.update(.1);return {cover:c,shots:r.shots,hp:r.p.hp};}
let reflected=reflectWithCover(20);assert.equal(reflected.cover.hp,30);assert.equal(reflected.shots[0].reflected,true);
let blocked=reflectWithCover(100);assert.equal(blocked.cover.hp,20);assert.equal(blocked.shots.length,0);
console.log('Project and ordering integration passed: paid projects, no repeat charges, outpost banking/extraction, stored supply consumption, same-depot rule, shield-versus-cover distance ordering.');
