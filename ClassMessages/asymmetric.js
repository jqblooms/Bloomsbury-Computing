// Class Messages, 2.3 L2 Asymmetric Encryption. Each student's browser makes their own two keys: the public key
// (n, e) is published to the class list, the private key (n, d) is kept in this browser only and is never sent.
// The sender gets the receiver's public key, encrypts here, and sends only cipher text, in packets. The receiver
// puts the packets in order, then decrypts here with their private key.
(function () {
  'use strict';
  var el = CM.el, esc = CM.esc;
  var pubText = function (k) { return k.n + ',' + k.e; };
  var showPub = function (k) { return '(' + k.n + ', ' + k.e + ')'; };

  function keysFor(me) { return CM.store('bc-class-msg-keys-v1:' + me.id); }
  function saveKeys(me, keys) { return CM.store('bc-class-msg-keys-v1:' + me.id, keys); }

  // "Your keys": one line once this computer has keys that match the published public key.
  // onReady(keys or null) each time it is drawn.
  function keysLine(data, host, onReady, chipHost) {
    var me = data.me;
    function draw() {
      var keys = keysFor(me);
      var published = me.publicKey || '';
      host.innerHTML = '';
      if (chipHost) chipHost.innerHTML = '';
      if (keys && published === pubText(keys) && chipHost) {
        chipHost.innerHTML = '<span class="keychip" id="cm-my-keys">' + CM.ICON.key + '<span>Your private key <span class="mono">(' + keys.n + ', ' + keys.d + ')</span> is on this computer.</span></span>';
        onReady(keys);
      } else if (keys && published === pubText(keys)) {
        host.appendChild(el('div', { class: 'keybox keyline', id: 'cm-my-keys' }, CM.ICON.key +
          '<span><span class="pub">Your public key <span class="mono">' + showPub(keys) + '</span> is on the class list.</span> ' +
          '<span class="priv">Your private key <span class="mono">(' + keys.n + ', ' + keys.d + ')</span> stays on this computer. It is never sent.</span></span>'));
        onReady(keys);
      } else if (keys && !published) {
        host.appendChild(el('p', { class: 'small' }, 'Sending your public key to the class list...'));
        publish(keys);
      } else {
        var lost = !!published;
        var box = el('div', { class: 'keybox keyline' + (lost ? ' warn' : '') }, CM.ICON.key + (lost
          ? '<span id="cm-keys-lost">Your private key is not on this computer. Make new keys to read new messages. Messages sent to your old public key cannot be read by anyone.</span>'
          : '<span>Make your two keys. Your public key goes on the class list. Your private key stays on this computer.</span>'));
        var make = el('button', { type: 'button', class: 'btn', id: 'cm-make-keys' }, '<span>' + (lost ? 'Make new keys' : 'Make my keys') + '</span>');
        make.addEventListener('click', function () {
          make.disabled = true;
          var fresh = CM.makeKeys();
          saveKeys(me, fresh);
          publish(fresh);
        });
        box.appendChild(make);
        host.appendChild(box);
        onReady(null);
      }
      CM.reportHeight();
    }
    function publish(keys) {
      CM.request('publishKey', { publicKey: pubText(keys) }).then(function (res) {
        me.publicKey = res.publicKey;
        draw();
      }).catch(function (err) {
        host.appendChild(el('p', { class: 'notice bad' }, esc(err.message)));
        CM.reportHeight();
      });
    }
    draw();
  }

  function send(data) {
    var root = CM.root;
    root.insertAdjacentHTML('beforeend', CM.teacherNote());
    var keysHost = el('div');
    root.appendChild(keysHost);
    keysLine(data, keysHost, function () {});
    var compose = el('div', { class: 'cm-grid' });
    var sent = el('div');
    root.appendChild(compose);
    root.appendChild(sent);

    var left = el('div', { class: 'card' }, '<h2><span class="step">1</span>Write, encrypt and send</h2>');
    var toField = el('label', { class: 'field' }, '<span>To</span>');
    var toSelect = el('select', { id: 'cm-to' });
    CM.classmateOptions(toSelect, data.classes, { needKey: true });
    toField.appendChild(toSelect);
    var msgField = el('label', { class: 'field' }, '<span>Your message <b class="count" id="cm-count">0 of ' + CM.MAX_CHARS + '</b></span>');
    var input = el('input', { type: 'text', maxlength: String(CM.MAX_CHARS), autocomplete: 'off', spellcheck: 'false', id: 'cm-message' });
    msgField.appendChild(input);
    var encryptBtn = el('button', { type: 'button', class: 'btn', id: 'cm-encrypt' }, CM.ICON.lock + '<span>Encrypt with their public key</span>');
    left.appendChild(toField);
    left.appendChild(msgField);
    compose.appendChild(left);

    var right = el('div', { class: 'card' }, '<h2><span class="step">2</span>Your cipher text</h2>');
    var table = el('div', { class: 'field' }, '<p class="small" style="margin:0">Your cipher text appears here.</p>');
    var sendBtn = el('button', { type: 'button', class: 'btn', id: 'cm-send', disabled: 'disabled' }, CM.ICON.send + '<span>Send</span>');
    var status = el('div', { class: 'status', role: 'status' });
    var actionRow = left.appendChild(el('div', { class: 'row' }));
    actionRow.appendChild(encryptBtn);
    actionRow.appendChild(sendBtn);
    left.appendChild(status);
    right.appendChild(table);
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
    toSelect.addEventListener('change', invalidate);

    encryptBtn.addEventListener('click', function () {
      var plain = CM.clean(input.value);
      var mate = CM.findClassmate(data.classes, toSelect.value);
      if (!mate) { status.className = 'status hint'; status.textContent = 'Choose who it is for first.'; return; }
      if (!plain) { status.className = 'status hint'; status.textContent = 'Write a message first.'; return; }
      status.className = 'status'; status.textContent = 'Getting ' + mate.student.name + "'s public key...";
      encryptBtn.disabled = true;
      CM.request('getKey', { courseId: mate.courseId, toId: mate.student.id }).then(function (res) {
        encryptBtn.disabled = false;
        var pub = CM.parsePublicKey(res.publicKey);
        if (!pub) { status.className = 'status bad'; status.textContent = mate.student.name + ' has not made their keys yet.'; return; }
        status.className = 'status'; status.textContent = '';
        var cipher = CM.encryptAsym(plain, pub);
        var nums = cipher.split(' ');
        table.innerHTML = '<span>' + esc(mate.student.name) + "'s public key <span class=\"mono\">" + showPub(pub) + '</span></span>' +
          CM.pairs(plain.split(''), [], true) + '<div class="pairs-legend"><span>plain text</span><span class="c">cipher text</span></div>';
        var cells = table.querySelectorAll('.pair'), i = 0;
        (function next() {
          if (i >= cells.length) {
            encrypted = { plain: plain, cipher: cipher, pub: pub, mate: mate };
            sendBtn.disabled = false;
            CM.reportHeight();
            return;
          }
          cells[i].querySelector('i').textContent = nums[i];
          Array.prototype.forEach.call(cells, function (x, n) { x.classList.toggle('on', n === i); });
          i++;
          setTimeout(next, 90);
        })();
        CM.reportHeight();
      }).catch(function (err) { encryptBtn.disabled = false; status.className = 'status bad'; status.textContent = err.message; CM.reportHeight(); });
    });

    sendBtn.addEventListener('click', function () {
      if (!encrypted) return;
      var e = encrypted, mate = e.mate, name = esc(mate.student.name);
      var packets = CM.buildPackets(data.me.address, mate.student.address, e.cipher, null);
      sendBtn.disabled = true;
      status.className = 'status'; status.textContent = 'Sending...';
      CM.request('send', { courseId: mate.courseId, toId: mate.student.id, packets: packets, teacherCopy: e.plain }).then(function (res) {
        status.className = 'status'; status.textContent = '';
        compose.style.display = 'none';
        keysHost.style.display = 'none';
        CM.sentPanel(sent, res.packets || packets,
          '<p class="status good" style="margin:0">Sent to ' + name + ' at ' + esc(CM.bangkok(res.sentAt)) + '.</p>' +
          '<ul><li>To you, from the class list: ' + name + "'s public key <span class=\"mono\">" + showPub(e.pub) + '</span></li>' +
          '<li>From you to ' + name + ': ' + packets.length + ' packets of cipher text</li></ul>' +
          '<p class="stayed">Your private key stayed on this computer. ' + name + "'s private key never left their computer.</p>",
          function () { sent.innerHTML = ''; compose.style.display = ''; keysHost.style.display = ''; input.value = ''; invalidate(); input.focus(); });
      }).catch(function (err) {
        status.className = 'status bad'; status.textContent = err.message;
        sendBtn.disabled = false;
        CM.reportHeight();
      });
    });
  }

  function inbox(data) {
    var myKeys = null;
    CM.inboxView(data, {
      top: function (host, chip) { keysLine(data, host, function (keys) { myKeys = keys; }, chip); },
      decrypt: function (host, placed, cipher, m) {
        var card = el('div', { class: 'card', id: 'cm-decrypt' },
          '<div class="keybox"><span>Cipher text: <span class="mono">' + esc(cipher) + '</span></span>' +
          '<span>Encrypted with the public key <span class="mono">(' + esc(String(m.key).replace(',', ', ')) + ')</span></span></div>');
        host.appendChild(card);
        if (!myKeys || pubText(myKeys) !== m.key) {
          card.appendChild(el('p', { class: 'notice warn', id: 'cm-locked' }, myKeys
            ? 'This message was encrypted with your old public key. The private key that matches it is not on this computer, so no one can decrypt it.'
            : 'Your private key is not on this computer, so this message cannot be decrypted here.'));
          CM.reportHeight();
          return;
        }
        var btn = el('button', { type: 'button', class: 'btn', id: 'cm-decrypt-btn' }, CM.ICON.unlock + '<span>Decrypt with my private key</span>');
        card.appendChild(el('div', { class: 'row' })).appendChild(btn);
        var table = el('div');
        var fb = el('div', { class: 'status', role: 'status' });
        card.appendChild(table);
        card.appendChild(fb);
        btn.addEventListener('click', function () {
          btn.style.display = 'none';
          var nums = cipher.split(' ');
          var plain = nums.map(function (n) { return CM.decryptNumber(n, myKeys); });
          var kb = card.querySelector('.keybox');
          if (kb) kb.style.display = 'none';
          table.innerHTML = CM.pairs(nums, [], true) + '<div class="pairs-legend"><span>cipher text</span><span class="c">plain text</span></div>';
          var cells = table.querySelectorAll('.pair'), i = 0;
          (function next() {
            if (i >= cells.length) {
              fb.className = 'status good';
              fb.innerHTML = 'The message: <span class="plain-out" id="cm-plain-out">' + esc(plain.join('')) + '</span>';
              CM.reportHeight();
              return;
            }
            cells[i].querySelector('i').innerHTML = plain[i] === ' ' ? '&middot;' : esc(plain[i]);
            Array.prototype.forEach.call(cells, function (x, n) { x.classList.toggle('on', n === i); });
            i++;
            setTimeout(next, 160);
          })();
          CM.reportHeight();
        });
        CM.reportHeight();
      }
    });
  }

  CM.start({ send: send, inbox: inbox });
})();
