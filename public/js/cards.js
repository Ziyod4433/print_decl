// O‘yin kartalari ko‘rinishi: sarlavha, matn va asosiy raqamlar (narx, oylik daromad, yillik daromadlilik)

import { DECKS, STOCKS, DREAMS, ASSET_TYPE_LABELS, CHARITY_TURNS, DOWNSIZE_TURNS, money, signed } from './shared/rules.js';
import { h } from './dom.js';

const KIND_LABEL = {
  stock: 'Aksiya',
  split: 'Aksiyalar bo‘linishi',
  realestate: 'Ko‘chmas mulk',
  business: 'Biznes',
  land: 'Yer',
  startup: 'Kichik biznes',
  gold: 'Oltin',
  sell: 'Xaridor',
  sellUnit: 'Xaridor',
  sellTag: 'Xaridor',
  boost: 'Yangilik',
  damage: 'Kutilmagan xarajat',
  fastBusiness: 'Yirik biznes',
  dream: 'Orzu',
  gamble: 'Tavakkal',
};

const roi = (cf, down) => (down > 0 ? `${Math.round(((cf * 12) / down) * 100)}%` : '—');

function stat(label, value, cls = '') {
  return h('div', { class: `gstat ${cls}`.trim() }, h('dt', {}, label), h('dd', {}, value));
}

// Har bir karta turi uchun: belgi, sarlavha, matn va raqamlar
function describe(card, ctx) {
  const me = ctx.me;
  switch (card.deck) {
    case 'charity':
      return {
        icon: '🤝',
        title: 'Xayriya qilasizmi?',
        text: `Jami daromadingizning 10 foizini bering — keyingi ${CHARITY_TURNS} navbat davomida 1 yoki 2 ta zar tanlab tashlaysiz.`,
        stats: [stat('Xayriya miqdori', money(card.amount))],
      };
    case 'payday':
      return { icon: '💰', title: 'Maosh kuni!', text: 'Oylik pul oqimingiz hisobingizga tushdi.', stats: [stat('Oylik pul oqimi', signed(card.amount), card.amount >= 0 ? 'good' : 'bad')] };
    case 'cfday':
      return { icon: '💸', title: 'Pul oqimi kuni!', text: 'Bizneslaringizdan tushgan oylik daromad hisobingizda.', stats: [stat('Daromad', signed(card.amount), 'good')] };
    case 'baby':
      return card.full
        ? { icon: '👨‍👩‍👧‍👦', title: 'Katta oila!', text: 'Sizda allaqachon 3 ta farzand bor — xarajatlar o‘zgarmaydi.', stats: [] }
        : {
            icon: '👶',
            title: 'Oilangizga farzand qo‘shildi!',
            text: 'Tabriklaymiz! Endi oylik xarajatlaringiz biroz oshadi.',
            stats: [stat('Qo‘shimcha xarajat', `${signed(card.extra)} / oy`, 'bad'), stat('Farzandlar', String(card.children))],
          };
    case 'downsized':
      return {
        icon: '📉',
        title: 'Ishdan bo‘shatildingiz',
        text: `Kompaniyada qisqartirish. Bir oylik jami xarajatlarni to‘laysiz va ${DOWNSIZE_TURNS} navbat o‘tkazib yuborasiz.`,
        stats: [stat('To‘lov', money(card.amount), 'bad'), stat('Tanaffus', `${DOWNSIZE_TURNS} navbat`)],
      };
    case 'lawsuit':
      return { icon: '⚖️', title: 'Sud da’vosi', text: 'Sobiq hamkor sudga berdi — naqd pulingizning yarmini yo‘qotdingiz.', stats: [stat('Yo‘qotish', money(card.amount), 'bad')] };
    case 'audit':
      return { icon: '🧾', title: 'Soliq tekshiruvi', text: 'Hisob-kitobda xato topildi — naqd pulning yarmi jarimaga ketdi.', stats: [stat('Jarima', money(card.amount), 'bad')] };
    case 'fraud':
      return { icon: '🕵️', title: 'Firibgarlik', text: 'Ishonchli tuyulgan hamkor barcha naqd pulingiz bilan g‘oyib bo‘ldi.', stats: [stat('Yo‘qotish', money(card.amount), 'bad')] };
    case 'doodad': {
      const stats = [];
      if (card.perChild) stats.push(stat('Har bir farzandga', money(card.perChild), 'bad'));
      else stats.push(stat('Narxi', money(card.cost), 'bad'));
      if (card.loan) stats.push(stat('Qarz', money(card.loan.amount)), stat('Oylik to‘lov', `${signed(-card.loan.payment)} / oy`, 'bad'));
      return { icon: card.icon, title: card.title, text: card.text, stats };
    }
  }

  switch (card.kind) {
    case 'stock': {
      const s = STOCKS[card.symbol];
      const own = me?.assets.find((a) => a.kind === 'stock' && a.symbol === card.symbol);
      return {
        icon: s.icon,
        title: card.title,
        text: card.text,
        badge: card.symbol,
        stats: [
          stat('Aksiya narxi', money(card.price), 'big'),
          stat('Savdo oralig‘i', `${money(s.range[0])} – ${money(s.range[1])}`),
          stat('Kompaniya', s.name),
          own ? stat('Sizda', `${own.shares} ta (o‘rtacha ${money(Math.round(own.cost / own.shares))})`) : null,
        ],
      };
    }
    case 'split':
      return { icon: '✂️', title: card.title, text: card.text, badge: card.symbol, stats: [stat('Nisbat', card.ratio >= 1 ? '2 : 1' : '1 : 2')] };
    case 'gold':
      return { icon: '🪙', title: card.title, text: card.text, stats: [stat('Tanga narxi', money(card.price), 'big'), stat('Daromad', 'Faqat sotganda')] };
    case 'realestate':
    case 'business':
    case 'land':
    case 'startup': {
      const stats = [stat('Narxi', money(card.cost)), stat('Boshlang‘ich to‘lov', money(card.down), 'big')];
      if (card.cost > card.down) stats.push(stat('Ipoteka', money(card.cost - card.down)));
      if (card.units > 1) stats.push(stat('Xonadonlar', String(card.units)));
      if (card.kind === 'land') stats.push(stat('Oylik daromad', 'Yo‘q'));
      else stats.push(stat('Oylik pul oqimi', signed(card.cashflow), card.cashflow > 0 ? 'good' : card.cashflow < 0 ? 'bad' : ''));
      if (card.cashflow) stats.push(stat('Yillik daromadlilik', roi(card.cashflow, card.down), card.cashflow > 0 ? 'good' : 'bad'));
      return { icon: card.icon, title: card.title, text: card.text, stats };
    }
    case 'sell':
    case 'sellTag':
      return {
        icon: '🤝',
        title: card.title,
        text: card.text,
        stats: [stat('Taklif narxi', money(card.price), 'big'), card.target ? stat('Kimga kerak', ASSET_TYPE_LABELS[card.target]) : null],
      };
    case 'sellUnit':
      return { icon: '🏘️', title: card.title, text: card.text, stats: [stat('Har bir xonadon', money(card.price), 'big'), stat('Kimga kerak', 'Ko‘p xonadonli uylar')] };
    case 'boost':
      return { icon: '🚀', title: card.title, text: card.text, stats: [stat('Har bir kichik biznesga', `${signed(card.amount)} / oy`, 'good')] };
    case 'damage':
      return { icon: '🔧', title: card.title, text: card.text, stats: [stat('Ta’mir', money(card.cost), 'bad')] };
    case 'fastBusiness':
      return {
        icon: card.icon,
        title: card.title,
        text: 'Yirik biznesga sarmoya kiriting va oylik pul oqimingizni oshiring.',
        stats: [stat('Narxi', money(card.cost), 'big'), stat('Oylik pul oqimi', signed(card.cashflow), 'good'), stat('Yillik daromadlilik', roi(card.cashflow, card.cost), 'good')],
      };
    case 'dream': {
      const owners = ctx.players.filter((p) => p.dream === card.dream).map((p) => `${p.avatar} ${p.name}`);
      return {
        icon: card.icon,
        title: card.title,
        text: card.mine ? 'Bu sizning orzuingiz! Sotib olsangiz — g‘alaba qozonasiz.' : owners.length ? `Bu ${owners.join(', ')}ning orzusi.` : 'Bu orzu hech kimniki emas.',
        stats: [stat('Narxi', money(card.cost), 'big')],
      };
    }
    case 'gamble':
      return {
        icon: card.icon,
        title: card.title,
        text: `${money(card.stake)} tiking va zar tashlang: ${card.need === 6 ? '6' : `${card.need} yoki undan ko‘p`} tushsa — ${money(card.payout)} olasiz.`,
        stats: [stat('Tikish', money(card.stake), 'bad'), stat('Kerakli zar', card.need === 6 ? '6' : `${card.need}+`), stat('Yutuq', money(card.payout), 'good')],
      };
  }
  return { icon: '🃏', title: card.title || 'Karta', text: card.text || '', stats: [] };
}

export function cardEl(card, ctx) {
  const deck = DECKS[card.deck] || DECKS.small;
  const d = describe(card, ctx);
  return h(
    'article',
    { class: `gcard deck-${card.deck}`, style: { '--c': deck.color }, 'data-id': card.id },
    h(
      'header',
      { class: 'gcard-head' },
      h('span', { class: 'gcard-deck' }, `${deck.icon} ${deck.label}`),
      KIND_LABEL[card.kind] ? h('span', { class: 'gcard-kind' }, KIND_LABEL[card.kind]) : null,
    ),
    h(
      'div',
      { class: 'gcard-main' },
      h('div', { class: 'gcard-icon' }, d.icon),
      h('div', {}, d.badge ? h('span', { class: 'gcard-badge' }, d.badge) : null, h('h3', { class: 'gcard-title' }, d.title), h('p', { class: 'gcard-text' }, d.text)),
    ),
    d.stats.filter(Boolean).length ? h('dl', { class: 'gcard-stats' }, ...d.stats.filter(Boolean)) : null,
  );
}

export const dreamOf = (id) => DREAMS.find((d) => d.id === id);
