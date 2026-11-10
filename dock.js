(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.Dock=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION=1,RANGE=100,VALUE=12;
const sessions=new WeakMap();
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const worth=i=>i&&Number.isFinite(i.mass)&&Number.isFinite(i.hp)&&Number.isFinite(i.maxHp)&&i.hp>0&&i.maxHp>0?Math.max(0,Math.min(3,i.mass))*12*Math.min(1,i.hp/i.maxHp):0;
function create(){return {version:VERSION,outcome:null,completed:false};}
function isValid(s){return !!s&&typeof s==='object'&&!Array.isArray(s)&&Object.keys(s).length===3&&s.version===VERSION&&[null,'partner','archive'].includes(s.outcome)&&s.completed===(s.outcome!==null);}
function migrate(raw){if(typeof raw==='string'){try{raw=JSON.parse(raw);}catch{return create();}}if(raw==null||raw.version===0)return create();if(!isValid(raw))throw Error('Invalid or unsupported Dock save');return {...raw};}
function validate(raw){if(!isValid(raw))throw Error('Invalid Dock save');return {...raw};}
function start(state,cargo,Cargo,options={}){
 validate(state);
 const existing=sessions.get(cargo);if(existing&&!existing.terminal)return existing;
 if(!options.chapter1Completed||state.completed||cargo.items.length>=24||cargo.items.some(i=>i.storyId==='dock-seven:black-box'))return null;
 const record=Cargo.add(cargo,480,-180,1);if(!record)return null;
 // The original object leaves the field into the freighter hold; detach moves it back.
 cargo.items.splice(cargo.items.indexOf(record),1);record.storyId='dock-seven:black-box';record.owner='dock:hold';
 const run={status:'choice',route:null,record,recordId:record.id,freighter:{x:480,y:-180,hp:120,maxHp:120,radius:26,type:'freighter',angle:0},home:{x:0,y:0,radius:65},branch:['habitat','workshop'].includes(options.chapter1Choice)?options.chapter1Choice:null,assisted:false,deliveryTime:0,terminal:false};
 sessions.set(cargo,run);return run;
}
function blocked(reason){return [{type:'dock-blocked',reason}];}
function act(state,run,world,action){
 if(!run||run.terminal||state.completed||run.status!=='choice')return blocked('unavailable');
 if(!(world.player?.hp>0)||distance(world.player,run.freighter)>RANGE)return blocked('out-of-range');
 const cargo=world.cargo;
 if(action==='fuel'){
  const index=cargo.items.findIndex(i=>i.id===cargo.heldId),item=cargo.items[index];
  if(!item||item.owner||item.thrown||item.storyId||worth(item)<VALUE||distance(item,run.freighter)>RANGE)return blocked('fuel-required');
  cargo.items.splice(index,1);cargo.heldId=null;
  run.route='partner';run.status='returning';
  return [{type:'dock-fueled',itemId:item.id,value:worth(item),textKey:'fuel'}];
 }
 if(action==='detach'){
  if(cargo.items.length>=24)return blocked('field-full');
  const record=run.record;if(!record||cargo.items.some(i=>i.id===record.id))return blocked('record-unavailable');
  delete record.owner;record.x=run.freighter.x;record.y=run.freighter.y;record.vx=record.vy=record.bankTime=0;
  cargo.items.push(record);run.record=null;run.route='archive';run.status='record-free';
  return [{type:'dock-detached',itemId:record.id,textKey:'detach'}];
 }
 return blocked('unknown-action');
}
function fail(run,reason){run.status='failed';run.terminal=true;run.record=null;return [{type:'dock-failed',reason,textKey:'failed'}];}
function complete(state,run,outcome){if(state.completed||run.terminal)return [];state.outcome=outcome;state.completed=true;run.status='completed';run.terminal=true;run.record=null;return [{type:'dock-complete',outcome,textKey:outcome+'Ending',credits:0}];}
function deliver(state,run,cargo,player){
 if(!run||run.terminal||state.completed||run.route!=='archive')return [];
 const index=cargo.items.findIndex(i=>i.id===run.recordId),item=cargo.items[index];
 if(!item||item.storyId!=='dock-seven:black-box'||item.owner||item.thrown||item.hp<=0||cargo.heldId!==item.id||distance(player,run.home)>run.home.radius||distance(item,run.home)>run.home.radius||item.bankTime<1.5)return [];
 cargo.items.splice(index,1);cargo.heldId=null;return complete(state,run,'archive');
}
function update(state,run,world,dt=0){
 if(!run||run.terminal||state.completed)return [];
 const events=[];dt=Number.isFinite(dt)?Math.max(0,Math.min(.25,dt)):0;
 if(!(world.player?.hp>0))return fail(run,'pilot-lost');
 if(run.route==='archive'){
  const item=world.cargo.items.find(i=>i.id===run.recordId);
  if(!item||item.hp<=0)return fail(run,'record-lost');
  return deliver(state,run,world.cargo,world.player);
 }
 if(run.freighter.hp<=0){
  if(run.branch==='habitat'&&!run.assisted&&run.status==='returning'){run.freighter.hp=40;run.assisted=true;events.push({type:'dock-assist',branch:'habitat',textKey:'habitatAssist'});}
  else return fail(run,'freighter-lost');
 }
 if(run.status!=='returning')return events;
 if(run.branch==='workshop'&&!run.assisted){run.freighter.hp=Math.min(120,run.freighter.hp+30);run.assisted=true;events.push({type:'dock-assist',branch:'workshop',textKey:'workshopAssist'});}
 const f=run.freighter,d=distance(f,run.home),speed=run.branch==='workshop'?70:52;
 f.angle=Math.atan2(run.home.y-f.y,run.home.x-f.x);const step=Math.min(speed*dt,Math.max(0,d-run.home.radius));f.x+=Math.cos(f.angle)*step;f.y+=Math.sin(f.angle)*step;
 if(distance(f,run.home)<=run.home.radius+1e-7)events.push(...complete(state,run,'partner'));
 return events;
}
function finishRun(run,cargo){if(!run||run.terminal)return [];const i=cargo.items.findIndex(i=>i.id===run.recordId);if(i>=0){cargo.items.splice(i,1);if(cargo.heldId===run.recordId)cargo.heldId=null;}return fail(run,'run-ended');}
function effects(state){validate(state);return {partner:state.outcome==='partner',facility:state.outcome==='partner'?'transfer-point':state.outcome==='archive'?'listening-post':null};}
function createFacility(state,options={}){const e=effects(state);return {type:e.facility,x:Number.isFinite(options.x)?options.x:220,y:Number.isFinite(options.y)?options.y:100,radius:75,used:false,targetId:null};}
function transfer(facility,cargo,player){
 if(facility.type!=='transfer-point'||facility.used||distance(player,facility)>facility.radius)return null;
 const index=cargo.items.findIndex(i=>i.id===cargo.heldId),item=cargo.items[index];
 if(!item||item.owner||item.thrown||item.storyId||worth(item)<=0||distance(item,facility)>facility.radius)return null;
 const value=worth(item);cargo.items.splice(index,1);cargo.heldId=null;cargo.banked+=value;facility.used=true;
 return {type:'dock-transfer',itemId:item.id,value,x:facility.x,y:facility.y};
}
function scan(facility,cargo,player){
 if(facility.type!=='listening-post')return null;
 let best=null;for(const item of cargo.items){if(item.owner||item.thrown||item.storyId||item.id===cargo.heldId||worth(item)<=0)continue;if(!best||worth(item)>worth(best)||worth(item)===worth(best)&&distance(player,item)<distance(player,best))best=item;}
 facility.targetId=best?best.id:null;
 return best?{type:'dock-scan',itemId:best.id,x:best.x,y:best.y,value:worth(best),angle:Math.atan2(best.y-player.y,best.x-player.x),distance:distance(player,best)}:null;
}
const texts={zh:{title:'第七码头：未熄的引擎',signal:'货运员米拉：广播在引走拾荒者。我的艇还能飞，只缺燃料。你能带走记录，也能帮我们把整艘艇带回去。',choice:'给艇投入一件剩余价值至少12的残骸，它将自行返航；或拆下唯一黑匣子，亲自拖回站。拆下记录后，船员乘救生舱撤离，货运艇将放弃。两种选择均不可在本局撤销。',fuel:'米拉：引擎点着了。你不用跟着我，但别让掠夺者截住返航路线。',detach:'米拉：记录交给你。我们改乘救生舱，艇就留在这里。小心，其他拾荒者也认得这只匣子。',habitatAssist:'岑：避难信标接上了应急电源。艇还能撑一次，继续走！',workshopAssist:'洛：远程补丁已经上传。修补30船体，返航速度提升；这次不会再有第二份补丁。',partnerEnding:'米拉：艇和记录都到了。下一次，我会在转运点替你送走一件货物。不是每件，一次航行只能腾出一个舱位。',archiveEnding:'洛：记录完整。我们能建监听台，指向现场价值最高的自由货物。米拉确认救生舱已到避难区，但货运合作暂时无船可用。',failed:'本次记录未能带回。已完成的章节和建设保留，下次可重试第七码头。',transfer:'转运点：每次出航自动交付一件带到这里的普通手持货物，按剩余价值入账。',scan:'监听台：显示现场价值最高的自由普通货物方向，不生成或复制货物。'},en:{title:'Dock Seven: Engines Still Warm',signal:'Hauler Mira: The broadcast is drawing scavengers away. My ship can still fly, but it needs fuel. You can take the record, or help bring the whole ship home.',choice:'Spend one wreck worth at least 12 remaining alloy to send the freighter home under its own power, or detach its unique black box and tow it back yourself. If you detach it, the crew leaves by escape pod and abandons the freighter. Neither choice can be reversed during this run.',fuel:'Mira: Engines lit. You do not have to follow me, but keep the raiders from cutting off the route home.',detach:'Mira: The record is yours. We are taking the escape pod and leaving the ship. Watch out: other scavengers recognize that box.',habitatAssist:'Cen: The shelter beacon has connected emergency power. The ship can survive one more failure. Keep moving!',workshopAssist:'Luo: Remote patch delivered. Restored 30 hull and increased return speed. There will not be a second patch this run.',partnerEnding:'Mira: Ship and record are home. Next time, I can forward one cargo item from the transfer point. Just one: I have one spare slot per run.',archiveEnding:'Luo: The record is intact. We can build a listening post that points to the most valuable free cargo nearby. Mira confirms the escape pod reached shelter, but there is no ship available for a hauling partnership.',failed:'The record did not make it home this run. Completed chapters and construction are preserved. Retry Dock Seven on your next run.',transfer:'Transfer point: automatically delivers one ordinary held cargo item brought here per run, banking its remaining value.',scan:'Listening post: points toward the most valuable free ordinary cargo in the field. It creates no cargo and duplicates nothing.'}};
for(const t of Object.values(texts))Object.freeze(t);Object.freeze(texts);
return Object.freeze({VERSION,RANGE,create,isValid,migrate,validate,start,act,update,deliver,finishRun,effects,createFacility,transfer,scan,texts});
});
