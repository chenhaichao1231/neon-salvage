# Neon Salvage

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

## Current version: 0.2.1

Three ships, nine upgrades, four enemy types including a guardian, extraction decisions, persistent upgrades, daily seeds, touch support, and optional synthesized audio.

## Development checks

Run `node --check game.js` and `node test.js`. No build step or package installation is required.

Development is ongoing. Each version retains direct `index.html` launch support. See CHANGELOG.md.

## New in v0.2: supply beacons
A golden supply ring appears after 15 seconds. Charge inside for 2 seconds to gain 18 hull, 8 XP, and 100 points. Charge slowly decays outside; the beacon expires after 22 seconds. Chasing supplies creates new routes and risks getting surrounded.

Simulation smoke test: `node smoke-test.js` (not a replacement for visual browser testing).
