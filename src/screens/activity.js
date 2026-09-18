// A learning activity: a short round of questions tied to a care action.

import { el, sleep, pick } from '../util.js';
import { iconEl, pixelEmoji } from '../sprites.js';
import { buildRound, recordAnswer, SUBJECT_INFO } from '../content/index.js';
import { button, modal, vibrate } from '../ui.js';
import { sfx } from '../audio.js';
import { speak, cancelSpeech } from '../speech.js';

const PRAISE = ['Yes!', 'Great job!', 'Super!', 'Brilliant!', 'You got it!', 'Amazing!', 'Correct!'];
const RETRY = ['Try again!', 'Almost! Try once more.', 'Not quite. Have another go!'];

export function renderActivity(app, { subject }, done) {
  const profile = app.profile;
  const info = SUBJECT_INFO[subject];
  const round = buildRound(profile, subject);
  const root = el('div', { class: 'activity' });
  let index = 0;
  let correct = 0;
  const results = [];
  let closed = false;

  const dots = el('div', { class: 'dots' });
  let currentSpeak = null;
  const speakBtn = button(null, { icon: 'sound', cls: 'small icon-only', attrs: { 'aria-label': 'Read aloud' }, onClick: () => currentSpeak?.() });
  const head = el('div', { class: 'head' },
    button(null, { icon: 'arrow', cls: 'icon-only ghost', sound: 'back', attrs: { 'aria-label': 'Stop' }, onClick: async () => {
      const ok = await modal({ title: 'STOP?', body: 'Stop this activity? You can try again later.', actions: [{ label: 'Keep going', cls: 'green', value: false }, { label: 'Stop', cls: '', value: true }] });
      if (ok) finish(false);
    } }),
    iconEl(info.icon, 4),
    el('span', { class: 'title' }, info.name.toUpperCase()),
    el('span', { class: 'grow' }),
    speakBtn,
    dots,
  );
  const body = el('div', { class: 'body' });
  const feedback = el('div', { class: 'feedback' });
  root.append(head, body, feedback);

  function renderDots() {
    dots.replaceChildren();
    round.forEach((_, i) => {
      const r = results[i];
      dots.append(el('i', { class: r === true ? 'done' : r === false ? 'miss' : i === index ? 'now' : '' }));
    });
  }

  function finish(completed) {
    if (closed) return;
    closed = true;
    cancelSpeech();
    done({ completed, correct, total: round.length, subject });
  }

  function visualEl(v) {
    if (!v) return null;
    if (v.type === 'objects') {
      const box = el('div', { class: 'objects' });
      for (let i = 0; i < v.count; i++) {
        const ic = iconEl(v.icon, 4);
        const wrap = el('span', { class: v.crossed && i >= v.count - v.crossed ? 'crossed' : '' }, ic);
        box.append(wrap);
      }
      return box;
    }
    if (v.type === 'objects2') {
      const box = el('div', { class: 'objects' });
      const g1 = el('span', { class: 'group' }); for (let i = 0; i < v.a; i++) g1.append(iconEl(v.icon, 4));
      const g2 = el('span', { class: 'group' }); for (let i = 0; i < v.b; i++) g2.append(iconEl(v.icon, 4));
      box.append(g1, el('span', { class: 'plus' }, '+'), g2);
      return box;
    }
    if (v.type === 'groups') {
      const box = el('div', { class: 'objects' });
      for (let g = 0; g < v.groups; g++) { const grp = el('span', { class: 'group' }); for (let i = 0; i < v.each; i++) grp.append(iconEl(v.icon, 4)); box.append(grp); }
      return box;
    }
    if (v.type === 'emoji') {
      const box = el('div', { class: `col center ${v.caption ? 'med-emoji' : 'big-emoji'}`, style: { gap: '4px' } }, pixelEmoji(v.emoji, 16, 7));
      if (v.label) box.append(el('div', { class: 'caption', style: { fontSize: '22px', letterSpacing: '2px' } }, v.label));
      if (v.caption) box.append(el('div', { class: 'caption' }, v.caption));
      return box;
    }
    if (v.type === 'word') return el('div', { class: 'prompt huge' }, v.text);
    if (v.type === 'sentence') return el('div', { class: 'sentence' }, v.text);
    if (v.type === 'shape') return el('div', { class: 'shape' }, v.glyph);
    return null;
  }

  function speakQuestion(q) {
    const text = q.speak || q.prompt;
    speak(text);
  }

  async function showFact(q) {
    body.replaceChildren();
    const card = el('div', { class: 'qcard px col big-emoji' },
      el('div', { class: 'title', style: { fontSize: '11px', opacity: .6 } }, 'DID YOU KNOW?'),
      pixelEmoji(q.fact.emoji, 16, 7),
      el('div', { class: 'fact' }, q.fact.text),
    );
    currentSpeak = () => speak(q.fact.text);
    body.append(card);
    const next = button('Got it!', { icon: 'check', cls: 'green big', onClick: () => { cancelSpeech(); showQuestion(q); } });
    body.append(next);
    speak(q.fact.text);
  }

  function showQuestion(q) {
    body.replaceChildren();
    feedback.textContent = '';
    renderDots();
    const card = el('div', { class: 'qcard px' });
    const vis = visualEl(q.visual);
    if (vis) card.append(vis);
    if (!(q.visual && q.visual.type === 'word' && q.visual.text === q.prompt)) {
      card.append(el('div', { class: 'prompt' }, q.prompt));
    }
    currentSpeak = () => speakQuestion(q);
    body.append(card);
    if (q.kind === 'spell') renderSpell(q); else renderChoice(q);
    speakQuestion(q);
  }

  function renderChoice(q) {
    let attempts = 0;
    let locked = false;
    const n = q.options.length;
    const hasEmoji = q.options.some((o) => o.emoji);
    const grid = el('div', { class: `answers ${n === 3 && !hasEmoji ? 'three' : ''} ${n === 2 && !hasEmoji ? 'one-col' : ''}` });
    const btns = [];
    for (const o of q.options) {
      const b = el('button', { class: `btn px ${o.big ? 'bigtext' : ''}`, type: 'button' });
      if (o.emoji) b.append(pixelEmoji(o.emoji, 16, 5));
      if (o.label !== undefined) b.append(el('span', { class: o.emoji ? 'word' : '' }, o.label));
      b.addEventListener('click', async () => {
        if (locked || b.disabled) return;
        if (o.value === q.answer) {
          locked = true;
          b.classList.add('correct');
          const first = attempts === 0;
          results[index] = first;
          if (first) correct += 1;
          recordAnswer(profile, q, first);
          app.save();
          sfx('correct'); vibrate(20);
          feedback.textContent = first ? pick(PRAISE) : 'That\'s it!';
          if (o.label && o.emoji) speak(String(o.label), { interrupt: true });
          else if (q.skill === 'read') speak(String(q.answer), { interrupt: true });
          renderDots();
          await sleep(900);
          next();
        } else {
          attempts += 1;
          b.classList.add('wrong'); b.disabled = true;
          sfx('wrong'); vibrate([30, 40, 30]);
          if (attempts >= 2) {
            locked = true;
            results[index] = false;
            recordAnswer(profile, q, false);
            app.save();
            const right = btns.find((x) => x.dataset.value === String(q.answer));
            right?.classList.add('correct');
            const label = q.options.find((x) => x.value === q.answer)?.label;
            feedback.textContent = label !== undefined ? `The answer is ${label}` : 'Here is the answer';
            speak(feedback.textContent);
            renderDots();
            await sleep(1700);
            next();
          } else {
            feedback.textContent = pick(RETRY);
          }
        }
      });
      b.dataset.value = String(o.value);
      btns.push(b);
      grid.append(b);
    }
    body.append(grid);
  }

  function renderSpell(q) {
    const word = q.answer;
    let pos = 0;
    let mistakes = 0;
    const slots = el('div', { class: 'slots' });
    const slotEls = word.split('').map(() => el('i'));
    slots.append(...slotEls);
    const tiles = el('div', { class: 'tiles' });
    for (const letter of q.letters) {
      const b = el('button', { class: 'btn px yellow', type: 'button' }, letter);
      b.addEventListener('click', async () => {
        if (b.disabled) return;
        if (letter === word[pos]) {
          slotEls[pos].textContent = letter; slotEls[pos].classList.add('filled');
          b.disabled = true; b.classList.add('correct');
          pos += 1;
          sfx('pop');
          speak(letter, { interrupt: true, rate: 1 });
          if (pos === word.length) {
            const first = mistakes === 0;
            results[index] = first;
            if (first) correct += 1;
            recordAnswer(profile, q, first);
            app.save();
            sfx('correct');
            feedback.textContent = pick(PRAISE) + ' ' + word.toUpperCase();
            speak(word);
            renderDots();
            await sleep(1100);
            next();
          }
        } else {
          mistakes += 1;
          b.classList.add('wrong'); sfx('wrong'); vibrate(30);
          setTimeout(() => b.classList.remove('wrong'), 400);
          feedback.textContent = `Find the letter "${word[pos].toUpperCase()}"`;
          if (mistakes >= 3) { const hint = [...tiles.children].find((t) => t.textContent === word[pos] && !t.disabled); hint?.classList.add('active'); }
        }
      });
      tiles.append(b);
    }
    body.append(slots, tiles);
  }

  function next() {
    index += 1;
    if (index >= round.length) return summary();
    start(round[index]);
  }

  function start(q) {
    if (q.fact) showFact(q); else showQuestion(q);
  }

  async function summary() {
    body.replaceChildren();
    feedback.textContent = '';
    renderDots();
    const perfect = correct === round.length;
    if (perfect) sfx('fanfare'); else sfx('star');
    const card = el('div', { class: 'qcard px col starburst' },
      iconEl(perfect ? 'trophy' : 'star', 8),
      el('div', { class: 'prompt' }, perfect ? 'Perfect round!' : 'Well done!'),
      el('div', { class: 'muted' }, `${correct} of ${round.length} right on the first try`),
    );
    body.append(card, button('Done!', { icon: 'check', cls: 'green big', onClick: () => finish(true) }));
    speak(perfect ? 'Perfect round! Amazing!' : 'Well done!');
  }

  start(round[0]);
  root.cleanup = () => cancelSpeech();
  return root;
}
