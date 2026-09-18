// Bubble Pop: bubbles float up carrying numbers or letters; pop the one the
// game asks for. Learning-flavoured, unlimited fun.

import { el, randInt, pick, sample, chance } from '../util.js';
import { setupCanvasGame, countdown } from './common.js';
import { sfx } from '../audio.js';
import { speak } from '../speech.js';
import { modal } from '../ui.js';
import { iconEl } from '../sprites.js';

const LETTERS = 'ABCDEFGHIJKLMNOPRSTUVWY'.split('');
const COLORS = ['#9ad6ff', '#ffb8cc', '#c8f5b0', '#fff2b0', '#d9c4ff'];

export function bubbleGame(app, root) {
  return new Promise((resolve) => {
    let over = false, score = 0, last = 0, t = 0;
    const bubbles = [];
    const pops = [];
    let target = null;
    const level = app.profile?.skills?.math?.level || 1;
    const maxNum = level >= 4 ? 20 : 10;
    const g = setupCanvasGame(root, { title: 'BUBBLE POP', onQuit: () => end(true) });
    g.resize();
    const stopTimer = countdown(g, 45, () => end(false));

    function newTarget() {
      const useLetters = chance(0.4);
      const pool = useLetters ? LETTERS : Array.from({ length: maxNum }, (_, i) => String(i + 1));
      target = pick(pool);
      const others = sample(pool.filter((x) => x !== target), 4);
      // make sure the target exists among floating bubbles
      bubbles.length = 0;
      for (const label of [target, ...others]) {
        bubbles.push({ label, x: randInt(12, g.W - 12), y: randInt(Math.floor(g.H * 0.25), g.H + 20), r: 9, vy: -(g.H * 0.08 + randInt(0, 8)), color: pick(COLORS), wob: Math.random() * 6 });
      }
      speak(useLetters ? `Pop the letter ${target}` : `Pop the number ${target}`);
    }

    g.canvas.addEventListener('pointerdown', (e) => {
      if (over) return;
      const p = g.toLogical(e);
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        if (Math.hypot(p.x - b.x, p.y - b.y) <= b.r + 3) {
          if (b.label === target) {
            score += 1; g.setScore(score); sfx('pop');
            for (let k = 0; k < 6; k++) pops.push({ x: b.x, y: b.y, vx: randInt(-30, 30), vy: randInt(-30, 30), life: 0.4 });
            newTarget();
          } else { sfx('wrong'); b.shake = 0.3; }
          return;
        }
      }
    });

    function update(dt) {
      t += dt;
      for (const b of bubbles) {
        b.y += b.vy * dt; b.x += Math.sin(t * 2 + b.wob) * 8 * dt;
        if (b.shake > 0) b.shake -= dt;
        if (b.y < -12) b.y = g.H + 10;
      }
      for (let i = pops.length - 1; i >= 0; i--) { const p = pops[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.life <= 0) pops.splice(i, 1); }
    }
    function draw() {
      const { W, H } = g;
      g.rect(0, 0, W, H, '#3aa0e0');
      for (let i = 0; i < 5; i++) g.rect(0, i * (H / 5) + ((t * 6) % (H / 5)), W, 1, '#5fc0f0');
      for (const b of bubbles) {
        const x = b.x + (b.shake > 0 ? Math.sin(t * 60) * 2 : 0);
        for (let dy = -b.r; dy <= b.r; dy++) { const hw = Math.floor(Math.sqrt(b.r * b.r - dy * dy)); g.rect(x - hw, b.y + dy, hw * 2 + 1, 1, b.color); }
        g.rect(x - b.r + 2, b.y - 3, 2, 2, '#ffffff');
        g.text(b.label, x, b.y + 1, '#2b2340', 8);
      }
      for (const p of pops) g.rect(p.x, p.y, 2, 2, '#ffffff');
      // instruction banner
      g.rect(0, 0, W, 14, '#2b2340');
      g.text(`POP  ${target}`, W / 2, 7, '#ffd83d', 8);
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
      const coins = quit ? 0 : Math.min(12, score);
      if (!quit) {
        sfx(score > 5 ? 'fanfare' : 'lose');
        await modal({ title: 'TIME UP!', body: el('div', { class: 'col center' }, el('div', { style: { fontSize: '22px' } }, `You popped ${score} bubbles!`), el('div', { class: 'reward' }, el('span', {}, iconEl('coin', 3), `+${coins}`))), actions: [{ label: 'OK', cls: 'green', value: true }] });
      }
      resolve({ coins, score });
    }
    newTarget();
    requestAnimationFrame(frame);
  });
}
