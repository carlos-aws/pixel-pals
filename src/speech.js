// Text-to-speech through the browser's speech synthesis (works offline on
// Android once a voice is installed). Everything is optional: if speech is
// unavailable the game simply stays silent.

let enabled = true;
let voice = null;

export function setSpeechEnabled(v) { enabled = v; if (!v) cancelSpeech(); }
export const speechAvailable = () => typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';

function pickVoice() {
  if (!speechAvailable()) return null;
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;
  const en = voices.filter((v) => /^en/i.test(v.lang));
  const prefer = en.find((v) => /female|woman|girl|samantha|karen|moira|google uk english female|zira/i.test(v.name))
    || en.find((v) => /google/i.test(v.name))
    || en.find((v) => v.default)
    || en[0];
  return prefer || voices[0];
}

if (speechAvailable()) {
  speechSynthesis.addEventListener?.('voiceschanged', () => { voice = pickVoice(); });
}

export function speak(text, { rate = 0.9, pitch = 1.1, interrupt = true } = {}) {
  if (!enabled || !speechAvailable() || !text) return;
  try {
    if (interrupt) speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (!voice) voice = pickVoice();
    if (voice) u.voice = voice;
    u.lang = voice?.lang || 'en-US';
    u.rate = rate;
    u.pitch = pitch;
    speechSynthesis.speak(u);
  } catch { /* ignore */ }
}

export function cancelSpeech() {
  if (speechAvailable()) { try { speechSynthesis.cancel(); } catch { /* ignore */ } }
}
