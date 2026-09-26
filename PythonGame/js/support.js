// Support mode (shared/bc-support.js): one site-wide switch, never in exams.
//
// A level where the student writes code shows a model of it under the box,
// Pseudocode Blitz style: greyed out, coloured as they type, then fading to
// the start of each line and to nothing as they get blocks right (a fader
// per level). Most answers are stored as patterns, so the model is built
// from the pattern and kept only if the pattern accepts it. A short answer
// (an operator, a value the code prints) would be the answer itself, so
// those levels show how to work it out instead (SUPPORT_REFS). Multiple
// choice rules out wrong options: two, then one, then none.

const SUPPORT_REFS = {
    errors: 'A syntax error breaks the rules of Python, so the code will not run at all. A logic error runs but gives the wrong result. A runtime error stops the program while it is running.',
    types: 'Text in quotes is a string (str). A whole number is an integer (int). A number with a decimal point is a float. True and False are Booleans (bool).',
    comparison: 'Comparison operators: == equal to, != not equal to, > greater than, < less than, >= greater than or equal to, <= less than or equal to.',
    logic: 'and is True only when both sides are True. or is True when at least one side is True. not flips True to False and False to True.',
    range: 'range(stop) counts from 0 up to, but not including, stop. range(start, stop) starts at start instead. range(5) gives 0, 1, 2, 3, 4.',
    index: 'A list counts from 0: items[0] is the first item, items[1] the second, items[2] the third.',
    length: 'len(items) is how many items the list holds. The last item is at index len(items) - 1.'
};
const SUPPORT_LEVEL_REF = {
    1: 'errors', 17: 'types', 19: 'comparison', 20: 'comparison', 23: 'logic', 24: 'logic',
    29: 'range', 31: 'range', 33: 'range', 45: 'index', 46: 'index', 47: 'length', 48: 'length', 49: 'length'
};
const SUPPORT_FREE_TEXT = '...';

function supportActive() {
    return !!(window.BCSupport && window.BCSupport.isOn()) && !state.inExam && state.isPlaying;
}
function supportFader() {
    return window.BCSupport.fader('pythongame:L' + state.level);
}
function supportReveal() {
    return supportActive() ? supportFader().reveal() : 0;
}

// ---- A model answer built from an answer pattern ----
// Covers what the level files use: literals, escapes, \s \d \n, character
// classes, groups, alternatives (the first is taken) and quantifiers.
// Optional parts are left out; free text becomes "...".
function supportExampleFromPattern(src) {
    const FREE = '\u0001', SPACE = '\u0002', MAYBE_SPACE = '\u0003';
    let i = 0;
    function alternatives() {
        const first = sequence();
        while (src[i] === '|') { i++; sequence(); }
        return first;
    }
    function sequence() {
        let out = '';
        while (i < src.length && src[i] !== '|' && src[i] !== ')') {
            const atom = parseAtom();
            const q = src[i];
            if (q === '*' || q === '+' || q === '?') {
                i++;
                if (src[i] === '?') i++;
                out += quantified(atom, q);
            } else if (q === '{') {
                const m = /^\{(\d+)(?:,\d*)?\}/.exec(src.slice(i));
                if (m) { i += m[0].length; out += atom.text.repeat(Number(m[1])); } else out += atom.text;
            } else out += atom.text;
        }
        return out;
    }
    function quantified(atom, q) {
        if (atom.kind === 'space') return q === '+' ? SPACE : MAYBE_SPACE;
        if (q === '?') return '';
        if (atom.kind === 'free') return FREE;
        if (q === '*') return '';
        return atom.kind === 'digit' ? '15' : atom.text;
    }
    function parseAtom() {
        const c = src[i];
        if (c === '^' || c === '$') { i++; return { text: '', kind: 'anchor' }; }
        if (c === '(') {
            i++;
            if (src.startsWith('?:', i)) i += 2;
            const text = alternatives();
            i++;
            return { text, kind: 'group' };
        }
        if (c === '[') return charClass();
        if (c === '\\') {
            const e = src[i + 1];
            i += 2;
            if (e === 's') return { text: SPACE, kind: 'space' };
            if (e === 'd') return { text: '5', kind: 'digit' };
            if (e === 'n') return { text: '\n', kind: 'char' };
            if (e === 'r') return { text: '', kind: 'char' };
            if (e === 'w') return { text: 'x', kind: 'char' };
            return { text: e, kind: 'char' };
        }
        i++;
        if (c === '.') return { text: FREE, kind: 'free' };
        return { text: c, kind: 'char' };
    }
    function charClass() {
        let j = i + 1, negated = false, body = '';
        if (src[j] === '^') { negated = true; j++; }
        while (j < src.length && src[j] !== ']') {
            if (src[j] === '\\') { body += src[j] + src[j + 1]; j += 2; } else { body += src[j]; j++; }
        }
        i = j + 1;
        if (negated) return { text: FREE, kind: 'free' };
        if (/\\[rn]/.test(body)) return { text: '\n', kind: 'char' };
        if (body.indexOf('"') !== -1) return { text: '"', kind: 'char' };
        return { text: body[0] === '\\' ? body[1] : body[0], kind: 'char' };
    }
    let raw = alternatives();
    // A required space straight after a new line is the indent of a block.
    raw = raw.replace(/\n[\u0002\u0003]*/g, m => '\n' + (m.indexOf(SPACE) !== -1 ? '    ' : ''))
        .replace(new RegExp(SPACE, 'g'), ' ').replace(new RegExp(MAYBE_SPACE, 'g'), '')
        .replace(new RegExp(FREE, 'g'), SUPPORT_FREE_TEXT);
    return supportTidyPython(raw);
}

// Spaces the way Python is usually written: around = and comparisons, after
// commas, none inside brackets. Text in quotes is left alone.
function supportTidyPython(code) {
    return code.split('\n').map(line => {
        const indent = line.match(/^ */)[0];
        const body = line.slice(indent.length);
        let out = '', quote = null;
        for (let k = 0; k < body.length; k++) {
            const ch = body[k];
            if (quote) { out += ch; if (ch === quote) quote = null; continue; }
            if (ch === '"' || ch === "'") { quote = ch; out += ch; continue; }
            const two = body.substr(k, 2);
            if (['==', '!=', '>=', '<=', '+=', '-='].indexOf(two) !== -1) { out = out.replace(/ +$/, '') + ' ' + two + ' '; k++; continue; }
            if (ch === '=' || ch === '<' || ch === '>') { out = out.replace(/ +$/, '') + ' ' + ch + ' '; continue; }
            if (ch === ',') { out = out.replace(/ +$/, '') + ', '; continue; }
            if (ch === ' ' && / $/.test(out)) continue;
            out += ch;
        }
        return indent + out.replace(/ +([)\]:])/g, '$1').replace(/([(\[]) +/g, '$1').replace(/ +$/, '');
    }).join('\n');
}

function supportCodeTokens(code) {
    return (code.match(/[A-Za-z_]\w*|\d+|"[^"]*"|'[^']*'|\.\.\.|[^\s\w]/g) || []).length;
}

// { text, exact } for a question the student writes code for, or null.
// exact: false when part of it is the student's own choice (free text, the
// wording of a comment), so their typing is not marked against it.
function supportModelFor(data) {
    if (!data) return null;
    let code = null, exact = true;
    if (data.tasks) {
        const lines = [];
        data.tasks.forEach(t => {
            lines.push('# ' + [t.verb, t.noun].filter(Boolean).join(' '));
            lines.push(t.validation === 'number' ? 'print(' + (t.min || 15) + ')' : 'print("' + SUPPORT_FREE_TEXT + '")');
        });
        return { text: lines.join('\n'), exact: false };
    }
    if (!data.correctCode) return null;
    if (data.useRegex) {
        try {
            code = supportExampleFromPattern(data.correctCode);
            if (!buildRegex(data.correctCode).test(code)) return null;
        } catch (e) { return null; }
        if (code.indexOf(SUPPORT_FREE_TEXT) !== -1) exact = false;
    } else {
        code = data.correctCode;
    }
    if (supportCodeTokens(code) < 3) return null;
    if (data.keywords && data.keywords.length) {
        code = '# ' + data.keywords.join(' ') + '\n' + code;
        exact = false;
    }
    return { text: code, exact };
}

// ---- Drawing it ----
function supportSelectedBlock() {
    return state.blocks.find(b => b.id === state.selectedBlockId) || null;
}

function refreshSupportHint() {
    const box = document.getElementById('support-hint');
    if (!box) return;
    const block = supportSelectedBlock();
    const r = supportReveal();
    const type = (state.customLevelData && state.customLevelData.type) || 'text';
    if (!r || !block) { box.hidden = true; box.innerHTML = ''; return; }
    if (type === 'mcq') {
        const ref = SUPPORT_REFS[SUPPORT_LEVEL_REF[state.level]];
        if (ref && r > 0.5) { box.hidden = false; box.className = 'pg-support is-ref'; box.textContent = ref; }
        else { box.hidden = true; box.innerHTML = ''; }
        return;
    }
    if (block._supportModel === undefined) block._supportModel = supportModelFor(block.data);
    const model = block._supportModel;
    if (model) {
        const typed = type === 'multiline' || type === 'multistep' || type === 'var_print' ? els.codeArea.value : els.codeInput.value;
        const ownWords = [/^#/m.test(model.text) ? 'the comment' : '', model.text.indexOf(SUPPORT_FREE_TEXT) !== -1 ? 'the quotes' : '']
            .filter(Boolean).join(' and ');
        box.className = 'pg-support';
        window.BCSupport.renderTypedHint(box, model.text, model.exact ? typed : '', r,
            model.exact ? 'Model: type it yourself' : 'Model to follow: your own words go in ' + ownWords);
        return;
    }
    const ref = SUPPORT_REFS[SUPPORT_LEVEL_REF[state.level]];
    if (ref && r > 0.5) { box.hidden = false; box.className = 'pg-support is-ref'; box.textContent = ref; }
    else { box.hidden = true; box.innerHTML = ''; }
}

// Multiple choice: some wrong options ruled out, the same ones for as long
// as this block is on screen.
function applySupportToOptions(block) {
    els.optBtns.forEach(b => { b.classList.remove('is-ruled-out'); b.disabled = false; });
    const r = supportReveal();
    if (!r || !block) return;
    const count = r > 0.9 ? 2 : r > 0.5 ? 1 : 0;
    if (!block._ruledOut) {
        const wrong = state.currentOptions.filter(o => o && o !== block.data.correctCode);
        block._ruledOut = wrong.sort(() => Math.random() - 0.5);
    }
    const out = block._ruledOut.slice(0, count);
    els.optBtns.forEach((b, i) => {
        if (out.indexOf(state.currentOptions[i]) !== -1) { b.classList.add('is-ruled-out'); b.disabled = true; }
    });
}

function recordSupportResult(correct) {
    if (!supportActive()) return;
    const f = supportFader();
    if (correct) f.correct(); else f.wrong();
}

function initSupport() {
    if (!window.BCSupport) return;
    const slot = document.getElementById('support-slot');
    if (slot && !slot.firstChild) window.BCSupport.mountToggle(slot, 'Support');
    window.BCSupport.onChange(() => {
        refreshSupportHint();
        const block = supportSelectedBlock();
        if (block && state.customLevelData && state.customLevelData.type === 'mcq') applySupportToOptions(block);
    });
    els.codeInput.addEventListener('input', refreshSupportHint);
    els.codeArea.addEventListener('input', refreshSupportHint);
}
