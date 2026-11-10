'use strict';
const fs=require('fs'),assert=require('assert'),vm=require('vm');
const files=['index.html','world.html','cargo.html','bodies.html'];
for(const file of files){
 const html=fs.readFileSync(__dirname+'/'+file,'utf8');
 assert(/<!doctype html>/i.test(html),file+' doctype');
 assert(/charset=["']?utf-8/i.test(html),file+' UTF8');
 assert(/name=["']viewport/i.test(html),file+' viewport');
 assert(!/<(?:script|link|img)[^>]+(?:src|href)=["']https?:\/\//i.test(html),file+' must be offline self-contained');
 const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
 for(const [i,s]of scripts.entries())new vm.Script(s[1],{filename:file+':script'+i});
 assert(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(html),file+' no network dependency');
 console.log('PASS',file,'offline packaging and JS syntax');
}
const gallery=fs.readFileSync(__dirname+'/index.html','utf8');
for(const file of files.slice(1))assert(gallery.includes("id:'"+file.replace('.html','')+"'"),file+' gallery entry');
console.log('PASS three independent launch links');
