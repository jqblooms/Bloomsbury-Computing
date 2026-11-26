// Data Bridge 3D: the start screen, the exam rounds, the fact rounds and the lesson result. Ported from the site's
// Data Bridge (BridgeBuilder/js/game.js), which stays the source of truth for coins, rounds and wording: the same
// ExamGame client (shared/exam-game-client.js), answer spaces (shared/exam-question.js), help (shared/exam-help.js),
// Learn mode (worked examples, free help, Try a new question) and Fact Chain rounds (BridgeBuilder/js/facts.js).
// Everything here is DOM in the side panel (#screen); the 3D part is main.js. G is the shared game object from main.js:
//   G.S (the saved game), G.setId, G.setTitle, G.learn, G.save(), G.load(k, d), G.store(k, v), G.gameKey(), G.bestKey(),
//   G.panel(on), G.updateHud(), G.coinPop(n), G.toBuild(message), G.resume(), G.newGame(), G.showLevel(round), G.ROUNDS, G.GOAL
const Ph = window.BBPhys, F = window.BBFacts;
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const api = () => window.ExamGame;
const call = fn => { try { return Promise.resolve(fn()); } catch (e) { return Promise.reject(e); } };
const errText = e => (e && e.message) || 'Something went wrong. Try again.';

export function createRounds(G) {
  let sets = [];
  const factTopic = () => !!(F && F.isFacts(G.setId));
  const roundLine = lv => 'Round ' + lv.n + ': ' + lv.intro;
  const standalone = () => window.parent === window || !!(api().isStub && api().isStub());
  const screen = () => $('screen');

  // ---------------------------------------------------------------- results for the lesson slide
  function postResult() {
    const S = G.S;
    if (window.parent === window || !S || G.learn) return;   // Learn mode never counts as finishing the slide
    const done = (S.best || 0) >= G.GOAL;
    if (done) G.store('done:' + G.setId, true);
    const before = !!G.load('done:' + G.setId, false);
    const head = done ? 'Finished.' : before ? 'Finished on an earlier visit.' : 'Not finished yet.';
    const line = ' Best: crossed ' + (S.best || 0) + ' of ' + G.ROUNDS + ' rounds. Now on round ' + S.round + '. Marks ' + S.stats.marks + ' of ' + S.stats.max + ' in ' + S.stats.rounds + ' rounds.';
    try {
      window.parent.postMessage({ type: 'BC_APP_RESULT', questionId: 'data-bridge-3d-' + G.setId.replace(/:/g, '-'), label: 'Data Bridge 3D: ' + (G.setTitle || G.setId),
        summary: head + line + (S.stats.log.length ? ' ' + S.stats.log.slice(-10).join(' ') : ''), complete: done || before }, '*');
    } catch (e) { }
  }

  // ---------------------------------------------------------------- start screen
  function showStart() {
    G.S = null; G.panel(true); G.updateHud(); G.showLevel(1);
    screen().innerHTML = '<div class="bb-card bb-start"><p class="bb-lead">Loading...</p></div>';
    Promise.all([call(() => api().sets()).catch(e => ({ error: e })),
      F ? F.init(window.BB_VERSION || '1').catch(() => []) : Promise.resolve([])]).then(res => {
      const list = res[0] && res[0].error ? [] : res[0];
      if (res[0] && res[0].error && !res[1].length) throw res[0].error;
      sets = (list || []).concat(res[1] || []).filter(s => s && s.setId);
      if (!sets.length) throw new Error('No question topics yet.');
      if (!G.setId || !sets.some(s => s.setId === G.setId)) G.setId = sets[0].setId;
      drawStart();
    }).catch(e => {
      screen().innerHTML = '<div class="bb-card bb-start"><h1>Data Bridge 3D</h1><p class="bb-lead">' + esc(errText(e)) + '</p><button class="bc-btn" id="retry">Try again</button></div>';
      $('retry').onclick = showStart;
    });
  }
  const validSave = s => s && s.v === 1 && s.round >= 1 && s.round <= G.ROUNDS && /^(exam|build|drive)$/.test(s.phase);
  function drawStart() {
    if (api().warm && !factTopic()) api().warm(G.setId);
    const cur = sets.filter(s => s.setId === G.setId)[0];
    G.setTitle = cur ? (cur.title || cur.setId) : G.setId;
    let saved = G.load(G.gameKey(), null);
    if (!validSave(saved)) saved = null;
    const best = G.load(G.bestKey(), 0), L = G.learn;
    let h = '<div class="bb-card bb-start"><h1>Data Bridge 3D</h1>' +
      '<p class="bb-lead">Build a bridge across each gap, then ride the cart over it. ' + (factTopic() ? 'Learn the facts to earn coins for the bridge.' : 'Answer exam questions to earn coins for the bridge.') + '</p>' +
      '<p class="bb-label">Pick a topic</p>' + (api().topicPicker ? api().topicPicker(sets, G.setId, { pillClass: 'bb-pill' }) :
        '<div class="bb-choice-row">' + sets.map(s => '<button class="bb-pill' + (s.setId === G.setId ? ' is-on' : '') + '" data-set="' + esc(s.setId) + '">' + esc(s.title || s.setId) + '</button>').join('') + '</div>') +
      '<p class="bb-label">Pick a mode</p><div class="bb-choice-row bb-modes" role="group" aria-label="Mode">' +
      '<button class="bb-pill' + (L ? '' : ' is-on') + '" data-mode="play" aria-pressed="' + !L + '">Play</button>' +
      '<button class="bb-pill' + (L ? ' is-on' : '') + '" data-mode="learn" aria-pressed="' + L + '">Learn</button></div>' +
      '<p class="bb-mode-note">' + (L
        ? 'Learn mode: see a worked example and ask the AI for help at any time. Help is free. A wrong answer? Try again or get a new question. Learn mode does not finish the game for your lesson.'
        : factTopic() ? 'Play mode: answer on your own to earn coins. This counts for your lesson.' : 'Play mode: answer exam questions on your own to earn coins. This counts for your lesson.') + '</p>' +
      (best ? '<p class="bb-label">Your best: crossed ' + best + ' of ' + G.ROUNDS + ' rounds</p>' : '');
    if (saved) {
      h += '<div class="bb-start-go"><button class="bc-btn bb-big" id="cont">' + (L ? 'Continue Learn: round ' : 'Continue: round ') + saved.round + '</button>' +
        '<button class="bc-btn is-outline" id="fresh">New game</button></div>';
    } else h += '<div class="bb-start-go"><button class="bc-btn bb-big" id="go">' + (L ? 'Start Learn mode' : 'Start') + '</button></div>';
    h += '<p class="bb-label b3-keys">Walk: W A S D. Hop: Shift or J. Build: B. Hold on: Space.</p>';
    screen().innerHTML = h + '</div>';
    screen().querySelectorAll('[data-set]').forEach(b => { b.onclick = () => { G.setId = b.getAttribute('data-set'); drawStart(); }; });
    screen().querySelectorAll('[data-mode]').forEach(b => { b.onclick = () => { G.learn = b.getAttribute('data-mode') === 'learn'; G.store('mode', G.learn ? 'learn' : 'play'); drawStart(); }; });
    if ($('go')) $('go').onclick = () => { G.newGame(); startRound(); };
    if ($('cont')) $('cont').onclick = () => { G.S = saved; G.resume(); };
    if ($('fresh')) $('fresh').onclick = function () {
      if (this.getAttribute('data-sure')) { G.store(G.gameKey(), null); drawStart(); return; }
      this.setAttribute('data-sure', '1'); this.textContent = 'Click again to start over';
    };
  }

  // ---------------------------------------------------------------- exam rounds (the site's one-page round)
  // S.exam = { n, qs, rate, pool, paid, got, intro, base, items: [{ answer, doc, attempt, first, fb, open, err, rid }] }
  const blankItem = () => ({ answer: '', doc: null, attempt: 1, first: null, fb: null, open: false, err: '' });
  let ansBoxes = [], ansSaveT = 0, sending = false, sendFailed = '';

  function startRound(resuming) {
    const S = G.S, LV = Ph.level(S.round);
    S.phase = 'exam';
    if (!resuming || !S.exam) S.exam = { n: S.round, qs: null, rate: 0, pool: 0, paid: 0, intro: true, items: null };
    G.save(); G.panel(true); G.showLevel(S.round); G.updateHud();
    if (factTopic()) {
      if (S.exam && !S.exam.facts) S.exam = null;
      if (!F.start(factCtx(), G.setId)) {
        screen().innerHTML = '<div class="bb-card bb-q"><p class="bb-lead">These facts did not load. Check your connection.</p>' +
          '<div class="bb-start-go"><button class="bc-btn" id="retry">Try again</button></div></div>';
        $('retry').onclick = () => startRound(true);
      }
      return;
    }
    if (S.exam && S.exam.facts) S.exam = { n: S.round, qs: null, rate: 0, pool: 0, paid: 0, intro: true, items: null };
    const r = S.exam;
    if (r.qs) { showRound(); return; }
    screen().innerHTML = '<div class="bb-card bb-q"><p class="bb-lead">Loading a question...</p></div>';
    call(() => api().next(G.setId, { count: 1, maxMarks: 99 })).then(list => {
      list = (list || []).filter(q => q && q.qid).slice(0, 1);
      if (!list.length) throw new Error('No questions right now.');
      const total = Number(list[0].marks) || 1;
      r.qs = list.map(q => ({ qid: q.qid, text: q.text, marks: Number(q.marks) || 1, blocks: q.blocks || null }));
      r.items = r.qs.map(blankItem);
      r.pool = LV.pool;
      r.rate = Math.max(0, r.pool - (r.base || 0)) / total;
      G.save();
      if (G.S && G.S.exam === r) showRound();
    }).catch(e => {
      screen().innerHTML = '<div class="bb-card bb-q"><p class="bb-lead">' + esc(errText(e)) + '</p>' +
        '<div class="bb-start-go"><button class="bc-btn" id="retry">Try again</button></div></div>';
      $('retry').onclick = () => startRound(true);
    });
  }

  function factCtx() {
    const S = G.S;
    return { S, LV: Ph.level(S.round), learn: G.learn, stub: standalone(), screen: screen(), roundLine: roundLine(Ph.level(S.round)), save: G.save,
      pay: n => { S.coins += n; G.save(); G.updateHud(); G.coinPop(n); },
      finish: res => {
        S.stats.marks += res.right; S.stats.max += res.total; S.stats.rounds++;
        S.stats.log.push('Facts ' + S.round + ': ' + res.right + ' of ' + res.total + ' right first time.');
        S.exam = null; S.design = null;
        G.toBuild(res.paid ? 'You earned ' + res.paid + ' coins. Now build your bridge.' : 'No coins this round. Build with what you have.');
        postResult();
      } };
  }
  const roundTotal = () => G.S.exam.qs.reduce((a, q) => a + q.marks, 0);
  function roundSize() {
    const n = G.S.exam.qs.length, m = roundTotal();
    return n + (n === 1 ? ' question, ' : ' questions, ') + m + (m === 1 ? ' mark' : ' marks');
  }
  const canSend = it => !it.fb || it.open;
  function showQuestion(el, q) {
    const blocks = q.blocks || (api().blocksFor ? api().blocksFor(q.qid) : null);
    if (window.BCExamQuestion) window.BCExamQuestion.render(el, { text: q.text, blocks });
    else el.textContent = q.text;
  }
  function mountAnswer(q, it, i, ro) {
    const opts = { doc: it.doc, text: it.bs ? '' : it.answer || '', state: it.bs || null, readOnly: ro, rows: 3, maxLength: 800,
      label: 'Your answer to question ' + (i + 1), labelEl: $('ansLabel' + i),
      placeholder: 'Type your final answer here. You can type working here too.',
      onChange: (text, doc, st) => {
        it.answer = text; it.doc = doc; if (st) it.bs = st;
        clearTimeout(ansSaveT); ansSaveT = setTimeout(G.save, 400);
        updateActs();
      } };
    if (window.BCExamQuestion && window.BCExamQuestion.answerUI) {
      const blocks = q.blocks || (api().blocksFor ? api().blocksFor(q.qid) : null);
      return window.BCExamQuestion.answerUI($('qText' + i), $('ans' + i), { text: q.text, blocks }, opts);
    }
    showQuestion($('qText' + i), q);
    return window.BCAnswerBox.mount($('ans' + i), opts);
  }
  const payNow = () => { const r = G.S.exam; return Math.max(0, r.pool - (G.learn ? r.base || 0 : 0)); };

  function showRound() {
    const S = G.S, r = S.exam, L = G.learn;
    if (r.intro) {
      const first = !G.load('seenRound', false);
      screen().innerHTML = '<div class="bb-card bb-q bb-intro"><h2>Exam round ' + r.n + '</h2>' +
        '<p class="bb-lead">' + esc(roundLine(Ph.level(r.n))) + '</p>' +
        '<p class="bb-q-text">' + roundSize() + '.\nFull marks pays ' + payNow() + ' coins.</p>' +
        (S.coins ? '<p class="bb-lead">You also have ' + S.coins + ' coins saved.</p>' : '') +
        (L ? '<p class="bb-lead"><span class="bb-pill bb-learn-tag">Learn mode</span> You can see a worked example and ask the AI for help. Both are free.</p>' : '') +
        (first ? '<p class="bb-lead">Marks are the only way to earn coins. Then you spend them on your bridge.</p>' : '') +
        '<div class="bb-start-go"><button class="bc-btn bb-big" id="go">Start</button></div></div>';
      $('go').onclick = () => { r.intro = false; G.store('seenRound', true); G.save(); showRound(); };
      try { $('go').focus({ preventScroll: true }); } catch (e) { }
      return;
    }
    const pane = $('panel'), scrollY = pane ? pane.scrollTop : 0, firstShow = !$('roundForm');
    let h = '<div class="bb-card bb-q" id="roundForm"><div class="bb-round-head"><h2>Exam round ' + r.n + '</h2>' +
      '<span class="bb-pill">' + roundSize() + '</span>' +
      '<span class="bb-pill">Full marks pays ' + payNow() + ' coins</span>' +
      (L ? '<span class="bb-pill bb-learn-tag">Learn mode</span>' : '') + '</div>';
    r.qs.forEach((q, i) => {
      const it = r.items[i], edit = canSend(it);
      h += '<section class="bb-qblock" id="qb' + i + '"><div class="bb-q-meta"><span class="bb-qnum">Question' + (r.qs.length > 1 ? ' ' + (i + 1) : '') + '</span>' +
        '<span class="bb-pill">' + q.marks + (q.marks === 1 ? ' mark' : ' marks') + '</span>' +
        (it.attempt === 2 && it.open ? '<span class="bb-pill is-warn">Second try: half coins</span>' : '') + '</div>' +
        '<div class="bb-q-text" id="qText' + i + '"></div>' +
        (L ? '<div class="bb-ex" id="ex' + i + '"></div>' : '') +
        '<p class="bb-label" id="ansLabel' + i + '">Your answer' + (edit ? ' (you must type it)' : '') + ':</p><div id="ans' + i + '" class="bb-ans"></div>' +
        '<div class="bb-fb" id="fb' + i + '" hidden></div><div id="help' + i + '"></div><p class="bb-q-err" id="err' + i + '" hidden></p></section>';
    });
    h += '<div class="bb-round-foot"><p class="bb-round-total" id="roundTotal" hidden></p><p class="bb-q-err" id="sendErr" hidden></p>' +
      '<div class="bb-q-actions" id="roundActs"></div></div></div>';
    screen().innerHTML = h;
    ansBoxes = [];
    r.qs.forEach((q, i) => {
      const it = r.items[i], edit = canSend(it);
      ansBoxes[i] = mountAnswer(q, it, i, !edit || sending);
      if (!edit || sending) ansBoxes[i].setReadOnly(true);
      if (it.fb) showItemFeedback(i);
      if (L) { drawExample(i); mountHelp(i); }
      if (it.err) { $('err' + i).hidden = false; $('err' + i).textContent = it.err; }
    });
    updateActs();
    if (firstShow) {
      const firstOpen = r.items.map(canSend).indexOf(true);
      if (firstOpen >= 0) setTimeout(() => { try { ansBoxes[firstOpen].focus(); } catch (e) { } }, 30);
    } else if (pane) pane.scrollTop = scrollY;
  }

  function showItemFeedback(i) {
    const it = G.S.exam.items[i], fb = it.fb, box = $('fb' + i);
    box.hidden = false;
    box.className = 'bb-fb ' + (it.open ? 'is-old ' : '') + (fb.marks === fb.max ? 'is-good' : fb.marks ? 'is-part' : 'is-bad');
    box.innerHTML = '<div class="bb-fb-head"><b>' + (it.open ? 'First try: ' : '') + fb.marks + ' of ' + fb.max + (fb.max === 1 ? ' mark' : ' marks') + '</b>' +
      (fb.pay ? '<span class="bb-coin-pop">+' + fb.pay + ' coins</span>' : '') + '</div>' +
      (fb.feedback ? '<p class="bb-fb-text"></p>' : '') +
      (fb.canRetry && !it.open ? '<div class="bb-q-actions"><button class="bc-btn is-outline" type="button" id="again' + i + '">Try again</button></div>' : '');
    if (fb.feedback) box.querySelector('.bb-fb-text').textContent = fb.feedback;
    if ($('again' + i)) $('again' + i).onclick = () => openRetry([i]);
    if (fb.marks < fb.max) mountHelp(i);
  }
  // The AI help for question i. Play: after a mistake. Learn: at any time, free.
  function mountHelp(i) {
    const it = G.S.exam.items[i];
    if (!window.BCExamHelp || !$('help' + i)) return;
    window.BCExamHelp.mount($('help' + i), { qid: G.S.exam.qs[i].qid, label: G.learn ? 'Ask the AI for help (free)' : 'I need help',
      answer: () => it.marked || it.answer || '',
      api: G.learn && window.ExamGame ? { helpGet: q => window.ExamGame.helpGet(q, true), help: (q, s, a) => window.ExamGame.help(q, s, a, true) } : undefined });
  }

  // ---------------------------------------------------------------- Learn mode: worked examples (op similar)
  const exState = {};
  function drawExample(i) {
    const box = $('ex' + i), q = G.S.exam.qs[i]; if (!box) return;
    const e = exState[q.qid] || (exState[q.qid] = { open: false, loading: false, err: '', data: null, shown: [] });
    if (!e.open) {
      box.innerHTML = '<button type="button" class="bc-btn is-outline bb-ex-btn" id="exGo' + i + '">See a worked example</button>' +
        (e.err ? '<p class="bb-q-err">' + esc(e.err) + '</p>' : '');
      $('exGo' + i).onclick = () => { e.open = true; if (!e.data) loadExample(i); else drawExample(i); };
      return;
    }
    if (e.loading || !e.data) { box.innerHTML = '<div class="bb-ex-card"><p class="bb-ex-note">Finding a worked example...</p></div>'; return; }
    const d = e.data;
    box.innerHTML = '<div class="bb-ex-card" role="region" aria-label="Worked example">' +
      '<div class="bb-ex-head"><b>Worked example</b><span class="bb-ex-note">A different question, with its answer. Use it to see how to answer yours.</span></div>' +
      '<p class="bb-ex-label">Example question (' + d.marks + (d.marks === 1 ? ' mark' : ' marks') + ')</p><div class="bb-ex-q" id="exQ' + i + '"></div>' +
      '<p class="bb-ex-label">Model answer</p><div class="bb-ex-model" id="exM' + i + '"></div>' +
      (d.fallback ? '<p class="bb-ex-label">How to work it out</p><div class="bb-ex-model" id="exF' + i + '"></div>' : '') +
      '<div class="bb-q-actions">' + (d.count > 1 ? '<button type="button" class="bc-btn is-outline" id="exMore' + i + '">Show another example</button>' : '') +
      '<button type="button" class="bc-btn is-text" id="exHide' + i + '">Hide example</button></div></div>';
    if (window.BCExamQuestion) window.BCExamQuestion.render($('exQ' + i), { text: d.text, blocks: d.blocks || null });
    else $('exQ' + i).textContent = d.text;
    $('exM' + i).textContent = d.model;
    if (d.fallback) $('exF' + i).textContent = d.fallback;
    if ($('exMore' + i)) $('exMore' + i).onclick = () => loadExample(i);
    $('exHide' + i).onclick = () => { e.open = false; drawExample(i); };
  }
  function loadExample(i) {
    const q = G.S.exam.qs[i], e = exState[q.qid], r = G.S.exam;
    if (e.loading) return;
    if (!api().similar) { e.open = false; e.err = 'Worked examples are not ready yet. Reload the page.'; drawExample(i); return; }
    e.loading = true; e.err = '';
    drawExample(i);
    call(() => api().similar(G.setId, q.qid, e.shown)).then(d => {
      e.loading = false;
      if (d && d.qid && d.model) {
        e.data = d;
        if (e.shown.indexOf(d.qid) < 0) e.shown.push(d.qid); else e.shown = [d.qid];
      } else { e.open = false; e.err = 'There is no worked example for this question yet. Ask the AI for help instead.'; }
      if (G.S && G.S.exam === r) drawExample(i);
    }, err => {
      e.loading = false; e.open = !!e.data; e.err = errText(err);
      if (G.S && G.S.exam === r) drawExample(i);
    });
  }
  // Learn mode: swap a question that did not get full marks for a new one; it pays what the round has left.
  function newQuestion() {
    const r = G.S.exam;
    if (sending || !G.learn) return;
    r.base = r.paid || 0; r.qs = null; r.items = null; r.intro = false;
    G.save(); startRound(true);
  }
  function openRetry(list) {
    const r = G.S.exam;
    list.forEach(i => { const it = r.items[i]; if (it.fb && it.fb.canRetry && !it.open) { it.open = true; it.attempt = 2; it.err = ''; } });
    G.save(); showRound();
    const i0 = list[0];
    setTimeout(() => {
      const el = $('qb' + i0); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'start' });
      try { ansBoxes[i0].focus(); } catch (e) { }
    }, 30);
  }

  function updateActs() {
    const r = G.S.exam, acts = $('roundActs'); if (!acts) return;
    const open = [], retry = []; let unmarked = 0, stuck = 0;
    r.items.forEach((it, i) => {
      if (canSend(it)) open.push(i);
      if (!it.fb) { unmarked++; if (it.err) stuck++; }
      if (it.fb && it.fb.canRetry && !it.open) retry.push(i);
    });
    const ready = open.length && open.every(i => { const t = ansBoxes[i] ? ansBoxes[i].text() : r.items[i].answer; return String(t || '').trim(); });
    let h = '';
    if (open.length) h += '<button class="bc-btn bb-big" id="submitAll"' + (ready && !sending ? '' : ' disabled') + '>' + (sending ? 'Marking...' : sendFailed ? 'Send again' : open.length === 1 ? 'Submit' : 'Submit all') + '</button>';
    if (!open.length && retry.length) h += '<button class="bc-btn is-outline" id="againAll">' + (r.items.length === 1 ? 'Try again' : 'Try again on the wrong ones') + '</button>';
    const notFull = r.items.some(it => it.fb && it.fb.marks < it.fb.max);
    if (G.learn && !sending && !open.length && !retry.length && notFull && r.pool - (r.paid || 0) > 0) h += '<button class="bc-btn is-outline" id="newQ">Try a new question</button>';
    if (!sending && !unmarked) h += '<button class="bc-btn' + (open.length ? ' is-outline' : ' bb-big') + '" id="toBuild">Build the bridge</button>';
    else if (!sending && (sendFailed || stuck)) h += '<button class="bc-btn is-text bb-skip" id="skipRound">Skip (no coins)</button>';
    acts.innerHTML = h;
    if ($('skipRound')) $('skipRound').onclick = finishRound;
    const se = $('sendErr');
    if (se) { se.hidden = !sendFailed || sending; se.textContent = sendFailed; }
    if ($('submitAll')) $('submitAll').onclick = submitAll;
    if ($('againAll')) $('againAll').onclick = () => openRetry(retry);
    if ($('newQ')) $('newQ').onclick = newQuestion;
    if ($('toBuild')) $('toBuild').onclick = finishRound;
    const tot = $('roundTotal');
    if (r.items.some(it => it.fb && it.fb.marks != null)) { tot.hidden = false; tot.textContent = 'This round: +' + (r.paid || 0) + ' coins'; }
    else tot.hidden = true;
  }

  function sendAnswers(items) {
    const a = api();
    if (a.submitMany) return call(() => a.submitMany(items));
    return Promise.all(items.map(it => call(() => a.submit(it.qid, it.answer, it.attempt, '', it.rid)).then(res => res, e => ({ qid: it.qid, error: errText(e) }))));
  }
  function submitAll() {
    const S = G.S, r = S.exam, idx = [];
    if (sending) return;
    r.items.forEach((it, i) => { if (canSend(it)) idx.push(i); });
    if (!idx.length) return;
    for (const k of idx) if (!String(ansBoxes[k] ? ansBoxes[k].text() : '').trim()) { try { ansBoxes[k].focus(); } catch (e) { } return; }
    const payload = idx.map(i => {
      const it = r.items[i];
      it.answer = ansBoxes[i].text(); it.doc = ansBoxes[i].doc(); if (ansBoxes[i].state) it.bs = ansBoxes[i].state(); it.err = '';
      if (!it.rid) it.rid = api().newRid ? api().newRid() : 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      return { qid: r.qs[i].qid, answer: it.answer, attempt: it.attempt, image: '', rid: it.rid };
    });
    G.save();
    sending = true; sendFailed = '';
    idx.forEach(i => { ansBoxes[i].setReadOnly(true); if ($('err' + i)) $('err' + i).hidden = true; });
    updateActs();
    sendAnswers(payload).then(list => {
      sending = false; sendFailed = '';
      if (!G.S || G.S.exam !== r) return;
      let paidNow = 0;
      idx.forEach((i, k) => {
        const it = r.items[i], q = r.qs[i], res = list && list[k];
        if (!res || res.error) {
          it.err = (res && res.error) || 'No mark came back for this question. Submit it again.';
          if (it.attempt === 2 && /no second try/i.test(it.err)) { it.open = false; it.rid = ''; if (it.fb) it.fb.canRetry = false; }
          return;
        }
        const max = Number(res.max) || q.marks, marks = Math.max(0, Math.min(max, Number(res.marks) || 0));
        let pay;
        if (it.attempt === 1) { it.first = marks; pay = Math.round(marks * r.rate); }
        else pay = Math.round(Math.max(0, marks - (it.first || 0)) * r.rate * 0.5);
        const before = it.attempt === 2 && it.fb ? it.fb.pay || 0 : 0;
        it.fb = { marks, max, feedback: res.feedback || '', canRetry: !!res.canRetry && it.attempt === 1 && marks < max, pay: before + pay };
        it.open = false; it.rid = ''; it.marked = it.answer;
        if (pay) { G.S.coins += pay; r.paid += pay; paidNow += pay; }
      });
      G.save();
      if (!$('roundForm')) return;
      G.updateHud(); G.coinPop(paidNow); showRound();
    }, e => {
      sending = false;
      sendFailed = e && e.message === 'Sign in to play.' ? errText(e) + ' Your answers are saved.' : 'Could not reach the marker. Your answers are saved.';
      G.save();
      if (!G.S || G.S.exam !== r || !$('roundForm')) return;
      showRound();
    });
  }
  function finishRound() {
    const S = G.S, r = S.exam;
    if (sending) return;
    sendFailed = '';
    r.qs.forEach((q, i) => {
      const it = r.items[i];
      const best = it.fb && it.fb.marks != null ? Math.max(it.first || 0, it.fb.marks) : 0;
      S.stats.marks += best; S.stats.max += q.marks; r.got = (r.got || 0) + best;
    });
    S.stats.rounds++;
    S.stats.log.push('Exam ' + r.n + ': ' + (r.got || 0) + ' of ' + roundTotal() + ' marks.');
    const paid = r.paid;
    S.exam = null; S.design = null;
    G.toBuild(paid ? 'You earned ' + paid + ' coins. Now build your bridge.' : 'No coins this round. Build with what you have.');
    postResult();
  }

  return { showStart, drawStart, startRound, postResult, roundLine, get sending() { return sending; } };
}
