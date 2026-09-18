// Parents' corner: behind a simple multiplication gate. Daily goal, difficulty,
// sound options, backups and player management.

import { el, randInt, shuffle } from '../util.js';
import { iconEl, petEl, SPECIES, STAGE_NAMES } from '../sprites.js';
import { button, modal, switchEl, stepper, toast } from '../ui.js';
import { sfx } from '../audio.js';
import { importJSON } from '../storage.js';
import { newPet, STAGES } from '../pet.js';
import { daysBetween } from '../util.js';

export function renderParents(app, params, done) {
  const root = el('div', { class: 'col', style: { height: '100%' } });
  const body = el('div', { class: 'col scroll pad', style: { gap: '12px', flex: 1 } });
  root.append(
    el('div', { class: 'row pad', style: { paddingBottom: 0 } },
      button(null, { icon: 'arrow', cls: 'icon-only ghost', sound: 'back', attrs: { 'aria-label': 'Back' }, onClick: () => done(true) }),
      el('span', { class: 'title light' }, 'PARENTS')),
    body,
  );

  function gate() {
    const a = randInt(6, 9), b = randInt(6, 9);
    const answer = a * b;
    const opts = shuffle([answer, answer + randInt(1, 3), answer - randInt(1, 3), answer + 10]);
    const grid = el('div', { class: 'answers' });
    for (const o of opts) grid.append(button(String(o), { cls: 'px', onClick: () => { if (o === answer) settings(); else { sfx('wrong'); toast('Grown-ups only!'); } } }));
    body.replaceChildren(
      el('div', { class: 'panel px col center' }, iconEl('lock', 6), el('h3', {}, 'Grown-ups only'), el('div', { class: 'muted' }, 'To enter, answer this:'), el('div', { class: 'title big' }, `${a} × ${b} = ?`)),
      grid,
    );
  }

  function settings() {
    const p = app.profile;
    const s = p.settings;
    body.replaceChildren();

    // daily goal
    const goalPanel = el('div', { class: 'panel px col' },
      el('h3', {}, 'Daily star goal'),
      el('div', { class: 'muted' }, 'How many learning activities per day count towards the pet growing. After that, activities still work as free practice.'),
      el('div', { class: 'toggle' }, el('span', {}, 'Stars per day'), stepper(s.dailyGoal, 2, 12, (v) => { s.dailyGoal = v; app.save(); })),
      el('div', { class: 'muted' }, growthEstimate(s.dailyGoal)),
    );
    body.append(goalPanel);

    // difficulty
    const levelRows = el('div', { class: 'col' });
    const renderLevels = () => {
      levelRows.replaceChildren();
      for (const [key, label] of [['math', 'Maths'], ['english', 'English'], ['science', 'Science']]) {
        const current = s.autoLevel ? p.skills[key].level : s.level[key];
        levelRows.append(el('div', { class: 'toggle' }, el('span', {}, `${label} (now ${current})`), stepper(current, 1, 6, (v) => {
          if (s.autoLevel) p.skills[key].level = v; else s.level[key] = v;
          app.save();
        })));
      }
    };
    renderLevels();
    body.append(el('div', { class: 'panel px col' },
      el('h3', {}, 'Difficulty'),
      el('div', { class: 'muted' }, 'Levels 1-6. With auto-level on, the game moves up after 4 right answers in a row and down after 3 misses.'),
      el('div', { class: 'toggle' }, el('span', {}, 'Auto-level'), switchEl(s.autoLevel, (v) => { s.autoLevel = v; app.save(); renderLevels(); })),
      levelRows,
    ));

    // audio
    body.append(el('div', { class: 'panel px col' },
      el('h3', {}, 'Sound'),
      el('div', { class: 'toggle' }, el('span', {}, 'Sound effects'), switchEl(s.sound, (v) => { s.sound = v; app.save(); app.applyPrefs(); })),
      el('div', { class: 'toggle' }, el('span', {}, 'Music'), switchEl(s.music, (v) => { s.music = v; app.save(); app.applyPrefs(); })),
      el('div', { class: 'toggle' }, el('span', {}, 'Read questions aloud'), switchEl(s.speech, (v) => { s.speech = v; app.save(); app.applyPrefs(); })),
    ));

    // pet management
    const petPanel = el('div', { class: 'panel px col' }, el('h3', {}, `${p.pet.name} (${STAGE_NAMES[p.pet.stage]})`));
    if (p.pet.stage >= 5) {
      petPanel.append(el('div', { class: 'muted' }, 'This pet is a Legend! Move it to the Hall of Fame and start a new egg (skills, coins and hats are kept).'),
        button('Start a new egg', { icon: 'egg', cls: 'yellow', onClick: () => newEgg(p) }));
    } else {
      petPanel.append(el('div', { class: 'muted' }, 'Reset the pet to a fresh egg. Coins, hats and skill levels are kept.'),
        button('Reset pet', { cls: '', onClick: async () => {
          const ok = await modal({ title: 'RESET PET?', body: `${p.pet.name} will go back to being an egg.`, actions: [{ label: 'Reset', cls: 'red', value: true }, { label: 'Cancel', value: false }] });
          if (!ok) return;
          p.pet = newPet(p.pet.species, p.pet.name);
          app.saveNow(); toast('Pet reset'); done(true);
        } }));
    }
    body.append(petPanel);

    // players
    const cloud = app.store.mode === 'cloud';
    const playersPanel = el('div', { class: 'panel px col' },
      el('h3', {}, 'Players'),
      cloud ? el('div', { class: 'muted' }, `Signed in as ${app.store.user()?.email || '?'}. Progress is saved online; each player can be open on one device at a time.`) : null,
      button('Switch player', { icon: 'egg', cls: '', onClick: () => app.leaveProfile() }),
      button(`Delete ${p.name}`, { cls: 'red', onClick: async () => {
        const ok = await modal({ title: 'DELETE PLAYER?', body: `This removes ${p.name} and ${p.pet.name} forever.`, actions: [{ label: 'Delete', cls: 'red', value: true }, { label: 'Cancel', value: false }] });
        if (!ok) return;
        try { await app.deleteProfile(p.id); } catch { toast('Could not delete right now'); }
      } }),
    );
    if (cloud) playersPanel.append(button('Sign out', { icon: 'lock', cls: 'ghost', onClick: async () => { await app.flush({ release: true }); app.store.signOut(); } }));
    body.append(playersPanel);

    // backup
    const fileInput = el('input', { type: 'file', accept: 'application/json,.json', style: { display: 'none' } });
    fileInput.addEventListener('change', async () => {
      const f = fileInput.files?.[0]; if (!f) return;
      try {
        const text = await f.text();
        const st = importJSON(text);
        const body = app.store.mode === 'cloud'
          ? `This adds ${st.profiles.length} player(s) from the file to the cloud, overwriting any with the same id.`
          : `This replaces all ${app.state.profiles.length} current player(s) with ${st.profiles.length} from the file.`;
        const ok = await modal({ title: 'RESTORE BACKUP?', body, actions: [{ label: 'Restore', cls: 'red', value: true }, { label: 'Cancel', value: false }] });
        if (!ok) return;
        await app.store.importState(text);
        app.profile = null; app.store.setLast(null); app.go('profiles');
      } catch { toast('Could not read that file'); }
    });
    body.append(el('div', { class: 'panel px col' },
      el('h3', {}, 'Backup'),
      el('div', { class: 'muted' }, app.store.mode === 'cloud' ? 'Export this player as a file, or restore players from a file (for example, progress made in the local version).' : 'Progress is saved on this device only. Export a file to move it to another device or to the cloud version.'),
      button('Export save file', { icon: 'book', onClick: () => {
        const blob = new Blob([app.store.exportState(p)], { type: 'application/json' });
        const a = el('a', { href: URL.createObjectURL(blob), download: `pixel-pals-${new Date().toISOString().slice(0, 10)}.json` });
        document.body.append(a); a.click(); a.remove();
      } }),
      button('Import save file', { icon: 'arrow', onClick: () => fileInput.click() }),
      fileInput,
    ));

    if (app.debug) {
      body.append(el('div', { class: 'panel px col' },
        el('h3', {}, 'Debug'),
        button('+10 stars', { onClick: () => { p.pet.stars += 10; app.save(); toast('+10 stars'); } }),
        button('Age pet by 1 day', { onClick: () => { p.pet.stageStartedAt -= 86400000; p.pet.bornAt -= 86400000; app.save(); toast('aged'); } }),
        button('+100 coins', { onClick: () => { p.coins += 100; app.save(); } }),
        button('Make needy', { onClick: () => { for (const k of Object.keys(p.pet.stats)) p.pet.stats[k] = 20; app.save(); } }),
        button('Reset today', { onClick: () => { p.today = null; app.save(); } }),
      ));
    }

    body.append(el('div', { class: 'light muted center', style: { fontSize: '13px' } }, 'Pixel Pals is free & open source (MIT). Fonts: Press Start 2P & Pixelify Sans (OFL).'));
  }

  async function newEgg(p) {
    const speciesBtns = el('div', { class: 'egg-pick' });
    let species = p.pet.species;
    for (const [key, sp] of Object.entries(SPECIES)) {
      const b = el('button', { class: `btn px ${key === species ? 'selected' : ''}`, type: 'button' }, petEl(key, 0, 3), el('span', {}, sp.name));
      b.addEventListener('click', () => { species = key; [...speciesBtns.children].forEach((c) => c.classList.toggle('selected', c === b)); });
      speciesBtns.append(b);
    }
    const nameInput = el('input', { type: 'text', maxlength: '14', value: SPECIES[species].name });
    const ok = await modal({ title: 'NEW EGG', body: el('div', { class: 'col' }, speciesBtns, nameInput), actions: [{ label: 'Start', cls: 'green', value: true }, { label: 'Cancel', value: false }] });
    if (!ok) return;
    p.album.push({ species: p.pet.species, name: p.pet.name, stars: p.pet.stars, days: daysBetween(p.pet.bornAt, Date.now()), hat: p.equipped.hat });
    p.pet = newPet(species, nameInput.value.trim() || SPECIES[species].name);
    app.saveNow(); toast('A new egg!'); done(true);
  }

  gate();
  return root;
}

function growthEstimate(goal) {
  const total = STAGES[STAGES.length - 1].stars;
  const byStars = Math.ceil(total / goal);
  const byDays = STAGES.reduce((a, s) => a + s.minDays, 0);
  const days = Math.max(byStars, byDays);
  return `At ${goal} stars a day, reaching Legend takes at least ${days} days of play (about ${Math.max(1, Math.round(days / 7))} weeks).`;
}
