// --- STREAK SYSTEM ---
const STREAK_REWARDS = [
    { streak: 10, type: 'bomb' },
    { streak: 20, type: 'ice' },
    { streak: 30, type: 'hammer' },
];

function incrementStreak() {
    state.streak = (state.streak || 0) + 1;
    checkStreakRewards(state.streak);
    updateStreakDisplay();
}

function resetStreak() {
    state.streak = 0;
    updateStreakDisplay();
}

function checkStreakRewards(streak) {
    const maxMilestone = Math.max(...STREAK_REWARDS.map(r => r.streak));

    const normalizedStreak = streak > maxMilestone
        ? ((streak - 1) % maxMilestone) + 1
        : streak;

    STREAK_REWARDS.forEach(({ streak: threshold, type }) => {
        if (normalizedStreak === threshold) {
            awardPowerup(type);
        }
    });
}

function awardPowerup(type) {
    powerupState.counts[type]++;
    updatePowerupCounts();
    flashPowerupIcon(type);
}

function flashPowerupIcon(type) {
    const item = document.querySelector(`.powerup-item[data-type="${type}"]`);
    if (!item) return;
    item.classList.add('powerup-earned');
    setTimeout(() => item.classList.remove('powerup-earned'), 2000);
}

function updateStreakDisplay() {
    const el = document.getElementById('streak');
    if (!el) return;
    el.textContent = state.streak || 0;
}

// --- POWERUP STATE ---
const powerupState = {
    counts: { bomb: 0, ice: 0, hammer: 0 },
    active: null,
    hammerHits: 0,
    hammerFollower: null,
    iceFrozen: false,
    iceTimeout: null,
    iceFollower: null,
    bombFollower: null,
    streak: 0,
};

function updatePowerupCounts() {
    const items = document.querySelectorAll('.powerup-item');
    items[0].querySelector('.powerup-count').innerText = powerupState.counts.bomb;
    items[1].querySelector('.powerup-count').innerText = powerupState.counts.ice;
    items[2].querySelector('.powerup-count').innerText = powerupState.counts.hammer;
}

function activatePowerup(type) {
    if (!state.isPlaying) return;
    if (!devMode && powerupState.counts[type] <= 0) return;
    if (powerupState.active) cancelPowerup();

    powerupState.active = type;
    document.querySelectorAll('.powerup-item').forEach(el => el.classList.remove('powerup-active'));
    document.querySelector(`.powerup-item[data-type="${type}"]`).classList.add('powerup-active');

    if (type === 'bomb') activateBomb();
    if (type === 'ice') activateIce();
    if (type === 'hammer') activateHammer();
}

function cancelPowerup() {
    if (powerupState.active === 'bomb' && powerupState.bombFollower) {
        powerupState.bombFollower.remove();
        powerupState.bombFollower = null;
        els.gameArea.removeEventListener('mousemove', bombFollowMouse);
        els.gameArea.removeEventListener('click', placeBomb);
    }
    if (powerupState.active === 'ice' && powerupState.iceFollower) {
        powerupState.iceFollower.remove();
        powerupState.iceFollower = null;
        els.gameArea.removeEventListener('mousemove', iceFollowMouse);
        els.gameArea.removeEventListener('click', placeIce);
    }
    if (powerupState.active === 'hammer') {
        document.body.style.cursor = '';
        document.removeEventListener('mousemove', hammerFollowMouse);
        if (powerupState.hammerFollower) {
            powerupState.hammerFollower.remove();
            powerupState.hammerFollower = null;
            cancelHammer();
        }
        state.blocks.forEach(b => b.el.removeEventListener('click', hammerClickBlock));
    }
    powerupState.active = null;
    powerupState.hammerHits = 0;
    document.querySelectorAll('.powerup-item').forEach(el => el.classList.remove('powerup-active'));
}

function cleanupPowerups() {
    cancelPowerup();

    // Clear ice freeze
    if (powerupState.iceTimeout) {
        clearTimeout(powerupState.iceTimeout);
        powerupState.iceTimeout = null;
    }
    powerupState.iceFrozen = false;
    state.gameSpeed = state.levelBaseSpeed;

    // Remove ice indicator if present
    const indicator = document.getElementById('ice-indicator');
    if (indicator) indicator.remove();

    // Remove any placed bomb/ice containers
    document.querySelectorAll('#bomb-follower, #ice-follower').forEach(el => el.remove());

    // Reset cursor
    document.body.style.cursor = '';
}

// --- BOMB ---
function activateBomb() {
    const follower = document.createElement('div');
    follower.id = 'bomb-follower';
    follower.style.cssText = `
        position: absolute; width: 60px; height: 66px;
        pointer-events: none; z-index: 200;
        transform: translate(-50%, -50%);
    `;
    const img = document.createElement('img');
    img.src = 'assets/bomb_static_icon.svg';
    img.style.cssText = 'width:100%; height:100%; pointer-events:none; user-select:none;';
    follower.appendChild(img);
    els.gameArea.appendChild(follower);
    powerupState.bombFollower = follower;

    els.gameArea.addEventListener('mousemove', bombFollowMouse);

    // Delay attaching the placement click so the activating click doesn't immediately place it
    setTimeout(() => {
        els.gameArea.addEventListener('click', placeBomb);
    }, 200);
}

function bombFollowMouse(e) {
    const rect = els.gameArea.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    powerupState.bombFollower.style.left = x + 'px';
    powerupState.bombFollower.style.top = y + 'px';
}

function placeBomb(e) {
    const rect = els.gameArea.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Remove follower and listeners
    els.gameArea.removeEventListener('mousemove', bombFollowMouse);
    els.gameArea.removeEventListener('click', placeBomb);
    powerupState.bombFollower.remove();
    powerupState.bombFollower = null;
    powerupState.active = null;
    document.querySelectorAll('.powerup-item').forEach(el => el.classList.remove('powerup-active'));

    if (!devMode) { powerupState.counts.bomb--; updatePowerupCounts(); }
    updatePowerupCounts();

    // Place animated bomb iframe
    const container = document.createElement('div');
    container.style.cssText = `
                position: absolute; width: 44px; height: 48px;
                left: ${x - 22}px; top: ${y - 24}px;
                pointer-events: none; z-index: 200;
                overflow: hidden;
            `;
    const iframe = document.createElement('iframe');
    iframe.src = 'assets/bomb_active.html';
    iframe.style.cssText = `
                width: 200px; height: 220px; border: none; background: transparent;
                transform: scale(${44 / 200});
                transform-origin: top left;
            `;
    iframe.setAttribute('scrolling', 'no');
    container.appendChild(iframe);
    els.gameArea.appendChild(container);

    // After animation (2.3s) explode
    setTimeout(() => {
        container.remove();
        bombExplode(x, y, 150);
    }, 2300);
}

function bombExplode(cx, cy, radius) {
    const flash = document.createElement('div');
    flash.style.cssText = `
                position:absolute; border-radius:50%;
                width:${radius * 2}px; height:${radius * 2}px;
                left:${cx - radius}px; top:${cy - radius}px;
                background: radial-gradient(circle, rgba(255,200,50,0.7), rgba(255,80,0,0.3), transparent);
                pointer-events:none; z-index:190;
                animation: bombFlash 0.5s ease-out forwards;
            `;
    els.gameArea.appendChild(flash);
    setTimeout(() => flash.remove(), 500);

    const areaRect = els.gameArea.getBoundingClientRect();

    const toDestroy = state.blocks.filter(block => {
        const blockRect = block.el.getBoundingClientRect();

        const left = blockRect.left - areaRect.left;
        const top = blockRect.top - areaRect.top;
        const right = blockRect.right - areaRect.left;
        const bottom = blockRect.bottom - areaRect.top;

        const nearestX = Math.max(left, Math.min(cx, right));
        const nearestY = Math.max(top, Math.min(cy, bottom));

        const dist = Math.sqrt((nearestX - cx) ** 2 + (nearestY - cy) ** 2);
        return dist <= radius;
    });
    toDestroy.forEach(block => handleSuccess(block, true));
}

// --- ICE ---
function activateIce() {
    if (powerupState.iceFrozen) return;

    const follower = document.createElement('div');
    follower.id = 'ice-follower';
    follower.style.cssText = `
        position: absolute; width: 44px; height: 48px;
        pointer-events: none; z-index: 200;
        transform: translate(-50%, -50%);
    `;
    const img = document.createElement('img');
    img.src = 'assets/ice_static_icon.svg';
    img.style.cssText = 'width:100%; height:100%; pointer-events:none; user-select:none;';
    follower.appendChild(img);
    els.gameArea.appendChild(follower);
    powerupState.iceFollower = follower;

    els.gameArea.addEventListener('mousemove', iceFollowMouse);

    setTimeout(() => {
        els.gameArea.addEventListener('click', placeIce);
    }, 200);
}

function iceFollowMouse(e) {
    const rect = els.gameArea.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    powerupState.iceFollower.style.left = x + 'px';
    powerupState.iceFollower.style.top = y + 'px';
}

function placeIce(e) {
    const rect = els.gameArea.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    els.gameArea.removeEventListener('mousemove', iceFollowMouse);
    els.gameArea.removeEventListener('click', placeIce);
    powerupState.iceFollower.remove();
    powerupState.iceFollower = null;
    powerupState.active = null;
    document.querySelectorAll('.powerup-item').forEach(el => el.classList.remove('powerup-active'));

    if (!devMode) { powerupState.counts.ice--; updatePowerupCounts(); }

    const container = document.createElement('div');
    container.style.cssText = `
        position: absolute; width: 44px; height: 48px;
        left: ${x - 22}px; top: ${y - 24}px;
        pointer-events: none; z-index: 200;
        overflow: hidden;
    `;
    const iframe = document.createElement('iframe');
    iframe.setAttribute('scrolling', 'no');
    iframe.style.cssText = `
        width: 200px; height: 220px; border: none; background: transparent;
        transform: scale(${44 / 200});
        transform-origin: top left;
        overflow: hidden;
        display: block;
    `;
    container.appendChild(iframe);
    els.gameArea.appendChild(container);

    iframe.onload = () => {
        setTimeout(() => {
            container.remove();
            triggerFreeze();
        }, 3000);
    };

    // Set src after onload is attached
    iframe.src = 'assets/ice_active.html';
}

function triggerFreeze() {
    if (powerupState.iceFrozen) return;
    powerupState.iceFrozen = true;
    const savedSpeed = state.gameSpeed;
    state.gameSpeed = 0;

    const indicator = document.createElement('div');
    indicator.id = 'ice-indicator';
    indicator.className = 'pg-ice-indicator';
    indicator.innerText = 'Frozen: 30s';
    els.gameArea.appendChild(indicator);

    let remaining = 30;
    const interval = setInterval(() => {
        remaining--;
        if (indicator.parentNode) indicator.innerText = `Frozen: ${remaining}s`;
        if (remaining <= 0) clearInterval(interval);
    }, 1000);

    powerupState.iceTimeout = setTimeout(() => {
        state.gameSpeed = savedSpeed;
        powerupState.iceFrozen = false;
        if (indicator.parentNode) indicator.remove();
    }, 30000);
}

// --- HAMMER ---
function activateHammer() {
    powerupState.hammerHits = 0;

    const follower = document.createElement('div');
    follower.id = 'hammer-follower';
    follower.style.cssText = `
        position: fixed; width: 44px; height: 48px;
        pointer-events: none; z-index: 9999;
        transform: translate(-8px, -8px);
    `;
    const iframe = document.createElement('iframe');
    iframe.src = 'assets/hammer_active.html';
    iframe.setAttribute('scrolling', 'no');
    iframe.style.cssText = `
        width: 200px; height: 220px; border: none; background: transparent;
        transform: scale(${44 / 200});
        transform-origin: top left;
        overflow: hidden;
        display: block;
        pointer-events: none;
    `;
    follower.appendChild(iframe);
    document.body.appendChild(follower);
    powerupState.hammerFollower = follower;

    document.addEventListener('mousemove', hammerFollowMouse);
    document.body.classList.add('hammer-active');

    // Click anywhere in game area to swing
    els.gameArea.addEventListener('click', hammerSwingClick, true);
}

function hammerFollowMouse(e) {
    if (!powerupState.hammerFollower) return;
    powerupState.hammerFollower.style.left = e.clientX + 'px';
    powerupState.hammerFollower.style.top = (e.clientY * 1.25) + 'px';
}

function hammerSwingClick(e) {
    e.stopPropagation();
    e.preventDefault();

    // Trigger swing animation in iframe
    const iframe = powerupState.hammerFollower?.querySelector('iframe');
    if (iframe?.contentWindow) {
        try { iframe.contentWindow.triggerSwing(); } catch (err) { }
    }

    // Find which block was clicked
    const block = state.blocks.find(b => b.el === e.target || b.el.contains(e.target));
    if (block) {
        handleSuccess(block, true);
        powerupState.hammerHits++;

        if (powerupState.hammerHits >= 10) {
            if (!devMode) { powerupState.counts.hammer--; updatePowerupCounts(); }
            cancelPowerup();
            return;
        }
    }
}

function cancelHammer() {
    if (powerupState.hammerFollower) {
        powerupState.hammerFollower.remove();
        powerupState.hammerFollower = null;
    }
    document.removeEventListener('mousemove', hammerFollowMouse);
    els.gameArea.removeEventListener('click', hammerSwingClick, true);
    document.body.classList.remove('hammer-active');
}

function hammerFollowMouse(e) {
    if (!powerupState.hammerFollower) return;
    powerupState.hammerFollower.style.left = e.clientX + 'px';
    powerupState.hammerFollower.style.top = e.clientY + 'px';
}

function playHammerAnimation(x, y) {
    const container = document.createElement('div');
    container.style.cssText = `
        position: fixed; width: 44px; height: 48px;
        left: ${x - 22}px; top: ${y - 24}px;
        pointer-events: none; z-index: 9998;
        overflow: hidden;
    `;
    const iframe = document.createElement('iframe');
    iframe.setAttribute('scrolling', 'no');
    iframe.style.cssText = `
        width: 200px; height: 220px; border: none; background: transparent;
        transform: scale(${44 / 200});
        transform-origin: top left;
        overflow: hidden;
        display: block;
    `;
    container.appendChild(iframe);
    document.body.appendChild(container);
    iframe.src = 'assets/hammer_active.html';
    setTimeout(() => container.remove(), 500);
}

function hammerClickBlock(e) {
    e.stopPropagation();
    const block = state.blocks.find(b => b.el === this);
    if (!block) return;

    playHammerAnimation(e.clientX, e.clientY);
    handleSuccess(block, true);
    powerupState.hammerHits++;

    state.blocks.forEach(b => {
        b.el.removeEventListener('click', hammerClickBlock);
        b.el.addEventListener('click', hammerClickBlock);
    });

    if (powerupState.hammerHits >= 10) {
        if (!devMode) { powerupState.counts.hammer--; updatePowerupCounts(); }
        cancelPowerup();
    }
}

function togglePowerups() {
    const panel = document.getElementById('powerups-panel');
    const toggle = document.getElementById('powerups-toggle');
    panel.classList.toggle('hidden');
    toggle.innerHTML = panel.classList.contains('hidden') ? '&#9664;' : '&#9654;';
}
