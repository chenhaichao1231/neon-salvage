/* Pure utilities shared by gameplay and automated checks. No external dependencies. */
(function(root){'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function seeded(seed){let n=seed>>>0;return()=>{n=(n+0x6D2B79F5)|0;let t=Math.imul(n^n>>>15,1|n);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};}
function normalize(x,y){const d=Math.hypot(x,y);return d?{x:x/d,y:y/d}:{x:0,y:0};}
function edgeIndicator(dx,dy,width,height,margin=42){const x=Math.max(1,width/2-margin),y=Math.max(1,height/2-margin);const scale=Math.min(1,x/Math.max(.001,Math.abs(dx)),y/Math.max(.001,Math.abs(dy)));return{x:width/2+dx*scale,y:height/2+dy*scale,angle:Math.atan2(dy,dx),visible:scale<1};}
function contractBonus(kills,caches,guardians){return 20*((kills>=60?1:0)+(caches>=3?1:0)+(guardians>=1?1:0));}
function reward(kills,seconds,escaped){return Math.floor(kills*.5+seconds*.08)*(escaped?2:1);}
function encodeBackup(data){return JSON.stringify({app:'NeonSalvage',format:1,data:safeSave(JSON.stringify(data))},null,2);}
function decodeBackup(text){if(typeof text!=='string'||text.length>10000)throw Error('size');const obj=JSON.parse(text);if(obj?.app!=='NeonSalvage'||obj.format!==1||!obj.data||Array.isArray(obj.data))throw Error('format');for(const k of ['credits','hull','power','best','runs'])if(typeof obj.data[k]!=='number'||!Number.isFinite(obj.data[k])||obj.data[k]<0)throw Error('data');if(obj.data.hull>5||obj.data.power>5||!Number.isInteger(obj.data.hull)||!Number.isInteger(obj.data.power))throw Error('upgrade');return safeSave(JSON.stringify(obj.data));}
function safeSave(raw){try{const p=JSON.parse(raw);return{credits:clamp(Number(p.credits)||0,0,1e7),hull:clamp(Math.floor(Number(p.hull)||0),0,5),power:clamp(Math.floor(Number(p.power)||0),0,5),best:clamp(Number(p.best)||0,0,1e9),runs:clamp(Number(p.runs)||0,0,1e6)};}catch{return{credits:0,hull:0,power:0,best:0,runs:0};}}
function safeHistory(raw){try{if(typeof raw!=='string'||raw.length>50000)return [];const entries=JSON.parse(raw);if(!Array.isArray(entries))return [];return entries.slice(0,20).filter(e=>e&&['scout','tank','glass'].includes(e.ship)&&Number.isInteger(e.seed)&&e.seed>=0&&e.seed<=4294967295&&typeof e.daily==='boolean'&&typeof e.escaped==='boolean'&&Number.isFinite(e.time)&&e.time>=0&&Number.isFinite(e.score)&&e.score>=0&&Number.isFinite(e.kills)&&e.kills>=0&&typeof e.version==='string'&&e.version.length<=32&&/^\d+\.\d+\.\d+$/.test(e.version)&&Number.isInteger(e.hull)&&e.hull>=0&&e.hull<=5&&Number.isInteger(e.power)&&e.power>=0&&e.power<=5).map(e=>({ship:e.ship,seed:e.seed,daily:e.daily,escaped:e.escaped,time:Math.floor(Math.min(e.time,1e7)),score:Math.floor(Math.min(e.score,1e9)),kills:Math.floor(Math.min(e.kills,1e7)),version:e.version,hull:e.hull,power:e.power}));}catch{return [];}}

function encodeBundle(data,campaign,validateStory,dock,validateDock){
 if(typeof validateStory!=='function')throw Error('story validator missing');
 const story=validateStory(campaign),payload={app:'NeonSalvage',format:2,data:safeSave(JSON.stringify(data)),campaign:story};
 if(arguments.length>3){if(typeof validateDock!=='function')throw Error('dock validator missing');payload.dock=validateDock(dock);payload.format=3;}
 return JSON.stringify(payload,null,2);
}
function decodeBundle(text,validateStory,validateDock){
 if(typeof text!=='string'||text.length>10000)throw Error('size');
 const obj=JSON.parse(text);let result;
 if(obj?.format===1)result={data:decodeBackup(text),campaign:null};
 else{
  if(obj?.app!=='NeonSalvage'||![2,3].includes(obj.format)||typeof validateStory!=='function')throw Error('format');
  if(obj.format===3&&typeof validateDock!=='function')throw Error('dock validator missing');
  const data=decodeBackup(JSON.stringify({app:'NeonSalvage',format:1,data:obj.data}));
  result={data,campaign:validateStory(obj.campaign)};
 }
 if(typeof validateDock==='function')result.dock=obj.format===3?validateDock(obj.dock):null;
 return result;
}

const api={encodeBundle,decodeBundle,safeHistory,clamp,distance,seeded,normalize,reward,safeSave,edgeIndicator,contractBonus,encodeBackup,decodeBackup};root.Salvage=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
