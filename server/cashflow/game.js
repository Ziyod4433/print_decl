// «Pul Oqimi» o‘yin dvigateli: barcha qoidalar shu yerda, server hakam vazifasini bajaradi.

import crypto from 'node:crypto';

import {
  RAT_BOARD,
  FAST_BOARD,
  DREAMS,
  PROFESSIONS,
  STOCKS,
  BONDS,
  LIABILITY_KEYS,
  LIABILITY_LABELS,
  LOAN_STEP,
  MAX_CHILDREN,
  CHARITY_TURNS,
  DOWNSIZE_TURNS,
  FAST_MULT,
  FAST_GOAL,
  SHARED_WINDOW_MS,
  INVEST_STEP,
  RISKY_NEED,
  AUDIT_SHARE,
  ILLEGAL_TURNS,
  SQUARES,
  passiveIncome,
  totalIncome,
  totalExpenses,
  monthlyCashflow,
  loanCapacity,
  charityAmount,
  roundUpToLoan,
  canEscape,
  marketMatches,
  saleValue,
  investIncome,
  doodadCost,
  money,
  signed,
  squareLabel,
} from '../../public/js/shared/rules.js';
import { SMALL_DEALS, BIG_DEALS, MARKET, DOODADS, BIG_DOODADS, STOCK_MARKET, INVESTORS } from './cards.js';

const LOG_LIMIT = 80;
const TRADE_WINDOW_MS = 15000; // «Bozor: aksiyalar» — hamma sotib olishi va sotishi uchun

export const GAME_ERRORS = {
  NOT_YOUR_TURN: 'Hozir sizning navbatingiz emas.',
  BAD_STEP: 'Bu amalni hozir bajarib bo‘lmaydi.',
  NO_CASH: 'Naqd pul yetarli emas.',
  LOAN_LIMIT: 'Bank bunchalik qarz bera olmaydi — oylik pul oqimingiz manfiy bo‘lib qolardi.',
  WAIT_OTHERS: 'Boshqa o‘yinchilar sotishga ulgurishsin — biroz kuting.',
  NOT_ELIGIBLE: 'Sizda bu kartaga mos aktiv yo‘q.',
  NOT_YOUR_DREAM: 'Bu sizning orzuingiz emas.',
  OVER: 'O‘yin tugagan.',
  BAD_REQUEST: 'Noto‘g‘ri so‘rov.',
};

export class GameError extends Error {
  constructor(code) {
    super(GAME_ERRORS[code] || code);
    this.code = code;
  }
}

const fail = (code) => {
  throw new GameError(code);
};

const posInt = (v, max = Infinity) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1 || n > max) fail('BAD_REQUEST');
  return n;
};

export class Game {
  // rng — faqat testlar uchun (0..1 qaytaruvchi funksiya). O‘yinda zarlar va kartalar
  // kriptografik tasodifiy generator (crypto.randomInt) bilan aniqlanadi: natijani
  // oldindan bilib yoki o‘zgartirib bo‘lmaydi, har bir qiymat ehtimoli teng.
  constructor({ players, mode = 'full', rng = null, now = Date.now, nameOf = (id) => id }) {
    this.mode = mode === 'quick' ? 'quick' : 'full';
    this.rng = rng;
    this.diceStats = [0, 0, 0, 0, 0, 0];
    this.now = now;
    this.nameOf = nameOf;
    this.players = new Map();
    this.order = [];
    this.log = [];
    this.seq = { log: 0, asset: 0, card: 0, move: 0, turn: 0 };
    this.winner = null;
    this.winReason = null;
    this.over = false;
    this.turn = null;
    this.decks = {
      small: this._deck(SMALL_DEALS),
      big: this._deck(BIG_DEALS),
      investor: this._deck(INVESTORS),
      stocks: this._deck(STOCK_MARKET),
      market: this._deck(MARKET),
      doodad: this._deck(DOODADS),
      bigDoodad: this._deck(BIG_DOODADS),
    };
    this.professionBag = this._shuffle(PROFESSIONS.map((p) => p.id));
    this._log({ icon: '🎬', text: 'O‘yin boshlandi! Har kim o‘z kasbi bilan kalamush poygasini boshlaydi.' });
    for (const p of players) this.addPlayer(p, true);
    this._startTurn(this.order[0]);
  }

  // ——— yordamchilar ———

  // 0..n-1 oralig‘ida teng ehtimolli butun son
  _int(n) {
    return this.rng ? Math.floor(this.rng() * n) : crypto.randomInt(n);
  }

  // Fisher–Yates: har bir tartib teng ehtimolli
  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this._int(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  _deck(cards) {
    return { draw: this._shuffle(cards.map((c) => ({ ...c }))), discard: [] };
  }

  _draw(name) {
    const d = this.decks[name];
    if (!d.draw.length) {
      d.draw = this._shuffle(d.discard);
      d.discard = [];
    }
    return { ...d.draw.pop(), deck: name, id: `k${++this.seq.card}` };
  }

  _discard(card) {
    if (!card || !this.decks[card.deck]) return;
    const { id, deck, eligible, responders, openedAt, trade, windowMs, ...template } = card;
    this.decks[card.deck].discard.push(template);
  }

  _die() {
    const value = 1 + this._int(6);
    this.diceStats[value - 1]++;
    return value;
  }

  _log(entry) {
    this.log.push({ id: ++this.seq.log, ...entry });
    if (this.log.length > LOG_LIMIT) this.log.shift();
  }

  _name(p) {
    return this.nameOf(p.id);
  }

  _nextId(id) {
    const i = this.order.indexOf(id);
    return this.order[(i + 1) % this.order.length];
  }

  // ——— o‘yinchilar ———

  addPlayer({ id, dream }, initial = false) {
    if (this.players.has(id) || this.over) return;
    if (!this.professionBag.length) this.professionBag = this._shuffle(PROFESSIONS.map((p) => p.id));
    const profId = this.professionBag.pop();
    const prof = PROFESSIONS.find((x) => x.id === profId);
    const p = {
      id,
      profession: prof.id,
      dream: DREAMS.some((d) => d.id === dream) ? dream : DREAMS[this._int(DREAMS.length)].id,
      salary: prof.salary,
      expenses: { ...prof.expenses },
      perChild: prof.perChild,
      children: 0,
      liabilities: { ...prof.liabilities },
      bankLoan: 0,
      cash: 0,
      assets: [],
      track: 'rat',
      pos: 0,
      charityTurns: 0,
      skipTurns: 0,
      fast: null,
      stats: { paydays: 0, deals: 0, donated: 0, bankrupt: 0, sold: 0 },
    };
    p.cash = prof.savings + monthlyCashflow(p);
    this.players.set(id, p);
    this.order.push(id);
    this._log({
      pid: id,
      kind: initial ? 'profession' : 'join',
      icon: prof.icon,
      text: `${this._name(p)} — ${prof.title}: maosh ${money(prof.salary)}, oylik pul oqimi ${signed(monthlyCashflow(p))}`,
    });
  }

  removePlayer(id) {
    if (!this.players.has(id)) return;
    const wasTurn = this.turn?.pid === id;
    const next = this.order.length > 1 ? this._nextId(id) : null;
    this.players.delete(id);
    this.order = this.order.filter((x) => x !== id);
    if (!this.order.length) {
      this.over = true;
      this.turn = null;
      return;
    }
    if (wasTurn && !this.over) {
      this._discard(this.turn.card);
      this._startTurn(next);
    }
    if (this.turn?.card?.eligible) this.turn.card.eligible = this.turn.card.eligible.filter((x) => x !== id);
  }

  // ——— navbat ———

  _startTurn(pid) {
    let id = pid;
    for (let guard = 0; guard < 100; guard++) {
      const p = this.players.get(id);
      if (p.skipTurns > 0) {
        p.skipTurns--;
        this._log({ pid: id, kind: 'skip', icon: '💤', text: `${this._name(p)} navbatni o‘tkazib yuboradi${p.skipTurns ? ` (yana ${p.skipTurns} ta)` : ''}` });
        id = this._nextId(id);
        continue;
      }
      break;
    }
    const p = this.players.get(id);
    this.turn = { pid: id, seq: ++this.seq.turn, step: 'roll', move: null, card: null, bought: false, gamble: null };
    if (canEscape(p)) this._escape(p);
  }

  _endTurn() {
    if (this.over) return;
    this._discard(this.turn.card);
    this._startTurn(this._nextId(this.turn.pid));
  }

  _escape(p) {
    const passive = passiveIncome(p);
    if (this.mode === 'quick') {
      this._log({ pid: p.id, kind: 'escape', icon: '🚀', text: `${this._name(p)} kalamush poygasidan chiqdi: passiv daromad ${money(passive)} xarajatlardan oshdi!` });
      this._win(p, 'escape');
      return;
    }
    const income = passive * FAST_MULT;
    p.track = 'fast';
    p.pos = 0;
    p.charityTurns = 0;
    p.fast = { income, start: income, goal: income + FAST_GOAL };
    p.cash += income;
    this._log({
      pid: p.id,
      kind: 'escape',
      icon: '🚀',
      amount: income,
      text: `${this._name(p)} kalamush poygasidan chiqdi! Tezkor yo‘lda har «Pul oqimi kuni» ${money(income)} oladi`,
    });
  }

  _win(p, reason) {
    this.winner = p.id;
    this.winReason = reason;
    this.over = true;
    const text =
      reason === 'dream'
        ? `${this._name(p)} orzusini amalga oshirdi va g‘olib bo‘ldi! 🏆`
        : reason === 'income'
          ? `${this._name(p)} oylik pul oqimini ${money(FAST_GOAL)} ga oshirdi va g‘olib bo‘ldi! 🏆`
          : `${this._name(p)} birinchi bo‘lib moliyaviy erkinlikka erishdi va g‘olib bo‘ldi! 🏆`;
    this._log({ pid: p.id, kind: 'win', icon: '🏆', text });
  }

  // ——— amallar ———

  act(pid, action) {
    if (this.over) fail('OVER');
    const p = this.players.get(pid);
    if (!p || !action || typeof action.type !== 'string') fail('BAD_REQUEST');
    const t = this.turn;
    const mine = t.pid === pid;
    const ownTurn = () => mine || fail('NOT_YOUR_TURN');
    const step = (...steps) => steps.includes(t.step) || fail('BAD_STEP');

    switch (action.type) {
      case 'roll':
        ownTurn() && step('roll');
        return this._roll(p, action.dice);
      case 'deal':
        ownTurn() && step('choose');
        return this._deal(p, action.size === 'big' ? 'big' : 'small');
      case 'buy':
        // «Bozor: aksiyalar»da boshqa o‘yinchilar ham sotib oladi
        if (!mine && !(t.card?.trade && t.step === 'card' && p.track === 'rat')) fail('NOT_YOUR_TURN');
        step('card');
        return this._buy(p, action);
      case 'sell':
        step('card');
        return this._sell(p, action);
      case 'pass':
        return this._pass(p);
      case 'charity':
        ownTurn() && step('charity');
        return this._charity(p, !!action.accept, !!action.borrow);
      case 'forfeit':
        ownTurn() && step('forfeit');
        return this._forfeit(p, p.assets.find((a) => a.id === action.assetId && a.kind === 'fast') || fail('BAD_REQUEST'));
      case 'loan':
        ownTurn();
        return this._takeLoan(p, action.amount);
      case 'repay':
        ownTurn();
        return this._repay(p, action.amount);
      case 'payoff':
        ownTurn();
        return this._payoff(p, action.liability);
      case 'end':
        ownTurn() && step('choose', 'card', 'charity', 'end');
        return this._tryEnd(p);
      default:
        fail('BAD_REQUEST');
    }
  }

  // Navbat vaqti tugasa yoki o‘yinchi uzilib qolsa — avtomatik harakat
  timeout() {
    if (this.over || !this.turn) return;
    const t = this.turn;
    const p = this.players.get(t.pid);
    if (t.step === 'roll') {
      this._log({ pid: p.id, kind: 'timeout', icon: '⏱️', text: `${this._name(p)} uchun zar avtomatik tashlandi` });
      this._roll(p, 1);
      return;
    }
    if (t.step === 'forfeit') {
      const cheapest = p.assets.filter((a) => a.kind === 'fast').sort((x, y) => x.cashflow - y.cashflow)[0];
      if (cheapest) this._forfeit(p, cheapest);
    }
    this._log({ pid: p.id, kind: 'timeout', icon: '⏱️', text: `${this._name(p)}: vaqt tugadi — navbat keyingi o‘yinchiga o‘tdi` });
    this._endTurn();
  }

  _roll(p, wanted) {
    const t = this.turn;
    let count = p.track === 'fast' ? 2 : 1;
    if (p.track === 'rat' && p.charityTurns > 0) {
      count = Number(wanted) === 2 ? 2 : 1;
      p.charityTurns--;
    }
    const dice = Array.from({ length: count }, () => this._die());
    const steps = dice.reduce((a, b) => a + b, 0);
    const board = p.track === 'fast' ? FAST_BOARD : RAT_BOARD;
    const from = p.pos;
    let paydays = 0;
    for (let i = 1; i <= steps; i++) {
      const sq = board[(from + i) % board.length];
      const type = typeof sq === 'string' ? sq : sq.type;
      if (type === 'payday' || type === 'cfday') paydays++;
    }
    p.pos = (from + steps) % board.length;
    t.move = { seq: ++this.seq.move, pid: p.id, track: p.track, from, to: p.pos, steps, dice };
    this._log({ pid: p.id, kind: 'roll', icon: '🎲', text: `${this._name(p)}: ${dice.join(' + ')} → «${squareLabel(p.track, p.pos)}»` });
    for (let i = 0; i < paydays && !this.over; i++) this._payday(p);
    if (!this.over) this._land(p);
  }

  _payday(p) {
    if (p.track === 'fast') {
      p.cash += p.fast.income;
      this._log({ pid: p.id, kind: 'payday', icon: '💸', amount: p.fast.income, text: `${this._name(p)}: Pul oqimi kuni — ${signed(p.fast.income)}` });
      return;
    }
    const cf = monthlyCashflow(p);
    p.stats.paydays++;
    if (cf >= 0) {
      p.cash += cf;
      this._log({ pid: p.id, kind: 'payday', icon: '💰', amount: cf, text: `${this._name(p)} maosh oldi: ${signed(cf)}` });
    } else {
      this._log({ pid: p.id, kind: 'payday', icon: '⚠️', amount: cf, text: `${this._name(p)}: oylik pul oqimi manfiy — ${money(cf)}` });
      this._charge(p, -cf);
    }
  }

  _land(p) {
    const t = this.turn;
    if (p.track === 'fast') return this._landFast(p);
    switch (RAT_BOARD[p.pos]) {
      case 'opportunity':
        t.step = 'choose';
        return;
      case 'investor': {
        const card = this._draw('investor');
        t.card = card;
        t.step = 'card';
        this._log({ pid: p.id, kind: 'deal', icon: '🤵', text: `Investor: «${card.title}»` });
        return;
      }
      case 'stocks': {
        const card = this._draw('stocks');
        t.card = card;
        t.step = 'card';
        this._log({ pid: p.id, kind: 'market', icon: '📊', text: `Aksiyalar bozori: «${card.title}»` });
        if (card.kind === 'split') {
          t.step = 'end';
          return this._applySplit(card);
        }
        if (card.kind === 'stock') return this._openTrade(card);
        return this._openShared(card);
      }
      case 'market': {
        const card = this._draw('market');
        t.card = card;
        t.step = 'card';
        this._log({ pid: p.id, kind: 'market', icon: '📈', text: `Bozor: «${card.title}»` });
        return this._applyMarket(p, card);
      }
      case 'doodad':
      case 'bigDoodad': {
        const card = this._draw(RAT_BOARD[p.pos]);
        t.card = card;
        t.step = 'end';
        return this._applyDoodad(p, card);
      }
      case 'charity':
        t.card = { deck: 'charity', id: `k${++this.seq.card}`, amount: charityAmount(p) };
        t.step = 'charity';
        return;
      case 'payday':
        t.card = { deck: 'payday', id: `k${++this.seq.card}`, amount: monthlyCashflow(p) };
        t.step = 'end';
        return;
      case 'baby':
        t.step = 'end';
        return this._baby(p);
      case 'downsized':
        t.step = 'end';
        return this._downsized(p);
    }
  }

  _landFast(p) {
    const t = this.turn;
    const sq = FAST_BOARD[p.pos];
    const id = `k${++this.seq.card}`;
    t.step = 'end';
    switch (sq.type) {
      case 'start':
        t.card = { deck: 'start', id };
        return;
      case 'cfday':
        t.card = { deck: 'cfday', id, amount: p.fast.income };
        return;
      case 'business':
        t.card = { deck: 'fast', id, kind: 'fastBusiness', title: sq.title, icon: sq.icon, cost: sq.cost, cashflow: sq.cashflow };
        t.step = 'card';
        return;
      case 'risky':
        t.card = { deck: 'risky', id, kind: 'risky', title: sq.title, icon: sq.icon, cost: sq.cost, cashflow: sq.cashflow, need: RISKY_NEED };
        t.step = 'card';
        return;
      case 'dream': {
        const d = DREAMS.find((x) => x.id === sq.dream);
        t.card = { deck: 'dream', id, kind: 'dream', dream: d.id, title: d.title, icon: d.icon, cost: d.cost, mine: d.id === p.dream };
        if (d.id === p.dream) t.step = 'card';
        return;
      }
      case 'audit':
      case 'divorce': {
        const loss = Math.round(p.cash * (sq.type === 'audit' ? AUDIT_SHARE : 0.5));
        p.cash -= loss;
        t.card = { deck: sq.type, id, amount: loss };
        this._log({ pid: p.id, kind: 'loss', icon: SQUARES[sq.type].icon, amount: -loss, text: `${this._name(p)}: ${SQUARES[sq.type].label} — ${money(-loss)}` });
        return;
      }
      case 'illegal':
        p.skipTurns += ILLEGAL_TURNS;
        t.card = { deck: 'illegal', id, turns: ILLEGAL_TURNS };
        this._log({ pid: p.id, kind: 'downsized', icon: '🚔', text: `${this._name(p)}: noqonuniy ish ochildi — ${ILLEGAL_TURNS} navbat tanaffus` });
        return;
      case 'bankrot': {
        // Bankrot: bizneslardan biri yo‘qoladi — qaysi biri, o‘yinchi o‘zi tanlaydi
        const own = p.assets.filter((a) => a.kind === 'fast');
        t.card = { deck: 'bankrot', id, kind: 'bankrot', count: own.length, lost: null };
        if (!own.length) {
          this._log({ pid: p.id, kind: 'info', icon: '😅', text: `${this._name(p)}: Bankrot katagi, lekin biznes yo‘q — hech narsa yo‘qotilmadi` });
          return;
        }
        if (own.length === 1) return this._forfeit(p, own[0]);
        t.step = 'forfeit';
        return;
      }
    }
  }

  _forfeit(p, a) {
    const t = this.turn;
    p.assets = p.assets.filter((x) => x !== a);
    p.fast.income -= a.cashflow;
    t.card = { ...t.card, lost: { title: a.title, icon: a.icon, cashflow: a.cashflow } };
    t.step = 'end';
    this._log({ pid: p.id, kind: 'bankrupt', icon: '💥', text: `${this._name(p)}: Bankrot — «${a.title}» yo‘qotildi, oylik daromad ${signed(-a.cashflow)}` });
  }

  // ——— kartalar ———

  _deal(p, size) {
    const t = this.turn;
    const card = this._draw(size);
    t.card = card;
    t.step = 'card';
    this._log({ pid: p.id, kind: 'deal', icon: size === 'big' ? '🏢' : '💡', text: `${this._name(p)} ${size === 'big' ? 'katta' : 'kichik'} bitim oldi: «${card.title}»` });
    if (card.kind === 'split') {
      t.step = 'end';
      this._applySplit(card);
    }
    if (card.kind === 'stock') this._openShared(card);
  }

  _applySplit(card) {
    for (const pl of this.players.values()) {
      const a = pl.assets.find((x) => x.kind === 'stock' && x.symbol === card.symbol);
      if (!a) continue;
      const before = a.shares;
      a.shares = card.ratio >= 1 ? a.shares * card.ratio : Math.ceil(a.shares * card.ratio);
      this._log({ pid: pl.id, kind: 'split', icon: '✂️', text: `${this._name(pl)}: ${card.symbol} aksiyalari ${before} → ${a.shares} ta` });
    }
  }

  _openShared(card) {
    card.openedAt = this.now();
    card.windowMs = SHARED_WINDOW_MS;
    card.eligible = [...this.players.values()].filter((pl) => pl.track === 'rat' && this._sellable(pl, card).length).map((pl) => pl.id);
    card.responders = [];
  }

  // Aksiyalar bozori: kalamush poygasidagi har bir o‘yinchi shu narxda sotib olishi yoki sotishi mumkin
  _openTrade(card) {
    card.openedAt = this.now();
    card.windowMs = TRADE_WINDOW_MS;
    card.trade = true;
    card.eligible = [...this.players.values()].filter((pl) => pl.track === 'rat').map((pl) => pl.id);
    card.responders = [];
  }

  _sellable(p, card) {
    if (card.kind === 'stock') return p.assets.filter((a) => a.kind === 'stock' && a.symbol === card.symbol && a.shares > 0);
    return p.assets.filter((a) => marketMatches(card, a));
  }

  _applyMarket(p, card) {
    if (card.kind === 'boost') {
      for (const pl of this.players.values()) {
        for (const a of pl.assets.filter((x) => x.type === 'startup')) {
          a.cashflow += card.amount;
          this._log({ pid: pl.id, kind: 'boost', icon: '🚀', text: `${this._name(pl)}: «${a.title}» oylik daromadi ${signed(card.amount)} ga oshdi` });
        }
      }
      this.turn.step = 'end';
      return;
    }
    if (card.kind === 'cfChange') {
      this.turn.step = 'end';
      let touched = 0;
      for (const pl of this.players.values()) {
        if (pl.track !== 'rat') continue;
        for (const a of pl.assets.filter((x) => card.targets.includes(x.type))) {
          const delta = card.amount * (card.perUnit ? a.units || 1 : 1);
          a.cashflow += delta;
          touched++;
          this._log({ pid: pl.id, kind: delta > 0 ? 'boost' : 'expense', icon: delta > 0 ? '📈' : '📉', text: `${this._name(pl)}: «${a.title}» oylik daromadi ${signed(delta)}` });
        }
      }
      if (!touched) this._log({ kind: 'info', icon: '🤷', text: 'Hech kimda mos mulk yo‘q — o‘zgarish yo‘q' });
      return;
    }
    if (card.kind === 'bonus') {
      this.turn.step = 'end';
      const amount = card.amount + card.salaryMonths * p.salary;
      p.cash += amount;
      this._log({ pid: p.id, kind: 'payday', icon: '🎁', amount, text: `${this._name(p)}: «${card.title}» — ${signed(amount)}` });
      return;
    }
    if (card.kind === 'damage') {
      this.turn.step = 'end';
      if (p.assets.some((a) => a.kind === 'realestate')) {
        this._log({ pid: p.id, kind: 'expense', icon: '🔧', amount: -card.cost, text: `${this._name(p)}: ta’mir — ${money(-card.cost)}` });
        this._charge(p, card.cost);
      } else {
        this._log({ pid: p.id, kind: 'info', icon: '😌', text: `${this._name(p)}da ko‘chmas mulk yo‘q — to‘lov kerak emas` });
      }
      return;
    }
    this._openShared(card);
  }

  _applyDoodad(p, card) {
    const cost = doodadCost(card, p);
    if (card.loan) {
      p.liabilities[card.loan.liability] += card.loan.amount;
      p.expenses[card.loan.liability] += card.loan.payment;
    }
    const extra = card.loan ? ` + qarz ${money(card.loan.amount)} (oyiga ${money(card.loan.payment)})` : '';
    if (!cost && !card.loan) {
      this._log({ pid: p.id, kind: 'info', icon: card.icon, text: `${this._name(p)}: «${card.title}» — farzand yo‘q, to‘lov yo‘q` });
      return;
    }
    this._log({ pid: p.id, kind: 'doodad', icon: card.icon, amount: -cost, text: `${this._name(p)}: «${card.title}» — ${money(-cost)}${extra}` });
    this._charge(p, cost);
  }

  _baby(p) {
    const t = this.turn;
    t.card = { deck: 'baby', id: `k${++this.seq.card}`, children: p.children, extra: p.perChild, full: p.children >= MAX_CHILDREN };
    if (p.children >= MAX_CHILDREN) {
      this._log({ pid: p.id, kind: 'info', icon: '👨‍👩‍👧‍👦', text: `${this._name(p)}da allaqachon ${MAX_CHILDREN} ta farzand bor` });
      return;
    }
    p.children++;
    t.card.children = p.children;
    this._log({ pid: p.id, kind: 'baby', icon: '👶', text: `${this._name(p)} oilasida farzand tug‘ildi! Xarajatlar oyiga ${signed(p.perChild)}` });
  }

  _downsized(p) {
    const amount = totalExpenses(p);
    this.turn.card = { deck: 'downsized', id: `k${++this.seq.card}`, amount };
    p.skipTurns += DOWNSIZE_TURNS;
    this._log({ pid: p.id, kind: 'downsized', icon: '📉', amount: -amount, text: `${this._name(p)} ishdan bo‘shatildi: ${money(-amount)} va ${DOWNSIZE_TURNS} navbat tanaffus` });
    this._charge(p, amount);
  }

  _buy(p, action) {
    const t = this.turn;
    const card = t.card;
    if (!card) fail('BAD_STEP');
    if (p.track === 'fast') return this._buyFast(p, card);
    const multi = card.kind === 'stock' || card.kind === 'gold' || card.kind === 'bond';
    if (!['stock', 'gold', 'bond', 'realestate', 'business', 'land', 'startup', 'invest'].includes(card.kind)) fail('BAD_STEP');
    if (!multi && t.bought) fail('BAD_STEP');
    const qty = multi ? posInt(action.qty, 1e6) : 1;
    let cost = multi ? card.price * qty : card.down;
    if (card.kind === 'invest') {
      cost = posInt(action.amount, card.max);
      if (cost < card.min || cost % INVEST_STEP) fail('BAD_REQUEST');
    }
    if (action.borrow && cost > p.cash) {
      const need = roundUpToLoan(cost - p.cash);
      if (need > loanCapacity(p)) fail('LOAN_LIMIT');
      this._loan(p, need, false);
    }
    if (cost > p.cash) fail('NO_CASH');
    p.cash -= cost;
    p.stats.deals++;
    if (card.kind === 'stock') {
      let a = p.assets.find((x) => x.kind === 'stock' && x.symbol === card.symbol);
      if (!a) {
        a = { id: `a${++this.seq.asset}`, kind: 'stock', symbol: card.symbol, title: STOCKS[card.symbol].name, icon: STOCKS[card.symbol].icon, shares: 0, cost: 0, cashflow: 0 };
        p.assets.push(a);
      }
      a.shares += qty;
      a.cost += cost;
      if (!card.eligible.includes(p.id)) card.eligible.push(p.id);
      this._log({ pid: p.id, kind: 'buy', icon: a.icon, amount: -cost, text: `${this._name(p)} ${qty} ta ${card.symbol} aksiyasini ${money(card.price)} dan sotib oldi` });
      return;
    }
    if (card.kind === 'bond') {
      const meta = BONDS[card.symbol];
      let a = p.assets.find((x) => x.kind === 'bond' && x.symbol === card.symbol);
      if (!a) {
        a = { id: `a${++this.seq.asset}`, kind: 'bond', symbol: card.symbol, title: meta.name, icon: meta.icon, units: 0, cost: 0, cashflow: 0 };
        p.assets.push(a);
      }
      a.units += qty;
      a.cost += cost;
      a.cashflow = a.units * meta.income;
      this._log({ pid: p.id, kind: 'buy', icon: meta.icon, amount: -cost, text: `${this._name(p)} ${qty} ta «${meta.name}» sotib oldi: oyiga ${signed(qty * meta.income)}` });
      return;
    }
    if (card.kind === 'gold') {
      let a = p.assets.find((x) => x.kind === 'gold');
      if (!a) {
        a = { id: `a${++this.seq.asset}`, kind: 'gold', title: 'Oltin tangalar', icon: '🪙', count: 0, cost: 0, cashflow: 0 };
        p.assets.push(a);
      }
      a.count += qty;
      a.cost += cost;
      this._log({ pid: p.id, kind: 'buy', icon: '🪙', amount: -cost, text: `${this._name(p)} ${qty} ta oltin tanga sotib oldi` });
      return;
    }
    t.bought = true;
    if (card.kind === 'invest') {
      const income = investIncome(card, cost);
      p.assets.push({ id: `a${++this.seq.asset}`, kind: 'invest', type: 'invest', tag: card.tag, title: card.title, icon: card.icon, cost, rate: card.rate, cashflow: income });
      this._log({ pid: p.id, kind: 'buy', icon: card.icon, amount: -cost, text: `${this._name(p)} «${card.title}»ga ${money(cost)} sarmoya kiritdi: oyiga ${signed(income)}` });
      return;
    }
    p.assets.push({
      id: `a${++this.seq.asset}`,
      kind: card.kind,
      type: card.type,
      tag: card.tag,
      title: card.title,
      icon: card.icon,
      cost: card.cost,
      down: card.down,
      mortgage: card.cost - card.down,
      cashflow: card.cashflow,
      units: card.units || 1,
    });
    this._log({
      pid: p.id,
      kind: 'buy',
      icon: card.icon,
      amount: -cost,
      text: `${this._name(p)} «${card.title}» sotib oldi: ${money(cost)} to‘ladi, oylik daromad ${signed(card.cashflow)}`,
    });
  }

  _buyFast(p, card) {
    const t = this.turn;
    if (t.bought) fail('BAD_STEP');
    if (card.kind === 'fastBusiness') {
      if (card.cost > p.cash) fail('NO_CASH');
      t.bought = true;
      p.cash -= card.cost;
      p.fast.income += card.cashflow;
      p.stats.deals++;
      p.assets.push({ id: `a${++this.seq.asset}`, kind: 'fast', title: card.title, icon: card.icon, cost: card.cost, cashflow: card.cashflow });
      this._log({ pid: p.id, kind: 'buy', icon: card.icon, amount: -card.cost, text: `${this._name(p)} «${card.title}» sotib oldi: oylik daromad ${signed(card.cashflow)}` });
      if (p.fast.income >= p.fast.goal) this._win(p, 'income');
      return;
    }
    if (card.kind === 'risky') {
      if (card.cost > p.cash) fail('NO_CASH');
      t.bought = true;
      p.cash -= card.cost;
      p.stats.deals++;
      const die = this._die();
      const won = die >= card.need;
      t.gamble = { die, won };
      t.step = 'end';
      if (!won) {
        this._log({ pid: p.id, kind: 'gamble', icon: '💨', amount: -card.cost, text: `${this._name(p)} «${card.title}»ga tavakkal qildi: zar ${die} — biznes ishlamadi, ${money(card.cost)} kuydi` });
        return;
      }
      p.fast.income += card.cashflow;
      p.assets.push({ id: `a${++this.seq.asset}`, kind: 'fast', risky: true, title: card.title, icon: card.icon, cost: card.cost, cashflow: card.cashflow });
      this._log({ pid: p.id, kind: 'gamble', icon: '🎉', amount: -card.cost, text: `${this._name(p)} «${card.title}»ga tavakkal qildi: zar ${die} — omad! Oylik daromad ${signed(card.cashflow)}` });
      if (p.fast.income >= p.fast.goal) this._win(p, 'income');
      return;
    }
    if (card.kind === 'dream') {
      if (!card.mine) fail('NOT_YOUR_DREAM');
      if (card.cost > p.cash) fail('NO_CASH');
      t.bought = true;
      p.cash -= card.cost;
      this._log({ pid: p.id, kind: 'dream', icon: card.icon, amount: -card.cost, text: `${this._name(p)} orzusini sotib oldi: «${card.title}»` });
      this._win(p, 'dream');
      return;
    }
    fail('BAD_STEP');
  }

  _sell(p, action) {
    const card = this.turn.card;
    if (!card?.eligible) fail('BAD_STEP');
    if (p.track !== 'rat') fail('NOT_ELIGIBLE');
    if (card.kind === 'stock' || card.kind === 'gold') {
      const a = card.kind === 'stock' ? p.assets.find((x) => x.kind === 'stock' && x.symbol === card.symbol) : p.assets.find((x) => x.kind === 'gold');
      const have = a ? (card.kind === 'stock' ? a.shares : a.count) : 0;
      if (!have) fail('NOT_ELIGIBLE');
      const qty = posInt(action.qty, have);
      const proceeds = qty * card.price;
      a.cost = Math.round((a.cost * (have - qty)) / have);
      if (card.kind === 'stock') a.shares -= qty;
      else a.count -= qty;
      if (have === qty) p.assets = p.assets.filter((x) => x !== a);
      p.cash += proceeds;
      p.stats.sold++;
      const what = card.kind === 'stock' ? `${qty} ta ${card.symbol} aksiyasini` : `${qty} ta oltin tangani`;
      this._log({ pid: p.id, kind: 'sell', icon: '💵', amount: proceeds, text: `${this._name(p)} ${what} ${money(card.price)} dan sotdi` });
    } else {
      const a = p.assets.find((x) => x.id === action.assetId);
      if (!a || !marketMatches(card, a)) fail('NOT_ELIGIBLE');
      const value = saleValue(card, a);
      const net = value - (a.mortgage || 0);
      if (net < 0 && p.cash < -net) fail('NO_CASH');
      p.cash += net;
      p.assets = p.assets.filter((x) => x !== a);
      p.stats.sold++;
      this._log({ pid: p.id, kind: 'sell', icon: '💵', amount: net, text: `${this._name(p)} «${a.title}»ni ${money(value)} ga sotdi, qo‘lga ${money(net)} tegdi` });
    }
    if (!card.trade && !this._sellable(p, card).length && !card.responders.includes(p.id)) card.responders.push(p.id);
  }

  _pass(p) {
    const card = this.turn.card;
    if (!card?.eligible?.includes(p.id) || card.responders.includes(p.id)) return;
    card.responders.push(p.id);
  }

  _charity(p, accept, borrow) {
    const t = this.turn;
    if (!accept) {
      this._log({ pid: p.id, kind: 'info', icon: '🙅', text: `${this._name(p)} xayriyadan voz kechdi` });
      t.step = 'end';
      return;
    }
    const amount = t.card.amount;
    if (borrow && amount > p.cash) {
      const need = roundUpToLoan(amount - p.cash);
      if (need > loanCapacity(p)) fail('LOAN_LIMIT');
      this._loan(p, need, false);
    }
    if (amount > p.cash) fail('NO_CASH');
    p.cash -= amount;
    p.charityTurns = CHARITY_TURNS;
    p.stats.donated += amount;
    t.step = 'end';
    this._log({ pid: p.id, kind: 'charity', icon: '🤝', amount: -amount, text: `${this._name(p)} ${money(amount)} xayriya qildi — ${CHARITY_TURNS} navbat 2 ta zar tashlaydi` });
  }

  _tryEnd(p) {
    const card = this.turn.card;
    if (card?.eligible && this.turn.step === 'card') {
      const waiting = card.eligible.filter((id) => id !== p.id && !card.responders.includes(id) && this.players.get(id));
      if (waiting.length && this.now() - card.openedAt < (card.windowMs || SHARED_WINDOW_MS)) fail('WAIT_OTHERS');
    }
    this._endTurn();
  }

  // ——— bank va qarzlar ———

  _loan(p, amount, forced) {
    p.bankLoan += amount;
    p.cash += amount;
    this._log({
      pid: p.id,
      kind: 'loan',
      icon: '🏦',
      amount,
      text: `${this._name(p)} bankdan ${money(amount)} qarz oldi${forced ? ' (majburiy to‘lov uchun)' : ''} — oyiga ${money(amount / 10)}`,
    });
  }

  _takeLoan(p, raw) {
    if (p.track !== 'rat') fail('BAD_STEP');
    const amount = posInt(raw);
    if (amount % LOAN_STEP) fail('BAD_REQUEST');
    if (amount > loanCapacity(p)) fail('LOAN_LIMIT');
    this._loan(p, amount, false);
  }

  _repay(p, raw) {
    if (p.track !== 'rat') fail('BAD_STEP');
    const amount = posInt(raw, p.bankLoan);
    if (amount % LOAN_STEP) fail('BAD_REQUEST');
    if (amount > p.cash) fail('NO_CASH');
    p.cash -= amount;
    p.bankLoan -= amount;
    this._log({ pid: p.id, kind: 'repay', icon: '✅', amount: -amount, text: `${this._name(p)} bank qarzidan ${money(amount)} qaytardi` });
  }

  _payoff(p, key) {
    if (p.track !== 'rat' || !LIABILITY_KEYS.includes(key)) fail('BAD_REQUEST');
    const amount = p.liabilities[key];
    if (!amount) fail('BAD_REQUEST');
    if (amount > p.cash) fail('NO_CASH');
    p.cash -= amount;
    const saved = p.expenses[key];
    p.liabilities[key] = 0;
    p.expenses[key] = 0;
    this._log({ pid: p.id, kind: 'repay', icon: '✅', amount: -amount, text: `${this._name(p)} «${LIABILITY_LABELS[key]}»ni to‘liq yopdi — xarajatlar oyiga ${money(saved)} ga kamaydi` });
  }

  // Majburiy to‘lov: pul yetmasa — bank qarzi, u ham yetmasa — bankrotlik
  _charge(p, amount) {
    if (amount <= 0) return;
    if (p.cash >= amount) {
      p.cash -= amount;
      return;
    }
    const need = roundUpToLoan(amount - p.cash);
    if (need <= loanCapacity(p)) {
      this._loan(p, need, true);
      p.cash -= amount;
      return;
    }
    this._bankrupt(p, amount);
  }

  _bankrupt(p, amount) {
    p.stats.bankrupt++;
    let raised = 0;
    for (const a of p.assets) raised += Math.floor((['stock', 'gold', 'bond', 'invest'].includes(a.kind) ? a.cost : a.down || 0) / 2);
    const sold = p.assets.length;
    p.assets = [];
    p.cash += raised;
    this._log({
      pid: p.id,
      kind: 'bankrupt',
      icon: '💥',
      amount: raised,
      text: sold ? `${this._name(p)} pul to‘lay olmadi: ${sold} ta aktiv bankka yarim narxda sotildi (${money(raised)})` : `${this._name(p)} pul to‘lay olmadi`,
    });
    if (p.cash >= amount) {
      p.cash -= amount;
      return;
    }
    for (const k of ['car', 'card', 'retail']) {
      p.liabilities[k] = Math.round(p.liabilities[k] / 2);
      p.expenses[k] = Math.round(p.expenses[k] / 2);
    }
    p.bankLoan = Math.floor(p.bankLoan / 2 / LOAN_STEP) * LOAN_STEP;
    p.cash = 0;
    p.skipTurns += 3;
    this._log({ pid: p.id, kind: 'bankrupt', icon: '💥', text: `${this._name(p)} bankrot bo‘ldi: qarzlar qayta tuzildi, 3 navbat o‘tkazib yuboriladi` });
  }

  // ——— mijozga yuboriladigan holat (moliyaviy hisobotlar ochiq — xuddi stol o‘yinidagidek) ———

  view() {
    const t = this.turn;
    let card = null;
    if (t?.card) {
      const { openedAt, windowMs, ...rest } = t.card;
      card = { ...rest };
      if (t.card.eligible) card.waitUntil = openedAt + (windowMs || SHARED_WINDOW_MS);
    }
    return {
      mode: this.mode,
      over: this.over,
      winner: this.winner,
      winReason: this.winReason,
      order: [...this.order],
      players: this.order.map((id) => {
        const p = this.players.get(id);
        return { ...p, expenses: { ...p.expenses }, liabilities: { ...p.liabilities }, assets: p.assets.map((a) => ({ ...a })), stats: { ...p.stats } };
      }),
      turn: t ? { pid: t.pid, seq: t.seq, step: t.step, move: t.move, card, bought: t.bought, gamble: t.gamble } : null,
      decks: Object.fromEntries(Object.entries(this.decks).map(([k, d]) => [k, d.draw.length])),
      dice: [...this.diceStats],
      log: this.log.slice(-40),
    };
  }
}
