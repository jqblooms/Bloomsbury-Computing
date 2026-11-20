# Data Bridge level packs

Rounds 1 to 10 are in `js/physics.js` (`LEVELS`). Rounds 11 to 60 come from five level packs, one file each, so
several people can add levels at once without touching the same file:

| Pack | File | Rounds | Band |
|---|---|---|---|
| 2 | `js/levels/pack-2.js` | 11 to 20 | Building up |
| 3 | `js/levels/pack-3.js` | 21 to 30 | Challenging |
| 4 | `js/levels/pack-4.js` | 31 to 40 | Hard |
| 5 | `js/levels/pack-5.js` | 41 to 50 | Very hard |
| 6 | `js/levels/pack-6.js` | 51 to 60 | Expert (the finale) |

Packs are added in order and stop at the first missing pack, so round numbers never shift. `index.html` loads
every pack file before `physics.js` (a missing file is skipped).

## Pack format

```js
(function (root) {
  'use strict';
  (root.BBLevelPacks = root.BBLevelPacks || {})[3] = {
    // T: cliffL(edge, top, face), cliffR(edge, top, face), DEEP, BACK, FAR, WORLD_W (32), Y_MIN (-11), Y_MAX (6), MAX_LEN (4.5)
    levels: function (T) { return [ /* 10 level objects, same fields as physics.js LEVELS */ ]; },
    // H: chain, warren, line, R ('road'), W ('wood'), S ('steel'). One beam list per level, in the same order.
    sound: function (H) { return [ /* a bridge that crosses inside the pool */ ]; },
    flimsy: function (H) { return [ /* a cheap or badly placed bridge that must fail */ ]; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
```

A level's `theme` is either a palette number (0 to 5, the palettes in `js/art.js`) or a whole palette object of
your own with the same keys as `PALS` in `js/art.js` (sky, glow, far, mid, haze, stream, metal, rock, led).

## Testing a pack

`BB_PACK=3 node tools/test_bridge_builder.mjs` tests pack 3 on its own, even if pack 2 is not written yet.
`node tools/test_bridge_builder.mjs` tests every round that is loaded. Every round must pass: anchors on the
terrain and on the grid, the truck starts on the ground, the sound bridge follows the build rules, crosses, peaks
under 0.85 of its limit (0.7 for rounds 1 to 10) and costs no more than the pool, the flimsy bridge breaks or falls, an empty board falls.

## Difficulty

Road is rated for the round's truck (physics.js bendScale, 2026-11-20): a road piece bends under a heavy truck no more than under a 4.5 t one, so 2-square road pieces and sloped roads work in every round; the truss still carries the full weight.

Rounds 1 to 10 for reference: truck 1.5 to 4.5 tonnes, spans 6 to 18, the sound bridge costs 0.66 to 0.75 of the
pool. A round's pool is what a student gets for full marks on that round's one exam question; a failed bridge keeps
at most one pool. Each band rises smoothly from the end of the band before it:

| Band | Truck (t) | Sound bridge cost / pool | What is new |
|---|---|---|---|
| 11 to 20 | 3.5 to 5 | 0.72 to 0.78 | combine round 1 to 10 ideas; two features per level |
| 21 to 30 | 4.5 to 6 | 0.78 to 0.83 | long spans, uneven sides, few anchors, steel needed in places |
| 31 to 40 | 5.5 to 7 | 0.83 to 0.88 | tight budgets, hanging and arch designs, several gaps |
| 41 to 50 | 6.5 to 8 | 0.88 to 0.92 | very few anchors, deep drops, mixed heights, little spare money |
| 51 to 60 | 7.5 to 9 | 0.92 to 0.95 | the hardest; round 60 is the finale |

If a heavier truck cannot be held at all with the materials, keep the truck lighter and make the round harder in
other ways (span, anchors, budget). The target is that each round is a little harder than the one before.
