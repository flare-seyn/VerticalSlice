const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const keysHeld = new Set();
const keysPressed = new Set();
window.addEventListener('keydown', (e) => {
  const code = e.code;
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "KeyW", "KeyA", "KeyS", "KeyD", "Space", "KeyE", "KeyR"].includes(code)) {
    e.preventDefault();
  }
  if (!keysHeld.has(code)) keysPressed.add(code);
  keysHeld.add(code);
});
window.addEventListener('keyup', (e) => keysHeld.delete(e.code));

const rooms = {
  start: { id: 'start', x: 40, y: 40, w: 220, h: 180, doors: [{ x: 250, y: 110, to: 'hub', spawn: { x: 290, y: 130 } }] },
  hub: { id: 'hub', x: 280, y: 40, w: 360, h: 420, doors: [
    { x: 280, y: 110, to: 'start', spawn: { x: 235, y: 130 } },
    { x: 630, y: 100, to: 'clue', spawn: { x: 665, y: 120 } },
    { x: 630, y: 220, to: 'trap', spawn: { x: 665, y: 240 } },
    { x: 630, y: 340, to: 'key', spawn: { x: 665, y: 360 } },
  ] },
  clue: { id: 'clue', x: 660, y: 40, w: 240, h: 180, doors: [{ x: 660, y: 110, to: 'hub', spawn: { x: 615, y: 120 } }] },
  trap: { id: 'trap', x: 660, y: 220, w: 240, h: 180, doors: [{ x: 660, y: 300, to: 'hub', spawn: { x: 615, y: 240 } }] },
  key: { id: 'key', x: 660, y: 340, w: 240, h: 160, doors: [{ x: 660, y: 420, to: 'hub', spawn: { x: 615, y: 360 } }] },
  seal: { id: 'seal', x: 280, y: 470, w: 360, h: 60, doors: [{ x: 630, y: 490, to: 'final', spawn: { x: 675, y: 500 }, locked: true }] },
  final: { id: 'final', x: 660, y: 470, w: 240, h: 60, doors: [] },
};

rooms.hub.doors.push({ x: 430, y: 450, to: 'seal', spawn: { x: 450, y: 495 } });
rooms.seal.doors.push({ x: 280, y: 490, to: 'hub', spawn: { x: 450, y: 430 } });

const state = {
  room: 'start',
  hp: 100,
  maxHp: 100,
  hasPotion: false,
  hasSigil: false,
  clueRead: false,
  sealOpened: false,
  bossSpawned: false,
  bossPrimed: false,
  won: false,
  lose: false,
  msg: 'Find the correct sigil to unseal the door.',
  enemies: [
    { room: 'trap', x: 760, y: 290, r: 12, hp: 35, speed: 70, state: 'patrol', patrolA: 730, patrolB: 840, dir: 1, detect: 120 },
  ],
  boss: { room: 'final', x: 810, y: 500, r: 18, hp: 90, alive: true, cooldown: 0, windup: 0 },
  traps: [
    { room: 'trap', x: 720, y: 260, w: 120, h: 16, phase: 0 },
  ],
  items: {
    potion: { room: 'clue', x: 760, y: 150, taken: false },
    sigil: { room: 'key', x: 785, y: 410, taken: false },
    clue: { room: 'clue', x: 825, y: 95, used: false },
  },
};

const player = { x: 120, y: 130, r: 10, speed: 160, attackCd: 0, iFrames: 0 };

function setStatus(t) { state.msg = t; statusEl.textContent = t; }
function isPressed(code) { return keysPressed.has(code); }
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function inRect(p, r) { return p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h; }
function objectiveText() {
  if (!state.clueRead) return 'Objective: Read the clue tablet in Exploration Room A.';
  if (!state.hasSigil) return 'Objective: Find the Azure Sigil in the key room.';
  if (!state.sealOpened) return 'Objective: Return to the runeseal room and interact.';
  if (!state.bossPrimed) return 'Objective: Interact with the ritual altar to start miniboss.';
  if (!state.won) return 'Objective: Defeat the miniboss.';
  return 'Objective: Escape complete.';
}

function changeRoom(id, spawn) {
  state.room = id;
  player.x = spawn.x;
  player.y = spawn.y;
}

function hurt(amount, source = 'damage') {
  if (player.iFrames > 0 || state.won || state.lose) return;
  player.iFrames = 0.6;
  state.hp = Math.max(0, state.hp - amount);
  setStatus(`Took ${amount} ${source}. HP ${state.hp}/${state.maxHp}`);
  if (state.hp <= 0) {
    state.lose = true;
    setStatus('You fell in the dungeon. Press R to restart.');
  }
}

function restartGame() {
  state.room = 'start';
  state.hp = 100;
  state.hasPotion = false;
  state.hasSigil = false;
  state.clueRead = false;
  state.sealOpened = false;
  state.bossSpawned = false;
  state.bossPrimed = false;
  state.won = false;
  state.lose = false;
  state.items.potion.taken = false;
  state.items.sigil.taken = false;
  state.items.clue.used = false;
  state.enemies[0].x = 760;
  state.enemies[0].hp = 35;
  state.enemies[0].state = 'patrol';
  state.boss.hp = 90;
  state.boss.alive = true;
  player.x = 120;
  player.y = 130;
  setStatus('Find the correct sigil to unseal the door.');
}

function update(dt) {
  if (isPressed('KeyR')) restartGame();
  if (state.won || state.lose) return;

  player.attackCd = Math.max(0, player.attackCd - dt);
  player.iFrames = Math.max(0, player.iFrames - dt);

  let dx = 0, dy = 0;
  if (keysHeld.has('ArrowLeft') || keysHeld.has('KeyA')) dx -= 1;
  if (keysHeld.has('ArrowRight') || keysHeld.has('KeyD')) dx += 1;
  if (keysHeld.has('ArrowUp') || keysHeld.has('KeyW')) dy -= 1;
  if (keysHeld.has('ArrowDown') || keysHeld.has('KeyS')) dy += 1;
  const mag = Math.hypot(dx, dy) || 1;
  player.x += (dx / mag) * player.speed * dt;
  player.y += (dy / mag) * player.speed * dt;

  const room = rooms[state.room];
  player.x = Math.max(room.x + 8, Math.min(room.x + room.w - 8, player.x));
  player.y = Math.max(room.y + 8, Math.min(room.y + room.h - 8, player.y));

  for (const d of room.doors) {
    const doorBox = { x: d.x - 10, y: d.y - 22, w: 20, h: 44 };
    if (inRect(player, doorBox) && isPressed('KeyE')) {
      if (d.locked && !state.sealOpened) {
        setStatus('A magical seal blocks this door.');
      } else {
        changeRoom(d.to, d.spawn);
        if (d.to === 'final' && !state.bossSpawned) {
          state.bossSpawned = true;
          setStatus('Final room reached. Interact with altar when ready.');
        }
      }
    }
  }

  if (state.room === 'seal' && isPressed('KeyE')) {
    if (state.hasSigil) {
      state.sealOpened = true;
      rooms.seal.doors[0].locked = false;
      setStatus('Runeseal broken. The final room is open.');
    } else {
      setStatus('The seal rejects you. A sigil is required.');
    }
  }

  if (state.room === state.items.clue.room && !state.items.clue.used && dist(player, state.items.clue) < 22 && isPressed('KeyE')) {
    state.items.clue.used = true;
    state.clueRead = true;
    setStatus('Clue: “Only the Azure Sigil can break the runeseal.”');
  }
  if (state.room === state.items.potion.room && !state.items.potion.taken && dist(player, state.items.potion) < 20 && isPressed('KeyE')) {
    state.items.potion.taken = true;
    state.hasPotion = true;
    setStatus('Potion picked. Press E again while in room to heal 35 HP.');
  }
  if (state.hasPotion && isPressed('KeyE') && state.room !== state.items.potion.room) {
    state.hasPotion = false;
    state.hp = Math.min(state.maxHp, state.hp + 35);
    setStatus(`Potion consumed. HP ${state.hp}/${state.maxHp}`);
  }
  if (state.room === state.items.sigil.room && !state.items.sigil.taken && dist(player, state.items.sigil) < 20 && isPressed('KeyE')) {
    state.items.sigil.taken = true;
    state.hasSigil = true;
    setStatus('Azure Sigil acquired. Return to the sealed door.');
  }

  for (const t of state.traps) {
    if (t.room !== state.room) continue;
    t.phase += dt * 1.6;
    const active = Math.sin(t.phase) > 0.4;
    if (active && inRect(player, t)) hurt(7, 'trap');
  }

  for (const e of state.enemies) {
    if (e.hp <= 0 || e.room !== state.room) continue;
    const d = dist(player, e);
    if (e.state === 'patrol' && d < e.detect) e.state = 'alert';
    if (e.state === 'alert' && d > e.detect * 1.5) e.state = 'reset';
    if (e.state === 'reset' && Math.abs(e.x - e.patrolA) < 6) e.state = 'patrol';

    if (e.state === 'patrol') {
      e.x += e.dir * e.speed * dt;
      if (e.x < e.patrolA || e.x > e.patrolB) e.dir *= -1;
    } else if (e.state === 'alert') {
      const vx = (player.x - e.x) / (d || 1);
      const vy = (player.y - e.y) / (d || 1);
      e.x += vx * e.speed * 1.15 * dt;
      e.y += vy * e.speed * 1.15 * dt;
    } else {
      e.x += (e.patrolA - e.x) * 0.03;
    }

    if (dist(player, e) < player.r + e.r) hurt(6, 'enemy');
  }

  if (state.room === state.boss.room && !state.bossPrimed && isPressed('KeyE')) {
    state.bossPrimed = true;
    setStatus('Ritual started. Miniboss awakens!');
  }

  if (state.room === state.boss.room && state.boss.alive && state.bossPrimed) {
    const b = state.boss;
    b.cooldown -= dt;
    if (b.cooldown <= 0) {
      b.windup = 0.6;
      b.cooldown = 2.1;
    }
    if (b.windup > 0) {
      b.windup -= dt;
      if (b.windup <= 0 && dist(player, b) < 95) hurt(14, 'miniboss slam');
    }
    const bd = dist(player, b);
    const vx = (player.x - b.x) / (bd || 1);
    const vy = (player.y - b.y) / (bd || 1);
    b.x += vx * 52 * dt;
    b.y += vy * 52 * dt;
  }

  if (isPressed('Space') && player.attackCd <= 0) {
    player.attackCd = 0.35;
    for (const e of state.enemies) {
      if (e.hp > 0 && e.room === state.room && dist(player, e) < 42) {
        e.hp -= 20;
        setStatus('Enemy hit.');
      }
    }
    if (state.room === state.boss.room && state.boss.alive && state.bossPrimed && dist(player, state.boss) < 46) {
      state.boss.hp -= 12;
      setStatus(`Miniboss hit (${Math.max(0, state.boss.hp)} HP).`);
      if (state.boss.hp <= 0) {
        state.boss.alive = false;
        state.won = true;
        setStatus('Victory! You conquered Runeseal Descent.');
      }
    }
  }
}

function drawRoom(r) {
  ctx.fillStyle = '#1f2a33';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = '#4f6a78';
  ctx.lineWidth = 2;
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  for (const d of r.doors) {
    ctx.fillStyle = (d.locked && !state.sealOpened) ? '#7a4d52' : '#6dc091';
    ctx.fillRect(d.x - 8, d.y - 20, 16, 40);
  }
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = '#0f1419';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // map preview (route choice)
  for (const id of ['start', 'hub', 'clue', 'trap', 'key', 'seal', 'final']) drawRoom(rooms[id]);

  // traps
  for (const t of state.traps) {
    const active = Math.sin(t.phase) > 0.25;
    ctx.fillStyle = active ? '#d24d4d' : '#5e2d2d';
    ctx.fillRect(t.x, t.y, t.w, t.h);
  }

  // clue / items
  if (!state.items.clue.used) {
    ctx.fillStyle = '#6bc0ff';
    ctx.fillRect(state.items.clue.x - 8, state.items.clue.y - 8, 16, 16);
  }
  if (!state.items.potion.taken) {
    ctx.fillStyle = '#9bff7b';
    ctx.beginPath(); ctx.arc(state.items.potion.x, state.items.potion.y, 8, 0, Math.PI * 2); ctx.fill();
  }
  if (!state.items.sigil.taken) {
    ctx.fillStyle = '#58d7ff';
    ctx.beginPath(); ctx.moveTo(state.items.sigil.x, state.items.sigil.y - 10); ctx.lineTo(state.items.sigil.x + 10, state.items.sigil.y); ctx.lineTo(state.items.sigil.x, state.items.sigil.y + 10); ctx.lineTo(state.items.sigil.x - 10, state.items.sigil.y); ctx.closePath(); ctx.fill();
  }

  // enemies (humanoid cultist style)
  for (const e of state.enemies) {
    if (e.hp <= 0) continue;
    const color = e.state === 'alert' ? '#ff6b6b' : e.state === 'reset' ? '#89b6ff' : '#f2bd43';
    ctx.fillStyle = color;
    ctx.fillRect(e.x - 8, e.y - 8, 16, 20); // body
    ctx.fillStyle = '#f7d7b4';
    ctx.beginPath(); ctx.arc(e.x, e.y - 12, 6, 0, Math.PI * 2); ctx.fill(); // head
    ctx.fillStyle = '#2a1c1c';
    ctx.fillRect(e.x - 6, e.y + 12, 4, 8);
    ctx.fillRect(e.x + 2, e.y + 12, 4, 8);
  }

  if (state.boss.alive && state.bossPrimed) {
    ctx.fillStyle = state.boss.windup > 0 ? '#ff3f7e' : '#8f61ff';
    ctx.fillRect(state.boss.x - 14, state.boss.y - 12, 28, 34);
    ctx.fillStyle = '#d9ccff';
    ctx.beginPath(); ctx.arc(state.boss.x, state.boss.y - 16, 8, 0, Math.PI * 2); ctx.fill();
  } else if (state.room === 'final' && !state.bossPrimed) {
    ctx.fillStyle = '#5dd7ff';
    ctx.fillRect(748, 494, 24, 12);
    ctx.fillStyle = '#c8f4ff';
    ctx.fillText('Press E at altar', 740, 488);
  }

  // player (more human-like)
  ctx.fillStyle = player.iFrames > 0 ? '#ffe9a1' : '#9ae6ff';
  ctx.fillRect(player.x - 7, player.y - 6, 14, 18);
  ctx.fillStyle = '#ffe2c2';
  ctx.beginPath(); ctx.arc(player.x, player.y - 10, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#24536f';
  ctx.fillRect(player.x - 6, player.y + 12, 4, 7);
  ctx.fillRect(player.x + 2, player.y + 12, 4, 7);

  // HUD
  ctx.fillStyle = '#ffffff';
  ctx.font = '15px sans-serif';
  ctx.fillText(`Room: ${state.room.toUpperCase()}  HP: ${state.hp}/${state.maxHp}`, 14, 22);
  ctx.fillText(`Sigil: ${state.hasSigil ? 'YES' : 'NO'}  Potion: ${state.hasPotion ? 'YES' : 'NO'}  Clue: ${state.clueRead ? 'READ' : 'UNREAD'}`, 14, 42);
  ctx.fillText('Controls: Move WASD/Arrows | E interact/use potion | Space attack | R restart', 14, 62);
  ctx.fillStyle = '#ffe9a1';
  ctx.fillText(objectiveText(), 14, 82);
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  keysPressed.clear();
  requestAnimationFrame(loop);
}

setStatus('Find the correct sigil to unseal the door.');
requestAnimationFrame(loop);
