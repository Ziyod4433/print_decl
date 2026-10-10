import { $, $$, h, avatarEl, syncList } from './dom.js';
import { createNet } from './net.js';
import { sfx, isMuted, setMuted, unlockAudio } from './sound.js';
import { floatEmoji, createConfetti } from './fx.js';
import { createBoard } from './board.js';
import { createGameUI } from './game-ui.js';
import { DREAMS, PROFESSIONS, MAX_PLAYERS, RAT_BOARD, passiveIncome, totalExpenses, money, signed } from './shared/rules.js';

// ——— Sozlamalar (server bilan bir xil) ———
const AVATARS = ['🦊', '🐯', '🦁', '🐼', '🐸', '🦉', '🐺', '🐻', '🦄', '🐲', '🦅', '🐱', '🍉', '🍇', '🥟', '🫖'];
const REACTIONS = ['👍', '😂', '😮', '🔥', '👏', '😭', '🤑', '🫡'];
const MODES = [
  ['full', 'To‘liq o‘yin', 'G‘alaba: tezkor yo‘lda orzuingizni sotib olish yoki oylik daromadni +$50 000 ga oshirish.'],
  ['quick', 'Qisqa o‘yin', 'G‘alaba: kalamush poygasidan birinchi bo‘lib chiqish — passiv daromad xarajatlardan oshishi kerak.'],
];
const TURN_OPTIONS = [
  [0, 'Cheklanmagan'],
  [60, '60 s'],
  [120, '2 daq'],
];
const TIPS = [
  'Passiv daromad — siz ishlamasangiz ham keladigan pul: ijara, biznes, foizlar.',
  'Aksiyani arzon oling, qimmat soting: savdo oralig‘iga qarang.',
  'Manfiy pul oqimli mulk — bu aktiv emas, majburiyat!',
  'Kichik qarzlarni yopsangiz, oylik xarajatlar darhol kamayadi.',
  'Bozor kartasi chiqqanda mos aktivi bor har bir o‘yinchi sotishi mumkin.',
  '«Yillik daromadlilik» — boshlang‘ich to‘lovingiz yiliga necha foiz qaytishi.',
];
const CODE_RE = /^[A-Z]{4}$/;

// ——— Saqlash ———
const storage = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
};
const session = {
  get() {
    try {
      return JSON.parse(sessionStorage.getItem('po.session'));
    } catch {
      return null;
    }
  },
  set(value) {
    try {
      sessionStorage.setItem('po.session', JSON.stringify(value));
    } catch {}
  },
  clear() {
    try {
      sessionStorage.removeItem('po.session');
    } catch {}
  },
};

const S = {
  state: null,
  offset: 0,
  session: session.get(),
  avatar: null,
  view: {},
  screen: null,
  disconnected: false,
};

const el = {
  reactions: $('#reactions'),
  reactionLayer: $('#reaction-layer'),
  toasts: $('#toasts'),
};

const confetti = createConfetti($('#confetti'));
const serverNow = () => Date.now() + S.offset;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const isHost = (st = S.state) => !!st && st.you === st.room.hostId;
const inviteLink = (code) => `${location.origin}${location.pathname}?xona=${code}`;
const send = (msg) => net.send(msg);

const gameUI = createGameUI({ send, toast, confetti, serverNow });

// ——— Ekranlar ———

function showScreen(name) {
  if (S.screen === name) return;
  S.screen = name;
  for (const node of $$('.screen')) node.classList.toggle('active', node.id === `screen-${name}`);
  window.scrollTo(0, 0);
  heroLoop(name === 'home');
}

// Bosh sahifadagi jonli taxta: uchta fishka o‘z-o‘zidan yuradi
const hero = createBoard($('#hero-board'), { piles: false });
const heroTokens = [
  { id: 'h1', name: 'Jasur', avatar: '🦊', color: '#2bd67b', track: 'rat', pos: 0 },
  { id: 'h2', name: 'Malika', avatar: '🦄', color: '#ffc94a', track: 'rat', pos: 8 },
  { id: 'h3', name: 'Bobur', avatar: '🐯', color: '#22c3e6', track: 'fast', pos: 5 },
];
hero.place(heroTokens);
let heroTimer = null;
let heroTurn = 0;
function heroLoop(on) {
  clearTimeout(heroTimer);
  heroTimer = null;
  if (!on) return;
  const step = async () => {
    const t = heroTokens[heroTurn++ % heroTokens.length];
    const dice = t.track === 'fast' ? [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)] : [1 + Math.floor(Math.random() * 6)];
    const steps = dice.reduce((a, b) => a + b, 0);
    await hero.roll(dice);
    await hero.hop(t, t.track, t.pos, steps);
    t.pos = (t.pos + steps) % (t.track === 'fast' ? 36 : RAT_BOARD.length);
    hero.place(heroTokens);
    if (S.screen === 'home') heroTimer = setTimeout(step, 900);
  };
  heroTimer = setTimeout(step, 600);
}

function setInRoom(on) {
  $('#room-chip').hidden = !on;
  $('#btn-topbar-leave').hidden = !on;
  $('#btn-react-toggle').hidden = !on;
  el.reactions.hidden = !on;
  if (!on) el.reactions.classList.remove('open');
}

function toast(text, icon = 'ℹ️', kind = '') {
  while (el.toasts.childElementCount >= 4) el.toasts.firstElementChild.remove();
  const node = h('div', { class: `toast ${kind}` }, h('span', { class: 'toast-ico' }, icon), h('span', {}, text));
  el.toasts.append(node);
  setTimeout(() => {
    node.classList.add('out');
    setTimeout(() => node.remove(), 400);
  }, 3200);
}

// ——— Bosh sahifa ———

function initHome() {
  const nameInput = $('#inp-name');
  const codeInput = $('#inp-code');
  const form = $('#form-home');
  nameInput.value = storage.get('po.name', '');

  let avatar = storage.get('po.avatar', null);
  if (!AVATARS.includes(avatar)) avatar = pick(AVATARS);
  S.avatar = avatar;
  const grid = $('#avatar-grid');
  grid.replaceChildren(
    ...AVATARS.map((a) =>
      h(
        'button',
        {
          type: 'button',
          class: 'avatar-opt',
          role: 'radio',
          'aria-checked': String(a === avatar),
          'aria-label': `Avatar ${a}`,
          onclick: (e) => {
            S.avatar = a;
            storage.set('po.avatar', a);
            for (const b of grid.children) b.setAttribute('aria-checked', String(b === e.currentTarget));
            sfx.pop();
          },
        },
        a,
      ),
    ),
  );

  codeInput.addEventListener('input', () => {
    codeInput.value = codeInput.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
  });

  const invited = (new URLSearchParams(location.search).get('xona') || '').toUpperCase();
  if (CODE_RE.test(invited)) {
    codeInput.value = invited;
    $('#invite-code').textContent = invited;
    $('#invite').hidden = false;
    form.classList.add('invited');
    if (S.session && S.session.code !== invited) {
      session.clear();
      S.session = null;
    }
  }

  const readName = () => {
    const value = nameInput.value.replace(/\s+/g, ' ').trim();
    if (value.length < 2) {
      formError('Ismingizni kiriting (kamida 2 belgi).', nameInput);
      return null;
    }
    storage.set('po.name', value);
    formError('');
    return value;
  };
  const dream = () => storage.get('po.dream', null);

  $('#btn-create').addEventListener('click', () => {
    unlockAudio();
    const name = readName();
    if (!name) return;
    setPending(true);
    send({ t: 'create', name, avatar: S.avatar, dream: dream() });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    unlockAudio();
    const name = readName();
    if (!name) return;
    const code = codeInput.value;
    if (!code && !form.classList.contains('invited')) {
      setPending(true);
      send({ t: 'create', name, avatar: S.avatar, dream: dream() });
      return;
    }
    if (!CODE_RE.test(code)) {
      formError('Xona kodini kiriting — 4 ta harf.', codeInput);
      return;
    }
    setPending(true);
    send({ t: 'join', code, name, avatar: S.avatar, dream: dream() });
  });
}

function formError(text, input) {
  $('#home-error').textContent = text;
  if (!input) return;
  input.classList.remove('shake');
  void input.offsetWidth;
  input.classList.add('shake');
  input.focus();
  sfx.wrong();
}

let pendingTimer = null;
function setPending(on) {
  clearTimeout(pendingTimer);
  $('#btn-create').disabled = on;
  $('#btn-join').disabled = on;
  if (on) pendingTimer = setTimeout(() => setPending(false), 6000);
}

// ——— Kutish zali ———

function renderLobby(st) {
  const host = isHost(st);
  const code = st.room.code;
  const meP = st.players.find((p) => p.id === st.you);
  if (S.view.lobbyCode !== code) {
    S.view.lobbyCode = code;
    $('#code-tiles').replaceChildren(...code.split('').map((ch, i) => h('span', { style: { '--i': i } }, ch)));
    const text = `«Pul Oqimi» o‘yiniga qo‘shiling! Xona kodi: ${code}`;
    $('#btn-telegram').href = `https://t.me/share/url?url=${encodeURIComponent(inviteLink(code))}&text=${encodeURIComponent(text)}`;
  }

  const ghosts = Math.max(0, Math.min(MAX_PLAYERS, 3) - st.players.length);
  const items = [...st.players.map((p) => ({ p })), ...Array.from({ length: ghosts }, (_, i) => ({ ghost: i }))];
  syncList(
    $('#lobby-players'),
    items,
    (it) => (it.p ? it.p.id : `ghost-${it.ghost}`),
    (it) => {
      if (!it.p) return h('li', { class: 'player-card ghost' }, h('span', { class: 'avatar' }, '＋'), h('span', {}, 'Do‘stingizni kutyapmiz…'));
      return h(
        'li',
        { class: 'player-card', style: { '--pc': it.p.color } },
        h('span', { class: 'avatar', style: { '--pc': it.p.color, '--bob': `${(-Math.random() * 3).toFixed(2)}s` } }, it.p.avatar),
        h('span', { class: 'pname' }),
        h('span', { class: 'pdream' }),
        h('span', { class: 'badges' }),
      );
    },
    (node, it) => {
      if (!it.p) return;
      const p = it.p;
      const d = DREAMS.find((x) => x.id === p.dream);
      node.classList.toggle('offline', !p.connected);
      $('.pname', node).textContent = p.name;
      $('.pdream', node).textContent = d ? `${d.icon} ${d.title}` : '';
      $('.badges', node).replaceChildren(
        ...[
          p.id === st.room.hostId && h('span', { class: 'badge badge-host' }, '👑 Mezbon'),
          p.id === st.you && h('span', { class: 'badge badge-you' }, 'Siz'),
          !p.connected && h('span', { class: 'badge badge-off' }, 'aloqa yo‘q'),
        ].filter(Boolean),
      );
    },
  );
  $('#player-count').textContent = `${st.players.length} / ${st.room.maxPlayers}`;

  const dreamGrid = $('#dream-grid');
  if (!dreamGrid.childElementCount) {
    dreamGrid.replaceChildren(
      ...DREAMS.map((d) =>
        h(
          'button',
          { type: 'button', class: 'dream-opt', role: 'radio', 'data-id': d.id, onclick: () => (sfx.pop(), storage.set('po.dream', d.id), send({ t: 'dream', dream: d.id })) },
          h('span', { class: 'dream-ico' }, d.icon),
          h('span', { class: 'dream-title' }, d.title),
          h('b', { class: 'dream-cost' }, money(d.cost)),
        ),
      ),
    );
  }
  for (const b of dreamGrid.children) b.setAttribute('aria-checked', String(b.dataset.id === meP?.dream));

  renderSeg($('#seg-mode'), MODES, st.room.settings.mode, host, (v) => send({ t: 'settings', mode: v }));
  renderSeg($('#seg-turn'), TURN_OPTIONS, st.room.settings.turnSeconds, host, (v) => send({ t: 'settings', turnSeconds: Number(v) }));
  $('#mode-hint').textContent = MODES.find((m) => m[0] === st.room.settings.mode)?.[2] || '';

  $('#settings-lock').hidden = host;
  $('#btn-start').hidden = !host;
  $('#wait-host').hidden = host;
  $('#solo-hint').hidden = !host || st.players.length > 1;
  document.title = `${code} · Pul Oqimi`;
}

function renderSeg(container, options, value, enabled, onPick) {
  if (container.childElementCount !== options.length) {
    container.replaceChildren(...options.map(([v, label]) => h('button', { type: 'button', role: 'radio', 'data-v': String(v) }, label)));
    container.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || b.disabled || b.getAttribute('aria-checked') === 'true') return;
      sfx.click();
      onPick(b.dataset.v);
    });
  }
  for (const b of container.children) {
    b.setAttribute('aria-checked', String(b.dataset.v === String(value)));
    b.disabled = !enabled;
  }
}

// ——— Yakuniy natijalar ———

function standings(st) {
  const g = st.game;
  const score = (p) => {
    if (p.id === g.winner) return 1e12;
    if (p.track === 'fast') return 1e9 + p.fast.income;
    return (passiveIncome(p) / Math.max(1, totalExpenses(p))) * 1e6 + p.cash / 1e3;
  };
  return [...g.players].sort((a, b) => score(b) - score(a));
}

function renderFinal(st) {
  const host = isHost(st);
  $('#btn-again').hidden = !host;
  $('#final-wait').hidden = host;
  const key = st.room.gameId;
  if (S.view.finalKey === key) return;
  S.view.finalKey = key;
  document.title = '🏆 Natijalar · Pul Oqimi';
  const g = st.game;
  const meta = (id) => st.players.find((p) => p.id === id) || { name: 'O‘yinchi', avatar: '👤', color: '#94a3b8' };
  const ranked = standings(st);
  const winner = g.winner ? meta(g.winner) : null;
  const reason = {
    dream: 'orzusini sotib olib',
    income: 'oylik pul oqimini $50 000 ga oshirib',
    escape: 'kalamush poygasidan birinchi chiqib',
  }[g.winReason];
  $('#final-title').textContent = winner ? (g.winner === st.you ? 'Siz g‘olibsiz! 🏆' : `${winner.name} g‘olib bo‘ldi!`) : 'O‘yin yakunlandi';
  $('#final-sub').textContent = winner && reason ? `${winner.name} ${reason} moliyaviy erkinlikka erishdi.` : '';

  const status = (p) => {
    if (p.id === g.winner && g.winReason === 'dream') return `${DREAMS.find((d) => d.id === p.dream)?.icon} Orzu amalga oshdi`;
    if (p.track === 'fast') return `🚀 ${signed(p.fast.income)}/oy`;
    const pct = Math.round((passiveIncome(p) / Math.max(1, totalExpenses(p))) * 100);
    return `🐀 Erkinlikka ${pct}%`;
  };
  const heights = { 1: '170px', 2: '120px', 3: '86px' };
  const delays = { 1: '1s', 2: '0.6s', 3: '0.2s' };
  const titles = ['Moliyaviy erkin', 'Investor', 'Tadbirkor'];
  $('#podium').replaceChildren(
    ...[1, 0, 2]
      .filter((i) => ranked[i])
      .map((i) => {
        const p = ranked[i];
        const m = meta(p.id);
        const place = i + 1;
        return h(
          'div',
          { class: 'pod', 'data-place': place, style: { '--pc': m.color, '--h': heights[place], '--d': delays[place] } },
          h(
            'div',
            { class: 'pod-who' },
            h('span', { class: 'avatar pod-avatar', style: { '--pc': m.color } }, m.avatar, place === 1 ? h('span', { class: 'pod-crown' }, '👑') : null),
            h('span', { class: 'pod-name' }, m.name),
            h('span', { class: 'pod-title' }, titles[i]),
            h('span', { class: 'pod-score' }, status(p)),
          ),
          h('div', { class: 'pod-pillar' }, place),
        );
      }),
  );

  const awards = [];
  const best = (fn) => [...g.players].sort((a, b) => fn(b) - fn(a))[0];
  const rich = best((p) => p.cash);
  if (rich) awards.push({ ico: '💰', title: 'Eng ko‘p naqd pul', p: rich, val: money(rich.cash) });
  const investor = best((p) => p.stats.deals);
  if (investor?.stats.deals) awards.push({ ico: '🏘️', title: 'Faol investor', p: investor, val: `${investor.stats.deals} ta bitim` });
  const giver = best((p) => p.stats.donated);
  if (giver?.stats.donated) awards.push({ ico: '💖', title: 'Saxiy qalb', p: giver, val: `${money(giver.stats.donated)} xayriya` });
  const trader = best((p) => p.stats.sold);
  if (trader?.stats.sold) awards.push({ ico: '🤝', title: 'Savdo ustasi', p: trader, val: `${trader.stats.sold} ta sotuv` });
  $('#awards').replaceChildren(
    ...awards.map((a, i) =>
      h(
        'div',
        { class: 'award', style: { '--i': i } },
        h('span', { class: 'award-ico' }, a.ico),
        h('div', {}, h('div', { class: 'award-title' }, a.title), h('div', { class: 'award-who' }, `${meta(a.p.id).avatar} ${meta(a.p.id).name}`), h('div', { class: 'award-val' }, a.val)),
      ),
    ),
  );

  $('#final-list').replaceChildren(
    ...ranked.map((p, i) => {
      const m = meta(p.id);
      const prof = PROFESSIONS.find((x) => x.id === p.profession);
      return h(
        'li',
        { class: `brow${p.id === st.you ? ' me' : ''}`, 'data-rank': i + 1, style: { '--pc': m.color } },
        h('span', { class: 'rank' }, i + 1),
        avatarEl(m),
        h('span', { class: 'bname' }, m.name, h('small', {}, ` ${prof.icon} ${prof.title}`)),
        h('span', { class: 'bstats' }, status(p)),
        h('b', { class: 'bscore' }, money(p.cash)),
      );
    }),
  );

  setTimeout(() => {
    if (S.view.finalKey !== key || S.screen !== 'final') return;
    confetti.cannons();
    sfx.fanfare();
  }, 1700);
  if (g.winner === st.you) setTimeout(() => S.screen === 'final' && confetti.burst(), 2700);
}

// ——— Tarmoq xabarlari ———

function onState(st) {
  S.offset = st.now - Date.now();
  const prev = S.state;
  S.state = st;
  setInRoom(true);
  $('#room-chip-code').textContent = st.room.code;

  const phase = st.room.phase;
  showScreen(phase === 'playing' ? 'game' : phase);
  if (phase === 'lobby') renderLobby(st);
  else if (phase === 'playing') gameUI.render(st);
  else if (phase === 'final') renderFinal(st);
  if (phase === 'lobby' && prev?.room.phase === 'final') S.view = { lobbyCode: S.view.lobbyCode };
  if (phase === 'playing' && prev?.room.phase === 'lobby') toast('O‘yin boshlandi! Kasbingizni hisobotda ko‘ring.', '🎬', 'good');
}

function onEvent(ev) {
  if (ev.kind === 'joined') {
    toast(`${ev.name} xonaga qo‘shildi`, ev.avatar, 'good');
    sfx.join();
  } else if (ev.kind === 'left') {
    toast(`${ev.name} xonadan chiqdi`, ev.avatar);
    sfx.leave();
  } else if (ev.kind === 'host') {
    if (S.state && ev.id === S.state.you) toast('Endi siz mezbonsiz!', '👑', 'good');
    else toast(`${ev.name} endi mezbon`, '👑');
  }
}

function onError(msg) {
  setPending(false);
  if (msg.code === 'RESUME_FAILED' || msg.code === 'REPLACED') {
    const hadSession = !!S.session;
    resetToHome();
    if (hadSession) toast(msg.message, msg.code === 'REPLACED' ? '🪟' : '⌛', 'error');
    return;
  }
  if (msg.code === 'RATE') return;
  if (S.screen === 'home' || S.screen === 'loading') {
    showScreen('home');
    $('#home-error').textContent = msg.message;
    sfx.wrong();
  } else {
    toast(msg.message, '⚠️', 'error');
    sfx.wrong();
  }
}

function onMessage(msg) {
  switch (msg.t) {
    case 'joined':
      setPending(false);
      S.session = { code: msg.code, playerId: msg.playerId, token: msg.token };
      session.set(S.session);
      history.replaceState(null, '', `?xona=${msg.code}`);
      break;
    case 'state':
      onState(msg);
      break;
    case 'event':
      onEvent(msg);
      break;
    case 'react': {
      const player = S.state?.players.find((p) => p.id === msg.id);
      floatEmoji(el.reactionLayer, msg.emoji, player);
      break;
    }
    case 'error':
      onError(msg);
      break;
  }
}

function resetToHome() {
  session.clear();
  S.session = null;
  S.state = null;
  S.view = {};
  gameUI.reset();
  history.replaceState(null, '', location.pathname);
  setInRoom(false);
  $('#invite').hidden = true;
  $('#form-home').classList.remove('invited');
  document.title = 'Pul Oqimi — moliyaviy erkinlik o‘yini';
  showScreen('home');
}

function leaveRoom() {
  const st = S.state;
  if (st?.room.phase === 'playing' && !confirm('O‘yindan chiqmoqchimisiz? Barcha aktivlaringiz yo‘qoladi.')) return;
  send({ t: 'leave' });
  resetToHome();
}

async function copyInvite(button) {
  if (!S.state) return;
  const link = inviteLink(S.state.room.code);
  try {
    await navigator.clipboard.writeText(link);
  } catch {
    const ta = h('textarea', { style: { position: 'fixed', opacity: '0' } }, link);
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  toast('Havola nusxalandi — do‘stlaringizga yuboring!', '🔗', 'good');
  sfx.pop();
  if (button) {
    const old = button.textContent;
    button.textContent = '✔ Nusxalandi!';
    setTimeout(() => (button.textContent = old), 1600);
  }
}

// ——— Ishga tushirish ———

function initChrome() {
  const soundBtn = $('#btn-sound');
  const renderSound = () => {
    const m = isMuted();
    soundBtn.textContent = m ? '🔇' : '🔊';
    soundBtn.setAttribute('aria-label', m ? 'Ovozni yoqish' : 'Ovozni o‘chirish');
  };
  soundBtn.addEventListener('click', () => {
    setMuted(!isMuted());
    renderSound();
    sfx.pop();
  });
  renderSound();

  $('#btn-rules').addEventListener('click', () => $('#rules-modal').showModal());
  $('#room-chip').addEventListener('click', () => copyInvite());
  $('#btn-copy').addEventListener('click', (e) => copyInvite(e.currentTarget));
  $('#btn-start').addEventListener('click', () => {
    unlockAudio();
    send({ t: 'start' });
  });
  $('#btn-again').addEventListener('click', () => send({ t: 'again' }));
  $('#btn-leave').addEventListener('click', leaveRoom);
  $('#btn-exit').addEventListener('click', leaveRoom);
  $('#btn-topbar-leave').addEventListener('click', leaveRoom);

  el.reactions.replaceChildren(
    ...REACTIONS.map((emoji) =>
      h(
        'button',
        {
          type: 'button',
          'aria-label': `Reaksiya: ${emoji}`,
          onclick: (e) => {
            unlockAudio();
            send({ t: 'react', emoji });
            const b = e.currentTarget;
            b.classList.add('sent');
            setTimeout(() => b.classList.remove('sent'), 160);
          },
        },
        emoji,
      ),
    ),
  );
  const toggle = $('#btn-react-toggle');
  toggle.addEventListener('click', () => {
    const open = !el.reactions.classList.contains('open');
    el.reactions.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (e) => {
    if (!el.reactions.contains(e.target) && !toggle.contains(e.target)) {
      el.reactions.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && S.state) document.title = `${S.state.room.code} · Pul Oqimi`;
  });
  document.addEventListener('pointerdown', unlockAudio, { once: true });
}

initHome();
initChrome();
showScreen(S.session ? 'loading' : 'home');

const net = createNet({
  onOpen() {
    $('#conn-banner').hidden = true;
    if (S.session) net.send({ t: 'resume', ...S.session });
    if (S.disconnected && S.session) toast('Aloqa tiklandi', '✅', 'good');
    S.disconnected = false;
  },
  onClose() {
    S.disconnected = true;
    if (S.session) $('#conn-banner').hidden = false;
  },
  onMessage,
});

// Kutish zalida foydali maslahatlar
const tipLine = h('p', { class: 'lobby-tip' });
$('.lobby-settings').append(tipLine);
let tipIndex = Math.floor(Math.random() * TIPS.length);
tipLine.textContent = `💡 ${TIPS[tipIndex]}`;
setInterval(() => {
  if (S.screen !== 'lobby') return;
  tipLine.classList.add('swap');
  setTimeout(() => {
    tipIndex = (tipIndex + 1) % TIPS.length;
    tipLine.textContent = `💡 ${TIPS[tipIndex]}`;
    tipLine.classList.remove('swap');
  }, 400);
}, 7000);
