/* Runtime art renderer. Read-only: visual frames never advance the simulation. */
(function(root){'use strict';
const assets={},assetStates={},files={campus:'td-campus-background.png',ai:'td-ai-sprites.png',suppliers:'td-suppliers.png',enemies:'td-enemies.png',dsActions:'td-ds-actions.png',dsIdle:'td-ds-idle.png',dsAttack:'td-ds-attack.png',gptAttack:'td-gpt-attack.png',gptIdle:'td-gpt-idle.png',claudeActions:'td-claude-actions.png',grokActions:'td-grok-actions.png',fragmentActions:'td-fragment-actions.png',armorActions:'td-armor-actions.png'};
// Enemy action sheets follow stage previews; new guard sheets load only when deployed.
// Gameplay never waits for art. Failed/pending new guards keep distinct named fallbacks.
function requestAsset(key){
 if(assets[key]||typeof Image==='undefined')return;
 const im=new Image();assetStates[key]='loading';
 im.onload=()=>{assetStates[key]='ready';};im.onerror=()=>{assetStates[key]='failed';};
 assets[key]=im;im.src=files[key];
}
for(const key of Object.keys(files)){
 assetStates[key]='not-requested';
 if(!['fragmentActions','armorActions','claudeActions','grokActions'].includes(key))requestAsset(key);
}
const enemyArt=[['swarm','fragmentActions'],['armor','armorActions']];
function requestEnemyArt(preview,enemies){
 for(const [type,key]of enemyArt){
  if(!assets[key]&&(preview.some(e=>e.type===type)||enemies.some(e=>e.hp>0&&e.type===type)))requestAsset(key);
 }
}
function requestGuardArt(units){for(const [type,key]of [['claude','claudeActions'],['grok','grokActions']])if(units.some(u=>u.type===type&&u.hp>0))requestAsset(key);}
const guardColors={deepseek:'#8ceeff',gpt:'#e5c9ff',claude:'#ffd397',grok:'#b6f397'};
const guardNames={deepseek:'DeepSeek',gpt:'GPT',claude:'Claude',grok:'Grok'};
function guardStatus(u,lang){
 if(root.TDLanesUI?.unitStatus)return root.TDLanesUI.unitStatus(u,lang);
 const zh=lang==='zh',labels={rice:['吃饭中','Rice break'],weak:['思路卡住','Brain fog'],review:['复核离线','Offline review']},warnings={rice:['准备开饭','Rice break soon'],weak:['即将卡住','Brain fog soon'],review:['复核即将开始','Review soon']};
 if(labels[u.status])return labels[u.status][zh?0:1]+' '+Math.ceil(u.statusRemaining)+'s';
 if(u.warning)return(warnings[u.warning.status]||['预警','Warning'])[zh?0:1]+' '+Math.ceil(u.warning.startsIn)+'s';
 if(u.type==='grok'){const next=(u.fired||0)%4+1;return(zh?'下一发 ':'Next ')+next+'/4 · '+(next===4?(zh?'烂输出 4':'Weak output 4'):(zh?'溅射 16':'Splash 16'));}
 return '';
}
function ready(im){return !!im&&im.width>0&&im.height>0&&im.complete!==false;}
function assetState(key){const im=assets[key];if(!im)return 'not-requested';if(ready(im))return 'ready';if(assetStates[key]==='failed'||im?.complete===true)return 'failed';return 'loading';}
// All character sheets use the same grounded 96px viewport, never per-pose bounds.
// Battle/paused idle follows simulation time; preparation and terminal idle are cosmetic.
function idleClock(u,s,visualTime){const clock=s.phase==='battle'||s.paused?s.time:visualTime;return (Number.isFinite(clock)?clock:0)+(u.row||0)*.47+(u.col||0)*.23;}
function idleIndex(clock){const cycle=((clock%3.8)+3.8)%3.8;return cycle<1.3?0:cycle<2.8?2:cycle<3.02?1:2;}
function castAge(u,s,interval,terminalElapsed){const terminal=s.phase==='won'||s.phase==='lost';return Math.max(0,interval-u.cooldown)+(terminal&&Number.isFinite(terminalElapsed)?Math.max(0,terminalElapsed):0);}
function canAnticipate(u,s){return s.phase!=='won'&&s.phase!=='lost'&&u.fired>0&&u.cooldown>0&&s.enemies.some(e=>e.hp>0&&e.row===u.row&&e.x>=u.x-.1);}
// Two legible mouthfuls in the existing two-second status: lift, chew, lower bowl.
// Unlike a uniform 5Hz cycle this holds the chew and finishes with the bowl lowered.
function riceIndex(remaining){const age=Math.max(0,Math.min(2,2-remaining));return age<.24?3:age<.62?4:age<.94?5:age<1.16?3:age<1.60?4:5;}
function dsFrame(u,s,visualTime,reduced,interval=1.1,terminalElapsed=0){
 if(u.status==='rice')return{sheet:'dsActions',cols:3,rows:2,index:reduced?4:riceIndex(u.statusRemaining)};
 const since=castAge(u,s,interval,terminalElapsed);
 if(u.fired>0&&since<.76){
  if(reduced)return since<.24?{sheet:'dsAttack',cols:3,rows:2,index:2}:{sheet:'dsIdle',cols:3,rows:1,index:0};
  // Reuse the approved, wider stance and torso reach, then authored settle/return poses.
  return{sheet:since<.24?'dsActions':'dsAttack',cols:3,rows:2,index:since<.24?2:since<.46?3:since<.66?4:5};
 }
 if(!reduced&&canAnticipate(u,s)&&u.cooldown<.30)return{sheet:'dsActions',cols:3,rows:2,index:1};
 return{sheet:'dsIdle',cols:3,rows:1,index:reduced?0:idleIndex(idleClock(u,s,visualTime))};
}
// Real shots still start the release on the exact engine tick. Longer held silhouettes
// are readable at 2x without a separate wall-clock animation or delayed/fictitious shot.
function gptFrame(u,s,visualTime,reduced,interval=1.4,terminalElapsed=0){
 const frame=index=>({sheet:'gptAttack',cols:3,rows:2,index});
 const since=castAge(u,s,interval,terminalElapsed);
 if(u.fired>0&&since<.80){
  if(reduced)return since<.24?frame(3):frame(0);
  return frame(since<.22?2:since<.42?3:since<.64?4:5);
 }
 if(!reduced&&canAnticipate(u,s)&&u.cooldown<.32)return frame(1);
 // Authored palms, sleeves, wings, tail and blink; no spell or attack cues while idle.
 // Weak keeps this same model and scale, with the existing dimming/status caption.
 return reduced?frame(0):{sheet:'gptIdle',cols:3,rows:1,index:idleIndex(idleClock(u,s,visualTime))};
}
// New guard sheets use fixed anchors and the committed shot counter. The visible
// next-shot label may already say 1/4 while the fourth weak release is finishing.
function specialistFrame(u,s,visualTime,reduced,interval,terminalElapsed=0){
 const frame=index=>({sheet:u.type==='claude'?'claudeActions':'grokActions',cols:3,rows:3,index});
 if(u.type==='claude'&&u.status==='review')return frame(reduced?6:6+(Math.floor(Math.max(0,3-u.statusRemaining)*2)%2));
 const since=castAge(u,s,interval,terminalElapsed);
 if(u.fired>0&&since<.8){
  if(u.type==='grok'&&u.fired%4===0)return frame(reduced?(since<.24?7:0):(since<.52?7:5));
  if(reduced)return frame(since<.24?3:0);
  return frame(since<.22?3:since<.48?4:5);
 }
 if(!reduced&&canAnticipate(u,s)&&u.cooldown<.3)return frame(u.type==='grok'&&u.fired%4===3?6:2);
 const cycle=((idleClock(u,s,visualTime)%3.8)+3.8)%3.8;
 return frame(reduced?0:cycle<1.3?0:cycle<2.8?1:8);
}
// Missing one new/optional pose sheet must not replace a guard's identity unnecessarily.
function availableCharacterFrame(frame){
 if(ready(assets[frame.sheet]))return frame;
 if(frame.sheet==='gptIdle'&&ready(assets.gptAttack))return{sheet:'gptAttack',cols:3,rows:2,index:0};
 if(frame.sheet==='dsActions'&&frame.index<3&&ready(assets.dsAttack))return{sheet:'dsAttack',cols:3,rows:2,index:frame.index};
 return frame;
}
// Gentle breath anchored at the soles, not whole-sprite bobbing or floor sliding.
// Authored pose changes do the acting. This <=1.2px torso excursion only connects idle
// and chew holds; attacks remain undistorted. Reduced motion is entirely untransformed.
function characterBreath(u,s,visualTime,reduced,frame){
 if(reduced)return 1;
 const pose=frame||(u.type==='gpt'?gptFrame(u,s,visualTime,false):dsFrame(u,s,visualTime,false));
 if(pose.sheet!=='dsIdle'&&pose.sheet!=='gptIdle'&&u.status!=='rice')return 1;
 return 1+Math.sin(idleClock(u,s,visualTime)*Math.PI*2/3.8)*.012;
}
function drawCharacter(ctx,image,frame,x,y,breath=1){
 const w=image.width/frame.cols,h=image.height/frame.rows;
 // DS's earlier broad poses end at y=480/512 rather than 488/512. This constant
 // sheet alignment preserves ground contact, not a per-frame resizing operation.
 const groundOffset=frame.sheet==='dsActions'?1.5:0;
 const anchor=frame.sheet==='claudeActions'?405:frame.sheet==='grokActions'?391:null;
 const top=anchor===null?y-65+groundOffset:y+26.5-anchor/418*96;
 ctx.save();
 if(breath!==1){ctx.translate(x,y+26.5);ctx.scale(1,breath);ctx.translate(-x,-y-26.5);}
 ctx.drawImage(image,frame.index%frame.cols*w,Math.floor(frame.index/frame.cols)*h,w,h,x-48,top,96,96);
 ctx.restore();
}
// Pure per-enemy pose selection: event timestamps never restart on repeated redraws.
function fragmentFrame(e,s,effects=[],reduced=false){
 const frame=index=>({sheet:'fragmentActions',cols:3,rows:2,index});
 if(reduced)return frame(1);
 let hit=Infinity,attack=Infinity;
 for(const fx of effects){
  if(!Number.isFinite(fx.time)||!(fx.amount>0))continue;
  const age=s.time-fx.time;if(age<0)continue;
  if(fx.type==='hit'&&fx.target===e.id)hit=Math.min(hit,age);
  if(fx.type==='unit-hit'&&fx.source===e.id)attack=Math.min(attack,age);
 }
 if(hit<.26)return frame(hit<.14?4:5);
 if(attack<.22)return frame(attack<.14?3:5);
 let hash=0;for(const c of String(e.id??e.row))hash=(Math.imul(hash,31)+c.charCodeAt(0))>>>0;
 const offset=((hash*.61803398875)%1)*4;
 return frame([0,1,2,1][Math.floor(s.time*8+offset)%4]);
}
const viewport=Object.freeze({x:32,y:48,width:416,height:416});
// Limited action poses, deliberately NOT a walk cycle. No simulation mutations.
function armorFrame(e,s,effects=[],reduced=false,interval=1.3){
 const pose=(index,action)=>({index,action,cols:3,rows:2,sheet:'armorActions'});
 if(reduced)return pose(0,'static');
 let hit=Infinity,attack=Infinity;
 for(const fx of effects){
  if(!Number.isFinite(fx.time)||!(fx.amount>0))continue;
  const age=s.time-fx.time;if(age<0)continue;
  if(fx.type==='hit'&&fx.target===e.id)hit=Math.min(hit,age);
  if(fx.type==='unit-hit'&&fx.source===e.id)attack=Math.min(attack,age);
 }
 // Short guard response only: frame 5 has no convincingly authored impact recoil.
 if(hit<.16)return pose(5,'hit-guard');
 if(attack<.14)return pose(4,'contact');
 // Real cooldown and live blocker, no synthetic windup before the first hit.
 const blocker=s.units.some(u=>u.hp>0&&u.row===e.row&&u.x<=e.x+.1&&e.x-u.x<=.44);
 if(blocker&&e.cooldown>0&&e.cooldown<Math.min(.14,interval))return pose(3,'windup');
 return pose(0,'static');
}
function drawArmor(ctx,image,frame,x,ground,size=78){
 const v=viewport;
 // Grounded opaque foot ends at source y419 in every selected action pose.
 const top=ground-(419-v.y)/v.height*size;
 ctx.drawImage(image,frame.index%3*512+v.x,Math.floor(frame.index/3)*512+v.y,v.width,v.height,x-size/2,top,size,size);
}

function drawEffects(ctx,effects,time,reduced){for(const e of effects||[]){const age=Math.max(0,time-e.born),p=Math.min(1,age/e.life);if(p>=1)continue;const x=140+e.x*120,y=211+e.row*82,isLoss=e.type==='unit-lost'||e.type==='leak',c=isLoss?'#ffb9b0':e.unitType==='grok'&&e.quality==='weak'?'#b69b79':guardColors[e.unitType]||'#9cf3ff';ctx.save();ctx.globalAlpha=(1-p)*.85;ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=2;const spread=reduced?12:5+p*(e.type==='kill'?35:18);if(e.type==='cluster-impact'){ctx.beginPath();ctx.ellipse(x,y,reduced?34:18+p*72,12,0,0,Math.PI*2);ctx.stroke();}else if(e.type==='hit'&&e.unitType==='grok'){ctx.fillRect(x-2,y-8,4,16);}else if(e.type==='shot'){ctx.beginPath();ctx.ellipse(x,y,4+spread*.5,8+spread*.35,0,0,Math.PI*2);ctx.stroke();}else{ctx.beginPath();ctx.arc(x,y,spread,0,Math.PI*2);ctx.stroke();const n=e.type==='kill'||isLoss?8:4;for(let i=0;i<n;i++){const a=i*Math.PI*2/n+(e.variant||0)*.4,dist=spread*(i%2?1:.7),px=x+Math.cos(a)*dist,py=y+Math.sin(a)*dist+(reduced?0:p*p*10);ctx.save();ctx.translate(px,py);ctx.rotate(a+p);ctx.fillRect(-2,-2,e.type==='kill'?6:3,e.type==='kill'?5:3);ctx.restore();}}ctx.restore();}}
// Read-only, cell-accurate detour telegraphs. No position is changed for animation.
function drawDetours(ctx,s,preview,lang){
 const zh=lang==='zh',label=(v,x,y)=>{ctx.fillStyle='#17243eee';ctx.beginPath();ctx.roundRect(x-83,y-14,166,21,6);ctx.fill();ctx.fillStyle='#ffe3a0';ctx.font='600 11px system-ui';ctx.textAlign='center';ctx.fillText(v,x,y);};
 const arrow=(x,from,to)=>{const y1=211+from*82,y2=211+to*82,dir=Math.sign(y2-y1);ctx.strokeStyle='#ffd985';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y1+dir*18);ctx.lineTo(x,y2-dir*18);ctx.lineTo(x-6,y2-dir*26);ctx.moveTo(x,y2-dir*18);ctx.lineTo(x+6,y2-dir*26);ctx.stroke();};
 // A convoy shares a route. Draw its preview once rather than stacking opacity/text.
 if(s.phase==='prepare'){
  const seen=new Set();
  for(const p of preview||[]){if(!Number.isInteger(p.toRow)||seen.has(p.row+':'+p.toRow))continue;seen.add(p.row+':'+p.toRow);
   const guards=s.units.filter(u=>u.hp>0&&u.row===p.row);ctx.save();
   for(const u of guards){const start=140+u.x*120,end=Math.min(1076,start+240);ctx.fillStyle='#ffcc6630';ctx.fillRect(start,174+p.row*82,end-start,74);ctx.strokeStyle='#ffd985';ctx.lineWidth=2;ctx.strokeRect(start,174+p.row*82,end-start,74);}
   arrow(915,p.row,p.toRow);label(zh?'遇守卫两格内 → 第'+(p.toRow+1)+'行':'Guard within 2 cells → lane '+(p.toRow+1),650,185+p.row*82);ctx.restore();
  }
 }
 const groups=new Map();
 for(const e of s.enemies){if(!Number.isInteger(e.toRow)||e.turnState==='done')continue;const key=e.row+':'+e.toRow;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(e);}
 for(const group of groups.values()){
  const lead=group.reduce((a,b)=>a.x<b.x?a:b),waiting=group.filter(e=>e.turnState==='waiting'),next=waiting.length?Math.min(...waiting.map(e=>Math.max(0,e.turnRemaining))):null;
  const x=140+lead.x*120,count=group.length>1?'×'+group.length+' · ':'',time=next===null?'':(group.length>1?(zh?'下一只 ':'Next '):'')+next.toFixed(1)+'s · ';
  ctx.save();arrow(Math.min(915,x-42),lead.row,lead.toRow);label(count+time+(zh?'→ 第'+(lead.toRow+1)+'行':'→ lane '+(lead.toRow+1)),Math.min(890,Math.max(224,x-60)),178+lead.row*82);
  for(const e of waiting){ctx.strokeStyle='#ffe7ad';ctx.lineWidth=3;ctx.beginPath();ctx.arc(140+e.x*120,211+e.row*82,39,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.max(0,e.turnRemaining)/2);ctx.stroke();}
  ctx.restore();
 }
}
// Selected guard coverage is an actual forward lane, never a decorative circular range.
function forwardLane(s,selectedId){
 const u=s.units.find(u=>u.id===selectedId&&u.hp>0);
 return u?{row:u.row,start:Math.max(0,u.x-.1),end:7.8}:null;
}
function drawForwardLane(ctx,s,selectedId){
 const lane=forwardLane(s,selectedId);if(!lane)return;
 const x=140+lane.start*120,end=140+lane.end*120,y=170+lane.row*82;
 ctx.save();ctx.fillStyle='#b9edff21';ctx.fillRect(x,y+5,end-x,72);
 // A narrow dark keyline keeps the unchanged pale guide legible on bright campus tiles.
 const strokeGuide=()=>{ctx.strokeStyle='#243655b8';ctx.lineWidth=4;ctx.stroke();ctx.strokeStyle='#c9efffb8';ctx.lineWidth=2;ctx.stroke();};
 ctx.setLineDash([7,7]);ctx.beginPath();ctx.moveTo(x,y+67);ctx.lineTo(end-12,y+67);strokeGuide();ctx.setLineDash([]);
 ctx.beginPath();ctx.moveTo(end-25,y+60);ctx.lineTo(end-12,y+67);ctx.lineTo(end-25,y+74);strokeGuide();ctx.restore();
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
function draw(ctx,{state:s,definitions:D,layout:L,preview=[],selectedUnit=null},o){requestEnemyArt(preview,s.enemies);requestGuardArt(s.units);const scale=Math.min(o.width/1120,o.height/650);ctx.save();ctx.fillStyle='#18223d';ctx.fillRect(0,0,o.width,o.height);ctx.translate((o.width-1120*scale)/2,(o.height-650*scale)/2);ctx.scale(scale,scale);
const text=(v,x,y,size=14,color='#fff')=>{ctx.font='600 '+size+'px system-ui';ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(v,x,y);};
const pill=(v,x,y,w=110,color='#d9ebff')=>{ctx.fillStyle='#142340e8';ctx.beginPath();ctx.roundRect(x-w/2,y-15,w,21,7);ctx.fill();text(v,x,y,12,color);};
const fallbackUnit=(u,x,y)=>{const c=guardColors[u.type]||'#bfc9da';ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y-29,16,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(x,y-12);ctx.lineTo(x-24,y+25);ctx.quadraticCurveTo(x,y+38,x+24,y+25);ctx.closePath();ctx.fill();ctx.strokeStyle=c;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x-13,y);ctx.lineTo(x-29,y+10);ctx.moveTo(x+13,y);ctx.lineTo(x+31,y-5);ctx.stroke();ctx.fillStyle='#223954';ctx.beginPath();ctx.arc(x-5,y-30,2,0,7);ctx.arc(x+5,y-30,2,0,7);ctx.fill();text(guardNames[u.type]||u.type,x,y-49,12,c);};
const fallbackEnemy=(e,x,y,size)=>{const c={data:'#dd96e7',swarm:'#f0b7d3',armor:'#c0badf',charge:'#ffb680'}[e.type]||'#dd96e7';ctx.fillStyle='#342448';ctx.strokeStyle=c;ctx.lineWidth=e.type==='armor'?5:3;ctx.beginPath();ctx.moveTo(x,y-size*.55);ctx.lineTo(x+size*.38,y-size*.2);ctx.lineTo(x+size*.28,y+22);ctx.lineTo(x-size*.28,y+22);ctx.lineTo(x-size*.38,y-size*.2);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(x-size*.3,y+6);ctx.lineTo(x-size*.48,y+23);ctx.moveTo(x+size*.3,y+6);ctx.lineTo(x+size*.48,y+23);ctx.stroke();text(e.type==='charge'?'»':e.type==='swarm'?'••':'×',x,y+6,22,c);const names={data:['数据怪','Data'],swarm:['集群怪','Swarm'],armor:['重甲怪','Armor'],charge:['冲锋怪','Charge']};text((names[e.type]||names.data)[o.lang==='zh'?0:1],x,y-size*.6-7,11,c);};
const a=assets.campus;if(ready(a)){// Align all five illustrated lanes with the unchanged clickable grid.
ctx.drawImage(a,0,0,a.width,a.height*.24,0,0,1120,170);ctx.drawImage(a,0,a.height*.24,a.width,a.height*.535,0,170,1120,410);ctx.drawImage(a,0,a.height*.775,a.width,a.height*.225,0,580,1120,70);
}else{ctx.fillStyle='#31476e';ctx.fillRect(0,0,1120,650);text(assetState('campus')==='failed'?(o.lang==='zh'?'校园背景加载失败，使用备用场地':'Campus background failed; backup field active'):(o.lang==='zh'?'正在加载校园美术…':'Loading campus art…'),560,80,18);}
ctx.strokeStyle='#d5edff29';ctx.lineWidth=1;for(let row=0;row<5;row++)for(let col=0;col<7;col++)ctx.strokeRect(140+col*120,170+row*82,120,82);
drawForwardLane(ctx,s,selectedUnit);
const supplierNames=['Jensen','Liang','Tibo',o.lang==='zh'?'苏姿丰':'Lisa Su'];
if(ready(assets.suppliers)){const im=assets.suppliers;for(let i=0;i<4;i++){const x=275+i*190;ctx.drawImage(im,i*im.width/4,0,im.width/4,im.height,x-43,8,86,116);pill(supplierNames[i],x,133,80);}}else{for(let i=0;i<4;i++){const x=275+i*190;ctx.fillStyle='#d3c8df';ctx.beginPath();ctx.arc(x,45,15,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(x,83,27,22,0,0,7);ctx.fill();pill(supplierNames[i],x,133,80);}}
if(!o.supplyOverlay)pill(o.lang==='zh'?'补给 '+s.gpuCount+'/'+s.gpuQuota+' · 显卡每6秒投放':'SUPPLY '+s.gpuCount+'/'+s.gpuQuota+' · GPU every 6s',560,159,330);
for(let row=0;row<5;row++)pill(String(row+1),125,216+row*82,24);
for(const u of s.units){const x=140+u.x*120,y=211+u.row*82,bob=o.reducedMotion||s.paused?0:Math.sin(s.time*2.4+u.row+u.col)*1.5;ctx.fillStyle='#14315266';ctx.beginPath();ctx.ellipse(x,y+28,33,8,0,0,Math.PI*2);ctx.fill();
const selectedFrame=u.type==='deepseek'?dsFrame(u,s,o.visualTime??s.time,o.reducedMotion,D.units.deepseek.interval,o.terminalElapsed):u.type==='gpt'?gptFrame(u,s,o.visualTime??s.time,o.reducedMotion,D.units.gpt.interval,o.terminalElapsed):['claude','grok'].includes(u.type)?specialistFrame(u,s,o.visualTime??s.time,o.reducedMotion,D.units[u.type].interval,o.terminalElapsed):null,frame=selectedFrame&&availableCharacterFrame(selectedFrame);if(frame&&ready(assets[frame.sheet])){ctx.save();if(u.type==='gpt'&&u.status==='weak')ctx.globalAlpha=.7;drawCharacter(ctx,assets[frame.sheet],frame,x,y,characterBreath(u,s,o.visualTime??s.time,o.reducedMotion,frame));ctx.restore();}else if(['deepseek','gpt'].includes(u.type)&&ready(assets.ai)){const im=assets.ai,cellW=im.width/2,cellH=im.height/2,alt=u.status==='rice'||u.status==='weak',sx=alt?cellW:0,sy=u.type==='gpt'?cellH:0;ctx.drawImage(im,sx+cellW*.15,sy,cellW*.51,cellH,x-48,y-65+bob,96,96);}else fallbackUnit(u,x,y+bob);
ctx.fillStyle='#142340';ctx.fillRect(x-26,y+34,52,4);ctx.fillStyle='#9df2d0';ctx.fillRect(x-26,y+34,52*Math.max(0,u.hp/D.units[u.type].hp),4);
drawLowHealth(ctx,u,D,x,y);
if(u.status==='review'){pill('Ⅱ',x+37,y-23,24,'#ffd397');}
const status=guardStatus(u,o.lang);if(status)pill(status,x,y-61,u.type==='grok'?164:132,u.warning?'#ffe0a0':u.type==='grok'&&(u.fired||0)%4===3?'#ffd397':'#fff');}
for(const e of s.enemies){const x=140+e.x*120,y=211+e.row*82,idx={data:0,swarm:1,armor:2,charge:3}[e.type]??0,size=e.type==='armor'?78:e.type==='swarm'?49:65,bob=o.reducedMotion||s.paused?0:Math.sin(s.time*5+e.row+e.x)*2;ctx.fillStyle='#24143b55';ctx.beginPath();ctx.ellipse(x,y+27,size*.35,7,0,0,7);ctx.fill();if(e.type==='armor'&&ready(assets.armorActions)){const f=armorFrame(e,s,o.effects||[],o.reducedMotion,D.enemies.armor.interval);drawArmor(ctx,assets.armorActions,f,x,y+27,size);}else if(e.type==='swarm'&&ready(assets.fragmentActions)){const f=fragmentFrame(e,s,o.effects||[],o.reducedMotion),im=assets.fragmentActions,w=im.width/f.cols,h=im.height/f.rows;ctx.drawImage(im,(f.index%f.cols)*w,Math.floor(f.index/f.cols)*h,w,h,x-size/2,y-size+30,size,size);}else if(ready(assets.enemies)){const im=assets.enemies,w=im.width/2,h=im.height/2;ctx.drawImage(im,(idx%2)*w,Math.floor(idx/2)*h,w,h,x-size/2,y-size+30+bob,size,size);}else fallbackEnemy(e,x,y+bob,size);
ctx.fillStyle='#20192d';ctx.fillRect(x-22,y+34,44,4);ctx.fillStyle='#f0a0ce';ctx.fillRect(x-22,y+34,44*Math.max(0,e.hp/D.enemies[e.type].hp),4);}
// Count genuinely close independent enemies so dense groups are not mistaken for one.
for(let row=0;row<5;row++){const ordered=s.enemies.filter(e=>e.row===row&&e.hp>0).sort((a,b)=>a.x-b.x);for(let i=0;i<ordered.length;){let j=i+1;while(j<ordered.length&&ordered[j].x-ordered[i].x<=.45)j++;if(j-i>1&&!ordered.slice(i,j).every(e=>Number.isInteger(e.toRow)&&e.turnState!=='done'&&e.toRow===ordered[i].toRow))pill('×'+(j-i),140+ordered[i].x*120,211+row*82-46,38,'#ffdcf4');i=j;}}
drawDetours(ctx,s,preview,o.lang);
drawEffects(ctx,o.effects,o.visualTime||0,o.reducedMotion);
for(const sh of s.shots){const x=140+sh.x*120,y=211+sh.row*82,c=sh.type==='grok'&&sh.quality==='weak'?'#b69b79':guardColors[sh.type]||'#8ceeff';ctx.save();ctx.shadowBlur=15;ctx.shadowColor=c;ctx.strokeStyle=c;ctx.lineWidth=sh.type==='claude'?8:sh.type==='gpt'?6:4;ctx.beginPath();ctx.moveTo(x-(sh.type==='gpt'?34:17),y);ctx.lineTo(x,y);ctx.stroke();if(sh.type==='gpt'){ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x-30,y-5);ctx.lineTo(x-5,y-5);ctx.moveTo(x-30,y+5);ctx.lineTo(x-5,y+5);ctx.stroke();}if(sh.type==='grok'){ctx.strokeRect(x-6,y-6,12,12);if(sh.quality==='weak'){text('4',x,y-10,11,c);}}ctx.fillStyle='#fff';ctx.beginPath();for(let i=0;i<8;i++){const r=i%2?3:8,ang=i*Math.PI/4;const px=x+Math.cos(ang)*r,py=y+Math.sin(ang)*r;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fill();ctx.restore();}
pill((o.lang==='zh'?'核心 ':'CORE ')+s.core+'/5',66,605,110,'#b3f9ff');text(o.lang==='zh'?'点击格子部署 · 左侧核心不能失守':'Deploy in cells · Defend the left core',590,619,16,'#d9ecff');
if(s.phase==='won'||s.phase==='lost'){ctx.fillStyle='#0e1a32ed';ctx.beginPath();ctx.roundRect(375,285,370,78,18);ctx.fill();ctx.strokeStyle='#c7ddff';ctx.stroke();text(s.phase==='won'?(o.lang==='zh'?'防线守住了！':'LINE HELD!'):(s.failureReason==='challenge-leak'?(o.lang==='zh'?'挑战未完成：有敌人漏过':'CHALLENGE INCOMPLETE'):(o.lang==='zh'?'核心失守':'CORE LOST')),560,335,26);}
const failed=Object.keys(files).filter(k=>assetState(k)==='failed');if(failed.length){const labels={campus:['背景','background'],ai:['守卫','guards'],suppliers:['供给者','suppliers'],enemies:['敌人','enemies'],dsActions:['DS动作','DS actions'],dsIdle:['DS待机','DS idle'],dsAttack:['DS攻击','DS attack'],gptAttack:['GPT攻击','GPT attack'],gptIdle:['GPT待机','GPT idle'],claudeActions:['Claude动作','Claude actions'],grokActions:['Grok动作','Grok actions'],fragmentActions:['碎片振翅','Fragment wings'],armorActions:['重甲动作','Armor actions']};pill((o.lang==='zh'?'资源加载失败：':'Art failed: ')+failed.map(k=>labels[k][o.lang==='zh'?0:1]).join(' / ')+(o.lang==='zh'?' · 已使用备用显示，可继续游玩':' · backup display active; play continues'),560,644,1040,'#ffe0a0');}
ctx.restore();}
const api={guardStatus,specialistFrame,requestGuardArt,isLowHealth,drawLowHealth,draw,forwardLane,drawForwardLane,drawDetours,drawEffects,dsFrame,gptFrame,riceIndex,idleIndex,characterBreath,drawCharacter,availableCharacterFrame,fragmentFrame,armorFrame,drawArmor,assets,files,assetStates,assetState};root.TDLanesRenderer=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
