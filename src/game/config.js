export const STORAGE_KEY = 'decollage-fusee';
export const STORAGE_VERSION = 1;

export const PLAYFIELD_MAX_WIDTH = 720;
export const KEYBOARD_DRIFT_VX = 320;

export const ROCKET_VY = 220;
export const ROCKET_VY_MAX = 380;
export const ROCKET_VY_MIN = -140;
export const ROCKET_SMOOTH_K = 8;
export const ROCKET_THROTTLE_SMOOTH_K = 4;
export const ROCKET_SHIELDS_INITIAL = 3;

export const DIFFICULTY_LEVELS = [
  { id: 'easy', label: 'Facile', multiplier: 0.6 },
  { id: 'normal', label: 'Normal', multiplier: 1.0 },
  { id: 'hard', label: 'Difficile', multiplier: 1.6 },
];
export const DIFFICULTY_DEFAULT_INDEX = 1;
export const INVULN_MS = 800;
export const HITBOX_SCALE = 0.7;

export const MAX_DELTA_MS = 50;
export const OFFSCREEN_MARGIN = 120;

export const COUNTDOWN_SECONDS = 10;
export const GAME_DURATION_SECONDS = 60;

// Time-based phases. Stages introduce obstacle types in order within a phase.
// Gaps between phases let previous obstacles drain off-screen so the coexistence
// rules (1+2+3, 2+3+4, 5+6) are respected at all times.
export const PHASES = [
  {
    id: 1, name: 'BASSE', startS: 0, endS: 15,
    maxSimultaneous: 6,
    stages: [
      { fromS: 0,  types: ['bird'],                          spawnRatePerSec: 2.2 },
      { fromS: 6,  types: ['bird', 'helicopter'],            spawnRatePerSec: 1.8 },
      { fromS: 11, types: ['bird', 'helicopter', 'cloud'],   spawnRatePerSec: 1.6 },
    ],
  },
  {
    id: 2, name: 'HAUTE', startS: 20, endS: 35,
    maxSimultaneous: 5,
    stages: [
      { fromS: 20, types: ['helicopter', 'cloud'],           spawnRatePerSec: 1.3 },
      { fromS: 26, types: ['helicopter', 'cloud', 'plane'],  spawnRatePerSec: 1.5 },
    ],
  },
  {
    id: 3, name: 'ESPACE', startS: 40, endS: 57,
    maxSimultaneous: 4,
    stages: [
      { fromS: 40, types: ['satellite'],                     spawnRatePerSec: 1.0 },
      { fromS: 47, types: ['satellite', 'ufo'],              spawnRatePerSec: 1.2 },
    ],
  },
];

// Background gradient stops as a function of game progress (0..1).
export const BACKGROUND_STOPS = [
  { t: 0.00, top: '#7ec8ff', bottom: '#b9e2ff' },
  { t: 0.30, top: '#5aa6ff', bottom: '#9ec9ff' },
  { t: 0.55, top: '#3a7ad6', bottom: '#7ea8d6' },
  { t: 0.80, top: '#0a1a3a', bottom: '#1a3a8a' },
  { t: 1.00, top: '#050818', bottom: '#1a0a3a' },
];
