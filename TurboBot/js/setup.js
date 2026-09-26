// Starting up, reading a level string, the level menu and saved progress.
// --- Initialization ---
function init() {
    // Setup CodeMirror
    editor = CodeMirror(document.getElementById("editor-container"), {
        mode: "python",
        theme: "bc",
        lineNumbers: true,
        indentUnit: 4,
        extraKeys: { 
            "Tab": "indentMore", 
            "Shift-Tab": "indentLess",
            "Backspace": function(cm) {
                if (cm.somethingSelected()) {
                    cm.execCommand("delCharBefore");
                    return;
                }
                const pos = cm.getCursor();
                const line = cm.getLine(pos.line);
                const indentUnit = cm.getOption("indentUnit");
                if (pos.ch > 0 && line.slice(0, pos.ch).trim() === "") {
                    const spacesToDelete = pos.ch % indentUnit || indentUnit;
                    cm.replaceRange("", {line: pos.line, ch: pos.ch - spacesToDelete}, pos);
                } else {
                    cm.execCommand("delCharBefore");
                }
            }
        }
    });

    editor.on("change", updateLineCount);

    // Loading a level replaces the editor's content wholesale via
    // setValue() (starter code, saved code, injected code, resets). If the
    // gutter's width measurement was ever taken while stale (see the
    // ResizeObserver below), swapping in new multi-line content is exactly
    // when the mismeasurement becomes visible, since the gutter has to grow
    // to fit the new line count. Refresh on every setValue rather than
    // patching each of the several call sites that use it.
    var originalSetValue = editor.setValue.bind(editor);
    editor.setValue = function (value) {
        originalSetValue(value);
        editor.refresh();
    };

    // CodeMirror measures its gutter/character widths against whatever size
    // its container has at creation time. When this page is preloaded inside
    // a hidden (display:none) tab, as it is on the main site, that size is
    // 0x0 and the measurement is wrong until something explicitly tells it
    // to remeasure, which is why line numbers and text overlap until an
    // unrelated change (like reaching a two-digit line count) forces a
    // relayout. Refresh whenever the editor's real size changes instead.
    new ResizeObserver(function () {
        editor.refresh();
    }).observe(document.getElementById('editor-container'));

    // Setup UI Listeners
    document.getElementById("btn-play").addEventListener("click", playCode);
    document.getElementById("btn-stop").addEventListener("click", resetLevel);
    document.getElementById("btn-home").addEventListener("click", showMenu);
    document.getElementById("btn-restart-level").addEventListener("click", () => {
        document.getElementById("win-modal").classList.add("hidden");
        resetLevel();
    });
    document.getElementById("btn-close-win").addEventListener("click", () => {
        document.getElementById("win-modal").classList.add("hidden");
    });
    document.getElementById("btn-next-level").addEventListener("click", () => {
        document.getElementById("win-modal").classList.add("hidden");
        loadLevel(currentLevelIndex + 1);
    });
    document.getElementById("speed-slider").addEventListener("input", (e) => {
        document.getElementById("speed-display").innerText = parseFloat(e.target.value).toFixed(1) + "x";
    });

    // Resize handler for Three.js
    new ResizeObserver(resizeCanvas).observe(document.getElementById('right-pane'));

    initThreeJS();
    initEmbedListener();

    // --- URL param handling ---
    const params = new URLSearchParams(window.location.search);
    const embedLevel = params.get('level');
    const hideMenu   = params.get('hideMenu') === 'true';
    const hideNav    = params.get('hideNav')  === 'true';
    const turboBotMode = params.get('turbobot') === 'true';

    if (hideNav)  document.getElementById('top-bar').style.display = 'none';
    if (hideMenu) document.getElementById('btn-home').style.display = 'none';
    if (turboBotMode) applyTurboBotLayout();

    if (embedLevel !== null) {
        loadLevel(parseInt(embedLevel, 10));
    } else if (hideMenu) {
        // Embedded with hideMenu=true but no level - wait silently for LOAD_CUSTOM_LEVEL
        // Don't show the menu; the parent will inject a level via postMessage
        document.getElementById('menu-modal').classList.add('hidden');
    } else {
        buildMenu();
    }
}

// --- Level Parsing ---
function parseLevelString(str) {
    const lines = str.split('\n').map(l => l.trim());
    let data = { gold: 0, silver: 0, bronze: 0, startDir: 1, height: [], items: [], startX: 0, startZ: 0, startH: 0 };
    
    let mode = 'meta';
    for (let line of lines) {
        if (line === '') continue;
        if (line.startsWith('Height map:')) { mode = 'height'; continue; }
        if (line.startsWith('Item map:')) { mode = 'items'; continue; }

        if (mode === 'meta') {
            if (line.startsWith('Gold:')) data.gold = parseInt(line.split(':')[1]);
            if (line.startsWith('Silver:')) data.silver = parseInt(line.split(':')[1]);
            if (line.startsWith('Bronze:')) data.bronze = parseInt(line.split(':')[1]);
            if (line.startsWith('Dir:')) data.startDir = parseInt(line.split(':')[1]);
        } else if (mode === 'height') {
            data.height.push(line.split('').map(Number));
        } else if (mode === 'items') {
            let row = line.split('');
            data.items.push(row);
            let pIndex = row.indexOf('P');
            if (pIndex !== -1) {
                data.startX = pIndex;
                data.startZ = data.items.length - 1;
            }
        }
    }
    
    if (data.height[data.startZ] !== undefined && data.height[data.startZ][data.startX] !== undefined) {
        data.startH = data.height[data.startZ][data.startX];
    }
    
    return data;
}

// --- Menu & Storage ---
function buildMenu() {
    const container = document.getElementById('level-container');
    container.innerHTML = '';
    rawLevels.forEach((level, index) => {
        const saved = savedData.levels[index] || {};
        const medal = medalName(saved.medal);
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'level-card' + (medal ? ' is-done' : '');
        card.innerHTML = `
            <span class="level-card-name">Level ${index}</span>
            ${medalIcon(medal)}
            <span class="level-card-lines">${saved.lines ? saved.lines + ' lines' : MEDAL_LABELS[medal]}</span>
        `;
        card.onclick = () => { loadLevel(index); document.getElementById('menu-modal').classList.add('hidden'); };
        container.appendChild(card);
    });
}

function showMenu() {
    if (isLevelActive && levelData && Array.isArray(levelData.height)) {
        resetLevel();
    }
    saveCurrentCode();
    isLevelActive = false;
    document.getElementById('menu-modal').classList.remove('hidden');
    buildMenu();
    postToParent({ type: 'MENU_OPENED' });
}

// Two clicks instead of confirm(): a native dialog can be silently blocked
// in the site's sandboxed frame.
let clearArmedTimer = null;
function clearSaveData() {
    const btn = document.getElementById('btn-clear-save');
    if (!btn.classList.contains('is-armed')) {
        btn.classList.add('is-armed');
        btn.textContent = 'Click again to delete all your progress and code';
        clearArmedTimer = setTimeout(() => { btn.classList.remove('is-armed'); btn.textContent = 'Clear my progress'; }, 4000);
        return;
    }
    clearTimeout(clearArmedTimer);
    btn.classList.remove('is-armed');
    btn.textContent = 'Clear my progress';
    // An empty save rather than none, so the account's copy is cleared too.
    savedData = { levels: {} };
    localStorage.setItem('lightbotSave', JSON.stringify(savedData));
    buildMenu();
}

function saveCurrentCode() {
    if (!isLevelActive || isCustomLevel) return;
    if (!savedData.levels[currentLevelIndex]) savedData.levels[currentLevelIndex] = {};
    savedData.levels[currentLevelIndex].code = editor.getValue();
    localStorage.setItem('lightbotSave', JSON.stringify(savedData));
}
