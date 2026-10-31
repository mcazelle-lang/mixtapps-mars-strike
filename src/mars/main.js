import {
  VIEW_W, VIEW_H, PLAYER_SPEED, PLAYER_SHIELDS, PLAYER_INVULN_MS,
  PROJECTILE_DEFS, WEAPON_LABELS, PROGRESS_PER_WAVE,
} from './config.js';
import { setupCanvas, resize, clearScene, updateStars, drawStars, drawSprite, drawProjectile, drawExplosion, drawHpBar, present, pointerToLogical, getOffCtx } from './render.js';
import { fire, pickupWeapon, tickWeaponExpiry, updateProjectiles } from './weapons.js';
import { spawnEnemy, updateEnemies, damageEnemy, isEnemyOffscreen, maybeDropPickup, updatePickups } from './enemies.js';
import { createWaveRunner, startWave, tickWaves, isWaveDone, nextWave, getCurrentWave, getWaveCount } from './waves.js';
import * as audio from '../io/audio.js';
import { load as loadPrefs, save as savePrefs } from '../io/storage.js';

const canvas = document.getElementById('game');

const session = {
  screen: 'home',
  lastTime: 0,
  player: null,
  projectiles: [],
  enemies: [],
  pickups: [],
  explosions: [],
  waveRunner: null,
  score: 0,
  maxWaveReached: 1,
  pendingStart: false,
};

const input = {
  left: false,
  right: false,
  fire: false,
  pointerActive: false,
  pointerX: VIEW_W / 2,
};

let prefs = loadPrefs();

function applyMuteFromPrefs() {
  audio.setMuted(prefs.mute);
  document.getElementById('btn-mute')?.classList.toggle('is-muted', prefs.mute);
}

function setMutePersistent(value) {
  prefs.mute = Boolean(value);
  audio.setMuted(prefs.mute);
  savePrefs(prefs);
  document.getElementById('btn-mute')?.classList.toggle('is-muted', prefs.mute);
}

function createPlayer() {
  return {
    x: VIEW_W / 2,
    y: VIEW_H - 36,
    width: 11,
    height: 16,
    shields: PLAYER_SHIELDS,
    weapon: 'machinegun',
    weaponExpiresAt: 0,
    fireReadyAt: 0,
    invulnUntil: 0,
    state: 'flying',
  };
}

function startGame() {
  if (session.pendingStart) return;
  session.pendingStart = true;
  audio.init();
  session.player = createPlayer();
  session.projectiles = [];
  session.enemies = [];
  session.pickups = [];
  session.explosions = [];
  session.waveRunner = createWaveRunner();
  session.score = 0;
  session.maxWaveReached = 1;
  session.lastTime = performance.now();
  showScreen('screen-game');
  session.screen = 'playing';
  startWave(session.waveRunner, performance.now(), (wave) => showBanner(wave.label));
  updateHud();
  setTimeout(() => { session.pendingStart = false; }, 200);
}

function endGameOver() {
  if (session.screen === 'gameOver' || session.screen === 'victory') return;
  session.screen = 'gameOver';
  audio.playShieldLoss();
  document.getElementById('game-over-score').textContent = String(session.score);
  document.getElementById('game-over-wave').textContent = `${session.maxWaveReached} / ${getWaveCount()}`;
  showScreen('screen-game-over');
  const btn = document.getElementById('btn-replay');
  if (btn) {
    btn.disabled = true;
    setTimeout(() => { btn.disabled = false; }, 500);
  }
}

function endVictory() {
  if (session.screen === 'victory' || session.screen === 'gameOver') return;
  session.screen = 'victory';
  audio.playVictory();
  document.getElementById('victory-score').textContent = String(session.score);
  showScreen('screen-victory');
  const btn = document.getElementById('btn-replay-victory');
  if (btn) {
    btn.disabled = true;
    setTimeout(() => { btn.disabled = false; }, 700);
  }
}

function showScreen(id) {
  ['screen-home', 'screen-game', 'screen-game-over', 'screen-victory'].forEach((sid) => {
    const el = document.getElementById(sid);
    if (!el) return;
    if (sid === id) el.classList.remove('hidden');
    else el.classList.add('hidden');
  });
}

function showBanner(text) {
  const banner = document.getElementById('wave-banner');
  const txt = document.getElementById('wave-banner-text');
  if (!banner || !txt) return;
  txt.textContent = text;
  banner.classList.remove('hidden');
  setTimeout(() => banner.classList.add('hidden'), 1700);
  audio.playWaveStart();
}

function updateHud() {
  const wave = getCurrentWave(session.waveRunner) ?? { id: '?' };
  document.getElementById('hud-wave').textContent = `WAVE ${wave.id}/${getWaveCount()}`;
  document.getElementById('hud-score').textContent = `SCORE ${session.score}`;
  const wEl = document.getElementById('hud-weapon');
  if (wEl) {
    let label = WEAPON_LABELS[session.player.weapon] || '';
    if (session.player.weaponExpiresAt) {
      const remaining = Math.max(0, session.player.weaponExpiresAt - performance.now());
      label += ` ${(remaining / 1000).toFixed(1)}s`;
    }
    wEl.textContent = label;
  }
  const sh = document.getElementById('hud-shields');
  if (sh) {
    sh.innerHTML = '';
    for (let i = 0; i < PLAYER_SHIELDS; i++) {
      const span = document.createElement('span');
      span.className = 'pixel-heart' + (i >= session.player.shields ? ' lost' : '');
      sh.appendChild(span);
    }
  }
  const pf = document.getElementById('progress-fill');
  if (pf) {
    const wv = session.waveRunner.waveIndex;
    const progress = Math.min(1, wv * PROGRESS_PER_WAVE);
    pf.style.width = `${(progress * 100).toFixed(0)}%`;
  }
}

function handleCollisions(now) {
  const player = session.player;

  // player projectile vs enemies
  for (let i = session.projectiles.length - 1; i >= 0; i--) {
    const p = session.projectiles[i];
    if (!p.fromPlayer) continue;
    for (const e of session.enemies) {
      if (e.hp <= 0) continue;
      if (rectOverlap(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h, e.x - e.width / 2, e.y - e.height / 2, e.width, e.height)) {
        const killed = damageEnemy(e, p.damage);
        p.alive = false;
        if (p.splash) {
          // splash damage to nearby enemies
          for (const other of session.enemies) {
            if (other === e || other.hp <= 0) continue;
            const dx = other.x - p.x;
            const dy = other.y - p.y;
            if (dx * dx + dy * dy <= p.splash * p.splash) damageEnemy(other, Math.ceil(p.damage / 2));
          }
          session.explosions.push({ x: p.x, y: p.y, life: 1, radius: 6 });
        }
        if (killed) {
          session.score += e.score;
          session.explosions.push({ x: e.x, y: e.y, life: 1, radius: e.boss ? 12 : 4 });
          audio.playExplosion();
          maybeDropPickup(e, session.pickups);
          if (e.boss) {
            // immediate victory after boss dies
            setTimeout(() => endVictory(), 500);
          }
        }
        break;
      }
    }
  }

  // enemy projectiles vs player
  if (now >= player.invulnUntil) {
    for (const p of session.projectiles) {
      if (p.fromPlayer) continue;
      if (rectOverlap(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h, player.x - player.width / 2, player.y - player.height / 2, player.width, player.height)) {
        damagePlayer(now);
        p.alive = false;
        break;
      }
    }
  }

  // enemy body vs player
  if (now >= player.invulnUntil) {
    for (const e of session.enemies) {
      if (e.hp <= 0) continue;
      if (rectOverlap(e.x - e.width / 2, e.y - e.height / 2, e.width, e.height, player.x - player.width / 2, player.y - player.height / 2, player.width, player.height)) {
        damagePlayer(now);
        if (!e.boss) {
          e.hp = 0;
          session.explosions.push({ x: e.x, y: e.y, life: 1, radius: 4 });
        }
        break;
      }
    }
  }

  // pickups vs player
  for (let i = session.pickups.length - 1; i >= 0; i--) {
    const pk = session.pickups[i];
    if (rectOverlap(pk.x - pk.width / 2, pk.y - pk.height / 2, pk.width, pk.height, player.x - player.width / 2, player.y - player.height / 2, player.width, player.height)) {
      pickupWeapon(player, now, pk.weapon);
      audio.playPickup();
      session.pickups.splice(i, 1);
    }
  }
}

function damagePlayer(now) {
  const player = session.player;
  player.shields = Math.max(0, player.shields - 1);
  player.invulnUntil = now + PLAYER_INVULN_MS;
  audio.playCollision();
}

function rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function tick(now) {
  requestAnimationFrame(tick);
  if (session.screen !== 'playing') {
    session.lastTime = now;
    return;
  }
  let dtMs = now - session.lastTime;
  session.lastTime = now;
  if (dtMs > 50) dtMs = 50;
  const dt = dtMs / 1000;

  const player = session.player;

  // player movement
  let vx = 0;
  if (input.left) vx -= PLAYER_SPEED;
  if (input.right) vx += PLAYER_SPEED;
  if (input.pointerActive) {
    const dx = input.pointerX - player.x;
    if (Math.abs(dx) > 1) {
      const dir = Math.sign(dx);
      vx = dir * Math.min(PLAYER_SPEED, Math.abs(dx) * 8);
    }
  }
  player.x += vx * dt;
  if (player.x < player.width / 2) player.x = player.width / 2;
  if (player.x > VIEW_W - player.width / 2) player.x = VIEW_W - player.width / 2;

  // firing
  if (input.fire) {
    if (fire(player, now, session.projectiles)) {
      if (player.weapon === 'machinegun') audio.playShoot();
      else if (player.weapon === 'rocket') audio.playRocket();
      else if (player.weapon === 'laser') audio.playLaser();
    }
  }

  tickWeaponExpiry(player, now);

  // wave management
  tickWaves(session.waveRunner, now, session.enemies, spawnEnemy);
  if (isWaveDone(session.waveRunner)) {
    if (nextWave(session.waveRunner)) {
      const wave = getCurrentWave(session.waveRunner);
      session.maxWaveReached = wave.id;
      startWave(session.waveRunner, now, (w) => showBanner(w.label));
    } else {
      // all waves cleared — handled via boss kill victory; if we get here, also win
      endVictory();
      return;
    }
  }

  // entity updates
  updateProjectiles(session.projectiles, dt, VIEW_W, VIEW_H);
  updateEnemies(session.enemies, session.projectiles, dt, now);
  updatePickups(session.pickups, dt, now);

  // explosions
  for (let i = session.explosions.length - 1; i >= 0; i--) {
    const ex = session.explosions[i];
    ex.life -= dt * 2;
    ex.radius += 32 * dt;
    if (ex.life <= 0) session.explosions.splice(i, 1);
  }

  // remove dead enemies
  for (let i = session.enemies.length - 1; i >= 0; i--) {
    const e = session.enemies[i];
    if (e.hp <= 0 || isEnemyOffscreen(e)) session.enemies.splice(i, 1);
  }

  handleCollisions(now);

  // game over check
  if (player.shields === 0) {
    endGameOver();
    return;
  }

  // render
  const progress = Math.min(1, session.waveRunner.waveIndex / getWaveCount());
  clearScene(progress);
  updateStars(dt);
  drawStars();

  // draw pickups
  for (const pk of session.pickups) drawSprite(pk.sprite, pk.x, pk.y);

  // draw enemies
  for (const e of session.enemies) {
    drawSprite(e.sprite, e.x, e.y, { flash: e.flash > 0 });
    if (e.boss && e.hp > 0) drawHpBar(VIEW_W / 2, 6, VIEW_W - 32, e.hp, e.maxHp);
  }

  // draw projectiles
  for (const p of session.projectiles) drawProjectile(p);

  // draw player (flicker if invuln)
  const flash = now < player.invulnUntil && Math.floor(now / 80) % 2 === 0;
  drawSprite('player', player.x, player.y, { flash });

  // explosions
  for (const ex of session.explosions) drawExplosion(ex);

  present();

  updateHud();
}

function bindInput() {
  window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') { input.left = true; e.preventDefault(); }
    else if (e.code === 'ArrowRight') { input.right = true; e.preventDefault(); }
    else if (e.code === 'Space') { input.fire = true; e.preventDefault(); }
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') input.left = false;
    else if (e.code === 'ArrowRight') input.right = false;
    else if (e.code === 'Space') input.fire = false;
  });
  window.addEventListener('blur', () => {
    input.left = input.right = input.fire = false;
    input.pointerActive = false;
  });

  canvas.addEventListener('pointerdown', (e) => {
    input.pointerActive = true;
    input.fire = true;
    const lp = pointerToLogical(e.clientX, e.clientY);
    input.pointerX = lp.x;
    try { canvas.setPointerCapture(e.pointerId); } catch {}
  });
  canvas.addEventListener('pointermove', (e) => {
    const lp = pointerToLogical(e.clientX, e.clientY);
    input.pointerX = lp.x;
    if (e.pressure > 0 || e.buttons > 0) input.pointerActive = true;
  });
  canvas.addEventListener('pointerup', (e) => {
    input.fire = false;
    input.pointerActive = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch {}
  });
  canvas.addEventListener('pointercancel', () => {
    input.fire = false;
    input.pointerActive = false;
  });
}

function bindButtons() {
  document.getElementById('btn-play')?.addEventListener('click', () => {
    audio.playButton();
    startGame();
  });
  document.getElementById('btn-replay')?.addEventListener('click', (e) => {
    if (e.currentTarget.disabled) return;
    audio.playButton();
    startGame();
  });
  document.getElementById('btn-replay-victory')?.addEventListener('click', (e) => {
    if (e.currentTarget.disabled) return;
    audio.playButton();
    startGame();
  });
  document.getElementById('btn-mute')?.addEventListener('click', () => {
    setMutePersistent(!prefs.mute);
    audio.playButton();
  });
}

function init() {
  setupCanvas(canvas);
  applyMuteFromPrefs();
  bindInput();
  bindButtons();
  showScreen('screen-home');
  window.addEventListener('resize', () => resize());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      input.left = input.right = input.fire = false;
      input.pointerActive = false;
      if (session.screen === 'playing') session.screen = 'paused';
    } else if (document.visibilityState === 'visible' && session.screen === 'paused') {
      session.lastTime = performance.now();
      session.screen = 'playing';
    }
  });
  requestAnimationFrame(tick);
}

init();
