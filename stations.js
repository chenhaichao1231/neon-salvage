(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.Stations=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const RULES=Object.freeze({feedRadius:80,range:360,interval:.65,bulletSpeed:520,damage:22,ammoPerMass:6});
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const finite=(v,f)=>Number.isFinite(v)?v:f;
  function create(layout=[]){
    // Root owns layout/randomness. Each copied station begins disabled/empty.
    const ids=new Set();
    const stations=layout.map((p,i)=>{
      const id=p.id??i;
      if(ids.has(id)) throw new Error('Duplicate station id');
      ids.add(id);
      return {id,x:finite(p.x,0),y:finite(p.y,0),radius:22,feedRadius:RULES.feedRadius,range:RULES.range,ammo:0,cooldown:0,angle:0};
    });
    return {stations};
  }
  function feed(state,cargo,player,stationId){
    const station=state.stations.find(s=>s.id===stationId);
    const index=cargo.items.findIndex(item=>item.id===cargo.heldId);
    if(!station||!player||index<0) return null;
    const item=cargo.items[index];
    if(item.owner||item.thrown||!(item.hp>0)||!(item.maxHp>0)||!(item.mass>0)||!Number.isFinite(item.hp)||!Number.isFinite(item.maxHp)||!Number.isFinite(item.mass)) return null;
    // The object must actually be delivered, not merely the towing player.
    if(!(distance(player,station)<=RULES.feedRadius)||!(distance(item,station)<=RULES.feedRadius)) return null;
    const ammo=Math.max(1,Math.floor(RULES.ammoPerMass*Math.min(3,item.mass)*Math.min(1,item.hp/item.maxHp)));
    cargo.items.splice(index,1);
    cargo.heldId=null;
    station.ammo+=ammo;
    // Never modify cargo.banked: this is an exclusive resource sink.
    return {type:'station-fed',stationId:station.id,itemId:item.id,ammo,totalAmmo:station.ammo,x:station.x,y:station.y};
  }
  function update(state,enemies=[],dt=0){
    const shots=[];
    if(!Number.isFinite(dt)||dt<=0) return shots;
    for(const station of state.stations){
      // At most one shot per update, no offscreen catch-up burst after a stall.
      station.cooldown=Math.max(0,station.cooldown-dt);
      if(station.ammo<=0||station.cooldown>1e-9) continue;
      let target=null,best=station.range;
      for(const enemy of enemies){
        if(!enemy||enemy.dead===true||!(enemy.hp>0)) continue;
        const d=distance(station,enemy);
        if(d<=best && (target===null||d<best)){best=d;target=enemy;}
      }
      if(!target) continue;
      station.angle=Math.atan2(target.y-station.y,target.x-station.x);
      const vx=Math.cos(station.angle)*RULES.bulletSpeed,vy=Math.sin(station.angle)*RULES.bulletSpeed;
      shots.push({x:station.x,y:station.y,vx,vy,life:1.1,damage:RULES.damage,pierce:0,hits:new Set(),enemy:false,source:'station',stationId:station.id});
      station.ammo--; station.cooldown=RULES.interval;
    }
    return shots;
  }
  return Object.freeze({create,feed,update,RULES});
});
