// Progress saved in this browser.
// ======================================================
// LOCAL STORAGE & PROGRESS TRACKING
// ======================================================
const TODAY_KEY = 'traceTableProgress_v10_light_' + new Date().toISOString().split('T')[0];
let progressData = [];
let genStats = { score: 0, streak: 0, maxStreak: 0 };
let genQuestionIdCounter = 0;

function initProgress() {
  const stored = localStorage.getItem(TODAY_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    progressData = parsed.questions || [];
    genStats = parsed.stats || { score: 0, streak: 0, maxStreak: 0 };
    codeAnswers = parsed.codeAnswers || {};

    let maxGen = 0;
    progressData.forEach(p => {
      if (p.id && p.id.startsWith('gen')) {
        let num = parseInt(p.id.replace('gen', ''));
        if (!isNaN(num) && num > maxGen) maxGen = num;
      }
    });
    genQuestionIdCounter = maxGen;
  } else {
    progressData = [
      { id: 'prac0', title: 'Practice 1', attempts: 0, correct: false, tableData: null, codeSnippet: null },
      { id: 'prac1', title: 'Practice 2', attempts: 0, correct: false, tableData: null, codeSnippet: null },
      { id: 'prac2', title: 'Practice 3', attempts: 0, correct: false, tableData: null, codeSnippet: null },
      { id: 'prac3', title: 'Practice 4', attempts: 0, correct: false, tableData: null, codeSnippet: null },
      { id: 'prac4', title: 'Practice 5', attempts: 0, correct: false, tableData: null, codeSnippet: null },
      { id: 'prac5', title: 'Sequence Foundations', attempts: 0, correct: false, tableData: null, codeSnippet: null },
      { id: 'prac6', title: 'Selection Foundations', attempts: 0, correct: false, tableData: null, codeSnippet: null }
    ];
    saveProgress();
  }
  updateStatsUI();
}

function saveProgress() {
  localStorage.setItem(TODAY_KEY, JSON.stringify({
    questions: progressData,
    stats: genStats,
    codeAnswers: codeAnswers
  }));
}

function recordAttempt(id, title, isCorrect, tableData, codeSnippet) {
  let q = progressData.find(p => p.id === id);
  if (!q) {
    q = { id, title, attempts: 0, correct: false, tableData: null, codeSnippet: null };
    progressData.push(q);
  }
  q.attempts += 1;
  q.correct = isCorrect;
  q.tableData = tableData;
  q.codeSnippet = codeSnippet;
  q.codeLanguage = currentCodeLanguage;
  saveProgress();
}

function updateStatsUI() {
  const badge = document.getElementById('gen-stats-display');
  badge.textContent = `Score: ${genStats.score} | Streak: ${genStats.streak} | Max Streak: ${genStats.maxStreak}`;
}

function extractTableData(prefix, cols, totalRows) {
  let data = [];
  for(let r = 0; r < totalRows; r++) {
    let rowData = [];
    cols.forEach(c => {
      let td = document.getElementById(`${prefix}-r${r}-${c}`);
      rowData.push(td && td.querySelector('input') ? td.querySelector('input').value : '');
    });
    data.push(rowData);
  }
  return { headers: cols, rows: data };
}

function restoreTableState(prefix, tableData) {
  if (!tableData || !tableData.rows) return;
  for (let r = 0; r < tableData.rows.length; r++) {
    for (let c = 0; c < tableData.headers.length; c++) {
      let td = document.getElementById(`${prefix}-r${r}-${tableData.headers[c]}`);
      if (td && td.querySelector('input')) td.querySelector('input').value = tableData.rows[r][c] || '';
    }
  }
}
