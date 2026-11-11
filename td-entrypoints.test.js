'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
for(const name of ['td-lanes.html','td-play.html']){
 const html=fs.readFileSync(__dirname+'/'+name,'utf8');
 assert(html.includes('content="0;url=index.html"'));assert(html.includes('href="index.html"'));assert(!html.includes('localStorage'));assert(!/src="td-/.test(html));
 for(const suffix of ['', '?lang=en#lanes']){
  const current=new URL('https://example.test/neon-salvage/'+name+suffix);let target=null;
  const location={href:current.href,search:current.search,hash:current.hash,replace:v=>target=v};
  const context={URL,location};Object.defineProperty(context,'localStorage',{get(){throw Error('Redirect must not access bookmark storage');}});
  vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],context);
  assert.equal(target,'https://example.test/neon-salvage/index.html'+suffix);
 }
}
console.log('PASS legacy entrypoints replace history, preserve query/hash, avoid storage and provide no-JS fallback');
const current=fs.readFileSync(__dirname+'/index.html','utf8');
assert(/<section class="selection">[\s\S]*<details id="battle-review"[\s\S]*<\/details><\/section>/.test(current),'optional review stays within existing grid row, not a sixth child');
console.log('PASS battle review occupies existing selection row rather than the arena grid track');
