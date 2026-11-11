'use strict';
const assert=require('node:assert/strict'),R=require('./td-lanes-renderer'),E=require('./td-lanes');
let tests=0;const test=(name,fn)=>{fn();console.log('PASS',++tests,name);};
const enemy=(id,type,row,x,hp=20)=>({id,type,row,x,hp,cooldown:0,slowUntil:0});
const make=enemies=>({...E.create(2),phase:'battle',time:52,enemies});
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const fields=ps=>ps.map(p=>({row:p.row,ids:p.members.map(e=>e.id),counts:p.counts,min:p.minX,max:p.maxX,routed:p.routed}));
test('live same-row bounded group inventory is true per type, not total HP',()=>{
 const enemies=[enemy('a','armor',2,5.85,110),...Array.from({length:8},(_,i)=>enemy('s'+i,'swarm',2,6.26+i*.055,2+i)),enemy('dead','charge',2,6.3,0),enemy('other','charge',1,6.3)],before=JSON.stringify(enemies),groups=R.enemyPacks(enemies),pack=groups.find(p=>p.row===2);
 assert.deepEqual(pack.counts,{armor:1,swarm:8});assert.equal(pack.members.length,9);assert(!Object.hasOwn(pack,'hp'));assert.equal(JSON.stringify(enemies),before);assert.deepEqual(fields(R.enemyPacks([...enemies].reverse())),fields(groups));
});
test('neighbor gap and 0.9-cell total span both apply, including ties and exact boundary',()=>{
 const s=make(Array.from({length:20},(_,i)=>enemy('e'+i,'swarm',0,i*.4)));const groups=R.enemyPacks(s.enemies);assert(groups.length>1);assert(groups.every(p=>p.maxX-p.minX<=.9+1e-9));assert.equal(groups.flatMap(p=>p.members).length,20);
 assert.deepEqual(R.enemyPacks([enemy('a','data',0,1),enemy('b','data',0,1.45),enemy('c','data',0,1.9),enemy('d','data',0,2.35)]).map(p=>p.members.length),[3,1]);
 assert.equal(R.enemyPacks([enemy('a','data',0,1),enemy('b','data',0,1.451)]).length,2);
});
test('single enemies stay unchanged; mixed packs never become fragment-only badges',()=>{
 assert.deepEqual(R.packCueLayout(make([enemy('a','armor',2,4)]),'en'),[]);
 const cue=R.packCueLayout(make([enemy('a','armor',2,4),enemy('b','charge',2,4.1),enemy('c','swarm',2,4.2),enemy('d','data',2,4.3)]),'en')[0];assert(!cue.fallback);assert.deepEqual(cue.slots.map(s=>[s.type,s.count]),[['armor',1],['charge',1],['swarm',1],['data',1]]);
});
test('near guard cue avoids guard body, health and Grok next-shot status',()=>{
 const s=make([enemy('a','armor',2,2.93),enemy('b','charge',2,2.93),enemy('c','swarm',2,2.93)]);s.units=[{id:'guard',type:'grok',row:2,col:2,x:2.5,hp:10,fired:3,cooldown:1,status:'normal'}];
 const cue=R.packCueLayout(s,'en')[0];assert(!cue.fallback);assert.equal(cue.side,'right');assert(!overlap(cue,{x:440-51,y:375-65,w:102,h:105}));assert(!overlap(cue,{x:440-82,y:375-76,w:164,h:21}));
});
test('multiple adjacent-lane and distinct same-lane cues do not overlap',()=>{
 const s=make([]);for(let row=0;row<5;row++)for(const[type,i]of ['armor','charge','swarm','data'].map((t,i)=>[t,i]))s.enemies.push(enemy(row+'-'+i,type,row,4+i*.08));
 const cues=R.packCueLayout(s,'en');assert.equal(cues.length,5);assert(cues.every(c=>!c.fallback));for(let i=0;i<cues.length;i++)for(let j=i+1;j<cues.length;j++)assert(!overlap(cues[i],cues[j]));
 const same=R.packCueLayout(make([enemy('a','armor',2,3),enemy('b','swarm',2,3.15),enemy('c','charge',2,4),enemy('d','swarm',2,4.15)]),'en');assert.equal(same.length,2);assert(same.every(c=>!c.fallback));assert(!overlap(...same));
});
test('homogeneous live detour route keeps its existing count, arrow and countdown',()=>{
 const enemies=[0,1,2].map(i=>({...enemy('r'+i,'charge',1,4+i*.05),toRow:2,turnState:'waiting',turnRemaining:1.2+i*.2})),s=make(enemies),before=JSON.stringify(s),texts=[];
 assert(R.enemyPacks(s.enemies)[0].routed);assert.deepEqual(R.packCueLayout(s,'en'),[]);
 const ctx=new Proxy({fillText:t=>texts.push(t)},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});R.drawDetours(ctx,s,[],'en');assert.deepEqual(texts,['×3 · Next 1.2s · → lane 3']);assert.equal(JSON.stringify(s),before);
 s.enemies.push(enemy('ordinary','armor',1,4.1));assert(!R.enemyPacks(s.enemies)[0].routed);assert.equal(R.enemyPacks(s.enemies)[0].counts.armor,1);assert.equal(R.enemyPacks(s.enemies)[0].counts.charge,3);
});
test('narrow fallback forecast exclusion uses pure layout and does not move forecasts',()=>{
 const s=make(Array.from({length:8},(_,i)=>enemy('s'+i,'swarm',2,7.1+i*.055)));s.nextSpawn=0;
 const options={width:740,height:400,preview:[{row:2,type:'swarm',time:60}]},scale=400/650,before=JSON.stringify({s,options});
 for(const cue of R.packCueLayout(s,'en',options))if(!cue.fallback)assert(!overlap(cue,{x:985,y:375-18/scale,w:108/scale,h:36/scale}));assert.equal(JSON.stringify({s,options}),before);
});
test('ingress keeps a total rather than covering fixed fallback enemy names',()=>{
 const s=make(Array.from({length:8},(_,i)=>enemy('s'+i,'swarm',2,7.4+i*.055)));s.enemies.push(enemy('a','armor',2,6.5));
 const cue=R.packCueLayout(s,'en',{width:1136,height:414})[0];assert(cue.fallback);assert.equal(cue.slots,null);assert.equal(cue.pack.members.length,8);assert(cue.y+cue.h<=375-51);
});
test('blocked composition protects objects; total-only fallback stays truthful where it fits',()=>{
 const blocked=make(['armor','charge','swarm','data'].map((t,i)=>enemy('e'+i,t,2,7.4+i*.04)));blocked.units=[{id:'guard',type:'grok',row:2,col:6,x:6.5,hp:10,fired:3,cooldown:1,status:'normal'}];assert.deepEqual(R.packCueLayout(blocked,'en'),[],'omit only when neither composition nor total has a clear slot');
 const s=make(Array.from({length:8},(_,i)=>enemy('s'+i,'swarm',2,7.4+i*.055)));s.enemies.push(enemy('a','armor',2,6.5));const cues=R.packCueLayout(s,'en',{width:1136,height:414});assert.equal(cues.length,1);assert(cues[0].fallback);assert.equal(cues[0].slots,null);assert.equal(cues[0].pack.members.length,8);assert.deepEqual(cues[0].pack.counts,{swarm:8});
 const totals=[];const ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});R.drawPackCues(ctx,s,'en',t=>totals.push(t),{width:1136,height:414});assert.deepEqual(totals,['×8']);
});
test('live waiting DOM label remains reserved when there are no pending arrivals',()=>{
 const s=make([enemy('a','armor',1,7.1),enemy('s','swarm',1,7.2),{...enemy('c','charge',1,7.25),toRow:2,turnState:'waiting',turnRemaining:1.2}]),options={width:740,height:400,preview:[]};s.nextSpawn=9;const scale=400/650,cues=R.packCueLayout(s,'en',options);assert.equal(cues.length,1);assert(!cues[0].fallback);assert(cues.every(c=>!overlap(c,{x:985,y:293-18/scale,w:108/scale,h:36/scale})));assert.deepEqual(cues[0].pack.counts,{armor:1,swarm:1,charge:1});
});
test('fixed visual envelopes prevent pose, bob and pause from flipping placement',()=>{
 const s=make([enemy('a','armor',2,4),enemy('b','swarm',2,4.1)]);s.units=[{id:'guard',type:'grok',row:2,col:2,x:2.5,hp:10,fired:3,cooldown:1,status:'normal'}];
 const stable=JSON.stringify(R.packCueLayout(s,'en'));
 for(let i=0;i<120;i++){s.time=52+i/60;s.paused=i%2===0;s.units[0].cooldown=(i%18)/10;s.enemies[0].cooldown=(i%13)/10;const cue=R.packCueLayout(s,'en');const snapshot=JSON.parse(stable);assert.deepEqual(cue.map(({pack,...geometry})=>geometry),snapshot.map(({pack,...geometry})=>geometry));}
});
test('layout and draw remain pure during normal/reduced and paused/active modes',()=>{
 const s=make([enemy('a','armor',2,4),enemy('b','swarm',2,4.1)]),ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 for(const paused of [false,true])for(const reducedMotion of [false,true])for(const lang of ['en','zh']){s.paused=paused;const options={width:1136,height:414,lang,reducedMotion,visualTime:100,preview:[]},before=JSON.stringify({s,options});R.draw(ctx,{state:s,definitions:E.definitions,layout:{},preview:[]},options);assert.equal(JSON.stringify({s,options}),before);}
});

const UI=require('./td-lanes-ui');
const armorLabels={en:'Armored data (35% damage reduction; Claude bypasses armor)',zh:'装甲（减伤35%，Claude无视）'};
test('only the armor legend explains resistance and the explicit Claude exception',()=>{
 for(const lang of ['en','zh'])assert.deepEqual(UI.enemyCountLegend(lang),{
  intro:lang==='zh'?'在场敌群计数：':'Live pack counts: ',
  types:[['armor',armorLabels[lang]],['charge',lang==='zh'?'冲锋':'Charge'],['swarm',lang==='zh'?'碎片':'Fragment'],['data',lang==='zh'?'数据':'Data']],
  note:lang==='zh'?'。只有 ×N 时表示总数；不代表共享血量或单发命中数。':'. Plain ×N is total only. Counts are not shared HP or targets per shot.'
 });
});
test('legend percentage matches actual legal armor hits and Claude bypasses it',()=>{
 // Public actions only: the existing second main opens with armor in lane 1.
 // Read the displayed percentage, so a rule change cannot leave stale copy green.
 const reductions=['en','zh'].map(lang=>Number(UI.enemyCountLegend(lang).types[0][1].match(/(\d+)%/)[1])/100);
 assert.deepEqual(reductions,[E.definitions.enemies.armor.armor,E.definitions.enemies.armor.armor]);
 assert.deepEqual(E.levels[1].spawns[0],{row:0,type:'armor',time:4});
 for(const type of E.roster){
  const s=E.create(1,{seed:1});assert(E.deploy(s,0,0,type).ok);assert(E.start(s).ok);let hit,priorHP,shot;
  for(let i=0;i<600&&s.phase==='battle'&&!hit;i++){
   const hp=new Map(s.enemies.map(e=>[e.id,e.hp])),events=E.step(s,1/60);
   for(const event of events)if(event.type==='shot'&&event.unitType===type&&!shot)shot={...s.shots.find(sh=>sh.id===event.shotId)};
   hit=events.find(event=>event.type==='hit'&&event.enemyType==='armor');if(hit)priorHP=hp.get(hit.target);
  }
  assert(hit,type+' must produce a real armor hit');assert.equal(hit.unitType,type);assert.equal(hit.shotId,shot.id);assert.equal(shot.damageScale,1);
  assert.equal(s.units[0].status,'normal');assert.equal(hit.source,s.units[0].id);
  const nominal=E.definitions.units[type].damage,remaining=s.enemies.find(e=>e.id===hit.target);
  for(const reduction of reductions)assert(Math.abs(hit.amount-nominal*(type==='claude'?1:1-reduction))<1e-9,type+' actual damage must agree with the legend');
  assert(Math.abs(priorHP-remaining.hp-hit.amount)<1e-9,'the real enemy loses the reported HP');
 }
});
test('upcoming prefix is exactly two lines, localized and distinct from current enemies',()=>{
 const p={type:'armor',row:2,time:10};assert.equal(UI.upcomingLabel(E,p,5,'en'),'Next in 5s\nArmored data');assert.equal(UI.upcomingLabel(E,p,5,'zh'),'下一批 5s\n装甲数据');
 const route={...p,type:'charge',toRow:3};assert.equal(UI.upcomingLabel(E,route,9.2,'en'),'Next in 1s\nCharge → 4*');assert.equal(UI.upcomingLabel(E,route,15,'zh'),'下一批 0s\n冲锋 → 4*');assert.equal(UI.upcomingLabel(E,null,0,'en'),'');
 for(const lang of ['en','zh'])for(let level=0;level<E.levels.length;level++)for(const p of E.preview(level))assert.equal(UI.upcomingLabel(E,p,0,lang).split('\n').length,2);
});
test('existing notes reuse the exact four vector glyphs and explain total-only / HP / hit limits',()=>{
 const saved=global.TDLanesRenderer,drawn=[],ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});global.TDLanesRenderer={enemyTypeGlyph:(c,type,x,y)=>{drawn.push(type);R.enemyTypeGlyph(c,type,x,y);}};
 const element=tag=>({tag,children:[],textContent:'',style:{},setAttribute(k,v){this[k]=v;},appendChild(n){this.children.push(n);},...(tag==='canvas'?{getContext:()=>ctx}:{})}),doc={createElement:element};
 for(const lang of ['en','zh']){drawn.length=0;const parent=element('div');UI.appendEnemyCountLegend(doc,parent,lang);assert.equal(parent.children.length,1);assert.equal(parent.children[0].className,'enemy-count-legend');assert.deepEqual(drawn,['armor','charge','swarm','data']);const text=parent.children[0].children.map(e=>e.textContent).join('');assert.match(text,lang==='en'?/Plain ×N is total only/:/只有 ×N 时表示总数/);assert.match(text,lang==='en'?/not shared HP or targets per shot/:/不代表共享血量或单发命中数/);assert.equal(parent.children[0].children.filter(e=>e.tag==='canvas'&&e['aria-hidden']==='true').length,4);for(const icon of parent.children[0].children.filter(e=>e.tag==='canvas'))assert.deepEqual(icon.style,{position:'static',inset:'auto',display:'inline-block',width:'20px',height:'20px',verticalAlign:'middle',pointerEvents:'none'});}
 // Exercise the actual stylesheet hazard and the glyph-present branch together.
 const css=require('node:fs').readFileSync(__dirname+'/td-lanes.css','utf8'),globalCanvas=css.match(/canvas\{([^}]+)\}/)[1];assert.match(globalCanvas,/position:absolute/);assert.match(globalCanvas,/width:100%/);assert.match(globalCanvas,/height:100%/);assert.match(globalCanvas,/inset:0/);
 const parent=element('div');UI.appendEnemyCountLegend(doc,parent,'en');for(const icon of parent.children[0].children.filter(e=>e.tag==='canvas')){const cascade=Object.fromEntries(globalCanvas.split(';').filter(Boolean).map(d=>d.split(':')));Object.assign(cascade,icon.style);assert.deepEqual([cascade.position,cascade.inset,cascade.display,cascade.width,cascade.height,cascade.verticalAlign,cascade.pointerEvents],['static','auto','inline-block','20px','20px','middle','none']);assert.equal(icon.width,20);assert.equal(icon.height,20);}
 global.TDLanesRenderer={draw(){}};const fallback=element('div');UI.appendEnemyCountLegend(doc,fallback,'en');assert.equal(fallback.children[0].children.filter(e=>e.tag==='canvas').length,0);assert.match(fallback.children[0].children.map(e=>e.textContent).join(''),/Armored data.*Charge.*Fragment.*Data/);
 global.TDLanesRenderer=saved;
});
test('expanded bilingual notes retain their summary, focus, open state and existing icon/text structure',()=>{
 const fs=require('node:fs'),html=fs.readFileSync(__dirname+'/index.html','utf8');
 assert.match(html,/<details id="forecast"><summary id="forecast-title"><\/summary>/,'native details starts closed with its original summary');
 const source=fs.readFileSync(__dirname+'/td-placement-preview.test.js','utf8').split("test('pure preview")[0];
 const harness=Function('require','__dirname',source+'\nreturn nativeHarness;')(require,__dirname);
 for(const lang of ['en','zh'])for(const renderer of [true,false]){
  const h=harness({level:1,lang,renderer}),notes=h.nodes.forecast,summary=h.nodes['forecast-title'],before=JSON.stringify(h.state);
  const check=locale=>{
   const legends=h.nodes['forecast-content'].children.filter(n=>n.className==='enemy-count-legend');assert.equal(legends.length,1);
   const children=legends[0].children,info=UI.enemyCountLegend(locale),labels=children.filter(n=>n.tag==='span').map(n=>n.textContent);
   assert.deepEqual(labels,[info.intro,armorLabels[locale],' · ',info.types[1][1],' · ',info.types[2][1],' · ',info.types[3][1],info.note]);
   const icons=children.filter(n=>n.tag==='canvas');assert.equal(icons.length,renderer?4:0);
   if(renderer){assert.equal(children[1].tag,'canvas');assert.equal(children[2].textContent,armorLabels[locale]);for(const icon of icons)assert.equal(icon.getAttribute('aria-hidden'),'true');}
   assert.equal(h.nodes['forecast-title'],summary);assert.equal(h.nodes.forecast,notes);
   assert.equal(summary.textContent,locale==='zh'?'来袭时间表与玩法说明':'Schedule and game notes');
   assert.equal(JSON.stringify(h.state),before);
  };
  assert.equal(Boolean(notes.open),false);check(lang);h.frame(0);assert.equal(Boolean(notes.open),false);
  // The DOM double does not implement browser default activation. Check that the
  // real key handler does not intercept it, then model only native details.open.
  const nativeToggle=key=>{summary.focus();let prevented=false;h.events.keydown({key,target:summary,preventDefault(){prevented=true;}});assert.equal(prevented,false);assert.equal(summary.onkeydown,undefined);notes.open=!notes.open;h.frame(0);assert.equal(h.doc.activeElement,summary);};
  nativeToggle('Enter');assert.equal(notes.open,true);notes.scrollTop=73;check(lang);
  for(const locale of [lang==='en'?'zh':'en',lang]){
   h.nodes.language.focus();h.nodes.language.onclick();check(locale);assert.equal(h.doc.activeElement,h.nodes.language);
   assert.equal(notes.open,true);assert.equal(notes.scrollTop,73);summary.focus();h.frame(0);assert.equal(h.doc.activeElement,summary);
  }
  h.reset();for(let i=0;i<120;i++)h.frame(i*16);assert.equal(h.writes.length,0);assert.equal(h.storageWrites.length,0);assert.equal(notes.open,true);assert.equal(h.doc.activeElement,summary);
  nativeToggle(' ');assert.equal(notes.open,false);h.nodes.language.onclick();check(lang==='en'?'zh':'en');assert.equal(notes.open,false);assert.equal(h.doc.activeElement,summary);
 }
});
test('mounted prep totals and live detour waits remain unchanged; paused upcoming text stays frozen',()=>{
 const fs=require('node:fs'),source=fs.readFileSync(__dirname+'/td-lanes-dom-writes.test.js','utf8').split('function count(h)')[0],saved=global.TDLanesRenderer,harness=Function('require','__dirname',source+'\nreturn harness;')(require,__dirname);
 const h=harness(0,UI);assert.equal(h.nodes['row-preview'].children[0].textContent,UI.lanePlan(E.preview(0),0,'en'));assert.equal(h.nodes['forecast-content'].children.filter(n=>n.className==='enemy-count-legend').length,1);h.nodes.start.onclick();assert.equal(h.nodes['row-preview'].children[0].textContent,'Next in 4s\nData blob');h.nodes.pause.onclick();const text=h.nodes['row-preview'].children[0].textContent,before=JSON.stringify(h.app.controller.state);h.reset();for(let i=0;i<120;i++)h.app.frame(i*16);assert.equal(h.nodes['row-preview'].children[0].textContent,text);assert.equal(JSON.stringify(h.app.controller.state),before);assert.equal(h.writes.length,0);
 h.nodes.language.onclick();assert.equal(h.nodes['row-preview'].children[0].textContent,'下一批 4s\n数据团');assert.equal(JSON.stringify(h.app.controller.state),before);
 const d=harness(3,UI);d.nodes.grid.children[12].onclick();d.nodes.start.onclick();for(let i=0;i<500&&!d.app.controller.state.enemies.some(e=>e.turnState==='waiting');i++)d.app.controller.tick(1/60);d.app.render();assert.match(d.nodes['row-preview'].children[1].textContent,/^Wait [\d.]+s → 3$/);assert(!d.nodes['row-preview'].children[1].textContent.includes('Next in'));global.TDLanesRenderer=saved;
});
console.log(tests+' focused enemy identity groups passed.');
