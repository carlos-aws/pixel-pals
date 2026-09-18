// Profiles and persistence. Everything lives in localStorage under one key,
// and can be exported/imported as JSON from the parents' screen.

import { uid } from './util.js';
import { newPet, DEFAULT_DAILY_GOAL } from './pet.js';

export const STORAGE_KEY = 'pixelpals.v1';
const SUBJECTS = ['math', 'english', 'science'];

export function defaultSettings() {
  return {
    dailyGoal: DEFAULT_DAILY_GOAL,
    sound: true,
    music: true,
    speech: true,
    autoLevel: true,
    level: { math: 1, english: 1, science: 1 },
  };
}

export function newSkills() {
  const s = {};
  for (const k of SUBJECTS) s[k] = { level: 1, streak: 0, misses: 0, right: 0, answered: 0 };
  return s;
}

export function createProfile(name, species, petName, now = Date.now()) {
  return {
    id: uid(),
    name: name.trim().slice(0, 14) || 'Player',
    createdAt: now,
    coins: 20,
    streak: 0,
    lastActiveDate: null,
    settings: defaultSettings(),
    skills: newSkills(),
    pet: newPet(species, petName.trim().slice(0, 14) || species, now),
    inventory: { hats: [], backgrounds: ['meadow'] },
    equipped: { hat: null, background: 'meadow' },
    album: [],
    badges: [],
    missed: [], // recently missed question ids for the review activity
    seenFacts: [],
    today: null,
    totals: { activities: 0, stars: 0, correct: 0, answered: 0 },
    lastGiftDate: null,
  };
}

let memoryFallback = null;

function storage() {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch { /* private mode */ }
  return null;
}

export function loadState() {
  const raw = storage()?.getItem(STORAGE_KEY) ?? memoryFallback;
  if (!raw) return { version: 1, profiles: [], lastProfileId: null };
  try {
    const st = JSON.parse(raw);
    if (!Array.isArray(st.profiles)) st.profiles = [];
    for (const p of st.profiles) migrateProfile(p);
    return st;
  } catch {
    return { version: 1, profiles: [], lastProfileId: null };
  }
}

export function saveState(state) {
  const raw = JSON.stringify(state);
  const s = storage();
  if (s) {
    try { s.setItem(STORAGE_KEY, raw); return true; } catch { /* quota */ }
  }
  memoryFallback = raw;
  return false;
}

/** Fill in any fields added after a profile was created. */
export function migrateProfile(p) {
  const fresh = createProfile(p.name || 'Player', p.pet?.species || 'mochi', p.pet?.name || 'Pet');
  for (const k of Object.keys(fresh)) if (p[k] === undefined) p[k] = fresh[k];
  p.settings = { ...fresh.settings, ...p.settings };
  p.settings.level = { ...fresh.settings.level, ...(p.settings.level || {}) };
  for (const k of SUBJECTS) p.skills[k] = { ...fresh.skills[k], ...(p.skills[k] || {}) };
  p.inventory = { ...fresh.inventory, ...p.inventory };
  p.equipped = { ...fresh.equipped, ...p.equipped };
  if (p.pet) {
    const fp = fresh.pet;
    for (const k of Object.keys(fp)) if (p.pet[k] === undefined) p.pet[k] = fp[k];
    p.pet.stats = { ...fp.stats, ...p.pet.stats };
    p.pet.care = { ...fp.care, ...p.pet.care };
  }
  return p;
}

export function exportJSON(state) {
  return JSON.stringify(state, null, 2);
}

export function importJSON(text) {
  const st = JSON.parse(text);
  if (!st || !Array.isArray(st.profiles)) throw new Error('Not a Pixel Pals save file');
  for (const p of st.profiles) migrateProfile(p);
  st.version = 1;
  return st;
}
