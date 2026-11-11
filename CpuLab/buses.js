// Which Bus, Which Way? (?activity=buses): the address, data and control buses (syllabus 0478 3.1). The CPU sits on
// the left, memory and a keyboard on the right, and the three buses run between them. Each round is a set of small
// events; the student says which bus carries each thing (and, from level 2, which way), then checks once. Any wrong
// pick and the round does not count; NEED clean rounds in a row move up a level.
// Levels, with the help fading a step each time:
//   1 Which bus?            rules for every bus, direction arrows on the buses, the clue word marked in each question
//   2 Which bus, which way? rules for what each bus carries only; no arrows; a hint on request
//   3 Trace a read and a write: for each bus, what it carries and which way; no rules; a hint on request
//   4 Trace with no help    no rules, no hint, no Walk me through it, no bus names on the picture
// After a check, every row shows its answer with the reason, and Show me lights that bus on the picture.
// ?level=n starts at level n; ?upto=n finishes the activity (for the slide) when level n is cleared.
// Wording follows the real mark schemes: data bus carries data and instructions (0478/11 November 2022 Q2(a)), the
// address bus carries addresses (0478/13 November 2021 Q5), the control bus carries control signals from the CU to
// components and from devices to the CU (0478/12 March 2021 Q8(b)(ii)).
(function () {
  'use strict';
  var el = Lab.el, pick = Lab.pick, shuffle = Lab.shuffle, rnd = Lab.rnd;
  var NEED = 2;
  var BUSES = ['Address bus', 'Data bus', 'Control bus'];
  var KEY = { 'Address bus': 'addr', 'Data bus': 'data', 'Control bus': 'ctrl' };
  var OUT = 'Out of the CPU', IN = 'Into the CPU';
  function low(d) { return d.charAt(0).toLowerCase() + d.slice(1); }
  var CARRIES = {
    'Address bus': 'The <b>address bus</b> carries an <b>address</b>: the place in memory to read or write.',
    'Data bus': 'The <b>data bus</b> carries <b>data and instructions</b>: the value itself.',
    'Control bus': 'The <b>control bus</b> carries <b>control signals</b>, such as read and write.'
  };
  var WAYS = {
    'Address bus': 'Only the CPU chooses an address, so the address bus goes <b>one way</b>: from the CPU towards memory, never back.',
    'Data bus': 'Data comes <b>into</b> the CPU when it reads, and goes <b>out</b> when it writes, so the data bus goes both ways.',
    'Control bus': 'The CU sends signals <b>out</b> (read, write); devices send signals <b>in</b> (a key was pressed). So the control bus goes both ways.'
  };
  var LEVELS = [
    { name: 'Which bus?', help: 'Lots of help', how: 'Each bus carries one kind of thing. Ask: is it a <b>place</b> in memory (an address), a <b>value</b> or instruction (data), or a <b>command</b> or signal (control)?' },
    { name: 'Which bus, which way?', help: 'Some help', how: 'Now also say which way it goes. Ask: does it start in the CPU and go out, or start in memory or a device and come in?' },
    { name: 'Trace a read and a write', help: 'A little help', how: 'A read and a write, each using all three buses. For each bus, pick what it carries and which way it goes. Look at the memory to find the values.' },
    { name: 'Trace on your own', help: 'No help', how: 'The same as level 3, with no rules, no hint and no walk through. You can do it.' }
  ];

  // ---------------------------------------------------------------- the model (pure, so it can be tested)
  // Memory: four addresses, each holding a number, and one holding an instruction.
  function memory() {
    var start = rnd(3, 6), rows = [];
    var vals = shuffle([12, 17, 23, 25, 31, 38, 42, 45, 50, 56]).slice(0, 4);
    for (var i = 0; i < 4; i++) rows.push({ a: start + i, v: vals[i] });
    return rows;
  }
  // One small event: { ctx, q, clue, bus, dir, show: { bus, value, dir } }.
  function events(mem) {
    var r = pick(mem), w = pick(mem.filter(function (m) { return m !== r; }));
    var wv = pick([9, 14, 28, 33, 47, 60].filter(function (n) { return mem.every(function (m) { return m.v !== n && m.a !== n; }); }));
    var E = [
      { k: 'r-addr', ctx: 'The CPU wants the value stored at address ' + r.a + '.', q: 'Which bus carries the ' + r.a + '?', clue: 'address ' + r.a, bus: 'Address bus', dir: OUT, value: String(r.a) },
      { k: 'r-data', ctx: 'The CPU reads address ' + r.a + '. Memory holds ' + r.v + ' there.', q: 'Which bus carries the ' + r.v + '?', clue: 'holds ' + r.v, bus: 'Data bus', dir: IN, value: String(r.v) },
      { k: 'r-ctrl', ctx: 'The CPU reads address ' + r.a + '.', q: 'Which bus carries the read signal?', clue: 'signal', bus: 'Control bus', dir: OUT, value: 'Read' },
      { k: 'w-addr', ctx: 'The CPU stores ' + wv + ' at address ' + w.a + '.', q: 'Which bus carries the ' + w.a + '?', clue: 'address ' + w.a, bus: 'Address bus', dir: OUT, value: String(w.a) },
      { k: 'w-data', ctx: 'The CPU stores ' + wv + ' at address ' + w.a + '.', q: 'Which bus carries the ' + wv + '?', clue: 'stores ' + wv, bus: 'Data bus', dir: OUT, value: String(wv) },
      { k: 'w-ctrl', ctx: 'The CPU stores ' + wv + ' at address ' + w.a + '.', q: 'Which bus carries the write signal?', clue: 'signal', bus: 'Control bus', dir: OUT, value: 'Write' },
      { k: 'i-data', ctx: 'Memory sends the instruction ADD ' + r.a + ' to the CPU.', q: 'Which bus carries ADD ' + r.a + '?', clue: 'instruction', bus: 'Data bus', dir: IN, value: 'ADD ' + r.a },
      { k: 'k-ctrl', ctx: 'A key is pressed. The keyboard tells the CU.', q: 'Which bus carries this signal?', clue: 'signal', bus: 'Control bus', dir: IN, value: 'Key pressed' }
    ];
    return E;
  }
  // Four events with all three buses, no two of the same kind; level 2 has at least one coming into the CPU and at
  // least one going out on the data bus, so no single direction works for every row.
  function eventRound(level, mem) {
    for (var tries = 0; tries < 200; tries++) {
      var set = shuffle(events(mem)).slice(0, 4);
      var buses = {};
      set.forEach(function (e) { buses[e.bus] = 1; });
      if (Object.keys(buses).length < 3) continue;
      if (level === 1 && !(set.some(function (e) { return e.dir === IN; }) && set.some(function (e) { return e.dir === OUT && e.bus === 'Data bus'; }))) continue;
      return set;
    }
    return events(mem).slice(0, 4);
  }
  // A read and a write (random order). Each job has three rows, one per bus: what it carries and which way.
  function traceRound(mem) {
    var r = pick(mem), w = pick(mem.filter(function (m) { return m !== r; }));
    var wv = pick([9, 14, 28, 33, 47, 60].filter(function (n) { return mem.every(function (m) { return m.v !== n && m.a !== n; }); }));
    var other = pick(mem.filter(function (m) { return m !== r && m !== w; }));
    var read = { title: 'Read: the CPU wants the value stored at address ' + r.a + '.', kind: 'read', target: r.a,
      options: shuffle([String(r.a), String(r.v), String(other.v), 'Read', 'Write']),
      rows: [{ bus: 'Address bus', value: String(r.a), dir: OUT }, { bus: 'Data bus', value: String(r.v), dir: IN }, { bus: 'Control bus', value: 'Read', dir: OUT }] };
    var write = { title: 'Write: the CPU stores ' + wv + ' at address ' + w.a + '.', kind: 'write', target: w.a,
      options: shuffle([String(w.a), String(wv), String(w.v), 'Read', 'Write']),
      rows: [{ bus: 'Address bus', value: String(w.a), dir: OUT }, { bus: 'Data bus', value: String(wv), dir: OUT }, { bus: 'Control bus', value: 'Write', dir: OUT }] };
    return Math.random() < 0.5 ? [read, write] : [write, read];
  }
  // Marks a round. picks: events -> [{ bus, dir }]; trace -> [[{ value, dir }, x3], x2]. Returns the wrong rows.
  function grade(R, picks) {
    var wrong = [];
    if (R.kind === 'events') R.items.forEach(function (e, i) {
      var p = picks[i] || {};
      if (p.bus !== e.bus || (R.level >= 1 && p.dir !== e.dir)) wrong.push(i);
    });
    else R.jobs.forEach(function (j, ji) { j.rows.forEach(function (row, ri) {
      var p = (picks[ji] || [])[ri] || {};
      if (p.value !== row.value || p.dir !== row.dir) wrong.push(ji + ':' + ri);
    }); });
    return wrong;
  }
  function complete(R, picks) {
    if (R.kind === 'events') return R.items.every(function (e, i) { var p = picks[i] || {}; return p.bus && (R.level < 1 || p.dir); });
    return R.jobs.every(function (j, ji) { return j.rows.every(function (row, ri) { var p = (picks[ji] || [])[ri] || {}; return p.value && p.dir; }); });
  }
  function make(level) {
    var mem = memory();
    if (level <= 1) return { kind: 'events', level: level, mem: mem, items: eventRound(level, mem) };
    return { kind: 'trace', level: level, mem: mem, jobs: traceRound(mem) };
  }
  window.BusLabModel = { memory: memory, events: events, eventRound: eventRound, traceRound: traceRound, grade: grade, complete: complete, make: make, OUT: OUT, IN: IN, BUSES: BUSES };

  // ---------------------------------------------------------------- the picture
  // CPU on the left, memory (and the keyboard) on the right, three buses between. lit: { bus, value, dir }.
  function picture(R, opts) {
    opts = opts || {};
    var lanes = BUSES.map(function (b) {
      var on = opts.lit && opts.lit.bus === b;
      var arrow = opts.arrows ? (b === 'Address bus' ? '&rarr;' : '&harr;') : '';
      var chip = on ? '<span class="bus-chip ' + (opts.lit.dir === IN ? 'in' : 'out') + '">' + (opts.lit.dir === IN ? '&larr; ' : '') + opts.lit.value + (opts.lit.dir === OUT ? ' &rarr;' : '') + '</span>' : '';
      return '<div class="bus-lane ' + KEY[b] + (on ? ' lit' : '') + '"><span class="bus-name">' + (opts.names === false ? '' : b + (arrow ? ' <span class="bus-arrow" title="' + (b === 'Address bus' ? 'one way: out of the CPU' : 'both ways') + '">' + arrow + '</span>' : '')) + '</span><span class="bus-wire">' + chip + '</span></div>';
    }).join('');
    var target = opts.target;
    var mem = '<table class="mem bus-mem"><tr><th>Address</th><th>Holds</th></tr>' + R.mem.map(function (m) {
      return '<tr' + (target === m.a ? ' class="hit"' : '') + '><td class="addr">' + m.a + '</td><td class="val dat">' + m.v + '</td></tr>';
    }).join('') + '</table>';
    return '<div class="bus-pic"><div class="bus-cpu"><b>CPU</b><span class="small">with the CU</span></div><div class="bus-lanes">' + lanes + '</div>' +
      '<div class="bus-right"><div class="bus-box"><b>Memory</b>' + mem + '</div><div class="bus-box bus-kbd"><b>Keyboard</b></div></div></div>';
  }

  // ---------------------------------------------------------------- the activity
  var params = new URLSearchParams(location.search);
  var host = document.getElementById('activity');
  var lv = Math.max(0, Math.min(LEVELS.length - 1, (parseInt(params.get('level'), 10) || 1) - 1));
  var upto = Math.max(lv + 1, Math.min(LEVELS.length, parseInt(params.get('upto'), 10) || LEVELS.length));
  var log = Lab.results('cpu-lab-buses-' + (lv + 1) + '-' + upto, 'CPU Lab: Which Bus, Which Way? (levels ' + (lv + 1) + ' to ' + upto + ')');
  var have = 0, R = null, picks = null, checked = false, lit = null, hintOn = false, walked = false, shownHow = {};

  function newRound() {
    R = make(lv);
    picks = R.kind === 'events' ? [] : [[], []];
    checked = false; lit = null; hintOn = false; walked = false;
    draw();
    if (!shownHow[lv]) { shownHow[lv] = true; howItWorks(); }
  }
  function seg(label, options, chosen, onPick, disabled) {
    var g = el('div', { class: 'seg', role: 'group', 'aria-label': label });
    options.forEach(function (o) {
      var b = el('button', { type: 'button', 'aria-pressed': String(chosen === o) }, o === OUT ? 'Out of the CPU &rarr;' : o === IN ? '&larr; Into the CPU' : o);
      b.disabled = disabled;
      b.addEventListener('click', function () { onPick(o); draw(); });
      g.appendChild(b);
    });
    return g;
  }
  function markClue(e) {
    var i = e.q.indexOf(e.clue) >= 0 ? -1 : e.ctx.indexOf(e.clue);
    var ctx = i >= 0 ? e.ctx.slice(0, i) + '<span class="clue">' + e.clue + '</span>' + e.ctx.slice(i + e.clue.length) : e.ctx;
    var q = e.q.indexOf(e.clue) >= 0 ? e.q.replace(e.clue, '<span class="clue">' + e.clue + '</span>') : e.q;
    return ctx + ' <b>' + q + '</b>';
  }
  function draw(msg, cls) {
    host.innerHTML = '';
    host.appendChild(el('h1', { class: 'lab-title' }, 'Which Bus, Which Way?'));
    if (log.isDone()) host.appendChild(el('div', { class: 'done-banner' }, 'Finished: you can say which bus carries each thing, and which way. Keep going for practice.'));
    var bar = Lab.bar('Level ' + (lv + 1) + ' of ' + LEVELS.length + ': ' + LEVELS[lv].name, have, NEED);
    bar.querySelector('.level').insertAdjacentHTML('beforeend', ' <span class="help-tag h' + lv + '">' + LEVELS[lv].help + '</span>');
    host.appendChild(bar);
    if (lv === 0) host.appendChild(el('div', { class: 'rule' }, BUSES.map(function (b) { return CARRIES[b]; }).join('<br>') + '<br><span class="small">The arrows on the picture show which way each bus can go.</span>'));
    if (lv === 1) host.appendChild(el('div', { class: 'rule' }, BUSES.map(function (b) { return CARRIES[b]; }).join('<br>')));
    host.appendChild(el('div', {}, picture(R, { arrows: lv === 0, names: lv < 3, lit: lit, target: lit && lit.target })));
    host.appendChild(el('p', { class: 'task-q' }, R.kind === 'events'
      ? (lv === 0 ? 'Which bus carries each thing? Pick a bus for every row, then check. One check only.' : 'Pick the bus and the way it goes for every row, then check. One check only.')
      : 'For each bus, pick what it carries and which way it goes. Fill every row, then check. One check only.'));
    if (hintOn) host.appendChild(el('div', { class: 'rule hint-box' }, lv === 1
      ? 'Hint: who chooses an address, the CPU or memory? Where does the value start, and where does it end up? Who sends the signal, the CU or a device?'
      : 'Hint: for each bus ask: is it a place, a value, or a command? Then ask where it starts: in the CPU, or in memory.'));
    if (R.kind === 'events') drawEvents(); else drawTrace();
    var act = el('div', { class: 'actions' });
    if (!checked) act.appendChild(Lab.button('Check', '', check));
    else act.appendChild(Lab.button('Next round', '', newRound));
    if ((lv === 1 || lv === 2) && !checked && !hintOn) act.appendChild(Lab.button('Show a hint', 'secondary', function () { hintOn = true; log.note('Used the hint at level ' + (lv + 1) + '.'); draw(); }));
    if (lv < 3) act.appendChild(Lab.button('Walk me through it', 'secondary', walkMe));
    act.appendChild(Lab.button('How it works', 'secondary', function () { howItWorks(); }));
    host.appendChild(act);
    host.appendChild(el('div', { class: 'feedback ' + (cls || ''), role: 'status' }, msg || ''));
    Lab.reportHeight();
  }
  function showBtn(show) {
    return Lab.button('Show me', 'secondary small-btn', function () { lit = show; draw(lastMsg[0], lastMsg[1]); });
  }
  var lastMsg = ['', ''];
  function drawEvents() {
    var list = el('div', { class: 'cards' });
    var wrong = checked ? grade(R, picks) : [];
    R.items.forEach(function (e, i) {
      var p = picks[i] || (picks[i] = {});
      var card = el('div', { class: 'card bus-card' + (checked ? (wrong.indexOf(i) >= 0 ? ' bad' : ' good') : '') });
      card.appendChild(el('span', {}, R.level === 0 ? markClue(e) : e.ctx + ' <b>' + e.q + '</b>'));
      var picksBox = el('div', { class: 'bus-picks' });
      picksBox.appendChild(seg('Bus for row ' + (i + 1), BUSES, p.bus, function (o) { p.bus = o; }, checked));
      if (R.level >= 1) picksBox.appendChild(seg('Way for row ' + (i + 1), [OUT, IN], p.dir, function (o) { p.dir = o; }, checked));
      card.appendChild(picksBox);
      if (checked) {
        var why = el('div', { class: 'why' }, (wrong.indexOf(i) >= 0 ? 'It is the <b>' + e.bus + '</b>' + (R.level >= 1 ? ', ' + low(e.dir) : '') + '. ' : 'Right. ') + CARRIES[e.bus] + (R.level >= 1 ? ' ' + WAYS[e.bus] : ''));
        why.appendChild(document.createTextNode(' '));
        why.appendChild(showBtn({ bus: e.bus, value: e.value, dir: e.dir }));
        card.appendChild(why);
      }
      list.appendChild(card);
    });
    host.appendChild(list);
  }
  function drawTrace() {
    var wrong = checked ? grade(R, picks) : [];
    var wrap = el('div', { class: 'trace-jobs' });
    R.jobs.forEach(function (j, ji) {
      var box = el('div', { class: 'trace-job' });
      box.appendChild(el('h2', {}, j.title));
      j.rows.forEach(function (row, ri) {
        var p = picks[ji][ri] || (picks[ji][ri] = {});
        var bad = wrong.indexOf(ji + ':' + ri) >= 0;
        var line = el('div', { class: 'card trace-row' + (checked ? (bad ? ' bad' : ' good') : '') });
        line.appendChild(el('span', { class: 'trace-bus' }, row.bus + ' carries'));
        var pb = el('div', { class: 'bus-picks' });
        pb.appendChild(seg(row.bus + ': what it carries', j.options, p.value, function (o) { p.value = o; }, checked));
        pb.appendChild(seg(row.bus + ': which way', [OUT, IN], p.dir, function (o) { p.dir = o; }, checked));
        line.appendChild(pb);
        if (checked) {
          var why = el('div', { class: 'why' }, (bad ? 'It carries <b>' + row.value + '</b>, ' + low(row.dir) + '. ' : 'Right. ') +
            (row.bus === 'Address bus' ? 'The address ' + row.value + ' goes out to memory: only the CPU chooses it.' :
              row.bus === 'Control bus' ? 'The CU sends the ' + row.value.toLowerCase() + ' signal out, so memory knows to ' + (row.value === 'Read' ? 'send its value back' : 'store what arrives') + '.' :
              j.kind === 'read' ? row.value + ' is what memory holds at address ' + j.target + '. It comes back into the CPU.' : row.value + ' is the value being stored. It goes out of the CPU to memory. The old value at address ' + j.target + ' is replaced.'));
          why.appendChild(document.createTextNode(' '));
          why.appendChild(showBtn({ bus: row.bus, value: row.value, dir: row.dir, target: j.target }));
          line.appendChild(why);
        }
        box.appendChild(line);
      });
      wrap.appendChild(box);
    });
    host.appendChild(wrap);
  }
  function check() {
    if (checked) return;
    if (!complete(R, picks)) { lastMsg = ['Fill in every row first.', 'hint']; draw(lastMsg[0], lastMsg[1]); return; }
    var wrong = grade(R, picks);
    var ok = !wrong.length;
    checked = true;
    var what = R.kind === 'events'
      ? R.items.map(function (e, i) { return wrong.indexOf(i) >= 0 ? '"' + e.q + '" is ' + e.bus + (R.level ? ' ' + low(e.dir) : '') + ', not ' + picks[i].bus + (R.level ? ' ' + low(String(picks[i].dir)) : '') : null; }).filter(Boolean)
      : wrong.map(function (k) { var a = k.split(':'), j = R.jobs[a[0]], row = j.rows[a[1]], p = picks[a[0]][a[1]]; return j.kind + ' ' + row.bus + ' is ' + row.value + ' ' + low(row.dir) + ', not ' + p.value + ' ' + low(p.dir); });
    log.add(LEVELS[R.level].name + ': ' + (ok ? 'all right' : what.join('; ')) + (hintOn ? ', used the hint' : '') + (walked ? ', used Walk me through it' : ''), ok);
    var up = false, fin = false;
    if (ok) {
      have++;
      if (have >= NEED) {
        have = 0;
        if (lv + 1 >= upto) { log.finish(); fin = true; }
        else { lv++; up = true; }
      }
      lastMsg = ['Right, with no mistakes.' + (up ? ' Level up: ' + LEVELS[lv].name + ' (' + LEVELS[lv].help.toLowerCase() + '). Press Next round.' : fin ? ' You have finished this activity. Go to the next slide, or keep practising.' : ' Press Next round.'), 'good'];
    } else {
      have = 0;
      lastMsg = ['Not this time: this round does not count. Read why for each red row and press Show me to see it on the buses. Then press Next round.', 'bad'];
    }
    draw(lastMsg[0], lastMsg[1]);
  }

  // ---------------------------------------------------------------- Walk me through it and How it works
  // Always a different round from the one on screen, worked one row at a time.
  function walkSteps() {
    var other = make(lv), out = [];
    if (other.kind === 'events') {
      out.push({ text: 'For each row, find what is moving. Is it a place in memory (an address), a value or an instruction (data), or a command or signal (control)?' + (lv >= 1 ? ' Then ask where it starts.' : ''), visual: '' });
      other.items.forEach(function (e) {
        out.push({ text: e.ctx + ' ' + e.q + ' ' + CARRIES[e.bus] + ' So it is the <span class="hl">' + e.bus + '</span>' + (lv >= 1 ? ', <span class="hl">' + low(e.dir) + '</span>. ' + WAYS[e.bus] : '.'), visual: picture(other, { arrows: lv === 0, lit: { bus: e.bus, value: e.value, dir: e.dir } }) });
      });
    } else {
      var j = other.jobs[0];
      out.push({ text: j.title + ' Every read or write uses all three buses.', visual: picture(other, { target: j.target }) });
      j.rows.forEach(function (row) {
        out.push({ text: (row.bus === 'Address bus' ? 'The address bus carries the place: <span class="hl">' + row.value + '</span>, out of the CPU.' :
          row.bus === 'Control bus' ? 'The control bus carries what to do: the <span class="hl">' + row.value.toLowerCase() + '</span> signal, out of the CPU.' :
          j.kind === 'read' ? 'The data bus carries the value memory holds there: <span class="hl">' + row.value + '</span>, into the CPU.' : 'The data bus carries the value being stored: <span class="hl">' + row.value + '</span>, out of the CPU.'),
          visual: picture(other, { lit: { bus: row.bus, value: row.value, dir: row.dir }, target: j.target }) });
      });
      out.push({ text: 'A ' + (j.kind === 'read' ? 'write' : 'read') + ' uses the same three buses. Only the data bus changes direction.', visual: '' });
    }
    return out;
  }
  function howItWorks() { Lab.walk('How it works: ' + LEVELS[lv].name, LEVELS[lv].help + '. ' + LEVELS[lv].how, lv < 3 ? walkSteps() : [{ text: LEVELS[lv].how, visual: '' }]); }
  function walkMe() {
    walked = true;
    Lab.walk('Walk me through it', 'A different round, the same way of thinking.', walkSteps(), function (seen, total) { log.note('Walk me through it (' + seen + ' of ' + total + ' steps).'); });
  }
  // For test harnesses: the round on screen and the level.
  window.BusLabState = function () { return { round: R, level: lv + 1, have: have, checked: checked, done: log.isDone() }; };
  newRound();
})();
