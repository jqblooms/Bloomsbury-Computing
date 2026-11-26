# BridgeBuilder (Data Bridge): embed contract

Folder: `BridgeBuilder/` (entry `BridgeBuilder/index.html`). Shell registry id `bridge-builder` (Games, Years 7 to 11).

## Embed

`BridgeBuilder/index.html?embed=1&set=<setId>&goal=<n>&bcv=<build>`

- `set`: the default Exam Game topic (every topic from `shared/exam-game-questions.json` is still listed).
- `goal`: rounds to cross for the slide to count it finished (default 3).
- Reports `TT_CONTENT_HEIGHT` and `BC_APP_RESULT` (`questionId: data-bridge-<setId>`, `complete` once the best run crossed `goal` rounds).
- Full screen button; falls back to `BC_APP_FULLSCREEN` to the parent.

## Rules

- Questions and marking come from `shared/exam-game-client.js` exactly as in `TowerDefence/CONTRACT.md` (one-page round with `submitMany`, rids, Send again).
- Each round: ONE exam question (any number of marks, James 2026-11-19), answered in its exam-style answer spaces (shared/exam-question.js answerUI). The round pool (`LEVELS[n].pool` in `js/physics.js`) is split per mark; a second try pays half.
- Build, then Send the truck. A crossing keeps the leftover coins. Any snapped beam, a fall or a stuck truck keeps the same round: the failed bridge's coins are spent, the leftover is kept (capped at that round's pool), then a fresh exam round for that round (normal pool) and a rebuild.
- A reload during the drive finishes that test at once (the physics is deterministic), so it cannot dodge a failed round.
- After a question that did not get full marks: "I need help" under its feedback (shared/exam-help.js, Exam Game ops helpGet and help: the shell slide help, Haiku, 3 questions per question, never the answer). Not in teacher mode. The answer it sends is the last marked one (item.marked).
- Learn mode (James 2026-11-26): a Play / Learn choice on the start screen (remembered under `bc-databridge-v1:mode`). Learn shows a "Learn mode" tag in the HUD and the round head. Each question has "See a worked example" (Exam Game op `similar { setId, qid, skip }`: a similar but different question from the topic with its model answer and worked answer, never this question's own; "Show another example" passes the ones already shown) and the AI help (shared/exam-help.js) at any time, labelled free. Marks and coins work as in Play. After a question that did not get full marks and has no second try left, "Try a new question" swaps it for a fresh one in the same round; the new question pays only what the round's pool has left. Learn has its own save and best (`learn:` and `learnbest:` keys) and never sends `BC_APP_RESULT`, so it never finishes the slide.
- A combined topic (e.g. y10-unit3-1-practice, every Unit 3.1 exam topic) arrives from the questions file as qids; shared/exam-game-client.js fills in the questions, so the game treats it like any topic.
- Timers only, never `requestAnimationFrame`; nothing runs while the page is hidden. Saves per topic under `bc-databridge-v1:`.

## Physics and tests

`js/physics.js` has no DOM. XPBD beams (stiff springs), 24 substeps per 1/60 s frame, axial damping, a 2-wheel truck that
drives on Road beams only. Road beams also bend under a wheel (long road pieces need support). Run
`node tools/test_bridge_builder.mjs` after changing materials, levels or pools.
Testing hook: `window.__dataBridge.advance(frames)` runs the drive on when a hidden browser pane pauses the timer.

## Building

Press on a joint (a gold anchor or a point on the bridge), drag, release. The ghost beam shows its cost and length and turns red when it cannot go (too long, in the terrain, a duplicate, not enough coins); releasing there, or outside the board, cancels it with at most a one-line toast. Pointer events with pointer capture, so mouse, touch and pen work. Delete is a separate tool: tap a beam. In full screen the board keeps 16:9 and fits the window (backing store at devicePixelRatio).

## Teacher mode

Shift + D, E, V (within 2 s, never in a text field) unlocks it. Embedded, the page asks the shell (Exam Game op `whoami`, `isTeacherEmail_`); a student gets nothing at all. Standalone or `examStub=1` (nothing recorded) is always allowed. A Teacher mode bar: round picker (1 to 10, straight to building), coins box, +100, Full pool, Unlimited (cost shown, money check off), No game over (retry the same round without questions, bridge kept), Show test bridge (`js/solutions.js`, the bridges `tools/test_bridge_builder.mjs` proves), Exit. Questions are skipped. It plays on a separate in-memory state; the save, best, done and `BC_APP_RESULT` go through a guard that drops them while it is on (`js/teacher.js`, `node tools/test_bridge_teacher.mjs`).
