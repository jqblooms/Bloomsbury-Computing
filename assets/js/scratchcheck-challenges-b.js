// Scratch Challenges, part 4 of 6: the Year 6 challenges for lessons 6.2.4
// and 6.2.5. The 6.2.6 Bug Hunts and the 6.2.5 game starters are in
// scratchcheck-challenges-c.js.
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
    brief: 'Build your game, one piece at a time. These checks look for the parts every good game needs. The bonus checks make it feel good to play.',
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
        } },
      { id: 'sound', bonus: true, text: 'Bonus: a sound plays when something happens, like a catch, a hit or the end.',
        hint: 'if <touching [Player v] ?> then\nstart sound [coin v]\nend',
        test: async function (t) {
          if (!anyUsed(t, ['sound_play', 'sound_playuntildone'])) t.fail('I cannot find a start sound or play sound until done block. Look in the Sound blocks.');
        } },
      { id: 'show', bonus: true, text: 'Bonus: the score shows on the stage while you play.',
        hint: 'show variable [score v]',
        test: async function (t) {
          var shown = false;
          // Scratch keeps monitors in an Immutable map; TurboWarp wraps a native Map as .map.
          try {
            var state = t.vm.runtime._monitorState || t.vm.runtime.getMonitorState();
            (state.map || state).forEach(function (m) { if (m.get('visible') && m.get('opcode') === 'data_variable') shown = true; });
          } catch (e) {}
          if (!shown && !t.uses('data_showvariable')) t.fail('No variable shows on the stage. Tick the box next to your variable in the Variables blocks.');
        } },
      { id: 'react', bonus: true, text: 'Bonus: something reacts when you score: a costume change, a size change or a colour effect.',
        hint: 'change [color v] effect by (25)\nchange size by (10)',
        test: async function (t) {
          if (!anyUsed(t, ['looks_nextcostume', 'looks_switchcostumeto', 'looks_changesizeby', 'looks_setsizeto', 'looks_changeeffectby', 'looks_seteffectto'])) {
            t.fail('Nothing changes how a sprite looks. Try change size, change color effect or next costume.');
          }
        } }
    ]
  });
})();
