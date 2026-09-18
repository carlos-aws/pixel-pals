// Cloud mode only: sign in with Google before choosing a player.

import { el } from '../util.js';
import { iconEl } from '../sprites.js';
import { button } from '../ui.js';

export function renderSignIn(app, { error = null, offline = false } = {}) {
  const root = el('div', { class: 'col pad', style: { height: '100%', gap: '14px', justifyContent: 'center' } });
  root.append(
    el('div', { class: 'center col', style: { gap: '6px' } },
      el('div', { class: 'title big light floaty' }, 'PIXEL PALS'),
      el('div', { class: 'light muted' }, 'Learn. Play. Grow together.'),
    ),
  );
  if (offline) {
    root.append(
      el('div', { class: 'panel px col center' }, iconEl('bubble', 6), el('h3', {}, 'Can\'t reach the cloud'), el('div', { class: 'muted' }, 'Check the internet connection and try again.')),
      button('Try again', { icon: 'arrow', cls: 'yellow big', onClick: () => location.reload() }),
      button('Sign out', { cls: 'ghost small', onClick: () => app.store.signOut() }),
    );
    return root;
  }
  root.append(
    el('div', { class: 'panel px col center' },
      iconEl('lock', 6),
      el('h3', {}, 'Grown-ups: sign in'),
      el('div', { class: 'muted' }, 'Progress is saved online, so the pets can be played on any phone or tablet (one device at a time per player).'),
    ),
  );
  if (error) root.append(el('div', { class: 'panel px', style: { background: 'var(--red)', color: '#fff' } }, String(error)));
  root.append(
    button('Sign in with Google', { icon: 'star', cls: 'blue big', onClick: () => app.store.signIn() }),
    el('div', { class: 'light muted center', style: { fontSize: '13px' } }, 'Only the Google accounts allowed by the family can sign in.'),
  );
  return root;
}
