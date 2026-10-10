import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../server/cashflow/game.js';
import { RAT_BOARD, FAST_BOARD, DREAMS, passiveIncome, monthlyCashflow, loanCapacity } from '../public/js/shared/rules.js';

// Zar qiymatini aniq belgilash uchun: rng() → (v - 1) / 6
const dieRng = (...values) => () => (values.length ? (values.shift() - 1) / 6 + 0.01 : 0.5);
const newGame = (opts = {}) => new Game({ players: [{ id: 'a', dream: 'sayohat' }, { id: 'b', dream: 'kosmos' }], nameOf: (id) => id.toUpperCase(), ...opts });
const onFast = (p, pos, cash = 5e6) => {
  p.track = 'fast';
  p.fast = { income: 500000, start: 500000, goal: 700000 };
  p.cash = cash;
  p.pos = pos;
};
const fastBiz = (id, cashflow) => ({ id, kind: 'fast', title: `Biznes ${id}`, icon: '🏢', cost: 1, cashflow });
const posOf = (type) => FAST_BOARD.findIndex((sq) => sq.type === type);

test('taxta: ichki halqada 4 ta maosh kuni, tashqi halqada 52 katak + 4 ta «Pullar»', () => {
  const count = (arr, type) => arr.filter((x) => (typeof x === 'string' ? x : x.type) === type).length;
  assert.equal(RAT_BOARD.length, 24);
  assert.equal(count(RAT_BOARD, 'payday'), 4);
  for (const t of ['investor', 'stocks', 'market', 'doodad']) assert.equal(count(RAT_BOARD, t), 2, t);
  assert.equal(count(RAT_BOARD, 'bigDoodad'), 1);

  assert.equal(FAST_BOARD.length, 56);
  assert.equal(count(FAST_BOARD, 'cfday'), 4);
  assert.equal(count(FAST_BOARD, 'business'), 21);
  assert.equal(count(FAST_BOARD, 'risky'), 11);
  assert.equal(count(FAST_BOARD, 'dream'), 15);
  for (const t of ['start', 'audit', 'divorce', 'illegal', 'bankrot']) assert.equal(count(FAST_BOARD, t), 1, t);
  // har bir orzu taxtada aynan bir marta
  assert.equal(DREAMS.length, 15);
  for (const d of DREAMS) assert.equal(FAST_BOARD.filter((sq) => sq.dream === d.id).length, 1, d.id);
  // tavakkal biznes ishonchlisidan ancha daromadliroq (oylik daromad / narx)
  const roi = (type) => {
    const list = FAST_BOARD.filter((sq) => sq.type === type);
    return list.reduce((s, sq) => s + sq.cashflow / sq.cost, 0) / list.length;
  };
  assert.ok(roi('risky') > 2 * roi('business'));
});

test('investor: summa oraliqda va $1 000 qadam bilan, daromad summaga mutanosib', () => {
  const g = newGame();
  const a = g.players.get('a');
  a.pos = 4;
  a.cash = 30000;
  g.decks.investor.draw.push({ kind: 'invest', type: 'invest', tag: 'choyxona', title: 'Choyxona', icon: '🫖', min: 2000, max: 20000, rate: 0.03, text: '' });
  g.rng = dieRng(1); // 5-katak: investor
  g.act('a', { type: 'roll' });
  assert.equal(RAT_BOARD[a.pos], 'investor');
  assert.equal(g.turn.step, 'card');
  assert.throws(() => g.act('a', { type: 'buy', amount: 1000 }), { code: 'BAD_REQUEST' }); // eng kamidan past
  assert.throws(() => g.act('a', { type: 'buy', amount: 25000 }), { code: 'BAD_REQUEST' }); // eng ko‘pidan yuqori
  assert.throws(() => g.act('a', { type: 'buy', amount: 2500 }), { code: 'BAD_REQUEST' }); // qadamga mos emas
  const cf = monthlyCashflow(a);
  g.act('a', { type: 'buy', amount: 10000 });
  const inv = a.assets.find((x) => x.kind === 'invest');
  assert.equal(inv.cost, 10000);
  assert.equal(inv.cashflow, 300);
  assert.equal(a.cash, 20000);
  assert.equal(monthlyCashflow(a), cf + 300);
  assert.throws(() => g.act('a', { type: 'buy', amount: 2000 }), { code: 'BAD_STEP' }); // bir kartaga bir marta
});

test('investor: pul yetmasa bankdan qarz olib sarmoya kiritish', () => {
  const g = newGame();
  const a = g.players.get('a');
  a.pos = 4;
  a.salary += 10000; // bank qarz bera olishi uchun
  a.cash = 500;
  g.decks.investor.draw.push({ kind: 'invest', type: 'invest', tag: 'x', title: 'Sarmoya', icon: '💼', min: 1000, max: 8000, rate: 0.04, text: '' });
  g.rng = dieRng(1);
  g.act('a', { type: 'roll' });
  assert.throws(() => g.act('a', { type: 'buy', amount: 3000 }), { code: 'NO_CASH' });
  assert.ok(loanCapacity(a) >= 3000);
  g.act('a', { type: 'buy', amount: 3000, borrow: true });
  assert.equal(a.bankLoan, 3000);
  assert.equal(a.cash, 500);
  assert.equal(passiveIncome(a), 120);
});

test('aksiyalar bozori: navbati bo‘lmagan o‘yinchi ham shu narxda sotib oladi va sotadi', () => {
  let now = 0;
  const g = newGame({ now: () => now });
  const [a, b] = ['a', 'b'].map((id) => g.players.get(id));
  a.pos = 3;
  a.cash = 1000;
  b.cash = 2000;
  b.assets.push({ id: 's1', kind: 'stock', symbol: 'UZUM', title: 'Uzum', icon: '🍇', shares: 50, cost: 250, cashflow: 0 });
  g.decks.stocks.draw.push({ kind: 'stock', symbol: 'UZUM', price: 20, title: 'Uzum', text: '' });
  g.rng = dieRng(1); // 4-katak: aksiyalar bozori
  g.act('a', { type: 'roll' });
  assert.equal(RAT_BOARD[a.pos], 'stocks');
  assert.ok(g.turn.card.trade);
  assert.deepEqual(g.turn.card.eligible.sort(), ['a', 'b']);

  g.act('b', { type: 'sell', qty: 50 });
  assert.equal(b.cash, 3000);
  g.act('b', { type: 'buy', qty: 100 }); // b sotib ham oladi
  assert.equal(b.cash, 1000);
  assert.equal(b.assets.find((x) => x.symbol === 'UZUM').shares, 100);
  g.act('a', { type: 'buy', qty: 10 });
  assert.equal(a.cash, 800);
  assert.throws(() => g.act('a', { type: 'end' }), { code: 'WAIT_OTHERS' });
  g.act('b', { type: 'pass' });
  g.act('a', { type: 'end' });
  assert.equal(g.turn.pid, 'b');
  // savdo tugagach b boshqa sotib ololmaydi
  assert.throws(() => g.act('a', { type: 'buy', qty: 1 }), { code: 'NOT_YOUR_TURN' });
});

test('aksiyalar bozori: kutish oynasi 15 soniya, tezkor yo‘ldagilar qatnashmaydi', () => {
  let now = 0;
  const g = new Game({ players: [{ id: 'a' }, { id: 'b' }, { id: 'c' }], nameOf: (x) => x, now: () => now });
  onFast(g.players.get('c'), 0);
  g.players.get('a').pos = 3;
  g.decks.stocks.draw.push({ kind: 'stock', symbol: 'AKFA', price: 5, title: 'Akfa', text: '' });
  g.rng = dieRng(1);
  g.act('a', { type: 'roll' });
  assert.deepEqual(g.turn.card.eligible.sort(), ['a', 'b']);
  assert.throws(() => g.act('c', { type: 'buy', qty: 1 }), { code: 'NOT_YOUR_TURN' });
  now = 10001;
  assert.throws(() => g.act('a', { type: 'end' }), { code: 'WAIT_OTHERS' });
  now = 15001;
  g.act('a', { type: 'end' });
});

test('aksiyalar bozori: bo‘linish barcha egalarga ta’sir qiladi', () => {
  const g = newGame();
  const b = g.players.get('b');
  b.assets.push({ id: 's1', kind: 'stock', symbol: 'UZTL', title: 'Uzbektelecom', icon: '📡', shares: 30, cost: 300, cashflow: 0 });
  g.players.get('a').pos = 3;
  g.decks.stocks.draw.push({ kind: 'split', symbol: 'UZTL', ratio: 2, title: 'Bo‘linish', text: '' });
  g.rng = dieRng(1);
  g.act('a', { type: 'roll' });
  assert.equal(b.assets[0].shares, 60);
  assert.equal(g.turn.step, 'end');
});

test('tavakkal biznes: zar 4–6 — biznes ishlaydi va daromad beradi', () => {
  const g = newGame();
  const a = g.players.get('a');
  const at = FAST_BOARD.findIndex((sq) => sq.type === 'risky');
  onFast(a, at - 2);
  g.rng = dieRng(1, 1, 5); // 2 qadam, so‘ng tavakkal zari — 5
  g.act('a', { type: 'roll' });
  const sq = FAST_BOARD[at];
  assert.equal(g.turn.card.kind, 'risky');
  const cash = a.cash;
  g.act('a', { type: 'buy' });
  assert.deepEqual(g.turn.gamble, { die: 5, won: true });
  assert.equal(a.cash, cash - sq.cost);
  assert.equal(a.fast.income, 500000 + sq.cashflow);
  assert.ok(a.assets.some((x) => x.kind === 'fast' && x.risky && x.title === sq.title));
  assert.equal(g.turn.step, 'end');
});

test('tavakkal biznes: zar 1–3 — sarmoya kuyadi, daromad yo‘q', () => {
  const g = newGame();
  const a = g.players.get('a');
  const at = FAST_BOARD.findIndex((sq) => sq.type === 'risky');
  onFast(a, at - 2);
  g.rng = dieRng(1, 1, 3);
  g.act('a', { type: 'roll' });
  const cash = a.cash;
  g.act('a', { type: 'buy' });
  assert.deepEqual(g.turn.gamble, { die: 3, won: false });
  assert.equal(a.cash, cash - FAST_BOARD[at].cost);
  assert.equal(a.fast.income, 500000);
  assert.equal(a.assets.length, 0);
  assert.throws(() => g.act('a', { type: 'buy' }), { code: 'BAD_STEP' });
});

test('bankrot: biznes bo‘lmasa — hech narsa, bitta bo‘lsa — o‘sha yo‘qoladi', () => {
  const g = newGame();
  const a = g.players.get('a');
  const at = posOf('bankrot');
  onFast(a, at - 2);
  g.rng = dieRng(1, 1);
  g.act('a', { type: 'roll' });
  assert.equal(g.turn.card.deck, 'bankrot');
  assert.equal(g.turn.step, 'end');

  const g2 = newGame();
  const a2 = g2.players.get('a');
  onFast(a2, at - 2);
  a2.assets.push(fastBiz('f1', 20000));
  a2.fast.income += 20000;
  g2.rng = dieRng(1, 1);
  g2.act('a', { type: 'roll' });
  assert.equal(a2.assets.length, 0);
  assert.equal(a2.fast.income, 500000);
  assert.equal(g2.turn.card.lost.title, 'Biznes f1');
});

test('bankrot: bir nechta biznes bo‘lsa — o‘yinchi qaysi biridan voz kechishni tanlaydi', () => {
  const g = newGame();
  const a = g.players.get('a');
  onFast(a, posOf('bankrot') - 2);
  a.assets.push(fastBiz('f1', 20000), fastBiz('f2', 120000));
  a.fast.income += 140000;
  g.rng = dieRng(1, 1);
  g.act('a', { type: 'roll' });
  assert.equal(g.turn.step, 'forfeit');
  assert.throws(() => g.act('a', { type: 'end' }), { code: 'BAD_STEP' });
  assert.throws(() => g.act('a', { type: 'forfeit', assetId: 'nope' }), { code: 'BAD_REQUEST' });
  assert.throws(() => g.act('b', { type: 'forfeit', assetId: 'f1' }), { code: 'NOT_YOUR_TURN' });
  g.act('a', { type: 'forfeit', assetId: 'f2' });
  assert.deepEqual(a.assets.map((x) => x.id), ['f1']);
  assert.equal(a.fast.income, 520000);
  g.act('a', { type: 'end' });
  assert.equal(g.turn.pid, 'b');
});

test('bankrot: vaqt tugasa daromadi eng kam biznes yo‘qoladi', () => {
  const g = newGame();
  const a = g.players.get('a');
  onFast(a, posOf('bankrot') - 2);
  a.assets.push(fastBiz('f1', 30000), fastBiz('f2', 8000), fastBiz('f3', 50000));
  g.rng = dieRng(1, 1);
  g.act('a', { type: 'roll' });
  g.timeout();
  assert.deepEqual(a.assets.map((x) => x.id), ['f1', 'f3']);
  assert.equal(g.turn.pid, 'b');
});

test('soliq tekshiruvi −30%, ajrashuv −50%, noqonuniy ish — 2 navbat tanaffus', () => {
  for (const [type, left] of [['audit', 700000], ['divorce', 500000]]) {
    const g = newGame();
    const a = g.players.get('a');
    onFast(a, posOf(type) - 2, 1e6);
    g.rng = dieRng(1, 1);
    g.act('a', { type: 'roll' });
    assert.equal(a.cash, left, type);
  }
  const g = newGame();
  const a = g.players.get('a');
  onFast(a, posOf('illegal') - 2, 1e6);
  g.rng = dieRng(1, 1);
  g.act('a', { type: 'roll' });
  assert.equal(a.skipTurns, 2);
  assert.equal(a.cash, 1e6);
  g.act('a', { type: 'end' });
  g.rng = dieRng(1);
  g.act('b', { type: 'roll' });
  g.act('b', { type: 'end' });
  assert.equal(g.turn.pid, 'b'); // a o‘tkazib yuborildi
});

test('katta xarajat: maoshga bog‘liq summa, kichik xarajat — alohida to‘plam', () => {
  const g = newGame();
  const a = g.players.get('a');
  a.pos = 10;
  a.cash = 1e5;
  g.decks.bigDoodad.draw.push({ title: 'Operatsiya', icon: '🏥', salaryPct: 0.5, text: '' });
  g.rng = dieRng(1); // 11-katak: katta xarajat
  g.act('a', { type: 'roll' });
  assert.equal(RAT_BOARD[a.pos], 'bigDoodad');
  assert.equal(g.turn.card.deck, 'bigDoodad');
  assert.equal(a.cash, 1e5 - Math.round(a.salary / 2 / 10) * 10);
});

test('mulk bozori: investitsiya ulushini kiritilgan summaning 150% iga sotish', () => {
  const g = newGame();
  const b = g.players.get('b');
  b.assets.push({ id: 'i1', kind: 'invest', type: 'invest', tag: 'x', title: 'Ulush', icon: '💼', cost: 10000, rate: 0.03, cashflow: 300 });
  g.players.get('a').pos = 9;
  g.decks.market.draw.push({ kind: 'sellInvest', mult: 1.5, title: 'Xaridor', text: '' });
  g.rng = dieRng(1);
  g.act('a', { type: 'roll' });
  assert.deepEqual(g.turn.card.eligible, ['b']);
  const cash = b.cash;
  g.act('b', { type: 'sell', assetId: 'i1' });
  assert.equal(b.cash, cash + 15000);
  assert.equal(passiveIncome(b), 0);
});
