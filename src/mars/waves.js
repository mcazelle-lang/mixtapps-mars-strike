import { WAVES } from './config.js';

export function createWaveRunner() {
  return {
    waveIndex: 0,
    spawnIndex: 0,
    spawnedInGroup: 0,
    nextSpawnAt: 0,
    interWaveAt: 0,
    state: 'banner', // banner | spawning | clearing | done
    bannerUntil: 0,
  };
}

export function startWave(runner, now, onBanner) {
  runner.state = 'banner';
  runner.spawnIndex = 0;
  runner.spawnedInGroup = 0;
  runner.bannerUntil = now + 1800;
  runner.nextSpawnAt = runner.bannerUntil;
  if (onBanner) onBanner(WAVES[runner.waveIndex]);
}

export function tickWaves(runner, now, enemies, spawnEnemyFn) {
  const wave = WAVES[runner.waveIndex];
  if (!wave) return;

  if (runner.state === 'banner') {
    if (now >= runner.bannerUntil) {
      runner.state = 'spawning';
    } else {
      return;
    }
  }

  if (runner.state === 'spawning') {
    const group = wave.spawns[runner.spawnIndex];
    if (!group) {
      runner.state = 'clearing';
      return;
    }
    if (now >= runner.nextSpawnAt && runner.spawnedInGroup < group.count) {
      const e = spawnEnemyFn(group.type);
      if (e) enemies.push(e);
      runner.spawnedInGroup++;
      runner.nextSpawnAt = now + group.delayMs;
    }
    if (runner.spawnedInGroup >= group.count) {
      runner.spawnIndex++;
      runner.spawnedInGroup = 0;
      runner.nextSpawnAt = now + 600;
    }
  }

  if (runner.state === 'clearing') {
    if (enemies.length === 0) {
      runner.state = 'done';
    }
  }
}

export function isWaveDone(runner) {
  return runner.state === 'done';
}

export function nextWave(runner) {
  runner.waveIndex++;
  return runner.waveIndex < WAVES.length;
}

export function getCurrentWave(runner) {
  return WAVES[runner.waveIndex];
}

export function getWaveCount() {
  return WAVES.length;
}
