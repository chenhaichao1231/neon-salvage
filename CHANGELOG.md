## 0.15.1 — 2026-11-10

- 中继供能前显示真实覆盖货物/货值、可移动与可诱导数量、竞争者目标状态；只读快照，不保证收益。
- 场上细圈区分实际聚拢与屏蔽覆盖；面板主要取舍优先，长说明可展开，小屏滚动。
- Relay previews show live coverage, value, eligible targets and rival pursuit before spending cargo; snapshots never guarantee profit.
- In-world rings distinguish gathered cargo from jamming coverage. The panel prioritizes decisions, with expandable explanations and scrolling.
- 保留友方不伤货物、既有存档及所有章节。 Friendly cargo safety, existing saves and chapters are retained.

## 0.15.0 — 2026-11-10

- 新增误导广播：三台独立中继，以同一件普通残骸供能。H/触屏可选择聚拢自由货物并引来普通敌人，或屏蔽竞争者的自由货物选择。
- 整件消耗、剩余货值决定供能、单台60秒上限及超额浪费；改频免费但锁定5秒。没有强制清单，不创造货物，不抢走已经持有的货物。
- 成功使用中继并存活撤离，免费解锁中央/西侧/东侧的一台中继布局，下局生效；无伤害升级。失败或直接结束不解锁。
- format 4 备份加入广播进度；format 1–3 导入保留当前广播布局。旧章节、工程、友弹穿货规则保留。
- Added Misleading Broadcast: three independent relays consume original ordinary cargo. H/touch controls gather free salvage while luring ordinary enemies, or jam the rival’s selection of free cargo.
- Remaining cargo value determines charge, capped at 60 seconds per relay with overflow wasted. Retuning is free with a five-second lock. No mandatory checklist, generated cargo or theft of already-held cargo.
- Use a relay and extract alive to unlock free Central/West/East placement for one relay on future runs, without damage upgrades. Death or quitting does not unlock it.
- Format 4 backups include broadcast progress; formats 1–3 retain the current broadcast layout. Existing chapters, projects and friendly-projectile cargo safety remain.
- This adds tactical choices and an investigation clue; it does not claim to solve long-term replayability.

## 0.14.0 — 2026-11-10

- 第七码头续章：首章供电选择完成后从失联站进入，G 联系真实货运艇；选择消耗货值≥12普通残骸启动返航，或拆下原黑匣子亲自拖回原点。
- 返航艇受敌人碰撞和子弹攻击，首章分支分别提供应急救援或修补提速；失败可重试，不清除已有进度。
- 成功路线永久解锁每局一次转运点或高价值货物监听台，结果互斥；没有新增旧等级上限。
- format 3 整包备份纳入码头；format 1/2 导入保留当前码头。延续友弹穿货规则。
- 新增货运艇、转运站、监听阵列 3 套素材，总计 12 套；当前内容仍是有限章节原型。
- Dock Seven opens after Chapter One. Contact a physical freighter with G, then fuel its return using one ordinary wreck worth at least 12 or detach and tow its original black box to the origin.
- Enemies attack the returning ship; the earlier branch supplies emergency recovery or repair and faster engines. Failures are retryable without resetting prior progress.
- Successful routes unlock mutually exclusive one-transfer-per-run or high-value scanning facilities. No old level-cap increase.
- Format 3 full backups include Dock progress; format 1/2 imports retain current Dock progress. Friendly projectiles still pass safely through cargo.
- Three new original assets bring the total to 12. This is a playable continuation, not a finished long-form campaign.

## 0.13.1 — 2026-11-10

- 根据游玩反馈，友方主炮、炮台和反射子弹不再碰撞或损伤货物，可穿货继续命中敌人；敌弹掩体伤害和投掷保持不变。
- 更新中英文指南与机制说明，新增三种友弹和四种货物状态的回归测试；无需清档。
- Friendly main-gun, turret and reflected shots now pass through cargo without damage and can hit enemies beyond it. Hostile cover damage and thrown-cargo behavior are unchanged.
- Updated bilingual guides and regression coverage for three friendly projectile sources and four cargo states. Existing saves remain compatible.

## 0.13.0

- 免费失联空间站首章、定点物理记录核心、一次性供电分支、可见站内变化。
- X主动装备：斥力脉冲；分支解锁急救压机或反射屏障。合金可购买永久回收前哨和有限炮台补给，旧满级进度保留。
- 新增前哨/炮台/记录核心原创素材。整包备份format2含剧情工程，旧format1导入保留剧情。
- Free Silent Station chapter, guaranteed physical core, persistent power-line choice and visible station changes.
- Active rigs, real alloy-funded outposts/supply packs, original facility artwork and compatible story-inclusive backups.
- Prototype limitations remain: only Chapter One is playable; no browser/phone visual QA claim.

## 0.12.0

- 新增独立拾荒争夺：拖载、掩体、投掷、回收站交付，质量和损伤影响取舍。
- 竞争拾荒者争夺原货物；炮台消耗同一货物获得有限弹药。Q停火、E抓投、F供能、R撤离及触屏按钮。
- 两语言指南、碰撞顺序/穿透/致死帧交付测试；旧自由航行保留。新模式仍是原型，无完整战役或新长期解锁。
- Added independent Salvage Skirmish: tow, cover, throw and bank, with mass/damage tradeoffs.
- A rival competes for original cargo; turrets consume that same cargo for finite ammunition. Bilingual guides and keyboard/touch controls.
- Tested collision ordering, piercing, lethal-frame delivery and resource ownership. Original Free Flight remains. Prototype only, without a full campaign or new long-term unlocks.

# 更新记录 / Changelog

## 0.11.0 — 2026-11-10
- 三种玩家舰与主要敌舰改为原创分层舰体图，加入机库预览与星云背景。
- Replaced player and main enemy geometry with original layered spacecraft sprites, hangar previews and a nebula background.
- 素材嵌入代码，离线无需额外网络。素材与绘制路径测试通过，未完成浏览器视觉验证。
- Embedded assets need no extra network access. Asset/render-path checks pass; browser visual verification is incomplete.
- 按最新反馈将下一阶段重点转为物理拾荒交互，替代继续堆叠固定任务链。
- Following current feedback, the next focus is physical salvage interactions rather than another fixed task chain.

## 0.10.0 — 2026-11-10
- 新增可主动接近的紫色宝库：选择增援风险换经验/赏金、安全修复或离开。
- Added optional violet vaults: risk reinforcements for XP/bounty, safely repair, or leave.
- 首名守卫更易击破，让遗物构筑更早进入航行；后续守卫强度保留。
- Reduced first guardian hull to bring relic builds into play earlier; later guardian strength remains.
- 赏金结算与撤离预览一致，完成前死亡/撤离不发奖，重复点击不重复奖励。
- Bounty settlement matches extraction previews; no early death/extraction payout or duplicate-click reward.

## 0.9.0 — 2026-11-10
- 新增守卫半血暴走阶段，15 发弹幕留三格缺口，预警与攻击方向锁定一致。
- Added half-health guardian enrage with 15 shots and a three-slot gap; warning and attack directions remain locked together.
- 新增六种独特遗物及收益/代价选择，可跳过换修复；暂停与结算展示遗物。
- Added six unique relics with benefits/tradeoffs and a repair alternative; relics appear on pause and results.
- 遗物选择只结算一次，死亡优先于守卫修复，伤害描述覆盖无人机。
- Relic choices apply once, lethal damage takes precedence over guardian healing, and damage descriptions include drones.

## 0.8.0 — 2026-11-10
- 新增最近 20 局本地记录及原种子、机型、起始船坞等级重试。
- Added a local last-20 flight log and retries with original seed, ship and starting shipyard levels.
- 记录字段严格筛选，保持旧存档/备份兼容，并保留存储失败提示。
- Validated log fields, preserved existing save/backup compatibility and retained storage-failure warnings.
- 重复结算/点击、容量限制、每日模式及原起始属性回归通过；不承诺录像式复现。
- Duplicate settlement/clicks, bounded history, daily mode and original starting stats pass regression; retries are not recording playback.

## 0.7.0 — 2026-11-10
- 升级数值预览、暂停构筑面板和满射速选项过滤。
- Added stat previews, pause build stats and capped fire-rate filtering.
- 修复多指抢占/误取消移动，新增触控死区与比例速度；跃迁距离保持不变。
- Fixed multi-touch ownership/cancellation and added a deadzone with proportional speed; dash distance is unchanged.
- 根据十分钟压力测试发现的敌人数增长，加入 240 敌人预算和守卫预留处理。
- Added a 240-enemy budget with guardian handling after ten-minute stress tests exposed growing populations.
- 预览无副作用、满级排除、触控与生成预算回归通过；未完成浏览器视觉验证。
- Preview purity, capped-choice exclusion, touch and spawn-budget checks pass; browser visual verification remains incomplete.

## 0.6.0 — 2026-11-10
- 新增主菜单/暂停内航行指南、三种飞船轮廓、无闪烁护盾提示和受击边框。
- Added main/pause flight guides, distinct ship silhouettes, non-flickering shield cues and damage borders.
- 减少动态遵循系统初始偏好，指南内可切换，关闭装饰粒子、镜头震动与菜单漂移；不改变模拟随机数。
- Reduced motion follows the initial system preference with an in-guide toggle, hiding particles, shake and menu drift without changing simulation RNG.
- 帮助返回暂停、动态切换、实际受击及提示衰减回归通过；仍未完成浏览器视觉验证。
- Guide-to-pause return, motion toggle, real damage and feedback decay checks pass; browser visual verification remains incomplete.

## 0.5.0 — 2026-11-10
- 新增深入星域的蜂群/猎手路线选择；猎手普通敌人给予双倍经验与击破分，已生成敌人和守卫不追溯改变。
- Added Swarm/Hunter route choices. New regular Hunter enemies grant double XP and kill score; existing enemies and guardians keep their stats.
- 成功回收后的信标间隔改为 30 秒，首轮撤离前有机会完成三补给委托。
- Successful cache recovery now schedules the next beacon after 30 seconds, allowing three caches before first extraction.
- 新增安全的本地 Windows 启动脚本；静态检查通过，未实机执行。
- Added a local-only Windows launcher; static review passed, Windows execution untested.
- 路线回退、重复点击、敌人属性保留、弹速与奖励回归通过。机器人比较仅提供机制证据，不替代真人体验或视觉验证。
- Route cancellation, duplicate clicks, preserved stats, projectile speed and reward checks pass. Bot comparisons provide mechanical evidence, not human enjoyment or visual validation.

## 0.4.0 — 2026-11-10
- 新增本地 JSON 备份下载、读取/粘贴、预览与明确确认恢复，不上传任何存档。
- Added local JSON backup download, file/paste loading, preview and explicit restore confirmation; no save uploads.
- 无效和过大文件不改变进度；处理下载失败、存储受限和异步文件读取竞态。
- Invalid/oversized files leave progress unchanged; handle failed downloads, blocked storage and async file-read races.
- 扩展序列化、恢复回调、竞态与中英文本回归测试。
- Expanded serialization, restore-handler, race-condition and bilingual text regression tests.

## 0.3.1 — 2026-11-10
- 远程敌人和守卫增加 0.65 秒瞄准锁定预警，提供更明确的躲避时机。
- Ranged enemies and guardians telegraph and lock aim 0.65 seconds before firing, creating a clearer dodge window.
- 增加横屏紧凑 HUD 与减少动态效果样式。
- Added compact landscape HUD and reduced-motion styling.
- 新增中英文本和发布一致性检查，修复随机升级影响撤离回血测试的误报。
- Added translation and release consistency checks; fixed a flaky extraction-healing assertion affected by random upgrades.

## 0.3.0 — 2026-11-10
- 新增三项航行委托，暂停、撤离和结算可查看进度，每项结算额外 +20 合金。
- Added three flight contracts with progress on pause, extraction and results screens; each pays +20 alloy at settlement.
- 新增屏幕外补给方向箭头，帮助小屏幕寻找信标。
- Added an offscreen supply direction arrow for smaller screens.

## 0.2.1 — 2026-11-10
- 修复重复结算奖励；允许页面缩放；菜单空格和方向键恢复浏览器默认行为。
- Prevent duplicate settlement rewards, allow page zoom, and preserve native Space/arrow behavior in menus.
- 存储不可用时仍可通过地址片段切换语言；英文画布无障碍标签同步翻译。
- Language switching now works with blocked storage via a URL fragment; the canvas accessibility label is translated in English mode.
- 修正文档版本号与五项结算统计布局。
- Correct guide version numbers and the five-stat results layout.

## 0.2.0 — 2026-11-10
- 新增补给信标：首个在 15 秒出现，进入光圈累计 2 秒可获得修复、经验和分数；离开会逐渐失去进度，信标会过期。
- Added supply beacons: first appears at 15 seconds. Charge inside the ring for 2 seconds to gain hull repair, XP, and score. Charge decays outside and beacons expire.
- HUD 显示信标距离和剩余时间，结算显示回收数量。
- HUD shows beacon distance and remaining time; results show collected caches.
- 新增 180 秒逻辑冒烟测试。视觉验证仍受开发环境浏览器限制，未宣称完成。
- Added a 180-second simulation smoke test. Visual QA is still limited by the development browser environment and is not claimed complete.

## 0.1.0 — 2026-11-10
- 首个可玩版本：自动射击、移动、跃迁、经验回收与三选一改装。
- First playable version: automatic shooting, movement, dashing, XP pickups, and three-choice upgrades.
- 三种飞船、四种敌人（含守卫）、90 秒撤离与深入选择。
- Three ships, four enemy types including guardians, and extraction or continuation every 90 seconds.
- 本地船坞升级、每日种子、中英切换、双语说明、桌面和触屏支持。
- Local shipyard upgrades, daily seeds, Chinese/English switching and guides, desktop and touch support.
- 暂停及失焦自动暂停，默认静音、可开启合成音效。
- Pause and automatic pause on focus loss. Optional synthesized audio, muted by default.
