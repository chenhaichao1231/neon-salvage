'use strict';
// Exact geometry and DOM contracts; no browser layout or acceptance claim.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const UI=require('./td-lanes-ui'),E=require('./td-lanes');
const source=fs.readFileSync(__dirname+'/td-lanes-dom-writes.test.js','utf8').split('function count(h)')[0];
const harness=Function('require','__dirname',source+'\nreturn harness;')(require,__dirname);
const currentSource=fs.readFileSync(path.join(__dirname,'td-lanes-ui.js'),'utf8');
// Restore only the changed presentation expression. No Git/history or private fixture.
const placement="setStyle(rowNodes[row].style,'left',forecastLeft(r.width,r.height)+'px');";
assert.equal(currentSource.split(placement).length,2,'one forecast placement call');
const baselineSource=currentSource.replace(placement,"setStyle(rowNodes[row].style,'left',(tr.x+985*tr.scale)+'px');");
const Base=Function('require','module',baselineSource+';return module.exports;')(require,{exports:{}});
const originalHashes={
 "td-lanes.js": "537c9d404a94be925e5b0c8632fca48a76cd74ba52269d8d142cd7bd5ceb1a5f",
 "td-lanes.css": "4b63261fffadc7e60a50d74e7dcd9fcefae44e709b32be587179ac5e4a1753a9",
 "td-ai-sprites.png": "2106aababd8691ec7acd4ed9972a470d367d6ffc2579c2081fd3e5d0a33232be",
 "td-armor-actions.png": "46ab4d0e8cf90089d9bab126da3dcc6e7ceb5bc1edca76de27542327c27c7c38",
 "td-campus-background.png": "d2e7e53e338bdd292e1860db82af7bb492dc279f25572778b0159a861b5f3591",
 "td-claude-actions.png": "d9cdc3f8674b580a374d3c55d822c39b96197964ec5693556ee44da4cea4a6aa",
 "td-ds-actions.png": "627f0d4dc71d3753658fd03be044791eb5a0c3df6443dd8dd7281128abe6fc09",
 "td-ds-attack.png": "fda8e2c3a011a1b580a65fa81a560daa9fea93c6e7b2c16f96ebe8ed5507981e",
 "td-ds-idle.png": "cd94cb84a46ad12114958a18a677da5df580cdcd255bc49f45088d5989f6775c",
 "td-enemies.png": "c93386d8c5aa1b774d41b3d8e9ad16226ae402b96f3340f9afe126a92e950b30",
 "td-fragment-actions.png": "313994b7c89e6f515795df7f04118c70ac2ae7a43e49e964cd043c9b25095bd1",
 "td-gpt-attack.png": "47c35b21c05be4178751957006843737bc7743032c4fc065e36104c90b57985b",
 "td-gpt-idle.png": "fe53c7d83282d1248dba0bc53c2c3c8f6aa868731e13979bc4a0612c96ac81a9",
 "td-gpu.png": "ba3e5ee697fd57e1a8760ef30914876f3fa2050e24d780dca5ba8bff7ef53e0f",
 "td-grok-actions.png": "2196e43575eb552cfd366651c8b362d67e18597738fc27a78833d89466483633",
 "td-suppliers.png": "168f175170ef5830264f43e8be8f5bdfe88f25b7691ee046f71e3d66d8adb30b"
};
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,file))).digest('hex');
const clone=x=>JSON.parse(JSON.stringify(x));let checks=0;
function check(name,fn){fn();checks++;console.log('PASS '+name);}
check('real geometry fits unchanged 108px label plus 8px gaps without changing world transform',()=>{
 for(const [w,h]of [[1140,417],[1140,418],[1136,413],[1136,414]])for(let row=0;row<5;row++){const t=UI.transform(w,h),x=UI.forecastLeft(w,h),right=t.x+1120*t.scale;assert.equal(x,right+8);assert(x+108<=w-8);assert.deepEqual(clone(t),clone(Base.transform(w,h)));}
});
check('exact threshold and original no-gutter fallback are deterministic',()=>{
 for(const [w,h]of [[740,400],[1120,650],[960,600],[320,650],[1180,757],[1140,650],[1140.125,417.375],[800,300],[1000,300]]){const t=UI.transform(w,h),right=t.x+1120*t.scale,canFit=w-right>=124;assert.equal(UI.forecastLeft(w,h),canFit?right+8:t.x+985*t.scale);if(canFit)assert(UI.forecastLeft(w,h)+108<=w-8);}
 const h=400,w=1120*h/650+248;assert.equal(UI.forecastLeft(w,h),w-124+8);const t=UI.transform(w-.001,h);assert.equal(UI.forecastLeft(w-.001,h),t.x+985*t.scale);
});
check('CSS maximum and pointer-free overlays remain intact',()=>{const css=fs.readFileSync(path.join(__dirname,'td-lanes.css'),'utf8');assert.match(css,/\.row-label\{white-space:pre-line;max-width:108px;/);assert.match(css,/#grid,#tokens,#row-preview\{[^}]*pointer-events:none/);assert.equal(hash('td-lanes.css'),originalHashes['td-lanes.css']);});
check('mounted English/Chinese labels use gutter while cells, GPU hit targets, renderer and battle state match baseline',()=>{
 for(const level of [0,2,3,4])for(const lang of ['en','zh']){const a=harness(level,UI),b=harness(level,Base);for(const h of [a,b]){if(lang==='zh')h.nodes.language.onclick();h.resize(1140,418);h.nodes.grid.children[0].onclick();h.nodes.start.onclick();for(let i=0;i<62;i++)h.app.controller.tick(.1);h.app.render();h.nodes.pause.onclick();}
 assert.deepEqual(clone(a.app.controller.state),clone(b.app.controller.state));
 for(let i=0;i<35;i++){assert.deepEqual(clone(a.nodes.grid.children[i].style),clone(b.nodes.grid.children[i].style));assert.equal(a.nodes.grid.children[i].getAttribute('aria-label'),b.nodes.grid.children[i].getAttribute('aria-label'));}
 assert.equal(a.nodes.tokens.children.length,b.nodes.tokens.children.length);for(let i=0;i<a.nodes.tokens.children.length;i++)assert.deepEqual(clone(a.nodes.tokens.children[i].style),clone(b.nodes.tokens.children[i].style));
 for(let i=0;i<5;i++){const ra=a.nodes['row-preview'].children[i],rb=b.nodes['row-preview'].children[i];assert.equal(ra.textContent,rb.textContent);assert.equal(ra.style.top,rb.style.top);assert.equal(parseFloat(ra.style.left),UI.forecastLeft(1140,418));}
 const frozen=JSON.stringify(a.app.controller.state);a.reset();for(let i=0;i<120;i++)a.app.frame(1000+i*1000/60);assert.equal(a.writes.length,0);assert.equal(JSON.stringify(a.app.controller.state),frozen);
 a.resize(740,400);b.resize(740,400);for(let i=0;i<5;i++)assert.deepEqual(clone(a.nodes['row-preview'].children[i].style),clone(b.nodes['row-preview'].children[i].style));a.resize(1140,418);assert.equal(parseFloat(a.nodes['row-preview'].children[2].style.left),UI.forecastLeft(1140,418));a.reset();a.resize(1140,418);assert.equal(a.writes.length,0);
 }
});
check('prepare, active, paused, detour countdown, retry and terminal flows preserve text and state',()=>{
 const a=harness(3,UI),b=harness(3,Base);for(const h of [a,b]){h.resize(1140,417);h.nodes.grid.children[12].onclick();h.nodes.start.onclick();for(let i=0;i<500&&!h.app.controller.state.enemies.some(e=>e.turnState==='waiting');i++)h.app.controller.tick(1/60);h.app.render();}
 for(const action of ['pause','pause','retry','start']){for(const h of [a,b])h.nodes[action].onclick();assert.deepEqual(clone(a.app.controller.state),clone(b.app.controller.state));for(let i=0;i<5;i++)assert.equal(a.nodes['row-preview'].children[i].textContent,b.nodes['row-preview'].children[i].textContent);}
 for(const phase of ['won','lost']){for(const h of [a,b]){h.app.controller.state.phase=phase;h.app.render();}for(let i=0;i<5;i++)assert.equal(a.nodes['row-preview'].children[i].textContent,b.nodes['row-preview'].children[i].textContent);}
});
check('all bilingual production label lines fit at observed wide-arena geometry',()=>{
 const {createCanvas,GlobalFonts}=require('@napi-rs/canvas');GlobalFonts.registerFromPath('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc','forecast-test');const ctx=createCanvas(1,1).getContext('2d');ctx.font='12px forecast-test';let maxLine=0,maxRows=0;
 for(const lang of ['en','zh'])for(let level=0;level<E.levels.length;level++){const texts=[];for(let row=0;row<5;row++)texts.push(UI.lanePlan(E.preview(level),row,lang));for(const e of E.preview(level))texts.push(UI.upcomingLabel(E,e,e.time-99,lang));texts.push(lang==='zh'?'蓄力 ×3\n下一只 2.0s → 3':'Wait ×3\nNext 2.0s → 3');texts.push(lang==='zh'?'蓄力 2.0s → 3':'Wait 2.0s → 3');
 for(const text of texts){const lines=text.split('\n');maxRows=Math.max(maxRows,lines.length);for(const line of lines){const w=ctx.measureText(line).width;maxLine=Math.max(maxLine,w);assert(w<=96,'existing 108px label content: '+line);}}}
 assert(maxRows*15+6<=82*417/650);console.log('Label text-fit evidence: '+maxLine.toFixed(2)+'px maximum line, '+maxRows+' lines, native font only.');
});
check('renderer payload is identical at wide-gutter dimensions',()=>{const capture=adapter=>{const h=harness(2,adapter);h.resize(1140,418);h.nodes.grid.children[0].onclick();h.nodes.start.onclick();h.nodes.pause.onclick();return clone(h.seen);};assert.deepEqual(capture(UI),capture(Base));});
// Renderer-only hash retired for the intentional enemy identity presentation change.
// Geometry/DOM checks above and every engine/CSS/original PNG hash remain enforced.
check('engine, CSS and every original PNG byte unchanged from frozen0.12',()=>{
 for(const[file,expected]of Object.entries(originalHashes))assert.equal(hash(file),expected,file);
});
console.log('PASS '+checks+' focused groups; exact geometry/DOM only, no browser acceptance.');delete global.TDLanesRenderer;
