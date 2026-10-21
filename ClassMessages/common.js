// Class Messages shared pieces: element helpers, the bridge to the site (BC_CLASS_MSG_REQUEST), the two ciphers,
// the packets (built exactly as Messages.gs builds them), putting packets back in order, the "What travelled over
// the network" panel and the teacher's log. Timers only, never requestAnimationFrame: a lesson preloads the app in
// a hidden iframe.
var CM = (function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  var MODE = params.get('mode') === 'asymmetric' ? 'asymmetric' : 'symmetric';
  var VIEW = params.get('view') === 'inbox' ? 'inbox' : 'send';
  var MAX_CHARS = 24, SYM_PAYLOAD = 6, ASYM_PAYLOAD = 4;
  var root = document.getElementById('app');
  document.documentElement.classList.add('mode-' + MODE);

  function el(tag, attrs, html) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'class') node.className = attrs[k];
      else if (k.indexOf('on') === 0) node.addEventListener(k.slice(2), attrs[k]);
      else node.setAttribute(k, attrs[k]);
    });
    if (html != null) node.innerHTML = html;
    return node;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var ICON = {
    send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 20.5v-6l8-2.5-8-2.5v-6L22 12z"/></svg>',
    lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17 9h-1V7a4 4 0 1 0-8 0v2H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zm-7-2a2 2 0 1 1 4 0v2h-4zm7 13H7v-9h10z"/></svg>',
    unlock: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17 9h-7V7a2 2 0 1 1 4 0h2a4 4 0 1 0-8 0v2H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zm0 11H7v-9h10z"/></svg>',
    network: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M4 6h5v4H4zM15 14h5v4h-5zM9 8h3v8h3"/></svg>',
    eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z"/></svg>',
    key: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path fill="none" stroke="currentColor" stroke-width="2" d="M12 12h9M18 12v3M21 12v2"/></svg>'
  };

  function reportHeight() {
    if (window.parent === window) return;
    var main = document.querySelector('main');
    try { window.parent.postMessage({ type: 'TT_CONTENT_HEIGHT', height: Math.ceil(main.getBoundingClientRect().height) + 12 }, '*'); } catch (e) {}
  }
  if (window.ResizeObserver) new ResizeObserver(reportHeight).observe(document.querySelector('main'));
  window.addEventListener('load', reportHeight);

  // ---------------------------------------------------------------- the bridge to the site
  var pending = {}, seq = 0, session = { signedIn: null, isTeacher: false };
  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || d.type !== 'BC_CLASS_MSG_RESULT' || e.source !== window.parent || !pending[d.reqId]) return;
    var p = pending[d.reqId];
    delete pending[d.reqId];
    clearTimeout(p.timer);
    session.signedIn = !!d.signedIn;
    session.isTeacher = !!d.isTeacher;
    if (d.ok) p.resolve(d.result); else p.reject(new Error(d.error || 'Something went wrong.'));
  });
  function request(op, payload) {
    return new Promise(function (resolve, reject) {
      if (window.parent === window) { reject(new Error('Open this activity in the lesson to send and read messages.')); return; }
      var reqId = 'cm' + (++seq) + '-' + Date.now();
      pending[reqId] = { resolve: resolve, reject: reject, timer: setTimeout(function () {
        delete pending[reqId];
        reject(new Error('No answer from the site. Check you are signed in, then try again.'));
      }, 30000) };
      var body = Object.assign({ mode: MODE }, payload || {});
      try { window.parent.postMessage({ type: 'BC_CLASS_MSG_REQUEST', reqId: reqId, op: op, payload: body }, '*'); } catch (e) { reject(e); }
    });
  }

  // ---------------------------------------------------------------- text and the two ciphers
  function clean(text) {
    text = String(text || '').replace(/[^\x20-\x7e]/g, '').replace(/\s+/g, ' ').trim();
    return MODE === 'symmetric' ? text.toUpperCase() : text;
  }
  // What the student typed, checked before encrypting: {plain, error, note}. Only English letters, numbers,
  // spaces and punctuation can be sent (Thai or emoji are left out, and the student is told).
  function checkText(raw) {
    raw = String(raw || '');
    var plain = clean(raw);
    var dropped = /[^\x20-\x7e\s]/.test(raw);
    if (!plain) return { plain: '', error: dropped ? 'Use English letters, numbers and spaces only.' : 'Write a message first.' };
    if (plain.length > MAX_CHARS) return { plain: plain, error: 'A message is at most ' + MAX_CHARS + ' characters.' };
    return { plain: plain, note: dropped ? 'Some characters were left out. Use English letters, numbers and spaces only.' : '' };
  }
  function shift(text, k) {
    return text.replace(/[A-Z]/g, function (c) { return String.fromCharCode(((c.charCodeAt(0) - 65 + k) % 26 + 26) % 26 + 65); });
  }
  function modPow(base, exp, mod) {
    var r = 1;
    base = base % mod;
    while (exp > 0) { if (exp % 2 === 1) r = (r * base) % mod; base = (base * base) % mod; exp = Math.floor(exp / 2); }
    return r;
  }
  function gcd(a, b) { while (b) { var t = b; b = a % b; a = t; } return a; }
  function modInverse(a, m) {
    var m0 = m, x0 = 0, x1 = 1;
    while (a > 1) { var q = Math.floor(a / m); var t = m; m = a % m; a = t; t = x0; x0 = x1 - q * x0; x1 = t; }
    return x1 < 0 ? x1 + m0 : x1;
  }
  function isPrime(n) { for (var i = 2; i * i <= n; i++) if (n % i === 0) return false; return n > 1; }
  // Two keys that work together, made in this browser: the public key (n, e) and the private key (n, d).
  function makeKeys() {
    var primes = [];
    for (var i = 101; i < 320; i++) if (isPrime(i)) primes.push(i);
    for (var tries = 0; tries < 200; tries++) {
      var p = primes[Math.floor(Math.random() * primes.length)], q = primes[Math.floor(Math.random() * primes.length)];
      if (p === q) continue;
      var n = p * q, phi = (p - 1) * (q - 1);
      var choices = [17, 7, 11, 13, 19, 23, 29, 31, 37, 41];
      for (var j = 0; j < choices.length; j++) {
        var e = choices[j];
        if (gcd(e, phi) !== 1) continue;
        var d = modInverse(e, phi);
        if (d === e || d < 100) continue;
        return { n: n, e: e, d: d, made: new Date().toISOString() };
      }
    }
    throw new Error('Could not make keys. Try again.');
  }
  function parsePublicKey(text) {
    var m = /^\s*(\d{3,6})\s*,\s*(\d{1,3})\s*$/.exec(String(text || ''));
    return m ? { n: Number(m[1]), e: Number(m[2]) } : null;
  }
  function encryptAsym(text, key) { return text.split('').map(function (c) { return String(modPow(c.charCodeAt(0), key.e, key.n)); }).join(' '); }
  function decryptNumber(num, priv) { return String.fromCharCode(modPow(Number(num), priv.d, priv.n)); }

  // ---------------------------------------------------------------- packets (as Messages.gs builds them)
  function checksum(payload) { var s = 0; for (var i = 0; i < payload.length; i++) s += payload.charCodeAt(i); return s; }
  function buildPackets(from, to, cipherText, key) {
    var payloads = [];
    if (MODE === 'symmetric') {
      for (var i = 0; i < cipherText.length; i += SYM_PAYLOAD) payloads.push(cipherText.slice(i, i + SYM_PAYLOAD));
      payloads.push('Key: ' + key);
    } else {
      var nums = cipherText.split(' ');
      for (var j = 0; j < nums.length; j += ASYM_PAYLOAD) payloads.push(nums.slice(j, j + ASYM_PAYLOAD).join(' '));
    }
    return payloads.map(function (p, k) { return { number: k + 1, total: payloads.length, to: to, from: from, payload: p, checksum: checksum(p) }; });
  }
  function packetHtml(p, opts) {
    opts = opts || {};
    var ok = opts.checked ? (checksum(String(p.payload)) === Number(p.checksum) ? ' <span class="ok" title="Checksum matches">&#10003;</span>' : ' <span class="status bad">error</span>') : '';
    return '<div class="ph"><b>Packet number: ' + p.number + ' of ' + p.total + '</b><span class="hl"><span class="hk">Destination:</span> ' + esc(p.to) + '</span><span class="hl"><span class="hk">Originator:</span> ' + esc(p.from) + '</span></div>' +
      '<div class="pp">' + esc(p.payload).replace(/ /g, '&nbsp;') + '</div>' +
      '<div class="pt">Checksum: ' + p.checksum + ok + '</div>';
  }
  function packetEl(p, opts, tag) {
    var node = el(tag || 'div', { class: 'packet' + (opts && opts.arrive ? ' arrive' : ''), 'data-number': p.number }, packetHtml(p, opts));
    if (tag === 'button') node.type = 'button';
    return node;
  }
  var PACKET_KEY = '<div class="packet-key" aria-hidden="true"><span>Header</span><span>Payload</span><span>Trailer</span></div>';
  function networkTitle(text) {
    return '<div class="net-head"><h2>' + ICON.network + '<span>' + text + '</span></h2>' + PACKET_KEY + '</div>';
  }

  // The order packets "arrive" in: shuffled, but the same every time for one message, and never already in order.
  function arrivalOrder(packets, seedText) {
    var h = 2166136261;
    for (var i = 0; i < seedText.length; i++) { h ^= seedText.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    function rnd() { h = (Math.imul(h ^ (h >>> 15), 2246822507) + 0x9e3779b9) >>> 0; return h / 4294967296; }
    var list = packets.slice();
    for (var k = list.length - 1; k > 0; k--) { var j = Math.floor(rnd() * (k + 1)); var t = list[k]; list[k] = list[j]; list[j] = t; }
    if (list.length > 1 && list.every(function (p, n) { return p.number === n + 1; })) list.push(list.shift());
    return list;
  }
  function joinPayloads(list) {
    if (MODE === 'symmetric') return list.map(function (p) { return String(p.payload); }).join('');
    return list.map(function (p) { return String(p.payload); }).join(' ');
  }

  // Packets arrive one by one, out of order; the student taps them into order of packet number.
  // onRebuilt(list, inOrder, rebuiltText) after each check, and onRebuilt(null) on Start again.
  function reassemble(host, packets, seedText, onRebuilt) {
    var arrived = arrivalOrder(packets, seedText);
    var shown = [], placed = [], timers = [];
    host.innerHTML = '';
    var box = el('div', { class: 'network', id: 'cm-arrived' });
    var head = el('div', { class: 'net-head' }, '<h2>' + ICON.network + '<span>What travelled over the network: ' + packets.length + ' packets</span></h2>');
    var trayLane = el('div', { class: 'lane' }, '<span class="lab">Arrived</span>');
    var tray = el('div', { class: 'packets', id: 'cm-tray', 'aria-label': 'Packets that arrived' });
    trayLane.appendChild(tray);
    var slotsLane = el('div', { class: 'lane' }, '<span class="lab">In order</span>');
    var slots = el('div', { class: 'packets', id: 'cm-slots' });
    slotsLane.appendChild(slots);
    var actions = el('div', { class: 'row' });
    head.appendChild(actions);
    var checkBtn = el('button', { type: 'button', class: 'btn', id: 'cm-check-order', disabled: 'disabled' }, 'Check the order');
    var resetBtn = el('button', { type: 'button', class: 'btn secondary', id: 'cm-start-again' }, ICON.refresh + '<span>Start again</span>');
    var status = el('div', { class: 'status', role: 'status', id: 'cm-order-status' });
    actions.appendChild(checkBtn);
    actions.appendChild(resetBtn);
    var foot = el('div', { class: 'net-head' });
    foot.appendChild(status);
    foot.insertAdjacentHTML('beforeend', PACKET_KEY);
    [head, trayLane, slotsLane, foot].forEach(function (n) { box.appendChild(n); });
    host.appendChild(box);
    var locked = false;
    // Packets can only be put in order once the last one has arrived.
    function allArrived() { return shown.length === packets.length; }
    function draw() {
      tray.innerHTML = '';
      shown.forEach(function (p) {
        if (placed.indexOf(p) !== -1) return;
        var b = packetEl(p, { checked: true, arrive: !p.drawn }, 'button');
        p.drawn = true;
        b.setAttribute('aria-label', 'Packet ' + p.number + ' of ' + p.total);
        if (!allArrived()) { b.disabled = true; b.classList.add('waiting'); }
        b.addEventListener('click', function () { if (locked || !allArrived()) return; placed.push(p); clearStatus(); draw(); });
        tray.appendChild(b);
      });
      var allIn = shown.length === packets.length && placed.length === packets.length;
      slots.innerHTML = '';
      placed.forEach(function (p, i) {
        var b = packetEl(p, { checked: true }, 'button');
        b.setAttribute('aria-label', 'Packet ' + p.number + ' in place ' + (i + 1) + '. Tap to take it out.');
        b.addEventListener('click', function () { if (locked) return; placed.splice(i, 1); clearStatus(); draw(); });
        slots.appendChild(b);
      });
      if (!allIn) slots.appendChild(el('div', { class: 'slot' }, 'Place ' + (placed.length + 1)));
      checkBtn.disabled = locked || !allIn;
      reportHeight();
    }
    function clearStatus() {
      status.className = 'status lab';
      status.textContent = !allArrived() ? 'Packets are arriving. Wait for the last one.'
        : packets.length === 1 ? 'Only 1 packet arrived. Tap it, then press Check the order.'
        : 'They took different routes, so they arrived out of order. Tap them in order of packet number.';
    }
    clearStatus();
    arrived.forEach(function (p, i) {
      p = Object.assign({}, p);
      arrived[i] = p;
      timers.push(setTimeout(function () { shown.push(p); if (!placed.length) clearStatus(); draw(); }, 200 + i * 350));
    });
    checkBtn.addEventListener('click', function () {
      var inOrder = placed.every(function (p, i) { return p.number === i + 1; });
      var rebuilt = joinPayloads(placed);
      if (!inOrder) {
        status.className = 'status bad';
        status.innerHTML = 'Not in order yet. Rebuilt: <span class="mono">' + esc(rebuilt) + '</span>';
      } else {
        locked = true;
        timers.forEach(clearTimeout);
        // In order: the packets fold away into one line, to leave room for decrypting.
        // The title and the result share one row.
        box.innerHTML = '';
        var done = el('div', { class: 'net-head' }, '<h2>' + ICON.network + '<span>What travelled over the network: ' + packets.length + ' packets</span></h2>');
        done.appendChild(el('p', { class: 'status good', id: 'cm-order-status' }, 'In order: packets 1 to ' + packets.length + '.' + (MODE === 'symmetric' ? ' Payloads: ' +
          placed.map(function (p) { return '<span class="mono chip">' + esc(p.payload).replace(/ /g, '&nbsp;') + '</span>'; }).join(' ') : '')));
        box.appendChild(done);
        onRebuilt(placed.slice(), true, rebuilt);
        reportHeight();
        return;
      }
      draw();
      onRebuilt(placed.slice(), inOrder, rebuilt);
      reportHeight();
    });
    resetBtn.addEventListener('click', function () { placed = []; clearStatus(); onRebuilt(null, false, ''); draw(); });
    draw();
    return function stop() { timers.forEach(clearTimeout); };
  }

  // The inbox, shared by both lessons: a message picker, then the packets, then the mode's own decrypt step.
  // opts: { top(host) optional, decrypt(host, placed, rebuilt, message), autoOpen() optional: false stops the
  // newest message opening by itself }.
  function inboxView(data, opts) {
    var bar = el('div', { class: 'bar' });
    var chip = el('div', { class: 'note-chip' });
    var pickField = el('label', { class: 'field grow', 'aria-label': 'Your messages' });
    var pick = el('select', { id: 'cm-pick' }, '<option value="">Loading...</option>');
    pickField.appendChild(pick);
    var refresh = el('button', { type: 'button', class: 'btn secondary', id: 'cm-refresh' }, ICON.refresh + '<span>Check for messages</span>');
    bar.appendChild(pickField);
    bar.appendChild(refresh);
    bar.insertAdjacentHTML('beforeend', teacherNote());
    bar.appendChild(chip);
    root.appendChild(bar);
    if (opts.top) { var top = el('div'); root.appendChild(top); opts.top(top, chip); }
    var EMPTY = 'No messages yet. Ask the person next to you to send you one, then press Check for messages.';
    var area = el('div', { id: 'cm-open', class: 'open-area' }, '<p class="small" id="cm-open-hint" style="margin:0">Loading your messages...</p>');
    root.appendChild(area);
    var seenKey = 'bc-class-msg-seen-' + MODE + ':' + data.me.id;
    var openKey = 'bc-class-msg-open-' + MODE + ':' + data.me.id;
    var seen = store(seenKey) || {};
    var messages = [], current = null, stop = null, first = true;
    function drawPick() {
      pick.innerHTML = messages.length ? '<option value="">Choose a message (' + messages.length + ')</option>' : '<option value="">No messages yet</option>';
      messages.forEach(function (m) {
        var o = el('option', { value: m.id });
        o.textContent = 'From ' + m.fromName + ', ' + bangkok(m.sentAt) + (seen[m.id] ? '' : ' (new)');
        pick.appendChild(o);
      });
      pick.value = current || '';
    }
    function load() {
      request('inbox').then(function (res) {
        messages = res.inbox || [];
        drawPick();
        var hint = area.querySelector('#cm-open-hint');
        if (hint) hint.textContent = messages.length ? 'Choose a message. Its packets arrive out of order.' : EMPTY;
        if (first && !current) {
          first = false;
          var lastOpen = null;
          try { lastOpen = sessionStorage.getItem(openKey); } catch (e) {}
          var fresh = messages.filter(function (m) { return m.id === lastOpen; })[0] || messages.filter(function (m) { return !seen[m.id]; })[0];
          if (fresh && (!opts.autoOpen || opts.autoOpen())) open(fresh);
        }
        reportHeight();
      }).catch(function (err) {
        // Keep the list already shown; a failed check only says so.
        if (!messages.length) pick.innerHTML = '<option value="">' + esc(err.message) + '</option>';
        var hint = area.querySelector('#cm-open-hint');
        if (hint) hint.textContent = err.message;
        reportHeight();
      });
    }
    function open(m) {
      current = m.id;
      try { sessionStorage.setItem(openKey, m.id); } catch (e) {}
      seen[m.id] = true;
      store(seenKey, seen);
      drawPick();
      if (stop) stop();
      area.innerHTML = '';
      var packetsHost = el('div');
      var decryptHost = el('div');
      area.appendChild(packetsHost);
      area.appendChild(decryptHost);
      stop = reassemble(packetsHost, m.packets || [], m.id, function (placed, inOrder, rebuilt) {
        decryptHost.innerHTML = '';
        if (placed && inOrder) opts.decrypt(decryptHost, placed, rebuilt, m);
        reportHeight();
      });
      reportHeight();
    }
    pick.addEventListener('change', function () {
      var m = messages.filter(function (x) { return x.id === pick.value; })[0];
      if (m) open(m);
    });
    refresh.addEventListener('click', load);
    poll(load);
    load();
  }

  // After sending: what travelled, with the packets, replacing the form until "Send another message".
  function sentPanel(host, packets, lines, onAgain) {
    host.innerHTML = '';
    var box = el('div', { class: 'network', id: 'cm-network' }, networkTitle('What travelled over the network') + lines);
    var list = el('div', { class: 'packets' });
    packets.forEach(function (p) { list.appendChild(packetEl(p, {})); });
    box.appendChild(list);
    var foot = el('div', { class: 'row foot' });
    var again = el('button', { type: 'button', class: 'btn secondary', id: 'cm-again' }, ICON.send + '<span>Send another message</span>');
    again.addEventListener('click', onAgain);
    foot.appendChild(again);
    foot.appendChild(el('p', { class: 'safety' }, 'School safety copy: your teacher also gets your plain text, kept apart from these packets. It is not network traffic.'));
    box.appendChild(foot);
    host.appendChild(box);
    reportHeight();
  }

  // ---------------------------------------------------------------- small UI pieces
  function bangkok(iso) {
    try {
      return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
    } catch (e) { return String(iso || ''); }
  }
  function pairs(top, bottom, numeric) {
    return '<div class="pairs">' + top.map(function (t, i) {
      var sp = t === ' ';
      return '<span class="pair' + (numeric ? ' num' : '') + (sp ? ' space' : '') + '" data-i="' + i + '"><b>' + (sp ? '&middot;' : esc(t)) + '</b><i>' + (bottom[i] === ' ' ? '&middot;' : esc(bottom[i] == null ? '?' : bottom[i])) + '</i></span>';
    }).join('') + '</div>';
  }
  function teacherNote() {
    return '<p class="teacher-note" id="cm-teacher-note">' + ICON.eye + '<span>Your teacher can read all messages.</span></p>';
  }
  function message(text, tone) {
    root.innerHTML = '<h1 class="app-title">Class Messages</h1><p class="notice' + (tone ? ' ' + tone : '') + '">' + esc(text) + '</p>';
    reportHeight();
  }
  function classmateOptions(select, classes, opts) {
    opts = opts || {};
    select.innerHTML = '<option value="">Choose someone</option>';
    var many = classes.length > 1;
    classes.forEach(function (c) {
      var parent = select;
      if (many) { parent = el('optgroup', { label: c.name }); select.appendChild(parent); }
      c.students.forEach(function (s) {
        var o = el('option', { value: c.courseId + '|' + s.id });
        o.textContent = s.name + (opts.needKey && !s.hasKey ? ' (no keys yet)' : '');
        if (opts.needKey && !s.hasKey) o.disabled = true;
        parent.appendChild(o);
      });
    });
  }
  function findClassmate(classes, value) {
    var parts = String(value || '').split('|');
    var c = classes.filter(function (x) { return x.courseId === parts[0]; })[0];
    var s = c && c.students.filter(function (x) { return x.id === parts[1]; })[0];
    return s ? { courseId: c.courseId, student: s } : null;
  }
  // A half-written message, kept for this tab only: the lesson rebuilds the app each time its slide is shown, so
  // the clicker (PageDown, then PageUp) must not lose what a student was typing. Cleared once it is sent.
  function draft(me, value) {
    var key = 'bc-class-msg-draft-' + MODE + ':' + me.id;
    try {
      if (value === undefined) return JSON.parse(sessionStorage.getItem(key) || 'null');
      if (value === null) sessionStorage.removeItem(key); else sessionStorage.setItem(key, JSON.stringify(value));
    } catch (e) { return null; }
    return value;
  }
  function store(key, value) {
    try {
      if (value === undefined) return JSON.parse(localStorage.getItem(key) || 'null');
      if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { return null; }
    return value;
  }

  // Polls the inbox while the student is active (stops after 15 minutes with no taps).
  function poll(fn) {
    var last = Date.now();
    ['pointerdown', 'keydown'].forEach(function (t) { document.addEventListener(t, function () { last = Date.now(); }, true); });
    setInterval(function () { if (Date.now() - last < 15 * 60000 && !document.hidden) fn(); }, 20000);
  }

  // ---------------------------------------------------------------- the teacher's log
  function teacherLog() {
    root.innerHTML = '<h1 class="app-title">Class Messages</h1>';
    var card = el('div', { class: 'card' });
    var head = el('div', { class: 'net-head' }, '<h2>Teacher view: every message in this activity</h2>');
    var refresh = el('button', { type: 'button', class: 'btn secondary', id: 'cm-teacher-refresh' }, ICON.refresh + '<span>Refresh</span>');
    head.appendChild(refresh);
    card.appendChild(head);
    card.appendChild(el('p', { class: 'small', style: 'margin:0' }, 'Times are Bangkok time. Students see only their own messages. The full list is also in the Teacher dashboard, under Class messages.'));
    var body = el('div', { class: 'log-wrap' }, '<p class="small">Loading...</p>');
    card.appendChild(body);
    root.appendChild(card);
    function load() {
      request('teacherLog').then(function (data) {
        var list = (data.messages || []).filter(function (m) { return m.mode === MODE; });
        if (!list.length) { body.innerHTML = '<p class="small">No messages yet.</p>'; reportHeight(); return; }
        body.innerHTML = '<table class="log"><thead><tr><th>Time</th><th>Class</th><th>From</th><th>To</th><th>Plain text</th><th>Cipher text</th><th>' +
          (MODE === 'symmetric' ? 'Key' : 'Public key used') + '</th><th>What travelled</th></tr></thead><tbody>' +
          list.map(function (m) {
            return '<tr><td class="nowrap">' + esc(bangkok(m.sentAt)) + '</td><td>' + esc(m.courseName) + '</td><td>' + esc(m.fromName) + '</td><td>' + esc(m.toName) + '</td>' +
              '<td class="mono plain">' + esc(m.teacherCopy) + '</td><td class="mono">' + esc(m.cipherText) + '</td><td class="mono nowrap">' + esc(MODE === 'symmetric' ? m.key : '(' + m.key.replace(',', ', ') + ')') + '</td>' +
              '<td><details><summary>' + (m.packets || []).length + ' packets</summary><div class="packets">' +
              (m.packets || []).map(function (p) { return '<div class="packet">' + packetHtml(p, {}) + '</div>'; }).join('') + '</div></details></td></tr>';
          }).join('') + '</tbody></table>';
        reportHeight();
      }).catch(function (err) { body.innerHTML = '<p class="notice bad">' + esc(err.message) + '</p>'; reportHeight(); });
    }
    refresh.addEventListener('click', load);
    load();
    reportHeight();
  }

  // ---------------------------------------------------------------- start
  // views: { send(ctx), inbox(ctx) } from the mode's own file. ctx: {data} from the classmates request.
  function start(views) {
    if (window.parent === window) { message('Open this activity in the lesson to send and read messages.', 'warn'); return; }
    message('Loading your class...');
    request('classmates').then(function (data) {
      if (session.isTeacher) { teacherLog(); return; }
      var classes = (data.classes || []).filter(function (c) { return c.students && c.students.length; });
      if (!classes.length) { message('Your class list is not set up yet. Ask your teacher.', 'warn'); return; }
      data.classes = classes;
      root.innerHTML = '<h1 class="app-title">Class Messages</h1>';
      views[VIEW](data);
      reportHeight();
    }).catch(function (err) {
      if (session.signedIn === false) message('Sign in with your school account to send and read messages.', 'warn');
      else message(err.message, 'bad');
    });
  }

  return {
    MODE: MODE, VIEW: VIEW, MAX_CHARS: MAX_CHARS, root: root, el: el, esc: esc, ICON: ICON, reportHeight: reportHeight,
    request: request, clean: clean, checkText: checkText, shift: shift, makeKeys: makeKeys, parsePublicKey: parsePublicKey, encryptAsym: encryptAsym,
    decryptNumber: decryptNumber, buildPackets: buildPackets, packetEl: packetEl, packetHtml: packetHtml, PACKET_KEY: PACKET_KEY,
    reassemble: reassemble, inboxView: inboxView, sentPanel: sentPanel, joinPayloads: joinPayloads, arrivalOrder: arrivalOrder, bangkok: bangkok, pairs: pairs, teacherNote: teacherNote,
    classmateOptions: classmateOptions, findClassmate: findClassmate, store: store, draft: draft, poll: poll, start: start, session: session
  };
})();
