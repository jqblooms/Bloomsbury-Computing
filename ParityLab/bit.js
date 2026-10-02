// Parity Lab, activity "bit": one 7-bit byte plus a parity bit (sent first, on the left, as in the exam tables).
// The student picks odd or even parity and clicks the parity bit to set it, then sends the 8 bits down a cable
// with no interference, 1 bit of interference or 2 bits of interference. The lab shows what was sent and what
// arrived, with changed bits in red. It never counts the 1s or gives the verdict: the tasks ask the student to.
(function () {
  'use strict';
  var el = Lab.el, svgEl = Lab.svgEl, ICON = Lab.ICON;
  var root = document.getElementById('activity');
  var BYTES = ['1011000', '1110000', '0101101'];
  var X0 = 210, X1 = 330, BOLT = 270;          // the wire runs between the two devices; the bolt sits in the middle
  var state = { mode: 'even', data: BYTES[0], parity: 0, noise: 0, busy: false, last: null };

  var ones = function (s) { return s.split('').filter(function (b) { return b === '1'; }).length; };
  var sentBits = function () { return String(state.parity) + state.data; };
  // Which bits interference changes: 1 bit turns the first 0 after the parity bit into a 1; 2 bits also turn the
  // first 1 after the parity bit into a 0, so the number of 1s stays the same and the check cannot see it.
  function flips(sent, noise) {
    if (!noise) return [];
    var zero = sent.indexOf('0', 1), one = sent.indexOf('1', 1);
    return noise === 1 ? [zero] : [zero, one];
  }
  function receive(sent, noise) {
    var f = flips(sent, noise);
    return { bits: sent.split('').map(function (b, i) { return f.indexOf(i) >= 0 ? (b === '1' ? '0' : '1') : b; }).join(''), flipped: f };
  }

  root.innerHTML = '';
  root.appendChild(el('h1', { class: 'lab-title' }, 'Parity check'));
  root.appendChild(el('p', { class: 'intro lab-title' }, 'Add a parity bit to a byte, send it through interference, and check what arrives.'));
  var grid = el('div', { class: 'lab-grid stack' });
  var stage = el('div', { class: 'stage' });
  var svg = svgEl('svg', { viewBox: '0 40 540 130', role: 'img', 'aria-label': 'Sender and receiver joined by a cable' });
  stage.appendChild(svg);
  grid.appendChild(stage);

  var side = el('div', { class: 'controls' });
  function row(label, control) { var r = el('div', { class: 'control-row' }); r.appendChild(el('span', null, label)); r.appendChild(control); return r; }
  side.appendChild(row('Parity', Lab.segmented([['even', 'Even'], ['odd', 'Odd']], state.mode, function (v) { state.mode = v; draw(); }, 'Parity')));
  side.appendChild(row('Byte', Lab.segmented(BYTES.map(function (b) { return [b, b]; }), state.data, function (v) { state.data = v; draw(); }, 'Byte')));
  side.appendChild(row('Interference', Lab.segmented([[0, 'None'], [1, '1 bit'], [2, '2 bits']], state.noise, function (v) { state.noise = v; draw(); }, 'Interference')));
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

  // One row of 8 bit boxes at (x, y). Clicking the first box (the parity bit) toggles it while nothing is moving.
  function bitRow(bits, x, y, opts) {
    var g = svgEl('g');
    bits.split('').forEach(function (b, i) {
      var cell = svgEl('g', { class: 'bit ' + (b === '1' ? 'one' : 'zero') + ((opts.flipped || []).indexOf(i) >= 0 ? ' late' : '') });
      var cx = x + i * 22;
      cell.appendChild(svgEl('rect', { x: cx - 10, y: y - 12, width: 20, height: 24, rx: 4, fill: i === 0 ? 'rgba(138,180,248,.18)' : 'transparent', stroke: i === 0 ? 'var(--brand)' : 'var(--line-strong)', 'stroke-width': i === 0 ? 2 : 1 }));
      cell.appendChild(svgEl('text', { x: cx, y: y, 'text-anchor': 'middle', 'dominant-baseline': 'central', style: 'font:700 13px var(--font-mono);fill:' + ((opts.flipped || []).indexOf(i) >= 0 ? 'var(--bad)' : b === '1' ? 'var(--bit-1)' : 'var(--ink-soft)') }, b));
      if (i === 0 && opts.clickable) {
        cell.style.cursor = 'pointer';
        cell.setAttribute('tabindex', '0');
        cell.setAttribute('role', 'button');
        cell.setAttribute('aria-label', 'Parity bit, now ' + b + '. Press to change it.');
        var toggle = function () { if (state.busy) return; state.parity = state.parity ? 0 : 1; draw(); };
        cell.addEventListener('click', toggle);
        cell.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
      }
      g.appendChild(cell);
    });
    return g;
  }

  function frame(movingRow) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.appendChild(svgEl('rect', { class: 'device', x: 8, y: 50, width: 200, height: 110, rx: 10 }));
    svg.appendChild(svgEl('rect', { class: 'device', x: 332, y: 50, width: 200, height: 110, rx: 10 }));
    svg.appendChild(svgEl('text', { class: 'device-label', x: 108, y: 74 }, 'Sender: ' + (state.mode === 'even' ? 'even' : 'odd') + ' parity'));
    svg.appendChild(svgEl('text', { class: 'device-label', x: 432, y: 74 }, 'Receiver'));
    svg.appendChild(svgEl('line', { class: 'wire', x1: X0, y1: 105, x2: X1, y2: 105 }));
    svg.appendChild(svgEl('text', { class: 'wire-label', x: 22, y: 134 }, state.busy ? 'parity bit' : 'parity bit: click to change'));
    if (state.noise) {
      svg.appendChild(svgEl('path', { d: 'M' + (BOLT + 4) + ' 70 L' + (BOLT - 8) + ' 100 L' + (BOLT + 2) + ' 100 L' + (BOLT - 6) + ' 132 L' + (BOLT + 12) + ' 94 L' + (BOLT + 2) + ' 94 Z', fill: 'var(--warn)' }));
      svg.appendChild(svgEl('text', { class: 'wire-label', x: BOLT, y: 152, 'text-anchor': 'middle' }, 'interference'));
    }
    svg.appendChild(bitRow(sentBits(), 31, 105, { clickable: !state.busy }));
    if (movingRow) svg.appendChild(movingRow);
  }
  function draw() { if (!state.busy) { frame(null); showReadout(); } }

  function showReadout() {
    readout.innerHTML = '';
    var bitsHtml = function (bits, flipped) {
      return '<span class="bits">' + bits.split('').map(function (b, i) { return '<i' + ((flipped || []).indexOf(i) >= 0 ? ' class="wrong"' : '') + '>' + b + '</i>'; }).join('') + '</span>';
    };
    readout.appendChild(el('div', { class: 'readout-row' }, '<span>Sent</span>' + (state.last ? bitsHtml(state.last.sent) : '<b>nothing yet</b>')));
    readout.appendChild(el('div', { class: 'readout-row' }, '<span>Received</span>' + (state.last ? bitsHtml(state.last.received, state.last.flipped) : '<b>nothing yet</b>')));
    if (state.last) readout.appendChild(el('div', { class: 'small' }, state.last.flipped.length ? 'Red bits were changed by interference.' : 'No bits were changed.'));
    Lab.reportHeight();
  }

  function send() {
    if (state.busy) return;
    state.busy = true;
    sendBtn.disabled = true;
    var sent = sentBits(), got = receive(sent, state.noise);
    var x0 = 31, x1 = 355;   // the row slides from the sender's boxes to the receiver's
    Lab.animate(1600, function (t) {
      var x = x0 + (x1 - x0) * t, past = x + 77 >= BOLT;   // the middle of the row has passed the bolt
      frame(bitRow(past ? got.bits : sent, x, 105, { flipped: past ? got.flipped : [] }));
    }, function () {
      state.busy = false;
      sendBtn.disabled = false;
      state.last = { mode: state.mode, data: state.data, parity: state.parity, noise: state.noise, sent: sent, received: got.bits, flipped: got.flipped };
      frame(bitRow(got.bits, x1, 105, { flipped: got.flipped }));
      showReadout();
    });
  }

  // ---------------------------------------------------------------- the tasks
  var A = BYTES[0], B = BYTES[1];
  var sentWith = function (noise) { var l = state.last; return l && l.mode === 'even' && l.data === A && l.parity === 1 && l.noise === noise; };
  var arrived1 = ones(receive('1' + A, 1).bits);
  var tasks = [
    { q: 'Choose <b>Even</b> parity and byte <b>' + A + '</b>. Which parity bit makes the number of 1s even?', kind: 'choice', options: ['0', '1'], answer: '1',
      ready: function () { return state.mode === 'even' && state.data === A ? null : 'Set Even parity and byte ' + A + ' first.'; },
      retry: 'Count the 1s in ' + A + '. Is that number even? The parity bit must make the total even.',
      why: A + ' has three 1s. A parity bit of 1 makes four, an even number.' },
    { q: 'Now choose <b>Odd</b> parity and byte <b>' + B + '</b>. Which parity bit makes the number of 1s odd?', kind: 'choice', options: ['0', '1'], answer: '0',
      ready: function () { return state.mode === 'odd' && state.data === B ? null : 'Set Odd parity and byte ' + B + ' first.'; },
      retry: 'Count the 1s in ' + B + '. Is that number already odd?',
      why: B + ' already has three 1s, which is odd, so the parity bit is 0.' },
    { q: 'Set <b>Even</b> parity, byte <b>' + A + '</b> and the right parity bit. Choose <b>1 bit</b> of interference and press Send. How many 1s arrived?', kind: 'number', answer: arrived1,
      ready: function () { return sentWith(1) ? null : 'Send byte ' + A + ' with Even parity, parity bit 1 and 1 bit of interference first.'; },
      retry: 'Count every 1 that arrived at the receiver, including the parity bit.',
      why: arrived1 + ' ones arrived. The red bit changed from 0 to 1.' },
    { q: 'Even parity means the number of 1s must be even. Did the receiver find the error?', kind: 'choice', options: ['Yes', 'No'], answer: 'Yes',
      ready: function () { return sentWith(1) ? null : 'Send byte ' + A + ' with Even parity, parity bit 1 and 1 bit of interference first.'; },
      retry: 'Is the number of 1s that arrived even?',
      why: arrived1 + ' is odd, so the receiver knows a bit has changed.' },
    { q: 'Send the same byte again with <b>2 bits</b> of interference. Count the 1s that arrived. Did the even parity check find the error?', kind: 'choice', options: ['Yes', 'No'], answer: 'No',
      ready: function () { return sentWith(2) ? null : 'Send byte ' + A + ' with Even parity, parity bit 1 and 2 bits of interference first.'; },
      retry: 'Count the 1s that arrived. Is the number even?',
      why: 'One 0 became 1 and one 1 became 0. There are still four 1s, an even number, so the check passes.' },
    { q: 'Why can a parity check miss an error?', kind: 'choice',
      options: ['An even number of bits changed, so the count of 1s still matched', 'The parity bit is always sent before the seven data bits', 'Interference can only ever change a single bit in any byte'],
      answer: 'An even number of bits changed, so the count of 1s still matched',
      retry: 'Think about the last task. What happened to the number of 1s when two bits changed?',
      why: 'If an even number of bits change, the count of 1s stays even (or stays odd), so the check cannot see the error.' }
  ];
  draw();
  Lab.taskCard(taskHost, tasks);
})();
