# Campus Defense · 校园防线

**[Play the online demo](https://chenhaichao1231.github.io/neon-salvage/)**

## Animation Demo 0.3

Defend five lanes from runaway data, collect GPU compute, and deploy AI characters. This first demo tests the interaction loop and two units, not final art or balance.

**Block placeholders are replaced by campus, character, supply-person and monster assets generated from the approved concept. Battle, rice-break and brain-fog poses change with live state; core rules are unchanged. This is still a 2D sprite prototype, not final animation. Community originals are not bundled. Generation does not verify underlying character rights or grant commercial reuse.**

Select DS or GPT, then an empty cell. Start the wave when ready. The right edge previews the next arrival in each lane; expand the full schedule for details. DS is cheap but occasionally takes a warned two-second rice break. GPT pierces two targets every fourth shot, with occasional warned three-second windows of 70% damage. These are fictional rules, not factual evaluations of real AI products.

GPU drops can be clicked or automatically collected after four seconds; they never expire. Every stage has a finite supply, so waiting cannot farm unlimited money. Preparation refunds are complete. Reinforce during combat, pause, switch to 2× speed, retry the same schedule, or change language without resetting play.

Three short stages are available. Cheap-unit strategies may currently be too strong; the next pass focuses on meaningful placement and combinations rather than stage count. Progress is not saved yet, so refreshing starts over. No accounts, payments, or personal-identity collection.

Old games are removed from the local current project; online source cleanup is still in progress. Git history remains. The separate old player ZIP has been removed.

## Animation changes

DeepSeek now uses drawn idle/blink, wind-up/cast and bowl/chopstick/chewing frames tied to live shooting and rice-break state. GPU pickups arc from the four supply positions with matching clickable bounds. GPT and enemies still use their existing static poses and are not claimed as animated.

## Next version and estimate

Next: verify the online artwork, deployment alignment and rice state, improve GPU delivery and hit feedback, then return to stage 2/3 tactical balance. Further AI characters await the user's instruction.

Estimated next check/update: **November 11, 2026, 00:45–01:30 Beijing time**, not a guaranteed launch time. Concrete blockers will be reflected here. The agreed development window ends November 11 at 22:57 Beijing.

## Verification

19 engine and 12 UI/real-engine integration test groups pass, including finite income, pause, language, deterministic retries and status feedback. Automated simulations establish rules and reachable wins, not human enjoyment. Version 0.1 was played through stage one in a real browser, including pause, language, GPU collection and retry. Version 0.2 has runtime Canvas render checks; its online visual acceptance follows deployment and is not claimed in advance.
