/* Pure utilities shared by gameplay and automated checks. No external dependencies. */
(function(root){'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function seeded(seed){let n=seed>>>0;return()=>{n=(n+0x6D2B79F5)|0;let t=Math.imul(n^n>>>15,1|n);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};}
function normalize(x,y){const d=Math.hypot(x,y);return d?{x:x/d,y:y/d}:{x:0,y:0};}
function reward(kills,seconds,escaped){return Math.floor(kills*.5+seconds*.08)*(escaped?2:1);}
function safeSave(raw){try{const p=JSON.parse(raw);return{credits:clamp(Number(p.credits)||0,0,1e7),hull:clamp(Math.floor(Number(p.hull)||0),0,5),power:clamp(Math.floor(Number(p.power)||0),0,5),best:clamp(Number(p.best)||0,0,1e9),runs:clamp(Number(p.runs)||0,0,1e6)};}catch{return{credits:0,hull:0,power:0,best:0,runs:0};}}
const api={clamp,distance,seeded,normalize,reward,safeSave};root.Salvage=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
