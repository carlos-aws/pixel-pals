// Achievements shown in the album. `check` returns true when earned.

import { currentStreak } from './pet.js';

export const BADGES = [
  { id: 'hatched', name: 'Hatched!', icon: 'egg', desc: 'Your egg hatched', check: (p) => p.pet.stage >= 1 || p.album.length > 0 },
  { id: 'first_star', name: 'First Star', icon: 'star', desc: 'Earn your first star', check: (p) => p.totals.stars >= 1 },
  { id: 'ten', name: 'Busy Bee', icon: 'flask', desc: 'Finish 10 activities', check: (p) => p.totals.activities >= 10 },
  { id: 'fifty', name: 'Super Learner', icon: 'book', desc: 'Finish 50 activities', check: (p) => p.totals.activities >= 50 },
  { id: 'two_hundred', name: 'Brainiac', icon: 'trophy', desc: 'Finish 200 activities', check: (p) => p.totals.activities >= 200 },
  { id: 'streak3', name: '3 Days', icon: 'sun', desc: 'Play 3 days in a row', check: (p) => currentStreak(p) >= 3 || p.streak >= 3 },
  { id: 'streak7', name: 'One Week', icon: 'heart', desc: 'Play 7 days in a row', check: (p) => p.streak >= 7 },
  { id: 'streak30', name: 'One Month', icon: 'moon', desc: 'Play 30 days in a row', check: (p) => p.streak >= 30 },
  { id: 'math3', name: 'Number Ninja', icon: 'apple', desc: 'Reach maths level 3', check: (p) => p.skills.math.level >= 3 },
  { id: 'english3', name: 'Word Wizard', icon: 'ball', desc: 'Reach English level 3', check: (p) => p.skills.english.level >= 3 },
  { id: 'science3', name: 'Explorer', icon: 'flask', desc: 'Reach science level 3', check: (p) => p.skills.science.level >= 3 },
  { id: 'math6', name: 'Maths Master', icon: 'trophy', desc: 'Reach maths level 6', check: (p) => p.skills.math.level >= 6 },
  { id: 'english6', name: 'Reading Star', icon: 'trophy', desc: 'Reach English level 6', check: (p) => p.skills.english.level >= 6 },
  { id: 'kid', name: 'Growing Up', icon: 'plus', desc: 'Pet becomes a Kid', check: (p) => p.pet.stage >= 2 || p.album.length > 0 },
  { id: 'adult', name: 'All Grown', icon: 'star', desc: 'Pet becomes a Grown-up', check: (p) => p.pet.stage >= 4 || p.album.length > 0 },
  { id: 'legend', name: 'Legend', icon: 'trophy', desc: 'Pet reaches Legend', check: (p) => p.pet.stage >= 5 || p.album.length > 0 },
  { id: 'rich', name: 'Coin Collector', icon: 'coin', desc: 'Hold 100 coins', check: (p) => p.coins >= 100 },
  { id: 'fashion', name: 'Fashionista', icon: 'hatIcon', desc: 'Own 3 hats', check: (p) => (p.inventory.hats || []).length >= 3 },
  { id: 'gamer', name: 'Gamer', icon: 'gamepad', desc: 'Play 10 mini-games', check: (p) => (p.gamesPlayed || 0) >= 10 },
];

/** Add newly earned badges to the profile. Returns the new ones. */
export function checkBadges(profile) {
  const fresh = [];
  profile.badges = profile.badges || [];
  for (const b of BADGES) {
    if (profile.badges.includes(b.id)) continue;
    let ok = false;
    try { ok = b.check(profile); } catch { ok = false; }
    if (ok) { profile.badges.push(b.id); fresh.push(b); }
  }
  return fresh;
}
