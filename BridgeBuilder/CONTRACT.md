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
- Each round: about 3 questions, at most 4 marks. The round pool (`LEVELS[n].pool` in `js/physics.js`) is split per mark; a second try pays half.
- Build, then Send the truck. A crossing keeps the leftover coins. Any snapped beam, a fall or a stuck truck is game over: round 1, 0 coins.
- A reload during the drive finishes that test at once (the physics is deterministic), so it cannot dodge a game over.
- Timers only, never `requestAnimationFrame`; nothing runs while the page is hidden. Saves per topic under `bc-databridge-v1:`.

## Physics and tests

`js/physics.js` has no DOM. XPBD beams (stiff springs), 24 substeps per 1/60 s frame, axial damping, a 2-wheel truck that
drives on Road beams only. Road beams also bend under a wheel (long road pieces need support). Run
`node tools/test_bridge_builder.mjs` after changing materials, levels or pools.
Testing hook: `window.__dataBridge.advance(frames)` runs the drive on when a hidden browser pane pauses the timer.
