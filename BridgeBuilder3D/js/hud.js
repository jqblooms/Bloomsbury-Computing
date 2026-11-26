// Data Bridge 3D (single player): the HUD over the 3D view (DOM; styles in app.css). Ported from the party server's
// hud.js without the team parts (race board, crew ticks, podium). Elements in index.html: #hudRound #hudRounds
// #hudCoins #hudCoinsWrap #hudMode (top bar), #note, #hold (the ride's traffic light), #act (a big action button),
// #banner (the phase banner), #tip (the help line).
//   createHud() -> { top(S, learn), coinPop(n), note(text), grip(r), phase(kind, sub), act(label, onClick), tip(html) }
import { esc } from './util.js';
const $ = id => document.getElementById(id);
const setH = (e, h) => { if (e.dataset.h !== h) { e.dataset.h = h; e.innerHTML = h; } };

export function createHud() {
  let noteTimer = 0, actFn = null, phaseWas = '';
  $('act').onclick = () => actFn && actFn();
  return {
    top(S, rounds, learn) {
      $('hud').hidden = !S;
      if (!S) return;
      $('hudRound').textContent = S.round; $('hudRounds').textContent = rounds; $('hudCoins').textContent = S.coins;
      $('hudMode').hidden = !learn;
    },
    coinPop(n) {
      const wrap = $('hudCoinsWrap'); if (!wrap || !n) return;
      const s = document.createElement('span'); s.className = 'b3-pop' + (n < 0 ? ' is-bad' : ''); s.textContent = (n > 0 ? '+' : '') + n + ' coins';
      wrap.appendChild(s); setTimeout(() => s.remove(), 1500);
      wrap.classList.remove('is-bump'); void wrap.offsetWidth; wrap.classList.add('is-bump');
    },
    note(text) {
      const n = $('note'); if (n.textContent === text && !n.hidden) return;
      n.textContent = text; n.hidden = false; n.classList.remove('pop'); void n.offsetWidth; n.classList.add('pop');
      clearTimeout(noteTimer); noteTimer = setTimeout(() => { n.hidden = true; }, 5000);
    },
    // the ride's traffic light (ride.js riderStep): GREEN relax, AMBER get ready, RED hold Space
    grip(r) {
      const hl = $('hold'); if (!r || !r.light) { hl.hidden = true; return; }
      hl.hidden = false;
      setH(hl, `<div class="tl"><i class="g${r.light === 'green' ? ' on' : ''}"></i><i class="a${r.light === 'amber' ? ' on' : ''}"></i><i class="r${r.light === 'red' ? ' on' : ''}"></i></div>` +
        `<div class="word">${esc(r.hint || '')}</div><div class="rule"><span class="key">Space</span> when the light is <b>RED</b></div>`);
      hl.classList.toggle('bump', !!r.warn);
      hl.dataset.light = r.light;
    },
    // kind: '' (hidden), 'exam', 'build', 'board', 'drive'
    phase(kind, sub) {
      const e = $('banner');
      const txt = { exam: 'Answer the question', build: 'Build the bridge', board: 'ALL ABOARD', drive: 'Hold on!' }[kind] || '';
      e.hidden = !txt; if (!txt) { phaseWas = ''; return; }
      setH(e, `<span class="bt">${txt}</span>${sub ? `<span class="cd">${esc(sub)}</span>` : ''}`);
      e.className = 'banner ' + kind;
      const k = kind + (kind === 'board' ? sub : '');
      if (k !== phaseWas) { phaseWas = k; e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); }
    },
    act(label, onClick) {
      const b = $('act'); b.hidden = !label; actFn = onClick; if (!label) return;
      const m = /^Press (\S+):\s*(.*)$/.exec(label);
      const h = m ? `<span class="key">${esc(m[1])}</span><span>${esc(m[2].charAt(0).toUpperCase() + m[2].slice(1))}</span>` : esc(label);
      if (b.dataset.l !== label) { b.dataset.l = label; b.innerHTML = h; b.setAttribute('aria-label', label); }
    },
    tip(html) {
      const t = $('tip'); t.hidden = !html; if (!html) return;
      const parts = String(html).split(/<br\s*\/?>\s*<small>/i);
      const h = parts.length > 1 ? (parts[0] ? `<div class="main">${parts[0]}</div>` : '') + `<div class="keys">${parts[1].replace(/<\/small>\s*$/i, '')}</div>` : `<div class="main">${html}</div>`;
      setH(t, h);
    },
  };
}
