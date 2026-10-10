import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../server/cashflow/game.js';
import { SMALL_DEALS, BIG_DEALS, MARKET, DOODADS, BIG_DOODADS, STOCK_MARKET, INVESTORS } from '../server/cashflow/cards.js';
import { STOCKS, BONDS, LIABILITY_KEYS, ASSET_TYPE_LABELS, INVEST_STEP, monthlyCashflow } from '../public/js/shared/rules.js';

const newGame = (opts = {}) => new Game({ players: [{ id: 'a' }, { id: 'b' }], nameOf: (id) => id, ...opts });

// χ² mezoni: 5 erkinlik darajasi uchun p = 0.0001 da kritik qiymat 25.74
const chiSquare = (counts) => {
  const total = counts.reduce((a, b) => a + b, 0);
  const expected = total / counts.length;
  return counts.reduce((sum, c) => sum + (c - expected) ** 2 / expected, 0);
};

test('o‘yin sukut bo‘yicha kriptografik generatordan foydalanadi', () => {
  const g = newGame();
  assert.equal(g.rng, null);
});

test('zarlar teng taqsimlangan (60 000 tashlash, χ² mezoni)', () => {
  const g = newGame();
  for (let i = 0; i < 60000; i++) g._die();
  const chi = chiSquare(g.diceStats);
  assert.ok(chi < 25.74, `χ² = ${chi.toFixed(2)}, zarlar: ${g.diceStats.join(', ')}`);
  for (const c of g.diceStats) assert.ok(Math.abs(c - 10000) < 600, `har bir son ~10 000 marta: ${g.diceStats}`);
});

test('ikki zar yig‘indisi nazariy taqsimotga mos', () => {
  const g = newGame();
  const sums = new Array(13).fill(0);
  const n = 72000;
  for (let i = 0; i < n; i++) sums[g._die() + g._die()]++;
  // nazariy ehtimollar: 1/36, 2/36, …, 6/36, …, 1/36
  let chi = 0;
  for (let s = 2; s <= 12; s++) {
    const expected = (n * (6 - Math.abs(7 - s))) / 36;
    chi += (sums[s] - expected) ** 2 / expected;
  }
  assert.ok(chi < 35.56, `χ² = ${chi.toFixed(2)} (10 erkinlik darajasi, p = 0.0001)`);
});

test('ketma-ket tashlashlar bog‘liq emas (avvalgi son keyingisiga ta’sir qilmaydi)', () => {
  const g = newGame();
  const pairs = Array.from({ length: 6 }, () => new Array(6).fill(0));
  let prev = g._die();
  for (let i = 0; i < 72000; i++) {
    const cur = g._die();
    pairs[prev - 1][cur - 1]++;
    prev = cur;
  }
  const chi = chiSquare(pairs.flat());
  assert.ok(chi < 66.62, `χ² = ${chi.toFixed(2)} (35 erkinlik darajasi, p = 0.0001)`);
});

test('kartalar har o‘yinda boshqacha aralashtiriladi', () => {
  const order = (g) => g.decks.small.draw.map((c) => c.title).join('|');
  const seen = new Set(Array.from({ length: 5 }, () => order(newGame())));
  assert.equal(seen.size, 5);
});

test('kartalar to‘g‘ri tuzilgan va har bir xaridorga mos aktiv mavjud', () => {
  const deals = [...SMALL_DEALS, ...BIG_DEALS];
  const types = new Set(deals.map((c) => c.type).filter(Boolean));
  const tags = new Set(deals.map((c) => c.tag).filter(Boolean));
  const all = [...deals, ...INVESTORS, ...STOCK_MARKET, ...MARKET, ...DOODADS, ...BIG_DOODADS];
  for (const c of all) assert.ok(c.title && c.text, `matn yo‘q: ${JSON.stringify(c)}`);
  for (const c of [...deals, ...STOCK_MARKET]) {
    if (c.kind === 'stock' || c.kind === 'split') assert.ok(STOCKS[c.symbol], c.symbol);
    if (c.kind === 'bond' || c.kind === 'sellBond') assert.ok(BONDS[c.symbol], c.symbol);
  }
  for (const c of deals) {
    if ('down' in c) assert.ok(c.down > 0 && c.down <= c.cost, c.title);
    if (c.type && c.kind === 'realestate') assert.ok(ASSET_TYPE_LABELS[c.type], c.type);
  }
  for (const c of SMALL_DEALS) if ('down' in c) assert.ok(c.down <= 5000, `kichik bitim $5 000 dan oshmasin: ${c.title}`);
  for (const c of STOCK_MARKET) assert.ok(['stock', 'split', 'gold', 'sellBond'].includes(c.kind), c.title);
  for (const c of MARKET) {
    if (c.kind === 'sell') assert.ok(types.has(c.target), `xaridor bor, lekin «${c.target}» sotilmaydi`);
    if (c.kind === 'sellTag') assert.ok(tags.has(c.tag), `xaridor bor, lekin «${c.tag}» biznesi yo‘q`);
    if (c.kind === 'cfChange') for (const t of c.targets) assert.ok(types.has(t), t);
    if (c.kind === 'sellInvest') assert.ok(c.mult > 1);
  }
  for (const c of INVESTORS) {
    assert.ok(c.min >= INVEST_STEP && c.min < c.max && c.min % INVEST_STEP === 0 && c.max % INVEST_STEP === 0, c.title);
    assert.ok(c.rate > 0.01 && c.rate <= 0.04, `foiz mantiqiy bo‘lsin: ${c.title}`);
  }
  for (const d of [...DOODADS, ...BIG_DOODADS]) {
    if (d.loan) assert.ok(LIABILITY_KEYS.includes(d.loan.liability));
    assert.ok(d.cost > 0 || d.perChild > 0 || d.salaryPct > 0, d.title);
  }
  // kichik xarajatlar haqiqatan kichik, katta xarajatlar — katta
  for (const d of DOODADS) assert.ok(!d.loan && (d.cost || d.perChild) <= 450, d.title);
  for (const d of BIG_DOODADS) assert.ok(d.loan || d.salaryPct || (d.cost || d.perChild) >= 500, d.title);
  assert.ok(all.length >= 250);
});

test('obligatsiyalar: sotib olish, oylik daromad va bozorda sotish', () => {
  const g = newGame({ rng: () => 0.01 });
  const a = g.players.get('a');
  a.cash = 20000;
  g.act('a', { type: 'roll' }); // 1-katak: imkoniyat
  g.decks.small.draw.push({ kind: 'bond', symbol: 'OBL', price: 1000, title: 'Obligatsiya', text: '' });
  g.act('a', { type: 'deal', size: 'small' });
  const cf = monthlyCashflow(a);
  g.act('a', { type: 'buy', qty: 12 });
  const bond = a.assets.find((x) => x.kind === 'bond');
  assert.equal(bond.units, 12);
  assert.equal(bond.cashflow, 120);
  assert.equal(monthlyCashflow(a), cf + 120);
  g.act('a', { type: 'end' });
  // b ning navbati: aksiyalar bozorida obligatsiya xaridori
  g.players.get('b').pos = 3;
  g.decks.stocks.draw.push({ kind: 'sellBond', symbol: 'OBL', price: 1150, title: 'Xaridor', text: '' });
  g.act('b', { type: 'roll' });
  const before = a.cash;
  g.act('a', { type: 'sell', assetId: bond.id });
  assert.equal(a.cash, before + 13800);
  assert.equal(a.assets.length, 0);
});

test('bozor yangiliklari: ijara o‘zgarishi barcha egalarga, mukofot faqat karta egasiga', () => {
  const g = newGame({ rng: () => 0.01 });
  const [a, b] = ['a', 'b'].map((id) => g.players.get(id));
  a.assets.push({ id: 'f', kind: 'realestate', type: 'flat2', title: 'Kvartira', units: 1, cashflow: 100, cost: 1, down: 1, mortgage: 0 });
  b.assets.push({ id: 'p', kind: 'realestate', type: 'plex', title: 'Uy', units: 4, cashflow: 500, cost: 1, down: 1, mortgage: 0 });
  a.pos = 9;
  g.decks.market.draw.push({ kind: 'cfChange', targets: ['plex'], amount: 20, perUnit: true, title: 'Arzonlashdi', text: '' });
  g.act('a', { type: 'roll' });
  assert.equal(b.assets[0].cashflow, 580);
  assert.equal(a.assets[0].cashflow, 100);
  g.act('a', { type: 'end' });
  b.pos = 9;
  g.decks.market.draw.push({ kind: 'bonus', amount: 0, salaryMonths: 1, title: 'Mukofot', text: '' });
  const cash = b.cash;
  g.act('b', { type: 'roll' });
  assert.equal(b.cash, cash + b.salary);
});
