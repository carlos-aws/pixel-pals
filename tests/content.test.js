import { test } from 'node:test';
import assert from 'node:assert/strict';
import { genMath } from '../src/content/math.js';
import { genEnglish, WORDS, SENTENCES } from '../src/content/english.js';
import { genScience, FACTS } from '../src/content/science.js';
import { buildRound, recordAnswer } from '../src/content/index.js';
import { createProfile } from '../src/storage.js';

function checkChoice(q) {
  assert.ok(q.prompt, 'prompt');
  assert.ok(Array.isArray(q.options) && q.options.length >= 2 && q.options.length <= 4, 'option count ' + q.id);
  const matches = q.options.filter((o) => o.value === q.answer);
  assert.equal(matches.length, 1, `exactly one correct option for ${q.id}: ${JSON.stringify(q.options)} answer=${q.answer}`);
  const labels = q.options.map((o) => o.label ?? o.emoji);
  assert.equal(new Set(labels).size, labels.length, 'duplicate option labels in ' + q.id);
}

test('maths questions are valid at every level', () => {
  for (let lv = 1; lv <= 6; lv++) {
    for (let i = 0; i < 300; i++) {
      const q = genMath(lv);
      assert.equal(q.subject, 'math');
      checkChoice(q);
      if (q.visual?.type === 'objects') assert.ok(q.visual.count >= 1 && q.visual.count <= 20);
    }
  }
});

test('english questions are valid at every level', () => {
  for (let lv = 1; lv <= 6; lv++) {
    for (let i = 0; i < 300; i++) {
      const q = genEnglish(lv);
      assert.equal(q.subject, 'english');
      if (q.kind === 'spell') {
        for (const ch of q.answer) assert.ok(q.letters.includes(ch), `letters for ${q.answer} include ${ch}`);
        const counts = {};
        for (const ch of q.answer) counts[ch] = (counts[ch] || 0) + 1;
        for (const [ch, n] of Object.entries(counts)) {
          assert.ok(q.letters.filter((l) => l === ch).length >= n, `enough ${ch} tiles for ${q.answer}`);
        }
      } else {
        checkChoice(q);
      }
    }
  }
});

test('sentence answers exist in the word bank', () => {
  const words = new Set(WORDS.map((w) => w.w));
  for (const s of SENTENCES) {
    assert.ok(words.has(s.a), `answer ${s.a} in bank`);
    for (const d of s.d) assert.ok(words.has(d), `distractor ${d} in bank`);
  }
});

test('science questions are valid and facts have unique ids', () => {
  const ids = FACTS.map((f) => f.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const f of FACTS) assert.ok(!f.d.includes(f.a), 'distractor equals answer: ' + f.id);
  for (let lv = 1; lv <= 6; lv++) {
    for (let i = 0; i < 300; i++) {
      const q = genScience(lv, []);
      assert.equal(q.subject, 'science');
      checkChoice(q);
    }
  }
});

test('facts are cycled before repeating', () => {
  const seen = [];
  for (let i = 0; i < 200; i++) {
    const q = genScience(1, seen);
    if (q.factId) {
      assert.ok(!seen.includes(q.factId) || seen.length >= FACTS.filter((f) => f.lvl <= 1).length);
      if (!seen.includes(q.factId)) seen.push(q.factId);
    }
  }
});

test('rounds have distinct questions and review pulls from misses', () => {
  const p = createProfile('A', 'mochi', 'M');
  for (const subject of ['math', 'english', 'science']) {
    const round = buildRound(p, subject);
    assert.equal(new Set(round.map((q) => q.id)).size, round.length);
  }
  const q = genMath(1);
  recordAnswer(p, q, false);
  assert.equal(p.missed.length, 1);
  const review = buildRound(p, 'review');
  assert.equal(review.length, 3);
  assert.ok(review.some((r) => r.id === q.id && r.review));
  recordAnswer(p, review.find((r) => r.id === q.id), true);
  assert.equal(p.missed.length, 0);
});

test('levels adapt up on streaks and down on repeated misses', () => {
  const p = createProfile('A', 'rex', 'R');
  for (let i = 0; i < 4; i++) recordAnswer(p, genMath(1), true);
  assert.equal(p.skills.math.level, 2);
  for (let i = 0; i < 3; i++) recordAnswer(p, genMath(2), false);
  assert.equal(p.skills.math.level, 1);
  for (let i = 0; i < 3; i++) recordAnswer(p, genMath(1), false);
  assert.equal(p.skills.math.level, 1, 'never below 1');
});
