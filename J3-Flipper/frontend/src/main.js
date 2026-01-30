// Flipper IoT - Main Game Engine

// === Configuration ===
const CONFIG = {
  WS_URL: 'ws://localhost:8080',
  CANVAS_WIDTH: 400,
  CANVAS_HEIGHT: 700,
  GRAVITY: 0.3,
  FRICTION: 0.99,
  BALL_RADIUS: 10,
  FLIPPER_LENGTH: 80,
  FLIPPER_WIDTH: 12,
  FLIPPER_SPEED: 0.3,
  MAX_BALLS: 3,
  BUMPER_FORCE: 8,
};

// === Game State ===
const state = {
  score: 0,
  highScore: parseInt(localStorage.getItem('flipperHighScore') || '0'),
  balls: CONFIG.MAX_BALLS,
  ball: null,
  leftFlipper: { angle: 0.4, target: 0.4, active: false },
  rightFlipper: { angle: -0.4, target: -0.4, active: false },
  plunger: { value: 0, pulled: false },
  gameOver: false,
  ballInPlay: false,
  ws: null,
  connected: false,
};

// === DOM Elements ===
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const ballsEl = document.getElementById('balls');
const highScoreEl = document.getElementById('highScore');
const connectionStatus = document.getElementById('connectionStatus');
const debugLog = document.getElementById('debugLog');
const plungerHandle = document.getElementById('plungerHandle');
const overlay = document.getElementById('gameOverlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayScore = document.getElementById('overlayScore');
const restartBtn = document.getElementById('restartBtn');

// === Pinball Elements ===
const bumpers = [
  { x: 120, y: 200, radius: 25, score: 100 },
  { x: 280, y: 200, radius: 25, score: 100 },
  { x: 200, y: 280, radius: 30, score: 150 },
  { x: 150, y: 380, radius: 20, score: 75 },
  { x: 250, y: 380, radius: 20, score: 75 },
];

const targets = [
  { x: 80, y: 150, width: 10, height: 40, score: 50, hit: false },
  { x: 310, y: 150, width: 10, height: 40, score: 50, hit: false },
  { x: 80, y: 300, width: 10, height: 40, score: 50, hit: false },
  { x: 310, y: 300, width: 10, height: 40, score: 50, hit: false },
];

// Flipper positions
const leftFlipperPos = { x: 100, y: 620 };
const rightFlipperPos = { x: 300, y: 620 };

// === Logging ===
function log(message, type = 'info') {
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  debugLog.insertBefore(entry, debugLog.firstChild);

  // Keep only last 20 entries
  while (debugLog.children.length > 20) {
    debugLog.removeChild(debugLog.lastChild);
  }
}

// === WebSocket Connection ===
function connectWebSocket() {
  log('Connecting to ' + CONFIG.WS_URL);

  try {
    state.ws = new WebSocket(CONFIG.WS_URL);

    state.ws.onopen = () => {
      state.connected = true;
      connectionStatus.classList.add('connected');
      connectionStatus.querySelector('.text').textContent = 'Connected';
      log('WebSocket connected!', 'info');
    };

    state.ws.onclose = () => {
      state.connected = false;
      connectionStatus.classList.remove('connected');
      connectionStatus.querySelector('.text').textContent = 'Disconnected';
      log('WebSocket disconnected', 'error');

      // Reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000);
    };

    state.ws.onerror = (err) => {
      log('WebSocket error', 'error');
    };

    state.ws.onmessage = (event) => {
      handleMessage(event.data);
    };
  } catch (err) {
    log('Failed to connect: ' + err.message, 'error');
    setTimeout(connectWebSocket, 3000);
  }
}

// === Message Handler (from ESP32 via Bridge) ===
function handleMessage(data) {
  try {
    const msg = JSON.parse(data);
    log(`ESP32: ${JSON.stringify(msg)}`);

    switch (msg.type) {
      case 'flipper':
        handleFlipper(msg.side, msg.state === 'down');
        break;

      case 'plunger':
        handlePlunger(msg.value);
        break;

      case 'launch':
        launchBall(msg.power || 1);
        break;

      case 'boot':
        log(`Device connected: ${msg.device}`, 'info');
        break;

      default:
        log(`Unknown message type: ${msg.type}`);
    }
  } catch (err) {
    // Non-JSON message, ignore
  }
}

// === Flipper Control ===
function handleFlipper(side, active) {
  if (side === 'left') {
    state.leftFlipper.active = active;
    state.leftFlipper.target = active ? -0.5 : 0.4;
  } else if (side === 'right') {
    state.rightFlipper.active = active;
    state.rightFlipper.target = active ? 0.5 : -0.4;
  }
}

// === Plunger Control ===
function handlePlunger(value) {
  state.plunger.value = value;
  state.plunger.pulled = value > 0.1;

  // Update visual
  const maxTravel = 140;
  plungerHandle.style.bottom = `${10 + value * maxTravel}px`;

  // Auto-launch when released from high pull
  if (state.plunger.pulled && value < 0.1 && !state.ballInPlay && state.balls > 0) {
    launchBall(state.plunger.value);
  }
}

// === Ball Launch ===
function launchBall(power = 1) {
  if (state.ballInPlay || state.balls <= 0 || state.gameOver) return;

  const launchPower = 8 + power * 12; // 8-20 speed

  state.ball = {
    x: 370,
    y: 600,
    vx: -2 + Math.random() * -2,
    vy: -launchPower,
  };

  state.ballInPlay = true;
  log(`Ball launched! Power: ${(power * 100).toFixed(0)}%`);

  // Send feedback to ESP32
  sendToDevice({ type: 'rumble', duration: 50 });
}

// === Send Message to Device ===
function sendToDevice(msg) {
  if (state.ws && state.connected) {
    state.ws.send(JSON.stringify(msg));
  }
}

// === Physics & Collision ===
function updateBall() {
  if (!state.ball) return;

  // Apply gravity
  state.ball.vy += CONFIG.GRAVITY;

  // Apply friction
  state.ball.vx *= CONFIG.FRICTION;
  state.ball.vy *= CONFIG.FRICTION;

  // Update position
  state.ball.x += state.ball.vx;
  state.ball.y += state.ball.vy;

  // Wall collisions
  const r = CONFIG.BALL_RADIUS;

  // Left wall
  if (state.ball.x < r + 30) {
    state.ball.x = r + 30;
    state.ball.vx = Math.abs(state.ball.vx) * 0.8;
  }

  // Right wall
  if (state.ball.x > CONFIG.CANVAS_WIDTH - r - 30) {
    state.ball.x = CONFIG.CANVAS_WIDTH - r - 30;
    state.ball.vx = -Math.abs(state.ball.vx) * 0.8;
  }

  // Top
  if (state.ball.y < r + 20) {
    state.ball.y = r + 20;
    state.ball.vy = Math.abs(state.ball.vy) * 0.8;
  }

  // Bumper collisions
  for (const bumper of bumpers) {
    const dx = state.ball.x - bumper.x;
    const dy = state.ball.y - bumper.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < r + bumper.radius) {
      // Bounce
      const nx = dx / dist;
      const ny = dy / dist;

      state.ball.x = bumper.x + nx * (r + bumper.radius + 1);
      state.ball.y = bumper.y + ny * (r + bumper.radius + 1);

      state.ball.vx = nx * CONFIG.BUMPER_FORCE;
      state.ball.vy = ny * CONFIG.BUMPER_FORCE;

      addScore(bumper.score);
      bumper.flash = 10;
      sendToDevice({ type: 'rumble', duration: 30 });
    }
  }

  // Target collisions
  for (const target of targets) {
    if (target.hit) continue;

    if (
      state.ball.x + r > target.x &&
      state.ball.x - r < target.x + target.width &&
      state.ball.y + r > target.y &&
      state.ball.y - r < target.y + target.height
    ) {
      target.hit = true;
      addScore(target.score);
      setTimeout(() => (target.hit = false), 3000);
    }
  }

  // Flipper collisions
  checkFlipperCollision(leftFlipperPos, state.leftFlipper.angle, true);
  checkFlipperCollision(rightFlipperPos, state.rightFlipper.angle, false);

  // Ball lost
  if (state.ball.y > CONFIG.CANVAS_HEIGHT + 50) {
    loseBall();
  }
}

function checkFlipperCollision(pos, angle, isLeft) {
  if (!state.ball) return;

  const flipperEnd = {
    x: pos.x + Math.cos(angle + (isLeft ? 0 : Math.PI)) * CONFIG.FLIPPER_LENGTH,
    y: pos.y + Math.sin(angle + (isLeft ? 0 : Math.PI)) * CONFIG.FLIPPER_LENGTH,
  };

  // Simple line-circle collision
  const dx = flipperEnd.x - pos.x;
  const dy = flipperEnd.y - pos.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = dx / len;
  const ny = dy / len;

  // Project ball onto flipper line
  const bx = state.ball.x - pos.x;
  const by = state.ball.y - pos.y;
  const proj = bx * nx + by * ny;

  if (proj < 0 || proj > len) return;

  const closestX = pos.x + nx * proj;
  const closestY = pos.y + ny * proj;

  const distX = state.ball.x - closestX;
  const distY = state.ball.y - closestY;
  const dist = Math.sqrt(distX * distX + distY * distY);

  if (dist < CONFIG.BALL_RADIUS + CONFIG.FLIPPER_WIDTH / 2) {
    // Bounce perpendicular
    const perpX = distX / dist;
    const perpY = distY / dist;

    state.ball.x = closestX + perpX * (CONFIG.BALL_RADIUS + CONFIG.FLIPPER_WIDTH / 2 + 1);
    state.ball.y = closestY + perpY * (CONFIG.BALL_RADIUS + CONFIG.FLIPPER_WIDTH / 2 + 1);

    // Add flipper velocity if active
    const flipper = isLeft ? state.leftFlipper : state.rightFlipper;
    const boost = flipper.active ? 12 : 5;

    state.ball.vx = perpX * boost + (isLeft ? 3 : -3);
    state.ball.vy = -Math.abs(perpY * boost) - 2;
  }
}

// === Score ===
function addScore(points) {
  state.score += points;
  scoreEl.textContent = state.score;

  if (state.score > state.highScore) {
    state.highScore = state.score;
    highScoreEl.textContent = state.highScore;
    localStorage.setItem('flipperHighScore', state.highScore.toString());
  }

  // Send score to device
  sendToDevice({ type: 'score', value: state.score });
}

function loseBall() {
  state.ball = null;
  state.ballInPlay = false;
  state.balls--;
  ballsEl.textContent = state.balls;

  log(`Ball lost! ${state.balls} remaining`);
  sendToDevice({ type: 'rumble', duration: 200 });

  if (state.balls <= 0) {
    gameOver();
  }
}

function gameOver() {
  state.gameOver = true;
  overlayTitle.textContent = 'GAME OVER';
  overlayScore.textContent = `Final Score: ${state.score}`;
  overlay.classList.add('visible');
  log('GAME OVER!', 'error');
}

function resetGame() {
  state.score = 0;
  state.balls = CONFIG.MAX_BALLS;
  state.ball = null;
  state.ballInPlay = false;
  state.gameOver = false;

  scoreEl.textContent = '0';
  ballsEl.textContent = state.balls;
  highScoreEl.textContent = state.highScore;

  overlay.classList.remove('visible');

  // Reset targets
  for (const target of targets) {
    target.hit = false;
  }

  log('New game started!', 'info');
}

// === Update Flippers ===
function updateFlippers() {
  // Smoothly move flippers towards target
  const speed = CONFIG.FLIPPER_SPEED;

  if (state.leftFlipper.angle < state.leftFlipper.target) {
    state.leftFlipper.angle = Math.min(state.leftFlipper.angle + speed, state.leftFlipper.target);
  } else {
    state.leftFlipper.angle = Math.max(state.leftFlipper.angle - speed, state.leftFlipper.target);
  }

  if (state.rightFlipper.angle < state.rightFlipper.target) {
    state.rightFlipper.angle = Math.min(state.rightFlipper.angle + speed, state.rightFlipper.target);
  } else {
    state.rightFlipper.angle = Math.max(state.rightFlipper.angle - speed, state.rightFlipper.target);
  }
}

// === Rendering ===
function render() {
  ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

  // Background
  const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(1, '#0a0a15');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

  // Walls
  ctx.strokeStyle = '#00fff2';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(30, 20);
  ctx.lineTo(30, 580);
  ctx.lineTo(80, 620);
  ctx.moveTo(CONFIG.CANVAS_WIDTH - 30, 20);
  ctx.lineTo(CONFIG.CANVAS_WIDTH - 30, 580);
  ctx.lineTo(CONFIG.CANVAS_WIDTH - 80, 620);
  ctx.stroke();

  // Top arc
  ctx.beginPath();
  ctx.arc(CONFIG.CANVAS_WIDTH / 2, 20, CONFIG.CANVAS_WIDTH / 2 - 30, Math.PI, 0);
  ctx.stroke();

  // Bumpers
  for (const bumper of bumpers) {
    const flash = bumper.flash || 0;
    if (flash > 0) bumper.flash--;

    ctx.beginPath();
    ctx.arc(bumper.x, bumper.y, bumper.radius, 0, Math.PI * 2);

    if (flash > 0) {
      ctx.fillStyle = '#ff0080';
      ctx.shadowColor = '#ff0080';
      ctx.shadowBlur = 30;
    } else {
      ctx.fillStyle = '#ff6b35';
      ctx.shadowColor = '#ff6b35';
      ctx.shadowBlur = 15;
    }
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Score text
    ctx.fillStyle = '#fff';
    ctx.font = '12px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText(bumper.score.toString(), bumper.x, bumper.y + 4);
  }

  // Targets
  for (const target of targets) {
    ctx.fillStyle = target.hit ? '#333' : '#39ff14';
    ctx.shadowColor = target.hit ? 'transparent' : '#39ff14';
    ctx.shadowBlur = target.hit ? 0 : 10;
    ctx.fillRect(target.x, target.y, target.width, target.height);
    ctx.shadowBlur = 0;
  }

  // Flippers
  drawFlipper(leftFlipperPos, state.leftFlipper.angle, true);
  drawFlipper(rightFlipperPos, state.rightFlipper.angle, false);

  // Ball
  if (state.ball) {
    ctx.beginPath();
    ctx.arc(state.ball.x, state.ball.y, CONFIG.BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#e0e0e0';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Ball shine
    ctx.beginPath();
    ctx.arc(state.ball.x - 3, state.ball.y - 3, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }

  // Drain zone
  ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
  ctx.fillRect(80, CONFIG.CANVAS_HEIGHT - 50, CONFIG.CANVAS_WIDTH - 160, 50);

  // Launch indicator if no ball
  if (!state.ballInPlay && state.balls > 0) {
    ctx.fillStyle = 'rgba(0, 255, 242, 0.5)';
    ctx.font = '14px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText('PRESS SPACE TO LAUNCH', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
  }
}

function drawFlipper(pos, angle, isLeft) {
  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(angle + (isLeft ? 0 : Math.PI));

  // Flipper body
  ctx.beginPath();
  ctx.moveTo(0, -CONFIG.FLIPPER_WIDTH / 2);
  ctx.lineTo(CONFIG.FLIPPER_LENGTH, -CONFIG.FLIPPER_WIDTH / 4);
  ctx.lineTo(CONFIG.FLIPPER_LENGTH, CONFIG.FLIPPER_WIDTH / 4);
  ctx.lineTo(0, CONFIG.FLIPPER_WIDTH / 2);
  ctx.closePath();

  const flipper = isLeft ? state.leftFlipper : state.rightFlipper;
  ctx.fillStyle = flipper.active ? '#ff6b35' : '#ff6b35';
  ctx.shadowColor = flipper.active ? '#ff6b35' : 'transparent';
  ctx.shadowBlur = flipper.active ? 20 : 0;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Pivot
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#333';
  ctx.fill();
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

// === Keyboard Controls ===
document.addEventListener('keydown', (e) => {
  if (e.repeat) return;

  switch (e.key.toLowerCase()) {
    case 'a':
    case 'arrowleft':
      handleFlipper('left', true);
      break;
    case 'l':
    case 'arrowright':
      handleFlipper('right', true);
      break;
    case ' ':
      e.preventDefault();
      if (!state.ballInPlay && state.balls > 0) {
        launchBall(0.8);
      }
      break;
  }
});

document.addEventListener('keyup', (e) => {
  switch (e.key.toLowerCase()) {
    case 'a':
    case 'arrowleft':
      handleFlipper('left', false);
      break;
    case 'l':
    case 'arrowright':
      handleFlipper('right', false);
      break;
  }
});

// === Restart Button ===
restartBtn.addEventListener('click', resetGame);

// === Game Loop ===
function gameLoop() {
  if (!state.gameOver) {
    updateFlippers();
    updateBall();
  }
  render();
  requestAnimationFrame(gameLoop);
}

// === Init ===
function init() {
  highScoreEl.textContent = state.highScore;
  ballsEl.textContent = state.balls;

  connectWebSocket();
  gameLoop();

  log('Game initialized. Waiting for ESP32...', 'info');
}

init();
