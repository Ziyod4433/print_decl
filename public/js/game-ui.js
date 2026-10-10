// O‘yin ekrani: taxta, o‘yinchilar paneli, navbat va karta harakatlari, hisobot va jurnal

import { $, $$, h, avatarEl, syncList } from './dom.js';
import { createBoard } from './board.js';
import { cardEl } from './cards.js';
import { renderStatement } from './statement.js';
import { sfx } from './sound.js';
import { reducedMotion } from './fx.js';
import {
  PROFESSIONS,
  STOCKS,
  BONDS,
  RAT_BOARD,
  FAST_BOARD,
  passiveIncome,
  totalExpenses,
  monthlyCashflow,
  loanCapacity,
  roundUpToLoan,
  marketMatches,
  saleValue,
  money,
  signed,
  squareLabel,
} from './shared/rules.js';

const STEP_TEXT = {
  roll: 'zar tashlashi kutilmoqda',
  choose: 'bitim tanlamoqda',
  card: 'qaror qabul qilmoqda',
  charity: 'xayriya haqida o‘ylamoqda',
  end: 'navbatini yakunlamoqda',
};

export function createGameUI({ send, toast, confetti, serverNow }) {
  const board = createBoard($('#board'));
  const strip = $('#players-strip');
  const panel = $('#turn-panel');
  const stmtBox = $('#tab-statement');
  const logTab = $('#tab-log');
  const logBox = $('#log-list');
  const diceBox = $('#dice-stats');
  const spotlight = $('#spotlight');

  let st = null;
  let gameId = null;
  let animatedMove = 0;
  let seenLog = 0;
  let animating = false;
  let viewPid = null;
  let lastTurnSeq = null;
  let panelCardId = null;
  const qty = new Map();

  // ——— yordamchilar ———
  const metaOf = (id) => st.players.find((p) => p.id === id) || { id, name: 'O‘yinchi', avatar: '👤', color: '#94a3b8', connected: false };
  const fin = (id) => st.game.players.find((p) => p.id === id);
  const act = (action) => send({ t: 'act', action });

  function tokensData(override = {}) {
    return st.game.players.map((p) => ({ ...metaOf(p.id), track: p.track, pos: p.pos, ...(override[p.id] || {}) }));
  }

  board.onStep = (pos, track, last) => {
    const type = track === 'fast' ? FAST_BOARD[pos].type : RAT_BOARD[pos];
    if (type === 'payday' || type === 'cfday') sfx.coin();
    else if (!last) sfx.step();
  };

  // ——— tablar ———
  for (const tab of $$('.tabs [role="tab"]')) {
    tab.addEventListener('click', () => selectTab(tab.dataset.tab));
  }
  function selectTab(name) {
    for (const tab of $$('.tabs [role="tab"]')) tab.setAttribute('aria-selected', String(tab.dataset.tab === name));
    stmtBox.hidden = name !== 'statement';
    logTab.hidden = name !== 'log';
  }

  // ——— asosiy kirish nuqtasi ———
  function render(state) {
    st = state;
    const g = st.game;
    if (!g) return;
    if (st.room.gameId !== gameId) {
      gameId = st.room.gameId;
      animatedMove = g.turn?.move?.seq ?? 0;
      seenLog = g.log.at(-1)?.id ?? 0;
      viewPid = null;
      lastTurnSeq = null;
      panelCardId = null;
      qty.clear();
      logBox.replaceChildren();
      for (const e of g.log) addLogItem(e);
    }
    const mv = g.turn?.move;
    if (mv && mv.seq > animatedMove) {
      if (!animating) {
        animatedMove = mv.seq;
        animating = true;
        playMove(mv)
          .catch(() => {})
          .finally(() => {
            animating = false;
            draw();
            if (st.game.turn?.move && st.game.turn.move.seq > animatedMove) render(st);
          });
      }
      return;
    }
    if (animating) return;
    draw();
  }

  async function playMove(mv) {
    board.place(tokensData({ [mv.pid]: { track: mv.track, pos: mv.from } }), mv.pid);
    const meta = metaOf(mv.pid);
    panel.querySelector('.tp-actions')?.replaceChildren(h('p', { class: 'tp-wait' }, `🎲 ${mv.pid === st.you ? 'Siz' : meta.name} zar tashlamoqda…`));
    sfx.dice();
    await board.roll(mv.dice);
    board.setStatus(h('span', { class: 'dice-sum' }, mv.dice.length > 1 ? `${mv.dice.join(' + ')} = ${mv.steps}` : `${mv.steps}`));
    await board.hop({ ...meta, id: mv.pid }, mv.track, mv.from, mv.steps);
  }

  function draw() {
    const g = st.game;
    drawStrip();
    board.place(tokensData(), g.turn?.pid);
    board.markDreams(st.players);
    board.setPiles(g.decks);
    if (g.turn?.move) board.showDice(g.turn.move.dice);
    if (!g.turn?.move) board.setStatus(null);
    drawPanel();
    drawStatement();
    drawLog();
    notifyTurn();
  }

  // ——— o‘yinchilar paneli ———
  function drawStrip() {
    const g = st.game;
    syncList(
      strip,
      g.players,
      (p) => p.id,
      (p) =>
        h(
          'button',
          { type: 'button', class: 'pchip', onclick: () => showStatementOf(p.id) },
          h('span', { class: 'pchip-avatar' }),
          h('span', { class: 'pchip-body' }, h('span', { class: 'pchip-name' }), h('span', { class: 'pchip-money' }), h('span', { class: 'meter' }, h('i'))),
          h('span', { class: 'pchip-badges' }),
        ),
      (node, p) => {
        const meta = metaOf(p.id);
        const prof = PROFESSIONS.find((x) => x.id === p.profession);
        node.style.setProperty('--pc', meta.color);
        node.classList.toggle('active', g.turn?.pid === p.id);
        node.classList.toggle('me', p.id === st.you);
        node.classList.toggle('offline', !meta.connected);
        node.classList.toggle('fast', p.track === 'fast');
        node.classList.toggle('viewing', (viewPid || st.you) === p.id);
        const av = node.querySelector('.pchip-avatar');
        if (av.textContent !== meta.avatar) av.replaceChildren(avatarEl(meta));
        node.querySelector('.pchip-name').replaceChildren(...[meta.name, h('small', {}, ` ${prof.icon}`), p.id === st.you && h('em', {}, ' · siz')].filter(Boolean));
        const cf = p.track === 'fast' ? p.fast.income : monthlyCashflow(p);
        node.querySelector('.pchip-money').replaceChildren(money(p.cash), ' · ', h('span', { class: cf >= 0 ? 'good' : 'bad' }, `${signed(cf)}/oy`));
        const pct =
          p.track === 'fast'
            ? Math.min(100, ((p.fast.income - p.fast.start) / (p.fast.goal - p.fast.start)) * 100)
            : Math.min(100, (passiveIncome(p) / Math.max(1, totalExpenses(p))) * 100);
        node.querySelector('.meter i').style.width = `${Math.max(0, pct)}%`;
        node.title = `${meta.name}: ${prof.title}. ${p.track === 'fast' ? 'Tezkor yo‘lda' : `Erkinlikka ${Math.round(pct)}%`}. Hisobotni ko‘rish uchun bosing.`;
        node.querySelector('.pchip-badges').replaceChildren(
          ...[
            p.track === 'fast' && h('span', { title: 'Tezkor yo‘lda' }, '🚀'),
            p.skipTurns > 0 && h('span', { title: `${p.skipTurns} navbat tanaffus` }, `💤${p.skipTurns}`),
            p.charityTurns > 0 && h('span', { title: 'Xayriya: 2 ta zar' }, '🤝'),
            p.children > 0 && h('span', { title: `${p.children} farzand` }, `👶${p.children > 1 ? p.children : ''}`),
            g.turn?.pid === p.id && h('span', { class: 'turn-dot', title: 'Navbat' }),
          ].filter(Boolean),
        );
      },
    );
  }

  function showStatementOf(id) {
    viewPid = id === st.you ? null : id;
    selectTab('statement');
    drawStatement();
    drawStrip();
    if (window.innerWidth < 1000) $('.info-panel').scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
  }

  // ——— navbat paneli ———
  function drawPanel() {
    const g = st.game;
    const t = g.turn;
    if (!t) return panel.replaceChildren();
    const mine = t.pid === st.you;
    const meta = metaOf(t.pid);
    const p = fin(t.pid);

    let head = panel.querySelector('.tp-head');
    let cardBox = panel.querySelector('.tp-card');
    let actions = panel.querySelector('.tp-actions');
    let timer = panel.querySelector('.tp-timer');
    if (!head) {
      head = h('div', { class: 'tp-head' });
      timer = h('div', { class: 'tp-timer' }, h('i'));
      cardBox = h('div', { class: 'tp-card' });
      actions = h('div', { class: 'tp-actions' });
      panel.replaceChildren(head, timer, cardBox, actions);
    }
    panel.classList.toggle('mine', mine);
    panel.style.setProperty('--pc', meta.color);
    head.replaceChildren(
      avatarEl(meta),
      h(
        'div',
        { class: 'tp-who' },
        h('div', { class: 'tp-title' }, mine ? 'Sizning navbatingiz!' : `Navbat: ${meta.name}`),
        h('div', { class: 'tp-sub' }, `${p.track === 'fast' ? '🚀 Tezkor yo‘l' : '🐀 Kalamush poygasi'} · «${squareLabel(p.track, p.pos)}»`),
      ),
    );
    timer.hidden = !g.deadline;
    timer.dataset.until = g.deadline || '';

    if (t.card?.id !== panelCardId) {
      panelCardId = t.card?.id ?? null;
      if (t.card) {
        const el = cardEl(t.card, { me: fin(st.you), players: st.players });
        el.classList.add('flip-in');
        cardBox.replaceChildren(el);
        if (['small', 'big', 'market', 'doodad'].includes(t.card.deck)) board.drawFrom(t.card.deck);
        sfx.flip();
      } else cardBox.replaceChildren();
    }
    actions.replaceChildren(...buildActions(g, t, mine, p, meta));
  }

  const btn = (label, onclick, cls = 'btn-primary', extra = {}) => h('button', { type: 'button', class: `btn ${cls}`, onclick, ...extra }, label);

  function endButton(t, label = 'Navbatni tugatish ➜') {
    const card = t.card;
    const pending = card?.eligible ? card.eligible.filter((id) => id !== st.you && !card.responders.includes(id) && st.game.players.some((p) => p.id === id)) : [];
    const b = btn(label, () => act({ type: 'end' }), 'btn-primary btn-end');
    if (pending.length && t.step === 'card') {
      b.dataset.until = card.waitUntil;
      b.dataset.label = label;
      b.title = `Kutilmoqda: ${pending.map((id) => metaOf(id).name).join(', ')}`;
    }
    return b;
  }

  function qtyStepper(key, initial, max, onChange) {
    if (!qty.has(key)) qty.set(key, Math.max(1, Math.min(initial, max || 1)));
    const val = h('input', { class: 'qty-input', type: 'number', min: '1', max: String(max), inputmode: 'numeric', value: String(qty.get(key)), 'aria-label': 'Soni' });
    const set = (v) => {
      const n = Math.max(1, Math.min(max || 1, Math.floor(Number(v) || 1)));
      qty.set(key, n);
      val.value = String(n);
      onChange(n);
    };
    val.addEventListener('change', () => set(val.value));
    const wrap = h(
      'div',
      { class: 'qty' },
      h('button', { type: 'button', onclick: () => set(qty.get(key) - (qty.get(key) > 100 ? 100 : qty.get(key) > 10 ? 10 : 1)) }, '−'),
      val,
      h('button', { type: 'button', onclick: () => set(qty.get(key) + (qty.get(key) >= 100 ? 100 : qty.get(key) >= 10 ? 10 : 1)) }, '+'),
      h('button', { type: 'button', class: 'qty-max', onclick: () => set(max) }, 'Maks'),
    );
    queueMicrotask(() => onChange(qty.get(key)));
    return wrap;
  }

  // Sotib olish tugmasi: pul yetmasa — bankdan qarz olib sotib olish taklifi
  function buyButton(me, cost, label, action) {
    if (cost <= me.cash) return btn(`${label} — ${money(cost)}`, () => act(action), 'btn-secondary');
    const need = roundUpToLoan(cost - me.cash);
    if (me.track === 'rat' && need <= loanCapacity(me)) {
      return btn(`🏦 ${money(need)} qarz olib, ${label.toLowerCase()}`, () => act({ ...action, borrow: true }), 'btn-secondary', { title: `Oylik to‘lov ${money(need / 10)} ga oshadi` });
    }
    return btn(`${label} — ${money(cost)}`, () => {}, 'btn-secondary', { disabled: true, title: 'Naqd pul yetmaydi' });
  }

  function sellControls(card, me, isActive) {
    const out = [];
    if (card.kind === 'stock' || card.kind === 'gold') {
      const a = card.kind === 'stock' ? me.assets.find((x) => x.kind === 'stock' && x.symbol === card.symbol) : me.assets.find((x) => x.kind === 'gold');
      const have = a ? (card.kind === 'stock' ? a.shares : a.count) : 0;
      if (!have) return out;
      const avg = Math.round(a.cost / have);
      const info = h('span', { class: 'qty-total' });
      const sellBtn = btn('Sotish', () => act({ type: 'sell', qty: qty.get(`sell:${card.id}`) }), 'btn-ghost');
      out.push(
        h(
          'div',
          { class: 'trade sell' },
          h('div', { class: 'trade-title' }, `Sizda ${have} ta · o‘rtacha ${money(avg)} — ${card.price > avg ? '📈 foyda' : card.price < avg ? '📉 zarar' : 'teng'}`),
          qtyStepper(`sell:${card.id}`, have, have, (n) => {
            info.textContent = `+${money(n * card.price)}`;
            sellBtn.textContent = `Sotish ${n} ta`;
          }),
          h('div', { class: 'trade-row' }, info, sellBtn),
        ),
      );
      return out;
    }
    const assets = me.assets.filter((a) => marketMatches(card, a));
    for (const a of assets) {
      const value = saleValue(card, a);
      const net = value - (a.mortgage || 0);
      out.push(
        h(
          'div',
          { class: 'trade sell-asset' },
          h('div', {}, h('b', {}, `${a.icon} ${a.title}`), h('small', {}, ` · siz ${money(a.cost)} ga olgansiz, ipoteka ${money(a.mortgage || 0)}`)),
          btn(`Sotish — qo‘lga ${money(net)}`, () => act({ type: 'sell', assetId: a.id }), net >= 0 ? 'btn-secondary' : 'btn-ghost'),
        ),
      );
    }
    return out;
  }

  function buildActions(g, t, mine, p, meta) {
    const me = fin(st.you);
    const card = t.card;
    const out = [];

    // Boshqa o‘yinchining navbatida: aksiya/mulk sotish imkoniyati
    if (!mine) {
      if (card?.eligible?.includes(st.you) && me.track === 'rat' && t.step === 'card') {
        const responded = card.responders.includes(st.you);
        out.push(h('p', { class: 'tp-note good' }, '💡 Sizda mos aktiv bor — hozir sotishingiz mumkin!'));
        out.push(...sellControls(card, me, false));
        if (!responded) out.push(btn('Men sotmayman', () => act({ type: 'pass' }), 'btn-ghost btn-sm'));
      }
      out.push(h('p', { class: 'tp-wait' }, `${meta.name} ${STEP_TEXT[t.step] || ''}`, h('span', { class: 'dots' }, h('i'), h('i'), h('i'))));
      return out;
    }

    switch (t.step) {
      case 'roll': {
        if (p.track === 'rat' && p.charityTurns > 0) {
          out.push(h('p', { class: 'tp-note' }, `🤝 Xayriya tufayli 1 yoki 2 ta zar tanlashingiz mumkin (yana ${p.charityTurns} navbat).`));
          out.push(h('div', { class: 'btn-row' }, btn('🎲 1 ta zar', () => act({ type: 'roll', dice: 1 }), 'btn-ghost btn-lg'), btn('🎲🎲 2 ta zar', () => act({ type: 'roll', dice: 2 }), 'btn-primary btn-lg btn-pulse')));
        } else {
          out.push(btn(p.track === 'fast' ? '🎲🎲 Zar tashlash' : '🎲 Zar tashlash', () => act({ type: 'roll', dice: 1 }), 'btn-primary btn-lg btn-pulse btn-block'));
        }
        if (p.track === 'rat') out.push(h('p', { class: 'tp-hint' }, 'Zar tashlashdan oldin bankdan qarz olishingiz yoki qarzlarni yopishingiz mumkin («Hisobot» bo‘limida).'));
        return out;
      }
      case 'choose':
        out.push(h('p', { class: 'tp-note' }, '💡 Imkoniyat! Qaysi bitimni ko‘rasiz?'));
        out.push(
          h(
            'div',
            { class: 'deal-choice' },
            h('button', { type: 'button', class: 'deal small', onclick: () => act({ type: 'deal', size: 'small' }) }, h('span', { class: 'deal-ico' }, '💡'), h('b', {}, 'Kichik bitim'), h('small', {}, '$5 000 gacha: aksiya, kvartira, kichik biznes')),
            h('button', { type: 'button', class: 'deal big', onclick: () => act({ type: 'deal', size: 'big' }) }, h('span', { class: 'deal-ico' }, '🏢'), h('b', {}, 'Katta bitim'), h('small', {}, '$6 000 dan: ko‘p xonadonli uylar, biznes')),
          ),
        );
        out.push(h('p', { class: 'tp-hint' }, `Naqd pulingiz: ${money(p.cash)}${p.track === 'rat' ? ` · bank yana ${money(loanCapacity(p))} bera oladi` : ''}`));
        out.push(btn('Bitimdan voz kechish', () => act({ type: 'end' }), 'btn-text'));
        return out;
      case 'charity':
        out.push(
          h(
            'div',
            { class: 'btn-row' },
            buyButton(p, card.amount, '🤝 Xayriya qilish', { type: 'charity', accept: true }),
            btn('Yo‘q, rahmat', () => act({ type: 'charity', accept: false }), 'btn-ghost'),
          ),
        );
        return out;
    }

    // step: card | end
    if (card && t.step === 'card') {
      if (card.kind === 'stock' || card.kind === 'gold' || card.kind === 'bond') {
        const maxAfford = Math.max(1, Math.floor((p.cash + loanCapacity(p)) / card.price));
        const total = h('span', { class: 'qty-total' });
        const holder = h('div');
        const trade = h(
          'div',
          { class: 'trade buy' },
          h('div', { class: 'trade-title' }, `Sotib olish: ${card.kind === 'stock' ? `${card.symbol} aksiyasi` : card.kind === 'bond' ? BONDS[card.symbol].name.toLowerCase() : 'oltin tanga'} ${money(card.price)} dan`),
          qtyStepper(`buy:${card.id}`, Math.max(1, Math.floor(p.cash / card.price / 2)), maxAfford, (n) => {
            total.textContent = `Jami: ${money(n * card.price)}`;
            holder.replaceChildren(buyButton(p, n * card.price, `Sotib olish ${n} ta`, { type: 'buy', qty: n }));
          }),
          h('div', { class: 'trade-row' }, total, holder),
        );
        out.push(trade);
        out.push(...sellControls(card, p, true));
      } else if (['realestate', 'business', 'land', 'startup'].includes(card.kind)) {
        if (t.bought) out.push(h('p', { class: 'tp-note good' }, '✅ Sotib olindi! Aktiv hisobotingizga qo‘shildi.'));
        else {
          if (card.cashflow < 0) out.push(h('p', { class: 'tp-note bad' }, '⚠️ Bu aktiv har oy pul yeydi — oylik pul oqimingiz kamayadi.'));
          out.push(h('div', { class: 'btn-row' }, buyButton(p, card.down, 'Sotib olish', { type: 'buy' }), btn('Rad etish', () => act({ type: 'end' }), 'btn-ghost')));
          return out;
        }
      } else if (card.eligible) {
        const mineSell = sellControls(card, p, true);
        if (mineSell.length) out.push(h('p', { class: 'tp-note good' }, '💡 Sizda mos aktiv bor — sotasizmi?'), ...mineSell);
        else out.push(h('p', { class: 'tp-note' }, 'Sizda bu taklifga mos aktiv yo‘q.'));
      } else if (card.kind === 'fastBusiness') {
        if (t.bought) out.push(h('p', { class: 'tp-note good' }, '✅ Biznes sotib olindi!'));
        else {
          out.push(h('div', { class: 'btn-row' }, buyButton(p, card.cost, 'Sotib olish', { type: 'buy' }), btn('O‘tkazib yuborish', () => act({ type: 'end' }), 'btn-ghost')));
          return out;
        }
      } else if (card.kind === 'dream' && card.mine) {
        out.push(h('div', { class: 'btn-row' }, buyButton(p, card.cost, '🏆 Orzuni sotib olish', { type: 'buy' }), btn('Keyinroq', () => act({ type: 'end' }), 'btn-ghost')));
        return out;
      } else if (card.kind === 'gamble') {
        out.push(
          h('div', { class: 'btn-row' }, buyButton(p, card.stake, '🎲 Tavakkal qilish', { type: 'gamble', accept: true }), btn('Yo‘q', () => act({ type: 'gamble', accept: false }), 'btn-ghost')),
        );
        return out;
      }
    }
    if (t.gamble) out.push(h('p', { class: `tp-note ${t.gamble.won ? 'good' : 'bad'}` }, `🎲 Zar: ${t.gamble.die} — ${t.gamble.won ? 'omad kuldi! 🎉' : 'bu safar omad kulmadi'}`));
    out.push(endButton(t));
    return out;
  }

  // ——— hisobot ———
  function drawStatement() {
    const id = viewPid && fin(viewPid) ? viewPid : st.you;
    if (!fin(id)) return;
    const t = st.game.turn;
    renderStatement(stmtBox, {
      player: fin(id),
      meta: metaOf(id),
      isMe: id === st.you,
      canAct: t?.pid === st.you && !st.game.over,
      onAction: act,
      onBack: id !== st.you ? () => showStatementOf(st.you) : null,
    });
  }

  // ——— jurnal va effektlar ———
  function addLogItem(e) {
    const item = h('div', { class: `log-item kind-${e.kind || 'info'}` }, h('span', { class: 'li-ico' }, e.icon || '•'), h('span', { class: 'li-text' }, e.text));
    if (e.pid) item.style.setProperty('--pc', metaOf(e.pid).color);
    logBox.prepend(item);
    while (logBox.childElementCount > 80) logBox.lastElementChild.remove();
  }

  // Zarlar statistikasi: har bir son necha marta tushgani — halollikni har kim o‘zi ko‘rsin
  function drawDiceStats() {
    const counts = st.game.dice || [0, 0, 0, 0, 0, 0];
    const total = counts.reduce((a, b) => a + b, 0);
    const max = Math.max(1, ...counts);
    diceBox.replaceChildren(
      h('div', { class: 'ds-head' }, h('b', {}, '🎲 Zarlar statistikasi'), h('span', {}, total ? `${total} ta tashlash` : 'hali tashlanmadi')),
      h(
        'div',
        { class: 'ds-bars' },
        ...counts.map((c, i) =>
          h(
            'div',
            { class: 'ds-col', title: `${i + 1}: ${c} marta${total ? ` (${Math.round((c / total) * 100)}%)` : ''}` },
            h('span', { class: 'ds-count' }, String(c)),
            h('span', { class: 'ds-bar' }, h('i', { style: { height: `${(c / max) * 100}%` } })),
            h('span', { class: 'ds-face' }, ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][i]),
          ),
        ),
      ),
      h('p', { class: 'ds-note' }, 'Zarlar serverda kriptografik tasodifiy generator bilan tashlanadi: har bir son ehtimoli 1/6, natijani hech kim oldindan bila olmaydi va o‘zgartira olmaydi. Tashlashlar ko‘paygan sari ustunlar tenglashadi.'),
    );
  }

  function drawLog() {
    drawDiceStats();
    const fresh = st.game.log.filter((e) => e.id > seenLog);
    if (!fresh.length) return;
    seenLog = fresh.at(-1).id;
    const played = new Set();
    const sound = (kind, fn) => {
      if (!played.has(kind)) {
        played.add(kind);
        fn();
      }
    };
    for (const e of fresh) {
      addLogItem(e);
      if (e.pid && e.amount) floatMoney(e.pid, e.amount);
      switch (e.kind) {
        case 'payday':
          sound('coin', sfx.kaching);
          break;
        case 'buy':
          sound('buy', sfx.buy);
          break;
        case 'sell':
          sound('sell', sfx.kaching);
          break;
        case 'doodad':
        case 'expense':
        case 'loss':
          sound('spend', sfx.spend);
          break;
        case 'baby':
          sound('baby', sfx.baby);
          celebrate(e.pid, '👶');
          break;
        case 'downsized':
        case 'bankrupt':
          sound('down', sfx.down);
          break;
        case 'charity':
          sound('charity', sfx.charity);
          celebrate(e.pid, '💖');
          break;
        case 'escape':
          sound('fanfare', sfx.fanfare);
          showSpotlight(e.pid, '🚀', `${metaOf(e.pid).name} kalamush poygasidan chiqdi!`, 'Passiv daromad xarajatlardan oshdi — endi tezkor yo‘l!');
          confetti.cannons();
          break;
        case 'gamble':
          sound('gamble', e.amount > 0 ? sfx.correct : sfx.wrong);
          break;
      }
    }
  }

  function floatMoney(pid, amount) {
    const chip = strip.querySelector(`[data-key="${pid}"]`);
    if (!chip) return;
    const el = h('span', { class: `money-float ${amount >= 0 ? 'good' : 'bad'}` }, signed(amount));
    chip.append(el);
    setTimeout(() => el.remove(), 1700);
    chip.classList.remove(amount >= 0 ? 'gain' : 'lose');
    void chip.offsetWidth;
    chip.classList.add(amount >= 0 ? 'gain' : 'lose');
  }

  function celebrate(pid, emoji) {
    const chip = strip.querySelector(`[data-key="${pid}"]`);
    if (!chip || reducedMotion()) return;
    for (let i = 0; i < 6; i++) {
      const el = h('span', { class: 'chip-burst', style: { '--dx': `${(Math.random() - 0.5) * 120}px`, '--d': `${i * 0.08}s` } }, emoji);
      chip.append(el);
      setTimeout(() => el.remove(), 1600);
    }
  }

  function showSpotlight(pid, icon, title, sub) {
    const meta = metaOf(pid);
    spotlight.replaceChildren(
      h('div', { class: 'spot-card', style: { '--pc': meta.color } }, h('div', { class: 'spot-icon' }, icon), avatarEl(meta), h('h3', {}, title), h('p', {}, sub)),
    );
    spotlight.hidden = false;
    clearTimeout(showSpotlight.t);
    showSpotlight.t = setTimeout(() => (spotlight.hidden = true), 3600);
  }
  spotlight.addEventListener('click', () => (spotlight.hidden = true));

  function notifyTurn() {
    const t = st.game.turn;
    if (!t || t.seq === lastTurnSeq) return;
    const first = lastTurnSeq === null;
    lastTurnSeq = t.seq;
    if (t.pid === st.you && !st.game.over) {
      if (!first) {
        sfx.turn();
        toast('Sizning navbatingiz!', '🎲', 'good');
      }
      if (document.hidden) document.title = '🎲 Sizning navbatingiz! · Pul Oqimi';
      navigator.vibrate?.(40);
    }
  }

  // Har yarim soniyada: navbat taymeri va «kutish» tugmalari
  setInterval(() => {
    if (!st?.game) return;
    const now = serverNow();
    const timer = panel.querySelector('.tp-timer');
    if (timer && !timer.hidden && timer.dataset.until) {
      const left = Math.max(0, Number(timer.dataset.until) - now);
      timer.firstElementChild.style.width = `${Math.min(100, (left / ((st.room.settings.turnSeconds || 15) * 1000)) * 100)}%`;
      timer.classList.toggle('urgent', left < 10000);
    }
    for (const b of panel.querySelectorAll('[data-until].btn-end')) {
      const left = Math.ceil((Number(b.dataset.until) - now) / 1000);
      b.disabled = left > 0;
      b.textContent = left > 0 ? `${b.dataset.label} (${left})` : b.dataset.label;
    }
  }, 500);

  return {
    render,
    reset() {
      gameId = null;
      st = null;
      animating = false;
      panel.replaceChildren();
      strip.replaceChildren();
    },
    board,
  };
}
