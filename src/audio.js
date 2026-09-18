// Chiptune sound effects and a tiny looping tune, all synthesised with the
// Web Audio API so the game needs no audio files.

let ctx = null;
let master = null;
let musicGain = null;
let sfxGain = null;
const prefs = { sound: true, music: true };
let musicTimer = null;
let musicStep = 0;
let musicStarted = false;

export function setAudioPrefs(p) {
  Object.assign(prefs, p);
  if (musicGain) musicGain.gain.value = prefs.music ? 0.16 : 0;
  if (sfxGain) sfxGain.gain.value = prefs.sound ? 0.5 : 0;
  if (prefs.music && musicStarted && !musicTimer) startMusic();
  if (!prefs.music) stopMusic();
}

/** Must be called from a user gesture (tap) to unlock audio on mobile. */
export function unlockAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.6;
  master.connect(ctx.destination);
  sfxGain = ctx.createGain();
  sfxGain.gain.value = prefs.sound ? 0.5 : 0;
  sfxGain.connect(master);
  musicGain = ctx.createGain();
  musicGain.gain.value = prefs.music ? 0.16 : 0;
  musicGain.connect(master);
  if (musicStarted) startMusic();
}

const NOTE = {};
const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
for (let o = 2; o <= 7; o++) names.forEach((n, i) => { NOTE[n + o] = 440 * Math.pow(2, (o - 4) + (i - 9) / 12); });

function tone(freq, start, dur, { type = 'square', vol = 0.3, dest = sfxGain, slide = 0 } = {}) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g); g.connect(dest);
  osc.start(start); osc.stop(start + dur + 0.02);
}

function noise(start, dur, vol = 0.2) {
  if (!ctx) return;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain();
  g.gain.value = vol;
  src.connect(g); g.connect(sfxGain);
  src.start(start);
}

const SFX = {
  tap: (t) => tone(NOTE.C5, t, 0.06, { vol: 0.15 }),
  back: (t) => tone(NOTE.G4, t, 0.08, { vol: 0.15, slide: -100 }),
  correct: (t) => { tone(NOTE.C5, t, 0.1); tone(NOTE.E5, t + 0.1, 0.1); tone(NOTE.G5, t + 0.2, 0.18); },
  wrong: (t) => { tone(NOTE.E3, t, 0.15, { type: 'sawtooth', vol: 0.15 }); tone(NOTE.C3, t + 0.15, 0.25, { type: 'sawtooth', vol: 0.15 }); },
  star: (t) => { [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6, NOTE.E6].forEach((f, i) => tone(f, t + i * 0.07, 0.12, { vol: 0.25 })); },
  coin: (t) => { tone(NOTE.B5, t, 0.06, { vol: 0.2 }); tone(NOTE.E6, t + 0.06, 0.2, { vol: 0.2 }); },
  eat: (t) => { for (let i = 0; i < 3; i++) { noise(t + i * 0.22, 0.08, 0.25); tone(NOTE.C3 + i * 20, t + i * 0.22, 0.08, { type: 'triangle', vol: 0.2 }); } },
  pop: (t) => tone(NOTE.A5, t, 0.08, { vol: 0.2, slide: 400 }),
  bubble: (t) => tone(NOTE.E5, t, 0.12, { type: 'sine', vol: 0.2, slide: 300 }),
  hop: (t) => tone(NOTE.G4, t, 0.1, { vol: 0.15, slide: 300 }),
  sleep: (t) => { tone(NOTE.E4, t, 0.25, { type: 'triangle', vol: 0.2 }); tone(NOTE.C4, t + 0.25, 0.4, { type: 'triangle', vol: 0.2 }); },
  wake: (t) => { tone(NOTE.C4, t, 0.12, { type: 'triangle', vol: 0.2 }); tone(NOTE.E4, t + 0.12, 0.12, { type: 'triangle', vol: 0.2 }); tone(NOTE.G4, t + 0.24, 0.2, { type: 'triangle', vol: 0.2 }); },
  sparkle: (t) => { tone(NOTE.C6, t, 0.05, { vol: 0.12 }); tone(NOTE.G6, t + 0.05, 0.08, { vol: 0.12 }); },
  levelup: (t) => {
    const seq = [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6, NOTE.G5, NOTE.C6, NOTE.E6, NOTE.G6];
    seq.forEach((f, i) => tone(f, t + i * 0.09, 0.14, { vol: 0.28 }));
    tone(NOTE.C4, t, 0.8, { type: 'triangle', vol: 0.2 });
  },
  hatch: (t) => { noise(t, 0.15, 0.3); tone(NOTE.C5, t + 0.2, 0.1); tone(NOTE.E5, t + 0.3, 0.1); tone(NOTE.G5, t + 0.4, 0.1); tone(NOTE.C6, t + 0.5, 0.3); },
  fanfare: (t) => { [NOTE.G5, NOTE.G5, NOTE.G5, NOTE.C6].forEach((f, i) => tone(f, t + i * 0.12, i === 3 ? 0.4 : 0.1, { vol: 0.28 })); },
  lose: (t) => { [NOTE.E4, NOTE.D4, NOTE.C4].forEach((f, i) => tone(f, t + i * 0.15, 0.2, { type: 'triangle', vol: 0.2 })); },
  tick: (t) => tone(NOTE.C6, t, 0.03, { vol: 0.08 }),
  buy: (t) => { tone(NOTE.E5, t, 0.08, { vol: 0.2 }); tone(NOTE.G5, t + 0.08, 0.08, { vol: 0.2 }); tone(NOTE.C6, t + 0.16, 0.2, { vol: 0.2 }); },
};

export function sfx(name) {
  if (!ctx || !prefs.sound) return;
  const fn = SFX[name];
  if (fn) fn(ctx.currentTime);
}

// A gentle 8-bar loop. Each entry: [melody note or null, bass note or null].
const TUNE = [
  ['E5', 'C3'], ['G5', null], ['E5', 'G3'], ['C5', null], ['D5', 'A2'], ['E5', null], ['D5', 'E3'], ['B4', null],
  ['C5', 'F3'], ['E5', null], ['G5', 'C3'], ['E5', null], ['A5', 'G3'], ['G5', null], ['E5', 'G3'], [null, null],
  ['E5', 'C3'], ['G5', null], ['A5', 'G3'], ['C6', null], ['B5', 'A2'], ['A5', null], ['G5', 'E3'], ['E5', null],
  ['F5', 'F3'], ['E5', null], ['D5', 'C3'], ['E5', null], ['C5', 'G3'], [null, null], ['C5', 'C3'], [null, null],
];
const STEP = 0.16;

function scheduleMusic() {
  if (!ctx || !prefs.music) return;
  const now = ctx.currentTime;
  // schedule a few steps ahead
  while (scheduleMusic.next < now + 0.5) {
    const [m, b] = TUNE[musicStep % TUNE.length];
    const t = scheduleMusic.next;
    if (m) tone(NOTE[m], t, STEP * 0.9, { type: 'square', vol: 0.12, dest: musicGain });
    if (b) tone(NOTE[b], t, STEP * 1.8, { type: 'triangle', vol: 0.2, dest: musicGain });
    scheduleMusic.next += STEP;
    musicStep += 1;
  }
}

export function startMusic() {
  musicStarted = true;
  if (!ctx || !prefs.music || musicTimer) return;
  scheduleMusic.next = ctx.currentTime + 0.1;
  musicStep = 0;
  scheduleMusic();
  musicTimer = setInterval(scheduleMusic, 200);
}

export function stopMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
}

export function pauseMusic() { stopMusic(); }
export function resumeMusic() { if (musicStarted) startMusic(); }
