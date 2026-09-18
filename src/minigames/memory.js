// Memory Match: 6 pairs of pixel icons.

import { el, shuffle, sample, sleep } from '../util.js';
import { iconEl } from '../sprites.js';
import { button, modal } from '../ui.js';
import { sfx } from '../audio.js';

const POOL = ['apple', 'cookie', 'carrot', 'ball', 'flask', 'moon', 'sun', 'coin', 'star', 'heart', 'book', 'egg', 'bubble', 'trophy', 'music'];

export function memoryGame(app, root) {
  return new Promise((resolve) => {
    const icons = sample(POOL, 6);
    const deck = shuffle([...icons, ...icons]);
    let first = null, lock = false, matched = 0, moves = 0, misses = 0, over = false;
    const movesEl = el('span', {}, 'MOVES 0');
    const hud = el('div', { class: 'hud' }, movesEl, el('span', { class: 'title', style: { fontSize: '11px' } }, 'MEMORY'), el('span', {}, `PAIRS 0/6`));
    const grid = el('div', { class: 'memory' });
    root.append(hud, grid, el('div', { class: 'row pad' }, button('Quit', { cls: 'ghost small', sound: 'back', onClick: () => end(true) })));

    deck.forEach((icon) => {
      const card = el('div', { class: 'cardm px', dataset: { icon } });
      card.addEventListener('click', async () => {
        if (lock || over || card.classList.contains('up') || card.classList.contains('matched')) return;
        sfx('tap');
        card.classList.add('up'); card.replaceChildren(iconEl(icon, 6));
        if (!first) { first = card; return; }
        moves += 1; movesEl.textContent = 'MOVES ' + moves;
        if (first.dataset.icon === icon) {
          first.classList.add('matched'); card.classList.add('matched'); first = null; matched += 1; sfx('correct');
          hud.lastChild.textContent = `PAIRS ${matched}/6`;
          if (matched === 6) end(false);
        } else {
          lock = true; misses += 1;
          await sleep(750);
          card.classList.remove('up'); card.replaceChildren();
          first.classList.remove('up'); first.replaceChildren();
          first = null; lock = false; sfx('wrong');
        }
      });
      grid.append(card);
    });

    async function end(quit) {
      if (over) return;
      over = true;
      const coins = quit ? 0 : Math.max(3, Math.min(12, 14 - misses));
      if (!quit) {
        sfx('fanfare');
        await modal({ title: 'ALL PAIRS!', body: el('div', { class: 'col center' }, el('div', { style: { fontSize: '22px' } }, `Done in ${moves} moves!`), el('div', { class: 'reward' }, el('span', {}, iconEl('coin', 3), `+${coins}`))), actions: [{ label: 'OK', cls: 'green', value: true }] });
      }
      resolve({ coins, score: moves });
    }
  });
}
