// Class Messages, 2.3 L1 Symmetric Encryption: the letter shift. The sender encrypts with a key and sends the
// cipher text and the key, both in packets. The receiver puts the packets in order, then decrypts with the key.
(function () {
  'use strict';
  var el = CM.el, esc = CM.esc;

  function send(data) {
    var root = CM.root;
    root.insertAdjacentHTML('beforeend', CM.teacherNote());
    var compose = el('div', { class: 'cm-grid' });
    var sent = el('div');
    root.appendChild(compose);
    root.appendChild(sent);

    // 1. Write and encrypt
    var left = el('div', { class: 'card' }, '<h2><span class="step">1</span>Write and encrypt</h2>');
    var msgField = el('label', { class: 'field' }, '<span>Your message <b class="count" id="cm-count">0 of ' + CM.MAX_CHARS + '</b></span>');
    var input = el('input', { type: 'text', maxlength: String(CM.MAX_CHARS), autocomplete: 'off', spellcheck: 'false', id: 'cm-message' });
    msgField.appendChild(input);
    var keyRow = el('div', { class: 'row end' });
    var keyField = el('label', { class: 'field' }, '<span>Key</span>');
    var keySelect = el('select', { class: 'key', id: 'cm-key' });
    for (var k = 1; k <= 25; k++) keySelect.appendChild(el('option', { value: String(k) }, String(k)));
    keySelect.value = String(1 + Math.floor(Math.random() * 25));
    keyField.appendChild(keySelect);
    var encryptBtn = el('button', { type: 'button', class: 'btn', id: 'cm-encrypt' }, CM.ICON.lock + '<span>Encrypt</span>');
    keyRow.appendChild(keyField);
    keyRow.appendChild(encryptBtn);
    left.appendChild(msgField);
    left.appendChild(keyRow);
    compose.appendChild(left);

    // 2. Send
    var right = el('div', { class: 'card' }, '<h2><span class="step">2</span>Send it to someone in your class</h2>');
    var table = el('div', { class: 'field' }, '<p class="small" style="margin:0">Your cipher text appears here.</p>');
    var sendRow = el('div', { class: 'row end' });
    var toField = el('label', { class: 'field grow' }, '<span>To</span>');
    var toSelect = el('select', { id: 'cm-to' });
    CM.classmateOptions(toSelect, data.classes);
    toField.appendChild(toSelect);
    var sendBtn = el('button', { type: 'button', class: 'btn', id: 'cm-send', disabled: 'disabled' }, CM.ICON.send + '<span>Send</span>');
    sendRow.appendChild(toField);
    sendRow.appendChild(sendBtn);
    var status = el('div', { class: 'status', role: 'status' });
    right.appendChild(table);
    right.appendChild(sendRow);
    right.appendChild(status);
    compose.appendChild(right);

    var encrypted = null;
    function invalidate() {
      encrypted = null;
      table.innerHTML = '<p class="small" style="margin:0">Your cipher text appears here.</p>';
      sendBtn.disabled = true;
      root.querySelector('#cm-count').textContent = CM.clean(input.value).length + ' of ' + CM.MAX_CHARS;
      CM.reportHeight();
    }
    input.addEventListener('input', invalidate);
    keySelect.addEventListener('change', invalidate);
    toSelect.addEventListener('change', function () { sendBtn.disabled = !encrypted || !toSelect.value; });

    // Encrypt one letter at a time, so the student sees each one move.
    encryptBtn.addEventListener('click', function () {
      var plain = CM.clean(input.value);
      if (!plain) { status.className = 'status hint'; status.textContent = 'Write a message first.'; return; }
      var key = Number(keySelect.value);
      var cipher = CM.shift(plain, key);
      status.className = 'status'; status.textContent = '';
      table.innerHTML = '<span>Each letter moves forward ' + key + '</span>' + CM.pairs(plain.split(''), [], false) +
        '<div class="pairs-legend"><span>plain text</span><span class="c">cipher text</span></div>';
      var cells = table.querySelectorAll('.pair');
      var i = 0;
      (function next() {
        if (i >= cells.length) {
          encrypted = { plain: plain, key: key, cipher: cipher };
          sendBtn.disabled = !toSelect.value;
          CM.reportHeight();
          return;
        }
        var c = cipher.charAt(i);
        cells[i].querySelector('i').innerHTML = c === ' ' ? '&middot;' : esc(c);
        Array.prototype.forEach.call(cells, function (x, n) { x.classList.toggle('on', n === i); });
        i++;
        setTimeout(next, 90);
      })();
      CM.reportHeight();
    });

    sendBtn.addEventListener('click', function () {
      var mate = CM.findClassmate(data.classes, toSelect.value);
      if (!encrypted || !mate) return;
      var packets = CM.buildPackets(data.me.address, mate.student.address, encrypted.cipher, encrypted.key);
      sendBtn.disabled = true;
      status.className = 'status'; status.textContent = 'Sending...';
      CM.request('send', { courseId: mate.courseId, toId: mate.student.id, packets: packets, teacherCopy: encrypted.plain }).then(function (res) {
        status.className = 'status'; status.textContent = '';
        compose.style.display = 'none';
        CM.sentPanel(sent, res.packets || packets,
          '<p class="status good" style="margin:0">Sent to ' + esc(mate.student.name) + ' at ' + esc(CM.bangkok(res.sentAt)) + '. ' + packets.length + ' packets: the cipher text, and the key in the last one.</p>',
          function () { sent.innerHTML = ''; compose.style.display = ''; input.value = ''; invalidate(); input.focus(); });
      }).catch(function (err) {
        status.className = 'status bad'; status.textContent = err.message;
        sendBtn.disabled = false;
        CM.reportHeight();
      });
    });
  }

  function decrypt(host, placed, rebuilt) {
    var keyPacket = placed[placed.length - 1];
    var key = Number((/^Key: (\d+)$/.exec(String(keyPacket.payload)) || [])[1]);
    var cipher = CM.joinPayloads(placed.slice(0, -1));
    var card = el('div', { class: 'card', id: 'cm-decrypt' },
      '<div class="keybox"><span>Cipher text: <span class="mono">' + esc(cipher) + '</span></span><span>Key: <span class="mono">' + key + '</span> (it arrived in the last packet). Move each letter back ' + key + '.</span></div>');
    var row = el('div', { class: 'row' });
    var answer = el('input', { type: 'text', class: 'decrypt-input', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Plain text', id: 'cm-plain' });
    var check = el('button', { type: 'button', class: 'btn', id: 'cm-check-plain' }, 'Check');
    var show = el('button', { type: 'button', class: 'btn secondary', id: 'cm-show-me' }, 'Show me step by step');
    row.appendChild(answer); row.appendChild(check); row.appendChild(show);
    card.appendChild(row);
    var table = el('div');
    var fb = el('div', { class: 'status', role: 'status' });
    card.appendChild(table);
    card.appendChild(fb);
    host.appendChild(card);
    var plain = CM.shift(cipher, -key);
    function done() { fb.className = 'status good'; fb.innerHTML = 'The message: <span class="plain-out">' + esc(plain) + '</span>'; CM.reportHeight(); }
    check.addEventListener('click', function () {
      var given = CM.clean(answer.value);
      if (!given) { fb.className = 'status hint'; fb.textContent = 'Type the plain text first.'; return; }
      if (given === plain) { done(); return; }
      var wrong = 0;
      for (var i = 0; i < Math.max(given.length, plain.length); i++) if (given.charAt(i) !== plain.charAt(i)) wrong++;
      fb.className = 'status bad';
      fb.textContent = 'Not yet: ' + wrong + ' character' + (wrong === 1 ? ' is' : 's are') + ' different. Move each letter back ' + key + '. After A, carry on from Z.';
      CM.reportHeight();
    });
    answer.addEventListener('keydown', function (e) { if (e.key === 'Enter') check.click(); });
    show.addEventListener('click', function () {
      show.disabled = true;
      table.innerHTML = CM.pairs(cipher.split(''), [], false) + '<div class="pairs-legend"><span>cipher text</span><span class="c">plain text</span></div>';
      var cells = table.querySelectorAll('.pair'), i = 0;
      (function next() {
        if (i >= cells.length) { done(); return; }
        var c = plain.charAt(i);
        cells[i].querySelector('i').innerHTML = c === ' ' ? '&middot;' : esc(c);
        Array.prototype.forEach.call(cells, function (x, n) { x.classList.toggle('on', n === i); });
        i++;
        setTimeout(next, 260);
      })();
      CM.reportHeight();
    });
    CM.reportHeight();
  }

  function inbox(data) {
    CM.inboxView(data, { decrypt: decrypt });
  }

  CM.start({ send: send, inbox: inbox });
})();
