const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const read=f=>fs.readFileSync(path.join(__dirname,f),'utf8');
const version=read('game.js').match(/VERSION='([^']+)'/)[1];
for(const f of ['README.md','README.en.md']){const t=read(f);assert.ok(t.includes(version),f+' version out of date');assert.ok(/15:01/.test(t),f+' development window absent');assert.ok(/预计更新时间|Estimated update/.test(t),f+' next estimate absent');assert.ok(/下一版计划|Next:/.test(t),f+' next content absent');}
assert.ok(read('CHANGELOG.md').includes('## '+version));
for(const m of read('index.html').matchAll(/(?:src|href)="([^"]+)"/g)){assert.ok(!/^https?:/.test(m[1]),'Runtime dependency must remain offline');assert.ok(fs.existsSync(path.join(__dirname,m[1].split(/[?#]/)[0])),m[1]+' missing');}
console.log('Release checks passed: '+version+', bilingual plans, changelog and offline dependencies.');
