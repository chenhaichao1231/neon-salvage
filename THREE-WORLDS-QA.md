# Prototype QA / 小样检查

## Release gates / 交付门槛

- All three games are independently launchable from the gallery, with no external dependency.
- Each first screen identifies a concrete win condition and how to perform the first action.
- Each game has three reachable, mechanically distinguishable challenges.
- A failed/invalid action does not irreversibly block progress; reset is always available.
- Restart clears transient animation/timer/input state; next level cannot inherit unintended state.
- Both languages retain all objective, control, failure and result information.
- No edits to earlier games or their storage keys.
- No remote upload or publication without this task's authorization.

## Actual-browser checklist / 实际浏览器检查

Pending. Local HTTP server is running, but the cloud browser returned ERR_CONNECTION_REFUSED at the loopback address. Do not report this stage passed based only on VM/engine tests.

Once a permitted browser preview is available, verify:
1. Fresh entry, one complete three-level run, wrong action and immediate retry for each game.
2. Switching language during a level does not reset progress or lose control context.
3. Rapid repeated inputs, reset while moving, next level during transition, reload.
4. Desktop readable layout, narrow viewport readable controls, no hidden essential action.
5. Actual rendered artwork and selection/goal/failure feedback.

自动测试证明可达性与状态规则，不证明玩家会觉得好玩。试玩后应按玩家反馈选择方向，而非同时扩张三款。
Automated tests support reachability and state correctness, not human enjoyment. Use playtest feedback to choose a direction rather than expanding all three at once.

## Local results / 本地结果 — 2026-11-10 21:39 Beijing

- World: BFS reaches all three exits after collecting energy; phase/friction levels cannot be solved without their rule. Undo, blocked movement, deterministic replay, victory boundary and 1,500 legal-state transitions passed.
- Bodies: nine groups passed, including all three solution replays, closed gate/vent/terminal/crate restrictions, plate release and reset snapshots.
- Cargo: twelve groups passed: all three deliveries, darkness failure, observation/gate timing, magnet reach/wall collision, retry, invalid input, bounds, bilingual packaging and UI-handler language/drag/blur flows.
- Gallery and all HTML: standalone dependency scan and embedded JS syntax passed. All three UI scripts initialized in a DOM/canvas stub. These are not actual browser rendering tests.
- Earlier repository remains unchanged. No uploads or deployments performed.

## Five-level iteration / 五关迭代 — 2026-11-10 21:52 Beijing

All three now have five freely selectable levels. World: five BFS solutions, mechanism-necessity counterexamples and 2,500 transitions passed. Bodies: 17 groups passed, including battery ownership, occupied-bridge refusal, sequential battery transport, reset/undo and UI progress hook. Cargo: 19 groups passed, including mirrored movement/collision, balloon timing/impact, actual input handlers and one-time progress callbacks. Separate local-progress tests cover corruption, blocked storage, best result retention, reload and isolation from old saves. All four pages initialize in DOM/canvas stubs; standalone syntax/packaging checks pass. Canvas-only render samples inspected for Cargo are not full browser layout verification.

Actual browser playtesting remains pending because the browser cannot reach the local server. No remote publishing occurred.

## Live acceptance / 在线验收 — 2026-11-10 22:12 Beijing

Earlier pending/offline statements above are historical checkpoints, superseded for the specific checks below. v0.3.0 commit a357ae7a88153bbf879d22cb6dd1508e1e85734f deployed successfully via Pages run 42830447385.

- Actual Chrome: World level 6 completed in 13 UI actions, using friction, phase and ordered-node mechanics. Result and gallery completion count verified.
- Bodies level 6: actual map clicks selected heavy body and moved to adjacent tile after SVG viewport fitting. First-level win and next-level flow were checked in v0.2.
- Cargo level 6: English instructions and ARIA labels, start, held Space inflation, visible flight and retry verified. Earlier plant drag and failure/retry verified in v0.2.
- All three game pages measured viewport height 799, document height 799, scrollY 0 at width 1212. Screenshots inspected. Long Body/World help remains within the sidebar. Mobile browser and all 18 browser wins were not tested.
- Homepage visibly v0.3.0, six levels each, with preserved old-game links and actual locally saved World/Bodies completion counts.
- All 19 production *.test.js files and release validator passed before publication. Automated replay proves reachability, not human enjoyment.

以上为实际在线检查范围，不代表所有设备、所有关卡人工式通关，也不证明玩家主观乐趣。


## v0.5 release checks / 发布检查
World seven levels and two variants, Cargo seven levels and lamp variant, Bodies eight levels and two level8 routes pass automated solutions and counterexamples. Top-edge puffer detour intentionally retained and tested; initial bookmark prompt corrected. Separate variant progress and all-page embedded-module parity pass. New live checks remain pending deployment; no all-device or human-fun guarantee.

## v0.5 live acceptance / 在线验收 — 2026-11-10 22:31 Beijing

Remote 4b22eed63cbe8f9f0b943a83c5024bb24e46dbe2, Pages run42834125145 Success. README first screen visually inspected: online-play link directly beneath title and pointing to the public gallery. Gallery visibly v0.5 with preserved completion records and old-game links.

Actual browser actions cleared World level7 in five steps and Bodies level8 via crate-held door with drone untouched. Cargo level7 drag, size toggle, pause, resume, English switch and retry inspected; document height799 matched viewport799 without whole-page scrolling. New scene screenshots inspected. This does not claim all22 levels or both Bodies8 paths were browser-cleared, nor mobile compatibility or subjective enjoyment. Local release passed21 *.test.js files plus validator.
