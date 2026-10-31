import { STORAGE_KEY, STORAGE_VERSION, DIFFICULTY_LEVELS, DIFFICULTY_DEFAULT_INDEX } from '../game/config.js';

const DEFAULTS = Object.freeze({
  version: STORAGE_VERSION,
  mute: false,
  bestAltitude: 0,
  difficultyIndex: DIFFICULTY_DEFAULT_INDEX,
});

function clampDifficulty(idx) {
  const n = Math.floor(Number(idx));
  if (Number.isNaN(n)) return DIFFICULTY_DEFAULT_INDEX;
  if (n < 0) return 0;
  if (n >= DIFFICULTY_LEVELS.length) return DIFFICULTY_LEVELS.length - 1;
  return n;
}

export function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== STORAGE_VERSION) return { ...DEFAULTS };
    return {
      version: STORAGE_VERSION,
      mute: Boolean(parsed.mute),
      bestAltitude: Math.max(0, Math.floor(Number(parsed.bestAltitude) || 0)),
      difficultyIndex: clampDifficulty(parsed.difficultyIndex ?? DIFFICULTY_DEFAULT_INDEX),
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function save(prefs) {
  try {
    const payload = {
      version: STORAGE_VERSION,
      mute: Boolean(prefs.mute),
      bestAltitude: Math.max(0, Math.floor(Number(prefs.bestAltitude) || 0)),
      difficultyIndex: clampDifficulty(prefs.difficultyIndex ?? DIFFICULTY_DEFAULT_INDEX),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* mode privé / quota plein → silencieux par contrat */
  }
}
