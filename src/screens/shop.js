// Shop: hats and room backgrounds bought with coins from activities and games.

import { el } from '../util.js';
import { iconEl, petEl, HATS } from '../sprites.js';
import { BACKGROUNDS } from '../scene.js';
import { button, modal, toast } from '../ui.js';
import { sfx } from '../audio.js';

export function renderShop(app, params, done) {
  const profile = app.profile;
  const root = el('div', { class: 'col', style: { height: '100%' } });
  let tab = 'hats';
  const coinChip = el('span', { class: 'stat-chip' });
  const preview = el('div', { class: 'center', style: { display: 'flex', justifyContent: 'center' } });
  const grid = el('div', { class: 'grid3' });
  const tabs = el('div', { class: 'row' });

  root.append(
    el('div', { class: 'row pad' },
      button(null, { icon: 'arrow', cls: 'icon-only ghost', sound: 'back', attrs: { 'aria-label': 'Back' }, onClick: () => done(true) }),
      el('span', { class: 'title light' }, 'SHOP'), el('span', { class: 'grow' }), coinChip),
    el('div', { class: 'panel px', style: { margin: '0 12px' } }, preview),
    el('div', { style: { padding: '10px 12px 0' } }, tabs),
    el('div', { class: 'scroll pad', style: { flex: 1 } }, grid),
  );

  function render() {
    coinChip.replaceChildren(iconEl('coin', 2), String(profile.coins));
    preview.replaceChildren(petEl(profile.pet.species, Math.max(1, profile.pet.stage), 4, profile.equipped.hat));
    tabs.replaceChildren(
      button('Hats', { icon: 'hatIcon', cls: `small grow ${tab === 'hats' ? 'yellow' : ''}`, onClick: () => { tab = 'hats'; render(); } }),
      button('Rooms', { icon: 'sun', cls: `small grow ${tab === 'rooms' ? 'yellow' : ''}`, onClick: () => { tab = 'rooms'; render(); } }),
    );
    grid.replaceChildren();
    if (tab === 'hats') {
      const none = el('div', { class: `shop-item px ${!profile.equipped.hat ? 'owned' : ''}` }, el('div', { style: { height: '48px', display: 'flex', alignItems: 'center' } }, 'No hat'), button(!profile.equipped.hat ? 'Wearing' : 'Wear', { cls: 'small', onClick: () => { profile.equipped.hat = null; app.save(); render(); } }));
      grid.append(none);
      for (const [id, h] of Object.entries(HATS)) {
        const owned = profile.inventory.hats.includes(id);
        const wearing = profile.equipped.hat === id;
        const item = el('div', { class: `shop-item px ${owned ? 'owned' : ''}` }, petEl(profile.pet.species, Math.max(1, profile.pet.stage), 3, id), el('div', { style: { fontWeight: 700 } }, h.name));
        if (owned) item.append(button(wearing ? 'Wearing' : 'Wear', { cls: `small ${wearing ? 'green' : ''}`, onClick: () => { profile.equipped.hat = wearing ? null : id; app.save(); render(); } }));
        else item.append(el('span', { class: 'price' }, iconEl('coin', 2), String(h.price)), button('Buy', { cls: 'small yellow', onClick: () => buy('hats', id, h.name, h.price) }));
        grid.append(item);
      }
    } else {
      for (const [id, bg] of Object.entries(BACKGROUNDS)) {
        const owned = profile.inventory.backgrounds.includes(id);
        const using = profile.equipped.background === id;
        const swatch = el('div', { style: { width: '64px', height: '40px', border: '2px solid var(--ink)', background: `linear-gradient(${bg.sky[0]}, ${bg.sky[1]})` } });
        const item = el('div', { class: `shop-item px ${owned ? 'owned' : ''}` }, swatch, el('div', { style: { fontWeight: 700 } }, bg.name));
        if (owned) item.append(button(using ? 'Using' : 'Use', { cls: `small ${using ? 'green' : ''}`, onClick: () => { profile.equipped.background = id; app.save(); render(); } }));
        else item.append(el('span', { class: 'price' }, iconEl('coin', 2), String(bg.price)), button('Buy', { cls: 'small yellow', onClick: () => buy('backgrounds', id, bg.name, bg.price) }));
        grid.append(item);
      }
    }
  }

  async function buy(kind, id, name, price) {
    if (profile.coins < price) {
      sfx('wrong');
      await modal({ title: 'NOT ENOUGH COINS', body: `You need ${price - profile.coins} more coins. Do activities and play mini-games to earn coins!`, actions: [{ label: 'OK', cls: 'yellow', value: true }] });
      return;
    }
    const ok = await modal({ title: 'BUY?', body: el('div', { class: 'reward' }, el('span', {}, name), el('span', {}, iconEl('coin', 3), String(price))), actions: [{ label: 'Buy it!', cls: 'green', value: true }, { label: 'No thanks', value: false }] });
    if (!ok) return;
    profile.coins -= price;
    profile.inventory[kind].push(id);
    if (kind === 'hats') profile.equipped.hat = id; else profile.equipped.background = id;
    sfx('buy');
    toast(`You got the ${name}!`, 'star');
    app.save();
    render();
  }

  render();
  return root;
}
