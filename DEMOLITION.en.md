# Demolition Expert · Single-level demo

**The demo is live and has passed this round of browser checks.** The entry is `demolition.html`. This is one quickly retryable demolition level, not a complete level pack.

**Release verification:** revision `f1ebe7ec0247c21abb5c556152d15280a6a16447`. A real browser at approximately 1200×789 verified a single-charge failure (13 pieces still high, two workshop contacts), followed by clearing the plan and successfully rebuilding it. Chinese/English switching and retrying with the plan retained also passed. This was not physical-phone testing or manual coverage of every placement.

## Goal and controls

Place up to **three targeted cutting charges**. Bring every surviving piece below the dashed height line and let it settle, with **zero contact** inside the workshop on the right. Debris counts too; lowering the building alone does not guarantee success.

1. Click a structural piece to place a charge. Check its target and the remaining budget. Adjust or remove charges during planning; placement does not detonate them.
2. Deliberately detonate your plan. Charges remove their selected pieces, sever attached links and apply finite local impulses.
3. Watch the collapse and result. Inspect pieces still too high or those that hit the workshop, then revise your plan and retry.

There is no separate directional-push tool or hidden single-pixel solution. This guide does not reveal test solutions.

## Success is not a momentary crossing

The target line is at world y=440, with a 2-pixel display tolerance. Every surviving piece must clear the target height, the workshop must remain untouched, and the scene must stay settled for more than 1.1 seconds. The simulation runs for at least two seconds; reaching the 14-second limit without settling does not award success. Feedback distinguishes protection damage, material still too high and an unsettled scene.

## Physics and scope

This is a simplified model: rectangular pieces **do not rotate**. Distance links hold the structure together, excessive strain can break them, and impacts can cause local fractures. Pieces collide with the ground, shield wall and each other. This is not a building-engineering or real demolition-safety simulator.

Independent automated checks found multiple successful placements and demonstrated failures from incomplete clearance and workshop impacts. Representative plans reproduce across different caller frame steps. That does not establish that players can predict outcomes or that the game is fun. The browser checks below cover targeting, failure/success feedback and retry; broader usability still needs player feedback.

Desktop landscape is the priority, not a portrait-phone restriction. Touch layouts and usability need separate checks. No installation or server connection is needed to simulate this level.

## Existing games and next steps

The hotel remains at `hotel.html`, and the original space game at `index.html`. Their saves are not replaced by the demolition demo.

The next progress update is estimated for **November 10, 2026, 21:00–22:00 Beijing time (UTC+8)**. Verification determines release timing. The next iteration prioritizes a desktop layout that keeps the playfield and controls on one screen, avoiding scroll jumps during clicks, plus clearer controls. These improvements are not yet verified; no extra levels or complete game are promised within that window.
