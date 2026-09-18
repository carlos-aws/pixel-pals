// Album: pet card, growth progress, skills, badges and the hall of fame.

import { el, daysBetween } from '../util.js';
import { iconEl, petEl, STAGE_NAMES, SPECIES } from '../sprites.js';
import { growthProgress, currentStreak } from '../pet.js';
import { BADGES } from '../badges.js';
import { button, progressBar } from '../ui.js';
import { effectiveLevel } from '../content/index.js';

export function renderAlbum(app, params, done) {
  const p = app.profile;
  const pet = p.pet;
  const root = el('div', { class: 'col', style: { height: '100%' } });
  const body = el('div', { class: 'col scroll pad', style: { gap: '12px', flex: 1 } });
  root.append(
    el('div', { class: 'row pad', style: { paddingBottom: 0 } },
      button(null, { icon: 'arrow', cls: 'icon-only ghost', sound: 'back', attrs: { 'aria-label': 'Back' }, onClick: () => done(true) }),
      el('span', { class: 'title light' }, 'ALBUM')),
    body,
  );

  const gp = growthProgress(pet, Date.now());
  const age = daysBetween(pet.bornAt, Date.now());
  const next = gp.next;
  const card = el('div', { class: 'panel px col center' },
    petEl(pet.species, pet.stage, 5, p.equipped.hat),
    el('h2', {}, pet.name),
    el('div', { class: 'muted' }, `${SPECIES[pet.species].name} · ${STAGE_NAMES[pet.stage]} · ${age === 0 ? 'born today' : `${age} day${age === 1 ? '' : 's'} old`}`),
  );
  if (next) {
    const inStage = daysBetween(pet.stageStartedAt, Date.now());
    card.append(
      el('div', { class: 'col', style: { width: '100%', gap: '4px', textAlign: 'left' } },
        el('div', { class: 'row' }, iconEl('star', 3), el('span', { class: 'grow' }, `Stars: ${pet.stars} / ${next.stars}`)),
        progressBar(gp.stars),
        el('div', { class: 'row' }, iconEl('sun', 3), el('span', { class: 'grow' }, `Days as ${STAGE_NAMES[pet.stage]}: ${Math.min(inStage, next.minDays)} / ${next.minDays}`)),
        progressBar(gp.days, 'blue'),
        el('div', { class: 'muted' }, gp.ready ? 'Ready to grow!' : `Next: ${next.name}. Keep earning stars every day!`),
      ),
    );
  } else {
    card.append(el('div', { class: 'muted' }, 'A true Legend! Parents can start a new egg from the Parents screen.'));
  }
  body.append(card);

  const streak = currentStreak(p, app.now());
  const acc = p.totals.answered ? Math.round((p.totals.correct / p.totals.answered) * 100) : 0;
  body.append(el('div', { class: 'panel px col' },
    el('h3', {}, `${p.name}'s stats`),
    el('div', { class: 'kv' }, el('span', {}, 'Day streak'), el('b', {}, String(streak))),
    el('div', { class: 'kv' }, el('span', {}, 'Total stars'), el('b', {}, String(p.totals.stars))),
    el('div', { class: 'kv' }, el('span', {}, 'Activities done'), el('b', {}, String(p.totals.activities))),
    el('div', { class: 'kv' }, el('span', {}, 'First-try answers'), el('b', {}, `${acc}%`)),
    el('div', { class: 'kv' }, el('span', {}, 'Mini-games played'), el('b', {}, String(p.gamesPlayed || 0))),
  ));

  const skills = el('div', { class: 'panel px col' }, el('h3', {}, 'Skills'));
  for (const [key, label, icon] of [['math', 'Maths', 'apple'], ['english', 'English', 'ball'], ['science', 'Science', 'flask']]) {
    const lv = effectiveLevel(p, key);
    skills.append(el('div', { class: 'row' }, iconEl(icon, 3), el('span', { style: { width: '80px' } }, label), el('div', { class: 'grow' }, progressBar(lv / 6)), el('b', { class: 'title', style: { fontSize: '11px' } }, `LV ${lv}`)));
  }
  body.append(skills);

  const badges = el('div', { class: 'grid3' });
  for (const b of BADGES) {
    const has = p.badges.includes(b.id);
    badges.append(el('div', { class: `badge px ${has ? '' : 'locked'}` }, iconEl(b.icon, 4), el('b', {}, b.name), el('span', { class: 'muted', style: { fontSize: '12px' } }, b.desc)));
  }
  body.append(el('div', { class: 'panel px col' }, el('h3', {}, `Badges (${p.badges.length}/${BADGES.length})`), badges));

  if (p.album.length) {
    const hall = el('div', { class: 'panel px col' }, el('h3', {}, 'Hall of Fame'));
    for (const a of p.album) {
      hall.append(el('div', { class: 'row' }, petEl(a.species, 5, 2, a.hat), el('div', { class: 'grow' }, el('b', {}, a.name), el('div', { class: 'muted' }, `Legend in ${a.days} days · ${a.stars} stars`))));
    }
    body.append(hall);
  }
  return root;
}
