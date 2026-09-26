// Checking an answer of each kind, and the console for code that asks for input.
function buildRegex(pattern) {
    const anchored = pattern.startsWith('^') || pattern.endsWith('$');
    return new RegExp(anchored ? pattern : '^' + pattern + '$');
}

// While the console waits for input, the block is already answered.
function submitTextAnswer() {
    if (!state.selectedBlockId || state.waitingForInput) return;
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
    if (!state.selectedBlockId || state.waitingForInput) return;
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

// Runs the accepted code with what the student typed at each input() prompt.
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
        // The code was already marked right; the value typed at the prompt
        // is what int() or float() could not convert. Ask again rather than
        // count a correct answer wrong.
        if (/ValueError/.test(String(e))) {
            block._runnableCode = codeToRun;
            const firstPrompt = codeToRun.match(/input\s*\(\s*["'](.+?)["']\s*\)/);
            triggerConsoleInput(block, firstPrompt ? firstPrompt[1] : null);
            showLogicNotice(/float/.test(String(e))
                ? 'float() needs a number, like 1.75. Type it again.'
                : 'int() needs a whole number, like 15. Type it again.');
            return;
        }
        processResult(false);
    }
}

function submitMultiAnswer() {
    if (!state.selectedBlockId || state.waitingForInput) return;
    const block = state.blocks.find(b => b.id === state.selectedBlockId);
    if (!block) return;
    const lines = els.codeArea.value.trim().split('\n').filter(l => l !== "");
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
