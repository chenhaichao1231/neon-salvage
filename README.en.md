# The Seventh Night Hotel · 第七夜旅馆

[Portrait hotel game](https://chenhaichao1231.github.io/neon-salvage/hotel.html) · [How to play](HOTEL.en.md) · [中文](README.md)

**v0.6.0 is published and has passed this round of online browser checks.** The entry remains `hotel.html`. Published revision: `b0d9323b38e545a26ab932701222a8d6483e79af`.

## v0.6.0: Finish investigating without filling turns

Guidance no longer repeatedly recommends a witness whose relevant account has already been established. If you have finished your investigation, the optional collapsed **End the investigation and wait for dawn** control lets you proceed to the final decision without spending remaining turns on filler actions.

This requires explicit confirmation: remaining investigation opportunities are forfeited. Waiting grants no missing evidence, cooperation or ending requirements, and does not choose an ending for you. An unsecured original is still taken away as usual. You can instead cancel and keep investigating.

Old saves can upgrade without restarting. Saves containing the new waiting-history entry are not guaranteed to load in an older version. Deploy the complete current set of scripts together, not a mixture of old and new files.

**v0.6.0 verification:** all 12 `*.test.js` files passed, including the 44 baseline engine tests, 6 waiting tests and UI regressions. In a real browser at 360×640, the v0.6 footer and an existing hearing ending restored correctly. After restarting the tester’s own QA save, cancelling the wait kept Night One planning unchanged; confirming it reached the final decision with zero evidence. The unsecured original was taken away, and publication/hearing requirements were explicitly unmet. This was not a complete three-night v0.6 playthrough or physical-phone testing. The earlier v0.5.1 full hearing playthrough remains a separate historical check. No chapter is added.

## v0.5: Know what you are investigating

Establish the order of the warning and floodgate opening seven years ago, assess whether the old report is trustworthy, then decide where the evidence goes. The opening no longer substitutes a side question about keys for the case objective.

- **Three entries, one workspace at a time:** Current action, Room setup / Guest locations, and Clue notebook open separately instead of demanding attention to every panel at once.
- **Select a guest directly:** at night, choose the person you want to find, then see the available actions. Selecting someone is free; confirming an investigation advances time.
- **Skippable first-discovery guidance:** default rooms and power are ready to use. Prompts introduce finding a record, opening it to read, and testing an idea with two sources. They do not execute actions or choose the correct explanation. Skip the guide or reopen it when needed.
- **Step-by-step evidence and feedback nearby:** choose two records, a question and an explanation, with no default answer. Action results and reasoning feedback appear beside the current interaction rather than requiring a search through the journal.

Existing saves need no restart to use the interface. Evidence, deductions and endings remain intact; completed stories do not regain night actions. The same three nights, three actions per night, free reading and comparisons, promises, key strategies and ending requirements remain.

**Online verification:** v0.5.1 restored an existing Night Two planning save at 360×640, displayed the correct version footer, and kept the short English next-step prompt and primary button within the viewport. The full objective expanded correctly and remained open when switching languages. The power-setup link opened the controls without changing power automatically. Both html/body width and scrollWidth measured 345px, with no horizontal overflow. This patch changes layout and short text only; the earlier v0.5 first-guide playthrough, incorrect/correct comparisons and v0.4 ending restoration checks remain applicable. Local coverage includes 44 engine tests, 5 object-view tests and additional UI regressions. The v0.5.1 online playthrough has also now completed all three nights through the hearing ending. These are browser checks, not physical-phone tests; they do not substitute for v0.6.0 validation.

Earlier test and online playthrough records are retained in the [full guide and verification limits](HOTEL.en.md).

## v0.4.0: View evidence objects

Choose **View object** on a discovered evidence card to inspect CSS/SVG schematic recreations of five material types: the log, medical card, key comparison, borrowing book and tape. Undiscovered material has no entry. Players who have finished can inspect their collected evidence without clearing the save or starting again.

These are schematic recreations, not new hidden clues or pixel-hunting puzzles. All actual information comes from DOM text supplied by the current engine, with object state reflected in the current record. Evidence pairing keeps the existing reasoning mechanism. Viewing, testing a pair and closing the view cost no night action; no new puzzle rules are introduced.

## v0.3.0: Choices and agreements

Open the **Choices / Agreements** action category to inspect each strategy’s prerequisites and consequences. Ordinary conversation or inspection does not silently make these choices for you.

- **A hearing-first promise:** inspect the registration record first, then choose this when Xu is available for a private conversation. It costs one action and obtains raw material and her cooperation, not an automatic deduction. You promise a hearing before publication. Choosing publication later gives an explicit advance warning and affects her willingness to continue interviews. Silence does not fulfill the hearing agreement either. Ordinary conversation remains a way to obtain the relevant material without making a promise.
- **Take the company spare key:** first read Zhou’s retrieval order, then choose this while he is absent and you do not already have a brass key. It costs one action; reading the letter alone does not take the key. This offers a different access strategy, but damages trust with Zhou and leaves consequences for missing property and handover responsibility. It proves nobody’s guilt. The normal UI explains and disables the option when prerequisites are unmet.

Expand evidence to read the full text, and use summaries of selected records to compare them. Choice records cannot substitute for independent accident evidence. No complete route or correct interpretation is given here.

Old saves can continue, but missed time windows cannot be replayed within that save. Players who have finished must start a new story to experience these branches. This is not a long-form expansion or a claim that repetition has been solved.

## Next update plan and estimate

The next priority is paginated reading in Case One; Case Two is paused. Planned improvements cover Chinese and English dialogue and clues on portrait phones, with page numbers, previous/next controls and retained context instead of shrinking the text. These changes are not yet complete. The next update is estimated for **November 10, 2026, 21:00–22:00 Beijing time (UTC+8)**, not guaranteed; verification will determine release timing, and blockers take priority. Plan checked November 10, 2026, 19:46 Beijing time.

Existing Neon Salvage and saves remain available at the [original entry](https://chenhaichao1231.github.io/neon-salvage/). The hotel has an independent save.

## Original Neon Salvage documentation

## v0.15.1: Inspect coverage before spending cargo

The relay panel previews free cargo count and remaining value, movable wrecks, lureable enemies, and whether the rival’s target is covered. This is a snapshot, not a promise of profit. Skip fuel when there is nothing worth concentrating or protecting. Thin gold rings indicate gathered cargo; blue rings indicate current jamming coverage, not bullet protection. Longer explanations sit under an expandable How it works section so choices and controls come first.

## v0.15.0: Misleading Broadcast, the same wreckage

**Existing players can enter Salvage Skirmish directly, or choose Enter salvage field at Silent Station.** Three relays also appear in Dock Seven’s salvage field. Neither Chapter One nor Dock Seven completion is required. Original Free Flight is unchanged, and existing alloy, chapters and projects remain.

Within **90 metres of a relay, press H**, or tap Relay controls. The three stations are independent, not a checklist that must be completed in order:

- **Power:** tow an ordinary wreck alongside the relay and consume the entire object. Each remaining alloy-value point provides 1.5 seconds of power, up to 60 stored seconds per relay. Overflow is lost. Story cores cannot be used, and damaged cargo provides less charge.
- **Gather:** powered relays initially pull free ordinary wrecks within 250 metres toward them. These are the original objects, not newly created cargo. Nearby ordinary enemies are also lured; after approaching the relay they resume pursuit. Bosses are unaffected. Concentrating salvage can concentrate danger too.
- **Jam:** switch a powered relay to prevent free ordinary cargo within 250 metres from being selected by the rival. This cannot recover cargo it already holds, clear existing enemies or block bullets. Retuning costs no additional cargo, but locks further switching for five seconds.

**Successfully use at least one relay and extract alive** to unlock free Central / West / East placement at the station. This moves only one relay on later runs; the other two stay put. It grants no damage boost. Death or ending the run from the pause menu does not unlock it. Charge, spent resources and cargo do not carry into the next run.

All relays are optional: ignoring every one still allows normal salvage and extraction. The broadcast adds field tradeoffs and an investigation clue, not a claim that long-term replayability or a complete campaign is solved.

## v0.14.0: Dock Seven, save the ship or recover the record?

**Returning players: finish Chapter One’s power-line choice, then open Silent Station → Explore Dock Seven.** No reset or repeat shipyard grind is required. Follow the target marker to the freighter and press **G** within 100 metres, or use the touch contact button:

- **Fuel the ship:** consume one ordinary wreck towed alongside it with at least 12 remaining alloy value. The freighter physically travels toward the origin while enemies pursue it and damage it through contact and projectiles. This is not a countdown. Escort it or clear its return route.
- **Detach the black box:** remove the one original object from the hold while the crew leaves by escape pod. Grab it with E and bring both pilot and box inside the **origin** recycler for 1.5 seconds. Outposts cannot substitute for the origin, and the box earns no ordinary cargo alloy.
- Chapter One changes the assistance: habitat support provides one emergency recovery to 40 hull; workshop support provides one repair of up to 30 hull and faster return engines.
- Completing the escort permanently unlocks a **transfer point**. On each later salvage run it automatically banks one ordinary held cargo item brought inside its radius, at remaining value. Delivering the black box unlocks a **listening post**, continuously marking the most valuable free ordinary cargo in the field. It creates no cargo and adds no value.

The route cannot be switched after choosing it during a run, and a completed facility outcome cannot be chosen again. Failed attempts can restart from the station, preserving previous chapters, projects and alloy. Chapter One and this playable continuation are not a complete long-form campaign.

Three new embedded original assets depict the freighter, transfer station and listening array, bringing the total to 12. Offline play still requires no external asset requests.

## v0.13.1: salvage handling patch

Following play feedback, friendly main-gun, turret and reflected shots no longer collide with or damage cargo. They pass through and can still hit enemies beyond it. Cargo continues to block hostile shots and take hostile damage; throwing and delivery are unchanged. No save reset is needed.

New regressions cover all three friendly projectile sources and loose, held, rival-owned and story-core cargo. Existing story, rig, outpost and backup checks still pass. These tests do not replace browser or phone playtesting.

## Returning with a maxed shipyard: what is new?

Choose **Silent Station · Free new chapter** from the main menu. Keep your existing alloy and maxed shipyard. Chapter One costs nothing and requires no reset.

- Answer Echo Station’s distress call and tow home a guaranteed physical record core. If it is destroyed or stolen, it returns on your next sortie; no rare-drop grind.
- Use **X Repulsor** immediately to push enemies and loose cargo away. After delivery, choose the habitat or workshop power line. Station lights and dialogue change.
- Habitat unlocks the **Repair press**, which consumes held salvage to repair your ship. A shelter beacon repairs cargo on later salvage runs, with a finite repair budget.
- Workshop unlocks the **Reflector**, briefly returning enemy bullets without preventing collision damage. Story sorties gain salvage-powered turrets.
- Select one unlocked active rig at the station before each run. The branch choice is currently irreversible. Dock Seven becomes available after completion; a longer campaign is still unfinished.

### What can alloy buy now?

Use old savings or new earnings in **Station projects**:

- **180 alloy: permanent recycling outpost**, west or east. From your next salvage run, this is a real delivery/extraction location that changes collection routes, not a damage upgrade.
- **40 alloy: turret supply pack**, 12 rounds each, maximum 3 stored packs. Your next salvage sortie with turrets loads the first turret. If there are no turrets, supplies remain stored. You need not sacrifice cargo to power that turret first.

These are implemented uses, not a claim of endless progression. Story, projects and tactical choices remain under development.

### Save compatibility

Old alloy, shipyard levels, best score and run count remain. Story, projects, Dock progress and broadcast layout are saved independently; current format 4 full backups include all of them. Legacy format 1 restores old progress while retaining story, Dock and broadcast state. Format 2 restores story and projects while retaining Dock and broadcast state. Format 3 restores story, projects and Dock progress while retaining the current broadcast layout. Export through Shipyard→Backup & restore before updating. Different directories or browsers may use different local storage, so keep a backup.

## Play online

[Open the web version](https://chenhaichao1231.github.io/neon-salvage/) without downloading.

The hosted game and local offline files use separate browser-storage origins. Progress does not sync automatically. Export a full backup through Shipyard → Backup & restore in your current version, then import it in the destination version. Keep your old save. Switching browsers also requires backup migration.

## Download and play

[Get the published v0.14.0 player package](https://github.com/chenhaichao1231/neon-salvage/releases/tag/v0.14.0). Choose the **Neon-Salvage-Play.zip** release attachment, extract it, and open **index.html**. This is the fixed, lightweight **0.14.0** runtime package. Even after the repository or web game advances to 0.15, this attachment remains 0.14.0 and does not update automatically.

The release page’s **Source code** downloads contain that version’s complete source archive, not the lightweight player package. **Code → Download ZIP**, described below, instead downloads the repository’s current source, which may be newer than the fixed attachment.

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

## Current version: 0.15.0

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

Choose Salvage Skirmish from the main menu. Wrecks are shared resources: tow them home for alloy, use them as cover against hostile fire (friendly main-gun, turret and reflected shots pass through without damaging cargo), throw them as weapons, or press F to exchange them for finite turret ammunition. A rival pursues the same cargo; damage makes it drop the original object. See [system guide](SYSTEMS.md).

E grabs/throws along movement heading; Q toggles the main gun; F powers a nearby turret; R requests extraction at the origin. Touch controls are available. Heavy loads slow you down, damage lowers value, and dashing drops cargo. Both pilot and cargo must remain inside the recycler for 1.5 seconds to bank. Banked earnings survive death; undelivered cargo earns nothing. This mode has no original 90-second extraction popup, cache beacons or violet events, and does not yet support same-seed history retries.

This is a playable prototype, not a complete campaign or mature long-term unlock system. Version 0.13 adds story equipment and purchasable station projects. Depth and balance remain under development; this is not a claim that repetition is solved. Rivals and turrets are simulated locally, with no multiplayer.

Additional checks: `node cargo-integration-test.js`, `node rivals.test.js`, `node stations.test.js`. These cover real-game banking, piercing and cover order, no new delivery after lethal damage, original-item rival drops, and single-consumption turret supply. They do not replace browser or phone testing.
