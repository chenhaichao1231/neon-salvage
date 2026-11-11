/* Local UI adapter. Bookmark saves only stage access and language, never battle state.
Renderer hook: TDLanesRenderer.draw(ctx,{state,definitions,layout},
 {width,height,lang,reducedMotion}). It must not mutate engine state.
Canvas world is 1120x650; lane cells start (140,170), size120x82.
*/
(function(root){'use strict';
const layout={width:1120,height:650,left:140,top:170,cw:120,ch:82,rows:5,cols:7};
function transform(width,height){const scale=Math.min(width/layout.width,height/layout.height);return{scale,x:(width-layout.width*scale)/2,y:(height-layout.height*scale)/2};}
// Existing row labels are at most 108 CSS px wide. Use only spare letterbox space;
// keep their old in-world placement when 8px gaps on both sides cannot fit.
function forecastLeft(width,height){const t=transform(width,height),right=t.x+layout.width*t.scale;return width-right>=124?right+8:t.x+985*t.scale;}
function hitCell(clientX,clientY,rect){const t=transform(rect.width,rect.height),x=(clientX-rect.left-t.x)/t.scale,y=(clientY-rect.top-t.y)/t.scale,col=Math.floor((x-layout.left)/layout.cw),row=Math.floor((y-layout.top)/layout.ch);return row>=0&&row<5&&col>=0&&col<7?{row,col}:null;}
// Read-only direction preview, available only where this selected guard can currently deploy.
// It does not reserve GPU, predict targets, or promise a moving enemy will stay ahead.
function placementLane(E,s,type,cell){
 const row=cell?.row,col=cell?.col,d=E.definitions.units[type];
 if(!['prepare','battle'].includes(s.phase)||!Number.isInteger(row)||!Number.isInteger(col)||row<0||row>=5||col<0||col>=7||!d||!s.unlocked.includes(type)||s.compute<d.cost||s.units.some(u=>u.row===row&&u.col===col))return null;
 return{row,start:Math.max(0,col+.5-.1),end:7.8};
}
// The standalone fallback retains the same guide when the art renderer is unavailable.
function drawPlacementLane(ctx,lane){
 if(!lane)return;
 const x=140+lane.start*120,end=140+lane.end*120,y=170+lane.row*82;
 ctx.save();ctx.fillStyle='#b9edff21';ctx.fillRect(x,y+5,end-x,72);
 const strokeGuide=()=>{ctx.strokeStyle='#243655b8';ctx.lineWidth=4;ctx.stroke();ctx.strokeStyle='#c9efffb8';ctx.lineWidth=2;ctx.stroke();};
 ctx.setLineDash([7,7]);ctx.beginPath();ctx.moveTo(x,y+67);ctx.lineTo(end-12,y+67);strokeGuide();ctx.setLineDash([]);
 ctx.beginPath();ctx.moveTo(end-25,y+60);ctx.lineTo(end-12,y+67);ctx.lineTo(end-25,y+74);strokeGuide();ctx.restore();
}
// Pure presentation: all countdowns are remaining simulation seconds, never wall time.
function supplyText(s,lang){
 const t=(zh,en)=>lang==='zh'?zh:en,seconds=n=>Math.max(0,Math.ceil(n));
 if(s.phase==='prepare')return t('补给 +30 / 每6战斗秒 · 4秒后自动领取','Supply +30 / 6 battle s · auto-credit after 4s');
 if(s.phase==='won')return t('补给已全部到账','All supply received');
 if(s.phase==='lost')return t('补给已停止 · 战斗结束','Supply stopped · battle over');
 const pending=s.gpus.filter(g=>!g.collected),last=s.gpuCount>=s.gpuQuota;
 let label;
 if(pending.length){const value=pending.reduce((sum,g)=>sum+g.value,0),due=Math.min(...pending.map(g=>g.born+4));
  label=t((last?'最后补给':'补给')+' +'+value+' 可领取 · '+seconds(due-s.time)+'秒后自动到账',(last?'Last supply':'Supply')+' +'+value+' available · auto-credit in '+seconds(due-s.time)+'s');
 }else label=last?t('补给已全部到账','All supply received'):t('下次补给 +30 · '+seconds(s.nextGpu-s.time)+'秒后','Next supply +30 · in '+seconds(s.nextGpu-s.time)+'s');
 return (s.paused?t('已暂停 · ','Paused · '):'')+label;
}
function supplyExplanation(lang){return lang==='zh'?'补给计时使用战斗时间；暂停时冻结，2×时每现实秒推进2战斗秒。暂停时仍可领取现有显卡、半价撤离一次；点空格立即花费GPU部署。新补给和自动到账需继续推进时间；显卡不点击则4战斗秒后自动到账。':'Supply uses battle time: paused clocks freeze; 2× advances two battle seconds per real second. While paused, collect existing GPUs or use the one half-price withdrawal; clicking an empty cell spends GPU immediately. Resume to wait for new supply or automatic credit after four battle seconds.';}
function gpuFlight(g,time,reduced){const endX=layout.left+g.x*layout.cw,age=Math.max(0,time-g.born),progress=reduced?1:Math.min(1,age/.8),supplier=Math.max(0,Math.round(g.born/6)-1)%4;return{x:(275+supplier*190)*(1-progress)+endX*progress,y:70+62*progress-Math.sin(progress*Math.PI)*44,angle:progress===1?0:(1-progress)*-18};}
function effectsFromEvents(events,clock){const lives={'cluster-impact':.36,shot:.2,hit:.28,kill:.65,'unit-hit':.35,'unit-lost':.7,leak:.5};return events.filter(e=>lives[e.type]&&Number.isFinite(e.x)&&Number.isInteger(e.row)).map((e,i)=>({...e,born:clock,life:lives[e.type],variant:i%5}));}
// Cosmetic result-screen tail only. Never writes simulation state; render-only calls do not advance it.
function terminalClock(){let state=null,phase=null,last=0,elapsed=0;return(s,clock)=>{
 const terminal=s.phase==='won'||s.phase==='lost';
 if(!terminal){state=null;phase=null;last=clock;elapsed=0;return 0;}
 if(state!==s||phase!==s.phase||clock<last){state=s;phase=s.phase;last=clock;elapsed=0;return 0;}
 if(!s.paused)elapsed+=Math.max(0,clock-last);
 last=clock;return elapsed;
};}
// Preparation labels are whole-stage planned counts, not live enemy counts.
function detourDestination(p,lang){return Number.isInteger(p.toRow)?(lang==='zh'?' → 第'+(p.toRow+1)+'行（触发后）':' → Lane '+(p.toRow+1)+' (if triggered)'):'';}
function lanePlan(schedule,row,lang){const names={data:['数据','Data'],swarm:['碎片','Fragment'],armor:['装甲','Armor'],charge:['冲锋','Charge']},counts={};for(const p of schedule)if(p.row===row){const key=p.type+'|'+(p.toRow??'');if(!counts[key])counts[key]={p,count:0};counts[key].count++;}const entries=Object.values(counts);if(!entries.length)return '';if(entries.length>3){const total=entries.reduce((n,e)=>n+e.count,0);return lang==='zh'?'混合 · '+total+'名\n见时间表':'Mixed · '+total+' foes\nSee schedule';}return entries.map(({p,count})=>(names[p.type]||[p.type,p.type])[lang==='zh'?0:1]+' ×'+count+(Number.isInteger(p.toRow)?' → '+(p.toRow+1)+'*':'')).join('\n');}
function detourGoal(lang,count=2){return lang==='zh'?'拦住全部'+count+'名敌人，漏1名即失败。距本行前方守卫2格内停2秒，仍可受伤，再转向标记邻行一次。':(count===2?'Stop both enemies':'Stop all '+count+' enemies')+'; any leak fails. Within 2 cells of a guard ahead, wait 2s while vulnerable, then turn once to the marked lane.';}
function detourRule(lang,count=2){return lang==='zh'?'可选挑战：拦住全部'+count+'名敌人；漏掉任意1名即挑战未完成。冲锋怪靠近原行前方守卫2格内，停2秒（仍可受伤），然后转到预告的相邻行，只转一次。未触发前无守卫则直行；已蓄力的转行不会被撤离取消。这是敌人机制，不是新AI守卫。':'Optional challenge: '+(count===2?'Stop both enemies':'Stop all '+count+' enemies')+'; any leak fails this challenge. Within 2 cells of a guard ahead in its original lane, a charger waits 2s, still vulnerable, then turns once into the marked adjacent lane. Without a guard before triggering, it goes straight. Withdrawal does not cancel an already waiting turn. This is an enemy rule, not a new AI guard.';}

const Review=root.TDBattleReview||(typeof require==='function'?require('./td-battle-review'):null);
const ReplayStore=root.TDReplayStore||(typeof require==='function'?require('./td-replay-store'):null);
const bookmarkKey='campus-defense-stage-v1';
function validBookmark(v,E){return !!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')==='highestStage,lang,lastStage,version'&&v.version===1&&Number.isInteger(v.lastStage)&&Number.isInteger(v.highestStage)&&v.lastStage>=0&&v.lastStage<=v.highestStage&&v.highestStage<E.levels.length&&['zh','en'].includes(v.lang);}
// Encounter order is append-only. Raw IDs are storage/engine identities, not main ordinals.
function stageIds(E,optional=false){return E.levels.flatMap((d,id)=>!!d.optional===optional?[id]:[]);}
function stageOrdinal(E,level){return stageIds(E,!!E.levels[level].optional).indexOf(level)+1;}
function stageOrder(E){return [...stageIds(E),...stageIds(E,true)];}
// Only these historical drill bookmarks imply main-4 ACCESS, never its completion.
// Keep their compact labels exactly; other optional encounters use their actual names.
const legacyDrills={3:{zh:'绕行',en:'Detour',mainAccess:5},4:{zh:'合流车队',en:'Convoy',mainAccess:5}};
function nextStage(E,level){const mains=stageIds(E),i=mains.indexOf(level);return i>=0&&i+1<mains.length?mains[i+1]:(level+1)%E.levels.length;}
// Keep appended mains within the existing selector width; title and accessible name stay complete.
function stageLabel(E,level,lang){const d=E.levels[level],ordinal=stageOrdinal(E,level),mainName=level===6&&lang==='en'&&d.name.en==='Overlapping fronts'?'Overlap fronts':level===7&&lang==='en'&&d.name.en==='Interleaved pursuit'?'Mixed pursuit':d.name[lang];return d.optional?(lang==='zh'?'可选':'Optional')+ordinal+' · '+(legacyDrills[level]?.[lang]||d.name[lang]):ordinal+' · '+mainName;}
function bookmarkAllows(E,highest,level){
 if(E.levels[level].optional)return level<=highest; // v1 retains its original raw optional frontier.
 const mains=stageIds(E),legacy=E.levels[highest].optional?legacyDrills[highest]?.mainAccess:undefined;
 const frontier=mains.includes(legacy)?legacy:mains.includes(highest)?highest:mains.filter(id=>id<=highest).at(-1);
 return mains.indexOf(level)<=mains.indexOf(frontier);
}
// Preserve the original first two mains' Next-only save timing. From main 3 onward,
// a real win immediately saves access to an existing next main, including appended mains.
// A terminal main has no unseen successor to save; old raw 5 cannot prove that win later.
function victorySuccessor(E,level){const mains=stageIds(E),i=mains.indexOf(level);return i>=2?mains[i+1]:undefined;}
function controller(E,storage){let saved=null,storageNotice=null;try{if(!storage)throw Error('storage');const raw=storage.getItem(bookmarkKey);if(raw!==null){const v=JSON.parse(raw);if(!validBookmark(v,E))throw Error('invalid');saved=v;}}catch(e){storageNotice='unavailable';}
const review=Review?Review.tracker():{result:null,begin(){},reset(){},observe(){}};let highestStage=saved?.highestStage||0;const earnedMainAccess=new Set();let state=E.create(saved?.lastStage||0),lang=saved?.lang||'zh', selected='deepseek',selectedUnit=null,speed=1,message=null;const records=ReplayStore?ReplayStore.create(E,storage):null;let reference=records?.load(state)||null,finished=null,attemptPending=false,viewVersion=0;function resetReference(){viewVersion++;records?.cancel();reference=records?.load(state)||null;finished=null;attemptPending=false;}function save(){try{if(!storage)throw Error('storage');storage.setItem(bookmarkKey,JSON.stringify({version:1,lastStage:state.level,highestStage,lang}));storageNotice=null;}catch(e){storageNotice='unavailable';}}function rememberWin(){const next=state.phase==='won'?victorySuccessor(E,state.level):undefined;if(next!==undefined)earnedMainAccess.add(next);return next;}function available(level){return Number.isInteger(level)&&level>=0&&level<E.levels.length&&(bookmarkAllows(E,highestStage,level)||earnedMainAccess.has(level)||state.phase==='won'&&victorySuccessor(E,state.level)===level); }function switchable(){return state.phase==='prepare'&&state.units.length===0||['won','lost'].includes(state.phase);}return{
 available,get nextStage(){return nextStage(E,state.level);},get review(){return finished?JSON.parse(JSON.stringify(finished)):null;},get viewVersion(){return viewVersion;},get reference(){return reference?JSON.parse(JSON.stringify(reference)):null;},get highestStage(){return highestStage;},get storageNotice(){return storageNotice;},get canSwitch(){return switchable();},
 stage(level){if(!available(level))return{ok:false,reason:'locked'};if(!switchable())return{ok:false,reason:'phase'};rememberWin();state=E.create(level);highestStage=Math.max(highestStage,level);review.reset(level);resetReference();selectedUnit=null;message=null;save();return{ok:true};},
 get state(){return state;},get lang(){return lang;},get selected(){return selected;},get selectedUnit(){return selectedUnit;},get speed(){return speed;},get message(){return message;},
 select(type){if(!state.unlocked.includes(type))return{ok:false,reason:'locked'};selected=type;selectedUnit=null;message=null;return{ok:true};},
 cell(row,col){const unit=state.units.find(u=>u.row===row&&u.col===col);if(unit){selectedUnit=unit.id;message=null;return{ok:true,selected:true};}selectedUnit=null;const result=E.deploy(state,row,col,selected);if(result.ok)selectedUnit=state.units.find(u=>u.row===row&&u.col===col)?.id||null;message=result.ok?null:result.reason;return result;},
 refund(){const emergency=state.phase!=='prepare',r=emergency?E.emergencyWithdraw(state,selectedUnit):E.refund(state,selectedUnit);message=r.ok?(emergency?'withdraw-'+r.amount:null):r.reason;if(r.ok)selectedUnit=null;return r;},
 start(){if(state.phase==='won'){rememberWin();const next=nextStage(E,state.level);state=E.create(next,{seed:state.seed,unlocked:state.unlocked});review.reset(next);resetReference();highestStage=Math.max(highestStage,next);save();selectedUnit=null;message=null;return{ok:true};}const r=E.start(state);if(r.ok){review.begin(state.snapshot,E.preview(state.level));records?.begin(state,reference);attemptPending=true;finished=null;viewVersion++;message=null;}return r;},
 pause(){const r=E.pause(state,!state.paused);if(r.ok)message=null;return r;},visibility(){if(state.phase==='battle')E.pause(state,true);},
 retry(){const r=E.retry(state);if(r.ok){review.reset(state.level);resetReference();selectedUnit=null;message=null;}return r;},
 language(){lang=lang==='zh'?'en':'zh';save();},toggleSpeed(){speed=speed===1?2:1;},
 collect(id){return E.collect(state,id);},tick(dt){const events=E.step(state,dt*speed);review.observe(events,state);if(attemptPending&&['won','lost'].includes(state.phase)){attemptPending=false;viewVersion++;const facts=review.result;if(facts){const retained=records?.finish(facts,state);finished={...facts,previous:null,durable:true,...(retained||records?.status(state.level)||{})};}}if(events.some(e=>e.type==='won')){const next=rememberWin();if(next!==undefined&&highestStage<next){highestStage=next;save();}}return events;}
};}
function unitStatus(u,lang){
 const zh=lang==='zh';
 if(u.status==='review')return(zh?'复核离线':'Offline review')+' '+Math.ceil(u.statusRemaining)+'s';
 if(u.status==='rice')return(zh?'吃饭中':'Rice break')+' '+Math.ceil(u.statusRemaining)+'s';
 if(u.status==='weak')return(zh?'思路卡住':'Brain fog')+' '+Math.ceil(u.statusRemaining)+'s';
 if(u.warning){const labels={rice:['准备开饭','Rice break soon'],weak:['即将卡住','Brain fog soon'],review:['复核即将开始','Review soon']};return(labels[u.warning.status]||['预警','Warning'])[zh?0:1]+' '+Math.ceil(u.warning.startsIn)+'s';}
 if(u.type==='grok'){const next=(u.fired||0)%4+1;return(zh?'下一发 ':'Next ')+next+'/4 · '+(next===4?(zh?'烂输出 4':'Weak output 4'):(zh?'溅射 16':'Splash 16'));}
 return '';
}
// Canvas-only policy: ordinary Grok detail follows selection; every warning stays global.
// unitStatus remains complete for selected detail and accessible cell labels.
function canvasUnitStatus(u,lang,selectedUnit=null){
 if(u.type==='grok'&&(!u.status||u.status==='normal')&&!u.warning&&(u.fired||0)%4!==3&&u.id!==selectedUnit)return '';
 return unitStatus(u,lang);
}
// Packet boundaries label the actual spawn data; no blocking inter-wave state.
function phaseGroups(level){const starts=level.phaseStarts||[level.spawns[0]?.time||0];return starts.map((start,i)=>({start,spawns:level.spawns.filter(p=>p.time>=start&&p.time<(starts[i+1]??Infinity))}));}
// Exact presentation arithmetic only. Never round authored times or change schedules.
function forecastDecimal(ticks){const fraction=String(ticks%100n).padStart(2,'0').replace(/0+$/,'');return String(ticks/100n)+(fraction?'.'+fraction:'');}
function forecastTicks(time){
 if(typeof time!=='number'||!Number.isFinite(time)||Object.is(time,-0))return null;
 const match=String(time).match(/^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/);if(!match)return null;
 const ticks=BigInt(match[1])*100n+BigInt((match[2]||'').padEnd(2,'0'));
 return ticks<=BigInt(Number.MAX_SAFE_INTEGER)&&Object.is(Number(forecastDecimal(ticks)),time)?ticks:null;
}
function forecastMetadata(E,p){
 // The old single-row suffix reads inherited routes too; never drop one in a batch.
 if(!p||typeof p!=='object'||Reflect.ownKeys(p).some(k=>!['time','row','type','toRow'].includes(k))||
 ('toRow' in p&&!Object.hasOwn(p,'toRow'))||
 !['time','row','type'].every(k=>Object.hasOwn(p,k))||!Number.isInteger(p.row)||Object.is(p.row,-0)||p.row<0||p.row>=5||
 typeof p.type!=='string'||!Object.hasOwn(E.definitions.enemies,p.type))return null;
 const metadata={row:p.row,type:p.type};
 if(Object.hasOwn(p,'toRow')){
  if(!Number.isInteger(p.toRow)||Object.is(p.toRow,-0)||p.toRow<0||p.toRow>=5||Math.abs(p.toRow-p.row)!==1)return null;
  metadata.toRow=p.toRow;
 }
 return metadata;
}
// Call once per existing phase, in its displayed order. A different event is a
// barrier even at the same time; an irregular maximal run stays wholly individual.
function compactForecast(E,records){
 const lines=[];
 for(let i=0;i<records.length;){
  const metadata=forecastMetadata(E,records[i]),key=metadata&&JSON.stringify(metadata);let end=i+1;
  while(key&&end<records.length&&JSON.stringify(forecastMetadata(E,records[end]))===key)end++;
  const run=records.slice(i,end),times=run.map(p=>forecastTicks(p.time)),known=times.every(t=>t!==null);
  const interval=known&&run.length>=3?times[1]-times[0]:-1n;
  const regular=run.length>=3&&known&&interval>=0n&&times.every((time,n)=>{
   const expanded=times[0]+BigInt(n)*interval;
   return time===expanded&&Object.is(Number(forecastDecimal(expanded)),run[n].time);
  });
  if(regular)lines.push({kind:'batch',...metadata,first:forecastDecimal(times[0]),last:forecastDecimal(times.at(-1)),count:run.length,interval:forecastDecimal(interval)});
  else for(const record of run)lines.push({kind:'single',record});
  i=end;
 }
 return lines;
}
function forecastLine(E,line,lang){
 const p=line.kind==='single'?line.record:line,zh=lang==='zh',lane=zh?'第'+(p.row+1)+'行':'Lane '+(p.row+1),name=E.definitions.enemies[p.type].name[lang];
 if(line.kind==='single')return p.time+'s · '+lane+' · '+name+detourDestination(p,lang);
 const simultaneous=line.interval==='0',time=simultaneous?line.first:line.first+'–'+line.last;
 const timing=simultaneous?(zh?'同时来袭':'simultaneous'):(zh?'每'+line.interval+'s一名':'every '+line.interval+'s');
 return time+'s · '+lane+' · '+name+' ×'+line.count+' · '+timing+detourDestination(p,lang);
}
function phaseText(s,level,lang){
 const zh=lang==='zh',groups=phaseGroups(level),total=level.spawns.length;
 if(level.optional)return(zh?'机制练习 · ':'Mechanic drill · ')+total+(zh?'名敌人':' enemies')+' · '+s.nextSpawn+'/'+total+(zh?'已来袭':' arrived');
 const index=Math.max(0,groups.findLastIndex(g=>g.start<=s.time));
 return(zh?'第'+(index+1)+'/'+groups.length+'段':'Push '+(index+1)+'/'+groups.length)+' · '+(s.phase==='prepare'?(zh?'共'+total+'名敌人':total+' enemies total'):s.nextSpawn+'/'+total+(zh?'已来袭':' arrived')+' · '+s.enemies.filter(e=>e.hp>0).length+(zh?'在场':' active'));
}
// Remaining means only hp-positive enemies after the authoritative final arrival.
// Kills and leaks both reduce this count; terminal outcomes retain ordinary copy.
function waveText(E,s,lang){
 const level=E.levels[s.level],zh=lang==='zh',ordinal=stageOrdinal(E,s.level),total=level.spawns.length;
 if(s.phase==='battle'&&!level.optional&&s.nextSpawn===total){
  const live=s.enemies.filter(e=>e.hp>0).length;
  if(live>0)return zh?'主线 '+ordinal+' · '+(s.paused?'已暂停 · 剩余':'清场：剩余')+live+'名':'Main '+ordinal+' · '+(s.paused?'Paused · '+live+(live===1?' enemy left':' enemies left'):'Clearing '+live+(live===1?' enemy':' enemies'));
 }
 const groups=phaseGroups(level),push=Math.max(0,groups.findLastIndex(g=>g.start<=s.time))+1;
 return(level.optional?(zh?'可选练习 ':'Optional drill '):(zh?'主线 ':'Main '))+ordinal+' · '+(level.optional?(zh?'练习':'Drill'):(zh?'第'+push+'/'+groups.length+'段':'Push '+push+'/'+groups.length))+' · '+s.nextSpawn+'/'+total;
}
// Current-health cue only: no damage prediction or action recommendation.
// Kept in both standalone render paths so missing art/renderer cannot hide it.
function isLowHealth(u,D){const max=D.units[u?.type]?.hp;return !!u&&['deepseek','gpt','claude','grok'].includes(u.type)&&Number.isFinite(u.hp)&&Number.isFinite(max)&&max>0&&u.hp>0&&u.hp<=max*.25;}
function drawLowHealth(ctx,u,D,x,y){const max=D.units[u?.type]?.hp;if(!u||!['deepseek','gpt','claude','grok'].includes(u.type)||!Number.isFinite(u.hp)||!Number.isFinite(max)||max<=0||u.hp<=0||u.hp>max*.5)return;ctx.save();
if(!isLowHealth(u,D)){ctx.fillStyle='#18223d';ctx.fillRect(x-26,y+34,52,4);ctx.fillStyle='#ffcb66';ctx.fillRect(x-26,y+34,52*u.hp/max,4);ctx.restore();return;}
ctx.fillStyle='#fff4ce';ctx.fillRect(x-28,y+32,56,8);
ctx.fillStyle='#18223d';ctx.fillRect(x-26,y+34,52,4);
ctx.fillStyle='#ffcb66';ctx.fillRect(x-26,y+34,52*u.hp/D.units[u.type].hp,4);
// Solid light badge with a dark keyline and geometric !, not color alone.
ctx.fillStyle='#18223d';ctx.fillRect(x-49,y+23,20,20);
ctx.fillStyle='#fff4ce';ctx.fillRect(x-47,y+25,16,16);
ctx.fillStyle='#18223d';ctx.fillRect(x-40,y+27,3,7);ctx.fillRect(x-40,y+36,3,3);
ctx.restore();}
function healthLabel(u,D,lang){return isLowHealth(u,D)?(lang==='zh'?'低生命':'Low HP'):'';}
// Forecasts describe a future arrival; preparation totals and live turn waits are separate.
function upcomingLabel(E,p,time,lang){
 if(!p)return '';
 const zh=lang==='zh',seconds=Math.max(0,Math.ceil(p.time-time)),name=p.type==='charge'?(zh?'冲锋':'Charge'):E.definitions.enemies[p.type].name[lang];
 return(zh?'下一批 ':'Next in ')+seconds+'s\n'+name+(Number.isInteger(p.toRow)?' → '+(p.toRow+1)+'*':'');
}
function enemyCountLegend(lang){const zh=lang==='zh';return{intro:zh?'在场敌群计数：':'Live pack counts: ',types:[['armor',zh?'装甲（减伤35%，Claude无视）':'Armored data (35% damage reduction; Claude bypasses armor)'],['charge',zh?'冲锋':'Charge'],['swarm',zh?'碎片':'Fragment'],['data',zh?'数据':'Data']],note:zh?'。只有 ×N 时表示总数；不代表共享血量或单发命中数。':'. Plain ×N is total only. Counts are not shared HP or targets per shot.'};}
function appendEnemyCountLegend(doc,parent,lang){
 const info=enemyCountLegend(lang),p=doc.createElement('p');p.className='enemy-count-legend';const text=value=>{const span=doc.createElement('span');span.textContent=value;p.appendChild(span);};text(info.intro);
 for(const[type,label]of info.types){if(type!=='armor')text(' · ');if(root.TDLanesRenderer?.enemyTypeGlyph){const icon=doc.createElement('canvas'),context=icon.getContext?.('2d');if(context){icon.width=20;icon.height=20;icon.className='enemy-legend-icon';icon.setAttribute('aria-hidden','true');Object.assign(icon.style,{position:'static',inset:'auto',display:'inline-block',width:'20px',height:'20px',verticalAlign:'middle',pointerEvents:'none'});root.TDLanesRenderer.enemyTypeGlyph(context,type,10,10);p.appendChild(icon);}}text(label);}
 text(info.note);parent.appendChild(p);
}

function mount(E,doc,win){const $=id=>doc.getElementById(id),c=controller(E,(()=>{try{return win.localStorage;}catch(e){return null;}})()),canvas=$('scene'),ctx=canvas.getContext('2d'),cells=[],cardNodes={},tokenNodes=new Map(),rowNodes=[],colors={deepseek:'#75d8ed',gpt:'#d3c6ff',claude:'#f5b375',grok:'#a8f0a0',gemini:'#bca4f4'},icons={deepseek:'◈',gpt:'✧',claude:'▤',grok:'✹',gemini:'✦'};let visualTime=0,effects=[],effectState=c.state,lastEffectTime=0,last=null,lastKey='',reduced=!!win.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
// One transient candidate, owned by the last input modality; never persisted in the controller.
let candidate=null,inputMode='keyboard',candidateInput=null,candidateState=c.state,candidatePhase=c.state.phase,candidateTime=c.state.time;
function clearCandidate(){candidate=null;candidateInput=null;}
function currentPlacementLane(){
 const s=c.state;
 if(doc.hidden||s!==candidateState||s.phase!==candidatePhase||s.time<candidateTime)clearCandidate();
 candidateState=s;candidatePhase=s.phase;candidateTime=s.time;
 // Keep physical intent across temporary GPU/unlock changes, but never revive an occupied cell.
 if(candidate&&s.units.some(u=>u.row===candidate.row&&u.col===candidate.col))clearCandidate();
 return placementLane(E,s,c.selected,candidate);
}
function previewCell(row,col,modality){
 currentPlacementLane();
 if(candidate?.row===row&&candidate.col===col&&candidateInput===modality)return;
 candidate={row,col};candidateInput=modality;draw();
}
function leaveCell(row,col,modality){if(candidate?.row===row&&candidate.col===col&&candidateInput===modality){clearCandidate();draw();}}
// Capture pointer intent before the browser focuses a button. Touch never creates fake hover.
doc.addEventListener('pointerdown',e=>{inputMode='pointer';if(e.pointerType==='touch'||candidateInput==='keyboard'){clearCandidate();draw();}},true);
doc.addEventListener('keydown',e=>{
 if(e.altKey||e.ctrlKey||e.metaKey||!['Tab','Enter',' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
 const focused=cells.find(cell=>cell.el===doc.activeElement);
 if(e.key.startsWith('Arrow')){
  if(e.shiftKey||e.isComposing||doc.hidden||!focused||focused.el.disabled||!['prepare','battle'].includes(c.state.phase))return;
  inputMode='keyboard';e.preventDefault();
  const row=Math.max(0,Math.min(layout.rows-1,focused.row+(e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:0))),col=Math.max(0,Math.min(layout.cols-1,focused.col+(e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0)));
  // Focus only: native activation remains the separate, paid deployment action.
  if(row!==focused.row||col!==focused.col)cells[row*layout.cols+col].el.focus();else previewCell(row,col,'keyboard');
  return;
 }
 inputMode='keyboard';
 if(focused)previewCell(focused.row,focused.col,'keyboard');else if(candidate){clearCandidate();draw();}
},true);
win.addEventListener('blur',()=>{clearCandidate();draw();});
const terminalTime=terminalClock();let terminalElapsed=0,referenceViewKey='',referenceView=null;
function cachedReferenceView(){const key=c.viewVersion+'|'+c.lang+'|'+c.state.phase;if(key!==referenceViewKey){referenceViewKey=key;const result=c.review,prior=c.state.phase==='prepare'?c.reference:null;referenceView={result,reviewText:Review?Review.lines(result,c.lang).join('\n'):'',prior,priorText:Review?.referenceLines?Review.referenceLines(prior,c.lang).join(' '):''};}return referenceView;}
const t=(zh,en)=>c.lang==='zh'?zh:en,n=x=>x?.[c.lang]||'';
function button(parent,text,cls,fn){const el=doc.createElement('button');el.textContent=text;el.className=cls;el.onclick=fn;parent.appendChild(el);return el;}
for(let row=0;row<5;row++)for(let col=0;col<7;col++){
 const el=button($('grid'),'','cell',()=>{const result=c.cell(row,col);if(result.ok)clearCandidate();render();});
 el.onpointerenter=el.onpointermove=e=>{if(e.pointerType==='mouse'||e.pointerType==='pen'&&!e.buttons){inputMode='pointer';previewCell(row,col,'pointer');}};
 el.onpointerleave=()=>leaveCell(row,col,'pointer');
 el.onpointercancel=()=>leaveCell(row,col,'pointer');
 el.onfocus=()=>{if(inputMode==='keyboard')previewCell(row,col,'keyboard');};
 el.onblur=()=>leaveCell(row,col,'keyboard');
 cells.push({row,col,el});
}
for(const [id,d]of E.roster.map(id=>[id,E.definitions.units[id]])){const el=button($('cards'),'','unit-card',()=>{c.select(id);render();});const icon=doc.createElement('span');icon.className='portrait portrait-'+id;icon.textContent='';icon.setAttribute('aria-hidden','true');icon.style.color=colors[id];const title=doc.createElement('strong'),cost=doc.createElement('small');el.append(icon,title,cost);cardNodes[id]={el,title,cost};}
for(let row=0;row<5;row++){const el=doc.createElement('span');el.className='row-label';$('row-preview').appendChild(el);rowNodes.push(el);}
// Ignore the second pointer click and held-key repeats when Next becomes Start.
// No timeout or disabled state survives the transition; a new activation still works.
$('start').onclick=e=>{if(e?.detail>1)return;c.start();last=null;render();};
$('start').onkeydown=e=>{if(e.repeat&&(e.key==='Enter'||e.key===' '))e.preventDefault();};$('pause').onclick=()=>{c.pause();last=null;render();};$('retry').onclick=()=>{c.retry();last=null;render();};$('speed').onclick=()=>{c.toggleSpeed();render();};$('language').onclick=()=>{c.language();render();};
const stageOptions=new Map();
for(const i of stageOrder(E)){const option=doc.createElement('option');option.value=String(i);stageOptions.set(i,option);$('stage-select').appendChild(option);}
$('stage-select').onchange=()=>{c.stage(Number($('stage-select').value));last=null;render();};
$('refund').onclick=()=>{c.refund();render();};
doc.addEventListener('visibilitychange',()=>{if(doc.hidden){clearCandidate();c.visibility();}last=null;render();});
// Scrolling/resizing can move the cell beneath a stationary pointer. Invalidate only
// pointer intent; a real pointer event re-arms it, while keyboard focus stays logical.
doc.addEventListener('scroll',()=>{if(candidateInput==='pointer'){clearCandidate();draw();}},true);
win.addEventListener('resize',()=>{if(candidateInput==='pointer')clearCandidate();draw();position();});win.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change',e=>{reduced=e.matches;draw();});
// Compare the actual DOM value each time: no render cache can hide later state or asset changes.
function setProp(node,key,value){if(node[key]!==value)node[key]=value;}
function setAttr(node,key,value){if(node.getAttribute(key)!==value)node.setAttribute(key,value);}
// CSSOM may serialize fractional values differently from the requested string.
// Remember intent and readback per inline property, but always inspect the DOM
// so external edits are repaired. This cache never controls rendering or state.
const styleWrites=new WeakMap();
function setStyle(style,key,value){
 let values=styleWrites.get(style);if(!values){values=Object.create(null);styleWrites.set(style,values);}
 const actual=style[key],last=values[key];
 if(last&&last.requested===value&&last.actual===actual)return;
 if(actual!==value)style[key]=value;
 values[key]={requested:value,actual:style[key]};
}
function position(){const r=canvas.getBoundingClientRect(),tr=transform(r.width,r.height);for(const {row,col,el}of cells){setStyle(el.style,'left',(tr.x+(layout.left+col*120)*tr.scale)+'px');setStyle(el.style,'top',(tr.y+(layout.top+row*82)*tr.scale)+'px');setStyle(el.style,'width',120*tr.scale+'px');setStyle(el.style,'height',82*tr.scale+'px');}for(const row of [0,1,2,3,4]){setStyle(rowNodes[row].style,'left',forecastLeft(r.width,r.height)+'px');setStyle(rowNodes[row].style,'top',(tr.y+(211+row*82)*tr.scale)+'px');}for(const [id,el]of tokenNodes){const g=c.state.gpus.find(g=>g.id===id);if(g){const flight=gpuFlight(g,c.state.time,reduced);setStyle(el.style,'left',(tr.x+flight.x*tr.scale)+'px');setStyle(el.style,'top',(tr.y+flight.y*tr.scale)+'px');setStyle(el.style,'transform','translate(-50%,-50%) rotate('+flight.angle+'deg)');}}}
function setStatus(id,text){setProp($(id),'textContent',text);}
function render(){const s=c.state;terminalElapsed=terminalTime(s,visualTime);const view=cachedReferenceView(),result=view.result;setProp($('battle-review'),'hidden',!result||!['won','lost'].includes(s.phase));setProp($('review-title'),'textContent',t('查看本局记录','View battle facts'));setStatus('review-content',view.reviewText);if(effectState!==s||s.time<lastEffectTime){effects=[];effectState=s;lastEffectTime=s.time;}setProp(doc.documentElement,'lang',c.lang==='zh'?'zh-CN':'en');setProp($('title'),'textContent',t('校园防线','Campus Defense'));setProp(doc,'title',$('title').textContent);setProp($('language'),'textContent',c.lang==='zh'?'EN':'中文');setAttr($('language'),'aria-label',t('切换到英文','Switch to Chinese'));
setProp($('stage-label'),'textContent',t('关卡','Stage'));setAttr($('stage-select'),'aria-label',t('选择可用关卡：','Choose an available stage: ')+E.levels[s.level].name[c.lang]);setAttr($('stage-select'),'title',E.levels[s.level].name[c.lang]);setProp($('stage-select'),'disabled',!c.canSwitch);setProp($('stage-select'),'value',String(s.level));for(let i=0;i<E.levels.length;i++){const option=stageOptions.get(i);setProp(option,'disabled',!c.available(i));setAttr(option,'aria-label',E.levels[i].name[c.lang]+(!c.available(i)?t(' · 未解锁',' · Locked'):''));setAttr(option,'title',E.levels[i].name[c.lang]);setProp(option,'textContent',stageLabel(E,i,c.lang)+(!c.available(i)?t(' · 未解锁',' · Locked'):''));}setStatus('storage-note',c.storageNotice?t('书签不可用或已损坏；仍可游玩。本次进度可能无法保留。','Bookmark unavailable or invalid; play still works. This visit may not be saved.'):t('记住关卡与语言；刷新从180 GPU空阵开始。','Stages and language saved here; refresh: empty setup, 180 GPU.'));
setStatus('supply-status',supplyText(s,c.lang));setStatus('supply-explanation',supplyExplanation(c.lang));
setProp($('gpu'),'textContent','GPU '+s.compute);setProp($('core'),'textContent',t('核心 ','Core ')+s.core+'/5');const level=E.levels[s.level];setProp($('wave'),'textContent',waveText(E,s,c.lang));setAttr($('wave'),'aria-label',phaseText(s,level,c.lang));
let startLabel=s.phase==='won'?(c.nextStage===0?t('重玩首关','Replay first'):E.levels[c.nextStage].optional?t('尝试可选练习','Try optional drill'):t('下一主线 · ','Next main · ')+E.levels[c.nextStage].name[c.lang]):t('开始入侵','Start wave');setProp($('start'),'textContent',startLabel);setProp($('start'),'hidden',!['prepare','won'].includes(s.phase));
setProp($('pause'),'hidden',s.phase!=='battle');setProp($('pause'),'textContent',s.paused?t('继续','Resume'):t('暂停','Pause'));setProp($('speed'),'textContent',c.speed+'×');setAttr($('speed'),'aria-label',t('切换游戏速度','Change game speed'));setProp($('retry'),'textContent',s.phase==='won'?t('再试本关','Try this stage again'):t('重试本关','Retry stage'));setProp($('retry'),'disabled',!['battle','lost','won'].includes(s.phase));
let goal=s.phase==='prepare'?(n(E.levels[s.level].brief)||t('选角色，再点格子部署；准备好后开始。','Choose a character, then a cell. Start when ready.')):s.phase==='lost'?t('核心失守。重试可回到开战前，调整部署。','Core lost. Retry restores your pre-wave layout and GPU.'):s.phase==='won'?t('守住了：核心 '+s.core+'/5，被击败 '+(s.stats.unitsLost||0)+' 名'+(s.stats.emergencyCount?'，撤离 '+s.stats.emergencyCount+' 名（退回 '+s.stats.emergencyRefunds+' GPU）':'')+'，部署花费 '+(E.economy.initial+s.stats.earned+(s.stats.emergencyRefunds||0)-s.compute)+' GPU，战斗用时 '+s.time.toFixed(1)+' 秒。再试本关，比较省钱与快清的不同布阵。','Held: core '+s.core+'/5, '+(s.stats.unitsLost||0)+' guards defeated'+(s.stats.emergencyCount?', '+s.stats.emergencyCount+' withdrawn ('+s.stats.emergencyRefunds+' GPU refunded)':'')+', '+(E.economy.initial+s.stats.earned+(s.stats.emergencyRefunds||0)-s.compute)+' GPU spent, '+s.time.toFixed(1)+'s battle time. Retry to compare cheaper and faster formations.'):s.paused?t('已暂停 · 可部署、领取、撤离；点空格立即扣费。','Paused: deploy, collect, withdraw. Empty cells spend GPU.'):t('守住左侧核心。GPU可点击，4秒后自动到账。','Protect the left core. Tap GPU drops, or receive them automatically after 4s.');
const enemyCount=E.levels[s.level].spawns.length,challengeTarget=t('拦住全部'+enemyCount+'名敌人；漏掉任意1名即挑战未完成。',(enemyCount===2?'Stop both enemies':'Stop all '+enemyCount+' enemies')+'; any leak fails this challenge. ');
if(E.levels[s.level].optional){if(s.phase==='prepare')goal=enemyCount===2?detourGoal(c.lang,enemyCount):t('拦住全部'+enemyCount+'名敌人，漏1名即失败。','Stop all '+enemyCount+' enemies; any leak fails. ')+n(E.levels[s.level].brief);else if(s.phase==='lost'&&s.failureReason==='challenge-leak')goal=t('漏过敌人，挑战未完成。','An enemy escaped; challenge incomplete. ')+challengeTarget+t('重试可恢复开战前部署与GPU。','Retry restores your pre-wave layout and GPU.');else if(s.phase==='battle')goal=challengeTarget+goal;}const reasons={compute:s.phase==='prepare'?t('GPU不足：可全额撤回角色调整，或开始入侵后收取补给。','Not enough GPU: refund a unit to adjust, or start the wave for supplies.'):s.paused?t('GPU不足：可领取现有显卡；继续后等待新补给。','Not enough GPU: collect drops, or resume to wait for supply.'):t('GPU不足，领取显卡或等待下一次补给。','Not enough GPU. Collect drops or wait for supply.'),locked:t('此角色尚未解锁。','This character is not unlocked.'),phase:t('当前阶段无法操作。','Unavailable in this phase.'),cell:t('请选择有效部署格。','Choose a deployment cell.'),occupied:t('这个格子已有角色。','This cell is occupied.'),'emergency-used':t('本局紧急撤离已用完。','Emergency withdrawal used this battle.'),unit:t('请先选择一名存活守卫。','Select a live guard first.'),'withdraw-25':t('已紧急撤离：退回25 GPU，本局次数已用完。','Withdrawn: 25 GPU refunded. Battle allowance used.'),'withdraw-45':t('已紧急撤离：退回45 GPU，本局次数已用完。','Withdrawn: 45 GPU refunded. Battle allowance used.'),'withdraw-60':t('已紧急撤离：退回60 GPU，本局次数已用完。','Withdrawn: 60 GPU refunded. Battle allowance used.'),'withdraw-40':t('已紧急撤离：退回40 GPU，本局次数已用完。','Withdrawn: 40 GPU refunded. Battle allowance used.')};if(c.message&&['prepare','battle'].includes(s.phase)&&!(c.message==='compute'&&s.compute>=E.definitions.units[c.selected].cost))goal=reasons[c.message]||goal;if(root.TDLanesRenderer?.assetState&&Object.keys(root.TDLanesRenderer.files).some(k=>root.TDLanesRenderer.assetState(k)==='failed'))goal+=' '+t('部分美术加载失败，正在使用备用显示。','Some art failed to load; backup visuals are active.');setStatus('goal',goal);
for(const [id,node]of Object.entries(cardNodes)){const d=E.definitions.units[id],locked=!s.unlocked.includes(id);setProp(node.title,'textContent',n(d.name));setProp(node.cost,'textContent',locked?t('通关后解锁','Unlock by clearing'):'GPU '+d.cost);setProp(node.el,'disabled',locked);setAttr(node.el,'aria-pressed',String(c.selected===id));}
setProp($('unit-description'),'textContent',n(E.definitions.units[c.selected].description)+' · GPU '+E.definitions.units[c.selected].cost);
const unit=s.units.find(u=>u.id===c.selectedUnit),status=unit?unitStatus(unit,c.lang):'';setProp($('selected-unit'),'hidden',!unit);setProp($('unit-summary'),'textContent',unit?n(E.definitions.units[unit.type].name)+' · HP '+Math.ceil(unit.hp)+t(' · → 本行前方',' · → Forward in this lane')+(status?' · '+status:'')+(isLowHealth(unit,E.definitions)?' · '+healthLabel(unit,E.definitions,c.lang):''):'');const used=(s.stats.emergencyCount||0)>0,amount=unit?E.definitions.units[unit.type].cost/2:0;setProp($('refund'),'textContent',s.phase==='prepare'?t('全额撤回','Full refund'):used?t('紧急撤离已用完','Emergency withdrawal used'):s.phase!=='battle'?t('紧急撤离不可用','Withdrawal unavailable'):t('紧急撤离 +'+amount+' GPU · 每局1次','Withdraw +'+amount+' GPU · once/battle'));setProp($('refund'),'disabled',s.phase!=='prepare'&&(s.phase!=='battle'||used||!unit||!E.roster.includes(unit.type)));
setAttr($('arena'),'aria-label',t('五行校园防线；窄屏可横向滚动','Five-lane defense; scroll sideways on narrow screens'));setAttr($('grid'),'aria-label',t('部署格','Deployment cells'));setAttr($('tokens'),'aria-label',t('GPU补给','GPU supplies'));setAttr($('cards'),'aria-label',t('选择角色','Choose character'));
for(const {row,col,el}of cells){const u=s.units.find(u=>u.row===row&&u.col===col);setAttr(el,'aria-label',t('第'+(row+1)+'行，第'+(col+1)+'格','Lane '+(row+1)+', cell '+(col+1))+(u?' · '+n(E.definitions.units[u.type].name)+' '+unitStatus(u,c.lang)+(isLowHealth(u,E.definitions)?' · '+healthLabel(u,E.definitions,c.lang):''):t('，部署',', deploy')));setAttr(el,'aria-pressed',String(!!u&&u.id===c.selectedUnit));setProp(el,'disabled',['won','lost'].includes(s.phase));}
for(const g of s.gpus)if(!g.collected&&!tokenNodes.has(g.id)){const el=button($('tokens'),'','drop',()=>{c.collect(g.id);render();});const art=doc.createElement('img');art.src='td-gpu.png';art.alt='';art.setAttribute('aria-hidden','true');const label=doc.createElement('span');el.append(art,label);el._gpuLabel=label;tokenNodes.set(g.id,el);}
for(const [id,el]of tokenNodes){const g=s.gpus.find(x=>x.id===id);if(!g||g.collected){el.remove();tokenNodes.delete(id);}else{setProp(el._gpuLabel,'textContent','GPU +'+g.value);setProp(el,'disabled',s.phase!=='battle');setAttr(el,'aria-label',t('领取','Collect')+' '+g.value+' GPU');}}
const schedule=E.preview(s.level),pending=schedule.slice(s.nextSpawn);for(let row=0;row<5;row++){const p=pending.find(p=>p.row===row);let rowLabel=s.phase==='prepare'?lanePlan(schedule,row,c.lang):upcomingLabel(E,p,s.time,c.lang);const waiting=s.enemies.filter(e=>e.row===row&&e.turnState==='waiting');if(waiting.length){const next=waiting.reduce((a,b)=>a.turnRemaining<b.turnRemaining?a:b);rowLabel=(waiting.length>1?t('蓄力 ×','Wait ×')+waiting.length+'\n'+t('下一只 ','Next '):t('蓄力 ','Wait '))+Math.max(0,next.turnRemaining).toFixed(1)+'s → '+(next.toRow+1);}setProp(rowNodes[row],'textContent',rowLabel);}
const prior=view.prior;setProp($('previous-stage-result'),'hidden',!view.priorText);setProp($('previous-stage-result'),'textContent',view.priorText);setProp($('forecast-title'),'textContent',(prior?.historical||prior?.previous)?t('时间表与上次结果','Schedule & last result'):t('来袭时间表与玩法说明','Schedule and game notes'));setProp($('fiction-note'),'textContent',t('角色行为是虚构游戏设定，不是现实AI产品评测。','Character behavior is fictional gameplay, not an assessment of real AI products.')+' '+t('悬停或键盘聚焦可部署的空格，可预览本行向右射界；点击或键盘激活仍立即花费GPU。','Hover or keyboard-focus an available empty cell to preview rightward fire in that lane; activation still spends GPU immediately.'));
const key=c.lang+'|'+s.level;if(key!==lastKey){lastKey=key;$('forecast-content').replaceChildren();if(E.levels[s.level].optional){const rule=doc.createElement('p');rule.textContent=t('* 箭头为触发后的目标行。','* Arrow marks the destination if triggered. ')+detourRule(c.lang,enemyCount);$('forecast-content').appendChild(rule);}appendEnemyCountLegend(doc,$('forecast-content'),c.lang);for(const [i,group]of phaseGroups(E.levels[s.level]).entries()){const heading=doc.createElement('p');heading.className='phase-heading';heading.textContent=(E.levels[s.level].optional?t('机制练习','Mechanic drill'):t('第'+(i+1)+'段','Push '+(i+1)))+' · '+group.start+'–'+group.spawns.at(-1).time+'s · '+group.spawns.length+t('名敌人',' enemies');$('forecast-content').appendChild(heading);for(const entry of compactForecast(E,group.spawns)){const line=doc.createElement('div');line.className='forecast-spawn';line.textContent=forecastLine(E,entry,c.lang);$('forecast-content').appendChild(line);}}}
setProp($('art-note'),'textContent',t('美术迭代版 · 角色为虚构演绎','Art preview · fictional characters'));
position();draw();}
function draw(){const lane=currentPlacementLane();const r=canvas.getBoundingClientRect(),dpr=Math.min(win.devicePixelRatio||1,2);if(canvas.width!==Math.round(r.width*dpr)||canvas.height!==Math.round(r.height*dpr)){canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);}ctx.setTransform(dpr,0,0,dpr,0,0);
if(root.TDLanesRenderer?.draw){root.TDLanesRenderer.draw(ctx,{state:c.state,definitions:E.definitions,layout,preview:E.preview(c.state.level),selectedUnit:c.selectedUnit,placementLane:lane},{width:r.width,height:r.height,lang:c.lang,reducedMotion:reduced,visualTime,effects,terminalElapsed,supplyOverlay:true});return;}
const tr=transform(r.width,r.height);ctx.fillStyle='#17213a';ctx.fillRect(0,0,r.width,r.height);ctx.translate(tr.x,tr.y);ctx.scale(tr.scale,tr.scale);fallback(ctx,c.state,E,c.lang,{supplyOverlay:true,placementLane:lane,selectedUnit:c.selectedUnit});}
function frame(now){const dt=last===null?0:Math.min(.1,(now-last)/1000);last=now;if(effectState!==c.state||c.state.time<lastEffectTime){effects=[];effectState=c.state;}if(!doc.hidden){if(!c.state.paused)visualTime+=dt;const events=c.tick(dt);effects=effects.filter(e=>visualTime-e.born<e.life).concat(effectsFromEvents(events,visualTime)).slice(-120);lastEffectTime=c.state.time;render();}win.requestAnimationFrame(frame);}render();win.requestAnimationFrame(frame);return {controller:c,render,frame,position};}
function fallback(ctx,s,E,lang,options={}){const text=(v,x,y,size=16,color='#dceaff')=>{ctx.fillStyle=color;ctx.font='600 '+size+'px system-ui';ctx.textAlign='center';ctx.fillText(v,x,y);},box=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);},circle=(x,y,r,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();},colors={deepseek:'#75d8ed',gpt:'#d3c6ff',claude:'#f5b375',grok:'#a8f0a0',gemini:'#bca4f4'};
box(0,0,1120,650,'#273757');for(let i=0;i<8;i++){box(i*150+8,15,120,105,'#344a70');for(let j=0;j<3;j++)box(i*150+20+j*32,30,18,34,'#688db177');}box(0,137,1120,14,'#98b0d4');
for(let i=0;i<4;i++){const x=275+i*190;box(x-56,85,112,50,'#233759');circle(x,62,24,'#e5c5af');circle(x,44,25,['#5a526c','#354a68','#765952','#706b80'][i]);box(x-25,61,50,13,'#e5c5af');circle(x-8,61,2,'#24314c');circle(x+8,61,2,'#24314c');text('GPU',x,117,14,'#ffe5a7');}if(!options.supplyOverlay)text(supplyText(s,lang),560,160,13);
for(let row=0;row<5;row++){text(row+1,118,219+82*row,18);for(let col=0;col<7;col++){box(141+120*col,171+82*row,118,80,(row+col)%2?'#53658b':'#4b5e84');box(145+120*col,175+82*row,110,2,'#9aadd333');}}
const selected=s.units.find(u=>u.id===options.selectedUnit&&u.hp>0);
drawPlacementLane(ctx,options.placementLane||(selected?{row:selected.row,start:Math.max(0,selected.x-.1),end:7.8}:null));
box(22,265,72,200,'#43608c');box(35,245,46,35,'#b3d8ed');box(37,300,42,90,'#77cbe1');text('CORE',58,427,14);for(let i=0;i<s.core;i++)box(22+i*15,478,12,10,'#8be6e7');
box(1088,190,14,365,'#b470d6');text(lang==='zh'?'入侵':'IN',1067,610,15,'#edb8e5');
for(const u of s.units){const x=140+u.x*120,y=211+u.row*82;box(x-20,y-6,40,35,colors[u.type]);circle(x,y-20,19,'#f0d4c0');circle(x,y-29,20,colors[u.type]);box(x-16,y-22,32,13,'#f0d4c0');circle(x-6,y-16,2,'#334464');circle(x+6,y-16,2,'#334464');text({deepseek:'DS',gpt:'GPT',claude:'CL',grok:'Grok',gemini:'GM'}[u.type],x,y+19,13,'#233454');box(x-26,y+34,52,4,'#1e2b43');box(x-26,y+34,52*Math.max(0,u.hp/E.definitions.units[u.type].hp),4,'#90e0be');
if(u.status==='rice'){ctx.fillStyle='#eef7ff';ctx.beginPath();ctx.ellipse(x+25,y+12,17,8,0,0,Math.PI);ctx.fill();circle(x+25,y+9,13,'#fffef4');for(let i=0;i<4;i++)circle(x+16+i*6,y+6,3,'#fff');ctx.strokeStyle='#8c583b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+30,y-12);ctx.lineTo(x+15,y+8);ctx.moveTo(x+36,y-9);ctx.lineTo(x+21,y+10);ctx.stroke();}
if(u.status==='review'){box(x+19,y-39,26,22,'#452a37');text('Ⅱ',x+32,y-23,16,'#ffd9a8');}
if(u.status==='weak'){circle(x+24,y-29,10,'#b9b1d9');circle(x+34,y-35,12,'#c6bfdc');text('…',x+30,y-30,12,'#60547e');}
drawLowHealth(ctx,u,E.definitions,x,y);
const status=canvasUnitStatus(u,lang,options.selectedUnit);if(status){box(x-57,y-58,114,18,'#15233be8');text(status,x,y-45,11,u.warning?'#ffe2a0':'#e8e4fa');}
}
for(const e of s.enemies){const x=140+e.x*120,y=211+e.row*82,r=e.type==='armor'?25:e.type==='swarm'?14:20;box(x-r,y-r,r*2,r*2,'#352244');box(x-r+5,y-r+5,r*2-10,r*2-10,e.type==='armor'?'#8b7ba5':'#754e94');text(e.type==='charge'?'»':e.type==='armor'?'▣':'×',x,y+7,20,'#ffaddd');if(e.turnState==='waiting')text((lang==='zh'?'蓄力 ':'Wait ')+Math.max(0,e.turnRemaining).toFixed(1)+'s → '+(e.toRow+1),x,y-46,13,'#ffe3a7');if(e.slowUntil>s.time)text('❄',x,y-32,15,'#a1e3fb');box(x-22,y+31,44,4,'#202b41');box(x-22,y+31,44*Math.max(0,e.hp/E.definitions.enemies[e.type].hp),4,'#e795b4');}
for(const sh of s.shots){const x=140+sh.x*120,y=211+sh.row*82;box(x-8,y-3,16,6,sh.type==='grok'&&sh.quality==='weak'?'#a68a68':colors[sh.type]);if(sh.type==='grok')text(sh.quality==='weak'?'4':'✹',x,y-9,11);if(sh.type==='claude')box(x-4,y-6,8,12,'#ffe1a4');}if(s.phase==='won'||s.phase==='lost'){box(390,290,340,65,'#12203dec');text(s.phase==='won'?(lang==='zh'?'防线守住了':'LINE HELD'):(E.levels[s.level].optional?(lang==='zh'?'挑战未完成':'CHALLENGE INCOMPLETE'):(lang==='zh'?'核心失守':'CORE LOST')),560,332,24);}}
const api={placementLane,drawPlacementLane,stageIds,stageOrdinal,stageOrder,nextStage,stageLabel,upcomingLabel,enemyCountLegend,appendEnemyCountLegend,phaseGroups,forecastTicks,forecastDecimal,compactForecast,forecastLine,phaseText,waveText,supplyText,supplyExplanation,isLowHealth,drawLowHealth,healthLabel,terminalClock,detourGoal,detourDestination,detourRule,bookmarkKey,validBookmark,lanePlan,layout,transform,forecastLeft,hitCell,gpuFlight,effectsFromEvents,controller,mount,fallback,unitStatus,canvasUnitStatus};root.TDLanesUI=api;if(typeof module==='object'&&module.exports)module.exports=api;if(typeof document!=='undefined'&&root.TDLanes)mount(root.TDLanes,document,window);
})(typeof globalThis!=='undefined'?globalThis:this);
