// Mini-game hub. Games never count towards the daily star goal; they give a
// few coins so there is always something fun to do.

import { el } from '../util.js';
import { iconEl } from '../sprites.js';
import { button, toast } from '../ui.js';
import { sfx } from '../audio.js';
import { catchGame } from '../minigames/catch.js';
import { bubbleGame } from '../minigames/bubbles.js';
import { memoryGame } from '../minigames/memory.js';

const GAMES = [
  { id: 'catch', name: 'Fruit Catch', icon: 'apple', desc: 'Catch the falling snacks. Dodge the rocks!', run: catchGame },
  { id: 'bubbles', name: 'Bubble Pop', icon: 'bubble', desc: 'Pop the bubble with the right number or letter.', run: bubbleGame },
  { id: 'memory', name: 'Memory Match', icon: 'book', desc: 'Find all the matching pairs.', run: memoryGame },
];

export function renderGames(app, params, done) {
  const profile = app.profile;
  const root = el('div', { class: 'col', style: { height: '100%' } });
  const list = el('div', { class: 'col pad scroll', style: { gap: '12px', flex: 1 } });

  function hub() {
    root.replaceChildren();
    list.replaceChildren();
    list.append(el('div', { class: 'row' },
      button(null, { icon: 'arrow', cls: 'icon-only ghost', sound: 'back', attrs: { 'aria-label': 'Back' }, onClick: () => done(true) }),
      el('span', { class: 'title light' }, 'MINI-GAMES'),
      el('span', { class: 'grow' }),
      el('span', { class: 'stat-chip' }, iconEl('coin', 2), String(profile.coins)),
    ));
    list.append(el('div', { class: 'light muted' }, 'Play as much as you like. Games give coins for the shop!'));
    for (const g of GAMES) {
      const card = el('div', { class: 'card px' }, iconEl(g.icon, 6), el('div', { class: 'grow' }, el('div', { style: { fontSize: '22px', fontWeight: 700 } }, g.name), el('div', { class: 'muted' }, g.desc)));
      card.addEventListener('click', () => { sfx('tap'); play(g); });
      list.append(card);
    }
    root.append(list);
  }

  async function play(g) {
    root.replaceChildren();
    const result = await g.run(app, root);
    profile.gamesPlayed = (profile.gamesPlayed || 0) + 1;
    if (result && result.coins > 0) {
      profile.coins += result.coins;
      sfx('coin');
      toast(`+${result.coins} coins!`, 'coin');
    }
    app.save();
    hub();
  }

  hub();
  return root;
}
