# Campus Defense · 校园防线

**Demo 0.15 · Source release** · [Play online](https://chenhaichao1231.github.io/neon-salvage/) · [中文](README.md)

A five-lane campus defense game. Collect GPU resources, deploy four AI guards, and stop data enemies entering from the right. This documentation describes the Demo 0.15 release source; the online deployment status requires separate verification.

## Play

1. Choose a guard, then an empty cell. Guards fire only to the right; inspect each lane's forecast first.
2. Hover or keyboard-focus an affordable empty cell to preview its rightward attack geometry. The preview predicts no hits and spends nothing; activating deployment still charges the price.
3. Press Start wave when ready. A 30-GPU drop arrives every six battle seconds. Click to collect immediately, or receive it automatically four battle seconds later.
4. While paused, deploy, collect existing drops or use emergency withdrawal. Deployment spends GPU immediately; future supplies and simulation time stay frozen until Resume.
5. Retry restores the exact pre-wave formation, GPU and seeded status schedule, so you can revise your plan.

## Four basic guards

All four are available from the first stage, with no additional guard models. Their personalities are fictional game rules, not assessments of real AI products.

- **DeepSeek · 50 GPU:** cheap single-target fire, 10 damage every 1.1s. Warned two-second rice breaks occasionally interrupt firing.
- **GPT · 90 GPU:** 14 damage every 1.4s, piercing up to two distinct targets per shot. Warned three-second weak windows reduce damage to 70%.
- **Claude · 120 GPU:** one 30-damage armor-ignoring hit every 2s. A two-second warning precedes an automatic three-second offline review. No player questions, nationality checks or personal information are involved.
- **Grok · 80 GPU:** 16 damage every 1.8s, hitting at most three nearby enemies within 0.8 cells in the same lane. Every fourth committed shot deals 4 damage instead; misses still count. The next-shot counter is separate from an already-fired projectile's quality.

Cheap coverage, piercing, armor bypass and tight-cluster damage have different strengths. Buying all four is not required, and expensive guards do not guarantee success.

## Seven main stages and two drills

- The first four mains contain **30, 50, 54 and 43 enemies**, arranged in **3, 4, 4 and 4 pushes**. Final arrivals occur at **55, 57.25, 68 and 61 battle seconds**. Main 4, Shifting pressure, moves reinforcement pressure through lanes 3, 5 and 1.
- **Main 5 · Overlapping fronts:** 53 enemies in four pushes starting at **4, 14, 32 and 52 seconds**, with the final arrival at **58s**. Lane 2 armor overlaps lane 4 crowds, then both outer lanes face pressure; the middle lane finishes early. Familiar formations can still recover with later reinforcement; no particular opening is mandatory.
- **Main 6 · Interleaved pursuit:** 53 enemies in four pushes starting at **4, 16, 36 and 48 seconds**, with the final arrival at **58s**. Armor mixes with faster pursuers in lanes 1, 3 and 5, naturally changing target order. Lanes 2 and 4 still receive later blobs. Surviving enemies must be cleared after the last arrival.
- **Main 7 · Rotating siege:** 54 enemies in three pushes starting at **4, 20 and 36 seconds**, with the final arrival at **48s**. Armor and dense fragments rotate roles across lanes 2, 3 and 4; lanes 1 and 5 stay empty. Reserve supply for the next role change. Cheap reinforcement and selective specialties are both viable; no four-guard formation is required.
- All mains use ordinary five-core survival, without a zero-leak requirement. The new stages introduce no shield or shared-HP mechanic.
- Two optional mechanic drills contain **two enemies for One detour** and **nine for Converging convoy**. Any leak fails a drill. Once a turn has begun charging, withdrawing its guard does not cancel it. Drill completion is not required for the main path.

## Resources and controls

During preparation or battle, with a deployment cell focused, unmodified Arrow keys move to the adjacent cell without wrapping or spending GPU, including while paused. Tab / Shift+Tab keep their usual order; Enter / Space activates the focused cell. Occupied or unaffordable cells remain reachable.

Each stage starts with 180 GPU and grants 300 fixed supply GPU. Kills give no extra income; early victory credits remaining supply. Preparation refunds are full. There is **one emergency withdrawal per battle**, returning 25 / 45 / 60 / 40 GPU for DS / GPT / Claude / Grok.

Withdrawal leaves existing projectiles intact, and redeployment costs full price. Voluntary withdrawals are separate from defeated guards; refunds are not supply income and do not reduce gross spending. 1× / 2× changes simulation speed only. Hiding the page pauses it; returning requires explicit Resume.

## Presentation and progress

While a main is still in battle after its final scheduled arrival, the wave HUD shows how many enemies remain on the board. Kills and leaks both reduce this count; paused copy marks the freeze.

In the schedule, exact regular runs of at least three arrivals show inclusive first–last times, count and interval (or “simultaneous”). Different events interrupt a run; irregular runs stay individual.

Ordinary Grok **next 1/4–3/4** overhead captions appear only when selected. The **next 4/4** warning remains visible without selection. Selected details and accessible cell labels retain the full information. Other guards' real states and warnings, low-health cues and actual projectiles are unchanged, as are animation and artwork.

Upcoming forecasts are separate from enemies already present. Nearby packs show type-shaped counts when space permits, falling back to a total or no extra count in tight layouts. Counts do not mean shared HP or targets per shot. Ingress and dense states can still overlap. Individual fragment HP bars may overlap into a band, and a displayed pack count is not the whole lane total. Failed artwork uses labeled fallback visuals.

Battle facts identify the current attempt's **first escaped enemy type, lane and time**, and count Grok shots that actually hit at least two distinct targets. These are observations, not damage rankings. First-leak type and per-shot details are not included in compact saved history.

The selector lists seven mains before the two drills. An actual win on the preceding main in the current build unlocks its new successor. Using the existing stage IDs, the main path is **0→1→2→5→6→7→8→0**, and drills remain **3→4→5**. IDs and bookmark format are unchanged. Legacy drill bookmarks grant access only as far as Main 4. Old Main 4/5/6 visits or historical results do not prove the win needed to unlock newly added mains retroactively.

Language and available-stage progress stay in the current browser when storage works. Refresh starts the remembered stage with an empty formation and 180 GPU; Retry restores the exact pre-wave setup. Each stage also keeps one compact last finished result, whether won or lost. It is not a personal best or reward and does not restore a battle.

Preparation can show a valid old result with a warning and no deltas when conditions differ. Content-source revisions also conservatively make old valid results historical-only; loading does not delete or rewrite them. Battle hides history. Terminal comparisons use only a compatible reference shown before this attempt, and clear-time deltas require two wins. Next-stage entry and a fresh reload may use different seeded plans.

Results do not sync across devices. Storage failure leaves new results session-only; unrecognized, corrupt or oversized old records remain untouched. Concurrent valid writes use the last successful write.

## Run locally and test

The browser game needs no backend; a static server can serve the repository root. Playing it does not require Node.js, `@napi-rs/canvas` or the native font files listed below.

Tests were verified with **Node.js 24.22.1**, **`@napi-rs/canvas` 0.1.100** and its matching-version platform native binary package. These are verified environment versions, not minimum compatibility requirements. Native-canvas checks also use these hard-coded font paths:

- `/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc`: Noto Sans CJK collection 2.004.
- `/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf`: DejaVu Sans Book 2.37.
- `/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf`: Noto Sans Regular 2.004.

These test dependencies and font assets are not bundled with the game. On other systems, provide the font files at the same paths or adapt the test configuration before running the suites; the unchanged tests should not be assumed to work cross-platform.

```sh
for test in td-*.test.js; do node "$test" || exit 1; done
```

All **47 test suites** pass on the final Demo 0.15 release source and a fresh Git-free copy of the complete runtime and test files. Simulations, DOM/storage doubles and native-canvas checks are not browser acceptance. This release source has not passed browser (including native keyboard defaults), physical-phone, touch, screen-reader, performance or human-enjoyment acceptance. Main 6 cleanup approaches 110.6s in some tested simulations; pacing still needs actual playtesting.

This is a generated-art 2D preview with large first-load images. Generated artwork does not establish character rights or commercial permission. Historical prototypes are not the current game entry point.
