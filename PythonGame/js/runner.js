// Running Python (Skulpt) for an answer, and marking extended exam answers by running them.
function isRunnableCode(code) {
    const trimmed = code.trim();

    // Plain text answers like "Syntax Error", "Logic Error"
    if (/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(trimmed)) return false;

    // Single-line incomplete statements - while/for/if with no body
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

    // No parentheses or assignment - just an expression or snippet
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

    // Find ALL assignments - varName = (not ==, !=, <=, >=)
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
