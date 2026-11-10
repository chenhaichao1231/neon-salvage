# Neon Salvage

## Next update plan and estimate
- Current version: **0.3.1**.
- Next: add local save backup and restore so downloading a new version can preserve shipyard progress, and expand regression checks. Keep both UI languages and guides synchronized.
- Estimated update: **November 10, 2026, 16:00–16:20 Beijing time (UTC+8)**. This is an estimate, not a guarantee. Test failures take priority and will prompt a plan update here.
- Plan last updated: November 10, 2026, 15:30 Beijing time.
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

## Current version: 0.3.1

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
