# 更新记录 / Changelog

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
