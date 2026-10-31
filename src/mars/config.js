// Logical (pixel-art) canvas resolution. The visible canvas is scaled up.
export const VIEW_W = 256;
export const VIEW_H = 384;

export const PLAYER_SPEED = 130;        // px/s in pixel space
export const PLAYER_SHIELDS = 3;
export const PLAYER_INVULN_MS = 900;
export const PLAYER_FIRE_COOLDOWN_MS = {
  machinegun: 130,
  rocket: 380,
  laser: 70,
};
export const WEAPON_DURATION_MS = {
  rocket: 12000,
  laser: 8000,
};

// Weapons available. machinegun is the default.
export const WEAPON_TYPES = ['machinegun', 'rocket', 'laser'];
export const WEAPON_LABELS = {
  machinegun: 'MITRAILLETTE',
  rocket: 'ROQUETTE',
  laser: 'LASER',
};

export const PICKUP_DROP_CHANCE = 0.18;  // chance an alien drops a power-up
export const PICKUP_FALL_VY = 60;
export const PICKUP_LIFETIME_MS = 8000;

export const ENEMY_DEFS = {
  grunt: { hp: 1, w: 16, h: 12, speed: 50, score: 10, color: '#7ade5e', shootChance: 0, sprite: 'grunt' },
  drone: { hp: 2, w: 16, h: 16, speed: 60, score: 25, color: '#ef64a8', shootChance: 0.0008, sprite: 'drone' },
  heavy: { hp: 3, w: 20, h: 16, speed: 40, score: 50, color: '#ffb01a', shootChance: 0.0014, sprite: 'heavy' },
  saucer: { hp: 4, w: 24, h: 12, speed: 80, score: 80, color: '#ff5b5b', shootChance: 0.002, sprite: 'saucer' },
  boss: { hp: 60, w: 64, h: 48, speed: 24, score: 1000, color: '#ff3a3a', shootChance: 0.012, sprite: 'boss' },
};

// Wave composition — list of {type, count, delayMs}
// Boss in wave 5 = arrival on Mars when destroyed.
export const WAVES = [
  { id: 1, label: 'VAGUE 1', spawns: [
    { type: 'grunt', count: 8, delayMs: 700 },
  ] },
  { id: 2, label: 'VAGUE 2', spawns: [
    { type: 'grunt', count: 6, delayMs: 600 },
    { type: 'drone', count: 4, delayMs: 900 },
  ] },
  { id: 3, label: 'VAGUE 3', spawns: [
    { type: 'drone', count: 6, delayMs: 700 },
    { type: 'heavy', count: 3, delayMs: 1100 },
    { type: 'grunt', count: 5, delayMs: 600 },
  ] },
  { id: 4, label: 'VAGUE 4', spawns: [
    { type: 'heavy', count: 4, delayMs: 900 },
    { type: 'saucer', count: 4, delayMs: 1000 },
    { type: 'drone', count: 6, delayMs: 600 },
  ] },
  { id: 5, label: 'BOSS DE MARS', spawns: [
    { type: 'saucer', count: 4, delayMs: 800 },
    { type: 'boss', count: 1, delayMs: 1500 },
  ] },
];

export const PROJECTILE_DEFS = {
  bullet: { vy: -380, w: 2, h: 6, damage: 1, color: '#ffe566' },
  rocket: { vy: -260, w: 4, h: 10, damage: 4, color: '#ff7a3a', splash: 32 },
  laser:  { vy: -520, w: 3, h: 14, damage: 1, color: '#7df0ff' },
  enemyBullet: { vy: 200, w: 3, h: 6, damage: 1, color: '#ff4a4a' },
};

export const STAR_LAYERS = [
  { count: 30, speed: 12, color: '#3a3a4a' },
  { count: 22, speed: 28, color: '#7a7a90' },
  { count: 14, speed: 50, color: '#ffffff' },
];

export const PROGRESS_PER_WAVE = 0.2; // 5 waves -> 100%
