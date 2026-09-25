// Stats (Persistent & Dated)
const STATS_KEY = 'pythonDefenseHistory';
let globalHistory = {};
let gameStats = getFreshStats();

var NUM_LEVELS = 52;
var NUM_EXAMS = 7;
var NUM_GCSE_EXAMS = 10; // increment as you add them
const BASE = "https://raw.githubusercontent.com/jquinney-hue/pythongamejsons/refs/heads/main/";

const LEVEL_URLS = Object.fromEntries(
    Array.from({ length: NUM_LEVELS }, (_, i) => [i + 1, `${BASE}testlevel${i + 1}.json`])
);

const EXAM_URLS = Object.fromEntries(
    Array.from({ length: NUM_EXAMS }, (_, i) => [i + 1, `${BASE}stage${i + 1}exam.json`])
);

const GCSE_EXAM_URLS = Object.fromEntries(
    Array.from({ length: NUM_GCSE_EXAMS }, (_, i) => [i + 1, `${BASE}gcseexam${i + 1}.json`])
);

function savePython() {
    const code = pythonEditor.getValue();
    const name = promptFilename('save');
    if (!name) return;

    const blob = new Blob([code], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
}

function loadPython() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.py';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            pythonEditor.setValue(e.target.result);
        };
        reader.readAsText(file);
    };
    input.click();
}

function promptFilename(action) {
    const raw = prompt(`Enter filename:`, 'untitled.py');
    if (raw === null) return null;
    const name = raw.trim();
    if (!name) return null;
    return name.endsWith('.py') ? name : name + '.py';
}

let hardMode = false;

function toggleHardMode() {
    hardMode = !hardMode;
    const toggle = document.getElementById('hard-mode-toggle');
    const knob = document.getElementById('hard-mode-knob');
    toggle.style.background = hardMode ? 'var(--accent-green)' : '#444';
    knob.style.left = hardMode ? '25px' : '3px';
    knob.style.background = hardMode ? '#fff' : '#aaa';
}

let hintMode = false;

function toggleHintMode() {
    hintMode = !hintMode;
    const toggle = document.getElementById('hint-mode-toggle');
    const knob = document.getElementById('hint-mode-knob');
    toggle.style.background = hintMode ? 'var(--accent-green)' : '#444';
    knob.style.left = hintMode ? '25px' : '3px';
    knob.style.background = hintMode ? '#fff' : '#aaa';
}

let menuPage = 1;

function setMenuPage(pageNum) {
    // Hide all pages
    document.getElementById('menu-page-1').style.display = 'none';
    document.getElementById('menu-page-2').style.display = 'none';
    document.getElementById('menu-page-3').style.display = 'none';

    // Show selected page
    document.getElementById('menu-page-' + pageNum).style.display = 'grid';

    // Reset button colors (example logic)
    for (let i = 1; i <= 3; i++) {
        const btn = document.getElementById('menu-btn-' + i);
        btn.style.background = (i === pageNum) ? 'var(--accent-green)' : '#444';
    }
}

function getFreshStats() {
    let s = {
        totalTimePlayed: 0,
        levels: {},
        exams: {
            1: { attempts: 0, bestScore: 0, lastScore: 0 },
            2: { attempts: 0, bestScore: 0, lastScore: 0 }
        }
    };
    for (let i = 1; i <= NUM_LEVELS; i++) {
        s.levels[i] = { highScore: 0, timePlayed: 0, correct: 0, incorrect: 0 };
    }
    return s;
}

function getTodayKey() {
    return new Date().toLocaleDateString('en-CA'); // Returns YYYY-MM-DD
}

function loadStats() {
    const stored = localStorage.getItem(STATS_KEY);
    const today = getTodayKey();

    if (stored) {
        try {
            globalHistory = JSON.parse(stored);
        } catch (e) {
            console.error("Save file corrupted, resetting.");
            globalHistory = {};
        }
    }
    if (!globalHistory[today]) { globalHistory[today] = getFreshStats(); }
    gameStats = globalHistory[today];

    if (!gameStats.levels) gameStats.levels = {};
    for (let i = 1; i <= NUM_LEVELS; i++) {
        if (!gameStats.levels[i]) gameStats.levels[i] = { highScore: 0, timePlayed: 0, correct: 0, incorrect: 0 };
    }
    if (!gameStats.exams) gameStats.exams = {};
    for (let i = 1; i <= NUM_EXAMS; i++) {
        if (!gameStats.exams[i]) gameStats.exams[i] = { attempts: 0, bestScore: 0, lastScore: 0, improvement: 0, lastAnswers: [] };
    }
    for (let i = 1; i <= NUM_GCSE_EXAMS; i++) {
        const key = `gcse_${i}`;
        if (!gameStats.exams[key]) gameStats.exams[key] = { attempts: 0, bestScore: 0, lastScore: 0, improvement: 0, lastAnswers: [] };
    }
}

function saveStats() {
    const today = getTodayKey();
    globalHistory[today] = gameStats;
    localStorage.setItem(STATS_KEY, JSON.stringify(globalHistory));
}

function startSession() {
    state.sessionStartTime = Date.now();
    state.sessionCorrect = 0;
    state.sessionIncorrect = 0;
}

function endSession() {
    if (!state.sessionStartTime || state.inExam) return;
    const durationSec = Math.floor((Date.now() - state.sessionStartTime) / 1000);
    const lvl = state.level;
    if (state.level === 'custom') return;

    if (!gameStats.levels[lvl]) gameStats.levels[lvl] = { highScore: 0, timePlayed: 0, correct: 0, incorrect: 0 };
    gameStats.levels[lvl].timePlayed += durationSec;
    gameStats.levels[lvl].correct += state.sessionCorrect;
    gameStats.levels[lvl].incorrect += state.sessionIncorrect;
    if (state.score > gameStats.levels[lvl].highScore) gameStats.levels[lvl].highScore = state.score;
    gameStats.totalTimePlayed += durationSec;
    saveStats();

    // Push this session up to the parent so it lands in the
    // Progress sheet instead of staying local-only in this
    // browser's localStorage.
    postToParent({
        type: 'PG_PROGRESS', kind: 'level', level: lvl, score: state.score,
        duration: durationSec * 1000, correct: state.sessionCorrect, wrong: state.sessionIncorrect
    });
    state.sessionStartTime = 0;
}
loadStats();

const CONFIG = { spawnRate: 2500, baseSpeed: 0.1, ceilingDrop: 50, dangerThreshold: 150 };
let state = {
    isPlaying: false, level: 1, stage: 1, isHard: false, score: 0, blocks: [], selectedBlockId: null,
    lastSpawnTime: 0, ceilingY: 0, gameSpeed: 0, levelBaseSpeed: 0, wellDoneTimeout: null, animationFrameId: null,
    currentOptions: [], sessionStartTime: 0, sessionCorrect: 0, sessionIncorrect: 0,
    inExam: false, activeExamId: 1, examStartTime: 0, examQuestions: [], currentExamIndex: 0, examAnswers: [],
    waitingForInput: false, inputBlockId: null,
    customLevelData: null, customExamData: null, loadingType: 'level'
};

const els = {
    menuScreen: document.getElementById('menu-screen'), helpScreen: document.getElementById('help-screen'), gameOverScreen: document.getElementById('game-over-screen'),
    examScreen: document.getElementById('exam-screen'), examResultsScreen: document.getElementById('exam-results-screen'),
    gameArea: document.getElementById('game-area'), ceiling: document.getElementById('ceiling'), dangerOverlay: document.getElementById('danger-overlay'), logicNotice: document.getElementById('logic-notice'), wellDoneMsg: document.getElementById('well-done-msg'),
    score: document.getElementById('score'), level: document.getElementById('level'), stage: document.getElementById('stage'), finalScore: document.getElementById('final-score'),
    controlsText: document.getElementById('controls-text'), controlsMCQ: document.getElementById('controls-mcq'), controlsMulti: document.getElementById('controls-multi'),
    inputLabel: document.getElementById('input-label'), inputLabelMulti: document.getElementById('input-label-multi'),
    codeInput: document.getElementById('code-input'), codeArea: document.getElementById('code-input-area'),
    optBtns: [document.getElementById('opt-0'), document.getElementById('opt-1'), document.getElementById('opt-2'), document.getElementById('opt-3')],
    examContainer: document.getElementById('exam-container'), examQNum: document.getElementById('exam-q-num'), examFeedbackList: document.getElementById('exam-feedback-list'), examFinalScore: document.getElementById('exam-final-score'),
    examTitle: document.getElementById('exam-title'), examQTotal: document.getElementById('exam-q-total'),
    consoleBar: document.getElementById('console-bar'), consoleHistory: document.getElementById('console-history'), consoleInputWrapper: document.getElementById('console-input-wrapper'), consoleRealInput: document.getElementById('console-real-input')
};

// --- JSON LOADER ---
function openLoadLevelModal(type) {
    state.loadingType = type;
    const title = type === 'exam' ? "LOAD CUSTOM EXAM" : "LOAD CUSTOM LEVEL";
    document.querySelector('#load-level-modal h2').innerText = title;
    setLoadTab('url');
    document.getElementById('load-level-modal').classList.add('active');
    document.getElementById('level-url-input').focus();
}
function closeLoadLevelModal() { document.getElementById('load-level-modal').classList.remove('active'); }

async function submitCustomLevel(rawJson = null) {
    let data;

    if (rawJson) {
        try {
            data = JSON.parse(rawJson);
        } catch (e) {
            alert("Error loading JSON: " + e.message);
            return;
        }
    } else {
        const url = document.getElementById('level-url-input').value.trim();
        if (!url) return;

        const btn = document.querySelector('#load-level-modal .btn-level');
        const originalText = btn.innerText;
        btn.innerText = "LOADING..."; btn.disabled = true;

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error("Fetch failed: " + res.status);
            data = await res.json();
        } catch (e) {
            alert("Error loading JSON: " + e.message);
            return;
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }

    try {
        if (state.loadingType === 'exam') {
            if (!data.questions) throw new Error("Invalid Exam JSON: Missing 'questions'");
        } else {
            if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
                throw new Error("Invalid Level JSON: Must contain 'questions' array.");
            }
        }

        closeLoadLevelModal();

        if (state.loadingType === 'exam') {
            state.customExamData = data;
            startExam('custom', null);
        } else {
            state.customLevelData = data;
            startGame('custom', false, null);
        }
    } catch (e) {
        alert("Error loading JSON: " + e.message);
    }
}

let currentLoadTab = 'url';

function setLoadTab(tab) {
    currentLoadTab = tab;
    document.getElementById('load-tab-url').style.display = tab === 'url' ? '' : 'none';
    document.getElementById('load-tab-json').style.display = tab === 'json' ? '' : 'none';
}

function submitCustomLevelAuto() {
    if (currentLoadTab === 'json') {
        const raw = document.getElementById('level-json-input').value.trim();
        if (!raw) return;
        submitCustomLevel(raw);
    } else {
        submitCustomLevel();
    }
}

function logToConsole(msg) {
    const line = document.createElement('div');
    line.className = 'console-line';
    line.innerText = msg;
    line.classList.add('new');
    els.consoleHistory.appendChild(line);
    els.consoleBar.scrollTop = els.consoleBar.scrollHeight;
}

function generateBlockData(level) {
    const id = Date.now() + Math.random().toString();
    let data = { id: id, y: 0, x: 30 + Math.random() * 40, level: level };
    const sourceData = state.customLevelData;
    if (sourceData && sourceData.questions) {
        const q = sourceData.questions[Math.floor(Math.random() * sourceData.questions.length)];
        data = { ...data, ...q, id: id, y: 0, x: data.x };
        if (!data.html) data.html = `<span style="font-size:0.9rem">Question</span>`;
        if (!data.correctCode) data.correctCode = "pass";
    }
    return data;
}

function updateCeilingVisual() { els.ceiling.style.top = `${state.ceilingY}px`; }
function showFloatingText(x, y, text, color) {
    const el = document.createElement('div'); el.className = 'float-text'; el.innerText = text; el.style.color = color;
    el.style.left = x + 'px'; el.style.top = y + 'px'; els.gameArea.appendChild(el); setTimeout(() => el.remove(), 1000);
}

function gameLoop(timestamp) {
    if (!state.isPlaying) return;
    const deltaTime = timestamp - state.lastSpawnTime;
    if (!powerupState.iceFrozen && deltaTime > CONFIG.spawnRate / Math.max(0.1, state.gameSpeed * 2)) {
        if (spawnBlock()) state.lastSpawnTime = timestamp;
    }
    const areaHeight = els.gameArea.clientHeight;
    const ceilingLimit = state.ceilingY;
    let highestBlockTop = areaHeight;
    state.blocks.forEach(block => {
        if (!powerupState.iceFrozen) {
            block.y += state.gameSpeed;
        }
        const topPos = areaHeight - block.y - block.el.clientHeight;
        block.el.style.top = `${topPos}px`;
        if (topPos < highestBlockTop) highestBlockTop = topPos;
        if (topPos <= ceilingLimit + els.ceiling.clientHeight) gameOver();
    });
    const distanceToCeiling = highestBlockTop - ceilingLimit;
    if (distanceToCeiling < CONFIG.dangerThreshold) els.dangerOverlay.classList.add('flashing');
    else els.dangerOverlay.classList.remove('flashing');
    state.animationFrameId = requestAnimationFrame(gameLoop);
}

function calculateStage(score) {
    if (score < 20) return 1; if (score < 35) return 2; if (score < 55) return 3;
    let currentStage = 3; let threshold = 55; let gap = 25;
    while (score >= threshold) { currentStage++; threshold += gap; gap += 5; }
    return currentStage;
}

function handleSuccess(block, fromPowerup = false) {
    if (!block) return;
    const x = block.el.offsetLeft; const y = block.el.offsetTop;
    block.el.remove(); state.blocks = state.blocks.filter(b => b.id !== block.id);
    const points = state.isHard ? 2.5 : 1; state.score += points; els.score.innerText = state.score;
    state.stage = calculateStage(state.score); els.stage.innerText = state.stage;
    const steps = Math.floor(state.score / 5);
    let multiplier = 0.10 + (steps * 0.10);
    const maxMultiplier = state.isHard ? 7.5 : 4.5;
    if (multiplier > maxMultiplier) multiplier = maxMultiplier;
    state.gameSpeed = state.levelBaseSpeed * multiplier;
    showFloatingText(x, y, "+" + points, "#6a9955");

    if (!fromPowerup) {
        incrementStreak();
    }

    if (state.blocks.length === 0) { showWellDone(); spawnBlock(); state.lastSpawnTime = performance.now(); }
    if (state.blocks.length > 0) {
        const nextBlock = state.blocks.reduce((prev, current) => (prev.y > current.y) ? prev : current);
        selectBlock(null, nextBlock.id);
    } else {
        state.selectedBlockId = null;
        updateButtons();
        if (els.controlsText.classList.contains('active-flex')) els.codeInput.blur();
        if (els.controlsMulti.classList.contains('active-flex')) els.codeArea.blur();
    }
}

function handleFailure(block) {
    resetStreak()
    state.ceilingY += CONFIG.ceilingDrop; updateCeilingVisual();
    block.el.style.borderColor = "var(--accent-red)"; setTimeout(() => block.el.style.borderColor = block.el.classList.contains('selected') ? "#fff" : "#444", 500);
    showFloatingText(block.el.offsetLeft, block.el.offsetTop, "WRONG!", "#f44336");
    els.gameArea.style.transform = "translateX(5px)"; setTimeout(() => els.gameArea.style.transform = "translateX(-5px)", 50); setTimeout(() => els.gameArea.style.transform = "none", 100);
}

function processResult(isCorrect, output = null) {
    if (!state.waitingForInput) hideLogicNotice();
    if (isCorrect) {
        state.sessionCorrect++;
        if (output !== null) logToConsole(output);
        handleSuccess(state.blocks.find(b => b.id === state.selectedBlockId));
    }
    else {
        state.sessionIncorrect++;
        handleFailure(state.blocks.find(b => b.id === state.selectedBlockId));
        updateButtons();
    }
}

async function startGame(levelNum, hardMode = false, btnElement) {
    cleanupPowerups();

    const btn = btnElement;
    let originalText = "";
    if (btn) { originalText = btn.innerHTML; btn.innerText = "LOADING..."; }

    state.isPlaying = true; state.level = levelNum; state.stage = 1; state.isHard = hardMode; state.score = 0; state.blocks = []; state.selectedBlockId = null; state.ceilingY = 0;
    state.waitingForInput = false; state.inputBlockId = null;

    try {
        if (levelNum !== 'custom') {
            const url = LEVEL_URLS[levelNum];
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to load level " + levelNum);
            state.customLevelData = await res.json();
        }
        startSession();
        let base = CONFIG.baseSpeed;
        if (hardMode) base = base * 2.5;
        state.levelBaseSpeed = base; state.gameSpeed = state.levelBaseSpeed * 0.10;

        const allPanels = document.querySelectorAll('.control-panel');
        allPanels.forEach(p => { p.classList.remove('active-flex', 'active-grid'); p.style.display = ''; });
        els.consoleBar.innerHTML = '<div id="console-history"></div><div id="console-input-wrapper"><span id="console-prompt">&gt;</span><input type="text" id="console-real-input" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></div>';
        els.consoleHistory = document.getElementById('console-history');
        els.consoleInputWrapper = document.getElementById('console-input-wrapper');
        els.consoleRealInput = document.getElementById('console-real-input');
        els.consoleBar.classList.remove('console-flash');

        els.consoleRealInput.addEventListener("keypress", function (event) { if (event.key === "Enter") handleConsoleInput(); });
        els.consoleBar.addEventListener("click", function () { if (state.waitingForInput) els.consoleRealInput.focus(); });

        const type = state.customLevelData.type || 'text';
        if (type === 'mcq') { els.controlsMCQ.classList.add('active-grid'); }
        else if (type === 'multiline' || type === 'multistep' || type === 'var_print') {
            els.controlsMulti.classList.add('active-flex');
            els.inputLabelMulti.innerText = state.customLevelData.inputLabel || "Type code:";
            els.codeArea.placeholder = ""; els.codeArea.value = "";
        } else {
            els.controlsText.classList.add('active-flex');
            els.inputLabel.innerText = state.customLevelData.inputLabel || "Type the code:";
            els.codeInput.value = "";
        }

        els.menuScreen.classList.remove('active'); els.helpScreen.classList.remove('active'); els.gameOverScreen.classList.remove('active'); els.examScreen.classList.remove('active');
        hideLogicNotice(); document.querySelectorAll('.code-block').forEach(b => b.remove());
        els.score.innerText = "0"; els.stage.innerText = "1"; els.level.innerText = (state.level === 'custom' ? 'Custom' : state.level) + (state.isHard ? " (H)" : "");
        els.dangerOverlay.classList.remove('flashing'); updateCeilingVisual(); updateButtons();
        state.lastSpawnTime = performance.now(); state.animationFrameId = requestAnimationFrame(gameLoop);
        spawnBlock();
    } catch (e) { console.error(e); alert("Error starting game: " + e.message); state.isPlaying = false; }
    finally { if (btn) btn.innerHTML = originalText; }
}

function gameOver() {
    if (!state.isPlaying) return;
    endSession(); state.isPlaying = false; cancelAnimationFrame(state.animationFrameId);
    els.finalScore.innerText = state.score; els.gameOverScreen.classList.add('active');
    hideLogicNotice(); els.codeInput.blur(); els.codeArea.blur();
    state.waitingForInput = false; els.consoleBar.classList.remove('console-flash');
}

function spawnBlock() {
    if (state.waitingForInput) return false;
    const data = generateBlockData(state.level);
    const el = document.createElement('div'); el.className = 'code-block'; el.innerHTML = data.html;
    el.style.left = `${data.x}%`;
    el.addEventListener('mousedown', (e) => selectBlock(e, data.id));
    el.addEventListener('touchstart', (e) => { e.preventDefault(); selectBlock(e, data.id); });
    els.gameArea.appendChild(el);
    const height = el.clientHeight; el.style.top = (els.gameArea.clientHeight - height) + 'px';
    const rect = el.getBoundingClientRect(); let overlap = false;
    for (const block of state.blocks) {
        const otherRect = block.el.getBoundingClientRect();
        if (!(rect.right < otherRect.left || rect.left > otherRect.right || rect.bottom < otherRect.top || rect.top > otherRect.bottom)) { overlap = true; break; }
    }
    if (overlap) { el.remove(); return false; }
    state.blocks.push({ id: data.id, el: el, data: data, y: 0 });
    if (state.blocks.length === 1) selectBlock(null, data.id);
    return true;
}

function selectBlock(e, id) {
    if (!state.isPlaying) return;
    if (state.waitingForInput) return;

    if (state.selectedBlockId === id) {
        const type = state.customLevelData.type || 'text';
        if (type !== 'mcq' && type !== 'multiline' && type !== 'multistep' && type !== 'var_print') els.codeInput.focus();
        if (type === 'multiline' || type === 'multistep' || type === 'var_print') els.codeArea.focus();
        return;
    }
    if (state.selectedBlockId) {
        const prev = state.blocks.find(b => b.id === state.selectedBlockId);
        if (prev) prev.el.classList.remove('selected');
    }
    state.selectedBlockId = id;
    const curr = state.blocks.find(b => b.id === id);
    if (curr) {
        curr.el.classList.add('selected');
        const type = state.customLevelData.type || 'text';

        if (type === 'mcq') {
            updateLevel3Buttons(curr);
        } else if (type === 'multiline' || type === 'multistep' || type === 'var_print') {
            els.codeArea.value = ""; setTimeout(() => els.codeArea.focus(), 10);
            handleCustomHints(curr);
        } else {
            els.codeInput.value = ""; setTimeout(() => els.codeInput.focus(), 10);
            handleCustomHints(curr);
        }
    }
    updateButtons();
}

function handleCustomHints(block) {
    if (!hintMode) {
        hideLogicNotice();
        return;
    }
    if (block.data.notice) {
        showLogicNotice(block.data.notice);
    } else if (block.data.typoWord && block.data.originalWord) {
        showLogicNotice(`"${block.data.typoWord}" is spelled wrong, the correct spelling is "${block.data.originalWord}"`);
    } else {
        hideLogicNotice();
    }
}

function updateLevel3Buttons(block) {
    let opts = block.data.optionsRaw ? [...block.data.optionsRaw] : ["?", "?", "?", "?"];
    for (let i = opts.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[opts[i], opts[j]] = [opts[j], opts[i]]; }
    state.currentOptions = opts;
    for (let i = 0; i < 4; i++) if (els.optBtns[i]) els.optBtns[i].innerText = opts[i] || "";
}

function showLogicNotice(text) { els.logicNotice.innerHTML = text; els.logicNotice.classList.add('active'); }
function hideLogicNotice() { els.logicNotice.classList.remove('active'); }
function showWellDone() {
    clearTimeout(state.wellDoneTimeout); els.wellDoneMsg.classList.add('active');
    state.wellDoneTimeout = setTimeout(() => { els.wellDoneMsg.classList.remove('active'); }, 2000);
}

function updateButtons() {
    const hasSelection = state.selectedBlockId !== null;
    if (hasSelection) { /* Styles handle focus */ }
    const type = state.customLevelData ? state.customLevelData.type : '';
    if (type === 'mcq') {
        const op = hasSelection ? "1" : "0.5";
        els.optBtns.forEach(b => b.style.opacity = op);
    }
}

function buildRegex(pattern) {
    const anchored = pattern.startsWith('^') || pattern.endsWith('$');
    return new RegExp(anchored ? pattern : '^' + pattern + '$');
}

function submitTextAnswer() {
    if (!state.selectedBlockId) return;
    const block = state.blocks.find(b => b.id === state.selectedBlockId);
    const input = els.codeInput.value.trim();

    const isMatch = block.data.useRegex
        ? buildRegex(block.data.correctCode).test(input)
        : input === block.data.correctCode;

    if (!isMatch) { processResult(false); els.codeInput.value = ""; return; }

    const codeToRun = block.data.useRegex ? input : block.data.correctCode;
    const match = codeToRun.match(/input\s*\(\s*["'](.+?)["']\s*\)/);

    if (match) {
        block._runnableCode = codeToRun;
        triggerConsoleInput(block, match[1]);
        els.codeInput.value = "";
        return;
    }

    runRealPython(codeToRun, [], block).then(({ output }) => {
        output.forEach(line => logToConsole(line));
        processResult(true);
    }).catch(e => {
        logToConsole("Error: " + e);
        processResult(false);
    });

    els.codeInput.value = "";
}

function submitMCQAnswer(i) {
    if (!state.selectedBlockId) return;
    const block = state.blocks.find(b => b.id === state.selectedBlockId);
    const ans = state.currentOptions[i];
    const isCorrect = ans === block.data.correctCode;

    if (!isCorrect) { processResult(false); return; }

    const match = ans.match(/input\s*\(\s*["'](.+?)["']\s*\)/);
    if (match) {
        block._runnableCode = ans;
        triggerConsoleInput(block, match[1]);
        return;
    }

    runRealPython(ans, [], block).then(({ output }) => {
        output.forEach(line => logToConsole(line));
        processResult(true);
    }).catch(e => {
        logToConsole("Error: " + e);
        processResult(false);
    });
}

function triggerConsoleInput(block, customPrompt = null) {
    state.waitingForInput = true; state.inputBlockId = block.id;
    els.consoleBar.classList.add('console-flash'); showLogicNotice(`Type answer in console and press Enter`);
    let promptText = "> ";
    if (customPrompt !== null) { promptText = customPrompt + " "; }
    else if (block && block.data.correctCode) {
        const match = block.data.correctCode.match(/input\s*\(\s*["'](.+?)["']\s*\)/);
        if (match) promptText = match[1] + " ";
    }
    const promptSpan = document.getElementById('console-prompt');
    if (promptSpan) promptSpan.innerText = promptText;
    els.consoleInputWrapper.style.display = 'flex'; els.consoleRealInput.value = "";
    els.consoleBar.scrollTop = els.consoleBar.scrollHeight; els.consoleRealInput.focus();
}

// No changes needed to triggerConsoleInput - it already handles prompts correctly
// The key change: handleConsoleInput now runs real Python instead of faking output

async function handleConsoleInput() {
    if (!state.waitingForInput) return;

    const val = els.consoleRealInput.value;
    const promptSpan = document.getElementById('console-prompt');
    const promptText = promptSpan ? promptSpan.innerText : "> ";

    logToConsole(promptText + val);

    if (!state.collectedInputs) state.collectedInputs = [];
    state.collectedInputs.push(val);

    const block = state.blocks.find(b => b.id === state.inputBlockId);

    if (!block || (!block.data.correctCode && !block._runnableCode)) {
        els.consoleInputWrapper.style.display = 'none';
        els.consoleBar.classList.remove('console-flash');
        hideLogicNotice();
        state.waitingForInput = false;
        state.inputBlockId = null;
        state.collectedInputs = [];
        processResult(false);
        return;
    }

    const codeToRun = block._runnableCode || block.data.correctCode;
    const inputCallCount = (codeToRun.match(/\binput\s*\(/g) || []).length;

    if (state.collectedInputs.length < inputCallCount) {
        const allPrompts = [...codeToRun.matchAll(/input\s*\(\s*["'](.+?)["']\s*\)/g)];
        const nextPrompt = allPrompts[state.collectedInputs.length];
        triggerConsoleInput(block, nextPrompt ? nextPrompt[1] : null);
        return;
    }

    els.consoleInputWrapper.style.display = 'none';
    els.consoleBar.classList.remove('console-flash');
    hideLogicNotice();
    state.waitingForInput = false;
    state.inputBlockId = null;

    const inputs = state.collectedInputs;
    state.collectedInputs = [];
    block._runnableCode = null;

    try {
        const { output } = await runRealPython(codeToRun, inputs, block);
        output.forEach(line => logToConsole(line));
        processResult(true);
    } catch (e) {
        logToConsole("Error: " + e);
        processResult(false);
    }
}

function submitMultiAnswer() {
    if (!state.selectedBlockId) return;
    const block = state.blocks.find(b => b.id === state.selectedBlockId);
    if (!block) return;
    console.log('RAW:', JSON.stringify(els.codeArea.value));
    const lines = els.codeArea.value.trim().split('\n').filter(l => l !== "");
    console.log('LINES:', lines);
    const type = state.customLevelData.type;

    if (type === 'multistep') submitCustomMultiStep(block, lines);
    else if (type === 'var_print') submitCustomVarPrint(block, els.codeArea.value.trim());
    else if (block.data.triggerConsole) submitCustomMultiLineConsole(block, lines);
    else submitCustomMultiLine(block, lines);
    els.codeArea.value = "";
}

function submitCustomMultiLineConsole(block, lines) {
    if (lines.length < 2) { processResult(false); return; }

    const hasComment = block.data.keywords && Array.isArray(block.data.keywords);

    let commentValid = true;
    if (hasComment) {
        const commentLine = lines[0].toLowerCase();
        if (!commentLine.startsWith("#")) commentValid = false;
        block.data.keywords.forEach(k => {
            if (!commentLine.includes(k.toLowerCase())) commentValid = false;
        });
    }

    const codeLines = hasComment ? lines.slice(1) : lines;
    const joined = codeLines.join('\n').trimEnd();
    let codeValid = false;
    if (block.data.useRegex) {
        codeValid = buildRegex(block.data.correctCode).test(joined);
    } else {
        codeValid = joined === block.data.correctCode;
    }

    if (commentValid && codeValid) {
        const codeToRun = block.data.useRegex ? joined : block.data.correctCode;
        const match = codeToRun.match(/input\s*\(\s*["'](.+?)["']\s*\)/);
        if (match) {
            block._runnableCode = codeToRun;
            triggerConsoleInput(block, match[1]);
        } else {
            runRealPython(codeToRun, [], block).then(({ output }) => {
                output.forEach(line => logToConsole(line));
                processResult(true);
            }).catch(e => {
                logToConsole("Error: " + e);
                processResult(false);
            });
        }
    } else {
        processResult(false);
    }
}

function submitCustomVarPrint(block, rawInput) {
    const isMatch = block.data.useRegex
        ? buildRegex(block.data.correctCode).test(rawInput)
        : rawInput === block.data.correctCode;

    if (isMatch) {
        const codeToRun = block.data.useRegex ? rawInput : block.data.correctCode;
        runRealPython(codeToRun, [], block).then(({ output }) => {
            output.forEach(line => logToConsole(line));
            processResult(true);
        }).catch(e => {
            logToConsole("Error: " + e);
            processResult(false);
        });
    } else {
        processResult(false);
    }
}

function submitCustomMultiStep(block, lines) {
    const tasks = block.data.tasks;
    if (!tasks || lines.length < tasks.length * 2) { processResult(false); return; }
    let allCorrect = true;
    for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        const commentLine = lines[i * 2].toLowerCase();
        const codeLine = lines[i * 2 + 1];

        if (!commentLine.startsWith("#")) { allCorrect = false; break; }
        if (task.verb && !commentLine.includes(task.verb.toLowerCase())) { allCorrect = false; break; }
        if (task.noun && !commentLine.includes(task.noun.toLowerCase())) { allCorrect = false; break; }
        if (!codeLine.startsWith("print") || !codeLine.trim().endsWith(")")) { allCorrect = false; break; }
        const content = codeLine.substring(codeLine.indexOf('(') + 1, codeLine.lastIndexOf(')')).trim();
        if (task.validation === 'string') {
            if (!/^["'].+["']$/.test(content)) { allCorrect = false; break; }
        } else if (task.validation === 'number') {
            if (/^["'].+["']$/.test(content)) {
                const unquoted = content.substring(1, content.length - 1);
                if (isNaN(parseInt(unquoted))) { allCorrect = false; break; }
            } else {
                const num = parseInt(content);
                if (isNaN(num)) { allCorrect = false; break; }
                if (task.min !== undefined && (num < task.min || num > task.max)) { allCorrect = false; break; }
            }
        }
    }

    if (allCorrect) {
        const codeToRun = lines.filter((_, i) => i % 2 !== 0).join('\n');
        runRealPython(codeToRun, [], block).then(({ output }) => {
            output.forEach(line => logToConsole(line));
            processResult(true);
        }).catch(e => {
            logToConsole("Error: " + e);
            processResult(false);
        });
    } else {
        processResult(false);
    }
}

function submitCustomMultiLine(block, lines) {
    if (lines.length < 1) { processResult(false); return; }

    const hasComment = block.data.keywords && Array.isArray(block.data.keywords);

    let commentValid = true;
    if (hasComment) {
        if (lines.length < 2) { processResult(false); return; }
        const commentLine = lines[0].toLowerCase();
        if (!commentLine.startsWith("#")) commentValid = false;
        block.data.keywords.forEach(k => {
            if (!commentLine.includes(k.toLowerCase())) commentValid = false;
        });
    }

    const codeLines = hasComment ? lines.slice(1) : lines;
    const joined = codeLines.join('\n').trimEnd();
    let codeValid = false;
    if (block.data.useRegex) {
        codeValid = buildRegex(block.data.correctCode).test(joined);
    } else {
        const userClean = joined.replace(/'/g, '"');
        const correctClean = block.data.correctCode.replace(/'/g, '"');
        codeValid = userClean === correctClean;
    }

    if (commentValid && codeValid) {
        const codeToRun = block.data.useRegex ? joined : block.data.correctCode;
        const match = codeToRun.match(/input\s*\(\s*["'](.+?)["']\s*\)/);
        if (match) {
            block._runnableCode = codeToRun;
            triggerConsoleInput(block, match[1]);
        } else {
            runRealPython(codeToRun, [], block).then(({ output }) => {
                output.forEach(line => logToConsole(line));
                processResult(true);
            }).catch(e => {
                logToConsole("Error: " + e);
                processResult(false);
            });
        }
    } else {
        processResult(false);
    }
}

async function startGCSEExam(id, btnElement) {
    id = String(id);

    const btn = btnElement;
    let originalText = "";
    if (btn) { originalText = btn.innerHTML; btn.innerText = "LOADING..."; }

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
    if (btn) { originalText = btn.innerHTML; btn.innerText = "LOADING..."; }

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
    const p = document.createElement('p'); p.innerHTML = q.prompt; p.style.color = "#fff"; container.appendChild(p);
    if (q.codeHtml) { const c = document.createElement('div'); c.className = 'exam-code'; c.innerHTML = q.codeHtml; container.appendChild(c); }
    if (q.type === 'ident' || q.type === 'mcq') {
        const optsDiv = document.createElement('div'); optsDiv.className = 'exam-options';
        let opts = [...q.options || q.optionsRaw].sort(() => Math.random() - 0.5);
        opts.forEach(opt => {
            const btn = document.createElement('button'); btn.className = 'btn btn-option'; btn.innerText = opt;
            btn.onclick = () => { Array.from(optsDiv.children).forEach(b => b.style.borderColor = '#555'); btn.style.borderColor = '#fff'; btn.setAttribute('data-selected', 'true'); };
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
            return; // Exit early — async handles the rest
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
        item.innerHTML = `<div style="font-weight:bold; margin-bottom:5px;">Q${i + 1}: ${a.q.prompt}</div><div style="font-size:0.9rem; color:#aaa;">Your Answer: ${a.user || "Nothing"}</div>${!a.correct ? `<div style="font-size:0.9rem; color:var(--accent-green);">Fix: ${a.q.explanation}</div>` : ''}`;
        list.appendChild(item);
    });
}

let pythonEditor = null;

function openPythonInterpreter() {
    document.getElementById('python-interpreter-modal').classList.add('active');
    document.getElementById('python-interpreter-overlay').classList.add('active');

    if (!pythonEditor) {
        pythonEditor = CodeMirror.fromTextArea(document.getElementById('python-input'), {
            mode: 'python',
            theme: 'dracula',
            lineNumbers: true,
            indentWithTabs: true,
            tabSize: 4,
            autofocus: true,
            lineWrapping: true,
            extraKeys: {
                'Ctrl-Enter': runPython,
                'Cmd-Enter': runPython,
            }
        });
    } else {
        pythonEditor.refresh();
        pythonEditor.focus();
    }
}

function closePythonInterpreter() {
    document.getElementById('python-interpreter-modal').classList.remove('active');
    document.getElementById('python-interpreter-overlay').classList.remove('active');
}

function clearPythonOutput() {
    document.getElementById('python-output').innerHTML = '';
}

function runPython() {
    const code = pythonEditor.getValue();
    const outputEl = document.getElementById('python-output');
    outputEl.innerHTML = '';

    let outputText = '';

    Sk.configure({
        output: (text) => { outputText += text; },
        read: (filename) => {
            if (Sk.builtinFiles?.files[filename] === undefined)
                throw new Error("File not found: '" + filename + "'");
            return Sk.builtinFiles.files[filename];
        },
        execLimit: 5000, // 5s timeout
    });

    Sk.misceval.asyncToPromise(() =>
        Sk.importMainWithBody('<stdin>', false, code, true)
    ).then(() => {
        outputEl.innerHTML = outputText
            ? `<span class="py-success">${escapeHtml(outputText)}</span>`
            : `<span style="color:#666">(no output)</span>`;
    }).catch((err) => {
        outputEl.innerHTML = `<span class="py-error">${escapeHtml(err.toString())}</span>`;
    });
}

function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Tab key inserts spaces instead of changing focus
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('python-input').addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            document.execCommand('insertText', false, '\t');
        }
        // Ctrl+Enter or Cmd+Enter to run
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            runPython();
        }
    });
});

function shouldExecute(block) {
    // Check question-level flag
    if (block.data.execute === false) return false;
    // Check level-level flag
    if (state.customLevelData.execute === false) return false;
    return isRunnableCode(block.data.correctCode);
}

function isRunnableCode(code) {
    const trimmed = code.trim();

    // Plain text answers like "Syntax Error", "Logic Error"
    if (/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(trimmed)) return false;

    // Single-line incomplete statements — while/for/if with no body
    if (/^(while|for|if|elif|else|def|class)\b/.test(trimmed) && !trimmed.includes('\n')) return false;

    // Code that uses list indexing (var[i]) but never defines the list
    if (/\w+\s*\[\s*\w+\s*\]/.test(trimmed)) {
        const hasAssignment = /^[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*\[/m.test(trimmed);
        if (!hasAssignment) return false;
    }

    // Code that uses len() on a variable but never defines it as a list
    if (/len\s*\(\s*\w+\s*\)/.test(trimmed)) {
        const hasListAssignment = /^[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*\[/m.test(trimmed);
        if (!hasListAssignment) return false;
    }

    // No parentheses or assignment — just an expression or snippet
    if (!/[\(\=]/.test(trimmed)) return false;

    return true;
}

function injectDefaultVars(code) {
    const assigned = new Set();
    const used = {};

    const keywords = new Set([
        'if','else','elif','while','for','in','and','or','not',
        'print','input','int','str','float','len','range','True','False','None',
        'return','def','class','import','from','try','except','pass','break','continue'
    ]);

    // Strip comments before analysis
    const codeNoComments = code.split('\n').filter(l => !l.trim().startsWith('#')).join('\n');

    // Find ALL assignments — varName = (not ==, !=, <=, >=)
    for (const m of codeNoComments.matchAll(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=[^=><!]/gm)) {
        assigned.add(m[1]);
    }

    // Find variables used in conditions with a numeric comparison
    for (const m of codeNoComments.matchAll(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*([><=!]+)\s*(-?\d+)/g)) {
        const varName = m[1]; const op = m[2]; const val = parseInt(m[3]);
        if (!assigned.has(varName) && !keywords.has(varName)) {
            used[varName] = { op, val };
        }
    }

    // With this:
    const codeNoStrings = codeNoComments
        .replace(/"[^"]*"/g, '""')   // remove double-quoted strings
        .replace(/'[^']*'/g, "''");  // remove single-quoted strings

    // Find any other bare variable names not yet accounted for
    for (const m of codeNoStrings.matchAll(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g)) {
        const name = m[1];
        if (!keywords.has(name) && !assigned.has(name) && !used[name] && !/^\d/.test(name)) {
            used[name] = { op: '==', val: 0 };
        }
    }

    const injections = [];
    for (const [varName, { op, val }] of Object.entries(used)) {
        let defaultVal;
        if      (op === '>')  defaultVal = val + 1;
        else if (op === '>=') defaultVal = val;
        else if (op === '<')  defaultVal = val - 1;
        else if (op === '<=') defaultVal = val;
        else if (op === '==') defaultVal = val;
        else if (op === '!=') defaultVal = val + 1;
        else                  defaultVal = 0;
        injections.push(`${varName} = ${defaultVal}`);
    }

    if (injections.length === 0) return code;
    return injections.join('\n') + '\n' + code;
}

function runRealPython(code, inputValues, block = null) {
    // Level-wide flag
    if (state.customLevelData?.execute === false) return Promise.resolve({ output: [], vars: {} });
    // Per-question flag
    if (block?.data?.execute === false) return Promise.resolve({ output: [], vars: {} });

    // Decode HTML entities
    code = code
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")  // add this
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');

    // Strip comment lines
    code = code.split('\n').filter(l => !l.trim().startsWith('#')).join('\n').trim();

    // Skip non-runnable snippets silently
    if (!isRunnableCode(code)) {
        return Promise.resolve({ output: [], vars: {} });
    }

    // Inject default variable values
    code = injectDefaultVars(code);

    return new Promise((resolve, reject) => {
        const output = [];
        let inputIndex = 0;

        Sk.configure({
            output: (text) => {
                const trimmed = text.replace(/\n$/, '');
                if (trimmed !== '') output.push(trimmed);
            },
            inputfun: (prompt) => {
                return Promise.resolve(String(inputValues[inputIndex++] ?? ''));
            },
            inputfunTakesPrompt: true,
            __future__: Sk.python3
        });

        Sk.misceval.asyncToPromise(() =>
            Sk.importMainWithBody('<stdin>', false, code, true)
        ).then(() => {
            const vars = {};
            try {
                const mod = Sk.globals;
                for (const key of Object.keys(mod)) {
                    if (key.startsWith('__')) continue;
                    try {
                        const js = Sk.ffi.remapToJs(mod[key]);
                        if (js !== undefined && js !== null) vars[key] = js;
                    } catch (e) { }
                }
            } catch (e) { }
            resolve({ output, vars });
        }).catch(e => {
            reject(e.toString());
        });
    });
}

function runPythonLike(code, inputs) {
    const lines = code.split('\n');
    const output = [];
    const vars = {};
    let inputIndex = 0;
    let i = 0;

    function getValue(expr) {
        expr = expr.trim();
        // String literal
        if (/^["'].*["']$/.test(expr)) return expr.slice(1, -1);
        // Number literal
        if (!isNaN(Number(expr))) return Number(expr);
        // Variable
        if (vars[expr] !== undefined) return vars[expr];
        // Concatenation / comma separated (basic)
        return expr;
    }

    function evalExpr(expr) {
        expr = expr.trim();
        // String literal
        if (/^["'].*["']$/.test(expr)) return expr.slice(1, -1);
        // Number
        if (!isNaN(Number(expr))) return Number(expr);
        // input()
        const inputMatch = expr.match(/^input\s*\(\s*(["'].*["'])?\s*\)$/);
        if (inputMatch) return inputs[inputIndex++] ?? '';
        // int() / str() / float() casting
        const intMatch = expr.match(/^int\s*\((.+)\)$/);
        if (intMatch) return parseInt(evalExpr(intMatch[1]));
        const floatMatch = expr.match(/^float\s*\((.+)\)$/);
        if (floatMatch) return parseFloat(evalExpr(floatMatch[1]));
        const strMatch = expr.match(/^str\s*\((.+)\)$/);
        if (strMatch) return String(evalExpr(strMatch[1]));
        // Variable
        if (vars[expr] !== undefined) return vars[expr];
        // f-string (basic)
        if (/^f["']/.test(expr)) {
            return expr.slice(2, -1).replace(/\{(\w+)\}/g, (_, v) => vars[v] ?? '');
        }
        // String + number concatenation with +
        if (expr.includes('+')) {
            const parts = expr.split('+').map(p => evalExpr(p.trim()));
            return parts.every(p => typeof p === 'number') ? parts.reduce((a, b) => a + b, 0) : parts.join('');
        }
        return expr;
    }

    function evalCondition(cond) {
        cond = cond.trim();
        const ops = ['>=', '<=', '!=', '==', '>', '<'];
        for (const op of ops) {
            const idx = cond.indexOf(op);
            if (idx !== -1) {
                const left = evalExpr(cond.slice(0, idx).trim());
                const right = evalExpr(cond.slice(idx + op.length).trim());
                switch (op) {
                    case '==': return left == right;
                    case '!=': return left != right;
                    case '>=': return left >= right;
                    case '<=': return left <= right;
                    case '>': return left > right;
                    case '<': return left < right;
                }
            }
        }
        return !!evalExpr(cond);
    }

    function getIndent(line) {
        return line.match(/^(\s*)/)[1].length;
    }

    function getBlock(startIndex, baseIndent) {
        const block = [];
        let j = startIndex;
        while (j < lines.length) {
            const line = lines[j];
            if (line.trim() === '') { j++; continue; }
            if (getIndent(line) <= baseIndent) break;
            block.push(line);
            j++;
        }
        return { block, end: j };
    }

    function execLines(linesToRun) {
        let j = 0;
        while (j < linesToRun.length) {
            const raw = linesToRun[j];
            if (raw.trim() === '' || raw.trim().startsWith('#')) { j++; continue; }
            const line = raw.trim();
            const indent = getIndent(raw);

            // print()
            if (/^print\s*\(/.test(line)) {
                const inner = line.slice(line.indexOf('(') + 1, line.lastIndexOf(')'));
                const parts = splitArgs(inner).map(a => evalExpr(a.trim()));
                output.push(parts.join(' '));
                j++; continue;
            }

            // if/else
            if (/^if\s+/.test(line) && line.endsWith(':')) {
                const cond = line.slice(3, -1).trim();
                const condResult = evalCondition(cond);
                j++;
                const ifBlock = [];
                while (j < linesToRun.length && linesToRun[j].trim() !== '' && getIndent(linesToRun[j]) > indent) {
                    ifBlock.push(linesToRun[j]); j++;
                }
                const elseBlock = [];
                if (j < linesToRun.length && linesToRun[j]?.trim() === 'else:') {
                    j++;
                    while (j < linesToRun.length && linesToRun[j].trim() !== '' && getIndent(linesToRun[j]) > indent) {
                        elseBlock.push(linesToRun[j]); j++;
                    }
                }
                if (condResult) execLines(ifBlock);
                else if (elseBlock.length) execLines(elseBlock);
                continue;
            }

            // for loop
            const forMatch = line.match(/^for\s+(\w+)\s+in\s+range\s*\((.+)\)\s*:$/);
            if (forMatch) {
                const loopVar = forMatch[1];
                const rangeArgs = splitArgs(forMatch[2]).map(a => Number(evalExpr(a.trim())));
                let start = 0, end = 0, step = 1;
                if (rangeArgs.length === 1) { end = rangeArgs[0]; }
                else if (rangeArgs.length === 2) { [start, end] = rangeArgs; }
                else { [start, end, step] = rangeArgs; }
                j++;
                const loopBlock = [];
                while (j < linesToRun.length && linesToRun[j].trim() !== '' && getIndent(linesToRun[j]) > indent) {
                    loopBlock.push(linesToRun[j]); j++;
                }
                for (let k = start; k < end; k += step) {
                    vars[loopVar] = k;
                    execLines(loopBlock);
                }
                continue;
            }

            // while loop
            const whileMatch = line.match(/^while\s+(.+)\s*:$/);
            if (whileMatch) {
                j++;
                const loopBlock = [];
                while (j < linesToRun.length && linesToRun[j].trim() !== '' && getIndent(linesToRun[j]) > indent) {
                    loopBlock.push(linesToRun[j]); j++;
                }
                let safety = 0;
                while (evalCondition(whileMatch[1]) && safety++ < 1000) {
                    execLines(loopBlock);
                }
                continue;
            }

            // assignment
            if (line.includes('=') && !line.includes('==')) {
                const eqIdx = line.indexOf('=');
                const varName = line.slice(0, eqIdx).trim();
                const expr = line.slice(eqIdx + 1).trim();
                if (/^\w+$/.test(varName)) vars[varName] = evalExpr(expr);
                j++; continue;
            }

            j++;
        }
    }

    function splitArgs(str) {
        const args = [];
        let depth = 0, current = '';
        for (const ch of str) {
            if (ch === '(' || ch === '[') depth++;
            else if (ch === ')' || ch === ']') depth--;
            else if (ch === ',' && depth === 0) { args.push(current); current = ''; continue; }
            current += ch;
        }
        if (current.trim()) args.push(current);
        return args;
    }

    execLines(lines);
    return { output, vars };
}

async function validateExtendedRun(q, code, inputs) {

    // --- New test case system ---
    if (q.testCases && q.testCases.length) {
        for (const tc of q.testCases) {
            let run;
            try {
                run = await runRealPython(code, tc.inputs.map(String));
            } catch (e) {
                return false;
            }
            // If anyOutput is true, just check that something was printed
            if (tc.anyOutput) {
                if (run.output.length === 0) return false;
                continue;
            }
            for (const expected of tc.expectedOutput) {
                const found = run.output.some(line =>
                    line.toLowerCase().replace(/\s+/g, ' ').trim()
                        .includes(expected.toLowerCase().trim())
                );
                if (!found) return false;
            }
        }
        return true;
    }

    // --- Legacy system (expectedVars / testValues / expectedOutput) ---
    const testInputs = (q.testValues && q.testValues.length)
        ? q.testValues.map(tv => tv.value)
        : inputs;

    let firstRun;
    try {
        firstRun = await runRealPython(code, inputs);
    } catch (e) {
        return false;
    }

    if (q.expectedVars) {
        for (const ev of q.expectedVars) {
            let val = firstRun.vars[ev.name];
            if (val === undefined && ev.aliases) {
                for (const alias of ev.aliases) {
                    if (firstRun.vars[alias] !== undefined) {
                        val = firstRun.vars[alias];
                        break;
                    }
                }
            }
            if (val === undefined) return false;
            if (ev.expectedString && typeof val !== 'string') return false;
            if (ev.expectedInt && !Number.isInteger(Number(val))) return false;
            if (ev.expectedFloat && (isNaN(parseFloat(val)) || !isFinite(val))) return false;
            if (ev.strict && ev.value !== undefined && String(val) !== String(ev.value)) return false;
        }
    }

    let secondRun;
    if (q.testValues && q.testValues.length && q.expectedOutput && q.expectedOutput.length) {
        try {
            secondRun = await runRealPython(code, testInputs);
        } catch (e) {
            return false;
        }
    } else {
        secondRun = firstRun;
    }

    if (q.expectedOutput) {
        for (const eo of q.expectedOutput) {
            const match = secondRun.output.some(line => {
                const lower = line.toLowerCase().replace(/\s+/g, ' ').trim();
                if (eo.containsVar !== undefined) {
                    const varVal = String(secondRun.vars[eo.containsVar] ?? '').toLowerCase();
                    if (!lower.includes(varVal)) return false;
                    if (eo.hasMessage) {
                        const withoutVar = lower.replace(varVal, '').trim();
                        if (withoutVar.length === 0) return false;
                    }
                }
                if (eo.containsStr !== undefined) {
                    if (!lower.includes(eo.containsStr.toLowerCase())) return false;
                }
                return true;
            });
            if (!match) return false;
        }
    }

    return true;
}

function showHelp() { els.menuScreen.classList.remove('active'); els.helpScreen.classList.add('active'); }
function closeHelp() { els.helpScreen.classList.remove('active'); els.menuScreen.classList.add('active'); }

function resetGame() {
    state.isPlaying = false; state.inExam = false;
    cancelAnimationFrame(state.animationFrameId);
    els.gameOverScreen.classList.remove('active');
    els.examScreen.classList.remove('active');
    els.examResultsScreen.classList.remove('active');
    els.menuScreen.classList.add('active');
    if (state.sessionStartTime) endSession();
    hideLogicNotice(); els.codeInput.blur(); els.codeArea.blur(); els.consoleBar.innerHTML = "";
}

let devMode = false;

// Dev Mode Trigger
let devKeyBuffer = [];
document.addEventListener('keydown', (e) => {
    if (!els.menuScreen.classList.contains('active')) return;

    if (!e.shiftKey) {
        devKeyBuffer = [];
        return;
    }

    if (e.key === 'Shift') return;

    devKeyBuffer.push(e.key.toLowerCase());
    if (devKeyBuffer.length > 3) devKeyBuffer.shift();

    if (devKeyBuffer.join('') === 'dev') {
        const panel = document.getElementById('test-panel');
        panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex';
        devMode = panel.style.display === 'flex';
        devKeyBuffer = [];
    }
});
