/*
 * FlowScratch tutorials: the guided tutorials in the FlowScratch
 * Tutorials picker (see the TUTORIALS section of flowscratch.js for how
 * steps and requirements work). Loaded by scratch/editor.html just before
 * flowscratch.js, which reads them from window.FlowScratchContent. No-op
 * unless ?flowscratch is in the URL, same as the editor itself.
 */
(function () {
  'use strict';

  if (!/[?&]flowscratch/.test(location.search)) return;

  var FS_TUTORIALS = [
    {
      id: 'first-flowchart',
      title: 'Your First Flowchart',
      color: '#FFBF00',
      category: 'Flowchart Basics',
      desc: 'Every flowchart starts with Start and ends with End - build the simplest one and run it for real.',
      steps: [
        {
          title: 'Add a Start block',
          text: 'Every flowchart begins with exactly one <b>Start</b> block, at the top of the <b>Flow</b> category in the palette on the left. Drag one onto the canvas.',
          requires: [{ node: 'start' }],
          highlight: 'palette-start',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Add a Move steps block',
          text: 'Open the <b>Motion</b> category and drag a <b>Move steps</b> block onto the canvas too.',
          requires: [{ node: 'start' }, { node: 'move_steps' }],
          highlight: 'palette-move-steps',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Add an End block',
          text: 'Back in <b>Flow</b>, drag out an <b>End</b> block.',
          requires: [{ node: 'start' }, { node: 'move_steps' }, { node: 'end' }],
          highlight: 'palette-end',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Connect them in order',
          text: 'Hover near a block\'s edge until the green dot appears, then press and drag to the next block: <b>Start &rarr; Move steps &rarr; End</b>.',
          requires: [{ node: 'start' }, { node: 'move_steps' }, { node: 'end' }, { path: true }]
        },
        {
          title: 'Try it!',
          text: 'Use the green flag above the stage to run your flowchart - the sprite should move.<br><br><b>Challenge:</b> add a Turn right block between Move steps and End, and watch it face a new direction every run.',
          requires: [],
          highlight: 'green-flag',
          highlightLabel: 'Click to run'
        }
      ]
    },
    // ── The rest of this library mirrors pyscratch.js's own tutorial list,
    // one FlowScratch-native step arc per PyScratch concept - not a literal
    // line-for-line port, since PyScratch teaches typed Python and these
    // teach the block equivalent. Two adaptations worth flagging:
    // - PyScratch's "If Statements" and "Left & Right Movement" tutorials
    //   teach the same if/key_pressed/change_x idea twice with more polish
    //   the second time; merged here into one "Making Choices" tutorial
    //   rather than build two near-duplicates.
    // - "Bouncing Ball" doesn't port the hand-written vx/vy sign-flipping
    //   PyScratch needs, because there's no "multiply a variable by -1"
    //   block to flip it with - and If on edge, bounce already does the
    //   whole mechanic in one existing block. Taught as itself instead,
    //   with the text calling out why.
    {
      id: 'making-choices',
      title: 'Making Choices',
      color: '#FFAB19',
      category: 'Branching & Loops',
      desc: 'Use a Selection block to branch your flowchart - move the sprite only while an arrow key is held.',
      steps: [
        {
          title: 'Add a Start block',
          text: 'Every flowchart begins with a <b>Start</b> block. Drag one onto the canvas.',
          requires: [{ node: 'start' }],
          highlight: 'palette-start',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Add a Selection block',
          text: 'A <b>Selection</b> block is a diamond that checks a condition and branches into <b>True</b> and <b>False</b> paths - the flowchart equivalent of an "if". Open <b>Control</b> and drag one onto the canvas.',
          requires: [{ node: 'start' }, { node: 'selection' }],
          highlight: 'palette-selection',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Set the condition to a key',
          text: 'Click the Selection block. Set its first dropdown to <b>Key</b>, then choose <b>Right Arrow</b>.',
          requires: [{ node: 'start' }, { node: 'selection' },
            { nodeWhere: { type: 'selection', field: 'condition', value: 'key' }, label: 'Selection is set to check a key' }]
        },
        {
          title: 'Add a second Selection',
          text: 'A Selection\'s False output can\'t point back to itself, so checking a key "every frame" always needs a second thing for False to reach. Add a <b>second</b> Selection block (condition: key, <b>Left Arrow</b>) - you\'ll wire the two into a loop together next.',
          requires: [{ node: 'start' }, { node: 'selection', count: 2 }],
          highlight: 'palette-selection',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Move on the True branches',
          text: 'Drag two <b>Change x by</b> blocks from Motion - one set to <b>5</b>, one to <b>-5</b>. Connect <b>Start</b> to the first (right-key) Selection. Connect each Selection\'s <b>True</b> output to its own Change x by block.',
          requires: [{ node: 'start' }, { node: 'selection', count: 2 }, { node: 'change_x_by', count: 2 }],
          highlight: 'palette-change-x-by',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Wire the loop',
          text: 'Now connect everything so both Selections keep checking forever: <b>right Change x by &rarr; left Selection</b>, and the right Selection\'s <b>False</b> output <b>also &rarr; left Selection</b> (both paths converge there). Then the same in reverse: <b>left Change x by &rarr; right Selection</b>, and the left Selection\'s <b>False</b> output <b>also &rarr; right Selection</b>. Every Selection now has exactly two outgoing wires, and the whole thing loops.',
          requires: [{ node: 'start' }, { node: 'selection', count: 2 }, { node: 'change_x_by', count: 2 }, { loop: true }]
        },
        {
          title: 'Try it!',
          text: 'Click the <b>green flag</b> and hold the arrow keys - your sprite should move left and right.<br><br><b>Challenge:</b> add <b>Point in direction</b> blocks (90 for right, -90 for left) so the sprite turns to face the way it\'s moving - try a <b>Set rotation style</b> block set to left-right first.',
          requires: [],
          highlight: 'green-flag',
          highlightLabel: 'Click to run'
        }
      ]
    },
    {
      id: 'loops-that-repeat',
      title: 'Loops That Repeat',
      color: '#FFAB19',
      category: 'Branching & Loops',
      desc: 'Use a variable and a Selection block to repeat part of your flowchart a fixed number of times, then carry on.',
      steps: [
        {
          title: 'Add a Start block',
          text: 'Drag a <b>Start</b> block onto the canvas.',
          requires: [{ node: 'start' }],
          highlight: 'palette-start',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Create a counter variable',
          text: 'Drag a <b>Set variable</b> block from Variables. Create a new variable called exactly <b>count</b> and set it to 0.',
          requires: [{ node: 'start' }, { node: 'set_variable' }],
          highlight: 'palette-set-variable',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Add a Selection that checks the count',
          text: 'Drag a Selection block. Set its condition to <b>Variable</b>, choose <b>count</b>, operator <b>&lt;</b>, value <b>5</b>.',
          requires: [{ node: 'start' }, { node: 'set_variable' }, { node: 'selection' },
            { nodeWhere: { type: 'selection', field: 'condition', value: 'variable' }, label: 'Selection is set to check a variable' }],
          highlight: 'palette-selection',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Repeat and count up',
          text: 'On the <b>True</b> branch, add a block that does something (try Move steps), then a <b>Change variable</b> block that adds 1 to count. Connect it back to the Selection block to keep checking.',
          requires: [{ node: 'start' }, { node: 'selection' }, { node: 'change_variable' }, { loop: true }],
          highlight: 'palette-change-variable',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Do something once the loop ends',
          text: 'On the <b>False</b> branch (once count reaches 5), connect to a <b>Say</b> block, then an <b>End</b> block.',
          requires: [{ node: 'start' }, { node: 'selection' }, { node: 'say' }, { node: 'end' }]
        },
        {
          title: 'Try it!',
          text: 'Click the <b>green flag</b>. Your flowchart should repeat 5 times, then say something and stop.<br><br><b>Challenge:</b> change the 5 to 10, or count down from 10 to 0 instead.',
          requires: [],
          highlight: 'green-flag',
          highlightLabel: 'Click to run'
        }
      ]
    },
    {
      id: 'costume-animation',
      title: 'Costume Animation',
      color: '#9966FF',
      category: 'Movement & Animation',
      desc: 'Animate your sprite through its costumes while it moves, and snap back to a resting pose when it stops.',
      steps: [
        {
          title: 'Set up movement',
          text: 'Add a <b>Start</b>, a <b>Selection</b> (key: Right Arrow), a <b>Change x by</b> (5), and a <b>Wait seconds</b> block. Wire <b>Start &rarr; Selection</b>; the Selection\'s <b>True</b> output <b>&rarr; Change x by &rarr; Wait seconds</b>; the Selection\'s <b>False</b> output <b>also &rarr; Wait seconds</b> (both paths converge there); then <b>Wait seconds</b> back to the Selection, closing the loop.<br><br>⚠️ Make sure your sprite has <b>at least 2 costumes</b> before continuing.',
          requires: [{ node: 'start' }, { node: 'selection' }, { node: 'change_x_by' }, { node: 'wait_seconds' }, { loop: true }],
          highlight: 'palette-selection',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Animate while moving',
          text: 'Add a <b>Next costume</b> block between <b>Change x by</b> and <b>Wait seconds</b>, on the True path only.',
          requires: [{ node: 'start' }, { node: 'selection' }, { node: 'change_x_by' }, { node: 'next_costume' }, { node: 'wait_seconds' }, { loop: true }],
          highlight: 'palette-next-costume',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Rest when still',
          text: 'Add a <b>Switch costume to</b> block set to your first costume, and drop it directly onto the <b>False</b> wire between the Selection and Wait seconds - it splices straight into that connection, so the sprite resets to its resting pose whenever the key isn\'t held.',
          requires: [{ node: 'start' }, { node: 'switch_costume_to' }],
          highlight: 'palette-switch-costume-to',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Try it!',
          text: 'Click the <b>green flag</b> and walk left and right - your sprite should animate while moving and rest when still.<br><br><b>Challenge:</b> try a shorter Wait for a sprint, or a longer one for a slow walk. Add the same shape again for the left arrow key.',
          requires: [],
          highlight: 'green-flag',
          highlightLabel: 'Click to run'
        }
      ]
    },
    {
      id: 'gravity-jumping',
      title: 'Gravity & Jumping',
      color: '#9966FF',
      category: 'Movement & Animation',
      desc: 'Give your sprite a velocity variable, pull it down every frame with gravity, and let it jump when it touches the ground.',
      steps: [
        {
          title: 'Create the velocity variable',
          text: 'Drag a <b>Start</b> block, then a <b>Set variable</b> block. Create a variable called exactly <b>vy</b> (vertical velocity) and set it to 0.',
          requires: [{ node: 'start' }, { node: 'set_variable' }],
          highlight: 'palette-set-variable',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Apply gravity every frame',
          text: 'Add a <b>Change variable</b> block that changes <b>vy</b> by <b>-0.5</b>, then a <b>Change y by</b> block. Click Change y by, and in the panel on the right set its source to the <b>vy</b> variable instead of a plain number.',
          requires: [{ node: 'start' }, { node: 'change_variable' }, { node: 'change_y_by' },
            { nodeWhere: { type: 'change_y_by', field: 'ySrc', value: 'var:vy' }, label: 'Change y by uses the vy variable' }],
          highlight: 'palette-change-y-by',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Add a loop and land on the floor',
          text: 'Wire Start through the gravity blocks, looping back so gravity applies every frame. Add a Selection that checks <b>touching edge: bottom</b> - on <b>True</b>, use Set variable to set <b>vy</b> back to 0.',
          requires: [{ node: 'start' }, { loop: true }, { node: 'selection' },
            { nodeWhere: { type: 'selection', field: 'condition', value: 'edge' }, label: 'Selection checks for touching an edge' }]
        },
        {
          title: 'Jumping',
          text: 'Add a second Selection that checks the <b>Up Arrow</b> key. On <b>True</b>, use Set variable to set <b>vy</b> to <b>8</b> - gravity pulls it back down automatically.',
          requires: [{ node: 'start' }, { node: 'selection', count: 2 }]
        },
        {
          title: 'Try it!',
          text: 'Click the <b>green flag</b> and press the up arrow to jump. The sprite should fall, land, and jump on command.<br><br><b>Challenge:</b> add left/right movement with two more Selection blocks and Change x by.',
          requires: [],
          highlight: 'green-flag',
          highlightLabel: 'Click to run'
        }
      ]
    },
    {
      id: 'bouncing-ball',
      title: 'Bouncing Ball',
      color: '#9966FF',
      category: 'Movement & Animation',
      desc: 'Make a sprite bounce around the stage forever using a loop and the If on edge, bounce block.',
      steps: [
        {
          title: 'Add a Start block',
          text: 'Drag a <b>Start</b> block onto the canvas.',
          requires: [{ node: 'start' }],
          highlight: 'palette-start',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Move every frame',
          text: 'Add a <b>Move steps</b> block (try 8 steps) and connect it to Start.',
          requires: [{ node: 'start' }, { node: 'move_steps' }],
          highlight: 'palette-move-steps',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Bounce off the edges',
          text: 'Add an <b>If on edge, bounce</b> block after Move steps and connect it. This one block does what would otherwise need its own vx/vy variables and manual sign-flipping to write by hand.',
          requires: [{ node: 'start' }, { node: 'move_steps' }, { node: 'if_on_edge_bounce' }],
          highlight: 'palette-if-on-edge-bounce',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Loop it forever',
          text: 'Connect <b>If on edge, bounce</b> back to <b>Move steps</b> so this repeats every frame.',
          requires: [{ node: 'start' }, { node: 'move_steps' }, { node: 'if_on_edge_bounce' }, { loop: true }]
        },
        {
          title: 'Try it!',
          text: 'Click the <b>green flag</b> - the ball should bounce around the stage forever.<br><br><b>Challenge:</b> increase Move steps for a faster ball, or add a Turn right block before bouncing for a less predictable path.',
          requires: [],
          highlight: 'green-flag',
          highlightLabel: 'Click to run'
        }
      ]
    },
    {
      id: 'working-with-lists',
      title: 'Working with Lists',
      color: '#FF8C1A',
      category: 'Code Organisation',
      desc: 'Store many values in one list, grow it while the flow runs, and read them back one at a time.',
      steps: [
        {
          title: 'Make a list',
          text: 'Click <b>+ New list</b> in the Variables category and create one called exactly <b>points</b>. Drag a <b>Start</b> block, then three <b>Add to list</b> blocks to add <b>-150</b>, <b>0</b>, and <b>150</b> to it.',
          requires: [{ node: 'start' }, { node: 'list_add', count: 3 }],
          highlight: 'palette-list-add',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Read an item back',
          text: 'Drag a <b>Set var to item of list</b> block. Create a variable called exactly <b>current</b>, and read item <b>1</b> of <b>points</b> into it.',
          requires: [{ node: 'start' }, { node: 'set_variable' }, { node: 'list_item_to_var' }],
          highlight: 'palette-list-item-to-var',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Move there and loop',
          text: 'Add a <b>Set x to</b> block - click it, and in the panel on the right set its source to the <b>current</b> variable. Add a <b>Wait seconds</b> block, then loop back so the flow keeps patrolling.',
          requires: [{ node: 'start' }, { node: 'set_x_to' }, { loop: true },
            { nodeWhere: { type: 'set_x_to', field: 'xSrc', value: 'var:current' }, label: 'Set x to uses the current variable' }],
          highlight: 'palette-set-x-to',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Grow the list',
          text: 'Lists can change size while the flow runs. Add one more <b>Add to list</b> block (a fourth stop) before the loop starts.',
          requires: [{ node: 'start' }, { node: 'list_add', count: 4 }]
        },
        {
          title: 'How long is the list?',
          text: 'Add a <b>Set variable</b> block, name a variable <b>count</b>, and in the panel on the right set its source to <b>length of points</b>.',
          requires: [{ node: 'start' }, { node: 'set_variable' },
            { nodeWhere: { type: 'set_variable', field: 'valueSrc', value: 'listlen:points' }, label: 'Set variable uses the length of points' }]
        },
        {
          title: 'Try it!',
          text: 'Click the <b>green flag</b> - the sprite should patrol between the stops in your list forever.<br><br><b>Challenge:</b> change which item you read each time through the loop (using another variable as the index) so it actually visits every stop in order, not just the first.',
          requires: [],
          highlight: 'green-flag',
          highlightLabel: 'Click to run'
        }
      ]
    },
    {
      id: 'messages-events',
      title: 'Messages & Events',
      color: '#FFAB19',
      category: 'Code Organisation',
      desc: 'Split a trigger from its reaction - one part of your flow broadcasts a message, a separate script reacts.',
      steps: [
        {
          title: 'Two checks, chained',
          text: 'Add a <b>Start</b> block and <b>two</b> Selection blocks - one checking key <b>Space</b>, one checking key <b>Up Arrow</b>. A Selection\'s False output can never point back to itself, so two checks that both loop into each other is the standard way to keep checking several keys forever. Connect <b>Start</b> to the first Selection.',
          requires: [{ node: 'start' }, { node: 'selection', count: 2 }],
          highlight: 'palette-selection',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Broadcast on each True branch',
          text: 'Add two <b>Broadcast</b> blocks - one set to <b>cheer</b>, one set to <b>vanish</b>. Connect the Space Selection\'s <b>True</b> output to the cheer Broadcast, and the Up Arrow Selection\'s <b>True</b> output to the vanish Broadcast.',
          requires: [{ node: 'start' }, { node: 'selection', count: 2 }, { node: 'broadcast', count: 2 }],
          highlight: 'palette-broadcast',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Wire the loop',
          text: 'Connect <b>cheer Broadcast &rarr; Up Arrow Selection</b>, and the Space Selection\'s <b>False</b> output <b>also &rarr; Up Arrow Selection</b> (both paths converge there). Then the same in reverse: <b>vanish Broadcast &rarr; Space Selection</b>, and the Up Arrow Selection\'s <b>False</b> output <b>also &rarr; Space Selection</b>. Every Selection now has exactly two outgoing wires, and the whole thing loops forever.',
          requires: [{ node: 'start' }, { node: 'selection', count: 2 }, { node: 'broadcast', count: 2 }, { loop: true }]
        },
        {
          title: 'React to the messages',
          text: 'Add two <b>separate</b> scripts, each starting with its own <b>When I receive</b> block (no incoming wire): one set to <b>cheer</b> connected to a <b>Say</b> block, one set to <b>vanish</b> connected to a <b>Hide</b> block. Finish each with an <b>End</b> block - you can connect both Say and Hide to the <em>same</em> End. Your main flow never calls these directly - it just broadcasts, and they react on their own.',
          requires: [{ node: 'start' }, { node: 'when_i_receive', count: 2 }, { node: 'say' }, { node: 'hide' }, { node: 'end' }],
          highlight: 'palette-when-i-receive',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Try it!',
          text: 'Click the <b>green flag</b>. Press <b>space</b> to cheer and <b>up</b> to vanish - the reactions live in totally separate scripts from the key checks.<br><br><b>Challenge:</b> give a <em>second sprite</em> its own <b>When I receive: cheer</b> block too - one broadcast, many sprites responding. That is how whole games are coordinated.',
          requires: [],
          highlight: 'green-flag',
          highlightLabel: 'Click to run'
        }
      ]
    },
    // First of the PyScratch "Applied Games" tutorials to be ported - the
    // simplest of that set, chosen deliberately to prove the two-sprite
    // shape (movement sprite + falling sprite, coordinated only through
    // touching/variables, no clones or broadcasts needed) before
    // attempting the more involved ones (Flappy Bird, Duck Hunt, Tower
    // Defense, ...), each a separate future session's worth of work.
    // Simplified from PyScratch's own version in one place: the apple
    // resets to a fixed top position rather than a random x each time
    // (pick_random(-200, 200)) - FlowScratch has no "random number"
    // reporter yet (a real gap, worth adding before porting the tutorials
    // that lean on real randomness, like Flappy Bird's pipe gaps).
    {
      id: 'apple-catcher',
      title: 'Apple Catcher',
      color: '#4C97FF',
      category: 'Games',
      desc: 'Catch a falling apple with a basket sprite you steer - two sprites working together through touching and shared variables.',
      steps: [
        {
          title: 'Build the basket\'s movement',
          text: 'On your first sprite (the basket), build the same left/right movement shape as <b>Making Choices</b>: Start, two Selections (Right Arrow / Left Arrow), two Change x by blocks (5 / -5), all chained together so both Selections keep checking forever.',
          requires: [{ node: 'start' }, { node: 'selection', count: 2 }, { node: 'change_x_by', count: 2 }, { loop: true }],
          highlight: 'palette-selection',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Add score and lives',
          text: 'Add two <b>Set variable</b> blocks between Start and the movement chain: <b>Score</b> set to 0, and <b>Lives</b> set to 3.',
          requires: [{ node: 'start' }, { node: 'set_variable', count: 2 }],
          highlight: 'palette-set-variable',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Add the Apple sprite',
          text: 'Click the highlighted button to add a second sprite. Give it a small round costume and a name like <b>Apple</b> - you\'ll pick it by name from a dropdown shortly.',
          requires: [{ node: 'start' }, { node: 'set_variable', count: 2 }],
          highlight: 'add-sprite-btn',
          highlightLabel: 'Add a sprite here'
        },
        {
          title: 'Apple: fall from the top',
          text: 'With the <b>Apple</b> sprite selected, build: <b>Start &rarr; Go to x y (0, 160) &rarr; Change y by (-4)</b>, looping Change y by back to itself is not allowed - you\'ll connect the rest (and close the loop) in the next step.',
          requires: [{ node: 'start' }, { node: 'go_to_xy' }, { node: 'change_y_by' }],
          highlight: 'palette-go-to-xy',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Catch or miss',
          text: 'Add a Selection checking <b>touching</b> your basket sprite\'s name. True: <b>Change variable Score by 1</b>, then back to <b>Go to x y</b> (resets position and continues falling). False: add a second Selection checking <b>touching edge: bottom</b>. Its True: <b>Change variable Lives by -1</b>, then also back to <b>Go to x y</b>. Its False: back to <b>Change y by</b>, closing the falling loop.',
          requires: [{ node: 'start' }, { node: 'go_to_xy' }, { node: 'change_y_by' }, { node: 'selection', count: 2 }, { node: 'change_variable', count: 2 },
            { nodeWhere: { type: 'selection', field: 'condition', value: 'touching' }, label: 'A Selection checks touching' },
            { nodeWhere: { type: 'selection', field: 'condition', value: 'edge' }, label: 'A Selection checks touching an edge' }],
          highlight: 'palette-change-variable',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Try it!',
          text: 'Click the <b>green flag</b>. The apple should fall, and catching it with your basket scores a point while missing it costs a life.<br><br><b>Challenge:</b> add a Selection on the basket that checks <code>Lives</code> &lt;= 0 and ends the game with a Say block. Try changing Change y by\'s amount to speed the apple up over time.',
          requires: [],
          highlight: 'green-flag',
          highlightLabel: 'Click to run'
        }
      ]
    },
    // Pong needed one more capability first: change_variable only adds,
    // so nothing could express PyScratch's `vx = vx * -1` sign-flip on a
    // wall bounce - added Multiply variable by alongside this tutorial.
    // Simplified from PyScratch's own version by dropping the paddle's
    // own edge-clamping (x_position() > 200: set_x(200)) - a nice-to-have
    // left as a Challenge, not essential to the bounce/score mechanic.
    {
      id: 'pong',
      title: 'Pong',
      color: '#4C97FF',
      category: 'Games',
      desc: 'One-player Pong - bounce a ball off the walls and your paddle using velocity variables and Multiply variable by.',
      steps: [
        {
          title: 'Build the paddle',
          text: 'On your first sprite (the paddle), add a <b>Go to x y</b> block set to <b>(0, -150)</b>, then the same left/right movement chain as <b>Making Choices</b> (two Selections, two Change x by blocks, both wired into a loop).',
          requires: [{ node: 'start' }, { node: 'go_to_xy' }, { node: 'selection', count: 2 }, { node: 'change_x_by', count: 2 }, { loop: true }],
          highlight: 'palette-go-to-xy',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Add the Ball sprite',
          text: 'Click the highlighted button to add a second sprite. Give it a small round costume and a name like <b>Ball</b>.',
          requires: [{ node: 'start' }, { node: 'go_to_xy' }, { node: 'selection', count: 2 }],
          highlight: 'add-sprite-btn',
          highlightLabel: 'Add a sprite here'
        },
        {
          title: 'Ball: set up velocity and score',
          text: 'With the <b>Ball</b> sprite selected: three <b>Set variable</b> blocks - <b>vx</b> to 4, <b>vy</b> to 3, <b>Score</b> to 0 - then a <b>Go to x y</b> set to <b>(0, 50)</b>.',
          requires: [{ node: 'start' }, { node: 'set_variable', count: 3 }, { node: 'go_to_xy' }],
          highlight: 'palette-set-variable',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Ball: move and bounce off the side walls',
          text: 'Add a <b>Change x by</b> sourced from <b>vx</b> and a <b>Change y by</b> sourced from <b>vy</b>. Then a Selection checking <b>touching edge: left</b> - True: <b>Multiply variable vx by -1</b> - and a Selection checking <b>touching edge: right</b> - True: <b>Multiply variable vx by -1</b> too. Chain them: each False output leads to the next Selection.',
          requires: [{ node: 'start' }, { node: 'change_x_by' }, { node: 'change_y_by' }, { node: 'selection', count: 2 }, { node: 'multiply_variable' },
            { nodeWhere: { type: 'selection', field: 'value', value: 'left' }, label: 'A Selection checks the left edge' }],
          highlight: 'palette-multiply-variable',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Ball: bounce off the top and the paddle',
          text: 'Chain on two more Selections: <b>touching edge: top</b> (True: <b>Multiply vy by -1</b>), then <b>touching</b> your paddle sprite\'s name (True: <b>Multiply vy by -1</b> and <b>Change variable Score by 1</b>). Keep chaining False onward.',
          requires: [{ node: 'start' }, { node: 'selection', count: 4 }, { node: 'multiply_variable', count: 3 }, { node: 'change_variable' },
            { nodeWhere: { type: 'selection', field: 'condition', value: 'touching' }, label: 'A Selection checks touching' }],
          highlight: 'palette-selection',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Game over',
          text: 'Add one final Selection: <b>touching edge: bottom</b>. True: a <b>Say</b> block ("Game Over!") then an <b>End</b>. False: back to <b>Change x by</b>, closing the whole loop.',
          requires: [{ node: 'start' }, { node: 'selection', count: 5 }, { node: 'say' }, { node: 'end' }, { loop: true }]
        },
        {
          title: 'Try it!',
          text: 'Click the <b>green flag</b>. Keep the ball alive with your paddle - each bounce off it scores a point.<br><br><b>Challenge:</b> add the edge-clamping from Making Choices so the paddle can\'t slide off screen. Try speeding the ball up over time with a second Multiply variable block on <code>vy</code> (a number just over 1, like 1.05) each time it hits the paddle.',
          requires: [],
          highlight: 'green-flag',
          highlightLabel: 'Click to run'
        }
      ]
    },
    // Simplified from PyScratch's own version in one place: PyScratch's
    // flap uses when_key_pressed, a genuine tap-only (edge-triggered)
    // event - FlowScratch's Selection only ever polls "is this key held
    // right now", so holding Space here keeps giving upward lift every
    // frame, rather than one impulse per tap. A real gap (an edge-
    // triggered key event, distinct from the held-key poll Selection
    // already does) worth adding later; noted in the tutorial text
    // rather than hidden. The bird's tilt-with-velocity is left as a
    // Challenge, not a required step, to keep the base flow's Selection
    // chain from growing past what's still easy to follow on screen.
    {
      id: 'flappy-bird',
      title: 'Flappy Bird',
      color: '#9966FF',
      category: 'Games',
      desc: 'Gravity, a floor and ceiling, flap-to-rise, and a pipe that loops across the screen at a random height.',
      steps: [
        {
          title: 'Gravity',
          text: 'Add a <b>Set variable</b> block (<b>vy</b> to 0), a <b>Change variable</b> block (<b>vy</b> by -0.3), and a <b>Change y by</b> block sourced from <b>vy</b>. Wire them in that order after Start - you\'ll close the loop in a later step.',
          requires: [{ node: 'start' }, { node: 'set_variable' }, { node: 'change_variable' }, { node: 'change_y_by' },
            { nodeWhere: { type: 'change_y_by', field: 'ySrc', value: 'var:vy' }, label: 'Change y by uses the vy variable' }],
          highlight: 'palette-change-variable',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Floor and ceiling',
          text: 'Add a Selection checking <b>touching edge: bottom</b> - True: <b>Set y to</b> -180, then <b>Set variable vy</b> to 0. Add a second Selection checking <b>touching edge: top</b> - True: <b>Set y to</b> 180, then <b>Set variable vy</b> to 0. Chain False onward through both.<br><br>The reset position has to match the edge exactly (-180/180, the real edge of the stage) - resetting to a value the edge check itself wouldn\'t also flag as "touching" (like -150) would let the bird fall further before the next check catches it.',
          requires: [{ node: 'start' }, { node: 'selection', count: 2 }, { node: 'set_y_to', count: 2 }, { node: 'set_variable', count: 3 }],
          highlight: 'palette-set-y-to',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Flap',
          text: 'Add one more Selection checking key <b>Space</b> - True: <b>Set variable vy</b> to 5. Connect its False output, and its True output after Set variable, both back to the very first <b>Change variable vy</b> block - closing the loop.<br><br>⚠️ Since Selection only checks "is this key held right now" (not a single tap), the bird rises the whole time Space is held rather than flapping once per press.',
          requires: [{ node: 'start' }, { node: 'selection', count: 3 }, { loop: true }],
          highlight: 'palette-selection',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Add the Pipe sprite',
          text: 'Click the highlighted button to add a second sprite - anything to dodge. Then click it in the sprite panel to switch to its code.',
          requires: [{ node: 'start' }, { node: 'selection', count: 3 }],
          highlight: 'add-sprite-btn',
          highlightLabel: 'Add a sprite here'
        },
        {
          title: 'Pipe: move and loop at a random height',
          text: 'With the <b>Pipe</b> sprite selected: <b>Set variable to random number</b> (name it <b>pipeY</b>, -100 to 100), a <b>Go to x y</b> at x <b>240</b> sourced from <b>pipeY</b> for y, and a <b>Change x by</b> of -3. Add a Selection checking <b>touching edge: left</b> - True: set <b>pipeY</b> to a new random number again, then another <b>Go to x y</b> at x <b>260</b> sourced from <b>pipeY</b>. Loop both the True and False paths back to <b>Change x by</b>.',
          requires: [{ node: 'start' }, { node: 'set_var_to_random', count: 2 }, { node: 'go_to_xy', count: 2 }, { node: 'change_x_by' }, { node: 'selection' }, { loop: true },
            { nodeWhere: { type: 'go_to_xy', field: 'ySrc', value: 'var:pipeY' }, label: 'Go to x y uses the pipeY variable' }],
          highlight: 'palette-set-var-to-random',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Try it!',
          text: 'Click the <b>green flag</b> and hold <b>Space</b> to rise. The bird should fall with gravity and stay between the floor and ceiling, while the pipe scrolls across at a random height on a loop.<br><br><b>Challenge:</b> add a <b>Set rotation style</b> block (all around) and tilt the bird based on <code>vy</code> - point in direction 20 while falling, -20 while rising, using a Selection with condition Variable.',
          requires: [],
          highlight: 'green-flag',
          highlightLabel: 'Click to run'
        }
      ]
    },
    // Three sprites (Player, Platform, Death), no clones needed. One
    // simplification from PyScratch's own version: its platform-bounce
    // check is `touching("Platform") and vy < 0` (compound AND) - a
    // Selection only ever checks one condition, so this checks touching
    // alone, meaning (unlike PyScratch) bouncing off a platform works
    // even while still rising into it from below. A minor gameplay
    // difference, not a functional gap worth blocking on.
    {
      id: 'doodle-jump',
      title: 'Doodle Jump',
      color: '#9966FF',
      category: 'Games',
      desc: 'A character that bounces automatically, wraps around the screen edges, and lands on falling platforms - or falls to a death barrier below.',
      steps: [
        {
          title: 'Set up bouncing',
          text: 'Add a <b>Set variable</b> (<b>vy</b> to 8), a <b>Change variable</b> (<b>vy</b> by -0.4), and a <b>Change y by</b> sourced from <b>vy</b>. Then a Selection checking <b>touching edge: bottom</b> - True: <b>Set y to</b> -180, then <b>Set variable vy</b> to 8 (relaunches it upward instead of just stopping).',
          requires: [{ node: 'start' }, { node: 'set_variable', count: 2 }, { node: 'change_variable' }, { node: 'change_y_by' }, { node: 'selection' }, { node: 'set_y_to' },
            { nodeWhere: { type: 'selection', field: 'value', value: 'bottom' }, label: 'A Selection checks the bottom edge' }],
          highlight: 'palette-change-variable',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Move left and right',
          text: 'Chain on two more Selections: key <b>Right Arrow</b> (True: <b>Change x by</b> 4) and key <b>Left Arrow</b> (True: <b>Change x by</b> -4).',
          requires: [{ node: 'start' }, { node: 'selection', count: 3 }, { node: 'change_x_by', count: 2 }],
          highlight: 'palette-selection',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Wrap around the screen',
          text: 'Chain on two final Selections: <b>touching edge: right</b> (True: <b>Set x to</b> -230) and <b>touching edge: left</b> (True: <b>Set x to</b> 230). Loop the last one\'s False output back to <b>Change variable vy</b>, closing the whole thing.<br><br>Use -230/230, not the exact edge value (-240/240) - landing exactly on the edge would immediately re-trigger the <em>other</em> wrap check too, and the sprite would flicker back and forth instead of actually wrapping across.',
          requires: [{ node: 'start' }, { node: 'selection', count: 5 }, { node: 'set_x_to', count: 2 }, { loop: true }]
        },
        {
          title: 'Add the Platform sprite',
          text: 'Click the highlighted button to add a second sprite - a flat wide costume works well. Name it something like <b>Platform</b>.',
          requires: [{ node: 'start' }, { node: 'selection', count: 5 }],
          highlight: 'add-sprite-btn',
          highlightLabel: 'Add a sprite here'
        },
        {
          title: 'Platform: fall and reset',
          text: 'With <b>Platform</b> selected: <b>Set variable to random number</b> (name it <b>platX</b>, -150 to 150), a <b>Go to x y</b> at y <b>0</b> sourced from <b>platX</b> for x, and a <b>Change y by</b> of -2. Add a Selection checking <b>touching edge: bottom</b> - True: set <b>platX</b> to a new random number, then a second <b>Go to x y</b> at y <b>180</b> sourced from <b>platX</b>. Loop both paths back to <b>Change y by</b>.',
          requires: [{ node: 'start' }, { node: 'set_var_to_random', count: 2 }, { node: 'go_to_xy', count: 2 }, { node: 'change_y_by' }, { node: 'selection' }, { loop: true }],
          highlight: 'palette-set-var-to-random',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Add the Death sprite',
          text: 'Click the highlighted button again to add a third sprite - a wide flat costume spanning the stage works well. Name it something like <b>Death</b>, and position it at the very bottom of the stage.',
          requires: [{ node: 'start' }, { node: 'set_var_to_random', count: 2 }],
          highlight: 'add-sprite-btn',
          highlightLabel: 'Add a sprite here'
        },
        {
          title: 'Bounce on the platform, and game over',
          text: 'Switch back to your <b>player</b> sprite. Chain on a Selection checking <b>touching</b> your Platform sprite\'s name - True: <b>Set variable vy</b> to 8. Chain on one more Selection checking <b>touching</b> your Death sprite\'s name - True: a <b>Say</b> block ("Game Over!") then an <b>End</b>. Its False loops back into your existing loop.',
          requires: [{ node: 'start' }, { node: 'selection', count: 7 }, { node: 'say' }, { node: 'end' },
            { nodeWhere: { type: 'selection', field: 'condition', value: 'touching' }, label: 'A Selection checks touching' }],
          highlight: 'palette-selection',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Try it!',
          text: 'Click the <b>green flag</b>. Bounce on the platform to stay alive - fall into the death zone and it\'s game over.<br><br><b>Challenge:</b> add 2-3 more Platform sprites at different starting heights so there\'s always something to land on.',
          requires: [],
          highlight: 'green-flag',
          highlightLabel: 'Click to run'
        }
      ]
    },
    // One sprite, no clones. Needed a real new capability first: a click-
    // triggered entry point ("When this sprite is clicked") - the only
    // trigger FlowScratch had before this was the green flag (Start) and
    // a matching broadcast (When I receive), neither of which fires on a
    // genuine click. Added as a second background-flow root exactly like
    // When I receive, just triggered by a real mousedown hit-testing that
    // sprite's own drawable instead of a message name. Building it also
    // surfaced a real pre-existing bug: the "touching mouse pointer"
    // Selection condition called a renderer method
    // (isTouchingDrawable, singular) that doesn't exist on this build's
    // renderer at all - it always threw, silently caught, so that
    // condition has quietly evaluated false since it was written. Fixed
    // alongside this using the same real pixel hit-test (renderer.pick())
    // the click detection itself needed.
    //
    // Simplified from PyScratch's own version by dropping the facing-
    // direction flourish (point_in_direction after each bounce) - cosmetic,
    // not core to the mechanic, left as a Challenge instead.
    {
      id: 'duck-hunt',
      title: 'Duck Hunt',
      color: '#4C97FF',
      category: 'Games',
      desc: 'A duck bounces around the screen off every edge - click it to score and send it to a new random spot at a new random speed.',
      steps: [
        {
          title: 'Set up flying',
          text: 'Add a <b>Start</b>, three <b>Set variable</b> blocks (<b>vx</b> to 3, <b>vy</b> to 2, <b>Score</b> to 0), and a <b>Go to x y</b> at (0, 50). Then a <b>Change x by</b> sourced from <b>vx</b> and a <b>Change y by</b> sourced from <b>vy</b> - you\'ll close the loop in the next step.',
          requires: [{ node: 'start' }, { node: 'set_variable', count: 3 }, { node: 'go_to_xy' }, { node: 'change_x_by' }, { node: 'change_y_by' },
            { nodeWhere: { type: 'change_x_by', field: 'xSrc', value: 'var:vx' }, label: 'Change x by uses the vx variable' }],
          highlight: 'palette-set-variable',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Bounce off every edge',
          text: 'Chain on four Selections, one per edge - <b>right</b>, <b>left</b>, <b>top</b>, <b>bottom</b> - each True: <b>Multiply variable</b> (<b>vx</b> by -1 for right/left, <b>vy</b> by -1 for top/bottom). Loop the last one\'s False output back to <b>Change x by</b>, closing the whole thing.',
          requires: [{ node: 'start' }, { node: 'selection', count: 4 }, { node: 'multiply_variable', count: 4 }, { loop: true }],
          highlight: 'palette-multiply-variable',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Shoot the duck on click',
          text: 'Add a <b>separate</b> script: a <b>When this sprite is clicked</b> block, connected to <b>Change variable Score</b> by 1, <b>Hide</b>, <b>Wait seconds</b> (0.8), a <b>Go to</b> block set to random position, two <b>Set variable to random number</b> blocks (<b>vx</b> 3 to 6, <b>vy</b> 2 to 4), <b>Show</b>, then an <b>End</b>.',
          requires: [{ node: 'start' }, { node: 'when_clicked' }, { node: 'change_variable' }, { node: 'hide' }, { node: 'wait_seconds' }, { node: 'go_to' }, { node: 'set_var_to_random', count: 2 }, { node: 'show' }, { node: 'end' }],
          highlight: 'palette-when-clicked',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Try it!',
          text: 'Click the <b>green flag</b>, then click the duck as fast as you can! Each hit scores a point and sends the duck to a new spot at a new speed.<br><br><b>Challenge:</b> add a <b>Set rotation style</b> block (left-right) and a Selection checking the variable <code>vx &gt; 0</code> to make the duck face the direction it\'s flying.',
          requires: [],
          highlight: 'green-flag',
          highlightLabel: 'Click to run'
        }
      ]
    },
    // First tutorial to need clones - a genuinely new FlowScratch
    // capability, added alongside this one: Create clone of myself, When
    // I start as a clone (a script root, like Start/When I receive/When
    // this sprite is clicked, just for a specific clone instance instead
    // of the original), and Delete this clone. Whack-a-Mole is the
    // simplest real use of them: one sprite, cloned repeatedly, each
    // clone living a short independent life on its own copy of the
    // sprite's graph.
    //
    // Three separate scripts share this one sprite: the spawner (Start),
    // a clone's own lifetime (When I start as a clone), and the whack
    // itself (When this sprite is clicked) - clicking a clone runs THAT
    // exact clone's copy of the click script, not the original or some
    // other still-alive clone, the same pixel-accurate hit-test Duck
    // Hunt's click detection already uses, now checked against every
    // live clone at once so the topmost one under the cursor is the one
    // that gets whacked.
    //
    // Simplified from PyScratch's own version: only "clone of myself" is
    // offered (no dropdown to clone a named other sprite) - the far more
    // common case, and the only one every PyScratch clone tutorial
    // actually uses.
    {
      id: 'whack-a-mole',
      title: 'Whack-a-Mole',
      color: '#9966FF',
      category: 'Games',
      desc: 'A sprite spawns clones of itself at random spots - click one before it ducks back down to score a point.',
      steps: [
        {
          title: 'Set up the spawner',
          text: 'Add a <b>Start</b>, <b>Hide</b> (the original stays off-screen - only its clones will ever show), <b>Set variable Score</b> to 0, <b>Set variable to random number</b> (<b>SpawnDelay</b>, 0.5 to 1.5), a <b>Wait seconds</b> sourced from <b>SpawnDelay</b>, then <b>Create clone of myself</b>. Loop the last block\'s output back to the <b>Set variable to random number</b> block, so it keeps spawning moles forever.',
          requires: [{ node: 'start' }, { node: 'hide' }, { node: 'set_variable' }, { node: 'set_var_to_random' }, { node: 'wait_seconds' }, { node: 'create_clone' }, { loop: true }],
          highlight: 'palette-create-clone',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Bring each mole to life',
          text: 'Add a <b>separate</b> script: <b>When I start as a clone</b>, <b>Show</b>, <b>Go to</b> set to random position, <b>Wait seconds</b> (1), <b>Hide</b>, <b>Delete this clone</b>, then an <b>End</b> - a mole that\'s never clicked ducks back down on its own after a second.',
          requires: [{ node: 'when_i_start_as_clone' }, { node: 'show' }, { node: 'go_to' }, { node: 'wait_seconds', count: 2 }, { node: 'hide', count: 2 }, { node: 'delete_this_clone' }, { node: 'end' }],
          highlight: 'palette-when-i-start-as-clone',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Whack it on click',
          text: 'Add a <b>third</b> script: <b>When this sprite is clicked</b>, <b>Change variable Score</b> by 1, <b>Hide</b>, <b>Delete this clone</b>, then an <b>End</b> - clicking a mole scores instantly and removes that exact mole, not the original or any other one still up.',
          requires: [{ node: 'when_clicked' }, { node: 'change_variable' }, { node: 'hide', count: 3 }, { node: 'delete_this_clone', count: 2 }, { node: 'end', count: 2 }],
          highlight: 'palette-when-clicked',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Try it!',
          text: 'Click the <b>green flag</b> and whack moles as they pop up! Each one only stays visible for a second, so you have to be quick.<br><br><b>Challenge:</b> make it harder over time by changing <b>SpawnDelay</b>\'s random range to shrink (e.g. 0.3-0.8) every 10 points scored.',
          requires: [],
          highlight: 'green-flag',
          highlightLabel: 'Click to run'
        }
      ]
    }
  ];

  window.FlowScratchContent = { TUTORIALS: FS_TUTORIALS };
})();
