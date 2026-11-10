# The Seventh Night Hotel

[中文说明](HOTEL.md)

**v0.6.0 release candidate: review and local tests passed; real-browser verification is pending.** The entry remains `hotel.html`. The candidate is not yet the production release.

## v0.6.0: Finish investigating without filling turns

Guidance no longer repeatedly recommends a witness whose relevant account has already been established. If you have finished your investigation, the optional collapsed **End the investigation and wait for dawn** control lets you proceed to the final decision without spending remaining turns on filler actions.

This requires explicit confirmation: remaining investigation opportunities are forfeited. Waiting grants no missing evidence, cooperation or ending requirements, and does not choose an ending for you. An unsecured original is still taken away as usual. You can instead cancel and keep investigating.

Old saves can upgrade without restarting. Saves containing the new waiting-history entry are not guaranteed to load in an older version. Deploy the complete current set of scripts together, not a mixture of old and new files.

**Candidate checks:** 44 baseline engine tests, 6 waiting tests and UI regressions passed review and local testing. v0.6.0 browser verification remains pending. No chapter is added.

## v0.5: Know what you are investigating

Establish the order of the warning and floodgate opening seven years ago, assess whether the old report is trustworthy, then decide where the evidence goes. The opening no longer substitutes a side question about keys for the case objective.

- **Three entries, one workspace at a time:** Current action, Room setup / Guest locations, and Clue notebook open separately instead of demanding attention to every panel at once.
- **Select a guest directly:** at night, choose the person you want to find, then see the available actions. Selecting someone is free; confirming an investigation advances time.
- **Skippable first-discovery guidance:** default rooms and power are ready to use. Prompts introduce finding a record, opening it to read, and testing an idea with two sources. They do not execute actions or choose the correct explanation. Skip the guide or reopen it when needed.
- **Step-by-step evidence and feedback nearby:** choose two records, a question and an explanation, with no default answer. Action results and reasoning feedback appear beside the current interaction rather than requiring a search through the journal.

Existing saves need no restart to use the interface. Evidence, deductions and endings remain intact; completed stories do not regain night actions. The same three nights, three actions per night, free reading and comparisons, promises, key strategies and ending requirements remain.

**Online verification:** v0.5.1 restored an existing Night Two planning save at 360×640, displayed the correct version footer, and kept the short English next-step prompt and primary button within the viewport. The full objective expanded correctly and remained open when switching languages. The power-setup link opened the controls without changing power automatically. Both html/body width and scrollWidth measured 345px, with no horizontal overflow. This patch changes layout and short text only; the earlier v0.5 first-guide playthrough, incorrect/correct comparisons and v0.4 ending restoration checks remain applicable. Local coverage includes 44 engine tests, 5 object-view tests and additional UI regressions. The v0.5.1 online playthrough has also now completed all three nights through the hearing ending. These are browser checks, not physical-phone tests; they do not substitute for v0.6.0 validation.

## Four guests, three snowy nights

A blizzard closes the mountain road. Four guests arrive carrying the same invitation. The public report of a flood seven years ago says the warning sounded before the gate opened. Find original records and check that account. After three nights, decide where the evidence goes.

The story is structured as a **complete short narrative across three nights, four guests, a final decision and different endings**. It is not endless hotel management or combat progression. Reading has no countdown; the limited resource is your nightly actions.

## Getting started

The independent entry is `hotel.html`, not the original game’s `index.html`. For local play, open `hotel.html` with its accompanying scripts, styles and artwork kept together rather than copying the HTML alone. Use the [direct hotel entry](https://chenhaichao1231.github.io/neon-salvage/hotel.html) online; its v0.4.0 online loading check has passed. The original game and its entry remain available and are not overwritten by The Seventh Night Hotel.

Choose **Open the hotel door** to begin. A readable local save lets you continue your existing story. Use the top-right language control to switch between Chinese and English.

The interface is designed around **portrait-phone tapping and vertical scrolling**, with no keyboard, dragging or fast reflexes required. Three entries show one workspace at a time. Start in Current action, then switch when you want to inspect guest locations or compare records.

## Each night

### 1. Before nightfall: begin with the defaults

Default rooms and power are ready for the first investigation. You do not need to learn every setting first. Open Room setup when you want to make adjustments:

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

## v0.4.0: View evidence objects

Choose **View object** on a discovered evidence card to inspect CSS/SVG schematic recreations of five material types: the log, medical card, key comparison, borrowing book and tape. Undiscovered material has no entry. Players who have finished can inspect their collected evidence without clearing the save or starting again.

These are schematic recreations, not new hidden clues or pixel-hunting puzzles. All actual information comes from DOM text supplied by the current engine, with object state reflected in the current record. Evidence pairing keeps the existing reasoning mechanism. Viewing, testing a pair and closing the view cost no night action; no new puzzle rules are introduced.

**Historical v0.4.0 checks:** review, 5 object-view tests, 44 engine tests and UI tests passed. The deployed version was checked in a real online browser using a 360×640 QA viewport. An existing v0.3 company-spare-key publication ending restored correctly. All five material types opened; long English text displayed in full after switching languages. Close/return and Escape worked, and choice buttons were disabled after the ending. Paper and brass-key visuals were inspected; html/body width and scrollWidth both measured 360px, with no horizontal overflow. No physical-phone testing was performed, and the story was not replayed in full this round. The engine is unchanged; the two earlier v0.3 online playthrough records remain applicable.

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

**Historical v0.3.0 checks:** 44 engine tests and UI tests passed. In a real online browser at 360px width, a new story was played through all three nights using normal buttons, making the hearing-first promise and then publishing. The warning about breaking the promise was checked in Chinese and English; the publication ending delivered Xu’s refusal of further interviews. There was no horizontal overflow. Full text for selected records and expandable unselected evidence are covered by automated tests and were also seen online. The company spare-key route was also completed through normal buttons in the online browser at 360px, without asking Shen for a key. Corridor dialogue correctly recognized the company key, and the publication ending reflected Zhou’s handover responsibility. Both new routes have now been manually completed online. These were not physical-phone tests.

**Historical v0.2.0 checks:** 35 engine tests and UI tests covering two complete routes passed. In a real online browser at 360×640, a v0.1 Night One save was continued through the full publication route using normal buttons. Chinese and English reasoning, disabled submission without an explanation, free wrong-interpretation feedback, successful deductions and the alternative evidence chain were checked with no horizontal overflow. The cover loaded at 390px. The full online hearing playthrough remains the v0.1.1 run; v0.2.0 hearing-route automated tests passed. These were not physical-phone tests and do not establish manual coverage of every ending or long-term replay value.

## Next steps

The next focus is the first case’s play experience and easier onboarding for Case Two. This is not a promise to release a new chapter; reducing player burden remains the priority.

The next update is estimated for November 10, 2026, 21:00–22:00 Beijing time (UTC+8), not guaranteed; blockers take priority. Plan checked November 10, 2026, 19:40 Beijing time. v0.5.1 has completed the online checks described above.

The story concerns a past disaster, bereavement, responsibility and concealment, primarily through text. You may stop whenever you need to; reading itself carries no time pressure.
