// Network Help Desk: the game behind the screens. Signed in on the site, the shell keeps the game (NetworkDesk.gs,
// through the Exam Game relay): this page runs the same rules (model.js, window.NetDesk) at once for the computer
// screen and sends every change, numbered, with its next request; the shell replays them and decides everything that
// scores. The page's copy is always the shell's last state plus the changes it has not confirmed yet.
// Opened on its own, or not signed in, it is a practice desk: the same game in the page with the written replies and
// no leaderboard.
const ND = window.NetDesk;
const clone = o => JSON.parse(JSON.stringify(o));
const rnd = n => Math.floor(Math.random() * n);

// ---------------------------------------------------------------- the relay (BC_EXAM_GAME_REQUEST -> BC_EXAM_GAME_RESULT)
const pending = {}; let seqNo = 0;
addEventListener('message', e => {
  const d = e.data;
  if (!d || d.type !== 'BC_EXAM_GAME_RESULT' || e.source !== window.parent || !pending[d.reqId]) return;
  const p = pending[d.reqId]; delete pending[d.reqId]; clearTimeout(p.timer);
  if (d.ok) p.resolve(d.result); else p.reject(new Error(d.error || 'Something went wrong.'));
});
function request(op, payload, ms) {
  return new Promise((resolve, reject) => {
    const reqId = 'nd' + (++seqNo) + '-' + Date.now();
    pending[reqId] = { resolve, reject, timer: setTimeout(() => { delete pending[reqId]; reject(new Error('No answer from the site.')); }, ms || 60000) };
    try { window.parent.postMessage({ type: 'BC_EXAM_GAME_REQUEST', reqId, op, payload: payload || {} }, '*'); }
    catch (err) { delete pending[reqId]; reject(err); }
  });
}
export const framed = window.parent !== window;
export function whoami() { return framed ? request('whoami', {}, 20000).catch(() => ({ teacher: false })) : Promise.resolve({ teacher: false }); }
export function results() { return request('deskResults', {}, 30000); }

export function createDesk(lesson, onChange, onToast) {
  let mode = framed ? 'server' : 'local';
  let base = null;          // the shell's last state (server mode), or the page's own game (local mode)
  let ops = [], seq = 0, jobId = '', version = 0;
  let local = null;         // base + the changes not confirmed yet
  const inflight = new Set();
  let board = null, totals = { points: 0, jobs: 0 }, syncTimer = 0, starting = false, teacher = false;

  function rebuild() {
    if (mode === 'local') { local = base; onChange(); return; }
    local = base ? clone(base) : null;
    if (local) ND.applyOps(local, ops);
    onChange();
  }
  function adopt(res) {
    if (!res) return;
    if (res.board) board = res.board;
    if (res.teacher != null) teacher = res.teacher;
    const st = res.state; if (!st) { rebuild(); return; }
    if (st.version < version && st.job && st.job.id === jobId) return;   // an older answer arriving late
    version = st.version || 0;
    if (!st.job || st.job.id !== jobId) { jobId = st.job ? st.job.id : ''; ops = []; seq = st.opSeq || 0; }
    base = st;
    ops = ops.filter(o => o.seq > (st.opSeq || 0));
    rebuild();
  }
  function fail(e) {
    onToast(/sign in/i.test(e.message) ? 'You are signed out. Sign in again to keep your points.' : 'No answer from the site. Try again.');
    rebuild();
  }
  async function serverCall(op, extra, contact) {
    if (contact) inflight.add(contact);
    rebuild();
    try { adopt(await request(op, Object.assign({ lesson, ops: ops.slice() }, extra || {}))); }
    catch (e) { fail(e); }
    finally { if (contact) inflight.delete(contact); rebuild(); }
  }
  function queueSync() {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => { if (mode === 'server' && ops.length) serverCall('deskSync'); }, 4000);
  }
  // one change: applied here at once, sent with the next request
  function change(o) {
    if (!local || local.phase !== 'job') return '?';
    if (mode === 'local') { const why = o.op === 'ask' ? ND.ask(base, o.q) : ND.applyOp(base.job, o); rebuild(); return why; }
    const trial = clone(local), why = o.op === 'ask' ? ND.ask(trial, o.q) : ND.applyOp(trial.job, o);
    if (why) return why;
    o.seq = ++seq; ops.push(o); rebuild(); queueSync();
    return null;
  }

  // ---------------------------------------------------------------- the practice desk (no shell)
  function localJob() {
    if (!base) base = ND.newGame(lesson, 0);
    ND.beginJob(base, rnd);
    rebuild();
    setTimeout(() => { ND.setScript(base, ND.scriptFallback(base.job), Date.now()); rebuild(); }, 1200);
  }
  function localLater(who, fn) { inflight.add(who); rebuild(); setTimeout(() => { inflight.delete(who); fn(); rebuild(); }, 900); }

  const api = {
    get mode() { return mode; }, get state() { return local; }, get board() { return board; }, get teacher() { return teacher; },
    get busy() { return [...inflight]; }, get starting() { return starting; },
    get totals() { return mode === 'server' && board ? board.me : totals; },
    async start() {
      starting = true;
      if (mode === 'server') {
        try { adopt(await request('deskStart', { lesson }, 60000)); }
        catch (e) {
          if (/sign in|unknown request|no answer/i.test(e.message)) { mode = 'local'; onToast('Practice desk: you are not signed in, so your points are not saved.'); }
          else { starting = false; fail(e); return; }
        }
        // the shell may still be writing this job's customer: ask again shortly
        if (mode === 'server' && local && local.phase === 'loading') { starting = false; setTimeout(() => api.start(), 3000); return; }
      }
      if (mode === 'local') localJob();
      starting = false; rebuild();
    },
    act(o) { return change(o); },
    ask(q) { return change({ op: 'ask', q }); },
    search(q) { return change({ op: 'search', q }); },
    call(who, text) {
      if (inflight.has(who) || !local || local.phase !== 'job') return;
      if (mode === 'server') return serverCall('deskCall', { to: who, text }, who);
      if (!ND.officeOk(base, who)) return;
      const chat = base.chats[who] || [];
      let level = 0; if (who === 'tech') { base.techCalls++; level = Math.min(3, base.techCalls); }
      ND.say(base, who, 'me', text);
      localLater(who, () => {
        if (who === 'tech') { ND.say(base, who, 'them', ND.techFallback(base.job, level)); return; }
        const all = chat.filter(m => m.who === 'me').map(m => m.text).concat([text]).join(' ');
        ND.officeReply(base, who, ND.checkOffice(base.job, who, ND.officeFallback(base.job, who, text, all), all));
      });
    },
    fixed() { if (mode === 'server') return serverCall('deskFixed', {}, 'customer'); ND.fixed(base); rebuild(); },
    tell(text) { if (mode === 'server') return serverCall('deskTell', { text }, 'customer'); ND.tell(base, text); rebuild(); },
    explain(text) {
      if (inflight.has('customer')) return;
      if (mode === 'server') return serverCall('deskExplain', { text }, 'customer');
      if (base.phase !== 'explain') return;
      ND.say(base, 'customer', 'me', text);
      localLater('customer', () => { const r = ND.explainFallback(base.job, text, base.script.thanks); const s = ND.finish(base, r.marks, r.reply, Date.now()); totals.points += s.total; totals.jobs++; });
    },
    next() {
      if (!local || local.phase !== 'scored' || inflight.has('next')) return;
      if (mode === 'server') return serverCall('deskNext', {}, 'next');
      localJob();
    }
  };
  return api;
}
