// The main menu, built from MENU_STAGES: a card per stage listing its levels
// (with the student's best score on any day) and the stage exam, the GCSE
// questions, the hard mode switch, and the teacher's custom level panel
// (hidden; Shift + D, E, V on the menu shows it).
const MENU_PAGES = [
    { id: 1, label: 'Stages 1 to 4' },
    { id: 2, label: 'Stages 5 to 8' },
    { id: 3, label: 'GCSE questions' }
];
const MENU_STAGES = [
    { page: 1, stage: 1, title: 'Errors, print and comments', exam: 1, levels: [
        [1, 'Spot the error'], [2, 'Fix the error'], [3, 'Match print'], [4, 'Write print'], [5, 'Comment and print'], [6, 'Two comments and prints']] },
    { page: 1, stage: 2, title: 'Variables', exam: 2, levels: [
        [7, 'Match variable'], [8, 'Write variable'], [9, 'Comment and assign'], [10, 'Assign and print'], [11, 'Match output'], [12, 'Write and print a variable']] },
    { page: 1, stage: 3, title: 'Input', exam: 3, levels: [
        [13, 'Match input'], [14, 'Write input'], [15, 'Comment and input'], [16, 'Match input and print'], [17, 'Spot the data type'], [18, 'Cast the data type']] },
    { page: 1, stage: 4, title: 'Selection', exam: 4, levels: [
        [19, 'Match operator'], [20, 'Write operator'], [21, 'Match if statement'], [22, 'Write if statement'], [23, 'Match logic operators'], [24, 'Write logic operators']] },
    { page: 2, stage: 5, title: 'Selection part 2', exam: 5, levels: [
        [25, 'Match if with print'], [26, 'Write if with print'], [27, 'Match if else with print'], [28, 'Write if else with print']] },
    { page: 2, stage: 6, title: 'For loops', exam: 6, levels: [
        [29, 'Match range'], [30, 'Write the range'], [31, 'Match for loop'], [32, 'Write the for loop'], [33, 'Match for loop print'], [34, 'Write for loop print']] },
    { page: 2, stage: 7, title: 'While loops', exam: 7, levels: [
        [35, 'Match while loop'], [36, 'Write while loop'], [37, 'Match increment'], [38, 'Write increment'], [39, 'Match while with increment'],
        [40, 'Write while with increment'], [41, 'Match while with print'], [42, 'Write while with print']] },
    { page: 2, stage: 8, title: 'Lists', exam: null, levels: [
        [43, 'Match list creation'], [44, 'Write list creation'], [45, 'Match list index'], [46, 'Write list index'], [47, 'Match list length'],
        [48, 'Write list length'], [49, 'Match len() code'], [50, 'Write len() code'], [51, 'Match loop through list'], [52, 'Write loop through list']] }
];
const GCSE_CHALLENGES = [
    'Items sold algorithm', 'Total rainfall', 'Student pass count', 'Total cost', 'Highest temperature',
    'Sentinel value total', 'Count until zero', 'Password validation', 'Countdown', 'Running total to 100'
];

let hardMode = false;
let menuPage = 1;

function toggleHardMode() {
    hardMode = !hardMode;
    document.getElementById('hard-mode-toggle').setAttribute('aria-pressed', String(hardMode));
}

function bestLevelScore(level) {
    let best = 0;
    Object.keys(globalHistory).forEach(day => {
        const l = globalHistory[day] && globalHistory[day].levels && globalHistory[day].levels[level];
        if (l && l.highScore > best) best = l.highScore;
    });
    return best;
}

function menuEscape(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderMenu() {
    const tabs = document.getElementById('menu-tabs');
    tabs.innerHTML = MENU_PAGES.map(p => '<button type="button" role="tab" class="pg-tab' + (p.id === menuPage ? ' is-active' : '') +
        '" aria-selected="' + (p.id === menuPage) + '" onclick="setMenuPage(' + p.id + ')">' + p.label + '</button>').join('');
    const pages = document.getElementById('menu-pages');
    if (menuPage === 3) {
        pages.innerHTML = '<section class="pg-stage pg-stage-wide" style="--stage: var(--stage-gcse)"><header class="pg-stage-head"><span class="pg-stage-num">GCSE</span><h2>Exam-style questions</h2></header>' +
            '<div class="pg-level-list">' + GCSE_CHALLENGES.map((name, i) =>
                '<button type="button" class="pg-level" onclick="startGCSEExam(' + (i + 1) + ', this)"><span class="pg-level-num">' + (i + 1) + '</span>' +
                '<span class="pg-level-name">' + menuEscape(name) + '</span></button>').join('') + '</div></section>';
        return;
    }
    pages.innerHTML = MENU_STAGES.filter(s => s.page === menuPage).map(s =>
        '<section class="pg-stage" style="--stage: var(--stage-' + s.stage + ')">' +
        '<header class="pg-stage-head"><span class="pg-stage-num">Stage ' + s.stage + '</span><h2>' + menuEscape(s.title) + '</h2></header>' +
        '<div class="pg-level-list">' + s.levels.map(([n, name, off]) => {
            const best = off ? 0 : bestLevelScore(n);
            return '<button type="button" class="pg-level"' + (off ? ' disabled' : ' onclick="startGame(' + n + ', hardMode, this)"') + '>' +
                '<span class="pg-level-num">' + n + '</span><span class="pg-level-name">' + menuEscape(name) + '</span>' +
                (best ? '<span class="pg-level-best">Best ' + best + '</span>' : '') + '</button>';
        }).join('') + '</div>' +
        (s.exam ? '<button type="button" class="pg-exam" onclick="startExam(' + s.exam + ', this)">Stage ' + s.stage + ' exam</button>' : '') +
        '</section>').join('');
}

function setMenuPage(pageNum) {
    menuPage = pageNum;
    renderMenu();
}

function showHelp() { els.menuScreen.classList.remove('active'); els.helpScreen.classList.add('active'); }
function closeHelp() { els.helpScreen.classList.remove('active'); els.menuScreen.classList.add('active'); }

let devMode = false;
let devKeyBuffer = [];
document.addEventListener('keydown', (e) => {
    if (!els.menuScreen.classList.contains('active')) return;
    if (!e.shiftKey) { devKeyBuffer = []; return; }
    if (e.key === 'Shift') return;
    devKeyBuffer.push(e.key.toLowerCase());
    if (devKeyBuffer.length > 3) devKeyBuffer.shift();
    if (devKeyBuffer.join('') === 'dev') {
        const panel = document.getElementById('test-panel');
        panel.hidden = !panel.hidden;
        devMode = !panel.hidden;
        devKeyBuffer = [];
    }
});

renderMenu();
initSupport();
