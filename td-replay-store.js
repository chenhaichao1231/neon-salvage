/* Local finished-attempt references only. Never restores or mutates simulation state. */
(function(root){'use strict';
const PREFIX='campus-defense-last-finished-v1:',MAX_RECORD=32768,MAX_CONTEXT=24000;
// Any change to engine semantics must change this fence. The source-hash test enforces it.
// Cosmetic engine edits may conservatively invalidate references; UI-only edits do not.
const COMBAT_REVISION='td-lanes-sha256:537c9d404a94be925e5b0c8632fca48a76cd74ba52269d8d142cd7bd5ceb1a5f;content-sha256:ba043f107226ce7338c46236a8883b3d46d275337ca0585e909ca6ff9d60cc0a';
const clone=x=>JSON.parse(JSON.stringify(x));
const canonical=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const keys=(v,want)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===want;
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const integer=n=>Number.isSafeInteger(n)&&n>=0&&n<=1000000;
function validFacts(v){return keys(v,'core,leaks,losses,outcome,refunded,spent,time,withdrawals')&&['won','lost'].includes(v.outcome)&&Number.isSafeInteger(v.core)&&v.core>=-1000000&&v.core<=5&&[v.leaks,v.losses].every(a=>Array.isArray(a)&&a.length===5&&a.every(integer))&&v.core===5-v.leaks.reduce((a,b)=>a+b,0)&&(v.outcome!=='won'||v.core>0)&&Number.isFinite(v.time)&&v.time>=0&&v.time<=1000000&&integer(v.spent)&&integer(v.withdrawals)&&v.withdrawals<=1&&integer(v.refunded)&&(v.withdrawals!==0||v.refunded===0);}
function summary(r){return {outcome:r.outcome,core:r.core,leaks:r.leaks.slice(),losses:r.losses.slice(),time:r.time,spent:r.spent,withdrawals:r.withdrawals,refunded:r.refunded};}
function safeTree(v,depth=0){if(depth>12)return false;if(v===null||typeof v==='boolean')return true;if(typeof v==='number')return Number.isFinite(v);if(typeof v==='string')return v.length<=4096;if(typeof v!=='object')return false;if(Array.isArray(v))return v.length<=1000&&v.every(x=>safeTree(x,depth+1));const ks=Object.keys(v);return ks.length<=1000&&ks.every(k=>!['__proto__','constructor','prototype'].includes(k)&&k.length<=128&&safeTree(v[k],depth+1));}
function validContext(raw,stage){if(typeof raw!=='string'||raw.length>MAX_CONTEXT)return false;try{const v=JSON.parse(raw);return keys(v,'definitions,economy,grid,revision,roster,seed,spawns,stage,stageRules,status')&&v.stage===stage&&integer(v.stage)&&Number.isSafeInteger(v.seed)&&typeof v.revision==='string'&&v.revision.length>0&&keys(v.roster,'allowed,unlocked')&&[v.roster.allowed,v.roster.unlocked].every(a=>Array.isArray(a)&&a.length<=32&&a.every(x=>typeof x==='string'))&&object(v.definitions)&&object(v.definitions.units)&&object(v.definitions.enemies)&&object(v.economy)&&object(v.grid)&&integer(v.grid.rows)&&integer(v.grid.cols)&&object(v.stageRules)&&object(v.status)&&Object.values(v.status).every(x=>object(x)&&Number.isFinite(x.first)&&Number.isFinite(x.period))&&Array.isArray(v.spawns)&&v.spawns.every(x=>object(x)&&integer(x.row)&&Number.isFinite(x.time)&&x.time>=0&&typeof x.type==='string')&&safeTree(v)&&canonical(v)===raw;}catch{return false;}}
function context(E,s){try{if(!s||!Number.isInteger(s.level)||!E.levels[s.level])return null;const {name,brief,phaseStarts,optional,spawns,...stageRules}=E.levels[s.level];const initial=['battle','won','lost'].includes(s.phase)&&s.snapshot?s.snapshot:s;const raw=canonical({revision:COMBAT_REVISION,stage:s.level,seed:initial.seed,status:initial.statusSchedule,spawns:E.preview(s.level),definitions:E.definitions,economy:E.economy,grid:E.grid,roster:{allowed:E.roster.slice().sort(),unlocked:initial.unlocked.slice().sort()},stageRules});return validContext(raw,s.level)?raw:null;}catch{return null;}}
function decode(raw,stage){if(typeof raw!=='string'||raw.length>MAX_RECORD)return null;try{const v=JSON.parse(raw);return keys(v,'context,facts,version')&&v.version===1&&validContext(v.context,stage)&&validFacts(v.facts)?v:null;}catch{return null;}}
function create(E,storage){const memory=new Map(),blocked=new Set(),notices=new Map(),sources=new Map();let active=null;
 const stageOK=n=>Number.isInteger(n)&&n>=0&&n<E.levels.length;
 const status=stage=>({notice:notices.get(stage)||null,provenance:sources.get(stage)||null});
 function block(stage,notice){blocked.add(stage);notices.set(stage,notice);}
 // A preflight validates but never swaps the frozen comparison baseline.
 function read(stage,load){if(blocked.has(stage))return null;let raw;try{if(!storage)throw Error('storage');raw=storage.getItem(PREFIX+stage);}catch{block(stage,'read-failed');return null;}
  if(raw===null){if(load&&sources.get(stage)==='browser'){memory.delete(stage);sources.delete(stage);}return null;}
  const value=decode(raw,stage);if(!value){block(stage,'unrecognized');return null;}if(load){memory.set(stage,value);sources.set(stage,'browser');notices.delete(stage);}return value;
 }
 function reference(s){const key=context(E,s),record=memory.get(s.level);return {historical:record?clone(record.facts):null,historicalProvenance:record?sources.get(s.level)||null:null,previous:key&&record?.context===key?clone(record.facts):null,provenance:record&&key&&record.context===key?sources.get(s.level)||null:null,notice:notices.get(s.level)||null,context:key,incompatible:!!(record&&record.context!==key)};}
 return {
  load(s){active=null;if(!stageOK(s?.level))return {historical:null,historicalProvenance:null,previous:null,provenance:null,notice:'invalid-context',context:null,incompatible:false};read(s.level,true);return reference(s);},
  begin(s,cached){const key=context(E,s);let previous=null,previousProvenance=null;try{if(key&&cached?.context===key&&validFacts(cached.previous)){previous=clone(cached.previous);previousProvenance=['browser','session'].includes(cached.provenance)?cached.provenance:null;}}catch{}active=stageOK(s?.level)?{stage:s.level,key,previous,previousProvenance,incompatible:!previous&&!!cached?.historical}:null;return {previous:clone(previous),provenance:previousProvenance,notice:notices.get(s?.level)||null,context:key,incompatible:!!active?.incompatible};},
  cancel(){active=null;},status,
  finish(r,s){if(!active||!['won','lost'].includes(s?.phase))return null;const a=active;active=null;let facts;
   try{facts=summary(r);if(!a.key||s.level!==a.stage||context(E,s)!==a.key||r.outcome!==s.phase||!validFacts(facts))throw Error('facts');}catch{notices.set(a.stage,'invalid-facts');return null;}
   // Best-effort bounded preflight, not atomic CAS. Concurrent valid writes are
   // last-successful-write wins; no global chronology is promised.
   read(a.stage,false);const value={version:1,context:a.key,facts};memory.set(a.stage,clone(value));sources.set(a.stage,'session');
   if(!blocked.has(a.stage)){try{const raw=JSON.stringify(value);if(raw.length>MAX_RECORD)throw Error('size');storage.setItem(PREFIX+a.stage,raw);sources.set(a.stage,'browser');notices.delete(a.stage);}catch{block(a.stage,'write-failed');}}
   return {previous:clone(a.previous),previousProvenance:a.previousProvenance,incompatible:a.incompatible,...status(a.stage)};
  }
 };
}
const api={PREFIX,MAX_RECORD,MAX_CONTEXT,COMBAT_REVISION,context,summary,validFacts,create};root.TDReplayStore=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
