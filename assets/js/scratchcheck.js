// Scratch Challenges, part 5 of 5: the panel beside TurboWarp.
//
// Active only with ?scratchcheck in the URL (the site's Scratch Challenges
// app; a lesson opens one challenge with &challenge=<id>). It loads the
// challenge's starter project, lists its tasks, and "Check my project"
// runs every task's test on the real project (scratchcheck-tester.js),
// with the stage visible so the student can watch. Results are kept in
// this browser (scratchcheck:done:<id>, mirrored to the account by
// shared/cloud-save.js) and sent to the site as BC_SCRATCH_CHECK, which
// the shell records as a lesson answer for the challenge's lesson.
//
// Support mode (shared/bc-support.js) shows the blocks for each unfinished
// task, faded: the model script, then the script with its values blanked,
// then just the blocks in a jumble, then nothing, as the student succeeds.
(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  if (!params.has('scratchcheck')) return;
  var K = window.ScratchCheckKit, TT = window.ScratchCheckTester;
  if (!K || !TT) return;

  var LESSONS = [
    ['y6-icontrol-l1', '6.2.1', 'Events and Coordinates'],
    ['y6-igame-l2', '6.2.2', 'Loops and Pong'],
    ['y6-iplan-l3', '6.2.3', 'Variables and Decisions'],
    ['y6-icode-l4', '6.2.4', 'Costumes, Backdrops and Messages'],
    ['y6-idevelop-l5', '6.2.5', 'Plan and Build Your Own Game'],
    ['y6-idebug-l6', '6.2.6', 'Test and Debug']
  ];
  function lessonInfo(id) { return LESSONS.filter(function (l) { return l[0] === id; })[0] || [id, '', '']; }

  var DONE_PREFIX = 'scratchcheck:done:';
  var PROJECT_PREFIX = 'scratchcheck:project:';
  var PANEL_KEY = 'scratchcheck:panel';

  var state = {
    vm: null, challenge: null, results: {}, checking: false, current: null, abort: false,
    lastFingerprint: '', lastReport: '', saveTimer: null, loading: false, collapsed: false, saveNote: ''
  };
  var els = {};

  function store(key, value) { try { if (value == null) localStorage.removeItem(key); else localStorage.setItem(key, value); return true; } catch (e) { return false; } }
  function load(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function progressFor(id) {
    try { return JSON.parse(load(DONE_PREFIX + id) || 'null') || { passed: [], done: false }; } catch (e) { return { passed: [], done: false }; }
  }
  function required(challenge) { return challenge.tasks.filter(function (t) { return !t.bonus; }); }

  // ---- icons (line drawings in currentColor) ----
  var ICON = {
    list: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/></svg>',
    collapse: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
    expand: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
    pass: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.6 2.6L16 9.5"/></svg>',
    fail: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></svg>',
    todo: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>',
    run: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 3a9 9 0 1 0 9 9"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3l14 9-14 9z"/></svg>',
    reset: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>',
    star: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>',
    next: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };

  // ---- styles (the site's tokens, scoped to the panel) ----
  function injectStyles() {
    var css = [
      '.scc-panel{--bg:#0f1115;--surface:#171a20;--surface-2:#1d2128;--surface-3:#252a33;--line:#2b3039;--line-strong:#3b424e;--ink:#e8eaed;--ink-soft:#c9cdd4;--muted:#9aa0a6;--brand:#8ab4f8;--brand-soft:rgba(138,180,248,.14);--brand-solid:#1a73e8;--good:#81c995;--good-soft:rgba(129,201,149,.13);--bad:#f28b82;--bad-soft:rgba(242,139,130,.13);--warn:#fdd663;',
      'position:fixed;top:0;right:0;bottom:0;width:var(--scc-w);z-index:50;display:flex;flex-direction:column;background:var(--surface);color:var(--ink);border-left:1px solid var(--line);font:14px/1.45 Roboto,system-ui,-apple-system,"Segoe UI",sans-serif;box-sizing:border-box}',
      '.scc-panel *{box-sizing:border-box}',
      'body.scc-active{--scc-w:340px}',
      'body.scc-active.scc-collapsed{--scc-w:48px}',
      'body.scc-active #app{position:fixed!important;top:0;left:0;bottom:0;right:var(--scc-w);width:auto!important;height:auto!important}',
      '.scc-head{display:flex;align-items:flex-start;gap:8px;padding:14px 14px 10px;border-bottom:1px solid var(--line)}',
      '.scc-head-text{flex:1;min-width:0}',
      '.scc-kicker{margin:0;color:var(--brand);font:700 11px/1.2 Figtree,Roboto,sans-serif;letter-spacing:.08em;text-transform:uppercase}',
      '.scc-title{margin:3px 0 0;font:800 19px/1.2 Figtree,Roboto,sans-serif;text-wrap:balance}',
      '.scc-icon-btn{flex:none;display:grid;place-items:center;width:32px;height:32px;border:1px solid var(--line-strong);border-radius:8px;background:var(--surface-2);color:var(--ink-soft);cursor:pointer}',
      '.scc-icon-btn:hover{background:var(--surface-3);color:var(--ink)}',
      '.scc-icon-btn:focus-visible,.scc-btn:focus-visible,.scc-menu-item:focus-visible{outline:2px solid var(--brand);outline-offset:2px}',
      '.scc-body{flex:1;overflow-y:auto;padding:12px 14px 16px}',
      '.scc-brief{margin:0 0 12px;color:var(--ink-soft)}',
      '.scc-meter{display:flex;align-items:center;gap:10px;margin:0 0 12px;color:var(--muted);font-size:12.5px}',
      '.scc-meter-bar{flex:1;height:6px;border-radius:3px;background:var(--surface-3);overflow:hidden}',
      '.scc-meter-fill{height:100%;background:var(--good);border-radius:3px;transition:width .3s}',
      '.scc-tasks{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}',
      '.scc-task{padding:10px 10px 10px 8px;border:1px solid var(--line);border-radius:10px;background:var(--surface-2)}',
      '.scc-task-row{display:flex;gap:8px;align-items:flex-start}',
      '.scc-task-icon{flex:none;margin-top:1px;color:var(--muted)}',
      '.scc-task.is-pass{border-color:rgba(129,201,149,.45)} .scc-task.is-pass .scc-task-icon{color:var(--good)}',
      '.scc-task.is-fail{border-color:rgba(242,139,130,.5)} .scc-task.is-fail .scc-task-icon{color:var(--bad)}',
      '.scc-task.is-running{border-color:var(--brand)} .scc-task.is-running .scc-task-icon{color:var(--brand);animation:scc-spin 1s linear infinite}',
      '@keyframes scc-spin{to{transform:rotate(360deg)}}',
      '@media (prefers-reduced-motion:reduce){.scc-task.is-running .scc-task-icon{animation:none}}',
      '.scc-task-text{flex:1}',
      '.scc-bonus{display:inline-block;margin-right:4px;padding:0 6px;border-radius:9px;background:rgba(253,214,99,.14);color:var(--warn);font-size:11px;font-weight:700;letter-spacing:.03em}',
      '.scc-said{margin:8px 0 0 26px;padding:7px 9px;border-radius:8px;background:var(--bad-soft);color:#fbd3cf;font-size:13px}',
      '.scc-hint{margin:8px 0 0 26px;padding:8px;border-radius:8px;border:1px dashed var(--line-strong);background:#12151b;overflow-x:auto;user-select:none;-webkit-user-select:none;pointer-events:none}',
      '.scc-hint-label{display:block;margin-bottom:4px;color:var(--muted);font-size:11.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase}',
      '.scc-hint .scratchblocks{opacity:.62} .scc-hint svg{display:block;max-width:100%;height:auto}',
      '.scc-tip{color:var(--ink-soft);font-size:13px}',
      '.scc-hint-jumble{display:flex;flex-wrap:wrap;gap:6px;align-items:flex-start}',
      '.scc-foot{padding:12px 14px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:10px}',
      '.scc-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:40px;padding:0 16px;border-radius:20px;border:1px solid var(--line-strong);background:var(--surface-2);color:var(--ink);font:600 14px/1 Roboto,sans-serif;cursor:pointer}',
      '.scc-btn:hover{background:var(--surface-3)}',
      '.scc-btn.is-primary{background:var(--brand-solid);border-color:var(--brand-solid);color:#fff}',
      '.scc-btn.is-primary:hover{background:#2b7de9}',
      '.scc-btn[disabled]{opacity:.55;cursor:default}',
      '.scc-foot-row{display:flex;align-items:center;justify-content:space-between;gap:8px}',
      '.scc-link{background:none;border:0;padding:4px 0;color:var(--muted);font:500 13px Roboto,sans-serif;display:inline-flex;gap:6px;align-items:center;cursor:pointer}',
      '.scc-link:hover{color:var(--ink)}',
      '.scc-done{margin:0 0 12px;padding:12px;border-radius:10px;background:var(--good-soft);border:1px solid rgba(129,201,149,.45);color:#cdebd6;display:flex;gap:10px;align-items:center}',
      '.scc-done strong{color:var(--good)}',
      '.scc-note{margin:10px 0 0;color:var(--muted);font-size:12.5px}',
      '.scc-menu-group{margin:0 0 14px}',
      '.scc-menu-group h3{margin:0 0 6px;color:var(--muted);font:700 12px/1.3 Figtree,Roboto,sans-serif;letter-spacing:.05em;text-transform:uppercase}',
      '.scc-menu-item{width:100%;display:flex;align-items:center;gap:10px;margin:0 0 6px;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--surface-2);color:var(--ink);text-align:left;font:600 14px Roboto,sans-serif;cursor:pointer}',
      '.scc-menu-item:hover{border-color:var(--brand);background:var(--surface-3)}',
      '.scc-menu-item .scc-menu-state{margin-left:auto;color:var(--muted);font-size:12px;font-weight:500;white-space:nowrap}',
      '.scc-menu-item.is-done .scc-menu-state{color:var(--good)}',
      '.scc-rail{display:none;flex-direction:column;align-items:center;gap:10px;padding:10px 0}',
      'body.scc-collapsed .scc-head,body.scc-collapsed .scc-body,body.scc-collapsed .scc-foot{display:none}',
      'body.scc-collapsed .scc-rail{display:flex}',
      '.scc-rail-count{writing-mode:vertical-rl;color:var(--muted);font:600 12px Roboto,sans-serif}',
      '.scc-shield{position:fixed;top:0;left:0;bottom:0;right:var(--scc-w);z-index:49;display:none;cursor:progress}',
      'body.scc-checking .scc-shield{display:block}',
      '.scc-shield-banner{position:absolute;left:50%;top:10px;transform:translateX(-50%);max-width:min(560px,90%);padding:9px 16px;border-radius:20px;background:#0b1a33;border:1px solid var(--brand,#8ab4f8);color:#e8eaed;font:600 13.5px Roboto,sans-serif;box-shadow:0 8px 28px rgba(0,0,0,.5)}'
    ].join('\n');
    var style = document.createElement('style');
    style.id = 'scratchcheck-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ---- layout ----
  function buildPanel() {
    document.body.classList.add('scc-active');
    state.collapsed = load(PANEL_KEY) === 'collapsed';
    document.body.classList.toggle('scc-collapsed', state.collapsed);
    var panel = document.createElement('aside');
    panel.className = 'scc-panel';
    panel.setAttribute('aria-label', 'Scratch Challenge');
    panel.innerHTML =
      '<div class="scc-rail"><button type="button" class="scc-icon-btn" data-act="expand" title="Show the challenge" aria-label="Show the challenge">' + ICON.expand + '</button><span class="scc-rail-count"></span></div>' +
      '<header class="scc-head"><div class="scc-head-text"><p class="scc-kicker"></p><h2 class="scc-title"></h2></div>' +
      '<button type="button" class="scc-icon-btn" data-act="menu" title="All challenges" aria-label="All challenges">' + ICON.list + '</button>' +
      '<button type="button" class="scc-icon-btn" data-act="collapse" title="Hide the panel" aria-label="Hide the panel">' + ICON.collapse + '</button></header>' +
      '<div class="scc-body"></div>' +
      '<footer class="scc-foot"></footer>';
    document.body.appendChild(panel);
    var shield = document.createElement('div');
    shield.className = 'scc-shield';
    shield.innerHTML = '<div class="scc-shield-banner" role="status" aria-live="polite"></div>';
    document.body.appendChild(shield);
    els.panel = panel;
    els.kicker = panel.querySelector('.scc-kicker');
    els.title = panel.querySelector('.scc-title');
    els.body = panel.querySelector('.scc-body');
    els.foot = panel.querySelector('.scc-foot');
    els.railCount = panel.querySelector('.scc-rail-count');
    els.banner = shield.querySelector('.scc-shield-banner');
    panel.addEventListener('click', onPanelClick);
    relayout();
  }

  function relayout() {
    [0, 120, 400].forEach(function (ms) { setTimeout(function () { window.dispatchEvent(new Event('resize')); }, ms); });
  }

  function onPanelClick(e) {
    var btn = e.target.closest('[data-act]');
    if (!btn) return;
    var act = btn.getAttribute('data-act');
    if (act === 'collapse' || act === 'expand') {
      state.collapsed = act === 'collapse';
      store(PANEL_KEY, state.collapsed ? 'collapsed' : null);
      document.body.classList.toggle('scc-collapsed', state.collapsed);
      relayout();
    } else if (act === 'menu') {
      if (!state.checking) showMenu();
    } else if (act === 'open') {
      openChallenge(btn.getAttribute('data-id'));
    } else if (act === 'check') {
      runChecks();
    } else if (act === 'stop') {
      state.abort = true;
    } else if (act === 'reset') {
      if (window.confirm('Start this challenge again from the starter project? Your blocks for it will be lost.')) resetChallenge();
    } else if (act === 'next') {
      var next = nextChallenge();
      if (next) openChallenge(next.id);
    }
  }

  // ---- menu ----
  function showMenu() {
    saveProjectNow();
    state.challenge = null;
    els.kicker.textContent = 'Scratch Challenges';
    els.title.textContent = 'Choose a challenge';
    var html = LESSONS.map(function (l) {
      var list = K.challenges.filter(function (c) { return c.lesson === l[0]; });
      if (!list.length) return '';
      return '<div class="scc-menu-group"><h3>' + esc(l[1] + ' ' + l[2]) + '</h3>' + list.map(function (c) {
        var p = progressFor(c.id), total = required(c).length;
        var passed = required(c).filter(function (t) { return p.passed.indexOf(t.id) !== -1; }).length;
        return '<button type="button" class="scc-menu-item' + (p.done ? ' is-done' : '') + '" data-act="open" data-id="' + esc(c.id) + '">' +
          (p.done ? ICON.pass : ICON.todo) + '<span>' + esc(c.title) + '</span><span class="scc-menu-state">' + (p.done ? 'Done' : passed + ' of ' + total) + '</span></button>';
      }).join('') + '</div>';
    }).join('');
    els.body.innerHTML = html;
    els.foot.innerHTML = '<p class="scc-note" style="margin:0">Each challenge starts from its own project. Your blocks are kept in this browser.</p>';
    els.railCount.textContent = 'Challenges';
  }

  // ---- one challenge ----
  function openChallenge(id) {
    var challenge = K.find(id);
    if (!challenge) return showMenu();
    if (state.challenge && state.challenge.id !== id) saveProjectNow();
    state.challenge = challenge;
    state.results = {};
    state.lastFingerprint = '';
    state.saveNote = '';
    var progress = progressFor(id);
    challenge.tasks.forEach(function (t) { if (progress.passed.indexOf(t.id) !== -1) state.results[t.id] = { ok: true, remembered: true }; });
    try { history.replaceState(null, '', location.pathname + '?' + withParam('challenge', id)); } catch (e) {}
    render();
    loadChallengeProject(challenge);
  }

  function withParam(name, value) {
    var p = new URLSearchParams(location.search);
    p.set(name, value);
    return p.toString();
  }

  function nextChallenge() {
    var list = K.challenges, i = list.indexOf(state.challenge);
    return i >= 0 && i + 1 < list.length ? list[i + 1] : null;
  }

  function counts() {
    var req = required(state.challenge);
    var passed = req.filter(function (t) { return state.results[t.id] && state.results[t.id].ok; }).length;
    return { passed: passed, total: req.length };
  }

  function render() {
    var c = state.challenge;
    if (!c) return;
    var info = lessonInfo(c.lesson);
    els.kicker.textContent = 'Scratch Challenge' + (info[1] ? ' · ' + info[1] : '');
    els.title.textContent = c.title;
    var n = counts();
    var progress = progressFor(c.id);
    var reveal = supportReveal();
    var html = '';
    if (progress.done && n.passed === n.total) {
      html += '<div class="scc-done">' + ICON.star + '<span><strong>Challenge complete.</strong> Every check passes.</span></div>';
    }
    html += '<p class="scc-brief">' + esc(c.brief) + '</p>';
    html += '<div class="scc-meter"><div class="scc-meter-bar"><div class="scc-meter-fill" style="width:' + Math.round(100 * n.passed / Math.max(1, n.total)) + '%"></div></div><span>' + n.passed + ' of ' + n.total + ' checks</span></div>';
    html += '<ol class="scc-tasks">' + c.tasks.map(function (t) {
      var r = state.results[t.id];
      var cls = state.current === t.id ? 'is-running' : (r ? (r.ok ? 'is-pass' : 'is-fail') : '');
      var icon = state.current === t.id ? ICON.run : (r ? (r.ok ? ICON.pass : ICON.fail) : ICON.todo);
      var extra = '';
      if (r && !r.ok && r.msg) extra += '<p class="scc-said">' + esc(r.msg) + '</p>';
      if (reveal > 0 && !(r && r.ok) && t.hint) extra += hintHtml(t.hint, reveal);
      if (reveal > 0.5 && !(r && r.ok) && t.tip) extra += '<div class="scc-hint scc-tip"><span class="scc-hint-label">How to find it</span>' + esc(t.tip) + '</div>';
      return '<li class="scc-task ' + cls + '"><div class="scc-task-row"><span class="scc-task-icon">' + icon + '</span><span class="scc-task-text">' +
        (t.bonus ? '<span class="scc-bonus">BONUS</span>' : '') + esc(t.text) + '</span></div>' + extra + '</li>';
    }).join('') + '</ol>';
    if (state.saveNote) html += '<p class="scc-note">' + esc(state.saveNote) + '</p>';
    els.body.innerHTML = html;
    els.railCount.textContent = n.passed + ' of ' + n.total;
    renderFoot();
    renderHints();
  }

  function renderFoot() {
    var n = counts();
    var complete = n.passed === n.total && n.total > 0;
    var next = nextChallenge();
    els.foot.innerHTML =
      (state.checking ?
        '<button type="button" class="scc-btn" data-act="stop">Stop checking</button>' :
        '<button type="button" class="scc-btn is-primary" data-act="check">' + ICON.check + 'Check my project</button>') +
      (complete && next && !state.checking ? '<button type="button" class="scc-btn" data-act="next">Next: ' + esc(next.title) + ICON.next + '</button>' : '') +
      '<div class="scc-foot-row"><span class="scc-support"></span>' +
      '<button type="button" class="scc-link" data-act="reset"' + (state.checking ? ' disabled' : '') + '>' + ICON.reset + 'Start again</button></div>';
    var slot = els.foot.querySelector('.scc-support');
    if (window.BCSupport && slot) window.BCSupport.mountToggle(slot, 'Support');
  }

  // ---- support: the task's blocks, faded as the student succeeds ----
  function fader() { return window.BCSupport && state.challenge ? window.BCSupport.fader('scratchcheck:' + state.challenge.id) : null; }
  function supportReveal() {
    if (!window.BCSupport || !window.BCSupport.isOn()) return 0;
    var f = fader();
    return f ? f.reveal() : 1;
  }
  function blankValues(text) {
    return text.replace(/\((-?[\d.]+)\)/g, '( )').replace(/\[(?![^\]]* v\])[^\]]*\]/g, '[ ]');
  }
  function hintHtml(hint, reveal) {
    if (reveal > 0.9) {
      return '<div class="scc-hint"><span class="scc-hint-label">Blocks to build</span><pre class="scc-blocks">' + esc(hint) + '</pre></div>';
    }
    if (reveal > 0.5) {
      return '<div class="scc-hint"><span class="scc-hint-label">Blocks to build, you choose the values</span><pre class="scc-blocks">' + esc(blankValues(hint)) + '</pre></div>';
    }
    var lines = hint.split('\n').map(function (l) { return l.trim(); }).filter(function (l) { return l && l !== 'end' && l !== 'else'; });
    for (var i = lines.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var tmp = lines[i]; lines[i] = lines[j]; lines[j] = tmp; }
    return '<div class="scc-hint"><span class="scc-hint-label">Blocks you need, in some order</span><div class="scc-hint-jumble">' +
      lines.map(function (l) { return '<pre class="scc-blocks">' + esc(blankValues(l)) + '</pre>'; }).join('') + '</div></div>';
  }
  function renderHints() {
    if (!window.scratchblocks) return;
    try {
      window.scratchblocks.renderMatching('.scc-panel pre.scc-blocks', { style: 'scratch3', languages: ['en'], scale: 0.62 });
    } catch (e) {}
  }

  // ---- projects ----
  function toBase64(buffer) {
    var bytes = new Uint8Array(buffer), out = '', chunk = 0x8000;
    for (var i = 0; i < bytes.length; i += chunk) out += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    return btoa(out);
  }
  function fromBase64(text) {
    var raw = atob(text), bytes = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return bytes.buffer;
  }

  function loadChallengeProject(challenge, fresh) {
    var saved = fresh ? null : load(PROJECT_PREFIX + challenge.id);
    var data;
    try { data = saved ? fromBase64(saved) : K.buildProject(challenge.starter); } catch (e) { data = K.buildProject(challenge.starter); }
    state.loading = true;
    return state.vm.loadProject(data).catch(function () {
      return state.vm.loadProject(K.buildProject(challenge.starter));
    }).then(function () {
      state.loading = false;
      state.lastFingerprint = '';
      try { state.vm.setEditingTarget(state.vm.runtime.targets.filter(function (t) { return !t.isStage; })[0].id); } catch (e) {}
    }).catch(function () { state.loading = false; });
  }

  function resetChallenge() {
    var c = state.challenge;
    if (!c) return;
    store(PROJECT_PREFIX + c.id, null);
    state.results = {};
    render();
    loadChallengeProject(c, true);
  }

  function scheduleSave() {
    if (state.loading || state.checking || !state.challenge) return;
    clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(saveProjectNow, 2500);
  }

  function saveProjectNow() {
    clearTimeout(state.saveTimer);
    var c = state.challenge;
    if (!c || state.loading || state.checking || state.selfTesting) return;
    try {
      state.vm.saveProjectSb3().then(function (blob) { return blob.arrayBuffer(); }).then(function (buffer) {
        if (buffer.byteLength > 1500000) {
          state.saveNote = 'This project is too big to keep in the browser. Save it to your computer with File, Save to your computer.';
          return;
        }
        if (!store(PROJECT_PREFIX + c.id, toBase64(buffer))) state.saveNote = 'This browser would not keep your blocks. Save the project to your computer as well.';
      }).catch(function () {});
    } catch (e) {}
  }

  // ---- input shield: the checker drives the project, the student watches ----
  function blockInput(e) {
    if (!state.checking) return;
    if (e.target && e.target.closest && e.target.closest('.scc-panel')) return;
    e.stopImmediatePropagation();
    if (e.type !== 'mousemove' && e.type !== 'touchmove') e.preventDefault();
  }
  ['keydown', 'keyup', 'mousemove', 'mousedown', 'mouseup', 'touchstart', 'touchmove', 'touchend', 'wheel', 'click'].forEach(function (type) {
    window.addEventListener(type, blockInput, { capture: true, passive: false });
  });

  // ---- checking ----
  function withTimeout(promise, ms) {
    return Promise.race([promise, new Promise(function (_, reject) {
      setTimeout(function () { reject(new TT.CheckFail('This check ran out of time. Is something waiting forever?')); }, ms);
    })]);
  }

  async function runChecks() {
    if (state.checking || !state.challenge || state.loading) return;
    var c = state.challenge;
    saveProjectNow();
    state.checking = true;
    state.abort = false;
    document.body.classList.add('scc-checking');
    var t = new TT.Tester(state.vm);
    var fingerprint = t.fingerprint();
    var before = Object.assign({}, state.results);
    t.begin();
    var snap = t.snapshot();
    var results = {};
    try {
      for (var i = 0; i < c.tasks.length; i++) {
        var task = c.tasks[i];
        if (state.abort) break;
        state.current = task.id;
        els.banner.textContent = 'Checking ' + (i + 1) + ' of ' + c.tasks.length + ': ' + task.text;
        render();
        t.restore(snap);
        await t.wait(60);
        try {
          await withTimeout(task.test(t), 15000);
          results[task.id] = { ok: true };
        } catch (err) {
          results[task.id] = { ok: false, msg: err instanceof TT.CheckFail ? err.message : 'The check could not finish (' + (err && err.message ? err.message : err) + ').' };
        }
        state.results[task.id] = results[task.id];
      }
    } finally {
      t.restore(snap);
      t.end();
      state.current = null;
      state.checking = false;
      document.body.classList.remove('scc-checking');
    }
    if (!state.abort && !state.selfTesting) afterCheck(c, results, before, fingerprint !== state.lastFingerprint);
    state.lastFingerprint = fingerprint;
    render();
  }

  function afterCheck(c, results, before, changed) {
    var progress = progressFor(c.id);
    c.tasks.forEach(function (task) {
      if (results[task.id] && results[task.id].ok && progress.passed.indexOf(task.id) === -1) progress.passed.push(task.id);
    });
    var req = required(c);
    var allNow = req.every(function (task) { return results[task.id] && results[task.id].ok; });
    if (allNow) progress.done = true;
    progress.at = Date.now();
    store(DONE_PREFIX + c.id, JSON.stringify(progress));

    // One distinct attempt counts once for the fading support.
    var f = fader();
    if (f && changed) {
      var gained = c.tasks.some(function (task) { return results[task.id] && results[task.id].ok && !(before[task.id] && before[task.id].ok && !before[task.id].remembered); });
      if (gained) f.correct();
      if (!allNow) f.wrong();
    }
    report(c, results, allNow);
  }

  function report(c, results, complete) {
    if (window.parent === window) return;
    var req = required(c);
    var passed = req.filter(function (task) { return results[task.id] && results[task.id].ok; });
    var summary = passed.length + ' of ' + req.length + ' checks' + (complete ? ', complete' : '') + '. ' +
      c.tasks.map(function (task) { return (results[task.id] && results[task.id].ok ? 'PASS ' : 'NOT YET ') + task.text; }).join(' | ');
    if (summary === state.lastReport) return;
    state.lastReport = summary;
    try {
      window.parent.postMessage({ type: 'BC_SCRATCH_CHECK', challengeId: c.id, lessonId: c.lesson, title: c.title,
        passed: passed.length, total: req.length, complete: complete, summary: summary }, '*');
    } catch (e) {}
  }

  // ---- self test: loads a model solution (scratchcheck-solutions.js) and checks it ----
  async function selfTest(id, which) {
    var c = K.find(id);
    if (!c) return { id: id, error: 'no such challenge' };
    state.selfTesting = true;
    state.challenge = c;
    state.results = {};
    render();
    var def = c.starter;
    if (which !== 'starter') {
      var sol = window.ScratchCheckSolutions && window.ScratchCheckSolutions[id];
      if (!sol) return { id: id, error: 'no solution' };
      def = JSON.parse(JSON.stringify(c.starter));
      def.sprites.forEach(function (s) { if (sol[s.name]) s.scripts = sol[s.name]; });
      if (sol.Stage) def.stageScripts = sol.Stage;
      if (sol.variables) def.variables = sol.variables;
      if (sol.extraSprites) def.sprites.push({ name: 'Coin', costumes: [['coin', 'coin']], x: 120, y: 60 });
    }
    state.loading = true;
    await state.vm.loadProject(K.buildProject(def));
    state.loading = false;
    await new Promise(function (r) { setTimeout(r, 400); });
    await runChecks();
    state.selfTesting = false;
    var out = {};
    c.tasks.forEach(function (task) { out[task.id] = state.results[task.id] ? (state.results[task.id].ok ? 'PASS' : 'FAIL: ' + state.results[task.id].msg) : 'NOT RUN'; });
    return { id: id, which: which || 'solution', results: out };
  }

  // ---- boot ----
  function waitFor(test, timeoutMs) {
    var started = Date.now();
    return new Promise(function (resolve, reject) {
      (function tick() {
        var value = null;
        try { value = test(); } catch (e) {}
        if (value) return resolve(value);
        if (Date.now() - started > timeoutMs) return reject(new Error('TurboWarp did not start'));
        setTimeout(tick, 60);
      })();
    });
  }

  function boot(vm) {
    state.vm = vm;
    injectStyles();
    buildPanel();
    vm.on('PROJECT_CHANGED', scheduleSave);
    window.addEventListener('beforeunload', saveProjectNow);
    document.addEventListener('visibilitychange', function () { if (document.hidden) saveProjectNow(); });
    if (window.BCSupport) window.BCSupport.onChange(function () { if (state.challenge && !state.checking) render(); });
    window.ScratchCheck = { open: openChallenge, check: runChecks, selfTest: selfTest, state: state };
    var id = params.get('challenge');
    if (id && K.find(id)) openChallenge(id); else showMenu();
  }

  waitFor(function () {
    var vm = window.vm;
    return vm && vm.runtime && vm.runtime.targets.length > 0 && window.ScratchBlocks && window.ScratchBlocks.getMainWorkspace && window.ScratchBlocks.getMainWorkspace() ? vm : null;
  }, 30000).then(function (vm) {
    setTimeout(function () { boot(vm); }, 400);
  }).catch(function (e) { console.warn('[Scratch Challenges]', e); });
})();
