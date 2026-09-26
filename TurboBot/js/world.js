// The 3D world: the scene, the robot model, building a level, lighting tiles.
// --- Three.js Setup & Building ---
function initThreeJS() {
    const container = document.getElementById("canvas-container");
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);

    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    gridGroup = new THREE.Group();
    scene.add(gridGroup);

    // --- Wall-E Robot Mesh Construction ---
    playerMesh = new THREE.Group();
    
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xdca822 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });

    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#222'; ctx.fillRect(0,0,64,128);
    ctx.fillStyle = '#555';
    for(let i=0; i<128; i+=16) ctx.fillRect(0, i, 64, 8);
    
    const trackTex = new THREE.CanvasTexture(canvas);
    trackTex.wrapS = THREE.RepeatWrapping;
    trackTex.wrapT = THREE.RepeatWrapping;
    const trackMat = new THREE.MeshStandardMaterial({ map: trackTex });

    const trackGeo = new THREE.BoxGeometry(0.15, 0.2, 0.5);
    const trackL = new THREE.Mesh(trackGeo, trackMat);
    trackL.position.set(-0.25, 0.1, 0);
    const trackR = new THREE.Mesh(trackGeo, trackMat);
    trackR.position.set(0.25, 0.1, 0);
    playerMesh.add(trackL, trackR);

    const bodyGeo = new THREE.BoxGeometry(0.4, 0.35, 0.4);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0.35, 0);
    playerMesh.add(body);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.6, 0);
    const headGeo = new THREE.BoxGeometry(0.3, 0.15, 0.2);
    const head = new THREE.Mesh(headGeo, darkMat);
    
    const eyeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.05, 8);
    eyeGeo.rotateX(Math.PI/2);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.08, 0, 0.1);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.08, 0, 0.1);
    headGroup.add(head, eyeL, eyeR);
    playerMesh.add(headGroup);

    const createArm = (isLeft) => {
        const armGroup = new THREE.Group();
        armGroup.position.set(isLeft ? -0.22 : 0.22, 0.45, 0);
        
        const upperArm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.06), bodyMat);
        upperArm.position.set(0, -0.125, 0);
        armGroup.add(upperArm);
        
        const elbowGroup = new THREE.Group();
        elbowGroup.position.set(0, -0.25, 0);
        
        const lowerArm = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.05), darkMat);
        lowerArm.position.set(0, -0.1, 0);
        elbowGroup.add(lowerArm);
        
        const grabberGeo = new THREE.BoxGeometry(0.08, 0.05, 0.1);
        const grabber = new THREE.Mesh(grabberGeo, darkMat);
        grabber.position.set(0, -0.2, 0.02);
        elbowGroup.add(grabber);
        
        armGroup.add(elbowGroup);
        return { arm: armGroup, elbow: elbowGroup };
    };

    const leftArm = createArm(true);
    const rightArm = createArm(false);
    playerMesh.add(leftArm.arm, rightArm.arm);

    playerMesh.userData = {
        trackMat: trackMat,
        shoulders: [leftArm.arm, rightArm.arm],
        elbows: [leftArm.elbow, rightArm.elbow]
    };

    playerMesh.traverse(c => { if(c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
    scene.add(playerMesh);

    requestAnimationFrame(animate);
}

function build3DLevel() {
    while(gridGroup.children.length > 0){ gridGroup.remove(gridGroup.children[0]); }
    gridTiles = [];
    lightsRemaining = 0;

    const heightScale = 0.5;
    const boxGeo = new THREE.BoxGeometry(1, heightScale, 1);
    const edgesGeo = new THREE.EdgesGeometry(boxGeo);
    
    const h = levelData.height;
    const items = levelData.items;
    const rows = h.length;
    const cols = h[0].length;

    const offsetX = -cols / 2 + 0.5;
    const offsetZ = -rows / 2 + 0.5;

    for (let z = 0; z < rows; z++) {
        gridTiles[z] = [];
        for (let x = 0; x < cols; x++) {
            const tile = gridTiles[z][x] = {
                height: h[z][x],
                item: items[z][x],
                isLit: false,
                meshes: [],
                topMesh: null,
                topEdges: null,
                topMaterial: null,
                edgeMaterial: null
            };
            
            let height = h[z][x];

            for (let y = 0; y <= height; y++) {
                let isTop = (y === height);
                let mat = tileVisuals.normalMat;
                let edgeMat = tileVisuals.edgeGrey;
                
                if (isTop && items[z][x] === 'L') {
                    mat = createLightTileMaterial();
                    edgeMat = createLightEdgeMaterial();
                    lightsRemaining++;
                }

                let mesh = new THREE.Mesh(boxGeo, mat);
                mesh.position.set(x + offsetX, (y * heightScale) - (heightScale / 2), z + offsetZ);
                mesh.scale.set(0.95, 1, 0.95);
                mesh.receiveShadow = true;
                mesh.castShadow = true;

                let edges = new THREE.LineSegments(edgesGeo, edgeMat);
                mesh.add(edges);

                if (isTop && items[z][x] === 'L') {
                    tile.topMesh = mesh;
                    tile.topEdges = edges;
                    tile.topMaterial = mat;
                    tile.edgeMaterial = edgeMat;
                }

                gridGroup.add(mesh);
                tile.meshes.push(mesh);
            }
        }
    }

    camera.position.set(0, 10, 15);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();
}

function resizeCanvas() {
    const container = document.getElementById("canvas-container");
    if(camera && renderer) {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }
}

function setTileLit(tile, isLit) {
    if (!tile || tile.item !== 'L') return;
    tile.isLit = isLit;

    const topMesh = tile.topMesh || tile.meshes[tile.meshes.length - 1];
    const topMaterial = tile.topMaterial || (topMesh && topMesh.material);
    const edgeMaterial = tile.edgeMaterial || (tile.topEdges && tile.topEdges.material);

    if (topMaterial) {
        topMaterial.color.setHex(isLit ? tileVisuals.lightOn : tileVisuals.lightOff);
        if (topMaterial.emissive) {
            topMaterial.emissive.setHex(isLit ? tileVisuals.lightEmissive : 0x000000);
            topMaterial.emissiveIntensity = isLit ? 0.45 : 0;
        }
    }

    if (edgeMaterial && edgeMaterial.color) {
        edgeMaterial.color.setHex(isLit ? tileVisuals.lightEdgeOn : tileVisuals.lightEdgeOff);
    }
}
