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
  if (["ArrowLeft", "ArrowRight", "Space", "KeyA", "KeyD", "KeyR", "KeyE", "ShiftLeft", "ShiftRight"].includes(code)) {
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
  dashCharge: 1,
  dashCooldown: 0,
  dashTimer: 0,
  coyoteTimer: 0,
  jumpBufferTimer: 0,
  animTime: 0,
  animationState: 'idle',
  graphPulseTimer: 0,
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
    spikes: [{ x: 258, y: 500, w: 40, h: 40 }],
    movingPlatforms: [
      { x: 470, y: 420, w: 90, h: 16, axis: 'x', origin: 470, range: 70, speed: 1.2, phase: 0.2 },
    ],
    bouncePads: [{ x: 860, y: 302, w: 38, h: 18, force: 900 }],
    crumblePlatforms: [],
    relics: [
      { x: 355, y: 470, w: 14, h: 14, collected: false },
      { x: 780, y: 350, w: 14, h: 14, collected: false },
    ],
    lever: { x: 185, y: 460, w: 18, h: 40, pulled: false, promptRange: 80 },
    gate: { x: 915, y: 265, w: 30, h: 55, type: 'next', locked: true, initialLocked: true },
    enemies: [
      {
        spawnX: 575,
        y: 400,
        w: 34,
        h: 34,
        speed: 68,
        patrolMinX: 555,
        patrolMaxX: 690,
        detectionRange: 120,
        resetRange: 200,
      },
    ],
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
    movingPlatforms: [
      { x: 510, y: 360, w: 86, h: 16, axis: 'x', origin: 510, range: 90, speed: 1.6, phase: 0.6 },
    ],
    bouncePads: [{ x: 715, y: 442, w: 38, h: 18, force: 980 }],
    crumblePlatforms: [
      { x: 570, y: 330, w: 74, h: 16, state: 'solid', timer: 0 },
    ],
    relics: [
      { x: 505, y: 386, w: 14, h: 14, collected: false },
      { x: 736, y: 432, w: 14, h: 14, collected: false },
      { x: 838, y: 472, w: 14, h: 14, collected: false },
    ],
    lever: { x: 340, y: 410, w: 18, h: 40, pulled: false, promptRange: 66 },
    gate: { x: 900, y: 445, w: 30, h: 55, type: 'finish', locked: true, initialLocked: true },
    enemies: [
      {
        spawnX: 640,
        y: 426,
        w: 34,
        h: 34,
        speed: 70,
        patrolMinX: 610,
        patrolMaxX: 730,
        detectionRange: 100,
        resetRange: 170,
      },
      {
        spawnX: 770,
        y: 426,
        w: 34,
        h: 34,
        speed: 76,
        patrolMinX: 730,
        patrolMaxX: 845,
        detectionRange: 120,
        resetRange: 190,
      },
    ],
  },
];

let currentLevelIndex = 0;
let enemies = [];

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
  const levelEnemies = currentLevel().enemies || [];
  enemies = levelEnemies.map((levelEnemy) => ({
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
    defeated: false,
    animTime: 0,
    lastState: 'patrol',
  }));
}

function resetPlayer(position, message) {
  player.x = position.x;
  player.y = position.y;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.won = false;
  player.dashTimer = 0;
  player.dashCooldown = 0;
  player.dashCharge = 1;
  player.animTime = 0;
  player.animationState = 'idle';
  player.graphPulseTimer = 0;
  setStatus(message);
}

function loadLevel(index, message) {
  currentLevelIndex = index;
  const level = currentLevel();
  level.gate.locked = level.gate.initialLocked;
  if (level.lever) level.lever.pulled = false;
  if (level.relics) level.relics.forEach((r) => { r.collected = false; });
  if (level.crumblePlatforms) {
    level.crumblePlatforms.forEach((p) => {
      p.state = 'solid';
      p.timer = 0;
    });
  }
  resetEnemy();
  resetPlayer(level.start, message || `${level.name}. Reach the gate.`);
}

function restartLevel(message = 'Level reset.') {
  const level = currentLevel();
  level.gate.locked = level.gate.initialLocked;
  if (level.lever) level.lever.pulled = false;
  if (level.relics) level.relics.forEach((r) => { r.collected = false; });
  if (level.crumblePlatforms) {
    level.crumblePlatforms.forEach((p) => {
      p.state = 'solid';
      p.timer = 0;
    });
  }
  resetEnemy();
  resetPlayer(level.start, `${message} ${level.name}`);
}

function isPressed(code) {
  return keysPressed.has(code);
}

function updateDynamicFeatures(level, dt, nowMs) {
  if (level.movingPlatforms) {
    for (const mp of level.movingPlatforms) {
      const offset = Math.sin(nowMs / 1000 * mp.speed + mp.phase) * mp.range;
      if (mp.axis === 'x') mp.x = mp.origin + offset;
    }
  }

  if (level.crumblePlatforms) {
    for (const cp of level.crumblePlatforms) {
      if (cp.state === 'breaking') {
        cp.timer -= dt;
        if (cp.timer <= 0) {
          cp.state = 'gone';
          cp.timer = 2.2;
        }
      } else if (cp.state === 'gone') {
        cp.timer -= dt;
        if (cp.timer <= 0) {
          cp.state = 'solid';
          cp.timer = 0;
        }
      }
    }
  }
}

function updatePlayerAdvancedMovement(dt) {
  player.animTime += dt;
  if (player.graphPulseTimer > 0) player.graphPulseTimer -= dt;
  if (player.dashCooldown > 0) player.dashCooldown -= dt;
  if (player.dashTimer > 0) player.dashTimer -= dt;

  if (player.onGround) {
    player.coyoteTimer = 0.1;
    player.dashCharge = 1;
  } else {
    player.coyoteTimer = Math.max(0, player.coyoteTimer - dt);
  }

  if (isPressed('Space')) {
    player.jumpBufferTimer = 0.12;
  } else {
    player.jumpBufferTimer = Math.max(0, player.jumpBufferTimer - dt);
  }
}

function getSolidPlatforms(level) {
  const staticPlatforms = level.platforms || [];
  const movingPlatforms = level.movingPlatforms || [];
  const crumblePlatforms = (level.crumblePlatforms || []).filter((p) => p.state !== 'gone');
  return [...staticPlatforms, ...movingPlatforms, ...crumblePlatforms];
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
  const dash = isPressed('ShiftLeft') || isPressed('ShiftRight');

  if (left === right) {
    player.vx = 0;
  } else {
    player.vx = left ? -player.speed : player.speed;
    player.facing = left ? -1 : 1;
  }

  updatePlayerAdvancedMovement(dt);

  if (player.jumpBufferTimer > 0 && (player.onGround || player.coyoteTimer > 0)) {
    player.vy = -player.jumpForce;
    player.onGround = false;
    player.coyoteTimer = 0;
    player.jumpBufferTimer = 0;
  }

  player.animationState = player.onGround
    ? (Math.abs(player.vx) > 10 ? 'run' : 'idle')
    : (player.vy < 0 ? 'jump' : 'fall');

  if (dash && player.onGround && player.dashCharge > 0 && player.dashCooldown <= 0) {
    const dashDir = left ? -1 : (right ? 1 : player.facing);
    player.vx = dashDir * 420;
    player.vy = Math.min(player.vy, 40);
    player.dashTimer = 0.08;
    player.dashCooldown = 0.65;
    player.dashCharge -= 1;
    player.animationState = 'dash';
    player.graphPulseTimer = 0.35;
    setStatus('Dash!');
  }

  const gravityScale = player.dashTimer > 0 ? 0.75 : 1;
  player.vy += world.gravity * gravityScale * dt;

  const prevX = player.x;
  const prevY = player.y;

  player.x += player.vx * dt;
  player.y += player.vy * dt;

  player.x = Math.max(0, Math.min(world.width - player.w, player.x));
  player.onGround = false;

  for (const p of getSolidPlatforms(level)) {
    if (!overlap(player, p)) continue;

    const cameFromAbove = prevY + player.h <= p.y;
    const cameFromBelow = prevY >= p.y + p.h;

    if (cameFromAbove) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.onGround = true;
      if (level.crumblePlatforms && level.crumblePlatforms.includes(p) && p.state === 'solid') {
        p.state = 'breaking';
        p.timer = 0.45;
      }
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

  for (const enemy of enemies) {
    if (enemy.defeated) continue;
    if (!overlap(player, enemy)) continue;
    const stomped = player.vy > 130 && (player.y + player.h - enemy.y) < 16;
    if (stomped) {
      enemy.defeated = true;
      player.vy = -380;
      setStatus('Enemy incapacitated!');
      continue;
    }
    restartLevel('Enemy got you!');
    return;
  }

  if (level.bouncePads) {
    for (const pad of level.bouncePads) {
      if (overlap(player, pad) && player.vy >= -120) {
        player.vy = -pad.force;
        player.onGround = false;
      }
    }
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
      const totalRelics = level.relics ? level.relics.length : 0;
      const collectedRelics = level.relics ? level.relics.filter((r) => r.collected).length : 0;
      if (collectedRelics < totalRelics) {
        setStatus(`Need more relics (${collectedRelics}/${totalRelics}) before pulling joystick.`);
      } else {
        level.lever.pulled = true;
        level.gate.locked = false;
        player.graphPulseTimer = 0.7;
        setStatus('Joystick pulled! Gate unlocked. Visual graph fired GateUnlock.');
      }
    }
  }

  if (level.relics) {
    for (const relic of level.relics) {
      if (!relic.collected && overlap(player, relic)) {
        relic.collected = true;
        player.graphPulseTimer = 0.25;
        const total = level.relics.length;
        const got = level.relics.filter((r) => r.collected).length;
        setStatus(`Relic collected (${got}/${total}).`);
      }
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
  if (!enemies.length || player.won) return;

  const playerCenterX = player.x + player.w / 2;
  for (const enemy of enemies) {
    if (enemy.defeated) continue;
    enemy.animTime += dt;
    const enemyCenterX = enemy.x + enemy.w / 2;
    const dist = Math.abs(playerCenterX - enemyCenterX);

    if (enemy.state === 'patrol' && dist < enemy.detectionRange) {
      enemy.state = 'alert';
      enemy.lastState = 'patrol';
    } else if (enemy.state === 'alert' && dist > enemy.resetRange) {
      enemy.state = 'reset';
      enemy.lastState = 'alert';
    } else if (enemy.state === 'reset' && Math.abs(enemy.x - enemy.patrolMinX) < 4) {
      enemy.state = 'patrol';
      enemy.lastState = 'reset';
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
      enemy.vx = playerCenterX < enemyCenterX ? -enemy.speed * 1.35 : enemy.speed * 1.35;
      enemy.x += enemy.vx * dt;
      enemy.x = Math.max(enemy.patrolMinX, Math.min(enemy.patrolMaxX - enemy.w, enemy.x));
    } else if (enemy.state === 'reset') {
      enemy.vx = -enemy.speed;
      enemy.x += enemy.vx * dt;
      if (enemy.x < enemy.patrolMinX) enemy.x = enemy.patrolMinX;
    }
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

function drawBouncePads(bouncePads) {
  for (const pad of bouncePads || []) {
    const grad = ctx.createLinearGradient(pad.x, pad.y, pad.x, pad.y + pad.h);
    grad.addColorStop(0, '#9cff93');
    grad.addColorStop(1, '#2fba67');
    ctx.fillStyle = grad;
    ctx.fillRect(pad.x, pad.y, pad.w, pad.h);
    ctx.fillStyle = '#173d2a';
    ctx.fillRect(pad.x + 3, pad.y + 3, pad.w - 6, 4);
  }
}

function drawRelics(relics) {
  for (const relic of relics || []) {
    if (relic.collected) continue;
    const pulse = 1 + Math.sin(performance.now() / 140) * 0.08;
    const size = relic.w * pulse;
    const ox = relic.x + relic.w / 2 - size / 2;
    const oy = relic.y + relic.h / 2 - size / 2;
    ctx.fillStyle = '#ffd66b';
    ctx.fillRect(ox, oy, size, size);
    ctx.fillStyle = '#fff3c8';
    ctx.fillRect(ox + 3, oy + 3, size - 6, size - 6);
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
  const time = performance.now() / 1000;
  const state = player.dashTimer > 0 ? 'dash' : player.animationState;
  const isRunning = state === 'run';
  const bob = Math.sin(time * (isRunning ? 13 : 4)) * (isRunning ? 2.2 : 0.8);
  const px = player.x;
  const py = player.y + bob;
  const cx = px + player.w / 2;
  const facing = player.facing;
  const runCycle = Math.sin(time * 14) * (isRunning ? 1 : 0.18);
  const armSwing = runCycle * 5;
  const legSwing = runCycle * 5;
  const squash = state === 'fall' ? 1.05 : (state === 'jump' ? 0.96 : 1);

  ctx.save();
  ctx.translate(cx, py + player.h / 2);
  ctx.scale(facing, squash);
  ctx.translate(-player.w / 2, -player.h / 2);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(player.w / 2, player.h + 4, 18, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  if (state === 'dash') {
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = `rgba(130, 245, 255, ${0.24 - i * 0.045})`;
      ctx.fillRect(-12 - i * 9, 9 + i, player.w - i * 2, player.h - 13 - i * 2);
    }
  }

  // scarf and backpack sell the character as a more complex model.
  ctx.strokeStyle = '#ff8a5b';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(7, 17);
  ctx.quadraticCurveTo(-8, 15 + Math.sin(time * 8) * 3, -18, 24 + Math.cos(time * 5) * 4);
  ctx.stroke();
  ctx.fillStyle = '#24455f';
  ctx.fillRect(2, 16, 7, 18);
  ctx.fillStyle = '#75e7ff';
  ctx.fillRect(4, 19, 3, 9);

  // legs with independent feet.
  ctx.fillStyle = '#1e5f85';
  ctx.fillRect(8, 30 + legSwing * 0.25, 6, 11);
  ctx.fillRect(18, 30 - legSwing * 0.25, 6, 11);
  ctx.fillStyle = '#143b55';
  ctx.fillRect(6 + Math.max(0, -legSwing) * 0.2, 39, 10, 4);
  ctx.fillRect(17 + Math.max(0, legSwing) * 0.2, 39, 10, 4);

  // arms sit behind and in front of the torso, giving depth.
  ctx.strokeStyle = '#2d87bf';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(7, 18);
  ctx.lineTo(3, 26 - armSwing);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(24, 18);
  ctx.lineTo(28, 26 + armSwing);
  ctx.stroke();
  ctx.fillStyle = '#d8fbff';
  ctx.beginPath();
  ctx.arc(3, 27 - armSwing, 2.8, 0, Math.PI * 2);
  ctx.arc(28, 27 + armSwing, 2.8, 0, Math.PI * 2);
  ctx.fill();

  const armor = ctx.createLinearGradient(0, 8, 0, player.h);
  armor.addColorStop(0, '#9af3ff');
  armor.addColorStop(0.55, '#2d87bf');
  armor.addColorStop(1, '#1b5f91');
  ctx.fillStyle = armor;
  ctx.fillRect(5, 12, player.w - 10, 23);
  ctx.fillStyle = '#d8fbff';
  ctx.fillRect(7, 1, player.w - 14, 15);
  ctx.fillStyle = '#c4f7ff';
  ctx.fillRect(10, -2, player.w - 20, 5);
  ctx.fillStyle = '#10344a';
  ctx.fillRect(15, 5, 11, 5);
  ctx.fillStyle = '#ffffffaa';
  ctx.fillRect(17, 6, 4, 1.5);

  // chest plate, belt, shoulder pads, and boot jets add visible model complexity.
  ctx.fillStyle = '#b8f7ff';
  ctx.fillRect(10, 16, 10, 8);
  ctx.fillStyle = '#ffcf69';
  ctx.fillRect(14, 18, 3, 3);
  ctx.fillStyle = '#0f1b2a';
  ctx.fillRect(7, 27, player.w - 14, 3);
  ctx.fillStyle = '#71dfff';
  ctx.fillRect(3, 13, 7, 5);
  ctx.fillRect(player.w - 10, 13, 7, 5);

  if (!player.onGround || state === 'dash') {
    ctx.fillStyle = state === 'dash' ? '#fff3a3' : '#8ff7ff';
    ctx.beginPath();
    ctx.moveTo(9, 43);
    ctx.lineTo(12, 50 + Math.sin(time * 32) * 3);
    ctx.lineTo(15, 43);
    ctx.moveTo(19, 43);
    ctx.lineTo(22, 50 + Math.cos(time * 29) * 3);
    ctx.lineTo(25, 43);
    ctx.fill();
  }

  ctx.strokeStyle = '#0f1b2a';
  ctx.lineWidth = 2;
  ctx.strokeRect(5, 12, player.w - 10, 23);
  ctx.strokeRect(7, 1, player.w - 14, 15);
  ctx.restore();
}

function drawEnemy() {
  if (!enemies.length) return;
  for (const enemy of enemies) {
    const colors = {
      patrol: '#f2bd43',
      alert: '#ff6b6b',
      reset: '#89b6ff',
      defeated: '#6f7688',
    };
    const stateColor = enemy.defeated ? colors.defeated : colors[enemy.state];
    const time = performance.now() / 1000 + enemy.x * 0.01;
    const pulse = 1 + Math.sin(time * (enemy.state === 'alert' ? 9 : 5)) * 0.07;
    const legStride = Math.sin(time * 12) * (enemy.state === 'alert' ? 4 : 2);
    const cx = enemy.x + enemy.w / 2;
    const cy = enemy.y + enemy.h / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(cx, enemy.y + enemy.h + 4, enemy.w / 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Animated legs and feet make the patrol/chase state easier to read.
    ctx.strokeStyle = '#2d1b1b';
    ctx.lineWidth = 4;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + side * 7, enemy.y + enemy.h - 6);
      ctx.lineTo(cx + side * (8 + legStride), enemy.y + enemy.h + 5);
      ctx.stroke();
      ctx.fillStyle = '#2d1b1b';
      ctx.fillRect(cx + side * (8 + legStride) - 4, enemy.y + enemy.h + 4, 8, 3);
    }

    const gradient = ctx.createRadialGradient(cx - 5, cy - 7, 4, cx, cy, enemy.w / 2 + 8);
    gradient.addColorStop(0, '#fff8');
    gradient.addColorStop(0.55, stateColor);
    gradient.addColorStop(1, '#3b2230');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 2, (enemy.w / 2) * pulse, (enemy.h / 2 + 4) * pulse, 0, 0, Math.PI * 2);
    ctx.fill();

    // Horns/antennae, armor ring, eyes, and jaw add monster model detail.
    ctx.strokeStyle = stateColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 9, enemy.y + 7);
    ctx.quadraticCurveTo(cx - 18, enemy.y - 10, cx - 5, enemy.y - 3);
    ctx.moveTo(cx + 9, enemy.y + 7);
    ctx.quadraticCurveTo(cx + 18, enemy.y - 10, cx + 5, enemy.y - 3);
    ctx.stroke();
    ctx.strokeStyle = '#1b1f2e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy + 2, enemy.w / 2 - 2, 0.2, Math.PI * 1.8);
    ctx.stroke();

    ctx.fillStyle = enemy.state === 'alert' ? '#2d1b1b' : '#1b1f2e';
    ctx.beginPath();
    ctx.ellipse(enemy.x + 11, enemy.y + 14, enemy.state === 'alert' ? 4 : 3, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(enemy.x + enemy.w - 11, enemy.y + 14, enemy.state === 'alert' ? 4 : 3, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffffaa';
    ctx.fillRect(enemy.x + 10, enemy.y + 12, 2, 1.5);
    ctx.fillRect(enemy.x + enemy.w - 12, enemy.y + 12, 2, 1.5);

    const mouthWidth = enemy.state === 'alert' ? 16 : 10;
    const mouthY = enemy.y + enemy.h - 10 + Math.sin(time * 7) * 1.4;
    ctx.fillStyle = '#2d1b1b';
    ctx.fillRect(cx - mouthWidth / 2, mouthY, mouthWidth, 3);
    if (enemy.state === 'alert' && !enemy.defeated) {
      ctx.fillStyle = '#ffd2d2';
      ctx.fillRect(cx - 6, mouthY + 3, 3, 5);
      ctx.fillRect(cx + 3, mouthY + 3, 3, 5);
    }

    ctx.restore();
  }
}

function drawVisualGraphStatus() {
  const x = 710;
  const y = 18;
  const pulse = Math.max(0, player.graphPulseTimer);
  const alpha = 0.72 + Math.min(0.24, pulse * 0.3);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(12, 17, 29, 0.78)';
  ctx.fillRect(x, y, 232, 84);
  ctx.strokeStyle = pulse > 0 ? '#8ff7ff' : '#4e5872';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, 232, 84);
  ctx.fillStyle = '#d8fbff';
  ctx.font = '12px sans-serif';
  ctx.fillText('Visual Graph Bridge', x + 10, y + 18);

  const nodes = [
    { label: 'Collect', nx: x + 18, ny: y + 42, active: pulse > 0.2 },
    { label: 'GateUnlock', nx: x + 91, ny: y + 42, active: pulse > 0.45 },
    { label: 'FX/UI', nx: x + 178, ny: y + 42, active: pulse > 0 },
  ];
  ctx.strokeStyle = pulse > 0 ? '#8ff7ff' : '#6d7690';
  ctx.beginPath();
  ctx.moveTo(nodes[0].nx + 46, nodes[0].ny + 10);
  ctx.lineTo(nodes[1].nx - 6, nodes[1].ny + 10);
  ctx.moveTo(nodes[1].nx + 70, nodes[1].ny + 10);
  ctx.lineTo(nodes[2].nx - 6, nodes[2].ny + 10);
  ctx.stroke();
  for (const node of nodes) {
    ctx.fillStyle = node.active ? '#173d4f' : '#252d43';
    ctx.fillRect(node.nx, node.ny, node.label === 'GateUnlock' ? 70 : 50, 22);
    ctx.strokeStyle = node.active ? '#8ff7ff' : '#58637d';
    ctx.strokeRect(node.nx, node.ny, node.label === 'GateUnlock' ? 70 : 50, 22);
    ctx.fillStyle = node.active ? '#ffffff' : '#c4cbda';
    ctx.fillText(node.label, node.nx + 5, node.ny + 15);
  }
  ctx.restore();
}

function drawUI(level) {
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px sans-serif';
  ctx.fillText(level.name, 16, 24);
  const activeEnemies = enemies.filter((e) => !e.defeated).length;
  const firstActive = enemies.find((e) => !e.defeated);
  const enemyStateText = firstActive ? firstActive.state.toUpperCase() : 'DEFEATED';
  ctx.fillText(`Enemy state: ${enemyStateText} | Active: ${activeEnemies}`, 16, 46);
  const totalRelics = (level.relics || []).length;
  const collectedRelics = (level.relics || []).filter((r) => r.collected).length;
  ctx.fillText(`Relics: ${collectedRelics}/${totalRelics}`, 16, 68);
  ctx.fillText(`Dash: ${player.dashCharge > 0 ? 'READY (Shift)' : 'RECHARGING'}`, 16, 90);
  ctx.fillText('Controls: A/D or ←/→ move, Space jump (buffered), Shift ground dash, E interact, R reset', 16, 112);

  if (level.lever && !level.lever.pulled) {
    const nearLever = Math.abs((player.x + player.w / 2) - (level.lever.x + level.lever.w / 2)) < level.lever.promptRange;
    if (nearLever) {
      ctx.fillStyle = '#ffe790';
      ctx.fillText('Press E to pull joystick (all relics required)', level.lever.x - 84, level.lever.y - 10);
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

  drawPlatforms(getSolidPlatforms(level));
  drawSpikes(level.spikes);
  drawBouncePads(level.bouncePads);
  drawRelics(level.relics);
  drawLever(level.lever);
  drawGate(level.gate);
  drawEnemy();
  drawPlayer();
  drawUI(level);
  drawVisualGraphStatus();
}

let lastTime = performance.now();
function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 1 / 30);
  lastTime = now;

  updateDynamicFeatures(currentLevel(), dt, now);
  updatePlayer(dt);
  updateEnemy(dt);
  draw();

  keysPressed.clear();
  requestAnimationFrame(loop);
}

buildMaterials();
loadLevel(0, 'Level 1 started. Pull the joystick to open the first gate.');
requestAnimationFrame(loop);
