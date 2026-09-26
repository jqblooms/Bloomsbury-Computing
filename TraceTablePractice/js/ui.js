// Navigation between views, rendering the code and tables, checking answers, and the Write the code mode.
// ======================================================
// NAVIGATION / UI LOGIC
// ======================================================
function showPage(name, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  if(btn) btn.classList.add('active');
}

function showPrac(idx, btn) {
  document.querySelectorAll('#page-prac .prac-area').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('#page-prac .controls .btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`prac${idx}-area`).classList.add('active');
  if(btn) btn.classList.add('active');
}

function cambridgeExpression(expression) {
  return expression
    .replace(/!=/g, '<>')
    .replace(/==/g, '=')
    .replace(/\bTrue\b/g, 'TRUE')
    .replace(/\bFalse\b/g, 'FALSE')
    .replace(/\band\b/g, 'AND')
    .replace(/\bor\b/g, 'OR')
    .replace(/\bnot\b/g, 'NOT')
    .replace(/\s%\s/g, ' MOD ');
}

function cambridgeRangeEnd(stopExpression) {
  const stop = stopExpression.trim();
  const plusOne = stop.match(/^(.*)\s\+\s1$/);
  if (plusOne) return plusOne[1].trim();
  if (/^-?\d+$/.test(stop)) return (Number(stop) - 1).toString();
  return `(${cambridgeExpression(stop)}) - 1`;
}

function translatePythonToCambridge(lines) {
  const translated = [];
  const lineMap = {};
  const blocks = [];
  let skipSourceLine = 0;

  function addLine(indent, text, sourceLine) {
    translated.push(' '.repeat(Math.max(0, indent)) + text);
    if (sourceLine) lineMap[sourceLine] = translated.length;
  }

  function closeBlock(block) {
    const outputIndent = block.displayIndent === undefined ? block.indent : block.displayIndent;
    if (block.type === 'for') addLine(outputIndent, `NEXT ${block.variable}`);
    else if (block.type === 'while') addLine(outputIndent, 'ENDWHILE');
    else if (block.type === 'if') addLine(outputIndent, 'ENDIF');
  }

  function closeBlocksAtOrAbove(indent) {
    while (blocks.length && blocks[blocks.length - 1].indent >= indent) {
      closeBlock(blocks.pop());
    }
  }

  lines.forEach((rawLine, index) => {
    const sourceLine = index + 1;
    if (sourceLine === skipSourceLine) return;
    const indent = (rawLine.match(/^\s*/) || [''])[0].length;
    const text = rawLine.trim();
    const nextText = lines[index + 1] ? lines[index + 1].trim() : '';
    const isElseLine = /^else:$/.test(text) || /^elif\s+.+:$/.test(text);

    if (isElseLine) {
      while (blocks.length && blocks[blocks.length - 1].type !== 'if') {
        closeBlock(blocks.pop());
      }
    } else {
      closeBlocksAtOrAbove(indent);
    }
    const visualIndent = indent + blocks.reduce((extra, block) => {
      return extra + (block.synthetic && indent > block.sourceIndent ? 4 : 0);
    }, 0);

    let match;
    if ((match = text.match(/^for\s+(\w+)\s+in\s+range\((.*)\):$/))) {
      const variable = match[1];
      const rangeParts = match[2].split(',').map(part => part.trim());
      const start = rangeParts.length > 1 ? rangeParts[0] : '0';
      const stop = rangeParts.length > 1 ? rangeParts[1] : rangeParts[0];
      addLine(visualIndent, `FOR ${variable} <- ${cambridgeExpression(start)} TO ${cambridgeRangeEnd(stop)}`, sourceLine);
      blocks.push({ type: 'for', indent, displayIndent: visualIndent, variable });
    } else if (/^while\s+True:$/.test(text)) {
      addLine(visualIndent, 'REPEAT', sourceLine);
      blocks.push({ type: 'repeat', indent, displayIndent: visualIndent });
    } else if ((match = text.match(/^while\s+(.+):$/))) {
      addLine(visualIndent, `WHILE ${cambridgeExpression(match[1])} DO`, sourceLine);
      blocks.push({ type: 'while', indent, displayIndent: visualIndent });
    } else if ((match = text.match(/^if\s+(.+):$/)) && nextText === 'break') {
      const repeatIndex = blocks.map(block => block.type).lastIndexOf('repeat');
      const repeatBlock = blocks[repeatIndex];
      addLine(repeatBlock.displayIndent === undefined ? repeatBlock.indent : repeatBlock.displayIndent, `UNTIL ${cambridgeExpression(match[1])}`, sourceLine);
      lineMap[sourceLine + 1] = translated.length;
      blocks.splice(repeatIndex, 1);
      skipSourceLine = sourceLine + 1;
    } else if ((match = text.match(/^if\s+(.+):$/))) {
      addLine(visualIndent, `IF ${cambridgeExpression(match[1])} THEN`, sourceLine);
      blocks.push({ type: 'if', indent, displayIndent: visualIndent });
    } else if ((match = text.match(/^elif\s+(.+):$/))) {
      const parentIf = blocks[blocks.length - 1];
      const parentIndent = parentIf && parentIf.displayIndent !== undefined ? parentIf.displayIndent : indent;
      addLine(parentIndent, 'ELSE');
      addLine(parentIndent + 4, `IF ${cambridgeExpression(match[1])} THEN`, sourceLine);
      blocks.push({ type: 'if', indent: indent + 0.5, displayIndent: parentIndent + 4, synthetic: true, sourceIndent: indent });
    } else if (text === 'else:') {
      const matchingIf = blocks[blocks.length - 1];
      const elseIndent = matchingIf && matchingIf.displayIndent !== undefined ? matchingIf.displayIndent : indent;
      addLine(elseIndent, 'ELSE', sourceLine);
    } else if ((match = text.match(/^(\w+)\s*=\s*int\(input\(.*\)\)$/))) {
      addLine(visualIndent, `INPUT ${match[1]}`, sourceLine);
    } else if ((match = text.match(/^print\((.*)\)$/))) {
      addLine(visualIndent, `OUTPUT ${cambridgeExpression(match[1])}`, sourceLine);
    } else if ((match = text.match(/^(\w+)\s*=\s*(.+)$/))) {
      addLine(visualIndent, `${match[1]} <- ${cambridgeExpression(match[2])}`, sourceLine);
    } else if (text === 'break') {
      addLine(visualIndent, 'BREAK', sourceLine);
    } else {
      addLine(visualIndent, cambridgeExpression(text), sourceLine);
    }
  });

  while (blocks.length) closeBlock(blocks.pop());
  return { lines: translated, lineMap };
}

function codeView(data, language = currentCodeLanguage) {
  if (language === 'python') return { code: data.code, answers: data.answers, context: data.context };
  const converted = translatePythonToCambridge(data.code);
  const answers = data.answers.map(row => ({
    ...row,
    Line: converted.lineMap[Number(row.Line)] ? converted.lineMap[Number(row.Line)].toString() : row.Line
  }));
  return {
    code: converted.lines,
    answers,
    context: data.context.replace(/\s=\s\[/g, ' <- [')
  };
}

function remapEnteredLineValues(prefix, data, fromLanguage, toLanguage) {
  const oldAnswers = codeView(data, fromLanguage).answers;
  const newAnswers = codeView(data, toLanguage).answers;
  for (let row = 0; row < oldAnswers.length + EXTRA_ROWS; row++) {
    const input = document.querySelector(`#${prefix}-r${row}-Line input`);
    if (!input || !oldAnswers[row] || !newAnswers[row]) continue;
    if (input.value.trim() === String(oldAnswers[row].Line || '')) {
      input.value = String(newAnswers[row].Line || '');
    }
  }
}

function clearLanguageValidation() {
  document.querySelectorAll('.trace-table td.correct, .trace-table td.wrong').forEach(cell => {
    cell.classList.remove('correct', 'wrong');
  });
  document.querySelectorAll('.gutter-line.correct, .gutter-line.wrong').forEach(line => {
    line.classList.remove('correct', 'wrong');
  });
  document.querySelectorAll('.result-badge').forEach(badge => {
    badge.className = 'result-badge';
    badge.innerHTML = '';
  });
}

// Reads whatever is currently on screen for each trace-table entry back into
// progressData before a language/mode switch rebuilds the DOM, so an
// unchecked in-progress answer is never silently lost. Code-mode edits don't
// need this: the editor's input listener already saves on every keystroke.
function captureLiveTableEdits() {
  if (currentPracticeMode !== 'trace') return;
  pracData.forEach((data, index) => {
    const prefix = `prac${index}`;
    const saved = progressData.find(item => item.id === prefix);
    if (saved) {
      saved.tableData = extractTableData(prefix, data.cols, codeView(data).answers.length + EXTRA_ROWS);
      saved.codeLanguage = currentCodeLanguage;
    }
  });
  // The generator's in-progress (unchecked) table isn't persisted under the
  // question's own id, so give it a stable scratch slot to round-trip
  // through instead of losing it on a language/mode rebuild.
  if (genQuestion) {
    let liveGen = progressData.find(item => item.id === '__gen_live__');
    if (!liveGen) { liveGen = { id: '__gen_live__' }; progressData.push(liveGen); }
    liveGen.tableData = extractTableData('gen', genQuestion.cols, codeView(genQuestion).answers.length + EXTRA_ROWS);
    liveGen.codeLanguage = currentCodeLanguage;
  }
}

// Renders one practice entry (a prac0..prac6 slot, or the generator's "gen"
// slot) into its existing context/code/table-wrap containers, according to
// the current language and practice mode.
function renderPracEntry(prefix, data) {
  const view = codeView(data);
  document.getElementById(`${prefix}-context`).innerHTML = view.context;
  if (currentPracticeMode === 'code') {
    buildReadOnlyTableHtml(`${prefix}-code`, data.cols, view.answers);
    buildCodeEditorHtml(`${prefix}-table-wrap`, prefix, codeAnswers[prefix] || '', view.code, currentCodeLanguage);
  } else {
    renderPracticeCode(`${prefix}-code`, view.code);
    buildStudentTableHtml(`${prefix}-table-wrap`, prefix, data.cols, view.answers);
    const savedId = prefix === 'gen' ? '__gen_live__' : prefix;
    const saved = progressData.find(item => item.id === savedId);
    if (saved && saved.tableData) {
      restoreTableState(prefix, saved.tableData);
      if (saved.codeLanguage && saved.codeLanguage !== currentCodeLanguage) {
        remapEnteredLineValues(prefix, data, saved.codeLanguage, currentCodeLanguage);
      }
      saved.tableData = extractTableData(prefix, data.cols, view.answers.length + EXTRA_ROWS);
      saved.codeLanguage = currentCodeLanguage;
    }
  }
}

function setCodeLanguage(language) {
  if (language !== 'cambridge' && language !== 'python') return;
  captureLiveTableEdits();
  // Typed code is specific to one language; carrying it across a language
  // switch would just leave the student staring at code that can never pass
  // the new language's check. The trace-table values, by contrast, get
  // meaningfully remapped above, so those are left alone.
  if (currentPracticeMode === 'code') codeAnswers = {};
  currentCodeLanguage = language;
  localStorage.setItem(CODE_LANGUAGE_KEY, language);
  document.querySelectorAll('[data-code-language]').forEach(button => {
    const active = button.dataset.codeLanguage === language;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });

  pracData.forEach((data, index) => renderPracEntry(`prac${index}`, data));
  if (genQuestion) renderPracEntry('gen', genQuestion);

  clearLanguageValidation();
  saveProgress();
  resetWalk();
}

function setPracticeMode(mode) {
  if (mode !== 'trace' && mode !== 'code') return;
  captureLiveTableEdits();
  currentPracticeMode = mode;
  localStorage.setItem(PRACTICE_MODE_KEY, mode);
  document.querySelectorAll('[data-practice-mode]').forEach(button => {
    const active = button.dataset.practiceMode === mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  document.querySelectorAll('.check-btn').forEach(button => {
    button.textContent = mode === 'code' ? 'Check Code' : 'Check Answers';
  });

  pracData.forEach((data, index) => renderPracEntry(`prac${index}`, data));
  // Re-rendering the same generated question in the other mode would just
  // reveal its answer (the table the student was just filling in becomes
  // the read-only "given" once you flip to write-the-code, or vice versa),
  // so switching modes rolls a fresh question instead of redisplaying it.
  if (genQuestion) resetGeneratedPractice();

  clearLanguageValidation();
  saveProgress();
}

function renderPracticeCode(containerId, lines) {
  document.getElementById(containerId).innerHTML = lines.map((ln, i) => `
    <div class="code-line"><span class="line-num">${i + 1}</span><span class="line-code">${escapeHtml(ln)}</span></div>`).join('');
}

function buildReadOnlyTableHtml(containerId, cols, answers) {
  let html = `<table class="trace-table"><thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>`;
  answers.forEach(row => {
    html += `<tr>${cols.map(c => `<td>${row[c] ? escapeHtml(row[c]) : ''}</td>`).join('')}</tr>`;
  });
  html += `</tbody></table>`;
  document.getElementById(containerId).innerHTML = html;
}

// Symbols/keywords counted as "the operator" on a line, matched directly
// against the line text (not whitespace-split, since generated Python has no
// spaces around things like "range(1,limit+1):"). Multi-character operators
// are listed before the single-character class so e.g. "<-" and "==" aren't
// swallowed a character at a time by it.
const CAMBRIDGE_HINT_RE = /\b(FOR|TO|NEXT|WHILE|DO|ENDWHILE|REPEAT|UNTIL|IF|THEN|ELSE|ENDIF|INPUT|OUTPUT|BREAK|MOD|DIV|AND|OR|NOT|TRUE|FALSE)\b|<-|<>|<=|>=|[=<>+\-*/]/gi;
const PYTHON_HINT_RE = /\b(for|in|range|while|if|elif|else|break|print|input|int|and|or|not|True|False)\b|==|!=|<=|>=|\/\/|[=<>+\-*/%]/g;

// Which operator(s)/keyword(s) a line needs, without giving away the
// variable names or values around them - e.g. "total = total + i" hints
// "= +", "if score >= 5:" hints "if >=".
// A condition line (IF/WHILE/UNTIL/elif) can't be reconstructed from its
// operators alone the way every other kind of line can: the reference
// table alongside this editor proves a condition was true or false for
// the one input shown, never the exact boundary value - "Score >= 50"
// and "Score >= 49" both look identical from a single passing example.
// Every other line's own values are already fully derivable by working
// through the reference table's arithmetic by hand, so this is the one
// place a number needs to be given directly rather than worked out.
const CONDITION_LINE_RE = /\b(if|while|until|elif)\b/i;

function lineOperatorHint(line, language) {
  const re = language === 'cambridge' ? CAMBRIDGE_HINT_RE : PYTHON_HINT_RE;
  re.lastIndex = 0;
  const found = [];
  let match;
  while ((match = re.exec(line)) !== null) {
    found.push(language === 'cambridge' ? match[0].toUpperCase() : match[0]);
  }
  if (CONDITION_LINE_RE.test(line)) {
    const numbers = line.match(/-?\d+(\.\d+)?/g);
    if (numbers) found.push.apply(found, numbers);
  }
  return found.join(' ');
}

function buildCodeHintsHtml(expectedLines, language) {
  const rows = expectedLines.map((line, i) => {
    const hint = lineOperatorHint(line, language);
    const opsClass = hint ? '' : ' empty';
    return `<div class="code-hint-row"><span class="code-hint-line">${i + 1}</span><span class="code-hint-ops${opsClass}">${hint ? escapeHtml(hint) : 'no operator'}</span></div>`;
  }).join('');
  return `<div class="code-hints"><div class="code-hints-title">Operators needed per line</div>${rows}</div>`;
}

// A lightweight line-numbered code editor: a gutter of line-number divs kept
// in sync with a plain <textarea>, since a full editor library is overkill
// for regex line-matching against a known-good answer. A fixed operator-hint
// panel sits above it (fixed to the answer's own line count, unlike the
// gutter which grows with what the student has actually typed).
function buildCodeEditorHtml(containerId, prefix, savedText, expectedLines, language) {
  document.getElementById(containerId).innerHTML =
    buildCodeHintsHtml(expectedLines, language) + `
    <div class="code-editor">
      <div class="code-editor-gutter" id="${prefix}-gutter"></div>
      <textarea class="code-editor-textarea" id="${prefix}-textarea" spellcheck="false" autocomplete="off" autocapitalize="off" wrap="off"></textarea>
    </div>`;
  const textarea = document.getElementById(`${prefix}-textarea`);
  textarea.value = savedText || '';
  textarea.addEventListener('input', () => {
    syncEditorGutter(prefix);
    saveCodeAnswer(prefix, textarea.value);
  });
  textarea.addEventListener('scroll', () => syncEditorScroll(prefix));
  syncEditorGutter(prefix);
}

function syncEditorGutter(prefix) {
  const textarea = document.getElementById(`${prefix}-textarea`);
  const gutter = document.getElementById(`${prefix}-gutter`);
  if (!textarea || !gutter) return;
  const lineCount = textarea.value.split('\n').length;
  while (gutter.children.length < lineCount) {
    const div = document.createElement('div');
    div.className = 'gutter-line';
    div.textContent = gutter.children.length + 1;
    gutter.appendChild(div);
  }
  while (gutter.children.length > lineCount) {
    gutter.removeChild(gutter.lastChild);
  }
  gutter.scrollTop = textarea.scrollTop;
}

function syncEditorScroll(prefix) {
  const textarea = document.getElementById(`${prefix}-textarea`);
  const gutter = document.getElementById(`${prefix}-gutter`);
  if (textarea && gutter) gutter.scrollTop = textarea.scrollTop;
}

let codeAnswers = {};

function saveCodeAnswer(prefix, text) {
  codeAnswers[prefix] = text;
  saveProgress();
}

// Builds a forgiving regex from a known-good code line: exact tokens
// (keywords, variable names, operators, punctuation) in order, but any
// amount of whitespace between and around them. Cambridge pseudocode is
// matched case-insensitively since keyword casing is a style habit, not the
// logic being tested; Python stays case-sensitive since case is syntax there.
function buildLineRegex(expectedLine, language) {
  const tokens = expectedLine.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return /^\s*$/;
  const escaped = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = '^\\s*' + escaped.join('\\s+') + '\\s*$';
  return new RegExp(pattern, language === 'cambridge' ? 'i' : '');
}

// Operators where swapping the two operands doesn't change the result
// (Price * Quantity is the same value as Quantity * Price). Only applied
// when the line has exactly one such operator with a single token on each
// side, so a chained or compound expression is left alone rather than risk
// swapping the wrong pair.
const COMMUTATIVE_TOKENS = { cambridge: ['+', '*', 'AND', 'OR'], python: ['+', '*', 'and', 'or'] };

function commutativeLineVariant(line, language) {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  const targets = COMMUTATIVE_TOKENS[language] || [];
  const opIndexes = [];
  tokens.forEach((t, i) => {
    const compare = language === 'cambridge' ? t.toUpperCase() : t;
    if (targets.indexOf(compare) !== -1 && i > 0 && i < tokens.length - 1) opIndexes.push(i);
  });
  if (opIndexes.length !== 1) return null;
  const i = opIndexes[0];
  const swapped = tokens.slice();
  [swapped[i - 1], swapped[i + 1]] = [swapped[i + 1], swapped[i - 1]];
  return swapped.join(' ');
}

// A typed line is accepted if it matches the expected line as written, or
// (when applicable) with the operands of a single commutative operator
// swapped.
function lineMatchesExpected(typed, expected, language) {
  if (buildLineRegex(expected, language).test(typed)) return true;
  const swapped = commutativeLineVariant(expected, language);
  return swapped !== null && buildLineRegex(swapped, language).test(typed);
}

function checkCodeLines(prefix, expectedLines, language) {
  const textarea = document.getElementById(`${prefix}-textarea`);
  const typedLines = textarea ? textarea.value.replace(/\r\n/g, '\n').split('\n') : [];
  const lineResults = expectedLines.map((expected, i) => {
    const typed = typedLines[i] !== undefined ? typedLines[i] : '';
    return expected.trim() === '' ? typed.trim() === '' : lineMatchesExpected(typed, expected, language);
  });
  const gutter = document.getElementById(`${prefix}-gutter`);
  if (gutter) {
    Array.from(gutter.children).forEach((row, i) => {
      row.classList.remove('correct', 'wrong');
      if (i < lineResults.length) row.classList.add(lineResults[i] ? 'correct' : 'wrong');
    });
  }
  return { correct: lineResults.filter(Boolean).length, total: expectedLines.length };
}

function buildStudentTableHtml(containerId, prefix, cols, answers) {
  const totalRows = answers.length + EXTRA_ROWS;
  const tableClass = isSupportMode ? ' support-mode' : '';
  let html = `<table class="trace-table${tableClass}"><thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>`;
  for(let r = 0; r < totalRows; r++) {
     html += `<tr>${cols.map(c => {
       const expected = (answers[r] && answers[r][c]) ? String(answers[r][c]) : '';
       const expectedAttr = isSupportMode && expected ? ` data-expected="${escapeAttr(expected)}"` : '';
       const hint = isSupportMode
         ? `<div class="tt-hint" aria-hidden="true" oncopy="return false" oncut="return false" oncontextmenu="return false" ondragstart="return false"></div>`
         : '';
       return `<td id="${prefix}-r${r}-${c}"${expectedAttr}><input type="text" autocomplete="off" oninput="onSupportCellInput(this)">${hint}</td>`;
     }).join('')}</tr>`;
  }
  html += `</tbody></table>`;
  document.getElementById(containerId).innerHTML = html;
  if (isSupportMode) {
    document.querySelectorAll(`#${containerId} .trace-table td[data-expected]`).forEach(renderCellHint);
  }
}
