import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newPet, tick, mood, canEvolve, evolve, STAGES, ensureToday, completeActivity, starsLeftToday, growthProgress, currentStreak } from '../src/pet.js';
import { createProfile } from '../src/storage.js';

const H = 3600 * 1000;
const D = 24 * H;

test('stats decay over time but never below the floor', () => {
  const pet = newPet('mochi', 'Mo', 0);
  pet.stage = 1;
  tick(pet, 10 * H);
  assert.ok(pet.stats.food < 80);
  tick(pet, 30 * D);
  for (const k of ['food', 'fun', 'brain', 'clean', 'energy']) assert.ok(pet.stats[k] >= 15, k);
});

test('eggs do not decay', () => {
  const pet = newPet('pip', 'Pi', 0);
  tick(pet, 5 * D);
  assert.equal(pet.stats.food, 80);
});

test('sleeping restores energy and eventually wakes the pet', () => {
  const pet = newPet('rex', 'Re', 0);
  pet.stage = 2;
  pet.stats.energy = 20;
  pet.sleeping = true;
  tick(pet, 3 * H);
  assert.ok(pet.stats.energy > 60);
  const morning = new Date(2026, 0, 2, 9).getTime();
  tick(pet, morning);
  assert.equal(pet.stats.energy, 100);
  assert.equal(pet.sleeping, false, 'wakes up in the morning');
  const night = new Date(2026, 0, 2, 22).getTime();
  pet.sleeping = true;
  tick(pet, night);
  assert.equal(pet.sleeping, true, 'keeps sleeping at night');
});

test('mood reflects the lowest need', () => {
  const pet = newPet('mochi', 'Mo', 0);
  pet.stage = 1;
  assert.equal(mood(pet).label, 'happy');
  pet.stats.food = 20;
  const m = mood(pet);
  assert.equal(m.label, 'needy');
  assert.equal(m.need, 'food');
});

test('evolution requires both stars and days in stage', () => {
  const pet = newPet('mochi', 'Mo', 0);
  assert.equal(canEvolve(pet, 0), false);
  pet.stars = 1;
  assert.equal(canEvolve(pet, 0), true); // egg hatches immediately
  assert.ok(evolve(pet, 0));
  assert.equal(pet.stage, 1);
  pet.stars = STAGES[2].stars;
  assert.equal(canEvolve(pet, 0), false, 'needs days');
  assert.equal(canEvolve(pet, 1 * D), false);
  assert.equal(canEvolve(pet, 2 * D), true);
  assert.ok(evolve(pet, 2 * D));
  assert.equal(pet.stage, 2);
  const gp = growthProgress(pet, 2 * D);
  assert.equal(gp.next.name, 'Teen');
  assert.equal(gp.ready, false);
});

test('daily goal caps the stars a child can earn per day', () => {
  const p = createProfile('Ana', 'mochi', 'Mo', 0);
  const day1 = new Date(2026, 0, 1, 10);
  for (let i = 0; i < 8; i++) completeActivity(p, 'math', { perfect: true, correct: 3, total: 3 }, day1);
  assert.equal(p.today.stars, 6);
  assert.equal(p.pet.stars, 6);
  assert.equal(p.today.activities, 8);
  assert.equal(starsLeftToday(p), 0);
  const res = completeActivity(p, 'english', {}, day1);
  assert.equal(res.star, 0);
  assert.equal(res.practice, true);

  // Next day the budget resets and the streak continues.
  const day2 = new Date(2026, 0, 2, 9);
  assert.equal(ensureToday(p, day2), true);
  assert.equal(p.today.stars, 0);
  const r2 = completeActivity(p, 'science', {}, day2);
  assert.equal(r2.star, 1);
  assert.equal(p.pet.stars, 7);
  assert.equal(currentStreak(p, day2), 2);
});

test('parents can change the daily goal', () => {
  const p = createProfile('Ana', 'rex', 'Re', 0);
  p.settings.dailyGoal = 2;
  const day = new Date(2026, 3, 5, 12);
  completeActivity(p, 'math', {}, day);
  completeActivity(p, 'math', {}, day);
  assert.equal(starsLeftToday(p), 0);
  assert.equal(completeActivity(p, 'math', {}, day).star, 0);
});

test('skipping a day resets the streak', () => {
  const p = createProfile('Ana', 'pip', 'Pi', 0);
  completeActivity(p, 'math', {}, new Date(2026, 0, 1, 10));
  completeActivity(p, 'math', {}, new Date(2026, 0, 2, 10));
  assert.equal(currentStreak(p, new Date(2026, 0, 2, 12)), 2);
  assert.equal(currentStreak(p, new Date(2026, 0, 3, 8)), 2, 'still shown the next morning');
  assert.equal(currentStreak(p, new Date(2026, 0, 5, 10)), 0, 'broken after a gap');
  completeActivity(p, 'math', {}, new Date(2026, 0, 5, 10));
  assert.equal(currentStreak(p, new Date(2026, 0, 5, 10)), 1);
});

test('all four subjects in a day gives a coin bonus once', () => {
  const p = createProfile('Ana', 'pip', 'Pi', 0);
  const day = new Date(2026, 5, 5, 12);
  const before = p.coins;
  completeActivity(p, 'math', {}, day);
  completeActivity(p, 'english', {}, day);
  completeActivity(p, 'science', {}, day);
  const r = completeActivity(p, 'review', {}, day);
  assert.equal(r.bonus, 5);
  assert.equal(p.coins, before + 3 * 4 + 5);
  assert.equal(completeActivity(p, 'math', {}, day).bonus, 0);
});
