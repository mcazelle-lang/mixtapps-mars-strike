import { VIEW_W, VIEW_H, STAR_LAYERS, PROJECTILE_DEFS } from './config.js';
import { getSprite, preloadSprites } from './sprites.js';

let scaleCanvas = null;
let scaleCtx = null;
let off = null;
let offCtx = null;

const stars = [];

export function setupCanvas(canvas) {
  scaleCanvas = canvas;
  scaleCtx = canvas.getContext('2d');
  scaleCtx.imageSmoothingEnabled = false;
  off = document.createElement('canvas');
  off.width = VIEW_W;
  off.height = VIEW_H;
  offCtx = off.getContext('2d');
  offCtx.imageSmoothingEnabled = false;
  preloadSprites();
  initStars();
  resize();
  return offCtx;
}

export function resize() {
  if (!scaleCanvas) return;
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const cw = scaleCanvas.clientWidth || window.innerWidth;
  const ch = scaleCanvas.clientHeight || window.innerHeight;
  scaleCanvas.width = Math.floor(cw * dpr);
  scaleCanvas.height = Math.floor(ch * dpr);
  scaleCtx.setTransform(1, 0, 0, 1, 0, 0);
  scaleCtx.imageSmoothingEnabled = false;
}

function initStars() {
  stars.length = 0;
  for (const layer of STAR_LAYERS) {
    for (let i = 0; i < layer.count; i++) {
      stars.push({
        x: Math.floor(Math.random() * VIEW_W),
        y: Math.floor(Math.random() * VIEW_H),
        speed: layer.speed,
        color: layer.color,
      });
    }
  }
}

export function clearScene(progress) {
  const top = '#1a0816';
  const bottomA = '#3a0a1a';
  const bottomB = '#2a0414';
  const t = progress < 0 ? 0 : progress > 1 ? 1 : progress;
  const grad = offCtx.createLinearGradient(0, 0, 0, VIEW_H);
  grad.addColorStop(0, top);
  grad.addColorStop(0.6, lerpHex(bottomA, '#5a1a0a', t));
  grad.addColorStop(1, lerpHex(bottomB, '#7a2008', t));
  offCtx.fillStyle = grad;
  offCtx.fillRect(0, 0, VIEW_W, VIEW_H);
}

export function updateStars(dt) {
  for (const s of stars) {
    s.y += s.speed * dt;
    if (s.y >= VIEW_H) {
      s.y = 0;
      s.x = Math.floor(Math.random() * VIEW_W);
    }
  }
}

export function drawStars() {
  for (const s of stars) {
    offCtx.fillStyle = s.color;
    offCtx.fillRect(s.x | 0, s.y | 0, 1, 1);
  }
}

export function drawSprite(name, x, y, opts = {}) {
  const sp = getSprite(name);
  if (!sp) return;
  const cx = Math.round(x - sp.w / 2);
  const cy = Math.round(y - sp.h / 2);
  if (opts.flash) offCtx.globalAlpha = 0.4;
  offCtx.drawImage(sp.canvas, cx, cy);
  if (opts.flash) offCtx.globalAlpha = 1;
}

export function drawProjectile(p) {
  const def = PROJECTILE_DEFS[p.kind];
  if (!def) return;
  offCtx.fillStyle = def.color;
  const x = Math.round(p.x - def.w / 2);
  const y = Math.round(p.y - def.h / 2);
  offCtx.fillRect(x, y, def.w, def.h);
  if (p.kind === 'rocket') {
    offCtx.fillStyle = '#ffd24a';
    offCtx.fillRect(x + 1, y + def.h, def.w - 2, 2);
  }
  if (p.kind === 'laser') {
    offCtx.fillStyle = '#ffffff';
    offCtx.fillRect(x + 1, y, 1, def.h);
  }
}

export function drawExplosion(ex) {
  const r = ex.radius;
  const cx = Math.round(ex.x);
  const cy = Math.round(ex.y);
  // ring
  offCtx.fillStyle = ex.life > 0.5 ? '#ffd24a' : '#ff7a3a';
  for (let a = 0; a < 12; a++) {
    const ang = (a / 12) * Math.PI * 2;
    const px = Math.round(cx + Math.cos(ang) * r);
    const py = Math.round(cy + Math.sin(ang) * r);
    offCtx.fillRect(px, py, 2, 2);
  }
  if (r < 5) {
    offCtx.fillStyle = '#ffffff';
    offCtx.fillRect(cx - 1, cy - 1, 3, 3);
  }
}

export function drawHpBar(x, y, w, hp, maxHp) {
  const px = Math.round(x - w / 2);
  const py = Math.round(y);
  offCtx.fillStyle = '#000';
  offCtx.fillRect(px - 1, py - 1, w + 2, 4);
  offCtx.fillStyle = '#5a1010';
  offCtx.fillRect(px, py, w, 2);
  const filled = Math.max(0, Math.floor(w * (hp / maxHp)));
  offCtx.fillStyle = hp > maxHp / 2 ? '#7ade5e' : '#ff7a3a';
  offCtx.fillRect(px, py, filled, 2);
}

export function getOffCtx() {
  return offCtx;
}

export function present() {
  // scale from off (VIEW_W x VIEW_H) to scaleCanvas
  const cw = scaleCanvas.width;
  const ch = scaleCanvas.height;
  scaleCtx.imageSmoothingEnabled = false;
  // letterbox to keep aspect ratio
  const targetAspect = VIEW_W / VIEW_H;
  const screenAspect = cw / ch;
  let drawW, drawH;
  if (screenAspect > targetAspect) {
    drawH = ch;
    drawW = Math.round(ch * targetAspect);
  } else {
    drawW = cw;
    drawH = Math.round(cw / targetAspect);
  }
  const dx = Math.floor((cw - drawW) / 2);
  const dy = Math.floor((ch - drawH) / 2);
  scaleCtx.fillStyle = '#000';
  scaleCtx.fillRect(0, 0, cw, ch);
  scaleCtx.drawImage(off, 0, 0, VIEW_W, VIEW_H, dx, dy, drawW, drawH);
}

function lerpHex(a, b, t) {
  const ca = parseHex(a);
  const cb = parseHex(b);
  const r = Math.round(ca[0] + (cb[0] - ca[0]) * t);
  const g = Math.round(ca[1] + (cb[1] - ca[1]) * t);
  const bl = Math.round(ca[2] + (cb[2] - ca[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

function parseHex(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}

export function getViewSize() {
  return { w: VIEW_W, h: VIEW_H };
}

// Map a pointer event in the visible canvas to logical coords.
export function pointerToLogical(clientX, clientY) {
  if (!scaleCanvas) return { x: 0, y: 0 };
  const rect = scaleCanvas.getBoundingClientRect();
  const cw = scaleCanvas.clientWidth;
  const ch = scaleCanvas.clientHeight;
  const targetAspect = VIEW_W / VIEW_H;
  const screenAspect = cw / ch;
  let drawW, drawH;
  if (screenAspect > targetAspect) { drawH = ch; drawW = ch * targetAspect; }
  else { drawW = cw; drawH = cw / targetAspect; }
  const dx = (cw - drawW) / 2;
  const dy = (ch - drawH) / 2;
  const lx = ((clientX - rect.left - dx) / drawW) * VIEW_W;
  const ly = ((clientY - rect.top - dy) / drawH) * VIEW_H;
  return { x: lx, y: ly };
}
