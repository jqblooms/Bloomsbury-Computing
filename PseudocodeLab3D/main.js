// Pseudocode Lab 3D: Year 8 2.1 Libraries, 2.2 Data Types and Constants, and Year 9 2.5 String Manipulation, in the
// lab of Network Builder 3D. Cambridge pseudocode is run one line at a time by walking: DECLARE puts a type cube on a
// variable's TYPE plate (then the box only lets in that kind of value), a CONSTANT box locks, library functions and
// operators are worked out on the WORK bench innermost first, OUTPUT carries a value to the SCREEN. Also: sort values
// into the four data types, and sort typed inputs by what a checking program outputs. The rules are those of
// shared/pseudocode-engine.js (DECLARE before use, type checks); the wording is the lessons' (y8-2-1-libraries,
// y8-2-2-data-types, y9-2-5-strings).
//
// The engine (controls, guide arrow, What just happened card, mission sheet, lesson mode, Walk me through it, the help
// rules: no help in challenges, later tutorials show the arrow only after a slip) is a fork of CpuLab3D/main.js.
// Progress: 'bc-pclab3d-v1:all:done' by mission id, best stars in ':all:stars', cloud-saved as app 'pclab3d'.
import * as THREE from 'three';
import { create } from './room.js';
import { createBlob } from './blob.js';
import { makeCube, makeCard, makePad, makeBody, floorBar, sign, PAD_H, CUBE, GAP } from './cubes.js';

const $ = id => document.getElementById(id);
const HOLD_OUT = 0.75, T = 100, SPEED = 5.5, NEED = 2, HOLD = 0.25;
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = list => list[Math.floor(Math.random() * list.length)];
const shuffle = list => { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const el = (tag, attrs, html) => { const n = document.createElement(tag); for (const [k, v] of Object.entries(attrs || {})) k === 'class' ? n.className = v : n.setAttribute(k, v); if (html != null) n.innerHTML = html; return n; };
const btn = (label, cls, fn) => { const b = el('button', { type: 'button', class: cls === 'go' ? 'btn' : 'btn secondary' }, label); b.addEventListener('click', fn); return b; };

const roleOf = () => 'num';
// ================================================================ Cambridge pseudocode (a pure model, so it can be tested)
// The pseudocode of y8-2-1-libraries, y8-2-2-data-types and y9-2-5-strings, with the rules of shared/pseudocode-engine.js:
// every variable is DECLAREd with a data type before use; the wrong kind of value stops the program; a CONSTANT cannot
// be changed; / gives a REAL; MOD, DIV, ROUND, LENGTH, UCASE, LCASE are library functions; + needs two numbers.
// A value is { t: 'INTEGER' | 'REAL' | 'STRING' | 'BOOLEAN', x }. A reference is { lit }, { v } or a node: { fn, args }
// (a library function) or { bin, a, b }. A line is { op: 'declare', v, type, choose }, { op: 'const', v, e },
// { op: 'set', v, e }, { op: 'output', e } or { op: 'input', v, typed }.
const I = x => ({ t: 'INTEGER', x }), F = x => ({ t: 'REAL', x }), S = x => ({ t: 'STRING', x }), B = x => ({ t: 'BOOLEAN', x });
const L = v => ({ lit: v }), V = v => ({ v });
const TYPES = ['INTEGER', 'REAL', 'STRING', 'BOOLEAN'];
const fmtNum = v => v.t === 'REAL' && Number.isInteger(v.x) ? v.x.toFixed(1) : String(v.x);
const show = v => v.t === 'STRING' ? '"' + v.x + '"' : v.t === 'BOOLEAN' ? (v.x ? 'TRUE' : 'FALSE') : fmtNum(v);
const shown = v => v.t === 'STRING' ? v.x : v.t === 'BOOLEAN' ? (v.x ? 'TRUE' : 'FALSE') : fmtNum(v);
const valEq = (a, b) => !!a && !!b && a.t === b.t && a.x === b.x;
const isNode = r => !!(r && (r.fn || r.bin));
const refText = r => r.lit ? show(r.lit) : r.v ? r.v : r.fn ? r.fn + '(' + r.args.map(refText).join(', ') + ')' : refText(r.a) + ' ' + r.bin + ' ' + refText(r.b);
const ARROW = '←';
function lineText(l) {
  if (l.op === 'declare') return 'DECLARE ' + l.v + ' : ' + (l.choose ? '?' : l.type);
  if (l.op === 'const') return 'CONSTANT ' + l.v + ' ' + ARROW + ' ' + refText(l.e);
  if (l.op === 'output') return 'OUTPUT ' + refText(l.e);
  if (l.op === 'input') return 'INPUT ' + l.v;
  return l.v + ' ' + ARROW + ' ' + refText(l.e);
}
const progText = prog => prog.map(lineText).join('\n');
const FN_ARGS = { MOD: 2, DIV: 2, ROUND: 2, LENGTH: 1, UCASE: 1, LCASE: 1 };
// a library function or an operator on values: { v } or { err }
function apply(node, vals) {
  const num = x => x.t === 'INTEGER' || x.t === 'REAL';
  if (node.bin) {
    const [a, b] = vals;
    if (!num(a) || !num(b)) return { err: '"' + node.bin + '" needs two numbers.' };
    const x = node.bin === '+' ? a.x + b.x : node.bin === '-' ? a.x - b.x : node.bin === '*' ? a.x * b.x : a.x / b.x;
    return { v: node.bin === '/' || a.t === 'REAL' || b.t === 'REAL' ? F(Math.round(x * 1e12) / 1e12) : I(x) };
  }
  const f = node.fn, [a, b] = vals;
  if (f === 'MOD' || f === 'DIV') { if (!num(a) || !num(b)) return { err: f + ' needs two numbers.' }; return { v: I(f === 'MOD' ? a.x % b.x : Math.trunc(a.x / b.x)) }; }
  if (f === 'ROUND') { if (!num(a)) return { err: 'ROUND needs a number.' }; const k = Math.pow(10, b.x), r = Math.round(a.x * k) / k; return { v: b.x === 0 ? I(r) : F(r) }; }
  if (a.t !== 'STRING') return { err: f + ' needs a string.' };
  if (f === 'LENGTH') return { v: I(a.x.length) };
  return { v: S(f === 'UCASE' ? a.x.toUpperCase() : a.x.toLowerCase()) };
}
// can a variable of this type hold this value? (an INTEGER value fits a REAL variable)
function fits(type, v) { return v.t === type || (type === 'REAL' && v.t === 'INTEGER'); }
const stored = (type, v) => type === 'REAL' && v.t === 'INTEGER' ? F(v.x) : v;
function typeErr(name, type, v) {
  if (type === 'INTEGER' && v.t === 'REAL') return name + ' is an INTEGER and cannot hold ' + shown(v) + '.';
  return name + ' is declared as ' + type + ' but you tried to store a ' + v.t + ' (' + show(v) + ') in it.';
}
// the nodes of an expression, innermost first (the order they are worked out on the bench)
function nodesOf(e, out = []) { if (!e) return out; if (e.fn) e.args.forEach(a => nodesOf(a, out)); else if (e.bin) { nodesOf(e.a, out); nodesOf(e.b, out); } if (isNode(e)) out.push(e); return out; }
const partsOf = n => n.fn ? n.args : [n.a, n.b];
// run: each line's value, the variables after each line, the output, the line with an error and why
function runProg(prog) {
  const types = {}, vars = {}, consts = {}, vals = [], after = [], out = [], nodeVals = [];
  let err = -1, errMsg = '';
  const ev = (r, nv) => {
    if (r.lit) return { v: r.lit };
    if (r.v) return !(r.v in types) ? { err: r.v + ' has not been declared.' } : r.v in vars ? { v: vars[r.v] } : { err: r.v + ' has no value yet.' };
    const parts = partsOf(r).map(p => ev(p, nv)), bad = parts.find(p => p.err);
    if (bad) return bad;
    const res = apply(r, parts.map(p => p.v)); if (!res.err) nv.set(r, res.v); return res;
  };
  for (let i = 0; i < prog.length; i++) {
    const l = prog[i], nv = new Map();
    let res = null;
    if (l.op === 'declare') { types[l.v] = l.type; }
    else if (l.op === 'input') { const tp = types[l.v], tx = l.typed; res = tp === 'INTEGER' && /^-?\d+$/.test(tx) ? { v: I(+tx) } : tp === 'REAL' && /^-?\d+(\.\d+)?$/.test(tx) ? { v: F(+tx) } : tp === 'STRING' ? { v: S(tx) } : { err: l.v + ' is ' + tp + ' and cannot hold ' + tx + '.' }; }
    else res = ev(l.e, nv);
    nodeVals[i] = nv;
    if (res && res.err) { err = i; errMsg = res.err; break; }
    if (res) {
      if (l.op === 'output') out.push(shown(res.v));
      else {
        if (!(l.v in types) && l.op !== 'const') { err = i; errMsg = l.v + ' has not been declared.'; break; }
        if (consts[l.v]) { err = i; errMsg = l.v + ' is a CONSTANT, so its value cannot be changed while the program runs.'; break; }
        if (l.op === 'const') { consts[l.v] = true; types[l.v] = res.v.t; }
        else if (!fits(types[l.v], res.v)) { err = i; errMsg = typeErr(l.v, types[l.v], res.v); break; }
        vars[l.v] = stored(types[l.v], res.v);
      }
      vals[i] = res.v;
    }
    after[i] = Object.assign({}, vars);
  }
  return { vals, after, out, err, errMsg, types, nodeVals };
}
function prob(prog) { return { prog, run: runProg(prog), key: progText(prog) + '|' + prog.map(l => l.typed || '').join(',') }; }
const D = (v, type, choose) => ({ op: 'declare', v, type, choose: !!choose });
const SET = (v, e) => ({ op: 'set', v, e }), OUT = e => ({ op: 'output', e }), IN = (v, typed) => ({ op: 'input', v, typed: String(typed) });
const CALL = (fn, ...args) => ({ fn, args }), OP = (bin, a, b) => ({ bin, a, b });
function nums(n, a, b) { const out = []; while (out.length < n) { const x = rnd(a, b); if (!out.includes(x)) out.push(x); } return out; }
const PLACES = ['Hat Yai', 'Bangkok', 'Songkhla', 'Phuket', 'Krabi', 'Lab 7b', 'Room 12', 'Music 3A'];
const NAMES = ['Mai', 'Ploy', 'Ben', 'Joy', 'Tom', 'Nok'];

const GEN = {
  // ---- 2.1 library functions
  mod() { const [a, b] = [rnd(14, 40), rnd(3, 7)]; return a % b ? prob([D('Left', 'INTEGER'), SET('Left', CALL('MOD', L(I(a)), L(I(b)))), OUT(V('Left'))]) : GEN.mod(); },
  divmod() { const [a, b] = [rnd(20, 60), rnd(4, 9)]; return a % b ? prob([D('Days', 'INTEGER'), IN('Days', a), OUT(CALL('DIV', V('Days'), L(I(b)))), OUT(CALL('MOD', V('Days'), L(I(b))))]) : GEN.divmod(); },
  round() { const [t, d] = [rnd(20, 60), pick([3, 6, 7, 9])]; return t % d ? prob([D('Total', 'INTEGER'), SET('Total', L(I(t))), OUT(CALL('ROUND', OP('/', V('Total'), L(I(d))), L(I(1))))]) : GEN.round(); },
  length() { const w = pick(PLACES); return prob([D('Word', 'STRING'), SET('Word', L(S(w))), OUT(CALL('LENGTH', V('Word')))]); },
  ucase() { return prob([D('Name', 'STRING'), IN('Name', pick(NAMES).toLowerCase()), OUT(CALL('UCASE', V('Name')))]); },
  lib() {
    const k = pick(['mod', 'div', 'round', 'len', 'ucase', 'lenmod']);
    if (k === 'mod') return GEN.mod();
    if (k === 'div') { const [a, b] = [rnd(20, 60), rnd(4, 9)]; return prob([D('Sweets', 'INTEGER'), D('Bags', 'INTEGER'), IN('Sweets', a), SET('Bags', CALL('DIV', V('Sweets'), L(I(b)))), OUT(V('Bags'))]); }
    if (k === 'round') return GEN.round();
    if (k === 'len') return GEN.length();
    if (k === 'ucase') return GEN.ucase();
    const w = pick(['Bangkok', 'Krabi', 'Phuket', 'Yala', 'Trang']);
    return prob([D('Word', 'STRING'), D('Size', 'INTEGER'), IN('Word', w), SET('Size', CALL('LENGTH', V('Word'))), OUT(CALL('MOD', V('Size'), L(I(2))))]);
  },
  // ---- 2.2 data types and constants
  // DECLARE with the type to choose: the later lines show what the variable must hold
  choose() {
    const pool = shuffle([['Height', F(pick([1.62, 1.58, 1.75, 1.49]))], ['Visits', I(rnd(2, 20))], ['Town', S(pick(PLACES))], ['Paid', B(Math.random() < 0.5)], ['Price', F(pick([9.5, 12.25, 3.75]))], ['Age', I(rnd(11, 15))]]);
    const [[a, va], [b, vb]] = pool.filter((x, i, arr) => arr.findIndex(y => y[1].t === x[1].t) === i).slice(0, 2);
    return prob([D(a, va.t, true), D(b, vb.t, true), SET(a, L(va)), SET(b, L(vb)), OUT(V(a))]);
  },
  stop() {
    const k = pick(['real', 'str', 'bool']);
    if (k === 'real') { const h = pick([1.62, 1.58, 1.75]); return prob([D('Height', 'INTEGER'), SET('Height', L(F(h))), OUT(V('Height'))]); }
    if (k === 'str') return prob([D('Age', 'INTEGER'), SET('Age', L(S(pick(['thirteen', 'twelve', '13'])))), OUT(V('Age'))]);
    return prob([D('Passed', 'BOOLEAN'), SET('Passed', L(S('Yes'))), OUT(V('Passed'))]);
  },
  constant() { const [p, n] = [pick([45, 50, 35, 60]), rnd(2, 9)]; return prob([{ op: 'const', v: 'TicketPrice', e: L(I(p)) }, D('Tickets', 'INTEGER'), IN('Tickets', n), OUT(OP('*', V('Tickets'), V('TicketPrice')))]); },
  constStop() { const [p, q] = nums(2, 30, 60); return prob([{ op: 'const', v: 'Price', e: L(I(p)) }, D('Cost', 'INTEGER'), SET('Cost', OP('*', V('Price'), L(I(2)))), SET('Price', L(I(q))), OUT(V('Cost'))]); },
  types() {
    const k = pick(['choose', 'stop', 'constant', 'constStop', 'ok', 'ok']);
    if (k !== 'ok') return GEN[k]();
    const [a, b] = nums(2, 3, 9);
    return pick([
      () => prob([D('Mark', 'INTEGER'), D('Passed', 'BOOLEAN'), SET('Mark', L(I(rnd(40, 90)))), SET('Passed', L(B(true))), OUT(V('Passed'))]),
      () => prob([D('Price', 'REAL'), SET('Price', L(F(a + 0.5))), OUT(OP('*', V('Price'), L(I(b))))]),
      () => prob([D('Age', 'STRING'), SET('Age', L(S(String(a + 10)))), OUT(OP('+', V('Age'), L(I(1))))])
    ])();
  },
  // ---- Year 9 2.5 strings
  slen() { const w = pick(PLACES); return prob([D('Word', 'STRING'), SET('Word', L(S(w))), OUT(CALL('LENGTH', V('Word')))]); },
  scase() { const w = pick(['Lab 7b', 'Music 3A', 'Hat Yai', 'Room 12b', 'Art 2c']); return prob([D('Room', 'STRING'), SET('Room', L(S(w))), OUT(CALL('UCASE', V('Room'))), OUT(CALL('LCASE', V('Room')))]); },
  sstore() { const n = pick(NAMES); return prob([D('Name', 'STRING'), SET('Name', L(S(n))), SET('Name', CALL('UCASE', V('Name'))), OUT(V('Name')), OUT(CALL('LENGTH', V('Name')))]); },
  str() { return pick([GEN.slen, GEN.scase, GEN.sstore, () => prob([D('Reply', 'STRING'), IN('Reply', pick(['Yes', 'YES', 'yes', 'No'])), SET('Reply', CALL('LCASE', V('Reply'))), OUT(V('Reply'))])])(); }
};

// ---- Name the data type: cards
function typeRound({ n }) {
  const make = () => {
    const k = pick(['int', 'neg', 'real', 'real2', 'str', 'strnum', 'bool', 'bool2']);
    if (k === 'int') return { text: String(rnd(2, 99)), t: 'INTEGER' };
    if (k === 'neg') return { text: String(-rnd(1, 20)), t: 'INTEGER' };
    if (k === 'real') return { text: pick(['4.5', '1.62', '9.5', '0.75']), t: 'REAL' };
    if (k === 'real2') return { text: '-' + pick(['2.5', '0.5', '3.25']), t: 'REAL' };
    if (k === 'str') return { text: '"' + pick(['Yes', 'Hat Yai', 'Mai', 'thirteen']) + '"', t: 'STRING' };
    if (k === 'strnum') return { text: '"' + rnd(10, 99) + '"', t: 'STRING' };
    if (k === 'bool') return { text: 'TRUE', t: 'BOOLEAN' };
    return { text: 'FALSE', t: 'BOOLEAN' };
  };
  const cards = [], seen = new Set();
  const want = shuffle(TYPES.concat(shuffle(TYPES).slice(0, Math.max(0, n - 4)))).slice(0, n);
  for (const t of want) { let c, g = 0; do c = make(); while ((c.t !== t || seen.has(c.text)) && ++g < 300); seen.add(c.text); cards.push(c); }
  return { cards, key: cards.map(c => c.text).join('|') };
}
function typeWhy(c) {
  if (c.t === 'STRING') return 'It is in quotes, so it is text: a STRING' + (/\d/.test(c.text) ? ', even with digits in it.' : '.');
  if (c.t === 'BOOLEAN') return c.text + ' is a BOOLEAN value: only TRUE or FALSE.';
  if (c.t === 'REAL') return 'It has a decimal part, so it is a REAL.';
  return 'A whole number is an INTEGER.';
}
// ---- Accepted or rejected? (Year 9 2.5): typed inputs sorted by what the program outputs
function gateRound({ n, kind }) {
  let prog, test, yes, no;
  if (kind === 'len') {
    const lim = pick([6, 8, 10]), op = pick(['>=', '>', '<=']), name = op === '<=' ? 'Username' : 'Password';
    yes = op === '<=' ? 'Accepted' : 'Accepted'; no = op === '<=' ? 'Too long' : 'Too short';
    prog = ['DECLARE ' + name + ' : STRING', 'INPUT ' + name, 'IF LENGTH(' + name + ') ' + op + ' ' + lim + ' THEN', '    OUTPUT "' + yes + '"', 'ELSE', '    OUTPUT "' + no + '"', 'ENDIF'];
    test = s => op === '>=' ? s.length >= lim : op === '>' ? s.length > lim : s.length <= lim;
    const words = ['secret', 'password', 'pass wd', 'letmein', 'hatyai2026', 'sunshine', 'abc', 'mango123', 'tiger', 'blue sky', 'computer', 'qwerty12', 'school', 'Mai Tran', 'dragon99'];
    const pool = shuffle(words), cards = [];
    // always one exactly on the limit, and both answers
    const exact = pool.find(w => w.length === lim); if (exact) cards.push(exact);
    for (const w of pool) if (cards.length < n && !cards.includes(w)) cards.push(w);
    return finish(cards);
  }
  const ans = pick(['yes', 'Bangkok', 'Paris']), lc = kind === 'lcase';
  yes = 'Correct'; no = 'Try again';
  prog = ['DECLARE Answer : STRING', 'INPUT Answer', 'IF ' + (lc ? 'LCASE(Answer) = "' + ans.toLowerCase() + '"' : 'Answer = "' + ans + '"') + ' THEN', '    OUTPUT "' + yes + '"', 'ELSE', '    OUTPUT "' + no + '"', 'ENDIF'];
  test = s => lc ? s.toLowerCase() === ans.toLowerCase() : s === ans;
  const vars = shuffle([ans, ans.toUpperCase(), ans.toLowerCase(), ans[0].toUpperCase() + ans.slice(1).toLowerCase(), ans + ' ', ans.slice(0, -1)]).filter((x, i, a) => a.indexOf(x) === i);
  return finish(vars.slice(0, n));
  function finish(cards) {
    const list = cards.map(t => ({ text: t, ok: test(t), len: t.length }));
    if (!list.some(c => c.ok) || list.every(c => c.ok)) return gateRound({ n, kind });
    return { prog, cards: list, yes, no, kind, key: prog.join('|') + cards.join(',') };
  }
}

// ================================================================ missions
const MISSIONS = [
  // ---- Year 8 2.1 Libraries and Library Functions
  { id: 'mod-t', group: 'Library functions', title: 'Call MOD', type: 'tutorial', guided: true, kind: 'run', mins: 5,
    intro: 'A <b>library function</b> is code already written and tested. DECLARE first: carry the type cube to the TYPE plate. Then put the values for MOD in the slots on the WORK bench and press RUN.',
    gen: () => GEN.mod(),
    after: { q: 'Why use MOD instead of writing the loop yourself?', options: ['It is already written and tested, so there is less to write and less that can go wrong.', 'MOD is faster to type than a number.', 'MOD works without any values.'], why: 'A library function has been used and tested by many programmers.' } },
  { id: 'divmod-t', group: 'Library functions', title: 'DIV and MOD', type: 'tutorial', kind: 'run', mins: 6,
    intro: 'DIV and MOD on the same numbers. Predict what each one gives before RUN shows you.',
    gen: () => GEN.divmod(),
    after: { q: 'What is the difference between DIV and MOD?', options: ['DIV gives the whole number of times. MOD gives the remainder.', 'DIV gives the remainder. MOD gives the whole number of times.', 'They give the same answer.'], why: 'DIV(20, 6) is 3: 6 goes in 3 whole times. MOD(20, 6) is 2: 2 is left over.' } },
  { id: 'round-t', group: 'Library functions', title: 'ROUND', type: 'tutorial', kind: 'run', mins: 6,
    intro: 'ROUND has a sum inside its brackets. Work out the inside first, then carry the answer into ROUND.',
    gen: () => GEN.round(),
    after: { q: 'Why does ROUND need two values in its brackets?', options: ['The first is the number to round. The second says how many decimal places to keep.', 'It rounds two numbers at once.', 'The second value is added on.'], why: 'ROUND(7.8333, 1) keeps 1 decimal place: 7.8.' } },
  { id: 'len-t', group: 'Library functions', title: 'LENGTH and UCASE', type: 'tutorial', kind: 'run', mins: 5,
    intro: 'Library functions work on text too. LENGTH counts the characters. UCASE gives capital letters.',
    gen: () => Math.random() < 0.5 ? GEN.length() : GEN.ucase() },
  { id: 'lib-c', group: 'Library functions', title: 'Library Challenge', type: 'challenge', kind: 'run', mins: 8,
    intro: 'MOD, DIV, ROUND, LENGTH and UCASE. Run every line with no mistakes. Two clean programs in a row.',
    gen: () => GEN.lib() },
  { id: 'lib-pc', group: 'Library functions', title: 'Predict the Output', type: 'challenge', kind: 'run', predictAll: true, mins: 8,
    intro: 'Predict the output first. Then run it to check. Two clean programs in a row.',
    gen: () => GEN.lib() },

  // ---- Year 8 2.2 Data Types and Constants
  { id: 'type-t', group: 'Data types', title: 'Four Data Types', type: 'tutorial', guided: true, kind: 'types', mins: 4,
    intro: 'Carry each value to its data type: <b>INTEGER</b>, <b>REAL</b>, <b>STRING</b> or <b>BOOLEAN</b>.',
    gen: () => typeRound({ n: 6 }),
    after: { q: 'Why does "13" in quotes not count as a number?', options: ['The quotes make it text. The computer treats it as characters, not an amount.', 'It is too small.', 'It does count as a number.'], why: 'Quotes make a STRING, even round digits.' } },
  { id: 'type-c', group: 'Data types', title: 'Data Type Challenge', type: 'challenge', kind: 'types', mins: 5,
    intro: 'Sort every value with no mistakes. Two clean rounds in a row.',
    gen: () => typeRound({ n: 8 }) },
  { id: 'declare-t', group: 'Data types', title: 'Choose the Type', type: 'tutorial', guided: true, kind: 'run', mins: 6,
    intro: 'The DECLARE lines have no type yet. Look at what the program stores later, then carry the right type cube to each TYPE plate.',
    gen: () => GEN.choose(),
    after: { q: 'How do you choose the data type for a variable?', options: ['Look at the values it will hold: whole number, decimal part, text, or TRUE or FALSE.', 'Always use STRING.', 'Use the type of the variable above it.'], why: 'The data type must fit every value the variable will hold.' } },
  { id: 'stop-t', group: 'Data types', title: 'The Wrong Kind of Value', type: 'tutorial', kind: 'run', predictAll: true, mins: 5,
    intro: 'Predict first: does this program run? Then run it and see what the box does with the value.',
    gen: () => GEN.stop(),
    after: { q: 'Why can the wrong data type stop a program?', options: ['Each variable only lets in its own kind of value. One wrong value is refused.', 'The program runs out of memory.', 'OUTPUT cannot show it.'], why: 'DECLARE sets what kind of value the variable can hold.' } },
  { id: 'const-t', group: 'Constants', title: 'A Constant', type: 'tutorial', kind: 'run', mins: 5,
    intro: 'A <b>CONSTANT</b> is set once and never changes while the program runs. Its box locks.',
    gen: () => GEN.constant(),
    after: { q: 'Why use a constant for a ticket price?', options: ['The price is in one place, so one change updates every line that uses it.', 'A constant makes the program faster.', 'A constant can be changed by any line.'], why: 'Every line uses the name, so changing the one value fixes them all.' } },
  { id: 'conststop-t', group: 'Constants', title: 'Change a Constant?', type: 'tutorial', kind: 'run', predictAll: true, mins: 5,
    intro: 'A later line tries to store a new value in a constant. Predict what happens, then run it.',
    gen: () => GEN.constStop(),
    after: { q: 'What happens when a line tries to change a CONSTANT?', options: ['The program stops: a CONSTANT cannot be changed while it runs.', 'The constant changes.', 'The line is skipped.'], why: 'A CONSTANT is set once.' } },
  { id: 'types-c', group: 'Constants', title: 'Types and Constants Challenge', type: 'challenge', kind: 'run', predictAll: true, mins: 8,
    intro: 'Predict what happens, then run it. Some programs stop. Two clean programs in a row.',
    gen: () => GEN.types() },

  // ---- Year 9 2.5 String Manipulation
  { id: 'slen-t', group: 'Strings', title: 'Count the Characters', type: 'tutorial', guided: true, kind: 'run', mins: 5,
    intro: 'A string is characters in order. <b>LENGTH</b> counts them, and a space is a character too. Watch the positions on the sheet as you carry the string.',
    gen: () => GEN.slen(),
    after: { q: 'Why is LENGTH("Hat Yai") 7, not 6?', options: ['The space is a character too.', 'LENGTH adds 1.', 'Capital letters count twice.'], why: 'H, a, t, the space, Y, a, i: 7 characters.' } },
  { id: 'scase-t', group: 'Strings', title: 'UCASE and LCASE', type: 'tutorial', kind: 'run', mins: 5,
    intro: 'UCASE gives capital letters. LCASE gives small letters. Predict each one before RUN.',
    gen: () => GEN.scase(),
    after: { q: 'Why do the digits and the space not change?', options: ['Only letters have a capital and a small form.', 'UCASE skips the end of a string.', 'They do change.'], why: 'Digits, spaces and symbols stay the same.' } },
  { id: 'sstore-t', group: 'Strings', title: 'Show It or Store It', type: 'tutorial', kind: 'run', mins: 5,
    intro: 'UCASE gives a new string. This time it is stored back in the variable.',
    gen: () => GEN.sstore(),
    after: { q: 'When does UCASE change the variable?', options: ['Only when its answer is stored back in the variable.', 'Every time UCASE is used.', 'Never.'], why: 'UCASE gives a new string. The variable changes only when that string is stored in it.' } },
  { id: 'gate-t', group: 'Strings', title: 'Accepted or Too Short?', type: 'tutorial', guided: true, kind: 'gate', gate: 'len', mins: 5,
    intro: 'The program checks the length of what the user types. Carry each typed input to what the program outputs.',
    gen: () => gateRound({ n: 5, kind: 'len' }),
    after: { q: 'A password must have at least 8 characters. Why is "password" accepted?', options: ['It has exactly 8 characters, and 8 >= 8 is TRUE.', 'It has more than 8 characters.', 'It is a word.'], why: '>= includes the limit.' } },
  { id: 'gate2-t', group: 'Strings', title: 'Capitals Matter', type: 'tutorial', kind: 'gate', gate: 'case', mins: 5,
    intro: '= compares every character, capitals too. Watch what LCASE changes.',
    gen: () => gateRound({ n: 5, kind: pick(['case', 'lcase']) }),
    after: { q: 'Why might a program mark a correct answer wrong?', options: ['The user typed different capitals, and = compares capitals too.', 'The program has no IF.', 'The answer is too long.'], why: 'Use LCASE (or UCASE) first, so capitals do not matter.' } },
  { id: 'str-c', group: 'Strings', title: 'String Challenge', type: 'challenge', kind: 'run', mins: 8,
    intro: 'LENGTH, UCASE and LCASE. Predict each result and run every line. Two clean programs in a row.',
    gen: () => GEN.str() },
  { id: 'gate-c', group: 'Strings', title: 'Check the Inputs', type: 'challenge', kind: 'gate', mins: 7,
    intro: 'Sort every typed input with no mistakes. Two clean rounds in a row.',
    gen: () => gateRound({ n: 6, kind: pick(['len', 'case', 'lcase']) }) },
  { id: 'spro-c', group: 'Strings', title: 'Strings Without Help', type: 'challenge', kind: 'run', noHelp: true, predictAll: true, need: 3, mins: 10,
    intro: 'Predict, then run, with no help. Three clean programs in a row.',
    gen: () => GEN.str() }
];
export { MISSIONS };
const SECTIONS = ['Library functions', 'Data types', 'Constants', 'Strings'];
// Lesson modes: Year 8 2.1 and 2.2, Year 9 2.5
const LESSONS = [
  { id: '8-2.1', title: 'Year 8 2.1: Libraries and Library Functions', missions: ['mod-t', 'divmod-t', 'round-t', 'len-t', 'lib-c', 'lib-pc'], ext: [] },
  { id: '8-2.2', title: 'Year 8 2.2: Data Types and Constants', missions: ['type-t', 'type-c', 'declare-t', 'stop-t', 'const-t', 'conststop-t', 'types-c'], ext: [] },
  { id: '9-2.5', title: 'Year 9 2.5: String Manipulation', missions: ['slen-t', 'scase-t', 'sstore-t', 'gate-t', 'gate2-t', 'str-c', 'gate-c'], ext: ['spro-c'] }
];
const minsOf = m => m.mins || 7;


// ================================================================ saving and results
const STORE = 'bc-pclab3d-v1:';
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
  const log = results('pclab3d', 'Pseudocode Lab 3D');
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
  function itemMesh(it) { it.k3 = it.card ? makeCard(it.text) : makeCube(it.sym, it.role); worldG.add(it.k3.group); }
  function addItem(slot, it) { it.id = it.id || 'i' + nextId++; if (!it.k3) itemMesh(it); slot.items.push(it); it.slot = slot; snapItem(it); return it; }
  function killItem(it) { if (!it || !it.k3) return; worldG.remove(it.k3.group); it.k3.dispose(); it.k3.group.traverse(o => { if (o.userData.own) o.geometry.dispose(); }); it.k3 = null; }
  function cube(sym, extra) { return Object.assign({ sym: String(sym), role: roleOf(String(sym)) }, extra || {}); }
  const top = s => s.items[s.items.length - 1];
  function itemTarget(it) {
    if (it === hand.item) {
      const hx = pos.x + Math.sin(pos.face) * HOLD_OUT, hy = pos.y + Math.cos(pos.face) * HOLD_OUT;   // held clear of the body: the cube is wider than the reach point
      return new THREE.Vector3((hx + 0.5) * T, it.card ? 30 : 70, (hy + 0.5) * T);
    }
    const s = it.slot, k = s.items.indexOf(it);
    if (s.grow === 'right') return new THREE.Vector3((s.x + k + 0.5) * T, PAD_H + CUBE / 2 + 2, (s.y + 0.5) * T);
    if (it.card) return new THREE.Vector3((s.x + s.w / 2) * T + (s.grow === 'pile' ? k * 10 : 0), PAD_H + (s.grow === 'pile' ? k * 18 : 0), (s.y + 0.5) * T);
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
      if (o.userData.ownMat) [].concat(o.material).forEach(mm => { mm.map?.dispose?.(); mm.dispose(); });
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
    view.zoom?.(1900, 0.95);   // far enough back to see the code, the boxes, the bench and the screen
    pos.face = Math.PI; view.jump(camX(), pos.y - camAhead());
    toast(''); explainReset();
    if (after) { explain('Not this time. ' + after + ' A new round has started.'); R.why = after; toast('A mistake, so a new round has started. ' + after, 'bad'); }
    explain(startLine(m, p)); $('mission').scrollTop = 0; afterChange();   // to the top first, so a question at the start can scroll into view
  }
  // the buses: look a little ahead of the player, so the address bus at the back is not under the card at the top
  const camAhead = () => 0;
  const camX = () => 11.5 + (pos.x - 11.5) * 0.25;
  function startLine(m, p) { return KIND[m.kind].start(m, p); }

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
  const keyOf = p => p.key;
  // a mistake in a challenge ends that round (it could no longer count) and starts a new one, with the reason shown
  function mistake(msg) {
    log.add(M.m.title + ': ' + msg.replace(/<[^>]+>/g, ''), false);
    if (M.m.type === 'challenge') { R.why = msg; R.spoilt = true; R.over = true; M.have = 0; M.spoilt++; newRound(msg); return; }
    R.why = msg; R.slipped = true; toast(msg, 'bad'); explain('Not this time. ' + msg + (M.m.guided ? '' : ' The arrow now shows the way.')); drawAll();
  }
  function finishRound(msg) {
    R.over = true; R.endMsg = msg;
    if (M.m.type === 'tutorial') { finishMission(); return; }
    if (!R.spoilt) {
      M.have++; log.add(M.m.title + ': clean round', true);
      if (M.have >= (M.m.need || NEED)) finishMission();
      else toast('Clean round! ' + M.have + ' of ' + (M.m.need || NEED) + '.', 'good');
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
    const L = lessonMode.on && LESSONS.find(x => x.id === lessonMode.id);   // in lesson mode the lesson's own activities finish it
    if (L ? L.missions.every(x => done[x]) : MISSIONS.every(x => done[x.id])) log.finish();
    toast('Mission complete!', 'good');
  }

  // ---------------------------------------------------------------- running pseudocode, one line at a time
  // Each variable is a box with a TYPE plate behind it: DECLARE puts a type cube on the plate, and from then on the
  // box only lets in that kind of value (the wrong kind stops the program). A CONSTANT box locks after its one value.
  // Values written in the line wait on CODE pads. Library functions and operators are worked out on the WORK bench,
  // innermost first: put the values in its slots, press RUN, carry the answer from OUT. OUTPUT carries a value to the
  // SCREEN. INPUT: press the KEYBOARD, what the user types appears.
  const KIND = {};
  const TROLE = { INTEGER: 'num', REAL: 'var', STRING: 'paren', BOOLEAN: 'on' };
  const ERR = 'The program stops with an error';
  const valCube = (v, extra) => cube(show(v).replace(/ /g, ' '), Object.assign({ role: TROLE[v.t], val: v }, extra || {}));
  const ch = () => M.m.type === 'challenge';
  const line = () => R.p.prog[R.li];
  const lineNo = () => 'Line ' + (R.li + 1);
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  const code = l => '<code>' + esc(lineText(l)) + '</code>';
  function bad(msg) { if (ch()) return { msg, mistake: true }; R.slipped = true; return { msg }; }
  function badNow(msg) { if (ch()) { mistake(msg); return; } R.slipped = true; toast(msg, 'bad'); explain('Not this time. ' + msg); drawAll(); }
  const dstOf = l => l.op === 'output' ? R.screen_ : R.box[l.v];
  const topExpr = l => l.e;
  function fromOk(e, from) {
    if (!from) return false;
    if (isNode(e)) return from.role === 'out';
    if (e.lit) return from.role === 'code';
    if (e.v) return from.role === 'var' && from.v === e.v;
    return false;
  }
  const varsNow = () => R.li ? R.p.run.after[R.li - 1] || {} : {};
  function evalRef(r) { if (r.lit) return r.lit; if (r.v) return varsNow()[r.v]; return (R.p.run.nodeVals[R.li] || new Map()).get(r); }
  function lits(e, out = []) { if (!e) return out; if (isNode(e)) partsOf(e).forEach(p => lits(p, out)); else if (e.lit) out.push(e.lit); return out; }
  // the end of the program: it finished, or it stopped with an error
  function stopHere(msg) { explain(lineNo() + ': ' + esc(msg) + ' The program stops.'); R.stopped = true; finishRound(ERR + ' at line ' + (R.li + 1) + ': ' + esc(msg)); drawAll(); }
  function lineWhy(l) {
    const e = l.e, t = lineNo() + ' is ' + code(l) + '. ';
    if (l.op === 'declare') return t + 'Put the ' + (l.choose ? 'right' : l.type) + ' type cube on the TYPE plate behind ' + l.v + '.' + (l.choose ? ' Look at what the program stores in ' + l.v + ' later.' : '');
    if (l.op === 'input') return t + 'Press the KEYBOARD, then carry what the user types to ' + l.v + '.';
    if (isNode(e)) return t + 'Work it out on the WORK bench first, innermost first: put the values in its slots, press RUN, then carry the answer from OUT.';
    if (e.lit) return t + 'The value is written in the line: take it from the CODE pad.';
    return t + (l.op === 'output' ? 'OUTPUT ' + e.v + ' shows the value stored in ' + e.v + ': take a copy from the ' + e.v + ' box.' : 'Take a copy of the value stored in ' + e.v + '.');
  }
  // a sign that keeps capital and small letters
  function codeSign(text, x, y, h, o) {
    const c = document.createElement('canvas'), g = c.getContext('2d'), px = 34, font = '700 ' + px + 'px Consolas, "Lucida Console", "Courier New", monospace';
    g.font = font;
    const w = Math.ceil(g.measureText(text).width) + px * 1.2, hh = Math.ceil(px * 1.55);
    c.width = w; c.height = hh;
    g.fillStyle = o.bg; g.fillRect(0, 0, w, hh);
    g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = o.ink; g.fillText(text, w / 2, hh / 2 + 1);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true, sizeAttenuation: false }));
    sp.scale.set(o.size * w / hh, o.size, 1); sp.renderOrder = 10;
    sp.position.set((x + 0.5) * T, h, (y + 0.5) * T); worldG.add(sp);
    return sp;
  }
  const dropSign = g => { if (g) { worldG.remove(g); g.material?.map?.dispose?.(); g.material?.dispose?.(); } };
  function boxSign(n) {
    dropSign(R.bsign[n]);
    const s = R.box[n], t = R.decl[n];
    R.bsign[n] = codeSign(R.isConst[n] ? n + ' (CONSTANT)' : t ? n + ' : ' + t : n, s.x, s.y + 1, 125, { bg: R.isConst[n] ? '#7a1f1f' : '#151515', ink: '#f4f4f0', size: 0.034 });
  }
  function signs() {
    for (const g of [R.lineG, R.scrG, R.benchG]) dropSign(g);
    const l = line(), node = R.nodes[R.ni];
    R.lineG = codeSign(l ? 'Line ' + (R.li + 1) + ':  ' + lineText(l) : 'The program has finished', 11, 0, 300, { bg: '#212529', ink: '#ffd43b', size: 0.05 });
    R.scrG = codeSign(R.screen.length ? R.screen[R.screen.length - 1] : ' ', 19, 6, 200, { bg: '#0b3d1f', ink: '#b2f2bb', size: 0.045 });
    R.benchG = node ? codeSign(benchText(node), 12, 9, 150, { bg: '#5c3d00', ink: '#ffd43b', size: 0.04 }) : null;
  }
  // the bench sign: the function or operator, with A and B for the slots
  const benchText = n => n.fn ? n.fn + '(' + n.args.map((a, i) => 'ABC'[i]).join(', ') + ')' : 'A ' + n.bin + ' B';
  function setLine() {
    for (const s of [R.out, R.kbOut, ...R.code, ...R.arg]) { s.items.forEach(killItem); s.items = []; }
    const l = line();
    R.nodes = l && l.e ? nodesOf(l.e) : []; R.ni = 0;
    if (l && l.e) lits(l.e).slice(0, R.code.length).forEach((v, i) => addItem(R.code[i], valCube(v)));
    R.typed = false;
    signs();
  }
  function nextLine() {
    R.li++; setLine();
    if (R.li >= R.p.prog.length) finishRound('The program has finished.' + (R.p.run.out.length ? ' It output: <b>' + R.p.run.out.map(esc).join('</b>, then <b>') + '</b>.' : ''));
  }
  // ---- DECLARE: a type cube on the plate behind the box
  function platePut(n, it, from) {
    const l = line();
    if (!l) return { msg: 'The program has finished.' };
    if (!it.tcube) return { msg: 'Only a type cube goes on a TYPE plate.' };
    if (R.decl[n]) return { msg: n + ' is declared already.' };
    if (l.op !== 'declare') return bad(lineNo() + ' is ' + code(l) + '. It does not declare a variable.');
    if (l.v !== n) return bad(lineNo() + ' is ' + code(l) + '. It declares <b>' + l.v + '</b>.');
    if (it.sym !== l.type) {
      if (!l.choose) return bad(lineNo() + ' is ' + code(l) + ': the data type is ' + l.type + '.');
      const later = R.p.prog.find(x => x.op === 'set' && x.v === n), v = later && R.p.run.vals[R.p.prog.indexOf(later)];
      return bad('Later the program stores ' + (v ? esc(show(v)) : 'a value') + ' in ' + n + '. ' + (v ? typeWhy({ text: show(v), t: v.t }) : '') + ' ' + n + ' must be ' + l.type + '.');
    }
    return null;
  }
  // ---- a value where the line stores it (a variable) or shows it (the SCREEN)
  function destPut(s, it, from) {
    const l = line();
    if (!l) return { msg: 'The program has finished.' };
    if (!it.val) return { msg: it.tcube ? 'A type cube goes on the TYPE plate behind the box.' : 'Only values go here.' };
    if (l.op === 'declare') return bad(lineNo() + ' is ' + code(l) + '. It only declares ' + l.v + ': it stores no value yet.');
    if (s.role === 'screen' && l.op !== 'output') return bad(lineNo() + ' is ' + code(l) + '. Only OUTPUT shows on the SCREEN.');
    if (s.role === 'var' && l.op === 'output') return bad(lineNo() + ' is ' + code(l) + '. OUTPUT shows a value on the SCREEN. It stores nothing.');
    if (s.role === 'var' && s.v !== l.v) return bad(lineNo() + ' is ' + code(l) + '. It stores in <b>' + l.v + '</b>, the name on the left of ' + ARROW + '.');
    if (l.op === 'input' && !R.typed) return bad('Press the KEYBOARD first: INPUT waits for the user to type.');
    if (l.op === 'input') return valEq(it.val, R.p.run.vals[R.li]) && from && from.role === 'kb' ? null : bad(lineWhy(l));
    const run = R.p.run, want = R.li === run.err ? evalTop(l) : run.vals[R.li];
    if (!want || !valEq(it.val, want) || !fromOk(l.e, from)) return bad(lineWhy(l));
    return null;
  }
  // the value of a line's right side even when storing it is the error
  function evalTop(l) { return isNode(l.e) ? (R.p.run.nodeVals[R.li] || new Map()).get(l.e) : evalRef(l.e); }
  function argPut(k, s, it, from) {
    const node = R.nodes[R.ni], l = line();
    if (!node) return bad((l ? lineNo() + ' is ' + code(l) + '. Nothing' : 'Nothing') + ' is left to work out on the WORK bench.');
    if (!it.val) return { msg: 'Only values go here.' };
    const parts = partsOf(node);
    if (k >= parts.length) return { msg: benchText(node) + ' has ' + parts.length + ' slot' + (parts.length > 1 ? 's' : '') + '.' };
    if (s.items.length) return { msg: 'That slot is full.' };
    if (R.out.items.length && !(from === R.out)) return { msg: 'Take the answer from OUT first.' };
    const r = parts[k], want = evalRef(r);
    if (!valEq(it.val, want) || !fromOk(r, from)) return bad('Slot ' + 'ABC'[k] + ' of ' + esc(benchText(node)) + ' is <b>' + esc(refText(r)) + '</b>' + (r.v ? ': take a copy from the ' + r.v + ' box.' : r.lit ? ': it is written in the line.' : ': work that out first, then carry it from OUT.'));
    return null;
  }
  function runBench() {
    if (R.ask) { toast('Answer on the right first.', 'hint'); return; }
    const node = R.nodes[R.ni], l = line();
    if (!node) { badNow((l ? lineNo() + ' is ' + code(l) + '. It' : 'The program') + ' has nothing to work out.'); return; }
    if (R.out.items.length) { toast('Take the answer from OUT first.', 'hint'); return; }
    const parts = partsOf(node);
    if (R.arg.slice(0, parts.length).some(s => !s.items.length)) { toast('Put a value in every slot first.', 'hint'); return; }
    const vals = R.arg.slice(0, parts.length).map(s => top(s).val), res = apply(node, vals);
    const call = node.fn ? node.fn + '(' + vals.map(show).join(', ') + ')' : show(vals[0]) + ' ' + node.bin + ' ' + show(vals[1]);
    const go = () => {
      for (const s of R.arg) { s.items.forEach(killItem); s.items = []; }
      if (res.err) { stopHere(call + ': ' + res.err); return; }
      addItem(R.out, valCube(res.v));
      R.ni++; signs();
      explain(esc(call) + ' gives <b>' + esc(show(res.v)) + '</b>. ' + fnWhy(node, vals, res.v) + (R.ni < R.nodes.length ? ' Now carry it into the next slot.' : ' Carry it from OUT.'));
      drawAll();
    };
    if (M.m.guided) { go(); return; }
    const right = res.err ? ERR : show(res.v), opts = [right], add = o => { if (o != null && !opts.includes(o) && opts.length < 4) opts.push(o); };
    for (const o of altsFor(node, vals)) add(o);
    add(ERR);
    R.ask = { type: 'choice', plain: true, q: 'RUN works out <b>' + esc(call) + '</b>. What does it give?', options: opts, answer: right,
      hint: fnHint(node), why: call + (res.err ? ': ' + res.err : ' gives ' + show(res.v) + '.'), done: go };
  }
  function fnWhy(n, vals, v) {
    const f = n.fn;
    if (f === 'MOD') return 'MOD gives the remainder: ' + shown(vals[1]) + ' goes into ' + shown(vals[0]) + ' ' + Math.trunc(vals[0].x / vals[1].x) + ' whole times, with ' + v.x + ' left.';
    if (f === 'DIV') return 'DIV gives the whole number of times ' + shown(vals[1]) + ' goes into ' + shown(vals[0]) + ', and throws the remainder away.';
    if (f === 'ROUND') return 'ROUND keeps ' + vals[1].x + ' decimal place' + (vals[1].x === 1 ? '' : 's') + '.';
    if (f === 'LENGTH') return 'LENGTH counts every character, spaces too.';
    if (f === 'UCASE' || f === 'LCASE') return 'Only letters change. Digits, spaces and symbols stay the same. It gives a new string.';
    return n.bin === '/' ? '/ gives a REAL.' : '';
  }
  function fnHint(n) { return n.fn === 'MOD' ? 'MOD: the remainder after dividing.' : n.fn === 'DIV' ? 'DIV: how many whole times it goes in.' : n.fn === 'ROUND' ? 'The second value says how many decimal places to keep.' : n.fn === 'LENGTH' ? 'Count every character, and a space is a character too.' : n.fn ? 'Only letters have a capital and a small form.' : 'Look at the data type on each side first.'; }
  function altsFor(n, vals) {
    const [a, b] = vals, out = [];
    if (n.fn === 'MOD' || n.fn === 'DIV') { out.push(String(n.fn === 'MOD' ? Math.trunc(a.x / b.x) : a.x % b.x)); out.push(String(Math.round(a.x / b.x * 100) / 100)); }
    else if (n.fn === 'ROUND') { out.push(String(Math.trunc(a.x * Math.pow(10, b.x)) / Math.pow(10, b.x))); out.push(String(Math.round(a.x))); }
    else if (n.fn === 'LENGTH') { out.push(String(a.x.replace(/ /g, '').length)); out.push(String(a.x.length + 1)); out.push(String(a.x.length - 1)); }
    else if (n.fn === 'UCASE' || n.fn === 'LCASE') { const up = n.fn === 'UCASE'; out.push('"' + (up ? a.x.toLowerCase() : a.x.toUpperCase()) + '"'); out.push('"' + a.x + '"'); out.push('"' + (up ? a.x[0].toUpperCase() + a.x.slice(1) : a.x[0].toLowerCase() + a.x.slice(1).toUpperCase()) + '"'); }
    else if (n.bin && a.t !== 'STRING' && b.t !== 'STRING') { out.push(String(n.bin === '*' ? a.x + b.x : a.x * b.x)); if (n.bin === '/') out.push(String(Math.trunc(a.x / b.x))); }
    else out.push('"' + shown(a) + shown(b) + '"');
    return out;
  }
  function pressKeyboard() {
    if (R.ask) { toast('Answer on the right first.', 'hint'); return; }
    const l = line();
    if (!l || l.op !== 'input') { badNow((l ? lineNo() + ' is ' + code(l) + '. It' : 'The program') + ' does not use INPUT. The KEYBOARD is only for INPUT.'); return; }
    if (R.typed) { toast('The user has typed it. Carry it on.', 'hint'); return; }
    R.typed = true;
    if (R.li === R.p.run.err) { stopHere(R.p.run.errMsg); return; }
    addItem(R.kbOut, valCube(R.p.run.vals[R.li]));
    explain('INPUT waits. The user types <b>' + esc(l.typed) + '</b>. ' + l.v + ' is ' + R.decl[l.v] + ', so it is stored as <b>' + esc(show(R.p.run.vals[R.li])) + '</b>.');
    drawAll();
  }
  function nextMove() {
    const l = line(); if (!l) return null;
    if (l.op === 'declare') return { take: R.tcrate[l.type], to: R.plate[l.v] };
    if (l.op === 'input') return R.typed ? { take: R.kbOut, to: R.box[l.v] } : { press: R.kb };
    const dst = dstOf(l);
    if (R.ni < R.nodes.length) {
      const parts = partsOf(R.nodes[R.ni]);
      for (let k = 0; k < parts.length; k++) if (!R.arg[k].items.length) return produce(parts[k], R.arg[k]);
      return { press: R.run };
    }
    return produce(l.e, dst);
  }
  function produce(r, to) {
    if (isNode(r)) return { take: R.out, to };
    if (r.lit) return { take: R.code.find(s => s.items.length && valEq(top(s).val, r.lit)) || R.code[0], to };
    return { take: R.box[r.v], to };
  }
  function progHtml(prog, at, vars, screen, decl) {
    let h = '<div class="vl-prog">' + prog.map((l, i) => '<div class="vl-line' + (i === at ? ' now' : i < at ? ' done' : '') + '"><span class="vl-n">' + String(i + 1).padStart(2, '0') + '</span><code>' + esc(lineText(l)) + '</code></div>').join('') + '</div>';
    const names = [...new Set(prog.filter(l => l.v).map(l => l.v))];
    h += '<table class="vl-vars"><tr>' + names.map(n => '<th>' + n + (decl && decl[n] ? '<br><small>' + decl[n] + '</small>' : '') + '</th>').join('') + '</tr><tr>' + names.map(n => '<td>' + (vars[n] ? esc(show(vars[n])) : '') + '</td>').join('') + '</tr></table>';
    h += '<div class="vl-screen"><span class="vl-sh">SCREEN</span>' + (screen.length ? screen.map(s => '<div>' + esc(s) + '</div>').join('') : '<div class="vl-empty">empty</div>') + '</div>';
    return h;
  }
  // a string's characters with their positions (the method for LENGTH, UCASE and LCASE)
  function charsHtml(s) { return '<table class="pc-chars"><tr><th>Position</th>' + [...s].map((c, i) => '<td>' + (i + 1) + '</td>').join('') + '</tr><tr><th>Character</th>' + [...s].map(c => '<td>' + (c === ' ' ? '&#9251;' : esc(c)) + '</td>').join('') + '</tr></table>'; }
  function predictAllAsk(p) {
    const run = p.run, out = run.out, err = run.err >= 0;
    const say = (lines, stops) => lines.length ? lines.join(', then ') + (stops ? ', then it stops with an error' : '') : stops ? 'It stops with an error' : 'nothing';
    const right = say(out, err), opts = [right], add = o => { if (o && !opts.includes(o) && opts.length < 4) opts.push(o); };
    if (err) {
      const l = p.prog[run.err], v = l.e ? (isNode(l.e) ? null : l.e.lit || (run.after[run.err - 1] || {})[l.e.v]) : null;
      if (v) add(say(out.concat([shown(v)])));
      add(say(out.concat(['0'])));
      if (v && v.t === 'REAL') add(say(out.concat([String(Math.round(v.x))])));
      if (v && v.t === 'STRING' && /^\d+$/.test(v.x)) add(say(out.concat([String(+v.x + 1)])));
      add(say(out.concat([v ? '"' + shown(v) + '"' : 'nothing'])));
    } else {
      const head = out.slice(0, -1), last = out[out.length - 1], alt = x => say(head.concat([x]));
      add(say(out, true));
      for (const v of shuffle(run.vals.filter(Boolean))) add(alt(shown(v)));
      if (/^\d+$/.test(last)) { add(alt(String(+last + 1))); add(alt(String(+last - 1))); }
      add(alt(last.toLowerCase() === last ? last.toUpperCase() : last.toLowerCase()));
    }
    return { type: 'choice', plain: true, wide: true, q: 'Before you run it: what happens? What is output?', options: opts, answer: right,
      hint: 'Follow the program one line at a time. Check each value fits the data type of its variable.', why: right + '.', done: () => explain('Now run it to check, one line at a time.') };
  }
  KIND.run = {
    start(m, p) { return 'Run the program one line at a time, from the top. Line 1 is ' + code(p.prog[0]) + '.'; },
    setup(R, m) {
      const p = R.p;
      newWorld(24, 13, 'Pseudocode');
      R.li = 0; R.screen = []; R.typed = false; R.decl = {}; R.isConst = {}; R.bsign = {}; R.nodes = []; R.ni = 0;
      const names = [...new Set(p.prog.filter(l => l.v).map(l => l.v))];
      R.box = {}; R.plate = {};
      names.forEach((n, i) => {
        const x = 2 + i * 3;
        R.plate[n] = addSlot({ role: 'plate', pad: 'rail', x, y: 2, v: n, take: () => 'The data type stays once it is declared.', put: (it, from) => platePut(n, it, from) });
        const s = addSlot({ role: 'var', pad: 'answer', x, y: 4, v: n,
          copyOut: () => s.items.length ? valCube(top(s).val) : n + ' has no value yet.', put: (it, from) => destPut(s, it, from) });
        R.box[n] = s; boxSign(n);
      });
      R.screen_ = addSlot({ role: 'screen', pad: 'target', x: 18, y: 7, w: 3, label: 'SCREEN', tag: { tagY: 110 }, put: (it, from) => destPut(R.screen_, it, from) });
      R.code = [0, 1].map(k => addSlot({ role: 'code', pad: 'supply', x: 2 + k * 2, y: 8, label: 'CODE', tag: { tagY: 110, tagSize: 0.032 },
        copyOut: s => s.items.length ? valCube(top(s).val) : 'Line ' + (R.li + 1) + ' has no value written here.', put: () => ({ msg: 'The CODE pads give the values written in the line.' }) }));
      R.arg = [0, 1].map(k => addSlot({ role: 'arg', pad: 'pedestal', x: 11 + k * 2, y: 8, label: 'ABC'[k], tag: { tagY: 110 }, put: (it, from) => argPut(k, R.arg[k], it, from) }));
      R.run = addSlot({ role: 'run', pad: 'answer', x: 12, y: 10, label: 'RUN', tag: { tagY: 110 }, press: () => runBench(), pressText: 'to work it out.' });
      R.out = addSlot({ role: 'out', pad: 'answer', x: 15, y: 8, label: 'OUT', tag: { tagY: 110, tagSize: 0.032 }, put: () => ({ msg: 'Answers come out here.' }) });
      R.tcrate = {};
      TYPES.forEach((t, i) => { R.tcrate[t] = addSlot({ role: 'tcrate', pad: 'crate', x: 12 + i * 3, y: 2, crate: t, crateRole: 'paren', tcube: true, label: t, tag: { tagY: 110, tagSize: 0.03 } }); });
      if (p.prog.some(l => l.op === 'input')) {
        R.kb = addSlot({ role: 'keyboard', pad: 'target', x: 2, y: 11, w: 2, label: 'KEYBOARD', tag: { tagY: 110 }, press: () => pressKeyboard(), pressText: 'to let the user type.' });
        R.kbOut = addSlot({ role: 'kb', pad: 'supply', x: 5, y: 11, label: 'TYPED', tag: { tagY: 110, tagSize: 0.032 }, put: () => ({ msg: 'Only what the user types goes here.' }) });
      } else R.kbOut = { items: [] };
      R.ask = m.predictAll ? predictAllAsk(p) : null;
      setLine();
      pos.x = 11; pos.y = 6;
    },
    placed(it, slot) {
      const l = line();
      if (slot.role === 'plate') {
        it.tcube = true; R.decl[slot.v] = it.sym; boxSign(slot.v);
        explain(lineNo() + ': ' + code(l) + '. ' + slot.v + ' can now hold only ' + it.sym + ' values.');
        nextLine();
      } else if (slot.role === 'var') {
        const old = slot.items.filter(x => x !== it);
        if (R.li === R.p.run.err) { slot.items = old; killItem(it); stopHere(R.p.run.errMsg); return; }
        old.forEach(killItem); slot.items = [it];
        if (l.op === 'const') { R.isConst[l.v] = true; R.decl[l.v] = it.val.t; boxSign(l.v); }
        explain(lineNo() + ': ' + code(l) + '. ' + (old.length ? 'The old value ' + esc(show(old[0].val)) + ' is replaced: ' : '') + '<b>' + l.v + '</b> now holds <b>' + esc(show(it.val)) + '</b>.' + (l.op === 'const' ? ' It is a CONSTANT: no line can change it.' : ''));
        nextLine();
      } else if (slot.role === 'screen') {
        killItem(it); slot.items = [];
        R.screen.push(shown(it.val));
        explain(lineNo() + ': ' + code(l) + '. OUTPUT shows <b>' + esc(shown(it.val)) + '</b>' + (it.val.t === 'STRING' ? ', without the quotes.' : '.'));
        nextLine();
      } else if (slot.role === 'arg') {
        explain('Slot ' + 'ABC'[R.arg.indexOf(slot)] + ': <b>' + esc(show(it.val)) + '</b>.' + (partsOf(R.nodes[R.ni]).every((x, k) => R.arg[k].items.length) ? ' Now press RUN.' : ''));
      }
    },
    check() { },
    guide(R, m) {
      if (R.ask) return null;
      if (line() && line().choose) return null;   // choosing the type is the pupil's decision: no arrow to it
      const mv = nextMove(); if (!mv) return null;
      if (hand.item) {
        if (hand.item.tcube) return mv.to && mv.to.role === 'plate' && hand.item.sym === line().type ? slotTarget(mv.to) : null;
        return mv.take && mv.take.items && mv.take.items.length && valEq(hand.item.val, top(mv.take).val) ? slotTarget(mv.to) : null;
      }
      return slotTarget(mv.press || mv.take);
    },
    steps(R, m) {
      return R.p.prog.map((l, i) => {
        const how = l.op === 'declare' ? 'Carry the ' + (l.choose ? 'right' : l.type) + ' type cube to the TYPE plate behind ' + l.v + '.'
          : l.op === 'input' ? 'Press the KEYBOARD, then carry what the user types to ' + l.v + '.'
          : isNode(l.e) ? 'Work it out on the WORK bench, innermost first, then carry the answer to ' + (l.op === 'output' ? 'the SCREEN.' : l.v + '.')
          : 'Carry ' + (l.e.lit ? 'the value from the CODE pad' : 'a copy of ' + l.e.v) + ' to ' + (l.op === 'output' ? 'the SCREEN.' : l.v + '.');
        return { text: 'Line ' + (i + 1) + ': ' + code(l) + (i === R.li ? ' ' + how : ''), done: () => R.li > i || R.over };
      });
    },
    goals(m) {
      if (m.noHelp) return [];
      const g = ['Run the lines in order, from the top.', 'DECLARE a variable before it is used. It then holds only its own data type.', ARROW + ' stores the value on the right in the variable on the left.'];
      if (m.group.startsWith('Library')) g.push('MOD gives the remainder. DIV gives the whole number of times.', 'ROUND(Number, Places) keeps that many decimal places. LENGTH counts every character.');
      if (m.group.startsWith('Data types') || m.group.startsWith('Constants')) g.push('INTEGER: whole numbers. REAL: a decimal part. STRING: text in quotes. BOOLEAN: TRUE or FALSE.', 'The wrong kind of value stops the program.');
      if (m.group.startsWith('Constants')) g.push('A CONSTANT is set once. No line can change it.');
      if (m.group.startsWith('Strings')) g.push('LENGTH counts every character, and a space is a character.', 'UCASE and LCASE change only letters, and give a new string.');
      return g;
    },
    expr(R) {
      const vars = {}; for (const [n, s] of Object.entries(R.box)) if (s.items.length) vars[n] = top(s).val;
      const carry = hand.item && hand.item.val ? hand.item.val : null;
      return progHtml(R.p.prog, R.li, vars, R.screen, R.decl) + (carry ? '<p><b>You are carrying:</b> <code>' + esc(show(carry)) + '</code></p>' + (carry.t === 'STRING' && M.m.group.startsWith('Strings') ? charsHtml(carry.x) : '') : '');
    },
    walk(R, m) {
      let p, g = 0; do p = m.gen(); while (p.key === R.p.key && ++g < 30);
      const run = p.run, screen = [], decl = {}, steps = [{ text: '<b>A different program.</b> Run it one line at a time, from the top.', visual: progHtml(p.prog, 0, {}, [], {}) }];
      for (let i = 0; i < p.prog.length; i++) {
        const l = p.prog[i], before = i ? run.after[i - 1] || {} : {}, v = run.vals[i];
        let t;
        if (l.op === 'declare') { decl[l.v] = l.type; t = 'DECLARE: ' + l.v + ' is <span class="hl">' + l.type + '</span>' + (l.choose ? '. Look ahead: the program stores ' + (() => { const j = p.prog.findIndex(x => x.op === 'set' && x.v === l.v); return j >= 0 && run.vals[j] ? esc(show(run.vals[j])) + ' in it. ' + typeWhy({ text: show(run.vals[j]), t: run.vals[j].t }) : 'a value in it.'; })() : '. It can now hold only ' + l.type + ' values.'); }
        else if (i === run.err) t = '<span class="hl">The program stops</span>: ' + esc(run.errMsg);
        else if (l.op === 'input') t = 'INPUT: the user types ' + esc(l.typed) + '. ' + l.v + ' holds <span class="hl">' + esc(show(v)) + '</span>.';
        else {
          const work = nodesOf(l.e).map(n => esc(refText(n)) + ' gives ' + esc(show(run.nodeVals[i].get(n))) + '. ').join('');
          if (l.op === 'output') { screen.push(shown(v)); t = work + 'OUTPUT shows <span class="hl">' + esc(shown(v)) + '</span>.'; }
          else t = work + (before[l.v] ? 'The old value ' + esc(show(before[l.v])) + ' is replaced. ' : '') + l.v + ' holds <span class="hl">' + esc(show(v)) + '</span>.' + (l.op === 'const' ? ' It is a CONSTANT.' : '');
        }
        steps.push({ text: 'Line ' + (i + 1) + ': ' + t, visual: progHtml(p.prog, i, run.after[i] || before, screen.slice(), Object.assign({}, decl)) });
        if (i === run.err) break;
      }
      steps.push({ text: 'Now run yours the same way.', visual: '' });
      return steps;
    }
  };

  // ---------------------------------------------------------------- Name the data type: carry each card to its type
  KIND.types = {
    start() { return 'Carry each value to its data type.'; },
    setup(R, m) {
      const cards = R.p.cards, W = Math.max(24, cards.length * 3 + 6), mid = Math.floor(W / 2);
      newWorld(W, 12, 'Data types');
      R.pads = {};
      TYPES.forEach((t, i) => { const s = addSlot({ role: 'pad', pad: 'answer', x: mid - 7 + i * 5, y: 4, grow: 'pile', t, label: t, tag: { tagY: 140 },
        take: () => 'This card is sorted.', put: (it, from) => from === s ? null : !it.card ? { msg: 'Only cards go here.' } : it.t === t ? null : { msg: it.text + ' is not ' + t + '. ' + typeWhy(it), mistake: true } }); R.pads[t] = s; });
      const x0 = Math.floor((W - (cards.length - 1) * 3) / 2);
      R.shelf = cards.map((c, i) => { const s = addSlot({ role: 'shelf', pad: 'supply', x: x0 + i * 3, y: 9, put: (it, from) => from === s ? null : s.items.length ? { msg: 'That spot is full.' } : null });
        addItem(s, { card: true, text: c.text, t: c.t, sym: c.text, role: 'card' }); return s; });
      R.placedN = 0; pos.x = mid; pos.y = 7;
    },
    placed(it, slot) { if (slot.role === 'pad') { R.placedN++; explain(esc(it.text) + ': <b>' + it.t + '</b>. ' + typeWhy(it)); } },
    check() { if (R.placedN === R.p.cards.length && !hand.item) finishRound('Every value is sorted.'); },
    guide(R) { if (hand.item) return null;   /* never an arrow to the answer */ const s = R.shelf.find(x => x.items.length); return s ? slotTarget(s) : null; },
    steps(R) { return R.p.cards.map(c => ({ text: 'Sort <b>' + esc(c.text) + '</b>.', done: () => Object.values(R.pads).some(s => s.items.some(x => x.text === c.text)) })); },
    goals() { return ['Quotes make a STRING, even round digits.', 'TRUE or FALSE is a BOOLEAN.', 'A decimal part makes a REAL.', 'A whole number is an INTEGER.']; },
    expr(R) { const c = hand.item && hand.item.card ? hand.item : null; return '<b>Values sorted:</b> ' + R.placedN + ' of ' + R.p.cards.length + (c ? '<br><b>You are carrying:</b> <code>' + esc(c.text) + '</code>' : '<br>Walk up to a card to read it.'); },
    walk(R) {
      const p = typeRound({ n: 4 }), steps = [{ text: '<b>Different values.</b> Look for quotes first, then TRUE or FALSE, then a decimal part.', visual: '' }];
      p.cards.forEach(c => steps.push({ text: '<code>' + esc(c.text) + '</code>: ' + typeWhy(c) + ' <span class="hl">' + c.t + '</span>.', visual: '' }));
      steps.push({ text: 'Now sort your own values.', visual: '' });
      return steps;
    }
  };

  // ---------------------------------------------------------------- Accepted or rejected?: each typed input to its output
  const gateWhy = (p, c) => p.kind === 'len' ? '"' + esc(c.text) + '" has ' + c.len + ' characters' + (c.text.includes(' ') ? ' (the space counts)' : '') + '. The IF is ' + (c.ok ? 'TRUE' : 'FALSE') + ', so it outputs ' + (c.ok ? p.yes : p.no) + '.'
    : (p.prog[2].includes('LCASE') ? 'LCASE("' + esc(c.text) + '") is "' + esc(c.text.toLowerCase()) + '". ' : '') + 'The IF is ' + (c.ok ? 'TRUE' : 'FALSE') + (c.ok ? '' : ': = compares every character, capitals too') + ', so it outputs ' + (c.ok ? p.yes : p.no) + '.';
  KIND.gate = {
    start(m, p) { return 'Read the program. Carry each typed input to what the program outputs.'; },
    setup(R, m) {
      const p = R.p, cards = p.cards, W = Math.max(24, cards.length * 3 + 6), mid = Math.floor(W / 2);
      newWorld(W, 12, 'Check the input');
      const mk = (ok, x, label) => { const s = addSlot({ role: 'pad', pad: ok ? 'answer' : 'target', x, y: 4, grow: 'pile', ok, label, tag: { tagY: 140 },
        take: () => 'This input is sorted.', put: (it, from) => from === s ? null : !it.card ? { msg: 'Only typed inputs go here.' } : it.ok === ok ? null : { msg: gateWhy(p, it), mistake: true } }); return s; };
      R.yes = mk(true, mid - 4, 'OUTPUT ' + p.yes); R.no = mk(false, mid + 3, 'OUTPUT ' + p.no);
      const x0 = Math.floor((W - (cards.length - 1) * 3) / 2);
      R.shelf = cards.map((c, i) => { const s = addSlot({ role: 'shelf', pad: 'supply', x: x0 + i * 3, y: 9, put: (it, from) => from === s ? null : s.items.length ? { msg: 'That spot is full.' } : null });
        addItem(s, { card: true, text: '"' + c.text + '"', raw: c.text, ok: c.ok, len: c.len, sym: c.text, role: 'card' }); return s; });
      R.placedN = 0; pos.x = mid; pos.y = 7;
    },
    placed(it, slot) { if (slot.role === 'pad') { R.placedN++; explain(gateWhy(R.p, { text: it.raw, ok: it.ok, len: it.len })); } },
    check() { if (R.placedN === R.p.cards.length && !hand.item) finishRound('Every input is sorted.'); },
    guide(R) { if (hand.item) return null;   /* never an arrow to the answer */ const s = R.shelf.find(x => x.items.length); return s ? slotTarget(s) : null; },
    steps(R) { return R.p.cards.map(c => ({ text: 'The user types <b>' + esc(c.text) + '</b>.', done: () => [R.yes, R.no].some(s => s.items.some(x => x.raw === c.text)) })); },
    goals(m) { return m.noHelp ? [] : ['LENGTH counts every character, and a space is a character.', '>= includes the limit. > does not.', '= compares every character, capitals too. LCASE first makes capitals not matter.']; },
    expr(R, m) {
      const c = hand.item && hand.item.card ? hand.item : null;
      return '<div class="vl-prog">' + R.p.prog.map((l, i) => '<div class="vl-line"><span class="vl-n">' + String(i + 1).padStart(2, '0') + '</span><code>' + esc(l) + '</code></div>').join('') + '</div>' +
        '<b>Inputs sorted:</b> ' + R.placedN + ' of ' + R.p.cards.length + (c ? '<br><b>You are carrying:</b> <code>' + esc(c.text) + '</code>' + (m.noHelp ? '' : charsHtml(c.raw)) : '<br>Walk up to an input to read it.');
    },
    walk(R, m) {
      const p = gateRound({ n: 4, kind: R.p.kind }), steps = [{ text: '<b>A different program.</b> Work out the IF for each input.', visual: '<div class="vl-prog">' + p.prog.map(l => '<div class="vl-line"><code>' + esc(l) + '</code></div>').join('') + '</div>' }];
      p.cards.forEach(c => steps.push({ text: 'The user types <code>' + esc(c.text) + '</code>. ' + gateWhy(p, c).replace(/outputs (\w[\w ]*)\.$/, 'outputs <span class="hl">$1</span>.'), visual: charsHtml(c.text) }));
      steps.push({ text: 'Now sort your own inputs.', visual: '' });
      return steps;
    }
  };

  // ---------------------------------------------------------------- the hand: hold to grab, let go to put down
  function locked() { return !M || M.phase !== 'play' || !R || R.over || !!R.ask || !$('cardWrap').hidden; }
  function grabTarget() {
    if (hand.item || locked()) return null;
    const s = nearestSlot(0.62, s => s.crate || s.press || s.items.length);
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
    if (s.risky && !s.crate && !s.press && !s.copyOut && !s.take(top(s))) { hand.pending = { s, at: clock, it: top(s) }; hint(); return; }
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
    if (s.press) { s.press(s); afterChange(); return; }
    if (s.copyOut) { const c = s.copyOut(s); if (typeof c === 'string') { toast(c, 'hint'); return; } hand.item = c; itemMesh(c); hand.from = s; hand.since = clock; R.moves++; afterChange(); return; }
    if (s.crate) { hand.item = cube(s.crate, { role: s.crateRole || 'paren', tcube: !!s.tcube }); itemMesh(hand.item); hand.from = s; hand.since = clock; afterChange(); return; }
    const it = top(s), why = s.take(it);
    if (why) { toast(why, 'hint'); return; }
    s.items.pop(); hand.item = it; it.slot = null; hand.from = s; hand.since = clock; R.moves++;
    afterChange();
  }
  function letGo() {
    const it = hand.item; if (!it) return;
    const from = hand.from;
    const back = () => { hand.item = null; hand.from = null; if (from.crate || from.copyOut) killItem(it); else { from.items.push(it); it.slot = from; } };
    const s = nearestSlot(0.9, x => !x.press);
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
    // no help in a challenge; in a tutorial after the first of a topic, the arrow comes only after a slip this round
    if (M.m.type === 'challenge') return null;
    if (!M.m.guided && !R.slipped) return null;
    return KIND[M.m.kind].guide(R, M.m);
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
    const g = grabTarget(), s = g ? g.slot : hand.item && !locked() ? nearestSlot(0.9, x => !x.press) : null;
    // what glows: the thing under your hand, the next thing the guide points at, and in a bit-string challenge every
    // tray you could pick up (none of them is singled out)
    const want = new Set();
    if (g && !g.slot.crate && !g.slot.press && top(g.slot)) want.add(top(g.slot));
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
      t.appendChild(el('ul', { class: 'goals' }, '<li>No help in a challenge: you decide every move.</li>'));
      t.appendChild(el('p', { class: 'note' }, '<b>' + M.have + ' of ' + (m.need || NEED) + ' clean ' + ((m.need || NEED) === 1 ? 'run' : 'rounds in a row') + '.</b>'));
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
    if (M.phase === 'play' && !R.over) act.appendChild(btn('Start again', '', () => leaveThen(() => { M.have = 0; newRound(); })));
    if (!m.noHelp && m.type !== 'challenge') act.appendChild(btn('Walk me through it', '', walkMe));
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
    box.appendChild(el('p', { class: 'ask-q' }, (a.plain ? '' : '<b>Predict.</b> ') + a.q));
    const fb = el('p', { class: 'ask-fb' + (a.fb ? ' bad' : '') }, a.fb || '');
    let read;
    const row = el('div', { class: 'ask-row' });
    if (a.type === 'num') {
      const inp = el('input', { type: 'text', inputmode: 'numeric', id: 'clAsk', 'aria-label': 'Your answer', autocomplete: 'off' });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
      row.appendChild(inp); read = () => { const v = inp.value.trim().replace(/−/g, '-'); return /^-?\d+$/.test(v) ? Number(v) : null; };
    } else if (a.type === 'choice') {
      a.order = a.order || shuffle(a.options);
      let chosen = null;
      const opts = el('div', { class: 'ask-opts' });
      a.order.forEach(o => opts.appendChild(btn(o, '', () => { chosen = o; go(); })));
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
      if (a.pick) a.pick = Array(a.len).fill('?'); a.order = null;
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
    const g = grabTarget(), s = g && g.slot, what = s && (s.crate ? 'a ' + s.crate + ' cube' : s.items.length ? (top(s).card ? 'the card "' + top(s).text + '"' : 'the ' + top(s).sym + ' cube') : '');
    if (hand.item) { h = (hand.sticky ? 'Walk to a pad and <b>tap Space</b> to put it down.' : '<b>Keep holding Space</b> and walk to a pad. Let go of Space to put it down.') + (hand.item.card ? ' Card: "' + hand.item.text + '"' : ''); key = hand.sticky ? 'tap to put down' : 'keep holding'; mode = 'hold'; }
    else if (hand.pending) { h = '<b>Keep holding Space</b>...'; key = 'keep holding'; mode = 'hold'; }
    else if (R && R.ask) h = 'Predict on the right first.';
    else if (s && s.press) { h = '<b>Press Space</b> ' + s.pressText; key = 'press'; mode = 'press'; }
    else if (s && s.copyOut) { h = '<b>Tap Space</b> to take a copy of ' + (s.items.length ? 'the ' + top(s).sym + ' cube' : 'it') + ', then tap again at a pad to put it down (or hold Space to carry it). The ' + (s.role === 'var' ? 'variable' : 'CODE pad') + ' keeps its value.'; key = 'tap to copy'; mode = 'hold'; }
    else if (s && s.risky && !s.take(top(s))) { h = '<b>Tap Space</b> to pick up ' + what + ', then tap again at a pad to put it down.'; key = 'tap to pick up'; mode = 'hold'; }
    else if (s) { h = '<b>Tap Space</b> to pick up ' + what + ', then tap again at a pad to put it down (or hold Space to carry it).'; key = 'tap to pick up'; mode = 'hold'; }
    else h = 'Walk up to a cube or card. <b>Tap Space</b> (or click) to pick it up and tap again to put it down, or hold Space to carry it. Right-drag turns the camera.';
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
    view.follow(camX(), pos.y - camAhead());
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
    get M() { return M; }, get R() { return R; }, pos, hand, setHand, start, newRound, free, solidAt, handPos, grabTarget, guideTarget, missions: MISSIONS, model: { runProg, GEN, typeRound, gateRound, lineText, show, shown, valEq }, nextMove,
    get slots() { return slots; }, get done() { return done; }, get arrows() { return arrows.count; }, get outlined() { return outlineG.children.length; }, get glowing() { return glowing; },
    toastText: () => $('toast').textContent, lessonMode, startLesson, nextMission, LESSONS, minsOf, KIND, frame: (n, ms = 33) => { for (let i = 0; i < n; i++) tick((last || performance.now()) + ms); }, nearestSlot
  };
  return { stop() { } };
}
