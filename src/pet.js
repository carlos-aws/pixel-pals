// Pet model: stats, mood, growth stages and the daily star budget.
// Pure functions (no DOM) so the rules can be unit-tested.

import { clamp, dayKey, daysBetween, HOUR } from './util.js';

/** Growth stages. A pet moves to the next stage when it has BOTH enough
 *  total stars AND has spent enough calendar days in its current stage. */
export const STAGES = [
  { id: 0, name: 'Egg', stars: 0, minDays: 0 },
  { id: 1, name: 'Baby', stars: 1, minDays: 0 },
  { id: 2, name: 'Kid', stars: 15, minDays: 2 },
  { id: 3, name: 'Teen', stars: 45, minDays: 5 },
  { id: 4, name: 'Grown-up', stars: 100, minDays: 10 },
  { id: 5, name: 'Legend', stars: 180, minDays: 14 },
];
export const MAX_STAGE = STAGES.length - 1;

/** The five care needs. Each is tied to a learning subject except sleep. */
export const NEEDS = {
  food: { label: 'Tummy', icon: 'apple', subject: 'math', action: 'Feed', verb: 'Feed' },
  fun: { label: 'Fun', icon: 'ball', subject: 'english', action: 'Play', verb: 'Play' },
  brain: { label: 'Brain', icon: 'flask', subject: 'science', action: 'Explore', verb: 'Explore' },
  clean: { label: 'Clean', icon: 'sponge', subject: 'review', action: 'Clean', verb: 'Clean' },
  energy: { label: 'Energy', icon: 'moon', subject: null, action: 'Sleep', verb: 'Sleep' },
};

// Decay per hour while awake. Slow on purpose: the game is meant to be played
// a little each day, not to punish a child for going to school.
const DECAY = { food: 4, fun: 4, brain: 3, clean: 2.5, energy: 3 };
const SLEEP_ENERGY_PER_HOUR = 15;
const FLOOR = 15; // decay never pushes a stat below this

export const DEFAULT_DAILY_GOAL = 6;

export function newPet(species, name, now = Date.now()) {
  return {
    species,
    name,
    stage: 0,
    stars: 0,
    bornAt: now,
    stageStartedAt: now,
    lastTick: now,
    sleeping: false,
    stats: { food: 80, fun: 80, brain: 80, clean: 90, energy: 90 },
    care: { feed: 0, play: 0, explore: 0, clean: 0 },
  };
}

/** Apply real-time decay since the last tick. Mutates and returns the pet. */
export function tick(pet, now = Date.now()) {
  const hours = Math.max(0, (now - pet.lastTick) / HOUR);
  if (hours <= 0) return pet;
  // Cap the catch-up window so a two-week holiday isn't a disaster.
  const h = Math.min(hours, 48);
  const s = pet.stats;
  if (pet.stage === 0) {
    // Eggs don't get hungry; they just wait.
    pet.lastTick = now;
    return pet;
  }
  for (const k of Object.keys(DECAY)) {
    if (k === 'energy') continue;
    const rate = pet.sleeping ? DECAY[k] / 2 : DECAY[k];
    s[k] = Math.max(Math.min(s[k], FLOOR), s[k] - rate * h);
  }
  if (pet.sleeping) {
    s.energy = clamp(s.energy + SLEEP_ENERGY_PER_HOUR * h, 0, 100);
    // Fully rested pets wake up on their own once it is daytime.
    const hour = new Date(now).getHours();
    if (s.energy >= 100 && hour >= 7 && hour < 20) pet.sleeping = false;
  } else {
    s.energy = Math.max(Math.min(s.energy, FLOOR), s.energy - DECAY.energy * h);
  }
  pet.lastTick = now;
  return pet;
}

export function applyCare(pet, need, amount) {
  pet.stats[need] = clamp(pet.stats[need] + amount, 0, 100);
  return pet;
}

/** Overall mood from 0..100 and a label used for animation + dialogue. */
export function mood(pet) {
  if (pet.stage === 0) return { score: 100, label: 'egg' };
  const s = pet.stats;
  const score = (s.food + s.fun + s.brain + s.clean + s.energy) / 5;
  if (pet.sleeping) return { score, label: 'asleep' };
  const lowest = lowestNeed(pet);
  if (lowest && s[lowest] < 30) return { score, label: 'needy', need: lowest };
  if (score >= 70) return { score, label: 'happy' };
  if (score >= 45) return { score, label: 'ok' };
  return { score, label: 'sad', need: lowest };
}

export function lowestNeed(pet) {
  let best = null;
  for (const k of Object.keys(pet.stats)) {
    if (best === null || pet.stats[k] < pet.stats[best]) best = k;
  }
  return best;
}

export function nextStage(pet) {
  return pet.stage < MAX_STAGE ? STAGES[pet.stage + 1] : null;
}

export function daysInStage(pet, now = Date.now()) {
  return daysBetween(pet.stageStartedAt, now);
}

/** Growth progress towards the next stage, for progress bars. */
export function growthProgress(pet, now = Date.now()) {
  const next = nextStage(pet);
  if (!next) return { stars: 1, days: 1, ready: false, next: null };
  const cur = STAGES[pet.stage];
  const starFrac = clamp((pet.stars - cur.stars) / (next.stars - cur.stars), 0, 1);
  const dayFrac = next.minDays ? clamp(daysInStage(pet, now) / next.minDays, 0, 1) : 1;
  return { stars: starFrac, days: dayFrac, ready: canEvolve(pet, now), next };
}

export function canEvolve(pet, now = Date.now()) {
  const next = nextStage(pet);
  if (!next) return false;
  return pet.stars >= next.stars && daysInStage(pet, now) >= next.minDays;
}

export function evolve(pet, now = Date.now()) {
  if (!canEvolve(pet, now)) return false;
  pet.stage += 1;
  pet.stageStartedAt = now;
  pet.sleeping = false;
  // Growing up is exciting: top everything up a bit.
  for (const k of Object.keys(pet.stats)) pet.stats[k] = clamp(pet.stats[k] + 25, 0, 100);
  return true;
}

// ---- Daily budget -------------------------------------------------------

export function newDay(date = dayKey()) {
  return { date, stars: 0, activities: 0, subjects: {}, coinsEarned: 0, bonusGiven: false };
}

/** Make sure `profile.today` refers to the current calendar day. */
export function ensureToday(profile, now = new Date()) {
  const key = dayKey(now);
  if (!profile.today || profile.today.date !== key) {
    profile.today = newDay(key);
    return true;
  }
  return false;
}

/** Consecutive days with at least one activity, as of `now`. */
export function currentStreak(profile, now = new Date()) {
  if (!profile.lastActiveDate) return 0;
  const gap = daysBetween(profile.lastActiveDate, dayKey(now));
  return gap <= 1 ? (profile.streak || 0) : 0;
}

function touchStreak(profile, now) {
  const key = dayKey(now);
  if (profile.lastActiveDate === key) return;
  const gap = profile.lastActiveDate ? daysBetween(profile.lastActiveDate, key) : Infinity;
  profile.streak = gap === 1 ? (profile.streak || 0) + 1 : 1;
  profile.lastActiveDate = key;
}

export function starsLeftToday(profile) {
  const goal = profile.settings?.dailyGoal ?? DEFAULT_DAILY_GOAL;
  return Math.max(0, goal - (profile.today?.stars ?? 0));
}

/**
 * Record a finished learning activity. Returns what was earned.
 * Stars only count while the daily goal isn't reached; after that the
 * activity is "practice": the pet is still cared for and a few coins drop.
 */
export function completeActivity(profile, subject, { perfect = false, correct = 0, total = 0 } = {}, now = new Date()) {
  ensureToday(profile, now);
  const today = profile.today;
  const pet = profile.pet;
  const starAvailable = starsLeftToday(profile) > 0;
  const star = starAvailable ? 1 : 0;
  let coins = starAvailable ? 3 : 1;
  if (perfect) coins += 2;

  today.activities += 1;
  today.subjects[subject] = (today.subjects[subject] || 0) + 1;
  today.stars += star;
  today.coinsEarned += coins;
  pet.stars += star;
  profile.coins = (profile.coins || 0) + coins;
  profile.totals = profile.totals || { activities: 0, stars: 0, correct: 0, answered: 0 };
  profile.totals.activities += 1;
  profile.totals.stars += star;
  profile.totals.correct += correct;
  profile.totals.answered += total;
  touchStreak(profile, now);

  // Small bonus the first time all four subjects are practised in one day.
  let bonus = 0;
  const subjects = Object.keys(today.subjects);
  if (!today.bonusGiven && ['math', 'english', 'science', 'review'].every((s) => subjects.includes(s))) {
    today.bonusGiven = true;
    bonus = 5;
    profile.coins += bonus;
  }
  return { star, coins, bonus, practice: !starAvailable, goalReached: starsLeftToday(profile) === 0 };
}
