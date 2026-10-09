import { $, $$, h, avatarEl, syncList, fmt } from './dom.js';
import { createNet } from './net.js';
import { sfx, isMuted, setMuted, unlockAudio } from './sound.js';
import { countUp, flip, floatScore, floatEmoji, createConfetti } from './fx.js';
import { createScene } from './scene.js';

// ——— Sozlamalar (server bilan bir xil bo‘lishi kerak) ———
const AVATARS = ['🦊', '🐯', '🦁', '🐼', '🐸', '🦉', '🐺', '🐻', '🦄', '🐲', '🦅', '🐱', '🍉', '🍇', '🥟', '🫖'];
const REACTIONS = ['👍', '😂', '😮', '🔥', '👏', '😭', '🎉', '🫡'];
const ROUND_OPTIONS = [5, 8, 12];
const TIME_OPTIONS = [15, 25, 40];
const MAX_PLAYERS = 12;
const FIELDS = ['fio', 'vin', 'model', 'year', 'engine', 'color'];
const FIELD_LABELS = {
  fio: 'F.I.Sh.',
  vin: 'VIN raqami',
  model: 'Marka va model',
  year: 'Ishlab chiqarilgan yili',
  engine: 'Dvigatel hajmi',
  color: 'Rangi',
};
const TIERS = { 1: 'Oson', 2: 'O‘rtacha', 3: 'Qiyin' };
const PLACE_TITLES = ['Bosh inspektor', 'Katta inspektor', 'Inspektor'];
const PRAISE = ['Barakalla!', 'Ofarin!', 'Zo‘r!', 'Aniq topdingiz!', 'Qoyil!'];
const TIPS = [
  'VIN raqami doim 17 belgidan iborat va unda I, O, Q harflari ishlatilmaydi.',
  'VIN’ning 10-belgisi ishlab chiqarilgan yilni bildiradi: N — 2022, P — 2023, R — 2024, S — 2025.',
  'Familiyadagi bitta harfga ham e’tibor bering: Yusupov va Yusufov — boshqa-boshqa odamlar!',
  '«1.5T» va «1.5» bir xil emas: T harfi turbo dvigatelni bildiradi.',
  'Ba’zan hujjatlar to‘liq to‘g‘ri bo‘ladi — unda avtomobilni o‘tkazib yuboring.',
  'Tez javob ko‘proq ball beradi, ketma-ket to‘g‘ri javoblar uchun esa bonus bor 🔥',
  'Texnik pasportdagi rangli doiracha avtomobilning haqiqiy rangini ko‘rsatadi.',
  'Raund sayin qiyinlashadi: oxirida farq bitta belgida bo‘lishi mumkin.',
];
const CODE_RE = /^[A-Z]{4}$/;
const TIMER_CIRC = 2 * Math.PI * 19;
const GAME_PHASES = ['countdown', 'round', 'reveal', 'board'];
const SCREEN_OF = { lobby: 'lobby', countdown: 'game', round: 'game', reveal: 'game', board: 'board', final: 'final' };

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
// Sessiya har bir oyna (tab) uchun alohida: sahifa yangilansa, o‘sha o‘yinchi bo‘lib qaytamiz
const session = {
  get() {
    try {
      return JSON.parse(sessionStorage.getItem('bu.session'));
    } catch {
      return null;
    }
  },
  set(value) {
    try {
      sessionStorage.setItem('bu.session', JSON.stringify(value));
    } catch {}
  },
  clear() {
    try {
      sessionStorage.removeItem('bu.session');
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
  timer: $('#timer'),
  timerBar: $('#timer-bar'),
  timerNum: $('#timer-num'),
  docs: $('#docs'),
  btnOk: $('#btn-ok'),
  hint: $('#game-hint'),
  myScore: $('#my-score'),
  countdown: $('#countdown'),
  reactions: $('#reactions'),
  reactionLayer: $('#reaction-layer'),
  toasts: $('#toasts'),
};

const scene = createScene($('#scene'));
const heroScene = createScene($('#hero-scene'));
const confetti = createConfetti($('#confetti'));

const me = (st = S.state) => st?.players.find((p) => p.id === st.you);
const isHost = (st = S.state) => !!st && st.you === st.room.hostId;
const serverNow = () => Date.now() + S.offset;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const inviteLink = (code) => `${location.origin}${location.pathname}?xona=${code}`;
const rankOrder = (players, scoreOf) =>
  players
    .map((p, i) => ({ p, i }))
    .sort((a, b) => scoreOf(b.p) - scoreOf(a.p) || a.i - b.i)
    .map((x) => x.p);

// ——— Ekranlar ———

function showScreen(name) {
  if (S.screen === name) return;
  S.screen = name;
  for (const node of $$('.screen')) node.classList.toggle('active', node.id === `screen-${name}`);
  window.scrollTo(0, 0);
  heroLoop(name === 'home');
}

let heroTimer = null;
function heroLoop(on) {
  clearTimeout(heroTimer);
  heroTimer = null;
  if (!on) return;
  const colors = ['#d2343a', '#2d6cd2', '#f3f4f6', '#1b1d22', '#2fb3ad', '#e8b10c', '#c2c7ce', '#73202c'];
  const cycle = () => {
    heroScene.arrive({ body: pick(['suv', 'sedan']), color: pick(colors) });
    heroTimer = setTimeout(() => {
      if (Math.random() < 0.25) heroScene.detain();
      else heroScene.pass();
      heroTimer = setTimeout(cycle, 2600);
    }, 2300);
  };
  cycle();
}

let tipIndex = Math.floor(Math.random() * TIPS.length);
function rotateTip() {
  const text = $('#tip-text');
  if (S.screen !== 'lobby') return;
  text.classList.add('swap');
  setTimeout(() => {
    tipIndex = (tipIndex + 1) % TIPS.length;
    text.textContent = TIPS[tipIndex];
    text.classList.remove('swap');
  }, 400);
}

function setInRoom(on) {
  $('#room-chip').hidden = !on;
  $('#btn-topbar-leave').hidden = !on;
  $('#btn-react-toggle').hidden = !on;
  el.reactions.hidden = !on;
  if (!on) el.reactions.classList.remove('open');
}

// ——— Bildirishnomalar ———

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
  nameInput.value = storage.get('bu.name', '');

  let avatar = storage.get('bu.avatar', null);
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
            storage.set('bu.avatar', a);
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
    // Boshqa xonaga taklif havolasi ochilgan bo‘lsa, eski sessiyani unutamiz
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
    storage.set('bu.name', value);
    formError('');
    return value;
  };

  $('#btn-create').addEventListener('click', () => {
    unlockAudio();
    const name = readName();
    if (!name) return;
    setPending(true);
    net.send({ t: 'create', name, avatar: S.avatar });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    unlockAudio();
    const name = readName();
    if (!name) return;
    const code = codeInput.value;
    if (!code && !form.classList.contains('invited')) {
      setPending(true);
      net.send({ t: 'create', name, avatar: S.avatar });
      return;
    }
    if (!CODE_RE.test(code)) {
      formError('Xona kodini kiriting — 4 ta harf.', codeInput);
      return;
    }
    setPending(true);
    net.send({ t: 'join', code, name, avatar: S.avatar });
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
  if (S.view.lobbyCode !== code) {
    S.view.lobbyCode = code;
    $('#code-tiles').replaceChildren(...code.split('').map((ch, i) => h('span', { style: { '--i': i } }, ch)));
    const text = `«Bojxona Ustasi» o‘yiniga qo‘shiling! Xona kodi: ${code}`;
    $('#btn-telegram').href = `https://t.me/share/url?url=${encodeURIComponent(inviteLink(code))}&text=${encodeURIComponent(text)}`;
  }

  const ghosts = Math.max(0, 4 - st.players.length);
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
        h('span', { class: 'badges' }),
      );
    },
    (node, it) => {
      if (!it.p) return;
      const p = it.p;
      node.classList.toggle('offline', !p.connected);
      $('.pname', node).textContent = p.name;
      $('.badges', node).replaceChildren(
        ...[
          p.id === st.room.hostId && h('span', { class: 'badge badge-host' }, '👑 Mezbon'),
          p.id === st.you && h('span', { class: 'badge badge-you' }, 'Siz'),
          !p.connected && h('span', { class: 'badge badge-off' }, 'aloqa yo‘q'),
        ].filter(Boolean),
      );
    },
  );
  $('#player-count').textContent = `${st.players.length} / ${MAX_PLAYERS}`;

  renderSeg($('#seg-rounds'), ROUND_OPTIONS, st.room.settings.rounds, host, (v) => net.send({ t: 'settings', rounds: v }), (v) => `${v} ta`);
  renderSeg($('#seg-time'), TIME_OPTIONS, st.room.settings.time, host, (v) => net.send({ t: 'settings', time: v }), (v) => `${v} s`);

  $('#settings-lock').hidden = host;
  $('#btn-start').hidden = !host;
  $('#wait-host').hidden = host;
  $('#solo-hint').hidden = !host || st.players.length > 1;
  document.title = `${code} · Bojxona Ustasi`;
}

function renderSeg(container, options, value, enabled, onPick, label) {
  if (container.childElementCount !== options.length) {
    container.replaceChildren(...options.map((v) => h('button', { type: 'button', role: 'radio', 'data-v': v }, label(v))));
    container.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || b.disabled || b.getAttribute('aria-checked') === 'true') return;
      sfx.click();
      onPick(Number(b.dataset.v));
    });
  }
  for (const b of container.children) {
    b.setAttribute('aria-checked', String(Number(b.dataset.v) === value));
    b.disabled = !enabled;
  }
}

// ——— O‘yin ———

function renderGame(st) {
  const { phase, gameId, round, totalRounds } = st.room;
  if (phase === 'countdown') {
    const key = `cd:${gameId}`;
    if (S.view.gameKey !== key) {
      S.view.gameKey = key;
      S.view.choice = null;
      scene.clear();
      el.docs.replaceChildren();
      el.docs.className = 'docs placeholder';
      $('#round-label').textContent = `Raund 1 / ${totalRounds}`;
      $('#tier').hidden = true;
      el.timer.classList.add('idle');
      el.timer.classList.remove('urgent');
      el.timerBar.style.strokeDashoffset = 0;
      el.timerNum.textContent = st.room.settings.time;
      showDock('controls');
      el.btnOk.disabled = true;
      setHint('Tayyorlaning — birinchi avtomobil yetib kelmoqda…');
    }
    updateHud(st);
    return;
  }
  if (!st.case) return;
  const key = `${gameId}:${round}`;
  if (S.view.gameKey !== key) {
    S.view.gameKey = key;
    S.view.revealed = false;
    S.view.choice = null;
    buildRound(st);
  }
  updateHud(st);
  updateAnswered(st);
  if (st.myChoice) applyChoice(st.myChoice, false);
  if (phase === 'reveal' && !S.view.revealed) {
    S.view.revealed = true;
    applyReveal(st);
  }
}

function buildRound(st) {
  const c = st.case;
  $('#round-label').textContent = `Raund ${st.room.round} / ${st.room.totalRounds}`;
  const tier = $('#tier');
  tier.hidden = false;
  tier.className = `tier tier-${c.tier}`;
  tier.textContent = TIERS[c.tier] || '';

  buildDocs(c);
  scene.arrive(c.car);
  sfx.car();

  showDock('controls');
  el.btnOk.disabled = st.room.phase !== 'round';
  el.btnOk.classList.remove('chosen');
  el.btnOk.textContent = '✔ Hammasi to‘g‘ri — o‘tkazish';
  setHint(['Deklaratsiyani texnik pasport bilan solishtiring. Xato bo‘lsa — ', h('b', {}, 'o‘sha qatorni bosing'), '.']);
  el.timer.classList.remove('urgent', 'idle');
  el.timerBar.style.strokeDashoffset = 0;
  S.view.lastSec = null;
  if (document.hidden) document.title = `⏰ ${st.room.round}-raund! · Bojxona Ustasi`;
}

function buildDocs(c) {
  const declRows = FIELDS.map((f, i) =>
    h(
      'button',
      {
        type: 'button',
        class: 'doc-row',
        'data-field': f,
        style: { '--i': i },
        'aria-label': `${FIELD_LABELS[f]}: ${c.decl[f]}. Xato deb belgilash`,
        onclick: () => choose(f),
      },
      h('span', { class: 'lbl' }, FIELD_LABELS[f]),
      h('span', { class: `val${f === 'vin' ? ' mono' : ''}` }, h('span', { class: 'txt' }, c.decl[f])),
      h('span', { class: 'side' }, h('span', { class: 'chips' }), h('span', { class: 'row-mark', 'aria-hidden': 'true' })),
    ),
  );
  const decl = h(
    'article',
    { class: 'doc doc-decl', 'aria-label': 'Bojxona deklaratsiyasi' },
    h(
      'header',
      { class: 'doc-head' },
      h('div', { class: 'doc-kicker' }, 'Transport vositasi uchun'),
      h('div', { class: 'doc-title' }, 'Deklaratsiya'),
      h('div', { class: 'doc-meta' }, `№ ${c.decl.number}`),
      h('div', { class: 'doc-meta' }, `${c.decl.date} · «${c.post}» posti`),
      h('span', { class: 'doc-seal', 'aria-hidden': 'true' }, '🛃'),
    ),
    ...declRows,
    h('footer', { class: 'doc-foot' }, h('span', {}, `Jo‘natuvchi: ${c.origin.flag} ${c.origin.name}`), h('span', { class: 'sign' }, 'Deklarant imzosi')),
  );

  const passRows = FIELDS.map((f, i) =>
    h(
      'div',
      { class: 'doc-row', 'data-field': f, style: { '--i': i } },
      h('span', { class: 'lbl' }, FIELD_LABELS[f]),
      h(
        'span',
        { class: `val${f === 'vin' ? ' mono' : ''}` },
        f === 'color' ? h('span', { class: 'swatch', style: { background: c.car.color } }) : null,
        h('span', { class: 'txt' }, c.passport[f]),
      ),
    ),
  );
  const pass = h(
    'article',
    { class: 'doc doc-pass', 'aria-label': 'Texnik pasport' },
    h(
      'header',
      { class: 'doc-head' },
      h('div', { class: 'doc-kicker' }, 'Ro‘yxatdan o‘tkazish guvohnomasi'),
      h('div', { class: 'doc-title' }, 'Texnik pasport'),
      h('div', { class: 'doc-meta' }, `Seriya ${c.passport.series}`),
      h('div', { class: 'doc-meta' }, 'Asl hujjat · tasdiqlangan'),
      h('span', { class: 'doc-seal', 'aria-hidden': 'true' }, '🚗'),
    ),
    ...passRows,
    h('footer', { class: 'doc-foot' }, h('span', {}, '✔ Haqiqiy ma’lumotlar'), h('span', { class: 'sign' }, 'Mas’ul xodim')),
  );
  el.docs.className = 'docs';
  el.docs.replaceChildren(decl, pass);
}

function choose(choice) {
  const st = S.state;
  if (!st || st.room.phase !== 'round' || S.view.choice) return;
  unlockAudio();
  net.send({ t: 'answer', choice });
  applyChoice(choice, true);
}

function applyChoice(choice, fresh) {
  if (S.view.choice) return;
  S.view.choice = choice;
  el.docs.classList.add('locked');
  el.btnOk.disabled = true;
  const decl = $('.doc-decl', el.docs);
  if (!decl) return;
  let stamp;
  if (choice === 'ok') {
    el.btnOk.classList.add('chosen');
    el.btnOk.textContent = '✔ Javobingiz: o‘tkazish';
    stamp = h('div', { class: 'stamp ok' }, 'O‘tkazilsin');
  } else {
    $(`.doc-row[data-field="${choice}"]`, decl)?.classList.add('picked');
    stamp = h('div', { class: 'stamp stop' }, 'To‘xtatilsin');
  }
  decl.append(stamp);
  if (fresh) {
    sfx.stamp();
    decl.classList.remove('thud');
    void decl.offsetWidth;
    decl.classList.add('thud');
    navigator.vibrate?.(25);
  }
  setHint(['Javobingiz qabul qilindi — ', h('b', {}, 'boshqalarni kutamiz…')], 'done');
}

function updateHud(st) {
  const player = me(st);
  if (!player) return;
  const shown = Number(el.myScore.dataset.v || 0);
  if (shown !== player.score) {
    el.myScore.dataset.v = player.score;
    countUp(el.myScore, shown, player.score, 1100, fmt);
  }
  const streak = $('#my-streak');
  streak.hidden = player.streak < 2;
  streak.textContent = `🔥 ${player.streak} ketma-ket`;
}

function updateAnswered(st) {
  if (st.room.phase !== 'round') return;
  const active = st.players.filter((p) => p.connected || p.answered);
  $('#answered-count').textContent = `${st.players.filter((p) => p.answered).length}/${active.length}`;
  syncList(
    $('#answered-avatars'),
    active,
    (p) => p.id,
    (p) => avatarEl(p),
    (node, p) => {
      const was = node.classList.contains('done');
      node.classList.toggle('done', p.answered);
      if (p.answered && !was && p.id !== st.you) sfx.click();
    },
  );
}

function showDock(which) {
  $('#controls').hidden = which !== 'controls';
  $('#reveal').hidden = which !== 'reveal';
}

function setHint(content, kind = '') {
  el.hint.className = `hint ${kind}`.trim();
  el.hint.replaceChildren(...[content].flat());
}

function applyReveal(st) {
  const r = st.reveal;
  if (!r) return;
  const player = me(st);
  const decl = $('.doc-decl', el.docs);
  const pass = $('.doc-pass', el.docs);
  el.docs.classList.add('locked');
  el.btnOk.disabled = true;
  el.timer.classList.remove('urgent');
  el.timer.classList.add('idle');
  el.timerNum.textContent = '—';
  decl?.classList.add('revealed');

  if (r.answer === 'ok') {
    $$('.doc-row', decl).forEach((row) => row.classList.add('is-ok'));
    scene.pass();
    sfx.barrier();
  } else {
    $(`.doc-row[data-field="${r.answer}"]`, decl)?.classList.add('is-wrong');
    $(`.doc-row[data-field="${r.answer}"]`, pass)?.classList.add('is-truth');
    scene.detain();
    sfx.siren();
  }

  // Kim qaysi qatorni tanlaganini ko‘rsatamiz
  const byChoice = {};
  for (const p of st.players) {
    const choice = r.picks[p.id];
    if (choice) (byChoice[choice] ||= []).push(p);
  }
  for (const f of FIELDS) {
    const chips = $(`.doc-row[data-field="${f}"] .chips`, decl);
    chips?.replaceChildren(
      ...(byChoice[f] || []).map((p, i) => {
        const a = avatarEl(p);
        a.style.setProperty('--i', i);
        return a;
      }),
    );
  }

  const myPick = r.picks[st.you];
  const correct = player?.lastCorrect === true;
  $('#reveal').className = `reveal ${correct ? 'good' : 'bad'}`;
  $('#reveal-icon').textContent = correct ? '🎯' : myPick ? '😕' : '⏰';
  $('#reveal-title').textContent = correct ? pick(PRAISE) : myPick ? 'Afsus, noto‘g‘ri' : 'Vaqt tugadi!';

  if (r.answer === 'ok') {
    $('#reveal-text').replaceChildren('Hujjatlar to‘liq mos edi — avtomobil chegaradan o‘tkazildi.');
  } else {
    const e = r.explain;
    $('#reveal-text').replaceChildren(
      'Xato ',
      h('b', {}, `«${FIELD_LABELS[e.field]}»`),
      ' qatorida: deklaratsiyada ',
      h('span', { class: 'q-bad' }, e.decl),
      ', texnik pasportda esa ',
      h('span', { class: 'q-good' }, e.real),
      '.',
    );
  }

  const inRound = st.players.filter((p) => p.connected || r.picks[p.id]);
  const rightCount = st.players.filter((p) => r.picks[p.id] === r.answer).length;
  const meta = [`To‘g‘ri topdi: ${rightCount} / ${inRound.length}`];
  if (myPick && !correct) meta.push(`Siz tanlagan: «${myPick === 'ok' ? 'Hammasi to‘g‘ri' : FIELD_LABELS[myPick]}»`);
  if (byChoice.ok?.length) meta.push(`«O‘tkazilsin» deganlar: ${byChoice.ok.map((p) => p.avatar).join(' ')}`);
  if (correct && player.streak >= 2) meta.push(`🔥 ${player.streak} ta ketma-ket`);
  $('#reveal-meta').textContent = meta.join(' · ');

  const gain = $('#reveal-gain');
  gain.classList.toggle('zero', !correct);
  if (correct) countUp(gain, 0, player.lastGain, 900, (n) => `+${fmt(n)}`);
  else gain.textContent = '0 ball';

  $('#btn-skip-reveal').hidden = !isHost(st);
  showDock('reveal');

  if (correct) {
    sfx.correct();
    floatScore(el.myScore, `+${fmt(player.lastGain)}`);
    const rect = gain.getBoundingClientRect();
    setTimeout(() => confetti.small(rect.left + rect.width / 2, rect.top), 150);
  } else {
    sfx.wrong();
  }
}

// ——— Ortga sanoq ———

function beatCountdown(idx) {
  const num = $('#cd-num');
  const ring = $('#cd-ring');
  const word = idx >= 3;
  num.textContent = word ? 'Boshladik!' : String(3 - idx);
  num.classList.toggle('word', word);
  for (const node of [num, ring]) {
    node.classList.remove('beat');
    void node.offsetWidth;
    node.classList.add('beat');
  }
  if (word) sfx.go();
  else sfx.beat();
}

// ——— Reyting ———

function boardRow(st, p, rank, score, i, { stats = false } = {}) {
  const meta = stats
    ? h('span', { class: 'bstats' }, `✔ ${p.correct}/${st.room.totalRounds}`, p.bestStreak >= 2 ? ` · 🔥 ${p.bestStreak}` : '')
    : [
        h('span', { class: `gain${p.lastGain ? '' : ' zero'}` }, `+${fmt(p.lastGain)}`),
        p.streak >= 2 ? h('span', { class: 'fire' }, `🔥${p.streak}`) : null,
      ];
  return h(
    'li',
    {
      class: `brow${p.id === st.you ? ' me' : ''}${p.connected ? '' : ' offline'}`,
      'data-key': p.id,
      'data-rank': rank,
      style: { '--pc': p.color, '--i': i },
    },
    h('span', { class: 'rank' }, rank),
    avatarEl(p),
    h('span', { class: 'bname' }, p.name, p.id === st.you ? h('small', {}, 'Siz') : null),
    h('span', { class: 'bmeta' }, meta),
    h('b', { class: 'bscore' }, fmt(score)),
  );
}

function renderBoard(st) {
  const key = `${st.room.gameId}:${st.room.round}`;
  const list = $('#board-list');
  $('#btn-skip-board').hidden = !isHost(st);
  if (S.view.boardKey === key) {
    for (const p of st.players) list.querySelector(`[data-key="${p.id}"]`)?.classList.toggle('offline', !p.connected);
    return;
  }
  S.view.boardKey = key;
  const { round, totalRounds } = st.room;
  $('#board-sub').textContent = `${round}-raunddan keyin · jami ${totalRounds} raund`;
  $('#next-text').textContent = round + 1 === totalRounds ? 'Keyingisi — oxirgi raund! 🔥' : `Tez orada ${round + 1}-raund boshlanadi…`;

  const fill = $('#next-fill');
  fill.getAnimations().forEach((a) => a.cancel());
  const left = Math.max(0, st.room.endsAt - serverNow());
  fill.animate([{ width: `${100 * (1 - left / st.room.phaseMs)}%` }, { width: '100%' }], { duration: left, easing: 'linear', fill: 'forwards' });

  const before = rankOrder(st.players, (p) => p.score - p.lastGain);
  const after = rankOrder(st.players, (p) => p.score);
  list.classList.remove('revealed');
  list.replaceChildren(...before.map((p, i) => boardRow(st, p, i + 1, p.score - p.lastGain, i)));

  setTimeout(() => {
    if (S.view.boardKey !== key) return;
    list.classList.add('revealed');
    flip(list, () => {
      after.forEach((p, i) => {
        const row = list.querySelector(`[data-key="${p.id}"]`);
        if (!row) return;
        list.append(row);
        row.dataset.rank = i + 1;
        $('.rank', row).textContent = i + 1;
      });
    });
    for (const p of after) {
      const row = list.querySelector(`[data-key="${p.id}"]`);
      if (row) countUp($('.bscore', row), p.score - p.lastGain, p.score, 1000, fmt);
    }
    sfx.whoosh();
  }, 900);
}

// ——— Yakuniy natijalar ———

function renderFinal(st) {
  const host = isHost(st);
  $('#btn-again').hidden = !host;
  $('#final-wait').hidden = host;
  const key = st.room.gameId;
  if (S.view.finalKey === key) {
    for (const p of st.players) $('#final-list').querySelector(`[data-key="${p.id}"]`)?.classList.toggle('offline', !p.connected);
    return;
  }
  S.view.finalKey = key;
  document.title = `🏆 Natijalar · Bojxona Ustasi`;

  const ranked = rankOrder(st.players, (p) => p.score);
  const winner = ranked[0];
  $('#final-title').textContent = !winner ? 'O‘yin yakunlandi' : winner.id === st.you ? 'Siz g‘olibsiz! 🏆' : `${winner.name} g‘olib bo‘ldi!`;

  const heights = { 1: '170px', 2: '120px', 3: '86px' };
  const delays = { 1: '1s', 2: '0.6s', 3: '0.2s' };
  $('#podium').replaceChildren(
    ...[1, 0, 2]
      .filter((i) => ranked[i])
      .map((i) => {
        const p = ranked[i];
        const place = i + 1;
        return h(
          'div',
          { class: 'pod', 'data-place': place, style: { '--pc': p.color, '--h': heights[place], '--d': delays[place] } },
          h(
            'div',
            { class: 'pod-who' },
            h('span', { class: 'avatar pod-avatar', style: { '--pc': p.color } }, p.avatar, place === 1 ? h('span', { class: 'pod-crown' }, '👑') : null),
            h('span', { class: 'pod-name' }, p.name),
            h('span', { class: 'pod-title' }, PLACE_TITLES[i]),
            h('span', { class: 'pod-score' }, `${fmt(p.score)} ball`),
          ),
          h('div', { class: 'pod-pillar' }, place),
        );
      }),
  );

  const awards = [];
  const fastest = st.players.filter((p) => p.fastest !== null).sort((a, b) => a.fastest - b.fastest)[0];
  if (fastest) awards.push({ ico: '⚡', title: 'Eng tezkor', p: fastest, val: `${(fastest.fastest / 1000).toFixed(1).replace('.', ',')} soniyada topdi` });
  const streaker = [...st.players].sort((a, b) => b.bestStreak - a.bestStreak)[0];
  if (streaker && streaker.bestStreak >= 2) awards.push({ ico: '🔥', title: 'Eng uzun seriya', p: streaker, val: `${streaker.bestStreak} ta ketma-ket to‘g‘ri` });
  const sharp = [...st.players].sort((a, b) => b.correct - a.correct)[0];
  if (sharp && sharp.correct > 0) awards.push({ ico: '🦅', title: 'O‘tkir ko‘z', p: sharp, val: `${sharp.correct} / ${st.room.totalRounds} to‘g‘ri javob` });
  $('#awards').replaceChildren(
    ...awards.map((a, i) =>
      h(
        'div',
        { class: 'award', style: { '--i': i } },
        h('span', { class: 'award-ico' }, a.ico),
        h('div', {}, h('div', { class: 'award-title' }, a.title), h('div', { class: 'award-who' }, `${a.p.avatar} ${a.p.name}`), h('div', { class: 'award-val' }, a.val)),
      ),
    ),
  );

  $('#final-list').replaceChildren(...ranked.map((p, i) => boardRow(st, p, i + 1, p.score, i, { stats: true })));

  setTimeout(() => {
    if (S.view.finalKey !== key || S.screen !== 'final') return;
    confetti.cannons();
    sfx.fanfare();
  }, 1700);
  if (winner?.id === st.you) setTimeout(() => S.screen === 'final' && confetti.burst(), 2700);
}

// ——— Tarmoq xabarlari ———

function onState(st) {
  S.offset = st.now - Date.now();
  const prev = S.state;
  S.state = st;
  setInRoom(true);
  $('#room-chip-code').textContent = st.room.code;

  const phase = st.room.phase;
  showScreen(SCREEN_OF[phase]);

  const counting = phase === 'countdown';
  if (counting && el.countdown.hidden) S.view.cdIdx = null;
  el.countdown.hidden = !counting;

  if (phase === 'lobby') renderLobby(st);
  else if (SCREEN_OF[phase] === 'game') renderGame(st);
  else if (phase === 'board') renderBoard(st);
  else if (phase === 'final') renderFinal(st);

  if (phase === 'lobby' && prev && prev.room.phase === 'final') S.view = { lobbyCode: S.view.lobbyCode };
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
  history.replaceState(null, '', location.pathname);
  setInRoom(false);
  el.countdown.hidden = true;
  scene.clear();
  $('#invite').hidden = true;
  $('#form-home').classList.remove('invited');
  document.title = 'Bojxona Ustasi — do‘stlar bilan onlayn o‘yin';
  showScreen('home');
}

function leaveRoom() {
  const st = S.state;
  if (st && GAME_PHASES.includes(st.room.phase) && !confirm('O‘yindan chiqmoqchimisiz? To‘plangan ballaringiz saqlanmaydi.')) return;
  net.send({ t: 'leave' });
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

// ——— Har kadrda: taymer va ortga sanoq ———

function frame() {
  requestAnimationFrame(frame);
  const st = S.state;
  if (!st) return;
  const { phase, endsAt, phaseMs } = st.room;
  if (!endsAt || !phaseMs) return;
  const left = Math.max(0, endsAt - serverNow());
  if (phase === 'round') {
    el.timerBar.style.strokeDashoffset = TIMER_CIRC * (1 - left / phaseMs);
    const secs = Math.ceil(left / 1000);
    if (secs !== S.view.lastSec) {
      S.view.lastSec = secs;
      el.timerNum.textContent = secs;
      const urgent = secs <= 5;
      el.timer.classList.toggle('urgent', urgent);
      if (urgent && secs > 0 && !S.view.choice) sfx.tick();
    }
  } else if (phase === 'countdown') {
    const idx = Math.min(3, Math.floor((phaseMs - left) / (phaseMs / 4)));
    if (idx !== S.view.cdIdx) {
      S.view.cdIdx = idx;
      beatCountdown(idx);
    }
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

  $('#room-chip').addEventListener('click', () => copyInvite());
  $('#btn-copy').addEventListener('click', (e) => copyInvite(e.currentTarget));
  $('#btn-start').addEventListener('click', () => {
    unlockAudio();
    net.send({ t: 'start' });
  });
  $('#btn-again').addEventListener('click', () => net.send({ t: 'again' }));
  $('#btn-leave').addEventListener('click', leaveRoom);
  $('#btn-exit').addEventListener('click', leaveRoom);
  $('#btn-topbar-leave').addEventListener('click', leaveRoom);
  $('#btn-skip-reveal').addEventListener('click', () => net.send({ t: 'skip' }));
  $('#btn-skip-board').addEventListener('click', () => net.send({ t: 'skip' }));
  el.btnOk.addEventListener('click', () => choose('ok'));

  el.reactions.replaceChildren(
    ...REACTIONS.map((emoji) =>
      h(
        'button',
        {
          type: 'button',
          'aria-label': `Reaksiya: ${emoji}`,
          onclick: (e) => {
            unlockAudio();
            net.send({ t: 'react', emoji });
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
    if (!document.hidden && S.state) document.title = `${S.state.room.code} · Bojxona Ustasi`;
  });
  document.addEventListener('pointerdown', unlockAudio, { once: true });
}

initHome();
initChrome();
$('#tip-text').textContent = TIPS[tipIndex];
setInterval(rotateTip, 7000);
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

requestAnimationFrame(frame);
