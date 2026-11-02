// Who Does This Job? (?activity=parts): the parts inside the CPU (syllabus 0478 3.1.2). Each round is a set of jobs;
// the student says which part does each one, then checks once. Any wrong pick and the round does not count; NEED
// clean rounds in a row move up a level. Levels: ALU or CU, which register (PC, MAR, MDR, CIR, ACC), then all seven
// parts with numbers from a moment in a program. Wording follows the real mark schemes (0478/11 November 2021 Q6,
// 0478/13 June 2021 Q10, 0478/13 June 2024 Q8(c), 0478/11 June 2025 Q5, 0478/13 November 2025 Q2(b)).
(function () {
  'use strict';
  var el = Lab.el, pick = Lab.pick, shuffle = Lab.shuffle, rnd = Lab.rnd;
  var NEED = 2;
  var WHY = {
    ALU: 'the <b>ALU</b> (arithmetic logic unit) carries out calculations and logical operations, such as comparing two numbers',
    CU: 'the <b>CU</b> (control unit) sends signals to manage how data and instructions move, and works out what each instruction means',
    PC: 'the <b>PC</b> (program counter) holds the address of the <b>next</b> instruction',
    MAR: 'the <b>MAR</b> (memory address register) holds the <b>address</b> that memory is about to read or write',
    MDR: 'the <b>MDR</b> (memory data register) holds the <b>data or instruction</b> that has just come from memory, or is about to go to it',
    CIR: 'the <b>CIR</b> (current instruction register) holds the instruction that is being worked out and carried out <b>now</b>',
    ACC: 'the <b>ACC</b> (accumulator) holds the result of a calculation from the ALU, part-way through the program'
  };
  function bank(level) {
    var a = rnd(11, 39), b = rnd(3, 9), big = rnd(31, 60), addr = rnd(5, 9), val = rnd(12, 45), next = rnd(2, 4);
    var ALU = [['Adds ' + a + ' and ' + b, 'ALU'], ['Takes ' + b + ' away from ' + a, 'ALU'], ['Checks if ' + big + ' is bigger than 30', 'ALU'],
      ['Checks if two numbers are equal', 'ALU'], ['Carries out calculations', 'ALU'], ['Carries out logical operations, such as comparing two numbers', 'ALU']];
    var CU = [['Sends signals to control how data moves around the CPU', 'CU'], ['Works out what an instruction means (decodes it)', 'CU'],
      ['Manages the flow of data and instructions through the CPU', 'CU'], ['Sends a signal to memory to read an address', 'CU'], ['Tells the ALU which calculation to do', 'CU']];
    var REG = [['Holds the address of the next instruction', 'PC'], ['Goes up by 1 each time an instruction is taken from memory', 'PC'], ['Tells the CPU where to find the next instruction', 'PC'],
      ['Holds the address of the data about to be taken from memory', 'MAR'], ['Holds the address in memory that is about to be read', 'MAR'], ['Holds the address where data is about to be written', 'MAR'],
      ['Holds the data that has just been taken from memory', 'MDR'], ['Holds data that is about to be written to memory', 'MDR'], ['Holds the instruction or data that has just arrived from memory', 'MDR'],
      ['Holds the instruction that is being worked out and carried out', 'CIR'], ['Holds the current instruction', 'CIR'],
      ['Holds the result of a calculation from the ALU', 'ACC'], ['Holds results part-way through a calculation (interim results)', 'ACC']];
    var NOW = [['The CPU is about to read address ' + addr + ' in memory. Which part holds ' + addr + '?', 'MAR'],
      ['Address ' + addr + ' holds ' + val + '. It has just been read from memory. Which part holds ' + val + '?', 'MDR'],
      ['The next instruction is at address ' + next + '. Which part holds ' + next + '?', 'PC'],
      ['The ALU has worked out ' + a + ' + ' + b + ' = ' + (a + b) + '. Which part holds ' + (a + b) + '?', 'ACC'],
      ['The CPU is carrying out ADD ' + addr + '. The number it needs has just arrived in the MDR. Which register still holds ADD ' + addr + '?', 'CIR'],
      ['Which part works out ' + a + ' + ' + b + '?', 'ALU'],
      ['Which part works out what ADD ' + addr + ' means?', 'CU']];
    if (level === 0) return { buttons: ['ALU', 'CU'], cards: shuffle(shuffle(ALU).slice(0, 2).concat(shuffle(CU).slice(0, 2))) };
    if (level === 1) {
      var regs = shuffle(['PC', 'MAR', 'MDR', 'CIR', 'ACC']).slice(0, 4);
      var cards = regs.map(function (r) { return pick(REG.filter(function (c) { return c[1] === r; })); });
      cards.push(pick(REG.filter(function (c) { return cards.indexOf(c) < 0; })));
      return { buttons: ['PC', 'MAR', 'MDR', 'CIR', 'ACC'], cards: shuffle(cards) };
    }
    var mixed = shuffle(NOW).slice(0, 3).concat(shuffle(REG).slice(0, 1), shuffle(ALU.concat(CU)).slice(0, 1));
    return { buttons: ['ALU', 'CU', 'PC', 'MAR', 'MDR', 'CIR', 'ACC'], cards: shuffle(mixed) };
  }
  var LEVELS = [
    { name: 'ALU or CU', how: 'The ALU does the maths and the comparing. The CU is in charge: it sends signals and works out what each instruction means.' },
    { name: 'Which register?', how: 'A register is a tiny, very fast store inside the CPU. Each one has one job. Look for the clue words: next, address, data, now, result.' },
    { name: 'All seven parts', how: 'Now every part, with numbers from a moment in a program. Ask: is it an address, data, an instruction, or a result?' }
  ];
  var host = document.getElementById('activity');
  var log = Lab.results('cpu-lab-parts', 'CPU Lab: Who Does This Job?');
  var lv = Math.max(0, Math.min(LEVELS.length - 1, (parseInt(new URLSearchParams(location.search).get('level'), 10) || 1) - 1));
  var have = 0, R = null, shownHow = {};

  function newRound() {
    var b = bank(lv);
    R = { buttons: b.buttons, cards: b.cards, picks: {}, checked: false, walked: false, level: lv };
    draw();
    if (!shownHow[lv]) { shownHow[lv] = true; howItWorks(); }
  }
  function draw(msg, cls) {
    host.innerHTML = '';
    host.appendChild(el('h1', { class: 'lab-title' }, 'Who Does This Job?'));
    if (log.isDone()) host.appendChild(el('div', { class: 'done-banner' }, 'Finished: you know the job of every part of the CPU. Keep going for practice.'));
    host.appendChild(Lab.bar('Level ' + (lv + 1) + ' of ' + LEVELS.length + ': ' + LEVELS[lv].name, have, NEED));
    host.appendChild(el('div', { class: 'rule' }, R.buttons.map(function (t) { return WHY[t].charAt(0).toUpperCase() + WHY[t].slice(1) + '.'; }).join('<br>')));
    host.appendChild(el('p', { class: 'task-q' }, 'Which part of the CPU does each job? Pick one for every job, then check. One check only.'));
    var list = el('div', { class: 'cards' });
    R.cards.forEach(function (c, i) {
      var card = el('div', { class: 'card' });
      card.appendChild(el('span', {}, c[0]));
      var seg = el('div', { class: 'seg', role: 'group', 'aria-label': 'Job ' + (i + 1) });
      R.buttons.forEach(function (t) {
        var b = el('button', { type: 'button', 'aria-pressed': String(R.picks[i] === t) }, t);
        b.disabled = R.checked;
        b.addEventListener('click', function () { R.picks[i] = t; draw(); });
        seg.appendChild(b);
      });
      card.appendChild(seg);
      if (R.checked) {
        card.className = 'card ' + (R.picks[i] === c[1] ? 'good' : 'bad');
        if (R.picks[i] !== c[1]) card.appendChild(el('span', { class: 'why' }, 'This is the <b>' + c[1] + '</b>: ' + WHY[c[1]] + '.'));
      }
      list.appendChild(card);
    });
    host.appendChild(list);
    var act = el('div', { class: 'actions' });
    if (!R.checked) act.appendChild(Lab.button('Check', '', check));
    else act.appendChild(Lab.button('Next set of jobs', '', newRound));
    act.appendChild(Lab.button('Walk me through it', 'secondary', walkMe));
    act.appendChild(Lab.button('How it works', 'secondary', function () { howItWorks(); }));
    host.appendChild(act);
    host.appendChild(el('div', { class: 'feedback ' + (cls || ''), role: 'status' }, msg || ''));
    Lab.reportHeight();
  }
  function check() {
    if (R.checked) return;
    if (R.cards.some(function (c, i) { return !R.picks[i]; })) { draw('Pick a part for every job first.', 'hint'); return; }
    var wrong = R.cards.filter(function (c, i) { return R.picks[i] !== c[1]; });
    var ok = !wrong.length;
    R.checked = true;
    log.add(LEVELS[R.level].name + ': ' + (ok ? 'all right' : wrong.map(function (c) { return '"' + c[0] + '" is ' + c[1] + ', not ' + R.picks[R.cards.indexOf(c)]; }).join('; ')) + (R.walked ? ', used Walk me through it' : ''), ok);
    var up = false;
    if (ok) {
      have++;
      if (have >= NEED) { have = 0; if (lv < LEVELS.length - 1) { lv++; up = true; } else log.finish(); }
      draw('Right, with no mistakes.' + (up ? ' Level up: ' + LEVELS[lv].name + '.' : ''), 'good');
    } else {
      have = 0;
      draw('Not this time. Read why for each red job. This set does not count.', 'bad');
    }
  }
  // A walk through a different set of jobs: the clue word in each job, then the part it points to.
  function clue(c) {
    var t = c[1];
    return t === 'ALU' ? 'It is a calculation or a comparison, so it is maths work.' :
      t === 'CU' ? 'It is about control: sending signals, or working out what an instruction means.' :
      t === 'PC' ? 'The clue is <b>next</b> instruction: the address of where the program goes next.' :
      t === 'MAR' ? 'The clue is an <b>address</b> being used right now, to read or write memory.' :
      t === 'MDR' ? 'The clue is what has just <b>come from</b> memory (or is going to it): the data itself, not its address.' :
      t === 'CIR' ? 'The clue is the instruction being carried out <b>now</b>.' : 'The clue is a <b>result</b> from the ALU.';
  }
  function steps(cards) {
    var out = [{ text: 'For each job, find the clue word. Then ask: is it maths, control, an address, data from memory, the current instruction, or a result?', visual: '' }];
    cards.forEach(function (c) { out.push({ text: c[0] + '. ' + clue(c) + ' So it is the <span class="hl">' + c[1] + '</span>.', visual: '' }); });
    out.push({ text: 'The PC and the MAR both hold addresses. The PC holds the <b>next</b> instruction\'s address. The MAR holds the address being read or written <b>right now</b>.', visual: '' });
    return out;
  }
  function different() {
    var b, k = 0;
    do { b = bank(lv); k++; } while (k < 20 && R && b.cards.some(function (c) { return R.cards.some(function (r) { return r[0] === c[0]; }); }));
    return b.cards.slice(0, 4);
  }
  function howItWorks() { Lab.walk('How it works: ' + LEVELS[lv].name, LEVELS[lv].how + ' Here are jobs like the next ones.', steps(different())); }
  function walkMe() {
    R.walked = true;
    Lab.walk('Walk me through it', 'Different jobs, the same way of thinking.', steps(different()), function (seen, total) { log.note('Walk me through it (' + seen + ' of ' + total + ' steps).'); });
  }
  newRound();
})();
