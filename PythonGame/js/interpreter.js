// The Write Python window: the editor, running, saving and opening files.
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

let pythonEditor = null;

function openPythonInterpreter() {
    document.getElementById('python-interpreter-modal').classList.add('active');
    document.getElementById('python-interpreter-overlay').classList.add('active');

    if (!pythonEditor) {
        pythonEditor = CodeMirror.fromTextArea(document.getElementById('python-input'), {
            mode: 'python',
            theme: 'bc',
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
            : `<span class="py-empty">(no output)</span>`;
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
