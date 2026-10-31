// Each sprite is a grid of characters. Each char maps to a color in the palette
// (or '.' = transparent). Sprites are pre-rendered to offscreen canvases.

const PLAYER = [
  '.....X.....',
  '.....X.....',
  '....XBX....',
  '....XBX....',
  '...XXBXX...',
  '...XYYYX...',
  '..XXYYYXX..',
  '..XYYYYYX..',
  '..XYYYYYX..',
  '.RXXYYYXXR.',
  'RRX.YYY.XRR',
  'RR..YYY..RR',
  'R...FOF...R',
  '....OOO....',
  '....OFO....',
  '.....F.....',
];
const PLAYER_PALETTE = { X: '#dde3ee', B: '#3aa9ff', Y: '#7ec0ff', R: '#e84a4a', F: '#ffd24a', O: '#ff7a2a' };

const GRUNT = [
  '...XXXX...',
  '..XXXXXX..',
  '.XX.XX.XX.',
  'XXXXXXXXXX',
  'X.XXXXXX.X',
  'X.X....X.X',
  '...XX.XX..',
];
const GRUNT_PALETTE = { X: '#7ade5e' };

const DRONE = [
  '..XXBBXX..',
  '.XBBBBBBX.',
  'XBBYYYYBBX',
  'XBYBYYBYBX',
  'XBBYYYYBBX',
  '.XBBBBBBX.',
  '..XXXXXX..',
  '..X.XX.X..',
];
const DRONE_PALETTE = { X: '#ef64a8', B: '#ff9ad4', Y: '#ffe2f4' };

const HEAVY = [
  '..XXXXXXXX..',
  '.XXYYYYYYXX.',
  'XXYBBBBBBYXX',
  'XYBWWBBWWBYX',
  'XYBWWBBWWBYX',
  'XXYBBBBBBYXX',
  '.XXYYYYYYXX.',
  '..XX.XX.XX..',
];
const HEAVY_PALETTE = { X: '#ffb01a', Y: '#ffd368', B: '#5a3000', W: '#ffffff' };

const SAUCER = [
  '....XXXXXXXX....',
  '...XXBBBBBBXX...',
  '..XXBBYYYYBBXX..',
  '.XXBBYYYYYYBBXX.',
  'XXBBBBBBBBBBBBXX',
  '.RR.RR.RR.RR.RR.',
];
const SAUCER_PALETTE = { X: '#ff5b5b', B: '#ff8a8a', Y: '#ffe0e0', R: '#ffd24a' };

const BOSS = [
  '......XXXXXXXXXXXX......',
  '....XXBBBBBBBBBBBBXX....',
  '...XBBYYYYYYYYYYYYBBX...',
  '..XBBYRWWBBBBBBWWRYBBX..',
  '.XBBYYRWBBYYYYBBWRYYBBX.',
  'XBBYYYYYYYYYYYYYYYYYYBBX',
  'XBBYYBBBBYYYYYYBBBBYYBBX',
  'XBBYYBYYBYYYYYYBYYBYYBBX',
  'XBBYYBBBBYYYYYYBBBBYYBBX',
  'XBBYYYYYYYYYYYYYYYYYYBBX',
  '.XBBBYYYYYYYYYYYYYYBBBX.',
  '..XBBBBBBBBBBBBBBBBBBX..',
  '...XX.RR.RR.RR.RR.XX....',
];
const BOSS_PALETTE = { X: '#ff3a3a', B: '#c41a1a', Y: '#ff8a8a', R: '#ffd24a', W: '#3a0000' };

const ENEMY_BULLET = [
  '.X.',
  'XXX',
  'XYX',
  'XXX',
  '.X.',
];
const ENEMY_BULLET_PALETTE = { X: '#ff4a4a', Y: '#ffe0e0' };

const PICKUP_ROCKET = [
  '.YYYY.',
  'YBBBBY',
  'YBRRBY',
  'YBRRBY',
  'YBBBBY',
  '.YYYY.',
];
const PICKUP_ROCKET_PALETTE = { Y: '#ffd24a', B: '#0a1a3a', R: '#ff7a3a' };

const PICKUP_LASER = [
  '.YYYY.',
  'YBBBBY',
  'YBLLBY',
  'YBLLBY',
  'YBBBBY',
  '.YYYY.',
];
const PICKUP_LASER_PALETTE = { Y: '#ffd24a', B: '#0a1a3a', L: '#7df0ff' };

export const SPRITE_DEFS = {
  player:       { rows: PLAYER, palette: PLAYER_PALETTE },
  grunt:        { rows: GRUNT, palette: GRUNT_PALETTE },
  drone:        { rows: DRONE, palette: DRONE_PALETTE },
  heavy:        { rows: HEAVY, palette: HEAVY_PALETTE },
  saucer:       { rows: SAUCER, palette: SAUCER_PALETTE },
  boss:         { rows: BOSS, palette: BOSS_PALETTE },
  enemyBullet:  { rows: ENEMY_BULLET, palette: ENEMY_BULLET_PALETTE },
  pickupRocket: { rows: PICKUP_ROCKET, palette: PICKUP_ROCKET_PALETTE },
  pickupLaser:  { rows: PICKUP_LASER, palette: PICKUP_LASER_PALETTE },
};

const cache = {};

export function getSprite(name) {
  if (cache[name]) return cache[name];
  const def = SPRITE_DEFS[name];
  if (!def) return null;
  const w = def.rows[0].length;
  const h = def.rows.length;
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const ctx = off.getContext('2d');
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = def.rows[y][x];
      if (ch === '.' || ch === ' ') continue;
      const color = def.palette[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  cache[name] = { canvas: off, w, h };
  return cache[name];
}

export function preloadSprites() {
  for (const name of Object.keys(SPRITE_DEFS)) getSprite(name);
}
