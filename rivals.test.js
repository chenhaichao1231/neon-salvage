'use strict';
const assert = require('node:assert/strict');
const R = require('./rivals');
function cargo() { return {items:[],heldId:null,banked:17}; }
function add(c,id=1,x=0) { const item={id,x,y:0,vx:0,vy:0,mass:2,radius:20,hp:60,maxHp:60,thrown:false,bankTime:0}; c.items.push(item); return item; }
function setup() { const c=cargo(),item=add(c),s=R.create({x:0,y:0,exitX:300,exitY:0}); return {c,item,s}; }
function tick(s,c,n=1) { const events=[]; for(let i=0;i<n;i++) events.push(...R.update(s,c,.1)); return events; }
let count=0;
function test(name,fn) {fn();count++;console.log('PASS '+name);}
test('claims the original free object without duplication',()=>{const {s,c,item}=setup();assert.equal(tick(s,c)[0].type,'rival-grab');assert.equal(c.items[0],item);assert.equal(c.items.length,1);assert.equal(item.owner,'rival:1');assert.equal(c.heldId,null);});
test('never selects player held, thrown, owned or dead cargo',()=>{for(const mode of ['held','thrown','owner','dead']){const {s,c,item}=setup();if(mode==='held')c.heldId=item.id;if(mode==='thrown')item.thrown=true;if(mode==='owner')item.owner='other';if(mode==='dead')item.hp=0;tick(s,c,20);assert.equal(s.heldId,null);assert.equal(s.targetId,null);}});
test('player grabbing or throwing a pursued target cancels pursuit',()=>{for(const thrown of [false,true]){const {s,c,item}=setup();item.x=700;tick(s,c);assert.equal(s.targetId,1);if(thrown)item.thrown=true;else c.heldId=1;tick(s,c);assert.equal(s.targetId,null);assert.equal(s.heldId,null);}});
test('damage drops original id and gives recovery time',()=>{const {s,c,item}=setup();tick(s,c,2);const events=R.applyDamage(s,c,5);assert.equal(events[0].type,'rival-drop');assert.equal(c.items[0],item);assert.equal(item.id,1);assert.equal(item.owner,undefined);assert.equal(s.heldId,null);tick(s,c,5);assert.equal(s.heldId,null);});
test('death through direct enemy hp bridge drops once, no new object',()=>{const {s,c,item}=setup();tick(s,c);s.rival.hp=0;const events=tick(s,c,20);assert.equal(events.filter(e=>e.type==='rival-defeated').length,1);assert.equal(events.filter(e=>e.type==='rival-drop').length,1);assert.equal(c.items[0],item);assert.equal(s.status,'dead');assert.equal(c.banked,17);});
test('nonlethal bridge damage interrupts hauling',()=>{const {s,c}=setup();tick(s,c);s.rival.hp-=1;tick(s,c);assert.equal(s.heldId,null);assert.equal(s.status,'seeking');});
test('escape removes cargo exactly once without player credit',()=>{const {s,c}=setup();const events=tick(s,c,200);assert.equal(s.status,'escaped');assert.equal(c.items.length,0);assert.equal(events.filter(e=>e.type==='rival-escaped').length,1);assert.equal(s.lostCount,1);assert.equal(c.banked,17);assert.deepEqual(R.applyDamage(s,c,999),[]);});
test('destroyed cargo clears ownership pointer safely',()=>{const {s,c}=setup();tick(s,c);c.items.length=0;tick(s,c,5);assert.equal(s.heldId,null);assert.equal(s.targetId,null);});
test('player wins contradictory ownership without corrupting throw velocity',()=>{const {s,c,item}=setup();tick(s,c);item.thrown=true;item.vx=520;tick(s,c);assert.equal(s.heldId,null);assert.equal(item.owner,undefined);assert.equal(item.vx,520);});
test('one rival, bounded velocity, no respawn, invalid dt safe',()=>{const {s,c,item}=setup();item.x=2000;const x=s.rival.x;R.update(s,c,100);assert.ok(s.rival.x-x<=105*.25+.001);const y=s.rival.x;R.update(s,c,NaN);assert.equal(s.rival.x,y);assert.ok(Number.isFinite(s.rival.x));R.applyDamage(s,c,999);tick(s,c,1000);assert.equal(s.status,'dead');assert.equal(c.items.length,1);});
test('same inputs reproduce same state',()=>{const a=setup(),b=setup();tick(a.s,a.c,40);tick(b.s,b.c,40);assert.deepEqual(a,b);});
console.log(`${count} deterministic rival tests passed`);
