// Content engine: picks questions at the right level, adapts difficulty and
// remembers misses so the "Clean" activity can review them.

import { genMath } from './math.js';
import { genEnglish } from './english.js';
import { genScience } from './science.js';
import { pick, shuffle } from '../util.js';

export const SUBJECT_INFO = {
  math: { name: 'Maths', icon: 'apple', color: '#ff5d6c', need: 'food', rounds: 3 },
  english: { name: 'English', icon: 'ball', color: '#4fa3ff', need: 'fun', rounds: 3 },
  science: { name: 'Science', icon: 'flask', color: '#5dd35d', need: 'brain', rounds: 2 },
  review: { name: 'Review', icon: 'sponge', color: '#ffd83d', need: 'clean', rounds: 3 },
};

const GEN = { math: genMath, english: genEnglish, science: genScience };
const MAX_LEVEL = 6;
const MAX_MISSED = 12;

export function effectiveLevel(profile, subject) {
  const s = profile.settings;
  if (!s.autoLevel) return s.level?.[subject] ?? 1;
  return profile.skills?.[subject]?.level ?? 1;
}

export function generate(profile, subject) {
  const level = effectiveLevel(profile, subject);
  if (subject === 'science') return genScience(level, profile.seenFacts || []);
  return GEN[subject](level);
}

/** Build the list of questions for one activity. */
export function buildRound(profile, subject) {
  const n = SUBJECT_INFO[subject].rounds;
  const out = [];
  const ids = new Set();
  if (subject === 'review') {
    const missed = shuffle(profile.missed || []).slice(0, 2);
    for (const q of missed) { out.push({ ...q, review: true }); ids.add(q.id); }
    const fill = ['math', 'english', 'science'];
    let guard = 0;
    while (out.length < n && guard++ < 30) {
      const q = generate(profile, pick(fill));
      if (q.fact) delete q.fact; // keep review quick: no fact cards
      if (!ids.has(q.id)) { out.push(q); ids.add(q.id); }
    }
    return out;
  }
  let guard = 0;
  while (out.length < n && guard++ < 40) {
    const q = generate(profile, subject);
    if (!ids.has(q.id)) { out.push(q); ids.add(q.id); }
  }
  return out;
}

/**
 * Record how a question went. `firstTry` is true when the child answered
 * correctly on the first tap. Adjusts the level when auto-level is on.
 */
export function recordAnswer(profile, question, firstTry) {
  const subject = question.subject;
  const sk = profile.skills[subject];
  sk.answered += 1;
  if (firstTry) {
    sk.right += 1;
    sk.streak += 1;
    sk.misses = 0;
    if (sk.streak >= 4 && sk.level < MAX_LEVEL) { sk.level += 1; sk.streak = 0; }
    profile.missed = (profile.missed || []).filter((m) => m.id !== question.id);
  } else {
    sk.streak = 0;
    sk.misses += 1;
    if (sk.misses >= 3 && sk.level > 1) { sk.level -= 1; sk.misses = 0; }
    if (!question.review) {
      const missed = (profile.missed || []).filter((m) => m.id !== question.id);
      const rest = { ...question };
      delete rest.fact;
      missed.push(rest);
      profile.missed = missed.slice(-MAX_MISSED);
    }
  }
  if (question.factId) {
    const seen = profile.seenFacts || [];
    if (!seen.includes(question.factId)) profile.seenFacts = [...seen, question.factId].slice(-60);
  }
}
