// Three.js Scene Setup
let scene, camera, renderer;
let car, wheels = [];
let ground;
let raycaster, rayHelpers = [];

// Physics constants
const GRAVITY = -20;
const WHEEL_POSITIONS = [
    { x: -0.8, z: 1.2 },  // Front left
    { x: 0.8, z: 1.2 },   // Front right
    { x: -0.8, z: -1.2 }, // Rear left
    { x: 0.8, z: -1.2 }   // Rear right
];

// Car physics state
const carState = {
    position: new THREE.Vector3(0, 5, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Euler(0, 0, 0),
    angularVelocity: new THREE.Vector3(0, 0, 0),
    wheelGroundContacts: [false, false, false, false],
    wheelSuspensionLengths: [0, 0, 0, 0],
};

// Car parameters
const carParams = {
    mass: 1200,
    suspensionStiffness: 30000,
    suspensionDamping: 2000,
    suspensionRestLength: 0.5,
    suspensionMaxTravel: 0.3,
    wheelRadius: 0.4,
    engineForce: 0,
    maxEngineForce: 15000,
    brakeForce: 0,
    maxBrakeForce: 8000,
    steeringAngle: 0,
    maxSteeringAngle: 0.5,
    steeringSpeed: 2.5,
    dragCoefficient: 0.3,
    rollingResistance: 50,
};

// Input state
const keys = {};

// Initialize Three.js
function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 50, 200);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, -10);

    // Renderer
    const canvas = document.getElementById('gameCanvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -100;
    dirLight.shadow.camera.right = 100;
    dirLight.shadow.camera.top = 100;
    dirLight.shadow.camera.bottom = -100;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    // Ground
    createGround();

    // Car
    createCar();

    // Raycaster
    raycaster = new THREE.Raycaster();

    // Create ray helpers for visualization
    for (let i = 0; i < 4; i++) {
        const rayHelper = new THREE.ArrowHelper(
            new THREE.Vector3(0, -1, 0),
            new THREE.Vector3(0, 0, 0),
            2,
            0xff0000
        );
        rayHelpers.push(rayHelper);
        scene.add(rayHelper);
    }

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
    window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

    // Start animation loop
    animate();
}

function createGround() {
    // Create a larger ground plane with some texture
    const groundGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x3a7d3a,
        roughness: 0.8,
    });

    // Add some height variation
    const positions = groundGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getY(i);
        const y = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2;
        positions.setZ(i, y);
    }
    groundGeometry.computeVertexNormals();

    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Add a grid for reference
    const gridHelper = new THREE.GridHelper(200, 40, 0x000000, 0x555555);
    gridHelper.material.opacity = 0.2;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);
}

function createCar() {
    car = new THREE.Group();

    // Car body
    const bodyGeometry = new THREE.BoxGeometry(2, 0.8, 3);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.4;
    body.castShadow = true;
    car.add(body);

    // Car cabin
    const cabinGeometry = new THREE.BoxGeometry(1.6, 0.6, 1.8);
    const cabinMaterial = new THREE.MeshStandardMaterial({ color: 0x330000 });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.y = 1.1;
    cabin.position.z = -0.2;
    cabin.castShadow = true;
    car.add(cabin);

    // Windows
    const windowMaterial = new THREE.MeshStandardMaterial({
        color: 0x87CEEB,
        transparent: true,
        opacity: 0.6
    });

    const frontWindow = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.5, 0.1),
        windowMaterial
    );
    frontWindow.position.set(0, 1.1, 0.7);
    car.add(frontWindow);

    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(carParams.wheelRadius, carParams.wheelRadius, 0.3, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });

    WHEEL_POSITIONS.forEach((pos, i) => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(pos.x, 0, pos.z);
        wheel.castShadow = true;
        wheels.push(wheel);
        car.add(wheel);
    });

    car.position.copy(carState.position);
    scene.add(car);
}

function performRaycasts() {
    const rayOrigin = new THREE.Vector3();
    const rayDirection = new THREE.Vector3(0, -1, 0);
    const maxRayDistance = carParams.suspensionRestLength + carParams.suspensionMaxTravel + carParams.wheelRadius;

    WHEEL_POSITIONS.forEach((wheelPos, i) => {
        // Calculate world position of wheel
        rayOrigin.set(wheelPos.x, 0, wheelPos.z);
        rayOrigin.applyQuaternion(car.quaternion);
        rayOrigin.add(carState.position);

        // Cast ray downward
        raycaster.set(rayOrigin, rayDirection);
        const intersects = raycaster.intersectObject(ground);

        // Update ray helper
        rayHelpers[i].position.copy(rayOrigin);
        rayHelpers[i].setDirection(rayDirection);

        if (intersects.length > 0) {
            const hitDistance = intersects[0].distance;

            if (hitDistance <= maxRayDistance) {
                carState.wheelGroundContacts[i] = true;
                carState.wheelSuspensionLengths[i] = hitDistance - carParams.wheelRadius;
                rayHelpers[i].setColor(0x00ff00);
                rayHelpers[i].setLength(hitDistance);
            } else {
                carState.wheelGroundContacts[i] = false;
                carState.wheelSuspensionLengths[i] = carParams.suspensionRestLength + carParams.suspensionMaxTravel;
                rayHelpers[i].setColor(0xff0000);
                rayHelpers[i].setLength(maxRayDistance);
            }
        } else {
            carState.wheelGroundContacts[i] = false;
            carState.wheelSuspensionLengths[i] = carParams.suspensionRestLength + carParams.suspensionMaxTravel;
            rayHelpers[i].setColor(0xff0000);
            rayHelpers[i].setLength(maxRayDistance);
        }
    });
}

function updatePhysics(dt) {
    // Handle input
    if (keys['w']) {
        carParams.engineForce = carParams.maxEngineForce;
    } else if (keys['s']) {
        carParams.engineForce = -carParams.maxEngineForce * 0.5;
    } else {
        carParams.engineForce = 0;
    }

    if (keys[' ']) {
        carParams.brakeForce = carParams.maxBrakeForce;
    } else {
        carParams.brakeForce = 0;
    }

    // Steering
    const targetSteering = keys['a'] ? carParams.maxSteeringAngle :
                          keys['d'] ? -carParams.maxSteeringAngle : 0;

    const steeringDiff = targetSteering - carParams.steeringAngle;
    carParams.steeringAngle += steeringDiff * carParams.steeringSpeed * dt;

    // Perform raycasts
    performRaycasts();

    // Calculate suspension forces
    const upVector = new THREE.Vector3(0, 1, 0);
    upVector.applyQuaternion(car.quaternion);

    const totalForce = new THREE.Vector3(0, 0, 0);
    const totalTorque = new THREE.Vector3(0, 0, 0);

    let wheelsOnGround = 0;

    WHEEL_POSITIONS.forEach((wheelPos, i) => {
        if (carState.wheelGroundContacts[i]) {
            wheelsOnGround++;

            // Suspension compression
            const compression = carParams.suspensionRestLength - carState.wheelSuspensionLengths[i];
            const compressionVelocity = upVector.dot(carState.velocity);

            // Spring and damper force
            const springForce = compression * carParams.suspensionStiffness;
            const damperForce = compressionVelocity * carParams.suspensionDamping;
            const suspensionForce = (springForce + damperForce) / carParams.mass;

            // Add suspension force
            const force = upVector.clone().multiplyScalar(suspensionForce);
            totalForce.add(force);

            // Calculate torque (position relative to center of mass)
            const wheelWorldPos = new THREE.Vector3(wheelPos.x, 0, wheelPos.z);
            wheelWorldPos.applyQuaternion(car.quaternion);
            const torque = new THREE.Vector3().crossVectors(wheelWorldPos, force);
            totalTorque.add(torque);
        }
    });

    // Apply engine force (rear wheels)
    if (wheelsOnGround > 0) {
        const forwardVector = new THREE.Vector3(0, 0, 1);
        forwardVector.applyQuaternion(car.quaternion);

        const engineForceVec = forwardVector.clone().multiplyScalar(carParams.engineForce / carParams.mass);
        totalForce.add(engineForceVec);

        // Apply braking
        if (carParams.brakeForce > 0) {
            const brakeForceVec = carState.velocity.clone().normalize().multiplyScalar(-carParams.brakeForce / carParams.mass);
            totalForce.add(brakeForceVec);
        }

        // Apply steering torque
        const steeringTorque = new THREE.Vector3(0, carParams.steeringAngle * carState.velocity.length() * 2, 0);
        totalTorque.add(steeringTorque);

        // Drag and rolling resistance
        const speed = carState.velocity.length();
        const drag = carState.velocity.clone().normalize().multiplyScalar(
            -carParams.dragCoefficient * speed * speed / carParams.mass
        );
        totalForce.add(drag);

        const rollingResist = carState.velocity.clone().normalize().multiplyScalar(
            -carParams.rollingResistance / carParams.mass
        );
        totalForce.add(rollingResist);
    }

    // Apply gravity
    totalForce.y += GRAVITY;

    // Update velocity
    carState.velocity.add(totalForce.clone().multiplyScalar(dt));

    // Update angular velocity
    carState.angularVelocity.add(totalTorque.multiplyScalar(dt * 0.5));
    carState.angularVelocity.multiplyScalar(0.95); // Angular damping

    // Update position
    carState.position.add(carState.velocity.clone().multiplyScalar(dt));

    // Update rotation
    const rotationChange = carState.angularVelocity.clone().multiplyScalar(dt);
    car.rotation.x += rotationChange.x;
    car.rotation.y += rotationChange.y;
    car.rotation.z += rotationChange.z;

    // Update car transform
    car.position.copy(carState.position);

    // Update wheels rotation and steering
    const wheelRotation = carState.velocity.length() * dt * 3;
    wheels.forEach((wheel, i) => {
        // Rotate wheels based on speed
        wheel.rotation.x += wheelRotation;

        // Apply steering to front wheels
        if (i < 2) {
            wheel.rotation.y = carParams.steeringAngle;
        }

        // Position wheels based on suspension
        const targetY = -carParams.suspensionRestLength + carState.wheelSuspensionLengths[i];
        wheel.position.y = targetY;
    });

    // Update HUD
    const speed = Math.abs(carState.velocity.length() * 3.6); // Convert to km/h
    document.getElementById('speedometer').textContent = Math.floor(speed);
    document.getElementById('wheelsGrounded').textContent = wheelsOnGround;
    document.getElementById('carHeight').textContent = carState.position.y.toFixed(2);
}

function updateCamera() {
    // Follow car with camera
    const cameraOffset = new THREE.Vector3(0, 3, -8);
    cameraOffset.applyQuaternion(car.quaternion);

    const targetCameraPos = car.position.clone().add(cameraOffset);
    camera.position.lerp(targetCameraPos, 0.1);

    const lookAtOffset = new THREE.Vector3(0, 0.5, 2);
    lookAtOffset.applyQuaternion(car.quaternion);
    const targetLookAt = car.position.clone().add(lookAtOffset);
    camera.lookAt(targetLookAt);
}

function animate() {
    requestAnimationFrame(animate);

    const dt = 1 / 60; // Fixed timestep

    updatePhysics(dt);
    updateCamera();

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Start the game
init();
