// Maths question generator, levels 1..6.
// Every question has exactly one correct option among the `options`.

import { randInt, pick, shuffle, makeOptions, sample, numberWord } from '../util.js';

const OBJECTS = ['apple', 'star', 'heart', 'coin', 'ball', 'cookie', 'carrot', 'egg'];
const OBJECT_NAMES = { apple: 'apples', star: 'stars', heart: 'hearts', coin: 'coins', ball: 'balls', cookie: 'cookies', carrot: 'carrots', egg: 'eggs' };

const SHAPES = [
  { name: 'circle', glyph: '●', sides: 0 },
  { name: 'square', glyph: '■', sides: 4 },
  { name: 'triangle', glyph: '▲', sides: 3 },
  { name: 'rectangle', glyph: '▬', sides: 4 },
  { name: 'star', glyph: '★', sides: 10 },
  { name: 'heart', glyph: '♥', sides: 0 },
  { name: 'diamond', glyph: '◆', sides: 4 },
];

const numOpts = (answer, lo, hi, n = 3) => {
  const pool = [];
  for (let i = lo; i <= hi; i++) if (i !== answer) pool.push(i);
  return makeOptions(answer, pool, n).map((v) => ({ label: String(v), value: v }));
};

function q(skill, fields) {
  return { subject: 'math', skill, kind: 'choice', ...fields, id: `math:${skill}:${fields.id ?? fields.prompt}` };
}

// ---- Skills -------------------------------------------------------------

function count(max) {
  const n = randInt(1, max);
  const icon = pick(OBJECTS);
  return q('count', {
    prompt: `How many ${OBJECT_NAMES[icon]}?`,
    visual: { type: 'objects', icon, count: n },
    options: numOpts(n, Math.max(1, n - 3), Math.min(max, n + 3)),
    answer: n,
    id: `${icon}${n}`,
  });
}

function findNumber(max) {
  const n = randInt(1, max);
  return q('number', {
    prompt: `Tap the number ${numberWord(n)}`,
    speak: `Tap the number ${n}`,
    options: numOpts(n, Math.max(1, n - 4), Math.min(max, n + 4), 4),
    answer: n,
    id: String(n),
  });
}

function addObjects(max) {
  const a = randInt(1, max - 1);
  const b = randInt(1, max - a);
  const icon = pick(OBJECTS);
  return q('add', {
    prompt: `${a} + ${b} = ?`,
    speak: `${a} plus ${b} equals what?`,
    visual: { type: 'objects2', icon, a, b },
    options: numOpts(a + b, Math.max(0, a + b - 3), a + b + 3),
    answer: a + b,
    id: `${a}+${b}`,
  });
}

function addNumbers(max) {
  const a = randInt(1, max - 1);
  const b = randInt(1, max - a);
  return q('add', {
    prompt: `${a} + ${b} = ?`,
    speak: `${a} plus ${b} equals what?`,
    options: numOpts(a + b, Math.max(0, a + b - 4), a + b + 4),
    answer: a + b,
    id: `${a}+${b}`,
  });
}

function subObjects(max) {
  const a = randInt(2, max);
  const b = randInt(1, a - 1);
  const icon = pick(OBJECTS);
  return q('sub', {
    prompt: `${a} - ${b} = ?`,
    speak: `${a} ${OBJECT_NAMES[icon]}. Take away ${b}. How many are left?`,
    visual: { type: 'objects', icon, count: a, crossed: b },
    options: numOpts(a - b, Math.max(0, a - b - 3), a - b + 3),
    answer: a - b,
    id: `${a}-${b}`,
  });
}

function subNumbers(max) {
  const a = randInt(2, max);
  const b = randInt(1, a - 1);
  return q('sub', {
    prompt: `${a} - ${b} = ?`,
    speak: `${a} minus ${b} equals what?`,
    options: numOpts(a - b, Math.max(0, a - b - 4), a - b + 4),
    answer: a - b,
    id: `${a}-${b}`,
  });
}

function compare(max) {
  let a = randInt(1, max), b = randInt(1, max);
  while (b === a) b = randInt(1, max);
  const bigger = Math.random() < 0.5;
  const answer = bigger ? Math.max(a, b) : Math.min(a, b);
  return q('compare', {
    prompt: `Which number is ${bigger ? 'bigger' : 'smaller'}?`,
    options: shuffle([{ label: String(a), value: a }, { label: String(b), value: b }]),
    answer,
    id: `${a}v${b}${bigger ? 'b' : 's'}`,
  });
}

function shapeName() {
  const s = pick(SHAPES.slice(0, 5));
  const others = SHAPES.filter((x) => x !== s);
  const opts = shuffle([s, ...sample(others, 2)]).map((x) => ({ label: x.glyph, value: x.name, big: true }));
  return q('shape', {
    prompt: `Tap the ${s.name}`,
    options: opts,
    answer: s.name,
    id: s.name,
  });
}

function shapeSides() {
  const s = pick(SHAPES.filter((x) => x.sides > 0 && x.sides < 5));
  return q('sides', {
    prompt: `How many sides does a ${s.name} have?`,
    visual: { type: 'shape', glyph: s.glyph },
    options: numOpts(s.sides, 1, 6),
    answer: s.sides,
    id: s.name,
  });
}

function sequence(step, max) {
  const start = step * randInt(1, 3);
  const seq = [start, start + step, start + 2 * step];
  const answer = start + 3 * step;
  if (answer > max) return sequence(step, max + step * 4);
  return q('sequence', {
    prompt: `${seq.join(', ')}, ?`,
    speak: `What comes next? ${seq.join(', ')} ...`,
    options: numOpts(answer, answer - 3, answer + 3),
    answer,
    id: `${start}s${step}`,
  });
}

function beforeAfter(max) {
  const n = randInt(2, max - 1);
  const after = Math.random() < 0.5;
  const answer = after ? n + 1 : n - 1;
  return q('order', {
    prompt: `What comes ${after ? 'after' : 'before'} ${n}?`,
    options: numOpts(answer, Math.max(0, answer - 3), answer + 3),
    answer,
    id: `${n}${after ? 'a' : 'b'}`,
  });
}

function doubles(max) {
  const n = randInt(1, max);
  return q('double', {
    prompt: `Double ${n} = ?`,
    speak: `What is double ${n}?`,
    options: numOpts(n * 2, Math.max(0, n * 2 - 3), n * 2 + 3),
    answer: n * 2,
    id: String(n),
  });
}

function halves(max) {
  const n = randInt(1, max);
  return q('half', {
    prompt: `Half of ${n * 2} = ?`,
    speak: `What is half of ${n * 2}?`,
    options: numOpts(n, Math.max(0, n - 3), n + 3),
    answer: n,
    id: String(n),
  });
}

function groups() {
  const g = randInt(2, 4), each = randInt(2, 4);
  const icon = pick(OBJECTS);
  return q('groups', {
    prompt: `${g} groups of ${each} = ?`,
    speak: `${g} groups of ${each}. How many altogether?`,
    visual: { type: 'groups', icon, groups: g, each },
    options: numOpts(g * each, Math.max(1, g * each - 4), g * each + 4),
    answer: g * each,
    id: `${g}x${each}`,
  });
}

function addThree() {
  const a = randInt(1, 6), b = randInt(1, 6), c = randInt(1, 6);
  return q('add3', {
    prompt: `${a} + ${b} + ${c} = ?`,
    speak: `${a} plus ${b} plus ${c} equals what?`,
    options: numOpts(a + b + c, a + b + c - 4, a + b + c + 4),
    answer: a + b + c,
    id: `${a}+${b}+${c}`,
  });
}

const NAMES = ['Mia', 'Leo', 'Zoe', 'Sam', 'Ava', 'Max'];
function wordProblem() {
  const name = pick(NAMES);
  const icon = pick(OBJECTS);
  const thing = OBJECT_NAMES[icon];
  const a = randInt(2, 9), b = randInt(1, 6);
  if (Math.random() < 0.5) {
    return q('story', {
      prompt: `${name} has ${a} ${thing}. ${name} gets ${b} more. How many now?`,
      visual: { type: 'objects2', icon, a, b },
      options: numOpts(a + b, a + b - 3, a + b + 3),
      answer: a + b,
      id: `${a}+${b}${icon}`,
    });
  }
  const take = Math.min(b, a - 1);
  return q('story', {
    prompt: `${name} has ${a} ${thing}. ${name} gives away ${take}. How many are left?`,
    visual: { type: 'objects', icon, count: a, crossed: take },
    options: numOpts(a - take, Math.max(0, a - take - 3), a - take + 3),
    answer: a - take,
    id: `${a}-${take}${icon}`,
  });
}

// ---- Level tables ---------------------------------------------------------

const LEVELS = {
  1: [() => count(5), () => count(5), () => findNumber(5), () => shapeName()],
  2: [() => count(10), () => addObjects(5), () => findNumber(10), () => shapeName(), () => shapeSides()],
  3: [() => addObjects(10), () => subObjects(5), () => compare(10), () => count(10), () => beforeAfter(10)],
  4: [() => addNumbers(10), () => subNumbers(10), () => sequence(2, 20), () => beforeAfter(20), () => compare(20), () => subObjects(10)],
  5: [() => addNumbers(20), () => subNumbers(10), () => doubles(10), () => sequence(5, 50), () => sequence(10, 100), () => halves(5)],
  6: [() => addNumbers(20), () => subNumbers(20), () => groups(), () => halves(10), () => addThree(), () => wordProblem(), () => sequence(3, 30)],
};

export const MAX_LEVEL = 6;

export function genMath(level = 1) {
  const lv = Math.max(1, Math.min(MAX_LEVEL, Math.round(level)));
  const gen = pick(LEVELS[lv]);
  const question = gen();
  question.level = lv;
  return question;
}
