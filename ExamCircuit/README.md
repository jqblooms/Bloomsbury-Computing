# Exam Circuit — build status

Full design: [`../GDD.md`](../GDD.md). This folder is the actual build, started per that
document once every Section 4 open question was resolved.

## What's here right now (first playable vertical slice)

- `index.html` — the board, camera, HUD, Signal economy, and proof modal.
- `proof-generators.js` — the generator/checker pairs (GDD Section 4, Open Question 3).
  Verified with an isolated Node harness (20,000 iterations x 4 generators, independent
  reference calculations, seed-replay check) before being wired into the UI.

**Deliberately in scope for this slice:**
- Two regions, IGCSE (0478) board only (Open Question 2): Topic 1.1 Number Systems (open from
  the start) and Topic 1.2 Data Representation (locked until 2 components are built in 1.1).
- **Region-unlock gating is real**, not a stub: `regionUnlocked()` checks the prerequisite
  region's built-pad count against a threshold, a locked region renders outline-only pads with
  no legend text and no click target (GDD Section 3.6, state 1), and crossing the threshold
  live fades the region in, lights its bridge trace, and shows a one-off "Region unlocked"
  banner — verified end to end in-browser (built 2 pads in 1.1, watched 1.2 unlock and become
  solvable, not just assumed from code).
- Seven generators total across both regions, covering both in-scope proof types — `resistor`
  (scaffolded numeric: binary↔denary, two's complement, image file size, ASCII→binary) and `ic`
  (short structured: binary→hex, sound file size).
- **Buy/sell of already-proven components is real**: the first copy of a component is the proof
  itself (per GDD Section 3.5, "prove it once, then buy more outright"); after that its pad
  shows an owned count and a `+1 (cost)` button, cost rising exponentially per copy owned
  (`round(6 x 1.6^owned)`, the same shape as Hex Machine's/Farmer's own cost curves, just
  gentler since this is a flat-rate unit). The buy button's afford/disable state re-checks
  every economy tick, not only on click, so it un-greys itself the moment enough Signal has
  accrued while idle — verified live (drained Signal below cost, watched it disable; let it
  accrue back past cost with no click, watched it re-enable on its own).
- Signal economy tick: every owned copy (not just every built pad) produces 0.5/s, so buying
  extra copies of an already-proven component measurably raises the rate.
- Pan/zoom/clamp camera, reused from `HexMachine/index.html`'s exact model.
- Correct-answer → build → wired-trace visual, wrong-answer → hint-only feedback (never the
  literal answer), both verified live in-browser, not just read from source.
- Attempt reporting, stubbed to `localStorage` in the exact shape the real sheet needs
  (`board, regionId, slotId, proofType, generatorSeed, params, answer, correct, attemptedAt`) —
  see the `reportAttempt()` comment in `index.html` for the exact `Progress.gs` wiring still
  needed before this can go live on the real site.

**Deliberately NOT built yet** (see GDD.md for why each is out of scope for this slice):
- Any region beyond 1.1/1.2 (1.3 onward) — the dependency graph exists but only has one edge.
- Selling components back, or a board-expansion cost curve for adding whole new regions.
- The Noise/interference pressure layer (`--fault` state, bug-wave equivalent).
- The Lower Secondary (0860) board (Open Question 2 — separate campaign, not started).
- Any `microcontroller` proofs; code-writing proofs are excluded entirely per Open Question 4.
- Real backend wiring (`Progress.gs` sheet, host-page identity bridging) — currently a
  localStorage stub only, since this prototype runs standalone with no Apps Script backend.
- Firebase leaderboard / Drive save-load (Section 6 shared infrastructure) — not started.

## How to test locally

This uses `fetch`-free `<script src>` loading, so it needs to be served over HTTP (not opened
as a `file://` page, which blocks pan/zoom-in-iframe testing conventions used elsewhere in this
project). Any static file server works, e.g.:

```bash
node -e "require('http').createServer((req,res)=>{const fs=require('fs'),path=require('path');let p=req.url==='/'?'/index.html':req.url;fs.readFile(path.join(process.cwd(),decodeURIComponent(p)),(e,d)=>{if(e){res.writeHead(404);res.end();return}res.writeHead(200);res.end(d)})}).listen(8934)"
```

then open `http://localhost:8934/index.html`.

## Next build step

With generate → prove → build → buy → passive income → region unlock all proven end to end, the
next slice should add the **Noise/interference pressure layer** (GDD Section 3.5's reskin of
Hex Machine's bug-wave defence) — the one mechanic in the core loop that's pure arcade pressure
rather than curriculum content, and the last piece needed before this stops feeling like a
static tree of buttons and starts feeling like the other three games.
