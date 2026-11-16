// The conversation panel: one line at a time, Next (Space or Enter) or a numbered choice (1, 2, 3 or a click).
// A choice with ok: false is not taken: its `why` shows and the player chooses again (main.js counts the slip).
// A choice with check(S) false shows `notYet` and is not a slip. Lines and choices may carry act(S).
import { CODE } from './filter.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function createTalk({ el, onSlip, onEnd, onAct, speak }) {
  let who = null, lines = [], i = 0, S = null, fb = '', fbBad = false;
  function draw() {
    if (!who) { el.hidden = true; el.innerHTML = ''; return; }
    const L = lines[i];
    el.hidden = false;
    let h = '<div class="talk-who"><b>' + esc(who.name) + '</b><button type="button" class="btn secondary talk-read" data-act="read" aria-label="Read it to me">Read it to me</button></div>' +
      '<p class="talk-say">' + esc(L.say) + '</p>';
    if (L.code) h += '<pre class="talk-code">' + esc(CODE) + '</pre>';
    if (L.choices) {
      h += '<div class="talk-choices">' + L.choices.map((c, k) => '<button type="button" class="btn talk-choice" data-k="' + k + '"><span class="num">' + (k + 1) + '</span>' + esc(c.t) + '</button>').join('') + '</div>';
    } else {
      h += '<div class="talk-actions"><button type="button" class="btn" data-act="next">' + (i < lines.length - 1 ? 'Next' : 'Bye') + ' <small>(Space)</small></button></div>';
    }
    h += '<div class="talk-fb' + (fbBad ? ' bad' : '') + '" role="status" aria-live="polite">' + esc(fb) + '</div>';
    el.innerHTML = h;
    (el.querySelector('.talk-choice') || el.querySelector('[data-act="next"]'))?.focus({ preventScroll: true });
  }
  function enter(k) {
    i = k; fb = ''; fbBad = false;
    const L = lines[i];
    if (L && L.act) { L.act(S); onAct?.(); }
    draw();
  }
  function close() { const was = who; who = null; lines = []; draw(); if (was) onEnd?.(was); }
  const api = {
    open(person, script, state) { who = person; lines = script; S = state; enter(0); },
    isOpen: () => !!who,
    who: () => who,
    line: () => (who ? lines[i] : null),
    feedback: () => fb,
    next() {
      if (!who) return;
      const L = lines[i];
      if (L.choices) return;
      if (i < lines.length - 1) enter(i + 1); else close();
    },
    choose(k) {
      if (!who) return false;
      const L = lines[i], c = L.choices && L.choices[k];
      if (!c) return false;
      if (c.check && !c.check(S)) { fb = c.notYet; fbBad = false; draw(); return false; }
      if (!c.ok) { fb = c.why; fbBad = true; onSlip?.(c); draw(); return false; }
      if (c.act) { c.act(S); onAct?.(); }
      if (i < lines.length - 1) enter(i + 1); else close();
      return true;
    },
    close,
    read() { const L = who && lines[i]; if (!L) return; speak(L.say + (L.choices ? ' ' + L.choices.map((c, k) => 'Choice ' + (k + 1) + ': ' + c.t).join('. ') : '')); },
  };
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.k != null) api.choose(+b.dataset.k);
    else if (b.dataset.act === 'next') api.next();
    else if (b.dataset.act === 'read') api.read();
  });
  return api;
}
