let ctx = null;
let masterGain = null;
let muted = false;

export function setMuted(value) {
  muted = Boolean(value);
  if (masterGain) {
    masterGain.gain.value = muted ? 0 : 1;
  }
}

export function isMuted() {
  return muted;
}

export function init() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  try {
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = muted ? 0 : 1;
    masterGain.connect(ctx.destination);
  } catch {
    ctx = null;
  }
}

function envelope(node, t, attack, hold, release, peak = 0.6) {
  const start = t;
  node.gain.setValueAtTime(0.0001, start);
  node.gain.exponentialRampToValueAtTime(peak, start + attack);
  node.gain.setValueAtTime(peak, start + attack + hold);
  node.gain.exponentialRampToValueAtTime(0.0001, start + attack + hold + release);
}

function makeOsc(type, freq, t) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  return o;
}

function play(buildFn) {
  if (!ctx || muted) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  buildFn(ctx.currentTime);
}

export function playLiftoff() {
  play((t) => {
    const g = ctx.createGain();
    g.connect(masterGain);
    const o = makeOsc('sawtooth', 80, t);
    o.frequency.exponentialRampToValueAtTime(180, t + 0.9);
    const noiseG = ctx.createGain();
    noiseG.gain.value = 0.4;
    noiseG.connect(g);
    const buf = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.connect(noiseG);
    o.connect(g);
    envelope(g, t, 0.05, 0.6, 0.4, 0.5);
    o.start(t);
    o.stop(t + 1.1);
    noise.start(t);
  });
}

export function playCollision() {
  play((t) => {
    const g = ctx.createGain();
    g.connect(masterGain);
    const o = makeOsc('square', 220, t);
    o.frequency.exponentialRampToValueAtTime(80, t + 0.18);
    o.connect(g);
    envelope(g, t, 0.005, 0.05, 0.18, 0.5);
    o.start(t);
    o.stop(t + 0.3);
  });
}

export function playButton() {
  play((t) => {
    const g = ctx.createGain();
    g.connect(masterGain);
    const o = makeOsc('triangle', 600, t);
    o.frequency.exponentialRampToValueAtTime(900, t + 0.08);
    o.connect(g);
    envelope(g, t, 0.005, 0.02, 0.08, 0.35);
    o.start(t);
    o.stop(t + 0.15);
  });
}

export function playShieldLoss() {
  play((t) => {
    const g = ctx.createGain();
    g.connect(masterGain);
    const o = makeOsc('sine', 520, t);
    o.frequency.exponentialRampToValueAtTime(180, t + 0.35);
    o.connect(g);
    envelope(g, t, 0.01, 0.05, 0.4, 0.35);
    o.start(t);
    o.stop(t + 0.5);
  });
}

export function playShoot() {
  play((t) => {
    const g = ctx.createGain();
    g.connect(masterGain);
    const o = makeOsc('square', 880, t);
    o.frequency.exponentialRampToValueAtTime(440, t + 0.06);
    o.connect(g);
    envelope(g, t, 0.001, 0.02, 0.06, 0.18);
    o.start(t);
    o.stop(t + 0.1);
  });
}

export function playRocket() {
  play((t) => {
    const g = ctx.createGain();
    g.connect(masterGain);
    const o = makeOsc('sawtooth', 220, t);
    o.frequency.exponentialRampToValueAtTime(60, t + 0.25);
    o.connect(g);
    envelope(g, t, 0.005, 0.05, 0.22, 0.3);
    o.start(t);
    o.stop(t + 0.35);
  });
}

export function playLaser() {
  play((t) => {
    const g = ctx.createGain();
    g.connect(masterGain);
    const o = makeOsc('sawtooth', 1400, t);
    o.frequency.exponentialRampToValueAtTime(900, t + 0.08);
    o.connect(g);
    envelope(g, t, 0.001, 0.02, 0.06, 0.16);
    o.start(t);
    o.stop(t + 0.1);
  });
}

export function playExplosion() {
  play((t) => {
    const g = ctx.createGain();
    g.connect(masterGain);
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.exponentialRampToValueAtTime(120, t + 0.4);
    noise.connect(filter);
    filter.connect(g);
    envelope(g, t, 0.005, 0.05, 0.35, 0.5);
    noise.start(t);
  });
}

export function playPickup() {
  play((t) => {
    const notes = [523.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const start = t + i * 0.06;
      const g = ctx.createGain();
      g.connect(masterGain);
      const o = makeOsc('square', freq, start);
      o.connect(g);
      envelope(g, start, 0.005, 0.04, 0.06, 0.3);
      o.start(start);
      o.stop(start + 0.12);
    });
  });
}

export function playEnemyShoot() {
  play((t) => {
    const g = ctx.createGain();
    g.connect(masterGain);
    const o = makeOsc('square', 280, t);
    o.frequency.exponentialRampToValueAtTime(160, t + 0.12);
    o.connect(g);
    envelope(g, t, 0.005, 0.04, 0.1, 0.16);
    o.start(t);
    o.stop(t + 0.18);
  });
}

export function playWaveStart() {
  play((t) => {
    const o1 = makeOsc('triangle', 392, t);
    const o2 = makeOsc('triangle', 587.33, t + 0.18);
    const g1 = ctx.createGain();
    const g2 = ctx.createGain();
    g1.connect(masterGain); g2.connect(masterGain);
    o1.connect(g1); o2.connect(g2);
    envelope(g1, t, 0.01, 0.12, 0.15, 0.4);
    envelope(g2, t + 0.18, 0.01, 0.18, 0.18, 0.45);
    o1.start(t); o1.stop(t + 0.4);
    o2.start(t + 0.18); o2.stop(t + 0.6);
  });
}

export function playVictory() {
  play((t) => {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const start = t + i * 0.16;
      const g = ctx.createGain();
      g.connect(masterGain);
      const o = makeOsc('triangle', freq, start);
      o.connect(g);
      envelope(g, start, 0.01, 0.12, 0.18, 0.45);
      o.start(start);
      o.stop(start + 0.4);
    });
  });
}
