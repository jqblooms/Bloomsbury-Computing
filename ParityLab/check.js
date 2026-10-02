// Parity Lab, activity "check": the student is the receiver. Eight bytes arrive, each with its parity (odd or even)
// and a parity bit in front. For each one the student decides what the parity check says: OK or Error. Some bytes
// had 2 bits changed on the way; after the answer, those show that the byte was damaged even though the check said
// OK, which is why a parity check can miss an error. Feedback nudges and never names the right answer before the
// student has chosen.
(function () {
  'use strict';
  var el = Lab.el, ICON = Lab.ICON;
  var root = document.getElementById('activity');
  var ROUNDS = 8;
  var ones = function (s) { return s.split('').filter(function (b) { return b === '1'; }).length; };

  // A round: a correct 8-bit byte for its parity, then 0, 1 or 2 bits changed. The mix always includes each kind.
  function makeRound(changes) {
    var data = '';
    for (var i = 0; i < 7; i++) data += Math.random() < 0.5 ? '1' : '0';
    var mode = Math.random() < 0.5 ? 'even' : 'odd';
    var p = (ones(data) % 2 === 0) === (mode === 'even') ? '0' : '1';
    var sent = p + data, bits = sent.split(''), picks = [];
    while (picks.length < changes) { var k = Math.floor(Math.random() * 8); if (picks.indexOf(k) < 0) picks.push(k); }
    picks.forEach(function (k) { bits[k] = bits[k] === '1' ? '0' : '1'; });
    var got = bits.join('');
    var ok = (ones(got) % 2 === 0) === (mode === 'even');
    return { mode: mode, sent: sent, got: got, changed: picks, says: ok ? 'OK' : 'Error' };
  }
  var plan = [0, 1, 1, 2, 0, 1, 2, 1].sort(function () { return Math.random() - 0.5; });
  var rounds = plan.map(makeRound);
  var i = 0, right = 0;

  root.innerHTML = '';
  root.appendChild(el('h1', { class: 'lab-title' }, 'Check what arrived'));
  root.appendChild(el('p', { class: 'intro lab-title' }, 'You are the receiver. Count the 1s in each byte and decide what the parity check says.'));
  var host = el('div');
  root.appendChild(host);

  function bitsHtml(bits, changed) {
    return '<span class="bits big">' + bits.split('').map(function (b, k) { return '<i' + ((changed || []).indexOf(k) >= 0 ? ' class="wrong"' : '') + '>' + b + '</i>'; }).join('') + '</span>';
  }

  function render() {
    host.innerHTML = '';
    if (i >= rounds.length) {
      host.appendChild(el('div', { class: 'task' }, '<div class="done-banner">' + ICON.done + '<span>Done: ' + right + ' of ' + rounds.length + ' right first time.</span></div>'));
      var again = el('button', { type: 'button', class: 'btn secondary' }, ICON.reset + '<span>New bytes</span>');
      again.addEventListener('click', function () { rounds = plan.map(makeRound); i = 0; right = 0; render(); });
      host.firstChild.appendChild(again);
      Lab.reportHeight();
      return;
    }
    var r = rounds[i], tries = 0;
    var card = el('div', { class: 'task' });
    card.appendChild(el('div', { class: 'task-head' }, '<h2>Byte ' + (i + 1) + '</h2><span class="task-count">' + i + ' of ' + rounds.length + ' done</span>'));
    card.appendChild(el('p', { class: 'task-q' }, 'This byte arrived. The sender used <b>' + r.mode + '</b> parity. The first bit is the parity bit.'));
    card.appendChild(el('div', { class: 'arrived' }, bitsHtml(r.got)));
    card.appendChild(el('p', { class: 'task-q' }, 'What does the parity check say?'));
    var answer = el('div', { class: 'task-answer' });
    var fb = el('div', { class: 'feedback', role: 'status' });
    ['OK', 'Error'].forEach(function (choice) {
      var b = el('button', { type: 'button', class: 'choice' }, choice === 'OK' ? 'OK: no error found' : 'Error found');
      b.addEventListener('click', function () {
        if (choice !== r.says) {
          tries++;
          fb.className = 'feedback error';
          fb.textContent = 'Not yet. Count every 1, including the parity bit. Is the total ' + (r.mode === 'even' ? 'even' : 'odd') + '?';
          Lab.reportHeight();
          return;
        }
        if (!tries) right++;
        answer.querySelectorAll('button').forEach(function (x) { x.disabled = true; });
        var n = ones(r.got);
        var msg = n + ' ones: ' + (n % 2 === 0 ? 'even' : 'odd') + '. ' + (r.says === 'OK' ? 'That matches ' + r.mode + ' parity, so the check says OK.' : 'That does not match ' + r.mode + ' parity, so the check finds an error.');
        if (r.changed.length === 2) msg += ' But look: two bits were changed on the way (red below). The check missed them, because the number of 1s still matched.';
        else if (r.changed.length === 1) msg += ' One bit was changed on the way (red below).';
        else msg += ' Nothing was changed on the way.';
        fb.className = r.changed.length === 2 ? 'feedback hint' : 'feedback';
        fb.textContent = msg;
        card.appendChild(el('div', { class: 'readout' }, '<div class="readout-row"><span>Sent</span>' + bitsHtml(r.sent) + '</div><div class="readout-row"><span>Arrived</span>' + bitsHtml(r.got, r.changed) + '</div>'));
        var next = el('button', { type: 'button', class: 'btn secondary' }, '<span>' + (i === rounds.length - 1 ? 'Finish' : 'Next byte') + '</span>' + ICON.next);
        next.addEventListener('click', function () { i++; render(); });
        card.appendChild(next);
        next.focus();
        Lab.reportHeight();
      });
      answer.appendChild(b);
    });
    card.appendChild(answer);
    card.appendChild(fb);
    host.appendChild(card);
    Lab.reportHeight();
  }
  render();
})();
