# Campus Defense · 校园防线

**[Play online](https://chenhaichao1231.github.io/neon-salvage/)** · [中文](README.md)

## Demo 0.10.1

Defend five campus lanes, collect GPU compute and deploy DeepSeek or GPT against incoming data monsters. Three introductory stages, a two-enemy detour exercise and a nine-enemy converging convoy are included.

- **DeepSeek:** 50 GPU, inexpensive single-target fire. Warned two-second rice breaks occasionally pause shooting.
- **GPT:** 90 GPU, each shot can pierce two targets. Warned three-second weak-output windows deal 70% damage.
- These are fictional game rules, not assessments of real AI products. Only DS/GPT are playable.

### What changed

- **Emergency withdrawal:** Once per battle, select a live guard while unpaused and recover half its price, 25/45 GPU. Preparation still permits unlimited full refunds. Fired shots and committed detours continue. Removing a routing guard too early can leave later chargers travelling straight.
- **Low-health feedback:** Bars turn amber at half health; a static high-contrast exclamation mark appears at quarter health. Selected summaries and accessible cell labels identify Low HP. This describes current health, not guaranteed reaction time or an automatic withdrawal recommendation.
- **Readable formations:** New placements select the guard and show its actual forward lane. Guards cannot shoot enemies behind themselves.
- **Battle comparisons:** Results distinguish defeated and voluntarily withdrawn guards; refunds do not reduce gross deployment spending. The previous completed attempt can be compared within the same session, stage and seeded schedule. Clear times are compared only between wins.
- **Existing motion and loading:** DeepSeek idle, status and recovery follow the battle clock. Actual final casts finish before resting. Fragments, armor and GPT retain event-driven motion. Stage 1 defers about 4.03 MiB of unused enemy-action art; this is not a measured speed claim.

### Controls and tactics

Choose a guard, then an empty cell, and start when ready. Reinforce, withdraw once, pause or switch 1×/2× during battle. Retry restores pre-wave placement, GPU, status schedule and unused withdrawal allowance without carrying battle income.

A 30-GPU drop arrives every six battle seconds. Click to collect early or receive it automatically after four seconds; it never expires. Each stage has a fixed 300-GPU supply, settled on victory. Withdrawal refunds are separate. Full-price same-cell replacement creates a new guard under the existing rules, costing 25/45 GPU net and the only withdrawal allowance rather than providing free healing.

In the convoy, three lane 2 chargers can be routed into lane 3 alongside six fragments. Within two cells ahead of a guard, they wait two seconds while vulnerable, then turn once. Placement, withdrawal timing and receiving-lane firepower matter. Any leak fails the optional challenge. Savings and clear time are battle comparisons, not permanent stat progression.

Only reached stages and language are stored in this browser. Refresh starts empty preparation with 180 GPU, not a resumed battle or saved best formation. Stage switching is disabled during battle and nonempty preparation. No account or payment is required.

### Verification and limitations

All 20 local suites passed during release preparation: 18 current-game suites and two historical-engine/UI suites. Bounded real-engine comparisons demonstrate different outcomes from withdrawal timing, target and reinforcement placement, not human enjoyment or comprehensive balance.

Local Canvas frames at 1120×650 and 740×400 were inspected with loaded artwork and both fallback paths. These are not browser-layout, screen-reader, physical-phone, touch or performance acceptance. **Those device checks were not completed during this release preparation.**

This is a 2D sprite prototype with limited animation, body details and movement. Full image assets exceed 20 MiB, so first load may be slow. Generated artwork does not establish character rights or commercial permission. Old source and historical tests remain and are not current-game acceptance.

With Node.js, run the relevant tests individually, for example `node td-lanes.test.js`, `node td-lanes-ui.test.js`, `node td-emergency-withdraw.test.js` and `node td-lanes-low-health.test.js`. Some drawing checks use `@napi-rs/canvas`. Do not treat unrelated historical-prototype tests as current-game verification.
