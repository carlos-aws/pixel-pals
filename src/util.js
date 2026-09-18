// Small shared helpers. No dependencies.

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const chance = (p) => Math.random() < p;

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pick `n` distinct items from `arr` (excluding anything in `exclude`). */
export function sample(arr, n, exclude = []) {
  const pool = shuffle(arr.filter((x) => !exclude.includes(x)));
  return pool.slice(0, n);
}

/** Build a multiple-choice option list: the answer plus `n-1` distractors. */
export function makeOptions(answer, distractors, n = 3) {
  const opts = [answer, ...sample(distractors.filter((d) => d !== answer), n - 1)];
  return shuffle(opts);
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

/** Local calendar day key, e.g. "2026-09-18". */
export function dayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function daysBetween(a, b) {
  const da = new Date(a), db = new Date(b);
  da.setHours(0, 0, 0, 0); db.setHours(0, 0, 0, 0);
  return Math.round((db - da) / 86400000);
}

export const HOUR = 3600 * 1000;

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (v !== null && v !== undefined && v !== false) node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function numberWord(n) {
  const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
  return words[n] ?? String(n);
}
