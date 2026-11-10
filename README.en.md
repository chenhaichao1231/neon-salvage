# Campus Defense · 校园防线

**[Play the online demo](https://chenhaichao1231.github.io/neon-salvage/)**

## Formation Demo 0.6

Defend five lanes from runaway data, collect GPU compute, and deploy AI characters. This first demo tests the interaction loop and two units, not final art or balance.

**Since 0.2, block placeholders have been replaced by campus, character, supply-person and monster assets generated from the approved concept. Battle, rice-break and brain-fog poses change with live state; core rules are unchanged. This is still a 2D sprite prototype, not final animation. Community originals are not bundled. Generation does not verify underlying character rights or grant commercial reuse.**

Select DS or GPT, then an empty cell. Start the wave when ready. During preparation, the right edge lists each lane’s whole-stage planned counts. During battle it shows the next arrival and countdown; expand the full schedule for exact details. DS is cheap but occasionally takes a warned two-second rice break. GPT now pierces at most two targets with every shot, with lower single-target damage, with occasional warned three-second windows of 70% damage. These are fictional rules, not factual evaluations of real AI products.

GPU drops can be clicked or automatically collected after four seconds; they never expire. Every stage has a finite supply, so waiting cannot farm unlimited money. Preparation refunds are complete. Reinforce during combat, pause, switch to 2× speed, retry the same schedule, or change language without resetting play. Wins also offer a same-stage retry using the original seed and pre-wave layout, without carrying earned GPU.

Three short stages are available. Cheap-unit strategies may currently be too strong; the next pass focuses on meaningful placement and combinations rather than stage count. Progress is not saved yet, so refreshing starts over. No accounts, payments, or personal-identity collection.

Old games are removed from the local current project; online source cleanup is still in progress. Git history remains. The separate old player ZIP has been removed.

## Reasons to return

- Stage two sends six late fragments into each of lanes 1 and 3, and one into each other lane. Total enemy count and stats are unchanged. Cheap coverage can still win; focused piercing clears groups faster. Live overlapping enemies show ×N, while preparation labels explicitly show whole-stage planned totals.
- GPT no longer waits for a fourth shot: every shot can hit two enemies. It still costs 90, with 14 damage and 1.4s cadence. DS remains 50, 10 damage and 1.1s. Cheap coverage and group damage have different trade-offs; no prescribed loadout is required.
- Each preparation phase has one concrete objective. Results show core, guard losses, spending and actual clear time, with same-schedule retry to compare cheaper and faster layouts. Unspent GPU does not carry into the next stage; savings are this battle’s investment and emergency margin, not permanent progression.

## Retained animation work

DeepSeek now has a foot-aligned wind-up, push, release and distinct recovery instead of reversing the wind-up pose. Idle/blink and bowl/chopstick/chewing cycles remain. Real combat events drive hit, data-shatter and guard-damage feedback; pause freezes it and retry clears it. Damage and resource rules are unchanged. GPU pickups arc from the four supply positions with matching clickable bounds. Version 0.6 gives the existing GPT white-dragon character distinct charge, push, release and recovery poses, selected from its actual 1.4s firing cooldown. Weak output dims the same model with a clear status label, without changing damage. The immediate first shot has no preceding wind-up; some release poses are similar and this is not final smooth animation. Enemies still lack frame-based movement.

## Next version and estimate

Next: verify the focused waves, planned counts and GPT poses online, then improve enemy movement and hit readability. Longer-term goals should build on meaningful choices, not just more stages. Further AI characters await the user's instruction.

Estimated next check/update: **November 11, 2026, 02:00–03:00 Beijing time**, not a guaranteed launch time. Concrete blockers will be reflected here. The agreed development window ends November 11 at 22:57 Beijing.

## Verification

22 engine, 18 UI/engine integration and 7 event scenarios pass, plus finite-coordinate, failed-resource and pose-selection checks. Simulation establishes rules and reachable wins, not human enjoyment. Version 0.3 was played through stage one in a real browser with DS and 5/5 core, checking rice state, supply, language and frozen pause. Version 0.4 cleared stage one online and passed stage-two entry, pause and retry checks. Version 0.5 cleared stage one with 5/5 core in a real browser. Stage two with delayed reinforcement won at 3/5 core and one guard lost, with visible group counts and GPT beams. Victory retry restored the original two guards, 40 GPU and 5 core without carrying battle income. Physical-phone performance remains unverified.

Local rule checks (with Node.js installed): run `node td-lanes.test.js`, `node td-lanes-ui.test.js`, `node td-lanes-events.test.js`, `node td-lanes-renderer.test.js`, and `node td-lanes-renderer-fallback.test.js`. These do not replace real browser playtesting.

Version 0.6 adds independent simulations across 30 seeds, multiple depths and two GPU collection styles. Focused rear-line piercing clears faster than five DS units but costs more; forward placement is not necessarily safe. Simulations do not prove fun. Online animation and layout acceptance follows deployment.
