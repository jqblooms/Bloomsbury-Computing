// The game itself: the falling blocks, the ceiling, results, starting and ending a level.
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
    showFloatingText(x, y, "+" + points, "var(--good)");

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
    block.el.classList.add('is-wrong'); setTimeout(() => block.el.classList.remove('is-wrong'), 500);
    showFloatingText(block.el.offsetLeft, block.el.offsetTop, "WRONG!", "var(--bad)");
    els.gameArea.style.transform = "translateX(5px)"; setTimeout(() => els.gameArea.style.transform = "translateX(-5px)", 50); setTimeout(() => els.gameArea.style.transform = "none", 100);
}

function processResult(isCorrect, output = null) {
    recordSupportResult(isCorrect);
    setTimeout(refreshSupportHint, 0);
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
    if (btn) { originalText = btn.innerHTML; btn.innerText = "Loading..."; }

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
            applySupportToOptions(curr);
        } else if (type === 'multiline' || type === 'multistep' || type === 'var_print') {
            els.codeArea.value = ""; setTimeout(() => els.codeArea.focus(), 10);
        } else {
            els.codeInput.value = ""; setTimeout(() => els.codeInput.focus(), 10);
        }
    }
    refreshSupportHint();
    updateButtons();
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
    const type = state.customLevelData ? state.customLevelData.type : '';
    if (type === 'mcq') els.controlsMCQ.classList.toggle('is-waiting', !hasSelection);
}

function resetGame() {
    state.isPlaying = false; state.inExam = false;
    cancelAnimationFrame(state.animationFrameId);
    els.gameOverScreen.classList.remove('active');
    els.examScreen.classList.remove('active');
    els.examResultsScreen.classList.remove('active');
    els.menuScreen.classList.add('active');
    if (state.sessionStartTime) endSession();
    hideLogicNotice(); els.codeInput.blur(); els.codeArea.blur(); els.consoleBar.innerHTML = "";
    refreshSupportHint();
    renderMenu();
}
