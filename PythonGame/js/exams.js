// The stage exams and GCSE questions: showing a question, marking it, the results.
async function startGCSEExam(id, btnElement) {
    id = String(id);

    const btn = btnElement;
    let originalText = "";
    if (btn) { originalText = btn.innerHTML; btn.innerText = "Loading..."; }

    state.inExam = true; state.activeExamId = `gcse_${id}`; state.examStartTime = Date.now();
    try {
        const url = id.startsWith('http') ? id : GCSE_EXAM_URLS[id];
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load GCSE exam");
        const data = await res.json();
        state.examQuestions = data.questions;
        state.currentExamIndex = 0; state.examAnswers = [];
        els.menuScreen.classList.remove('active'); els.examScreen.classList.add('active'); renderExamQuestion();

        document.getElementById('exam-title').innerText = data.title || 'FINAL EXAM';
        document.getElementById('exam-q-total').innerText = data.questions.length;

    } catch (e) { console.error(e); alert("Error: " + e.message); state.inExam = false; }
    finally { if (btn) btn.innerHTML = originalText; }
}

async function startExam(id, btnElement) {
    id = String(id);

    const btn = btnElement;
    let originalText = "";
    if (btn) { originalText = btn.innerHTML; btn.innerText = "Loading..."; }

    state.inExam = true; state.activeExamId = id; state.examStartTime = Date.now();
    try {
        let data = null;
        if (id === 'custom') {
            data = state.customExamData;
        } else {
            const url = id.startsWith('http') ? id : EXAM_URLS[id];
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to load exam");
            data = await res.json();
        }

        document.getElementById('exam-title').innerText = data.title || 'FINAL EXAM';
        document.getElementById('exam-q-total').innerText = data.questions.length;

        state.examQuestions = data.questions;
        state.currentExamIndex = 0; state.examAnswers = [];
        els.menuScreen.classList.remove('active'); els.examScreen.classList.add('active'); renderExamQuestion();
    } catch (e) { console.error(e); alert("Error: " + e.message); state.inExam = false; }
    finally { if (btn && id !== 'custom') btn.innerHTML = originalText; }
}

function renderExamQuestion() {
    const q = state.examQuestions[state.currentExamIndex]; els.examQNum.innerText = state.currentExamIndex + 1; const container = els.examContainer; container.innerHTML = '';
    const p = document.createElement('p'); p.className = 'exam-prompt'; p.innerHTML = q.prompt; container.appendChild(p);
    if (q.codeHtml) { const c = document.createElement('div'); c.className = 'exam-code'; c.innerHTML = q.codeHtml; container.appendChild(c); }
    if (q.type === 'ident' || q.type === 'mcq') {
        const optsDiv = document.createElement('div'); optsDiv.className = 'exam-options';
        let opts = [...q.options || q.optionsRaw].sort(() => Math.random() - 0.5);
        opts.forEach(opt => {
            const btn = document.createElement('button'); btn.className = 'btn btn-option'; btn.innerText = opt;
            btn.onclick = () => { Array.from(optsDiv.children).forEach(b => b.removeAttribute('data-selected')); btn.setAttribute('data-selected', 'true'); };
            optsDiv.appendChild(btn);
        });
        container.appendChild(optsDiv);
    } else {
        const area = document.createElement('textarea'); area.className = 'exam-textarea'; area.id = 'exam-input';
        area.placeholder = "";
        container.appendChild(area);
    }
}

function submitExamAnswer() {
    const q = state.examQuestions[state.currentExamIndex]; let userAnswer = null; let isCorrect = false;
    if (q.type === 'ident' || q.type === 'mcq') {
        const selectedBtn = els.examContainer.querySelector('button[data-selected="true"]'); if (!selectedBtn) return;
        userAnswer = selectedBtn.innerText; isCorrect = userAnswer === q.correct;
    } else {
        const val = document.getElementById('exam-input').value.trim(); userAnswer = val;
        if (q.type === 'text') {
            const lines = val.split('\n').filter(l => l.trim() !== '');
            if (lines.length >= 2) {
                const cLine = lines[0].toLowerCase(); const codeLine = lines[1].replace(/'/g, '"');
                const k1 = q.keywords[0].toLowerCase(); const k2 = q.keywords[1].toLowerCase();
                isCorrect = cLine.startsWith('#') && cLine.includes(k1) && cLine.includes(k2) && codeLine === q.correctCode.replace(/'/g, '"');
            }

        } else if (q.type === 'text_simple') {
            const answer = val.trim();
            if (q.useRegex) {
                isCorrect = new RegExp(q.correctCode).test(answer);
            } else {
                isCorrect = answer === q.correctCode;
            }
        }
        else if (q.type === 'extended') {
            const lines = val.split('\n').map(l => l.trim()).filter(l => l !== '');
            if (lines.length >= q.tasks.length * 2) {
                let all = true;
                for (let i = 0; i < q.tasks.length; i++) {
                    const task = q.tasks[i]; const cLower = (lines[i * 2] || "").toLowerCase(); const code = lines[i * 2 + 1] || "";
                    if (!cLower.startsWith('#') || !cLower.includes(task.noun)) all = false;
                    if (!code.startsWith('print(')) all = false;
                    const content = code.substring(code.indexOf('(') + 1, code.lastIndexOf(')')).trim();
                    if (content.length === 0) { all = false; break; }
                    if (!/^["'].+["']$/.test(content)) { if (task.noun === 'age' || task.noun === 'number') { if (isNaN(parseInt(content))) { all = false; break; } } else { all = false; break; } }
                }
                isCorrect = all;
            }
        } else if (q.type === 'text_var') { isCorrect = checkVarAssign(val, q.targetVar, q.isString); }
        else if (q.type === 'text_var_com') {
            const lines = val.split('\n').filter(l => l.trim() !== '');
            if (lines.length >= 2) {
                const cLine = lines[0].toLowerCase();
                let kw = true; q.keywords.forEach(k => { if (!cLine.includes(k)) kw = false; });
                if (kw) isCorrect = checkVarAssign(lines[1], q.targetVar, q.isString);
            }
        } else if (q.type === 'text_var_print') {
            const lines = val.split('\n').filter(l => !l.trim().startsWith("#") && l.trim() !== "");
            if (lines.length >= 2) {
                if (checkVarAssign(lines[0], q.targetVar, q.isString)) {
                    const p = lines[1].trim(); if (p === `print(${q.targetVar})`) isCorrect = true;
                }
            }
        } else if (q.type === 'text_var_print_multi') {
            const lines = val.split('\n').filter(l => !l.trim().startsWith("#") && l.trim() !== "");
            if (lines.length >= 2) {
                if (checkVarAssign(lines[0], q.targetVar, q.isString)) {
                    const p = lines[1].trim();
                    if (p.startsWith('print(') && p.endsWith(')') && p.includes(',') && p.includes(q.targetVar)) isCorrect = true;
                }
            }
        } else if (q.type === 'extended_run') {
            const inputs = state.extendedRunInputs || [];
            validateExtendedRun(q, val, inputs).then(result => {
                isCorrect = result;
                state.examAnswers.push({ q, user: userAnswer, correct: isCorrect });
                state.currentExamIndex++;
                if (state.currentExamIndex < state.examQuestions.length) {
                    renderExamQuestion();
                } else {
                    finishExam();
                }
            });
            return; // Exit early - async handles the rest
        }
    }
    state.examAnswers.push({ q: q, user: userAnswer, correct: isCorrect });
    state.currentExamIndex++; if (state.currentExamIndex < state.examQuestions.length) { renderExamQuestion(); } else { finishExam(); }
}

function checkVarAssign(line, name, isString) {
    const parts = line.split('=');
    // Accept bare conversion expression e.g. float(score), int(score)
    if (parts.length === 1) {
        const expr = line.trim();
        if (!isString && /^(int|float)\s*\(\s*\w+\s*\)$/.test(expr)) return true;
        if (isString && /^str\s*\(\s*\w+\s*\)$/.test(expr)) return true;
        return false;
    }
    if (parts[0].trim() !== name) return false;
    const v = parts.slice(1).join('=').trim();
    // Literal values
    if (isString && /^["'].+["']$/.test(v)) return true;
    if (!isString && !isNaN(Number(v))) return true;
    // String input
    if (isString && /^input\s*\(.*\)$/.test(v)) return true;
    // Number input with int() or float() casting
    if (!isString && /^(int|float)\s*\(\s*input\s*\(.*\)\s*\)$/.test(v)) return true;
    // Conversion expression assigned e.g. score = float(score)
    if (!isString && /^(int|float)\s*\(\s*\w+\s*\)$/.test(v)) return true;
    if (isString && /^str\s*\(\s*\w+\s*\)$/.test(v)) return true;
    return false;
}

function finishExam() {
    const score = state.examAnswers.filter(a => a.correct).length;
    if (!gameStats.exams[state.activeExamId]) gameStats.exams[state.activeExamId] = { attempts: 0, bestScore: 0, lastScore: 0, improvement: 0, lastAnswers: [] };
    const st = gameStats.exams[state.activeExamId];
    const prevScore = st.lastScore;
    st.attempts++;
    st.lastScore = score;
    st.total = state.examQuestions.length;
    if (score > st.bestScore) st.bestScore = score;
    st.improvement = score - prevScore;

    // Store per-question breakdown
    st.lastAnswers = state.examAnswers.map((a, i) => ({
        q: i + 1,
        prompt: a.q.prompt,
        type: a.q.type,
        correct: a.correct,
        user: a.user || null
    }));

    saveStats();

    const examDurationMs = state.examStartTime ? (Date.now() - state.examStartTime) : 0;
    postToParent({
        type: 'PG_PROGRESS', kind: 'exam', examId: state.activeExamId,
        score, total: state.examQuestions.length, duration: examDurationMs
    });

    els.examScreen.classList.remove('active');
    els.examResultsScreen.classList.add('active');
    els.examFinalScore.innerText = `${score}/${state.examQuestions.length}`;

    const list = els.examFeedbackList;
    list.innerHTML = '';
    state.examAnswers.forEach((a, i) => {
        const item = document.createElement('div');
        item.className = `result-item ${a.correct ? 'correct' : 'wrong'}`;
        item.innerHTML = `<div class="result-q">Q${i + 1}: ${a.q.prompt}</div><div class="result-user">Your answer: ${a.user || "Nothing"}</div>${!a.correct ? `<div class="result-fix">Fix: ${a.q.explanation}</div>` : ''}`;
        list.appendChild(item);
    });
}
