# Campus Defense · 校园防线

**Demo 0.14** · [Play online](https://chenhaichao1231.github.io/neon-salvage/) · [中文](README.md)

A five-lane campus defense game. Collect GPU resources, deploy four AI guards, and stop data enemies entering from the right.

## Play

1. Choose a guard, then an empty cell. Guards fire only to the right; inspect each lane's forecast first.
2. Press Start wave when ready. New supplies can fund reinforcements during battle.
3. A 30-GPU drop arrives every six battle seconds. Click to collect immediately, or receive it automatically four battle seconds later.
4. While paused, deploy, collect existing drops or use emergency withdrawal. Deployment spends GPU immediately. Future supplies and simulation time remain frozen until Resume.
5. Retry restores your pre-wave formation, GPU and the same seeded status schedule, so you can revise your plan.

## Four basic guards

All four are available from the first stage. Their personalities are fictional game rules, not assessments of real AI products.

- **DeepSeek · 50 GPU:** cheap single-target fire, 10 damage every 1.1s. Warned two-second rice breaks occasionally interrupt firing.
- **GPT · 90 GPU:** 14 damage every 1.4s, piercing up to two distinct targets per shot. Warned three-second weak windows reduce damage to 70%.
- **Claude · 120 GPU:** a single 30-damage armor-ignoring hit every 2s. A two-second warning precedes an automatic three-second offline review. No player questions, nationality checks or personal information are involved.
- **Grok · 80 GPU:** 16 damage every 1.8s, hitting at most three nearby enemies within 0.8 cells in the same lane. Every fourth committed shot deals 4 damage instead; misses still count. The next-shot counter is separate from the quality of an already-fired projectile.

Cheap coverage, piercing, armor bypass and tight-cluster damage have different strengths. Buying every guard type is not required for every stage.

## Waves and resources

- The four main stages contain **30, 50, 54 and 43 enemies**, arranged in **3, 4, 4 and 4 pushes**. Final arrivals occur at 55, 57.25, 68 and 61 battle seconds. Lane forecasts and the grouped exact schedule remain available.
- **Main 4 · Shifting pressure:** fragments gather in lane 3, then fragments and chargers arrive in lane 5 and finally lane 1. Its 43 enemies arrive in four pushes starting at 4, 22, 36 and 53 seconds. This is ordinary five-core survival, with no zero-leak requirement or lane-turning routes. Plan later purchases for the next pressure point; cheap reinforcement and mixed specialties both have viable plans.
- Two optional mechanic drills contain two enemies for a single detour and nine for a converging convoy. Any leak fails these drills. Once a turn has begun charging, withdrawing its guard does not cancel it.
- Each stage starts with 180 GPU and grants 300 fixed supply GPU. Kills provide no extra income. Early victory credits remaining supply.
- Preparation refunds are full. There is **one emergency withdrawal per battle**, returning 25 / 45 / 60 / 40 GPU for DS / GPT / Claude / Grok.
- Withdrawal does not erase existing projectiles. Redeployment costs full price. Voluntary withdrawals are separate from defeated guards; refunds are not supply income and do not reduce gross deployment spending.
- 1× / 2× changes simulation speed, not combat rules. Hiding the page pauses it; returning requires explicit Resume.

## Presentation and progress

When the right letterbox gutter can fit the forecasts, lane labels move into it; narrower layouts keep their original placement.

Upcoming labels now show “Next in 5s” above the enemy type, separating future arrivals from enemies already present. Nearby packs show type-shaped counts when space permits, with a key in the existing game notes. Tight layouts use a total-only count, or omit the extra count if even that cannot fit safely. Ingress, especially on narrow layouts, can still overlap; enemies and health bars have not moved. Pack counts do not mean shared HP or targets per shot.

Optional battle facts now count Grok shots that actually hit at least two distinct targets. A third target does not add another count; weak shots qualify when they hit two targets. This is a hit observation, not a damage or effectiveness ranking. Demo 0.14 adds local last-result references and lists the four main stages before the two optional drills. All six encounters, four guards, combat mechanics and stats, economy, seeded plans, animation, artwork and exact retry behavior are unchanged.

Guards have idle, attack and status poses. Low health receives a color and text cue. The AMD supplier is named Lisa Su (苏姿丰 in Chinese). Failed artwork uses labeled fallback visuals while gameplay remains functional.

Language and available-stage progress are saved in the current browser when storage works. Winning main 3 immediately saves access to main 4, and Next goes directly there; the two drills remain optional. Legacy saves that already reached either drill can also enter main 4 without clearing a drill. An old main-3-only bookmark does not prove a past victory and does not unlock main 4 by itself. Refresh starts the remembered stage with an empty formation and 180 GPU; Retry instead restores the exact pre-wave setup. The stage selector lists main stages first, keeping the same access rules.

The browser keeps **one compact last finished result per stage**, whether won or lost, when storage works. It is the last result, not a personal best, ranking or reward. Open the existing Schedule & last result notes during preparation to recall outcome, core, leaks, defeated guards, gross GPU spending, battle time and withdrawal/refund totals. Failed time is time until defeat, not clear time. Spending is before withdrawal refunds; saved summaries do not retain old withdrawal locations/times or shot histories.

Preparation can show a valid same-stage result from different plans or rules, with an explicit warning before the numbers and no performance comparison. Battle hides this history. Terminal deltas use only a compatible reference visible before this attempt, with the same initial seed, status schedule, exact spawns, roster, mechanics, economy, grid and objective. Clear-time deltas require two wins. Current shot facts are observations, not performance scores. Next-stage entry and a fresh reload may use different seeded plans; historical recall still works, while comparison remains restricted.

Results stay in this browser, without cross-device sync or restoration of a battle, formation or resources. The stage/language bookmark is separate. If result storage cannot be read or written, new results for that stage remain session-only. Unrecognized, corrupt or oversized stored records are left unchanged rather than repaired or overwritten. Concurrent valid writes use the last successful write; there is no guaranteed global ordering across tabs.

This is a generated-art 2D preview. Large images may make first load slow. Generated artwork does not establish character rights or commercial permission. Physical-phone, touch, screen-reader and performance acceptance are not complete. Browser geometry checks for the new notes content, including desktop open-footer scrolling and mobile document flow, remain pending.

## Run locally and test

No backend is needed. Serve the repository root with a static server, for example:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8000/`.

The `td-*.test.js` suites use Node.js; some drawing checks require `@napi-rs/canvas`.

```sh
for test in td-*.test.js; do node "$test" || exit 1; done
```

All 35 td-*.test.js suites passed for Demo 0.14, including a fresh Git-free export. Automated checks and fixed-policy simulations are not complete device acceptance, exhaustive balance proof or evidence of human enjoyment. Historical prototype files are not the current game entry point.
