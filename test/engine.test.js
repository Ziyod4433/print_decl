import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../server/cashflow/game.js';
import { monthlyCashflow, totalExpenses, passiveIncome, loanCapacity, PROFESSIONS, RAT_BOARD, FAST_BOARD, FAST_MULT, FAST_GOAL } from '../public/js/shared/rules.js';

// Zar qiymatini aniq belgilash uchun: rng() → (v - 1) / 6
const dieRng = (...values) => () => (values.length ? (values.shift() - 1) / 6 + 0.01 : 0.5);
const newGame = (opts = {}) => new Game({ players: [{ id: 'a', dream: 'sayohat' }, { id: 'b', dream: 'kosmos' }], nameOf: (id) => id.toUpperCase(), ...opts });

test('boshlanish: har kimda alohida kasb, naqd pul = jamg‘arma + oylik pul oqimi', () => {
  const g = newGame();
  const [a, b] = ['a', 'b'].map((id) => g.players.get(id));
  assert.notEqual(a.profession, b.profession);
  for (const p of [a, b]) {
    const prof = PROFESSIONS.find((x) => x.id === p.profession);
    assert.equal(p.cash, prof.savings + monthlyCashflow(p));
    assert.equal(p.track, 'rat');
  }
  assert.equal(g.turn.pid, 'a');
  assert.equal(g.turn.step, 'roll');
});

test('navbat tartibi: boshqasining navbatida harakat qilib bo‘lmaydi', () => {
  const g = newGame();
  assert.throws(() => g.act('b', { type: 'roll' }), { code: 'NOT_YOUR_TURN' });
  assert.throws(() => g.act('a', { type: 'end' }), { code: 'BAD_STEP' });
});

test('maosh kunidan o‘tganda oylik pul oqimi qo‘shiladi', () => {
  const g = newGame();
  const a = g.players.get('a');
  a.pos = 23;
  g.rng = dieRng(2); // 23 → 1: 0-katak (Maosh) dan o‘tadi
  const before = a.cash;
  g.act('a', { type: 'roll' });
  assert.equal(a.pos, 1);
  assert.equal(a.cash, before + monthlyCashflow(a));
  assert.equal(g.turn.step, 'choose');
  assert.equal(g.turn.move.steps, 2);
});

test('bitim: qarz bilan sotib olish, aktiv va ipoteka hisobotga tushadi', () => {
  const g = newGame();
  const a = g.players.get('a');
  g.rng = dieRng(1);
  g.act('a', { type: 'roll' }); // 1-katak: imkoniyat
  g.decks.big.draw.push({ kind: 'realestate', type: 'plex', title: 'Test uy', icon: '🏘️', cost: 120000, down: 15000, cashflow: 600, units: 4, text: '' });
  g.act('a', { type: 'deal', size: 'big' });
  a.cash = 2000;
  const cap = loanCapacity(a);
  if (13000 > cap) {
    assert.throws(() => g.act('a', { type: 'buy', borrow: true }), { code: 'LOAN_LIMIT' });
    a.salary += 5000; // bank ko‘proq bera olishi uchun
  }
  assert.throws(() => g.act('a', { type: 'buy' }), { code: 'NO_CASH' });
  g.act('a', { type: 'buy', borrow: true });
  assert.equal(a.bankLoan, 13000);
  assert.equal(a.cash, 0);
  const asset = a.assets.find((x) => x.title === 'Test uy');
  assert.equal(asset.mortgage, 105000);
  assert.equal(passiveIncome(a), 600);
  assert.throws(() => g.act('a', { type: 'buy', borrow: true }), { code: 'BAD_STEP' });
  g.act('a', { type: 'end' });
  assert.equal(g.turn.pid, 'b');
});

test('aksiya: faqat karta egasi oladi, boshqa egalar shu narxda sotadi; kutish oynasi', () => {
  let t = 1000;
  const g = newGame({ now: () => t });
  const [a, b] = ['a', 'b'].map((id) => g.players.get(id));
  b.assets.push({ id: 'x1', kind: 'stock', symbol: 'AKFA', title: 'Akfa Group', icon: '🪟', shares: 100, cost: 500, cashflow: 0 });
  g.rng = dieRng(1);
  g.act('a', { type: 'roll' });
  g.decks.small.draw.push({ kind: 'stock', symbol: 'AKFA', price: 30, title: 'Akfa cho‘qqida', text: '' });
  g.act('a', { type: 'deal', size: 'small' });
  a.cash = 1000;
  g.act('a', { type: 'buy', qty: 10 });
  assert.equal(a.cash, 700);
  assert.throws(() => g.act('b', { type: 'buy', qty: 1 }), { code: 'NOT_YOUR_TURN' });
  assert.throws(() => g.act('a', { type: 'end' }), { code: 'WAIT_OTHERS' });
  const bCash = b.cash;
  g.act('b', { type: 'sell', qty: 60 });
  assert.equal(b.cash, bCash + 1800);
  assert.equal(b.assets[0].shares, 40);
  assert.equal(b.assets[0].cost, 200);
  g.act('b', { type: 'pass' });
  g.act('a', { type: 'end' });
  assert.equal(g.turn.pid, 'b');
});

test('kutish oynasi 10 soniyadan keyin yopiladi', () => {
  let t = 0;
  const g = newGame({ now: () => t });
  g.players.get('b').assets.push({ id: 'x1', kind: 'realestate', type: 'house3', title: 'Hovli', icon: '🏡', cost: 50000, down: 5000, mortgage: 45000, cashflow: 200, units: 1 });
  g.players.get('a').pos = 9;
  g.rng = dieRng(1); // 10-katak: ko‘chmas mulk bozori
  g.decks.market.draw.push({ kind: 'sell', target: 'house3', price: 100000, title: 'Xaridor', text: '' });
  g.act('a', { type: 'roll' });
  assert.equal(RAT_BOARD[10], 'market');
  assert.deepEqual(g.turn.card.eligible, ['b']);
  assert.throws(() => g.act('a', { type: 'end' }), { code: 'WAIT_OTHERS' });
  t = 10001;
  g.act('a', { type: 'end' });
  assert.equal(g.turn.pid, 'b');
});

test('bozor: mulkni sotganda ipoteka yopiladi, qolgani naqd pulga', () => {
  const g = newGame();
  const b = g.players.get('b');
  b.assets.push({ id: 'h1', kind: 'realestate', type: 'house3', title: 'Hovli', icon: '🏡', cost: 50000, down: 5000, mortgage: 45000, cashflow: 200, units: 1 });
  g.players.get('a').pos = 9;
  g.rng = dieRng(1);
  g.decks.market.draw.push({ kind: 'sell', target: 'house3', price: 100000, title: 'Xaridor', text: '' });
  g.act('a', { type: 'roll' });
  const before = b.cash;
  assert.throws(() => g.act('b', { type: 'sell', assetId: 'nope' }), { code: 'NOT_ELIGIBLE' });
  g.act('b', { type: 'sell', assetId: 'h1' });
  assert.equal(b.cash, before + 55000);
  assert.equal(b.assets.length, 0);
  assert.ok(g.turn.card.responders.includes('b'));
});

test('kichik xarajat: pul yetmasa bankdan avtomatik qarz', () => {
  const g = newGame();
  const a = g.players.get('a');
  a.cash = 100;
  a.pos = 1;
  g.rng = dieRng(1); // 2-katak: ortiqcha xarajat
  g.decks.doodad.draw.push({ title: 'Televizor', icon: '📺', cost: 1500, text: '' });
  g.act('a', { type: 'roll' });
  assert.equal(a.bankLoan, 2000);
  assert.equal(a.cash, 600);
  assert.equal(g.turn.step, 'end');
});

test('bankrotlik: aktivlar yarim narxda sotiladi, qarzlar qayta tuziladi', () => {
  const g = newGame();
  const a = g.players.get('a');
  a.cash = 0;
  a.salary = 0; // pul oqimi manfiy — bank qarz bermaydi
  a.assets.push({ id: 'z', kind: 'realestate', type: 'flat2', title: 'Kvartira', icon: '🏢', cost: 40000, down: 4000, mortgage: 36000, cashflow: 100, units: 1 });
  const car = a.liabilities.car;
  g._charge(a, 50000);
  assert.equal(a.assets.length, 0);
  assert.equal(a.cash, 0);
  assert.equal(a.skipTurns, 3);
  assert.equal(a.liabilities.car, Math.round(car / 2));
  assert.equal(a.stats.bankrupt, 1);
});

test('farzand: xarajat oshadi, ko‘pi bilan 3 ta', () => {
  const g = newGame();
  const a = g.players.get('a');
  const exp = totalExpenses(a);
  g.turn.card = null;
  for (let i = 0; i < 4; i++) g._baby(a);
  assert.equal(a.children, 3);
  assert.equal(totalExpenses(a), exp + 3 * a.perChild);
});

test('qarzni yopish oylik xarajatni kamaytiradi', () => {
  const g = newGame();
  const a = g.players.get('a');
  a.cash = 1e6;
  const exp = totalExpenses(a);
  const pay = a.expenses.car;
  g.act('a', { type: 'payoff', liability: 'car' });
  assert.equal(a.liabilities.car, 0);
  assert.equal(totalExpenses(a), exp - pay);
  g.act('a', { type: 'loan', amount: 3000 });
  assert.equal(a.bankLoan, 3000);
  g.act('a', { type: 'repay', amount: 2000 });
  assert.equal(a.bankLoan, 1000);
  assert.throws(() => g.act('a', { type: 'loan', amount: 1500 }), { code: 'BAD_REQUEST' });
});

test('xayriya: 3 navbat davomida 2 ta zar tanlash mumkin', () => {
  const g = newGame();
  const a = g.players.get('a');
  a.pos = 7;
  a.cash = 10000;
  g.rng = dieRng(1); // 8-katak: xayriya
  g.act('a', { type: 'roll' });
  assert.equal(g.turn.step, 'charity');
  g.act('a', { type: 'charity', accept: true });
  assert.equal(a.charityTurns, 3);
  g.act('a', { type: 'end' });
  g.rng = dieRng(1);
  g.act('b', { type: 'roll' });
  g.act('b', { type: 'end' });
  g.rng = dieRng(3, 4);
  g.act('a', { type: 'roll', dice: 2 });
  assert.deepEqual(g.turn.move.dice, [3, 4]);
  assert.equal(a.charityTurns, 2);
});

test('ishdan bo‘shatish: xarajatlar to‘lanadi va 2 navbat o‘tkazib yuboriladi', () => {
  const g = newGame();
  const a = g.players.get('a');
  a.pos = 13;
  a.cash = 1e5;
  const due = totalExpenses(a);
  g.rng = dieRng(1); // 14-katak: ishsizlik
  g.act('a', { type: 'roll' });
  assert.equal(a.cash, 1e5 - due);
  g.act('a', { type: 'end' });
  g.rng = dieRng(1);
  g.act('b', { type: 'roll' });
  g.act('b', { type: 'end' }); // a o‘tkazib yuboriladi
  assert.equal(g.turn.pid, 'b');
  assert.equal(a.skipTurns, 1);
});

test('kalamush poygasidan chiqish → tezkor yo‘l; biznes bilan +$200 000 — g‘alaba', () => {
  const g = newGame();
  const b = g.players.get('b');
  b.assets.push({ id: 'big', kind: 'business', type: 'business', tag: 'x', title: 'Katta biznes', icon: '🏢', cost: 1, down: 1, mortgage: 0, cashflow: 50000, units: 1 });
  g.rng = dieRng(1);
  g.act('a', { type: 'roll' });
  g.act('a', { type: 'end' });
  assert.equal(b.track, 'fast');
  assert.equal(b.fast.income, passiveIncome(b) * FAST_MULT);
  assert.equal(b.fast.goal - b.fast.start, FAST_GOAL);
  assert.equal(b.pos, 0);
  b.cash = 1e9;
  b.fast.income = b.fast.goal - 5000;
  const cash = b.cash;
  g.rng = dieRng(1, 1); // 0 → 2: «Pullar»
  g.act('b', { type: 'roll' });
  assert.equal(b.cash, cash + b.fast.income);
  assert.equal(FAST_BOARD[b.pos].type, 'cfday');
  g.act('b', { type: 'end' });
  g.rng = dieRng(1);
  g.act('a', { type: 'roll' });
  g.act('a', { type: 'end' });
  b.pos = 55;
  g.rng = dieRng(1, 1); // 55 → 1: yoqilg‘i quyish shoxobchasi (Start orqali)
  g.act('b', { type: 'roll' });
  assert.equal(g.turn.card.kind, 'fastBusiness');
  g.act('b', { type: 'buy' });
  assert.ok(g.over);
  assert.equal(g.winner, 'b');
  assert.equal(g.winReason, 'income');
});

test('tezkor yo‘lda faqat o‘z orzuingizni sotib olasiz', () => {
  const g = newGame();
  const a = g.players.get('a');
  a.track = 'fast';
  a.fast = { income: 100000, start: 100000, goal: 150000 };
  a.cash = 1e6;
  a.pos = 3;
  g.rng = dieRng(1, 1); // 3 → 5: «Kosmosga parvoz» — a ning orzusi emas
  g.act('a', { type: 'roll' });
  assert.equal(g.turn.card.mine, false);
  assert.throws(() => g.act('a', { type: 'buy' }), { code: 'BAD_STEP' });
  g.act('a', { type: 'end' });
  g.rng = dieRng(1);
  g.act('b', { type: 'roll' });
  g.act('b', { type: 'end' });
  g.rng = dieRng(2, 2); // 5 → 9: «Oila bilan dunyo bo‘ylab sayohat» — a ning orzusi
  g.act('a', { type: 'roll' });
  assert.equal(g.turn.card.mine, true);
  g.act('a', { type: 'buy' });
  assert.equal(g.winner, 'a');
  assert.equal(g.winReason, 'dream');
});

test('qisqa o‘yin: kalamush poygasidan birinchi chiqqan g‘olib', () => {
  const g = newGame({ mode: 'quick' });
  const b = g.players.get('b');
  b.assets.push({ id: 'k', kind: 'business', type: 'business', tag: 'x', title: 'Biznes', icon: '🏢', cost: 1, down: 1, mortgage: 0, cashflow: 99999, units: 1 });
  g.rng = dieRng(1);
  g.act('a', { type: 'roll' });
  g.act('a', { type: 'end' });
  assert.equal(g.winner, 'b');
  assert.equal(g.winReason, 'escape');
  assert.throws(() => g.act('b', { type: 'roll' }), { code: 'OVER' });
});

test('vaqt tugasa: avval zar avtomatik tashlanadi, keyin navbat o‘tadi', () => {
  const g = newGame();
  g.rng = dieRng(1);
  g.timeout();
  assert.ok(g.turn.move);
  assert.equal(g.turn.pid, 'a');
  g.timeout();
  assert.equal(g.turn.pid, 'b');
});

test('navbatdagi o‘yinchi chiqib ketsa, navbat keyingisiga o‘tadi', () => {
  const g = new Game({ players: [{ id: 'a' }, { id: 'b' }, { id: 'c' }], nameOf: (x) => x });
  g.removePlayer('a');
  assert.equal(g.turn.pid, 'b');
  g.addPlayer({ id: 'd' });
  assert.deepEqual(g.order, ['b', 'c', 'd']);
});
