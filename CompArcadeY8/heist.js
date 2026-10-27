// Bit Heist (?mode=heist): five vaults, each locked by a bit-string expression that gets harder from vault to vault
// (5 bits up to 8 bits; NOT, AND, OR, XOR, shifts, circulates, then whole contest-style expressions). Type the bits
// that open it. Two tries per vault: after a miss the lock only says how many bits are in the right place. A second
// miss, or the guard's clock running out, sets off an alarm. Three alarms and the heist is over.
(function () {
  'use strict';
  var el = CA.el, esc = CA.esc;
  var VAULTS = [
    { kinds: ['bits-logic', 'bits-shift'], level: 1, loot: 100 },
    { kinds: ['bits-shift', 'bits-logic'], level: 2, loot: 200 },
    { kinds: ['bits-chain', 'bits-shift'], level: [2, 3], loot: 300 },
    { kinds: ['bits-logic', 'bits-chain'], level: 3, loot: 400 },
    { kinds: ['bits-chain', 'bits-logic'], level: 4, loot: 500 }
  ];
  var ALARMS = 3, SECONDS = 90, PASS = 3;

  CA.modes.heist = function (host) {
    var log = CA.results('Bit Heist');
    var st = null, clock = null;
    var bar = el('div', { class: 'gbar' }), body = el('div');
    host.appendChild(bar); host.appendChild(body);

    function drawBar(msLeft) {
      if (!st) { bar.innerHTML = '<span class="pill">' + CA.ICON.lock + ' Bit Heist</span>'; return; }
      var v = '';
      VAULTS.forEach(function (x, i) {
        var s = st.result[i];
        v += '<span class="vault' + (s === 'won' ? ' won' : s === 'lost' ? ' lost' : i === st.at ? ' now' : '') + '">' + (s === 'won' ? CA.ICON.unlock : CA.ICON.lock) + (i + 1) + '</span>';
      });
      bar.innerHTML = '<span class="vaults">' + v + '</span><span class="spacer"></span>' + CA.chip('Loot', st.loot) +
        '<span class="chip"><span class="lbl">Alarms</span>' + CA.lives(ALARMS - st.alarms, ALARMS) + '</span>' +
        (msLeft != null ? '<span class="chip' + (msLeft < 20000 ? ' low' : '') + '">' + CA.ICON.clock + '<b>' + CA.mmss(msLeft) + '</b></span>' : '');
    }
    function tokens(text) {
      return text.replace(/\(/g, '( ').replace(/\)/g, ' )').split(/\s+/).filter(Boolean).map(function (t) {
        var cls = /^[01]+$/.test(t) ? 'bits' : /^[()]$/.test(t) ? 'br' : 'op';
        return '<span class="t ' + cls + '">' + esc(t) + '</span>';
      }).join('');
    }

    function intro() {
      st = null; drawBar();
      body.innerHTML = '<h2>Crack five vaults</h2><p>Each vault is locked by a bit-string expression. Work it out and type the bits to open it.</p>' +
        '<ul class="rules"><li>Two tries per vault. After a miss, the lock tells you how many bits are in the right place.</li><li>To pass: ' + PASS + ' vaults in a row, each on the first try.</li>' +
        '<li>A second miss, or the guard\'s ' + SECONDS + ' second clock running out, sets off an alarm. Three alarms and you are caught.</li>' +
        '<li>The vaults get harder and the loot gets bigger. Half loot on a second try.</li></ul>' +
        (CA.best('heist') ? '<p class="small">Best loot on this computer: <b>' + CA.best('heist') + '</b></p>' : '');
      var go = el('button', { type: 'button', class: 'btn big' }, CA.ICON.play + ' Start the heist');
      go.addEventListener('click', start);
      var row = el('div', { class: 'actions' }); row.appendChild(go); body.appendChild(row);
      CA.reportHeight();
    }
    function start() { st = { at: 0, loot: 0, alarms: 0, result: [], cracked: 0 }; vault(); }

    function vault() {
      if (st.at >= VAULTS.length || st.alarms >= ALARMS) { finish(); return; }
      var V = VAULTS[st.at], level = Array.isArray(V.level) ? Y8Gen.pick(V.level) : V.level;
      var q = Y8Gen.question(Y8Gen.pick(V.kinds), level), L = q.answer.length, tries = 0, busy = false;
      body.innerHTML = '';
      var wrap = el('div'), main = el('div'), side = el('div');
      wrap.appendChild(main); wrap.appendChild(side); body.appendChild(wrap);
      main.appendChild(el('div', {}, '<span class="tag">Vault ' + (st.at + 1) + ' of ' + VAULTS.length + '</span><span class="tag">' + L + ' bits</span><span class="tag">Loot ' + V.loot + '</span>'));
      main.appendChild(el('p', { class: 'ask' }, 'The lock opens for the value of this expression.'));
      var lock = el('div', { class: 'lock' }, CA.ICON.lock.replace('<svg', '<svg class="lock-icon"') + tokens(q.show));
      main.appendChild(lock);
      var dial = el('div', { class: 'dial', 'aria-hidden': 'true' });
      main.appendChild(dial);
      var row = el('div', { class: 'actions' });
      var input = el('input', { class: 'answer-in', autocomplete: 'off', spellcheck: 'false', inputmode: 'numeric', 'aria-label': 'The ' + L + ' bits that open the vault', placeholder: 'Type ' + L + ' bits' });
      var go = el('button', { type: 'button', class: 'btn' }, 'Crack it');
      row.appendChild(input); row.appendChild(go); main.appendChild(row);
      var fb = el('div', { class: 'feedback' }), why = el('div');
      main.appendChild(fb); side.appendChild(why);
      // After the try, how it works goes beside the lock, and the typing row makes way.
      function settle() { wrap.className = 'after'; row.style.display = 'none'; }
      function drawDial() {
        var v = input.value.replace(/[^01]/g, ''), h = '';
        for (var i = 0; i < L; i++) h += '<span class="' + (v[i] != null ? 'on' : '') + '">' + (v[i] != null ? v[i] : '') + '</span>';
        dial.innerHTML = h;
      }
      drawDial();
      input.addEventListener('input', drawDial);
      clock = CA.countdown(SECONDS * 1000, function (ms) { drawBar(ms); }, function () { fail(true); });
      function check() {
        if (busy) return;
        var v = input.value.replace(/\s+/g, '');
        if (!/^[01]+$/.test(v)) { CA.say(fb, 'Type only 0s and 1s.', 'hint'); return; }
        if (v.length !== L) { CA.say(fb, 'This lock needs exactly ' + L + ' bits. You typed ' + v.length + '.', 'hint'); return; }
        tries++;
        if (q.check(v)) { win(v); return; }
        log.add('vault ' + (st.at + 1) + ' ' + q.show + ': typed ' + v + (tries === 1 ? ' (first try)' : ''), false);
        if (tries === 1) {
          var same = 0;
          for (var i = 0; i < L; i++) if (v[i] === q.answer[i]) same++;
          lock.classList.remove('alarm'); void lock.offsetWidth; lock.classList.add('alarm');
          CA.say(fb, 'Click. ' + same + ' of ' + L + ' bits are in the right place. One more try.', 'hint');
          input.select();
          return;
        }
        fail(false);
      }
      function win(v) {
        busy = true; clock.stop(); input.disabled = true; go.disabled = true;
        var pts = tries === 1 ? V.loot : V.loot / 2;
        st.loot += pts; st.cracked++; st.result[st.at] = 'won';
        log.add('vault ' + (st.at + 1) + ' ' + q.show + ': typed ' + v + (tries === 1 ? '' : ' (second try)'), true);
        // James 2026-10-27: passed only with PASS vaults in a row, each cracked on the first try.
        st.run = tries === 1 ? (st.run || 0) + 1 : 0; st.bestRun = Math.max(st.bestRun || 0, st.run);
        if (st.run >= PASS) log.finish();
        lock.classList.add('open');
        lock.querySelector('.lock-icon').outerHTML = CA.ICON.unlock.replace('<svg', '<svg class="lock-icon"');
        drawBar(); settle();
        CA.say(fb, 'Vault open. <span class="pop">+' + pts + '</span>' + (tries === 1 ? '' : ' It took a second try, so it does not count toward passing, and the count starts again.'), '');
        why.innerHTML = CA.whyBox(q);
        nextButton();
      }
      function fail(timeout) {
        if (busy) return;
        busy = true; clock.stop(); input.disabled = true; go.disabled = true;
        if (timeout) log.add('vault ' + (st.at + 1) + ' ' + q.show + ': out of time', false);
        st.alarms++; st.result[st.at] = 'lost'; st.run = 0;
        lock.classList.remove('alarm'); void lock.offsetWidth; lock.classList.add('alarm');
        drawBar(); settle();
        CA.say(fb, (timeout ? 'The guard is back. ' : '') + 'Alarm! The bits were <b>' + esc(q.answer) + '</b>.', 'bad');
        why.innerHTML = CA.whyBox(q);
        nextButton();
      }
      function nextButton() {
        st.at++;
        var last = st.at >= VAULTS.length || st.alarms >= ALARMS;
        var nx = el('button', { type: 'button', class: 'btn' }, CA.ICON.next + (last ? ' See the haul' : ' Next vault'));
        nx.addEventListener('click', vault);
        var r2 = el('div', { class: 'actions' }); r2.appendChild(nx); why.appendChild(r2);
        CA.focusSoon(nx);
        CA.reportHeight();
      }
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); check(); } });
      go.addEventListener('click', check);
      CA.focusSoon(input);
      CA.reportHeight();
    }

    function finish() {
      if (clock) clock.stop();
      var s = st, old = CA.best('heist', s.loot), caught = s.alarms >= ALARMS;
      log.note('Loot ' + s.loot + ', ' + s.cracked + ' of ' + VAULTS.length + ' vaults cracked' + (caught ? ', caught' : '') + '.');
      drawBar();
      body.innerHTML = '<h2>' + (caught ? 'Caught! Three alarms.' : 'Heist over') + '</h2><div class="big-score">' + s.loot + '</div>' +
        '<div class="summary-grid"><div><span class="small">Vaults cracked</span><b>' + s.cracked + ' of ' + VAULTS.length + '</b></div>' +
        '<div><span class="small">Alarms</span><b>' + s.alarms + ' of ' + ALARMS + '</b></div>' +
        '<div><span class="small">Best on this computer</span><b>' + Math.max(old, s.loot) + '</b></div></div>' +
        ((s.bestRun || 0) >= PASS ? CA.doneBanner(PASS + ' vaults in a row, each on the first try: heist passed.') : '<p class="small">To pass: crack ' + PASS + ' vaults in a row, each on the first try. A second try or an alarm starts the count again. New locks every heist.</p>');
      var again = el('button', { type: 'button', class: 'btn' }, CA.ICON.play + ' New heist');
      again.addEventListener('click', start);
      var row = el('div', { class: 'actions' }); row.appendChild(again); body.appendChild(row);
      CA.reportHeight();
    }

    intro();
  };
})();
