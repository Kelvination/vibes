// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Game state
const game = {
    speed: 0,
    maxSpeed: 200,
    acceleration: 0.3,
    deceleration: 0.5,
    brake: 1.2,
    turnSpeed: 0.03,
    position: 0,
    curve: 0,
    playerX: 0,
};

// Keyboard state
const keys = {};

// Road parameters
const roadWidth = 2000;
const segmentLength = 200;
const rumbleLength = 3;
const drawDistance = 300;
const cameraHeight = 1000;
const cameraDepth = 1 / Math.tan((Math.PI / 180) * 40); // FOV 80 degrees

// Road segments
let roadSegments = [];

// Colors
const colors = {
    sky: '#72B7FF',
    ground: {
        grass: ['#10AA10', '#009A00'],
        rumble: ['#FFFFFF', '#000000'],
        road: ['#888888', '#666666']
    }
};

// Initialize road segments
function initRoad() {
    for (let i = 0; i < 1600; i++) {
        const segment = {
            index: i,
            curve: 0,
        };

        // Add some curves
        if (i > 300 && i < 400) {
            segment.curve = 2;
        } else if (i > 500 && i < 600) {
            segment.curve = -2;
        } else if (i > 750 && i < 900) {
            segment.curve = -3;
        } else if (i > 1000 && i < 1200) {
            segment.curve = 1.5;
        }

        roadSegments.push(segment);
    }
}

// Project 3D to 2D
function project(p) {
    return {
        scale: cameraDepth / (p.z + 0.01),
        x: (1 + p.scale * p.x) * canvas.width / 2,
        y: (1 - p.scale * p.y) * canvas.height / 2,
        w: p.scale * roadWidth * canvas.width / 2,
    };
}

// Draw polygon
function drawPolygon(x1, y1, x2, y2, x3, y3, x4, y4, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.closePath();
    ctx.fill();
}

// Draw segment
function drawSegment(segment, p1, p2) {
    const grassColor = colors.ground.grass[segment.index % 2];
    const rumbleColor = colors.ground.rumble[Math.floor(segment.index / rumbleLength) % 2];
    const roadColor = colors.ground.road[Math.floor(segment.index / rumbleLength) % 2];

    // Draw grass
    drawPolygon(
        0, p1.y,
        canvas.width, p1.y,
        canvas.width, p2.y,
        0, p2.y,
        grassColor
    );

    // Draw rumble strips
    const rumbleWidth = p1.w * 1.2;
    drawPolygon(
        p1.x - rumbleWidth, p1.y,
        p1.x + rumbleWidth, p1.y,
        p2.x + rumbleWidth, p2.y,
        p2.x - rumbleWidth, p2.y,
        rumbleColor
    );

    // Draw road
    drawPolygon(
        p1.x - p1.w, p1.y,
        p1.x + p1.w, p1.y,
        p2.x + p2.w, p2.y,
        p2.x - p2.w, p2.y,
        roadColor
    );
}

// Draw car
function drawCar() {
    const carWidth = 80;
    const carHeight = 100;
    const carX = canvas.width / 2 + (game.playerX * canvas.width / 2) - carWidth / 2;
    const carY = canvas.height - carHeight - 20;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(carX + 5, carY + carHeight - 5, carWidth, 10);

    // Car body
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(carX, carY + 30, carWidth, 60);

    // Car top
    ctx.fillStyle = '#CC0000';
    ctx.fillRect(carX + 10, carY + 15, carWidth - 20, 30);

    // Windshield
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(carX + 15, carY + 20, carWidth - 30, 20);

    // Wheels
    ctx.fillStyle = '#000000';
    ctx.fillRect(carX + 5, carY + 30, 15, 25);
    ctx.fillRect(carX + carWidth - 20, carY + 30, 15, 25);
    ctx.fillRect(carX + 5, carY + 65, 15, 25);
    ctx.fillRect(carX + carWidth - 20, carY + 65, 15, 25);
}

// Update game state
function update(dt) {
    // Handle input
    if (keys['w'] || keys['W'] || keys['ArrowUp']) {
        game.speed += game.acceleration * dt;
    } else if (keys['s'] || keys['S'] || keys['ArrowDown']) {
        game.speed -= game.brake * dt;
    } else {
        game.speed -= game.deceleration * dt;
    }

    // Clamp speed
    game.speed = Math.max(0, Math.min(game.maxSpeed, game.speed));

    // Handle turning (only when moving)
    if (game.speed > 0) {
        if (keys['a'] || keys['A'] || keys['ArrowLeft']) {
            game.playerX -= game.turnSpeed * dt;
            game.curve -= game.turnSpeed * dt * 0.3;
        }
        if (keys['d'] || keys['D'] || keys['ArrowRight']) {
            game.playerX += game.turnSpeed * dt;
            game.curve += game.turnSpeed * dt * 0.3;
        }
    }

    // Clamp player position
    game.playerX = Math.max(-1, Math.min(1, game.playerX));

    // Update position
    game.position += game.speed * dt;

    // Loop the track
    while (game.position >= roadSegments.length * segmentLength) {
        game.position -= roadSegments.length * segmentLength;
    }

    // Apply curve influence on player position
    const baseSegment = Math.floor(game.position / segmentLength) % roadSegments.length;
    const segment = roadSegments[baseSegment];

    if (segment.curve !== 0) {
        game.playerX += segment.curve * 0.001 * game.speed * dt;
    }

    // Decay curve
    game.curve *= 0.9;

    // Update speedometer
    document.getElementById('speedometer').textContent = Math.floor(game.speed);
}

// Render
function render() {
    // Clear canvas
    ctx.fillStyle = colors.sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);

    ctx.fillStyle = colors.ground.grass[0];
    ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);

    // Calculate base segment
    const baseSegment = Math.floor(game.position / segmentLength);
    const basePercent = (game.position % segmentLength) / segmentLength;

    // Draw road segments
    let x = 0;
    let dx = 0;

    for (let n = 0; n < drawDistance; n++) {
        const segment = roadSegments[(baseSegment + n) % roadSegments.length];
        const segmentPercent = (n === 0 ? basePercent : 0);

        // Calculate world position
        const z = (n + segmentPercent) * segmentLength;

        // Project current segment
        const p1 = project({
            x: x + dx,
            y: cameraHeight,
            z: z,
            scale: 1
        });

        // Next segment
        x += dx;
        dx += segment.curve;

        const nextSegment = roadSegments[(baseSegment + n + 1) % roadSegments.length];
        const nextZ = (n + 1 + segmentPercent) * segmentLength;

        const p2 = project({
            x: x + dx,
            y: cameraHeight,
            z: nextZ,
            scale: 1
        });

        // Offset by player position and curve
        p1.x -= p1.scale * game.playerX * roadWidth * 2;
        p2.x -= p2.scale * game.playerX * roadWidth * 2;

        // Draw segment
        drawSegment(segment, p1, p2);
    }

    // Draw car
    drawCar();
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 16.667, 3); // Delta time in frames (60fps)
    lastTime = timestamp;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
}

// Keyboard event listeners
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Initialize and start
initRoad();
requestAnimationFrame(gameLoop);
