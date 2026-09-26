// Scores and time played, kept per day in this browser, and each session reported to the site.
// Stats (Persistent & Dated)
const STATS_KEY = 'pythonDefenseHistory';
let globalHistory = {};
let gameStats = getFreshStats();

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
