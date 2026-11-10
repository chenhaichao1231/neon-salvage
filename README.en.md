# Campus Defense · 校园防线

**[Play the online demo](https://chenhaichao1231.github.io/neon-salvage/)**

## Animation & Return Demo 0.8.1

Defend five lanes from runaway data, collect GPU compute, and deploy AI characters. This first demo tests the interaction loop and two units, not final art or balance.

**Since 0.2, block placeholders have been replaced by campus, character, supply-person and monster assets generated from the approved concept. Battle, rice-break and brain-fog poses change with live state; core rules are unchanged. This is still a 2D sprite prototype, not final animation. Community originals are not bundled. Generation does not verify underlying character rights or grant commercial reuse.**

Select DS or GPT, then an empty cell. Start the wave when ready. During preparation, the right edge lists each lane’s whole-stage planned counts. During battle it shows the next arrival and countdown; expand the full schedule for exact details. DS is cheap but occasionally takes a warned two-second rice break. GPT now pierces at most two targets with every shot, with lower single-target damage, with occasional warned three-second windows of 70% damage. These are fictional rules, not factual evaluations of real AI products.

GPU drops can be clicked or automatically collected after four seconds; they never expire. Every stage has a finite supply, so waiting cannot farm unlimited money. Preparation refunds are complete. Reinforce during combat, pause, switch to 2× speed, retry the same schedule, or change language without resetting play. Wins also offer a same-stage retry using the original seed and pre-wave layout, without carrying earned GPU.

Three introductory stages and an optional two-enemy placement challenge are available. The first three schedules are unchanged. This browser now remembers only reached stages and language. Refresh returns to an empty preparation phase with 180 GPU, without auto-start or battle income. Versions 0.6 and earlier had no bookmark, so previously closed progress cannot be recovered. No accounts, payments, or personal-identity collection.

Old games are removed from the local current project; online source cleanup is still in progress. Git history remains. The separate old player ZIP has been removed.

## Reasons to return

- Version 0.7 gives fragment bats real wing, contact-lunge and hit poses rather than whole-image bobbing. Hit details remain subtle at the small display size.
- After reaching stage two or three, refresh no longer forces stage one. The selector revisits reached stages and is disabled during combat or nonempty preparation to avoid erasing a layout. A win registers the next stage only after clicking Next stage. No GPU, rewards or score carry between stages.

- Stage two sends six late fragments into each of lanes 1 and 3, and one into each other lane. Total enemy count and stats are unchanged. Cheap coverage can still win; focused piercing clears groups faster. Live overlapping enemies show ×N, while preparation labels explicitly show whole-stage planned totals.
- GPT no longer waits for a fourth shot: every shot can hit two enemies. It still costs 90, with 14 damage and 1.4s cadence. DS remains 50, 10 damage and 1.1s. Cheap coverage and group damage have different trade-offs; no prescribed loadout is required.
- Each preparation phase has one concrete objective. Results show core, guard losses, spending and actual clear time, with same-schedule retry to compare cheaper and faster layouts. Unspent GPU does not carry into the next stage; savings are this battle’s investment and emergency margin, not permanent progression.

## Retained animation work

DeepSeek now has a foot-aligned wind-up, push, release and distinct recovery instead of reversing the wind-up pose. Idle/blink and bowl/chopstick/chewing cycles remain. Real combat events drive hit, data-shatter and guard-damage feedback; pause freezes it and retry clears it. Damage and resource rules are unchanged. GPU pickups arc from the four supply positions with matching clickable bounds. Version 0.6 gives the existing GPT white-dragon character distinct charge, push, release and recovery poses, selected from its actual 1.4s firing cooldown. Weak output dims the same model with a clear status label, without changing damage. The immediate first shot has no preceding wind-up; some release poses are similar and this is not final smooth animation. Fragment bats now have frame-based movement; armor and other enemies do not yet.

## Next version and estimate

Next: test whether the detour challenge arrows, two-cell range and countdown explain its choices clearly, compare cheaper direct defense with bait into piercing, and refine existing enemy movement. Further AI characters await the user's instruction.

Estimated next check/update: **November 11, 2026, 02:30–03:30 Beijing time**, not a guaranteed launch time. Concrete blockers will be reflected here. The agreed development window ends November 11 at 22:57 Beijing.

## Verification

22 engine, 22 UI/engine integration and 7 event scenarios pass, plus finite-coordinate, failed-resource and pose-selection checks. Simulation establishes rules and reachable wins, not human enjoyment. Version 0.3 was played through stage one in a real browser with DS and 5/5 core, checking rice state, supply, language and frozen pause. Version 0.4 cleared stage one online and passed stage-two entry, pause and retry checks. Version 0.5 cleared stage one with 5/5 core in a real browser. Stage two with delayed reinforcement won at 3/5 core and one guard lost, with visible group counts and GPT beams. Victory retry restored the original two guards, 40 GPU and 5 core without carrying battle income. Physical-phone performance remains unverified.

Local rule checks (with Node.js installed): run `node td-lanes.test.js`, `node td-lanes-ui.test.js`, `node td-lanes-events.test.js`, `node td-lanes-renderer.test.js`, and `node td-lanes-renderer-fallback.test.js`. These do not replace real browser playtesting.

Version 0.6 adds independent simulations across 30 seeds, multiple depths and two GPU collection styles. Focused rear-line piercing clears faster than five DS units but costs more; forward placement is not necessarily safe. Simulations do not prove fun. Version 0.6 is now checked online: stage one at 5/5 core; two focused GPT lanes plus DS elsewhere won stage two at 4/5, one guard lost, 330 GPU and 78.1 battle seconds after delayed reinforcement. Both languages’ planned counts fit their lanes, and victory retry restored the original budget and placement. This live route is not a controlled balance comparison.

The 0.7 bookmark is browser-local and does not sync between devices. Blocked or invalid storage shows a notice while play remains available. Clearing site data removes the bookmark. It stores stage access, not an entire battle or best formation. Online bookmark and animation acceptance completed for 0.7, as described below.


## Optional detour challenge (0.8 candidate)

The first three stages keep their existing schedules. After stage 3, choose the optional two-enemy challenge. This is not a new AI guard or a full-length level. Within two cells of a guard ahead in its original lane, the marked charger pauses for 2 seconds while vulnerable, then changes once to the marked lane 3. No original-lane guard means it continues straight. An occupied landing uses normal contact combat. Preparation shows the actual two-cell trigger range; combat shows destination and countdown. Cheap two-DS coverage and DS bait into GPT piercing are both viable in local probes, not proven human fun.

0.7 was verified live: stage 2 refresh restores empty 180 GPU setup and English, placement disables stage selection, refund re-enables it, and pause freezes animation. Both stage 1 and the completed stage 2 attempt finished with 5/5 core and no guard loss. Another delayed-input attempt lost; these are not controlled balance comparisons.

0.8 adds seven detour boundary tests and 29 UI tests. The live 0.8 bait formation won with 5/5 core, zero losses, 140 GPU spent and 8.3 battle seconds, repeated on retry; the brief waiting frame was not captured. 0.8.1 shortens forecasts/main text, hides empty plans and separates arrows from forecasts; its visual acceptance follows deployment. Next: test whether range/arrow/countdown explain the choice clearly, compare cheaper direct defense against bait/piercing, and improve existing enemy motion. No additional AI guards until requested. Estimated next check/update: Beijing 2026-11-11 02:30–03:30, not a guaranteed release time.

The optional challenge requires stopping both enemies. Any leak fails it, even if the core retains health.
