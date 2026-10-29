// Input, Process, Output (?activity=ipo): the CPU processes the instructions and data that are input, so that a
// result can be output. Each round is one device, its steps in order; the student labels every step Input, Process
// or Output, then checks once. Any wrong label and the round does not count; NEED clean rounds in a row move up a
// level. Levels: computers, sensor and microprocessor systems (wording from the real mark schemes: 0478/11 June 2021
// Q6, 0478/11 November 2021 Q9, 0478/12 June 2021 Q6, 0478/12 March 2026 Q3), then find the missing step.
(function () {
  'use strict';
  var el = Lab.el, pick = Lab.pick, shuffle = Lab.shuffle;
  var NEED = 2;
  var TYPES = ['Input', 'Process', 'Output'];
  var WHY = {
    Input: 'data going <b>into</b> the CPU from a device such as a keyboard, a scanner or a sensor',
    Process: 'the CPU (or microprocessor) <b>working on</b> the data: calculating, comparing or deciding',
    Output: 'a result the CPU sends <b>out</b>: shown on a screen, played, or a signal that makes something happen'
  };
  var I = 'Input', P = 'Process', O = 'Output';
  var COMPUTERS = [
    ['A calculator app', [['You type 12 + 30 on the keyboard', I], ['The CPU adds 12 and 30', P], ['The screen shows 42', O]]],
    ['A self-checkout', [['The barcode scanner reads the barcode', I], ['The CPU looks up the price of the item', P], ['The CPU adds the price to the total', P], ['The screen shows the new total', O]]],
    ['A games console', [['You press jump on the controller', I], ['The CPU works out the character\'s new position', P], ['The screen shows the character jumping', O], ['The speaker plays a jump sound', O]]],
    ['A music app', [['You tap play on the touch screen', I], ['The CPU reads the music file and turns it into sound data', P], ['The speaker plays the song', O]]],
    ['A word processor', [['You press the A key', I], ['The CPU stores the letter in the document', P], ['The screen shows the letter A', O]]],
    ['A digital camera', [['You press the shutter button', I], ['The CPU compresses the photo', P], ['The screen shows the photo', O]]],
    ['A cash machine', [['You type your PIN on the keypad', I], ['The CPU checks the PIN is correct', P], ['The screen shows your balance', O]]]
  ];
  var SENSORS = [
    ['A greenhouse heater', [['The temperature sensor sends a reading to the microprocessor', I], ['The microprocessor compares the reading with the stored value', P], ['The microprocessor finds the reading is below 25', P], ['The microprocessor sends a signal to turn the heater on', O]]],
    ['A washing machine', [['The temperature sensor sends data to the microprocessor', I], ['The microprocessor checks if the data is below 30', P], ['The microprocessor sends a signal to switch the heater on', O]]],
    ['A security light', [['The light sensor and the infra-red sensor send data to the microprocessor', I], ['The microprocessor checks both readings against the stored values', P], ['The microprocessor sends a signal to switch the light on', O], ['The microprocessor counts until the timer reaches 1 minute', P], ['The microprocessor sends a signal to switch the light off', O]]],
    ['A drone that must not crash', [['The proximity sensor sends data to the microprocessor', I], ['The microprocessor compares the distance with the stored value', P], ['The microprocessor sends a signal to the motors to change direction', O]]],
    ['An air conditioner', [['The temperature sensor sends a reading to the microprocessor', I], ['The microprocessor finds the reading is above 24', P], ['The microprocessor sends a signal to turn the fan on', O]]]
  ];
  var LEVELS = [
    { name: 'Computers', bank: COMPUTERS },
    { name: 'Sensors and microprocessors', bank: SENSORS },
    { name: 'Find the missing step', bank: COMPUTERS.concat(SENSORS) }
  ];
  var host = document.getElementById('activity');
  var log = Lab.results('cpu-lab-ipo', 'CPU Lab: Input, Process, Output');
  var lv = Math.max(0, Math.min(LEVELS.length - 1, (parseInt(new URLSearchParams(location.search).get('level'), 10) || 1) - 1));
  var have = 0, R = null, shownHow = {}, last = '';

  function scenario(avoid) {
    var s, k = 0;
    do { s = pick(LEVELS[lv].bank); k++; } while (k < 30 && (s[0] === last || s[0] === avoid));
    return s;
  }
  function newRound() {
    var s = scenario();
    last = s[0];
    R = { s: s, picks: {}, checked: false, walked: false };
    if (lv === 2) {
      var gap = Lab.rnd(0, s[1].length - 1), want = s[1][gap];
      var others = [];
      LEVELS[2].bank.forEach(function (o) { if (o[0] !== s[0]) o[1].forEach(function (st) { if (st[1] !== want[1]) others.push(st); }); });
      var wrong = [];
      shuffle(others).forEach(function (st) { if (wrong.length < 2 && !wrong.some(function (w) { return w[1] === st[1]; })) wrong.push(st); });
      R.gap = gap; R.options = shuffle([want].concat(wrong));
    }
    draw();
    if (!shownHow[lv]) { shownHow[lv] = true; howItWorks(); }
  }
  function draw(msg, cls) {
    host.innerHTML = '';
    host.appendChild(el('h1', { class: 'lab-title' }, 'Input, Process, Output'));
    if (log.isDone()) host.appendChild(el('div', { class: 'done-banner' }, 'Finished: you can follow input, process and output. Keep going for practice.'));
    host.appendChild(Lab.bar('Level ' + (lv + 1) + ' of ' + LEVELS.length + ': ' + LEVELS[lv].name, have, NEED));
    host.appendChild(el('div', { class: 'rule' }, TYPES.map(function (t) { return '<b>' + t + '</b>: ' + WHY[t] + '.'; }).join('<br>')));
    host.appendChild(el('p', { class: 'task-q' }, lv === 2 ? '<b>' + R.s[0] + '.</b> One step is missing. Which step goes in the gap?' : '<b>' + R.s[0] + '.</b> Label every step Input, Process or Output, then check. One check only.'));
    var list = el('div', { class: 'cards' });
    R.s[1].forEach(function (st, i) {
      var card = el('div', { class: 'card' });
      if (lv === 2 && i === R.gap) {
        card.appendChild(el('span', {}, '<b>Step ' + (i + 1) + ': ?</b>'));
        list.appendChild(card);
        return;
      }
      card.appendChild(el('span', {}, 'Step ' + (i + 1) + ': ' + st[0]));
      if (lv !== 2) {
        var seg = el('div', { class: 'seg', role: 'group', 'aria-label': 'Step ' + (i + 1) });
        TYPES.forEach(function (t) {
          var b = el('button', { type: 'button', 'aria-pressed': String(R.picks[i] === t) }, t);
          b.disabled = R.checked;
          b.addEventListener('click', function () { R.picks[i] = t; draw(); });
          seg.appendChild(b);
        });
        card.appendChild(seg);
        if (R.checked) {
          card.className = 'card ' + (R.picks[i] === st[1] ? 'good' : 'bad');
          if (R.picks[i] !== st[1]) card.appendChild(el('span', { class: 'why' }, 'This is <b>' + st[1] + '</b>: ' + WHY[st[1]] + '.'));
        }
      }
      list.appendChild(card);
    });
    host.appendChild(list);
    if (lv === 2) {
      var opts = el('div', { class: 'cards', style: 'margin-top:8px' });
      R.options.forEach(function (o, k) {
        var card = el('div', { class: 'card' });
        card.appendChild(el('span', {}, o[0]));
        var b = el('button', { type: 'button', class: 'btn secondary', 'aria-pressed': String(R.choice === k) }, R.choice === k ? 'Chosen' : 'Choose');
        b.disabled = R.checked;
        b.addEventListener('click', function () { R.choice = k; draw(); });
        card.appendChild(b);
        if (R.checked) {
          var right = o === R.s[1][R.gap];
          if (right || R.choice === k) card.className = 'card ' + (right ? 'good' : 'bad');
          if (R.choice === k && !right) card.appendChild(el('span', { class: 'why' }, 'This is <b>' + o[1] + '</b>, but the gap needs <b>' + R.s[1][R.gap][1] + '</b>: ' + WHY[R.s[1][R.gap][1]] + '.'));
        }
        opts.appendChild(card);
      });
      host.appendChild(opts);
    }
    var act = el('div', { class: 'actions' });
    if (!R.checked) act.appendChild(Lab.button('Check', '', check));
    else act.appendChild(Lab.button('Next device', '', newRound));
    act.appendChild(Lab.button('Walk me through it', 'secondary', walkMe));
    act.appendChild(Lab.button('How it works', 'secondary', function () { howItWorks(); }));
    host.appendChild(act);
    host.appendChild(el('div', { class: 'feedback ' + (cls || ''), role: 'status' }, msg || ''));
    Lab.reportHeight();
  }
  function check() {
    if (R.checked) return;
    var ok, text;
    if (lv === 2) {
      if (R.choice == null) { draw('Choose a step for the gap first.', 'hint'); return; }
      ok = R.options[R.choice] === R.s[1][R.gap];
      text = R.s[0] + ': gap ' + (ok ? 'right' : 'wrong');
    } else {
      if (R.s[1].some(function (st, i) { return !R.picks[i]; })) { draw('Label every step first.', 'hint'); return; }
      var wrong = R.s[1].filter(function (st, i) { return R.picks[i] !== st[1]; }).length;
      ok = wrong === 0;
      text = R.s[0] + ': ' + (ok ? 'all labels right' : wrong + ' wrong label' + (wrong > 1 ? 's' : ''));
    }
    R.checked = true;
    log.add(text + (R.walked ? ', used Walk me through it' : ''), ok);
    var up = false;
    if (ok) {
      have++;
      if (have >= NEED) { have = 0; if (lv < LEVELS.length - 1) { lv++; up = true; } else log.finish(); }
      draw('Right, with no mistakes.' + (up ? ' Level up: ' + LEVELS[lv].name + '.' : ''), 'good');
    } else {
      have = 0;
      draw('Not this time. Read why for each red step. This device does not count.', 'bad');
    }
  }
  function steps(s, gap) {
    var out = [{ text: '<b>' + s[0] + '.</b> Ask the same question for each step: is data going <b>into</b> the CPU, is the CPU <b>working on</b> it, or is a result going <b>out</b>?', visual: '' }];
    s[1].forEach(function (st, i) {
      var t = st[1];
      var reason = t === 'Input' ? 'A device sends data in. The CPU cannot process anything until it has the data.' :
        t === 'Process' ? 'Nothing comes in or goes out here. The CPU works on the data it already has.' : 'The CPU sends a result out, so something happens in the world.';
      out.push({ text: (gap === i ? '(The gap.) ' : '') + 'Step ' + (i + 1) + ': ' + st[0] + '. This is <span class="hl">' + t + '</span>. ' + reason, visual: '' });
    });
    out.push({ text: 'The order is always input, then process, then output. A step can repeat: a device may process twice or output twice.', visual: '' });
    return out;
  }
  function howItWorks() {
    var s = scenario(R ? R.s[0] : '');
    Lab.walk('How it works: ' + LEVELS[lv].name, lv === 2 ? 'Find the type of step the gap needs, then the step that fits.' : 'Here is a device like the next one, step by step.', steps(s, lv === 2 ? 1 : null));
  }
  function walkMe() {
    R.walked = true;
    var s = scenario(R.s[0]);
    Lab.walk('Walk me through it', 'A different device.', steps(s, null), function (seen, total) { log.note('Walk me through it (' + seen + ' of ' + total + ' steps).'); });
  }
  newRound();
})();
