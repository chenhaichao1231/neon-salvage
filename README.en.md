# Neon Salvage

## Next update plan and estimate
- Current version: **0.9.0**.
- Next: add optional risk-and-reward sector events to create more route and build variety, retaining necessary regression checks and both languages. Keep both UI languages and guides synchronized.
- Estimated update: **November 10, 2026, 17:00–17:30 Beijing time (UTC+8)**. This is an estimate, not a guarantee. Test failures take priority and will prompt a plan update here.
- Plan last updated: November 10, 2026, 16:08 Beijing time.
- This development window ends November 11, 2026, 15:01 Beijing time, or earlier if the user asks to stop.


An offline-first space-survival roguelite. No installation, registration, payment, or external assets required. [中文说明](README.md)

## Download and play

Choose **Code → Download ZIP**, extract the archive, and open **index.html** in a modern Chrome, Edge, Firefox, or Safari browser. Alternatively, run `python3 -m http.server 8000` in the folder and open `http://localhost:8000`.

Use the **中文 / English** button on the main menu to change language. The preference is stored locally.

## Controls and objectives

- WASD / arrow keys to move. Weapons aim and fire automatically.
- Space to dash; P / Esc to pause. On touch devices, drag the playfield to move and tap Dash.
- Collect green energy to level up and choose one of three upgrades.
- Every 90 seconds, extract for double alloy or continue into a harder sector.
- Guardians appear periodically; destroying one drops a large experience cache and repairs your hull.
- Spend alloy on permanent shipyard upgrades. Daily-seed runs disable these bonuses.
- Progress is stored only in the current browser. Private browsing, clearing site data, or changing the page's origin may make saves unavailable.

## Current version: 0.9.0

Three ships, nine upgrades, four enemy types including a guardian, extraction decisions, persistent upgrades, daily seeds, touch support, and optional synthesized audio.

## Development checks

Run `node --check game.js` and `node test.js`. No build step or package installation is required.

Development is ongoing. Each version retains direct `index.html` launch support. See CHANGELOG.md.

## New in v0.2: supply beacons
A golden supply ring appears after 15 seconds. Charge inside for 2 seconds to gain 18 hull, 8 XP, and 100 points. Charge slowly decays outside; the beacon expires after 22 seconds. Chasing supplies creates new routes and risks getting surrounded.

Simulation smoke test: `node smoke-test.js` (not a replacement for visual browser testing).

## Flight contracts
Each run has three bonus goals: destroy 60 enemies, collect 3 caches, and defeat 1 guardian. Each completed contract grants 20 extra alloy at settlement. Check progress on pause and extraction screens. Contract rewards are not doubled and progress does not carry between runs. A golden edge arrow points toward offscreen supplies.

## Combat warnings and testing
Ranged enemies and guardians show aim lines about 0.65 seconds before firing, then fire along the locked direction. Move sideways after the warning to dodge. Short landscape windows use a compact HUD.
Checks: `node test.js`, `node smoke-test.js`, `node i18n-test.js`, `node validate-release.js`. Logic and text checks pass; full browser visual validation is not yet complete.

## Local save backup and restore
Open Shipyard → Save backup and restore to download a JSON backup. Read it in a new version or another browser, or paste its text. Click Check backup, inspect the values, then Confirm replacement of progress. Restore replaces alloy, upgrades, best score and run count; back up existing progress first. Active flights are not restored. Files are processed only on your device, never uploaded. If downloads fail, copy the text manually. If persistent saving is blocked, the UI warns you.

## Route choices and convenient launch
At extraction, continue into Swarm or Hunter. Swarm has more fragile regular enemies. Hunter is high risk: more ranged enemies and faster bullets, but new regular enemies grant double XP and kill score. Both repair 25% hull once on entry. Existing enemies keep their stats and guardian stats are unchanged. Hunter does not double alloy.
After collecting a cache, the next beacon waits 30 seconds, making three caches possible before first extraction.
On Windows, double-click `launch.bat`. It only opens the adjacent `index.html` in the default browser, with no installation, downloads or settings changes. Extract the entire ZIP first. Other systems can open `index.html` directly. The script has received static safety review, not a Windows execution test.
Daily seeds do not guarantee cross-device competitive parity: viewport, input and upgrade choices still affect outcomes.

## Flight guide and feedback
Open the flight guide from the main or pause menu without advancing game time. Three ships have distinct silhouettes. A shield ring indicates temporary invulnerability; a red border indicates recent damage, replacing rapid flicker. Reduced motion initially follows your system preference and can be toggled in the guide for this page session. It hides camera shake, decorative particles and menu background drift without changing combat rules.

## Build clarity and long-run protection
Upgrade cards preview actual stat changes. Maxed fire rate, projectiles and drones are excluded. Pause shows weapon stats. The touch stick has an 8px deadzone and reaches full speed at 42px; a second finger cannot steal movement, and dash retains a fixed 130-unit distance.
Enemies are capped at 240. Regular spawning pauses at the cap; a guardian replaces the farthest regular enemy without kill credit or rewards. If every enemy is a guardian, new spawning is skipped. This protects long runs; it does not guarantee difficulty or frame rate.

Performance spot-check: in a fixed-seed, stationary 600-second stress scenario with health restored each frame, peak enemies fell from 3,048 to 240. Health restoration existed only in the stress harness, not the game. This Node simulation excludes drawing and browser DOM and does not establish actual mobile frame rates.

## Local flight log
The main-menu flight log retains the last 20 runs and lets you retry the original seed, ship and starting shipyard levels. Daily retries always omit shipyard boosts. Actions, viewport size, route and version change results: this is not a recording or a reproducibility guarantee. Logs never leave the device; blocked storage keeps them only until the page closes. Progress JSON backups remain compatible, exclude flight history, and do not erase existing history when restored.

## Guardians and relics
Below half health, a guardian enters an enraged phase at its next aim lock: faster bullets leave a gap toward the aim position. Warnings and actual shots share locked directions; reposition or dash toward safety.
Defeat a guardian to choose from up to three randomly offered relics, each of six unique relics available once per run. Limitbreaker trades hull for damage; Gravity Crown trades speed for collection and XP; Brood expands drones; Phase Echo boosts dash; Starlance boosts piercing; Undying Ember improves sustain. You may instead keep your build and repair 25. Once available relics are exhausted, guardian rewards repair an extra 40. Relics last for this run, not permanently in the shipyard.
