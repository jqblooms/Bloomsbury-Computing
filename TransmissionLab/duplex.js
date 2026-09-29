// Transmission Lab, activity "duplex". Part 1: two devices joined by a link set to simplex, half-duplex or
// full-duplex; each device can send, or both at once, and the student sees data blocked, waiting its turn or
// passing at the same time. Part 2: choose the direction and the serial or parallel method for six scenarios.
(function () {
  'use strict';
  var el = Lab.el, svgEl = Lab.svgEl, ICON = Lab.ICON;
  var root = document.getElementById('activity');
  var TRIP_MS = 1500;
  var MODES = [['simplex', 'Simplex'], ['half', 'Half-duplex'], ['full', 'Full-duplex']];
  var state = { mode: 'simplex', busy: false, runs: {} };

  var part1 = el('div');
  var part2 = el('div', { hidden: 'hidden' });
  root.appendChild(part1);
  root.appendChild(part2);

  // ------------------------------------------------------------------ part 1: try each method
  part1.appendChild(el('h1', { class: 'lab-title' }, 'Simplex and duplex'));
  part1.appendChild(el('p', { class: 'intro lab-title' }, 'Choose how the link works, then send data from A, from B, or from both at once.'));
  var grid = el('div', { class: 'lab-grid' });
  var stage = el('div', { class: 'stage' });
  var svg = svgEl('svg', { viewBox: '0 0 520 200', role: 'img', 'aria-label': 'Device A and device B joined by a link' });
  stage.appendChild(svg);
  grid.appendChild(stage);
  var side = el('div', { class: 'controls' });
  var modeRow = el('div', { class: 'control-row' });
  modeRow.appendChild(el('span', null, 'Link'));
  modeRow.appendChild(Lab.segmented(MODES, state.mode, function (v) { state.mode = v; draw(); }, 'Link'));
  side.appendChild(modeRow);
  var actions = el('div', { class: 'actions' });
  var buttons = [['a', 'A sends'], ['b', 'B sends'], ['both', 'Both send at once']].map(function (b) {
    var btn = el('button', { type: 'button', class: 'btn' + (b[0] === 'both' ? '' : ' secondary') }, ICON.send + '<span>' + b[1] + '</span>');
    btn.addEventListener('click', function () { send(b[0]); });
    actions.appendChild(btn);
    return btn;
  });
  side.appendChild(actions);
  var readout = el('div', { class: 'readout', 'aria-live': 'polite' }, '<span class="small">Press a button to send.</span>');
  side.appendChild(readout);
  grid.appendChild(side);
  part1.appendChild(grid);
  var taskHost = el('div');
  part1.appendChild(taskHost);

  var LANE_AB = 82, LANE_BA = 128, LANE_ONE = 105;
  var layer;
  function draw() {
    if (state.busy) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.appendChild(svgEl('rect', { class: 'device', x: 8, y: 50, width: 90, height: 110, rx: 10 }));
    svg.appendChild(svgEl('rect', { class: 'device', x: 422, y: 50, width: 90, height: 110, rx: 10 }));
    svg.appendChild(svgEl('text', { class: 'device-label', x: 53, y: 110 }, 'Device A'));
    svg.appendChild(svgEl('text', { class: 'device-label', x: 467, y: 110 }, 'Device B'));
    var defs = svgEl('defs');
    ['a', 'b'].forEach(function (k) {
      var m = svgEl('marker', { id: 'arrow-' + k, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' });
      m.appendChild(svgEl('path', { d: 'M0 0L10 5L0 10z', fill: k === 'a' ? 'var(--lane-a)' : 'var(--lane-b)' }));
      defs.appendChild(m);
    });
    svg.appendChild(defs);
    if (state.mode === 'full') {
      svg.appendChild(svgEl('line', { class: 'wire', x1: 100, y1: LANE_AB, x2: 418, y2: LANE_AB, stroke: 'var(--lane-a)', 'marker-end': 'url(#arrow-a)' }));
      svg.appendChild(svgEl('line', { class: 'wire', x1: 418, y1: LANE_BA, x2: 100, y2: LANE_BA, stroke: 'var(--lane-b)', 'marker-end': 'url(#arrow-b)' }));
    } else {
      var attrs = { class: 'wire', x1: 100, y1: LANE_ONE, x2: 418, y2: LANE_ONE, 'marker-end': 'url(#arrow-a)' };
      if (state.mode === 'half') attrs['marker-start'] = 'url(#arrow-b)';
      svg.appendChild(svgEl('line', attrs));
    }
    var caption = { simplex: 'One direction only: A to B', half: 'Both directions, one at a time', full: 'Both directions at the same time' }[state.mode];
    svg.appendChild(svgEl('text', { class: 'wire-label', x: 260, y: 30, 'text-anchor': 'middle' }, caption));
    layer = svgEl('g');
    svg.appendChild(layer);
  }

  function message(from) {
    var g = svgEl('g', { class: 'msg ' + from, opacity: 0 });
    g.appendChild(svgEl('rect', { x: -34, y: -13, width: 68, height: 26 }));
    g.appendChild(svgEl('text', { x: 0, y: 0 }, from === 'a' ? 'From A' : 'From B'));
    layer.appendChild(g);
    return g;
  }
  function note(text, y, cls) { var t = svgEl('text', { class: cls || 'blocked', x: 260, y: y }, text); layer.appendChild(t); return t; }

  // Each trip: { from, start, lane }, in trip units (one trip = one time unit).
  function send(action) {
    if (state.busy) return;
    draw();
    var trips = [], blocked = null, waited = false;
    var wantA = action !== 'b', wantB = action !== 'a';
    if (state.mode === 'simplex') {
      if (wantA) trips.push({ from: 'a', start: 0, lane: LANE_ONE });
      if (wantB) blocked = 'Blocked: in simplex, B cannot send.';
    } else if (state.mode === 'half') {
      if (wantA) trips.push({ from: 'a', start: 0, lane: LANE_ONE });
      if (wantB) { trips.push({ from: 'b', start: wantA ? 1 : 0, lane: LANE_ONE }); waited = wantA; }
    } else {
      if (wantA) trips.push({ from: 'a', start: 0, lane: LANE_AB });
      if (wantB) trips.push({ from: 'b', start: 0, lane: LANE_BA });
    }
    var units = trips.reduce(function (m, t) { return Math.max(m, t.start + 1); }, 0);
    state.runs[state.mode + '-' + action] = { blocked: !!blocked, waited: waited, units: units };
    if (blocked) note(blocked, 185);
    var waitNote = waited ? note('B waits until the link is free', 185, 'waiting') : null;
    if (!trips.length) { report(blocked, waited, units); return; }
    state.busy = true;
    lock(true);
    readout.innerHTML = '<span class="small">Sending</span>';
    var nodes = trips.map(function (t) { return message(t.from); });
    Lab.animate(units * TRIP_MS, function (p) {
      var T = p * units;
      trips.forEach(function (t, i) {
        var f = Math.max(0, Math.min(1, T - t.start));
        var x = t.from === 'a' ? 140 + 240 * f : 380 - 240 * f;
        nodes[i].setAttribute('transform', 'translate(' + x + ',' + t.lane + ')');
        nodes[i].setAttribute('opacity', T >= t.start && f < 1 ? 1 : 0);
      });
      if (waitNote && T >= 1) waitNote.textContent = 'Now B can send';
    }, function () {
      state.busy = false;
      lock(false);
      report(blocked, waited, units);
    });
  }
  function report(blocked, waited, units) {
    var lines = [];
    if (blocked) lines.push('<div class="verdict bad">' + blocked + '</div>');
    if (waited) lines.push('<div class="verdict">B had to wait for A to finish.</div>');
    if (units) lines.push('<div class="readout-row"><span>Time taken</span><b>' + units + ' time unit' + (units > 1 ? 's' : '') + '</b></div>');
    readout.innerHTML = lines.join('');
    Lab.reportHeight();
  }
  function lock(on) {
    buttons.forEach(function (b) { b.disabled = on; });
    Array.prototype.forEach.call(side.querySelectorAll('.seg button'), function (b) { b.disabled = on; });
  }

  function tried(key, words) { return function () { return state.runs[key] ? null : words; }; }
  Lab.taskCard(taskHost, [
    { q: 'Choose Simplex and press B sends. What happens to B\'s data?', kind: 'choice',
      options: ['It is sent to A', 'It is blocked', 'It waits, then is sent'], answer: 'It is blocked',
      ready: tried('simplex-b', 'Choose Simplex and press B sends first.'), retry: 'Look at the message under the link.',
      why: 'Simplex sends data in one direction only. B can never send back to A.' },
    { q: 'Choose Half-duplex and press Both send at once. What happens?', kind: 'choice',
      options: ['Both travel at the same time', 'One side waits for the other', 'B\'s data is blocked'], answer: 'One side waits for the other',
      ready: tried('half-both', 'Choose Half-duplex and press Both send at once first.'), retry: 'Watch when B\'s data sets off.',
      why: 'Half-duplex sends both ways, but only one way at a time, so B waits for the link to be free.' },
    { q: 'Choose Full-duplex and press Both send at once. How many time units did it take?', kind: 'number', answer: 1,
      ready: tried('full-both', 'Choose Full-duplex and press Both send at once first.'), retry: 'Read the time taken in the box.',
      why: 'Full-duplex sends both ways at the same time, so both arrive in 1 time unit. Half-duplex took 2.' },
    { q: 'Which method lets both devices send at the same time?', kind: 'choice', options: ['Simplex', 'Half-duplex', 'Full-duplex'], answer: 'Full-duplex',
      retry: 'Which link had a separate lane for each direction?',
      why: 'Full-duplex: both directions at the same time.' }
  ], function () {
    var go = el('button', { type: 'button', class: 'btn' }, '<span>Part 2: choose a method</span>' + ICON.next);
    go.addEventListener('click', function () { part1.hidden = true; part2.hidden = false; Lab.reportHeight(); });
    var wrap = el('div', { class: 'actions' });
    wrap.style.marginTop = '8px';
    wrap.appendChild(go);
    taskHost.appendChild(wrap);
    Lab.reportHeight();
  });
  draw();

  // ------------------------------------------------------------------ part 2: choose a method
  var SCENARIOS = [
    { text: 'A weather sensor on a hill sends readings to a school computer 3 km away. Nothing is sent back.', dir: 'Simplex', wire: 'Serial' },
    { text: 'A video call between two classrooms in different countries. Both classes talk and listen at once.', dir: 'Full-duplex', wire: 'Serial' },
    { text: 'Security guards\' radios: hold the button to talk, let go to listen. The base is 1 km away.', dir: 'Half-duplex', wire: 'Serial' },
    { text: 'Inside a device, data is copied one way from one chip to another 2 cm away, as fast as possible.', dir: 'Simplex', wire: 'Parallel' },
    { text: 'A file server in another building sends and receives files with a computer at the same time.', dir: 'Full-duplex', wire: 'Serial' },
    { text: 'A corridor screen 50 m away is sent the day\'s timetable. It never sends anything back.', dir: 'Simplex', wire: 'Serial' }
  ];
  part2.appendChild(el('h1', null, 'Choose a method'));
  part2.appendChild(el('p', { class: 'intro' }, 'For each scenario, choose the direction and whether the data should be sent serial or parallel.'));
  part2.appendChild(el('div', { class: 'scenario-head' }, '<span>Scenario</span><span>Direction</span><span>Serial or parallel</span>'));
  var list = el('div', { class: 'scenarios' });
  SCENARIOS.forEach(function (s, i) {
    var rowEl = el('div', { class: 'scenario', id: 'scenario-' + i });
    rowEl.appendChild(el('span', null, s.text));
    var d = el('select', { id: 'dir-' + i, 'aria-label': 'Direction for scenario ' + (i + 1) }, '<option value="">Choose</option><option>Simplex</option><option>Half-duplex</option><option>Full-duplex</option>');
    var w = el('select', { id: 'wire-' + i, 'aria-label': 'Serial or parallel for scenario ' + (i + 1) }, '<option value="">Choose</option><option>Serial</option><option>Parallel</option>');
    rowEl.appendChild(d);
    rowEl.appendChild(w);
    list.appendChild(rowEl);
  });
  part2.appendChild(list);
  var checkRow = el('div', { class: 'actions' });
  var checkBtn = el('button', { type: 'button', class: 'btn' }, ICON.check + '<span>Check my choices</span>');
  var back = el('button', { type: 'button', class: 'btn secondary' }, '<span>Back to part 1</span>');
  back.addEventListener('click', function () { part2.hidden = true; part1.hidden = false; Lab.reportHeight(); });
  checkRow.appendChild(checkBtn);
  checkRow.appendChild(back);
  part2.appendChild(checkRow);
  var fb = el('div', { class: 'feedback', role: 'status' });
  part2.appendChild(fb);
  checkBtn.addEventListener('click', function () {
    var right = 0, missing = 0, firstWhy = null;
    SCENARIOS.forEach(function (s, i) {
      var d = document.getElementById('dir-' + i).value, w = document.getElementById('wire-' + i).value;
      var rowEl = document.getElementById('scenario-' + i);
      if (!d || !w) { missing++; rowEl.className = 'scenario'; return; }
      var ok = d === s.dir && w === s.wire;
      rowEl.className = 'scenario ' + (ok ? 'good' : 'bad');
      if (ok) right++;
      else if (!firstWhy) firstWhy = d !== s.dir ? 'Look again at the direction for scenario ' + (i + 1) + ': does anything travel back, and can both sides send at once?'
        : 'Look again at serial or parallel for scenario ' + (i + 1) + ': how far does the data travel?';
    });
    if (missing) { fb.className = 'feedback hint'; fb.textContent = 'Choose both answers for every scenario.'; }
    else if (right === SCENARIOS.length) { fb.className = 'feedback'; fb.textContent = right + '/' + SCENARIOS.length + '. Every method is right.'; }
    else { fb.className = 'feedback error'; fb.textContent = right + '/' + SCENARIOS.length + '. ' + firstWhy; }
    Lab.reportHeight();
  });
})();
