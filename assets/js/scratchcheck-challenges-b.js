// Scratch Challenges, part 4 of 5: the Year 6 challenges for lessons 6.2.4
// to 6.2.6. The Bug Hunt starters arrive with one planted bug each; their
// tasks describe what the program should do, so the student tests, finds
// the bug and fixes it.
(function () {
  'use strict';
  if (!/[?&]scratchcheck/.test(location.search)) return;
  var K = window.ScratchCheckKit, V = K.V, H = K.helpers;

  // How many times the sprite's costume changes in `ms`, and how far it moves.
  function watch(t, name, ms) {
    var target = t.sprite(name), changes = 0, last = target.currentCostume, x0 = target.x, y0 = target.y;
    return new Promise(function (resolve) {
      var timer = setInterval(function () {
        if (target.currentCostume !== last) { changes += 1; last = target.currentCostume; }
      }, 10);
      setTimeout(function () {
        clearInterval(timer);
        resolve({ changes: changes, moved: Math.abs(target.x - x0) + Math.abs(target.y - y0) });
      }, ms);
    });
  }

  function heroScripts() {
    return [
      { x: 20, y: 20, blocks: [['event_whenflagclicked'], ['motion_gotoxy', { X: -150, Y: -110 }]] },
      { x: 20, y: 140, blocks: [['event_whenkeypressed', { KEY_OPTION: 'right arrow' }], ['motion_changexby', { DX: 10 }]] },
      { x: 20, y: 240, blocks: [['event_whenkeypressed', { KEY_OPTION: 'left arrow' }], ['motion_changexby', { DX: -10 }]] },
      { x: 280, y: 140, blocks: [['event_whenkeypressed', { KEY_OPTION: 'up arrow' }], ['motion_changeyby', { DY: 10 }]] },
      { x: 280, y: 240, blocks: [['event_whenkeypressed', { KEY_OPTION: 'down arrow' }], ['motion_changeyby', { DY: -10 }]] }
    ];
  }

  // Put the Hero on the Coin, wait for a score, then move the Hero clear.
  async function collect(t) {
    t.place('Coin', 100, -110);
    t.place('Hero', 100, -110);
    var before = t.value('score');
    var ok = await t.until(function () { return t.value('score') > before; }, 1500);
    t.place('Hero', -210, 150);
    return ok;
  }

  // ======================= 6.2.4 Costumes, Backdrops and Messages =======================
  K.add({
    id: 'street-walker', lesson: 'y6-icode-l4', title: 'Street Walker',
    brief: 'Animate the Walker: two costumes swapped in a loop make it look like it is walking.',
    starter: {
      backdrops: [['street', 'street']],
      sprites: [{ name: 'Walker', costumes: [['walk1', 'walk1'], ['walk2', 'walk2']], x: -150, y: -80, direction: 90 }]
    },
    tasks: [
      { id: 'walk', text: 'After the green flag the Walker keeps moving and keeps switching costume.',
        hint: 'when flag clicked\nforever\nmove (5) steps\nnext costume\nend',
        test: async function (t) {
          await t.flag(100);
          t.place('Walker', -100, -80, 90);
          var seen = await watch(t, 'Walker', 1500);
          if (seen.moved < 20) t.fail('In 1.5 seconds the Walker moved ' + Math.round(seen.moved) + ' steps. It should keep walking.');
          if (seen.changes < 3) t.fail('In 1.5 seconds the costume changed ' + seen.changes + ' times. Use next costume inside the loop.');
        } },
      { id: 'pace', text: 'The legs move at a walking pace: no more than 10 costume changes a second.',
        hint: 'wait (0.2) seconds',
        test: async function (t) {
          await t.flag(100);
          t.place('Walker', -100, -80, 90);
          var seen = await watch(t, 'Walker', 1000);
          if (seen.changes > 12) t.fail('The costume changed ' + seen.changes + ' times in one second, too fast to see. Add a wait inside the loop.');
          if (seen.changes < 2) t.fail('The costume changed ' + seen.changes + ' times in one second. It should keep changing.');
        } },
      { id: 'turn', text: 'At the edge of the stage the Walker turns round and walks back.',
        hint: 'if on edge, bounce',
        test: async function (t) {
          await t.flag(100);
          t.place('Walker', 190, -80, 90);
          var turned = await t.until(function () { return t.sprite('Walker').direction < 0; }, 2500);
          if (!turned) t.fail('I put the Walker near the right edge. It reached ' + t.where('Walker') + ' and did not turn round.');
          var x1 = t.pos('Walker').x;
          await t.wait(500);
          if (!(t.pos('Walker').x < x1)) t.fail('The Walker turned round but did not walk back.');
        } },
      { id: 'style', text: 'It stays the right way up when it turns (rotation style left-right).',
        hint: 'set rotation style [left-right v]',
        test: async function (t) {
          await t.flag(300);
          if (t.sprite('Walker').rotationStyle !== 'left-right') t.fail('After the green flag the rotation style is "' + t.sprite('Walker').rotationStyle + '", so the Walker turns upside down.');
        } }
    ]
  });

  K.add({
    id: 'level-up', lesson: 'y6-icode-l4', title: 'Level Up',
    brief: 'The Hero already moves with the arrow keys. Collect 5 coins to reach Level 2, using a broadcast.',
    starter: {
      backdrops: [['Level 1', 'level1'], ['Level 2', 'level2']],
      sprites: [
        { name: 'Hero', costumes: [['hero', 'hero']], x: -150, y: -110, scripts: heroScripts() },
        { name: 'Coin', costumes: [['coin', 'coin']], x: 100, y: -110 }
      ]
    },
    tasks: [
      { id: 'reset', text: 'The green flag sets the backdrop to Level 1, score to 0 and level to 1.',
        hint: 'when flag clicked\nswitch backdrop to [Level 1 v]\nset [score v] to (0)\nset [level v] to (1)',
        test: async function (t) {
          t.variable('score'); t.variable('level');
          t.stop();
          t.setValue('score', 3); t.setValue('level', 2);
          t.vm.runtime.getTargetForStage().setCostume(1);
          await t.flag(300);
          if (t.backdrop() !== 'Level 1') t.fail('After the green flag the backdrop was "' + t.backdrop() + '". It should be Level 1.');
          if (t.value('score') !== 0) t.fail('After the green flag score was ' + t.value('score') + '. It should be 0.');
          if (t.value('level') !== 1) t.fail('After the green flag level was ' + t.value('level') + '. It should be 1.');
        } },
      { id: 'coin', text: 'When the Hero touches the Coin, score goes up by 1 and the Coin jumps to a random place.',
        hint: 'forever\nif <touching [Hero v] ?> then\nchange [score v] by (1)\ngo to (random position v)\nend\nend',
        test: async function (t) {
          t.variable('score');
          await t.flag(300);
          t.setValue('score', 0);
          var ok = await collect(t);
          if (!ok) t.fail('I put the Hero on the Coin. score stayed 0.');
          var p = t.pos('Coin');
          if (t.near(p.x, 100, 2) && t.near(p.y, -110, 2)) t.fail('score went up, but the Coin stayed where it was.');
          await t.wait(400);
          if (t.value('score') !== 1) t.fail('One coin made score ' + t.value('score') + '. It should go up by 1.');
        } },
      { id: 'broadcast', text: 'When score reaches 5, broadcast the message level up. Something must receive it.',
        hint: 'if <(score) = (5)> then\nbroadcast [level up v]\nend',
        test: async function (t) {
          var sends = t.blocks().filter(function (b) { return b.opcode === 'event_broadcast' || b.opcode === 'event_broadcastandwait'; });
          if (!sends.length) t.fail('I cannot find a broadcast block.');
          var receives = t.blocks().filter(function (b) { return b.opcode === 'event_whenbroadcastreceived'; });
          if (!receives.length) t.fail('There is a broadcast, but no when I receive block to catch it.');
          var named = receives.some(function (b) { return /level\s*up/i.test(b.fields.BROADCAST_OPTION.value); });
          if (!named) t.fail('Name the message level up, in both the broadcast and the when I receive block.');
        } },
      { id: 'level2', text: 'When level up is received, the backdrop switches to Level 2 and level becomes 2.',
        hint: 'when I receive [level up v]\nswitch backdrop to [Level 2 v]\nset [level v] to (2)',
        test: async function (t) {
          t.variable('score'); t.variable('level');
          await t.flag(300);
          t.setValue('score', 4);
          var ok = await collect(t);
          if (!ok) t.fail('The Hero touched the Coin but score did not change.');
          var up = await t.until(function () { return t.backdrop() === 'Level 2' && t.value('level') === 2; }, 1500);
          if (!up) t.fail('score reached ' + t.value('score') + '. The backdrop is "' + t.backdrop() + '" and level is ' + t.value('level') + '.');
        } },
      { id: 'say', text: 'The Hero says Level 2! when the level changes.',
        hint: 'when I receive [level up v]\nsay [Level 2!] for (2) seconds',
        test: async function (t) {
          t.variable('score');
          await t.flag(300);
          t.setValue('score', 4);
          await collect(t);
          var said = await t.until(function () { return t.said('Hero', 'Level 2!'); }, 2000);
          if (!said) t.fail('score reached 5 and the Hero said ' + (t.saying('Hero') ? '"' + t.saying('Hero') + '"' : 'nothing') + '.');
        } }
    ]
  });

  // ======================= 6.2.5 Plan and Build Your Own Game =======================
  function anyUsed(t, opcodes) { return t.blocks().some(function (b) { return opcodes.indexOf(b.opcode) !== -1; }); }

  function everything(t) {
    var stage = t.vm.runtime.getTargetForStage();
    return JSON.stringify(t.vm.runtime.targets.filter(function (x) { return x.isOriginal; }).map(function (x) {
      var vars = Object.keys(x.variables).map(function (id) { return x.variables[id].value; });
      return [Math.round(x.x), Math.round(x.y), x.currentCostume, x.visible, vars, x.isStage ? '' : t.saying(x.getName())];
    })) + stage.currentCostume + t.vm.runtime.targets.length;
  }

  K.add({
    id: 'my-game', lesson: 'y6-idevelop-l5', title: 'My Game',
    brief: 'Build the game from your plan. These checks look for the parts every good game needs. Load your own project with File, Load from your computer, if you started it somewhere else.',
    starter: {
      backdrops: [['backdrop1', 'grid']],
      sprites: [{ name: 'Player', costumes: [['player', 'hero']], x: 0, y: 0 }]
    },
    tasks: [
      { id: 'sprites', text: 'At least two sprites.',
        hint: 'when flag clicked\ngo to x: (0) y: (-120)',
        test: async function (t) {
          var n = t.spriteNames().length;
          if (n < 2) t.fail('Your game has ' + n + ' sprite. Add another one with Choose a Sprite or Paint.');
        } },
      { id: 'control', text: 'The player controls something with the keyboard or the mouse.',
        hint: 'when [right arrow v] key pressed\nchange x by (10)',
        test: async function (t) {
          if (!anyUsed(t, ['event_whenkeypressed', 'sensing_keypressed', 'sensing_mousex', 'sensing_mousey', 'sensing_mousedown', 'event_whenthisspriteclicked', 'motion_goto'])) {
            t.fail('I cannot find a key press, mouse or click block, so the player cannot control anything.');
          }
        } },
      { id: 'loop', text: 'A loop keeps the game running (forever, repeat or repeat until).',
        hint: 'forever\nend',
        test: async function (t) {
          if (!anyUsed(t, ['control_forever', 'control_repeat', 'control_repeat_until'])) t.fail('I cannot find a forever, repeat or repeat until block.');
        } },
      { id: 'decision', text: 'An if block (or wait until) makes a decision with touching or a comparison.',
        hint: 'if <touching [Sprite2 v] ?> then\nend',
        test: async function (t) {
          if (!anyUsed(t, ['control_if', 'control_if_else', 'control_wait_until', 'control_repeat_until'])) t.fail('I cannot find an if, if then else or wait until block.');
          if (!anyUsed(t, ['sensing_touchingobject', 'sensing_touchingcolor', 'sensing_coloristouchingcolor', 'operator_gt', 'operator_lt', 'operator_equals'])) {
            t.fail('Your decision needs a condition: a touching block, or a comparison such as score = 10.');
          }
        } },
      { id: 'variable', text: 'A variable, such as score, that the green flag resets and the game changes.',
        hint: 'when flag clicked\nset [score v] to (0)\n\nchange [score v] by (1)',
        test: async function (t) {
          if (!t.usedUnder('event_whenflagclicked', 'data_setvariableto')) t.fail('I cannot find a set variable block in a green flag script.');
          if (!t.uses('data_changevariableby')) t.fail('Nothing changes a variable while the game runs. Use change by.');
        } },
      { id: 'ending', text: 'The game can end: a win or lose that stops the game, shows a message or switches backdrop.',
        hint: 'if <(lives) = (0)> then\nsay [Game over]\nstop [all v]\nend',
        test: async function (t) {
          if (!anyUsed(t, ['control_stop', 'looks_switchbackdropto', 'looks_switchbackdroptoandwait', 'event_broadcast', 'event_broadcastandwait', 'looks_say', 'looks_sayforsecs'])) {
            t.fail('I cannot find a way for the game to end: stop, switch backdrop, broadcast or say.');
          }
        } },
      { id: 'runs', text: 'It runs: after the green flag, something moves or changes.',
        hint: 'when flag clicked\nforever\nmove (5) steps\nif on edge, bounce\nend',
        test: async function (t) {
          await t.flag(200);
          var before = everything(t);
          t.mouse(-120, 60);
          await t.hold('right', 400);
          await t.hold('left', 400);
          await t.press('space');
          t.mouse(120, -60);
          t.spriteNames().forEach(function (n) { t.vm.runtime.startHats('event_whenthisspriteclicked', null, t.sprite(n)); });
          await t.wait(1500);
          if (everything(t) === before) t.fail('I clicked the green flag, pressed the arrow keys and space, moved the mouse and clicked each sprite. Nothing moved or changed.');
        } },
      { id: 'levels', bonus: true, text: 'Bonus: two levels. The game switches to a second backdrop.',
        hint: 'switch backdrop to [Level 2 v]',
        test: async function (t) {
          var backdrops = t.vm.runtime.getTargetForStage().getCostumes().length;
          if (backdrops < 2) t.fail('The stage has ' + backdrops + ' backdrop. Add a second one for level 2.');
          if (!anyUsed(t, ['looks_switchbackdropto', 'looks_switchbackdroptoandwait', 'looks_nextbackdrop'])) t.fail('Nothing switches the backdrop yet.');
        } }
    ]
  });

  // ======================= 6.2.6 Bug Hunt =======================
  // Support on a bug hunt shows how to find the bug (a tip), never the
  // fixed blocks, which would be the answer.
  function bugTasks(tasks, tips) {
    return tasks.map(function (task) {
      var copy = Object.assign({}, task);
      delete copy.hint;
      copy.tip = tips[task.id];
      return copy;
    });
  }

  K.add({
    id: 'bug-wrong-way', lesson: 'y6-idebug-l6', title: 'Bug Hunt 1: Wrong Way',
    brief: 'Test every arrow key. One key sends the Rocket the wrong way. Find the bug and fix it.',
    starter: {
      backdrops: [['space', 'space']],
      sprites: [{ name: 'Rocket', costumes: [['rocket', 'rocket']], x: 0, y: 0, scripts: [
        { x: 20, y: 20, blocks: [['event_whenflagclicked'], ['motion_gotoxy', { X: 0, Y: 0 }]] },
        { x: 20, y: 140, blocks: [['event_whenkeypressed', { KEY_OPTION: 'right arrow' }], ['motion_changexby', { DX: 10 }]] },
        { x: 20, y: 240, blocks: [['event_whenkeypressed', { KEY_OPTION: 'left arrow' }], ['motion_changexby', { DX: 10 }]] },
        { x: 280, y: 140, blocks: [['event_whenkeypressed', { KEY_OPTION: 'up arrow' }], ['motion_changeyby', { DY: 10 }]] },
        { x: 280, y: 240, blocks: [['event_whenkeypressed', { KEY_OPTION: 'down arrow' }], ['motion_changeyby', { DY: -10 }]] }
      ] }]
    },
    tasks: bugTasks([K.arrowTask('right', 'Rocket'), K.arrowTask('left', 'Rocket'), K.arrowTask('up', 'Rocket'), K.arrowTask('down', 'Rocket')], {
      right: 'Click the green flag, press the right arrow once and watch the x box under the stage. It should go up.',
      left: 'Press the left arrow once and watch x. It should go down. Find the script that runs when you press it.',
      up: 'Press the up arrow once and watch the y box under the stage.',
      down: 'Press the down arrow once and watch y.'
    })
  });

  K.add({
    id: 'bug-reset', lesson: 'y6-idebug-l6', title: 'Bug Hunt 2: Stuck Counter',
    brief: 'Each click should add 1 to clicks, and the green flag should set it back to 0. Click the Gem a few times and watch clicks.',
    starter: {
      backdrops: [['gem room', 'gemRoom']],
      showVariables: ['clicks'],
      sprites: [{ name: 'Gem', costumes: [['gem', 'gem'], ['gold', 'goldGem']], x: 0, y: 0, scripts: [
        { x: 20, y: 20, blocks: [['event_whenflagclicked'], ['looks_switchcostumeto', { COSTUME: 'gem' }]] },
        { x: 20, y: 160, blocks: [['event_whenthisspriteclicked'], ['data_setvariableto', { VARIABLE: 'clicks', VALUE: 0 }], ['data_changevariableby', { VARIABLE: 'clicks', VALUE: 1 }]] }
      ] }]
    },
    tasks: [
      { id: 'count', text: 'Three clicks make clicks 3.',
        tip: 'Click the Gem three times and watch the clicks box on the stage. Then read the script that runs when the Gem is clicked, one block at a time: what does each block do to clicks?',
        test: async function (t) {
          t.variable('clicks');
          await t.flag(300);
          t.setValue('clicks', 0);
          for (var i = 0; i < 3; i++) await t.click('Gem');
          await t.wait(150);
          if (t.value('clicks') !== 3) t.fail('I set clicks to 0 and clicked the Gem 3 times. clicks was ' + t.value('clicks') + '.');
        } },
      { id: 'reset', text: 'The green flag sets clicks to 0.',
        tip: 'Which script runs when the green flag is clicked? Does anything in it set clicks?',
        test: async function (t) {
          t.variable('clicks');
          t.stop();
          t.setValue('clicks', 6);
          await t.flag(300);
          if (t.value('clicks') !== 0) t.fail('clicks was 6. After the green flag it was ' + t.value('clicks') + '.');
        } }
    ]
  });

  K.add({
    id: 'bug-once', lesson: 'y6-idebug-l6', title: 'Bug Hunt 3: One Step Only',
    brief: 'The Ball should keep moving and bounce round the stage. Click the green flag and watch what it really does.',
    starter: {
      backdrops: [['grid', 'grid']],
      sprites: [{ name: 'Ball', costumes: [['ball', 'ball']], x: 0, y: 0, direction: 45, scripts: [
        { x: 20, y: 20, blocks: [['event_whenflagclicked'], ['motion_gotoxy', { X: 0, Y: 0 }], ['motion_pointindirection', { DIRECTION: 45 }],
          ['motion_movesteps', { STEPS: 10 }], ['motion_ifonedgebounce']] }
      ] }]
    },
    tasks: [
      { id: 'moves', text: 'After the green flag the Ball keeps moving.',
        tip: 'Click the green flag and count how many times the Ball moves. Which block makes blocks run again and again?',
        test: async function (t) {
          await t.flag(1000);
          var p = t.pos('Ball');
          var gone = Math.abs(p.x) + Math.abs(p.y);
          if (gone < 60) t.fail('One second after the green flag the Ball was at ' + t.where('Ball') + '. It only moved once.');
        } },
      { id: 'bounce', text: 'It bounces off the edges instead of getting stuck.',
        tip: 'The bounce check has to keep running too, not happen once at the start.',
        test: async function (t) {
          await t.flag(200);
          t.place('Ball', 0, 0, 90);
          var bounced = await t.until(function () { return t.sprite('Ball').direction < 0; }, 3000);
          if (!bounced) t.fail('I pointed the Ball right. It reached ' + t.where('Ball') + ' and did not bounce back.');
        } }
    ]
  });

  K.add({
    id: 'bug-wrong-sprite', lesson: 'y6-idebug-l6', title: 'Bug Hunt 4: Coins That Do Not Count',
    brief: 'Move the Hero onto the Coin with the arrow keys. score should go up by 1. Touching the Wall should not score.',
    starter: {
      backdrops: [['Level 1', 'level1']],
      showVariables: ['score'],
      sprites: [
        { name: 'Hero', costumes: [['hero', 'hero']], x: -150, y: -110, scripts: heroScripts() },
        { name: 'Wall', costumes: [['wall', 'wall']], x: -40, y: 60 },
        { name: 'Coin', costumes: [['coin', 'coin']], x: 100, y: -110, scripts: [
          { x: 20, y: 20, blocks: [['event_whenflagclicked'], ['data_setvariableto', { VARIABLE: 'score', VALUE: 0 }], ['control_forever', { SUBSTACK: [
            ['control_if', { CONDITION: ['sensing_touchingobject', { TOUCHINGOBJECTMENU: 'Wall' }], SUBSTACK: [
              ['data_changevariableby', { VARIABLE: 'score', VALUE: 1 }],
              ['motion_gotoxy', { X: ['operator_random', { FROM: -200, TO: 200 }], Y: ['operator_random', { FROM: -140, TO: 140 }] }]
            ] }]
          ] }]] }
        ] }
      ]
    },
    tasks: [
      { id: 'hero', text: 'When the Hero touches the Coin, score goes up by 1.',
        tip: 'Move the Hero onto the Coin and watch score. Then read the if block in the Coin: which sprite is it checking for?',
        test: async function (t) {
          t.variable('score');
          await t.flag(300);
          t.place('Wall', -40, 60);
          t.setValue('score', 0);
          var ok = await collect(t);
          if (!ok) t.fail('I put the Hero on the Coin. score stayed ' + t.value('score') + '.');
        } },
      { id: 'wall', text: 'When the Coin touches the Wall, score does not change.',
        tip: 'Coins count when the Hero collects them. What should the touching block be looking for?',
        test: async function (t) {
          t.variable('score');
          await t.flag(300);
          t.place('Hero', -210, 150);
          t.setValue('score', 0);
          t.place('Coin', -40, 60);
          t.place('Wall', -40, 60);
          await t.wait(600);
          if (t.value('score') !== 0) t.fail('I put the Coin on the Wall, away from the Hero. score went up to ' + t.value('score') + '.');
        } }
    ]
  });

  K.add({
    id: 'bug-never-wins', lesson: 'y6-idebug-l6', title: 'Bug Hunt 5: Cannot Win',
    brief: 'The Gem should say You win! on the 10th click, not before and not after. Test it and count carefully.',
    starter: {
      backdrops: [['gem room', 'gemRoom']],
      showVariables: ['clicks'],
      sprites: [{ name: 'Gem', costumes: [['gem', 'gem'], ['gold', 'goldGem']], x: 0, y: 0, scripts: [
        { x: 20, y: 20, blocks: [['event_whenflagclicked'], ['data_setvariableto', { VARIABLE: 'clicks', VALUE: 0 }], ['looks_say', { MESSAGE: '' }]] },
        { x: 20, y: 160, blocks: [['event_whenthisspriteclicked'], ['data_changevariableby', { VARIABLE: 'clicks', VALUE: 1 }],
          ['control_if', { CONDITION: ['operator_gt', { OPERAND1: V('clicks'), OPERAND2: 10 }], SUBSTACK: [['looks_say', { MESSAGE: 'You win!' }]] }]] }
      ] }]
    },
    tasks: [
      { id: 'nine', text: 'After 9 clicks the Gem has not said You win! yet.',
        tip: 'Count out loud as you click, and watch the clicks box.',
        test: async function (t) {
          t.variable('clicks');
          await t.flag(300);
          for (var i = 0; i < 9; i++) await t.click('Gem');
          await t.wait(150);
          if (t.said('Gem', 'You win!')) t.fail('After 9 clicks the Gem already said You win!');
        } },
      { id: 'ten', text: 'On the 10th click it says You win!',
        tip: 'Work the comparison out by hand: when clicks is 10, is (clicks) > (10) true or false?',
        test: async function (t) {
          t.variable('clicks');
          await t.flag(300);
          for (var i = 0; i < 10; i++) await t.click('Gem');
          await t.wait(150);
          if (!t.said('Gem', 'You win!')) t.fail('After 10 clicks clicks was ' + t.value('clicks') + ' and the Gem said ' + (t.saying('Gem') ? '"' + t.saying('Gem') + '"' : 'nothing') + '.');
        } }
    ]
  });

  K.add({
    id: 'bug-never-ends', lesson: 'y6-idebug-l6', title: 'Bug Hunt 6: Endless Game',
    brief: 'The game should stop when the Ball touches the red floor. It never does. Find out why.',
    starter: {
      backdrops: [['pong', 'pong']],
      sprites: [{ name: 'Ball', costumes: [['ball', 'ball']], x: 0, y: 100, direction: 150, scripts: [
        { x: 20, y: 20, blocks: [['event_whenflagclicked'], ['motion_gotoxy', { X: 0, Y: 100 }], ['motion_pointindirection', { DIRECTION: 150 }],
          ['control_forever', { SUBSTACK: [['motion_movesteps', { STEPS: 6 }], ['motion_ifonedgebounce']] }]] },
        { x: 20, y: 260, blocks: [['event_whenflagclicked'], ['control_wait_until', { CONDITION: ['sensing_touchingcolor', { COLOR: '#1a73e8' }] }], ['control_stop', { STOP_OPTION: 'all' }]] }
      ] }]
    },
    tasks: [
      { id: 'moves', text: 'The Ball keeps moving and bouncing.',
        tip: 'Click the green flag and watch the Ball bounce round the stage.',
        test: async function (t) {
          await t.flag(200);
          t.place('Ball', 0, 60, 90);
          var bounced = await t.until(function () { return t.sprite('Ball').direction < 0; }, 3000);
          if (!bounced) t.fail('I pointed the Ball right. It did not bounce off the wall.');
        } },
      { id: 'floor', text: 'When the Ball touches the red floor, the game stops.',
        tip: 'Look closely at the colour square in the touching color block. Is it the colour of the floor? Click it and use the picker on the red floor.',
        test: async function (t) {
          await t.flag(200);
          t.place('Ball', 120, -100, 180);
          var stopped = await H.stopsWithin(t, 2500);
          if (!stopped) t.fail('The Ball touched the red floor and the game kept going. Check the colour in the touching color block.');
        } }
    ]
  });
})();
