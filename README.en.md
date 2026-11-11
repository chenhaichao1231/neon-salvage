# Campus Defense · 校园防线

**Demo 0.12** · [Play online](https://chenhaichao1231.github.io/neon-salvage/) · [中文](README.md)

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

Cheap coverage, piercing, armor removal and tight-cluster damage have different strengths. Buying every guard type is not required for every stage.

## Waves and resources

- The three main stages contain **30, 50 and 54 enemies**, arranged in **3, 4 and 4 pushes**. Final arrivals occur at 55, 57.25 and 68 battle seconds. Lane forecasts and the grouped exact schedule remain available.
- Two separate mechanic drills contain two enemies for a single detour and nine for a converging convoy. Any leak fails these drills. Once a turn has begun charging, withdrawing its guard does not cancel it.
- Each stage starts with 180 GPU and grants 300 fixed supply GPU. Kills provide no extra income. Early victory credits remaining supply.
- Preparation refunds are full. There is **one emergency withdrawal per battle**, returning 25 / 45 / 60 / 40 GPU for DS / GPT / Claude / Grok.
- Withdrawal does not erase existing projectiles. Redeployment costs full price. Voluntary withdrawals are separate from defeated guards; refunds are not supply income and do not reduce gross deployment spending.
- 1× / 2× changes simulation speed, not combat rules. Hiding the page pauses it; returning requires explicit Resume.

## Presentation and progress

Guards have idle, attack and status poses. Low health receives a color and text cue. The AMD supplier is named Lisa Su (苏姿丰 in Chinese). Failed artwork uses labeled fallback visuals while gameplay remains functional.

Language and reached-stage progress are saved in the current browser. Battles and comparison records do not sync across devices. Session-only battle facts track leaks, defeated guards and withdrawals, with comparisons restricted to the same stage and seeded schedule.

This is a generated-art 2D preview. Large images may make first load slow. Generated artwork does not establish character rights or commercial permission. Physical-phone, touch, screen-reader and performance acceptance are not complete.

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

The 28 relevant pre-release suites passed for Demo 0.12. Automated checks and fixed-policy simulations are not complete device acceptance, exhaustive balance proof or evidence of human enjoyment. Historical prototype files are not the current game entry point.
