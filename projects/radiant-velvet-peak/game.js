// Game Configuration
const CONFIG = {
    cannon: {
        baseAngle: Math.PI / 6, // 30 degrees
        rotationSpeed: 0.01,
        maxRotation: Math.PI / 3, // 60 degrees total rotation
        minPower: 20,
        maxPower: 60,
        powerChargeRate: 0.02
    },
    physics: {
        gravity: -25,
        timeStep: 1/60
    },
    targets: {
        count: 5,
        radius: 3,
        depth: 2,
        scoreValue: 100
    }
};

// Game State
const gameState = {
    score: 0,
    shots: 0,
    power: 0,
    isCharging: false,
    canShoot: true,
    activeBalls: [],
    targets: [],
    hitTargets: new Set()
};

// Three.js Setup
let scene, camera, renderer, canvas;
let world, cannonMesh, cannonBarrel, ledge, ground;

// Touch/Mouse Control
let isDragging = false;
let lastTouchX = 0;
let cannonRotation = 0;

function init() {
    // Scene Setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    scene.fog = new THREE.Fog(0x87CEEB, 50, 200);

    // Camera Setup - positioned to view the cannon and landscape
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 12, 20);
    camera.lookAt(0, 8, 0);

    // Renderer Setup
    canvas = document.getElementById('gameCanvas');
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Physics World Setup
    world = new CANNON.World({
        gravity: new CANNON.Vec3(0, CONFIG.physics.gravity, 0)
    });

    // Create Game Elements
    createLedge();
    createCannon();
    createLandscape();
    createTargets();

    // Event Listeners
    setupControls();
    window.addEventListener('resize', onWindowResize);

    // Start screen
    document.getElementById('start-btn').addEventListener('click', startGame);
}

function createLedge() {
    // Visual ledge
    const ledgeGeometry = new THREE.BoxGeometry(15, 2, 10);
    const ledgeMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.8
    });
    ledge = new THREE.Mesh(ledgeGeometry, ledgeMaterial);
    ledge.position.set(0, 10, 0);
    ledge.castShadow = true;
    ledge.receiveShadow = true;
    scene.add(ledge);

    // Physics ledge
    const ledgeShape = new CANNON.Box(new CANNON.Vec3(7.5, 1, 5));
    const ledgeBody = new CANNON.Body({ mass: 0 });
    ledgeBody.addShape(ledgeShape);
    ledgeBody.position.set(0, 10, 0);
    world.addBody(ledgeBody);
}

function createCannon() {
    // Cannon base
    const baseGeometry = new THREE.CylinderGeometry(1.5, 2, 2, 8);
    const cannonMaterial = new THREE.MeshStandardMaterial({
        color: 0x2F4F4F,
        metalness: 0.7,
        roughness: 0.3
    });
    const cannonBase = new THREE.Mesh(baseGeometry, cannonMaterial);
    cannonBase.castShadow = true;

    // Cannon barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.5, 0.6, 4, 16);
    const barrelMaterial = new THREE.MeshStandardMaterial({
        color: 0x4A4A4A,
        metalness: 0.8,
        roughness: 0.2
    });
    cannonBarrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    cannonBarrel.rotation.z = -CONFIG.cannon.baseAngle;
    cannonBarrel.position.y = 1;
    cannonBarrel.position.z = -1.5;
    cannonBarrel.castShadow = true;

    // Cannon group
    cannonMesh = new THREE.Group();
    cannonMesh.add(cannonBase);
    cannonMesh.add(cannonBarrel);
    cannonMesh.position.set(0, 11, 2);
    scene.add(cannonMesh);
}

function createLandscape() {
    // Large ground plane
    const groundGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x228B22,
        roughness: 0.9
    });
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;

    // Add some height variation for visual interest
    const vertices = groundGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        vertices[i + 2] = Math.random() * 0.5;
    }
    groundGeometry.attributes.position.needsUpdate = true;
    groundGeometry.computeVertexNormals();

    scene.add(ground);

    // Physics ground
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);
}

function createTargets() {
    gameState.targets = [];

    for (let i = 0; i < CONFIG.targets.count; i++) {
        // Random position in front of cannon
        const angle = (Math.random() - 0.5) * Math.PI / 2;
        const distance = 30 + Math.random() * 40;
        const x = Math.sin(angle) * distance;
        const z = -Math.cos(angle) * distance;

        // Create visual hole (ring)
        const holeGeometry = new THREE.RingGeometry(
            CONFIG.targets.radius - 0.5,
            CONFIG.targets.radius + 0.5,
            32
        );
        const holeMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            side: THREE.DoubleSide
        });
        const hole = new THREE.Mesh(holeGeometry, holeMaterial);
        hole.rotation.x = -Math.PI / 2;
        hole.position.set(x, 0.1, z);
        hole.receiveShadow = true;
        scene.add(hole);

        // Inner dark circle to show depth
        const innerGeometry = new THREE.CircleGeometry(CONFIG.targets.radius - 0.5, 32);
        const innerMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000
        });
        const inner = new THREE.Mesh(innerGeometry, innerMaterial);
        inner.rotation.x = -Math.PI / 2;
        inner.position.set(x, 0.05, z);
        scene.add(inner);

        // Add target marker flag
        const flagPole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 3, 8),
            new THREE.MeshStandardMaterial({ color: 0xFFFFFF })
        );
        flagPole.position.set(x, 1.5, z + CONFIG.targets.radius + 1);
        flagPole.castShadow = true;
        scene.add(flagPole);

        const flag = new THREE.Mesh(
            new THREE.PlaneGeometry(1.5, 1),
            new THREE.MeshStandardMaterial({
                color: 0xFF0000,
                side: THREE.DoubleSide
            })
        );
        flag.position.set(x + 0.75, 2.5, z + CONFIG.targets.radius + 1);
        scene.add(flag);

        gameState.targets.push({
            position: new THREE.Vector3(x, 0, z),
            radius: CONFIG.targets.radius,
            mesh: hole,
            flag: flag,
            flagPole: flagPole,
            hit: false
        });
    }
}

function setupControls() {
    // Touch/Mouse controls for aiming
    canvas.addEventListener('touchstart', handleDragStart);
    canvas.addEventListener('touchmove', handleDragMove);
    canvas.addEventListener('touchend', handleDragEnd);
    canvas.addEventListener('mousedown', handleDragStart);
    canvas.addEventListener('mousemove', handleDragMove);
    canvas.addEventListener('mouseup', handleDragEnd);

    // Fire button controls
    const fireBtn = document.getElementById('fire-btn');
    fireBtn.addEventListener('touchstart', startCharging);
    fireBtn.addEventListener('touchend', shoot);
    fireBtn.addEventListener('mousedown', startCharging);
    fireBtn.addEventListener('mouseup', shoot);
}

function handleDragStart(e) {
    if (e.target.id === 'fire-btn') return;

    isDragging = true;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    lastTouchX = x;
    e.preventDefault();
}

function handleDragMove(e) {
    if (!isDragging) return;

    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const deltaX = x - lastTouchX;
    lastTouchX = x;

    // Rotate cannon based on drag
    cannonRotation += deltaX * CONFIG.cannon.rotationSpeed;
    cannonRotation = Math.max(-CONFIG.cannon.maxRotation / 2,
                             Math.min(CONFIG.cannon.maxRotation / 2, cannonRotation));

    cannonMesh.rotation.y = cannonRotation;
    e.preventDefault();
}

function handleDragEnd(e) {
    isDragging = false;
    e.preventDefault();
}

function startCharging(e) {
    if (!gameState.canShoot) return;

    gameState.isCharging = true;
    gameState.power = CONFIG.cannon.minPower;
    e.preventDefault();
}

function shoot(e) {
    if (!gameState.isCharging || !gameState.canShoot) return;

    gameState.isCharging = false;
    gameState.canShoot = false;
    gameState.shots++;
    updateUI();

    // Calculate shoot direction
    const barrelWorldQuaternion = new THREE.Quaternion();
    const barrelWorldPosition = new THREE.Vector3();
    cannonBarrel.getWorldQuaternion(barrelWorldQuaternion);
    cannonBarrel.getWorldPosition(barrelWorldPosition);

    // Direction is along the barrel's local Y axis
    const direction = new THREE.Vector3(0, 1, 0);
    direction.applyQuaternion(barrelWorldQuaternion);

    // Create cannonball
    const ballRadius = 0.5;
    const ballGeometry = new THREE.SphereGeometry(ballRadius, 16, 16);
    const ballMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.5,
        roughness: 0.5
    });
    const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
    ballMesh.castShadow = true;

    // Position at barrel tip
    const tipOffset = direction.clone().multiplyScalar(2);
    ballMesh.position.copy(barrelWorldPosition).add(tipOffset);
    scene.add(ballMesh);

    // Physics ball
    const ballShape = new CANNON.Sphere(ballRadius);
    const ballBody = new CANNON.Body({
        mass: 5,
        shape: ballShape,
        linearDamping: 0.1,
        angularDamping: 0.1
    });
    ballBody.position.copy(ballMesh.position);

    // Apply impulse
    const impulse = direction.multiplyScalar(gameState.power * 5);
    ballBody.velocity.set(impulse.x, impulse.y, impulse.z);

    world.addBody(ballBody);

    gameState.activeBalls.push({
        mesh: ballMesh,
        body: ballBody,
        age: 0
    });

    // Reset power meter
    document.getElementById('power-meter').style.height = '0%';

    // Allow next shot after delay
    setTimeout(() => {
        gameState.canShoot = true;
    }, 500);

    e.preventDefault();
}

function checkCollisions() {
    gameState.activeBalls.forEach((ball, index) => {
        ball.age++;

        // Remove old balls
        if (ball.age > 600 || ball.body.position.y < -10) {
            scene.remove(ball.mesh);
            world.removeBody(ball.body);
            gameState.activeBalls.splice(index, 1);
            return;
        }

        // Check if ball is on ground and near a target
        if (ball.body.position.y < 1 && Math.abs(ball.body.velocity.y) < 2) {
            gameState.targets.forEach((target, targetIndex) => {
                if (target.hit) return;

                const distance = Math.sqrt(
                    Math.pow(ball.body.position.x - target.position.x, 2) +
                    Math.pow(ball.body.position.z - target.position.z, 2)
                );

                if (distance < target.radius) {
                    // Score!
                    target.hit = true;
                    gameState.hitTargets.add(targetIndex);
                    gameState.score += CONFIG.targets.scoreValue;
                    updateUI();

                    // Visual feedback
                    target.flag.material.color.setHex(0x00FF00);
                    target.mesh.material.color.setHex(0xFFD700);

                    // Remove ball
                    scene.remove(ball.mesh);
                    world.removeBody(ball.body);
                    gameState.activeBalls.splice(index, 1);
                }
            });
        }
    });
}

function updatePhysics() {
    // Update power meter while charging
    if (gameState.isCharging && gameState.power < CONFIG.cannon.maxPower) {
        gameState.power += CONFIG.cannon.powerChargeRate *
                          (CONFIG.cannon.maxPower - CONFIG.cannon.minPower);
        gameState.power = Math.min(gameState.power, CONFIG.cannon.maxPower);

        const percentage = ((gameState.power - CONFIG.cannon.minPower) /
                           (CONFIG.cannon.maxPower - CONFIG.cannon.minPower)) * 100;
        document.getElementById('power-meter').style.height = percentage + '%';
    }

    // Step physics simulation
    world.step(CONFIG.physics.timeStep);

    // Update ball positions
    gameState.activeBalls.forEach(ball => {
        ball.mesh.position.copy(ball.body.position);
        ball.mesh.quaternion.copy(ball.body.quaternion);
    });

    // Check for scoring
    checkCollisions();
}

function animate() {
    requestAnimationFrame(animate);

    updatePhysics();
    renderer.render(scene, camera);
}

function updateUI() {
    document.getElementById('score-value').textContent = gameState.score;
    document.getElementById('shots-value').textContent = gameState.shots;
}

function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    gameState.score = 0;
    gameState.shots = 0;
    updateUI();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Initialize and start the game
init();
animate();
