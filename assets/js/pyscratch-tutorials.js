/*
 * PyScratch tutorials and challenges: the guided tutorials in the
 * Tutorials picker and the build-it-yourself challenge cards. Loaded by
 * scratch/editor.html just before pyscratch.js, which reads them from
 * window.PyScratchContent. No-op unless ?pyscratch is in the URL, same as
 * the editor itself.
 */
(function () {
  'use strict';

  if (!/[?&]pyscratch/.test(location.search)) return;

  // ── Tutorial data ─────────────────────────────────────────────
  // Each step:
  //   title    {string}   Shown in the tutorial bar header
  //   text     {string}   Instruction HTML
  //   starter  {string|null}  Pre-fill editor when this step loads (null = keep current)
  //   target   {string|null}  Code shown as a hint block
  //   requires {string[]} All must appear in editor before Next unlocks ([] = always unlocked)
  //   category {string?}  Tutorial picker category; falls back to TUTORIAL_CATEGORY_BY_ID
  //   isNew    {bool?}    Show a yellow NEW badge for newly-added tutorials
  var TUTORIALS = [
    {
      id: 'if-statements',
      title: 'If Statements',
      emoji: '❓',
      desc: 'Run different code based on a condition. If the condition is true, one block runs; if not, it skips.',
      steps: [
        {
          title: 'Type the game loop',
          text: 'Every PyScratch program starts with a <code>game_start()</code> function. The <code>while True:</code> loop inside keeps it running every frame. Clear the editor and type this:',
          starter: '',
          target: 'def game_start():\n    while True:',
          newLines: ['def game_start():', '    while True:'],
          requires: ['def game_start():', '    while True:'],
          suppressErrors: ['struct']
        },
        {
          title: 'Your first if statement',
          text: 'An <strong>if statement</strong> runs its code only when the condition is true. Add an if block inside the loop that checks whether the right arrow key is held:',
          starter: 'def game_start():\n    while True:',
          target: 'def game_start():\n    while True:\n        if key_pressed("right"):\n            change_x(5)',
          newLines: ['        if key_pressed("right"):', '            change_x(5)'],
          requires: ['        if key_pressed("right"):', '            change_x(5)'],
          behaviorCheck: {
            hint: 'Hold the right arrow key - the sprite should move right. Check your if statement and <code>change_x(5)</code>.',
            setupMs: 400,
            scenarios: [
              { label: 'right key moves sprite right', holdKey: 'right', durationMs: 400,
                checks: [{ type: 'xChanged', dir: '+' }] }
            ]
          }
        },
        {
          title: 'A second if for the left key',
          text: 'Add another <code>if</code> block below the first. Using two separate <code>if</code> blocks (rather than <code>elif</code>) means both can fire at once - useful for diagonal movement later.',
          starter: 'def game_start():\n    while True:\n        if key_pressed("right"):\n            change_x(5)',
          target: 'def game_start():\n    while True:\n        if key_pressed("right"):\n            change_x(5)\n        if key_pressed("left"):\n            change_x(-5)',
          newLines: ['        if key_pressed("left"):', '            change_x(-5)'],
          requires: ['        if key_pressed("left"):', '            change_x(-5)'],
          behaviorCheck: {
            hint: 'Check both arrow keys work - the sprite should move right when right is held and left when left is held.',
            setupMs: 400,
            scenarios: [
              { label: 'right key moves sprite right', holdKey: 'right', durationMs: 400,
                checks: [{ type: 'xChanged', dir: '+' }] },
              { label: 'left key moves sprite left', holdKey: 'left', durationMs: 400,
                checks: [{ type: 'xChanged', dir: '-' }] }
            ]
          }
        },
        {
          title: '✅ Try it!',
          text: 'Click the <strong>green flag ▶</strong> and press the left and right arrow keys. The sprite should move - Scratch keeps it on screen automatically.<br><br><strong>Challenge:</strong> Add <code>if</code> blocks for the up and down keys using <code>change_y(5)</code> and <code>change_y(-5)</code>.',
          starter: null, target: null, newLines: [], requires: []
        }
      ]
    },
    {
      id: 'for-loops',
      title: 'For Loops',
      emoji: '🔁',
      desc: 'Repeat a block of code a fixed number of times using a for loop and range().',
      steps: [
        {
          title: 'Your first for loop',
          text: 'A <strong>for loop</strong> repeats its code a fixed number of times - no <code>while True:</code> needed. <code>range(5)</code> means "do this 5 times". The <code>def game_start():</code> has been provided - add the for loop inside it:',
          starter: 'def game_start():',
          target: 'def game_start():\n    for i in range(5):\n        change_x(30)\n        wait(0.3)',
          newLines: ['    for i in range(5):', '        change_x(30)', '        wait(0.3)'],
          requires: ['    for i in range(5):', '        change_x(30)', '        wait(0.3)'],
          behaviorCheck: {
            hint: 'Run your code - the sprite should move right 5 times automatically. Check <code>change_x(30)</code> is inside the loop.',
            setupMs: 100,
            scenarios: [
              { waitMs: 2200, checks: [{ type: 'xChanged', dir: '+' }] }
            ]
          }
        },
        {
          title: 'Use the loop variable',
          text: '<code>i</code> is the <strong>loop variable</strong> - Python sets it to the current count (0, 1, 2…). Add <code>say(str(i))</code> as the first line inside the loop. <code>str()</code> converts the number to text so <code>say()</code> can display it.',
          starter: 'def game_start():\n    for i in range(5):\n        change_x(30)\n        wait(0.3)',
          target: 'def game_start():\n    for i in range(5):\n        say(str(i))\n        change_x(30)\n        wait(0.3)',
          newLines: ['        say(str(i))'],
          requires: ['        say(str(i))'],
          behaviorCheck: {
            hint: 'Run your code - the sprite should move right and show numbers. Check <code>say(str(i))</code> is inside the loop.',
            setupMs: 100,
            scenarios: [
              { waitMs: 2200, checks: [{ type: 'xChanged', dir: '+' }] }
            ]
          }
        },
        {
          title: 'range() with a start and end',
          text: '<code>range()</code> can take two arguments: a start and a stop. <code>range(1, 6)</code> counts 1, 2, 3, 4, 5 - starting at 1 instead of 0. Update your range:',
          starter: 'def game_start():\n    for i in range(5):\n        say(str(i))\n        change_x(30)\n        wait(0.3)',
          target: 'def game_start():\n    for i in range(1, 6):\n        say(str(i))\n        change_x(30)\n        wait(0.3)',
          newLines: ['    for i in range(1, 6):'],
          requires: ['range(1, 6)'],
          behaviorCheck: {
            hint: 'Run your code - the sprite should move right 5 times counting 1 to 5. Check <code>range(1, 6)</code>.',
            setupMs: 100,
            scenarios: [
              { waitMs: 2200, checks: [{ type: 'xChanged', dir: '+' }] }
            ]
          }
        },
        {
          title: '✅ Try it!',
          text: 'Click the <strong>green flag ▶</strong>. The sprite should move five steps right, counting 1 to 5 as it goes, then stop.<br><br><strong>Challenge:</strong> Change to <code>range(1, 11)</code> for 10 steps. Try counting backwards with <code>range(10, 0, -1)</code>.',
          starter: null, target: null, newLines: [], requires: []
        }
      ]
    },
    {
      id: 'while-loops',
      title: 'While Loops',
      emoji: '🔄',
      desc: 'Repeat code for as long as a condition is true. Good for countdowns, timers and waiting for something to happen.',
      steps: [
        {
          title: 'Set up with a counter',
          text: 'Type the <code>game_start()</code> function and create a variable called <code>count</code> starting at 0. It tracks how many times the loop has run.',
          starter: '',
          target: 'def game_start():\n    count = 0',
          newLines: ['def game_start():', '    count = 0'],
          requires: ['def game_start():', '    count = 0']
        },
        {
          title: 'A while loop with a condition',
          text: 'A <strong>while loop</strong> keeps running as long as its condition is true. Add the loop below - it moves the sprite right and counts up until <code>count</code> reaches 5:',
          starter: 'def game_start():\n    count = 0',
          target: 'def game_start():\n    count = 0\n    while count < 5:\n        change_x(25)\n        count = count + 1\n        wait(0.2)',
          newLines: ['    while count < 5:', '        change_x(25)', '        count = count + 1', '        wait(0.2)'],
          requires: ['    while count < 5:', '        count = count + 1', '        wait(0.2)'],
          behaviorCheck: {
            hint: 'Run your code - the sprite should slide right 5 times and stop. Check your loop and <code>change_x(25)</code>.',
            setupMs: 100,
            scenarios: [
              { waitMs: 1800, checks: [{ type: 'xChanged', dir: '+' }] }
            ]
          }
        },
        {
          title: 'Code after the loop',
          text: 'Once <code>count</code> reaches 5 the condition is false and the loop ends. Python then runs whatever comes next. Add <code>say("Done!")</code> - with <strong>no</strong> indent, so it\'s outside the loop:',
          starter: 'def game_start():\n    count = 0\n    while count < 5:\n        change_x(25)\n        count = count + 1\n        wait(0.2)',
          target: 'def game_start():\n    count = 0\n    while count < 5:\n        change_x(25)\n        count = count + 1\n        wait(0.2)\n    say("Done!")',
          newLines: ['    say("Done!")'],
          requires: ['    say("Done!")'],
          behaviorCheck: {
            hint: 'Run your code - the sprite should slide right then say "Done!". Check <code>say("Done!")</code> is outside (less indented than) the loop.',
            setupMs: 100,
            scenarios: [
              { waitMs: 1800, checks: [{ type: 'xChanged', dir: '+' }] }
            ]
          }
        },
        {
          title: '✅ Try it!',
          text: 'Click the <strong>green flag ▶</strong>. The sprite should slide right five times, then show a speech bubble saying "Done!".<br><br><strong>Challenge:</strong> Change <code>count < 5</code> to <code>count < 10</code>. Or count backwards - start at <code>count = 10</code> and use <code>while count > 0</code>, subtracting 1 each time.',
          starter: null, target: null, newLines: [], requires: []
        }
      ]
    },
    {
      id: 'left-right-movement',
      title: 'Left & Right Movement',
      emoji: '🎮',
      desc: 'Make your sprite walk left and right with the arrow keys, facing the correct direction and bouncing off the edges.',
      steps: [
        {
          title: 'The game loop',
          text: 'Type the game loop. <code>set_rotation_style("left-right")</code> before the loop means the sprite only flips horizontally, never tilting upside-down.',
          starter: '',
          target: 'def game_start():\n    set_rotation_style("left-right")\n    while True:',
          newLines: ['def game_start():', '    set_rotation_style("left-right")', '    while True:'],
          requires: ['def game_start():', '    set_rotation_style("left-right")', '    while True:'],
          suppressErrors: ['struct']
        },
        {
          title: 'Move right',
          text: 'Add a right-key check inside the loop. <code>change_x(5)</code> moves 5 pixels right each frame. <code>point_in_direction(90)</code> faces the sprite right.',
          starter: 'def game_start():\n    set_rotation_style("left-right")\n    while True:',
          target: 'def game_start():\n    set_rotation_style("left-right")\n    while True:\n        if key_pressed("right"):\n            change_x(5)\n            point_in_direction(90)',
          newLines: ['        if key_pressed("right"):', '            change_x(5)', '            point_in_direction(90)'],
          requires: ['        if key_pressed("right"):', '            change_x(5)', '            point_in_direction(90)'],
          behaviorCheck: {
            hint: 'Hold the right arrow key - the sprite should move right. Check your <code>if key_pressed("right"):</code> block.',
            setupMs: 400,
            scenarios: [
              { label: 'right key moves sprite right', holdKey: 'right', durationMs: 400,
                checks: [{ type: 'xChanged', dir: '+' }] }
            ]
          }
        },
        {
          title: 'Move left',
          text: 'Add a second <code>if</code> block below. <code>change_x(-5)</code> moves left. <code>point_in_direction(-90)</code> flips the sprite to face left.',
          starter: 'def game_start():\n    set_rotation_style("left-right")\n    while True:\n        if key_pressed("right"):\n            change_x(5)\n            point_in_direction(90)',
          target: 'def game_start():\n    set_rotation_style("left-right")\n    while True:\n        if key_pressed("right"):\n            change_x(5)\n            point_in_direction(90)\n        if key_pressed("left"):\n            change_x(-5)\n            point_in_direction(-90)',
          newLines: ['        if key_pressed("left"):', '            change_x(-5)', '            point_in_direction(-90)'],
          requires: ['        if key_pressed("left"):', '            change_x(-5)', '            point_in_direction(-90)'],
          behaviorCheck: {
            hint: 'Check both arrow keys work - right should move the sprite right, left should move it left.',
            setupMs: 400,
            scenarios: [
              { label: 'right key moves sprite right', holdKey: 'right', durationMs: 400,
                checks: [{ type: 'xChanged', dir: '+' }] },
              { label: 'left key moves sprite left', holdKey: 'left', durationMs: 400,
                checks: [{ type: 'xChanged', dir: '-' }] }
            ]
          }
        },
        {
          title: '✅ Try it!',
          text: 'Click the <strong>green flag ▶</strong> and press the arrow keys. Your sprite should move and face the right way - Scratch keeps it on screen automatically.<br><br><strong>Challenge:</strong> Add up and down movement with <code>change_y(5)</code> and <code>change_y(-5)</code>.',
          starter: null, target: null, newLines: [], requires: []
        }
      ]
    },
    {
      id: 'costume-animation',
      title: 'Costume Animation',
      emoji: '🎭',
      desc: 'Animate your sprite through its costumes when it moves and snap back to the idle pose when still.',
      steps: [
        {
          title: 'Starting point',
          text: 'The movement code has been loaded for you - read through it before continuing. Notice the structure: rotation style, loop, two if blocks, and <code>if_on_edge_bounce()</code> to keep the sprite on screen.<br><br>⚠️ Make sure your sprite has <strong>at least 2 costumes</strong>.',
          starter: 'def game_start():\n    set_rotation_style("left-right")\n    while True:\n        if key_pressed("right"):\n            change_x(5)\n            point_in_direction(90)\n        if key_pressed("left"):\n            change_x(-5)\n            point_in_direction(-90)\n        if_on_edge_bounce()',
          target: null, newLines: [], requires: []
        },
        {
          title: 'Animate while moving',
          text: 'Add <code>next_costume()</code> inside <strong>both</strong> if blocks, after each <code>point_in_direction</code> line. Each frame the key is held, the sprite advances one costume.',
          starter: 'def game_start():\n    set_rotation_style("left-right")\n    while True:\n        if key_pressed("right"):\n            change_x(5)\n            point_in_direction(90)\n        if key_pressed("left"):\n            change_x(-5)\n            point_in_direction(-90)\n        if_on_edge_bounce()',
          target: 'def game_start():\n    set_rotation_style("left-right")\n    while True:\n        if key_pressed("right"):\n            change_x(5)\n            point_in_direction(90)\n            next_costume()\n        if key_pressed("left"):\n            change_x(-5)\n            point_in_direction(-90)\n            next_costume()\n        if_on_edge_bounce()',
          newLines: ['            next_costume()', '            next_costume()'],
          requires: [{ req: '            next_costume()', count: 2, label: 'next_costume() in both if blocks' }],
          behaviorCheck: {
            hint: 'Hold the right arrow key - the sprite should move right. Check both <code>next_costume()</code> calls are inside their if blocks.',
            setupMs: 400,
            scenarios: [
              { label: 'right key moves sprite right', holdKey: 'right', durationMs: 400,
                checks: [{ type: 'xChanged', dir: '+' }] }
            ]
          }
        },
        {
          title: 'Idle pose when still',
          text: 'Right now the sprite freezes mid-walk when you stop. Add a <code>moved</code> flag - set it <code>True</code> inside each key block, then use it to either animate or snap to costume 1:',
          starter: 'def game_start():\n    set_rotation_style("left-right")\n    while True:\n        if key_pressed("right"):\n            change_x(5)\n            point_in_direction(90)\n            next_costume()\n        if key_pressed("left"):\n            change_x(-5)\n            point_in_direction(-90)\n            next_costume()\n        if_on_edge_bounce()',
          target: 'def game_start():\n    set_rotation_style("left-right")\n    while True:\n        moved = False\n        if key_pressed("right"):\n            change_x(5)\n            point_in_direction(90)\n            moved = True\n        if key_pressed("left"):\n            change_x(-5)\n            point_in_direction(-90)\n            moved = True\n        if moved:\n            next_costume()\n        else:\n            set_costume(1)\n        if_on_edge_bounce()',
          newLines: ['        moved = False', '            moved = True', '        if moved:', '            next_costume()', '        else:', '            set_costume(1)'],
          requires: ['moved = False', { req: '            moved = True', count: 2, label: 'moved = True in both if blocks' }, '        if moved:', '            next_costume()', 'set_costume(1)'],
          behaviorCheck: {
            hint: 'Hold the right arrow key - the sprite should move right. Check <code>moved = True</code> is in both if blocks.',
            setupMs: 400,
            scenarios: [
              { label: 'right key moves sprite right', holdKey: 'right', durationMs: 400,
                checks: [{ type: 'xChanged', dir: '+' }] }
            ]
          }
        },
        {
          title: 'Control animation speed',
          text: 'Costumes are changing every frame - too fast. Add <code>wait(0.08)</code> before <code>if_on_edge_bounce()</code> to cap animation at about 12 changes per second.',
          starter: 'def game_start():\n    set_rotation_style("left-right")\n    while True:\n        moved = False\n        if key_pressed("right"):\n            change_x(5)\n            point_in_direction(90)\n            moved = True\n        if key_pressed("left"):\n            change_x(-5)\n            point_in_direction(-90)\n            moved = True\n        if moved:\n            next_costume()\n        else:\n            set_costume(1)\n        if_on_edge_bounce()',
          target: 'def game_start():\n    set_rotation_style("left-right")\n    while True:\n        moved = False\n        if key_pressed("right"):\n            change_x(5)\n            point_in_direction(90)\n            moved = True\n        if key_pressed("left"):\n            change_x(-5)\n            point_in_direction(-90)\n            moved = True\n        if moved:\n            next_costume()\n        else:\n            set_costume(1)\n        wait(0.08)\n        if_on_edge_bounce()',
          newLines: ['        wait(0.08)'],
          requires: ['wait(0.08)'],
          behaviorCheck: {
            hint: 'Hold the right arrow key - the sprite should still move right. Check the overall code structure is intact after adding <code>wait(0.08)</code>.',
            setupMs: 400,
            scenarios: [
              { label: 'right key moves sprite right', holdKey: 'right', durationMs: 500,
                checks: [{ type: 'xChanged', dir: '+' }] }
            ]
          }
        },
        {
          title: '✅ Try it!',
          text: 'Click the <strong>green flag ▶</strong> and walk left and right - your sprite should animate while moving and snap to idle when still.<br><br><strong>Challenge:</strong> Try <code>wait(0.2)</code> for a slow walk or <code>wait(0.04)</code> for a sprint.',
          starter: null, target: null, newLines: [], requires: []
        }
      ]
    },
    {
      id: 'gravity',
      title: 'Gravity & Jumping',
      emoji: '⬇️',
      desc: 'Add a velocity variable, pull the sprite down each frame, and let the player jump by pressing the up arrow.',
      steps: [
        {
          title: 'Create the velocity variable',
          text: 'Type <code>vy = 0</code> at the very top of the editor, before any function. <code>vy</code> is the vertical velocity: positive moves up, negative moves down. Starting at 0 means the sprite is stationary.',
          starter: '',
          target: 'vy = 0\n\ndef game_start():',
          newLines: ['vy = 0', '', 'def game_start():'],
          requires: ['vy = 0', 'def game_start():'],
          suppressErrors: ['struct']
        },
        {
          title: 'The game loop with global',
          text: 'Add <code>global vy</code> and <code>while True:</code> inside the function. Without <code>global</code>, Python would create a new local copy of <code>vy</code> instead of using the one you just created.',
          starter: 'vy = 0\n\ndef game_start():',
          target: 'vy = 0\n\ndef game_start():\n    global vy\n    while True:',
          newLines: ['    global vy', '    while True:'],
          requires: ['    global vy', '    while True:'],
          suppressErrors: ['struct']
        },
        {
          title: 'Apply gravity',
          text: 'Each frame, subtract 0.5 from <code>vy</code> (it becomes more negative = faster downward), then move the sprite by that amount. Add both lines inside the loop:',
          starter: 'vy = 0\n\ndef game_start():\n    global vy\n    while True:',
          target: 'vy = 0\n\ndef game_start():\n    global vy\n    while True:\n        vy = vy - 0.5\n        change_y(vy)',
          newLines: ['        vy = vy - 0.5', '        change_y(vy)'],
          requires: ['        vy = vy - 0.5', '        change_y(vy)'],
          behaviorCheck: {
            hint: 'Run your code - the sprite should fall downward automatically. Check <code>vy = vy - 0.5</code> and <code>change_y(vy)</code> are both inside the loop.',
            setupMs: 200,
            scenarios: [
              { waitMs: 700, checks: [{ type: 'yChanged', dir: '-' }] }
            ]
          }
        },
        {
          title: 'Add a floor',
          text: 'Without a floor the sprite falls forever. When it drops below y = −150, reset velocity to 0 and snap it back:',
          starter: 'vy = 0\n\ndef game_start():\n    global vy\n    while True:\n        vy = vy - 0.5\n        change_y(vy)',
          target: 'vy = 0\n\ndef game_start():\n    global vy\n    while True:\n        vy = vy - 0.5\n        change_y(vy)\n        if y_position() < -150:\n            vy = 0\n            set_y(-150)',
          newLines: ['        if y_position() < -150:', '            vy = 0', '            set_y(-150)'],
          requires: ['        if y_position() < -150:', '            set_y(-150)'],
          behaviorCheck: {
            hint: 'Run your code - the sprite should fall and land at y = −150 without falling off-screen. Check your <code>if y_position() &lt; -150:</code> block.',
            setupMs: 1000,
            scenarios: [
              { waitMs: 100, checks: [{ type: 'yAbove', value: -160 }] }
            ]
          }
        },
        {
          title: 'Jumping',
          text: 'When the sprite is on the floor <em>and</em> the up key is pressed, set <code>vy</code> to 8 - this launches it upward. Gravity pulls it back down automatically:',
          starter: 'vy = 0\n\ndef game_start():\n    global vy\n    while True:\n        vy = vy - 0.5\n        change_y(vy)\n        if y_position() < -150:\n            vy = 0\n            set_y(-150)',
          target: 'vy = 0\n\ndef game_start():\n    global vy\n    while True:\n        vy = vy - 0.5\n        change_y(vy)\n        if y_position() < -150:\n            vy = 0\n            set_y(-150)\n        if key_pressed("up") and y_position() <= -149:\n            vy = 8',
          newLines: ['        if key_pressed("up") and y_position() <= -149:', '            vy = 8'],
          requires: ['        if key_pressed("up")', '            vy = 8'],
          behaviorCheck: {
            hint: 'Press the up arrow - the sprite should jump upward from the floor. Check your <code>if key_pressed("up")</code> block and <code>vy = 8</code>.',
            setupMs: 800,
            scenarios: [
              { label: 'up key launches sprite upward', holdKey: 'up', durationMs: 80, waitMs: 300,
                checks: [{ type: 'yAbove', value: -135 }] }
            ]
          }
        },
        {
          title: '✅ Try it!',
          text: 'Click the <strong>green flag ▶</strong> and press the up arrow to jump. The sprite should fall with gravity, land, and jump on command.<br><br><strong>Challenge:</strong> Add left and right movement: <code>if key_pressed("right"): change_x(4)</code> and the same for left.',
          starter: null, target: null, newLines: [], requires: []
        }
      ]
    },
    {
      id: 'bouncing-ball',
      title: 'Bouncing Ball',
      emoji: '🎱',
      desc: 'Make a sprite bounce around the stage by tracking its speed with variables and reversing direction when it hits a wall.',
      steps: [
        {
          title: 'Set up the velocity variables',
          text: 'A bouncing ball needs to track speed in both directions. <code>vx</code> is horizontal speed (positive = right), <code>vy</code> is vertical speed (positive = up). Type both at the top of the editor:',
          starter: '',
          target: 'vx = 3\nvy = 3\n\ndef game_start():',
          newLines: ['vx = 3', 'vy = 3', '', 'def game_start():'],
          requires: ['vx = 3', 'vy = 3', 'def game_start():'],
          suppressErrors: ['struct']
        },
        {
          title: 'Move every frame',
          text: 'Add the game loop. Each frame, move the sprite by <code>vx</code> horizontally and <code>vy</code> vertically. <code>global vx, vy</code> lets the loop change both variables later when bouncing:',
          starter: 'vx = 3\nvy = 3\n\ndef game_start():',
          target: 'vx = 3\nvy = 3\n\ndef game_start():\n    global vx, vy\n    while True:\n        change_x(vx)\n        change_y(vy)',
          newLines: ['    global vx, vy', '    while True:', '        change_x(vx)', '        change_y(vy)'],
          requires: ['    global vx, vy', '    while True:', '        change_x(vx)', '        change_y(vy)'],
          behaviorCheck: {
            hint: 'Run your code - the ball should move automatically. Check <code>change_x(vx)</code> and <code>change_y(vy)</code> are inside the loop.',
            setupMs: 100,
            scenarios: [
              { waitMs: 500, checks: [{ type: 'moved' }] }
            ]
          }
        },
        {
          title: 'Bounce off left and right walls',
          text: 'When the ball hits the left or right edge, reverse its horizontal direction by flipping the sign of <code>vx</code>. Multiplying by <code>-1</code> turns 3 into -3 and vice versa:',
          starter: 'vx = 3\nvy = 3\n\ndef game_start():\n    global vx, vy\n    while True:\n        change_x(vx)\n        change_y(vy)',
          target: 'vx = 3\nvy = 3\n\ndef game_start():\n    global vx, vy\n    while True:\n        change_x(vx)\n        change_y(vy)\n        if x_position() > 220 or x_position() < -220:\n            vx = vx * -1',
          newLines: ['        if x_position() > 220 or x_position() < -220:', '            vx = vx * -1'],
          requires: ['        if x_position() > 220 or x_position() < -220:', '            vx = vx * -1'],
          behaviorCheck: {
            hint: 'Run your code - the ball should bounce back from the left and right walls, staying on screen. Check your <code>if x_position()</code> block.',
            setupMs: 100,
            scenarios: [
              { waitMs: 2500, checks: [{ type: 'xAbove', value: -225 }, { type: 'xBelow', value: 225 }] }
            ]
          }
        },
        {
          title: 'Bounce off top and bottom',
          text: 'Do the same for the top and bottom edges - flip <code>vy</code> when the ball goes above or below the stage:',
          starter: 'vx = 3\nvy = 3\n\ndef game_start():\n    global vx, vy\n    while True:\n        change_x(vx)\n        change_y(vy)\n        if x_position() > 220 or x_position() < -220:\n            vx = vx * -1',
          target: 'vx = 3\nvy = 3\n\ndef game_start():\n    global vx, vy\n    while True:\n        change_x(vx)\n        change_y(vy)\n        if x_position() > 220 or x_position() < -220:\n            vx = vx * -1\n        if y_position() > 160 or y_position() < -160:\n            vy = vy * -1',
          newLines: ['        if y_position() > 160 or y_position() < -160:', '            vy = vy * -1'],
          requires: ['        if y_position() > 160 or y_position() < -160:', '            vy = vy * -1'],
          behaviorCheck: {
            hint: 'Run your code - the ball should bounce off all four walls and stay on screen. Check your <code>if y_position()</code> block.',
            setupMs: 100,
            scenarios: [
              { waitMs: 3500, checks: [
                  { type: 'xAbove', value: -225 }, { type: 'xBelow', value: 225 },
                  { type: 'yAbove', value: -165 }, { type: 'yBelow', value: 165 }
              ]}
            ]
          }
        },
        {
          title: '✅ Try it!',
          text: 'Click the <strong>green flag ▶</strong>. The ball should bounce around forever without escaping.<br><br><strong>Challenge:</strong> Change <code>vx = 3</code> and <code>vy = 3</code> to different numbers so the ball takes a less predictable path. Try <code>vx = 4</code> and <code>vy = 3</code>. Can you add a second bouncing sprite?',
          starter: null, target: null, newLines: [], requires: []
        }
      ]
    },
    {
      id: 'flappy-bird',
      title: 'Flappy Bird',
      emoji: '🐦',
      desc: 'Build the Flappy Bird mechanic - gravity, tap-to-flap, tilting, and a pipe sprite that loops across the screen. You\'ll use two sprites: one for the bird, one for the pipe.',
      steps: [
        {
          title: 'Set up the velocity variable',
          text: 'Flappy Bird is all about vertical velocity. Type <code>vy = 0</code> before the function. The bird starts stationary and gravity pulls it down from there.',
          starter: '',
          target: 'vy = 0\n\ndef game_start():',
          newLines: ['vy = 0', '', 'def game_start():'],
          requires: ['vy = 0', 'def game_start():'],
          suppressErrors: ['struct']
        },
        {
          title: 'Apply gravity',
          text: 'Add the game loop with <code>global vy</code> so gravity can update the velocity each frame, then move the sprite by it:',
          starter: 'vy = 0\n\ndef game_start():',
          target: 'vy = 0\n\ndef game_start():\n    global vy\n    while True:\n        vy = vy - 0.3\n        change_y(vy)',
          newLines: ['    global vy', '    while True:', '        vy = vy - 0.3', '        change_y(vy)'],
          requires: ['    global vy', '    while True:', '        vy = vy - 0.3', '        change_y(vy)'],
          behaviorCheck: {
            hint: 'Run your code - the bird should fall downward automatically. Check <code>vy = vy - 0.3</code> and <code>change_y(vy)</code> are inside the loop.',
            setupMs: 200,
            scenarios: [
              { waitMs: 600, checks: [{ type: 'yChanged', dir: '-' }] }
            ]
          }
        },
        {
          title: 'Add a floor and ceiling',
          text: 'Without limits the bird falls forever or flies off screen. Add both boundaries - floor at y = −150 and ceiling at y = 150:',
          starter: 'vy = 0\n\ndef game_start():\n    global vy\n    while True:\n        vy = vy - 0.3\n        change_y(vy)',
          target: 'vy = 0\n\ndef game_start():\n    global vy\n    while True:\n        vy = vy - 0.3\n        change_y(vy)\n        if y_position() < -150:\n            set_y(-150)\n            vy = 0\n        if y_position() > 150:\n            set_y(150)\n            vy = 0',
          newLines: ['        if y_position() < -150:', '            set_y(-150)', '            vy = 0', '        if y_position() > 150:', '            set_y(150)', '            vy = 0'],
          requires: ['y_position() < -150', 'y_position() > 150'],
          behaviorCheck: {
            hint: 'Run your code - the bird should fall and land at y = −150 without going off-screen. Check both your floor and ceiling <code>if</code> blocks.',
            setupMs: 900,
            scenarios: [
              { waitMs: 100, checks: [{ type: 'yAbove', value: -155 }] }
            ]
          }
        },
        {
          title: 'Flap with the Space key',
          text: 'In Flappy Bird the player <strong>taps</strong> - not holds - a key. <code>when_key_pressed</code> fires <em>once</em> per tap, unlike <code>key_pressed()</code> which is true every frame the key is held down. Add a new function <strong>below</strong> <code>game_start</code>:',
          starter: 'vy = 0\n\ndef game_start():\n    global vy\n    while True:\n        vy = vy - 0.3\n        change_y(vy)\n        if y_position() < -150:\n            set_y(-150)\n            vy = 0\n        if y_position() > 150:\n            set_y(150)\n            vy = 0',
          target: 'vy = 0\n\ndef game_start():\n    global vy\n    while True:\n        vy = vy - 0.3\n        change_y(vy)\n        if y_position() < -150:\n            set_y(-150)\n            vy = 0\n        if y_position() > 150:\n            set_y(150)\n            vy = 0\n\ndef when_key_pressed(key):\n    global vy\n    if key == "space":\n        vy = 5',
          newLines: ['def when_key_pressed(key):', '    global vy', '    if key == "space":', '        vy = 5'],
          requires: ['def when_key_pressed(key):', 'if key == "space":', 'vy = 5'],
          behaviorCheck: {
            hint: 'Press Space - the bird should flap upward from the floor. Check your <code>when_key_pressed</code> function and <code>vy = 5</code>.',
            setupMs: 800,
            scenarios: [
              { label: 'space key flaps bird upward', holdKey: 'space', durationMs: 80, waitMs: 300,
                checks: [{ type: 'yAbove', value: -130 }] }
            ]
          }
        },
        {
          title: 'Tilt with velocity',
          text: 'A real Flappy Bird tilts up when rising and droops when falling. Add <code>set_rotation_style("all around")</code> before the loop, then tilt based on <code>vy</code> inside it:',
          starter: 'vy = 0\n\ndef game_start():\n    global vy\n    while True:\n        vy = vy - 0.3\n        change_y(vy)\n        if y_position() < -150:\n            set_y(-150)\n            vy = 0\n        if y_position() > 150:\n            set_y(150)\n            vy = 0\n\ndef when_key_pressed(key):\n    global vy\n    if key == "space":\n        vy = 5',
          target: 'vy = 0\n\ndef game_start():\n    global vy\n    set_rotation_style("all around")\n    while True:\n        vy = vy - 0.3\n        change_y(vy)\n        if vy > 0:\n            point_in_direction(-20)\n        else:\n            point_in_direction(20)\n        if y_position() < -150:\n            set_y(-150)\n            vy = 0\n        if y_position() > 150:\n            set_y(150)\n            vy = 0\n\ndef when_key_pressed(key):\n    global vy\n    if key == "space":\n        vy = 5',
          newLines: ['    set_rotation_style("all around")', '        if vy > 0:', '            point_in_direction(-20)', '        else:', '            point_in_direction(20)'],
          requires: ['set_rotation_style("all around")', 'point_in_direction(-20)', 'point_in_direction(20)']
        },
        {
          title: 'Add your obstacle sprite',
          text: 'Threads let one sprite do multiple things at once - but an obstacle is a <strong>completely different object</strong> in the game. It needs its own sprite with its own position.<br><br>Click the glowing <strong>sprite panel</strong> at the bottom of TurboWarp and add a new sprite. Choose anything - a ball, a block, a drawn shape - as long as it\'s something to dodge. Then click your new sprite to select it.',
          highlight: 'add-sprite-btn',
          highlightLabel: 'Add a sprite here',
          requiresSpriteCount: 2,
          requiresSpriteHint: 'Add a new sprite using the highlighted buttons',
          starter: null,
          target: null,
          newLines: [],
          requires: []
        },
        {
          title: 'Move the obstacle left',
          text: 'You\'re now editing the <strong>obstacle sprite\'s</strong> code. Start it off-screen to the right at a <strong>random height</strong> using <code>pick_random</code>, then slide it left every frame:',
          starter: '',
          target: 'def game_start():\n    go_to_xy(240, pick_random(-100, 100))\n    while True:\n        change_x(-3)',
          newLines: ['def game_start():', '    go_to_xy(240, pick_random(-100, 100))', '    while True:', '        change_x(-3)'],
          requires: ['go_to_xy(240', 'pick_random(-100, 100)', 'change_x(-3)']
        },
        {
          title: 'Loop back at a new random height',
          text: 'When the obstacle slides past the left edge, reset it to the right at another <strong>random height</strong>. Each pass the player has to dodge a different position:',
          starter: 'def game_start():\n    go_to_xy(240, pick_random(-100, 100))\n    while True:\n        change_x(-3)',
          target: 'def game_start():\n    go_to_xy(240, pick_random(-100, 100))\n    while True:\n        change_x(-3)\n        if x_position() < -260:\n            go_to_xy(260, pick_random(-100, 100))',
          newLines: ['        if x_position() < -260:', '            go_to_xy(260, pick_random(-100, 100))'],
          requires: ['x_position() < -260', 'go_to_xy(260', 'pick_random(-100, 100)']
        },
        {
          title: '✅ Try it!',
          text: 'Click the <strong>green flag ▶</strong> and tap <strong>Space</strong> to flap. The bird should fall with gravity, tilt with velocity, and a pipe should scroll across from right to left on a loop.<br><br><strong>Challenge:</strong> Give the pipe sprite a tall thin costume so it actually looks like a pipe. Try <code>go_to_xy(pick_random(200, 280), pick_random(-80, 80))</code> when resetting so each pipe appears at a random height.',
          starter: null, target: null, newLines: [], requires: []
        }
      ]
    },
    {
      id: 'doodle-jump',
      title: 'Doodle Jump',
      emoji: '🦘',
      desc: 'Build the Doodle Jump mechanic - the character bounces upward automatically, moves left and right, and wraps around the screen edges.',
      steps: [
        {
          title: 'Starting velocity',
          text: 'In Doodle Jump the character immediately shoots upward. Set <code>vy = 8</code> (positive = upward) so it launches straight away - gravity will curve it back down.',
          starter: '',
          target: 'vy = 8\n\ndef game_start():',
          newLines: ['vy = 8', '', 'def game_start():'],
          requires: ['vy = 8', 'def game_start():'],
          suppressErrors: ['struct']
        },
        {
          title: 'Gravity',
          text: 'Add the game loop with <code>global vy</code>, apply gravity each frame, and move the sprite by the velocity:',
          starter: 'vy = 8\n\ndef game_start():',
          target: 'vy = 8\n\ndef game_start():\n    global vy\n    while True:\n        vy = vy - 0.4\n        change_y(vy)',
          newLines: ['    global vy', '    while True:', '        vy = vy - 0.4', '        change_y(vy)'],
          requires: ['    global vy', '    while True:', '        vy = vy - 0.4', '        change_y(vy)']
        },
        {
          title: 'Bounce off the floor',
          text: 'Instead of stopping at the floor like in the gravity tutorial, set <code>vy</code> back to <code>8</code> when the sprite lands - this launches it upward again automatically:',
          starter: 'vy = 8\n\ndef game_start():\n    global vy\n    while True:\n        vy = vy - 0.4\n        change_y(vy)',
          target: 'vy = 8\n\ndef game_start():\n    global vy\n    while True:\n        vy = vy - 0.4\n        change_y(vy)\n        if y_position() < -150:\n            set_y(-150)\n            vy = 8',
          newLines: ['        if y_position() < -150:', '            set_y(-150)', '            vy = 8'],
          requires: ['y_position() < -150', '            set_y(-150)', '            vy = 8']
        },
        {
          title: 'Left and right movement',
          text: 'Add horizontal controls. <code>set_rotation_style("left-right")</code> goes before the loop so the sprite only flips - it never tilts:',
          starter: 'vy = 8\n\ndef game_start():\n    global vy\n    while True:\n        vy = vy - 0.4\n        change_y(vy)\n        if y_position() < -150:\n            set_y(-150)\n            vy = 8',
          target: 'vy = 8\n\ndef game_start():\n    global vy\n    set_rotation_style("left-right")\n    while True:\n        vy = vy - 0.4\n        change_y(vy)\n        if y_position() < -150:\n            set_y(-150)\n            vy = 8\n        if key_pressed("right"):\n            change_x(4)\n            point_in_direction(90)\n        if key_pressed("left"):\n            change_x(-4)\n            point_in_direction(-90)',
          newLines: ['    set_rotation_style("left-right")', '        if key_pressed("right"):', '            change_x(4)', '            point_in_direction(90)', '        if key_pressed("left"):', '            change_x(-4)', '            point_in_direction(-90)'],
          requires: ['set_rotation_style("left-right")', 'key_pressed("right")', 'key_pressed("left")', 'change_x(4)', 'change_x(-4)']
        },
        {
          title: 'Wrap around the screen',
          text: 'In Doodle Jump, going off the left edge brings you back on the right and vice versa. Add checks for both horizontal edges:',
          starter: 'vy = 8\n\ndef game_start():\n    global vy\n    set_rotation_style("left-right")\n    while True:\n        vy = vy - 0.4\n        change_y(vy)\n        if y_position() < -150:\n            set_y(-150)\n            vy = 8\n        if key_pressed("right"):\n            change_x(4)\n            point_in_direction(90)\n        if key_pressed("left"):\n            change_x(-4)\n            point_in_direction(-90)',
          target: 'vy = 8\n\ndef game_start():\n    global vy\n    set_rotation_style("left-right")\n    while True:\n        vy = vy - 0.4\n        change_y(vy)\n        if y_position() < -150:\n            set_y(-150)\n            vy = 8\n        if key_pressed("right"):\n            change_x(4)\n            point_in_direction(90)\n        if key_pressed("left"):\n            change_x(-4)\n            point_in_direction(-90)\n        if x_position() > 240:\n            set_x(-240)\n        if x_position() < -240:\n            set_x(240)',
          newLines: ['        if x_position() > 240:', '            set_x(-240)', '        if x_position() < -240:', '            set_x(240)'],
          requires: ['x_position() > 240', 'set_x(-240)', 'x_position() < -240', 'set_x(240)']
        },
        {
          title: 'Add the platform sprite',
          text: 'Platforms are their own game object: they need a <strong>separate sprite</strong> with their own position and code. Click the highlighted button to add a new sprite, give it a <strong>flat wide rectangular costume</strong>, and name it <strong>Platform</strong>.',
          highlight: 'add-sprite-btn',
          highlightLabel: 'Add a sprite here',
          requiredSpriteNames: ['Platform'],
          requiredSpriteHints: { 'Platform': 'Add a sprite and name it "Platform"' },
          starter: null, target: null, newLines: [], requires: []
        },
        {
          title: 'Platform falls down',
          text: 'You\'re now editing the <strong>Platform sprite\'s</strong> code. Start it at a random horizontal position and make it fall steadily:',
          starter: '',
          target: 'def game_start():\n    go_to_xy(pick_random(-150, 150), 0)\n    while True:\n        change_y(-2)',
          newLines: ['def game_start():', '    go_to_xy(pick_random(-150, 150), 0)', '    while True:', '        change_y(-2)'],
          requires: ['go_to_xy(pick_random(-150, 150), 0)', 'change_y(-2)']
        },
        {
          title: 'Reset to the top',
          text: 'When the platform falls off the bottom, jump it back to the top at a new random x position so it loops forever:',
          starter: 'def game_start():\n    go_to_xy(pick_random(-150, 150), 0)\n    while True:\n        change_y(-2)',
          target: 'def game_start():\n    go_to_xy(pick_random(-150, 150), 0)\n    while True:\n        change_y(-2)\n        if y_position() < -185:\n            go_to_xy(pick_random(-150, 150), 185)',
          newLines: ['        if y_position() < -185:', '            go_to_xy(pick_random(-150, 150), 185)'],
          requires: ['y_position() < -185', 'go_to_xy(pick_random(-150, 150), 185)']
        },
        {
          title: 'Bounce on the platform',
          text: 'Click your <strong>player sprite</strong> in the sprite panel to switch back to its code. Add a check inside the loop - when the player is falling (<code>vy</code> is negative) and touching the platform, launch back up:',
          starter: null,
          target: '        if touching("Platform") and vy < 0:\n            vy = 8',
          newLines: ['        if touching("Platform") and vy < 0:', '            vy = 8'],
          requires: ['touching("Platform")', 'vy < 0']
        },
        {
          title: 'Add the death barrier',
          text: 'Add one more sprite as the death zone. Click the highlighted button, give it a <strong>wide flat costume</strong> that spans the full width of the stage, and name it <strong>Death</strong>. Position it at the very bottom of the stage.',
          highlight: 'add-sprite-btn',
          highlightLabel: 'Add a sprite here',
          requiredSpriteNames: ['Platform', 'Death'],
          requiredSpriteHints: { 'Death': 'Add a sprite and name it "Death"' },
          starter: null, target: null, newLines: [], requires: []
        },
        {
          title: 'Game over',
          text: 'Click your <strong>player sprite</strong> again. Add a game over check inside the loop - if the player touches the Death barrier, show a message and use <code>break</code> to exit the loop and stop the game:',
          starter: null,
          target: '        if touching("Death"):\n            say("Game Over!")\n            break',
          newLines: ['        if touching("Death"):', '            say("Game Over!")', '            break'],
          requires: ['touching("Death")', 'say("Game Over!")', 'break']
        },
        {
          title: '✅ Try it!',
          text: 'Click the <strong>green flag ▶</strong>. Bounce on the platform to stay alive - fall into the death zone and it\'s game over.<br><br><strong>Challenge:</strong> Add 2 or 3 more Platform sprites at different starting heights so there are always several platforms to land on. Try making them fall at different speeds using different values instead of <code>-2</code>.',
          starter: null, target: null, newLines: [], requires: []
        }
      ]
    },
    {
      emoji: '🦆',
      title: 'Duck Hunt',
      desc: 'A duck zigzags around the screen bouncing off every edge. Click it to shoot - score goes up and the duck reappears at a random new spot with a new speed.',
      steps: [
        {
          title: 'What are we building?',
          text: 'A Duck Hunt clone! The duck moves around the stage bouncing off every edge using two velocity variables. Click the duck with your mouse to shoot it - the score goes up and the duck teleports to a new random location at a new speed.<br><br>You only need <strong>one sprite</strong>: the duck. The Score variable is created by <code>set_variable("Score", 0)</code> and shown on screen by <code>display_variable("Score", True)</code>.',
          starter: null, target: null, newLines: [], requires: []
        },
        {
          title: 'Velocity variables and game loop',
          text: '<code>vx</code> controls left/right speed, <code>vy</code> controls up/down speed. Both are global so <code>when_clicked</code> can change them too. <code>go_to_xy(0, 50)</code> places the duck centre-screen at the start:',
          starter: '',
          target: 'vx = 3\nvy = 2\n\ndef game_start():\n    global vx, vy\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    set_rotation_style("left-right")\n    go_to_xy(0, 50)\n    while True:',
          newLines: ['vx = 3', 'vy = 2', '', 'def game_start():', '    global vx, vy', '    set_variable("Score", 0)', '    display_variable("Score", True)', '    set_rotation_style("left-right")', '    go_to_xy(0, 50)', '    while True:'],
          requires: ['vx = 3', 'vy = 2', 'def game_start():', 'global vx, vy', 'set_variable("Score"', 'display_variable("Score"', 'while True:'],
          suppressErrors: ['struct']
        },
        {
          title: 'Make the duck fly',
          text: 'Each frame, move the duck by its current velocity. Add both lines inside the <code>while True:</code> loop:',
          starter: 'vx = 3\nvy = 2\n\ndef game_start():\n    global vx, vy\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    set_rotation_style("left-right")\n    go_to_xy(0, 50)\n    while True:',
          target: 'vx = 3\nvy = 2\n\ndef game_start():\n    global vx, vy\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    set_rotation_style("left-right")\n    go_to_xy(0, 50)\n    while True:\n        change_x(vx)\n        change_y(vy)',
          newLines: ['        change_x(vx)', '        change_y(vy)'],
          requires: ['change_x(vx)', 'change_y(vy)']
        },
        {
          title: 'Bounce off the edges',
          text: 'When the duck reaches the left or right edge, flip <code>vx</code> - multiplying by <code>-1</code> reverses the sign so it bounces back. Do the same for top and bottom with <code>vy</code>:',
          starter: 'vx = 3\nvy = 2\n\ndef game_start():\n    global vx, vy\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    set_rotation_style("left-right")\n    go_to_xy(0, 50)\n    while True:\n        change_x(vx)\n        change_y(vy)',
          target: 'vx = 3\nvy = 2\n\ndef game_start():\n    global vx, vy\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    set_rotation_style("left-right")\n    go_to_xy(0, 50)\n    while True:\n        change_x(vx)\n        change_y(vy)\n        if x_position() > 220 or x_position() < -220:\n            vx = vx * -1\n        if y_position() > 150 or y_position() < -130:\n            vy = vy * -1',
          newLines: ['        if x_position() > 220 or x_position() < -220:', '            vx = vx * -1', '        if y_position() > 150 or y_position() < -130:', '            vy = vy * -1'],
          requires: ['x_position() > 220', 'x_position() < -220', 'vx = vx * -1', 'y_position() > 150', 'vy = vy * -1']
        },
        {
          title: 'Make the duck face where it\'s flying',
          text: 'After flipping <code>vx</code>, check its new sign to face the duck the right way. <code>set_rotation_style("left-right")</code> (already set) means the sprite only ever flips, never tilts. Add these lines <strong>inside</strong> the <code>x_position</code> block, after <code>vx = vx * -1</code>:',
          starter: 'vx = 3\nvy = 2\n\ndef game_start():\n    global vx, vy\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    set_rotation_style("left-right")\n    go_to_xy(0, 50)\n    while True:\n        change_x(vx)\n        change_y(vy)\n        if x_position() > 220 or x_position() < -220:\n            vx = vx * -1\n        if y_position() > 150 or y_position() < -130:\n            vy = vy * -1',
          target: 'vx = 3\nvy = 2\n\ndef game_start():\n    global vx, vy\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    set_rotation_style("left-right")\n    go_to_xy(0, 50)\n    while True:\n        change_x(vx)\n        change_y(vy)\n        if x_position() > 220 or x_position() < -220:\n            vx = vx * -1\n            if vx > 0:\n                point_in_direction(90)\n            else:\n                point_in_direction(-90)\n        if y_position() > 150 or y_position() < -130:\n            vy = vy * -1',
          newLines: ['            if vx > 0:', '                point_in_direction(90)', '            else:', '                point_in_direction(-90)'],
          requires: ['vx > 0', 'point_in_direction(90)', 'point_in_direction(-90)']
        },
        {
          title: 'Shoot the duck on click',
          text: '<code>def when_clicked():</code> runs every time the player clicks the sprite. Hide the duck (shot!), wait briefly, then send it to a random new location at a random new speed so every duck is different to track:',
          starter: 'vx = 3\nvy = 2\n\ndef game_start():\n    global vx, vy\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    set_rotation_style("left-right")\n    go_to_xy(0, 50)\n    while True:\n        change_x(vx)\n        change_y(vy)\n        if x_position() > 220 or x_position() < -220:\n            vx = vx * -1\n            if vx > 0:\n                point_in_direction(90)\n            else:\n                point_in_direction(-90)\n        if y_position() > 150 or y_position() < -130:\n            vy = vy * -1',
          target: 'vx = 3\nvy = 2\n\ndef game_start():\n    global vx, vy\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    set_rotation_style("left-right")\n    go_to_xy(0, 50)\n    while True:\n        change_x(vx)\n        change_y(vy)\n        if x_position() > 220 or x_position() < -220:\n            vx = vx * -1\n            if vx > 0:\n                point_in_direction(90)\n            else:\n                point_in_direction(-90)\n        if y_position() > 150 or y_position() < -130:\n            vy = vy * -1\n\ndef when_clicked():\n    global vx, vy\n    change_variable("Score", 1)\n    hide()\n    wait(0.8)\n    go_to_xy(pick_random(-180, 180), pick_random(0, 120))\n    vx = pick_random(3, 6)\n    vy = pick_random(2, 4)\n    show()',
          newLines: ['def when_clicked():', '    global vx, vy', '    change_variable("Score", 1)', '    hide()', '    wait(0.8)', '    go_to_xy(pick_random(-180, 180), pick_random(0, 120))', '    vx = pick_random(3, 6)', '    vy = pick_random(2, 4)', '    show()'],
          requires: ['def when_clicked():', 'change_variable("Score"', 'hide()', 'wait(0.8)', 'go_to_xy(pick_random(', 'vx = pick_random(', 'show()']
        },
        {
          title: '✅ Try it!',
          text: 'Click the <strong>green flag ▶</strong>, then click the duck as fast as you can! Each hit scores a point and the duck respawns faster and in a new spot.<br><br><strong>Challenges:</strong><ul style="margin-top:0.5rem;padding-left:1.2rem"><li>Add a <code>shots = 3</code> variable - each click costs a shot, game over at 0 (<em>hint: use <code>set_variable("Shots", shots)</code></em>)</li><li>Make the duck speed up after each shot - add a small amount to <code>vx</code> and <code>vy</code> inside <code>when_clicked</code></li><li>Add a timer: use <code>timer()</code> to display how long the player survived before missing</li></ul>',
          starter: null, target: null, newLines: [], requires: []
        }
      ]
    },
    {
      emoji: '⚔️',
      title: 'RPG Survivor',
      desc: 'Enemies clone themselves and walk toward the player. Dodge with arrow keys, attack with space. Score goes up for each kill - survive as long as you can!',
      steps: [
        {
          title: 'What are we building?',
          text: 'An RPG survivor game using clones! Enemy clones spawn from the top of the screen and walk toward the player. Touching an enemy costs HP - attack back with <strong>space</strong> to kill them and earn score.<br><br>Before you start, <strong>rename your sprite to <code>Player</code></strong> using the name box below the stage - the enemy code looks for that name when it checks collisions.<br><br>The <code>HP</code> and <code>Score</code> counters appear on screen because your code calls <code>set_variable()</code> to create them and <code>display_variable()</code> to make them visible - no TurboWarp menus needed.',
          starter: null, target: null, newLines: [], requires: [],
          requiredSpriteNames: ['Player'],
          requiredSpriteHints: { 'Player': 'Rename your sprite to "Player"' }
        },
        {
          title: 'Player: HP variable and game loop',
          text: 'On your <strong>Player</strong> sprite, type this. <code>hp = 3</code> is a Python variable that tracks health. <code>set_variable("HP", hp)</code> creates the variable and keeps it in sync. <code>display_variable("HP", True)</code> makes it appear as an on-screen counter - without it the variable exists but stays invisible. The same pattern creates <em>Score</em>:',
          starter: null,
          target: 'hp = 3\n\ndef game_start():\n    global hp\n    set_variable("HP", hp)\n    display_variable("HP", True)\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    set_rotation_style("left-right")\n    while True:',
          newLines: ['hp = 3', '', 'def game_start():', '    global hp', '    set_variable("HP", hp)', '    display_variable("HP", True)', '    set_variable("Score", 0)', '    display_variable("Score", True)', '    set_rotation_style("left-right")', '    while True:'],
          requires: ['hp = 3', 'def game_start():', 'global hp', 'set_variable("HP"', 'display_variable("HP"', 'set_variable("Score"', 'display_variable("Score"', 'while True:'],
          suppressErrors: ['struct']
        },
        {
          title: 'Player: left and right movement',
          text: 'Add left and right movement inside the <code>while True:</code> loop. <code>point_in_direction</code> makes the sprite face the right way when it flips:',
          starter: 'hp = 3\n\ndef game_start():\n    global hp\n    set_variable("HP", hp)\n    display_variable("HP", True)\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    set_rotation_style("left-right")\n    while True:',
          target: 'hp = 3\n\ndef game_start():\n    global hp\n    set_variable("HP", hp)\n    display_variable("HP", True)\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    set_rotation_style("left-right")\n    while True:\n        if key_pressed("right"):\n            change_x(4)\n            point_in_direction(90)\n        if key_pressed("left"):\n            change_x(-4)\n            point_in_direction(-90)',
          newLines: ['        if key_pressed("right"):', '            change_x(4)', '            point_in_direction(90)', '        if key_pressed("left"):', '            change_x(-4)', '            point_in_direction(-90)'],
          requires: ['key_pressed("right")', 'change_x(4)', 'key_pressed("left")', 'change_x(-4)']
        },
        {
          title: 'Player: up and down movement',
          text: 'Add up and down movement so the player can dodge in all four directions:',
          starter: 'hp = 3\n\ndef game_start():\n    global hp\n    set_variable("HP", hp)\n    display_variable("HP", True)\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    set_rotation_style("left-right")\n    while True:\n        if key_pressed("right"):\n            change_x(4)\n            point_in_direction(90)\n        if key_pressed("left"):\n            change_x(-4)\n            point_in_direction(-90)',
          target: 'hp = 3\n\ndef game_start():\n    global hp\n    set_variable("HP", hp)\n    display_variable("HP", True)\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    set_rotation_style("left-right")\n    while True:\n        if key_pressed("right"):\n            change_x(4)\n            point_in_direction(90)\n        if key_pressed("left"):\n            change_x(-4)\n            point_in_direction(-90)\n        if key_pressed("up"):\n            change_y(4)\n        if key_pressed("down"):\n            change_y(-4)',
          newLines: ['        if key_pressed("up"):', '            change_y(4)', '        if key_pressed("down"):', '            change_y(-4)'],
          requires: ['key_pressed("up")', 'change_y(4)', 'key_pressed("down")', 'change_y(-4)']
        },
        {
          title: 'Player: take damage from enemies',
          text: 'When the player touches an enemy clone, reduce HP, update the display, then teleport to a random position. Add this after the movement checks inside the loop:',
          starter: 'hp = 3\n\ndef game_start():\n    global hp\n    set_variable("HP", hp)\n    display_variable("HP", True)\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    set_rotation_style("left-right")\n    while True:\n        if key_pressed("right"):\n            change_x(4)\n            point_in_direction(90)\n        if key_pressed("left"):\n            change_x(-4)\n            point_in_direction(-90)\n        if key_pressed("up"):\n            change_y(4)\n        if key_pressed("down"):\n            change_y(-4)',
          target: 'hp = 3\n\ndef game_start():\n    global hp\n    set_variable("HP", hp)\n    display_variable("HP", True)\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    set_rotation_style("left-right")\n    while True:\n        if key_pressed("right"):\n            change_x(4)\n            point_in_direction(90)\n        if key_pressed("left"):\n            change_x(-4)\n            point_in_direction(-90)\n        if key_pressed("up"):\n            change_y(4)\n        if key_pressed("down"):\n            change_y(-4)\n        if touching("Enemy"):\n            hp = hp - 1\n            set_variable("HP", hp)\n            go_to_xy(pick_random(-200, 200), pick_random(-140, 140))',
          newLines: ['        if touching("Enemy"):', '            hp = hp - 1', '            set_variable("HP", hp)', '            go_to_xy(pick_random(-200, 200), pick_random(-140, 140))'],
          requires: ['touching("Enemy")', 'hp = hp - 1', 'set_variable("HP"', 'go_to_xy(pick_random(']
        },
        {
          title: 'Player: game over at zero HP',
          text: 'Inside the <code>if touching("Enemy"):</code> block, after updating HP, check if the player has run out of health:',
          starter: 'hp = 3\n\ndef game_start():\n    global hp\n    set_variable("HP", hp)\n    display_variable("HP", True)\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    set_rotation_style("left-right")\n    while True:\n        if key_pressed("right"):\n            change_x(4)\n            point_in_direction(90)\n        if key_pressed("left"):\n            change_x(-4)\n            point_in_direction(-90)\n        if key_pressed("up"):\n            change_y(4)\n        if key_pressed("down"):\n            change_y(-4)\n        if touching("Enemy"):\n            hp = hp - 1\n            set_variable("HP", hp)\n            go_to_xy(pick_random(-200, 200), pick_random(-140, 140))',
          target: 'hp = 3\n\ndef game_start():\n    global hp\n    set_variable("HP", hp)\n    display_variable("HP", True)\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    set_rotation_style("left-right")\n    while True:\n        if key_pressed("right"):\n            change_x(4)\n            point_in_direction(90)\n        if key_pressed("left"):\n            change_x(-4)\n            point_in_direction(-90)\n        if key_pressed("up"):\n            change_y(4)\n        if key_pressed("down"):\n            change_y(-4)\n        if touching("Enemy"):\n            hp = hp - 1\n            set_variable("HP", hp)\n            go_to_xy(pick_random(-200, 200), pick_random(-140, 140))\n            if hp <= 0:\n                say("Game Over!")\n                stop()',
          newLines: ['            if hp <= 0:', '                say("Game Over!")', '                stop()'],
          requires: ['hp <= 0', 'say("Game Over!")', 'stop()']
        },
        {
          title: 'Player: attack with space',
          text: 'Pressing <strong>space</strong> broadcasts <code>"attack"</code> - enemy clones will listen for this and delete themselves if they are touching the player. Add this at the very end of the <code>while True</code> loop:',
          starter: 'hp = 3\n\ndef game_start():\n    global hp\n    set_variable("HP", hp)\n    display_variable("HP", True)\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    set_rotation_style("left-right")\n    while True:\n        if key_pressed("right"):\n            change_x(4)\n            point_in_direction(90)\n        if key_pressed("left"):\n            change_x(-4)\n            point_in_direction(-90)\n        if key_pressed("up"):\n            change_y(4)\n        if key_pressed("down"):\n            change_y(-4)\n        if touching("Enemy"):\n            hp = hp - 1\n            set_variable("HP", hp)\n            go_to_xy(pick_random(-200, 200), pick_random(-140, 140))\n            if hp <= 0:\n                say("Game Over!")\n                stop()',
          target: 'hp = 3\n\ndef game_start():\n    global hp\n    set_variable("HP", hp)\n    display_variable("HP", True)\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    set_rotation_style("left-right")\n    while True:\n        if key_pressed("right"):\n            change_x(4)\n            point_in_direction(90)\n        if key_pressed("left"):\n            change_x(-4)\n            point_in_direction(-90)\n        if key_pressed("up"):\n            change_y(4)\n        if key_pressed("down"):\n            change_y(-4)\n        if touching("Enemy"):\n            hp = hp - 1\n            set_variable("HP", hp)\n            go_to_xy(pick_random(-200, 200), pick_random(-140, 140))\n            if hp <= 0:\n                say("Game Over!")\n                stop()\n        if key_pressed("space"):\n            broadcast("attack")',
          newLines: ['        if key_pressed("space"):', '            broadcast("attack")'],
          requires: ['key_pressed("space")', 'broadcast("attack")']
        },
        {
          title: 'Add the Enemy sprite',
          text: 'Click the <strong>+</strong> button to add a new sprite. <strong>Name it exactly <code>Enemy</code></strong> - the player code uses <code>touching("Enemy")</code> to detect collisions, so spelling must match.',
          starter: null, target: null, newLines: [], requires: [],
          highlight: 'add-sprite-btn', highlightLabel: 'Add sprite here',
          requiredSpriteNames: ['Player', 'Enemy'],
          requiredSpriteHints: { 'Enemy': 'Add a sprite named "Enemy"' }
        },
        {
          title: 'Enemy: spawn clones every 2 seconds',
          text: 'Click your <strong>Enemy</strong> sprite. Clear the default code and type this. The original stays hidden and just spawns a new clone every 2 seconds:',
          starter: null,
          target: 'def game_start():\n    hide()\n    while True:\n        create_clone()\n        wait(2)',
          newLines: ['def game_start():', '    hide()', '    while True:', '        create_clone()', '        wait(2)'],
          requires: ['def game_start():', 'hide()', 'create_clone()', 'wait(2)']
        },
        {
          title: 'Enemy: clone appears and walks toward player',
          text: 'Each clone spawns at a random x position off the top of the screen, then chases the player. Add this below <code>game_start</code> (leave a blank line between them):',
          starter: 'def game_start():\n    hide()\n    while True:\n        create_clone()\n        wait(2)',
          target: 'def game_start():\n    hide()\n    while True:\n        create_clone()\n        wait(2)\n\ndef when_I_start_as_a_clone():\n    go_to_xy(pick_random(-240, 240), 190)\n    show()\n    while True:\n        point_towards("Player")\n        move_steps(2)',
          newLines: ['def when_I_start_as_a_clone():', '    go_to_xy(pick_random(-240, 240), 190)', '    show()', '    while True:', '        point_towards("Player")', '        move_steps(2)'],
          requires: ['def when_I_start_as_a_clone():', 'go_to_xy(pick_random(', 'show()', 'point_towards("Player")', 'move_steps(2)']
        },
        {
          title: 'Enemy: die when attacked',
          text: 'Each clone listens for the <code>"attack"</code> broadcast. If it receives it <em>while touching the player</em>, it adds 1 to the Score Scratch variable then deletes itself. <code>change_variable</code> adds to a Scratch variable directly without needing a Python <code>global</code>:',
          starter: 'def game_start():\n    hide()\n    while True:\n        create_clone()\n        wait(2)\n\ndef when_I_start_as_a_clone():\n    go_to_xy(pick_random(-240, 240), 190)\n    show()\n    while True:\n        point_towards("Player")\n        move_steps(2)',
          target: 'def game_start():\n    hide()\n    while True:\n        create_clone()\n        wait(2)\n\ndef when_I_start_as_a_clone():\n    go_to_xy(pick_random(-240, 240), 190)\n    show()\n    while True:\n        point_towards("Player")\n        move_steps(2)\n\ndef when_message_received(message):\n    if message == "attack":\n        if touching("Player"):\n            change_variable("Score", 1)\n            delete_clone()',
          newLines: ['def when_message_received(message):', '    if message == "attack":', '        if touching("Player"):', '            change_variable("Score", 1)', '            delete_clone()'],
          requires: ['def when_message_received(message):', 'message == "attack"', 'touching("Player")', 'change_variable("Score"', 'delete_clone()']
        },
        {
          title: '✅ Try it!',
          text: 'Click the <strong>green flag ▶</strong>. Move with arrow keys and press <strong>space</strong> when an enemy is right next to you to kill it.<br><br><strong>Challenges:</strong><ul style="margin-top:0.5rem;padding-left:1.2rem"><li>Make enemies spawn faster as Score increases - use <code>get_variable("Score")</code> to read the current score and reduce the <code>wait()</code></li><li>Make enemies move faster as the game goes on - increase <code>move_steps</code> based on Score</li><li>Add a second type of enemy with a different speed or size using another sprite and <code>create_clone_of("FastEnemy")</code></li></ul>',
          starter: null, target: null, newLines: [], requires: []
        }
      ]
    },

    // ── Apple Catcher ─────────────────────────────────────────────
    {
      cat: 'game',
      emoji: '🍎',
      title: 'Apple Catcher',
      desc: 'Catch falling apples with a basket. Move left and right to score - miss one and you lose a life. Two sprites, score and lives counters.',
      steps: [
        {
          title: 'What are we building?',
          text: 'An Apple Catcher game! Apples fall from the top and you move a basket to catch them.<br><br>Before you start: <strong>rename your sprite to <code>Catcher</code></strong> using the name box below the stage. The Apple sprite will use <code>touching("Catcher")</code> to detect a catch.',
          starter: null, target: null, newLines: [], requires: [],
          requiredSpriteNames: ['Catcher'],
          requiredSpriteHints: { 'Catcher': 'Rename your sprite to "Catcher"' }
        },
        {
          title: 'Catcher: position and variables',
          text: 'Write <code>game_start()</code> for the Catcher sprite. Place it at the bottom and create Score and Lives counters using <code>set_variable</code>:',
          starter: '',
          target: 'def game_start():\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    set_variable("Lives", 3)\n    display_variable("Lives", True)\n    go_to_xy(0, -140)\n    while True:',
          newLines: ['def game_start():', '    set_variable("Score", 0)', '    display_variable("Score", True)', '    set_variable("Lives", 3)', '    display_variable("Lives", True)', '    go_to_xy(0, -140)', '    while True:'],
          requires: ['def game_start():', 'set_variable("Score"', 'display_variable("Score"', 'set_variable("Lives"', 'display_variable("Lives"', 'go_to_xy(0, -140)', '    while True:'],
          suppressErrors: ['struct']
        },
        {
          title: 'Catcher: arrow key movement',
          text: 'Inside the loop, move the basket with the arrow keys. The <code>set_x</code> clamps stop it going off screen:',
          starter: 'def game_start():\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    set_variable("Lives", 3)\n    display_variable("Lives", True)\n    go_to_xy(0, -140)\n    while True:',
          target: 'def game_start():\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    set_variable("Lives", 3)\n    display_variable("Lives", True)\n    go_to_xy(0, -140)\n    while True:\n        if key_pressed("right"):\n            change_x(8)\n        if key_pressed("left"):\n            change_x(-8)\n        if x_position() > 210:\n            set_x(210)\n        if x_position() < -210:\n            set_x(-210)',
          newLines: ['        if key_pressed("right"):', '            change_x(8)', '        if key_pressed("left"):', '            change_x(-8)', '        if x_position() > 210:', '            set_x(210)', '        if x_position() < -210:', '            set_x(-210)'],
          requires: ['key_pressed("right")', 'change_x(8)', 'key_pressed("left")', 'change_x(-8)', 'x_position() > 210', 'set_x(210)', 'x_position() < -210', 'set_x(-210)']
        },
        {
          title: 'Add the Apple sprite',
          text: 'Click the <strong>+</strong> sprite button and add a second sprite. <strong>Name it exactly <code>Apple</code></strong>. Then click the Apple sprite in the panel to switch to its code.',
          starter: null, target: null, newLines: [], requires: [],
          highlight: 'add-sprite-btn', highlightLabel: 'Add Apple sprite here',
          requiredSpriteNames: ['Catcher', 'Apple'],
          requiredSpriteHints: { 'Apple': 'Add a sprite named "Apple"' }
        },
        {
          title: 'Apple: fall from the top',
          text: 'With the <strong>Apple</strong> sprite selected, write its <code>game_start()</code>. It starts at a random x position at the top and falls downward every frame:',
          starter: null,
          target: 'def game_start():\n    go_to_xy(pick_random(-200, 200), 180)\n    while True:\n        change_y(-4)',
          newLines: ['def game_start():', '    go_to_xy(pick_random(-200, 200), 180)', '    while True:', '        change_y(-4)'],
          requires: ['def game_start():', 'go_to_xy(pick_random(-200, 200), 180)', '    while True:', 'change_y(-4)']
        },
        {
          title: 'Apple: catch and miss',
          text: 'Add two checks inside the loop. If the apple is touching the basket, score a point and reset to the top. If it falls off the bottom, lose a life and reset:',
          starter: 'def game_start():\n    go_to_xy(pick_random(-200, 200), 180)\n    while True:\n        change_y(-4)',
          target: 'def game_start():\n    go_to_xy(pick_random(-200, 200), 180)\n    while True:\n        change_y(-4)\n        if touching("Catcher"):\n            change_variable("Score", 1)\n            go_to_xy(pick_random(-200, 200), 180)\n        if y_position() < -180:\n            change_variable("Lives", -1)\n            go_to_xy(pick_random(-200, 200), 180)',
          newLines: ['        if touching("Catcher"):', '            change_variable("Score", 1)', '            go_to_xy(pick_random(-200, 200), 180)', '        if y_position() < -180:', '            change_variable("Lives", -1)'],
          requires: ['touching("Catcher")', 'change_variable("Score", 1)', 'y_position() < -180', 'change_variable("Lives", -1)']
        },
        {
          title: '✅ Try it!',
          text: 'Click <strong>▶</strong>. Apples should fall at random positions - catch them with your basket!<br><br><strong>Challenges:</strong><ul style="margin-top:0.5rem;padding-left:1.2rem"><li>Add a game-over check: <code>if get_variable("Lives") &lt;= 0: say("Game Over!") stop()</code></li><li>Add <code>wait(0.3)</code> after the reset so there\'s a brief gap before the apple reappears</li><li>Make apples speed up - use a variable for speed instead of the fixed <code>-4</code></li></ul>',
          starter: null, target: null, newLines: [], requires: []
        }
      ]
    },

    // ── Whack-a-Mole ──────────────────────────────────────────────
    {
      cat: 'game',
      emoji: '🔨',
      title: 'Whack-a-Mole',
      desc: 'Moles pop up at random positions and vanish after a random time. Click them fast to score. Uses timed clone lifetimes and when_clicked on clones.',
      steps: [
        {
          title: 'What are we building?',
          text: 'A Whack-a-Mole game! The original sprite stays hidden. Every 1.5 seconds it spawns a <strong>clone</strong> that appears at a random position for a random amount of time then vanishes. Click a mole to score a point and destroy it instantly.<br><br>You only need <strong>one sprite</strong>: the mole.',
          starter: null, target: null, newLines: [], requires: []
        },
        {
          title: 'Main loop: spawn clones',
          text: 'The original sprite hides itself then spawns a new clone every 1.5 seconds. <code>set_variable("Score", 0)</code> creates the Score variable; <code>display_variable("Score", True)</code> makes it visible on screen as a counter:',
          starter: '',
          target: 'def game_start():\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    hide()\n    while True:\n        create_clone()\n        wait(1.5)',
          newLines: ['def game_start():', '    set_variable("Score", 0)', '    display_variable("Score", True)', '    hide()', '    while True:', '        create_clone()', '        wait(1.5)'],
          requires: ['def game_start():', 'set_variable("Score"', 'display_variable("Score"', 'hide()', 'create_clone()', 'wait(1.5)']
        },
        {
          title: 'Clone: appear at a random spot',
          text: 'Each clone starts its own script. Move it to a random position and show it:',
          starter: 'def game_start():\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    hide()\n    while True:\n        create_clone()\n        wait(1.5)',
          target: 'def game_start():\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    hide()\n    while True:\n        create_clone()\n        wait(1.5)\n\ndef when_I_start_as_a_clone():\n    go_to_xy(pick_random(-180, 180), pick_random(-100, 100))\n    show()',
          newLines: ['def when_I_start_as_a_clone():', '    go_to_xy(pick_random(-180, 180), pick_random(-100, 100))', '    show()'],
          requires: ['def when_I_start_as_a_clone():', 'go_to_xy(pick_random(-180, 180), pick_random(-100, 100))', 'show()']
        },
        {
          title: 'Clone: vanish after a random time',
          text: 'After showing, the clone waits a random amount of time (between 1 and 3 seconds), then hides and deletes itself:',
          starter: 'def game_start():\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    hide()\n    while True:\n        create_clone()\n        wait(1.5)\n\ndef when_I_start_as_a_clone():\n    go_to_xy(pick_random(-180, 180), pick_random(-100, 100))\n    show()',
          target: 'def game_start():\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    hide()\n    while True:\n        create_clone()\n        wait(1.5)\n\ndef when_I_start_as_a_clone():\n    go_to_xy(pick_random(-180, 180), pick_random(-100, 100))\n    show()\n    wait(pick_random(1, 3))\n    hide()\n    delete_clone()',
          newLines: ['    wait(pick_random(1, 3))', '    hide()', '    delete_clone()'],
          requires: ['wait(pick_random(1, 3))', '    delete_clone()']
        },
        {
          title: 'Click handler: whack it!',
          text: '<code>def when_clicked():</code> fires on the clone that was clicked. Add 1 to Score and immediately destroy the clone:',
          starter: 'def game_start():\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    hide()\n    while True:\n        create_clone()\n        wait(1.5)\n\ndef when_I_start_as_a_clone():\n    go_to_xy(pick_random(-180, 180), pick_random(-100, 100))\n    show()\n    wait(pick_random(1, 3))\n    hide()\n    delete_clone()',
          target: 'def game_start():\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    hide()\n    while True:\n        create_clone()\n        wait(1.5)\n\ndef when_I_start_as_a_clone():\n    go_to_xy(pick_random(-180, 180), pick_random(-100, 100))\n    show()\n    wait(pick_random(1, 3))\n    hide()\n    delete_clone()\n\ndef when_clicked():\n    change_variable("Score", 1)\n    hide()\n    delete_clone()',
          newLines: ['def when_clicked():', '    change_variable("Score", 1)', '    hide()', '    delete_clone()'],
          requires: ['def when_clicked():', 'change_variable("Score", 1)']
        },
        {
          title: '✅ Try it!',
          text: 'Click <strong>▶</strong>. Moles should pop up at random spots - click them before they vanish!<br><br><strong>Challenges:</strong><ul style="margin-top:0.5rem;padding-left:1.2rem"><li>Speed up the game over time - reduce the <code>wait(1.5)</code> in <code>game_start</code> based on <code>get_variable("Score")</code></li><li>Add a 30-second time limit using <code>timer()</code> and <code>if timer() &gt; 30: say("Time\'s up!") stop()</code></li><li>Make moles shrink as your score increases using <code>set_size()</code></li></ul>',
          starter: null, target: null, newLines: [], requires: []
        }
      ]
    },

    // ── Space Shooter ─────────────────────────────────────────────
    {
      cat: 'game',
      emoji: '🚀',
      title: 'Space Shooter',
      desc: 'Fly a ship left and right and press space to fire bullets upward. Bullets are clones that delete themselves on impact. Uses the broadcast → clone projectile pattern.',
      steps: [
        {
          title: 'What are we building?',
          text: 'A Space Shooter! Move your ship left and right. Press <strong>space</strong> to fire bullets upward at an enemy that patrols the top of the screen.<br><br>You need <strong>three sprites</strong>: <code>Player</code> (the ship), <code>Bullet</code> (a small projectile), and <code>Enemy</code>. <strong>Rename your default sprite to <code>Player</code></strong> using the name box below the stage.',
          starter: null, target: null, newLines: [], requires: [],
          requiredSpriteNames: ['Player'],
          requiredSpriteHints: { 'Player': 'Rename your sprite to "Player"' }
        },
        {
          title: 'Player: movement and boundary',
          text: 'Write the Player\'s <code>game_start()</code> - left/right movement with arrow keys and clamping so it stays on screen:',
          starter: '',
          target: 'def game_start():\n    go_to_xy(0, -150)\n    set_rotation_style("left-right")\n    while True:\n        if key_pressed("right"):\n            change_x(5)\n            point_in_direction(90)\n        if key_pressed("left"):\n            change_x(-5)\n            point_in_direction(-90)\n        if x_position() > 220:\n            set_x(220)\n        if x_position() < -220:\n            set_x(-220)',
          newLines: ['def game_start():', '    go_to_xy(0, -150)', '    set_rotation_style("left-right")', '    while True:', '        if key_pressed("right"):', '            change_x(5)', '            point_in_direction(90)', '        if key_pressed("left"):', '            change_x(-5)', '            point_in_direction(-90)', '        if x_position() > 220:', '            set_x(220)', '        if x_position() < -220:', '            set_x(-220)'],
          requires: ['go_to_xy(0, -150)', 'key_pressed("right")', 'change_x(5)', 'key_pressed("left")', 'change_x(-5)', 'x_position() > 220', 'set_x(220)', 'x_position() < -220', 'set_x(-220)']
        },
        {
          title: 'Player: fire bullets',
          text: 'At the end of the loop, check whether the space key is pressed and broadcast <code>"fire"</code>. The Bullet sprite will listen for this:',
          starter: 'def game_start():\n    go_to_xy(0, -150)\n    set_rotation_style("left-right")\n    while True:\n        if key_pressed("right"):\n            change_x(5)\n            point_in_direction(90)\n        if key_pressed("left"):\n            change_x(-5)\n            point_in_direction(-90)\n        if x_position() > 220:\n            set_x(220)\n        if x_position() < -220:\n            set_x(-220)',
          target: 'def game_start():\n    go_to_xy(0, -150)\n    set_rotation_style("left-right")\n    while True:\n        if key_pressed("right"):\n            change_x(5)\n            point_in_direction(90)\n        if key_pressed("left"):\n            change_x(-5)\n            point_in_direction(-90)\n        if x_position() > 220:\n            set_x(220)\n        if x_position() < -220:\n            set_x(-220)\n        if key_pressed("space"):\n            broadcast("fire")',
          newLines: ['        if key_pressed("space"):', '            broadcast("fire")'],
          requires: ['key_pressed("space")', 'broadcast("fire")']
        },
        {
          title: 'Add the Bullet and Enemy sprites',
          text: 'Click <strong>+</strong> twice to add two more sprites. Name them exactly <strong><code>Bullet</code></strong> and <strong><code>Enemy</code></strong>. Then click the <strong>Bullet</strong> sprite to switch to its code.',
          starter: null, target: null, newLines: [], requires: [],
          highlight: 'add-sprite-btn', highlightLabel: 'Add sprites here',
          requiredSpriteNames: ['Player', 'Bullet', 'Enemy'],
          requiredSpriteHints: { 'Bullet': 'Add a sprite named "Bullet"', 'Enemy': 'Add a sprite named "Enemy"' }
        },
        {
          title: 'Bullet: listen for "fire" and launch a clone',
          text: 'With the <strong>Bullet</strong> sprite selected, write its code. The base sprite hides itself. When the "fire" broadcast arrives it jumps to the Player\'s position and spawns a clone. The clone then shoots upward:',
          starter: null,
          target: 'def game_start():\n    hide()\n\ndef when_message_received(message):\n    if message == "fire":\n        go_to("Player")\n        create_clone()\n\ndef when_I_start_as_a_clone():\n    show()\n    while True:\n        change_y(8)\n        if y_position() > 180:\n            delete_clone()\n        if touching("Enemy"):\n            change_variable("Score", 1)\n            delete_clone()',
          newLines: ['def game_start():', '    hide()', 'def when_message_received(message):', '    if message == "fire":', '        go_to("Player")', '        create_clone()', 'def when_I_start_as_a_clone():', '    show()', '    while True:', '        change_y(8)', '        if y_position() > 180:', '            delete_clone()', '        if touching("Enemy"):', '            change_variable("Score", 1)', '            delete_clone()'],
          requires: ['def game_start():', 'hide()', 'def when_message_received(message):', 'message == "fire"', 'go_to("Player")', 'create_clone()', 'def when_I_start_as_a_clone():', 'show()', 'change_y(8)', 'y_position() > 180', 'touching("Enemy")', 'change_variable("Score"', 'delete_clone()']
        },
        {
          title: 'Enemy: patrol left and right',
          text: 'Click the <strong>Enemy</strong> sprite. Give it a velocity variable and a simple loop that bounces it off the edges of the screen. <code>set_variable("Score", 0)</code> creates the Score variable; <code>display_variable("Score", True)</code> makes it visible on screen:',
          starter: null,
          target: 'vx = 3\n\ndef game_start():\n    global vx\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    go_to_xy(-200, 120)\n    while True:\n        change_x(vx)\n        if x_position() > 220 or x_position() < -220:\n            vx = vx * -1',
          newLines: ['vx = 3', '', 'def game_start():', '    global vx', '    set_variable("Score", 0)', '    display_variable("Score", True)', '    go_to_xy(-200, 120)', '    while True:', '        change_x(vx)', '        if x_position() > 220 or x_position() < -220:', '            vx = vx * -1'],
          requires: ['vx = 3', 'def game_start():', 'global vx', 'set_variable("Score"', 'display_variable("Score"', 'go_to_xy(-200, 120)', 'change_x(vx)', 'x_position() > 220', 'vx = vx * -1']
        },
        {
          title: '✅ Try it!',
          text: 'Click <strong>▶</strong>. Move with arrow keys, fire with space - hit the enemy to score!<br><br><strong>Challenges:</strong><ul style="margin-top:0.5rem;padding-left:1.2rem"><li>Add a <code>wait(0.2)</code> after <code>broadcast("fire")</code> so bullets have a fire rate limit</li><li>Speed the enemy up as Score increases - use <code>get_variable("Score")</code> to scale <code>vx</code></li><li>Add multiple enemies using <code>create_clone_of("Enemy")</code> from the Player code</li></ul>',
          starter: null, target: null, newLines: [], requires: []
        }
      ]
    },

    // ── Pong ──────────────────────────────────────────────────────
    {
      cat: 'game',
      emoji: '🏓',
      title: 'Pong',
      desc: 'Classic one-player Pong. Bounce the ball off the walls and your paddle - miss it and it\'s game over. Velocity-based bounce across two sprites.',
      steps: [
        {
          title: 'What are we building?',
          text: 'A one-player Pong game! A ball bounces off the left, right, and top walls. Move the paddle to bounce it back up. If the ball gets past the paddle it\'s game over.<br><br>You need <strong>two sprites</strong>: <code>Paddle</code> and <code>Ball</code>. <strong>Rename your default sprite to <code>Paddle</code></strong> using the name box below the stage.',
          starter: null, target: null, newLines: [], requires: [],
          requiredSpriteNames: ['Paddle'],
          requiredSpriteHints: { 'Paddle': 'Rename your sprite to "Paddle"' }
        },
        {
          title: 'Paddle: movement and boundary',
          text: 'Write the Paddle\'s <code>game_start()</code>. Position it at the bottom and move it left and right with the arrow keys:',
          starter: '',
          target: 'def game_start():\n    go_to_xy(0, -150)\n    while True:\n        if key_pressed("right"):\n            change_x(8)\n        if key_pressed("left"):\n            change_x(-8)\n        if x_position() > 200:\n            set_x(200)\n        if x_position() < -200:\n            set_x(-200)',
          newLines: ['def game_start():', '    go_to_xy(0, -150)', '    while True:', '        if key_pressed("right"):', '            change_x(8)', '        if key_pressed("left"):', '            change_x(-8)', '        if x_position() > 200:', '            set_x(200)', '        if x_position() < -200:', '            set_x(-200)'],
          requires: ['go_to_xy(0, -150)', 'key_pressed("right")', 'change_x(8)', 'key_pressed("left")', 'change_x(-8)', 'x_position() > 200', 'set_x(200)', 'x_position() < -200', 'set_x(-200)']
        },
        {
          title: 'Add the Ball sprite',
          text: 'Click <strong>+</strong> to add a second sprite. Name it <strong><code>Ball</code></strong>. Then click the Ball in the sprite panel to switch to its code.',
          starter: null, target: null, newLines: [], requires: [],
          highlight: 'add-sprite-btn', highlightLabel: 'Add Ball sprite here',
          requiredSpriteNames: ['Paddle', 'Ball'],
          requiredSpriteHints: { 'Ball': 'Add a sprite named "Ball"' }
        },
        {
          title: 'Ball: velocity variables',
          text: 'With <strong>Ball</strong> selected, set up two global velocity variables outside <code>game_start</code>. Then start the ball in the centre and set up the Score counter:',
          starter: null,
          target: 'vx = 4\nvy = 3\n\ndef game_start():\n    global vx, vy\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    go_to_xy(0, 50)',
          newLines: ['vx = 4', 'vy = 3', '', 'def game_start():', '    global vx, vy', '    set_variable("Score", 0)', '    display_variable("Score", True)', '    go_to_xy(0, 50)'],
          requires: ['vx = 4', 'vy = 3', 'global vx, vy', 'set_variable("Score"', 'display_variable("Score"', 'go_to_xy(0, 50)']
        },
        {
          title: 'Ball: movement and wall bouncing',
          text: 'Add the <code>while True:</code> loop. The ball moves by its velocity each frame and reverses direction when it hits the left/right walls or the top:',
          starter: 'vx = 4\nvy = 3\n\ndef game_start():\n    global vx, vy\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    go_to_xy(0, 50)',
          target: 'vx = 4\nvy = 3\n\ndef game_start():\n    global vx, vy\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    go_to_xy(0, 50)\n    while True:\n        change_x(vx)\n        change_y(vy)\n        if x_position() > 225 or x_position() < -225:\n            vx = vx * -1\n        if y_position() > 165:\n            vy = vy * -1',
          newLines: ['    while True:', '        change_x(vx)', '        change_y(vy)', '        if x_position() > 225 or x_position() < -225:', '            vx = vx * -1', '        if y_position() > 165:', '            vy = vy * -1'],
          requires: ['    while True:', 'change_x(vx)', 'change_y(vy)', 'x_position() > 225', 'vx = vx * -1', 'y_position() > 165', 'vy = vy * -1']
        },
        {
          title: 'Ball: bounce off paddle and game over',
          text: 'Add two more checks: bounce upward when the ball touches the Paddle (only if already moving downward), and stop the game if it drops off the bottom:',
          starter: 'vx = 4\nvy = 3\n\ndef game_start():\n    global vx, vy\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    go_to_xy(0, 50)\n    while True:\n        change_x(vx)\n        change_y(vy)\n        if x_position() > 225 or x_position() < -225:\n            vx = vx * -1\n        if y_position() > 165:\n            vy = vy * -1',
          target: 'vx = 4\nvy = 3\n\ndef game_start():\n    global vx, vy\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    go_to_xy(0, 50)\n    while True:\n        change_x(vx)\n        change_y(vy)\n        if x_position() > 225 or x_position() < -225:\n            vx = vx * -1\n        if y_position() > 165:\n            vy = vy * -1\n        if touching("Paddle") and vy < 0:\n            vy = vy * -1\n            change_variable("Score", 1)\n        if y_position() < -175:\n            say("Game Over!")\n            stop()',
          newLines: ['        if touching("Paddle") and vy < 0:', '            vy = vy * -1', '            change_variable("Score", 1)', '        if y_position() < -175:', '            say("Game Over!")', '            stop()'],
          requires: ['touching("Paddle") and vy < 0', '            vy = vy * -1', 'change_variable("Score", 1)', 'y_position() < -175', 'say("Game Over!")', 'stop()']
        },
        {
          title: '✅ Try it!',
          text: 'Click <strong>▶</strong>. Keep the ball alive with your paddle - each bounce scores a point!<br><br><strong>Challenges:</strong><ul style="margin-top:0.5rem;padding-left:1.2rem"><li>Speed the ball up over time - add <code>vy = vy * 1.05</code> each time you hit the paddle</li><li>Make the bounce angle depend on where the ball hits the paddle using <code>x_position() - touching("Paddle")</code> - look up how Scratch Pong angle maths works</li><li>Add a two-player mode: second paddle controlled with W/S keys, both using <code>change_y</code></li></ul>',
          starter: null, target: null, newLines: [], requires: []
        }
      ]
    },

    // ── Breakout ──────────────────────────────────────────────────
    {
      cat: 'game',
      emoji: '🧱',
      title: 'Breakout',
      desc: 'Bounce a ball off a paddle to smash rows of brick clones. Each brick deletes itself on impact. Nested loops build the grid, three-sprite collision throughout.',
      steps: [
        {
          title: 'What are we building?',
          text: 'Breakout! A ball bounces around the screen. Use the paddle to keep it alive - when the ball hits a Brick clone it destroys it and you score a point.<br><br>You need <strong>three sprites</strong>: <code>Paddle</code>, <code>Ball</code>, and <code>Brick</code>. <strong>Rename your sprite to <code>Paddle</code></strong> using the name box below the stage.',
          starter: null, target: null, newLines: [], requires: [],
          requiredSpriteNames: ['Paddle'],
          requiredSpriteHints: { 'Paddle': 'Rename your sprite to "Paddle"' }
        },
        {
          title: 'Paddle: movement and boundary',
          text: 'Write the Paddle\'s <code>game_start()</code> - identical to Pong. Place it at the bottom and move left/right with clamping:',
          starter: '',
          target: 'def game_start():\n    go_to_xy(0, -150)\n    while True:\n        if key_pressed("right"):\n            change_x(8)\n        if key_pressed("left"):\n            change_x(-8)\n        if x_position() > 200:\n            set_x(200)\n        if x_position() < -200:\n            set_x(-200)',
          newLines: ['def game_start():', '    go_to_xy(0, -150)', '    while True:', '        if key_pressed("right"):', '            change_x(8)', '        if key_pressed("left"):', '            change_x(-8)', '        if x_position() > 200:', '            set_x(200)', '        if x_position() < -200:', '            set_x(-200)'],
          requires: ['go_to_xy(0, -150)', 'key_pressed("right")', 'change_x(8)', 'key_pressed("left")', 'change_x(-8)', 'x_position() > 200', 'set_x(200)', 'x_position() < -200', 'set_x(-200)']
        },
        {
          title: 'Add Ball and Brick sprites',
          text: 'Click <strong>+</strong> twice. Name the sprites <strong><code>Ball</code></strong> and <strong><code>Brick</code></strong>. Then click <strong>Ball</strong> to switch to its code.',
          starter: null, target: null, newLines: [], requires: [],
          highlight: 'add-sprite-btn', highlightLabel: 'Add sprites here',
          requiredSpriteNames: ['Paddle', 'Ball', 'Brick'],
          requiredSpriteHints: { 'Ball': 'Add a sprite named "Ball"', 'Brick': 'Add a sprite named "Brick"' }
        },
        {
          title: 'Ball: velocity and movement',
          text: 'With <strong>Ball</strong> selected, add velocity variables then write the movement loop with wall and ceiling bouncing:',
          starter: null,
          target: 'vx = 4\nvy = 4\n\ndef game_start():\n    global vx, vy\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    go_to_xy(0, -30)\n    while True:\n        change_x(vx)\n        change_y(vy)\n        if x_position() > 225 or x_position() < -225:\n            vx = vx * -1\n        if y_position() > 165:\n            vy = vy * -1',
          newLines: ['vx = 4', 'vy = 4', '', 'def game_start():', '    global vx, vy', '    set_variable("Score", 0)', '    display_variable("Score", True)', '    go_to_xy(0, -30)', '    while True:', '        change_x(vx)', '        change_y(vy)', '        if x_position() > 225 or x_position() < -225:', '            vx = vx * -1', '        if y_position() > 165:', '            vy = vy * -1'],
          requires: ['vx = 4', 'vy = 4', 'global vx, vy', 'set_variable("Score"', 'display_variable("Score"', 'go_to_xy(0, -30)', 'change_x(vx)', 'change_y(vy)', 'x_position() > 225', 'vx = vx * -1', 'y_position() > 165', 'vy = vy * -1']
        },
        {
          title: 'Ball: paddle bounce, brick bounce, game over',
          text: 'Add three more checks: bounce off the Paddle, bounce off any Brick and score, and stop the game if the ball falls past the bottom:',
          starter: 'vx = 4\nvy = 4\n\ndef game_start():\n    global vx, vy\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    go_to_xy(0, -30)\n    while True:\n        change_x(vx)\n        change_y(vy)\n        if x_position() > 225 or x_position() < -225:\n            vx = vx * -1\n        if y_position() > 165:\n            vy = vy * -1',
          target: 'vx = 4\nvy = 4\n\ndef game_start():\n    global vx, vy\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    go_to_xy(0, -30)\n    while True:\n        change_x(vx)\n        change_y(vy)\n        if x_position() > 225 or x_position() < -225:\n            vx = vx * -1\n        if y_position() > 165:\n            vy = vy * -1\n        if touching("Paddle") and vy < 0:\n            vy = vy * -1\n        if touching("Brick"):\n            vy = vy * -1\n            change_variable("Score", 1)\n        if y_position() < -175:\n            say("Game Over!")\n            stop()',
          newLines: ['        if touching("Paddle") and vy < 0:', '            vy = vy * -1', '        if touching("Brick"):', '            vy = vy * -1', '            change_variable("Score", 1)', '        if y_position() < -175:', '            say("Game Over!")', '            stop()'],
          requires: ['touching("Paddle") and vy < 0', 'touching("Brick")', '            change_variable("Score", 1)', 'y_position() < -175', 'say("Game Over!")', 'stop()']
        },
        {
          title: 'Brick: build the grid',
          text: 'Click the <strong>Brick</strong> sprite. Use two nested <code>for</code> loops to create 3 rows of 8 bricks. The base sprite hides itself - only clones are visible:',
          starter: null,
          target: 'def game_start():\n    hide()\n    for row in range(3):\n        for col in range(8):\n            go_to_xy(-175 + col * 50, 80 - row * 30)\n            create_clone()',
          newLines: ['def game_start():', '    hide()', '    for row in range(3):', '        for col in range(8):', '            go_to_xy(-175 + col * 50, 80 - row * 30)', '            create_clone()'],
          requires: ['def game_start():', 'hide()', 'for row in range(3):', 'for col in range(8):', 'go_to_xy(-175 + col * 50, 80 - row * 30)', 'create_clone()']
        },
        {
          title: 'Brick: clones appear and die on contact',
          text: 'Each brick clone shows itself when created. It watches for the Ball touching it - when hit, it deletes itself (the Ball\'s code already reverses direction):',
          starter: 'def game_start():\n    hide()\n    for row in range(3):\n        for col in range(8):\n            go_to_xy(-175 + col * 50, 80 - row * 30)\n            create_clone()',
          target: 'def game_start():\n    hide()\n    for row in range(3):\n        for col in range(8):\n            go_to_xy(-175 + col * 50, 80 - row * 30)\n            create_clone()\n\ndef when_I_start_as_a_clone():\n    show()\n    while True:\n        if touching("Ball"):\n            delete_clone()',
          newLines: ['def when_I_start_as_a_clone():', '    show()', '    while True:', '        if touching("Ball"):', '            delete_clone()'],
          requires: ['def when_I_start_as_a_clone():', '    show()', 'while True:', 'touching("Ball")', 'delete_clone()']
        },
        {
          title: '✅ Try it!',
          text: 'Click <strong>▶</strong>. Smash all the bricks - each one scores a point!<br><br><strong>Challenges:</strong><ul style="margin-top:0.5rem;padding-left:1.2rem"><li>Add more rows of bricks by changing <code>range(3)</code> to a larger number</li><li>Add a win condition: when Score reaches the total brick count, say "You Win!" and <code>stop()</code></li><li>Make different coloured rows worth different points using <code>set_effect("color", ...)</code> on each clone based on <code>row</code></li></ul>',
          starter: null, target: null, newLines: [], requires: []
        }
      ]
    },
    {
      id: 'functions',
      isNew: true,
      title: 'Functions',
      emoji: '🧩',
      desc: 'Wrap code you use again and again into a named function, then call it whenever you need it - and pass it a value to change what it does.',
      steps: [
        {
          title: 'Write a function',
          text: 'A <strong>function</strong> is a named block of code you can reuse. Define one called <code>hop</code> that makes the sprite jump up and come back down. <code>def</code> starts the function; everything indented under it is its body.',
          starter: '',
          target: 'def hop():\n    for i in range(10):\n        change_y(6)\n        wait(0.02)\n    for i in range(10):\n        change_y(-6)\n        wait(0.02)',
          newLines: ['def hop():', '    for i in range(10):', '        change_y(6)', '        wait(0.02)', '    for i in range(10):', '        change_y(-6)', '        wait(0.02)'],
          requires: ['def hop():', 'change_y(6)', 'change_y(-6)'],
          suppressErrors: ['struct']
        },
        {
          title: 'Call your function',
          text: 'Defining a function does not run it - you have to <strong>call</strong> it by writing its name with brackets. Add a <code>game_start()</code> loop that calls <code>hop()</code> whenever space is pressed.',
          starter: 'def hop():\n    for i in range(10):\n        change_y(6)\n        wait(0.02)\n    for i in range(10):\n        change_y(-6)\n        wait(0.02)',
          target: 'def hop():\n    for i in range(10):\n        change_y(6)\n        wait(0.02)\n    for i in range(10):\n        change_y(-6)\n        wait(0.02)\n\ndef game_start():\n    while True:\n        if key_pressed("space"):\n            hop()',
          newLines: ['def game_start():', '    while True:', '        if key_pressed("space"):', '            hop()'],
          requires: ['def game_start():', 'while True:', 'key_pressed("space")', '            hop()']
        },
        {
          title: 'Reuse it - no copy-paste',
          text: 'The magic of functions: one definition, <strong>many calls</strong>. Instead of copying the jump code again, just call <code>hop()</code> from another key too. Add an up-arrow that also hops.',
          starter: 'def hop():\n    for i in range(10):\n        change_y(6)\n        wait(0.02)\n    for i in range(10):\n        change_y(-6)\n        wait(0.02)\n\ndef game_start():\n    while True:\n        if key_pressed("space"):\n            hop()',
          target: 'def hop():\n    for i in range(10):\n        change_y(6)\n        wait(0.02)\n    for i in range(10):\n        change_y(-6)\n        wait(0.02)\n\ndef game_start():\n    while True:\n        if key_pressed("space"):\n            hop()\n        if key_pressed("up"):\n            hop()',
          newLines: ['        if key_pressed("up"):', '            hop()'],
          requires: [{ req: '            hop()', count: 2, label: 'call hop() from both keys' }, 'key_pressed("up")']
        },
        {
          title: 'Give it a parameter',
          text: 'A <strong>parameter</strong> lets a function do something different each time. Change <code>hop</code> to take a <code>size</code>, then call <code>hop(10)</code> for a small jump and <code>hop(20)</code> for a big one.',
          starter: 'def hop():\n    for i in range(10):\n        change_y(6)\n        wait(0.02)\n    for i in range(10):\n        change_y(-6)\n        wait(0.02)\n\ndef game_start():\n    while True:\n        if key_pressed("space"):\n            hop()\n        if key_pressed("up"):\n            hop()',
          target: 'def hop(size):\n    for i in range(size):\n        change_y(6)\n        wait(0.02)\n    for i in range(size):\n        change_y(-6)\n        wait(0.02)\n\ndef game_start():\n    while True:\n        if key_pressed("space"):\n            hop(10)\n        if key_pressed("up"):\n            hop(20)',
          newLines: ['def hop(size):', '    for i in range(size):', '            hop(10)', '            hop(20)'],
          requires: ['def hop(size):', 'range(size)', 'hop(10)', 'hop(20)']
        },
        {
          title: '✅ Try it!',
          text: 'Click the <strong>green flag ▶</strong>. Press <strong>space</strong> for a small hop and <strong>up</strong> for a big one - same function, two different jumps.<br><br><strong>Challenge:</strong> Add a second parameter so <code>hop(size, speed)</code> also controls how fast the jump plays. Then write a brand-new function <code>spin()</code> and call it too.',
          starter: null, target: null, newLines: [], requires: []
        }
      ]
    },
    {
      id: 'lists',
      isNew: true,
      title: 'Lists',
      emoji: '📋',
      desc: 'Store many values in one place with a list, loop through them, and grow the list while your program runs.',
      steps: [
        {
          title: 'Make a list',
          text: 'A <strong>list</strong> holds many values in order, inside square brackets. Create <code>game_start()</code> and make a list of three x-positions for the sprite to patrol between.',
          starter: '',
          target: 'def game_start():\n    points = [-150, 0, 150]',
          newLines: ['def game_start():', '    points = [-150, 0, 150]'],
          requires: ['def game_start():', 'points = [-150, 0, 150]'],
          suppressErrors: ['struct']
        },
        {
          title: 'Loop through the list',
          text: 'A <code>for</code> loop can walk through <strong>every item</strong> in a list. Add a <code>while True:</code> loop that visits each point in turn - <code>point</code> becomes each value in the list, one at a time.',
          starter: 'def game_start():\n    points = [-150, 0, 150]',
          target: 'def game_start():\n    points = [-150, 0, 150]\n    while True:\n        for point in points:\n            set_x(point)\n            wait(0.5)',
          newLines: ['    while True:', '        for point in points:', '            set_x(point)', '            wait(0.5)'],
          requires: ['while True:', 'for point in points:', 'set_x(point)', 'wait(0.5)']
        },
        {
          title: 'Grow the list',
          text: 'Lists can change size while the program runs. Use <code>.append()</code> to add a fourth stop to the patrol before the loop starts.',
          starter: 'def game_start():\n    points = [-150, 0, 150]\n    while True:\n        for point in points:\n            set_x(point)\n            wait(0.5)',
          target: 'def game_start():\n    points = [-150, 0, 150]\n    points.append(220)\n    while True:\n        for point in points:\n            set_x(point)\n            wait(0.5)',
          newLines: ['    points.append(220)'],
          requires: ['points.append(220)']
        },
        {
          title: 'How long is the list?',
          text: '<code>len()</code> tells you how many items a list has. Say the number of patrol stops before the loop. <code>str()</code> turns the number into text so <code>say()</code> can show it.',
          starter: 'def game_start():\n    points = [-150, 0, 150]\n    points.append(220)\n    while True:\n        for point in points:\n            set_x(point)\n            wait(0.5)',
          target: 'def game_start():\n    points = [-150, 0, 150]\n    points.append(220)\n    say(str(len(points)))\n    while True:\n        for point in points:\n            set_x(point)\n            wait(0.5)',
          newLines: ['    say(str(len(points)))'],
          requires: ['len(points)']
        },
        {
          title: '✅ Try it!',
          text: 'Click the <strong>green flag ▶</strong>. The sprite briefly shows how many stops there are (4), then patrols between them forever.<br><br><strong>Challenge:</strong> Read a single item by its <em>index</em> - <code>points[0]</code> is the first, <code>points[1]</code> the second. Then make a second list of y-positions and patrol in both directions.',
          starter: null, target: null, newLines: [], requires: []
        }
      ]
    },
    {
      id: 'messages',
      isNew: true,
      title: 'Messages & Events',
      emoji: '📣',
      desc: 'Split a trigger from its reaction. One part of your code broadcasts a message; a separate handler reacts - the same way sprites and clones respond to events.',
      steps: [
        {
          title: 'Broadcast a message',
          text: 'A <strong>broadcast</strong> is an announcement any code can listen for. Make <code>game_start()</code> broadcast <code>"cheer"</code> when space is pressed. The short <code>wait</code> stops it firing every single frame.',
          starter: '',
          target: 'def game_start():\n    while True:\n        if key_pressed("space"):\n            broadcast("cheer")\n            wait(0.3)',
          newLines: ['def game_start():', '    while True:', '        if key_pressed("space"):', '            broadcast("cheer")', '            wait(0.3)'],
          requires: ['def game_start():', 'key_pressed("space")', 'broadcast("cheer")'],
          suppressErrors: ['struct']
        },
        {
          title: 'React to the message',
          text: 'Add a <strong>separate</strong> handler that runs whenever a message arrives. Notice <code>game_start()</code> never calls this code directly - it just announces <code>"cheer"</code> and the handler responds on its own.',
          starter: 'def game_start():\n    while True:\n        if key_pressed("space"):\n            broadcast("cheer")\n            wait(0.3)',
          target: 'def game_start():\n    while True:\n        if key_pressed("space"):\n            broadcast("cheer")\n            wait(0.3)\n\ndef when_message_received(message):\n    if message == "cheer":\n        say("Woohoo!")\n        next_costume()',
          newLines: ['def when_message_received(message):', '    if message == "cheer":', '        say("Woohoo!")', '        next_costume()'],
          requires: ['def when_message_received(message):', 'message == "cheer"', 'say("Woohoo!")']
        },
        {
          title: 'A second message',
          text: 'One handler can react to many messages. Broadcast <code>"vanish"</code> on the up-arrow, then handle it with <code>elif</code> - the sprite hides for a moment, then reappears.',
          starter: 'def game_start():\n    while True:\n        if key_pressed("space"):\n            broadcast("cheer")\n            wait(0.3)\n\ndef when_message_received(message):\n    if message == "cheer":\n        say("Woohoo!")\n        next_costume()',
          target: 'def game_start():\n    while True:\n        if key_pressed("space"):\n            broadcast("cheer")\n            wait(0.3)\n        if key_pressed("up"):\n            broadcast("vanish")\n            wait(0.3)\n\ndef when_message_received(message):\n    if message == "cheer":\n        say("Woohoo!")\n        next_costume()\n    elif message == "vanish":\n        hide()\n        wait(0.5)\n        show()',
          newLines: ['        if key_pressed("up"):', '            broadcast("vanish")', '    elif message == "vanish":', '        hide()', '        wait(0.5)', '        show()'],
          requires: ['broadcast("vanish")', 'message == "vanish"', 'hide()', 'show()']
        },
        {
          title: '✅ Try it!',
          text: 'Click the <strong>green flag ▶</strong>. Press <strong>space</strong> to cheer and <strong>up</strong> to vanish - the reactions live in a totally separate handler from the key checks.<br><br><strong>Challenge:</strong> Add a <em>second sprite</em>, give it its own <code>when_message_received(message)</code>, and make it react to <code>"cheer"</code> too. One broadcast, many sprites responding - that\'s how whole games are coordinated.',
          starter: null, target: null, newLines: [], requires: []
        }
      ]
    },
    {
      id: 'debug-refactor',
      isNew: true,
      title: 'Debug & Refactor',
      emoji: '🔧',
      desc: 'Real programming is fixing code that does the wrong thing, then tidying it up. Hunt down two bugs, then refactor the repetition into one clean function.',
      steps: [
        {
          title: 'Bug 1: wrong way!',
          text: 'This mover is broken. Run it and press the <strong>right</strong> arrow - the sprite goes the <em>wrong way</em>. Find the line for the right key and fix it so <code>change_x</code> is <strong>positive</strong>.',
          starter: 'def game_start():\n    while True:\n        if key_pressed("right"):\n            change_x(-5)\n        if key_pressed("left"):\n            change_x(-5)\n        if key_pressed("up"):\n            change_y(-5)\n        if key_pressed("down"):\n            change_y(-5)',
          target: 'def game_start():\n    while True:\n        if key_pressed("right"):\n            change_x(5)\n        if key_pressed("left"):\n            change_x(-5)\n        if key_pressed("up"):\n            change_y(-5)\n        if key_pressed("down"):\n            change_y(-5)',
          newLines: ['            change_x(5)'],
          requires: ['change_x(5)'],
          behaviorCheck: {
            hint: 'Hold the right arrow - the sprite should now move RIGHT. The right-key line should be change_x(5).',
            setupMs: 400,
            scenarios: [
              { label: 'right key moves right', holdKey: 'right', durationMs: 400, checks: [{ type: 'xChanged', dir: '+' }] }
            ]
          }
        },
        {
          title: 'Bug 2: up is down',
          text: 'Now press the <strong>up</strong> arrow - the sprite drops instead of rising. Fix the up-key line so <code>change_y</code> is <strong>positive</strong> (positive y is up).',
          starter: 'def game_start():\n    while True:\n        if key_pressed("right"):\n            change_x(5)\n        if key_pressed("left"):\n            change_x(-5)\n        if key_pressed("up"):\n            change_y(-5)\n        if key_pressed("down"):\n            change_y(-5)',
          target: 'def game_start():\n    while True:\n        if key_pressed("right"):\n            change_x(5)\n        if key_pressed("left"):\n            change_x(-5)\n        if key_pressed("up"):\n            change_y(5)\n        if key_pressed("down"):\n            change_y(-5)',
          newLines: ['            change_y(5)'],
          requires: ['change_y(5)'],
          behaviorCheck: {
            hint: 'Hold the up arrow - the sprite should now move UP. The up-key line should be change_y(5).',
            setupMs: 400,
            scenarios: [
              { label: 'up key moves up', holdKey: 'up', durationMs: 400, checks: [{ type: 'yChanged', dir: '+' }] }
            ]
          }
        },
        {
          title: 'Refactor: one function',
          text: 'All four blocks repeat the same idea: move by some amount. That is a sign to <strong>refactor</strong>. Write a <code>move(dx, dy)</code> function once, then call it from each key. Less code means fewer places for bugs to hide.',
          starter: 'def game_start():\n    while True:\n        if key_pressed("right"):\n            change_x(5)\n        if key_pressed("left"):\n            change_x(-5)\n        if key_pressed("up"):\n            change_y(5)\n        if key_pressed("down"):\n            change_y(-5)',
          target: 'def move(dx, dy):\n    change_x(dx)\n    change_y(dy)\n\ndef game_start():\n    while True:\n        if key_pressed("right"):\n            move(5, 0)\n        if key_pressed("left"):\n            move(-5, 0)\n        if key_pressed("up"):\n            move(0, 5)\n        if key_pressed("down"):\n            move(0, -5)',
          newLines: ['def move(dx, dy):', '    change_x(dx)', '    change_y(dy)', '            move(5, 0)', '            move(-5, 0)', '            move(0, 5)', '            move(0, -5)'],
          requires: ['def move(dx, dy):', 'change_x(dx)', 'change_y(dy)', 'move(5, 0)', 'move(-5, 0)', 'move(0, 5)', 'move(0, -5)'],
          behaviorCheck: {
            hint: 'Both should still work - right moves right, up moves up - but now through your move() function.',
            setupMs: 400,
            scenarios: [
              { label: 'right key moves right', holdKey: 'right', durationMs: 400, checks: [{ type: 'xChanged', dir: '+' }] },
              { label: 'up key moves up', holdKey: 'up', durationMs: 400, checks: [{ type: 'yChanged', dir: '+' }] }
            ]
          }
        },
        {
          title: '✅ Try it!',
          text: 'Click the <strong>green flag ▶</strong>. All four arrows work, and the logic lives in one tidy <code>move()</code> function.<br><br><strong>Challenge:</strong> Add a <code>speed</code> parameter - <code>move(dx, dy, speed)</code> - and make a "run" key that moves faster. Notice you only change the function <em>once</em>.',
          starter: null, target: null, newLines: [], requires: []
        }
      ]
    },

    // ══ APPLIED GAMES ═══════════════════════════════════════════════════════════
    // Capstone game projects that put the new concept tutorials (functions, lists,
    // messages, debug/refactor) to work. Ordered by difficulty via `order`.
    {
      id: 'geometry-dash',
      isNew: true,
      order: 1,
      title: 'Geometry Dash',
      emoji: '🟦',
      desc: 'Build a one-button auto-runner. Your cube runs on the spot while spikes rush past - tap space to jump. You will wrap the jump logic in its own function and call it.',
      steps: [
        {
          title: 'What are we building?',
          text: 'A Geometry Dash style auto-runner! Your cube stays on the left while <strong>Spike</strong> obstacles scroll toward it. Press <strong>space</strong> to jump over them.<br><br>This game shows off <strong>functions</strong>: instead of writing the jump maths in the middle of your loop, you wrap it in <code>def jump():</code> and just call <code>jump()</code> when space is pressed. The Score counter is made by <code>set_variable()</code> and shown with <code>display_variable()</code>.',
          starter: null, target: null, newLines: [], requires: []
        },
        {
          title: 'Write the jump function',
          text: 'Start with a velocity variable <code>vy = 0</code>. Then define a <code>jump()</code> function: it only launches the cube (<code>vy = 12</code>) when it is on the ground (<code>y_position() &lt;= -100</code>), so you cannot double-jump in mid-air. <code>global vy</code> lets the function change the outside variable.',
          starter: '',
          target: 'vy = 0\n\ndef jump():\n    global vy\n    if y_position() <= -100:\n        vy = 12',
          newLines: ['vy = 0', '', 'def jump():', '    global vy', '    if y_position() <= -100:', '        vy = 12'],
          requires: ['def jump():', 'y_position() <= -100', 'vy = 12']
        },
        {
          title: 'The game loop and gravity',
          text: 'Now the main loop. Gravity pulls <code>vy</code> down a little every frame, and <code>change_y(vy)</code> moves the cube. When it lands on the ground at <code>-100</code>, stop it and reset <code>vy</code>.',
          starter: 'vy = 0\n\ndef jump():\n    global vy\n    if y_position() <= -100:\n        vy = 12',
          target: 'vy = 0\n\ndef jump():\n    global vy\n    if y_position() <= -100:\n        vy = 12\n\ndef game_start():\n    global vy\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    go_to_xy(-150, -100)\n    while True:\n        vy = vy - 0.8\n        change_y(vy)\n        if y_position() < -100:\n            set_y(-100)\n            vy = 0',
          newLines: ['', 'def game_start():', '    global vy', '    set_variable("Score", 0)', '    display_variable("Score", True)', '    go_to_xy(-150, -100)', '    while True:', '        vy = vy - 0.8', '        change_y(vy)', '        if y_position() < -100:', '            set_y(-100)', '            vy = 0'],
          requires: ['def game_start():', 'set_variable("Score", 0)', 'display_variable("Score", True)', 'go_to_xy(-150, -100)', 'vy = vy - 0.8', 'change_y(vy)', 'y_position() < -100', 'set_y(-100)']
        },
        {
          title: 'Jump and crash',
          text: 'Call your function! When <strong>space</strong> is pressed, run <code>jump()</code> - one tidy line instead of the whole jump routine. Then end the game if the cube hits a Spike.',
          starter: 'vy = 0\n\ndef jump():\n    global vy\n    if y_position() <= -100:\n        vy = 12\n\ndef game_start():\n    global vy\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    go_to_xy(-150, -100)\n    while True:\n        vy = vy - 0.8\n        change_y(vy)\n        if y_position() < -100:\n            set_y(-100)\n            vy = 0',
          target: 'vy = 0\n\ndef jump():\n    global vy\n    if y_position() <= -100:\n        vy = 12\n\ndef game_start():\n    global vy\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    go_to_xy(-150, -100)\n    while True:\n        vy = vy - 0.8\n        change_y(vy)\n        if y_position() < -100:\n            set_y(-100)\n            vy = 0\n        if key_pressed("space"):\n            jump()\n        if touching("Spike"):\n            say("Game Over!")\n            stop()',
          newLines: ['        if key_pressed("space"):', '            jump()', '        if touching("Spike"):', '            say("Game Over!")', '            stop()'],
          requires: ['key_pressed("space")', '            jump()', 'touching("Spike")', 'say("Game Over!")', 'stop()']
        },
        {
          title: 'Add the Spike sprite',
          text: 'Spikes are their own game object, so they need a <strong>separate sprite</strong>. Click the highlighted button, give it a <strong>spiky triangular costume</strong>, and name it <strong>Spike</strong>.',
          highlight: 'add-sprite-btn',
          highlightLabel: 'Add a sprite here',
          requiredSpriteNames: ['Spike'],
          requiredSpriteHints: { 'Spike': 'Add a sprite and name it "Spike"' },
          starter: null, target: null, newLines: [], requires: []
        },
        {
          title: 'Spike: scroll and score',
          text: 'Click your <strong>Spike</strong> sprite and delete its default code. Send it flying from the right edge to the left; when it goes off-screen, loop it back to the right and add 1 to the Score for surviving.',
          starter: null,
          target: 'def game_start():\n    go_to_xy(240, -100)\n    while True:\n        change_x(-6)\n        if x_position() < -240:\n            set_x(240)\n            change_variable("Score", 1)',
          newLines: ['def game_start():', '    go_to_xy(240, -100)', '    while True:', '        change_x(-6)', '        if x_position() < -240:', '            set_x(240)', '            change_variable("Score", 1)'],
          requires: ['go_to_xy(240, -100)', 'change_x(-6)', 'x_position() < -240', 'set_x(240)', 'change_variable("Score", 1)']
        },
        {
          title: '✅ Try it!',
          text: 'Click the <strong>green flag ▶</strong> and jump the spikes! The Score climbs every time one passes safely.<br><br><strong>Challenges:</strong><ul style="margin-top:0.5rem;padding-left:1.2rem"><li>Make the spike faster as the Score climbs using <code>get_variable("Score")</code>.</li><li>Add a second obstacle sprite that scrolls at a different height.</li><li>Give <code>jump()</code> a <code>power</code> parameter - <code>jump(power)</code> - so a second key jumps higher.</li></ul>',
          starter: null, target: null, newLines: [], requires: []
        }
      ]
    },

    {
      id: 'rhythm-game',
      isNew: true,
      order: 2,
      title: 'Rhythm Game',
      emoji: '🎵',
      desc: 'Notes drop down the screen - hit space as each one reaches the line. Uses a list of lane positions and broadcast messages to score the hits.',
      steps: [
        {
          title: 'What are we building?',
          text: 'A rhythm game! Notes fall down the screen as clones, and you press <strong>space</strong> when one reaches the bottom line.<br><br>This brings two new ideas together: a <strong>list</strong> holds the four lane positions, and a <strong>broadcast message</strong> ("hit") tells every note to check whether it is in the hit zone. The <code>Score</code> counter is a Scratch variable.',
          starter: null, target: null, newLines: [], requires: []
        },
        {
          title: 'The lane list and note spawner',
          text: 'Store the four lane x-positions in a <strong>list</strong> called <code>lanes</code>. Then <code>game_start()</code> hides the original note (only its clones are seen) and spawns a new clone every <code>0.7</code> seconds.',
          starter: '',
          target: 'lanes = [-150, -50, 50, 150]\n\ndef game_start():\n    hide()\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    while True:\n        create_clone()\n        wait(0.7)',
          newLines: ['lanes = [-150, -50, 50, 150]', '', 'def game_start():', '    hide()', '    set_variable("Score", 0)', '    display_variable("Score", True)', '    while True:', '        create_clone()', '        wait(0.7)'],
          requires: ['lanes = [-150, -50, 50, 150]', 'hide()', 'set_variable("Score", 0)', 'display_variable("Score", True)', 'create_clone()', 'wait(0.7)']
        },
        {
          title: 'Notes fall in a random lane',
          text: 'Each clone picks a random lane <em>from the list</em> with <code>lanes[pick_random(0, 3)]</code>, appears at the top, and falls. If it drops off the bottom without a hit, it deletes itself.',
          starter: 'lanes = [-150, -50, 50, 150]\n\ndef game_start():\n    hide()\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    while True:\n        create_clone()\n        wait(0.7)',
          target: 'lanes = [-150, -50, 50, 150]\n\ndef game_start():\n    hide()\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    while True:\n        create_clone()\n        wait(0.7)\n\ndef when_I_start_as_a_clone():\n    go_to_xy(lanes[pick_random(0, 3)], 160)\n    show()\n    while True:\n        change_y(-5)\n        if y_position() < -180:\n            delete_clone()',
          newLines: ['', 'def when_I_start_as_a_clone():', '    go_to_xy(lanes[pick_random(0, 3)], 160)', '    show()', '    while True:', '        change_y(-5)', '        if y_position() < -180:', '            delete_clone()'],
          requires: ['def when_I_start_as_a_clone():', 'lanes[pick_random(0, 3)]', 'show()', 'change_y(-5)', 'y_position() < -180', 'delete_clone()']
        },
        {
          title: 'Press space to send a hit',
          text: 'A <code>when_key_pressed</code> handler fires once each time a key is tapped. When it is space, <code>broadcast("hit")</code> - an announcement every note clone can hear at the same moment.',
          starter: 'lanes = [-150, -50, 50, 150]\n\ndef game_start():\n    hide()\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    while True:\n        create_clone()\n        wait(0.7)\n\ndef when_I_start_as_a_clone():\n    go_to_xy(lanes[pick_random(0, 3)], 160)\n    show()\n    while True:\n        change_y(-5)\n        if y_position() < -180:\n            delete_clone()',
          target: 'lanes = [-150, -50, 50, 150]\n\ndef game_start():\n    hide()\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    while True:\n        create_clone()\n        wait(0.7)\n\ndef when_I_start_as_a_clone():\n    go_to_xy(lanes[pick_random(0, 3)], 160)\n    show()\n    while True:\n        change_y(-5)\n        if y_position() < -180:\n            delete_clone()\n\ndef when_key_pressed(key):\n    if key == "space":\n        broadcast("hit")',
          newLines: ['', 'def when_key_pressed(key):', '    if key == "space":', '        broadcast("hit")'],
          requires: ['def when_key_pressed(key):', 'key == "space"', 'broadcast("hit")']
        },
        {
          title: 'Score notes in the hit zone',
          text: 'Every clone listens for <code>"hit"</code>. If the note receiving the message is near the bottom line - its <code>y_position()</code> between <code>-150</code> and <code>-90</code> - it scores a point and disappears. Notes anywhere else simply ignore the message.',
          starter: 'lanes = [-150, -50, 50, 150]\n\ndef game_start():\n    hide()\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    while True:\n        create_clone()\n        wait(0.7)\n\ndef when_I_start_as_a_clone():\n    go_to_xy(lanes[pick_random(0, 3)], 160)\n    show()\n    while True:\n        change_y(-5)\n        if y_position() < -180:\n            delete_clone()\n\ndef when_key_pressed(key):\n    if key == "space":\n        broadcast("hit")',
          target: 'lanes = [-150, -50, 50, 150]\n\ndef game_start():\n    hide()\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    while True:\n        create_clone()\n        wait(0.7)\n\ndef when_I_start_as_a_clone():\n    go_to_xy(lanes[pick_random(0, 3)], 160)\n    show()\n    while True:\n        change_y(-5)\n        if y_position() < -180:\n            delete_clone()\n\ndef when_key_pressed(key):\n    if key == "space":\n        broadcast("hit")\n\ndef when_message_received(message):\n    if message == "hit":\n        if y_position() < -90 and y_position() > -150:\n            change_variable("Score", 1)\n            delete_clone()',
          newLines: ['', 'def when_message_received(message):', '    if message == "hit":', '        if y_position() < -90 and y_position() > -150:', '            change_variable("Score", 1)', '            delete_clone()'],
          requires: ['def when_message_received(message):', 'message == "hit"', 'y_position() < -90', 'y_position() > -150', 'change_variable("Score", 1)']
        },
        {
          title: '✅ Try it!',
          text: 'Click the <strong>green flag ▶</strong> and tap <strong>space</strong> as notes reach the line!<br><br><strong>Challenges:</strong><ul style="margin-top:0.5rem;padding-left:1.2rem"><li>Add a <code>Combo</code> variable that climbs with each hit and resets on a miss.</li><li>Draw a faint line costume at the hit zone so players can see where to aim.</li><li>Speed the song up over time by lowering the <code>wait()</code> between spawns.</li></ul>',
          starter: null, target: null, newLines: [], requires: []
        }
      ]
    },

    {
      id: 'tower-defense',
      isNew: true,
      order: 3,
      title: 'Tower Defense',
      emoji: '🏰',
      desc: 'Enemies march along a fixed path while your tower zaps any that come close. The path is a list of waypoints, and the tower fires with a broadcast.',
      steps: [
        {
          title: 'What are we building?',
          text: 'A tower defense game! Enemy clones follow a set route across the stage; your tower fires at any that get close.<br><br>The route is a <strong>list of waypoints</strong> (each waypoint is its own little <code>[x, y]</code> list), and the tower attacks by <strong>broadcasting</strong> a message the enemies listen for.<br><br>First, <strong>rename your sprite to <code>Enemy</code></strong> using the name box below the stage.',
          starter: null, target: null, newLines: [], requires: [],
          requiredSpriteNames: ['Enemy'],
          requiredSpriteHints: { 'Enemy': 'Rename your sprite to "Enemy"' }
        },
        {
          title: 'Enemy: the path list and spawner',
          text: 'On your <strong>Enemy</strong> sprite, store the route as a <strong>list of waypoints</strong> - notice each item is itself an <code>[x, y]</code> list. <code>game_start()</code> hides the original and spawns a clone every <code>2.5</code> seconds. <code>Lives</code> counts the enemies that get through.',
          starter: '',
          target: 'path = [[-200, 150], [200, 150], [200, -120], [-200, -120]]\n\ndef game_start():\n    hide()\n    set_variable("Lives", 5)\n    display_variable("Lives", True)\n    while True:\n        create_clone()\n        wait(2.5)',
          newLines: ['path = [[-200, 150], [200, 150], [200, -120], [-200, -120]]', '', 'def game_start():', '    hide()', '    set_variable("Lives", 5)', '    display_variable("Lives", True)', '    while True:', '        create_clone()', '        wait(2.5)'],
          requires: ['path = [[-200, 150], [200, 150], [200, -120], [-200, -120]]', 'hide()', 'set_variable("Lives", 5)', 'display_variable("Lives", True)', 'create_clone()', 'wait(2.5)']
        },
        {
          title: 'Enemy: walk the path',
          text: 'Each clone starts at the first waypoint, then <code>for point in path:</code> glides to every <code>[x, y]</code> in turn - reading <code>point[0]</code> for the x and <code>point[1]</code> for the y. If it survives the whole path it costs you a life.',
          starter: 'path = [[-200, 150], [200, 150], [200, -120], [-200, -120]]\n\ndef game_start():\n    hide()\n    set_variable("Lives", 5)\n    display_variable("Lives", True)\n    while True:\n        create_clone()\n        wait(2.5)',
          target: 'path = [[-200, 150], [200, 150], [200, -120], [-200, -120]]\n\ndef game_start():\n    hide()\n    set_variable("Lives", 5)\n    display_variable("Lives", True)\n    while True:\n        create_clone()\n        wait(2.5)\n\ndef when_I_start_as_a_clone():\n    go_to_xy(-200, 150)\n    show()\n    for point in path:\n        glide_to_xy(point[0], point[1], 2)\n    change_variable("Lives", -1)\n    delete_clone()',
          newLines: ['', 'def when_I_start_as_a_clone():', '    go_to_xy(-200, 150)', '    show()', '    for point in path:', '        glide_to_xy(point[0], point[1], 2)', '    change_variable("Lives", -1)', '    delete_clone()'],
          requires: ['def when_I_start_as_a_clone():', 'go_to_xy(-200, 150)', 'show()', 'for point in path:', 'glide_to_xy(point[0], point[1], 2)', 'change_variable("Lives", -1)', 'delete_clone()']
        },
        {
          title: 'Add the Tower sprite',
          text: 'Click the highlighted button to add a second sprite. <strong>Name it exactly <code>Tower</code></strong> - the enemy code measures <code>distance_to("Tower")</code>, so the spelling must match. Give it a tower-like costume near the middle of the stage.',
          highlight: 'add-sprite-btn',
          highlightLabel: 'Add the Tower sprite here',
          requiredSpriteNames: ['Enemy', 'Tower'],
          requiredSpriteHints: { 'Tower': 'Add a sprite named "Tower"' },
          starter: null, target: null, newLines: [], requires: []
        },
        {
          title: 'Tower: fire on a beat',
          text: 'Click your <strong>Tower</strong> sprite and delete its default code. Set up the Score counter, park the tower in the centre, and <code>broadcast("shoot")</code> on a steady beat.',
          starter: null,
          target: 'def game_start():\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    go_to_xy(0, 0)\n    while True:\n        broadcast("shoot")\n        wait(0.8)',
          newLines: ['def game_start():', '    set_variable("Score", 0)', '    display_variable("Score", True)', '    go_to_xy(0, 0)', '    while True:', '        broadcast("shoot")', '        wait(0.8)'],
          requires: ['set_variable("Score", 0)', 'display_variable("Score", True)', 'go_to_xy(0, 0)', 'broadcast("shoot")', 'wait(0.8)']
        },
        {
          title: 'Enemy: get shot down',
          text: 'Click your <strong>Enemy</strong> sprite again. Add a message handler: when a clone hears <code>"shoot"</code> while it is close to the tower (<code>distance_to("Tower") &lt; 90</code>), it scores a point and is destroyed.',
          starter: null,
          target: 'path = [[-200, 150], [200, 150], [200, -120], [-200, -120]]\n\ndef game_start():\n    hide()\n    set_variable("Lives", 5)\n    display_variable("Lives", True)\n    while True:\n        create_clone()\n        wait(2.5)\n\ndef when_I_start_as_a_clone():\n    go_to_xy(-200, 150)\n    show()\n    for point in path:\n        glide_to_xy(point[0], point[1], 2)\n    change_variable("Lives", -1)\n    delete_clone()\n\ndef when_message_received(message):\n    if message == "shoot":\n        if distance_to("Tower") < 90:\n            change_variable("Score", 1)\n            delete_clone()',
          newLines: ['', 'def when_message_received(message):', '    if message == "shoot":', '        if distance_to("Tower") < 90:', '            change_variable("Score", 1)', '            delete_clone()'],
          requires: ['def when_message_received(message):', 'message == "shoot"', 'distance_to("Tower") < 90', 'change_variable("Score", 1)']
        },
        {
          title: '✅ Try it!',
          text: 'Click the <strong>green flag ▶</strong>. Enemies loop the path and vanish when they pass your tower.<br><br><strong>Challenges:</strong><ul style="margin-top:0.5rem;padding-left:1.2rem"><li>Add more waypoints to <code>path</code> to make a longer, twistier route.</li><li>Add a game-over when <code>get_variable("Lives") &lt;= 0</code>.</li><li>Add a second Tower sprite - the enemies already listen for any <code>"shoot"</code>, so it just works.</li></ul>',
          starter: null, target: null, newLines: [], requires: []
        }
      ]
    },

    {
      id: 'overcooked',
      isNew: true,
      order: 4,
      title: 'Overcooked',
      emoji: '🍳',
      desc: 'Fill kitchen orders before you fall behind. Orders come from a menu list, a function with a parameter serves each dish, and a message sends the waiter running.',
      steps: [
        {
          title: 'What are we building?',
          text: 'A simplified Overcooked! An order appears - <em>Make a Burger!</em> - and you press <strong>1</strong>, <strong>2</strong> or <strong>3</strong> to cook the matching dish.<br><br>This capstone brings the new skills together: a <strong>list</strong> holds the menu, <strong>functions</strong> (one takes a <em>parameter</em>) handle the orders, and a <strong>broadcast</strong> tells a Waiter sprite to run the plate out.',
          starter: null, target: null, newLines: [], requires: []
        },
        {
          title: 'The menu list and a new order',
          text: 'Store the dishes in a <strong>list</strong> called <code>menu</code>, and remember which one is wanted with <code>current</code>. The <code>new_order()</code> function picks a random dish number and shows it by reading <code>menu[current]</code> out of the list.',
          starter: '',
          target: 'menu = ["Burger", "Pizza", "Salad"]\ncurrent = 0\n\ndef new_order():\n    global current\n    current = pick_random(0, 2)\n    say("Make a " + menu[current] + "!")',
          newLines: ['menu = ["Burger", "Pizza", "Salad"]', 'current = 0', '', 'def new_order():', '    global current', '    current = pick_random(0, 2)', '    say("Make a " + menu[current] + "!")'],
          requires: ['menu = ["Burger", "Pizza", "Salad"]', 'def new_order():', 'current = pick_random(0, 2)', 'menu[current]']
        },
        {
          title: 'A function that takes a parameter',
          text: 'The <code>serve(choice)</code> function takes a <strong>parameter</strong> - the dish number you tried to cook. If <code>choice</code> matches the <code>current</code> order it scores, tells the waiter with <code>broadcast("served")</code>, and starts the next order.',
          starter: 'menu = ["Burger", "Pizza", "Salad"]\ncurrent = 0\n\ndef new_order():\n    global current\n    current = pick_random(0, 2)\n    say("Make a " + menu[current] + "!")',
          target: 'menu = ["Burger", "Pizza", "Salad"]\ncurrent = 0\n\ndef new_order():\n    global current\n    current = pick_random(0, 2)\n    say("Make a " + menu[current] + "!")\n\ndef serve(choice):\n    global current\n    if choice == current:\n        change_variable("Score", 1)\n        broadcast("served")\n        new_order()\n        wait(0.3)',
          newLines: ['', 'def serve(choice):', '    global current', '    if choice == current:', '        change_variable("Score", 1)', '        broadcast("served")', '        new_order()', '        wait(0.3)'],
          requires: ['def serve(choice):', 'choice == current', 'change_variable("Score", 1)', 'broadcast("served")', '        new_order()', 'wait(0.3)']
        },
        {
          title: 'The kitchen loop',
          text: 'Now wire up the keys. <code>game_start()</code> shows the first order, then the loop calls <code>serve()</code> with a different number for each key - <code>serve(0)</code> for key <strong>1</strong>, <code>serve(1)</code> for <strong>2</strong>, <code>serve(2)</code> for <strong>3</strong>. One function handles all three dishes!',
          starter: 'menu = ["Burger", "Pizza", "Salad"]\ncurrent = 0\n\ndef new_order():\n    global current\n    current = pick_random(0, 2)\n    say("Make a " + menu[current] + "!")\n\ndef serve(choice):\n    global current\n    if choice == current:\n        change_variable("Score", 1)\n        broadcast("served")\n        new_order()\n        wait(0.3)',
          target: 'menu = ["Burger", "Pizza", "Salad"]\ncurrent = 0\n\ndef new_order():\n    global current\n    current = pick_random(0, 2)\n    say("Make a " + menu[current] + "!")\n\ndef serve(choice):\n    global current\n    if choice == current:\n        change_variable("Score", 1)\n        broadcast("served")\n        new_order()\n        wait(0.3)\n\ndef game_start():\n    global current\n    set_variable("Score", 0)\n    display_variable("Score", True)\n    new_order()\n    while True:\n        if key_pressed("1"):\n            serve(0)\n        if key_pressed("2"):\n            serve(1)\n        if key_pressed("3"):\n            serve(2)',
          newLines: ['', 'def game_start():', '    global current', '    set_variable("Score", 0)', '    display_variable("Score", True)', '    new_order()', '    while True:', '        if key_pressed("1"):', '            serve(0)', '        if key_pressed("2"):', '            serve(1)', '        if key_pressed("3"):', '            serve(2)'],
          requires: ['def game_start():', 'set_variable("Score", 0)', 'display_variable("Score", True)', '    new_order()', 'key_pressed("1")', 'serve(0)', 'key_pressed("2")', 'serve(1)', 'key_pressed("3")', 'serve(2)']
        },
        {
          title: 'Add the Waiter sprite',
          text: 'Click the highlighted button to add a second sprite. <strong>Name it exactly <code>Waiter</code></strong>, and give it a friendly costume. It will react to the <code>"served"</code> broadcast.',
          highlight: 'add-sprite-btn',
          highlightLabel: 'Add the Waiter sprite here',
          requiredSpriteNames: ['Waiter'],
          requiredSpriteHints: { 'Waiter': 'Add a sprite named "Waiter"' },
          starter: null, target: null, newLines: [], requires: []
        },
        {
          title: 'Waiter: run the plate out',
          text: 'Click your <strong>Waiter</strong> sprite and delete its default code. Keep it hidden in the corner until it hears <code>"served"</code> - then it pops up, shouts <em>Order up!</em>, and hides again.',
          starter: null,
          target: 'def game_start():\n    go_to_xy(180, -130)\n    hide()\n\ndef when_message_received(message):\n    if message == "served":\n        show()\n        say_for_secs("Order up!", 0.4)\n        hide()',
          newLines: ['def game_start():', '    go_to_xy(180, -130)', '    hide()', '', 'def when_message_received(message):', '    if message == "served":', '        show()', '        say_for_secs("Order up!", 0.4)', '        hide()'],
          requires: ['go_to_xy(180, -130)', 'def when_message_received(message):', 'message == "served"', 'show()', 'say_for_secs("Order up!", 0.4)']
        },
        {
          title: '✅ Try it!',
          text: 'Click the <strong>green flag ▶</strong> and cook the orders with keys <strong>1</strong>, <strong>2</strong> and <strong>3</strong>!<br><br><strong>Challenges:</strong><ul style="margin-top:0.5rem;padding-left:1.2rem"><li>Add a fourth dish to the <code>menu</code> list and a <code>serve(3)</code> on key <strong>4</strong>.</li><li>Add a <code>Lives</code> variable and lose one for a wrong key (an <code>else</code> in <code>serve</code>).</li><li>Add a countdown using <code>timer()</code> so orders must be filled before time runs out.</li></ul>',
          starter: null, target: null, newLines: [], requires: []
        }
      ]
    }
  ];

  // ── Challenge data ────────────────────────────────────────────
  // Each challenge is a standalone game for students to build from scratch.
  // No starter code is given - only a goal, hints, and auto-tests.
  //
  // test shape (extends behaviorCheck scenario):
  //   label       string - shown in results list
  //   holdKey     string - hold a key for durationMs (optional)
  //   durationMs  number - how long to hold the key (default 400)
  //   clickSprite string - '__active__' or a sprite name to fire a click event (optional)
  //   broadcast   string - message to fire a broadcast event (optional)
  //   waitMs      number - wait after input before reading state (default 250)
  //   keepRunning bool - skip startAll(); continue from previous test (default false)
  //   allowStop   bool - don't fail if the program stopped naturally (default false)
  //   checks      array - same check types as behaviorCheck scenarios
  var CHALLENGES = [
    {
      id: 'arrow-mover',
      emoji: '🕹️',
      title: 'Arrow Key Mover',
      difficulty: 1,
      goal: 'Control the sprite with all four arrow keys. Right moves the sprite right, left moves it left, up moves it up and down moves it down. The sprite should keep moving as long as the key is held.',
      hints: [
        'Put a <code>while True:</code> loop inside <code>def game_start():</code> - this keeps checking every frame.',
        'Use <code>if key_pressed("right"):</code> to check if the right arrow is held down.',
        '<code>change_x(5)</code> moves right, <code>change_x(-5)</code> moves left.',
        '<code>change_y(5)</code> moves up, <code>change_y(-5)</code> moves down.',
        'You need four separate <code>if</code> blocks - one for each direction.'
      ],
      setupMs: 500,
      settleMs: 100,
      tests: [
        { label: 'Right arrow moves sprite right',
          holdKey: 'right', durationMs: 400,
          checks: [{ type: 'xChanged', dir: '+' }] },
        { label: 'Left arrow moves sprite left',
          holdKey: 'left', durationMs: 400,
          checks: [{ type: 'xChanged', dir: '-' }] },
        { label: 'Up arrow moves sprite up',
          holdKey: 'up', durationMs: 400,
          checks: [{ type: 'yChanged', dir: '+' }] },
        { label: 'Down arrow moves sprite down',
          holdKey: 'down', durationMs: 400,
          checks: [{ type: 'yChanged', dir: '-' }] }
      ]
    },
    {
      id: 'click-counter',
      emoji: '🖱️',
      title: 'Click Counter',
      difficulty: 2,
      goal: 'When the green flag is pressed, set a variable called <strong>Score</strong> to 0 and display it on screen. Each time the sprite is clicked, Score goes up by 1.',
      hints: [
        'In <code>def game_start():</code>, use <code>set_variable("Score", 0)</code> to reset the score.',
        'Use <code>display_variable("Score", True)</code> to show it on the stage.',
        'Define <code>def when_clicked():</code> - this runs every time the sprite is clicked.',
        'Inside <code>when_clicked()</code>, use <code>change_variable("Score", 1)</code> to add 1.'
      ],
      setupMs: 700,
      settleMs: 400,
      tests: [
        { label: 'Score starts at 0 when the flag is pressed',
          checks: [{ type: 'variable', name: 'Score', op: '=', value: 0 }] },
        { label: 'Clicking the sprite increases Score to 1',
          keepRunning: true, clickSprite: '__active__',
          checks: [{ type: 'variable', name: 'Score', op: '=', value: 1 }] },
        { label: 'Clicking again increases Score to 2',
          keepRunning: true, clickSprite: '__active__',
          checks: [{ type: 'variable', name: 'Score', op: '=', value: 2 }] }
      ]
    },
    {
      id: 'wall-bouncer',
      emoji: '🏓',
      title: 'Wall Bouncer',
      difficulty: 3,
      goal: 'The sprite moves automatically using a speed variable <code>vx</code>. When it reaches the right wall (x > 220) or left wall (x &lt; −220), it reverses direction by flipping <code>vx</code>. The sprite bounces back and forth forever without any key presses.',
      hints: [
        'Create <code>vx = 5</code> at the top of your code - outside any function.',
        'In <code>def game_start():</code>, write <code>global vx</code> first so Python can change it.',
        'Inside a <code>while True:</code> loop, use <code>change_x(vx)</code> to move each frame.',
        'Check <code>if x_position() > 220 or x_position() &lt; -220:</code> to detect the walls.',
        'To bounce: <code>vx = vx * -1</code> - this flips the direction.'
      ],
      setupMs: 300,
      settleMs: 100,
      tests: [
        { label: 'Sprite moves automatically without any key press',
          waitMs: 500,
          checks: [{ type: 'moved' }] },
        { label: 'Sprite travels at a reasonable speed (reaches x > 80 within 600 ms)',
          waitMs: 600,
          checks: [{ type: 'xAbove', value: 80 }] },
        { label: 'Sprite bounces back from the right wall (not stuck at edge after 3 s)',
          waitMs: 3000,
          checks: [{ type: 'xBelow', value: 200 }] }
      ]
    },
    {
      id: 'gravity-jumper',
      emoji: '🚀',
      title: 'Gravity Jumper',
      difficulty: 4,
      goal: 'Build a physics game. A variable <code>vy</code> controls the sprite\'s vertical speed. Every frame, <code>vy</code> decreases by 0.5 (gravity pulls it down). Pressing space sets <code>vy</code> to 8 (a jump). If the sprite falls below y = −160, say <em>"Game Over!"</em> and <code>stop()</code>.',
      hints: [
        'Create <code>vy = 0</code> at the top of your code.',
        'In <code>game_start()</code>, write <code>global vy</code> so the loop can change it.',
        'Each frame: <code>vy = vy - 0.5</code> (gravity), then <code>change_y(vy)</code>.',
        'Add <code>if key_pressed("space"): vy = 8</code> to jump.',
        'Add <code>if y_position() &lt; -160: say("Game Over!"); stop()</code> for the game-over check.',
        'Try adding a Score variable that goes up by 1 each frame - how long can you survive?'
      ],
      setupMs: 150,
      settleMs: 100,
      tests: [
        { label: 'Sprite falls down automatically (gravity works)',
          allowStop: true, waitMs: 900,
          checks: [{ type: 'yChanged', dir: '-' }] },
        { label: 'Space bar makes the sprite jump upwards',
          allowStop: true, holdKey: 'space', durationMs: 50, waitMs: 400,
          checks: [{ type: 'yChanged', dir: '+' }] },
        { label: 'Sprite eventually hits the bottom and game stops',
          allowStop: true, waitMs: 4000,
          checks: [{ type: 'stoppedOrBelow', value: -100 }] }
      ]
    }
  ];

  window.PyScratchContent = { TUTORIALS: TUTORIALS, CHALLENGES: CHALLENGES };
})();
