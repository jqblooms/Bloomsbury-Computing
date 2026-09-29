// Transmission Lab, activity "wires": send one ASCII letter by serial (one wire, one bit per clock tick) or
// parallel (eight wires, all eight bits in one tick), down a short or a long cable. On the long cable the
// parallel wires are not all the same speed, so some bits reach the receiver after it has read the byte
// (skewing) and the letter arrives wrong. Five tasks walk the student through what that shows.
(function () {
  'use strict';
  var el = Lab.el, svgEl = Lab.svgEl, ICON = Lab.ICON;
  var root = document.getElementById('activity');
  var LETTERS = ['A', 'M', 'Z'];
  var TICK_MS = 380;
  var X0 = 96, X1 = 424;                     // where the wires leave the sender and reach the receiver
  var TRAVEL = { short: 2, long: 5 };        // clock ticks a bit spends on the wire
  var state = { method: 'serial', cable: 'short', letter: 'A', busy: false, runs: {}, last: null };

  function byteOf(ch) { var s = ch.charCodeAt(0).toString(2); while (s.length < 8) s = '0' + s; return s; }
  // Two or three wires run slow on the long cable. One of them always carries a 1, so the damage shows.
  function slowWires(bits) {
    var one = bits.indexOf('1', 1);
    var picks = [one, (one + 3) % 8, (one + 5) % 8];
    var out = {};
    picks.forEach(function (w, i) { out[w] = i === 0 ? 2 : 1; });
    return out;
  }

  root.innerHTML = '';
  root.appendChild(el('h1', { class: 'lab-title' }, 'Serial and parallel'));
  root.appendChild(el('p', { class: 'intro lab-title' }, 'Send a letter in ASCII from one computer to another. Choose the method and the cable, press Send, and watch the bits travel.'));
  var grid = el('div', { class: 'lab-grid' });
  var stage = el('div', { class: 'stage' });
  var svg = svgEl('svg', { viewBox: '0 0 520 250', role: 'img', 'aria-label': 'Sender and receiver joined by the cable' });
  stage.appendChild(svg);
  grid.appendChild(stage);

  var side = el('div', { class: 'controls' });
  function row(label, control) { var r = el('div', { class: 'control-row' }); r.appendChild(el('span', null, label)); r.appendChild(control); return r; }
  side.appendChild(row('Method', Lab.segmented([['serial', 'Serial'], ['parallel', 'Parallel']], state.method, function (v) { state.method = v; draw(); }, 'Method')));
  side.appendChild(row('Cable', Lab.segmented([['short', 'Short: 5 cm'], ['long', 'Long: 2 km']], state.cable, function (v) { state.cable = v; draw(); }, 'Cable')));
  side.appendChild(row('Letter', Lab.segmented(LETTERS.map(function (l) { return [l, l]; }), state.letter, function (v) { state.letter = v; draw(); }, 'Letter')));
  var sendBtn = el('button', { type: 'button', class: 'btn', id: 'send' }, ICON.send + '<span>Send</span>');
  sendBtn.addEventListener('click', send);
  var actions = el('div', { class: 'actions' });
  actions.appendChild(sendBtn);
  side.appendChild(actions);
  var readout = el('div', { class: 'readout', 'aria-live': 'polite' });
  side.appendChild(readout);
  grid.appendChild(side);
  root.appendChild(grid);
  var taskHost = el('div');
  root.appendChild(taskHost);

  function laneY(i) { return state.method === 'serial' ? 125 : 42 + i * 24; }

  // The sender, the receiver and the wires, with no bits on them.
  var bitLayer;
  function draw() {
    if (state.busy) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.appendChild(svgEl('rect', { class: 'device', x: 8, y: 30, width: 88, height: 190, rx: 10 }));
    svg.appendChild(svgEl('rect', { class: 'device', x: 424, y: 30, width: 88, height: 190, rx: 10 }));
    svg.appendChild(svgEl('text', { class: 'device-label', x: 52, y: 120 }, 'Sender'));
    svg.appendChild(svgEl('text', { class: 'device-label', x: 52, y: 140 }, state.letter + ' = ' + state.letter.charCodeAt(0)));
    svg.appendChild(svgEl('text', { class: 'device-label', x: 468, y: 130 }, 'Receiver'));
    var lanes = state.method === 'serial' ? 1 : 8;
    for (var i = 0; i < lanes; i++) {
      var y = laneY(i);
      svg.appendChild(svgEl('line', { class: 'wire', x1: X0, y1: y, x2: X1, y2: y }));
    }
    var label = (lanes === 1 ? '1 wire' : '8 wires') + ', ' + (state.cable === 'short' ? '5 cm' : '2 km');
    svg.appendChild(svgEl('text', { class: 'wire-label', x: 260, y: 20, 'text-anchor': 'middle' }, label));
    if (state.cable === 'long') {
      // Break marks: the cable is far longer than it can be drawn.
      [242, 252].forEach(function (x) { svg.appendChild(svgEl('line', { x1: x, y1: 28, x2: x + 12, y2: 224, stroke: 'var(--muted)', 'stroke-width': 2 })); });
    }
    bitLayer = svgEl('g');
    svg.appendChild(bitLayer);
    showReadout(null);
  }

  function showReadout(result) {
    var sent = byteOf(state.letter);
    var html = '<div class="readout-row"><span>Sent</span><span class="bits">' + sent.split('').map(function (b) { return '<i>' + b + '</i>'; }).join('') + '</span></div>';
    if (!result) {
      html += '<div class="readout-row"><span>Clock ticks to send all 8 bits</span><b>-</b></div><div class="readout-row"><span>Received</span><span class="small">Press Send</span></div>';
    } else {
      html += '<div class="readout-row"><span>Clock ticks to send all 8 bits</span><b>' + result.ticks + '</b></div>';
      html += '<div class="readout-row"><span>Received</span><span class="bits">' + result.got.map(function (b, i) {
        return '<i class="' + (b === null ? '' : b !== sent[i] ? 'wrong' : '') + '">' + (b === null ? '&middot;' : b) + '</i>';
      }).join('') + '</span></div>';
      if (result.done) {
        var got = result.got.join(''), ok = got === sent, ch = String.fromCharCode(parseInt(got, 2));
        html += '<div class="verdict ' + (ok ? 'good' : 'bad') + '">' + (ok ? 'Received ' + state.letter + ' correctly.'
          : 'Received ' + (/[A-Za-z0-9]/.test(ch) ? ch : 'a different byte') + ', not ' + state.letter + '. Some bits arrived late.') + '</div>';
      }
    }
    readout.innerHTML = html;
    Lab.reportHeight();
  }

  function send() {
    if (state.busy) return;
    draw();
    state.busy = true;
    lockControls(true);
    var bits = byteOf(state.letter), serial = state.method === 'serial', travel = TRAVEL[state.cable];
    var slow = !serial && state.cable === 'long' ? slowWires(bits) : {};
    var readAt = serial ? null : travel;     // parallel: the receiver reads all eight wires at once
    var plan = bits.split('').map(function (b, i) {
      var depart = serial ? i : 0;
      return { bit: b, lane: serial ? 0 : i, depart: depart, arrive: depart + travel + (slow[i] || 0), late: !!slow[i] };
    });
    var end = Math.max.apply(null, plan.map(function (p) { return p.arrive; })) + 0.4;
    var nodes = plan.map(function (p) {
      var g = svgEl('g', { class: 'bit ' + (p.bit === '1' ? 'one' : 'zero') + (p.late ? ' late' : ''), opacity: 0 });
      g.appendChild(svgEl('circle', { r: 10, cx: 0, cy: 0 }));
      g.appendChild(svgEl('text', { x: 0, y: 0 }, p.bit));
      bitLayer.appendChild(g);
      return g;
    });
    var got = [null, null, null, null, null, null, null, null];
    Lab.animate(end * TICK_MS, function (t) {
      var T = t * end;
      plan.forEach(function (p, i) {
        var f = Math.max(0, Math.min(1, (T - p.depart) / (p.arrive - p.depart)));
        var x = X0 + 12 + (X1 - X0 - 24) * f, y = laneY(p.lane);
        nodes[i].setAttribute('transform', 'translate(' + x + ',' + y + ')');
        nodes[i].setAttribute('opacity', T >= p.depart ? (f >= 1 && !serial ? 0.55 : 1) : 0);
        if (serial && T >= p.arrive) got[i] = p.bit;
      });
      if (!serial && T >= readAt) plan.forEach(function (p, i) { if (got[i] === null) got[i] = p.arrive <= readAt ? p.bit : '0'; });
      var ticks = serial ? Math.min(8, Math.floor(T) + 1) : 1;
      showReadout({ ticks: ticks, got: got, done: false });
    }, function () {
      var key = state.method + '-' + state.cable;
      var ok = got.join('') === bits;
      state.runs[key] = ok ? 'ok' : 'bad';
      state.last = key;
      showReadout({ ticks: serial ? 8 : 1, got: got, done: true });
      state.busy = false;
      lockControls(false);
    });
  }
  // Nothing can change while bits are on the wire.
  function lockControls(on) {
    sendBtn.disabled = on;
    Array.prototype.forEach.call(side.querySelectorAll('.seg button'), function (b) { b.disabled = on; });
  }

  function needs(key, words) { return function () { return state.runs[key] ? null : 'Send the letter ' + words + ' first, then answer.'; }; }
  Lab.taskCard(taskHost, [
    { q: 'Send the letter by serial down the short cable. How many clock ticks did it take to send all 8 bits?', kind: 'number', answer: 8,
      ready: needs('serial-short', 'by serial down the short cable'), retry: 'Watch the tick counter while the bits leave the sender.',
      why: 'Serial sends one bit per clock tick down a single wire, so 8 bits take 8 ticks.' },
    { q: 'Now send it by parallel down the short cable. How many clock ticks did it take?', kind: 'number', answer: 1,
      ready: needs('parallel-short', 'by parallel down the short cable'), retry: 'Count how many times the sender had to put bits on the wires.',
      why: 'Parallel sends all 8 bits at the same time, one down each of 8 wires, so it is faster.' },
    { q: 'Switch to the long cable and send by parallel. Was the letter received correctly?', kind: 'choice', options: ['Yes', 'No'], answer: 'No',
      ready: needs('parallel-long', 'by parallel down the long cable'), retry: 'Compare the Sent and Received rows bit by bit.',
      why: 'Over 2 km some wires are slower. Their bits arrive after the receiver has read the byte: the bits are skewed, so the data is wrong.' },
    { q: 'Now send it by serial down the long cable. Was the letter received correctly?', kind: 'choice', options: ['Yes', 'No'], answer: 'Yes',
      ready: needs('serial-long', 'by serial down the long cable'), retry: 'Compare the Sent and Received rows bit by bit.',
      why: 'The bits travel one after another down one wire, so they arrive in order. Slower, but reliable over a long distance.' },
    { q: 'Which method should be used for the 2 km cable?', kind: 'choice', options: ['Serial', 'Parallel'], answer: 'Serial',
      retry: 'Which one received the letter correctly over the long cable?',
      why: 'Serial: it is slower, but its bits cannot skew over a long distance. Parallel is only suitable over short distances.' }
  ]);

  draw();
})();
