// DOM helpers: toasts, modals, icon buttons.

import { el } from './util.js';
import { iconEl } from './sprites.js';
import { sfx } from './audio.js';

export function toast(text, iconName = null, ms = 2200) {
  const box = document.getElementById('toasts');
  const t = el('div', { class: 'toast px' }, iconName ? iconEl(iconName, 3) : null, text);
  box.append(t);
  setTimeout(() => t.remove(), ms);
}

export function button(label, { icon = null, cls = '', onClick = null, sub = null, sound = 'tap', attrs = {} } = {}) {
  const b = el('button', { class: `btn ${cls}`, type: 'button', ...attrs });
  if (icon) b.append(iconEl(icon, 4));
  if (label !== null && label !== undefined) {
    const span = el('span', {}, label);
    if (sub) span.append(el('span', { class: 'sub' }, sub));
    b.append(span);
  }
  if (onClick) b.addEventListener('click', (e) => { if (sound) sfx(sound); onClick(e); });
  return b;
}

/** A modal dialog. `actions` = [{label, cls, value}]. Resolves with value. */
export function modal({ title, body, actions = [{ label: 'OK', cls: 'green', value: true }], dismissable = true }) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('overlay');
    const bg = el('div', { class: 'modal-bg' });
    const box = el('div', { class: 'modal' });
    if (title) box.append(el('h2', {}, title));
    if (body) box.append(typeof body === 'string' ? el('div', { style: { fontSize: '20px' } }, body) : body);
    const row = el('div', { class: 'col' });
    for (const a of actions) {
      row.append(button(a.label, { cls: a.cls || '', icon: a.icon, onClick: () => { bg.remove(); resolve(a.value); } }));
    }
    box.append(row);
    bg.append(box);
    if (dismissable) bg.addEventListener('click', (e) => { if (e.target === bg) { bg.remove(); resolve(null); } });
    overlay.append(bg);
  });
}

export function progressBar(frac, cls = '') {
  const p = el('div', { class: 'progress' });
  p.append(el('div', { class: `fill ${cls}`, style: { width: Math.round(frac * 100) + '%' } }));
  return p;
}

export function switchEl(on, onChange) {
  const s = el('div', { class: `switch ${on ? 'on' : ''}`, role: 'switch', 'aria-checked': String(on) });
  s.addEventListener('click', () => { on = !on; s.classList.toggle('on', on); s.setAttribute('aria-checked', String(on)); sfx('tap'); onChange(on); });
  return s;
}

export function stepper(value, min, max, onChange, fmt = (v) => String(v)) {
  const val = el('span', { class: 'val' }, fmt(value));
  const wrap = el('div', { class: 'stepper' });
  const dec = button('-', { cls: 'small icon-only', onClick: () => { value = Math.max(min, value - 1); val.textContent = fmt(value); onChange(value); } });
  const inc = button('+', { cls: 'small icon-only', onClick: () => { value = Math.min(max, value + 1); val.textContent = fmt(value); onChange(value); } });
  wrap.append(dec, val, inc);
  return wrap;
}

export function vibrate(ms) { try { navigator.vibrate?.(ms); } catch { /* ignore */ } }
