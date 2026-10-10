// Moliyaviy hisobot: daromadlar, xarajatlar, aktivlar, majburiyatlar va bank

import {
  PROFESSIONS,
  STOCKS,
  EXPENSE_KEYS,
  EXPENSE_LABELS,
  LIABILITY_KEYS,
  LIABILITY_LABELS,
  LOAN_STEP,
  passiveIncome,
  totalIncome,
  totalExpenses,
  monthlyCashflow,
  loanCapacity,
  loanPayment,
  childExpenses,
  money,
  signed,
} from './shared/rules.js';
import { h, avatarEl } from './dom.js';
import { countUp } from './fx.js';
import { dreamOf } from './cards.js';

let loanAmount = LOAN_STEP;
let lastShown = { id: null, cash: null };

const row = (label, value, cls = '') => h('div', { class: `lrow ${cls}`.trim() }, h('dt', {}, label), h('dd', {}, value));

function ledger(title, icon, rows, total) {
  return h(
    'section',
    { class: 'ledger' },
    h('h4', {}, h('span', {}, icon), title),
    h('dl', {}, ...rows.filter(Boolean)),
    total ? h('div', { class: 'ltotal' }, h('span', {}, total[0]), h('b', {}, total[1])) : null,
  );
}

function freedom(p) {
  if (p.track === 'fast') {
    const gained = p.fast.income - p.fast.start;
    const pct = Math.max(0, Math.min(100, Math.round((gained / (p.fast.goal - p.fast.start)) * 100)));
    return h(
      'div',
      { class: 'freedom fast' },
      h('div', { class: 'freedom-top' }, h('span', {}, '🚀 Tezkor yo‘l maqsadi'), h('b', {}, `${pct}%`)),
      h('div', { class: 'meter' }, h('i', { style: { width: `${pct}%` } })),
      h('p', {}, `Oylik daromad ${signed(gained)} oshdi — g‘alaba uchun ${money(p.fast.goal - p.fast.start)}. Yoki orzuingizni sotib oling!`),
    );
  }
  const passive = passiveIncome(p);
  const expenses = totalExpenses(p);
  const pct = Math.max(0, Math.min(100, Math.round((passive / Math.max(1, expenses)) * 100)));
  const need = expenses - passive + 1;
  return h(
    'div',
    { class: 'freedom' },
    h('div', { class: 'freedom-top' }, h('span', {}, '🕊️ Moliyaviy erkinlik'), h('b', {}, `${pct}%`)),
    h('div', { class: 'meter' }, h('i', { style: { width: `${pct}%` } })),
    h(
      'p',
      {},
      `Passiv daromad ${money(passive)} / xarajatlar ${money(expenses)}. `,
      need > 0 ? h('span', {}, 'Chiqish uchun yana ', h('b', {}, money(need)), ' passiv daromad kerak.') : h('b', { class: 'good' }, 'Keyingi navbatda tezkor yo‘lga chiqasiz!'),
    ),
  );
}

function assetLine(a) {
  if (a.kind === 'stock') {
    const avg = a.shares ? Math.round(a.cost / a.shares) : 0;
    return row(h('span', {}, `${a.icon} ${a.symbol} `, h('small', {}, STOCKS[a.symbol]?.name || '')), `${a.shares} ta · o‘rtacha ${money(avg)}`);
  }
  if (a.kind === 'gold') return row(`🪙 Oltin tangalar`, `${a.count} ta · ${money(a.cost)}`);
  if (a.kind === 'bond') return row(`${a.icon} ${a.title}`, `${a.units} ta · ${money(a.cost)}`);
  if (a.kind === 'invest') return row(h('span', {}, `${a.icon} ${a.title} `, h('small', {}, `· ${+(a.rate * 100).toFixed(1)}%/oy`)), money(a.cost));
  if (a.kind === 'fast') return row(h('span', {}, `${a.icon} ${a.title}`, a.risky ? h('small', {}, ' · 🎲 tavakkal') : null), `${signed(a.cashflow)} / oy`, 'good');
  return row(h('span', {}, `${a.icon} ${a.title}`, a.units > 1 ? h('small', {}, ` · ${a.units} xonadon`) : null), money(a.cost));
}

export function renderStatement(container, { player: p, meta, isMe, canAct, onAction, onBack }) {
  const prof = PROFESSIONS.find((x) => x.id === p.profession);
  const dream = dreamOf(p.dream);
  const cf = monthlyCashflow(p);

  const cashEl = h('b', {}, money(p.cash));
  if (lastShown.id === p.id && lastShown.cash !== null && lastShown.cash !== p.cash) {
    countUp(cashEl, lastShown.cash, p.cash, 900, money);
    cashEl.classList.add(p.cash > lastShown.cash ? 'flash-up' : 'flash-down');
  }
  lastShown = { id: p.id, cash: p.cash };

  const head = h(
    'div',
    { class: 'stmt-head' },
    avatarEl(meta),
    h('div', { class: 'stmt-who' }, h('div', { class: 'stmt-name' }, meta.name, isMe ? h('small', {}, 'Siz') : null), h('div', { class: 'stmt-prof' }, `${prof.icon} ${prof.title}`)),
    onBack ? h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: onBack }, '← Mening hisobim') : null,
  );
  const dreamEl = h('div', { class: 'stmt-dream', title: 'Orzu' }, h('span', {}, dream.icon), h('span', {}, dream.title), h('b', {}, money(dream.cost)));

  const kpis =
    p.track === 'fast'
      ? h(
          'div',
          { class: 'kpis' },
          h('div', { class: 'kpi' }, h('span', {}, 'Naqd pul'), cashEl),
          h('div', { class: 'kpi' }, h('span', {}, '«Pullar» kuni'), h('b', { class: 'good' }, signed(p.fast.income))),
          h('div', { class: 'kpi' }, h('span', {}, 'Maqsad'), h('b', {}, money(p.fast.goal))),
        )
      : h(
          'div',
          { class: 'kpis' },
          h('div', { class: 'kpi' }, h('span', {}, 'Naqd pul'), cashEl),
          h('div', { class: 'kpi' }, h('span', {}, 'Oylik pul oqimi'), h('b', { class: cf >= 0 ? 'good' : 'bad' }, signed(cf))),
          h('div', { class: 'kpi' }, h('span', {}, 'Bank qarzi'), h('b', { class: p.bankLoan ? 'bad' : '' }, money(p.bankLoan))),
        );

  const flags = h(
    'div',
    { class: 'stmt-flags' },
    p.children ? h('span', { class: 'flag' }, `👶 ${p.children} farzand`) : null,
    p.charityTurns ? h('span', { class: 'flag good' }, `🤝 2 zar: yana ${p.charityTurns} navbat`) : null,
    p.skipTurns ? h('span', { class: 'flag bad' }, `💤 ${p.skipTurns} navbat tanaffus`) : null,
    p.stats.bankrupt ? h('span', { class: 'flag bad' }, `💥 Bankrotlik: ${p.stats.bankrupt}`) : null,
  );

  const parts = [head, dreamEl, freedom(p), kpis, flags];

  if (p.track === 'fast') {
    const fastAssets = p.assets.filter((a) => a.kind === 'fast');
    parts.push(
      ledger(
        'Tezkor yo‘ldagi bizneslar',
        '🏢',
        fastAssets.length ? fastAssets.map(assetLine) : [h('p', { class: 'empty' }, 'Hali biznes yo‘q — ishonchli yoki tavakkal biznes kataklariga tushganda sotib oling.')],
        ['Oylik daromad', signed(p.fast.income)],
      ),
    );
  } else {
    const incomeAssets = p.assets.filter((a) => a.cashflow);
    parts.push(
      ledger(
        'Daromadlar',
        '💵',
        [
          row('Maosh', money(p.salary)),
          ...incomeAssets.map((a) => row(h('span', { class: 'sub' }, `${a.icon} ${a.title}`), signed(a.cashflow), a.cashflow > 0 ? 'good' : 'bad')),
          row('Passiv daromad', money(passiveIncome(p)), 'strong'),
        ],
        ['Jami daromad', money(totalIncome(p))],
      ),
      ledger(
        'Xarajatlar',
        '🧾',
        [
          ...EXPENSE_KEYS.filter((k) => p.expenses[k]).map((k) => row(EXPENSE_LABELS[k], money(p.expenses[k]))),
          p.children ? row(`Bolalar (${p.children} × ${money(p.perChild)})`, money(childExpenses(p))) : null,
          p.bankLoan ? row('Bank krediti to‘lovi', money(loanPayment(p))) : null,
        ],
        ['Jami xarajatlar', money(totalExpenses(p))],
      ),
    );
    const realAssets = p.assets.filter((a) => a.kind !== 'fast');
    parts.push(ledger('Aktivlar', '🏦', realAssets.length ? realAssets.map(assetLine) : [h('p', { class: 'empty' }, 'Hali aktivlar yo‘q — «Imkoniyat» va «Investor» kataklarida bitimlarni kuting.')]));

    const liabRows = [];
    for (const k of LIABILITY_KEYS) {
      if (!p.liabilities[k]) continue;
      const btn =
        isMe && canAct
          ? h(
              'button',
              {
                class: 'mini-btn',
                type: 'button',
                disabled: p.cash < p.liabilities[k],
                title: p.cash < p.liabilities[k] ? 'Naqd pul yetmaydi' : `Qarzni to‘liq yopish — xarajatlar oyiga ${money(p.expenses[k])} ga kamayadi`,
                onclick: () => onAction({ type: 'payoff', liability: k }),
              },
              'Yopish',
            )
          : null;
      liabRows.push(h('div', { class: 'lrow' }, h('dt', {}, LIABILITY_LABELS[k]), h('dd', {}, money(p.liabilities[k]), btn)));
    }
    for (const a of p.assets) if (a.mortgage) liabRows.push(row(h('span', { class: 'sub' }, `Ipoteka: ${a.title}`), money(a.mortgage)));
    if (p.bankLoan) liabRows.push(row('Bank krediti', money(p.bankLoan), 'strong'));
    parts.push(ledger('Majburiyatlar', '📌', liabRows.length ? liabRows : [h('p', { class: 'empty' }, 'Qarzlar yo‘q — ajoyib!')]));

    if (isMe) {
      const cap = loanCapacity(p);
      const maxRepay = Math.min(p.bankLoan, Math.floor(p.cash / LOAN_STEP) * LOAN_STEP);
      loanAmount = Math.max(LOAN_STEP, loanAmount);
      const amountEl = h('b', { class: 'stepper-val' }, money(loanAmount));
      const set = (v) => {
        loanAmount = Math.max(LOAN_STEP, Math.min(1e6, v));
        amountEl.textContent = money(loanAmount);
        borrowBtn.disabled = !canAct || loanAmount > cap;
        repayBtn.disabled = !canAct || loanAmount > maxRepay;
      };
      const borrowBtn = h('button', { class: 'btn btn-secondary btn-sm', type: 'button', onclick: () => onAction({ type: 'loan', amount: loanAmount }) }, 'Qarz olish');
      const repayBtn = h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: () => onAction({ type: 'repay', amount: loanAmount }) }, 'Qaytarish');
      parts.push(
        h(
          'section',
          { class: 'bank' },
          h('h4', {}, h('span', {}, '🏛️'), 'Bank'),
          h(
            'div',
            { class: 'stepper' },
            h('button', { type: 'button', 'aria-label': 'Kamaytirish', onclick: () => set(loanAmount - LOAN_STEP) }, '−'),
            amountEl,
            h('button', { type: 'button', 'aria-label': 'Oshirish', onclick: () => set(loanAmount + LOAN_STEP) }, '+'),
          ),
          h('div', { class: 'bank-actions' }, borrowBtn, repayBtn),
          h('p', { class: 'bank-hint' }, canAct ? `Har $1 000 uchun oyiga $100. Hozir ko‘pi bilan ${money(cap)} olish mumkin.` : 'Bank faqat o‘z navbatingizda ishlaydi.'),
        ),
      );
      set(loanAmount);
    }
  }

  container.replaceChildren(h('div', { class: 'stmt' }, ...parts));
}
