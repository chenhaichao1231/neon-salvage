'use strict';
const assert=require('node:assert/strict'),E=require('./engine.js'),C=require('./campaign.js');
const save={credits:1000,hull:5,power:5,best:4000,runs:20},story=C.new();C.onCoreBanked(story,C.CORE_ID);C.choose(story,'habitat');
const text=E.encodeBundle(save,story,C.validate),bundle=E.decodeBundle(text,C.validate);assert.deepEqual(bundle.data,save);assert.deepEqual(bundle.campaign,story);assert.equal(bundle.data.hull,5);
assert.deepEqual(E.decodeBundle(E.encodeBackup(save),C.validate),{data:save,campaign:null});
for(const patch of [{campaign:null},{campaign:{...story,choice:'unknown'}},{campaign:{...story,coreBanked:false}},{format:3},{data:{...save,hull:6}},{app:'other'}])assert.throws(()=>E.decodeBundle(JSON.stringify({...JSON.parse(text),...patch}),C.validate));
assert.throws(()=>E.encodeBundle(save,story));assert.throws(()=>E.decodeBundle(text));assert.throws(()=>E.decodeBundle('x'.repeat(10001),C.validate));
console.log('Bundle backup passed: full story roundtrip, maxed ship preserved, legacy imports preserve story by explicit null, corruption rejected.');
