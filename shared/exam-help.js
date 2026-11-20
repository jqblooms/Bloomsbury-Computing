// "I need help" for an Exam Game question (Data Bridge first; any game using shared/exam-game-client.js can mount it).
// The same help as a lesson slide's "I need help" (shell SlideHelp.gs, js/slide-help.html): after a mistake the student
// asks Haiku up to three questions about this one question; help never gives the answer. The shell does everything
// (limits, the reveal check, names scrubbed, the Slide Help log); this file only draws the button and the panel, in
// the slide help's look, inline under the question (an embedded game's page grows to fit, so nothing is fixed).
//
//   BCExamHelp.mount(el, { qid, answer })   draws the button (and the panel, if it was open) into el.
//     answer: the student's answer that did not earn full marks (sent so help can point to the step that went wrong).
//   The conversation, the open panel and an unsent question are kept per qid, so a game may redraw freely.
(function () {
  'use strict';
  var PER_Q = 3;
  var convo = {};   // qid -> { turns, left, loading, loaded, pending, error, open, draft, available }
  var busy = false;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function api() { return window.ExamGame; }

  function style() {
    if (document.getElementById('egHelpStyle')) return;
    var st = document.createElement('style');
    st.id = 'egHelpStyle';
    st.textContent =
      '.eg-help { margin-top: 10px; display: grid; gap: 8px; justify-items: end; }' +
      '.eg-help-btn { display: inline-flex; align-items: center; gap: 7px; padding: 7px 14px; border: 1px solid var(--brand); border-radius: 999px;' +
      ' background: var(--brand-soft); color: var(--ink); font: 600 14px/1.2 var(--font-body, inherit); cursor: pointer; box-shadow: var(--shadow-2, 0 4px 14px rgba(0, 0, 0, .35)); }' +
      '.eg-help-btn svg { color: var(--brand); }' +
      '.eg-help-btn:hover { background: var(--surface-3); }' +
      '.eg-help-btn:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }' +
      '.eg-help-panel { justify-self: stretch; display: flex; flex-direction: column; width: min(560px, 100%); margin-left: auto; max-height: 520px; overflow: hidden;' +
      ' border: 1px solid var(--line-strong); border-radius: 14px; background: #1b1e24; box-shadow: var(--shadow-3); color: var(--ink); text-align: left; }' +
      '.eg-help-titlebar { display: flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 6px 0 14px; border-bottom: 1px solid var(--line); background: var(--surface-2); }' +
      '.eg-help-title { flex: 1 1 auto; font-size: 13.5px; font-weight: 650; }' +
      '.eg-help-close { display: inline-grid; place-items: center; width: 32px; height: 32px; border: 0; border-radius: 8px; background: transparent; color: var(--muted); cursor: pointer; }' +
      '.eg-help-close:hover { background: var(--surface-3); color: var(--ink); }' +
      '.eg-help-log { flex: 1 1 auto; min-height: 90px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding: 12px 14px; }' +
      '.eg-help-msg { max-width: 92%; padding: 8px 11px; border-radius: 11px; font-size: 14px; line-height: 1.5; white-space: pre-wrap; overflow-wrap: anywhere; }' +
      '.eg-help-msg.is-me { align-self: flex-end; background: var(--brand-soft); color: var(--ink); }' +
      '.eg-help-msg.is-help { align-self: flex-start; background: var(--surface-2); border: 1px solid var(--line); }' +
      '.eg-help-status { color: var(--muted); font-size: 13px; line-height: 1.45; }' +
      '.eg-help-form { display: grid; gap: 6px; padding: 10px 12px 12px; border-top: 1px solid var(--line); }' +
      '.eg-help-input { width: 100%; box-sizing: border-box; min-height: 52px; resize: vertical; padding: 8px 10px; border: 1px solid var(--line-strong); border-radius: 9px;' +
      ' background: var(--surface); color: var(--ink); font: inherit; font-size: 14px; }' +
      '.eg-help-input[hidden] { display: none; }' +
      '.eg-help-row { display: flex; align-items: center; gap: 10px; }' +
      '.eg-help-left { flex: 1 1 auto; color: var(--muted); font-size: 12.5px; }';
    document.head.appendChild(st);
  }

  // Pure: the panel's contents (as js/slide-help.html slideHelpView).
  function view(c) {
    var items = [];
    (c.turns || []).forEach(function (t) { items.push({ who: 'me', text: t.q }); items.push({ who: 'help', text: t.a }); });
    if (c.pending) items.push({ who: 'me', text: c.pending });
    var left = Math.max(0, Number(c.left) || 0);
    var status = c.loading ? 'Loading...' : c.pending ? 'Thinking...' : (c.error || '');
    if (!items.length && !status) status = 'Ask about the part you are stuck on. Help will not tell you the answer, but it will show you how to find it.';
    return { items: items, left: left, status: status,
      leftText: left === 0 ? 'No questions left on this question. Ask your teacher.' : left + (left === 1 ? ' question left' : ' questions left'),
      canAsk: left > 0 && !busy && !c.loading };
  }

  function state(qid) {
    return convo[qid] || (convo[qid] = { turns: [], left: PER_Q, loading: false, loaded: false, pending: '', error: '', open: false, draft: '', available: true });
  }

  var ICON = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.6 9.2a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2.2-2.4 3.6"/><path d="M12 17.2h.01"/></svg>';
  var CLOSE = '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';

  var mounted = {};   // qid -> { el, opts }

  function mount(el, opts) {
    if (!el || !opts || !opts.qid || !api() || !api().help) return null;
    style();
    var qid = String(opts.qid);
    mounted[qid] = { el: el, opts: opts };
    draw(qid);
    return { refresh: function () { draw(qid); } };
  }

  function draw(qid) {
    var m = mounted[qid];
    if (!m || !m.el.isConnected) return;
    var c = state(qid), el = m.el, v = view(c);
    var keepFocus = document.activeElement && el.contains(document.activeElement) && document.activeElement.classList.contains('eg-help-input');
    var h = '<div class="eg-help">';
    if (!c.open) h += '<button type="button" class="eg-help-btn">' + ICON + '<span>I need help</span></button>';
    else {
      h += '<div class="eg-help-panel" role="dialog" aria-label="Help with this question">' +
        '<div class="eg-help-titlebar"><span class="eg-help-title">Help with this question</span>' +
        '<button type="button" class="eg-help-close" title="Close" aria-label="Close help">' + CLOSE + '</button></div>' +
        '<div class="eg-help-log" aria-live="polite">' + v.items.map(function (it) { return '<div class="eg-help-msg is-' + it.who + '">' + esc(it.text) + '</div>'; }).join('') +
        (v.status ? '<div class="eg-help-status">' + esc(v.status) + '</div>' : '') + '</div>' +
        '<form class="eg-help-form"><textarea class="eg-help-input" rows="2" maxlength="300" placeholder="What are you stuck on?" aria-label="Your question"' + (v.left === 0 ? ' hidden' : '') + '></textarea>' +
        '<div class="eg-help-row"><span class="eg-help-left">' + esc(v.leftText) + '</span><button type="submit" class="bc-btn eg-help-ask"' + (v.canAsk ? '' : ' disabled') + '>Ask</button></div></form></div>';
    }
    h += '</div>';
    el.innerHTML = h;
    var btn = el.querySelector('.eg-help-btn');
    if (btn) btn.onclick = function () { open(qid); };
    if (!c.open) return;
    var log = el.querySelector('.eg-help-log'), input = el.querySelector('.eg-help-input');
    log.scrollTop = log.scrollHeight;
    input.value = c.draft || '';
    input.oninput = function () { c.draft = input.value; };
    input.onkeydown = function (e) {
      // Enter asks, Shift+Enter is a new line, Escape closes. Keys stay inside the box (the game's shortcuts ignore text fields).
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(qid); }
      else if (e.key === 'Escape') { e.preventDefault(); c.open = false; draw(qid); }
      e.stopPropagation();
    };
    el.querySelector('.eg-help-close').onclick = function () { c.open = false; draw(qid); };
    el.querySelector('.eg-help-form').onsubmit = function (e) { e.preventDefault(); ask(qid); };
    if (keepFocus || c.focus) { c.focus = false; try { input.focus({ preventScroll: true }); } catch (e) {} }
  }

  function open(qid) {
    var c = state(qid);
    c.open = true; c.focus = true;
    if (!c.loaded && !c.loading) {
      c.loading = true;
      api().helpGet(qid).then(function (res) {
        c.loading = false;
        if (res && res.ok) { c.loaded = true; c.turns = res.turns || []; c.left = res.left; if (!res.available) c.error = 'Help is not available just now.'; }
        else if (res && res.message) c.error = res.message;
        draw(qid);
        if (c.askWhenLoaded) { c.askWhenLoaded = false; ask(qid); }
      }, function (e) { c.loading = false; c.error = (e && e.message) || 'Help could not load. Try again in a minute.'; draw(qid); });
    }
    draw(qid);
  }

  function ask(qid) {
    var c = state(qid), m = mounted[qid];
    if (busy) return;
    if (c.loading) { c.askWhenLoaded = true; return; }
    if (c.left <= 0) return;
    var q = String(c.draft || '').trim();
    if (!q) { c.error = 'Type your question first.'; draw(qid); return; }
    busy = true; c.error = ''; c.pending = q; c.draft = ''; c.focus = true;
    draw(qid);
    var answer = m && m.opts && typeof m.opts.answer === 'function' ? m.opts.answer() : (m && m.opts ? m.opts.answer : '');
    var finish = function (res, err) {
      busy = false; c.pending = '';
      if (res && res.ok) { c.turns = res.turns || c.turns.concat([{ q: q, a: res.reply }]); c.left = res.left; }
      else {
        if (res && res.left != null) c.left = res.left;
        c.error = (res && res.message) || (err && err.message) || 'Help is busy. Try again in a minute.';
        if (!c.draft) c.draft = q;
      }
      c.focus = true;
      draw(qid);
    };
    api().help(qid, q, answer || '').then(function (res) { finish(res); }, function (e) { finish(null, e); });
  }

  window.BCExamHelp = { mount: mount, view: view };
})();
