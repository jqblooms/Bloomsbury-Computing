// Loading a level or a custom one, the read-only example mode, the line count.
// --- Level Logic ---
function loadLevel(index) {
    if (index >= rawLevels.length) {
        alert("You finished all available levels!");
        showMenu();
        return;
    }
    
    saveCurrentCode();
    
    // Clear any custom level state
    isCustomLevel = false;
    customLevelString = null;

    currentLevelIndex = index;
    isLevelActive = true;
    
    levelData = parseLevelString(rawLevels[index]);
    
    document.getElementById("level-title").innerText = `Level ${index}`;
    document.getElementById("gold-req").innerText = levelData.gold;
    document.getElementById("silver-req").innerText = levelData.silver;
    document.getElementById("bronze-req").innerText = levelData.bronze;
    updateMedalDisplay();

    // Show native-level win buttons, hide restart-only mode
    document.getElementById("btn-next-level").style.display = '';
    document.getElementById("btn-close-win").style.display  = '';

    const saved = savedData.levels[index] || {};
    editor.setValue(saved.code || "");
    updateLineCount();

    build3DLevel();
    resetLevel();

    postToParent({ type: 'LEVEL_LOADED', level: index });
}

function loadCustomLevel(levelString) {
    saveCurrentCode();

    isCustomLevel = true;
    customLevelString = levelString;
    currentLevelIndex = 'custom';
    isLevelActive = true;

    // Always hide the menu when a custom level is injected
    document.getElementById('menu-modal').classList.add('hidden');

    levelData = parseLevelString(levelString);

    document.getElementById("level-title").innerText = 'Custom Level';
    document.getElementById("gold-req").innerText  = levelData.gold;
    document.getElementById("silver-req").innerText = levelData.silver;
    document.getElementById("bronze-req").innerText = levelData.bronze;
    updateMedalDisplay();

    // Custom levels: only show Restart, hide Next Level and Close
    document.getElementById("btn-next-level").style.display = 'none';
    document.getElementById("btn-close-win").style.display  = 'none';

    editor.setValue('');
    updateLineCount();
    build3DLevel();
    resetLevel();

    postToParent({ type: 'LEVEL_LOADED', level: 'custom' });
}

// --- Example mode: read-only demo that loops automatically ---
function loadExampleMode(levelString, code) {
    isExampleMode = true;
    isCustomLevel = true;
    currentLevelIndex = 'custom';
    isLevelActive = true;

    document.getElementById('menu-modal').classList.add('hidden');

    // Hide the editable editor, show the read-only display panel
    document.getElementById('editor-container').style.display = 'none';
    document.getElementById('example-code-display').style.display = 'block';
    document.getElementById('example-mode-badge').style.display = 'inline-block';

    // Hide play/stop controls - example runs itself
    document.getElementById('btn-play').style.display = 'none';
    document.getElementById('btn-stop').style.display = 'none';

    // Render code with simple syntax highlighting (no copy-paste possible)
    document.getElementById('example-code-display').innerHTML = highlightPython(code);

    // Store code for the auto-loop
    window._exampleCode = code;

    levelData = parseLevelString(levelString);
    document.getElementById("level-title").innerText = 'Example';
    document.getElementById("gold-req").innerText  = levelData.gold;
    document.getElementById("silver-req").innerText = levelData.silver;
    document.getElementById("bronze-req").innerText = levelData.bronze;
    updateMedalDisplay();
    document.getElementById("btn-next-level").style.display = 'none';
    document.getElementById("btn-close-win").style.display  = 'none';

    build3DLevel();
    resetLevel();

    // Auto-play after a short pause so the level has time to render
    setTimeout(() => examplePlay(), 800);

    postToParent({ type: 'LEVEL_LOADED', level: 'example' });
}

function examplePlay() {
    if (!isExampleMode) return;
    resetLevel();

    const prog = window._exampleCode || '';
    Sk.configure({ output: outf, read: builtinRead });
    Sk.builtins.walk_forward = new Sk.builtin.func(() => { commandQueue.push('walk_forward'); });
    Sk.builtins.turn_right   = new Sk.builtin.func(() => { commandQueue.push('turn_right'); });
    Sk.builtins.turn_left    = new Sk.builtin.func(() => { commandQueue.push('turn_left'); });
    Sk.builtins.jump         = new Sk.builtin.func(() => { commandQueue.push('jump'); });
    Sk.builtins.light        = new Sk.builtin.func(() => { commandQueue.push('light'); });

    Sk.misceval.asyncToPromise(() => Sk.importMainWithBody('<stdin>', false, prog, true))
        .then(() => { isPlaying = true; })
        .catch(() => {});
}

function highlightPython(code) {
    // Escape HTML first
    let escaped = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Apply syntax highlighting spans (order matters - most specific first)
    escaped = escaped
        // Comments
        .replace(/(#[^\n]*)/g, '<span class="cmt">$1</span>')
        // Keywords (only outside comments - simplified, good enough for lesson code)
        .replace(/\b(for|in|range|while|if|elif|else|def|return|and|or|not|True|False)\b/g,
                 '<span class="kw">$1</span>')
        // Built-in functions
        .replace(/\b(walk_forward|turn_right|turn_left|jump|light|print|len|int|str|float)\b/g,
                 '<span class="fn">$1</span>')
        // Numbers
        .replace(/\b(\d+)\b/g, '<span class="num">$1</span>')
        // Newlines to <br> while preserving indentation
        .replace(/\n/g, '\n');

    return escaped;
}

function updateLineCount() {
    const code = editor.getValue();
    const lines = code.split('\n').filter(l => l.trim() !== '' && !l.trim().startsWith('#')).length;
    document.getElementById("line-count").innerText = lines;
    return lines;
}
