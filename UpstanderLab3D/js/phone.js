// The player's phone (P): what each mission does on it.
//   messages  Mission 1: the collected messages; run the chat app's filter on each, then say Right, False alarm or Missed.
//   spread    Mission 2: one screenshot forwarded to 2 new people at every step, drawn as a tree; predict the totals.
//   chat      Missions 3 and 4: the class chat, and what you do about it (save evidence, report, block; never reply
//             or forward).
// Wrong answers show why and count as a slip (onSlip); they never give the answer away.
import { BLOCKED, flagged, verdict } from './filter.js';
import { MESSAGES, WHY, CHAT, CHAT_ACTIONS, fill, nameOf } from './story.js';

const esc = (s) => fill(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const VERDICTS = [['right', 'Right'], ['false-alarm', 'False alarm'], ['missed', 'Missed']];
export const SPREAD_Q = [{ key: 'q4', step: 4, answer: 15 }, { key: 'q8', step: 8, answer: 255 }];
export const peopleAfter = (step) => 2 ** step - 1;   // 1, 3, 7, 15 ... 255 after step 8

export function createPhone({ el, onSlip, onChange }) {
  let M = null, S = null, open = false, ran = {}, fb = {}, spreadStep = 1, note = '';
  function slip(why) { onSlip?.(why); }
  function changed() { onChange?.(); draw(); }

  function drawMessages() {
    const got = MESSAGES.filter((m) => S.got[m.id]);
    let h = '<p class="ph-lead">The chat app hides a message if it contains <b>' + BLOCKED.join(', ') + '</b> anywhere in it.</p>';
    if (!got.length) return h + '<p class="ph-empty">No messages yet. Talk to people to collect them.</p>';
    h += '<ol class="ph-msgs">' + got.map((m) => {
      const done = S.tested[m.id], r = ran[m.id];
      let row = '<li class="ph-msg' + (done ? ' done' : '') + '"><p class="ph-text">"' + esc(m.text) + '"</p>';
      if (!r && !done) row += '<button type="button" class="btn" data-run="' + m.id + '">Run the filter</button>';
      else {
        const f = flagged(fill(m.text));
        row += '<span class="ph-res ' + (f ? 'flag' : 'pass') + '">' + (f ? 'HIDDEN' : 'LET THROUGH') + '</span>';
        if (done) row += '<p class="ph-why good">' + esc(WHY[done](m)) + '</p>';
        else row += '<div class="ph-verdicts">' + VERDICTS.map(([v, t]) => '<button type="button" class="btn secondary" data-msg="' + m.id + '" data-v="' + v + '">' + t + '</button>').join('') + '</div>' +
          (fb[m.id] ? '<p class="ph-why bad">' + esc(fb[m.id]) + '</p>' : '');
      }
      return row + '</li>';
    }).join('') + '</ol>';
    return h;
  }
  function tree(steps) {
    // step 1: one person; each step, everyone who just got it sends it to 2 new people
    const W = 420, rowH = 52, out = [];
    let prev = [{ x: W / 2 }];
    out.push('<circle cx="' + W / 2 + '" cy="20" r="9" class="ph-node first"/>');
    for (let s = 2; s <= Math.min(steps, 5); s++) {
      const n = 2 ** (s - 1), y = 20 + (s - 1) * rowH, cur = [];
      for (let k = 0; k < n; k++) cur.push({ x: (k + 0.5) * W / n });
      cur.forEach((c, k) => { const p = prev[k >> 1]; out.push('<line x1="' + p.x + '" y1="' + (y - rowH + 9) + '" x2="' + c.x + '" y2="' + (y - 9) + '" class="ph-edge"/>'); });
      cur.forEach((c) => out.push('<circle cx="' + c.x + '" cy="' + y + '" r="' + (s > 4 ? 5 : 8) + '" class="ph-node"/>'));
      prev = cur;
    }
    const h = 20 + (Math.min(steps, 5) - 1) * rowH + 16;
    return '<svg class="ph-tree" viewBox="0 0 ' + W + ' ' + h + '" role="img" aria-label="The screenshot spreading">' + out.join('') + '</svg>';
  }
  function drawSpread() {
    if (!S.krit1) return fill('<p class="ph-empty">Nothing here yet. Talk to {poster} in the Corridor.</p>');
    const shown = S.q4 ? Math.max(spreadStep, 4) : Math.min(spreadStep, 3);
    let h = '<p class="ph-lead">Step 1: {poster} shares it. At every step, everyone who just got it forwards it to <b>2 new people</b>.</p>' +
      tree(shown) + '<p class="ph-count">After step ' + shown + ': <b>' + peopleAfter(shown) + '</b> people have it.</p>';
    if (!S.q4 && spreadStep < 3) h += '<button type="button" class="btn" data-spread="next">Next step</button>';
    const ask = (q, label) => '<div class="ph-ask"><label for="ph-' + q.key + '">' + label + '</label><input id="ph-' + q.key + '" inputmode="numeric" autocomplete="off">' +
      '<button type="button" class="btn" data-ans="' + q.key + '">Check</button>' + (fb[q.key] ? '<p class="ph-why bad">' + esc(fb[q.key]) + '</p>' : '') + '</div>';
    if (!S.q4 && spreadStep >= 3) h += ask(SPREAD_Q[0], 'Predict: how many people have it after step 4?');
    if (S.q4 && !S.q8) h += '<p class="ph-why good">Right: 7 + 8 new people = 15.</p>' + ask(SPREAD_Q[1], 'Predict: how many after step 8?');
    if (S.q8) h += '<p class="ph-why good">Right: 1 + 2 + 4 + 8 + 16 + 32 + 64 + 128 = 255 people, from one post. Now talk to {poster} again.</p>';
    return fill(h);
  }
  function drawChat() {
    const C = CHAT[M.id];
    let h = '<div class="ph-chat-title">' + esc(C.title) + '</div><div class="ph-chat">' + C.lines.map(([who, t]) => '<div class="ph-bubble"><b>' + esc(nameOf(who)) + '</b>' + esc(t) + '</div>').join('') + '</div>';
    const did = (a) => (a.id === 'save' && S.saved) || (a.id === 'report' && S.reported) || (a.id === 'block' && S.blocked);
    h += '<p class="ph-lead">What do you do?</p><div class="ph-actions">' + CHAT_ACTIONS.map((a) => '<button type="button" class="btn ' + (did(a) ? 'done' : 'secondary') + '" data-chat="' + a.id + '"' + (did(a) ? ' disabled' : '') + '>' + (did(a) ? 'Done: ' : '') + esc(a.label) + '</button>').join('') + '</div>' +
      (note ? '<p class="ph-why ' + (note.bad ? 'bad' : 'good') + '">' + esc(note.t) + '</p>' : '');
    return h;
  }
  function draw() {
    if (!open || !M) { el.hidden = true; el.innerHTML = ''; return; }
    el.hidden = false;
    const body = M.phone === 'messages' ? drawMessages() : M.phone === 'spread' ? drawSpread() : drawChat();
    el.innerHTML = '<div class="ph-top"><b>Phone</b><span class="spacer"></span><button type="button" class="btn secondary" data-close="1">Close (P)</button></div><div class="ph-body">' + body + '</div>';
  }

  const api = {
    setMission(m, state) { M = m; S = state; ran = {}; fb = {}; spreadStep = 1; note = ''; draw(); },
    open() { open = true; if (M && M.phone === 'chat' && !S.read) { S.read = true; onChange?.(); } draw(); el.querySelector('button')?.focus({ preventScroll: true }); },
    close() { open = false; draw(); },
    toggle() { (open ? api.close : api.open)(); },
    isOpen: () => open,
    run(id) { ran[id] = true; draw(); },
    classify(id, v) {
      const m = MESSAGES.find((x) => x.id === id); if (!m || !ran[id]) return false;
      const want = verdict(flagged(fill(m.text)), m.unkind);
      if (v === want) { S.tested[id] = want; fb[id] = ''; changed(); return true; }
      fb[id] = flagged(fill(m.text)) ? 'Look again: it was hidden. Is the message really unkind to someone?' : 'Look again: it was let through. Would the person reading it feel hurt?';
      slip(fb[id]); draw(); return false;
    },
    spreadNext() { spreadStep = Math.min(3, spreadStep + 1); draw(); },
    answer(key, n) {
      const q = SPREAD_Q.find((x) => x.key === key);
      if (+n === q.answer) { S[key] = true; fb[key] = ''; if (key === 'q4') spreadStep = 4; changed(); return true; }
      fb[key] = key === 'q4' ? 'Each step adds twice as many new people as the step before: 1, then 2, then 4, then...' : 'Keep doubling the new people each step and add them all up: 1 + 2 + 4 + ...';
      slip(fb[key]); draw(); return false;
    },
    act(id) {
      const a = CHAT_ACTIONS.find((x) => x.id === id);
      if (!a.ok) { note = { t: a.why, bad: true }; slip(a.why); draw(); return false; }
      if (a.needs && !S[a.needs]) { note = { t: a.why, bad: true }; slip(a.why); draw(); return false; }
      if (id === 'save') { S.saved = true; note = { t: 'Saved privately. You can show it to an adult.' }; }
      if (id === 'report') { S.reported = true; note = { t: 'Reported. The app will review the messages.' }; }
      if (id === 'block') { S.blocked = true; note = { t: 'Blocked. They cannot message you, and your evidence is saved.' }; }
      changed(); return true;
    },
  };
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.close) api.close();
    else if (b.dataset.run) api.run(b.dataset.run);
    else if (b.dataset.v) api.classify(b.dataset.msg, b.dataset.v);
    else if (b.dataset.spread) api.spreadNext();
    else if (b.dataset.ans) api.answer(b.dataset.ans, (el.querySelector('#ph-' + b.dataset.ans) || {}).value);
    else if (b.dataset.chat) api.act(b.dataset.chat);
  });
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('input[id^="ph-"]')) { const k = e.target.id.slice(3); api.answer(k, e.target.value); } });
  return api;
}
