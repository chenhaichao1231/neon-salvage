# The Seventh Night Hotel

[中文说明](HOTEL.md)

**v0.1.1 candidate: 17 automated tests, UI flow tests and checks of 100 random legal paths have passed. Live portrait-screen verification remains pending.** The candidate has been uploaded and its Pages deployment is queued; this does not yet establish a verified online experience. This guide omits the central solution and ending walkthroughs.

## Four guests, three snowy nights

A blizzard closes the mountain road. Four strangers arrive at your hotel carrying the same invitation. You arrange their rooms, allocate limited power and listen to their accounts. As old records emerge, you must decide what can be trusted and what to do with it at dawn.

The story is structured as a **complete short narrative across three nights, four guests, a final decision and different endings**. It is not endless hotel management or combat progression. Reading has no countdown; the limited resource is your nightly actions.

## Getting started

The independent entry is `hotel.html`, not the original game’s `index.html`. For local play, open `hotel.html` with its accompanying scripts, styles and artwork kept together rather than copying the HTML alone. Once deployed, the online candidate also uses the `/hotel.html` entry; live verification remains pending. The original game and its entry remain available and are not overwritten by The Seventh Night Hotel.

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

Select two acquired records on the evidence board, choose a claim and press **Test with these two clues**. Testing costs no night action. If the materials do not support the claim, reread them and try another selection. Collecting records is not the same as establishing a deduction: some follow-up questions and final conditions require you to complete the test.

This interaction is included in the current UI flow tests; live portrait-screen verification remains pending. This guide deliberately omits the correct action order, decisive evidence combinations and central solution.

## Endings depend on more than the last button

At dawn, final choices explain whether their conditions are satisfied. Outcomes depend on the evidence you found, cooperation you established and how you handled records. Choosing without the necessary support can produce a result you did not intend.

The story has a definite conclusion, but not every run will uncover every fact. You can start again after an ending to try another approach. This guide does not reveal which evidence chain leads to which ending.

## Saves and the original game

- The hotel has an independent local save. It does not read or overwrite Neon Salvage’s alloy, levels, story or projects. The original game remains available; this is not a renamed replacement.
- Normal actions attempt to save automatically. Check the save status at the bottom of the page. If browser storage is unavailable, reloading may lose progress.
- Progress belongs to the current browser and origin. It does not automatically sync across devices. Do not assume a hosted page, local file and different browser share one save.
- **New story** asks for confirmation and clears only the current hotel story, not the original space game.
- The current hotel UI offers no save export/import or cloud sync. A Neon Salvage backup is not a hotel backup.

## Initial scope and pending checks

The initial scope is three nights, four guests, four rooms, up to two of three power circuits, three actions per night and conditional endings. It is not a large management simulation, open world or finished long-term content service.

**Passed so far:** 17 automated tests, UI flow tests and checks of 100 random legal paths.

**Still awaiting hands-on verification:** the deployed online entry and artwork loading, plus portrait-phone tapping, scrolling and full playthrough experience. Passing automated tests does not mean every device and narrative path has been manually verified. This guide does not claim completed live verification or promise a next-update feature set or schedule.

The story concerns a past disaster, bereavement, responsibility and concealment, primarily through text. You may stop whenever you need to; reading itself carries no time pressure.
