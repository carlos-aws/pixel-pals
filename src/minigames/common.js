// Shared bits for canvas mini-games: a scaled low-res canvas and a HUD.

import { el } from '../util.js';
import { button } from '../ui.js';
import { iconCanvas } from '../sprites.js';

export function setupCanvasGame(root, { title, onQuit }) {
  const hud = el('div', { class: 'hud' });
  const scoreEl = el('span', {}, 'SCORE 0');
  const timeEl = el('span', {}, '');
  hud.append(scoreEl, el('span', { class: 'title', style: { fontSize: '11px' } }, title), timeEl);
  const canvas = el('canvas');
  const box = el('div', { class: 'game-box px' }, canvas);
  const bottom = el('div', { class: 'row pad' }, button('Quit', { cls: 'ghost small', sound: 'back', onClick: onQuit }));
  root.append(hud, box, bottom);
  const ctx = canvas.getContext('2d');
  let W = 160, H = 200, scale = 2;
  function resize() {
    const r = box.getBoundingClientRect();
    scale = Math.max(2, Math.floor(r.width / 160));
    W = Math.floor(r.width / scale); H = Math.floor(r.height / scale);
    canvas.width = W; canvas.height = H;
    canvas.style.width = W * scale + 'px'; canvas.style.height = H * scale + 'px';
    ctx.imageSmoothingEnabled = false;
  }
  const toLogical = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale };
  };
  return {
    canvas, ctx, box, resize, toLogical,
    get W() { return W; }, get H() { return H; },
    setScore: (s) => { scoreEl.textContent = 'SCORE ' + s; },
    setTime: (t) => { timeEl.textContent = t; },
    icon: (name, x, y, s = 1) => { const c = iconCanvas(name); ctx.drawImage(c, Math.round(x), Math.round(y), c.width * s, c.height * s); },
    rect: (x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); },
    text: (str, x, y, color = '#fff', size = 8, align = 'center') => {
      ctx.fillStyle = color; ctx.font = `${size}px "Press Start 2P", monospace`; ctx.textAlign = align; ctx.textBaseline = 'middle';
      ctx.fillText(str, Math.round(x), Math.round(y));
    },
  };
}

export function countdown(game, seconds, onDone) {
  let left = seconds;
  game.setTime('TIME ' + left);
  const id = setInterval(() => { left -= 1; game.setTime('TIME ' + left); if (left <= 0) { clearInterval(id); onDone(); } }, 1000);
  return () => clearInterval(id);
}
