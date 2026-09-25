'use strict';

// ============================================================
// MACHINE TUTORIALS - self-contained, independent of Lesson Missions
// ============================================================
// Teaches real Cambridge Pseudocode syntax by having the student build an actual automated
// machine. Each tutorial runs in its own fresh, disposable practice world (see the TUTORIAL
// SANDBOX section below: enterTutorialSandbox/exitTutorialSandbox) sized exactly for what
// that tutorial needs, rather than the student's real free-play farm - so a tutorial's
// requirements can never clash with state an earlier tutorial or free play left behind. It
// shares no state, functions, or storage key with lessonMissionMode above. Modeled on
// PyScratch's own tutorial mode
// (assets/js/pyscratch.js: TUTORIALS array, inline tutorial bar, per-step
// requires checklist, resumable progress) but adapted to this game's real
// compiled-instruction model instead of raw text matching - a step's
// `requires` are checked against compile()'s own instruction list, so
// "did the student write a real CALL Buy(...)" is a structural fact, not
// a fragile text guess that could be fooled by a comment or a string.
//
// A step is one of two shapes:
//   - static: requires only (Next button enables once they're all met, the
//     student clicks Next themselves - e.g. "add this CALL, then continue").
//   - action-gated (`action: 'run'|'machine'`): Next stays disabled; the
//     step only advances by piggybacking on the REAL run-btn/machine-btn
//     click handlers below (same non-invasive multi-listener pattern the
//     lesson-mission watcher already uses on runBtn), so "press Run" in the
//     tutorial always means the student's code actually ran for real.
//
// Extending this: add another entry to TUTORIALS with its own `steps`
// array - the engine below is generic and doesn't hardcode anything about
// the first-machine tutorial specifically.
var TUTORIALS = [
  {
    id: 'basic-auto-farm',
    title: 'Basic Auto-Farm',
    color: '#4c8bf5',
    // A CALL Buy(...) pays CODE_BUY_DISCOUNT (80%) of the 5c shop price -
    // 4c a seed, not the shop's sticker price. Money carries over between
    // steps within a tutorial (the sandbox only resets once, on entering
    // the whole tutorial - see resetTutorialWorld), so step 3's real CALL
    // Buy already spends one seed's worth before step 4 even starts: 35 -
    // 4 (step 3's Buy) - 30 (the machine itself) left exactly 1c, not
    // enough for the freshly placed machine's own first-tick CALL Buy (4c)
    // - it never got to plant automatically even once, defeating the
    // entire point of the tutorial. This machine always targets the exact
    // same tile (SetPosition(1, 0), no HasCrop check), so once it plants
    // there successfully that tile stays occupied forever and extra money
    // beyond one more buy-plant cycle doesn't buy it anything further -
    // 50 just needs to comfortably clear 4 (step 3) + 30 (machine) + 4
    // (the machine's own first buy) with real margin, not chase cycles
    // that can't happen anyway.
    minMoney: 50,
    desc: 'Build a machine that buys and plants a seed on its own, forever - no clicking required.',
    steps: [
      {
        title: 'Buy a seed',
        text: 'Let\'s build a machine that plants Carrots for you automatically. First, get it a seed to plant - running a built-in action is called a <strong>procedure call</strong>, written <code>CALL Name(...)</code>. Type this in the Code Box:',
        target: 'CALL Buy("Carrot")',
        newLines: ['CALL Buy("Carrot")'],
        requires: [{ name: 'Buy' }]
      },
      {
        title: 'Move with SetPosition',
        text: 'Add a second CALL to jump to tile (1, 0) - counted from home: first number right/left, second number up/down. The glowing ring on the field shows exactly which tile that is.',
        target: 'CALL Buy("Carrot")\nCALL SetPosition(1, 0)',
        newLines: ['CALL SetPosition(1, 0)'],
        requires: [{ name: 'Buy' }, { name: 'SetPosition' }],
        highlightTiles: function () { return [{ x: playerCursor.homeX + 1, z: playerCursor.homeZ }]; }
      },
      {
        title: 'Plant it, then Run',
        text: 'Add a third CALL to plant the Carrot you just bought.',
        target: 'CALL Buy("Carrot")\nCALL SetPosition(1, 0)\nCALL Plant("Carrot")',
        newLines: ['CALL Plant("Carrot")'],
        requires: [{ name: 'Buy' }, { name: 'SetPosition' }, { name: 'Plant' }],
        action: 'run',
        actionHint: 'All three lines are there - press Run below to try your sequence for real.',
        highlightTiles: function () { return [{ x: playerCursor.homeX + 1, z: playerCursor.homeZ }]; }
      },
      {
        title: 'Turn it into a machine',
        text: 'Your sequence works once. A <strong>machine</strong> repeats it forever, automatically - but it needs an empty tile to stand on, and you\'re currently standing right on the Carrot you just planted. <strong>Click the glowing tile</strong> to walk there - it\'s clear of the Carrot and has open space of its own to the right. Then type the same three lines again and press <strong>Place Machine</strong> instead of Run:',
        target: 'CALL Buy("Carrot")\nCALL SetPosition(1, 0)\nCALL Plant("Carrot")',
        newLines: ['CALL Buy("Carrot")', 'CALL SetPosition(1, 0)', 'CALL Plant("Carrot")'],
        requires: [{ name: 'Buy' }, { name: 'SetPosition' }, { name: 'Plant' }],
        action: 'machine',
        actionHint: 'Move off the Carrot\'s tile onto the glowing one, then press Place Machine below - not Run this time.',
        highlightTiles: function () { return [{ x: playerCursor.homeX - 2, z: playerCursor.homeZ }]; }
      }
    ]
  },
  {
    id: 'strip-farm',
    title: 'Strip Farm',
    color: '#a3711f',
    // Both steps are real Runs and money carries over between them (the
    // sandbox resets only once, at tutorial start) - step 1 buys 3 seeds
    // and step 2 buys 3 more, 6 real CALL Buys at the actual 4c
    // code-discount rate = 24c minimum. The original 25 technically
    // covered that (with exactly 1c to spare - no room for the "Try it"
    // TO 4 challenge, or any margin for error), so 30 gives a genuine
    // safety buffer instead of a razor-thin one.
    minMoney: 30,
    desc: 'Plant a whole row of Carrots in one go, instead of typing the same three lines over and over.',
    steps: [
      {
        title: 'Buy a stack of seeds',
        text: 'To plant a whole strip of tiles, you\'ll need several seeds at once. A <strong>FOR</strong> loop repeats a known number of times - use it instead of WHILE when you already know the count. No colon, no "DO", and it ends with <code>NEXT</code> followed by the same variable name, not <code>ENDFOR</code>. <code>Step</code> counts 1, 2, 3 in turn as the loop runs. Cambridge pseudocode <strong>declares</strong> every variable before using it, so the counter gets a <code>DECLARE</code> line first:',
        target: 'DECLARE Step : INTEGER\nFOR Step <- 1 TO 3\n    CALL Buy("Carrot")\nNEXT Step',
        newLines: ['DECLARE Step : INTEGER', 'FOR Step <- 1 TO 3', '    CALL Buy("Carrot")', 'NEXT Step'],
        requires: [{ type: 'DECLARE' }, { type: 'FOR' }, { name: 'Buy' }],
        action: 'run',
        actionHint: 'Press Run - check the console for three separate purchase messages, not one.'
      },
      {
        title: 'Plant the whole strip',
        text: 'The loop variable is a real number you can use anywhere - including inside <code>SetPosition</code>. Rewrite it to plant three Carrots in a row in one go, one tile further along each time:',
        target: 'DECLARE Step : INTEGER\nFOR Step <- 0 TO 2\n    CALL SetPosition(Step, 0)\n    CALL Buy("Carrot")\n    CALL Plant("Carrot")\nNEXT Step',
        newLines: ['DECLARE Step : INTEGER', 'FOR Step <- 0 TO 2', '    CALL SetPosition(Step, 0)', '    CALL Buy("Carrot")', '    CALL Plant("Carrot")', 'NEXT Step'],
        requires: [{ type: 'DECLARE' }, { type: 'FOR' }, { name: 'SetPosition' }, { name: 'Buy' }, { name: 'Plant' }],
        action: 'run',
        actionHint: 'Press Run - three Carrots should appear across three tiles, not just one.'
      },
      {
        title: 'Try it',
        text: 'A machine re-runs its whole program every tick anyway, so FOR doesn\'t help it repeat faster - its value is doing many things in a single Run, like planting a whole row at once instead of writing the same three lines three times.<br><br><strong>Challenge:</strong> change <code>TO 2</code> to <code>TO 4</code> to plant five Carrots in a row instead of three.',
        starter: null, target: null, newLines: [], requires: []
      }
    ]
  },
  {
    id: 'grid-farm',
    title: 'Grid Farm',
    color: '#0e8a8a',
    // Step 1's real Run buys 6 seeds (2 rows x 3 cols) at the actual 4c
    // code-discount rate = 24c minimum. The original 25 technically
    // covered that (with exactly 1c to spare), so 30 gives a genuine
    // safety buffer instead of a razor-thin one.
    minMoney: 30,
    desc: 'Plant a whole rectangle of Carrots at once - rows and columns, not just a single strip.',
    steps: [
      {
        title: 'A loop inside a loop',
        text: 'A Strip Farm plants one row. A Grid Farm plants several rows at once, by putting one FOR loop <strong>inside</strong> another. The inner loop (<code>Col</code>) runs all the way through for every single step of the outer loop (<code>Row</code>) - so for 2 rows of 3, the inner loop runs 3 times, twice over, planting 6 Carrots in total. Indent the inner loop one level further so it\'s clearly nested:',
        target: 'DECLARE Row : INTEGER\nDECLARE Col : INTEGER\nFOR Row <- 0 TO 1\n    FOR Col <- 0 TO 2\n        CALL SetPosition(Col, Row)\n        CALL Buy("Carrot")\n        CALL Plant("Carrot")\n    NEXT Col\nNEXT Row',
        newLines: ['DECLARE Row : INTEGER', 'DECLARE Col : INTEGER', 'FOR Row <- 0 TO 1', '    FOR Col <- 0 TO 2', '        CALL SetPosition(Col, Row)', '        CALL Buy("Carrot")', '        CALL Plant("Carrot")', '    NEXT Col', 'NEXT Row'],
        requires: [{ type: 'DECLARE' }, { type: 'FOR' }, { name: 'SetPosition' }, { name: 'Buy' }, { name: 'Plant' }],
        action: 'run',
        actionHint: 'Press Run - six Carrots should appear in a 3-wide, 2-deep block, not just a single row.'
      },
      {
        title: 'Try it',
        text: 'Nesting works for any two loops, not just two FOR loops - the same idea lets you combine any of the building blocks you\'ve learned so far.<br><br><strong>Challenge:</strong> change the outer loop to <code>FOR Row &lt;- 0 TO 2</code> to plant a 3x3 grid of nine Carrots instead of six.',
        starter: null, target: null, newLines: [], requires: []
      }
    ]
  },
  {
    id: 'stock-up-run',
    title: 'Stock-Up Run',
    color: '#2e8b57',
    // WHILE Money() >= 5 DO checks the shop's 5c sticker price, but a CALL
    // Buy only actually spends 4c (the code discount) each time round. At
    // 5 starting coins the loop can only ever fire once (5 -> 1, then 1 >=
    // 5 is false) - but this step's own actionHint promises "several
    // purchases... not just one." 20 buys 4 times in a row (20 -> 16 -> 12
    // -> 8 -> 4, then 4 >= 5 stops it), a real "several" to watch.
    minMoney: 20,
    desc: 'Buy as many seeds as you can afford in one go, instead of clicking Buy over and over.',
    steps: [
      {
        title: 'Buy until you\'re out of money',
        text: 'Before a big planting session, it\'s handy to stock up on seeds in one move. A <strong>WHILE</strong> loop repeats its lines for as long as the condition stays true - useful when you don\'t know in advance how many times you\'ll need to repeat. It ends with <code>ENDWHILE</code>. Type this to keep buying Carrots for as long as you can afford one:',
        target: 'WHILE Money() >= 5 DO\n    CALL Buy("Carrot")\nENDWHILE',
        newLines: ['WHILE Money() >= 5 DO', '    CALL Buy("Carrot")', 'ENDWHILE'],
        requires: [{ type: 'WHILE' }, { name: 'Buy' }],
        action: 'run',
        actionHint: 'Press Run - watch the console log several purchases in a row, not just one.'
      },
      {
        title: 'Try it',
        text: 'A machine already re-runs its whole program every tick on its own, so it doesn\'t need a WHILE loop wrapped around a single CALL to repeat things - the loop\'s real value is inside <strong>one</strong> run or tick, when you don\'t know in advance how many times you\'ll need to repeat something.<br><br><strong>Challenge:</strong> try changing the condition to <code>WHILE Money() >= 5 AND SeedCount("Carrot") &lt; 3 DO</code> - now it stops early on its own once you own 3 seeds, even if you can still afford more.',
        starter: null, target: null, newLines: [], requires: []
      }
    ]
  },
  {
    id: 'farm-planner',
    title: 'Farm Planner',
    color: '#7c5fcf',
    minMoney: 15, // step 2 buys 3 seeds, ~4c each
    desc: 'Work out costs and totals before you commit real coins - a running tally that updates as you go.',
    steps: [
      {
        title: 'Keep a running number',
        text: 'Before spending real coins, it helps to work out costs on paper first. A <strong>variable</strong> stores a value under a name you choose. Cambridge Pseudocode <strong>declares</strong> a variable with its data type before using it (<code>DECLARE Total : INTEGER</code>), assigns with <code>&lt;-</code>, never <code>=</code>, and <code>OUTPUT</code> prints a value to the console below, so you can see what\'s stored:',
        target: 'DECLARE Total : INTEGER\nTotal <- 0\nOUTPUT Total',
        newLines: ['DECLARE Total : INTEGER', 'Total <- 0', 'OUTPUT Total'],
        requires: [{ type: 'DECLARE' }, { type: 'ASSIGN' }, { type: 'OUTPUT' }],
        action: 'run',
        actionHint: 'Press Run - the console should print 0.'
      },
      {
        title: 'Total up a whole strip farm\'s cost',
        text: 'A variable keeps its value until you change it, even across several lines or loop repeats. Work out the total cost of a 3-seed Strip Farm before you build one, updating the running total once per loop:',
        target: 'DECLARE Total : INTEGER\nDECLARE Step : INTEGER\nTotal <- 0\nFOR Step <- 1 TO 3\n    CALL Buy("Carrot")\n    Total <- Total + 5\nNEXT Step\nOUTPUT Total',
        newLines: ['DECLARE Total : INTEGER', 'DECLARE Step : INTEGER', 'Total <- 0', 'FOR Step <- 1 TO 3', '    CALL Buy("Carrot")', '    Total <- Total + 5', 'NEXT Step', 'OUTPUT Total'],
        requires: [{ type: 'DECLARE' }, { type: 'ASSIGN' }, { type: 'FOR' }, { name: 'Buy' }, { type: 'OUTPUT' }],
        action: 'run',
        actionHint: 'Press Run - the console should print 15 (3 loops of 5), not 0 or 5.'
      }
    ]
  },
  {
    id: 'smart-auto-farm',
    title: 'Smart Auto-Farm',
    color: '#d9534f',
    minMoney: 40, // up to two seed purchases plus a Level 1 machine, worst case
    desc: 'A machine that thinks before it acts - plants if it has a seed, buys one if it doesn\'t.',
    steps: [
      {
        title: 'Only buy if you can afford it',
        text: 'A basic auto-farm always tries to buy, even with no money. Let\'s make it check first. An <strong>IF</strong> block runs its lines only when the condition is true. Cambridge Pseudocode has no colon and no "DO" on an IF - it ends with <code>ENDIF</code>. <code>Money()</code> is a <strong>function</strong> (it gives back a value), so unlike <code>CALL</code>, it\'s never written with CALL in front. Type this:',
        target: 'IF Money() >= 5 THEN\n    CALL Buy("Carrot")\nENDIF',
        newLines: ['IF Money() >= 5 THEN', '    CALL Buy("Carrot")', 'ENDIF'],
        requires: [{ type: 'IF' }, { name: 'Buy' }]
      },
      {
        title: 'Plant if you can, buy if you can\'t',
        text: 'Now make it choose between two actions instead of just skipping one. An <strong>ELSE</strong> branch runs instead, when the condition is false. Rewrite it to plant a Carrot if you already own a seed, or buy one if you don\'t - <code>SeedCount("Carrot")</code> is another function, so no CALL:',
        target: 'IF SeedCount("Carrot") > 0 THEN\n    CALL Plant("Carrot")\nELSE\n    CALL Buy("Carrot")\nENDIF',
        newLines: ['IF SeedCount("Carrot") > 0 THEN', '    CALL Plant("Carrot")', 'ELSE', '    CALL Buy("Carrot")', 'ENDIF'],
        requires: [{ type: 'IF' }, { type: 'ELSE' }, { name: 'Plant' }, { name: 'Buy' }],
        action: 'run',
        actionHint: 'You don\'t own a Carrot seed yet, so this should take the ELSE branch and buy one - press Run to check.'
      },
      {
        title: 'A machine with a brain',
        text: 'Two changes before this becomes a machine. First: a machine\'s own home tile always has "a machine standing on it" (itself!), so it can never plant there - add <code>CALL SetPosition(1, 0)</code> to step off home first. Second: once it plants a Carrot, that tile stays occupied while it grows - so also check the tile is empty with <code>AND NOT HasCrop()</code>, or it\'ll keep trying to replant the same spot every tick. Combine two conditions with <code>AND</code> like this:',
        target: 'CALL SetPosition(1, 0)\nIF SeedCount("Carrot") > 0 AND NOT HasCrop() THEN\n    CALL Plant("Carrot")\nELSE\n    CALL Buy("Carrot")\nENDIF',
        newLines: ['CALL SetPosition(1, 0)', 'IF SeedCount("Carrot") > 0 AND NOT HasCrop() THEN', '    CALL Plant("Carrot")', 'ELSE', '    CALL Buy("Carrot")', 'ENDIF'],
        requires: [{ name: 'SetPosition' }, { type: 'IF' }, { type: 'ELSE' }, { name: 'Plant' }, { name: 'Buy' }],
        action: 'machine',
        actionHint: 'Press Place Machine below - not Run this time. Leave at least one open tile to your right for SetPosition(1, 0) to land on (the glowing ring shows where that\'ll be once you place). Done another tutorial already? If it says the tile is taken or too expensive, move to open ground (or wait for more coins) and try again.',
        highlightTiles: function () { return [{ x: playerCursor.x + 1, z: playerCursor.z }]; }
      }
    ]
  },
  {
    id: 'full-cycle-farm',
    title: 'Full-Cycle Farm',
    color: '#c2185b',
    minMoney: 35, // a Level 1 machine (30c) plus its first seed (~4c)
    desc: 'The complete loop: sells when ready, plants when empty, buys when out of seeds - fully self-sustaining.',
    steps: [
      {
        title: 'Sell, plant, or buy - all in one machine',
        text: 'Your Smart Auto-Farm plants and buys, but never sells - crops just pile up. A Full-Cycle Farm checks three things in order: is there something ready to harvest? If so, sell it. If not, do you own a seed? Plant it. Otherwise, buy one. Nest an IF inside an ELSE to check a third possibility - <code>HasCrop()</code> is true the moment anything is planted there, ready or not, so <code>CALL Sell()</code> simply does nothing yet if it\'s still growing:',
        target: 'CALL SetPosition(1, 0)\nIF HasCrop() THEN\n    CALL Sell()\nELSE\n    IF SeedCount("Carrot") > 0 THEN\n        CALL Plant("Carrot")\n    ELSE\n        CALL Buy("Carrot")\n    ENDIF\nENDIF',
        newLines: ['CALL SetPosition(1, 0)', 'IF HasCrop() THEN', '    CALL Sell()', 'ELSE', '    IF SeedCount("Carrot") > 0 THEN', '        CALL Plant("Carrot")', '    ELSE', '        CALL Buy("Carrot")', '    ENDIF', 'ENDIF'],
        requires: [{ name: 'SetPosition' }, { type: 'IF' }, { type: 'ELSE' }, { name: 'Sell' }, { name: 'Plant' }, { name: 'Buy' }],
        action: 'machine',
        actionHint: 'Press Place Machine below - watch it buy, then plant, then wait, then finally sell once the Carrot is ready. Leave at least one open tile to your right for SetPosition(1, 0) - the glowing ring shows where that\'ll be. If placement fails, move to open ground and try again.',
        highlightTiles: function () { return [{ x: playerCursor.x + 1, z: playerCursor.z }]; }
      },
      {
        title: 'Try it',
        text: 'This machine never runs out of seeds and never leaves a harvest unsold - buy, plant, wait, sell, repeat, entirely on its own.<br><br><strong>Challenge:</strong> place a second one at a different tile, so two Full-Cycle Farms run side by side.',
        starter: null, target: null, newLines: [], requires: []
      }
    ]
  },
  {
    id: 'array-farm',
    title: 'Array Farm',
    color: '#e07b39',
    // Step 2's real Run buys 2 seeds at the actual 4c code-discount rate
    // (8c), then step 3 places a 30c machine - 40 - 8 - 30 left exactly
    // 2c, not enough for the freshly placed machine's own first-tick CALL
    // Buy (4c) for either array spot, and this machine (unlike
    // Smart/Full-Cycle Farm) has no IF check to skip a buy it can't
    // afford - it just fails loudly forever, never planting either spot
    // even once. It also always targets the same two array spots with no
    // HasCrop check, so once both are planted they stay occupied and
    // further money doesn't buy more successful cycles - 60 just needs
    // real margin over 8 (step 2) + 30 (machine) + 8 (the machine's own
    // first full pass), not to fund cycles that can't happen anyway.
    minMoney: 60,
    desc: 'Store a list of exact spots to farm, then visit every one of them with a single loop.',
    steps: [
      {
        title: 'Store a list of spots',
        text: 'A Strip Farm and a Grid Farm both farm a fixed, computed pattern - every tile in a line or a rectangle. An <strong>array</strong> stores a whole list of values under one name, so you can farm any set of spots you choose instead. Declare each array with its size (<code>ARRAY[1:2]</code> means positions 1 to 2) and the type of thing it holds, then store two chosen spots\' coordinates, one number per array using an index in square brackets, starting at 1:',
        target: 'DECLARE Xs : ARRAY[1:2] OF INTEGER\nDECLARE Zs : ARRAY[1:2] OF INTEGER\nXs[1] <- 0\nXs[2] <- 2\nZs[1] <- 1\nZs[2] <- 0',
        newLines: ['DECLARE Xs : ARRAY[1:2] OF INTEGER', 'DECLARE Zs : ARRAY[1:2] OF INTEGER', 'Xs[1] <- 0', 'Xs[2] <- 2', 'Zs[1] <- 1', 'Zs[2] <- 0'],
        requires: [{ type: 'DECLARE' }, { type: 'ASSIGN_INDEX' }]
      },
      {
        title: 'Visit every spot with one loop',
        text: 'Read a value back out of an array the same way - name, then the index in brackets. Loop over both arrays at once with <code>i</code> as the shared index, so one small loop visits every spot you stored, however many there are:',
        target: 'DECLARE Xs : ARRAY[1:2] OF INTEGER\nDECLARE Zs : ARRAY[1:2] OF INTEGER\nDECLARE i : INTEGER\nXs[1] <- 0\nXs[2] <- 2\nZs[1] <- 1\nZs[2] <- 0\nFOR i <- 1 TO 2\n    CALL SetPosition(Xs[i], Zs[i])\n    CALL Buy("Carrot")\n    CALL Plant("Carrot")\nNEXT i',
        newLines: ['DECLARE i : INTEGER', 'FOR i <- 1 TO 2', '    CALL SetPosition(Xs[i], Zs[i])', '    CALL Buy("Carrot")', '    CALL Plant("Carrot")', 'NEXT i'],
        requires: [{ type: 'DECLARE' }, { type: 'ASSIGN_INDEX' }, { type: 'FOR' }, { name: 'SetPosition' }, { name: 'Buy' }, { name: 'Plant' }],
        action: 'run',
        actionHint: 'Press Run - two Carrots should appear at the two stored spots (glowing) - not a computed line or block.',
        highlightTiles: function () { return [{ x: playerCursor.homeX, z: playerCursor.homeZ + 1 }, { x: playerCursor.homeX + 2, z: playerCursor.homeZ }]; }
      },
      {
        title: 'A machine with a list',
        text: 'Place the same code as a machine. Every tick it re-reads the same two arrays and visits the same chosen spots, forever - a genuinely custom farm shape, not a fixed strip or grid. Click the glowing tile to move there first - it\'s clear of the two Carrots from the last step, with open field in the direction this machine\'s own spots are measured:',
        target: 'DECLARE Xs : ARRAY[1:2] OF INTEGER\nDECLARE Zs : ARRAY[1:2] OF INTEGER\nDECLARE i : INTEGER\nXs[1] <- 0\nXs[2] <- 2\nZs[1] <- 1\nZs[2] <- 0\nFOR i <- 1 TO 2\n    CALL SetPosition(Xs[i], Zs[i])\n    CALL Buy("Carrot")\n    CALL Plant("Carrot")\nNEXT i',
        newLines: [],
        requires: [{ type: 'DECLARE' }, { type: 'ASSIGN_INDEX' }, { type: 'FOR' }, { name: 'SetPosition' }, { name: 'Buy' }, { name: 'Plant' }],
        action: 'machine',
        actionHint: 'Move to the glowing tile, then press Place Machine below - not Run this time. This machine\'s spots are 2 tiles to the right and 1 tile up from wherever you place it, so it needs that much open field. If it fails, move to open ground (or wait for more coins) and try again.',
        highlightTiles: function () { return [{ x: playerCursor.homeX - 3, z: playerCursor.homeZ - 2 }]; }
      },
      {
        title: 'Try it',
        text: 'Arrays plus a loop can visit any set of spots you choose, in one go - the shape lives entirely in the numbers you store, not in the code.<br><br><strong>Challenge:</strong> add a third spot to both arrays - make them <code>ARRAY[1:3]</code>, store a third pair of coordinates, and change TO 2 to TO 3.',
        starter: null, target: null, newLines: [], requires: []
      }
    ]
  }
];

var TUT_STORAGE_KEY = 'pseudocodeFarmerTutorialProgress_v1';
var tutState = (function () {
  try { return JSON.parse(localStorage.getItem(TUT_STORAGE_KEY) || '{}'); } catch (e) { return {}; }
})();
function saveTutorialProgress() {
  try { localStorage.setItem(TUT_STORAGE_KEY, JSON.stringify(tutState)); } catch (e) {}
}
var activeTutorial = null; // { tutIdx, stepIdx }
// Set on every keystroke by renderTutorialChecklist(). The run-btn/machine-btn listeners
// below read this instead of re-compiling codeInput.value themselves, because
// machineBtn's own (earlier-registered) handler clears codeInput.value synchronously the
// moment it succeeds - by the time a second, later-registered listener on the same click
// runs, the editor is already empty, so re-checking "did they type the right thing" from
// codeInput.value at that point would always fail. This cached flag is the last known-good
// answer from while the student was still typing.
var lastTutorialReqsOk = false;
// Baseline machine count captured the moment an action:'machine' step is first shown (see
// renderTutorialStep). Comparing against THIS, not a fixed 0, is what makes placement
// detection correct once a student has done more than one tutorial in the same session -
// a previous tutorial's machine is already sitting on the field, so "machines.length > 0"
// alone can never tell a genuinely new placement apart from one that already existed.
var tutorialMachineBaseline = 0;

function tutorialCompileQuiet(source) {
  try { return compile(source || ''); } catch (e) { return null; }
}
// A requirement is either { name: 'Buy' } (a real CALL Buy(...) exists anywhere in the
// compiled program) or { type: 'IF' | 'ELSE' | 'WHILE' | 'FOR' } (that control-flow
// instruction exists anywhere). Deliberately NOT scoped to "is the CALL inside the right
// IF block" (unlike PyScratch's own block-context check) - a real structural fact either
// way, just a coarser one; tightening this to proper nesting is future work, not needed
// for these tutorials to correctly teach the syntax.
function tutorialRequirementMet(program, req) {
  if (req.type) return program.some(function (instr) { return instr.type === req.type; });
  return program.some(function (instr) { return instr.type === 'CALL' && instr.name === req.name; });
}
function tutorialRequirementLabel(req) {
  if (req.type === 'IF') return 'IF ... THEN';
  if (req.type === 'ELSE') return 'ELSE';
  if (req.type === 'WHILE') return 'WHILE ... DO';
  if (req.type === 'FOR') return 'FOR ... TO ... NEXT';
  if (req.type === 'DECLARE') return 'DECLARE ... : INTEGER';
  if (req.type === 'ASSIGN') return 'a variable, e.g. Total <- 0';
  if (req.type === 'ASSIGN_INDEX') return 'an array, e.g. Xs[1] <- 0';
  if (req.type === 'OUTPUT') return 'OUTPUT ...';
  return 'CALL ' + req.name + '(...)';
}
function tutorialRequiresMet(program, requires) {
  if (!program) return false;
  return (requires || []).every(function (req) { return tutorialRequirementMet(program, req); });
}
function currentTutorialStep() {
  if (!activeTutorial) return null;
  return TUTORIALS[activeTutorial.tutIdx].steps[activeTutorial.stepIdx];
}
// Re-evaluates the current step's highlightTiles() (if it has one) and
// redraws the glowing ring(s) to match. Called on every step change
// (renderTutorialStep) AND every time the player cursor moves
// (onCursorMoved) - some steps highlight a tile relative to wherever the
// student is CURRENTLY standing (e.g. "here's where a machine placed right
// here would act"), not a fixed spot, so those need to track live movement,
// not just redraw once when the step first appears.
function refreshTutorialHighlight() {
  var step = currentTutorialStep();
  if (step && typeof step.highlightTiles === 'function') setTutorialHighlights(step.highlightTiles());
  else clearTutorialHighlights();
}
