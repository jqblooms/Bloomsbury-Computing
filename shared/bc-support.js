// Support mode, shared by every app. The teaching rule behind it: show how
// to do something rather than hand over the answer, and take the help away
// as the student gets it right (Pseudocode Blitz's support mode is the
// model).
//
// Three parts:
//
// 1. One switch for the whole site. BCSupport.isOn() / BCSupport.set(on) /
//    BCSupport.onChange(fn). Inside the site the shell remembers it for
//    the signed-in student and tells every app (BC_SUPPORT_REQUEST,
//    BC_SUPPORT_SET -> BC_SUPPORT_STATE), so turning it on in one app turns
//    it on everywhere. Opened on its own, an app keeps it in its own
//    browser storage. BCSupport.mountToggle(el) draws the standard switch.
//
// 2. A live hint for a typed answer: BCSupport.renderTypedHint(el, model,
//    typed, reveal). The model answer sits greyed out under the box and
//    each character turns green or red as the student reaches it (grey
//    until then). Words beyond the reveal fraction become blanks the size
//    of the hidden word. It cannot be selected, copied or dragged.
//
// 3. Fading: BCSupport.fader(key) remembers, per skill, how much help to
//    give: 1 (all of it), 2/3, 1/3, then 0. Three right in a row takes a
//    step away; two wrong in a row gives one back. fader.reveal() is the
//    fraction to pass to renderTypedHint, or to use any other way (how many
//    options to remove, how many steps of a worked example to show).
//
// Load it after the page's own <head> styles (it needs no CSS file):
//   <script src="../shared/bc-support.js?v=20260927"></script>
(function () {
  if (window.BCSupport) return;
  var STORE_KEY = 'bc-support';
  var FADE_PREFIX = 'bc-support-fade:';
  var inFrame = window.parent && window.parent !== window;
  var listeners = [];
  var on = readLocal();
  var heardFromSite = false;

  function readLocal() {
    try { return localStorage.getItem(STORE_KEY) === '1'; } catch (e) { return false; }
  }
  function writeLocal(value) {
    try { localStorage.setItem(STORE_KEY, value ? '1' : '0'); } catch (e) {}
  }
  function apply(value, fromSite) {
    value = !!value;
    if (fromSite) heardFromSite = true;
    writeLocal(value);
    if (value === on) return;
    on = value;
    listeners.slice().forEach(function (fn) { try { fn(on); } catch (e) {} });
  }

  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || d.type !== 'BC_SUPPORT_STATE' || e.source !== window.parent) return;
    apply(d.on, true);
  });
  if (inFrame) {
    try { window.parent.postMessage({ type: 'BC_SUPPORT_REQUEST' }, '*'); } catch (e) {}
  }

  // ---- The live typed-answer hint ----
  function tokenize(text) {
    return String(text || '').trim().split(/\s+/).filter(Boolean);
  }
  // "..." strings compare case-sensitively; everything else ignores case.
  function stringMask(text) {
    var mask = [], inString = false;
    for (var i = 0; i < text.length; i++) {
      if (text[i] === '"') { inString = !inString; mask.push(true); }
      else mask.push(inString);
    }
    return mask;
  }
  // Indentation is shown but not marked: a line of code indented with a
  // tab, or two spaces instead of four, is still the right line.
  function renderLine(line, typed, reveal) {
    line = String(line);
    var indent = (line.match(/^\s*/) || [''])[0];
    var tokens = tokenize(line);
    var shown = tokens.length, hidden = [];
    if (reveal < 1) {
      if (reveal <= 0) return null;
      shown = Math.max(1, Math.round(tokens.length * reveal));
      hidden = tokens.slice(shown).map(function (t) { return t.length; });
    }
    var text = reveal >= 1 ? line.slice(indent.length) : tokens.slice(0, shown).join(' ');
    var cs = stringMask(text);
    typed = String(typed || '').replace(/^\s+/, '');
    var html = '<span class="bcs-text">' + indent.replace(/\t/g, '    ');
    for (var i = 0; i < text.length; i++) {
      var ch = text[i], st = 'pending';
      if (i < typed.length) st = (cs[i] ? typed[i] === ch : typed[i].toUpperCase() === ch.toUpperCase()) ? 'ok' : 'bad';
      html += '<span class="bcs-' + st + '">' + (ch === '<' ? '&lt;' : ch === '&' ? '&amp;' : ch === '>' ? '&gt;' : ch) + '</span>';
    }
    html += '</span>';
    hidden.forEach(function (len) {
      html += '<span class="bcs-blank" aria-hidden="true" style="width:' + Math.max(1, len) + 'ch"></span>';
    });
    return html;
  }
  var styled = false;
  function ensureStyles() {
    if (styled) return;
    styled = true;
    var css =
      '.bcs-hint{margin:6px 0 10px;padding:10px 12px;border:1px solid var(--line-strong,#3b424e);border-radius:10px;' +
      'background:rgba(0,0,0,.2);font:500 .95rem/1.6 var(--font-mono,ui-monospace,monospace);text-align:left;' +
      '-webkit-user-select:none;user-select:none}' +
      '.bcs-hint-label{margin-bottom:4px;color:var(--muted,#9aa0a6);font:700 .68rem/1.4 var(--font-body,system-ui,sans-serif);' +
      'letter-spacing:.06em;text-transform:uppercase}' +
      '.bcs-line{display:flex;flex-wrap:wrap;align-items:center;gap:0 .5ch;min-height:1.6em}' +
      '.bcs-text{white-space:pre}.bcs-pending{color:var(--muted-2,#858c95)}.bcs-ok{color:var(--good,#81c995)}.bcs-bad{color:var(--bad,#f28b82)}' +
      '.bcs-blank{display:inline-block;height:1em;border-bottom:2px dotted var(--muted-2,#858c95);vertical-align:middle}' +
      '.bcs-working{color:var(--ink-soft,#c9cdd4);line-height:1.5}' +
      '.bcs-toggle{display:inline-flex;align-items:center;gap:8px;min-height:32px;padding:0 12px 0 6px;border:1px solid var(--line-strong,#3b424e);' +
      'border-radius:999px;background:transparent;color:var(--ink-soft,#c9cdd4);font:500 13px/1 var(--font-body,system-ui,sans-serif);cursor:pointer}' +
      '.bcs-toggle:hover{background:var(--brand-soft,rgba(138,180,248,.14))}' +
      '.bcs-toggle .bcs-track{position:relative;width:32px;height:18px;border-radius:999px;background:var(--surface-4,#2e3440);transition:background .15s}' +
      '.bcs-toggle .bcs-track::after{content:"";position:absolute;top:3px;left:3px;width:12px;height:12px;border-radius:50%;background:var(--muted,#9aa0a6);transition:transform .15s,background .15s}' +
      '.bcs-toggle[aria-pressed="true"]{border-color:var(--brand,#8ab4f8);color:var(--brand-dark,#aecbfa)}' +
      '.bcs-toggle[aria-pressed="true"] .bcs-track{background:var(--brand,#8ab4f8)}' +
      '.bcs-toggle[aria-pressed="true"] .bcs-track::after{transform:translateX(14px);background:var(--on-brand,#0b1a33)}';
    var el = document.createElement('style');
    el.textContent = css;
    (document.head || document.documentElement).appendChild(el);
  }
  function blockCopy(el) {
    ['copy', 'cut', 'contextmenu', 'dragstart', 'selectstart'].forEach(function (type) {
      el.addEventListener(type, function (e) { e.preventDefault(); });
    });
  }

  // ---- Fading ----
  var FADE_STEPS = [1, 2 / 3, 1 / 3, 0];
  function fader(key) {
    var storeKey = FADE_PREFIX + key;
    var st = { step: 0, right: 0, wrong: 0 };
    try { var saved = JSON.parse(localStorage.getItem(storeKey) || 'null'); if (saved) st = saved; } catch (e) {}
    function save() { try { localStorage.setItem(storeKey, JSON.stringify(st)); } catch (e) {} }
    return {
      reveal: function () { return FADE_STEPS[Math.max(0, Math.min(FADE_STEPS.length - 1, st.step))]; },
      step: function () { return st.step; },
      correct: function () {
        st.wrong = 0;
        st.right += 1;
        if (st.right >= 3 && st.step < FADE_STEPS.length - 1) { st.step += 1; st.right = 0; }
        save();
      },
      wrong: function () {
        st.right = 0;
        st.wrong += 1;
        if (st.wrong >= 2 && st.step > 0) { st.step -= 1; st.wrong = 0; }
        save();
      },
      reset: function () { st = { step: 0, right: 0, wrong: 0 }; save(); }
    };
  }

  window.BCSupport = {
    isOn: function () { return on; },
    // true once the site has answered (inside the site) - before that, isOn()
    // is this browser's own last-known setting.
    heardFromSite: function () { return heardFromSite; },
    set: function (value) {
      apply(value, false);
      if (inFrame) {
        try { window.parent.postMessage({ type: 'BC_SUPPORT_SET', on: !!value }, '*'); } catch (e) {}
      }
    },
    onChange: function (fn) {
      listeners.push(fn);
      return function () { listeners = listeners.filter(function (f) { return f !== fn; }); };
    },

    // The standard switch. Returns the button; it keeps itself in step.
    mountToggle: function (container, label) {
      ensureStyles();
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bcs-toggle';
      btn.title = 'Support shows you how, and fades as you get things right';
      btn.innerHTML = '<span class="bcs-track" aria-hidden="true"></span><span>' + (label || 'Support') + '</span>';
      function sync() { btn.setAttribute('aria-pressed', on ? 'true' : 'false'); }
      sync();
      btn.addEventListener('click', function () { window.BCSupport.set(!on); });
      window.BCSupport.onChange(sync);
      container.appendChild(btn);
      return btn;
    },

    // The model answer (a string, or an array of lines) under what the
    // student is typing. `typed` is their text so far (lines split on \n);
    // `reveal` is 0..1 (see fader). Renders nothing once reveal reaches 0.
    renderTypedHint: function (container, model, typed, reveal, label) {
      ensureStyles();
      if (reveal == null) reveal = 1;
      var lines = Array.isArray(model) ? model : String(model || '').split('\n');
      var typedLines = String(typed || '').split('\n');
      var body = lines.map(function (line, i) {
        var html = renderLine(line, typedLines[i], reveal);
        return html === null ? '' : '<div class="bcs-line">' + html + '</div>';
      }).join('');
      if (!body) { container.innerHTML = ''; container.hidden = true; return; }
      container.hidden = false;
      container.classList.add('bcs-hint');
      container.setAttribute('aria-label', 'Hint');
      container.innerHTML = '<div class="bcs-hint-label">' + (label || 'Hint: type it yourself, blanks are hidden') + '</div>' + body;
      if (!container.dataset.bcsBlocked) { blockCopy(container); container.dataset.bcsBlocked = '1'; }
    },

    // How to work an answer out, for questions where a faded model would be
    // the answer itself (a number to predict). `steps` runs from most help
    // to least: reveal 1 shows steps[0], 2/3 steps[1], 1/3 steps[2], each
    // falling back to the last one given. Renders nothing once reveal is 0.
    renderWorking: function (container, steps, reveal, label) {
      ensureStyles();
      var list = [].concat(steps || []);
      if (reveal == null) reveal = 1;
      if (reveal <= 0 || !list.length) { container.innerHTML = ''; container.hidden = true; return; }
      var text = String(list[Math.min(reveal > 0.9 ? 0 : reveal > 0.5 ? 1 : 2, list.length - 1)]);
      var safe = text.replace(/[&<>]/g, function (c) { return c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;'; });
      container.hidden = false;
      container.classList.add('bcs-hint');
      container.setAttribute('aria-label', 'Hint');
      container.innerHTML = '<div class="bcs-hint-label">' + (label || 'How to work it out') + '</div><div class="bcs-working">' + safe + '</div>';
    },

    fader: fader
  };
})();
