/* Runtime art renderer. Read-only: visual frames never advance the simulation. */
(function(root){'use strict';
const assets={},files={campus:'td-campus-background.png',ai:'td-ai-sprites.png',suppliers:'td-suppliers.png',enemies:'td-enemies.png'};
if(typeof Image!=='undefined')for(const [k,src]of Object.entries(files)){const im=new Image();im.src=src;assets[k]=im;}
function ready(im){return !!im&&im.width>0&&im.height>0&&im.complete!==false;}
function draw(ctx,{state:s,definitions:D,layout:L},o){const scale=Math.min(o.width/1120,o.height/650);ctx.save();ctx.fillStyle='#18223d';ctx.fillRect(0,0,o.width,o.height);ctx.translate((o.width-1120*scale)/2,(o.height-650*scale)/2);ctx.scale(scale,scale);
const text=(v,x,y,size=14,color='#fff')=>{ctx.font='600 '+size+'px system-ui';ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(v,x,y);};
const pill=(v,x,y,w=110,color='#d9ebff')=>{ctx.fillStyle='#142340e8';ctx.beginPath();ctx.roundRect(x-w/2,y-15,w,21,7);ctx.fill();text(v,x,y,12,color);};
const a=assets.campus;if(ready(a)){// Align all five illustrated lanes with the unchanged clickable grid.
ctx.drawImage(a,0,0,a.width,a.height*.24,0,0,1120,170);ctx.drawImage(a,0,a.height*.24,a.width,a.height*.535,0,170,1120,410);ctx.drawImage(a,0,a.height*.775,a.width,a.height*.225,0,580,1120,70);
}else{ctx.fillStyle='#31476e';ctx.fillRect(0,0,1120,650);text(o.lang==='zh'?'正在加载校园美术…':'Loading campus art…',560,80,22);}
ctx.strokeStyle='#d5edff29';ctx.lineWidth=1;for(let row=0;row<5;row++)for(let col=0;col<7;col++)ctx.strokeRect(140+col*120,170+row*82,120,82);
if(ready(assets.suppliers)){const im=assets.suppliers;for(let i=0;i<4;i++){const x=275+i*190;ctx.drawImage(im,i*im.width/4,0,im.width/4,im.height,x-43,8,86,116);pill(['Jensen','Liang','Tibo','AMD'][i],x,133,80);}}
pill(o.lang==='zh'?'补给 '+s.gpuCount+'/'+s.gpuQuota+' · 显卡每6秒投放':'SUPPLY '+s.gpuCount+'/'+s.gpuQuota+' · GPU every 6s',560,159,330);
for(let row=0;row<5;row++)pill(String(row+1),125,216+row*82,24);
for(const u of s.units){const x=140+u.x*120,y=211+u.row*82,bob=o.reducedMotion||s.paused?0:Math.sin(s.time*2.4+u.id)*1.5;ctx.fillStyle='#14315266';ctx.beginPath();ctx.ellipse(x,y+28,33,8,0,0,Math.PI*2);ctx.fill();
if(ready(assets.ai)){const im=assets.ai,cellW=im.width/2,cellH=im.height/2,alt=u.status==='rice'||u.status==='weak',sx=alt?cellW:0,sy=u.type==='gpt'?cellH:0;ctx.drawImage(im,sx+cellW*.15,sy,cellW*.51,cellH,x-48,y-65+bob,96,96);}
ctx.fillStyle='#142340';ctx.fillRect(x-26,y+34,52,4);ctx.fillStyle='#9df2d0';ctx.fillRect(x-26,y+34,52*Math.max(0,u.hp/D.units[u.type].hp),4);
const status=root.TDLanesUI?.unitStatus(u,o.lang);if(status)pill(status,x,y-61,122,u.warning?'#ffe0a0':'#fff');}
for(const e of s.enemies){const x=140+e.x*120,y=211+e.row*82,idx={data:0,swarm:1,armor:2,charge:3}[e.type]??0,size=e.type==='armor'?78:e.type==='swarm'?49:65,bob=o.reducedMotion||s.paused?0:Math.sin(s.time*5+e.id)*2;ctx.fillStyle='#24143b55';ctx.beginPath();ctx.ellipse(x,y+27,size*.35,7,0,0,7);ctx.fill();if(ready(assets.enemies)){const im=assets.enemies,w=im.width/2,h=im.height/2;ctx.drawImage(im,(idx%2)*w,Math.floor(idx/2)*h,w,h,x-size/2,y-size+30+bob,size,size);}
ctx.fillStyle='#20192d';ctx.fillRect(x-22,y+34,44,4);ctx.fillStyle='#f0a0ce';ctx.fillRect(x-22,y+34,44*Math.max(0,e.hp/D.enemies[e.type].hp),4);}
for(const sh of s.shots){const x=140+sh.x*120,y=211+sh.row*82,c=sh.type==='gpt'?'#e5c9ff':'#8ceeff';ctx.save();ctx.shadowBlur=15;ctx.shadowColor=c;ctx.strokeStyle=c;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x-17,y);ctx.lineTo(x,y);ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();for(let i=0;i<8;i++){const r=i%2?3:8,ang=i*Math.PI/4;const px=x+Math.cos(ang)*r,py=y+Math.sin(ang)*r;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fill();ctx.restore();}
pill((o.lang==='zh'?'核心 ':'CORE ')+s.core+'/5',66,605,110,'#b3f9ff');text(o.lang==='zh'?'点击格子部署 · 左侧核心不能失守':'Deploy in cells · Defend the left core',590,619,16,'#d9ecff');
if(s.paused||s.phase==='won'||s.phase==='lost'){ctx.fillStyle='#0e1a32ed';ctx.beginPath();ctx.roundRect(375,285,370,78,18);ctx.fill();ctx.strokeStyle='#c7ddff';ctx.stroke();text(s.paused?(o.lang==='zh'?'已暂停':'PAUSED'):s.phase==='won'?(o.lang==='zh'?'防线守住了！':'LINE HELD!'):(o.lang==='zh'?'核心失守':'CORE LOST'),560,335,26);}
ctx.restore();}
const api={draw,assets,files};root.TDLanesRenderer=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
