// CIE pseudocode mode: the Pseudocode Farmer interpreter (loaded just before this file) runs the
// code, with the robot's five procedures in place of the farm's. Also the editor colours for
// pseudocode, the language switch and the error bar shared by both languages.

// What the Farmer interpreter reads from the farm game, given robot values here.
var FARM_TYPES = {};
var currentFarmType = '';
var runEpoch = 0;
var FUNCTIONS = [];
function identifierKey(name) { return String(name || '').replace(/_/g, '').toLowerCase(); }
function canonicalFunctionName() { return null; }
function callFunction(name, args, cursor, line) {
    throw new PseudocodeError('"' + name + '" is not a function the robot knows. Its procedures are used with CALL, e.g. CALL MoveForward()', line);
}
function markGameDirty() {}

VALID_COMMANDS = ['MoveForward', 'TurnLeft', 'TurnRight', 'Jump', 'Light'];
var PSEUDO_ACTIONS = { MoveForward: 'walk_forward', TurnLeft: 'turn_left', TurnRight: 'turn_right', Jump: 'jump', Light: 'light' };

// Replaces the farm's version: procedure names are written exactly as CIE pseudocode does,
// in PascalCase (MoveForward, not moveforward or MOVE_FORWARD). Near misses get the right
// spelling suggested by pseudoErrorText.
function canonicalCommandName(name) {
    return VALID_COMMANDS.indexOf(name) !== -1 ? name : null;
}

// The robot procedure a mistyped name was meant to be, ignoring case and underscores.
function looseCommandName(name) {
    const key = identifierKey(name);
    if (key === 'walkforward') return 'MoveForward';
    for (let i = 0; i < VALID_COMMANDS.length; i++) {
        if (identifierKey(VALID_COMMANDS[i]) === key) return VALID_COMMANDS[i];
    }
    return null;
}

// Replaces the farm's runCommand: each procedure queues the same action the Python version does.
function runCommand(name, args, cursor, log, line) {
    name = canonicalCommandName(name) || name;
    if (!PSEUDO_ACTIONS[name]) {
        throw new PseudocodeError('"' + name + '" is not a procedure the robot knows. Try ' + VALID_COMMANDS.join(', ') + '.', line);
    }
    if (args.length) throw new PseudocodeError(name + ' takes nothing in its brackets: CALL ' + name + '()', line);
    commandQueue.push(PSEUDO_ACTIONS[name]);
}

// ---- Language ----
let codeLang = 'python';

function codeKey() { return codeLang === 'pseudo' ? 'pseudo' : 'code'; }

function setCodeLang(lang, options = {}) {
    const next = lang === 'pseudo' ? 'pseudo' : 'python';
    if (next !== codeLang && options.keepCode !== true) saveCurrentCode();
    codeLang = next;
    document.body.classList.toggle('lang-pseudo', codeLang === 'pseudo');
    document.querySelectorAll('.pb-lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === codeLang)));
    if (editor) {
        editor.setOption('mode', codeLang === 'pseudo' ? 'cie-pseudo' : 'python');
        editor.setOption('indentUnit', codeLang === 'pseudo' ? 2 : 4);
    }
    if (!document.body.classList.contains('turbobot-embed')) {
        const intro = document.querySelector('#menu-modal .modal p');
        if (intro) intro.textContent = (codeLang === 'pseudo' ? 'Write pseudocode' : 'Write Python') + ' to walk the robot to every blue tile and light it. Fewer lines earn a better medal.';
    }
    if (options.remember) {
        try { localStorage.setItem('pybotLang', codeLang); } catch (e) {}
    }
    if (editor && options.loadCode && isLevelActive && !isCustomLevel) {
        const saved = savedData.levels[currentLevelIndex] || {};
        editor.setValue(saved[codeKey()] || '');
    }
    clearCodeError();
    if (editor) updateLineCount();
}

function initCodeLang(params) {
    let lang = params.get('lang');
    if (lang !== 'pseudo' && lang !== 'python') {
        // Embedded copies (lessons, TurboBot) keep Python unless they ask; the PyBot tab remembers the student's choice.
        const embedded = params.get('turbobot') === 'true' || params.get('level') !== null || params.get('hideMenu') === 'true';
        lang = 'python';
        if (!embedded) {
            try { lang = localStorage.getItem('pybotLang') === 'pseudo' ? 'pseudo' : 'python'; } catch (e) {}
        }
    }
    if (params.get('turbobot') === 'true') lang = 'python';
    setCodeLang(lang, { keepCode: true });
    document.querySelectorAll('.pb-lang button').forEach(b => b.addEventListener('click', () => {
        if (b.dataset.lang === codeLang) return;
        if (isPlaying) resetLevel();
        setCodeLang(b.dataset.lang, { remember: true, loadCode: true });
    }));
}

// ---- Running pseudocode ----
function playPseudocode(prog) {
    const log = (msg, isError) => {
        if (!isError) { console.log(msg); return; }
        // The farm's step limit names its machines; the robot has none.
        showCodeError(/^Stopped after/.test(msg) ? 'Stopped after 400 moves. Check that every loop can end.' : msg);
    };
    const lower = lowercaseKeyword(prog);
    if (lower) { showCodeError(lower.message, lower.line); return; }
    let run;
    try {
        run = runProgram(prog, null, log, 0);
    } catch (err) {
        showCodeError(pseudoErrorText(err, prog), err.line);
        return;
    }
    run.then(() => {
        isPlaying = true;
        timerInterval = setInterval(() => {
            timeElapsed += 0.1;
            document.getElementById("time-elapsed").innerText = timeElapsed.toFixed(1);
        }, 100);
    }).catch(err => {
        commandQueue = [];
        showCodeError(pseudoErrorText(err, prog), err.line);
    });
}

// CIE pseudocode writes its keywords in capitals. The Farmer interpreter accepts any case, so
// PyBot checks first. Text in quotes and comments is skipped.
const PSEUDO_KEYWORDS = /^(declare|integer|real|string|char|boolean|array|of|for|to|next|while|do|endwhile|if|then|else|elseif|endif|call|output|and|or|not|div|mod|true|false)$/i;
function lowercaseKeyword(prog) {
    const lines = prog.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (/^\s*for\s+\w+\s+in\b/.test(lines[i])) continue; // a Python loop gets its own hint
        const words = lines[i].replace(/\/\/.*$/, '').replace(/"[^"]*"/g, '').match(/[A-Za-z_]\w*/g) || [];
        for (const w of words) {
            if (PSEUDO_KEYWORDS.test(w) && w !== w.toUpperCase()) {
                return { line: i + 1, message: 'Line ' + (i + 1) + ': keywords are written in capitals in pseudocode: ' + w.toUpperCase() };
            }
        }
    }
    return null;
}

// A line written in Python, or a procedure name in the wrong style, gets the pseudocode version suggested.
function pseudoErrorText(err, prog) {
    const text = String((err && err.message) || err).replace(/ Try \.$/, '');
    const lineText = err && err.line ? String(prog.split('\n')[err.line - 1] || '') : '';
    const call = lineText.match(/^\s*(?:CALL\s+)?([A-Za-z_]\w*)\s*\(/i);
    const meant = call && looseCommandName(call[1]);
    if (meant && call[1] !== meant) return 'Line ' + err.line + ': in pseudocode this is written CALL ' + meant + '()';
    if (/^\s*for\s+\w+\s+in\s+range/i.test(lineText)) return 'Line ' + err.line + ': a count-controlled loop in pseudocode is FOR Count <- 1 TO 4 ... NEXT Count';
    return text;
}

// ---- Error bar ----
let errorLineHandle = null;

function showCodeError(message, line) {
    clearCodeError();
    const bar = document.getElementById('code-error');
    bar.textContent = message;
    bar.hidden = false;
    if (line && editor && line <= editor.lineCount()) {
        errorLineHandle = editor.addLineClass(line - 1, 'background', 'pb-error-line');
    }
}

function clearCodeError() {
    const bar = document.getElementById('code-error');
    if (bar) { bar.hidden = true; bar.textContent = ''; }
    if (errorLineHandle && editor) editor.removeLineClass(errorLineHandle, 'background', 'pb-error-line');
    errorLineHandle = null;
}

// Lines that count towards a medal. In pseudocode DECLARE and the closing NEXT, ENDWHILE
// and ENDIF are free, so a program scores the same lines as its Python version.
function countedCodeLines(code) {
    return code.split('\n').filter(l => {
        const t = l.trim();
        if (t === '') return false;
        if (codeLang !== 'pseudo') return !t.startsWith('#');
        if (t.startsWith('//')) return false;
        return !/^(DECLARE\b|NEXT\b|ENDWHILE$|ENDIF$)/i.test(t);
    }).length;
}

// ---- Editor colours ----
CodeMirror.defineMode('cie-pseudo', function () {
    const KEYWORDS = /^(DECLARE|INTEGER|REAL|STRING|CHAR|BOOLEAN|ARRAY|OF|FOR|TO|NEXT|WHILE|DO|ENDWHILE|IF|THEN|ELSE|ELSEIF|ENDIF|CALL|OUTPUT|AND|OR|NOT|DIV|MOD|TRUE|FALSE)$/i;
    return {
        token: function (stream) {
            if (stream.eatSpace()) return null;
            if (stream.match('//')) { stream.skipToEnd(); return 'comment'; }
            if (stream.match(/^"[^"]*"?/)) return 'string';
            if (stream.match(/^\d+(\.\d+)?/)) return 'number';
            if (stream.match(/^[A-Za-z_]\w*/)) {
                if (KEYWORDS.test(stream.current())) return 'keyword';
                return stream.peek() === '(' ? 'builtin' : 'variable';
            }
            if (stream.match(/^(<-|←|<=|>=|<>|[=<>+\-*\/&])/)) return 'operator';
            stream.next();
            return null;
        },
        lineComment: '//'
    };
});
