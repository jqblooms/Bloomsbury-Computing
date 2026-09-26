// Builds the Year 6 Scratch lessons, 6.2.1 to 6.2.6 and the 6.2.4.5 recap (LessonData/y6-*.json):
//   node tools/build_y6_scratch.mjs
// Edit this file, not the JSON. Every activity is a Scratch Challenge
// (assets/js/scratchcheck*.js) that checks the student's own project, and
// every lesson ends in its own drill (Drills/data/y6-*.js).
import { lesson, numberAnswer as num } from './y6_lesson_kit.mjs';

const GRID = '<svg viewBox="0 0 480 360" role="img" aria-label="The Scratch stage as a grid: x runs from -240 on the left to 240 on the right, y from -180 at the bottom to 180 at the top, with 0, 0 in the middle" style="display:block;width:100%;max-width:360px;margin:0 auto">' +
  '<rect width="480" height="360" rx="10" style="fill:var(--surface-2)"/>' +
  [90, 140, 190, 290, 340, 390].map(x => `<line x1="${x}" y1="0" x2="${x}" y2="360" style="stroke:var(--line)"/>`).join('') +
  [30, 80, 130, 230, 280, 330].map(y => `<line x1="0" y1="${y}" x2="480" y2="${y}" style="stroke:var(--line)"/>`).join('') +
  '<line x1="0" y1="180" x2="480" y2="180" style="stroke:var(--brand);stroke-width:2"/><line x1="240" y1="0" x2="240" y2="360" style="stroke:var(--brand);stroke-width:2"/>' +
  '<g style="fill:var(--ink-soft);font:600 17px Roboto,sans-serif">' +
  '<text x="8" y="172">-240</text><text x="472" y="172" text-anchor="end">240</text><text x="248" y="22">180</text><text x="248" y="352">-180</text></g>' +
  '<circle cx="240" cy="180" r="7" style="fill:var(--accent)"/><text x="228" y="204" text-anchor="end" style="fill:var(--accent);font:700 17px Roboto,sans-serif">(0, 0)</text>' +
  '<circle cx="340" cy="130" r="9" style="fill:var(--good)"/><text x="354" y="118" style="fill:var(--good);font:700 17px Roboto,sans-serif">x: 100, y: 50</text>' +
  '</svg>';

// ============================================================ 6.2.1
{
  const L = lesson('y6-icontrol-l1', 'y6l1', '6.2.1: Events and Coordinates');
  L.choice('do-now', 'Do Now: Inputs and Outputs', 'Recap from your earlier computing lessons: a game takes inputs from the player and gives outputs back.', [
    { prompt: 'A player presses the space bar to make a character jump. Is the key press an input or an output?', options: ['Input', 'Output', 'Neither'], correct: 0,
      explain: 'The key press sends information into the computer, so it is an input.' },
    { prompt: 'The game plays a sound when the character collects a coin. Is the sound an input or an output?', options: ['Input', 'Neither', 'Output'], correct: 2,
      explain: 'The computer sends the sound out to the player, so it is an output.' }
  ]);
  L.title('Events and Coordinates', '6.2.1', [
    'Start scripts with events: the green flag, key presses and clicks.',
    'Use x and y to place and move a sprite on the stage.',
    'Build two Scratch projects that check themselves.'
  ]);
  L.slide('events', 'Events Start Scripts',
    L.heading('Events Start Scripts', 'In Scratch, an input from the player is an <strong>event</strong>. A hat block waits for its event, then runs the blocks under it, in order.') +
    '<div class="igame-two-col">' + L.facts([
      '<strong>when green flag clicked</strong>: the player starts the game.',
      '<strong>when [key] key pressed</strong>: the player presses that key.',
      '<strong>when this sprite clicked</strong>: the player clicks the sprite.'
    ]) + L.blocks('when flag clicked\ngo to x: (0) y: (0)\n\nwhen [right arrow v] key pressed\nchange x by (10)') + '</div>');
  L.choice('check-events', 'Check: Events', 'Choose the hat block for each event.', [
    { prompt: 'Which hat block starts a script when the player presses the space bar?', options: ['when green flag clicked', 'when space key pressed', 'when this sprite clicked', 'forever'], correct: 1,
      explain: 'when [space] key pressed waits for that key. The other hat blocks wait for different events.' },
    { prompt: 'A script starts with "when this sprite clicked". What makes it run?', options: ['Pressing any key', 'Clicking the green flag', 'Clicking on that sprite'], correct: 2,
      explain: 'The script waits until the player clicks that sprite with the mouse.' }
  ]);
  L.slide('coordinates', 'The Stage Is a Grid',
    L.heading('The Stage Is a Grid', 'Every point on the stage has an x and a y. They tell Scratch exactly where a sprite is.') +
    '<div class="igame-two-col">' + L.facts([
      '<strong>x</strong> is left and right: from -240 at the left edge to 240 at the right edge.',
      '<strong>y</strong> is up and down: from -180 at the bottom to 180 at the top.',
      'The middle of the stage is <strong>x: 0, y: 0</strong>.',
      'Moving right makes x bigger. Moving down makes y smaller.'
    ]) + GRID + '</div>');
  L.short('check-grid', 'Check: Read the Grid', 'Use the grid from the last slide.', [
    'What is x at the right-hand edge of the stage?',
    'A sprite is at y: 100. It moves 30 steps straight down. What is y now?'
  ], [
    { pattern: num(240, 'x'), feedback: 'Look at the number at the right-hand end of the x line.' },
    { pattern: num(70, 'y'), feedback: 'Moving down makes y smaller. Take 30 away from 100.' }
  ]);
  L.challenge('activity-1', 'Activity 1: Rocket Controls', 'Work on your own. Program a rocket that the player flies with the arrow keys.', 'rocket-controls', 'Rocket Controls', [
    'The green flag sends the Rocket to x: 0, y: 0.',
    'Each arrow key moves the Rocket that way.',
    'Clicking the Rocket makes it say Ready for launch!'
  ]);
  L.slide('glide', 'Go To, Glide and Change',
    L.heading('Go To, Glide and Change', 'Three ways to move a sprite. Blocks run from top to bottom, one after another.') +
    '<div class="igame-two-col">' + L.facts([
      '<strong>go to x: y:</strong> jumps straight to that point.',
      '<strong>glide (1) secs to x: y:</strong> travels there smoothly, taking that many seconds.',
      '<strong>change x by (10)</strong> moves from wherever the sprite is now. A negative number moves the other way.'
    ]) + L.blocks('when flag clicked\ngo to x: (-100) y: (0)\nglide (2) secs to x: (100) y: (0)\nchange y by (-50)') + '</div>');
  L.short('predict', 'Predict: Where Does It End?', 'Follow the script one block at a time, from the top.', [
    'What is x when the script ends?',
    'What is y when the script ends?'
  ], [
    { pattern: num(70, 'x'), feedback: 'Start at x: 0. Add 100, then take away 30. Only the change x blocks change x.' },
    { pattern: num(-50, 'y'), feedback: 'Only one block changes y. Start at y: 0.' }
  ], 'when flag clicked\ngo to x: (0) y: (0)\nchange x by (100)\nchange y by (-50)\nchange x by (-30)');
  L.challenge('activity-2', 'Activity 2: Treasure Tour', 'Work on your own. Read the coordinates printed on the stage and glide to each treasure.', 'treasure-tour', 'Treasure Tour', [
    'The green flag sends the Robot to its start: x: -180, y: -120.',
    'It glides to the yellow, then blue, then red treasure.',
    'At the red treasure it says Found them all!'
  ]);
  L.short('practice-1', 'Checked Practice (1 of 2)', 'The sprite starts at x: 0. Look at its script.', [
    'The player presses the right arrow 4 times. What is x now?',
    'Then they press the left arrow once. What is x now?'
  ], [
    { pattern: num(60, 'x'), feedback: 'Each press adds 15. Four presses add 15 four times.' },
    { pattern: num(45, 'x'), feedback: 'The left arrow takes 15 away from where the sprite is now.' }
  ], 'when [right arrow v] key pressed\nchange x by (15)\n\nwhen [left arrow v] key pressed\nchange x by (-15)');
  L.short('practice-2', 'Checked Practice (2 of 2)', 'Read this script from the top.', [
    'How many seconds does the sprite take to cross the stage?',
    'What is y when the glide finishes?'
  ], [
    { pattern: String.raw`^\s*2\s*(s|secs?|seconds?)?\s*$`, feedback: 'Look at the number in the glide block.' },
    { pattern: num(80, 'y'), feedback: 'The glide ends at the x and y written in the glide block.' }
  ], 'when flag clicked\ngo to x: (-200) y: (80)\nglide (2) secs to x: (200) y: (80)');
  L.plenary('y6-icontrol-l1', 'Events and Coordinates');
  L.save();
}

// ============================================================ 6.2.2
{
  const L = lesson('y6-igame-l2', 'y6l2', '6.2.2: Loops and Pong');
  L.choice('do-now', 'Do Now: Events', 'Recap of 6.2.1: Events and Coordinates.', [
    { prompt: 'Which hat block runs its script when the player starts the game?', options: ['when this sprite clicked', 'when space key pressed', 'when green flag clicked'], correct: 2,
      explain: 'The green flag starts the game, so its scripts set everything up.' },
    { prompt: 'A sprite is at x: 0. It runs change x by (-20). Where is it now?', options: ['x: -20', 'x: 20', 'y: -20', 'x: 0'], correct: 0,
      explain: 'change x by (-20) takes 20 away from x, moving the sprite left.' }
  ]);
  L.short('do-now-2', 'Do Now: Follow the Script', 'Recap of 6.2.1: Events and Coordinates.', [
    'What is x when the script ends?',
    'What is y when the script ends?'
  ], [
    { pattern: num(80, 'x'), feedback: 'Start at x: 50, then add 30.' },
    { pattern: num(40, 'y'), feedback: 'Start at y: 0, then add 40.' }
  ], 'when flag clicked\ngo to x: (50) y: (0)\nchange x by (30)\nchange y by (40)');
  L.title('Loops and Pong', '6.2.2', [
    'Repeat blocks with repeat and forever loops.',
    'Make decisions with if and touching.',
    'Build a Pong game that checks itself.'
  ]);
  L.slide('loops', 'Loops Repeat Blocks',
    L.heading('Loops Repeat Blocks', 'A loop runs the blocks inside it again and again, so you only write them once.') +
    '<div class="igame-two-col">' + L.facts([
      '<strong>repeat (4)</strong> runs the blocks inside it 4 times, then carries on below.',
      '<strong>forever</strong> runs the blocks inside it until the game stops. Nothing goes underneath it.',
      'A game keeps moving and checking because its scripts are inside forever loops.'
    ]) + L.blocks('repeat (4)\nmove (100) steps\nturn left (90) degrees\nend\n\nforever\nmove (5) steps\nif on edge, bounce\nend') + '</div>');
  L.short('check-loops', 'Check: Count the Loop', 'Follow the loop one turn at a time.', [
    'How many times does change x by (20) run?',
    'What is x after the loop?'
  ], [
    { pattern: String.raw`^\s*5\s*(times)?\s*$`, feedback: 'Look at the number in the repeat block.' },
    { pattern: num(100, 'x'), feedback: 'x starts at 0 and goes up by 20 each time round the loop.' }
  ], 'when flag clicked\nset x to (0)\nrepeat (5)\nchange x by (20)\nend');
  L.challenge('activity-1', 'Activity 1: Square Dance', 'Work on your own. Use a repeat loop to fly the Bee round the square.', 'square-dance', 'Square Dance', [
    'The green flag sends the Bee to the start and points it right.',
    'It flies round the dashed square, anticlockwise.',
    'The moves sit inside one repeat block, and one lap takes at least a second.'
  ]);
  L.slide('sensing', 'Sensing and If',
    L.heading('Sensing and If', 'A <strong>condition</strong> is a question with a true or false answer. An <strong>if</strong> block runs its blocks only when the condition is true.') +
    '<div class="igame-two-col">' + L.facts([
      '<strong>touching [Paddle]?</strong> is true while the Ball touches the Paddle.',
      'Inside a <strong>forever</strong> loop, the if block checks again and again.',
      '<strong>mouse x</strong> reports how far left or right the mouse is.',
      '<strong>if on edge, bounce</strong> turns a sprite round at the edge.'
    ]) + L.blocks('when flag clicked\nforever\nset x to (mouse x)\nend\n\nif <touching [Paddle v] ?> then\nchange [score v] by (1)\nend') + '</div>');
  L.choice('check-sensing', 'Check: Sensing and If', 'Choose the best answer.', [
    { prompt: 'Why is set x to (mouse x) inside a forever loop?', options: ['So the Paddle keeps following the mouse', 'So the Paddle moves only once', 'So the game stops at the floor'], correct: 0,
      explain: 'Without the loop the Paddle would move once, when the flag is clicked, and never again.' },
    { prompt: 'The Ball is not touching the Paddle. What does touching [Paddle]? report?', options: ['true', 'false', '0'], correct: 1,
      explain: 'A condition is true or false. Not touching means false, so the if block skips its blocks.' }
  ]);
  L.slide('pong-toolkit', 'Pong Toolkit',
    L.heading('Pong Toolkit', 'Two blocks you will need for Pong that you have not used before.') +
    '<div class="igame-two-col">' + L.blocks('point in direction ((180) - (direction))\nmove (5) steps') +
    '<div class="lesson-flow-task"><h3>Bounce off the Paddle</h3><p>180 take away the direction flips the Ball from heading down to heading up. Moving 5 steps lifts it clear, so one hit counts once.</p></div></div>' +
    '<div class="igame-two-col" style="margin-top:14px">' + L.blocks('wait until <touching color [#e02424] ?>\nstop [all v]') +
    '<div class="lesson-flow-task"><h3>Game over at the floor</h3><p>Click the colour square, then click the red floor on the stage to pick its colour. The script waits until the Ball touches red, then stops everything.</p></div></div>');
  L.challenge('activity-2', 'Activity 2: Pong', 'Work on your own. The starter project has the Paddle, the Ball and a red floor.', 'pong', 'Pong', [
    'The mouse moves the Paddle left and right.',
    'The Ball starts at the top, keeps moving and bounces off the walls.',
    'A hit bounces the Ball up and adds 1 to score. The green flag sets score to 0.',
    'Touching the red floor stops the game.'
  ]);
  L.short('practice-1', 'Checked Practice (1 of 2)', 'Follow the script to the end.', [
    'What is score after the loop?'
  ], [
    { pattern: num(6, 'score'), feedback: 'score starts at 0 and goes up by 2 each time round. The loop runs 3 times.' }
  ], 'when flag clicked\nset [score v] to (0)\nrepeat (3)\nchange [score v] by (2)\nend');
  L.short('practice-2', 'Checked Practice (2 of 2)', 'This is the Ball\'s scoring script. score starts at 0.', [
    'The Ball hits the Paddle 4 times and misses it twice. What is score?'
  ], [
    { pattern: num(4, 'score'), feedback: 'Only a hit makes touching [Paddle]? true. A miss does not change score.' }
  ], 'when flag clicked\nforever\nif <touching [Paddle v] ?> then\nchange [score v] by (1)\nend\nend');
  L.plenary('y6-igame-l2', 'Loops and Pong');
  L.save();
}

// ============================================================ 6.2.3
{
  const L = lesson('y6-iplan-l3', 'y6l3', '6.2.3: Variables and Decisions');
  L.choice('do-now', 'Do Now: Loops and Sensing', 'Recap of 6.2.2: Loops and Pong.', [
    { prompt: 'Which block runs the blocks inside it again and again until the game stops?', options: ['repeat (10)', 'forever', 'if then'], correct: 1,
      explain: 'forever never finishes. repeat (10) stops after 10 turns.' },
    { prompt: 'What does if on edge, bounce do?', options: ['Turns the sprite round at the edge', 'Stops the game at the edge', 'Moves the sprite to the middle'], correct: 0,
      explain: 'It checks for the edge and points the sprite back the other way.' }
  ]);
  L.short('do-now-2', 'Do Now: Loops and the Grid', 'Question (a) recaps 6.2.2: Loops and Pong. Question (b) recaps 6.2.1: Events and Coordinates.', [
    'The sprite starts at x: 0. What is x after the loop?',
    'What is y at the top edge of the stage?'
  ], [
    { pattern: num(100, 'x'), feedback: 'The loop runs 4 times and adds 25 each time.' },
    { pattern: num(180, 'y'), feedback: 'y runs from -180 at the bottom to the same number, positive, at the top.' }
  ], 'when flag clicked\nrepeat (4)\nchange x by (25)\nend');
  L.title('Variables and Decisions', '6.2.3', [
    'Store and change values with variables.',
    'Compare values and choose with if then else.',
    'Build a clicker game and a catching game that check themselves.'
  ]);
  L.slide('variables', 'Variables Store Values',
    L.heading('Variables Store Values', 'A <strong>variable</strong> is a named place that stores a value that can change while the game runs.') +
    '<div class="igame-two-col">' + L.facts([
      'Make one in Variables with <strong>Make a Variable</strong>. Give it a clear name, like score.',
      '<strong>set [score] to (0)</strong> gives it a value. Do this when the green flag is clicked.',
      '<strong>change [score] by (1)</strong> adds to it. A negative number takes away.',
      'The box on the stage shows its value while the game runs.'
    ]) + L.blocks('when flag clicked\nset [clicks v] to (0)\n\nwhen this sprite clicked\nchange [clicks v] by (1)') + '</div>');
  L.short('check-variables', 'Check: Follow the Variable', 'These are the two scripts from the last slide.', [
    'After the green flag, the player clicks the sprite 7 times. What is clicks?',
    'Then the player clicks the green flag again. What is clicks now?'
  ], [
    { pattern: num(7, 'clicks'), feedback: 'Every click runs change [clicks] by (1), starting from 0.' },
    { pattern: num(0, 'clicks'), feedback: 'Which block runs when the green flag is clicked?' }
  ], 'when flag clicked\nset [clicks v] to (0)\n\nwhen this sprite clicked\nchange [clicks v] by (1)');
  L.challenge('activity-1', 'Activity 1: Gem Clicker', 'Work on your own. Count clicks in a variable and reward the player at 10.', 'gem-clicker', 'Gem Clicker', [
    'Make a variable called clicks. The green flag sets it to 0 and the costume to gem.',
    'Each click on the Gem adds 1 to clicks.',
    'At 10 clicks the Gem turns gold, not before.',
    'Each click says Keep going! or You win!, using if then else.'
  ]);
  L.slide('decisions', 'Comparisons and If Else',
    L.heading('Comparisons and If Else', 'A comparison is a condition: it reports true or false.') +
    '<div class="igame-two-col">' + L.facts([
      '<strong>(score) &gt; (9)</strong> is true when score is more than 9.',
      '<strong>(score) &lt; (10)</strong> is true when score is less than 10.',
      '<strong>(score) = (10)</strong> is true only when score is exactly 10.',
      '<strong>if then else</strong> runs the top part when the condition is true, and the bottom part when it is false. Never both.'
    ]) + L.blocks('if <(clicks) < (10)> then\nsay [Keep going!]\nelse\nsay [You win!]\nend') + '</div>');
  L.choice('check-decisions', 'Check: True or False', 'score is 10.', [
    { prompt: 'Which of these conditions is true when score is 10?', options: ['(score) > (10)', '(score) < (10)', '(score) = (10)'], correct: 2,
      explain: '10 is not more than 10 and not less than 10. It is equal to 10.' },
    { prompt: 'An if then else block has a false condition. Which blocks run?', options: ['The blocks in the else part', 'The blocks in the top part', 'Both parts'], correct: 0,
      explain: 'False means the else part runs. The top part is skipped.' }
  ]);
  L.slide('catcher-toolkit', 'Fruit Catcher Toolkit',
    L.heading('Fruit Catcher Toolkit', 'Blocks for the next challenge. Work out where each one goes.') +
    '<div class="igame-two-col">' + L.blocks('go to x: (pick random (-200) to (200)) y: (170)\n\nif <(y position) < (-170)> then\nchange [lives v] by (-1)\nend') +
    L.facts([
      '<strong>pick random</strong> gives a different number each time, so the Apple drops from a new place.',
      '<strong>y position &lt; -170</strong> is true when the Apple reaches the bottom: a miss.',
      'A catch is <strong>touching [Bowl]?</strong>.',
      'When lives reaches 0 the game is over.'
    ]) + '</div>');
  L.challenge('activity-2', 'Activity 2: Fruit Catcher', 'Work on your own. The starter project has the Bowl and the Apple.', 'fruit-catcher', 'Fruit Catcher', [
    'The arrow keys move the Bowl. The green flag sets score to 0 and lives to 3.',
    'The Apple starts at the top at a random x, then falls.',
    'A catch adds 1 to score. A miss takes 1 from lives. Either way the Apple goes back to the top.',
    'When lives reaches 0 the game ends.'
  ]);
  L.short('practice-1', 'Checked Practice (1 of 2)', 'lives starts at 3. This check runs every time the Apple is missed.', [
    'The player misses the Apple 3 times. What is lives now?'
  ], [
    { pattern: num(0, 'lives'), feedback: 'Each miss takes 1 away from 3.' }
  ], 'change [lives v] by (-1)\nif <(lives) = (0)> then\nsay [Game over]\nstop [all v]\nend');
  L.short('practice-2', 'Checked Practice (2 of 2)', 'clicks is 12 when this runs.', [
    'What does the sprite say?'
  ], [
    { pattern: String.raw`^\s*["']?\s*you\s+win\s*!?\s*["']?\s*$`, feedback: 'Is 12 less than 10? If not, the else part runs.' }
  ], 'if <(clicks) < (10)> then\nsay [Keep going!]\nelse\nsay [You win!]\nend');
  L.plenary('y6-iplan-l3', 'Variables and Decisions');
  L.save();
}

// ============================================================ 6.2.4
{
  const L = lesson('y6-icode-l4', 'y6l4', '6.2.4: Costumes, Backdrops and Messages');
  L.choice('do-now', 'Do Now: Variables and Decisions', 'Recap of 6.2.3: Variables and Decisions.', [
    { prompt: 'Which block adds 1 to a variable called score?', options: ['set [score] to (1)', 'change [score] by (1)', 'show variable [score]'], correct: 1,
      explain: 'change adds to the value it already has. set replaces it.' },
    { prompt: 'clicks is 10. Is (clicks) < (10) true or false?', options: ['true', 'false'], correct: 1,
      explain: '10 is not less than 10, so the condition is false.' }
  ]);
  L.short('do-now-2', 'Do Now: Loop Recap', 'Recap of 6.2.2: Loops and Pong. The sprite starts at x: 0, y: 0.', [
    'What is y after the loop?'
  ], [
    { pattern: num(90, 'y'), feedback: 'The loop runs 3 times and adds 30 to y each time.' }
  ], 'when flag clicked\nrepeat (3)\nchange y by (30)\nwait (0.5) seconds\nend');
  L.title('Costumes, Backdrops and Messages', '6.2.4', [
    'Animate a sprite by switching costumes in a loop.',
    'Change level with a backdrop and a broadcast message.',
    'Build an animation and a levels game that check themselves.'
  ]);
  L.slide('costumes', 'Costumes Make Animation',
    L.heading('Costumes Make Animation', 'A sprite can have several <strong>costumes</strong>. Swapping between them quickly makes it look alive.') +
    '<div class="igame-two-col">' + L.facts([
      '<strong>next costume</strong> switches to the next one, and back to the first after the last.',
      'Inside a loop with <strong>wait (0.2) seconds</strong>, the legs move at a walking pace.',
      '<strong>set rotation style [left-right]</strong> keeps the sprite upright when it turns round.'
    ]) + L.blocks('when flag clicked\nset rotation style [left-right v]\nforever\nmove (6) steps\nnext costume\nif on edge, bounce\nwait (0.2) seconds\nend') + '</div>');
  L.choice('check-costumes', 'Check: Costumes', 'A sprite has two costumes, walk1 and walk2.', [
    { prompt: 'The walk animation changes costume far too fast to see. Which block fixes it?', options: ['next costume', 'wait (0.2) seconds', 'move (10) steps'], correct: 1,
      explain: 'A short wait inside the loop slows the costume changes down.' },
    { prompt: 'The sprite is wearing walk2. What does next costume do?', options: ['Switches back to walk1', 'Nothing, it stays on walk2', 'Hides the sprite'], correct: 0,
      explain: 'After the last costume, next costume goes back to the first.' }
  ]);
  L.challenge('activity-1', 'Activity 1: Street Walker', 'Work on your own. Make the Walker walk up and down the street.', 'street-walker', 'Street Walker', [
    'After the green flag the Walker keeps moving and switching costume.',
    'The legs move at a walking pace.',
    'At the edge it turns round and walks back, the right way up.'
  ]);
  L.slide('messages', 'Backdrops and Broadcasts',
    L.heading('Backdrops and Broadcasts', 'A new level can be a new <strong>backdrop</strong>. A <strong>broadcast</strong> tells every sprite at once.') +
    '<div class="igame-two-col">' + L.facts([
      '<strong>broadcast [level up]</strong> sends a message to every sprite and the stage.',
      'Every <strong>when I receive [level up]</strong> script then starts, wherever it is.',
      '<strong>switch backdrop to [Level 2]</strong> changes the stage picture.',
      'One message can start many scripts: the backdrop changes, the Hero speaks, level becomes 2.'
    ]) + L.blocks('if <(score) = (5)> then\nbroadcast [level up v]\nend\n\nwhen I receive [level up v]\nswitch backdrop to [Level 2 v]\nset [level v] to (2)') + '</div>');
  L.choice('check-messages', 'Check: Messages', 'Choose the best answer.', [
    { prompt: 'Which block starts a script when a message arrives?', options: ['broadcast [level up]', 'when I receive [level up]', 'when green flag clicked'], correct: 1,
      explain: 'broadcast sends the message. when I receive waits for it.' },
    { prompt: 'Which scripts start when [level up] is broadcast?', options: ['Only scripts in the sprite that sent it', 'Every when I receive [level up] script', 'Only scripts on the stage'], correct: 1,
      explain: 'A broadcast goes to every sprite and the stage.' }
  ]);
  L.challenge('activity-2', 'Activity 2: Level Up', 'Work on your own. The Hero already moves with the arrow keys.', 'level-up', 'Level Up', [
    'The green flag sets the backdrop to Level 1, score to 0 and level to 1.',
    'Touching the Coin adds 1 to score and sends the Coin somewhere new.',
    'At 5 coins, broadcast level up.',
    'Receiving level up switches to Level 2, sets level to 2 and the Hero says Level 2!'
  ]);
  L.short('practice-1', 'Checked Practice (1 of 2)', 'The sprite has two costumes, walk1 and walk2.', [
    'Which costume is it wearing when the script ends?'
  ], [
    { pattern: String.raw`^\s*(costume\s*)?walk\s*2\s*$`, feedback: 'Start on walk1, then take one step for each turn of the loop: walk2, walk1, ...' }
  ], 'when flag clicked\nswitch costume to [walk1 v]\nrepeat (3)\nnext costume\nend');
  L.short('practice-2', 'Checked Practice (2 of 2)', 'score starts at 0 and each coin adds 2. This check runs after every coin.', [
    'How many coins must the Hero collect to reach Level 2?'
  ], [
    { pattern: String.raw`^\s*5\s*(coins?)?\s*$`, feedback: 'score goes 2, 4, 6, ... Count the coins until score is 10.' }
  ], 'if <(score) = (10)> then\nbroadcast [level up v]\nend');
  L.plenary('y6-icode-l4', 'Costumes, Backdrops and Messages');
  L.save();
}

// ============================================================ 6.2.4.5
// Everything 6.2.5 needs, in one lesson, for a class that met 6.2.1 to
// 6.2.4 before they were rebuilt. Pong is the one game every class built,
// so the Do Now starts there. Its two builds reuse the 6.2.3 and 6.2.4
// challenges, reported under this lesson.
{
  const L = lesson('y6-recap-l45', 'y6l45', '6.2.4.5: Scratch Skills Recap');
  L.choice('do-now', 'Do Now: Pong', 'Recap of the Pong game you built earlier in this unit.', [
    { prompt: 'Which block made the Paddle follow the mouse?', options: ['change y by (10)', 'set x to (mouse x)', 'go to x: (0) y: (0)'], correct: 1,
      explain: 'set x to (mouse x), inside forever, moved the Paddle to the mouse again and again.' },
    { prompt: 'The Ball touched the Paddle. What happened to score?', options: ['It went back to 0', 'Nothing', 'It went up by 1'], correct: 2,
      explain: 'change [score] by (1) ran inside the if touching [Paddle] block.' }
  ]);
  L.short('do-now-2', 'Do Now: Score and Speed', 'Recap of Pong. These blocks ran each time the Ball hit the Paddle. score starts at 0 and speed starts at 5.', [
    'The Ball hits the Paddle 3 times. What is score?',
    'What is speed after those 3 hits?'
  ], [
    { pattern: num(3, 'score'), feedback: 'Each hit adds 1 to score.' },
    { pattern: String.raw`^\s*(speed\s*[:=]?\s*)?5\.75\s*$`, feedback: 'Each hit adds 0.25 to speed, starting from 5.' }
  ], 'change [score v] by (1)\nchange [speed v] by (0.25)');
  L.title('Scratch Skills Recap', '6.2.4.5', [
    'Control a sprite with the keyboard, using x and y.',
    'Keep score with variables and decide with if.',
    'Change costumes, backdrops and levels with messages.',
    'Build two games that check themselves, ready to plan your own.'
  ]);
  L.slide('keys', 'Keyboard Control and the Grid',
    L.heading('Keyboard Control and the Grid', 'The player controls a sprite with <strong>events</strong>. The sprite moves on a grid of x and y.') +
    '<div class="igame-two-col">' + L.facts([
      '<strong>x</strong> runs from -240 (left) to 240 (right). <strong>y</strong> runs from -180 (bottom) to 180 (top).',
      '<strong>when [key] key pressed</strong> runs its script each time that key is pressed.',
      '<strong>change x by (15)</strong> moves right. A negative number moves left.',
      'Anything that happens all game long goes inside a <strong>forever</strong> loop.'
    ]) + L.blocks('when flag clicked\ngo to x: (0) y: (-140)\n\nwhen [left arrow v] key pressed\nchange x by (-15)') + '</div>');
  L.short('check-keys', 'Check: Keys and the Grid', 'The Bowl starts at x: 0.', [
    'The player presses the left arrow 4 times. What is x now?',
    'What is y at the top edge of the stage?'
  ], [
    { pattern: num(-60, 'x'), feedback: 'Each press adds -15, so x goes down by 15 each time.' },
    { pattern: num(180, 'y'), feedback: 'y runs from -180 at the bottom to the same number, positive, at the top.' }
  ], 'when [left arrow v] key pressed\nchange x by (-15)');
  L.slide('variables', 'Variables and Decisions',
    L.heading('Variables and Decisions', 'A <strong>variable</strong> stores a value that changes while the game runs. An <strong>if</strong> block decides what happens next.') +
    '<div class="igame-two-col">' + L.facts([
      '<strong>set</strong> a variable when the green flag is clicked, so every game starts fresh.',
      '<strong>change</strong> it during the game: +1 for a catch, -1 for a miss.',
      'A comparison such as <strong>(lives) = (0)</strong> is true or false.',
      '<strong>if then else</strong> runs the top part when true and the else part when false.'
    ]) + L.blocks('when flag clicked\nset [lives v] to (3)\n\nchange [lives v] by (-1)\nif <(lives) = (0)> then\nsay [Game over]\nstop [all v]\nend') + '</div>');
  L.choice('check-variables', 'Check: Variables and Decisions', 'Choose the best answer.', [
    { prompt: 'lives is 1. The player misses once more and change [lives] by (-1) runs. Which condition is now true?', options: ['(lives) = (1)', '(lives) = (0)', '(lives) > (0)'], correct: 1,
      explain: '1 take away 1 is 0, so (lives) = (0) is true and the game can end.' },
    { prompt: 'Which block should run when the green flag is clicked, so every game starts with 3 lives?', options: ['change [lives] by (3)', 'change [lives] by (-1)', 'set [lives] to (3)'], correct: 2,
      explain: 'set gives lives an exact value. change would add to whatever was left from the last game.' }
  ]);
  L.slide('catcher-toolkit', 'Fruit Catcher Toolkit',
    L.heading('Fruit Catcher Toolkit', 'Blocks for the next challenge. Work out where each one goes.') +
    '<div class="igame-two-col">' + L.blocks('go to x: (pick random (-200) to (200)) y: (170)\n\nif <(y position) < (-170)> then\nchange [lives v] by (-1)\nend') +
    L.facts([
      '<strong>pick random</strong> gives a different number each time, so the Apple drops from a new place.',
      '<strong>y position &lt; -170</strong> is true when the Apple reaches the bottom: a miss.',
      'A catch is <strong>touching [Bowl]?</strong>.',
      'When lives reaches 0 the game is over.'
    ]) + '</div>');
  L.challenge('activity-1', 'Activity 1: Fruit Catcher', 'Work on your own. The starter project has the Bowl and the Apple.', 'fruit-catcher', 'Fruit Catcher', [
    'The arrow keys move the Bowl. The green flag sets score to 0 and lives to 3.',
    'The Apple starts at the top at a random x, then falls.',
    'A catch adds 1 to score. A miss takes 1 from lives. Either way the Apple goes back to the top.',
    'When lives reaches 0 the game ends.'
  ], true);
  L.slide('looks', 'Costumes, Backdrops and Messages',
    L.heading('Costumes, Backdrops and Messages', 'Costumes bring a sprite to life. A new backdrop and a broadcast make a new level.') +
    '<div class="igame-two-col">' + L.facts([
      '<strong>next costume</strong> inside a loop, with <strong>wait (0.2) seconds</strong>, animates a sprite.',
      '<strong>switch backdrop to [Level 2]</strong> changes the stage picture.',
      '<strong>broadcast [level up]</strong> tells every sprite at once, and every <strong>when I receive [level up]</strong> script starts.'
    ]) + L.blocks('if <(score) = (5)> then\nbroadcast [level up v]\nend\n\nwhen I receive [level up v]\nswitch backdrop to [Level 2 v]') + '</div>');
  L.choice('check-looks', 'Check: Costumes and Messages', 'Choose the best answer.', [
    { prompt: 'A walk animation changes costume far too fast to see. Which block fixes it?', options: ['wait (0.2) seconds', 'next costume', 'move (10) steps'], correct: 0,
      explain: 'A short wait inside the loop slows the costume changes down.' },
    { prompt: 'Which block starts a script when a message arrives?', options: ['broadcast [level up]', 'switch backdrop to [Level 2]', 'when I receive [level up]'], correct: 2,
      explain: 'broadcast sends the message. when I receive waits for it.' }
  ]);
  L.challenge('activity-2', 'Activity 2: Level Up', 'Work on your own. The Hero already moves with the arrow keys.', 'level-up', 'Level Up', [
    'The green flag sets the backdrop to Level 1, score to 0 and level to 1.',
    'Touching the Coin adds 1 to score and sends the Coin somewhere new.',
    'At 5 coins, broadcast level up.',
    'Receiving level up switches to Level 2, sets level to 2 and the Hero says Level 2!'
  ], true);
  L.slide('game-needs', 'What Every Game Needs',
    L.heading('What Every Game Needs', 'Next lesson you plan and build your own game. The My Game checker looks for these six parts.') +
    '<div class="igame-debug-grid">' +
    '<div><strong>Sprites</strong><span>At least two: one to control, one to catch, dodge or collect.</span></div>' +
    '<div><strong>Controls</strong><span>when [key] key pressed, or set x to (mouse x).</span></div>' +
    '<div><strong>A loop</strong><span>forever keeps things moving and checking.</span></div>' +
    '<div><strong>A variable</strong><span>Set at the green flag, changed during the game.</span></div>' +
    '<div><strong>A decision</strong><span>An if block with touching or a comparison.</span></div>' +
    '<div><strong>An ending</strong><span>stop [all], say [Game over], or a new backdrop.</span></div>' +
    '</div>');
  L.short('practice-1', 'Checked Practice (1 of 2)', 'The Apple\'s loop. score starts at 0 and lives starts at 3.', [
    'The player catches the Apple 4 times and misses it once. What is score?',
    'What is lives?'
  ], [
    { pattern: num(4, 'score'), feedback: 'Only a catch makes touching [Bowl]? true.' },
    { pattern: num(2, 'lives'), feedback: 'Only a miss takes 1 away from lives.' }
  ], 'forever\nchange y by (-5)\nif <touching [Bowl v] ?> then\nchange [score v] by (1)\nend\nif <(y position) < (-170)> then\nchange [lives v] by (-1)\nend\nend');
  L.choice('practice-2', 'Checked Practice (2 of 2)', 'Use the six parts every game needs.', [
    { prompt: 'Fruit Catcher should end when lives reaches 0. Which block ends the whole game?', options: ['wait (1) seconds', 'stop [all]', 'hide'], correct: 1,
      explain: 'stop [all] stops every script, so the game is over.' },
    { prompt: 'Which of the six parts is when [right arrow] key pressed?', options: ['An ending', 'A variable', 'A control'], correct: 2,
      explain: 'It lets the player move a sprite, so it is a control.' }
  ]);
  L.plenary('y6-recap-l45', 'Scratch Skills Recap');
  L.save();
}

// ============================================================ 6.2.5
{
  const L = lesson('y6-idevelop-l5', 'y6l5', '6.2.5: Plan and Build Your Own Game');
  const field = (id, label, placeholder, rows) => rows
    ? `<textarea class="lesson-exam-answer" data-answer-id="${id}" aria-label="${label}" rows="${rows}" placeholder="${placeholder}"></textarea>`
    : `<input class="pseudocode-output-input lesson-exam-answer" data-answer-kind="short" data-answer-id="${id}" aria-label="${label}" autocomplete="off" placeholder="${placeholder}">`;
  const panel = (title, hint, body) => `<div class="iplan-panel"><h3>${title}</h3><p class="iplan-hint">${hint}</p>${body}</div>`;
  L.choice('do-now', 'Do Now: Messages and Decisions', 'Recap of 6.2.4.5: Scratch Skills Recap.', [
    { prompt: 'Which block tells every sprite that the level has changed?', options: ['broadcast [level up]', 'switch costume to [level up]', 'say [level up]'], correct: 0,
      explain: 'A broadcast reaches every sprite and the stage.' },
    { prompt: 'lives is 1. The player misses once more and change [lives] by (-1) runs. Is (lives) = (0) now true?', options: ['false', 'true'], correct: 1,
      explain: '1 take away 1 is 0, so the condition is true and the game can end.' }
  ]);
  L.title('Plan and Build Your Own Game', '6.2.5', [
    'Plan a game: sprites, controls, variables, and how it ends.',
    'Build it from the plan, testing each piece as you add it.',
    'Check it has the parts every good game needs.'
  ]);
  L.slide('plan', 'A Plan Before Code',
    L.heading('A Plan Before Code', 'Here is the plan for Fruit Catcher, the catching game you have built. Yours will have the same parts.') +
    '<div class="igame-two-col"><div class="lesson-flow-task"><h3>Fruit Catcher plan</h3>' + L.facts([
      '<strong>Sprites</strong>: Bowl (the player moves it), Apple (falls from a random place).',
      '<strong>Controls</strong>: left and right arrow keys.',
      '<strong>Variables</strong>: score (apples caught), lives (misses left, starts at 3).',
      '<strong>Win or lose</strong>: lose when lives reaches 0.'
    ]) + '</div>' + L.facts([
      'A plan lets you, or someone else, build the game without guessing.',
      'Each line of the plan becomes a script or a sprite.',
      'Build one line at a time and test it before the next.'
    ]) + '</div>');
  L.choice('check-plan', 'Check: The Plan', 'Use the Fruit Catcher plan.', [
    { prompt: 'In the Fruit Catcher plan, what is lives?', options: ['A sprite', 'A variable', 'A backdrop'], correct: 1,
      explain: 'lives stores a number that changes while the game runs, so it is a variable.' },
    { prompt: 'You add 6 new blocks at once and the game breaks. Why is testing after each small change better?', options: ['The game runs faster', 'You know the bug is in the part you just added', 'Scratch saves your work'], correct: 1,
      explain: 'Testing each small change means a new bug must be in the few blocks you just added.' }
  ]);
  L.slide('plan-1', 'Plan: Name, Aim and Controls',
    L.heading('Plan: Name, Aim and Controls') + '<div class="iplan-grid">' +
    panel('Game', 'What is it called?', field('game-name', 'Game name', 'e.g. Meteor Dodge')) +
    panel('Aim', 'What does the player try to do?', field('game-aim', 'Game aim', 'e.g. Dodge the falling meteors and collect stars for points', 3)) +
    panel('Controls', 'Which keys or mouse moves control it?', field('game-controls', 'Game controls', 'e.g. left and right arrows move the ship')) +
    panel('Win or lose', 'How does the game end?', field('game-end', 'How the game ends', 'e.g. win at 20 stars, lose when lives reaches 0', 2)) + '</div>');
  L.slide('plan-2', 'Plan: Sprites',
    L.heading('Plan: Sprites', 'Two or three sprites. Say what each one does, in your own words.') +
    '<table class="iplan-table"><thead><tr><th>Sprite</th><th>What will it do?</th></tr></thead><tbody>' +
    [1, 2, 3].map(n => `<tr><td>${field(`sprite-${n}-desc`, `Sprite ${n} name`, ['e.g. Ship', 'e.g. Meteor', 'e.g. Star'][n - 1])}</td><td>${field(`sprite-${n}-code`, `Sprite ${n} job`, ['e.g. moves left and right with the arrow keys', 'e.g. falls from a random x; touching the Ship loses a life', 'e.g. falls too; touching the Ship adds 1 to score'][n - 1])}</td></tr>`).join('') +
    '</tbody></table>');
  L.slide('plan-3', 'Plan: Variables and Levels',
    L.heading('Plan: Variables and Levels') +
    '<table class="iplan-table"><thead><tr><th>Variable</th><th>What does it count? What does the green flag set it to?</th></tr></thead><tbody>' +
    [1, 2].map(n => `<tr><td>${field(`var-${n}-name`, `Variable ${n} name`, ['e.g. score', 'e.g. lives'][n - 1])}</td><td>${field(`var-${n}-desc`, `Variable ${n} description`, ['e.g. stars collected, starts at 0', 'e.g. hits left, starts at 3'][n - 1])}</td></tr>`).join('') +
    '</tbody></table><div class="iplan-grid">' +
    panel('Levels', 'Optional: what changes at level 2?', field('levels', 'Levels', 'e.g. at 10 stars, broadcast level up: new backdrop and faster meteors', 2)) + '</div>');
  L.add({ id: 'review', label: 'Review Your Plan', type: 'plan-summary', containerId: 'y6l5-plan-summary',
    fields: [
      { type: 'text', step: 'plan-1', id: 'game-name', label: 'Name' },
      { type: 'text', step: 'plan-1', id: 'game-aim', label: 'Aim' },
      { type: 'text', step: 'plan-1', id: 'game-controls', label: 'Controls' },
      { type: 'text', step: 'plan-1', id: 'game-end', label: 'Win or lose' },
      { type: 'pairs', step: 'plan-2', label: 'Sprites', items: [1, 2, 3].map(n => ({ desc: `sprite-${n}-desc`, extra: `sprite-${n}-code` })) },
      { type: 'pairs', step: 'plan-3', label: 'Variables', items: [1, 2].map(n => ({ desc: `var-${n}-name`, extra: `var-${n}-desc` })) },
      { type: 'text', step: 'plan-3', id: 'levels', label: 'Levels' }
    ],
    content: L.heading('Review Your Plan', 'Your whole plan on one screen. Keep this slide open beside TurboWarp while you build.') + '<div class="iplan-summary" id="y6l5-plan-summary"></div>' });
  L.challenge('activity-1', 'Activity 1: Build Your Game', 'Work on your own, from your plan. Build one piece, test it, then the next.', 'my-game', 'My Game', [
    'Sprites first, then the controls.',
    'Then a loop that keeps the game running.',
    'Then a variable: set it at the green flag, change it during the game.',
    'Then an if block that decides something, and a way to win or lose.'
  ]);
  L.slide('level-two', 'Make It Better: A Second Level',
    L.heading('Make It Better: A Second Level', 'When every check passes, add a level with a broadcast and a backdrop, as in Level Up.') +
    '<div class="igame-two-col">' + L.blocks('if <(score) = (10)> then\nbroadcast [level up v]\nend\n\nwhen I receive [level up v]\nswitch backdrop to [Level 2 v]') + L.facts([
      'Add a second backdrop for level 2.',
      'Broadcast a message when the player reaches your target.',
      'Make level 2 harder: faster enemies, or a new sprite.',
      'The bonus check in My Game looks for the second level.'
    ]) + '</div>');
  L.challenge('activity-2', 'Activity 2: Level Two', 'Work on your own. Open My Game again: your project is still there.', 'my-game', 'My Game', [
    'Add a second backdrop.',
    'Switch to it with a broadcast when the player reaches your target.',
    'Make level 2 harder than level 1.',
    'Press Check my project to see the bonus check go green.'
  ]);
  L.short('practice', 'Checked Practice', 'score starts at 0. This script belongs to the Star.', [
    'The Player collects the Star 3 times. What is score?'
  ], [
    { pattern: num(15, 'score'), feedback: 'Each time the Star is collected, score goes up by 5.' }
  ], 'when flag clicked\nforever\nif <touching [Player v] ?> then\nchange [score v] by (5)\ngo to (random position v)\nend\nend');
  L.plenary('y6-idevelop-l5', 'Plan and Build Your Own Game');
  L.save();
}

// ============================================================ 6.2.6
{
  const L = lesson('y6-idebug-l6', 'y6l6', '6.2.6: Test and Debug');
  L.choice('do-now', 'Do Now: Planning and Messages', 'Question 1 recaps 6.2.5 and question 2 recaps 6.2.4.', [
    { prompt: 'A game plan should say how the game ends. What does that part describe?', options: ['How the player wins or loses', 'Which costume each sprite starts in', 'Which colour the backdrop is'], correct: 0,
      explain: 'The ending is how you win and how you lose.' },
    { prompt: 'Which block makes every when I receive [level up] script start?', options: ['switch backdrop to [Level 2]', 'broadcast [level up]', 'next costume'], correct: 1,
      explain: 'broadcast sends the message that those scripts wait for.' }
  ]);
  L.short('do-now-2', 'Do Now: If Else Recap', 'Recap of 6.2.3: Variables and Decisions. clicks is 9.', [
    'What does the sprite say?'
  ], [
    { pattern: String.raw`^\s*["']?\s*keep\s+going\s*!?\s*["']?\s*$`, feedback: 'Is 9 more than 9? If not, the else part runs.' }
  ], 'if <(clicks) > (9)> then\nsay [You win!]\nelse\nsay [Keep going!]\nend');
  L.title('Test and Debug', '6.2.6', [
    'Test a program like a tester: expected against actual.',
    'Find and fix bugs in six broken Scratch projects.',
    'Record a bug clearly enough for someone else to fix it.'
  ]);
  L.slide('testing', 'Test It Like a Tester',
    L.heading('Test It Like a Tester', 'A <strong>bug</strong> is where what should happen and what does happen are different.') +
    '<div class="igame-two-col"><table class="iplan-table"><thead><tr><th>I did</th><th>Expected</th><th>Actual</th></tr></thead><tbody>' +
    '<tr><td>Pressed left arrow</td><td>Rocket moves left</td><td>It moved right</td></tr>' +
    '<tr><td>Clicked 10 times</td><td>Says You win!</td><td>Said nothing</td></tr>' +
    '<tr><td>Clicked 9 times</td><td>No message yet</td><td>No message</td></tr></tbody></table>' +
    L.facts([
      'Test every control, one at a time.',
      'Test the edges: the sides of the stage, the floor.',
      'Test either side of a target: 9, 10 and 11 clicks.',
      'Change one thing, then test again.'
    ]) + '</div>');
  L.choice('check-testing', 'Check: Testing', 'Choose the best answer.', [
    { prompt: 'A game should say You win! at 10 clicks. Which click counts should you test?', options: ['Only 10', '9, 10 and 11', '1 and 100'], correct: 1,
      explain: 'Test just below, on, and just above the target. Off-by-one bugs hide there.' },
    { prompt: 'Expected: the Rocket moves left. Actual: it moves right. What is this?', options: ['A bug', 'A broadcast', 'A costume'], correct: 0,
      explain: 'Expected and actual are different, so there is a bug to fix.' }
  ]);
  L.challenge('activity-1', 'Activity 1: Bug Hunt 1 to 3', 'Work on your own. Each project has one bug. Test it, find the bug, fix it, then press Next.', 'bug-wrong-way', 'Bug Hunt', [
    'Bug Hunt 1: one arrow key goes the wrong way.',
    'Bug Hunt 2: a counter that gets stuck.',
    'Bug Hunt 3: a ball that moves once and stops.',
    'Test first: watch what happens before you change any blocks.'
  ]);
  L.slide('where-bugs-hide', 'Where Bugs Hide',
    L.heading('Where Bugs Hide', 'What you see tells you where to look.') +
    '<div class="igame-debug-grid">' +
    '<div><strong>Goes the wrong way</strong><span>Look at the numbers in the move and change blocks. Is one negative when it should be positive?</span></div>' +
    '<div><strong>Happens once, then stops</strong><span>Blocks that should keep running need to be inside a forever or repeat loop.</span></div>' +
    '<div><strong>A value never resets</strong><span>Find the green flag script. Does it set the variable?</span></div>' +
    '<div><strong>Something never happens</strong><span>Read the condition. Which sprite or colour does it check? Is the comparison right?</span></div>' +
    '</div>');
  L.short('check-bug', 'Check: Spot the Bug', 'This script should move the sprite left.', [
    'What number should be in the change x block?'
  ], [
    { pattern: num(-10, 'x'), feedback: 'Moving left makes x smaller, so the number must be negative.' }
  ], 'when [left arrow v] key pressed\nchange x by (10)');
  L.challenge('activity-2', 'Activity 2: Bug Hunt 4 to 6', 'Work on your own. The button opens Bug Hunt 4. Press Next after each fix.', 'bug-wrong-sprite', 'Bug Hunt 4', [
    'Bug Hunt 4: coins that do not count.',
    'Bug Hunt 5: a game you cannot win.',
    'Bug Hunt 6: a game that never ends.',
    'Then test a partner\'s game from last lesson.'
  ]);
  L.written('bug-report', 'Test a Partner\'s Game', 'Swap with a partner and play their game from 6.2.5. Record one bug.', [
    { id: 'bug-did', prompt: 'What did you do, what did you expect, and what actually happened? Which script do you think causes it?', marks: 3,
      modelAnswer: 'The exact action (pressed the up arrow at the top edge), what should happen (the ship stops at the edge), what did happen (it went off the stage), and a script to look at (the up arrow script has no edge check). One mark each for the action, expected against actual, and the script.' }
  ]);
  L.choice('practice', 'Checked Practice', 'Use what you found in the Bug Hunts.', [
    { prompt: 'score should go up by 1 per coin, but it jumps by 3 every time. Where do you look first?', options: ['The script with change [score] by', 'The backdrop', 'The costume list'], correct: 0,
      explain: 'The script that changes score is the one that runs too many times: often because the Coin stays touching and nothing moves it away.' },
    { prompt: 'A game should end when lives reaches 0, but it never ends. Which condition has a bug?', options: ['if <(lives) = (0)>', 'if <(lives) < (0)>', 'if <(lives) = (1)>'], correct: 1,
      explain: 'lives stops at 0, so "less than 0" is never true. It should be "= 0".' }
  ]);
  L.plenary('y6-idebug-l6', 'Test and Debug');
  L.save();
}
