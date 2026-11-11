// FDE Steps: the page. Five stages as tabs, one small question at a time, questions forever. Help fades per
// question: full help when it is new or after a mistake, less after one right, none after two.
(function () {
  'use strict';
  var SAVE_KEY = 'bc-fdesteps-v1';
  var state = load();

  function load() {
    try { var raw = localStorage.getItem(SAVE_KEY); return FDE.fixState(raw ? JSON.parse(raw) : null); } catch (e) { return FDE.newState(); }
  }
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {} }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function btn(label, cls, fn) {
    var b = el('button', cls, label);
    b.type = 'button';
    b.addEventListener('click', fn);
    return b;
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  var main = document.querySelector('main');
  main.innerHTML =
    '<header class="top"><h1 class="title">FDE Steps</h1>' +
    '<div class="overall"><span class="overall-text"></span><span class="meter"><i></i></span></div></header>' +
    '<nav class="tabs" role="tablist" aria-label="Stages"></nav>' +
    '<section class="panel stage" role="tabpanel">' +
    '<div class="stage-head"><h2 class="stage-name"></h2><button type="button" class="how-btn" aria-expanded="false">How it works</button></div>' +
    '<div class="how" hidden></div>' +
    '<div class="suggest" hidden></div>' +
    '<p class="q-text"></p><div class="q"></div>' +
    '<div class="feedback" aria-live="polite"></div><div class="actions"></div></section>' +
    '<section class="panel mastery"><div class="mastery-head"><h2>Mastery</h2><span class="small">3 right in a row masters a question. Mastered questions still come back.</span></div><div class="chips"></div></section>';
  var tabsEl = main.querySelector('.tabs'), qText = main.querySelector('.q-text'), qArea = main.querySelector('.q');
  var fbEl = main.querySelector('.feedback'), actions = main.querySelector('.actions'), chipsEl = main.querySelector('.chips');
  var howBtn = main.querySelector('.how-btn'), howEl = main.querySelector('.how'), suggestEl = main.querySelector('.suggest');
  function fb(html, kind) { fbEl.className = 'feedback' + (kind ? ' ' + kind : ''); fbEl.innerHTML = html || ''; }

  // ---------- the CPU picture ----------
  // regs: the five registers; o.from: the box a value comes from; o.pick(name, node): makes boxes clickable
  // (PC, MAR, MDR, CIR, ACC, CU, Memory); o.memFrom: the memory row being read.
  var REG_ORDER = ['PC', 'MAR', 'MDR', 'CU', 'ALU', 'ACC'];
  function picture(c, regs, o) {
    o = o || {};
    var wrap = el('div', 'cpu-pic'), cpu = el('div', 'cpu'), boxes = {};
    REG_ORDER.forEach(function (name) {
      var isCu = name === 'CU', isAlu = name === 'ALU';
      var label = isCu ? 'CU: CIR' : name, value = isCu ? regs.CIR : isAlu ? '' : regs[name];
      var clickName = isCu ? (o.cuAsDecode ? 'CU' : 'CIR') : name;
      var node = o.pick && !isAlu ? el('button', 'reg' + (isCu ? ' cu' : '')) : el('div', 'reg' + (isCu ? ' cu' : ''));
      node.innerHTML = '<span class="rn">' + label + '</span><span class="rv">' + esc(value) + '</span>';
      if (o.pick && !isAlu) { node.type = 'button'; node.addEventListener('click', function () { o.pick(clickName, node); }); }
      if (o.from && (o.from === name || (o.from === 'CIR' && isCu))) node.classList.add('from');
      boxes[clickName] = node;
      if (isCu) boxes.CIR = boxes.CU = node;
      cpu.appendChild(node);
    });
    wrap.appendChild(cpu);
    var mem = o.pick ? el('button', 'mem') : el('div', 'mem');
    var rows = c.M.addrs.map(function (a) { return '<tr' + (String(o.memFrom) === String(a) ? ' class="from"' : '') + '><td>' + a + '</td><td>' + esc(c.M.cells[a]) + '</td></tr>'; }).join('');
    mem.innerHTML = '<div class="mt">Memory</div><table><tr><td>Address</td><td>Holds</td></tr>' + rows + '</table>';
    if (o.pick) { mem.type = 'button'; mem.addEventListener('click', function () { o.pick('Memory', mem); }); }
    if (o.from === 'Memory') mem.classList.add('from');
    boxes.Memory = mem;
    wrap.appendChild(mem);
    wrap.boxes = boxes;
    return wrap;
  }
  function card(label, html) { return el('div', 'card', (label ? '<span class="lbl">' + label + '</span>' : '') + html); }
  function tip(html) { return el('p', 'tip', html); }
  // The move's card beside a small memory table, so every number in the move can be found.
  function withMemory(c, cardNode) {
    var row = el('div', 'cpu-pic card-row');
    row.appendChild(cardNode);
    var mem = el('div', 'mem');
    mem.innerHTML = '<div class="mt">Memory</div><table><tr><td>Address</td><td>Holds</td></tr>' +
      c.M.addrs.map(function (a) { return '<tr><td>' + a + '</td><td>' + esc(c.M.cells[a]) + '</td></tr>'; }).join('') + '</table>';
    row.appendChild(mem);
    return row;
  }
  // Where a move sits in the run: 5 fetch moves, decode, 4 execute moves.
  function strip(index) {
    var s = el('div', 'strip');
    var letters = ['F', 'F', 'F', 'F', 'F', 'D', 'E', 'E', 'E', 'E'];
    letters.forEach(function (L, i) {
      if (i === 5 || i === 6) s.appendChild(el('span', 'gap'));
      s.appendChild(el('i', i < index ? 'done' : i === index ? 'now' : '', L));
    });
    s.setAttribute('aria-label', 'Move ' + (index + 1) + ' of 10');
    return s;
  }

  // ---------- tabs, header, chips ----------
  function drawTabs() {
    tabsEl.innerHTML = '';
    var sug = suggestion();
    FDE.STAGES.forEach(function (st, i) {
      var c = FDE.counts(state, st.id);
      var t = el('button', 'tab' + (st.id === state.stage ? ' on' : '') + (FDE.stageDone(state, st.id) ? ' done' : '') + (sug === st.id ? ' suggested' : ''),
        '<span class="num">' + (i + 1) + '</span><span class="tname">' + st.name + '</span><span class="tcount">' + c.have + '/' + c.total + '</span>');
      t.type = 'button';
      t.setAttribute('role', 'tab');
      t.setAttribute('aria-selected', st.id === state.stage ? 'true' : 'false');
      t.addEventListener('click', function () { goStage(st.id); });
      tabsEl.appendChild(t);
    });
  }
  function suggestion() {
    if (!FDE.stageDone(state, state.stage)) return null;
    var i = FDE.STAGES.findIndex(function (s) { return s.id === state.stage; });
    for (var k = 1; k < FDE.STAGES.length; k++) {
      var s = FDE.STAGES[(i + k) % FDE.STAGES.length];
      if (!FDE.stageDone(state, s.id)) return s.id;
    }
    return null;
  }
  function drawHeader() {
    var c = FDE.counts(state);
    main.querySelector('.overall-text').textContent = c.have + ' of ' + c.total + ' mastered';
    main.querySelector('.meter i').style.width = (100 * c.have / c.total) + '%';
    var sug = suggestion();
    suggestEl.hidden = !FDE.stageDone(state, state.stage);
    suggestEl.innerHTML = '';
    if (!suggestEl.hidden) {
      var st = FDE.stage(sug);
      suggestEl.appendChild(el('span', '', sug ? 'You mastered this stage. Ready for the next one?' : 'You mastered every stage. Keep practising to keep it strong.'));
      if (sug) suggestEl.appendChild(btn('Go to stage ' + (FDE.STAGES.indexOf(st) + 1) + ': ' + st.name, 'btn small-btn', function () { goStage(sug); }));
    }
  }
  var SHORT = { start: 'Start', f1: 'PC to MAR', f2: 'MAR to memory', f3: 'Instruction to MDR', f4: 'PC + 1', f5: 'MDR to CIR', d: 'Decode',
    e1: 'Address to MAR', e2: 'MAR to memory', e3: 'Number to MDR', e4L: 'LOAD: to ACC', e4A: 'ADD: ALU adds', LOAD: 'Run LOAD', ADD: 'Run ADD', BOTH: 'Run LOAD then ADD' };
  function chipLabel(sid, it) {
    var stageLetter = { f1: 'F', f2: 'F', f3: 'F', f4: 'F', f5: 'F', d: 'D', e1: 'E', e2: 'E', e3: 'E', e4L: 'E', e4A: 'E' }[it];
    var lab = sid === 'next' ? (it === 'start' ? 'After: start' : 'After: ' + SHORT[it]) : SHORT[it];
    return '<span class="clabel">' + (stageLetter && sid !== 'next' ? stageLetter + ': ' : '') + lab + '</span>';
  }
  function drawChips() {
    chipsEl.innerHTML = '';
    var sid = state.stage;
    FDE.stage(sid).items.forEach(function (it) {
      var rec = state.items[FDE.key(sid, it)];
      var chip = el('div', 'chip' + (rec.mastered ? ' mastered' : '') + (cur && cur.item === it ? ' now' : ''));
      chip.dataset.item = it;
      var dots = '';
      for (var i = 0; i < FDE.NEED; i++) dots += '<i class="' + (i < rec.streak ? 'on' : '') + '"></i>';
      chip.innerHTML = chipLabel(sid, it) + '<span class="dots" aria-label="' + rec.streak + ' of 3 in a row">' + dots + '</span>';
      chipsEl.appendChild(chip);
    });
  }

  // ---------- How it works ----------
  var HOW = {
    stage: '<p><b>Fetch</b>: the CPU gets the next instruction from memory. <b>Decode</b>: the CU works out what it means. <b>Execute</b>: it is carried out, and LOAD and ADD get the number they need from memory. So an instruction coming back means fetch, and a number coming back means execute.</p>',
    next: '<p>Fetch: PC to MAR, MAR to memory, memory to MDR, MDR to CIR. The PC also goes up by 1 during fetch. Then decode. Then execute: address to MAR, MAR to memory, memory to MDR, then the ACC.</p>',
    where: '<p>Pick the box the value goes to. When the value goes to or from memory, also pick the bus: addresses go to memory on the address bus, and instructions and numbers come back on the data bus.</p>',
    hold: '<p>Look at the boxes. Work out the one move that happens, then what the box holds after it. Watch out: an address is not the number stored there.</p>',
    run: '<p>Run a whole instruction. For each move, click the box that changes next, then pick what it holds. For decode, click the CU. The PC can go up by 1 at any point in fetch once the MAR has the address. One mistake means the run does not count.</p>'
  };
  howBtn.addEventListener('click', function () {
    var open = howEl.hidden;
    howEl.hidden = !open;
    howBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  function drawStageHead() {
    var st = FDE.stage(state.stage);
    main.querySelector('.stage-name').textContent = 'Stage ' + (FDE.STAGES.indexOf(st) + 1) + ': ' + st.name;
    howEl.innerHTML = HOW[state.stage];
  }

  // ---------- flow ----------
  var cur = null, lastItem = {};
  function goStage(id) {
    state.stage = id;
    save();
    drawTabs(); drawStageHead(); drawHeader();
    nextQuestion();
  }
  function nextQuestion() {
    var sid = state.stage;
    var item = FDE.pickItem(state, sid, lastItem[sid]);
    lastItem[sid] = item;
    cur = { stage: sid, item: item, answered: false, help: FDE.helpLevel(state, sid, item) };
    qArea.innerHTML = ''; qText.textContent = ''; fb(''); actions.innerHTML = '';
    ({ stage: askStage, next: askNext, where: askWhere, hold: askHold, run: askRun })[sid]();
    drawChips();
  }
  function showNext(label) {
    actions.innerHTML = '';
    var b = btn(label || 'Next question', 'btn next-btn', nextQuestion);
    actions.appendChild(b);
    b.focus({ preventScroll: true });
  }
  function score(ok) {
    var res = FDE.record(state, cur.stage, cur.item, ok);
    save();
    drawTabs(); drawHeader(); drawChips();
    var chip = chipsEl.querySelector('.chip[data-item="' + cur.item + '"]');
    if (res.newlyMastered && chip) {
      chip.classList.add('glow');
      setTimeout(function () { chip.classList.remove('glow'); }, 2600);
      var c = Fx.centre(chip);
      if (c.seen) Fx.burst(c.x, c.y, 70);
      var f = Fx.centre(fbEl);
      Fx.burst(f.x, f.y, 50);
    }
    if (res.allDone) { Fx.rainbow(6000); Fx.shower(260); banner('You mastered the whole cycle. Amazing!'); }
    else if (res.stageDone) { Fx.rainbow(4000); Fx.shower(160); banner('Stage mastered!'); }
    return res.newlyMastered ? ' <span class="mastered-note">Mastered!</span>' :
      res.lost ? ' <span class="lost-note">This one needs 3 in a row again.</span>' :
      ok ? ' <span class="streak-note">' + state.items[FDE.key(cur.stage, cur.item)].streak + ' of 3 in a row.</span>' : '';
  }
  function banner(text) {
    var b = el('div', 'party-banner', text);
    b.setAttribute('aria-hidden', 'true');
    document.body.appendChild(b);
    setTimeout(function () { b.remove(); }, 2600);
  }
  // A row of answer buttons. onPick(value, button, all) is called once.
  function choices(list, cls, onPick) {
    var row = el('div', cls === 'line' ? 'lines' : 'picks'), all = [];
    list.forEach(function (o) {
      var b = btn(esc(o.label), 'choice ' + cls, function () {
        if (row.dataset.done) return;
        row.dataset.done = '1';
        all.forEach(function (x) { x.disabled = true; });
        onPick(o.value, b, all);
      });
      b.dataset.value = o.value;
      all.push(b);
      row.appendChild(b);
    });
    row.mark = function (rightValue, picked) {
      all.forEach(function (x) { if (x.dataset.value === String(rightValue)) x.classList.add('ok'); });
      if (picked && picked.dataset.value !== String(rightValue)) picked.classList.add('bad');
    };
    return row;
  }
  function wrongText(picked, right) { return 'You picked <b>' + esc(picked) + '</b>. It should be <b>' + esc(right) + '</b>. '; }

  // ---------- Stage 1: Which stage? ----------
  var STAGE_WHY = { F: 'The CPU is getting the next instruction.', D: 'The CU is working out what the instruction means.', E: 'The instruction is being carried out. In execute, LOAD and ADD get the number they need from memory.' };
  function askStage() {
    var c = FDE.caseOf(FDE.memory(), FDE.opFor(cur.item)), m = FDE.moveOf(FDE.moves(c), cur.item);
    qText.textContent = 'Which stage is this move in?';
    qArea.appendChild(withMemory(c, card('', esc(m.text))));
    if (cur.help === 2) qArea.appendChild(tip('Is the CPU getting the next instruction (fetch), working out what it means (decode), or carrying it out (execute)? Execute can also get a number from memory.'));
    else if (cur.help === 1) qArea.appendChild(tip('An instruction from memory means fetch. A number from memory means execute.'));
    var row = choices(['F', 'D', 'E'].map(function (k) { return { label: FDE.STAGE_NAMES[k], value: k }; }), 'word', function (v, b) {
      var ok = v === m.stage;
      row.mark(m.stage, b);
      var extra = score(ok);
      fb((ok ? 'Right: <b>' + FDE.STAGE_NAMES[m.stage] + '</b>. ' : wrongText(FDE.STAGE_NAMES[v], FDE.STAGE_NAMES[m.stage])) + STAGE_WHY[m.stage] + extra, ok ? 'good' : 'bad');
      showNext();
    });
    qArea.appendChild(row);
    cur.keys = keyPicker(row);
  }

  // ---------- Stage 2: What comes next? ----------
  function askNext() {
    var q = FDE.nextQuestion(cur.item);
    qText.textContent = 'What happens next?';
    if (cur.help >= 1) qArea.appendChild(el('span', 'where-tag', 'Next move is in: ' + FDE.STAGE_NAMES[q.right.stage] + (q.index + 1 >= 10 ? ' (the next instruction)' : '')));
    qArea.appendChild(withMemory(q.c, q.done ? card('Just done', esc(q.done.text)) : card('Start', 'The PC holds ' + q.c.pc + '. The instruction at address ' + q.c.pc + ' is ' + esc(q.c.ins) + '.')));
    var row = choices(q.options.map(function (m) { return { label: m.text, value: m.text }; }), 'line', function (v, b) {
      var ok = v === q.right.text;
      row.mark(q.right.text, b);
      var extra = score(ok);
      fb((ok ? 'Right. ' : 'Not that one. The green answer comes next. ') + esc(q.right.why) + extra, ok ? 'good' : 'bad');
      showNext();
    });
    qArea.appendChild(row);
    cur.keys = keyPicker(row);
  }

  // ---------- Stage 3: Where does it go? ----------
  function wherePrompt(m, c) {
    var p = c.pc, ins = c.ins, a = c.a, n = c.n;
    return {
      f1: 'Fetch starts. The PC holds ' + p + '. Where is ' + p + ' copied to?',
      f2: 'The MAR holds ' + p + '. Where does it send ' + p + '?',
      f3: 'Memory sends back ' + ins + '. Where does it go?',
      f5: ins + ' is in the MDR. Where is it copied before decode?',
      e1: 'The CU has decoded ' + ins + '. Where does the ' + a + ' go?',
      e2: 'The MAR holds ' + a + '. Where does it send ' + a + '?',
      e3: 'Memory sends back ' + n + '. Where does it go?',
      e4L: 'The MDR holds ' + n + '. Where does LOAD ' + a + ' copy it?',
      e4A: 'The MDR holds ' + n + '. The ALU adds it to ' + c.acc + '. Where does the result go?'
    }[m.id];
  }
  // Buses are asked only between the CPU and memory, where there is one clear answer.
  var BUS_MOVES = { f2: 1, e2: 1, f3: 1, e3: 1 };
  function busPrompt(m) {
    return m.id === 'f2' || m.id === 'e2' ? 'Which bus carries ' + m.before.MAR + ' to memory?' : 'Which bus carries ' + m.value + ' from memory to the MDR?';
  }
  function askWhere() {
    var c = FDE.caseOf(FDE.memory(), FDE.opFor(cur.item)), m = FDE.moveOf(FDE.moves(c), cur.item);
    qText.textContent = wherePrompt(m, c);
    if (cur.help >= 1) qArea.appendChild(picture(c, m.before, { from: cur.help === 2 ? m.from : null, memFrom: cur.help === 2 && m.from === 'Memory' ? m.before.MAR : null }));
    if (cur.help === 2 && BUS_MOVES[m.id]) qArea.appendChild(tip('Addresses go to memory on the address bus. Instructions and numbers come back on the data bus.'));
    var dests = ['PC', 'MAR', 'MDR', 'CIR', 'ACC', 'Memory'];
    var row = choices(dests.map(function (d) { return { label: d, value: d }; }), 'word', function (v, b) {
      row.mark(m.to, b);
      if (v !== m.to) {
        var extra = score(false);
        fb(wrongText(v, m.to) + esc(m.why) + extra, 'bad');
        showNext();
        return;
      }
      if (!BUS_MOVES[m.id]) {
        fb('Right: <b>' + m.to + '</b>. ' + esc(m.why) + score(true), 'good');
        showNext();
        return;
      }
      fb('Right: <b>' + m.to + '</b>.', 'good');
      var bp = el('p', 'q-text', esc(busPrompt(m)));
      qArea.appendChild(bp);
      var row2 = choices(['Address bus', 'Data bus', 'Control bus'].map(function (d) { return { label: d, value: d }; }), 'word', function (v2, b2) {
        var ok = v2 === m.bus;
        row2.mark(m.bus, b2);
        var extra = score(ok);
        fb((ok ? 'Right: <b>' + m.to + '</b>, ' + m.bus.toLowerCase() + '. ' : wrongText(v2, m.bus)) + esc(m.why) + extra, ok ? 'good' : 'bad');
        showNext();
      });
      qArea.appendChild(row2);
      cur.keys = keyPicker(row2);
    });
    qArea.appendChild(row);
    cur.keys = keyPicker(row);
  }

  // ---------- Stage 4: What does it hold? ----------
  function askHold() {
    var c = FDE.caseOf(FDE.memory(), FDE.opFor(cur.item)), m = FDE.moveOf(FDE.moves(c), cur.item);
    qText.textContent = 'The ' + m.to + ' changes next. What does it hold after this move?';
    if (cur.help >= 1) qArea.appendChild(el('span', 'where-tag', FDE.STAGE_NAMES[m.stage] + (cur.help === 2 ? ': ' + SHORT[m.id] : '')));
    var pic = picture(c, m.before, { from: cur.help === 2 ? m.from : null, memFrom: cur.help === 2 && m.from === 'Memory' ? m.before.MAR : null });
    qArea.appendChild(pic);
    var opts = FDE.shuffle(FDE.holdOptions(m, c));
    var row = choices(opts.map(function (v) { return { label: v, value: v }; }), 'word mono', function (v, b) {
      var ok = v === m.value;
      row.mark(m.value, b);
      var box = pic.boxes[m.to];
      if (box) { box.querySelector('.rv').textContent = m.value; box.classList.add(ok ? 'ok' : 'bad', 'flash'); }
      var extra = score(ok);
      fb((ok ? 'Right: <b>' + esc(m.value) + '</b>. ' : wrongText(v, m.value)) + esc(m.text) + ' ' + esc(m.why) + extra, ok ? 'good' : 'bad');
      showNext();
    });
    qArea.appendChild(row);
    cur.keys = keyPicker(row);
  }

  // ---------- Stage 5: Run the cycle ----------
  function askRun() {
    var M = FDE.memory(), runs = cur.item === 'BOTH' ? ['LOAD', 'ADD'] : [cur.item], list = [];
    runs.forEach(function (op) { var c = FDE.caseOf(M, op); FDE.moves(c).forEach(function (m) { m.c = c; list.push(m); }); });
    var c0 = list[0].c, regs = Object.assign({}, c0.regs), k = 0, failed = false;
    qText.textContent = 'Run ' + (cur.item === 'BOTH' ? 'LOAD ' + M.x + ', then ADD ' + M.y : list[0].c.ins) + '. Click the box that changes next.';
    var holder = el('div', '');
    qArea.appendChild(holder);
    function step() {
      if (k >= list.length) return finish();
      var m = list[k], index = k % 10;
      holder.innerHTML = '';
      cur.keys = null;
      if (cur.help >= 1) holder.appendChild(el('span', 'where-tag', FDE.STAGE_NAMES[m.stage] + (cur.help === 2 ? ', move ' + (m.stage === 'F' ? index + 1 + ' of 5' : m.stage === 'E' ? index - 5 + ' of 4' : '1 of 1') : '')));
      var done = false;
      var pic = picture(m.c, regs, { from: cur.help === 2 ? m.from : null, cuAsDecode: true, memFrom: cur.help === 2 && m.from === 'Memory' ? regs.MAR : null, pick: function (name, node) {
        if (done) return;
        done = true;
        Object.keys(pic.boxes).forEach(function (n) { pic.boxes[n].disabled = true; });
        // The PC can go up by 1 at any point in fetch after its address is copied to the MAR, as long as it
        // is before decode. So clicking the PC early brings that move forward, and doing the MDR to CIR
        // copy first pushes it back.
        var f4 = -1;
        for (var j = k; j < list.length && list[j].id !== 'd'; j++) if (list[j].id === 'f4') { f4 = j; break; }
        if (f4 > k && name === 'PC' && m.stage === 'F' && m.id !== 'f1') { list.splice(k, 0, list.splice(f4, 1)[0]); m = list[k]; }
        else if (m.id === 'f4' && list[k + 1] && list[k + 1].id === 'f5' && (name === 'CU' || name === 'CIR')) {
          var t = list[k]; list[k] = list[k + 1]; list[k + 1] = t; m = list[k];
        }
        var want = m.to === 'CU' ? 'CU' : m.to;
        var ok = name === want || (want === 'CIR' && name === 'CU' && m.id === 'f5');
        if (!ok) {
          failed = true;
          node.classList.add('bad');
          pic.boxes[want].classList.add('ok');
          fb(wrongText(name === 'CU' ? 'CU (decode)' : name, want === 'CU' ? 'CU (decode)' : want) + esc(m.why) + ' <span class="lost-note">This run will not count.</span>', 'bad');
          return afterBox(pic, m, false);
        }
        pic.boxes[want].classList.add('ok');
        afterBox(pic, m, true);
      } });
      holder.appendChild(pic);
      fb('');
      actions.innerHTML = '';
    }
    function afterBox(pic, m, boxOk) {
      if (m.value == null) {
        if (boxOk) fb('Right. ' + esc(m.text), 'good');
        return carryOn(pic, m);
      }
      var p = el('p', 'q-text', 'What does the ' + m.to + ' hold now?');
      holder.appendChild(p);
      var opts = FDE.shuffle(FDE.holdOptions(m, m.c));
      var row = choices(opts.map(function (v) { return { label: v, value: v }; }), 'word mono', function (v, b) {
        var ok = v === m.value;
        row.mark(m.value, b);
        if (!ok) { failed = true; fb(wrongText(v, m.value) + esc(m.why) + ' <span class="lost-note">This run will not count.</span>', 'bad'); }
        else if (boxOk) fb('Right. ' + esc(m.text), 'good');
        carryOn(pic, m);
      });
      holder.appendChild(row);
      cur.keys = keyPicker(row);
    }
    function carryOn(pic, m) {
      Object.assign(regs, m.set);
      var box = pic.boxes[m.to];
      if (box && m.value != null) { box.querySelector('.rv').textContent = m.value; box.classList.add('flash'); }
      k++;
      actions.innerHTML = '';
      var b = btn(k >= list.length ? 'See how you did' : 'Next move', 'btn next-btn', step);
      actions.appendChild(b);
      b.focus({ preventScroll: true });
      cur.keys = null;
    }
    function finish() {
      var extra = score(!failed);
      holder.innerHTML = '';
      cur.keys = null;
      holder.appendChild(picture(c0, regs, {}));
      fb((failed ? 'The run had a mistake, so it does not count. Try another run: you will get it.' : 'Every move right! The ACC holds ' + esc(regs.ACC) + '.') + extra, failed ? 'bad' : 'good');
      showNext('Next run');
    }
    step();
  }

  // Number keys 1 to 6 pick an answer.
  function keyPicker(row) {
    return function (key) {
      var n = parseInt(key, 10);
      var bs = row.querySelectorAll('button');
      if (n >= 1 && n <= bs.length && !bs[n - 1].disabled) { bs[n - 1].click(); return true; }
      return false;
    };
  }
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.altKey || e.metaKey || e.defaultPrevented) return;
    if (e.key === 'Enter') {
      var t = e.target;
      if (t && t.tagName === 'BUTTON') return;
      var b = actions.querySelector('.next-btn');
      if (b) { e.preventDefault(); b.click(); }
      return;
    }
    if (cur && cur.keys && cur.keys(e.key)) e.preventDefault();
  });

  function reportHeight() {
    if (window.parent === window) return;
    try { window.parent.postMessage({ type: 'TT_CONTENT_HEIGHT', height: Math.ceil(main.getBoundingClientRect().height) + 16 }, '*'); } catch (e) {}
  }
  if (window.ResizeObserver) new ResizeObserver(reportHeight).observe(main);

  drawTabs(); drawStageHead(); drawHeader();
  nextQuestion();
  window.__fde = { state: function () { return state; }, cur: function () { return cur; }, go: goStage, next: nextQuestion };
})();
