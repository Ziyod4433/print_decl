// O‘yin taxtasi: ichki halqa — kalamush poygasi, tashqi halqa — tezkor yo‘l.
// Katak, fishka va zarlar foizlarda joylashadi, shuning uchun taxta har qanday ekranga moslashadi.

import { RAT_BOARD, FAST_BOARD, SQUARES, DREAMS, DECKS, money, shortMoney } from './shared/rules.js';
import { h } from './dom.js';
import { reducedMotion } from './fx.js';

const RING = {
  rat: { r: 30, n: RAT_BOARD.length },
  fast: { r: 44, n: FAST_BOARD.length },
};
const HOP_MS = 210;

export function pointOf(track, i) {
  const { r, n } = RING[track];
  const a = ((-90 + (360 / n) * i) * Math.PI) / 180;
  return { x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a) };
}

const PIPS = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
// Kubning qaysi tomoni old tomonga qarashi uchun aylanish
const FACE_ROT = { 1: [0, 0], 2: [0, -90], 3: [-90, 0], 4: [90, 0], 5: [0, 90], 6: [0, 180] };

function dieEl() {
  const cube = h('div', { class: 'die-cube' });
  for (let v = 1; v <= 6; v++) {
    const face = h('div', { class: `die-face f${v}` });
    for (let cell = 1; cell <= 9; cell++) face.append(h('i', { class: PIPS[v].includes(cell) ? 'pip' : '' }));
    cube.append(face);
  }
  const die = h('div', { class: 'die' }, cube);
  die._spin = 0;
  return die;
}

function trackLabels() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('class', 'track-labels');
  svg.setAttribute('aria-hidden', 'true');
  const ring = (id, r) => {
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('id', id);
    path.setAttribute('d', `M50 ${50 + r} A${r} ${r} 0 1 1 50.01 ${50 + r}`);
    path.setAttribute('fill', 'none');
    return path;
  };
  const uid = Math.random().toString(36).slice(2, 7);
  svg.append(ring(`lf-${uid}`, 37.2), ring(`lr-${uid}`, 22.6));
  const label = (ref, text, cls) => {
    const t = document.createElementNS(ns, 'text');
    t.setAttribute('class', cls);
    const tp = document.createElementNS(ns, 'textPath');
    tp.setAttribute('href', `#${ref}`);
    tp.setAttribute('startOffset', '50%');
    tp.setAttribute('text-anchor', 'middle');
    tp.textContent = text;
    t.append(tp);
    return t;
  };
  svg.append(
    label(`lf-${uid}`, 'TEZKOR YO‘L  ✦  TEZKOR YO‘L  ✦  TEZKOR YO‘L', 'tl tl-fast'),
    label(`lr-${uid}`, 'KALAMUSH POYGASI  ·  KALAMUSH POYGASI', 'tl tl-rat'),
  );
  return svg;
}

export function createBoard(root, { piles = true } = {}) {
  root.classList.add('board');
  root.replaceChildren();
  root.append(h('div', { class: 'ring ring-fast' }), h('div', { class: 'ring ring-rat' }), trackLabels());

  const tiles = { rat: [], fast: [] };
  RAT_BOARD.forEach((type, i) => {
    const sq = SQUARES[type];
    const p = pointOf('rat', i);
    const el = h(
      'div',
      { class: `tile tile-rat t-${type}`, style: { left: `${p.x}%`, top: `${p.y}%`, '--c': sq.color, '--i': i }, title: `${sq.label}: ${sq.hint}` },
      h('span', { class: 'tile-ico' }, sq.icon),
    );
    tiles.rat.push(el);
    root.append(el);
  });
  FAST_BOARD.forEach((sq, i) => {
    const meta = SQUARES[sq.type];
    const p = pointOf('fast', i);
    let icon = meta.icon;
    let title = `${meta.label}: ${meta.hint}`;
    let tag = null;
    if (sq.type === 'business') {
      icon = sq.icon;
      title = `${sq.title} — narxi ${money(sq.cost)}, oylik daromad +${money(sq.cashflow)}`;
      tag = shortMoney(sq.cost);
    } else if (sq.type === 'dream') {
      const d = DREAMS.find((x) => x.id === sq.dream);
      icon = d.icon;
      title = `Orzu: ${d.title} — ${money(d.cost)}`;
    } else if (sq.type === 'gamble') {
      icon = sq.icon;
      title = `${sq.title}: ${money(sq.stake)} tiking, zar ${sq.need === 6 ? '6' : `${sq.need} yoki undan ko‘p`} tushsa — ${money(sq.payout)}`;
    }
    const el = h(
      'div',
      { class: `tile tile-fast t-${sq.type}`, style: { left: `${p.x}%`, top: `${p.y}%`, '--c': meta.color, '--i': i }, title },
      h('span', { class: 'tile-ico' }, icon),
      tag ? h('span', { class: 'tile-tag' }, tag) : null,
      sq.type === 'dream' ? h('span', { class: 'dream-marks' }) : null,
    );
    tiles.fast.push(el);
    root.append(el);
  });

  const tray = h('div', { class: 'dice-tray' });
  const pileEls = {};
  const pilesBox = h(
    'div',
    { class: 'piles' },
    ...['small', 'big', 'market', 'doodad'].map((k) => {
      const d = DECKS[k];
      const el = h(
        'div',
        { class: 'pile', 'data-deck': k, style: { '--c': d.color }, title: d.label },
        h('span', { class: 'pile-card' }),
        h('span', { class: 'pile-card' }),
        h('span', { class: 'pile-top' }, h('span', { class: 'pile-ico' }, d.icon), h('span', { class: 'pile-label' }, d.label.split(' ')[0])),
        h('b', { class: 'pile-count' }),
      );
      pileEls[k] = el;
      return el;
    }),
  );
  const status = h('div', { class: 'center-status' });
  root.append(
    h(
      'div',
      { class: 'board-center' },
      h('div', { class: 'center-logo' }, 'Pul ', h('b', {}, 'Oqimi')),
      tray,
      status,
      piles ? pilesBox : null,
    ),
  );
  const tokenLayer = h('div', { class: 'tokens' });
  root.append(tokenLayer);
  const tokens = new Map();
  const hopping = new Set();

  function tokenFor(p) {
    let el = tokens.get(p.id);
    if (!el) {
      el = h('div', { class: 'token', title: p.name }, h('span', { class: 'token-face' }, p.avatar));
      tokenLayer.append(el);
      tokens.set(p.id, el);
    }
    el.style.setProperty('--pc', p.color);
    el.title = p.name;
    el.classList.toggle('offline', p.connected === false);
    return el;
  }

  function setAt(el, track, pos, offset = { x: 0, y: 0 }) {
    const pt = pointOf(track, pos);
    el.style.left = `${pt.x + offset.x}%`;
    el.style.top = `${pt.y + offset.y}%`;
    el.dataset.track = track;
  }

  const api = {
    // Barcha fishkalarni o‘z joyiga qo‘yish (bir katakda bir nechta bo‘lsa — yonma-yon)
    place(players, activeId = null) {
      const groups = new Map();
      for (const p of players) {
        const key = `${p.track}:${p.pos}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(p);
      }
      for (const list of groups.values()) {
        list.forEach((p, k) => {
          const el = tokenFor(p);
          el.classList.toggle('active', p.id === activeId);
          if (hopping.has(p.id)) return;
          const m = list.length;
          const off = m > 1 ? { x: Math.cos((2 * Math.PI * k) / m - Math.PI / 2) * 2.4, y: Math.sin((2 * Math.PI * k) / m - Math.PI / 2) * 2.4 } : { x: 0, y: 0 };
          setAt(el, p.track, p.pos, off);
        });
      }
      for (const [id, el] of tokens) {
        if (!players.some((p) => p.id === id)) {
          el.remove();
          tokens.delete(id);
        }
      }
    },

    async hop(p, track, from, steps) {
      const el = tokenFor(p);
      const n = RING[track].n;
      hopping.add(p.id);
      el.classList.add('moving');
      if (reducedMotion()) {
        setAt(el, track, (from + steps) % n);
      } else {
        for (let i = 1; i <= steps; i++) {
          setAt(el, track, (from + i) % n);
          el.classList.remove('hop');
          void el.offsetWidth;
          el.classList.add('hop');
          api.onStep?.((from + i) % n, track, i === steps);
          await new Promise((r) => setTimeout(r, HOP_MS));
        }
      }
      el.classList.remove('moving', 'hop');
      hopping.delete(p.id);
      api.flash(track, (from + steps) % n);
    },

    flash(track, pos) {
      const el = tiles[track][pos];
      if (!el) return;
      el.classList.remove('landed');
      void el.offsetWidth;
      el.classList.add('landed');
    },

    async roll(values) {
      while (tray.childElementCount < values.length) tray.append(dieEl());
      while (tray.childElementCount > values.length) tray.lastElementChild.remove();
      [...tray.children].forEach((die, i) => {
        const [rx, ry] = FACE_ROT[values[i]];
        die._spin += 2 + i;
        const cube = die.firstElementChild;
        cube.style.transform = `rotateX(${rx + 360 * die._spin}deg) rotateY(${ry + 360 * (die._spin - 1)}deg)`;
        die.classList.remove('rolling');
        void die.offsetWidth;
        die.classList.add('rolling');
      });
      await new Promise((r) => setTimeout(r, reducedMotion() ? 50 : 1000));
    },

    showDice(values) {
      if (!values?.length) return;
      while (tray.childElementCount < values.length) tray.append(dieEl());
      while (tray.childElementCount > values.length) tray.lastElementChild.remove();
      [...tray.children].forEach((die, i) => {
        const [rx, ry] = FACE_ROT[values[i]];
        die.firstElementChild.style.transform = `rotateX(${rx + 360 * die._spin}deg) rotateY(${ry + 360 * Math.max(0, die._spin - 1)}deg)`;
      });
    },

    setPiles(counts) {
      for (const [k, el] of Object.entries(pileEls)) el.querySelector('.pile-count').textContent = counts?.[k] ?? '';
    },

    drawFrom(deck) {
      const el = pileEls[deck];
      if (!el) return;
      el.classList.remove('draw');
      void el.offsetWidth;
      el.classList.add('draw');
    },

    setStatus(content) {
      status.replaceChildren(...[content].flat().filter(Boolean));
    },

    // Kimning orzusi qaysi katakda — kichik avatarlar bilan belgilaymiz
    markDreams(players) {
      FAST_BOARD.forEach((sq, i) => {
        if (sq.type !== 'dream') return;
        const box = tiles.fast[i].querySelector('.dream-marks');
        const owners = players.filter((p) => p.dream === sq.dream);
        box.replaceChildren(...owners.map((p) => h('span', { class: 'dream-mark', style: { '--pc': p.color }, title: `${p.name}ning orzusi` }, p.avatar)));
        tiles.fast[i].classList.toggle('owned', owners.length > 0);
      });
    },

    tileElement(track, pos) {
      return tiles[track][pos];
    },
    tokenElement(id) {
      return tokens.get(id);
    },
    onStep: null,
  };
  return api;
}
