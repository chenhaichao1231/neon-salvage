# Neon Salvage

## Next update plan and estimate
- Current version: **0.13.0**.
- Next: develop the Dock Seven continuation so Chapter One choices affect later events and solutions; expand practical station projects and active equipment without raising old level caps. Keep both languages and old-save compatibility aligned.
- Estimated update: **November 10, 2026, 18:30–19:00 Beijing time (UTC+8)**. This is an estimate, not a guarantee. Test failures take priority and will prompt a plan update here.
- Plan last updated: November 10, 2026, 16:50 Beijing time.
- This development window ends November 11, 2026, 15:01 Beijing time, or earlier if the user asks to stop.


An offline-first space-survival roguelite. No installation, registration, payment, or external assets required. [中文说明](README.md)

## Returning with a maxed shipyard: what is new?

Choose **Silent Station · Free new chapter** from the main menu. Keep your existing alloy and maxed shipyard. Chapter One costs nothing and requires no reset.

- Answer Echo Station’s distress call and tow home a guaranteed physical record core. If it is destroyed or stolen, it returns on your next sortie; no rare-drop grind.
- Use **X Repulsor** immediately to push enemies and loose cargo away. After delivery, choose the habitat or workshop power line. Station lights and dialogue change.
- Habitat unlocks the **Repair press**, which consumes held salvage to repair your ship. A shelter beacon repairs cargo on later salvage runs, with a finite repair budget.
- Workshop unlocks the **Reflector**, briefly returning enemy bullets without preventing collision damage. Story sorties gain salvage-powered turrets.
- Select one unlocked active rig at the station before each run. The branch choice is currently irreversible. The next chapter is not available yet; the closing clue is not a finished campaign.

### What can alloy buy now?

Use old savings or new earnings in **Station projects**:

- **180 alloy: permanent recycling outpost**, west or east. From your next salvage run, this is a real delivery/extraction location that changes collection routes, not a damage upgrade.
- **40 alloy: turret supply pack**, 12 rounds each, maximum 3 stored packs. Your next salvage sortie with turrets loads the first turret. If there are no turrets, supplies remain stored. You need not sacrifice cargo to power that turret first.

These are implemented uses, not a claim of endless progression. Story, projects and tactical choices remain under development.

### Save compatibility

Old alloy, shipyard levels, best score and run count remain. Story/projects are stored separately, and full backups now include them. Importing a legacy format 1 backup restores old progress while retaining your current story; format 2 restores story and projects too. Export through Shipyard→Backup & restore before updating. Different directories or browsers may use different local storage, so keep a backup.

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

## Current version: 0.13.0

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

## Optional vault encounters
Starting at 30 seconds, a violet signal appears every 90 seconds and lasts 25 seconds. Approach and choose: cracking it causes denser normal spawns for 20 seconds, then pays 25 XP (scaled by XP multiplier) and 40 bonus alloy if you survive. Safe salvage repairs 20 immediately, or ignore it. Bonus alloy is not doubled on extraction; death or extraction before completion pays nothing.
The first guardian has 1,000 base hull; later guardians retain 1,800, before time scaling. In a small real-damage bot sample, relic access increased from 1/15 to 7/15. This does not guarantee access or human enjoyment.

## Spacecraft art
This release replaces basic player/main-enemy shapes with six original transparent ship sprites, hangar previews and a nebula background. Assets are embedded for offline use. Source art and the contact sheet were inspected; browser-scene and physical-mobile validation remain incomplete.

## v0.12: Salvage Skirmish

Choose Salvage Skirmish from the main menu. Wrecks are shared resources: tow them home for alloy, use them as cover against both sides, throw them as weapons, or press F to exchange them for finite turret ammunition. A rival pursues the same cargo; damage makes it drop the original object. See [system guide](SYSTEMS.md).

E grabs/throws along movement heading; Q toggles the main gun; F powers a nearby turret; R requests extraction at the origin. Touch controls are available. Heavy loads slow you down, damage lowers value, and dashing drops cargo. Both pilot and cargo must remain inside the recycler for 1.5 seconds to bank. Banked earnings survive death; undelivered cargo earns nothing. This mode has no original 90-second extraction popup, cache beacons or violet events, and does not yet support same-seed history retries.

This is a playable prototype, not a complete campaign or mature long-term unlock system. Version 0.13 adds story equipment and purchasable station projects. Depth and balance remain under development; this is not a claim that repetition is solved. Rivals and turrets are simulated locally, with no multiplayer.

Additional checks: `node cargo-integration-test.js`, `node rivals.test.js`, `node stations.test.js`. These cover real-game banking, piercing and cover order, no new delivery after lethal damage, original-item rival drops, and single-consumption turret supply. They do not replace browser or phone testing.
