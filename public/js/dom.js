// Kichik DOM yordamchilari. Foydalanuvchi matni har doim textContent orqali qo‘yiladi.

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function h(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'style' && typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) node.style.setProperty(k, v);
    } else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else if (value === true) node.setAttribute(key, '');
    else node.setAttribute(key, value);
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function avatarEl(player, extraClass = '') {
  return h('span', { class: `avatar ${extraClass}`.trim(), style: { '--pc': player.color }, title: player.name }, player.avatar);
}

// Kalit bo‘yicha ro‘yxatni yangilash: yangi elementlar "kirib" keladi, ketganlari "chiqib" ketadi
export function syncList(container, items, keyOf, create, update) {
  const live = () => [...container.children].filter((c) => !c.classList.contains('leaving'));
  const existing = new Map(live().map((c) => [c.dataset.key, c]));
  const seen = new Set();
  items.forEach((item, index) => {
    const key = String(keyOf(item));
    seen.add(key);
    let node = existing.get(key);
    if (!node) {
      node = create(item);
      node.dataset.key = key;
      node.classList.add('entering');
      node.addEventListener('animationend', () => node.classList.remove('entering'), { once: true });
    }
    update?.(node, item);
    const at = live()[index];
    if (at !== node) container.insertBefore(node, at || null);
  });
  for (const [key, node] of existing) {
    if (seen.has(key)) continue;
    node.classList.add('leaving');
    setTimeout(() => node.remove(), 380);
  }
}

export const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
