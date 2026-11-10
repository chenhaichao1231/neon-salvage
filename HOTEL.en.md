# The Seventh Night Hotel

[中文说明](HOTEL.md)

**v0.2.0 is being prepared for release; the new version is not yet confirmed live.** This update improves evidence reasoning and character responses without adding a chapter. The instructions below describe the v0.2.0 candidate; earlier v0.1.1 online checks do not establish verification of this update.

## Four guests, three snowy nights

A blizzard closes the mountain road. Four strangers arrive at your hotel carrying the same invitation. You arrange their rooms, allocate limited power and listen to their accounts. As old records emerge, you must decide what can be trusted and what to do with it at dawn.

The story is structured as a **complete short narrative across three nights, four guests, a final decision and different endings**. It is not endless hotel management or combat progression. Reading has no countdown; the limited resource is your nightly actions.

## Getting started

The independent entry is `hotel.html`, not the original game’s `index.html`. For local play, open `hotel.html` with its accompanying scripts, styles and artwork kept together rather than copying the HTML alone. Use the [direct hotel entry](https://chenhaichao1231.github.io/neon-salvage/hotel.html) online; its v0.1.1 loading check has passed. The original game and its entry remain available and are not overwritten by The Seventh Night Hotel.

Choose **Open the hotel door** to begin. A readable local save lets you continue your existing story. Use the top-right language control to switch between Chinese and English.

The interface is designed around **portrait-phone tapping and vertical scrolling**, with no keyboard, dragging or fast reflexes required. The map shows arrangements, the story panel holds dialogue and actions, and the ledger below retains known evidence and earlier entries.

## Each night

### 1. Before nightfall: rooms and power

- Select a guest, then a room. Occupied rooms swap their guests; you can revise arrangements before beginning the night.
- Power at most two of three circuits: heating, archive and radio. To replace an active circuit, switch one off first.
- Room adjacency and power affect where guests go, whom they may meet and which facilities are usable. Expand the circuit descriptions for details.
- **Begin this night** locks that night’s rooms and power. You may rearrange them before the following night.

### 2. After nightfall: three slots, three actions

Each night has three time slots. An actual investigation action advances one slot, for nine actions across the story. You can talk, examine records, listen at an appropriate location, present established findings in a follow-up question or protect an important record when conditions permit.

Selecting a guest, changing action categories, reading descriptions and reviewing the ledger do not themselves spend a slot. Read the conditions and cost before executing an action. An unsuccessful investigation may still take time; before listening, check who is actually present.

The third slot leads automatically to the next night’s planning. After Night Three comes the dawn decision. The game does not advance merely because you take time to read.

### 3. Evidence and reasoning

The ledger records discovered facts, guest accounts and earlier events. Consider whether independent records support one another. Distinguish evidence that someone did something from proof of a broader conclusion. Cooperation and the safe preservation of records may matter as well.

Questions appear as you discover relevant evidence rather than being listed in full at the start. Each offers three explanations. Select two acquired records, then actively choose an explanation to test. No answer is preselected or assumed correct. You can keep investigating before any question has appeared.

Testing costs no night action, including when an explanation is wrong. Feedback distinguishes insufficient evidence from an interpretation that goes beyond what the records support. Reread and try again. Collecting records is not the same as establishing a deduction; some follow-up questions and final conditions still require a completed test. Testing is unavailable after an ending, so start a new story to experience the revised flow.

Later dialogue and current evidence descriptions better reflect admissions, cooperation and the custody of important records. Historical journal entries retain what was known when the event happened rather than being rewritten with later knowledge. This guide does not reveal the correct explanations, evidence combinations or central solution.

## Endings depend on more than the last button

At dawn, final choices explain whether their conditions are satisfied. Outcomes depend on the evidence you found, cooperation you established and how you handled records. Choosing without the necessary support can produce a result you did not intend.

The story has a definite conclusion, but not every run will uncover every fact. You can start again after an ending to try another approach. This guide does not reveal which evidence chain leads to which ending.

## Saves and the original game

- Existing v0.1 saves can continue in the update, retaining established deductions and completed endings. Players who have finished must choose **New story** to experience the revised reasoning flow. No chapter is added, and running new saves in an older executable is not promised.
- The hotel has an independent local save. It does not read or overwrite Neon Salvage’s alloy, levels, story or projects. The original game remains available; this is not a renamed replacement.
- Normal actions attempt to save automatically. Check the save status at the bottom of the page. If browser storage is unavailable, reloading may lose progress.
- Progress belongs to the current browser and origin. It does not automatically sync across devices. Do not assume a hosted page, local file and different browser share one save.
- **New story** asks for confirmation and clears only the current hotel story, not the original space game.
- The current hotel UI offers no save export/import or cloud sync. A Neon Salvage backup is not a hotel backup.

## Initial scope and verification limits

The initial scope is three nights, four guests, four rooms, up to two of three power circuits, three actions per night and conditional endings. It is not a large management simulation, open world or finished long-term content service.

**Passed for v0.1.1:** 17 automated tests, UI flow tests and checks of 100 random legal paths.

**Earlier v0.1.1 live browser checks:** the v0.1.1 direct entry loads correctly. Fixed 390×844 and 360×640 portrait iframe viewports in a real browser showed no horizontal overflow. Normal UI clicks completed the three-night hearing route in Chinese, and switching the ending to English worked. Checks also passed for 44px buttons, retention of all four responses from the latest action, ending restoration after reload, and both confirming and cancelling a restart.

**Verification limits:** these were not physical-phone tests, and not every ending has been manually played. They do not establish long-term replay value. Integration and live verification of v0.2.0 still await release confirmation; earlier results are not counted as passing tests for the update.

## Next steps

The next focus is deeper character clues that support reasoning and more meaningful branch consequences, not a claim that long-term replay value is solved. The estimated next update window is November 10, 2026, 19:00–20:00 Beijing time (UTC+8). This is an estimate, not a guarantee; blockers will take priority and may change the plan.

The story concerns a past disaster, bereavement, responsibility and concealment, primarily through text. You may stop whenever you need to; reading itself carries no time pressure.
