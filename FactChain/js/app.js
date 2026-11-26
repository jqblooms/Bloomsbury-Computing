// Fact Chain (James 2026-11-26): learn a chain of exam facts fast, then keep them. ?group=y10-3-1 or y8-term1b (start screen with
// the group's packs; &packs=a,b shows only those) or ?pack=<id>. Packs: FactChain/packs/<id>.js (PACK-FORMAT.md),
// loaded by script tag; a pack that fails to load or is incomplete is left out.
// Each pack is a short run of rounds, one question per screen: See it, Fill the gaps (fading A, B, C), Put it in
// order, From memory, Spot the mistake, Quick-fire (Practice Sets rule, MasterySets/js/scheduler.js). A mistake never
// completes a round: the round runs again. Mastered packs build the CPU picture and open the Lightning round.
// Marking: keyword match first (js/logic.js); a typed answer the keywords reject in From memory and Quick-fire goes
// to Haiku (op drillCheck, Drills/ai-check.js, 15 s). Lightning is keyword only.
// Progress: ops factLoad, factSave, factClass (shell FactChain.gs) through the Exam Game relay, with a copy in
// localStorage per student; the copy that is further on wins. Local test: ?examStub=1 (an answer containing "right"
// passes the Haiku check; &teacher=1 shows the class view).
(function () {
  'use strict';
  // Groups come from the registry FactChain/packs/index.js (shared with Data Bridge).
  var GROUPS = {};
  var INDEX = (window.FACT_CHAIN_INDEX && window.FACT_CHAIN_INDEX.groups) || {
    'y10-3-1': { title: 'Computer Architecture', packs: ['y10-cpu-parts', 'y10-buses-fde', 'y10-performance', 'y10-instruction-sets', 'y10-embedded', 'y10-control'] }
  };
  Object.keys(INDEX).forEach(function (g) { GROUPS[g] = { title: 'Fact Chain: ' + INDEX[g].title, packs: INDEX[g].packs.slice() }; });
  var R = window.FactRounds;
  var ROUND_NAMES = { see: 'See it', gap0: 'Fill the gaps: A', gap1: 'Fill the gaps: B', gap2: 'Fill the gaps: C', order: 'Put it in order', recall: 'From memory', spot: 'Spot the mistake', quick: 'Quick-fire' };
  var params = new URLSearchParams(location.search);
  var embed = params.get('embed') === '1';
  var stubTest = params.get('examStub') === '1';
  var stub = stubTest || window.parent === window;
  var version = window.FC_VERSION || '1';
  var L = window.FactChainLogic, S = window.MasteryScheduler, AI = window.DrillAiCheck, CPU = window.FactChainCpu;
  var app = document.getElementById('app');

  var onePack = params.get('pack') || '';
  var groupId = params.get('group') || '';
  if (!GROUPS[groupId]) {
    groupId = Object.keys(GROUPS).filter(function (g) { return GROUPS[g].packs.indexOf(onePack) >= 0; })[0] || 'y10-3-1';
  }
  var group = GROUPS[groupId];
  var wanted = onePack ? [onePack] : group.packs;
  if (!onePack && params.get('packs')) {
    var only = params.get('packs').split(',');
    wanted = group.packs.filter(function (id) { return only.indexOf(id) >= 0; });
  }

  var packs = [];            // loaded packs in group order
  var state = null, who = '', teacher = false;
  var saving = false, saveAgain = false;
  var cpu = null;            // the diagram on screen now
  // The CPU diagram and "Build your CPU" only for a group whose packs have a part (Year 8 packs have none).
  var hasCpu = function () { return packs.some(function (p) { return !!p.part; }); };
  var NO_CPU = { light: function () {}, add: function () {}, built: function () {}, stop: function () {},
    replay: function (c, done) { if (done) done(); }, trip: function (done) { if (done) done(); }, boot: function (done) { if (done) done(); } };
  function code(lines) { return R && lines ? R.codeHtml(lines) : ''; }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(id) { return document.getElementById(id); }
  function show(html, withCpu) {
    if (cpu) cpu.stop();
    cpu = null;
    app.innerHTML = html;
    var holder = app.querySelector('.fc-diagram');
    if (holder && hasCpu()) cpu = CPU.make(holder);
    else if (holder) { holder.remove(); Array.prototype.forEach.call(app.querySelectorAll('.fc-split'), function (el) { el.classList.add('is-single'); }); }
    postHeight();
    if (!embed) window.scrollTo(0, 0);
    var first = app.querySelector('input:not([readonly]), textarea:not([readonly])');
    if (first) try { first.focus({ preventScroll: true }); } catch (e) {}
    return cpu || NO_CPU;
  }
  function postHeight() {
    if (!embed || window.parent === window) return;
    try { window.parent.postMessage({ type: 'TT_CONTENT_HEIGHT', height: Math.ceil(document.documentElement.scrollHeight) + 16 }, '*'); } catch (e) {}
  }
  if (window.ResizeObserver) new ResizeObserver(postHeight).observe(document.body);
  // Enter presses the main button on screen (Shift + Enter makes a new line in a box).
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
    var t = e.target;
    if (t && t.tagName === 'TEXTAREA' && !t.classList.contains('fc-enter')) return;
    if (t && t.tagName === 'BUTTON') return;
    var b = app.querySelector('.fc-btn.is-main:not([disabled]):not([hidden])');
    if (b) { e.preventDefault(); b.click(); }
  });

  // ---------------------------------------------------------------- server, with the stub for local tests
  function call(op, payload) {
    payload = Object.assign({ group: groupId }, payload || {});
    if (stub) return stubCall(op, payload);
    return AI.request(op, payload, 25000);
  }
  function stubCall(op) {
    return new Promise(function (res) { setTimeout(res, 250); }).then(function () {
      if (op === 'factLoad') return { state: '', teacher: params.get('teacher') === '1', who: 'stub' };
      if (op === 'factSave') return { ok: true };
      if (op === 'factClass') return { rows: [{ name: 'Test Student', email: 'test@example.com', mastered: 2, packs: 6, facts: 41, answers: 120, updated: '2026-11-26 09:10' },
        { name: 'Second Student', email: 'two@example.com', mastered: 0, packs: 6, facts: 6, answers: 30, updated: '2026-11-26 09:12' }] };
      throw new Error('Unknown request.');
    });
  }
  // Haiku's second opinion on a typed answer the keywords rejected. true only for a Haiku "correct".
  function aiCheck(body) {
    if (stub) return new Promise(function (res) { setTimeout(function () { res(/right/i.test(body.answer)); }, 700); });
    return AI.ask(body);
  }

  function localKey() { return 'bc-factchain:' + groupId + ':' + who; }
  function readLocal() { try { var t = localStorage.getItem(localKey()); return t ? JSON.parse(t) : null; } catch (e) { return null; } }
  function writeLocal() { try { localStorage.setItem(localKey(), JSON.stringify(state)); } catch (e) {} }
  function save() {
    writeLocal();
    if (stub && !stubTest) return;
    if (saving) { saveAgain = true; return; }
    saving = true;
    call('factSave', { state: JSON.stringify(state) }).then(function (r) {
      if (r && r.state) {
        try { var other = L.repair(JSON.parse(r.state)); if (L.progress(other) > L.progress(state)) { state = other; writeLocal(); } } catch (e) {}
      }
    }, function () {}).then(function () {
      saving = false;
      if (saveAgain) { saveAgain = false; save(); }
    });
  }

  // ---------------------------------------------------------------- packs
  function loadPack(id) {
    return new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = 'packs/' + encodeURIComponent(id) + '.js?v=' + encodeURIComponent(version);
      s.onload = function () {
        var p = (window.FACT_CHAIN_PACKS || {})[id];
        var bad = L.packProblems(p);
        if (bad.length) { try { console.warn('Fact Chain: pack ' + id + ' left out: ' + bad.join('; ')); } catch (e) {} resolve(null); }
        else resolve(p);
      };
      s.onerror = function () { resolve(null); };
      document.head.appendChild(s);
    });
  }

  // ---------------------------------------------------------------- start
  function boot() {
    if (stub && !stubTest) {
      show('<div class="fc-card"><h1>' + esc(group.title) + '</h1><p>Open this from the Bloomsbury Computing site, signed in, so your progress is saved.</p></div>');
      return;
    }
    show('<div class="fc-card"><p class="fc-muted">Loading the facts...</p></div>');
    Promise.all([Promise.all(wanted.map(loadPack)), call('factLoad')]).then(function (res) {
      packs = res[0].filter(Boolean);
      var load = res[1] || {};
      who = String(load.who || '');
      teacher = !!load.teacher;
      var server = null, local = readLocal();
      try { server = load.state ? L.repair(JSON.parse(load.state)) : null; } catch (e) { server = null; }
      local = local ? L.repair(local) : null;
      if (server && local) state = L.progress(local) > L.progress(server) ? local : server;
      else state = server || local || L.create();
      if (local && state === local && L.progress(local) > 0) save();
      if (!packs.length) {
        show('<div class="fc-card"><h1>' + esc(group.title) + '</h1><p>No facts are ready here yet. Try again later.</p></div>');
        return;
      }
      if (onePack) packHome(packs[0]); else home();
    }).catch(function () {
      show('<div class="fc-card"><h1>' + esc(group.title) + '</h1><p class="fc-error">Your progress could not be loaded. Check you are signed in, then try again.</p>' +
        '<div class="fc-actions"><button class="fc-btn is-main" id="retry">Try again</button></div></div>');
      $('retry').onclick = boot;
    });
  }

  function rec(pack) { return L.packRec(state, pack.id); }
  function backText() { return hasCpu() ? 'Back to your CPU' : 'Back to the packs'; }
  function builtIds() {
    var ids = [];
    if (allMastered()) return CPU.IDS.slice();
    // A mastered pack adds its part and every part its facts lit.
    packs.forEach(function (p) {
      if (!rec(p).mastered) return;
      var add = CPU.partIds(p.part);
      p.chain.forEach(function (c) { add = add.concat(c.hl || []); });
      add.forEach(function (id) { if (ids.indexOf(id) < 0 && CPU.IDS.indexOf(id) >= 0) ids.push(id); });
    });
    return ids;
  }
  function allMastered() { return packs.every(function (p) { return rec(p).mastered; }); }
  function packStatus(p) {
    var r = rec(p), list = L.rounds(p);
    if (r.mastered) return 'Mastered' + (r.best ? '. Lightning best: ' + time(r.best) : '');
    if (!r.step) return 'Not started';
    return 'Round ' + (r.step + 1) + ' of ' + list.length + ': ' + ROUND_NAMES[list[r.step]];
  }
  function time(ms) {
    var s = ms / 1000, m = Math.floor(s / 60);
    return m + ':' + (s - m * 60 < 10 ? '0' : '') + (s - m * 60).toFixed(1);
  }

  // Build your CPU: each mastered pack adds its part; every pack mastered boots the CPU.
  function home() {
    var done = packs.filter(function (p) { return rec(p).mastered; }).length;
    var d = show('<div class="fc-card"><h1>' + esc(group.title) + '</h1>' +
      '<p>Each pack is a chain of facts' + (hasCpu() ? ' for the exam' : '') + '. Learn it in short rounds. A mistake only brings the fact back.</p>' +
      (hasCpu() ? '<p>Master a pack to add its part to your CPU.</p><div class="fc-diagram fc-build"></div>' :
        '<div class="fc-progress" aria-hidden="true">' + packs.map(function (p) { return '<i class="' + (rec(p).mastered ? 'is-done' : rec(p).step ? 'is-open' : '') + '"></i>'; }).join('') + '</div>') +
      '<p class="fc-status" id="bootline">' + (done === packs.length ? (hasCpu() ? 'Your CPU is complete.' : 'Every pack is mastered.') : done + ' of ' + packs.length + ' packs mastered.') + '</p>' +
      '<div class="fc-packs">' + packs.map(function (p, i) {
        var r = rec(p);
        return '<button class="fc-pack' + (r.mastered ? ' is-done' : r.step ? ' is-open' : '') + '" data-i="' + i + '"><b>' + esc(p.title) + '</b><span>' + esc(packStatus(p)) + '</span></button>';
      }).join('') + '</div>' +
      (allMastered() && hasCpu() ? '<div class="fc-actions"><button class="fc-btn" id="reboot">Start your CPU again</button></div>' : '') +
      (teacher ? '<div class="fc-actions"><button class="fc-btn" id="cls">Class progress</button></div>' : '') + '</div>');
    var ids = builtIds();
    d.built(ids);
    d.light(ids);
    Array.prototype.forEach.call(app.querySelectorAll('.fc-pack'), function (b) { b.onclick = function () { packHome(packs[Number(b.getAttribute('data-i'))]); }; });
    function runBoot() {
      $('bootline').textContent = 'Starting your CPU...';
      d.built(CPU.IDS);
      d.boot(function () { $('bootline').textContent = 'Your CPU is complete. Every part works.'; });
    }
    if (allMastered() && !state.booted && hasCpu()) { state.booted = true; save(); runBoot(); }
    if ($('reboot')) $('reboot').onclick = runBoot;
    if ($('cls')) $('cls').onclick = classView;
  }

  function packHome(p) {
    var r = rec(p), list = L.rounds(p);
    var d = show('<div class="fc-card"><h1>' + esc(p.title) + '</h1>' +
      (p.intro ? '<p>' + esc(p.intro) + '</p>' : '') +
      '<p class="fc-muted">' + p.chain.length + ' facts. ' + list.length + ' short rounds.</p>' +
      '<div class="fc-diagram fc-small"></div>' +
      (r.mastered ?
        '<p class="fc-status">You have mastered this pack.' + (r.best ? ' Your best Lightning time: ' + time(r.best) + '.' : '') + '</p>' +
        '<div class="fc-actions"><button class="fc-btn is-main" id="light">Lightning round</button><button class="fc-btn" id="again">Practise the chain again</button></div>' :
        '<p class="fc-status">' + esc(packStatus(p)) + '</p>' +
        '<div class="fc-actions"><button class="fc-btn is-main" id="go">' + (r.step ? 'Continue' : 'Start') + '</button></div>') +
      (onePack ? '' : '<div class="fc-actions"><button class="fc-btn" id="back">' + backText() + '</button></div>') + '</div>');
    var lit = [];
    p.chain.forEach(function (c) { (c.hl || []).forEach(function (id) { if (lit.indexOf(id) < 0) lit.push(id); }); });
    d.light(r.mastered ? lit : []);
    if ($('go')) $('go').onclick = function () { runRound(p, r.step, false); };
    if ($('light')) $('light').onclick = function () { lightning(p); };
    if ($('again')) $('again').onclick = function () { runRound(p, 0, true); };
    if ($('back')) $('back').onclick = home;
  }

  // ---------------------------------------------------------------- rounds
  function header(p, idx, practice) {
    var list = L.rounds(p);
    return '<div class="fc-top"><span><b>' + esc(p.title) + '</b></span><span>Round ' + (idx + 1) + ' of ' + list.length + ': ' + ROUND_NAMES[list[idx]] + '</span>' +
      (practice ? '<span class="fc-muted">Practice</span>' : '') +
      '<span class="fc-bar" aria-hidden="true"><i style="width:' + Math.round(idx / list.length * 100) + '%"></i></span></div>';
  }
  function runRound(p, idx, practice) {
    var kind = L.rounds(p)[idx];
    var done = function () { roundDone(p, idx, practice); };
    if (kind === 'see') see(p, idx, practice, done);
    else if (/^gap/.test(kind)) gaps(p, idx, practice, Number(kind.slice(3)), done);
    else if (kind === 'order') order(p, idx, practice, done);
    else if (kind === 'recall') recallRound(p, idx, practice, done);
    else if (kind === 'spot') spot(p, idx, practice, done);
    else if (kind === 'quick') quick(p, idx, practice, done);
  }
  function roundDone(p, idx, practice) {
    var r = rec(p), list = L.rounds(p), kind = list[idx];
    if (!practice && !r.mastered) {
      r.step = Math.max(r.step, idx + 1);
      if (kind === 'recall') r.chainDone = true;
      facts(p);
      if (r.step >= list.length) { r.mastered = true; r.facts = L.factsIn(p); }
      save();
    }
    if (idx + 1 >= list.length) { finished(p, practice); return; }
    var next = list[idx + 1];
    show(header(p, idx + 1, practice) + '<div class="fc-card"><h2>' + ROUND_NAMES[kind] + ': done</h2>' +
      '<p>Next: <b>' + ROUND_NAMES[next] + '</b>.</p>' +
      '<div class="fc-actions"><button class="fc-btn is-main" id="go">Start</button>' + (onePack ? '' : '<button class="fc-btn" id="stop">Stop for now</button>') + '</div></div>');
    $('go').onclick = function () { runRound(p, idx + 1, practice); };
    if ($('stop')) $('stop').onclick = home;
  }
  function facts(p) {
    var r = rec(p), n = r.chainDone ? p.chain.length : 0;
    if (r.quick && p.quick) n += S.masteredCount(r.quick, p.quick.map(function (q) { return q.id; }), 0);
    r.facts = r.mastered ? L.factsIn(p) : n;
  }
  // A round with a mistake runs again.
  function again(p, idx, practice, wrong, restart) {
    show(header(p, idx, practice) + '<div class="fc-card"><h2>Try this round again</h2>' +
      '<p>You made ' + wrong + (wrong === 1 ? ' mistake' : ' mistakes') + '. A round only counts with no mistakes. You have seen the right answers, so try it again now.</p>' +
      '<div class="fc-actions"><button class="fc-btn is-main" id="go">Try again</button></div></div>');
    $('go').onclick = restart;
  }
  function chainSoFar(p, upto) {
    if (!upto) return '';
    return '<ol class="fc-chain">' + p.chain.slice(0, upto).map(function (c) { return '<li>' + esc(c.text) + '</li>'; }).join('') + '</ol>';
  }
  // The line with its gaps marked (for a wrong answer).
  function lineMarked(c) {
    var parts = L.blanks(c, Math.max(0, (c.gaps || []).length - 1)) || [{ type: 'text', text: c.text }];
    return parts.map(function (x) { return x.type === 'gap' ? '<mark>' + esc(x.gap) + '</mark>' : esc(x.text); }).join('');
  }

  // 1. See it: the chain one line at a time, its parts lit on the CPU.
  function see(p, idx, practice, done) {
    var i = 0;
    function step() {
      var c = p.chain[i];
      var d = show(header(p, idx, practice) + '<div class="fc-card fc-split"><div><p class="fc-muted">Read each fact. Say it to yourself.</p>' + chainSoFar(p, i) +
        '<p class="fc-fact"><span class="fc-num">' + (i + 1) + '</span>' + esc(c.text) + '</p>' + code(c.code) +
        '<div class="fc-actions"><button class="fc-btn is-main" id="next">' + (i + 1 < p.chain.length ? 'Next fact' : 'Done') + '</button></div></div>' +
        '<div class="fc-diagram fc-side"></div></div>');
      d.light(c.hl || []);
      $('next').onclick = function () { i++; if (i < p.chain.length) step(); else done(); };
    }
    step();
  }

  // 2. Fill the gaps: round A blanks gap 1, B blanks gaps 1 and 2, C the whole line.
  function gaps(p, idx, practice, k, done) {
    var i = 0, wrong = 0;
    function step() {
      var c = p.chain[i], parts = L.blanks(c, k);
      var body;
      if (parts) {
        body = '<p class="fc-fact fc-fill"><span class="fc-num">' + (i + 1) + '</span>' + parts.map(function (x) {
          return x.type === 'gap' ? '<input class="fc-gap" data-gap="' + esc(x.gap) + '" size="' + Math.max(6, x.gap.length + 2) + '" autocomplete="off" spellcheck="false" aria-label="Gap ' + (x.n + 1) + '">' : esc(x.text);
        }).join('') + '</p>' + code(c.code);
      } else {
        // A line's ask (a question whose answer is this fact) is the cue, so the student answers from knowing the
        // topic, not from remembering which sentence came next (James 2026-11-26).
        body = (c.ask ? '<p class="fc-fact">' + esc(c.ask) + '</p>' : '<p class="fc-muted">Fact ' + (i + 1) + ' of ' + p.chain.length + '. Type the whole fact.</p>') +
          code(c.code) + '<textarea class="fc-line fc-enter" id="line" rows="2" autocomplete="off" spellcheck="false" aria-label="Fact ' + (i + 1) + '"></textarea>';
      }
      var d = show(header(p, idx, practice) + '<div class="fc-card fc-split"><div>' +
        '<p class="fc-muted">' + (parts ? 'Type the missing words.' : c.ask ? 'Answer with the fact, in one sentence.' : 'Write the next fact in the chain.') + '</p>' + (!parts && c.ask ? '' : chainSoFar(p, i)) + body +
        '<div class="fc-actions"><button class="fc-btn is-main" id="check">Check</button></div><div id="out"></div></div>' +
        '<div class="fc-diagram fc-side"></div></div>');
      if (!parts) d.light(c.hl || []);
      $('check').onclick = function () {
        var right;
        if (parts) {
          var boxes = app.querySelectorAll('.fc-gap');
          if (Array.prototype.some.call(boxes, function (b) { return !b.value.trim(); })) { $('out').innerHTML = '<p class="fc-error">Fill every gap first.</p>'; return; }
          right = true;
          Array.prototype.forEach.call(boxes, function (b) {
            var ok = L.gapRight(c, b.getAttribute('data-gap'), b.value);
            b.classList.add(ok ? 'is-right' : 'is-wrong');
            b.readOnly = true;
            if (!ok) right = false;
          });
        } else {
          var t = $('line');
          if (!t.value.trim()) { $('out').innerHTML = '<p class="fc-error">Write the fact first.</p>'; return; }
          t.readOnly = true;
          right = L.lineFound(c, t.value);
        }
        if (!right) wrong++;
        else d.light(c.hl || []);
        $('check').hidden = true;
        $('out').innerHTML = '<div class="fc-result ' + (right ? 'is-right' : 'is-wrong') + '"><p class="fc-mark">' + (right ? 'Right.' : 'Not quite. The fact is:') + '</p>' +
          (right ? '' : '<p class="fc-answer">' + lineMarked(c) + '</p>') + '</div>' +
          '<div class="fc-actions"><button class="fc-btn is-main" id="next">Next</button></div>';
        postHeight();
        $('next').focus();
        $('next').onclick = function () {
          i++;
          if (i < p.chain.length) step();
          else if (wrong) again(p, idx, practice, wrong, function () { i = 0; wrong = 0; step(); });
          else done();
        };
      };
    }
    step();
  }

  // 3. Put it in order: drag the lines, or use the Up and Down buttons.
  // Only a real sequence (pack.sequences) is ever put in order; a pack with two takes them in turn.
  function order(p, idx, practice, done) {
    var seqs = L.sequences(p), si = 0, seq = seqs[0];
    var cur = L.shuffleOrder(seq.length), dragFrom = -1;
    function draw(marked) {
      show(header(p, idx, practice) + '<div class="fc-card"><p>Put the facts in the right order. Drag a fact, or use Up and Down.</p>' +
        '<ol class="fc-order" id="list">' + cur.map(function (ci, pos) {
          var mark = marked ? (ci === pos ? ' is-right' : ' is-wrong') : '';
          return '<li class="fc-item' + mark + '" draggable="' + (!marked) + '" data-pos="' + pos + '"><span class="fc-item-text">' + esc(p.chain[seq[ci]].text) + '</span>' +
            (marked ? '' : '<span class="fc-move"><button class="fc-mini" data-up="' + pos + '" aria-label="Move up"' + (pos ? '' : ' disabled') + '>Up</button>' +
              '<button class="fc-mini" data-down="' + pos + '" aria-label="Move down"' + (pos < cur.length - 1 ? '' : ' disabled') + '>Down</button></span>') + '</li>';
        }).join('') + '</ol><div id="out"></div>' +
        (marked ? '' : '<div class="fc-actions"><button class="fc-btn is-main" id="check">Check</button></div>') + '</div>');
      if (marked) return;
      Array.prototype.forEach.call(app.querySelectorAll('[data-up]'), function (b) { b.onclick = function () { move(Number(b.getAttribute('data-up')), -1); }; });
      Array.prototype.forEach.call(app.querySelectorAll('[data-down]'), function (b) { b.onclick = function () { move(Number(b.getAttribute('data-down')), 1); }; });
      Array.prototype.forEach.call(app.querySelectorAll('.fc-item'), function (li) {
        li.addEventListener('dragstart', function (e) { dragFrom = Number(li.getAttribute('data-pos')); try { e.dataTransfer.setData('text/plain', String(dragFrom)); e.dataTransfer.effectAllowed = 'move'; } catch (x) {} li.classList.add('is-drag'); });
        li.addEventListener('dragend', function () { li.classList.remove('is-drag'); });
        li.addEventListener('dragover', function (e) { e.preventDefault(); li.classList.add('is-over'); });
        li.addEventListener('dragleave', function () { li.classList.remove('is-over'); });
        li.addEventListener('drop', function (e) {
          e.preventDefault();
          var to = Number(li.getAttribute('data-pos'));
          if (dragFrom < 0 || dragFrom === to) { draw(); return; }
          var v = cur.splice(dragFrom, 1)[0];
          cur.splice(to, 0, v);
          dragFrom = -1;
          draw();
        });
      });
      $('check').onclick = check;
    }
    function move(pos, by) {
      var to = pos + by;
      if (to < 0 || to >= cur.length) return;
      var t = cur[pos]; cur[pos] = cur[to]; cur[to] = t;
      draw();
      var b = app.querySelector('[data-' + (by < 0 ? 'up' : 'down') + '="' + to + '"]');
      if (b && !b.disabled) b.focus();
    }
    function check() {
      var wrong = cur.filter(function (ci, pos) { return ci !== pos; }).length;
      draw(true);
      if (!wrong) {
        $('out').innerHTML = '<div class="fc-result is-right"><p class="fc-mark">Every fact is in the right place.</p></div>' +
          '<div class="fc-actions"><button class="fc-btn is-main" id="next">Next</button></div>';
        $('next').onclick = function () { si++; if (si < seqs.length) { seq = seqs[si]; cur = L.shuffleOrder(seq.length); draw(); } else done(); };
      } else {
        $('out').innerHTML = '<div class="fc-result is-wrong"><p class="fc-mark">' + wrong + ' facts are in the wrong place. This is the right order:</p>' +
          '<ol class="fc-chain">' + seq.map(function (ci) { return '<li>' + esc(p.chain[ci].text) + '</li>'; }).join('') + '</ol></div>' +
          '<div class="fc-actions"><button class="fc-btn is-main" id="next">Try again</button></div>';
        $('next').onclick = function () { si = 0; seq = seqs[0]; cur = L.shuffleOrder(seq.length); draw(); };
      }
      postHeight();
    }
    draw();
  }

  // 4. From memory: write every fact; keyword points, Haiku checks only the lines the keywords missed.
  function recallRound(p, idx, practice, done) {
    function draw() {
      show(header(p, idx, practice) + '<div class="fc-card"><p><b>Write these facts from memory, one per line.</b></p>' +
        '<p class="fc-muted">' + p.chain.length + ' facts about ' + esc(p.title) + '. Any order. Short is fine.</p>' +
        '<textarea class="fc-recall" id="box" rows="' + Math.min(14, p.chain.length + 2) + '" autocomplete="off" spellcheck="false" aria-label="Your facts"></textarea>' +
        '<div class="fc-actions"><button class="fc-btn is-main" id="check">Check</button><span class="fc-muted" id="wait"></span></div><div id="out"></div></div>');
      $('check').onclick = check;
    }
    function check() {
      var box = $('box'), text = box.value;
      if (!text.trim()) { $('out').innerHTML = '<p class="fc-error">Write some facts first.</p>'; return; }
      box.readOnly = true;
      $('check').disabled = true;
      var res = L.recall(p.chain, text), found = res.found.slice();
      var missing = [];
      found.forEach(function (f, i) { if (!f) missing.push(i); });
      var extra = res.unmatched.join('\n').slice(0, 500);
      var asks = extra && missing.length ? missing.slice(0, 8) : [];
      if (asks.length) $('wait').textContent = 'Checking...';
      Promise.all(asks.map(function (i) {
        var c = p.chain[i];
        return aiCheck({ drillId: 'factchain-' + p.id, cardId: 'line' + (i + 1),
          prompt: 'A student wrote facts about ' + p.title + ' from memory, one per line. Does the student answer state this fact (the same meaning, any wording)? The fact: ' + c.text,
          answers: [c.text], note: c.text, hint: '', answer: extra }).then(function (ok) { if (ok) found[i] = true; });
      })).then(function () {
        $('wait').textContent = '';
        var n = found.filter(Boolean).length, all = n === found.length;
        $('check').hidden = true;
        $('out').innerHTML = '<div class="fc-result ' + (all ? 'is-right' : 'is-wrong') + '"><p class="fc-mark">You found ' + n + ' of ' + found.length + ' facts.</p>' +
          '<ul class="fc-found">' + p.chain.map(function (c, i) {
            return '<li class="' + (found[i] ? 'is-right' : 'is-wrong') + '"><b>' + (found[i] ? 'Found' : 'Missing') + ':</b> ' + esc(c.text) + '</li>';
          }).join('') + '</ul></div>' +
          '<div class="fc-actions"><button class="fc-btn is-main" id="next">' + (all ? 'Next' : 'Try again') + '</button></div>';
        postHeight();
        $('next').onclick = all ? done : draw;
      });
    }
    draw();
  }

  // 5. Spot the mistake: type the right word.
  function spot(p, idx, practice, done) {
    var i = 0, wrong = 0, items = L.shuffle(p.spot);
    function step() {
      var s = items[i];
      show(header(p, idx, practice) + '<div class="fc-card"><p class="fc-muted">Mistake ' + (i + 1) + ' of ' + items.length + '. One word or phrase is wrong. Type the right word.</p>' +
        '<p class="fc-fact">' + esc(s.wrong) + '</p>' + code(s.code) +
        '<input class="fc-input" id="ans" autocomplete="off" spellcheck="false" aria-label="The right word">' +
        '<div class="fc-actions"><button class="fc-btn is-main" id="check">Check</button></div><div id="out"></div></div>');
      $('check').onclick = function () {
        var a = $('ans');
        if (!a.value.trim()) { $('out').innerHTML = '<p class="fc-error">Type the right word first.</p>'; return; }
        a.readOnly = true;
        var right = L.hasAny(a.value, s.fix);
        if (!right) wrong++;
        $('check').hidden = true;
        $('out').innerHTML = '<div class="fc-result ' + (right ? 'is-right' : 'is-wrong') + '"><p class="fc-mark">' + (right ? 'Right.' : 'Not quite.') + '</p>' +
          '<p class="fc-answer">' + esc(s.model || s.fix[0]) + '</p></div>' +
          '<div class="fc-actions"><button class="fc-btn is-main" id="next">Next</button></div>';
        postHeight();
        $('next').focus();
        $('next').onclick = function () {
          i++;
          if (i < items.length) step();
          else if (wrong) again(p, idx, practice, wrong, function () { i = 0; wrong = 0; items = L.shuffle(p.spot); step(); });
          else done();
        };
      };
    }
    step();
  }

  // 6. Quick-fire: the Practice Sets rule (2 right in a row; a wrong one comes back 3 later and needs 3 in a row).
  function quick(p, idx, practice, done) {
    var r = rec(p), qids = p.quick.map(function (q) { return q.id; }), byId = {};
    p.quick.forEach(function (q) { byId[q.id] = q; });
    var st = practice ? S.create([qids.length]) : (r.quick = S.repair(r.quick, [qids.length]));
    if (st.finished) { done(); return; }
    function step() {
      var pick = S.next(st, qids);
      if (!pick) { done(); return; }
      if (!practice) writeLocal();
      var q = byId[pick.qid], n = S.masteredCount(st, qids, 0);
      show(header(p, idx, practice) + '<div class="fc-top fc-sub-top"><span><b>' + n + '</b> of ' + qids.length + ' mastered</span>' +
        '<span class="fc-bar" aria-hidden="true"><i style="width:' + Math.round(n / qids.length * 100) + '%"></i></span></div>' +
        '<div class="fc-card"><p class="fc-fact">' + esc(q.q) + '</p>' + code(q.code) +
        '<input class="fc-input" id="ans" autocomplete="off" spellcheck="false" aria-label="Your answer">' +
        '<div class="fc-actions"><button class="fc-btn is-main" id="check">Check</button><span class="fc-muted" id="wait"></span></div><div id="out"></div></div>');
      $('check').onclick = function () {
        var a = $('ans'), text = a.value.trim();
        if (!text) { $('out').innerHTML = '<p class="fc-error">Type an answer first.</p>'; return; }
        a.readOnly = true;
        $('check').disabled = true;
        var kw = L.hasAny(text, q.accept);
        if (!kw) $('wait').textContent = 'Checking...';
        (kw ? Promise.resolve(true) : aiCheck({ drillId: 'factchain-' + p.id, cardId: q.id, prompt: q.q, answers: q.accept, note: q.model || '', hint: '', answer: text })).then(function (right) {
          $('wait').textContent = '';
          var res = S.answer(st, qids, right);
          if (!practice) { state.answers++; facts(p); save(); }
          var left = res.need - res.streak;
          var status = res.mastered ? 'Mastered.' : right ? 'It will come back later. ' + left + ' more right ' + (left === 1 ? 'answer' : 'answers in a row') + ' to master it.' :
            'This question will come back soon.';
          $('check').hidden = true;
          $('out').innerHTML = '<div class="fc-result ' + (right ? 'is-right' : 'is-wrong') + '"><p class="fc-mark">' + (right ? 'Right.' : 'Not quite.') + '</p>' +
            '<p class="fc-answer">' + esc(q.model || q.accept[0]) + '</p><p class="fc-muted">' + esc(status) + '</p></div>' +
            '<div class="fc-actions"><button class="fc-btn is-main" id="next">Next</button></div>';
          postHeight();
          $('next').focus();
          $('next').onclick = function () { if (res.finished) done(); else step(); };
        });
      };
    }
    step();
  }

  // The pack is finished: the chain plays on the CPU.
  function finished(p, practice) {
    var r = rec(p), trip = p.chain.some(function (c) { return (c.hl || []).indexOf('addressBus') >= 0; }) && p.chain.some(function (c) { return (c.hl || []).indexOf('dataBus') >= 0; });
    var d = show('<div class="fc-card"><h1>' + esc(p.title) + ': ' + (practice ? 'done' : 'mastered') + '</h1>' +
      '<p>' + (practice ? 'You went through the whole chain again.' : hasCpu() ? 'You know the whole chain. Watch it run on the CPU.' : 'You know the whole chain.') + '</p>' +
      '<div class="fc-diagram fc-small"></div>' +
      '<div class="fc-actions"><button class="fc-btn is-main" id="light">Lightning round</button>' +
      (hasCpu() ? '<button class="fc-btn" id="play">Play it again</button>' : '') + (onePack ? '' : '<button class="fc-btn" id="back">' + backText() + '</button>') + '</div></div>');
    function play() { if (trip) d.trip(); else d.replay(p.chain); }
    play();
    if ($('play')) $('play').onclick = play;
    $('light').onclick = function () { lightning(p); };
    if ($('back')) $('back').onclick = home;
    if (!r.mastered) $('light').hidden = true;
  }

  // ---------------------------------------------------------------- Lightning: quick-fire against your own best time
  function lightning(p) {
    var r = rec(p);
    show('<div class="fc-card"><h1>Lightning round: ' + esc(p.title) + '</h1>' +
      '<p>Answer all ' + p.quick.length + ' questions as fast as you can. A wrong answer comes back at the end.</p>' +
      '<p class="fc-status">' + (r.best ? 'Your best time: ' + time(r.best) + '. Can you beat it?' : 'This is your first Lightning round.') + '</p>' +
      '<div class="fc-actions"><button class="fc-btn is-main" id="go">Start the clock</button><button class="fc-btn" id="back">Back</button></div></div>');
    $('back').onclick = function () { packHome(p); };
    $('go').onclick = function () {
      var queue = L.shuffle(p.quick), start = Date.now(), slips = 0, tick = null;
      function clock() { var c = $('clock'); if (c) c.textContent = time(Date.now() - start); }
      function step() {
        var q = queue[0];
        show('<div class="fc-top"><span><b>Lightning</b></span><span>' + queue.length + ' left</span><span class="fc-clock" id="clock">' + time(Date.now() - start) + '</span></div>' +
          '<div class="fc-card"><p class="fc-fact">' + esc(q.q) + '</p>' + code(q.code) + '<input class="fc-input" id="ans" autocomplete="off" spellcheck="false" aria-label="Your answer">' +
          '<div class="fc-actions"><button class="fc-btn is-main" id="check">Go</button></div><div id="out"></div></div>');
        $('check').onclick = function () {
          var a = $('ans');
          if (!a.value.trim()) return;
          a.readOnly = true;
          if (L.hasAny(a.value, q.accept)) { queue.shift(); next(); return; }
          slips++;
          queue.push(queue.shift());
          $('check').hidden = true;
          $('out').innerHTML = '<div class="fc-result is-wrong"><p class="fc-mark">Not quite. It comes back at the end.</p><p class="fc-answer">' + esc(q.model || q.accept[0]) + '</p></div>' +
            '<div class="fc-actions"><button class="fc-btn is-main" id="next">Next</button></div>';
          postHeight();
          $('next').focus();
          $('next').onclick = next;
        };
      }
      function next() { if (queue.length) step(); else end(); }
      function end() {
        clearInterval(tick);
        var ms = Date.now() - start, best = !r.best || ms < r.best, old = r.best;
        r.runs = (r.runs || 0) + 1;
        if (best) r.best = ms;
        save();
        show('<div class="fc-card"><h1>' + time(ms) + '</h1>' +
          '<p class="fc-status">' + (best ? (old ? 'A new best. Your old best was ' + time(old) + '.' : 'Your first time. Try to beat it.') : 'Your best is still ' + time(r.best) + '.') + '</p>' +
          (slips ? '<p class="fc-muted">' + slips + (slips === 1 ? ' answer came' : ' answers came') + ' back for another try.</p>' : '') +
          '<div class="fc-actions"><button class="fc-btn is-main" id="go">Go again</button><button class="fc-btn" id="back">Back</button></div></div>');
        $('go').onclick = function () { lightning(p); };
        $('back').onclick = function () { packHome(p); };
      }
      tick = setInterval(clock, 100);
      step();
    };
  }

  // ---------------------------------------------------------------- teacher: class goal and table
  function classView() {
    show('<div class="fc-card"><h2>Class progress</h2><p class="fc-muted">Loading...</p></div>');
    var total = packs.reduce(function (n, p) { return n + L.factsIn(p); }, 0);
    call('factClass').then(function (res) {
      var rows = (res && res.rows) || [];
      var sum = rows.reduce(function (n, x) { return n + (Number(x.facts) || 0); }, 0), goal = Math.max(1, rows.length * total);
      show('<div class="fc-card"><h2>Class progress</h2>' +
        '<p class="fc-status">The class has mastered <b>' + sum + '</b> facts.</p>' +
        '<div class="fc-goal"><span class="fc-bar fc-bar-big" aria-hidden="true"><i style="width:' + Math.min(100, Math.round(sum / goal * 100)) + '%"></i></span>' +
        '<span class="fc-muted">Goal: ' + goal + ' facts (' + total + ' for each of ' + rows.length + ' students)</span></div>' +
        (rows.length ? '<div style="overflow-x:auto"><table class="fc-table"><thead><tr><th>Student</th><th>Packs mastered</th><th>Facts</th><th>Answers</th><th>Last saved</th></tr></thead><tbody>' +
          rows.map(function (x) {
            return '<tr><td>' + esc(x.name || x.email) + '</td><td>' + x.mastered + ' of ' + packs.length + '</td><td>' + x.facts + '</td><td>' + x.answers + '</td><td>' + esc(x.updated) + '</td></tr>';
          }).join('') + '</tbody></table></div>' : '<p>No student has started yet.</p>') +
        '<div class="fc-actions"><button class="fc-btn" id="refresh">Refresh</button><button class="fc-btn" id="back">Back</button></div></div>');
      $('refresh').onclick = classView;
      $('back').onclick = home;
    }, function (e) {
      show('<div class="fc-card"><h2>Class progress</h2><p class="fc-error">' + esc((e && e.message) || 'Could not load the class list.') + '</p>' +
        '<div class="fc-actions"><button class="fc-btn" id="back">Back</button></div></div>');
      $('back').onclick = home;
    });
  }

  boot();
})();
