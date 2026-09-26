// Talking to the site and to a lesson that embeds the game: messages, the TurboBot layout, medal targets, speed.
// --- Embed API: postMessage bridge ---

function postToParent(payload) {
    if (window.parent !== window) {
        window.parent.postMessage(payload, '*');
    }
}

function initEmbedListener() {
    window.addEventListener('message', (e) => {
        const { type, data } = e.data || {};
        switch (type) {
            case 'LOAD_LEVEL':
                loadLevel(parseInt(data.id, 10));
                break;
            case 'LOAD_CUSTOM_LEVEL':
                loadCustomLevel(data.levelString);
                break;
            case 'LOAD_EXAMPLE':
                loadExampleMode(data.levelString, data.code);
                break;
            case 'RESET':
                resetLevel();
                break;
            case 'SET_CODE':
                editor.setValue(data.code || '');
                updateLineCount();
                break;
            case 'RUN_CODE':
                runInjectedCode(data.code || '');
                break;
            case 'TURBOBOT_MODE':
                applyTurboBotLayout(data || {});
                break;
            case 'SHOW_MENU':
                showMenu();
                break;
            case 'GET_STATE':
                postToParent({
                    type: 'STATE_RESPONSE',
                    level: currentLevelIndex,
                    isCustomLevel,
                    isPlaying,
                    lightsRemaining,
                    timeElapsed
                });
                break;
        }
    });
}

function applyTurboBotLayout(options = {}) {
    document.body.classList.add('turbobot-embed');
    // The layout itself is in style.css (body.turbobot-embed).
    const intro = document.querySelector('#menu-modal .modal p');
    if (intro) intro.textContent = 'Build a program from blocks to light every blue tile. Fewer blocks earn a better medal.';
    const params = new URLSearchParams(window.location.search);
    const shouldShowLevelsButton = options.showLevelsButton !== false && params.get('hideMenu') !== 'true';
    const existingButton = document.getElementById('turbobot-levels-button');
    if (!shouldShowLevelsButton && existingButton) {
        existingButton.remove();
    }
    if (shouldShowLevelsButton && !existingButton) {
        const button = document.createElement('button');
        button.id = 'turbobot-levels-button';
        button.type = 'button';
        button.textContent = 'Levels';
        button.addEventListener('click', showMenu);
        document.body.appendChild(button);
    }
    ensureTurboBotMedalBadge();
    updateMedalDisplay();
    setSpeedMultiplier(3);
    setTimeout(resizeCanvas, 0);
    setTimeout(resizeCanvas, 250);
}

function ensureTurboBotMedalBadge() {
    if (document.getElementById('turbobot-medal-requirements')) return;
    const badge = document.createElement('div');
    badge.id = 'turbobot-medal-requirements';
    badge.hidden = true;
    badge.innerHTML = '<span class="medal-label">Medals</span>' + ['gold', 'silver', 'bronze'].map(m =>
        '<span class="medal-target">' + medalIcon(m, 20) + '<span data-medal="' + m + '">-</span></span>').join('');
    document.body.appendChild(badge);
}

function updateMedalDisplay() {
    const badge = document.getElementById('turbobot-medal-requirements');
    if (!badge) return;

    const hasRequirements = isLevelActive && levelData && Number.isFinite(levelData.gold) && Number.isFinite(levelData.silver) && Number.isFinite(levelData.bronze);
    badge.hidden = !hasRequirements;
    if (!hasRequirements) return;

    badge.querySelector('[data-medal="gold"]').textContent = `${levelData.gold} blocks`;
    badge.querySelector('[data-medal="silver"]').textContent = `${levelData.silver} blocks`;
    badge.querySelector('[data-medal="bronze"]').textContent = `${levelData.bronze} blocks`;
}

function setSpeedMultiplier(value) {
    const slider = document.getElementById('speed-slider');
    const display = document.getElementById('speed-display');
    if (!slider || !display) return;
    slider.value = String(value);
    display.innerText = parseFloat(slider.value).toFixed(1) + 'x';
}

function restoreEditableRunUi() {
    isExampleMode = false;
    document.getElementById('editor-container').style.display = '';
    document.getElementById('example-code-display').style.display = 'none';
    document.getElementById('example-mode-badge').style.display = 'none';
    document.getElementById('btn-play').style.display = '';
    document.getElementById('btn-stop').style.display = '';
}

function runInjectedCode(code) {
    if (!isLevelActive || !levelData || !Array.isArray(levelData.height)) {
        showMenu();
        postToParent({ type: 'LEVEL_REQUIRED' });
        return;
    }
    restoreEditableRunUi();
    editor.setValue(code || '');
    updateLineCount();
    document.getElementById("win-modal").classList.add("hidden");
    playCode();
}
