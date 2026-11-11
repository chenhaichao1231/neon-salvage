'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),E=require('./td-lanes');
const source=fs.readFileSync(__dirname+'/td-lanes-renderer.js','utf8');
function boot(){
 const requests=[],texts=[],draws=[];
 class Image{constructor(){this.width=0;this.height=0;this.complete=false;}set src(url){this.url=url;requests.push(url);}}
 const box={Image};vm.runInNewContext(source,box);const R=box.TDLanesRenderer;
 const ctx=new Proxy({fillText:t=>texts.push(t),drawImage:(...a)=>draws.push(a)},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 function draw(s,preview=E.preview(s.level),lang='en'){
  texts.length=0;draws.length=0;const before=JSON.stringify({s,preview});
  R.draw(ctx,{state:s,definitions:E.definitions,layout:{},preview},{width:1120,height:650,lang,reducedMotion:true});
  assert.equal(JSON.stringify({s,preview}),before,'render and art requests are simulation-read-only');
 }
 return{R,requests,texts,draws,draw};
}
const base=['td-campus-background.png','td-ai-sprites.png','td-suppliers.png','td-enemies.png','td-ds-actions.png','td-ds-idle.png','td-ds-attack.png','td-gpt-attack.png'];
const b=boot();assert.deepEqual(b.requests,base);
for(const key of ['fragmentActions','armorActions'])assert.equal(b.R.assetState(key),'not-requested');
const first=E.create(0);for(let i=0;i<100;i++)b.draw(first);
assert.deepEqual(b.requests,base);assert(!b.texts.some(t=>t.includes('Art failed:')));
E.deploy(first,0,0,'deepseek');E.start(first);for(let i=0;i<10;i++){E.step(first,.5);b.draw(first);}assert.deepEqual(b.requests,base,'first-stage live data enemies need no deferred art');
// A fresh return/bookmark to any reached stage requests its preview types immediately.
const expected=[[],['td-fragment-actions.png','td-armor-actions.png'],['td-armor-actions.png'],['td-fragment-actions.png'],['td-fragment-actions.png']];
for(let level=0;level<E.levels.length;level++){
 const fresh=boot();fresh.draw(E.create(level));assert.deepEqual(fresh.requests,[...base,...expected[level]],'stage '+level);
}
// Normal stage changes and retries reuse resources, including pending/failed resources.
for(const level of [2,0,4,1,3,4,0]){b.draw(E.create(level));b.draw(E.create(level));}
assert.equal(b.requests.length,10);assert.equal(new Set(b.requests).size,10);
// Live enemies are sufficient even if no preview was supplied. Dead enemies are not.
for(const [type,key,label]of [['armor','armorActions','Armor actions'],['swarm','fragmentActions','Fragment wings']]){
 const f=boot(),s=E.create();s.enemies=[{id:'live',type,row:0,x:4,hp:0,cooldown:0}];f.draw(s,[]);assert.equal(f.requests.length,8);
 s.enemies[0].hp=10;f.draw(s,[]);assert.equal(f.requests.length,9);assert.equal(f.R.assetState(key),'loading');assert(!f.texts.some(t=>t.includes('Art failed:')));
 const legacy=f.R.assets.enemies;legacy.width=1262;legacy.height=1246;legacy.complete=true;legacy.onload();
 f.draw(s,[]);assert(f.draws.some(a=>a[0]===legacy),'legacy art during pending action request');
 const im=f.R.assets[key];im.complete=true;im.onerror();f.draw(s,[]);assert.equal(f.R.assetState(key),'failed');assert(f.texts.some(t=>t.includes(label)));assert(f.draws.some(a=>a[0]===legacy));
 f.draw(s,[],'zh');assert(f.texts.some(t=>t.includes('资源加载失败：')));
 for(let i=0;i<100;i++)f.draw(s,[]);assert.equal(f.requests.length,9,'failure must not produce a request storm');
 f.draw(E.create(0));assert(f.texts.some(t=>t.includes(label)),'real failures remain visible after level change');
 im.width=1536;im.height=1024;im.onload();f.draw(s,[]);assert.equal(f.R.assetState(key),'ready');assert(f.draws.some(a=>a[0]===im));assert(!f.texts.some(t=>t.includes('Art failed:')));assert.equal(f.requests.length,9);
}
// Exact source-byte accounting, not transferred bytes, decode time, or frame-rate claims.
const bytes=names=>names.reduce((sum,name)=>sum+fs.statSync(__dirname+'/'+name).size,0);
assert.equal(bytes(base),15897754);assert.equal(bytes(['td-fragment-actions.png','td-armor-actions.png']),4228870);
assert.equal(bytes(Object.values(b.R.files)),20126624);
console.log('PASS lazy enemy art: stage previews/bookmark startup, live fallback, failure/recovery, request deduplication, read-only state');
console.log(JSON.stringify({eagerImageRequestsBefore:10,eagerImageRequestsAfter:8,firstStageSourceBytes:bytes(base),deferredSourceBytes:4228870,allRendererSourceBytes:20126624}));
