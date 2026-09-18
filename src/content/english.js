// English (reading, phonics, spelling) generator, levels 1..6.

import { randInt, pick, shuffle, sample, makeOptions } from '../util.js';

// Word bank with pictures. `fam` = rhyme family.
export const WORDS = [
  { w: 'cat', e: '🐱', fam: 'at' }, { w: 'hat', e: '🎩', fam: 'at' }, { w: 'bat', e: '🦇', fam: 'at' }, { w: 'rat', e: '🐀', fam: 'at' },
  { w: 'dog', e: '🐶', fam: 'og' }, { w: 'frog', e: '🐸', fam: 'og' },
  { w: 'sun', e: '☀️', fam: 'un' }, { w: 'bug', e: '🐞', fam: 'ug' }, { w: 'mug', e: '☕', fam: 'ug' }, { w: 'hug', e: '🤗', fam: 'ug' },
  { w: 'hen', e: '🐔', fam: 'en' }, { w: 'pen', e: '🖊️', fam: 'en' }, { w: 'pig', e: '🐷', fam: 'ig' },
  { w: 'box', e: '📦', fam: 'ox' }, { w: 'fox', e: '🦊', fam: 'ox' },
  { w: 'bee', e: '🐝', fam: 'ee' }, { w: 'tree', e: '🌳', fam: 'ee' }, { w: 'key', e: '🔑', fam: 'ee' },
  { w: 'car', e: '🚗', fam: 'ar' }, { w: 'star', e: '⭐', fam: 'ar' },
  { w: 'moon', e: '🌙', fam: 'oon' }, { w: 'spoon', e: '🥄', fam: 'oon' }, { w: 'balloon', e: '🎈', fam: 'oon' },
  { w: 'cake', e: '🎂', fam: 'ake' }, { w: 'snake', e: '🐍', fam: 'ake' },
  { w: 'bed', e: '🛏️', fam: 'ed' }, { w: 'sled', e: '🛷', fam: 'ed' },
  { w: 'cup', e: '🥤', fam: 'up' }, { w: 'bus', e: '🚌', fam: 'us' },
  { w: 'fish', e: '🐟', fam: 'ish' }, { w: 'dish', e: '🍽️', fam: 'ish' },
  { w: 'ball', e: '⚽', fam: 'all' }, { w: 'wall', e: '🧱', fam: 'all' },
  { w: 'apple', e: '🍎' }, { w: 'egg', e: '🥚' }, { w: 'cow', e: '🐄', fam: 'ow' }, { w: 'owl', e: '🦉' },
  { w: 'duck', e: '🦆', fam: 'uck' }, { w: 'truck', e: '🚚', fam: 'uck' },
  { w: 'bag', e: '👜', fam: 'ag' }, { w: 'flag', e: '🚩', fam: 'ag' },
  { w: 'map', e: '🗺️', fam: 'ap' }, { w: 'cap', e: '🧢', fam: 'ap' },
  { w: 'ant', e: '🐜', fam: 'ant' }, { w: 'plant', e: '🌱', fam: 'ant' },
  { w: 'jam', e: '🍯', fam: 'am' }, { w: 'ham', e: '🍖', fam: 'am' },
  { w: 'milk', e: '🥛' }, { w: 'book', e: '📖' },
  { w: 'boat', e: '⛵', fam: 'oat' }, { w: 'goat', e: '🐐', fam: 'oat' }, { w: 'coat', e: '🧥', fam: 'oat' },
  { w: 'rain', e: '🌧️', fam: 'ain' }, { w: 'train', e: '🚂', fam: 'ain' },
  { w: 'snow', e: '❄️', fam: 'ow2' }, { w: 'bow', e: '🎀', fam: 'ow2' },
  { w: 'leaf', e: '🍃' }, { w: 'bird', e: '🐦' }, { w: 'ship', e: '🚢', fam: 'ip' }, { w: 'lip', e: '👄', fam: 'ip' },
  { w: 'shoe', e: '👟' }, { w: 'cloud', e: '☁️' }, { w: 'house', e: '🏠', fam: 'ouse' }, { w: 'mouse', e: '🐭', fam: 'ouse' },
  { w: 'flower', e: '🌸' }, { w: 'banana', e: '🍌' }, { w: 'grapes', e: '🍇' }, { w: 'cookie', e: '🍪' }, { w: 'bread', e: '🍞' },
  { w: 'horse', e: '🐴' }, { w: 'sheep', e: '🐑', fam: 'eep' }, { w: 'jeep', e: '🚙', fam: 'eep' },
  { w: 'lion', e: '🦁' }, { w: 'bear', e: '🐻', fam: 'air' }, { w: 'pear', e: '🍐', fam: 'air' },
  { w: 'whale', e: '🐳', fam: 'ail' }, { w: 'snail', e: '🐌', fam: 'ail' },
  { w: 'crab', e: '🦀' }, { w: 'drum', e: '🥁' }, { w: 'bell', e: '🔔', fam: 'ell' }, { w: 'shell', e: '🐚', fam: 'ell' },
  { w: 'ring', e: '💍', fam: 'ing' }, { w: 'king', e: '🤴', fam: 'ing' },
  { w: 'hand', e: '✋' }, { w: 'eye', e: '👁️' }, { w: 'nose', e: '👃', fam: 'ose' }, { w: 'rose', e: '🌹', fam: 'ose' }, { w: 'ear', e: '👂' },
  { w: 'bike', e: '🚲' }, { w: 'sock', e: '🧦', fam: 'ock' }, { w: 'clock', e: '⏰', fam: 'ock' }, { w: 'lock', e: '🔒', fam: 'ock' },
  { w: 'fire', e: '🔥' }, { w: 'water', e: '💧' }, { w: 'candy', e: '🍬' }, { w: 'pizza', e: '🍕' }, { w: 'corn', e: '🌽' },
  { w: 'robot', e: '🤖' }, { w: 'ghost', e: '👻' }, { w: 'gift', e: '🎁' }, { w: 'crown', e: '👑' }, { w: 'heart', e: '❤️' },
  { w: 'rainbow', e: '🌈' }, { w: 'rocket', e: '🚀' }, { w: 'zebra', e: '🦓' }, { w: 'monkey', e: '🐵' }, { w: 'tiger', e: '🐯' },
  { w: 'rabbit', e: '🐰' }, { w: 'panda', e: '🐼' }, { w: 'penguin', e: '🐧' }, { w: 'turtle', e: '🐢' }, { w: 'octopus', e: '🐙' },
  { w: 'elephant', e: '🐘' }, { w: 'dolphin', e: '🐬' }, { w: 'spider', e: '🕷️' }, { w: 'butterfly', e: '🦋' },
];

const byWord = Object.fromEntries(WORDS.map((x) => [x.w, x]));
export const wordEntry = (w) => byWord[w];
const short = (n) => WORDS.filter((x) => x.w.length <= n);
const ofLen = (lo, hi) => WORDS.filter((x) => x.w.length >= lo && x.w.length <= hi);

export const SIGHT_WORDS = ['the', 'and', 'is', 'it', 'in', 'to', 'see', 'my', 'you', 'we', 'can', 'go', 'up', 'look', 'like', 'me', 'big', 'little', 'red', 'said', 'she', 'he', 'was', 'are', 'for', 'of', 'at', 'on', 'this', 'with', 'play', 'run', 'jump', 'come', 'here', 'have', 'do', 'not', 'yes', 'no'];

export const SENTENCES = [
  { s: 'The cat is on the bed.', q: 'Where is the cat?', a: 'bed', d: ['car', 'tree'] },
  { s: 'I see a big red bus.', q: 'What do I see?', a: 'bus', d: ['dog', 'sun'] },
  { s: 'The frog can hop.', q: 'Who can hop?', a: 'frog', d: ['fish', 'cow'] },
  { s: 'The sun is hot.', q: 'What is hot?', a: 'sun', d: ['snow', 'moon'] },
  { s: 'Mum has a pink hat.', q: 'What does Mum have?', a: 'hat', d: ['bag', 'cup'] },
  { s: 'The dog has a ball.', q: 'What does the dog have?', a: 'ball', d: ['hat', 'cake'] },
  { s: 'A bee is on the flower.', q: 'Where is the bee?', a: 'flower', d: ['tree', 'house'] },
  { s: 'We eat cake at the party.', q: 'What do we eat?', a: 'cake', d: ['pizza', 'apple'] },
  { s: 'The fish can swim.', q: 'Who can swim?', a: 'fish', d: ['pig', 'hen'] },
  { s: 'The bird is in the tree.', q: 'Where is the bird?', a: 'tree', d: ['car', 'bed'] },
  { s: 'I can see the moon at night.', q: 'What can I see at night?', a: 'moon', d: ['sun', 'bus'] },
  { s: 'The pig is in the mud.', q: 'Who is in the mud?', a: 'pig', d: ['cat', 'owl'] },
  { s: 'Dad put the milk in the cup.', q: 'What is in the cup?', a: 'milk', d: ['jam', 'water'] },
  { s: 'The snake is long and green.', q: 'Who is long and green?', a: 'snake', d: ['bear', 'duck'] },
  { s: 'My shoes are wet from the rain.', q: 'What made my shoes wet?', a: 'rain', d: ['snow', 'fire'] },
  { s: 'The owl sleeps in the day.', q: 'Who sleeps in the day?', a: 'owl', d: ['dog', 'cow'] },
  { s: 'The king has a gold crown.', q: 'What does the king have?', a: 'crown', d: ['hat', 'ring'] },
  { s: 'The train is fast.', q: 'What is fast?', a: 'train', d: ['snail', 'turtle'] },
  { s: 'A whale is very big.', q: 'What is very big?', a: 'whale', d: ['ant', 'bee'] },
  { s: 'I put a sock on my foot.', q: 'What did I put on?', a: 'sock', d: ['hat', 'ring'] },
  { s: 'The mouse hides in the box.', q: 'Where does the mouse hide?', a: 'box', d: ['bag', 'cup'] },
  { s: 'The duck swims on the pond.', q: 'Who swims on the pond?', a: 'duck', d: ['lion', 'horse'] },
  { s: 'Zoe rides her bike to school.', q: 'What does Zoe ride?', a: 'bike', d: ['bus', 'boat'] },
  { s: 'The bear eats honey.', q: 'Who eats honey?', a: 'bear', d: ['fox', 'crab'] },
  { s: 'Sam has a drum and a bell.', q: 'What does Sam have?', a: 'drum', d: ['book', 'key'] },
  { s: 'The rocket flies to the moon.', q: 'Where does the rocket fly?', a: 'moon', d: ['house', 'tree'] },
];

export const YESNO = [
  { s: 'The sun is hot.', a: true }, { s: 'A fish can fly.', a: false }, { s: 'Cows can read books.', a: false },
  { s: 'Snow is cold.', a: true }, { s: 'A bus is bigger than a bee.', a: true }, { s: 'Frogs can hop.', a: true },
  { s: 'Dogs can talk.', a: false }, { s: 'The moon comes out at night.', a: true }, { s: 'Apples grow on cars.', a: false },
  { s: 'A cat has four legs.', a: true }, { s: 'Pigs live in the sea.', a: false }, { s: 'Birds have wings.', a: true },
  { s: 'Ice is hot.', a: false }, { s: 'A whale is very small.', a: false }, { s: 'Bees make honey.', a: true },
  { s: 'You wear socks on your hands.', a: false }, { s: 'A ball is round.', a: true }, { s: 'Trees can run.', a: false },
];

export const OPPOSITES = [
  ['big', 'small'], ['hot', 'cold'], ['up', 'down'], ['fast', 'slow'], ['wet', 'dry'], ['happy', 'sad'], ['day', 'night'],
  ['open', 'closed'], ['in', 'out'], ['on', 'off'], ['tall', 'short'], ['loud', 'quiet'], ['full', 'empty'], ['old', 'new'],
  ['light', 'dark'], ['clean', 'dirty'], ['soft', 'hard'], ['push', 'pull'], ['yes', 'no'], ['stop', 'go'],
];

export const PLURALS = [
  ['cat', 'cats'], ['dog', 'dogs'], ['egg', 'eggs'], ['box', 'boxes'], ['bus', 'buses'], ['fox', 'foxes'], ['mouse', 'mice'],
  ['foot', 'feet'], ['tooth', 'teeth'], ['child', 'children'], ['sheep', 'sheep'], ['man', 'men'], ['bee', 'bees'], ['dish', 'dishes'],
];

const ALPHA = 'abcdefghijklmnopqrstuvwxyz'.split('');

function q(skill, fields) {
  return { subject: 'english', skill, kind: 'choice', ...fields, id: `english:${skill}:${fields.id ?? fields.prompt}` };
}
const pic = (entry, showLabel) => ({ emoji: entry.e, label: showLabel ? entry.w : undefined, value: entry.w });

// ---- Skills -------------------------------------------------------------

function tapLetter() {
  const l = pick(ALPHA);
  const upper = Math.random() < 0.6;
  const fmt = (x) => (upper ? x.toUpperCase() : x);
  const opts = makeOptions(l, ALPHA, 4).map((x) => ({ label: fmt(x), value: x, big: true }));
  return q('letter', { prompt: `Tap the letter ${l.toUpperCase()}`, speak: `Tap the letter ${l.toUpperCase()}`, options: opts, answer: l, id: l + (upper ? 'U' : 'l') });
}

function matchCase() {
  const l = pick(ALPHA);
  const toLower = Math.random() < 0.5;
  const shown = toLower ? l.toUpperCase() : l;
  const opts = makeOptions(l, ALPHA, 3).map((x) => ({ label: toLower ? x : x.toUpperCase(), value: x, big: true }));
  return q('case', {
    prompt: toLower ? `Big ${shown}. Find the small one.` : `Small ${shown}. Find the big one.`,
    speak: toLower ? `This is a big ${l.toUpperCase()}. Find the small ${l.toUpperCase()}.` : `This is a small ${l.toUpperCase()}. Find the big ${l.toUpperCase()}.`,
    visual: { type: 'word', text: shown },
    options: opts, answer: l, id: l + (toLower ? 'L' : 'U'),
  });
}

function firstLetter() {
  const entry = pick(short(5));
  const l = entry.w[0];
  const opts = makeOptions(l, ALPHA, 3).map((x) => ({ label: x.toUpperCase(), value: x, big: true }));
  return q('first', {
    prompt: `${entry.w} starts with...?`,
    speak: `Which letter does ${entry.w} start with?`,
    visual: { type: 'emoji', emoji: entry.e, label: entry.w },
    options: opts, answer: l, id: entry.w,
  });
}

function firstSound() {
  const entry = pick(short(6));
  const l = entry.w[0];
  const others = sample(WORDS.filter((x) => x.w[0] !== l), 2);
  const opts = shuffle([entry, ...others]).map((x) => pic(x, true));
  return q('sound', {
    prompt: `Which one starts with "${l.toUpperCase()}"?`,
    speak: `Which one starts with the letter ${l.toUpperCase()}?`,
    options: opts, answer: entry.w, id: entry.w,
  });
}

function readWord(maxLen) {
  const entry = pick(ofLen(3, maxLen));
  const others = sample(WORDS.filter((x) => x.w !== entry.w && x.w[0] !== entry.w[0]), 2);
  const opts = shuffle([entry, ...others]).map((x) => pic(x, false));
  return q('read', {
    prompt: entry.w,
    speak: 'Read the word. Then tap the picture.',
    visual: { type: 'word', text: entry.w, big: true },
    options: opts, answer: entry.w, id: entry.w,
  });
}

function pickWord(maxLen) {
  const entry = pick(ofLen(3, maxLen));
  const others = sample(WORDS.filter((x) => x.w !== entry.w && Math.abs(x.w.length - entry.w.length) <= 1), 2);
  const opts = shuffle([entry, ...others]).map((x) => ({ label: x.w, value: x.w }));
  return q('pickword', {
    prompt: 'Which word matches the picture?',
    visual: { type: 'emoji', emoji: entry.e },
    options: opts, answer: entry.w, id: entry.w,
  });
}

function sightWord() {
  const w = pick(SIGHT_WORDS);
  const opts = makeOptions(w, SIGHT_WORDS.filter((x) => x.length <= w.length + 1), 3).map((x) => ({ label: x, value: x }));
  return q('sight', { prompt: `Tap the word "${w}"`, speak: `Tap the word: ${w}`, options: opts, answer: w, id: w });
}

function rhyme() {
  const fams = {};
  for (const w of WORDS) if (w.fam) (fams[w.fam] ||= []).push(w);
  const fam = pick(Object.values(fams).filter((f) => f.length >= 2));
  const [a, b] = sample(fam, 2);
  const others = sample(WORDS.filter((x) => x.fam !== a.fam), 2);
  const opts = shuffle([b, ...others]).map((x) => pic(x, true));
  return q('rhyme', {
    prompt: `Which one rhymes with ${a.w}?`,
    visual: { type: 'emoji', emoji: a.e, label: a.w },
    options: opts, answer: b.w, id: a.w + '>' + b.w,
  });
}

function sentence() {
  const s = pick(SENTENCES);
  const opts = shuffle([s.a, ...s.d]).map((w) => pic(byWord[w] || { w, e: '❔' }, true));
  return q('sentence', {
    prompt: s.q,
    speak: s.s + ' ... ' + s.q,
    visual: { type: 'sentence', text: s.s },
    options: opts, answer: s.a, id: s.s,
  });
}

function yesNo() {
  const s = pick(YESNO);
  return q('yesno', {
    prompt: 'True or not true?',
    speak: s.s + ' ... Is that true?',
    visual: { type: 'sentence', text: s.s },
    options: [{ label: 'Yes', value: true }, { label: 'No', value: false }],
    answer: s.a, id: s.s,
  });
}

function missingLetter(maxLen) {
  const entry = pick(ofLen(3, maxLen));
  const i = randInt(0, entry.w.length - 1);
  const l = entry.w[i];
  const shown = entry.w.slice(0, i) + '_' + entry.w.slice(i + 1);
  const opts = makeOptions(l, ALPHA, 3).map((x) => ({ label: x, value: x, big: true }));
  return q('missing', {
    prompt: 'Which letter is missing?',
    speak: `Which letter is missing in ${entry.w}?`,
    visual: { type: 'emoji', emoji: entry.e, caption: shown },
    options: opts, answer: l, id: entry.w + i,
  });
}

function spell(minLen, maxLen) {
  const entry = pick(ofLen(minLen, maxLen));
  const letters = entry.w.split('');
  const extra = sample(ALPHA.filter((x) => !letters.includes(x)), 2);
  return {
    subject: 'english', skill: 'spell', kind: 'spell', level: 0,
    id: `english:spell:${entry.w}`,
    prompt: `Spell "${entry.w}"`,
    speak: `Spell the word ${entry.w}`,
    visual: { type: 'emoji', emoji: entry.e, label: entry.w, hideLabelAfter: true },
    letters: shuffle([...letters, ...extra]),
    answer: entry.w,
  };
}

function opposite() {
  const pair = pick(OPPOSITES);
  const [a, b] = Math.random() < 0.5 ? pair : [pair[1], pair[0]];
  const pool = OPPOSITES.flat().filter((x) => x !== a && x !== b);
  const opts = makeOptions(b, pool, 3).map((x) => ({ label: x, value: x }));
  return q('opposite', { prompt: `What is the opposite of "${a}"?`, options: opts, answer: b, id: a });
}

function plural() {
  const [one, many] = pick(PLURALS);
  const pool = PLURALS.map((p) => p[1]).filter((x) => x !== many);
  const opts = makeOptions(many, pool, 3).map((x) => ({ label: x, value: x }));
  return q('plural', { prompt: `One ${one}. Two ...?`, speak: `One ${one}. Two what?`, options: opts, answer: many, id: one });
}

const LEVELS = {
  1: [tapLetter, tapLetter, matchCase, firstLetter],
  2: [firstLetter, firstSound, matchCase, () => readWord(3), sightWord],
  3: [() => readWord(3), () => pickWord(3), firstSound, sightWord, rhyme],
  4: [() => readWord(4), () => pickWord(4), rhyme, sentence, () => missingLetter(3)],
  5: [() => spell(3, 3), () => missingLetter(4), sentence, () => readWord(5), yesNo],
  6: [() => spell(3, 4), sentence, yesNo, opposite, plural, () => readWord(7)],
};

export const MAX_LEVEL = 6;

export function genEnglish(level = 1) {
  const lv = Math.max(1, Math.min(MAX_LEVEL, Math.round(level)));
  const question = pick(LEVELS[lv])();
  question.level = lv;
  return question;
}
