// Running the Python: resetting, Skulpt, the animation loop, each action, winning.
// --- Game Logic & Python Bridge ---

function resetLevel() {
    isPlaying = false;
    commandQueue = [];
    clearInterval(timerInterval);
    timeElapsed = 0;
    document.getElementById("time-elapsed").innerText = "0.0";
    
    playerState.x = levelData.startX;
    playerState.z = levelData.startZ;
    playerState.h = levelData.startH;
    playerState.dir = levelData.startDir; 
    playerState.animating = false;
    playerState.currentAction = null;
    
    updatePlayerTransform(true);

    lightsRemaining = 0;
    for (let z = 0; z < levelData.height.length; z++) {
        for (let x = 0; x < levelData.height[0].length; x++) {
            let tile = gridTiles[z][x];
            if (tile.item === 'L' && tile.meshes.length > 0) {
                setTileLit(tile, false);
                lightsRemaining++;
            }
        }
    }
}

function updatePlayerTransform(instant = false) {
    const heightScale = 0.5;
    const cols = levelData.height[0].length;
    const rows = levelData.height.length;
    const offsetX = -cols / 2 + 0.5;
    const offsetZ = -rows / 2 + 0.5;

    let targetWorldX = playerState.x + offsetX;
    let targetWorldZ = playerState.z + offsetZ;
    let targetWorldY = playerState.h * heightScale;
    
    let targetRotY = 0;
    if (playerState.dir === 0) targetRotY = Math.PI / 2;
    else if (playerState.dir === 1) targetRotY = 0;
    else if (playerState.dir === 2) targetRotY = -Math.PI / 2;
    else if (playerState.dir === 3) targetRotY = Math.PI;

    if (instant) {
        playerMesh.position.set(targetWorldX, targetWorldY, targetWorldZ);
        playerMesh.rotation.y = targetRotY;
    }
}

// Skulpt setup
function outf(text) { console.log(text); }
function builtinRead(x) {
    if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
            throw "File not found: '" + x + "'";
    return Sk.builtinFiles["files"][x];
}

function playCode() {
    if (isPlaying) return;
    resetLevel();
    saveCurrentCode();
    
    const prog = editor.getValue();
    Sk.configure({ output: outf, read: builtinRead });
    
    Sk.builtins.walk_forward = new Sk.builtin.func(() => { commandQueue.push('walk_forward'); });
    Sk.builtins.turn_right = new Sk.builtin.func(() => { commandQueue.push('turn_right'); });
    Sk.builtins.turn_left = new Sk.builtin.func(() => { commandQueue.push('turn_left'); });
    Sk.builtins.jump = new Sk.builtin.func(() => { commandQueue.push('jump'); });
    Sk.builtins.light = new Sk.builtin.func(() => { commandQueue.push('light'); });

    try {
        Sk.misceval.asyncToPromise(() => Sk.importMainWithBody("<stdin>", false, prog, true))
        .then(() => {
            isPlaying = true;
            timerInterval = setInterval(() => {
                timeElapsed += 0.1;
                document.getElementById("time-elapsed").innerText = timeElapsed.toFixed(1);
            }, 100);
        })
        .catch(err => {
            alert(err.toString());
        });
    } catch (e) {
        alert(e.toString());
    }
}

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    let dt = clock.getDelta();
    
    if (isPlaying) {
        const speedMultiplier = parseFloat(document.getElementById("speed-slider").value);
        
        if (!playerState.animating && commandQueue.length > 0) {
            startAction(commandQueue.shift());
        } else if (!playerState.animating && commandQueue.length === 0) {
            isPlaying = false;
            clearInterval(timerInterval);
            if (lightsRemaining === 0 && levelData.items.flat().includes('L')) {
                if (isExampleMode) {
                    // In example mode: pause briefly then loop again
                    setTimeout(() => examplePlay(), 1200);
                } else {
                    handleWin();
                }
            } else if (isExampleMode) {
                // Ran out of commands but didn't win - still loop
                setTimeout(() => examplePlay(), 1200);
            }
        }

        if (playerState.animating) {
            playerState.animProgress += dt * speedMultiplier;
            if (playerState.animProgress >= 1.0) {
                playerState.animProgress = 1.0;
                playerState.animating = false;
                applyActionFinal();
            }
            applyAnimationState();
        }
    }
    
    controls.update();
    renderer.render(scene, camera);
}

// --- Action Logic ---
function getForwardCoords() {
    let nx = playerState.x;
    let nz = playerState.z;
    if (playerState.dir === 0) nx++;
    if (playerState.dir === 1) nz++;
    if (playerState.dir === 2) nx--;
    if (playerState.dir === 3) nz--;
    return { x: nx, z: nz };
}

function isValidTile(x, z) {
    return x >= 0 && x < levelData.height[0].length && z >= 0 && z < levelData.height.length;
}

function startAction(action) {
    playerState.currentAction = action;
    playerState.animating = true;
    playerState.animProgress = 0;

    playerState.startX = playerState.x;
    playerState.startZ = playerState.z;
    playerState.startH = playerState.h;
    playerState.startDir = playerState.dir;

    playerState.targetX = playerState.x;
    playerState.targetZ = playerState.z;
    playerState.targetH = playerState.h;
    playerState.targetDir = playerState.dir;

    const rows = levelData.height.length;
    const cols = levelData.height[0].length;

    let dx = 0, dz = 0;
    if (playerState.dir === 0) dx = 1;
    else if (playerState.dir === 1) dz = 1;
    else if (playerState.dir === 2) dx = -1;
    else if (playerState.dir === 3) dz = -1;

    let nextX = playerState.x + dx;
    let nextZ = playerState.z + dz;
    
    let isValidMove = (nextX >= 0 && nextX < cols && nextZ >= 0 && nextZ < rows);

    switch (action) {
        case 'walk_forward':
            if (isValidMove && levelData.height[nextZ][nextX] === playerState.h) {
                playerState.targetX = nextX;
                playerState.targetZ = nextZ;
            }
            break;
            
        case 'jump':
            if (isValidMove) {
                let nextH = levelData.height[nextZ][nextX];
                if (nextH === playerState.h + 1 || nextH < playerState.h) {
                    playerState.targetX = nextX;
                    playerState.targetZ = nextZ;
                    playerState.targetH = nextH;
                }
            }
            break;

        case 'turn_right':
            playerState.targetDir = (playerState.dir + 1) % 4; 
            break;
            
        case 'turn_left':
            playerState.targetDir = (playerState.dir + 3) % 4; 
            break;
            
        case 'light':
            break;
    }
}

function applyAnimationState() {
    const heightScale = 0.5;
    let p = playerState.animProgress;
    let ease = p; 
    
    const cols = levelData.height[0].length;
    const rows = levelData.height.length;
    const offsetX = -cols / 2 + 0.5;
    const offsetZ = -rows / 2 + 0.5;

    let curX = playerState.startX + (playerState.targetX - playerState.startX) * ease;
    let curZ = playerState.startZ + (playerState.targetZ - playerState.startZ) * ease;
    let logicalH = playerState.startH + (playerState.targetH - playerState.startH) * ease;
    let curH = logicalH * heightScale; 
    
    if (playerState.currentAction === 'jump' && (playerState.targetX !== playerState.startX || playerState.targetZ !== playerState.startZ)) {
        curH += Math.sin(p * Math.PI) * (1.0 * heightScale);
    }
    playerMesh.position.set(curX + offsetX, curH, curZ + offsetZ);

    let startRot = getRotationForDir(playerState.startDir);
    let targetRot = getRotationForDir(playerState.targetDir);
    
    if (Math.abs(targetRot - startRot) > Math.PI) {
        if (targetRot > startRot) startRot += Math.PI * 2;
        else targetRot += Math.PI * 2;
    }
    playerMesh.rotation.y = startRot + (targetRot - startRot) * ease;

    const rig = playerMesh.userData;
    
    let shoulderX = -Math.PI / 4;
    let elbowX = -Math.PI / 4;

    const action = playerState.currentAction;
    
    if (action === 'walk_forward' || action === 'jump' || action === 'turn_right' || action === 'turn_left') {
        const speedMultiplier = parseFloat(document.getElementById("speed-slider").value);
        rig.trackMat.map.offset.y -= 0.05 * speedMultiplier; 
    }

    if (action === 'light') {
        shoulderX -= Math.sin(p * Math.PI) * (Math.PI / 1.5);
        elbowX += Math.sin(p * Math.PI) * (Math.PI / 4);
    } else if (action === 'jump') {
        shoulderX += Math.sin(p * Math.PI) * (Math.PI / 4);
    } else if (action === 'walk_forward') {
        shoulderX += Math.sin(p * Math.PI * 2) * 0.1;
    }

    rig.shoulders.forEach(s => s.rotation.x = shoulderX);
    rig.elbows.forEach(e => e.rotation.x = elbowX);
}

function applyActionFinal() {
    playerState.x = playerState.targetX;
    playerState.z = playerState.targetZ;
    playerState.h = playerState.targetH;
    playerState.dir = playerState.targetDir;
    
    if (playerState.currentAction === 'light') {
        let tile = gridTiles[playerState.z][playerState.x];
        if (tile.item === 'L') {
            const wasLit = tile.isLit;
            setTileLit(tile, !wasLit);
            lightsRemaining += wasLit ? 1 : -1;
        }
    }

    if (playerMesh && playerMesh.userData.shoulders) {
        playerMesh.userData.shoulders.forEach(s => s.rotation.x = -Math.PI / 4);
        playerMesh.userData.elbows.forEach(e => e.rotation.x = -Math.PI / 4);
    }
    
    updatePlayerTransform(true);
}

function getRotationForDir(dir) {
    if (dir === 0) return Math.PI / 2;
    if (dir === 1) return 0;
    if (dir === 2) return -Math.PI / 2;
    return Math.PI;
}

function handleWin() {
    const linesUsed = updateLineCount();
    let medal = 'none';
    if (linesUsed <= levelData.gold) medal = 'gold';
    else if (linesUsed <= levelData.silver) medal = 'silver';
    else if (linesUsed <= levelData.bronze) medal = 'bronze';

    document.getElementById("win-medal").innerHTML = medalIcon(medal, 72) +
        '<span>' + (medal === 'none' ? 'Solved' : MEDAL_LABELS[medal] + ' medal') + '</span>';
    document.getElementById("win-lines").innerText = linesUsed;
    document.getElementById("win-time").innerText = timeElapsed.toFixed(1);
    // Show the next target, so a student can see what fewer lines would earn.
    const next = medal === 'gold' ? '' : medal === 'silver' ? 'Gold needs ' + levelData.gold + ' lines or fewer.'
        : medal === 'bronze' ? 'Silver needs ' + levelData.silver + ' lines or fewer, gold ' + levelData.gold + '.'
        : 'Bronze needs ' + levelData.bronze + ' lines or fewer.';
    document.getElementById("win-next").textContent = next;
    document.getElementById("win-modal").classList.remove("hidden");

    // Save progress for native levels only, keeping the best result.
    if (!isCustomLevel) {
        const rank = { '': 0, none: 1, bronze: 2, silver: 3, gold: 4 };
        const prev = savedData.levels[currentLevelIndex] || (savedData.levels[currentLevelIndex] = {});
        if (!prev.lines || linesUsed < prev.lines) prev.lines = linesUsed;
        if (rank[medal] >= rank[medalName(prev.medal)]) prev.medal = medal;
        localStorage.setItem('lightbotSave', JSON.stringify(savedData));
    }

    if (!isCustomLevel) {
        postToParent({
            type: 'LEVEL_COMPLETE',
            appHint: 'pybot',
            level: currentLevelIndex,
            medal,
            lines: linesUsed,
            time: timeElapsed
        });
    }
}

// Start
window.onload = init;
