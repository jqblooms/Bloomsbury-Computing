// Loading a custom level or exam from a link or pasted JSON (the teacher panel).
// --- JSON LOADER ---
function openLoadLevelModal(type) {
    state.loadingType = type;
    const title = type === 'exam' ? "Load a custom exam" : "Load a custom level";
    document.querySelector('#load-level-modal h2').innerText = title;
    setLoadTab('url');
    document.getElementById('load-level-modal').classList.add('active');
    document.getElementById('level-url-input').focus();
}
function closeLoadLevelModal() { document.getElementById('load-level-modal').classList.remove('active'); }

async function submitCustomLevel(rawJson = null) {
    let data;

    if (rawJson) {
        try {
            data = JSON.parse(rawJson);
        } catch (e) {
            alert("Error loading JSON: " + e.message);
            return;
        }
    } else {
        const url = document.getElementById('level-url-input').value.trim();
        if (!url) return;

        const btn = document.getElementById('load-level-go');
        const originalText = btn.innerText;
        btn.innerText = "Loading..."; btn.disabled = true;

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error("Fetch failed: " + res.status);
            data = await res.json();
        } catch (e) {
            alert("Error loading JSON: " + e.message);
            return;
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }

    try {
        if (state.loadingType === 'exam') {
            if (!data.questions) throw new Error("Invalid Exam JSON: Missing 'questions'");
        } else {
            if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
                throw new Error("Invalid Level JSON: Must contain 'questions' array.");
            }
        }

        closeLoadLevelModal();

        if (state.loadingType === 'exam') {
            state.customExamData = data;
            startExam('custom', null);
        } else {
            state.customLevelData = data;
            startGame('custom', false, null);
        }
    } catch (e) {
        alert("Error loading JSON: " + e.message);
    }
}

let currentLoadTab = 'url';

function setLoadTab(tab) {
    currentLoadTab = tab;
    document.getElementById('load-tab-url').hidden = tab !== 'url';
    document.getElementById('load-tab-json').hidden = tab !== 'json';
    document.getElementById('tab-url').classList.toggle('is-active', tab === 'url');
    document.getElementById('tab-json').classList.toggle('is-active', tab === 'json');
}

function submitCustomLevelAuto() {
    if (currentLoadTab === 'json') {
        const raw = document.getElementById('level-json-input').value.trim();
        if (!raw) return;
        submitCustomLevel(raw);
    } else {
        submitCustomLevel();
    }
}
