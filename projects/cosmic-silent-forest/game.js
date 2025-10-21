// Game configuration
const config = {
    gravity: 0.5,
    friction: 0.99,
    restitution: 0.7,
    slingshotStrength: 0.15,
    maxPullDistance: 150,
    ballRadius: 15,
    targetRadius: 20,
};

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Responsive canvas sizing
function resizeCanvas() {
    const maxWidth = Math.min(window.innerWidth - 40, 600);
    const maxHeight = window.innerHeight - 40;

    canvas.width = maxWidth;
    canvas.height = maxHeight;

    // Update game elements based on new size
    if (gameState === 'playing') {
        updateSlingshotPosition();
        updateTargetPositions();
    }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Game state
let gameState = 'start'; // 'start', 'playing', 'win'
let score = 0;
let level = 1;

// Ball object
const ball = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: config.ballRadius,
    color: '#FFD700',
    active: false,
    reset() {
        this.x = canvas.width / 2;
        this.y = canvas.height - 100;
        this.vx = 0;
        this.vy = 0;
        this.active = false;
    },
    update() {
        if (!this.active) return;

        // Apply gravity
        this.vy += config.gravity;

        // Apply friction
        this.vx *= config.friction;
        this.vy *= config.friction;

        // Update position
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off walls
        if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) {
            this.vx *= -config.restitution;
            this.x = this.x < canvas.width / 2 ? this.radius : canvas.width - this.radius;
        }

        // Bounce off top
        if (this.y - this.radius < 0) {
            this.vy *= -config.restitution;
            this.y = this.radius;
        }

        // Reset if ball goes off bottom or stops moving
        if (this.y > canvas.height + 100 || (Math.abs(this.vx) < 0.1 && Math.abs(this.vy) < 0.1 && this.y > canvas.height - 150)) {
            setTimeout(() => this.reset(), 500);
        }
    },
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Add shine effect
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 5, this.radius / 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
    }
};

// Slingshot object
const slingshot = {
    x: 0,
    y: 0,
    leftAnchorX: 0,
    rightAnchorX: 0,
    anchorY: 0,
    pulling: false,
    pullX: 0,
    pullY: 0,

    init() {
        this.x = canvas.width / 2;
        this.y = canvas.height - 100;
        this.leftAnchorX = this.x - 50;
        this.rightAnchorX = this.x + 50;
        this.anchorY = this.y;
    },

    draw() {
        // Draw slingshot arms
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';

        // Left arm
        ctx.beginPath();
        ctx.moveTo(this.leftAnchorX, this.anchorY);
        ctx.lineTo(this.leftAnchorX, this.anchorY + 50);
        ctx.stroke();

        // Right arm
        ctx.beginPath();
        ctx.moveTo(this.rightAnchorX, this.anchorY);
        ctx.lineTo(this.rightAnchorX, this.anchorY + 50);
        ctx.stroke();

        // Draw elastic bands
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 4;

        if (this.pulling) {
            // Left band (stretched)
            ctx.beginPath();
            ctx.moveTo(this.leftAnchorX, this.anchorY);
            ctx.lineTo(this.pullX, this.pullY);
            ctx.stroke();

            // Right band (stretched)
            ctx.beginPath();
            ctx.moveTo(this.rightAnchorX, this.anchorY);
            ctx.lineTo(this.pullX, this.pullY);
            ctx.stroke();
        } else {
            // Left band
            ctx.beginPath();
            ctx.moveTo(this.leftAnchorX, this.anchorY);
            ctx.lineTo(ball.x, ball.y);
            ctx.stroke();

            // Right band
            ctx.beginPath();
            ctx.moveTo(this.rightAnchorX, this.anchorY);
            ctx.lineTo(ball.x, ball.y);
            ctx.stroke();
        }
    }
};

// Targets array
let targets = [];

function createTargets() {
    targets = [];
    const numTargets = Math.min(3 + level, 8);
    const spacing = canvas.width / (numTargets + 1);

    for (let i = 0; i < numTargets; i++) {
        targets.push({
            x: spacing * (i + 1),
            y: 50 + Math.random() * 100,
            radius: config.targetRadius,
            color: `hsl(${Math.random() * 360}, 70%, 60%)`,
            hit: false
        });
    }
}

function drawTargets() {
    targets.forEach(target => {
        if (target.hit) return;

        ctx.beginPath();
        ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
        ctx.fillStyle = target.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Bullseye
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.radius / 2, 0, Math.PI * 2);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
}

function checkCollisions() {
    targets.forEach(target => {
        if (target.hit) return;

        const dx = ball.x - target.x;
        const dy = ball.y - target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < ball.radius + target.radius) {
            target.hit = true;
            score += 100 * level;
            updateScore();

            // Check if all targets hit
            if (targets.every(t => t.hit)) {
                setTimeout(() => {
                    gameState = 'win';
                    showWinScreen();
                }, 1000);
            }
        }
    });
}

// Touch/Mouse input handling
let touchStartX = 0;
let touchStartY = 0;

function getTouchPos(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
    };
}

function handleStart(e) {
    if (gameState !== 'playing' || ball.active) return;

    e.preventDefault();
    const pos = getTouchPos(e);

    // Check if touching near the ball
    const dx = pos.x - ball.x;
    const dy = pos.y - ball.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < ball.radius + 30) {
        slingshot.pulling = true;
        touchStartX = pos.x;
        touchStartY = pos.y;
    }
}

function handleMove(e) {
    if (!slingshot.pulling) return;

    e.preventDefault();
    const pos = getTouchPos(e);

    // Calculate pull distance and direction
    let pullX = pos.x;
    let pullY = pos.y;

    // Limit pull distance
    const dx = pullX - slingshot.x;
    const dy = pullY - slingshot.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > config.maxPullDistance) {
        const angle = Math.atan2(dy, dx);
        pullX = slingshot.x + Math.cos(angle) * config.maxPullDistance;
        pullY = slingshot.y + Math.sin(angle) * config.maxPullDistance;
    }

    // Only allow pulling down and to the sides
    if (pullY < slingshot.y) {
        pullY = slingshot.y;
    }

    slingshot.pullX = pullX;
    slingshot.pullY = pullY;
}

function handleEnd(e) {
    if (!slingshot.pulling) return;

    e.preventDefault();
    slingshot.pulling = false;

    // Calculate launch velocity
    const dx = slingshot.x - slingshot.pullX;
    const dy = slingshot.y - slingshot.pullY;

    ball.vx = dx * config.slingshotStrength;
    ball.vy = dy * config.slingshotStrength;
    ball.active = true;
}

// Event listeners for both touch and mouse
canvas.addEventListener('touchstart', handleStart, { passive: false });
canvas.addEventListener('touchmove', handleMove, { passive: false });
canvas.addEventListener('touchend', handleEnd, { passive: false });
canvas.addEventListener('mousedown', handleStart);
canvas.addEventListener('mousemove', handleMove);
canvas.addEventListener('mouseup', handleEnd);

// Update game elements when canvas resizes
function updateSlingshotPosition() {
    slingshot.init();
    if (!ball.active) {
        ball.reset();
    }
}

function updateTargetPositions() {
    // Regenerate targets only if level changed
}

// Game loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'playing') {
        // Update
        ball.update();
        checkCollisions();

        // Draw
        drawTargets();
        slingshot.draw();
        ball.draw();

        // Draw aim guide when pulling
        if (slingshot.pulling) {
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(slingshot.pullX, slingshot.pullY);
            const aimX = slingshot.pullX - (slingshot.pullX - slingshot.x) * 3;
            const aimY = slingshot.pullY - (slingshot.pullY - slingshot.y) * 3;
            ctx.lineTo(aimX, aimY);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    requestAnimationFrame(gameLoop);
}

// UI functions
function updateScore() {
    document.getElementById('score-value').textContent = score;
}

function updateLevel() {
    document.getElementById('level-value').textContent = level;
}

function showWinScreen() {
    document.getElementById('final-score').textContent = score;
    document.getElementById('win-screen').classList.remove('hidden');
}

function startGame() {
    console.log('Starting game...', {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        gameState: gameState
    });

    gameState = 'playing';
    document.getElementById('start-screen').classList.add('hidden');

    ball.reset();
    slingshot.init();
    createTargets();
    updateScore();
    updateLevel();

    console.log('Game started!', {
        ballPos: { x: ball.x, y: ball.y },
        slingshotPos: { x: slingshot.x, y: slingshot.y },
        numTargets: targets.length,
        gameState: gameState
    });
}

function nextLevel() {
    level++;
    gameState = 'playing';
    document.getElementById('win-screen').classList.add('hidden');
    ball.reset();
    slingshot.init();
    createTargets();
    updateLevel();
}

// Button event listeners
document.getElementById('start-btn').addEventListener('click', () => {
    console.log('Start button clicked!');
    startGame();
});
document.getElementById('next-level-btn').addEventListener('click', nextLevel);

// Initialize on page load
console.log('Game initializing...', {
    canvasWidth: canvas.width,
    canvasHeight: canvas.height
});

// Start game loop
gameLoop();
