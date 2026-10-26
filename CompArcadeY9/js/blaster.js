// Bit Flick Blaster: a block with a bit-string equation falls down the well. Type every x that makes it true
// (use * for a bit that can be 0 or 1) and blast it before it lands. A wrong answer or a block that lands costs a
// life; three lives. Each block cleared makes the next one harder and faster. Best score kept in this browser.
var BitBlaster = (function () {
  'use strict';
  var el = CA.el, esc = CA.esc;
  var LIVES = 3;

  function start(host) {
    host.innerHTML = '';
    var top = el('div', { class: 'topline' });
    top.appendChild(el('div', { class: 'game-name' }, 'Bit Flick Blaster <span>Solve for x before the block lands</span>'));
    var bar = el('div', { class: 'scorebar' }, CA.chip(CA.ICON.star, 'Score', 'bb-score') + CA.chip(CA.ICON.bolt, 'Block', 'bb-wave') +
      CA.chip(CA.ICON.trophy, 'Best', 'bb-best') + '<span class="chip lives" id="bb-lives" aria-label="Lives"></span>');
    top.appendChild(bar);
    host.appendChild(top);
    var stage = el('div', { class: 'stage' });
    host.appendChild(stage);
    var best = CA.load('blaster-best', 0);
    CA.setChip(bar, 'bb-best', best);
    hearts(LIVES);
    intro();

    function hearts(n) {
      var h = bar.querySelector('#bb-lives');
      h.innerHTML = '';
      for (var i = 0; i < LIVES; i++) h.appendChild(el('span', { class: 'heart' + (i < n ? '' : ' lost') }, CA.ICON.heart));
      h.setAttribute('aria-label', n + ' lives left');
    }
    function intro() {
      stage.innerHTML = '';
      var card = el('div', { class: 'card intro' });
      card.innerHTML = '<h2>Blast the blocks</h2><ul class="facts">' +
        '<li>Each block is an equation with an unknown 5-bit string <code>x</code>. Type <b>every</b> x that makes it true.</li>' +
        '<li>Use <code>*</code> for a bit that can be 0 or 1. Example form: <code>1*0*1</code></li>' +
        '<li>A wrong answer costs a life. A block that lands costs a life. You have 3.</li>' +
        '<li>Each block you clear makes the next one harder and faster. Faster blasts score more.</li></ul>';
      var go = el('button', { type: 'button', class: 'btn big' }, CA.ICON.bolt + '<span>Start blasting</span>');
      go.addEventListener('click', run);
      card.appendChild(el('div', { class: 'actions' })).appendChild(go);
      stage.appendChild(card);
      CA.reportHeight();
    }

    function run() {
      var s = { score: 0, cleared: 0, lives: LIVES, wrong: 0, landed: 0, blocks: 0 };
      var over = false, timer = null, q = null, startedAt = 0, fallMs = 0, busy = false;
      hearts(s.lives);
      stage.innerHTML = '';
      var wrap = el('div', { class: 'blaster' });
      var well = el('div', { class: 'well' });
      var block = el('div', { class: 'block' });
      var danger = el('div', { class: 'danger' });
      well.appendChild(block); well.appendChild(danger);
      var side = el('div', { class: 'side' });
      var prompt = el('p', { class: 'q-prompt small' }, 'Type every 5-bit x that makes the block true. Use * for a bit that can be 0 or 1.');
      var ans = CA.answerRow('bb-answer', 'x =', fire);
      var go = el('button', { type: 'button', class: 'btn' }, CA.ICON.bolt + '<span>Blast</span>');
      go.addEventListener('click', fire);
      ans.row.appendChild(go);
      var fb = el('div', { class: 'feedback', role: 'status' });
      var order = el('p', { class: 'muted small' }, 'Order: NOT, shifts and circulates first, then AND, then XOR, then OR.');
      side.appendChild(prompt); side.appendChild(ans.row); side.appendChild(fb); side.appendChild(order);
      wrap.appendChild(well); wrap.appendChild(side);
      stage.appendChild(wrap);
      drop();
      CA.reportHeight();

      function level() { return Math.min(4, 1 + Math.floor(s.cleared / 2)); }
      function draw() {
        CA.setChip(bar, 'bb-score', s.score);
        CA.setChip(bar, 'bb-wave', s.blocks);
        CA.setChip(bar, 'bb-best', Math.max(best, s.score));
        hearts(s.lives);
      }
      function drop() {
        if (over) return;
        busy = false;
        s.blocks++;
        q = CAGen.bitsSolve(level());
        fallMs = Math.max(25, 60 - s.cleared * 4) * 1000;
        block.className = 'block';
        block.innerHTML = '<span class="lv">Level ' + level() + '</span><code>' + esc(q.code) + '</code>';
        block.style.top = '0px';
        startedAt = Date.now();
        ans.input.value = '';
        ans.input.disabled = false;
        CA.focus(ans.input);
        draw();
        if (timer) clearTimeout(timer);
        tick();
      }
      function tick() {
        if (over) return;
        var f = Math.min(1, (Date.now() - startedAt) / fallMs);
        var room = Math.max(0, well.clientHeight - block.offsetHeight - 6);
        block.style.top = Math.round(f * room) + 'px';
        block.classList.toggle('near', f > 0.75);
        if (f >= 1) { land(); return; }
        timer = setTimeout(tick, 100);
      }
      function fire() {
        if (over || busy || !ans.input.value.trim()) return;
        if (CA.accept(q, ans.input.value)) {
          busy = true;
          if (timer) clearTimeout(timer);
          var left = Math.max(0, 1 - (Date.now() - startedAt) / fallMs);
          var gain = 50 * level() + Math.round(50 * left);
          s.score += gain; s.cleared++;
          block.className = 'block blasted';
          fb.className = 'feedback';
          fb.innerHTML = 'Blasted! <b>+' + gain + '</b> x = <code>' + esc(q.answer) + '</code>';
          CA.pop(bar.querySelector('#bb-score'), '+' + gain);
          draw();
          setTimeout(drop, 700);
        } else {
          s.wrong++;
          lose('That x does not fit every bit. Try again: the block is still falling.');
          block.classList.remove('shake'); void block.offsetWidth; block.classList.add('shake');
          ans.input.select();
        }
      }
      function land() {
        busy = true;
        s.landed++;
        block.className = 'block landed';
        lose('It landed. The answer was x = ' + q.answer + '.');
        if (!over) setTimeout(drop, 2200);
      }
      function lose(msg) {
        s.lives--;
        fb.className = 'feedback error';
        fb.textContent = msg;
        draw();
        if (s.lives <= 0) finish();
      }
      function finish() {
        if (over) return;
        over = true;
        if (timer) clearTimeout(timer);
        ans.input.disabled = true;
        var newBest = s.score > best;
        if (newBest) { best = s.score; CA.save('blaster-best', best); }
        draw();
        stage.innerHTML = '';
        var res = el('div', { class: 'card result' });
        res.innerHTML = '<h2>' + (newBest && s.score > 0 ? 'New personal best!' : 'Game over') + '</h2>' +
          '<div class="big-stats"><div><b>' + s.score + '</b><span>score</span></div><div><b>' + s.cleared + '</b><span>blocks blasted</span></div>' +
          '<div><b>' + level() + '</b><span>level reached</span></div></div>' +
          '<p class="small">Last block: <code>' + esc(q.code) + '</code> x = <code class="ok">' + esc(q.answer) + '</code></p>';
        var again = el('button', { type: 'button', class: 'btn' }, CA.ICON.again + '<span>Play again</span>');
        again.addEventListener('click', function () { run(); });
        res.appendChild(el('div', { class: 'actions' })).appendChild(again);
        stage.appendChild(res);
        CA.report('arcade-blaster', 'Bit Flick Blaster', 'Bit Flick Blaster: score ' + s.score + ', ' + s.cleared + ' blocks blasted, level ' + level() + ' reached, ' + s.wrong + ' wrong answers. Best ' + best + '.', s.blocks > 0);
        CA.reportHeight();
      }
    }
  }
  return { start: start };
})();
