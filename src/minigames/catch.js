// Fruit Catch: slide the basket to catch snacks, avoid rocks. 40 seconds.

import { el, randInt, pick, chance } from '../util.js';
import { setupCanvasGame, countdown } from './common.js';
import { sfx } from '../audio.js';
import { modal } from '../ui.js';
import { iconEl } from '../sprites.js';

export function catchGame(app, root) {
  return new Promise((resolve) => {
    let over = false;
    let score = 0, lives = 3, t = 0, spawnT = 0, last = 0;
    const items = [];
    const g = setupCanvasGame(root, { title: 'FRUIT CATCH', onQuit: () => end(true) });
    g.resize();
    const basket = { x: g.W / 2, w: 24 };
    const stopTimer = countdown(g, 40, () => end(false));

    const move = (e) => { const p = g.toLogical(e); basket.x = Math.max(basket.w / 2, Math.min(g.W - basket.w / 2, p.x)); };
    g.canvas.addEventListener('pointerdown', move);
    g.canvas.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'touch') move(e); });

    function spawnItem() {
      const rock = chance(0.22);
      items.push({ x: randInt(6, g.W - 14), y: -10, vy: g.H * (0.22 + t * 0.006) + randInt(0, 10), kind: rock ? 'rock' : pick(['apple', 'cookie', 'carrot']), rock });
    }

    function update(dt) {
      t += dt; spawnT -= dt;
      if (spawnT <= 0) { spawnItem(); spawnT = Math.max(0.35, 0.9 - t * 0.012); }
      const by = g.H - 22;
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        it.y += it.vy * dt;
        if (it.y + 16 >= by && it.y <= by + 8 && Math.abs(it.x + 8 - basket.x) < basket.w / 2 + 4) {
          items.splice(i, 1);
          if (it.rock) { lives -= 1; sfx('wrong'); if (lives <= 0) { end(false); return; } }
          else { score += 1; g.setScore(score); sfx('pop'); }
        } else if (it.y > g.H) items.splice(i, 1);
      }
    }
    function draw() {
      const { W, H } = g;
      g.rect(0, 0, W, H, '#7ec8ff');
      g.rect(0, H - 14, W, 14, '#4aa94c');
      for (const it of items) g.icon(it.kind, it.x, it.y, 2);
      // basket
      const bx = Math.round(basket.x - basket.w / 2), by = H - 22;
      g.rect(bx, by, basket.w, 10, '#d9a066'); g.rect(bx, by, basket.w, 2, '#a86f48'); g.rect(bx, by, 2, 10, '#a86f48'); g.rect(bx + basket.w - 2, by, 2, 10, '#a86f48');
      for (let i = 0; i < lives; i++) g.icon('heart', 3 + i * 10, 3);
    }
    function frame(ts) {
      if (over) return;
      const dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
      update(dt); draw();
      requestAnimationFrame(frame);
    }
    async function end(quit) {
      if (over) return;
      over = true; stopTimer();
      const coins = quit ? 0 : Math.min(12, Math.floor(score / 2));
      if (!quit) {
        sfx(score > 5 ? 'fanfare' : 'lose');
        await modal({ title: 'TIME UP!', body: el('div', { class: 'col center' }, el('div', { style: { fontSize: '22px' } }, `You caught ${score} snacks!`), el('div', { class: 'reward' }, el('span', {}, iconEl('coin', 3), `+${coins}`))), actions: [{ label: 'OK', cls: 'green', value: true }] });
      }
      resolve({ coins, score });
    }
    requestAnimationFrame(frame);
  });
}
