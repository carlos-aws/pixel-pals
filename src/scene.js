// Canvas scene: low-resolution pixel renderer for the pet's room.
// Draws background themes with a day/night cycle, the animated pet, emotes,
// particles and the care / hatch / evolve sequences.

import { petRows, petPalette, EGG_ART, SPECIES, C, spriteCanvas, silhouette, iconCanvas, HATS } from './sprites.js';
import { mood, canEvolve } from './pet.js';
import { clamp, lerp, randInt, pick, chance } from './util.js';

export const BACKGROUNDS = {
  meadow: { name: 'Meadow', price: 0, sky: ['#7ec8ff', '#c9ecff'], night: ['#0d1033', '#2a2f6e'] },
  bedroom: { name: 'Bedroom', price: 60, sky: ['#ffe9c4', '#ffe9c4'], night: ['#3a2a55', '#3a2a55'] },
  beach: { name: 'Beach', price: 80, sky: ['#6fc3ff', '#ffe0a8'], night: ['#0b1440', '#3a3f7a'] },
  forest: { name: 'Forest', price: 90, sky: ['#9fe0ff', '#dff7d8'], night: ['#0a1a2a', '#1c3350'] },
  space: { name: 'Space', price: 120, sky: ['#05061a', '#151a4d'], night: ['#05061a', '#151a4d'] },
};

let PET_SCALE = 2;

function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  const c = A.map((v, i) => Math.round(lerp(v, B[i], t)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

/** 0 in the day, 1 at night, ramps at dawn and dusk. */
export function darkness(date = new Date()) {
  const h = date.getHours() + date.getMinutes() / 60;
  if (h >= 20.5 || h < 5.5) return 1;
  if (h < 7) return 1 - (h - 5.5) / 1.5;
  if (h >= 19) return (h - 19) / 1.5;
  return 0;
}

const blinkCache = new Map();
function blinkRows(rows) {
  const key = rows.join('|');
  if (blinkCache.has(key)) return blinkCache.get(key);
  let bottom = -1;
  rows.forEach((r, i) => { if (r.includes('e')) bottom = i; });
  const out = rows.map((r, i) => r.replace(/[ew]/g, i === bottom ? 'k' : 'a'));
  blinkCache.set(key, out);
  return out;
}

export function createScene(canvas, opts) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  let W = 160, H = 120, scale = 2;
  let running = false;
  let last = 0;
  let t = 0;
  const particles = [];
  let action = null;
  const pet = { x: 80, dir: 1, hop: 0, sx: 1, sy: 1, blink: 0, nextBlink: 2, walkTarget: null, nextWalk: 3, wobble: 0 };
  let shake = 0, flash = 0, dark = 0;
  let stars = [];
  const clouds = [];
  let zzzTimer = 0;
  let sparkleTimer = 0;
  const emit = (name, data) => opts.onEvent?.(name, data);

  function resize() {
    const box = canvas.parentElement.getBoundingClientRect();
    const cw = Math.max(120, Math.floor(box.width));
    const ch = Math.max(100, Math.floor(box.height));
    scale = clamp(Math.floor(cw / 160), 2, 6);
    W = Math.floor(cw / scale);
    H = Math.floor(ch / scale);
    canvas.width = W; canvas.height = H;
    canvas.style.width = W * scale + 'px';
    canvas.style.height = H * scale + 'px';
    ctx.imageSmoothingEnabled = false;
    PET_SCALE = H >= 240 && W >= 170 ? 4 : H >= 170 && W >= 170 ? 3 : 2;
    pet.x = clamp(pet.x, W * 0.25, W * 0.75);
    stars = [];
    for (let i = 0; i < 28; i++) stars.push({ x: randInt(0, W - 1), y: randInt(0, Math.floor(H * 0.55)), p: Math.random() * 6 });
    clouds.length = 0;
    for (let i = 0; i < 3; i++) clouds.push({ x: randInt(0, W), y: 8 + i * 12 + randInt(0, 6), w: 18 + randInt(0, 12), s: 2 + i });
  }

  const floorY = () => H - 20;

  // ---- drawing primitives -------------------------------------------------
  const rect = (x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  function disc(cx, cy, r, color) {
    ctx.fillStyle = color;
    for (let dy = -r; dy <= r; dy++) {
      const hw = Math.floor(Math.sqrt(r * r - dy * dy));
      ctx.fillRect(Math.round(cx - hw), Math.round(cy + dy), hw * 2 + 1, 1);
    }
  }
  function ellipse(cx, cy, rx, ry, color) {
    ctx.fillStyle = color;
    for (let dy = -ry; dy <= ry; dy++) {
      const hw = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry))));
      ctx.fillRect(Math.round(cx - hw), Math.round(cy + dy), hw * 2 + 1, 1);
    }
  }
  function drawSprite(img, x, y, s = 1) { ctx.drawImage(img, Math.round(x), Math.round(y), img.width * s, img.height * s); }
  function icon(name, x, y, s = 1) { drawSprite(iconCanvas(name), x, y, s); }

  // ---- backgrounds ----------------------------------------------------------
  function drawSky(theme, d) {
    const bands = 6;
    for (let i = 0; i < bands; i++) {
      const y0 = Math.floor((H * i) / bands), y1 = Math.floor((H * (i + 1)) / bands);
      rect(0, y0, W, y1 - y0, mix(theme.sky[0], theme.sky[1], i / (bands - 1)));
      if (d > 0) { ctx.globalAlpha = d; rect(0, y0, W, y1 - y0, mix(theme.night[0], theme.night[1], i / (bands - 1))); ctx.globalAlpha = 1; }
    }
  }
  function drawStars(d, always = false) {
    const a = always ? 1 : clamp((d - 0.4) / 0.6, 0, 1);
    if (a <= 0) return;
    for (const s of stars) {
      const tw = 0.5 + 0.5 * Math.sin(t * 2 + s.p);
      ctx.globalAlpha = a * (0.4 + 0.6 * tw);
      rect(s.x, s.y, 1, 1, '#ffffff');
      if (tw > 0.8) { rect(s.x - 1, s.y, 1, 1, '#ffffff'); rect(s.x + 1, s.y, 1, 1, '#ffffff'); rect(s.x, s.y - 1, 1, 1, '#ffffff'); rect(s.x, s.y + 1, 1, 1, '#ffffff'); }
    }
    ctx.globalAlpha = 1;
  }
  function drawSunMoon(d) {
    const x = W - 26, y = 16;
    if (d < 0.5) { ctx.globalAlpha = 1 - d * 2; disc(x, y, 6, '#ffe66d'); disc(x, y, 4, '#fff6b0'); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + t * 0.3; rect(x + Math.cos(a) * 9, y + Math.sin(a) * 9, 1, 1, '#ffe66d'); } }
    else { ctx.globalAlpha = (d - 0.5) * 2; disc(x, y, 6, '#fff7d6'); disc(x + 3, y - 2, 5, mix('#0d1033', '#2a2f6e', 0.4)); }
    ctx.globalAlpha = 1;
  }
  function drawClouds(d) {
    ctx.globalAlpha = 1 - d * 0.6;
    for (const c of clouds) {
      const x = ((c.x + t * c.s) % (W + 40)) - 20;
      const col = d > 0.5 ? '#9aa0c8' : '#ffffff';
      rect(x, c.y + 3, c.w, 4, col); rect(x + 3, c.y, c.w - 6, 3, col); rect(x + 6, c.y - 2, c.w - 14, 2, col);
    }
    ctx.globalAlpha = 1;
  }
  function drawMeadow(d) {
    drawSky(BACKGROUNDS.meadow, d); drawStars(d); drawSunMoon(d); drawClouds(d);
    const g1 = mix('#7bd36f', '#2b4a5a', d), g2 = mix('#5cbd5a', '#1f3a48', d), g3 = mix('#4aa94c', '#183040', d);
    ellipse(W * 0.2, floorY() + 6, W * 0.45, 18, g1);
    ellipse(W * 0.8, floorY() + 8, W * 0.45, 22, g2);
    rect(0, floorY(), W, H - floorY(), g3);
    rect(0, floorY(), W, 1, mix('#8fe37f', '#3a5a6a', d));
    for (let x = 3; x < W; x += 11) { rect(x, floorY() - 2, 1, 2, g3); rect(x + 2, floorY() - 3, 1, 3, g3); }
    for (let x = 7; x < W; x += 23) { rect(x, floorY() + 6, 2, 1, mix('#ff8fb1', '#7a4a6a', d)); rect(x + 9, floorY() + 12, 2, 1, mix('#fff06d', '#8a8a4a', d)); }
  }
  function drawBedroom(d) {
    const wall = mix('#ffe1ee', '#3a2a55', d), wall2 = mix('#ffd0e4', '#33244d', d);
    rect(0, 0, W, H, wall);
    for (let y = 0; y < floorY(); y += 12) for (let x = (y / 12) % 2 ? 6 : 0; x < W; x += 12) { rect(x + 2, y + 4, 2, 2, wall2); rect(x + 5, y + 7, 1, 1, wall2); }
    // window
    const wx = Math.round(W / 2) - 16, wy = 10;
    rect(wx - 2, wy - 2, 36, 30, '#8a5a3a');
    const sky = mix('#7ec8ff', '#0d1033', d);
    rect(wx, wy, 32, 26, sky);
    if (d > 0.5) { rect(wx + 6, wy + 6, 1, 1, '#fff'); rect(wx + 20, wy + 4, 1, 1, '#fff'); rect(wx + 25, wy + 14, 1, 1, '#fff'); disc(wx + 24, wy + 8, 3, '#fff7d6'); }
    else { disc(wx + 24, wy + 7, 4, '#ffe66d'); rect(wx + 4, wy + 12, 10, 3, '#fff'); }
    rect(wx + 15, wy, 2, 26, '#8a5a3a'); rect(wx, wy + 12, 32, 2, '#8a5a3a');
    rect(wx - 4, wy + 26, 40, 3, '#a86f48');
    // floor
    const f1 = mix('#d9a066', '#5a4030', d), f2 = mix('#c88f55', '#4a3428', d);
    rect(0, floorY(), W, H - floorY(), f1);
    for (let y = floorY(); y < H; y += 5) rect(0, y, W, 1, f2);
    for (let x = 0; x < W; x += 24) rect(x + ((Math.floor((x / 24)) % 2) * 12), floorY(), 1, H - floorY(), f2);
    ellipse(W / 2, floorY() + 9, 30, 6, mix('#ff9db5', '#6a3a55', d));
    ellipse(W / 2, floorY() + 9, 22, 4, mix('#ffc4d4', '#7a4a65', d));
    // shelf with toys
    rect(8, 34, 26, 3, '#a86f48'); icon('book', 10, 26); icon('ball', 22, 26);
  }
  function drawBeach(d) {
    drawSky(BACKGROUNDS.beach, d); drawStars(d); drawSunMoon(d); drawClouds(d);
    const sea = mix('#3aa0e0', '#12305a', d), sea2 = mix('#5fc0f0', '#1e4470', d);
    const seaY = floorY() - 22;
    rect(0, seaY, W, 22, sea);
    for (let i = 0; i < 4; i++) { const y = seaY + 4 + i * 5; const off = Math.sin(t * 1.5 + i) * 4; for (let x = -10; x < W; x += 14) rect(x + off + i * 3, y, 6, 1, sea2); }
    // sailboat far away
    const bx = ((t * 3) % (W + 30)) - 15;
    rect(bx, seaY + 2, 8, 2, '#a86f48'); rect(bx + 3, seaY - 6, 1, 8, '#2b2340'); rect(bx + 4, seaY - 5, 4, 5, '#ffffff');
    const sand = mix('#f6dfa0', '#5a5040', d), sand2 = mix('#e8c880', '#4a4034', d);
    rect(0, floorY(), W, H - floorY(), sand);
    rect(0, floorY(), W, 2, mix('#fff2c8', '#6a6050', d));
    for (let x = 5; x < W; x += 17) rect(x, floorY() + 8 + (x % 7), 2, 1, sand2);
    icon('star', 10, floorY() + 8); // starfish on the sand
  }
  function drawForest(d) {
    drawSky(BACKGROUNDS.forest, d); drawStars(d); drawSunMoon(d);
    const far = mix('#6fc27a', '#18323f', d), mid = mix('#4ea85e', '#122a36', d), near = mix('#2f8f4a', '#0d2230', d);
    const trunk = mix('#7a4a2a', '#2a1a14', d);
    for (let i = 0; i < 7; i++) { const x = i * (W / 6); disc(x, floorY() - 30, 14, far); }
    for (let i = 0; i < 5; i++) { const x = i * (W / 4) + 10; disc(x, floorY() - 22, 13, mid); rect(x - 2, floorY() - 14, 4, 14, trunk); }
    for (let i = 0; i < 3; i++) { const x = i * (W / 2) - 10; disc(x, floorY() - 12, 12, near); rect(x - 2, floorY() - 8, 4, 8, trunk); }
    rect(0, floorY(), W, H - floorY(), mix('#3f9f52', '#0f2a30', d));
    rect(0, floorY(), W, 1, mix('#6fd36f', '#1f4a4a', d));
    for (let x = 9; x < W; x += 29) { rect(x, floorY() + 6, 3, 2, mix('#ff5d6c', '#6a2a3a', d)); rect(x + 1, floorY() + 8, 1, 2, '#fff'); }
  }
  function drawSpace() {
    drawSky(BACKGROUNDS.space, 0); drawStars(1, true);
    // ringed planet
    const px = W - 30, py = 22;
    disc(px, py, 7, '#ffb36b'); rect(px - 5, py - 1, 10, 1, '#e08a3a'); rect(px - 12, py + 2, 24, 1, '#c9d6ff'); rect(px - 10, py + 3, 20, 1, '#9aa8e0');
    disc(18, 30, 4, '#8fd3ff'); disc(19, 29, 2, '#d8f0ff');
    const g = '#9a9ab8', g2 = '#7a7a98';
    rect(0, floorY(), W, H - floorY(), g);
    rect(0, floorY(), W, 1, '#c8c8e0');
    for (let x = 6; x < W; x += 21) { ellipse(x, floorY() + 8 + (x % 5), 4, 2, g2); ellipse(x, floorY() + 7 + (x % 5), 3, 1, '#b0b0cc'); }
  }
  function drawBackground(theme, d) {
    if (theme === 'bedroom') drawBedroom(d);
    else if (theme === 'beach') drawBeach(d);
    else if (theme === 'forest') drawForest(d);
    else if (theme === 'space') drawSpace();
    else drawMeadow(d);
  }

  // ---- pet ----------------------------------------------------------------
  function currentArt(p) {
    const stage = action?.data?.displayStage ?? p.stage;
    if (stage === 0) {
      const cracked = action?.name === 'hatch' && action.t > action.data.crackAt;
      const pal = { ...C, ...SPECIES[p.species].egg };
      return { rows: cracked ? EGG_ART.crack : EGG_ART.plain, pal, stage };
    }
    return { rows: petRows(p.species, stage), pal: petPalette(p.species, stage), stage };
  }

  function drawPet(p) {
    const art = currentArt(p);
    const blinking = pet.blink > 0 || (action?.name === 'clean' && action.t > 0.4 && action.t < 1.8);
    const rows = blinking && art.stage > 0 ? blinkRows(art.rows) : art.rows;
    let img = spriteCanvas(rows, art.pal);
    if (action?.name === 'evolve' && action.data.white) img = silhouette(rows, '#ffffff');
    const w = img.width * PET_SCALE, h = img.height * PET_SCALE;
    const x = Math.round(pet.x), y = floorY() + 1;
    const hop = pet.hop;
    // shadow
    ctx.globalAlpha = 0.22;
    ellipse(x, y, Math.max(4, Math.round((w / 2) * 0.8 * (1 - hop / 60))), 2, '#000000');
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.translate(x, y - Math.round(hop));
    ctx.scale(pet.dir * pet.sx, pet.sy);
    if (pet.wobble) ctx.rotate(pet.wobble);
    ctx.drawImage(img, -Math.round(w / 2), -h, w, h);
    const hat = opts.getProfile()?.equipped?.hat;
    if (hat && HATS[hat] && art.stage > 0 && !(action?.name === 'evolve' && action.data.white)) {
      const hd = HATS[hat];
      const hc = spriteCanvas(hd.rows, hd.pal, 'hat:' + hat);
      const hw = hc.width * PET_SCALE, hh = hc.height * PET_SCALE;
      ctx.drawImage(hc, -Math.round(hw / 2), -h + hd.dy * PET_SCALE, hw, hh);
    }
    ctx.restore();
    return { x, y, w, h };
  }

  function drawBubble(bx, by, iconName) {
    rect(bx - 8, by - 7, 16, 13, '#ffffff'); rect(bx - 9, by - 6, 18, 11, '#ffffff');
    rect(bx - 9, by - 7, 1, 1, C.k); rect(bx + 8, by - 7, 1, 1, C.k); rect(bx - 9, by + 5, 1, 1, C.k); rect(bx + 8, by + 5, 1, 1, C.k);
    rect(bx - 8, by - 8, 16, 1, C.k); rect(bx - 8, by + 6, 16, 1, C.k); rect(bx - 10, by - 6, 1, 11, C.k); rect(bx + 9, by - 6, 1, 11, C.k);
    rect(bx - 5, by + 8, 2, 2, '#ffffff'); rect(bx - 6, by + 7, 4, 4, C.k); rect(bx - 5, by + 8, 2, 2, '#ffffff');
    rect(bx - 8, by + 12, 1, 1, C.k);
    icon(iconName, bx - 4, by - 4);
  }

  // ---- particles ------------------------------------------------------------
  function spawn(kind, x, y, extra = {}) {
    const base = { kind, x, y, vx: 0, vy: 0, life: 1, max: 1, g: 0, color: '#fff', ...extra };
    base.max = base.life;
    particles.push(base);
  }
  function burst(kind, x, y, n, spread = 30, extra = {}) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = spread * (0.4 + Math.random() * 0.6);
      spawn(kind, x, y, { vx: Math.cos(a) * s, vy: Math.sin(a) * s - 10, life: 0.8 + Math.random() * 0.6, ...extra });
    }
  }
  const CONFETTI = ['#ff5d6c', '#ffd83d', '#5dd35d', '#4fa3ff', '#b07cff', '#ff9db5'];
  function drawParticles() {
    for (const p of particles) {
      const k = p.life / p.max;
      ctx.globalAlpha = p.kind === 'confetti' ? 1 : clamp(k * 2, 0, 1);
      if (p.kind === 'sparkle') {
        const big = Math.floor(p.life * 10) % 2 === 0;
        rect(p.x, p.y, 1, 1, p.color);
        if (big) { rect(p.x - 1, p.y, 1, 1, p.color); rect(p.x + 1, p.y, 1, 1, p.color); rect(p.x, p.y - 1, 1, 1, p.color); rect(p.x, p.y + 1, 1, 1, p.color); }
      } else if (p.kind === 'heart' || p.kind === 'star' || p.kind === 'zed' || p.kind === 'music' || p.kind === 'exclaim') {
        icon(p.kind, p.x - 4, p.y - 4);
      } else if (p.kind === 'crumb') {
        rect(p.x, p.y, 1, 1, p.color);
      } else if (p.kind === 'bubble') {
        const r = p.r || 2;
        rect(p.x - r, p.y, 1, 1, '#bfe9ff'); rect(p.x + r, p.y, 1, 1, '#bfe9ff'); rect(p.x, p.y - r, 1, 1, '#ffffff'); rect(p.x, p.y + r, 1, 1, '#bfe9ff');
        if (r > 2) { rect(p.x - 1, p.y - 1, 1, 1, '#ffffff'); }
      } else if (p.kind === 'confetti') {
        const flip = Math.floor(p.life * 8) % 2 === 0;
        rect(p.x, p.y, flip ? 2 : 1, flip ? 1 : 2, p.color);
      }
    }
    ctx.globalAlpha = 1;
  }
  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.vy += p.g * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.kind === 'bubble' || p.kind === 'heart' || p.kind === 'zed') p.x += Math.sin(p.life * 6) * 0.3;
      if (p.kind === 'confetti' && p.y > floorY() + 10) p.life = 0;
    }
  }

  // ---- actions --------------------------------------------------------------
  function fire(key, fn) {
    action.data.fired ||= {};
    if (!action.data.fired[key]) { action.data.fired[key] = true; fn(); }
  }

  function updateAction(dt, p) {
    if (!action) return;
    action.t += dt;
    const a = action, d = a.data, x = pet.x, top = floorY() - petHeight(p);
    switch (a.name) {
      case 'eat': {
        if (a.t > 0.9) fire('c1', () => { pet.sx = 1.15; pet.sy = 0.85; burst('crumb', x + 10, top + 14, 4, 20, { color: d.color, g: 60 }); emit('eat'); });
        if (a.t > 1.3) fire('c2', () => { pet.sx = 1.15; pet.sy = 0.85; burst('crumb', x + 10, top + 14, 4, 20, { color: d.color, g: 60 }); });
        if (a.t > 1.7) fire('c3', () => { pet.sx = 1.15; pet.sy = 0.85; burst('crumb', x + 10, top + 14, 4, 20, { color: d.color, g: 60 }); });
        if (a.t > 2.0) fire('hearts', () => { for (let i = 0; i < 3; i++) spawn('heart', x - 8 + i * 8, top - 2, { vy: -14, life: 1.2 }); pet.hop = 10; emit('happy'); });
        break;
      }
      case 'play': {
        const phase = Math.min(1, a.t / 1.8);
        d.ballX = lerp(-10, W + 10, phase);
        d.ballY = floorY() - Math.abs(Math.sin(phase * Math.PI * 4)) * 22 - 4;
        pet.dir = d.ballX < x ? -1 : 1;
        [0.3, 0.75, 1.2].forEach((tt, i) => { if (a.t > tt) fire('h' + i, () => { pet.hop = 12; emit('hop'); spawn('music', x + (i % 2 ? 10 : -12), top - 6, { vy: -12, life: 1 }); }); });
        break;
      }
      case 'learn': {
        pet.dir = Math.floor(a.t * 3) % 2 ? -1 : 1;
        if (a.t > 0.2 && Math.random() < 0.3) spawn('bubble', x + randInt(-3, 3), top - 12, { vy: -18, life: 0.8, r: 2 });
        if (a.t > 1.4) fire('spark', () => { burst('sparkle', x, top - 4, 12, 26, { color: '#ffd83d' }); spawn('star', x, top - 14, { vy: -10, life: 1.2 }); pet.hop = 10; emit('sparkle'); });
        break;
      }
      case 'clean': {
        d.spongeX = x + Math.sin(a.t * 9) * 14;
        d.spongeY = top + 6 + Math.abs(Math.cos(a.t * 4)) * 8;
        if (a.t > 0.3 && a.t < 1.9 && Math.random() < 0.5) spawn('bubble', d.spongeX + randInt(-4, 4), d.spongeY, { vy: -20, vx: randInt(-6, 6), life: 1, r: chance(0.5) ? 2 : 3 });
        if (a.t > 1.2) fire('gone', () => { d.dirtGone = true; });
        if (a.t > 2.0) fire('shine', () => { burst('sparkle', x, top + 10, 10, 30, { color: '#ffffff' }); pet.hop = 8; emit('sparkle'); });
        break;
      }
      case 'sleep': { dark = Math.min(1, a.t / 1.0); break; }
      case 'wake': { dark = Math.max(0, 1 - a.t / 0.8); pet.sy = 1 + 0.15 * Math.sin(Math.min(1, a.t / 0.8) * Math.PI); break; }
      case 'hatch': {
        if (a.t < d.crackAt) { const k = a.t / d.crackAt; pet.wobble = Math.sin(a.t * (8 + k * 20)) * 0.12 * (0.3 + k); if (Math.floor(a.t * 6) % 2 === 0 && Math.random() < 0.2) spawn('sparkle', x + randInt(-10, 10), top + randInt(0, 20), { life: 0.5, color: '#fff' }); }
        else pet.wobble = Math.sin(a.t * 30) * 0.05;
        if (a.t > d.crackAt) fire('crack', () => emit('crack'));
        if (a.t > d.revealAt) fire('reveal', () => { flash = 1; shake = 0.5; pet.wobble = 0; d.displayStage = 1; burst('confetti', x, top, 30, 60, { g: 50, life: 1.6, color: pick(CONFETTI) }); particles.slice(-30).forEach((c) => { c.color = pick(CONFETTI); }); burst('sparkle', x, top + 8, 16, 30, { color: '#ffd83d' }); pet.hop = 16; emit('hatch'); });
        break;
      }
      case 'evolve': {
        if (a.t < d.revealAt) {
          const k = a.t / d.revealAt;
          const freq = 3 + k * 20;
          d.white = Math.floor(a.t * freq) % 2 === 0;
          shake = k * 0.6;
          if (Math.random() < 0.3 + k) spawn('sparkle', x + randInt(-16, 16), floorY() - randInt(0, 40), { vy: -20, life: 0.7, color: pick(['#ffd83d', '#ffffff', '#b07cff']) });
        } else {
          fire('reveal', () => { d.white = false; d.displayStage = d.to; flash = 1; shake = 0.6; burst('confetti', x, top, 40, 70, { g: 50, life: 1.8 }); particles.slice(-40).forEach((c) => { c.color = pick(CONFETTI); }); burst('sparkle', x, top + 10, 20, 34, { color: '#ffd83d' }); pet.hop = 18; emit('evolve'); });
        }
        break;
      }
      case 'pet': { if (a.t > 0.05) fire('h', () => { pet.hop = 8; for (let i = 0; i < 3; i++) spawn('heart', x - 8 + i * 8, top - 2 - (i % 2) * 4, { vy: -14, life: 1.1 }); }); break; }
      case 'celebrate': { if (a.t > 0.05) fire('c', () => { burst('confetti', W / 2, H / 3, 40, 70, { g: 50, life: 1.8 }); particles.slice(-40).forEach((c) => { c.color = pick(CONFETTI); }); burst('star', x, top, 5, 30, { life: 1.2 }); pet.hop = 14; }); break; }
      default: break;
    }
    if (a.t >= a.dur) { const done = a; action = null; pet.wobble = 0; done.resolve?.(); }
  }

  function drawActionProps(p) {
    if (!action) return;
    const a = action, d = a.data, x = Math.round(pet.x), top = floorY() - petHeight(p);
    if (a.name === 'eat') {
      const k = clamp(a.t / 0.7, 0, 1);
      const fx = x + 12, fy = lerp(-20, top + 10, 1 - Math.pow(1 - k, 2));
      const bites = a.t > 1.7 ? 3 : a.t > 1.3 ? 2 : a.t > 0.9 ? 1 : 0;
      if (bites < 3) {
        const img = iconCanvas(d.food);
        const keep = 1 - bites / 3;
        ctx.drawImage(img, 0, 0, Math.ceil(img.width * keep), img.height, fx, Math.round(fy), Math.ceil(img.width * keep) * 2, img.height * 2);
      }
    } else if (a.name === 'play') {
      icon('ball', d.ballX - 6, d.ballY - 12, 2);
    } else if (a.name === 'learn') {
      icon('flask', x - 8, top - 26, 2);
    } else if (a.name === 'clean') {
      icon('sponge', d.spongeX - 8, d.spongeY - 8, 2);
    }
  }

  function petHeight(p) {
    const art = currentArt(p);
    return art.rows.length * PET_SCALE;
  }

  // ---- update / draw --------------------------------------------------------
  function update(dt) {
    t += dt;
    const profile = opts.getProfile();
    const p = profile?.pet;
    if (!p) return;
    // springs
    pet.hop = Math.max(0, pet.hop - dt * 55);
    pet.sx += (1 - pet.sx) * Math.min(1, dt * 10);
    pet.sy += (1 - pet.sy) * Math.min(1, dt * 10);
    shake = Math.max(0, shake - dt * 1.4);
    flash = Math.max(0, flash - dt * 2.5);
    // blink
    if (p.stage > 0 && !p.sleeping) {
      pet.nextBlink -= dt;
      if (pet.nextBlink <= 0) { pet.blink = 0.14; pet.nextBlink = 2.5 + Math.random() * 3; }
      pet.blink = Math.max(0, pet.blink - dt);
    }
    const m = mood(p);
    if (action) { updateAction(dt, p); }
    else if (p.sleeping) {
      dark = Math.min(1, dark + dt);
      pet.sy = 1 + Math.sin(t * 2) * 0.02;
      zzzTimer -= dt;
      if (zzzTimer <= 0) { zzzTimer = 1.4; spawn('zed', pet.x + 12, floorY() - petHeight(p) - 2, { vx: 6, vy: -8, life: 2 }); }
    } else {
      dark = Math.max(0, dark - dt);
      if (p.stage === 0) {
        // egg wiggles now and then
        pet.nextWalk -= dt;
        if (pet.nextWalk <= 0) { pet.nextWalk = 2 + Math.random() * 3; pet.walkTarget = 0.6; }
        if (pet.walkTarget) { pet.walkTarget -= dt; pet.wobble = Math.sin(t * 25) * 0.08; if (pet.walkTarget <= 0) { pet.walkTarget = null; pet.wobble = 0; } }
      } else {
        // idle bob + occasional walks
        pet.sy = 1 + Math.sin(t * 3) * 0.02 * (m.label === 'happy' ? 1.5 : 1);
        pet.nextWalk -= dt;
        if (pet.walkTarget === null && pet.nextWalk <= 0) {
          pet.nextWalk = 3 + Math.random() * 5;
          if (m.label !== 'sad' && chance(0.7)) pet.walkTarget = randInt(Math.floor(W * 0.25), Math.floor(W * 0.75));
          else if (m.label === 'happy' && chance(0.5)) { pet.hop = 9; }
        }
        if (pet.walkTarget !== null) {
          const dx = pet.walkTarget - pet.x;
          if (Math.abs(dx) < 1) { pet.walkTarget = null; }
          else { pet.dir = dx > 0 ? 1 : -1; pet.x += Math.sign(dx) * 14 * dt; if (pet.hop <= 0.1) pet.hop = 3; }
        }
        if (p.stage >= 5) { sparkleTimer -= dt; if (sparkleTimer <= 0) { sparkleTimer = 0.25; spawn('sparkle', pet.x + randInt(-18, 18), floorY() - randInt(0, petHeight(p) + 6), { vy: -8, life: 0.7, color: pick(['#ffd83d', '#ffffff']) }); } }
      }
    }
    updateParticles(dt);
  }

  function draw() {
    const profile = opts.getProfile();
    const p = profile?.pet;
    const theme = profile?.equipped?.background || 'meadow';
    const d = darkness(opts.now ? opts.now() : new Date());
    ctx.save();
    if (shake > 0) ctx.translate(Math.round((Math.random() - 0.5) * shake * 4), Math.round((Math.random() - 0.5) * shake * 4));
    drawBackground(theme, d);
    if (p) {
      // dirt piles
      const clean = p.stats.clean;
      const gone = action?.name === 'clean' && action.data.dirtGone;
      if (p.stage > 0 && clean < 50 && !gone) {
        const n = clean < 25 ? 3 : clean < 40 ? 2 : 1;
        const spots = [W * 0.15, W * 0.85, W * 0.5 + 30];
        for (let i = 0; i < n; i++) icon('dirt', spots[i] - 8, floorY() - 10, 2);
      }
      const box = drawPet(p);
      drawActionProps(p);
      // emotes
      const m = mood(p);
      const bx = box.x + Math.round(box.w / 2) + 4, by = box.y - box.h - 12 + Math.round(Math.sin(t * 3) * 1.5);
      if (!action && !p.sleeping && p.stage > 0) {
        if (canEvolve(p)) { const ex = iconCanvas('exclaim'); drawSprite(ex, box.x - 1, by - 6 - Math.round(Math.abs(Math.sin(t * 4)) * 3), 2); }
        else if (m.need && m.label !== 'happy') drawBubble(bx, by, needIcon(m.need));
      }
      if (!action && p.stage === 0 && canEvolve(p)) { const ex = iconCanvas('exclaim'); drawSprite(ex, box.x - 1, by - 2 - Math.round(Math.abs(Math.sin(t * 4)) * 3), 2); }
    }
    drawParticles();
    ctx.restore();
    if (dark > 0) { ctx.globalAlpha = dark * 0.55; rect(0, 0, W, H, '#050818'); ctx.globalAlpha = 1; }
    if (flash > 0) { ctx.globalAlpha = flash; rect(0, 0, W, H, '#ffffff'); ctx.globalAlpha = 1; }
  }
  const needIcon = (need) => ({ food: 'apple', fun: 'ball', brain: 'flask', clean: 'sponge', energy: 'moon' })[need] || 'heart';

  function frame(ts) {
    if (!running) return;
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016);
    last = ts;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  function play(name, data = {}) {
    return new Promise((resolve) => {
      const durations = { eat: 2.4, play: 2.2, learn: 2.2, clean: 2.5, sleep: 1.2, wake: 1.0, hatch: 3.6, evolve: 3.8, pet: 0.7, celebrate: 1.6 };
      if (action) action.resolve?.();
      const d = { ...data };
      if (name === 'hatch') { d.crackAt = 1.7; d.revealAt = 2.4; d.displayStage = 0; }
      if (name === 'evolve') { d.revealAt = 2.2; d.displayStage = d.from; }
      if (name === 'eat') { d.food = d.food || 'apple'; d.color = { apple: '#ff5d6c', cookie: '#d9a066', carrot: '#ff8c42' }[d.food] || '#ff5d6c'; }
      pet.walkTarget = null;
      if (['eat', 'play', 'learn', 'clean', 'hatch', 'evolve'].includes(name)) pet.x = W / 2;
      action = { name, t: 0, dur: durations[name] ?? 1, data: d, resolve };
    });
  }

  function onTap() {
    if (action) return;
    const p = opts.getProfile()?.pet;
    if (!p) return;
    if (p.sleeping) return;
    play('pet');
  }

  return {
    start() { if (running) return; running = true; resize(); last = performance.now(); requestAnimationFrame(frame); },
    stop() { running = false; },
    resize,
    play,
    onTap,
    isBusy: () => !!action,
    get width() { return W; },
    get height() { return H; },
  };
}
