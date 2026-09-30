// Bug Hunt: find the error, say what kind it is, fix it.
//   level=code: a Cambridge Pseudocode algorithm (programs.js) with one error. The tests beside it run the algorithm
//     as shown, so a syntax error shows up as an error message and a logic error as the wrong output. The student
//     clicks the line, says syntax or logic, then types the corrected line, which is checked by running every test.
//   level=flow: a flowchart (flows.js) with one wrong box. Click it, then choose the change that puts it right.
// Support (off until switched on) shows how: the failing test is outlined and some correct lines are dimmed, then
// the corrected line sits faded under the box to type over; for flowcharts some correct boxes are dimmed and some
// wrong changes ruled out. It fades as the student gets them right (bc-support.js).
// Nothing here uses requestAnimationFrame: a lesson preloads the app in a hidden iframe.
(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  var LEVEL = params.get('level') === 'flow' ? 'flow' : 'code';
  var GOAL = 6;
  var app = document.getElementById('app');
  var support = window.BCSupport;

  function el(tag, attrs, html) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'class') node.className = attrs[k];
      else if (k.indexOf('on') === 0) node.addEventListener(k.slice(2), attrs[k]);
      else node.setAttribute(k, attrs[k]);
    });
    if (html != null) node.innerHTML = html;
    return node;
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var ICON = {
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8.6 16.6 13.2 12 8.6 7.4 10 6l6 6-6 6z"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6 11-11-1.4-1.4z"/></svg>'
  };

  function reportHeight() {
    if (window.parent === window) return;
    var main = document.querySelector('main');
    try { window.parent.postMessage({ type: 'TT_CONTENT_HEIGHT', height: Math.ceil(main.getBoundingClientRect().height) + 16 }, '*'); } catch (e) {}
  }
  if (window.ResizeObserver) new ResizeObserver(reportHeight).observe(document.querySelector('main'));

  // ---------------------------------------------------------------- shared page frame
  var fixedCount = 0;
  var head = el('div', { class: 'hunt-head' });
  head.appendChild(el('h1', null, LEVEL === 'flow' ? 'Bug Hunt: Flowcharts' : 'Bug Hunt: Pseudocode'));
  head.appendChild(el('div', { class: 'spacer' }));
  var tally = el('span', { class: 'tally' });
  head.appendChild(tally);
  if (support) support.mountToggle(head);
  var body = el('div');
  app.appendChild(head);
  app.appendChild(body);
  function updateTally() {
    tally.innerHTML = 'Errors fixed: <b>' + fixedCount + '</b>' + (fixedCount < GOAL ? ' of ' + GOAL : '');
  }
  function supportOn() { return !!(support && support.isOn()); }
  function fader(key) {
    return support ? support.fader('bughunt:' + key) : { reveal: function () { return 0; }, correct: function () {}, wrong: function () {} };
  }

  function purposeBox(text, stored) {
    return el('div', { class: 'purpose' }, '<span class="label">What it should do</span>' + esc(text) +
      (stored ? '<div class="stored">' + esc(stored) + '</div>' : ''));
  }

  // Picks `count` of `list` at random (for dimming lines or boxes support has ruled out).
  function sample(list, count) {
    var a = list.slice(), out = [];
    while (out.length < count && a.length) out.push(a.splice(Math.floor(Math.random() * a.length), 1)[0]);
    return out;
  }

  if (LEVEL === 'code') codeLevel(); else flowLevel();

  // ================================================================ level 1: pseudocode
  function codeLevel() {
    var KW = /\b(DECLARE|INTEGER|REAL|STRING|BOOLEAN|INPUT|OUTPUT|IF|THEN|ELSE|ENDIF|FOR|TO|NEXT|WHILE|DO|ENDWHILE|TRUE|FALSE|ARRAY|OF)\b/g;
    function highlight(line) {
      // Strings first, so words inside quotes are never coloured as keywords.
      return line.split(/("[^"]*")/).map(function (part) {
        if (/^"[^"]*"$/.test(part)) return '<span class="str">' + esc(part) + '</span>';
        return esc(part).replace(/\b(\d+)\b/g, '<span class="numlit">$1</span>').replace(KW, '<span class="kw">$1</span>');
      }).join('');
    }
    var findFader = fader('code-find'), fixFader = fader('code-fix');
    var r, stage, lines, wrongPicks, dimmed, lastTried, lastTemplate = null, results;

    function newRound() {
      r = BugPrograms.round(lastTemplate);
      lastTemplate = r.template;
      stage = 'find';
      lines = r.lines.slice();
      wrongPicks = [];
      lastTried = null;
      results = BugPrograms.trial(r);
      chooseDim();
      render();
    }
    function chooseDim() {
      var fine = lines.map(function (_, i) { return i; }).filter(function (i) { return i !== r.bug.line; });
      dimmed = sample(fine, Math.max(0, Math.min(fine.length - 2, Math.round(findFader.reveal() * fine.length * 0.7))));
    }

    function render() {
      updateTally();
      body.innerHTML = '';
      body.appendChild(purposeBox(r.purpose, r.stored));
      var grid = el('div', { class: 'hunt-grid' });
      var code = el('div', { class: 'code' + (stage === 'find' ? '' : ' locked'), role: 'group', 'aria-label': 'The algorithm, one button per line' });
      lines.forEach(function (text, i) {
        var cls = 'code-line';
        if (i === r.bug.line && stage !== 'find') cls += stage === 'done' ? ' fixed' : ' found';
        else if (stage === 'find' && wrongPicks.indexOf(i) !== -1) cls += ' picked-wrong';
        else if (stage === 'find' && supportOn() && dimmed.indexOf(i) !== -1) cls += ' dim';
        var b = el('button', { type: 'button', class: cls, 'aria-label': 'Line ' + (i + 1) + ': ' + text.trim() },
          '<span class="num">' + String(i + 1).padStart(2, '0') + '</span><span>' + highlight(text) + '</span>');
        if (stage === 'find') b.addEventListener('click', function () { pickLine(i); });
        else b.tabIndex = -1;
        code.appendChild(b);
      });
      grid.appendChild(code);
      var side = el('div');
      side.appendChild(testsView());
      side.appendChild(stepView());
      grid.appendChild(side);
      body.appendChild(grid);
      reportHeight();
    }

    function outputsText(list) { return list.length ? list.map(String).join('\n') : '(no output)'; }
    // One row per test. A syntax error cannot run at all, so its message is shown once under the table.
    function testsView() {
      var spot = supportOn() && stage === 'find' ? results.findIndex(function (x) { return !x.pass; }) : -1;
      var anyInputs = r.tests.some(function (t) { return t.inputs.length; });
      var table = el('table', { class: 'tests' });
      table.innerHTML = '<thead><tr><th>Test</th><th>' + (anyInputs ? 'Inputs' : 'Data') + '</th><th>Should output</th><th>Actually</th></tr></thead>';
      var tbody = el('tbody');
      var errorNote = null;
      r.tests.forEach(function (t, i) {
        var res = results[i];
        var given = t.inputs.length ? t.inputs.join(', ') : (t.label || '').replace(/^\w+ = /, '');
        if (res.error) errorNote = 'Error on line ' + res.error.line + ': ' + res.error.message;
        var row = el('tr', { class: (res.pass ? 'pass' : 'fail') + (i === spot ? ' spot' : '') });
        row.innerHTML = '<td>' + (i + 1) + ' <span class="verdict ' + (res.pass ? 'good">&#10003;' : 'bad">&#10007;') + '</span></td>' +
          '<td><code>' + esc(given) + '</code></td><td><code>' + esc(outputsText(t.expect)) + '</code></td>' +
          '<td><code>' + esc(res.error ? 'Error' : outputsText(res.outputs)) + '</code></td>';
        tbody.appendChild(row);
      });
      table.appendChild(tbody);
      var box = el('div');
      box.appendChild(table);
      if (errorNote) box.appendChild(el('p', { class: 'error-note' }, esc(errorNote)));
      return box;
    }

    var feedbackText = '', feedbackKind = '';
    function say(text, kind) { feedbackText = text; feedbackKind = kind || ''; }

    function stepView() {
      var step = el('div', { class: 'step' });
      var fb = el('div', { class: 'feedback ' + feedbackKind, role: 'status' }, esc(feedbackText));
      if (stage === 'find') {
        step.appendChild(el('p', { class: 'step-q' }, 'Click the line with the error.'));
      } else if (stage === 'kind') {
        step.appendChild(el('p', { class: 'step-q' }, 'Line ' + (r.bug.line + 1) + ' has the error. What kind of error is it?'));
        var row = el('div', { class: 'row' });
        [['syntax', 'Syntax error'], ['logic', 'Logic error']].forEach(function (o) {
          row.appendChild(el('button', { type: 'button', class: 'choice', onclick: function () { pickKind(o[0]); } }, o[1]));
        });
        step.appendChild(row);
      } else if (stage === 'fix') {
        step.appendChild(el('p', { class: 'step-q' }, 'Correct line ' + (r.bug.line + 1) + '. The tests run again with your line.'));
        var row2 = el('div', { class: 'row' });
        var input = el('input', { class: 'fix-input', id: 'fix-input', type: 'text', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Corrected line ' + (r.bug.line + 1) });
        input.value = lines[r.bug.line].trim();
        var btn = el('button', { type: 'button', class: 'btn' }, ICON.check + '<span>Check</span>');
        btn.addEventListener('click', function () { tryFix(input.value); });
        input.addEventListener('keydown', function (e) { if (e.key === 'Enter') tryFix(input.value); });
        row2.appendChild(input);
        row2.appendChild(btn);
        step.appendChild(row2);
        var hint = el('div', { class: 'hint-box' });
        step.appendChild(hint);
        var model = r.correct[r.bug.line].trim();
        var drawHint = function () {
          hint.innerHTML = '';
          if (supportOn() && fixFader.reveal() > 0) support.renderTypedHint(hint, model, input.value.trim(), fixFader.reveal(), 'The corrected line');
          reportHeight();
        };
        input.addEventListener('input', drawHint);
        drawHint();
        setTimeout(function () { try { input.focus({ preventScroll: true }); } catch (e) {} }, 0);
      } else {
        step.appendChild(el('p', { class: 'step-q' }, fixedCount === GOAL ? 'That is ' + GOAL + ' errors found and fixed. Keep going for more practice.' : 'Fixed. Every test now gives the right output.'));
        var next = el('button', { type: 'button', class: 'btn secondary' }, '<span>Next algorithm</span>' + ICON.next);
        next.addEventListener('click', function () { say(''); newRound(); });
        step.appendChild(next);
        setTimeout(function () { try { next.focus({ preventScroll: true }); } catch (e) {} }, 0);
      }
      step.appendChild(fb);
      return step;
    }

    function pickLine(i) {
      if (i === r.bug.line) {
        if (!wrongPicks.length) findFader.correct();
        stage = 'kind';
        say('');
      } else {
        if (wrongPicks.indexOf(i) === -1) { wrongPicks.push(i); findFader.wrong(); }
        say(r.bug.kind === 'syntax'
          ? 'Line ' + (i + 1) + ' is correct. The tests could not run the algorithm: read the error message to see where it stopped.'
          : 'Line ' + (i + 1) + ' is correct. Take a test that is wrong and follow its inputs through the algorithm one line at a time. Look for the first line that does not do what the purpose asks.', 'error');
      }
      render();
    }
    function pickKind(kind) {
      if (kind === r.bug.kind) { stage = 'fix'; say(''); }
      else if (kind === 'syntax') say('Look at the tests: the algorithm ran and gave an output, just the wrong one. It breaks no rule of writing pseudocode.', 'error');
      else say('Look at the tests: the algorithm could not run at all. The line breaks a rule of writing pseudocode.', 'error');
      render();
    }
    function tryFix(text) {
      text = String(text || '').trim();
      if (!text) { say('Type the corrected line first.', 'hint'); render(); return; }
      var indent = (r.lines[r.bug.line].match(/^\s*/) || [''])[0];
      var outcome = BugPrograms.check(r, r.bug.line, indent + text);
      var fresh = text !== lastTried;
      lastTried = text;
      if (outcome.ok) {
        if (fresh) fixFader.correct();
        lines[r.bug.line] = indent + text;
        results = outcome.results;
        fixedCount++;
        stage = 'done';
        say('');
      } else {
        if (fresh) fixFader.wrong();
        results = outcome.results;
        var bad = outcome.results.findIndex(function (x) { return !x.pass; });
        var res = outcome.results[bad];
        say(res.error
          ? 'With your line the algorithm stops on line ' + res.error.line + ': ' + res.error.message
          : 'Not yet: test ' + (bad + 1) + ' outputs ' + outputsText(res.outputs).replace(/\n/g, ', ') + ' but should output ' + outputsText(r.tests[bad].expect).replace(/\n/g, ', ') + '.', 'error');
      }
      render();
      var input = document.getElementById('fix-input');
      if (input && stage === 'fix') input.value = text;
    }

    if (support) support.onChange(function () { if (r) { chooseDim(); render(); } });
    newRound();
  }

  // ================================================================ level 2: flowcharts
  function flowLevel() {
    if (typeof mermaid !== 'undefined') {
      mermaid.initialize({
        startOnLoad: false, theme: 'base',
        themeVariables: { primaryColor: '#1d2128', primaryBorderColor: '#8a94a6', primaryTextColor: '#e8eaed', lineColor: '#8ab4f8', edgeLabelBackground: '#171a20', fontFamily: 'JetBrains Mono, ui-monospace, monospace' },
        flowchart: { curve: 'linear', htmlLabels: true, nodeSpacing: 50, rankSpacing: 40, padding: 12, useMaxWidth: true }
      });
    }
    var WRAP = { terminal: ['([', '])'], process: ['[', ']'], io: ['[/', '/]'], decision: ['{', '}'] };
    var findFader = fader('flow-find'), fixFader = fader('flow-fix');
    var r, stage, wrongPicks, dimmed, ruledOut, lastKind = null, renderSeq = 0;

    function label(text, pad) {
      var e = esc(text);
      return '"' + (pad ? '&nbsp;&nbsp;' + e + '&nbsp;&nbsp;' : e) + '"';
    }
    function nodeLine(n, cls) {
      var w = WRAP[n.shape];
      return '  ' + n.id + w[0] + label(n.text, n.shape === 'io') + w[1] + (cls ? ':::' + cls : '');
    }
    function source() {
      var c = r.chart, out = ['flowchart TD'];
      function cls(n) {
        if (n.id === r.bug.node && stage !== 'find') return stage === 'done' ? 'fixedNode' : 'foundNode';
        if (stage === 'find' && wrongPicks.indexOf(n.id) !== -1) return 'wrongPick';
        if (stage === 'find' && supportOn() && dimmed.indexOf(n.id) !== -1) return 'dimNode';
        return '';
      }
      out.push(nodeLine({ id: 'startNode', shape: 'terminal', text: 'Start' }));
      var prev = 'startNode';
      if (c.kind === 'sequence') {
        c.nodes.forEach(function (n) { out.push(nodeLine(n, cls(n))); out.push('  ' + prev + ' --> ' + n.id); prev = n.id; });
        out.push(nodeLine({ id: 'endNode', shape: 'terminal', text: 'End' }));
        out.push('  ' + prev + ' --> endNode');
      } else {
        c.pre.forEach(function (n) { out.push(nodeLine(n, cls(n))); out.push('  ' + prev + ' --> ' + n.id); prev = n.id; });
        out.push(nodeLine(c.decision, cls(c.decision)));
        out.push('  ' + prev + ' --> ' + c.decision.id);
        c.yes.concat(c.no, c.post).forEach(function (n) { out.push(nodeLine(n, cls(n))); });
        out.push(nodeLine({ id: 'endNode', shape: 'terminal', text: 'End' }));
        var after = c.post.length ? c.post[0].id : 'endNode';
        out.push('  ' + c.decision.id + ' -->|Yes| ' + c.yes[0].id);
        out.push('  ' + c.decision.id + ' -->|No| ' + c.no[0].id);
        out.push('  ' + c.yes[0].id + ' --> ' + after);
        out.push('  ' + c.no[0].id + ' --> ' + after);
        if (c.post.length) out.push('  ' + c.post[0].id + ' --> endNode');
      }
      out.push('  classDef foundNode stroke:#f28b82,stroke-width:4px;');
      out.push('  classDef wrongPick stroke:#f28b82,stroke-width:2px,stroke-dasharray:5 4;');
      out.push('  classDef fixedNode stroke:#81c995,stroke-width:4px;');
      out.push('  classDef dimNode opacity:0.35;');
      return out.join('\n');
    }

    function newRound() {
      r = BugFlows.round(lastKind);
      lastKind = r.bug.kind;
      stage = 'find';
      wrongPicks = [];
      ruledOut = [];
      chooseDim();
      render();
    }
    function chooseDim() {
      var fine = BugFlows.allNodes(r.chart).map(function (n) { return n.id; }).filter(function (id) { return id !== r.bug.node; });
      dimmed = sample(fine, Math.max(0, Math.min(fine.length - 1, Math.round(findFader.reveal() * fine.length * 0.7))));
    }

    var feedbackText = '', feedbackKind = '';
    function say(text, kind) { feedbackText = text; feedbackKind = kind || ''; }

    function render() {
      updateTally();
      body.innerHTML = '';
      body.appendChild(purposeBox(r.purpose));
      var grid = el('div', { class: 'hunt-grid' });
      var wrap = el('div', { class: 'flow-wrap', id: 'flow' });
      grid.appendChild(wrap);
      var side = el('div');
      side.appendChild(stepView());
      side.appendChild(el('p', { class: 'flow-legend' }, 'Terminal: Start and End. Process: store or calculate a value. Input/Output: ask for or display a value. Decision: a Yes/No question.'));
      grid.appendChild(side);
      body.appendChild(grid);
      drawChart(wrap);
      reportHeight();
    }

    // Mermaid measures text as it lays out, so it can only draw while the page is visible.
    function drawChart(wrap) {
      var seq = ++renderSeq;
      if (typeof mermaid === 'undefined') { wrap.textContent = 'The flowchart could not be drawn. Reload the page to try again.'; return; }
      if (!document.documentElement.getBoundingClientRect().width) { setTimeout(function () { if (seq === renderSeq) drawChart(wrap); }, 400); return; }
      mermaid.render('bughunt-flow-' + seq, source()).then(function (out) {
        if (seq !== renderSeq) return;
        wrap.innerHTML = out.svg;
        BugFlows.allNodes(r.chart).forEach(function (n) {
          var g = wrap.querySelector('[id^="flowchart-' + n.id + '-"]');
          if (!g) return;
          g.setAttribute('tabindex', stage === 'find' ? '0' : '-1');
          g.setAttribute('role', 'button');
          g.setAttribute('aria-label', n.text);
          if (stage !== 'find') { g.style.cursor = 'default'; return; }
          g.addEventListener('click', function () { pickNode(n.id); });
          g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickNode(n.id); } });
        });
        reportHeight();
      }).catch(function () { wrap.textContent = 'The flowchart could not be drawn. Reload the page to try again.'; });
    }

    function stepView() {
      var step = el('div', { class: 'step' });
      var fb = el('div', { class: 'feedback ' + feedbackKind, role: 'status' }, esc(feedbackText));
      if (stage === 'find') {
        step.appendChild(el('p', { class: 'step-q' }, 'Click the box with the error.'));
      } else if (stage === 'fix') {
        step.appendChild(el('p', { class: 'step-q' }, 'How do you fix the outlined box?'));
        var list = el('div', { class: 'choices' });
        var hide = supportOn() ? supportRuledOut() : [];
        r.bug.options.forEach(function (o, i) {
          var b = el('button', { type: 'button', class: 'choice' + (ruledOut.indexOf(i) !== -1 ? ' wrong' : '') }, esc(o));
          if (ruledOut.indexOf(i) !== -1 || hide.indexOf(i) !== -1) b.disabled = true;
          else b.addEventListener('click', function () { pickFix(i); });
          list.appendChild(b);
        });
        step.appendChild(list);
      } else {
        step.appendChild(el('p', { class: 'step-q' }, fixedCount === GOAL ? 'That is ' + GOAL + ' errors found and fixed. Keep going for more practice.' : 'Fixed. The flowchart now does what the purpose says.'));
        var next = el('button', { type: 'button', class: 'btn secondary' }, '<span>Next flowchart</span>' + ICON.next);
        next.addEventListener('click', function () { say(''); newRound(); });
        step.appendChild(next);
      }
      step.appendChild(fb);
      return step;
    }
    // Support rules out some wrong changes, always leaving at least one wrong one in play.
    var supportHidden = null;
    function supportRuledOut() {
      if (supportHidden) return supportHidden;
      var wrong = r.bug.options.map(function (_, i) { return i; }).filter(function (i) { return i !== r.bug.answer && ruledOut.indexOf(i) === -1; });
      supportHidden = sample(wrong, Math.max(0, Math.min(wrong.length - 1, Math.round(fixFader.reveal() * (wrong.length - 1) + (fixFader.reveal() > 0 ? 0.4 : 0)))));
      return supportHidden;
    }

    var HOW = {
      shape: 'Match the shape to what the box does: ask for or display a value is Input/Output, store or calculate is Process, a Yes/No question is Decision.',
      comparison: 'Read the purpose again, and try a value exactly on the boundary: which question sends it down the Yes path?',
      branch: 'Follow the Yes path, then the No path, and compare each with what the purpose says should happen.',
      ask: 'Before a value can be compared or used, the algorithm has to get it from the user.',
      calc: 'Read the purpose again: which two values are multiplied?',
      display: 'Read the purpose again: which value should the user see at the end?'
    };
    function pickNode(id) {
      if (id === r.bug.node) {
        if (!wrongPicks.length) findFader.correct();
        stage = 'fix';
        supportHidden = null;
        say('');
      } else {
        if (wrongPicks.indexOf(id) === -1) { wrongPicks.push(id); findFader.wrong(); }
        say('That box is correct. Check each box against the purpose: is it the right shape for what it does, and does it say what the purpose asks for?', 'error');
      }
      render();
    }
    function pickFix(i) {
      if (i === r.bug.answer) {
        if (!ruledOut.length) fixFader.correct();
        var target = BugFlows.allNodes(r.chart).filter(function (n) { return n.id === r.bug.node; })[0];
        target.shape = r.fixed.shape; target.text = r.fixed.text;
        fixedCount++;
        stage = 'done';
        say('');
      } else {
        if (ruledOut.indexOf(i) === -1) { ruledOut.push(i); fixFader.wrong(); }
        say('Not that one. ' + HOW[r.bug.kind], 'error');
      }
      render();
    }

    if (support) support.onChange(function () { if (r) { chooseDim(); supportHidden = null; render(); } });
    newRound();
  }
})();
