'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),E=require('./td-lanes');
const imgs=[];class FakeImage{constructor(){this.width=0;this.height=0;this.complete=false;imgs.push(this);}set src(v){this.url=v;}}
const box={Image:FakeImage};vm.runInNewContext(fs.readFileSync(__dirname+'/td-lanes-renderer.js','utf8'),box);const R=box.TDLanesRenderer;
assert.equal(imgs.length,9);assert.deepEqual(imgs.map(i=>i.url),['td-campus-background.png','td-ai-sprites.png','td-suppliers.png','td-enemies.png','td-ds-actions.png','td-ds-idle.png','td-ds-attack.png','td-gpt-attack.png','td-fragment-actions.png']);
const text=[],calls=[];const ctx=new Proxy({}, {get:(o,k)=>o[k]||((...a)=>{calls.push([k,...a]);if(k==='fillText')text.push(a[0]);}),set:(o,k,v)=>(o[k]=v,true)});
const s=E.create();E.deploy(s,0,0,'deepseek');E.deploy(s,1,1,'gpt');s.enemies=[{id:'e1',type:'armor',x:5,row:2,hp:20}];const before=JSON.stringify(s);
function draw(lang){text.length=0;calls.length=0;R.draw(ctx,{state:s,definitions:E.definitions,layout:{}},{width:1120,height:650,lang,reducedMotion:true});assert.equal(JSON.stringify(s),before);}
draw('en');assert(text.includes('DeepSeek'));assert(text.includes('GPT'));assert(text.includes('Armor'));assert(!text.some(x=>x.startsWith('Art failed:')));assert(calls.some(x=>x[0]==='quadraticCurveTo'),'non-box guard fallback');
for(const im of imgs){im.complete=true;im.onerror();}draw('zh');assert(text.some(x=>x.includes('资源加载失败：背景 / 守卫 / 供给者 / 敌人')));assert(text.includes('重甲怪'));draw('en');assert(text.some(x=>x.includes('Art failed: background / guards / suppliers / enemies')));
imgs[1].width=1600;imgs[1].height=900;imgs[1].onload();draw('en');assert(!text.some(x=>x.startsWith('Art failed:')&&x.includes('guards')));assert(calls.some(x=>x[0]==='drawImage'));assert(text.includes('Armor'));assert.equal(R.assetState('ai'),'ready');
console.log('PASS per-resource loading/error/recovery, bilingual notice, non-box guard/enemy fallbacks, unchanged URLs and read-only render');

// The new attack resource can fail independently without making GPT disappear.
assert.equal(R.assetState('gptAttack'),'failed');draw('en');assert(text.some(t=>t.includes('GPT attack')));assert(calls.some(a=>a[0]==='drawImage'&&a[1]===imgs[1]),'legacy sheet is used when attack image failed');
imgs[7].width=1536;imgs[7].height=1024;imgs[7].onload();draw('en');assert.equal(R.assetState('gptAttack'),'ready');assert(!text.some(t=>t.startsWith('Art failed:')&&t.includes('GPT attack')));assert(calls.some(a=>a[0]==='drawImage'&&a[1]===imgs[7]),'recovered attack resource takes over');
console.log('PASS isolated GPT attack failure, legacy fallback and recovery');

// Isolated fragment resource fallback must retain the same enemy, not hide it.
const fragmentState=E.create();fragmentState.enemies=[{id:'fragment',type:'swarm',row:0,x:4,hp:22,cooldown:0}];
function drawFragment(){calls.length=0;text.length=0;const before=JSON.stringify(fragmentState);R.draw(ctx,{state:fragmentState,definitions:E.definitions,layout:{}},{width:1120,height:650,lang:'en',reducedMotion:false});assert.equal(JSON.stringify(fragmentState),before);}
imgs[3].width=1262;imgs[3].height=1246;imgs[3].onload();drawFragment();assert(calls.some(c=>c[0]==='drawImage'&&c[1]===imgs[3]&&c[2]===631),'failed animation falls back to original top-right bat');assert(text.some(t=>t.includes('Fragment wings')));
imgs[8].width=1536;imgs[8].height=1024;imgs[8].onload();drawFragment();assert(calls.some(c=>c[0]==='drawImage'&&c[1]===imgs[8]));assert(!text.some(t=>t.startsWith('Art failed:')&&t.includes('Fragment wings')));
imgs[8].width=0;imgs[8].height=0;imgs[8].onerror();imgs[3].width=0;imgs[3].height=0;imgs[3].onerror();drawFragment();assert(text.includes('Swarm'),'both resources missing still render a labeled fallback');
console.log('PASS fragment animation isolated failure, legacy bat fallback, recovery and total-image-loss fallback');
