// Player selection and new-player creation (pick a name and an egg).

import { el } from '../util.js';
import { petEl, SPECIES, STAGE_NAMES } from '../sprites.js';
import { button } from '../ui.js';
import { createProfile } from '../storage.js';
import { sfx } from '../audio.js';
import { speak } from '../speech.js';

export function renderProfiles(app) {
  const root = el('div', { class: 'col pad scroll', style: { height: '100%', gap: '14px' } });

  function listView() {
    root.replaceChildren();
    root.append(
      el('div', { class: 'center col', style: { paddingTop: '18px', gap: '6px' } },
        el('div', { class: 'title big light floaty' }, 'PIXEL PALS'),
        el('div', { class: 'light muted' }, 'Learn. Play. Grow together.'),
      ),
    );
    if (app.state.profiles.length) {
      root.append(el('div', { class: 'light title' }, 'WHO IS PLAYING?'));
      for (const p of app.state.profiles) {
        const card = el('div', { class: 'card px' },
          petEl(p.pet.species, p.pet.stage, 3, p.equipped?.hat),
          el('div', { class: 'grow' },
            el('div', { style: { fontSize: '24px', fontWeight: 700 } }, p.name),
            el('div', { class: 'muted' }, `${p.pet.name} the ${STAGE_NAMES[p.pet.stage]} · ${p.pet.stars} ★`),
          ),
        );
        card.addEventListener('click', () => { sfx('tap'); app.selectProfile(p.id); app.go('home'); });
        root.append(card);
      }
    } else {
      root.append(el('div', { class: 'panel px center' }, el('div', { style: { fontSize: '20px' } }, 'Tap below to make your first pet!')));
    }
    root.append(button('New player', { icon: 'egg', cls: 'yellow big', onClick: newView }));
    root.append(el('div', { class: 'light muted center', style: { marginTop: 'auto', fontSize: '13px' } }, 'Free & open source · works offline'));
  }

  function newView() {
    root.replaceChildren();
    let species = 'mochi';
    const nameInput = el('input', { type: 'text', maxlength: '14', placeholder: 'Your name', autocomplete: 'off' });
    const petInput = el('input', { type: 'text', maxlength: '14', placeholder: 'Pet name', autocomplete: 'off', value: SPECIES.mochi.name });
    const eggBtns = {};
    const eggPick = el('div', { class: 'egg-pick' });
    for (const [key, sp] of Object.entries(SPECIES)) {
      const b = el('button', { class: `btn px ${key === species ? 'selected' : ''}`, type: 'button' }, petEl(key, 0, 3), el('span', {}, sp.name));
      b.addEventListener('click', () => {
        sfx('tap');
        species = key;
        for (const k of Object.keys(eggBtns)) eggBtns[k].classList.toggle('selected', k === key);
        if (!petInput.dataset.touched) petInput.value = sp.name;
        desc.textContent = `${sp.name} is ${sp.desc}.`;
        speak(`${sp.name} is ${sp.desc}`);
      });
      eggBtns[key] = b;
      eggPick.append(b);
    }
    petInput.addEventListener('input', () => { petInput.dataset.touched = '1'; });
    const desc = el('div', { class: 'muted center' }, `${SPECIES.mochi.name} is ${SPECIES.mochi.desc}.`);

    root.append(
      el('div', { class: 'row' }, button(null, { icon: 'arrow', cls: 'icon-only ghost', sound: 'back', onClick: listView, attrs: { 'aria-label': 'Back' } }), el('div', { class: 'title light' }, 'NEW PLAYER')),
      el('div', { class: 'panel px col' }, el('h3', {}, 'What is your name?'), nameInput),
      el('div', { class: 'panel px col' }, el('h3', {}, 'Pick an egg'), eggPick, desc),
      el('div', { class: 'panel px col' }, el('h3', {}, 'Name your pet'), petInput),
      button('Start!', { icon: 'star', cls: 'green big', onClick: () => {
        const name = nameInput.value.trim();
        if (!name) { nameInput.focus(); nameInput.style.outline = '3px solid var(--red)'; return; }
        const profile = createProfile(name, species, petInput.value || SPECIES[species].name);
        app.state.profiles.push(profile);
        app.selectProfile(profile.id);
        app.saveNow();
        app.go('home');
      } }),
    );
    setTimeout(() => nameInput.focus(), 50);
  }

  listView();
  return root;
}
