// Convert It (?mode=convert): convert between infix, prefix and postfix by the bracket method, one visible step at a
// time, with the reason for every step on screen (James 2026-10-27: conversions need their own game, before the Tree
// Builder, and students must know the how and the why, not work on instinct).
//   Step 1 Brackets: click the operator worked out next. Its brackets appear round it and its two values, with the
//          reason (* before +, left to right, the arrow on the right first). From prefix or postfix: click an operator
//          with its two values right next to it.
//   Step 2 Move: each operator in turn; click the gap where it goes inside its OWN brackets (front, end or middle).
//   Step 3 Remove: type the answer without the brackets (to infix: keep the brackets that change the answer).
// A wrong step is explained and must be put right; that conversion then does not count and the run of clean ones
// starts again. NEED clean conversions in a row move up a level; clearing the last level finishes the mode.
// Contest level: a number next to a letter or a bracket hides a *; the student counts them first.
(function () {
  'use strict';
  var NC = NL.NC, el = NL.el, esc = NL.esc, POW = NC.POW;
  var FOUR = ['+', '-', '*', '/'];
  var LEVELS = [
    { name: 'Two operators', n: 2, ops: FOUR, noBrackets: true, dirs: [['infix', 'postfix'], ['infix', 'prefix']], ex: 'P * Q - R' },
    { name: 'Brackets', n: [2, 3], ops: FOUR, brackets: true, dirs: [['infix', 'prefix'], ['infix', 'postfix']], ex: 'P * (Q + R)' },
    { name: 'Same rank', n: [3, 4], ops: FOUR, chain: true, dirs: [['infix', 'postfix'], ['infix', 'prefix']], ex: 'P - Q + R' },
    { name: 'Power arrow', n: [2, 3], ops: FOUR.concat([POW]), pow: true, dirs: [['infix', 'prefix'], ['infix', 'postfix']], ex: 'P ' + POW + ' Q ' + POW + ' 2' },
    { name: 'From postfix and prefix', n: [2, 3], ops: FOUR, dirs: [['postfix', 'infix'], ['prefix', 'infix'], ['postfix', 'prefix'], ['prefix', 'postfix']], ex: 'P * (Q + R)', exFrom: 'postfix' },
    { name: 'Contest style', n: [3, 4], ops: FOUR, dirs: [['infix', 'postfix'], ['prefix', 'infix'], ['infix', 'prefix'], ['postfix', 'infix']], implied: true, ex: '2(P + 3Q)' }
  ];
  var NEED = 2;
  var STEP_NAMES = { hidden: 'Hidden *', bracket: 'Brackets', move: 'Move', type: 'Remove' };

  // Infix brackets for this game: as NotationCore, except an arrow on the right of an arrow needs none (right to left).
  function needsC(child, parentOp, side) {
    if (child.op === POW && parentOp === POW && side === 'r') return false;
    return NC.needs(child, parentOp, side);
  }
  function infix(t, implied) {
    function go(n) {
      if (!n.op) return n.v;
      var l = go(n.l), r = go(n.r);
      if (needsC(n.l, n.op, 'l')) l = '(' + l + ')';
      if (needsC(n.r, n.op, 'r')) r = '(' + r + ')';
      return implied && NC.hiddenTimes(n) ? l + r : l + ' ' + n.op + ' ' + r;
    }
    return go(t);
  }
  // A whole tree written in one form, every operation in brackets (brackets false: none).
  function written(t, form, brackets) {
    if (!t.op) return t.v;
    var l = written(t.l, form, brackets), r = written(t.r, form, brackets);
    var s = form === 'prefix' ? t.op + ' ' + l + ' ' + r : form === 'postfix' ? l + ' ' + r + ' ' + t.op : l + ' ' + t.op + ' ' + r;
    return brackets ? '(' + s + ')' : s;
  }
  function parseC(s) { return NC.parseInfix(s.replace(new RegExp(POW, 'g'), '^')); }
  function side(n) { return n.parent && n === n.parent.l ? 'l' : 'r'; }
  function b(s) { return '<b class="calc">' + esc(s) + '</b>'; }
  function opName(n) { return n.hidden ? 'the hidden *' : n.op; }
  var WHY = {
    hidden: 'Why: every operator has to move in step 2. A * you cannot see is easy to leave out, so find them all first.',
    bracket: 'Why: brackets show exactly which two values each operator joins. Once every operator has its own pair, moving it cannot change what it joins.',
    bracketBack: 'Why: an operator always works on the two values right next to it (just before it in postfix, just after it in prefix). A finished bracket counts as one value.',
    move: { postfix: 'Why: postfix means the operator comes <b>after</b> its two values, so it goes to the <b>end</b> of its own brackets.',
      prefix: 'Why: prefix means the operator comes <b>before</b> its two values, so it goes to the <b>front</b> of its own brackets.',
      infix: 'Why: infix means the operator sits <b>between</b> its two values, so it goes after the left value and before the right one.' },
    type: { seq: 'Why: each operator now sits next to the two values it joins, so the brackets are not needed. Type what is left, in the same order.',
      infix: 'Why: infix still needs some brackets. Keep a bracket only where it changes the answer, for example round + under a *.' }
  };

  NL.activities.convert = function (host) {
    var lv = Math.max(0, Math.min(LEVELS.length - 1, (parseInt(NL.params.get('level'), 10) || 1) - 1));
    var have = 0, score = 0, streak = 0, count = 0, last = '';
    var log = NL.results('Convert It');
    var S = null, introShown = {};

    var bar = NL.topbar(host);
    var q = el('p', { class: 'task-q' });
    var stepsBox = el('div', { class: 'cv-steps' });
    var rule = el('div', { class: 'rule-box' });
    var sup = NL.support('convert', rule);
    sup.toggle(bar.slot);
    var whyBox = el('div', { class: 'cv-why' }), stripBox = el('div'), inBox = el('div'), act = el('div', { class: 'actions' }), fb = el('div', { class: 'feedback' });
    var game = [q, stepsBox, rule, whyBox, stripBox, inBox, act, fb];
    var introBox = el('div', { class: 'cv-intro' });
    game.forEach(function (n) { host.appendChild(n); });
    host.appendChild(introBox);
    sup.set([
      'Brackets first, then ' + POW + ', then * and /, then + and -. Same rank: left to right. Two arrows: right to left.',
      'Brackets, ' + POW + ', * /, + -. Same rank left to right.',
      'Which part is worked out first?'
    ]);

    function L() { return LEVELS[lv]; }

    // ------------------------------------------------ expressions
    function hasChain(t) {
      if (!t.op) return false;
      if (t.l.op && NC.PREC[t.l.op] === NC.PREC[t.op] && t.op !== POW) return true;
      return hasChain(t.l) || hasChain(t.r);
    }
    function rename(t) {
      var k = 0;
      (function go(n, isExp) {
        if (!n.op) { if (!isExp && /[A-Z]/.test(n.v)) n.v = 'ABCDEFGH'.charAt(k++); return; }
        go(n.l, false); go(n.r, n.op === POW && !n.r.op);
      })(t, false);
    }
    function generate(lev, from) {
      for (var k = 0; k < 400; k++) {
        var t = NC.randomTree({ n: NL.sizeOf(lev.n), ops: lev.ops, letters: true, mustUse: lev.pow ? [POW] : null, digitChance: lev.implied && from === 'infix' ? 0.45 : 0 });
        if (lev.pow && Math.random() < 0.6) {
          var p = null;
          (function find(n) { if (n.op === POW && !n.r.op) p = p || n; if (n.op) { find(n.l); find(n.r); } })(t);
          if (p && NC.opCount(t) < 4) { p.r = NC.node(POW, NC.leaf('A'), NC.leaf('2')); rename(t); }
        }
        var plain = infix(t), shown = infix(t, lev.implied);
        if (lev.brackets && plain.indexOf('(') < 0) continue;
        if (lev.noBrackets && plain.indexOf('(') >= 0) continue;
        if (lev.chain && !hasChain(t)) continue;
        if (lev.implied && from === 'infix' && (shown === plain || !/[A-H]/.test(shown))) continue;
        if (written(t, 'infix') === last) continue;
        last = written(t, 'infix');
        return t;
      }
      return NC.randomTree({ n: 2, ops: FOUR, letters: true });
    }
    function index(t) {
      var nodes = [];
      (function go(n, parent) { n.id = nodes.length; n.parent = parent; nodes.push(n); if (n.op) { go(n.l, n); go(n.r, n); } })(t, null);
      return nodes;
    }

    // ------------------------------------------------ the row of tokens for the current state
    function bracketed(n) {
      if (!n.op) return false;
      if (S.phase === 'move' || S.phase === 'type' || S.phase === 'end') return true;
      return !!S.done[n.id] || (S.from === 'infix' && !!n.parent && needsC(n, n.parent.op, side(n)));
    }
    function formOf(n) { return S.moved[n.id] ? S.to : S.from; }
    function row(moved) {
      var out = [];
      (function emit(n) {
        if (!n.op) { out.push({ k: 'val', t: n.v, node: n.id }); return; }
        var br = bracketed(n), form = moved && moved.id === n.id ? S.to : formOf(n);
        var hid = S.from === 'infix' && S.implied && NC.hiddenTimes(n) && form === 'infix';
        var opTok = { k: 'op', t: n.op, node: n.id, hid: hid };
        if (br) out.push({ k: 'br', t: '(', node: n.id, open: true });
        var parts = form === 'prefix' ? [opTok, n.l, n.r] : form === 'postfix' ? [n.l, n.r, opTok] : [n.l, opTok, n.r];
        parts.forEach(function (p) {
          if (p === opTok) { if (!(hid && !S.hiddenShown)) out.push(opTok); }
          else emit(p);
        });
        if (br) out.push({ k: 'br', t: ')', node: n.id, open: false });
      })(S.tree);
      return out;
    }
    function rowText(list) { return list.map(function (x) { return x.t; }).join(' ').replace(/\( /g, '(').replace(/ \)/g, ')'); }
    function partText(n) {
      var list = row(), i0 = -1, i1 = -1;
      var ids = {};
      (function mark(m) { ids[m.id] = true; if (m.op) { mark(m.l); mark(m.r); } })(n);
      list.forEach(function (x, i) { if (ids[x.node]) { if (i0 < 0) i0 = i; i1 = i; } });
      return rowText(list.slice(i0, i1 + 1));
    }

    // ------------------------------------------------ a new conversion
    function newExpr() {
      var lev = L();
      var dir = lev.dirs[count % lev.dirs.length];
      count++;
      var t = generate(lev, dir[0]);
      var nodes = index(t);
      S = { tree: t, nodes: nodes, from: dir[0], to: dir[1], implied: !!lev.implied && dir[0] === 'infix', done: {}, order: [], moved: {}, mi: 0,
        mistakes: 0, flash: -1, flashGap: -1, own: -1, hiddenShown: false, phase: 'bracket' };
      S.hiddenCount = 0;
      nodes.forEach(function (n) { if (n.op && S.implied && NC.hiddenTimes(n)) { S.hiddenCount++; n.hidden = true; } });
      if (S.hiddenCount) S.phase = 'hidden';
      S.start = S.from === 'infix' ? infix(t, S.implied) : NC.show(S.from === 'prefix' ? NC.toPrefix(t) : NC.toPostfix(t));
      if (!introShown[lv]) { introShown[lv] = true; intro(); return; }
      draw();
    }

    function draw(note) {
      var lev = L();
      bar.set({ level: 'Level ' + (lv + 1) + ': ' + lev.name, have: have, need: log.isDone() && lv === LEVELS.length - 1 ? 0 : NEED, score: score, streak: streak });
      q.innerHTML = 'Convert ' + S.from + ' to <b>' + S.to + '</b>: ' + b(S.start);
      var names = (S.hiddenCount ? ['hidden'] : []).concat(['bracket', 'move', 'type']);
      stepsBox.innerHTML = names.map(function (p, i) {
        var at = names.indexOf(S.phase === 'end' ? 'zzz' : S.phase), cls = i === at ? 'now' : (S.phase === 'end' || i < at) ? 'past' : '';
        return '<span class="' + cls + '">' + (i + 1) + '. ' + STEP_NAMES[p] + '</span>';
      }).join('');
      if (S.phase === 'hidden') whyBox.innerHTML = '<b>Step 1: find the hidden *.</b> A number written right next to a letter or a bracket means multiply: ' + b('3A') + ' is ' + b('3 * A') + '. How many hidden * are there?<br>' + WHY.hidden;
      else if (S.phase === 'bracket') whyBox.innerHTML = S.from === 'infix' ?
        '<b>Brackets:</b> click the operator that is worked out <b>next</b>. Its brackets go round it and its two values.<br>' + WHY.bracket :
        '<b>Brackets:</b> click an operator whose two values are right ' + (S.from === 'postfix' ? '<b>before</b>' : '<b>after</b>') + ' it. Its brackets go round the three.<br>' + WHY.bracketBack;
      else if (S.phase === 'move') whyBox.innerHTML = '<b>Move:</b> click the gap where the highlighted ' + b(S.nodes[S.order[S.mi]].op) + ' goes, inside its <b>own</b> brackets.<br>' + WHY.move[S.to];
      else if (S.phase === 'type') whyBox.innerHTML = '<b>Remove:</b> type the ' + S.to + ' without ' + (S.to === 'infix' ? 'the brackets that change nothing.' : 'any brackets.') + '<br>' + (S.to === 'infix' ? WHY.type.infix : WHY.type.seq);
      else whyBox.innerHTML = '';
      drawStrip();
      drawInput();
      act.innerHTML = '';
      if (S.phase === 'end') {
        var nx = el('button', { type: 'button', class: 'btn' }, 'Next conversion ' + NL.ICON.next);
        nx.addEventListener('click', function () { NL.say(fb, ''); newExpr(); });
        act.appendChild(nx);
      }
      act.appendChild(NLWalk.button(walkMe));
      var how = el('button', { type: 'button', class: 'btn secondary' }, 'How it works');
      how.addEventListener('click', function () { intro(true); });
      act.appendChild(how);
      if (note) NL.say(fb, note[0], note[1]);
      NL.reportHeight();
    }

    function drawStrip() {
      stripBox.innerHTML = '';
      var list = row(), strip = el('div', { class: 'strip cv-strip' });
      var cur = S.phase === 'move' ? S.nodes[S.order[S.mi]] : null;
      function gap(g) {
        var cls = 'cv-gap' + (S.flashGap === g ? ' flash-bad' : '');
        var bt = el('button', { type: 'button', class: cls, 'aria-label': 'gap ' + (g + 1) }, '');
        bt.addEventListener('click', function () { pickGap(g); });
        strip.appendChild(bt);
      }
      list.forEach(function (it, i) {
        if (cur) gap(i);
        var cls = 'tok' + (it.k === 'op' ? ' op' : it.k === 'br' ? ' br' : '');
        if (it.hid) cls += ' hid';
        if (it.k === 'br' && S.done[it.node]) cls += ' added';
        if (it.k === 'op' && S.phase === 'bracket' && S.done[it.node]) cls += ' picked-ok';
        if (cur && it.k === 'op' && it.node === cur.id) cls += ' now';
        if (S.own === it.node && it.k === 'br') cls += ' own';
        if (S.flash === i) cls += ' flash-bad';
        if (it.k === 'op' && S.phase === 'bracket' && !S.done[it.node]) {
          var bt = el('button', { type: 'button', class: cls, 'aria-label': 'operator ' + it.t }, esc(it.t));
          bt.addEventListener('click', function () { pickOp(S.nodes[it.node], i); });
          strip.appendChild(bt);
        } else strip.appendChild(el('span', { class: cls }, esc(it.t)));
      });
      if (cur) gap(list.length);
      stripBox.appendChild(strip);
      if (S.phase === 'end') {
        stripBox.appendChild(el('div', { class: 'small' }, 'Infix: ' + b(infix(S.tree, S.from === 'infix' && S.implied)) + (S.implied ? ' = ' + b(infix(S.tree)) : '') +
          ' &nbsp; Prefix: ' + b(NC.show(NC.toPrefix(S.tree))) + ' &nbsp; Postfix: ' + b(NC.show(NC.toPostfix(S.tree)))));
      }
    }

    function drawInput() {
      inBox.innerHTML = '';
      if (S.phase !== 'hidden' && S.phase !== 'type') return;
      var wrap = el('div', { class: 'actions' });
      var inp = el('input', { class: 'answer-in' + (S.phase === 'type' ? ' wide' : ''), autocomplete: 'off', spellcheck: 'false',
        'aria-label': S.phase === 'type' ? 'Your ' + S.to : 'How many hidden *', inputmode: S.phase === 'hidden' ? 'numeric' : 'text' });
      var go = el('button', { type: 'button', class: 'btn' }, 'Check');
      function check() { if (S.phase === 'hidden') checkHidden(inp.value); else checkTyped(inp.value); }
      go.addEventListener('click', check);
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); check(); } });
      wrap.appendChild(inp); wrap.appendChild(go);
      if (S.phase === 'type') wrap.appendChild(el('span', { class: 'small' }, 'Type ^ for ' + POW + '. Spaces are optional.'));
      inBox.appendChild(wrap);
      NL.focusSoon(inp);
    }

    function slip(text) {
      S.mistakes++; streak = 0; sup.wrong();
      var tail = S.mistakes === 1 ? ' This conversion will not count now, but finish it: putting the step right is how you learn it.' : '';
      draw([text + tail, 'bad']);
    }
    function flashTok(i) { S.flash = i; NL.later(700, function () { S.flash = -1; if (S) drawStrip(); }); }

    // ------------------------------------------------ step: hidden *
    function checkHidden(v) {
      var n = parseInt(String(v).trim(), 10);
      if (n === S.hiddenCount) {
        S.hiddenShown = true; S.phase = 'bracket'; score += 5; streak++; sup.right();
        draw(['Yes: ' + S.hiddenCount + '. They are shown now as dashed * tiles. Every one is a real operator and moves like the others.', '']);
        return;
      }
      if (isNaN(n)) { draw(['Type a number.', 'hint']); return; }
      slip(n < S.hiddenCount ? 'Not enough. Look at every number: is a letter or a bracket written right after it? Each one of those hides a *.' :
        'Too many. A * is hidden only where a number is written right next to a letter or a bracket. Between two letters there is always a written operator.');
    }

    // ------------------------------------------------ step: brackets
    function ready(n) { return [n.l, n.r].every(function (c) { return !c.op || S.done[c.id]; }); }
    function pickOp(n, i) {
      if (S.phase !== 'bracket') return;
      if (ready(n)) {
        S.done[n.id] = true; S.order.push(n.id); score += 5; streak++; sup.right();
        var why = S.from === 'infix' ? firstWhy(n) : 'Yes. ' + b(opName(n)) + ' has its two values right ' + (S.from === 'postfix' ? 'before' : 'after') + ' it, so the three go in one bracket. That bracket now counts as one value.';
        if (S.order.length === NC.opCount(S.tree)) {
          S.phase = 'move'; S.mi = 0;
          draw([why + ' Every operator has its own brackets now. Next: move each operator.', '']);
          return;
        }
        draw([why, '']);
        return;
      }
      flashTok(i);
      var c = [n.l, n.r].filter(function (k) { return k.op && !S.done[k.id]; })[0];
      slip(S.from === 'infix' ? notYetWhy(n, c) :
        'Not yet. ' + b(opName(n)) + ' works on the two values right ' + (S.from === 'postfix' ? 'before' : 'after') + ' it, and one of them is still the loose operator ' + b(c.op) +
        ' that has no brackets yet. A finished bracket counts as one value; a loose operator does not.');
    }
    // Why the operator just bracketed is worked out at this point.
    function firstWhy(n) {
      var p = n.parent, me = b(opName(n));
      if (!p) return 'Yes. ' + me + ' is worked out last, so its brackets go round everything.';
      var s = side(n), was = needsC(n, p.op, s);
      if (was) return 'Yes. ' + me + ' is inside the brackets in the question, and brackets are worked out first.';
      if (NC.PREC[n.op] > NC.PREC[p.op]) return 'Yes. ' + me + ' ranks above ' + b(opName(p)) + ', so it is worked out first.';
      if (n.op === POW && p.op === POW) return 'Yes. Two arrows go right to left, so the arrow on the right is worked out first.';
      return 'Yes. ' + me + ' and ' + b(opName(p)) + ' have the same rank, so left to right: ' + me + ' first.';
    }
    function notYetWhy(n, c) {
      var me = b(opName(n)), it = b(opName(c)), s = side(c);
      if (needsC(c, n.op, s)) return 'Not yet. The part in brackets, ' + b(partText(c)) + ', is worked out before ' + me + '. Bracket inside it first.';
      if (NC.PREC[c.op] > NC.PREC[n.op]) return 'Not yet. ' + it + ' ranks above ' + me + ', so ' + it + ' is worked out first.';
      if (c.op === POW && n.op === POW) return 'Not yet. Two arrows go right to left, so the arrow on the right is worked out first.';
      return 'Not yet. ' + it + ' and ' + me + ' have the same rank, so left to right: the ' + it + ' on the left is worked out first.';
    }

    // ------------------------------------------------ step: move
    function key(list) { return list.map(function (x) { return x.k + x.node + (x.open ? 'o' : ''); }).join(','); }
    function pickGap(g) {
      if (S.phase !== 'move') return;
      var c = S.nodes[S.order[S.mi]];
      var list = row(), oi = -1, open = -1, close = -1;
      list.forEach(function (x, i) { if (x.node === c.id) { if (x.k === 'op') oi = i; else if (x.open) open = i; else close = i; } });
      var after = list.slice(), tok = after.splice(oi, 1)[0];
      after.splice(g > oi ? g - 1 : g, 0, tok);
      if (key(after) === key(row(c))) {
        S.moved[c.id] = true; S.mi++; S.own = -1; score += 5; streak++; sup.right();
        var where = S.to === 'postfix' ? 'to the end of its brackets, after its two values' : S.to === 'prefix' ? 'to the front of its brackets, before its two values' : 'between its two values';
        if (S.mi >= S.order.length) {
          S.phase = 'type';
          draw(['Yes: ' + b(c.op) + ' moves ' + where + '. Every operator has moved. Last step: remove the brackets.', '']);
          return;
        }
        draw(['Yes: ' + b(c.op) + ' moves ' + where + '. It still joins the same two values.', '']);
        return;
      }
      S.flashGap = g; S.own = c.id;
      NL.later(700, function () { S.flashGap = -1; if (S && S.phase === 'move') drawStrip(); });
      var msg;
      if (g === oi || g === oi + 1) msg = 'That leaves ' + b(c.op) + ' where it is. It has to move.';
      else if (g <= open || g > close) msg = 'That is outside the brackets of ' + b(c.op) + '. An operator moves only inside its <b>own</b> brackets (now shown in colour), so it keeps the same two values.';
      else {
        var inner = null;
        list.forEach(function (x, i) { if (x.k === 'br' && x.open && x.node !== c.id && i < g && i > open) { var j = list.findIndex(function (y) { return y.k === 'br' && !y.open && y.node === x.node; }); if (g <= j) inner = S.nodes[x.node]; } });
        if (inner) msg = 'That is inside the brackets of ' + b(inner.op) + ', which belong to a different operator. Stay in the brackets of ' + b(c.op) + ' (now shown in colour).';
        else msg = S.to === 'postfix' ? 'Right brackets, wrong place. Postfix puts the operator at the very <b>end</b>, just before its closing bracket.' :
          S.to === 'prefix' ? 'Right brackets, wrong place. Prefix puts the operator at the very <b>front</b>, just after its opening bracket.' :
            'Right brackets, wrong place. Infix puts the operator <b>between</b> its two values: after the whole left value and before the right one.';
      }
      slip(msg);
    }

    // ------------------------------------------------ step: remove and type
    function checkTyped(v) {
      var got = NC.tokens(v);
      if (!got || !got.length) { draw(['Type only letters, numbers and operators.', 'hint']); return; }
      if (S.to === 'infix') {
        var t = parseC(String(v));
        if (t && NC.sameTree(t, S.tree)) { finish(); return; }
        if (!t) { slip('That cannot be read as infix. Check that the brackets pair up and every operator has a value on each side.'); return; }
        var flat = function (s) { return s.replace(/[()\s]/g, ''); };
        if (flat(written(t, 'infix')) === flat(written(S.tree, 'infix'))) slip('The order is right, but a bracket that changes the answer was taken away. Keep a bracket where a lower rank sits under a higher one, for example (A + B) * C.');
        else slip('That changes the order of the values or operators. Copy the row above from left to right and take out only brackets.');
        return;
      }
      var want = S.to === 'prefix' ? NC.toPrefix(S.tree) : NC.toPostfix(S.tree);
      if (got.indexOf('(') >= 0 || got.indexOf(')') >= 0) { slip('Leave the brackets out: removing them is this step.'); return; }
      if (got.join('') === want.join('')) { finish(); return; }
      var sorted = function (a) { return a.slice().sort().join(''); };
      if (sorted(got) !== sorted(want)) slip('Some letters, numbers or operators are missing or extra. The answer has ' + want.length + ' of them; you typed ' + got.length + '. Every one appears once.');
      else {
        var k = 0; while (got[k] === want[k]) k++;
        slip('Everything is there, but not in the right order. The first ' + (k ? k + ' are right' : 'one is wrong') + '. Read the row above from left to right and leave out only the brackets.');
      }
    }

    function finish() {
      S.phase = 'end';
      var clean = !S.mistakes, up = false, text;
      log.add(S.start + ' (' + S.from + ' to ' + S.to + ')' + (clean ? ', no mistakes' : ', ' + S.mistakes + ' mistake' + (S.mistakes > 1 ? 's' : '') + ' (not counted)') + (S.walked ? ', used Walk me through it' : ''), clean);
      if (clean) {
        score += 20; streak++; have++; sup.right();
        text = 'Converted with no mistakes: this one counts. ' + have + ' of ' + NEED + ' in a row.';
        if (have >= NEED && lv < LEVELS.length - 1) { lv++; have = 0; up = true; text += ' Level up: ' + esc(LEVELS[lv].name) + '.'; }
        else if (have >= NEED) { log.finish(); have = 0; }
      } else {
        have = 0;
        text = 'Converted, but with ' + (S.mistakes === 1 ? 'a mistake' : S.mistakes + ' mistakes') + ', so this one does not count. Your run of clean conversions is back to 0. You need ' + NEED + ' in a row with no mistakes.';
      }
      if (log.isDone() && lv === LEVELS.length - 1 && clean && !up) text = NL.doneBanner('You can convert contest-style expressions. Keep going for a higher score.') + text;
      draw([text, clean ? '' : 'hint']);
      void up;
    }

    // ------------------------------------------------ Walk me through it: a fresh similar conversion, same level and direction
    function answerOf(t, to) { return to === 'infix' ? infix(t) : NC.show(to === 'prefix' ? NC.toPrefix(t) : NC.toPostfix(t)); }
    function walkMe() {
      var lev = L(), from = S.from, to = S.to, implied = S.implied, keepLast = last, mine = S;
      var ex = NLWalk.pick(function () {
        var t = generate(lev, from);
        var w = NLWalk.bracket(t, from, to, { implied: implied, infix: infix, needs: needsC });
        return { key: NC.toPrefix(t).join(' '), question: w.question, answer: w.answer, steps: w.steps };
      }, { key: NC.toPrefix(S.tree).join(' '), question: S.start, answer: answerOf(S.tree, to) });
      last = keepLast;
      if (!ex) { NL.say(fb, 'Try that again in a moment.', 'hint'); return; }
      S.walked = true;
      NLWalk.open(host, { title: 'Walk me through it: ' + from + ' to ' + to, question: 'Similar question: convert ' + from + ' to <b>' + to + '</b>: ' + b(ex.question), steps: ex.steps,
        onClose: function (seen, total) { log.help(from + ' to ' + to + ', ' + ex.question + ' while on ' + mine.start, seen, total); } });
    }

    // ------------------------------------------------ the worked example for a level (also on "How it works")
    function intro(again) {
      var lev = L(), ex = parseC(lev.ex), from = lev.exFrom || 'infix', to = from === 'infix' ? 'postfix' : 'infix';
      var rows = [];
      if (from === 'infix') {
        rows.push(['Start', lev.implied ? lev.ex : infix(ex)]);
        if (lev.implied) rows.push(['Hidden *', infix(ex)]);
        rows.push(['1. Brackets', written(ex, 'infix', true)]);
        rows.push(['2. Move (postfix)', written(ex, 'postfix', true)]);
        rows.push(['3. Remove', written(ex, 'postfix')]);
      } else {
        rows.push(['Start (postfix)', written(ex, 'postfix')]);
        rows.push(['1. Brackets', written(ex, 'postfix', true)]);
        rows.push(['2. Move (infix)', written(ex, 'infix', true)]);
        rows.push(['3. Remove', infix(ex)]);
      }
      var say = {
        0: '<p>Three steps, every time. <b>1. Brackets</b> round each operator and its two values, in the order they are worked out. <b>2. Move</b> each operator to the end of its own brackets (postfix) or the front (prefix). <b>3. Remove</b> the brackets.</p>' +
          '<p>Here ' + b('*') + ' ranks above ' + b('-') + ', so ' + b('P * Q') + ' gets its brackets first. The brackets keep each operator with its own two values while it moves.</p>',
        1: '<p>Brackets in the question say "work this out first", so bracket inside them first. Here ' + b('Q + R') + ' is first even though ' + b('*') + ' ranks higher.</p>',
        2: '<p>Same rank (+ and -, or * and /): left to right. ' + b('P - Q + R') + ' means ' + b('(P - Q) + R') + '. Why it matters: 8 - 3 + 1 is 6, but 8 - (3 + 1) is 4.</p>',
        3: '<p>' + b(POW) + ' ranks above * and /. Two arrows are the one rule that goes <b>right to left</b>: ' + b('P ' + POW + ' Q ' + POW + ' 2') + ' means ' + b('P ' + POW + ' (Q ' + POW + ' 2)') +
          '. Why: on paper a power of a power is a tower of small numbers, worked out from the top down. 2 ' + POW + ' 3 ' + POW + ' 2 is 2 ' + POW + ' 9 = 512, not 8 ' + POW + ' 2 = 64.</p>',
        4: '<p>The same three steps, backwards. <b>1. Brackets:</b> find an operator with its two values right next to it (just <b>before</b> it in postfix, just <b>after</b> it in prefix) and bracket the three. A bracket then counts as one value. <b>2. Move</b> each operator: between its two values for infix, to the front for prefix, to the end for postfix. <b>3. Remove</b> the brackets (for infix, keep the ones that change the answer).</p>',
        5: '<p>Contest questions hide some *: a number written next to a letter or a bracket means multiply, so ' + b('3Q') + ' is ' + b('3 * Q') + '. First count the hidden *, then use the three steps.</p>'
      };
      game.forEach(function (n) { n.style.display = 'none'; });
      introBox.style.display = '';
      introBox.innerHTML = '<h2 class="cv-h">Level ' + (lv + 1) + ': ' + esc(lev.name) + '</h2>' + say[lv] +
        '<table class="cv-table"><tbody>' + rows.map(function (r) { return '<tr><th>' + esc(r[0]) + '</th><td>' + b(r[1]) + '</td></tr>'; }).join('') + '</tbody></table>' +
        (from === 'infix' ? '<p class="small">Prefix is the same, except step 2 moves each operator to the front: ' + b(written(ex, 'prefix', true)) + ' then ' + b(written(ex, 'prefix')) + '.</p>' : '') +
        '<p class="small">Each conversion with no mistakes counts. A mistake means that one does not count and your run starts again. ' + NEED + ' clean in a row move you up.</p>';
      var go = el('button', { type: 'button', class: 'btn' }, (again ? 'Back to it ' : 'Start ') + NL.ICON.play);
      go.addEventListener('click', function () {
        introBox.style.display = 'none';
        game.forEach(function (n) { n.style.display = ''; });
        draw();
      });
      var a = el('div', { class: 'actions' }); a.appendChild(go); introBox.appendChild(a);
      NL.reportHeight();
      void to;
    }

    if (NL.params.get('test') === '1') window.__cv = { S: function () { return S; }, row: row, key: key };
    newExpr();
  };
})();
