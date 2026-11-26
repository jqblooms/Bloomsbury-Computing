# BridgeBuilder3D (Data Bridge 3D): embed contract

Folder: `BridgeBuilder3D/` (entry `BridgeBuilder3D/index.html`). The site Data Bridge (`BridgeBuilder/`) as a single-player
3D game, ported from the party server's team game (Data Bridge 3D, `LobbyBridge3D.cs`). No server, no teams.

## Embed

`BridgeBuilder3D/index.html?embed=1&set=<setId>&goal=<n>&bcv=<build>` (or `&facts=<group or pack>` for a Fact Chain topic)

- `set`, `facts`, `goal`: as in `BridgeBuilder/CONTRACT.md` (default topic, Fact Chain topic, rounds to cross; goal default 3).
- Reports `TT_CONTENT_HEIGHT` (640, the 3D apps' height) and `BC_APP_RESULT` (`questionId: data-bridge-3d-<setId>`, colons
  as dashes; `complete` once the best run crossed `goal` rounds). Learn mode never sends it.
- Full screen button: sends `BC_APP_FULLSCREEN` to the parent and follows `BC_APP_FULLSCREEN_STATE`.
- `bcv` goes on every script and style URL; the import map gives every module (and three.js) its `?v=` too.
- `examStub=1`: the ExamGame stub (local tests, nothing recorded), as in the site.

## Shared files (never copied)

Loaded from the site so they stay in sync: `../BridgeBuilder/js/levels/pack-*.js`, `physics.js`, `art.js`, `solutions.js`
(test hook only), `facts.js`, `../BridgeBuilder/style.css` (card, question and fact styles), `../FactChain/packs/index.js`,
`../FactChain/js/logic.js`, `../FactChain/js/rounds.js`, `../Drills/ai-check.js`, and `../shared/` exam-game-client,
answer-box, exam-question, exam-help, bc-clicker, bc-theme.css. `lib/` holds three.js r170 and blob.js (the avatar) from
NetLab3D.

## Rules

- Rounds, coins and wording are the site Data Bridge's (`BridgeBuilder/js/game.js`, ported in `js/rounds.js`): one exam
  question a round through `ExamGame.next` / `submitMany`, the pool split per mark, a second try pays half, I need help
  after a mistake; Learn mode (worked example, free help, Try a new question, own save and best); Fact Chain rounds through
  `BBFacts.start(ctx, topic)`, redo until clean, only a clean pass builds. Coins, never baht.
- Each gap: question (side panel) -> build in 3D (`js/build3d.js`, the site's `Ph.beamProblem` and costs) -> Send the cart
  -> ALL ABOARD (10 s, cut to 3 s once you stand in the cart; at 0 you are put in the cart) -> ride. With no beams and fewer
  than 3 coins, Send gives a new question instead.
- The ride (`js/ride.js`): a traffic light, GREEN relax, AMBER a bump is coming, RED hold Space. Not holding at a bump
  throws you off: that costs `Penalty(pool)` = pool x 10% to the nearest 5, at least 10. Holding on over a crossing pays
  `HoldBonus(pool)` = half the penalty to the nearest 5, at least 5 (the party server's numbers).
- The result: the site's `Ph.afterTest` (cross: pay the bridge, keep the rest, next round; fail: same round, coins capped
  at the pool, a new question), then the ride rule above. The page decides it (the physics is deterministic).
- A reload during the ride finishes it at once and counts as falling off. A reload during ALL ABOARD goes back to building.
- Game logic and timers run on `setInterval` and pause while the page is hidden; `requestAnimationFrame` only draws and
  walks the player (the site preloads apps in a hidden iframe where it never fires).
- Saves per topic under `bc-databridge3d-v1:` (`game:`, `learn:`, `best:`, `learnbest:`, `done:`, `mode`). Separate from
  the 2D game's saves.
- Keys: W A S D walk, Shift or J hop, B build, E use, Space hold on, Q and R turn. Game keys are ignored while typing.
  PageUp and PageDown are left to the classroom clicker.

## Not in this version

No teacher mode (Shift + D, E, V) and no touch controls for walking (a mouse can build, press Hop in and hold the left
button to grip).

## Testing hook

`window.__dataBridge3d`: `state()`, `build(list)` (adds `[x1, y1, x2, y2, mat]` beams, e.g. `BBSolutions.sound[n]`),
`send()`, `hopIn()`.
