// Variables Lab 3D: Year 7 2.1 Data Types and Variables and 2.2 Input and Output in the lab of Network Builder 3D.
// A Python program is run one line at a time by walking: variables are boxes, values written in the code wait on
// CODE pads, sums are worked out on the WORK bench (right side first), print carries a value to the SCREEN, input()
// gives a String from the KEYBOARD, int() float() str() are machines. Also: sort values into Integer, Real, String.
// The wording is the lessons' (y7-2-1-variables, y7-2-2-input-output) and the 2D Python Lab's (PyLab/).
//
// The engine (controls, guide arrow, What just happened card, mission sheet, lesson mode, Walk me through it, the help
// rules: no help in challenges, later tutorials show the arrow only after a slip) is a fork of CpuLab3D/main.js.
// Progress: 'bc-varlab3d-v1:all:done' by mission id, best stars in ':all:stars', cloud-saved as app 'varlab3d'.
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
// ================================================================ a tiny Python (a pure model, so it can be tested)
// The Python of the lessons y7-2-1-variables and y7-2-2-input-output: variables, = stores (work out the right side,
// then store), print, input (always a String), int(), float(), str(), + adds numbers and joins Strings, a String and
// a number stop the program with an error, / always gives a Real.
// A value is { t: 'int' | 'float' | 'str', x }. A reference is { lit: value }, { v: name }, { fn, of: reference } or
// { kb: true } (what the user typed). An expression is a reference or { bin: '+', a, b }.
// A line is { op: 'set', v, e }, { op: 'print', e } or { op: 'input', v, prompt, typed, fn }.
const I = x => ({ t: 'int', x }), F = x => ({ t: 'float', x }), S = x => ({ t: 'str', x });
const L = v => ({ lit: v }), V = v => ({ v });
const fmtNum = v => v.t === 'float' && Number.isInteger(v.x) ? v.x.toFixed(1) : String(v.x);
// how the value is written in code: a String in quote marks
const show = v => v.t === 'str' ? '"' + v.x + '"' : fmtNum(v);
// what print puts on the screen: a String without its quote marks
const shown = v => v.t === 'str' ? v.x : fmtNum(v);
const TYPE_NAME = { int: 'Integer', float: 'Real', str: 'String' };
const valEq = (a, b) => !!a && !!b && a.t === b.t && a.x === b.x;
const refText = r => r.lit ? show(r.lit) : r.v ? r.v : r.fn ? r.fn + '(' + (r.of.kb ? 'input()' : refText(r.of)) + ')' : 'input()';
const exprText = e => e.bin ? refText(e.a) + ' ' + e.bin + ' ' + refText(e.b) : refText(e);
function lineText(l) {
  if (l.op === 'print') return 'print(' + exprText(l.e) + ')';
  if (l.op === 'input') { const inp = 'input("' + l.prompt + '")'; return l.v + ' = ' + (l.fn ? l.fn + '(' + inp + ')' : inp); }
  return l.v + ' = ' + exprText(l.e);
}
const progText = prog => prog.map(lineText).join('\n');
// a function on a value: { v } or { err }
function convert(fn, v) {
  if (fn === 'str') return { v: S(shown(v)) };
  if (v.t !== 'str') return { v: fn === 'int' ? I(Math.trunc(v.x)) : F(v.x) };
  const s = v.x.trim();
  if (fn === 'int') return /^-?\d+$/.test(s) ? { v: I(parseInt(s, 10)) } : { err: 'int() cannot turn "' + v.x + '" into an Integer.' };
  return /^-?\d+(\.\d+)?$/.test(s) ? { v: F(parseFloat(s)) } : { err: 'float() cannot turn "' + v.x + '" into a Real.' };
}
function binop(o, a, b) {
  if (a.t === 'str' || b.t === 'str') {
    if (a.t === 'str' && b.t === 'str' && o === '+') return { v: S(a.x + b.x) };
    return { err: o === '+' ? '+ cannot join a String and a number.' : 'You cannot do ' + o + ' with a String.' };
  }
  const x = o === '+' ? a.x + b.x : o === '-' ? a.x - b.x : o === '*' ? a.x * b.x : a.x / b.x;
  return { v: o === '/' || a.t === 'float' || b.t === 'float' ? F(Math.round(x * 1000) / 1000) : I(x) };
}
// run a program: the value each line works out, the variables after each line, the screen, and the line with an error
function runProg(prog) {
  const vars = {}, vals = [], after = [], screen = [];
  let err = -1, errMsg = '';
  const ref = (r, l) => {
    if (r.lit) return { v: r.lit };
    if (r.v) return r.v in vars ? { v: vars[r.v] } : { err: r.v + ' has no value yet.' };
    if (r.kb) return { v: S(l.typed) };
    const o = ref(r.of, l); return o.err ? o : convert(r.fn, o.v);
  };
  for (let i = 0; i < prog.length; i++) {
    const l = prog[i];
    let res;
    if (l.op === 'input') res = l.fn ? convert(l.fn, S(l.typed)) : { v: S(l.typed) };
    else if (l.e.bin) { const a = ref(l.e.a, l), b = a.err ? a : ref(l.e.b, l); res = a.err ? a : b.err ? b : binop(l.e.bin, a.v, b.v); }
    else res = ref(l.e, l);
    if (res.err) { err = i; errMsg = res.err; break; }
    vals[i] = res.v;
    if (l.op === 'print') screen.push(shown(res.v)); else vars[l.v] = res.v;
    if (l.op === 'input') screen.push(l.prompt + l.typed);
    after[i] = Object.assign({}, vars);
  }
  return { vals, after, screen, err, errMsg, printed: prog.map((l, i) => l.op === 'print' && vals[i] ? shown(vals[i]) : null).filter(x => x != null) };
}
function prob(prog) { const run = runProg(prog); return { prog, run, key: progText(prog) + '|' + prog.map(l => l.typed || '').join(',') }; }
const VARS = ['score', 'coins', 'lives', 'points', 'steps', 'gems'];
const NAMES = ['Mia', 'Tom', 'Ana', 'Ben', 'Sam', 'Nok', 'Kai'];
const GREET = ['Hi ', 'Hello ', 'Hey '];
// n different whole numbers from a to b
function nums(n, a, b) { const out = []; while (out.length < n) { const x = rnd(a, b); if (!out.includes(x)) out.push(x); } return out; }
const twoVars = () => shuffle(VARS).slice(0, 2);
const P = (e) => ({ op: 'print', e });
const SET = (v, e) => ({ op: 'set', v, e });
const ADD = (o, a, b) => ({ bin: o, a, b });

// ---- 2.1: store, replace, change, copy
const GEN = {
  store() { const v = pick(VARS), [a] = nums(1, 2, 20); return prob([SET(v, L(I(a))), P(V(v))]); },
  quote() { const v = pick(VARS), [a] = nums(1, 2, 20); return prob([SET(v, L(I(a))), P(V(v)), P(L(S(v)))]); },
  replace() { const v = pick(VARS), [a, b] = nums(2, 2, 20); return prob([SET(v, L(I(a))), SET(v, L(I(b))), P(V(v))]); },
  change() { const v = pick(VARS), [a, b] = nums(2, 2, 15); return prob([SET(v, L(I(a))), SET(v, ADD('+', V(v), L(I(b)))), P(V(v))]); },
  copy() { const [a, b] = twoVars(), [x, y] = nums(2, 2, 20); return prob([SET(a, L(I(x))), SET(b, V(a)), SET(a, L(I(y))), P(V(b))]); },
  // a random program of the 2.1 kind: two variables, stores, replaces, changes, copies, prints
  mixed(level) {
    const [a, b] = twoVars(), used = new Set(), num = () => { let x; do x = rnd(2, 20); while (used.has(x)); used.add(x); return x; };
    const prog = [SET(a, L(I(num())))], has = new Set([a]);
    const n = level >= 2 ? 4 : 3;
    while (prog.length < n) {
      const opts = ['replace', 'change'];
      if (!has.has(b)) opts.push('new', 'copyb'); else opts.push('change', 'printq');
      const k = pick(opts), tgt = pick([...has]);
      if (k === 'replace') prog.push(SET(tgt, L(I(num()))));
      else if (k === 'change') prog.push(SET(tgt, ADD(level >= 2 ? pick(['+', '-', '*']) : '+', V(tgt), L(I(rnd(2, 5))))));
      else if (k === 'new') { prog.push(SET(b, L(I(num())))); has.add(b); }
      else if (k === 'copyb') { prog.push(SET(b, V(a))); has.add(b); }
      else if (k === 'printq') prog.push(P(L(S(pick([...has])))));
    }
    if (has.has(b) && level >= 2 && Math.random() < 0.5) prog.push(SET(a, ADD('+', V(a), V(b))));
    prog.push(P(V(pick([...has]))));
    const p = prob(prog);
    // keep every number small and every stored value different from the last, so each line changes something
    return p.run.vals.some(v => v.t === 'int' && (v.x < -50 || v.x > 400)) ? GEN.mixed(level) : p;
  },
  // ---- the + sign: Integers add, Strings join
  plus() { const [d, e] = nums(2, 2, 9), n = pick(['n', 'x']), s = pick(['s', 't']); return prob([SET(n, L(I(d))), SET(s, L(S(String(e)))), P(ADD('+', V(n), V(n))), P(ADD('+', V(s), V(s)))]); },
  // ---- 2.2: input and output
  input() { return prob([{ op: 'input', v: 'name', prompt: 'What is your name? ', typed: pick(NAMES) }, P(ADD('+', L(S(pick(GREET))), V('name')))]); },
  int() { const [a, b] = nums(2, 9, 15); return prob([{ op: 'input', v: 'age', prompt: 'Age? ', typed: String(a) }, SET('age', { fn: 'int', of: V('age') }), SET('age', ADD('+', V('age'), L(I(b % 5 + 1)))), P(V('age'))]); },
  join() { const [a] = nums(1, 9, 15); return prob([SET('age', L(I(a))), P(ADD('+', L(S('Age: ')), { fn: 'str', of: V('age') }))]); },
  error() { const [a] = nums(1, 9, 15); return prob([{ op: 'input', v: 'age', prompt: 'Age? ', typed: String(a) }, P(ADD('+', V('age'), L(I(1))))]); },
  io() {
    const k = pick(['greet', 'int1', 'intin', 'join', 'err', 'err2', 'float', 'strjoin']), [a, b] = nums(2, 3, 15);
    if (k === 'greet') return prob([{ op: 'input', v: 'name', prompt: 'Name? ', typed: pick(NAMES) }, P(ADD('+', L(S(pick(GREET))), V('name')))]);
    if (k === 'int1') return prob([{ op: 'input', v: 'n', prompt: 'Number? ', typed: String(a) }, SET('n', { fn: 'int', of: V('n') }), SET('n', ADD(pick(['+', '*']), V('n'), L(I(b % 4 + 2)))), P(V('n'))]);
    if (k === 'intin') return prob([{ op: 'input', v: 'age', prompt: 'Age? ', typed: String(a), fn: 'int' }, P(ADD('+', V('age'), L(I(b % 5 + 1))))]);
    if (k === 'join') return prob([SET('score', L(I(a))), P(ADD('+', L(S('Score: ')), { fn: 'str', of: V('score') }))]);
    if (k === 'err') return prob([{ op: 'input', v: 'age', prompt: 'Age? ', typed: String(a) }, P(ADD('+', V('age'), L(I(b % 5 + 1))))]);
    if (k === 'err2') return prob([SET('score', L(I(a))), P(ADD('+', L(S('Score: ')), V('score')))]);
    if (k === 'float') return prob([{ op: 'input', v: 'price', prompt: 'Price? ', typed: pick(['1.5', '2.5', '0.5', '3.5']), fn: 'float' }, P(ADD('+', V('price'), L(I(a % 3 + 1))))]);
    return prob([{ op: 'input', v: 'n', prompt: 'Number? ', typed: String(a) }, P(ADD('+', V('n'), V('n')))]);
  }
};

// ---- Which data type? Cards with a value or a calculation; the type it really is
function typeRound({ n, level }) {
  const make = () => {
    if (level === 1) {
      const k = pick(['int', 'int', 'neg', 'float', 'point0', 'str', 'strnum', 'strdec', 'phone']);
      if (k === 'int') return { text: String(rnd(2, 99)), t: 'int' };
      if (k === 'neg') return { text: String(-rnd(1, 20)), t: 'int' };
      if (k === 'float') return { text: pick(['2.5', '0.75', '3.25', '-1.5', '9.9']), t: 'float' };
      if (k === 'point0') return { text: rnd(1, 9) + '.0', t: 'float' };
      if (k === 'str') return { text: '"' + pick(NAMES.concat(['Yes', 'hello'])) + '"', t: 'str' };
      if (k === 'strnum') return { text: '"' + rnd(2, 99) + '"', t: 'str' };
      if (k === 'strdec') return { text: '"' + pick(['2.5', '1.5', '4.0']) + '"', t: 'str' };
      return { text: '"0' + rnd(800, 999) + rnd(100000, 999999) + '"', t: 'str' };
    }
    const [a, b] = nums(2, 2, 9), k = pick(['add', 'mul', 'div', 'divexact', 'mixed', 'join', 'sub']);
    if (k === 'add') return { text: a + ' + ' + b, t: 'int' };
    if (k === 'sub') return { text: (a + b) + ' - ' + b, t: 'int' };
    if (k === 'mul') return { text: a + ' * ' + b, t: 'int' };
    if (k === 'div') return { text: (a * 2 + 1) + ' / 2', t: 'float' };
    if (k === 'divexact') return { text: (a * 2) + ' / 2', t: 'float' };
    if (k === 'mixed') return { text: a + ' + ' + pick(['0.5', '1.5', '2.5']), t: 'float' };
    return { text: '"' + a + '" + "' + b + '"', t: 'str' };
  };
  const cards = [], seen = new Set();
  const want = shuffle(['int', 'float', 'str'].flatMap(t => Array(Math.ceil(n / 3)).fill(t))).slice(0, n);
  for (const t of want) { let c, g = 0; do c = make(); while ((c.t !== t || seen.has(c.text)) && ++g < 200); seen.add(c.text); cards.push(c); }
  return { cards, key: cards.map(c => c.text).join('|') };
}
function typeWhy(c) {
  if (c.text.startsWith('"') && c.t === 'str') return c.text.includes('+') ? 'Two Strings joined with + make a String.' : 'It is in quote marks, so it is a String, even when it holds digits.';
  if (c.text.includes('/')) return '/ always gives a Real: ' + c.text + ' gives a number with a decimal point.';
  if (c.t === 'float') return c.text.includes('+') ? 'A Real in a sum gives a Real.' : 'It has a decimal point, so it is a Real.';
  return 'A whole number with no quote marks is an Integer.';
}

// ================================================================ missions
const MISSIONS = [
  { id: 'store-t', group: 'Store a value', title: 'A Variable Stores a Value', type: 'tutorial', guided: true, kind: 'run', mins: 4,
    intro: 'Each box is a <b>variable</b>: a named store. Run the program one line at a time. <b>=</b> means store: carry the value from the code to the box with that name. <b>print</b> shows a value on the SCREEN.',
    gen: () => GEN.store(),
    after: { q: 'What does print(score) show?', options: ['The value stored in score.', 'The word score.', 'Nothing: score is a name.'], why: 'No quote marks round score: it is a name, so print shows the value stored in it.' } },
  { id: 'quote-t', group: 'Store a value', title: 'Name or Text?', type: 'tutorial', kind: 'run', mins: 4,
    intro: 'One print has quote marks and one does not. Quote marks mean the text itself. Run each line.',
    gen: () => GEN.quote(),
    after: { q: 'Why does print("score") show the word score?', options: ['Quote marks mean the text itself, not a variable.', 'score has no value.', 'print always shows names.'], why: 'Inside quote marks is text. Without them, score is the name of a variable.' } },
  { id: 'replace-t', group: 'Store a value', title: 'Store a New Value', type: 'tutorial', kind: 'run', mins: 4,
    intro: 'This program stores into the same variable twice. Watch what happens to the old value.',
    gen: () => GEN.replace(),
    after: { q: 'Why does the program not print both values?', options: ['A variable holds one value at a time. The new value replaces the old one.', 'print only shows the first value.', 'The second line is a mistake.'], why: 'Storing a new value replaces the old one. That is why it is called a variable.' } },
  { id: 'store-c', group: 'Store a value', title: 'Run the Program', type: 'challenge', kind: 'run', mins: 7,
    intro: 'Run each program, one line at a time, with no mistakes. Two clean programs in a row.',
    gen: () => GEN.mixed(1) },

  { id: 'change-t', group: 'Change a variable', title: 'Use Its Own Value', type: 'tutorial', guided: true, kind: 'run', mins: 5,
    intro: 'Python works out the <b>right side first</b>. Copy the values onto the WORK bench, press RUN, then store the answer back in the variable on the left.',
    gen: () => GEN.change(),
    after: { q: 'Why is coins = coins + 5 not a maths mistake?', options: ['= means: work out the right side, then store the answer in the variable on the left.', '= means the two sides are the same.', 'Python ignores lines like this.'], why: 'In Python = does not mean "is the same as". It means store.' } },
  { id: 'copy-t', group: 'Change a variable', title: 'Copy a Value', type: 'tutorial', kind: 'run', mins: 5,
    intro: 'One variable gets a copy of another. Then the first one changes. Which value does the copy keep?',
    gen: () => GEN.copy(),
    after: { q: 'After b = a, a changes. Why does b not change?', options: ['b got a copy of the value. It keeps that value until something stores in b.', 'b and a are the same box.', 'b always changes when a changes.'], why: 'b = a copies the value stored in a at that moment.' } },
  { id: 'change-c', group: 'Change a variable', title: 'Change Challenge', type: 'challenge', kind: 'run', mins: 8,
    intro: 'Longer programs with +, - and *. Run every line with no mistakes. Two clean programs in a row.',
    gen: () => GEN.mixed(2) },
  { id: 'predict-c', group: 'Change a variable', title: 'Predict, Then Run', type: 'challenge', kind: 'run', predictAll: true, mins: 8,
    intro: 'Predict what the program prints first. Then run it to check. Two clean programs in a row.',
    gen: () => GEN.mixed(1 + Math.floor(Math.random() * 2)) },

  { id: 'types-t', group: 'Data types', title: 'Three Data Types', type: 'tutorial', guided: true, kind: 'types', mins: 4,
    intro: 'Every value has a <b>data type</b>. Carry each card to <b>Integer</b>, <b>Real</b> or <b>String</b>. Look for quote marks first, then a decimal point.',
    gen: () => typeRound({ n: 6, level: 1 }),
    after: { q: 'Why is "12" a String, but 12 an Integer?', options: ['The quote marks. Inside quote marks Python stores the characters as text.', '"12" is a bigger number.', 'They are both Integers.'], why: 'Quote marks make a String, even when it holds digits.' } },
  { id: 'calc-t', group: 'Data types', title: 'Types of Answers', type: 'tutorial', kind: 'types', mins: 4,
    intro: 'Now the cards are calculations. Which data type is the answer?',
    gen: () => typeRound({ n: 6, level: 2 }),
    after: { q: 'What data type does 8 / 2 give?', options: ['A Real: 4.0. / always gives a Real.', 'An Integer: 4.', 'A String: "4".'], why: '/ always gives a Real, even when the answer is whole.' } },
  { id: 'types-c', group: 'Data types', title: 'Data Type Challenge', type: 'challenge', kind: 'types', mins: 6,
    intro: 'Values and calculations mixed. Sort every card with no mistakes. Two clean rounds in a row.',
    gen: () => typeRound({ n: 6, level: 1 + Math.floor(Math.random() * 2) }) },
  { id: 'plus-t', group: 'Data types', title: '5 + 5 or "5" + "5"?', type: 'tutorial', kind: 'run', mins: 5,
    intro: 'The same + sign, two data types. Run the program and predict what each + does.',
    gen: () => GEN.plus(),
    after: { q: 'Why can + give two different answers?', options: ['The data type decides: Integers add, Strings join.', '+ is random.', 'The second + is a mistake.'], why: 'Integers add. Strings join, with no space added.' } },

  { id: 'input-t', group: 'Input and output', title: 'The User Types It', type: 'tutorial', guided: true, kind: 'run', io: true, mins: 5,
    intro: '<b>input()</b> shows its question and waits. Press the KEYBOARD to see what the user types, then store it. <b>+</b> joins two Strings.',
    gen: () => GEN.input(),
    after: { q: 'Why store input() in a variable?', options: ['The variable keeps what the user typed, so later lines can use it.', 'input() needs a variable to show its question.', 'So the question is stored too.'], why: 'The variable stores only what the user typed. Later lines use it.' } },
  { id: 'int-t', group: 'Input and output', title: 'Turn a String into a Number', type: 'tutorial', kind: 'run', io: true, mins: 6,
    intro: 'input() always gives a String. Put it through <b>int()</b> to turn it into an Integer, then do the sum.',
    gen: () => GEN.int(),
    after: { q: 'Why does the program need int()?', options: ['input() always gives a String. int() turns it into an Integer, so it can be added.', 'int() makes the number bigger.', 'int() shows the question.'], why: 'A String cannot be added to a number. int() changes its data type.' } },
  { id: 'join-t', group: 'Input and output', title: 'Text and a Number', type: 'tutorial', kind: 'run', io: true, mins: 5,
    intro: '+ can only join a String to a String. Use <b>str()</b> to turn the number into a String first.',
    gen: () => GEN.join(),
    after: { q: 'Why does print("Age: " + str(age)) need str()?', options: ['+ can only join two Strings, so str() turns the number into a String first.', 'str() adds the space.', 'str() makes the number bigger.'], why: 'str(12) gives "12", so + can join it.' } },
  { id: 'error-t', group: 'Input and output', title: 'It Stops with an Error', type: 'tutorial', kind: 'run', io: true, mins: 5,
    intro: 'Run this program. Watch the data types on each side of +.',
    gen: () => GEN.error(),
    after: { q: 'How do you fix age + 1 when age came from input()?', options: ['Use int(): age = int(input("Age? ")).', 'Put quote marks round 1.', 'Use print twice.'], why: 'int() turns the String into an Integer, so + adds.' } },
  { id: 'io-c', group: 'Input and output', title: 'Input Challenge', type: 'challenge', kind: 'run', io: true, mins: 8,
    intro: 'Programs with input, int(), str() and +. Some stop with an error. Two clean programs in a row.',
    gen: () => GEN.io() },
  { id: 'pro-c', group: 'Input and output', title: 'Run Without Help', type: 'challenge', kind: 'run', io: true, noHelp: true, predictAll: true, need: 3, mins: 10,
    intro: 'Predict, then run, with no help. Three clean programs in a row.',
    gen: () => Math.random() < 0.5 ? GEN.io() : GEN.mixed(2) }
];
export { MISSIONS };
const SECTIONS = ['Store a value', 'Change a variable', 'Data types', 'Input and output'];
// Lesson mode: Year 7 2.1 Data Types and Variables, 2.2 Input and Output
const LESSONS = [
  { id: '2.1', title: '2.1: Data Types and Variables', missions: ['store-t', 'replace-t', 'store-c', 'change-t', 'change-c', 'types-t', 'types-c', 'plus-t'], ext: ['quote-t', 'copy-t', 'predict-c', 'calc-t'] },
  { id: '2.2', title: '2.2: Input and Output', missions: ['input-t', 'int-t', 'join-t', 'error-t', 'io-c', 'predict-c'], ext: ['pro-c', 'plus-t'] }
];
const minsOf = m => m.mins || 7;


// ================================================================ saving and results
const STORE = 'bc-varlab3d-v1:';
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
  const log = results('varlab3d', 'Variables Lab 3D');
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

  // ---------------------------------------------------------------- running a program, one line at a time
  // Each variable is a box (take a copy of its value; a new value put on it replaces the old one). Values written in
  // the code wait on the CODE pads. A line with + - * works on the WORK bench: copy both sides on, press RUN, carry
  // the answer from OUT. print: carry the value to the SCREEN. input(): press the KEYBOARD, the user's String appears.
  // int(), float() and str() are machines: put a value in, its new data type comes out.
  const KIND = {};
  const TROLE = { int: 'num', float: 'var', str: 'paren' };
  const ERR = 'It stops with an error';
  const valCube = (v, extra) => cube(show(v).replace(/ /g, ' '), Object.assign({ role: TROLE[v.t], val: v }, extra || {}));
  const ch = () => M.m.type === 'challenge';
  const line = () => R.p.prog[R.li];
  const lineNo = () => 'Line ' + (R.li + 1);
  const code = l => '<code>' + esc(lineText(l)) + '</code>';
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  // a wrong move: a mistake in a challenge (a new round), a slip in a tutorial (the arrow comes in)
  function bad(msg) { if (ch()) return { msg, mistake: true }; R.slipped = true; return { msg }; }
  function badNow(msg) { if (ch()) { mistake(msg); return; } R.slipped = true; toast(msg, 'bad'); explain('Not this time. ' + msg); drawAll(); }
  const topExpr = l => l.op === 'input' ? (l.fn ? { fn: l.fn, of: { kb: true } } : { kb: true }) : l.e;
  // the cube came from the right place for this part of the line
  function fromOk(e, from) {
    if (!from) return false;
    if (e.bin) return from.role === 'out';
    if (e.lit) return from.role === 'code';
    if (e.v) return from.role === 'var' && from.v === e.v;
    if (e.fn) return from.role === 'mach' && from.fn === e.fn;
    return from.role === 'kb';
  }
  const varsNow = () => R.li ? R.p.run.after[R.li - 1] || {} : {};
  function evalRef(r) {
    if (r.lit) return r.lit;
    if (r.v) return varsNow()[r.v];
    if (r.kb) return S(line().typed);
    const o = evalRef(r.of); return o ? convert(r.fn, o).v : undefined;
  }
  function fnRefs(e, out = []) { if (!e) return out; if (e.bin) { fnRefs(e.a, out); fnRefs(e.b, out); } else if (e.fn) { out.push(e); fnRefs(e.of, out); } return out; }
  function lits(e, out = []) { if (!e) return out; if (e.bin) { lits(e.a, out); lits(e.b, out); } else if (e.fn) lits(e.of, out); else if (e.lit) out.push(e.lit); return out; }
  // why a line works the way it does: shown after a wrong move
  function lineWhy(l) {
    const e = topExpr(l), t = lineNo() + ' is ' + code(l) + '. ';
    if (l.op === 'input') return t + 'input() gives what the user typed, as a String.' + (l.fn ? ' ' + l.fn + '() then turns it into ' + (l.fn === 'int' ? 'an Integer.' : 'a Real.') : '');
    if (e.bin) return t + 'Work out the right side first: put both sides on the WORK bench, press RUN, then carry the answer from OUT.';
    if (e.fn) return t + 'Put ' + refText(e.of) + ' through ' + e.fn + '() first.';
    if (e.lit) return t + (e.lit.t === 'str' && l.op === 'print' ? 'Quote marks mean the text itself: take it from the CODE pad.' : 'The value is written in the code: take it from the CODE pad.');
    return t + (l.op === 'print' ? 'print(' + e.v + ') shows the value stored in ' + e.v + ': take a copy from the ' + e.v + ' box.' : l.v + ' = ' + e.v + ' copies the value stored in ' + e.v + '.');
  }
  // A sign that keeps capital and small letters (Python cares about them; the lab's tape() writes in capitals)
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
  // ---- the signs: the line being run, and the screen
  function signs() {
    for (const g of [R.lineG, R.scrG]) if (g) { worldG.remove(g); g.material?.map?.dispose?.(); g.material?.dispose?.(); }
    const l = line();
    R.lineG = codeSign(l ? 'Line ' + (R.li + 1) + ':  ' + lineText(l) : 'The program has finished', 10, 1, 300, { bg: '#212529', ink: '#ffd43b', size: 0.05 });
    R.scrG = codeSign(R.screen.length ? R.screen[R.screen.length - 1] : ' ', 19, 2, 220, { bg: '#0b3d1f', ink: '#b2f2bb', size: 0.045 });
  }
  // a new line: the CODE pads show the values written in it, the bench shows its sign
  function setLine() {
    for (const s of [R.L, R.R, R.out, R.kbOut, R.opPad, ...R.code, ...Object.values(R.mach)]) { s.items.forEach(killItem); s.items = []; }
    const l = line();
    if (l) {
      const e = topExpr(l);
      lits(e).slice(0, R.code.length).forEach((v, i) => addItem(R.code[i], valCube(v)));
      if (e.bin) addItem(R.opPad, cube(e.bin === '*' ? '*' : e.bin, { role: 'op' }));
    }
    R.typed = false;
    signs();
  }
  function nextLine() {
    R.li++; setLine();
    if (R.li >= R.p.prog.length) finishRound('The program has finished.' + (R.p.run.printed.length ? ' print showed: <b>' + R.p.run.printed.map(esc).join('</b>, then <b>') + '</b>.' : ''));
  }
  // ---- putting a value where the line stores it (a variable) or shows it (the SCREEN)
  function destPut(s, it, from) {
    const l = line();
    if (!l) return { msg: 'The program has finished.' };
    if (!it.val) return { msg: 'Only values go here.' };
    if (s.role === 'screen' && l.op !== 'print') return bad(lineNo() + ' is ' + code(l) + '. It stores a value in ' + l.v + '. Only print shows on the SCREEN.');
    if (s.role === 'var' && l.op === 'print') return bad(lineNo() + ' is ' + code(l) + '. print shows a value on the SCREEN. It stores nothing.');
    if (s.role === 'var' && s.v !== l.v) return bad(lineNo() + ' is ' + code(l) + '. It stores in <b>' + l.v + '</b>, the variable on the left of =.');
    if (l.op === 'input' && !R.typed) return bad('Press the KEYBOARD first: input() waits for the user to type.');
    const want = R.p.run.vals[R.li];
    if (!want || !valEq(it.val, want) || !fromOk(topExpr(l), from)) return bad(lineWhy(l));
    return null;
  }
  function benchPut(side, s, it, from) {
    const l = line(), e = l && topExpr(l);
    if (!e || !e.bin) return bad((l ? lineNo() + ' is ' + code(l) + '. It' : 'The program') + ' has no sum. The WORK bench is for lines like coins = coins + 5.');
    if (!it.val) return { msg: 'Only values go here.' };
    if (s.items.length) return { msg: 'That side is full.' };
    if (R.out.items.length) return { msg: 'Take the answer from OUT first.' };
    const r = side === 'L' ? e.a : e.b, want = evalRef(r);
    if (!valEq(it.val, want) || !fromOk(r, from)) return bad('The ' + (side === 'L' ? 'left' : 'right') + ' side of ' + e.bin + ' is <b>' + esc(refText(r)) + '</b>' + (r.v ? ': take a copy from the ' + r.v + ' box.' : r.lit ? ': it is written in the code.' : r.fn ? ': put ' + esc(refText(r.of)) + ' through ' + r.fn + '() first.' : '.'));
    return null;
  }
  function machPut(s, it, from) {
    const l = line();
    if (!l) return { msg: 'The program has finished.' };
    if (!it.val) return { msg: 'Only values go here.' };
    if (s.items.length) return { msg: 'Take the last answer out of ' + s.fn + '() first.' };
    const r = fnRefs(topExpr(l)).find(x => x.fn === s.fn);
    if (!r) return bad(lineNo() + ' is ' + code(l) + '. It does not use ' + s.fn + '().');
    if (r.of.kb && !R.typed) return bad('Press the KEYBOARD first: input() waits for the user to type.');
    if (!valEq(it.val, evalRef(r.of)) || !fromOk(r.of, from)) return bad('Put <b>' + esc(refText(r.of)) + '</b> into ' + s.fn + '().');
    return null;
  }
  // RUN: work out the sum on the bench (predict it first, unless this is the first tutorial)
  function runBench() {
    if (R.ask) { toast('Answer on the right first.', 'hint'); return; }
    const l = line(), e = l && topExpr(l);
    if (!e || !e.bin) { badNow((l ? lineNo() + ' is ' + code(l) + '. It' : 'The program') + ' has no sum to work out.'); return; }
    if (R.out.items.length) { toast('Take the answer from OUT.', 'hint'); return; }
    if (!R.L.items.length || !R.R.items.length) { toast('Put both sides on the WORK bench first.', 'hint'); return; }
    const a = top(R.L).val, b = top(R.R).val, res = binop(e.bin, a, b), sum = show(a) + ' ' + e.bin + ' ' + show(b);
    const apply = () => {
      for (const s of [R.L, R.R]) { s.items.forEach(killItem); s.items = []; }
      if (res.err) {
        explain(sum + ': ' + res.err + ' The program stops.');
        finishRound('The program stops with an error at line ' + (R.li + 1) + ': ' + res.err + (a.t === 'str' && b.t !== 'str' && R.p.prog.some(x => x.op === 'input') ? ' input() always gives a String: int() would turn it into an Integer first.' : a.t === 'str' || b.t === 'str' ? ' str() would turn the number into a String first.' : ''));
        drawAll(); return;
      }
      addItem(R.out, valCube(res.v));
      explain(sum + ' gives <b>' + esc(show(res.v)) + '</b>. ' + (res.v.t === 'str' ? 'Strings join, with no space added.' : e.bin === '/' ? '/ always gives a Real.' : 'Numbers work out like in maths.') + ' Carry it from OUT.');
      drawAll();
    };
    if (M.m.guided) { apply(); return; }
    const right = res.err ? ERR : show(res.v), opts = [right];
    const add = o => { if (o && !opts.includes(o) && opts.length < 4) opts.push(o); };
    if (a.t === 'str' && b.t === 'str') { if (/^-?\d+$/.test(a.x) && /^-?\d+$/.test(b.x)) add(String(+a.x + +b.x)); add('"' + a.x + ' ' + b.x + '"'); add(ERR); }
    else if (a.t !== 'str' && b.t !== 'str') { add('"' + shown(a) + shown(b) + '"'); add(ERR); add(String(e.bin === '+' ? a.x - b.x : a.x + b.x)); }
    else { add('"' + shown(a) + shown(b) + '"'); add(String(+shown(a) + +shown(b)) === 'NaN' ? null : String(+shown(a) + +shown(b))); add('"' + shown(a) + ' ' + shown(b) + '"'); }
    R.ask = { type: 'choice', plain: true, q: 'RUN works out <b>' + esc(sum) + '</b>. What does it give?', options: opts, answer: right,
      hint: 'Look at the data type on each side first. Two numbers work out. Two Strings join. A String and a number stop the program.',
      why: sum + (res.err ? ': ' + res.err : ' gives ' + show(res.v) + '.'), done: apply };
  }
  function pressKeyboard() {
    if (R.ask) { toast('Answer on the right first.', 'hint'); return; }
    const l = line();
    if (!l || l.op !== 'input') { badNow((l ? lineNo() + ' is ' + code(l) + '. It' : 'The program') + ' does not use input(). The KEYBOARD is only for input().'); return; }
    if (R.typed) { toast('The user has typed it. Carry it on.', 'hint'); return; }
    R.typed = true; R.screen.push(l.prompt + l.typed); signs();
    addItem(R.kbOut, valCube(S(l.typed)));
    explain('input() shows <b>' + esc(l.prompt) + '</b> and waits. The user types <b>' + esc(l.typed) + '</b> and presses Enter. input() gives the String <b>"' + esc(l.typed) + '"</b>.');
    drawAll();
  }
  // the next move of the method (for the arrow): press something, or take a cube to a place
  function nextMove() {
    const l = line(); if (!l) return null;
    if (l.op === 'input' && !R.typed) return { press: R.kb };
    const dst = l.op === 'print' ? R.screen_ : R.box[l.v], e = topExpr(l);
    if (e.bin) {
      if (!R.out.items.length) {
        if (!R.L.items.length) return produce(e.a, R.L);
        if (!R.R.items.length) return produce(e.b, R.R);
        return { press: R.run };
      }
      return { take: R.out, to: dst };
    }
    return produce(e, dst);
  }
  function produce(r, to) {
    if (r.fn) { const ms = R.mach[r.fn]; return ms.items.length ? { take: ms, to } : produce(r.of, ms); }
    if (r.lit) return { take: R.code.find(s => s.items.length && valEq(top(s).val, r.lit)) || R.code[0], to };
    if (r.v) return { take: R.box[r.v], to };
    return { take: R.kbOut, to };
  }
  // the program, the variables and the screen, for the sheet (hl: the line being run)
  function progHtml(prog, at, vars, screen) {
    let h = '<div class="vl-prog">' + prog.map((l, i) => '<div class="vl-line' + (i === at ? ' now' : i < at ? ' done' : '') + '"><span class="vl-n">' + (i + 1) + '</span><code>' + esc(lineText(l)) + '</code></div>').join('') + '</div>';
    const names = [...new Set(prog.filter(l => l.v).map(l => l.v))];
    h += '<table class="vl-vars"><tr>' + names.map(n => '<th>' + n + '</th>').join('') + '</tr><tr>' + names.map(n => '<td>' + (vars[n] ? esc(show(vars[n])) : '') + '</td>').join('') + '</tr></table>';
    h += '<div class="vl-screen"><span class="vl-sh">SCREEN</span>' + (screen.length ? screen.map(s => '<div>' + esc(s) + '</div>').join('') : '<div class="vl-empty">empty</div>') + '</div>';
    return h;
  }
  function predictAllAsk(p) {
    const run = p.run, out = run.printed, err = run.err >= 0;
    const say = (lines, stops) => lines.length ? lines.join(', then ') + (stops ? ', then it stops with an error' : '') : stops ? ERR : 'nothing';
    const right = say(out, err), opts = [right], add = o => { if (o && !opts.includes(o) && opts.length < 4) opts.push(o); };
    if (err) {
      const l = p.prog[run.err], before = run.after[run.err - 1] || {}, val = r => r.v ? before[r.v] : r.lit;
      const a = val(l.e.a), b = val(l.e.b);
      if (a && b) { add(say(out.concat([shown(a) + shown(b)]))); if (!isNaN(+shown(a)) && !isNaN(+shown(b))) add(say(out.concat([String(+shown(a) + +shown(b))]))); add(say(out.concat([shown(a) + ' ' + shown(b)]))); }
    } else {
      const head = out.slice(0, -1), last = out[out.length - 1], alt = x => say(head.concat([x]));
      for (const v of shuffle(run.vals.filter(Boolean))) add(alt(shown(v)));
      const pl = p.prog.filter(l => l.op === 'print').pop();
      if (pl && pl.e.v) add(alt(pl.e.v));
      add(alt(last + last));
    }
    add(err ? say(out.slice(0, -1).concat(['0'])) : ERR);
    return { type: 'choice', plain: true, wide: true, q: 'Before you run it: what does print show?', options: opts, answer: right,
      hint: 'Follow the program one line at a time, from the top. Write down each variable as it changes.', why: 'print shows: ' + right + '.',
      done: () => explain('Now run it to check, one line at a time.') };
  }
  KIND.run = {
    start(m, p) { return 'Run the program one line at a time, from the top. Line 1 is ' + code(p.prog[0]) + '.'; },
    setup(R, m) {
      const p = R.p;
      newWorld(24, 13, 'Python');
      R.li = 0; R.screen = []; R.typed = false;
      const names = [...new Set(p.prog.filter(l => l.v).map(l => l.v))];
      R.box = {};
      names.forEach((n, i) => {
        const s = addSlot({ role: 'var', pad: 'answer', x: 3 + i * 3, y: 4, v: n,
          copyOut: () => s.items.length ? valCube(top(s).val) : n + ' has no value yet.', put: (it, from) => destPut(s, it, from) });
        R.box[n] = s; codeSign(n, 3 + i * 3, 4, 125, { bg: '#151515', ink: '#f4f4f0', size: 0.04 });
      });
      R.screen_ = addSlot({ role: 'screen', pad: 'target', x: 18, y: 4, w: 3, label: 'SCREEN', tag: { tagY: 120 }, put: (it, from) => destPut(R.screen_, it, from) });
      R.code = [0, 1].map(k => addSlot({ role: 'code', pad: 'supply', x: 3 + k * 2, y: 8, label: 'CODE', tag: { tagY: 120, tagSize: 0.032 }, put: () => ({ msg: 'The CODE pads give the values written in the line.' }) }));
      R.L = addSlot({ role: 'benchL', pad: 'pedestal', x: 11, y: 8, label: 'WORK', tag: { tagY: 120, tagSize: 0.032 }, put: (it, from) => benchPut('L', R.L, it, from) });
      R.opPad = addSlot({ role: 'op', pad: 'rail', x: 12, y: 8, take: () => 'This is the sign from the line.', put: () => ({ msg: 'Put a value on the left or the right.' }) });
      R.R = addSlot({ role: 'benchR', pad: 'pedestal', x: 13, y: 8, put: (it, from) => benchPut('R', R.R, it, from) });
      R.run = addSlot({ role: 'run', pad: 'answer', x: 12, y: 10, label: 'RUN', tag: { tagY: 110 }, press: () => runBench(), pressText: 'to work out the sum.' });
      R.out = addSlot({ role: 'out', pad: 'answer', x: 15, y: 8, label: 'OUT', tag: { tagY: 120, tagSize: 0.032 }, put: () => ({ msg: 'Answers come out here.' }) });
      R.mach = {};
      if (m.io) {
        R.kb = addSlot({ role: 'keyboard', pad: 'target', x: 3, y: 11, w: 2, label: 'KEYBOARD', tag: { tagY: 110 }, press: () => pressKeyboard(), pressText: 'to let the user type.' });
        R.kbOut = addSlot({ role: 'kb', pad: 'supply', x: 6, y: 11, label: 'TYPED', tag: { tagY: 110, tagSize: 0.032 }, put: () => ({ msg: 'Only what the user types goes here.' }) });
        ['int', 'float', 'str'].forEach((fn, i) => { const s = addSlot({ role: 'mach', pad: 'crate', x: 17 + i * 2, y: 10, fn, label: fn + '()', tag: { tagY: 110 }, put: (it, from) => machPut(s, it, from) }); R.mach[fn] = s; });
      } else { R.kbOut = { items: [] }; }
      R.ask = m.predictAll ? predictAllAsk(p) : null;
      setLine();
      pos.x = 11; pos.y = 6;
    },
    placed(it, slot) {
      const l = line();
      if (slot.role === 'var') {
        const old = slot.items.filter(x => x !== it); old.forEach(killItem); slot.items = [it];
        explain(lineNo() + ': ' + code(l) + '. ' + (old.length ? 'The old value ' + esc(show(old[0].val)) + ' is replaced: ' : '') + '<b>' + l.v + '</b> now stores <b>' + esc(show(it.val)) + '</b>.');
        nextLine();
      } else if (slot.role === 'screen') {
        killItem(it); slot.items = [];
        R.screen.push(shown(it.val));
        explain(lineNo() + ': ' + code(l) + '. print shows <b>' + esc(shown(it.val)) + '</b> on the screen' + (it.val.t === 'str' ? ', without the quote marks.' : '.'));
        nextLine();
      } else if (slot.role === 'benchL' || slot.role === 'benchR') {
        explain((slot.role === 'benchL' ? 'Left' : 'Right') + ' side: <b>' + esc(show(it.val)) + '</b>.' + (R.L.items.length && R.R.items.length ? ' Now press RUN.' : ''));
      } else if (slot.role === 'mach') {
        killItem(it); slot.items = [];
        const res = convert(slot.fn, it.val);
        addItem(slot, valCube(res.v));
        explain(slot.fn + '(' + esc(show(it.val)) + ') gives <b>' + esc(show(res.v)) + '</b>: ' + (res.v.t === 'int' ? 'an Integer' : res.v.t === 'float' ? 'a Real' : 'a String') + '.');
      }
    },
    check() { },
    guide(R, m) {
      if (R.ask) return null;
      const mv = nextMove(); if (!mv) return null;
      if (hand.item) return mv.take && mv.take.items.length && valEq(hand.item.val, top(mv.take).val) ? slotTarget(mv.to) : null;
      return slotTarget(mv.press || mv.take);
    },
    steps(R, m) {
      return R.p.prog.map((l, i) => {
        const e = topExpr(l);
        const how = l.op === 'input' ? 'Press the KEYBOARD, then carry what the user typed' + (l.fn ? ' through ' + l.fn + '()' : '') + ' to ' + l.v + '.'
          : e.bin ? 'Right side first: copy both sides onto the WORK bench, press RUN, then carry the answer to ' + (l.op === 'print' ? 'the SCREEN.' : l.v + '.')
          : e.fn ? 'Put ' + esc(refText(e.of)) + ' through ' + e.fn + '(), then carry it to ' + (l.op === 'print' ? 'the SCREEN.' : l.v + '.')
          : 'Carry ' + (e.lit ? 'the value from the CODE pad' : 'a copy of ' + e.v) + ' to ' + (l.op === 'print' ? 'the SCREEN.' : l.v + '.');
        return { text: 'Line ' + (i + 1) + ': ' + code(l) + (i === R.li ? ' ' + how : ''), done: () => R.li > i || R.over };
      });
    },
    goals(m) {
      if (m.noHelp) return [];
      const g = ['Run the lines in order, from the top.', '= means store: work out the right side, then store it in the variable on the left.', 'A variable holds one value. A new value replaces the old one.', 'print shows a value on the SCREEN. Quote marks mean the text itself.'];
      if (m.group === 'Data types' || m.io) g.push('+ adds numbers and joins Strings, with no space added.');
      if (m.io) g.push('input() always gives a String.', 'int() turns a String into an Integer. str() turns a number into a String.', 'A String and a number with + stop the program with an error.');
      return g;
    },
    expr(R) {
      const vars = {}; for (const [n, s] of Object.entries(R.box)) if (s.items.length) vars[n] = top(s).val;
      return progHtml(R.p.prog, R.li, vars, R.screen) + (hand.item && hand.item.val ? '<p><b>You are carrying:</b> <code>' + esc(show(hand.item.val)) + '</code></p>' : '');
    },
    walk(R, m) {
      let p, g = 0; do p = m.gen(); while (p.key === R.p.key && ++g < 30);
      const run = p.run, screen = [], steps = [{ text: '<b>A different program.</b> Run it one line at a time, from the top.', visual: progHtml(p.prog, 0, {}, []) }];
      for (let i = 0; i < p.prog.length; i++) {
        const l = p.prog[i];
        const before = i ? run.after[i - 1] : {}, e = topExpr(l), v = run.vals[i];
        let t;
        if (i === run.err) { const a = e.a.v ? before[e.a.v] : e.a.lit; t = 'Line ' + (i + 1) + ': ' + esc(exprText(e)) + ' has a String and a number: <span class="hl">it stops with an error</span>.' + (a && a.t === 'str' ? ' int() would fix it.' : ' str() would fix it.'); }
        else if (l.op === 'input') { screen.push(l.prompt + l.typed); t = 'Line ' + (i + 1) + ': input() shows the question. The user types ' + esc(l.typed) + '. ' + (l.fn ? l.fn + '() turns it into ' + esc(show(v)) + '. ' : 'It is the String ' + esc(show(v)) + '. ') + l.v + ' stores <span class="hl">' + esc(show(v)) + '</span>.'; }
        else {
          const work = e.bin ? 'Right side first: ' + esc(exprText(e)) + ' is ' + esc([e.a, e.b].map(r => r.v ? show(before[r.v]) : r.fn ? show(convert(r.fn, r.of.v ? before[r.of.v] : r.of.lit).v) : show(r.lit)).join(' ' + e.bin + ' ')) + ', which gives ' + esc(show(v)) + '. '
            : e.fn ? esc(refText(e)) + ' gives ' + esc(show(v)) + '. ' : e.v ? e.v + ' stores ' + esc(show(v)) + '. ' : '';
          if (l.op === 'print') { screen.push(shown(v)); t = 'Line ' + (i + 1) + ': ' + work + 'print shows <span class="hl">' + esc(shown(v)) + '</span>.'; }
          else t = 'Line ' + (i + 1) + ': ' + work + (before[l.v] ? 'The old value ' + esc(show(before[l.v])) + ' is replaced. ' : '') + l.v + ' stores <span class="hl">' + esc(show(v)) + '</span>.';
        }
        steps.push({ text: t, visual: progHtml(p.prog, i, run.after[i] || before, screen.slice()) });
        if (i === run.err) break;
      }
      steps.push({ text: 'Now run yours the same way.', visual: '' });
      return steps;
    }
  };

  // ---------------------------------------------------------------- Which data type?: carry each card to its type
  KIND.types = {
    start() { return 'Carry each card to its data type.'; },
    setup(R, m) {
      const cards = R.p.cards, W = Math.max(22, cards.length * 3 + 6);
      newWorld(W, 12, 'Data types');
      const mid = Math.floor(W / 2);
      const mk = (t, x, label) => { const s = addSlot({ role: 'pad', pad: 'answer', x, y: 4, grow: 'pile', t, label, tag: { tagY: 140 },
        take: () => 'This card is sorted.', put: (it, from) => from === s ? null : !it.card ? { msg: 'Only cards go here.' } : it.t === t ? null : { msg: it.text + ' is not ' + (t === 'int' ? 'an Integer' : t === 'float' ? 'a Real' : 'a String') + '. ' + typeWhy(it), mistake: true } }); return s; };
      R.pads = { int: mk('int', mid - 6, 'INTEGER  int'), float: mk('float', mid, 'REAL  float'), str: mk('str', mid + 6, 'STRING  str') };
      const x0 = Math.floor((W - (cards.length - 1) * 3) / 2);
      R.shelf = cards.map((c, i) => { const s = addSlot({ role: 'shelf', pad: 'supply', x: x0 + i * 3, y: 9, put: (it, from) => from === s ? null : s.items.length ? { msg: 'That spot is full.' } : null });
        addItem(s, { card: true, text: c.text, t: c.t, sym: c.text, role: 'card' }); return s; });
      R.placedN = 0; pos.x = mid; pos.y = 7;
    },
    placed(it, slot) { if (slot.role === 'pad') { R.placedN++; explain(it.text + ' is ' + (it.t === 'int' ? 'an <b>Integer</b>' : it.t === 'float' ? 'a <b>Real</b>' : 'a <b>String</b>') + '. ' + typeWhy(it)); } },
    check() { if (R.placedN === R.p.cards.length && !hand.item) finishRound('Every card is sorted.'); },
    guide(R) {
      if (hand.item) return null;   // never an arrow to the answer: the pupil decides the type
      const s = R.shelf.find(x => x.items.length); return s ? slotTarget(s) : null;
    },
    steps(R) { return R.p.cards.map(c => ({ text: 'Sort <b>' + esc(c.text) + '</b>.', done: () => Object.values(R.pads).some(s => s.items.some(x => x.text === c.text)) })); },
    goals() { return ['Quote marks first: they make a String, even round digits.', 'Then a decimal point or /: they make a Real.', 'A whole number with no quote marks is an Integer.']; },
    expr(R) { const c = hand.item && hand.item.card ? hand.item : null; return '<b>Cards sorted:</b> ' + R.placedN + ' of ' + R.p.cards.length + (c ? '<br><b>You are carrying:</b> <code>' + esc(c.text) + '</code>' : '<br>Walk up to a card to read it.'); },
    walk(R, m) {
      const p = typeRound({ n: 4, level: m.id === 'calc-t' ? 2 : 1 }), steps = [{ text: '<b>Different cards.</b> Look for quote marks first, then a decimal point or /.', visual: '' }];
      p.cards.forEach(c => steps.push({ text: '<code>' + esc(c.text) + '</code>: ' + typeWhy(c) + ' <span class="hl">' + TYPE_NAME[c.t] + '</span>.', visual: '' }));
      steps.push({ text: 'Now sort your own cards.', visual: '' });
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
    if (s.crate) { hand.item = cube(s.crate, { role: s.crateRole || 'paren', bit: s.crateRole ? s.crate : undefined }); itemMesh(hand.item); hand.from = s; hand.since = clock; afterChange(); return; }
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
    get M() { return M; }, get R() { return R; }, pos, hand, setHand, start, newRound, free, solidAt, handPos, grabTarget, guideTarget, missions: MISSIONS, model: { runProg, GEN, typeRound, lineText, show, shown, valEq }, nextMove,
    get slots() { return slots; }, get done() { return done; }, get arrows() { return arrows.count; }, get outlined() { return outlineG.children.length; }, get glowing() { return glowing; },
    toastText: () => $('toast').textContent, lessonMode, startLesson, nextMission, LESSONS, minsOf, KIND, frame: (n, ms = 33) => { for (let i = 0; i < n; i++) tick((last || performance.now()) + ms); }, nearestSlot
  };
  return { stop() { } };
}
