import { ENEMY_DEFS, VIEW_W, VIEW_H, PICKUP_DROP_CHANCE, PICKUP_FALL_VY, PICKUP_LIFETIME_MS } from './config.js';
import { createEnemyProjectile } from './weapons.js';

let nextId = 1;

export function spawnEnemy(type) {
  const def = ENEMY_DEFS[type];
  if (!def) return null;
  const margin = def.w;
  const x = margin + Math.random() * (VIEW_W - margin * 2);
  const baseY = -def.h - 4;
  return {
    id: nextId++,
    type,
    sprite: def.sprite,
    hp: def.hp,
    maxHp: def.hp,
    x,
    y: baseY,
    baseX: x,
    width: def.w,
    height: def.h,
    speed: def.speed,
    score: def.score,
    color: def.color,
    shootChance: def.shootChance,
    phase: Math.random() * Math.PI * 2,
    pattern: pickPattern(type),
    boss: type === 'boss',
    flash: 0,
  };
}

function pickPattern(type) {
  if (type === 'grunt') return 'straight';
  if (type === 'drone') return Math.random() < 0.5 ? 'zigzag' : 'sweep';
  if (type === 'heavy') return 'straight';
  if (type === 'saucer') return 'sweep';
  if (type === 'boss') return 'boss';
  return 'straight';
}

export function updateEnemies(enemies, projectiles, dt, now) {
  for (const e of enemies) {
    e.phase += dt * 2;
    if (e.flash > 0) e.flash = Math.max(0, e.flash - dt);
    switch (e.pattern) {
      case 'straight':
        e.y += e.speed * dt;
        break;
      case 'zigzag':
        e.y += e.speed * dt;
        e.x = e.baseX + Math.sin(e.phase * 1.4) * 28;
        break;
      case 'sweep':
        e.y += e.speed * dt * 0.7;
        e.x = e.baseX + Math.sin(e.phase * 0.9) * 60;
        break;
      case 'boss':
        if (e.y < 56) e.y += e.speed * dt;
        else e.x = VIEW_W / 2 + Math.sin(e.phase * 0.6) * (VIEW_W / 2 - 40);
        break;
    }
    // shoot logic
    if (e.shootChance > 0 && e.y > 0 && e.y < VIEW_H * 0.7) {
      if (Math.random() < e.shootChance * 60 * dt) {
        const bullets = e.boss ? [-12, 0, 12] : [0];
        for (const offset of bullets) {
          projectiles.push(createEnemyProjectile(e.x + offset, e.y + e.height / 2, offset * 0.6));
        }
      }
    }
  }
}

export function damageEnemy(e, amount) {
  e.hp -= amount;
  e.flash = 0.08;
  return e.hp <= 0;
}

export function isEnemyOffscreen(e) {
  return e.y > VIEW_H + 40;
}

export function maybeDropPickup(e, pickups) {
  if (e.boss) return;
  if (Math.random() > PICKUP_DROP_CHANCE) return;
  const kind = Math.random() < 0.5 ? 'rocket' : 'laser';
  pickups.push(createPickup(e.x, e.y, kind));
}

let nextPickupId = 1;
export function createPickup(x, y, weapon) {
  return {
    id: nextPickupId++,
    weapon,
    sprite: weapon === 'rocket' ? 'pickupRocket' : 'pickupLaser',
    x, y,
    vy: PICKUP_FALL_VY,
    width: 6,
    height: 6,
    expireAt: performance.now() + PICKUP_LIFETIME_MS,
  };
}

export function updatePickups(pickups, dt, now) {
  for (let i = pickups.length - 1; i >= 0; i--) {
    const p = pickups[i];
    p.y += p.vy * dt;
    if (p.y > VIEW_H + 10 || now > p.expireAt) pickups.splice(i, 1);
  }
}
