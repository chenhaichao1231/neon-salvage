# The Seventh Night Hotel

[中文说明](HOTEL.md)

**v0.3.0 is live and has completed this round of online browser checks.** Two choices with action costs and character consequences join the existing three-night, four-guest short story. No chapter is added.

## Four guests, three snowy nights

A blizzard closes the mountain road. Four strangers arrive at your hotel carrying the same invitation. You arrange their rooms, allocate limited power and listen to their accounts. As old records emerge, you must decide what can be trusted and what to do with it at dawn.

The story is structured as a **complete short narrative across three nights, four guests, a final decision and different endings**. It is not endless hotel management or combat progression. Reading has no countdown; the limited resource is your nightly actions.

## Getting started

The independent entry is `hotel.html`, not the original game’s `index.html`. For local play, open `hotel.html` with its accompanying scripts, styles and artwork kept together rather than copying the HTML alone. Use the [direct hotel entry](https://chenhaichao1231.github.io/neon-salvage/hotel.html) online; its v0.3.0 online loading check has passed. The original game and its entry remain available and are not overwritten by The Seventh Night Hotel.

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

Question titles and explanation options use neutral wording rather than revealing the intended conclusion. The key question supports an alternative evidence chain, so it does not depend on a single fixed pair. The exact combinations are left for you to discover.

Questions appear as you discover relevant evidence rather than being listed in full at the start. Each offers three explanations. Select two acquired records, then actively choose an explanation to test. No answer is preselected or assumed correct. You can keep investigating before any question has appeared.

Testing costs no night action, including when an explanation is wrong. Feedback distinguishes insufficient evidence from an interpretation that goes beyond what the records support. Reread and try again. Collecting records is not the same as establishing a deduction; some follow-up questions and final conditions still require a completed test. Testing is unavailable after an ending, so start a new story to experience the revised flow.

Later dialogue and current evidence descriptions better reflect admissions, cooperation and the custody of important records. Historical journal entries retain what was known when the event happened rather than being rewritten with later knowledge. This guide does not reveal the correct explanations, evidence combinations or central solution.

## v0.3.0: Choices and agreements

Open the **Choices / Agreements** action category to inspect each strategy’s prerequisites and consequences. Ordinary conversation or inspection does not silently make these choices for you.

- **A hearing-first promise:** inspect the registration record first, then choose this when Xu is available for a private conversation. It costs one action and obtains raw material and her cooperation, not an automatic deduction. You promise a hearing before publication. Choosing publication later gives an explicit advance warning and affects her willingness to continue interviews. Silence does not fulfill the hearing agreement either. Ordinary conversation remains a way to obtain the relevant material without making a promise.
- **Take the company spare key:** first read Zhou’s retrieval order, then choose this while he is absent and you do not already have a brass key. It costs one action; reading the letter alone does not take the key. This offers a different access strategy, but damages trust with Zhou and leaves consequences for missing property and handover responsibility. It proves nobody’s guilt. The normal UI explains and disables the option when prerequisites are unmet.

Expand evidence to read the full text, and use summaries of selected records to compare them. Choice records cannot substitute for independent accident evidence. No complete route or correct interpretation is given here.

Old saves can continue, but missed time windows cannot be replayed within that save. Players who have finished must start a new story to experience these branches. This is not a long-form expansion or a claim that repetition has been solved.

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

**Current v0.3.0 checks:** 44 engine tests and UI tests passed. In a real online browser at 360px width, a new story was played through all three nights using normal buttons, making the hearing-first promise and then publishing. The warning about breaking the promise was checked in Chinese and English; the publication ending delivered Xu’s refusal of further interviews. There was no horizontal overflow. Full text for selected records and expandable unselected evidence are covered by automated tests and were also seen online. The spare-key route passed automated UI tests this round; it was not manually completed online. These were not physical-phone tests.

**Historical v0.2.0 checks:** 35 engine tests and UI tests covering two complete routes passed. In a real online browser at 360×640, a v0.1 Night One save was continued through the full publication route using normal buttons. Chinese and English reasoning, disabled submission without an explanation, free wrong-interpretation feedback, successful deductions and the alternative evidence chain were checked with no horizontal overflow. The cover loaded at 390px. The full online hearing playthrough remains the v0.1.1 run; v0.2.0 hearing-route automated tests passed. These were not physical-phone tests and do not establish manual coverage of every ending or long-term replay value.

## Next steps

The next focus is cross-checking character testimony and richer ending postscripts, not a claim that long-term replay value is solved. The estimated next update window is November 10, 2026, 19:00–20:00 Beijing time (UTC+8). This is an estimate, not a guarantee; blockers will take priority and may change the plan.

The story concerns a past disaster, bereavement, responsibility and concealment, primarily through text. You may stop whenever you need to; reading itself carries no time pressure.
