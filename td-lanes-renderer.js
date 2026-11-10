/* Runtime art renderer. Read-only: visual frames never advance the simulation. */
(function(root){'use strict';
const assets={},assetStates={},files={campus:'td-campus-background.png',ai:'td-ai-sprites.png',suppliers:'td-suppliers.png',enemies:'td-enemies.png',dsActions:'td-ds-actions.png',dsIdle:'td-ds-idle.png',dsAttack:'td-ds-attack.png',gptAttack:'td-gpt-attack.png',fragmentActions:'td-fragment-actions.png'};
if(typeof Image!=='undefined')for(const [k,src]of Object.entries(files)){const im=new Image();assetStates[k]='loading';im.onload=()=>{assetStates[k]='ready';};im.onerror=()=>{assetStates[k]='failed';};assets[k]=im;im.src=src;}
function ready(im){return !!im&&im.width>0&&im.height>0&&im.complete!==false;}
function assetState(key){const im=assets[key];if(ready(im))return 'ready';if(assetStates[key]==='failed'||im?.complete===true)return 'failed';return 'loading';}
function dsFrame(u,s,visualTime,reduced){if(u.status==='rice')return{sheet:'dsActions',cols:3,rows:2,index:reduced?4:3+Math.floor(Math.max(0,2-u.statusRemaining)*5)%3};const target=s.enemies.some(e=>e.hp>0&&e.row===u.row&&e.x>=u.x-.1);if(u.fired>0){const since=1.1-u.cooldown;if(since<.55)return{sheet:'dsAttack',cols:3,rows:2,index:reduced?2:since<.12?2:since<.24?3:since<.42?4:5};if(target&&u.cooldown<.22)return{sheet:'dsAttack',cols:3,rows:2,index:1};}const cycle=(visualTime+u.row*.47+u.col*.23)%3.8;return{sheet:'dsIdle',cols:3,rows:1,index:reduced?0:cycle<2.8?0:cycle<3.02?1:2};}
// Frames derive only from the real cooldown; wall-clock redraws cannot advance a paused cast.
function gptFrame(u,s,visualTime,reduced,interval=1.4){
 const frame=index=>({sheet:'gptAttack',cols:3,rows:2,index});
 const since=Math.max(0,interval-u.cooldown);
 if(u.fired>0&&since<.56){
  if(reduced)return since<.24?frame(3):frame(0);
  return frame(since<.10?2:since<.24?3:since<.44?4:5);
 }
 const target=s.enemies.some(e=>e.hp>0&&e.row===u.row&&e.x>=u.x-.1);
 if(!reduced&&u.fired>0&&target&&u.cooldown>0&&u.cooldown<.24)return frame(1);
 // Keep one model/scale through weak windows; dimming plus the explicit status label distinguish them.
 return frame(0);
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
function drawEffects(ctx,effects,time,reduced){for(const e of effects||[]){const age=Math.max(0,time-e.born),p=Math.min(1,age/e.life);if(p>=1)continue;const x=140+e.x*120,y=211+e.row*82,isLoss=e.type==='unit-lost'||e.type==='leak',c=isLoss?'#ffb9b0':e.unitType==='gpt'?'#e2caff':'#9cf3ff';ctx.save();ctx.globalAlpha=(1-p)*.85;ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=2;const spread=reduced?12:5+p*(e.type==='kill'?35:18);if(e.type==='shot'){ctx.beginPath();ctx.ellipse(x,y,4+spread*.5,8+spread*.35,0,0,Math.PI*2);ctx.stroke();}else{ctx.beginPath();ctx.arc(x,y,spread,0,Math.PI*2);ctx.stroke();const n=e.type==='kill'||isLoss?8:4;for(let i=0;i<n;i++){const a=i*Math.PI*2/n+(e.variant||0)*.4,dist=spread*(i%2?1:.7),px=x+Math.cos(a)*dist,py=y+Math.sin(a)*dist+(reduced?0:p*p*10);ctx.save();ctx.translate(px,py);ctx.rotate(a+p);ctx.fillRect(-2,-2,e.type==='kill'?6:3,e.type==='kill'?5:3);ctx.restore();}}ctx.restore();}}
// Read-only, cell-accurate detour telegraphs. No position is changed for animation.
function drawDetours(ctx,s,preview,lang){
 const zh=lang==='zh',label=(v,x,y)=>{ctx.fillStyle='#17243eee';ctx.beginPath();ctx.roundRect(x-83,y-14,166,21,6);ctx.fill();ctx.fillStyle='#ffe3a0';ctx.font='600 11px system-ui';ctx.textAlign='center';ctx.fillText(v,x,y);};
 const arrow=(x,from,to)=>{const y1=211+from*82,y2=211+to*82,dir=Math.sign(y2-y1);ctx.strokeStyle='#ffd985';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y1+dir*18);ctx.lineTo(x,y2-dir*18);ctx.lineTo(x-6,y2-dir*26);ctx.moveTo(x,y2-dir*18);ctx.lineTo(x+6,y2-dir*26);ctx.stroke();};
 if(s.phase==='prepare')for(const p of preview||[]){if(!Number.isInteger(p.toRow))continue;const guards=s.units.filter(u=>u.hp>0&&u.row===p.row);ctx.save();for(const u of guards){const start=140+u.x*120,end=Math.min(1076,start+240);ctx.fillStyle='#ffcc6630';ctx.fillRect(start,174+p.row*82,end-start,74);ctx.strokeStyle='#ffd985';ctx.lineWidth=2;ctx.strokeRect(start,174+p.row*82,end-start,74);}arrow(1002,p.row,p.toRow);label(zh?'遇守卫两格内 → 第'+(p.toRow+1)+'行':'Guard within 2 cells → lane '+(p.toRow+1),842,200+p.row*82);ctx.restore();}
 for(const e of s.enemies){if(!Number.isInteger(e.toRow)||e.turnState==='done')continue;ctx.save();const x=140+e.x*120;arrow(Math.min(1058,x+26),e.row,e.toRow);const time=e.turnState==='waiting'?Math.max(0,e.turnRemaining).toFixed(1)+'s · ':'';label(time+(zh?'→ 第'+(e.toRow+1)+'行':'→ lane '+(e.toRow+1)),Math.min(990,Math.max(224,x)),178+e.row*82);if(e.turnState==='waiting'){ctx.strokeStyle='#ffe7ad';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,211+e.row*82,39,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.max(0,e.turnRemaining)/2);ctx.stroke();}ctx.restore();}
}
function draw(ctx,{state:s,definitions:D,layout:L,preview=[]},o){const scale=Math.min(o.width/1120,o.height/650);ctx.save();ctx.fillStyle='#18223d';ctx.fillRect(0,0,o.width,o.height);ctx.translate((o.width-1120*scale)/2,(o.height-650*scale)/2);ctx.scale(scale,scale);
const text=(v,x,y,size=14,color='#fff')=>{ctx.font='600 '+size+'px system-ui';ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(v,x,y);};
const pill=(v,x,y,w=110,color='#d9ebff')=>{ctx.fillStyle='#142340e8';ctx.beginPath();ctx.roundRect(x-w/2,y-15,w,21,7);ctx.fill();text(v,x,y,12,color);};
const fallbackUnit=(u,x,y)=>{const c=u.type==='gpt'?'#ddd3ff':'#8ee5f0';ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y-29,16,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(x,y-12);ctx.lineTo(x-24,y+25);ctx.quadraticCurveTo(x,y+38,x+24,y+25);ctx.closePath();ctx.fill();ctx.strokeStyle=c;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x-13,y);ctx.lineTo(x-29,y+10);ctx.moveTo(x+13,y);ctx.lineTo(x+31,y-5);ctx.stroke();ctx.fillStyle='#223954';ctx.beginPath();ctx.arc(x-5,y-30,2,0,7);ctx.arc(x+5,y-30,2,0,7);ctx.fill();text(u.type==='gpt'?'GPT':'DeepSeek',x,y-49,12,c);};
const fallbackEnemy=(e,x,y,size)=>{const c={data:'#dd96e7',swarm:'#f0b7d3',armor:'#c0badf',charge:'#ffb680'}[e.type]||'#dd96e7';ctx.fillStyle='#342448';ctx.strokeStyle=c;ctx.lineWidth=e.type==='armor'?5:3;ctx.beginPath();ctx.moveTo(x,y-size*.55);ctx.lineTo(x+size*.38,y-size*.2);ctx.lineTo(x+size*.28,y+22);ctx.lineTo(x-size*.28,y+22);ctx.lineTo(x-size*.38,y-size*.2);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(x-size*.3,y+6);ctx.lineTo(x-size*.48,y+23);ctx.moveTo(x+size*.3,y+6);ctx.lineTo(x+size*.48,y+23);ctx.stroke();text(e.type==='charge'?'»':e.type==='swarm'?'••':'×',x,y+6,22,c);const names={data:['数据怪','Data'],swarm:['集群怪','Swarm'],armor:['重甲怪','Armor'],charge:['冲锋怪','Charge']};text((names[e.type]||names.data)[o.lang==='zh'?0:1],x,y-size*.6-7,11,c);};
const a=assets.campus;if(ready(a)){// Align all five illustrated lanes with the unchanged clickable grid.
ctx.drawImage(a,0,0,a.width,a.height*.24,0,0,1120,170);ctx.drawImage(a,0,a.height*.24,a.width,a.height*.535,0,170,1120,410);ctx.drawImage(a,0,a.height*.775,a.width,a.height*.225,0,580,1120,70);
}else{ctx.fillStyle='#31476e';ctx.fillRect(0,0,1120,650);text(assetState('campus')==='failed'?(o.lang==='zh'?'校园背景加载失败，使用备用场地':'Campus background failed; backup field active'):(o.lang==='zh'?'正在加载校园美术…':'Loading campus art…'),560,80,18);}
ctx.strokeStyle='#d5edff29';ctx.lineWidth=1;for(let row=0;row<5;row++)for(let col=0;col<7;col++)ctx.strokeRect(140+col*120,170+row*82,120,82);
if(ready(assets.suppliers)){const im=assets.suppliers;for(let i=0;i<4;i++){const x=275+i*190;ctx.drawImage(im,i*im.width/4,0,im.width/4,im.height,x-43,8,86,116);pill(['Jensen','Liang','Tibo','AMD'][i],x,133,80);}}else{for(let i=0;i<4;i++){const x=275+i*190;ctx.fillStyle='#d3c8df';ctx.beginPath();ctx.arc(x,45,15,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(x,83,27,22,0,0,7);ctx.fill();pill(['Jensen','Liang','Tibo','AMD'][i],x,133,80);}}
pill(o.lang==='zh'?'补给 '+s.gpuCount+'/'+s.gpuQuota+' · 显卡每6秒投放':'SUPPLY '+s.gpuCount+'/'+s.gpuQuota+' · GPU every 6s',560,159,330);
for(let row=0;row<5;row++)pill(String(row+1),125,216+row*82,24);
for(const u of s.units){const x=140+u.x*120,y=211+u.row*82,bob=o.reducedMotion||s.paused?0:Math.sin(s.time*2.4+u.row+u.col)*1.5;ctx.fillStyle='#14315266';ctx.beginPath();ctx.ellipse(x,y+28,33,8,0,0,Math.PI*2);ctx.fill();
const frame=u.type==='deepseek'?dsFrame(u,s,o.visualTime??s.time,o.reducedMotion):u.type==='gpt'?gptFrame(u,s,o.visualTime??s.time,o.reducedMotion,D.units.gpt.interval):null;if(frame&&ready(assets[frame.sheet])){const im=assets[frame.sheet],w=im.width/frame.cols,h=im.height/frame.rows;ctx.save();if(u.type==='gpt'&&u.status==='weak')ctx.globalAlpha=.7;ctx.drawImage(im,(frame.index%frame.cols)*w,Math.floor(frame.index/frame.cols)*h,w,h,x-48,y-65,96,96);ctx.restore();}else if(ready(assets.ai)){const im=assets.ai,cellW=im.width/2,cellH=im.height/2,alt=u.status==='rice'||u.status==='weak',sx=alt?cellW:0,sy=u.type==='gpt'?cellH:0;ctx.drawImage(im,sx+cellW*.15,sy,cellW*.51,cellH,x-48,y-65+bob,96,96);}else fallbackUnit(u,x,y+bob);
ctx.fillStyle='#142340';ctx.fillRect(x-26,y+34,52,4);ctx.fillStyle='#9df2d0';ctx.fillRect(x-26,y+34,52*Math.max(0,u.hp/D.units[u.type].hp),4);
const status=root.TDLanesUI?.unitStatus(u,o.lang)||(u.status==='weak'?(o.lang==='zh'?'思路卡住':'Brain fog')+' '+Math.ceil(u.statusRemaining)+'s':'');if(status)pill(status,x,y-61,122,u.warning?'#ffe0a0':'#fff');}
for(const e of s.enemies){const x=140+e.x*120,y=211+e.row*82,idx={data:0,swarm:1,armor:2,charge:3}[e.type]??0,size=e.type==='armor'?78:e.type==='swarm'?49:65,bob=o.reducedMotion||s.paused?0:Math.sin(s.time*5+e.row+e.x)*2;ctx.fillStyle='#24143b55';ctx.beginPath();ctx.ellipse(x,y+27,size*.35,7,0,0,7);ctx.fill();if(e.type==='swarm'&&ready(assets.fragmentActions)){const f=fragmentFrame(e,s,o.effects||[],o.reducedMotion),im=assets.fragmentActions,w=im.width/f.cols,h=im.height/f.rows;ctx.drawImage(im,(f.index%f.cols)*w,Math.floor(f.index/f.cols)*h,w,h,x-size/2,y-size+30,size,size);}else if(ready(assets.enemies)){const im=assets.enemies,w=im.width/2,h=im.height/2;ctx.drawImage(im,(idx%2)*w,Math.floor(idx/2)*h,w,h,x-size/2,y-size+30+bob,size,size);}else fallbackEnemy(e,x,y+bob,size);
ctx.fillStyle='#20192d';ctx.fillRect(x-22,y+34,44,4);ctx.fillStyle='#f0a0ce';ctx.fillRect(x-22,y+34,44*Math.max(0,e.hp/D.enemies[e.type].hp),4);}
// Count genuinely close independent enemies so dense groups are not mistaken for one.
for(let row=0;row<5;row++){const ordered=s.enemies.filter(e=>e.row===row&&e.hp>0).sort((a,b)=>a.x-b.x);for(let i=0;i<ordered.length;){let j=i+1;while(j<ordered.length&&ordered[j].x-ordered[i].x<=.45)j++;if(j-i>1)pill('×'+(j-i),140+ordered[i].x*120,211+row*82-46,38,'#ffdcf4');i=j;}}
drawDetours(ctx,s,preview,o.lang);
drawEffects(ctx,o.effects,o.visualTime||0,o.reducedMotion);
for(const sh of s.shots){const x=140+sh.x*120,y=211+sh.row*82,c=sh.type==='gpt'?'#e5c9ff':'#8ceeff';ctx.save();ctx.shadowBlur=15;ctx.shadowColor=c;ctx.strokeStyle=c;ctx.lineWidth=sh.type==='gpt'?6:4;ctx.beginPath();ctx.moveTo(x-(sh.type==='gpt'?34:17),y);ctx.lineTo(x,y);ctx.stroke();if(sh.type==='gpt'){ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x-30,y-5);ctx.lineTo(x-5,y-5);ctx.moveTo(x-30,y+5);ctx.lineTo(x-5,y+5);ctx.stroke();}ctx.fillStyle='#fff';ctx.beginPath();for(let i=0;i<8;i++){const r=i%2?3:8,ang=i*Math.PI/4;const px=x+Math.cos(ang)*r,py=y+Math.sin(ang)*r;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fill();ctx.restore();}
pill((o.lang==='zh'?'核心 ':'CORE ')+s.core+'/5',66,605,110,'#b3f9ff');text(o.lang==='zh'?'点击格子部署 · 左侧核心不能失守':'Deploy in cells · Defend the left core',590,619,16,'#d9ecff');
if(s.paused||s.phase==='won'||s.phase==='lost'){ctx.fillStyle='#0e1a32ed';ctx.beginPath();ctx.roundRect(375,285,370,78,18);ctx.fill();ctx.strokeStyle='#c7ddff';ctx.stroke();text(s.paused?(o.lang==='zh'?'已暂停':'PAUSED'):s.phase==='won'?(o.lang==='zh'?'防线守住了！':'LINE HELD!'):(s.failureReason==='challenge-leak'?(o.lang==='zh'?'挑战未完成：有敌人漏过':'CHALLENGE INCOMPLETE'):(o.lang==='zh'?'核心失守':'CORE LOST')),560,335,26);}
const failed=Object.keys(files).filter(k=>assetState(k)==='failed');if(failed.length){const labels={campus:['背景','background'],ai:['守卫','guards'],suppliers:['供给者','suppliers'],enemies:['敌人','enemies'],dsActions:['DS动作','DS actions'],dsIdle:['DS待机','DS idle'],dsAttack:['DS攻击','DS attack'],gptAttack:['GPT攻击','GPT attack'],fragmentActions:['碎片振翅','Fragment wings']};pill((o.lang==='zh'?'资源加载失败：':'Art failed: ')+failed.map(k=>labels[k][o.lang==='zh'?0:1]).join(' / ')+(o.lang==='zh'?' · 已使用备用显示，可继续游玩':' · backup display active; play continues'),560,644,1040,'#ffe0a0');}
ctx.restore();}
const api={draw,drawDetours,drawEffects,dsFrame,gptFrame,fragmentFrame,assets,files,assetStates,assetState};root.TDLanesRenderer=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
