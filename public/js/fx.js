import { h } from './dom.js';

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function countUp(node, from, to, ms = 900, format = String) {
  cancelAnimationFrame(node._countUp);
  if (reducedMotion() || from === to) {
    node.textContent = format(to);
    return;
  }
  const start = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - start) / ms);
    const eased = 1 - Math.pow(1 - k, 3);
    node.textContent = format(from + (to - from) * eased);
    if (k < 1) node._countUp = requestAnimationFrame(step);
  };
  node._countUp = requestAnimationFrame(step);
}

// FLIP: elementlar yangi joyiga silliq "suzib" o‘tadi
export function flip(container, mutate, duration = 700) {
  const before = new Map([...container.children].map((c) => [c, c.getBoundingClientRect()]));
  mutate();
  if (reducedMotion()) return;
  for (const child of container.children) {
    const first = before.get(child);
    if (!first) continue;
    const last = child.getBoundingClientRect();
    const dx = first.left - last.left;
    const dy = first.top - last.top;
    if (!dx && !dy) continue;
    child.animate(
      [{ transform: `translate(${dx}px, ${dy}px)`, zIndex: 2 }, { transform: 'none', zIndex: 2 }],
      { duration, easing: 'cubic-bezier(.2,.85,.25,1)' },
    );
  }
}

export function floatScore(anchor, text) {
  const r = anchor.getBoundingClientRect();
  const node = h('div', { class: 'float-score', style: { left: `${r.left + r.width / 2}px`, top: `${r.top}px` } }, text);
  document.body.append(node);
  setTimeout(() => node.remove(), 1600);
}

export function floatEmoji(layer, emoji, player) {
  if (layer.childElementCount > 40) layer.firstElementChild.remove();
  const node = h(
    'div',
    { class: 'float-emoji', style: { left: `${8 + Math.random() * 80}%`, '--dx': `${8 + Math.random() * 18}px`, '--pc': player?.color || '#19c2e6' } },
    h('span', { class: 'fe' }, emoji),
    player ? h('span', { class: 'fe-name' }, player.name) : null,
  );
  layer.append(node);
  setTimeout(() => node.remove(), 3100);
}

const CONFETTI_COLORS = ['#19c2e6', '#2bd67b', '#ffcb52', '#ff4d61', '#ffffff', '#b78cff', '#ff7a59'];

export function createConfetti(canvas) {
  const ctx = canvas.getContext('2d');
  let parts = [];
  let raf = 0;
  let dpr = 1;

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  function spawn(x, y, angle, spread, power) {
    const a = angle + (Math.random() - 0.5) * spread;
    const v = power * (0.45 + Math.random() * 0.75);
    parts.push({
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 9,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.35,
      tilt: Math.random() * Math.PI,
      color: CONFETTI_COLORS[(Math.random() * CONFETTI_COLORS.length) | 0],
      round: Math.random() < 0.25,
      life: 0,
      ttl: 170 + Math.random() * 90,
    });
  }

  function loop() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.life++;
      p.vx *= 0.985;
      p.vy = p.vy * 0.985 + 0.2;
      p.x += p.vx + Math.sin(p.life / 12) * 0.4;
      p.y += p.vy;
      p.r += p.vr;
      p.tilt += 0.08;
      const fade = Math.min(1, (p.ttl - p.life) / 40);
      ctx.save();
      ctx.globalAlpha = Math.max(0, fade);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.color;
      if (p.round) {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2.4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, (-p.h / 2) * Math.abs(Math.cos(p.tilt)), p.w, p.h * Math.abs(Math.cos(p.tilt)) + 1);
      }
      ctx.restore();
    }
    parts = parts.filter((p) => p.life < p.ttl && p.y < innerHeight + 60);
    if (parts.length) raf = requestAnimationFrame(loop);
    else {
      raf = 0;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
    }
  }

  function start() {
    if (!raf) raf = requestAnimationFrame(loop);
  }

  return {
    burst({ x = innerWidth / 2, y = innerHeight / 3, count = 140, power = 13 } = {}) {
      if (reducedMotion()) return;
      for (let i = 0; i < count; i++) spawn(x, y, -Math.PI / 2, Math.PI * 1.4, power);
      start();
    },
    cannons() {
      if (reducedMotion()) return;
      for (let i = 0; i < 90; i++) spawn(0, innerHeight * 0.75, -Math.PI / 3, 0.7, 19);
      for (let i = 0; i < 90; i++) spawn(innerWidth, innerHeight * 0.75, (-2 * Math.PI) / 3, 0.7, 19);
      start();
    },
    small(x, y) {
      if (reducedMotion()) return;
      for (let i = 0; i < 40; i++) spawn(x, y, -Math.PI / 2, Math.PI, 9);
      start();
    },
  };
}
