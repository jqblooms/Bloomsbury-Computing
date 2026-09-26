// Scratch Challenges, part 3 of 5: the Year 6 challenges for lessons 6.2.1
// to 6.2.3, plus the test helpers the later challenges share.
//
// Each challenge: id, lesson (the lesson it belongs to), title, brief,
// starter (a project definition, see scratchcheck-kit.js) and tasks. A
// task has the words the student sees, a `hint` in scratchblocks text
// (shown faded in support mode) and an async `test(t)`. `bonus: true`
// tasks are extras: the challenge counts as done without them.
(function () {
  'use strict';
  if (!/[?&]scratchcheck/.test(location.search)) return;
  var K = window.ScratchCheckKit;

  var KEY_WORDS = { right: 'right arrow', left: 'left arrow', up: 'up arrow', down: 'down arrow', space: 'space key' };

  // Press one arrow key and check the sprite moved that way, and only that way.
  async function keyMoves(t, name, key) {
    var axis = key === 'left' || key === 'right' ? 'x' : 'y';
    var sign = key === 'right' || key === 'up' ? 1 : -1;
    var other = axis === 'x' ? 'y' : 'x';
    await t.flag(300);
    t.place(name, 0, 0);
    await t.wait(60);
    var before = t.pos(name);
    await t.press(key);
    var after = t.pos(name);
    var moved = after[axis] - before[axis];
    var way = axis === 'x' ? (sign > 0 ? 'right' : 'left') : (sign > 0 ? 'up' : 'down');
    if (moved === 0 && after[other] === before[other]) {
      t.fail('I pressed the ' + KEY_WORDS[key] + '. The ' + name + ' did not move.');
    }
    if (Math.sign(moved) !== sign) {
      t.fail('I pressed the ' + KEY_WORDS[key] + '. The ' + name + ' went from ' + axis + ': ' + before[axis] + ' to ' + axis + ': ' + after[axis] +
        '. Moving ' + way + ' makes ' + axis + ' ' + (sign > 0 ? 'bigger' : 'smaller') + '.');
    }
    if (!t.near(after[other], before[other], 0.5)) {
      t.fail('I pressed the ' + KEY_WORDS[key] + '. The ' + name + ' moved ' + (other === 'y' ? 'up or down' : 'left or right') + ' as well. Only change ' + axis + '.');
    }
  }

  // After the green flag, does `name` pass through `points` in order?
  async function tour(t, name, points, timeoutMs) {
    var reached = 0;
    await t.until(function () {
      reached = t.visitedInOrder(name, points, 3);
      return reached === points.length;
    }, timeoutMs || 6000);
    return reached;
  }

  function pointText(p) { return '(' + p[0] + ', ' + p[1] + ')'; }

  // Where the sprite went after the last point it reached, for the message.
  function wentInstead(t, name, points, reached) {
    var trace = t.trace(name);
    if (!trace.length) return 'It did not move.';
    var last = trace[trace.length - 1];
    return 'It ' + (reached ? 'went on to' : 'ended at') + ' x: ' + Math.round(last.x) + ', y: ' + Math.round(last.y) + '.';
  }

  // Did the game stop (stop all, or every script finished) within the time?
  // A project with nothing running has no game to stop yet.
  function stopsWithin(t, ms) {
    if (!t.running()) t.fail('Nothing is running after the green flag, so there is no game to stop yet.');
    return t.until(function () { return t.stopSeen || !t.running(); }, ms);
  }

  K.helpers = { keyMoves: keyMoves, tour: tour, pointText: pointText, wentInstead: wentInstead, stopsWithin: stopsWithin, KEY_WORDS: KEY_WORDS };

  function arrowTask(key, sprite) {
    var axis = key === 'left' || key === 'right' ? 'x' : 'y';
    var step = key === 'right' || key === 'up' ? 10 : -10;
    return {
      id: key,
      text: 'Pressing the ' + KEY_WORDS[key] + ' moves the ' + sprite + ' ' + key + '.',
      hint: 'when [' + KEY_WORDS[key] + ' v] key pressed\nchange ' + axis + ' by (' + step + ')',
      test: function (t) { return keyMoves(t, sprite, key); }
    };
  }
  K.arrowTask = arrowTask;

  // ======================= 6.2.1 Events and Coordinates =======================
  K.add({
    id: 'rocket-controls', lesson: 'y6-icontrol-l1', title: 'Rocket Controls',
    brief: 'Program the Rocket so a player can fly it round space with the arrow keys.',
    starter: {
      backdrops: [['space', 'space']],
      sprites: [{ name: 'Rocket', costumes: [['rocket', 'rocket']], x: 60, y: 40 }]
    },
    tasks: [
      { id: 'start', text: 'When the green flag is clicked, the Rocket goes to the middle: x: 0, y: 0.',
        hint: 'when flag clicked\ngo to x: (0) y: (0)',
        test: async function (t) {
          t.place('Rocket', 130, -90);
          await t.flag(300);
          var p = t.pos('Rocket');
          if (!t.near(p.x, 0) || !t.near(p.y, 0)) {
            t.fail('I moved the Rocket to x: 130, y: -90 and clicked the green flag. It ended at ' + t.where('Rocket') + '. It should go to x: 0, y: 0.');
          }
        } },
      arrowTask('right', 'Rocket'),
      arrowTask('left', 'Rocket'),
      arrowTask('up', 'Rocket'),
      arrowTask('down', 'Rocket'),
      { id: 'click', text: 'Clicking the Rocket makes it say Ready for launch!',
        hint: 'when this sprite clicked\nsay [Ready for launch!] for (2) seconds',
        test: async function (t) {
          await t.flag(200);
          await t.click('Rocket');
          await t.wait(100);
          var said = t.saying('Rocket');
          if (!said) t.fail('I clicked the Rocket. It did not say anything.');
          if (!t.said('Rocket', 'Ready for launch!')) t.fail('I clicked the Rocket. It said "' + said + '". It should say Ready for launch!');
        } }
    ]
  });

  var TREASURES = [[-150, 100], [150, 100], [150, -100]];
  K.add({
    id: 'treasure-tour', lesson: 'y6-icontrol-l1', title: 'Treasure Tour',
    brief: 'Read the coordinates on the stage. Make the Robot glide to each treasure in turn.',
    starter: {
      backdrops: [['treasure map', 'treasureGrid']],
      sprites: [{ name: 'Robot', costumes: [['robot', 'robot']], x: 0, y: 0 }]
    },
    tasks: [
      { id: 'start', text: 'When the green flag is clicked, the Robot goes to its start: x: -180, y: -120.',
        hint: 'when flag clicked\ngo to x: (-180) y: (-120)',
        test: async function (t) {
          t.place('Robot', 40, 40);
          await t.flag(0);
          var reached = await tour(t, 'Robot', [[-180, -120]], 1200);
          if (!reached) t.fail('I clicked the green flag. The Robot never went to x: -180, y: -120. ' + wentInstead(t, 'Robot', [], 0));
        } },
      { id: 'first', text: 'Then it glides to the yellow treasure at (-150, 100).',
        hint: 'glide (1) secs to x: (-150) y: (100)',
        test: async function (t) {
          await t.flag(0);
          var reached = await tour(t, 'Robot', [[-180, -120], TREASURES[0]], 5000);
          if (reached < 2) t.fail('The Robot did not reach the yellow treasure at (-150, 100). ' + wentInstead(t, 'Robot', [], reached));
          var trace = t.trace('Robot');
          var steps = trace.filter(function (p) { return p.y > -120 && p.y < 100; }).length;
          if (steps < 4) t.fail('The Robot jumped straight to the treasure. Use a glide block so it travels there.');
        } },
      { id: 'all', text: 'Next it glides to the blue treasure at (150, 100), then the red treasure at (150, -100).',
        hint: 'glide (1) secs to x: (150) y: (100)\nglide (1) secs to x: (150) y: (-100)',
        test: async function (t) {
          await t.flag(0);
          var reached = await tour(t, 'Robot', TREASURES, 9000);
          if (reached < 3) {
            t.fail('The Robot reached ' + reached + ' of the 3 treasures in order. It missed ' + pointText(TREASURES[reached]) + '. ' + wentInstead(t, 'Robot', TREASURES, reached));
          }
        } },
      { id: 'found', text: 'At the red treasure, the Robot says Found them all!',
        hint: 'say [Found them all!] for (2) seconds',
        test: async function (t) {
          await t.flag(0);
          var reached = await tour(t, 'Robot', TREASURES, 9000);
          if (reached < 3) t.fail('The Robot needs to reach all three treasures first.');
          var ok = await t.until(function () { return t.said('Robot', 'Found them all!'); }, 2000);
          if (!ok) t.fail('The Robot reached the red treasure' + (t.saying('Robot') ? ' and said "' + t.saying('Robot') + '"' : ' but said nothing') + '. It should say Found them all!');
        } }
    ]
  });

  // ======================= 6.2.2 Loops and Pong =======================
  var CORNERS = [[100, -100], [100, 100], [-100, 100], [-100, -100]];
  K.add({
    id: 'square-dance', lesson: 'y6-igame-l2', title: 'Square Dance',
    brief: 'The Bee flies round the dashed square. Use a repeat loop so you only write one side.',
    starter: {
      backdrops: [['square', 'squareGrid']],
      sprites: [{ name: 'Bee', costumes: [['bee', 'bee']], x: 0, y: 0, direction: 90 }]
    },
    tasks: [
      { id: 'start', text: 'When the green flag is clicked, the Bee goes to the start (-100, -100) and points right (direction 90).',
        hint: 'when flag clicked\ngo to x: (-100) y: (-100)\npoint in direction (90)',
        test: async function (t) {
          t.place('Bee', 60, 60, 0);
          await t.flag(0);
          var reached = await tour(t, 'Bee', [[-100, -100]], 1200);
          if (!reached) t.fail('I clicked the green flag. The Bee never went to (-100, -100). ' + wentInstead(t, 'Bee', [], 0));
          var ok = await t.until(function () { return t.visitedInOrder('Bee', [[-100, -100], [100, -100]], 3) === 2 || t.near(t.sprite('Bee').direction, 90, 0.5); }, 1500);
          if (!ok) t.fail('The Bee started at (-100, -100) but was not pointing right. Add point in direction (90).');
        } },
      { id: 'square', text: 'It flies anticlockwise round the square: (100, -100), (100, 100), (-100, 100), then back to the start.',
        hint: 'move (200) steps\nturn left (90) degrees',
        test: async function (t) {
          t.place('Bee', 0, 0, 0);
          await t.flag(0);
          var reached = await tour(t, 'Bee', CORNERS, 8000);
          if (reached < 4) {
            var msg = 'The Bee reached ' + reached + ' of the 4 corners in order. It missed ' + pointText(CORNERS[reached]) + '. ' + wentInstead(t, 'Bee', CORNERS, reached);
            if (reached >= 1) msg += ' Check which way it turns: left is anticlockwise.';
            t.fail(msg);
          }
        } },
      { id: 'repeat', text: 'The moves are inside a repeat block, written once, not four times.',
        hint: 'repeat (4)\nmove (200) steps\nturn left (90) degrees\nend',
        test: async function (t) {
          if (!t.usedUnder('event_whenflagclicked', 'control_repeat', 'Bee')) t.fail('I cannot find a repeat block in the Bee\'s green flag script.');
          var loopMoves = t.blocks('Bee').some(function (rec) {
            if (['motion_movesteps', 'motion_glidesecstoxy', 'motion_glideto', 'motion_changexby', 'motion_changeyby'].indexOf(rec.opcode) === -1) return false;
            var cur = rec.block;
            while (cur && cur.parent) { cur = rec.target.blocks.getBlock(cur.parent); if (cur && cur.opcode === 'control_repeat') return true; }
            return false;
          });
          if (!loopMoves) t.fail('There is a repeat block, but the move is not inside it.');
        } },
      { id: 'slow', text: 'You can see each side: one lap takes at least 1 second.',
        hint: 'wait (0.5) seconds',
        test: async function (t) {
          await t.flag(0);
          var reached = await tour(t, 'Bee', CORNERS, 8000);
          if (reached < 4) t.fail('The Bee needs to fly the whole square first.');
          var trace = t.trace('Bee');
          var startAt = null, endAt = null, i;
          for (i = 0; i < trace.length; i++) if (t.near(trace[i].x, -100, 3) && t.near(trace[i].y, -100, 3)) { startAt = trace[i].at; break; }
          for (i = trace.length - 1; i >= 0; i--) if (t.near(trace[i].x, -100, 3) && t.near(trace[i].y, -100, 3)) { endAt = trace[i].at; break; }
          if (startAt == null || endAt - startAt < 1000) t.fail('One lap took ' + (endAt - startAt) + ' milliseconds, too fast to see. Add a wait inside the loop.');
        } }
    ]
  });

  K.add({
    id: 'pong', lesson: 'y6-igame-l2', title: 'Pong',
    brief: 'Build Pong: the mouse moves the Paddle, the Ball bounces, a hit scores a point and the red floor ends the game.',
    starter: {
      backdrops: [['pong', 'pong']],
      sprites: [
        { name: 'Paddle', costumes: [['paddle', 'paddle']], x: 0, y: -135 },
        { name: 'Ball', costumes: [['ball', 'ball']], x: 0, y: 130, direction: 135 }
      ]
    },
    tasks: [
      { id: 'paddle', text: 'The Paddle follows the mouse left and right, and stays at the bottom.',
        hint: 'when flag clicked\nforever\nset x to (mouse x)\nend',
        test: async function (t) {
          await t.flag(200);
          t.sprite('Paddle').setXY(0, -135, true);
          var y0 = t.pos('Paddle').y;
          t.mouse(-150, 60);
          var ok = await t.until(function () { return t.near(t.pos('Paddle').x, -150, 4); }, 1200);
          if (!ok) t.fail('I moved the mouse to x: -150. The Paddle ended at ' + t.where('Paddle') + '.');
          t.mouse(120, -40);
          ok = await t.until(function () { return t.near(t.pos('Paddle').x, 120, 4); }, 1200);
          if (!ok) t.fail('I moved the mouse to x: 120. The Paddle ended at ' + t.where('Paddle') + '.');
          if (!t.near(t.pos('Paddle').y, y0, 3)) t.fail('The Paddle followed the mouse up and down too. Only set its x.');
        } },
      { id: 'start', text: 'When the green flag is clicked, the Ball goes to the top: x: 0, y: 130.',
        hint: 'when flag clicked\ngo to x: (0) y: (130)\npoint in direction (135)',
        test: async function (t) {
          t.place('Ball', 100, -40);
          await t.flag(0);
          var reached = await tour(t, 'Ball', [[0, 130]], 1000);
          if (!reached) t.fail('I clicked the green flag. The Ball never went to x: 0, y: 130.');
        } },
      { id: 'bounce', text: 'The Ball keeps moving by itself and bounces off the walls.',
        hint: 'forever\nmove (5) steps\nif on edge, bounce\nend',
        test: async function (t) {
          t.mouse(-200, 0);
          await t.flag(300);
          t.place('Ball', 0, 20, 90);
          await t.wait(80);
          var x0 = t.pos('Ball').x;
          var moved = await t.until(function () { return Math.abs(t.pos('Ball').x - x0) > 20; }, 1500);
          if (!moved) t.fail('I pointed the Ball right. It did not move by itself.');
          var bounced = await t.until(function () { var d = t.sprite('Ball').direction; return d < 0 && d > -180; }, 4000);
          if (!bounced) t.fail('The Ball reached ' + t.where('Ball') + ' but did not bounce back off the wall.');
        } },
      { id: 'hit', text: 'When the Ball hits the Paddle, it bounces up and the variable score goes up by 1.',
        hint: 'if <touching [Paddle v] ?> then\nchange [score v] by (1)\npoint in direction ((180) - (direction))\nmove (5) steps\nend',
        test: async function (t) {
          t.variable('score');
          t.mouse(0, 0);
          await t.flag(300);
          t.setValue('score', 0);
          t.place('Ball', 0, -60, 180);
          var up = await t.until(function () { var d = t.sprite('Ball').direction; return Math.abs(d) < 90; }, 2000);
          if (!up) t.fail('I dropped the Ball onto the Paddle. It did not bounce up. It ended at ' + t.where('Ball') + '.');
          await t.wait(400);
          var score = t.value('score');
          if (score === 0) t.fail('The Ball bounced off the Paddle but score stayed 0.');
          if (score !== 1) t.fail('One hit changed score to ' + score + '. It should go up by 1. Move the Ball away after the bounce so one hit counts once.');
        } },
      { id: 'reset', text: 'The green flag sets score back to 0.',
        hint: 'when flag clicked\nset [score v] to (0)',
        test: async function (t) {
          t.stop();
          t.setValue('score', 5);
          await t.flag(300);
          if (t.value('score') !== 0) t.fail('score was 5. I clicked the green flag and it was ' + t.value('score') + '. It should start at 0.');
        } },
      { id: 'floor', text: 'When the Ball touches the red floor, the game stops.',
        hint: 'wait until <touching color [#e02424] ?>\nstop [all v]',
        test: async function (t) {
          t.mouse(-200, 0);
          await t.flag(300);
          t.place('Ball', 160, -110, 180);
          var stopped = await stopsWithin(t, 2500);
          if (!stopped) t.fail('The Ball reached the red floor and the game kept going.');
        } },
      { id: 'faster', bonus: true, text: 'Bonus: each hit makes the Ball faster. A speed variable goes up after every hit.',
        hint: 'change [speed v] by (0.5)',
        test: async function (t) {
          t.variable('speed');
          t.mouse(0, 0);
          await t.flag(300);
          var before = t.value('speed');
          t.place('Ball', 0, -60, 180);
          await t.until(function () { return Math.abs(t.sprite('Ball').direction) < 90; }, 2000);
          await t.wait(300);
          if (!(t.value('speed') > before)) t.fail('speed was ' + before + ' before a hit and ' + t.value('speed') + ' after it.');
        } }
    ]
  });

  // ======================= 6.2.3 Variables and Decisions =======================
  async function clickTimes(t, name, n) {
    for (var i = 0; i < n; i++) await t.click(name);
    await t.wait(150);
  }

  K.add({
    id: 'gem-clicker', lesson: 'y6-iplan-l3', title: 'Gem Clicker',
    brief: 'Count the clicks in a variable. At 10 clicks the Gem turns gold.',
    starter: {
      backdrops: [['gem room', 'gemRoom']],
      sprites: [{ name: 'Gem', costumes: [['gem', 'gem'], ['gold', 'goldGem']], x: 0, y: 0 }]
    },
    tasks: [
      { id: 'reset', text: 'Make a variable called clicks. The green flag sets it to 0.',
        hint: 'when flag clicked\nset [clicks v] to (0)',
        test: async function (t) {
          t.variable('clicks');
          t.stop();
          t.setValue('clicks', 7);
          await t.flag(300);
          if (t.value('clicks') !== 0) t.fail('clicks was 7. After the green flag it was ' + t.value('clicks') + '. It should be 0.');
        } },
      { id: 'count', text: 'Clicking the Gem adds 1 to clicks.',
        hint: 'when this sprite clicked\nchange [clicks v] by (1)',
        test: async function (t) {
          t.variable('clicks');
          await t.flag(300);
          await clickTimes(t, 'Gem', 3);
          var n = t.value('clicks');
          if (n !== 3) t.fail('I clicked the Gem 3 times after the green flag. clicks was ' + n + '. It should be 3.');
        } },
      { id: 'costume', text: 'The green flag switches the Gem back to its gem costume.',
        hint: 'switch costume to [gem v]',
        test: async function (t) {
          t.stop();
          t.sprite('Gem').setCostume(1);
          await t.flag(300);
          if (t.costume('Gem') !== 'gem') t.fail('The Gem was gold. After the green flag it was still "' + t.costume('Gem') + '".');
        } },
      { id: 'gold', text: 'When clicks reaches 10, the Gem switches to its gold costume. Not before.',
        hint: 'if <(clicks) = (10)> then\nswitch costume to [gold v]\nend',
        test: async function (t) {
          t.variable('clicks');
          await t.flag(300);
          await clickTimes(t, 'Gem', 9);
          if (t.costume('Gem') === 'gold') t.fail('After 9 clicks the Gem was already gold. It should change at 10.');
          await clickTimes(t, 'Gem', 1);
          var gold = await t.until(function () { return t.costume('Gem') === 'gold'; }, 800);
          if (!gold) t.fail('After 10 clicks the Gem was still "' + t.costume('Gem') + '".');
        } },
      { id: 'message', text: 'Each click says Keep going! while clicks is less than 10, and You win! at 10 or more. Use if then else.',
        hint: 'if <(clicks) < (10)> then\nsay [Keep going!]\nelse\nsay [You win!]\nend',
        test: async function (t) {
          t.variable('clicks');
          await t.flag(300);
          await clickTimes(t, 'Gem', 3);
          if (!t.said('Gem', 'Keep going!')) t.fail('After 3 clicks the Gem said "' + t.saying('Gem') + '". It should say Keep going!');
          await clickTimes(t, 'Gem', 7);
          if (!t.said('Gem', 'You win!')) t.fail('After 10 clicks the Gem said "' + t.saying('Gem') + '". It should say You win!');
          if (!t.uses('control_if_else')) t.fail('It works. Now use one if then else block for the two messages.');
        } }
    ]
  });

  K.add({
    id: 'fruit-catcher', lesson: 'y6-iplan-l3', title: 'Fruit Catcher',
    brief: 'Apples fall from the sky. Catch one to score, miss one and lose a life. No lives left means game over.',
    starter: {
      backdrops: [['orchard', 'orchard']],
      sprites: [
        { name: 'Bowl', costumes: [['bowl', 'bowl']], x: 0, y: -140 },
        { name: 'Apple', costumes: [['apple', 'apple']], x: 0, y: 170 }
      ]
    },
    tasks: [
      { id: 'bowl', text: 'The left and right arrow keys move the Bowl.',
        hint: 'when [right arrow v] key pressed\nchange x by (15)',
        test: async function (t) {
          await t.flag(300);
          t.place('Bowl', 0, -140);
          await t.hold('right', 350);
          var x1 = t.pos('Bowl').x;
          if (!(x1 > 0)) t.fail('I held the right arrow. The Bowl stayed at x: ' + x1 + '.');
          await t.hold('left', 700);
          var x2 = t.pos('Bowl').x;
          if (!(x2 < x1)) t.fail('I held the left arrow. The Bowl did not move left.');
        } },
      { id: 'reset', text: 'The green flag sets score to 0 and lives to 3.',
        hint: 'when flag clicked\nset [score v] to (0)\nset [lives v] to (3)',
        test: async function (t) {
          t.variable('score'); t.variable('lives');
          t.stop();
          t.setValue('score', 9); t.setValue('lives', 0);
          await t.flag(300);
          if (t.value('score') !== 0) t.fail('After the green flag score was ' + t.value('score') + '. It should be 0.');
          if (t.value('lives') !== 3) t.fail('After the green flag lives was ' + t.value('lives') + '. It should be 3.');
        } },
      { id: 'fall', text: 'The Apple starts at the top (y: 170) at a random x, then falls.',
        hint: 'go to x: (pick random (-200) to (200)) y: (170)\nforever\nchange y by (-5)\nend',
        test: async function (t) {
          var xs = [];
          for (var i = 0; i < 3; i++) {
            t.place('Bowl', -230, -140);
            t.place('Apple', 0, -60);
            await t.flag(0);
            var top = await t.until(function () { return t.trace('Apple').some(function (p) { return p.y > 150; }); }, 1000);
            if (!top) t.fail('I clicked the green flag. The Apple did not go to the top.');
            var first = t.trace('Apple').filter(function (p) { return p.y > 150; })[0];
            xs.push(Math.round(first.x));
            await t.wait(500);
            if (!(t.pos('Apple').y < first.y - 10)) t.fail('The Apple started at the top but did not fall.');
          }
          if (xs[0] === xs[1] && xs[1] === xs[2]) t.fail('The Apple started at x: ' + xs[0] + ' three times. Use pick random for x.');
        } },
      { id: 'catch', text: 'Catching the Apple in the Bowl adds 1 to score and sends the Apple back to the top.',
        hint: 'if <touching [Bowl v] ?> then\nchange [score v] by (1)\ngo to x: (pick random (-200) to (200)) y: (170)\nend',
        test: async function (t) {
          t.variable('score');
          await t.flag(300);
          t.setValue('score', 0);
          t.place('Bowl', 0, -140);
          t.place('Apple', 0, -60);
          var scored = await t.until(function () { return t.value('score') >= 1; }, 2500);
          if (!scored) t.fail('The Apple fell into the Bowl. score stayed ' + t.value('score') + '.');
          var back = await t.until(function () { return t.pos('Apple').y > 100; }, 800);
          if (!back) t.fail('score went up, but the Apple did not go back to the top.');
          await t.wait(300);
          if (t.value('score') !== 1) t.fail('One catch made score ' + t.value('score') + '. It should go up by 1.');
        } },
      { id: 'miss', text: 'Missing the Apple (it reaches the bottom) takes 1 off lives and sends it back to the top.',
        hint: 'if <(y position) < (-170)> then\nchange [lives v] by (-1)\ngo to x: (pick random (-200) to (200)) y: (170)\nend',
        test: async function (t) {
          t.variable('lives');
          await t.flag(300);
          t.setValue('lives', 3);
          t.place('Bowl', -220, -140);
          t.place('Apple', 150, -120);
          var lost = await t.until(function () { return t.value('lives') < 3; }, 3000);
          if (!lost) t.fail('The Apple reached the bottom at ' + t.where('Apple') + '. lives stayed 3.');
          await t.wait(300);
          if (t.value('lives') !== 2) t.fail('One miss made lives ' + t.value('lives') + '. It should go down by 1.');
          if (!(t.pos('Apple').y > 60)) t.fail('lives went down, but the Apple did not go back to the top.');
        } },
      { id: 'over', text: 'When lives reaches 0 the game ends: stop all, or say Game over.',
        hint: 'if <(lives) = (0)> then\nsay [Game over]\nstop [all v]\nend',
        test: async function (t) {
          t.variable('lives');
          await t.flag(300);
          t.setValue('lives', 1);
          t.place('Bowl', -220, -140);
          t.place('Apple', 150, -120);
          var ended = await t.until(function () {
            return t.stopSeen || /game\s*over/i.test(t.saying('Apple') + ' ' + t.saying('Bowl'));
          }, 3000);
          if (!ended) t.fail('lives went from 1 to ' + t.value('lives') + ' and the game kept going.');
        } }
    ]
  });
})();
