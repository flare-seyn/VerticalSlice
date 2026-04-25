const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const world = {
  gravity: 1800,
  width: canvas.width,
  height: canvas.height,
  floorY: 500,
};

const keys = new Set();
window.addEventListener('keydown', (e) => {
  const code = e.code;
  if (["ArrowLeft", "ArrowRight", "Space", "KeyA", "KeyD", "KeyR"].includes(code)) {
    e.preventDefault();
  }
  keys.add(code);
});
window.addEventListener('keyup', (e) => keys.delete(e.code));

const player = {
  x: 40,
  y: 420,
  w: 28,
  h: 40,
  vx: 0,
  vy: 0,
  speed: 270,
  jumpForce: 720,
  onGround: false,
  alive: true,
  won: false,
};

const platforms = [
  { x: 0, y: 500, w: 240, h: 40 },
  { x: 320, y: 500, w: 180, h: 40 },
  { x: 550, y: 440, w: 160, h: 20 },
  { x: 760, y: 380, w: 120, h: 20 },
  { x: 900, y: 320, w: 60, h: 20 },
];

const spikes = [
  { x: 250, y: 500, w: 65, h: 40 },
];

const exitDoor = { x: 915, y: 265, w: 30, h: 55 };

const enemy = {
  x: 575,
  y: 400,
  w: 28,
  h: 40,
  vx: 0,
  speed: 90,
  patrolMinX: 555,
  patrolMaxX: 670,
  detectionRange: 200,
  resetRange: 280,
  state: 'patrol',
  direction: 1,
};

function setStatus(text) {
  statusEl.textContent = text;
}

function overlap(a, b) {
  return a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y;
}

function resetPlayer(message = 'You reset to start.') {
  player.x = 40;
  player.y = 420;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.alive = true;
  player.won = false;
  setStatus(message);
}

function resetEnemy() {
  enemy.x = 575;
  enemy.y = 400;
  enemy.vx = 0;
  enemy.state = 'patrol';
  enemy.direction = 1;
}

function resetLevel(message = 'Level reset. Reach the exit and avoid the enemy.') {
  resetEnemy();
  resetPlayer(message);
}

function updatePlayer(dt) {
  if (keys.has('KeyR')) {
    resetLevel();
    return;
  }

  if (!player.alive || player.won) return;

  const left = keys.has('ArrowLeft') || keys.has('KeyA');
  const right = keys.has('ArrowRight') || keys.has('KeyD');

  if (left === right) {
    player.vx = 0;
  } else {
    player.vx = left ? -player.speed : player.speed;
  }

  if ((keys.has('Space')) && player.onGround) {
    player.vy = -player.jumpForce;
    player.onGround = false;
  }

  player.vy += world.gravity * dt;

  const prevX = player.x;
  const prevY = player.y;

  player.x += player.vx * dt;
  player.y += player.vy * dt;

  // world bounds
  player.x = Math.max(0, Math.min(world.width - player.w, player.x));

  player.onGround = false;

  // vertical collisions with platforms
  for (const p of platforms) {
    if (overlap(player, p)) {
      const cameFromAbove = prevY + player.h <= p.y;
      if (cameFromAbove) {
        player.y = p.y - player.h;
        player.vy = 0;
        player.onGround = true;
      } else if (prevY >= p.y + p.h) {
        player.y = p.y + p.h;
        player.vy = Math.max(0, player.vy);
      } else {
        player.x = prevX;
      }
    }
  }

  // spikes fail state
  for (const s of spikes) {
    if (overlap(player, s)) {
      resetPlayer('Hit spikes! Reset to start.');
      return;
    }
  }

  // enemy contact fail state
  if (overlap(player, enemy)) {
    resetPlayer('Enemy got you! Reset to start.');
    return;
  }

  // fall fail state
  if (player.y > world.height + 80) {
    resetPlayer('You fell! Reset to start.');
    return;
  }

  // exit win condition
  if (overlap(player, exitDoor)) {
    player.won = true;
    setStatus('Success! You reached the exit. Press R to play again.');
  }
}

function updateEnemy(dt) {
  // state transitions
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

  // state behaviors
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
    enemy.vx = playerCenterX < enemyCenterX ? -enemy.speed * 1.5 : enemy.speed * 1.5;
    enemy.x += enemy.vx * dt;
    enemy.x = Math.max(enemy.patrolMinX, Math.min(enemy.patrolMaxX - enemy.w, enemy.x));
  } else if (enemy.state === 'reset') {
    enemy.vx = -enemy.speed;
    enemy.x += enemy.vx * dt;
    if (enemy.x < enemy.patrolMinX) enemy.x = enemy.patrolMinX;
  }
}

function drawRect(obj, color) {
  ctx.fillStyle = color;
  ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background stripes
  ctx.fillStyle = '#20263a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#1a1f30';
  for (let i = 0; i < 12; i++) {
    ctx.fillRect(i * 90, 0, 45, canvas.height);
  }

  for (const p of platforms) drawRect(p, '#8c9ab8');

  for (const s of spikes) {
    ctx.fillStyle = '#d94a4a';
    const triangleCount = 5;
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

  drawRect(exitDoor, '#4ac57a');

  const enemyColors = {
    patrol: '#f2bd43',
    alert: '#ff6b6b',
    reset: '#89b6ff',
  };
  drawRect(enemy, enemyColors[enemy.state]);

  drawRect(player, '#6ee7ff');

  ctx.fillStyle = '#ffffff';
  ctx.font = '16px sans-serif';
  ctx.fillText(`Enemy state: ${enemy.state.toUpperCase()}`, 16, 24);
}

let lastTime = performance.now();
function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 1 / 30);
  lastTime = now;

  updatePlayer(dt);
  updateEnemy(dt);
  draw();

  requestAnimationFrame(loop);
}

setStatus('Reach the green exit and avoid the enemy.');
requestAnimationFrame(loop);
