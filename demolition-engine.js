(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.Demolition=api;})(globalThis,function(){
'use strict';
const STEP=1/120,GRAVITY=760;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const bi=(zh,en)=>({zh,en});
function create(levelId='yard'){
 if(levelId!=='yard')throw Error('Unknown level');
 const s={version:1,levelId,phase:'planning',time:0,accumulator:0,nextCharge:1,charges:[],bodies:[],joints:[],events:[],protectedDamage:0,result:null,quietTime:0,world:{width:960,height:640,groundY:580},walls:[{id:'shield',x:740,y:450,w:26,h:130}],protectedZones:[{id:'workshop',x:784,y:474,w:130,h:106,label:bi('保留工坊','Protected workshop')}],objective:{x:350,y:150,w:310,h:290,clearanceY:440,budget:3,label:bi('让建筑降到虚线以下，保护右侧工坊','Lower the building below the dashed line and protect the right workshop')},title:bi('拆楼专家 · 试验场','Demolition Expert · Test Yard')};
 const add=(x,y,w,h,kind)=>{const b={id:s.bodies.length+1,x,y,px:x,py:y,w,h,mass:w*h/700,kind,removed:false,vx:0,vy:0,restX:x,restY:y};s.bodies.push(b);return b;};
 // Three ground-level piers, four floors. Nodes are connected by visible structural links.
 const xs=[402,451,500,549,598],rows=[];
 for(let row=0;row<8;row++){
  const floor=row%2===1,ys=549-row*45;
  rows[row]=xs.map((x,col)=>(floor||col%2===0)?add(x,ys,floor?47:22,floor?18:62,floor?'beam':'column'):null);
 }
 function link(a,b){if(!a||!b)return;const dx=b.x-a.x,dy=b.y-a.y;s.joints.push({id:s.joints.length+1,a:a.id,b:b.id,length:Math.hypot(dx,dy),broken:false,strength:24});}
 for(let row=0;row<rows.length;row++)for(let col=0;col<5;col++){const a=rows[row][col];if(!a)continue;link(a,rows[row]?.[col+1]);if(row)link(a,rows[row-1][col]);if(row>1&&!rows[row-1][col])link(a,rows[row-2][col]);}
 return s;
}
function nearest(s,x,y){let best=null,d=Infinity;for(const b of s.bodies){if(b.removed)continue;const q=Math.hypot(Math.max(0,Math.abs(x-b.x)-b.w/2),Math.max(0,Math.abs(y-b.y)-b.h/2));if(q<d){d=q;best=b;}}return d<=32?best:null;}
function place(s,x,y){if(s.phase!=='planning'||!Number.isFinite(x)||!Number.isFinite(y))return {ok:false,reason:'not-planning'};const b=nearest(s,x,y);if(!b)return {ok:false,reason:'no-structure'};if(s.charges.some(c=>c.bodyId===b.id))return {ok:false,reason:'duplicate'};if(s.charges.length>=s.objective.budget)return {ok:false,reason:'budget'};const c={id:s.nextCharge++,bodyId:b.id,x:b.x,y:b.y};s.charges.push(c);return {ok:true,charge:{...c}};}
function move(s,id,x,y){if(s.phase!=='planning'||!Number.isFinite(x)||!Number.isFinite(y))return {ok:false,reason:'not-planning'};const charge=s.charges.find(c=>c.id===id),body=nearest(s,x,y);if(!charge||!body)return {ok:false,reason:'no-structure'};if(s.charges.some(c=>c.id!==id&&c.bodyId===body.id))return {ok:false,reason:'duplicate'};Object.assign(charge,{bodyId:body.id,x:body.x,y:body.y});return {ok:true,charge:{...charge}};}
function remove(s,id){if(s.phase!=='planning')return false;const i=s.charges.findIndex(c=>c.id===id);if(i<0)return false;s.charges.splice(i,1);return true;}
function breakJoint(s,j,reason){if(j.broken)return;j.broken=true;s.events.push({type:'joint-broken',id:j.id,reason});}
function start(s){if(s.phase!=='planning'||!s.charges.length)return false;s.phase='running';s.events=[];for(const c of s.charges){const target=s.bodies[c.bodyId-1];target.removed=true;s.events.push({type:'blast',x:target.x,y:target.y});for(const j of s.joints)if(j.a===target.id||j.b===target.id)breakJoint(s,j,'cut');}
 // Finite local blast impulse, determined solely by charge placement. No random scattering.
 for(const b of s.bodies){if(b.removed)continue;let vx=0,vy=0;for(const c of s.charges){const dx=b.x-c.x,dy=b.y-c.y,d=Math.hypot(dx,dy);if(d<125&&d>0){const f=(1-d/125)*125;vx+=dx/d*f;vy+=dy/d*f;}}b.vx=vx;b.vy=vy;b.px=b.x-vx*STEP;b.py=b.y-vy*STEP;}
 return true;}
function obstacle(b,r){const dx=b.x-(r.x+r.w/2),dy=b.y-(r.y+r.h/2),ox=(b.w+r.w)/2-Math.abs(dx),oy=(b.h+r.h)/2-Math.abs(dy);if(ox<=0||oy<=0)return;if(ox<oy)b.x+=(dx<0?-ox:ox);else b.y+=(dy<0?-oy:oy);}
function fracture(s,b){if(b.removed||b.kind==='debris')return;b.removed=true;for(const j of s.joints)if(j.a===b.id||j.b===b.id)breakJoint(s,j,'impact');const side=Math.sqrt(b.w*b.h/3);for(let i=0;i<3;i++){const x=b.x+(i-1)*side*.8,y=Math.min(s.world.groundY-side/2,b.y-side*.35);const vx=clamp((b.x-b.px)/STEP,-100,100)+(i-1)*30;s.bodies.push({id:s.bodies.length+1,x,y,px:x-vx*STEP,py:y+12*STEP,w:side,h:side,mass:b.mass/3,kind:'debris',removed:false,vx,vy:-12,restX:x,restY:y});}s.events.push({type:'fracture',bodyId:b.id,x:b.x,y:b.y});}
function collisions(s){const impacts=new Set();for(const b of s.bodies){if(b.removed)continue;if(b.y+b.h/2>s.world.groundY&&(b.y-b.py)/STEP>110)impacts.add(b);b.y=Math.min(b.y,s.world.groundY-b.h/2);b.x=clamp(b.x,b.w/2,s.world.width-b.w/2);for(const wall of s.walls)obstacle(b,wall);}
 for(let i=0;i<s.bodies.length;i++){const a=s.bodies[i];if(a.removed)continue;for(let k=i+1;k<s.bodies.length;k++){const b=s.bodies[k];if(b.removed)continue;const dx=b.x-a.x,dy=b.y-a.y,ox=(a.w+b.w)/2-Math.abs(dx),oy=(a.h+b.h)/2-Math.abs(dy);if(ox<=0||oy<=0)continue;const relative=Math.abs(((b.y-b.py)-(a.y-a.py))/STEP);if(relative>150){if(a.y<b.y)impacts.add(a);else impacts.add(b);}const wa=b.mass/(a.mass+b.mass),wb=1-wa;if(ox<oy){const p=(dx>=0?1:-1)*ox;a.x-=p*wa;b.x+=p*wb;}else{const p=(dy>=0?1:-1)*oy;a.y-=p*wa;b.y+=p*wb;}}}
 for(const b of impacts)fracture(s,b);
}
function tick(s){s.time+=STEP;for(const b of s.bodies){if(b.removed)continue;const vx=clamp((b.x-b.px)*.985,-2.5,2.5),vy=clamp((b.y-b.py)*.985,-2.5,2.5);b.px=b.x;b.py=b.y;b.x+=vx;b.y+=vy+GRAVITY*STEP*STEP;}
 for(const j of s.joints){if(j.broken)continue;const a=s.bodies[j.a-1],b=s.bodies[j.b-1],strain=Math.abs(Math.hypot(b.x-a.x,b.y-a.y)-j.length);if(a.removed||b.removed||strain>j.strength)breakJoint(s,j,'stress');}
 for(let iteration=0;iteration<12;iteration++){
  for(const j of s.joints){if(j.broken)continue;const a=s.bodies[j.a-1],b=s.bodies[j.b-1],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<1e-8)continue;const correction=(d-j.length)/d*.85,wa=b.mass/(a.mass+b.mass);a.x+=dx*correction*wa;a.y+=dy*correction*wa;b.x-=dx*correction*(1-wa);b.y-=dy*correction*(1-wa);}
  collisions(s);
 }
 // Ground and walls are immovable; a final projection prevents visible floor penetration.
 for(const b of s.bodies){if(b.removed)continue;b.y=Math.min(b.y,s.world.groundY-b.h/2);for(const wall of s.walls)obstacle(b,wall);b.vx=(b.x-b.px)/STEP;b.vy=(b.y-b.py)/STEP;if(b.y>=s.world.groundY-b.h/2-.05){b.px=b.x-b.vx*STEP*.75;b.py=b.y;}
  for(const z of s.protectedZones){if(!b.hitProtected&&b.x+b.w/2>z.x&&b.x-b.w/2<z.x+z.w&&b.y+b.h/2>z.y&&b.y-b.h/2<z.y+z.h){b.hitProtected=true;s.protectedDamage++;s.events.push({type:'protected-hit',bodyId:b.id,zoneId:z.id});}}
 }
 const speed=Math.max(...s.bodies.filter(b=>!b.removed).map(b=>Math.hypot(b.vx,b.vy)),0);s.quietTime=speed<9?s.quietTime+STEP:0;
 if(s.time>=14||(s.time>2&&s.quietTime>1.1)){const remaining=s.bodies.filter(b=>!b.removed&&b.y-b.h/2<s.objective.clearanceY-2).length;const settled=s.quietTime>1.1;s.result={success:remaining===0&&s.protectedDamage===0&&settled,settled,reason:s.protectedDamage?'protected-hit':remaining?'height':!settled?'unsettled':'clear',remainingHigh:remaining,remainingHighIds:s.bodies.filter(b=>!b.removed&&b.y-b.h/2<s.objective.clearanceY-2).map(b=>b.id),hazardBodyIds:s.bodies.filter(b=>b.hitProtected).map(b=>b.id),protectedHits:s.protectedDamage,time:s.time};s.phase='finished';s.events.push({type:'finished',...s.result});}
}
function step(s,dt){if(s.phase!=='running')return [];if(!Number.isFinite(dt)||dt<=0)return [];s.events=[];s.accumulator+=Math.min(dt,.25);while(s.accumulator+1e-10>=STEP&&s.phase==='running'){s.accumulator-=STEP;tick(s);}return s.events.slice();}
function reset(s){const fresh=create(s.levelId);for(const key of Object.keys(s))delete s[key];Object.assign(s,fresh);return s;}
function getView(s){return {title:s.title,phase:s.phase,time:s.time,world:s.world,walls:s.walls,protectedZones:s.protectedZones,objective:s.objective,bodies:s.bodies.filter(b=>!b.removed).map(b=>({id:b.id,x:b.x,y:b.y,w:b.w,h:b.h,kind:b.kind,vx:b.vx,vy:b.vy,hitProtected:!!b.hitProtected})),joints:s.joints.filter(j=>!j.broken).map(j=>({id:j.id,a:j.a,b:j.b})),charges:s.charges.map(c=>({...c})),placementTargets:s.phase==='planning'?s.bodies.filter(b=>!b.removed).map(b=>({bodyId:b.id,x:b.x,y:b.y})):[],cutRadius:32,blastRadius:125,chargesLeft:s.objective.budget-s.charges.length,protectedDamage:s.protectedDamage,events:s.events.slice(),result:s.result,labels:{planning:bi('点击构件布置切断药包，最多3处；再引爆','Click structural pieces to place up to 3 cutting charges, then detonate'),running:bi('结构正在坍塌','Structure collapsing'),finished:bi('试验结束，可立即重试','Trial complete; retry immediately'),model:bi('简化结构模型：构件不旋转，连接可断裂；不是工程安全模拟','Simplified model: non-rotating pieces and breakable links, not an engineering safety simulator')}};}
return {create,place,move,remove,start,step,reset,getView,nearest,STEP};
});
