// Pixel-art data. Every sprite is a list of equal-length strings; each character
// maps to a colour through the sprite's palette ('.' is transparent).
// Sprites marked `mirror: true` only define the LEFT half and are mirrored.

export const C = {
  k: '#2b2340', // outline
  w: '#fdfdfd',
  e: '#1b1830', // eyes
  p: '#ff9db5', // blush
  y: '#ffd83d', // yellow
  o: '#c8813a', // brown
  r: '#ff5d6c', // red
  g: '#5dd35d', // green
  u: '#4fa3ff', // blue
  v: '#b07cff', // violet
  c2: '#ff8c42',
};

export const SPECIES = {
  mochi: {
    name: 'Mochi', desc: 'a squishy blob who loves hugs',
    pal: { a: '#ffb8cc', b: '#ffe4ee', c: '#ff6f9f', d: '#e88fae' },
    egg: { a: '#ffe4ee', b: '#ff9db5' },
    legend: { a: '#ffd1e8', b: '#fff5fb', c: '#ff8cc4', d: '#ffb0d5' },
  },
  pip: {
    name: 'Pip', desc: 'a cheerful chick who loves to sing',
    pal: { a: '#ffd34d', b: '#fff2b0', c: '#ff8c42', d: '#4fa3ff' },
    egg: { a: '#fff2b0', b: '#ffd34d' },
    legend: { a: '#ffe27a', b: '#fffbe0', c: '#ff9f5a', d: '#7cc4ff' },
  },
  rex: {
    name: 'Rex', desc: 'a friendly dino who loves to explore',
    pal: { a: '#6fd36f', b: '#c8f5b0', c: '#2f8f5b', d: '#4faf4f' },
    egg: { a: '#c8f5b0', b: '#6fd36f' },
    legend: { a: '#8be88b', b: '#e4ffd4', c: '#3aa66b', d: '#6fd36f' },
  },
};

export const STAGE_NAMES = ['Egg', 'Baby', 'Kid', 'Teen', 'Grown-up', 'Legend'];

const EGG = [
  '......kkkk......',
  '.....kaaaak.....',
  '....kaawwaak....',
  '...kaawwaaaak...',
  '...kaaaaaaaak...',
  '..kaabaaabaaak..',
  '..kaaaaaaaaaak..',
  '..kabaaabaaaak..',
  '..kaaaaaaaaaak..',
  '..kaaabaaabaak..',
  '...kaaaaaaaak...',
  '...kaabaaaaak...',
  '....kaaaaaak....',
  '.....kaaaak.....',
  '......kkkk......',
];

const EGG_CRACK = [
  '......kkkk......',
  '.....kaaaak.....',
  '....kaawwaak....',
  '...kaawwaaaak...',
  '...kaaakaaaak...',
  '..kaabakaabaak..',
  '..kaaakkaaaaak..',
  '..kabakaaaaaak..',
  '..kaaaakaaaaak..',
  '..kaaabakaabaak.',
  '...kaaaaakaak...',
  '...kaabaaaaak...',
  '....kaaaaaak....',
  '.....kaaaak.....',
  '......kkkk......',
];

const MOCHI = {
  1: [
    '......kkkk......',
    '.....kaaaak.....',
    '....kaaaaaak....',
    '...kaaaaaaaak...',
    '...kaeaaaaeak...',
    '...kaaaaaaaak...',
    '...kpaaaaaapk...',
    '...kaaaakaaak...',
    '....kaaaaaak....',
    '.....kkkkkk.....',
  ],
  2: [
    '....k......k....',
    '...kck....kck...',
    '...kack..kcak...',
    '...kaakkkkaak...',
    '...kaaaaaaaak...',
    '..kaaaaaaaaaak..',
    '..kaewaaaaewak..',
    '..kaeeaaaaeeak..',
    '..kaaaaaaaaaak..',
    '..kpaaakkaaapk..',
    '..kaaaaaaaaaak..',
    '...kaaaaaaaak...',
    '....kkkkkkkk....',
  ],
  3: [
    '....kk........kk....',
    '...kcck......kcck...',
    '..kaccakkkkkkaccak..',
    '..kaaaaaaaaaaaaaak..',
    '.kaaaaaaaaaaaaaaaak.',
    '.kaaewaaaaaaaaewaak.',
    '.kaaeeaaaaaaaaeeaak.',
    '.kaaaaaaaaaaaaaaaak.',
    '.kpaaaaaaaaaaaaaapk.',
    'kkaaaaaaakkaaaaaaakk',
    'kaakaaaaaaaaaaaakaak',
    '.kkkaaaaaaaaaaaakkk.',
    '...kaaaaaaaaaaaak...',
    '....kaaaaaaaaaak....',
    '.....kkkkkkkkkk.....',
  ],
  4: [
    '...........kk...........',
    '..........kcck..........',
    '.....kk...kcck...kk.....',
    '....kcck..kcck..kcck....',
    '...kcccck.kaak.kcccck...',
    '..kaaaaaakaaaakaaaaaak..',
    '..kaaaaaaaaaaaaaaaaaak..',
    '.kaaaaaaaaaaaaaaaaaaaak.',
    '.kaaaewaaaaaaaaaaewaaak.',
    '.kaaaeeaaaaaaaaaaeeaaak.',
    '.kaaaaaaaaaaaaaaaaaaaak.',
    '.kapaaaaaakaakaaaaaapak.',
    '.kaaaaaaaaaakkaaaaaaaak.',
    'kkaaaaaaaaaaaaaaaaaaaakk',
    'kaakaaabbbbbbbbbbaaakaak',
    'kaakaaabbbbbbbbbbaaakaak',
    '.kkkaaabbbbbbbbbbaaakkk.',
    '...kaaaabbbbbbbbaaaak...',
    '....kaaaaaaaaaaaaaak....',
    '.....kaaaaaaaaaaaak.....',
    '......kkkkkkkkkkkk......',
  ],
};

const PIP = {
  1: [
    '.......kk.......',
    '......kaak......',
    '.....kkaakk.....',
    '....kaaaaaak....',
    '...kaaaaaaaak...',
    '...kaeaaaaeak...',
    '...kaaaccaaak...',
    '...kaaaaaaaak...',
    '...kpaaaaaapk...',
    '....kaaaaaak....',
    '.....kkkkkk.....',
    '.....c....c.....',
    '....ccc..ccc....',
  ],
  2: [
    '.......kk.......',
    '......kaak......',
    '.....kkaakk.....',
    '....kaaaaaak....',
    '...kaaaaaaaak...',
    '..kaaewaaewaak..',
    '..kaaeeaaeeaak..',
    '..kaaaaccaaaak..',
    '..kpaaaccaaapk..',
    '.kakaaaaaaaakak.',
    '.kakaaaaaaaakak.',
    '..kkaaaaaaaakk..',
    '...kaaaaaaaak...',
    '....kkkkkkkk....',
    '.....c....c.....',
    '....ccc..ccc....',
  ],
  3: [
    '.....kk..kk..kk.....',
    '....kaakkaakkaak....',
    '....kaaaaaaaaaak....',
    '...kaaaaaaaaaaaak...',
    '..kaaaaaaaaaaaaaak..',
    '..kaaewaaaaaaewaak..',
    '..kaaeeaaaaaaeeaak..',
    '.kaaaaaaccccaaaaaak.',
    '.kpaaaaaaccaaaaaapk.',
    'kakaaaabbbbbbaaaakak',
    'kakaaabbbbbbbbaaakak',
    'kdkaaabbbbbbbbaaakdk',
    '.kkaaaabbbbbbaaaakk.',
    '..kaaaaabbbbaaaaak..',
    '...kaaaaaaaaaaaak...',
    '....kkkkkkkkkkkk....',
    '......c......c......',
    '.....ccc....ccc.....',
  ],
  4: [
    '......kk...kk...kk......',
    '.....kaak.kaak.kaak.....',
    '.....kaakkkaakkkaak.....',
    '....kaaaaaaaaaaaaaak....',
    '...kaaaaaaaaaaaaaaaak...',
    '..kaaaaaaaaaaaaaaaaaak..',
    '..kaaaewaaaaaaaaewaaak..',
    '..kaaaeeaaaaaaaaeeaaak..',
    '.kaaaaaaaaccccaaaaaaaak.',
    '.kpaaaaaaaaccaaaaaaaapk.',
    'kakaaaaaabbbbbbaaaaaakak',
    'kakaaaaabbbbbbbbaaaaakak',
    'kdkaaaabbbbbbbbbbaaaakdk',
    'kdkaaaabbbbbbbbbbaaaakdk',
    '.kkaaaaabbbbbbbbaaaaakk.',
    '..kaaaaaabbbbbbaaaaaak..',
    '...kaaaaaaaaaaaaaaaak...',
    '....kaaaaaaaaaaaaaak....',
    '.....kkkkkkkkkkkkkk.....',
    '.......c........c.......',
    '......ccc......ccc......',
  ],
};

const REX = {
  1: [
    '.......kk.......',
    '......kcck......',
    '.....kkcckk.....',
    '....kaaaaaak....',
    '...kaaaaaaaak...',
    '...kaeaaaaeak...',
    '...kaaaaaaaak...',
    '...kpaakkaapk...',
    '...kaabbbbaak...',
    '...kaabbbbaakkk.',
    '....kabbbbakaak.',
    '....kkkkkkkkkkk.',
  ],
  2: [
    '....kk..kk..kk..',
    '...kcckkcckkcck.',
    '..kaaaaaaaaaaak.',
    '..kaaaaaaaaaaak.',
    '..kaewaaaaewaak.',
    '..kaeeaaaaeeaak.',
    '..kaaaaaaaaaaak.',
    '..kpaaakkaaapak.',
    '.kkaabbbbbbaakk.',
    'kaakabbbbbbakaak',
    '.kkkabbbbbbakkk.',
    '...kabbbbbbakkkk',
    '...kaabbbbaakaak',
    '....kkkkkkkkkkkk',
  ],
  3: [
    '.....kk..kk..kk.....',
    '....kcckkcckkcck....',
    '...kaaaaaaaaaaaak...',
    '..kaaaaaaaaaaaaaak..',
    '..kaaewaaaaaaewaak..',
    '..kaaeeaaaaaaeeaak..',
    '..kaaaaaaaaaaaaaak..',
    '..kpaaaakkkkaaaapk..',
    '..kaaaabbbbbbaaaak..',
    '.kkaaabbbbbbbbaaakk.',
    'kaakaabbbbbbbbaakaak',
    'kaakaabbbbbbbbaakaak',
    '.kkkaabbbbbbbbaakkk.',
    '...kaaabbbbbbaaak...',
    '...kaaabbbbbbaaakkkk',
    '...kaaaabbbbaaaakaak',
    '....kaaaaaaaaaakaaak',
    '.....kkkkkkkkkkkkkkk',
  ],
  4: [
    '......kk..kk..kk........',
    '.....kcckkcckkcck.......',
    '....kaaaaaaaaaaaak......',
    '...kaaaaaaaaaaaaaak.....',
    '..kaaaaaaaaaaaaaaaak....',
    '..kaaaewaaaaaaaewaaak...',
    '..kaaaeeaaaaaaaeeaaak...',
    '..kaaaaaaaaaaaaaaaaak...',
    '..kpaaaaakkkkkaaaaapk...',
    '..kaaaaaaaaaaaaaaaaak...',
    '..kaaaabbbbbbbbbaaaak...',
    '.kkaaaabbbbbbbbbaaaakk..',
    'kaakaaabbbbbbbbbaaakaak.',
    'kaakaaabbbbbbbbbaaakaak.',
    '.kkkaaabbbbbbbbbaaakkk..',
    '...kaaaabbbbbbbaaaak....',
    '...kaaaabbbbbbbaaaakkkk.',
    '...kaaaaabbbbbaaaaakaaak',
    '....kaaaaaaaaaaaaakaaaak',
    '.....kaaaaaaaaaaakaaaaak',
    '.....kkkkkkkkkkkkkkkkkkk',
  ],
};

const PET_ART = { mochi: MOCHI, pip: PIP, rex: REX };

/** Sprite rows for a pet at a given stage (1..5; 5 reuses stage 4 art). */
export function petRows(species, stage) {
  const art = PET_ART[species];
  return art[Math.min(stage, 4)] ?? art[1];
}

export function petPalette(species, stage) {
  const s = SPECIES[species];
  const base = stage >= 5 ? s.legend : s.pal;
  return { ...C, ...base };
}

export const EGG_ART = { plain: EGG, crack: EGG_CRACK };

// ---- Hats (anchored to the top-centre of the pet) ----
export const HATS = {
  crown: { name: 'Crown', price: 60, dy: -3, pal: { ...C, r: C.r, y: C.y }, rows: [
    '.k..kk..k.',
    '.kykyykyk.',
    '.kyyyyyyk.',
    '.kyyrryyk.',
    '.kkkkkkkk.',
  ] },
  bow: { name: 'Bow', price: 40, dy: -2, pal: { ...C, r: '#ff6f9f' }, rows: [
    '.kk....kk.',
    'krrk..krrk',
    '.krrkkrrk.',
    '..kkrrkk..',
    '...kkkk...',
  ] },
  party: { name: 'Party Hat', price: 50, dy: -5, pal: { ...C, u: C.u, y: C.y }, rows: [
    '....kk....',
    '...kyyk...',
    '...kyyk...',
    '..kuuuuk..',
    '..kuuuuk..',
    '.kyyyyyyk.',
    '.kkkkkkkk.',
  ] },
  flower: { name: 'Flower', price: 35, dy: -3, pal: { ...C, r: '#ff5d6c', y: C.y }, rows: [
    '...krrk...',
    '..krrrrk..',
    '.krryyrrk.',
    '.krryyrrk.',
    '..krrrrk..',
    '...krrk...',
  ] },
  halo: { name: 'Halo', price: 80, dy: -6, pal: { ...C, y: C.y }, rows: [
    '.kkkkkkkk.',
    'kyyyyyyyyk',
    '.kkkkkkkk.',
  ] },
  wizard: { name: 'Wizard Hat', price: 90, dy: -5, pal: { ...C, u: '#6d5bff', y: C.y }, rows: [
    '....kk....',
    '...kuuk...',
    '...kuuk...',
    '..kuuuuk..',
    '..kuyuuk..',
    '.kuuuuuuk.',
    'kkkkkkkkkk',
  ] },
  headphones: { name: 'Headphones', price: 70, dy: -1, pal: { ...C, r: '#ff5d6c' }, rows: [
    '..kkkkkk..',
    '.k......k.',
    'kk......kk',
    'krk....krk',
    'krk....krk',
    'kkk....kkk',
  ] },
  cap: { name: 'Cap', price: 45, dy: -2, pal: { ...C, u: C.u, w: C.w }, rows: [
    '...kkkk...',
    '..kuuuuk..',
    '.kuuwuuuk.',
    'kkkkkkkkkk',
    '.......kkk',
  ] },
};

// ---- Items / icons (8x8) ----
export const ICONS = {
  apple: { pal: { ...C, r: '#ff5d6c', g: C.g }, rows: [
    '....k...', '...kgk..', '.kkrrkk.', 'krrrrrrk', 'krwrrrrk', 'krrrrrrk', '.krrrrk.', '..kkkk..',
  ] },
  cookie: { pal: { ...C, o: '#d9a066' }, rows: [
    '..kkkk..', '.kookok.', 'kooooook', 'kokooook', 'kooookok', 'kooooook', '.kookok.', '..kkkk..',
  ] },
  carrot: { pal: { ...C, c: '#ff8c42', g: C.g }, rows: [
    '.....kgk', '....kggk', '...kcck.', '..kcck..', '..kcck..', '.kcck...', 'kcck....', 'kkk.....',
  ] },
  ball: { pal: { ...C, r: '#ff5d6c', w: C.w }, rows: [
    '..kkkk..', '.krrwwk.', 'krrrwwwk', 'krrrwwwk', 'kwwwrrrk', 'kwwwrrrk', '.kwwrrk.', '..kkkk..',
  ] },
  flask: { pal: { ...C, u: '#4fa3ff', w: '#e8f4ff' }, rows: [
    '..kkkk..', '..kwwk..', '..kwwk..', '.kwwwwk.', '.kwuuwk.', 'kuuuuuuk', 'kuuuuuuk', '.kkkkkk.',
  ] },
  sponge: { pal: { ...C, y: C.y, w: C.w, u: '#9ad6ff' }, rows: [
    '......kk', '.....kuk', 'kkkkkkkk', 'kyyyyyyk', 'kywyyyyk', 'kyyyyyyk', 'kkkkkkkk', '........',
  ] },
  moon: { pal: { ...C, y: C.y }, rows: [
    '..kkkk..', '.kyyykk.', 'kyyyk...', 'kyyk....', 'kyyk....', 'kyyyk...', '.kyyykk.', '..kkkk..',
  ] },
  sun: { pal: { ...C, y: C.y }, rows: [
    'k..kk..k', '.kkyykk.', '.kyyyyk.', 'kyyyyyyk', 'kyyyyyyk', '.kyyyyk.', '.kkyykk.', 'k..kk..k',
  ] },
  gamepad: { pal: { ...C, u: '#6d5bff', r: C.r }, rows: [
    '........', '.kkkkkk.', 'kuukuurk', 'kukkkruk', 'kuukuuuk', '.kkkkkk.', '........', '........',
  ] },
  coin: { pal: { ...C, y: C.y, o: '#e0a020', w: '#fff7c0' }, rows: [
    '..kkkk..', '.kyyyyk.', 'kywyyyyk', 'kyyyyyyk', 'kyyyyoyk', 'kyyyoook', '.kyoook.', '..kkkk..',
  ] },
  book: { pal: { ...C, r: '#ff5d6c', w: C.w }, rows: [
    'kkkkkkk.', 'krrrrrk.', 'krwwwrkk', 'krwwwrwk', 'krwwwrwk', 'krrrrrwk', 'kkkkkkwk', '.kkkkkk.',
  ] },
  lock: { pal: { ...C, y: C.y }, rows: [
    '..kkkk..', '.kk..kk.', '.k....k.', 'kkkkkkkk', 'kyyyyyyk', 'kyykkyyk', 'kyyykyyk', 'kkkkkkkk',
  ] },
  star: { pal: { ...C, y: C.y }, rows: [
    '...kk...', '..kyyk..', 'kkkyyykk', 'kyyyyyyk', '.kyyyyk.', '.kyyyyk.', '.kykkyk.', 'kkk..kkk',
  ] },
  heart: { pal: { ...C, r: '#ff5d6c', w: C.w }, rows: [
    '.kk..kk.', 'krrkkrrk', 'krwrrrrk', 'krrrrrrk', '.krrrrk.', '..krrk..', '...kk...', '........',
  ] },
  dirt: { pal: { ...C, o: '#a8713a' }, rows: [
    '........', '........', '...kk...', '..kook..', '.kooook.', 'kooooook', 'kkkkkkkk', '........',
  ] },
  bag: { pal: { ...C, o: '#d9a066', r: C.r }, rows: [
    '..kkkk..', '.k....k.', 'kkkkkkkk', 'kooooook', 'koorrook', 'koorrook', 'kooooook', 'kkkkkkkk',
  ] },
  hatIcon: { pal: { ...C, u: C.u, y: C.y }, rows: [
    '....kk..', '...kyyk.', '...kyyk.', '..kuuuuk', '..kuuuuk', '.kyyyyyk', '.kkkkkkk', '........',
  ] },
  bubble: { pal: { ...C, u: '#9ad6ff', w: C.w }, rows: [
    '..kkkk..', '.kwuuuk.', 'kwuuuuuk', 'kuuuuuuk', 'kuuuuuuk', 'kuuuuuuk', '.kuuuuk.', '..kkkk..',
  ] },
  rock: { pal: { ...C, o: '#8a8a9a', w: '#b8b8c8' }, rows: [
    '........', '...kkk..', '..kwwok.', '.kwoooo.', 'koooooook', 'kooooook', '.kkkkkk.', '........',
  ].map((r) => r.slice(0, 8)) },
  check: { pal: { ...C, g: C.g }, rows: [
    '.......k', '......kg', '.....kg.', 'k...kg..', 'kg.kg...', '.kgkg...', '..kg....', '...k....',
  ] },
  pencil: { pal: { ...C, y: C.y, r: C.r, o: '#d9a066' }, rows: [
    '.....kkk', '....kryk', '...kyyyk', '..kyyyk.', '.kyyyk..', 'koyyk...', 'kook....', 'kk......',
  ] },
  zed: { pal: { ...C }, rows: ['kkk', '..k', '.k.', 'k..', 'kkk'] },
  exclaim: { pal: { ...C, r: C.r }, rows: ['kk', 'rr', 'rr', 'rr', 'kk', '..', 'rr'] },
  plus: { pal: { ...C, g: C.g }, rows: ['..gg..', '..gg..', 'gggggg', 'gggggg', '..gg..', '..gg..'] },
  arrow: { pal: { ...C, w: C.w }, rows: ['...k....', '..kk....', '.kwk....', 'kwwkkkkk', 'kwwwwwwk', '.kwkkkkk', '..kk....', '...k....'] },
  music: { pal: { ...C, v: C.v }, rows: ['...kkkk.', '...kvvvk', '...kv...', '...kv...', '...kv...', '.kkkv...', 'kvvvk...', '.kkk....'] },
  sound: { pal: { ...C, w: C.w, u: C.u }, rows: ['....k...', '...kwk.u', 'kkkkwk.u', 'kwwwwku.', 'kwwwwku.', 'kkkkwk.u', '...kwk.u', '....k...'] },
  trophy: { pal: { ...C, y: C.y, o: '#e0a020' }, rows: ['kkkkkkkk', 'kyyyyyyk', 'kkyyyykk', '.kyyyyk.', '..kyyk..', '...kk...', '..kook..', '.kkkkkk.'] },
  egg: { pal: { ...C, w: '#fff5fb', p: '#ff9db5' }, rows: ['..kkkk..', '.kwwwwk.', 'kwwpwwwk', 'kwwwwpwk', 'kwpwwwwk', 'kwwwwwwk', '.kwwwwk.', '..kkkk..'] },
};

// ---- Rendering helpers ----
const cache = new Map();

/** Render rows+palette into an offscreen canvas (cached). */
export function spriteCanvas(rows, pal, key) {
  const k = key ?? rows.join('|') + JSON.stringify(pal);
  if (cache.has(k)) return cache.get(k);
  const h = rows.length;
  const w = rows[0].length;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      ctx.fillStyle = pal[ch] ?? '#ff00ff';
      ctx.fillRect(x, y, 1, 1);
    }
  }
  cache.set(k, cv);
  return cv;
}

/** A version of the sprite with every opaque pixel painted `color` (silhouette). */
export function silhouette(rows, color) {
  const pal = {};
  for (const r of rows) for (const ch of r) if (ch !== '.') pal[ch] = color;
  return spriteCanvas(rows, pal, 'sil:' + color + ':' + rows.join('|'));
}

export function iconCanvas(name) {
  const ic = ICONS[name];
  if (!ic) throw new Error('unknown icon ' + name);
  return spriteCanvas(ic.rows, ic.pal, 'icon:' + name);
}

/**
 * Create a DOM <canvas> showing an icon. `scale` is CSS pixels per art pixel;
 * the backing store is rendered at 2x so it stays crisp on high-DPI screens.
 */
export function iconEl(name, scale = 3) {
  const src = iconCanvas(name);
  const cv = document.createElement('canvas');
  cv.className = 'px-icon';
  cv.width = src.width * scale * 2; cv.height = src.height * scale * 2;
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0, cv.width, cv.height);
  cv.style.width = src.width * scale + 'px';
  cv.style.height = src.height * scale + 'px';
  return cv;
}

/** DOM canvas showing a pet (used on profile cards, shop previews, album). */
export function petEl(species, stage, scale = 3, hat = null) {
  const rows = stage === 0 ? EGG : petRows(species, stage);
  const pal = stage === 0 ? { ...C, ...SPECIES[species].egg } : petPalette(species, stage);
  const src = spriteCanvas(rows, pal);
  const pad = 8;
  const s = scale * 2; // backing store at 2x for crisp high-DPI rendering
  const cv = document.createElement('canvas');
  cv.className = 'px-icon';
  cv.width = (src.width + pad * 2) * s; cv.height = (src.height + pad) * s;
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, pad * s, pad * s, src.width * s, src.height * s);
  if (hat && HATS[hat] && stage > 0) {
    const h = HATS[hat];
    const hc = spriteCanvas(h.rows, h.pal, 'hat:' + hat);
    const hx = pad + Math.floor((src.width - hc.width) / 2);
    const hy = pad + h.dy;
    ctx.drawImage(hc, hx * s, hy * s, hc.width * s, hc.height * s);
  }
  cv.style.width = cv.width / 2 + 'px';
  cv.style.height = cv.height / 2 + 'px';
  return cv;
}

/**
 * Render an emoji as chunky pixel art: draw it tiny, then scale it up with
 * smoothing disabled. This gives the big picture vocabulary a retro look
 * without hand-drawing hundreds of sprites.
 */
export function pixelEmoji(emoji, size = 14, scale = 5) {
  const k = 'emoji:' + emoji + ':' + size + ':' + scale;
  if (cache.has(k)) return cloneCanvas(cache.get(k));
  const tiny = document.createElement('canvas');
  tiny.width = size; tiny.height = size;
  const tctx = tiny.getContext('2d');
  tctx.font = `${Math.floor(size * 0.85)}px "Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif`;
  tctx.textAlign = 'center'; tctx.textBaseline = 'middle';
  tctx.fillText(emoji, size / 2, size / 2 + 1);
  const cv = document.createElement('canvas');
  cv.className = 'px-icon';
  cv.width = size * scale; cv.height = size * scale;
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tiny, 0, 0, cv.width, cv.height);
  cache.set(k, cv);
  return cloneCanvas(cv);
}

function cloneCanvas(src) {
  const cv = document.createElement('canvas');
  cv.className = src.className;
  cv.width = src.width; cv.height = src.height;
  cv.getContext('2d').drawImage(src, 0, 0);
  return cv;
}
