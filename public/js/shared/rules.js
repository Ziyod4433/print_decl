// «Pul Oqimi» o‘yin qoidalari: server ham, brauzer ham shu faylni ishlatadi,
// shuning uchun hisob-kitoblar hech qachon farq qilmaydi.

export const MAX_PLAYERS = 6;
export const LOAN_STEP = 1000; // bank qarzi $1 000 qadam bilan
export const LOAN_RATE = 0.1; // oyiga 10%
export const MAX_CHILDREN = 3;
export const CHARITY_TURNS = 3;
export const DOWNSIZE_TURNS = 2;
export const INVEST_STEP = 1000; // investorga sarmoya $1 000 qadam bilan
// Tezkor yo‘l stol variantidagi narxlar bilan (dollarda): biznes $100 000 – $1 500 000, orzular $600 000 – $2 800 000.
// Shu sababli kirish daromadi va g‘alaba maqsadi ham 4 barobar katta.
export const FAST_MULT = 400; // tezkor yo‘lda: passiv daromad × 400
export const FAST_GOAL = 200000; // tezkor yo‘lda g‘alaba: oylik pul oqimini +$200 000 ga oshirish
export const RISKY_NEED = 4; // tavakkal biznes: zar 4, 5 yoki 6 bo‘lsa — muvaffaqiyat
export const AUDIT_SHARE = 0.3; // soliq tekshiruvi: naqd pulning 30%
export const ILLEGAL_TURNS = 2; // noqonuniy ish: 2 navbat tanaffus
export const SHARED_WINDOW_MS = 10000; // boshqalar aksiya/mulk sotishga ulgurishi uchun
export const SMALL_DEAL_MAX = 5000;

// ——— Kalamush poygasi (ichki halqa, 24 katak, 4 ta maosh kuni) ———
export const RAT_BOARD = [
  'payday', 'opportunity', 'doodad', 'opportunity', 'stocks', 'investor',
  'payday', 'opportunity', 'charity', 'opportunity', 'market', 'bigDoodad',
  'payday', 'opportunity', 'downsized', 'investor', 'stocks', 'opportunity',
  'payday', 'opportunity', 'doodad', 'baby', 'market', 'opportunity',
];

// Stol variantidagi 15 ta orzu (narxlar dollarda)
export const DREAMS = [
  { id: 'yordam', title: 'Qarovchisi yo‘q insonlarga yordam berish', icon: '🤲', cost: 800000 },
  { id: 'hamkor', title: 'Dunyoning eng yirik kompaniyasi bilan shartnoma tuzish', icon: '🤝', cost: 2000000 },
  { id: 'mehmonxona', title: '5 yulduzli mehmonxona qurish', icon: '🏨', cost: 1700000 },
  { id: 'futbol', title: 'Orzuingizdagi futbol jamoasini tuzish', icon: '⚽', cost: 700000 },
  { id: 'bog', title: 'Surxondaryoda subtropik mevalar bog‘i barpo etish', icon: '🍊', cost: 1000000 },
  { id: 'samolyot', title: 'Shaxsiy samolyot sotib olish', icon: '✈️', cost: 2100000 },
  { id: 'toylar', title: '1000 ta oilaning to‘y marosimini o‘tkazib berish', icon: '💒', cost: 2500000 },
  { id: 'maktab', title: 'Yevropada shaxsiy maktabingizni ochish', icon: '🎓', cost: 1300000 },
  { id: 'parfyum', title: 'Fransuz parfyumeriya kompaniyasi bilan shartnoma', icon: '🌸', cost: 1600000 },
  { id: 'yulduzlar', title: 'Farzandingiz to‘yiga Rossiya va Gollivud yulduzlarini olib kelish', icon: '🎤', cost: 2000000 },
  { id: 'sayohat', title: 'Oila bilan 1 yil dunyo bo‘ylab sayohat', icon: '🌍', cost: 900000 },
  { id: 'kosmos', title: 'Kosmosga parvoz qilish', icon: '🚀', cost: 1200000 },
  { id: 'yaxta', title: 'Yaxta sotib olish', icon: '⛵', cost: 1000000 },
  { id: 'superkar', title: 'Italiya superkarini sotib olish', icon: '🏎️', cost: 600000 },
  { id: 'orol', title: 'Dubaydan orol sotib olish', icon: '🏝️', cost: 2800000 },
];

// ——— Tezkor yo‘l (tashqi halqa): stol variantidagi 52 katak + 4 ta burchakdagi «Pullar» ———
// Ishonchli biznes — kafolatli daromad. Tavakkal biznes — qimmat va daromadi yuqori, lekin
// sotib olgach zar tashlanadi: 4–6 — biznes ishlaydi, 1–3 — sarmoya kuyadi.
const biz = (title, icon, cost, cashflow) => ({ type: 'business', title, icon, cost, cashflow });
const risky = (title, icon, cost, cashflow) => ({ type: 'risky', title, icon, cost, cashflow });
const dream = (id) => ({ type: 'dream', dream: id });
const cf = { type: 'cfday' };
export const FAST_BOARD = [
  { type: 'start' },
  biz('Yoqilg‘i quyish shoxobchasi', '⛽', 320000, 16000),
  cf,
  risky('Katta issiqxonada limon yetishtirish', '🍋', 250000, 30000),
  biz('Kelin ko‘ylaklari, sarpo va go‘zallik saloni', '👰', 600000, 25000),
  dream('kosmos'),
  biz('Golf klubi', '⛳', 800000, 30000),
  risky('Otlar uchun poyga maydoni', '🏇', 250000, 30000),
  biz('Mebel saloni', '🛋️', 120000, 7000),
  dream('sayohat'),
  { type: 'illegal' },
  risky('Parfyumeriya ishlab chiqarish', '🧴', 680000, 70000),
  dream('yulduzlar'),
  cf,
  risky('3D formatda uy qurish texnologiyasi', '🏗️', 150000, 20000),
  biz('Qurilish mollari va uy jihozlari supermarketi', '🧱', 150000, 8000),
  dream('toylar'),
  biz('«Business Compass» konsalting markazi', '🧭', 400000, 20000),
  dream('maktab'),
  risky('Shaxsiy radiostansiya', '📻', 350000, 30000),
  biz('«Avtooyna» avtomobil oynalari zavodi', '🚘', 750000, 32000),
  dream('parfyum'),
  biz('«Sunday» supermarketlar tarmog‘i', '🛒', 630000, 23000),
  dream('bog'),
  biz('Chevrolet avtomobillariga servis tarmog‘i', '🔧', 250000, 10000),
  { type: 'divorce' },
  risky('Chiqindilarni qayta ishlash korxonasi', '♻️', 550000, 40000),
  biz('«Dori-Darmon» dorixonalar tarmog‘i', '💊', 480000, 20000),
  dream('samolyot'),
  biz('Bouling klubi', '🎳', 500000, 23000),
  cf,
  dream('yordam'),
  risky('Zotdor sigirlar fermasi', '🐄', 150000, 30000),
  dream('hamkor'),
  biz('Ko‘p qavatli kiyim-kechak savdo majmuasi', '👗', 720000, 24000),
  dream('mehmonxona'),
  biz('Chevrolet avtosaloni', '🚗', 680000, 30000),
  dream('futbol'),
  { type: 'audit' },
  risky('Ko‘ngilochar istirohat bog‘i', '🎡', 1500000, 140000),
  biz('«Golden House»: ko‘p qavatli zamonaviy uylar', '🏢', 720000, 27000),
  cf,
  biz('600 kishilik to‘yxona', '💒', 550000, 20000),
  risky('Trassa bo‘yida kafe va avtoservis', '☕', 100000, 25000),
  { type: 'bankrot' },
  biz('Reklama agentligi', '📣', 280000, 11000),
  dream('yaxta'),
  biz('Basseyn va saunali fitnes markazi', '🏊', 640000, 22000),
  risky('Fransiyadan parfyumeriya importi', '🌸', 1300000, 120000),
  biz('«Taxi Express»: 100 ta Chevrolet Gentra', '🚕', 700000, 26000),
  dream('superkar'),
  biz('Shaxsiy musiqiy telekanal', '🎵', 450000, 20000),
  risky('Sifatli poyabzal ishlab chiqarish', '👟', 150000, 40000),
  biz('«Pokiza» kimyoviy tozalash tarmog‘i', '🧺', 360000, 18000),
  dream('orol'),
  biz('«Shaxsiy biznes olami» jurnali', '📰', 320000, 13000),
];

export const SQUARES = {
  payday: { label: 'Maosh kuni', short: 'Maosh', icon: '💰', color: '#f5b83d', hint: 'Shu katakdan o‘tganda yoki to‘xtaganda oylik pul oqimingizni olasiz.' },
  opportunity: { label: 'Imkoniyat', short: 'Imkoniyat', icon: '💡', color: '#2bd67b', hint: 'Kichik yoki katta bitim kartasini oling: ko‘chmas mulk, biznes, obligatsiya.' },
  investor: { label: 'Investor', short: 'Investor', icon: '🤵', color: '#14b8a6', hint: 'Biznes sarmoyador izlamoqda: istalgan summani kiriting va undan oylik foiz oling.' },
  stocks: { label: 'Bozor: aksiyalar', short: 'Aksiya', icon: '📊', color: '#22c3e6', hint: 'O‘zbekiston kompaniyalari aksiyalari narxi chiqadi — barcha o‘yinchilar shu narxda sotib olishi va sotishi mumkin.' },
  market: { label: 'Bozor: ko‘chmas mulk', short: 'Mulk bozori', icon: '🏘️', color: '#7aa2ff', hint: 'Xaridorlar mulk va bizneslaringizni sotib olishni taklif qiladi — mos aktivi bor har kim sotishi mumkin.' },
  doodad: { label: 'Kichik xarajat', short: 'Xarajat', icon: '🛍️', color: '#ff5f8a', hint: 'Mayda, lekin tez-tez bo‘ladigan xarajatlar.' },
  bigDoodad: { label: 'Katta xarajat', short: 'Katta xarajat', icon: '💸', color: '#e11d48', hint: 'Kamdan-kam, lekin og‘ir xarajat: to‘y, ta’mir, davolanish.' },
  charity: { label: 'Xayriya', short: 'Xayriya', icon: '🤝', color: '#ff9f43', hint: 'Daromadning 10% ini bering — 3 navbat davomida 2 ta zar tashlaysiz.' },
  baby: { label: 'Farzand', short: 'Farzand', icon: '👶', color: '#7dd3fc', hint: 'Oilada farzand tug‘iladi — xarajatlar oshadi.' },
  downsized: { label: 'Ishsizlik', short: 'Ishsizlik', icon: '📉', color: '#94a3b8', hint: 'Bir oylik xarajatlarni to‘laysiz va 2 navbat o‘tkazib yuborasiz.' },
  start: { label: 'Start', short: 'Start', icon: '🏁', color: '#fbbf24', hint: 'Tezkor yo‘lning boshlanishi.' },
  cfday: { label: 'Pullar', short: 'Pullar', icon: '💰', color: '#3b5bdb', hint: 'Tezkor yo‘ldagi oylik daromadingizni olasiz (o‘tganda ham).' },
  business: { label: 'Ishonchli biznes', short: 'Ishonchli', icon: '🏢', color: '#2bd67b', hint: 'Kafolatli oylik daromad beradigan biznes.' },
  risky: { label: 'Tavakkal biznes', short: 'Tavakkal', icon: '🎲', color: '#8fb3ff', hint: 'Qimmat va daromadi yuqori. Sotib olgach zar tashlanadi: 4–6 — biznes ishlaydi, 1–3 — sarmoya kuyadi.' },
  dream: { label: 'Orzu', short: 'Orzu', icon: '⭐', color: '#c084fc', hint: 'O‘z orzuingizni sotib olsangiz — g‘alaba!' },
  audit: { label: 'Soliq tekshiruvi', short: 'Audit', icon: '🧾', color: '#ff4d61', hint: 'Naqd pulingizning 30% ini yo‘qotasiz.' },
  divorce: { label: 'Ajrashuv', short: 'Ajrashuv', icon: '💔', color: '#ff4d61', hint: 'Mol-mulk bo‘linadi — naqd pulingizning yarmini yo‘qotasiz.' },
  illegal: { label: 'Noqonuniy ish', short: 'Noqonuniy', icon: '🚔', color: '#ff4d61', hint: 'Noqonuniy ish ochildi — 2 navbat o‘tkazib yuborasiz.' },
  bankrot: { label: 'Bankrot', short: 'Bankrot', icon: '💥', color: '#111827', hint: 'Bizneslaringizdan birini (o‘zingiz tanlaysiz) yo‘qotasiz.' },
};

export const DECKS = {
  small: { label: 'Kichik bitim', pile: 'Kichik', color: '#2bd67b', icon: '💡' },
  big: { label: 'Katta bitim', pile: 'Katta', color: '#10b981', icon: '🏢' },
  investor: { label: 'Investor', pile: 'Investor', color: '#14b8a6', icon: '🤵' },
  stocks: { label: 'Bozor: aksiyalar', pile: 'Aksiya', color: '#22c3e6', icon: '📊' },
  market: { label: 'Bozor: ko‘chmas mulk', pile: 'Mulk', color: '#7aa2ff', icon: '🏘️' },
  doodad: { label: 'Kichik xarajat', pile: 'Xarajat', color: '#ff5f8a', icon: '🛍️' },
  bigDoodad: { label: 'Katta xarajat', pile: 'Katta xarajat', color: '#e11d48', icon: '💸' },
  charity: { label: 'Xayriya', color: '#ff9f43', icon: '🤝' },
  baby: { label: 'Farzand', color: '#7dd3fc', icon: '👶' },
  downsized: { label: 'Ishsizlik', color: '#94a3b8', icon: '📉' },
  payday: { label: 'Maosh kuni', color: '#f5b83d', icon: '💰' },
  start: { label: 'Start', color: '#fbbf24', icon: '🏁' },
  cfday: { label: 'Pullar', color: '#f5b83d', icon: '💰' },
  fast: { label: 'Ishonchli biznes', color: '#2bd67b', icon: '🏢' },
  risky: { label: 'Tavakkal biznes', color: '#8fb3ff', icon: '🎲' },
  dream: { label: 'Orzu', color: '#c084fc', icon: '⭐' },
  audit: { label: 'Soliq tekshiruvi', color: '#ff4d61', icon: '🧾' },
  divorce: { label: 'Ajrashuv', color: '#ff4d61', icon: '💔' },
  illegal: { label: 'Noqonuniy ish', color: '#ff4d61', icon: '🚔' },
  bankrot: { label: 'Bankrot', color: '#64748b', icon: '💥' },
};
// Taxta markazidagi kartalar to‘plami
export const PILES = ['small', 'big', 'investor', 'stocks', 'market', 'doodad', 'bigDoodad'];

// O‘zbekistonning haqiqiy kompaniyalari va o‘z brendlarimiz (Buraq Logistics, Moow Motors). Kartalardagi narx va yangiliklar o‘yin uchun o‘ylab topilgan —
// kompaniyalarning haqiqiy aksiya narxi yoki holatini aks ettirmaydi.
export const STOCKS = {
  AKFA: { name: 'Akfa Group', icon: '🪟', range: [1, 30] },
  KRZN: { name: 'Korzinka', icon: '🛒', range: [5, 40] },
  UZAM: { name: 'UzAuto Motors', icon: '🚗', range: [1, 30] },
  UZUM: { name: 'Uzum', icon: '🍇', range: [5, 40] },
  ARTL: { name: 'Artel', icon: '📺', range: [5, 25] },
  UZTL: { name: 'Uzbektelecom', icon: '📡', range: [5, 30] },
  NKMK: { name: 'Navoiy KMK', icon: '⛰️', range: [10, 50] },
  HMKB: { name: 'Hamkorbank', icon: '🏦', range: [5, 35] },
  QZSM: { name: 'Qizilqumsement', icon: '🧱', range: [5, 25] },
  BRAQ: { name: 'Buraq Logistics', icon: '🚚', range: [5, 40] },
  MOOW: { name: 'Moow Motors', icon: '⚙️', range: [5, 40] },
};

// Obligatsiya va fondlar: har bir dona har oy barqaror daromad beradi
export const BONDS = {
  OBL: { name: 'Davlat obligatsiyalari', icon: '📜', income: 10 },
  KORP: { name: 'Korporativ obligatsiyalar', icon: '🏦', income: 6 },
  FOND: { name: 'Investitsiya fondi ulushlari', icon: '📊', income: 2 },
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
  flat1: '1 xonali kvartira',
  flat2: '2 xonali kvartira',
  garage: 'Garaj yoki avtoturargoh joyi',
  shop: 'Do‘kon (tijorat binosi)',
  house3: '3 xonali hovli',
  plex: 'Ko‘p xonadonli uy',
  complex: 'Turar-joy majmuasi',
  land: 'Yer uchastkasi',
  business: 'Biznes',
  startup: 'Kichik biznes',
  invest: 'Investitsiya ulushi',
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
// Investor kartasi: kiritilgan summadan oylik daromad
export const investIncome = (card, amount) => Math.round(amount * card.rate);
// Katta xarajat maoshga bog‘liq bo‘lishi mumkin (salaryPct — maoshning ulushi)
export const doodadCost = (card, p) => (card.perChild ? card.perChild * p.children : card.salaryPct ? Math.round((p.salary * card.salaryPct) / 10) * 10 : card.cost || 0);
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
    case 'sellBond':
      return asset.kind === 'bond' && (!card.symbol || asset.symbol === card.symbol);
    case 'sellInvest':
      return asset.kind === 'invest';
    default:
      return false;
  }
}

export function saleValue(card, asset) {
  if (card.kind === 'sellUnit' || card.kind === 'sellBond') return card.price * (asset.units || 1);
  if (card.kind === 'sellInvest') return Math.round((asset.cost * card.mult) / 100) * 100;
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
  if (sq.type === 'business' || sq.type === 'risky' || sq.type === 'gamble') return sq.title;
  if (sq.type === 'dream') return `Orzu: ${DREAMS.find((d) => d.id === sq.dream)?.title}`;
  return SQUARES[sq.type].label;
};
