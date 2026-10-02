// Scratch Challenges, part 5 of 6: three finished mini-games (Meteor Dodge,
// Balloon Pop, Ghost Maze) with art and sound, the six 6.2.6 Bug Hunts made
// from them, and the 6.2.5 game starters.
//
// Each game is a function of the bug to plant: game(null) is the working
// game (the self-test solution), game('steer') the same game with one bug.
// Every Bug Hunt checks the whole game, so the student sees which parts
// already work and which one does not.
(function () {
  'use strict';
  if (!/[?&]scratchcheck/.test(location.search)) return;
  var K = window.ScratchCheckKit, V = K.V, H = K.helpers, svg = K.svg, TEXT = K.TEXT;

  // ---- art ----
  var WALL = '#6c7fd8';

  function stars(seed, count, w, h) {
    var out = '';
    for (var i = 0; i < count; i++) {
      seed = (seed * 9301 + 49297) % 233280; var sx = seed % w;
      seed = (seed * 9301 + 49297) % 233280; var sy = seed % h;
      out += '<circle cx="' + sx + '" cy="' + sy + '" r="' + (i % 6 === 0 ? 2 : 1) + '" fill="#e8eaed" opacity="' + (i % 3 ? 0.45 : 0.9) + '"/>';
    }
    return out;
  }
  function banner(words, colour) {
    return '<rect x="60" y="130" width="360" height="100" rx="18" fill="#0b1020" opacity=".82" stroke="' + colour + '" stroke-width="4"/>' +
      '<text x="240" y="196" fill="' + colour + '" font-size="44" text-anchor="middle" ' + TEXT + '>' + words + '</text>';
  }
  function spaceArt(ground, planet) {
    return '<rect width="480" height="360" fill="' + ground + '"/>' + stars(11, 70, 480, 360) +
      '<circle cx="400" cy="72" r="38" fill="' + planet + '" opacity=".85"/><ellipse cx="400" cy="72" rx="58" ry="10" fill="none" stroke="#e8eaed" stroke-width="3" opacity=".5"/>' +
      '<circle cx="70" cy="290" r="18" fill="#78d9ec" opacity=".6"/>';
  }
  function skyArt(top, hill, sun) {
    return '<rect width="480" height="360" fill="' + top + '"/><circle cx="400" cy="70" r="34" fill="' + sun + '"/>' +
      '<ellipse cx="100" cy="80" rx="62" ry="18" fill="#ffffff" opacity=".85"/><ellipse cx="290" cy="130" rx="48" ry="14" fill="#ffffff" opacity=".75"/>' +
      '<ellipse cx="120" cy="380" rx="220" ry="80" fill="' + hill + '"/><ellipse cx="400" cy="390" rx="200" ry="70" fill="' + hill + '" opacity=".85"/>';
  }
  // The maze: an outer wall and two inner walls, all in WALL so touching color finds them.
  function dungeonArt(floor, tile) {
    var tiles = '';
    for (var x = 0; x < 480; x += 40) tiles += '<line x1="' + x + '" y1="0" x2="' + x + '" y2="360" stroke="' + tile + '" stroke-width="2"/>';
    for (var y = 0; y < 360; y += 40) tiles += '<line x1="0" y1="' + y + '" x2="480" y2="' + y + '" stroke="' + tile + '" stroke-width="2"/>';
    var w = 'fill="' + WALL + '"';
    return '<rect width="480" height="360" fill="' + floor + '"/>' + tiles +
      '<rect x="0" y="0" width="480" height="12" ' + w + '/><rect x="0" y="348" width="480" height="12" ' + w + '/>' +
      '<rect x="0" y="0" width="12" height="360" ' + w + '/><rect x="468" y="0" width="12" height="360" ' + w + '/>' +
      '<rect x="90" y="120" width="20" height="240" ' + w + '/><rect x="370" y="0" width="20" height="240" ' + w + '/>' +
      '<circle cx="30" cy="30" r="5" fill="#fdd663"/><circle cx="450" cy="330" r="5" fill="#fdd663"/>';
  }

  Object.assign(K.ART, {
    ship: svg(60, 56,
      '<path d="M30 2 L46 40 L30 33 L14 40 Z" fill="#e8eaed" stroke="#8ab4f8" stroke-width="2" stroke-linejoin="round"/>' +
      '<circle cx="30" cy="22" r="6" fill="#8ab4f8" stroke="#1a73e8" stroke-width="2"/>' +
      '<path d="M14 40 L4 50 L18 46 Z M46 40 L56 50 L42 46 Z" fill="#f28b82"/>' +
      '<path d="M24 38 L30 54 L36 38 Z" fill="#fdd663"/>'),
    meteor: svg(50, 50,
      '<path d="M25 3 C38 3 47 12 47 25 C47 38 38 47 25 47 C12 47 3 39 4 25 C5 12 12 3 25 3 Z" fill="#a1887f" stroke="#d7ccc8" stroke-width="2"/>' +
      '<circle cx="18" cy="18" r="6" fill="#8d6e63"/><circle cx="32" cy="30" r="8" fill="#8d6e63"/><circle cx="16" cy="34" r="4" fill="#8d6e63"/>'),
    star: svg(40, 40,
      '<path d="M20 2 L25 15 L39 15 L28 24 L32 38 L20 30 L8 38 L12 24 L1 15 L15 15 Z" fill="#fdd663" stroke="#fff7d6" stroke-width="2" stroke-linejoin="round"/>'),
    balloon: svg(46, 76,
      '<ellipse cx="23" cy="24" rx="21" ry="23" fill="#f28b82" stroke="#fce8e6" stroke-width="2"/>' +
      '<ellipse cx="15" cy="15" rx="5" ry="8" fill="#fce8e6" opacity=".7"/><path d="M19 46 L27 46 L23 52 Z" fill="#f28b82"/>' +
      '<path d="M23 52 C18 58 28 64 23 74" stroke="#e8eaed" stroke-width="2" fill="none"/>'),
    goldBalloon: svg(46, 76,
      '<ellipse cx="23" cy="24" rx="21" ry="23" fill="#fdd663" stroke="#fff7d6" stroke-width="2"/>' +
      '<ellipse cx="15" cy="15" rx="5" ry="8" fill="#fff7d6" opacity=".8"/><path d="M19 46 L27 46 L23 52 Z" fill="#fdd663"/>' +
      '<path d="M23 52 C18 58 28 64 23 74" stroke="#e8eaed" stroke-width="2" fill="none"/>' +
      '<path d="M23 14 L26 21 L33 21 L27 26 L29 33 L23 29 L17 33 L19 26 L13 21 L20 21 Z" fill="#e37400"/>'),
    ghost: svg(52, 58,
      '<path d="M4 54 V24 C4 11 14 2 26 2 C38 2 48 11 48 24 V54 L40 47 L33 54 L26 47 L19 54 L12 47 Z" fill="#e9d2fd" stroke="#c58af9" stroke-width="3" stroke-linejoin="round"/>' +
      '<ellipse cx="18" cy="24" rx="5" ry="7" fill="#202124"/><ellipse cx="34" cy="24" rx="5" ry="7" fill="#202124"/>' +
      '<ellipse cx="26" cy="38" rx="6" ry="4" fill="#202124"/>'),
    key: svg(44, 24,
      '<circle cx="11" cy="12" r="9" fill="none" stroke="#fdd663" stroke-width="5"/>' +
      '<path d="M20 12 H42 M34 12 V20 M40 12 V18" stroke="#fdd663" stroke-width="5" stroke-linecap="round"/>'),
    doorClosed: svg(52, 74,
      '<path d="M2 72 V24 C2 11 13 2 26 2 C39 2 50 11 50 24 V72 Z" fill="#8d6e63" stroke="#d7ccc8" stroke-width="3"/>' +
      '<path d="M18 72 V30 M34 72 V30" stroke="#6d4c41" stroke-width="3"/><circle cx="40" cy="46" r="4" fill="#fdd663"/>' +
      '<rect x="20" y="40" width="12" height="10" rx="2" fill="#5f6368"/>'),
    doorOpen: svg(52, 74,
      '<path d="M2 72 V24 C2 11 13 2 26 2 C39 2 50 11 50 24 V72 Z" fill="#fff7d6" stroke="#d7ccc8" stroke-width="3"/>' +
      '<path d="M2 72 V24 C2 14 6 8 12 5 V72 Z" fill="#8d6e63"/>'),
    space2: svg(480, 360, spaceArt('#1d0b20', '#f28b82')),
    gameOverSpace: svg(480, 360, spaceArt('#0b1020', '#c58af9') + banner('GAME OVER', '#f28b82')),
    sky: svg(480, 360, skyArt('#8ab4f8', '#34a853', '#fdd663')),
    sunset: svg(480, 360, skyArt('#f6aea9', '#1e8e3e', '#fa7b17')),
    timeUp: svg(480, 360, skyArt('#8ab4f8', '#34a853', '#fdd663') + banner('TIME UP!', '#fdd663')),
    dungeon: svg(480, 360, dungeonArt('#161b2e', '#1d2439')),
    dungeon2: svg(480, 360, dungeonArt('#24142b', '#2e1a37')),
    escaped: svg(480, 360, dungeonArt('#161b2e', '#1d2439') + banner('YOU ESCAPED!', '#81c995')),
    orchardNight: svg(480, 360,
      '<rect width="480" height="360" fill="#1b2a4a"/>' + stars(5, 40, 480, 240) + '<circle cx="410" cy="60" r="26" fill="#e8eaed"/>' +
      '<rect x="0" y="330" width="480" height="30" fill="#1e5631"/>'),
    gameOverOrchard: svg(480, 360,
      '<rect width="480" height="360" fill="#8ab4f8"/><rect x="0" y="330" width="480" height="30" fill="#34a853"/>' + banner('GAME OVER', '#f28b82'))
  });

  // ---- block shorthands ----
  var flag = ['event_whenflagclicked'];
  function s(x, y, blocks) { return { x: x, y: y, blocks: blocks }; }
  function rnd(a, b) { return ['operator_random', { FROM: a, TO: b }]; }
  function key(k) { return ['sensing_keypressed', { KEY_OPTION: k }]; }
  function touching(name) { return ['sensing_touchingobject', { TOUCHINGOBJECTMENU: name }]; }
  function receive(msg, blocks) { return s(320, 20, [['event_whenbroadcastreceived', { BROADCAST_OPTION: msg }]].concat(blocks)); }
  var toTop = ['motion_gotoxy', { X: rnd(-210, 210), Y: 170 }];
  var toBottom = ['motion_gotoxy', { X: rnd(-200, 200), Y: -170 }];

  // ======================= Meteor Dodge =======================
  // Bugs: 'steer' (left arrow goes right), 'end' (game over waits for lives < 0).
  function meteorDodge(bug) {
    return {
      backdrops: [['Space', 'space'], ['Game Over', 'gameOverSpace']],
      stageSounds: [['lose', 'lose']],
      variables: { score: 0, lives: 3, speed: 5 },
      showVariables: ['score', 'lives'],
      stageScripts: [s(20, 20, [flag, ['looks_switchbackdropto', { BACKDROP: 'Space' }],
        ['data_setvariableto', { VARIABLE: 'score', VALUE: 0 }], ['data_setvariableto', { VARIABLE: 'lives', VALUE: 3 }], ['data_setvariableto', { VARIABLE: 'speed', VALUE: 5 }],
        ['control_wait_until', { CONDITION: bug === 'end' ? ['operator_lt', { OPERAND1: V('lives'), OPERAND2: 0 }] : ['operator_equals', { OPERAND1: V('lives'), OPERAND2: 0 }] }],
        ['event_broadcast', { BROADCAST_INPUT: 'game over' }], ['looks_switchbackdropto', { BACKDROP: 'Game Over' }],
        ['sound_playuntildone', { SOUND_MENU: 'lose' }], ['control_stop', { STOP_OPTION: 'all' }]])],
      sprites: [
        { name: 'Ship', costumes: [['ship', 'ship']], x: 0, y: -140, scripts: [
          s(20, 20, [flag, ['looks_show'], ['motion_gotoxy', { X: 0, Y: -140 }], ['control_forever', { SUBSTACK: [
            ['control_if', { CONDITION: key('right arrow'), SUBSTACK: [['motion_changexby', { DX: 8 }]] }],
            ['control_if', { CONDITION: key('left arrow'), SUBSTACK: [['motion_changexby', { DX: bug === 'steer' ? 8 : -8 }]] }]
          ] }]]),
          receive('game over', [['looks_hide']])
        ] },
        { name: 'Meteor', costumes: [['meteor', 'meteor']], sounds: [['boom', 'boom']], x: 120, y: 170, scripts: [
          s(20, 20, [flag, ['looks_show'], toTop, ['control_forever', { SUBSTACK: [
            ['motion_changeyby', { DY: ['operator_subtract', { NUM1: 0, NUM2: V('speed') }] }],
            ['control_if', { CONDITION: ['operator_lt', { OPERAND1: ['motion_yposition'], OPERAND2: -170 }], SUBSTACK: [
              ['data_changevariableby', { VARIABLE: 'score', VALUE: 1 }], ['data_changevariableby', { VARIABLE: 'speed', VALUE: 0.2 }], toTop] }],
            ['control_if', { CONDITION: touching('Ship'), SUBSTACK: [
              ['sound_play', { SOUND_MENU: 'boom' }], ['data_changevariableby', { VARIABLE: 'lives', VALUE: -1 }], toTop] }]
          ] }]]),
          receive('game over', [['looks_hide']])
        ] },
        { name: 'Star', costumes: [['star', 'star']], sounds: [['coin', 'coin']], x: -120, y: 170, scripts: [
          s(20, 20, [flag, ['looks_show'], toTop, ['control_forever', { SUBSTACK: [
            ['motion_changeyby', { DY: -3 }],
            ['control_if', { CONDITION: ['operator_lt', { OPERAND1: ['motion_yposition'], OPERAND2: -170 }], SUBSTACK: [toTop] }],
            ['control_if', { CONDITION: touching('Ship'), SUBSTACK: [
              ['sound_play', { SOUND_MENU: 'coin' }], ['data_changevariableby', { VARIABLE: 'score', VALUE: 5 }], toTop] }]
          ] }]]),
          receive('game over', [['looks_hide']])
        ] }
      ]
    };
  }

  // Hold an arrow and see which way the Ship went.
  async function steer(t, k) {
    await t.flag(300);
    t.place('Ship', 0, -140);
    t.place('Meteor', 200, 170);
    t.place('Star', -200, 170);
    var x0 = t.pos('Ship').x;
    await t.hold(k, 400);
    return t.pos('Ship').x - x0;
  }

  var meteorTasks = [
    { id: 'right', text: 'Holding the right arrow moves the Ship right.',
      tip: 'Hold the right arrow and watch the Ship. Then find the if block that checks for the right arrow.',
      test: async function (t) {
        var moved = await steer(t, 'right');
        if (!(moved > 10)) t.fail('I held the right arrow. The Ship moved ' + Math.round(moved) + ' steps across. It should go right, so x goes up.');
      } },
    { id: 'left', text: 'Holding the left arrow moves the Ship left.',
      tip: 'Hold the left arrow and watch the Ship. Which way should x change for left? Find the if block that checks for the left arrow.',
      test: async function (t) {
        var moved = await steer(t, 'left');
        if (!(moved < -10)) t.fail('I held the left arrow. The Ship went from x: 0 to x: ' + Math.round(moved) + '. Left should make x go down.');
      } },
    { id: 'dodge', text: 'A Meteor that reaches the bottom adds 1 to score and starts again at the top.',
      tip: 'Watch score as a Meteor falls past the Ship.',
      test: async function (t) {
        t.variable('score');
        await t.flag(300);
        t.place('Ship', -200, -140);
        t.place('Star', 200, 170);
        t.setValue('score', 0);
        t.place('Meteor', 150, -160);
        var ok = await t.until(function () { return t.value('score') === 1; }, 1500);
        if (!ok) t.fail('The Meteor fell past the bottom. score was ' + t.value('score') + '. It should be 1.');
        if (!(t.pos('Meteor').y > 100)) t.fail('score went up, but the Meteor did not go back to the top.');
      } },
    { id: 'hit', text: 'A Meteor that hits the Ship takes away 1 life.',
      tip: 'Let a Meteor hit the Ship and watch lives.',
      test: async function (t) {
        t.variable('lives');
        await t.flag(300);
        t.place('Star', 200, 170);
        t.place('Ship', 0, -140);
        t.place('Meteor', 0, -140);
        var ok = await t.until(function () { return t.value('lives') === 2; }, 1500);
        if (!ok) t.fail('A Meteor hit the Ship. lives was ' + t.value('lives') + '. It should go from 3 to 2.');
      } },
    { id: 'end', text: 'When lives reaches 0, the Game Over screen shows and the game stops.',
      tip: 'Let the Meteors hit you three times and count. What is lives when the game should end? Then read the condition the Stage is waiting for: is it ever true?',
      test: async function (t) {
        t.variable('lives');
        await t.flag(300);
        t.place('Star', 200, 170);
        t.setValue('lives', 1);
        t.place('Ship', 0, -140);
        t.place('Meteor', 0, -140);
        await t.until(function () { return t.value('lives') !== 1; }, 1500);
        var hitAt = t.value('lives');
        t.place('Ship', -200, -140);
        var stopped = await H.stopsWithin(t, 3000);
        if (!stopped || hitAt !== 0) t.fail('lives went down to ' + hitAt + ' and the game kept going.');
        if (t.value('lives') !== 0) t.fail('The game only ended when lives was ' + t.value('lives') + '. It should end at 0.');
        if (t.backdrop() !== 'Game Over') t.fail('The game stopped, but the backdrop was "' + t.backdrop() + '", not Game Over.');
      } }
  ];

  // ======================= Balloon Pop =======================
  // Bugs: 'score' (a pop sets score to 1), 'timer' (time counts up, so it never reaches 0).
  function balloonPop(bug) {
    return {
      backdrops: [['Sky', 'sky'], ['Time Up', 'timeUp']],
      stageSounds: [['win', 'win']],
      variables: { score: 0, time: 20 },
      showVariables: ['score', 'time'],
      stageScripts: [s(20, 20, [flag, ['looks_switchbackdropto', { BACKDROP: 'Sky' }],
        ['data_setvariableto', { VARIABLE: 'score', VALUE: 0 }], ['data_setvariableto', { VARIABLE: 'time', VALUE: 20 }],
        ['control_repeat_until', { CONDITION: ['operator_equals', { OPERAND1: V('time'), OPERAND2: 0 }], SUBSTACK: [
          ['control_wait', { DURATION: 1 }], ['data_changevariableby', { VARIABLE: 'time', VALUE: bug === 'timer' ? 1 : -1 }]] }],
        ['event_broadcast', { BROADCAST_INPUT: 'time up' }], ['looks_switchbackdropto', { BACKDROP: 'Time Up' }],
        ['sound_playuntildone', { SOUND_MENU: 'win' }], ['control_stop', { STOP_OPTION: 'all' }]])],
      sprites: [
        { name: 'Balloon', costumes: [['balloon', 'balloon']], sounds: [['pop', 'pop']], x: -80, y: -170, scripts: [
          s(20, 20, [flag, ['looks_show'], toBottom, ['control_forever', { SUBSTACK: [
            ['motion_changeyby', { DY: 3 }],
            ['control_if', { CONDITION: ['operator_gt', { OPERAND1: ['motion_yposition'], OPERAND2: 170 }], SUBSTACK: [toBottom] }]
          ] }]]),
          s(20, 300, [['event_whenthisspriteclicked'], ['sound_play', { SOUND_MENU: 'pop' }],
            bug === 'score' ? ['data_setvariableto', { VARIABLE: 'score', VALUE: 1 }] : ['data_changevariableby', { VARIABLE: 'score', VALUE: 1 }],
            toBottom]),
          receive('time up', [['looks_hide']])
        ] },
        { name: 'Gold Balloon', costumes: [['gold balloon', 'goldBalloon']], sounds: [['coin', 'coin']], x: 120, y: -170, size: 80, scripts: [
          s(20, 20, [flag, ['looks_show'], toBottom, ['control_forever', { SUBSTACK: [
            ['motion_changeyby', { DY: 6 }],
            ['control_if', { CONDITION: ['operator_gt', { OPERAND1: ['motion_yposition'], OPERAND2: 170 }], SUBSTACK: [toBottom] }]
          ] }]]),
          s(20, 300, [['event_whenthisspriteclicked'], ['sound_play', { SOUND_MENU: 'coin' }],
            ['data_changevariableby', { VARIABLE: 'score', VALUE: 5 }], toBottom]),
          receive('time up', [['looks_hide']])
        ] }
      ]
    };
  }

  var balloonTasks = [
    { id: 'pop', text: 'Each click on the Balloon adds 1 to score.',
      tip: 'Click the Balloon three times and watch score. Then read the Balloon\'s when this sprite clicked script: does each block add to score, or set it?',
      test: async function (t) {
        t.variable('score');
        await t.flag(300);
        t.setValue('score', 0);
        for (var i = 0; i < 3; i++) await t.click('Balloon');
        await t.wait(150);
        if (t.value('score') !== 3) t.fail('score was 0. I clicked the Balloon 3 times and score was ' + t.value('score') + '. It should be 3.');
      } },
    { id: 'gold', text: 'A click on the Gold Balloon adds 5 to score.',
      tip: 'Click the Gold Balloon and watch score.',
      test: async function (t) {
        t.variable('score');
        await t.flag(300);
        t.setValue('score', 2);
        await t.click('Gold Balloon');
        await t.wait(150);
        if (t.value('score') !== 7) t.fail('score was 2. I clicked the Gold Balloon once and score was ' + t.value('score') + '. It should be 7.');
      } },
    { id: 'timer', text: 'time counts down by 1 every second.',
      tip: 'Click the green flag and watch the time box for a few seconds. Which way is it going? Find the block that changes time.',
      test: async function (t) {
        t.variable('time');
        await t.flag(150);
        var start = t.value('time');
        await t.wait(2200);
        var now = t.value('time');
        if (!(now < start && start - now <= 3)) t.fail('time started at ' + start + '. Two seconds later it was ' + now + '. It should count down: ' + start + ', ' + (start - 1) + ', ' + (start - 2) + '.');
      } },
    { id: 'end', text: 'When time reaches 0, the Time Up screen shows and the game stops.',
      tip: 'The Stage repeats until time = 0. If time never reaches 0, the repeat never ends.',
      test: async function (t) {
        t.variable('time');
        await t.flag(300);
        t.setValue('time', 2);
        var stopped = await H.stopsWithin(t, 5000);
        if (!stopped) t.fail('I set time to 2. Five seconds later time was ' + t.value('time') + ' and the game was still going.');
        if (t.backdrop() !== 'Time Up') t.fail('The game stopped, but the backdrop was "' + t.backdrop() + '", not Time Up.');
      } }
  ];

  // ======================= Ghost Maze =======================
  // Bugs: 'ghost' (the patrol is not in a loop, so it runs once), 'door' (the Door waits for the Ghost).
  var START = { X: -195, Y: -140 };
  function step(k, axis, by) {
    var change = axis === 'x' ? 'motion_changexby' : 'motion_changeyby', field = axis === 'x' ? 'DX' : 'DY';
    var go = {}, back = {};
    go[field] = by; back[field] = -by;
    return ['control_if', { CONDITION: key(k), SUBSTACK: [[change, go],
      ['control_if', { CONDITION: ['sensing_touchingcolor', { COLOR: WALL }], SUBSTACK: [[change, back]] }]] }];
  }
  function ghostMaze(bug) {
    var patrol = [['motion_glidesecstoxy', { SECS: 1.5, X: 100, Y: 0 }], ['motion_glidesecstoxy', { SECS: 1.5, X: -100, Y: 0 }]];
    return {
      backdrops: [['Maze', 'dungeon'], ['You Escaped', 'escaped']],
      variables: { keys: 0 },
      showVariables: ['keys'],
      stageScripts: [
        s(20, 20, [flag, ['looks_switchbackdropto', { BACKDROP: 'Maze' }], ['data_setvariableto', { VARIABLE: 'keys', VALUE: 0 }]]),
        receive('escaped', [['looks_switchbackdropto', { BACKDROP: 'You Escaped' }], ['control_wait', { DURATION: 1 }], ['control_stop', { STOP_OPTION: 'all' }]])
      ],
      sprites: [
        { name: 'Hero', costumes: [['hero', 'hero']], sounds: [['zap', 'zap']], x: START.X, y: START.Y, size: 60, scripts: [
          s(20, 20, [flag, ['looks_show'], ['motion_gotoxy', START], ['control_forever', { SUBSTACK: [
            step('right arrow', 'x', 4), step('left arrow', 'x', -4), step('up arrow', 'y', 4), step('down arrow', 'y', -4),
            ['control_if', { CONDITION: touching('Ghost'), SUBSTACK: [['sound_play', { SOUND_MENU: 'zap' }], ['motion_gotoxy', START]] }]
          ] }]]),
          receive('escaped', [['looks_hide']])
        ] },
        { name: 'Ghost', costumes: [['ghost', 'ghost']], x: -100, y: 0, size: 80, scripts: [
          s(20, 20, [flag, ['looks_show'], ['motion_gotoxy', { X: -100, Y: 0 }]].concat(bug === 'ghost' ? patrol : [['control_forever', { SUBSTACK: patrol }]])),
          receive('escaped', [['looks_hide']])
        ] },
        { name: 'Key', costumes: [['key', 'key']], sounds: [['coin', 'coin']], x: -190, y: 130, scripts: [
          s(20, 20, [flag, ['looks_show'], ['motion_gotoxy', { X: -190, Y: 130 }], ['control_wait_until', { CONDITION: touching('Hero') }],
            ['sound_play', { SOUND_MENU: 'coin' }], ['data_setvariableto', { VARIABLE: 'keys', VALUE: 1 }], ['looks_hide']])
        ] },
        { name: 'Door', costumes: [['closed', 'doorClosed'], ['open', 'doorOpen']], sounds: [['win', 'win']], x: 190, y: 120, scripts: [
          s(20, 20, [flag, ['looks_switchcostumeto', { COSTUME: 'closed' }], ['motion_gotoxy', { X: 190, Y: 120 }],
            ['control_wait_until', { CONDITION: ['operator_and', { OPERAND1: touching(bug === 'door' ? 'Ghost' : 'Hero'), OPERAND2: ['operator_equals', { OPERAND1: V('keys'), OPERAND2: 1 }] }] }],
            ['looks_switchcostumeto', { COSTUME: 'open' }], ['sound_playuntildone', { SOUND_MENU: 'win' }], ['event_broadcast', { BROADCAST_INPUT: 'escaped' }]])
        ] }
      ]
    };
  }

  var mazeTasks = [
    { id: 'move', text: 'The arrow keys move the Hero.',
      tip: 'Hold each arrow key and watch the Hero.',
      test: async function (t) {
        await t.flag(300);
        t.place('Hero', -195, -100);
        var y0 = t.pos('Hero').y;
        await t.hold('up', 300);
        if (!(t.pos('Hero').y > y0 + 8)) t.fail('I held the up arrow. The Hero went from y: ' + Math.round(y0) + ' to y: ' + Math.round(t.pos('Hero').y) + '.');
        var x0 = t.pos('Hero').x;
        await t.hold('right', 200);
        if (!(t.pos('Hero').x > x0 + 8)) t.fail('I held the right arrow. The Hero did not move right.');
      } },
    { id: 'ghost', text: 'The Ghost keeps patrolling back and forth.',
      tip: 'Click the green flag and watch the Ghost for 10 seconds. When does it stop? Which block makes blocks run again and again?',
      test: async function (t) {
        await t.flag(100);
        t.place('Hero', -195, -140);
        await t.wait(3600);
        var x1 = t.pos('Ghost').x;
        await t.wait(500);
        var x2 = t.pos('Ghost').x;
        if (Math.abs(x2 - x1) < 10) t.fail('After 4 seconds the Ghost stopped at ' + t.where('Ghost') + '. It should keep going back and forth.');
      } },
    { id: 'caught', text: 'If the Ghost catches the Hero, the Hero goes back to the start.',
      tip: 'Walk into the Ghost and watch where the Hero goes.',
      test: async function (t) {
        await t.flag(300);
        var g = t.pos('Ghost');
        t.place('Hero', g.x, g.y);
        var back = await t.until(function () { var p = t.pos('Hero'); return t.near(p.x, START.X, 3) && t.near(p.y, START.Y, 3); }, 1000);
        if (!back) t.fail('I put the Hero on the Ghost. The Hero stayed at ' + t.where('Hero') + '.');
      } },
    { id: 'key', text: 'Touching the Key collects it: keys becomes 1 and the Key disappears.',
      tip: 'Walk to the Key and watch the keys box.',
      test: async function (t) {
        t.variable('keys');
        await t.flag(300);
        t.place('Hero', -190, 130);
        var ok = await t.until(function () { return t.value('keys') === 1 && !t.sprite('Key').visible; }, 1500);
        if (!ok) t.fail('I put the Hero on the Key. keys was ' + t.value('keys') + (t.sprite('Key').visible ? ' and the Key was still showing.' : '.'));
      } },
    { id: 'door', text: 'With the key, touching the Door opens it and shows You Escaped.',
      tip: 'Collect the Key, then walk to the Door. Nothing happens? Read the Door\'s wait until block: which sprite is it waiting for?',
      test: async function (t) {
        t.variable('keys');
        await t.flag(300);
        t.setValue('keys', 1);
        t.place('Hero', 190, 120);
        var ok = await t.until(function () { return t.backdrop() === 'You Escaped'; }, 3000);
        if (!ok) t.fail('keys was 1 and I put the Hero on the Door. The Door stayed ' + t.costume('Door') + ' and the backdrop stayed ' + t.backdrop() + '.');
      } }
  ];

  // ======================= 6.2.6 Bug Hunts =======================
  var HUNTS = [
    { id: 'hunt-meteor-steer', title: 'Bug Hunt 1: Meteor Dodge', game: meteorDodge, bug: 'steer', tasks: meteorTasks,
      brief: 'Dodge the Meteors and catch the Stars. One control is broken. Play first, then find the bug and fix it.' },
    { id: 'hunt-meteor-end', title: 'Bug Hunt 2: Meteor Dodge Never Ends', game: meteorDodge, bug: 'end', tasks: meteorTasks,
      brief: 'The same game with a different bug. Get hit three times. The game should be over. Is it?' },
    { id: 'hunt-balloon-score', title: 'Bug Hunt 3: Balloon Pop', game: balloonPop, bug: 'score', tasks: balloonTasks,
      brief: 'Pop the balloons before time runs out. Gold balloons are worth 5. Something is wrong with the score.' },
    { id: 'hunt-balloon-timer', title: 'Bug Hunt 4: Balloon Pop Timer', game: balloonPop, bug: 'timer', tasks: balloonTasks,
      brief: 'The same game with a different bug. Watch the time box. The game should end at 0.' },
    { id: 'hunt-maze-ghost', title: 'Bug Hunt 5: Ghost Maze', game: ghostMaze, bug: 'ghost', tasks: mazeTasks,
      brief: 'Get the Key and escape through the Door. Do not let the Ghost catch you. Watch the Ghost for a while.' },
    { id: 'hunt-maze-door', title: 'Bug Hunt 6: Ghost Maze Locked Door', game: ghostMaze, bug: 'door', tasks: mazeTasks,
      brief: 'The same game with a different bug. Get the Key and reach the Door. Can you escape?' }
  ];

  // Support on a Bug Hunt shows how to find the bug (a tip), never the fixed blocks.
  K.solutionStarters = K.solutionStarters || {};
  HUNTS.forEach(function (h) {
    K.add({ id: h.id, lesson: 'y6-idebug-l6', title: h.title, brief: h.brief, series: 'Bug Hunt', starter: h.game(h.bug), tasks: h.tasks });
    K.solutionStarters[h.id] = function () { return h.game(null); };
  });

  // ======================= 6.2.5 game starters =======================
  // Sprites, art, sounds and backdrops, no scripts: the student builds the game.
  function bare(def) {
    def = JSON.parse(JSON.stringify(def));
    def.sprites.forEach(function (sp) { delete sp.scripts; });
    delete def.stageScripts;
    def.variables = {};
    def.showVariables = [];
    return def;
  }
  var dodge = bare(meteorDodge(null));
  dodge.backdrops = [['Space', 'space'], ['Level 2', 'space2'], ['Game Over', 'gameOverSpace']];
  dodge.stageSounds = [['win', 'win'], ['lose', 'lose']];
  dodge.sprites[0].sounds = [['zap', 'zap']];
  var pop = bare(balloonPop(null));
  pop.backdrops = [['Sky', 'sky'], ['Level 2', 'sunset'], ['Time Up', 'timeUp']];
  pop.stageSounds = [['win', 'win'], ['lose', 'lose']];
  var maze = bare(ghostMaze(null));
  maze.backdrops = [['Maze', 'dungeon'], ['Level 2', 'dungeon2'], ['You Escaped', 'escaped']];
  maze.stageSounds = [['win', 'win'], ['lose', 'lose']];
  var catcher = {
    backdrops: [['Orchard', 'orchard'], ['Level 2', 'orchardNight'], ['Game Over', 'gameOverOrchard']],
    stageSounds: [['win', 'win'], ['lose', 'lose']],
    sprites: [
      { name: 'Bowl', costumes: [['bowl', 'bowl']], sounds: [['blip', 'blip']], x: 0, y: -140 },
      { name: 'Apple', costumes: [['apple', 'apple']], sounds: [['coin', 'coin']], x: -100, y: 160 },
      { name: 'Rock', costumes: [['rock', 'meteor']], sounds: [['boom', 'boom']], x: 120, y: 160 }
    ]
  };

  var myGame = K.find('my-game');
  if (myGame) {
    myGame.starters = [
      { id: 'catch', title: 'Catch', blurb: 'Move the Bowl. Catch the Apples, miss the Rocks.', art: 'apple', starter: catcher },
      { id: 'dodge', title: 'Dodge', blurb: 'Steer the Ship. Dodge Meteors, grab Stars.', art: 'ship', starter: dodge },
      { id: 'maze', title: 'Maze', blurb: 'Find the Key, reach the Door, avoid the Ghost.', art: 'ghost', starter: maze },
      { id: 'pop', title: 'Pop', blurb: 'Click the Balloons before the time runs out.', art: 'balloon', starter: pop },
      { id: 'blank', title: 'My own idea', blurb: 'One sprite and an empty stage.', art: 'hero', starter: myGame.starter }
    ];
  }

  K.games = { meteorDodge: meteorDodge, balloonPop: balloonPop, ghostMaze: ghostMaze, WALL: WALL };
})();
