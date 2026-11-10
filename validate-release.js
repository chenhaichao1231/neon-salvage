const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const read=f=>fs.readFileSync(path.join(__dirname,f),'utf8');
const version='0.3.0';
for(const f of ['README.md','README.en.md']){const t=read(f);assert.ok(t.includes('v'+version),f+' current version absent');assert.ok(/24小时/.test(t)&&/2026-11-11/.test(t),f+' current development window absent');assert.ok(/预计.*北京时间|Estimated local review/.test(t),f+' next estimate absent');assert.ok(/下一版.*Next iteration/.test(t),f+' next plan absent');}
assert.ok(read('index.html').includes('v'+version));
for(const file of ['index.html','space.html']){const html=read(file).replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,m=>m.replace(/>[\s\S]*<\/script>/,'></script>'));for(const m of html.matchAll(/(?:src|href)="([^"]+)"/g)){assert.ok(!/^https?:/.test(m[1]),'Runtime dependency must remain offline');assert.ok(fs.existsSync(path.join(__dirname,m[1].split(/[?#]/)[0])),m[1]+' missing');}}
for(const game of ['world','cargo','bodies'])assert.ok(read(game+'.html').includes('local-progress'),game+' local progress absent');
console.log('Release checks passed: Three Worlds '+version+', bilingual plans, archived game and offline dependencies.');
