// Game state, the 3D tile looks and the robot position.
// --- Global Variables ---
let currentLevelIndex = 0;
let levelData = {};
let editor;
let isPlaying = false;
let commandQueue = [];
let savedData = JSON.parse(localStorage.getItem('lightbotSave')) || { levels: {} };
let timerInterval;
let timeElapsed = 0;
let isLevelActive = false;

// --- Embed API State ---
let isCustomLevel = false;       // True when a level was injected via postMessage
let isExampleMode = false;       // True when running in read-only demo loop mode
let customLevelString = null;    // Stored so Restart can reload the same string

// Three.js Variables
let scene, camera, renderer, controls;
let gridGroup, playerMesh;
let gridTiles = [];
let lightsRemaining = 0;
let clock = new THREE.Clock();

const tileVisuals = {
    normalMat: new THREE.MeshStandardMaterial({ color: 0x888888 }),
    edgeGrey: new THREE.LineBasicMaterial({ color: 0x555555 }),
    lightOff: 0x0055ff,
    lightOn: 0xffff99,
    lightEdgeOff: 0x0000aa,
    lightEdgeOn: 0xccaa00,
    lightEmissive: 0xffee66
};

function createLightTileMaterial() {
    return new THREE.MeshStandardMaterial({
        color: tileVisuals.lightOff,
        emissive: 0x000000,
        emissiveIntensity: 0
    });
}

function createLightEdgeMaterial() {
    return new THREE.LineBasicMaterial({ color: tileVisuals.lightEdgeOff });
}

// Player State
let playerState = {
    x: 0, z: 0, h: 0,
    dir: 2,
    animating: false,
    animProgress: 0,
    currentAction: null,
    startX: 0, startZ: 0, startH: 0, startDir: 0,
    targetX: 0, targetZ: 0, targetH: 0, targetDir: 0
};

// Medals are saved as 'gold', 'silver', 'bronze' or 'none' (the server and
// shared/cloud-save.js rank those words). Older saves hold the medal emoji,
// so both are read.
function medalName(value) {
    const v = String(value || '').toLowerCase();
    if (v.indexOf('gold') !== -1 || v.indexOf('\u{1F947}') !== -1) return 'gold';
    if (v.indexOf('silver') !== -1 || v.indexOf('\u{1F948}') !== -1) return 'silver';
    if (v.indexOf('bronze') !== -1 || v.indexOf('\u{1F949}') !== -1) return 'bronze';
    return value ? 'none' : '';
}
const MEDAL_LABELS = { gold: 'Gold', silver: 'Silver', bronze: 'Bronze', none: 'Solved', '': 'Not solved yet' };
function medalIcon(name, size) {
    const s = size || 28;
    if (name === 'gold' || name === 'silver' || name === 'bronze') {
        return '<svg class="medal medal-' + name + '" width="' + s + '" height="' + s + '" viewBox="0 0 32 32" role="img" aria-label="' + MEDAL_LABELS[name] + ' medal">' +
            '<path class="medal-ribbon" d="M10 2h5l3 9h-5zM22 2h-5l-3 9h5z"/>' +
            '<circle class="medal-disc" cx="16" cy="20" r="9"/><circle class="medal-rim" cx="16" cy="20" r="6"/></svg>';
    }
    if (name === 'none') {
        return '<svg class="medal medal-none" width="' + s + '" height="' + s + '" viewBox="0 0 32 32" role="img" aria-label="Solved"><circle cx="16" cy="16" r="10"/><path d="m11 16 3.5 3.5L21 13"/></svg>';
    }
    return '<svg class="medal medal-empty" width="' + s + '" height="' + s + '" viewBox="0 0 32 32" role="img" aria-label="Not solved yet"><circle cx="16" cy="16" r="10"/></svg>';
}
