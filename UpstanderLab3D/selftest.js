// Upstander Lab 3D self-test. Open index.html?debug=1, then in the console:
//   const t = await import('./selftest.js?' + Date.now()); await t.run()
// play:  every mission finished by walking (a path search over free()) to each person, talking with only right
//        choices and using the phone, ending with 3 stars and no slips.
// break: every wrong choice and wrong phone action is refused with a reason, counts one slip, and moves nothing on.
// Results in window.__selftest.
import { MISSIONS, MESSAGES, fill, NAMES, NAME_POOL } from './js/story.js';
import { flagged, verdict } from './js/filter.js';

const L = () => window.__lab;
function assert(ok, msg) { if (!ok) throw new Error(msg); }

// Walk to stand next to a person: a breadth-first search over tile centres, then small steps that must all be free.
function walkTo(id) {
  const lab = L(), p = lab.people[id], pos = lab.pos;
  const key = (x, y) => x + ',' + y, start = [Math.round(pos.x), Math.round(pos.y)];
  const goal = (x, y) => Math.hypot(x - p.x, y - p.y) < 1.25 && lab.free(x, y);
  // first step onto the tile grid from wherever we stand
  for (let g = 0; g < 20 && Math.hypot(start[0] - pos.x, start[1] - pos.y) > 0.01; g++) {
    const d = Math.hypot(start[0] - pos.x, start[1] - pos.y), s = Math.min(0.15, d);
    const nx = pos.x + (start[0] - pos.x) / d * s, ny = pos.y + (start[1] - pos.y) / d * s;
    if (!lab.free(nx, ny)) break; pos.x = nx; pos.y = ny;
  }
  const prev = new Map([[key(...start), null]]), q = [start];
  let end = null;
  while (q.length) {
    const [x, y] = q.shift();
    if (goal(x, y)) { end = [x, y]; break; }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      const clear = [0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1].every((f) => lab.free(x + dx * f, y + dy * f));
      if (!prev.has(k) && clear) { prev.set(k, [x, y]); q.push([nx, ny]); }
    }
  }
  assert(end, 'no path to ' + id);
  const path = []; for (let c = end; c; c = prev.get(key(...c))) path.unshift(c);
  for (const [tx, ty] of path) {
    while (Math.hypot(tx - pos.x, ty - pos.y) > 0.01) {
      const d = Math.hypot(tx - pos.x, ty - pos.y), s = Math.min(0.15, d);
      const nx = pos.x + (tx - pos.x) / d * s, ny = pos.y + (ty - pos.y) / d * s;
      assert(lab.free(nx, ny), 'walked into something at ' + nx.toFixed(2) + ',' + ny.toFixed(2) + ' going to ' + id);
      pos.x = nx; pos.y = ny;
    }
  }
  lab.frame(2);
  assert(lab.nearest(1.5) === p, 'next to ' + id + ' but nearest is ' + (lab.nearest(1.5) || {}).id);
}
// Talk the whole conversation through with right choices only.
function chat(id) {
  const lab = L();
  walkTo(id);
  assert(lab.talkTo(lab.nearest(1.5)), 'could not talk to ' + id);
  for (let guard = 0; lab.talk.isOpen() && guard < 40; guard++) {
    const line = lab.talk.line();
    if (line.choices) {
      const k = line.choices.findIndex((c) => c.ok && (!c.check || c.check(lab.S)));
      assert(k >= 0, id + ': no right choice available: ' + line.say);
      assert(lab.talk.choose(k), id + ': right choice refused: ' + line.choices[k].t);
    } else lab.talk.next();
  }
  assert(!lab.talk.isOpen(), id + ': conversation did not end');
}
const PLAY = {
  filter() {
    const lab = L();
    chat('rep');
    for (const m of MESSAGES.slice(1)) chat(m.from);
    lab.phone.open();
    for (const m of MESSAGES) { lab.phone.run(m.id); assert(lab.phone.classify(m.id, verdict(flagged(fill(m.text)), m.unkind)), 'classify ' + m.id); }
    lab.phone.close();
    chat('rep');
  },
  spread() {
    const lab = L();
    chat('poster');
    lab.phone.open(); lab.phone.spreadNext(); lab.phone.spreadNext();
    assert(lab.phone.answer('q4', 15) && lab.phone.answer('q8', 255), 'spread answers');
    lab.phone.close();
    chat('poster'); chat('target');
  },
  upstander() {
    const lab = L();
    lab.phone.open(); assert(lab.phone.act('save') && lab.phone.act('report') && lab.phone.act('block'), 'chat actions'); lab.phone.close();
    chat('target'); chat('bystander'); chat('coun');
  },
  challenge() {
    const lab = L();
    lab.phone.open(); assert(lab.phone.act('save'), 'save'); lab.phone.close();
    chat('newcomer'); chat('poster'); chat('coun');
  },
};

function play() {
  const lab = L(), out = [];
  // every person on screen has this visit's random name; nothing still shows a {role} token
  for (const p of Object.values(lab.people)) assert(p.name === NAMES[p.id] && (p.id === 'coun' || NAME_POOL.includes(p.name)), 'name for ' + p.id);
  assert(new Set(Object.values(NAMES)).size === Object.keys(NAMES).length, 'names repeat');
  for (const m of MISSIONS) {
    lab.start(lab.list().findIndex((x) => x.id === m.id));
    assert(lab.M.id === m.id, 'started ' + m.id);
    PLAY[m.id]();
    assert(lab.finished, m.id + ' not finished: ' + JSON.stringify(lab.S));
    assert(lab.slips === 0 && lab.stars[m.id] === 3, m.id + ' slips ' + lab.slips);
    assert(!/\{\w+\}/.test(document.getElementById('mission').textContent + document.getElementById('hint').textContent), m.id + ': a {role} token is showing');
    out.push(m.id);
  }
  return 'played ' + out.join(', ');
}

function breakIt() {
  const lab = L(); let n = 0;
  for (const m of MISSIONS) {
    lab.start(lab.list().findIndex((x) => x.id === m.id));
    for (const [id, f] of Object.entries(m.talk)) {
      const s = f(lab.S) || [];
      s.forEach((line, li) => (line.choices || []).forEach((c, k) => {
        if (c.ok) return;
        const before = JSON.stringify(lab.S), slips = lab.slips;
        lab.talk.open(lab.people[id], s, lab.S);
        for (let j = 0; j < li; j++) if (!s[j].choices) lab.talk.next(); else break;
        if (lab.talk.line() !== line) { lab.talk.close(); return; }
        assert(!lab.talk.choose(k), id + ': wrong choice taken: ' + c.t);
        assert(c.why && lab.talk.feedback() === fill(c.why), id + ': no reason shown for ' + c.t);
        assert(lab.slips === slips + 1, id + ': slip not counted');
        lab.talk.close();
        if (li === 0) assert(JSON.stringify(lab.S) === before, id + ': a wrong first choice changed the state');
        n++;
      }));
    }
    if (m.phone === 'chat') {
      for (const a of ['reply', 'forward', 'block']) { const s = lab.slips; assert(!lab.phone.act(a) && lab.slips === s + 1, m.id + ': ' + a + ' allowed'); n++; }
      assert(!lab.S.saved && !lab.S.blocked, m.id + ': state moved');
    }
    if (m.phone === 'messages') {
      lab.S.got.m1 = true; lab.phone.run('m1'); const s = lab.slips;
      assert(!lab.phone.classify('m1', 'missed') && lab.slips === s + 1 && !lab.S.tested.m1, 'wrong verdict'); n++;
    }
    if (m.phone === 'spread') {
      lab.S.krit1 = true; const s = lab.slips;
      assert(!lab.phone.answer('q4', 8) && !lab.phone.answer('q4', 4) && lab.slips === s + 2 && !lab.S.q4, 'wrong spread answers'); n++;
    }
  }
  return n + ' wrong moves refused';
}

export async function run({ parts = ['play', 'break'] } = {}) {
  const res = {}, lab = L();
  // keep the player's real progress: the test's stars must not stay on the mission list
  const keep = { done: { ...lab.done }, stars: { ...lab.stars } }, saved = {};
  for (const k of ['all:done', 'all:stars']) { try { saved[k] = localStorage.getItem('bc-upstander3d-v1:' + k); } catch (e) { } }
  for (const p of parts) {
    try { res[p] = p === 'play' ? play() : breakIt(); } catch (e) { res[p] = 'FAIL: ' + e.message; }
  }
  for (const k of Object.keys(lab.done)) delete lab.done[k]; Object.assign(lab.done, keep.done);
  for (const k of Object.keys(lab.stars)) delete lab.stars[k]; Object.assign(lab.stars, keep.stars);
  for (const [k, v] of Object.entries(saved)) { try { if (v == null) localStorage.removeItem('bc-upstander3d-v1:' + k); else localStorage.setItem('bc-upstander3d-v1:' + k, v); } catch (e) { } }
  lab.start(0);
  window.__selftest = res;
  console.log('selftest:', JSON.stringify(res));
  return res;
}
