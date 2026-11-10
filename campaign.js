(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.Campaign=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION=1,CORE_ID='echo-station:record-01';
const texts={
 zh:{projectsTitle:'给下一次出航留一条路',westProject:'西侧前哨 · 180 合金，一次建成。固定在 (-380,220)，改变绕行与补给路线；与东侧互斥，不增加船体等级。',eastProject:'东侧前哨 · 180 合金，一次建成。固定在 (420,-200)，改变绕行与补给路线；与西侧互斥，不增加炮管等级。',suppliesProject:'炮台弹药包 · 每包 40 合金、12 发，最多预存 3 包。有炮台的出航才消耗，不是永久伤害升级。',title:'失联站：余温',signal:'接线员岑：这里是回声站。居住区还有热源，工坊还能供电。我们只能撑住一路。',objective:'在拾荒区找到记录核心，将它完整拖回回收站。不要卖掉、投掷或烧掉它。',core:'记录员洛：核心里不是求救循环，是六小时前的留言。有人一直在给门锁供电。',decision:'岑：核心只够启动一条母线。先接居住区，我们能打开避难门；先接工坊，我们能造出破障设备。另一条线需要下一枚核心。',habitatTitle:'接通居住区',habitatDetail:'打开避难门，获得主动急救压机（消耗残骸修复）；后续出航出现避难信标。工坊暂时维持低温。',workshopTitle:'重启工坊',workshopDetail:'恢复加工线，获得主动反射屏障；后续出航出现失效炮台，需要残骸供能。居住区继续使用应急电源。',habitatEnding:'岑：门开了。三个人正往信标走。洛：工坊的自动机还在敲门，我们下次去接它。',workshopEnding:'洛：第一台反射器下线了。岑：居住区回信了，他们把最后一盏灯留给我们认路。',clue:'核心末尾藏着一张航图：第七码头。上面写着“别跟着广播走，找没有灯的泊位”。',complete:'第一章完成。下一章尚未开放；当前分支装备与设施可在之后的拾荒航行中使用。',coreLost:'记录核心受损遗失。下一次拾荒航行可再次寻找，已完成的进度不会倒退。'},
 en:{projectsTitle:'Make a route for your next run',westProject:'West outpost: 180 alloy, built once at (-380,220). Changes your detour and resupply route. Mutually exclusive with East; does not increase hull levels.',eastProject:'East outpost: 180 alloy, built once at (420,-200). Changes your detour and resupply route. Mutually exclusive with West; does not increase weapon levels.',suppliesProject:'Turret supply pack: 40 alloy for 12 rounds, up to 3 stored packs. Consumed only on a run with a turret, not a permanent damage upgrade.',title:'Silent Station: Residual Heat',signal:'Operator Cen: This is Echo Station. There are heat signatures in the habitat, and the workshop still has power. We can keep only one line running.',objective:'Find the record core in the salvage field and tow it intact to the recycler. Do not sell, throw, or burn it.',core:'Archivist Luo: This is not a distress loop. The message is six hours old. Someone has been keeping the door locks powered.',decision:'Cen: The core can start one bus. Connect the habitat and we can open the shelter doors. Connect the workshop and we can build breaching equipment. The other line needs another core.',habitatTitle:'Connect the habitat',habitatDetail:'Open the shelter doors and unlock an active salvage-powered repair press. Shelter beacons appear on later runs. The workshop stays on minimal heating.',workshopTitle:'Restart the workshop',workshopDetail:'Restore fabrication and unlock an active reflective barrier. Disabled turrets appear on later runs and need salvage for fuel. The habitat stays on emergency power.',habitatEnding:'Cen: The doors are open. Three people are moving toward the beacon. Luo: The workshop automaton is still knocking. We will come for it next time.',workshopEnding:'Luo: The first reflector is off the line. Cen: The habitat answered. They saved their last light to guide us back.',clue:'The end of the core contains a navigation chart: Dock Seven. A note reads, “Do not follow the broadcast. Find the berth with no lights.”',complete:'Chapter One complete. The next chapter is not available yet. Your branch equipment and facilities remain usable in later salvage runs.',coreLost:'The damaged record core was lost. Search again on your next salvage run; completed progress is preserved.'}
};
for(const locale of Object.values(texts))Object.freeze(locale);Object.freeze(texts);
function fresh(){return {version:VERSION,chapter:1,coreBanked:false,bankedCoreIds:[],choice:null,completed:false,projects:{outpost:null,supplies:0}};}
function sanitize(input){
 let raw=input;if(typeof raw==='string'){try{raw=JSON.parse(raw);}catch{return fresh();}}
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return fresh();
 // Preserve the legacy ship save separately; never interpret its levels as story state.
 if(raw.version!==undefined && raw.version!==0 && raw.version!==VERSION)return fresh();
 const state=fresh();
 const ids=Array.isArray(raw.bankedCoreIds)?raw.bankedCoreIds:[];
 state.coreBanked=raw.coreBanked===true||ids.includes(CORE_ID);
 state.bankedCoreIds=state.coreBanked?[CORE_ID]:[];
 if(state.coreBanked&&(raw.choice==='habitat'||raw.choice==='workshop'))state.choice=raw.choice;
 state.completed=state.choice!==null;
 if(raw.projects&&typeof raw.projects==='object'){state.projects.outpost=['west','east'].includes(raw.projects.outpost)?raw.projects.outpost:null;state.projects.supplies=Number.isInteger(raw.projects.supplies)?Math.max(0,Math.min(3,raw.projects.supplies)):0;}
 return state;
}
function onCoreBanked(state,coreId){
 if(coreId!==CORE_ID||state.coreBanked||state.bankedCoreIds.includes(coreId))return null;
 state.coreBanked=true;state.bankedCoreIds.push(coreId);
 return {type:'campaign-core',coreId,gameplayEffects:{consumeCore:true,credits:0},textKey:'core'};
}
function availableChoices(state){return state.coreBanked&&!state.choice?['habitat','workshop']:[];}
function choose(state,choice){
 if(!availableChoices(state).includes(choice))return null;
 state.choice=choice;state.completed=true;
 return {type:'campaign-choice',choice,textKey:choice+'Ending',gameplayEffects:getEffects(state)};
}
function getEffects(state){
 const base={chapter:1,entryCost:0,requiresShipReset:false,spawnRecordCore:!state.coreBanked,recordCoreId:CORE_ID,recordCoreSpawn:{x:280,y:-160,guaranteed:true},baseEquipment:{id:'pulse'},activeEquipment:null,unlockedEquipment:['pulse'],facilities:[],nextChapterAvailable:false,outpost:state.projects.outpost?{id:state.projects.outpost,...OUTPOSTS[state.projects.outpost]}:null,supplyPacks:state.projects.supplies};
 if(state.choice==='habitat'&&state.coreBanked){
  base.activeEquipment={id:'press',consumesHeldSalvage:true};base.unlockedEquipment.push('press');
  base.facilities=[{type:'shelter-beacon',radius:95,repairCargoPerSecond:2,repairBudget:30}];
 }else if(state.choice==='workshop'&&state.coreBanked){
  base.activeEquipment={id:'reflect'};base.unlockedEquipment.push('reflect');
  base.facilities=[{type:'salvage-turret',count:2,startsWithAmmo:0,requiresSalvageFuel:true}];
 }
 return base;
}
const OUTPOSTS=Object.freeze({west:Object.freeze({x:-380,y:220}),east:Object.freeze({x:420,y:-200})});
function buyProject(state,wallet,id){
 if(!wallet||!Number.isSafeInteger(wallet.credits)||wallet.credits<0)return null;
 if(!state.projects)return null;
 const outpost=id==='west'||id==='east';
 if(!outpost&&id!=='supplies')return null;
 if(outpost&&state.projects.outpost!==null||!outpost&&(!Number.isInteger(state.projects.supplies)||state.projects.supplies<0||state.projects.supplies>=3))return null;
 const cost=outpost?180:40;
 if(wallet.credits<cost)return null;
 wallet.credits-=cost;
 if(outpost)state.projects.outpost=id;else state.projects.supplies++;
 return {type:'project-bought',id,cost,outpost:state.projects.outpost,supplyPacks:state.projects.supplies};
}
function consumeSupplies(state){
 if(!state.projects||!Number.isInteger(state.projects.supplies)||state.projects.supplies<0||state.projects.supplies>3)return 0;
 const ammo=state.projects.supplies*12;state.projects.supplies=0;return ammo;
}
function isValid(value){
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const keys=['version','chapter','coreBanked','bankedCoreIds','choice','completed','projects'];
 if(Object.keys(value).length!==keys.length||!keys.every(k=>Object.prototype.hasOwnProperty.call(value,k)))return false;
 if(value.version!==VERSION||value.chapter!==1||typeof value.coreBanked!=='boolean'||typeof value.completed!=='boolean'||!Array.isArray(value.bankedCoreIds))return false;
 const projects=value.projects;
 if(!projects||typeof projects!=='object'||Array.isArray(projects)||Object.keys(projects).length!==2||!Object.prototype.hasOwnProperty.call(projects,'outpost')||!Object.prototype.hasOwnProperty.call(projects,'supplies')||projects.outpost!==null&&!['west','east'].includes(projects.outpost)||!Number.isInteger(projects.supplies)||projects.supplies<0||projects.supplies>3)return false;
 if(value.choice!==null&&value.choice!=='habitat'&&value.choice!=='workshop')return false;
 if(value.bankedCoreIds.length!==(value.coreBanked?1:0)||value.coreBanked&&value.bankedCoreIds[0]!==CORE_ID)return false;
 return (!value.choice||value.coreBanked)&&value.completed===(value.choice!==null);
}
function validate(value){if(!isValid(value))throw new Error('Invalid campaign save');return sanitize(value);}
return Object.freeze({VERSION,CORE_ID,new:fresh,create:fresh,sanitize,isValid,validate,buyProject,consumeSupplies,onCoreBanked,availableChoices,choose,getEffects,texts,bilingualtexts:texts});
});
