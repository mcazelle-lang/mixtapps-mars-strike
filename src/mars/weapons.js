import { PROJECTILE_DEFS, PLAYER_FIRE_COOLDOWN_MS, WEAPON_DURATION_MS } from './config.js';

let nextProjectileId = 1;

export function createPlayerProjectile(kind, x, y) {
  const def = PROJECTILE_DEFS[kind];
  return {
    id: nextProjectileId++,
    kind,
    x, y,
    vx: 0,
    vy: def.vy,
    w: def.w,
    h: def.h,
    damage: def.damage,
    splash: def.splash || 0,
    fromPlayer: true,
    alive: true,
  };
}

export function createEnemyProjectile(x, y, vx = 0) {
  const def = PROJECTILE_DEFS.enemyBullet;
  return {
    id: nextProjectileId++,
    kind: 'enemyBullet',
    x, y,
    vx,
    vy: def.vy,
    w: def.w,
    h: def.h,
    damage: def.damage,
    splash: 0,
    fromPlayer: false,
    alive: true,
  };
}

export function fire(player, now, projectiles) {
  if (now < player.fireReadyAt) return false;
  const cd = PLAYER_FIRE_COOLDOWN_MS[player.weapon];
  player.fireReadyAt = now + cd;
  if (player.weapon === 'machinegun') {
    projectiles.push(createPlayerProjectile('bullet', player.x, player.y - 8));
  } else if (player.weapon === 'rocket') {
    projectiles.push(createPlayerProjectile('rocket', player.x - 4, player.y - 4));
    projectiles.push(createPlayerProjectile('rocket', player.x + 4, player.y - 4));
  } else if (player.weapon === 'laser') {
    projectiles.push(createPlayerProjectile('laser', player.x, player.y - 10));
  }
  return true;
}

export function pickupWeapon(player, now, weapon) {
  player.weapon = weapon;
  const dur = WEAPON_DURATION_MS[weapon] ?? 0;
  player.weaponExpiresAt = dur > 0 ? now + dur : 0;
}

export function tickWeaponExpiry(player, now) {
  if (player.weaponExpiresAt && now >= player.weaponExpiresAt) {
    player.weapon = 'machinegun';
    player.weaponExpiresAt = 0;
  }
}

export function updateProjectiles(projectiles, dt, viewW, viewH) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.y < -20 || p.y > viewH + 20 || p.x < -20 || p.x > viewW + 20 || !p.alive) {
      projectiles.splice(i, 1);
    }
  }
}
