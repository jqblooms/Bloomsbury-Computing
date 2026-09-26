// The walkthrough and the fixed practice questions.
// ======================================================
// WALKTHROUGH LOGIC
// ======================================================
let currentWalkIdx = 5;
let walkStep = 0;

function selectWalkAlgo(idx, btn) {
   currentWalkIdx = idx;
   document.querySelectorAll('#page-walk .controls .btn').forEach(b => b.classList.remove('active'));
   if(btn) btn.classList.add('active');
   resetWalk();
}

function resetWalk() {
   walkStep = 0;
   const algo = walkData[currentWalkIdx];
   const view = codeView(algo);
   document.getElementById('walk-context').innerHTML = view.context;
   renderPracticeCode('walk-code', view.code);
   document.getElementById('walk-thead').innerHTML = `<tr>${algo.cols.map(c => `<th>${c}</th>`).join('')}</tr>`;
   document.getElementById('walk-tbody').innerHTML = '';
}

function stepWalk() {
   const algo = walkData[currentWalkIdx];
   const view = codeView(algo);
   if(walkStep >= view.answers.length) return;
   const stepData = view.answers[walkStep];

   const lines = document.querySelectorAll('#walk-code .code-line');
   lines.forEach(l => l.classList.remove('active'));
   if(lines[parseInt(stepData.Line) - 1]) lines[parseInt(stepData.Line) - 1].classList.add('active');

   const tr = document.createElement('tr');
   algo.cols.forEach(c => {
     const td = document.createElement('td');
     td.textContent = stepData[c];
     if (stepData[c] !== '') td.style.color = 'var(--correct)';
     tr.appendChild(td);
   });
   document.getElementById('walk-tbody').appendChild(tr);
   const tableScroll = document.getElementById('walk-table-scroll');
   tableScroll.scrollTop = tableScroll.scrollHeight;
   walkStep++;
}

// ======================================================
// STATIC PRACTICE LOGIC
// ======================================================
function checkPractice(idx) {
  if (currentPracticeMode === 'code') return checkPracticeCode(idx);
  const data = pracData[idx];
  const view = codeView(data);
  const prefix = `prac${idx}`;
  const totalRows = view.answers.length + EXTRA_ROWS;
  let correct = 0; let total = 0;

  for(let r = 0; r < totalRows; r++) {
    const row = view.answers[r] || {};
    data.cols.forEach(k => {
       const td = document.getElementById(`${prefix}-r${r}-${k}`);
       if(!td) return;
       const expected = (row[k] || '').toString().trim().toLowerCase().replace(/\s+/g,' ');
       const given = td.querySelector('input').value.trim().toLowerCase().replace(/\s+/g,' ');
       td.className = '';
       if(given === expected) {
         if(given !== '') td.classList.add('correct');
         correct++;
       } else if(given !== '') td.classList.add('wrong');
       // A cell left blank never gets a red box here, even when it should
       // have held a value (still counted wrong below, just not shown
       // that way) - a red box only where blank is genuinely blank vs.
       // needs a value would draw the exact shape of the answer key
       // across the table, telling a student which cells to fill before
       // they have worked that out themselves, the one thing this
       // exercise is meant to test. A cell they actually typed something
       // into still gets marked right or wrong as normal.
       total++;
    });
  }

  const isCorrect = (correct === total);
  const practiceTitle = data.title || `Practice ${idx + 1}`;
  recordAttempt(`prac${idx}`, practiceTitle, isCorrect, extractTableData(prefix, data.cols, totalRows), view.code);
  reportPracticeProgress(`prac${idx}`, practiceTitle, isCorrect);
  recordSupportOutcome(isCorrect);

  const badge = document.getElementById(`${prefix}-result`);
  badge.className = `result-badge show ${isCorrect ? 'pass' : 'fail'}`;
  badge.innerHTML = isCorrect ? `✓ Perfect! ${correct}/${total} correct.` : `✗ ${correct}/${total} correct. A red cell is wrong; a blank cell might still need a value, review the whole table.`;
}

function checkPracticeCode(idx) {
  const data = pracData[idx];
  const view = codeView(data);
  const prefix = `prac${idx}`;
  const { correct, total } = checkCodeLines(prefix, view.code, currentCodeLanguage);
  const isCorrect = correct === total;
  const practiceTitle = data.title || `Practice ${idx + 1}`;
  recordAttempt(prefix, practiceTitle, isCorrect, null, view.code);
  reportPracticeProgress(prefix, practiceTitle, isCorrect);

  const badge = document.getElementById(`${prefix}-result`);
  badge.className = `result-badge show ${isCorrect ? 'pass' : 'fail'}`;
  badge.innerHTML = isCorrect ? `✓ Perfect! ${correct}/${total} lines correct.` : `✗ ${correct}/${total} lines correct. Check the red line numbers.`;
}
