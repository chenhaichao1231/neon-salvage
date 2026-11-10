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
const api={clamp,distance,seeded,normalize,reward,safeSave,edgeIndicator,contractBonus,encodeBackup,decodeBackup};root.Salvage=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
