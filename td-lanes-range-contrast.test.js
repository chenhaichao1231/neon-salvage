'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),E=require('./td-lanes'),R=require('./td-lanes-renderer');
function context(){const calls=[],stack=[];let path=[],dash=[];const ctx={lineWidth:9,strokeStyle:'old',fillStyle:'old',save(){stack.push([this.lineWidth,this.strokeStyle,this.fillStyle,dash]);},restore(){[this.lineWidth,this.strokeStyle,this.fillStyle,dash]=stack.pop();},fillRect(...v){calls.push({fill:this.fillStyle,rect:v});},setLineDash(v){dash=v.slice();},beginPath(){path=[];},moveTo(...v){path.push(['M',...v]);},lineTo(...v){path.push(['L',...v]);},stroke(){calls.push({stroke:this.strokeStyle,width:this.lineWidth,dash:dash.slice(),path:path.slice()});}};return {ctx,calls};}
for(const row of [0,1,2,3,4])for(const col of [0,3,6]){
 const s=E.create();E.deploy(s,row,col,'deepseek');const id=s.units[0].id,before=JSON.stringify(s),{ctx,calls}=context();
 R.drawForwardLane(ctx,s,id);assert.equal(JSON.stringify(s),before);
 const x=140+(col+.4)*120,y=170+row*82;
 assert.deepEqual(calls[0],{fill:'#b9edff21',rect:[x,y+5,1076-x,72]});
 assert.equal(calls.length,5);for(const i of [1,3]){assert.equal(calls[i].stroke,'#243655b8');assert.equal(calls[i].width,4);assert.equal(calls[i+1].stroke,'#c9efffb8');assert.equal(calls[i+1].width,2);assert.deepEqual(calls[i].path,calls[i+1].path);}
 assert.deepEqual(calls[1].path,[['M',x,y+67],['L',1064,y+67]]);assert.deepEqual(calls[1].dash,[7,7]);assert.deepEqual(calls[2].dash,[7,7]);
 assert.deepEqual(calls[3].path,[['M',1051,y+60],['L',1064,y+67],['L',1051,y+74]]);assert.deepEqual(calls[3].dash,[]);assert.deepEqual(calls[4].dash,[]);
 assert.equal(ctx.lineWidth,9);assert.equal(ctx.strokeStyle,'old');assert.equal(ctx.fillStyle,'old');
 for(const selected of [null,undefined,'missing']){const c=context();R.drawForwardLane(c.ctx,s,selected);assert.equal(c.calls.length,0);}
 s.units[0].hp=0;const c=context();R.drawForwardLane(c.ctx,s,id);assert.equal(c.calls.length,0);
}
const source=fs.readFileSync(require.resolve('./td-lanes-renderer'),'utf8'),draw=source.slice(source.indexOf('function draw(ctx,'));
assert(draw.indexOf('drawForwardLane(ctx,s,selectedUnit)')<draw.indexOf('for(const u of s.units)'),'lane remains behind sprites');
assert(draw.indexOf('drawForwardLane(ctx,s,selectedUnit)')<draw.indexOf('drawDetours(ctx,s,preview,o.lang)'),'route countdown remains above lane');
console.log('Selected lane contrast: unchanged geometry/fill/dashes, matched keyline, selected-only/live-only, read-only state, saved context, and layer ordering passed');
