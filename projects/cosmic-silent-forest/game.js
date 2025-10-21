// Game configuration
const config = {
    gravity: 0.3,
    friction: 0.99,
    restitution: 0.7,
    slingshotStrength: 0.25,
    maxPullDistance: 150,
    ballRadius: 15,
    targetRadius: 20,
};

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameState = 'start'; // 'start', 'playing', 'win', 'gameover'
let score = 0;
let level = 1;
let shotsRemaining = 0;
let combo = 0;
let lastHitTime = 0;

// Particles system
const particles = [];

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.radius = Math.random() * 4 + 2;
        this.color = color;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.01;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2; // gravity
        this.life -= this.decay;
        return this.life > 0;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}

function createExplosion(x, y, color, count = 20) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        if (!particles[i].update()) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    particles.forEach(p => p.draw());
}

// Responsive canvas sizing
function resizeCanvas() {
    const maxWidth = Math.min(window.innerWidth - 40, 600);
    const maxHeight = window.innerHeight - 40;

    canvas.width = maxWidth;
    canvas.height = maxHeight;

    // Update game elements based on new size
    if (gameState === 'playing') {
        updateSlingshotPosition();
    }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Ball object
const balls = [];

class Ball {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = config.ballRadius;
        this.color = '#FFD700';
        this.active = false;
        this.type = type;

        if (type === 'explosive') {
            this.color = '#FF4500';
            this.explosionRadius = 80;
        } else if (type === 'big') {
            this.radius = config.ballRadius * 1.5;
            this.color = '#00CED1';
        }
    }

    update() {
        if (!this.active) return false;

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
            createExplosion(this.x, this.y, this.color, 5);
        }

        // Bounce off top
        if (this.y - this.radius < 0) {
            this.vy *= -config.restitution;
            this.y = this.radius;
            createExplosion(this.x, this.y, this.color, 5);
        }

        // Check collision with obstacles
        obstacles.forEach(obs => {
            if (obs.checkCollision(this)) {
                createExplosion(this.x, this.y, obs.color, 10);
            }
        });

        // Remove if ball goes off bottom or stops moving
        if (this.y > canvas.height + 100 ||
            (Math.abs(this.vx) < 0.1 && Math.abs(this.vy) < 0.1 && this.y > canvas.height - 150)) {
            return false;
        }

        return true;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        if (this.type === 'explosive') {
            ctx.strokeStyle = '#FF6347';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Pulsing effect
            const pulse = Math.sin(Date.now() / 100) * 0.2 + 0.8;
            ctx.globalAlpha = pulse;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.7, 0, Math.PI * 2);
            ctx.fillStyle = '#FFA500';
            ctx.fill();
            ctx.globalAlpha = 1;
        } else {
            ctx.strokeStyle = '#FFA500';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // Shine effect
        ctx.beginPath();
        ctx.arc(this.x - this.radius/3, this.y - this.radius/3, this.radius / 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
    }

    explode() {
        createExplosion(this.x, this.y, this.color, 40);

        // Check targets in explosion radius
        targets.forEach(target => {
            if (target.hit) return;
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < this.explosionRadius) {
                hitTarget(target);
            }
        });
    }
}

// Slingshot object - more modular and flexible
const slingshot = {
    x: 0,
    y: 0,
    leftAnchorX: 0,
    rightAnchorX: 0,
    anchorY: 0,
    pulling: false,
    pullX: 0,
    pullY: 0,
    currentBallType: 'normal',
    active: false,
    armWidth: 50,

    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.leftAnchorX = this.x - this.armWidth;
        this.rightAnchorX = this.x + this.armWidth;
        this.anchorY = this.y;
        this.active = true;
    },

    init() {
        // Default position (center bottom)
        const defaultX = canvas.width / 2;
        const defaultY = canvas.height - 100;
        this.setPosition(defaultX, defaultY);
    },

    reset() {
        balls.length = 0;
        this.active = false;
        this.currentBallType = 'normal';
    },

    createBallAtPosition() {
        if (balls.length > 0) return; // Only one ball at a time
        const ball = new Ball(this.x, this.y, this.currentBallType);
        balls.push(ball);
        this.currentBallType = 'normal';
    },

    draw() {
        if (!this.active) return;

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

        // Draw elastic bands (only when ball is not active)
        const mainBall = balls[0];
        if (mainBall && !mainBall.active) {
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
                ctx.lineTo(mainBall.x, mainBall.y);
                ctx.stroke();

                // Right band
                ctx.beginPath();
                ctx.moveTo(this.rightAnchorX, this.anchorY);
                ctx.lineTo(mainBall.x, mainBall.y);
                ctx.stroke();
            }
        }
    },

    isInShootingZone(y) {
        // Bottom third of the canvas
        const shootingZoneStart = canvas.height * 0.67;
        return y >= shootingZoneStart;
    }
};

// Target types
class Target {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.radius = config.targetRadius;
        this.type = type;
        this.hit = false;
        this.hitCount = 0;
        this.time = Math.random() * 1000;

        if (type === 'normal') {
            this.color = `hsl(${Math.random() * 60 + 180}, 70%, 60%)`;
            this.points = 100;
            this.maxHits = 1;
        } else if (type === 'bonus') {
            this.color = '#FFD700';
            this.points = 500;
            this.maxHits = 1;
            this.radius = config.targetRadius * 0.8;
        } else if (type === 'tough') {
            this.color = '#8B0000';
            this.points = 300;
            this.maxHits = 2;
        } else if (type === 'explosive') {
            this.color = '#FF4500';
            this.points = 200;
            this.maxHits = 1;
            this.explosionRadius = 100;
        }
    }

    update() {
        this.time += 16;

        // Moving patterns
        if (this.type === 'bonus') {
            // Circular motion
            this.x = this.startX + Math.sin(this.time / 500) * 30;
            this.y = this.startY + Math.cos(this.time / 500) * 30;
        } else if (this.type === 'normal' && Math.random() < 0.3) {
            // Gentle bobbing
            this.y = this.startY + Math.sin(this.time / 800) * 15;
        }
    }

    draw() {
        if (this.hit) return;

        // Glow effect for bonus targets
        if (this.type === 'bonus') {
            ctx.save();
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 20;
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();

        if (this.type === 'bonus') {
            ctx.restore();
        }

        // Bullseye
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius / 2, 0, Math.PI * 2);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Show hit count for tough targets
        if (this.type === 'tough' && this.hitCount > 0) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.maxHits - this.hitCount, this.x, this.y);
        }

        // Special indicator for explosive
        if (this.type === 'explosive') {
            const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
            ctx.save();
            ctx.globalAlpha = pulse;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius / 3, 0, Math.PI * 2);
            ctx.fillStyle = '#FFA500';
            ctx.fill();
            ctx.restore();
        }
    }

    explode() {
        createExplosion(this.x, this.y, this.color, 50);

        // Chain reaction - hit nearby targets
        targets.forEach(target => {
            if (target === this || target.hit) return;
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < this.explosionRadius) {
                setTimeout(() => hitTarget(target), 100);
            }
        });
    }
}

// Obstacles
class Obstacle {
    constructor(x, y, width, height, type = 'wall') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;

        if (type === 'wall') {
            this.color = '#696969';
            this.bounciness = 0.3;
        } else if (type === 'bouncy') {
            this.color = '#FF69B4';
            this.bounciness = 1.5;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        if (this.type === 'bouncy') {
            ctx.strokeStyle = '#FFB6C1';
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x, this.y, this.width, this.height);

            // Pattern
            ctx.fillStyle = '#FFB6C1';
            for (let i = 0; i < this.width; i += 15) {
                for (let j = 0; j < this.height; j += 15) {
                    ctx.fillRect(this.x + i, this.y + j, 5, 5);
                }
            }
        } else {
            ctx.strokeStyle = '#505050';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }

    checkCollision(ball) {
        // Simple AABB collision
        if (ball.x + ball.radius > this.x &&
            ball.x - ball.radius < this.x + this.width &&
            ball.y + ball.radius > this.y &&
            ball.y - ball.radius < this.y + this.height) {

            // Determine which side was hit
            const overlapLeft = (ball.x + ball.radius) - this.x;
            const overlapRight = (this.x + this.width) - (ball.x - ball.radius);
            const overlapTop = (ball.y + ball.radius) - this.y;
            const overlapBottom = (this.y + this.height) - (ball.y - ball.radius);

            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

            if (minOverlap === overlapLeft || minOverlap === overlapRight) {
                ball.vx *= -this.bounciness;
            } else {
                ball.vy *= -this.bounciness;
            }

            return true;
        }
        return false;
    }
}

// Power-ups
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 15;
        this.collected = false;
        this.time = 0;

        if (type === 'explosive') {
            this.color = '#FF4500';
            this.icon = '💣';
        } else if (type === 'multiball') {
            this.color = '#00CED1';
            this.icon = '⚡';
        } else if (type === 'bigball') {
            this.color = '#9370DB';
            this.icon = '⭐';
        }
    }

    update() {
        this.time += 16;
        this.y += Math.sin(this.time / 300) * 0.5;
    }

    draw() {
        if (this.collected) return;

        ctx.save();
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, this.x, this.y);

        ctx.restore();
    }

    checkCollision(ball) {
        if (this.collected) return false;

        const dx = ball.x - this.x;
        const dy = ball.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < ball.radius + this.radius) {
            this.collected = true;
            createExplosion(this.x, this.y, this.color, 30);
            return true;
        }
        return false;
    }
}

let targets = [];
let obstacles = [];
let powerUps = [];

// Level definitions
const levelLayouts = [
    {
        targets: [
            { type: 'normal', x: 0.3, y: 150 },
            { type: 'normal', x: 0.5, y: 150 },
            { type: 'normal', x: 0.7, y: 150 },
        ],
        obstacles: [],
        shots: 5,
    },
    {
        targets: [
            { type: 'normal', x: 0.25, y: 120 },
            { type: 'bonus', x: 0.5, y: 80 },
            { type: 'normal', x: 0.75, y: 120 },
            { type: 'tough', x: 0.5, y: 180 },
        ],
        obstacles: [],
        shots: 6,
    },
    {
        targets: [
            { type: 'normal', x: 0.2, y: 100 },
            { type: 'normal', x: 0.8, y: 100 },
            { type: 'explosive', x: 0.5, y: 150 },
        ],
        obstacles: [
            { type: 'wall', x: 0.4, y: 200, w: 80, h: 20 },
        ],
        powerUps: [
            { type: 'explosive', x: 0.3, y: 300 },
        ],
        shots: 5,
    },
    {
        targets: [
            { type: 'tough', x: 0.2, y: 120 },
            { type: 'bonus', x: 0.5, y: 80 },
            { type: 'tough', x: 0.8, y: 120 },
            { type: 'normal', x: 0.35, y: 180 },
            { type: 'normal', x: 0.65, y: 180 },
        ],
        obstacles: [
            { type: 'bouncy', x: 0.3, y: 250, w: 60, h: 15 },
            { type: 'bouncy', x: 0.6, y: 250, w: 60, h: 15 },
        ],
        shots: 7,
    },
    {
        targets: [
            { type: 'explosive', x: 0.3, y: 120 },
            { type: 'normal', x: 0.5, y: 100 },
            { type: 'explosive', x: 0.7, y: 120 },
            { type: 'bonus', x: 0.4, y: 200 },
            { type: 'bonus', x: 0.6, y: 200 },
        ],
        obstacles: [
            { type: 'wall', x: 0.25, y: 280, w: 100, h: 15 },
            { type: 'bouncy', x: 0.55, y: 280, w: 100, h: 15 },
        ],
        powerUps: [
            { type: 'multiball', x: 0.5, y: 350 },
        ],
        shots: 6,
    }
];

function createLevel(levelNum) {
    targets = [];
    obstacles = [];
    powerUps = [];

    const layoutIndex = Math.min(levelNum - 1, levelLayouts.length - 1);
    const layout = levelLayouts[layoutIndex];

    // Create targets
    layout.targets.forEach(t => {
        const x = t.x * canvas.width;
        const y = t.y;
        targets.push(new Target(x, y, t.type));
    });

    // Create obstacles
    if (layout.obstacles) {
        layout.obstacles.forEach(o => {
            const x = o.x * canvas.width;
            obstacles.push(new Obstacle(x, o.y, o.w, o.h, o.type));
        });
    }

    // Create power-ups
    if (layout.powerUps) {
        layout.powerUps.forEach(p => {
            const x = p.x * canvas.width;
            powerUps.push(new PowerUp(x, p.y, p.type));
        });
    }

    shotsRemaining = layout.shots;
    updateShotsDisplay();
}

function hitTarget(target) {
    if (target.hit) return;

    target.hitCount++;

    if (target.hitCount >= target.maxHits) {
        target.hit = true;

        // Combo system
        const now = Date.now();
        if (now - lastHitTime < 2000) {
            combo++;
        } else {
            combo = 1;
        }
        lastHitTime = now;

        const points = target.points * combo * level;
        score += points;
        updateScore();

        // Show combo text
        showFloatingText(target.x, target.y, `+${points}${combo > 1 ? ' x' + combo : ''}`, target.color);

        createExplosion(target.x, target.y, target.color, 30);

        // Explosive targets chain
        if (target.type === 'explosive') {
            setTimeout(() => target.explode(), 100);
        }

        // Check if all targets hit
        if (targets.every(t => t.hit)) {
            setTimeout(() => {
                gameState = 'win';
                showWinScreen();
            }, 1000);
        }
    } else {
        createExplosion(target.x, target.y, target.color, 15);
    }
}

function checkCollisions() {
    balls.forEach(ball => {
        if (!ball.active) return;

        // Check target collisions
        targets.forEach(target => {
            if (target.hit) return;

            const dx = ball.x - target.x;
            const dy = ball.y - target.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < ball.radius + target.radius) {
                hitTarget(target);

                if (ball.type === 'explosive') {
                    ball.explode();
                }
            }
        });

        // Check power-up collisions
        powerUps.forEach(powerUp => {
            if (powerUp.checkCollision(ball)) {
                applyPowerUp(powerUp.type);
            }
        });
    });
}

function applyPowerUp(type) {
    if (type === 'explosive') {
        slingshot.currentBallType = 'explosive';
        showFloatingText(canvas.width / 2, 50, 'EXPLOSIVE BALL!', '#FF4500');
    } else if (type === 'multiball') {
        // Spawn 2 extra balls
        const mainBall = balls[0];
        if (mainBall) {
            for (let i = 0; i < 2; i++) {
                const newBall = new Ball(mainBall.x, mainBall.y);
                const angle = (Math.PI / 4) * (i + 1);
                newBall.vx = Math.cos(angle) * 5;
                newBall.vy = -Math.sin(angle) * 5;
                newBall.active = true;
                balls.push(newBall);
            }
        }
        showFloatingText(canvas.width / 2, 50, 'MULTI-BALL!', '#00CED1');
    } else if (type === 'bigball') {
        slingshot.currentBallType = 'big';
        showFloatingText(canvas.width / 2, 50, 'BIG BALL!', '#9370DB');
    }
}

// Floating text
const floatingTexts = [];

function showFloatingText(x, y, text, color) {
    floatingTexts.push({
        x, y, text, color,
        life: 1.0,
        vy: -2
    });
}

function updateFloatingTexts() {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y += ft.vy;
        ft.life -= 0.02;
        if (ft.life <= 0) {
            floatingTexts.splice(i, 1);
        }
    }
}

function drawFloatingTexts() {
    floatingTexts.forEach(ft => {
        ctx.save();
        ctx.globalAlpha = ft.life;
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = ft.color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
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
    if (gameState !== 'playing') return;
    if (shotsRemaining === 0) return;

    e.preventDefault();
    const pos = getTouchPos(e);

    // Check if in shooting zone (bottom third)
    if (!slingshot.isInShootingZone(pos.y)) return;

    const mainBall = balls[0];

    // If no ball exists or ball is active, and we're in the shooting zone, create new slingshot
    if (!mainBall || mainBall.active) {
        // Only create new slingshot if all balls are inactive (or no balls exist)
        if (balls.length > 0 && balls.every(b => b.active)) return;

        // Create slingshot at touch position
        slingshot.setPosition(pos.x, pos.y);
        slingshot.createBallAtPosition();
        slingshot.pulling = true;
        slingshot.pullX = pos.x;
        slingshot.pullY = pos.y;
        return;
    }

    // Check if touching near the existing ball
    const dx = pos.x - mainBall.x;
    const dy = pos.y - mainBall.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < mainBall.radius + 30) {
        slingshot.pulling = true;
        touchStartX = pos.x;
        touchStartY = pos.y;
    }
}

function handleMove(e) {
    if (!slingshot.pulling) return;

    e.preventDefault();
    const pos = getTouchPos(e);
    const mainBall = balls[0];
    if (!mainBall) return;

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

    slingshot.pullX = pullX;
    slingshot.pullY = pullY;

    // Move the ball to the pull position
    mainBall.x = pullX;
    mainBall.y = pullY;
}

function handleEnd(e) {
    if (!slingshot.pulling) return;

    e.preventDefault();
    slingshot.pulling = false;

    const mainBall = balls[0];

    // Calculate launch velocity
    const dx = slingshot.x - slingshot.pullX;
    const dy = slingshot.y - slingshot.pullY;

    mainBall.vx = dx * config.slingshotStrength;
    mainBall.vy = dy * config.slingshotStrength;
    mainBall.active = true;

    shotsRemaining--;
    updateShotsDisplay();

    // Check for game over
    setTimeout(() => {
        if (balls.every(b => !b.active) && shotsRemaining === 0 && !targets.every(t => t.hit)) {
            gameState = 'gameover';
            showGameOverScreen();
        }
    }, 3000);
}

// Event listeners
canvas.addEventListener('touchstart', handleStart, { passive: false });
canvas.addEventListener('touchmove', handleMove, { passive: false });
canvas.addEventListener('touchend', handleEnd, { passive: false });
canvas.addEventListener('mousedown', handleStart);
canvas.addEventListener('mousemove', handleMove);
canvas.addEventListener('mouseup', handleEnd);

// Update game elements when canvas resizes
function updateSlingshotPosition() {
    // Reset slingshot position on resize
    if (slingshot.active && balls.length > 0 && !balls[0].active) {
        slingshot.init();
        const mainBall = balls[0];
        if (mainBall) {
            mainBall.x = slingshot.x;
            mainBall.y = slingshot.y;
        }
    }
}

// Game loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'playing') {
        // Draw shooting zone indicator
        const shootingZoneY = canvas.height * 0.67;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(0, shootingZoneY, canvas.width, canvas.height - shootingZoneY);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(0, shootingZoneY);
        ctx.lineTo(canvas.width, shootingZoneY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Update
        for (let i = balls.length - 1; i >= 0; i--) {
            if (!balls[i].update()) {
                balls.splice(i, 1);
            }
        }

        targets.forEach(t => t.update());
        powerUps.forEach(p => p.update());
        checkCollisions();
        updateParticles();
        updateFloatingTexts();

        // Reset slingshot if all balls are gone and shots remain
        if (balls.length === 0 && shotsRemaining > 0 && !targets.every(t => t.hit)) {
            slingshot.reset();
        }

        // Draw
        obstacles.forEach(o => o.draw());
        targets.forEach(t => t.draw());
        powerUps.forEach(p => p.draw());
        slingshot.draw();
        balls.forEach(b => b.draw());
        drawParticles();
        drawFloatingTexts();

        // Draw aim guide when pulling
        const mainBall = balls[0];
        if (slingshot.pulling && mainBall) {
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

        // Draw combo indicator
        if (combo > 1 && Date.now() - lastHitTime < 2000) {
            ctx.font = 'bold 30px Arial';
            ctx.fillStyle = '#FFD700';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.textAlign = 'center';
            const comboText = `COMBO x${combo}!`;
            ctx.strokeText(comboText, canvas.width / 2, canvas.height - 50);
            ctx.fillText(comboText, canvas.width / 2, canvas.height - 50);
        }

        // Show hint if no slingshot active
        if (!slingshot.active && shotsRemaining > 0) {
            ctx.font = '18px Arial';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const hintY = canvas.height * 0.8;
            ctx.fillText('Touch in the zone below to shoot', canvas.width / 2, hintY);
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

function updateShotsDisplay() {
    const shotsEl = document.getElementById('shots-value');
    if (shotsEl) {
        shotsEl.textContent = shotsRemaining;
    }
}

function showWinScreen() {
    document.getElementById('final-score').textContent = score;
    document.getElementById('win-screen').classList.remove('hidden');
}

function showGameOverScreen() {
    document.getElementById('gameover-score').textContent = score;
    document.getElementById('gameover-screen').classList.remove('hidden');
}

function startGame() {
    gameState = 'playing';
    score = 0;
    level = 1;
    combo = 0;

    document.getElementById('start-screen').classList.add('hidden');

    // Reset slingshot and wait for user touch
    slingshot.reset();
    createLevel(level);
    updateScore();
    updateLevel();
}

function nextLevel() {
    level++;
    gameState = 'playing';
    combo = 0;

    document.getElementById('win-screen').classList.add('hidden');

    // Reset slingshot and wait for user touch
    slingshot.reset();
    createLevel(level);
    updateLevel();
}

function restartGame() {
    gameState = 'playing';
    score = 0;
    level = 1;
    combo = 0;

    document.getElementById('gameover-screen').classList.add('hidden');

    // Reset slingshot and wait for user touch
    slingshot.reset();
    createLevel(level);
    updateScore();
    updateLevel();
}

// Button event listeners
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('next-level-btn').addEventListener('click', nextLevel);
document.getElementById('restart-btn').addEventListener('click', restartGame);

// Start game loop
gameLoop();
