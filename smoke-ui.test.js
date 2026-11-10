'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
for(const file of ['index.html','world.html','bodies.html','cargo.html']){
 const html=fs.readFileSync(__dirname+'/'+file,'utf8'),nodes=new Map(),listeners={};
 const ctx=new Proxy({measureText:t=>({width:String(t).length*8}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})}, {get:(o,p)=>p in o?o[p]:(()=>{})});
 function node(id){if(!nodes.has(id))nodes.set(id,{id,dataset:{},style:{},classList:{add(){},remove(){},toggle(){}},textContent:'',innerHTML:'',hidden:false,disabled:false,tagName:'DIV',querySelectorAll:()=>[],getContext:()=>ctx,setAttribute(k,v){this[k]=v;},getAttribute(k){return this[k]},addEventListener(t,f){this['on'+t]=f},getBoundingClientRect:()=>({left:0,top:0,width:800,height:640}),setPointerCapture(){},releasePointerCapture(){}});return nodes.get(id);}
 for(const m of html.matchAll(/id="([^"]+)"/g))node(m[1]);
 const dataNodes=[...html.matchAll(/<button[^>]*data-([\w-]+)="([^"]+)"[^>]*>/g)].map((m,i)=>{const n=node('data-'+i);n.tagName='BUTTON';n.dataset[m[1].replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=m[2];return n});
 const document={documentElement:{lang:'zh'},getElementById:node,querySelector:s=>node(s.replace(/^#/,'')),querySelectorAll:s=>{const d=s.match(/\[data-([^\]]+)\]/);return d?dataNodes.filter(n=>d[1] in n.dataset):[]},addEventListener:(t,f)=>listeners[t]=f};
 const sandbox={document,window:null,globalThis:null,performance:{now:()=>0},requestAnimationFrame:()=>1,cancelAnimationFrame(){},setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){},structuredClone,console,Math,Date,Map,Set,localStorage:{getItem:()=>null,setItem(){}},location:{},innerWidth:1200,innerHeight:800,devicePixelRatio:1};sandbox.window=sandbox;sandbox.globalThis=sandbox;sandbox.addEventListener=(t,f)=>listeners[t]=f;
 vm.createContext(sandbox);for(const s of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi))vm.runInContext(s[1],sandbox,{timeout:2000});
 assert(nodes.get('title')?.textContent || html.includes('<title>'),'title rendered');
 const toggle=nodes.get('language')||nodes.get('lang');if(toggle){if(toggle.onclick)toggle.onclick();else if(toggle.onclick===undefined)console.log('NOTE language handler not onclick:',file);}
 console.log('PASS',file,'UI initialization in DOM/canvas stub (not browser visual QA)');
}
