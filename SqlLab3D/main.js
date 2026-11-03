// SQL Lab 3D: Year 11 databases (Cambridge IGCSE 0478 section 9) in the lab of Network Builder 3D. A database table is
// printed on the floor. Pupils carry a FIELD and a RECORD cube onto it and count them, carry the KEY cube to the
// primary key, carry data type cubes to each field, carry record cards to OUTPUT (or a SUM or COUNT machine) for a
// query, and carry keyword, field, comparison and value cubes into the gaps of a query. Real exam wording throughout.
//
// The engine (controls, guide arrow, What just happened card, mission sheet, lesson mode, Walk me through it) is a fork
// of CpuLab3D/main.js; room.js, blob.js, devices.js, cubes.js and three.js are shared by import.
// Progress: 'bc-sql3d-v1:all:done' by mission id, best stars in ':all:stars', cloud-saved as app 'sqllab3d'.
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
// ================================================================ the database model (pure, so it can be tested)
// Single-table databases as in Cambridge IGCSE 0478 section 9: fields, records, a primary key, the six data types,
// and SQL with SELECT, FROM, WHERE, ORDER BY, SUM, COUNT, AND, OR. Wording follows the mark schemes, for example
// 0478/22 November 2024 Q11 (number of fields and records; Type is not a primary key because its data repeats; data
// types; the output of SELECT ... WHERE Mon <> T) and 0478/21 June 2024 Q9(b) (SELECT SUM (NumberInStock) FROM
// SoftDrinks WHERE Container = 'Can').
const TYPES = ['alphanumeric', 'character', 'Boolean', 'integer', 'real', 'date/time'];
const TYPE_WHY = {
  alphanumeric: 'letters, or letters and numbers together, so it is <b>alphanumeric</b>',
  character: 'one single letter or symbol, so it is <b>character</b>',
  Boolean: 'only TRUE or FALSE, so it is <b>Boolean</b>',
  integer: 'whole numbers, so it is <b>integer</b>',
  real: 'numbers with a decimal point, so it is <b>real</b>',
  'date/time': 'dates, so it is <b>date/time</b>'
};
const money = v => v.toFixed(2);
const pickN = (list, n) => shuffle(list).slice(0, n);
// each table: its name, what one record is about, the fields (name, data type), the primary key, and the records
const TABLE_MAKERS = [
  n => {   // hotel rooms, as 0478/22 November 2024 Q11
    const kinds = [['Single', 1, [72.5, 79.99]], ['Double', 2, [99.99, 120]], ['Twin', 2, [120, 125]], ['Family', 4, [150, 160]]];
    const nums = pickN([101, 102, 103, 104, 105, 106, 201, 202, 203, 204, 205, 301, 302, 303], n).sort((a, b) => a - b);
    const rows = nums.map(no => { const k = pick(kinds); return { RoomNo: no + k[0][0], Type: k[0], Guests: k[1], Rate$: money(pick(k[2])), SeaView: pick(['TRUE', 'FALSE']) }; });
    return { name: 'Rooms', noun: 'room', fields: [['RoomNo', 'alphanumeric'], ['Type', 'alphanumeric'], ['Guests', 'integer'], ['Rate$', 'real'], ['SeaView', 'Boolean']], key: 'RoomNo', rows };
  },
  n => {   // soft drinks, as 0478/21 June 2024 Q9
    const codes = pickN(['SD01', 'SD02', 'SD03', 'SD04', 'SD05', 'SD06', 'SD07', 'SD08', 'SD09'], n).sort();
    const rows = codes.map(c => ({ DrinkCode: c, Name: pick(['Cola', 'Lemonade', 'Orange', 'Cherry', 'Water']), Container: pick(['Can', 'Bottle', 'Carton']), Size: pick(['S', 'M', 'L']), NumberInStock: pick([0, 12, 24, 30, 36, 48]), Price$: money(pick([0.99, 1.25, 1.5, 2])) }));
    return { name: 'SoftDrinks', noun: 'drink', fields: [['DrinkCode', 'alphanumeric'], ['Name', 'alphanumeric'], ['Container', 'alphanumeric'], ['Size', 'character'], ['NumberInStock', 'integer'], ['Price$', 'real']], key: 'DrinkCode', rows };
  },
  n => {   // birds seen at a nature reserve
    const fam = { Swan: ['Mute swan', 'Black swan'], Duck: ['Mallard', 'Teal'], Gull: ['Herring gull', 'Common gull'], Owl: ['Barn owl', 'Tawny owl'] }, life = { Swan: [20, 25], Duck: [5, 8], Gull: [12, 15], Owl: [4, 10] };
    const ids = pickN(['B104', 'B117', 'B121', 'B130', 'B142', 'B155', 'B168', 'B176', 'B183'], n).sort();
    const rows = ids.map(id => { const f = pick(Object.keys(fam)); return { BirdID: id, Species: pick(fam[f]), Family: f, Lifespan: pick(life[f]), LastSeen: pick(['03/02/2025', '14/03/2025', '21/03/2025', '09/04/2025']), Rare: pick(['TRUE', 'FALSE']) }; });
    return { name: 'Birds', noun: 'bird', fields: [['BirdID', 'alphanumeric'], ['Species', 'alphanumeric'], ['Family', 'alphanumeric'], ['Lifespan', 'integer'], ['LastSeen', 'date/time'], ['Rare', 'Boolean']], key: 'BirdID', rows };
  },
  n => {   // a sports club: the primary key is a number this time
    const ids = pickN([1001, 1004, 1008, 1012, 1015, 1019, 1023, 1027, 1030], n).sort((a, b) => a - b);
    const rows = ids.map(id => ({ MemberID: id, Name: pick(['Ana', 'Ben', 'Chai', 'Dara', 'Emil']), Grade: pick(['A', 'B', 'C', 'D']), JoinDate: pick(['05/01/2024', '12/09/2024', '20/01/2025', '01/09/2025']), Fee$: money(pick([12.5, 15, 20])), Paid: pick(['TRUE', 'FALSE']) }));
    return { name: 'Members', noun: 'member', fields: [['MemberID', 'integer'], ['Name', 'alphanumeric'], ['Grade', 'character'], ['JoinDate', 'date/time'], ['Fee$', 'real'], ['Paid', 'Boolean']], key: 'MemberID', rows };
  }
];
// a table where only the primary key is different in every record (every other field repeats somewhere)
function makeTable(o = {}) {
  const n = o.n || 6;
  for (let t = 0; t < 500; t++) {
    const tb = (o.maker != null ? TABLE_MAKERS[o.maker] : pick(TABLE_MAKERS))(n);
    const ok = tb.fields.every(([f]) => { const vals = tb.rows.map(r => String(r[f])); return f === tb.key ? new Set(vals).size === n : new Set(vals).size < n; });
    if (ok) { tb.fields = tb.fields.map(([name, type]) => ({ name, type })); return tb; }
  }
  throw new Error('no table');
}
const isNum = t => t === 'integer' || t === 'real';
const typeOf = (tb, f) => tb.fields.find(x => x.name === f).type;
const OPS = ['=', '<>', '<', '>', '<=', '>='];
const OP_WORD = { '=': 'is', '<>': 'is not', '<': 'is less than', '>': 'is more than', '<=': 'is at most', '>=': 'is at least' };
const OP_SAY = { '=': 'equals', '<>': 'is not equal to', '<': 'is less than', '>': 'is greater than', '<=': 'is less than or equal to', '>=': 'is greater than or equal to' };
function test(tb, r, c) {
  const a = r[c.f], b = c.v, num = isNum(typeOf(tb, c.f)), x = num ? Number(a) : String(a), y = num ? Number(b) : String(b);
  return c.op === '=' ? x === y : c.op === '<>' ? x !== y : c.op === '<' ? x < y : c.op === '>' ? x > y : c.op === '<=' ? x <= y : x >= y;
}
const matches = (tb, q, r) => !q.where.length || (q.join === 'OR' ? q.where.some(c => test(tb, r, c)) : q.where.every(c => test(tb, r, c)));
function cmp(tb, f) { const num = isNum(typeOf(tb, f)); return (a, b) => num ? Number(a[f]) - Number(b[f]) : String(a[f]) < String(b[f]) ? -1 : String(a[f]) > String(b[f]) ? 1 : 0; }
// the records a query returns, in output order
function runQuery(tb, q) { let rows = tb.rows.filter(r => matches(tb, q, r)); if (q.order) rows = rows.slice().sort(cmp(tb, q.order)); return rows; }
function aggValue(tb, q) { const rows = runQuery(tb, q); return q.agg === 'COUNT' ? rows.length : Math.round(rows.reduce((s, r) => s + Number(r[q.aggField]), 0) * 100) / 100; }
const lit = (tb, c) => isNum(typeOf(tb, c.f)) || typeOf(tb, c.f) === 'Boolean' ? String(c.v) : "'" + c.v + "'";
const condText = (tb, c) => c.f + ' ' + c.op + ' ' + lit(tb, c);
// the SQL as lines, the way the exam prints it
function sqlLines(tb, q) {
  const out = [q.agg ? 'SELECT ' + q.agg + ' (' + q.aggField + ')' : 'SELECT ' + q.select.join(', '), 'FROM ' + tb.name];
  if (q.where.length) out.push('WHERE ' + q.where.map(c => condText(tb, c)).join(' ' + (q.join || 'AND') + ' '));
  if (q.order) out.push('ORDER BY ' + q.order);
  out[out.length - 1] += ';';
  return out;
}
// a condition that some records meet and some do not
function randomCond(tb, o = {}) {
  for (let t = 0; t < 200; t++) {
    const f = pick(tb.fields.filter(x => x.name !== tb.key && x.type !== 'date/time' && (!o.numOnly || isNum(x.type)) && (!o.no || x.name !== o.no))), vals = [...new Set(tb.rows.map(r => r[f.name]))];
    const op = isNum(f.type) ? pick(o.simple ? ['<', '>', '='] : OPS) : f.type === 'Boolean' ? '=' : pick(o.simple ? ['='] : ['=', '<>']);
    let v = pick(vals); if (isNum(f.type) && Math.random() < 0.4 && op !== '=' && op !== '<>') v = f.type === 'integer' ? Number(v) + pick([-1, 1]) : money(Number(v) + 0.5);
    const c = { f: f.name, op, v: String(v) }, n = tb.rows.filter(r => test(tb, r, c)).length;
    if (n >= 2 && n <= tb.rows.length - 2) return c;
  }
  return null;
}
// SELECT some fields FROM the table WHERE a condition (and maybe a second, and maybe ORDER BY)
function makeQuery(tb, o = {}) {
  for (let t = 0; t < 300; t++) {
    const c1 = randomCond(tb, o); if (!c1) continue;
    const q = { select: pickN(tb.fields.map(x => x.name), o.fields || 2).sort((a, b) => tb.fields.findIndex(x => x.name === a) - tb.fields.findIndex(x => x.name === b)), where: [c1] };
    if (o.two) { const c2 = randomCond(tb, { no: c1.f }); if (!c2) continue; q.where.push(c2); q.join = pick(['AND', 'OR']); }
    if (o.agg) { q.agg = o.agg; q.aggField = o.agg === 'SUM' ? pick(tb.fields.filter(x => isNum(x.type) && x.name !== tb.key)).name : pick(tb.fields).name; delete q.select; }
    const rows = runQuery(tb, q);
    if (rows.length < 2 || rows.length > tb.rows.length - 1) continue;
    if (o.order) {
      // an ORDER BY field whose values are all different in the output, so there is one right order
      const f = shuffle(tb.fields.filter(x => x.type !== 'Boolean' && x.type !== 'date/time' && new Set(rows.map(r => r[x.name])).size === rows.length).map(x => x.name)).find(f => runQuery(tb, Object.assign({}, q, { order: f })).map(r => r[tb.key]).join() !== rows.map(r => r[tb.key]).join());
      if (!f) continue; q.order = f;
    }
    return q;
  }
  return null;
}
// the task in words, for writing the SQL
function taskWords(tb, q) {
  const cond = q.where.map(c => c.f + ' ' + OP_WORD[c.op] + ' ' + c.v).join(q.join === 'OR' ? ' or ' : ' and ');
  if (q.agg === 'SUM') return 'Find the total ' + q.aggField + ' of every ' + tb.noun + ' where ' + cond + '.';
  if (q.agg === 'COUNT') return 'Count the ' + tb.noun + 's where ' + cond + '.';
  return 'Show the ' + q.select.join(' and ') + ' of every ' + tb.noun + ' where ' + cond + (q.order ? ', in order of ' + q.order + (isNum(typeOf(tb, q.order)) ? ' (smallest first)' : ' (A to Z)') : '') + '.';
}
// the SQL as tokens, with the ones the pupil fills in. keywords: blank the keywords too (challenge)
function sqlTokens(tb, q, keywords) {
  const T2 = [], add = (s, blank, role) => T2.push({ s, blank: !!blank, role });
  add('SELECT', keywords, 'kw');
  if (q.agg) { add(q.agg, keywords, 'kw'); add('(', false, 'sym'); add(q.aggField, true, 'field'); add(')', false, 'sym'); }
  else q.select.forEach((f, i) => { if (i) add(',', false, 'sym'); add(f, true, 'field'); });
  add('FROM', keywords, 'kw'); add(tb.name, true, 'table');
  q.where.forEach((c, i) => { add(i ? q.join : 'WHERE', keywords, 'kw'); add(c.f, true, 'field'); add(c.op, true, 'op'); add(lit(tb, c), true, 'value'); });
  if (q.order) { add('ORDER BY', keywords, 'kw'); add(q.order, true, 'field'); }
  add(';', false, 'sym');
  return T2;
}
// each kind of round, made from one table
function tableRound(o) { const tb = makeTable({ n: o.n || 6 }); return { tb, key: tb.name + tb.rows.map(r => r[tb.key]).join() }; }
function queryRound(o) {
  for (let t = 0; t < 50; t++) { const tb = makeTable({ n: o.n || 6 }), q = makeQuery(tb, o); if (q) return { tb, q, key: sqlLines(tb, q).join(' ') }; }
  throw new Error('no query');
}

// ================================================================ missions
const MISSIONS = [
  { id: 'fr-t', group: 'Fields and records', title: 'Fields and Records', type: 'tutorial', kind: 'db', task: 'fr', mins: 5,
    intro: 'A database table holds data about one kind of thing. A <b>field</b> is one kind of data (a column). A <b>record</b> is all the data about one thing (a row).',
    gen: () => tableRound({ n: 6 }) },
  { id: 'pk-t', group: 'Fields and records', title: 'The Primary Key', type: 'tutorial', kind: 'db', task: 'pk', mins: 6,
    intro: 'A <b>primary key</b> is a field where every record has a different value, so it identifies one record. Carry the KEY cube to it.',
    gen: () => tableRound({ n: 6 }),
    after: { q: 'Why is a field with repeated data not suitable as a primary key?', options: ['Its data repeats, so it cannot identify one record.', 'It holds text, and a primary key must be a number.', 'It is not the first field in the table.'], why: 'A primary key must be unique: different in every record.' } },
  { id: 'pk-c', group: 'Fields and records', title: 'Fields, Records and Keys', type: 'challenge', kind: 'db', task: 'pk', counts: true, mins: 8,
    intro: 'Count the fields and the records, then find the primary key. Two clean rounds in a row.',
    gen: () => tableRound({ n: rnd(5, 7) }) },
  { id: 'dt-t', group: 'Data types', title: 'Data Types', type: 'tutorial', kind: 'db', task: 'dt', mins: 7,
    intro: 'Each field has a data type. Look at the data in a field, then carry the right data type cube to it.',
    gen: () => tableRound({ n: 6 }),
    after: { q: 'A field holds 99.99, 120.00 and 72.50. Why is it real and not integer?', options: ['The numbers have a decimal point.', 'The numbers are more than 50.', 'The numbers are prices, and prices are always integer.'], why: 'Integer is whole numbers only. Real numbers have a decimal point.' } },
  { id: 'dt-c', group: 'Data types', title: 'Data Types Challenge', type: 'challenge', kind: 'db', task: 'dt', mins: 8,
    intro: 'Give every field its data type. Two clean rounds in a row.',
    gen: () => tableRound({ n: 6 }) },
  { id: 'out-t', group: 'SQL output', title: 'What Does This SQL Show?', type: 'tutorial', kind: 'db', task: 'out', mins: 8,
    intro: 'Check each record against WHERE, top to bottom. Carry each record where it is true to OUTPUT. The output shows only the fields after SELECT.',
    gen: () => queryRound({ simple: true }),
    after: { q: 'The output shows only some of the fields. Why?', options: ['SELECT lists the fields to show.', 'WHERE removes the other fields.', 'FROM chooses the fields.'], why: 'SELECT lists the fields to show. WHERE chooses the records.' } },
  { id: 'out-c', group: 'SQL output', title: 'Output Challenge', type: 'challenge', kind: 'db', task: 'out', mins: 10,
    intro: 'Say which fields the output shows, then carry the records it shows to OUTPUT in the right order, then press DONE. Two clean rounds in a row.',
    gen: () => queryRound(pick([{ fields: 2 }, { fields: 3, order: true }, { fields: 2, two: true }, { fields: 3 }])) },
  { id: 'agg-t', group: 'SQL output', title: 'SUM and COUNT', type: 'tutorial', kind: 'db', task: 'agg', mins: 7,
    intro: 'SUM adds up the values in a field. COUNT gives the number of records. Both use only the records where WHERE is true.',
    gen: () => queryRound({ agg: pick(['SUM', 'COUNT']), simple: true }),
    after: { q: 'Which keyword returns the number of records?', options: ['COUNT', 'SUM', 'ORDER BY'], why: 'COUNT returns the number of records. SUM adds up values.' } },
  { id: 'agg-c', group: 'SQL output', title: 'SUM and COUNT Challenge', type: 'challenge', kind: 'db', task: 'agg', mins: 8,
    intro: 'Put every record that meets the condition in the machine, press DONE, then give the answer. Two clean rounds in a row.',
    gen: () => queryRound({ agg: pick(['SUM', 'COUNT']), two: Math.random() < 0.4 }) },
  { id: 'sql-t', group: 'Write SQL', title: 'Complete the SQL', type: 'tutorial', kind: 'db', task: 'sql', mins: 8,
    intro: 'Read the task. Carry a cube into each gap to complete the SQL. Field names, the table name, a comparison and a value.',
    gen: () => queryRound({ simple: true }),
    after: { q: 'In WHERE Type = \'Twin\', why is Twin in quotes?', options: ['It is text.', 'It is a field name.', 'It is a number.'], why: 'Text values go in quotes. Numbers and TRUE or FALSE do not.' } },
  { id: 'sql-c', group: 'Write SQL', title: 'Write the SQL', type: 'challenge', kind: 'db', task: 'sql', keywords: true, mins: 10,
    intro: 'Now the keywords are gaps too: SELECT, FROM, WHERE, ORDER BY, SUM, COUNT, AND, OR. Two clean rounds in a row.',
    gen: () => queryRound(pick([{ fields: 2 }, { fields: 2, order: true }, { agg: 'SUM' }, { agg: 'COUNT' }, { fields: 2, two: true }])) }
];
export { MISSIONS };
const SECTIONS = ['Fields and records', 'Data types', 'SQL output', 'Write SQL'];
// Lesson mode: two Year 11 lessons on databases (0478 section 9)
const LESSONS = [
  { id: 'tables', title: 'Databases 1: Tables, Keys and Data Types', missions: ['fr-t', 'pk-t', 'pk-c', 'dt-t', 'dt-c'], ext: [] },
  { id: 'sql', title: 'Databases 2: SQL', missions: ['out-t', 'out-c', 'agg-t', 'agg-c', 'sql-t', 'sql-c'], ext: [] }
];
const minsOf = m => m.mins || 8;


// ================================================================ saving and results
const STORE = 'bc-sql3d-v1:';
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
  const log = results('sqllab3d', 'SQL Lab 3D');
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
    view.zoom?.(1600, 1.0);   // far enough back to read the whole table
    pos.face = Math.PI; view.jump(camX(), pos.y - camAhead());
    toast(''); explainReset();
    if (after) { explain('Not this time. ' + after + ' A new round has started.'); R.why = after; toast('A mistake, so a new round has started. ' + after, 'bad'); }
    explain(startLine(m, p)); $('mission').scrollTop = 0; afterChange();   // to the top first, so a question at the start can scroll into view
  }
  // look ahead of the player, so the table at the back is not under the card at the top
  const camAhead = () => Math.min(3.5, Math.max(0, pos.y - 7));
  const camX = () => { const w = R && R.p && R.p.tb ? TX + R.p.tb.fields.length * CW / 2 + 2 : 12; return w + (pos.x - w) * (M && M.m.task === 'sql' ? 0.7 : 0.3); };
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
    R.why = msg; toast(msg, 'bad'); explain('Not this time. ' + msg); drawAll();
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

  // ---------------------------------------------------------------- the database table on the floor
  // The table is printed on the floor: field names along the top, one record per row. Pads behind the field names take
  // the FIELD marker, the KEY cube and data type cubes; pads to the left of each row hold that record's card. On the
  // right: crates, the OUTPUT pad and DONE. For writing SQL, a row of pads in front holds the query, word by word.
  const KIND = {};
  const TX = 4, TY = 3, CW = 2, PX = 110;
  const KW_DOES = { SELECT: 'SELECT lists the fields to show', FROM: 'FROM names the table', WHERE: 'WHERE sets the condition', 'ORDER BY': 'ORDER BY sorts the results', SUM: 'SUM adds up the values in a field', COUNT: 'COUNT returns the number of records', AND: 'AND means both conditions must be true', OR: 'OR means at least one condition must be true' };
  const ROLE_OF_TOKEN = { kw: 'op', field: 'var', op: 'paren', value: 'num', table: 'result', sym: 'paren' };
  function tableMesh(tb, hl = {}) {
    const F = tb.fields.length, n = tb.rows.length, W = F * CW * PX, H = (n + 1) * PX;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    const fit = (text, max, px, weight = 700) => { let s = px; g.font = weight + ' ' + s + 'px "Segoe UI", Arial, sans-serif'; while (g.measureText(text).width > max && s > 14) { s -= 2; g.font = weight + ' ' + s + 'px "Segoe UI", Arial, sans-serif'; } };
    g.textAlign = 'center'; g.textBaseline = 'middle';
    tb.fields.forEach((f, i) => {
      g.fillStyle = hl.field === f.name ? '#e67700' : '#1864ab'; g.fillRect(i * CW * PX, 0, CW * PX, PX);
      g.fillStyle = '#fff'; fit(f.name, CW * PX - 16, 38, 800); g.fillText(f.name, (i + 0.5) * CW * PX, PX / 2);
    });
    tb.rows.forEach((r, k) => tb.fields.forEach((f, i) => {
      const key = k + ',' + f.name, rowCol = hl.good && hl.good.has(k) ? '#b2f2bb' : hl.bad && hl.bad.has(k) ? '#ffc9c9' : k % 2 ? '#e9ecef' : '#f8f9fa';
      g.fillStyle = hl.cells && hl.cells.has(key) ? '#ffe066' : rowCol; g.fillRect(i * CW * PX, (k + 1) * PX, CW * PX, PX);
      g.fillStyle = '#212529'; fit(String(r[f.name]), CW * PX - 14, 40); g.fillText(String(r[f.name]), (i + 0.5) * CW * PX, (k + 1.5) * PX);
    }));
    g.strokeStyle = '#495057'; g.lineWidth = 4;
    for (let i = 0; i <= F; i++) { g.beginPath(); g.moveTo(i * CW * PX, 0); g.lineTo(i * CW * PX, H); g.stroke(); }
    for (let k = 0; k <= n + 1; k++) { g.beginPath(); g.moveTo(0, k * PX); g.lineTo(W, k * PX); g.stroke(); }
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const m = new THREE.Mesh(new THREE.BoxGeometry(F * CW * T, 10, (n + 1) * T), [0, 1, 2, 3, 4, 5].map(i => i === 2 ? new THREE.MeshBasicMaterial({ map: tex }) : new THREE.MeshStandardMaterial({ color: 0x343a40 })));
    m.position.set((TX + F * CW / 2) * T, 5, (TY + (n + 1) / 2) * T); m.userData.own = true; m.userData.ownMat = true; m.receiveShadow = true;
    return m;
  }
  function drawTable() { if (R.tableG) { worldG.remove(R.tableG); R.tableG.geometry.dispose(); [].concat(R.tableG.material).forEach(x => { x.map?.dispose(); x.dispose(); }); } R.tableG = tableMesh(R.p.tb, R.hl); worldG.add(R.tableG); }
  const fieldIdx = f => R.p.tb.fields.findIndex(x => x.name === f);
  // a value in a field repeats: the first two records that share one
  function repeatOf(tb, f) { const seen = {}; for (let k = 0; k < tb.rows.length; k++) { const v = String(tb.rows[k][f]); if (v in seen) return { v, a: seen[v], b: k }; seen[v] = k; } return null; }
  function sampleVals(tb, f) { return [...new Set(tb.rows.map(r => String(r[f])))].slice(0, 3).join(', '); }
  // why a record does (or does not) meet the WHERE condition
  function condWhy(tb, q, r) {
    const parts = q.where.map(c => c.f + ' is ' + r[c.f] + ', so ' + condText(tb, c) + ' is ' + (test(tb, r, c) ? 'true' : 'false'));
    return parts.join('; ') + (q.where.length > 1 ? '. With ' + q.join + ', the record is ' + (matches(tb, q, r) ? 'in' : 'not in') + ' the output' : '');
  }
  const rowName = (tb, k) => 'Record ' + tb.rows[k][tb.key];
  function crateAt(sym, role, x, y, label) { const s = addSlot({ role: 'crate', pad: 'crate', x, y, crate: sym, crateRole: role, label: label || null, tag: { tagY: 120 } }); addItem(s, cube(sym, { role })); return s; }
  function setAsk(a) { R.ask = Object.assign({ plain: true }, a); }

  KIND.db = {
    start(m, p) {
      const t = m.task;
      return t === 'fr' ? 'This is the ' + p.tb.name + ' table. Each row is about one ' + p.tb.noun + '.' : t === 'pk' ? 'Find the field that is different in every record.' : t === 'dt' ? 'Look at the data in each field, then choose its data type.'
        : t === 'sql' ? 'Read the task, then fill each gap in the SQL.' : 'Read the SQL, then check each record against the WHERE condition.';
    },
    setup(R, m) {
      const p = R.p, tb = p.tb, F = tb.fields.length, n = tb.rows.length, t = m.task;
      R.hl = {}; R.out = []; R.slips = new Set(); R.typed = {}; R.stage = 0; R.k = 0;
      const x0 = TX + F * CW + 2;
      R.toks = t === 'sql' ? sqlTokens(tb, p.q, m.keywords) : null;
      const crateList = t === 'sql' ? sqlCrates(tb, p.q, m.keywords) : [];
      const W = Math.max(26, x0 + 6, crateList.length + 4, R.toks ? R.toks.length + 4 : 0);
      newWorld(W, 16, 'The database');
      drawTable(); blocks.push([TX, TY, TX + F * CW - 1, TY + n]);
      addSign('TABLE: ' + tb.name.toUpperCase(), TX + F * CW / 2, TY - 2, 300, { bg: '#1864ab', ink: '#ffffff', size: 0.045 });
      R.head = tb.fields.map((f, i) => addSlot({ role: 'head', pad: 'rail', x: TX + i * CW, y: TY - 1, w: CW, field: f.name, put: (it, from) => headPut(i, it, from) }));
      R.rec = tb.rows.map((r, k) => { const s = addSlot({ role: 'rec', pad: 'supply', x: TX - 2, y: TY + 1 + k, rec: k, put: (it, from) => from === s ? null : it.card && it.rec === k ? null : t === 'fr' && it.sym === 'RECORD' ? null : { msg: it.card ? 'Put a record back on its own row.' : 'Records go on the OUTPUT pad.' } }); return s; });
      if (t === 'fr') { R.crF = crateAt('FIELD', 'result', x0, 4, 'FIELD'); R.crR = crateAt('RECORD', 'result', x0, 7, 'RECORD'); }
      if (t === 'pk') { R.crK = crateAt('KEY', 'op', x0, 5, 'PRIMARY KEY'); if (m.counts) askCounts(() => { }); }
      if (t === 'dt') R.crT = TYPES.map((ty, i) => crateAt(ty, 'paren', x0 + (i % 2) * 2, 3 + Math.floor(i / 2) * 3));
      if (t === 'out' || t === 'agg') {
        tb.rows.forEach((r, k) => addItem(R.rec[k], { card: true, text: String(r[tb.key]), sym: String(r[tb.key]), rec: k, role: 'card' }));
        R.outPad = addSlot({ role: 'output', pad: 'out', x: x0, y: 5, w: 2, grow: 'pile', label: t === 'agg' ? p.q.agg + ' MACHINE' : 'OUTPUT', tag: { tagY: 140 },
          take: () => 'This record is in the ' + (t === 'agg' ? 'machine' : 'output') + ' now.', put: (it, from) => outPut(it, from) });
        R.done = addSlot({ role: 'done', pad: 'answer', x: x0, y: 9, label: 'DONE', press: () => pressDone(), pressText: 'to press DONE: every record that meets the condition is in.' });
        if (m.type === 'tutorial') checkNext();
        else if (t === 'out') { const all = tb.fields.map(f => f.name), sel = p.q.select, w = p.q.where[0].f; const o1 = sel.join(', '), o2 = all.join(', '), o3 = sel.includes(w) ? all.filter(f => !sel.includes(f)).slice(0, 2).join(', ') : sel.concat([w]).join(', ');
          setAsk({ type: 'choice', q: 'Which fields will the output show?', options: [o1, o2, o3], answer: o1, wide: true, hint: 'Look at the line that starts with SELECT.', why: KW_DOES.SELECT + ': ' + o1 + '.', done: () => explain('The output shows only ' + o1 + '. Now find the records.') }); }
      }
      if (t === 'sql') {
        R.blank = []; R.tokSlot = R.toks.map((k, i) => {
          const s = addSlot({ role: k.blank ? 'blank' : 'fixed', pad: k.blank ? 'target' : 'pedestal', x: 2 + i, y: 12, tok: i,
            take: () => k.blank ? null : 'This part is already right.', put: (it, from) => from === s ? null : k.blank ? blankPut(i, it, from) : { msg: 'This part is already right.' } });
          if (!k.blank) addItem(s, cube(k.s, { role: ROLE_OF_TOKEN[k.role] })); else R.blank.push(s);
          return s;
        });
        R.crates = crateList.map((c, i) => crateAt(c.s, ROLE_OF_TOKEN[c.role], 2 + i, 14));
      }
      pos.x = Math.min(W - 3, x0 + 1); pos.y = t === 'sql' ? 13 : 12;
    },
    placed(it, slot) {
      const tb = R.p.tb, m = M.m;
      if (slot.role === 'head') {
        const f = slot.field;
        if (it.sym === 'FIELD') { explain('<b>' + f + '</b> is a field: one kind of data, the same for every ' + tb.noun + ' (' + sampleVals(tb, f) + ').'); return; }
        if (it.sym === 'KEY') { explain('<b>' + f + '</b> is different in every record, so it can identify one ' + tb.noun + '. It is the primary key.'); R.keyed = true; return; }
        R.typed[f] = it.sym; explain('<b>' + f + '</b> holds ' + sampleVals(tb, f) + ': ' + TYPE_WHY[it.sym] + '.'); return;
      }
      if (slot.role === 'rec' && it.sym === 'RECORD') { explain('This row is a record: all the data about one ' + tb.noun + ' (' + tb.rows[slot.rec][tb.key] + '). The row of field names at the top is not a record.'); askCounts(() => finishRound('You counted the fields and the records.')); return; }
      if (slot.role === 'output') {
        R.out.push(it.rec);
        R.hl.good = new Set(R.out); drawTable();
        const r = tb.rows[it.rec];
        explain(rowName(tb, it.rec) + ': ' + condWhy(tb, R.p.q, r) + '.' + (m.task === 'out' ? ' The output shows its ' + R.p.q.select.join(' and ') + ': ' + R.p.q.select.map(f => r[f]).join(', ') + '.' : ''));
        if (m.type === 'tutorial') { R.k++; checkNext(); }
        return;
      }
      if (slot.role === 'blank') {
        const k = R.toks[slot.tok];
        explain(k.role === 'kw' ? KW_DOES[it.sym] + '.' : k.role === 'field' ? '<b>' + it.sym + '</b> is a field in the table.' : k.role === 'table' ? 'FROM ' + it.sym + ': the table is called ' + it.sym + '.' : k.role === 'op' ? it.sym + ' means ' + OP_SAY[it.sym] + '.' : 'The value is ' + it.sym + (it.sym.startsWith("'") ? ': text goes in quotes.' : '.'));
      }
    },
    check() {
      if (hand.item || R.ask) return;
      const t = M.m.task;
      if (t === 'pk' && R.keyed) finishRound('You found the primary key.');
      if (t === 'dt' && R.head.every(s => s.items.length)) finishRound('Every field has the right data type.');
      if (t === 'sql' && R.blank.every(s => s.items.length)) { explain('The SQL is complete: ' + sqlLines(R.p.tb, R.p.q).join(' ')); finishRound('Your SQL does the task.'); }
    },
    guide(R, m) {
      if (R.ask) return null;
      const t = m.task, tb = R.p.tb;
      if (t === 'fr') {
        if (hand.item) return hand.item.sym === 'FIELD' ? areaTarget(R.head) : areaTarget(R.rec);
        return R.head.some(s => s.items.length) ? slotTarget(R.crR) : slotTarget(R.crF);
      }
      if (t === 'pk') return hand.item ? (m.type === 'tutorial' && R.slips.size ? slotTarget(R.head[fieldIdx(tb.key)]) : areaTarget(R.head)) : slotTarget(R.crK);
      if (t === 'dt') {
        const next = R.head.find(s => !s.items.length); if (!next) return null;
        const want = tb.fields[fieldIdx(next.field)].type, helped = m.type === 'tutorial' && R.slips.has(next.field);
        if (hand.item) return helped && hand.item.sym === want ? slotTarget(next) : areaTarget(R.head.filter(s => !s.items.length));
        return helped ? slotTarget(R.crT[TYPES.indexOf(want)]) : areaTarget(R.crT);
      }
      if (t === 'out' || t === 'agg') {
        const exp = expected();
        if (m.type === 'tutorial') { if (hand.item) return slotTarget(R.outPad); if (R.k >= tb.rows.length) return slotTarget(R.done); const k = R.rows[R.k]; return k != null && R.ok ? slotTarget(R.rec[k]) : null; }
        if (hand.item) return slotTarget(R.outPad);
        return exp.length > R.out.length ? areaTarget(R.rec.filter(s => s.items.length)) : slotTarget(R.done);
      }
      if (t === 'sql') {
        const next = R.blank.find(s => !s.items.length); if (!next) return null;
        const helped = m.type === 'tutorial' && R.slips.has(next.tok);
        if (hand.item) return slotTarget(next);
        return helped ? slotTarget(R.crates.find(c => wantFor(next.tok).includes(c.crate))) : areaTarget(R.crates);
      }
      return null;
    },
    steps(R, m) {
      const t = m.task, tb = R.p.tb;
      if (t === 'fr') return [
        { text: 'Carry the <b>FIELD</b> cube to any field name (the pads behind the table).', done: () => R.head.some(s => s.items.length) },
        { text: 'Carry the <b>RECORD</b> cube to any row (the pads on the left).', done: () => R.rec.some(s => s.items.length) },
        { text: 'Count the fields and the records.', done: () => R.over }];
      if (t === 'pk') return [{ text: 'Look down each field. Does any value appear twice?', done: () => R.keyed || R.slips.size > 0 }, { text: 'Carry the <b>KEY</b> cube to the field where every value is different.', done: () => R.keyed }];
      if (t === 'dt') return tb.fields.map(f => ({ text: '<b>' + f.name + '</b> holds ' + sampleVals(tb, f.name) + '. Carry its data type to it.', done: () => !!R.typed[f.name] }));
      if (t === 'sql') return R.toks.map((k, i) => k.blank ? { text: (k.role === 'field' ? 'A field the task names' : k.role === 'table' ? 'The table name (after FROM)' : k.role === 'op' ? 'The comparison: =, <>, <, >, <= or >=' : k.role === 'value' ? 'The value to compare with' : 'A keyword') + '.', done: () => R.tokSlot[i].items.length > 0 } : null).filter(Boolean);
      const out = tb.rows.map((r, k) => ({ text: 'Record ' + r[tb.key] + ': is the WHERE condition true?', done: () => R.k > k }));
      out.push({ text: 'Press <b>DONE</b>.' + (t === 'agg' ? ' Then work out the ' + R.p.q.agg + '.' : ''), done: () => R.over });
      return out;
    },
    goals(m) {
      const t = m.task;
      return t === 'pk' ? ['A primary key is a field that is different in every record, so it identifies one record.', 'Fields: the field names. Records: the rows below them.']
        : t === 'dt' ? ['alphanumeric: letters, or letters and numbers', 'character: one letter or symbol', 'Boolean: TRUE or FALSE', 'integer: whole numbers', 'real: numbers with a decimal point', 'date/time: dates']
        : t === 'sql' ? Object.values(KW_DOES).map(x => x + '.') : ['WHERE: keep only the records where the condition is true.', 'SELECT: show only those fields.', 'ORDER BY: numbers smallest first, text A to Z. No ORDER BY: keep the order of the table.'];
    },
    expr(R, m) {
      const tb = R.p.tb, t = m.task, hlRow = new Set(R.out);
      let h = '<div class="sq-wrap"><table class="sq-t"><tr>' + tb.fields.map(f => '<th>' + f.name + (R.typed[f.name] ? '<br><small>' + R.typed[f.name] + '</small>' : '') + '</th>').join('') + '</tr>' +
        tb.rows.map((r, k) => '<tr class="' + (hlRow.has(k) ? 'good' : '') + (R.hl.bad && R.hl.bad.has(k) ? ' bad' : '') + '">' + tb.fields.map(f => '<td' + (R.hl.cells && R.hl.cells.has(k + ',' + f.name) ? ' class="hl"' : '') + '>' + r[f.name] + '</td>').join('') + '</tr>').join('') + '</table></div>';
      if (R.p.q && t !== 'sql') h += '<b>The SQL</b><pre class="sq-code">' + sqlLines(tb, R.p.q).join('\n') + '</pre>';
      if (t === 'out' && R.out.length) h += '<b>Output so far</b><table class="sq-t out"><tr>' + R.p.q.select.map(f => '<th>' + f + '</th>').join('') + '</tr>' + R.out.map(k => '<tr>' + R.p.q.select.map(f => '<td>' + tb.rows[k][f] + '</td>').join('') + '</tr>').join('') + '</table>';
      if (t === 'agg' && R.out.length) h += '<b>In the ' + R.p.q.agg + ' machine:</b> ' + R.out.map(k => tb.rows[k][tb.key] + (R.p.q.agg === 'SUM' ? ' (' + tb.rows[k][R.p.q.aggField] + ')' : '')).join(', ');
      if (t === 'sql') h += '<b>The task</b><p class="sq-task">' + taskWords(tb, R.p.q) + '</p><b>Your SQL</b><pre class="sq-code">' + R.toks.map((k, i) => R.tokSlot[i].items.length ? top(R.tokSlot[i]).sym : '____').join(' ').replace(/ ,/g, ',').replace(/ ;/g, ';').replace(/\( /g, '(').replace(/ \)/g, ')') + '</pre>';
      return h;
    },
    walk(R, m) {
      const t = m.task, steps = [];
      if (t === 'fr' || t === 'pk' || t === 'dt') {
        const tb = makeTable({ n: 5 }), tbl = tableHtml(tb);
        steps.push({ text: '<b>A different table: ' + tb.name + '.</b>', visual: tbl });
        if (t === 'fr') { steps.push({ text: 'Fields: count the field names along the top. <span class="hl">' + tb.fields.length + ' fields</span>.', visual: tbl }); steps.push({ text: 'Records: count the rows of data under the field names. <span class="hl">' + tb.rows.length + ' records</span>. The row of field names is not a record.', visual: tbl }); }
        if (t === 'pk') { for (const f of tb.fields) { const rep = repeatOf(tb, f.name); steps.push({ text: '<b>' + f.name + '</b>: ' + (rep ? rep.v + ' appears twice, so it is not a primary key.' : 'every value is different, so it is <span class="hl">the primary key</span>.'), visual: '' }); } }
        if (t === 'dt') for (const f of tb.fields) steps.push({ text: '<b>' + f.name + '</b> holds ' + sampleVals(tb, f.name) + ': ' + TYPE_WHY[f.type].replace(/<b>|<\/b>/g, '') + '.', visual: '' });
      } else if (t === 'sql') {
        const p = queryRound({ order: m.keywords && Math.random() < 0.5 }), toks = sqlTokens(p.tb, p.q, true);
        steps.push({ text: '<b>A different task.</b> ' + taskWords(p.tb, p.q), visual: tableHtml(p.tb) });
        steps.push({ text: 'Start with SELECT and the fields the task wants to see' + (p.q.agg ? ' (' + p.q.agg + ' and the field in brackets)' : '') + '.', visual: '<pre class="sq-code">' + sqlLines(p.tb, p.q)[0] + '</pre>' });
        steps.push({ text: 'FROM and the table name.', visual: '<pre class="sq-code">' + sqlLines(p.tb, p.q).slice(0, 2).join('\n') + '</pre>' });
        steps.push({ text: 'WHERE and the condition: a field, a comparison, a value. Text goes in quotes.', visual: '<pre class="sq-code">' + sqlLines(p.tb, p.q).slice(0, 3).join('\n') + '</pre>' });
        if (p.q.order) steps.push({ text: 'ORDER BY the field to sort by.', visual: '<pre class="sq-code">' + sqlLines(p.tb, p.q).join('\n') + '</pre>' });
        steps.push({ text: 'End with a semicolon. Now fill your own gaps.', visual: '<pre class="sq-code">' + sqlLines(p.tb, p.q).join('\n') + '</pre>' });
        void toks;
      } else {
        const p = queryRound({ agg: t === 'agg' ? pick(['SUM', 'COUNT']) : null, n: 5 }), tb = p.tb, q = p.q;
        steps.push({ text: '<b>A different table and SQL.</b>', visual: tableHtml(tb) + '<pre class="sq-code">' + sqlLines(tb, q).join('\n') + '</pre>' });
        tb.rows.forEach((r, k) => steps.push({ text: rowName(tb, k) + ': ' + condWhy(tb, q, r) + '. ' + (matches(tb, q, r) ? '<span class="hl">It is in.</span>' : 'It is not in.'), visual: '' }));
        if (q.agg) steps.push({ text: q.agg === 'COUNT' ? 'COUNT: ' + runQuery(tb, q).length + ' records are in, so the answer is <span class="hl">' + aggValue(tb, q) + '</span>.' : 'SUM: add up ' + q.aggField + ' for those records: ' + runQuery(tb, q).map(r => r[q.aggField]).join(' + ') + ' = <span class="hl">' + aggValue(tb, q) + '</span>.', visual: '' });
        else steps.push({ text: 'Write only the SELECT fields (' + q.select.join(', ') + ') of those records' + (q.order ? ', sorted by ' + q.order + (isNum(typeOf(tb, q.order)) ? ', smallest first' : ', A to Z') : ', in the order of the table') + '.', visual: '<table class="sq-t out"><tr>' + q.select.map(f => '<th>' + f + '</th>').join('') + '</tr>' + runQuery(tb, q).map(r => '<tr>' + q.select.map(f => '<td>' + r[f] + '</td>').join('') + '</tr>').join('') + '</table>' });
      }
      steps.push({ text: 'Now do yours the same way.', visual: '' });
      return steps;
    }
  };
  function tableHtml(tb) { return '<table class="sq-t"><tr>' + tb.fields.map(f => '<th>' + f.name + '</th>').join('') + '</tr>' + tb.rows.map(r => '<tr>' + tb.fields.map(f => '<td>' + r[f.name] + '</td>').join('') + '</tr>').join('') + '</table>'; }
  function askCounts(then) {
    const tb = R.p.tb;
    setAsk({ type: 'num', q: 'How many <b>fields</b> are in this table?', answer: tb.fields.length, hint: 'Count the field names along the top.', why: tb.fields.length + ' field names, so ' + tb.fields.length + ' fields.',
      done: () => { explain('There are ' + tb.fields.length + ' fields.'); setAsk({ type: 'num', q: 'How many <b>records</b> are in this table?', answer: tb.rows.length, hint: 'Count the rows of data. The row of field names is not a record.', why: tb.rows.length + ' rows of data, so ' + tb.rows.length + ' records.', done: () => { explain('There are ' + tb.rows.length + ' records.'); then(); } }); } });
  }
  function headPut(i, it, from) {
    const tb = R.p.tb, m = M.m, f = tb.fields[i], s = R.head[i];
    if (from === s) return null;
    if (s.items.length) return { msg: 'That field already has a cube on it.' };
    if (it.sym === 'RECORD') return { msg: 'A record is a row. Put RECORD on a pad to the left of a row.' };
    if (it.sym === 'FIELD') return null;
    if (it.sym === 'KEY') {
      if (f.name === tb.key) return null;
      const rep = repeatOf(tb, f.name);
      R.hl = { cells: new Set([rep.a + ',' + f.name, rep.b + ',' + f.name]) }; drawTable(); R.slips.add(f.name);
      return { msg: '<b>' + f.name + '</b> cannot be the primary key: ' + rep.v + ' is in two records. A primary key must be different in every record.', mistake: m.type === 'challenge' };
    }
    if (TYPES.includes(it.sym)) {
      if (it.sym === f.type) return null;
      R.slips.add(f.name);
      return { msg: '<b>' + f.name + '</b> holds ' + sampleVals(tb, f.name) + ': ' + TYPE_WHY[f.type] + ', not ' + it.sym + '.', mistake: m.type === 'challenge' };
    }
    return { msg: 'That does not go on a field name.' };
  }
  // the records that should end up in the output, in order
  const expected = () => runQuery(R.p.tb, R.p.q).map(r => R.p.tb.rows.indexOf(r));
  // tutorials: one record at a time, top to bottom: is the condition true for it?
  function checkNext() {
    const tb = R.p.tb, q = R.p.q; R.rows = tb.rows.map((_, k) => k); R.ok = false;
    while (R.k < tb.rows.length) {
      const k = R.k, r = tb.rows[k], yes = matches(tb, q, r);
      setAsk({ type: 'choice', q: rowName(tb, k) + ': ' + q.where.map(c => c.f + ' is ' + r[c.f]).join(', ') + '. Is the condition <b>' + q.where.map(c => condText(tb, c)).join(' ' + (q.join || '') + ' ') + '</b> true?', options: ['True', 'False'], answer: yes ? 'True' : 'False',
        hint: q.where.length > 1 ? (q.join === 'AND' ? 'AND: both parts must be true.' : 'OR: one part true is enough.') : 'Compare ' + r[q.where[0].f] + ' with ' + q.where[0].v + '.', why: condWhy(tb, q, r) + '.',
        done: () => { if (yes) { R.ok = true; explain(condWhy(tb, q, r) + '. Carry ' + rowName(tb, k) + ' to the ' + (M.m.task === 'agg' ? q.agg + ' machine' : 'OUTPUT') + '.'); } else { R.hl.bad = (R.hl.bad || new Set()).add(k); drawTable(); explain(condWhy(tb, q, r) + '. It is not in.'); R.k++; checkNext(); } } });
      return;
    }
    R.ask = null;
  }
  function outPut(it, from) {
    const tb = R.p.tb, m = M.m, q = R.p.q;
    if (!it.card) return { msg: 'Only record cards go here.' };
    const r = tb.rows[it.rec];
    if (m.type === 'tutorial' && it.rec !== R.k) return { msg: 'Check the records in order. Next is ' + rowName(tb, R.k) + '.' };
    if (!matches(tb, q, r)) { R.hl.bad = new Set([it.rec]); drawTable(); return { msg: rowName(tb, it.rec) + ': ' + condWhy(tb, q, r) + '. It is not in the output.', mistake: m.type === 'challenge' }; }
    if (m.task === 'out') {
      const next = expected().find(k => !R.out.includes(k));
      if (next !== it.rec) return { msg: 'Not yet: ' + rowName(tb, next) + ' comes first. ' + (q.order ? 'ORDER BY ' + q.order + ' puts ' + (isNum(typeOf(tb, q.order)) ? 'the smallest first.' : 'them in A to Z order.') : 'With no ORDER BY, the output keeps the order of the table.'), mistake: m.type === 'challenge' };
    }
    return null;
  }
  function pressDone() {
    const tb = R.p.tb, q = R.p.q, m = M.m, left = expected().filter(k => !R.out.includes(k));
    if (m.type === 'tutorial' && R.k < tb.rows.length) { toast('Check every record first.', 'hint'); return; }
    if (left.length) { mistake('Not finished: ' + rowName(tb, left[0]) + ' also meets the condition. ' + condWhy(tb, q, tb.rows[left[0]]) + '.'); return; }
    if (m.task === 'out') { explain('That is the whole output: ' + R.out.length + ' records, showing ' + q.select.join(' and ') + '.'); finishRound('Your output is right.'); return; }
    const v = aggValue(tb, q);
    setAsk({ type: 'num', q: q.agg === 'COUNT' ? 'What number does COUNT give?' : 'What number does SUM (' + q.aggField + ') give?', answer: v,
      hint: q.agg === 'COUNT' ? 'COUNT is the number of records in the machine.' : 'Add up ' + q.aggField + ' for the records in the machine.', why: q.agg === 'COUNT' ? R.out.length + ' records, so ' + v + '.' : R.out.map(k => tb.rows[k][q.aggField]).join(' + ') + ' = ' + v + '.',
      done: () => { explain(q.agg + ' gives ' + v + '.'); finishRound(q.agg + ' gives ' + v + '.'); } });
    drawAll();
  }
  // writing SQL: the cubes each gap takes, and the crates (the right cubes and some that do not belong)
  function wantFor(i) {
    const k = R.toks[i];
    if (k.role === 'field' && !R.p.q.agg && R.toks.slice(0, R.toks.findIndex(x => x.s === 'FROM')).includes(k)) {
      const used = R.tokSlot.filter((s, j) => j !== i && R.toks[j].role === 'field' && j < R.toks.findIndex(x => x.s === 'FROM') && s.items.length).map(s => top(s).sym);
      return R.p.q.select.filter(f => !used.includes(f));
    }
    return [k.s];
  }
  function sqlCrates(tb, q, keywords) {
    const list = [], add = (s, role) => { if (!list.some(c => c.s === s)) list.push({ s, role }); };
    if (keywords) ['SELECT', 'FROM', 'WHERE', 'ORDER BY', 'SUM', 'COUNT', 'AND', 'OR'].forEach(k => add(k, 'kw'));
    tb.fields.forEach(f => add(f.name, 'field'));
    add(tb.name, 'table'); add(pick(['Orders', 'Staff', 'Stock'].filter(x => x !== tb.name)), 'table');
    OPS.forEach(o => add(o, 'op'));
    for (const c of q.where) { add(lit(tb, c), 'value'); for (const v of shuffle([...new Set(tb.rows.map(r => String(r[c.f])))]).filter(v => v !== c.v).slice(0, 2)) add(lit(tb, { f: c.f, v }), 'value'); }
    return list;
  }
  function blankPut(i, it, from) {
    const k = R.toks[i], m = M.m, s = R.tokSlot[i];
    if (s.items.length) return { msg: 'That gap is full.' };
    if (wantFor(i).includes(it.sym)) return null;
    R.slips.add(i);
    const tb = R.p.tb, why = k.role === 'kw' ? 'This gap needs ' + k.s + ': ' + KW_DOES[k.s] + '.' : k.role === 'table' ? 'The table is called ' + tb.name + '.' : k.role === 'op' ? 'The task says "' + OP_WORD[k.s] + '": that is ' + k.s + '.' : k.role === 'value' ? 'The task asks for ' + k.s + '.' + (k.s.startsWith("'") ? ' Text goes in quotes.' : '') : 'The task asks for ' + wantFor(i).join(' or ') + ' here.';
    return { msg: 'Not ' + it.sym + '. ' + why, mistake: m.type === 'challenge' };
  }

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
    if (s.crate) { hand.item = cube(s.crate, { role: s.crateRole || 'paren' }); itemMesh(hand.item); hand.from = s; hand.since = clock; afterChange(); return; }
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
  // an arrow to the nearest of several pads, with no ring: you choose which one
  function areaTarget(list) { if (!list.length) return null; const near = list.slice().sort((a, b) => rectDist(a, pos.x, pos.y) - rectDist(b, pos.x, pos.y))[0]; const t = slotTarget(near); t.exact = false; return t; }
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
    if (!g || Math.hypot(g.x - pos.x, g.y - pos.y) < g.reach + 0.2) { arrows.visible = false; arrows.count = 0; guideKey = ''; return; }
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
      t.appendChild(el('ul', { class: 'goals' }, K.goals(m).map(g => '<li>' + g + '</li>').join('')));
      t.appendChild(el('p', { class: 'note' }, 'The arrow shows where to go, not what to do: you decide each move. <b>' + M.have + ' of ' + (m.need || NEED) + ' clean ' + ((m.need || NEED) === 1 ? 'run' : 'rounds in a row') + '.</b>'));
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
    box.appendChild(el('p', { class: 'ask-q' }, (a.plain ? '' : '<b>Predict.</b> ') + a.q));
    const fb = el('p', { class: 'ask-fb' + (a.fb ? ' bad' : '') }, a.fb || '');
    let read;
    const row = el('div', { class: 'ask-row' });
    if (a.type === 'num') {
      const inp = el('input', { type: 'text', inputmode: 'numeric', id: 'clAsk', 'aria-label': 'Your answer', autocomplete: 'off' });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
      row.appendChild(inp); read = () => { const v = inp.value.trim().replace(/−/g, '-'); return /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : null; };
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
      if (v == null) { fb.className = 'ask-fb bad'; fb.textContent = a.type === 'num' ? 'Type a number.' : 'Switch every lamp on or off first.'; return; }
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
    else if (s && s.copyOut) { h = '<b>Tap Space</b> to take a copy of ' + (s.items.length ? 'the ' + top(s).sym + ' cube' : 'it') + ', then tap again at a pad to put it down (or hold Space to carry it). The ' + (s.role === 'mem' ? 'memory box' : 'register') + ' keeps its value.'; key = 'tap to copy'; mode = 'hold'; }
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
    get M() { return M; }, get R() { return R; }, pos, hand, setHand, start, newRound, free, solidAt, handPos, grabTarget, guideTarget, missions: MISSIONS, model: { makeTable, makeQuery, runQuery, aggValue, sqlLines, sqlTokens, queryRound, tableRound, TYPES, matches },
    get slots() { return slots; }, get done() { return done; }, get arrows() { return arrows.count; }, get outlined() { return outlineG.children.length; }, get glowing() { return glowing; },
    toastText: () => $('toast').textContent, lessonMode, startLesson, nextMission, LESSONS, minsOf, KIND, frame: (n, ms = 33) => { for (let i = 0; i < n; i++) tick((last || performance.now()) + ms); }, nearestSlot
  };
  return { stop() { } };
}
