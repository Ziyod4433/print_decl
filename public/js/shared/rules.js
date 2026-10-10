// «Pul Oqimi» o‘yin qoidalari: server ham, brauzer ham shu faylni ishlatadi,
// shuning uchun hisob-kitoblar hech qachon farq qilmaydi.

export const MAX_PLAYERS = 6;
export const LOAN_STEP = 1000; // bank qarzi $1 000 qadam bilan
export const LOAN_RATE = 0.1; // oyiga 10%
export const MAX_CHILDREN = 3;
export const CHARITY_TURNS = 3;
export const DOWNSIZE_TURNS = 2;
export const FAST_MULT = 100; // tezkor yo‘lda: passiv daromad × 100
export const FAST_GOAL = 50000; // tezkor yo‘lda g‘alaba: oylik pul oqimini +$50 000 ga oshirish
export const SHARED_WINDOW_MS = 10000; // boshqalar aksiya/mulk sotishga ulgurishi uchun
export const SMALL_DEAL_MAX = 5000;

// ——— Kalamush poygasi (ichki halqa, 24 katak) ———
export const RAT_BOARD = [
  'payday', 'opportunity', 'doodad', 'opportunity', 'charity', 'opportunity',
  'market', 'opportunity', 'payday', 'opportunity', 'doodad', 'opportunity',
  'downsized', 'opportunity', 'market', 'opportunity', 'payday', 'opportunity',
  'doodad', 'opportunity', 'baby', 'opportunity', 'market', 'opportunity',
];

export const DREAMS = [
  { id: 'travel', title: 'Dunyo bo‘ylab sayohat', icon: '🌍', cost: 150000 },
  { id: 'dacha', title: 'Chorvoq bo‘yida dacha', icon: '🏡', cost: 120000 },
  { id: 'parents', title: 'Ota-onamga yangi uy sovg‘a qilish', icon: '🏠', cost: 200000 },
  { id: 'school', title: 'O‘z xususiy maktabimni ochish', icon: '🎓', cost: 250000 },
  { id: 'fund', title: 'Xayriya fondini tashkil etish', icon: '🤲', cost: 300000 },
  { id: 'yacht', title: 'Yaxta va dengiz sayohati', icon: '⛵', cost: 220000 },
  { id: 'hotel', title: 'Samarqandda butik-mehmonxona', icon: '🏛️', cost: 350000 },
  { id: 'space', title: 'Kosmosga parvoz', icon: '🚀', cost: 500000 },
  { id: 'book', title: 'Kitob yozib nashr ettirish', icon: '📚', cost: 90000 },
  { id: 'cars', title: 'Klassik avtomobillar kolleksiyasi', icon: '🏎️', cost: 250000 },
];

// ——— Tezkor yo‘l (tashqi halqa, 36 katak) ———
const biz = (title, icon, cost, cashflow) => ({ type: 'business', title, icon, cost, cashflow });
export const FAST_BOARD = [
  { type: 'cfday' },
  biz('Toshkentda avtosalon', '🚘', 150000, 5000),
  { type: 'dream', dream: 'travel' },
  biz('Gilos bog‘i va fermer xo‘jaligi', '🍒', 100000, 3000),
  { type: 'lawsuit' },
  biz('Restoranlar tarmog‘i', '🍽️', 250000, 8000),
  { type: 'dream', dream: 'dacha' },
  { type: 'gamble', title: 'Texnologiya startapi IPO', icon: '📈', stake: 50000, need: 6, payout: 500000 },
  biz('IT-kompaniya ulushi', '💻', 200000, 7000),
  { type: 'cfday' },
  { type: 'dream', dream: 'parents' },
  biz('Fitnes klublar tarmog‘i', '🏋️', 120000, 4000),
  { type: 'audit' },
  biz('Non zavodi', '🍞', 180000, 6000),
  { type: 'dream', dream: 'school' },
  { type: 'gamble', title: 'Oltin koni ulushi', icon: '⛏️', stake: 75000, need: 5, payout: 400000 },
  biz('Quyosh elektr stansiyasi', '☀️', 400000, 13000),
  { type: 'dream', dream: 'fund' },
  { type: 'cfday' },
  biz('Buxoroda mehmonxona', '🏨', 300000, 10000),
  { type: 'fraud' },
  { type: 'dream', dream: 'yacht' },
  biz('Bolalar bog‘chalari tarmog‘i', '🧸', 160000, 5500),
  biz('Logistika kompaniyasi', '🚛', 350000, 11000),
  { type: 'dream', dream: 'hotel' },
  { type: 'gamble', title: 'Neft qidiruv loyihasi', icon: '🛢️', stake: 100000, need: 6, payout: 1000000 },
  biz('Tikuvchilik fabrikasi', '🧵', 220000, 7500),
  { type: 'cfday' },
  { type: 'dream', dream: 'space' },
  biz('Zominda sanatoriy', '🏔️', 450000, 14000),
  { type: 'lawsuit' },
  biz('Tibbiyot klinikasi', '🏥', 380000, 12000),
  { type: 'dream', dream: 'book' },
  biz('Savdo markazi', '🏬', 500000, 16000),
  biz('Avtomobil yuvish tarmog‘i', '🫧', 125000, 4000),
  { type: 'dream', dream: 'cars' },
];

export const SQUARES = {
  payday: { label: 'Maosh kuni', short: 'Maosh', icon: '💰', color: '#f5b83d', hint: 'Shu katakdan o‘tganda yoki to‘xtaganda oylik pul oqimingizni olasiz.' },
  opportunity: { label: 'Imkoniyat', short: 'Imkoniyat', icon: '💡', color: '#2bd67b', hint: 'Kichik yoki katta bitim kartasini oling: aksiya, ko‘chmas mulk, biznes.' },
  market: { label: 'Bozor', short: 'Bozor', icon: '📈', color: '#7aa2ff', hint: 'Xaridorlar aktivlaringizni sotib olishni taklif qiladi.' },
  doodad: { label: 'Ortiqcha xarajat', short: 'Xarajat', icon: '🛍️', color: '#ff5f8a', hint: 'Majburiy xarajat — keraksiz narsalarga pul ketadi.' },
  charity: { label: 'Xayriya', short: 'Xayriya', icon: '🤝', color: '#ff9f43', hint: 'Daromadning 10% ini bering — 3 navbat davomida 2 ta zar tashlaysiz.' },
  baby: { label: 'Farzand', short: 'Farzand', icon: '👶', color: '#7dd3fc', hint: 'Oilada farzand tug‘iladi — xarajatlar oshadi.' },
  downsized: { label: 'Ishdan bo‘shatish', short: 'Ishsizlik', icon: '📉', color: '#94a3b8', hint: 'Bir oylik xarajatlarni to‘laysiz va 2 navbat o‘tkazib yuborasiz.' },
  cfday: { label: 'Pul oqimi kuni', short: 'Pul kuni', icon: '💸', color: '#f5b83d', hint: 'Tezkor yo‘ldagi oylik daromadingizni olasiz.' },
  business: { label: 'Biznes', short: 'Biznes', icon: '🏢', color: '#2bd67b', hint: 'Yirik biznes sotib olib, oylik pul oqimini oshiring.' },
  dream: { label: 'Orzu', short: 'Orzu', icon: '⭐', color: '#c084fc', hint: 'O‘z orzuingizni sotib olsangiz — g‘alaba!' },
  lawsuit: { label: 'Sud da’vosi', short: 'Sud', icon: '⚖️', color: '#ff4d61', hint: 'Naqd pulingizning yarmini yo‘qotasiz.' },
  audit: { label: 'Soliq tekshiruvi', short: 'Soliq', icon: '🧾', color: '#ff4d61', hint: 'Naqd pulingizning yarmini yo‘qotasiz.' },
  fraud: { label: 'Firibgarlik', short: 'Firib', icon: '🕵️', color: '#ff4d61', hint: 'Ishonchli hamkor aldadi — barcha naqd puldan ayrilasiz.' },
  gamble: { label: 'Tavakkal', short: 'Tavakkal', icon: '🎲', color: '#22c3e6', hint: 'Pul tikib zar tashlang: omad kulsa — katta yutuq.' },
};

export const DECKS = {
  small: { label: 'Kichik bitim', color: '#2bd67b', icon: '💡' },
  big: { label: 'Katta bitim', color: '#22c3e6', icon: '🏢' },
  market: { label: 'Bozor', color: '#7aa2ff', icon: '📈' },
  doodad: { label: 'Ortiqcha xarajat', color: '#ff5f8a', icon: '🛍️' },
  charity: { label: 'Xayriya', color: '#ff9f43', icon: '🤝' },
  baby: { label: 'Farzand', color: '#7dd3fc', icon: '👶' },
  downsized: { label: 'Ishdan bo‘shatish', color: '#94a3b8', icon: '📉' },
  payday: { label: 'Maosh kuni', color: '#f5b83d', icon: '💰' },
  cfday: { label: 'Pul oqimi kuni', color: '#f5b83d', icon: '💸' },
  fast: { label: 'Tezkor yo‘l · biznes', color: '#2bd67b', icon: '🏢' },
  dream: { label: 'Orzu', color: '#c084fc', icon: '⭐' },
  gamble: { label: 'Tavakkal', color: '#22c3e6', icon: '🎲' },
  lawsuit: { label: 'Sud da’vosi', color: '#ff4d61', icon: '⚖️' },
  audit: { label: 'Soliq tekshiruvi', color: '#ff4d61', icon: '🧾' },
  fraud: { label: 'Firibgarlik', color: '#ff4d61', icon: '🕵️' },
};

export const STOCKS = {
  ANOR: { name: 'Anor Tekstil', icon: '🧶', range: [5, 30] },
  QOVN: { name: 'Qovun Agro', icon: '🍈', range: [5, 40] },
  TLPR: { name: 'Tulpor Motors', icon: '🐎', range: [5, 30] },
  CHNR: { name: 'Chinor Soft', icon: '🌳', range: [5, 40] },
  SMRQ: { name: 'Samarqand Media', icon: '📺', range: [5, 25] },
};

const prof = (id, title, icon, salary, [taxes, mortgage, school, car, card, retail, other], perChild, savings, [lMortgage, lSchool, lCar, lCard, lRetail]) => ({
  id,
  title,
  icon,
  salary,
  expenses: { taxes, mortgage, school, car, card, retail, other },
  perChild,
  savings,
  liabilities: { mortgage: lMortgage, school: lSchool, car: lCar, card: lCard, retail: lRetail },
});

export const PROFESSIONS = [
  prof('farrosh', 'Farrosh', '🧹', 1600, [280, 200, 0, 60, 60, 50, 300], 70, 560, [20000, 0, 4000, 2000, 1000]),
  prof('mexanik', 'Avtomexanik', '🔧', 2000, [360, 300, 0, 60, 60, 50, 450], 110, 670, [31000, 0, 3000, 2000, 1000]),
  prof('kotiba', 'Ofis kotibasi', '📋', 2500, [460, 400, 0, 80, 60, 50, 570], 140, 710, [38000, 0, 4000, 2000, 1000]),
  prof('haydovchi', 'Yuk mashinasi haydovchisi', '🚚', 2700, [500, 420, 0, 90, 60, 50, 600], 150, 750, [40000, 0, 4500, 2000, 1000]),
  prof('politsiya', 'Politsiyachi', '👮', 3000, [580, 400, 0, 100, 60, 50, 690], 160, 520, [46000, 0, 5000, 2000, 1000]),
  prof('hamshira', 'Hamshira', '🩺', 3100, [600, 400, 30, 100, 90, 50, 710], 170, 480, [47000, 6000, 5000, 3000, 1000]),
  prof('oqituvchi', 'O‘qituvchi', '📚', 3300, [630, 500, 60, 100, 90, 50, 760], 180, 400, [50000, 12000, 5000, 3000, 1000]),
  prof('menejer', 'Menejer', '💼', 4600, [910, 700, 60, 120, 90, 50, 1000], 240, 400, [75000, 12000, 6000, 3000, 1000]),
  prof('muhandis', 'Muhandis', '⚙️', 4900, [1050, 700, 60, 140, 120, 50, 1090], 250, 400, [75000, 12000, 7000, 4000, 1000]),
  prof('dasturchi', 'Dasturchi', '💻', 5600, [1200, 800, 70, 160, 120, 50, 1250], 280, 600, [90000, 14000, 8000, 4000, 1000]),
  prof('advokat', 'Advokat', '⚖️', 7500, [1830, 1100, 390, 220, 180, 50, 1650], 380, 400, [115000, 78000, 11000, 7000, 1000]),
  prof('uchuvchi', 'Uchuvchi', '✈️', 9500, [2350, 1330, 0, 300, 660, 50, 2210], 480, 400, [143000, 0, 15000, 22000, 1000]),
  prof('shifokor', 'Shifokor', '🥼', 13200, [3420, 1900, 750, 380, 270, 50, 2880], 640, 400, [202000, 150000, 19000, 10000, 1000]),
];

export const EXPENSE_KEYS = ['taxes', 'mortgage', 'school', 'car', 'card', 'retail', 'other'];
export const EXPENSE_LABELS = {
  taxes: 'Soliqlar',
  mortgage: 'Uy ipotekasi to‘lovi',
  school: 'O‘qish krediti to‘lovi',
  car: 'Avtokredit to‘lovi',
  card: 'Kredit karta to‘lovi',
  retail: 'Iste’mol krediti to‘lovi',
  other: 'Boshqa xarajatlar',
};
export const LIABILITY_KEYS = ['mortgage', 'school', 'car', 'card', 'retail'];
export const LIABILITY_LABELS = {
  mortgage: 'Uy ipotekasi',
  school: 'O‘qish krediti',
  car: 'Avtokredit',
  card: 'Kredit karta qarzi',
  retail: 'Iste’mol krediti',
};
export const ASSET_TYPE_LABELS = {
  flat2: '2 xonali kvartira',
  house3: '3 xonali hovli',
  plex: 'Ko‘p xonadonli uy',
  complex: 'Turar-joy majmuasi',
  land: 'Yer uchastkasi',
  business: 'Biznes',
  startup: 'Kichik biznes',
};

// ——— Moliyaviy hisob-kitoblar ———
export const passiveIncome = (p) => p.assets.reduce((sum, a) => sum + (a.kind === 'fast' ? 0 : a.cashflow || 0), 0);
export const loanPayment = (p) => Math.round(p.bankLoan * LOAN_RATE);
export const childExpenses = (p) => p.children * p.perChild;
export const totalExpenses = (p) => EXPENSE_KEYS.reduce((sum, k) => sum + p.expenses[k], 0) + childExpenses(p) + loanPayment(p);
export const totalIncome = (p) => p.salary + passiveIncome(p);
export const monthlyCashflow = (p) => totalIncome(p) - totalExpenses(p);
export const loanCapacity = (p) => Math.max(0, Math.floor(monthlyCashflow(p) / (LOAN_STEP * LOAN_RATE))) * LOAN_STEP;
export const charityAmount = (p) => Math.round(totalIncome(p) * 0.1);
export const roundUpToLoan = (n) => Math.ceil(Math.max(0, n) / LOAN_STEP) * LOAN_STEP;
// Kalamush poygasidan chiqish uchun: passiv daromad > jami xarajatlar
export const canEscape = (p) => p.track === 'rat' && passiveIncome(p) > totalExpenses(p);

export function marketMatches(card, asset) {
  switch (card.kind) {
    case 'sell':
      return asset.type === card.target;
    case 'sellUnit':
      return asset.type === 'plex' || asset.type === 'complex';
    case 'sellTag':
      return asset.tag === card.tag;
    case 'gold':
      return asset.kind === 'gold';
    default:
      return false;
  }
}

export function saleValue(card, asset) {
  if (card.kind === 'sellUnit') return card.price * (asset.units || 1);
  return card.price;
}

const group = (n) => String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
export const money = (n) => `${n < 0 ? '−' : ''}$${group(n)}`;
export const signed = (n) => `${n < 0 ? '−' : '+'}$${group(n)}`;
export const shortMoney = (n) => {
  const a = Math.abs(n);
  const s = a >= 1e6 ? `${+(a / 1e6).toFixed(1)}M` : a >= 1e3 ? `${+(a / 1e3).toFixed(a >= 1e5 ? 0 : 1)}k` : `${a}`;
  return `${n < 0 ? '−' : ''}$${s}`;
};

export const squareOf = (track, pos) => (track === 'fast' ? FAST_BOARD[pos] : { type: RAT_BOARD[pos] });
export const squareLabel = (track, pos) => {
  const sq = squareOf(track, pos);
  if (sq.type === 'business' || sq.type === 'gamble') return sq.title;
  if (sq.type === 'dream') return `Orzu: ${DREAMS.find((d) => d.id === sq.dream)?.title}`;
  return SQUARES[sq.type].label;
};
