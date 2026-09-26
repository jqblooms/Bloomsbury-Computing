// Scratch Challenges: a working solution for every challenge, used only by
// the self test (editor.html?scratchcheck=1&selftest=1, then
// ScratchCheck.selfTest(id)). Each entry maps a sprite name (or Stage) to
// its scripts in the kit's block notation. The loader in editor.html only
// loads this file in self-test mode.
(function () {
  'use strict';
  var V = window.ScratchCheckKit.V;
  function s(x, y, blocks) { return { x: x, y: y, blocks: blocks }; }
  var flag = ['event_whenflagclicked'];
  function key(k) { return ['event_whenkeypressed', { KEY_OPTION: k }]; }
  var arrows = [
    s(20, 140, [key('right arrow'), ['motion_changexby', { DX: 10 }]]),
    s(20, 240, [key('left arrow'), ['motion_changexby', { DX: -10 }]]),
    s(280, 140, [key('up arrow'), ['motion_changeyby', { DY: 10 }]]),
    s(280, 240, [key('down arrow'), ['motion_changeyby', { DY: -10 }]])
  ];
  function randomTop() { return ['motion_gotoxy', { X: ['operator_random', { FROM: -200, TO: 200 }], Y: 170 }]; }

  window.ScratchCheckSolutions = {
    'rocket-controls': {
      Rocket: [s(20, 20, [flag, ['motion_gotoxy', { X: 0, Y: 0 }]])].concat(arrows, [
        s(20, 340, [['event_whenthisspriteclicked'], ['looks_sayforsecs', { MESSAGE: 'Ready for launch!', SECS: 2 }]])
      ])
    },
    'treasure-tour': {
      Robot: [s(20, 20, [flag, ['motion_gotoxy', { X: -180, Y: -120 }],
        ['motion_glidesecstoxy', { SECS: 1, X: -150, Y: 100 }],
        ['motion_glidesecstoxy', { SECS: 1, X: 150, Y: 100 }],
        ['motion_glidesecstoxy', { SECS: 1, X: 150, Y: -100 }],
        ['looks_sayforsecs', { MESSAGE: 'Found them all!', SECS: 2 }]])]
    },
    'square-dance': {
      Bee: [s(20, 20, [flag, ['motion_gotoxy', { X: -100, Y: -100 }], ['motion_pointindirection', { DIRECTION: 90 }],
        ['control_repeat', { TIMES: 4, SUBSTACK: [['motion_movesteps', { STEPS: 200 }], ['motion_turnleft', { DEGREES: 90 }], ['control_wait', { DURATION: 0.5 }]] }]])]
    },
    pong: {
      Paddle: [s(20, 20, [flag, ['motion_sety', { Y: -135 }], ['control_forever', { SUBSTACK: [['motion_setx', { X: ['sensing_mousex'] }]] }]])],
      Ball: [
        s(20, 20, [flag, ['data_setvariableto', { VARIABLE: 'score', VALUE: 0 }], ['data_setvariableto', { VARIABLE: 'speed', VALUE: 5 }],
          ['motion_gotoxy', { X: 0, Y: 130 }], ['motion_pointindirection', { DIRECTION: 135 }]]),
        s(20, 220, [flag, ['control_forever', { SUBSTACK: [['motion_ifonedgebounce'], ['motion_movesteps', { STEPS: V('speed') }]] }]]),
        s(20, 360, [flag, ['control_wait_until', { CONDITION: ['sensing_touchingcolor', { COLOR: '#e02424' }] }], ['control_stop', { STOP_OPTION: 'all' }]]),
        s(320, 20, [flag, ['control_forever', { SUBSTACK: [['control_if', { CONDITION: ['sensing_touchingobject', { TOUCHINGOBJECTMENU: 'Paddle' }], SUBSTACK: [
          ['data_changevariableby', { VARIABLE: 'score', VALUE: 1 }],
          ['data_changevariableby', { VARIABLE: 'speed', VALUE: 0.25 }],
          ['motion_pointindirection', { DIRECTION: ['operator_subtract', { NUM1: 180, NUM2: ['motion_direction'] }] }],
          ['motion_movesteps', { STEPS: 5 }]
        ] }]] }]])
      ]
    },
    'gem-clicker': {
      Gem: [
        s(20, 20, [flag, ['data_setvariableto', { VARIABLE: 'clicks', VALUE: 0 }], ['looks_switchcostumeto', { COSTUME: 'gem' }]]),
        s(20, 180, [['event_whenthisspriteclicked'], ['data_changevariableby', { VARIABLE: 'clicks', VALUE: 1 }],
          ['control_if_else', { CONDITION: ['operator_lt', { OPERAND1: V('clicks'), OPERAND2: 10 }],
            SUBSTACK: [['looks_say', { MESSAGE: 'Keep going!' }]],
            SUBSTACK2: [['looks_say', { MESSAGE: 'You win!' }], ['looks_switchcostumeto', { COSTUME: 'gold' }]] }]])
      ]
    },
    'fruit-catcher': {
      Bowl: [s(20, 20, [flag, ['motion_gotoxy', { X: 0, Y: -140 }]]),
        s(20, 140, [key('right arrow'), ['motion_changexby', { DX: 15 }]]),
        s(20, 240, [key('left arrow'), ['motion_changexby', { DX: -15 }]])],
      Apple: [s(20, 20, [flag, ['data_setvariableto', { VARIABLE: 'score', VALUE: 0 }], ['data_setvariableto', { VARIABLE: 'lives', VALUE: 3 }], randomTop(),
        ['control_forever', { SUBSTACK: [
          ['motion_changeyby', { DY: -5 }],
          ['control_if', { CONDITION: ['sensing_touchingobject', { TOUCHINGOBJECTMENU: 'Bowl' }], SUBSTACK: [['data_changevariableby', { VARIABLE: 'score', VALUE: 1 }], randomTop()] }],
          ['control_if', { CONDITION: ['operator_lt', { OPERAND1: ['motion_yposition'], OPERAND2: -170 }], SUBSTACK: [['data_changevariableby', { VARIABLE: 'lives', VALUE: -1 }], randomTop()] }],
          ['control_if', { CONDITION: ['operator_equals', { OPERAND1: V('lives'), OPERAND2: 0 }], SUBSTACK: [['looks_say', { MESSAGE: 'Game over' }], ['control_stop', { STOP_OPTION: 'all' }]] }]
        ] }]])]
    },
    'street-walker': {
      Walker: [s(20, 20, [flag, ['motion_setrotationstyle', { STYLE: 'left-right' }], ['control_forever', { SUBSTACK: [
        ['motion_movesteps', { STEPS: 6 }], ['looks_nextcostume'], ['motion_ifonedgebounce'], ['control_wait', { DURATION: 0.15 }]] }]])]
    },
    'level-up': {
      Coin: [s(20, 20, [flag, ['control_forever', { SUBSTACK: [['control_if', { CONDITION: ['sensing_touchingobject', { TOUCHINGOBJECTMENU: 'Hero' }], SUBSTACK: [
        ['data_changevariableby', { VARIABLE: 'score', VALUE: 1 }],
        ['motion_gotoxy', { X: ['operator_random', { FROM: -200, TO: 200 }], Y: ['operator_random', { FROM: -140, TO: 140 }] }],
        ['control_if', { CONDITION: ['operator_equals', { OPERAND1: V('score'), OPERAND2: 5 }], SUBSTACK: [['event_broadcast', { BROADCAST_INPUT: 'level up' }]] }]
      ] }]] }]])],
      Hero: [s(20, 20, [flag, ['motion_gotoxy', { X: -150, Y: -110 }]]),
        s(20, 400, [['event_whenbroadcastreceived', { BROADCAST_OPTION: 'level up' }], ['looks_sayforsecs', { MESSAGE: 'Level 2!', SECS: 2 }]])].concat(arrows),
      Stage: [
        s(20, 20, [flag, ['looks_switchbackdropto', { BACKDROP: 'Level 1' }], ['data_setvariableto', { VARIABLE: 'score', VALUE: 0 }], ['data_setvariableto', { VARIABLE: 'level', VALUE: 1 }]]),
        s(20, 200, [['event_whenbroadcastreceived', { BROADCAST_OPTION: 'level up' }], ['looks_switchbackdropto', { BACKDROP: 'Level 2' }], ['data_setvariableto', { VARIABLE: 'level', VALUE: 2 }]])
      ]
    },
    'my-game': {
      Player: [s(20, 20, [flag, ['data_setvariableto', { VARIABLE: 'score', VALUE: 0 }], ['motion_gotoxy', { X: 0, Y: -120 }]]),
        s(300, 20, [['event_whenthisspriteclicked'], ['data_changevariableby', { VARIABLE: 'score', VALUE: 1 }]])].concat(arrows),
      Stage: [s(20, 20, [flag, ['control_forever', { SUBSTACK: [['control_if', { CONDITION: ['operator_gt', { OPERAND1: V('score'), OPERAND2: 4 }], SUBSTACK: [['control_stop', { STOP_OPTION: 'all' }]] }]] }]])],
      extraSprites: true
    },
    'bug-wrong-way': {
      Rocket: [s(20, 20, [flag, ['motion_gotoxy', { X: 0, Y: 0 }]])].concat(arrows)
    },
    'bug-reset': {
      Gem: [s(20, 20, [flag, ['data_setvariableto', { VARIABLE: 'clicks', VALUE: 0 }], ['looks_switchcostumeto', { COSTUME: 'gem' }]]),
        s(20, 160, [['event_whenthisspriteclicked'], ['data_changevariableby', { VARIABLE: 'clicks', VALUE: 1 }]])]
    },
    'bug-once': {
      Ball: [s(20, 20, [flag, ['motion_gotoxy', { X: 0, Y: 0 }], ['motion_pointindirection', { DIRECTION: 45 }],
        ['control_forever', { SUBSTACK: [['motion_movesteps', { STEPS: 10 }], ['motion_ifonedgebounce']] }]])]
    },
    'bug-wrong-sprite': {
      Coin: [s(20, 20, [flag, ['data_setvariableto', { VARIABLE: 'score', VALUE: 0 }], ['control_forever', { SUBSTACK: [
        ['control_if', { CONDITION: ['sensing_touchingobject', { TOUCHINGOBJECTMENU: 'Hero' }], SUBSTACK: [
          ['data_changevariableby', { VARIABLE: 'score', VALUE: 1 }],
          ['motion_gotoxy', { X: ['operator_random', { FROM: -200, TO: 200 }], Y: ['operator_random', { FROM: -140, TO: 140 }] }]
        ] }]] }]])]
    },
    'bug-never-wins': {
      Gem: [s(20, 20, [flag, ['data_setvariableto', { VARIABLE: 'clicks', VALUE: 0 }], ['looks_say', { MESSAGE: '' }]]),
        s(20, 160, [['event_whenthisspriteclicked'], ['data_changevariableby', { VARIABLE: 'clicks', VALUE: 1 }],
          ['control_if', { CONDITION: ['operator_equals', { OPERAND1: V('clicks'), OPERAND2: 10 }], SUBSTACK: [['looks_say', { MESSAGE: 'You win!' }]] }]])]
    },
    'bug-never-ends': {
      Ball: [s(20, 20, [flag, ['motion_gotoxy', { X: 0, Y: 100 }], ['motion_pointindirection', { DIRECTION: 150 }],
          ['control_forever', { SUBSTACK: [['motion_movesteps', { STEPS: 6 }], ['motion_ifonedgebounce']] }]]),
        s(20, 260, [flag, ['control_wait_until', { CONDITION: ['sensing_touchingcolor', { COLOR: '#e02424' }] }], ['control_stop', { STOP_OPTION: 'all' }]])]
    }
  };
})();
