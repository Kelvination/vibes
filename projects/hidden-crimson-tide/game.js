import * as THREE from 'three';

// Game State
const game = {
    score: 0,
    power: 0,
    maxPower: 100,
    isCharging: false,
    canFire: true,
    cannonballs: [],
    holes: [],
    cannon: null,
    cannonRotation: { horizontal: 0, vertical: -0.5 }, // vertical: negative = up angle
};

// Three.js Setup
let scene, camera, renderer;
let cannonGroup, cannonBarrel;
let touchStartX = 0, touchStartY = 0;
let isDragging = false;

// Initialize Three.js scene
function initThree() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    scene.fog = new THREE.Fog(0x87CEEB, 50, 300);

    // Camera - positioned to look at cannon from behind and slightly above
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 8, 15);
    camera.lookAt(0, 5, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('game-container').prepend(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Create the world
    createLedge();
    createCannon();
    createLandscape();
    createHoles();

    // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

// Create the ledge/platform for the cannon
function createLedge() {
    const ledgeGeometry = new THREE.BoxGeometry(15, 3, 15);
    const ledgeMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.8
    });
    const ledge = new THREE.Mesh(ledgeGeometry, ledgeMaterial);
    ledge.position.set(0, 1.5, 0);
    ledge.castShadow = true;
    ledge.receiveShadow = true;
    scene.add(ledge);

    // Add some stone texture blocks
    for (let i = 0; i < 3; i++) {
        const blockGeometry = new THREE.BoxGeometry(2, 2, 2);
        const blockMaterial = new THREE.MeshStandardMaterial({
            color: 0x696969,
            roughness: 0.9
        });
        const block = new THREE.Mesh(blockGeometry, blockMaterial);
        block.position.set(-5 + i * 5, 4, -5);
        block.castShadow = true;
        block.receiveShadow = true;
        scene.add(block);
    }
}

// Create the cannon
function createCannon() {
    cannonGroup = new THREE.Group();
    cannonGroup.position.set(0, 3, 0);

    // Cannon base (rotating platform)
    const baseGeometry = new THREE.CylinderGeometry(1.5, 1.8, 0.8, 16);
    const cannonMaterial = new THREE.MeshStandardMaterial({
        color: 0x2C2C2C,
        metalness: 0.8,
        roughness: 0.3
    });
    const base = new THREE.Mesh(baseGeometry, cannonMaterial);
    base.castShadow = true;
    cannonGroup.add(base);

    // Cannon barrel (this will rotate on two axes)
    cannonBarrel = new THREE.Group();

    const barrelGeometry = new THREE.CylinderGeometry(0.4, 0.5, 4, 16);
    const barrel = new THREE.Mesh(barrelGeometry, cannonMaterial);
    barrel.rotation.z = Math.PI / 2; // Point forward
    barrel.position.x = 2;
    barrel.castShadow = true;
    cannonBarrel.add(barrel);

    // Cannon mount
    const mountGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const mount = new THREE.Mesh(mountGeometry, cannonMaterial);
    mount.castShadow = true;
    cannonBarrel.add(mount);

    // Muzzle decoration
    const muzzleGeometry = new THREE.CylinderGeometry(0.5, 0.4, 0.3, 16);
    const muzzle = new THREE.Mesh(muzzleGeometry, new THREE.MeshStandardMaterial({
        color: 0xFF6B35,
        emissive: 0xFF6B35,
        emissiveIntensity: 0.2
    }));
    muzzle.rotation.z = Math.PI / 2;
    muzzle.position.x = 4;
    muzzle.castShadow = true;
    cannonBarrel.add(muzzle);

    cannonBarrel.position.y = 0.5;
    cannonGroup.add(cannonBarrel);

    // Set initial angle (pointing about 30 degrees up)
    cannonBarrel.rotation.z = game.cannonRotation.vertical;

    scene.add(cannonGroup);
    game.cannon = cannonGroup;
}

// Create the landscape
function createLandscape() {
    // Large ground plane
    const groundGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);

    // Add some random height variation for terrain
    const vertices = groundGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const y = vertices[i + 1];
        const distance = Math.sqrt(x * x + y * y);
        vertices[i + 2] = Math.sin(distance * 0.1) * 0.5 + (Math.random() - 0.5) * 0.3;
    }
    groundGeometry.computeVertexNormals();

    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x4A7C3C,
        roughness: 0.9,
        flatShading: true
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -10;
    ground.receiveShadow = true;
    scene.add(ground);

    // Add some trees/objects for scale
    for (let i = 0; i < 20; i++) {
        const treeHeight = 3 + Math.random() * 4;
        const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, treeHeight, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4A3728 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);

        const foliageGeometry = new THREE.SphereGeometry(1.5 + Math.random(), 8, 8);
        const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x2D5016 });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.y = treeHeight;

        const tree = new THREE.Group();
        tree.add(trunk);
        tree.add(foliage);

        // Random position, avoiding the center
        const angle = Math.random() * Math.PI * 2;
        const distance = 30 + Math.random() * 70;
        tree.position.set(
            Math.cos(angle) * distance,
            -10 + treeHeight / 2,
            Math.sin(angle) * distance
        );

        tree.castShadow = true;
        tree.receiveShadow = true;
        scene.add(tree);
    }
}

// Create target holes in the ground
function createHoles() {
    const holePositions = [
        { x: -15, z: -30 },
        { x: 0, z: -35 },
        { x: 15, z: -30 },
        { x: -20, z: -50 },
        { x: 20, z: -50 },
        { x: 0, z: -55 },
    ];

    holePositions.forEach((pos, index) => {
        // Hole rim
        const rimGeometry = new THREE.TorusGeometry(3, 0.3, 16, 32);
        const rimMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.8
        });
        const rim = new THREE.Mesh(rimGeometry, rimMaterial);
        rim.rotation.x = -Math.PI / 2;
        rim.position.set(pos.x, -9.7, pos.z);
        rim.receiveShadow = true;
        scene.add(rim);

        // Hole interior (dark circle)
        const holeGeometry = new THREE.CircleGeometry(3, 32);
        const holeMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 1
        });
        const hole = new THREE.Mesh(holeGeometry, holeMaterial);
        hole.rotation.x = -Math.PI / 2;
        hole.position.set(pos.x, -9.6, pos.z);
        scene.add(hole);

        // Flag marker
        const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 5, 8);
        const poleMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.set(pos.x + 3.5, -7, pos.z);
        pole.castShadow = true;
        scene.add(pole);

        const flagGeometry = new THREE.PlaneGeometry(2, 1.5);
        const flagColors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF, 0x00FFFF];
        const flagMaterial = new THREE.MeshStandardMaterial({
            color: flagColors[index % flagColors.length],
            side: THREE.DoubleSide
        });
        const flag = new THREE.Mesh(flagGeometry, flagMaterial);
        flag.position.set(pos.x + 4.5, -5, pos.z);
        scene.add(flag);

        // Store hole data for collision detection
        game.holes.push({
            position: new THREE.Vector3(pos.x, -10, pos.z),
            radius: 3,
            scored: false,
            rim: rim,
            flag: flag
        });
    });
}

// Fire the cannon
function fireCannon() {
    if (!game.canFire || game.power < 5) return;

    game.canFire = false;

    // Calculate direction based on cannon rotation
    const direction = new THREE.Vector3();

    // Get the barrel's world position and direction
    const barrelEnd = new THREE.Vector3(4, 0, 0);
    barrelEnd.applyEuler(new THREE.Euler(0, 0, cannonBarrel.rotation.z));
    barrelEnd.applyEuler(new THREE.Euler(0, cannonGroup.rotation.y, 0));
    direction.copy(barrelEnd).normalize();

    // Create cannonball
    const ballGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const ballMaterial = new THREE.MeshStandardMaterial({
        color: 0x2C2C2C,
        metalness: 0.6,
        roughness: 0.4
    });
    const cannonball = new THREE.Mesh(ballGeometry, ballMaterial);

    // Start position at barrel end
    const startPos = new THREE.Vector3(4, 0.5, 0);
    startPos.applyEuler(new THREE.Euler(0, 0, cannonBarrel.rotation.z));
    startPos.applyEuler(new THREE.Euler(0, cannonGroup.rotation.y, 0));
    startPos.add(cannonGroup.position);

    cannonball.position.copy(startPos);
    cannonball.castShadow = true;
    scene.add(cannonball);

    // Physics properties
    const powerMultiplier = game.power / 10;
    const velocity = direction.multiplyScalar(powerMultiplier);

    game.cannonballs.push({
        mesh: cannonball,
        velocity: velocity,
        gravity: new THREE.Vector3(0, -0.098, 0), // Earth gravity
        lifetime: 0,
        maxLifetime: 300 // Remove after 10 seconds
    });

    // Add muzzle flash effect
    const flashGeometry = new THREE.SphereGeometry(1, 16, 16);
    const flashMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFAA00,
        transparent: true,
        opacity: 0.8
    });
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.copy(startPos);
    scene.add(flash);

    setTimeout(() => {
        scene.remove(flash);
    }, 100);

    // Reset power and allow firing again after cooldown
    game.power = 0;
    updatePowerBar();

    setTimeout(() => {
        game.canFire = true;
    }, 1000);
}

// Update cannonball physics
function updateCannonballs() {
    game.cannonballs = game.cannonballs.filter(ball => {
        // Update velocity with gravity
        ball.velocity.add(ball.gravity);

        // Update position
        ball.mesh.position.add(ball.velocity);

        // Update lifetime
        ball.lifetime++;

        // Check collision with ground
        if (ball.mesh.position.y < -10) {
            // Check if it landed in a hole
            let hitHole = false;
            game.holes.forEach(hole => {
                const distance = new THREE.Vector2(
                    ball.mesh.position.x - hole.position.x,
                    ball.mesh.position.z - hole.position.z
                ).length();

                if (distance < hole.radius && !hole.scored) {
                    hole.scored = true;
                    hitHole = true;

                    // Score points
                    game.score += 100;
                    updateScore();

                    // Visual feedback
                    hole.rim.material.emissive = new THREE.Color(0x00FF00);
                    hole.rim.material.emissiveIntensity = 0.5;
                    hole.flag.material.emissive = new THREE.Color(0x00FF00);
                    hole.flag.material.emissiveIntensity = 1;

                    setTimeout(() => {
                        hole.scored = false;
                        hole.rim.material.emissive = new THREE.Color(0x000000);
                        hole.rim.material.emissiveIntensity = 0;
                        hole.flag.material.emissive = new THREE.Color(0x000000);
                        hole.flag.material.emissiveIntensity = 0;
                    }, 2000);
                }
            });

            // Create splash effect
            const splashGeometry = new THREE.SphereGeometry(1, 16, 16);
            const splashMaterial = new THREE.MeshBasicMaterial({
                color: hitHole ? 0x00FF00 : 0x8B7355,
                transparent: true,
                opacity: 0.6
            });
            const splash = new THREE.Mesh(splashGeometry, splashMaterial);
            splash.position.copy(ball.mesh.position);
            splash.position.y = -9.5;
            scene.add(splash);

            setTimeout(() => scene.remove(splash), 500);

            scene.remove(ball.mesh);
            return false;
        }

        // Remove if lifetime exceeded
        if (ball.lifetime > ball.maxLifetime) {
            scene.remove(ball.mesh);
            return false;
        }

        return true;
    });
}

// Touch/Mouse controls for aiming
function setupControls() {
    const canvas = renderer.domElement;

    // Touch start / Mouse down
    const onPointerStart = (e) => {
        // Ignore if touching the fire button
        if (e.target.id === 'fire-button' || e.target.closest('#fire-button')) {
            return;
        }

        isDragging = true;
        if (e.touches) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        } else {
            touchStartX = e.clientX;
            touchStartY = e.clientY;
        }
    };

    // Touch move / Mouse move
    const onPointerMove = (e) => {
        if (!isDragging) return;

        let currentX, currentY;
        if (e.touches) {
            currentX = e.touches[0].clientX;
            currentY = e.touches[0].clientY;
        } else {
            currentX = e.clientX;
            currentY = e.clientY;
        }

        const deltaX = currentX - touchStartX;
        const deltaY = currentY - touchStartY;

        // Update cannon rotation
        game.cannonRotation.horizontal += deltaX * 0.003;
        game.cannonRotation.vertical += deltaY * 0.002;

        // Clamp vertical rotation (don't let it point too far down or up)
        game.cannonRotation.vertical = Math.max(-1.2, Math.min(-0.1, game.cannonRotation.vertical));

        // Apply rotation to cannon
        cannonGroup.rotation.y = game.cannonRotation.horizontal;
        cannonBarrel.rotation.z = game.cannonRotation.vertical;

        touchStartX = currentX;
        touchStartY = currentY;
    };

    // Touch end / Mouse up
    const onPointerEnd = () => {
        isDragging = false;
    };

    // Add event listeners
    canvas.addEventListener('touchstart', onPointerStart, { passive: true });
    canvas.addEventListener('touchmove', onPointerMove, { passive: true });
    canvas.addEventListener('touchend', onPointerEnd);
    canvas.addEventListener('mousedown', onPointerStart);
    canvas.addEventListener('mousemove', onPointerMove);
    canvas.addEventListener('mouseup', onPointerEnd);

    // Fire button controls
    const fireButton = document.getElementById('fire-button');

    const startCharging = () => {
        if (!game.canFire) return;
        game.isCharging = true;
    };

    const stopCharging = () => {
        if (game.isCharging && game.power >= 5) {
            fireCannon();
        }
        game.isCharging = false;
    };

    fireButton.addEventListener('touchstart', startCharging, { passive: true });
    fireButton.addEventListener('touchend', stopCharging);
    fireButton.addEventListener('mousedown', startCharging);
    fireButton.addEventListener('mouseup', stopCharging);
}

// Update power while charging
function updatePower() {
    if (game.isCharging && game.canFire) {
        game.power = Math.min(game.power + 2, game.maxPower);
        updatePowerBar();
    }
}

function updatePowerBar() {
    const powerBar = document.getElementById('power-bar');
    const percentage = (game.power / game.maxPower) * 100;
    powerBar.style.width = percentage + '%';
}

function updateScore() {
    document.getElementById('score').textContent = game.score;
}

// Window resize handler
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    updatePower();
    updateCannonballs();

    renderer.render(scene, camera);
}

// Start game
function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    game.score = 0;
    updateScore();
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    initThree();
    setupControls();
    animate();

    // Start button
    document.getElementById('start-btn').addEventListener('click', startGame);
});
