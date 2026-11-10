/* Translation unit checks with text-node/observer adapters; not browser layout QA. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const samples=['备份与恢复存档','备份有效 · 合金 120 · 船体等级 2 · 炮管等级 3 · 最高分 500 · 航行次数 7','备份无效，请使用本游戏导出的 JSON 文件。','已在本次页面恢复，但浏览器无法持久保存，请保留备份文件。','航线已暂停','选择一项改装','发现补给信标 · 靠近停留 2 秒回收','航行委托 · 每项 +20 合金','击破 60 架 (12/60) · 回收 3 个补给 (1/3) · 击败 1 名守卫 (0/1)','撤离 · 双倍基础收益','此刻撤离获得 100 合金。继续航行会修复 25% 船体，但下一星域敌人更强。','信标 240m · 22s | 距撤离窗口 60 秒 · 保持移动，自动瞄准'];
const children=samples.map(nodeValue=>({nodeType:3,nodeValue}));let observer,aria;
const doc={documentElement:{},title:'',body:{nodeType:1,tagName:'BODY',childNodes:children},querySelector:()=>({setAttribute(k,v){aria=v;}})};
const context={document:doc,location:{hash:'#lang=en'},localStorage:{getItem(){throw Error('storage blocked');}},MutationObserver:class{constructor(cb){observer=cb;}disconnect(){}observe(){}}};vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/i18n.js','utf8'),context);
assert.equal(doc.documentElement.lang,'en');assert.equal(aria,'Neon Salvage game canvas');for(const n of children)assert.ok(!/[\u3400-\u9fff]/.test(n.nodeValue),n.nodeValue);
const fresh={nodeType:3,nodeValue:'补给回收 · 修复 +18 / 经验 +8'};observer([{type:'childList',addedNodes:[fresh]}]);assert.equal(fresh.nodeValue,'Cache secured · Hull +18 / XP +8');
console.log('Translation checks passed: static and dynamic labels, blocked-storage hash, English accessibility.');
