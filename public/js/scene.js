// Chegara sahnasi: tungi osmon, Samarqandga o‘xshash siluet, bojxona posti,
// shlagbaum va avtomobil. Hamma narsa SVG/CSS — rasm fayllari yo‘q.

import { reducedMotion } from './fx.js';

let uid = 0;

const BODIES = {
  suv: {
    body: 'M8 64 L8 40 Q8 30 14 24 L22 15 Q25 12 30 12 L138 12 Q146 12 152 17 L172 34 L202 39 Q214 41 214 53 L214 62 Q214 66 209 66 L186 66 A17 17 0 0 0 152 66 L70 66 A17 17 0 0 0 36 66 L13 66 Q8 66 8 64 Z',
    glass: 'M22 34 L28 20 Q30 17 35 17 L134 17 Q140 17 145 21 L161 34 Z',
    pillars: [[84, 17, 5, 17], [122, 17, 4, 17]],
    doors: 'M86 36 L86 62 M124 36 L127 60',
    handles: [[70, 41], [108, 41]],
    roofRail: 'M34 11 L132 11',
    head: 'M202 42 L212 44 L212 50 L204 49 Z',
    tail: 'M8 36 L14 36 L14 46 L8 46 Z',
    mirror: 'M158 30 L166 28 L167 34 L160 35 Z',
    wheelY: 66,
  },
  sedan: {
    body: 'M8 60 L8 48 Q8 41 16 39 L46 35 L74 19 Q79 16 88 16 L132 16 Q141 16 148 22 L166 36 L200 40 Q212 42 212 52 L212 60 Q212 64 207 64 L186 64 A17 17 0 0 0 152 64 L70 64 A17 17 0 0 0 36 64 L14 64 Q8 64 8 60 Z',
    glass: 'M54 36 L77 22 Q81 20 89 20 L130 20 Q137 20 142 25 L156 36 Z',
    pillars: [[104, 20, 5, 16]],
    doors: 'M106 38 L106 60 M66 39 L68 58',
    handles: [[90, 43], [124, 43]],
    roofRail: '',
    head: 'M200 43 L210 45 L210 50 L202 49 Z',
    tail: 'M8 41 L14 40 L14 48 L8 48 Z',
    mirror: 'M152 31 L160 29 L161 35 L154 36 Z',
    wheelY: 64,
  },
};

function wheel(cx, cy) {
  return `
    <g transform="translate(${cx} ${cy})">
      <circle r="14.5" fill="#101217"/>
      <g class="spin">
        <circle r="9.5" fill="#c5cbd5"/>
        <circle r="9.5" fill="none" stroke="#8b93a1" stroke-width="1.2"/>
        <g stroke="#6b7280" stroke-width="2.2" stroke-linecap="round">
          <line x1="0" y1="-8" x2="0" y2="8"/>
          <line x1="-8" y1="0" x2="8" y2="0"/>
          <line x1="-5.7" y1="-5.7" x2="5.7" y2="5.7"/>
          <line x1="-5.7" y1="5.7" x2="5.7" y2="-5.7"/>
        </g>
        <circle r="2.6" fill="#3f4652"/>
      </g>
    </g>`;
}

export function carSvg(bodyType = 'suv', color = '#2d6cd2') {
  const b = BODIES[bodyType] || BODIES.suv;
  const id = `c${++uid}`;
  const safeColor = /^#[0-9a-f]{6}$/i.test(color) ? color : '#2d6cd2';
  return `
<svg class="car" viewBox="0 0 220 84" aria-hidden="true">
  <defs>
    <linearGradient id="${id}-shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".5"/>
      <stop offset=".32" stop-color="#fff" stop-opacity=".08"/>
      <stop offset=".62" stop-color="#000" stop-opacity=".02"/>
      <stop offset="1" stop-color="#000" stop-opacity=".42"/>
    </linearGradient>
    <linearGradient id="${id}-glass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#b8d4ff"/>
      <stop offset=".5" stop-color="#3b5584"/>
      <stop offset="1" stop-color="#16213a"/>
    </linearGradient>
    <linearGradient id="${id}-beam" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff6c8" stop-opacity=".55"/>
      <stop offset="1" stop-color="#fff6c8" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="${id}-shadow">
      <stop offset="0" stop-color="#000" stop-opacity=".55"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <ellipse cx="111" cy="${b.wheelY + 13}" rx="108" ry="6" fill="url(#${id}-shadow)"/>
  <path d="M210 44 L330 26 L330 70 Z" fill="url(#${id}-beam)"/>
  <g class="car-body">
    <path d="${b.body}" fill="${safeColor}"/>
    <path d="${b.body}" fill="url(#${id}-shade)"/>
    <path d="${b.glass}" fill="url(#${id}-glass)"/>
    <path d="${b.glass}" fill="none" stroke="#0d1220" stroke-opacity=".5" stroke-width="1.5"/>
    ${b.pillars.map(([x, y, w, hh]) => `<rect x="${x}" y="${y}" width="${w}" height="${hh}" fill="${safeColor}"/><rect x="${x}" y="${y}" width="${w}" height="${hh}" fill="#000" opacity=".25"/>`).join('')}
    <path d="${b.doors}" stroke="#000" stroke-opacity=".28" stroke-width="1.2" fill="none"/>
    ${b.handles.map(([x, y]) => `<rect x="${x}" y="${y}" width="10" height="2.6" rx="1.3" fill="#000" opacity=".3"/>`).join('')}
    ${b.roofRail ? `<path d="${b.roofRail}" stroke="#1d2230" stroke-width="2.5" stroke-linecap="round"/>` : ''}
    <path d="${b.mirror}" fill="${safeColor}"/><path d="${b.mirror}" fill="#000" opacity=".25"/>
    <path d="${b.head}" fill="#fff8d6"/>
    <path d="${b.tail}" fill="#ff3b4e"/>
    <path d="M16 ${b.wheelY - 6} L206 ${b.wheelY - 6}" stroke="#000" stroke-opacity=".25" stroke-width="2"/>
  </g>
  ${wheel(53, b.wheelY)}
  ${wheel(169, b.wheelY)}
</svg>`;
}

const SKYLINE = `
<svg class="skyline" viewBox="0 0 800 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <path d="M0 92 L60 64 L110 82 L180 46 L250 80 L320 58 L400 86 L470 54 L540 82 L610 48 L690 78 L760 56 L800 72 L800 120 L0 120 Z" fill="#1b2a63" opacity=".55"/>
  <g fill="#111c45">
    <rect x="40" y="96" width="30" height="24"/><rect x="74" y="102" width="22" height="18"/>
    <path d="M150 120 L155 34 L165 34 L170 120 Z"/><rect x="151" y="28" width="18" height="7" rx="2"/>
    <path d="M154 28 Q160 16 166 28 Z"/>
    <rect x="292" y="34" width="9" height="86"/><rect x="290" y="30" width="13" height="6" rx="2"/>
    <rect x="300" y="52" width="72" height="68"/>
    <rect x="371" y="34" width="9" height="86"/><rect x="369" y="30" width="13" height="6" rx="2"/>
    <rect x="384" y="74" width="34" height="46"/>
    <rect x="422" y="34" width="9" height="86"/><rect x="420" y="30" width="13" height="6" rx="2"/>
    <rect x="430" y="52" width="72" height="68"/>
    <rect x="501" y="34" width="9" height="86"/><rect x="499" y="30" width="13" height="6" rx="2"/>
    <rect x="600" y="84" width="44" height="36"/>
    <rect x="690" y="98" width="34" height="22"/><rect x="730" y="104" width="26" height="16"/>
  </g>
  <g fill="#17406a">
    <path d="M381 76 Q381 42 401 38 Q421 42 421 76 Z"/>
    <path d="M598 86 Q598 58 622 54 Q646 58 646 86 Z"/>
    <path d="M232 120 L232 92 Q232 72 248 70 Q264 72 264 92 L264 120 Z"/>
  </g>
  <g fill="#0b1438">
    <path d="M318 120 L318 82 Q336 60 354 82 L354 120 Z"/>
    <path d="M448 120 L448 82 Q466 60 484 82 L484 120 Z"/>
  </g>
  <g fill="#ffd98a" opacity=".55">
    <rect x="46" y="102" width="4" height="5"/><rect x="58" y="102" width="4" height="5"/>
    <rect x="80" y="108" width="4" height="4"/><rect x="612" y="96" width="4" height="6"/>
    <rect x="628" y="96" width="4" height="6"/><rect x="698" y="104" width="4" height="5"/>
  </g>
  <line x1="401" y1="38" x2="401" y2="30" stroke="#17406a" stroke-width="2"/>
</svg>`;

const BOOTH = `
<svg viewBox="0 0 100 100" aria-hidden="true">
  <line x1="90" y1="4" x2="90" y2="99" stroke="#c9d0de" stroke-width="2"/>
  <g class="flag">
    <rect x="91" y="5" width="26" height="5.3" fill="#0099b5"/>
    <rect x="91" y="10.3" width="26" height="0.8" fill="#ce1126"/>
    <rect x="91" y="11.1" width="26" height="4.6" fill="#fff"/>
    <rect x="91" y="15.7" width="26" height="0.8" fill="#ce1126"/>
    <rect x="91" y="16.5" width="26" height="5.3" fill="#1eb53a"/>
    <circle cx="95" cy="7.6" r="1.8" fill="#fff"/><circle cx="95.8" cy="7.6" r="1.6" fill="#0099b5"/>
  </g>
  <rect x="6" y="18" width="72" height="15" rx="3" fill="#0f766e"/>
  <rect x="6" y="18" width="72" height="15" rx="3" fill="none" stroke="#5eead4" stroke-opacity=".5"/>
  <text x="42" y="28.6" text-anchor="middle" font-size="8.6" font-weight="800" fill="#fff" font-family="Unbounded, Manrope, sans-serif" letter-spacing=".6">BOJXONA</text>
  <rect x="4" y="34" width="76" height="8" rx="3" fill="#25356b"/>
  <rect x="9" y="42" width="66" height="57" fill="#dfe5f0"/>
  <rect x="9" y="42" width="66" height="57" fill="url(#boothShade)" opacity=".4"/>
  <rect class="win" x="15" y="50" width="34" height="22" rx="2.5" fill="#ffd98a"/>
  <path d="M15 61 L49 61 M32 50 L32 72" stroke="#c49a4a" stroke-width="1.5"/>
  <rect x="56" y="54" width="13" height="45" rx="1.5" fill="#9aa6bf"/>
  <circle cx="66" cy="77" r="1.2" fill="#3b4258"/>
  <defs>
    <linearGradient id="boothShade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/>
    </linearGradient>
  </defs>
</svg>`;

export function createScene(root) {
  root.innerHTML = `
    <div class="stars"></div>
    <div class="moon"></div>
    ${SKYLINE}
    <div class="road"><div class="lane"></div></div>
    <div class="booth">${BOOTH}<div class="siren"><i></i><i></i></div></div>
    <div class="car-slot gone"></div>
    <div class="barrier"><div class="post"></div><div class="lamp"></div><div class="arm"></div></div>
    <div class="scene-tag"></div>`;
  const slot = root.querySelector('.car-slot');
  const barrier = root.querySelector('.barrier');
  const tag = root.querySelector('.scene-tag');
  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));

  function stopRollingOnEnd() {
    slot.addEventListener(
      'animationend',
      (e) => {
        if (e.target === slot) slot.classList.remove('rolling');
      },
      { once: true },
    );
  }

  return {
    arrive(car) {
      timers.splice(0).forEach(clearTimeout);
      root.classList.remove('alarm');
      barrier.classList.remove('open');
      tag.className = 'scene-tag';
      slot.innerHTML = carSvg(car.body, car.color);
      slot.className = 'car-slot';
      void slot.offsetWidth;
      slot.classList.add('arrive', 'rolling');
      if (reducedMotion()) slot.classList.remove('rolling');
      stopRollingOnEnd();
    },
    pass(text = 'Yo‘l ochiq! ✅') {
      barrier.classList.add('open');
      tag.textContent = text;
      tag.className = 'scene-tag good show';
      later(() => {
        slot.className = 'car-slot depart rolling';
        stopRollingOnEnd();
      }, 350);
    },
    detain(text = 'Tekshiruvga! 🚨') {
      root.classList.add('alarm');
      tag.textContent = text;
      tag.className = 'scene-tag bad show';
      slot.className = 'car-slot detained';
    },
    clear() {
      timers.splice(0).forEach(clearTimeout);
      root.classList.remove('alarm');
      barrier.classList.remove('open');
      tag.className = 'scene-tag';
      slot.className = 'car-slot gone';
      slot.innerHTML = '';
    },
  };
}
