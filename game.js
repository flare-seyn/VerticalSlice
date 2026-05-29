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
  wallPattern: null,
  trimPattern: null,
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

  const wall = document.createElement('canvas');
  wall.width = 32;
  wall.height = 32;
  const wctx = wall.getContext('2d');
  wctx.fillStyle = '#182033';
  wctx.fillRect(0, 0, wall.width, wall.height);
  wctx.fillStyle = '#202a44';
  wctx.fillRect(1, 1, 30, 30);
  wctx.strokeStyle = 'rgba(143, 247, 255, 0.08)';
  wctx.strokeRect(6, 6, 20, 20);
  material.wallPattern = ctx.createPattern(wall, 'repeat');

  const trim = document.createElement('canvas');
  trim.width = 16;
  trim.height = 16;
  const rctx = trim.getContext('2d');
  rctx.fillStyle = '#293554';
  rctx.fillRect(0, 0, trim.width, trim.height);
  rctx.fillStyle = '#8ff7ff';
  rctx.globalAlpha = 0.22;
  rctx.fillRect(0, 0, 16, 3);
  rctx.fillRect(0, 13, 16, 3);
  material.trimPattern = ctx.createPattern(trim, 'repeat');
}


let audioContext = null;
const particles = [];
let bgmNextNoteTime = 0;
let bgmStep = 0;

function initAudio() {
  if (audioContext) return;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return;
  audioContext = new AudioCtor();
  if (audioContext.state === 'suspended') audioContext.resume();
}

function playSound(type) {
  if (!audioContext) return;
  const soundMap = {
    jump: { frequency: 420, end: 660, duration: 0.09, gain: 0.035, wave: 'triangle' },
    dash: { frequency: 180, end: 80, duration: 0.12, gain: 0.045, wave: 'sawtooth' },
    collect: { frequency: 640, end: 980, duration: 0.16, gain: 0.035, wave: 'sine' },
    unlock: { frequency: 360, end: 760, duration: 0.22, gain: 0.05, wave: 'triangle' },
    bounce: { frequency: 260, end: 520, duration: 0.13, gain: 0.04, wave: 'square' },
    hazard: { frequency: 170, end: 70, duration: 0.18, gain: 0.05, wave: 'sawtooth' },
    alert: { frequency: 520, end: 300, duration: 0.11, gain: 0.025, wave: 'square' },
  };
  const config = soundMap[type];
  if (!config) return;
  const now = audioContext.currentTime;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = config.wave;
  osc.frequency.setValueAtTime(config.frequency, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, config.end), now + config.duration);
  gain.gain.setValueAtTime(config.gain, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + config.duration);
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.start(now);
  osc.stop(now + config.duration);
}

function updateBgm() {
  if (!audioContext || player.won) return;
  const now = audioContext.currentTime;
  if (bgmNextNoteTime === 0) bgmNextNoteTime = now + 0.04;
  const notes = [220, 277.18, 329.63, 392.0, 329.63, 277.18];
  while (bgmNextNoteTime < now + 0.12) {
    const freq = notes[bgmStep % notes.length];
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, bgmNextNoteTime);
    gain.gain.setValueAtTime(0.0001, bgmNextNoteTime);
    gain.gain.linearRampToValueAtTime(0.012, bgmNextNoteTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, bgmNextNoteTime + 0.28);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start(bgmNextNoteTime);
    osc.stop(bgmNextNoteTime + 0.3);
    bgmNextNoteTime += 0.3;
    bgmStep += 1;
  }
}

function spawnParticles(x, y, count, color, options = {}) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.7;
    const speed = (options.speed || 80) * (0.45 + Math.random());
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed + (options.vx || 0),
      vy: Math.sin(angle) * speed + (options.vy || 0),
      life: options.life || 0.45,
      maxLife: options.life || 0.45,
      size: options.size || 4,
      color,
    });
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 220 * dt;
    if (particle.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  for (const particle of particles) {
    const alpha = Math.max(0, particle.life / particle.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, particle.size * alpha, particle.size * alpha);
  }
  ctx.globalAlpha = 1;
}

const keysHeld = new Set();
const keysPressed = new Set();
window.addEventListener('keydown', (e) => {
  const code = e.code;
  if (["ArrowLeft", "ArrowRight", "Space", "KeyA", "KeyD", "KeyR", "KeyE", "ShiftLeft", "ShiftRight"].includes(code)) {
    e.preventDefault();
    initAudio();
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
  hearts: 3,
  maxHearts: 3,
  invulnerableTimer: 0,
};


const EnemyStates = Object.freeze({
  Patrol: 'patrol',
  Alert: 'alert',
  Reset: 'reset',
});

const EnemyStateDescriptions = Object.freeze({
  [EnemyStates.Patrol]: 'Move between patrol bounds until the player enters detection range.',
  [EnemyStates.Alert]: 'Chase toward the player at increased speed while the player stays nearby.',
  [EnemyStates.Reset]: 'Return to the patrol start after the player escapes reset range.',
});

const levels = [
  {
    name: 'Level 1: Entry Hall',
    start: { x: 40, y: 420 },
    decorTiles: [
      { x: 0, y: 0, w: 960, h: 96, type: 'wall' },
      { x: 64, y: 132, w: 160, h: 32, type: 'trim' },
      { x: 382, y: 108, w: 128, h: 32, type: 'trim' },
      { x: 668, y: 130, w: 192, h: 32, type: 'wall' },
      { x: 120, y: 448, w: 64, h: 32, type: 'crystal' },
      { x: 590, y: 392, w: 64, h: 32, type: 'crystal' },
    ],
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
    decorTiles: [
      { x: 0, y: 0, w: 960, h: 112, type: 'wall' },
      { x: 32, y: 146, w: 128, h: 32, type: 'trim' },
      { x: 332, y: 118, w: 224, h: 32, type: 'wall' },
      { x: 690, y: 140, w: 192, h: 32, type: 'trim' },
      { x: 292, y: 402, w: 96, h: 32, type: 'crystal' },
      { x: 742, y: 412, w: 80, h: 32, type: 'crystal' },
    ],
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
    dashOrbs: [{ x: 544, y: 320, r: 10, active: true, timer: 0 }],
    crumblePlatforms: [
      { x: 570, y: 330, w: 74, h: 16, state: 'solid', timer: 0 },
    ],
    relics: [
      { x: 505, y: 386, w: 14, h: 14, collected: false },
      { x: 736, y: 432, w: 14, h: 14, collected: false },
      { x: 838, y: 472, w: 14, h: 14, collected: false },
    ],
    lever: { x: 340, y: 410, w: 18, h: 40, pulled: false, promptRange: 66 },
    gate: { x: 900, y: 445, w: 30, h: 55, type: 'next', locked: true, initialLocked: true },
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

  {
    name: 'Level 3: Split Route Atrium',
    start: { x: 32, y: 430 },
    decorTiles: [
      { x: 0, y: 0, w: 960, h: 104, type: 'wall' },
      { x: 110, y: 130, w: 160, h: 32, type: 'trim' },
      { x: 420, y: 124, w: 180, h: 32, type: 'wall' },
      { x: 710, y: 126, w: 180, h: 32, type: 'trim' },
      { x: 450, y: 452, w: 90, h: 32, type: 'crystal' },
      { x: 760, y: 372, w: 96, h: 32, type: 'crystal' },
    ],
    platforms: [
      { x: 0, y: 500, w: 180, h: 40 },
      { x: 240, y: 470, w: 140, h: 20 },
      { x: 440, y: 430, w: 120, h: 20 },
      { x: 650, y: 390, w: 120, h: 20 },
      { x: 830, y: 500, w: 130, h: 40 },
      { x: 130, y: 345, w: 130, h: 20 },
      { x: 340, y: 305, w: 120, h: 20 },
    ],
    spikes: [
      { x: 190, y: 500, w: 42, h: 40 },
      { x: 575, y: 500, w: 48, h: 40 },
      { x: 780, y: 500, w: 42, h: 40 },
    ],
    movingPlatforms: [
      { x: 520, y: 330, w: 84, h: 16, axis: 'y', origin: 330, range: 52, speed: 1.5, phase: 0.1 },
      { x: 690, y: 455, w: 90, h: 16, axis: 'x', origin: 690, range: 65, speed: 1.4, phase: 1.1 },
    ],
    bouncePads: [{ x: 148, y: 327, w: 38, h: 18, force: 930 }],
    dashOrbs: [
      { x: 395, y: 280, r: 10, active: true, timer: 0 },
      { x: 708, y: 360, r: 10, active: true, timer: 0 },
    ],
    crumblePlatforms: [
      { x: 275, y: 385, w: 76, h: 16, state: 'solid', timer: 0 },
      { x: 590, y: 350, w: 78, h: 16, state: 'solid', timer: 0 },
    ],
    relics: [
      { x: 150, y: 315, w: 14, h: 14, collected: false },
      { x: 365, y: 278, w: 14, h: 14, collected: false },
      { x: 688, y: 362, w: 14, h: 14, collected: false },
    ],
    lever: { x: 848, y: 460, w: 18, h: 40, pulled: false, promptRange: 72 },
    gate: { x: 912, y: 445, w: 30, h: 55, type: 'next', locked: true, initialLocked: true },
    enemies: [
      {
        spawnX: 452,
        y: 396,
        w: 34,
        h: 34,
        speed: 78,
        patrolMinX: 430,
        patrolMaxX: 558,
        detectionRange: 115,
        resetRange: 190,
      },
      {
        spawnX: 672,
        y: 356,
        w: 34,
        h: 34,
        speed: 80,
        patrolMinX: 650,
        patrolMaxX: 770,
        detectionRange: 120,
        resetRange: 195,
      },
    ],
  },
  {
    name: 'Level 4: Exit Gauntlet',
    start: { x: 36, y: 430 },
    decorTiles: [
      { x: 0, y: 0, w: 960, h: 112, type: 'wall' },
      { x: 72, y: 135, w: 210, h: 32, type: 'trim' },
      { x: 384, y: 126, w: 170, h: 32, type: 'wall' },
      { x: 642, y: 134, w: 228, h: 32, type: 'trim' },
      { x: 210, y: 452, w: 80, h: 32, type: 'crystal' },
      { x: 610, y: 392, w: 110, h: 32, type: 'crystal' },
    ],
    platforms: [
      { x: 0, y: 500, w: 170, h: 40 },
      { x: 230, y: 465, w: 120, h: 20 },
      { x: 420, y: 430, w: 110, h: 20 },
      { x: 620, y: 390, w: 120, h: 20 },
      { x: 815, y: 350, w: 145, h: 20 },
      { x: 820, y: 500, w: 140, h: 40 },
    ],
    spikes: [
      { x: 175, y: 500, w: 42, h: 40 },
      { x: 365, y: 500, w: 45, h: 40 },
      { x: 545, y: 500, w: 50, h: 40 },
      { x: 735, y: 500, w: 55, h: 40 },
    ],
    movingPlatforms: [
      { x: 250, y: 345, w: 82, h: 16, axis: 'y', origin: 345, range: 58, speed: 1.7, phase: 0.4 },
      { x: 535, y: 310, w: 86, h: 16, axis: 'x', origin: 535, range: 86, speed: 1.9, phase: 0.2 },
    ],
    bouncePads: [
      { x: 246, y: 447, w: 38, h: 18, force: 940 },
      { x: 838, y: 332, w: 38, h: 18, force: 890 },
    ],
    dashOrbs: [
      { x: 288, y: 322, r: 10, active: true, timer: 0 },
      { x: 575, y: 286, r: 10, active: true, timer: 0 },
      { x: 855, y: 318, r: 10, active: true, timer: 0 },
    ],
    crumblePlatforms: [
      { x: 450, y: 350, w: 78, h: 16, state: 'solid', timer: 0 },
      { x: 700, y: 305, w: 76, h: 16, state: 'solid', timer: 0 },
    ],
    relics: [
      { x: 260, y: 435, w: 14, h: 14, collected: false },
      { x: 570, y: 282, w: 14, h: 14, collected: false },
      { x: 875, y: 322, w: 14, h: 14, collected: false },
    ],
    lever: { x: 838, y: 460, w: 18, h: 40, pulled: false, promptRange: 76 },
    gate: { x: 916, y: 295, w: 30, h: 55, type: 'next', locked: true, initialLocked: true },
    enemies: [
      {
        spawnX: 430,
        y: 396,
        w: 34,
        h: 34,
        speed: 82,
        patrolMinX: 420,
        patrolMaxX: 530,
        detectionRange: 120,
        resetRange: 190,
      },
      {
        spawnX: 650,
        y: 356,
        w: 34,
        h: 34,
        speed: 88,
        patrolMinX: 620,
        patrolMaxX: 740,
        detectionRange: 130,
        resetRange: 205,
      },
    ],
  },
  {
    name: 'Level 5: Wind Bridge',
    start: { x: 30, y: 430 },
    decorTiles: [{ x: 0, y: 0, w: 960, h: 96, type: 'wall' }],
    platforms: [
      { x: 0, y: 500, w: 200, h: 40 }, { x: 260, y: 460, w: 120, h: 20 }, { x: 430, y: 420, w: 120, h: 20 },
      { x: 600, y: 380, w: 120, h: 20 }, { x: 780, y: 340, w: 140, h: 20 }, { x: 820, y: 500, w: 140, h: 40 },
    ],
    spikes: [{ x: 205, y: 500, w: 45, h: 40 }, { x: 560, y: 500, w: 45, h: 40 }],
    movingPlatforms: [{ x: 345, y: 360, w: 86, h: 16, axis: 'y', origin: 360, range: 75, speed: 1.9, phase: 0.6 }],
    bouncePads: [{ x: 790, y: 322, w: 38, h: 18, force: 980 }],
    dashOrbs: [{ x: 360, y: 332, r: 10, active: true, timer: 0 }, { x: 650, y: 352, r: 10, active: true, timer: 0 }],
    crumblePlatforms: [{ x: 510, y: 330, w: 76, h: 16, state: 'solid', timer: 0 }],
    relics: [{ x: 278, y: 442, w: 14, h: 14, collected: false }, { x: 805, y: 322, w: 14, h: 14, collected: false }],
    lever: { x: 842, y: 460, w: 18, h: 40, pulled: false, promptRange: 76 },
    gate: { x: 916, y: 285, w: 30, h: 55, type: 'next', locked: true, initialLocked: true },
    enemies: [{ spawnX: 610, y: 346, w: 34, h: 34, speed: 90, patrolMinX: 590, patrolMaxX: 720, detectionRange: 130, resetRange: 205, respawnDelay: 4 }],
  },
  {
    name: 'Level 6: Crown Vault',
    start: { x: 36, y: 430 },
    decorTiles: [{ x: 0, y: 0, w: 960, h: 96, type: 'wall' }, { x: 200, y: 120, w: 540, h: 32, type: 'trim' }],
    platforms: [
      { x: 0, y: 500, w: 180, h: 40 }, { x: 220, y: 468, w: 100, h: 20 }, { x: 390, y: 430, w: 110, h: 20 },
      { x: 560, y: 388, w: 120, h: 20 }, { x: 740, y: 350, w: 120, h: 20 }, { x: 820, y: 500, w: 140, h: 40 },
    ],
    spikes: [{ x: 182, y: 500, w: 35, h: 40 }, { x: 330, y: 500, w: 35, h: 40 }, { x: 510, y: 500, w: 35, h: 40 }],
    movingPlatforms: [{ x: 300, y: 330, w: 90, h: 16, axis: 'x', origin: 300, range: 95, speed: 2.0, phase: 0.3 }],
    bouncePads: [
      { x: 750, y: 332, w: 38, h: 18, force: 940 },
      { x: 882, y: 482, w: 38, h: 18, force: 980 },
    ],
    dashOrbs: [{ x: 330, y: 300, r: 10, active: true, timer: 0 }, { x: 615, y: 358, r: 10, active: true, timer: 0 }],
    crumblePlatforms: [{ x: 480, y: 340, w: 74, h: 16, state: 'solid', timer: 0 }, { x: 690, y: 310, w: 74, h: 16, state: 'solid', timer: 0 }],
    relics: [{ x: 250, y: 450, w: 14, h: 14, collected: false }, { x: 777, y: 330, w: 14, h: 14, collected: false }],
    lever: { x: 850, y: 460, w: 18, h: 40, pulled: false, promptRange: 76 },
    gate: { x: 916, y: 295, w: 30, h: 55, type: 'finish', locked: true, initialLocked: true },
    enemies: [
      { spawnX: 402, y: 396, w: 34, h: 34, speed: 86, patrolMinX: 390, patrolMaxX: 500, detectionRange: 120, resetRange: 190, respawnDelay: 4.5 },
      { spawnX: 563, y: 354, w: 34, h: 34, speed: 92, patrolMinX: 560, patrolMaxX: 680, detectionRange: 130, resetRange: 200, respawnDelay: 4.5 },
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


function getUnlockProgress(level) {
  const totalRelics = (level.relics || []).length;
  const collectedRelics = (level.relics || []).filter((r) => r.collected).length;
  const activeEnemies = enemies.filter((e) => !e.defeated).length;
  return { totalRelics, collectedRelics, activeEnemies };
}

function canUnlockLevel(level) {
  const { totalRelics, collectedRelics, activeEnemies } = getUnlockProgress(level);
  const allRelics = collectedRelics >= totalRelics;
  if (level.unlockMode === 'relicsOrEnemies') return allRelics || activeEnemies === 0;
  if (level.unlockMode === 'relicsAndEnemies') return allRelics && activeEnemies === 0;
  return allRelics;
}

function getUnlockHint(level) {
  const { totalRelics, collectedRelics, activeEnemies } = getUnlockProgress(level);
  if (canUnlockLevel(level)) return 'Press E';
  if (level.unlockMode === 'relicsOrEnemies') return `${collectedRelics}/${totalRelics} relics or defeat enemies`;
  if (level.unlockMode === 'relicsAndEnemies') return `${collectedRelics}/${totalRelics} relics + ${activeEnemies} enemies`;
  return `${collectedRelics}/${totalRelics} relics`;
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
    state: EnemyStates.Patrol,
    direction: 1,
    defeated: false,
    respawnDelay: levelEnemy.respawnDelay || 5,
    respawnTimer: 0,
    animTime: 0,
    lastState: EnemyStates.Patrol,
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
  player.hearts = player.maxHearts;
  player.invulnerableTimer = 0;
  setStatus(message);
}

function damagePlayer(reason) {
  if (player.invulnerableTimer > 0 || player.won) return;
  player.hearts -= 1;
  player.invulnerableTimer = 1.1;
  playSound('hazard');
  spawnParticles(player.x + player.w / 2, player.y + player.h / 2, 22, '#ff6b6b', { speed: 130, life: 0.4, size: 5 });
  if (player.hearts <= 0) {
    player.hearts = player.maxHearts;
    restartLevel(`${reason} Out of hearts!`);
    return;
  }
  const level = currentLevel();
  player.x = level.start.x;
  player.y = level.start.y;
  player.vx = 0;
  player.vy = 0;
  setStatus(`${reason} Hearts: ${player.hearts}/${player.maxHearts}`);
}

function loadLevel(index, message) {
  currentLevelIndex = index;
  particles.length = 0;
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
  if (level.dashOrbs) {
    level.dashOrbs.forEach((orb) => {
      orb.active = true;
      orb.timer = 0;
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
  if (level.dashOrbs) {
    level.dashOrbs.forEach((orb) => {
      orb.active = true;
      orb.timer = 0;
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
      if (mp.axis === 'y') mp.y = mp.origin + offset;
    }
  }

  if (level.dashOrbs) {
    for (const orb of level.dashOrbs) {
      if (!orb.active) {
        orb.timer -= dt;
        if (orb.timer <= 0) orb.active = true;
      }
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
  if (player.invulnerableTimer > 0) player.invulnerableTimer = Math.max(0, player.invulnerableTimer - dt);
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

function horizontalOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x;
}

function updatePlayer(dt) {
  if (isPressed('KeyR')) {
    loadLevel(player.won ? 0 : currentLevelIndex, player.won ? 'New run started.' : 'Manual reset.');
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
    playSound('jump');
    spawnParticles(player.x + player.w / 2, player.y + player.h, 8, '#8ff7ff', { speed: 55, life: 0.28, size: 3 });
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
    playSound('dash');
    spawnParticles(player.x + player.w / 2 - player.facing * 16, player.y + player.h / 2, 18, '#8ff7ff', { speed: 120, vx: -player.facing * 80, life: 0.34, size: 5 });
    setStatus('Dash!');
  }

  const gravityScale = player.dashTimer > 0 ? 0.75 : 1;
  player.vy += world.gravity * gravityScale * dt;

  const prevX = player.x;
  const prevY = player.y;

  player.x += player.vx * dt;
  player.x = Math.max(0, Math.min(world.width - player.w, player.x));
  const solids = getSolidPlatforms(level);
  for (const p of solids) {
    if (!overlap(player, p)) continue;
    player.x = prevX;
    break;
  }

  player.y += player.vy * dt;
  player.onGround = false;

  for (const p of solids) {
    if (!overlap(player, p)) continue;

    const prevBottom = prevY + player.h;
    const prevTop = prevY;
    const currBottom = player.y + player.h;
    const currTop = player.y;
    const landingFromAbove = prevBottom <= p.y + 2 && currBottom >= p.y;
    const hitFromBelow = prevTop >= p.y + p.h - 2 && currTop <= p.y + p.h;

    if (landingFromAbove && player.vy >= 0) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.onGround = true;
      if (level.crumblePlatforms && level.crumblePlatforms.includes(p) && p.state === 'solid') {
        p.state = 'breaking';
        p.timer = 0.45;
      }
    } else if (hitFromBelow && player.vy < 0) {
      player.y = p.y + p.h;
      player.vy = 0;
    } else {
      // Fallback resolves deep overlaps deterministically.
      if (Math.abs(prevBottom - p.y) < Math.abs(prevTop - (p.y + p.h))) {
        player.y = p.y - player.h;
        if (player.vy > 0) player.vy = 0;
        player.onGround = true;
      } else {
        player.y = p.y + p.h;
        if (player.vy < 0) player.vy = 0;
      }
    }
  }

  for (const s of level.spikes) {
    if (overlap(player, s)) {
      damagePlayer('Hit spikes!');
      return;
    }
  }

  for (const enemy of enemies) {
    if (enemy.defeated) continue;
    if (!overlap(player, enemy)) continue;
    const prevBottom = prevY + player.h;
    const enemyTop = enemy.y;
    const isFalling = player.vy > 90;
    const crossedEnemyTop = prevBottom <= enemyTop + 8 && player.y + player.h >= enemyTop;
    const centeredOnEnemy = horizontalOverlap(player, enemy);
    const stomped = isFalling && crossedEnemyTop && centeredOnEnemy;
    if (stomped) {
      enemy.defeated = true;
      enemy.respawnTimer = enemy.respawnDelay;
      player.vy = -380;
      playSound('bounce');
      spawnParticles(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, 18, '#ffd66b', { speed: 110, life: 0.45, size: 4 });
      setStatus('Enemy incapacitated!');
      continue;
    }
    damagePlayer('Enemy hit!');
    return;
  }

  if (level.bouncePads) {
    for (const pad of level.bouncePads) {
      if (overlap(player, pad) && player.vy >= -120) {
        player.vy = -pad.force;
        player.onGround = false;
        playSound('bounce');
        spawnParticles(pad.x + pad.w / 2, pad.y, 16, '#9cff93', { speed: 95, vy: -60, life: 0.36, size: 4 });
      }
    }
  }


  if (level.dashOrbs) {
    for (const orb of level.dashOrbs) {
      const orbBox = { x: orb.x - orb.r, y: orb.y - orb.r, w: orb.r * 2, h: orb.r * 2 };
      if (orb.active && overlap(player, orbBox)) {
        orb.active = false;
        orb.timer = 2.5;
        player.dashCharge = 1;
        player.dashCooldown = 0;
        player.vy = Math.min(player.vy, -120);
        playSound('collect');
        spawnParticles(orb.x, orb.y, 18, '#8ff7ff', { speed: 110, life: 0.42, size: 4 });
        setStatus('Dash orb refreshed.');
      }
    }
  }

  if (player.y > world.height + 80) {
    damagePlayer('You fell!');
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
      if (!canUnlockLevel(level)) {
        setStatus(`Unlock route: ${getUnlockHint(level)}.`);
      } else {
        level.lever.pulled = true;
        level.gate.locked = false;
        playSound('unlock');
        spawnParticles(level.gate.x + level.gate.w / 2, level.gate.y + level.gate.h / 2, 30, '#65df95', { speed: 135, life: 0.7, size: 5 });
        setStatus('Joystick pulled! Gate unlocked.');
      }
    }
  }

  if (level.relics) {
    for (const relic of level.relics) {
      if (!relic.collected && overlap(player, relic)) {
        relic.collected = true;
        playSound('collect');
        spawnParticles(relic.x + relic.w / 2, relic.y + relic.h / 2, 14, '#ffd66b', { speed: 90, life: 0.42, size: 4 });
        const total = level.relics.length;
        const got = level.relics.filter((r) => r.collected).length;
        setStatus(`Relic collected (${got}/${total}).`);
      }
    }
  }

  if (overlap(player, level.gate)) {
    if (level.gate.locked) {
      setStatus(`Gate locked. ${getUnlockHint(level)}, then pull the joystick.`);
      player.x = prevX;
      return;
    }

    if (level.gate.type === 'next') {
      const nextLevel = levels[currentLevelIndex + 1];
      loadLevel(currentLevelIndex + 1, `Level complete! ${nextLevel.name}. Find an unlock route.`);
      return;
    }

    if (level.gate.type === 'finish') {
      player.won = true;
      setStatus('You cleared all levels! Press R to start a new run.');
    }
  }
}

function getEnemyTransition(enemy, distanceToPlayer) {
  if (enemy.state === EnemyStates.Patrol && distanceToPlayer < enemy.detectionRange) {
    return EnemyStates.Alert;
  }

  if (enemy.state === EnemyStates.Alert && distanceToPlayer > enemy.resetRange) {
    return EnemyStates.Reset;
  }

  if (enemy.state === EnemyStates.Reset && Math.abs(enemy.x - enemy.patrolMinX) < 4) {
    return EnemyStates.Patrol;
  }

  return enemy.state;
}

function enterEnemyState(enemy, nextState) {
  if (enemy.state === nextState) return;

  const previousState = enemy.state;
  enemy.lastState = previousState;
  enemy.state = nextState;

  if (nextState === EnemyStates.Patrol) {
    enemy.direction = 1;
  }

  if (nextState === EnemyStates.Alert) {
    playSound('alert');
    spawnParticles(enemy.x + enemy.w / 2, enemy.y + 2, 8, '#ff6b6b', { speed: 70, life: 0.3, size: 3 });
  }
}

function updateEnemyPatrol(enemy, dt) {
  enemy.vx = enemy.speed * enemy.direction;
  enemy.x += enemy.vx * dt;

  if (enemy.x <= enemy.patrolMinX) {
    enemy.x = enemy.patrolMinX;
    enemy.direction = 1;
  } else if (enemy.x + enemy.w >= enemy.patrolMaxX) {
    enemy.x = enemy.patrolMaxX - enemy.w;
    enemy.direction = -1;
  }
}

function updateEnemyAlert(enemy, dt, playerCenterX, enemyCenterX) {
  enemy.vx = playerCenterX < enemyCenterX ? -enemy.speed * 1.35 : enemy.speed * 1.35;
  enemy.x += enemy.vx * dt;
  enemy.x = Math.max(enemy.patrolMinX, Math.min(enemy.patrolMaxX - enemy.w, enemy.x));
}

function updateEnemyReset(enemy, dt) {
  enemy.vx = -enemy.speed;
  enemy.x += enemy.vx * dt;
  if (enemy.x < enemy.patrolMinX) enemy.x = enemy.patrolMinX;
}

function updateEnemy(dt) {
  if (!enemies.length || player.won) return;

  const playerCenterX = player.x + player.w / 2;
  for (const enemy of enemies) {
    if (enemy.defeated) {
      enemy.respawnTimer -= dt;
      if (enemy.respawnTimer <= 0) {
        enemy.defeated = false;
        enemy.x = enemy.patrolMinX;
        enemy.vx = 0;
        enemy.direction = 1;
        enemy.state = EnemyStates.Patrol;
        spawnParticles(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, 10, '#89b6ff', { speed: 70, life: 0.4, size: 3 });
      }
      continue;
    }
    enemy.animTime += dt;

    const enemyCenterX = enemy.x + enemy.w / 2;
    const distanceToPlayer = Math.abs(playerCenterX - enemyCenterX);
    enterEnemyState(enemy, getEnemyTransition(enemy, distanceToPlayer));

    if (enemy.state === EnemyStates.Patrol) {
      updateEnemyPatrol(enemy, dt);
    } else if (enemy.state === EnemyStates.Alert) {
      updateEnemyAlert(enemy, dt, playerCenterX, enemyCenterX);
    } else if (enemy.state === EnemyStates.Reset) {
      updateEnemyReset(enemy, dt);
    }
  }
}


function drawDecorTilemap(level) {
  for (const tile of level.decorTiles || []) {
    if (tile.type === 'wall') {
      ctx.fillStyle = material.wallPattern || '#202a44';
      ctx.fillRect(tile.x, tile.y, tile.w, tile.h);
      ctx.strokeStyle = 'rgba(143, 247, 255, 0.08)';
      ctx.strokeRect(tile.x, tile.y, tile.w, tile.h);
    } else if (tile.type === 'trim') {
      ctx.fillStyle = material.trimPattern || '#293554';
      ctx.fillRect(tile.x, tile.y, tile.w, tile.h);
    } else if (tile.type === 'crystal') {
      const crystalCount = Math.max(3, Math.floor(tile.w / 20));
      for (let i = 0; i < crystalCount; i++) {
        const x = tile.x + i * 18 + 4;
        const h = 12 + (i % 3) * 7;
        const y = tile.y + tile.h - h;
        const grad = ctx.createLinearGradient(x, y, x, y + h);
        grad.addColorStop(0, '#c6fbff');
        grad.addColorStop(1, '#3fa3c6');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(x + 6, y);
        ctx.lineTo(x + 12, y + h);
        ctx.lineTo(x, y + h);
        ctx.closePath();
        ctx.fill();
      }
    }
  }
}

function drawAmbientVfx(nowMs) {
  const time = nowMs / 1000;
  ctx.save();
  for (let i = 0; i < 28; i++) {
    const x = (i * 73 + Math.sin(time * 0.6 + i) * 18) % world.width;
    const y = 70 + ((i * 43 + time * 18) % 360);
    const alpha = 0.12 + Math.sin(time * 1.7 + i) * 0.05;
    ctx.fillStyle = `rgba(143, 247, 255, ${alpha})`;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.restore();
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


function drawDashOrbs(orbs) {
  const time = performance.now() / 1000;
  for (const orb of orbs || []) {
    const alpha = orb.active ? 1 : 0.25;
    const pulse = Math.sin(time * 7 + orb.x * 0.01) * 2;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#8ff7ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.r + pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#d8fbff';
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, Math.max(3, orb.r - 4 + pulse * 0.4), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
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
  const invulnFlash = player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer * 12) % 2 === 0;

  ctx.save();
  if (invulnFlash) ctx.globalAlpha = 0.5;
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

function drawHud() {
  const heartSize = 18;
  const gap = 8;
  const startX = 18;
  const y = 16;
  for (let i = 0; i < player.maxHearts; i++) {
    const filled = i < player.hearts;
    const x = startX + i * (heartSize + gap);
    ctx.fillStyle = filled ? '#ff5f7a' : '#5b3d45';
    ctx.beginPath();
    ctx.moveTo(x + 9, y + 17);
    ctx.bezierCurveTo(x - 4, y + 8, x + 4, y - 6, x + 9, y + 3);
    ctx.bezierCurveTo(x + 14, y - 6, x + 22, y + 8, x + 9, y + 17);
    ctx.fill();
  }
  ctx.fillStyle = '#d8e7ff';
  ctx.font = '14px sans-serif';
  ctx.fillText(`Level ${currentLevelIndex + 1}/${levels.length}`, 18, 54);
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

    if (enemy.defeated && enemy.respawnTimer > 0) {
      ctx.fillStyle = '#d7e8ff';
      ctx.font = '12px sans-serif';
      ctx.fillText(`${enemy.respawnTimer.toFixed(1)}s`, enemy.x + 3, enemy.y - 8);
    }

    ctx.restore();
  }
}

function drawTutorialGuides(level) {
  if (level.lever && !level.lever.pulled) {
    const nearLever = Math.abs((player.x + player.w / 2) - (level.lever.x + level.lever.w / 2)) < level.lever.promptRange;
    if (nearLever) {
      const prompt = getUnlockHint(level);
      ctx.save();
      ctx.font = '14px sans-serif';
      const promptWidth = ctx.measureText(prompt).width + 20;
      const promptX = Math.max(8, Math.min(world.width - promptWidth - 8, level.lever.x - promptWidth / 2));
      ctx.fillStyle = 'rgba(12, 17, 29, 0.72)';
      ctx.fillRect(promptX, level.lever.y - 34, promptWidth, 24);
      ctx.strokeStyle = '#ffe790';
      ctx.strokeRect(promptX, level.lever.y - 34, promptWidth, 24);
      ctx.fillStyle = '#ffe790';
      ctx.fillText(prompt, promptX + 10, level.lever.y - 17);
      ctx.restore();
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
  drawDecorTilemap(level);
  drawAmbientVfx(performance.now());

  drawPlatforms(getSolidPlatforms(level));
  drawSpikes(level.spikes);
  drawBouncePads(level.bouncePads);
  drawDashOrbs(level.dashOrbs);
  drawRelics(level.relics);
  drawLever(level.lever);
  drawGate(level.gate);
  drawEnemy();
  drawPlayer();
  drawParticles();
  drawTutorialGuides(level);
  drawHud();
}

let lastTime = performance.now();
function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 1 / 30);
  lastTime = now;

  updateDynamicFeatures(currentLevel(), dt, now);
  updatePlayer(dt);
  updateEnemy(dt);
  updateParticles(dt);
  updateBgm();
  draw();

  keysPressed.clear();
  requestAnimationFrame(loop);
}

buildMaterials();
loadLevel(0, 'Level 1 started. Pull the joystick to open the first gate.');
requestAnimationFrame(loop);
