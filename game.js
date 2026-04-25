const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const world = {
  gravity: 1800,
  width: canvas.width,
  height: canvas.height,
};

const material = {
  platformPattern: null,
};

function buildMaterials() {
  const tile = document.createElement('canvas');
  tile.width = 24;
  tile.height = 24;
  const tctx = tile.getContext('2d');
  tctx.fillStyle = '#7f8aa4';
  tctx.fillRect(0, 0, tile.width, tile.height);
  tctx.fillStyle = '#96a2c1';
  tctx.fillRect(0, 0, tile.width, 5);
  tctx.strokeStyle = 'rgba(255,255,255,0.08)';
  tctx.lineWidth = 2;
  tctx.beginPath();
  tctx.moveTo(0, 12);
  tctx.lineTo(24, 12);
  tctx.stroke();
  material.platformPattern = ctx.createPattern(tile, 'repeat');
}

const keysHeld = new Set();
const keysPressed = new Set();
window.addEventListener('keydown', (e) => {
  const code = e.code;
  if (["ArrowLeft", "ArrowRight", "Space", "KeyA", "KeyD", "KeyR", "KeyE"].includes(code)) {
    e.preventDefault();
  }
  if (!keysHeld.has(code)) keysPressed.add(code);
  keysHeld.add(code);
});
window.addEventListener('keyup', (e) => keysHeld.delete(e.code));

const player = {
  x: 40,
  y: 420,
  w: 30,
  h: 42,
  vx: 0,
  vy: 0,
  speed: 280,
  jumpForce: 730,
  onGround: false,
  won: false,
  facing: 1,
};

const levels = [
  {
    name: 'Level 1: Entry Hall',
    start: { x: 40, y: 420 },
    platforms: [
      { x: 0, y: 500, w: 240, h: 40 },
      { x: 320, y: 500, w: 180, h: 40 },
      { x: 550, y: 440, w: 160, h: 20 },
      { x: 760, y: 380, w: 120, h: 20 },
      { x: 900, y: 320, w: 60, h: 20 },
    ],
    spikes: [{ x: 250, y: 500, w: 65, h: 40 }],
    lever: { x: 185, y: 460, w: 18, h: 40, pulled: false, promptRange: 80 },
    gate: { x: 915, y: 265, w: 30, h: 55, type: 'next', locked: true, initialLocked: true },
    enemy: {
      spawnX: 575,
      y: 400,
      w: 34,
      h: 34,
      speed: 95,
      patrolMinX: 555,
      patrolMaxX: 690,
      detectionRange: 210,
      resetRange: 290,
    },
  },
  {
    name: 'Level 2: Lever Chamber',
    start: { x: 30, y: 300 },
    platforms: [
      { x: 0, y: 500, w: 230, h: 40 },
      { x: 265, y: 450, w: 180, h: 20 },
      { x: 480, y: 410, w: 150, h: 20 },
      { x: 670, y: 460, w: 180, h: 20 },
      { x: 820, y: 500, w: 140, h: 40 },
    ],
    spikes: [
      { x: 232, y: 500, w: 30, h: 40 },
      { x: 635, y: 500, w: 30, h: 40 },
    ],
    lever: { x: 340, y: 410, w: 18, h: 40, pulled: false, promptRange: 66 },
    gate: { x: 900, y: 445, w: 30, h: 55, type: 'finish', locked: true, initialLocked: true },
    enemy: {
      spawnX: 690,
      y: 426,
      w: 34,
      h: 34,
      speed: 105,
      patrolMinX: 670,
      patrolMaxX: 840,
      detectionRange: 240,
      resetRange: 300,
    },
  },
];

let currentLevelIndex = 0;
let enemy = null;

function currentLevel() {
  return levels[currentLevelIndex];
}

function setStatus(text) {
  statusEl.textContent = text;
}

function overlap(a, b) {
  return a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y;
}

function resetEnemy() {
  const levelEnemy = currentLevel().enemy;
  enemy = {
    x: levelEnemy.spawnX,
    y: levelEnemy.y,
    w: levelEnemy.w,
    h: levelEnemy.h,
    vx: 0,
    speed: levelEnemy.speed,
    patrolMinX: levelEnemy.patrolMinX,
    patrolMaxX: levelEnemy.patrolMaxX,
    detectionRange: levelEnemy.detectionRange,
    resetRange: levelEnemy.resetRange,
    state: 'patrol',
    direction: 1,
  };
}

function resetPlayer(position, message) {
  player.x = position.x;
  player.y = position.y;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.won = false;
  setStatus(message);
}

function loadLevel(index, message) {
  currentLevelIndex = index;
  const level = currentLevel();
  level.gate.locked = level.gate.initialLocked;
  if (level.lever) level.lever.pulled = false;
  resetEnemy();
  resetPlayer(level.start, message || `${level.name}. Reach the gate.`);
}

function restartLevel(message = 'Level reset.') {
  const level = currentLevel();
  level.gate.locked = level.gate.initialLocked;
  if (level.lever) level.lever.pulled = false;
  resetEnemy();
  resetPlayer(level.start, `${message} ${level.name}`);
}

function isPressed(code) {
  return keysPressed.has(code);
}

function updatePlayer(dt) {
  if (isPressed('KeyR')) {
    loadLevel(currentLevelIndex, 'Manual reset.');
    return;
  }

  if (player.won) return;

  const level = currentLevel();
  const left = keysHeld.has('ArrowLeft') || keysHeld.has('KeyA');
  const right = keysHeld.has('ArrowRight') || keysHeld.has('KeyD');

  if (left === right) {
    player.vx = 0;
  } else {
    player.vx = left ? -player.speed : player.speed;
    player.facing = left ? -1 : 1;
  }

  if (keysHeld.has('Space') && player.onGround) {
    player.vy = -player.jumpForce;
    player.onGround = false;
  }

  player.vy += world.gravity * dt;

  const prevX = player.x;
  const prevY = player.y;

  player.x += player.vx * dt;
  player.y += player.vy * dt;

  player.x = Math.max(0, Math.min(world.width - player.w, player.x));
  player.onGround = false;

  for (const p of level.platforms) {
    if (!overlap(player, p)) continue;

    const cameFromAbove = prevY + player.h <= p.y;
    const cameFromBelow = prevY >= p.y + p.h;

    if (cameFromAbove) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.onGround = true;
    } else if (cameFromBelow) {
      player.y = p.y + p.h;
      player.vy = Math.max(0, player.vy);
    } else {
      player.x = prevX;
    }
  }

  for (const s of level.spikes) {
    if (overlap(player, s)) {
      restartLevel('Hit spikes!');
      return;
    }
  }

  if (enemy && overlap(player, enemy)) {
    restartLevel('Enemy got you!');
    return;
  }

  if (player.y > world.height + 80) {
    restartLevel('You fell!');
    return;
  }

  if (level.lever) {
    const leverZone = {
      x: level.lever.x - level.lever.promptRange,
      y: level.lever.y - 20,
      w: level.lever.w + level.lever.promptRange * 2,
      h: level.lever.h + 40,
    };

    if (overlap(player, leverZone) && !level.lever.pulled && isPressed('KeyE')) {
      level.lever.pulled = true;
      level.gate.locked = false;
      setStatus('Joystick pulled! Gate unlocked.');
    }
  }

  if (overlap(player, level.gate)) {
    if (level.gate.locked) {
      setStatus('Gate locked. Pull the joystick lever with E.');
      player.x = prevX;
      return;
    }

    if (level.gate.type === 'next') {
      loadLevel(currentLevelIndex + 1, 'Level complete! Welcome to Level 2. Pull the lever to unlock the gate.');
      return;
    }

    if (level.gate.type === 'finish') {
      player.won = true;
      setStatus('You cleared both levels! Press R to replay from this level.');
    }
  }
}

function updateEnemy(dt) {
  if (!enemy || player.won) return;

  const playerCenterX = player.x + player.w / 2;
  const enemyCenterX = enemy.x + enemy.w / 2;
  const dist = Math.abs(playerCenterX - enemyCenterX);

  if (enemy.state === 'patrol' && dist < enemy.detectionRange) {
    enemy.state = 'alert';
  } else if (enemy.state === 'alert' && dist > enemy.resetRange) {
    enemy.state = 'reset';
  } else if (enemy.state === 'reset' && Math.abs(enemy.x - enemy.patrolMinX) < 4) {
    enemy.state = 'patrol';
    enemy.direction = 1;
  }

  if (enemy.state === 'patrol') {
    enemy.vx = enemy.speed * enemy.direction;
    enemy.x += enemy.vx * dt;

    if (enemy.x <= enemy.patrolMinX) {
      enemy.x = enemy.patrolMinX;
      enemy.direction = 1;
    } else if (enemy.x + enemy.w >= enemy.patrolMaxX) {
      enemy.x = enemy.patrolMaxX - enemy.w;
      enemy.direction = -1;
    }
  } else if (enemy.state === 'alert') {
    enemy.vx = playerCenterX < enemyCenterX ? -enemy.speed * 1.55 : enemy.speed * 1.55;
    enemy.x += enemy.vx * dt;
    enemy.x = Math.max(enemy.patrolMinX, Math.min(enemy.patrolMaxX - enemy.w, enemy.x));
  } else if (enemy.state === 'reset') {
    enemy.vx = -enemy.speed;
    enemy.x += enemy.vx * dt;
    if (enemy.x < enemy.patrolMinX) enemy.x = enemy.patrolMinX;
  }
}

function drawPlatforms(platforms) {
  for (const p of platforms) {
    ctx.fillStyle = material.platformPattern || '#8a96b3';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = '#b8c2dc';
    ctx.fillRect(p.x, p.y, p.w, 6);
  }
}

function drawSpikes(spikes) {
  for (const s of spikes) {
    ctx.fillStyle = '#d94a4a';
    const triangleCount = Math.max(3, Math.floor(s.w / 12));
    const triangleW = s.w / triangleCount;
    for (let i = 0; i < triangleCount; i++) {
      const x = s.x + i * triangleW;
      ctx.beginPath();
      ctx.moveTo(x, s.y + s.h);
      ctx.lineTo(x + triangleW / 2, s.y);
      ctx.lineTo(x + triangleW, s.y + s.h);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawGate(gate) {
  const gateGradient = ctx.createLinearGradient(gate.x, gate.y, gate.x, gate.y + gate.h);
  gateGradient.addColorStop(0, gate.locked ? '#8a765a' : '#65df95');
  gateGradient.addColorStop(1, gate.locked ? '#5b4f40' : '#2e9d62');
  ctx.fillStyle = gateGradient;
  ctx.fillRect(gate.x, gate.y, gate.w, gate.h);
  ctx.fillStyle = '#2f2f2f';
  ctx.fillRect(gate.x + 5, gate.y + 8, gate.w - 10, gate.h - 16);

  if (gate.locked) {
    ctx.fillStyle = '#f2cf5b';
    ctx.fillRect(gate.x + 10, gate.y + 20, 10, 12);
    ctx.strokeStyle = '#f2cf5b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(gate.x + 15, gate.y + 20, 5, Math.PI, 2 * Math.PI);
    ctx.stroke();
  }
}

function drawLever(lever) {
  if (!lever) return;
  ctx.fillStyle = '#6a7288';
  ctx.fillRect(lever.x + 7, lever.y + 12, 4, 28);
  const leverGradient = ctx.createLinearGradient(lever.x, lever.y, lever.x, lever.y + lever.h);
  leverGradient.addColorStop(0, '#c5d2ff');
  leverGradient.addColorStop(1, '#7f8fb7');
  ctx.fillStyle = leverGradient;

  ctx.save();
  ctx.translate(lever.x + 9, lever.y + 14);
  ctx.rotate(lever.pulled ? 0.65 : -0.65);
  ctx.fillRect(-2, -18, 4, 20);
  ctx.beginPath();
  ctx.arc(0, -18, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPlayer() {
  const bob = Math.sin(performance.now() / 100) * 1.1;
  const px = player.x;
  const py = player.y + bob;
  const armor = ctx.createLinearGradient(px, py, px, py + player.h);
  armor.addColorStop(0, '#83ecff');
  armor.addColorStop(1, '#2d87bf');

  // body
  ctx.fillStyle = armor;
  ctx.fillRect(px, py + 10, player.w, player.h - 10);
  // head
  ctx.fillStyle = '#d8fbff';
  ctx.fillRect(px + 4, py, player.w - 8, 14);
  // visor/eyes
  ctx.fillStyle = '#10344a';
  const eyeX = player.facing > 0 ? px + player.w - 14 : px + 6;
  ctx.fillRect(eyeX, py + 4, 8, 4);
  // scarf accent
  ctx.fillStyle = '#ff8a5b';
  ctx.fillRect(px + (player.facing > 0 ? 2 : player.w - 8), py + 16, 6, 8);
  // outline
  ctx.strokeStyle = '#0f1b2a';
  ctx.lineWidth = 2;
  ctx.strokeRect(px, py, player.w, player.h);
}

function drawEnemy() {
  if (!enemy) return;

  const colors = {
    patrol: '#f2bd43',
    alert: '#ff6b6b',
    reset: '#89b6ff',
  };

  // slime body
  const pulse = 1 + Math.sin(performance.now() / 180) * 0.05;
  const gradient = ctx.createRadialGradient(
    enemy.x + enemy.w / 2,
    enemy.y + enemy.h / 2,
    4,
    enemy.x + enemy.w / 2,
    enemy.y + enemy.h / 2,
    enemy.w / 2
  );
  gradient.addColorStop(0, '#fff8');
  gradient.addColorStop(1, colors[enemy.state]);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2 + 2, (enemy.w / 2) * pulse, (enemy.h / 2) * pulse, 0, 0, Math.PI * 2);
  ctx.fill();

  // eyes
  ctx.fillStyle = '#1b1f2e';
  ctx.beginPath();
  ctx.arc(enemy.x + 12, enemy.y + 14, 3, 0, Math.PI * 2);
  ctx.arc(enemy.x + enemy.w - 12, enemy.y + 14, 3, 0, Math.PI * 2);
  ctx.fill();

  // alert spikes
  if (enemy.state === 'alert') {
    ctx.fillStyle = '#ffd2d2';
    ctx.fillRect(enemy.x + 5, enemy.y - 4, 4, 6);
    ctx.fillRect(enemy.x + enemy.w - 9, enemy.y - 4, 4, 6);
  }
}

function drawUI(level) {
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px sans-serif';
  ctx.fillText(level.name, 16, 24);
  ctx.fillText(`Enemy state: ${enemy.state.toUpperCase()}`, 16, 46);
  ctx.fillText('Controls: A/D or ←/→ move, Space jump, E interact, R reset', 16, 68);

  if (level.lever && !level.lever.pulled) {
    const nearLever = Math.abs((player.x + player.w / 2) - (level.lever.x + level.lever.w / 2)) < level.lever.promptRange;
    if (nearLever) {
      ctx.fillStyle = '#ffe790';
      ctx.fillText('Press E to pull joystick', level.lever.x - 38, level.lever.y - 10);
    }
  }
}

function draw() {
  const level = currentLevel();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#20263a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#1a1f30';
  for (let i = 0; i < 12; i++) {
    ctx.fillRect(i * 90, 0, 45, canvas.height);
  }

  drawPlatforms(level.platforms);
  drawSpikes(level.spikes);
  drawLever(level.lever);
  drawGate(level.gate);
  drawEnemy();
  drawPlayer();
  drawUI(level);
}

let lastTime = performance.now();
function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 1 / 30);
  lastTime = now;

  updatePlayer(dt);
  updateEnemy(dt);
  draw();

  keysPressed.clear();
  requestAnimationFrame(loop);
}

buildMaterials();
loadLevel(0, 'Level 1 started. Pull the joystick to open the first gate.');
requestAnimationFrame(loop);
