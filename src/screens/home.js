// The pet's room: status, care buttons, and the animated scene.

import { el, pick, dayKey } from '../util.js';
import { iconEl, STAGE_NAMES, SPECIES } from '../sprites.js';
import { createScene } from '../scene.js';
import { NEEDS, mood, applyCare, canEvolve, evolve, completeActivity, ensureToday, tick, currentStreak } from '../pet.js';
import { SUBJECT_INFO } from '../content/index.js';
import { button, toast, modal, vibrate } from '../ui.js';
import { sfx } from '../audio.js';
import { speak } from '../speech.js';
import { checkBadges } from '../badges.js';

const LINES = {
  happy: ['I feel great!', 'Best day ever!', 'You are the best!', 'Let\'s play!', 'Hi friend!'],
  ok: ['Hello!', 'What shall we do?', 'I like you.', 'Hi there!'],
  sad: ['I feel a bit sad...', 'Can you help me?', 'I need you!'],
  needy: { food: ['My tummy is rumbling!', 'I am hungry!'], fun: ['I am bored...', 'Let\'s play something!'], brain: ['Teach me something!', 'I want to explore!'], clean: ['I feel yucky!', 'Bath time?'], energy: ['So sleepy...', 'I need a nap.'] },
  asleep: ['Zzz...', 'Zzz... zzz...'],
  egg: ['...', 'Something is moving!', 'Do an activity to hatch me!'],
};

export function renderHome(app) {
  const profile = app.profile;
  if (!profile) { app.go('profiles'); return el('div'); }
  const pet = profile.pet;
  const root = el('div', { class: 'home' });

  // ---- top bar ----
  const starChip = el('span', { class: 'stat-chip' });
  const coinChip = el('span', { class: 'stat-chip' });
  const stageChip = el('span', { class: 'stat-chip' });
  const nameBtn = el('button', { class: 'name', type: 'button', title: 'Switch player' }, `${pet.name}`);
  nameBtn.addEventListener('click', () => { if (busy) return; sfx('tap'); app.leaveProfile(); });
  const topbar = el('div', { class: 'topbar' }, nameBtn, stageChip, starChip, coinChip);

  // ---- scene ----
  const canvas = el('canvas');
  const speech = el('div', { class: 'speech px', style: { display: 'none' } });
  const sceneBox = el('div', { class: 'scene-box px' }, canvas, speech);
  const SOUND_FOR = { eat: 'eat', happy: 'sparkle', hop: 'hop', sparkle: 'sparkle', crack: 'pop', hatch: 'hatch', evolve: 'levelup' };
  const scene = createScene(canvas, { getProfile: () => app.profile, now: app.now, onEvent: (n) => { if (SOUND_FOR[n]) sfx(SOUND_FOR[n]); } });
  let speechTimer = null;
  function say(text, doSpeak = false) {
    speech.textContent = text;
    speech.style.display = 'block';
    clearTimeout(speechTimer);
    speechTimer = setTimeout(() => { speech.style.display = 'none'; }, 3200);
    if (doSpeak) speak(text);
  }
  function petLine() {
    const m = mood(pet);
    if (m.label === 'needy') return pick(LINES.needy[m.need]);
    return pick(LINES[m.label] || LINES.ok);
  }
  canvas.addEventListener('pointerdown', () => {
    if (busy) return;
    if (pet.stage === 0) { say(pick(LINES.egg), true); sfx('tap'); return; }
    if (pet.sleeping) { say('Shh... sleeping!', false); return; }
    scene.onTap(); sfx('hop'); vibrate(15);
    applyCare(pet, 'fun', 2);
    say(petLine(), true);
    refresh();
  });

  // ---- bars ----
  const bars = el('div', { class: 'bars' });
  const barFills = {};
  for (const [key, need] of Object.entries(NEEDS)) {
    const fill = el('div', { class: 'fill' });
    barFills[key] = fill;
    bars.append(el('div', { class: 'bar' }, iconEl(need.icon, 3), el('div', { class: 'track' }, fill)));
  }

  // ---- care buttons ----
  const careRow = el('div', { class: 'care-row' });
  const careBtns = {};
  for (const [key, need] of Object.entries(NEEDS)) {
    const b = button(need.action, { icon: need.icon, cls: 'care px', onClick: () => onCare(key) });
    careBtns[key] = b;
    careRow.append(b);
  }

  // ---- nav ----
  const navRow = el('div', { class: 'nav-row' },
    button('Games', { icon: 'gamepad', cls: 'nav px', onClick: () => open('games') }),
    button('Shop', { icon: 'bag', cls: 'nav px', onClick: () => open('shop') }),
    button('Album', { icon: 'book', cls: 'nav px', onClick: () => open('album') }),
    button('Parents', { icon: 'lock', cls: 'nav px', onClick: () => open('parents') }),
  );

  root.append(topbar, sceneBox, bars, careRow, navRow);

  let busy = false;

  async function open(name) {
    if (busy) return;
    await app.push(name, {});
    if (!app.profile) return; // profile deleted / switched
    if (app.profile !== profile) { app.go('home'); return; }
    refresh();
    await checkGrowth();
  }

  function refresh() {
    const goal = profile.settings.dailyGoal;
    starChip.replaceChildren(iconEl('star', 2), `${profile.today?.stars ?? 0}/${goal}`);
    coinChip.replaceChildren(iconEl('coin', 2), String(profile.coins));
    stageChip.textContent = STAGE_NAMES[pet.stage].toUpperCase();
    for (const [key, fill] of Object.entries(barFills)) {
      const v = pet.stage === 0 ? 100 : pet.stats[key];
      fill.style.width = Math.round(v) + '%';
      fill.className = 'fill ' + (v < 30 ? 'low' : v < 60 ? 'mid' : '');
    }
    for (const [key, b] of Object.entries(careBtns)) {
      if (key === 'energy') {
        b.replaceChildren(iconEl(pet.sleeping ? 'sun' : 'moon', 4), el('span', {}, pet.sleeping ? 'Wake' : 'Sleep'));
        b.disabled = pet.stage === 0;
      } else {
        b.disabled = pet.sleeping;
        const subject = NEEDS[key].subject;
        b.classList.toggle('done', (profile.today?.subjects?.[subject] || 0) > 0);
      }
    }
  }

  async function onCare(key) {
    if (busy) return;
    if (key === 'energy') return toggleSleep();
    if (pet.sleeping) { say('Zzz... wake me first!'); return; }
    const subject = NEEDS[key].subject;
    const info = SUBJECT_INFO[subject];
    say(`${info.name} time!`, false);
    const result = await app.push('activity', { subject });
    if (!result || !result.completed) { refresh(); return; }
    await finishCare(key, subject, result);
  }

  async function finishCare(key, subject, result) {
    busy = true;
    const perfect = result.correct === result.total;
    const earned = completeActivity(profile, subject, { perfect, correct: result.correct, total: result.total }, app.now());
    const amount = 35 + (perfect ? 15 : 0);
    if (pet.stage > 0) applyCare(pet, key, amount);
    if (key === 'brain' && pet.stage > 0) applyCare(pet, 'fun', 8);
    app.save();
    refresh();
    // rewards popup text
    if (earned.star) { sfx('star'); toast(`+1 star!  +${earned.coins} coins`, 'star'); }
    else { sfx('coin'); toast(`Practice! +${earned.coins} coins`, 'coin'); }
    if (earned.bonus) setTimeout(() => toast(`All subjects today! +${earned.bonus} bonus coins`, 'trophy'), 900);
    // animation
    const anim = { food: 'eat', fun: 'play', brain: 'learn', clean: 'clean' }[key];
    if (pet.stage > 0) {
      await scene.play(anim, { food: pick(['apple', 'cookie', 'carrot']) });
      say(pick({ food: ['Yum yum!', 'Delicious!', 'So tasty!'], fun: ['That was fun!', 'Again, again!', 'Wheee!'], brain: ['I learned something!', 'Wow, so cool!', 'Now I know!'], clean: ['Squeaky clean!', 'So fresh!', 'Sparkly!'] }[key]), false);
    }
    if (earned.goalReached && earned.star) {
      await scene.play('celebrate');
      await modal({ title: 'ALL STARS TODAY!', body: el('div', { class: 'col center' }, el('div', { style: { fontSize: '20px' } }, `You earned all ${profile.settings.dailyGoal} stars today. ${pet.name} is so proud of you!`), el('div', { class: 'muted' }, 'Come back tomorrow for more stars. You can still play, practise and visit the shop!')), actions: [{ label: 'Yay!', cls: 'yellow', icon: 'star', value: true }] });
    }
    busy = false;
    await checkGrowth();
    await awardBadges();
  }

  async function checkGrowth() {
    if (busy || !canEvolve(pet, Date.now())) return;
    busy = true;
    const from = pet.stage;
    const wasSleeping = pet.sleeping;
    evolve(pet, Date.now());
    if (wasSleeping) { pet.sleeping = false; }
    app.save();
    if (from === 0) {
      say('Something is happening!');
      await scene.play('hatch');
      refresh();
      say(`Hi! I am ${pet.name}!`, true);
      await modal({ title: 'IT HATCHED!', body: el('div', { class: 'col center' }, el('div', { style: { fontSize: '22px' } }, `${pet.name === SPECIES[pet.species].name ? pet.name : `${pet.name} the ${SPECIES[pet.species].name}`} is here! Take good care of it: feed it, play with it and teach it new things.`)), actions: [{ label: 'Hello!', cls: 'green', icon: 'heart', value: true }] });
    } else {
      say('I feel funny...');
      await scene.play('evolve', { from, to: pet.stage });
      refresh();
      const name = STAGE_NAMES[pet.stage];
      say(`I grew up! I am a ${name} now!`, true);
      await modal({ title: pet.stage === 5 ? 'LEGENDARY!' : 'IT GREW UP!', body: el('div', { class: 'col center' }, el('div', { style: { fontSize: '22px' } }, pet.stage === 5 ? `${pet.name} reached the final Legend form! You are an amazing teacher.` : `${pet.name} is now a ${name}! Keep learning every day to help it grow.`)), actions: [{ label: 'Awesome!', cls: 'yellow', icon: 'star', value: true }] });
    }
    busy = false;
    refresh();
    await awardBadges();
  }

  async function awardBadges() {
    const fresh = checkBadges(profile);
    if (fresh.length) {
      app.save();
      for (const b of fresh) { sfx('fanfare'); toast(`Badge: ${b.name}`, 'trophy', 2600); await new Promise((r) => setTimeout(r, 700)); }
    }
  }

  async function toggleSleep() {
    if (pet.stage === 0) return;
    busy = true;
    if (pet.sleeping) {
      pet.sleeping = false; sfx('wake');
      await scene.play('wake');
      say('Good morning!', true);
    } else {
      pet.sleeping = true; sfx('sleep');
      pet.lastTick = Date.now();
      await scene.play('sleep');
      say('Zzz... good night!', true);
    }
    app.save();
    busy = false;
    refresh();
  }

  // Daily gift + welcome line when arriving.
  async function welcome() {
    const today = dayKey(app.now());
    if (profile.lastGiftDate !== today && pet.stage > 0) {
      profile.lastGiftDate = today;
      const streak = currentStreak(profile, app.now());
      profile.coins += 5;
      app.save();
      refresh();
      sfx('coin');
      toast(streak > 1 ? `Day ${streak} streak! +5 coins` : 'Welcome back! +5 coins', 'coin', 2600);
    }
    setTimeout(() => { if (!busy) say(petLine(), false); }, 600);
  }

  const api = {
    refresh,
    resize: () => scene.resize(),
    setPaused(v) { if (v) scene.stop(); else scene.start(); },
  };
  app.home = api;
  tick(pet, Date.now());
  ensureToday(profile, app.now());
  refresh();
  requestAnimationFrame(() => { scene.start(); welcome().then(checkGrowth); });
  return root;
}
