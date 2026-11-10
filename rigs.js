(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.Rigs=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const RULES=Object.freeze({reflect:Object.freeze({cooldown:9,duration:1.2,radius:60,damage:18}),press:Object.freeze({cooldown:3,healPerValue:.9,maxHeal:32}),pulse:Object.freeze({cooldown:7,radius:180,push:110,cargoSpeed:280})});
const finite=(v,f=0)=>Number.isFinite(v)?v:f;
function create(id='reflect'){if(!RULES[id])throw Error('Unknown rig');return {id,cooldown:0,active:0};}
function value(item){return item&&Number.isFinite(item.mass)&&Number.isFinite(item.hp)&&Number.isFinite(item.maxHp)&&item.mass>0&&item.hp>0&&item.maxHp>0?Math.min(3,item.mass)*12*Math.min(1,item.hp/item.maxHp):0;}
function activate(state,world){
 const p=world.player,events=[];
 const fail=reason=>[{type:'rig-blocked',rig:state.id,reason}];
 if(!(p?.hp>0))return fail('no-player');
 if(state.cooldown>1e-9)return fail('cooldown');
 if(state.id==='press'){
  if(!(p.hp<p.maxHp))return fail('full-hull');
  const cargo=world.cargo,index=cargo?.items.findIndex(item=>item.id===cargo.heldId)??-1;
  const item=index>=0?cargo.items[index]:null;
  if(!item||item.owner||item.thrown||!value(item))return fail('no-cargo');
  const spent=value(item),heal=Math.min(p.maxHp-p.hp,RULES.press.maxHeal,spent*RULES.press.healPerValue);
  cargo.items.splice(index,1);cargo.heldId=null;p.hp+=heal;
  events.push({type:'rig-repair',rig:state.id,itemId:item.id,value:spent,heal,x:p.x,y:p.y});
 }else if(state.id==='reflect'){
  state.active=RULES.reflect.duration;
  events.push({type:'rig-shield',rig:state.id,duration:state.active,x:p.x,y:p.y});
 }else if(state.id==='pulse'){
  const moved=new Set();let enemies=0,items=0;
  for(const e of world.enemies||[]){
   if(!e||moved.has(e)||!(e.hp>0)||e.type==='boss'||e.immovable)continue;
   const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy);if(!Number.isFinite(d)||d>=RULES.pulse.radius)continue;
   const angle=d?Math.atan2(dy,dx):finite(p.angle),force=RULES.pulse.push*(1-d/RULES.pulse.radius);
   e.x+=Math.cos(angle)*force;e.y+=Math.sin(angle)*force;moved.add(e);enemies++;
  }
  for(const item of world.cargo?.items||[]){
   if(item.id===world.cargo.heldId||item.owner||item.thrown||!(item.hp>0))continue;
   const dx=item.x-p.x,dy=item.y-p.y,d=Math.hypot(dx,dy);if(!Number.isFinite(d)||d>=RULES.pulse.radius)continue;
   const angle=d?Math.atan2(dy,dx):finite(p.angle),force=RULES.pulse.cargoSpeed*(1-d/RULES.pulse.radius);
   item.vx=finite(item.vx)+Math.cos(angle)*force;item.vy=finite(item.vy)+Math.sin(angle)*force;items++;
  }
  events.push({type:'rig-pulse',rig:state.id,enemies,items,radius:RULES.pulse.radius,x:p.x,y:p.y});
 }else return fail('unknown-rig');
 state.cooldown=RULES[state.id].cooldown;return events;
}
function hitTime(ax,ay,bx,by,cx,cy,r){
 const dx=bx-ax,dy=by-ay,ox=ax-cx,oy=ay-cy,c=ox*ox+oy*oy-r*r;
 if(c<=0)return 0;const a=dx*dx+dy*dy;if(!a)return Infinity;
 const b=2*(ox*dx+oy*dy),disc=b*b-4*a*c;if(disc<0)return Infinity;
 const t=(-b-Math.sqrt(disc))/(2*a);return t>=0&&t<=1?t:Infinity;
}
function update(state,world,dt=0){
 const events=[];dt=Math.max(0,finite(dt));
 const active=state.active;
 state.cooldown=Math.max(0,state.cooldown-dt);state.active=Math.max(0,state.active-dt);
 if(state.id!=='reflect'||active<=0||!(world.player?.hp>0))return events;
 const p=world.player,r=RULES.reflect.radius;
 for(const shot of world.shots||[]){
  if(!shot.enemy||shot.reflected||!(shot.life>0))continue;
  const ax=finite(shot.prevX,shot.x),ay=finite(shot.prevY,shot.y);
  const t=hitTime(ax,ay,shot.x,shot.y,p.x,p.y,r+Math.max(0,finite(shot.radius,3)));
  if(!Number.isFinite(t)||(dt>0&&t>active/dt)||shot.cargoHit&&shot.cargoHit.t<=t)continue;
  const x=ax+(shot.x-ax)*t,y=ay+(shot.y-ay)*t;
  let vx=-finite(shot.vx),vy=-finite(shot.vy);
  if(!vx&&!vy){const a=Math.atan2(x-p.x,y-p.y);vx=Math.sin(a)*150;vy=Math.cos(a)*150;}
  shot.x=shot.prevX=x;shot.y=shot.prevY=y;shot.vx=vx;shot.vy=vy;
  shot.enemy=false;shot.reflected=true;shot.source='rig-reflect';shot.damage=RULES.reflect.damage;
  shot.pierce=0;shot.hits=new Set();shot.life=Math.min(2,shot.life);delete shot.cargoHit;
  events.push({type:'rig-reflect',rig:state.id,x,y,shot});
 }
 return events;
}
return Object.freeze({RULES,create,activate,update,value});
});
