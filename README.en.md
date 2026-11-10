# Campus Defense · 校园防线

**[Play the online demo](https://chenhaichao1231.github.io/neon-salvage/)**

## Formation Demo 0.5

Defend five lanes from runaway data, collect GPU compute, and deploy AI characters. This first demo tests the interaction loop and two units, not final art or balance.

**Since 0.2, block placeholders have been replaced by campus, character, supply-person and monster assets generated from the approved concept. Battle, rice-break and brain-fog poses change with live state; core rules are unchanged. This is still a 2D sprite prototype, not final animation. Community originals are not bundled. Generation does not verify underlying character rights or grant commercial reuse.**

Select DS or GPT, then an empty cell. Start the wave when ready. The right edge previews the next arrival in each lane; expand the full schedule for details. DS is cheap but occasionally takes a warned two-second rice break. GPT now pierces at most two targets with every shot, with lower single-target damage, with occasional warned three-second windows of 70% damage. These are fictional rules, not factual evaluations of real AI products.

GPU drops can be clicked or automatically collected after four seconds; they never expire. Every stage has a finite supply, so waiting cannot farm unlimited money. Preparation refunds are complete. Reinforce during combat, pause, switch to 2× speed, retry the same schedule, or change language without resetting play. Wins also offer a same-stage retry using the original seed and pre-wave layout, without carrying earned GPU.

Three short stages are available. Cheap-unit strategies may currently be too strong; the next pass focuses on meaningful placement and combinations rather than stage count. Progress is not saved yet, so refreshing starts over. No accounts, payments, or personal-identity collection.

Old games are removed from the local current project; online source cleanup is still in progress. Git history remains. The separate old player ZIP has been removed.

## Reasons to return

- Stage two now has late tight three-enemy groups, giving reinforcement compute a job. Overlapping enemies display their real ×N count.
- GPT no longer waits for a fourth shot: every shot can hit two enemies. It still costs 90, with 14 damage and 1.4s cadence. DS remains 50, 10 damage and 1.1s. Cheap coverage and group damage have different trade-offs; no prescribed loadout is required.
- Each preparation phase has one concrete objective. Results show core, guard losses and spending, with same-schedule retry to compare a cheaper layout.

## Retained animation work

DeepSeek now has a foot-aligned wind-up, push, release and distinct recovery instead of reversing the wind-up pose. Idle/blink and bowl/chopstick/chewing cycles remain. Real combat events drive hit, data-shatter and guard-damage feedback; pause freezes it and retry clears it. Damage and resource rules are unchanged. GPU pickups arc from the four supply positions with matching clickable bounds. GPT and enemies still use their existing static poses and are not claimed as animated.

## Next version and estimate

Next: play stage two with different layouts and check whether actual two-target hits are readable. Adjust pacing from evidence rather than treating more stages as more fun. Continue refining the existing characters’ feedback. Further AI characters await the user's instruction.

Estimated next check/update: **November 11, 2026, 01:40–02:30 Beijing time**, not a guaranteed launch time. Concrete blockers will be reflected here. The agreed development window ends November 11 at 22:57 Beijing.

## Verification

22 engine, 17 UI/engine integration and 7 event scenarios pass, plus finite-coordinate, failed-resource and pose-selection checks. Simulation establishes rules and reachable wins, not human enjoyment. Version 0.3 was played through stage one in a real browser with DS and 5/5 core, checking rice state, supply, language and frozen pause. Version 0.4 cleared stage one online and passed stage-two entry, pause and retry checks. Version 0.5 passes local checks; its new rules will be played online after deployment, not claimed in advance.

Local rule checks (with Node.js installed): run `node td-lanes.test.js`, `node td-lanes-ui.test.js`, `node td-lanes-events.test.js`, `node td-lanes-renderer.test.js`, and `node td-lanes-renderer-fallback.test.js`. These do not replace real browser playtesting.
