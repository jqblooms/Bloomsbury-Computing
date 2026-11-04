// Contest Lab 3D: ACSL Contest 2 skills in Network Builder 3D's lab. You walk round with the same blob and the same
// controls (hold Space or the left mouse button to grab at one point between your raised hands, a 0.25 s hold for
// anything already placed, right-drag or Q / E to turn, M for the map) and carry token cubes and lamp trays.
// Rules kept from Network Builder 3D: steps tick themselves off from what is on the floor, a guide arrow on the floor
// grid, an outline on whatever a hand would grab, predict before the machine shows the answer, and in a challenge any
// mistake means the round does not count (two clean rounds in a row to finish).
//
// The rules and answers come from the site's own engines: NotationCore (NotationLab/core.js) and BitCore
// (BitFlicker/bits-core.js), loaded by index.html before this module. Progress: 'bc-contest3d-v1:all:done' (by
// mission id), best stars in 'bc-contest3d-v1:all:stars'; shared/cloud-save.js keeps them on the student's account.
// Rendering uses animation frames; starting a round, checking and saving never wait on one (a hidden iframe has none).
import * as THREE from 'three';
import { create } from './room.js';
import { createBlob } from './blob.js';
import { makeCube, makeTray, makePad, makeBody, floorBar, sign, PAD_H, CUBE, GAP } from './cubes.js';

const NC = window.NotationCore, BC = window.BitCore, POW = NC.POW;
const $ = id => document.getElementById(id);
const HOLD_OUT = 0.75, T = 100, SPEED = 5.5, NEED = 2, HOLD = 0.25;
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = list => list[Math.floor(Math.random() * list.length)];
const shuffle = list => { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const el = (tag, attrs, html) => { const n = document.createElement(tag); for (const [k, v] of Object.entries(attrs || {})) k === 'class' ? n.className = v : n.setAttribute(k, v); if (html != null) n.innerHTML = html; return n; };
const btn = (label, cls, fn) => { const b = el('button', { type: 'button', class: cls === 'go' ? 'btn' : 'btn secondary' }, label); b.addEventListener('click', fn); return b; };

// ================================================================ the notation and bit-string helpers
const roleOf = s => NC.isOp(s) ? 'op' : /^[A-Z]$/.test(s) ? 'var' : s === '(' || s === ')' ? 'paren' : 'num';
const C = (s, role) => '<span class="cl-c ' + (role || roleOf(s)) + '">' + s + '</span>';
const Cs = list => '<span class="cl-row">' + list.map(s => C(s)).join('') + '</span>';
const lampsHtml = bits => '<span class="cl-tray">' + [...bits].map(b => '<span class="cl-l ' + (b === '1' ? 'on' : b === '0' ? 'off' : 'unk') + '">' + b + '</span>').join('') + '</span>';
const infixOf = t => NC.toInfix(t);
const nodesOf = t => { const out = []; (function go(n) { out.push(n); if (n.op) { go(n.l); go(n.r); } })(t); return out; };
const preorder = t => nodesOf(t);
const postorder = t => { const out = []; (function go(n) { if (n.op) { go(n.l); go(n.r); } out.push(n); })(t); return out; };
const inorder = t => { const out = []; (function go(n) { if (n.op) go(n.l); out.push(n); if (n.op) go(n.r); })(t); return out; };
const symOf = n => n.op || n.v;
// the part of the tree under node n, written in a notation, each token marked as the node itself (root) or its left
// or right side
function partTokens(n, form) {
  const inL = x => !!(x && n.op && nodesOf(n.l).includes(x));
  if (form === 'prefix' || form === 'postfix') return (form === 'prefix' ? preorder(n) : postorder(n)).map(x => ({ s: symOf(x), side: x === n ? 'root' : inL(x) ? 'l' : 'r' }));
  return infixTokens(n).map(e => ({ s: e.tok, side: e.node === n ? 'root' : inL(e.node || e.sub) ? 'l' : 'r' }));
}
const splitHtml = (n, form) => '<span class="cl-split">' + partTokens(n, form).map(p => '<span class="' + p.side + '">' + p.s + '</span>').join(' ') + '</span>';
function parentMap(t) { const p = new Map(); (function go(n) { if (n.op) { p.set(n.l, [n, 'left']); p.set(n.r, [n, 'right']); go(n.l); go(n.r); } })(t); return p; }
// infix tokens with the reason for every bracket (NotationCore.needs decides where brackets go)
function infixTokens(t) {
  const go = n => {
    if (!n.op) return [{ tok: n.v, node: n }];
    return side(n.l, n.op, 'l').concat([{ tok: n.op, node: n }], side(n.r, n.op, 'r'));
  };
  const side = (c, op, s) => NC.needs(c, op, s) ? [{ tok: '(', sub: c, parentOp: op }].concat(go(c), [{ tok: ')', sub: c, parentOp: op }]) : go(c);
  return go(t);
}
const OP_RULE = {
  NOT: () => 'NOT flips every lamp: 1 becomes 0 and 0 becomes 1.',
  AND: () => 'AND: a lamp is lit only where <b>both</b> lamps are lit.',
  OR: () => 'OR: a lamp is lit where <b>either</b> lamp is lit.',
  XOR: () => 'XOR: a lamp is lit where the two lamps are <b>different</b>.',
  LSHIFT: n => 'LSHIFT-' + n + ': every lamp moves ' + n + ' to the left. ' + n + ' drop off the left end and ' + n + ' dark lamps come in on the right.',
  RSHIFT: n => 'RSHIFT-' + n + ': every lamp moves ' + n + ' to the right. ' + n + ' drop off the right end and ' + n + ' dark lamps come in on the left.',
  LCIRC: n => 'LCIRC-' + n + ': every lamp moves ' + n + ' to the left. The ' + n + ' that fall off the left come back in on the right.',
  RCIRC: n => 'RCIRC-' + n + ': every lamp moves ' + n + ' to the right. The ' + n + ' that fall off the right come back in on the left.'
};
const ruleFor = n => n.t === 'not' ? OP_RULE.NOT() : n.t === 'sh' ? OP_RULE[n.op](n.n) : OP_RULE[n.op]();
const ORDER_RULE = 'Order: NOT first, then SHIFT and CIRC, then AND, then XOR, then OR.';
const bitNodes = ast => { const out = []; (function go(n) { if (n.t === 'not' || n.t === 'sh') go(n.a); else if (n.t === 'bin') { go(n.a); go(n.b); } out.push(n); })(ast); return out; };   // work order
function writtenOrder(ast) { const out = []; (function go(n) { if (n.t === 'bin') { go(n.a); out.push(n); go(n.b); } else if (n.t === 'not' || n.t === 'sh') { out.push(n); go(n.a); } else out.push(n); })(ast); return out; }
const kidsOf = n => n.t === 'bin' ? [n.a, n.b] : n.t === 'not' || n.t === 'sh' ? [n.a] : [];
function bitParents(ast) { const p = new Map(); for (const n of bitNodes(ast)) for (const k of kidsOf(n)) p.set(k, n); return p; }
const isOpNode = n => n.t === 'not' || n.t === 'sh' || n.t === 'bin';
const bitsStr = n => { const r = []; for (let i = 0; i < n; i++) r.push(Math.random() < 0.5 ? '1' : '0'); const s = r.join(''); return /^(0+|1+)$/.test(s) ? bitsStr(n) : s; };
const UN = () => pick(['NOT', 'LSHIFT-' + rnd(1, 3), 'RSHIFT-' + rnd(1, 3), 'LCIRC-' + rnd(1, 4), 'RCIRC-' + rnd(1, 4)]);
const BIN = () => pick(['AND', 'OR', 'XOR']);
// No two trays may look the same: every starting string and every machine's result is different, so the order
// things happen in is always clear (James, 2026-11-02, after three 8 cubes in a row on the stack).
function bitsDistinct(src) {
  const ast = BC.parse(src), seen = new Set();
  for (const n of bitNodes(ast)) { const v = n.t === 'bits' ? n.v : BC.evaluate(n); if (seen.has(v)) return false; seen.add(v); }
  return true;
}
function bitsExpr(len = 5, repeatsOk = false) {
  // three operators in a shape where the order of operations matters
  const a = () => bitsStr(len), b1 = BIN(); let b2 = BIN(); while (b2 === b1) b2 = BIN();
  const forms = [() => UN() + ' ' + a() + ' ' + b1 + ' ' + UN() + ' ' + a(), () => UN() + ' ' + UN() + ' ' + a() + ' ' + b1 + ' ' + a(),
    () => a() + ' ' + b1 + ' ' + a() + ' ' + b2 + ' ' + UN() + ' ' + a(), () => UN() + ' ' + a() + ' ' + b1 + ' ' + a() + ' ' + b2 + ' ' + a(),
    () => a() + ' ' + b1 + ' ' + UN() + ' ' + a() + ' ' + b2 + ' ' + a(), () => '(' + UN() + ' ' + a() + ') ' + b1 + ' (' + UN() + ' ' + a() + ')'];
  for (;;) { const src = pick(forms)(); const ast = BC.parse(src); if (bitNodes(ast).filter(isOpNode).length === 3 && !/^(0+|1+)$/.test(BC.evaluate(ast)) && (repeatsOk || bitsDistinct(src))) return src; }
}
// contest length: three strings joined by two different binary operators, with two NOT / SHIFT / CIRC among them
function bitsExpr4(len = 5, repeatsOk = false) {
  for (;;) {
    const b1 = BIN(); let b2 = BIN(); while (b2 === b1) b2 = BIN();
    const k = [0, 0, 0]; k[rnd(0, 2)]++; k[rnd(0, 2)]++;
    const term = n => Array.from({ length: n }, UN).concat([bitsStr(len)]).join(' ');
    const src = term(k[0]) + ' ' + b1 + ' ' + term(k[1]) + ' ' + b2 + ' ' + term(k[2]);
    if (!/^(0+|1+)$/.test(BC.evaluate(BC.parse(src))) && (repeatsOk || bitsDistinct(src))) return src;
  }
}
// solve for x: one or two of NOT / LCIRC / RCIRC on x, then XOR a string, so there is exactly one answer
function solveExpr(two) {
  for (;;) {
    const un = () => pick(['NOT', 'LCIRC-' + rnd(1, 4), 'RCIRC-' + rnd(1, 4)]);
    const chain = !two && Math.random() < 0.5 ? un() : un() + ' ' + un(), c = bitsStr(5);
    const src = Math.random() < 0.7 ? chain + ' x XOR ' + c : c + ' XOR ' + chain + ' x';
    const sol = bitsStr(5), rhs = BC.evaluate(BC.parse(src), sol);
    if (/NOT NOT|LCIRC-\d RCIRC|RCIRC-\d LCIRC/.test(src)) continue;
    if (BC.solve(src, rhs, 5).length === 1) return { src, rhs, sol };
  }
}
// the undo steps for solve for x, from the target back to x
function undoSteps(src, rhs) {
  const ast = BC.parse(src), steps = []; let v = rhs, n = ast;
  while (n.t !== 'var') {
    if (n.t === 'bin') {
      const c = n.a.t === 'bits' ? n.a : n.b, rest = n.a.t === 'bits' ? n.b : n.a, out = BC.binop('XOR', v, c.v);
      steps.push({ text: 'The last machine is <b>XOR ' + c.v + '</b>. XOR the same string again to undo it: ' + v + ' XOR ' + c.v + '.', from: v, op: 'XOR ' + c.v, out, rule: 'Where the lamps are different, light it.' });
      v = out; n = rest;
    } else {
      const inv = n.t === 'not' ? 'NOT' : (n.op === 'LCIRC' ? 'RCIRC-' : 'LCIRC-') + n.n, out = n.t === 'not' ? BC.not(v) : BC.shift(n.op === 'LCIRC' ? 'RCIRC' : 'LCIRC', n.n, v);
      steps.push({ text: 'Next is <b>' + BC.opName(n) + '</b>. Undo it with <b>' + inv + '</b>: ' + inv + ' ' + v + '.', from: v, op: inv, out, rule: n.t === 'not' ? 'NOT undoes NOT.' : 'Circulate the other way by the same number.' });
      v = out; n = n.a;
    }
  }
  return { steps, x: v };
}

// ================================================================ What Does This Program Do? (loops)
// A program is a list of statements: { sets: [[v, e], ...] } (one line, such as a = 0: c = 0), { for: v, from, to,
// step, body, trace, means, wrong, explain }, { if: cond, body } and { out: v }. Expressions are written as in the
// contest: ^ for powers and int( ) for the whole part. How a loop is traced:
//   'each' (tutorials): a question for every new value on every pass;
//   'end' (challenges): only the values when the loop ends;
//   'means' (a long loop, any mission): first what the loop does (means is right, wrong are the other options),
//   then its values when it ends.
const showE = e => e.replace(/\^/g, ' ↑ ').replace(/\s+/g, ' ').trim();
const jsOf = e => e.replace(/\^/g, '**').replace(/\bint\(/g, 'Math.floor(');
function listing(prog) {
  const lines = [], at = new Map();
  const go = (list, ind) => {
    for (const s of list) {
      const pad = ' '.repeat(ind);
      at.set(s, lines.length);
      if (s.sets) lines.push(pad + s.sets.map(([v, e]) => v + ' = ' + showE(e)).join(': '));
      else if (s.for) { lines.push(pad + 'for ' + s.for + ' = ' + showE(s.from) + ' to ' + showE(s.to) + (s.step && s.step !== '1' ? ' step ' + s.step : '')); go(s.body, ind + 4); lines.push(pad + 'next ' + s.for); }
      else if (s.if) { lines.push(pad + 'if ' + showE(s.if) + ' then'); go(s.body, ind + 4); lines.push(pad + 'end if'); }
      else if (s.out) lines.push(pad + 'output ' + s.out);
    }
  };
  go(prog.body, 0); lines.push('end');
  return { lines, at };
}
// Runs the program and makes the trace: a list of checkpoints. auto ones (a = 0) just happen; the rest are asked.
function runProg(prog, contest) {
  const { lines, at } = listing(prog), env = {}, cps = [], vars = [], loopVars = new Set(), loops = [];
  const ev = e => { const n = Object.keys(env); return Function(...n, '"use strict"; return (' + jsOf(e) + ');')(...n.map(k => env[k])); };
  const sub = e => showE(e.replace(/\b[a-z]\b/g, v => env[v] != null ? String(env[v]) : v));
  const ctx = () => loops.map(v => v + ' = ' + env[v]).join(', ');
  const assigned = list => { const out = []; (function go(l) { for (const s of l) { if (s.sets) s.sets.forEach(([v]) => { if (!out.includes(v)) out.push(v); }); if (s.body) go(s.body); } })(list); return out; };
  function exec(list, ask, hist) {
    for (const s of list) {
      if (s.sets) for (const [v, e] of s.sets) {
        const before = sub(e), val = ev(e);
        if (!Number.isInteger(val)) throw new Error('not whole: ' + v + ' = ' + e);
        env[v] = val; if (!vars.includes(v) && !loopVars.has(v)) vars.push(v);
        if (hist) (hist[v] = hist[v] || []).push(val);
        if (!ask) continue;
        if (/^-?\d+$/.test(e.trim())) { cps.push({ auto: true, var: v, value: val, line: at.get(s) }); continue; }
        cps.push({ var: v, value: val, line: at.get(s), ctx: ctx(),
          q: (loops.length ? 'With ' + ctx() + ': ' : '') + v + ' = ' + showE(e) + '. What is ' + v + ' now?',
          why: (loops.length ? 'With ' + ctx() + ': ' : '') + v + ' = ' + before + ' = ' + val + '.', hint: 'Put in the values from the pads: ' + v + ' = ' + before + '.' });
      }
      else if (s.for) {
        const from = ev(s.from), to = ev(s.to), step = ev(s.step || '1'); loopVars.add(s.for);
        const how = !ask ? 'quiet' : s.means ? 'means' : contest ? 'end' : (s.trace || 'each');
        if (how === 'means') cps.push({ kind: 'choice', loop: s.for, line: at.get(s), q: 'Look at the ' + s.for + ' loop. What does it do?', options: shuffle([s.means].concat(s.wrong)), answer: s.means,
          why: s.means, hint: s.hint || 'Try the first two or three passes on paper and look for the pattern.' });
        const h = {};
        loops.push(s.for);
        for (let x = from; step > 0 ? x <= to : x >= to; x += step) { env[s.for] = x; exec(s.body, how === 'each', h); }
        loops.pop();
        if (hist) for (const [v, list] of Object.entries(h)) (hist[v] = hist[v] || []).push(...list);
        if (how === 'end' || how === 'means') for (const v of assigned(s.body)) {
          const seen = h[v] || [], val = env[v];
          cps.push({ var: v, value: val, line: at.get(s), loop: s.for,
            q: 'When the ' + s.for + ' loop has finished, what is ' + v + '?',
            why: (s.explain ? s.explain(env) + ' ' : seen.length && seen.length <= 8 ? v + ' goes ' + seen.join(', ') + '. ' : '') + 'When the ' + s.for + ' loop ends, ' + v + ' = ' + val + '.',
            hint: s.explain ? 'Go through k from ' + from + ' to ' + to + ' and count.' : 'Write ' + v + ' for each pass in a table: ' + s.for + ' = ' + from + ', then ' + (from + step) + ', and so on up to ' + to + '.' });
        }
      }
      else if (s.if) { if (ev(s.if)) exec(s.body, ask, hist); }
      else if (s.out && ask) cps.push({ var: s.out, value: env[s.out], line: at.get(s), final: true, q: 'What does the program output?', why: 'The program outputs ' + s.out + ', which is ' + env[s.out] + '.', hint: 'The output line shows ' + s.out + '. Look at its pad.' });
    }
  }
  exec(prog.body, true, null);
  return { lines, cps, vars, out: env[prog.body.find(s => s.out).out] };
}
const divisorsUpTo = (v, top) => { const out = []; for (let k = 2; k <= top; k++) if (v % k === 0) out.push(k); return out; };
// the factor-counting loop at the end of the contest program: for k = 2 to d, one if for each variable
function factorLoop(names) {
  return { for: 'k', from: '2', to: 'd', means: 'For each k from 2 to d, it adds 1 to t when k divides ' + names.join(', ').replace(/, (\w)$/, ' or $1') + ' exactly. So t counts their factors from 2 to d.',
    wrong: ['It adds k to t on every pass.', 'It counts how many numbers from 2 to d are even.'],
    hint: 'a / k == int(a / k) is true only when a / k is a whole number: k divides a exactly.',
    explain: env => names.map(v => v + ' = ' + env[v] + ': ' + (divisorsUpTo(env[v], env.d).join(', ') || 'none')).join('. ') + '.',
    body: names.map(v => ({ if: v + ' / k == int(' + v + ' / k)', body: [{ sets: [['t', 't + 1']] }] })) };
}
// ACSL 2018-19 Junior Contest 2, question 5, exactly
const PAPER_LOOPS = { cite: 'ACSL 2018-19 Junior Division, Contest 2, question 5.', body: [
  { sets: [['a', '0'], ['c', '0'], ['t', '0']] },
  { for: 'i', from: '1', to: '5', body: [{ sets: [['a', 'a + i ^ 2']] }] },
  { sets: [['b', 'a / 11']] },
  { for: 'j', from: '2', to: '10', step: '2', body: [{ sets: [['c', 'c + j * b']] }] },
  { sets: [['d', 'c / b - a / 11']] },
  factorLoop(['a', 'b', 'c', 'd']),
  { out: 't' }] };
// the same shape with new numbers: squares added up, a second loop, then counting factors
function progFactors() {
  for (;;) {
    const n = rnd(3, 5), a = [0, 1, 5, 14, 30, 55][n], qs = divisorsUpTo(a, a - 1).filter(q => a / q >= 2 && a / q <= 6);
    if (!qs.length) continue;
    const q = pick(qs), m = rnd(3, 5), b = a / q, d = m * (m + 1) - b;
    if (d < 6 || d > 30) continue;
    return { body: [
      { sets: [['a', '0'], ['c', '0'], ['t', '0']] },
      { for: 'i', from: '1', to: String(n), body: [{ sets: [['a', 'a + i ^ 2']] }] },
      { sets: [['b', 'a / ' + q]] },
      { for: 'j', from: '2', to: String(2 * m), step: '2', body: [{ sets: [['c', 'c + j * b']] }] },
      { sets: [['d', 'c / b - a / ' + q]] },
      factorLoop(['a', 'b', 'c', 'd']),
      { out: 't' }] };
  }
}
const progDoubling = (n = rnd(3, 5)) => ({ body: [
  { sets: [['x', '1'], ['s', '0']] },
  { for: 'i', from: '1', to: String(n), body: [{ sets: [['x', 'x * 2'], ['s', 's + x']] }] },
  { out: 's' }] });
const progNested = (n = rnd(2, 3), m = rnd(3, 4)) => ({ body: [
  { sets: [['c', '0']] },
  { for: 'i', from: '1', to: String(n), body: [{ for: 'j', from: 'i', to: String(m), body: [{ sets: [['c', 'c + j']] }] }] },
  { out: 'c' }] });
function progMultiples() {
  const p = rnd(3, 5), n = rnd(12, 20);
  return { body: [
    { sets: [['s', '0']] },
    { for: 'i', from: '1', to: String(n), means: 'It adds up the numbers from 1 to ' + n + ' that ' + p + ' divides exactly.', wrong: ['It adds up every number from 1 to ' + n + '.', 'It counts how many numbers from 1 to ' + n + ' that ' + p + ' divides exactly.'],
      hint: 'i / ' + p + ' == int(i / ' + p + ') is true only when ' + p + ' divides i exactly.',
      body: [{ if: 'i / ' + p + ' == int(i / ' + p + ')', body: [{ sets: [['s', 's + i']] }] }] },
    { out: 's' }] };
}

function longTree(n, repeatsOk = false) {
  if (repeatsOk) return NC.randomTree({ n, ops: ['+', '-', '*', '/', POW], max: 60, noNeg: true });
  let last = null;
  for (let k = 0; k < 30000; k++) {
    const t = NC.randomTree({ n, ops: ['+', '-', '*', '/', POW], max: 60, noNeg: true }), count = {};
    for (const x of postorder(t)) { const v = x.op ? String(NC.evaluate(x)) : x.v; count[v] = (count[v] || 0) + 1; }
    if (Math.max(...Object.values(count)) === 1) return t;   // no two cubes the same, as everywhere else
    if (Math.max(...Object.values(count)) <= 2) last = t;
  }
  return last;
}
const progRound = prog => ({ prog, key: listing(prog).lines.join('|') });
// ================================================================ missions
const tree = s => NC.parseInfix(s), fromPost = s => NC.parsePostfix(s), fromPre = s => NC.parsePrefix(s);
// No two cubes in one expression may be the same: every operand is different, and (with numbers) every answer cube
// differs from every operand and from every other answer, so the order things happen in is always clear.
function cubesDistinct(t) {
  const seen = new Set();
  for (const n of postorder(t)) { const v = n.op ? (/[A-Z]/.test(NC.toInfix(n)) ? null : String(NC.evaluate(n))) : n.v; if (v == null) continue; if (seen.has(v)) return false; seen.add(v); }
  return true;
}
function RT(o) { for (let k = 0; k < 3000; k++) { const t = NC.randomTree(o); if (cubesDistinct(t)) return t; } return NC.randomTree(o); }
// Repeated values (two 8 cubes) confuse while learning but are fine once you know the method (James, 2026-11-02):
// tutorials and walkthroughs keep every cube different; challenges pass repeatsOk, like a real contest paper.
function stackTree(o) { const opt = Object.assign({ letters: false, max: 40, noNeg: true }, o); return o.repeatsOk ? NC.randomTree(opt) : RT(opt); }
const MISSIONS = [
  { id: 'post-t', group: 'Postfix', title: 'Postfix with a Stack', type: 'tutorial', kind: 'stack', form: 'postfix',
    intro: 'Postfix puts the operator <b>after</b> its two values. A stack works it out. Read the belt from the <b>left</b>.',
    gen: () => ({ t: fromPost('4 2 + 3 *') }),
    after: { q: 'In postfix, why does the <b>first</b> cube off the stack go on the RIGHT side?', options: ['It was put on the stack last, so it was written last: it is the right side.', 'The stack always swaps the answer round.', 'Bigger numbers always go on the right.'], why: 'The stack gives back the last cube it got first. In postfix that is the value written last, the right side.' } },
  { id: 'post-c', group: 'Postfix', title: 'Postfix Challenge', type: 'challenge', kind: 'stack', form: 'postfix',
    intro: 'Work out each postfix expression with the stack. Predict every answer cube. Two clean rounds in a row.',
    gen: () => ({ t: stackTree({ n: 3, ops: ['+', '-', '*', '/'], repeatsOk: true }) }) },
  { id: 'pre-t', group: 'Prefix', title: 'Prefix with a Stack', type: 'tutorial', kind: 'stack', form: 'prefix',
    intro: 'Prefix puts the operator <b>before</b> its two values. Read the belt from the <b>right</b>, and the stack works it out.',
    gen: () => ({ t: fromPre('- * 3 4 5') }),
    after: { q: 'Why do we read prefix from the <b>right</b> with a stack?', options: ['So each operator finds its two values already on the stack.', 'Because the biggest numbers are on the right.', 'So the answer is always smaller.'], why: 'In prefix the values come after their operator. Reading from the right, the values reach the stack first.' } },
  { id: 'pre-c', group: 'Prefix', title: 'Prefix Challenge', type: 'challenge', kind: 'stack', form: 'prefix',
    intro: 'Work out each prefix expression with the stack. Predict every answer cube. Two clean rounds in a row.',
    gen: () => ({ t: stackTree({ n: 3, ops: ['+', '-', '*', POW], repeatsOk: true }) }) },
  { id: 'pre-long-t', group: 'Prefix', title: 'Contest Prefix', type: 'tutorial', kind: 'stack', form: 'prefix', mins: 10,
    intro: 'A contest-length prefix: 6 operators, every number one digit, with / and ↑. The method is the same: read from the <b>right</b>, one cube at a time.',
    gen: () => ({ t: fromPre('- + * 8 6 9 / - ^ 5 2 4 7') }),
    after: { q: 'This prefix has 6 operators. Why does the stack method still work?', options: ['Each operator only needs the two values on top of the stack, however long it is.', 'Long expressions are always added up.', 'The stack sorts the numbers.'], why: 'Every step looks only at the top two cubes.' } },
  { id: 'pre-long-c', group: 'Prefix', title: 'Long Prefix', type: 'challenge', kind: 'stack', form: 'prefix', need: 1, mins: 12,
    intro: 'Six or seven operators, with / and ↑. Numbers can repeat, as in a real contest. One clean round.',
    gen: () => ({ t: longTree(rnd(6, 7), true) }) },
  { id: 'pre-paper-c', group: 'Prefix', title: 'The Real Contest Question', type: 'challenge', kind: 'stack', form: 'prefix', need: 1, mins: 10,
    intro: 'Question 1 from the ACSL 2018-19 Junior Contest 2: 13 operators, and some numbers repeat. One clean round.',
    gen: () => ({ t: fromPre('+ - / * 2 + 3 5 4 / 9 - ^ 2 2 1 / + * 3 5 * 6 2 ^ 3 2'), key: 'paper' }) },
  { id: 'tree-t', group: 'Expression trees', title: 'Build and Read a Tree', type: 'tutorial', kind: 'tree', from: 'infix', read: 'prefix',
    intro: 'An expression tree has the operator worked <b>last</b> at the top. Build the tree, then read it as prefix.',
    gen: () => ({ t: tree('A + B * C'), from: 'infix', read: 'prefix' }),
    after: { q: 'Why does the operator worked <b>last</b> go at the top of the tree?', options: ['It joins the two sides, so it needs both of them worked out first.', 'It is always the first one written.', 'The top of a tree is always +.'], why: 'The top joins everything below it, so everything below must be worked out first.' } },
  { id: 'tree2-t', group: 'Expression trees', title: 'Read a Tree as Postfix', type: 'tutorial', kind: 'tree', from: 'infix', read: 'postfix',
    intro: 'Build the tree, then read it as postfix: both sides first, then the operator.',
    gen: () => ({ t: tree('(A - B) * C'), from: 'infix', read: 'postfix' }) },
  { id: 'tree-c', group: 'Expression trees', title: 'Convert', type: 'challenge', kind: 'tree',
    intro: 'Build the tree from one notation, then read it in another. Two clean rounds in a row.',
    gen: () => { const from = pick(['infix', 'prefix', 'postfix']), read = pick(['prefix', 'postfix'].filter(x => x !== from)); return { t: RT({ n: rnd(2, 3), ops: ['+', '-', '*', '/', POW], letters: true }), from, read }; } },
  { id: 'imp-t', group: 'Expression trees', title: 'Hidden Times Signs', type: 'tutorial', kind: 'tree', from: 'infix', read: 'postfix', mins: 8,
    intro: 'Contest infix hides some times signs: 2(A + B) means 2 * (A + B), and 3B means 3 * B. A square, a small 2 written high, is ↑ 2. Build the tree, then read it as postfix.',
    gen: () => ({ t: tree('3(A + B) / C ^ 2'), from: 'infix', read: 'postfix', implied: true }),
    after: { q: 'In 3(A + B), why is the * worked after the +?', options: ['The brackets make A + B one value first, then 3 times it.', 'Times is always worked last.', 'The 2 is on the left.'], why: 'Brackets are worked first.' } },
  { id: 'imp-c', group: 'Expression trees', title: 'Hidden Times Challenge', type: 'challenge', kind: 'tree', mins: 10,
    intro: 'Contest infix with hidden times signs. Build the tree, then read it as postfix. Two clean rounds in a row.',
    gen: () => { let t; do t = RT({ n: 4, ops: ['+', '-', '*', '/', POW], letters: true, digitChance: 0.45 }); while (NC.depth(t) > 3 || NC.toInfix(t, { implied: true }) === infixOf(t)); return { t, from: 'infix', read: 'postfix', implied: true }; } },
  { id: 'infix-t', group: 'Back to infix', title: 'Brackets and Order', type: 'tutorial', kind: 'infix',
    intro: 'Infix puts the operator <b>between</b> its sides. Read the tree: left side, operator, right side. Add brackets where a part must be worked first.',
    gen: () => ({ t: fromPost('A B + C *'), from: 'postfix' }),
    after: { q: 'Why does A + B need brackets in (A + B) * C?', options: ['Without them, * is worked before +.', 'Brackets always go round letters.', 'The + sign must always come first.'], why: '* comes before + in the order of operations, so A + B * C means A + (B * C).' } },
  { id: 'infix-c', group: 'Back to infix', title: 'Brackets Challenge', type: 'challenge', kind: 'infix',
    intro: 'Write each tree in infix on the rail, with brackets only where they are needed. Two clean rounds in a row.',
    gen: () => { let t; do t = RT({ n: rnd(2, 3), ops: ['+', '-', '*', '/', POW], letters: true }); while (!/\(/.test(infixOf(t))); return { t, from: pick(['prefix', 'postfix']) }; } },
  { id: 'bits-t', group: 'Bit-string flicking', title: 'NOT and AND', type: 'tutorial', kind: 'bits',
    intro: 'A tray of lamps is a bit string: lit is 1, dark is 0. Carry trays through the machines. NOT is worked before AND.',
    gen: () => ({ src: 'NOT 10110 AND 01110' }),
    after: { q: '10110 AND 01101 = 00100. Why is only one lamp lit?', options: ['AND lights a lamp only where both lamps are lit.', 'AND adds the two strings.', 'AND flips every lamp.'], why: 'Only the third lamp is lit in both strings.' } },
  { id: 'gates-t', group: 'Bit-string flicking', title: 'XOR and OR', type: 'tutorial', kind: 'bits',
    intro: 'XOR lights a lamp where the two lamps are different. OR lights it where either is lit. XOR is worked before OR.',
    gen: () => ({ src: '10110 XOR 01100 OR 00001' }),
    after: { q: '10110 XOR 01100 = 11010. Why is the third lamp dark?', options: ['Both third lamps are lit, so they are the same, and XOR only lights different lamps.', 'XOR always makes the middle lamp dark.', 'XOR is the same as AND.'], why: 'XOR lights a lamp only where one is lit and the other is dark.' } },
  { id: 'shift-t', group: 'Bit-string flicking', title: 'Shifts and Circulates', type: 'tutorial', kind: 'bits',
    intro: 'Shift and circulate conveyors move the lamps. A shift drops lamps off the end; a circulate wraps them round. Two of them in a row are worked from the right.',
    gen: () => ({ src: 'RCIRC-1 LSHIFT-2 10011' }),
    after: { q: 'In RCIRC-1 LSHIFT-2 10011, why is LSHIFT-2 worked first?', options: ['It is next to the string, so the string goes into it first.', 'L comes before R in the alphabet.', 'Shifts are always worked last.'], why: 'NOT, SHIFT and CIRC work on what is just after them, so a row of them is worked from the right.' } },
  { id: 'shift-c', group: 'Bit-string flicking', title: 'Shifts Challenge', type: 'challenge', kind: 'bits',
    intro: 'Two or three NOT, SHIFT and CIRC machines in a row. Work them from the right. Predict every new tray. Two clean rounds in a row.',
    gen: () => ({ src: (Math.random() < 0.5 ? UN() + ' ' : '') + UN() + ' ' + UN() + ' ' + bitsStr(5) }) },
  { id: 'brack-t', group: 'Bit-string flicking', title: 'Brackets First', type: 'tutorial', kind: 'bits', mins: 6,
    intro: 'Brackets are worked first, as in maths. Each bracket here holds one machine. Then OR joins the two results.',
    gen: () => ({ src: '(LCIRC-2 01101) OR (RSHIFT-1 11001)' }),
    after: { q: 'Why are both brackets worked before the OR?', options: ['Brackets are always worked first, so OR needs both of their results.', 'OR is always worked first.', 'Brackets only show where the strings start.'], why: 'Brackets come before everything else.' } },
  { id: 'bits-c', group: 'Bit-string flicking', title: 'Order of Operations', type: 'challenge', kind: 'bits',
    intro: 'Carry the trays through the machines in the right order. Predict every new tray. Two clean rounds in a row.',
    gen: () => ({ src: bitsExpr(5, true) }) },
  { id: 'solve-t', group: 'Solve for x', title: 'Solve for x', type: 'tutorial', kind: 'solve',
    intro: 'Find the 5-bit string x that makes the machines give the target. Work backwards from the target, undoing each machine.',
    gen: () => ({ src: 'LCIRC-2 x XOR 10101', rhs: '11011', sol: '10011' }),
    after: { q: 'Why does XOR 10101 undo XOR 10101?', options: ['XOR with the same string flips the same lamps, so doing it twice flips them back.', 'XOR always gives 00000.', 'XOR is the same as NOT.'], why: 'XOR with 1 flips a lamp and XOR with 0 keeps it, so the same string twice puts every lamp back.' } },
  { id: 'solve-c', group: 'Solve for x', title: 'Solve for x Challenge', type: 'challenge', kind: 'solve',
    intro: 'Set the x lamps so the machines give the target, then run them. Your first run must be right. Two clean rounds in a row.',
    gen: () => solveExpr() },
  // What Does This Program Do? (loops), from ACSL Junior Contest 2
  { id: 'loop-t', group: 'Loops', title: 'What Does This Program Do?', type: 'tutorial', kind: 'trace', mins: 14,
    intro: 'A real contest program. Trace it one line at a time: walk to the variable that changes and give its new value. For a long loop, first say what it does.',
    gen: () => ({ prog: PAPER_LOOPS, key: 'paper' }),
    after: { q: 'Why find what the k loop does, instead of doing all 24 passes one by one?', options: ['Spotting the pattern (counting factors) is quicker and makes fewer mistakes.', 'The k loop never runs.', 'Only the first pass matters.'], why: 'The pattern gives the answer without checking 96 if lines.' } },
  { id: 'loop2-t', group: 'Loops', title: 'Loops Inside Loops', type: 'tutorial', kind: 'trace', mins: 8,
    intro: 'A loop inside a loop: for every pass of i, the j loop runs all the way through. Watch where j starts.',
    gen: () => ({ prog: progNested(3, 3), key: 'nested' }),
    after: { q: 'Why does the j loop run fewer times when i is bigger?', options: ['j starts at i, so a bigger i leaves fewer values of j up to 3.', 'j always runs 3 times.', 'The i loop stops the j loop.'], why: 'for j = i to 3 starts at i.' } },
  { id: 'loop-c', group: 'Loops', title: 'Trace the Loops', type: 'challenge', kind: 'trace', mins: 12,
    intro: 'Contest style: give each value when its loop ends, then the output. Two clean rounds in a row.',
    gen: () => progRound(pick([progFactors, progDoubling, progNested, progMultiples])()) },
  // Challenges: contest length, no Walk me through it, harder each time; stars for clean rounds
  { id: 'c-post', group: 'Challenges', title: 'Postfix Pro', type: 'challenge', kind: 'stack', form: 'postfix', noHelp: true,
    intro: 'Contest length: four operators, with / and ↑. No help. Two clean rounds in a row.',
    gen: () => ({ t: stackTree({ n: 4, ops: ['+', '-', '*', '/', POW], max: 60, repeatsOk: true }) }) },
  { id: 'c-pre', group: 'Challenges', title: 'Prefix Pro', type: 'challenge', kind: 'stack', form: 'prefix', noHelp: true,
    intro: 'Contest length: four operators, with / and ↑. No help. Two clean rounds in a row.',
    gen: () => ({ t: stackTree({ n: 4, ops: ['+', '-', '*', '/', POW], max: 60, repeatsOk: true }) }) },
  { id: 'c-tree', group: 'Challenges', title: 'Convert Pro', type: 'challenge', kind: 'tree', noHelp: true,
    intro: 'Four operators. Build the tree from one notation and read it in another. No help. Two clean rounds in a row.',
    gen: () => { const from = pick(['infix', 'prefix', 'postfix']), read = pick(['prefix', 'postfix'].filter(x => x !== from)); let t; do t = RT({ n: 4, ops: ['+', '-', '*', '/', POW], letters: true }); while (NC.depth(t) > 3); return { t, from, read }; } },
  { id: 'c-infix', group: 'Challenges', title: 'Brackets Pro', type: 'challenge', kind: 'infix', noHelp: true,
    intro: 'Four operators and more than one pair of brackets. No help. Two clean rounds in a row.',
    gen: () => { let t; do t = RT({ n: 4, ops: ['+', '-', '*', '/', POW], letters: true }); while (NC.depth(t) > 3 || (infixOf(t).match(/\(/g) || []).length < 2); return { t, from: pick(['prefix', 'postfix']) }; } },
  { id: 'c-bits', group: 'Challenges', title: 'Bits Pro', type: 'challenge', kind: 'bits', noHelp: true,
    intro: 'Contest length: four operators on three strings. No help. Two clean rounds in a row.',
    gen: () => ({ src: bitsExpr4(5, true) }) },
  { id: 'c-solve', group: 'Challenges', title: 'Solve Pro', type: 'challenge', kind: 'solve', noHelp: true,
    intro: 'Two machines before the XOR. Your first run must be right. No help. Two clean rounds in a row.',
    gen: () => solveExpr(true) },
  { id: 'c-loop', group: 'Challenges', title: 'Loops Pro', type: 'challenge', kind: 'trace', noHelp: true,
    intro: 'The long contest programs. No help. Two clean rounds in a row.',
    gen: () => progRound(pick([progFactors, progMultiples])()) }
];
export { MISSIONS };
const SECTIONS = ['Postfix', 'Prefix', 'Expression trees', 'Back to infix', 'Bit-string flicking', 'Solve for x', 'Loops', 'Challenges'];
// Lesson mode (Years 7 to 9): one lesson's activities in order, about an hour each; ?lesson=bits opens one
const LESSONS = [
  { id: 'notation', title: 'Lesson 1: Prefix, Infix and Postfix', missions: ['post-t', 'post-c', 'pre-t', 'pre-c', 'tree-t', 'tree2-t', 'tree-c', 'infix-t', 'infix-c'], ext: ['c-post', 'c-pre', 'c-tree', 'c-infix'] },
  { id: 'bits', title: 'Lesson 2: Bit-String Flicking', missions: ['bits-t', 'gates-t', 'shift-t', 'shift-c', 'bits-c', 'solve-t', 'solve-c'], ext: ['c-bits', 'c-solve'] },
  { id: 'junior', title: 'Lesson 3: Junior Contest 2', missions: ['pre-long-t', 'pre-paper-c', 'imp-t', 'brack-t', 'loop-t', 'loop2-t', 'loop-c'], ext: ['pre-long-c', 'imp-c', 'c-loop'] }
];
// rough minutes for a Year 7 student: a tutorial is one round, a challenge needs two clean rounds
const minsOf = m => m.mins || (m.type === 'challenge' ? 10 : m.kind === 'solve' ? 7 : 5);
const FORM_NAME = { postfix: 'Postfix', prefix: 'Prefix', infix: 'Infix' };
function sourceTokens(p) { return p.from === 'prefix' ? NC.toPrefix(p.t) : p.from === 'postfix' ? NC.toPostfix(p.t) : NC.tokens(p.implied ? NC.toInfix(p.t, { implied: true }) : infixOf(p.t)); }

// ================================================================ saving and results
const STORE = 'bc-contest3d-v1:';
function load(key, fallback) { try { const v = localStorage.getItem(STORE + key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; } }
function save(key, value) { try { localStorage.setItem(STORE + key, JSON.stringify(value)); } catch (e) { } }
function results(id, label) {
  const lines = []; let right = 0, tries = 0;
  function post(finished) {
    if (window.parent === window) return;
    const head = (finished ? 'Finished.' : 'Not finished yet.') + (tries ? ' ' + right + ' clean rounds in ' + tries + '.' : '');
    try { window.parent.postMessage({ type: 'BC_APP_RESULT', questionId: id, label, summary: head + ' ' + lines.slice(-12).join(' '), complete: !!finished }, '*'); } catch (e) { }
  }
  return {
    add(text, ok) { tries++; if (ok) right++; lines.push(tries + '. ' + (ok ? 'Clean' : 'Mistake') + ': ' + text + '.'); post(); },
    note(text) { lines.push(text); post(); },
    finish() { post(true); }
  };
}

// ================================================================ the 3D lab
export function startSolo({ container, myName, colour }) {
  const log = results('contestlab3d', 'Contest Lab 3D');
  let MAPW = 22, MAPH = 15, rows = [];
  let view = null, scene = null, worldG = null;
  const pos = { x: 11, y: 12, face: Math.PI };
  let moving = false, overview = false, stick = null, clock = 0, tickNo = 0;
  const keys = new Set();
  const me = createBlob(colour ?? 0, myName || '');
  const hand = { down: false, item: null, from: null, pending: null };
  let slots = [], blocks = [], nextId = 1;
  let M = null, R = null, missionAt = 0;
  const done = load('all:done', {}) || {};
  const openSecs = new Set();

  // ---------------------------------------------------------------- slots and items
  // A slot is a pad on the floor at tile (x, y), w tiles wide, holding items (a stack grows upwards, a rail grows to
  // the right). take(item) returns a reason it cannot be taken; put(item, from) returns { msg, mistake } to refuse.
  function addSlot(def) {
    const s = Object.assign({ id: 's' + nextId++, w: 1, items: [], grow: 'up', take: () => null, put: () => null, risky: false }, def);
    s.g = makePad(s.pad || s.role, s.w, s.label, s.tag || {});
    s.g.position.set(s.x * T + T / 2, 0, s.y * T + T / 2); worldG.add(s.g);
    slots.push(s); return s;
  }
  function itemMesh(it) { it.k3 = it.tray ? makeTray(it.bits, it.label) : makeCube(it.sym, it.role); worldG.add(it.k3.group); }
  function addItem(slot, it) { it.id = it.id || 'i' + nextId++; if (!it.k3) itemMesh(it); slot.items.push(it); it.slot = slot; snapItem(it); return it; }
  function killItem(it) { if (!it || !it.k3) return; worldG.remove(it.k3.group); it.k3.dispose(); it.k3.group.traverse(o => { if (o.userData.own) o.geometry.dispose(); }); it.k3 = null; }
  function cube(sym, extra) { return Object.assign({ sym: String(sym), role: roleOf(String(sym)) }, extra || {}); }
  const top = s => s.items[s.items.length - 1];
  function itemTarget(it) {
    if (it === hand.item) {
      const hx = pos.x + Math.sin(pos.face) * HOLD_OUT, hy = pos.y + Math.cos(pos.face) * HOLD_OUT;   // held clear of the body: the cube is wider than the reach point
      return new THREE.Vector3((hx + 0.5) * T, it.tray ? 52 : 70, (hy + 0.5) * T);
    }
    const s = it.slot, k = s.items.indexOf(it);
    if (s.grow === 'right') return new THREE.Vector3((s.x + k + 0.5) * T, PAD_H + CUBE / 2 + 2, (s.y + 0.5) * T);
    if (it.tray) return new THREE.Vector3((s.x + s.w / 2) * T, PAD_H, (s.y + 0.5) * T);
    return new THREE.Vector3((s.x + s.w / 2) * T, PAD_H + CUBE / 2 + 2 + k * GAP, (s.y + 0.5) * T);
  }
  function snapItem(it) { if (it.k3) { it.k3.group.position.copy(itemTarget(it)); it.k3.group.rotation.y = 0; } }
  function moveItems(dt) {
    const k = Math.min(1, dt * 14);
    // placed cubes square up to face the camera, so a + never reads as a times sign
    for (const s of slots) for (const it of s.items) if (it.k3) { const g = it.k3.group; g.position.lerp(itemTarget(it), k); g.rotation.y += (Math.round(g.rotation.y / (Math.PI * 2)) * Math.PI * 2 - g.rotation.y) * k; }
    if (hand.item && hand.item.k3) { hand.item.k3.group.position.lerp(itemTarget(hand.item), Math.min(1, dt * 24)); hand.item.k3.group.rotation.y = pos.face; }
  }
  const rectDist = (s, px, py) => Math.hypot(Math.max(s.x - 0.5 - px, 0, px - (s.x + s.w - 0.5)), Math.max(s.y - 0.5 - py, 0, py - (s.y + 0.5)));
  function handPos() { return [pos.x + Math.sin(pos.face) * 0.45, pos.y + Math.cos(pos.face) * 0.45]; }
  function nearestSlot(maxD, ok) {
    const [hx, hy] = handPos(); let best = null, bd = maxD;
    for (const s of slots) { if (ok && !ok(s)) continue; const d = rectDist(s, hx, hy); if (d < bd) { bd = d; best = s; } }
    return best;
  }

  // ---------------------------------------------------------------- the room
  function solidAt(tx, ty) {
    if (ty < 0 || tx < 0 || ty >= MAPH || tx >= MAPW || rows[ty][tx] === '#') return true;
    for (const s of slots) if (ty === s.y && tx >= s.x && tx < s.x + s.w) return true;
    for (const b of blocks) if (tx >= b[0] && tx <= b[2] && ty >= b[1] && ty <= b[3]) return true;
    return false;
  }
  function free(x, y) { for (const [ox, oy] of [[-0.28, -0.28], [0.28, -0.28], [-0.28, 0.28], [0.28, 0.28]]) if (solidAt(Math.round(x + ox), Math.round(y + oy))) return false; return true; }
  function disposeWorld() {
    if (!worldG) return;
    scene.remove(worldG);
    worldG.traverse(o => {
      if (o.userData.own) o.geometry?.dispose?.();
      if (o.userData.ownMat) { o.material.map?.dispose?.(); o.material.dispose(); }
      if (o.isSprite) { o.material.map?.dispose?.(); o.material.dispose(); }
    });
    for (const s of slots) for (const it of s.items) it.k3?.dispose();
    if (hand.item) hand.item.k3?.dispose();
  }
  function newWorld(w, h, name) {
    if (!view) { view = create(container); scene = view.scene; scene.add(me.group, arrows, pulse, outlineG); }
    disposeWorld();
    slots = []; blocks = []; hand.item = null; hand.from = null; hand.pending = null; hand.sticky = false; hand.tapDrop = false; guideKey = ''; routeKey = ''; outlineKey = '';
    MAPW = w; MAPH = h; rows = [];
    for (let y = 0; y < h; y++) { let r = ''; for (let x = 0; x < w; x++) r += (x === 0 || y === 0 || x === w - 1 || y === h - 1) ? '#' : '.'; rows.push(r); }
    view.setRoom({ w, h, rows, regions: [{ name, index: 0, x0: 1, y0: 1, x1: w - 2, y1: h - 2 }] });
    worldG = new THREE.Group(); scene.add(worldG);
    setOverview(overview);
  }
  function addBody(x0, y0, w, colour, label, deco) {
    const g = makeBody(w, colour, label, deco); g.position.set((x0 + w / 2) * T, 0, (y0 + 0.5) * T); worldG.add(g);
    blocks.push([x0, y0, x0 + w - 1, y0]); return g;
  }
  function addSign(text, x, y, h = 260, opts) { const s = sign(text, opts); s.position.set((x + 0.5) * T, h, (y + 0.5) * T); worldG.add(s); return s; }

  // ================================================================ rounds
  // R: the round being played. R.ask is a prediction waiting in the mission panel (nothing can be grabbed meanwhile).
  function newRound(after) {
    const m = M.m;
    let p = m.gen();
    // a challenge never repeats the round just played
    if (m.type === 'challenge') for (let k = 0; k < 20 && M.lastKey && keyOf(p) === M.lastKey; k++) p = m.gen();
    M.lastKey = keyOf(p);
    R = { p, over: false, spoilt: false, ask: null, notes: [], moves: 0, why: null };
    KIND[m.kind].setup(R, m);
    const wide = m.kind === 'tree' || m.kind === 'infix';   // trees: far enough back to see the whole tree, its labels and the rail
    view.zoom?.(wide ? 1400 : 760, wide ? 0.95 : 0.75);
    pos.face = Math.PI; view.jump(pos.x, wide ? pos.y - 4 : pos.y);
    toast(''); explainReset();
    if (after) { explain('Not this time. ' + after + ' A new round has started.'); R.why = after; toast('A mistake, so a new round has started. ' + after, 'bad'); }
    explain(startLine(m, p)); $('mission').scrollTop = 0; afterChange();   // to the top first, so a question at the start can scroll into view
  }
  function startLine(m, p) {
    if (m.kind === 'stack') return m.form === 'postfix' ? 'This is <b>postfix</b>, so we read the belt from <b>left to right</b>.' : 'This is <b>prefix</b>, so we read the belt from <b>right to left</b>.';
    if (m.kind === 'tree') return 'Build the tree from the ' + p.from + '. The operator worked last goes at the top.';
    if (m.kind === 'infix') return 'Read the tree in order: left side, operator, right side. Add brackets only where a part must be worked first.';
    if (m.kind === 'bits') return ORDER_RULE;
    if (m.kind === 'trace') return KIND.trace.start();
    return 'Work backwards from the target: undo the last machine first.';
  }
  // ---- what just happened: a card at the top of the lab after every step. Each one stays up for a while, the next
  // waits its turn (none is cut short), and the last one stays until something new happens.
  const xq = []; let xTimer = 0, xUntil = 0;
  function explainReset() { xq.length = 0; clearTimeout(xTimer); xTimer = 0; xUntil = 0; const b = $('explain'); if (b) { b.hidden = true; b.innerHTML = ''; } }
  function explain(html) {
    if (!html) return;
    if (R) (R.log = R.log || []).push(html);   // every explanation this round, for the list in the sheet
    xq.push(html); if (xq.length > 1) xq.splice(0, xq.length - 1);   // at most one step behind: the newest waits, older ones are skipped
    window.__explainCount = (window.__explainCount || 0) + 1;
    window.__explained = (window.__explained || []).concat([html.replace(/<[^>]+>/g, '')]).slice(-40);
    if (!xTimer) xNext();
  }
  function xNext() {
    xTimer = 0;
    if (!xq.length) return;
    const wait = xUntil - Date.now();
    if (wait > 0) { xTimer = setTimeout(xNext, wait); return; }
    const b = $('explain'); if (!b) return;
    b.hidden = false; b.innerHTML = '<span class="xh">What just happened</span><span class="xt">' + xq.shift() + '</span>';
    b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash');
    xUntil = Date.now() + 1800;   // each one stays up at least this long
    if (xq.length) xTimer = setTimeout(xNext, xUntil - Date.now());
  }
  const keyOf = p => p.key || (p.t ? NC.toPrefix(p.t).join(' ') : p.src);
  // a mistake in a challenge ends that round (it could no longer count) and starts a new one, with the reason shown
  function mistake(msg) {
    log.add(M.m.title + ': ' + msg.replace(/<[^>]+>/g, ''), false);
    if (M.m.type === 'challenge') { R.why = msg; R.spoilt = true; R.over = true; M.have = 0; M.spoilt++; newRound(msg); return; }
    R.why = msg; toast(msg, 'bad'); explain('Not this time. ' + msg); drawAll();
  }
  function finishRound(msg) {
    R.over = true; R.endMsg = msg;
    if (M.m.type === 'tutorial') { finishMission(); return; }
    if (!R.spoilt) {
      M.have++; log.add(M.m.title + ': clean round', true);
      if (M.have >= NEED) finishMission();
      else toast('Clean round! ' + M.have + ' of ' + NEED + '.', 'good');
    } else { M.have = 0; M.spoilt++; toast('This round had a mistake, so it does not count. Try a new one.', 'bad'); }
  }
  function finishMission() {
    M.phase = 'done';
    const id = M.m.id;
    if (!done[id]) { done[id] = true; save('all:done', done); }
    if (M.m.type === 'challenge') {
      const n = M.spoilt === 0 ? 3 : M.spoilt <= 2 ? 2 : 1, best = load('all:stars', {}) || {};
      M.stars = n; if (!(best[id] >= n)) { best[id] = n; save('all:stars', best); }
    }
    log.note('Mission ' + M.m.title + ' complete' + (M.walked ? ', used Walk me through it' : '') + '.');
    if (MISSIONS.every(x => done[x.id])) log.finish();
    toast('Mission complete!', 'good');
  }

  // ---------------------------------------------------------------- the stack machine (postfix and prefix)
  const KIND = {};
  KIND.stack = {
    setup(R, m) {
      const t = R.p.t, form = m.form, list = form === 'postfix' ? NC.toPostfix(t) : NC.toPrefix(t);
      const SW = Math.max(22, list.length + 4); newWorld(SW, 14, 'Stack machine');
      R.list = list; R.order = list.map((_, i) => i); if (form === 'prefix') R.order.reverse();
      R.next = 0; R.tok = 0; R.op = null; R.opsIn = 0; R.firstIn = 0; R.bothIn = 0; R.runs = 0; R.steps = NC.stackSteps(list, form);
      const bx = Math.floor((SW - list.length) / 2);
      R.belt = list.map((s, i) => {
        const sl = addSlot({ role: 'belt', x: bx + i, y: 3, idx: i,
          take: () => R.order[R.next] !== i ? 'Take the cubes in order. ' + (form === 'postfix' ? 'Postfix is read from the left.' : 'Prefix is read from the right.') + ' The next one glows and has a yellow ring.'
            : (R.op || R.out.items.length) ? 'Finish the machine first.' : null,
          put: (it, from) => from === sl ? null : { msg: 'The belt only gives cubes out.' } });
        addItem(sl, cube(s, { val: Number(s) }));
        return sl;
      });
      addSign(form === 'postfix' ? 'READ FROM THE LEFT  >>>' : '<<<  READ FROM THE RIGHT', bx + (list.length - 1) / 2, 2, 200, { bg: '#ffd43b', ink: '#1a1200', size: 0.034 });
      R.stack = addSlot({ role: 'stack', x: 5, y: 9, label: 'STACK', tag: { tagY: 400 }, risky: true,
        take: () => !R.op ? 'Put an operator in the machine first. Then the machine takes cubes off the stack.' : R.out.items.length ? 'Take the answer cube out of the machine first.' : null,
        put: (it, from) => {
          if (from === R.stack) return null;
          if (it.role === 'op') return { msg: 'An operator never goes on the stack. It goes in the middle of the machine.', mistake: true };
          return null;
        } });
      addBody(11, 7, 5, 0x8a5a00, 'OPERATOR MACHINE', 'gate');
      const side = (name, x) => addSlot({ role: 'machine', x, y: 9, label: name, tag: { tagBg: '#ffd43b', tagInk: '#1a1200' },
        take: () => 'It is in the machine. The machine runs when both sides are in.',
        put: (it, from) => {
          if (it.role === 'op') return { msg: 'The operator goes in the middle slot, marked OP.' };
          if (from && from.role === 'belt') return { msg: 'A number from the belt goes on the stack first. The machine takes its inputs from the stack.', mistake: true };
          if (!R.op) return { msg: 'Put the operator in first.' };
          const me = name === 'LEFT' ? R.L : R.R, other = name === 'LEFT' ? R.R : R.L;
          if (me.items.length) return { msg: 'That side is full.' };
          if (!other.items.length) {
            const want = form === 'postfix' ? 'RIGHT' : 'LEFT';
            if (name !== want) return { msg: form === 'postfix' ? 'Postfix: the <b>first</b> cube off the stack goes on the <b>RIGHT</b>. It was written last.' : 'Prefix: the <b>first</b> cube off the stack goes on the <b>LEFT</b>. It was written first.', mistake: true };
          }
          return null;
        } });
      R.L = side('LEFT', 11); R.R = side('RIGHT', 15);
      R.O = addSlot({ role: 'machine', x: 13, y: 9, label: 'OP', tag: { tagBg: '#ffd43b', tagInk: '#1a1200' },
        take: () => 'The operator stays in the machine until it runs.',
        put: it => it.role !== 'op' ? { msg: 'A number goes on the stack, not in the machine.', mistake: true } : null });
      R.out = addSlot({ role: 'out', x: 18, y: 9, label: 'OUT',
        put: (it, from) => from === R.out ? null : { msg: 'The machine gives cubes out here. Put cubes on the stack.' } });
      pos.x = 11; pos.y = 12;
    },
    placed(it, slot, from) {
      const pf = M.m.form === 'postfix';
      if (slot === R.stack && from.role === 'belt') { R.next++; R.tok++; explain(C(it.sym) + ' is a number, so it goes on the stack. It is now the top cube.'); }
      else if (slot === R.stack && from === R.out) { R.tok++; explain('The answer cube ' + C(it.sym, 'result') + ' goes back on the stack, just like a number.'); }
      else if (slot === R.O) { R.next++; R.op = it; R.opsIn++; explain(C(it.sym) + ' is an operator. An operator never goes on the stack: it goes in the machine and takes the top two cubes.'); }
      else if (slot === R.L || slot === R.R) {
        if (R.L.items.length && R.R.items.length) { R.bothIn++; explain('The next cube off the stack, ' + C(it.sym) + ', is the ' + (pf ? 'left' : 'right') + ' side.'); }
        else { R.firstIn++; explain('The first cube off the stack, ' + C(it.sym) + ', is the ' + (pf ? '<b>right</b> side. In postfix it was written last.' : '<b>left</b> side. Prefix is read backwards, so it was written first.')); }
      }
      if (R.L.items.length && R.R.items.length && !R.ask) {
        const a = top(R.L).val, b = top(R.R).val, op = R.op.sym, v = NC.apply(op, a, b);
        R.ask = { type: 'num', q: 'What does the machine make? ' + C(String(a)) + ' ' + C(op) + ' ' + C(String(b)) + ' = ?', answer: v,
          hint: 'Work out ' + a + ' ' + op + ' ' + b + '. The left side comes first.', why: a + ' ' + op + ' ' + b + ' = ' + v + '.',
          done: () => { R.runs++; for (const s of [R.L, R.R, R.O]) { s.items.forEach(killItem); s.items = []; } R.op = null; addItem(R.out, cube(String(v), { role: 'result', val: v })); explain('The machine works out ' + C(String(a)) + ' ' + C(op) + ' ' + C(String(b)) + ' = ' + C(String(v), 'result') + '. The left side always comes first.'); } };
      }
    },
    check() {
      if (R.next === R.list.length && !R.op && !R.out.items.length && R.stack.items.length === 1 && !hand.item) finishRound('The last cube on the stack is the answer: <b>' + top(R.stack).sym + '</b>.');
    },
    guide(R, m) {
      const ch = m.type === 'challenge';
      if (R.ask) return null;
      if (hand.item) {
        if (ch) return null;
        const it = hand.item;
        if (hand.from && hand.from.role === 'belt') return slotTarget(it.role === 'op' ? R.O : R.stack);
        if (hand.from === R.out) return slotTarget(R.stack);
        if (hand.from === R.stack) return slotTarget(R.L.items.length || R.R.items.length ? (R.L.items.length ? R.R : R.L) : (m.form === 'postfix' ? R.R : R.L));
        return null;
      }
      if (R.out.items.length) return slotTarget(R.out);
      if (R.op) return slotTarget(R.stack);
      const b = R.belt[R.order[R.next]];
      return b ? slotTarget(b) : null;
    },
    steps(R, m) {
      const left = m.form === 'postfix' ? 'RIGHT' : 'LEFT', right = m.form === 'postfix' ? 'LEFT' : 'RIGHT';
      const out = []; let j = 0;
      R.order.forEach((i, k) => {
        const s = R.list[i];
        if (!NC.isOp(s)) { out.push({ text: C(s) + ' is a number: put it on the stack.', done: () => R.tok > k }); return; }
        const n = j++;
        out.push({ text: C(s) + ' is an operator: put it in the machine\'s <b>OP</b> slot.', done: () => R.opsIn > n });
        out.push({ text: 'Take the top cube of the stack to the <b>' + left + '</b> side.', done: () => R.firstIn > n });
        out.push({ text: 'Take the next cube of the stack to the <b>' + right + '</b> side.', done: () => R.bothIn > n });
        out.push({ text: 'Predict the answer on the right.', done: () => R.runs > n });
        out.push({ text: 'Put the answer cube on the stack.', done: () => R.tok > k });
      });
      out.push({ text: 'One cube is left on the stack. It is the answer.', done: () => R.over });
      return out;
    },
    expr(R, m) { return '<div><b>' + FORM_NAME[m.form] + ':</b> ' + Cs(R.list) + '</div><div><b>Stack</b> (top first): ' + (R.stack && R.stack.items.length ? '<span class="cl-row">' + R.stack.items.slice().reverse().map(it => C(it.sym, it.role)).join('') + '</span>' : 'empty') + '</div>'; },
    walk(R, m) {
      let t; do t = m.type === 'tutorial' ? stackTree({ n: 2, ops: ['+', '-', '*'] }) : stackTree({ n: 3, ops: ['+', '-', '*', '/'] }); while (NC.toPrefix(t).join() === NC.toPrefix(R.p.t).join());
      const list = m.form === 'postfix' ? NC.toPostfix(t) : NC.toPrefix(t), st = NC.stackSteps(list, m.form);
      const steps = [{ text: '<b>A different expression.</b> ' + FORM_NAME[m.form] + ': ' + Cs(list) + '. Read it from the ' + (m.form === 'postfix' ? 'left' : 'right') + '.', visual: '' }];
      for (const s of st) {
        if (s.kind === 'push') steps.push({ text: 'Read ' + C(s.token) + ': a number, so it goes on the stack.', visual: stackHtml(s.stack) });
        else steps.push({ text: 'Read ' + C(s.token) + ': an operator. Take two cubes off the stack: first ' + C(String(s.first)) + ', then ' + C(String(s.second)) + '. The first one goes on the <b>' + (m.form === 'postfix' ? 'right' : 'left') + '</b>: ' + C(String(s.left)) + ' ' + C(s.token) + ' ' + C(String(s.right)) + ' = ' + C(String(s.value), 'result') + '. That cube goes on the stack.', visual: stackHtml(s.stack) });
      }
      steps.push({ text: 'One cube is left: the answer is <span class="hl">' + st[st.length - 1].value + '</span>. Now do yours the same way.', visual: '' });
      return steps;
    }
  };
  const stackHtml = vals => '<div class="cl-stack"><span class="cap">Stack</span>' + vals.slice().reverse().map(v => C(String(v), 'num')).join('') + '</div>';

  // ---------------------------------------------------------------- expression trees: build from one notation, read in another
  function layoutTree(t, x0, y0) {
    const ino = inorder(t), par = parentMap(t), out = new Map();
    const depth = n => { let d = 0, q = n; while (par.has(q)) { q = par.get(q)[0]; d++; } return d; };
    ino.forEach((n, i) => out.set(n, { x: x0 + i * 2, y: y0 + depth(n) * 3 }));
    return { at: out, par };
  }
  function treeWorld(R, prebuilt) {
    const t = R.p.t, nodes = nodesOf(t), n = nodes.length;
    newWorld(23, 18, 'Tree frame');
    const x0 = Math.floor((23 - (2 * n - 1)) / 2);
    const L = layoutTree(t, x0, 3); R.lay = L; R.par = L.par;
    for (const nd of nodes) if (nd.op) for (const c of [nd.l, nd.r]) { const a = L.at.get(nd), b = L.at.get(c); worldG.add(floorBar(a.x, a.y, b.x, b.y)); }
    R.ped = new Map();
    for (const nd of nodes) {
      const at = L.at.get(nd);
      const s = addSlot({ role: 'pedestal', x: at.x, y: at.y, node: nd, risky: true,
        take: () => R.stage === 'build' ? 'It is in the right place.' : null,
        put: (it, from) => {
          if (from === s) return null;
          if (R.stage !== 'build') return { msg: 'The tree is built. Take cubes to the rail.' };
          if (s.items.length) return { msg: 'This spot is full.' };
          if (it.sym !== symOf(nd)) return { msg: buildWhy(nd), mistake: true };
          return null;
        } });
      R.ped.set(nd, s);
      if (prebuilt) addItem(s, cube(symOf(nd), { node: nd }));
    }
    R.stage = prebuilt ? 'read' : 'build';
  }
  const SIDE_COL = { l: '#74c0fc', r: '#8ce99a', root: '#ffd43b' };
  // a floating label: the part of the expression a spot stands for, its two sides coloured
  function splitSign(parts) {
    const c = document.createElement('canvas'), g = c.getContext('2d'), font = '800 64px "Segoe UI", Arial, sans-serif'; g.font = font;
    const pad = 24, gap = 14, ws = parts.map(p => g.measureText(p.s).width + pad), W = Math.ceil(ws.reduce((a, b) => a + b, 0) + gap * (parts.length - 1) + 36), H = 112;
    c.width = W; c.height = H; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = 'rgba(16,18,22,.9)'; g.beginPath(); g.roundRect(0, 0, W, H, 22); g.fill();
    let x = 18;
    parts.forEach((p, i) => {
      if (p.side === 'root') { g.fillStyle = SIDE_COL.root; g.beginPath(); g.roundRect(x, 10, ws[i], H - 20, 12); g.fill(); g.fillStyle = '#1a1200'; }
      else g.fillStyle = SIDE_COL[p.side];
      g.fillText(p.s, x + ws[i] / 2, H / 2 + 3); x += ws[i] + gap;
    });
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
    sp.scale.set(W * 1.05, H * 1.05, 1); sp.renderOrder = 12; return sp;
  }
  function ringAt(x, y, col, r = 64) {
    const m = new THREE.Mesh(new THREE.RingGeometry(r - 12, r, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.95, depthWrite: false }));
    m.position.set((x + 0.5) * T, PAD_H + 3, (y + 0.5) * T); m.userData.own = true; m.userData.ownMat = true; m.renderOrder = 4; return m;
  }
  function clearShow(key) { for (const o of R[key] || []) { worldG.remove(o); o.geometry?.dispose(); if (!o.userData.sharedMat) [].concat(o.material || []).forEach(mm => { mm.map?.dispose?.(); mm.dispose?.(); }); } R[key] = []; }
  // building, in tutorials: the next spot to fill shows its part of the expression, split
  function showSplit() {
    clearShow('splitG'); R.splitNode = null;
    if (!M || M.m.type !== 'tutorial' || R.stage !== 'build') return;
    const n = preorder(R.p.t).find(nd => !R.ped.get(nd).items.length); if (!n) return;
    R.splitNode = n;
    const at = R.lay.at.get(n), sp = splitSign(partTokens(n, R.p.from));
    sp.position.set((at.x + 0.5) * T, 200, (at.y + 1.1) * T); worldG.add(sp); R.splitG.push(sp);   // low and a little in front, clear of the card at the top
    R.splitG.push(ringAt(at.x, at.y, 0xffd43b)); worldG.add(R.splitG[R.splitG.length - 1]);
    if (n.op) for (const [ch, side] of [[n.l, 'l'], [n.r, 'r']]) {
      const b = R.lay.at.get(ch), col = side === 'l' ? 0x74c0fc : 0x8ce99a, bar = floorBar(at.x, at.y, b.x, b.y, col);
      bar.position.y = 5; bar.scale.x = 2.4; bar.userData.sharedMat = true; worldG.add(bar); R.splitG.push(bar);
      for (const x of nodesOf(ch)) { const p = R.lay.at.get(x), rg = ringAt(p.x, p.y, col, x === ch ? 64 : 52); worldG.add(rg); R.splitG.push(rg); }
    }
  }
  // reading: the line round the outside of the tree, starting at the top on the left; each node is passed on its left
  // (where prefix takes it), under it, and on its right (where postfix takes it)
  function tourPoints(n, at, out = []) {   // at(node) -> { x, y } in tiles
    const a = at(n);
    out.push({ p: [a.x - 0.8, a.y - 0.25], node: n, when: 'prefix' });
    if (n.op) { tourPoints(n.l, at, out); out.push({ p: [a.x, a.y + 1.0] }); tourPoints(n.r, at, out); } else out.push({ p: [a.x, a.y + 0.8] });
    out.push({ p: [a.x + 0.8, a.y - 0.25], node: n, when: 'postfix' });
    return out;
  }
  function showTour() {
    clearShow('tourG');
    if (!M || M.m.type !== 'tutorial' || R.stage !== 'read') return;
    const pts = tourPoints(R.p.t, n => R.lay.at.get(n));
    const line = new THREE.Mesh(arrowGeometry(pts.map(q => q.p), 24, 46), new THREE.MeshBasicMaterial({ color: 0xda77f2, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }));
    line.userData.own = true; line.userData.ownMat = true; line.renderOrder = 3; worldG.add(line); R.tourG.push(line);
    const st = sign('START', { bg: '#9c36b5', ink: '#ffffff', size: 0.03 }); st.position.set((pts[0].p[0] + 0.5) * T, 120, (pts[0].p[1] + 0.5) * T); worldG.add(st); R.tourG.push(st);
    showDots();
  }
  function showDots() {
    clearShow('dotG');
    if (!M || M.m.type !== 'tutorial' || R.stage !== 'read') return;
    const read = new Set(R.readOrder.slice(0, R.readN)), next = R.readOrder[R.readN];
    for (const q of tourPoints(R.p.t, n => R.lay.at.get(n))) {
      if (q.when !== R.p.read) continue;
      const col = read.has(q.node) ? 0x40c057 : q.node === next ? 0xffd43b : 0xffffff, r = q.node === next ? 40 : 26;
      const d = new THREE.Mesh(new THREE.CircleGeometry(r, 28).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: col, depthWrite: false }));
      d.position.set((q.p[0] + 0.5) * T, 5, (q.p[1] + 0.5) * T); d.userData.own = true; d.userData.ownMat = true; d.renderOrder = 5; worldG.add(d); R.dotG.push(d);
    }
  }
  function buildWhy(nd) {
    const p = R.p, par = R.par.get(nd);
    if (!par) return p.from === 'prefix' ? 'In prefix the <b>first</b> token is the top of the tree: ' + C(symOf(nd)) + '.' : p.from === 'postfix' ? 'In postfix the <b>last</b> token is the top of the tree: ' + C(symOf(nd)) + '.' : 'The top of the tree holds the operator worked <b>last</b>: ' + C(symOf(nd)) + '.';
    return 'This spot is the <b>' + par[1] + '</b> side of ' + C(par[0].op) + '. It holds ' + (nd.op ? 'the operator of ' : '') + infixOf(nd) + '.';
  }
  KIND.tree = {
    setup(R, m) {
      const t = R.p.t, nodes = nodesOf(t);
      treeWorld(R, false);
      R.supply = shuffle(nodes).map((nd, k) => {
        const s = addSlot({ role: 'supply', pad: 'supply', x: 1, y: 3 + k,
          put: (it, from) => from === s ? null : from && from.role === 'pedestal' ? { msg: 'Take tree cubes to the rail.' } : s.items.length ? { msg: 'That shelf spot is full.' } : null });
        addItem(s, cube(symOf(nd)));
        return s;
      });
      addSign('CUBES', 1, 2, 240);
      R.readOrder = R.p.read === 'prefix' ? preorder(t) : postorder(t); R.readN = 0;
      R.splitG = []; R.tourG = []; R.dotG = [];
      R.rail = addSlot({ role: 'rail', x: Math.floor((23 - nodes.length) / 2), y: 15, w: nodes.length, grow: 'right', label: FORM_NAME[R.p.read].toUpperCase() + ' RAIL', tag: { tagY: 130 },
        take: () => 'It is on the rail. Keep going.',
        put: (it, from) => {
          if (!from || from.role !== 'pedestal') return { msg: 'Build the tree first. Then take cubes from the tree to the rail.' };
          const want = R.readOrder[R.readN];
          if (it.node !== want) return { msg: readWhy(it.node), mistake: true };
          return null;
        } });
      pos.x = 11; pos.y = 16.2;
      showSplit();
    },
    placed(it, slot, from) {
      if (slot.role === 'pedestal' && from.role === 'supply') {
        it.node = slot.node; const par = R.par.get(slot.node);
        explain(!par ? C(it.sym) + ' goes at the top: ' + (R.p.from === 'prefix' ? 'in prefix the first token is the top.' : R.p.from === 'postfix' ? 'in postfix the last token is the top.' : 'it is the operator worked last.')
          : C(it.sym) + ' is the ' + par[1] + ' side of ' + C(par[0].op) + (slot.node.op ? ', and it is an operator, so it has two sides of its own.' : '.'));
        if ([...R.ped.values()].every(s => s.items.length)) { R.stage = 'read'; explain('The tree is built. Now read it as ' + R.p.read + ': ' + (R.p.read === 'prefix' ? 'each node <b>before</b> its sides, left side first.' : 'both sides <b>before</b> the node, left side first.')); showTour(); }
        showSplit();
      }
      if (slot === R.rail) {
        R.readN++; const nd = it.node; showDots();
        explain(R.p.read === 'prefix' ? (nd.op ? C(nd.op) + ' comes before its two sides. Next: its left side.' : C(nd.v) + ' has no sides, so go on to the next part of the tree.')
          : (nd.op ? 'Both sides of ' + C(nd.op) + ' are on the rail, so now ' + C(nd.op) + ' comes.' : C(nd.v) + ' has no sides, so it goes straight on the rail.'));
      }
    },
    check() { if (R.readN === R.readOrder.length && !hand.item) finishRound(FORM_NAME[R.p.read] + ': ' + Cs(R.readOrder.map(symOf)) + '.'); },
    guide(R, m) {
      const ch = m.type === 'challenge', box = treeBox();
      if (R.stage === 'build') {
        const need = preorder(R.p.t).find(nd => !R.ped.get(nd).items.length);
        if (hand.item) { if (ch) return box; const nd = preorder(R.p.t).find(x => !R.ped.get(x).items.length && symOf(x) === hand.item.sym); return nd ? slotTarget(R.ped.get(nd)) : null; }
        if (ch) return boxTarget(1, 3, 1, 3 + R.supply.length - 1);
        const s = need && R.supply.find(x => x.items.length && top(x).sym === symOf(need));
        return s ? slotTarget(s) : null;
      }
      if (hand.item) return slotTarget(R.rail);
      if (ch) return box;
      const want = R.readOrder[R.readN];
      return want ? slotTarget(R.ped.get(want)) : null;
    },
    steps(R, m) {
      const t = R.p.t, filled = list => list.every(nd => R.ped.get(nd).items.length || R.stage === 'read');
      return [
        { text: 'The label over each spot shows its part of the expression. The <b>yellow</b> cube goes on the spot; the <b>blue</b> part goes down the left branch, the <b>green</b> part down the right.', done: () => filled([t]) },
        { text: 'Build the left side: ' + Cs(NC.tokens(infixOf(t.l))) + '.', done: () => filled(nodesOf(t.l)) },
        { text: 'Build the right side: ' + Cs(NC.tokens(infixOf(t.r))) + '.', done: () => filled(nodesOf(t.r)) },
        { text: 'Read it as ' + R.p.read + ': follow the purple line round the tree from START. Take each cube to the rail when the line reaches its dot (on its <b>' + (R.p.read === 'prefix' ? 'left' : 'right') + '</b> side).', done: () => R.readN === R.readOrder.length }
      ];
    },
    expr(R) { return '<b>' + FORM_NAME[R.p.from] + ':</b> ' + Cs(sourceTokens(R.p)) + (R.splitNode ? '<div class="cl-splitrow"><b>Next spot:</b> ' + splitHtml(R.splitNode, R.p.from) + '</div>' : '') + (R.p.implied ? '<br><span class="note">A number next to a letter or a bracket means times: 2(A + B) is 2 * (A + B).</span>' : '') + '<br><b>Read it as:</b> ' + FORM_NAME[R.p.read] + (R.stage === 'read' ? ' (' + R.readN + ' of ' + R.readOrder.length + ')' : ''); },
    walk(R, m) {
      let t; do t = RT({ n: 2, ops: ['+', '-', '*'], letters: true }); while (NC.toPrefix(t).join() === NC.toPrefix(R.p.t).join());
      const from = R.p.from, read = R.p.read, src = sourceTokens({ t, from });
      const steps = [{ text: '<b>A different expression.</b> ' + FORM_NAME[from] + ': ' + Cs(src) + '.', visual: treeSvg(t, [], { shown: new Set() }) }];
      const placed = new Set();
      preorder(t).forEach((n, i) => {
        steps.push({ text: splitHtml(n, from) + (i === 0 ? '<br>' + (from === 'prefix' ? 'The first' : from === 'postfix' ? 'The last' : 'The one worked last') + ' (yellow) goes on top. Blue goes down the left, green down the right.' : ''), visual: treeSvg(t, [], { shown: new Set([...placed, n]), split: n }) });
        placed.add(n);
      });
      const ord = read === 'prefix' ? preorder(t) : postorder(t);
      steps.push({ text: 'To read it, follow a line round the outside from the top, on the left. ' + (read === 'prefix' ? 'Prefix: take each cube as the line passes its <b>left</b> side.' : 'Postfix: take each cube as the line passes its <b>right</b> side.'), visual: treeSvg(t, [], { tour: read }) });
      steps.push({ text: FORM_NAME[read] + ': ' + Cs(ord.map(symOf)) + '.', visual: treeSvg(t, [], { tour: read, upto: ord.length }) });
      steps.push({ text: 'Now build and read yours the same way.', visual: '' });
      return steps;
    }
  };
  function readWhy(nd) {
    const par = R.par.get(nd), seen = new Set(R.readOrder.slice(0, R.readN));
    if (R.p.read === 'prefix') { if (par && !seen.has(par[0])) return 'In prefix a node comes <b>before</b> its sides. Read ' + C(par[0].op) + ' first.'; return 'Read the whole left side before the right side.'; }
    if (nd.op && !(seen.has(nd.l) && seen.has(nd.r))) return 'In postfix both sides come <b>before</b> the operator. Read the sides of ' + C(nd.op) + ' first.';
    return 'Read the whole left side before the right side.';
  }
  // o.shown: only these spots have their cube (the rest are empty); o.split: colour that node's sides; o.tour: the line
  // round the tree with a dot on each node's left (prefix) or right (postfix), numbered up to o.upto
  function treeSvg(t, hl, o = {}) {
    const ino = inorder(t), par = parentMap(t), at = new Map();
    const depth = n => { let d = 0, q = n; while (par.has(q)) { q = par.get(q)[0]; d++; } return d; };
    ino.forEach((n, i) => at.set(n, [40 + i * 48, 40 + depth(n) * 64]));
    const w = 80 + (ino.length - 1) * 48, h = 90 + Math.max(...ino.map(depth)) * 64;
    const side = n => !o.split ? '' : n === o.split ? ' sroot' : o.split.op && nodesOf(o.split.l).includes(n) ? ' sl' : o.split.op && nodesOf(o.split.r).includes(n) ? ' sr' : '';
    let s = '<svg class="cl-tree" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="An expression tree">';
    for (const n of ino) if (n.op) for (const c of [n.l, n.r]) { const a = at.get(n), b = at.get(c); s += '<line class="' + (o.split === n ? (c === n.l ? 'bl' : 'br') : '') + '" x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '"/>'; }
    if (o.tour) {
      const pts = tourPoints(t, n => { const [x, y] = at.get(n); return { x: x / 24, y: y / 24 }; });
      s += '<polyline class="tour" points="' + pts.map(q => (q.p[0] * 24).toFixed(1) + ',' + (q.p[1] * 24).toFixed(1)).join(' ') + '"/>';
      const ord = o.tour === 'prefix' ? preorder(t) : postorder(t);
      for (const q of pts) if (q.when === o.tour) { const k = ord.indexOf(q.node), x = q.p[0] * 24, y = q.p[1] * 24; s += '<circle class="dot" cx="' + x + '" cy="' + y + '" r="' + (k < (o.upto || 0) ? 9 : 5) + '"/>' + (k < (o.upto || 0) ? '<text class="dotn" x="' + x + '" y="' + (y + 4) + '">' + (k + 1) + '</text>' : ''); }
    }
    for (const n of ino) {
      const [x, y] = at.get(n), show = !o.shown || o.shown.has(n);
      s += show ? '<g class="' + roleOf(symOf(n)) + (hl.includes(n) ? ' lit' : '') + side(n) + '"><rect x="' + (x - 17) + '" y="' + (y - 17) + '" width="34" height="34" rx="6"/><text x="' + x + '" y="' + (y + 7) + '">' + symOf(n) + '</text></g>'
        : '<g class="empty' + side(n) + '"><rect x="' + (x - 17) + '" y="' + (y - 17) + '" width="34" height="34" rx="6"/></g>';
    }
    return s + '</svg>';
  }
  function treeBox() { const xs = [...R.ped.values()].map(s => s.x), ys = [...R.ped.values()].map(s => s.y); return boxTarget(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)); }

  // ---------------------------------------------------------------- back to infix: read the tree in order, brackets where needed
  KIND.infix = {
    setup(R) {
      treeWorld(R, true);
      R.E = infixTokens(R.p.t); R.k = 0;
      for (const [sym, y] of [['(', 4], [')', 7]]) {
        const s = addSlot({ role: 'crate', pad: 'crate', x: 21, y, crate: sym, label: sym === '(' ? 'OPEN BRACKETS' : 'CLOSE BRACKETS', tag: { tagY: 170 },
          put: (it, from) => it.sym === sym ? null : { msg: 'That crate is for ' + sym + ' cubes.' } });
        s.show = makeCube(sym, 'paren'); s.show.group.position.set((21 + 0.5) * T, PAD_H + CUBE / 2 + 2, (y + 0.5) * T); worldG.add(s.show.group);
      }
      R.rail = addSlot({ role: 'rail', x: 2, y: 15, w: 18, grow: 'right', label: 'INFIX RAIL', tag: { tagY: 130 },
        take: () => 'It is on the rail. Keep going.',
        put: it => {
          const e = R.E[R.k];
          if (!e) return { msg: 'The rail is finished.' };
          if (it.role === 'paren') {
            if (e.tok === it.sym) return null;
            if (it.sym === ')') return { msg: e.tok === '(' ? 'Open a bracket first: ' + infixOf(e.sub) + ' must be worked before the ' + e.parentOp + ' next to it.' : 'Nothing to close here yet.', mistake: true };
            return { msg: e.tok === ')' ? 'Close the bracket now: ' + infixOf(e.sub) + ' is finished.' : 'No bracket here: the order of operations already works this part in the right order.', mistake: true };
          }
          if (e.node === it.node) return null;
          if (e.tok === '(') return { msg: 'Open a bracket first: ' + infixOf(e.sub) + ' must be worked before the ' + C(e.parentOp) + ' next to it.', mistake: true };
          if (e.tok === ')') return { msg: 'Close the bracket now: ' + infixOf(e.sub) + ' is finished.', mistake: true };
          return { msg: 'Infix reads the left side, then the operator, then the right side.', mistake: true };
        } });
      pos.x = 11; pos.y = 16.2;
    },
    placed(it, slot) {
      if (slot !== R.rail) return;
      const e = R.E[R.k]; R.k++;
      if (e.tok === '(') explain('A bracket opens: ' + infixOf(e.sub) + ' must be worked before the ' + C(e.parentOp) + ' next to it.');
      else if (e.tok === ')') explain(infixOf(e.sub) + ' is finished, so the bracket closes.');
      else if (e.node.op) explain(C(e.node.op) + ' goes <b>between</b> its two sides. Its left side is on the rail; its right side comes next.');
      else explain(C(e.node.v) + ': infix reads the left side, then the operator, then the right side.');
    },
    check() { if (R.k === R.E.length && !hand.item) finishRound('Infix: ' + Cs(R.E.map(e => e.tok)) + '.'); },
    guide(R, m) {
      if (hand.item) return slotTarget(R.rail);
      if (m.type === 'challenge') return treeBox();
      const e = R.E[R.k]; if (!e) return null;
      if (e.tok === '(' || e.tok === ')') return slotTarget(slots.find(s => s.crate === e.tok));
      return slotTarget(R.ped.get(e.node));
    },
    steps(R) {
      const out = []; let run = [];
      const flush = end => { if (!run.length) return; const toks = run.slice(); out.push({ text: 'Take ' + Cs(toks) + ' to the rail, in that order.', done: () => R.k >= end }); run = []; };
      R.E.forEach((e, i) => {
        if (e.tok === '(') { flush(i); out.push({ text: 'Open a bracket: ' + infixOf(e.sub) + ' is worked before the ' + C(e.parentOp) + ' next to it, so it needs brackets. Take a ' + C('(') + ' to the rail.', done: () => R.k > i }); }
        else if (e.tok === ')') { flush(i); out.push({ text: 'Close the bracket after ' + infixOf(e.sub) + ': take a ' + C(')') + ' to the rail.', done: () => R.k > i }); }
        else run.push(e.tok);
      });
      flush(R.E.length);
      return out;
    },
    expr(R) { return '<b>' + FORM_NAME[R.p.from] + ':</b> ' + Cs(sourceTokens(R.p)) + '<br><b>Write it in infix</b> on the rail (' + R.k + ' cubes so far).'; },
    walk(R) {
      let t; do t = RT({ n: 2, ops: ['+', '-', '*', '/'], letters: true }); while (!/\(/.test(infixOf(t)) || NC.toPrefix(t).join() === NC.toPrefix(R.p.t).join());
      const E = infixTokens(t), steps = [{ text: '<b>A different tree.</b> Read it in order: the left side, the operator, then the right side.', visual: treeSvg(t, []) }];
      for (const e of E) if (e.tok === '(') steps.push({ text: infixOf(e.sub) + ' sits under ' + C(e.parentOp) + '. ' + C(e.parentOp) + ' would be worked first, so ' + infixOf(e.sub) + ' needs brackets.', visual: treeSvg(t, nodesOf(e.sub)) });
      steps.push({ text: 'Without brackets: ' + NC.toInfix(t, {}).replace(/[()]/g, '') + ' would mean something else. With them: <span class="hl">' + infixOf(t) + '</span>.', visual: '' });
      steps.push({ text: 'A part needs brackets only when the operator above it would be worked first. Now do yours.', visual: '' });
      return steps;
    }
  };

  // ---------------------------------------------------------------- bit-string flicking machines
  function bitsWorld(R, ast, interactive) {
    const machines = writtenOrder(ast).filter(isOpNode), leaves = writtenOrder(ast).filter(n => !isOpNode(n));
    let x = 2; const plan = machines.map(n => { const w = n.t === 'bin' ? 7 : 4, at = x; x += w + 1; return { n, x: at, w }; });
    const W = Math.max(22, x + 4);
    newWorld(W, 15, 'Bit machines');
    R.mach = new Map(); R.parent = bitParents(ast); R.ran = new Set();
    for (const p of plan) {
      const n = p.n, name = BC.opName(n), deco = n.t === 'not' ? 'press' : n.t === 'bin' ? 'gate' : n.op === 'LSHIFT' ? 'left' : n.op === 'RSHIFT' ? 'right' : n.op === 'LCIRC' ? 'wrapL' : 'wrapR';
      addBody(p.x, 5, p.w, n.t === 'not' ? 0x5f3dc4 : n.t === 'bin' ? 0x1864ab : 0x0b7285, name, deco);
      const mc = { n, ins: [], out: null };
      const nIn = n.t === 'bin' ? 2 : 1;
      for (let k = 0; k < nIn; k++) {
        const s = addSlot({ role: 'min', pad: 'machine', x: p.x + k * 3, y: 6, label: 'IN', mach: mc,
          take: () => 'It is in the machine. It runs when every input is in.',
          put: (it, from) => {
            if (!interactive) return { msg: 'Set the x lamps, then press Run the machines.' };
            if (s.items.length) return { msg: 'That input is full.' };
            if (R.parent.get(it.node) !== n) return { msg: bitsWhy(it, n), mistake: true };
            return null;
          } });
        mc.ins.push(s);
      }
      mc.out = addSlot({ role: 'mout', pad: 'out', x: p.x + p.w - 1, y: 6, label: 'OUT', mach: mc,
        take: () => interactive ? null : 'This tray shows what the machine made. Set the x lamps, then run the machines again.',
        put: (it, from) => from === mc.out ? null : { msg: 'The machine gives trays out here.' } });
      R.mach.set(n, mc);
    }
    return { leaves, W };
  }
  function bitsWhy(it, mn) {
    const par = R.parent.get(it.node);
    if (!par) return 'This tray is the answer. Take it to the Answer pad.';
    if (par.t !== 'bin') return BC.opName(par) + ' works on the string just after it, so this tray goes into ' + BC.opName(par) + ' first.';
    if (mn.t !== 'bin') return BC.opName(mn) + ' works only on the string just after it: ' + BC.show(mn.a) + '.';
    return ORDER_RULE + ' So this ' + mn.op + ' works on ' + BC.show(mn.a) + ' and ' + BC.show(mn.b) + '. This tray goes into the ' + par.op + '.';
  }
  function tray(bits, node, label) { return { tray: true, bits, node, label: label || bits, role: 'tray' }; }
  function runBits(mc, out) {
    for (const s of mc.ins) { s.items.forEach(killItem); s.items = []; }
    addItem(mc.out, tray(out, mc.n)); R.ran.add(mc.n);
  }
  KIND.bits = {
    setup(R) {
      const ast = BC.parse(R.p.src); R.ast = ast;
      const { leaves, W } = bitsWorld(R, ast, true);
      R.shelf = leaves.map((n, k) => {
        const s = addSlot({ role: 'shelf', pad: 'tray', x: 3 + k * 3, y: 11,
          put: (it, from) => from === s ? null : s.items.length ? { msg: 'That spot is full.' } : null });
        addItem(s, tray(n.v, n)); return s;
      });
      addSign('TRAYS', 3 + (leaves.length - 1) * 1.5, 10, 220);
      R.ans = addSlot({ role: 'answer', x: W - 3, y: 11, label: 'ANSWER PAD',
        put: it => it.node === ast ? null : { msg: 'There is more to work out: this tray still goes into ' + BC.opName(R.parent.get(it.node)) + '.', mistake: true } });
      pos.x = Math.floor(W / 2); pos.y = 13;
    },
    placed(it, slot) {
      const mc = slot.mach;
      if (slot.role === 'min') explain(lampsHtml(it.bits) + ' goes into <b>' + BC.opName(mc.n) + '</b>' + (mc.n.t === 'bin' ? ': ' + mc.n.op + ' works on the two strings on each side of it, once both are worked out.' : ': it works on the string just after it.'));
      if (slot.role === 'answer') explain('That was the last machine, so ' + lampsHtml(it.bits) + ' is the answer.');
      if (slot.role === 'min' && mc.ins.every(s => s.items.length) && !R.ask) {
        const n = mc.n, a = top(mc.ins[0]).bits, b = mc.ins[1] ? top(mc.ins[1]).bits : null, out = BC.apply(n, a, b);
        const q = n.t === 'bin' ? lampsHtml(a) + ' <b>' + n.op + '</b> ' + lampsHtml(b) : '<b>' + BC.opName(n) + '</b> ' + lampsHtml(a);
        R.ask = { type: 'bits', len: out.length, q: 'Predict the new tray: ' + q, answer: out, hint: ruleFor(n), why: ruleFor(n) + ' The answer is ' + out + '.',
          done: () => { runBits(mc, out); explain(ruleFor(n) + ' ' + q + ' = ' + lampsHtml(out)); } };
      }
    },
    check() { if (R.ans.items.length && !hand.item) finishRound('The answer is <b>' + top(R.ans).bits + '</b>.'); },
    guide(R, m) {
      if (R.ask) return null;
      const free = slots.filter(s => (s.role === 'shelf' || s.role === 'mout' || s.role === 'answer') && s.items.length).map(s => top(s));
      if (m.type === 'challenge') {
        if (hand.item) return areaTarget([...R.mach.values()].flatMap(mc => mc.ins).filter(x => !x.items.length));
        const loose = slots.filter(s => (s.role === 'shelf' || s.role === 'mout') && s.items.length);
        const t = areaTarget(loose); if (t) t.glowAll = loose.map(top); return t;
      }
      const work = bitNodes(R.ast).filter(isOpNode);
      const dest = it => { const par = R.parent.get(it.node); return par ? R.mach.get(par).ins.find(s => !s.items.length) : R.ans; };
      if (hand.item) { const d = dest(hand.item); return d ? slotTarget(d) : null; }
      const next = work.find(n => !R.ran.has(n));
      const it = next ? free.find(x => R.parent.get(x.node) === next) : free.find(x => x.node === R.ast && x.slot.role !== 'answer');
      return it ? slotTarget(it.slot) : null;
    },
    steps(R) {
      const out = bitNodes(R.ast).filter(isOpNode).map(n => ({ text: '<b>' + BC.opName(n) + '</b>' + (n.t === 'bin' ? ': carry its two trays in.' : ': carry ' + (isOpNode(n.a) ? 'the tray from ' + BC.opName(n.a) : 'tray ' + n.a.v) + ' in.') + ' ' + ruleFor(n) + ' Predict, then take the new tray out.', done: () => R.ran.has(n) }));
      out.push({ text: 'Carry the last tray to the <b>Answer pad</b>.', done: () => R.over });
      return out;
    },
    expr(R) { return '<b>Work out:</b> <code class="cl-code">' + R.p.src + '</code>'; },
    walk(R, m) { return bitsWalk(R.p.src, m.type === 'tutorial' ? (R.p.src.includes('CIRC') || R.p.src.includes('SHIFT') ? () => 'LCIRC-' + rnd(1, 3) + ' RSHIFT-' + rnd(1, 2) + ' ' + bitsStr(5) : () => 'NOT ' + bitsStr(5) + ' OR ' + bitsStr(5)) : () => bitsExpr()); }
  };
  function bitsWalk(cur, gen) {
    let src; do src = gen(); while (src === cur || !bitsDistinct(src));
    const ast = BC.parse(src), steps = [{ text: '<b>A different expression.</b> <code class="cl-code">' + src + '</code>. ' + ORDER_RULE, visual: '' }];
    const val = new Map();
    for (const n of bitNodes(ast)) {
      if (!isOpNode(n)) { val.set(n, n.v); continue; }
      const a = val.get(n.a), b = n.t === 'bin' ? val.get(n.b) : null, r = BC.apply(n, a, b); val.set(n, r);
      steps.push({ text: ruleFor(n), visual: '<div class="cl-work">' + (b != null ? lampsHtml(a) + ' <b>' + n.op + '</b> ' + lampsHtml(b) : '<b>' + BC.opName(n) + '</b> ' + lampsHtml(a)) + ' = ' + lampsHtml(r) + '</div>' });
    }
    steps.push({ text: 'The answer is <span class="hl">' + val.get(ast) + '</span>. Now do yours the same way: predict each tray before the machine shows it.', visual: '' });
    return steps;
  }

  // ---------------------------------------------------------------- solve for x: set the lamps, then run the machines
  KIND.solve = {
    setup(R, m) {
      const ast = BC.parse(R.p.src); R.ast = ast; R.x = '00000'; R.runs = 0;
      const { W } = bitsWorld(R, ast, false);
      // the constants sit in their machines' inputs already; x goes in when you run it
      for (const n of bitNodes(ast).filter(isOpNode)) if (n.t === 'bin') { const c = n.a.t === 'bits' ? n.a : n.b; const mc = R.mach.get(n); addItem(mc.ins[n.a === c ? 0 : 1], tray(c.v, c)); }
      R.lamps = [0, 1, 2, 3, 4].map(k => addSlot({ role: 'lamp', pad: 'lamp', x: Math.floor(W / 2) - 4 + k * 2, y: 11, lamp: k, label: k === 2 ? 'x' : null, tag: { tagY: 160, tagSize: 0.04 } }));
      R.lampCubes = R.lamps.map(s => { const c = makeCube('0', 'off', 1.25); c.group.position.set((s.x + 0.5) * T, PAD_H + 36, (s.y + 0.5) * T); worldG.add(c.group); return c; });
      R.target = addSlot({ role: 'target', x: W - 3, y: 9, label: 'TARGET', put: () => ({ msg: 'Set the x lamps, then press Run the machines.' }) });
      addItem(R.target, tray(R.p.rhs, null, 'TARGET ' + R.p.rhs));
      R.U = undoSteps(R.p.src, R.p.rhs); R.undone = 0;
      pos.x = Math.floor(W / 2); pos.y = 13;
    },
    toggle(k) {
      const b = R.x.split(''); b[k] = b[k] === '1' ? '0' : '1'; R.x = b.join('');
      const old = R.lampCubes[k], c = makeCube(b[k], b[k] === '1' ? 'on' : 'off', 1.25); c.group.position.copy(old.group.position);
      worldG.remove(old.group); old.dispose(); worldG.add(c.group); R.lampCubes[k] = c; R.moves++;
      if (R.shown) { for (const mc of R.mach.values()) { mc.out.items.forEach(killItem); mc.out.items = []; } R.shown = false; }
    },
    run() {
      const steps = BC.trace(R.ast, R.x), got = BC.evaluate(R.ast, R.x);
      // the trays come out of each machine in turn
      for (const mc of R.mach.values()) { mc.out.items.forEach(killItem); mc.out.items = []; }
      bitNodes(R.ast).filter(isOpNode).forEach((n, i) => addItem(R.mach.get(n).out, tray(steps[i].result, n)));
      R.shown = true; R.runs++; R.trace = steps; R.got = got;
      steps.forEach(st => explain(st.op + ': ' + st.text.replace(/[01]{2,}/g, b => lampsHtml(b))));
      if (got === R.p.rhs) { toast('x = ' + R.x + ' gives the target ' + R.p.rhs + '.', 'good'); finishRound('x = <b>' + R.x + '</b> gives ' + R.p.rhs + '.'); }
      else if (M.m.type === 'challenge') { mistake('x = ' + R.x + ' gives ' + got + ', not ' + R.p.rhs + '. The answer was x = ' + R.p.sol + '.'); return; }
      else mistake('x = ' + R.x + ' gives ' + got + ', not ' + R.p.rhs + '. Work backwards again: follow the steps.');
      drawAll();
    },
    placed() { },
    check() {
      if (M.m.type === 'tutorial' && !R.ask && R.undone < R.U.steps.length) {
        const u = R.U.steps[R.undone];
        R.ask = { type: 'bits', len: 5, q: u.text, answer: u.out, hint: u.rule, why: u.rule + ' The answer is ' + u.out + '.', done: () => { R.undone++; explain(u.text.replace(/<\/?b>/g, '') + ' ' + lampsHtml(u.from) + ' becomes ' + lampsHtml(u.out) + '.'); } };
      }
    },
    guide(R, m) {
      if (R.ask || R.over) return null;
      const k = m.type === 'tutorial' && R.undone >= R.U.steps.length ? [...R.x].findIndex((b, i) => b !== R.U.x[i]) : -1;
      return k >= 0 ? slotTarget(R.lamps[k]) : boxTarget(R.lamps[0].x, 11, R.lamps[4].x, 11);
    },
    steps(R) {
      const out = R.U.steps.map((u, i) => ({ text: u.text, done: () => R.undone > i }));
      out.push({ text: 'Set the x lamps to <b>' + (R.undone >= R.U.steps.length ? R.U.x : 'your answer') + '</b>: stand at a lamp and press Space to switch it on or off.', done: () => R.undone >= R.U.steps.length && R.x === R.U.x });
      out.push({ text: 'Press <b>Run the machines</b> to check.', done: () => R.over });
      return out;
    },
    expr(R) { return '<b>Find x:</b> <code class="cl-code">' + R.p.src + ' = ' + R.p.rhs + '</code><br><b>Your x:</b> ' + lampsHtml(R.x) + (R.shown ? '<br><b>Gives:</b> ' + lampsHtml(R.got) : ''); },
    walk(R) {
      let q; do q = solveExpr(); while (q.src === R.p.src);
      const U = undoSteps(q.src, q.rhs), steps = [{ text: '<b>A different one.</b> <code class="cl-code">' + q.src + ' = ' + q.rhs + '</code>. Start at the target and undo each machine, from the last one back to x.', visual: '' }];
      for (const u of U.steps) steps.push({ text: u.text.replace(/<\/?b>/g, '') + ' ' + u.rule, visual: '<div class="cl-work">' + lampsHtml(u.from) + ' <b>' + u.op + '</b> = ' + lampsHtml(u.out) + '</div>' });
      steps.push({ text: 'So x = <span class="hl">' + U.x + '</span>. Check it: run the machines forwards and you get ' + q.rhs + '. Now do yours.', visual: '' });
      return steps;
    }
  };

  // ---------------------------------------------------------------- What Does This Program Do?: a trace you walk round
  // Each variable has a pad holding a cube with its value. A line changes one variable: walk to its pad, press Space
  // and give the new value (the cube then shows it). A long loop first asks what it does. The panel shows the program
  // with the line you are on, and the trace table so far.
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const progHtml = (lines, now) => '<pre class="cl-prog">' + lines.map((l, i) => '<span' + (i === now ? ' class="now"' : '') + '>' + esc(l) + '</span>').join('\n') + '</pre>';
  function setPad(v, val) {
    const s = R.vp[v]; s.items.forEach(killItem); s.items = [];
    addItem(s, { sym: String(val), role: val === '?' ? 'unknown' : 'num' });
  }
  function autos() {
    while (R.at < R.cps.length && R.cps[R.at].auto) { const c = R.cps[R.at]; R.disp[c.var] = c.value; R.hist[c.var].push(c.value); setPad(c.var, c.value); R.at++; }
  }
  function traced(cp) {
    if (cp.var && !cp.final) { R.disp[cp.var] = cp.value; R.hist[cp.var].push(cp.value); setPad(cp.var, cp.value); }
    R.at++; autos();
    explain(cp.why);
    if (R.at >= R.cps.length) finishRound('The program outputs <b>' + R.run.out + '</b>.');
  }
  function pressVar(v) {
    if (!R || R.over || locked()) return;
    const cp = R.cps[R.at]; if (!cp) return;
    if (cp.kind === 'choice') { toast('Answer the question on the right first.', 'hint'); return; }
    if (cp.var !== v) { toast((cp.final ? 'The program outputs ' + cp.var : 'The next change is to ' + cp.var) + '. Walk to the ' + cp.var + ' pad.', 'hint'); return; }
    R.moves++;
    R.ask = { type: 'num', q: cp.q, answer: cp.value, hint: cp.hint, why: cp.why, done: () => traced(cp) };
  }
  KIND.trace = {
    start() { return 'Trace the program from the top, one line at a time. Each pad holds a variable.'; },
    setup(R, m) {
      R.run = runProg(R.p.prog, m.type === 'challenge'); R.cps = R.run.cps; R.at = 0;
      const vars = R.run.vars, W = 22;
      newWorld(W, 14, 'Program trace');
      R.disp = {}; R.hist = {}; R.vp = {};
      const x0 = Math.floor(W / 2) - Math.floor((vars.length - 1) * 3 / 2);
      vars.forEach((v, i) => {
        R.hist[v] = [];
        R.vp[v] = addSlot({ role: 'var', pad: 'answer', x: x0 + i * 3, y: 6, label: v, tag: { tagY: 170, tagSize: 0.05 }, press: () => pressVar(v), pressText: 'to work out the new value of ' + v + '.' });
        setPad(v, '?');
      });
      addSign('VARIABLES', Math.floor(W / 2), 3, 220, { bg: '#ffd43b', ink: '#1a1200', size: 0.034 });
      pos.x = Math.floor(W / 2); pos.y = 10;
      autos();
    },
    placed() { },
    check() {
      const cp = R.cps[R.at];
      if (cp && cp.kind === 'choice' && !R.ask) R.ask = { type: 'choice', wide: true, q: cp.q, options: cp.options, answer: cp.answer, hint: cp.hint, why: cp.why, done: () => traced(cp) };
    },
    guide(R, m) {
      const cp = R.cps[R.at]; if (!cp || !cp.var || R.ask || R.over) return null;
      return m.type === 'tutorial' ? slotTarget(R.vp[cp.var]) : areaTarget(Object.values(R.vp));
    },
    steps(R) {
      const out = [];
      R.cps.forEach((cp, i) => {
        if (cp.auto) return;
        out.push({ text: i < R.at ? (cp.kind === 'choice' ? 'The ' + cp.loop + ' loop: ' + cp.answer : cp.final ? 'Output: <b>' + cp.value + '</b>.' : (cp.ctx ? cp.ctx + ': ' : cp.loop ? 'After the ' + cp.loop + ' loop: ' : '') + cp.var + ' = <b>' + cp.value + '</b>.')
          : i === R.at ? (cp.kind === 'choice' ? cp.q : 'Walk to the <b>' + cp.var + '</b> pad and press Space. ' + cp.q)
          : (cp.final ? 'The output.' : cp.kind === 'choice' ? 'What the ' + cp.loop + ' loop does.' : 'Then ' + cp.var + '.'), done: () => R.at > i });
      });
      return out;
    },
    goals() { return ['Go through the program one line at a time.', 'Walk to the variable that changes and give its new value.', 'For a long loop, first say what it does, then give the values when it ends.', 'a / k == int(a / k) is true when k divides a exactly.']; },
    expr(R) {
      const cp = R.cps[Math.min(R.at, R.cps.length - 1)];
      return (R.p.prog.cite ? '<span class="note">' + R.p.prog.cite + '</span>' : '') + progHtml(R.run.lines, R.over ? -1 : cp.line)
        + (cp && cp.ctx && !R.over ? '<div><b>Now:</b> ' + cp.ctx + '</div>' : '')
        + '<table class="cl-trace"><tr><th>Variable</th><th>Values so far</th></tr>' + R.run.vars.map(v => '<tr><td>' + v + '</td><td>' + (R.hist[v].join(', ') || '') + '</td></tr>').join('') + '</table>';
    },
    walk(R, m) {
      const prog = R.p.prog.body.some(s => s.for === 'i' && s.body.some(b => b.for)) ? progDoubling(3) : progNested(2, 3);
      const run = runProg(prog, false), steps = [{ text: '<b>A different program.</b> Go through it from the top, one line at a time.', visual: progHtml(run.lines, -1) }];
      for (const cp of run.cps) steps.push({ text: cp.auto ? cp.var + ' starts at ' + cp.value + '.' : cp.kind === 'choice' ? cp.q + ' ' + cp.answer : cp.final ? 'The output line: <span class="hl">' + cp.value + '</span>.' : cp.why.replace(/= (-?\d+)\.$/, '= <span class="hl">$1</span>.'), visual: progHtml(run.lines, cp.line) });
      steps.push({ text: 'That is the whole trace. Now trace yours.', visual: '' });
      return steps;
    }
  };

  // ---------------------------------------------------------------- the hand: hold to grab, let go to put down
  function locked() { return !M || M.phase !== 'play' || !R || R.over || !!R.ask || !$('cardWrap').hidden; }
  function grabTarget() {
    if (hand.item || locked()) return null;
    const s = nearestSlot(0.62, s => s.crate || s.role === 'lamp' || s.press || s.items.length);
    return s ? { slot: s } : null;
  }
  function setHand(down) {
    if (hand.down === down) return;
    hand.down = down;
    $('leftBtn')?.classList.toggle('on', down);
    if (!down) {
      if (hand.tapDrop) { hand.tapDrop = false; hint(); return; }   // the end of the tap that put something down
      const p = hand.pending, tap = clock - (hand.downAt || 0) < 0.3; hand.pending = null;
      // a tap picks up (a cube already in place too) and keeps carrying until the next tap; a hold puts down on release
      if (p && tap) { const g = grabTarget(); if (g && g.slot === p.s && top(p.s) === p.it) doGrab(p.s); }
      if (hand.item && tap) { hand.sticky = true; hint(); return; }
      letGo(); hint(); return;
    }
    hand.downAt = clock;
    if (hand.item && hand.sticky) { hand.sticky = false; hand.tapDrop = true; letGo(); hint(); return; }
    if (locked()) {
      if (M && M.phase === 'play' && R && R.ask) toast('Predict first: answer on the right.', 'hint');
      else if (M && M.phase !== 'play') toast(M.phase === 'ask' ? 'Answer the question on the right first.' : 'Press the button on the mission sheet to go on.', 'hint');
      else if (R && R.over) toast('Press the button on the mission sheet to go on.', 'hint');
      return;
    }
    const g = grabTarget(); if (!g) return;
    const s = g.slot;
    if (s.risky && !s.crate && s.role !== 'lamp' && !s.press && !s.take(top(s))) { hand.pending = { s, at: clock, it: top(s) }; hint(); return; }
    doGrab(s);
  }
  function holdTick() {
    const p = hand.pending, bar = $('holdBar');
    if (bar) bar.style.width = p && hand.down ? Math.min(100, (clock - p.at) / HOLD * 100) + '%' : '0%';
    if (!p || !hand.down || clock - p.at < HOLD) return;
    hand.pending = null;
    const g = grabTarget();
    if (g && g.slot === p.s && top(p.s) === p.it) doGrab(p.s);
  }
  function doGrab(s) {
    if (s.press) { s.press(s); afterChange(); return; }   // a pad you press (a variable in a program trace)
    if (s.role === 'lamp') { KIND.solve.toggle(s.lamp); toast('Lamp ' + (s.lamp + 1) + ' is ' + (R.x[s.lamp] === '1' ? 'on (1)' : 'off (0)') + '.', 'good'); afterChange(); return; }
    if (s.crate) { hand.item = cube(s.crate, { role: 'paren' }); itemMesh(hand.item); hand.from = s; hand.since = clock; afterChange(); return; }
    const it = top(s), why = s.take(it);
    if (why) { toast(why, 'hint'); return; }
    s.items.pop(); hand.item = it; it.slot = null; hand.from = s; hand.since = clock; R.moves++;
    afterChange();
  }
  function letGo() {
    const it = hand.item; if (!it) return;
    const from = hand.from;
    const back = () => { hand.item = null; hand.from = null; if (from.crate) killItem(it); else { from.items.push(it); it.slot = from; } };
    const s = nearestSlot(0.9, x => x.role !== 'lamp' && !x.press);
    if (!s) { back(); toast('Put it down over a pad: the glowing ring shows where.', 'hint'); afterChange(); return; }
    if (s === from) { back(); afterChange(); return; }
    const res = s.put(it, from);
    if (res) { back(); if (res.mistake) mistake(res.msg); else toast(res.msg, 'hint'); afterChange(); return; }
    hand.item = null; hand.from = null;
    if (s.crate) { killItem(it); afterChange(); return; }
    s.items.push(it); it.slot = s; R.moves++;
    KIND[M.m.kind].placed(it, s, from);
    afterChange();
  }
  function afterChange() {
    if (!M || !R) return;
    if (M.phase === 'play' && !R.over) KIND[M.m.kind].check();
    drawAll();
  }

  // ---------------------------------------------------------------- the guide: the arrow on the floor, the ring, the outline
  function slotTarget(s) { return s ? { x: s.x + (s.w - 1) / 2, y: s.y, reach: 1.05 + (s.w - 1) / 2, box: [s.x - 0.5, s.y - 0.5, s.x + s.w - 0.5, s.y + 0.5], exact: true, slot: s } : null; }
  function boxTarget(x0, y0, x1, y1) { return { x: Math.max(x0, Math.min(x1, pos.x)), y: Math.max(y0, Math.min(y1, pos.y)), reach: 1.1, box: [x0 - 0.5, y0 - 0.5, x1 + 0.5, y1 + 0.5] }; }
  // the pupil chooses: one place gets an arrow (no ring); several get no arrow at all, because an arrow to the nearest
  // one read as a hint and was often the wrong answer (glowAll can still light every choice the same)
  function areaTarget(list) { if (!list.length) return null; if (list.length > 1) return { glowOnly: true }; const t = slotTarget(list[0]); t.exact = false; return t; }
  function guideTarget() {
    if (!M || !R || M.phase !== 'play' || R.over) return null;
    // a spoilt challenge round guides like a tutorial: it does not count any more, so show the method
    const m = R.spoilt && M.m.type === 'challenge' && !M.m.noHelp ? Object.assign({}, M.m, { type: 'tutorial', countAsk: true }) : M.m;
    return KIND[M.m.kind].guide(R, m);
  }
  function arrowGeometry(pts, w, hl0) {
    const P = pts.map(([x, y]) => [(x + 0.5) * T, (y + 0.5) * T]), n = P.length, half = w / 2, verts = [], idx = [];
    const unit = (x, y) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
    for (let i = 0; i < n; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], [tx, ty] = unit(b[0] - a[0], b[1] - a[1]);
      let nx = -ty, ny = tx, k = 1;
      if (i > 0 && i < n - 1) { const [sx, sy] = unit(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); k = Math.min(2, 1 / Math.max(0.3, nx * -sy + ny * sx)); }
      verts.push(P[i][0] + nx * half * k, 3, P[i][1] + ny * half * k, P[i][0] - nx * half * k, 3, P[i][1] - ny * half * k);
      if (i) { const o = (i - 1) * 2; idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
    }
    const [ex, ey] = P[n - 1], [tx, ty] = unit(ex - P[n - 2][0], ey - P[n - 2][1]), hw = w * 1.35, hl = hl0 || w * 1.7, o = verts.length / 3;
    verts.push(ex - ty * hw, 3, ey + tx * hw, ex + ty * hw, 3, ey - tx * hw, ex + tx * hl, 3, ey + ty * hl);
    idx.push(o, o + 1, o + 2);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3)); g.setIndex(idx);
    return g;
  }
  const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffd43b, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  const arrows = new THREE.Group(), arrowBody = new THREE.Mesh(new THREE.BufferGeometry(), arrowMat), arrowGlow = new THREE.Mesh(new THREE.BufferGeometry(), glowMat);
  arrowBody.renderOrder = 3; arrowGlow.renderOrder = 2; arrowGlow.position.y = -0.5; arrows.add(arrowGlow, arrowBody); arrows.count = 0;
  let guideKey = '', guideAt = null, guideRoute = null, routeKey = '';
  const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  function gridRoute(sx, sy, g) {
    const N = MAPW * MAPH, cost = new Float64Array(N * 5).fill(Infinity), prev = new Int32Array(N * 5).fill(-1), buckets = [[]];
    const st = (sy * MAPW + sx) * 5 + 4;
    cost[st] = 0; buckets[0].push(st);
    for (let c = 0; c < buckets.length; c++) {
      const list = buckets[c]; if (!list) continue;
      for (let li = 0; li < list.length; li++) {
        const sid = list[li]; if (cost[sid] !== c) continue;
        const cell = Math.floor(sid / 5), dir = sid % 5, x = cell % MAPW, y = Math.floor(cell / MAPW);
        if (Math.hypot(x - g.x, y - g.y) <= g.reach) {
          const out = []; let k = sid;
          while (k !== -1) { const cc = Math.floor(k / 5); out.unshift([cc % MAPW, Math.floor(cc / MAPW)]); k = prev[k]; }
          return out.filter((p, i) => i === 0 || p[0] !== out[i - 1][0] || p[1] !== out[i - 1][1]);
        }
        for (let d = 0; d < 4; d++) {
          const nx = x + DIRS[d][0], ny = y + DIRS[d][1];
          if (solidAt(nx, ny)) continue;
          const nc = c + 1 + (dir !== 4 && dir !== d ? 2 : 0), nid = (ny * MAPW + nx) * 5 + d;
          if (nc < cost[nid]) { cost[nid] = nc; prev[nid] = sid; (buckets[nc] || (buckets[nc] = [])).push(nid); }
        }
      }
    }
    return null;
  }
  const pulse = new THREE.Mesh(new THREE.RingGeometry(62, 74, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xf2c21b, transparent: true, opacity: 0.9, depthWrite: false }));
  pulse.visible = false;
  function updateGuide(ts) {
    arrowMat.opacity = 0.78 + 0.2 * Math.sin(ts / 220); glowMat.opacity = 0.22 + 0.18 * Math.sin(ts / 220);
    const g = guideTarget();
    pulse.visible = !!(g && g.exact);
    if (g && g.exact) { pulse.position.set((g.x + 0.5) * T, PAD_H + 3, (g.y + 0.5) * T); pulse.scale.set(g.slot.w, 1, 1); pulse.material.opacity = 0.5 + 0.4 * Math.sin(ts / 180); }
    if (!g || g.glowOnly || Math.hypot(g.x - pos.x, g.y - pos.y) < g.reach + 0.2) { arrows.visible = false; arrows.count = 0; guideKey = ''; return; }
    const sx = Math.round(pos.x), sy = Math.round(pos.y);
    const tk = g.x.toFixed(2) + ',' + g.y.toFixed(2);
    if (tk + '@' + sx + ',' + sy !== routeKey) { routeKey = tk + '@' + sx + ',' + sy; guideRoute = gridRoute(sx, sy, g); }
    if (tk === guideKey && guideAt && Math.hypot(pos.x - guideAt[0], pos.y - guideAt[1]) < 0.03) return;
    guideKey = tk; guideAt = [pos.x, pos.y];
    const tiles = guideRoute;
    if (!tiles) { arrows.visible = false; return; }
    const corners = [tiles[0]];
    for (let i = 1; i < tiles.length - 1; i++) {
      const p = tiles[i - 1], q = tiles[i], r = tiles[i + 1];
      if ((q[0] - p[0]) !== (r[0] - q[0]) || (q[1] - p[1]) !== (r[1] - q[1])) corners.push(q);
    }
    if (tiles.length > 1) corners.push(tiles[tiles.length - 1]);
    let pts;
    if (corners.length > 1) { const [c0, c1] = corners; pts = [c0[1] === c1[1] ? [pos.x, c0[1]] : [c0[0], pos.y]].concat(corners.slice(1)); }
    else pts = [[pos.x, pos.y]];
    const last = pts[pts.length - 1];
    let tip = [g.x, g.y];
    if (g.box) { const [x0, y0, x1, y1] = g.box; tip = [Math.max(x0, Math.min(x1, last[0])), Math.max(y0, Math.min(y1, last[1]))]; }
    if (Math.abs(tip[0] - last[0]) > 0.02 && Math.abs(tip[1] - last[1]) > 0.02) {
      const prevPt = pts[pts.length - 2], horiz = prevPt ? Math.abs(prevPt[1] - last[1]) < 1e-6 : Math.abs(tip[0] - last[0]) > Math.abs(tip[1] - last[1]);
      pts.push(horiz ? [tip[0], last[1]] : [last[0], tip[1]]);
    }
    pts.push(tip);
    const trim = (list, len, fromEnd) => {
      const p = fromEnd ? list.slice().reverse() : list.slice();
      while (p.length > 1 && len > 0) {
        const l = Math.hypot(p[1][0] - p[0][0], p[1][1] - p[0][1]);
        if (l > len) { p[0] = [p[0][0] + (p[1][0] - p[0][0]) * len / l, p[0][1] + (p[1][1] - p[0][1]) * len / l]; len = 0; }
        else { len -= l; p.shift(); }
      }
      return fromEnd ? p.reverse() : p;
    };
    let line = trim(pts, 0.45, false);
    line = trim(line, 34 * 1.7 / T, true);
    const clean = [line[0]];
    for (const p of line) { const c = clean[clean.length - 1]; if (Math.hypot(p[0] - c[0], p[1] - c[1]) > 0.04) clean.push(p); }
    if (clean.length < 2) { arrows.visible = false; return; }
    arrowBody.geometry.dispose(); arrowGlow.geometry.dispose();
    arrowBody.geometry = arrowGeometry(clean, 34); arrowGlow.geometry = arrowGeometry(clean, 64, 34 * 1.7 + 14);
    arrows.visible = true; arrows.count = clean.length;
  }
  // an outline round what an empty hand would grab, or the pad a carried thing would go onto; the cube itself glows
  const outlineG = new THREE.Group();
  const outMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false });
  let outlineKey = '', glowing = new Set();
  function updateOutline(ts) {
    outMat.opacity = 0.6 + 0.35 * Math.sin(ts / 170);
    const g = grabTarget(), s = g ? g.slot : hand.item && !locked() ? nearestSlot(0.9, x => x.role !== 'lamp' && !x.press) : null;
    // what glows: the thing under your hand, the next thing the guide points at, and in a bit-string challenge every
    // tray you could pick up (none of them is singled out)
    const want = new Set();
    if (g && !g.slot.crate && g.slot.role !== 'lamp' && !g.slot.press && top(g.slot)) want.add(top(g.slot));
    const gt = !hand.item ? guideTarget() : null;
    if (gt && gt.exact && gt.slot.items.length) want.add(top(gt.slot));
    if (gt && gt.glowAll) gt.glowAll.forEach(x => want.add(x));
    for (const x of glowing) if (!want.has(x)) x.k3?.setGlow(false);
    for (const x of want) if (!glowing.has(x)) x.k3?.setGlow(true);
    glowing = want;
    const key = s ? s.id + (g ? 'g' : 'd') : '';
    if (key === outlineKey) return;
    outlineKey = key;
    for (const o of outlineG.children.slice()) { outlineG.remove(o); o.geometry.dispose(); }
    if (!s) return;
    const w = s.w * T - 4, d = T - 4, cx = (s.x + s.w / 2) * T, cz = (s.y + 0.5) * T, th = 10;
    for (const [x, z, sx, sz] of [[0, -d / 2, w + th, th], [0, d / 2, w + th, th], [-w / 2, 0, th, d], [w / 2, 0, th, d]]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, 4, sz), outMat); m.position.set(cx + x, PAD_H + 3, cz + z); outlineG.add(m);
    }
  }

  // ================================================================ missions and the mission sheet
  function inProgress() { return !!(M && R && M.phase === 'play' && (R.moves > 0 || M.have > 0) && !R.over); }
  function leaveThen(go) { if (!inProgress()) { go(); return; } M.leave = go; drawPanel(); document.querySelector('#mission .leave')?.scrollIntoView({ block: 'nearest' }); }
  function start(i) {
    missionAt = i; const m = MISSIONS[i]; openSecs.add(m.group);
    M = { m, phase: m.before ? 'ask' : 'play', have: 0, spoilt: 0, walked: false, afterOk: !m.after, lastKey: null };
    hand.item = null; hand.from = null; hand.pending = null;
    newRound();
  }
  // lesson mode: on or off, and which lesson (remembered on this computer)
  const lessonMode = Object.assign({ on: false, id: LESSONS[0].id }, load('lessonMode', {}) || {});
  { const q = new URLSearchParams(location.search).get('lesson'); if (q && LESSONS.some(L => L.id === q)) { lessonMode.on = true; lessonMode.id = q; } }
  const lessonList = () => { const L = LESSONS.find(x => x.id === lessonMode.id) || LESSONS[0]; return L.missions.concat(L.ext || []).map(id => MISSIONS.findIndex(m => m.id === id)).filter(i => i >= 0); };
  const isExt = i => ((LESSONS.find(x => x.id === lessonMode.id) || LESSONS[0]).ext || []).includes(MISSIONS[i].id);
  function startLesson() { const ids = lessonList(); start(ids.find(i => !done[MISSIONS[i].id]) ?? ids[0]); }
  const nextMission = () => {
    if (lessonMode.on) { const ids = lessonList(), k = ids.indexOf(missionAt); if (k >= 0) return k + 1 < ids.length ? ids[k + 1] : null; }
    const sec = MISSIONS.map((x, i) => [x, i]).filter(([x]) => x.group === MISSIONS[missionAt].group).map(([, i]) => i), k = sec.indexOf(missionAt); return k >= 0 && k + 1 < sec.length ? sec[k + 1] : (missionAt + 1 < MISSIONS.length ? missionAt + 1 : null); };
  const starsHtml = n => '<span class="stars" aria-label="' + n + ' of 3 stars">' + [0, 1, 2].map(i => '<svg viewBox="0 0 24 24" class="' + (i < n ? 'on' : '') + '"><path d="M12 2l3 7 7 .6-5.3 4.7 1.6 7.2L12 17.8 5.7 21.5l1.6-7.2L2 9.6 9 9z"/></svg>').join('') + '</span>';

  let lastFocus = "", logOpen = false;
  function drawPanel() {
    const t = $('mission'), m = M.m, K = KIND[m.kind];
    t.hidden = false; t.innerHTML = '';
    const inLesson = lessonMode.on && lessonList().includes(missionAt), inSec = inLesson ? lessonList().map(i => MISSIONS[i]) : MISSIONS.filter(x => x.group === m.group);
    const where = inLesson ? (LESSONS.find(x => x.id === lessonMode.id) || LESSONS[0]).title.split(':')[0] : m.group;
    t.appendChild(el('div', { class: 'head' }, '<span>' + (inLesson ? where + ': ' + m.group : m.group) + '</span><span>' + (inLesson ? (isExt(missionAt) ? 'Extension' : 'Activity') : m.type === 'tutorial' ? 'Tutorial' : 'Challenge') + ' ' + (inSec.indexOf(m) + 1) + ' of ' + inSec.length + '</span>'));
    t.appendChild(el('h2', {}, m.title));
    if (done[m.id] && M.phase !== 'done') t.appendChild(el('p', { class: 'note' }, 'Done before. Play it again for practice.'));
    t.appendChild(el('p', {}, m.intro));
    t.appendChild(el('div', { class: 'cl-expr' }, K.expr(R, m)));
    if (m.type === 'tutorial') {
      const st = K.steps(R, m), ol = el('ol', { class: 'steps' });
      let now = st.findIndex(s => !s.done()); if (M.phase === 'done') now = st.length;
      st.forEach((s, i) => ol.appendChild(el('li', { class: i < now || (now < 0) ? 'done' : i === now ? 'now' : 'later' }, '<span>' + s.text + '</span>')));
      t.appendChild(ol);
    } else {
      t.appendChild(el('ul', { class: 'goals' }, (m.kind === 'stack' ? ['A number goes on the stack. An operator goes in the machine.', m.form === 'postfix' ? 'The first cube off the stack goes on the RIGHT.' : 'The first cube off the stack goes on the LEFT.', 'Predict every answer cube.']
        : m.kind === 'tree' ? ['Build the tree, then read it onto the rail.', 'Prefix: a node before its sides. Postfix: both sides before the node.']
        : m.kind === 'infix' ? ['Left side, operator, right side.', 'Brackets only where the operator above would be worked first.']
        : m.kind === 'bits' ? [ORDER_RULE, 'NOT, SHIFT and CIRC work on the string just after them.', 'Predict every new tray.', 'Carry the last tray to the Answer pad.']
        : ['Undo XOR with the same XOR.', 'Undo LCIRC with RCIRC by the same number, and RCIRC with LCIRC.', 'Undo NOT with NOT.']).map(g => '<li>' + g + '</li>').join('')));
      t.appendChild(el('p', { class: 'note' }, (m.kind === 'solve' ? 'The arrow shows the lamps.' : m.kind === 'bits' ? 'Every tray you can take glows. The arrow shows the nearest one: you decide which to take and where it goes.' : 'No arrow while you carry: you decide where it goes.') + ' <b>' + M.have + ' of ' + NEED + ' clean rounds in a row.</b>'));
    }
    if (R.ask) t.appendChild(predictBox(R.ask));
    if (R.why && !R.over) t.appendChild(el('p', { class: 'cl-why' }, '<b>Why:</b> ' + R.why));
    if (R.over && R.endMsg) t.appendChild(el('p', { class: R.spoilt ? 'note' : 'win' }, R.endMsg));
    if (R.over && m.type === 'challenge' && R.spoilt && R.why) t.appendChild(el('p', { class: 'cl-why' }, '<b>The mistake:</b> ' + R.why));
    if (M.phase === 'done') t.appendChild(el('p', { class: 'win' }, 'Mission complete!' + (M.stars ? ' ' + starsHtml(M.stars) : '')));
    if (M.phase === 'ask') t.appendChild(askBox(m.before, () => { M.phase = 'play'; drawAll(); }));
    if (M.phase === 'done' && !M.afterOk) t.appendChild(askBox(m.after, () => { M.afterOk = true; drawAll(); }));
    const act = el('div', { class: 'actions' });
    if (M.phase === 'done' && M.afterOk) { const nx = nextMission(); act.appendChild(nx != null ? btn('Next mission', 'go', () => start(nx)) : btn('Play again', 'go', () => start(missionAt))); if (inLesson && !isExt(missionAt) && (nx == null || isExt(nx))) t.appendChild(el('p', { class: 'win' }, 'Lesson complete! Every activity for this lesson is done.' + (nx != null ? ' Next: the extension challenges.' : ''))); }
    else if (M.phase === 'play' && R.over) act.appendChild(btn('Next round', 'go', () => newRound()));
    else if (M.phase === 'play' && m.kind === 'solve' && !R.ask) { const b = btn('Run the machines', 'go', () => { if (hand.item) return; KIND.solve.run(); }); b.id = 'clRun'; act.appendChild(b); }
    if (M.phase === 'play' && !R.over) act.appendChild(btn('Start again', '', () => leaveThen(() => { M.have = 0; newRound(); })));
    if (!m.noHelp) act.appendChild(btn('Walk me through it', '', walkMe));
    t.appendChild(act);
    // every step explained so far this round, newest first, folded away until opened (it stays open once opened)
    if (R.log && R.log.length > 1) {
      const d = el('details', { class: 'cl-log' }); d.open = logOpen;
      d.appendChild(el('summary', {}, 'What has happened so far (' + R.log.length + ')'));
      d.appendChild(el('ol', { reversed: '' }, R.log.slice().reverse().map(x => '<li>' + x + '</li>').join('')));
      d.addEventListener('toggle', () => { logOpen = d.open; });
      t.appendChild(d);
    }
    t.appendChild(navBox());
    // what needs attention now glows and is scrolled into view: a question first (it glows until it is answered),
    // then the end of a round (the result and its button), then the step you are on
    const ask = t.querySelector('.ask'), step = t.querySelector('.steps li.now');
    const focus = ask || (R.over || M.phase === 'done' ? act : step);
    if (focus) {
      if (focus !== act) focus.classList.add('attn');
      const key = (ask ? 'ask:' + (R.ask ? R.ask.q : M.phase) : R.over || M.phase === 'done' ? 'end:' + M.phase : 'step:' + [...t.querySelectorAll('.steps li')].indexOf(step)) + '@' + missionAt;
      const box = t.getBoundingClientRect(), r = focus.getBoundingClientRect(), off = r.top < box.top || r.bottom > box.bottom;
      // scroll when it is new, and pull it back if it has been scrolled out of sight
      if (key !== lastFocus || off) focus.scrollIntoView({ block: ask ? 'center' : 'nearest' });   // instant: a smooth scroll never ends in a hidden frame
      lastFocus = key;
    }
    // in a challenge, one dot for each clean round needed, filled as they are won (the chip never changes size)
    const need = m.need || NEED, won = M.phase === 'done' ? need : M.have;
    $('step').innerHTML = where + ': ' + (inSec.indexOf(m) + 1) + ' of ' + inSec.length + (m.type === 'challenge' ? ' <span class="rdots" title="Clean rounds in a row" aria-label="' + won + ' of ' + need + ' clean rounds">' + Array.from({ length: need }, (_, i) => '<i class="' + (i < won ? 'on' : R && R.spoilt && i === won ? 'bad' : '') + '"></i>').join('') + '</span>' : '');
  }
  function navBox() {
    const box = el('div', { class: 'navbox' });
    box.appendChild(el('div', { class: 'head' }, '<span>Choose a mission</span>'));
    if (M.leave) {
      const lv = el('div', { class: 'leave' }, '<b>Leave this mission?</b> This round will be lost.'), row = el('div', { class: 'actions' });
      row.append(btn('Leave', 'go', () => { const go = M.leave; M.leave = null; go(); }), btn('Stay', '', () => { M.leave = null; drawPanel(); }));
      lv.appendChild(row); box.appendChild(lv);
    }
    const modeBar = el('div', { class: 'modebar seg', role: 'group', 'aria-label': 'Show' });
    [['all', 'All missions'], ['lesson', 'Lesson mode']].forEach(([k, label]) => {
      const b = el('button', { type: 'button', 'aria-pressed': String((lessonMode.on ? 'lesson' : 'all') === k) }, label);
      b.addEventListener('click', () => {
        const on = k === 'lesson', leaving = on && !lessonList().includes(missionAt);
        const go = () => { lessonMode.on = on; save('lessonMode', lessonMode); if (leaving) startLesson(); else drawAll(); };
        if (leaving) leaveThen(go); else go();
      });
      modeBar.appendChild(b);
    });
    box.appendChild(modeBar);
    const nav = el('div', { class: 'sections', role: 'navigation', 'aria-label': 'Missions' });
    const stars = load('all:stars', {}) || {};
    if (lessonMode.on) {
      const pickL = el('select', { id: 'nbLesson', 'aria-label': 'Lesson' });
      LESSONS.forEach(L => pickL.appendChild(el('option', { value: L.id }, L.title)));
      pickL.value = lessonMode.id;
      pickL.addEventListener('change', () => { const want = pickL.value; pickL.value = lessonMode.id; leaveThen(() => { lessonMode.id = want; save('lessonMode', lessonMode); startLesson(); }); });
      nav.appendChild(pickL);
      const ids = lessonList(), core = ids.filter(i => !isExt(i)), total = core.reduce((n, i) => n + minsOf(MISSIONS[i]), 0), left = core.filter(i => !done[MISSIONS[i].id]).reduce((n, i) => n + minsOf(MISSIONS[i]), 0);
      nav.appendChild(el('p', { class: 'note' }, core.filter(i => done[MISSIONS[i].id]).length + ' of ' + core.length + ' done. About ' + total + ' minutes in all' + (left && left < total ? ', about ' + left + ' left.' : '.')));
      const items = el('div', { class: 'sec-list lesson-list' });
      ids.forEach((i, k) => {
        const x = MISSIONS[i];
        if (isExt(i) && !isExt(ids[k - 1])) items.appendChild(el('p', { class: 'note' }, '<b>Extension challenges</b> for anyone who finishes early.'));
        const b = el('button', { type: 'button', 'aria-current': String(i === missionAt) }, (done[x.id] ? '<span class="tick">&#10003;</span> ' : '<span class="num">' + (k + 1) + '</span> ') + '<span class="t">' + x.title + '</span>' + (stars[x.id] != null ? starsHtml(stars[x.id]) : '') + '<span class="mins">' + minsOf(x) + ' min</span>');
        b.disabled = !(k === 0 || done[MISSIONS[ids[k - 1]].id] || done[x.id]);
        b.addEventListener('click', () => leaveThen(() => start(i)));
        items.appendChild(b);
      });
      nav.appendChild(items);
      box.appendChild(nav);
      return box;
    }
    SECTIONS.forEach(sec => {
      const list = MISSIONS.map((x, i) => [x, i]).filter(([x]) => x.group === sec);
      const det = el('details', { class: 'sec' + (sec === M.m.group ? ' current' : '') });
      if (openSecs.has(sec)) det.open = true;
      det.appendChild(el('summary', {}, '<span>' + sec + '</span><span class="count">' + list.filter(([x]) => done[x.id]).length + ' of ' + list.length + '</span>'));
      det.addEventListener('toggle', () => { if (det.open) openSecs.add(sec); else openSecs.delete(sec); });
      const items = el('div', { class: 'sec-list' });
      list.forEach(([x, i], k) => {
        const b = el('button', { type: 'button', 'aria-current': String(i === missionAt) }, (done[x.id] ? '<span class="tick">&#10003;</span> ' : '<span class="num">' + (k + 1) + '</span> ') + '<span class="t">' + x.title + '</span>' + (stars[x.id] != null ? starsHtml(stars[x.id]) : ''));
        b.disabled = !(k === 0 || done[list[k - 1][0].id] || done[x.id]);
        b.addEventListener('click', () => leaveThen(() => start(i)));
        items.appendChild(b);
      });
      det.appendChild(items); nav.appendChild(det);
    });
    box.appendChild(nav);
    return box;
  }
  // A prediction: a typed number, or a row of lamps to switch. Tutorial: wrong shows how, try again. Challenge: wrong
  // is a mistake, the answer is shown and the machine runs.
  function predictBox(a) {
    const box = el('div', { class: 'ask' });
    box.appendChild(el('p', { class: 'ask-q' }, '<b>Predict.</b> ' + a.q));
    const fb = el('p', { class: 'ask-fb' + (a.fb ? ' bad' : '') }, a.fb || '');
    let read;
    const row = el('div', { class: 'ask-row' });
    if (a.type === 'num') {
      const inp = el('input', { type: 'text', inputmode: 'numeric', id: 'clAsk', 'aria-label': 'Your answer', autocomplete: 'off' });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
      row.appendChild(inp); read = () => { const v = inp.value.trim().replace(/−/g, '-'); return /^-?\d+$/.test(v) ? Number(v) : null; };
    } else if (a.type === 'choice') {
      let chosen = null;
      const opts = el('div', { class: 'ask-opts cl-choice' + (a.wide ? ' wide' : '') });
      a.options.forEach(o => opts.appendChild(btn(o, '', () => { chosen = o; go(); })));
      row.appendChild(opts); read = () => chosen;
    } else {
      a.pick = a.pick || Array(a.len).fill('?');
      const lamps = el('div', { class: 'cl-pick', role: 'group', 'aria-label': 'Your tray' });
      a.pick.forEach((b, i) => {
        const x = el('button', { type: 'button', class: 'cl-l ' + (b === '1' ? 'on' : b === '0' ? 'off' : 'unk'), 'aria-label': 'Lamp ' + (i + 1) + ': ' + (b === '?' ? 'not set' : b) }, b);
        x.addEventListener('click', () => { a.pick[i] = a.pick[i] === '1' ? '0' : '1'; drawPanel(); document.querySelectorAll('.cl-pick button')[i]?.focus(); });
        lamps.appendChild(x);
      });
      row.appendChild(lamps); read = () => a.pick.includes('?') ? null : a.pick.join('');
    }
    const go = () => {
      const v = read();
      if (v == null) { fb.className = 'ask-fb bad'; fb.textContent = a.type === 'num' ? 'Type a whole number.' : 'Switch every lamp on or off first.'; return; }
      if (v === a.answer) { log.note('Predicted ' + v + ' (right).'); R.ask = null; R.why = null; toast('Right!', 'good'); a.done(); afterChange(); return; }
      if (M.m.type === 'challenge') { R.ask = null; mistake('You predicted ' + v + '. ' + a.why); return; }
      a.fb = 'Not quite. ' + a.hint + ' Try again.'; log.note('Predicted ' + v + ' (wrong).');
      if (a.pick) a.pick = Array(a.len).fill('?');
      drawPanel(); $('clAsk')?.focus();
    };
    if (a.type !== 'choice') row.appendChild(btn('Check', 'go', go));
    box.append(row, fb);
    return box;
  }
  function askBox(a, onRight) {
    const box = el('div', { class: 'ask' });
    box.appendChild(el('p', { class: 'ask-q' }, '<b>Think.</b> ' + a.q));
    const fb = el('p', { class: 'ask-fb' }), opts = el('div', { class: 'ask-opts' });
    shuffle(a.options.map((o, i) => ({ o, i }))).forEach(({ o, i }) => opts.appendChild(btn(o, '', () => {
      if (i === 0) { log.note('Question answered right.'); toast('Yes!', 'good'); onRight(); }
      else { fb.className = 'ask-fb bad'; fb.innerHTML = 'Not quite. ' + a.why + ' Try again.'; shuffle([...opts.children]).forEach(x => opts.appendChild(x)); }
    })));
    box.append(opts, fb);
    return box;
  }
  function walkMe() {
    M.walked = true;
    const steps = KIND[M.m.kind].walk(R, M.m);
    let i = 0;
    const wrap = $('cardWrap'), card = $('card');
    const draw = () => {
      const s = steps[i];
      card.innerHTML = '<h2>Walk me through it</h2><p class="small">A different example, step by step.</p><div class="count">Step ' + (i + 1) + ' of ' + steps.length + '</div><p class="text">' + s.text + '</p>' + (s.visual || '') + '<div class="actions"></div>';
      const act = card.querySelector('.actions');
      const back = btn('Back', '', () => { if (i > 0) { i--; draw(); } }); back.disabled = i === 0;
      act.append(back, btn(i === steps.length - 1 ? 'Done' : 'Next step', 'go', () => { if (i < steps.length - 1) { i++; draw(); } else { wrap.hidden = true; log.note('Walk me through it (' + steps.length + ' steps).'); } }));
    };
    keys.clear(); setHand(false);
    wrap.hidden = false; draw(); card.querySelector('.btn:not([disabled])')?.focus();
  }
  function drawAll() { drawPanel(); hint(); }

  let toastTimer = 0;
  function toast(msg, cls) { const t = $('toast'); t.innerHTML = msg || ''; t.className = 'toast ' + (cls === 'bad' ? 'bad' : cls === 'good' ? 'good' : 'hint'); clearTimeout(toastTimer); if (msg) toastTimer = setTimeout(() => { t.innerHTML = ''; }, cls === 'bad' ? 5200 : 3200); }
  function hint() {
    // what Space does right now, for what is in front of you: HOLD (pick up and carry) or PRESS (switch a lamp)
    let h, key = 'tap to grab', mode = '';
    const g = grabTarget(), s = g && g.slot, what = s && (s.crate ? 'a ' + s.crate + ' cube' : s.items.length ? (top(s).tray ? 'the tray' : 'the ' + top(s).sym + ' cube') : '');
    if (hand.item) { h = (hand.sticky ? 'Walk to a pad and <b>tap Space</b> to put it down.' : '<b>Keep holding Space</b> and walk to a pad. Let go of Space to put it down.'); key = hand.sticky ? 'tap to put down' : 'keep holding'; mode = 'hold'; }
    else if (hand.pending) { h = '<b>Keep holding Space</b>...'; key = 'keep holding'; mode = 'hold'; }
    else if (R && R.ask) h = 'Predict on the right first.';
    else if (s && s.role === 'lamp') { h = '<b>Press Space</b> to switch this lamp on or off.'; key = 'press to switch'; mode = 'press'; }
    else if (s && s.press) { h = '<b>Press Space</b> ' + s.pressText; key = 'press'; mode = 'press'; }
    else if (s && s.risky && !s.take(top(s))) { h = '<b>Tap Space</b> to pick up ' + what + ', then tap again at a pad to put it down.'; key = 'tap to pick up'; mode = 'hold'; }
    else if (s) { h = '<b>Tap Space</b> to pick up ' + what + ', then tap again at a pad to put it down (or hold Space to carry it).'; key = 'tap to pick up'; mode = 'hold'; }
    else if (M && M.m.kind === 'solve') h = 'Walk to a lamp, then <b>press Space</b> to switch it. Then press Run the machines.';
    else if (M && M.m.kind === 'trace') { h = 'Walk to the variable that changes next. <b>Press Space</b> on its pad. Right-drag turns the camera.'; key = 'press'; }
    else h = 'Walk up to a cube. <b>Tap Space</b> (or click) to pick it up and tap again to put it down, or hold Space to carry it. Right-drag turns the camera.';
    if ($('hint').innerHTML !== h) $('hint').innerHTML = h;
    const k = $('keyWhat'); if (k && k.textContent !== key) k.textContent = key;
    const b = $('leftBtn'); if (b) b.dataset.mode = mode;
  }

  // ================================================================ the frame loop and input (as Network Builder 3D)
  function setOverview(on) { overview = on; view?.setFit(on ? MAPW : 16); $('mapBtn').textContent = on ? 'Walk (M)' : 'Map (M)'; }
  let last = 0;
  function frame(ts) { requestAnimationFrame(frame); tick(ts); }
  function tick(ts) {
    clock = Math.max(clock, ts / 1000);
    holdTick();
    const dt = last ? Math.max(0, Math.min(0.1, (ts - last) / 1000)) : 0.016; last = Math.max(last, ts);
    if (!view) return;
    let dx = 0, dy = 0;
    if (keys.has('ArrowLeft') || keys.has('KeyA')) dx -= 1;
    if (keys.has('ArrowRight') || keys.has('KeyD')) dx += 1;
    if (keys.has('ArrowUp') || keys.has('KeyW')) dy -= 1;
    if (keys.has('ArrowDown') || keys.has('KeyS')) dy += 1;
    if (stick) { dx = stick.x; dy = stick.y; }
    const len = Math.hypot(dx, dy);
    moving = len > 0.15;
    if (moving) {
      [dx, dy] = view.rotateInput(dx / Math.max(1, len), dy / Math.max(1, len));
      const sp = SPEED * dt, nx = pos.x + dx * sp, ny = pos.y + dy * sp;
      if (free(nx, ny)) { pos.x = nx; pos.y = ny; } else if (free(nx, pos.y)) pos.x = nx; else if (free(pos.x, ny)) pos.y = ny;
      pos.face = Math.atan2(dx, dy);
    }
    tickNo++;
    moveItems(dt);
    updateOutline(ts);
    updateGuide(ts);
    hint();
    me.update(dt, { x: pos.x, y: pos.y, face: pos.face, moving, hands: [0, 0].map(() => ({ down: hand.down || !!hand.item, hold: hand.item ? 'dev' : null })) }, true);
    view.follow(pos.x, M && (M.m.kind === 'tree' || M.m.kind === 'infix') ? pos.y - Math.min(4, Math.max(0, pos.y - 8)) : pos.y);
    view.render(dt);
  }
  const typing = e => /input|select|textarea/i.test(e.target?.tagName || '');
  document.addEventListener('keydown', e => {
    const k = e.code;
    if (typing(e)) return;
    if (!$('cardWrap').hidden) { if (k === 'Escape') $('cardWrap').hidden = true; return; }
    if (k === 'Space') { e.preventDefault(); if (e.repeat) return; setHand(true); }
    if (k === 'KeyM') { setOverview(!overview); return; }
    if (k.startsWith('Arrow')) e.preventDefault();
    keys.add(k);
  });
  document.addEventListener('keyup', e => {
    const k = e.code; keys.delete(k);
    if (typing(e)) return;
    if (k === 'Space') { e.preventDefault(); setHand(false); }
  });
  const focusMsg = $('focusMsg');
  const showFocus = () => { const has = document.hasFocus(); focusMsg.hidden = has; if (!has) keys.clear(); };
  focusMsg.addEventListener('click', () => { window.focus(); focusMsg.hidden = true; container.focus?.(); });
  addEventListener('focus', showFocus); addEventListener('blur', showFocus);
  document.addEventListener('pointerdown', () => { if (!document.hasFocus()) window.focus(); });
  try { window.focus(); } catch (e) { }
  setTimeout(showFocus, 300);
  document.addEventListener('focusin', e => { if (typing(e)) { keys.clear(); stick = null; const kn = $('knob'); if (kn) kn.style.transform = ''; } });
  addEventListener('blur', () => { keys.clear(); setHand(false); });
  container.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button === 0) setHand(true); });
  addEventListener('pointerup', e => { if (e.pointerType === 'mouse' && e.button === 0) setHand(false); });
  container.addEventListener('contextmenu', e => e.preventDefault());
  { const b = $('leftBtn'); b.addEventListener('pointerdown', e => { e.preventDefault(); b.setPointerCapture(e.pointerId); setHand(true); }); b.addEventListener('pointerup', () => setHand(false)); b.addEventListener('pointercancel', () => setHand(false)); }
  $('mapBtn').addEventListener('click', () => setOverview(!overview));
  // a question must never stay scrolled out of sight: a moment after the sheet stops scrolling, it comes back
  { let st = 0; $('mission').addEventListener('scroll', () => { clearTimeout(st); st = setTimeout(() => {
    const t = $('mission'), q = t.querySelector('.ask'); if (!q) return;
    const box = t.getBoundingClientRect(), r = q.getBoundingClientRect();
    if (r.bottom < box.top + 40 || r.top > box.bottom - 40) q.scrollIntoView({ block: 'center' });
  }, 1500); }); }
  {
    const st = $('stick'), knob = $('knob');
    const at = e => { const r = st.getBoundingClientRect(); let x = (e.clientX - r.left - r.width / 2) / (r.width / 2), y = (e.clientY - r.top - r.height / 2) / (r.height / 2); const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } stick = { x, y }; knob.style.transform = `translate(${x * 34}px, ${y * 34}px)`; };
    st.addEventListener('pointerdown', e => { st.setPointerCapture(e.pointerId); at(e); });
    st.addEventListener('pointermove', e => { if (stick) at(e); });
    const end = () => { stick = null; knob.style.transform = ''; };
    st.addEventListener('pointerup', end); st.addEventListener('pointercancel', end);
  }

  let first = 0;
  while (first < MISSIONS.length - 1 && done[MISSIONS[first].id]) first++;
  const q = new URLSearchParams(location.search).get('mission'), qi = MISSIONS.findIndex(x => x.id === q);
  if (qi >= 0) start(qi); else if (lessonMode.on) startLesson(); else start(first);
  requestAnimationFrame(frame);
  if (/[?&]debug/.test(location.search)) window.__lab = {
    get M() { return M; }, get R() { return R; }, pos, hand, setHand, start, newRound, free, solidAt, handPos, grabTarget, guideTarget, missions: MISSIONS, runProg, PAPER_LOOPS, progFactors, progDoubling, progNested, progMultiples,
    get slots() { return slots; }, get done() { return done; }, get arrows() { return arrows.count; }, get outlined() { return outlineG.children.length; }, get glowing() { return glowing; },
    toastText: () => $('toast').textContent, lessonMode, startLesson, nextMission, LESSONS, minsOf, KIND, frame: (n, ms = 33) => { for (let i = 0; i < n; i++) tick((last || performance.now()) + ms); }, nearestSlot
  };
  return { stop() { } };
}
